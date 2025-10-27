"""
User activity tracking for security
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from fastapi import HTTPException

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

