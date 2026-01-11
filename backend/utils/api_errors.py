"""
Improved error response utilities
Provides consistent, helpful error messages across all endpoints
"""

from typing import Dict, Any, Optional
from fastapi import HTTPException, status


class APIError:
    """Standard API error responses with helpful messages"""
    
    @staticmethod
    def not_found(resource: str, identifier: Optional[str] = None) -> HTTPException:
        """Resource not found error"""
        detail = {
            "error": "NotFound",
            "message": f"{resource} not found" + (f": {identifier}" if identifier else ""),
            "hint": f"Check that the {resource.lower()} ID is correct and belongs to you"
        }
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)
    
    @staticmethod
    def unauthorized(message: str = "Authentication required") -> HTTPException:
        """Authentication error"""
        detail = {
            "error": "Unauthorized",
            "message": message,
            "hint": "Include a valid Bearer token in the Authorization header"
        }
        return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)
    
    @staticmethod
    def forbidden(message: str = "Access denied") -> HTTPException:
        """Authorization error"""
        detail = {
            "error": "Forbidden",
            "message": message,
            "hint": "You don't have permission to access this resource"
        }
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
    
    @staticmethod
    def bad_request(message: str, field: Optional[str] = None, hint: Optional[str] = None) -> HTTPException:
        """Bad request error"""
        detail = {
            "error": "BadRequest",
            "message": message,
        }
        if field:
            detail["field"] = field
        if hint:
            detail["hint"] = hint
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)
    
    @staticmethod
    def validation_error(field: str, message: str, value: Any = None) -> HTTPException:
        """Validation error"""
        detail = {
            "error": "ValidationError",
            "field": field,
            "message": message,
        }
        if value is not None:
            detail["provided_value"] = str(value)
        return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)
    
    @staticmethod
    def conflict(resource: str, message: str) -> HTTPException:
        """Conflict error (duplicate, etc.)"""
        detail = {
            "error": "Conflict",
            "resource": resource,
            "message": message,
            "hint": "This resource already exists or conflicts with existing data"
        }
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)
    
    @staticmethod
    def rate_limit_exceeded(retry_after: int = 60) -> HTTPException:
        """Rate limit error"""
        detail = {
            "error": "RateLimitExceeded",
            "message": f"Too many requests. Please try again in {retry_after} seconds",
            "retry_after": retry_after,
            "hint": "Slow down your request rate or contact support for higher limits"
        }
        return HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
            headers={"Retry-After": str(retry_after)}
        )
    
    @staticmethod
    def quota_exceeded(resource: str, limit: int, current: int) -> HTTPException:
        """Quota exceeded error"""
        detail = {
            "error": "QuotaExceeded",
            "resource": resource,
            "message": f"{resource} limit exceeded",
            "limit": limit,
            "current": current,
            "hint": f"You've reached your {resource.lower()} limit ({limit}). Delete some items or upgrade your plan"
        }
        return HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=detail)
    
    @staticmethod
    def server_error(message: str = "Internal server error", log_id: Optional[str] = None) -> HTTPException:
        """Internal server error"""
        detail = {
            "error": "InternalServerError",
            "message": message,
            "hint": "This is a server issue. Please try again or contact support if it persists"
        }
        if log_id:
            detail["log_id"] = log_id
        return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


def format_validation_errors(errors: list) -> Dict[str, Any]:
    """Format Pydantic validation errors into user-friendly messages"""
    formatted_errors = []
    for error in errors:
        field = " -> ".join([str(loc) for loc in error.get("loc", [])])
        formatted_errors.append({
            "field": field,
            "message": error.get("msg", "Invalid value"),
            "type": error.get("type", "unknown")
        })
    
    return {
        "error": "ValidationError",
        "message": "Request validation failed",
        "errors": formatted_errors,
        "hint": "Check the 'errors' array for specific field validation issues"
    }
