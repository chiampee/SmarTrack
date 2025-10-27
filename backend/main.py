"""
SmarTrack Backend API
Research Management System
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from api import health, links, collections, categories, users
from services.mongodb import connect_to_mongo, close_mongo_connection
from middleware.security_headers import SecurityHeadersMiddleware
from middleware.rate_limiter import check_rate_limit
from core.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    await connect_to_mongo()
    print("✅ Connected to MongoDB")
    yield
    await close_mongo_connection()
    print("👋 Closed MongoDB connection")

app = FastAPI(
    title="SmarTrack API",
    description="AI-Powered Research Management System",
    version="1.0.0",
    lifespan=lifespan
)

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.CORS_ORIGINS == ["*"] else settings.CORS_ORIGINS,
    allow_credentials=False if settings.CORS_ORIGINS == ["*"] else True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],  # Allow all headers for now
)

# Add rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Skip rate limiting for health check
    if request.url.path == "/api/health":
        response = await call_next(request)
        return response
    
    # Get client identifier (use IP or user ID)
    client_id = request.client.host if request.client else "unknown"
    
    try:
        check_rate_limit(request, client_id)
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

@app.get("/")
async def root():
    return {
        "message": "SmarTrack API",
        "version": "1.0.0",
        "docs": "/docs"
    }
