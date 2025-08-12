# 🍎 macOS Installation Guide

This guide provides detailed instructions for installing Smart Research Tracker on macOS.

## Quick Installation (Recommended)

### 1. Prerequisites Check

Before starting, ensure you have:
- **macOS 10.15 (Catalina) or later**
- **Internet connection** for downloading dependencies
- **Administrator privileges** (for Homebrew installation)

### 2. One-Command Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/smart-research-tracker.git
cd smart-research-tracker

# Run the macOS installation script
pnpm run setup:mac
```

This script will automatically:
- ✅ Install Homebrew (if missing)
- ✅ Install Node.js via Homebrew
- ✅ Install pnpm package manager
- ✅ Install project dependencies
- ✅ Create environment configuration
- ✅ Detect Google Chrome
- ✅ Offer desktop shortcut creation
- ✅ Offer application bundle creation

### 3. Start the Application

```bash
# Start the development server
pnpm run start:mac
# or
pnpm dev
```

## Manual Installation

If you prefer manual installation:

### 1. Install Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Node.js

```bash
brew install node
```

### 3. Install pnpm

```bash
brew install pnpm
```

### 4. Install Project Dependencies

```bash
pnpm install
```

### 5. Create Environment File

```bash
cp .env.example .env.local
# Edit .env.local with your API keys (optional)
```

## macOS-Specific Features

### Homebrew Integration

The macOS installation script uses Homebrew for package management:
- **Automatic installation** of missing packages
- **Version management** for Node.js and pnpm
- **Easy updates** with `brew upgrade`

### Apple Silicon Support

For M1/M2 Macs:
- **Automatic ARM64 detection**
- **Native performance** optimization
- **Homebrew path configuration** for Apple Silicon

### Chrome Detection

The script automatically detects Google Chrome:
- **Path verification**: `/Applications/Google Chrome.app`
- **Installation guidance** if Chrome is missing
- **Extension compatibility** check

### Desktop Integration

Optional features during installation:

#### Desktop Shortcut
Creates a clickable shortcut on your desktop:
```bash
~/Desktop/Smart Research Tracker.command
```

#### Application Bundle
Creates a native macOS application:
```bash
~/Applications/Smart Research Tracker.app
```

## Troubleshooting

### Homebrew Issues

```bash
# Update Homebrew
brew update

# Fix permissions
sudo chown -R $(whoami) /opt/homebrew

# Reinstall Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Node.js Issues

```bash
# Check Node.js version
node --version

# Update Node.js
brew upgrade node

# Switch Node.js versions (if needed)
brew install node@18
```

### Permission Issues

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm

# Fix pnpm permissions
sudo chown -R $(whoami) ~/.pnpm-store
```

### Port Conflicts

```bash
# Check what's using port 5173
lsof -i :5173

# Kill process using the port
kill -9 $(lsof -ti:5173)

# Use different port
PORT=3000 pnpm dev
```

## Development on macOS

### Recommended Tools

- **Visual Studio Code**: Best editor for this project
- **iTerm2**: Better terminal experience
- **Chrome DevTools**: For extension debugging

### Useful Commands

```bash
# Start development server
pnpm run start:mac

# Build for production
pnpm build

# Test the extension
open http://localhost:5173/test-extension.html

# Open Chrome extensions page
open chrome://extensions/

# Clear all data (development)
pnpm run db:reset
```

### Performance Tips

- **Use pnpm**: Faster than npm, better disk usage
- **Enable hardware acceleration** in Chrome
- **Use SSD storage** for better performance
- **Close unnecessary apps** when developing

## Security Considerations

### File Permissions

The installation script sets appropriate permissions:
- **Executable scripts**: `chmod +x`
- **User ownership**: `chown $(whoami)`
- **Secure defaults**: No global installations

### Network Access

The application requires:
- **Local development server**: `localhost:5173`
- **Chrome extension APIs**: For browser integration
- **Optional API calls**: For AI features

### Data Storage

All data is stored locally:
- **IndexedDB**: Browser-based database
- **Chrome Storage**: Extension data
- **No cloud sync**: Privacy-focused

## Support

For macOS-specific issues:

1. **Check system requirements**
2. **Verify Homebrew installation**
3. **Check Node.js version**
4. **Review console logs**
5. **Try manual installation**

Need help? Open an issue on GitHub with:
- macOS version: `sw_vers`
- Node.js version: `node --version`
- Homebrew version: `brew --version`
- Error messages and logs

---

**Happy developing on macOS! 🍎** 