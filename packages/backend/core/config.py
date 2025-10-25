"""
Configuration settings for the application
"""
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    """Application settings"""
    
    # MongoDB
    MONGODB_URI: str
    
    # Auth0
    AUTH0_DOMAIN: str
    AUTH0_AUDIENCE: str
    AUTH0_ALGORITHMS: List[str] = ["RS256"]
    
    # Application
    APP_NAME: str = "SmarTrack"
    DEBUG: bool = True
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3001",
        "http://localhost:3000",
        "http://localhost:8000",
        "https://*.railway.app",
        "https://*.onrender.com",
        "https://*.vercel.app",
    ]
    
    # Usage Limits
    MAX_LINKS_PER_USER: int = 1000
    MAX_PAGE_SIZE_BYTES: int = 524288  # 0.5MB
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
