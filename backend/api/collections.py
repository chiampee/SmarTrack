"""
Collections API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from services.mongodb import get_database
from services.auth import get_current_user

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

@router.get("/collections", response_model=List[CollectionResponse])
async def get_collections(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's collections"""
    try:
        user_id = current_user["sub"]
        print(f"📚 Fetching collections for user: {user_id}")
        
        raw = await db.collections.find({"userId": user_id}).to_list(100)
        print(f"✅ Found {len(raw)} collections")

        # Normalize and validate fields for response model
        normalized: List[dict] = []
        for item in raw:
            coll_id = str(item.get("_id") or item.get("id"))

            normalized.append({
                "id": coll_id,
                "userId": item.get("userId", user_id),
                "name": item.get("name", ""),
                "description": item.get("description"),
                "color": item.get("color", "#3B82F6"),
                "icon": item.get("icon", "book"),
                "isDefault": bool(item.get("isDefault", False)),
                "linkCount": 0,  # Removed expensive query for performance
                "createdAt": item.get("createdAt", datetime.utcnow()),
                "updatedAt": item.get("updatedAt", datetime.utcnow()),
            })

        print(f"✅ Returning {len(normalized)} normalized collections")
        return normalized
        
    except Exception as e:
        error_msg = f"❌ Error fetching collections: {str(e)}"
        print(error_msg)
        
        # Fail open in debug to avoid breaking the UI during setup
        from core.config import settings
        if getattr(settings, "DEBUG", False):
            print("⚠️  Debug mode: returning empty list")
            return []
        raise HTTPException(status_code=500, detail=error_msg)

@router.post("/collections", response_model=CollectionResponse)
async def create_collection(
    collection_data: CollectionCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create a new collection"""
    try:
        user_id = current_user["sub"]
        print(f"📝 Creating collection: {collection_data.name} for user: {user_id}")
        
        collection_doc = {
            "userId": user_id,
            "name": collection_data.name,
            "description": collection_data.description,
            "color": collection_data.color,
            "icon": collection_data.icon,
            "isDefault": False,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = await db.collections.insert_one(collection_doc)
        collection_id = str(result.inserted_id)
        collection_doc["id"] = collection_id
        del collection_doc["_id"]
        
        print(f"✅ Collection created successfully with ID: {collection_id}")
        return collection_doc
        
    except Exception as e:
        error_msg = f"❌ Error creating collection: {str(e)}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.put("/collections/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: str,
    collection_data: CollectionUpdate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Update a collection"""
    try:
        from bson import ObjectId
        
        # Build update data
        update_data = {"updatedAt": datetime.utcnow()}
        
        for field, value in collection_data.dict(exclude_unset=True).items():
            if value is not None:
                update_data[field] = value
        
        result = await db.collections.update_one(
            {"_id": ObjectId(collection_id), "userId": current_user["sub"]},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Collection not found")
        
        # Return updated collection
        collection = await db.collections.find_one({"_id": ObjectId(collection_id)})
        collection["id"] = str(collection["_id"])
        del collection["_id"]
        
        return collection
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/collections/{collection_id}")
async def delete_collection(
    collection_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Delete a collection"""
    try:
        from bson import ObjectId
        result = await db.collections.delete_one({"_id": ObjectId(collection_id), "userId": current_user["sub"]})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Collection not found")
        
        return {"message": "Collection deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
