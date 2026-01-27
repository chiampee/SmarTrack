"""
Input validation utility functions
"""

from typing import List, Optional
from urllib.parse import urlparse
from fastapi import HTTPException
import re


def validate_url(url: str, field_name: str = "URL") -> str:
    """
    Validates URL format and prevents path traversal attacks

    Args:
        url: URL string to validate
        field_name: Name of the field for error messages

    Returns:
        Validated URL string

    Raises:
        HTTPException: If URL format is invalid
    """
    if not url or not isinstance(url, str):
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} is required and must be a string"
        )

    url = url.strip()

    if not url:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} cannot be empty"
        )

    # SECURITY: Prevent path traversal in URLs
    if '..' in url:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field_name.lower()}: contains path traversal sequence '..'"
        )

    # SECURITY: Prevent null bytes
    if '\0' in url:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field_name.lower()}: contains null byte"
        )

    try:
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid {field_name.lower()} format: '{url}' is not a valid URL"
            )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field_name.lower()} format: {str(e)}"
        )

    return url


def sanitize_string(value: str, max_length: Optional[int] = None, field_name: str = "Field", reject_mongodb_operators: bool = False) -> str:
    """
    Sanitizes and validates a string value

    Args:
        value: String to sanitize
        max_length: Optional maximum length
        field_name: Name of the field for error messages
        reject_mongodb_operators: If True, reject MongoDB operator characters ($, {, }, [, ])

    Returns:
        Sanitized string

    Raises:
        HTTPException: If validation fails
    """
    if value is None:
        return ""

    if not isinstance(value, str):
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} must be a string"
        )

    sanitized = value.strip()

    # SECURITY: Reject MongoDB operators if requested (prevents NoSQL injection)
    if reject_mongodb_operators:
        dangerous_chars = ['$', '{', '}', '[', ']']
        for char in dangerous_chars:
            if char in sanitized:
                raise HTTPException(
                    status_code=400,
                    detail=f"{field_name} contains invalid character: '{char}'"
                )

    if max_length and len(sanitized) > max_length:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} is too long (max {max_length} characters)"
        )

    return sanitized


def validate_title(title: str, max_length: int = 500, allow_empty: bool = False) -> str:
    """
    Validates and sanitizes a title field

    Args:
        title: Title string to validate
        max_length: Maximum allowed length
        allow_empty: Whether empty titles are allowed

    Returns:
        Validated and sanitized title

    Raises:
        HTTPException: If validation fails
    """
    if not title or not title.strip():
        if allow_empty:
            return ""
        raise HTTPException(
            status_code=400,
            detail="Title cannot be empty"
        )

    return sanitize_string(title, max_length=max_length, field_name="Title")


def validate_description(description: Optional[str], max_length: int = 5000) -> Optional[str]:
    """
    Validates and sanitizes a description field

    Args:
        description: Description string to validate (can be None)
        max_length: Maximum allowed length

    Returns:
        Validated and sanitized description (or None)

    Raises:
        HTTPException: If validation fails
    """
    if description is None:
        return None

    if not isinstance(description, str):
        raise HTTPException(
            status_code=400,
            detail="Description must be a string"
        )

    sanitized = description.strip()

    if not sanitized:
        return None

    return sanitize_string(sanitized, max_length=max_length, field_name="Description")


def validate_tags(tags: Optional[List[str]], max_count: int = 50, max_tag_length: int = 50) -> List[str]:
    """
    Validates and sanitizes a list of tags

    Args:
        tags: List of tag strings to validate
        max_count: Maximum number of tags allowed
        max_tag_length: Maximum length per tag

    Returns:
        Validated and sanitized list of tags

    Raises:
        HTTPException: If validation fails
    """
    if tags is None:
        return []

    if not isinstance(tags, list):
        raise HTTPException(
            status_code=400,
            detail="Tags must be a list"
        )

    if len(tags) > max_count:
        raise HTTPException(
            status_code=400,
            detail=f"Too many tags (max {max_count} tags allowed)"
        )

    validated_tags = []
    seen_tags = set()

    for tag in tags:
        if not isinstance(tag, str):
            raise HTTPException(
                status_code=400,
                detail="All tags must be strings"
            )

        sanitized_tag = tag.strip().lower()

        if not sanitized_tag:
            continue  # Skip empty tags

        if len(sanitized_tag) > max_tag_length:
            raise HTTPException(
                status_code=400,
                detail=f"Tag '{tag}' is too long (max {max_tag_length} characters)"
            )

        # Prevent duplicates
        if sanitized_tag not in seen_tags:
            validated_tags.append(sanitized_tag)
            seen_tags.add(sanitized_tag)

    return validated_tags


def validate_collection_name(name: str, max_length: int = 50) -> str:
    """
    Validates and sanitizes a collection name

    Args:
        name: Collection name to validate
        max_length: Maximum allowed length

    Returns:
        Validated and sanitized collection name

    Raises:
        HTTPException: If validation fails
    """
    if not name or not name.strip():
        raise HTTPException(
            status_code=400,
            detail="Collection name is required"
        )

    return sanitize_string(name, max_length=max_length, field_name="Collection name")


def validate_category_name(name: str, max_length: int = 50) -> str:
    """
    Validates and sanitizes a category name

    Args:
        name: Category name to validate
        max_length: Maximum allowed length

    Returns:
        Validated and sanitized category name (lowercase)

    Raises:
        HTTPException: If validation fails
    """
    if not name or not name.strip():
        raise HTTPException(
            status_code=400,
            detail="Category name is required"
        )

    sanitized = sanitize_string(name, max_length=max_length, field_name="Category name")
    return sanitized.lower()  # Normalize to lowercase
