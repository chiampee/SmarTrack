# 🚨 CRITICAL SECURITY FIXES REQUIRED

## ⚠️ DO THESE IMMEDIATELY BEFORE PRODUCTION

### 1. Fix Exposed MongoDB Credentials

**Current Issue:** Database password is hardcoded in `backend/core/config.py`

**Steps to Fix:**

1. **Update `backend/core/config.py`:**
```python
# BEFORE (INSECURE):
MONGODB_URI: str = "mongodb+srv://smartrack_user:UW0AC5aYv8q3suiB@..."

# AFTER (SECURE):
MONGODB_URI: str  # No default value - MUST come from environment
```

2. **Create `.env` file in backend directory (NOT committed to Git):**
```bash
MONGODB_URI=mongodb+srv://smartrack_user:NEW_PASSWORD@cluster0.iwoqnpj.mongodb.net/?appName=Cluster0
```

3. **Update MongoDB Atlas password:**
   - Go to MongoDB Atlas Dashboard
   - Database Access → Edit User → Change Password
   - Use password generator for strong password
   - Update `.env` with new password

4. **Update Render environment variables:**
   - Go to Render Dashboard → smartrack-back
   - Environment → Add `MONGODB_URI` with new password
   - Redeploy

### 2. Fix Exposed Auth0 Configuration

**Update `backend/core/config.py`:**
```python
# Remove defaults for sensitive data
AUTH0_DOMAIN: str
AUTH0_AUDIENCE: str  
AUTH0_CLIENT_SECRET: str
AUTH0_CLIENT_ID: str
```

**Add to `.env`:**
```bash
AUTH0_DOMAIN=dev-a5hqcneif6ghl018.us.auth0.com
AUTH0_AUDIENCE=https://api.smartrack.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
```

**Update Render:**
- Add all AUTH0_* variables to environment

### 3. Disable Debug Mode

**Update `backend/core/config.py`:**
```python
# BEFORE:
DEBUG: bool = True

# AFTER:
DEBUG: bool = False  # Or from environment variable
```

### 4. Reduce Rate Limits

**Update `backend/core/config.py`:**
```python
# BEFORE:
RATE_LIMIT_REQUESTS_PER_MINUTE: int = 1000  # WAY TOO HIGH

# AFTER:
RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60  # Reasonable limit
ADMIN_RATE_LIMIT_REQUESTS_PER_MINUTE: int = 300
```

### 5. Verify .gitignore

**Make sure `.gitignore` includes:**
```
.env
.env.local
.env.production
*.env
backend/.env
```

### 6. Clean Git History (IMPORTANT!)

Your database password is in Git history. You have two options:

**Option A: Rotate Credentials (Recommended)**
- Change MongoDB password (already covered above)
- Consider the old password compromised
- Update all deployment environments

**Option B: Clean Git History (Advanced)**
```bash
# WARNING: This rewrites history - coordinate with team
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/core/config.py" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (DANGEROUS - only if repository is private and you coordinate with team)
git push origin --force --all
```

---

## ✅ Verification Checklist

After making changes, verify:

- [ ] No hardcoded passwords in any committed files
- [ ] `.env` file exists and is in `.gitignore`
- [ ] MongoDB password has been rotated
- [ ] All environment variables are set in Render
- [ ] All environment variables are set in Vercel
- [ ] Backend starts successfully with environment variables
- [ ] Frontend connects to backend successfully
- [ ] Authentication works
- [ ] Extension can save links
- [ ] Debug mode is OFF
- [ ] Rate limits are set to 60/min
- [ ] Run: `git log -p backend/core/config.py` to verify no secrets in recent commits

---

## 🔐 Additional Security Recommendations

### Enable 2FA
- MongoDB Atlas: Enable 2FA for your account
- Auth0: Enable 2FA for admin account
- GitHub: Enable 2FA (required for private repos with secrets)

### Environment Variable Management
- Use 1Password, LastPass, or similar for team secret sharing
- Never send secrets via email or Slack
- Rotate secrets every 90 days

### Monitoring
- Set up alerts for failed login attempts
- Monitor for unusual database activity
- Enable MongoDB Atlas alerts for connection spikes

---

## 📞 Emergency Response

**If you believe credentials were compromised:**

1. **Immediately** rotate MongoDB password
2. **Immediately** rotate Auth0 client secret
3. Review MongoDB Atlas logs for unauthorized access
4. Review Auth0 logs for suspicious activity
5. Check for unexpected database changes
6. Consider notifying users if data was accessed

---

**Estimated Time to Complete:** 1-2 hours  
**Priority:** 🔴 CRITICAL - Do before any production deployment

