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

router = APIRouter()

# Simple in-memory cache for analytics (in production, use Redis)
_analytics_cache = {}
_cache_timestamps = {}

# Public debug endpoint that only requires authentication (not admin)
# This helps diagnose admin access issues
@router.get("/debug-token")
async def debug_token_public(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Public debug endpoint to inspect token contents
    Only requires authentication (not admin) - helps diagnose authentication issues
    """
    from jose import jwt
    from services.auth import extract_email_from_payload, get_current_user
    from core.config import settings
    import traceback
    
    try:
        # Try to get current user (may fail if token is invalid)
        try:
            current_user = await get_current_user(credentials)
        except Exception as user_error:
            current_user = {"error": str(user_error)}
        
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
        
        # Test Auth0 userinfo endpoint
        userinfo_email = None
        userinfo_result = None
        userinfo_error = None
        try:
            from services.auth import fetch_email_from_auth0
            import httpx
            user_id = payload.get("sub")
            if user_id:
                print(f"[DEBUG-TOKEN] Testing userinfo for user {user_id}")
                userinfo_email = await fetch_email_from_auth0(token, user_id)
                # Also try direct call to show full response
                userinfo_url = f"https://{settings.AUTH0_DOMAIN}/userinfo"
                async with httpx.AsyncClient(timeout=5.0) as client:
                    userinfo_response = await client.get(
                        userinfo_url,
                        headers={"Authorization": f"Bearer {token}"}
                    )
                    if userinfo_response.status_code == 200:
                        userinfo_result = userinfo_response.json()
                    else:
                        userinfo_error = {
                            "status": userinfo_response.status_code,
                            "text": userinfo_response.text[:500],
                            "headers": dict(userinfo_response.headers)
                        }
        except Exception as e:
            userinfo_error = {"error": str(e), "type": type(e).__name__}
        
        # Check admin status - use email from token, userinfo, or current_user
        final_email = extracted_email or userinfo_email or current_user.get("email")
        is_admin = False
        if final_email:
            is_admin = final_email.lower() in [email.lower() for email in settings.ADMIN_EMAILS]
        
        return {
            "status": "success",
            "currentUser": current_user,
            "tokenInfo": {
                "sub": payload.get("sub"),
                "email": extracted_email,
                "emailFromToken": extracted_email,
                "emailFromUserinfo": userinfo_email,
                "finalEmail": final_email,
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
                "scope": payload.get("scope"),
            },
            "userinfoTest": {
                "success": userinfo_result is not None,
                "error": userinfo_error,
                "fullResponse": userinfo_result,
                "emailExtracted": userinfo_email,
            },
            "adminCheck": {
                "extractedEmail": final_email,
                "emailFromToken": extracted_email,
                "emailFromUserinfo": userinfo_email,
                "adminEmails": settings.ADMIN_EMAILS,
                "isAdmin": is_admin,
                "reason": "admin" if is_admin else f"Email '{final_email}' not in admin list {settings.ADMIN_EMAILS}" if final_email else "No email found in token or userinfo"
            },
            "allPayloadKeys": list(payload.keys())
        }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "error": str(e),
            "errorType": type(e).__name__,
            "traceback": traceback.format_exc()
        }

# Simple in-memory cache for analytics (in production, use Redis)
_analytics_cache = {}
_cache_timestamps = {}

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
            pipeline = [
                {"$group": {"_id": "$userId"}},
                {"$count": "total"}
            ]
            result = await db.links.aggregate(pipeline).to_list(1)
            return result[0]["total"] if result else 0
        
        async def get_extension_users():
            pipeline = [
                {"$match": {"source": "extension"}},
                {"$group": {"_id": "$userId"}},
                {"$count": "total"}
            ]
            result = await db.links.aggregate(pipeline).to_list(1)
            return result[0]["total"] if result else 0
        
        async def get_total_links():
            return await db.links.count_documents({
                "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
            })
        
        async def get_extension_links():
            return await db.links.count_documents({
                "source": "extension",
                "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
            })
        
        async def get_storage():
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
            return result[0]["total"] if result else 0
        
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
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        async def get_user_growth():
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
        
        async def get_links_growth():
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
        
        async def get_top_categories():
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
        
        async def get_content_types():
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
        
        async def get_avg_links_per_user():
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
        
        async def get_active_users():
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
            return result[0]["total"] if result else 0
        
        async def get_users_approaching():
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
                }},
                {"$match": {
                    "$or": [
                        {"linkCount": {"$gte": 35}},
                        {"storage": {"$gte": 35 * 1024}}  # 35KB
                    ]
                }}
            ]
            return await db.links.aggregate(pipeline).to_list(100)
        
        async def get_extension_versions():
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
        
        # Execute all remaining queries in parallel
        user_growth, links_growth, top_categories, content_types, avg_links_per_user, active_users, users_approaching, extension_versions = await asyncio.gather(
            get_user_growth(),
            get_links_growth(),
            get_top_categories(),
            get_content_types(),
            get_avg_links_per_user(),
            get_active_users(),
            get_users_approaching(),
            get_extension_versions()
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
        await log_system_event("admin_analytics_error", {
            "error": str(e)
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
        
        # Filter by activity (30 days threshold)
        if active_only is not None:
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            if active_only:
                match_filters.append({
                    "$or": [
                        {"createdAt": {"$gte": thirty_days_ago}},
                        {"updatedAt": {"$gte": thirty_days_ago}}
                    ]
                })
        
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
        
        if match_filters:
            pipeline.insert(0, {"$match": {"$and": match_filters}})
        
        # Add sorting
        pipeline.append({"$sort": {"linkCount": -1}})
        
        # Get total count
        count_pipeline = pipeline + [{"$count": "total"}]
        count_result = await db.links.aggregate(count_pipeline).to_list(1)
        total_count = count_result[0]["total"] if count_result else 0
        
        # Add pagination
        pipeline.append({"$skip": (page - 1) * limit})
        pipeline.append({"$limit": limit})
        
        # Execute aggregation
        users = await db.links.aggregate(pipeline).to_list(limit)
        
        # Transform results
        user_list = []
        for user in users:
            user_id = user["_id"]
            is_active = (datetime.utcnow() - user["lastLinkDate"]).days <= 30 if user.get("lastLinkDate") else False
            
            user_list.append({
                "userId": user_id,
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
        
        # Filter by search if provided
        if search:
            search_lower = search.lower()
            user_list = [
                u for u in user_list
                if search_lower in u["userId"].lower()
            ]
        
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
        await log_system_event("admin_users_error", {
            "error": str(e)
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
    current_user: dict = Depends(check_admin_access),
    db = Depends(get_database)
):
    """
    Get system logs with filtering and pagination
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
        
        # Get total count
        count_pipeline = pipeline + [{"$count": "total"}]
        count_result = await db.system_logs.aggregate(count_pipeline).to_list(1)
        total_count = count_result[0]["total"] if count_result else 0
        
        # Add sorting, pagination
        pipeline.append({"$sort": {"timestamp": DESCENDING}})
        pipeline.append({"$skip": (page - 1) * limit})
        pipeline.append({"$limit": limit})
        
        # Execute
        logs = await db.system_logs.aggregate(pipeline).to_list(limit)
        
        # Transform and filter by search if needed
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
            
            # Apply search filter
            if search:
                search_lower = search.lower()
                if not any(
                    search_lower in str(v).lower()
                    for v in log_entry.values()
                    if v is not None
                ):
                    continue
            
            log_list.append(log_entry)
        
        return {
            "logs": log_list,
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

