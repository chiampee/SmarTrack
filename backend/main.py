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
    # Startup
    await connect_to_mongo()
    print("✅ Connected to MongoDB")
    
    # Initialize database indexes (idempotent - safe to run multiple times)
    try:
        from services.mongodb import get_database
        db = get_database()
        
        # Create indexes for links collection
        await db.links.create_index("userId")
        await db.links.create_index([("userId", 1), ("isFavorite", 1)])
        await db.links.create_index([("userId", 1), ("isArchived", 1)])
        await db.links.create_index([("userId", 1), ("createdAt", -1)])
        await db.links.create_index([("userId", 1), ("url", 1)])
        await db.links.create_index([("userId", 1), ("category", 1)])
        await db.links.create_index([("userId", 1), ("collectionId", 1)])
        
        # Create indexes for collections collection
        await db.collections.create_index("userId")
        await db.collections.create_index([("userId", 1), ("name", 1)])
        
        # Create indexes for categories collection
        await db.categories.create_index("userId")
        
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
