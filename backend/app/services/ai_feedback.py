"""
AI-powered resume feedback via Groq / LangChain.

Generates structured career-coach advice using the configured LLM.
"""

import logging
from typing import List, Optional

from app.config import get_api_key

logger = logging.getLogger(__name__)


def resume_feedback(
    resume_text: str,
    missing_skills: List[str],
    role: str,
) -> str:
    """
    Generate AI career-coach feedback for a resume.

    Args:
        resume_text: Full (or truncated) resume text.
        missing_skills: Skills the resume is lacking for the target role.
        role: The target job role.

    Returns:
        Markdown-formatted feedback string.
    """
    api_key: Optional[str] = get_api_key()

    if not api_key:
        return (
            " **API key not configured.**\n\n"
            "Please set your Groq API key via the Settings page or the "
            "`GROQ_API_KEY` environment variable to enable AI feedback."
        )

    try:
        from langchain_groq import ChatGroq
    except ImportError:
        return (
            " **langchain-groq is not installed.**\n\n"
            "Install it with `pip install langchain-groq` to enable AI feedback."
        )

    try:
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            max_retries=2,
            api_key=api_key,
        )

        # Structured career-coach prompt (inspired by the improved Home.py version)
        missing_str = ", ".join(missing_skills) if missing_skills else "None identified"
        prompt = (
            "You are a helpful career coach. "
            "Analyze the following resume content and suggest improvements.\n\n"
            f"**Resume Content:**\n{resume_text[:3000]}\n\n"
            f"**Target Role:** {role}\n"
            f"**Missing Skills:** {missing_str}\n\n"
            "Please provide:\n"
            "1. A brief overall assessment of the resume for this role.\n"
            "2. Key skills the candidate should acquire, with recommended "
            "free/paid resources (courses, tutorials, certifications).\n"
            "3. Suggestions for improving the resume's structure and wording.\n"
            "4. Any additional tips for standing out as a candidate.\n\n"
            "Format the output clearly with Markdown headings and bullet points."
        )

        response = llm.invoke(prompt)

        # langchain response objects expose `.content` on AIMessage
        feedback_text: str = (
            response.content if hasattr(response, "content") else str(response)
        )
        return feedback_text.strip()

    except Exception as exc:
        logger.exception("AI feedback generation failed")
        return (
            f" **AI Feedback unavailable.**\n\n"
            f"An error occurred while generating feedback: `{exc}`\n\n"
            f"Please verify your API key is valid and try again."
        )
