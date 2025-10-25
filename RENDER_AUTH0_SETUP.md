# Add Auth0 to Render Backend

## 🎯 Overview
Configure Auth0 authentication for your Render backend at `https://smartrack-back.onrender.com`

---

## 📋 Step 1: Get Auth0 Credentials

Go to [Auth0 Dashboard](https://manage.auth0.com/dashboard):

1. **Applications** → **SmarTrack Commercial** → **Settings**
2. Copy these values:
   - **Domain**: `your-tenant.auth0.com`
   - **Client ID**: `xxxxxxxxxxxxx`
   - **Client Secret**: `xxxxxxxxxxxxx` (click "eye" icon to reveal)

---

## 🔧 Step 2: Add Environment Variables to Render

### Go to Render Dashboard:
1. Visit: https://dashboard.render.com/
2. Select: **smartrack-back** service
3. Click: **Environment** (left sidebar)
4. Click: **Add Environment Variable**

### Add These Variables:

```bash
# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id_here
AUTH0_CLIENT_SECRET=your_client_secret_here
AUTH0_AUDIENCE=https://your-tenant.auth0.com/api/v2/

# CORS Settings (Allow frontend to call backend)
FRONTEND_URL=https://smartracker.vercel.app
ALLOWED_ORIGINS=https://smartracker.vercel.app,https://smartrack.top,http://localhost:5173,http://localhost:3000

# MongoDB (should already be set)
MONGODB_URI=your_mongodb_atlas_connection_string

# Optional: API Keys for AI features
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

---

## 🌐 Step 3: Update Auth0 Allowed Origins

### Add Render Backend URL to Auth0:

Go to: https://manage.auth0.com/dashboard
→ Applications → SmarTrack Commercial → Settings

### ALLOWED CALLBACK URLs:
```
https://smartracker.vercel.app/callback
https://smartrack.top/callback
https://smartrack-back.onrender.com/callback
http://localhost:5173/callback
http://localhost:3000/callback
```

### ALLOWED LOGOUT URLs:
```
https://smartracker.vercel.app
https://smartrack.top
https://smartrack-back.onrender.com
http://localhost:5173
http://localhost:3000
```

### ALLOWED WEB ORIGINS:
```
https://smartracker.vercel.app
https://smartrack.top
https://smartrack-back.onrender.com
http://localhost:5173
http://localhost:3000
```

Click **Save Changes**

---

## 🔄 Step 4: Redeploy Render Service

After adding environment variables:

1. Render will show: **"Changes detected"**
2. Click: **Manual Deploy** → **Deploy latest commit**
3. Wait 2-3 minutes for deployment
4. Check logs for: `✅ Auth0 configured`

---

## ✅ Step 5: Verify Auth0 Integration

### Test the backend endpoint:
```bash
curl https://smartrack-back.onrender.com/
```

Should return:
```json
{
  "status": "healthy",
  "auth0": "configured",
  "mongodb": "connected"
}
```

---

## 🎨 Frontend Configuration

Your frontend (`smartracker.vercel.app`) should already have Auth0 configured via Vercel environment variables:

```bash
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id_here
VITE_AUTH0_AUDIENCE=https://your-tenant.auth0.com/api/v2/
VITE_AUTH0_REDIRECT_URI=https://smartracker.vercel.app/callback
VITE_BACKEND_URL=https://smartrack-back.onrender.com
```

---

## 🔐 Security Checklist

- ✅ Auth0 Domain matches in frontend & backend
- ✅ Client ID matches in frontend & backend
- ✅ Client Secret is ONLY in backend (never frontend)
- ✅ Callback URLs include `/callback` suffix
- ✅ Logout URLs have NO `/callback` suffix
- ✅ CORS allows frontend domain
- ✅ MongoDB URI is from Atlas (not local)

---

## 🐛 Troubleshooting

### Error: "Invalid redirect_uri"
- Check Auth0 Callback URLs include your domain
- Ensure `/callback` suffix on callback URLs
- Ensure NO `/callback` on logout URLs

### Error: "CORS policy"
- Add frontend URL to `ALLOWED_ORIGINS`
- Check backend logs for CORS configuration

### Error: "Cannot connect to MongoDB"
- Check `MONGODB_URI` in Render environment variables
- Ensure MongoDB Atlas allows Render IP (0.0.0.0/0)

### Error: "Unauthorized"
- Check `AUTH0_AUDIENCE` matches in frontend & backend
- Verify token is being sent in Authorization header

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Vercel)                                       │
│  https://smartracker.vercel.app                          │
│  https://smartrack.top                                   │
│                                                          │
│  ┌─────────────────────────────────────────────┐        │
│  │  React App                                  │        │
│  │  - Auth0Provider (login/logout)             │        │
│  │  - API calls to backend                     │        │
│  │  - Chrome Extension download                │        │
│  └─────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
                           │
                           │ API calls with JWT token
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Backend (Render)                                        │
│  https://smartrack-back.onrender.com                     │
│                                                          │
│  ┌─────────────────────────────────────────────┐        │
│  │  FastAPI Server                             │        │
│  │  - JWT token verification                   │        │
│  │  - Auth0 middleware                         │        │
│  │  - MongoDB operations                       │        │
│  │  - AI processing                            │        │
│  └─────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
                           │
                           │ Database queries
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  MongoDB Atlas                                           │
│  - User data                                             │
│  - Links & boards                                        │
│  - Chat history                                          │
│  - Download events                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Setup Commands

If you want to set environment variables via Render CLI:

```bash
# Install Render CLI (one time)
npm install -g @render-oss/cli

# Login to Render
render login

# Set environment variables
render config:set AUTH0_DOMAIN=your-tenant.auth0.com
render config:set AUTH0_CLIENT_ID=your_client_id
render config:set AUTH0_CLIENT_SECRET=your_client_secret
render config:set FRONTEND_URL=https://smartracker.vercel.app

# Deploy
render deploy
```

---

## 📝 Next Steps

After Auth0 is configured:

1. ✅ Test login on `https://smartracker.vercel.app`
2. ✅ Verify JWT token is sent to backend
3. ✅ Check backend logs for authentication
4. ✅ Test protected API endpoints
5. ✅ Enable user-specific data isolation

---

## 🆘 Need Help?

Common issues and solutions in troubleshooting section above.

For Render support: https://render.com/docs
For Auth0 support: https://auth0.com/docs

---

**Ready to configure? Follow Step 1 above!** 🎯

