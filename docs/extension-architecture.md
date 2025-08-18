# Extension Architecture

## Overview

Smart Research Tracker uses an **extension-first storage architecture** where the browser extension (`chrome.storage.local`) is the primary data store, with the dashboard's IndexedDB serving as a fallback and local cache. This design ensures data persistence across browser sessions and provides resilience when the extension context is invalidated.

## Storage Hierarchy

### 1. Primary Storage: Extension Storage
- **Location**: `chrome.storage.local` (persistent across browser sessions)
- **Content**: Links, summaries, settings, labels
- **Access**: Background script, content script, popup
- **Persistence**: Survives browser restarts, extension updates

### 2. Secondary Storage: Dashboard IndexedDB
- **Location**: Local browser IndexedDB (Dexie.js)
- **Content**: Mirrored data from extension storage
- **Access**: Dashboard web application
- **Persistence**: Local to browser, cleared with browser data

### 3. Fallback Storage: Content Script Cache
- **Location**: In-memory cache + localStorage
- **Content**: Temporary link storage during page reloads
- **Access**: Content script only
- **Persistence**: Session-based, cleared on page refresh

## Component Architecture

### Extension Components

#### Background Script (`background.js`)
- **Role**: Service worker, primary data manager
- **Responsibilities**:
  - Link storage and retrieval
  - Duplicate detection
  - Badge management (stuck links counting)
  - Communication with content scripts
  - AI summary processing

#### Content Script (`contentScript.js`)
- **Role**: Bridge between web pages and extension
- **Responsibilities**:
  - Page data extraction
  - Communication with dashboard
  - Safe storage operations (no IndexedDB)
  - Ready state signaling (`CS_READY`)

#### Popup (`popup.js` + `popup.html`)
- **Role**: User interface for saving links
- **Responsibilities**:
  - Link metadata input
  - Duplicate confirmation popup
  - Save operation initiation

### Dashboard Components

#### Link Store (`linkStore.ts`)
- **Role**: Central state management for links
- **Responsibilities**:
  - Fetch links from extension storage
  - Deduplicate links by URL
  - Fallback to local IndexedDB
  - Merge data from multiple sources

#### Link Service (`linkService.ts`)
- **Role**: Data access abstraction layer
- **Responsibilities**:
  - Communication with extension via `postMessage`
  - Local IndexedDB operations
  - Error handling and fallbacks

## Data Flow

### 1. Link Saving Flow
```
User clicks "Save Link" in popup
    ↓
Background script checks for duplicates
    ↓
If duplicates found → Show confirmation popup
    ↓
User confirms → Save to extension storage
    ↓
Broadcast to all dashboard tabs
    ↓
Dashboard updates display
```

### 2. Link Retrieval Flow
```
Dashboard loads
    ↓
Try extension storage first (background script)
    ↓
If no response → Try content script via postMessage
    ↓
If still no response → Use local IndexedDB
    ↓
Deduplicate and display links
```

### 3. Badge Update Flow
```
Background script counts total links
    ↓
Find all dashboard tabs
    ↓
Query each tab for displayed links
    ↓
Calculate stuck links (total - displayed)
    ↓
Update badge with count and color
```

## Communication Patterns

### Extension ↔ Dashboard
- **Primary**: `chrome.tabs.sendMessage` with `sendResponse`
- **Fallback**: `window.postMessage` bridge
- **Protocol**: Message types like `SRT_GET_LINKS`, `SRT_ADD_LINK`

### Background ↔ Content Script
- **Direct**: `chrome.tabs.sendMessage`
- **Ready State**: `CS_READY` message for tab tracking
- **Response**: `sendResponse` or `window.postMessage`

### Content Script ↔ Web Page
- **Bridge**: `window.postMessage` for dashboard communication
- **Isolation**: Content script runs in isolated world

## Error Handling & Resilience

### Extension Context Invalidation
- **Problem**: Extension context becomes invalid during page reloads
- **Solution**: Safe storage helpers that don't require live chrome APIs
- **Fallback**: In-memory cache + localStorage

### Communication Failures
- **Problem**: Messages fail to reach content scripts
- **Solution**: Ready tab tracking, retry mechanisms
- **Fallback**: Content script injection and retry

### Storage Failures
- **Problem**: IndexedDB blocked or unavailable
- **Solution**: Extension storage as primary, graceful degradation
- **Fallback**: Empty arrays, user notifications

## UI Architecture

### Add Link Button Placement
- **Location**: Only in Quick Actions sidebar section
- **Rationale**: Cleaner main interface, intentional placement
- **Access**: Dashboard users can add links manually if needed

### Duplicate Detection UI
- **Location**: Extension popup
- **Flow**: Detection → Confirmation → Action
- **User Choice**: Save anyway or cancel

### Badge Logic
- **Display**: Red badge with count for stuck links
- **Logic**: Links in storage but not displayed on dashboard
- **Update**: Real-time as links are saved/removed

## Security & Privacy

### Data Isolation
- **Extension**: Runs in isolated world, can't access page data directly
- **Content Script**: Limited access to page DOM, no sensitive data exposure
- **Dashboard**: Web application with standard browser security

### Storage Security
- **Extension Storage**: Chrome-managed, encrypted
- **IndexedDB**: Local browser storage, user-controlled
- **No Cloud Storage**: All data stays local to user's browser

## Performance Considerations

### Lazy Initialization
- **IndexedDB**: Only initialized when needed
- **Content Script**: Minimal overhead, safe operations only
- **Background Script**: Efficient message routing

### Caching Strategy
- **Extension Storage**: Primary cache, always available
- **Content Script**: Session cache for immediate access
- **Dashboard**: Merged cache with deduplication

### Message Efficiency
- **Batch Operations**: Multiple operations in single message
- **Response Caching**: Avoid repeated requests for same data
- **Timeout Handling**: Prevent hanging on unresponsive tabs

## Future Enhancements

### Planned Improvements
- **Smart Deduplication**: Semantic similarity detection
- **Cross-Device Sync**: Optional cloud storage integration
- **Advanced Filtering**: AI-powered link organization
- **Performance Monitoring**: Real-time extension health metrics

### Architecture Evolution
- **Service Worker**: Enhanced background processing
- **Message Queuing**: Reliable message delivery
- **Storage Optimization**: Compression and indexing
- **API Integration**: External service connectors
