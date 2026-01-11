"""
Links API endpoints
Refactored to use utility functions for better maintainability
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from services.mongodb import get_database
from services.auth import get_current_user
from core.config import settings
import logging

logger = logging.getLogger(__name__)

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
    source: Optional[str] = "web"  # Source: "web" or "extension"
    extensionVersion: Optional[str] = None  # Extension version if created via extension

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
    source: Optional[str] = "web"  # Source: "web" or "extension"
    extensionVersion: Optional[str] = None  # Extension version if created via extension
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
        
        # ✅ ENHANCED: Ensure all optional fields have proper defaults
        for link in normalized_links:
            # Ensure optional fields exist with defaults
            link.setdefault("description", None)
            link.setdefault("tags", [])
            link.setdefault("collectionId", None)
            link.setdefault("thumbnail", None)
            link.setdefault("favicon", None)
            link.setdefault("isFavorite", False)
            link.setdefault("isArchived", False)
            link.setdefault("clickCount", 0)
            link.setdefault("lastAccessedAt", None)
            # Ensure tags is always a list (not None)
            if link.get("tags") is None:
                link["tags"] = []
        
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
        
        # Check user limits before creating link (including overrides)
        # First check for user-specific overrides
        user_limits = await db.user_limits.find_one({"userId": user_id})
        if user_limits:
            MAX_LINKS = user_limits.get("linksLimit", settings.MAX_LINKS_PER_USER)
            MAX_STORAGE = user_limits.get("storageLimitBytes", settings.MAX_STORAGE_PER_USER_BYTES)
        else:
            MAX_LINKS = settings.MAX_LINKS_PER_USER  # 40 links
            MAX_STORAGE = settings.MAX_STORAGE_PER_USER_BYTES  # 40 KB
        
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
        
        # ✅ FIX: Validate collectionId if provided (prevent orphaned links)
        if link_data.collectionId:
            try:
                collection_object_id = validate_object_id(link_data.collectionId, "Collection")
                # Verify collection exists and belongs to user
                collection = await db.collections.find_one(
                    build_user_filter(user_id, {"_id": collection_object_id})
                )
                if not collection:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Collection '{link_data.collectionId}' not found or does not belong to you"
                    )
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid collection ID format: {str(e)}"
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
            "source": link_data.source or "web",  # Track source: web or extension
            "extensionVersion": link_data.extensionVersion,  # Extension version if applicable
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
    request: Request,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Delete all links for the current user
    
    ⚠️ DESTRUCTIVE OPERATION - Requires confirmation header
    Add header: X-Confirm-Delete-All: yes
    """
    # ✅ Safety check: Require explicit confirmation header for this destructive operation
    confirmation = request.headers.get("X-Confirm-Delete-All", "").lower()
    if confirmation != "yes":
        raise HTTPException(
            status_code=428,  # 428 Precondition Required
            detail={
                "error": "ConfirmationRequired",
                "message": "This destructive operation requires confirmation",
                "requiredHeader": "X-Confirm-Delete-All: yes",
                "hint": "Add the confirmation header to proceed with deleting all links"
            }
        )
    
    try:
        user_id = current_user["sub"]
        result = await db.links.delete_many(build_user_filter(user_id))
        
        return {
            "message": f"Deleted {result.deleted_count} links successfully",
            "deletedCount": result.deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ✅ NEW: Bulk operations for multi-select functionality
class BulkUpdateRequest(BaseModel):
    linkIds: List[str]
    updates: LinkUpdate

class BulkDeleteRequest(BaseModel):
    linkIds: List[str]


@router.put("/links/bulk")
async def bulk_update_links(
    request: BulkUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Bulk update multiple links at once (for multi-select operations)"""
    try:
        user_id = current_user["sub"]
        
        if not request.linkIds:
            raise HTTPException(status_code=400, detail="No link IDs provided")
        
        if len(request.linkIds) > 100:
            raise HTTPException(status_code=400, detail="Cannot update more than 100 links at once")
        
        # Validate all ObjectIds
        object_ids = []
        for link_id in request.linkIds:
            try:
                obj_id = validate_object_id(link_id, "Link")
                object_ids.append(obj_id)
            except Exception:
                raise HTTPException(status_code=400, detail=f"Invalid link ID: {link_id}")
        
        # Build update data (same validation as single update)
        update_data = {"updatedAt": datetime.utcnow()}
        for field, value in request.updates.dict(exclude_unset=True).items():
            if value is not None:
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
        
        # Update all links (ensure they belong to user)
        result = await db.links.update_many(
            build_user_filter(user_id, {"_id": {"$in": object_ids}}),
            {"$set": update_data}
        )
        
        return {
            "message": f"Updated {result.modified_count} links successfully",
            "matchedCount": result.matched_count,
            "modifiedCount": result.modified_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/links/bulk")
async def bulk_delete_links(
    request: BulkDeleteRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Bulk delete multiple links at once (for multi-select operations)"""
    try:
        user_id = current_user["sub"]
        
        if not request.linkIds:
            raise HTTPException(status_code=400, detail="No link IDs provided")
        
        if len(request.linkIds) > 100:
            raise HTTPException(status_code=400, detail="Cannot delete more than 100 links at once")
        
        # Validate all ObjectIds
        object_ids = []
        for link_id in request.linkIds:
            try:
                obj_id = validate_object_id(link_id, "Link")
                object_ids.append(obj_id)
            except Exception:
                raise HTTPException(status_code=400, detail=f"Invalid link ID: {link_id}")
        
        # Delete all links (ensure they belong to user)
        result = await db.links.delete_many(
            build_user_filter(user_id, {"_id": {"$in": object_ids}})
        )
        
        return {
            "message": f"Deleted {result.deleted_count} links successfully",
            "deletedCount": result.deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/links/stats")
async def get_link_stats(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get link statistics (redirects to /api/users/stats for consistency)
    Note: This endpoint provides the same data as /api/users/stats
    """
    # Reuse the users stats logic for consistency
    from api.users import get_user_stats as _get_user_stats
    
    # Call the existing endpoint
    stats = await _get_user_stats(current_user, db)
    
    # Return in LinkStats format (compatible with frontend expectations)
    return {
        "totalLinks": stats.get("totalLinks", 0),
        "favoriteLinks": stats.get("favoriteLinks", 0),
        "archivedLinks": stats.get("archivedLinks", 0),
        "linksThisMonth": stats.get("linksThisMonth", 0),
        "storageUsed": stats.get("storageUsed", 0),
        "storageLimit": stats.get("storageLimit", 0),
        "averagePerLink": stats.get("averagePerLink", 0),
    }


@router.get("/links/export")
async def export_links(
    format: str = Query(..., regex="^(csv|json|markdown)$", description="Export format"),
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
    """
    Export user's links in various formats (CSV, JSON, Markdown)
    Important for GDPR compliance - users have right to export their data
    """
    from fastapi.responses import Response
    import csv
    import json
    from io import StringIO
    
    try:
        user_id = current_user["sub"]
        
        # Build filter query (same as get_links endpoint)
        filter_query = build_user_filter(user_id)
        
        if q:
            search_filter = build_search_filter(q, ["title", "description", "url"])
            filter_query.update(search_filter)
        
        if category:
            filter_query["category"] = category.lower()
        
        if tags:
            tag_list = [tag.strip().lower() for tag in tags.split(",")]
            filter_query["tags"] = {"$in": tag_list}
        
        if contentType:
            filter_query["contentType"] = contentType
        
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
        
        if isFavorite is not None:
            filter_query["isFavorite"] = isFavorite
        
        if isArchived is not None:
            filter_query["isArchived"] = isArchived
        
        # Fetch links (limit to 1000 for performance)
        links = await db.links.find(filter_query).sort("createdAt", -1).limit(1000).to_list(1000)
        normalized_links = normalize_documents(links)
        
        # Generate export based on format
        if format == "csv":
            output = StringIO()
            if normalized_links:
                fieldnames = ["id", "title", "url", "description", "category", "tags", "contentType", 
                             "isFavorite", "isArchived", "createdAt", "updatedAt"]
                writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
                writer.writeheader()
                for link in normalized_links:
                    # Convert tags array to comma-separated string
                    link_copy = link.copy()
                    link_copy["tags"] = ",".join(link.get("tags", []))
                    link_copy["createdAt"] = link.get("createdAt", "").isoformat() if hasattr(link.get("createdAt", ""), "isoformat") else str(link.get("createdAt", ""))
                    link_copy["updatedAt"] = link.get("updatedAt", "").isoformat() if hasattr(link.get("updatedAt", ""), "isoformat") else str(link.get("updatedAt", ""))
                    writer.writerow(link_copy)
            
            return Response(
                content=output.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=smartrack-links-{datetime.utcnow().strftime('%Y%m%d')}.csv"}
            )
        
        elif format == "json":
            # Clean datetime objects for JSON serialization
            for link in normalized_links:
                if hasattr(link.get("createdAt"), "isoformat"):
                    link["createdAt"] = link["createdAt"].isoformat()
                if hasattr(link.get("updatedAt"), "isoformat"):
                    link["updatedAt"] = link["updatedAt"].isoformat()
                if hasattr(link.get("lastAccessedAt"), "isoformat"):
                    link["lastAccessedAt"] = link["lastAccessedAt"].isoformat()
            
            return Response(
                content=json.dumps({"links": normalized_links, "exportedAt": datetime.utcnow().isoformat(), "count": len(normalized_links)}, indent=2),
                media_type="application/json",
                headers={"Content-Disposition": f"attachment; filename=smartrack-links-{datetime.utcnow().strftime('%Y%m%d')}.json"}
            )
        
        elif format == "markdown":
            output = StringIO()
            output.write(f"# SmarTrack Links Export\n\n")
            output.write(f"**Exported**: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC\n")
            output.write(f"**Total Links**: {len(normalized_links)}\n\n")
            output.write("---\n\n")
            
            for link in normalized_links:
                output.write(f"## {link.get('title', 'Untitled')}\n\n")
                output.write(f"**URL**: {link.get('url', '')}\n\n")
                if link.get('description'):
                    output.write(f"**Description**: {link['description']}\n\n")
                output.write(f"**Category**: {link.get('category', 'uncategorized')}\n\n")
                if link.get('tags'):
                    output.write(f"**Tags**: {', '.join(link['tags'])}\n\n")
                output.write(f"**Type**: {link.get('contentType', 'webpage')}\n\n")
                if link.get('isFavorite'):
                    output.write("⭐ **Favorite**\n\n")
                created_at = link.get('createdAt', '')
                if hasattr(created_at, 'strftime'):
                    created_at = created_at.strftime('%Y-%m-%d')
                output.write(f"**Created**: {created_at}\n\n")
                output.write("---\n\n")
            
            return Response(
                content=output.getvalue(),
                media_type="text/markdown",
                headers={"Content-Disposition": f"attachment; filename=smartrack-links-{datetime.utcnow().strftime('%Y%m%d')}.md"}
            )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.error(f"Export error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
