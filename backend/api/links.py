"""
Links API endpoints
Refactored to use utility functions for better maintainability
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from services.mongodb import get_database
from services.auth import get_current_user
from core.config import settings

# Import utility functions
from utils.mongodb_utils import (
    validate_object_id,
    normalize_document,
    normalize_documents,
    build_user_filter,
    build_pagination_query,
    build_search_filter,
    validate_and_convert_date
)
from utils.validation import (
    validate_url,
    validate_title,
    validate_description,
    validate_tags
)
from utils.errors import NotFoundError, DuplicateError

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
        user_id = current_user["sub"]
        
        # Build base filter with user filter
        filter_query = build_user_filter(user_id)
        
        # Add search filter if query provided
        if q:
            search_filter = build_search_filter(q, ["title", "description", "url"])
            filter_query.update(search_filter)
        
        # Add category filter
        if category:
            filter_query["category"] = category.lower()
        
        # Add tags filter
        if tags:
            tag_list = [tag.strip().lower() for tag in tags.split(",")]
            filter_query["tags"] = {"$in": tag_list}
        
        # Add contentType filter
        if contentType:
            filter_query["contentType"] = contentType
        
        # Add date range filters
        if dateFrom:
            filter_query["createdAt"] = {"$gte": validate_and_convert_date(dateFrom, "dateFrom")}
        
        if dateTo:
            date_to_obj = validate_and_convert_date(dateTo, "dateTo")
            if "createdAt" in filter_query:
                if isinstance(filter_query["createdAt"], dict):
                    filter_query["createdAt"]["$lte"] = date_to_obj
                else:
                    filter_query["createdAt"] = {
                        "$gte": filter_query["createdAt"],
                        "$lte": date_to_obj
                    }
            else:
                filter_query["createdAt"] = {"$lte": date_to_obj}
        
        # Add boolean filters
        if isFavorite is not None:
            filter_query["isFavorite"] = isFavorite
        
        if isArchived is not None:
            filter_query["isArchived"] = isArchived
        
        # Get total count
        total = await db.links.count_documents(filter_query)
        
        # Get links with pagination
        skip, sort_dict = build_pagination_query(page, limit, "createdAt", -1)
        links = await db.links.find(filter_query).sort(list(sort_dict.items())).skip(skip).limit(limit).to_list(limit)
        
        # Normalize documents
        normalized_links = normalize_documents(links)
        
        return {
            "links": normalized_links,
            "total": total,
            "hasMore": skip + limit < total,
            "page": page,
            "limit": limit
        }
        
    except HTTPException:
        raise
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

# IMPORTANT: This route MUST be defined before /links/{link_id} to avoid
# FastAPI matching "search" as a link_id parameter. FastAPI matches routes
# in the order they are defined, so specific routes must come before parameterized ones.
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
        user_id = current_user["sub"]
        
        # Build search query
        search_query = build_user_filter(user_id)
        search_filter = build_search_filter(q, ["title", "description", "url"])
        search_query.update(search_filter)
        
        # Add additional filters
        if category:
            search_query["category"] = category.lower()
        
        if tags:
            tag_list = [tag.strip().lower() for tag in tags.split(",")]
            search_query["tags"] = {"$in": tag_list}
        
        if contentType:
            search_query["contentType"] = contentType
        
        # Execute search with limit
        links = await db.links.find(search_query).limit(20).to_list(20)
        
        # Normalize documents
        normalized_links = normalize_documents(links)
        
        return {"links": normalized_links}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/links/{link_id}", response_model=LinkResponse)
async def get_link(
    link_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get a specific link"""
    try:
        user_id = current_user["sub"]
        
        # Validate ObjectId format
        object_id = validate_object_id(link_id, "Link")
        
        # Find link with user filter
        link = await db.links.find_one(build_user_filter(user_id, {"_id": object_id}))
        
        if not link:
            raise NotFoundError("Link", link_id)
        
        # Normalize and return
        return normalize_document(link)
        
    except HTTPException:
        raise
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
        
        # Check user limits before creating link
        MAX_LINKS = settings.MAX_LINKS_PER_USER  # 40 links
        MAX_STORAGE = settings.MAX_STORAGE_PER_USER_BYTES  # 200 KB
        
        # Get current link count
        current_link_count = await db.links.count_documents(build_user_filter(user_id))
        
        if current_link_count >= MAX_LINKS:
            raise HTTPException(
                status_code=403,
                detail=f"Link limit reached. Maximum {MAX_LINKS} links allowed per account."
            )
        
        # Get current storage usage
        all_links = await db.links.find(
            build_user_filter(user_id),
            {"title": 1, "url": 1, "description": 1, "content": 1, "tags": 1, "_id": 0}
        ).to_list(10000)
        
        current_storage = 0
        if all_links:
            for link in all_links:
                title_bytes = len((link.get("title") or "").encode('utf-8'))
                url_bytes = len((link.get("url") or "").encode('utf-8'))
                desc_bytes = len((link.get("description") or "").encode('utf-8'))
                content_bytes = len((link.get("content") or "").encode('utf-8'))
                tags_bytes = sum(len(str(tag).encode('utf-8')) for tag in (link.get("tags") or []))
                current_storage += title_bytes + url_bytes + desc_bytes + content_bytes + tags_bytes + 300
        
        # Calculate size of new link
        title_bytes = len((link_data.title or "").encode('utf-8'))
        url_bytes = len((link_data.url or "").encode('utf-8'))
        desc_bytes = len((link_data.description or "").encode('utf-8'))
        content_bytes = len((link_data.content or "").encode('utf-8'))
        tags_bytes = sum(len(str(tag).encode('utf-8')) for tag in (link_data.tags or []))
        new_link_size = title_bytes + url_bytes + desc_bytes + content_bytes + tags_bytes + 300
        
        if current_storage + new_link_size > MAX_STORAGE:
            raise HTTPException(
                status_code=403,
                detail=f"Storage limit reached. Maximum {MAX_STORAGE // 1024} KB allowed per account. Please delete some links to free up space."
            )
        
        # Validate and sanitize URL
        validated_url = validate_url(link_data.url, "URL")
        
        # Check for duplicate URL
        existing_link = await db.links.find_one(
            build_user_filter(user_id, {"url": validated_url})
        )
        
        if existing_link:
            raise DuplicateError("Link", validated_url)
        
        # Validate and sanitize title
        validated_title = validate_title(link_data.title, max_length=500)
        
        # Validate and sanitize description
        validated_description = validate_description(link_data.description, max_length=5000)
        
        # Validate tags
        validated_tags = validate_tags(link_data.tags, max_count=20, max_tag_length=50)
        
        # Extract content from URL (optional, can be slow)
        content_text = link_data.content
        if not content_text and link_data.contentType == "webpage":
            # Skip content extraction for now to speed up link creation
            # Content extraction can be added later as a background task
            content_text = None
        
        # All validations passed - create the link
        link_doc = {
            "userId": user_id,
            "url": validated_url,
            "title": validated_title,
            "description": validated_description,
            "thumbnail": link_data.thumbnail,
            "favicon": link_data.favicon,
            "category": link_data.category.lower() if link_data.category else "research",
            "tags": validated_tags,
            "contentType": link_data.contentType or "webpage",
            "isFavorite": link_data.isFavorite or False,
            "isArchived": link_data.isArchived or False,
            "collectionId": link_data.collectionId,
            "content": content_text,
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

# Temporary debug-only endpoint to verify deletion flow works end-to-end
@router.post("/links/test-delete")
async def test_delete_link(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Test endpoint for deletion verification (debug only)"""
    if not getattr(settings, "DEBUG", False):
        raise HTTPException(status_code=404, detail="Not found")

    try:
        user_id = current_user["sub"]
        # Create a temporary link
        temp_doc = {
            "userId": user_id,
            "url": "https://example.com/temp-delete-test",
            "title": "TEMP_DELETE_TEST",
            "description": None,
            "thumbnail": None,
            "favicon": None,
            "category": "test",
            "tags": [],
            "contentType": "webpage",
            "isFavorite": False,
            "isArchived": False,
            "collectionId": None,
            "content": None,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
            "clickCount": 0,
        }

        insert_result = await db.links.insert_one(temp_doc)

        # Now delete it using the real delete criteria
        object_id = validate_object_id(str(insert_result.inserted_id), "Link")
        delete_result = await db.links.delete_one(
            build_user_filter(user_id, {"_id": object_id})
        )

        return {
            "createdId": str(insert_result.inserted_id),
            "deletedCount": delete_result.deleted_count,
        }

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
        user_id = current_user["sub"]
        
        # Validate ObjectId format
        object_id = validate_object_id(link_id, "Link")
        
        # Build update data
        update_data = {"updatedAt": datetime.utcnow()}
        
        # Process update fields with validation
        for field, value in link_data.dict(exclude_unset=True).items():
            if value is not None:
                # Validate and sanitize fields if needed
                if field == "title":
                    update_data[field] = validate_title(value, max_length=500)
                elif field == "description":
                    update_data[field] = validate_description(value, max_length=5000)
                elif field == "tags":
                    update_data[field] = validate_tags(value, max_count=20, max_tag_length=50)
                elif field == "category" and value:
                    update_data[field] = value.lower()
                else:
                    update_data[field] = value
        
        # Update the link
        result = await db.links.update_one(
            build_user_filter(user_id, {"_id": object_id}),
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise NotFoundError("Link", link_id)
        
        # Return updated link
        link = await db.links.find_one({"_id": object_id})
        return normalize_document(link)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/links/{link_id}")
async def delete_link(
    link_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Delete a link"""
    try:
        user_id = current_user["sub"]
        
        # Validate ObjectId format
        object_id = validate_object_id(link_id, "Link")
        
        # Delete the link
        result = await db.links.delete_one(
            build_user_filter(user_id, {"_id": object_id})
        )
        
        if result.deleted_count == 0:
            # Check if link exists but belongs to different user
            link = await db.links.find_one({"_id": object_id})
            if link:
                raise HTTPException(status_code=403, detail="Not allowed to delete this link")
            raise NotFoundError("Link", link_id)
        
        return {
            "message": "Link deleted successfully",
            "deletedCount": result.deleted_count
        }
        
    except HTTPException:
        raise
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
        result = await db.links.delete_many(build_user_filter(user_id))
        
        return {
            "message": f"Deleted {result.deleted_count} links successfully",
            "deletedCount": result.deleted_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
