"""
Admin-only routes for SkillSync.

GET    /api/admin/stats                — Dashboard statistics
GET    /api/admin/users                — List all users
GET    /api/admin/users/{id}           — Get user details
PATCH  /api/admin/users/{id}/role      — Update user role
DELETE /api/admin/users/{id}           — Delete user

POST   /api/admin/jobs                 — Create job manually
PUT    /api/admin/jobs/{id}            — Update job
DELETE /api/admin/jobs/{id}            — Delete job

GET    /api/admin/scraper/logs         — Get scraper history
"""

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import User, Job, UserProfile, ScrapeStatus
from app.schema import (
    AdminStatsResponse,
    AdminJobCreate,
    AdminJobUpdate,
    AdminUserRoleUpdate,
    JobResponse,
    UserResponse,
)
from app.routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ===========================================================================
# Admin Authorization Dependency
# ===========================================================================

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Ensure the current user is an admin."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


# ===========================================================================
# Admin Statistics
# ===========================================================================

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminStatsResponse:
    """Get dashboard statistics for admin panel."""
    try:
        total_jobs = db.query(func.count(Job.id)).scalar() or 0
        total_users = db.query(func.count(User.id)).filter(User.role == "user").scalar() or 0
        total_admins = db.query(func.count(User.id)).filter(User.role == "admin").scalar() or 0

        avg_match_score = (
            db.query(func.avg(UserProfile.match_score))
            .scalar()
        ) or 0.0

        latest_scrape = (
            db.query(ScrapeStatus)
            .order_by(ScrapeStatus.id.desc())
            .first()
        )

        scraper_status = latest_scrape.status if latest_scrape else "never_run"

        return AdminStatsResponse(
            total_jobs=total_jobs,
            total_users=total_users,
            total_admins=total_admins,
            avg_match_score=round(avg_match_score, 2),
            scraper_status=scraper_status,
        )
    except Exception as exc:
        logger.exception("Failed to fetch admin stats")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch stats: {exc}",
        )


# ===========================================================================
# User Management
# ===========================================================================

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> List[UserResponse]:
    """Get all users (admin view)."""
    try:
        users = db.query(User).all()
        return [UserResponse.model_validate(u) for u in users]
    except Exception as exc:
        logger.exception("Failed to list users")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list users: {exc}",
        )


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_details(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Get detailed information about a specific user."""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return UserResponse.model_validate(user)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to fetch user details")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user: {exc}",
        )


@router.patch("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: int,
    body: AdminUserRoleUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Update a user's role (admin/user)."""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        if body.role not in ("user", "admin"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be 'user' or 'admin'",
            )

        user.role = body.role
        db.commit()
        db.refresh(user)

        return UserResponse.model_validate(user)
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to update user role")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update role: {exc}",
        )


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Delete a user account."""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # Prevent self-deletion
        if user.id == admin.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account",
            )

        db.delete(user)
        db.commit()

        return {"status": "deleted", "id": user_id}
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to delete user")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {exc}",
        )


# ===========================================================================
# Job Management
# ===========================================================================

@router.post("/jobs", response_model=JobResponse)
async def create_job(
    body: AdminJobCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> JobResponse:
    """Manually create a job listing."""
    try:
        new_job = Job(
            platform=body.platform,
            title=body.title,
            company=body.company,
            location=body.location,
            category=body.category,
            salary=body.salary,
            experience=body.experience,
            link=body.link,
        )
        db.add(new_job)
        db.commit()
        db.refresh(new_job)

        return JobResponse.model_validate(new_job)
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to create job")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create job: {exc}",
        )


@router.put("/jobs/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: int,
    body: AdminJobUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> JobResponse:
    """Update a job listing."""
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

        updates = body.model_dump(exclude_unset=True)
        for field, value in updates.items():
            setattr(job, field, value)

        db.commit()
        db.refresh(job)

        return JobResponse.model_validate(job)
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to update job")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update job: {exc}",
        )


@router.delete("/jobs/{job_id}")
async def delete_job(
    job_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Delete a job listing."""
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

        db.delete(job)
        db.commit()

        return {"status": "deleted", "id": job_id}
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to delete job")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete job: {exc}",
        )


# ===========================================================================
# Scraper Logs
# ===========================================================================

@router.get("/scraper/logs")
async def get_scraper_logs(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> List[dict]:
    """Get scraper run history."""
    try:
        logs = (
            db.query(ScrapeStatus)
            .order_by(ScrapeStatus.id.desc())
            .limit(50)
            .all()
        )

        return [
            {
                "id": log.id,
                "started_at": log.started_at,
                "completed_at": log.completed_at,
                "job_count": log.job_count,
                "status": log.status,
                "error_message": log.error_message,
            }
            for log in logs
        ]
    except Exception as exc:
        logger.exception("Failed to fetch scraper logs")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch logs: {exc}",
        )
