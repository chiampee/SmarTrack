# Smart Research Tracker - Installation Guide

## Quick Start (Automated)

### For macOS/Linux:
```bash
./scripts/install-new-computer.sh
```

### For Windows:
```cmd
scripts\install-new-computer.bat
```

## Manual Installation

### Prerequisites
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Chrome Browser** - [Download](https://www.google.com/chrome/)
- **OpenAI API Key** - [Get one](https://platform.openai.com/api-keys)

### Step-by-Step Manual Installation

#### 1. Download Project
```bash
# Clone or download the project
git clone <repository-url>
cd smart-research-tracker
```

#### 2. Install Dependencies
```bash
# Install pnpm (recommended)
npm install -g pnpm

# Install project dependencies
pnpm install
```

#### 3. Configure Environment
Create `.env.local` file:
```env
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_OPENAI_EMBED_MODEL=text-embedding-3-small
```

#### 4. Build Extension
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

#### 5. Install Extension in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `dist-extension` folder

#### 6. Start Dashboard
```bash
pnpm dev
```

Open `http://localhost:5174/`

## Verification

### Test Extension
- Right-click on any webpage
- Select "Save to Smart Research"
- Check extension popup

### Test Dashboard
- Open `http://localhost:5174/`
- Verify saved links appear
- Test AI chat functionality

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Extension won't load | Check all files in `dist-extension/` folder |
| Dashboard won't start | Verify Node.js 18+ and run `pnpm install` |
| API errors | Check OpenAI API key in `.env.local` |
| Database errors | Clear browser data and restart server |

### Debug Mode
Open browser DevTools (F12) → Console tab for detailed error messages.

## File Structure

```
smart-research-tracker/
├── src/                    # Source code
├── extension/             # Browser extension source
├── dist-extension/        # Built extension (for Chrome)
├── dist/                  # Built web app
├── .env.local            # Environment variables
├── scripts/              # Installation scripts
└── MANUAL_INSTALLATION_GUIDE.md  # Detailed guide
```

## Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build web application |
| `pnpm build:extension` | Build browser extension |
| `pnpm test:chat` | Test chat functionality |
| `pnpm test:db` | Test database operations |

## Support

For detailed troubleshooting, see `MANUAL_INSTALLATION_GUIDE.md`

---

**Ready to research!** 🔬📚
