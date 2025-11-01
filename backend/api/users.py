"""
Users API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from services.mongodb import get_database
from services.auth import get_current_user
from core.config import settings

# User limits constants
MAX_LINKS_PER_USER = 40
MAX_STORAGE_PER_USER_BYTES = 200 * 1024  # 200 KB

router = APIRouter()

@router.get("/users/stats")
async def get_user_stats(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user statistics"""
    try:
        user_id = current_user["sub"]
        print(f"📊 Fetching stats for user: {user_id}")
        
        # Optimize: Get all counts in one aggregation pipeline
        from datetime import datetime
        this_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Single aggregation for all counts
        pipeline = [
            {"$match": {"userId": user_id}},
            {"$facet": {
                "total": [{"$count": "count"}],
                "favorites": [{"$match": {"isFavorite": True}}, {"$count": "count"}],
                "archived": [{"$match": {"isArchived": True}}, {"$count": "count"}],
                "thisMonth": [{"$match": {"createdAt": {"$gte": this_month}}}, {"$count": "count"}]
            }}
        ]
        
        result = await db.links.aggregate(pipeline).to_list(1)
        result = result[0] if result else {}
        
        # Extract counts from facet results
        total_links = result.get("total", [{}])[0].get("count", 0) if result.get("total") else 0
        favorite_links = result.get("favorites", [{}])[0].get("count", 0) if result.get("favorites") else 0
        archived_links = result.get("archived", [{}])[0].get("count", 0) if result.get("archived") else 0
        links_this_month = result.get("thisMonth", [{}])[0].get("count", 0) if result.get("thisMonth") else 0
        
        # Calculate actual storage used from links
        # Fetch only necessary fields for storage calculation
        all_links = await db.links.find(
            {"userId": user_id},
            {"title": 1, "url": 1, "description": 1, "content": 1, "tags": 1, "_id": 0}
        ).to_list(10000)  # Increased limit for accurate calculation
        
        storage_used = 0
        average_per_link = 0
        
        if all_links and len(all_links) > 0:
            total_size = 0
            for link in all_links:
                # Calculate actual byte size for each field
                title = link.get("title") or ""
                url = link.get("url") or ""
                description = link.get("description") or ""
                content = link.get("content") or ""
                tags = link.get("tags", []) or []
                
                # Get actual UTF-8 byte sizes
                title_bytes = len(title.encode('utf-8'))
                url_bytes = len(url.encode('utf-8'))
                desc_bytes = len(description.encode('utf-8'))
                content_bytes = len(content.encode('utf-8'))
                tags_bytes = sum(len(str(tag).encode('utf-8')) for tag in tags)
                
                # Add fixed overhead for MongoDB document metadata (~300 bytes)
                link_size = title_bytes + url_bytes + desc_bytes + content_bytes + tags_bytes + 300
                total_size += link_size
            
            storage_used = total_size
            average_per_link = total_size // len(all_links) if len(all_links) > 0 else 0
        else:
            storage_used = 0
            average_per_link = 0
        
        storage_limit = MAX_STORAGE_PER_USER_BYTES  # 200 KB limit
        links_limit = MAX_LINKS_PER_USER  # 40 links limit
        
        result = {
            "totalLinks": total_links,
            "linksThisMonth": links_this_month,
            "favoriteLinks": favorite_links,
            "archivedLinks": archived_links,
            "storageUsed": storage_used,
            "storageLimit": storage_limit,
            "linksLimit": links_limit,
            "averagePerLink": average_per_link,
            "linksRemaining": links_limit - total_links,
            "storageRemaining": storage_limit - storage_used
        }
        
        print(f"✅ Stats calculated: {total_links} links, {storage_used / 1024:.1f} KB storage")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = f"Failed to calculate user stats: {str(e)}"
        print(f"❌ {error_msg}")
        if getattr(settings, "DEBUG", False):
            traceback.print_exc()
            # In development, gracefully degrade to zeroed stats so the UI remains usable
            return {
                "totalLinks": 0,
                "linksThisMonth": 0,
                "favoriteLinks": 0,
                "archivedLinks": 0,
                "storageUsed": 0,
                "storageLimit": MAX_STORAGE_PER_USER_BYTES,  # 200 KB
                "linksLimit": MAX_LINKS_PER_USER,  # 40 links
                "averagePerLink": 0,
                "linksRemaining": MAX_LINKS_PER_USER,
                "storageRemaining": MAX_STORAGE_PER_USER_BYTES
            }
        raise HTTPException(status_code=500, detail=error_msg)
