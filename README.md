# Smart Research Tracker

> **Your AI-powered research companion** - Save web pages, get instant summaries, and chat with your research collection.

Transform how you research by automatically extracting key insights from web pages and enabling intelligent conversations with your saved content.

## ✨ What Makes This Special

### 🧠 **AI-Powered Research Assistant**
- **Instant Summaries**: Every saved page gets an AI-generated TL;DR in seconds
- **Smart Chat**: Ask questions about your research and get contextual answers
- **Semantic Search**: Find relevant content across your entire research library

### 📚 **Organized Research Management**
- **Smart Categorization**: Auto-group pages by labels, status, or priority
- **Drag & Drop**: Reorder categories and columns with intuitive controls
- **Visual Context**: See exactly what AI can access for each page

### 🔒 **Privacy-First Design**
- **Local Storage**: All your data stays on your device (IndexedDB)
- **No Cloud Database**: Your research remains private and secure
- **Optional AI**: Only uses AI services when you explicitly request summaries

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Clone the repository
git clone <your-repo-url>
cd smart-research-tracker

# Install dependencies
pnpm install
```

### 2. Set Up AI Services (Optional)
Create a `.env.local` file in the project root:
```bash
# Required for AI features
VITE_OPENAI_API_KEY=sk-your-openai-key-here

# Optional: Customize AI models
VITE_OPENAI_MODEL=gpt-4.5-preview
VITE_OPENAI_EMBED_MODEL=text-embedding-3-small

# Optional: Fallback AI provider
VITE_MISTRAL_API_KEY=your-mistral-key-here
```

**Get API Keys:**
- [OpenAI API Key](https://platform.openai.com/api-keys) (required for summaries & chat)
- [Mistral API Key](https://console.mistral.ai/) (optional fallback)

### 3. Start the Dashboard
```bash
pnpm dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Install Browser Extension
```bash
# Build the extension
pnpm run build:extension

# Load in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the `dist-extension/` folder
```

---

## 🎯 How to Use

### **Saving Pages**
1. **Browse to any webpage** you want to research
2. **Click the extension icon** in your browser toolbar
3. **Add labels** and set priority (optional)
4. **Click "Save"** - the page is instantly captured with full text

### **Organizing Research**
- **View by Labels**: See all pages grouped by topic
- **Filter by Status**: Active, Archived, or Deleted
- **Sort by Priority**: High, Medium, or Low importance
- **Search**: Find pages by title or URL

### **AI-Powered Insights**
- **Automatic Summaries**: Each page gets a 3-sentence TL;DR
- **Context Viewer**: Click the ℹ️ icon to see what AI can access
- **Smart Chat**: Select multiple pages and start a conversation
- **Semantic Search**: Find related content across your library

### **Advanced Features**
- **Drag & Drop**: Reorder categories and columns
- **Bulk Actions**: Select multiple pages for archiving or chat
- **Export Ready**: All data stored locally for easy backup

---

## 🏗️ Architecture

### **Frontend (React + Vite)**
- **Dashboard**: Main research interface with filtering and chat
- **Real-time Updates**: Instant sync between extension and dashboard
- **Responsive Design**: Works on desktop and mobile

### **Browser Extension**
- **Content Extraction**: Captures full page text (up to 500KB)
- **Background Processing**: Queues summaries even when dashboard is closed
- **Resilient Sync**: Retries failed operations automatically

### **AI Services**
- **OpenAI Integration**: GPT-4 for summaries, embeddings for search
- **Fallback Support**: Mistral as backup AI provider
- **Rate Limiting**: Smart queuing to avoid API limits

### **Data Storage**
- **IndexedDB**: Local browser storage for all research data
- **No Server Required**: Everything runs in your browser
- **Export Friendly**: Easy to backup or migrate data

---

## 🔧 Configuration

### **Environment Variables**
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_OPENAI_API_KEY` | OpenAI API key (required) | - |
| `VITE_OPENAI_MODEL` | Chat model | `gpt-4.5-preview` |
| `VITE_OPENAI_EMBED_MODEL` | Embedding model | `text-embedding-3-small` |
| `VITE_MISTRAL_API_KEY` | Fallback AI provider | - |

### **Extension Settings**
- **API Endpoint**: Override default enrichment endpoint
- **Custom Labels**: Pre-configure common research topics
- **Auto-save**: Enable automatic page capture

---

## 🛠️ Development

### **Available Scripts**
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm test         # Run unit tests
pnpm lint         # Check code quality
pnpm e2e          # Run end-to-end tests
```

### **Project Structure**
```
src/
├── components/     # React components
├── pages/         # Main application views
├── services/      # Business logic & API calls
├── stores/        # State management (Zustand)
├── types/         # TypeScript definitions
└── utils/         # Helper functions

extension/         # Browser extension files
api/              # Serverless functions
tests/            # Test files
```

### **Key Technologies**
- **React 18** with TypeScript
- **Vite** for fast development
- **Zustand** for state management
- **Dexie** for IndexedDB wrapper
- **Tailwind CSS** for styling
- **OpenAI API** for AI features

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b my-feature`
3. **Make your changes** and add tests
4. **Run quality checks**: `pnpm lint && pnpm test`
5. **Submit a pull request**

### **Development Guidelines**
- Follow TypeScript best practices
- Add tests for new features
- Update documentation for API changes
- Ensure accessibility compliance

---

## 📋 Roadmap

### **Coming Soon**
- [ ] **Mobile App**: Native iOS/Android companion
- [ ] **Collaborative Research**: Share collections with teams
- [ ] **Advanced Search**: Full-text search across all content
- [ ] **Export Options**: PDF, Markdown, and citation formats
- [ ] **Integration APIs**: Connect with other research tools

### **Planned Features**
- [ ] **Citation Management**: Automatic reference generation
- [ ] **Research Templates**: Pre-configured workflows
- [ ] **Analytics Dashboard**: Research insights and trends
- [ ] **Offline Mode**: Work without internet connection

---

## 🆘 Support

### **Common Issues**

**"AI is generating summaries" appears frequently**
- Check your OpenAI API key is valid
- Verify internet connection
- Review browser console for errors

**Extension not saving pages**
- Ensure extension is loaded in Chrome
- Check if dashboard is running on localhost:5173
- Verify page content is accessible

**Chat not working**
- Confirm OpenAI API key is set
- Check browser console for API errors
- Try refreshing the dashboard

### **Getting Help**
- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions and share tips
- **Documentation**: Check the `/docs` folder for detailed guides

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for researchers, students, and knowledge workers everywhere.**
