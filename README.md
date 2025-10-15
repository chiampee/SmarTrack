# 🧠 Smart Research Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)

> **Transform your research workflow with AI-powered organization and insights**

An intelligent research management system that combines a web dashboard with a Chrome extension to save, organize, and chat about your research links. Never lose track of important information again.

## 🎬 Demo

### Save Research Instantly
Right-click any webpage → "Save to Smart Research" → Done! ✨

### AI-Powered Insights
Ask questions like: *"What are the main arguments in my climate change research?"* and get intelligent answers from all your saved sources.

### Smart Organization
Automatically categorize, label, and search through your research collection with AI assistance.

## 📋 Table of Contents

- [✨ Why Smart Research Tracker?](#-why-smart-research-tracker)
- [🎬 See It In Action](#-see-it-in-action)
- [🚀 Features](#-features)
- [🚀 Get Started in 5 Minutes](#-get-started-in-5-minutes)
- [💡 Real-World Examples](#-real-world-examples)
- [🎯 How to Use](#-how-to-use)
- [📋 Manual Installation](#-manual-installation)
- [🛠️ Development](#️-development)
- [🚀 Deployment Options](#-deployment-options)
- [🔧 Troubleshooting](#-troubleshooting)
- [📚 Documentation](#-documentation)
- [🎉 Ready to Get Started?](#-ready-to-get-started)

## ✨ Why Smart Research Tracker?

**Stop losing valuable research!** Whether you're a student, researcher, journalist, or professional, this tool helps you:

- 🎯 **Save research instantly** - One-click saving from any webpage
- 🤖 **Get AI insights** - Ask questions about your saved research
- 📊 **Stay organized** - Smart categorization and search
- 💾 **Keep data private** - Everything stored locally on your device
- ⚡ **Work faster** - No more hunting through bookmarks or notes

## 🎬 See It In Action

### Perfect For:
- **📚 Students** - Organize research papers, articles, and study materials
- **🔬 Researchers** - Track sources, generate summaries, and find connections
- **📰 Journalists** - Manage sources, quotes, and background research
- **💼 Professionals** - Keep industry insights and competitive intelligence
- **🎨 Creatives** - Collect inspiration and reference materials

## 🚀 Features

- **📱 Chrome Extension** - Save research links with one click
- **🤖 AI Chat** - Ask questions about your saved research
- **📊 Dashboard** - Organize and manage your research collection
- **🔍 Smart Search** - Find relevant content using AI-powered vector search
- **📝 Auto-Summaries** - AI-generated TL;DR summaries for each link
- **🏷️ Organization** - Labels, priorities, and status management
- **💾 Local Storage** - Your data stays on your device
- **🔄 Cross-Reference** - Find connections between different sources
- **📈 Progress Tracking** - Monitor your research goals and tasks

## 🚀 Get Started in 5 Minutes

### 📥 Download & Install

**1. Clone the repository:**
```bash
git clone https://github.com/your-username/smart-research-tracker.git
cd smart-research-tracker
```

**2. Run the automated installer:**

**🪟 Windows:**
```cmd
scripts\install-new-computer.bat
```

**🍎 macOS:**
```bash
./scripts/install-new-computer.sh
```

**🐧 Linux:**
```bash
./scripts/install-new-computer.sh
```

### ✨ What the installer does:
- ✅ Checks system requirements (Node.js 18+)
- ✅ Installs dependencies automatically
- ✅ Builds the Chrome extension
- ✅ Sets up environment configuration
- ✅ Runs verification tests
- ✅ Provides next steps

### 🎯 After Installation:

1. **Install the Chrome Extension:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist-extension` folder

2. **Start the Dashboard:**
   ```bash
   pnpm dev
   ```
   Open `http://localhost:5174/`

3. **Start Researching:**
   - Right-click any webpage → "Save to Smart Research"
   - Ask questions about your saved links in the AI chat
   - Organize with labels and priorities

### 🎉 You're Ready!

**Need help?** Check our [detailed installation guide](docs/installation/MANUAL_INSTALLATION_GUIDE.md) or [troubleshooting section](#-troubleshooting).

## 💡 Real-World Examples

### 📚 Student Research Project
*"I'm writing a thesis on climate change. I save 50+ research papers and articles. With Smart Research Tracker, I can ask: 'What are the main arguments against carbon taxes?' and get insights from all my saved sources."*

### 🔬 Academic Researcher
*"I'm tracking the latest AI research. I save papers, blog posts, and conference talks. The AI chat helps me find connections between different approaches and identify research gaps."*

### 📰 Investigative Journalist
*"I'm working on a story about tech companies. I save news articles, SEC filings, and social media posts. The tool helps me cross-reference information and find patterns across sources."*

### 💼 Business Analyst
*"I'm researching competitors and market trends. I save industry reports, news articles, and company websites. The AI helps me synthesize insights and track changes over time."*

### 🎨 Creative Professional
*"I'm collecting inspiration for a design project. I save websites, articles, and images. The tool helps me organize ideas and find connections between different creative concepts."*

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

### 💾 Saving Research (3 Ways)
1. **Right-click** any webpage → "Save to Smart Research"
2. **Click the extension icon** in your browser toolbar
3. **Select text** and right-click → "Save selection to Smart Research"

### 🏷️ Organizing Your Collection
- **Add labels** like "important", "to-read", "research-paper"
- **Set priorities** (High, Medium, Low)
- **Mark status** (Active, Archived, In Progress)
- **Filter and sort** by any combination

### 🤖 AI-Powered Insights
- **Ask questions** about your saved research
- **Get summaries** of long articles automatically
- **Find connections** between different sources
- **Cross-reference** multiple links in one conversation

### 🔍 Smart Search
- **Search by content** - not just titles
- **Find related links** using AI similarity
- **Filter by date, labels, or status**
- **Quick access** with keyboard shortcuts

### 💬 Example AI Conversations
- *"What are the main themes in my climate change research?"*
- *"Compare the arguments in these three articles about AI ethics"*
- *"Summarize the key findings from my machine learning papers"*
- *"What sources do I have about renewable energy costs?"*

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

- **[Documentation Index](docs/README.md)** - Complete documentation overview
- **[Installation Guide](docs/installation/MANUAL_INSTALLATION_GUIDE.md)** - Complete step-by-step guide
- **[Quick Installation](docs/installation/INSTALLATION_README.md)** - Quick reference
- **[Installation Verification](docs/installation/INSTALLATION_VERIFICATION.md)** - Verification checklist
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - General troubleshooting guide

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

## 🎉 Ready to Get Started?

### 🚀 Quick Start
```bash
git clone https://github.com/your-username/smart-research-tracker.git
cd smart-research-tracker
scripts\install-new-computer.bat  # Windows
# or
./scripts/install-new-computer.sh  # macOS/Linux
```

### 📚 Learn More
- **[Complete Installation Guide](docs/installation/MANUAL_INSTALLATION_GUIDE.md)** - Step-by-step setup
- **[Windows Installation](docs/installation/windows-installation.md)** - Windows-specific guide
- **[macOS Installation](docs/installation/macos-installation.md)** - macOS-specific guide
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Common issues and solutions

### 🤝 Join the Community
- ⭐ **Star this repository** if you find it useful
- 🐛 **Report bugs** or request features
- 💡 **Share your use cases** and success stories
- 🔄 **Contribute** to make it even better

### 🔒 Privacy & Security
- **Your data stays local** - No cloud storage required
- **Open source** - Full transparency and control
- **Secure** - API keys stored locally, never shared

---

**Transform your research workflow today!** 🧠📚✨

*Stop losing valuable research. Start building your knowledge base with AI-powered insights.*