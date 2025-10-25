"""
Auth0 authentication and JWT verification
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import requests
from functools import lru_cache

from core.config import settings
from services.mongodb import get_database
from bson import ObjectId

security = HTTPBearer()

@lru_cache()
def get_auth0_public_key():
    """Get Auth0 public key for JWT verification"""
    try:
        jwks_url = f"https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json"
        response = requests.get(jwks_url)
        return response.json()
    except Exception as e:
        print(f"Error fetching Auth0 public key: {e}")
        return None

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify Auth0 JWT token"""
    token = credentials.credentials
    
    try:
        # For development: Simple validation
        # TODO: Implement full JWT verification with Auth0 JWKS
        
        # Mock user for development
        user_data = {
            "sub": "auth0|123456789",
            "email": "user@example.com",
            "name": "Test User"
        }
        
        return user_data
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(token_data: dict = Depends(verify_token)):
    """Get current user from database or create if not exists"""
    db = get_database()
    users_collection = db.users
    
    # Find or create user
    user = await users_collection.find_one({"auth0Id": token_data["sub"]})
    
    if not user:
        # Create new user
        new_user = {
            "auth0Id": token_data["sub"],
            "email": token_data["email"],
            "name": token_data.get("name"),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
            "usageStats": {
                "totalLinks": 0,
                "storageUsed": 0,
                "lastActivity": datetime.utcnow()
            }
        }
        result = await users_collection.insert_one(new_user)
        user = await users_collection.find_one({"_id": result.inserted_id})
    
    return user

from datetime import datetime
