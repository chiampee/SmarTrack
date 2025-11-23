"""
Configuration settings for SmarTrack Backend
"""

from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    # Database
    MONGODB_URI: str = "mongodb+srv://smartrack_user:UW0AC5aYv8q3suiB@cluster0.iwoqnpj.mongodb.net/?appName=Cluster0"
    
    # Auth0
    AUTH0_DOMAIN: str = "dev-a5hqcneif6ghl018.us.auth0.com"
    AUTH0_AUDIENCE: str = "https://api.smartrack.com"
    # Required for Management API access to fetch Google Tokens
    AUTH0_CLIENT_SECRET: Optional[str] = None
    AUTH0_CLIENT_ID: Optional[str] = None
    
    # CORS - Allow all origins for production
    CORS_ORIGINS: List[str] = [
        "http://localhost:3001",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5554",
        "http://localhost:8000",
        "https://smar-track.vercel.app",
        "https://smartracker.vercel.app",
        "https://smartrack.vercel.app",
    ]
    
    # Usage Limits
    MAX_LINKS_PER_USER: int = 40  # 40 links per user
    MAX_STORAGE_PER_USER_BYTES: int = 40 * 1024  # 40 KB per user
    MAX_PAGE_SIZE_BYTES: int = 524288  # 512KB
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 1000  # Temporarily set very high for testing
    ADMIN_RATE_LIMIT_REQUESTS_PER_MINUTE: int = 1000  # Temporarily set very high for testing
    
    # Admin Access
    ADMIN_EMAILS: List[str] = ["chaimpeer11@gmail.com"]  # List of admin email addresses
    
    class Config:
        env_file = ".env"
    
    # Analytics Cache
    ANALYTICS_CACHE_TTL_SECONDS: int = 60  # 1 minute cache for analytics
    
    # Debug
    DEBUG: bool = True

settings = Settings()
