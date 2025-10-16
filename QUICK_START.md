# ⚡ Quick Start Guide

Get Smart Research Tracker running in 3 simple steps!

---

## 🎯 For Users (Just Want to Use It)

### Step 1: Visit the App
Go to: **[https://smart-research-tracker.vercel.app](https://smart-research-tracker.vercel.app)**

### Step 2: Install Extension
Download from [Chrome Web Store](#) *(coming soon)*

Or install manually:
1. Download [latest release](https://github.com/chiampee/SmarTrack/releases)
2. Unzip the file
3. Go to `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked"
6. Select the unzipped folder

### Step 3: Start Saving!
1. Visit any webpage
2. Click the extension icon
3. Click "Save Link"
4. View in dashboard!

**That's it!** 🎉

---

## 👨‍💻 For Developers (Want to Deploy Your Own)

### Option 1: Deploy to Vercel (Recommended)

**Time:** 5 minutes | **Cost:** Free | **No CLI needed**

1. **Fork the repo** on GitHub
2. **Visit** [vercel.com/new](https://vercel.com/new)
3. **Import** your forked repository
4. **Click "Deploy"** (auto-configured!)
5. **Done!** Your app is live at `https://your-app.vercel.app`

**Full guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

### Option 2: Run Locally (Development)

**Time:** 10 minutes | **Requirements:** Node.js 18+, Chrome

```bash
# Clone the repository
git clone https://github.com/chiampee/SmarTrack.git
cd SmarTrack

# Install dependencies
pnpm install
# (Don't have pnpm? Run: npm install -g pnpm)

# Start development server
pnpm dev
# → Opens at http://localhost:5174

# In a new terminal, build the extension
pnpm build:extension
# → Creates dist-extension/ folder

# Load extension in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select dist-extension/ folder

# Start using!
```

---

## 📚 What's Next?

### As a User:
- Read the [User Guide](./USER_GUIDE.md)
- Check out [Features](#features)
- Join [Discussions](https://github.com/chiampee/SmarTrack/discussions)

### As a Developer:
- Read the [Full Installation Guide](./README.md#installation)
- Check [Deployment Guide](./DEPLOYMENT.md)
- Review [Contributing Guidelines](./CONTRIBUTING.md) *(coming soon)*

---

## ✨ Features at a Glance

| Feature | Description | Status |
|---------|-------------|--------|
| 🔖 **Save Links** | One-click save from any webpage | ✅ Live |
| 📂 **Organize** | Labels, priorities, status tracking | ✅ Live |
| 🔍 **Search** | Fast, full-text search | ✅ Live |
| 🤖 **AI Chat** | Ask questions about your research | ✅ Live (API key required) |
| 📝 **Summaries** | Auto-generate AI summaries | ✅ Live (API key required) |
| 💾 **Local Storage** | All data stays in your browser | ✅ Live |
| 🔄 **Auto-Sync** | Extension ↔ Dashboard sync | ✅ Live |
| 📱 **Mobile** | Responsive dashboard | ⏳ Coming Soon |
| 👥 **Collaboration** | Share boards with team | ⏳ Coming Soon |
| ☁️ **Cloud Sync** | Multi-device sync | ⏳ Coming Soon |

---

## 🆘 Need Help?

- 📖 [Full Documentation](./README.md)
- 🚀 [Deployment Guide](./DEPLOYMENT.md)
- 📚 [User Guide](./USER_GUIDE.md)
- 🐛 [Report Issues](https://github.com/chiampee/SmarTrack/issues)
- 💬 [Ask Questions](https://github.com/chiampee/SmarTrack/discussions)

---

## 🎉 You're All Set!

Choose your path:
- **User?** → Visit the [live app](https://smart-research-tracker.vercel.app)
- **Developer?** → Run `pnpm dev` or deploy to Vercel
- **Curious?** → Read the [full README](./README.md)

Happy researching! 📚✨

