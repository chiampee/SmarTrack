# 🍎 macOS Quick Reference

## Installation Commands

```bash
# Quick install (recommended)
pnpm run setup:mac

# Start the app
pnpm run start:mac

# Regular commands
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm test         # Run tests
```

## Useful URLs

- **Dashboard**: http://localhost:5173
- **Test Page**: http://localhost:5173/test-extension.html
- **Chrome Extensions**: chrome://extensions/

## Quick Troubleshooting

### App Won't Start
```bash
# Check if server is running
lsof -i :5173

# Kill conflicting process
kill -9 $(lsof -ti:5173)

# Restart
pnpm run start:mac
```

### Extension Issues
```bash
# Open Chrome extensions
open chrome://extensions/

# Reload extension
# Click refresh icon on extension card
```

### Permission Issues
```bash
# Fix Homebrew permissions
sudo chown -R $(whoami) /opt/homebrew

# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

## System Info Commands

```bash
# macOS version
sw_vers

# Node.js version
node --version

# Homebrew version
brew --version

# Check architecture
uname -m
```

## Development Tips

- **Use iTerm2** for better terminal experience
- **Enable hardware acceleration** in Chrome
- **Use VS Code** for editing
- **Keep Homebrew updated**: `brew update && brew upgrade`

## Quick Reset

```bash
# Stop all processes
pkill -f "vite\|node"

# Clear dependencies
rm -rf node_modules pnpm-lock.yaml

# Reinstall
pnpm run install:mac
```

---

**Need more help?** See [macOS Installation Guide](macos-installation.md) 📖 