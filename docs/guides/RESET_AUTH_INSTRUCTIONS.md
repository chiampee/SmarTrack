# Reset Authentication - Fix JWT Errors

## 🔴 Problem
Backend error: `JWT verification failed: Error decoding token headers`

Your current JWT token is corrupted or invalid.

## ✅ Solution

### Step 1: Clear All Auth Data
Open browser console (F12) and run:

```javascript
// Clear all localStorage
localStorage.clear();

// Clear all sessionStorage
sessionStorage.clear();

// Clear IndexedDB (Auth0 cache)
indexedDB.deleteDatabase('auth0spajs');
```

### Step 2: Hard Refresh
- Press `Ctrl + Shift + R` (Windows/Linux)
- Or `Cmd + Shift + R` (Mac)

### Step 3: Re-Login
1. Go to: https://smar-track.vercel.app/
2. Click "Get Started" or "Sign In"
3. **Login with:** `chaimpeer11@gmail.com`
4. Complete Auth0 login flow

### Step 4: Verify New Token
After login, check console (F12):
```
✅ [AUTH] ✅ Fresh token obtained and stored
✅ [AUTH] Token details: { sub: "auth0|...", email: "chaimpeer11@gmail.com", ... }
```

### Step 5: Test Dashboard
- Go to: https://smar-track.vercel.app/dashboard
- Should load without errors ✅

### Step 6: Test Analytics (Admin)
- Go to: https://smar-track.vercel.app/analytics
- Should load analytics page ✅

---

## 🎯 Quick Copy-Paste

**Run this in console (F12):**
```javascript
localStorage.clear();
sessionStorage.clear();
indexedDB.deleteDatabase('auth0spajs');
alert('✅ Auth data cleared! Now refresh and login again.');
```

Then refresh and login!


