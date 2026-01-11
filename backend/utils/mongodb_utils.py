"""
MongoDB utility functions
"""

from typing import Dict, Any, List, Optional, Tuple
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException
from urllib.parse import urlparse


def validate_object_id(id_string: str, resource_name: str = "Resource") -> ObjectId:
    """
    Validates and converts a string to MongoDB ObjectId
    
    Args:
        id_string: String ID to validate
        resource_name: Name of the resource for error messages
        
    Returns:
        ObjectId instance
        
    Raises:
        HTTPException: If ID format is invalid
    """
    if not id_string or not isinstance(id_string, str):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {resource_name.lower()} id format: id must be a string"
        )
    
    try:
        return ObjectId(id_string)
    except (InvalidId, ValueError, TypeError):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {resource_name.lower()} id format: '{id_string}' is not a valid ObjectId"
        )


def normalize_document(doc: Dict[str, Any], exclude_fields: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Normalizes a MongoDB document by converting _id to id and removing _id
    ✅ Enhanced: Serializes datetime objects to ISO strings for JSON compatibility
    
    Args:
        doc: MongoDB document dictionary
        exclude_fields: Optional list of fields to exclude from normalization
        
    Returns:
        Normalized document dictionary
    """
    if not doc:
        return {}
    
    # Create a copy to avoid mutating original
    normalized = dict(doc)
    
    # Convert ObjectId to string if present
    if '_id' in normalized:
        if isinstance(normalized['_id'], ObjectId):
            normalized['id'] = str(normalized['_id'])
        elif isinstance(normalized['_id'], str):
            normalized['id'] = normalized['_id']
        else:
            normalized['id'] = str(normalized['_id'])
        
        # Remove _id field
        del normalized['_id']
    
    # ✅ NEW: Serialize datetime objects to ISO strings
    from datetime import datetime
    for key, value in normalized.items():
        if isinstance(value, datetime):
            normalized[key] = value.isoformat()
        elif isinstance(value, ObjectId):
            # Handle nested ObjectIds (e.g., in collectionId)
            normalized[key] = str(value)
    
    # Remove excluded fields
    if exclude_fields:
        for field in exclude_fields:
            normalized.pop(field, None)
    
    return normalized


def normalize_documents(docs: List[Dict[str, Any]], exclude_fields: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    """
    Normalizes a list of MongoDB documents
    
    Args:
        docs: List of MongoDB document dictionaries
        exclude_fields: Optional list of fields to exclude from normalization
        
    Returns:
        List of normalized document dictionaries
    """
    return [normalize_document(doc, exclude_fields) for doc in docs]


def build_user_filter(user_id: str, additional_filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Builds a MongoDB filter query for user-specific resources
    
    Args:
        user_id: User ID to filter by
        additional_filters: Optional additional filter criteria
        
    Returns:
        MongoDB filter dictionary
    """
    filter_query = {"userId": user_id}
    
    if additional_filters:
        filter_query.update(additional_filters)
    
    return filter_query


def build_pagination_query(
    page: int,
    limit: int,
    sort_field: str = "createdAt",
    sort_direction: int = -1
) -> Tuple[int, Dict[str, int]]:
    """
    Builds pagination parameters for MongoDB queries
    
    Args:
        page: Page number (1-indexed)
        limit: Number of items per page
        sort_field: Field to sort by
        sort_direction: Sort direction (1 for ascending, -1 for descending)
        
    Returns:
        Tuple of (skip, sort_dict)
    """
    skip = (page - 1) * limit
    sort_dict = {sort_field: sort_direction}
    
    return skip, sort_dict


def build_search_filter(query_string: str, search_fields: List[str]) -> Dict[str, Any]:
    """
    Builds a MongoDB regex search filter for multiple fields
    
    Args:
        query_string: Search query string
        search_fields: List of fields to search in
        
    Returns:
        MongoDB filter dictionary with $or regex queries
    """
    if not query_string or not search_fields:
        return {}
    
    return {
        "$or": [
            {field: {"$regex": query_string, "$options": "i"}}
            for field in search_fields
        ]
    }


def validate_and_convert_date(date_string: str, field_name: str = "date") -> Any:
    """
    Validates and converts ISO date string to datetime
    
    Args:
        date_string: ISO format date string
        field_name: Name of the field for error messages
        
    Returns:
        datetime object
        
    Raises:
        HTTPException: If date format is invalid
    """
    from datetime import datetime
    
    try:
        return datetime.fromisoformat(date_string.replace('Z', '+00:00'))
    except (ValueError, AttributeError) as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field_name} format: expected ISO 8601 format (e.g., 2024-01-01T00:00:00Z)"
        )

