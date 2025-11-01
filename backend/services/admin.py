"""
Admin service utilities
"""

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPAuthorizationCredentials
from services.auth import get_current_user, security
from core.config import settings
from services.mongodb import get_database
from datetime import datetime
from typing import Dict, Any

async def check_admin_access(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Check if current user is an admin
    Returns admin user info if authorized, raises 404 otherwise
    """
    try:
        # Get current user from token
        current_user = await get_current_user(credentials)
        
        user_email = current_user.get("email")
        if not user_email:
            # Log failed admin access attempt
            await log_admin_access_attempt(current_user.get("sub"), False, "No email in token")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not found"
            )
        
        # Check if email is in admin list
        if user_email.lower() in [email.lower() for email in settings.ADMIN_EMAILS]:
            # Log successful admin access
            await log_admin_access_attempt(current_user.get("sub"), True, user_email)
            return current_user
        else:
            # Log failed admin access attempt
            await log_admin_access_attempt(current_user.get("sub"), False, user_email)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not found"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        # Log failed admin access attempt
        user_id = None
        try:
            current_user = await get_current_user(credentials)
            user_id = current_user.get("sub")
        except:
            pass
        await log_admin_access_attempt(user_id, False, f"Exception: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found"
        )


async def log_admin_access_attempt(user_id: str = None, success: bool = False, email: str = None):
    """
    Log admin access attempts to MongoDB for security audit
    """
    try:
        db = get_database()
        log_entry = {
            "type": "admin_access",
            "timestamp": datetime.utcnow(),
            "userId": user_id,
            "email": email,
            "success": success,
            "ip": None  # Could be added if IP is available in request
        }
        await db.system_logs.insert_one(log_entry)
    except Exception as e:
        # Don't fail the request if logging fails
        print(f"⚠️  Failed to log admin access attempt: {e}")


async def log_system_event(
    event_type: str,
    details: Dict[str, Any],
    user_id: str = None,
    severity: str = "info"
):
    """
    Log system events (API requests, errors, user actions, etc.)
    
    Args:
        event_type: Type of event (api_request, error, user_action, rate_limit, etc.)
        details: Event details dictionary
        user_id: Optional user ID associated with the event
        severity: Event severity (info, warning, error, critical)
    """
    try:
        db = get_database()
        log_entry = {
            "type": event_type,
            "timestamp": datetime.utcnow(),
            "userId": user_id,
            "details": details,
            "severity": severity
        }
        await db.system_logs.insert_one(log_entry)
    except Exception as e:
        # Don't fail the request if logging fails
        print(f"⚠️  Failed to log system event: {e}")

