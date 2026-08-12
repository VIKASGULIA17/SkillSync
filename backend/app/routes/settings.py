"""
Settings routes.

POST /api/settings/api-key        — set and validate a Groq API key
GET  /api/settings/api-key/status — check whether an API key is configured
"""

import logging

from fastapi import APIRouter, HTTPException

from app.config import get_api_key, set_runtime_api_key
from app.schema import ApiKeyRequest, ApiKeyStatusResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Settings"])


@router.post("/settings/api-key")
async def set_api_key(body: ApiKeyRequest) -> dict:
    """
    Validate a Groq API key by making a short test call.

    If valid the key is stored in runtime config (survives until server
    restart).  Returns ``{valid: true/false, message: ...}``.
    """
    key = body.api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="api_key cannot be empty.")

    # --- Validate by making a lightweight Groq call ---------------------------
    try:
        from langchain_groq import ChatGroq

        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0,
            max_retries=1,
            api_key=key,
        )
        response = llm.invoke("Say 'ok' in one word.")
        # If we get here the key is valid
        content = response.content if hasattr(response, "content") else str(response)
        logger.info("API key validated successfully (response: %s)", content[:50])

    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="langchain-groq is not installed. Cannot validate the API key.",
        )
    except Exception as exc:
        logger.warning("API key validation failed: %s", exc)
        return {
            "valid": False,
            "message": f"Invalid API key: {exc}",
        }

    # Key is valid — store it
    set_runtime_api_key(key)

    return {
        "valid": True,
        "message": "API key configured successfully.",
    }


@router.get("/settings/api-key/status", response_model=ApiKeyStatusResponse)
async def api_key_status() -> ApiKeyStatusResponse:
    """Check whether a Groq API key is currently available."""
    configured = get_api_key() is not None and len(get_api_key() or "") > 0  # type: ignore[arg-type]
    return ApiKeyStatusResponse(configured=configured)
