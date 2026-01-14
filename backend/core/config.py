"""
Configuration settings for SmarTrack Backend
"""

from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    # Database - MUST be provided via environment variable
    MONGODB_URI: str
    
    # Auth0 - MUST be provided via environment variables
    AUTH0_DOMAIN: str
    AUTH0_AUDIENCE: str
    # Required for Management API access
    AUTH0_CLIENT_SECRET: Optional[str] = None
    AUTH0_CLIENT_ID: Optional[str] = None
    
    # CORS - Whitelist only (NEVER use wildcards with credentials!)
    CORS_ORIGINS: List[str] = [
        # Development
        "http://localhost:3001",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5554",
        "http://localhost:8000",
        # Production - Frontend
        "https://smar-track.vercel.app",
        "https://smartracker.vercel.app",
        "https://smartrack.vercel.app",
        "https://smartrack.top",
        # Production - Chrome Extension
        # ⚠️ IMPORTANT: Add your ACTUAL extension ID here after publishing
        # Example: "chrome-extension://abcdefghijklmnopqrstuvwxyz123456"
        # TODO: Replace with real extension ID before production deployment
        # NEVER USE: "chrome-extension://*" - this is a security vulnerability!
        # "chrome-extension://hbgpbeonpmmbiomclclhpgephdboabao",  # Uncomment and update with real ID
    ]
    
    # Usage Limits
    MAX_LINKS_PER_USER: int = 40  # 40 links per user
    MAX_STORAGE_PER_USER_BYTES: int = 40 * 1024  # 40 KB per user
    MAX_PAGE_SIZE_BYTES: int = 524288  # 512KB
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60  # Reasonable limit for production
    ADMIN_RATE_LIMIT_REQUESTS_PER_MINUTE: int = 300  # Admin users get higher limit
    
    # Admin Access - Can be set via environment variable (comma-separated) or defaults to single admin
    # Example: ADMIN_EMAILS=admin1@example.com,admin2@example.com
    ADMIN_EMAILS: Union[str, List[str]] = "chaimpeer11@gmail.com"  # Comma-separated string or list
    
    @field_validator('ADMIN_EMAILS', mode='before')
    @classmethod
    def parse_admin_emails(cls, v: Any) -> List[str]:
        """Parse ADMIN_EMAILS from string (comma-separated) or list"""
        if isinstance(v, list):
            return [email.strip() for email in v if email.strip()]
        if isinstance(v, str):
            # Handle comma-separated string from environment variable
            emails = [email.strip() for email in v.split(",") if email.strip()]
            return emails if emails else ["chaimpeer11@gmail.com"]  # Default fallback
        return ["chaimpeer11@gmail.com"]  # Default fallback
    
    @property
    def admin_emails_list(self) -> List[str]:
        """Get admin emails as list (for backward compatibility)"""
        if isinstance(self.ADMIN_EMAILS, list):
            return self.ADMIN_EMAILS
        return [str(self.ADMIN_EMAILS)]
    
    class Config:
        env_file = ".env"
    
    # Analytics Cache
    ANALYTICS_CACHE_TTL_SECONDS: int = 60  # 1 minute cache for analytics
    
    # Debug - MUST be False in production
    DEBUG: bool = False

# Create settings instance
settings = Settings()

# ✅ Validate CORS configuration on startup (prevent wildcard accidents)
def validate_cors_config():
    """Ensure no wildcard CORS origins - this would be a security vulnerability"""
    for origin in settings.CORS_ORIGINS:
        if "*" in origin:
            raise ValueError(
                f"⚠️ SECURITY ERROR: CORS wildcard detected: '{origin}'\n"
                f"Wildcards in CORS_ORIGINS are a security vulnerability.\n"
                f"Please specify exact origins instead."
            )

# Run validation on module import
validate_cors_config()
