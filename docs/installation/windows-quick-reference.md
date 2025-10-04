# 🪟 Windows Quick Reference

Quick commands and tips for Smart Research Tracker on Windows.

## 🚀 Quick Start

```cmd
# Clone and install
git clone https://github.com/your-repo/smart-research-tracker.git
cd smart-research-tracker
scripts\install.bat

# Start the app
pnpm run start:windows
```

## 📋 Essential Commands

### Installation & Setup
```cmd
scripts\install.bat              # Automated installation
pnpm run setup                   # Universal installation
pnpm run start:windows          # Windows launcher
```

### Testing
```cmd
pnpm run test:windows           # Test Windows installation
pnpm run test:errors            # Test error handling
pnpm run test:install           # Test complete installation
```

### Development
```cmd
pnpm dev                        # Start development server
pnpm build                      # Build for production
pnpm preview                    # Preview production build
```

### Extension
```cmd
pnpm run build:extension        # Build extension
pnpm run test:extension         # Test extension
```

## 🔗 Useful URLs

- **Dashboard**: http://localhost:5173
- **Test Page**: http://localhost:5173/test-extension.html
- **Extension Management**: chrome://extensions/
- **Node.js Download**: https://nodejs.org/

## 🛠️ Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Node.js not found | Download from [nodejs.org](https://nodejs.org/) |
| pnpm not found | `npm install -g pnpm` |
| Permission denied | Run as Administrator |
| Port in use | Close other apps or change port |
| Extension not loading | Check `chrome://extensions/` |

### Windows-Specific Fixes

```cmd
# PowerShell execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Git long paths
git config --system core.longpaths true

# Check Windows version
winver

# Check Node.js version
node --version

# Check pnpm version
pnpm --version
```

## 🎯 System Requirements

- **OS**: Windows 10/11 (64-bit)
- **Node.js**: v16 or higher
- **RAM**: 4GB+ recommended
- **Storage**: 1GB free space
- **Browser**: Chrome/Edge

## 📱 Extension Installation

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension` folder
5. Extension appears in browser

## 🔧 Performance Tips

- Use **Windows Terminal** instead of cmd
- Enable **WSL** for better performance
- Use **SSD storage** if available
- Close unnecessary applications
- Monitor **Task Manager** for resources

## 🆘 Quick Help

### Debug Information
```cmd
# System info
systeminfo | findstr /B /C:"OS Name" /C:"OS Version"

# Node.js info
node --version
npm --version
pnpm --version

# Project status
pnpm run test:windows
```

### Support
- **GitHub Issues**: Report bugs
- **Documentation**: [Windows Installation Guide](windows-installation.md)
- **Error Handling**: [Error Handling Guide](error-handling-guide.md)

---

**Happy researching on Windows! 🪟🚀** 