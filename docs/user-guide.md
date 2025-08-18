# User Guide

## Overview

Smart Research Tracker is a browser extension and web dashboard that helps you save, organize, and analyze research links with AI-powered insights. This guide covers how to use the current version with its streamlined interface and intelligent duplicate detection.

## 🚀 Getting Started

### 1. Install the Extension
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `extension/` folder
4. The extension icon should appear in your browser toolbar

### 2. Open the Dashboard
1. Navigate to `http://localhost:5173` (or your deployed URL)
2. The dashboard will automatically load your saved links
3. Use the sidebar for navigation and quick actions

## 💾 Saving Links

### Primary Method: Browser Extension
1. **Navigate to any webpage** you want to save
2. **Click the extension icon** in your browser toolbar
3. **Fill in the details**:
   - Title (auto-filled from page)
   - Description (auto-extracted)
   - Labels (organize your research)
   - Priority (low/medium/high)
4. **Click "Save Link"**

### Duplicate Detection
When you try to save a link that already exists:
1. **Duplicate popup appears** showing existing entries
2. **Review the details** of what's already saved
3. **Choose your action**:
   - **"Save Anyway"** - Create a new entry despite duplicates
   - **"Cancel"** - Don't save the link

### Secondary Method: Dashboard Quick Actions
1. **Open the sidebar** (hamburger menu)
2. **Go to "Quick Actions"** section
3. **Click "Add Link"** button
4. **Fill in the link details** manually
5. **Click "Save"**

> **Note**: The "Add Link" button is intentionally placed only in Quick Actions for a cleaner main interface. Most link saving should be done via the browser extension.

## 🏠 Dashboard Interface

### Main Dashboard
- **Links Table**: Shows all your saved research links
- **Filters**: Search by text, filter by status/priority/labels
- **Bulk Actions**: Select multiple links for operations
- **Export Options**: Send to ChatGPT or other formats

### Sidebar Navigation
- **Quick Actions**: Add Link, Delete All (when links exist)
- **Navigation**: Links, Boards, Tasks, Chat History
- **Settings**: Help, Diagnostics, Clear All Links

### Link Management
- **View Details**: Click on any link to see full information
- **Edit**: Right-click for context menu with edit options
- **Archive**: Mark links as archived to hide from main view
- **Delete**: Remove links permanently

## 🤖 AI Features

### AI Chat
1. **Select links** you want to analyze
2. **Click "Start Chat"** button
3. **Ask questions** about your research
4. **AI responds** with context from your selected links

### AI Summaries
- **Automatic**: Generated when saving links
- **Multiple Types**: TL;DR, bullet points, quotes, insights
- **Custom Prompts**: Create your own summary requests

### Conversation Management
- **Clear Chat**: Clear messages while keeping conversation context
- **New Chat**: Start fresh conversations
- **Quick Prompts**: Pre-defined questions for common tasks
- **History**: All conversations are automatically saved

## 🔍 Finding and Organizing

### Search and Filter
- **Text Search**: Search titles, descriptions, and URLs
- **Status Filter**: Active, archived, or all links
- **Priority Filter**: High, medium, or low priority
- **Label Filter**: Filter by specific labels or categories

### Sorting Options
- **By Labels**: Group similar research together
- **By Date**: Newest or oldest first
- **By Priority**: High priority items first
- **By Status**: Active items before archived

### Labels and Categories
- **Create Labels**: Organize links by topic, project, or source
- **Multiple Labels**: Apply several labels to one link
- **Label Management**: Edit, merge, or delete labels as needed

## 📊 Understanding the Badge

### Badge Colors
- **🟢 Green (no number)**: All links are working properly
- **🔴 Red (with number)**: Some links are "stuck" (not displayed on dashboard)

### What Makes Links "Stuck"
- **Communication Issues**: Extension can't reach dashboard
- **Dashboard Not Running**: No active dashboard tabs
- **Data Sync Problems**: Links saved but not visible
- **Extension Context Issues**: Extension needs to be reloaded

### Fixing Stuck Links
1. **Refresh the dashboard** (Cmd+R)
2. **Reload the extension** (go to chrome://extensions/)
3. **Check browser console** for error messages
4. **Use diagnostics** in Settings for detailed troubleshooting

## 🛠️ Troubleshooting

### Common Issues

#### Extension Not Working
1. Go to `chrome://extensions/`
2. Find "Smart Research Tracker"
3. Click the refresh/reload button
4. Try saving a link again

#### Dashboard Not Loading
1. Ensure the development server is running (`pnpm dev`)
2. Check the URL: `http://localhost:5173`
3. Clear browser cache and cookies
4. Try a different browser

#### Links Not Syncing
1. Check if the extension badge is red (indicating stuck links)
2. Refresh the dashboard page
3. Try saving a new link to test communication
4. Check browser console for error messages

#### Duplicate Detection Not Working
1. Verify the URL is actually a duplicate
2. Check extension popup for error messages
3. Reload the extension
4. Try saving the link again

### Getting Help

#### Built-in Diagnostics
1. **Open Settings** in the sidebar
2. **Click "Diagnostics"**
3. **Review the report** for issues
4. **Follow suggested fixes**

#### Error Messages
- **User-friendly messages** explain what went wrong
- **Actionable suggestions** help you fix the issue
- **Error codes** for technical support

## 🔧 Advanced Features

### Keyboard Shortcuts
- **⌘K** (Mac) / **Ctrl+K** (Windows/Linux): Quick link search
- **⌘/**: Focus search box
- **⌘B**: Toggle sidebar

### Export Options
- **ChatGPT Format**: Export selected links for AI analysis
- **CSV**: Download link data for external analysis
- **JSON**: Programmatic access to your data

### Customization
- **Theme**: Light/dark mode (follows system preference)
- **Language**: English (more languages coming soon)
- **Sorting**: Customize default sort order
- **Labels**: Create your own organizational system

## 📱 Browser Compatibility

### Supported Browsers
- **Chrome**: Full support (primary target)
- **Edge**: Full support (Chromium-based)
- **Brave**: Full support (Chromium-based)
- **Other Chromium browsers**: Should work with minor issues

### Browser Features Required
- **Extension API**: For the browser extension
- **IndexedDB**: For local storage fallback
- **Service Workers**: For background processing
- **Modern JavaScript**: ES2020+ features

## 🔒 Privacy and Security

### Data Storage
- **All data stays local** to your browser
- **No cloud storage** or external servers
- **Extension storage** is encrypted by Chrome
- **IndexedDB** is local browser storage

### Permissions
- **Storage**: Save and retrieve your research data
- **Active Tab**: Extract page information for saving
- **No network access** to external services (unless you configure AI API keys)

### Data Control
- **Export your data** anytime
- **Clear all data** with one click
- **No tracking** or analytics
- **Your research stays private**

## 🚀 Tips and Best Practices

### Organizing Your Research
1. **Use descriptive labels** for easy filtering
2. **Set priorities** for important research items
3. **Archive completed research** to keep active list clean
4. **Regular cleanup** of outdated or irrelevant links

### Working with AI
1. **Select relevant links** before starting chat
2. **Ask specific questions** for better AI responses
3. **Use quick prompts** for common research tasks
4. **Save interesting AI insights** as new links

### Extension Usage
1. **Save links as you browse** for better research flow
2. **Use the duplicate detection** to avoid clutter
3. **Check the badge** to monitor extension health
4. **Reload extension** if you notice issues

## 📚 Getting More Help

### Documentation
- **This User Guide**: Complete usage instructions
- **Architecture Guide**: Technical implementation details
- **Troubleshooting Guide**: Common problems and solutions
- **API Documentation**: For developers and power users

### Support Resources
- **Built-in Diagnostics**: Automatic problem detection
- **Error Messages**: Clear explanations and solutions
- **Console Logs**: Technical debugging information
- **Test Pages**: Verify extension functionality

### Community
- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share tips
- **Contributions**: Help improve the project

---

**Happy Researching! 🧠📚**

Smart Research Tracker is designed to make your research workflow more efficient and organized. Start by saving a few links and exploring the AI features to discover how it can enhance your research process.
