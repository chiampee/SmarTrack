"""
Health check endpoint
"""
from fastapi import APIRouter
from datetime import datetime
from services.mongodb import mongodb

router = APIRouter()

@router.get("/health")
async def health_check():
    """Check API and database health"""
    db_healthy = False
    
    try:
        # Ping database
        await mongodb.client.admin.command('ping')
        db_healthy = True
    except Exception as e:
        print(f"Database health check failed: {e}")
    
    return {
        "success": True,
        "data": {
            "status": "healthy" if db_healthy else "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "database": db_healthy,
                "auth": True
            }
        }
    }
