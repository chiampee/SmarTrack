"""
Links API endpoints - All link CRUD operations and processing
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from models.link import Link, LinkCreate, LinkUpdate, LinkListResponse
from services.auth import get_current_user
from services.mongodb import get_database
from services.content_extractor import ContentExtractor
from core.config import settings

router = APIRouter()

@router.get("/links", response_model=LinkListResponse)
async def get_links(
    search: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    sortBy: str = "createdAt",
    sortOrder: str = "desc",
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Get all links for current user with filtering"""
    db = get_database()
    links_collection = db.links
    
    # Build query
    query = {"userId": str(current_user["_id"])}
    
    if tags:
        query["tags"] = {"$all": tags}
    
    if search:
        query["$text"] = {"$search": search}
    
    # Sort
    sort_direction = -1 if sortOrder == "desc" else 1
    
    # Pagination
    skip = (page - 1) * limit
    
    # Execute query
    cursor = links_collection.find(query).sort(sortBy, sort_direction).skip(skip).limit(limit)
    links = await cursor.to_list(length=limit)
    total = await links_collection.count_documents(query)
    
    # Convert ObjectId to string
    for link in links:
        link["_id"] = str(link["_id"])
        link["userId"] = str(link["userId"])
    
    return {
        "links": links,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.post("/links", response_model=Link, status_code=201)
async def create_link(
    link_data: LinkCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new link with content extraction"""
    db = get_database()
    links_collection = db.links
    users_collection = db.users
    
    user_id = str(current_user["_id"])
    
    # Check link limit
    user_links_count = await links_collection.count_documents({"userId": user_id})
    if user_links_count >= settings.MAX_LINKS_PER_USER:
        raise HTTPException(status_code=403, detail="Link limit reached")
    
    # Check for duplicate URL
    existing = await links_collection.find_one({
        "userId": user_id,
        "url": str(link_data.url)
    })
    if existing:
        raise HTTPException(status_code=409, detail="Link already exists")
    
    # Extract content
    try:
        extractor = ContentExtractor()
        extracted = extractor.fetch_and_extract(str(link_data.url))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Create link document
    now = datetime.utcnow()
    link = {
        "userId": user_id,
        "url": str(link_data.url),
        "title": link_data.title or extracted["title"],
        "description": link_data.description or extracted["excerpt"],
        "content": extracted["content"],
        "contentSize": extracted["contentSize"],
        "tags": link_data.tags,
        "createdAt": now,
        "updatedAt": now,
        "metadata": extracted["metadata"]
    }
    
    # Insert link
    result = await links_collection.insert_one(link)
    
    # Update user stats
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {
            "$inc": {
                "usageStats.totalLinks": 1,
                "usageStats.storageUsed": extracted["contentSize"]
            },
            "$set": {
                "usageStats.lastActivity": now
            }
        }
    )
    
    link["_id"] = str(result.inserted_id)
    return link

@router.get("/links/{link_id}", response_model=Link)
async def get_link(
    link_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a single link by ID"""
    db = get_database()
    links_collection = db.links
    
    link = await links_collection.find_one({
        "_id": ObjectId(link_id),
        "userId": str(current_user["_id"])
    })
    
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    link["_id"] = str(link["_id"])
    link["userId"] = str(link["userId"])
    return link

@router.patch("/links/{link_id}", response_model=Link)
async def update_link(
    link_id: str,
    link_update: LinkUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a link"""
    db = get_database()
    links_collection = db.links
    
    # Build update document
    update_data = {"updatedAt": datetime.utcnow()}
    if link_update.title is not None:
        update_data["title"] = link_update.title
    if link_update.description is not None:
        update_data["description"] = link_update.description
    if link_update.tags is not None:
        update_data["tags"] = link_update.tags
    
    # Update link
    result = await links_collection.find_one_and_update(
        {"_id": ObjectId(link_id), "userId": str(current_user["_id"])},
        {"$set": update_data},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Link not found")
    
    result["_id"] = str(result["_id"])
    result["userId"] = str(result["userId"])
    return result

@router.delete("/links/{link_id}")
async def delete_link(
    link_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a link"""
    db = get_database()
    links_collection = db.links
    users_collection = db.users
    
    # Get link first
    link = await links_collection.find_one({
        "_id": ObjectId(link_id),
        "userId": str(current_user["_id"])
    })
    
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    # Delete link
    await links_collection.delete_one({"_id": ObjectId(link_id)})
    
    # Update user stats
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {
            "$inc": {
                "usageStats.totalLinks": -1,
                "usageStats.storageUsed": -link["contentSize"]
            }
        }
    )
    
    return {"success": True, "message": "Link deleted successfully"}
