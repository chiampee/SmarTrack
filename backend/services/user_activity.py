"""
User activity tracking for security
"""
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple
from fastapi import HTTPException
from services.mongodb import get_database
import logging

logger = logging.getLogger(__name__)

# Inactivity threshold: 5 days
INACTIVITY_THRESHOLD_DAYS = 5

async def update_user_activity(user_id: str, db=None) -> None:
    """
    Update user's last activity timestamp in database.
    This is called after successful authentication to track when user last used the dashboard.
    
    Args:
        user_id: User ID from Auth0 token
        db: Optional database instance (will get from get_database() if not provided)
    """
    try:
        if db is None:
            db = get_database()
        
        now = datetime.now(timezone.utc)
        
        # Upsert user activity record
        await db.user_activity.update_one(
            {"userId": user_id},
            {
                "$set": {
                    "lastActivity": now,
                    "updatedAt": now
                },
                "$setOnInsert": {
                    "userId": user_id,
                    "createdAt": now
                }
            },
            upsert=True
        )
    except Exception as e:
        # Don't fail the request if activity update fails - just log it
        logger.warning(f"Failed to update user activity for user {user_id}: {e}")


async def check_user_activity(user_id: str, db=None) -> Tuple[bool, Optional[datetime]]:
    """
    Check if user's last activity is within the inactivity threshold.
    
    Args:
        user_id: User ID from Auth0 token
        db: Optional database instance (will get from get_database() if not provided)
    
    Returns:
        Tuple of (is_active: bool, last_activity: Optional[datetime])
        - is_active: True if user has been active within threshold, False if inactive
        - last_activity: Last activity timestamp, or None if no record exists
    """
    try:
        if db is None:
            db = get_database()
        
        # Get user's last activity
        activity_record = await db.user_activity.find_one({"userId": user_id})
        
        if not activity_record or not activity_record.get("lastActivity"):
            # First-time user or no activity record - allow access
            return True, None
        
        last_activity = activity_record.get("lastActivity")
        
        # Ensure timezone-aware datetime
        if isinstance(last_activity, datetime) and last_activity.tzinfo is None:
            last_activity = last_activity.replace(tzinfo=timezone.utc)
        
        # Calculate days since last activity
        now = datetime.now(timezone.utc)
        days_inactive = (now - last_activity).days
        
        is_active = days_inactive < INACTIVITY_THRESHOLD_DAYS
        
        return is_active, last_activity
        
    except Exception as e:
        logger.error(f"Failed to check user activity for user {user_id}: {e}")
        # On error, allow access (fail open for availability)
        return True, None


class UserActivityTracker:
    """Track user activities to prevent abuse"""
    
    def __init__(self):
        # Store user activities (in production, use Redis or database)
        self.activities: Dict[str, List[datetime]] = {}
        self.blocked_users: Dict[str, datetime] = {}
    
    def record_activity(self, user_id: str, activity_type: str):
        """Record a user activity"""
        now = datetime.utcnow()
        key = f"{user_id}:{activity_type}"
        
        if key not in self.activities:
            self.activities[key] = []
        
        self.activities[key].append(now)
        
        # Keep only last 1000 activities per user/type
        if len(self.activities[key]) > 1000:
            self.activities[key] = self.activities[key][-1000:]
    
    def get_activity_count(self, user_id: str, activity_type: str, minutes: int = 60) -> int:
        """Get activity count in last N minutes"""
        key = f"{user_id}:{activity_type}"
        if key not in self.activities:
            return 0
        
        cutoff = datetime.utcnow() - timedelta(minutes=minutes)
        
        return len([
            activity for activity in self.activities[key]
            if activity >= cutoff
        ])
    
    def check_user_limits(self, user_id: str) -> bool:
        """Check if user has exceeded limits"""
        # Check create operations
        creates_last_hour = self.get_activity_count(user_id, "create_link", 60)
        if creates_last_hour > 50:  # Max 50 links created per hour
            raise HTTPException(
                status_code=429,
                detail="Too many link creations. Please wait before creating more links."
            )
        
        # Check delete operations
        deletes_last_hour = self.get_activity_count(user_id, "delete_link", 60)
        if deletes_last_hour > 30:  # Max 30 deletes per hour
            raise HTTPException(
                status_code=429,
                detail="Too many deletions. Please wait before deleting more."
            )
        
        # Check update operations
        updates_last_hour = self.get_activity_count(user_id, "update_link", 60)
        if updates_last_hour > 100:  # Max 100 updates per hour
            raise HTTPException(
                status_code=429,
                detail="Too many updates. Please wait before updating more."
            )
        
        return True
    
    def is_user_blocked(self, user_id: str) -> bool:
        """Check if user is currently blocked"""
        if user_id in self.blocked_users:
            block_until = self.blocked_users[user_id]
            if datetime.utcnow() < block_until:
                return True
            else:
                # Unblock if time has passed
                del self.blocked_users[user_id]
        
        return False
    
    def block_user(self, user_id: str, hours: int = 24):
        """Block a user for specified hours"""
        self.blocked_users[user_id] = datetime.utcnow() + timedelta(hours=hours)

# Global activity tracker
activity_tracker = UserActivityTracker()

