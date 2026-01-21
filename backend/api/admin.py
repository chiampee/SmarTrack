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
from services.admin import check_admin_access, log_system_event, validate_no_admin_deletion, is_user_admin
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

def clear_analytics_cache():
    """Clear all analytics cache"""
    _analytics_cache.clear()
    _cache_timestamps.clear()
    logger.info("[CACHE] Analytics cache cleared")

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
                # Set end date to end of day (23:59:59.999) to include the entire day
                end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").replace(
                    tzinfo=timezone.utc,
                    hour=23,
                    minute=59,
                    second=59,
                    microsecond=999999
                )
            except ValueError:
                raise HTTPException(status_code=400, detail=ERR_DATE_FMT.format(field="end_date"))
        
        start_date_obj = end_date_obj - timedelta(days=7)
        if start_date:
            try:
                # Set start date to beginning of day (00:00:00) to include the entire day
                start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").replace(
                    tzinfo=timezone.utc,
                    hour=0,
                    minute=0,
                    second=0,
                    microsecond=0
                )
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
    inactive_days: Optional[int] = Query(None, description="Filter users inactive for N days"),
    current_user: dict = Depends(check_admin_access),
    db = Depends(get_database)
):
    """
    Get paginated list of all users with their statistics
    Default: 25 users per page
    """
    try:
        return await AnalyticsService.get_users_paginated(
            db, page, limit, search, active_only, inactive_days
        )
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
        # Filter out null, undefined, and empty categories
        pipeline = [
            {OP_MATCH: {
                F_CATEGORY: {
                    OP_EXISTS: True,
                    "$ne": None,
                    "$nin": ["", None]  # Exclude empty strings and null
                }
            }},
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
        # Filter out null, undefined, and empty categories
        pipeline = [
            {OP_MATCH: {
                F_CATEGORY: {
                    OP_EXISTS: True,
                    "$ne": None,
                    "$nin": ["", None]  # Exclude empty strings and null
                }
            }},
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


class BulkDeleteUsersRequest(BaseModel):
    user_ids: List[str]


def validate_user_ids(user_ids: List[str]) -> tuple[bool, str]:
    """
    Validate user_ids list format and constraints
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not user_ids or len(user_ids) == 0:
        return False, "user_ids list cannot be empty"
    
    # Check for duplicates
    if len(user_ids) != len(set(user_ids)):
        return False, "user_ids list contains duplicates"
    
    # Check maximum batch size (prevent DoS)
    MAX_BATCH_SIZE = 100
    if len(user_ids) > MAX_BATCH_SIZE:
        return False, f"Maximum batch size is {MAX_BATCH_SIZE} users per request"
    
    # Validate each user_id
    for user_id in user_ids:
        if not isinstance(user_id, str):
            return False, f"All user_ids must be strings, found: {type(user_id)}"
        
        if not user_id or not user_id.strip():
            return False, "user_ids cannot be empty or whitespace"
        
        # Reasonable length limit (Auth0 format: provider|id, typically < 100 chars)
        if len(user_id) > 200:
            return False, f"user_id too long (max 200 chars): {user_id[:50]}..."
        
        # Basic format validation (should contain alphanumeric, pipe, dash, underscore)
        # ✅ SECURITY: Reject MongoDB operators to prevent NoSQL injection
        if any(op in user_id for op in ['$', '{', '}', '[', ']']):
            return False, f"Invalid user_id format: contains MongoDB operators"
        
        # Allow only safe characters (alphanumeric, pipe, dash, underscore, @, dot)
        if not all(c.isalnum() or c in '|_-@.' for c in user_id):
            return False, f"Invalid user_id format: {user_id[:50]}..."
    
    return True, ""


async def verify_users_exist(user_ids: List[str], db) -> tuple[List[str], List[str]]:
    """
    Verify which user_ids exist in the system
    
    Returns:
        Tuple of (existing_user_ids, non_existing_user_ids)
    """
    from pymongo import DESCENDING
    
    existing = []
    non_existing = []
    
    # Check each user_id in system_logs
    for user_id in user_ids:
        user_log = await db.system_logs.find_one(
            {"userId": user_id},
            sort=[("timestamp", DESCENDING)]
        )
        if user_log:
            existing.append(user_id)
        else:
            non_existing.append(user_id)
    
    return existing, non_existing


async def verify_deletion_complete(user_id: str, db) -> tuple[bool, Dict[str, Any]]:
    """
    Verify that all user data has been deleted
    
    Returns:
        Tuple of (is_complete, verification_details)
    """
    verification = {
        "linksRemaining": 0,
        "collectionsRemaining": 0,
        "userLimitsRemaining": 0,
        "userProfilesRemaining": 0,
        "systemLogsWithUserId": 0
    }
    
    try:
        # Check links
        links_count = await db.links.count_documents({"userId": user_id})
        verification["linksRemaining"] = links_count
        
        # Check collections
        collections_count = await db.collections.count_documents({"userId": user_id})
        verification["collectionsRemaining"] = collections_count
        
        # Check user limits
        limits_count = await db.user_limits.count_documents({"userId": user_id})
        verification["userLimitsRemaining"] = limits_count
        
        # Check user profiles
        profiles_count = await db.user_profiles.count_documents({"userId": user_id})
        verification["userProfilesRemaining"] = profiles_count
        
        # Check system logs (should be anonymized, not deleted)
        logs_count = await db.system_logs.count_documents({"userId": user_id})
        verification["systemLogsWithUserId"] = logs_count
        
        # Deletion is complete if all user data is gone (except logs which are anonymized)
        is_complete = (
            verification["linksRemaining"] == 0 and
            verification["collectionsRemaining"] == 0 and
            verification["userLimitsRemaining"] == 0 and
            verification["userProfilesRemaining"] == 0 and
            verification["systemLogsWithUserId"] == 0
        )
        
        return is_complete, verification
    except Exception as e:
        logger.error(f"[VERIFICATION ERROR] Failed to verify deletion for user {user_id}: {e}")
        return False, verification


@router.delete("/admin/users/bulk")
async def bulk_delete_users(
    request: BulkDeleteUsersRequest,
    current_user: dict = Depends(check_admin_access),
    db = Depends(get_database)
):
    """
    Bulk delete users and all their data
    ⚠️ WARNING: This action is irreversible
    Deletes:
    - All links
    - All collections
    - User limits
    - User profiles
    - System logs (anonymized: userId set to null, kept for audit)
    
    Safety Features:
    - Prevents deletion of admin users
    - Validates input (format, duplicates, batch size)
    - Verifies users exist before deletion
    - Verifies deletion completeness after operation
    """
    try:
        # Step 1: Input validation
        is_valid, error_msg = validate_user_ids(request.user_ids)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Step 2: Admin protection - prevent deleting admin users
        # ✅ SECURITY: Check all admins at once and cache results to prevent race conditions
        is_safe, admin_user_ids = await validate_no_admin_deletion(request.user_ids, db)
        
        # ✅ SECURITY: Re-verify admin status immediately before processing (double-check)
        # This prevents race condition where admin status changes between check and deletion
        if not is_safe:
            # Re-check to ensure admin status hasn't changed
            is_safe_recheck, admin_user_ids_recheck = await validate_no_admin_deletion(request.user_ids, db)
            if not is_safe_recheck:
                # Still admin, block deletion
                admin_user_ids = admin_user_ids_recheck
        
        if not is_safe:
            admin_emails = []
            for admin_id in admin_user_ids:
                # Get email for better error message
                admin_log = await db.system_logs.find_one(
                    {"userId": admin_id, "email": {"$exists": True, "$ne": None}},
                    sort=[("timestamp", -1)]
                )
                if admin_log:
                    admin_emails.append(admin_log.get("email", admin_id))
                else:
                    admin_emails.append(admin_id)
            
            # ✅ SECURITY: Don't expose admin emails in error message (information disclosure)
            # Log detailed info server-side only
            logger.warning(f"[BULK DELETE SECURITY] Admin deletion attempt blocked. Admin user_ids: {admin_user_ids}, Admin emails: {admin_emails}")
            raise HTTPException(
                status_code=403,
                detail="Cannot delete admin users. Admin users are protected from deletion."
            )
        
        # Step 3: Verify users exist
        existing_user_ids, non_existing_user_ids = await verify_users_exist(request.user_ids, db)
        
        if len(non_existing_user_ids) > 0:
            logger.warning(f"[BULK DELETE] {len(non_existing_user_ids)} user_ids do not exist: {non_existing_user_ids[:5]}")
        
        if len(existing_user_ids) == 0:
            # ✅ SECURITY: Don't expose which user_ids don't exist (user enumeration)
            # Log detailed info server-side only
            logger.warning(f"[BULK DELETE] All user_ids non-existent: {non_existing_user_ids[:10]}")
            raise HTTPException(
                status_code=404,
                detail="None of the provided user_ids exist in the system."
            )
        
        # Step 4: Log deletion event BEFORE anonymization (for audit trail)
        # ✅ AUDIT TRAIL: This log entry is created BEFORE any anonymization
        # The log entry itself will have the admin's userId and email, preserving audit trail
        await log_system_event("admin_bulk_user_delete_start", {
            "userIds": existing_user_ids,
            "nonExistentUserIds": non_existing_user_ids,
            "totalRequested": len(request.user_ids),
            "totalExisting": len(existing_user_ids),
            "adminEmail": current_user.get("email"),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }, current_user.get("sub"), "warning")
        
        deletion_summary = {
            "usersDeleted": 0,
            "linksDeleted": 0,
            "collectionsDeleted": 0,
            "userLimitsDeleted": 0,
            "userProfilesDeleted": 0,
            "systemLogsAnonymized": 0,
            "errors": [],
            "partialFailures": [],
            "nonExistentUserIds": non_existing_user_ids
        }
        
        # Step 5: Delete users (only existing ones)
        # ✅ SECURITY: Re-verify admin status immediately before each deletion to prevent race conditions
        for user_id in existing_user_ids:
            # Double-check admin status right before deletion (prevents race condition)
            if await is_user_admin(user_id, db):
                logger.error(f"[BULK DELETE SECURITY] Admin user {user_id} detected during deletion - blocking")
                deletion_summary["errors"].append(f"User {user_id} is an admin and cannot be deleted")
                continue
            
            try:
                # Delete all links
                links_result = await db.links.delete_many({"userId": user_id})
                deletion_summary["linksDeleted"] += links_result.deleted_count
                
                # Delete all collections
                collections_result = await db.collections.delete_many({"userId": user_id})
                deletion_summary["collectionsDeleted"] += collections_result.deleted_count
                
                # Delete user limits
                limits_result = await db.user_limits.delete_one({"userId": user_id})
                if limits_result.deleted_count > 0:
                    deletion_summary["userLimitsDeleted"] += 1
                
                # Delete user profiles
                profile_result = await db.user_profiles.delete_one({"userId": user_id})
                if profile_result.deleted_count > 0:
                    deletion_summary["userProfilesDeleted"] += 1
                
                # Anonymize system logs (set userId to null, keep for audit)
                logs_result = await db.system_logs.update_many(
                    {"userId": user_id},
                    {"$set": {"userId": None}}
                )
                deletion_summary["systemLogsAnonymized"] += logs_result.modified_count
                
                # Step 6: Verify deletion completeness
                is_complete, verification = await verify_deletion_complete(user_id, db)
                if not is_complete:
                    error_details = {
                        "userId": user_id,
                        "verification": verification
                    }
                    deletion_summary["partialFailures"].append(error_details)
                    logger.error(f"[BULK DELETE] Partial deletion detected for user {user_id}: {verification}")
                else:
                    deletion_summary["usersDeleted"] += 1
                
            except Exception as e:
                error_msg = f"Error deleting user {user_id}: {str(e)}"
                deletion_summary["errors"].append(error_msg)
                logger.error(f"[BULK DELETE ERROR] {error_msg}")
        
        # Step 7: Log the bulk deletion event (AFTER anonymization, but log entry itself won't be anonymized)
        # ✅ AUDIT TRAIL: This log entry preserves:
        # - Admin userId and email (for accountability)
        # - Timestamp (for timeline)
        # - All deletion details (for compliance)
        # - The log entry itself is NOT anonymized (it's created by admin, not deleted user)
        await log_system_event("admin_bulk_user_delete", {
            "usersDeleted": deletion_summary["usersDeleted"],
            "linksDeleted": deletion_summary["linksDeleted"],
            "collectionsDeleted": deletion_summary["collectionsDeleted"],
            "userLimitsDeleted": deletion_summary["userLimitsDeleted"],
            "userProfilesDeleted": deletion_summary["userProfilesDeleted"],
            "systemLogsAnonymized": deletion_summary["systemLogsAnonymized"],
            "errors": deletion_summary["errors"],
            "partialFailures": deletion_summary["partialFailures"],
            "nonExistentUserIds": deletion_summary["nonExistentUserIds"],
            "adminEmail": current_user.get("email"),
            "adminUserId": current_user.get("sub"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "auditNote": "This log entry preserves admin identity and deletion details for audit trail. Deleted user logs are anonymized (userId=null) but preserved."
        }, current_user.get("sub"), "warning")
        
        # Step 8: Return result with warnings if needed
        response_message = f"Bulk deletion completed. {deletion_summary['usersDeleted']} users deleted."
        if deletion_summary["partialFailures"]:
            response_message += f" Warning: {len(deletion_summary['partialFailures'])} users had partial deletion failures."
        if deletion_summary["nonExistentUserIds"]:
            response_message += f" Note: {len(deletion_summary['nonExistentUserIds'])} user_ids did not exist."
        
        # ✅ SECURITY: Sanitize response to prevent information disclosure
        # Don't expose nonExistentUserIds, detailed errors, or partial failures to client
        sanitized_summary = {
            "usersDeleted": deletion_summary["usersDeleted"],
            "linksDeleted": deletion_summary["linksDeleted"],
            "collectionsDeleted": deletion_summary["collectionsDeleted"],
            "userLimitsDeleted": deletion_summary["userLimitsDeleted"],
            "userProfilesDeleted": deletion_summary["userProfilesDeleted"],
            "systemLogsAnonymized": deletion_summary["systemLogsAnonymized"],
            "hasErrors": len(deletion_summary["errors"]) > 0,
            "hasPartialFailures": len(deletion_summary["partialFailures"]) > 0,
            "nonExistentCount": len(deletion_summary["nonExistentUserIds"])
        }
        
        # Log detailed info server-side only
        if deletion_summary["errors"]:
            logger.error(f"[BULK DELETE] Errors occurred: {deletion_summary['errors']}")
        if deletion_summary["partialFailures"]:
            logger.error(f"[BULK DELETE] Partial failures: {deletion_summary['partialFailures']}")
        if deletion_summary["nonExistentUserIds"]:
            logger.warning(f"[BULK DELETE] Non-existent user_ids: {deletion_summary['nonExistentUserIds'][:10]}")
        
        return {
            "message": response_message,
            "deleted": deletion_summary["usersDeleted"],
            "summary": sanitized_summary
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await log_system_event("admin_bulk_user_delete_error", {
            "error": str(e),
            "adminEmail": current_user.get("email")
        }, current_user.get("sub") if current_user else None, "error")
        raise HTTPException(status_code=500, detail=f"Failed to delete users: {str(e)}")
            try:
                # Delete all links
                links_result = await db.links.delete_many({"userId": user_id})
                deletion_summary["linksDeleted"] += links_result.deleted_count
                
                # Delete all collections
                collections_result = await db.collections.delete_many({"userId": user_id})
                deletion_summary["collectionsDeleted"] += collections_result.deleted_count
                
                # Delete user limits
                limits_result = await db.user_limits.delete_one({"userId": user_id})
                if limits_result.deleted_count > 0:
                    deletion_summary["userLimitsDeleted"] += 1
                
                # Delete user profiles
                profile_result = await db.user_profiles.delete_one({"userId": user_id})
                if profile_result.deleted_count > 0:
                    deletion_summary["userProfilesDeleted"] += 1
                
                # Anonymize system logs (set userId to null, keep for audit)
                logs_result = await db.system_logs.update_many(
                    {"userId": user_id},
                    {"$set": {"userId": None}}
                )
                deletion_summary["systemLogsAnonymized"] += logs_result.modified_count
                
                deletion_summary["usersDeleted"] += 1
                
            except Exception as e:
                error_msg = f"Error deleting user {user_id}: {str(e)}"
                deletion_summary["errors"].append(error_msg)
                logger.error(f"[BULK DELETE ERROR] {error_msg}")
        
        # Log the bulk deletion event
        await log_system_event("admin_bulk_user_delete", {
            "usersDeleted": deletion_summary["usersDeleted"],
            "linksDeleted": deletion_summary["linksDeleted"],
            "collectionsDeleted": deletion_summary["collectionsDeleted"],
            "userLimitsDeleted": deletion_summary["userLimitsDeleted"],
            "userProfilesDeleted": deletion_summary["userProfilesDeleted"],
            "systemLogsAnonymized": deletion_summary["systemLogsAnonymized"],
            "errors": deletion_summary["errors"],
            "adminEmail": current_user.get("email")
        }, current_user.get("sub"), "warning")
        
        return {
            "message": f"Bulk deletion completed. {deletion_summary['usersDeleted']} users deleted.",
            "deleted": deletion_summary["usersDeleted"],
            "summary": deletion_summary
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await log_system_event("admin_bulk_user_delete_error", {
            "error": str(e),
            "adminEmail": current_user.get("email")
        }, current_user.get("sub") if current_user else None, "error")
        raise HTTPException(status_code=500, detail=f"Failed to delete users: {str(e)}")


@router.post("/admin/analytics/cache/clear")
async def clear_analytics_cache_endpoint(
    current_user: dict = Depends(check_admin_access)
):
    """
    Clear analytics cache
    Useful when data has been updated and cache needs to be invalidated
    """
    try:
        clear_analytics_cache()
        await log_system_event("admin_analytics_cache_cleared", {
            "adminEmail": current_user.get("email")
        }, current_user.get("sub"), "info")
        return {
            "message": "Analytics cache cleared successfully",
            "clearedAt": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        await log_system_event("admin_analytics_cache_clear_error", {
            "error": str(e)
        }, current_user.get("sub") if current_user else None, "error")
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")


@router.get("/admin/analytics/validate")
async def validate_analytics_data(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    current_user: dict = Depends(check_admin_access),
    db = Depends(get_database)
):
    """
    Debug/validation endpoint to check database state and query results
    Returns diagnostic information about:
    - Total links count (raw MongoDB query)
    - Sample link datetimes (check if naive/aware)
    - Date range being used in queries
    - Actual query results vs expected
    """
    try:
        # Parse date range (same as analytics endpoint)
        end_date_obj = datetime.now(timezone.utc)
        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").replace(
                    tzinfo=timezone.utc,
                    hour=23,
                    minute=59,
                    second=59,
                    microsecond=999999
                )
            except ValueError:
                raise HTTPException(status_code=400, detail=ERR_DATE_FMT.format(field="end_date"))
        
        start_date_obj = end_date_obj - timedelta(days=7)
        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").replace(
                    tzinfo=timezone.utc,
                    hour=0,
                    minute=0,
                    second=0,
                    microsecond=0
                )
            except ValueError:
                raise HTTPException(status_code=400, detail=ERR_DATE_FMT.format(field="start_date"))
        
        # Get total links count (raw query)
        total_links = await db.links.count_documents({})
        
        # Get sample links to check datetime format
        sample_links = await db.links.find({}).sort("createdAt", -1).limit(10).to_list(10)
        sample_datetimes = []
        for link in sample_links:
            created_at = link.get("createdAt")
            if created_at:
                sample_datetimes.append({
                    "linkId": str(link.get("_id")),
                    "createdAt": created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at),
                    "isTimezoneAware": created_at.tzinfo is not None,
                    "timezone": str(created_at.tzinfo) if created_at.tzinfo else "None (naive)"
                })
        
        # Count links in date range (raw query)
        links_in_range_raw = await db.links.count_documents({
            "createdAt": {"$gte": start_date_obj, "$lte": end_date_obj}
        })
        
        # Count links in date range with normalized dates (for comparison)
        from services.analytics import AnalyticsService
        normalized_start, normalized_end = AnalyticsService.normalize_date_range(start_date_obj, end_date_obj)
        links_in_range_normalized = await db.links.count_documents({
            "createdAt": {"$gte": normalized_start, "$lte": normalized_end}
        })
        
        # Get cache status
        cache_key = f"analytics_{start_date_obj.date()}_{end_date_obj.date()}"
        cache_status = {
            "isCached": cache_key in _analytics_cache,
            "cacheKey": cache_key,
            "cacheAge": None
        }
        if cache_key in _cache_timestamps:
            cache_age = time.time() - _cache_timestamps[cache_key]
            cache_status["cacheAge"] = f"{cache_age:.2f} seconds"
            cache_status["isExpired"] = cache_age >= settings.ANALYTICS_CACHE_TTL_SECONDS
        
        return {
            "validation": {
                "totalLinks": total_links,
                "dateRange": {
                    "startDate": start_date_obj.isoformat(),
                    "endDate": end_date_obj.isoformat(),
                    "normalizedStartDate": normalized_start.isoformat(),
                    "normalizedEndDate": normalized_end.isoformat()
                },
                "linksInRange": {
                    "rawQuery": links_in_range_raw,
                    "normalizedQuery": links_in_range_normalized
                },
                "sampleDatetimes": sample_datetimes,
                "cacheStatus": cache_status
            },
            "diagnostics": {
                "timezoneAwareCount": sum(1 for dt in sample_datetimes if dt["isTimezoneAware"]),
                "naiveCount": sum(1 for dt in sample_datetimes if not dt["isTimezoneAware"]),
                "dateRangeIncludesFullDay": (
                    start_date_obj.hour == 0 and start_date_obj.minute == 0 and
                    end_date_obj.hour == 23 and end_date_obj.minute == 59
                )
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"[VALIDATION ERROR] {error_trace}")
        await log_system_event("admin_analytics_validation_error", {
            "error": str(e),
            "traceback": error_trace
        }, current_user.get("sub") if current_user else None, "error")
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")
