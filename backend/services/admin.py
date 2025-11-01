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
import logging

# Set up logger
logger = logging.getLogger(__name__)

async def check_admin_access(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Check if current user is an admin
    Returns admin user info if authorized, raises 404 otherwise
    """
    try:
        # Get current user from token
        current_user = await get_current_user(credentials)
        
        user_id = current_user.get("sub")
        user_email = current_user.get("email")
        
        # Log extracted email and admin list for debugging
        logger.info(f"Admin access check - User ID: {user_id}, Email extracted: {user_email or 'None'}")
        logger.debug(f"Admin emails list: {[email.lower() for email in settings.ADMIN_EMAILS]}")
        
        if not user_email:
            # Log failed admin access attempt with reason
            denial_reason = "No email in token"
            logger.warning(f"Admin access denied - User ID: {user_id}, Reason: {denial_reason}")
            await log_admin_access_attempt(user_id, False, denial_reason)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not found"
            )
        
        # Normalize email for comparison
        user_email_lower = user_email.lower()
        admin_emails_lower = [email.lower() for email in settings.ADMIN_EMAILS]
        
        # Check if email is in admin list
        if user_email_lower in admin_emails_lower:
            # Log successful admin access
            logger.info(f"Admin access granted - User ID: {user_id}, Email: {user_email}")
            await log_admin_access_attempt(user_id, True, user_email)
            return current_user
        else:
            # Log failed admin access attempt with reason
            denial_reason = f"Email '{user_email_lower}' not in admin list"
            logger.warning(f"Admin access denied - User ID: {user_id}, Email: {user_email}, Reason: {denial_reason}, Admin list: {admin_emails_lower}")
            await log_admin_access_attempt(user_id, False, denial_reason)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not found"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        # Log failed admin access attempt with exception details
        user_id = None
        user_email = None
        try:
            current_user = await get_current_user(credentials)
            user_id = current_user.get("sub")
            user_email = current_user.get("email")
        except Exception as inner_e:
            logger.error(f"Admin access check failed - Could not get current user: {str(inner_e)}")
        
        denial_reason = f"Exception during admin check: {str(e)}"
        logger.error(f"Admin access denied - User ID: {user_id}, Email: {user_email or 'Unknown'}, Error: {str(e)}")
        await log_admin_access_attempt(user_id, False, denial_reason)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found"
        )


async def log_admin_access_attempt(user_id: str = None, success: bool = False, email_or_reason: str = None):
    """
    Log admin access attempts to MongoDB for security audit
    
    Args:
        user_id: User ID from Auth0 token
        success: Whether access was granted
        email_or_reason: Email if success=True, denial reason if success=False
    """
    try:
        db = get_database()
        log_entry = {
            "type": "admin_access",
            "timestamp": datetime.utcnow(),
            "userId": user_id,
            "email": email_or_reason if success else None,
            "denialReason": email_or_reason if not success else None,
            "success": success,
            "ip": None  # Could be added if IP is available in request
        }
        await db.system_logs.insert_one(log_entry)
    except Exception as e:
        # Don't fail the request if logging fails
        logger.error(f"Failed to log admin access attempt: {e}")


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

