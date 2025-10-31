# Frontend Deployment Guide

## Deploy to Vercel (Free Tier)

### Prerequisites
1. Account on [Vercel.com](https://vercel.com) (free tier available)
2. GitHub repository pushed
3. Backend deployed and URL ready

### Step 1: Update Environment Variables
Create `.env.production` in root directory:
```env
VITE_BACKEND_URL=https://your-backend-url.onrender.com
VITE_AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
VITE_AUTH0_CLIENT_ID=8vjTb9UZSzwefAzHD3gsB3PN0bWOyJN1
VITE_AUTH0_AUDIENCE=https://api.smartrack.com
```

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Prepare frontend for deployment"
git push origin main
```

### Step 3: Deploy via Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Select the repository

### Step 4: Configure Build Settings
**Framework Preset:** Vite

**Build Command:** `npm run build`

**Output Directory:** `dist`

**Root Directory:** (leave empty)

### Step 5: Set Environment Variables
In "Environment Variables" section, add:

| Key | Value |
|-----|-------|
| `VITE_BACKEND_URL` | https://your-backend-url.onrender.com |
| `VITE_AUTH0_DOMAIN` | dev-a5hqcneif6ghl018.us.auth0.com |
| `VITE_AUTH0_CLIENT_ID` | 8vjTb9UZSzwefAzHD3gsB3PN0bWOyJN1 |
| `VITE_AUTH0_AUDIENCE` | https://api.smartrack.com |

### Step 6: Deploy
Click "Deploy" and wait for deployment (~2-3 minutes)

Your frontend will be live at: `https://smartrack.vercel.app` (or custom domain)

### Step 7: Update Auth0 Allowed Callback URLs
1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Applications → Your App
3. Add to "Allowed Callback URLs":
   - `https://your-frontend-url.vercel.app/dashboard`
   - `https://your-frontend-url.vercel.app`
4. Add to "Allowed Logout URLs":
   - `https://your-frontend-url.vercel.app`
5. Add to "Allowed Web Origins":
   - `https://your-frontend-url.vercel.app`

### Step 8: Test Deployment
Visit your frontend URL and:
- [ ] Login with Auth0 works
- [ ] Redirects to dashboard
- [ ] Can view usage stats
- [ ] Can add/edit/delete links
- [ ] Can export links

## Alternative: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (from project root)
vercel --prod

# Follow prompts to set environment variables
```

## Update Chrome Extension

After deployment, update `extension/utils/backendApi.js`:
```javascript
this.baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8000'
  : 'https://your-backend-url.onrender.com';  // Update this
```

## Costs
- **Vercel Free Tier:** 
  - 100 GB bandwidth/month
  - 100 deployments/day
  - Unlimited projects
  - Perfect for MVP! 🎉

## Quick Commands

```bash
# Build locally to test
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
vercel --prod
```





