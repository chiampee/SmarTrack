# 📚 Smart Research Tracker - User Guide

Welcome to Smart Research Tracker! This guide will help you get started in under 5 minutes.

---

## 🚀 Quick Start (3 Steps)

### Step 1: Visit the Dashboard
Go to: **[https://your-app.vercel.app](https://your-app.vercel.app)**

No signup required! The app runs entirely in your browser.

### Step 2: Install the Chrome Extension
1. Download the extension from [Chrome Web Store](#) *(link will be added after publishing)*
2. Or load it manually:
   - Download the latest release
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the extension folder

### Step 3: Start Saving Links!
1. Visit any webpage you want to save
2. Click the extension icon
3. Add labels and notes (optional)
4. Click "Save"
5. View your link in the dashboard!

---

## ✨ Features Overview

### 🔖 Save Links
- **One-click save** from any webpage
- **Auto-extract** title, description, and images
- **Add labels** for organization
- **Set priority** (High, Medium, Low)
- **Mark status** (Active, Reading, Completed, Archived)

### 📂 Organize
- **Labels** - Categorize links with custom labels
- **Search** - Find links by title, URL, or content
- **Filters** - Filter by status, priority, or labels
- **Sort** - By date, title, priority, or status

### 🤖 AI Features (Optional)
- **AI Chat** - Ask questions about your research
- **Auto-Summaries** - Get AI-generated summaries
- **Smart Search** - Semantic search across all content

*Note: AI features require an OpenAI API key (optional)*

### 💾 Data Storage
- **All data stays local** - Stored in your browser (IndexedDB)
- **No cloud sync** - Your data never leaves your device
- **Privacy-first** - No tracking, no analytics
- **Cross-device** - Use same extension on multiple browsers

---

## 📖 How to Use

### Saving Your First Link

1. **Browse to any webpage** you want to save
2. **Click the extension icon** (top-right of Chrome)
3. **Review auto-filled information:**
   - Title (editable)
   - URL (auto-detected)
   - Description (from page metadata)
4. **Add optional details:**
   - Labels (e.g., "research", "tutorial", "article")
   - Priority (High, Medium, Low)
   - Notes
5. **Click "Save Link"**
6. **Open dashboard** to see your saved link!

### Viewing Your Links

**Dashboard URL:** `https://your-app.vercel.app`

**What you'll see:**
- All your saved links in a table view
- Filters and search at the top
- Quick actions (edit, delete, chat)
- Statistics (total links, by status, by priority)

### Searching & Filtering

**Search Bar:**
- Type any keyword to search titles, URLs, and descriptions
- Updates in real-time as you type

**Filters:**
- **Status:** All / Active / Reading / Completed / Archived
- **Priority:** All / High / Medium / Low
- **Sort:** Date / Title / Priority / Status / Labels

**Pro Tip:** Use labels like `#urgent`, `#later`, `#review` for quick filtering!

### Using AI Chat (Optional)

1. **Select a link** (click checkbox)
2. **Click "Start AI Chat"** button
3. **Ask questions** about the content:
   - "Summarize this article"
   - "What are the key takeaways?"
   - "How does this relate to [topic]?"
4. **Get instant AI responses**

*Requires OpenAI API key in settings*

---

## 🎨 Dashboard Features

### Link Table
- **Select multiple links** - Bulk actions (delete, export, chat)
- **Inline editing** - Click to edit title, labels, priority, status
- **Quick actions** - Hover over a link for quick actions
- **Drag & drop** - (Coming soon!)

### Top Panel
- **Statistics** - Quick overview of your collection
- **Search bar** - Full-text search
- **Filter dropdowns** - Status, priority, sort options
- **Add Link** - Manual link entry

### Sidebar
- **Quick Actions** - Add link, delete all
- **Navigation** - Links, Boards (coming soon), Tasks (coming soon), Chat
- **Settings & Help** - Database tests, troubleshooting

---

## ⚙️ Settings & Configuration

### Basic Settings
- **Theme** - Light / Dark / System (coming soon)
- **Default view** - Table / Cards (coming soon)
- **Items per page** - 10 / 25 / 50 / 100

### AI Settings (Optional)
- **OpenAI API Key** - For AI chat and summaries
- **Model Selection** - GPT-3.5 / GPT-4
- **Fallback Providers** - Together AI, Groq, Fireworks

### Privacy Settings
- **Data Export** - Export all your data to JSON
- **Data Import** - Import from previous export
- **Clear All** - Delete all data (irreversible!)

---

## 🔧 Troubleshooting

### Extension Not Saving Links

**Problem:** Click "Save" but link doesn't appear in dashboard

**Solutions:**
1. **Refresh the dashboard** - Try a hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
2. **Check browser console** - Press F12, look for errors
3. **Reload extension** - Go to `chrome://extensions/`, click reload
4. **Clear cache** - Clear browser cache and try again

### Dashboard Not Loading Links

**Problem:** Dashboard is empty but extension says links are saved

**Solutions:**
1. **Check database** - Go to Settings → Database Tests
2. **Run validation** - Click "Run All Tests"
3. **Check browser compatibility** - Use Chrome/Edge (latest version)
4. **Clear IndexedDB** - Settings → Database Tests → "Clear All"

### AI Features Not Working

**Problem:** Chat or summaries aren't responding

**Solutions:**
1. **Check API key** - Settings → AI Settings → Verify key is entered
2. **Check API balance** - Go to OpenAI dashboard, ensure you have credits
3. **Try fallback provider** - Settings → Use Groq or Together AI (free tier)
4. **Check browser console** - Look for API errors

### Links Disappearing After Refresh

**Problem:** Save links but they're gone after page reload

**Solutions:**
1. **Browser storage full** - Clear other site data
2. **Incognito mode** - Don't use in incognito (data is temporary)
3. **Extension issue** - Make sure extension is installed and enabled
4. **Database corruption** - Run database tests and cleanup

---

## 📊 Database Management

### Accessing Database Tools
1. **Open dashboard** at `https://your-app.vercel.app`
2. **Click Settings & Help** in sidebar (or press `?`)
3. **Click "Database Tests"**

### Available Tools
- **Run All Tests** - Comprehensive database health check
- **Test Save Link** - Verify save functionality works
- **Complete Cleanup** - Remove duplicates and orphaned data
- **Export Data** - Backup all your links to JSON
- **Import Data** - Restore from backup
- **Clear All** - Delete everything (use with caution!)

### Database Statistics
- Total links saved
- Total summaries generated
- Total chat messages
- Database size (MB)
- Last sync time

---

## 💡 Pro Tips

### Organization Best Practices
1. **Use consistent labels** - Create a label system (e.g., `#work`, `#personal`, `#research`)
2. **Set priorities** - Mark urgent items as High priority
3. **Update status** - Move items from Active → Reading → Completed
4. **Archive old items** - Keep your Active list clean

### Keyboard Shortcuts (Coming Soon!)
- `Ctrl/Cmd + K` - Quick search
- `Ctrl/Cmd + N` - New link
- `Ctrl/Cmd + E` - Edit selected
- `Delete` - Delete selected
- `Esc` - Clear selection

### Workflow Examples

**Research Workflow:**
1. Browse articles and save with extension
2. Label as `#research` or by topic
3. Set priority based on importance
4. Read and mark status as you go
5. Use AI Chat to generate summaries
6. Export final collection for reference

**Reading List:**
1. Save articles as you find them
2. Label as `#to-read`
3. Set status to "Reading" when you start
4. Mark "Completed" when done
5. Archive or delete old articles

**Project Management:**
1. Save resources for current project
2. Label by project name (e.g., `#project-xyz`)
3. Set priority for must-read items
4. Use notes field for your thoughts
5. Chat with AI for quick insights

---

## 🔐 Privacy & Security

### Data Storage
- ✅ **All data is local** - Stored in browser IndexedDB
- ✅ **No cloud sync** - Never leaves your device
- ✅ **No tracking** - We don't collect any analytics
- ✅ **No ads** - Completely free and ad-free

### AI Features
- ⚠️ **API calls** - AI features send data to OpenAI/Together/Groq
- ⚠️ **Your API key** - You control your own API key
- ⚠️ **Content shared** - Only selected links are sent to AI
- ✅ **Optional** - AI features are completely optional

### Extension Permissions
- **storage** - Save links to your browser
- **activeTab** - Extract page metadata
- **tabs** - Manage saved links across tabs

---

## 🆘 Getting Help

### Resources
- **GitHub Issues** - [Report bugs or request features](https://github.com/chiampee/SmarTrack/issues)
- **Documentation** - [Full developer docs](https://github.com/chiampee/SmarTrack/tree/main/docs)
- **Deployment Guide** - [DEPLOYMENT.md](./DEPLOYMENT.md)

### Common Questions

**Q: Is this free?**
A: Yes! 100% free and open source (MIT License)

**Q: Do I need to sign up?**
A: No! Everything runs locally in your browser.

**Q: Can I use this offline?**
A: Yes! Once loaded, the dashboard works offline. Extension needs internet to load pages.

**Q: How much data can I store?**
A: IndexedDB has no hard limit, but browser-dependent (usually 50%+ of free disk space)

**Q: Can I export my data?**
A: Yes! Go to Database Tests → Export Data

**Q: Does it work on mobile?**
A: Dashboard works on mobile, but extension is Chrome-only (desktop)

**Q: Can I use multiple devices?**
A: Each browser has its own data. No sync between devices (yet!)

---

## 🎉 You're All Set!

Start saving and organizing your research now:
1. Visit [https://your-app.vercel.app](https://your-app.vercel.app)
2. Install the Chrome extension
3. Save your first link!

Happy researching! 📚✨

---

**Need help?** [Open an issue on GitHub](https://github.com/chiampee/SmarTrack/issues)

