# 🆓 SmarTrack Backend - FREE Deployment Guide

## Best FREE Options (No Credit Card Required)

---

## 🥇 Option 1: Render (RECOMMENDED)

### Free Tier:
- ✅ 750 hours/month
- ✅ No credit card required
- ✅ Auto-deploy from GitHub
- ✅ Perfect for hobby projects

### Steps:

#### 1. Sign Up
Go to **https://render.com** and sign up with GitHub (FREE)

#### 2. Create New Web Service
- Click **"New +"** → **"Web Service"**
- Click **"Connect a repository"**
- Select your **SmarTrack** repo
- **Root Directory**: `packages/backend`

#### 3. Configure:
```
Name: smartrack-backend
Region: Choose closest to you
Branch: main
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Instance Type: Free
```

#### 4. Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**:

```
MONGODB_URI=mongodb+srv://smartrack_user:UW0AC5aYv8q3suiB@cluster0.iwoqnpj.mongodb.net/smartrack?retryWrites=true&w=majority
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=https://api.smartrack.com
DEBUG=False
MAX_LINKS_PER_USER=1000
MAX_PAGE_SIZE_BYTES=524288
RATE_LIMIT_REQUESTS_PER_MINUTE=60
```

#### 5. Deploy!
Click **"Create Web Service"**

You'll get: `https://smartrack-backend.onrender.com`

### ⚠️ Free Tier Limitations:
- Spins down after 15 mins of inactivity
- First request after spin down takes 30-60 seconds
- Good for: Hobby projects, learning, testing

---

## 🥈 Option 2: Railway (Free $5 Credit)

### Free Tier:
- ✅ $5 credit/month (lasts ~1 month)
- ✅ No spin-down delays
- ✅ Better performance than Render free

### Steps:

#### 1. Sign Up
Go to **https://railway.app** (sign up with GitHub)

#### 2. New Project
- Click **"New Project"**
- Select **"Deploy from GitHub repo"**
- Choose **SmarTrack**
- Root: `/packages/backend`

#### 3. Environment Variables
Same as Render (see above)

#### 4. Deploy
Automatic! Get URL: `https://smartrack-backend.up.railway.app`

### ⚠️ After $5 Credit:
- Costs ~$5-10/month
- Can pause when not using

---

## 🥉 Option 3: Fly.io (3 Free VMs)

### Free Tier:
- ✅ 3 shared VMs (256MB RAM each)
- ✅ 3GB persistent storage
- ✅ 160GB bandwidth/month

### Steps:

#### 1. Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
```

#### 2. Login
```bash
fly auth login
```

#### 3. Launch
```bash
cd /Users/chaim/SmarTrack/packages/backend
fly launch --name smartrack-backend
```

#### 4. Set Secrets
```bash
fly secrets set MONGODB_URI="mongodb+srv://smartrack_user:UW0AC5aYv8q3suiB@cluster0.iwoqnpj.mongodb.net/smartrack"
fly secrets set AUTH0_DOMAIN="your-domain.auth0.com"
fly secrets set AUTH0_AUDIENCE="https://api.smartrack.com"
```

#### 5. Deploy
```bash
fly deploy
```

Get URL: `https://smartrack-backend.fly.dev`

---

## 🏆 Option 4: Koyeb (Free Tier)

### Free Tier:
- ✅ 2 web services free
- ✅ No credit card
- ✅ Global edge deployment

### Steps:

#### 1. Sign Up
https://www.koyeb.com (sign up free)

#### 2. Create Service
- Connect GitHub
- Select repo
- Root: `packages/backend`

#### 3. Configure
```
Build: pip install -r requirements.txt
Run: uvicorn main:app --host 0.0.0.0 --port $PORT
```

#### 4. Add Environment Variables
Same as Render

---

## 💎 Option 5: PythonAnywhere (Basic Free)

### Free Tier:
- ✅ Forever free
- ✅ Good for learning
- ✅ Easy setup

### Limitations:
- ⚠️ Only allows whitelisted websites for requests
- ⚠️ May not work for web scraping
- ⚠️ Limited CPU time

### Steps:

#### 1. Sign Up
https://www.pythonanywhere.com (free account)

#### 2. Upload Code
- Use Git or upload files
- Install requirements in Bash console

#### 3. Create Web App
- Web tab → Add new web app
- Manual configuration
- Point to main.py

#### 4. Configure WSGI
Edit WSGI file to use FastAPI with ASGI

**Note**: Best for simple APIs, may have issues with content scraping

---

## 📊 Free Tier Comparison

| Platform | Free Tier | Limitations | Best For |
|----------|-----------|-------------|----------|
| **Render** | 750 hrs/month | Spins down after 15 min | ⭐ Best overall |
| **Railway** | $5 credit/month | Costs after credit | No spin-down needed |
| **Fly.io** | 3 VMs free | 256MB RAM each | Global deployment |
| **Koyeb** | 2 services | Limited resources | Simple APIs |
| **PythonAnywhere** | Forever free | No outbound requests | Learning only |

---

## 🎯 My Recommendation for SmarTrack

### For Development/Learning:
**Use Render Free Tier**
- Start here, it's perfect for testing
- Upgrade later when you need it

### For Production (When Ready):
**Upgrade to Railway ($5-10/month)**
- Better performance
- No spin-down delays
- Worth it for real users

---

## 💡 Pro Tips for Free Tier

### Keep Render Awake:
Use a free uptime monitor:
- https://uptimerobot.com (free)
- Ping your API every 5 minutes
- Prevents spin-down

### Optimize for Free Tier:
- Use MongoDB Atlas free tier
- Optimize image sizes
- Cache responses
- Minimize requests

---

## 🚀 Quick Start (Render)

1. Go to https://render.com
2. Sign up with GitHub (free)
3. Click "New Web Service"
4. Connect your repo
5. Add environment variables
6. Deploy!

**Your API will be live in ~5 minutes!** 🎉

---

## ⚠️ Important Notes

### All Free Tiers:
- Good for hobby projects
- Not for high-traffic production
- May have latency issues
- Worth starting with free, upgrade later

### When to Upgrade:
- Getting real users
- Need better performance
- Can't accept spin-down delays
- Monthly cost: $5-10 (worth it!)

---

## 🆘 Need Help?

Each platform has great docs:
- Render: https://render.com/docs
- Railway: https://docs.railway.app
- Fly.io: https://fly.io/docs

---

## ✅ Checklist

Before deploying:
- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas setup (free tier)
- [ ] Environment variables ready
- [ ] Auth0 configured
- [ ] Choose platform above
- [ ] Follow platform steps
- [ ] Test API endpoints
- [ ] Update frontend with API URL

**Start with Render free tier, you can always switch later!** 🚀
