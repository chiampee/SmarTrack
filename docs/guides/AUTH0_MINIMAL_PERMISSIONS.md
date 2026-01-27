# Auth0 Minimal Permissions Configuration Guide

## Overview

This guide explains how to configure Auth0 to request only the minimal permissions required for SmarTrack, eliminating unnecessary permission requests like Google Drive access.

## Problem

When users sign in with Google through Auth0, they may see a consent screen requesting permissions for Google Drive ("View, edit, create, and delete files in Google Drive"), which SmarTrack does not need. This is caused by Auth0's Google social connection being configured with default/broad Google API scopes.

## Solution

The solution involves two parts:
1. **Code-level**: Our application already requests minimal scopes (`openid profile email`)
2. **Auth0 Dashboard**: Configure the Google social connection to request only minimal Google OAuth scopes

## Scope Hierarchy

```
User → SmarTrack App → Auth0 → Google
       (openid profile email)  (openid email profile)
```

- **Application-level scopes** (what we request from Auth0): `openid profile email`
- **Google OAuth scopes** (what Auth0 requests from Google): Should be `openid email profile` only

## What Each Scope Provides

### `openid`
- **Required**: Yes (OIDC standard)
- **Provides**: `sub` (user ID) - uniquely identifies the user
- **Used for**: User identification, authentication

### `email`
- **Required**: Yes
- **Provides**: `email`, `email_verified`
- **Used for**: Admin access checks, user identification, account management

### `profile`
- **Required**: Yes (for user experience)
- **Provides**: `name`, `nickname`, `picture`, `given_name`, `family_name`
- **Used for**: 
  - User display name in sidebar
  - Profile picture/avatar
  - Auto-filling user name in settings
  - First/last name extraction

## Auth0 Dashboard Configuration

### Step 1: Navigate to Google Connection

1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Navigate to: **Authentication** → **Social** → **Google**
3. Click on your Google connection (or create one if it doesn't exist)

### Step 2: Configure Google OAuth Scopes

1. In the Google connection settings, find the **"Attributes"** or **"Advanced Settings"** section
2. Look for **"Scopes"** or **"Requested Scopes"** field
3. **Remove** any Google Drive scopes such as:
   - `https://www.googleapis.com/auth/drive`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/drive.readonly`
   - Any other Google API scopes not needed
4. **Set to only**: `openid email profile`

   **Example configuration**:
   ```
   openid email profile
   ```

### Step 3: Verify Connection Settings

1. Ensure **"Sync user profile attributes at each login"** is enabled (if you want profile updates)
2. Review attribute mapping to ensure only necessary attributes are synced
3. Save the connection settings

### Step 4: Test the Configuration

1. Log out from your application
2. Attempt to sign in with Google
3. Verify the consent screen only shows:
   - Basic profile information (name, email, profile picture)
   - **NOT** Google Drive or other unnecessary permissions

## Application Code Configuration

Our application uses a centralized scope constant to ensure consistency:

**File**: `src/constants/auth0Scopes.ts`

```typescript
export const AUTH0_SCOPES = 'openid profile email' as const
```

This constant is used in:
- `src/main.tsx` - Auth0Provider configuration
- `src/hooks/useBackendApi.ts` - All token requests
- `src/pages/AdminAnalytics.tsx` - Admin token refresh
- `src/pages/LoginPage.tsx` - All login redirects

## What Users Will See

### Before Configuration
- ❌ "View, edit, create, and delete files in Google Drive"
- ❌ Other unnecessary Google API permissions

### After Configuration
- ✅ Basic profile information (name, email, profile picture)
- ✅ Only the permissions actually needed by SmarTrack

## Troubleshooting

### Issue: Google Drive permission still appears

**Solution**: 
1. Verify the Google connection scopes in Auth0 dashboard
2. Clear browser cache and cookies
3. Revoke existing Google permissions for Auth0 in your Google account settings
4. Try signing in again

### Issue: Email not available in token

**Solution**:
1. Ensure `email` scope is included in both:
   - Auth0 application scopes
   - Google connection scopes
2. Check Auth0 API settings to ensure email scope is enabled
3. See [AUTH0_EMAIL_CONFIGURATION.md](./AUTH0_EMAIL_CONFIGURATION.md) for detailed email configuration

### Issue: Profile information missing

**Solution**:
1. Ensure `profile` scope is included in Google connection scopes
2. Verify "Sync user profile attributes" is enabled in Google connection settings
3. Check that the user's Google account has profile information available

## Security Considerations

1. **Principle of Least Privilege**: Only request permissions that are actually needed
2. **User Trust**: Minimal permissions increase user trust and reduce consent screen abandonment
3. **Data Minimization**: We only collect and use the minimum user data required for functionality

## Related Documentation

- [AUTH0_EMAIL_CONFIGURATION.md](./AUTH0_EMAIL_CONFIGURATION.md) - Email scope configuration
- [RENDER_AUTH0_SETUP.md](./RENDER_AUTH0_SETUP.md) - General Auth0 setup guide

## Summary

By configuring Auth0's Google connection to request only `openid email profile` scopes, users will see a minimal, appropriate consent screen that only requests the permissions SmarTrack actually needs. This improves user trust and reduces unnecessary permission requests.
