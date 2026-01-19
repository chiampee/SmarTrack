"""
SmarTrack Backend API
Research Management System
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from api import health, links, collections, categories, users, admin
from services.mongodb import connect_to_mongo, close_mongo_connection
from middleware.security_headers import SecurityHeadersMiddleware
from middleware.rate_limiter import check_rate_limit
from core.config import settings

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    await connect_to_mongo()
    print("✅ Connected to MongoDB")
    
    # Initialize database indexes (idempotent - safe to run multiple times)
    try:
        from services.mongodb import get_database
        from services.index_utils import create_index_safely
        db = get_database()
        
        # Create indexes for links collection
        await create_index_safely(db.links, "userId")
        await create_index_safely(db.links, [("userId", 1), ("isFavorite", 1)])
        await create_index_safely(db.links, [("userId", 1), ("isArchived", 1)])
        await create_index_safely(db.links, [("userId", 1), ("createdAt", -1)])
        # Explicitly set unique=False for userId + url to avoid conflicts with existing unique index
        await create_index_safely(db.links, [("userId", 1), ("url", 1)], unique=False)
        await create_index_safely(db.links, [("userId", 1), ("category", 1)])
        # ✅ FIX: Add missing index for collection filtering (improves query performance)
        await create_index_safely(db.links, [("userId", 1), ("collectionId", 1)])
        
        # Create indexes for collections collection
        await create_index_safely(db.collections, "userId")
        await create_index_safely(db.collections, [("userId", 1), ("name", 1)], unique=False)
        
        # Create indexes for categories collection
        await create_index_safely(db.categories, "userId")
        
        # Create indexes for system_logs collection
        await create_index_safely(db.system_logs, "timestamp")
        await create_index_safely(db.system_logs, "type")
        await create_index_safely(db.system_logs, "userId")
        await create_index_safely(db.system_logs, [("type", 1), ("timestamp", -1)])
        
        # Create indexes for source tracking in links
        await create_index_safely(db.links, "source")
        await create_index_safely(db.links, [("source", 1), ("createdAt", -1)])
        await create_index_safely(db.links, "extensionVersion")
        
        print("✅ Database indexes initialized")
    except Exception as e:
        logger.warning(f"⚠️  Warning: Could not initialize indexes: {e}")
        # Don't fail startup if index creation fails
    
    yield
    # Shutdown
    await close_mongo_connection()
    print("👋 Closed MongoDB connection")

app = FastAPI(
    title="SmarTrack API",
    description="AI-Powered Research Management System",
    version="1.0.0",
    lifespan=lifespan
)

# Secure CORS Configuration
# Whitelist matches Auth0 Allowed Callback URLs
origins = [
    "http://localhost:5173",           # Local Dev (Vite)
    "http://localhost:3000",           # Local Dev (Alternative)
    "http://localhost:5554",           # Local Dev (Custom Port)
    "https://www.smartrack.top",       # Production (www)
    "https://smartrack.top",           # Production (root)
    "https://smar-track.vercel.app",   # Vercel Production
    "https://smar-track-git-staging-chiampee.vercel.app", # Vercel Staging
]

# Explicit allowed headers - REQUIRED when allow_credentials=True
# Cannot use wildcard ["*"] with credentials - browsers reject it
allowed_headers = [
    "Authorization",          # Auth tokens
    "Content-Type",           # JSON content
    "Accept",                 # Response format
    "Origin",                 # CORS origin
    "X-Requested-With",       # AJAX requests
    "Cache-Control",          # Caching
    "Pragma",                 # Legacy caching
    "Expires",                # Cache expiration
    "If-Modified-Since",      # Browser caching check
    "If-None-Match",          # ETag caching check
    "sentry-trace",           # Sentry (trace propagation)
    "baggage",                # Sentry (trace context)
]

# Global exception handler to ensure CORS headers are always sent
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch all unhandled exceptions and return proper error response with CORS headers
    ✅ Improved: Now returns structured, helpful error messages
    """
    import traceback
    from fastapi.responses import JSONResponse
    from starlette.exceptions import HTTPException as StarletteHTTPException
    from fastapi.exceptions import RequestValidationError
    from utils.api_errors import format_validation_errors
    
    # Default to 500
    status_code = 500
    error_detail = {
        "error": "InternalServerError",
        "message": "An unexpected error occurred",
        "hint": "Please try again or contact support if the issue persists"
    }
    error_type = type(exc).__name__
    
    # Handle HTTP exceptions (including 429, 404, etc.)
    if isinstance(exc, StarletteHTTPException):
        status_code = exc.status_code
        # If detail is already a dict (from APIError), use it; otherwise wrap it
        if isinstance(exc.detail, dict):
            error_detail = exc.detail
        else:
            error_detail = {
                "error": error_type,
                "message": str(exc.detail)
            }
    # Handle validation errors with helpful formatting
    elif isinstance(exc, RequestValidationError):
        status_code = 422
        error_detail = format_validation_errors(exc.errors())
    else:
        # Unexpected exception - keep generic message for security
        error_detail = {
            "error": error_type,
            "message": "An unexpected error occurred",
            "hint": "Please try again. If this continues, contact support"
        }
    
    # Log the error (only for 500s or unexpected errors)
    if status_code >= 500:
        logger.error(f"❌ [GLOBAL ERROR HANDLER] {error_type}: {str(exc)}")
        logger.error(f"❌ [GLOBAL ERROR HANDLER] Path: {request.url.path}")
        logger.error(f"❌ [GLOBAL ERROR HANDLER] Traceback: {traceback.format_exc()}")
    
    # Validate origin against whitelist (same as CORS middleware)
    # Reference origins defined at module level
    origin_header = request.headers.get("origin", "")
    # Only set CORS header if origin is in whitelist (security: don't reflect arbitrary origins)
    allowed_origin = origin_header if origin_header in origins else ""
    
    # Return response with proper status code and secure CORS headers
    return JSONResponse(
        status_code=status_code,
        content={
            "error": "Internal server error" if status_code == 500 else "Request failed",
            "detail": error_detail if (status_code != 500 or settings.DEBUG) else "An unexpected error occurred"
        },
        headers={
            "Access-Control-Allow-Origin": allowed_origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": ", ".join(allowed_headers),
        }
    )

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=allowed_headers,
)

# Add rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Skip rate limiting for health check and lightweight read-only endpoints
    skip_paths = [
        "/api/health",
        "/api/categories",  # Lightweight read-only endpoint (predefined categories)
        "/api/collections",  # User-specific but lightweight (cached on frontend)
    ]
    if request.url.path in skip_paths:
        response = await call_next(request)
        return response
    
    # Check if this is an admin endpoint (admin auth happens later, but use admin rate limits for admin paths)
    is_admin_endpoint = request.url.path.startswith("/api/admin")
    
    # ✅ FIX: Get client identifier - prefer user ID over IP for better rate limiting
    # IP-based rate limiting is easily bypassed with proxies/VPNs
    def get_rate_limit_key(request: Request) -> str:
        """Get rate limit key - prefer authenticated user ID over IP address"""
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            try:
                from jose import jwt
                token = auth_header.split(" ")[1]
                # Decode without verification (just to get user ID for rate limiting)
                payload = jwt.decode(token, "", options={"verify_signature": False})
                user_id = payload.get("sub")
                if user_id:
                    return f"user:{user_id}"
            except Exception:
                # If token decode fails, fall back to IP
                pass
        # Fallback to IP for unauthenticated endpoints
        return f"ip:{request.client.host if request.client else 'unknown'}"
    
    client_id = get_rate_limit_key(request)
    
    try:
        check_rate_limit(request, client_id, is_admin=is_admin_endpoint)
    except Exception as e:
        from fastapi import HTTPException
        # If it's already an HTTPException, re-raise it properly
        if hasattr(e, "status_code"):
            raise e
        # Otherwise wrap it
        raise HTTPException(status_code=429, detail=str(e))
    
    response = await call_next(request)
    return response

# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(links.router, prefix="/api", tags=["Links"])
app.include_router(collections.router, prefix="/api", tags=["Collections"])
app.include_router(categories.router, prefix="/api", tags=["Categories"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])

@app.get("/")
async def root():
    return {
        "message": "SmarTrack API",
        "version": "1.0.0",
        "docs": "/docs"
    }