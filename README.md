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

---

## 📖 Features

### 🧠 AI-Powered Intelligence

#### Smart Summaries
- **Instant Analysis** - Get comprehensive summaries of any web page
- **Key Points Extraction** - Automatically identify main topics and insights
- **Customizable Length** - Choose from brief, standard, or detailed summaries
- **Multi-language Support** - Works with content in various languages

#### Research Chat
- **Ask Questions** - Query your saved research with natural language
- **Context-Aware Answers** - AI understands the context of your questions
- **Cross-Reference** - Find connections between different saved pages
- **Citation Tracking** - See which sources the AI used for answers
- **Multi-Link Chat** - Start conversations with multiple selected links
- **Chat History** - Save and revisit previous conversations

### 📚 Organization & Management

#### Flexible Organization
- **Boards** - Group related research by project or topic
- **Labels** - Tag content for easy filtering and search
- **Priority Levels** - Mark important content for quick access
- **Custom Categories** - Create your own organizational system

#### Multiple Views
- **Board View** - Visual organization with drag-and-drop
- **List View** - Compact list with advanced table features
- **Grid View** - Card-based layout for visual browsing
- **Search View** - Find specific content instantly

#### Advanced Table Features
- **Bulk Actions** - Select multiple links for batch operations
- **Copy Raw Data** - Export complete link data in JSON format
- **Context Menus** - Right-click for quick actions on individual links
- **Column Management** - Show/hide and resize columns
- **Text Presentation Modes** - Wrap, clip, or show first words
- **Drag & Drop Reordering** - Customize column and group order

### 🔍 Advanced Search & Discovery

#### Smart Search
- **Full-Text Search** - Search through all saved content
- **Semantic Search** - Find related content even with different words
- **Filter Options** - Search by date, tags, boards, or content type
- **Search History** - Track your previous searches

#### Data Export & Integration
- **Raw Data Export** - Copy complete link data in JSON format
- **Bulk Operations** - Select multiple links for batch processing
- **Context-Aware Actions** - Right-click menus for quick access
- **Clipboard Integration** - Easy data sharing and backup

#### Content Discovery
- **Related Content** - AI suggests connections between saved pages
- **Trend Analysis** - See patterns in your research interests
- **Duplicate Detection** - Avoid saving the same content twice
- **Content Recommendations** - Get suggestions based on your interests

### 🔒 Privacy & Security

#### Data Control
- **Local Storage** - All data stays on your device
- **No Cloud Dependencies** - Works completely offline
- **Export Options** - Backup your data in multiple formats
- **Selective Sync** - Choose what to sync across devices

### 📋 Data Export & Integration

#### Copy Functionality
- **Bulk Copy** - Select multiple links and copy all raw data
- **Individual Copy** - Right-click any link to copy its complete data
- **Inline Copy** - Hover over link names for quick copy access
- **JSON Format** - Structured data export for easy integration

#### Export Features
- **Complete Data** - All link metadata, labels, and timestamps
- **Visual Feedback** - Clear indication when data is copied
- **Multiple Formats** - JSON, formatted text, and raw data
- **Batch Processing** - Export large datasets efficiently

#### Security Features
- **Encrypted Storage** - Sensitive data is encrypted locally
- **No Tracking** - We don't collect or analyze your data
- **API Key Security** - API keys are stored securely
- **Privacy-First Design** - Built with privacy as a core principle

---

## 🔧 Setup & Configuration

### Environment Configuration

#### Automatic Setup (Recommended)
The onboarding wizard includes an automatic API key setup feature:
1. Enter your OpenAI API key in the setup modal
2. Click "Setup" to validate the key
3. Download the generated `.env.local` file
4. Place it in your project root and restart the server

#### Manual Setup
Alternatively, create a `.env.local` file in the project root:

```env
# Required for AI features
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Optional: Customize AI behavior
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_OPENAI_EMBED_MODEL=text-embedding-3-small

# Optional: Backup AI provider
VITE_MISTRAL_API_KEY=your_mistral_api_key_here

# Optional: Custom settings
VITE_MAX_SUMMARY_LENGTH=500
VITE_ENABLE_ANALYTICS=false
```

### Browser Extension Configuration

The extension can be configured through its settings page:

- **Dashboard URL** - Where your main app is running
- **Auto-fill** - Automatically populate page titles
- **Auto-close** - Close popup after saving
- **Keyboard Shortcuts** - Customize hotkeys
- **Data Management** - Export/import your data

### Performance Optimization

#### For Large Research Collections
- **Pagination** - Content loads in chunks for better performance
- **Lazy Loading** - Images and heavy content load on demand
- **Search Indexing** - Optimized search for quick results
- **Caching** - Smart caching for frequently accessed content
- **Bulk Operations** - Efficiently manage large numbers of links
- **Data Export** - Export large datasets in structured formats

#### System Requirements
- **Minimum**: 4GB RAM, 2GB free disk space
- **Recommended**: 8GB RAM, 5GB free disk space
- **Browser**: Modern browser with ES2020 support

---

## 🛠️ Development

### Project Structure

```
smart-research-tracker/
├── src/                    # Main application source
│   ├── components/         # React components
│   │   ├── ai/            # AI-related features
│   │   ├── boards/        # Board management
│   │   ├── links/         # Link management
│   │   ├── layout/        # Layout components
│   │   └── ui/            # Reusable UI elements
│   ├── pages/             # Application pages
│   ├── services/          # Business logic & APIs
│   ├── stores/            # State management (Zustand)
│   ├── types/             # TypeScript definitions
│   ├── utils/             # Utility functions
│   └── db/                # Database configuration
├── extension/             # Browser extension
├── api/                   # Backend API functions
├── tests/                 # Test files
├── public/                # Static assets
└── docs/                  # Documentation
```

### Development Commands

```bash
# Development
pnpm dev                   # Start development server
pnpm build                 # Build for production
pnpm preview               # Preview production build
pnpm build:extension       # Build browser extension

# Testing
pnpm test                  # Run unit tests (Vitest)
pnpm test:watch           # Run tests in watch mode
pnpm test:e2e             # Run end-to-end tests
pnpm test:coverage        # Generate coverage report

# Code Quality
pnpm lint                  # Check code quality
pnpm lint:fix             # Fix linting issues
pnpm format               # Format code with Prettier
pnpm type-check           # Run TypeScript checks

# Database
pnpm db:migrate           # Run database migrations
pnpm db:seed              # Seed database with sample data
pnpm db:reset             # Reset database
```

### Technology Stack

#### Frontend
- **React 18** - UI framework with concurrent features
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Headless UI** - Accessible UI components
- **Lucide React** - Beautiful, customizable icons

#### State Management
- **Zustand** - Lightweight state management
- **React Query** - Server state management
- **Dexie** - IndexedDB wrapper for local storage

#### AI & APIs
- **OpenAI API** - Primary AI provider
- **Mistral API** - Backup AI provider
- **Embedding Models** - For semantic search

#### Testing
- **Vitest** - Unit testing framework (migrated from Jest)
- **Playwright** - End-to-end testing
- **Testing Library** - Component testing utilities

#### Code Quality
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Commitlint** - Commit message validation

### Development Guidelines

#### Code Style
- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error boundaries
- Write self-documenting code
- Add JSDoc comments for complex functions

#### Testing Strategy
- Unit tests for utility functions
- Component tests for UI elements
- Integration tests for user workflows
- E2E tests for critical paths
- Maintain 80%+ code coverage

#### Performance
- Implement lazy loading for routes
- Use React.memo for expensive components
- Optimize bundle size with code splitting
- Implement proper caching strategies
- Monitor Core Web Vitals

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/smart-research-tracker.git
   cd smart-research-tracker
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Set up development environment**:
   ```bash
   pnpm install
   pnpm setup
   ```
5. **Make your changes** and test thoroughly
6. **Commit your changes**:
   ```bash
   git commit -m "feat: add amazing feature"
   ```
7. **Push to your fork**:
   ```bash
   git push origin feature/amazing-feature
   ```
8. **Create a Pull Request**

### Contribution Areas

#### High Priority
- **Bug fixes** - Help squash bugs and improve stability
- **Performance improvements** - Make the app faster and more efficient
- **Accessibility enhancements** - Improve usability for all users
- **Documentation** - Improve guides and API documentation

#### Medium Priority
- **New features** - Add useful functionality
- **UI/UX improvements** - Enhance the user interface
- **Testing** - Add more test coverage
- **Internationalization** - Support for multiple languages

#### Low Priority
- **Code refactoring** - Improve code structure
- **Developer experience** - Better tooling and workflows
- **Analytics** - Usage tracking and insights
- **Integration** - Connect with other tools

### Development Workflow

#### Before Starting
- Check existing issues and pull requests
- Discuss your idea in an issue first
- Ensure your feature aligns with project goals
- Review the codebase to understand the architecture

#### During Development
- Follow the established code style
- Write tests for new functionality
- Update documentation as needed
- Test across different browsers and devices

#### Before Submitting
- Run all tests: `pnpm test`
- Check code quality: `pnpm lint`
- Test the build: `pnpm build`
- Update relevant documentation
- Write a clear commit message

### Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please:

- Be respectful and considerate of others
- Use inclusive language
- Focus on constructive feedback
- Help others learn and grow
- Report any inappropriate behavior

---

## 🐛 Troubleshooting

### Common Issues

#### Installation Problems

**Node.js version issues**
```bash
# Check your Node.js version
node --version

# If below 18, update Node.js
# macOS: brew install node@18
# Windows: Download from nodejs.org
# Linux: Use nvm or package manager
```

**Permission errors**
```bash
# macOS/Linux
sudo chmod +x install.sh
./install.sh

# Windows (Run as Administrator)
install.bat
```

**Dependency conflicts**
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### Application Issues

**Development server crashes**
```bash
# Use production build instead
pnpm build && pnpm preview

# Clear Vite cache
rm -rf node_modules/.vite

# Check system resources
# Ensure you have enough RAM and disk space
```

**AI features not working**
- Verify your OpenAI API key is correct
- Check your OpenAI account has sufficient credits
- Ensure the API key has the correct permissions
- Check browser console for error messages

**Browser extension issues**
- Ensure the main app is running on localhost:5173
- Check extension permissions in Chrome
- Reload the extension in chrome://extensions/
- Clear browser cache and storage

#### Performance Issues

**Slow loading times**
- Check your internet connection
- Clear browser cache and cookies
- Ensure sufficient disk space
- Close unnecessary browser tabs

**High memory usage**
- Restart the application
- Clear saved data if not needed
- Check for memory leaks in browser
- Update to latest version

### Getting Help

#### Before Asking for Help
1. Check this troubleshooting section
2. Search existing issues on GitHub
3. Check the browser console for errors
4. Try the suggested solutions above

#### When Asking for Help
- Provide your operating system and version
- Include Node.js and browser versions
- Share error messages and console logs
- Describe what you were trying to do
- Mention what you've already tried

#### Support Channels
- **GitHub Issues** - For bugs and feature requests
- **GitHub Discussions** - For questions and help
- **Documentation** - Check the docs first
- **Community** - Join our community chat

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The MIT License is a permissive license that allows you to:
- Use the software for any purpose
- Modify the software
- Distribute the software
- Use it commercially

The only requirement is that you include the original license and copyright notice.

---

## 🙏 Acknowledgments

### Open Source Contributors
- **React Team** - For the amazing React framework
- **Vite Team** - For the fast build tool
- **Tailwind CSS** - For the utility-first CSS framework
- **OpenAI** - For providing the AI capabilities
- **All Contributors** - For making this project better

### Inspiration
- Built for researchers, students, and knowledge workers
- Inspired by the need for better research organization tools
- Designed to make information discovery and management easier

### Community
- Thanks to all users who provide feedback and suggestions
- Special thanks to early adopters and beta testers
- Grateful for the open source community's support

---

<div align="center">

**Made with ❤️ for curious minds everywhere**

[⭐ Star this repo](https://github.com/your-username/smart-research-tracker) • [🐛 Report issues](https://github.com/your-username/smart-research-tracker/issues) • [💬 Join discussions](https://github.com/your-username/smart-research-tracker/discussions) • [📖 View docs](https://github.com/your-username/smart-research-tracker/wiki)

</div>
