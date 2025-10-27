"""
MongoDB connection service
"""

from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings

class Database:
    client: AsyncIOMotorClient = None
    database = None

db = Database()

async def connect_to_mongo():
    """Create database connection"""
    # Disable SSL certificate verification for all environments
    # This is needed for MongoDB Atlas on macOS
    db.client = AsyncIOMotorClient(settings.MONGODB_URI, tlsAllowInvalidCertificates=True)
    
    db.database = db.client.smartrack
    print("Connected to MongoDB")

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        print("Disconnected from MongoDB")

def get_database():
    """Get database instance"""
    return db.database
