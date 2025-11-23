import requests
from core.config import settings
import time

class Auth0ManagementService:
    _token = None
    _token_expiry = 0

    @classmethod
    def _get_management_token(cls):
        """
        Get a Management API token using Client Credentials Grant.
        """
        if not settings.AUTH0_CLIENT_SECRET or not settings.AUTH0_CLIENT_ID:
            print("Warning: AUTH0_CLIENT_SECRET or AUTH0_CLIENT_ID not set. Cannot access Management API.")
            return None

        # Check if cached token is valid (with 60s buffer)
        if cls._token and time.time() < cls._token_expiry - 60:
            return cls._token

        url = f"https://{settings.AUTH0_DOMAIN}/oauth/token"
        payload = {
            "client_id": settings.AUTH0_CLIENT_ID,
            "client_secret": settings.AUTH0_CLIENT_SECRET,
            "audience": f"https://{settings.AUTH0_DOMAIN}/api/v2/",
            "grant_type": "client_credentials"
        }
        
        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            
            cls._token = data["access_token"]
            cls._token_expiry = time.time() + data["expires_in"]
            return cls._token
        except Exception as e:
            print(f"Failed to get Auth0 Management Token: {e}")
            return None

    @classmethod
    def get_google_access_token(cls, user_id: str) -> str:
        """
        Fetch the Google Access Token for a specific user from their Auth0 profile.
        """
        token = cls._get_management_token()
        if not token:
            return None

        # Encode the user_id properly (Auth0 IDs often contain pipe characters)
        # Requests handles URL encoding automatically usually, but let's be safe with the path
        import urllib.parse
        safe_user_id = urllib.parse.quote(user_id)
        
        url = f"https://{settings.AUTH0_DOMAIN}/api/v2/users/{safe_user_id}"
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            user_profile = response.json()
            
            # Look for Google identity
            for identity in user_profile.get("identities", []):
                if identity.get("provider") == "google-oauth2":
                    return identity.get("access_token")
            
            print(f"No Google identity found for user {user_id}")
            return None
            
        except Exception as e:
            print(f"Failed to fetch user profile from Auth0: {e}")
            return None

