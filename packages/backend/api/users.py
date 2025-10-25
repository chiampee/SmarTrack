"""
Users API endpoints
"""
from fastapi import APIRouter, Depends

from models.user import UserStatsResponse
from services.auth import get_current_user
from core.config import settings

router = APIRouter()

@router.get("/user/stats", response_model=UserStatsResponse)
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    """Get current user's usage statistics"""
    return {
        "linksUsed": current_user["usageStats"]["totalLinks"],
        "linksLimit": settings.MAX_LINKS_PER_USER,
        "storageUsed": current_user["usageStats"]["storageUsed"],
        "storageLimit": settings.MAX_LINKS_PER_USER * settings.MAX_PAGE_SIZE_BYTES
    }
