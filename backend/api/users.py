"""
Users API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from services.mongodb import get_database
from services.auth import get_current_user
from core.config import settings

router = APIRouter()

@router.get("/users/stats")
async def get_user_stats(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user statistics"""
    try:
        user_id = current_user["sub"]
        
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
        # Get all links to calculate total storage
        all_links = await db.links.find({"userId": user_id}).to_list(1000)
        
        storage_used = 0
        average_per_link = 0
        
        if all_links:
            total_size = 0
            for link in all_links:
                # Estimate storage per link based on content
                # Title: ~100 bytes
                # URL: ~200 bytes
                # Description: ~500 bytes average
                # Tags: ~50 bytes per tag
                # Metadata: ~100 bytes
                title = link.get("title") or ""
                url = link.get("url") or ""
                description = link.get("description") or ""
                tags = link.get("tags", []) or []
                
                title_size = len(title.encode('utf-8'))
                url_size = len(url.encode('utf-8'))
                desc_size = len(description.encode('utf-8'))
                tags_size = sum(len(tag.encode('utf-8')) for tag in tags)
                # Add fixed overhead for metadata
                link_size = title_size + url_size + desc_size + tags_size + 300
                total_size += link_size
            
            storage_used = total_size
            average_per_link = total_size // total_links if total_links > 0 else 0
        else:
            storage_used = 0
            average_per_link = 0
        
        storage_limit = 5 * 1024 * 1024  # 5MB limit
        links_limit = 100  # 100 links limit
        
        return {
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
        
    except Exception as e:
        # In development, gracefully degrade to zeroed stats so the UI remains usable
        if getattr(settings, "DEBUG", False):
            return {
                "totalLinks": 0,
                "linksThisMonth": 0,
                "favoriteLinks": 0,
                "archivedLinks": 0,
                "storageUsed": 0,
                "storageLimit": 5 * 1024 * 1024,
                "linksLimit": 100,
                "averagePerLink": 0,
                "linksRemaining": 100,
                "storageRemaining": 5 * 1024 * 1024
            }
        raise HTTPException(status_code=500, detail=str(e))
