# Auth0 Email Configuration Guide

## Problem
The Auth0 token doesn't include the email claim, causing admin access to fail with "No email in token".

## Frontend Configuration ✅
The frontend is correctly requesting the `email` scope:
- `src/main.tsx`: `scope: 'openid profile email'`
- `src/pages/AdminAnalytics.tsx`: Explicitly requests email scope when refreshing tokens

## What to Check in Auth0 Dashboard

### 1. Check Auth0 API Settings

Go to: https://manage.auth0.com/dashboard

**Navigate to:** Applications → APIs → **Your API** (https://api.smartrack.com)

**Check:**
- ✅ API exists and is configured
- ✅ Token Endpoint Authentication Method is set correctly
- ✅ **Settings tab** → **Show Advanced Settings** → **Grant Types**:
  - ✅ Authorization Code
  - ✅ Implicit
  - ✅ Client Credentials

### 2. Check API Scopes

**In the same API settings:**
- Go to **Scopes** tab
- Verify these scopes exist:
  - ✅ `openid` (always available)
  - ✅ `profile` (always available) 
  - ✅ `email` (needs to be explicitly added)

**If `email` scope doesn't exist:**
1. Click **Add Scope**
2. Name: `email`
3. Description: "User email address"
4. Click **Add**

### 3. Check Application Settings

**Navigate to:** Applications → **Your Application**

**Settings Tab:**
- ✅ **Allowed Callback URLs**: Should include your frontend URLs
- ✅ **Allowed Logout URLs**: Should include your frontend URLs
- ✅ **Allowed Web Origins**: Should include your frontend URLs

**Advanced Settings → Grant Types:**
- ✅ Authorization Code
- ✅ Refresh Token

### 4. Check Auth0 Rules/Actions (Optional)

If you have custom Auth0 Rules or Actions that modify tokens:

**Navigate to:** Actions → Flows → Login

**Check:**
- Ensure no rules are removing the `email` claim from tokens
- If you have custom actions, verify they preserve the email claim

### 5. Test Token in Auth0 Dashboard

**Navigate to:** Applications → **Your Application** → **Test Application**

1. Click **Get Token** tab
2. Select your API audience
3. Request scopes: `openid profile email`
4. Copy the token
5. Go to https://jwt.io and paste the token
6. **Verify the token payload contains:**
   - `sub`: User ID
   - `email`: Your email address (chaimpeer11@gmail.com)
   - `aud`: Your API audience

### 6. Verify Email is Verified in User Profile

**Navigate to:** User Management → Users → **Your User** (chaimpeer11@gmail.com)

**Check:**
- ✅ Email is verified (green checkmark)
- ✅ Email field shows: `chaimpeer11@gmail.com`

**Note:** If email is not verified, Auth0 might not include it in tokens.

## Backend Fallback

The backend now has a fallback mechanism:
- If email is not in the token, it calls Auth0's `/userinfo` endpoint to fetch it
- This should work even if email isn't in the token
- Check Render logs for: `[AUTH] Calling Auth0 userinfo endpoint...`

## Quick Fix Options

### Option 1: Always Request Email Scope (Recommended)

Update `src/hooks/useBackendApi.ts` to always request email scope:

```typescript
const accessToken = await getAccessTokenSilently({
  authorizationParams: {
    scope: 'openid profile email',
  }
})
```

### Option 2: Verify Auth0 API Includes Email in Token

In Auth0 Dashboard → APIs → Your API → **Settings**:
- Ensure **Include Email in Access Token** is enabled (if available)
- Or add a custom scope/claim mapping

### Option 3: Use Auth0 Management API (Advanced)

If email still isn't available, the backend can fetch user details from Auth0 Management API using the user ID (`sub`).

## Testing

After making changes:
1. Clear browser cache/localStorage
2. Log out and log back in
3. Check browser console for token details (or use Debug Token button on Admin Analytics page)
4. Check Render logs for email extraction messages

## Expected Token Payload

A properly configured token should include:

```json
{
  "sub": "google-oauth2|106922222437633552307",
  "email": "chaimpeer11@gmail.com",
  "email_verified": true,
  "name": "Your Name",
  "aud": "https://api.smartrack.com",
  "iss": "https://dev-a5hqcneif6ghl018.us.auth0.com/",
  "scope": "openid profile email"
}
```

If the email is missing from the token, the backend will attempt to fetch it from `/userinfo` endpoint.

