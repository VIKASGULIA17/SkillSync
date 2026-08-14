"""Pydantic request / response schemas for SkillSync."""

from pydantic import BaseModel, ConfigDict, Field ,AnyUrl , EmailStr

from datetime import datetime
from typing import List,Optional
# ============================================================================
# Pydantic schemas – Responses
# ============================================================================


# for job scraping and analysis endpoints
class JobResponse(BaseModel):
    """Schema for a single job returned by the API."""

    id: int
    platform: str
    title: str
    company: str
    location: str
    category: str
    salary: str
    experience: str
    link: AnyUrl
    scraped_at: datetime

    model_config = ConfigDict(from_attributes=True)


class JobListResponse(BaseModel):
    """Paginated list of jobs."""

    jobs: List[JobResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class RoleScore(BaseModel):
    """Score for a single role during resume analysis."""

    role: str
    score: float


class AnalysisResponse(BaseModel):
    """Result of resume analysis (auto-detect or specific role)."""

    best_role: str
    score: float
    matched_skills: List[str]
    missing_skills: List[str]
    all_roles_scores: List[RoleScore]
    resume_text: str = Field(
        default="",
        description="Truncated resume text for downstream feedback calls",
    )



# Pydantic schemas – Requests


class FeedbackRequest(BaseModel):
    """Payload for requesting AI-generated feedback on a resume."""

    resume_text: str
    role: str
    missing_skills: List[str] = Field(default_factory=list)


class FeedbackResponse(BaseModel):
    """AI-generated feedback in Markdown."""

    feedback: str


class RoleAnalysisRequest(BaseModel):
    """Request to analyse a resume against a specific role."""

    resume_text: str
    role: str


class ApiKeyRequest(BaseModel):
    """Payload for setting / validating the Groq API key."""

    api_key: str


class ApiKeyStatusResponse(BaseModel):
    """Indicates whether an API key is configured."""

    configured: bool


class ScrapeStatusResponse(BaseModel):
    """Latest scrape status summary."""

    last_updated: Optional[datetime] = None
    job_count: int = 0
    status: str = "unknown"
    is_running: bool = False

    model_config = ConfigDict(from_attributes=True)



# for user creation and authentication endpoints

class UserCreate(BaseModel):
    """Schema for creating a new user account."""

    email: str
    password: str
    full_name: str


class UserLogin(BaseModel):
    """Schema for user credentials at login."""

    email: str
    password: str


class UserResponse(BaseModel):
    """User profile response."""

    id: int
    email: str
    full_name: str
    created_at: datetime
    role:str

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """Response containing JWT access token and user info."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse



# ==========================
# user profile schemas

class ProfileResponse(BaseModel):
    """Response containing complete user profile details."""

    user_id: int
    full_name: str
    email: EmailStr

    target_role: str
    location: str
    description: str

    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None

    match_score: float
    resume_analysed: int
    skill_matrix: List[str]

    model_config = ConfigDict(from_attributes=True)


class ProfileInfoChange(BaseModel):
    """Request to update basic profile information."""

    full_name: Optional[str] = None
    target_role: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None

    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None


class ProfileSkillsMatrixChange(BaseModel):
    """Request to replace the user's skill matrix."""

    skill_matrix: List[str]

    model_config = ConfigDict(from_attributes=True)


# ==========================
# Analysis History schemas

class AnalysisHistoryResponse(BaseModel):
    """Single analysis history entry."""

    id: int
    user_id: int
    date: datetime
    role: str
    score: float
    matched_skills: List[str]
    missing_skills: List[str]
    resume_filename: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AnalysisHistoryCreate(BaseModel):
    """Request to save analysis to history."""

    role: str
    score: float
    matched_skills: List[str]
    missing_skills: List[str]
    resume_filename: Optional[str] = None


# ==========================
# Job Application (Tracker) schemas

class JobApplicationResponse(BaseModel):
    """Single job application entry."""

    id: int
    user_id: int
    title: str
    company: str
    location: str
    salary: str
    link: str
    platform: str
    status: str
    date_added: datetime
    date_updated: datetime

    model_config = ConfigDict(from_attributes=True)


class JobApplicationCreate(BaseModel):
    """Request to create a new job application."""

    title: str
    company: str
    location: Optional[str] = ""
    salary: Optional[str] = ""
    link: Optional[str] = ""
    platform: Optional[str] = "Manual Input"
    status: Optional[str] = "wishlist"


class JobApplicationUpdate(BaseModel):
    """Request to update a job application."""

    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    link: Optional[str] = None
    platform: Optional[str] = None
    status: Optional[str] = None


# ==========================
# Saved Jobs schemas

class SavedJobResponse(BaseModel):
    """Saved job with full job details."""

    id: int
    user_id: int
    job_id: int
    saved_at: datetime
    job: JobResponse

    model_config = ConfigDict(from_attributes=True)


class SavedJobCreate(BaseModel):
    """Request to save a job."""

    job_id: int


# ==========================
# Admin schemas

class AdminStatsResponse(BaseModel):
    """Admin dashboard statistics."""

    total_jobs: int
    total_users: int
    total_admins: int
    avg_match_score: float
    scraper_status: str


class AdminJobCreate(BaseModel):
    """Admin request to create a job manually."""

    platform: str
    title: str
    company: str
    location: str
    category: str
    salary: str
    experience: str
    link: str


class AdminJobUpdate(BaseModel):
    """Admin request to update a job."""

    platform: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    salary: Optional[str] = None
    experience: Optional[str] = None
    link: Optional[str] = None


class AdminUserRoleUpdate(BaseModel):
    """Admin request to update user role."""

    role: str


class ResumeCompareRequest(BaseModel):
    """Request to compare two resumes."""

    resume_a: str
    resume_b: str
    target_role: str


class ResumeCompareResponse(BaseModel):
    """Result of comparing two resumes."""

    role: str
    resume_a_score: float
    resume_a_matched: List[str]
    resume_a_missing: List[str]
    resume_b_score: float
    resume_b_matched: List[str]
    resume_b_missing: List[str]



