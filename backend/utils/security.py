"""
Security utility functions for input sanitization and validation
Prevents NoSQL injection, path traversal, and other security vulnerabilities
"""

from typing import Dict, Any
from fastapi import HTTPException
import re


def sanitize_user_id(user_id: str) -> str:
    """
    Sanitize user_id to prevent NoSQL injection attacks.
    
    Rejects any user_id containing MongoDB operators or special characters
    that could be exploited in queries.
    
    Args:
        user_id: User ID string to sanitize
        
    Returns:
        Sanitized user_id string
        
    Raises:
        HTTPException: If user_id contains dangerous characters
    """
    if not isinstance(user_id, str):
        raise HTTPException(
            status_code=400,
            detail="user_id must be a string"
        )
    
    user_id = user_id.strip()
    
    if not user_id:
        raise HTTPException(
            status_code=400,
            detail="user_id cannot be empty"
        )
    
    # CRITICAL: Reject MongoDB operators that could be exploited
    # These characters can modify query behavior if not properly escaped
    dangerous_chars = ['$', '{', '}', '[', ']']
    for char in dangerous_chars:
        if char in user_id:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid user_id format: contains MongoDB operator character '{char}'"
            )
    
    # Validate format: should be alphanumeric with safe separators
    # Auth0 format: provider|id (e.g., "google-oauth2|123456")
    # Allow: alphanumeric, pipe (|), dash (-), underscore (_), @, dot (.)
    if not all(c.isalnum() or c in '|_-@.' for c in user_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid user_id format: contains invalid characters"
        )
    
    # Reasonable length limit
    if len(user_id) > 200:
        raise HTTPException(
            status_code=400,
            detail="user_id too long (max 200 characters)"
        )
    
    return user_id


def sanitize_mongodb_query(query: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize a MongoDB query dictionary to prevent NoSQL injection.
    
    This function recursively checks all string values in the query
    for MongoDB operators and rejects them.
    
    Args:
        query: MongoDB query dictionary
        
    Returns:
        Sanitized query dictionary
        
    Raises:
        HTTPException: If query contains dangerous operators
    """
    if not isinstance(query, dict):
        raise HTTPException(
            status_code=400,
            detail="Query must be a dictionary"
        )
    
    sanitized = {}
    
    for key, value in query.items():
        # Check if key itself is a MongoDB operator (should not be user input)
        if key.startswith('$') and key not in ['$exists', '$ne', '$gt', '$lt', '$gte', '$lte', '$in', '$nin', '$regex']:
            # Only allow known safe operators, reject others
            raise HTTPException(
                status_code=400,
                detail=f"Invalid MongoDB operator in query key: '{key}'"
            )
        
        # Recursively sanitize nested dictionaries
        if isinstance(value, dict):
            sanitized[key] = sanitize_mongodb_query(value)
        # Sanitize string values
        elif isinstance(value, str):
            # Check for MongoDB operators in string values
            dangerous_chars = ['$', '{', '}', '[', ']']
            for char in dangerous_chars:
                if char in value:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid query value: contains MongoDB operator character '{char}'"
                    )
            sanitized[key] = value
        # Lists: sanitize each element
        elif isinstance(value, list):
            sanitized_list = []
            for item in value:
                if isinstance(item, dict):
                    sanitized_list.append(sanitize_mongodb_query(item))
                elif isinstance(item, str):
                    dangerous_chars = ['$', '{', '}', '[', ']']
                    for char in dangerous_chars:
                        if char in item:
                            raise HTTPException(
                                status_code=400,
                                detail=f"Invalid list item: contains MongoDB operator character '{char}'"
                            )
                    sanitized_list.append(item)
                else:
                    sanitized_list.append(item)
            sanitized[key] = sanitized_list
        else:
            # Other types (int, bool, None, etc.) are safe
            sanitized[key] = value
    
    return sanitized


def validate_path_traversal(path: str) -> str:
    """
    Validate a file path to prevent path traversal attacks.
    
    Args:
        path: Path string to validate
        
    Returns:
        Validated path string
        
    Raises:
        HTTPException: If path contains traversal sequences
    """
    if not isinstance(path, str):
        raise HTTPException(
            status_code=400,
            detail="Path must be a string"
        )
    
    # Check for path traversal sequences
    if '..' in path:
        raise HTTPException(
            status_code=400,
            detail="Invalid path: contains path traversal sequence '..'"
        )
    
    # Check for absolute paths (if relative paths are required)
    if path.startswith('/') or (len(path) > 1 and path[1] == ':'):
        raise HTTPException(
            status_code=400,
            detail="Invalid path: absolute paths not allowed"
        )
    
    # Check for null bytes
    if '\0' in path:
        raise HTTPException(
            status_code=400,
            detail="Invalid path: contains null byte"
        )
    
    return path


def sanitize_string_for_mongodb(value: str, field_name: str = "Field") -> str:
    """
    Sanitize a string value that will be used in MongoDB queries.
    
    This is a convenience function that combines string validation
    with MongoDB operator rejection.
    
    Args:
        value: String value to sanitize
        field_name: Name of the field for error messages
        
    Returns:
        Sanitized string
        
    Raises:
        HTTPException: If value contains dangerous characters
    """
    if not isinstance(value, str):
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} must be a string"
        )
    
    value = value.strip()
    
    # Reject MongoDB operators
    dangerous_chars = ['$', '{', '}', '[', ']']
    for char in dangerous_chars:
        if char in value:
            raise HTTPException(
                status_code=400,
                detail=f"{field_name} contains invalid character: '{char}'"
            )
    
    return value
