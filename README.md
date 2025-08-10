# Smart Research Tracker 🧠

A powerful browser extension and web dashboard for saving, organizing, and analyzing research links with AI-powered insights.

![Smart Research Tracker](https://img.shields.io/badge/Version-1.1.0-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-orange) ![Status](https://img.shields.io/badge/Status-Stable-green)

## ✨ Features

- 🔗 **Smart Link Saving** - Save web pages with automatic metadata extraction
- 🏷️ **Intelligent Labeling** - Organize links with custom labels and categories
- 🤖 **AI-Powered Analysis** - Get automatic summaries and insights using multiple AI providers
- 💬 **Advanced AI Chat** - Interactive chat interface with conversation history and context management
- 📊 **Real-time Dashboard** - Beautiful web interface for managing your research
- 🔄 **Seamless Sync** - Extension and dashboard work together seamlessly
- 📱 **Offline Support** - Works fully offline with local IndexedDB storage
- 🚀 **One-click Export** - Export to ChatGPT format with a single click
- 🎯 **Smart Context Management** - AI remembers conversation history and link context
- 🔧 **Robust Error Handling** - Comprehensive error recovery and user-friendly messages

## 🆕 Recent Updates (v1.1.0)

### ✅ **Fixed Issues**
- **Chat Functionality** - Completely resolved infinite re-render issues
- **Button Interactions** - Clear Chat, New Chat, and Quick Prompts now work perfectly
- **Conversation Management** - Proper conversation history persistence and context building
- **State Management** - Stable component rendering and state updates
- **WebSocket Connections** - Fixed Vite development server connection issues

### 🚀 **New Features**
- **Enhanced Chat Interface** - Improved conversation flow and user experience
- **Better Error Recovery** - Automatic retry mechanisms and fallback options
- **Debugging Tools** - Comprehensive logging for troubleshooting
- **Performance Optimizations** - Reduced unnecessary re-renders and improved responsiveness

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **pnpm** (recommended) or npm
- **Chrome/Chromium browser**

#### macOS Users
- **Homebrew** (automatically installed if missing)
- **Apple Silicon Macs**: Automatic ARM64 support
- **Intel Macs**: Full compatibility
- **📖 Detailed guide**: [macOS Installation Guide](docs/macos-installation.md)

#### Windows Users
- **Windows 10/11** (64-bit recommended)
- **Node.js v16+** from [nodejs.org](https://nodejs.org/)
- **Chrome/Edge browser** for extension
- **📖 Detailed guide**: [Windows Installation Guide](docs/windows-installation.md)

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/smart-research-tracker.git
cd smart-research-tracker

# Quick installation (recommended)
# For macOS (with Homebrew and optimizations):
pnpm run setup:mac

# For other Unix systems (Linux, etc.):
pnpm run setup

# For Windows:
scripts\install.bat

# Manual installation (if scripts don't work):
pnpm install
# or
npm install
```

> **Note**: The installation scripts will automatically:
> - Check for Node.js v16+ and install if needed
> - Install pnpm package manager
> - Install project dependencies
> - Create a `.env.local` file for API keys

### 2. Start the Development Server

```bash
# Start the development server
pnpm dev
# or
npm run dev

# macOS users can also use:
pnpm run start:mac
```

The dashboard will be available at: **http://localhost:5173**

> **Note**: The development server will automatically reload when you make changes to the code.

### 3. Install the Browser Extension

#### Method 1: Load Unpacked Extension (Recommended for Development)

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Enable **"Developer mode"** (toggle in top-right)

2. **Load the Extension**
   - Click **"Load unpacked"**
   - Select the `extension/` folder from this project
   - The extension should appear in your extensions list

3. **Verify Installation**
   - Look for "Smart Research Tracker" in your extensions
   - The extension icon should appear in your browser toolbar

#### Method 2: Build & Install (Production)

```bash
# Build the extension
pnpm build:extension
# or
npm run build:extension

# Then load the built extension from the dist/extension folder
```

### 4. Configure API Keys (Optional)

For AI features, you can optionally set up API keys:

1. **Open the Dashboard** at http://localhost:5173
2. **Go to Settings** (gear icon) or use the diagnostic modal
3. **Add your API keys**:
   - OpenAI API Key (for GPT-4 summaries)
   - Mistral API Key (alternative AI provider)
   - Together AI Key (another alternative)
   - Or use the built-in free AI providers

> **Note**: The app works without API keys using free AI providers!
> 
> **Quick Setup**: Run `pnpm run setup:env` to quickly configure your OpenAI API key.

### 🍎 macOS-Specific Features

If you used `pnpm run setup:mac`, you get additional macOS features:

- **Homebrew Integration**: Automatic package management
- **Chrome Detection**: Automatic browser detection
- **Desktop Shortcut**: Optional desktop launcher
- **Application Bundle**: Optional native app experience
- **Apple Silicon Support**: Optimized for M1/M2 Macs

### 🪟 Windows-Specific Features

If you used `scripts\install.bat`, you get additional Windows features:

- **Automatic Node.js Detection**: Checks and guides installation
- **pnpm Auto-Install**: Installs pnpm if missing
- **Environment Setup**: Creates .env.local automatically
- **Desktop Shortcuts**: Optional desktop launcher
- **Windows Terminal Integration**: Better command line experience

## 📖 Usage Guide

### Saving Links with the Extension

1. **Navigate to any webpage** you want to save
2. **Click the extension icon** in your browser toolbar
3. **Fill in the details**:
   - Title (auto-filled from page)
   - Description (auto-extracted)
   - Labels (organize your research)
   - Priority (low/medium/high)
4. **Click "Save Link"** - it's automatically saved to your dashboard!

### Using the Dashboard

1. **Open the dashboard** at http://localhost:5173
2. **View your saved links** in a beautiful table format
3. **Filter and search** by labels, status, or text
4. **Start AI chat** with selected links for analysis
5. **Export to ChatGPT** format for further processing

### AI Chat Features

- **🎯 Smart Context**: AI remembers your conversation history and link context
- **🔄 Clear Chat**: Clear messages while keeping the same conversation
- **🆕 New Chat**: Start fresh conversations with new context
- **⚡ Quick Prompts**: Pre-defined questions for common research tasks
- **💾 Conversation History**: All conversations are automatically saved
- **🔍 Link Analysis**: AI analyzes selected links and provides insights

## 🛠️ Development

### Project Structure

```
smart-research-tracker/
├── src/                    # React dashboard source
│   ├── components/         # React components
│   │   ├── ai/            # AI chat components
│   │   ├── boards/        # Board management
│   │   ├── links/         # Link management
│   │   └── tasks/         # Task management
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── stores/            # State management
│   └── db/                # Database configuration
├── extension/             # Browser extension
│   ├── manifest.json      # Extension manifest
│   ├── popup.js          # Extension popup
│   ├── background.js     # Background script
│   └── contentScript.js  # Content script
├── api/                   # Serverless API functions
├── docs/                  # Documentation
├── scripts/               # Setup and utility scripts
└── public/               # Static assets
```

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm preview          # Preview production build

# Extension
pnpm build:extension  # Build extension for production
pnpm test:extension   # Test extension functionality

# Testing & Debugging
pnpm test:install     # Test complete installation
pnpm test:errors      # Test error handling system
pnpm test:windows     # Test Windows installation
pnpm test:chat        # Test chat functionality
pnpm test:db          # Test database operations

# Database
pnpm db:reset         # Reset database (development only)
```

### Environment Variables

Create a `.env.local` file for API keys:

```env
# OpenAI (optional)
VITE_OPENAI_API_KEY=your_openai_key_here

# Mistral (optional)
VITE_MISTRAL_API_KEY=your_mistral_key_here

# Together AI (optional)
VITE_TOGETHER_API_KEY=your_together_key_here

# Groq (optional)
VITE_GROQ_API_KEY=your_groq_key_here

# Fireworks AI (optional)
VITE_FIREWORKS_API_KEY=your_fireworks_key_here
```

## 🔧 Error Handling & Troubleshooting

Smart Research Tracker includes a comprehensive error handling system with user-friendly messages and automatic recovery.

### Error Categories

- **Network Errors** - Connection issues, timeouts, API limits
- **Database Errors** - Storage issues, initialization failures
- **Extension Errors** - Missing extension, permission issues
- **AI Service Errors** - Service unavailable, quota exceeded
- **System Errors** - Memory issues, browser compatibility

### Quick Fixes

**Extension Not Working?**
- Go to `chrome://extensions/` and reload the extension
- Check console for error messages
- Grant required permissions

**Dashboard Not Loading?**
- Ensure server is running: `pnpm dev`
- Check URL: http://localhost:5173
- Clear browser cache

**Chat Not Working?**
- Check API keys in settings
- Use free AI providers as fallback
- Verify internet connection
- Check console for debugging information

**Data Not Syncing?**
- Test extension: http://localhost:5173/test-extension.html
- Check browser console for errors

### Error Handling Features

- ✅ **User-friendly messages** with actionable suggestions
- ✅ **Automatic error categorization** by severity
- ✅ **Retry mechanisms** for recoverable errors
- ✅ **Visual notifications** with proper styling
- ✅ **Error logging** for debugging
- ✅ **Fallback options** for AI services

### Documentation

- [Error Handling Guide](docs/error-handling-guide.md) - Comprehensive error handling documentation
- [Chat Troubleshooting](docs/chat-troubleshooting.md) - Chat functionality troubleshooting
- [Button Fixes Summary](docs/button-fixes-summary.md) - Recent UI improvements
- [Troubleshooting Guide](TROUBLESHOOTING.md) - Common issues and solutions
- [Test Page](http://localhost:5173/test-extension.html) - Diagnostic tools

## 🧪 Testing

### Automated Tests

```bash
# Run all tests
pnpm test

# Test specific functionality
pnpm test:chat        # Test chat functionality
pnpm test:db          # Test database operations
pnpm test:extension   # Test extension functionality
```

### Manual Testing

1. **Chat Functionality Test**:
   - Open chat with selected links
   - Test Clear Chat button
   - Test New Chat button
   - Test Quick Prompts
   - Verify conversation history

2. **Extension Test**:
   - Save links from different websites
   - Verify metadata extraction
   - Test sync with dashboard

3. **Error Handling Test**:
   - Test with no internet connection
   - Test with invalid API keys
   - Verify error messages and recovery

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- **Follow TypeScript best practices**
- **Add comprehensive error handling**
- **Include debugging logs for troubleshooting**
- **Test on both macOS and Windows**
- **Update documentation for new features**

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/) and [Vite](https://vitejs.dev/)
- Database powered by [Dexie.js](https://dexie.org/)
- AI features powered by [OpenAI](https://openai.com/) and other providers
- Icons from [Lucide](https://lucide.dev/)
- State management with [Zustand](https://github.com/pmndrs/zustand)

---

**Made with ❤️ for researchers and knowledge workers**

**Version 1.1.0** - Enhanced chat functionality with robust error handling and improved user experience.
