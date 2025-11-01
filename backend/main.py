"""
SmarTrack Backend API
Research Management System
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from api import health, links, collections, categories, users, admin
from services.mongodb import connect_to_mongo, close_mongo_connection
from middleware.security_headers import SecurityHeadersMiddleware
from middleware.rate_limiter import check_rate_limit
from core.config import settings

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
        print(f"⚠️  Warning: Could not initialize indexes: {e}")
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

# Global exception handler to ensure CORS headers are always sent
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch all unhandled exceptions and return proper error response with CORS headers
    """
    import traceback
    from fastapi.responses import JSONResponse
    
    error_detail = str(exc)
    error_type = type(exc).__name__
    
    # Log the error
    print(f"❌ [GLOBAL ERROR HANDLER] {error_type}: {error_detail}")
    print(f"❌ [GLOBAL ERROR HANDLER] Path: {request.url.path}")
    print(f"❌ [GLOBAL ERROR HANDLER] Traceback: {traceback.format_exc()}")
    
    # Return 500 for unexpected errors, but with proper CORS headers
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": error_detail if settings.DEBUG else "An unexpected error occurred"
        },
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Add rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Skip rate limiting for health check
    if request.url.path == "/api/health":
        response = await call_next(request)
        return response
    
    # Check if this is an admin endpoint (admin auth happens later, but use admin rate limits for admin paths)
    is_admin_endpoint = request.url.path.startswith("/api/admin")
    
    # Get client identifier (use IP or user ID)
    client_id = request.client.host if request.client else "unknown"
    
    try:
        check_rate_limit(request, client_id, is_admin=is_admin_endpoint)
    except Exception as e:
        from fastapi import HTTPException
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
