# 🚀 Auth0 Quick Start Guide

This guide will help you get Auth0 authentication up and running in **5 minutes**.

## Prerequisites

- Node.js 18+ installed
- An Auth0 account (free tier works great!)
- Your Auth0 credentials ready

## 🎯 Quick Setup (5 Minutes)

### Step 1: Configure Auth0 Dashboard (2 minutes)

1. **Go to your Auth0 Dashboard**: https://manage.auth0.com
2. **Navigate to Applications** → **Applications** → **Smart Research Tracker**
3. **Add these URLs to Application Settings**:

   **Allowed Callback URLs:**
   ```
   http://localhost:5173/callback
   https://your-vercel-domain.vercel.app/callback
   ```

   **Allowed Logout URLs:**
   ```
   http://localhost:5173
   https://your-vercel-domain.vercel.app
   ```

   **Allowed Web Origins:**
   ```
   http://localhost:5173
   https://your-vercel-domain.vercel.app
   ```

   **Allowed Origins (CORS):**
   ```
   http://localhost:5173
   https://your-vercel-domain.vercel.app
   ```

4. **Click "Save Changes"** at the bottom

### Step 2: Verify Your .env File (1 minute)

Your `.env` file should already have:

```env
# Auth0 Configuration
VITE_AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
VITE_AUTH0_CLIENT_ID=nAL3tgnPEm2IbcwLzRyTcw7IW4Nulv7T
VITE_AUTH0_AUDIENCE=
```

✅ **Looks good!** These values are already set up.

### Step 3: Start the Development Server (1 minute)

```bash
npm run dev
# or
pnpm dev
```

### Step 4: Test Authentication (1 minute)

1. **Open your browser**: http://localhost:5173
2. **You should see the app directly** (no login in dev mode)
3. **Check the console**: You should see `🔓 [Dev Mode] Authentication disabled - using mock user`

✅ **That's it!** You're using mock authentication for local development.

## 🌐 Testing Production Auth0 (Optional)

To test real Auth0 authentication locally:

1. **Update `src/config/auth0.ts`**:
   ```typescript
   // Temporarily force production mode for testing
   export const AUTH_ENABLED = true; // Changed from: isProduction
   ```

2. **Restart the dev server**

3. **Visit http://localhost:5173**

4. **You should be redirected to Auth0 login**

5. **Sign in with your Auth0 account**

6. **You'll be redirected back to the app**

⚠️ **Remember to revert this change** after testing!

## 🎨 What You Get Out of the Box

### ✅ Frontend Features
- Beautiful login page with feature showcase
- User profile dropdown with avatar
- Protected routes (all main pages)
- Automatic redirect to login when not authenticated
- Loading states during authentication
- Token refresh (automatic)
- Session persistence (localStorage)

### ✅ Backend Features (FastAPI)
- JWT token verification with Auth0 JWKS
- Automatic user creation on first login
- User data stored in MongoDB
- Protected API endpoints
- Mock auth support for development
- Optional authentication endpoints

### ✅ Security Features
- Industry-standard OAuth 2.0
- Automatic token refresh
- Secure token storage
- CSRF protection
- User data isolation by Auth0 ID

## 🧪 Testing Checklist

### Local Development
- [ ] App loads at http://localhost:5173
- [ ] Console shows mock user authentication
- [ ] Can navigate to all pages
- [ ] User profile shows in header
- [ ] No errors in console

### Production (After Deploy)
- [ ] Redirects to Auth0 login page
- [ ] Can sign in with email/password
- [ ] Social login works (if configured)
- [ ] Redirects back to app after login
- [ ] User profile shows correct data
- [ ] Logout works correctly
- [ ] Can log back in

## 🎯 Enable Social Login (Optional)

Want to allow users to sign in with Google, GitHub, etc?

### 1. Google Login

1. **Go to Auth0 Dashboard** → **Authentication** → **Social**
2. **Click "Google"**
3. **Enter your Google OAuth credentials** (or use Auth0 Dev Keys for testing)
4. **Toggle ON**
5. **Save**

### 2. GitHub Login

1. **Same process, select "GitHub"**
2. **Enter GitHub OAuth App credentials**
3. **Toggle ON**
4. **Save**

### 3. Microsoft / Others

Follow the same pattern for any social provider!

## 🔧 Advanced: Backend API Integration

If you want to call your FastAPI backend with authentication:

### 1. Backend Setup

Your backend is already configured! Just set these env vars:

```env
# Backend .env (packages/backend/.env)
AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
AUTH0_AUDIENCE=  # Optional - leave empty for now
MONGODB_URI=your-mongodb-connection-string
```

### 2. Frontend API Calls

Use the `getAccessToken()` method:

```typescript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { getAccessToken } = useAuth();
  
  const fetchProtectedData = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch('http://localhost:8000/api/links', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API call failed:', error);
    }
  };
  
  return (
    <button onClick={fetchProtectedData}>Fetch Data</button>
  );
}
```

### 3. Protected Backend Endpoints

```python
from fastapi import Depends
from services.auth import get_current_user

@app.get("/api/protected")
async def protected_endpoint(user = Depends(get_current_user)):
    return {"message": f"Hello {user['name']}!"}
```

## 🐛 Troubleshooting

### "Redirect URI mismatch"
- Check that callback URL in Auth0 matches exactly: `http://localhost:5173/callback`
- No trailing slash, no `/auth/` prefix

### "App loads but immediately logs out"
- Check that Web Origins are configured in Auth0
- Clear browser cache and cookies
- Check browser console for errors

### "Login button does nothing"
- Check that `VITE_AUTH0_DOMAIN` and `VITE_AUTH0_CLIENT_ID` are set in `.env`
- Restart dev server after changing `.env`
- Check browser console for errors

### "Cannot read properties of undefined"
- Make sure `<AuthProvider>` wraps your app in `src/main.tsx`
- Check that imports are correct

### "Mock user in production"
- Check that your production domain is in the `isProduction` check in `src/config/auth0.ts`
- Current domains: `vercel.app`, `smartracker.vercel.app`

## 📚 Next Steps

1. ✅ **You're done with basic setup!**
2. 📖 Read [AUTH0_INTEGRATION_STATUS.md](./AUTH0_INTEGRATION_STATUS.md) for detailed features
3. 🔒 Review [SECURITY_BEST_PRACTICES.md](./SECURITY_BEST_PRACTICES.md)
4. 🚀 Deploy to Vercel and test production auth
5. 👥 Enable social login providers
6. 📊 Set up Auth0 Management API for admin dashboard

## 🎉 Success!

Your SmarTrack application now has:
- ✅ Secure user authentication
- ✅ User-specific data isolation
- ✅ Cloud sync capability
- ✅ Social login ready
- ✅ Production-ready security

Welcome to the authenticated web! 🚀

