# 🔧 Environment Setup Instructions

## Critical: Set Environment Variables

After fixing the hardcoded secrets, you MUST configure environment variables in your deployment platforms.

---

## 1. Render (Backend) - https://render.com

### Steps:
1. Log in to Render Dashboard
2. Go to your `smartrack-back` service
3. Click **Environment** tab
4. Add the following environment variables:

```bash
# Required Variables
MONGODB_URI=mongodb+srv://smartrack_user:YOUR_NEW_PASSWORD@cluster0.iwoqnpj.mongodb.net/?appName=Cluster0
AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
AUTH0_AUDIENCE=https://api.smartrack.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret

# Optional (already have defaults in code)
DEBUG=False
RATE_LIMIT_REQUESTS_PER_MINUTE=60
ADMIN_RATE_LIMIT_REQUESTS_PER_MINUTE=300
ADMIN_EMAILS=chaimpeer11@gmail.com
```

4. Click **Save Changes**
5. **Deploy** will trigger automatically

---

## 2. Vercel (Frontend) - https://vercel.com

### Steps:
1. Log in to Vercel Dashboard
2. Go to your `smar-track` project
3. Click **Settings** → **Environment Variables**
4. Add the following:

```bash
# Required for Auth0
VITE_AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
VITE_AUTH0_CLIENT_ID=your_frontend_auth0_client_id
VITE_AUTH0_AUDIENCE=https://api.smartrack.com

# Backend API URL
VITE_BACKEND_URL=https://smartrack-back.onrender.com
```

5. Choose **Production, Preview, and Development** for each variable
6. Click **Save**
7. **Redeploy** from the Deployments tab

---

## 3. MongoDB Atlas - Change Password

### CRITICAL: Your old password is exposed in Git history

### Steps:
1. Log in to MongoDB Atlas: https://cloud.mongodb.com
2. Go to **Database Access** (left sidebar)
3. Find user `smartrack_user`
4. Click **Edit**
5. Click **Edit Password**
6. Click **Autogenerate Secure Password** (or create your own strong password)
7. **COPY THE NEW PASSWORD** (you'll need it for Render)
8. Click **Update User**
9. Update the `MONGODB_URI` in Render with the new password (see step 1 above)

---

## 4. Local Development Setup

### Create `.env` file in project root:
```bash
# Copy from env.example
cp env.example .env
```

### Edit `.env` with your actual values:
```bash
# Backend
MONGODB_URI=mongodb+srv://smartrack_user:YOUR_NEW_PASSWORD@cluster0.iwoqnpj.mongodb.net/?appName=Cluster0
AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
AUTH0_AUDIENCE=https://api.smartrack.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret

# Frontend
VITE_BACKEND_URL=http://localhost:8000
VITE_AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
VITE_AUTH0_CLIENT_ID=your_frontend_auth0_client_id
VITE_AUTH0_AUDIENCE=https://api.smartrack.com
```

### Verify `.env` is in `.gitignore`:
```bash
grep ".env" .gitignore
# Should show: .env
```

---

## 5. Verification Checklist

After setting up environment variables:

### Backend Verification:
```bash
# Check backend starts successfully
cd backend
python3 main.py

# You should NOT see:
# ❌ Error: MONGODB_URI environment variable not set
# ❌ Error: AUTH0_DOMAIN environment variable not set

# You SHOULD see:
# ✅ Connected to MongoDB
# ✅ Database indexes initialized
```

### Frontend Verification:
```bash
# Check frontend builds successfully
cd ..
npm run build

# Should complete without errors
```

### Production Verification:
1. Open https://smar-track.vercel.app
2. Try to log in
3. Try to save a link from the extension
4. All should work without errors

---

## 6. Security Best Practices

### ✅ DO:
- Use strong, randomly generated passwords
- Rotate secrets every 90 days
- Use 2FA on all admin accounts (MongoDB, Auth0, Render, Vercel, GitHub)
- Keep `.env` files out of Git (already in `.gitignore`)
- Use environment variables for ALL sensitive data

### ❌ DON'T:
- Commit `.env` files to Git
- Share secrets via email, Slack, or messaging apps
- Use the same password across multiple services
- Hardcode secrets in source code

---

## 7. Troubleshooting

### Error: "MONGODB_URI environment variable not set"
**Solution:** Add `MONGODB_URI` to Render environment variables and redeploy

### Error: "Authentication failed"
**Solution:** Verify AUTH0_* variables are correct in both Render and Vercel

### Error: "Connection timeout" to MongoDB
**Solution:** 
1. Check MongoDB Atlas → Network Access
2. Ensure "Allow access from anywhere" (0.0.0.0/0) is enabled
3. Or add Render's IP addresses to whitelist

### Error: "CORS error" in browser
**Solution:** Verify `VITE_BACKEND_URL` in Vercel matches your Render URL exactly

---

## 8. Getting Auth0 Credentials

If you don't have your Auth0 credentials:

1. Go to https://auth0.com and log in
2. Go to **Applications** → **Applications**
3. Find your "SmarTrack" application
4. You'll find:
   - **Domain:** (e.g., dev-a5hqcneif6ghl018.us.auth0.com)
   - **Client ID:** (for backend and frontend)
   - **Client Secret:** (for backend only - KEEP SECRET!)
5. For frontend, you may need a separate "Single Page Application" in Auth0

---

## Need Help?

If you're stuck, check:
1. `PRODUCTION_READINESS_REPORT.md` - Full details
2. `SECURITY_FIXES_REQUIRED.md` - Security fixes
3. `env.example` - Template for environment variables

---

**Estimated Time:** 30-60 minutes  
**Priority:** 🔴 CRITICAL - Required before production use

