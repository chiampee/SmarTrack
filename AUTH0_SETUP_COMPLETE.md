# 🔐 Auth0 Setup Guide for SmarTrack

## ✅ Current Status

Your backend is **READY** for Auth0 integration! Tests show:
- ✅ Health check: Working
- ✅ Protected endpoints: Require authentication
- ✅ Mock auth (DEBUG mode): Working
- ✅ Database connection: Active

---

## 📋 Step-by-Step Auth0 Configuration

### **Step 1: Create Auth0 API (Backend)**

1. Go to: https://manage.auth0.com
2. Log in and select tenant: **`dev-a5hqcneif6ghl018`**
3. Click **Applications** → **APIs**
4. Click **+ Create API**

**Settings:**
```
Name: SmarTrack API
Identifier: https://api.smartrack.com
Signing Algorithm: RS256
```

5. Click **Create**
6. **✅ COPY THIS:** The Identifier is your `AUTH0_AUDIENCE`

---

### **Step 2: Create Auth0 Application (Frontend)**

1. In Auth0 Dashboard: **Applications** → **Applications**
2. Click **+ Create Application**

**Settings:**
```
Name: SmarTrack Frontend
Type: Single Page Web Applications
```

3. Click **Create**

**Configure Application URIs:**

Scroll to **Application URIs** section:

**Allowed Callback URLs:**
```
http://localhost:3001/callback,
https://smartrack-back.onrender.com/callback,
https://*.vercel.app/callback
```

**Allowed Logout URLs:**
```
http://localhost:3001,
https://smartrack-back.onrender.com,
https://*.vercel.app
```

**Allowed Web Origins:**
```
http://localhost:3001,
https://smartrack-back.onrender.com,
https://*.vercel.app
```

**Allowed Origins (CORS):**
```
http://localhost:3001,
https://smartrack-back.onrender.com,
https://*.vercel.app
```

4. Click **Save Changes**

**✅ COPY THESE:**
- **Domain**: `dev-a5hqcneif6ghl018.us.auth0.com`
- **Client ID**: (shown at top of settings)

---

### **Step 3: Configure Render Backend**

1. Go to: https://dashboard.render.com
2. Click your service: **smarttrack-back**
3. Click **Environment** tab
4. Add/Update these environment variables:

```bash
AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
AUTH0_AUDIENCE=https://api.smartrack.com
DEBUG=True
```

5. Click **Save Changes**
6. Wait 2-3 minutes for auto-redeploy

---

### **Step 4: Configure Frontend (Local Development)**

Create `.env` file in project root:

```bash
# /Users/chaim/SmarTrack/.env

VITE_AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
VITE_AUTH0_CLIENT_ID=YOUR_CLIENT_ID_FROM_AUTH0
VITE_AUTH0_AUDIENCE=https://api.smartrack.com
VITE_BACKEND_URL=https://smartrack-back.onrender.com
```

**Replace `YOUR_CLIENT_ID_FROM_AUTH0`** with the Client ID from Step 2.

---

## 🧪 Test Auth0 Integration

### **Test 1: Backend Health (No Auth Required)**
```bash
curl https://smartrack-back.onrender.com/api/health
```

**Expected:** `{"success": true, "data": {...}}`

---

### **Test 2: Protected Endpoint Without Auth (Should Fail)**
```bash
curl https://smartrack-back.onrender.com/api/links
```

**Expected:** `403 Forbidden` or `401 Unauthorized`

---

### **Test 3: Mock Authentication (DEBUG Mode)**
```bash
curl -H "Authorization: Bearer mock-token-for-development" \
     https://smartrack-back.onrender.com/api/links
```

**Expected:** `{"links": [], "total": 0, ...}` (empty list if no data)

---

### **Test 4: Get Real Auth0 Token**

#### **Option A: Using Auth0 Dashboard**
1. Go to: https://manage.auth0.com
2. Click **Applications** → **APIs** → **SmarTrack API**
3. Click **Test** tab
4. Copy the test token
5. Test with:
```bash
curl -H "Authorization: Bearer YOUR_REAL_TOKEN" \
     https://smartrack-back.onrender.com/api/links
```

#### **Option B: Using Swagger UI**
1. Visit: https://smartrack-back.onrender.com/docs
2. Click **Authorize** button
3. Enter your Auth0 token
4. Test endpoints directly in the UI

---

## 🎨 Frontend Integration

Your frontend (`src/config/auth0.ts`) is already configured! Just need environment variables:

**Current config:**
```typescript
domain: import.meta.env.VITE_AUTH0_DOMAIN
clientId: import.meta.env.VITE_AUTH0_CLIENT_ID
audience: import.meta.env.VITE_AUTH0_AUDIENCE
```

**To start frontend:**
```bash
cd /Users/chaim/SmarTrack
npm install
npm run dev
```

Visit: http://localhost:3001

---

## 📊 Credentials Summary

**For Backend (Render Environment Variables):**
```
AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
AUTH0_AUDIENCE=https://api.smartrack.com
DEBUG=True
```

**For Frontend (.env file):**
```
VITE_AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
VITE_AUTH0_CLIENT_ID=[Get from Auth0 Application]
VITE_AUTH0_AUDIENCE=https://api.smartrack.com
VITE_BACKEND_URL=https://smartrack-back.onrender.com
```

---

## 🚀 Quick Start Checklist

- [ ] Create Auth0 API (`https://api.smartrack.com`)
- [ ] Create Auth0 Application (SPA)
- [ ] Configure Allowed URLs in Auth0 Application
- [ ] Add environment variables to Render
- [ ] Wait for Render redeploy (2-3 min)
- [ ] Test with mock token
- [ ] Get real Auth0 token
- [ ] Test with real token
- [ ] Add `.env` file to frontend
- [ ] Start frontend (`npm run dev`)
- [ ] Test login flow

---

## 📚 Important URLs

- **Auth0 Dashboard**: https://manage.auth0.com
- **Render Dashboard**: https://dashboard.render.com
- **Backend API**: https://smartrack-back.onrender.com
- **API Docs**: https://smartrack-back.onrender.com/docs
- **Health Check**: https://smartrack-back.onrender.com/api/health

---

## ⚠️ Troubleshooting

### **Issue: "Invalid token" errors**
- Check `AUTH0_DOMAIN` is correct in Render
- Check `AUTH0_AUDIENCE` matches the API Identifier
- Token might be expired (get a new one)

### **Issue: "CORS errors"**
- Verify Allowed Origins in Auth0 Application settings
- Include protocol (`https://` or `http://`)
- Check wildcard domains are formatted correctly

### **Issue: "No authorization header"**
- Ensure you're sending `Authorization: Bearer TOKEN`
- Token should not have extra quotes or spaces

---

## ✅ Next Steps

1. **Complete Auth0 setup** (follow steps above)
2. **Test with real Auth0 token**
3. **Configure frontend .env**
4. **Deploy frontend to Vercel** (optional)
5. **Test full login flow**

---

Need help? Run the test script:
```bash
./test-auth0-backend.sh
```

