# SmarTrack Chrome Extension

A Chrome extension for saving and organizing research links with AI-powered insights.

## Features

- **One-Click Save**: Save any webpage to your research library
- **Content Extraction**: Automatically extracts page title, description, and metadata
- **Smart Categorization**: Organize links by category and priority
- **Tag Management**: Add custom tags for better organization
- **Backend Sync**: Syncs with Python FastAPI backend
- **Local Storage**: Works offline with local IndexedDB storage

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the extension folder
4. The SmarTrack icon should appear in your toolbar

## Usage

1. **Save a Link**: Click the SmarTrack icon on any webpage
2. **Fill Details**: Add title, description, category, and tags
3. **Save**: Click "Save Link" to add to your research library
4. **View**: Access your saved links in the SmarTrack dashboard

## Configuration

The extension automatically detects:
- Page title and description
- Open Graph metadata
- Article author and publish date
- Content type (webpage, PDF, video, etc.)

## Backend Integration

The extension connects to the Python FastAPI backend for:
- User authentication via Auth0
- Link storage and retrieval
- Real-time synchronization
- Usage statistics

## Development

To modify the extension:

1. Edit the source files in this directory
2. Go to `chrome://extensions/`
3. Click the refresh icon on the SmarTrack extension
4. Test your changes

## Files

- `manifest.json` - Extension configuration
- `popup.html` - Extension popup interface
- `popup.js` - Popup functionality
- `contentScript.js` - Page content extraction
- `background.js` - Background processing
- `utils/backendApi.js` - Backend API integration

## Permissions

- `activeTab` - Access current tab information
- `storage` - Store links and settings
- `scripting` - Inject content scripts
- `host_permissions` - Access all websites for content extraction
