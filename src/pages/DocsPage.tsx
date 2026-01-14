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

// Documentation sections with technical marketing content
const docSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Download,
    color: 'blue',
    description: 'Enterprise-grade setup in minutes',
    articles: [
      {
        title: 'Installation & Authentication',
        content: `## Installation

SmarTrack is distributed as a Chrome Web Store extension. Installation is a single-click process that takes less than 10 seconds.

**Installation Steps:**
1. Visit the Chrome Web Store listing for SmarTrack
2. Click "Add to Chrome" and confirm installation
3. The extension icon appears in your browser toolbar automatically

**Post-Installation:**
- No configuration required
- Automatic updates via Chrome Web Store
- Zero-downtime updates preserve your data

## Authentication

SmarTrack uses **Auth0** for enterprise-grade authentication, providing:

- **OAuth 2.0** secure authentication flow
- **Single Sign-On (SSO)** support for organizational accounts
- **Multi-factor authentication (MFA)** compatibility
- **Zero password storage** on our servers

**First-Time Setup:**
1. Click the SmarTrack extension icon
2. Select "Sign in with Google" (or your organization's SSO provider)
3. Authorize SmarTrack to access your basic profile
4. Your account is created automatically with secure token-based authentication

## Your First Capture

**Method 1: Extension Popup**
- Click the SmarTrack icon in your browser toolbar
- Review pre-filled metadata (title, URL, description)
- Add optional notes, tags, or category
- Press **Cmd/Ctrl + Enter** to save instantly

**Method 2: Right-Click Context Menu**
- Right-click anywhere on a webpage
- Select "Save to SmarTrack" from the context menu
- The extension popup opens with page details pre-filled

Your saved content appears in your dashboard within seconds, fully indexed and searchable.`
      },
      {
        title: 'System Requirements & Compatibility',
        content: `## Browser Compatibility

SmarTrack is built on **Chromium Manifest V3**, ensuring compatibility with:

- **Google Chrome** (v90+)
- **Microsoft Edge** (Chromium-based, all versions)
- **Brave Browser** (all versions)
- **Arc Browser** (all versions)
- **Opera** (Chromium-based, all versions)

**Technical Specifications:**
- **Manifest Version**: V3 (latest Chrome extension standard)
- **Storage API**: IndexedDB for offline capability
- **Network Protocol**: HTTPS-only (TLS 1.3)
- **Authentication**: OAuth 2.0 via Auth0

## System Requirements

**Minimum Requirements:**
- Operating System: Windows 10+, macOS 10.15+, or modern Linux distribution
- RAM: 2GB available (extension uses <50MB)
- Disk Space: 50MB for extension installation
- Network: Stable internet connection (HTTPS required)

**Recommended:**
- Modern browser with automatic updates enabled
- 4GB+ RAM for optimal performance with large libraries
- Broadband connection for fast content extraction

## Platform Roadmap

**Q2 2026**: Firefox support (WebExtensions API)
**Q3 2026**: Safari support (macOS/iOS)
**Q4 2026**: Native mobile applications (iOS/Android)`
      }
    ]
  },
  {
    id: 'saving-content',
    title: 'Content Capture',
    icon: Globe,
    color: 'green',
    description: 'Enterprise-grade content extraction and storage',
    articles: [
      {
        title: 'Capture Methods',
        content: `## Extension Popup (Primary Method)

Click the SmarTrack icon in your browser toolbar to open the capture interface. The extension automatically:

- **Extracts page metadata** (title, description, Open Graph tags)
- **Identifies content type** (article, PDF, video, etc.)
- **Pre-fills form fields** for rapid capture
- **Validates URL** and checks for duplicates

**Workflow:**
1. Click extension icon → Popup opens
2. Review auto-extracted metadata
3. Add optional notes, tags, or assign to a project
4. Press **Cmd/Ctrl + Enter** to save instantly

## Context Menu (Quick Capture)

Right-click anywhere on a webpage to access:

- **"Save to SmarTrack"** - Opens popup with current page
- **"Save Link"** - Captures selected link URL and text
- **"Open Dashboard"** - Quick access to your library

This method is ideal for rapid capture without interrupting your workflow.

## What Gets Captured

SmarTrack's content extraction engine captures:

**Core Metadata:**
- **URL** - Permanent canonical reference
- **Page Title** - Extracted from HTML title tag or Open Graph metadata
- **Description** - Meta description or first paragraph
- **Favicon** - Site icon for visual identification

**Content Extraction:**
- **Main Content** - Clean text extraction using BeautifulSoup
- **Content Type** - Automatic detection (webpage, PDF, article, video)
- **Metadata** - Author, publish date (when available)

**User-Added Data:**
- **Notes** - Personal annotations and highlights
- **Tags** - Custom organizational tags
- **Category** - Manual or auto-assigned categorization
- **Project Assignment** - Link to collections/projects

**Storage:**
- Content is stored in MongoDB with full-text indexing
- Automatic deduplication prevents duplicate saves
- Offline queue ensures no data loss during network interruptions`
      },
      {
        title: 'Content Type Support',
        content: `## Universal Web Content

SmarTrack's extraction engine handles all standard web content types:

**Articles & Blog Posts:**
- Intelligent content extraction removes navigation, ads, and sidebar elements
- Preserves article structure, headings, and formatting
- Captures author metadata and publication dates when available

**PDF Documents:**
- Text extraction from PDFs viewed in browser
- Preserves document structure and formatting
- Full-text searchable after capture

**Video Content (YouTube, Vimeo, etc.):**
- Captures video metadata (title, description, channel)
- Preserves video URL for direct access
- Extracts thumbnail images when available

**Social Media Platforms:**
- **Twitter/X**: Thread capture with full context
- **LinkedIn**: Post and article extraction
- **Reddit**: Thread and comment capture
- **Hacker News**: Discussion thread preservation

**Paywalled Content:**
- Captures content visible to authenticated users
- Creates permanent snapshot of accessible content
- Useful for subscription-based research archives

**Technical Limitations:**
- Content extraction works best with HTML-based pages
- JavaScript-rendered content requires page load completion
- Some dynamic content may require manual review`
      }
    ]
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    icon: Keyboard,
    color: 'purple',
    description: 'Accelerate your workflow with power user shortcuts',
    articles: [
      {
        title: 'Keyboard Shortcuts Reference',
        content: `## Extension Shortcuts

These shortcuts are available when using the extension popup:

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Save current page | ⌘ + Enter | Ctrl + Enter |
| Close popup | Escape | Escape |

**Usage:**
- Press **Cmd/Ctrl + Enter** while the extension popup is open to save instantly
- No need to click the "Save" button—accelerate your capture workflow

## Dashboard Shortcuts

These shortcuts work within the SmarTrack dashboard:

| Action | Mac | Windows/Linux | Description |
|--------|-----|---------------|-------------|
| Focus search | / | / | Instantly focus the search bar |
| Show all links | G | G | Navigate to main view |
| Show favorites | F | F | Filter to favorite links |
| Show recent | R | R | Show links from last 7 days |
| Show archived | A | A | View archived links |

**Power User Tips:**
- Press **/** anywhere in the dashboard to jump to search
- Use single-letter shortcuts (G, F, R, A) for instant filtering
- All shortcuts work without modifier keys for speed

## Customizing Extension Shortcuts

Extension shortcuts can be customized via Chrome's native shortcut manager:

1. Navigate to \`chrome://extensions/shortcuts\`
2. Locate "SmarTrack" in the extension list
3. Click the pencil icon next to any shortcut
4. Press your desired key combination
5. Changes apply immediately

**Note:** Dashboard shortcuts are fixed and cannot be customized. This ensures consistent keyboard navigation across all user sessions.`
      }
    ]
  },
  {
    id: 'organization',
    title: 'Organization',
    icon: FolderTree,
    color: 'amber',
    description: 'Enterprise-grade knowledge organization',
    articles: [
      {
        title: 'Projects & Collections',
        content: `## Project-Based Organization

Projects are SmarTrack's primary organizational structure, enabling hierarchical knowledge management for research teams and individual power users.

**Creating Projects:**
1. Navigate to the dashboard sidebar
2. Click **"+ New Project"**
3. Enter a descriptive project name (e.g., "Q1 Market Analysis")
4. Optionally add a description for team context
5. Project appears immediately in sidebar navigation

**Project Assignment Methods:**

**Method 1: During Capture**
- Select project from dropdown in extension popup
- Assignment happens at save time for immediate organization

**Method 2: Dashboard Assignment**
- Open link details from dashboard
- Use "Move to Project" action
- Supports bulk operations for multiple links

**Method 3: Sidebar Drag & Drop**
- Drag links directly onto project folders in sidebar
- Visual feedback confirms assignment
- Works with multiple link selection

**Best Practices:**
- Use projects for **thematic collections** (e.g., "Competitive Intelligence", "Technical Research")
- Keep project names **concise and searchable**
- Limit project depth to **2-3 levels** for optimal navigation
- Archive completed projects to maintain clean workspace`
      },
      {
        title: 'Tags & Categories',
        content: `## Tag-Based Organization

Tags provide flexible, multi-dimensional organization that complements project-based structure.

**Tag Management:**
- **Add tags** during capture or edit existing links
- **Multi-tag support** - assign unlimited tags per link
- **Tag autocomplete** - suggestions based on existing tags
- **Tag filtering** - filter dashboard by one or multiple tags

**Tag Best Practices:**
- Use **consistent naming** (e.g., "important" not "Important" or "IMPORTANT")
- Create **hierarchical tags** with separators (e.g., "tech:ai", "tech:ml")
- Leverage **common prefixes** for grouping (e.g., "client:", "project:")

## Category System

Categories provide high-level content classification:

**Available Categories:**
- Technology
- Business
- Research
- Design
- Science
- News
- Other

**Category Assignment:**
- **Manual assignment** during capture or editing
- Categories help with **broad filtering** and **content discovery**
- Use categories for **top-level organization** across all projects

**Category vs. Tags:**
- **Categories**: Broad classification (one per link)
- **Tags**: Specific attributes (multiple per link)
- **Projects**: Thematic collections (one per link)

This three-tier system (Projects → Categories → Tags) provides comprehensive organization at scale.`
      }
    ]
  },
  {
    id: 'search',
    title: 'Search & Discovery',
    icon: Search,
    color: 'blue',
    description: 'Enterprise search across your entire knowledge base',
    articles: [
      {
        title: 'Search Capabilities',
        content: `## Full-Text Search

SmarTrack's search engine indexes and searches across multiple content dimensions:

**Search Fields:**
- **Titles** - Page titles and metadata
- **URLs** - Full URL path matching
- **Descriptions** - Meta descriptions and extracted summaries
- **Full Content** - Complete extracted text content
- **User Notes** - Personal annotations and highlights
- **Tags** - All assigned tags

**Search Behavior:**
- **Real-time filtering** as you type
- **Case-insensitive** matching
- **Partial word matching** (e.g., "learn" matches "learning")
- **Multi-field search** across all indexed content simultaneously

## Advanced Filtering

Combine search with dashboard filters for precise results:

**Available Filters:**
- **Date Range** - Today, Last Week, Last Month, Last Year, All Time
- **Category** - Filter by content category
- **Content Type** - Webpage, PDF, Article, Video, Image, Document
- **Tags** - Filter by one or multiple tags
- **Status** - Favorites, Archived, Recent

**Filter Combinations:**
- Search + Date Range + Category = Highly targeted results
- Multiple filters can be active simultaneously
- Clear all filters with one click

## Search Autocomplete

The search interface provides intelligent autocomplete:

- **Title suggestions** - Matching link titles
- **Tag suggestions** - Existing tags with # prefix
- **URL suggestions** - Matching URLs
- **Keyboard navigation** - Arrow keys to navigate, Enter to select

Press **/** anywhere in the dashboard to instantly focus the search bar.`
      },
      {
        title: 'Discovery Features',
        content: `## Content Discovery

Beyond search, SmarTrack provides multiple discovery mechanisms:

**Recent Links:**
- Automatically surfaces links from the last 7 days
- Quick access via "Recent" filter or **R** keyboard shortcut
- Helps rediscover recently saved content

**Favorites:**
- Mark important links as favorites
- Quick access via "Favorites" filter or **F** keyboard shortcut
- Visual star indicator in link cards

**Category Browsing:**
- Browse links by category in sidebar
- See link counts per category
- One-click filtering by category

**Project Navigation:**
- Browse links organized by project
- Sidebar shows all projects with link counts
- Click project to filter dashboard

**Best Practices:**
- Use **favorites** for frequently-referenced content
- Leverage **categories** for broad content discovery
- Organize with **projects** for thematic research
- Combine **search + filters** for precise discovery`
      }
    ]
  },
  {
    id: 'ai-features',
    title: 'Intelligent Features',
    icon: Sparkles,
    color: 'pink',
    description: 'AI-powered content processing and organization',
    articles: [
      {
        title: 'Content Extraction & Processing',
        content: `## Automated Content Extraction

SmarTrack's content extraction engine processes every saved page:

**Extraction Pipeline:**
1. **HTML Parsing** - BeautifulSoup-based parsing for clean text extraction
2. **Content Cleaning** - Removes navigation, ads, and non-content elements
3. **Metadata Extraction** - Open Graph tags, meta descriptions, author info
4. **Content Type Detection** - Automatic classification (webpage, PDF, article, video)
5. **Text Indexing** - Full-text indexing for searchability

**What Gets Extracted:**
- **Main Content** - Clean, readable text (typically 50KB limit)
- **Page Title** - From HTML title or Open Graph
- **Description** - Meta description or first paragraph
- **Featured Image** - Open Graph image when available
- **Metadata** - Author, publish date, site information

**Technical Specifications:**
- **Extraction Engine**: BeautifulSoup with custom cleaning algorithms
- **Content Limit**: ~50KB per page (prevents excessive storage)
- **Processing Time**: Typically <2 seconds per page
- **Error Handling**: Graceful fallback if extraction fails

## Content Quality

**Best Results:**
- Well-structured HTML pages
- Standard article/blog formats
- Pages with semantic HTML markup

**Limitations:**
- JavaScript-heavy SPAs may require full page load
- Some dynamic content may not be captured
- Image-only content has limited text extraction`
      },
      {
        title: 'Organization Intelligence',
        content: `## Automatic Categorization

SmarTrack automatically assigns categories based on content analysis:

**Category Detection:**
- Analyzes page content and metadata
- Matches against predefined category taxonomy
- Assigns most relevant category automatically

**Available Categories:**
- Technology
- Business
- Research
- Design
- Science
- News
- Other

**Manual Override:**
- Edit category at any time from link details
- Your manual assignments take precedence
- System learns from your corrections

## Content Type Detection

Automatic detection of content types:

- **Webpage** - Standard HTML pages
- **PDF** - PDF documents
- **Article** - News articles and blog posts
- **Video** - Video hosting platforms
- **Image** - Image galleries and collections
- **Document** - Document formats
- **Other** - Unclassified content

Content type helps with filtering and organization workflows.`
      }
    ]
  },
  {
    id: 'import-export',
    title: 'Data Portability',
    icon: Upload,
    color: 'slate',
    description: 'Full control over your data with import and export',
    articles: [
      {
        title: 'Data Export',
        content: `## Export Your Knowledge Base

SmarTrack provides comprehensive data export capabilities, ensuring you maintain full control over your research data.

**Export Location:**
- Navigate to **Settings → Account** tab
- Find **"Export Data"** section
- Click **"Export All Links"** button

**Export Format:**
- **JSON** - Complete data structure with all metadata
- Includes: URLs, titles, descriptions, tags, categories, notes, timestamps
- Machine-readable format for backup and migration

**Export Process:**
1. Click "Export All Links" in Settings
2. JSON file downloads immediately
3. File contains all your saved links with complete metadata
4. File is named with timestamp for organization

**Use Cases:**
- **Backup** - Regular exports for data safety
- **Migration** - Transfer data to other systems
- **Analysis** - Import into analytics tools
- **Compliance** - GDPR/CCPA data portability requirements

**Technical Details:**
- Export includes all user-generated content
- Metadata preserved in structured format
- No data loss during export process
- File size depends on library size (typically <1MB per 100 links)`
      },
      {
        title: 'Data Import (Coming Soon)',
        content: `## Import Capabilities

Data import functionality is currently in development and will support:

**Planned Import Formats:**
- **Chrome Bookmarks** - HTML export format
- **Pocket Export** - JSON format
- **CSV** - Spreadsheet format
- **JSON** - SmarTrack export format (round-trip compatibility)

**Import Workflow (Planned):**
1. Navigate to Settings → Import/Export
2. Select import format
3. Upload your file
4. Preview imported items
5. Confirm and import

**Post-Import Processing:**
- Imported links will undergo content extraction
- Automatic categorization and tagging
- Full-text indexing for searchability
- Processing time scales with import size

**Status:**
Import functionality is scheduled for Q2 2026 release. Export is available immediately for all users.`
      }
    ]
  }
]

// Visual Chart Components for Tables
const KeyboardShortcutsChart: React.FC<{ data: Array<{ action: string; mac: string; windows: string }> }> = ({ data }) => {
  return (
    <div className="my-6 space-y-3">
      {data.map((item, index) => (
        <div key={index} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100 hover:shadow-md transition-all">
          <div className="font-semibold text-slate-900 mb-3">{item.action}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1.5 font-medium">Mac</div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {item.mac.split('+').map((key, i) => (
                    <kbd key={i} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm font-mono border border-slate-300">
                      {key.trim()}
                    </kbd>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1.5 font-medium">Windows/Linux</div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {item.windows.split('+').map((key, i) => (
                    <kbd key={i} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm font-mono border border-slate-300">
                      {key.trim()}
                    </kbd>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const SearchOperatorsChart: React.FC<{ data: Array<{ operator: string; example: string; description: string }> }> = ({ data }) => {
  const colors = ['bg-blue-50 border-blue-200', 'bg-green-50 border-green-200', 'bg-purple-50 border-purple-200', 'bg-amber-50 border-amber-200', 'bg-pink-50 border-pink-200', 'bg-slate-50 border-slate-200']
  
  return (
    <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {data.map((item, index) => (
        <div key={index} className={`${colors[index % colors.length]} rounded-xl p-4 border-2 hover:shadow-lg transition-all group`}>
          <div className="flex items-start justify-between mb-2">
            <code className="text-sm font-mono font-semibold text-slate-900 bg-white px-2 py-1 rounded border border-slate-300">
              {item.operator}
            </code>
          </div>
          <div className="mb-2">
            <div className="text-xs text-slate-500 mb-1">Example:</div>
            <code className="text-sm font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 block">
              {item.example}
            </code>
          </div>
          <div className="text-sm text-slate-600 leading-relaxed">{item.description}</div>
        </div>
      ))}
    </div>
  )
}

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

      // Tables - Convert to visual charts
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true
          tableRows = []
        }
        tableRows.push(line)
        return
      } else if (inTable) {
        // Render table as visual chart
        if (tableRows.length > 0) {
          const headers = tableRows[0].split('|').map(h => h.trim()).filter(h => h)
          const dataRows = tableRows.slice(2) // Skip separator row

          // Detect table type and render appropriate chart
          if (headers.length === 3 && (headers.includes('Mac') || headers.includes('Windows/Linux'))) {
            // Keyboard shortcuts table
            const shortcuts = dataRows.map(row => {
              const cells = row.split('|').map(c => c.trim()).filter(c => c)
              return {
                action: cells[0] || '',
                mac: cells[1] || '',
                windows: cells[2] || ''
              }
            })
            elements.push(
              <KeyboardShortcutsChart key={`chart-${index}`} data={shortcuts} />
            )
          } else if (headers.length === 3 && headers.includes('Operator')) {
            // Search operators table
            const operators = dataRows.map(row => {
              const cells = row.split('|').map(c => c.trim()).filter(c => c)
              return {
                operator: cells[0] || '',
                example: cells[1] || '',
                description: cells[2] || ''
              }
            })
            elements.push(
              <SearchOperatorsChart key={`chart-${index}`} data={operators} />
            )
          } else {
            // Generic table - render as visual cards
            elements.push(
              <div key={`table-${index}`} className="my-6 space-y-3">
                {dataRows.map((row, rowIndex) => {
                  const cells = row.split('|').map(c => c.trim()).filter(c => c)
                  return (
                    <div key={rowIndex} className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {cells.map((cell, cellIndex) => (
                          <div key={cellIndex}>
                            {cellIndex === 0 ? (
                              <div className="font-semibold text-slate-900 mb-1">{cell}</div>
                            ) : (
                              <div className="text-sm text-slate-600">
                                {headers[cellIndex] && (
                                  <span className="text-xs text-slate-500 font-medium mr-1">{headers[cellIndex]}:</span>
                                )}
                                {cell}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }
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
