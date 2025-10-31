"""
Database initialization script
Creates indexes for optimal query performance
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings

async def initialize_database():
    """Initialize database with indexes"""
    try:
        print("🔌 Connecting to MongoDB...")
        client = AsyncIOMotorClient(settings.MONGODB_URI, tlsAllowInvalidCertificates=True)
        db = client.smartrack
        
        print("📊 Creating indexes...")
        
        # Links collection indexes
        links_collection = db.links
        print("  → Creating indexes for 'links' collection...")
        
        # Index on userId (most common query filter)
        await links_collection.create_index("userId")
        print("    ✓ Index created: userId")
        
        # Compound index on userId + isFavorite for faster favorite queries
        await links_collection.create_index([("userId", 1), ("isFavorite", 1)])
        print("    ✓ Index created: userId + isFavorite")
        
        # Compound index on userId + isArchived
        await links_collection.create_index([("userId", 1), ("isArchived", 1)])
        print("    ✓ Index created: userId + isArchived")
        
        # Index on userId + createdAt for date range queries
        await links_collection.create_index([("userId", 1), ("createdAt", -1)])
        print("    ✓ Index created: userId + createdAt")
        
        # Index on userId + url for duplicate checking
        await links_collection.create_index([("userId", 1), ("url", 1)], unique=False)
        print("    ✓ Index created: userId + url")
        
        # Index on userId + category
        await links_collection.create_index([("userId", 1), ("category", 1)])
        print("    ✓ Index created: userId + category")
        
        # Index on userId + collectionId
        await links_collection.create_index([("userId", 1), ("collectionId", 1)])
        print("    ✓ Index created: userId + collectionId")
        
        # Collections collection indexes
        collections_collection = db.collections
        print("  → Creating indexes for 'collections' collection...")
        
        # Index on userId
        await collections_collection.create_index("userId")
        print("    ✓ Index created: userId")
        
        # Compound index on userId + name (for uniqueness per user)
        await collections_collection.create_index([("userId", 1), ("name", 1)], unique=False)
        print("    ✓ Index created: userId + name")
        
        # Categories collection indexes (if it exists)
        categories_collection = db.categories
        print("  → Creating indexes for 'categories' collection...")
        await categories_collection.create_index("userId")
        print("    ✓ Index created: userId")
        
        print("\n✅ Database initialization complete!")
        print("📈 All indexes created successfully.")
        
        # List all indexes
        print("\n📋 Current indexes:")
        links_indexes = await links_collection.index_information()
        print(f"  Links: {len(links_indexes)} indexes")
        for idx_name in links_indexes.keys():
            print(f"    - {idx_name}")
        
        collections_indexes = await collections_collection.index_information()
        print(f"  Collections: {len(collections_indexes)} indexes")
        for idx_name in collections_indexes.keys():
            print(f"    - {idx_name}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(initialize_database())

