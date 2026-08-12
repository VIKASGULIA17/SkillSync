"""
Job listing routes.

GET  /api/jobs         — paginated, filterable job list
POST /api/jobs/refresh — trigger background re-scrape
GET  /api/jobs/status  — latest scrape status
"""

import logging
import math

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import func as sa_func
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db, SessionLocal

from app.models import Job, ScrapeStatus

from app.schema import JobListResponse, JobResponse, ScrapeStatusResponse

from app.services.job_scraper import scrape_and_store_jobs

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Jobs"])


# ---------------------------------------------------------------------------
# GET /api/jobs
# ---------------------------------------------------------------------------
@router.get("/jobs", response_model=dict)
async def list_jobs(
    category: Optional[str] = Query(None, description="Filter by job category"),
    experience: Optional[str] = Query(None, description="Filter by experience level"),
    search: Optional[str] = Query(None, description="Search in title and company"),
    platform: Optional[str] = Query(None, description="Filter by platform"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> dict:
    """Return a paginated, optionally filtered list of scraped jobs with stats."""
    query = db.query(Job)

    # --- Filters ----------------------------------------------------------
    if category:
        query = query.filter(Job.category.ilike(f"%{category}%"))
    if experience:
        query = query.filter(Job.experience.ilike(f"%{experience}%"))
    if platform:
        query = query.filter(Job.platform.ilike(f"%{platform}%"))
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Job.title.ilike(search_term)) | (Job.company.ilike(search_term))
        )

    # --- Count & paginate -------------------------------------------------
    total: int = query.count()
    total_pages: int = max(1, math.ceil(total / per_page))

    jobs = (
        query
        .order_by(Job.scraped_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    # Calculate real stats from database
    categories_count = db.query(sa_func.count(sa_func.distinct(Job.category))).scalar() or 0
    companies_count = db.query(sa_func.count(sa_func.distinct(Job.company))).scalar() or 0

    return {
        "jobs": [JobResponse.model_validate(j) for j in jobs],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
        "categories_count": categories_count,
        "companies_count": companies_count,
    }


# ---------------------------------------------------------------------------
# POST /api/jobs/refresh — trigger background scrape
# ---------------------------------------------------------------------------

def _background_scrape() -> None:
    """Run the scraper in a background thread with its own DB session."""
    db = SessionLocal()
    try:
        scrape_and_store_jobs(db)
    except Exception as exc:
        logger.exception("Background scrape failed: %s", exc)
    finally:
        db.close()


@router.post("/jobs/refresh")
async def refresh_jobs(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> dict:
    """
    Trigger a background re-scrape of job listings from all platforms.

    Returns immediately with a confirmation; the actual scraping happens
    in the background.
    """
    # Prevent multiple concurrent scrapes
    running = (
        db.query(ScrapeStatus)
        .filter(ScrapeStatus.status == "running")
        .first()
    )
    if running:
        raise HTTPException(
            status_code=409,
            detail="A scraping job is already running. Please wait for it to complete.",
        )

    background_tasks.add_task(_background_scrape)
    return {"status": "scraping_started"}


# ---------------------------------------------------------------------------
# GET /api/jobs/status — latest scrape status
# ---------------------------------------------------------------------------
@router.get("/jobs/status", response_model=ScrapeStatusResponse)
async def scrape_status(db: Session = Depends(get_db)) -> ScrapeStatusResponse:
    """Return the latest scrape-run status."""
    latest = (
        db.query(ScrapeStatus)
        .order_by(ScrapeStatus.id.desc())
        .first()
    )

    if not latest:
        return ScrapeStatusResponse(
            last_updated=None,
            job_count=0,
            status="never_run",
            is_running=False,
        )

    return ScrapeStatusResponse(
        last_updated=latest.completed_at or latest.started_at,
        job_count=latest.job_count,
        status=latest.status,
        is_running=latest.status == "running",
    )
