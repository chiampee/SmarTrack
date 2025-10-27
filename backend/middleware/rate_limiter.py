"""
Rate limiting middleware for API security
"""
from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import Request, HTTPException
from typing import Dict, Tuple
import time

# In-memory store for rate limiting (use Redis in production)
_rate_limit_store: Dict[str, list] = defaultdict(list)

class RateLimiter:
    def __init__(
        self,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
        requests_per_day: int = 5000
    ):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.requests_per_day = requests_per_day
    
    def _cleanup_old_requests(self, key: str):
        """Remove requests older than 24 hours"""
        now = time.time()
        _rate_limit_store[key] = [
            timestamp for timestamp in _rate_limit_store[key]
            if now - timestamp < 86400  # 24 hours in seconds
        ]
    
    def _check_limit(self, key: str, limit: int, window_seconds: int) -> bool:
        """Check if request is within limit for given time window"""
        now = time.time()
        cutoff = now - window_seconds
        
        # Get all requests for this key
        all_requests = _rate_limit_store[key]
        
        # Keep only recent requests (within the window)
        recent_requests = [t for t in all_requests if t > cutoff]
        
        if len(recent_requests) >= limit:
            return False
        
        # Add current request
        recent_requests.append(now)
        _rate_limit_store[key] = recent_requests
        
        return True
    
    def is_allowed(self, client_id: str) -> Tuple[bool, str]:
        """
        Check if request is allowed based on rate limits
        Returns (is_allowed, error_message)
        """
        self._cleanup_old_requests(client_id)
        
        # Check per-minute limit
        if not self._check_limit(client_id, self.requests_per_minute, 60):
            return False, "Too many requests (limit: 60 per minute). Please slow down."
        
        # Check per-hour limit
        if not self._check_limit(client_id, self.requests_per_hour, 3600):
            return False, "Too many requests (limit: 1000 per hour). Please try again later."
        
        # Check per-day limit
        if not self._check_limit(client_id, self.requests_per_day, 86400):
            return False, "Daily request limit exceeded (5000 per day). Please try again tomorrow."
        
        return True, ""
    
    def get_remaining(self, client_id: str) -> Dict[str, int]:
        """Get remaining requests for client"""
        now = time.time()
        
        minute_requests = [t for t in _rate_limit_store[client_id] if t > now - 60]
        hour_requests = [t for t in _rate_limit_store[client_id] if t > now - 3600]
        day_requests = [t for t in _rate_limit_store[client_id] if t > now - 86400]
        
        return {
            "per_minute": self.requests_per_minute - len(minute_requests),
            "per_hour": self.requests_per_hour - len(hour_requests),
            "per_day": self.requests_per_day - len(day_requests)
        }

# Create rate limiter instances
rate_limiter = RateLimiter()

def check_rate_limit(request: Request, client_id: str) -> None:
    """Check rate limit for a request"""
    is_allowed, error_message = rate_limiter.is_allowed(client_id)
    
    if not is_allowed:
        raise HTTPException(
            status_code=429,
            detail=error_message,
            headers={
                "X-RateLimit-Limit": "60",
                "X-RateLimit-Remaining": "0",
                "Retry-After": "60"
            }
        )

