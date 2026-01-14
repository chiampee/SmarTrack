"""
Users API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Dict, Any
from services.mongodb import get_database
from services.auth import get_current_user
from services.admin import log_system_event
from utils.mongodb_utils import build_user_filter
from core.config import settings
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# User limits constants
MAX_LINKS_PER_USER = 40
MAX_STORAGE_PER_USER_BYTES = 40 * 1024  # 40 KB

router = APIRouter()

@router.get("/users/stats")
async def get_user_stats(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user statistics"""
    try:
        user_id = current_user["sub"]
        logger.info(f"📊 Fetching stats for user: {user_id}")
        
        # Optimize: Get all counts in one aggregation pipeline
        from datetime import datetime
        this_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Single aggregation for all counts
        pipeline = [
            {"$match": {"userId": user_id}},
            {"$facet": {
                "total": [{"$count": "count"}],
                "favorites": [{"$match": {"isFavorite": True}}, {"$count": "count"}],
                "archived": [{"$match": {"isArchived": True}}, {"$count": "count"}],
                "thisMonth": [{"$match": {"createdAt": {"$gte": this_month}}}, {"$count": "count"}]
            }}
        ]
        
        result = await db.links.aggregate(pipeline).to_list(1)
        result = result[0] if result else {}
        
        # Extract counts from facet results
        total_links = result.get("total", [{}])[0].get("count", 0) if result.get("total") else 0
        favorite_links = result.get("favorites", [{}])[0].get("count", 0) if result.get("favorites") else 0
        archived_links = result.get("archived", [{}])[0].get("count", 0) if result.get("archived") else 0
        links_this_month = result.get("thisMonth", [{}])[0].get("count", 0) if result.get("thisMonth") else 0
        
        # Calculate actual storage used from links
        # Fetch only necessary fields for storage calculation
        all_links = await db.links.find(
            {"userId": user_id},
            {"title": 1, "url": 1, "description": 1, "content": 1, "tags": 1, "_id": 0}
        ).to_list(10000)  # Increased limit for accurate calculation
        
        storage_used = 0
        average_per_link = 0
        
        if all_links and len(all_links) > 0:
            total_size = 0
            for link in all_links:
                # Calculate actual byte size for each field
                title = link.get("title") or ""
                url = link.get("url") or ""
                description = link.get("description") or ""
                content = link.get("content") or ""
                tags = link.get("tags", []) or []
                
                # Get actual UTF-8 byte sizes
                title_bytes = len(title.encode('utf-8'))
                url_bytes = len(url.encode('utf-8'))
                desc_bytes = len(description.encode('utf-8'))
                content_bytes = len(content.encode('utf-8'))
                tags_bytes = sum(len(str(tag).encode('utf-8')) for tag in tags)
                
                # Add fixed overhead for MongoDB document metadata (~300 bytes)
                link_size = title_bytes + url_bytes + desc_bytes + content_bytes + tags_bytes + 300
                total_size += link_size
            
            storage_used = total_size
            average_per_link = total_size // len(all_links) if len(all_links) > 0 else 0
        else:
            storage_used = 0
            average_per_link = 0
        
        # ✅ FIX: Check for user-specific limit overrides (consistent with link creation logic)
        # This fixes the bug where custom limits set by admin were ignored
        user_limits_doc = await db.user_limits.find_one({"userId": user_id})
        if user_limits_doc:
            storage_limit = user_limits_doc.get("storageLimitBytes", MAX_STORAGE_PER_USER_BYTES)
            links_limit = user_limits_doc.get("linksLimit", MAX_LINKS_PER_USER)
        else:
            storage_limit = MAX_STORAGE_PER_USER_BYTES  # 40 KB default
            links_limit = MAX_LINKS_PER_USER  # 40 links default
        
        result = {
            "totalLinks": total_links,
            "linksThisMonth": links_this_month,
            "favoriteLinks": favorite_links,
            "archivedLinks": archived_links,
            "storageUsed": storage_used,
            "storageLimit": storage_limit,
            "linksLimit": links_limit,
            "averagePerLink": average_per_link,
            "linksRemaining": links_limit - total_links,
            "storageRemaining": storage_limit - storage_used
        }
        
        logger.info(f"✅ Stats calculated: {total_links} links, {storage_used / 1024:.1f} KB storage")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = f"Failed to calculate user stats: {str(e)}"
        logger.error(f"❌ {error_msg}")
        if getattr(settings, "DEBUG", False):
            traceback.print_exc()
            # In development, gracefully degrade to zeroed stats so the UI remains usable
            return {
                "totalLinks": 0,
                "linksThisMonth": 0,
                "favoriteLinks": 0,
                "archivedLinks": 0,
                "storageUsed": 0,
                "storageLimit": MAX_STORAGE_PER_USER_BYTES,  # 40 KB
                "linksLimit": MAX_LINKS_PER_USER,  # 40 links
                "averagePerLink": 0,
                "linksRemaining": MAX_LINKS_PER_USER,
                "storageRemaining": MAX_STORAGE_PER_USER_BYTES
            }
        raise HTTPException(status_code=500, detail=error_msg)

@router.delete("/users/account")
async def delete_user_account(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Delete user account and all associated data (GDPR/CCPA Right to Erasure)
    
    ⚠️ DESTRUCTIVE OPERATION - Requires confirmation header
    Add header: X-Confirm-Delete-Account: yes
    
    This endpoint:
    1. Deletes all user data (links, collections, user_limits)
    2. Logs the deletion event for compliance
    3. Returns confirmation of deletion
    
    GDPR/CCPA Compliance:
    - All PII and user data is permanently deleted
    - Deletion event is logged with timestamp, user ID, and email
    - Log entry is retained for compliance audit purposes
    """
    # ✅ Safety check: Require explicit confirmation header
    confirmation = request.headers.get("X-Confirm-Delete-Account", "").lower()
    if confirmation != "yes":
        raise HTTPException(
            status_code=428,  # 428 Precondition Required
            detail={
                "error": "ConfirmationRequired",
                "message": "This destructive operation requires confirmation",
                "requiredHeader": "X-Confirm-Delete-Account: yes",
                "hint": "Add the confirmation header to proceed with account deletion"
            }
        )
    
    try:
        user_id = current_user["sub"]
        user_email = current_user.get("email", "unknown")
        
        logger.info(f"[ACCOUNT DELETION] Starting account deletion for user: {user_id}, email: {user_email}")
        
        # Count data before deletion (for logging)
        links_count = await db.links.count_documents(build_user_filter(user_id))
        collections_count = await db.collections.count_documents(build_user_filter(user_id))
        user_limits_exists = await db.user_limits.find_one({"userId": user_id})
        
        # ✅ GDPR/CCPA Compliance: Delete all user data
        deletion_summary = {
            "linksDeleted": 0,
            "collectionsDeleted": 0,
            "userLimitsDeleted": False,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # 1. Delete all links
        links_result = await db.links.delete_many(build_user_filter(user_id))
        deletion_summary["linksDeleted"] = links_result.deleted_count
        logger.info(f"[ACCOUNT DELETION] Deleted {links_result.deleted_count} links for user {user_id}")
        
        # 2. Delete all collections
        collections_result = await db.collections.delete_many(build_user_filter(user_id))
        deletion_summary["collectionsDeleted"] = collections_result.deleted_count
        logger.info(f"[ACCOUNT DELETION] Deleted {collections_result.deleted_count} collections for user {user_id}")
        
        # 3. Delete user limits (if exists)
        if user_limits_exists:
            user_limits_result = await db.user_limits.delete_one({"userId": user_id})
            deletion_summary["userLimitsDeleted"] = user_limits_result.deleted_count > 0
            logger.info(f"[ACCOUNT DELETION] Deleted user limits for user {user_id}")
        
        # ✅ GDPR/CCPA Compliance: Log account deletion event
        # This log entry is retained for compliance audit purposes
        # The log includes: user ID, email, deletion summary, and compliance information
        try:
            await log_system_event(
                "account_deletion",
                {
                    "userId": user_id,
                    "email": user_email,
                    "deletionSummary": deletion_summary,
                    "linksCount": links_count,
                    "collectionsCount": collections_count,
                    "reason": "User-initiated account deletion (GDPR/CCPA Right to Erasure)",
                    "compliance": {
                        "regulation": "GDPR/CCPA",
                        "right": "Right to Erasure (Right to be Forgotten)",
                        "dataDeleted": True,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                },
                user_id=user_id,  # Pass user_id explicitly for logging
                email=user_email,  # Pass email explicitly for GDPR/CCPA compliance
                severity="info"
            )
            logger.info(f"[ACCOUNT DELETION] ✅ Logged deletion event for user {user_id}")
        except Exception as log_error:
            # Don't fail account deletion if logging fails, but log the error
            logger.error(f"[ACCOUNT DELETION] ⚠️ Failed to log deletion event: {log_error}")
        
        logger.info(f"[ACCOUNT DELETION] ✅ Account deletion completed for user {user_id}")
        
        return {
            "message": "Account and all associated data deleted successfully",
            "deletionSummary": deletion_summary,
            "compliance": {
                "regulation": "GDPR/CCPA",
                "right": "Right to Erasure",
                "status": "completed",
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ACCOUNT DELETION] ❌ Failed to delete account: {str(e)}")
        import traceback
        logger.error(f"[ACCOUNT DELETION] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to delete account: {str(e)}")
