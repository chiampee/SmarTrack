# WebSocket Connection Troubleshooting

## Common WebSocket Issues

If you're experiencing WebSocket connection failures with the Vite development server, here are the most common causes and solutions:

### 1. Port Conflicts
**Symptoms:** `WebSocket connection to 'ws://localhost:5173/?token=...' failed`

**Solutions:**
- Check if port 5173 is already in use: `lsof -i :5173`
- Kill any conflicting processes: `kill -9 <PID>`
- Or change the port in `vite.config.ts`:
  ```typescript
  server: {
    port: 3000, // or any other available port
  }
  ```

### 2. Firewall/Antivirus Blocking
**Symptoms:** Connection fails immediately or times out

**Solutions:**
- Temporarily disable firewall/antivirus
- Add localhost:5173 to firewall allowlist
- Check macOS Security & Privacy settings

### 3. Network Configuration Issues
**Symptoms:** Intermittent connection failures

**Solutions:**
- Ensure `host: 'localhost'` in vite.config.ts
- Check if using VPN or proxy that might interfere
- Try `host: '0.0.0.0'` for network access

### 4. Browser Issues
**Symptoms:** Works in one browser but not another

**Solutions:**
- Clear browser cache and cookies
- Disable browser extensions temporarily
- Try incognito/private mode
- Update browser to latest version

### 5. HMR Configuration
**Symptoms:** Hot reload not working, WebSocket errors in console

**Solutions:**
- Ensure proper HMR configuration in `vite.config.ts`:
  ```typescript
  hmr: {
    overlay: false,
    port: 5173,
    host: 'localhost',
    protocol: 'ws',
  }
  ```

## Current Configuration

The project is configured with:
- Port: 5173
- Host: localhost
- HMR: Enabled with explicit port/host settings
- Protocol: WebSocket (ws)

## Quick Fixes

1. **Restart the development server:**
   ```bash
   npm run dev
   ```

2. **Clear browser cache and reload**

3. **Check for port conflicts:**
   ```bash
   lsof -i :5173
   ```

4. **Use a different port:**
   ```bash
   npm run dev -- --port 3000
   ```

## Debugging Steps

1. Open browser DevTools
2. Check Console for WebSocket errors
3. Check Network tab for failed WebSocket connections
4. Look for CORS or security policy errors

## Environment-Specific Issues

### macOS
- Check Security & Privacy settings
- Ensure Terminal has necessary permissions
- Check for macOS firewall blocking connections

### Windows
- Check Windows Defender Firewall
- Ensure antivirus isn't blocking localhost connections
- Check for corporate network restrictions

### Linux
- Check iptables/firewalld rules
- Ensure proper network interface configuration
- Check for SELinux restrictions 