"""
Enhanced request validation utilities
Additional validation beyond basic type checking
"""

from typing import Optional, List
import re
from datetime import datetime
from utils.api_errors import APIError


class RequestValidator:
    """Additional validation rules for API requests"""
    
    # Common patterns
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    URL_PATTERN = re.compile(r'^https?://[^\s]+$')
    SLUG_PATTERN = re.compile(r'^[a-z0-9-]+$')
    
    @staticmethod
    def validate_pagination(page: int, limit: int, max_limit: int = 100) -> None:
        """Validate pagination parameters"""
        if page < 1:
            raise APIError.bad_request("Page must be >= 1", field="page")
        if limit < 1:
            raise APIError.bad_request("Limit must be >= 1", field="limit")
        if limit > max_limit:
            raise APIError.bad_request(
                f"Limit cannot exceed {max_limit}",
                field="limit",
                hint=f"Use pagination to fetch data in chunks of {max_limit} or less"
            )
    
    @staticmethod
    def validate_string_length(
        value: str,
        field: str,
        min_length: Optional[int] = None,
        max_length: Optional[int] = None,
        allow_empty: bool = False
    ) -> None:
        """Validate string length"""
        if not value and not allow_empty:
            raise APIError.validation_error(field, "Cannot be empty")
        
        if min_length and len(value) < min_length:
            raise APIError.validation_error(
                field,
                f"Must be at least {min_length} characters",
                value=f"{len(value)} characters"
            )
        
        if max_length and len(value) > max_length:
            raise APIError.validation_error(
                field,
                f"Cannot exceed {max_length} characters",
                value=f"{len(value)} characters"
            )
    
    @staticmethod
    def validate_email(email: str, field: str = "email") -> None:
        """Validate email format"""
        if not RequestValidator.EMAIL_PATTERN.match(email):
            raise APIError.validation_error(field, "Invalid email format", value=email)
    
    @staticmethod
    def validate_url(url: str, field: str = "url", require_https: bool = False) -> None:
        """Validate URL format"""
        if not RequestValidator.URL_PATTERN.match(url):
            raise APIError.validation_error(field, "Invalid URL format", value=url)
        
        if require_https and not url.startswith("https://"):
            raise APIError.validation_error(
                field,
                "URL must use HTTPS",
                value=url
            )
    
    @staticmethod
    def validate_slug(slug: str, field: str = "slug") -> None:
        """Validate slug format (lowercase, numbers, hyphens only)"""
        if not RequestValidator.SLUG_PATTERN.match(slug):
            raise APIError.validation_error(
                field,
                "Must contain only lowercase letters, numbers, and hyphens",
                value=slug
            )
    
    @staticmethod
    def validate_array_length(
        items: List,
        field: str,
        min_length: Optional[int] = None,
        max_length: Optional[int] = None
    ) -> None:
        """Validate array length"""
        if min_length and len(items) < min_length:
            raise APIError.validation_error(
                field,
                f"Must contain at least {min_length} items",
                value=f"{len(items)} items"
            )
        
        if max_length and len(items) > max_length:
            raise APIError.validation_error(
                field,
                f"Cannot contain more than {max_length} items",
                value=f"{len(items)} items"
            )
    
    @staticmethod
    def validate_date_range(
        date_from: Optional[datetime],
        date_to: Optional[datetime],
        max_range_days: Optional[int] = None
    ) -> None:
        """Validate date range"""
        if date_from and date_to:
            if date_from > date_to:
                raise APIError.bad_request(
                    "dateFrom cannot be after dateTo",
                    hint="Ensure dateFrom is earlier than or equal to dateTo"
                )
            
            if max_range_days:
                delta = (date_to - date_from).days
                if delta > max_range_days:
                    raise APIError.bad_request(
                        f"Date range cannot exceed {max_range_days} days",
                        hint=f"Reduce the range to {max_range_days} days or less"
                    )
    
    @staticmethod
    def validate_choice(value: str, field: str, allowed_values: List[str]) -> None:
        """Validate value is one of allowed choices"""
        if value not in allowed_values:
            raise APIError.validation_error(
                field,
                f"Must be one of: {', '.join(allowed_values)}",
                value=value
            )
    
    @staticmethod
    def sanitize_string(value: str, max_length: Optional[int] = None) -> str:
        """Sanitize string (trim whitespace, enforce max length)"""
        sanitized = value.strip()
        if max_length and len(sanitized) > max_length:
            sanitized = sanitized[:max_length]
        return sanitized
    
    @staticmethod
    def validate_id_format(id_value: str, field: str = "id") -> None:
        """Validate MongoDB ObjectId format"""
        if not id_value or len(id_value) != 24:
            raise APIError.validation_error(
                field,
                "Invalid ID format (must be 24-character hex string)",
                value=id_value
            )
        
        try:
            int(id_value, 16)  # Verify it's valid hex
        except ValueError:
            raise APIError.validation_error(
                field,
                "Invalid ID format (must be hexadecimal)",
                value=id_value
            )
