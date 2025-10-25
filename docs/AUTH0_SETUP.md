# 🔐 Auth0 Setup Guide

This guide will walk you through setting up Auth0 authentication for Smart Research Tracker.

## Why Auth0?

Auth0 provides:
- ✅ **Secure authentication** with industry-standard OAuth 2.0
- ✅ **User-specific data** - each user has their own private research library
- ✅ **Social login** - Google, GitHub, Microsoft, etc.
- ✅ **Cloud sync** - access your research from any device
- ✅ **No password management** - Auth0 handles everything securely

---

## Step 1: Create an Auth0 Account

1. Go to [auth0.com](https://auth0.com)
2. Click "Sign Up" and create a free account
3. Choose your region (closest to your users for best performance)

---

## Step 2: Create an Application

1. In the Auth0 Dashboard, go to **Applications** → **Applications**
2. Click **Create Application**
3. Name it: `Smart Research Tracker`
4. Select **Single Page Web Applications**
5. Click **Create**

---

## Step 3: Configure Application Settings

### Allowed Callback URLs
Add these URLs (one per line):
```
http://localhost:5173/callback
http://localhost:5174/callback
https://your-domain.vercel.app/callback
```

### Allowed Logout URLs
Add these URLs:
```
http://localhost:5173
http://localhost:5174
https://your-domain.vercel.app
```

### Allowed Web Origins
Add these URLs:
```
http://localhost:5173
http://localhost:5174
https://your-domain.vercel.app
```

### Allowed Origins (CORS)
Add these URLs:
```
http://localhost:5173
http://localhost:5174
https://your-domain.vercel.app
```

Click **Save Changes**

---

## Step 4: Get Your Credentials

From the Application settings page, copy:

1. **Domain** (e.g., `your-app.us.auth0.com`)
2. **Client ID** (long alphanumeric string)

---

## Step 5: Configure Your Application

### For Local Development:

1. Copy `env.example.txt` to `.env`:
   ```bash
   cp env.example.txt .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   VITE_AUTH0_DOMAIN=your-app.us.auth0.com
   VITE_AUTH0_CLIENT_ID=your-client-id-here
   VITE_AUTH0_AUDIENCE=
   ```

3. Restart your development server:
   ```bash
   pnpm dev
   ```

### For Vercel Deployment:

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add these variables:
   - `VITE_AUTH0_DOMAIN` → your-app.us.auth0.com
   - `VITE_AUTH0_CLIENT_ID` → your-client-id
   - `VITE_AUTH0_AUDIENCE` → (leave empty for now)

4. Redeploy your application

---

## Step 6: Enable Social Connections (Optional)

1. In Auth0 Dashboard, go to **Authentication** → **Social**
2. Click on the provider you want (Google, GitHub, etc.)
3. Follow the setup instructions for each provider
4. Toggle **ON** and save

Popular options:
- 🔵 **Google** - Most users have Google accounts
- 🐙 **GitHub** - Great for developers
- 🪟 **Microsoft** - Good for enterprise users

---

## Step 7: Test Your Integration

1. Start your app: `pnpm dev`
2. Visit `http://localhost:5173`
3. You should see a login page
4. Click "Sign In"
5. Auth0 login modal should appear
6. Sign up with email or social provider
7. After login, you should be redirected to your dashboard

---

## Troubleshooting

### "Redirect URI mismatch" error

**Solution:** Make sure your callback URL is added to "Allowed Callback URLs" in Auth0 settings.

### "Invalid state" error

**Solution:** Clear your browser cache and cookies, then try again.

### Login works but immediately logs out

**Solution:** Check that your domain is added to "Allowed Web Origins" in Auth0 settings.

### Can't see user data

**Solution:** Make sure you're using the correct Auth0 domain and client ID in your `.env` file.

---

## Production Checklist

Before deploying to production:

- [ ] Add production URL to all Auth0 allowed URLs
- [ ] Set environment variables in Vercel
- [ ] Test login/logout flow
- [ ] Test social providers (if enabled)
- [ ] Enable MFA (Multi-Factor Authentication) in Auth0 Dashboard
- [ ] Review Auth0 security settings
- [ ] Set up monitoring and alerts

---

## Security Best Practices

1. **Never commit `.env`** to version control
2. **Use different Auth0 applications** for development and production
3. **Enable MFA** for your Auth0 dashboard account
4. **Regularly review** Auth0 logs for suspicious activity
5. **Keep Auth0 SDK updated** to latest version

---

## Cost

Auth0 Free Tier includes:
- ✅ 7,000 free active users
- ✅ Unlimited logins
- ✅ Social and database connections
- ✅ Email support

This is perfect for most small to medium projects!

---

## Support

- **Auth0 Documentation:** https://auth0.com/docs
- **Auth0 Community:** https://community.auth0.com
- **Project Issues:** https://github.com/chiampee/SmarTrack/issues

---

## Next Steps

After Auth0 is set up:

1. All users will have their own private data
2. Data syncs across devices automatically
3. Users can login with social accounts
4. You can manage users from Auth0 Dashboard

Enjoy your secure, multi-user research tracker! 🎉

