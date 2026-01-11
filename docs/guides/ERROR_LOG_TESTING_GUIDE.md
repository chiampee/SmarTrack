# Error Log Testing Guide
**Date:** November 16, 2025  
**Purpose:** Comprehensive guide to test enhanced error logging

## 🔍 Overview

Enhanced error logging has been implemented across frontend and backend to provide detailed debugging information for authentication and API errors.

---

## 📊 Log Prefixes & Meanings

### Frontend Logs

| Prefix | Level | Meaning | When to See It |
|--------|-------|---------|----------------|
| `[AUTH]` | INFO | Normal authentication operations | Token fetch, refresh, validation |
| `[AUTH WARNING]` | WARN | Non-critical auth issues | Token expiring soon, scheduled refresh |
| `[AUTH ERROR]` | ERROR | Authentication failures | Token expired, decode failed, refresh failed |
| `[API ERROR]` | ERROR | API request failures | 401, 403, 404, 500+ errors |

### Backend Logs

| Prefix | Level | Meaning | When to See It |
|--------|-------|---------|----------------|
| `[AUTH]` | INFO | Normal auth operations | JWKS fetch, signature verify, email extract |
| `[AUTH ERROR]` | ERROR | Auth failures | Invalid token, expired, wrong audience |

---

## 🧪 Test Scenarios

### 1. **Normal Authentication Flow** ✅

**Test Steps:**
1. Open https://smar-track.vercel.app
2. Open browser console (F12 → Console)
3. Click "Get Started" or "Sign In"
4. Login with `chaimpeer11@gmail.com`

**Expected Logs:**
```javascript
[AUTH] 🔄 Fetching fresh token from Auth0...
[AUTH] ✅ Fresh token obtained and stored
[AUTH] Token details: {
  sub: "auth0|...",
  email: "chaimpeer11@gmail.com",
  aud: "https://api.smartrack.com",
  expiresAt: "2025-11-17T...",
  validFor: "1440 minutes"
}
[AUTH] ⏰ Token auto-refresh scheduled in 1435m 0s
[AUTH] Token expires at: 2025-11-17T...
```

---

### 2. **Token Auto-Refresh** ⏰

**Test Steps:**
1. Login and wait 5 minutes before token expiration
2. Keep console open

**Expected Logs:**
```javascript
[AUTH] 🔄 Auto-refreshing token before expiration...
[AUTH] ✅ Token auto-refreshed successfully
[AUTH] Refresh duration: 423ms
[AUTH] New token expires: 2025-11-17T...
[AUTH] New token valid for: 1439 minutes
```

---

### 3. **Invalid Token** ❌

**Test Steps:**
1. Open console on https://smar-track.vercel.app
2. Run: `localStorage.setItem('authToken', 'fake_invalid_token_123')`
3. Refresh page
4. Try to navigate to dashboard

**Expected Frontend Logs:**
```javascript
[AUTH ERROR] Failed to decode token: InvalidTokenError
[AUTH ERROR] Token might be malformed or corrupted
[AUTH ERROR] Error details: {
  errorName: "InvalidTokenError",
  errorMessage: "Invalid token specified",
  tokenLength: 23,
  tokenStart: "fake_invalid_token_1"
}
```

**Expected Backend Logs (on API call):**
```
[AUTH ERROR] ❌ JWT verification failed: ...
[AUTH ERROR] Error type: JWTError
[AUTH ERROR] This could be due to:
[AUTH ERROR]   1. Invalid signature
[AUTH ERROR]   2. Malformed token
[AUTH ERROR]   3. Wrong key used for signing
[AUTH ERROR]   4. JWKS fetch/cache issue
```

---

### 4. **Expired Token** ⏱️

**Test Steps:**
1. Login normally
2. Open console
3. Wait for token to expire (or simulate with old token)
4. Try to make API request

**Expected Frontend Logs:**
```javascript
[AUTH WARNING] Token expired or expiring soon, refreshing before request
[AUTH WARNING] Endpoint: /api/links
[AUTH] ✅ Token refreshed successfully before request
[AUTH] Refresh duration: 356ms
```

**If refresh fails:**
```javascript
[AUTH ERROR] ❌ Failed to refresh expired token before request
[AUTH ERROR] Endpoint: /api/links
[AUTH ERROR] Error: ...
[AUTH ERROR] Will attempt request with expired token (backend will reject)
```

**Expected Backend Logs:**
```
[AUTH ERROR] ❌ Token has expired
[AUTH ERROR] Expiration error details: Signature has expired
[AUTH ERROR] User should re-authenticate
```

---

### 5. **Admin Access (chaimpeer11@gmail.com)** 👑

**Test Steps:**
1. Login as `chaimpeer11@gmail.com`
2. Navigate to `/analytics`
3. Check console and backend logs

**Expected Frontend Logs:**
```javascript
[AUTH] ✅ Using existing valid token from localStorage
[AUTH] Token valid for 1439 minutes 23 seconds
[API] Making request to: https://smartrack-back.onrender.com/api/admin/analytics
```

**Expected Backend Logs:**
```
[AUTH] Fetching JWKS from https://dev-a5hqcneif6ghl018.us.auth0.com/.well-known/jwks.json
[AUTH] ✅ JWKS fetched and cached successfully
[AUTH] ✅ JWT signature verified successfully
[AUTH] User ID: auth0|..., Email extracted: chaimpeer11@gmail.com
[ADMIN GRANTED] User ID: auth0|..., Email: chaimpeer11@gmail.com
```

---

### 6. **401 Unauthorized Error** 🔐

**Test Steps:**
1. Clear all tokens: `localStorage.clear()`
2. Try to access `/dashboard` or `/analytics`

**Expected Frontend Logs:**
```javascript
[API ERROR] ❌ Request failed: /api/links
[API ERROR] Status: 401
[API ERROR] Message: Could not validate credentials
[API ERROR] 🔐 Authentication failed - token might be invalid or expired
[API ERROR] Token present: false
```

**Expected Backend Logs:**
```
[AUTH ERROR] ❌ No 'kid' (key ID) in JWT header
[AUTH ERROR] JWT header keys: [...]
[AUTH ERROR] This indicates a malformed token
```

---

### 7. **403 Forbidden (Non-Admin Access)** 🚫

**Test Steps:**
1. Login with a non-admin email (not `chaimpeer11@gmail.com`)
2. Try to access `/analytics`

**Expected Frontend Logs:**
```javascript
[API ERROR] ❌ Request failed: /api/admin/analytics
[API ERROR] Status: 403 or 404
[API ERROR] Message: Not found
[API ERROR] 🚫 Forbidden - insufficient permissions
[API ERROR] Endpoint may require admin access
```

**Expected Backend Logs:**
```
[ADMIN DENIED] User ID: auth0|..., Email: other@example.com
Reason: Email 'other@example.com' not in admin list ['chaimpeer11@gmail.com']
```

---

### 8. **Network Error** 🌐

**Test Steps:**
1. Disconnect internet
2. Try to make any API request

**Expected Frontend Logs:**
```javascript
🚨 [API ERROR] Network error - Failed to fetch
[API ERROR] Full URL: https://smartrack-back.onrender.com/api/links
[API ERROR] Backend base URL: https://smartrack-back.onrender.com
[API ERROR] This usually means:
  1. Backend URL is wrong
  2. Backend is down
  3. CORS is blocking the request
  4. VITE_BACKEND_URL not set in Vercel environment variables
```

---

### 9. **Token Refresh Scheduling** ⏲️

**Test Steps:**
1. Login normally
2. Check console immediately

**Expected Logs:**
```javascript
[AUTH] ⏰ Token auto-refresh scheduled in 1435m 0s
[AUTH] Token expires at: 2025-11-17T20:30:45.000Z
```

**When timer is cleared:**
```javascript
[AUTH] Clearing token refresh timer
```

---

### 10. **JWKS Cache (Backend)** 🔑

**Test Steps:**
1. Make first admin API call (fresh backend)
2. Make second admin API call

**First Call Logs:**
```
[AUTH] Fetching JWKS from https://dev-a5hqcneif6ghl018.us.auth0.com/.well-known/jwks.json
[AUTH] ✅ JWKS fetched and cached successfully
```

**Second Call Logs:**
```
[AUTH] Using cached JWKS (age: 45s)
[AUTH] ✅ JWT signature verified successfully
```

---

## 🐛 Debugging Tips

### Finding Specific Errors

#### Console Filtering
```javascript
// Show only AUTH logs
localStorage.setItem('debug', 'AUTH')

// Show only errors
// In console, filter by "ERROR"
```

#### Backend Logs (Render)
1. Go to https://dashboard.render.com
2. Navigate to your backend service
3. Click "Logs" tab
4. Filter by "[AUTH" or "[ADMIN"

### Common Error Patterns

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `Failed to decode token` | Malformed JWT | Clear localStorage, re-login |
| `Token has expired` | Token older than 24h | Auto-refresh should handle it |
| `No matching key found in JWKS` | JWKS cache stale | Wait 1 hour or restart backend |
| `Could not validate credentials` | Missing or invalid token | Re-authenticate |
| `Admin access denied` | Wrong email | Use `chaimpeer11@gmail.com` |

---

## 📝 Log Examples in Production

### Successful Admin Login
```
Frontend:
  [AUTH] ✅ Using existing valid token from localStorage
  [AUTH] Token valid for 1439 minutes 23 seconds
  [AUTH] ⏰ Token auto-refresh scheduled in 1434m 23s

Backend:
  [AUTH] Using cached JWKS (age: 234s)
  [AUTH] ✅ JWT signature verified successfully
  [ADMIN GRANTED] User ID: auth0|123, Email: chaimpeer11@gmail.com
```

### Failed Authentication
```
Frontend:
  [AUTH ERROR] Token expired or expiring soon (2365s remaining)
  [AUTH WARNING] Token expired or expiring soon, refreshing before request
  [API ERROR] ❌ Request failed: /api/admin/analytics
  [API ERROR] Status: 401
  [API ERROR] 🔐 Authentication failed - token might be invalid or expired

Backend:
  [AUTH ERROR] ❌ Token has expired
  [AUTH ERROR] Expiration error details: Signature has expired
```

---

## 🔍 Log Verification Checklist

- [ ] Frontend logs show token details (sub, email, aud, expiry)
- [ ] Backend logs show JWT signature verification
- [ ] Token auto-refresh is scheduled correctly
- [ ] Expired tokens trigger refresh before API calls
- [ ] Invalid tokens show detailed error messages
- [ ] Admin access shows email validation
- [ ] JWKS caching reduces Auth0 API calls
- [ ] Network errors show helpful debugging info
- [ ] All error logs include error type and message

---

## 🚀 Quick Test Command

Run the automated security test:
```bash
cd /Users/chaim/SmarTrack
./test-security.sh
```

---

## 📞 Support

If logs show unexpected behavior:

1. **Check frontend console** for `[AUTH ERROR]` or `[API ERROR]`
2. **Check backend logs** on Render for `[AUTH ERROR]` or `[ADMIN DENIED]`
3. **Verify token validity** by checking expiration time in logs
4. **Clear localStorage** if token is corrupted: `localStorage.clear()`
5. **Re-authenticate** if all else fails

---

**Last Updated:** 2025-11-16  
**Version:** 1.0

