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

class CategoryRename(BaseModel):
    newName: str

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

@router.put("/categories/{category_name}")
async def rename_category(
    category_name: str,
    rename_data: CategoryRename,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Rename a category by updating all links with that category"""
    try:
        user_id = current_user["sub"]
        new_name = rename_data.newName.strip()
        
        if not new_name:
            raise HTTPException(status_code=400, detail="Category name cannot be empty")
        
        # Bulk update all links with the old category name
        result = await db.links.update_many(
            {"userId": user_id, "category": category_name},
            {"$set": {"category": new_name}}
        )
        
        return {
            "message": f"Category renamed successfully",
            "oldName": category_name,
            "newName": new_name,
            "updatedLinks": result.modified_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/categories/{category_name}")
async def delete_category(
    category_name: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Delete a category by moving all links to 'other' category"""
    try:
        user_id = current_user["sub"]
        
        # Move all links with this category to 'other'
        result = await db.links.update_many(
            {"userId": user_id, "category": category_name},
            {"$set": {"category": "other"}}
        )
        
        return {
            "message": f"Category deleted successfully. {result.modified_count} links moved to 'other'",
            "updatedLinks": result.modified_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
