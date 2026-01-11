# Deployment Configuration - SmarTrack

## Current Setup

### ✅ Automatic Deployments (Active)

#### Frontend (Vercel)
- **Platform**: Vercel
- **Method**: Native GitHub integration (automatic)
- **Trigger**: Push to `main` branch
- **URL**: https://smar-track.vercel.app
- **Configuration**: Managed in Vercel dashboard
- **Build Command**: `npm run build`
- **Environment Variables**: Set in Vercel dashboard

**How it works:**
1. You push code to GitHub
2. Vercel detects the push automatically
3. Vercel builds and deploys
4. Live in ~2-3 minutes

#### Backend (Render.com)
- **Platform**: Render.com
- **Method**: GitHub integration (automatic)
- **Trigger**: Push to `main` branch
- **URL**: https://smartrack-back.onrender.com
- **Configuration**: `render.yaml` in repo
- **Start Command**: `gunicorn backend.main:app`
- **Environment Variables**: Set in Render dashboard

**How it works:**
1. You push code to GitHub
2. Render detects the push automatically
3. Render builds and deploys
4. Live in ~5-10 minutes

### ✅ GitHub Actions (CI/CD)

#### Active Workflows

**1. Keep Backend Warm** (`.github/workflows/keep-backend-warm.yml`)
- **Purpose**: Ping backend every 10 minutes to prevent cold starts
- **Status**: ✅ Active
- **Schedule**: Every 10 minutes
- **Cost**: Free (uses ~360 min/month of 2000 min limit)

**2. CI Pipeline** (`.github/workflows/ci.yml`)
- **Purpose**: Test and validate code on every push
- **Status**: ✅ Active
- **Jobs**:
  - Test Frontend (lint, type-check, build)
  - Test Backend (lint, imports, pytest)
  - Build Frontend (artifact creation)
- **Deployment**: Placeholder only (echo statements)

**3. CI/CD Pipeline** (`.github/workflows/ci-cd.yml`)
- **Purpose**: Test, build, and validate
- **Status**: ✅ Active (deployment job disabled)
- **Jobs**:
  - Lint & Test Frontend
  - Build Frontend
  - ~~Deploy Frontend~~ (Disabled - handled by Vercel)

**4. Pages Deployment** (`.github/workflows/pages.yml`)
- **Purpose**: Deploy to GitHub Pages
- **Status**: ⚠️ Optional (not used for production)
- **URL**: Would deploy to `https://chiampee.github.io/SmarTrack`
- **Note**: Can be disabled if not needed

**5. Release** (`.github/workflows/release.yml`)
- **Purpose**: Create GitHub releases with artifacts
- **Status**: ✅ Active (runs on version tags)
- **Trigger**: Push tag `v*.*.*` (e.g., `v1.0.0`)

**6. Jekyll Pages** (`.github/workflows/jekyll-gh-pages.yml`)
- **Purpose**: GitHub Pages with Jekyll
- **Status**: ⚠️ Optional (can be disabled)

### ❌ Disabled Workflows

**Vercel Manual Deployment** (in ci-cd.yml)
- **Reason**: Redundant with Vercel's native GitHub integration
- **Status**: Commented out
- **Previous Issue**: Was causing failures due to invalid VERCEL_TOKEN

## Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Developer pushes to GitHub (main branch)                   │
└────────────┬────────────────────────────────────────────────┘
             │
             ├──────────────────────────────────────────────────┐
             │                                                  │
             ▼                                                  ▼
┌────────────────────────┐                     ┌───────────────────────────┐
│  GitHub Actions        │                     │  Vercel                   │
│  - Run tests           │                     │  - Detect push            │
│  - Validate build      │                     │  - Build frontend         │
│  - Keep backend warm   │                     │  - Deploy to production   │
│  - Create artifacts    │                     │  - Live in ~2-3 min       │
└────────────────────────┘                     └───────────────────────────┘
                                                               │
                                                               ▼
                                               ┌───────────────────────────┐
                                               │  Render.com               │
                                               │  - Detect push            │
                                               │  - Build backend          │
                                               │  - Deploy to production   │
                                               │  - Live in ~5-10 min      │
                                               └───────────────────────────┘
```

## Environment Variables

### Frontend (Vercel Dashboard)
```bash
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id
VITE_AUTH0_AUDIENCE=https://api.your-domain.com
VITE_BACKEND_URL=https://smartrack-back.onrender.com
```

### Backend (Render Dashboard)
```bash
MONGODB_URI=mongodb+srv://...
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.your-domain.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
DEBUG=False
```

### GitHub Secrets (for Actions)
```bash
# Not needed for deployment (Vercel/Render handle it)
# Only needed if you want manual deployment control:
# VERCEL_TOKEN=xxx (not set - not needed)
# VERCEL_ORG_ID=xxx (not set - not needed)
# VERCEL_PROJECT_ID=xxx (not set - not needed)
```

## How to Deploy

### Normal Deployment (Automatic)
```bash
# 1. Make your changes
git add .
git commit -m "Your changes"
git push

# That's it! Vercel and Render will deploy automatically.
# Check status at:
# - Vercel: https://vercel.com/dashboard
# - Render: https://dashboard.render.com
# - GitHub Actions: https://github.com/chiampee/SmarTrack/actions
```

### Manual Deployment (if needed)

**Frontend (Vercel):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Or redeploy latest via dashboard:
# https://vercel.com/chiampee/smartrack → Redeploy
```

**Backend (Render):**
```bash
# Go to Render dashboard
# https://dashboard.render.com
# Click your backend service → Manual Deploy → Deploy latest commit
```

### Release Deployment
```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions will:
# - Build the app
# - Create a GitHub release
# - Attach build artifacts
```

## Troubleshooting

### Vercel Deployment Fails
1. Check Vercel dashboard: https://vercel.com/dashboard
2. Check build logs in Vercel
3. Verify environment variables are set
4. **Don't use GitHub Actions for Vercel** - it's automatic

### Backend Not Responding
1. Check Render dashboard: https://dashboard.render.com
2. View logs for errors
3. Verify environment variables
4. Check if GitHub Actions "Keep Backend Warm" is running

### GitHub Actions Failing
1. Go to: https://github.com/chiampee/SmarTrack/actions
2. Click the failing workflow
3. Check the logs
4. Common issues:
   - Package manager mismatch (use npm, not pnpm)
   - Missing dependencies
   - Invalid secrets (don't set VERCEL_TOKEN)

## Best Practices

### ✅ DO
- Let Vercel and Render deploy automatically
- Use GitHub Actions for testing and validation
- Keep backend warm with the scheduled workflow
- Set environment variables in platform dashboards

### ❌ DON'T
- Don't add VERCEL_TOKEN to GitHub secrets (not needed)
- Don't manually deploy from GitHub Actions
- Don't disable the "Keep Backend Warm" workflow
- Don't commit .env files

## Monitoring

### Deployment Status
- **Vercel**: https://vercel.com/chiampee/smartrack
- **Render**: https://dashboard.render.com
- **GitHub Actions**: https://github.com/chiampee/SmarTrack/actions

### Performance
- **Frontend**: Vercel Analytics (built-in)
- **Backend**: Render Metrics (built-in)
- **Uptime**: Set up UptimeRobot (optional, free)

## Cost

| Service | Plan | Cost | Usage |
|---------|------|------|-------|
| **Vercel** | Hobby | Free | Frontend hosting |
| **Render.com** | Free | Free | Backend hosting |
| **GitHub Actions** | Free | Free | CI/CD (360 min/month used) |
| **MongoDB Atlas** | Free | Free | Database (up to 512MB) |
| **Auth0** | Free | Free | Authentication (up to 7000 users) |
| **Total** | | **$0/month** | 🎉 |

## Summary

Your deployment is fully automated:
1. **Push to GitHub** → Everything deploys automatically
2. **Vercel** handles frontend (native integration)
3. **Render** handles backend (native integration)
4. **GitHub Actions** validates code and keeps backend warm
5. **No manual steps needed!**

All workflows are now working correctly with npm, and redundant deployment jobs are disabled.

---

*Last Updated: January 11, 2026*
*Status: ✅ All systems operational*
