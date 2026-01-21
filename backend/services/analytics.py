"""
Analytics Service
Handles all analytics calculations and data aggregation
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta, timezone
from pymongo.database import Database
import asyncio
import logging
from core.config import settings

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


class AnalyticsService:
    """Service class for analytics calculations"""
    
    @staticmethod
    def normalize_datetime(dt: datetime) -> datetime:
        """
        Normalize a datetime to timezone-aware UTC for backward compatibility.
        If datetime is naive (no timezone), assume it's UTC and add timezone info.
        If datetime is already timezone-aware, return as-is.
        """
        if dt is None:
            return None
        if dt.tzinfo is None:
            # Naive datetime - assume UTC and add timezone
            return dt.replace(tzinfo=timezone.utc)
        # Already timezone-aware, return as-is
        return dt
    
    @staticmethod
    def normalize_date_range(start_date: datetime, end_date: datetime) -> tuple[datetime, datetime]:
        """
        Normalize both start and end dates to timezone-aware UTC.
        Ensures date range queries work with both naive and timezone-aware datetimes.
        """
        normalized_start = AnalyticsService.normalize_datetime(start_date)
        normalized_end = AnalyticsService.normalize_datetime(end_date)
        return normalized_start, normalized_end
    
    @staticmethod
    async def get_total_users_all_time(db: Database) -> int:
        """Get total unique users (all-time) - includes users from links, user_limits, system_logs, and user_activity"""
        try:
            # Get unique users from multiple sources to capture all authenticated users
            users_from_links = set()
            users_from_limits = set()
            users_from_logs = set()
            users_from_activity = set()
            
            # 1. Users who have created links
            links_pipeline = [
                {OP_GROUP: {"_id": F_USERID}},
                {OP_PROJECT: {"userId": "$_id"}}
            ]
            links_result = await db.links.aggregate(links_pipeline).to_list(10000)
            users_from_links = {u["userId"] for u in links_result if u.get("userId")}
            
            # 2. Users in user_limits collection (may include users without links)
            try:
                limits_result = await db.user_limits.find({}, {"userId": 1}).to_list(10000)
                users_from_limits = {u["userId"] for u in limits_result if u.get("userId")}
            except Exception as e:
                logger.warning(f"[ANALYTICS] Could not fetch users from user_limits: {e}")
            
            # 3. Users from system_logs (tracks all authenticated user activity)
            try:
                logs_pipeline = [
                    {OP_MATCH: {"userId": {OP_EXISTS: True, "$ne": None}}},
                    {OP_GROUP: {"_id": F_USERID}},
                    {OP_PROJECT: {"userId": "$_id"}}
                ]
                logs_result = await db.system_logs.aggregate(logs_pipeline).to_list(10000)
                users_from_logs = {u["userId"] for u in logs_result if u.get("userId")}
            except Exception as e:
                logger.warning(f"[ANALYTICS] Could not fetch users from system_logs: {e}")
            
            # 4. Users from user_activity collection (MOST COMPREHENSIVE - tracks ALL authenticated users)
            # This is updated on every successful authentication, so it captures all users who have ever logged in
            try:
                activity_result = await db.user_activity.find({}, {"userId": 1}).to_list(10000)
                users_from_activity = {u["userId"] for u in activity_result if u.get("userId")}
                logger.info(f"[ANALYTICS] Found {len(users_from_activity)} users from user_activity collection")
            except Exception as e:
                logger.warning(f"[ANALYTICS] Could not fetch users from user_activity: {e}")
            
            # Combine all unique users from all sources
            all_users = users_from_links | users_from_limits | users_from_logs | users_from_activity
            total_count = len(all_users)
            
            logger.info(f"[ANALYTICS] get_total_users_all_time - Query result: {total_count} total users (links: {len(users_from_links)}, limits: {len(users_from_limits)}, logs: {len(users_from_logs)}, activity: {len(users_from_activity)})")
            logger.info(f"[ANALYTICS] get_total_users_all_time - Returning: {total_count}")
            
            return total_count
        except Exception as e:
            logger.error(f"[ANALYTICS ERROR] get_total_users_all_time failed: {e}")
            return 0
    
    @staticmethod
    async def get_extension_users_all_time(db: Database) -> int:
        """Get total unique users who have ever used the extension (all-time)
        Includes users from both extension links AND extension usage events
        """
        try:
            logger.info(f"[ANALYTICS] get_extension_users_all_time - Input: no date range (all-time)")
            
            # Get unique users from extension links
            links_pipeline = [
                {OP_MATCH: {"source": "extension"}},
                {OP_GROUP: {"_id": F_USERID}},
                {OP_PROJECT: {"_id": 1}}
            ]
            links_result = await db.links.aggregate(links_pipeline).to_list(10000)
            users_from_links = {r["_id"] for r in links_result}
            
            # Get unique users from extension usage events in system_logs
            logs_pipeline = [
                {OP_MATCH: {"type": "extension_usage"}},
                {OP_GROUP: {"_id": "$userId"}},
                {OP_PROJECT: {"_id": 1}}
            ]
            logs_result = await db.system_logs.aggregate(logs_pipeline).to_list(10000)
            users_from_logs = {r["_id"] for r in logs_result if r.get("_id")}
            
            # Combine both sets to get total unique extension users
            all_extension_users = users_from_links.union(users_from_logs)
            extension_users = len(all_extension_users)
            
            logger.info(f"[ANALYTICS] get_extension_users_all_time - Found {len(users_from_links)} from links, {len(users_from_logs)} from logs, {extension_users} total unique")
            logger.info(f"[ANALYTICS] get_extension_users_all_time - Returning: {extension_users}")
            return extension_users
        except Exception as e:
            logger.error(f"[ANALYTICS ERROR] get_extension_users_all_time failed: {e}")
            return 0
    
    @staticmethod
    async def get_total_links_all_time(db: Database) -> int:
        """Get total links created all-time"""
        try:
            logger.info(f"[ANALYTICS] get_total_links_all_time - Input: no date range (all-time)")
            query = {}
            logger.info(f"[ANALYTICS] get_total_links_all_time - Query: {query}")
            result = await db.links.count_documents(query)
            logger.info(f"[ANALYTICS] get_total_links_all_time - Query result: {result} total links found")
            logger.info(f"[ANALYTICS] get_total_links_all_time - Returning: {result}")
            return result
        except Exception as e:
            logger.error(f"[ANALYTICS ERROR] get_total_links_all_time failed: {e}")
            return 0
    
    @staticmethod
    async def get_links_in_period(db: Database, start_date_obj: datetime, end_date_obj: datetime) -> int:
        """Get links created in the specified date range"""
        try:
            # Normalize date range
            normalized_start, normalized_end = AnalyticsService.normalize_date_range(start_date_obj, end_date_obj)
            logger.info(f"[ANALYTICS] get_links_in_period - Input: start={start_date_obj} (normalized={normalized_start}), end={end_date_obj} (normalized={normalized_end})")
            
            query = {
                F_CREATED: {"$gte": normalized_start, "$lte": normalized_end}
            }
            logger.info(f"[ANALYTICS] get_links_in_period - Query: {query}")
            
            result = await db.links.count_documents(query)
            logger.info(f"[ANALYTICS] get_links_in_period - Query result: {result} links found")
            logger.info(f"[ANALYTICS] get_links_in_period - Returning: {result}")
            return result
        except Exception as e:
            logger.error(f"[ANALYTICS ERROR] get_links_in_period failed: {e}")
            return 0
    
    @staticmethod
    async def get_extension_links_in_period(db: Database, start_date_obj: datetime, end_date_obj: datetime) -> int:
        """Get extension links created in the specified date range"""
        try:
            # Normalize date range
            normalized_start, normalized_end = AnalyticsService.normalize_date_range(start_date_obj, end_date_obj)
            logger.info(f"[ANALYTICS] get_extension_links_in_period - Input: start={start_date_obj} (normalized={normalized_start}), end={end_date_obj} (normalized={normalized_end})")
            
            query = {
                F_SOURCE: "extension",
                F_CREATED: {"$gte": normalized_start, "$lte": normalized_end}
            }
            logger.info(f"[ANALYTICS] get_extension_links_in_period - Query: {query}")
            
            result = await db.links.count_documents(query)
            logger.info(f"[ANALYTICS] get_extension_links_in_period - Query result: {result} extension links found")
            logger.info(f"[ANALYTICS] get_extension_links_in_period - Returning: {result}")
            return result
        except Exception as e:
            logger.error(f"[ANALYTICS ERROR] get_extension_links_in_period failed: {e}")
            return 0
    
    @staticmethod
    async def get_storage_all_time(db: Database) -> int:
        """Get total storage used by all links (all-time)"""
        try:
            logger.info(f"[ANALYTICS] get_storage_all_time - Input: no date range (all-time)")
            pipeline = [
                {OP_PROJECT: {
                    "size": {
                        OP_ADD: [
                            {OP_STRLEN: {OP_IFNULL: [F_TITLE, ""]}},
                            {OP_STRLEN: {OP_IFNULL: [F_URL, ""]}},
                            {OP_STRLEN: {OP_IFNULL: [F_DESC, ""]}},
                            {OP_STRLEN: {OP_IFNULL: [F_CONTENT, ""]}},
                            {"$multiply": [{"$size": {OP_IFNULL: [F_TAGS, []]}}, 50]},
                            300  # MongoDB overhead
                        ]
                    }
                }},
                {OP_GROUP: {"_id": None, "total": {OP_SUM: "$size"}}}
            ]
            logger.info(f"[ANALYTICS] get_storage_all_time - Pipeline: {pipeline}")
            result = await db.links.aggregate(pipeline).to_list(1)
            storage_bytes = result[0]["total"] if result and result[0].get("total") is not None else 0
            logger.info(f"[ANALYTICS] get_storage_all_time - Query result: {storage_bytes} bytes")
            logger.info(f"[ANALYTICS] get_storage_all_time - Returning: {storage_bytes}")
            return storage_bytes
        except Exception as e:
            logger.error(f"[ANALYTICS ERROR] get_storage_all_time failed: {e}")
            return 0
    
    @staticmethod
    async def get_storage_in_period(db: Database, start_date_obj: datetime, end_date_obj: datetime) -> int:
        """Get storage used by links created in the specified date range"""
        try:
            # Normalize date range
            normalized_start, normalized_end = AnalyticsService.normalize_date_range(start_date_obj, end_date_obj)
            logger.info(f"[ANALYTICS] get_storage_in_period - Input: start={start_date_obj} (normalized={normalized_start}), end={end_date_obj} (normalized={normalized_end})")
            
            pipeline = [
                {OP_MATCH: {
                    F_CREATED: {"$gte": normalized_start, "$lte": normalized_end}
                }},
                {OP_PROJECT: {
                    "size": {
                        OP_ADD: [
                            {OP_STRLEN: {OP_IFNULL: [F_TITLE, ""]}},
                            {OP_STRLEN: {OP_IFNULL: [F_URL, ""]}},
                            {OP_STRLEN: {OP_IFNULL: [F_DESC, ""]}},
                            {OP_STRLEN: {OP_IFNULL: [F_CONTENT, ""]}},
                            {"$multiply": [{"$size": {OP_IFNULL: [F_TAGS, []]}}, 50]},
                            300  # MongoDB overhead
                        ]
                    }
                }},
                {OP_GROUP: {"_id": None, "total": {OP_SUM: "$size"}}}
            ]
            logger.info(f"[ANALYTICS] get_storage_in_period - Pipeline: {pipeline}")
            result = await db.links.aggregate(pipeline).to_list(1)
            storage_bytes = result[0]["total"] if result and result[0].get("total") is not None else 0
            logger.info(f"[ANALYTICS] get_storage_in_period - Query result: {storage_bytes} bytes")
            logger.info(f"[ANALYTICS] get_storage_in_period - Returning: {storage_bytes}")
            return storage_bytes
        except Exception as e:
            logger.error(f"[ANALYTICS ERROR] get_storage_in_period failed: {e}")
            return 0
    
    @staticmethod
    async def get_user_growth(db: Database, start_date_obj: datetime, end_date_obj: datetime) -> List[Dict[str, Any]]:
        """Get user growth over time"""
        try:
            # Normalize date range
            normalized_start, normalized_end = AnalyticsService.normalize_date_range(start_date_obj, end_date_obj)
            logger.info(f"[ANALYTICS] get_user_growth - Input: start={start_date_obj} (normalized={normalized_start}), end={end_date_obj} (normalized={normalized_end})")
            
            pipeline = [
                {OP_GROUP: {
                    "_id": F_USERID,
                    "firstSeen": {"$min": F_CREATED}
                }},
                {OP_MATCH: {
                    "firstSeen": {"$gte": normalized_start, "$lte": normalized_end}
                }},
                {OP_GROUP: {
                    "_id": {
                        "year": {"$year": "$firstSeen"},
                        "month": {"$month": "$firstSeen"},
                        "day": {"$dayOfMonth": "$firstSeen"}
                    },
                    "newUsers": {OP_SUM: 1}
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
                {OP_SORT: {"date": 1}}
            ]
            logger.info(f"[ANALYTICS] get_user_growth - Pipeline: {pipeline}")
            result = await db.links.aggregate(pipeline).to_list(1000)
            logger.info(f"[ANALYTICS] get_user_growth - Query result: {len(result)} growth data points")
            logger.info(f"[ANALYTICS] get_user_growth - Returning: {len(result)} entries")
            return result
        except Exception as e:
            logger.error(f"[ANALYTICS ERROR] get_user_growth failed: {e}")
            return []
    
    @staticmethod
    async def get_links_growth(db: Database, start_date_obj: datetime, end_date_obj: datetime) -> List[Dict[str, Any]]:
        """Get links growth over time"""
        try:
            # Normalize date range
            normalized_start, normalized_end = AnalyticsService.normalize_date_range(start_date_obj, end_date_obj)
            logger.info(f"[ANALYTICS] get_links_growth - Input: start={start_date_obj} (normalized={normalized_start}), end={end_date_obj} (normalized={normalized_end})")
            
            pipeline = [
                {OP_MATCH: {
                    F_CREATED: {"$gte": normalized_start, "$lte": normalized_end}
                }},
                {OP_GROUP: {
                    "_id": {
                    "year": {"$year": F_CREATED},
                    "month": {"$month": F_CREATED},
                    "day": {"$dayOfMonth": F_CREATED}
                    },
                    "count": {OP_SUM: 1},
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
                    "webCount": {OP_SUBTRACT: ["$count", "$extensionCount"]}
                }},
                {OP_SORT: {"date": 1}}
            ]
            logger.info(f"[ANALYTICS] get_links_growth - Pipeline: {pipeline}")
            result = await db.links.aggregate(pipeline).to_list(1000)
            logger.info(f"[ANALYTICS] get_links_growth - Query result: {len(result)} growth data points")
            logger.info(f"[ANALYTICS] get_links_growth - Returning: {len(result)} entries")
            return result
        except Exception as e:
            logger.error(f"[ANALYTICS ERROR] get_links_growth failed: {e}")
            return []
    
    @staticmethod
    async def get_top_categories(db: Database, start_date_obj: datetime, end_date_obj: datetime) -> List[Dict[str, Any]]:
        """Get top categories by usage"""
        try:
            # Normalize date range
            normalized_start, normalized_end = AnalyticsService.normalize_date_range(start_date_obj, end_date_obj)
            logger.info(f"[ANALYTICS] get_top_categories - Input: start={start_date_obj} (normalized={normalized_start}), end={end_date_obj} (normalized={normalized_end})")
            
            pipeline = [
                {OP_MATCH: {
                    F_CREATED: {"$gte": normalized_start, "$lte": normalized_end}
                }},
                {OP_GROUP: {
                    "_id": F_CATEGORY,
                    "count": {OP_SUM: 1},
                    "users": {OP_ADDTOSET: F_USERID}
                }},
                {OP_PROJECT: {
                    "category": "$_id",
                    "linkCount": "$count",
                    "userCount": {"$size": "$users"}
                }},
                {OP_SORT: {"linkCount": -1}},
                {OP_LIMIT: 20}
            ]
            logger.info(f"[ANALYTICS] get_top_categories - Pipeline: {pipeline}")
            result = await db.links.aggregate(pipeline).to_list(20)
            logger.info(f"[ANALYTICS] get_top_categories - Query result: {len(result)} categories found")
            logger.info(f"[ANALYTICS] get_top_categories - Returning: {len(result)} categories")
            return result
        except Exception as e:
            logger.error(f"[ANALYTICS ERROR] get_top_categories failed: {e}")
            return []
    
    @staticmethod
    async def get_content_types(db: Database, start_date_obj: datetime, end_date_obj: datetime) -> List[Dict[str, Any]]:
        """Get content types distribution"""
        try:
            # Normalize date range
            normalized_start, normalized_end = AnalyticsService.normalize_date_range(start_date_obj, end_date_obj)
            logger.info(f"[ANALYTICS] get_content_types - Input: start={start_date_obj} (normalized={normalized_start}), end={end_date_obj} (normalized={normalized_end})")
            
            pipeline = [
                {OP_MATCH: {
                    F_CREATED: {"$gte": normalized_start, "$lte": normalized_end}
                }},
                {OP_GROUP: {
                    "_id": "$contentType",
                    "count": {"$sum": 1}
                }},
                {OP_PROJECT: {
                    "contentType": "$_id",
                    "count": 1
                }},
                {OP_SORT: {"count": -1}}
            ]
            logger.info(f"[ANALYTICS] get_content_types - Pipeline: {pipeline}")
            result = await db.links.aggregate(pipeline).to_list(100)
            logger.info(f"[ANALYTICS] get_content_types - Query result: {len(result)} content types found")
            logger.info(f"[ANALYTICS] get_content_types - Returning: {len(result)} content types")
            return result
        except Exception as e:
            logger.error(f"[ANALYTICS ERROR] get_content_types failed: {e}")
            return []
    
    @staticmethod
    async def get_avg_links_per_user(db: Database, start_date_obj: datetime, end_date_obj: datetime) -> float:
        """Get average links per user in period"""
        try:
            # Normalize date range
            normalized_start, normalized_end = AnalyticsService.normalize_date_range(start_date_obj, end_date_obj)
            logger.info(f"[ANALYTICS] get_avg_links_per_user - Input: start={start_date_obj} (normalized={normalized_start}), end={end_date_obj} (normalized={normalized_end})")
            
            pipeline = [
                {OP_MATCH: {
                    F_CREATED: {"$gte": normalized_start, "$lte": normalized_end}
                }},
                {OP_GROUP: {
                    "_id": F_USERID,
                    "linkCount": {OP_SUM: 1}
                }},
                {OP_GROUP: {
                    "_id": None,
                    "avg": {"$avg": "$linkCount"},
                    "max": {"$max": "$linkCount"},
                    "min": {"$min": "$linkCount"}
                }}
            ]
            logger.info(f"[ANALYTICS] get_avg_links_per_user - Pipeline: {pipeline}")
            result = await db.links.aggregate(pipeline).to_list(1)
            avg_links = result[0]["avg"] if result and result[0].get("avg") else 0
            logger.info(f"[ANALYTICS] get_avg_links_per_user - Query result: avg={avg_links}, max={result[0].get('max') if result else None}, min={result[0].get('min') if result else None}")
            logger.info(f"[ANALYTICS] get_avg_links_per_user - Returning: {avg_links}")
            return avg_links
        except Exception as e:
            logger.error(f"[ANALYTICS ERROR] get_avg_links_per_user failed: {e}")
            return 0
    
    @staticmethod
    async def get_active_users(db: Database, start_date_obj: datetime, end_date_obj: datetime) -> int:
        """Get count of active users in period"""
        try:
            # Normalize date range
            normalized_start, normalized_end = AnalyticsService.normalize_date_range(start_date_obj, end_date_obj)
            logger.info(f"[ANALYTICS] get_active_users - Input: start={start_date_obj} (normalized={normalized_start}), end={end_date_obj} (normalized={normalized_end})")
            
            pipeline = [
                {OP_MATCH: {
                    "$or": [
                        {F_CREATED: {"$gte": normalized_start, "$lte": normalized_end}},
                        {F_UPDATED: {"$gte": normalized_start, "$lte": normalized_end}}
                    ]
                }},
                {OP_GROUP: {"_id": F_USERID}},
                {OP_COUNT: "total"}
            ]
            logger.info(f"[ANALYTICS] get_active_users - Pipeline: {pipeline}")
            result = await db.links.aggregate(pipeline).to_list(1)
            active_count = result[0]["total"] if result and result[0].get("total") is not None else 0
            logger.info(f"[ANALYTICS] get_active_users - Query result: {active_count} active users found")
            logger.info(f"[ANALYTICS] get_active_users - Returning: {active_count}")
            return active_count
        except Exception as e:
            logger.error(f"[ANALYTICS ERROR] get_active_users failed: {e}")
            return 0
    
    @staticmethod
    async def get_users_approaching(db: Database) -> List[Dict[str, Any]]:
        """Get users approaching their limits"""
        try:
            logger.info(f"[ANALYTICS] get_users_approaching - Input: no date range (all-time)")
            # Get all user limits (including custom overrides)
            user_limits_map = {}
            try:
                user_limits_docs = await db.user_limits.find({}).to_list(1000)
                user_limits_map = {doc["userId"]: doc for doc in user_limits_docs}
                logger.info(f"[ANALYTICS] get_users_approaching - Found {len(user_limits_map)} user limit overrides")
            except Exception as e:
                logger.warning(f"[ANALYTICS WARNING] Could not fetch user_limits: {e}")
            
            pipeline = [
                {OP_GROUP: {
                    "_id": F_USERID,
                    "linkCount": {OP_SUM: 1},
                    "storage": {
                        OP_SUM: {
                            "$add": [
                                {"$strLenCP": {"$ifNull": ["$title", ""]}},
                                {"$strLenCP": {"$ifNull": ["$url", ""]}},
                                {"$strLenCP": {"$ifNull": ["$description", ""]}},
                                {"$strLenCP": {"$ifNull": ["$content", ""]}},
                                300
                            ]
                        }
                    }
                }                }
            ]
            logger.info(f"[ANALYTICS] get_users_approaching - Pipeline: {pipeline}")
            user_usage = await db.links.aggregate(pipeline).to_list(10000)
            logger.info(f"[ANALYTICS] get_users_approaching - Query result: {len(user_usage)} users found")
            
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
            
            logger.info(f"[ANALYTICS] get_users_approaching - Found {len(approaching)} users approaching limits")
            logger.info(f"[ANALYTICS] get_users_approaching - Returning: {len(approaching)} users")
            return approaching
        except Exception as e:
            logger.error(f"[ANALYTICS ERROR] get_users_approaching failed: {e}")
            return []
    
    @staticmethod
    async def get_extension_versions(db: Database, start_date_obj: datetime, end_date_obj: datetime) -> List[Dict[str, Any]]:
        """Get extension versions distribution"""
        try:
            # Normalize date range
            normalized_start, normalized_end = AnalyticsService.normalize_date_range(start_date_obj, end_date_obj)
            logger.info(f"[ANALYTICS] get_extension_versions - Input: start={start_date_obj} (normalized={normalized_start}), end={end_date_obj} (normalized={normalized_end})")
            
            # Get versions from extension links
            links_pipeline = [
                {OP_MATCH: {
                    F_SOURCE: "extension", 
                    F_EXT_VER: {OP_EXISTS: True, "$ne": None},
                    F_CREATED: {"$gte": normalized_start, "$lte": normalized_end}
                }},
                {OP_GROUP: {
                    "_id": F_EXT_VER,
                    "linkCount": {OP_SUM: 1},
                    "usersFromLinks": {OP_ADDTOSET: F_USERID}
                }}
            ]
            links_result = await db.links.aggregate(links_pipeline).to_list(50)
            
            # Get versions from extension usage events in system_logs
            logs_pipeline = [
                {OP_MATCH: {
                    "type": "extension_usage",
                    "timestamp": {"$gte": normalized_start, "$lte": normalized_end},
                    "details.extensionVersion": {OP_EXISTS: True, "$ne": None}
                }},
                {OP_GROUP: {
                    "_id": "$details.extensionVersion",
                    "usersFromLogs": {OP_ADDTOSET: "$userId"}
                }}
            ]
            logs_result = await db.system_logs.aggregate(logs_pipeline).to_list(50)
            
            # Combine data from both sources
            version_data = {}
            
            # Process links data
            for r in links_result:
                version = r["_id"]
                if version:
                    if version not in version_data:
                        version_data[version] = {
                            "linkCount": 0,
                            "users": set()
                        }
                    version_data[version]["linkCount"] += r.get("linkCount", 0)
                    version_data[version]["users"].update(r.get("usersFromLinks", []))
            
            # Process logs data
            for r in logs_result:
                version = r["_id"]
                if version:
                    if version not in version_data:
                        version_data[version] = {
                            "linkCount": 0,
                            "users": set()
                        }
                    version_data[version]["users"].update([uid for uid in r.get("usersFromLogs", []) if uid])
            
            # Convert to list format
            result = [
                {
                    "version": version,
                    "linkCount": data["linkCount"],
                    "userCount": len(data["users"])
                }
                for version, data in version_data.items()
            ]
            
            # Sort by user count descending
            result.sort(key=lambda x: x["userCount"], reverse=True)
            
            logger.info(f"[ANALYTICS] get_extension_versions - Found {len(result)} unique versions")
            logger.info(f"[ANALYTICS] get_extension_versions - Returning: {len(result)} versions")
            return result
        except Exception as e:
            logger.error(f"[ANALYTICS ERROR] get_extension_versions failed: {e}")
            return []
    
    @staticmethod
    async def get_user_segmentation(db: Database, start_date_obj: datetime, end_date_obj: datetime) -> Dict[str, int]:
        """Segment users into new, returning, power users, casual users"""
        try:
            # Normalize date range
            normalized_start, normalized_end = AnalyticsService.normalize_date_range(start_date_obj, end_date_obj)
            logger.info(f"[ANALYTICS] get_user_segmentation - Input: start={start_date_obj} (normalized={normalized_start}), end={end_date_obj} (normalized={normalized_end})")
            
            # Get all users with their first link date and total links
            pipeline = [
                {OP_GROUP: {
                    "_id": F_USERID,
                    "firstLinkDate": {"$min": F_CREATED},
                    "lastLinkDate": {"$max": F_UPDATED},
                    "totalLinks": {OP_SUM: 1},
                    "linksInPeriod": {
                        OP_SUM: {
                            "$cond": [
                                {"$and": [
                                    {"$gte": [F_CREATED, normalized_start]},
                                    {"$lte": [F_CREATED, normalized_end]}
                                ]},
                                1, 0
                            ]
                        }
                    }
                }}
            ]
            logger.info(f"[ANALYTICS] get_user_segmentation - Pipeline: {pipeline}")
            users_data = await db.links.aggregate(pipeline).to_list(10000)
            logger.info(f"[ANALYTICS] get_user_segmentation - Query result: {len(users_data)} users found")
            
            new_users = 0
            returning_users = 0
            power_users = 0  # 20+ links
            casual_users = 0  # 1-5 links
            moderate_users = 0  # 6-19 links
            
            period_start = normalized_start
            period_end = normalized_end
            
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
            
            result = {
                "newUsers": new_users,
                "returningUsers": returning_users,
                "powerUsers": power_users,
                "moderateUsers": moderate_users,
                "casualUsers": casual_users
            }
            logger.info(f"[ANALYTICS] get_user_segmentation - Segmentation result: {result}")
            logger.info(f"[ANALYTICS] get_user_segmentation - Returning: {result}")
            return result
        except Exception as e:
            logger.error(f"[ANALYTICS ERROR] get_user_segmentation failed: {e}")
            return {"newUsers": 0, "returningUsers": 0, "powerUsers": 0, "moderateUsers": 0, "casualUsers": 0}
    
    @staticmethod
    async def get_engagement_metrics(db: Database, start_date_obj: datetime, end_date_obj: datetime) -> Dict[str, Any]:
        """Calculate engagement depth metrics"""
        try:
            # Normalize date range
            normalized_start, normalized_end = AnalyticsService.normalize_date_range(start_date_obj, end_date_obj)
            logger.info(f"[ANALYTICS] get_engagement_metrics - Input: start={start_date_obj} (normalized={normalized_start}), end={end_date_obj} (normalized={normalized_end})")
            
            # Links per active user in period
            pipeline = [
                {OP_MATCH: {
                    "$or": [
                        {F_CREATED: {"$gte": normalized_start, "$lte": normalized_end}},
                        {F_UPDATED: {"$gte": normalized_start, "$lte": normalized_end}}
                    ]
                }},
                {OP_GROUP: {
                    "_id": F_USERID,
                    "linksCreated": {
                        OP_SUM: {
                            "$cond": [
                                {"$and": [
                                    {"$gte": [F_CREATED, normalized_start]},
                                    {"$lte": [F_CREATED, normalized_end]}
                                ]},
                                1, 0
                            ]
                        }
                    },
                    "linksUpdated": {
                        OP_SUM: {
                            "$cond": [
                                {"$and": [
                                    {"$gte": [F_UPDATED, normalized_start]},
                                    {"$lte": [F_UPDATED, normalized_end]},
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
            logger.info(f"[ANALYTICS] get_engagement_metrics - Pipeline: {pipeline}")
            engagement_data = await db.links.aggregate(pipeline).to_list(10000)
            logger.info(f"[ANALYTICS] get_engagement_metrics - Query result: {len(engagement_data)} active users found")
            
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
            
            result = {
                "avgLinksPerActiveUser": round(total_links_created / active_user_count, 2) if active_user_count > 0 else 0,
                "avgCategoriesPerUser": round(total_categories / active_user_count, 2) if active_user_count > 0 else 0,
                "avgCollectionsPerUser": round(total_collections / active_user_count, 2) if active_user_count > 0 else 0,
                "usersWithCollections": users_with_collections,
                "usersWithMultipleCategories": users_multiple_categories,
                "collectionAdoptionRate": round((users_with_collections / active_user_count * 100), 1) if active_user_count > 0 else 0
            }
            logger.info(f"[ANALYTICS] get_engagement_metrics - Engagement result: {result}")
            logger.info(f"[ANALYTICS] get_engagement_metrics - Returning: {result}")
            return result
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
    
    @staticmethod
    async def get_retention_metrics(db: Database, start_date_obj: datetime, end_date_obj: datetime, active_users: int) -> Dict[str, Any]:
        """Calculate retention and churn indicators"""
        try:
            # Normalize date range
            normalized_start, normalized_end = AnalyticsService.normalize_date_range(start_date_obj, end_date_obj)
            logger.info(f"[ANALYTICS] get_retention_metrics - Input: start={start_date_obj} (normalized={normalized_start}), end={end_date_obj} (normalized={normalized_end}), active_users={active_users}")
            
            # Users who were active in previous period
            previous_period_start = normalized_start - (normalized_end - normalized_start)
            previous_period_end = normalized_start
            
            # Users active in previous period
            previous_active_pipeline = [
                {OP_MATCH: {
                    "$or": [
                        {F_CREATED: {"$gte": previous_period_start, "$lte": previous_period_end}},
                        {F_UPDATED: {"$gte": previous_period_start, "$lte": previous_period_end}}
                    ]
                }},
                {OP_GROUP: {"_id": F_USERID}},
                {OP_COUNT: "total"}
            ]
            logger.info(f"[ANALYTICS] get_retention_metrics - Previous period: {previous_period_start} to {previous_period_end}")
            logger.info(f"[ANALYTICS] get_retention_metrics - Previous active pipeline: {previous_active_pipeline}")
            previous_active = await db.links.aggregate(previous_active_pipeline).to_list(1)
            
            previous_active_count = previous_active[0]["total"] if previous_active and previous_active[0].get("total") else 0
            
            # Users active in current period
            current_active = active_users  # Already calculated
            
            # Users active in both periods (retained)
            retained_users_pipeline = [
                {OP_MATCH: {
                    "$or": [
                        {F_CREATED: {"$gte": previous_period_start, "$lte": previous_period_end}},
                        {F_UPDATED: {"$gte": previous_period_start, "$lte": previous_period_end}}
                    ]
                }},
                {OP_GROUP: {"_id": F_USERID}},
                {OP_PROJECT: {"userId": "$_id"}}
            ]
            logger.info(f"[ANALYTICS] get_retention_metrics - Retained users pipeline: {retained_users_pipeline}")
            retained_users = await db.links.aggregate(retained_users_pipeline).to_list(10000)
            
            retained_user_ids = {u["userId"] for u in retained_users}
            logger.info(f"[ANALYTICS] get_retention_metrics - Previous period users: {len(retained_user_ids)}")
            
            current_active_users_pipeline = [
                {OP_MATCH: {
                    "$or": [
                        {F_CREATED: {"$gte": normalized_start, "$lte": normalized_end}},
                        {F_UPDATED: {"$gte": normalized_start, "$lte": normalized_end}}
                    ]
                }},
                {OP_GROUP: {"_id": F_USERID}},
                {OP_PROJECT: {"userId": "$_id"}}
            ]
            logger.info(f"[ANALYTICS] get_retention_metrics - Current active users pipeline: {current_active_users_pipeline}")
            current_active_users = await db.links.aggregate(current_active_users_pipeline).to_list(10000)
            
            current_active_user_ids = {u["userId"] for u in current_active_users}
            logger.info(f"[ANALYTICS] get_retention_metrics - Current period users: {len(current_active_user_ids)}")
            
            retained_count = len(retained_user_ids & current_active_user_ids)
            
            # Churned users (active in previous but not current)
            churned_count = len(retained_user_ids - current_active_user_ids)
            
            retention_rate = round((retained_count / previous_active_count * 100), 1) if previous_active_count > 0 else 0
            churn_rate = round((churned_count / previous_active_count * 100), 1) if previous_active_count > 0 else 0
            
            result = {
                "retentionRate": retention_rate,
                "churnRate": churn_rate,
                "retainedUsers": retained_count,
                "churnedUsers": churned_count,
                "previousPeriodActive": previous_active_count
            }
            logger.info(f"[ANALYTICS] get_retention_metrics - Retention result: {result}")
            logger.info(f"[ANALYTICS] get_retention_metrics - Returning: {result}")
            return result
        except Exception as e:
            logger.error(f"[ANALYTICS ERROR] get_retention_metrics failed: {e}")
            return {
                "retentionRate": 0,
                "churnRate": 0,
                "retainedUsers": 0,
                "churnedUsers": 0,
                "previousPeriodActive": 0
            }
    
    @staticmethod
    async def get_feature_adoption(db: Database) -> Dict[str, Any]:
        """Calculate feature adoption rates"""
        try:
            logger.info(f"[ANALYTICS] get_feature_adoption - Input: no date range (all-time)")
            # Get total users count for adoption rate calculation
            total_users_pipeline = [
                {OP_GROUP: {"_id": F_USERID}},
                {OP_COUNT: "total"}
            ]
            logger.info(f"[ANALYTICS] get_feature_adoption - Total users pipeline: {total_users_pipeline}")
            total_users_result = await db.links.aggregate(total_users_pipeline).to_list(1)
            total_users_count = total_users_result[0]["total"] if total_users_result and total_users_result[0].get("total") is not None else 0
            logger.info(f"[ANALYTICS] get_feature_adoption - Total users: {total_users_count}")
            
            # Collection usage
            collection_pipeline = [
                {OP_GROUP: {"_id": F_USERID}},
                {OP_COUNT: "total"}
            ]
            logger.info(f"[ANALYTICS] get_feature_adoption - Collection pipeline: {collection_pipeline}")
            users_with_collections = await db.collections.aggregate(collection_pipeline).to_list(1)
            collection_users = users_with_collections[0]["total"] if users_with_collections and users_with_collections[0].get("total") else 0
            logger.info(f"[ANALYTICS] get_feature_adoption - Collection users: {collection_users}")
            
            # Favorite usage
            favorite_pipeline = [
                {OP_MATCH: {F_IS_FAV: True}},
                {OP_GROUP: {"_id": F_USERID}},
                {OP_COUNT: "total"}
            ]
            logger.info(f"[ANALYTICS] get_feature_adoption - Favorite pipeline: {favorite_pipeline}")
            users_with_favorites = await db.links.aggregate(favorite_pipeline).to_list(1)
            favorite_users = users_with_favorites[0]["total"] if users_with_favorites and users_with_favorites[0].get("total") else 0
            logger.info(f"[ANALYTICS] get_feature_adoption - Favorite users: {favorite_users}")
            
            # Archive usage
            archive_pipeline = [
                {OP_MATCH: {F_IS_ARCH: True}},
                {OP_GROUP: {"_id": F_USERID}},
                {OP_COUNT: "total"}
            ]
            logger.info(f"[ANALYTICS] get_feature_adoption - Archive pipeline: {archive_pipeline}")
            users_with_archived = await db.links.aggregate(archive_pipeline).to_list(1)
            archived_users = users_with_archived[0]["total"] if users_with_archived and users_with_archived[0].get("total") else 0
            logger.info(f"[ANALYTICS] get_feature_adoption - Archived users: {archived_users}")
            
            # Tags usage (users who have links with tags)
            tags_pipeline = [
                {OP_MATCH: {F_TAGS: {OP_EXISTS: True, "$ne": [], "$not": {"$size": 0}}}},
                {OP_GROUP: {"_id": F_USERID}},
                {OP_COUNT: "total"}
            ]
            logger.info(f"[ANALYTICS] get_feature_adoption - Tags pipeline: {tags_pipeline}")
            users_with_tags = await db.links.aggregate(tags_pipeline).to_list(1)
            tags_users = users_with_tags[0]["total"] if users_with_tags and users_with_tags[0].get("total") else 0
            logger.info(f"[ANALYTICS] get_feature_adoption - Tags users: {tags_users}")
            
            result = {
                "collectionAdoption": round((collection_users / total_users_count * 100), 1) if total_users_count > 0 else 0,
                "favoriteAdoption": round((favorite_users / total_users_count * 100), 1) if total_users_count > 0 else 0,
                "archiveAdoption": round((archived_users / total_users_count * 100), 1) if total_users_count > 0 else 0,
                "tagsAdoption": round((tags_users / total_users_count * 100), 1) if total_users_count > 0 else 0,
                "collectionUsers": collection_users,
                "favoriteUsers": favorite_users,
                "archiveUsers": archived_users,
                "tagsUsers": tags_users
            }
            logger.info(f"[ANALYTICS] get_feature_adoption - Feature adoption result: {result}")
            logger.info(f"[ANALYTICS] get_feature_adoption - Returning: {result}")
            return result
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
    
    @staticmethod
    async def get_users_with_links(db: Database) -> int:
        """Get count of users who have created at least one link"""
        try:
            logger.info(f"[ANALYTICS] get_users_with_links - Input: no date range (all-time)")
            pipeline = [
                {OP_GROUP: {"_id": F_USERID}},
                {OP_COUNT: "total"}
            ]
            logger.info(f"[ANALYTICS] get_users_with_links - Pipeline: {pipeline}")
            result = await db.links.aggregate(pipeline).to_list(1)
            users_count = result[0]["total"] if result and result[0].get("total") is not None else 0
            logger.info(f"[ANALYTICS] get_users_with_links - Query result: {users_count} users with links found")
            logger.info(f"[ANALYTICS] get_users_with_links - Returning: {users_count}")
            return users_count
        except Exception as e:
            logger.error(f"[ANALYTICS ERROR] get_users_with_links failed: {e}")
            return 0
    
    @staticmethod
    async def get_inactivity_metrics(db: Database) -> Dict[str, Any]:
        """
        Get inactivity and reauthentication metrics for 5-day inactivity policy
        Returns counts of users by inactivity status and reauthentication events
        """
        try:
            from services.user_activity import INACTIVITY_THRESHOLD_DAYS
            from datetime import timedelta
            
            logger.info(f"[ANALYTICS] get_inactivity_metrics - Calculating inactivity metrics")
            
            now = datetime.now(timezone.utc)
            threshold_date = now - timedelta(days=INACTIVITY_THRESHOLD_DAYS)
            warning_date = now - timedelta(days=INACTIVITY_THRESHOLD_DAYS - 2)  # 3 days inactive (2 days before threshold)
            
            # Get all user activity records
            all_activities = await db.user_activity.find({}).to_list(10000)
            
            active_users = 0
            approaching_threshold = 0  # 3-5 days inactive
            inactive_users = 0  # >5 days inactive
            no_activity_record = 0
            
            for activity in all_activities:
                last_activity = activity.get("lastActivity")
                if not last_activity:
                    no_activity_record += 1
                    continue
                
                # Ensure timezone-aware
                if isinstance(last_activity, datetime) and last_activity.tzinfo is None:
                    last_activity = last_activity.replace(tzinfo=timezone.utc)
                
                days_inactive = (now - last_activity).days
                
                if days_inactive < INACTIVITY_THRESHOLD_DAYS - 2:
                    active_users += 1
                elif days_inactive < INACTIVITY_THRESHOLD_DAYS:
                    approaching_threshold += 1
                else:
                    inactive_users += 1
            
            # Get reauthentication events from system_logs
            reauth_pipeline = [
                {OP_MATCH: {"type": "inactivity_reauth_required"}},
                {OP_GROUP: {
                    "_id": "$userId",
                    "count": {OP_SUM: 1},
                    "lastReauth": {"$max": "$timestamp"}
                }},
                {OP_COUNT: "total"}
            ]
            reauth_result = await db.system_logs.aggregate(reauth_pipeline).to_list(1)
            total_reauth_events = reauth_result[0]["total"] if reauth_result and reauth_result[0].get("total") is not None else 0
            
            # Get unique users who required reauth
            unique_reauth_pipeline = [
                {OP_MATCH: {"type": "inactivity_reauth_required"}},
                {OP_GROUP: {"_id": "$userId"}},
                {OP_COUNT: "total"}
            ]
            unique_reauth_result = await db.system_logs.aggregate(unique_reauth_pipeline).to_list(1)
            unique_users_reauth = unique_reauth_result[0]["total"] if unique_reauth_result and unique_reauth_result[0].get("total") is not None else 0
            
            # Get reauth events in last 30 days
            thirty_days_ago = now - timedelta(days=30)
            recent_reauth_pipeline = [
                {OP_MATCH: {
                    "type": "inactivity_reauth_required",
                    "timestamp": {"$gte": thirty_days_ago}
                }},
                {OP_COUNT: "total"}
            ]
            recent_reauth_result = await db.system_logs.aggregate(recent_reauth_pipeline).to_list(1)
            recent_reauth_events = recent_reauth_result[0]["total"] if recent_reauth_result and recent_reauth_result[0].get("total") is not None else 0
            
            result = {
                "activeUsers": active_users,
                "approachingThreshold": approaching_threshold,  # 3-5 days inactive
                "inactiveUsers": inactive_users,  # >5 days inactive
                "noActivityRecord": no_activity_record,
                "totalReauthEvents": total_reauth_events,
                "uniqueUsersReauth": unique_users_reauth,
                "recentReauthEvents": recent_reauth_events,  # Last 30 days
                "inactivityThresholdDays": INACTIVITY_THRESHOLD_DAYS
            }
            
            logger.info(f"[ANALYTICS] get_inactivity_metrics - Result: {result}")
            logger.info(f"[ANALYTICS] get_inactivity_metrics - Returning: {result}")
            return result
        except Exception as e:
            logger.error(f"[ANALYTICS ERROR] get_inactivity_metrics failed: {e}")
            return {
                "activeUsers": 0,
                "approachingThreshold": 0,
                "inactiveUsers": 0,
                "noActivityRecord": 0,
                "totalReauthEvents": 0,
                "uniqueUsersReauth": 0,
                "recentReauthEvents": 0,
                "inactivityThresholdDays": 5
            }
    
    @staticmethod
    async def generate_report(db: Database, start_date_obj: datetime, end_date_obj: datetime) -> Dict[str, Any]:
        """Generate comprehensive analytics report"""
        logger.info(f"[ANALYTICS] generate_report - Input: start={start_date_obj}, end={end_date_obj}")
        # Normalize date range to handle both naive and timezone-aware datetimes
        start_date_obj, end_date_obj = AnalyticsService.normalize_date_range(start_date_obj, end_date_obj)
        logger.info(f"[ANALYTICS] generate_report - Normalized dates: start={start_date_obj}, end={end_date_obj}")
        
        # Run independent queries in parallel for better performance
        total_users_all_time, extension_users_all_time, total_links_all_time, links_in_period, extension_links_in_period, storage_all_time, storage_in_period = await asyncio.gather(
            AnalyticsService.get_total_users_all_time(db),
            AnalyticsService.get_extension_users_all_time(db),
            AnalyticsService.get_total_links_all_time(db),
            AnalyticsService.get_links_in_period(db, start_date_obj, end_date_obj),
            AnalyticsService.get_extension_links_in_period(db, start_date_obj, end_date_obj),
            AnalyticsService.get_storage_all_time(db),
            AnalyticsService.get_storage_in_period(db, start_date_obj, end_date_obj)
        )
        
        web_links_in_period = links_in_period - extension_links_in_period
        
        # Run remaining queries in parallel for better performance
        user_growth, links_growth, top_categories, content_types, avg_links_per_user, active_users, users_approaching, extension_versions, user_segmentation, engagement_metrics, feature_adoption, inactivity_metrics = await asyncio.gather(
            AnalyticsService.get_user_growth(db, start_date_obj, end_date_obj),
            AnalyticsService.get_links_growth(db, start_date_obj, end_date_obj),
            AnalyticsService.get_top_categories(db, start_date_obj, end_date_obj),
            AnalyticsService.get_content_types(db, start_date_obj, end_date_obj),
            AnalyticsService.get_avg_links_per_user(db, start_date_obj, end_date_obj),
            AnalyticsService.get_active_users(db, start_date_obj, end_date_obj),
            AnalyticsService.get_users_approaching(db),
            AnalyticsService.get_extension_versions(db, start_date_obj, end_date_obj),
            AnalyticsService.get_user_segmentation(db, start_date_obj, end_date_obj),
            AnalyticsService.get_engagement_metrics(db, start_date_obj, end_date_obj),
            AnalyticsService.get_feature_adoption(db),
            AnalyticsService.get_inactivity_metrics(db)
        )
        
        # Get retention metrics (depends on active_users)
        retention_metrics = await AnalyticsService.get_retention_metrics(db, start_date_obj, end_date_obj, active_users)
        
        inactive_users = total_users_all_time - active_users if total_users_all_time >= active_users else 0
        
        # Get users with links
        users_with_links = await AnalyticsService.get_users_with_links(db)
        users_without_links = max(0, total_users_all_time - users_with_links)
        
        return {
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
            # PM-FOCUSED METRICS
            "userSegmentation": user_segmentation,
            "engagement": engagement_metrics,
            "retention": retention_metrics,
            "featureAdoption": feature_adoption,
            "inactivity": inactivity_metrics,
            "dateRange": {
                "startDate": start_date_obj.isoformat(),
                "endDate": end_date_obj.isoformat()
            }
        }
    
    @staticmethod
    async def get_users_paginated(
        db: Database,
        page: int,
        limit: int,
        search: Optional[str] = None,
        active_only: Optional[bool] = None,
        inactive_days: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get paginated list of users with statistics - includes ALL authenticated users from multiple sources"""
        from datetime import datetime, timedelta, timezone
        
        try:
            # Step 1: Get ALL unique authenticated users from MULTIPLE sources (comprehensive collection)
            # This ensures we capture all users, not just those in system_logs
            users_from_links = set()
            users_from_limits = set()
            users_from_logs = set()
            users_from_activity = set()
            
            # 1. Users who have created links
            try:
                links_pipeline = [
                    {OP_GROUP: {"_id": F_USERID}},
                    {OP_PROJECT: {"userId": "$_id"}}
                ]
                if search:
                    search_regex = {"$regex": search, "$options": "i"}
                    links_pipeline.insert(0, {
                        OP_MATCH: {
                            "$or": [
                                {"userId": search_regex},
                                {"url": search_regex}
                            ],
                            "userId": {OP_EXISTS: True, "$ne": None}
                        }
                    })
                links_result = await db.links.aggregate(links_pipeline).to_list(10000)
                users_from_links = {u["userId"] for u in links_result if u.get("userId")}
                logger.info(f"[ADMIN USERS] Found {len(users_from_links)} users from links collection")
            except Exception as e:
                logger.warning(f"[ADMIN USERS] Could not fetch users from links: {e}")
            
            # 2. Users in user_limits collection (may include users without links)
            try:
                limits_query = {}
                if search:
                    search_regex = {"$regex": search, "$options": "i"}
                    limits_query = {"userId": search_regex}
                limits_result = await db.user_limits.find(limits_query, {"userId": 1}).to_list(10000)
                users_from_limits = {u["userId"] for u in limits_result if u.get("userId")}
                logger.info(f"[ADMIN USERS] Found {len(users_from_limits)} users from user_limits collection")
            except Exception as e:
                logger.warning(f"[ADMIN USERS] Could not fetch users from user_limits: {e}")
            
            # 3. Users from system_logs (tracks all authenticated user activity)
            try:
                logs_pipeline = [
                    {OP_MATCH: {"userId": {OP_EXISTS: True, "$ne": None}}},
                    {OP_GROUP: {"_id": F_USERID}},
                    {OP_PROJECT: {"userId": "$_id"}}
                ]
                if search:
                    search_regex = {"$regex": search, "$options": "i"}
                    logs_pipeline.insert(0, {
                        OP_MATCH: {
                            "$or": [
                                {"userId": search_regex},
                                {"email": search_regex}
                            ],
                            "userId": {OP_EXISTS: True, "$ne": None}
                        }
                    })
                logs_result = await db.system_logs.aggregate(logs_pipeline).to_list(10000)
                users_from_logs = {u["userId"] for u in logs_result if u.get("userId")}
                logger.info(f"[ADMIN USERS] Found {len(users_from_logs)} users from system_logs collection")
            except Exception as e:
                logger.warning(f"[ADMIN USERS] Could not fetch users from system_logs: {e}")
            
            # 4. Users from user_activity collection (MOST COMPREHENSIVE - tracks ALL authenticated users)
            # This is updated on every successful authentication, so it captures all users who have ever logged in
            try:
                activity_query = {}
                if search:
                    search_regex = {"$regex": search, "$options": "i"}
                    activity_query = {"userId": search_regex}
                activity_result = await db.user_activity.find(activity_query, {"userId": 1}).to_list(10000)
                users_from_activity = {u["userId"] for u in activity_result if u.get("userId")}
                logger.info(f"[ADMIN USERS] Found {len(users_from_activity)} users from user_activity collection")
            except Exception as e:
                logger.warning(f"[ADMIN USERS] Could not fetch users from user_activity: {e}")
            
            # Combine all unique users from all sources
            all_user_ids = list(users_from_links | users_from_limits | users_from_logs | users_from_activity)
            logger.info(f"[ADMIN USERS] Total unique users found: {len(all_user_ids)} (links: {len(users_from_links)}, limits: {len(users_from_limits)}, logs: {len(users_from_logs)}, activity: {len(users_from_activity)})")
            
            if not all_user_ids:
                # No users found
                return {
                    "users": [],
                    "pagination": {
                        "page": page,
                        "limit": limit,
                        "total": 0,
                        "totalPages": 0
                    }
                }
            
            # Step 2: Get link statistics for these users (left join approach)
            # Build match filters
            match_filters = [{"userId": {"$in": all_user_ids}}]
            
            # Get all unique users with their stats from links
            links_pipeline = [
                {OP_MATCH: {"$and": match_filters}},
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
                        OP_SUM: {OP_COND: [{OP_EQ: [F_IS_ARCH, True]}, 1, 0]}
                    }
                }}
            ]
            
            # Execute links aggregation to get stats for users who have links
            users_with_links = await db.links.aggregate(links_pipeline).to_list(10000)
            link_stats_by_user = {u["_id"]: u for u in users_with_links}
            
            # Step 3: Merge all users with their link stats (users without links get 0 stats)
            all_users_with_stats = []
            for user_id in all_user_ids:
                link_stats = link_stats_by_user.get(user_id, {})
                user_data = {
                    "_id": user_id,
                    "linkCount": link_stats.get("linkCount", 0),
                    "firstLinkDate": link_stats.get("firstLinkDate"),
                    "lastLinkDate": link_stats.get("lastLinkDate"),
                    "storage": link_stats.get("storage", 0),
                    "extensionLinks": link_stats.get("extensionLinks", 0),
                    "favoriteLinks": link_stats.get("favoriteLinks", 0),
                    "archivedLinks": link_stats.get("archivedLinks", 0)
                }
                all_users_with_stats.append(user_data)
            
            # Step 4: Calculate last interaction for all users (before filtering)
            # Get last interaction from multiple sources for all users
            all_user_ids_for_interaction = [u["_id"] for u in all_users_with_stats]
            last_interactions_all = {}
            
            # Batch query for efficiency - get user_activity data for all users at once
            activity_records = {}
            try:
                activity_docs = await db.user_activity.find(
                    {"userId": {"$in": all_user_ids_for_interaction}},
                    {"userId": 1, "lastActivity": 1}
                ).to_list(len(all_user_ids_for_interaction))
                activity_records = {doc["userId"]: doc.get("lastActivity") for doc in activity_docs if doc.get("userId")}
            except Exception as e:
                logger.warning(f"[ADMIN USERS] Could not fetch user_activity for last interaction: {e}")
            
            # Batch query for efficiency
            for user_id in all_user_ids_for_interaction:
                dates = []
                
                # From user_activity (MOST RELIABLE - tracks every authenticated request)
                if user_id in activity_records and activity_records[user_id]:
                    activity_date = activity_records[user_id]
                    if isinstance(activity_date, datetime):
                        activity_date = AnalyticsService.normalize_datetime(activity_date)
                        dates.append(activity_date)
                
                # From system_logs (any API activity)
                last_log = await db.system_logs.find_one(
                    {"userId": user_id},
                    sort=[("timestamp", -1)]
                )
                if last_log and last_log.get("timestamp"):
                    log_timestamp = last_log["timestamp"]
                    if isinstance(log_timestamp, datetime):
                        log_timestamp = AnalyticsService.normalize_datetime(log_timestamp)
                        dates.append(log_timestamp)
                
                # From links (data changes)
                last_link = await db.links.find_one(
                    {"userId": user_id},
                    sort=[("updatedAt", -1)]
                )
                if last_link:
                    if last_link.get("createdAt"):
                        link_created = last_link["createdAt"]
                        if isinstance(link_created, datetime):
                            link_created = AnalyticsService.normalize_datetime(link_created)
                            dates.append(link_created)
                    if last_link.get("updatedAt"):
                        link_updated = last_link["updatedAt"]
                        if isinstance(link_updated, datetime):
                            link_updated = AnalyticsService.normalize_datetime(link_updated)
                            dates.append(link_updated)
                
                # From collections (data changes)
                last_collection = await db.collections.find_one(
                    {"userId": user_id},
                    sort=[("updatedAt", -1)]
                )
                if last_collection:
                    if last_collection.get("createdAt"):
                        coll_created = last_collection["createdAt"]
                        if isinstance(coll_created, datetime):
                            coll_created = AnalyticsService.normalize_datetime(coll_created)
                            dates.append(coll_created)
                    if last_collection.get("updatedAt"):
                        coll_updated = last_collection["updatedAt"]
                        if isinstance(coll_updated, datetime):
                            coll_updated = AnalyticsService.normalize_datetime(coll_updated)
                            dates.append(coll_updated)
                
                last_interactions_all[user_id] = max(dates) if dates else None
            
            # Add lastInteraction to user data
            for user in all_users_with_stats:
                user["lastInteraction"] = last_interactions_all.get(user["_id"])
            
            # Step 5: Apply active_only filter if provided
            if active_only is not None:
                # ✅ TIMEZONE SAFE: Use UTC consistently
                thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
                if active_only:
                    # Active: Has activity in last 30 days
                    all_users_with_stats = [
                        u for u in all_users_with_stats
                        if u.get("lastInteraction") and AnalyticsService.normalize_datetime(u["lastInteraction"]) >= thirty_days_ago
                    ]
                else:
                    # Inactive: No activity in last 30 days
                    all_users_with_stats = [
                        u for u in all_users_with_stats
                        if not u.get("lastInteraction") or AnalyticsService.normalize_datetime(u["lastInteraction"]) < thirty_days_ago
                    ]
            
            # Step 6: Apply inactive_days filter if provided
            if inactive_days is not None:
                # ✅ TIMEZONE SAFE: Use UTC consistently for threshold calculation
                threshold_date = datetime.now(timezone.utc) - timedelta(days=inactive_days)
                all_users_with_stats = [
                    u for u in all_users_with_stats
                    if not u.get("lastInteraction") or AnalyticsService.normalize_datetime(u["lastInteraction"]) < threshold_date
                ]
            
            # Step 7: Sort by linkCount descending
            all_users_with_stats.sort(key=lambda x: x.get("linkCount", 0), reverse=True)
            
            # Step 8: Get total count (before pagination)
            total_count = len(all_users_with_stats)
            
            # Step 9: Apply pagination
            start_idx = (page - 1) * limit
            end_idx = start_idx + limit
            paginated_users = all_users_with_stats[start_idx:end_idx]
            
            # Collect user IDs for additional lookups
            user_ids = [u["_id"] for u in paginated_users]
            
            # Lookup emails from system_logs (most recent log entry with email for each user)
            user_emails = {}
            if user_ids:
                try:
                    email_pipeline = [
                        {OP_MATCH: {
                            "userId": {"$in": user_ids},
                            "email": {OP_EXISTS: True, "$ne": None}
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
            
            # Get category counts per user (unique categories from links)
            user_category_counts = {}
            if user_ids:
                try:
                    category_pipeline = [
                        {OP_MATCH: {
                            "userId": {"$in": user_ids},
                            "category": {
                                OP_EXISTS: True,
                                "$ne": None,
                                "$nin": [""]  # Exclude empty strings
                            }
                        }},
                        {OP_GROUP: {
                            "_id": {"userId": F_USERID, "category": "$category"}
                        }},
                        {OP_GROUP: {
                            "_id": "$_id.userId",
                            "categoryCount": {OP_SUM: 1}
                        }}
                    ]
                    category_results = await db.links.aggregate(category_pipeline).to_list(len(user_ids))
                    user_category_counts = {r["_id"]: r["categoryCount"] for r in category_results}
                except Exception as e:
                    logger.info(f"[ADMIN USERS WARNING] Failed to fetch category counts: {e}")
            
            # Get collection counts per user (from collections collection)
            user_collection_counts = {}
            if user_ids:
                try:
                    collection_pipeline = [
                        {OP_MATCH: {"userId": {"$in": user_ids}}},
                        {OP_GROUP: {
                            "_id": F_USERID,
                            "collectionCount": {OP_SUM: 1}
                        }}
                    ]
                    collection_results = await db.collections.aggregate(collection_pipeline).to_list(len(user_ids))
                    user_collection_counts = {r["_id"]: r["collectionCount"] for r in collection_results}
                except Exception as e:
                    logger.info(f"[ADMIN USERS WARNING] Failed to fetch collection counts: {e}")
            
            # Get user profiles (firstName) from user_profiles collection
            user_first_names = {}
            if user_ids:
                try:
                    profile_docs = await db.user_profiles.find({"userId": {"$in": user_ids}}).to_list(len(user_ids))
                    user_first_names = {doc["userId"]: doc.get("firstName") for doc in profile_docs if doc.get("firstName")}
                except Exception as e:
                    logger.info(f"[ADMIN USERS WARNING] Failed to fetch user first names: {e}")
            
            # Get extension usage data from BOTH links AND system_logs for accurate tracking
            user_extension_data = {}
            if user_ids:
                try:
                    # 1. Get extension usage from links (when links are saved via extension)
                    extension_links_pipeline = [
                        {OP_MATCH: {
                            "userId": {"$in": user_ids},
                            "source": "extension"
                        }},
                        {OP_SORT: {F_CREATED: -1}},  # Sort by creation date descending
                        {OP_GROUP: {
                            "_id": F_USERID,
                            "lastExtensionUseFromLinks": {"$max": F_CREATED},
                            "latestExtensionVersionFromLinks": {"$first": F_EXT_VER},
                            "allVersionsFromLinks": {OP_ADDTOSET: F_EXT_VER}
                        }}
                    ]
                    extension_links_results = await db.links.aggregate(extension_links_pipeline).to_list(len(user_ids))
                    
                    # 2. Get extension usage from system_logs (when extension is opened/used)
                    extension_logs_pipeline = [
                        {OP_MATCH: {
                            "userId": {"$in": user_ids},
                            "type": "extension_usage"
                        }},
                        {OP_SORT: {"timestamp": -1}},  # Sort by timestamp descending
                        {OP_GROUP: {
                            "_id": "$userId",
                            "lastExtensionUseFromLogs": {"$max": "$timestamp"},
                            "latestExtensionVersionFromLogs": {
                                "$first": "$details.extensionVersion"
                            },
                            "allVersionsFromLogs": {
                                OP_ADDTOSET: "$details.extensionVersion"
                            }
                        }}
                    ]
                    extension_logs_results = await db.system_logs.aggregate(extension_logs_pipeline).to_list(len(user_ids))
                    
                    # 3. Combine data from both sources - use most recent from either source
                    links_data = {r["_id"]: r for r in extension_links_results}
                    logs_data = {r["_id"]: r for r in extension_logs_results}
                    
                    for user_id in user_ids:
                        links_info = links_data.get(user_id, {})
                        logs_info = logs_data.get(user_id, {})
                        
                        # Get last extension use from both sources
                        last_use_from_links = links_info.get("lastExtensionUseFromLinks")
                        last_use_from_logs = logs_info.get("lastExtensionUseFromLogs")
                        
                        # Use the most recent date from either source
                        last_extension_use = None
                        if last_use_from_links and last_use_from_logs:
                            last_extension_use = max(last_use_from_links, last_use_from_logs)
                        elif last_use_from_links:
                            last_extension_use = last_use_from_links
                        elif last_use_from_logs:
                            last_extension_use = last_use_from_logs
                        
                        # Get extension version - prefer from logs (more recent/accurate), fallback to links
                        latest_version = None
                        if logs_info.get("latestExtensionVersionFromLogs"):
                            latest_version = logs_info.get("latestExtensionVersionFromLogs")
                        elif links_info.get("latestExtensionVersionFromLinks"):
                            latest_version = links_info.get("latestExtensionVersionFromLinks")
                        
                        # Fallback: try to get any version from all versions collected
                        if not latest_version:
                            all_versions_logs = [v for v in logs_info.get("allVersionsFromLogs", []) if v]
                            all_versions_links = [v for v in links_info.get("allVersionsFromLinks", []) if v]
                            all_versions = all_versions_logs + all_versions_links
                            latest_version = all_versions[0] if all_versions else None
                        
                        # Only add if we have at least some extension usage data
                        if last_extension_use or latest_version:
                            user_extension_data[user_id] = {
                                "lastExtensionUse": last_extension_use,
                                "extensionVersion": latest_version
                            }
                            
                except Exception as e:
                    logger.info(f"[ADMIN USERS WARNING] Failed to fetch extension usage data: {e}")
            
            # Transform results
            user_list = []
            for user in paginated_users:
                user_id = user["_id"]
                # Fix: Ensure lastLinkDate is timezone-aware before subtracting
                last_active = user.get("lastLinkDate")
                if last_active:
                    # Fix: If DB date is naive, force it to UTC
                    if isinstance(last_active, datetime) and last_active.tzinfo is None:
                        last_active = last_active.replace(tzinfo=timezone.utc)
                    
                    # Now both are aware, subtraction is safe
                    if isinstance(last_active, datetime):
                        is_active = (datetime.now(timezone.utc) - last_active).days <= 30
                    else:
                        is_active = False
                else:
                    is_active = False
                
                extension_info = user_extension_data.get(user_id, {})
                # Extension is considered "enabled" if user has extension links OR extension usage events
                has_extension_links = user.get("extensionLinks", 0) > 0
                has_extension_usage_events = extension_info.get("lastExtensionUse") is not None
                has_extension_usage = has_extension_links or has_extension_usage_events
                
                link_count = user.get("linkCount", 0)
                storage_bytes = user.get("storage", 0)
                
                user_list.append({
                    "userId": user_id,
                    "email": user_emails.get(user_id),
                    "firstName": user_first_names.get(user_id),
                    "linkCount": link_count,
                    "categoryCount": user_category_counts.get(user_id, 0),
                    "collectionCount": user_collection_counts.get(user_id, 0),
                    "storageBytes": storage_bytes,
                    "storageKB": round(storage_bytes / 1024, 2) if storage_bytes > 0 else 0,
                    "extensionLinks": user.get("extensionLinks", 0),
                    "webLinks": link_count - user.get("extensionLinks", 0),
                    "favoriteLinks": user.get("favoriteLinks", 0),
                    "archivedLinks": user.get("archivedLinks", 0),
                    "firstLinkDate": user["firstLinkDate"].isoformat() if user.get("firstLinkDate") else None,
                    "lastLinkDate": user["lastLinkDate"].isoformat() if user.get("lastLinkDate") else None,
                    "lastInteraction": user.get("lastInteraction").isoformat() if user.get("lastInteraction") else None,
                    "isActive": is_active,
                    "approachingLimit": link_count >= 35 or storage_bytes >= 35 * 1024,
                    "extensionVersion": extension_info.get("extensionVersion") if has_extension_usage else None,
                    "lastExtensionUse": extension_info.get("lastExtensionUse").isoformat() if extension_info.get("lastExtensionUse") else None,
                    "extensionEnabled": has_extension_usage  # Extension is "enabled" if user has used it
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
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            logger.error(f"[ANALYTICS ERROR] get_users_paginated failed: {e}\nTraceback:\n{error_trace}")
            raise
