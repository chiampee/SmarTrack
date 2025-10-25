"""
User data models
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UsageStats(BaseModel):
    totalLinks: int = 0
    storageUsed: int = 0
    lastActivity: datetime

class User(BaseModel):
    id: str
    auth0Id: str
    email: EmailStr
    name: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    usageStats: UsageStats

class UserStatsResponse(BaseModel):
    linksUsed: int
    linksLimit: int
    storageUsed: int
    storageLimit: int
