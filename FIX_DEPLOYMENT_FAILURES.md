# Fixing Deployment Failures

## Common Issues and Solutions

### Backend (Render) Failures

#### Issue 1: "Module not found" errors
**Solution**: Ensure Root Directory is set to `backend` in Render settings

**Fix**:
1. Go to Render Dashboard → Your Service → Settings
2. Set **Root Directory** to: `backend`
3. Click "Save Changes"
4. Trigger manual deploy

#### Issue 2: Build fails with import errors
**Solution**: Check that all files are in correct locations

**Verify structure**:
```
backend/
  ├── main.py
  ├── api/
  ├── core/
  ├── middleware/
  ├── services/
  ├── requirements.txt
  ├── Procfile
```

#### Issue 3: Gunicorn command fails
**Solution**: Verify Procfile and startup command

**Procfile should contain**:
```
web: gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
```

**Render Start Command**:
```
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
```

#### Issue 4: Environment variables missing
**Solution**: Add all required variables in Render

**Required Environment Variables**:
- `MONGODB_URI`: mongodb+srv://smartrack_user:UW0AC5aYv8q3suiB@cluster0.iwoqnpj.mongodb.net/?appName=Cluster0
- `AUTH0_DOMAIN`: dev-a5hqcneif6ghl018.us.auth0.com
- `AUTH0_AUDIENCE`: https://api.smartrack.com
- `DEBUG`: false
- `PYTHON_VERSION`: 3.11.9

---

### Frontend (Vercel) Failures

#### Issue 1: Build fails
**Solution**: Check TypeScript errors

**Fix**:
```bash
npm run build
# Fix any TypeScript errors shown
```

#### Issue 2: Blank page
**Solution**: Add environment variables in Vercel

**Required Environment Variables**:
- `VITE_BACKEND_URL`: (your Render backend URL)
- `VITE_AUTH0_DOMAIN`: dev-a5hqcneif6ghl018.us.auth0.com
- `VITE_AUTH0_CLIENT_ID`: 8vjTb9UZSzwefAzHD3gsB3PN0bWOyJN1
- `VITE_AUTH0_AUDIENCE`: https://api.smartrack.com

#### Issue 3: API connection errors
**Solution**: Update backend URL in environment variables

---

## Step-by-Step Fix Process

### 1. Fix Backend (Render)

```bash
# 1. Check Render Logs
# Go to: https://dashboard.render.com
# Click: Your Service → Logs
# Look for error messages

# 2. Verify Configuration
# Settings → Root Directory: backend
# Settings → Build Command: pip install -r requirements.txt
# Settings → Start Command: gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT

# 3. Add Environment Variables
# Settings → Environment
# Add all required variables listed above

# 4. Manual Deploy
# Events → Manual Deploy → Clear Build Cache & Deploy
```

### 2. Fix Frontend (Vercel)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Add environment variables
vercel env add VITE_BACKEND_URL
# (Enter your Render backend URL when prompted)

# 4. Deploy
vercel --prod
```

---

## Quick Fix Commands

```bash
# Commit and push fixes
git add .
git commit -m "Fix deployment configuration"
git push origin main

# This will trigger new deployments
```

---

## Testing After Fix

### Backend:
```bash
curl https://your-backend-url.onrender.com/api/health
# Should return: {"status":"healthy",...}
```

### Frontend:
Visit your Vercel URL and check:
- Page loads
- No console errors
- Can connect to backend

---

## If Still Failing

Share the error logs from:
1. Render → Logs tab
2. Vercel → Logs tab

And I can help debug specific issues.

