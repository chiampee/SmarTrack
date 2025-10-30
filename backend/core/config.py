"""
Configuration settings for SmarTrack Backend
"""

from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database
    MONGODB_URI: str = "mongodb+srv://smartrack_user:UW0AC5aYv8q3suiB@cluster0.iwoqnpj.mongodb.net/?appName=Cluster0"
    
    # Auth0
    AUTH0_DOMAIN: str = "dev-a5hqcneif6ghl018.us.auth0.com"
    AUTH0_AUDIENCE: str = "https://api.smartrack.com"
    
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
    MAX_LINKS_PER_USER: int = 1000
    MAX_PAGE_SIZE_BYTES: int = 524288  # 512KB
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60
    
    # Debug
    DEBUG: bool = True

    class Config:
        env_file = ".env"

settings = Settings()
