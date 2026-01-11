"""
MongoDB connection service
"""

from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    database = None

db = Database()

async def connect_to_mongo():
    """
    Create database connection
    
    ✅ SECURITY FIX: TLS certificate validation is now ENABLED by default
    MongoDB Atlas and modern deployments use valid certificates.
    
    If you encounter certificate issues in development:
    - Use MongoDB Atlas (always has valid certs)
    - Or explicitly set tlsAllowInvalidCertificates=True for local dev only
    """
    try:
        # ✅ Secure connection with proper TLS validation
        # Remove tlsAllowInvalidCertificates to enable proper certificate checking
        db.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000,  # Fail fast if connection issues
            maxPoolSize=50,  # Reasonable connection pool
            minPoolSize=10   # Keep some connections warm
        )
        
        # Test the connection
        await db.client.admin.command('ping')
        
        db.database = db.client.smartrack
        logger.info("✅ Connected to MongoDB with secure TLS validation")
        
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {e}")
        logger.error("💡 If you see certificate errors, ensure you're using MongoDB Atlas or a deployment with valid TLS certificates")
        raise

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        logger.info("Disconnected from MongoDB")

def get_database():
    """Get database instance"""
    return db.database
