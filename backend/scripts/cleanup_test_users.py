import asyncio
import os
import sys
import logging

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def cleanup_test_users():
    """
    Remove test users and their data from the database.
    Target users: 'mock-user-id', 'test-user', and anything starting with 'test-'
    """
    print("🔌 Connecting to MongoDB...")
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URI, tlsAllowInvalidCertificates=True)
        db = client.smartrack
        
        # Define test user patterns
        test_user_patterns = [
            {"userId": "mock-user-id"},
            {"userId": "test-user"},
            {"userId": {"$regex": "^test-"}},
            {"userId": {"$regex": "^mock-"}}
        ]
        
        query = {"$or": test_user_patterns}
        
        # Count links to be deleted
        link_count = await db.links.count_documents(query)
        print(f"📊 Found {link_count} links belonging to test users.")
        
        if link_count > 0:
            # Delete links
            result = await db.links.delete_many(query)
            print(f"✅ Deleted {result.deleted_count} links.")
        else:
            print("✅ No test links found.")
            
        # Count collections to be deleted
        collection_count = await db.collections.count_documents(query)
        print(f"📊 Found {collection_count} collections belonging to test users.")
        
        if collection_count > 0:
            # Delete collections
            result = await db.collections.delete_many(query)
            print(f"✅ Deleted {result.deleted_count} collections.")
        else:
            print("✅ No test collections found.")
            
        # Also check for users who haven't been active in a long time (optional)
        # For now, we only target explicit test patterns.
        
        print("\n🎉 Cleanup complete!")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    # Confirm before running
    print("⚠️  WARNING: This script will PERMANENTLY DELETE data for users matching:")
    print("   - mock-user-id")
    print("   - test-user")
    print("   - mock-*")
    print("   - test-*")
    
    response = input("\nAre you sure you want to proceed? (y/N): ")
    if response.lower() == 'y':
        asyncio.run(cleanup_test_users())
    else:
        print("❌ Cleanup cancelled.")
