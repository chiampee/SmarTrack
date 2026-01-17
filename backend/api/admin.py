"""
Admin API endpoints
Provides analytics and management functionality for admin users only
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPAuthorizationCredentials
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
from services.mongodb import get_database
from services.admin import check_admin_access, log_system_event
from services.auth import security
from services.analytics import AnalyticsService
from core.config import settings
from pymongo import DESCENDING
import time
import asyncio
import logging

logger = logging.getLogger(__name__)

# MongoDB Operators - Constants to avoid string duplication
OP_MATCH = "$match"
OP_GROUP = "$group"
OP_PROJECT = "$project"
OP_COUNT = "$count"
OP_SORT = "$sort"
OP_SUM = "$sum"
OP_ADD = "$add"
OP_IFNULL = "$ifNull"
OP_STRLEN = "$strLenCP"
OP_COND = "$cond"
OP_EQ = "$eq"
OP_SUBTRACT = "$subtract"
OP_DATE_PARTS = "$dateFromParts"
OP_EXISTS = "$exists"
OP_ADDTOSET = "$addToSet"
OP_LIMIT = "$limit"
OP_SKIP = "$skip"

# Field Names - Constants to avoid string duplication
F_USERID = "$userId"
F_CREATED = "$createdAt"
F_UPDATED = "$updatedAt"
F_SOURCE = "$source"
F_CATEGORY = "$category"
F_TITLE = "$title"
F_URL = "$url"
F_DESC = "$description"
F_CONTENT = "$content"
F_TAGS = "$tags"
F_IS_FAV = "$isFavorite"
F_IS_ARCH = "$isArchived"
F_EXT_VER = "$extensionVersion"

# Date Parts - Constants to avoid string duplication
F_YEAR = "$_id.year"
F_MONTH = "$_id.month"
F_DAY = "$_id.day"

# Error Messages - Constants to avoid string duplication
ERR_DATE_FMT = "Invalid {field} format. Use YYYY-MM-DD"

router = APIRouter()

# Simple in-memory cache for analytics (in production, use Redis)
_analytics_cache = {}
_cache_timestamps = {}

def parse_date_range(start_str: Optional[str], end_str: Optional[str]) -> Tuple[datetime, datetime]:
    """
    Parse date range from query parameters
    Returns (start_date, end_date) tuple
    Default: last 7 days
    """
    end_date_obj = datetime.now(timezone.utc)
    if end_str:
        try:
            end_date_obj = datetime.strptime(end_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
    
    start_date_obj = end_date_obj - timedelta(days=7)
    if start_str:
        try:
            start_date_obj = datetime.strptime(start_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
    
    return start_date_obj, end_date_obj

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

@router.get("/admin/check")
async def check_admin_status(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Check if current user is an admin
    Returns only a boolean - does not expose admin email list
    ✅ SECURE: Admin emails are never exposed to client
    """
    try:
        # Try to get admin access - if successful, user is admin
        await check_admin_access(credentials)
        return {"isAdmin": True}
    except HTTPException:
        # If check_admin_access raises exception, user is not admin
        return {"isAdmin": False}
    except Exception:
        # On any other error, assume not admin for security
        return {"isAdmin": False}


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
        end_date_obj = datetime.now(timezone.utc)
        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=400, detail=ERR_DATE_FMT.format(field="end_date"))
        
        start_date_obj = end_date_obj - timedelta(days=7)
        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=400, detail=ERR_DATE_FMT.format(field="start_date"))
        
        # Check cache
        cache_key = f"analytics_{start_date_obj.date()}_{end_date_obj.date()}"
        cached = get_cached_analytics(cache_key)
        if cached:
            return cached
        
        # Generate report using AnalyticsService
        result = await AnalyticsService.generate_report(db, start_date_obj, end_date_obj)
        
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
                {OP_GROUP: {
                "_id": F_USERID,
                "linkCount": {OP_SUM: 1},
                "firstLinkDate": {"$min": F_CREATED},
                "lastLinkDate": {"$max": F_UPDATED},
                "storage": {
                    OP_SUM: {
                        OP_ADD: [
                            {OP_STRLEN: {OP_IFNULL: [F_TITLE, ""]}},
                            {OP_STRLEN: {OP_IFNULL: [F_URL, ""]}},
                            {OP_STRLEN: {OP_IFNULL: [F_DESC, ""]}},
                            {OP_STRLEN: {OP_IFNULL: [F_CONTENT, ""]}},
                            300
                        ]
                    }
                },
                "extensionLinks": {
                    OP_SUM: {OP_COND: [{OP_EQ: [F_SOURCE, "extension"]}, 1, 0]}
                },
                "favoriteLinks": {
                    OP_SUM: {OP_COND: [{OP_EQ: [F_IS_FAV, True]}, 1, 0]}
                },
                "archivedLinks": {
                    OP_SUM: {OP_COND: [{"$eq": ["$isArchived", True]}, 1, 0]}
                }
            }}
        ]
        
        # Filter by activity (30 days threshold) - APPLIED AFTER GROUPING
        if active_only is not None:
            thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
            if active_only:
                # Active: Has activity in last 30 days
                pipeline.append({
                    OP_MATCH: {
                        "lastLinkDate": {"$gte": thirty_days_ago}
                    }
                })
            else:
                # Inactive: No activity in last 30 days
                pipeline.append({
                    OP_MATCH: {
                        "$or": [
                            {"lastLinkDate": {"$lt": thirty_days_ago}},
                            {"lastLinkDate": None}
                        ]
                    }
                })
        
        if match_filters:
            pipeline.insert(0, {OP_MATCH: {"$and": match_filters}})

        
        # Apply search filter BEFORE grouping if provided
        if search:
            search_regex = {"$regex": search, "$options": "i"}
            
            # 1. Search for matching userIds directly
            user_match_query = {"userId": search_regex}
            
            # 2. Search for matching emails in system_logs to find associated userIds
            try:
                email_search_pipeline = [
                    {OP_MATCH: {"email": search_regex, "userId": {"$ne": None}}},
                    {OP_GROUP: {"_id": F_USERID}}
                ]
                email_matches = await db.system_logs.aggregate(email_search_pipeline).to_list(1000)
                found_user_ids = [doc["_id"] for doc in email_matches]
                
                if found_user_ids:
                    # If we found users by email, match either ID regex OR exact ID from email lookup
                    pipeline.insert(0, {
                        OP_MATCH: {
                            "$or": [
                                {"userId": search_regex},
                                {"userId": {"$in": found_user_ids}}
                            ]
                        }
                    })
                else:
                    # Only match ID regex
                    pipeline.insert(0, {OP_MATCH: {"userId": search_regex}})
                    
            except Exception as e:
                logger.info(f"[ADMIN SEARCH ERROR] Failed to search emails: {e}")
                # Fallback to just ID search
                pipeline.insert(0, {OP_MATCH: {"userId": search_regex}})
        
        # Add sorting
        pipeline.append({OP_SORT: {"linkCount": -1}})
        
        # Get total count (before pagination)
        count_pipeline = pipeline + [{OP_COUNT: "total"}]
        count_result = await db.links.aggregate(count_pipeline).to_list(1)
        total_count = count_result[0]["total"] if count_result else 0
        
        # Add pagination
        pipeline.append({OP_SKIP: (page - 1) * limit})
        pipeline.append({OP_LIMIT: limit})
        
        # Execute aggregation
        users = await db.links.aggregate(pipeline).to_list(limit)
        
        # Collect user IDs for email lookup
        user_ids = [u["_id"] for u in users]
        
        # Lookup emails from system_logs (most recent log entry with email for each user)
        user_emails = {}
        if user_ids:
            try:
                email_pipeline = [
                    {OP_MATCH: {
                        "userId": {"$in": user_ids},
                        "email": {"$exists": True, "$ne": None}
                    }},
                    {OP_SORT: {"timestamp": -1}},
                    {OP_GROUP: {
                        "_id": F_USERID,
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
            is_active = (datetime.now(timezone.utc) - user["lastLinkDate"]).days <= 30 if user.get("lastLinkDate") else False
            
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
        end_date_obj = datetime.now(timezone.utc)
        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail=ERR_DATE_FMT.format(field="end_date"))
        
        start_date_obj = end_date_obj - timedelta(days=7)
        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail=ERR_DATE_FMT.format(field="start_date"))
        
        # New users in period
        new_users_pipeline = [
            {OP_MATCH: {
                "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
            }},
                {OP_GROUP: {
                "_id": F_USERID,
                "firstLinkDate": {"$min": F_CREATED}
            }},
            {OP_MATCH: {
                "firstLinkDate": {"$gte": start_date_obj, "$lte": end_date_obj}
            }},
            {OP_COUNT: "total"}
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
            {OP_MATCH: {
                "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
            }},
                {OP_GROUP: {
                "_id": {
                    "year": {"$year": "$createdAt"},
                    "month": {"$month": "$createdAt"},
                    "day": {"$dayOfMonth": "$createdAt"}
                },
                "linksCreated": {"$sum": 1},
                "extensionLinks": {
                    OP_SUM: {OP_COND: [{OP_EQ: [F_SOURCE, "extension"]}, 1, 0]}
                },
                "newUsers": {"$addToSet": "$userId"}
            }},
                {OP_PROJECT: {
                "date": {
                    OP_DATE_PARTS: {
                            "year": F_YEAR,
                            "month": F_MONTH,
                            "day": F_DAY
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
                    raise HTTPException(status_code=400, detail=ERR_DATE_FMT.format(field="start_date"))
            if end_date:
                try:
                    date_filter["$lte"] = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
                except ValueError:
                    raise HTTPException(status_code=400, detail=ERR_DATE_FMT.format(field="end_date"))
            match_filters["timestamp"] = date_filter
        
        # Build pipeline
        pipeline = []
        if match_filters:
            pipeline.append({OP_MATCH: match_filters})
            
        # Apply search filter in DB if provided
        if search:
            search_regex = {"$regex": search, "$options": "i"}
            pipeline.append({
                OP_MATCH: {
                    "$or": [
                        {"type": search_regex},
                        {"severity": search_regex},
                        {"userId": search_regex},
                        {"email": search_regex}
                    ]
                }
            })
        
        # Get total count
        count_pipeline = pipeline + [{OP_COUNT: "total"}]
        count_result = await db.system_logs.aggregate(count_pipeline).to_list(1)
        total_count = count_result[0]["total"] if count_result else 0
        
        # ✅ NEW: Calculate statistics if requested
        stats = None
        if include_stats:
            try:
                # Severity distribution
                severity_pipeline = pipeline + [
                    {OP_GROUP: {"_id": "$severity", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}}
                ]
                severity_dist = await db.system_logs.aggregate(severity_pipeline).to_list(10)
                
                # Type distribution
                type_pipeline = pipeline + [
                    {OP_GROUP: {"_id": "$type", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}},
                    {OP_LIMIT: 20}
                ]
                type_dist = await db.system_logs.aggregate(type_pipeline).to_list(20)
                
                # Error rate (errors + critical / total)
                error_pipeline = pipeline + [
                    {OP_MATCH: {"severity": {"$in": ["error", "critical"]}}},
                    {OP_COUNT: "total"}
                ]
                error_result = await db.system_logs.aggregate(error_pipeline).to_list(1)
                error_count = error_result[0]["total"] if error_result else 0
                error_rate = round((error_count / total_count * 100), 2) if total_count > 0 else 0
                
                # Recent errors (last 24 hours)
                recent_errors_pipeline = [
                    {OP_MATCH: {
                        "severity": {"$in": ["error", "critical"]},
                        "timestamp": {"$gte": datetime.now(timezone.utc) - timedelta(hours=24)}
                    }},
                    {OP_COUNT: "total"}
                ]
                recent_errors_result = await db.system_logs.aggregate(recent_errors_pipeline).to_list(1)
                recent_errors = recent_errors_result[0]["total"] if recent_errors_result else 0
                
                # Logs by hour (last 24 hours for trend)
                # Generate all 24 hours first, then fill in actual counts
                now = datetime.now(timezone.utc)
                hourly_trend = []
                hourly_counts = {}
                
                # Get actual log counts by hour
                hourly_pipeline = [
                    {OP_MATCH: {
                        "timestamp": {"$gte": now - timedelta(hours=24)}
                    }},
                    {OP_GROUP: {
                        "_id": {
                            "hour": {"$hour": "$timestamp"}
                        },
                        "count": {"$sum": 1}
                    }}
                ]
                hourly_logs = await db.system_logs.aggregate(hourly_pipeline).to_list(24)
                
                # Create a map of hour -> count
                for item in hourly_logs:
                    hour = item["_id"]["hour"]
                    hourly_counts[hour] = item["count"]
                
                # Generate all 24 hours (last 24 hours from now)
                for i in range(24):
                    hour_time = now - timedelta(hours=23-i)
                    hour = hour_time.hour
                    count = hourly_counts.get(hour, 0)
                    hourly_trend.append({
                        "hour": f"{hour:02d}:00",
                        "count": count
                    })
                
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
                    "hourlyTrend": hourly_trend
                }
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] Failed to calculate log stats: {e}")
                stats = None
        
        # Add sorting, pagination
        pipeline.append({"$sort": {"timestamp": DESCENDING}})
        pipeline.append({OP_SKIP: (page - 1) * limit})
        pipeline.append({OP_LIMIT: limit})
        
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


@router.delete("/admin/logs")
async def delete_all_logs(
    current_user: dict = Depends(check_admin_access),
    db = Depends(get_database)
):
    """
    Delete all system logs
    ⚠️ WARNING: This action is irreversible
    """
    try:
        # Get count before deletion
        total_count = await db.system_logs.count_documents({})
        
        # Delete all logs
        result = await db.system_logs.delete_many({})
        
        # Log the deletion event (this will be the last log entry)
        await log_system_event("admin_logs_delete_all", {
            "deletedCount": result.deleted_count,
            "adminEmail": current_user.get("email")
        }, current_user.get("sub"), "warning")
        
        return {
            "message": f"Successfully deleted {result.deleted_count} logs",
            "deletedCount": result.deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await log_system_event("admin_logs_delete_error", {
            "error": str(e),
            "adminEmail": current_user.get("email")
        }, current_user.get("sub") if current_user else None, "error")
        raise HTTPException(status_code=500, detail=f"Failed to delete logs: {str(e)}")


@router.get("/admin/logs/size")
async def get_logs_size(
    current_user: dict = Depends(check_admin_access),
    db = Depends(get_database)
):
    """
    Get total logs count and estimated size
    """
    try:
        # Get total count
        total_logs = await db.system_logs.count_documents({})
        
        # Estimate size by sampling a few logs and calculating average
        # Then multiply by total count
        sample_size = min(100, total_logs)
        if sample_size > 0:
            sample_logs = await db.system_logs.find({}).limit(sample_size).to_list(sample_size)
            
            # Calculate average size per log
            total_sample_size = 0
            for log in sample_logs:
                # Estimate size: ID + type + timestamp + userId + email + severity + details
                log_size = (
                    len(str(log.get("_id", ""))) +
                    len(str(log.get("type", ""))) +
                    len(str(log.get("timestamp", ""))) +
                    len(str(log.get("userId", ""))) +
                    len(str(log.get("email", ""))) +
                    len(str(log.get("severity", ""))) +
                    len(str(log.get("details", "")))
                )
                total_sample_size += log_size
            
            avg_size_per_log = total_sample_size / sample_size if sample_size > 0 else 500
        else:
            avg_size_per_log = 500  # Default estimate
        
        # Calculate total estimated size
        estimated_size_bytes = int(total_logs * avg_size_per_log)
        estimated_size_kb = estimated_size_bytes / 1024
        estimated_size_mb = estimated_size_kb / 1024
        
        return {
            "totalLogs": total_logs,
            "estimatedSizeBytes": estimated_size_bytes,
            "estimatedSizeKB": round(estimated_size_kb, 2),
            "estimatedSizeMB": round(estimated_size_mb, 2)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await log_system_event("admin_logs_size_error", {
            "error": str(e)
        }, current_user.get("sub") if current_user else None, "error")
        raise HTTPException(status_code=500, detail=f"Failed to calculate logs size: {str(e)}")


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
                {OP_GROUP: {
                "_id": F_CATEGORY,
                "linkCount": {OP_SUM: 1},
                "users": {OP_ADDTOSET: F_USERID}
            }},
                {OP_PROJECT: {
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
            "updatedAt": datetime.now(timezone.utc),
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
        
        async def get_extension_links_in_period():
            """Get extension links created in the specified date range"""
            try:
                return await db.links.count_documents({
                    "source": "extension",
                    "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
                })
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_extension_links_in_period failed: {e}")
                return 0
        
        async def get_storage_all_time():
            """Get total storage used by all links (all-time)"""
            try:
                pipeline = [
                    {OP_PROJECT: {
                        "size": {
                            OP_ADD: [
                                {OP_STRLEN: {OP_IFNULL: [F_TITLE, ""]}},
                                {OP_STRLEN: {OP_IFNULL: [F_URL, ""]}},
                                {OP_STRLEN: {OP_IFNULL: [F_DESC, ""]}},
                                {OP_STRLEN: {OP_IFNULL: [F_CONTENT, ""]}},
                                {"$multiply": [{"$size": {"$ifNull": ["$tags", []]}}, 50]},
                                300  # MongoDB overhead
                            ]
                        }
                    }},
                    {OP_GROUP: {"_id": None, "total": {"$sum": "$size"}}}
                ]
                result = await db.links.aggregate(pipeline).to_list(1)
                return result[0]["total"] if result and result[0].get("total") is not None else 0
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_storage_all_time failed: {e}")
                return 0
        
        async def get_storage_in_period():
            """Get storage used by links created in the specified date range"""
            try:
                pipeline = [
                    {OP_MATCH: {
                        "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
                    }},
                    {OP_PROJECT: {
                        "size": {
                            OP_ADD: [
                                {OP_STRLEN: {OP_IFNULL: [F_TITLE, ""]}},
                                {OP_STRLEN: {OP_IFNULL: [F_URL, ""]}},
                                {OP_STRLEN: {OP_IFNULL: [F_DESC, ""]}},
                                {OP_STRLEN: {OP_IFNULL: [F_CONTENT, ""]}},
                                {"$multiply": [{"$size": {"$ifNull": ["$tags", []]}}, 50]},
                                300  # MongoDB overhead
                            ]
                        }
                    }},
                    {OP_GROUP: {"_id": None, "total": {"$sum": "$size"}}}
                ]
                result = await db.links.aggregate(pipeline).to_list(1)
                return result[0]["total"] if result and result[0].get("total") is not None else 0
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_storage_in_period failed: {e}")
                return 0
        
        # Execute independent queries in parallel
        total_users_all_time, extension_users_all_time, total_links_all_time, links_in_period, extension_links_in_period, storage_all_time, storage_in_period = await asyncio.gather(
            get_total_users_all_time(),
            get_extension_users_all_time(),
            get_total_links_all_time(),
            get_links_in_period(),
            get_extension_links_in_period(),
            get_storage_all_time(),
            get_storage_in_period()
        )
        
        web_links_in_period = links_in_period - extension_links_in_period
        
        # Run remaining queries in parallel for better performance
        async def get_user_growth():
            try:
                pipeline = [
                    {OP_GROUP: {
                        "_id": F_USERID,
                        "firstSeen": {"$min": "$createdAt"}
                    }},
                    {OP_MATCH: {
                        "firstSeen": {"$gte": start_date_obj, "$lte": end_date_obj}
                    }},
                    {OP_GROUP: {
                        "_id": {
                            "year": {"$year": "$firstSeen"},
                            "month": {"$month": "$firstSeen"},
                            "day": {"$dayOfMonth": "$firstSeen"}
                        },
                        "newUsers": {"$sum": 1}
                    }},
                    {OP_PROJECT: {
                        "date": {
                            OP_DATE_PARTS: {
                            "year": F_YEAR,
                            "month": F_MONTH,
                            "day": F_DAY
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
                    {OP_MATCH: {
                        "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
                    }},
                    {OP_GROUP: {
                        "_id": {
                            "year": {"$year": "$createdAt"},
                            "month": {"$month": "$createdAt"},
                            "day": {"$dayOfMonth": "$createdAt"}
                        },
                        "count": {"$sum": 1},
                        "extensionCount": {
                            OP_SUM: {OP_COND: [{OP_EQ: [F_SOURCE, "extension"]}, 1, 0]}
                        }
                    }},
                    {OP_PROJECT: {
                        "date": {
                            OP_DATE_PARTS: {
                            "year": F_YEAR,
                            "month": F_MONTH,
                            "day": F_DAY
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
                    {OP_MATCH: {
                        "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
                    }},
                    {OP_GROUP: {
                        "_id": F_CATEGORY,
                        "count": {"$sum": 1},
                        "users": {OP_ADDTOSET: F_USERID}
                    }},
                    {OP_PROJECT: {
                        "category": "$_id",
                        "linkCount": "$count",
                        "userCount": {"$size": "$users"}
                    }},
                    {"$sort": {"linkCount": -1}},
                    {OP_LIMIT: 20}
                ]
                return await db.links.aggregate(pipeline).to_list(20)
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_top_categories failed: {e}")
                return []
        
        async def get_content_types():
            try:
                pipeline = [
                    {OP_MATCH: {
                        "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
                    }},
                    {OP_GROUP: {
                        "_id": "$contentType",
                        "count": {"$sum": 1}
                    }},
                    {OP_PROJECT: {
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
                    {OP_MATCH: {
                        "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
                    }},
                    {OP_GROUP: {
                        "_id": F_USERID,
                        "linkCount": {"$sum": 1}
                    }},
                    {OP_GROUP: {
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
                    {OP_MATCH: {
                        "$or": [
                            {"createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}},
                            {"updatedAt": {"$gte": start_date_obj, "$lte": end_date_obj}}
                        ]
                    }},
                    {OP_GROUP: {"_id": F_USERID}},
                    {OP_COUNT: "total"}
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
                    {OP_GROUP: {
                        "_id": F_USERID,
                        "linkCount": {OP_SUM: 1},
                        "storage": {
                            OP_SUM: {
                                OP_ADD: [
                                    {OP_STRLEN: {OP_IFNULL: [F_TITLE, ""]}},
                                    {OP_STRLEN: {OP_IFNULL: [F_URL, ""]}},
                                    {OP_STRLEN: {OP_IFNULL: [F_DESC, ""]}},
                                    {OP_STRLEN: {OP_IFNULL: [F_CONTENT, ""]}},
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
                    {OP_MATCH: {
                        "source": "extension", 
                        "extensionVersion": {OP_EXISTS: True, "$ne": None},
                        "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
                    }},
                    {OP_GROUP: {
                        "_id": "$extensionVersion",
                        "count": {"$sum": 1},
                        "users": {OP_ADDTOSET: F_USERID}
                    }},
                    {OP_PROJECT: {
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
                    {OP_GROUP: {
                        "_id": F_USERID,
                        "firstLinkDate": {"$min": F_CREATED},
                        "lastLinkDate": {"$max": F_UPDATED},
                        "totalLinks": {"$sum": 1},
                        "linksInPeriod": {
                            OP_SUM: {
                                "$cond": [
                                    {"$and": [
                                        {"$gte": [F_CREATED, start_date_obj]},
                                        {"$lte": [F_CREATED, end_date_obj]}
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
                    {OP_MATCH: {
                        "$or": [
                            {"createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}},
                            {"updatedAt": {"$gte": start_date_obj, "$lte": end_date_obj}}
                        ]
                    }},
                    {OP_GROUP: {
                        "_id": F_USERID,
                        "linksCreated": {
                            OP_SUM: {
                                "$cond": [
                                    {"$and": [
                                        {"$gte": [F_CREATED, start_date_obj]},
                                        {"$lte": [F_CREATED, end_date_obj]}
                                    ]},
                                    1, 0
                                ]
                            }
                        },
                        "linksUpdated": {
                            OP_SUM: {
                                "$cond": [
                                    {"$and": [
                                        {"$gte": [F_UPDATED, start_date_obj]},
                                        {"$lte": [F_UPDATED, end_date_obj]},
                                        {"$ne": [F_CREATED, F_UPDATED]}
                                    ]},
                                    1, 0
                                ]
                            }
                        },
                        "categoriesUsed": {OP_ADDTOSET: F_CATEGORY},
                        "collectionsUsed": {"$addToSet": "$collectionId"}
                    }},
                    {OP_PROJECT: {
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
                    {OP_MATCH: {
                        "$or": [
                            {"createdAt": {"$gte": previous_period_start, "$lte": previous_period_end}},
                            {"updatedAt": {"$gte": previous_period_start, "$lte": previous_period_end}}
                        ]
                    }},
                    {OP_GROUP: {"_id": F_USERID}},
                    {OP_COUNT: "total"}
                ]).to_list(1)
                
                previous_active_count = previous_active[0]["total"] if previous_active and previous_active[0].get("total") else 0
                
                # Users active in current period
                current_active = active_users  # Already calculated
                
                # Users active in both periods (retained)
                retained_users = await db.links.aggregate([
                    {OP_MATCH: {
                        "$or": [
                            {"createdAt": {"$gte": previous_period_start, "$lte": previous_period_end}},
                            {"updatedAt": {"$gte": previous_period_start, "$lte": previous_period_end}}
                        ]
                    }},
                    {OP_GROUP: {"_id": F_USERID}},
                    {OP_PROJECT: {"userId": "$_id"}}
                ]).to_list(10000)
                
                retained_user_ids = {u["userId"] for u in retained_users}
                
                current_active_users = await db.links.aggregate([
                    {OP_MATCH: {
                        "$or": [
                            {"createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}},
                            {"updatedAt": {"$gte": start_date_obj, "$lte": end_date_obj}}
                        ]
                    }},
                    {OP_GROUP: {"_id": F_USERID}},
                    {OP_PROJECT: {"userId": "$_id"}}
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
                # Get total users count for adoption rate calculation
                total_users_pipeline = [
                    {OP_GROUP: {"_id": F_USERID}},
                    {OP_COUNT: "total"}
                ]
                total_users_result = await db.links.aggregate(total_users_pipeline).to_list(1)
                total_users_count = total_users_result[0]["total"] if total_users_result and total_users_result[0].get("total") is not None else 0
                
                # Collection usage
                users_with_collections = await db.collections.aggregate([
                    {OP_GROUP: {"_id": F_USERID}},
                    {OP_COUNT: "total"}
                ]).to_list(1)
                collection_users = users_with_collections[0]["total"] if users_with_collections and users_with_collections[0].get("total") else 0
                
                # Favorite usage
                users_with_favorites = await db.links.aggregate([
                    {OP_MATCH: {"isFavorite": True}},
                    {OP_GROUP: {"_id": F_USERID}},
                    {OP_COUNT: "total"}
                ]).to_list(1)
                favorite_users = users_with_favorites[0]["total"] if users_with_favorites and users_with_favorites[0].get("total") else 0
                
                # Archive usage
                users_with_archived = await db.links.aggregate([
                    {OP_MATCH: {"isArchived": True}},
                    {OP_GROUP: {"_id": F_USERID}},
                    {OP_COUNT: "total"}
                ]).to_list(1)
                archived_users = users_with_archived[0]["total"] if users_with_archived and users_with_archived[0].get("total") else 0
                
                # Tags usage (users who have links with tags)
                users_with_tags = await db.links.aggregate([
                    {OP_MATCH: {"tags": {OP_EXISTS: True, "$ne": [], "$not": {"$size": 0}}}},
                    {OP_GROUP: {"_id": F_USERID}},
                    {OP_COUNT: "total"}
                ]).to_list(1)
                tags_users = users_with_tags[0]["total"] if users_with_tags and users_with_tags[0].get("total") else 0
                
                return {
                    "collectionAdoption": round((collection_users / total_users_count * 100), 1) if total_users_count > 0 else 0,
                    "favoriteAdoption": round((favorite_users / total_users_count * 100), 1) if total_users_count > 0 else 0,
                    "archiveAdoption": round((archived_users / total_users_count * 100), 1) if total_users_count > 0 else 0,
                    "tagsAdoption": round((tags_users / total_users_count * 100), 1) if total_users_count > 0 else 0,
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
        
        inactive_users = total_users_all_time - active_users if total_users_all_time >= active_users else 0
        
        # Calculate users with links vs users without links
        async def get_users_with_links():
            """Get count of users who have created at least one link"""
            try:
                pipeline = [
                    {OP_GROUP: {"_id": F_USERID}},
                    {OP_COUNT: "total"}
                ]
                result = await db.links.aggregate(pipeline).to_list(1)
                return result[0]["total"] if result and result[0].get("total") is not None else 0
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] get_users_with_links failed: {e}")
                return 0
        
        users_with_links = await get_users_with_links()
        users_without_links = max(0, total_users_all_time - users_with_links)
        
        result = {
            "summary": {
                # All-time totals (not filtered by date range)
                "totalUsers": total_users_all_time,
                "usersWithLinks": users_with_links,
                "usersWithoutLinks": users_without_links,
                "extensionUsers": extension_users_all_time,
                "totalLinksAllTime": total_links_all_time,
                "totalStorageBytes": storage_all_time,
                "totalStorageKB": round(storage_all_time / 1024, 2),
                "totalStorageMB": round(storage_all_time / (1024 * 1024), 2),
                # Period-specific metrics (filtered by date range)
                "linksInPeriod": links_in_period,
                "extensionLinksInPeriod": extension_links_in_period,
                "webLinksInPeriod": web_links_in_period,
                "storageInPeriodBytes": storage_in_period,
                "storageInPeriodKB": round(storage_in_period / 1024, 2),
                "storageInPeriodMB": round(storage_in_period / (1024 * 1024), 2),
                # Calculated metrics
                "averageLinksPerUser": round(avg_links_per_user, 2),
                "activeUsers": active_users,
                "inactiveUsers": inactive_users,
                # Backward compatibility (deprecated - use linksInPeriod instead)
                "totalLinks": links_in_period,
                "extensionLinks": extension_links_in_period,
                "webLinks": web_links_in_period
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
                {OP_GROUP: {
                "_id": F_USERID,
                "linkCount": {OP_SUM: 1},
                "firstLinkDate": {"$min": F_CREATED},
                "lastLinkDate": {"$max": F_UPDATED},
                "storage": {
                    OP_SUM: {
                        OP_ADD: [
                            {OP_STRLEN: {OP_IFNULL: [F_TITLE, ""]}},
                            {OP_STRLEN: {OP_IFNULL: [F_URL, ""]}},
                            {OP_STRLEN: {OP_IFNULL: [F_DESC, ""]}},
                            {OP_STRLEN: {OP_IFNULL: [F_CONTENT, ""]}},
                            300
                        ]
                    }
                },
                "extensionLinks": {
                    OP_SUM: {OP_COND: [{OP_EQ: [F_SOURCE, "extension"]}, 1, 0]}
                },
                "favoriteLinks": {
                    OP_SUM: {OP_COND: [{OP_EQ: [F_IS_FAV, True]}, 1, 0]}
                },
                "archivedLinks": {
                    OP_SUM: {OP_COND: [{"$eq": ["$isArchived", True]}, 1, 0]}
                }
            }}
        ]
        
        # Filter by activity (30 days threshold) - APPLIED AFTER GROUPING
        if active_only is not None:
            thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
            if active_only:
                # Active: Has activity in last 30 days
                pipeline.append({
                    OP_MATCH: {
                        "lastLinkDate": {"$gte": thirty_days_ago}
                    }
                })
            else:
                # Inactive: No activity in last 30 days
                pipeline.append({
                    OP_MATCH: {
                        "$or": [
                            {"lastLinkDate": {"$lt": thirty_days_ago}},
                            {"lastLinkDate": None}
                        ]
                    }
                })
        
        if match_filters:
            pipeline.insert(0, {OP_MATCH: {"$and": match_filters}})

        
        # Apply search filter BEFORE grouping if provided
        if search:
            search_regex = {"$regex": search, "$options": "i"}
            
            # 1. Search for matching userIds directly
            user_match_query = {"userId": search_regex}
            
            # 2. Search for matching emails in system_logs to find associated userIds
            try:
                email_search_pipeline = [
                    {OP_MATCH: {"email": search_regex, "userId": {"$ne": None}}},
                    {OP_GROUP: {"_id": F_USERID}}
                ]
                email_matches = await db.system_logs.aggregate(email_search_pipeline).to_list(1000)
                found_user_ids = [doc["_id"] for doc in email_matches]
                
                if found_user_ids:
                    # If we found users by email, match either ID regex OR exact ID from email lookup
                    pipeline.insert(0, {
                        OP_MATCH: {
                            "$or": [
                                {"userId": search_regex},
                                {"userId": {"$in": found_user_ids}}
                            ]
                        }
                    })
                else:
                    # Only match ID regex
                    pipeline.insert(0, {OP_MATCH: {"userId": search_regex}})
                    
            except Exception as e:
                logger.info(f"[ADMIN SEARCH ERROR] Failed to search emails: {e}")
                # Fallback to just ID search
                pipeline.insert(0, {OP_MATCH: {"userId": search_regex}})
        
        # Add sorting
        pipeline.append({OP_SORT: {"linkCount": -1}})
        
        # Get total count (before pagination)
        count_pipeline = pipeline + [{OP_COUNT: "total"}]
        count_result = await db.links.aggregate(count_pipeline).to_list(1)
        total_count = count_result[0]["total"] if count_result else 0
        
        # Add pagination
        pipeline.append({OP_SKIP: (page - 1) * limit})
        pipeline.append({OP_LIMIT: limit})
        
        # Execute aggregation
        users = await db.links.aggregate(pipeline).to_list(limit)
        
        # Collect user IDs for email lookup
        user_ids = [u["_id"] for u in users]
        
        # Lookup emails from system_logs (most recent log entry with email for each user)
        user_emails = {}
        if user_ids:
            try:
                email_pipeline = [
                    {OP_MATCH: {
                        "userId": {"$in": user_ids},
                        "email": {"$exists": True, "$ne": None}
                    }},
                    {OP_SORT: {"timestamp": -1}},
                    {OP_GROUP: {
                        "_id": F_USERID,
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
            is_active = (datetime.now(timezone.utc) - user["lastLinkDate"]).days <= 30 if user.get("lastLinkDate") else False
            
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
        end_date_obj = datetime.now(timezone.utc)
        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail=ERR_DATE_FMT.format(field="end_date"))
        
        start_date_obj = end_date_obj - timedelta(days=7)
        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail=ERR_DATE_FMT.format(field="start_date"))
        
        # New users in period
        new_users_pipeline = [
            {OP_MATCH: {
                "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
            }},
                {OP_GROUP: {
                "_id": F_USERID,
                "firstLinkDate": {"$min": F_CREATED}
            }},
            {OP_MATCH: {
                "firstLinkDate": {"$gte": start_date_obj, "$lte": end_date_obj}
            }},
            {OP_COUNT: "total"}
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
            {OP_MATCH: {
                "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
            }},
                {OP_GROUP: {
                "_id": {
                    "year": {"$year": "$createdAt"},
                    "month": {"$month": "$createdAt"},
                    "day": {"$dayOfMonth": "$createdAt"}
                },
                "linksCreated": {"$sum": 1},
                "extensionLinks": {
                    OP_SUM: {OP_COND: [{OP_EQ: [F_SOURCE, "extension"]}, 1, 0]}
                },
                "newUsers": {"$addToSet": "$userId"}
            }},
                {OP_PROJECT: {
                "date": {
                    OP_DATE_PARTS: {
                            "year": F_YEAR,
                            "month": F_MONTH,
                            "day": F_DAY
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
                    raise HTTPException(status_code=400, detail=ERR_DATE_FMT.format(field="start_date"))
            if end_date:
                try:
                    date_filter["$lte"] = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
                except ValueError:
                    raise HTTPException(status_code=400, detail=ERR_DATE_FMT.format(field="end_date"))
            match_filters["timestamp"] = date_filter
        
        # Build pipeline
        pipeline = []
        if match_filters:
            pipeline.append({OP_MATCH: match_filters})
            
        # Apply search filter in DB if provided
        if search:
            search_regex = {"$regex": search, "$options": "i"}
            pipeline.append({
                OP_MATCH: {
                    "$or": [
                        {"type": search_regex},
                        {"severity": search_regex},
                        {"userId": search_regex},
                        {"email": search_regex}
                    ]
                }
            })
        
        # Get total count
        count_pipeline = pipeline + [{OP_COUNT: "total"}]
        count_result = await db.system_logs.aggregate(count_pipeline).to_list(1)
        total_count = count_result[0]["total"] if count_result else 0
        
        # ✅ NEW: Calculate statistics if requested
        stats = None
        if include_stats:
            try:
                # Severity distribution
                severity_pipeline = pipeline + [
                    {OP_GROUP: {"_id": "$severity", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}}
                ]
                severity_dist = await db.system_logs.aggregate(severity_pipeline).to_list(10)
                
                # Type distribution
                type_pipeline = pipeline + [
                    {OP_GROUP: {"_id": "$type", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}},
                    {OP_LIMIT: 20}
                ]
                type_dist = await db.system_logs.aggregate(type_pipeline).to_list(20)
                
                # Error rate (errors + critical / total)
                error_pipeline = pipeline + [
                    {OP_MATCH: {"severity": {"$in": ["error", "critical"]}}},
                    {OP_COUNT: "total"}
                ]
                error_result = await db.system_logs.aggregate(error_pipeline).to_list(1)
                error_count = error_result[0]["total"] if error_result else 0
                error_rate = round((error_count / total_count * 100), 2) if total_count > 0 else 0
                
                # Recent errors (last 24 hours)
                recent_errors_pipeline = [
                    {OP_MATCH: {
                        "severity": {"$in": ["error", "critical"]},
                        "timestamp": {"$gte": datetime.now(timezone.utc) - timedelta(hours=24)}
                    }},
                    {OP_COUNT: "total"}
                ]
                recent_errors_result = await db.system_logs.aggregate(recent_errors_pipeline).to_list(1)
                recent_errors = recent_errors_result[0]["total"] if recent_errors_result else 0
                
                # Logs by hour (last 24 hours for trend)
                # Generate all 24 hours first, then fill in actual counts
                now = datetime.now(timezone.utc)
                hourly_trend = []
                hourly_counts = {}
                
                # Get actual log counts by hour
                hourly_pipeline = [
                    {OP_MATCH: {
                        "timestamp": {"$gte": now - timedelta(hours=24)}
                    }},
                    {OP_GROUP: {
                        "_id": {
                            "hour": {"$hour": "$timestamp"}
                        },
                        "count": {"$sum": 1}
                    }}
                ]
                hourly_logs = await db.system_logs.aggregate(hourly_pipeline).to_list(24)
                
                # Create a map of hour -> count
                for item in hourly_logs:
                    hour = item["_id"]["hour"]
                    hourly_counts[hour] = item["count"]
                
                # Generate all 24 hours (last 24 hours from now)
                for i in range(24):
                    hour_time = now - timedelta(hours=23-i)
                    hour = hour_time.hour
                    count = hourly_counts.get(hour, 0)
                    hourly_trend.append({
                        "hour": f"{hour:02d}:00",
                        "count": count
                    })
                
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
                    "hourlyTrend": hourly_trend
                }
            except Exception as e:
                logger.error(f"[ANALYTICS ERROR] Failed to calculate log stats: {e}")
                stats = None
        
        # Add sorting, pagination
        pipeline.append({"$sort": {"timestamp": DESCENDING}})
        pipeline.append({OP_SKIP: (page - 1) * limit})
        pipeline.append({OP_LIMIT: limit})
        
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


@router.delete("/admin/logs")
async def delete_all_logs(
    current_user: dict = Depends(check_admin_access),
    db = Depends(get_database)
):
    """
    Delete all system logs
    ⚠️ WARNING: This action is irreversible
    """
    try:
        # Get count before deletion
        total_count = await db.system_logs.count_documents({})
        
        # Delete all logs
        result = await db.system_logs.delete_many({})
        
        # Log the deletion event (this will be the last log entry)
        await log_system_event("admin_logs_delete_all", {
            "deletedCount": result.deleted_count,
            "adminEmail": current_user.get("email")
        }, current_user.get("sub"), "warning")
        
        return {
            "message": f"Successfully deleted {result.deleted_count} logs",
            "deletedCount": result.deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await log_system_event("admin_logs_delete_error", {
            "error": str(e),
            "adminEmail": current_user.get("email")
        }, current_user.get("sub") if current_user else None, "error")
        raise HTTPException(status_code=500, detail=f"Failed to delete logs: {str(e)}")


@router.get("/admin/logs/size")
async def get_logs_size(
    current_user: dict = Depends(check_admin_access),
    db = Depends(get_database)
):
    """
    Get total logs count and estimated size
    """
    try:
        # Get total count
        total_logs = await db.system_logs.count_documents({})
        
        # Estimate size by sampling a few logs and calculating average
        # Then multiply by total count
        sample_size = min(100, total_logs)
        if sample_size > 0:
            sample_logs = await db.system_logs.find({}).limit(sample_size).to_list(sample_size)
            
            # Calculate average size per log
            total_sample_size = 0
            for log in sample_logs:
                # Estimate size: ID + type + timestamp + userId + email + severity + details
                log_size = (
                    len(str(log.get("_id", ""))) +
                    len(str(log.get("type", ""))) +
                    len(str(log.get("timestamp", ""))) +
                    len(str(log.get("userId", ""))) +
                    len(str(log.get("email", ""))) +
                    len(str(log.get("severity", ""))) +
                    len(str(log.get("details", "")))
                )
                total_sample_size += log_size
            
            avg_size_per_log = total_sample_size / sample_size if sample_size > 0 else 500
        else:
            avg_size_per_log = 500  # Default estimate
        
        # Calculate total estimated size
        estimated_size_bytes = int(total_logs * avg_size_per_log)
        estimated_size_kb = estimated_size_bytes / 1024
        estimated_size_mb = estimated_size_kb / 1024
        
        return {
            "totalLogs": total_logs,
            "estimatedSizeBytes": estimated_size_bytes,
            "estimatedSizeKB": round(estimated_size_kb, 2),
            "estimatedSizeMB": round(estimated_size_mb, 2)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await log_system_event("admin_logs_size_error", {
            "error": str(e)
        }, current_user.get("sub") if current_user else None, "error")
        raise HTTPException(status_code=500, detail=f"Failed to calculate logs size: {str(e)}")


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
                {OP_GROUP: {
                "_id": F_CATEGORY,
                "linkCount": {OP_SUM: 1},
                "users": {OP_ADDTOSET: F_USERID}
            }},
                {OP_PROJECT: {
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
            "updatedAt": datetime.now(timezone.utc),
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

