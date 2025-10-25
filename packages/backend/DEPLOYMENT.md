# SmarTrack Backend - Cloud Deployment Guide

## 🚀 Deployment Options

Your Python FastAPI backend can be deployed to multiple cloud platforms. Choose one:

---

## Option 1: Railway (Recommended - Easiest)

### Why Railway?
- ✅ **Free tier**: $5 credit/month
- ✅ **Auto-deploy** from GitHub
- ✅ **Easy MongoDB connection**
- ✅ **Custom domains**

### Steps:

#### 1. Sign Up
Go to https://railway.app and sign up with GitHub

#### 2. Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your SmarTrack repository
- Select `/packages/backend` as the root directory

#### 3. Add Environment Variables
In Railway dashboard, add these variables:
```
MONGODB_URI=mongodb+srv://smartrack_user:UW0AC5aYv8q3suiB@cluster0.iwoqnpj.mongodb.net/smartrack?retryWrites=true&w=majority
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=https://api.smartrack.com
DEBUG=False
MAX_LINKS_PER_USER=1000
MAX_PAGE_SIZE_BYTES=524288
RATE_LIMIT_REQUESTS_PER_MINUTE=60
```

#### 4. Deploy
Railway will automatically:
- Install dependencies
- Run the FastAPI server
- Give you a URL like: `https://smartrack-backend.up.railway.app`

#### 5. Get Your API URL
Copy the deployment URL and use it in your frontend!

---

## Option 2: Render (Free Tier Available)

### Why Render?
- ✅ **Free tier** (limited hours)
- ✅ **Easy setup**
- ✅ **Auto SSL**

### Steps:

#### 1. Sign Up
Go to https://render.com and sign up

#### 2. Create New Web Service
- Click "New +" → "Web Service"
- Connect your GitHub repo
- Select `/packages/backend` directory

#### 3. Configure Service
```
Name: smartrack-backend
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

#### 4. Add Environment Variables
Same as Railway (see above)

#### 5. Deploy
Render will build and deploy. You'll get a URL like:
`https://smartrack-backend.onrender.com`

---

## Option 3: Fly.io (Global Edge Deployment)

### Steps:

#### 1. Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
```

#### 2. Login
```bash
fly auth login
```

#### 3. Launch App
```bash
cd packages/backend
fly launch
```

#### 4. Set Secrets
```bash
fly secrets set MONGODB_URI="mongodb+srv://..."
fly secrets set AUTH0_DOMAIN="your-domain.auth0.com"
fly secrets set AUTH0_AUDIENCE="https://api.smartrack.com"
```

#### 5. Deploy
```bash
fly deploy
```

---

## 🔧 Post-Deployment Setup

### 1. Update Frontend API URL

In `packages/frontend/.env`:
```env
VITE_API_URL=https://your-backend-url.railway.app
```

### 2. Update Auth0 Callback URLs

In Auth0 dashboard, add:
- Allowed Callback URLs: `https://your-frontend-url.vercel.app`
- Allowed Logout URLs: `https://your-frontend-url.vercel.app`
- Allowed Web Origins: `https://your-frontend-url.vercel.app`

### 3. Test Your API

```bash
curl https://your-backend-url.railway.app/api/health
```

Should return:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "...",
    "services": {
      "database": true,
      "auth": true
    }
  }
}
```

### 4. View API Documentation

Visit:
- Swagger UI: `https://your-backend-url.railway.app/docs`
- ReDoc: `https://your-backend-url.railway.app/redoc`

---

## 📊 Cost Comparison

| Platform | Free Tier | Paid Plans |
|----------|-----------|------------|
| **Railway** | $5 credit/month | $5-20/month |
| **Render** | 750 hours/month | $7-25/month |
| **Fly.io** | 3 VMs free | $5-15/month |

---

## 🔒 Security Checklist

Before going live:
- [ ] Set `DEBUG=False` in production
- [ ] Add your specific frontend URL to CORS_ORIGINS
- [ ] Rotate MongoDB password periodically
- [ ] Enable Auth0 production settings
- [ ] Set up monitoring (Railway/Render dashboards)
- [ ] Configure custom domain (optional)

---

## 🐛 Troubleshooting

### Backend won't start
- Check environment variables are set
- Check MongoDB connection string
- View logs in platform dashboard

### CORS errors
- Add frontend URL to `CORS_ORIGINS` in `core/config.py`
- Redeploy after changes

### Database connection fails
- Verify MongoDB Atlas IP whitelist (allow 0.0.0.0/0)
- Check connection string format

---

## 📈 Monitoring

All platforms provide:
- Real-time logs
- Metrics dashboard
- Error tracking
- Uptime monitoring

Access through their dashboards.

---

## 🎯 Recommended Setup

**For Production:**
1. **Backend**: Railway ($5-10/month)
2. **Frontend**: Vercel (Free)
3. **Database**: MongoDB Atlas (Free M0)
4. **Total Cost**: ~$5/month

**For Development:**
- Use local backend for testing
- Deploy to cloud when ready for users

---

Need help? Check the platform-specific docs or ask for assistance!
