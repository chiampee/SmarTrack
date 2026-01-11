from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def test():
    # Try local MongoDB first
    try:
        client = AsyncIOMotorClient('mongodb://localhost:27017')
        print("✅ Local MongoDB connection works!")
        await client.close()
    except Exception as e:
        print(f"❌ Local MongoDB failed: {e}")

asyncio.run(test())
