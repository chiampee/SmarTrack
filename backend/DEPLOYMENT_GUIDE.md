# Backend Deployment Guide

## Deploy to Render (Free Tier)

### Prerequisites
1. Account on [Render.com](https://render.com) (free tier available)
2. MongoDB Atlas URI (already configured)
3. Auth0 credentials (already configured)

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Prepare backend for deployment"
git push origin main
```

### Step 2: Connect Repository to Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the SmarTrack repository

### Step 3: Configure Service
**Basic Settings:**
- **Name:** smartrack-backend
- **Region:** Choose closest to you
- **Branch:** main
- **Root Directory:** backend

**Build & Deploy:**
- **Environment:** Python 3
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`

### Step 4: Set Environment Variables
Go to "Environment" tab and add:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your MongoDB URI from Atlas |
| `AUTH0_DOMAIN` | dev-a5hqcneif6ghl018.us.auth0.com |
| `AUTH0_AUDIENCE` | https://api.smartrack.com |
| `DEBUG` | false |
| `PYTHON_VERSION` | 3.11.9 |

### Step 5: Deploy
Click "Create Web Service" and wait for deployment (~5-10 minutes)

Your backend will be live at: `https://smartrack-backend-XXXX.onrender.com`

### Step 6: Test Deployment
```bash
curl https://your-backend-url.onrender.com/api/health
```

Should return: `{"status":"healthy","timestamp":"..."}`

## Alternative: Railway

### Step 1: Create Account
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub

### Step 2: Deploy
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Select "backend" as root directory

### Step 3: Environment Variables
Railway auto-detects .env or you can add manually in settings:
- `MONGODB_URI`
- `AUTH0_DOMAIN`
- `AUTH0_AUDIENCE`
- `DEBUG=false`

Railway assigns URL automatically: `https://your-project.railway.app`

## Update Frontend After Deployment

Once backend is deployed, update frontend env vars:

**Create/Update `.env.production`:**
```env
VITE_BACKEND_URL=https://your-backend-url.onrender.com
VITE_AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
VITE_AUTH0_CLIENT_ID=8vjTb9UZSzwefAzHD3gsB3PN0bWOyJN1
VITE_AUTH0_AUDIENCE=https://api.smartrack.com
```

Then rebuild: `npm run build`

## Costs
- **Render Free Tier:** 750 hours/month (enough for always-on service)
- **Railway Free Tier:** $5 credit/month (decent for small apps)
- **MongoDB Atlas Free Tier:** 512MB storage (perfect for MVP)

All free! 🎉






