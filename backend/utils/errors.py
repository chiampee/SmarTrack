"""
Custom error classes and error handling utilities
"""

from typing import Optional
from fastapi import HTTPException
from bson.errors import InvalidId
from pymongo.errors import DuplicateKeyError, OperationFailure


class NotFoundError(HTTPException):
    """Raised when a resource is not found"""
    
    def __init__(self, resource_name: str = "Resource", resource_id: Optional[str] = None):
        detail = f"{resource_name} not found"
        if resource_id:
            detail += f": {resource_id}"
        super().__init__(status_code=404, detail=detail)


class ValidationError(HTTPException):
    """Raised when input validation fails"""
    
    def __init__(self, message: str):
        super().__init__(status_code=400, detail=message)


class DuplicateError(HTTPException):
    """Raised when attempting to create a duplicate resource"""
    
    def __init__(self, resource_name: str = "Resource", identifier: Optional[str] = None):
        detail = f"{resource_name} already exists"
        if identifier:
            detail += f": {identifier}"
        super().__init__(status_code=409, detail=detail)


def handle_db_errors(func):
    """
    Decorator to handle common database errors and convert them to appropriate HTTP exceptions
    
    Usage:
        @handle_db_errors
        async def my_endpoint(...):
            ...
    """
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            # Re-raise HTTPExceptions as-is
            raise
        except InvalidId:
            raise HTTPException(
                status_code=400,
                detail="Invalid ID format"
            )
        except DuplicateKeyError as e:
            # Extract field name from error message if possible
            error_msg = str(e)
            if "index" in error_msg.lower():
                raise HTTPException(
                    status_code=409,
                    detail="A resource with this identifier already exists"
                )
            raise HTTPException(
                status_code=409,
                detail="Duplicate resource"
            )
        except OperationFailure as e:
            # MongoDB operation failure
            error_msg = str(e)
            if "duplicate" in error_msg.lower():
                raise HTTPException(
                    status_code=409,
                    detail="Duplicate resource"
                )
            raise HTTPException(
                status_code=500,
                detail="Database operation failed"
            )
        except Exception as e:
            # Log unexpected errors (in production, use proper logging)
            import traceback
            print(f"Unexpected error in {func.__name__}: {e}")
            print(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail=f"An unexpected error occurred: {str(e)}"
            )
    
    return wrapper

