# Google OAuth Configuration Verification Checklist

## ✅ Current Setup Status

Your app is using:
- **Domain**: `https://smar-track.vercel.app`
- **Google Client ID**: `68332296769-3j5d46t096c5k2n0r44nc5rl910c734e.apps.googleusercontent.com`
- **OAuth Library**: `@react-oauth/google` (uses implicit/token flow)

---

## 📋 Required Google Cloud Console Configuration

### 1. **Authorized JavaScript origins** ✅ (Already configured)

Go to: https://console.cloud.google.com/apis/credentials

Click on your OAuth 2.0 Client ID: `68332296769-3j5d46t096c5k2n0r44nc5rl910c734e`

Under **"Authorized JavaScript origins"**, ensure these are listed:
```
https://smar-track.vercel.app
http://localhost:5173
http://localhost:5554
```

### 2. **Authorized redirect URIs** (CRITICAL - Add these!)

Under **"Authorized redirect URIs"** in the same OAuth client, ADD:
```
https://smar-track.vercel.app
http://localhost:5173
http://localhost:5554
```

**Note**: Even though `@react-oauth/google` uses implicit flow, Google still requires the base URLs to be listed as redirect URIs for security.

### 3. **OAuth Consent Screen** ✅ (Should be configured)

Navigate to: https://console.cloud.google.com/apis/credentials/consent

Verify:
- ✅ App name: "SmarTrack" (or your app name)
- ✅ User support email: Your email
- ✅ Authorized domains: `vercel.app`
- ✅ Scopes: `https://www.googleapis.com/auth/drive.file`
- ✅ Test users: Add your email if app is in "Testing" mode

### 4. **Google Drive API Enabled** ✅ (Should be enabled)

Navigate to: https://console.cloud.google.com/apis/library/drive.googleapis.com

Click "ENABLE" if not already enabled.

---

## 🧪 Testing Checklist

After configuring the above, test the flow:

### Expected Behavior:
1. ✅ Click "Export to NotebookLM" button
2. ✅ Google OAuth popup opens (not a redirect of main page)
3. ✅ Account selection screen appears
4. ✅ Click your account
5. ✅ Consent screen appears asking for Drive permission
6. ✅ Click "Allow" or "Continue"
7. ✅ **Popup stays open for 1-2 seconds while processing**
8. ✅ Popup closes automatically
9. ✅ Success modal appears with step-by-step guide
10. ✅ Document is created in your Google Drive

### Debug Console Logs (should see):
```
============ GOOGLE OAUTH SUCCESS ============
✅ Google Login Success!
Full token response: {access_token: "ya29....", ...}
Token received: Yes (ya29.a0Aa...)
🚀 Calling exportToDrive with token...
============ EXPORT TO DRIVE CALLED ============
Access token provided: Yes
🔄 Making API request to backend...
✅ Backend response: {status: "success", ...}
🎉 Export successful! File ID: ...
📋 Opening success modal...
```

---

## 🔍 Common Issues & Fixes

### Issue 1: Popup closes immediately (< 1 second)
**Cause**: Redirect URI not authorized
**Fix**: Add base URLs to "Authorized redirect URIs" (see section 2 above)

### Issue 2: "Error 401: invalid_client"
**Cause**: Client ID mismatch or wrong project
**Fix**: 
- Verify the Client ID in Vercel env vars matches Google Cloud Console
- Ensure you're in the correct Google Cloud project

### Issue 3: Popup redirects entire page
**Cause**: Wrong flow type
**Fix**: Already handled in code with implicit flow

### Issue 4: "Access blocked: Authorization Error"
**Cause**: App not published or user not in test users list
**Fix**: 
- Add your email to "Test users" in OAuth Consent Screen
- OR publish the app (not recommended for testing)

### Issue 5: No file created in Drive
**Cause**: Token not being passed to backend OR Drive API not enabled
**Fix**:
- Check console logs for token receipt
- Verify Drive API is enabled in Google Cloud Console
- Check backend logs on Render

---

## 🚀 Quick Verification Commands

### Check if popup is blocked:
Open browser console (Cmd+Option+I) and run:
```javascript
window.open('https://accounts.google.com', '_blank', 'width=500,height=600')
```
If popup doesn't open, your browser is blocking popups.

### Check Google Client ID loading:
Open console and look for:
```
[ENV] Google Client ID loaded: 68332296769-3j5d...
```
OR
```
[ENV] ❌ Google Client ID is MISSING
```

---

## 📞 Next Steps After Configuration

1. **Save all changes** in Google Cloud Console
2. **Wait 1-2 minutes** for Google to propagate changes
3. **Hard refresh** your app: `Cmd + Shift + R`
4. **Test the flow** following the testing checklist above
5. **Share console logs** if still not working

---

## 🆘 If Still Not Working

Share these details:
1. Screenshot of your OAuth client configuration (origins + redirect URIs)
2. Full browser console logs (especially lines with ============)
3. Exact step where it fails
4. Any error messages you see


