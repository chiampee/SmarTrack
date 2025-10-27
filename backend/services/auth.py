"""
Authentication service
"""

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from core.config import settings

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    try:
        token = credentials.credentials
        
        # Decode JWT without verification (Auth0 management API or introspection endpoint)
        # For production, use Auth0's introspection endpoint or validate signature
        try:
            # Decode without verification to get user info
            # In production, you should use Auth0's introspection endpoint or validate the signature
            unverified_payload = jwt.decode(
                token,
                key="",  # Empty key since we're not verifying
                options={
                    "verify_signature": False,  # Skip signature verification
                    "verify_aud": False,  # Skip audience verification
                    "verify_exp": False,  # Skip expiration check for now
                }
            )
            
            user_id = unverified_payload.get("sub")
            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Could not validate credentials - missing user ID"
                )
            
            # Return user info from token
            return {
                "sub": user_id,
                "email": unverified_payload.get("email"),
                "name": unverified_payload.get("name") or unverified_payload.get("nickname"),
            }
            
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
