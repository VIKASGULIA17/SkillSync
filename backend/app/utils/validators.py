"""
Common validation utilities for SkillSync.

Follows DRY principle by centralizing validation logic.
"""

import re
from typing import Optional
from fastapi import HTTPException, status


def validate_email(email: str) -> str:
    """
    Validate and normalize email address.

    Args:
        email: Email address to validate

    Returns:
        Normalized email (lowercase, stripped)

    Raises:
        HTTPException: If email is invalid
    """
    email = email.strip().lower()
    if not email or "@" not in email or len(email) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address.",
        )
    return email


def validate_password(password: str, min_length: int = 6) -> None:
    """
    Validate password strength.

    Args:
        password: Password to validate
        min_length: Minimum password length (default: 6)

    Raises:
        HTTPException: If password doesn't meet requirements
    """
    if len(password) < min_length:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password must be at least {min_length} characters long.",
        )


def validate_non_empty(value: str, field_name: str) -> str:
    """
    Validate that a string field is not empty.

    Args:
        value: Value to validate
        field_name: Name of the field (for error messages)

    Returns:
        Stripped value

    Raises:
        HTTPException: If value is empty
    """
    value = value.strip()
    if not value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} cannot be empty.",
        )
    return value


def validate_url(url: str, field_name: str = "URL") -> Optional[str]:
    """
    Validate URL format.

    Args:
        url: URL to validate
        field_name: Name of the field (for error messages)

    Returns:
        Validated URL or None if empty

    Raises:
        HTTPException: If URL format is invalid
    """
    if not url or not url.strip():
        return None

    url = url.strip()
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)

    if not url_pattern.match(url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} must be a valid URL starting with http:// or https://",
        )
    return url


def validate_role(role: str) -> None:
    """
    Validate user role.

    Args:
        role: Role to validate

    Raises:
        HTTPException: If role is invalid
    """
    if role not in ("user", "admin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'user' or 'admin'.",
        )


def validate_status(status_value: str, allowed_statuses: list[str]) -> None:
    """
    Validate status against allowed values.

    Args:
        status_value: Status to validate
        allowed_statuses: List of allowed status values

    Raises:
        HTTPException: If status is invalid
    """
    if status_value not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Status must be one of: {', '.join(allowed_statuses)}",
        )
