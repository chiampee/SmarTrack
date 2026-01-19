"""
Collections API endpoints
Refactored to use utility functions for better maintainability
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from services.mongodb import get_database
from services.auth import get_current_user

# Import utility functions
from utils.mongodb_utils import (
    validate_object_id,
    normalize_document,
    normalize_documents,
    build_user_filter
)
from utils.validation import (
    validate_collection_name,
    sanitize_string
)
from utils.errors import NotFoundError, DuplicateError

router = APIRouter()

class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "#3B82F6"
    icon: str = "book"

class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None

class CollectionResponse(BaseModel):
    id: str
    userId: str
    name: str
    description: Optional[str] = None
    color: str
    icon: str
    isDefault: bool = False
    linkCount: int = 0
    createdAt: datetime
    updatedAt: datetime

@router.get("/folders", response_model=List[CollectionResponse])
async def get_collections(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's collections with accurate link counts"""
    try:
        user_id = current_user["sub"]
        
        # Fetch collections
        raw = await db.collections.find(build_user_filter(user_id)).to_list(100)
        
        # Normalize documents
        normalized = normalize_documents(raw)
        
        # ✅ FIX: Calculate actual link counts using aggregation (single query for all collections)
        # This fixes the bug where linkCount was always 0
        link_counts_pipeline = [
            {"$match": {"userId": user_id, "collectionId": {"$ne": None, "$exists": True}}},
            {"$group": {
                "_id": "$collectionId",
                "count": {"$sum": 1}
            }}
        ]
        link_counts_result = await db.links.aggregate(link_counts_pipeline).to_list(100)
        link_counts_map = {str(item["_id"]): item["count"] for item in link_counts_result}
        
        # Set default values and apply actual link counts
        for item in normalized:
            item.setdefault("name", "")
            item.setdefault("color", "#3B82F6")
            item.setdefault("icon", "book")
            item.setdefault("isDefault", False)
            # ✅ Use actual count from database (not hardcoded 0)
            item["linkCount"] = link_counts_map.get(item.get("id"), 0)
            
            # Ensure datetime fields exist
            if "createdAt" not in item:
                item["createdAt"] = datetime.now(timezone.utc)
            if "updatedAt" not in item:
                item["updatedAt"] = datetime.now(timezone.utc)
        
        return normalized
        
    except Exception as e:
        error_msg = f"Error fetching collections: {str(e)}"
        
        # Fail open in debug to avoid breaking the UI during setup
        from core.config import settings
        if getattr(settings, "DEBUG", False):
            return []
        raise HTTPException(status_code=500, detail=error_msg)

@router.post("/folders", response_model=CollectionResponse)
async def create_collection(
    collection_data: CollectionCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create a new collection"""
    try:
        user_id = current_user["sub"]
        
        # Validate and sanitize collection name
        validated_name = validate_collection_name(collection_data.name, max_length=50)
        
        # Check for duplicate collection name for this user
        existing_collection = await db.collections.find_one(
            build_user_filter(user_id, {"name": validated_name})
        )
        
        if existing_collection:
            raise DuplicateError("Collection", validated_name)
        
        # Sanitize description if provided
        sanitized_description = sanitize_string(
            collection_data.description or "",
            max_length=500,
            field_name="Description"
        ) if collection_data.description else None
        
        # Create collection document
        collection_doc = {
            "userId": user_id,
            "name": validated_name,
            "description": sanitized_description,
            "color": collection_data.color or "#3B82F6",
            "icon": collection_data.icon or "book",
            "isDefault": False,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }
        
        result = await db.collections.insert_one(collection_doc)
        collection_doc["id"] = str(result.inserted_id)
        del collection_doc["_id"]
        
        return collection_doc
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Error creating collection: {str(e)}"
        raise HTTPException(status_code=500, detail=error_msg)

@router.put("/folders/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: str,
    collection_data: CollectionUpdate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Update a collection"""
    try:
        user_id = current_user["sub"]
        
        # Validate ObjectId format
        object_id = validate_object_id(collection_id, "Collection")
        
        # Build update data
        update_data = {"updatedAt": datetime.now(timezone.utc)}
        
        # Process update fields with validation
        for field, value in collection_data.dict(exclude_unset=True).items():
            if value is not None:
                if field == "name":
                    update_data[field] = validate_collection_name(value, max_length=50)
                    
                    # Check for duplicate name if name is being updated
                    existing = await db.collections.find_one({
                        "userId": user_id,
                        "name": update_data[field],
                        "_id": {"$ne": object_id}
                    })
                    if existing:
                        raise DuplicateError("Collection", update_data[field])
                elif field == "description":
                    update_data[field] = sanitize_string(
                        value,
                        max_length=500,
                        field_name="Description"
                    ) if value else None
                else:
                    update_data[field] = value
        
        # Update the collection
        result = await db.collections.update_one(
            build_user_filter(user_id, {"_id": object_id}),
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise NotFoundError("Collection", collection_id)
        
        # Return updated collection - ✅ SECURITY: Always use user filter when fetching user data
        collection = await db.collections.find_one(build_user_filter(user_id, {"_id": object_id}))
        if not collection:
            raise NotFoundError("Collection", collection_id)
        return normalize_document(collection)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/folders/{collection_id}")
async def delete_collection(
    collection_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Delete a collection"""
    try:
        user_id = current_user["sub"]
        
        # Validate ObjectId format
        object_id = validate_object_id(collection_id, "Collection")
        
        # Delete the collection
        result = await db.collections.delete_one(
            build_user_filter(user_id, {"_id": object_id})
        )
        
        if result.deleted_count == 0:
            raise NotFoundError("Collection", collection_id)
        
        return {"message": "Collection deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
