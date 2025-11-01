"""
Categories API endpoints
Refactored to use utility functions for better maintainability
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List
from pydantic import BaseModel
from urllib.parse import unquote
from services.mongodb import get_database
from services.auth import get_current_user

# Import utility functions
from utils.mongodb_utils import build_user_filter
from utils.validation import validate_category_name
from utils.errors import ValidationError

router = APIRouter()

class CategoryResponse(BaseModel):
    id: str
    name: str
    color: str
    icon: str
    isDefault: bool

class CategoryRename(BaseModel):
    newName: str

# Predefined categories - could be moved to config or database in the future
PREDEFINED_CATEGORIES = [
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

@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get predefined categories"""
    try:
        return PREDEFINED_CATEGORIES
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
        
        # URL decode the category name (FastAPI should do this automatically, but ensure it's decoded)
        category_name = unquote(category_name)
        
        # Validate new category name
        validated_new_name = validate_category_name(rename_data.newName, max_length=50)
        
        # Normalize category names for comparison
        category_name_normalized = category_name.lower().strip()
        new_name_normalized = validated_new_name.lower().strip()
        
        # Prevent renaming to the same name
        if category_name_normalized == new_name_normalized:
            raise HTTPException(
                status_code=400,
                detail="New category name must be different from the current name"
            )
        
        # Build user filter with category filter
        filter_query = build_user_filter(user_id, {"category": category_name_normalized})
        
        # Bulk update all links with the old category name
        result = await db.links.update_many(
            filter_query,
            {"$set": {"category": new_name_normalized}}
        )
        
        return {
            "message": "Category renamed successfully",
            "oldName": category_name,
            "newName": validated_new_name,
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
        
        # Normalize category name
        category_name_normalized = category_name.lower()
        
        # Prevent deleting the 'other' category itself
        if category_name_normalized == "other":
            raise HTTPException(
                status_code=400,
                detail="Cannot delete the 'other' category"
            )
        
        # Build user filter with category filter
        filter_query = build_user_filter(user_id, {"category": category_name_normalized})
        
        # Move all links with this category to 'other'
        result = await db.links.update_many(
            filter_query,
            {"$set": {"category": "other"}}
        )
        
        return {
            "message": f"Category deleted successfully. {result.modified_count} links moved to 'other'",
            "updatedLinks": result.modified_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
