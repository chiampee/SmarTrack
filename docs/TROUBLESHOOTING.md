# 🔧 Troubleshooting Guide

This guide helps you resolve common issues with Smart Research Tracker.

## 🚨 Common Issues

### Extension Not Working

**Symptoms:**
- Extension icon doesn't appear in toolbar
- Clicking extension shows error
- "Extension not detected" in test page

**Solutions:**

1. **Check Extension Installation**
   ```bash
   # Go to chrome://extensions/
   # Ensure "Smart Research Tracker" is enabled
   # Check for any error messages
   ```

2. **Reload Extension**
   - Click the refresh icon on the extension card
   - Or remove and re-add the extension

3. **Check Permissions**
   - Ensure extension has access to current tab
   - Grant necessary permissions when prompted

4. **Verify Manifest**
   - Check if `extension/manifest.json` is valid
   - Ensure all required files exist

### Dashboard Not Loading

**Symptoms:**
- Dashboard shows blank page
- "Cannot connect" error
- Port already in use

**Solutions:**

1. **Check Server Status**
   ```bash
   # Ensure server is running
   pnpm dev
   
   # Check terminal for correct port
   # Should show: http://localhost:5173
   ```

2. **Port Conflicts**
   ```bash
   # Kill processes on port 5173
lsof -ti:5173 | xargs kill -9
   
   # Or use different port
   PORT=3000 pnpm dev
   ```

3. **Clear Browser Cache**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or clear browser cache completely

### Data Not Syncing

**Symptoms:**
- Links saved in extension don't appear in dashboard
- Dashboard shows "No links found"
- Extension shows "Save failed"

**Solutions:**

1. **Check Database**
   - Open browser DevTools (F12)
   - Go to Application tab → IndexedDB
   - Check if "SmartResearchDB" exists

2. **Test Extension Communication**
   - Open http://localhost:5173/test-extension.html
   - Run all tests to verify functionality

3. **Check Console Errors**
   - Look for database initialization errors
   - Check for message passing errors

4. **Reset Database (Development)**
   ```bash
   # Clear IndexedDB manually
   # In DevTools → Application → IndexedDB → Delete database
   ```

### AI Features Not Working

**Symptoms:**
- Summaries not generating
- AI chat not responding
- "API key required" errors

**Solutions:**

1. **Check API Keys**
   - Go to dashboard settings
   - Verify API keys are set correctly
   - Test with free AI providers

2. **Use Free AI Providers**
   - The app works without API keys
   - Uses Together AI, Groq, or Fireworks AI
   - Check if free providers are available

3. **Check Network**
   - Ensure internet connection
   - Check if API endpoints are accessible

### Build Errors

**Symptoms:**
- `pnpm build` fails
- TypeScript errors
- Missing dependencies

**Solutions:**

1. **Clean Install**
   ```bash
   # Remove node_modules and reinstall
   rm -rf node_modules package-lock.json pnpm-lock.yaml
   pnpm install
   ```

2. **Check Node.js Version**
   ```bash
   # Ensure Node.js 16+
   node --version
   ```

3. **Update Dependencies**
   ```bash
   # Update all dependencies
   pnpm update
   ```

## 🐛 Debug Mode

Enable debug logging:

1. **Extension Debug**
   - Open DevTools in extension popup
   - Check console for detailed logs

2. **Dashboard Debug**
   - Open browser DevTools
   - Check console for React errors

3. **Content Script Debug**
   - Open DevTools on any webpage
   - Look for `[SRT]` prefixed logs

## 📋 Testing Checklist

Before reporting an issue, verify:

- [ ] Node.js version 16+
- [ ] pnpm installed and working
- [ ] All dependencies installed
- [ ] Development server running
- [ ] Extension loaded in Chrome
- [ ] Dashboard accessible
- [ ] No console errors
- [ ] Test page working

## 🆘 Getting Help

If you're still having issues:

1. **Check Issues**
   - Search existing GitHub issues
   - Check if your problem is already reported

2. **Create Issue**
   - Include error messages
   - Describe steps to reproduce
   - Add browser/OS information
   - Include console logs

3. **Debug Information**
   ```bash
   # System info
   node --version
   pnpm --version
   chrome --version
   
   # Project info
   git log --oneline -5
   pnpm list --depth=0
   ```

## 🔄 Reset Everything

If all else fails:

```bash
# 1. Stop all processes
pkill -f "vite\|node"

# 2. Clear all data
rm -rf node_modules package-lock.json pnpm-lock.yaml
rm -rf dist .vite

# 3. Clear browser data
# In Chrome: Settings → Privacy → Clear browsing data
# Select: Cookies, Cached images and files, IndexedDB

# 4. Reinstall
pnpm install
pnpm dev

# 5. Reinstall extension
# Remove from chrome://extensions/
# Load unpacked again
```

---

**Still stuck?** Open an issue on GitHub with the debug information above! 🚀 