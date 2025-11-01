"""
Authentication service
"""

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from core.config import settings

security = HTTPBearer()

# In-memory cache for user emails (to avoid repeated userinfo calls)
# Key: user_id, Value: {'email': str, 'cached_at': float}
# Include timestamp for cache expiration (1 hour TTL)
_user_email_cache = {}
_CACHE_TTL_SECONDS = 3600  # 1 hour

def extract_email_from_payload(payload: dict) -> str:
    """
    Extract email from JWT payload, checking multiple possible Auth0 field names.
    Auth0 may store email in different fields depending on configuration:
    - 'email' (standard)
    - 'https://auth0.com/email' (namespaced)
    - 'https://auth0.com/user/email' (alternative namespaced)
    - Custom namespaced claims with audience
    """
    # Log all payload keys for debugging
    all_keys = list(payload.keys())
    print(f"[AUTH] Token payload keys: {all_keys}")
    
    # Check standard email field first
    email = payload.get("email")
    if email:
        print(f"[AUTH] ✅ Found email in standard 'email' field: {email}")
        return email
    
    # Check Auth0 namespaced fields
    auth0_email = payload.get("https://auth0.com/email")
    if auth0_email:
        print(f"[AUTH] ✅ Found email in 'https://auth0.com/email': {auth0_email}")
        return auth0_email
    
    auth0_user_email = payload.get("https://auth0.com/user/email")
    if auth0_user_email:
        print(f"[AUTH] ✅ Found email in 'https://auth0.com/user/email': {auth0_user_email}")
        return auth0_user_email
    
    # Check for custom namespaced claims with audience (e.g., https://api.smartrack.com/email)
    audience = payload.get("aud")
    if audience:
        # Handle both string and list audiences
        if isinstance(audience, list):
            for aud in audience:
                custom_email = payload.get(f"{aud}/email")
                if custom_email:
                    print(f"[AUTH] ✅ Found email in custom claim '{aud}/email': {custom_email}")
                    return custom_email
        elif isinstance(audience, str):
            custom_email = payload.get(f"{audience}/email")
            if custom_email:
                print(f"[AUTH] ✅ Found email in custom claim '{audience}/email': {custom_email}")
                return custom_email
    
    # Check if email is in any namespaced field (fallback)
    print(f"[AUTH] 🔍 Searching for email in all payload fields...")
    for key, value in payload.items():
        if isinstance(value, str) and "@" in value and "." in value:
            # Check if it looks like an email
            if key.endswith("/email") or key.endswith("/user_email") or "email" in key.lower():
                print(f"[AUTH] ✅ Found potential email in field '{key}': {value}")
                # Verify it's actually an email format
                if "@" in value and "." in value.split("@")[1]:
                    return value
    
    # Log all string values that contain @ (potential emails)
    print(f"[AUTH] ⚠️  Email not found. Checking for email-like values in payload...")
    for key, value in payload.items():
        if isinstance(value, str) and "@" in value:
            print(f"[AUTH]   Found '@' in '{key}': {value}")
    
    print(f"[AUTH] ❌ Email not found in token payload")
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
            
            # Debug: Log full token payload structure
            print(f"[AUTH] 📋 Full token payload analysis for user: {user_id}")
            print(f"[AUTH]   All keys in payload: {list(unverified_payload.keys())}")
            print(f"[AUTH]   Audience (aud): {unverified_payload.get('aud')}")
            print(f"[AUTH]   Scope: {unverified_payload.get('scope')}")
            print(f"[AUTH]   Issuer (iss): {unverified_payload.get('iss')}")
            
            # Check each field that might contain email
            email_fields_to_check = [
                'email',
                'https://auth0.com/email',
                'https://auth0.com/user/email',
                f"{unverified_payload.get('aud')}/email" if unverified_payload.get('aud') else None,
            ]
            # Remove None values
            email_fields_to_check = [f for f in email_fields_to_check if f]
            
            print(f"[AUTH]   Checking email fields: {email_fields_to_check}")
            for field in email_fields_to_check:
                value = unverified_payload.get(field)
                if value:
                    print(f"[AUTH]     '{field}': {value}")
                else:
                    print(f"[AUTH]     '{field}': ❌ not found")
            
            # Extract email using multiple possible field names
            email = extract_email_from_payload(unverified_payload)
            
            # If email not in token, check cache first, then try userinfo endpoint
            if not email:
                import time
                current_time = time.time()
                
                # Check cache first (to avoid repeated userinfo calls)
                if user_id in _user_email_cache:
                    cache_entry = _user_email_cache[user_id]
                    # Handle both old format (string) and new format (dict)
                    if isinstance(cache_entry, dict):
                        cached_email = cache_entry.get('email')
                        cached_at = cache_entry.get('cached_at', 0)
                        # Check if cache is still valid (not expired)
                        if current_time - cached_at < _CACHE_TTL_SECONDS:
                            print(f"[AUTH] ✅ Using cached email for user {user_id}: {cached_email} (age: {int(current_time - cached_at)}s)")
                            email = cached_email
                        else:
                            print(f"[AUTH] ⏰ Cached email expired for user {user_id}, will refetch")
                            # Remove expired cache entry
                            del _user_email_cache[user_id]
                    else:
                        # Old format - just use it directly
                        cached_email = cache_entry
                        print(f"[AUTH] ✅ Using cached email (old format) for user {user_id}: {cached_email}")
                        email = cached_email
                        # Update to new format
                        _user_email_cache[user_id] = {'email': cached_email, 'cached_at': current_time}
                
                if not email:
                    print(f"[AUTH] ⚠️  Email not in token or cache for user {user_id}, attempting to fetch from Auth0 userinfo endpoint...")
                    email = await fetch_email_from_auth0(token, user_id)
                    if email:
                        print(f"[AUTH] ✅ Successfully fetched email from Auth0 userinfo: {email}")
                        # Cache the email to avoid repeated userinfo calls
                        _user_email_cache[user_id] = {'email': email, 'cached_at': current_time}
                        print(f"[AUTH] ✅ Cached email for future requests (TTL: {_CACHE_TTL_SECONDS}s)")
                    else:
                        print(f"[AUTH] ❌ Failed to fetch email from Auth0 userinfo for user {user_id}")
            
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


async def fetch_email_from_auth0(token: str, user_id: str) -> str:
    """
    Fetch user email from Auth0 userinfo endpoint if not in token.
    This is a fallback when the token doesn't include email claim.
    Rate-limited to 10 requests/minute - use caching to avoid repeated calls.
    """
    try:
        import httpx
        import logging
        logger = logging.getLogger(__name__)
        
        # Check cache first
        import time
        current_time = time.time()
        
        if user_id in _user_email_cache:
            cache_entry = _user_email_cache[user_id]
            # Handle both old format (string) and new format (dict)
            if isinstance(cache_entry, dict):
                cached_email = cache_entry.get('email')
                cached_at = cache_entry.get('cached_at', 0)
                # Check if cache is still valid (not expired)
                if current_time - cached_at < _CACHE_TTL_SECONDS:
                    print(f"[AUTH] ✅ Using cached email (avoiding userinfo call): {cached_email}")
                    return cached_email
                else:
                    print(f"[AUTH] ⏰ Cached email expired, will refetch")
                    del _user_email_cache[user_id]
            else:
                # Old format - just use it directly
                cached_email = cache_entry
                print(f"[AUTH] ✅ Using cached email (avoiding userinfo call, old format): {cached_email}")
                # Update to new format
                _user_email_cache[user_id] = {'email': cached_email, 'cached_at': current_time}
                return cached_email
        
        # Call Auth0 userinfo endpoint
        userinfo_url = f"https://{settings.AUTH0_DOMAIN}/userinfo"
        print(f"[AUTH] Calling Auth0 userinfo endpoint: {userinfo_url}")
        print(f"[AUTH] Using token for user: {user_id}")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(
                    userinfo_url,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json"
                    }
                )
                
                print(f"[AUTH] Auth0 userinfo response status: {response.status_code}")
                print(f"[AUTH] Auth0 userinfo response headers: {dict(response.headers)}")
                
                if response.status_code == 200:
                    userinfo = response.json()
                    print(f"[AUTH] Auth0 userinfo full response: {userinfo}")
                    print(f"[AUTH] Auth0 userinfo response keys: {list(userinfo.keys())}")
                    
                    # Try to extract email
                    email = extract_email_from_payload(userinfo)
                    if email:
                        logger.info(f"Fetched email from Auth0 userinfo for user {user_id}: {email}")
                        print(f"[AUTH] ✅ Successfully extracted email: {email}")
                        # Cache the email with timestamp
                        import time
                        _user_email_cache[user_id] = {'email': email, 'cached_at': time.time()}
                        print(f"[AUTH] ✅ Cached email for user {user_id} (TTL: {_CACHE_TTL_SECONDS}s)")
                        return email
                    else:
                        print(f"[AUTH] ❌ Email not found in userinfo response")
                        print(f"[AUTH] Available fields: {list(userinfo.keys())}")
                        # Check if email_verified is preventing inclusion
                        if 'email_verified' in userinfo:
                            print(f"[AUTH] Email verified status: {userinfo.get('email_verified')}")
                elif response.status_code == 401:
                    print(f"[AUTH] ❌ Auth0 userinfo returned 401 Unauthorized - token may be invalid or expired")
                    print(f"[AUTH] Response text: {response.text[:500]}")
                elif response.status_code == 403:
                    print(f"[AUTH] ❌ Auth0 userinfo returned 403 Forbidden - may need userinfo scope")
                    print(f"[AUTH] Response text: {response.text[:500]}")
                elif response.status_code == 429:
                    retry_after = response.headers.get('retry-after', 'unknown')
                    rate_limit_reset = response.headers.get('x-ratelimit-reset', 'unknown')
                    print(f"[AUTH] ❌ Auth0 userinfo returned 429 Too Many Requests")
                    print(f"[AUTH] Rate limit info: retry-after={retry_after}s, reset={rate_limit_reset}")
                    print(f"[AUTH] ⚠️  Auth0 rate limit exceeded. Checking cache...")
                    # Try cache as fallback even if we got rate limited
                    import time
                    current_time = time.time()
                    if user_id in _user_email_cache:
                        cache_entry = _user_email_cache[user_id]
                        if isinstance(cache_entry, dict):
                            cached_email = cache_entry.get('email')
                            if cached_email and (current_time - cache_entry.get('cached_at', 0) < _CACHE_TTL_SECONDS):
                                print(f"[AUTH] ✅ Using cached email despite rate limit: {cached_email}")
                                return cached_email
                        else:
                            # Old format
                            print(f"[AUTH] ✅ Using cached email despite rate limit: {cache_entry}")
                            return cache_entry
                    print(f"[AUTH] ⚠️  No cached email available. Email must be included in JWT token.")
                    print(f"[AUTH] ⚠️  Solution: Configure Auth0 to include email in access token.")
                    logger.warning(f"Auth0 userinfo rate limit exceeded for user {user_id}. Configure Auth0 to include email in token.")
                    # Don't retry immediately - rate limit is per minute, wait for reset
                else:
                    print(f"[AUTH] ❌ Auth0 userinfo endpoint returned error: {response.status_code}")
                    print(f"[AUTH] Response text: {response.text[:500]}")
            except httpx.TimeoutException:
                print(f"[AUTH] ❌ Timeout calling Auth0 userinfo endpoint")
                logger.error("Timeout calling Auth0 userinfo endpoint")
                # Try cache as fallback
                import time
                current_time = time.time()
                if user_id in _user_email_cache:
                    cache_entry = _user_email_cache[user_id]
                    if isinstance(cache_entry, dict):
                        cached_email = cache_entry.get('email')
                        if cached_email and (current_time - cache_entry.get('cached_at', 0) < _CACHE_TTL_SECONDS):
                            print(f"[AUTH] ✅ Using cached email after timeout: {cached_email}")
                            return cached_email
                    else:
                        # Old format
                        print(f"[AUTH] ✅ Using cached email after timeout: {cache_entry}")
                        return cache_entry
                return None
            except httpx.RequestError as e:
                print(f"[AUTH] ❌ Request error calling Auth0 userinfo: {str(e)}")
                logger.error(f"Request error calling Auth0 userinfo: {e}")
                # Try cache as fallback
                import time
                current_time = time.time()
                if user_id in _user_email_cache:
                    cache_entry = _user_email_cache[user_id]
                    if isinstance(cache_entry, dict):
                        cached_email = cache_entry.get('email')
                        if cached_email and (current_time - cache_entry.get('cached_at', 0) < _CACHE_TTL_SECONDS):
                            print(f"[AUTH] ✅ Using cached email after request error: {cached_email}")
                            return cached_email
                    else:
                        # Old format
                        print(f"[AUTH] ✅ Using cached email after request error: {cache_entry}")
                        return cache_entry
                return None
        
        logger.warning(f"Could not fetch email from Auth0 userinfo for user {user_id}")
        return None
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        error_msg = str(e)
        print(f"[AUTH] ❌ Exception fetching email from Auth0 userinfo: {error_msg}")
        print(f"[AUTH] Exception type: {type(e).__name__}")
        logger.warning(f"Failed to fetch email from Auth0 userinfo: {e}")
        # Try cache as fallback
        import time
        current_time = time.time()
        if user_id in _user_email_cache:
            cache_entry = _user_email_cache[user_id]
            if isinstance(cache_entry, dict):
                cached_email = cache_entry.get('email')
                if cached_email and (current_time - cache_entry.get('cached_at', 0) < _CACHE_TTL_SECONDS):
                    print(f"[AUTH] ✅ Using cached email after exception: {cached_email}")
                    return cached_email
            else:
                # Old format
                print(f"[AUTH] ✅ Using cached email after exception: {cache_entry}")
                return cache_entry
        return None
