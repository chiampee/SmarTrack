# Smart Research Tracker - Manual Installation Guide

This guide will walk you through installing the Smart Research Tracker on a new computer from scratch.

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Chrome Browser** - [Download here](https://www.google.com/chrome/)
- **Git** (optional) - [Download here](https://git-scm.com/)
- **OpenAI API Key** - [Get one here](https://platform.openai.com/api-keys)

## Step 1: Download the Project

### Option A: Clone from Git (if available)
```bash
git clone <repository-url>
cd smart-research-tracker
```

### Option B: Download ZIP and Extract
1. Download the project ZIP file
2. Extract to a folder (e.g., `C:\smart-research-tracker` or `~/smart-research-tracker`)
3. Open terminal/command prompt in the project folder

## Step 2: Install Dependencies

### Install pnpm (recommended package manager)
```bash
npm install -g pnpm
```

### Install project dependencies
```bash
pnpm install
```

**Alternative with npm:**
```bash
npm install
```

## Step 3: Configure Environment Variables

### Create environment file
Create a file named `.env.local` in the project root with the following content:

```env
# Smart Research Tracker Configuration
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_OPENAI_EMBED_MODEL=text-embedding-3-small
```

### Get your OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with "sk-")
5. Replace `sk-your-openai-api-key-here` in `.env.local` with your actual key

## Step 4: Build the Browser Extension

### Build the extension
```bash
pnpm build:extension
```

### Copy required files to dist-extension
```bash
# On Windows (Command Prompt)
copy extension\manifest.json dist-extension\
copy extension\icon.svg dist-extension\
copy extension\options.html dist-extension\
copy extension\options.js dist-extension\
mkdir dist-extension\icons
copy extension\icon.svg dist-extension\icons\

# On macOS/Linux (Terminal)
cp extension/manifest.json dist-extension/
cp extension/icon.svg dist-extension/
cp extension/options.html dist-extension/
cp extension/options.js dist-extension/
mkdir -p dist-extension/icons
cp extension/icon.svg dist-extension/icons/
```

## Step 5: Install the Browser Extension

1. **Open Chrome** and navigate to `chrome://extensions/`
2. **Enable Developer Mode** (toggle in the top-right corner)
3. **Click "Load unpacked"**
4. **Navigate to** the `dist-extension` folder in your project
5. **Select the folder** and click "Select"
6. **Verify installation** - you should see "Smart Research Tracker" in your extensions list

## Step 6: Start the Development Server

### Start the dashboard
```bash
pnpm dev
```

**Alternative with npm:**
```bash
npm run dev
```

### Verify the server is running
- Open your browser and go to `http://localhost:5174/`
- You should see the Smart Research Tracker dashboard

## Step 7: Test the Installation

### Test the Extension
1. **Right-click** on any webpage
2. **Select "Save to Smart Research"** from the context menu
3. **Check the extension popup** by clicking the extension icon in Chrome toolbar

### Test the Dashboard
1. **Open** `http://localhost:5174/`
2. **Verify** you can see the dashboard interface
3. **Test saving a link** from the extension
4. **Check** if the link appears in the dashboard

### Test AI Chat
1. **Select some saved links** in the dashboard
2. **Click "Start AI Chat"**
3. **Send a message** and verify you get an AI response
4. **Close and reopen** the chat to test persistence

## Step 8: Production Deployment (Optional)

### Build for production
```bash
pnpm build
```

### Deploy to hosting service
The `dist/` folder contains the built web application that can be deployed to:
- **Vercel** (recommended)
- **Netlify**
- **GitHub Pages**
- **Any static hosting service**

## Troubleshooting

### Common Issues

#### 1. Extension won't load
- **Check** that all files are in the `dist-extension` folder
- **Verify** `manifest.json` exists and is valid
- **Ensure** Developer Mode is enabled in Chrome

#### 2. Dashboard won't start
- **Check** Node.js version (18+ required)
- **Verify** all dependencies are installed (`pnpm install`)
- **Check** for port conflicts (try `pnpm dev --port 3000`)

#### 3. API errors
- **Verify** your OpenAI API key in `.env.local`
- **Check** you have credits in your OpenAI account
- **Ensure** the API key has the correct permissions

#### 4. Database errors
- **Clear** browser data (IndexedDB)
- **Check** browser console for error messages
- **Restart** the development server

### Debug Mode

Enable debug logging by opening browser DevTools (F12) and checking the Console tab for detailed error messages.

## File Structure

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
├── .env.local            # Environment variables
├── package.json          # Dependencies and scripts
└── vite.config.ts        # Build configuration
```

## Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build web application |
| `pnpm build:extension` | Build browser extension |
| `pnpm test:chat` | Test chat functionality |
| `pnpm test:db` | Test database operations |
| `pnpm lint` | Run code linting |
| `pnpm setup` | Run setup wizard |

## Support

If you encounter issues:

1. **Check** the troubleshooting section above
2. **Review** browser console for error messages
3. **Verify** all prerequisites are installed
4. **Ensure** your OpenAI API key is valid and has credits

## Security Notes

- **Never commit** your `.env.local` file to version control
- **Keep your API keys** secure and private
- **Use environment variables** for production deployments
- **Regularly update** dependencies for security patches

---

**Installation Complete!** 🎉

Your Smart Research Tracker should now be fully functional. Start by saving some research links and testing the AI chat feature!
