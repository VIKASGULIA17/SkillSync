"""
SQLAlchemy ORM models and Pydantic request / response schemas for SkillSync.
"""

from datetime import datetime
from typing import List, Optional


from sqlalchemy import Column, DateTime, Integer, String, Text ,Float,JSON,ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base 

# SQLAlchemy ORM models

class Job(Base):  # type: ignore[misc]
    """Represents a scraped job listing."""

    __tablename__ = "jobs"

    id: int = Column(Integer, primary_key=True, index=True, autoincrement=True)
    platform: str = Column(String(50), nullable=False)
    title: str = Column(String(255), nullable=False)
    company: str = Column(String(255), nullable=False, default="")
    location: str = Column(String(255), nullable=False, default="Not specified")
    category: str = Column(String(100), nullable=False, default="Information Technology")
    salary: str = Column(String(255), nullable=False, default="Not disclosed")
    experience: str = Column(String(100), nullable=False, default="Fresher")
    link: str = Column(Text, nullable=False, default="")
    scraped_at: datetime = Column(DateTime, server_default=func.now(), nullable=False)
    

class ScrapeStatus(Base):  # type: ignore[misc]
    """Tracks the status of each scraping run."""

    __tablename__ = "scrape_status"

    id: int = Column(Integer, primary_key=True, index=True, autoincrement=True)
    started_at: datetime = Column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at: Optional[datetime] = Column(DateTime, nullable=True)
    job_count: int = Column(Integer, nullable=False, default=0)
    status: str = Column(String(20), nullable=False, default="running")  # running | completed | failed
    error_message: Optional[str] = Column(Text, nullable=True)

class UserProfile(Base):
    """Represents the profile info of a user"""

    __tablename__="user_profile"

    id: int = Column(Integer,primary_key=True,index=True,autoincrement=True)
    user_id :int =Column(Integer,ForeignKey("users.id"),nullable=False,unique=True)
    target_role :str =Column(String(255),nullable=True,default="")
    location :str =Column(String(500),nullable=True,default="")
    description :str = Column(Text,nullable=True,default="New User of SkillSync")
    github : str = Column(String(255),nullable=True,default="https://github.com")
    linkedin: str=Column(String(255),nullable=True,default="https://linkedin.com")
    portfolio: str=Column(String(255),nullable=True,default="https://portfolio.com")
    match_score: float = Column(Float,nullable=True,default=0)
    resume_analysed: int =Column(Integer,nullable=True,default=0)
    skill_matrix: list = Column(JSON,default=list)
    user = relationship(
    "User",
    back_populates="profile"
    )


# User Authentication Models & Schemas

class User(Base):  # type: ignore[misc]
    """Represents a registered user in the system."""

    __tablename__ = "users"

    id: int = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email: str = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password: str = Column(String(255), nullable=False)
    full_name: str = Column(String(255), nullable=False, default="")
    created_at: datetime = Column(DateTime, server_default=func.now(), nullable=False)
    role: str = Column(String(20), nullable=False, default="user")

    profile = relationship(
    "UserProfile",
    back_populates="user",
    uselist=False
)
    analysis_history = relationship("AnalysisHistory", back_populates="user")
    job_applications = relationship("JobApplication", back_populates="user")
    saved_jobs = relationship("SavedJob", back_populates="user")


class AnalysisHistory(Base):  # type: ignore[misc]
    """Tracks user's resume analysis history for progress tracking."""

    __tablename__ = "analysis_history"

    id: int = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: int = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date: datetime = Column(DateTime, server_default=func.now(), nullable=False)
    role: str = Column(String(255), nullable=False)
    score: float = Column(Float, nullable=False)
    matched_skills: list = Column(JSON, default=list)
    missing_skills: list = Column(JSON, default=list)
    resume_filename: str = Column(String(255), nullable=True)

    user = relationship("User", back_populates="analysis_history")


class JobApplication(Base):  # type: ignore[misc]
    """Tracks user's job applications for Kanban board."""

    __tablename__ = "job_applications"

    id: int = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: int = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title: str = Column(String(255), nullable=False)
    company: str = Column(String(255), nullable=False)
    location: str = Column(String(255), nullable=True, default="")
    salary: str = Column(String(255), nullable=True, default="")
    link: str = Column(Text, nullable=True, default="")
    platform: str = Column(String(100), nullable=True, default="Manual Input")
    status: str = Column(String(50), nullable=False, default="wishlist")  # wishlist, applied, interviewing, offered, rejected
    date_added: datetime = Column(DateTime, server_default=func.now(), nullable=False)
    date_updated: datetime = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="job_applications")


class SavedJob(Base):  # type: ignore[misc]
    """Tracks user's saved/bookmarked jobs."""

    __tablename__ = "saved_jobs"

    id: int = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: int = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_id: int = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    saved_at: datetime = Column(DateTime, server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="saved_jobs")
    job = relationship("Job")
