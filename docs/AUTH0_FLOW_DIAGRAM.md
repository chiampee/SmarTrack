# 🔄 Auth0 Authentication Flow

Visual guide to understanding how authentication works in SmarTrack.

---

## 🏠 Local Development Flow

```
┌─────────────────────────────────────────────────────────┐
│  User opens http://localhost:5173                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  AuthProvider checks: AUTH_ENABLED = false              │
│  (because not in production)                            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  MockAuthProvider activates                             │
│  - Creates mock user: "local-dev-user"                  │
│  - Sets isAuthenticated = true                          │
│  - No redirect, no login screen                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  App loads normally                                      │
│  - All routes accessible                                │
│  - User profile shows "Local Developer"                 │
│  - Data saved in local IndexedDB                        │
└─────────────────────────────────────────────────────────┘

Console output: 🔓 [Dev Mode] Authentication disabled - using mock user
```

---

## 🌐 Production Flow - First Time User

```
┌─────────────────────────────────────────────────────────┐
│  User visits https://your-app.vercel.app                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  AuthProvider checks: AUTH_ENABLED = true               │
│  (production detected)                                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  No token found in localStorage                         │
│  isAuthenticated = false                                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  ProtectedRoute component redirects to /login           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  LoginPage displays                                     │
│  - Beautiful landing page                               │
│  - Features showcase                                    │
│  - "Sign In" button                                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼ (user clicks "Sign In")
┌─────────────────────────────────────────────────────────┐
│  loginWithRedirect() called                             │
│  Browser redirected to Auth0:                           │
│  https://dev-a5hqcneif6ghl018.us.auth0.com/authorize    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Auth0 Login Page                                       │
│  - Email/password form                                  │
│  - Social login buttons (if enabled)                    │
│  - Forgot password link                                 │
│  - Sign up link                                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼ (user signs up or logs in)
┌─────────────────────────────────────────────────────────┐
│  Auth0 authenticates user                               │
│  - Verifies credentials                                 │
│  - Generates JWT token                                  │
│  - Creates user record in Auth0                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Auth0 redirects back to your app:                      │
│  https://your-app.vercel.app/callback?code=...          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  AuthCallbackPage receives code                         │
│  - Shows "Completing sign in..." spinner               │
│  - Auth0 SDK exchanges code for tokens                  │
│  - Tokens stored in localStorage                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  isAuthenticated becomes true                           │
│  AuthCallbackPage redirects to "/"                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  App loads with authenticated user                      │
│  - User profile appears in header                       │
│  - User data loaded from IndexedDB (or empty)           │
│  - User audit record created                            │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Production Flow - Returning User

```
┌─────────────────────────────────────────────────────────┐
│  User visits https://your-app.vercel.app                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  AuthProvider checks localStorage for tokens            │
│  - Access token found                                   │
│  - Refresh token found                                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Auth0 SDK validates token                              │
│  - Checks expiration                                    │
│  - If expired, uses refresh token to get new one        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  isAuthenticated = true                                 │
│  User data loaded                                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  App loads normally                                     │
│  - No redirect to login                                 │
│  - User profile visible                                 │
│  - User's data displayed                                │
└─────────────────────────────────────────────────────────┘
```

---

## 🚪 Logout Flow

```
┌─────────────────────────────────────────────────────────┐
│  User clicks logout in UserProfile dropdown             │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  logout() function called                               │
│  - Clears localStorage tokens                           │
│  - Calls Auth0 logout endpoint                          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Auth0 clears session                                   │
│  Redirects to: window.location.origin                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  User lands on homepage                                 │
│  isAuthenticated = false                                │
│  Redirects to /login                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Backend API Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│  Frontend needs to call backend API                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend calls getAccessToken()                        │
│  - Retrieves token from localStorage                    │
│  - Refreshes if needed (automatic)                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend makes API request:                            │
│  fetch('/api/links', {                                  │
│    headers: { Authorization: `Bearer ${token}` }        │
│  })                                                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Backend receives request                               │
│  - Extracts Bearer token from header                    │
│  - Calls verify_token() function                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Backend verifies token with Auth0                      │
│  1. Fetch JWKS from Auth0 (cached)                      │
│  2. Extract key ID from token header                    │
│  3. Find matching public key                            │
│  4. Verify signature                                    │
│  5. Check expiration                                    │
│  6. Validate issuer and audience                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Token valid ✅                                         │
│  - Extract user data from token (sub, email, name)      │
│  - Call get_current_user()                              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Backend queries MongoDB                                │
│  - Find user by auth0Id (sub claim)                     │
│  - If not found, create new user record                 │
│  - Update last login time                               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Backend returns user's data                            │
│  - Only data belonging to this user                     │
│  - Filtered by auth0Id                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔒 Token Lifecycle

```
Token Created (Auth0)
    ↓
    │ Access Token Lifespan: 24 hours
    │ Refresh Token Lifespan: 30 days
    │
    ↓
Stored in localStorage
    ↓
    │ Used for API requests
    │ Automatically included by Auth0 SDK
    │
    ↓
Token Expires (after 24 hours)
    ↓
    │ Auth0 SDK detects expiration
    │ Automatically uses refresh token
    │
    ↓
New Access Token Retrieved
    ↓
    │ Transparent to user
    │ No re-login required
    │
    ↓
Refresh Token Expires (after 30 days)
    ↓
User must log in again
```

---

## 🎯 Key Components

### Frontend

| Component | Purpose |
|-----------|---------|
| `AuthProvider` | Wraps entire app, provides auth context |
| `Auth0Provider` | Auth0 SDK wrapper (production only) |
| `MockAuthProvider` | Fake auth for local development |
| `useAuth()` | Hook to access auth state anywhere |
| `ProtectedRoute` | Redirects to login if not authenticated |
| `LoginPage` | Beautiful landing with Sign In button |
| `AuthCallbackPage` | Handles OAuth redirect |
| `UserProfile` | Shows user info and logout button |

### Backend

| Component | Purpose |
|-----------|---------|
| `verify_token()` | Verifies JWT with Auth0 JWKS |
| `get_current_user()` | Gets/creates user from database |
| `get_auth0_public_key()` | Fetches JWKS from Auth0 (cached) |
| `verify_jwt_token()` | Full JWT validation logic |

---

## 🌟 Benefits of This Setup

### For Users
- ✅ **Single Sign-On**: One account, all devices
- ✅ **Social Login**: Use Google, GitHub, etc.
- ✅ **Secure**: No passwords stored in your app
- ✅ **Convenient**: Remember me / auto-login
- ✅ **Password Reset**: Handled by Auth0

### For Developers
- ✅ **No Auth Code**: Auth0 handles everything
- ✅ **Scalable**: Works for 1 or 1 million users
- ✅ **Secure by Default**: Industry best practices
- ✅ **Easy to Debug**: Auth0 dashboard logs
- ✅ **Free to Start**: 7,000 free users

### For Your App
- ✅ **User Isolation**: Each user has private data
- ✅ **Multi-Device**: Same account, all devices
- ✅ **Analytics**: Track user behavior
- ✅ **Compliance**: GDPR, SOC 2 ready
- ✅ **Professional**: Production-grade auth

---

## 📊 Data Flow

```
User Signs In
    ↓
Auth0 creates JWT token
    ↓
Token stored in browser localStorage
    ↓
Token sent with every API request
    ↓
Backend verifies token
    ↓
Backend knows which user is making request
    ↓
Backend returns only that user's data
    ↓
Frontend displays user-specific data
```

---

## 🔄 Session Management

| Scenario | Behavior |
|----------|----------|
| User closes browser | Session preserved (localStorage) |
| User clears cache | Must log in again |
| Token expires | Auto-refreshed (transparent) |
| Refresh token expires | Must log in again |
| User clicks logout | Session cleared immediately |
| User logs in elsewhere | Same user ID, synced data |

---

## 🎨 UI States

```
Loading State
    ↓
    ├─→ Not Authenticated → Show Login Page
    │
    └─→ Authenticated → Show App
              ↓
              ├─→ User Profile in Header
              ├─→ Protected Routes Accessible
              ├─→ User Data Displayed
              └─→ Logout Button Available
```

---

## 💡 Best Practices in Your Implementation

✅ **Mock Auth for Development**: No Auth0 needed locally
✅ **Token Refresh**: Automatic, transparent
✅ **Session Persistence**: Survives browser restart
✅ **Protected Routes**: Can't access without login
✅ **User Isolation**: Data filtered by auth0Id
✅ **Error Handling**: Graceful fallbacks
✅ **Loading States**: Smooth user experience
✅ **Security**: Tokens verified on every request

---

## 🚀 Ready to Use!

Your authentication flow is **complete**, **secure**, and **production-ready**!

Users will have a smooth experience from sign-up to logout, and you have full control over authentication and authorization.

---

**Questions?** Check out:
- [AUTH0_QUICK_START.md](AUTH0_QUICK_START.md)
- [AUTH0_INTEGRATION_STATUS.md](AUTH0_INTEGRATION_STATUS.md)
- [Auth0 Documentation](https://auth0.com/docs)

