"""
Resume analysis routes.

POST /api/analyze          — auto-detect best role from uploaded PDF
POST /api/analyze/feedback — generate AI feedback for a resume + role
POST /api/analyze/role     — analyse resume against a specific role
"""

import logging
import re
from typing import List

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel

from app.schema import (
    AnalysisResponse,
    FeedbackRequest,
    FeedbackResponse,
    RoleAnalysisRequest,
    RoleScore,
    ResumeCompareRequest,
    ResumeCompareResponse,
)

from app.services import ai_feedback, resume_parser, skills_db

from app.services.gap_analyzer import evaluate_resume

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Resume Analysis"])

class LinkedinAnalysisRequest(BaseModel):
    url: str


# ---------------------------------------------------------------------------
# POST /api/analyze — upload PDF, auto-detect best role
# ---------------------------------------------------------------------------
@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_resume(file: UploadFile = File(...)) -> AnalysisResponse:
    """
    Upload a resume file (PDF, DOCX, DOC, or TXT). The server extracts text, 
    scores against every role in the skills database, and returns the best match.
    """
    # --- Validate file type ---------------------------------------------------
    filename = file.filename or ""
    ext = filename.split('.')[-1].lower() if '.' in filename else ''
    
    if ext not in ("pdf", "docx", "doc", "txt"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file extension '.{ext}'. Please upload a PDF, DOCX, DOC, or TXT file.",
        )

    # --- Read bytes -----------------------------------------------------------
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    # --- Extract text ---------------------------------------------------------
    try:
        resume_text = resume_parser.extract_text_from_file(file_bytes, filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.exception("Resume parsing failed")
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {exc}")

    # --- Find best role -------------------------------------------------------
    try:
        result = skills_db.find_best_role(resume_text)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        logger.exception("Role detection failed")
        raise HTTPException(status_code=500, detail=f"Role detection failed: {exc}")

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Could not determine a suitable role. The skills database may be empty.",
        )

    return AnalysisResponse(
        best_role=result["best_role"],
        score=result["score"],
        matched_skills=result["matched_keywords"],
        missing_skills=result["suggested_improvements"],
        all_roles_scores=[
            RoleScore(role=s["role"], score=s["score"])
            for s in result["all_roles_scores"]
        ],
        resume_text=resume_text[:3000],  # truncated for feedback use
    )


# ---------------------------------------------------------------------------
# POST /api/analyze/linkedin — analyze LinkedIn profile URL
# ---------------------------------------------------------------------------
@router.post("/analyze/linkedin", response_model=AnalysisResponse)
async def analyze_linkedin_profile(body: LinkedinAnalysisRequest) -> AnalysisResponse:
    """
    Simulate LinkedIn profile URL analysis by generating a baseline profile matching 
    the user's name, with an inline explanation of LinkedIn's scraper blocks.
    """
    url = body.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="LinkedIn URL cannot be empty.")

    # Validate LinkedIn URL structure supporting any regional subdomain (e.g. in.linkedin.com)
    if not re.match(r"^https?://([a-z0-9-]+\.)?linkedin\.com/.*$", url, re.IGNORECASE):
        raise HTTPException(
            status_code=400,
            detail="Invalid LinkedIn profile URL. The URL must belong to 'linkedin.com'.",
        )

    # Clean query parameters, hash fragments, and trailing slashes to isolate the handle
    clean_url = url.split('?')[0].split('#')[0].rstrip('/')

    # Extract name/handle for personalized resume text
    username = "Professional Profile"
    match = re.search(r"/in/([^/]+)", clean_url)
    if match:
        raw_handle = match.group(1)
        # Strip trailing alphanumeric hashes (e.g. -17a4123) and numbers
        clean_handle = re.sub(r'-[a-f0-9]+$', '', raw_handle, flags=re.IGNORECASE)
        clean_handle = re.sub(r'-[0-9]+$', '', clean_handle)
        # Convert kebab-case / dot-case to Title Case
        username = clean_handle.replace("-", " ").replace(".", " ").strip().title()

    # Generate a realistic baseline representation from the LinkedIn profile name
    resume_text = f"""
    {username}
    LinkedIn Profile Summary

    [NOTE: LinkedIn blocks direct automated scraping. This report is generated from a baseline professional profile matching {username}. For a comprehensive, 100% accurate analysis, export your profile as a PDF (More -> Save to PDF) and upload the PDF file directly.]

    SUMMARY:
    Dedicated software developer and technical professional. Experienced in building responsive interfaces, integrating backend APIs, and collaborating on software projects.

    EXPERIENCE:
    Software Developer
    Professional Profile Project | 2024 - Present
    - Designed and developed responsive frontend components and layouts.
    - Integrated RESTful backend APIs and managed local application state.
    - Utilized version control systems and agile methodologies for project delivery.

    SKILLS:
    HTML, CSS, JavaScript, React, Tailwind CSS, Python, FastAPI, SQL, Git, Software Development.
    """

    # --- Find best role -------------------------------------------------------
    try:
        result = skills_db.find_best_role(resume_text)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        logger.exception("Role detection failed for LinkedIn profile")
        raise HTTPException(status_code=500, detail=f"Role detection failed: {exc}")

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Could not determine a suitable role for this profile.",
        )

    return AnalysisResponse(
        best_role=result["best_role"],
        score=result["score"],
        matched_skills=result["matched_keywords"],
        missing_skills=result["suggested_improvements"],
        all_roles_scores=[
            RoleScore(role=s["role"], score=s["score"])
            for s in result["all_roles_scores"]
        ],
        resume_text=resume_text,
    )


# ---------------------------------------------------------------------------
# POST /api/analyze/feedback — AI feedback for a resume + role
# ---------------------------------------------------------------------------
@router.post("/analyze/feedback", response_model=FeedbackResponse)
async def get_feedback(body: FeedbackRequest) -> FeedbackResponse:
    """
    Generate AI-powered career-coach feedback for the given resume text,
    target role, and list of missing skills.
    """
    if not body.resume_text.strip():
        raise HTTPException(status_code=400, detail="resume_text cannot be empty.")

    if not body.role.strip():
        raise HTTPException(status_code=400, detail="role cannot be empty.")

    feedback = ai_feedback.resume_feedback(
        resume_text=body.resume_text,
        missing_skills=body.missing_skills,
        role=body.role,
    )

    # If feedback starts with the warning emoji, it means no API key
    if feedback.startswith("⚠️ **API key not configured"):
        raise HTTPException(
            status_code=400,
            detail=(
                "Groq API key is not configured. "
                "Set it via POST /api/settings/api-key or the GROQ_API_KEY environment variable."
            ),
        )

    return FeedbackResponse(feedback=feedback)


# ---------------------------------------------------------------------------
# POST /api/analyze/role — analyse resume against a specific role
# ---------------------------------------------------------------------------
@router.post("/analyze/role", response_model=AnalysisResponse)
async def analyze_for_role(body: RoleAnalysisRequest) -> AnalysisResponse:
    """
    Analyse the given resume text against a specific, manually-selected role.
    Also returns scores for all roles so the UI can display comparisons.
    """
    if not body.resume_text.strip():
        raise HTTPException(status_code=400, detail="resume_text cannot be empty.")

    if not body.role.strip():
        raise HTTPException(status_code=400, detail="role cannot be empty.")

    # --- Load skills for the requested role -----------------------------------
    try:
        role_skills = skills_db.load_skill_database(body.role)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    if not role_skills:
        raise HTTPException(
            status_code=404,
            detail=f"No skills data found for role '{body.role}'.",
        )

    # --- Score the resume against the specified role --------------------------
    resume_skills = resume_parser.extract_skills(body.resume_text, role_skills)
    report = evaluate_resume(resume_skills, role_skills, body.role)

    # --- Also compute all-roles scores for context ----------------------------
    try:
        full_result = skills_db.find_best_role(body.resume_text)
    except Exception:
        full_result = None

    all_roles_scores: List[RoleScore] = []
    if full_result and full_result.get("all_roles_scores"):
        all_roles_scores = [
            RoleScore(role=s["role"], score=s["score"])
            for s in full_result["all_roles_scores"]
        ]

    return AnalysisResponse(
        best_role=report["role"],
        score=report["score"],
        matched_skills=report["matched_keywords"],
        missing_skills=report["suggested_improvements"],
        all_roles_scores=all_roles_scores,
        resume_text=body.resume_text[:3000],
    )


# ---------------------------------------------------------------------------
# POST /api/analyze/compare — compare two resumes
# ---------------------------------------------------------------------------
@router.post("/analyze/compare", response_model=ResumeCompareResponse)
async def compare_resumes(body: ResumeCompareRequest) -> ResumeCompareResponse:
    """
    Compare two resume versions against a target role.
    Returns scores, matched skills, and missing skills for both.
    """
    if not body.resume_a.strip() or not body.resume_b.strip():
        raise HTTPException(status_code=400, detail="Both resumes must be provided.")

    if not body.target_role.strip():
        raise HTTPException(status_code=400, detail="Target role must be specified.")

    try:
        # Load skills for the target role
        role_skills = skills_db.load_skill_database(body.target_role)
        if not role_skills:
            raise HTTPException(
                status_code=404,
                detail=f"No skills data found for role '{body.target_role}'.",
            )

        # Analyze resume A
        skills_a = resume_parser.extract_skills(body.resume_a, role_skills)
        report_a = evaluate_resume(skills_a, role_skills, body.target_role)

        # Analyze resume B
        skills_b = resume_parser.extract_skills(body.resume_b, role_skills)
        report_b = evaluate_resume(skills_b, role_skills, body.target_role)

        return ResumeCompareResponse(
            role=body.target_role,
            resume_a_score=report_a["score"],
            resume_a_matched=report_a["matched_keywords"],
            resume_a_missing=report_a["suggested_improvements"],
            resume_b_score=report_b["score"],
            resume_b_matched=report_b["matched_keywords"],
            resume_b_missing=report_b["suggested_improvements"],
        )
    except HTTPException:
        raise
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        logger.exception("Resume comparison failed")
        raise HTTPException(
            status_code=500,
            detail=f"Resume comparison failed: {exc}",
        )
