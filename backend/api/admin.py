"""
Admin API endpoints
Provides analytics and management functionality for admin users only
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPAuthorizationCredentials
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel
from services.mongodb import get_database
from services.admin import check_admin_access, log_system_event
from services.auth import security
from core.config import settings
from pymongo import DESCENDING
import time
import asyncio
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Simple in-memory cache for analytics (in production, use Redis)
_analytics_cache = {}
_cache_timestamps = {}

# ⚠️ REMOVED: Public debug endpoint was a security vulnerability
# It exposed sensitive token information and admin email lists
# For debugging, use the admin-protected endpoint below instead

def get_cached_analytics(cache_key: str):
    """Get cached analytics if still valid"""
    if cache_key in _analytics_cache:
        cache_time = _cache_timestamps.get(cache_key, 0)
        if time.time() - cache_time < settings.ANALYTICS_CACHE_TTL_SECONDS:
            return _analytics_cache[cache_key]
    return None

def set_cached_analytics(cache_key: str, data: Any):
    """Cache analytics data"""
    _analytics_cache[cache_key] = data
    _cache_timestamps[cache_key] = time.time()

@router.get("/admin/debug-token")
async def debug_admin_token(
    current_user: dict = Depends(check_admin_access),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Debug endpoint to inspect token contents and verify admin access
    Only accessible to admins - helps diagnose authentication issues
    """
    from jose import jwt
    from services.auth import extract_email_from_payload
    
    try:
        token = credentials.credentials
        
        # Decode token to show contents
        payload = jwt.decode(
            token,
            key="",
            options={
                "verify_signature": False,
                "verify_aud": False,
                "verify_exp": False,
            }
        )
        
        # Extract email using the same function
        extracted_email = extract_email_from_payload(payload)
        
        return {
            "status": "success",
            "user": current_user,
            "tokenInfo": {
                "sub": payload.get("sub"),
                "email": extracted_email,
                "emailFields": {
                    "email": payload.get("email"),
                    "https://auth0.com/email": payload.get("https://auth0.com/email"),
                    "https://auth0.com/user/email": payload.get("https://auth0.com/user/email"),
                },
                "name": payload.get("name"),
                "nickname": payload.get("nickname"),
                "aud": payload.get("aud"),
                "iss": payload.get("iss"),
                "exp": payload.get("exp"),
                "iat": payload.get("iat"),
            },
            "adminCheck": {
                "extractedEmail": extracted_email,
                "adminEmails": settings.ADMIN_EMAILS,
                "isAdmin": extracted_email and extracted_email.lower() in [email.lower() for email in settings.ADMIN_EMAILS],
            },
            "allPayloadKeys": list(payload.keys())
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "user": current_user
        }


@router.get("/admin/analytics")
async def get_admin_analytics(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    current_user: dict = Depends(check_admin_access),
    db = Depends(get_database)
):
    """
    Get comprehensive analytics across all users
    Default: Last 7 days
    """
    try:
        # Parse date range (default: last 7 days)
        end_date_obj = datetime.utcnow()
        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
        
        start_date_obj = end_date_obj - timedelta(days=7)
        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
        
        # Check cache
        cache_key = f"analytics_{start_date_obj.date()}_{end_date_obj.date()}"
        cached = get_cached_analytics(cache_key)
        if cached:
            return cached
        
        # Run independent queries in parallel for better performance
        async def get_total_users():
            try:
                pipeline = [
                    {"$group": {"_id": "$userId"}},
                    {"$count": "total"}
                ]
                result = await db.links.aggregate(pipeline).to_list(1)
                return result[0]["total"] if result and result[0].get("total") is not None else 0
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_total_users failed: {e}")
                return 0
        
        async def get_extension_users():
            try:
                pipeline = [
                    {"$match": {"source": "extension"}},
                    {"$group": {"_id": "$userId"}},
                    {"$count": "total"}
                ]
                result = await db.links.aggregate(pipeline).to_list(1)
                return result[0]["total"] if result and result[0].get("total") is not None else 0
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_extension_users failed: {e}")
                return 0
        
        async def get_total_links():
            try:
                return await db.links.count_documents({
                    "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
                })
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_total_links failed: {e}")
                return 0
        
        async def get_extension_links():
            try:
                return await db.links.count_documents({
                    "source": "extension",
                    "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
                })
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_extension_links failed: {e}")
                return 0
        
        async def get_storage():
            try:
                pipeline = [
                    {"$match": {
                        "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
                    }},
                    {"$project": {
                        "size": {
                            "$add": [
                                {"$strLenCP": {"$ifNull": ["$title", ""]}},
                                {"$strLenCP": {"$ifNull": ["$url", ""]}},
                                {"$strLenCP": {"$ifNull": ["$description", ""]}},
                                {"$strLenCP": {"$ifNull": ["$content", ""]}},
                                {"$multiply": [{"$size": {"$ifNull": ["$tags", []]}}, 50]},
                                300  # MongoDB overhead
                            ]
                        }
                    }},
                    {"$group": {"_id": None, "total": {"$sum": "$size"}}}
                ]
                result = await db.links.aggregate(pipeline).to_list(1)
                return result[0]["total"] if result and result[0].get("total") is not None else 0
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_storage failed: {e}")
                return 0
        
        # Execute independent queries in parallel
        total_users, extension_users, total_links, extension_links, total_storage_bytes = await asyncio.gather(
            get_total_users(),
            get_extension_users(),
            get_total_links(),
            get_extension_links(),
            get_storage()
        )
        
        web_links = total_links - extension_links
        
        # Run remaining queries in parallel for better performance
        async def get_user_growth():
            try:
                pipeline = [
                    {"$group": {
                        "_id": "$userId",
                        "firstSeen": {"$min": "$createdAt"}
                    }},
                    {"$match": {
                        "firstSeen": {"$gte": start_date_obj, "$lte": end_date_obj}
                    }},
                    {"$group": {
                        "_id": {
                            "year": {"$year": "$firstSeen"},
                            "month": {"$month": "$firstSeen"},
                            "day": {"$dayOfMonth": "$firstSeen"}
                        },
                        "newUsers": {"$sum": 1}
                    }},
                    {"$project": {
                        "date": {
                            "$dateFromParts": {
                                "year": "$_id.year",
                                "month": "$_id.month",
                                "day": "$_id.day"
                            }
                        },
                        "newUsers": 1
                    }},
                    {"$sort": {"date": 1}}
                ]
                return await db.links.aggregate(pipeline).to_list(1000)
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_user_growth failed: {e}")
                return []
        
        async def get_links_growth():
            try:
                pipeline = [
                    {"$match": {
                        "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
                    }},
                    {"$group": {
                        "_id": {
                            "year": {"$year": "$createdAt"},
                            "month": {"$month": "$createdAt"},
                            "day": {"$dayOfMonth": "$createdAt"}
                        },
                        "count": {"$sum": 1},
                        "extensionCount": {
                            "$sum": {"$cond": [{"$eq": ["$source", "extension"]}, 1, 0]}
                        }
                    }},
                    {"$project": {
                        "date": {
                            "$dateFromParts": {
                                "year": "$_id.year",
                                "month": "$_id.month",
                                "day": "$_id.day"
                            }
                        },
                        "count": 1,
                        "extensionCount": 1,
                        "webCount": {"$subtract": ["$count", "$extensionCount"]}
                    }},
                    {"$sort": {"date": 1}}
                ]
                return await db.links.aggregate(pipeline).to_list(1000)
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_links_growth failed: {e}")
                return []
        
        async def get_top_categories():
            try:
                pipeline = [
                    {"$match": {
                        "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
                    }},
                    {"$group": {
                        "_id": "$category",
                        "count": {"$sum": 1},
                        "users": {"$addToSet": "$userId"}
                    }},
                    {"$project": {
                        "category": "$_id",
                        "linkCount": "$count",
                        "userCount": {"$size": "$users"}
                    }},
                    {"$sort": {"linkCount": -1}},
                    {"$limit": 20}
                ]
                return await db.links.aggregate(pipeline).to_list(20)
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_top_categories failed: {e}")
                return []
        
        async def get_content_types():
            try:
                pipeline = [
                    {"$match": {
                        "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
                    }},
                    {"$group": {
                        "_id": "$contentType",
                        "count": {"$sum": 1}
                    }},
                    {"$project": {
                        "contentType": "$_id",
                        "count": 1
                    }},
                    {"$sort": {"count": -1}}
                ]
                return await db.links.aggregate(pipeline).to_list(100)
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_content_types failed: {e}")
                return []
        
        async def get_avg_links_per_user():
            try:
                pipeline = [
                    {"$match": {
                        "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
                    }},
                    {"$group": {
                        "_id": "$userId",
                        "linkCount": {"$sum": 1}
                    }},
                    {"$group": {
                        "_id": None,
                        "avg": {"$avg": "$linkCount"},
                        "max": {"$max": "$linkCount"},
                        "min": {"$min": "$linkCount"}
                    }}
                ]
                result = await db.links.aggregate(pipeline).to_list(1)
                return result[0]["avg"] if result and result[0].get("avg") else 0
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_avg_links_per_user failed: {e}")
                return 0
        
        async def get_active_users():
            try:
                pipeline = [
                    {"$match": {
                        "$or": [
                            {"createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}},
                            {"updatedAt": {"$gte": start_date_obj, "$lte": end_date_obj}}
                        ]
                    }},
                    {"$group": {"_id": "$userId"}},
                    {"$count": "total"}
                ]
                result = await db.links.aggregate(pipeline).to_list(1)
                return result[0]["total"] if result and result[0].get("total") is not None else 0
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_active_users failed: {e}")
                return 0
        
        async def get_users_approaching():
            try:
                # ✅ FIX: Use actual user limits (not hardcoded 35)
                # Get all user limits (including custom overrides)
                user_limits_map = {}
                try:
                    user_limits_docs = await db.user_limits.find({}).to_list(1000)
                    user_limits_map = {doc["userId"]: doc for doc in user_limits_docs}
                except Exception as e:
                    logger.warning(f"[ANALYTICS WARNING] Could not fetch user_limits: {e}")
                
                pipeline = [
                    {"$group": {
                        "_id": "$userId",
                        "linkCount": {"$sum": 1},
                        "storage": {
                            "$sum": {
                                "$add": [
                                    {"$strLenCP": {"$ifNull": ["$title", ""]}},
                                    {"$strLenCP": {"$ifNull": ["$url", ""]}},
                                    {"$strLenCP": {"$ifNull": ["$description", ""]}},
                                    {"$strLenCP": {"$ifNull": ["$content", ""]}},
                                    300
                                ]
                            }
                        }
                    }}
                ]
                user_usage = await db.links.aggregate(pipeline).to_list(10000)
                
                # Filter users approaching their specific limits (85% threshold)
                approaching = []
                for user in user_usage:
                    user_id = user["_id"]
                    link_count = user["linkCount"]
                    storage = user["storage"]
                    
                    # Get user-specific limits or use defaults
                    if user_id in user_limits_map:
                        links_limit = user_limits_map[user_id].get("linksLimit", settings.MAX_LINKS_PER_USER)
                        storage_limit = user_limits_map[user_id].get("storageLimitBytes", settings.MAX_STORAGE_PER_USER_BYTES)
                    else:
                        links_limit = settings.MAX_LINKS_PER_USER
                        storage_limit = settings.MAX_STORAGE_PER_USER_BYTES
                    
                    # Check if approaching limits (85% threshold)
                    if link_count >= (links_limit * 0.85) or storage >= (storage_limit * 0.85):
                        approaching.append(user)
                
                return approaching
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_users_approaching failed: {e}")
                return []
        
        async def get_extension_versions():
            try:
                pipeline = [
                    {"$match": {
                        "source": "extension", 
                        "extensionVersion": {"$exists": True, "$ne": None},
                        "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
                    }},
                    {"$group": {
                        "_id": "$extensionVersion",
                        "count": {"$sum": 1},
                        "users": {"$addToSet": "$userId"}
                    }},
                    {"$project": {
                        "version": "$_id",
                        "linkCount": "$count",
                        "userCount": {"$size": "$users"}
                    }},
                    {"$sort": {"linkCount": -1}}
                ]
                return await db.links.aggregate(pipeline).to_list(50)
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_extension_versions failed: {e}")
                return []
        
        # ✅ PM-FOCUSED METRICS: User Segmentation & Retention
        async def get_user_segmentation():
            """Segment users into new, returning, power users, casual users"""
            try:
                # Get all users with their first link date and total links
                pipeline = [
                    {"$group": {
                        "_id": "$userId",
                        "firstLinkDate": {"$min": "$createdAt"},
                        "lastLinkDate": {"$max": "$updatedAt"},
                        "totalLinks": {"$sum": 1},
                        "linksInPeriod": {
                            "$sum": {
                                "$cond": [
                                    {"$and": [
                                        {"$gte": ["$createdAt", start_date_obj]},
                                        {"$lte": ["$createdAt", end_date_obj]}
                                    ]},
                                    1, 0
                                ]
                            }
                        }
                    }}
                ]
                users_data = await db.links.aggregate(pipeline).to_list(10000)
                
                new_users = 0
                returning_users = 0
                power_users = 0  # 20+ links
                casual_users = 0  # 1-5 links
                moderate_users = 0  # 6-19 links
                
                period_start = start_date_obj
                period_end = end_date_obj
                
                for user in users_data:
                    first_link = user.get("firstLinkDate")
                    total_links = user.get("totalLinks", 0)
                    links_in_period = user.get("linksInPeriod", 0)
                    
                    # New user: first link in this period
                    if first_link and period_start <= first_link <= period_end:
                        new_users += 1
                    # Returning user: first link before period but active in period
                    elif first_link and first_link < period_start and links_in_period > 0:
                        returning_users += 1
                    
                    # User segmentation by link count
                    if total_links >= 20:
                        power_users += 1
                    elif total_links >= 6:
                        moderate_users += 1
                    elif total_links >= 1:
                        casual_users += 1
                
                return {
                    "newUsers": new_users,
                    "returningUsers": returning_users,
                    "powerUsers": power_users,
                    "moderateUsers": moderate_users,
                    "casualUsers": casual_users
                }
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_user_segmentation failed: {e}")
                return {"newUsers": 0, "returningUsers": 0, "powerUsers": 0, "moderateUsers": 0, "casualUsers": 0}
        
        async def get_engagement_metrics():
            """Calculate engagement depth metrics"""
            try:
                # Links per active user in period
                pipeline = [
                    {"$match": {
                        "$or": [
                            {"createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}},
                            {"updatedAt": {"$gte": start_date_obj, "$lte": end_date_obj}}
                        ]
                    }},
                    {"$group": {
                        "_id": "$userId",
                        "linksCreated": {
                            "$sum": {
                                "$cond": [
                                    {"$and": [
                                        {"$gte": ["$createdAt", start_date_obj]},
                                        {"$lte": ["$createdAt", end_date_obj]}
                                    ]},
                                    1, 0
                                ]
                            }
                        },
                        "linksUpdated": {
                            "$sum": {
                                "$cond": [
                                    {"$and": [
                                        {"$gte": ["$updatedAt", start_date_obj]},
                                        {"$lte": ["$updatedAt", end_date_obj]},
                                        {"$ne": ["$createdAt", "$updatedAt"]}
                                    ]},
                                    1, 0
                                ]
                            }
                        },
                        "categoriesUsed": {"$addToSet": "$category"},
                        "collectionsUsed": {"$addToSet": "$collectionId"}
                    }},
                    {"$project": {
                        "userId": "$_id",
                        "linksCreated": 1,
                        "linksUpdated": 1,
                        "categoriesCount": {"$size": {"$filter": {"input": "$categoriesUsed", "as": "cat", "cond": {"$ne": ["$$cat", None]}}}},
                        "collectionsCount": {"$size": {"$filter": {"input": "$collectionsUsed", "as": "col", "cond": {"$ne": ["$$col", None]}}}}
                    }}
                ]
                engagement_data = await db.links.aggregate(pipeline).to_list(10000)
                
                if not engagement_data:
                    return {
                        "avgLinksPerActiveUser": 0,
                        "avgCategoriesPerUser": 0,
                        "avgCollectionsPerUser": 0,
                        "usersWithCollections": 0,
                        "usersWithMultipleCategories": 0
                    }
                
                total_links_created = sum(u.get("linksCreated", 0) for u in engagement_data)
                total_categories = sum(u.get("categoriesCount", 0) for u in engagement_data)
                total_collections = sum(u.get("collectionsCount", 0) for u in engagement_data)
                users_with_collections = sum(1 for u in engagement_data if u.get("collectionsCount", 0) > 0)
                users_multiple_categories = sum(1 for u in engagement_data if u.get("categoriesCount", 0) > 1)
                
                active_user_count = len(engagement_data)
                
                return {
                    "avgLinksPerActiveUser": round(total_links_created / active_user_count, 2) if active_user_count > 0 else 0,
                    "avgCategoriesPerUser": round(total_categories / active_user_count, 2) if active_user_count > 0 else 0,
                    "avgCollectionsPerUser": round(total_collections / active_user_count, 2) if active_user_count > 0 else 0,
                    "usersWithCollections": users_with_collections,
                    "usersWithMultipleCategories": users_multiple_categories,
                    "collectionAdoptionRate": round((users_with_collections / active_user_count * 100), 1) if active_user_count > 0 else 0
                }
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_engagement_metrics failed: {e}")
                return {
                    "avgLinksPerActiveUser": 0,
                    "avgCategoriesPerUser": 0,
                    "avgCollectionsPerUser": 0,
                    "usersWithCollections": 0,
                    "usersWithMultipleCategories": 0,
                    "collectionAdoptionRate": 0
                }
        
        async def get_retention_metrics():
            """Calculate retention and churn indicators"""
            try:
                # Users who were active in previous period
                previous_period_start = start_date_obj - (end_date_obj - start_date_obj)
                previous_period_end = start_date_obj
                
                # Users active in previous period
                previous_active = await db.links.aggregate([
                    {"$match": {
                        "$or": [
                            {"createdAt": {"$gte": previous_period_start, "$lte": previous_period_end}},
                            {"updatedAt": {"$gte": previous_period_start, "$lte": previous_period_end}}
                        ]
                    }},
                    {"$group": {"_id": "$userId"}},
                    {"$count": "total"}
                ]).to_list(1)
                
                previous_active_count = previous_active[0]["total"] if previous_active and previous_active[0].get("total") else 0
                
                # Users active in current period
                current_active = active_users  # Already calculated
                
                # Users active in both periods (retained)
                retained_users = await db.links.aggregate([
                    {"$match": {
                        "$or": [
                            {"createdAt": {"$gte": previous_period_start, "$lte": previous_period_end}},
                            {"updatedAt": {"$gte": previous_period_start, "$lte": previous_period_end}}
                        ]
                    }},
                    {"$group": {"_id": "$userId"}},
                    {"$project": {"userId": "$_id"}}
                ]).to_list(10000)
                
                retained_user_ids = {u["userId"] for u in retained_users}
                
                current_active_users = await db.links.aggregate([
                    {"$match": {
                        "$or": [
                            {"createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}},
                            {"updatedAt": {"$gte": start_date_obj, "$lte": end_date_obj}}
                        ]
                    }},
                    {"$group": {"_id": "$userId"}},
                    {"$project": {"userId": "$_id"}}
                ]).to_list(10000)
                
                current_active_user_ids = {u["userId"] for u in current_active_users}
                retained_count = len(retained_user_ids & current_active_user_ids)
                
                # Churned users (active in previous but not current)
                churned_count = len(retained_user_ids - current_active_user_ids)
                
                retention_rate = round((retained_count / previous_active_count * 100), 1) if previous_active_count > 0 else 0
                churn_rate = round((churned_count / previous_active_count * 100), 1) if previous_active_count > 0 else 0
                
                return {
                    "retentionRate": retention_rate,
                    "churnRate": churn_rate,
                    "retainedUsers": retained_count,
                    "churnedUsers": churned_count,
                    "previousPeriodActive": previous_active_count
                }
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_retention_metrics failed: {e}")
                return {
                    "retentionRate": 0,
                    "churnRate": 0,
                    "retainedUsers": 0,
                    "churnedUsers": 0,
                    "previousPeriodActive": 0
                }
        
        async def get_feature_adoption():
            """Calculate feature adoption rates"""
            try:
                # Collection usage
                users_with_collections = await db.collections.aggregate([
                    {"$group": {"_id": "$userId"}},
                    {"$count": "total"}
                ]).to_list(1)
                collection_users = users_with_collections[0]["total"] if users_with_collections and users_with_collections[0].get("total") else 0
                
                # Favorite usage
                users_with_favorites = await db.links.aggregate([
                    {"$match": {"isFavorite": True}},
                    {"$group": {"_id": "$userId"}},
                    {"$count": "total"}
                ]).to_list(1)
                favorite_users = users_with_favorites[0]["total"] if users_with_favorites and users_with_favorites[0].get("total") else 0
                
                # Archive usage
                users_with_archived = await db.links.aggregate([
                    {"$match": {"isArchived": True}},
                    {"$group": {"_id": "$userId"}},
                    {"$count": "total"}
                ]).to_list(1)
                archived_users = users_with_archived[0]["total"] if users_with_archived and users_with_archived[0].get("total") else 0
                
                # Tags usage (users who have links with tags)
                users_with_tags = await db.links.aggregate([
                    {"$match": {"tags": {"$exists": True, "$ne": [], "$not": {"$size": 0}}}},
                    {"$group": {"_id": "$userId"}},
                    {"$count": "total"}
                ]).to_list(1)
                tags_users = users_with_tags[0]["total"] if users_with_tags and users_with_tags[0].get("total") else 0
                
                return {
                    "collectionAdoption": round((collection_users / total_users * 100), 1) if total_users > 0 else 0,
                    "favoriteAdoption": round((favorite_users / total_users * 100), 1) if total_users > 0 else 0,
                    "archiveAdoption": round((archived_users / total_users * 100), 1) if total_users > 0 else 0,
                    "tagsAdoption": round((tags_users / total_users * 100), 1) if total_users > 0 else 0,
                    "collectionUsers": collection_users,
                    "favoriteUsers": favorite_users,
                    "archiveUsers": archived_users,
                    "tagsUsers": tags_users
                }
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_feature_adoption failed: {e}")
                return {
                    "collectionAdoption": 0,
                    "favoriteAdoption": 0,
                    "archiveAdoption": 0,
                    "tagsAdoption": 0,
                    "collectionUsers": 0,
                    "favoriteUsers": 0,
                    "archiveUsers": 0,
                    "tagsUsers": 0
                }
        
        # Execute all remaining queries in parallel
        user_growth, links_growth, top_categories, content_types, avg_links_per_user, active_users, users_approaching, extension_versions, user_segmentation, engagement_metrics, retention_metrics, feature_adoption = await asyncio.gather(
            get_user_growth(),
            get_links_growth(),
            get_top_categories(),
            get_content_types(),
            get_avg_links_per_user(),
            get_active_users(),
            get_users_approaching(),
            get_extension_versions(),
            get_user_segmentation(),
            get_engagement_metrics(),
            get_retention_metrics(),
            get_feature_adoption()
        )
        
        inactive_users = total_users - active_users if total_users >= active_users else 0
        
        result = {
            "summary": {
                "totalUsers": total_users,
                "extensionUsers": extension_users,
                "totalLinks": total_links,
                "extensionLinks": extension_links,
                "webLinks": web_links,
                "totalStorageBytes": total_storage_bytes,
                "totalStorageKB": round(total_storage_bytes / 1024, 2),
                "totalStorageMB": round(total_storage_bytes / (1024 * 1024), 2),
                "averageLinksPerUser": round(avg_links_per_user, 2),
                "activeUsers": active_users,
                "inactiveUsers": inactive_users
            },
            "growth": {
                "userGrowth": user_growth,
                "linksGrowth": links_growth
            },
            "topCategories": top_categories,
            "contentTypes": content_types,
            "extensionVersions": extension_versions,
            "usersApproachingLimits": len(users_approaching),
            # ✅ PM-FOCUSED METRICS
            "userSegmentation": user_segmentation,
            "engagement": engagement_metrics,
            "retention": retention_metrics,
            "featureAdoption": feature_adoption,
            "dateRange": {
                "startDate": start_date_obj.isoformat(),
                "endDate": end_date_obj.isoformat()
            }
        }
        
        # Cache the result
        set_cached_analytics(cache_key, result)
        
        # Log analytics access
        await log_system_event("admin_analytics_access", {
            "dateRange": f"{start_date_obj.date()} to {end_date_obj.date()}",
            "adminEmail": current_user.get("email")
        }, current_user.get("sub"), "info")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        error_msg = f"{str(e)}\n\nTraceback:\n{error_trace}"
        logger.error(f"[ANALYTICS ERROR] {error_msg}")
        await log_system_event("admin_analytics_error", {
            "error": str(e),
            "traceback": error_trace,
            "dateRange": f"{start_date if start_date else 'default'} to {end_date if end_date else 'default'}"
        }, current_user.get("sub") if current_user else None, "error")
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")


@router.get("/admin/users")
async def get_admin_users(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None),
    active_only: Optional[bool] = Query(None),
    current_user: dict = Depends(check_admin_access),
    db = Depends(get_database)
):
    """
    Get paginated list of all users with their statistics
    Default: 25 users per page
    """
    try:
        # Build match filters
        match_filters = []
        
        # Get all unique users with their stats
        pipeline = [
            {"$group": {
                "_id": "$userId",
                "linkCount": {"$sum": 1},
                "firstLinkDate": {"$min": "$createdAt"},
                "lastLinkDate": {"$max": "$updatedAt"},
                "storage": {
                    "$sum": {
                        "$add": [
                            {"$strLenCP": {"$ifNull": ["$title", ""]}},
                            {"$strLenCP": {"$ifNull": ["$url", ""]}},
                            {"$strLenCP": {"$ifNull": ["$description", ""]}},
                            {"$strLenCP": {"$ifNull": ["$content", ""]}},
                            300
                        ]
                    }
                },
                "extensionLinks": {
                    "$sum": {"$cond": [{"$eq": ["$source", "extension"]}, 1, 0]}
                },
                "favoriteLinks": {
                    "$sum": {"$cond": [{"$eq": ["$isFavorite", True]}, 1, 0]}
                },
                "archivedLinks": {
                    "$sum": {"$cond": [{"$eq": ["$isArchived", True]}, 1, 0]}
                }
            }}
        ]
        
        # Filter by activity (30 days threshold) - APPLIED AFTER GROUPING
        if active_only is not None:
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            if active_only:
                # Active: Has activity in last 30 days
                pipeline.append({
                    "$match": {
                        "lastLinkDate": {"$gte": thirty_days_ago}
                    }
                })
            else:
                # Inactive: No activity in last 30 days
                pipeline.append({
                    "$match": {
                        "$or": [
                            {"lastLinkDate": {"$lt": thirty_days_ago}},
                            {"lastLinkDate": None}
                        ]
                    }
                })
        
        if match_filters:
            pipeline.insert(0, {"$match": {"$and": match_filters}})

        
        # Apply search filter BEFORE grouping if provided
        if search:
            search_regex = {"$regex": search, "$options": "i"}
            
            # 1. Search for matching userIds directly
            user_match_query = {"userId": search_regex}
            
            # 2. Search for matching emails in system_logs to find associated userIds
            try:
                email_search_pipeline = [
                    {"$match": {"email": search_regex, "userId": {"$ne": None}}},
                    {"$group": {"_id": "$userId"}}
                ]
                email_matches = await db.system_logs.aggregate(email_search_pipeline).to_list(1000)
                found_user_ids = [doc["_id"] for doc in email_matches]
                
                if found_user_ids:
                    # If we found users by email, match either ID regex OR exact ID from email lookup
                    pipeline.insert(0, {
                        "$match": {
                            "$or": [
                                {"userId": search_regex},
                                {"userId": {"$in": found_user_ids}}
                            ]
                        }
                    })
                else:
                    # Only match ID regex
                    pipeline.insert(0, {"$match": {"userId": search_regex}})
                    
            except Exception as e:
                logger.info(f"[ADMIN SEARCH ERROR] Failed to search emails: {e}")
                # Fallback to just ID search
                pipeline.insert(0, {"$match": {"userId": search_regex}})
        
        # Add sorting
        pipeline.append({"$sort": {"linkCount": -1}})
        
        # Get total count (before pagination)
        count_pipeline = pipeline + [{"$count": "total"}]
        count_result = await db.links.aggregate(count_pipeline).to_list(1)
        total_count = count_result[0]["total"] if count_result else 0
        
        # Add pagination
        pipeline.append({"$skip": (page - 1) * limit})
        pipeline.append({"$limit": limit})
        
        # Execute aggregation
        users = await db.links.aggregate(pipeline).to_list(limit)
        
        # Collect user IDs for email lookup
        user_ids = [u["_id"] for u in users]
        
        # Lookup emails from system_logs (most recent log entry with email for each user)
        user_emails = {}
        if user_ids:
            try:
                email_pipeline = [
                    {"$match": {
                        "userId": {"$in": user_ids},
                        "email": {"$exists": True, "$ne": None}
                    }},
                    {"$sort": {"timestamp": -1}},
                    {"$group": {
                        "_id": "$userId",
                        "email": {"$first": "$email"}
                    }}
                ]
                email_results = await db.system_logs.aggregate(email_pipeline).to_list(len(user_ids))
                user_emails = {r["_id"]: r["email"] for r in email_results}
            except Exception as e:
                logger.info(f"[ADMIN USERS WARNING] Failed to fetch user emails: {e}")
        
        # Transform results
        user_list = []
        for user in users:
            user_id = user["_id"]
            is_active = (datetime.utcnow() - user["lastLinkDate"]).days <= 30 if user.get("lastLinkDate") else False
            
            user_list.append({
                "userId": user_id,
                "email": user_emails.get(user_id),
                "linkCount": user["linkCount"],
                "storageBytes": user["storage"],
                "storageKB": round(user["storage"] / 1024, 2),
                "extensionLinks": user["extensionLinks"],
                "webLinks": user["linkCount"] - user["extensionLinks"],
                "favoriteLinks": user["favoriteLinks"],
                "archivedLinks": user["archivedLinks"],
                "firstLinkDate": user["firstLinkDate"].isoformat() if user.get("firstLinkDate") else None,
                "lastLinkDate": user["lastLinkDate"].isoformat() if user.get("lastLinkDate") else None,
                "isActive": is_active,
                "approachingLimit": user["linkCount"] >= 35 or user["storage"] >= 35 * 1024
            })
        
        return {
            "users": user_list,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "totalPages": (total_count + limit - 1) // limit
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        error_msg = f"{str(e)}\n\nTraceback:\n{error_trace}"
        logger.info(f"[ADMIN USERS ERROR] {error_msg}")
        await log_system_event("admin_users_error", {
            "error": str(e),
            "traceback": error_trace,
            "page": page,
            "limit": limit,
            "search": search,
            "active_only": active_only
        }, current_user.get("sub") if current_user else None, "error")
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")


@router.get("/admin/activity")
async def get_admin_activity(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: dict = Depends(check_admin_access),
    db = Depends(get_database)
):
    """
    Get activity metrics for date ranges
    Default: Last 7 days
    """
    try:
        # Parse date range (default: last 7 days)
        end_date_obj = datetime.utcnow()
        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
        
        start_date_obj = end_date_obj - timedelta(days=7)
        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
        
        # New users in period
        new_users_pipeline = [
            {"$match": {
                "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
            }},
            {"$group": {
                "_id": "$userId",
                "firstLinkDate": {"$min": "$createdAt"}
            }},
            {"$match": {
                "firstLinkDate": {"$gte": start_date_obj, "$lte": end_date_obj}
            }},
            {"$count": "total"}
        ]
        new_users_result = await db.links.aggregate(new_users_pipeline).to_list(1)
        new_users = new_users_result[0]["total"] if new_users_result else 0
        
        # Links created in period
        links_created = await db.links.count_documents({
            "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
        })
        
        # Extension links created
        extension_links = await db.links.count_documents({
            "source": "extension",
            "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
        })
        
        # Daily breakdown
        daily_activity_pipeline = [
            {"$match": {
                "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
            }},
            {"$group": {
                "_id": {
                    "year": {"$year": "$createdAt"},
                    "month": {"$month": "$createdAt"},
                    "day": {"$dayOfMonth": "$createdAt"}
                },
                "linksCreated": {"$sum": 1},
                "extensionLinks": {
                    "$sum": {"$cond": [{"$eq": ["$source", "extension"]}, 1, 0]}
                },
                "newUsers": {"$addToSet": "$userId"}
            }},
            {"$project": {
                "date": {
                    "$dateFromParts": {
                        "year": "$_id.year",
                        "month": "$_id.month",
                        "day": "$_id.day"
                    }
                },
                "linksCreated": 1,
                "extensionLinks": 1,
                "webLinks": {"$subtract": ["$linksCreated", "$extensionLinks"]},
                "newUsers": {"$size": "$newUsers"}
            }},
            {"$sort": {"date": 1}}
        ]
        daily_activity = await db.links.aggregate(daily_activity_pipeline).to_list(1000)
        
        return {
            "summary": {
                "newUsers": new_users,
                "linksCreated": links_created,
                "extensionLinks": extension_links,
                "webLinks": links_created - extension_links
            },
            "dailyActivity": daily_activity,
            "dateRange": {
                "startDate": start_date_obj.isoformat(),
                "endDate": end_date_obj.isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await log_system_event("admin_activity_error", {
            "error": str(e)
        }, current_user.get("sub") if current_user else None, "error")
        raise HTTPException(status_code=500, detail=f"Failed to fetch activity: {str(e)}")


@router.get("/admin/logs")
async def get_admin_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    log_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    include_stats: bool = Query(False, description="Include log statistics"),
    current_user: dict = Depends(check_admin_access),
    db = Depends(get_database)
):
    """
    Get system logs with filtering and pagination
    ✅ Enhanced: Now includes optional statistics for PM analysis
    """
    try:
        # Build match filters
        match_filters = {}
        
        if log_type:
            match_filters["type"] = log_type
        
        if severity:
            match_filters["severity"] = severity
        
        if start_date or end_date:
            date_filter = {}
            if start_date:
                try:
                    date_filter["$gte"] = datetime.strptime(start_date, "%Y-%m-%d")
                except ValueError:
                    raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
            if end_date:
                try:
                    date_filter["$lte"] = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
                except ValueError:
                    raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
            match_filters["timestamp"] = date_filter
        
        # Build pipeline
        pipeline = []
        if match_filters:
            pipeline.append({"$match": match_filters})
            
        # Apply search filter in DB if provided
        if search:
            search_regex = {"$regex": search, "$options": "i"}
            pipeline.append({
                "$match": {
                    "$or": [
                        {"type": search_regex},
                        {"severity": search_regex},
                        {"userId": search_regex},
                        {"email": search_regex}
                    ]
                }
            })
        
        # Get total count
        count_pipeline = pipeline + [{"$count": "total"}]
        count_result = await db.system_logs.aggregate(count_pipeline).to_list(1)
        total_count = count_result[0]["total"] if count_result else 0
        
        # ✅ NEW: Calculate statistics if requested
        stats = None
        if include_stats:
            try:
                # Severity distribution
                severity_pipeline = pipeline + [
                    {"$group": {"_id": "$severity", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}}
                ]
                severity_dist = await db.system_logs.aggregate(severity_pipeline).to_list(10)
                
                # Type distribution
                type_pipeline = pipeline + [
                    {"$group": {"_id": "$type", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}},
                    {"$limit": 20}
                ]
                type_dist = await db.system_logs.aggregate(type_pipeline).to_list(20)
                
                # Error rate (errors + critical / total)
                error_pipeline = pipeline + [
                    {"$match": {"severity": {"$in": ["error", "critical"]}}},
                    {"$count": "total"}
                ]
                error_result = await db.system_logs.aggregate(error_pipeline).to_list(1)
                error_count = error_result[0]["total"] if error_result else 0
                error_rate = round((error_count / total_count * 100), 2) if total_count > 0 else 0
                
                # Recent errors (last 24 hours)
                recent_errors_pipeline = [
                    {"$match": {
                        "severity": {"$in": ["error", "critical"]},
                        "timestamp": {"$gte": datetime.utcnow() - timedelta(hours=24)}
                    }},
                    {"$count": "total"}
                ]
                recent_errors_result = await db.system_logs.aggregate(recent_errors_pipeline).to_list(1)
                recent_errors = recent_errors_result[0]["total"] if recent_errors_result else 0
                
                # Logs by hour (last 24 hours for trend)
                hourly_pipeline = [
                    {"$match": {
                        "timestamp": {"$gte": datetime.utcnow() - timedelta(hours=24)}
                    }},
                    {"$group": {
                        "_id": {
                            "year": {"$year": "$timestamp"},
                            "month": {"$month": "$timestamp"},
                            "day": {"$dayOfMonth": "$timestamp"},
                            "hour": {"$hour": "$timestamp"}
                        },
                        "count": {"$sum": 1}
                    }},
                    {"$sort": {"_id": 1}},
                    {"$limit": 24}
                ]
                hourly_logs = await db.system_logs.aggregate(hourly_pipeline).to_list(24)
                
                stats = {
                    "severityDistribution": [
                        {"severity": item["_id"], "count": item["count"]}
                        for item in severity_dist
                    ],
                    "typeDistribution": [
                        {"type": item["_id"], "count": item["count"]}
                        for item in type_dist
                    ],
                    "errorRate": error_rate,
                    "errorCount": error_count,
                    "recentErrors": recent_errors,
                    "totalLogs": total_count,
                    "hourlyTrend": [
                        {
                            "hour": f"{item['_id']['hour']:02d}:00",
                            "count": item["count"]
                        }
                        for item in hourly_logs
                    ]
                }
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] Failed to calculate log stats: {e}")
                stats = None
        
        # Add sorting, pagination
        pipeline.append({"$sort": {"timestamp": DESCENDING}})
        pipeline.append({"$skip": (page - 1) * limit})
        pipeline.append({"$limit": limit})
        
        # Execute
        logs = await db.system_logs.aggregate(pipeline).to_list(limit)
        
        # Transform
        log_list = []
        for log in logs:
            log_entry = {
                "id": str(log["_id"]),
                "type": log.get("type"),
                "timestamp": log.get("timestamp").isoformat() if log.get("timestamp") else None,
                "userId": log.get("userId"),
                "email": log.get("email"),
                "severity": log.get("severity", "info"),
                "details": log.get("details", {})
            }
            log_list.append(log_entry)
        
        result = {
            "logs": log_list,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "totalPages": (total_count + limit - 1) // limit
            }
        }
        
        if stats:
            result["statistics"] = stats
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        await log_system_event("admin_logs_error", {
            "error": str(e)
        }, current_user.get("sub") if current_user else None, "error")
        raise HTTPException(status_code=500, detail=f"Failed to fetch logs: {str(e)}")


@router.get("/admin/categories")
async def get_admin_categories(
    current_user: dict = Depends(check_admin_access),
    db = Depends(get_database)
):
    """
    Get all categories with usage statistics across all users
    """
    try:
        # Get all categories with usage stats
        pipeline = [
            {"$group": {
                "_id": "$category",
                "linkCount": {"$sum": 1},
                "users": {"$addToSet": "$userId"}
            }},
            {"$project": {
                "category": "$_id",
                "linkCount": 1,
                "userCount": {"$size": "$users"}
            }},
            {"$sort": {"linkCount": -1}}
        ]
        
        categories = await db.links.aggregate(pipeline).to_list(1000)
        
        return {
            "categories": [
                {
                    "name": cat["category"],
                    "linkCount": cat["linkCount"],
                    "userCount": cat["userCount"]
                }
                for cat in categories
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await log_system_event("admin_categories_error", {
            "error": str(e)
        }, current_user.get("sub") if current_user else None, "error")
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")


class MergeCategoriesRequest(BaseModel):
    source_category: str
    target_category: str

@router.post("/admin/categories/merge")
async def merge_categories(
    request: MergeCategoriesRequest,
    current_user: dict = Depends(check_admin_access),
    db = Depends(get_database)
):
    """
    Merge two categories - moves all links from source to target
    """
    try:
        source_normalized = request.source_category.lower().strip()
        target_normalized = request.target_category.lower().strip()
        
        if source_normalized == target_normalized:
            raise HTTPException(status_code=400, detail="Source and target categories cannot be the same")
        
        # Update all links with source category to target category
        result = await db.links.update_many(
            {"category": source_normalized},
            {"$set": {"category": target_normalized}}
        )
        
        await log_system_event("admin_category_merge", {
            "sourceCategory": request.source_category,
            "targetCategory": request.target_category,
            "linksMoved": result.modified_count
        }, current_user.get("sub"), "info")
        
        return {
            "message": f"Successfully merged '{request.source_category}' into '{request.target_category}'",
            "linksMoved": result.modified_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await log_system_event("admin_category_merge_error", {
            "error": str(e)
        }, current_user.get("sub") if current_user else None, "error")
        raise HTTPException(status_code=500, detail=f"Failed to merge categories: {str(e)}")


@router.delete("/admin/categories/{category_name}")
async def delete_global_category(
    category_name: str,
    reassign_to: Optional[str] = Query("other", description="Category to reassign links to"),
    current_user: dict = Depends(check_admin_access),
    db = Depends(get_database)
):
    """
    Delete a category globally - reassigns all links to another category
    """
    try:
        category_normalized = category_name.lower().strip()
        reassign_normalized = reassign_to.lower().strip()
        
        if category_normalized == reassign_normalized:
            raise HTTPException(status_code=400, detail="Cannot reassign to the same category")
        
        # Update all links with this category
        result = await db.links.update_many(
            {"category": category_normalized},
            {"$set": {"category": reassign_normalized}}
        )
        
        await log_system_event("admin_category_delete", {
            "deletedCategory": category_name,
            "reassignedTo": reassign_to,
            "linksReassigned": result.modified_count
        }, current_user.get("sub"), "info")
        
        return {
            "message": f"Successfully deleted category '{category_name}'",
            "linksReassigned": result.modified_count,
            "reassignedTo": reassign_to
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await log_system_event("admin_category_delete_error", {
            "error": str(e)
        }, current_user.get("sub") if current_user else None, "error")
        raise HTTPException(status_code=500, detail=f"Failed to delete category: {str(e)}")


@router.get("/admin/users/{user_id}/limits")
async def get_user_limits(
    user_id: str,
    current_user: dict = Depends(check_admin_access),
    db = Depends(get_database)
):
    """
    Get user limits (including overrides if any)
    """
    try:
        # Check for overrides in a user_limits collection (create if doesn't exist)
        limits = await db.user_limits.find_one({"userId": user_id})
        
        defaults = {
            "linksLimit": settings.MAX_LINKS_PER_USER,
            "storageLimitBytes": settings.MAX_STORAGE_PER_USER_BYTES
        }
        
        if limits:
            return {
                "userId": user_id,
                "linksLimit": limits.get("linksLimit", defaults["linksLimit"]),
                "storageLimitBytes": limits.get("storageLimitBytes", defaults["storageLimitBytes"]),
                "storageLimitKB": limits.get("storageLimitBytes", defaults["storageLimitBytes"]) // 1024,
                "isOverridden": True,
                "overriddenAt": limits.get("updatedAt").isoformat() if limits.get("updatedAt") else None
            }
        
        return {
            "userId": user_id,
            "linksLimit": defaults["linksLimit"],
            "storageLimitBytes": defaults["storageLimitBytes"],
            "storageLimitKB": defaults["storageLimitBytes"] // 1024,
            "isOverridden": False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await log_system_event("admin_user_limits_error", {
            "error": str(e),
            "userId": user_id
        }, current_user.get("sub") if current_user else None, "error")
        raise HTTPException(status_code=500, detail=f"Failed to fetch user limits: {str(e)}")


@router.put("/admin/users/{user_id}/limits")
async def update_user_limits(
    user_id: str,
    links_limit: Optional[int] = Query(None, ge=1),
    storage_limit_kb: Optional[int] = Query(None, ge=1),
    current_user: dict = Depends(check_admin_access),
    db = Depends(get_database)
):
    """
    Manually adjust user limits
    """
    try:
        update_data = {
            "userId": user_id,
            "updatedAt": datetime.utcnow(),
            "updatedBy": current_user.get("email")
        }
        
        if links_limit is not None:
            update_data["linksLimit"] = links_limit
        
        if storage_limit_kb is not None:
            update_data["storageLimitBytes"] = storage_limit_kb * 1024
        
        # Upsert user limits
        await db.user_limits.update_one(
            {"userId": user_id},
            {"$set": update_data},
            upsert=True
        )
        
        await log_system_event("admin_user_limits_update", {
            "userId": user_id,
            "linksLimit": links_limit,
            "storageLimitKB": storage_limit_kb,
            "adminEmail": current_user.get("email")
        }, current_user.get("sub"), "info")
        
        return {
            "message": "User limits updated successfully",
            "userId": user_id,
            "linksLimit": links_limit,
            "storageLimitKB": storage_limit_kb
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await log_system_event("admin_user_limits_update_error", {
            "error": str(e),
            "userId": user_id
        }, current_user.get("sub") if current_user else None, "error")
        raise HTTPException(status_code=500, detail=f"Failed to update user limits: {str(e)}")


@router.delete("/admin/users/{user_id}/limits")
async def reset_user_limits(
    user_id: str,
    current_user: dict = Depends(check_admin_access),
    db = Depends(get_database)
):
    """
    Reset user limits to defaults (remove overrides)
    """
    try:
        result = await db.user_limits.delete_one({"userId": user_id})
        
        await log_system_event("admin_user_limits_reset", {
            "userId": user_id,
            "adminEmail": current_user.get("email")
        }, current_user.get("sub"), "info")
        
        return {
            "message": "User limits reset to defaults",
            "userId": user_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await log_system_event("admin_user_limits_reset_error", {
            "error": str(e),
            "userId": user_id
        }, current_user.get("sub") if current_user else None, "error")
        raise HTTPException(status_code=500, detail=f"Failed to reset user limits: {str(e)}")

