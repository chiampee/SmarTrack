"""
Utility functions for the SmarTrack backend
"""

from .mongodb_utils import (
    validate_object_id,
    normalize_document,
    normalize_documents,
    build_user_filter,
    build_pagination_query
)
from .validation import (
    validate_url,
    sanitize_string,
    validate_title,
    validate_description,
    validate_tags
)
from .errors import (
    NotFoundError,
    ValidationError,
    DuplicateError,
    handle_db_errors
)

__all__ = [
    # MongoDB utilities
    'validate_object_id',
    'normalize_document',
    'normalize_documents',
    'build_user_filter',
    'build_pagination_query',
    # Validation utilities
    'validate_url',
    'sanitize_string',
    'validate_title',
    'validate_description',
    'validate_tags',
    # Error handling
    'NotFoundError',
    'ValidationError',
    'DuplicateError',
    'handle_db_errors',
]

