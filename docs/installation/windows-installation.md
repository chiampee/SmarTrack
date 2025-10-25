# 🪟 Windows Installation Guide

This guide provides detailed instructions for installing and running Smart Research Tracker on Windows.

## 📋 Prerequisites

### Required Software
- **Windows 10/11** (64-bit recommended)
- **Node.js v16 or higher** - [Download from nodejs.org](https://nodejs.org/)
- **Git** (optional, for cloning) - [Download from git-scm.com](https://git-scm.com/)

### Recommended
- **Chrome/Edge browser** for the extension
- **Visual Studio Code** for development
- **Windows Terminal** for better command line experience

## 🚀 Quick Installation

### Option 1: Automated Installation (Recommended)

1. **Download the project**
   ```cmd
   git clone https://github.com/your-repo/smart-research-tracker.git
   cd smart-research-tracker
   ```

2. **Run the installation script**
   ```cmd
   scripts\install.bat
   ```

3. **Start the application**
   ```cmd
   pnpm run start:windows
   ```

### Option 2: Manual Installation

1. **Install Node.js**
   - Download from [nodejs.org](https://nodejs.org/)
   - Choose the LTS version
   - Run the installer and follow the prompts

2. **Install pnpm**
   ```cmd
   npm install -g pnpm
   ```

3. **Clone and setup the project**
   ```cmd
   git clone https://github.com/your-repo/smart-research-tracker.git
   cd smart-research-tracker
   pnpm install
   ```

4. **Create environment file**
   ```cmd
   copy .env.example .env.local
   ```

5. **Start the application**
   ```cmd
   pnpm dev
   ```

## 🧪 Testing Installation

### Run Installation Tests
```cmd
pnpm run test:windows
```

This will check:
- ✅ Node.js installation
- ✅ pnpm installation
- ✅ Project dependencies
- ✅ Environment configuration
- ✅ Extension files
- ✅ Package scripts
- ✅ Configuration files
- ✅ Documentation

### Test Error Handling
```cmd
pnpm run test:errors
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Node.js Not Found
```
❌ Node.js is not installed
```
**Solution:**
- Download and install Node.js from [nodejs.org](https://nodejs.org/)
- Restart your command prompt after installation
- Verify with: `node --version`

#### 2. pnpm Not Found
```
❌ pnpm is not installed
```
**Solution:**
```cmd
npm install -g pnpm
```

#### 3. Permission Denied
```
❌ Permission denied when installing dependencies
```
**Solution:**
- Run Command Prompt as Administrator
- Or use PowerShell with elevated privileges

#### 4. Port Already in Use
```
❌ Port 5173 is already in use
```
**Solution:**
- Close other applications using the port
- Or change the port in `vite.config.ts`

#### 5. Extension Not Loading
```
❌ Extension files not found
```
**Solution:**
- Ensure you're in the project root directory
- Run: `pnpm run test:windows` to verify files

### Windows-Specific Issues

#### 1. PowerShell Execution Policy
If you get execution policy errors:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 2. Long Path Issues
If you encounter long path errors:
```cmd
git config --system core.longpaths true
```

#### 3. Antivirus Interference
Some antivirus software may block Node.js or pnpm:
- Add the project directory to antivirus exclusions
- Temporarily disable real-time protection during installation

## 🎯 Available Commands

### Installation & Setup
```cmd
pnpm run setup              # Universal installation
pnpm run start:windows      # Windows-specific launcher
```

### Testing
```cmd
pnpm run test:windows       # Test Windows installation
pnpm run test:errors        # Test error handling
pnpm run test:install       # Test complete installation
```

### Development
```cmd
pnpm dev                    # Start development server
pnpm build                  # Build for production
pnpm preview                # Preview production build
```

### Extension
```cmd
pnpm run build:extension    # Build extension
pnpm run test:extension     # Test extension functionality
```

## 🔗 Useful URLs

Once the application is running:
- **Dashboard**: http://localhost:5173
- **Test Page**: http://localhost:5173/test-extension.html
- **Extension Help**: chrome://extensions/

## 📱 Browser Extension Installation

### Chrome/Edge Installation
1. Open `chrome://extensions/` or `edge://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `extension` folder from the project
5. The extension should now appear in your browser

### Extension Permissions
The extension requires these permissions:
- **Storage**: For saving links and settings
- **Active Tab**: For reading page content
- **Scripting**: For injecting content scripts
- **Tabs**: For communicating with tabs
- **Context Menus**: For right-click menu options

## 🎨 Windows-Specific Features

### Desktop Shortcuts
You can create desktop shortcuts for easy access:
1. Right-click on desktop
2. Select "New" → "Shortcut"
3. Enter: `cmd /k "cd /d C:\path\to\smart-research-tracker && pnpm run start:windows"`
4. Name it "Smart Research Tracker"

### Taskbar Pinning
Pin the application to your taskbar:
1. Start the application
2. Right-click the command prompt icon in taskbar
3. Select "Pin to taskbar"

### Windows Terminal Integration
If using Windows Terminal:
1. Open Windows Terminal
2. Go to Settings
3. Add a new profile for Smart Research Tracker
4. Set the command to: `cmd /k "cd /d C:\path\to\smart-research-tracker && pnpm run start:windows"`

## 🔒 Security Considerations

### Firewall Settings
The development server runs on localhost, but you may need to:
- Allow Node.js through Windows Firewall
- Allow the application port (5173) if needed

### Antivirus Configuration
- Add the project directory to exclusions
- Allow Node.js and pnpm processes
- Configure real-time protection appropriately

## 📊 Performance Tips

### Windows Optimization
1. **Disable unnecessary startup programs**
2. **Use SSD storage** if available
3. **Allocate sufficient RAM** (4GB+ recommended)
4. **Close other applications** when running

### Development Performance
1. **Use Windows Terminal** instead of cmd
2. **Enable Windows Subsystem for Linux (WSL)** for better performance
3. **Use VS Code** with integrated terminal
4. **Monitor Task Manager** for resource usage

## 🆘 Getting Help

### Documentation
- [Main README](../README.md) - General documentation
- [Error Handling Guide](error-handling-guide.md) - Troubleshooting errors
- [macOS Installation Guide](macos-installation.md) - For comparison

### Support
- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share tips
- **Wiki**: Community-maintained documentation

### Debug Information
When reporting issues, include:
- Windows version: `winver`
- Node.js version: `node --version`
- pnpm version: `pnpm --version`
- Error logs from the test script
- Screenshots of any error messages

---

**Happy researching on Windows! 🪟🚀** 