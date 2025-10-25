# 🚀 Deployment Guide - Smart Research Tracker

## 📋 Pre-Deployment Checklist

### ✅ Prerequisites
- [ ] GitHub repository is up to date
- [ ] All recent changes are committed
- [ ] Build passes locally (`pnpm build`)
- [ ] Extension works locally (`pnpm build:extension`)
- [ ] No critical bugs in issue tracker

---

## 🎯 Phase 1: Vercel Deployment (Web Dashboard)

### Step 1: Sign Up for Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your repositories

### Step 2: Import Repository
1. Visit [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select: `chiampee/SmarTrack`
4. Click **"Import"**

### Step 3: Configure Project
Vercel will auto-detect settings. Verify:

| Setting | Value | Status |
|---------|-------|--------|
| **Project Name** | `smart-research-tracker` | ✅ Auto-detected |
| **Framework** | `Vite` | ✅ Auto-detected |
| **Root Directory** | `./` | ✅ Auto-detected |
| **Build Command** | `pnpm build` | ✅ Auto-detected |
| **Output Directory** | `dist` | ✅ Auto-detected |
| **Install Command** | `pnpm install` | ✅ Auto-detected |
| **Node.js Version** | `18.x` or `20.x` | ✅ Auto-detected |

### Step 4: Environment Variables (Optional)
**Click "Environment Variables" and add:**

```env
# Optional: For AI Features
VITE_OPENAI_API_KEY=sk-your-key-here
TOGETHER_API_KEY=your-together-key
GROQ_API_KEY=your-groq-key

# Optional: Customization
VITE_APP_NAME=Smart Research Tracker
VITE_APP_VERSION=1.0.0
```

**Note:** AI features work without these, but require API keys for full functionality.

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. Your app will be live at: `https://your-project.vercel.app`

---

## 🔧 Phase 2: Update Chrome Extension for Production

### Step 1: Get Your Vercel URL
After deployment, your URL will be: `https://smart-research-tracker.vercel.app`

### Step 2: Update Extension Manifest
**No changes needed!** The extension already works with any dashboard URL.

### Step 3: Build Production Extension

```bash
# Build the extension for production
pnpm build:extension

# This creates: dist-extension/ folder
```

### Step 4: Package Extension for Distribution

```bash
# Create a ZIP file for Chrome Web Store
cd dist-extension
zip -r ../SmartResearchTracker-extension-v1.0.0.zip .
cd ..
```

---

## 📦 Phase 3: Publish Extension to Chrome Web Store

### Step 1: Create Developer Account
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay one-time $5 registration fee
3. Accept Developer Agreement

### Step 2: Upload Extension
1. Click **"New Item"**
2. Upload `SmartResearchTracker-extension-v1.0.0.zip`
3. Fill in Store Listing:
   - **Name**: Smart Research Tracker
   - **Summary**: AI-powered research link organizer
   - **Description**: (see below)
   - **Category**: Productivity
   - **Language**: English

### Step 3: Store Listing Assets Required
- **Icon**: 128x128 PNG (already in `extension/icons/icon.svg`)
- **Screenshots**: 1280x800 or 640x400 (5 screenshots)
- **Promotional Tile**: 440x280 PNG (optional but recommended)

### Step 4: Privacy & Permissions
- **Privacy Policy**: Required (host on GitHub Pages or Vercel)
- **Permissions Justification**: 
  - `storage`: Save user links locally
  - `activeTab`: Extract page metadata
  - `tabs`: Manage saved links

### Step 5: Submit for Review
- Review time: 1-3 business days
- Once approved, extension is public!

---

## 🌐 Phase 4: Post-Deployment Configuration

### Update Extension to Use Production URL

**Option A: Auto-detect (Recommended)**
Extension already detects if dashboard is open at any URL.

**Option B: Configure Default Dashboard URL**
Add to `extension/manifest.json`:

```json
{
  "externally_connectable": {
    "matches": [
      "https://smart-research-tracker.vercel.app/*",
      "http://localhost:5174/*"
    ]
  }
}
```

---

## ✅ Phase 5: Verify Deployment

### Dashboard Verification
- [ ] Visit `https://your-app.vercel.app`
- [ ] Dashboard loads without errors
- [ ] Can manually add a link
- [ ] Links persist after page refresh
- [ ] Filters and search work
- [ ] Database tests page works (`/#/database-tests`)

### API Endpoints Verification
- [ ] `https://your-app.vercel.app/api/health` returns `{"status":"ok"}`
- [ ] `https://your-app.vercel.app/api/chat` returns provider status
- [ ] `https://your-app.vercel.app/api/enrich` (test via dashboard)

### Extension Verification
1. **Install Extension:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `dist-extension` folder

2. **Test Save Link:**
   - Visit any webpage
   - Click extension icon
   - Save link
   - Verify it appears in dashboard

3. **Test Sync:**
   - Open dashboard at `https://your-app.vercel.app`
   - Save a link via extension
   - Verify it appears in dashboard
   - Refresh dashboard
   - Verify link persists

---

## 🔄 Phase 6: Continuous Deployment Setup

### Automatic Deployments
**Already configured!** Vercel automatically deploys when you push to GitHub.

```bash
# Every push to main triggers:
git push origin main
# → Vercel builds and deploys
# → New version live in ~2 minutes
```

### Branch Previews
- **Pull Requests** get preview URLs automatically
- **Feature branches** can be deployed separately
- **Example**: PR #123 → `https://smartrack-pr123.vercel.app`

### Rollback Strategy
If deployment fails:
1. Go to Vercel Dashboard
2. Click "Deployments"
3. Find previous working deployment
4. Click "..." → "Promote to Production"

---

## 🎨 Phase 7: Custom Domain (Optional)

### Add Custom Domain
1. Go to Vercel Dashboard → Your Project
2. Click "Settings" → "Domains"
3. Add domain: `smarttrack.yourdomain.com`
4. Update DNS records:
   - Type: `CNAME`
   - Name: `smarttrack`
   - Value: `cname.vercel-dns.com`

### Update Extension
If using custom domain, update extension to point to:
`https://smarttrack.yourdomain.com`

---

## 📊 Phase 8: Monitoring & Analytics

### Enable Vercel Analytics (Free)
1. Go to Project Settings → Analytics
2. Toggle "Enable Analytics"
3. View real-time metrics:
   - Page views
   - Unique visitors
   - Performance scores
   - Top pages

### Enable Speed Insights (Free)
1. Project Settings → Speed Insights
2. Toggle "Enable Speed Insights"
3. Monitor:
   - Core Web Vitals
   - Lighthouse scores
   - Real user metrics

### Monitor Serverless Functions
- View logs: Vercel Dashboard → Functions
- Check invocation count
- Monitor errors and timeouts

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Error: Cannot find module
Solution: Run locally first
pnpm install
pnpm build

# If successful locally, check Vercel build logs
```

### Extension Can't Connect
```bash
# Error: Dashboard not loading
Solution: 
1. Check browser console for CORS errors
2. Verify extension manifest has correct URL
3. Reload extension after changes
```

### API Routes Return 404
```bash
# Error: /api/chat not found
Solution:
1. Verify vercel.json exists
2. Check api/ folder structure
3. Redeploy project
```

### Environment Variables Not Working
```bash
# Error: API key undefined
Solution:
1. Ensure variables start with VITE_
2. Redeploy after adding env vars
3. Check "Environments" are selected (Prod/Preview/Dev)
```

---

## 📈 Scaling Considerations

### Free Tier Limits
- ✅ 100 GB bandwidth/month
- ✅ 100 GB-hours function execution
- ✅ 6,000 build minutes/month
- ✅ Unlimited deployments

### When to Upgrade to Pro ($20/month)
- 🚀 Exceeded bandwidth (100+ GB)
- 🚀 Need team collaboration
- 🚀 Want advanced analytics
- 🚀 Custom deployment protection

### Expected User Capacity (Free Tier)
- **~5,000 monthly active users**
- **~50,000 page views/month**
- **~10,000 API calls/day**

---

## 🎉 Success Criteria

### Your app is ready when:
- ✅ Dashboard loads at production URL
- ✅ Extension saves links successfully
- ✅ Links persist after refresh
- ✅ AI features work (if configured)
- ✅ No console errors
- ✅ Vercel deployment badge is green
- ✅ Users can install and use without issues

---

## 📞 Support & Resources

### Vercel Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Serverless Functions](https://vercel.com/docs/functions)

### Chrome Extension Resources
- [Chrome Web Store Guide](https://developer.chrome.com/docs/webstore/publish/)
- [Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)

### Community Support
- [GitHub Issues](https://github.com/chiampee/SmarTrack/issues)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

---

## 🚀 Quick Start Summary

```bash
# 1. Commit changes
git add .
git commit -m "Prepare for production deployment"
git push origin main

# 2. Deploy to Vercel
# → Go to vercel.com/new
# → Import repository
# → Click Deploy (auto-configured)

# 3. Build extension
pnpm build:extension
cd dist-extension
zip -r ../extension-v1.0.0.zip .

# 4. Users can now:
# → Visit https://your-app.vercel.app
# → Install extension from Chrome Web Store (after publishing)
# → Start saving and organizing links!
```

---

**Estimated Total Time:**
- Vercel Deployment: **5 minutes**
- Extension Build: **2 minutes**
- Chrome Web Store Submission: **30 minutes**
- Review Process: **1-3 days**
- **Total: 40 minutes + review time**

🎉 **Congratulations! Your app is now live and accessible to users worldwide!**

