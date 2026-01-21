"""
Admin service utilities
"""

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPAuthorizationCredentials
from services.auth import get_current_user, security
from core.config import settings
from services.mongodb import get_database
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
from typing import Dict, Any
import logging

# Set up logger
logger = logging.getLogger(__name__)

async def check_admin_access(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Check if current user is an admin
    Returns admin user info if authorized, raises 404 otherwise
    """
    user_id = None
    user_email = None
    current_user = None
    
    try:
        # Get current user from token
        current_user = await get_current_user(credentials)
        
        user_id = current_user.get("sub") if current_user else None
        user_email = current_user.get("email") if current_user else None
        
        # If email not found, try to get from cache using user_id
        if not user_email and user_id:
            import time
            from services.auth import _user_email_cache, _CACHE_TTL_SECONDS
            current_time = time.time()
            if user_id in _user_email_cache:
                cache_entry = _user_email_cache[user_id]
                # Handle both old format (string) and new format (dict)
                if isinstance(cache_entry, dict):
                    cached_email = cache_entry.get('email')
                    cached_at = cache_entry.get('cached_at', 0)
                    # Check if cache is still valid
                    if cached_email and (current_time - cached_at < _CACHE_TTL_SECONDS):
                        logger.debug(f"[ADMIN CHECK] ✅ Found email in cache for user {user_id}: {cached_email}")
                        user_email = cached_email
                        # Update current_user with cached email
                        if current_user:
                            current_user["email"] = cached_email
                else:
                    # Old format
                    logger.debug(f"[ADMIN CHECK] ✅ Found email in cache (old format) for user {user_id}: {cache_entry}")
                    user_email = cache_entry
                    if current_user:
                        current_user["email"] = cache_entry
        
        # Log extracted email and admin list for debugging (use print for Render logs visibility)
        logger.debug(f"[ADMIN CHECK] User ID: {user_id}, Email extracted: {user_email or 'None'}")
        logger.debug(f"[ADMIN CHECK] Admin emails list: {settings.admin_emails_list}")
        logger.info(f"Admin access check - User ID: {user_id}, Email extracted: {user_email or 'None'}")
        logger.debug(f"Admin emails list: {[email.lower() for email in settings.admin_emails_list]}")
        
        if not user_email:
            # Log failed admin access attempt with reason
            denial_reason = "No email in token or cache - ensure token includes 'email' scope"
            logger.debug(f"[ADMIN DENIED] User ID: {user_id}, Reason: {denial_reason}")
            logger.warning(f"Admin access denied - User ID: {user_id}, Reason: {denial_reason}")
            # Don't let logging failure crash the request
            try:
                await log_admin_access_attempt(user_id, False, denial_reason)
            except Exception as log_error:
                logger.error(f"Failed to log admin access attempt: {log_error}")
            # ✅ FIX: Return 403 Forbidden (not 404) for clarity
            # Users should know they lack permission, not that the endpoint doesn't exist
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        # Normalize email for comparison
        user_email_lower = user_email.lower()
        admin_emails_lower = [email.lower() for email in settings.admin_emails_list]
        
        # Check if email is in admin list
        if user_email_lower in admin_emails_lower:
            # Log successful admin access
            logger.debug(f"[ADMIN GRANTED] User ID: {user_id}, Email: {user_email}")
            logger.info(f"Admin access granted - User ID: {user_id}, Email: {user_email}")
            # Don't let logging failure crash the request
            try:
                await log_admin_access_attempt(user_id, True, user_email)
            except Exception as log_error:
                logger.error(f"Failed to log admin access attempt: {log_error}")
            return current_user or {"sub": user_id, "email": user_email}
        else:
            # Log failed admin access attempt with reason
            denial_reason = f"Email '{user_email_lower}' not in admin list {admin_emails_lower}"
            logger.debug(f"[ADMIN DENIED] User ID: {user_id}, Email: {user_email}, Reason: {denial_reason}")
            logger.warning(f"Admin access denied - User ID: {user_id}, Email: {user_email}, Reason: {denial_reason}, Admin list: {admin_emails_lower}")
            # Don't let logging failure crash the request
            try:
                await log_admin_access_attempt(user_id, False, denial_reason)
            except Exception as log_error:
                logger.error(f"Failed to log admin access attempt: {log_error}")
            # ✅ FIX: Return 403 Forbidden (not 404) for clarity
            # Users should know they lack permission, not that the endpoint doesn't exist
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        # Log failed admin access attempt with exception details
        # Try to extract user info even if get_current_user failed
        if not user_id or not user_email:
            try:
                if not current_user:
                    current_user = await get_current_user(credentials)
                if current_user:
                    user_id = current_user.get("sub") or user_id
                    user_email = current_user.get("email") or user_email
                    # Try cache as last resort
                    if not user_email and user_id:
                        import time
                        from services.auth import _user_email_cache, _CACHE_TTL_SECONDS
                        current_time = time.time()
                        if user_id in _user_email_cache:
                            cache_entry = _user_email_cache[user_id]
                            if isinstance(cache_entry, dict):
                                cached_email = cache_entry.get('email')
                                if cached_email and (current_time - cache_entry.get('cached_at', 0) < _CACHE_TTL_SECONDS):
                                    user_email = cached_email
                            else:
                                # Old format
                                user_email = cache_entry
            except Exception as inner_e:
                logger.error(f"Admin access check failed - Could not get current user: {str(inner_e)}")
        
        denial_reason = f"Exception during admin check: {str(e)}"
        logger.debug(f"[ADMIN CHECK] ❌ Exception: {denial_reason}")
        logger.error(f"Admin access denied - User ID: {user_id}, Email: {user_email or 'Unknown'}, Error: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        # Don't let logging failure crash the request
        try:
            await log_admin_access_attempt(user_id, False, denial_reason)
        except Exception as log_error:
            logger.error(f"Failed to log admin access attempt: {log_error}")
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
    severity: str = "info",
    email: str = None
):
    """
    Log system events (API requests, errors, user actions, etc.)
    
    Args:
        event_type: Type of event (api_request, error, user_action, rate_limit, account_deletion, etc.)
        details: Event details dictionary
        user_id: Optional user ID associated with the event
        severity: Event severity (info, warning, error, critical)
        email: Optional email address for GDPR/CCPA compliance logging
    """
    try:
        db = get_database()
        log_entry = {
            "type": event_type,
            "timestamp": datetime.utcnow(),
            "userId": user_id,
            "email": email or details.get("email"),  # Extract email from details if not provided
            "details": details,
            "severity": severity
        }
        await db.system_logs.insert_one(log_entry)
    except Exception as e:
        # Don't fail the request if logging fails
        logger.warning(f"⚠️  Failed to log system event: {e}")


async def is_user_admin(user_id: str, db) -> bool:
    """
    Check if a user_id corresponds to an admin email
    
    Args:
        user_id: User ID to check
        db: Database instance
        
    Returns:
        True if user is an admin, False otherwise
    """
    try:
        # Get user's email from system_logs (most recent entry)
        from pymongo import DESCENDING
        user_log = await db.system_logs.find_one(
            {"userId": user_id, "email": {"$exists": True, "$ne": None}},
            sort=[("timestamp", DESCENDING)]
        )
        
        if not user_log or not user_log.get("email"):
            return False
        
        user_email = user_log.get("email", "").lower()
        admin_emails_lower = [email.lower() for email in settings.admin_emails_list]
        
        return user_email in admin_emails_lower
    except Exception as e:
        logger.error(f"[ADMIN CHECK] Error checking if user {user_id} is admin: {e}")
        # On error, assume not admin for safety
        return False


async def validate_no_admin_deletion(user_ids: list, db) -> tuple[bool, list]:
    """
    Validate that no admin users are in the deletion list
    
    Args:
        user_ids: List of user IDs to check
        db: Database instance
        
    Returns:
        Tuple of (is_valid, admin_user_ids)
        is_valid: True if no admins found, False otherwise
        admin_user_ids: List of admin user IDs found
    """
    admin_user_ids = []
    
    for user_id in user_ids:
        if await is_user_admin(user_id, db):
            admin_user_ids.append(user_id)
    
    return (len(admin_user_ids) == 0, admin_user_ids)

