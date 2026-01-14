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
  Upload, 
  ExternalLink,
  Copy,
  Check,
  Zap,
  Globe,
  Command,
  ChevronRight
} from 'lucide-react'

// Documentation sections with improved content
const docSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Download,
    color: 'blue',
    description: 'Quick setup guide to get you started',
    articles: [
      {
        title: 'Installing the Chrome Extension',
        content: `## Step 1: Install from Chrome Web Store

Visit the Chrome Web Store and click "Add to Chrome" to install the SmarTrack extension. The installation takes just a few seconds.

Once installed, you'll see the SmarTrack icon appear in your browser toolbar.

## Step 2: Sign In

1. Click the SmarTrack icon in your browser toolbar
2. Click "Sign in with Google" to authenticate
3. Authorize SmarTrack to access your basic profile

Your account will be created automatically upon first sign-in.

## Step 3: Save Your First Page

Navigate to any webpage you want to save, then:

- **Click the extension icon** in your toolbar, or
- **Use the keyboard shortcut**: ⌘+Shift+S (Mac) or Ctrl+Shift+S (Windows/Linux)

Your page is now saved and will appear in your dashboard immediately.`
      },
      {
        title: 'System Requirements',
        content: `## Supported Browsers

SmarTrack works with all Chromium-based browsers:

- **Google Chrome** (v90 or later)
- **Microsoft Edge** (Chromium-based)
- **Brave Browser**
- **Arc Browser**
- **Opera**

## Minimum Requirements

- Modern operating system (Windows 10+, macOS 10.15+, or Linux)
- Stable internet connection
- 50MB free disk space for the extension

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
    description: 'Learn how to capture and save web content',
    articles: [
      {
        title: 'How to Save a Page',
        content: `## Three Ways to Save

### 1. Extension Icon
Click the SmarTrack icon in your browser toolbar. A popup will appear with the page details pre-filled for your review.

### 2. Keyboard Shortcut
Use the quick save shortcut:
- **Mac**: ⌘ + Shift + S
- **Windows/Linux**: Ctrl + Shift + S

This instantly saves the current page without opening the popup.

### 3. Right-Click Menu
Right-click anywhere on the page and select "Save to SmarTrack" from the context menu.

## What Gets Saved

When you save a page, SmarTrack automatically captures:

- **Page URL** - Permanent reference to the original source
- **Page Title** - The title of the webpage
- **Main Content** - Clean, formatted text (ads and navigation removed)
- **Featured Image** - If available on the page
- **Your Notes** - Optional personal annotations
- **AI Summary** - Automatically generated summary of the content`
      },
      {
        title: 'Saving Different Content Types',
        content: `## Articles & Blog Posts

SmarTrack automatically extracts the main article content, intelligently removing navigation, ads, and other clutter to give you clean, readable text.

## Twitter/X Threads

Save any tweet URL and we'll capture the full thread, unrolled and formatted for easy reading.

## YouTube Videos

Save video pages to capture the title, description, and a direct link back to the video for future reference.

## PDF Documents

If you're viewing a PDF in your browser, save it like any other page. We'll extract the text content for searchability.

## Paywalled Content

If you have access to read the content (via subscription), SmarTrack can save it. We capture exactly what you can see on the page.

## Social Media

We support Twitter/X, LinkedIn posts, Reddit threads, and Hacker News discussions with optimized extraction for each platform.`
      }
    ]
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    icon: Keyboard,
    color: 'purple',
    description: 'Power user shortcuts for faster workflows',
    articles: [
      {
        title: 'All Keyboard Shortcuts',
        content: `## Extension Shortcuts

These shortcuts work when browsing the web:

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Save current page | ⌘ + Shift + S | Ctrl + Shift + S |
| Open extension popup | ⌘ + Shift + E | Ctrl + Shift + E |

## Dashboard Shortcuts

These shortcuts work in your SmarTrack dashboard:

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Search | ⌘ + K | Ctrl + K |
| New capture | ⌘ + N | Ctrl + N |
| Toggle sidebar | ⌘ + \\ | Ctrl + \\ |
| Go to settings | ⌘ + , | Ctrl + , |

## Customizing Shortcuts

You can customize extension shortcuts:

1. Go to \`chrome://extensions/shortcuts\` in Chrome
2. Find SmarTrack in the list
3. Click the pencil icon to edit shortcuts
4. Press your desired key combination

Note: Dashboard shortcuts cannot be customized at this time.`
      }
    ]
  },
  {
    id: 'organization',
    title: 'Organization',
    icon: FolderTree,
    color: 'amber',
    description: 'Organize your knowledge with projects and tags',
    articles: [
      {
        title: 'Projects & Collections',
        content: `## Creating a Project

Projects help you organize related saves into focused collections:

1. In the dashboard sidebar, click "+ New Project"
2. Enter a descriptive project name
3. Optionally add a description and choose a color theme

## Adding Saves to Projects

You can assign saves to projects in multiple ways:

- **When saving**: Select a project from the dropdown in the save dialog
- **From dashboard**: Drag and drop saves into project folders in the sidebar
- **Bulk assign**: Select multiple saves and use "Move to Project" from the actions menu

## Project Organization Tips

- Use projects for major research themes (e.g., "Market Research", "Competitor Analysis")
- Keep project names concise and descriptive
- Pin frequently-used projects for quick access in the sidebar`
      },
      {
        title: 'Tags & Categories',
        content: `## Auto-Tagging

SmarTrack's AI automatically suggests relevant tags based on content analysis. You can:

- Accept suggested tags with one click
- Remove unwanted tags
- Add custom tags for personal organization

## Manual Tagging

Add tags in the save dialog or edit them later from the dashboard. Tags help with filtering and discovery across your entire library.

## Categories

Categories are AI-assigned based on content type and automatically organized:

- Technology
- Business
- Research
- Design
- Science
- News
- And more...

You can override the auto-assigned category if needed by editing the save.`
      }
    ]
  },
  {
    id: 'search',
    title: 'Search & Discovery',
    icon: Search,
    color: 'blue',
    description: 'Find anything in your knowledge base instantly',
    articles: [
      {
        title: 'Searching Your Library',
        content: `## Basic Search

Type any word or phrase in the search bar. SmarTrack searches across:

- Titles
- URLs
- Descriptions
- Full page content
- Your notes
- Tags

## Search Operators

Use these operators to refine your searches:

| Operator | Example | Description |
|----------|---------|-------------|
| "quotes" | "machine learning" | Exact phrase match |
| tag: | tag:important | Filter by tag |
| project: | project:research | Filter by project |
| from: | from:nytimes.com | Filter by domain |
| before: | before:2026-01-01 | Before date |
| after: | after:2025-06-01 | After date |

## Combining Operators

You can combine multiple operators for precise searches:

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

Our AI analyzes the semantic meaning of your query and matches it against the content of your saves, going beyond simple keyword matching to understand context and intent.

## Tips for Better Results

1. **Be specific**: Include context about what you're looking for
2. **Use natural language**: Write queries as you would ask a colleague
3. **Include context**: Specify use case ("for my startup" vs. "for enterprise")`
      }
    ]
  },
  {
    id: 'ai-features',
    title: 'AI Features',
    icon: Sparkles,
    color: 'pink',
    description: 'Leverage AI for smarter knowledge management',
    articles: [
      {
        title: 'AI Summaries',
        content: `## Automatic Summarization

When you save a page, our AI automatically generates:

- **Concise summary** (2-3 sentences capturing key points)
- **Key takeaways** (bullet points of main insights)
- **Main topics** (identified themes and subjects)

## Regenerating Summaries

If the summary isn't quite right:

1. Open the save in your dashboard
2. Click the "..." menu
3. Select "Regenerate Summary"

The AI will create a new summary based on the latest content.

## Summary Quality

Our AI works best with:

- Well-structured articles and blog posts
- English content (other languages improving)
- Text-heavy pages with substantial content

It may struggle with:

- Image-heavy pages with minimal text
- Very short pages or snippets
- Poorly formatted content`
      },
      {
        title: 'Smart Categorization',
        content: `## How It Works

Our AI analyzes the content and automatically:

- Assigns a relevant category
- Suggests appropriate tags
- Identifies related saves in your library

## Accuracy

Auto-categorization is correct approximately 90% of the time. You can always:

- Edit the category manually
- The system learns from your corrections over time

## Related Content

On each save's detail page, you'll see "Related Saves" powered by AI. This helps you discover connections and patterns in your knowledge base that you might not have noticed.`
      }
    ]
  },
  {
    id: 'import-export',
    title: 'Import & Export',
    icon: Upload,
    color: 'slate',
    description: 'Bring your data in and take it with you',
    articles: [
      {
        title: 'Importing Data',
        content: `## Supported Import Formats

SmarTrack supports importing from:

- Chrome bookmarks (HTML export)
- Pocket export
- Raindrop.io export
- Notion database export
- CSV file
- JSON file

## How to Import

1. Go to **Settings → Import/Export**
2. Click **"Import Data"**
3. Select your import format
4. Upload your file
5. Review the preview of items to be imported
6. Click **"Import"** to complete

## After Import

Imported links are automatically processed by our AI for summaries and categorization. This may take a few minutes for large imports (100+ items).`
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

1. Go to **Settings → Import/Export**
2. Click **"Export Data"**
3. Select your preferred format
4. Choose what to include (all data, specific projects, date ranges)
5. Click **"Download"**

Your export will download immediately. Large exports may take a moment to prepare.`
      }
    ]
  }
]

// Improved markdown renderer with proper formatting
const ArticleContent: React.FC<{ content: string }> = ({ content }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let inCodeBlock = false
    let codeBlockContent: string[] = []
    let codeBlockLanguage = ''
    let inTable = false
    let tableRows: string[] = []
    let inList = false
    let listItems: string[] = []
    let listType: 'ul' | 'ol' = 'ul'

    lines.forEach((line, index) => {
      // Code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          const code = codeBlockContent.join('\n')
          elements.push(
            <div key={`code-${index}`} className="relative my-6 group">
              <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
                  <span className="text-xs text-slate-400 font-mono">{codeBlockLanguage || 'text'}</span>
                  <button
                    onClick={() => handleCopyCode(code)}
                    className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                    title="Copy code"
                  >
                    {copiedCode === code ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto">
                  <code className="text-sm text-slate-300 font-mono leading-relaxed">{code}</code>
                </pre>
              </div>
            </div>
          )
          codeBlockContent = []
          codeBlockLanguage = ''
          inCodeBlock = false
        } else {
          // Start code block
          codeBlockLanguage = line.replace('```', '').trim()
          inCodeBlock = true
        }
        return
      }

      if (inCodeBlock) {
        codeBlockContent.push(line)
        return
      }

      // Headers
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="text-2xl font-bold text-slate-900 mt-8 mb-4 first:mt-0">
            {line.replace('## ', '')}
          </h2>
        )
        return
      }

      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="text-xl font-semibold text-slate-900 mt-6 mb-3">
            {line.replace('### ', '')}
          </h3>
        )
        return
      }

      // Tables
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true
          tableRows = []
        }
        tableRows.push(line)
        return
      } else if (inTable) {
        // Render table
        if (tableRows.length > 0) {
          const headers = tableRows[0].split('|').map(h => h.trim()).filter(h => h)
          const dataRows = tableRows.slice(2) // Skip separator row

          elements.push(
            <div key={`table-${index}`} className="my-6 overflow-x-auto">
              <table className="w-full border-collapse border border-slate-200 rounded-lg">
                <thead>
                  <tr className="bg-slate-50">
                    {headers.map((header, i) => (
                      <th key={i} className="px-4 py-3 text-left text-sm font-semibold text-slate-900 border-b border-slate-200">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, rowIndex) => {
                    const cells = row.split('|').map(c => c.trim()).filter(c => c)
                    return (
                      <tr key={rowIndex} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        {cells.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-3 text-sm text-slate-600">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        }
        inTable = false
        tableRows = []
      }

      // Lists
      if (line.startsWith('- ') || line.startsWith('* ')) {
        if (!inList || listType !== 'ul') {
          if (inList) {
            elements.push(
              listType === 'ul' ? (
                <ul key={`list-${index}-start`} className="list-disc list-inside space-y-2 my-4 text-slate-600">
                  {listItems.map((item, i) => (
                    <li key={i} className="pl-2">{item}</li>
                  ))}
                </ul>
              ) : (
                <ol key={`list-${index}-start`} className="list-decimal list-inside space-y-2 my-4 text-slate-600">
                  {listItems.map((item, i) => (
                    <li key={i} className="pl-2">{item}</li>
                  ))}
                </ol>
              )
            )
          }
          listItems = []
          listType = 'ul'
          inList = true
        }
        listItems.push(line.replace(/^[-*] /, ''))
        return
      }

      if (line.match(/^\d+\. /)) {
        if (!inList || listType !== 'ol') {
          if (inList) {
            elements.push(
              listType === 'ul' ? (
                <ul key={`list-${index}-start`} className="list-disc list-inside space-y-2 my-4 text-slate-600">
                  {listItems.map((item, i) => (
                    <li key={i} className="pl-2">{item}</li>
                  ))}
                </ul>
              ) : (
                <ol key={`list-${index}-start`} className="list-decimal list-inside space-y-2 my-4 text-slate-600">
                  {listItems.map((item, i) => (
                    <li key={i} className="pl-2">{item}</li>
                  ))}
                </ol>
              )
            )
          }
          listItems = []
          listType = 'ol'
          inList = true
        }
        listItems.push(line.replace(/^\d+\. /, ''))
        return
      }

      if (inList && line.trim() === '') {
        elements.push(
          listType === 'ul' ? (
            <ul key={`list-${index}`} className="list-disc list-inside space-y-2 my-4 text-slate-600">
              {listItems.map((item, i) => (
                <li key={i} className="pl-2">{item}</li>
              ))}
            </ul>
          ) : (
            <ol key={`list-${index}`} className="list-decimal list-inside space-y-2 my-4 text-slate-600">
              {listItems.map((item, i) => (
                <li key={i} className="pl-2">{item}</li>
              ))}
            </ol>
          )
        )
        listItems = []
        inList = false
      }

      // Empty lines
      if (line.trim() === '') {
        if (!inList) {
          elements.push(<br key={index} />)
        }
        return
      }

      // Regular paragraphs (only if not in list or table)
      if (!inList && !inTable) {
        const parts = line.split(/(\*\*.*?\*\*)/g)
        const formattedLine = parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={i} className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-slate-800">{part.slice(1, -1)}</code>
          }
          return part
        })

        elements.push(
          <p key={index} className="text-slate-600 mb-4 text-base leading-relaxed">
            {formattedLine}
          </p>
        )
      }
    })

    // Close any remaining lists
    if (inList && listItems.length > 0) {
      elements.push(
        listType === 'ul' ? (
          <ul key="list-final" className="list-disc list-inside space-y-2 my-4 text-slate-600">
            {listItems.map((item, i) => (
              <li key={i} className="pl-2">{item}</li>
            ))}
          </ul>
        ) : (
          <ol key="list-final" className="list-decimal list-inside space-y-2 my-4 text-slate-600">
            {listItems.map((item, i) => (
              <li key={i} className="pl-2">{item}</li>
            ))}
          </ol>
        )
      )
    }

    return elements
  }

  return (
    <div className="prose prose-slate max-w-none">
      {renderMarkdown(content)}
    </div>
  )
}

export const DocsPage: React.FC = () => {
  const navigate = useNavigate()
  const { loginWithRedirect } = useAuth0()
  const [activeSection, setActiveSection] = useState(docSections[0].id)
  const [activeArticle, setActiveArticle] = useState(0)

  const currentSection = docSections.find(s => s.id === activeSection) || docSections[0]

  const colorClasses: Record<string, { bg: string; text: string; border: string; hover: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', hover: 'hover:bg-blue-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', hover: 'hover:bg-green-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', hover: 'hover:bg-purple-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', hover: 'hover:bg-amber-100' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', hover: 'hover:bg-pink-100' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', hover: 'hover:bg-slate-200' }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-50"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <img 
                src="/logo.svg" 
                alt="SmarTrack" 
                className="h-7 w-auto cursor-pointer"
                onClick={() => navigate('/')}
              />
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="hidden sm:inline text-slate-600 font-medium">Documentation</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Link
                to="/faq"
                className="hidden sm:inline text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium"
              >
                FAQ
              </Link>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => loginWithRedirect()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-600/20 transition-all"
              >
                <Chrome className="w-4 h-4" />
                <span className="hidden sm:inline">Get Started Free</span>
                <span className="sm:hidden">Start Free</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-sm text-blue-700 font-medium mb-4">
            <BookOpen className="w-4 h-4" />
            Complete Documentation
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            SmarTrack Documentation
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Everything you need to know to get the most out of your knowledge curation system
          </p>
        </motion.div>

        {/* Mobile Section Selector */}
        <div className="lg:hidden mb-6">
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
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    isActive 
                      ? `${colors.bg} ${colors.text} border ${colors.border}` 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
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
            className="hidden lg:block w-64 flex-shrink-0"
          >
            <div className="sticky top-28 space-y-1">
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
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{section.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{section.description}</div>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
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
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[currentSection.color].bg} ${colorClasses[currentSection.color].text}`}>
                  <currentSection.icon className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{currentSection.title}</h1>
                  <p className="text-slate-600 mt-1">{currentSection.description}</p>
                </div>
              </div>
              
              {/* Article tabs */}
              {currentSection.articles.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {currentSection.articles.map((article, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveArticle(index)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        activeArticle === index
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {article.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Article Content */}
            <motion.div
              key={`${activeSection}-${activeArticle}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {currentSection.articles[activeArticle].title}
              </h2>
              <ArticleContent content={currentSection.articles[activeArticle].content} />
            </motion.div>

            {/* Quick Links */}
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              <Link
                to="/faq"
                className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group border border-slate-200"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">FAQ</div>
                  <div className="text-sm text-slate-500">Common questions answered</div>
                </div>
                <ExternalLink className="w-5 h-5 text-slate-400 flex-shrink-0" />
              </Link>
              <a
                href="mailto:smart.track.appp@gmail.com"
                className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group border border-slate-200"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 flex-shrink-0">
                  <Command className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 group-hover:text-green-600 transition-colors">Get Support</div>
                  <div className="text-sm text-slate-500">We're here to help</div>
                </div>
                <ExternalLink className="w-5 h-5 text-slate-400 flex-shrink-0" />
              </a>
            </div>
          </motion.main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-600 text-sm">
            © {new Date().getFullYear()} SmarTrack. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
