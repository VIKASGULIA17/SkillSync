"""
SkillSync API — FastAPI application entry-point.

Sets up CORS, includes all routers, creates DB tables on startup, and
optionally triggers an initial background scrape.
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import SessionLocal, create_tables
from app.routes import auth, jobs, resume, profile, settings as settings_routes, skills, user, admin
from app.services.job_scraper import scrape_and_store_jobs

# ---------------------------------------------------------------------------
# Logging configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Application lifespan hook.

    On startup:
      1. Create database tables (if they don't exist).
      2. Ensure all users have UserProfile records.
      3. Optionally trigger an initial scrape (controlled by SCRAPE_ON_STARTUP).
    """
    logger.info("SkillSync API starting up …")
    create_tables()
    logger.info("Database tables verified.")

    # Ensure all users have UserProfile records
    db = SessionLocal()
    try:
        from app.models import User, UserProfile

        users = db.query(User).all()
        profiles_created = 0
        for user in users:
            if not user.profile:
                profile = UserProfile(
                    user_id=user.id,
                    target_role="",
                    location="",
                    description="New User of SkillSync",
                    github="https://github.com",
                    linkedin="https://linkedin.com",
                    portfolio="https://portfolio.com",
                    match_score=0.0,
                    resume_analysed=0,
                    skill_matrix=[]
                )
                db.add(profile)
                profiles_created += 1

        if profiles_created > 0:
            db.commit()
            logger.info(f"Created UserProfile records for {profiles_created} users.")
        else:
            logger.info("All users already have UserProfile records.")
    except Exception as exc:
        logger.error("UserProfile initialization failed: %s", exc)
        db.rollback()
    finally:
        db.close()

    if settings.SCRAPE_ON_STARTUP:
        # Check whether we already have jobs — only scrape if the DB is empty
        db = SessionLocal()
        try:
            from app.models import Job

            job_count = db.query(Job).count()
            if job_count == 0:
                logger.info("No jobs in database — running initial scrape …")
                scrape_and_store_jobs(db)
            else:
                logger.info(
                    "Database already contains %d jobs — skipping startup scrape.",
                    job_count,
                )
        except Exception as exc:
            logger.error("Startup scrape failed: %s", exc)
        finally:
            db.close()

    yield  # application is running

    logger.info("SkillSync API shutting down.")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="SkillSync API",
    description=(
        "Backend API for SkillSync — resume analysis, skill-gap detection, "
        "AI feedback, and job listing aggregation."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(jobs.router)
app.include_router(skills.router)
app.include_router(profile.router)
app.include_router(settings_routes.router)
app.include_router(user.router)
app.include_router(admin.router)


# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler so unhandled exceptions return JSON, not HTML 500."""
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": str(exc),
        },
    )


# ---------------------------------------------------------------------------
# Root health-check
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
def root() -> dict:
    """Root endpoint — basic health check."""
    return {
        "message": "SkillSync API",
        "version": "1.0.0",
        "health-check":"Ok ! working perfectly"
    }
