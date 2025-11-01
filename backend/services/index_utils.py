"""
MongoDB Index Utilities
Provides safe, idempotent index creation that handles conflicts
"""

from typing import List, Tuple, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorCollection
import logging

logger = logging.getLogger(__name__)


async def create_index_safely(
    collection: AsyncIOMotorCollection,
    index_spec: List[Tuple[str, int]] | str,
    unique: bool = False,
    index_name: Optional[str] = None,
    **kwargs
) -> bool:
    """
    Create an index safely, handling conflicts with existing indexes.
    
    Args:
        collection: MongoDB collection
        index_spec: Index specification (list of tuples or string field name)
        unique: Whether the index should be unique (default: False)
        index_name: Optional explicit index name
        **kwargs: Additional index creation options
        
    Returns:
        True if index was created/updated, False if it already exists with correct spec
    """
    try:
        # Convert string to list of tuples for consistency
        if isinstance(index_spec, str):
            index_spec = [(index_spec, 1)]
        
        # Generate index name if not provided
        if index_name is None:
            if len(index_spec) == 1:
                index_name = f"{index_spec[0][0]}_1"
            else:
                # MongoDB's default naming: field1_1_field2_1
                index_name = "_".join([f"{field}_{direction}" for field, direction in index_spec])
        
        # Get existing indexes
        try:
            existing_indexes = await collection.index_information()
        except Exception as e:
            logger.warning(f"Could not get existing indexes: {e}. Proceeding with index creation...")
            existing_indexes = {}
        
        # Check if index already exists
        if index_name in existing_indexes:
            existing_index = existing_indexes[index_name]
            existing_keys = existing_index.get('key', [])
            existing_unique = existing_index.get('unique', False)
            
            # Normalize key format: MongoDB returns as list of tuples
            normalized_existing = []
            for key_item in existing_keys:
                if isinstance(key_item, (list, tuple)) and len(key_item) == 2:
                    normalized_existing.append((key_item[0], key_item[1]))
                else:
                    normalized_existing.append((key_item, 1))
            
            # Normalize our spec
            normalized_spec = sorted(index_spec, key=lambda x: x[0])
            normalized_existing_sorted = sorted(normalized_existing, key=lambda x: x[0])
            
            # Check if keys match
            keys_match = normalized_spec == normalized_existing_sorted
            unique_match = existing_unique == unique
            
            if keys_match and unique_match:
                # Index exists with correct specification
                logger.debug(f"Index '{index_name}' already exists with correct specification")
                return False
            else:
                # Index exists but with different specification - drop and recreate
                logger.info(
                    f"Index '{index_name}' exists with different spec. "
                    f"Keys match: {keys_match}, Unique match: {unique_match}. "
                    f"Dropping and recreating..."
                )
                await collection.drop_index(index_name)
        
        # Create the index
        await collection.create_index(
            index_spec,
            unique=unique,
            name=index_name,
            **kwargs
        )
        logger.debug(f"Created index '{index_name}' (unique={unique})")
        return True
        
    except Exception as e:
        # Handle specific MongoDB error codes
        error_code = getattr(e, 'code', None)
        error_name = getattr(e, 'codeName', None)
        
        if error_code == 86 or error_name == 'IndexKeySpecsConflict':
            # Index conflict - try to drop and recreate
            logger.warning(f"Index conflict detected for '{index_name}': {e}")
            try:
                # Get existing indexes again for conflict resolution
                existing_indexes = await collection.index_information()
                
                # Try to drop all indexes with matching keys
                try:
                    if index_name and index_name in existing_indexes:
                        await collection.drop_index(index_name)
                except Exception as drop_error:
                    # Index might not exist, that's okay
                    logger.debug(f"Could not drop index '{index_name}': {drop_error}")
                # Try to find and drop conflicting indexes
                for name, index_info in existing_indexes.items():
                    if name == index_name:
                        continue
                    index_keys = index_info.get('key', [])
                    # Check if keys match
                    if len(index_keys) == len(index_spec):
                        keys_match = True
                        for i, (field, direction) in enumerate(index_spec):
                            existing_item = index_keys[i]
                            if isinstance(existing_item, (list, tuple)):
                                if existing_item[0] != field:
                                    keys_match = False
                                    break
                            elif existing_item != field:
                                keys_match = False
                                break
                        if keys_match:
                            logger.info(f"Dropping conflicting index '{name}'")
                            await collection.drop_index(name)
                            break
                
                # Retry creating the index
                await collection.create_index(
                    index_spec,
                    unique=unique,
                    name=index_name,
                    **kwargs
                )
                logger.info(f"Successfully created index '{index_name}' after resolving conflict")
                return True
            except Exception as retry_error:
                logger.error(f"Failed to resolve index conflict for '{index_name}': {retry_error}")
                raise
        else:
            # Re-raise other errors
            logger.error(f"Failed to create index '{index_name}': {e}")
            raise


async def ensure_indexes(collection: AsyncIOMotorCollection, index_definitions: List[Dict[str, Any]]) -> None:
    """
    Ensure multiple indexes exist on a collection.
    
    Args:
        collection: MongoDB collection
        index_definitions: List of dicts with keys:
            - 'keys': List of tuples (field, direction) or string field name
            - 'unique': bool (optional, default False)
            - 'name': str (optional, auto-generated if not provided)
            - Additional kwargs for index creation
    """
    for index_def in index_definitions:
        keys = index_def['keys']
        unique = index_def.get('unique', False)
        name = index_def.get('name')
        kwargs = {k: v for k, v in index_def.items() if k not in ['keys', 'unique', 'name']}
        
        await create_index_safely(
            collection=collection,
            index_spec=keys,
            unique=unique,
            index_name=name,
            **kwargs
        )

