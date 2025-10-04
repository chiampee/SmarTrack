# Smart Research Tracker

An AI-powered research management system that combines a web dashboard with a Chrome extension to save, organize, and chat about your research links.

## 🚀 Features

- **📱 Chrome Extension** - Save research links with one click
- **🤖 AI Chat** - Ask questions about your saved research
- **📊 Dashboard** - Organize and manage your research collection
- **🔍 Smart Search** - Find relevant content using AI-powered vector search
- **📝 Auto-Summaries** - AI-generated TL;DR summaries for each link
- **🏷️ Organization** - Labels, priorities, and status management
- **💾 Local Storage** - Your data stays on your device

## ⚡ Quick Start (Automated Installation)

### For New Computers

**Linux/macOS:**
```bash
git clone <repository-url>
cd smart-research-tracker
./scripts/install-new-computer.sh
```

**Windows:**
```cmd
git clone <repository-url>
cd smart-research-tracker
scripts\install-new-computer.bat
```

The automated scripts will:
- ✅ Check system requirements
- ✅ Install dependencies
- ✅ Build the extension
- ✅ Set up environment
- ✅ Run verification tests
- ✅ Provide next steps

## 📋 Manual Installation

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Chrome Browser** - [Download here](https://www.google.com/chrome/)
- **OpenAI API Key** - [Get one here](https://platform.openai.com/api-keys)

### Step 1: Install Dependencies

```bash
# Install pnpm (recommended)
npm install -g pnpm

# Install project dependencies
pnpm install
```

### Step 2: Configure Environment

Create `.env.local` file:
```env
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_OPENAI_EMBED_MODEL=text-embedding-3-small
```

### Step 3: Build Extension

```bash
pnpm build:extension

# Copy required files
cp extension/manifest.json dist-extension/
cp extension/icon.svg dist-extension/
cp extension/options.html dist-extension/
cp extension/options.js dist-extension/
mkdir -p dist-extension/icons
cp extension/icon.svg dist-extension/icons/
```

### Step 4: Install Extension in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `dist-extension` folder

### Step 5: Start Dashboard

```bash
pnpm dev
```

Open `http://localhost:5174/`

## 🎯 How to Use

### Saving Research
- **Right-click** on any webpage → "Save to Smart Research"
- **Extension popup** for quick saves
- **Context menu** for selected text

### Organizing Research
- **Filter** by status (Active/Archived)
- **Sort** by labels, date, priority
- **Search** through titles and URLs
- **Labels** for categorization

### AI Chat Features
- **Context-aware** responses using your saved research
- **Conversation history** that persists
- **Multiple link support** for cross-reference analysis
- **Custom prompts** for specific research needs

## 📁 Project Structure

```
smart-research-tracker/
├── src/                    # Source code
│   ├── components/         # React components
│   ├── services/          # API services
│   ├── stores/            # State management
│   ├── db/                # Database layer
│   └── types/             # TypeScript types
├── extension/             # Browser extension source
├── dist-extension/        # Built extension (for Chrome)
├── dist/                  # Built web app (for deployment)
├── scripts/               # Installation and utility scripts
├── docs/                  # Documentation
└── .env.local            # Environment variables
```

## 🛠️ Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build web application |
| `pnpm build:extension` | Build browser extension |
| `pnpm test:db` | Test database operations |
| `pnpm test:chat` | Test chat functionality |
| `pnpm lint` | Run code linting |

### Testing

```bash
# Test database functionality
pnpm test:db

# Test chat functionality
pnpm test:chat

# Run all tests
pnpm test
```

## 🚀 Deployment Options

### Local Development
- Use `pnpm dev` for development
- Access at `http://localhost:5174/`

### Static Hosting
```bash
pnpm build
# Upload dist/ folder to any static host
```

### Vercel (Recommended)
1. Import repository to Vercel
2. Deploy automatically
3. Set environment variables in Vercel dashboard

## 🔧 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Extension won't load | Check all files in `dist-extension/` folder |
| Dashboard won't start | Verify Node.js 18+ and run `pnpm install` |
| API errors | Check OpenAI API key in `.env.local` |
| Database errors | Clear browser data and restart server |
| Build errors | Use Node.js 18+ and reinstall dependencies |

### Debug Mode
Open browser DevTools (F12) → Console tab for detailed error messages.

### Getting Help
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify all prerequisites are installed
4. Ensure your OpenAI API key is valid and has credits

## 📚 Documentation

- **[Manual Installation Guide](MANUAL_INSTALLATION_GUIDE.md)** - Complete step-by-step guide
- **[Installation README](INSTALLATION_README.md)** - Quick reference
- **[Installation Verification](INSTALLATION_VERIFICATION.md)** - Verification checklist

## 🔒 Security

- **Never commit** your `.env.local` file to version control
- **Keep your API keys** secure and private
- **Use environment variables** for production deployments
- **Regularly update** dependencies for security patches

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test`
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React, TypeScript, and Vite
- Uses Dexie for local database management
- Powered by OpenAI GPT models
- Chrome Extension API for browser integration

---

**Ready to revolutionize your research workflow!** 🔬📚

For detailed installation instructions, see [MANUAL_INSTALLATION_GUIDE.md](MANUAL_INSTALLATION_GUIDE.md)