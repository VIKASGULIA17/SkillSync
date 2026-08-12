"""
User-specific routes for SkillSync.

GET    /api/user/history               — Get user's analysis history
POST   /api/user/history               — Save analysis result to history
GET    /api/user/stats                 — Get user statistics

GET    /api/user/applications          — Get all tracked applications
POST   /api/user/applications          — Add new application
PATCH  /api/user/applications/{id}     — Update application
DELETE /api/user/applications/{id}     — Remove application

GET    /api/user/saved-jobs            — Get saved jobs
POST   /api/user/saved-jobs            — Save a job
DELETE /api/user/saved-jobs/{id}       — Unsave a job
"""

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import User, AnalysisHistory, JobApplication, SavedJob, Job
from app.schema import (
    AnalysisHistoryResponse,
    AnalysisHistoryCreate,
    JobApplicationResponse,
    JobApplicationCreate,
    JobApplicationUpdate,
    SavedJobResponse,
    SavedJobCreate,
)
from app.routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/user", tags=["User"])


# ===========================================================================
# Analysis History Endpoints
# ===========================================================================

@router.get("/history", response_model=List[AnalysisHistoryResponse])
async def get_analysis_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[AnalysisHistoryResponse]:
    """Get user's resume analysis history."""
    try:
        history = (
            db.query(AnalysisHistory)
            .filter(AnalysisHistory.user_id == current_user.id)
            .order_by(AnalysisHistory.date.desc())
            .all()
        )
        return [AnalysisHistoryResponse.model_validate(h) for h in history]
    except Exception as exc:
        logger.exception("Failed to fetch analysis history")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch history: {exc}",
        )


@router.post("/history", response_model=AnalysisHistoryResponse)
async def save_analysis_to_history(
    body: AnalysisHistoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnalysisHistoryResponse:
    """Save an analysis result to the user's history."""
    try:
        from app.models import UserProfile

        new_entry = AnalysisHistory(
            user_id=current_user.id,
            role=body.role,
            score=body.score,
            matched_skills=body.matched_skills,
            missing_skills=body.missing_skills,
            resume_filename=body.resume_filename,
        )
        db.add(new_entry)

        # Update UserProfile stats
        user_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        if user_profile:
            # Update match_score to the latest score
            user_profile.match_score = body.score

            # Increment resume_analysed count
            user_profile.resume_analysed = (user_profile.resume_analysed or 0) + 1

        db.commit()
        db.refresh(new_entry)

        return AnalysisHistoryResponse.model_validate(new_entry)
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to save analysis to history")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save history: {exc}",
        )


@router.get("/stats")
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Get user statistics (analysis count, avg score, etc.)."""
    try:
        history_count = (
            db.query(func.count(AnalysisHistory.id))
            .filter(AnalysisHistory.user_id == current_user.id)
            .scalar()
        ) or 0

        avg_score = (
            db.query(func.avg(AnalysisHistory.score))
            .filter(AnalysisHistory.user_id == current_user.id)
            .scalar()
        ) or 0.0

        saved_jobs_count = (
            db.query(func.count(SavedJob.id))
            .filter(SavedJob.user_id == current_user.id)
            .scalar()
        ) or 0

        applications_count = (
            db.query(func.count(JobApplication.id))
            .filter(JobApplication.user_id == current_user.id)
            .scalar()
        ) or 0

        return {
            "history_count": history_count,
            "avg_score": round(avg_score, 2),
            "saved_jobs_count": saved_jobs_count,
            "applications_count": applications_count,
        }
    except Exception as exc:
        logger.exception("Failed to fetch user stats")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch stats: {exc}",
        )


# ===========================================================================
# Job Applications (Tracker) Endpoints
# ===========================================================================

@router.get("/applications", response_model=List[JobApplicationResponse])
async def get_job_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[JobApplicationResponse]:
    """Get all of the user's tracked job applications."""
    try:
        applications = (
            db.query(JobApplication)
            .filter(JobApplication.user_id == current_user.id)
            .order_by(JobApplication.date_updated.desc())
            .all()
        )
        return [JobApplicationResponse.model_validate(app) for app in applications]
    except Exception as exc:
        logger.exception("Failed to fetch job applications")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch applications: {exc}",
        )


@router.post("/applications", response_model=JobApplicationResponse)
async def create_job_application(
    body: JobApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> JobApplicationResponse:
    """Add a new job application to the tracker."""
    try:
        new_app = JobApplication(
            user_id=current_user.id,
            title=body.title,
            company=body.company,
            location=body.location or "",
            salary=body.salary or "",
            link=body.link or "",
            platform=body.platform or "Manual Input",
            status=body.status or "wishlist",
        )
        db.add(new_app)
        db.commit()
        db.refresh(new_app)

        return JobApplicationResponse.model_validate(new_app)
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to create job application")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create application: {exc}",
        )


@router.patch("/applications/{app_id}", response_model=JobApplicationResponse)
async def update_job_application(
    app_id: int,
    body: JobApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> JobApplicationResponse:
    """Update a job application (e.g., change status, edit details)."""
    try:
        app = (
            db.query(JobApplication)
            .filter(
                JobApplication.id == app_id,
                JobApplication.user_id == current_user.id,
            )
            .first()
        )

        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found",
            )

        updates = body.model_dump(exclude_unset=True)
        for field, value in updates.items():
            setattr(app, field, value)

        db.commit()
        db.refresh(app)

        return JobApplicationResponse.model_validate(app)
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to update job application")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update application: {exc}",
        )


@router.delete("/applications/{app_id}")
async def delete_job_application(
    app_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Remove a job application from the tracker."""
    try:
        app = (
            db.query(JobApplication)
            .filter(
                JobApplication.id == app_id,
                JobApplication.user_id == current_user.id,
            )
            .first()
        )

        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found",
            )

        db.delete(app)
        db.commit()

        return {"status": "deleted", "id": app_id}
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to delete job application")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete application: {exc}",
        )


# ===========================================================================
# Saved Jobs Endpoints
# ===========================================================================

@router.get("/saved-jobs", response_model=List[SavedJobResponse])
async def get_saved_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[SavedJobResponse]:
    """Get all jobs saved/bookmarked by the user."""
    try:
        from sqlalchemy.orm import joinedload

        saved = (
            db.query(SavedJob)
            .options(joinedload(SavedJob.job))  # Eagerly load the job relationship
            .filter(SavedJob.user_id == current_user.id)
            .order_by(SavedJob.saved_at.desc())
            .all()
        )
        return [SavedJobResponse.model_validate(s) for s in saved]
    except Exception as exc:
        logger.exception("Failed to fetch saved jobs")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch saved jobs: {exc}",
        )


@router.post("/saved-jobs", response_model=SavedJobResponse)
async def save_job(
    body: SavedJobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SavedJobResponse:
    """Save/bookmark a job."""
    try:
        from sqlalchemy.orm import joinedload

        # Check if job exists
        job = db.query(Job).filter(Job.id == body.job_id).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

        # Check if already saved
        existing = (
            db.query(SavedJob)
            .filter(
                SavedJob.user_id == current_user.id,
                SavedJob.job_id == body.job_id,
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job already saved",
            )

        new_saved = SavedJob(
            user_id=current_user.id,
            job_id=body.job_id,
        )
        db.add(new_saved)
        db.commit()
        db.refresh(new_saved)

        # Eagerly load the job relationship before returning
        db.refresh(new_saved)
        saved_with_job = (
            db.query(SavedJob)
            .options(joinedload(SavedJob.job))
            .filter(SavedJob.id == new_saved.id)
            .first()
        )

        return SavedJobResponse.model_validate(saved_with_job)
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to save job")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save job: {exc}",
        )


@router.delete("/saved-jobs/{saved_id}")
async def unsave_job(
    saved_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Remove a job from saved/bookmarked jobs."""
    try:
        saved = (
            db.query(SavedJob)
            .filter(
                SavedJob.id == saved_id,
                SavedJob.user_id == current_user.id,
            )
            .first()
        )

        if not saved:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved job not found",
            )

        db.delete(saved)
        db.commit()

        return {"status": "unsaved", "id": saved_id}
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to unsave job")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unsave job: {exc}",
        )
