# Fix Render Root Directory Error

## The Problem

Error message:
```
Service Root Directory "/opt/render/project/src/packages/backend" is missing.
builder.sh: line 51: cd: /opt/render/project/src/packages/backend: No such file or directory
```

**Root Cause**: Render is configured to look in the wrong directory.

## The Solution

### Step 1: Update Render Settings

1. Go to: https://dashboard.render.com
2. Click on your backend service
3. Click "Settings" tab
4. Find "Root Directory" field
5. Change it from: `packages/backend` ❌
6. To: `backend` ✅
7. Click "Save Changes"

### Step 2: Deploy

1. Click "Manual Deploy" button
2. Select "Clear Build Cache & Deploy"
3. Wait for deployment to complete

## Verification

After deployment succeeds, test the health endpoint:
```bash
curl https://your-service-name.onrender.com/api/health
```

Should return: `{"status":"healthy","timestamp":"..."}`

## Correct Configuration

| Setting | Value |
|---------|-------|
| **Root Directory** | `backend` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT` |
| **Python Version** | `3.11.9` |

## Why This Happened

The project structure changed from:
```
SmarTrack/
  packages/
    backend/
```

To:
```
SmarTrack/
  backend/
```

But Render still had the old Root Directory configured.

## Environment Variables Checklist

Make sure these are set in Render:
- `MONGODB_URI`: mongodb+srv://smartrack_user:...
- `AUTH0_DOMAIN`: dev-a5hqcneif6ghl018.us.auth0.com
- `AUTH0_AUDIENCE`: https://api.smartrack.com
- `DEBUG`: false
- `PYTHON_VERSION`: 3.11.9

