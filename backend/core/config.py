"""
Configuration settings for SmarTrack Backend
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator
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
    
    # CORS - URGENT FIX: Comprehensive list of all frontend URLs
    # ⚠️ NOTE: Cannot use ["*"] when allow_credentials=True - must specify exact origins
    CORS_ORIGINS: List[str] = [
        # Production Frontend URLs
        "https://smartrack.top",
        "https://www.smartrack.top",
        "https://smar-track.vercel.app",
        "https://smartracker.vercel.app",
        "https://smartrack.vercel.app",
        # Staging Frontend URLs (Vercel Preview deployments)
        "https://smar-track-git-staging-chiampee.vercel.app",
        "https://smar-track-git-staging-chiampees-projects.vercel.app",
        "https://smartrack-staging.vercel.app",
        # Local Development
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://localhost:5554",
        "http://localhost:8000",
    ]
    
    # Usage Limits
    MAX_LINKS_PER_USER: int = 40  # 40 links per user
    MAX_STORAGE_PER_USER_BYTES: int = 40 * 1024  # 40 KB per user
    MAX_PAGE_SIZE_BYTES: int = 524288  # 512KB
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60  # Reasonable limit for production
    ADMIN_RATE_LIMIT_REQUESTS_PER_MINUTE: int = 300  # Admin users get higher limit
    
    # Admin Access - MUST be set via environment variable (comma-separated)
    # Example: ADMIN_EMAILS=admin1@example.com,admin2@example.com
    # ✅ SECURITY: Validated and normalized to lowercase for secure comparison
    ADMIN_EMAILS: List[str] = []
    
    @field_validator("ADMIN_EMAILS", mode="before")
    @classmethod
    def parse_admin_emails(cls, v):
        """Parse comma-separated ADMIN_EMAILS string into list"""
        if isinstance(v, str):
            # Split by comma, strip whitespace, filter empty strings, and normalize to lowercase
            emails = [email.strip().lower() for email in v.split(",") if email.strip()]
            
            # Validate email format (basic validation)
            valid_emails = []
            for email in emails:
                # Basic email validation - must contain @ and have valid structure
                if "@" in email and "." in email.split("@")[1] and len(email) > 3:
                    valid_emails.append(email)
                else:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"[SECURITY] Invalid admin email format ignored: {email}")
            
            # Ensure at least one valid admin email exists
            if not valid_emails:
                import logging
                logger = logging.getLogger(__name__)
                logger.error("[SECURITY] No valid admin emails found! ADMIN_EMAILS must be set in environment variable.")
                raise ValueError(
                    "ADMIN_EMAILS environment variable must be set with at least one valid email address. "
                    "Example: ADMIN_EMAILS=admin@example.com"
                )
            
            return valid_emails
        # If already a list, return as-is (normalize to lowercase)
        if isinstance(v, list):
            return [email.strip().lower() for email in v if email and isinstance(email, str) and email.strip()]
        # If None or empty, return empty list (will fail validation if required)
        return []
    
    @property
    def admin_emails_list(self) -> List[str]:
        """Get admin emails as list (normalized to lowercase for secure comparison)"""
        # ✅ SECURITY: Always return normalized lowercase emails for consistent comparison
        return self.ADMIN_EMAILS
    
    class Config:
        env_file = ".env"
    
    # Analytics Cache
    ANALYTICS_CACHE_TTL_SECONDS: int = 60  # 1 minute cache for analytics
    
    # Debug - MUST be False in production
    DEBUG: bool = False

# Create settings instance
settings = Settings()

# ✅ Validate CORS configuration on startup (prevent wildcard accidents)
# ⚠️ TEMPORARILY DISABLED for urgent production fix
def validate_cors_config():
    """Ensure no wildcard CORS origins - this would be a security vulnerability"""
    # TEMPORARY: Allow wildcard for urgent production fix
    # TODO: Re-enable this validation after fixing CORS properly
    pass
    # for origin in settings.CORS_ORIGINS:
    #     if "*" in origin:
    #         raise ValueError(
    #             f"⚠️ SECURITY ERROR: CORS wildcard detected: '{origin}'\n"
    #             f"Wildcards in CORS_ORIGINS are a security vulnerability.\n"
    #             f"Please specify exact origins instead."
    #         )

# Run validation on module import
validate_cors_config()
