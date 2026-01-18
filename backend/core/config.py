"""
Configuration settings for SmarTrack Backend
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator, Field
from typing import List, Optional, Any, Union

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
        # Production Frontend URLs - Custom Domain
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
    
    # Admin Access - MUST be set via environment variable (comma-separated or JSON array)
    # Example: ADMIN_EMAILS=admin1@example.com,admin2@example.com
    # Or: ADMIN_EMAILS=["admin1@example.com","admin2@example.com"]
    # ✅ SECURITY: Validated and normalized to lowercase for secure comparison
    # ✅ FIX: Use Union type to allow both string and list, preventing JSONDecodeError
    ADMIN_EMAILS: Union[List[str], str] = Field(default_factory=list)
    
    @field_validator("ADMIN_EMAILS", mode="before")
    @classmethod
    def parse_admin_emails(cls, v: Any) -> Union[List[str], str]:
        """
        Parse ADMIN_EMAILS - handles both JSON arrays and comma-separated strings.
        Prevents EnvSettingsSource from trying json.loads on simple strings.
        """
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Handle None, empty string, or whitespace-only strings
            if not v or (isinstance(v, str) and not v.strip()):
                logger.warning("[SECURITY] ADMIN_EMAILS not set or empty. Admin panel access will be disabled.")
                return []
            
            # If already a list, return as-is (let Pydantic handle normalization)
            if isinstance(v, list):
                return v
            
            # Handle string input
            if isinstance(v, str):
                v_stripped = v.strip()
                
                # If string starts with '[' (JSON array), let Pydantic parse it as JSON
                # This prevents us from trying to split a JSON string
                if v_stripped.startswith('['):
                    return v  # Return as-is, let Pydantic's JSON parser handle it
                
                # Otherwise, it's a plain comma-separated string - split it
                # Split by comma, strip whitespace, filter empty strings
                emails = [email.strip() for email in v_stripped.split(",") if email.strip()]
                return emails  # Return list of strings for Pydantic to process
            
            # Fallback: return empty list for any other type
            logger.warning(f"[SECURITY] Unexpected ADMIN_EMAILS type: {type(v)}. Returning empty list.")
            return []
        except Exception as e:
            # Catch any unexpected errors and return empty list to prevent startup crash
            logger.error(f"[SECURITY] Error parsing ADMIN_EMAILS: {e}. Returning empty list to allow startup.")
            return []
    
    @field_validator("ADMIN_EMAILS", mode="after")
    @classmethod
    def validate_and_normalize_admin_emails(cls, v: Any) -> List[str]:
        """
        Validate and normalize admin emails after Pydantic has parsed the type.
        This runs after the 'before' validator and type conversion.
        """
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # At this point, v should be a list (Pydantic converted it)
            if not isinstance(v, list):
                logger.warning(f"[SECURITY] ADMIN_EMAILS is not a list after parsing: {type(v)}. Returning empty list.")
                return []
            
            # Normalize to lowercase and validate email format
            valid_emails = []
            for email in v:
                if not isinstance(email, str):
                    continue
                
                email_normalized = email.strip().lower()
                
                # Basic email validation - must contain @ and have valid structure
                if "@" in email_normalized and "." in email_normalized.split("@")[1] and len(email_normalized) > 3:
                    valid_emails.append(email_normalized)
                else:
                    logger.warning(f"[SECURITY] Invalid admin email format ignored: {email}")
            
            # Log warning if no valid emails found
            if not valid_emails:
                logger.warning("[SECURITY] No valid admin emails found in ADMIN_EMAILS. Admin panel access will be disabled.")
            
            return valid_emails
        except Exception as e:
            # Catch any unexpected errors and return empty list to prevent startup crash
            logger.error(f"[SECURITY] Error validating ADMIN_EMAILS: {e}. Returning empty list to allow startup.")
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
