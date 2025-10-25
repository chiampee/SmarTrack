"""
Auth0 authentication and JWT verification
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import requests
from functools import lru_cache
from datetime import datetime

from core.config import settings
from services.mongodb import get_database
from bson import ObjectId

security = HTTPBearer()

@lru_cache()
def get_auth0_public_key():
    """Get Auth0 public key for JWT verification (JWKS)"""
    try:
        jwks_url = f"https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json"
        response = requests.get(jwks_url, timeout=5)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching Auth0 public key: {e}")
        return None

def verify_jwt_token(token: str) -> dict:
    """
    Verify Auth0 JWT token and return decoded payload
    """
    try:
        # Get JWKS from Auth0
        jwks = get_auth0_public_key()
        if not jwks:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to fetch Auth0 public key"
            )
        
        # Get the key ID from token header
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        
        # Find the correct key
        for key in jwks.get("keys", []):
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break
        
        if not rsa_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find appropriate key"
            )
        
        # Verify and decode the token
        decode_options = {
            "algorithms": settings.AUTH0_ALGORITHMS,
            "issuer": f"https://{settings.AUTH0_DOMAIN}/"
        }
        
        # Only validate audience if it's configured
        if settings.AUTH0_AUDIENCE:
            decode_options["audience"] = settings.AUTH0_AUDIENCE
        
        payload = jwt.decode(token, rsa_key, **decode_options)
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTClaimsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims"
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify Auth0 JWT token from request
    
    For local development without Auth0, you can bypass by setting DEBUG=True
    and using a mock token.
    """
    token = credentials.credentials
    
    # Development mode bypass (optional)
    if settings.DEBUG and token == "mock-token-for-development":
        print("⚠️  Using mock authentication (DEBUG mode)")
        return {
            "sub": "local-dev-user",
            "email": "dev@localhost",
            "name": "Local Developer"
        }
    
    # Production: Verify real JWT
    try:
        payload = verify_jwt_token(token)
        return payload
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(token_data: dict = Depends(verify_token)):
    """
    Get current user from database or create if not exists
    
    This automatically creates a new user record on first authentication.
    User data is keyed by Auth0 ID (sub claim).
    """
    db = get_database()
    users_collection = db.users
    
    auth0_id = token_data["sub"]
    
    # Find existing user
    user = await users_collection.find_one({"auth0Id": auth0_id})
    
    if not user:
        # Create new user on first login
        new_user = {
            "auth0Id": auth0_id,
            "email": token_data.get("email"),
            "name": token_data.get("name"),
            "picture": token_data.get("picture"),
            "emailVerified": token_data.get("email_verified", False),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
            "lastLoginAt": datetime.utcnow(),
            "usageStats": {
                "totalLinks": 0,
                "storageUsed": 0,
                "lastActivity": datetime.utcnow()
            }
        }
        result = await users_collection.insert_one(new_user)
        user = await users_collection.find_one({"_id": result.inserted_id})
        print(f"✅ Created new user: {auth0_id}")
    else:
        # Update last login time
        await users_collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "lastLoginAt": datetime.utcnow(),
                    "usageStats.lastActivity": datetime.utcnow()
                }
            }
        )
    
    return user

def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Optional authentication - returns None if no valid token
    Useful for endpoints that work with or without authentication
    """
    try:
        return verify_token(credentials)
    except HTTPException:
        return None
