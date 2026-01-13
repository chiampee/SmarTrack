import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Chrome, 
  BookOpen, 
  Download, 
  Keyboard, 
  Search, 
  FolderTree, 
  Sparkles, 
  Settings, 
  Upload, 
  Tag,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Globe,
  Monitor,
  Command
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
}

// Documentation sections
const docSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Download,
    color: 'blue',
    articles: [
      {
        title: 'Installing the Chrome Extension',
        content: `## Step 1: Install from Chrome Web Store

1. Click the "Add to Chrome" button on our homepage, or visit the Chrome Web Store directly
2. Click "Add to Chrome" in the store
3. Confirm by clicking "Add extension"

The SmarTrack icon will appear in your browser toolbar.

## Step 2: Sign In

1. Click the SmarTrack icon in your toolbar
2. Click "Sign in with Google"
3. Authorize SmarTrack to access your basic profile

## Step 3: Save Your First Page

Navigate to any webpage and:
- Click the SmarTrack icon, OR
- Use the keyboard shortcut (⌘+Shift+S on Mac, Ctrl+Shift+S on Windows)

That's it! Your page is now saved and will appear in your dashboard.`
      },
      {
        title: 'System Requirements',
        content: `## Supported Browsers

- Google Chrome (v90+)
- Microsoft Edge (Chromium-based)
- Brave Browser
- Arc Browser
- Opera

## Minimum Requirements

- Modern operating system (Windows 10+, macOS 10.15+, Linux)
- Stable internet connection
- 50MB free disk space for extension

## Coming Soon

- Firefox support (Q2 2026)
- Safari support (Q3 2026)
- Mobile apps (Q4 2026)`
      }
    ]
  },
  {
    id: 'saving-content',
    title: 'Saving Content',
    icon: Globe,
    color: 'green',
    articles: [
      {
        title: 'How to Save a Page',
        content: `## Three Ways to Save

### 1. Click the Extension Icon
Click the SmarTrack icon in your browser toolbar. A popup will appear with the page details pre-filled.

### 2. Keyboard Shortcut
- **Mac:** ⌘ + Shift + S
- **Windows/Linux:** Ctrl + Shift + S

### 3. Right-Click Menu
Right-click anywhere on the page and select "Save to SmarTrack" from the context menu.

## What Gets Saved

- Page URL (permanent reference)
- Page title
- Main content text (cleaned and formatted)
- Featured image (if available)
- Your notes (optional)
- AI-generated summary`
      },
      {
        title: 'Saving Different Content Types',
        content: `## Articles & Blog Posts
SmarTrack automatically extracts the main article content, removing navigation, ads, and clutter.

## Twitter/X Threads
Save any tweet URL and we'll capture the full thread, unrolled and formatted.

## YouTube Videos
Save video pages to capture the title, description, and a link back to the video.

## PDF Documents
If you're viewing a PDF in your browser, save it like any other page. We'll extract the text content.

## Paywalled Content
If you have access to read the content (via subscription), SmarTrack can save it. We capture what you can see.

## Social Media
We support Twitter/X, LinkedIn posts, Reddit threads, and Hacker News discussions.`
      }
    ]
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    icon: Keyboard,
    color: 'purple',
    articles: [
      {
        title: 'All Keyboard Shortcuts',
        content: `## Extension Shortcuts

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Save current page | ⌘ + Shift + S | Ctrl + Shift + S |
| Open extension popup | ⌘ + Shift + E | Ctrl + Shift + E |

## Dashboard Shortcuts

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Search | ⌘ + K | Ctrl + K |
| New capture | ⌘ + N | Ctrl + N |
| Toggle sidebar | ⌘ + \\ | Ctrl + \\ |
| Go to settings | ⌘ + , | Ctrl + , |

## Customizing Shortcuts

1. Go to \`chrome://extensions/shortcuts\` in Chrome
2. Find SmarTrack in the list
3. Click the pencil icon to edit shortcuts
4. Press your desired key combination`
      }
    ]
  },
  {
    id: 'organization',
    title: 'Organization',
    icon: FolderTree,
    color: 'amber',
    articles: [
      {
        title: 'Projects & Collections',
        content: `## Creating a Project

1. In the dashboard sidebar, click "+ New Project"
2. Enter a project name
3. Optionally add a description and color

## Adding Saves to Projects

- **When saving:** Select a project from the dropdown in the save dialog
- **From dashboard:** Drag and drop saves into project folders
- **Bulk assign:** Select multiple saves and use "Move to Project"

## Project Organization Tips

- Use projects for major research themes (e.g., "Market Research", "Competitor Analysis")
- Projects can have sub-projects for deeper organization
- Pin frequently-used projects for quick access`
      },
      {
        title: 'Tags & Categories',
        content: `## Auto-Tagging

SmarTrack's AI automatically suggests tags based on content analysis. You can:
- Accept suggested tags with one click
- Remove unwanted tags
- Add custom tags

## Manual Tagging

Add tags in the save dialog or edit them later from the dashboard. Tags help with filtering and discovery.

## Categories

Categories are AI-assigned based on content type:
- Technology
- Business
- Research
- Design
- Science
- News
- And more...

You can override the auto-assigned category if needed.`
      }
    ]
  },
  {
    id: 'search',
    title: 'Search & Discovery',
    icon: Search,
    color: 'blue',
    articles: [
      {
        title: 'Searching Your Library',
        content: `## Basic Search

Type any word or phrase in the search bar. We search across:
- Titles
- URLs
- Descriptions
- Full page content
- Your notes
- Tags

## Search Operators

| Operator | Example | Description |
|----------|---------|-------------|
| "quotes" | "machine learning" | Exact phrase match |
| tag: | tag:important | Filter by tag |
| project: | project:research | Filter by project |
| from: | from:nytimes.com | Filter by domain |
| before: | before:2026-01-01 | Before date |
| after: | after:2025-06-01 | After date |

## Combining Operators

\`\`\`
"artificial intelligence" tag:important from:arxiv.org
\`\`\`

This finds pages containing "artificial intelligence" that are tagged "important" and from arxiv.org.`
      },
      {
        title: 'Semantic Search',
        content: `## Natural Language Queries

SmarTrack understands meaning, not just keywords. Try searches like:

- "Articles about startup fundraising strategies"
- "Research on climate change impacts"
- "Tutorials for learning Python"

## How It Works

Our AI analyzes the meaning of your query and matches it against the semantic content of your saves, not just keyword matching.

## Tips for Better Results

1. Be specific about what you're looking for
2. Include context ("for my startup" vs. "for enterprise")
3. Use natural language, not keyword strings`
      }
    ]
  },
  {
    id: 'ai-features',
    title: 'AI Features',
    icon: Sparkles,
    color: 'pink',
    articles: [
      {
        title: 'AI Summaries',
        content: `## Automatic Summarization

When you save a page, our AI generates:
- A concise summary (2-3 sentences)
- Key takeaways (bullet points)
- Main topics covered

## Regenerating Summaries

If the summary isn't quite right:
1. Open the save in your dashboard
2. Click the "..." menu
3. Select "Regenerate Summary"

## Summary Quality

Our AI works best with:
- Well-structured articles
- English content
- Text-heavy pages

It may struggle with:
- Image-heavy pages
- Non-English content (improving)
- Very short pages`
      },
      {
        title: 'Smart Categorization',
        content: `## How It Works

Our AI analyzes the content and automatically:
- Assigns a category
- Suggests relevant tags
- Identifies related saves in your library

## Accuracy

Auto-categorization is correct ~90% of the time. You can always:
- Edit the category manually
- Train the AI by correcting mistakes

## Related Content

On each save's detail page, you'll see "Related Saves" powered by AI. This helps you discover connections in your knowledge base.`
      }
    ]
  },
  {
    id: 'import-export',
    title: 'Import & Export',
    icon: Upload,
    color: 'slate',
    articles: [
      {
        title: 'Importing Data',
        content: `## Supported Import Formats

- Chrome bookmarks (HTML export)
- Pocket export
- Raindrop.io export
- Notion database export
- CSV file
- JSON file

## How to Import

1. Go to Settings → Import/Export
2. Click "Import Data"
3. Select your import format
4. Upload your file
5. Review the preview
6. Click "Import"

## After Import

Imported links are processed by our AI for summaries and categorization. This may take a few minutes for large imports.`
      },
      {
        title: 'Exporting Your Data',
        content: `## Export Formats

### JSON (Full Backup)
Includes all metadata, tags, notes, and AI-generated content. Best for backup or migrating to another service.

### Markdown
Each save becomes a .md file with frontmatter. Perfect for Obsidian, Notion, or other markdown-based tools.

### CSV
Spreadsheet-friendly format with key fields. Good for analysis or simple migrations.

## How to Export

1. Go to Settings → Import/Export
2. Click "Export Data"
3. Select your format
4. Choose what to include
5. Click "Download"

Your export will download immediately.`
      }
    ]
  }
]

// Code block component with copy button
const CodeBlock: React.FC<{ children: string }> = ({ children }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative bg-slate-900 rounded-lg sm:rounded-xl p-3 sm:p-4 my-3 sm:my-4 overflow-x-auto">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 rounded-md sm:rounded-lg text-slate-400 hover:text-white transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
      </button>
      <code className="text-xs sm:text-sm text-slate-300 font-mono">{children}</code>
    </div>
  )
}

// Article content renderer
const ArticleContent: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n')
  
  return (
    <div className="prose prose-slate max-w-none text-sm sm:text-base">
      {lines.map((line, index) => {
        // Headers
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-lg sm:text-xl font-bold text-slate-900 mt-6 sm:mt-8 mb-3 sm:mb-4 first:mt-0">{line.replace('## ', '')}</h2>
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-base sm:text-lg font-semibold text-slate-800 mt-4 sm:mt-6 mb-2 sm:mb-3">{line.replace('### ', '')}</h3>
        }
        // Code blocks
        if (line.startsWith('```')) {
          return null // Handle multi-line code blocks separately if needed
        }
        // Tables (simplified)
        if (line.startsWith('|')) {
          return (
            <div key={index} className="font-mono text-xs sm:text-sm text-slate-600 whitespace-pre my-1 overflow-x-auto">
              {line}
            </div>
          )
        }
        // List items
        if (line.startsWith('- ')) {
          return (
            <li key={index} className="text-slate-600 ml-3 sm:ml-4 list-disc text-sm sm:text-base">
              {line.replace('- ', '')}
            </li>
          )
        }
        if (line.match(/^\d+\. /)) {
          return (
            <li key={index} className="text-slate-600 ml-3 sm:ml-4 list-decimal text-sm sm:text-base">
              {line.replace(/^\d+\. /, '')}
            </li>
          )
        }
        // Empty lines
        if (line.trim() === '') {
          return <br key={index} />
        }
        // Regular paragraphs
        return (
          <p key={index} className="text-slate-600 mb-2 sm:mb-3 text-sm sm:text-base leading-relaxed">
            {line.split('**').map((part, i) => 
              i % 2 === 1 ? <strong key={i} className="text-slate-900 font-semibold">{part}</strong> : part
            )}
          </p>
        )
      })}
    </div>
  )
}

export const DocsPage: React.FC = () => {
  const navigate = useNavigate()
  const { loginWithRedirect } = useAuth0()
  const [activeSection, setActiveSection] = useState(docSections[0].id)
  const [activeArticle, setActiveArticle] = useState(0)

  const currentSection = docSections.find(s => s.id === activeSection) || docSections[0]

  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-1.5 sm:p-2 -ml-1.5 sm:-ml-2 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <img 
                src="/logo.svg" 
                alt="SmarTrack" 
                className="h-6 sm:h-7 w-auto cursor-pointer"
                onClick={() => navigate('/')}
              />
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="hidden sm:inline text-slate-600 font-medium">Documentation</span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/faq"
                className="hidden sm:inline text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium"
              >
                FAQ
              </Link>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => loginWithRedirect()}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl shadow-lg shadow-blue-600/20 transition-all"
              >
                <Chrome className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Get Started Free</span>
                <span className="sm:hidden">Start Free</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Mobile Section Selector */}
        <div className="lg:hidden mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {docSections.map((section) => {
              const Icon = section.icon
              const colors = colorClasses[section.color]
              const isActive = activeSection === section.id
              
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id)
                    setActiveArticle(0)
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                    isActive 
                      ? `${colors.bg} ${colors.text} border ${colors.border}` 
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{section.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar - Desktop only */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:block w-56 xl:w-64 flex-shrink-0"
          >
            <div className="sticky top-24 space-y-2">
              {docSections.map((section) => {
                const Icon = section.icon
                const colors = colorClasses[section.color]
                const isActive = activeSection === section.id
                
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id)
                      setActiveArticle(0)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                      isActive 
                        ? `${colors.bg} ${colors.text} border ${colors.border}` 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.title}</span>
                  </button>
                )
              })}
            </div>
          </motion.aside>

          {/* Main Content */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex-1 min-w-0"
          >
            {/* Section Header */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${colorClasses[currentSection.color].bg} ${colorClasses[currentSection.color].text}`}>
                  <currentSection.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{currentSection.title}</h1>
              </div>
              
              {/* Article tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                {currentSection.articles.map((article, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveArticle(index)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                      activeArticle === index
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {article.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Article Content */}
            <motion.div
              key={`${activeSection}-${activeArticle}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-8"
            >
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
                {currentSection.articles[activeArticle].title}
              </h2>
              <ArticleContent content={currentSection.articles[activeArticle].content} />
            </motion.div>

            {/* Quick Links */}
            <div className="mt-6 sm:mt-8 grid sm:grid-cols-2 gap-3 sm:gap-4">
              <Link
                to="/faq"
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center text-blue-600">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-sm sm:text-base">FAQ</div>
                  <div className="text-xs sm:text-sm text-slate-500 truncate">Common questions</div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </Link>
              <a
                href="mailto:smart.track.appp@gmail.com"
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center text-green-600">
                  <Command className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 group-hover:text-green-600 transition-colors text-sm sm:text-base">Get Support</div>
                  <div className="text-xs sm:text-sm text-slate-500 truncate">We're here to help</div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </a>
            </div>
          </motion.main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} SmarTrack. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
