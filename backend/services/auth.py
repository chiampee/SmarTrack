"""
Authentication service
"""

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from core.config import settings

security = HTTPBearer()

def extract_email_from_payload(payload: dict) -> str:
    """
    Extract email from JWT payload, checking multiple possible Auth0 field names.
    Auth0 may store email in different fields depending on configuration:
    - 'email' (standard)
    - 'https://auth0.com/email' (namespaced)
    - 'https://auth0.com/user/email' (alternative namespaced)
    """
    # Check standard email field first
    email = payload.get("email")
    if email:
        return email
    
    # Check Auth0 namespaced fields
    auth0_email = payload.get("https://auth0.com/email")
    if auth0_email:
        return auth0_email
    
    auth0_user_email = payload.get("https://auth0.com/user/email")
    if auth0_user_email:
        return auth0_user_email
    
    # Check if email is in any namespaced field (fallback)
    for key, value in payload.items():
        if key.endswith("/email") or key.endswith("/user_email"):
            if isinstance(value, str) and "@" in value:
                return value
    
    return None


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
            
            # Extract email using multiple possible field names
            email = extract_email_from_payload(unverified_payload)
            
            # Return user info from token
            return {
                "sub": user_id,
                "email": email,
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
