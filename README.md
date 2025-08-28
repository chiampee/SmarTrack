# Smart Research Tracker 🧠

A powerful browser extension and web dashboard for saving, organizing, and analyzing research links with AI-powered insights.

![Smart Research Tracker](https://img.shields.io/badge/Version-1.1.0-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-orange) ![Status](https://img.shields.io/badge/Status-Stable-green)

## Start here (60 seconds)

1) Build and open the dashboard
- macOS/Linux:
```bash
pnpm install && pnpm build && open dist/index.html
```
- Windows (PowerShell):
```powershell
npm install; npm run build; start dist\index.html
```

2) Load the Chrome extension
- Visit `chrome://extensions` → enable Developer mode → "Load unpacked" → select the `extension/` folder
- In extension Details, enable "Allow access to file URLs"

3) Point the extension to your dashboard
- Click the extension → gear (⚙️) → set Dashboard URL:
  - macOS/Linux: `file:///ABSOLUTE/PATH/TO/dist/index.html`
  - Windows: `file:///C:/ABSOLUTE/PATH/TO/dist/index.html`

4) Optional: enable AI chat
- In the dashboard → Settings → toggle "Use my OpenAI API key" → paste your key

Done. Click the extension on any page → Save to Research → open Dashboard.

### Pick one install path
- Local file (no hosting): use the steps above. Fastest way to start.
- Vercel (optional): import repo → deploy → set Dashboard URL to your Vercel URL.

### Troubleshooting (quick)
- Dashboard won’t open: check the Dashboard URL (must be file:///…/dist/index.html or your https URL).
- Chat not working: in Dashboard → Settings, enable “Use my OpenAI API key” and paste your key.
- Extension can’t access local file: in chrome://extensions, enable “Allow access to file URLs”.

## ✨ Features

- 🔗 **Smart Link Saving** - Save web pages with automatic metadata extraction
- 🏷️ **Intelligent Labeling** - Organize links with custom labels and categories
- 🤖 **AI-Powered Analysis** - Get automatic summaries and insights using multiple AI providers
- 💬 **Advanced AI Chat** - Interactive chat interface with conversation history and context management
- 📊 **Real-time Dashboard** - Beautiful web interface for managing your research
- 🔄 **Seamless Sync** - Extension and dashboard work together seamlessly
- 💾 **Resilient Storage** - Extension-first storage with IndexedDB fallback
- 🚀 **One-click Export** - Export to ChatGPT format with a single click
- 🎯 **Smart Context Management** - AI remembers conversation history and link context
- 🔧 **Robust Error Handling** - Comprehensive error recovery and user-friendly messages

## 🆕 Recent Updates (v1.2.0)

### ✅ **Fixed/Improved**
- Extension context errors: hardened content script and background messaging
- Invalid URL patterns fixed for localhost dashboards
- IndexedDB resilience: lazy init + graceful fallbacks when blocked

### 🚀 **New/Changed**
- Duplicate detection before save with a confirmation flow
- Badge logic uses displayed links reported by tabs (no false positives)
- Content script simplified (no IndexedDB) and uses safe cached storage
- Add Link is now available only from Quick Actions in the sidebar

## 🚀 Quick Start (2 minutes)

1) Deploy the dashboard (Vercel)
- Import or fork this repo in `vercel.com` and deploy. No changes needed; `vercel.json` is configured.
- Optional env vars (server-side only): `TOGETHER_API_KEY`, `GROQ_API_KEY`, `FIREWORKS_API_KEY`.
- Do not set any `VITE_*` keys unless you explicitly want client-side access.

2) Install the Chrome extension
- Go to `chrome://extensions` → enable Developer mode → "Load unpacked" → select the `extension/` folder.
- In the popup (⚙️), set Dashboard URL to your Vercel URL, e.g. `https://YOUR-APP.vercel.app`.

3) Use it
- Click the extension on any page → Save to Research.
- Open "Dashboard" from the popup to manage and chat.

Optional: Local development
- `pnpm install` → `pnpm dev` → open `http://localhost:5173`.
- In the extension settings, set Dashboard URL to `http://localhost:5173`.

## 🛠️ Installation

Prerequisites
- Node.js 18+ (recommended), pnpm or npm, Chrome/Chromium

Option A — Local file (no hosting)
- Build: macOS/Linux `pnpm install && pnpm build && open dist/index.html`; Windows `npm install && npm run build && start dist\index.html`
- Load the extension: `chrome://extensions` → enable Developer mode → "Load unpacked" → select the `extension/` folder
- In extension Details, enable "Allow access to file URLs"
- In the popup (⚙️), set Dashboard URL to your file path, e.g.:
  - macOS/Linux: `file:///ABSOLUTE/PATH/TO/dist/index.html`
  - Windows: `file:///C:/ABSOLUTE/PATH/TO/dist/index.html`
- AI chat: open Dashboard → Settings → enable "Use my OpenAI API key" and paste your key

Option B — Static hosting (GitHub Pages/Cloudflare/Netlify/etc.)
- Build: `pnpm build`
- Deploy the `dist/` folder to any static host
- In the extension popup (⚙️), set Dashboard URL to your site URL (e.g. `https://your-site.example`)
- AI chat: users can add their own OpenAI key in Dashboard Settings; no server needed

Option C — Vercel (serverless, optional)
- Import the repo to Vercel and deploy (uses `vercel.json`)
- Optional server-only providers: set `TOGETHER_API_KEY`, `GROQ_API_KEY`, `FIREWORKS_API_KEY` in Vercel env
- Do not set any `VITE_*` keys unless you want client-side access
- The dashboard will use `/api/chat` automatically when deployed

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

1. Open the dashboard at your deployed URL or `http://localhost:5173` (dev)
2. **Add Link** from the sidebar under **Quick Actions** (this is the only place with the Add Link button)
3. **View your saved links** in a clean, filterable list
4. **Filter and search** by labels, status, or text
5. **Start AI chat** with selected links for analysis
6. **Export to ChatGPT** format for further processing

> Note: Most saves should be done via the browser extension. The in-app Add Link is intentionally scoped to Quick Actions for a cleaner UI.

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
│       (MV3 service worker + ready/handshake messaging; extension-first storage)
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

### Environment (optional)
- Server-side (recommended): set on Vercel – `TOGETHER_API_KEY`, `GROQ_API_KEY`, `FIREWORKS_API_KEY`.
- Client-side `VITE_*` keys are not required; the app defaults to the serverless `/api/chat`.

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

- [User Guide](docs/user-guide.md) - Complete user documentation and usage instructions
- [Extension Architecture](docs/extension-architecture.md) - Technical architecture and implementation details
- [Duplicate Detection System](docs/duplicate-detection-system.md) - How duplicate detection works
- [New Badge Logic](docs/new-badge-logic.md) - Stuck links detection and badge system
- [Error Handling Guide](docs/error-handling-guide.md) - Comprehensive error handling documentation
- [Chat Troubleshooting](docs/chat-troubleshooting.md) - Chat functionality troubleshooting
- [Database Schema](docs/database-schema.md) - IndexedDB (Dexie) tables, indexes, and migrations
- [Troubleshooting Guide](TROUBLESHOOTING.md) - Common issues and solutions
- Test Page (local): open `test-extension.html` in your repo or dev server
- [Test Page (local dev)](http://localhost:5173/test-extension.html) - Diagnostic tools

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
