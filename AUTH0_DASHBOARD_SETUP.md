# 🔐 Auth0 Dashboard Setup - Step by Step

## Quick Setup Checklist

Follow these steps to configure your Auth0 application:

---

## Step 1: Log into Auth0 Dashboard

1. Go to: **https://manage.auth0.com**
2. Log in with your Auth0 account
3. Select your tenant: `dev-a5hqcneif6ghl018`

---

## Step 2: Find Your Application

1. Click **Applications** in the left sidebar
2. Click **Applications** again in the submenu
3. Find your application: **"Smart Research Tracker"** (or create one if it doesn't exist)
4. Click on it to open settings

---

## Step 3: Configure Allowed Callback URLs

This is **CRITICAL** - without this, login won't work!

**Scroll to "Application URIs" section**

Find the field: **Allowed Callback URLs**

Paste these URLs (comma-separated or one per line):

```
http://localhost:5173/callback,
http://localhost:5174/callback,
https://your-vercel-domain.vercel.app/callback
```

⚠️ **Important**: 
- It's `/callback` NOT `/auth/callback`
- Replace `your-vercel-domain` with your actual Vercel URL when you deploy

---

## Step 4: Configure Allowed Logout URLs

Find the field: **Allowed Logout URLs**

Paste these URLs:

```
http://localhost:5173,
http://localhost:5174,
https://your-vercel-domain.vercel.app
```

---

## Step 5: Configure Allowed Web Origins

Find the field: **Allowed Web Origins**

Paste these URLs:

```
http://localhost:5173,
http://localhost:5174,
https://your-vercel-domain.vercel.app
```

This allows your app to silently refresh tokens.

---

## Step 6: Configure Allowed Origins (CORS)

Find the field: **Allowed Origins (CORS)**

Paste these URLs:

```
http://localhost:5173,
http://localhost:5174,
https://your-vercel-domain.vercel.app
```

This prevents CORS errors.

---

## Step 7: Save Changes

**Scroll to the bottom** and click **"Save Changes"**

✅ You're done!

---

## Visual Guide

Here's what each setting does:

```
┌─────────────────────────────────────────────┐
│ Application Settings                         │
├─────────────────────────────────────────────┤
│                                              │
│ Domain: dev-a5hqcneif6ghl018.us.auth0.com  │
│ Client ID: nAL3tgnPEm2IbcwLzRyTcw7IW4Nulv7T│
│                                              │
│ ┌─────────────────────────────────────┐    │
│ │ Application URIs                     │    │
│ ├─────────────────────────────────────┤    │
│ │                                      │    │
│ │ Allowed Callback URLs:               │    │
│ │ [http://localhost:5173/callback   ] │◄── ADD THIS
│ │                                      │    │
│ │ Allowed Logout URLs:                 │    │
│ │ [http://localhost:5173            ] │◄── ADD THIS
│ │                                      │    │
│ │ Allowed Web Origins:                 │    │
│ │ [http://localhost:5173            ] │◄── ADD THIS
│ │                                      │    │
│ │ Allowed Origins (CORS):              │    │
│ │ [http://localhost:5173            ] │◄── ADD THIS
│ │                                      │    │
│ └─────────────────────────────────────┘    │
│                                              │
│         [Save Changes]  ◄─── CLICK THIS     │
└─────────────────────────────────────────────┘
```

---

## Test Your Configuration

After saving, test that it works:

### Test 1: Local Development (Mock Auth)
```bash
npm run dev
```
Visit http://localhost:5173 - should work without login (mock auth)

### Test 2: Real Auth0 (Optional)
1. Edit `src/config/auth0.ts`:
   ```typescript
   export const AUTH_ENABLED = true;
   ```
2. Restart dev server
3. Visit http://localhost:5173
4. Should redirect to Auth0 login
5. Sign in with your Auth0 account
6. Should redirect back to your app
7. **Remember to revert the change!**

---

## Common Issues & Fixes

### "Callback URL mismatch" error
❌ **Problem**: You entered the wrong callback URL
✅ **Solution**: Make sure it's exactly `http://localhost:5173/callback` (with `/callback` at the end)

### "Origin not allowed" error
❌ **Problem**: CORS not configured
✅ **Solution**: Add your domain to "Allowed Origins (CORS)"

### "Invalid state" error
❌ **Problem**: Cached auth state
✅ **Solution**: Clear browser cache and cookies, try again

### Login redirects but immediately logs out
❌ **Problem**: Web Origins not configured
✅ **Solution**: Add your domain to "Allowed Web Origins"

---

## Optional: Enable Social Login

Want users to sign in with Google, GitHub, etc?

### Enable Google Login

1. In Auth0 Dashboard, click **Authentication** → **Social**
2. Click on **Google**
3. You have two options:
   - **Quick Setup**: Toggle "Use Auth0 Developer Keys" (good for testing)
   - **Production**: Enter your Google OAuth credentials
4. Toggle the switch to **ON**
5. Click **Save**

✅ Google login enabled!

### Enable GitHub Login

1. Same process, but select **GitHub**
2. You'll need to create a GitHub OAuth App first:
   - Go to GitHub → Settings → Developer settings → OAuth Apps
   - Create new app
   - Copy Client ID and Secret
   - Paste into Auth0
3. Toggle **ON**
4. Save

✅ GitHub login enabled!

### Enable Other Providers

Auth0 supports many providers:
- Microsoft / Azure AD
- Facebook
- Twitter
- LinkedIn
- Apple
- And many more!

Just repeat the same process for any provider you want.

---

## When You Deploy to Vercel

1. **Get your Vercel URL** (e.g., `smartrack-xyz.vercel.app`)

2. **Update all 4 Auth0 settings** by adding:
   ```
   https://smartrack-xyz.vercel.app/callback    ← Callback URLs
   https://smartrack-xyz.vercel.app             ← Logout URLs
   https://smartrack-xyz.vercel.app             ← Web Origins
   https://smartrack-xyz.vercel.app             ← CORS Origins
   ```

3. **Add environment variables in Vercel**:
   - Go to Vercel project → Settings → Environment Variables
   - Add:
     ```
     VITE_AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
     VITE_AUTH0_CLIENT_ID=nAL3tgnPEm2IbcwLzRyTcw7IW4Nulv7T
     VITE_AUTH0_AUDIENCE=
     ```

4. **Redeploy** your Vercel app

5. **Test production login!**

---

## Security Best Practices

### For Production:

1. **Use different Auth0 applications** for dev and prod
   - Create a second Auth0 app for production
   - Use different client IDs
   - Prevents mixing dev/prod users

2. **Enable Multi-Factor Authentication (MFA)**
   - Auth0 Dashboard → Security → Multi-factor Auth
   - Toggle ON for extra security

3. **Review security settings**
   - Auth0 Dashboard → Security → Attack Protection
   - Enable brute force protection
   - Enable breached password detection

4. **Monitor your logs**
   - Auth0 Dashboard → Monitoring → Logs
   - Watch for suspicious activity

---

## Summary

✅ **Must Do** (5 minutes):
1. Add callback URLs to Auth0
2. Add logout URLs to Auth0
3. Add web origins to Auth0
4. Add CORS origins to Auth0
5. Save changes

✅ **Optional** (5-10 minutes each):
- Enable Google login
- Enable GitHub login
- Set up other social providers

✅ **When Deploying** (5 minutes):
- Add Vercel URLs to Auth0
- Set environment variables in Vercel

---

## Need Help?

- **Auth0 Documentation**: https://auth0.com/docs
- **Auth0 Community**: https://community.auth0.com
- **Your Test Script**: `npm run test:auth0`
- **Quick Start Guide**: `docs/AUTH0_QUICK_START.md`

---

**That's it!** Your Auth0 dashboard is now configured. 🎉

The next time someone tries to log in, Auth0 will recognize your app and allow the authentication to complete successfully.

