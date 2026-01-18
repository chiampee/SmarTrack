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
        return await AnalyticsService.get_users_paginated(
            db, page, limit, search, active_only
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

