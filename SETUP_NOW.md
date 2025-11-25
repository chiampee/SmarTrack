# 🚀 SET UP ENVIRONMENT VARIABLES NOW

**Follow these steps exactly - takes 30 minutes**

---

## 📍 STEP 1: Change MongoDB Password (5 minutes)

### Why First?
Because you need the new password for Step 2!

### Instructions:

1. **Open MongoDB Atlas**
   - Go to: https://cloud.mongodb.com
   - Log in with your account

2. **Navigate to Database Access**
   - Click **"Database Access"** in the left sidebar
   - Find user: `smartrack_user`

3. **Edit User**
   - Click **"Edit"** button next to the user
   - Click **"Edit Password"**

4. **Generate New Password**
   - Click **"Autogenerate Secure Password"**
   - **COPY THE PASSWORD IMMEDIATELY** (you'll need it!)
   - Paste it somewhere safe (like Notes app)

5. **Save**
   - Click **"Update User"**
   - ✅ Done!

**🔴 IMPORTANT:** Save this password! You'll need it in Step 2.

---

## 📍 STEP 2: Configure Render (Backend) - 15 minutes

### Instructions:

1. **Open Render Dashboard**
   - Go to: https://dashboard.render.com
   - Log in

2. **Select Your Service**
   - Click on **"smartrack-back"** (your backend service)

3. **Go to Environment Tab**
   - Click **"Environment"** in the left sidebar
   - You'll see a list of environment variables

4. **Add These Variables**

Click **"Add Environment Variable"** for each one:

```
Key: MONGODB_URI
Value: mongodb+srv://smartrack_user:YOUR_NEW_PASSWORD_FROM_STEP_1@cluster0.iwoqnpj.mongodb.net/?appName=Cluster0
```
**Replace `YOUR_NEW_PASSWORD_FROM_STEP_1` with the actual password you copied!**

```
Key: AUTH0_DOMAIN
Value: dev-a5hqcneif6ghl018.us.auth0.com
```

```
Key: AUTH0_AUDIENCE
Value: https://api.smartrack.com
```

```
Key: DEBUG
Value: False
```

```
Key: ADMIN_EMAILS
Value: chaimpeer11@gmail.com
```

### Get Auth0 Client ID and Secret:

**Open new tab:** https://manage.auth0.com

1. Go to **Applications** → **Applications**
2. Find your SmarTrack application
3. Copy **Client ID** and **Client Secret**

**Back to Render, add:**

```
Key: AUTH0_CLIENT_ID
Value: [paste your Auth0 Client ID]
```

```
Key: AUTH0_CLIENT_SECRET
Value: [paste your Auth0 Client Secret]
```

5. **Save Changes**
   - Click **"Save Changes"** button at the bottom
   - Render will automatically redeploy (takes ~2-3 minutes)

6. **Verify Deployment**
   - Wait for "Deploy successful" message
   - Click **"Logs"** tab
   - Look for: `✅ Connected to MongoDB`
   - If you see this, you're good! ✅

---

## 📍 STEP 3: Configure Vercel (Frontend) - 10 minutes

### Instructions:

1. **Open Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Log in

2. **Select Your Project**
   - Click on **"smar-track"** project

3. **Go to Settings**
   - Click **"Settings"** tab at the top
   - Click **"Environment Variables"** in the left sidebar

4. **Add These Variables**

For each variable:
- Click **"Add New"**
- Enter Key and Value
- Select **"Production, Preview, and Development"**
- Click **"Save"**

```
Key: VITE_BACKEND_URL
Value: https://smartrack-back.onrender.com
```

```
Key: VITE_AUTH0_DOMAIN
Value: dev-a5hqcneif6ghl018.us.auth0.com
```

```
Key: VITE_AUTH0_AUDIENCE
Value: https://api.smartrack.com
```

### Get Frontend Auth0 Client ID:

**In Auth0 Dashboard (https://manage.auth0.com):**

1. **Applications** → **Applications**
2. Look for your **SPA (Single Page Application)** for SmarTrack
   - If you only have one, use that Client ID
   - If you have separate frontend/backend, use the SPA one

```
Key: VITE_AUTH0_CLIENT_ID
Value: [paste your Auth0 SPA Client ID]
```

5. **Trigger Redeploy**
   - Go to **"Deployments"** tab
   - Click **"..."** menu on the latest deployment
   - Click **"Redeploy"**
   - Wait ~1-2 minutes for deployment

---

## 📍 STEP 4: Verify Everything Works (5 minutes)

### Test Backend:

1. Open: https://smartrack-back.onrender.com/api/health
2. You should see: `{"status":"ok"}`
3. ✅ Backend is working!

### Test Frontend:

1. Open: https://smar-track.vercel.app
2. Click **"Login"**
3. Log in with your account
4. Try to save a link
5. ✅ Frontend is working!

### Test Extension:

1. Open the extension popup
2. Try to save the current page
3. ✅ Extension is working!

---

## ❌ Troubleshooting

### Problem: Backend says "MONGODB_URI not set"
**Solution:** 
- Go back to Render
- Check the variable name is exactly `MONGODB_URI` (case-sensitive)
- Make sure you clicked "Save Changes"
- Try redeploying manually

### Problem: "Authentication failed"
**Solution:**
- Verify Auth0 Client ID and Secret are correct
- Make sure you're using the right Client ID for frontend (SPA) vs backend (Regular Web App)
- Check Auth0 Dashboard → Applications → Settings → "Allowed Callback URLs" includes your domain

### Problem: CORS error in browser
**Solution:**
- Check `VITE_BACKEND_URL` is exactly `https://smartrack-back.onrender.com` (no trailing slash)
- Verify backend is running at that URL

### Problem: "Cannot connect to MongoDB"
**Solution:**
- Verify the MongoDB password is correct
- Check MongoDB Atlas → Network Access → Allow access from anywhere is enabled
- Try the connection string in MongoDB Compass to test

---

## 🎉 Success Checklist

After completing all steps, verify:

- [ ] MongoDB password has been changed
- [ ] Backend deploys successfully on Render
- [ ] Backend health check returns `{"status":"ok"}`
- [ ] Frontend deploys successfully on Vercel
- [ ] Can log in to SmarTrack
- [ ] Can save a link from dashboard
- [ ] Extension can save links
- [ ] No console errors in browser

---

## 📞 If You Get Stuck

**Check the logs:**

**Render Backend Logs:**
1. Render Dashboard → smartrack-back → Logs
2. Look for error messages in red

**Vercel Frontend Logs:**
1. Vercel Dashboard → smar-track → Deployments → Click latest → View Function Logs

**Browser Console:**
1. Open your site
2. Press F12
3. Check Console tab for errors

---

## ⏱️ Time Estimate

- Step 1 (MongoDB): 5 minutes
- Step 2 (Render): 15 minutes
- Step 3 (Vercel): 10 minutes
- Step 4 (Testing): 5 minutes
- **Total: ~35 minutes**

---

## 🎯 What Happens Next?

Once you complete these steps:

1. ✅ Your application is secure (no exposed secrets)
2. ✅ Ready for beta testing
3. ✅ Can share with early users
4. ✅ Production-ready (for small scale)

---

**🚀 START NOW! Go to Step 1 and begin!**

---

*Need help? Check ENVIRONMENT_SETUP.md for more detailed explanations.*

