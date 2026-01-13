# Test Mode Bypass Guide

## Overview
Test mode allows general users to access the SmarTrack dashboard without Auth0 authentication. This is useful for testing, demos, and development.

## How to Enable Test Mode

### Method 1: URL Parameter
Add `?test=true` or `?testMode=true` to any URL:
```
https://smar-track.vercel.app/?test=true
https://smar-track.vercel.app/dashboard?test=true
```

### Method 2: Login Page Button
1. Go to the login page
2. Click the "Test Mode (Bypass Auth)" link at the bottom of the hero section
3. You'll be automatically redirected to the dashboard

### Method 3: Browser Console
Open browser console and run:
```javascript
localStorage.setItem('testMode', 'true')
window.location.reload()
```

## Test User Details
- **User ID**: `test-user-123`
- **Email**: `test@smartrack.app`
- **Name**: `Test User`

## Features in Test Mode

✅ **Full Dashboard Access**
- View and interact with all dashboard features
- Save links (if backend supports test mode)
- Access settings and analytics

✅ **No Auth0 Required**
- Bypasses Auth0 login flow
- No authentication popups
- Instant access

✅ **Visual Indicator**
- Amber banner at top of page: "TEST MODE: Auth0 bypassed"
- Close button to disable test mode

## How to Disable Test Mode

### Method 1: Banner Button
Click the "X" button in the test mode banner at the top of the page

### Method 2: Browser Console
```javascript
localStorage.removeItem('testMode')
window.location.reload()
```

### Method 3: Clear Browser Data
Clear localStorage for the site

## Backend Support

The backend automatically recognizes test mode via headers:
- `X-Test-Mode: true`
- `X-Test-User-Id: test-user-123`

When these headers are present, the backend:
- Bypasses JWT verification
- Returns test user object
- Allows API access without Auth0 token

## Security Notes

⚠️ **Important**: Test mode should only be used in:
- Development environments
- Testing scenarios
- Internal demos

**Do NOT enable test mode in production** without proper access controls.

## Technical Details

### Frontend
- `TestModeContext` manages test mode state
- Persists in `localStorage` as `testMode: 'true'`
- Generates test tokens for API calls
- Adds test headers to all requests

### Backend
- `auth.py` checks for `X-Test-Mode` header
- Returns test user when header is present
- Security dependency is optional (`auto_error=False`)

## Troubleshooting

**Test mode not working?**
1. Check browser console for errors
2. Verify `localStorage.getItem('testMode')` returns `'true'`
3. Check network tab for `X-Test-Mode` header in requests
4. Ensure backend is running and accepts test mode

**Can't disable test mode?**
1. Clear browser localStorage
2. Close and reopen browser
3. Use incognito/private window
