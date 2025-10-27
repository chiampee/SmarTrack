"""
Categories API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List
from pydantic import BaseModel
from services.mongodb import get_database
from services.auth import get_current_user

router = APIRouter()

class CategoryResponse(BaseModel):
    id: str
    name: str
    color: str
    icon: str
    isDefault: bool

@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get predefined categories"""
    try:
        # Return predefined categories
        categories = [
            {
                "id": "research",
                "name": "Research",
                "color": "#3B82F6",
                "icon": "book-open",
                "isDefault": True
            },
            {
                "id": "articles",
                "name": "Articles",
                "color": "#10B981",
                "icon": "file-text",
                "isDefault": True
            },
            {
                "id": "tools",
                "name": "Tools",
                "color": "#F59E0B",
                "icon": "wrench",
                "isDefault": True
            },
            {
                "id": "references",
                "name": "References",
                "color": "#8B5CF6",
                "icon": "bookmark",
                "isDefault": True
            },
            {
                "id": "tutorials",
                "name": "Tutorials",
                "color": "#EF4444",
                "icon": "graduation-cap",
                "isDefault": True
            }
        ]
        
        return categories
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
