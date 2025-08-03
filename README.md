# Smart Research Tracker

<div align="center">

**Your AI-powered research companion** - Save web pages, get instant summaries, and chat with your research collection.

[🚀 Quick Start](#-quick-start) • [📖 Features](#-features) • [🔧 Setup](#-setup) • [🛠️ Development](#️-development) • [🤝 Contributing](#-contributing)

</div>

---

## 📖 Overview

Smart Research Tracker is a comprehensive research management tool that combines the power of AI with intuitive organization. It helps you save, summarize, and interact with web content through an intelligent browser extension and web dashboard.

### ✨ Key Features

- 🧠 **AI-Powered Summaries** - Get instant, intelligent summaries of any web page
- 💬 **Research Chat** - Ask questions about your saved content and get AI-powered answers
- 🔍 **Smart Search** - Find information across your entire research collection
- 🏷️ **Intelligent Organization** - Auto-categorize and organize research by topics
- 🔒 **Privacy-First** - All data stays on your device, no cloud storage required
- 🎯 **Browser Extension** - Save pages with one click from any website
- 📊 **Multiple Views** - Boards, lists, and grid views for different workflows

### 🎯 Perfect For

- **Researchers** - Organize academic papers and research findings
- **Students** - Collect and summarize study materials
- **Content Creators** - Gather inspiration and reference materials
- **Professionals** - Build knowledge bases and research repositories
- **Data Analysts** - Export and analyze research data in bulk
- **Anyone** - Who wants to save and understand web content better

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download here](https://nodejs.org/))
- **Modern browser** (Chrome, Firefox, Safari, Edge)
- **OpenAI API key** (optional, for AI features)

### Installation Options

#### Option 1: One-Command Install (Recommended)

**macOS/Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/your-repo/main/install.sh | bash
```

**Windows:**
```cmd
powershell -ExecutionPolicy Bypass -File install.ps1
```

#### Option 2: Manual Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/smart-research-tracker.git
cd smart-research-tracker

# 2. Run the interactive setup
pnpm setup

# 3. Install dependencies
pnpm install

# 4. Start the application
pnpm build && pnpm preview
```

### First-Time Setup

1. **Configure AI Features** (Optional):
   - Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - The setup wizard will guide you through configuration with automatic file generation
   - AI features work without the key, but with limited functionality

2. **Install Browser Extension**:
   ```bash
   pnpm build:extension
   ```
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist-extension/` folder

3. **Access the Dashboard**:
   - Open [http://localhost:4173](http://localhost:4173) in your browser
   - Start saving pages using the browser extension

4. **Try Advanced Features**:
   - Select multiple links to see bulk actions
   - Right-click on links for context menus
   - Use the "Copy Info" button to export raw data
   - Customize table columns and layout
