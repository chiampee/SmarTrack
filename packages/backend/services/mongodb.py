"""
MongoDB database connection and operations
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from core.config import settings

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

mongodb = MongoDB()

async def connect_to_mongo():
    """Connect to MongoDB"""
    try:
        mongodb.client = AsyncIOMotorClient(settings.MONGODB_URI)
        mongodb.db = mongodb.client.smartrack
        
        # Test connection
        await mongodb.client.admin.command('ping')
        
        # Create indexes
        await create_indexes()
        
        print("✅ MongoDB connected successfully")
    except ConnectionFailure as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close MongoDB connection"""
    if mongodb.client:
        mongodb.client.close()
        print("MongoDB connection closed")

async def create_indexes():
    """Create database indexes"""
    # Users collection
    users_collection = mongodb.db.users
    await users_collection.create_index("auth0Id", unique=True)
    await users_collection.create_index("email")
    
    # Links collection
    links_collection = mongodb.db.links
    await links_collection.create_index([("userId", 1), ("createdAt", -1)])
    await links_collection.create_index([("userId", 1), ("url", 1)], unique=True)
    await links_collection.create_index([("userId", 1), ("tags", 1)])
    await links_collection.create_index([
        ("title", "text"),
        ("content", "text")
    ])
    
    print("✅ Database indexes created")

def get_database():
    """Get database instance"""
    return mongodb.db
