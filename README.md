# Smart Research Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com)

A research management system with a web dashboard and Chrome extension for saving, organizing, and analyzing research links using AI.

## 🌐 Live Demo

**Try it now:** [https://your-app.vercel.app](https://your-app.vercel.app) *(Update with your Vercel URL after deployment)*

1. Visit the dashboard
2. Install the Chrome extension
3. Start organizing your research!

**No signup required** - Everything runs locally in your browser.

## Features

- **Chrome Extension** - Save web pages with one click
- **Web Dashboard** - Organize and manage your research collection
- **AI Chat** - Ask questions about your saved research
- **Auto-Summaries** - AI-generated summaries for each link
- **Smart Search** - Find content using AI-powered search
- **Local Storage** - All data stored locally using IndexedDB
- **Labels & Organization** - Categorize with labels, priorities, and status

## Installation

### Prerequisites

- Node.js 18+ - [Download here](https://nodejs.org/)
- Chrome Browser
- OpenAI API Key (optional, for AI features) - [Get one here](https://platform.openai.com/api-keys)

### Quick Install

**Windows:**
```cmd
git clone https://github.com/your-username/smart-research-tracker.git
cd smart-research-tracker
scripts\install-new-computer.bat
```

**macOS/Linux:**
```bash
git clone https://github.com/your-username/smart-research-tracker.git
cd smart-research-tracker
./scripts/install-new-computer.sh
```

The installer will:
- Check system requirements
- Install dependencies
- Build the Chrome extension
- Set up environment configuration
- Run verification tests

### Manual Install

1. **Install dependencies:**
   ```bash
   npm install -g pnpm
   pnpm install
   ```

2. **Configure environment:**
   Create `.env.local`:
   ```env
   VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
   VITE_OPENAI_MODEL=gpt-4o-mini
   VITE_OPENAI_EMBED_MODEL=text-embedding-3-small
   ```

3. **Build extension:**
   ```bash
   pnpm build:extension
   cp extension/manifest.json dist-extension/
   cp extension/icon.svg dist-extension/
   cp extension/options.html dist-extension/
   cp extension/options.js dist-extension/
   mkdir -p dist-extension/icons
   cp extension/icon.svg dist-extension/icons/
   ```

4. **Install Chrome extension:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `dist-extension` folder

5. **Start the application:**
   ```bash
   pnpm dev
   ```
   Open `http://localhost:5174/`

## Usage

### Saving Research
- Right-click any webpage → "Save to Smart Research"
- Click the extension icon in browser toolbar
- Select text and right-click → "Save selection to Smart Research"

### Organizing
- Add labels for categorization
- Set priorities (High, Medium, Low)
- Mark status (Active, Archived, In Progress)
- Filter and sort by any combination

### AI Chat
- Ask questions about your saved research
- Get automatic summaries of articles
- Find connections between different sources
- Cross-reference multiple links in conversations

### Search
- Search by content, not just titles
- Find related links using AI similarity
- Filter by date, labels, or status

## Project Structure

```
smart-research-tracker/
├── src/                    # Source code
│   ├── components/         # React components
│   ├── services/          # API services
│   ├── stores/            # State management
│   ├── db/                # Database layer
│   ├── pages/             # Application pages
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript types
├── extension/             # Browser extension source
├── dist-extension/        # Built extension (for Chrome)
├── dist/                  # Built web app (for deployment)
├── scripts/               # Installation and utility scripts
├── tools/                 # Development tools and utilities
│   ├── launchers/         # Application launchers
│   ├── debug/             # Debug and demo pages
│   └── tests/             # Test files and utilities
├── docs/                  # Documentation
├── assets/                # Static assets and releases
├── api/                   # API endpoints
├── backend/               # Backend services
└── tests/                 # Test suites
```

## Development

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

## Deployment

### Local Development
```bash
pnpm dev
# Access at http://localhost:5174/
```

### Static Hosting
```bash
pnpm build
# Upload dist/ folder to any static host
```

### Vercel
1. Import repository to Vercel
2. Deploy automatically
3. Set environment variables in Vercel dashboard

## Troubleshooting

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

## Documentation

- [Installation Guide](docs/installation/MANUAL_INSTALLATION_GUIDE.md) - Complete step-by-step guide
- [Windows Installation](docs/installation/windows-installation.md) - Windows-specific guide
- [macOS Installation](docs/installation/macos-installation.md) - macOS-specific guide
- [Troubleshooting](docs/TROUBLESHOOTING.md) - General troubleshooting guide

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test`
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Database**: Dexie (IndexedDB)
- **AI**: OpenAI GPT models
- **Extension**: Chrome Extension API