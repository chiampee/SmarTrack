# Staging Environment Setup Guide

## Overview
This guide will help you set up a staging environment so you can test changes before deploying to production.

**Current Setup:**
- **Production Frontend**: Vercel (auto-deploys from `main` branch)
- **Production Backend**: Render.com (auto-deploys from `main` branch)
- **Production URL**: https://smar-track.vercel.app

**Staging Setup:**
- **Staging Frontend**: Vercel Preview (auto-deploys from `staging` branch)
- **Staging Backend**: Render.com (separate service, deploys from `staging` branch)
- **Staging Branch**: `staging`

---

## Step 1: Staging Branch (Already Created)

The staging branch has been created and pushed to GitHub. You're currently on it.

**Verify:**
```bash
git branch
# Should show: * staging
```

---

## Step 2: Set Up Staging Backend on Render

### Create Staging Backend Service

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +" → "Web Service"**
3. **Connect GitHub repository** (if not already connected)
4. **Select repository**: SmarTrack
5. **Configure Staging Service**:
   - **Name**: `smartrack-backend-staging`
   - **Region**: Same as production (or closest to you)
   - **Branch**: `staging` ⚠️ **IMPORTANT: Set to staging, not main!**
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`

6. **Set Environment Variables** (Staging):
   - Go to "Environment" tab
   - Add these variables:
     ```
     MONGODB_URI=mongodb+srv://... (same as production - shared database)
     AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
     AUTH0_AUDIENCE=https://api.smartrack.com
     AUTH0_CLIENT_ID=8vjTb9UZSzwefAzHD3gsB3PN0bWOyJN1
     AUTH0_CLIENT_SECRET=your_client_secret (same as production)
     DEBUG=True (for staging, helps with debugging)
     PYTHON_VERSION=3.11.9
     ```

7. **Click "Create Web Service"**
8. **Wait for deployment** (~5-10 minutes)
9. **Copy the staging backend URL**: `https://smartrack-backend-staging.onrender.com`
   - You'll need this for the next step

---

## Step 3: Configure Vercel for Staging

### Option A: Use Vercel Preview Deployments (Recommended - Free)

Vercel automatically creates preview deployments for all branches except the production branch.

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: `smartrack` (or your project name)
3. **Go to Settings → Git**
4. **Verify Production Branch**: Should be set to `main`
   - This ensures only `main` deploys to production
   - All other branches (including `staging`) will create preview deployments

5. **Go to Settings → Environment Variables**
6. **Add/Update Preview Environment Variables**:
   - Click "Add New" or edit existing
   - **Environment**: Select **Preview** (not Production)
   - Add/Update these variables:
     ```
     VITE_BACKEND_URL=https://smartrack-backend-staging.onrender.com
     VITE_AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
     VITE_AUTH0_CLIENT_ID=8vjTb9UZSzwefAzHD3gsB3PN0bWOyJN1
     VITE_AUTH0_AUDIENCE=https://api.smartrack.com
     ```
   - **Important**: Make sure you're setting these for "Preview" environment, not "Production"

7. **Preview URLs**:
   - After pushing to `staging` branch, Vercel will automatically create a preview deployment
   - URL format: `https://smar-track-git-staging-chiampee.vercel.app`
   - You can find it in: Deployments → Preview deployments
   - Each push to staging creates a new preview deployment

### Option B: Create Separate Vercel Project (More Isolation)

If you prefer a dedicated staging project:

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "Add New..." → "Project"**
3. **Import GitHub repository**: Select SmarTrack
4. **Configure**:
   - **Project Name**: `smartrack-staging`
   - **Framework Preset**: Vite
   - **Root Directory**: (leave empty)
   - **Branch**: `staging`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. **Set Environment Variables**:
   ```
   VITE_BACKEND_URL=https://smartrack-backend-staging.onrender.com
   VITE_AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
   VITE_AUTH0_CLIENT_ID=8vjTb9UZSzwefAzHD3gsB3PN0bWOyJN1
   VITE_AUTH0_AUDIENCE=https://api.smartrack.com
   ```

6. **Deploy** - This will give you: `https://smartrack-staging.vercel.app`

---

## Step 4: Update Auth0 for Staging

1. **Go to Auth0 Dashboard**: https://manage.auth0.com
2. **Applications → Your App** (SmarTrack)
3. **Settings → Allowed Callback URLs**:
   Add staging URLs (comma-separated):
   ```
   https://smar-track.vercel.app/dashboard,
   https://smar-track-git-staging-chiampee.vercel.app/dashboard,
   https://smartrack-staging.vercel.app/dashboard,
   http://localhost:5554/dashboard
   ```

4. **Allowed Logout URLs**:
   ```
   https://smar-track.vercel.app,
   https://smar-track-git-staging-chiampee.vercel.app,
   https://smartrack-staging.vercel.app,
   http://localhost:5554
   ```

5. **Allowed Web Origins**:
   ```
   https://smar-track.vercel.app,
   https://smar-track-git-staging-chiampee.vercel.app,
   https://smartrack-staging.vercel.app,
   http://localhost:5554
   ```

6. **Save Changes**

**Note**: The exact preview URL (`smar-track-git-staging-chiampee.vercel.app`) may vary. Check your Vercel dashboard after the first staging deployment to get the exact URL.

---

## Step 5: Database Configuration

### Current Setup: Shared Database

We're using the same MongoDB database for staging and production. This is simpler but means:
- ✅ No need to manage two databases
- ✅ Easy to test with real data
- ⚠️ Be careful - staging changes affect production data

### Future: Separate Database (Optional)

If you want complete isolation later:

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com
2. **Create a new cluster** (or use existing)
3. **Create a new database**: `smartrack_staging`
4. **Update `MONGODB_URI`** in Render staging service with the new database URI

---

## Workflow: Development → Staging → Production

### Daily Development Workflow

```bash
# 1. Work on features in staging branch
git checkout staging
git pull origin staging

# 2. Make your changes
# ... edit files ...

# 3. Commit and push to staging
git add .
git commit -m "Feature: Add new feature"
git push origin staging

# 4. Staging auto-deploys:
#    - Frontend: Vercel preview deployment (~2-3 min)
#    - Backend: Render staging service (~5-10 min)
#    - Test at staging URLs
```

### Promote to Production

```bash
# 1. When staging is tested and ready
git checkout main
git pull origin main

# 2. Merge staging into main
git merge staging

# 3. Push to production
git push origin main

# 4. Production auto-deploys:
#    - Frontend: Vercel production (~2-3 min)
#    - Backend: Render production service (~5-10 min)
```

---

## Environment Variables Summary

### Production (main branch)

**Frontend (Vercel - Production environment):**
```
VITE_BACKEND_URL=https://smartrack-back.onrender.com
VITE_AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
VITE_AUTH0_CLIENT_ID=8vjTb9UZSzwefAzHD3gsB3PN0bWOyJN1
VITE_AUTH0_AUDIENCE=https://api.smartrack.com
```

**Backend (Render - Production service):**
```
MONGODB_URI=... (production database)
AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
AUTH0_AUDIENCE=https://api.smartrack.com
AUTH0_CLIENT_ID=8vjTb9UZSzwefAzHD3gsB3PN0bWOyJN1
AUTH0_CLIENT_SECRET=your_client_secret
DEBUG=False
PYTHON_VERSION=3.11.9
```

### Staging (staging branch)

**Frontend (Vercel - Preview environment):**
```
VITE_BACKEND_URL=https://smartrack-backend-staging.onrender.com
VITE_AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
VITE_AUTH0_CLIENT_ID=8vjTb9UZSzwefAzHD3gsB3PN0bWOyJN1
VITE_AUTH0_AUDIENCE=https://api.smartrack.com
```

**Backend (Render - Staging service):**
```
MONGODB_URI=... (same as production - shared database)
AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
AUTH0_AUDIENCE=https://api.smartrack.com
AUTH0_CLIENT_ID=8vjTb9UZSzwefAzHD3gsB3PN0bWOyJN1
AUTH0_CLIENT_SECRET=your_client_secret
DEBUG=True (for staging, helps with debugging)
PYTHON_VERSION=3.11.9
```

---

## Quick Reference Commands

### Switch to Staging
```bash
git checkout staging
git pull origin staging
```

### Deploy to Staging
```bash
git checkout staging
git add .
git commit -m "Your changes"
git push origin staging
# Auto-deploys in ~2-3 minutes (frontend) and ~5-10 minutes (backend)
```

### Promote to Production
```bash
git checkout main
git merge staging
git push origin main
# Auto-deploys to production
```

### View Staging URLs
- **Frontend**: 
  - Vercel Dashboard → Deployments → Preview deployments
  - Or: `https://smar-track-git-staging-chiampee.vercel.app` (check exact URL in dashboard)
- **Backend**: 
  - Render Dashboard → `smartrack-backend-staging` service
  - URL: `https://smartrack-backend-staging.onrender.com`

---

## Testing Checklist

Before promoting to production:

- [ ] Test all features in staging
- [ ] Check mobile responsiveness
- [ ] Verify authentication works
- [ ] Test API endpoints
- [ ] Check for console errors
- [ ] Verify environment variables are correct
- [ ] Test with real data (if using shared DB, be careful)
- [ ] Check performance
- [ ] Verify all links work correctly
- [ ] Test filter dropdown appears on top
- [ ] Verify brand logos display correctly

---

## Troubleshooting

### Staging Frontend Not Deploying
1. Check Vercel dashboard → Deployments
2. Verify branch is `staging`
3. Check build logs for errors
4. Verify environment variables are set for "Preview" environment (not Production)
5. Make sure you pushed to `staging` branch, not `main`

### Staging Backend Not Deploying
1. Check Render dashboard → `smartrack-backend-staging`
2. Verify branch is set to `staging` (not `main`)
3. Check build logs for errors
4. Verify environment variables are set correctly
5. Check if service is paused (unpause if needed)

### Auth0 Errors in Staging
1. Verify staging URLs are in Auth0 allowed URLs
2. Check environment variables match between frontend and backend
3. Clear browser cache and cookies
4. Check Auth0 logs for errors
5. Make sure you added the exact preview URL from Vercel (it may differ from the example)

### CORS Errors
1. Verify backend URL in frontend environment variables
2. Check if backend is running
3. Verify Auth0 configuration
4. Check that staging URLs are in `backend/core/config.py` CORS_ORIGINS

### Backend Not Responding
1. Check Render dashboard for service status
2. View logs for errors
3. Verify environment variables are set
4. Check if service needs to be unpaused

---

## Cost

| Service | Production | Staging | Total |
|---------|-----------|---------|-------|
| **Vercel** | Free (Hobby) | Free (Preview) | **Free** |
| **Render** | Free | Free | **Free** |
| **MongoDB** | Free (shared) | Free (if separate) | **Free** |
| **Total** | | | **$0/month** |

---

## Summary

✅ **Staging Branch**: `staging` (created)
✅ **Staging Frontend**: Vercel Preview (auto-deploys from `staging` branch)
✅ **Staging Backend**: Render.com separate service (deploys from `staging` branch)
✅ **Workflow**: Develop → Test in Staging → Merge to Main → Production

**Next Steps:**
1. ✅ Staging branch created
2. ⏳ Set up Render staging service (Step 2)
3. ⏳ Configure Vercel preview environment variables (Step 3)
4. ⏳ Update Auth0 URLs (Step 4)
5. 🚀 Start developing!

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Git Repository                        │
│  ┌──────────────┐              ┌──────────────┐        │
│  │  main branch │              │ staging branch│        │
│  │ (Production) │              │   (Staging)   │        │
│  └──────┬───────┘              └──────┬────────┘        │
└─────────┼─────────────────────────────┼─────────────────┘
          │                              │
          ▼                              ▼
┌──────────────────┐          ┌──────────────────┐
│  Vercel          │          │  Vercel          │
│  Production      │          │  Preview         │
│  (main branch)   │          │  (staging branch)│
│  smar-track.     │          │  smar-track-git- │
│  vercel.app      │          │  staging-...     │
└──────────────────┘          └──────────────────┘
          │                              │
          ▼                              ▼
┌──────────────────┐          ┌──────────────────┐
│  Render          │          │  Render          │
│  Production      │          │  Staging         │
│  Backend         │          │  Backend         │
│  (main branch)   │          │  (staging branch)│
│  smartrack-back. │          │  smartrack-back- │
│  onrender.com    │          │  end-staging.    │
│                  │          │  onrender.com    │
└──────────────────┘          └──────────────────┘
          │                              │
          └──────────────┬───────────────┘
                         ▼
              ┌──────────────────┐
              │  MongoDB Atlas   │
              │  (Shared DB)     │
              └──────────────────┘
```

---

*Last Updated: January 15, 2026*
*Status: Staging branch created, ready for service configuration*
