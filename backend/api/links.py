"""
Links API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from services.mongodb import get_database
from services.auth import get_current_user
from core.config import settings

router = APIRouter()

class LinkCreate(BaseModel):
    url: str
    title: str
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    favicon: Optional[str] = None
    category: str
    tags: List[str] = []
    contentType: str = "webpage"
    isFavorite: bool = False
    isArchived: bool = False
    collectionId: Optional[str] = None
    content: Optional[str] = None  # Text content extracted from the page

class LinkUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    contentType: Optional[str] = None
    isFavorite: Optional[bool] = None
    isArchived: Optional[bool] = None
    collectionId: Optional[str] = None

class LinkResponse(BaseModel):
    id: str
    userId: str
    url: str
    title: str
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    favicon: Optional[str] = None
    category: str
    tags: List[str] = []
    contentType: str
    isFavorite: bool = False
    isArchived: bool = False
    collectionId: Optional[str] = None
    content: Optional[str] = None  # Text content extracted from the page
    createdAt: datetime
    updatedAt: datetime
    lastAccessedAt: Optional[datetime] = None
    clickCount: int = 0

@router.get("/links", response_model=dict)
async def get_links(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    contentType: Optional[str] = Query(None),
    dateFrom: Optional[str] = Query(None),
    dateTo: Optional[str] = Query(None),
    isFavorite: Optional[bool] = Query(None),
    isArchived: Optional[bool] = Query(None),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's links with pagination and filtering"""
    try:
        # Build filter query
        filter_query = {"userId": current_user["sub"]}
        
        if q:
            filter_query["$or"] = [
                {"title": {"$regex": q, "$options": "i"}},
                {"description": {"$regex": q, "$options": "i"}},
                {"url": {"$regex": q, "$options": "i"}}
            ]
        
        if category:
            filter_query["category"] = category
        
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
            filter_query["tags"] = {"$in": tag_list}
        
        if contentType:
            filter_query["contentType"] = contentType
        
        if dateFrom:
            filter_query["createdAt"] = {"$gte": datetime.fromisoformat(dateFrom)}
        
        if dateTo:
            if "createdAt" in filter_query:
                filter_query["createdAt"]["$lte"] = datetime.fromisoformat(dateTo)
            else:
                filter_query["createdAt"] = {"$lte": datetime.fromisoformat(dateTo)}
        
        if isFavorite is not None:
            filter_query["isFavorite"] = isFavorite
        
        if isArchived is not None:
            filter_query["isArchived"] = isArchived
        
        # Get total count
        total = await db.links.count_documents(filter_query)
        
        # Get links with pagination
        skip = (page - 1) * limit
        links = await db.links.find(filter_query).skip(skip).limit(limit).to_list(limit)
        
        # Convert ObjectId to string
        for link in links:
            link["id"] = str(link["_id"])
            del link["_id"]
        
        return {
            "links": links,
            "total": total,
            "hasMore": skip + limit < total,
            "page": page,
            "limit": limit
        }
        
    except Exception as e:
        if getattr(settings, "DEBUG", False):
            return {
                "links": [],
                "total": 0,
                "hasMore": False,
                "page": page,
                "limit": limit,
            }
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/links/{link_id}", response_model=LinkResponse)
async def get_link(
    link_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get a specific link"""
    try:
        from bson import ObjectId
        link = await db.links.find_one({"_id": ObjectId(link_id), "userId": current_user["sub"]})
        
        if not link:
            raise HTTPException(status_code=404, detail="Link not found")
        
        link["id"] = str(link["_id"])
        del link["_id"]
        
        return link
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/links", response_model=LinkResponse)
async def create_link(
    link_data: LinkCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create a new link"""
    try:
        user_id = current_user["sub"]
        
        # Validation 1: Check if URL is already saved for this user
        existing_link = await db.links.find_one({
            "userId": user_id,
            "url": link_data.url
        })
        
        if existing_link:
            raise HTTPException(
                status_code=409,
                detail=f"Link already exists: {link_data.url}"
            )
        
        # Validation 2: Validate URL format
        from urllib.parse import urlparse
        parsed_url = urlparse(link_data.url)
        if not parsed_url.scheme or not parsed_url.netloc:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid URL format: {link_data.url}"
            )
        
        # Validation 3: Check if URL is accessible (optional - can be slow)
        # We'll skip this in production to avoid blocking requests
        
        # Validation 4: Sanitize and validate title
        if not link_data.title or len(link_data.title.strip()) == 0:
            raise HTTPException(
                status_code=400,
                detail="Title cannot be empty"
            )
        
        # Validation 5: Check title length
        if len(link_data.title) > 500:
            raise HTTPException(
                status_code=400,
                detail="Title is too long (max 500 characters)"
            )
        
        # Validation 6: Check description length
        if link_data.description and len(link_data.description) > 5000:
            raise HTTPException(
                status_code=400,
                detail="Description is too long (max 5000 characters)"
            )
        
        # Validation 7: Check tags count and length
        if len(link_data.tags) > 20:
            raise HTTPException(
                status_code=400,
                detail="Too many tags (max 20)"
            )
        
        for tag in link_data.tags:
            if len(tag) > 50:
                raise HTTPException(
                    status_code=400,
                    detail=f"Tag '{tag}' is too long (max 50 characters)"
                )
        
        # Extract content from URL (optional, can be slow)
        content_text = link_data.content
        if not content_text and link_data.contentType == "webpage":
            # Skip content extraction for now to speed up link creation
            # Content extraction can be added later as a background task
            content_text = None
        
        # All validations passed - create the link
        link_doc = {
            "userId": user_id,
            "url": link_data.url,
            "title": link_data.title.strip(),
            "description": link_data.description.strip() if link_data.description else None,
            "thumbnail": link_data.thumbnail,
            "favicon": link_data.favicon,
            "category": link_data.category,
            "tags": link_data.tags,
            "contentType": link_data.contentType,
            "isFavorite": link_data.isFavorite,
            "isArchived": link_data.isArchived,
            "collectionId": link_data.collectionId,
            "content": content_text,  # Store extracted text content
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
            "clickCount": 0
        }
        
        result = await db.links.insert_one(link_doc)
        link_doc["id"] = str(result.inserted_id)
        del link_doc["_id"]
        
        return link_doc
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/links/{link_id}", response_model=LinkResponse)
async def update_link(
    link_id: str,
    link_data: LinkUpdate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Update a link"""
    try:
        from bson import ObjectId
        
        user_id = current_user["sub"]
        print(f"🔗 Updating link: {link_id} for user: {user_id}")
        
        # Build update data
        update_data = {"updatedAt": datetime.utcnow()}
        
        for field, value in link_data.dict(exclude_unset=True).items():
            if value is not None:
                update_data[field] = value
                if field == "collectionId":
                    print(f"   → Setting collectionId to: {value}")
        
        result = await db.links.update_one(
            {"_id": ObjectId(link_id), "userId": user_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            print(f"❌ Link not found or access denied: {link_id}")
            raise HTTPException(status_code=404, detail="Link not found")
        
        print(f"✅ Link updated successfully: {link_id}")
        
        # Return updated link
        link = await db.links.find_one({"_id": ObjectId(link_id)})
        link["id"] = str(link["_id"])
        del link["_id"]
        
        return link
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"❌ Error updating link {link_id}: {str(e)}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.delete("/links/{link_id}")
async def delete_link(
    link_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Delete a link"""
    try:
        from bson import ObjectId
        result = await db.links.delete_one({"_id": ObjectId(link_id), "userId": current_user["sub"]})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Link not found")
        
        return {"message": "Link deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/links")
async def delete_all_links(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Delete all links for the current user"""
    try:
        user_id = current_user["sub"]
        result = await db.links.delete_many({"userId": user_id})
        
        return {
            "message": f"Deleted {result.deleted_count} links successfully",
            "deletedCount": result.deleted_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/links/search")
async def search_links(
    q: str = Query(..., description="Search query"),
    category: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    contentType: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Search links"""
    try:
        # Build search query
        search_query = {
            "userId": current_user["sub"],
            "$or": [
                {"title": {"$regex": q, "$options": "i"}},
                {"description": {"$regex": q, "$options": "i"}},
                {"url": {"$regex": q, "$options": "i"}}
            ]
        }
        
        if category:
            search_query["category"] = category
        
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
            search_query["tags"] = {"$in": tag_list}
        
        if contentType:
            search_query["contentType"] = contentType
        
        links = await db.links.find(search_query).limit(20).to_list(20)
        
        # Convert ObjectId to string
        for link in links:
            link["id"] = str(link["_id"])
            del link["_id"]
        
        return {"links": links}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
