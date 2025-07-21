# Smart Research Tracker

<div align="center">

**Your AI-powered research companion** - Save web pages, get instant summaries, and chat with your research collection.

[🚀 Quick Start](#-quick-start) • [📖 Features](#-features) • [🛠️ Development](#️-development) • [🤝 Contributing](#-contributing)

</div>

---

## 📖 What is Smart Research Tracker?

Smart Research Tracker is your personal research assistant that helps you save, organize, and understand web content. Think of it as a smart bookmark manager that not only saves your favorite web pages but also summarizes them and lets you chat with your research collection.

### ✨ What makes it special?

- 🧠 **Smart Summaries** - Get instant summaries of any web page you save
- 💬 **Chat with Your Research** - Ask questions about your saved content
- 🔍 **Find Anything** - Search through all your research easily
- 🏷️ **Stay Organized** - Automatically categorize and organize your research
- 🔒 **Your Data, Your Control** - Everything stays on your device
- 🎯 **Easy to Use** - Simple setup and helpful guidance throughout

---

## 🚀 Get Started in 5 Minutes

### What you'll need

- A computer with Node.js installed (version 18 or higher)
- A web browser (Chrome works best)
- An OpenAI API key (optional, but needed for the smart features)

### Step-by-step setup

1. **Download the project**
   ```bash
   git clone <your-repo-url>
   cd smart-research-tracker
   ```

2. **Install the required software**
   ```bash
   pnpm install
   ```

3. **Add your AI key** (optional - skip this if you just want to try the basic features)
   
   Create a file called `.env.local` and add:
   ```env
   VITE_OPENAI_API_KEY=sk-your-openai-key-here
   ```
   
   Don't have an OpenAI key? [Get one here](https://platform.openai.com/api-keys) (it's free to start)

4. **Start the app**
   ```bash
   pnpm dev
   ```
   
   Open your browser and go to [http://localhost:5173](http://localhost:5173)

5. **Add the browser extension** (optional but recommended)
   ```bash
   pnpm run build:extension
   ```
   
   Then in Chrome:
   - Go to `chrome://extensions/`
   - Turn on "Developer mode"
   - Click "Load unpacked"
   - Select the `dist-extension/` folder

---

## 📖 What can you do with it?

### 🧠 Smart Research Assistant

- **Get instant summaries** of any web page you save
- **Chat with your research** - ask questions about your saved content
- **Find related information** across all your saved pages
- **See what the AI knows** about each page you've saved

### 📚 Keep Everything Organized

- **Auto-categorize** your research by topic or project
- **Drag and drop** to organize your research boards
- **Multiple views** - see your research as boards, lists, or grids
- **Bulk actions** - work with multiple pages at once

### 🔒 Your Data, Your Control

- **Everything stays on your device** - no cloud storage required
- **Your research is private** - we can't see your data
- **AI is optional** - use it only when you want summaries
- **Easy backup** - export your data whenever you want

### 🎯 Designed for You

- **Simple setup** - get started in minutes
- **Helpful guidance** - tips and hints as you use the app
- **Easy to use** - intuitive interface that just works
- **Keyboard shortcuts** - power users can work faster

---

## 🛠️ For Developers

### Quick commands

```bash
pnpm dev          # Start the app for development
pnpm build        # Build for production
pnpm preview      # Preview the production build
pnpm test         # Run tests
pnpm test:watch   # Run tests and watch for changes
pnpm lint         # Check code quality
pnpm lint:fix     # Fix code formatting issues
pnpm e2e          # Run end-to-end tests
```

### How the code is organized

```
src/
├── components/          # All the UI components
│   ├── ai/             # AI-related features
│   ├── boards/         # Research board management
│   ├── links/          # Link and page management
│   ├── layout/         # Page layout components
│   └── ui/             # Reusable UI elements
├── pages/              # Main app pages
├── services/           # Business logic and API calls
├── stores/             # Data management (Zustand)
├── types/              # TypeScript type definitions
├── utils/              # Helper functions
└── db/                 # Database setup

extension/              # Browser extension code
api/                   # Backend API functions
tests/                 # Test files
```

### What we use to build this

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Headless UI
- **Data Management**: Zustand
- **Database**: Dexie (for local storage)
- **AI**: OpenAI API, with Mistral as backup
- **Testing**: Vitest, Playwright
- **Code Quality**: ESLint, Prettier

### Configuration options

| Setting | What it does | Required? | Default |
|---------|-------------|-----------|---------|
| `VITE_OPENAI_API_KEY` | Your OpenAI API key | Yes (for AI features) | - |
| `VITE_OPENAI_MODEL` | Which AI model to use | No | `gpt-4.5-preview` |
| `VITE_OPENAI_EMBED_MODEL` | Model for search features | No | `text-embedding-3-small` |
| `VITE_MISTRAL_API_KEY` | Backup AI provider | No | - |

---

## 🤝 Want to help?

We'd love your help making Smart Research Tracker even better! Here's how you can contribute:

### How to get started

1. **Fork this project** (click the fork button on GitHub)
2. **Download your copy**
   ```bash
   git clone https://github.com/your-username/smart-research-tracker.git
   cd smart-research-tracker
   ```
3. **Create a new branch** for your changes
   ```bash
   git checkout -b feature/your-awesome-idea
   ```
4. **Set up the project**
   ```bash
   pnpm install
   ```
5. **Make your changes** and test them
6. **Check everything works**
   ```bash
   pnpm lint && pnpm test
   ```
7. **Save your changes**
   ```bash
   git commit -m "feat: add your awesome feature"
   ```
8. **Share your work**
   ```bash
   git push origin feature/your-awesome-idea
   ```
9. **Create a pull request** on GitHub

### What we're looking for

- **Bug fixes** - help us squash those pesky bugs
- **New features** - add something cool and useful
- **Documentation** - make things clearer for everyone
- **UI improvements** - make it look and feel better
- **Performance** - make it faster and more efficient

### Our coding standards

- Write clear, readable code
- Add tests for new features
- Follow our existing code style
- Make sure it works for everyone (accessibility)
- Write helpful commit messages

---

## 🐛 Having trouble?

### Common problems and solutions

**The AI features aren't working**
- Make sure your OpenAI API key is correct
- Check if you have enough credits in your OpenAI account
- Look at the browser console for error messages

**The browser extension won't save pages**
- Make sure you've loaded the extension in Chrome
- Check that the app is running on localhost:5173
- Try refreshing the page you're trying to save

**The app won't build or start**
- Try deleting `node_modules` and reinstalling: `rm -rf node_modules pnpm-lock.yaml && pnpm install`
- Check for TypeScript errors: `pnpm tsc --noEmit`
- Make sure all the required software is installed

**The app is slow or not working well**
- Check the browser console for error messages
- Try clearing your browser cache and storage
- Make sure you have enough disk space

---


## 📄 License

This project is free to use under the MIT License - see the [LICENSE](LICENSE) file for the full details.

---

## 🙏 Thanks

- Built for researchers, students, and anyone who loves learning
- Inspired by the need for better ways to organize research
- Made possible by the amazing open source community

---

<div align="center">

**Made with ❤️ for curious minds everywhere**

[⭐ Star this repo](https://github.com/your-username/smart-research-tracker) • [🐛 Report issues](https://github.com/your-username/smart-research-tracker/issues) • [💬 Join the discussion](https://github.com/your-username/smart-research-tracker/discussions)

</div>
