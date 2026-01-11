# Deploy to Production

## Overview
Deploy SmarTrack to production:
- **Frontend (Vercel)**: https://vercel.com
- **Backend (Render)**: https://render.com

---

## Part 1: Deploy Backend to Render

### Step 1: Prepare Backend for Deployment

1. **Navigate to backend folder**:
```bash
cd backend
```

2. **Create a Procfile for Render** (already exists, verify):
```bash
cat Procfile
```

Should show: `web: gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`

### Step 2: Push to GitHub
```bash
cd ..
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### Step 3: Deploy on Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub account** (first time only)
4. **Select repository**: SmarTrack
5. **Configure**:
   - **Name**: `smartrack-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`

6. **Set Environment Variables**:
   - Click "Environment" tab
   - Add these variables:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://smartrack_user:UW0AC5aYv8q3suiB@cluster0.iwoqnpj.mongodb.net/?appName=Cluster0` |
| `AUTH0_DOMAIN` | `dev-a5hqcneif6ghl018.us.auth0.com` |
| `AUTH0_AUDIENCE` | `https://api.smartrack.com` |
| `DEBUG` | `false` |
| `PYTHON_VERSION` | `3.11.9` |

7. **Click "Create Web Service"**
8. **Wait for deployment** (~5-10 minutes)

Your backend will be live at: `https://smartrack-backend-XXXX.onrender.com`

### Step 4: Test Backend
```bash
curl https://smartrack-backend-XXXX.onrender.com/api/health
```

Should return: `{"status":"healthy","timestamp":"..."}`

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Update Frontend Configuration

1. **Create `.env.production` file**:
```bash
cat > .env.production << 'EOF'
VITE_BACKEND_URL=https://smartrack-backend-XXXX.onrender.com
VITE_AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
VITE_AUTH0_CLIENT_ID=8vjTb9UZSzwefAzHD3gsB3PN0bWOyJN1
VITE_AUTH0_AUDIENCE=https://api.smartrack.com
EOF
```

**Note**: Replace `XXXX` with your actual Render service URL

### Step 2: Deploy to Vercel

**Option A: Using Vercel CLI** (Recommended):
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Option B: Using GitHub Integration**:
1. Go to https://vercel.com
2. Click "Import Project"
3. Connect GitHub account
4. Select SmarTrack repository
5. **Configure**:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     - `VITE_BACKEND_URL` → Your Render backend URL
     - `VITE_AUTH0_DOMAIN` → `dev-a5hqcneif6ghl018.us.auth0.com`
     - `VITE_AUTH0_CLIENT_ID` → `8vjTb9UZSzwefAzHD3gsB3PN0bWOyJN1`
     - `VITE_AUTH0_AUDIENCE` → `https://api.smartrack.com`

6. Click "Deploy"

### Step 3: Test Frontend
Visit your Vercel URL: `https://smartrack-XXXX.vercel.app`

---

## Part 3: Update Render CORS

After deploying frontend, update backend CORS to include Vercel URL:

1. Go to Render Dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Add new variable:
   - **Key**: `FRONTEND_URL`
   - **Value**: `https://your-app.vercel.app`

5. **Update backend config** to include this in CORS origins.

---

## Quick Deployment Script

Save this as `deploy.sh` and run:

```bash
#!/bin/bash

echo "🚀 Deploying SmarTrack to Production..."

# Backend to Render
echo "📦 Backend: pushing to GitHub..."
git add .
git commit -m "Deploy to production"
git push origin main

echo "✅ Backend: Complete! Now deploy on Render dashboard."
echo "   URL: https://dashboard.render.com"
echo ""
echo "Frontend: Run 'vercel --prod' after backend is deployed."
echo ""
echo "💡 Don't forget to:"
echo "   1. Copy Render backend URL"
echo "   2. Update Vercel env vars with backend URL"
echo "   3. Update Render CORS with Vercel URL"
```

---

## Troubleshooting

### Backend Issues:
- **Health check failing**: Check `Procfile` syntax
- **Import errors**: Ensure all requirements.txt packages are listed
- **Database connection**: Verify MongoDB URI is correct

### Frontend Issues:
- **Blank page**: Check browser console for CORS errors
- **API errors**: Verify `VITE_BACKEND_URL` env var
- **Auth issues**: Check Auth0 credentials

### Common Fixes:
```bash
# Check Render logs
# Render Dashboard → Your Service → Logs

# Rebuild on Render
# Render Dashboard → Your Service → Manual Deploy → Clear Build Cache & Deploy
```

---

## Environment Variables Summary

### Backend (Render):
```env
MONGODB_URI=mongodb+srv://...
AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
AUTH0_AUDIENCE=https://api.smartrack.com
DEBUG=false
PYTHON_VERSION=3.11.9
```

### Frontend (Vercel):
```env
VITE_BACKEND_URL=https://smartrack-backend-XXXX.onrender.com
VITE_AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
VITE_AUTH0_CLIENT_ID=8vjTb9UZSzwefAzHD3gsB3PN0bWOyJN1
VITE_AUTH0_AUDIENCE=https://api.smartrack.com
```

---

## Free Tier Limits

✅ **Render**: 750 hours/month (always-on service)  
✅ **Vercel**: Unlimited (generous free tier)  
✅ **MongoDB Atlas**: 512MB storage (enough for MVP)

All free! 🎉

