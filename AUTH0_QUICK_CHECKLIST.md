# 🚀 Auth0 Quick Setup (5 Minutes)

## ✅ What You Need to Do

### **1️⃣ Open Auth0 Dashboard**
```
URL: https://manage.auth0.com
Tenant: dev-a5hqcneif6ghl018
```

---

### **2️⃣ Create API (2 minutes)**

**Path:** Applications → APIs → + Create API

**Fill in:**
- Name: `SmarTrack API`
- Identifier: `https://api.smartrack.com`
- Signing Algorithm: `RS256`

**Click:** Create

**✅ Copy:** The Identifier → `https://api.smartrack.com`

---

### **3️⃣ Create Application (3 minutes)**

**Path:** Applications → Applications → + Create Application

**Fill in:**
- Name: `SmarTrack Frontend`
- Type: `Single Page Web Applications`

**Click:** Create

**In Settings tab, add these URLs:**

**Allowed Callback URLs:**
```
http://localhost:3001/callback,https://smartrack-back.onrender.com/callback,https://*.vercel.app/callback
```

**Allowed Logout URLs:**
```
http://localhost:3001,https://smartrack-back.onrender.com,https://*.vercel.app
```

**Allowed Web Origins:**
```
http://localhost:3001,https://smartrack-back.onrender.com,https://*.vercel.app
```

**Allowed Origins (CORS):**
```
http://localhost:3001,https://smartrack-back.onrender.com,https://*.vercel.app
```

**Click:** Save Changes

**✅ Copy from top of page:**
- Domain: `dev-a5hqcneif6ghl018.us.auth0.com`
- Client ID: `[the long string shown]`

---

### **4️⃣ Update Render**

**Path:** https://dashboard.render.com → smarttrack-back → Environment

**Add these:**
```
AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
AUTH0_AUDIENCE=https://api.smartrack.com
```

**Click:** Save Changes

**⏰ Wait:** 2-3 minutes for redeploy

---

### **5️⃣ Test It!**

**Run:**
```bash
cd /Users/chaim/SmarTrack
./test-auth0-backend.sh
```

**Or manually:**
```bash
curl -H "Authorization: Bearer mock-token-for-development" \
     https://smartrack-back.onrender.com/api/links
```

**✅ Expected:** `{"links": [], "total": 0, ...}`

---

## 📝 Your Credentials

**Write these down:**

```
AUTH0_DOMAIN = dev-a5hqcneif6ghl018.us.auth0.com
AUTH0_AUDIENCE = https://api.smartrack.com
AUTH0_CLIENT_ID = [Get from Auth0 Application page]
```

---

## ✅ Done!

Your backend is now connected to Auth0! 🎉

**Next:** Configure frontend or test the API
