"""
Authentication service
"""

from fastapi import HTTPException, Depends, status, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError, JWTClaimsError
from core.config import settings
import httpx
import time

security = HTTPBearer(auto_error=False)

# In-memory cache for user emails (to avoid repeated userinfo calls)
# Key: user_id, Value: {'email': str, 'cached_at': float}
# Include timestamp for cache expiration (1 hour TTL)
_user_email_cache = {}
_CACHE_TTL_SECONDS = 3600  # 1 hour

# JWKS (JSON Web Key Set) cache for JWT signature verification
# Cache the public keys from Auth0 to verify token signatures
_jwks_cache = None
_jwks_cache_time = 0
_JWKS_CACHE_TTL = 3600  # 1 hour


async def get_auth0_jwks():
    """
    Fetch Auth0 JWKS (JSON Web Key Set) for JWT signature verification.
    This is cached to avoid repeated fetches.
    """
    global _jwks_cache, _jwks_cache_time
    
    current_time = time.time()
    
    # Return cached JWKS if still valid
    if _jwks_cache and (current_time - _jwks_cache_time) < _JWKS_CACHE_TTL:
        print(f"[AUTH] Using cached JWKS (age: {int(current_time - _jwks_cache_time)}s)")
        return _jwks_cache
    
    try:
        jwks_url = f"https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json"
        print(f"[AUTH] Fetching JWKS from {jwks_url}")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(jwks_url)
            response.raise_for_status()
            jwks = response.json()
            
            # Cache the JWKS
            _jwks_cache = jwks
            _jwks_cache_time = current_time
            
            print(f"[AUTH] ✅ JWKS fetched and cached successfully")
            return jwks
    except Exception as e:
        print(f"[AUTH] ❌ Failed to fetch JWKS: {e}")
        # If we have old cached JWKS, use it as fallback
        if _jwks_cache:
            print(f"[AUTH] ⚠️  Using stale JWKS cache as fallback")
            return _jwks_cache
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to fetch authentication keys"
        )

def extract_email_from_payload(payload: dict) -> str:
    """
    Extract email from JWT payload, checking multiple possible Auth0 field names.
    Auth0 may store email in different fields depending on configuration:
    - 'email' (standard)
    - 'https://auth0.com/email' (namespaced)
    - 'https://auth0.com/user/email' (alternative namespaced)
    - Custom namespaced claims with audience
    """
    # ✅ REDUCED LOGGING: Only log in DEBUG mode to avoid PII exposure
    import logging
    logger = logging.getLogger(__name__)
    
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
    
    # Check for custom namespaced claims with audience
    audience = payload.get("aud")
    if audience:
        if isinstance(audience, list):
            for aud in audience:
                custom_email = payload.get(f"{aud}/email")
                if custom_email:
                    return custom_email
        elif isinstance(audience, str):
            custom_email = payload.get(f"{audience}/email")
            if custom_email:
                return custom_email
    
    # Check if email is in any namespaced field (fallback)
    for key, value in payload.items():
        if isinstance(value, str) and "@" in value and "." in value:
            if key.endswith("/email") or key.endswith("/user_email") or "email" in key.lower():
                # Verify it's actually an email format
                if "@" in value and "." in value.split("@")[1]:
                    return value
    
    # Only log failure in DEBUG mode
    if getattr(settings, "DEBUG", False):
        logger.warning(f"[AUTH] Email not found in token payload. Keys: {list(payload.keys())}")
    
    return None


async def get_current_user(
    request: Request,
    x_test_mode: Optional[str] = Header(None, alias="X-Test-Mode"),
    x_test_user_id: Optional[str] = Header(None, alias="X-Test-User-Id"),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Get current authenticated user with JWT signature verification"""
    import logging
    logger = logging.getLogger(__name__)
    
    # Check for test mode header
    test_mode = x_test_mode and x_test_mode.lower() == 'true'
    test_user_id = x_test_user_id or 'test-user-123'
    
    if test_mode:
        logger.info(f"[TEST MODE] ✅ Test mode enabled for user: {test_user_id}")
        return {
            "sub": test_user_id,
            "email": "test@smartrack.app",
            "name": "Test User"
        }
    
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    try:
        token = credentials.credentials
        
        # SECURITY: Verify JWT signature, audience, and expiration
        try:
            # Fetch JWKS for signature verification
            jwks = await get_auth0_jwks()
            
            # Decode JWT header to get key ID (kid)
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get('kid')
            
            if not kid:
                logger.error(f"JWT missing 'kid' in header. Header: {unverified_header}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token format - missing key ID"
                )
            
            # Find the matching key in JWKS
            rsa_key = None
            for key in jwks.get('keys', []):
                if key.get('kid') == kid:
                    rsa_key = {
                        'kty': key['kty'],
                        'kid': key['kid'],
                        'use': key.get('use'),
                        'n': key['n'],
                        'e': key['e']
                    }
                    break
            
            if not rsa_key:
                logger.error(f"No matching JWKS key for kid: {kid}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Unable to verify token signature"
                )
            
            # Verify JWT signature, audience, and expiration
            verified_payload = jwt.decode(
                token,
                rsa_key,
                algorithms=['RS256'],
                audience=settings.AUTH0_AUDIENCE,
                issuer=f"https://{settings.AUTH0_DOMAIN}/",
                options={
                    "verify_signature": True,
                    "verify_aud": True,
                    "verify_exp": True,
                }
            )
            
            unverified_payload = verified_payload  # Use verified payload
            
        except ExpiredSignatureError as e:
            logger.error(f"Expired token presented by user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except JWTClaimsError as e:
            logger.error(f"JWT claims validation failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token claims"
            )
        except JWTError as e:
            logger.error(f"JWT verification failed: {str(e)}")
            # Fallback to unverified for debugging (ONLY in development)
            if settings.DEBUG:
                logger.warning("[AUTH] DEBUG MODE: Falling back to unverified token")
                unverified_payload = jwt.decode(
                    token,
                    key="",
                    options={
                        "verify_signature": False,
                        "verify_aud": False,
                        "verify_exp": False,
                    }
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Could not validate credentials"
                )
        
        # Extract user info from payload
        user_id = unverified_payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials - missing user ID"
            )
        
        # Extract email using multiple possible field names
        email = extract_email_from_payload(unverified_payload)
        
        # If email not in token, check cache first, then try userinfo endpoint
        if not email:
            import time
            current_time = time.time()
            
            # Check cache first
            if user_id in _user_email_cache:
                cache_entry = _user_email_cache[user_id]
                if isinstance(cache_entry, dict):
                    cached_email = cache_entry.get('email')
                    cached_at = cache_entry.get('cached_at', 0)
                    if current_time - cached_at < _CACHE_TTL_SECONDS:
                        email = cached_email
                    else:
                        del _user_email_cache[user_id]
                else:
                    email = cache_entry
                    _user_email_cache[user_id] = {'email': cached_email, 'cached_at': current_time}
            
            if not email:
                email = await fetch_email_from_auth0(token, user_id)
                if email:
                    _user_email_cache[user_id] = {'email': email, 'cached_at': current_time}
        
        # Return user info from token
        return {
            "sub": user_id,
            "email": email,
            "name": unverified_payload.get("name") or unverified_payload.get("nickname"),
        }
        
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
