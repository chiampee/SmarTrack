# Clear Browser Cache Instructions

## 🔄 The CSP fix has been deployed, but your browser may be caching old headers

### Quick Fix Steps:

## 1️⃣ **Hard Refresh** (Try this first)
- **Windows/Linux:** `Ctrl + F5` or `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`
- **Alternative:** Hold `Shift` and click the refresh button

---

## 2️⃣ **Clear Cache (If hard refresh doesn't work)**

### Chrome / Edge / Brave:
1. Press `F12` to open DevTools
2. **Right-click** the refresh button (⟳)
3. Select **"Empty Cache and Hard Reload"**

OR

1. Press `Ctrl/Cmd + Shift + Delete`
2. Select **"Cached images and files"**
3. Choose **"Last hour"** or **"All time"**
4. Click **"Clear data"**

### Firefox:
1. Press `Ctrl/Cmd + Shift + Delete`
2. Select **"Cache"**
3. Choose **"Everything"**
4. Click **"Clear Now"**

### Safari:
1. Press `Cmd + Option + E` (Empty Caches)
2. Or: Safari → Preferences → Advanced → Show Develop menu
3. Develop → Empty Caches
4. Refresh page

---

## 3️⃣ **Verify Headers Are Updated**

After clearing cache, open Console (F12) and check:

### ✅ You should see:
```
[SRT] Content script loaded on: https://smar-track.vercel.app/
[SRT] IndexedDB connection established
```

### ❌ You should NOT see:
```
Loading the stylesheet 'https://fonts.googleapis.com/...' violates CSP
Framing 'https://dev-a5hqcneif6ghl018.us.auth0.com/' violates CSP
```

---

## 4️⃣ **Still Not Working?**

### Check if headers are updated on server:
```bash
curl -sI https://smar-track.vercel.app/ | grep content-security-policy
```

Should show:
```
content-security-policy: default-src 'self'; ... frame-src https://dev-a5hqcneif6ghl018.us.auth0.com; ...
```

### If headers show old values:
- Wait 2-3 minutes for Vercel CDN to propagate
- Try in **Incognito/Private browsing** mode
- Try a different browser

---

## 🎯 Alternative: Use Incognito/Private Mode

This bypasses all cache:
- **Chrome/Edge:** `Ctrl/Cmd + Shift + N`
- **Firefox:** `Ctrl/Cmd + Shift + P`
- **Safari:** `Cmd + Shift + N`

Then visit: https://smar-track.vercel.app/

---

## 📊 How to Confirm It's Fixed

Open Console (F12) and you should see:
```
✅ Google Fonts loading
✅ Auth0 iframe loading
✅ No CSP violation errors
```

---

**Deployment Status:** ✅ Live
**Deployment Time:** Just now
**CDN Propagation:** 1-3 minutes

