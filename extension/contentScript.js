/**
 * SmarTrack Content Script
 * Handles page content extraction and communication with popup
 */

// Prevent multiple initializations
if (typeof window.smartrackContentScript === 'undefined') {
  window.smartrackContentScript = true;

  class SmarTrackContentScript {
    constructor() {
      this.isInitialized = false;
      this.init();
    }

    init() {
      if (this.isInitialized) return;
      this.isInitialized = true;

      console.log('[SRT] Content script loaded on:', window.location.href);
      
      // Setup message listeners
      this.setupMessageListeners();
      
      // Initialize IndexedDB for local storage
      this.initIndexedDB();
    }

  setupMessageListeners() {
    // Listen for messages from popup
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SRT_REQUEST_AUTH_TOKEN') {
        this.handleTokenRequest(event.data.messageId);
      }
    });

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleBackgroundMessage(request, sender, sendResponse);
    });
  }

  async handleTokenRequest(messageId) {
    try {
      // Try to get token from localStorage (set by frontend)
      const token = localStorage.getItem('authToken');
      
      if (token) {
        // Send token back to popup
        window.postMessage({
          type: 'SRT_AUTH_TOKEN_RESPONSE',
          messageId: messageId,
          token: token
        }, '*');
      } else {
        // No token available
        window.postMessage({
          type: 'SRT_AUTH_TOKEN_RESPONSE',
          messageId: messageId,
          token: null
        }, '*');
      }
    } catch (error) {
      console.error('[SRT] Failed to handle token request:', error);
      window.postMessage({
        type: 'SRT_AUTH_TOKEN_RESPONSE',
        messageId: messageId,
        token: null
      }, '*');
    }
  }

  async handleBackgroundMessage(request, sender, sendResponse) {
    try {
      switch (request.type) {
        case 'EXTRACT_PAGE_DATA':
          const pageData = this.extractPageData();
          sendResponse({ success: true, data: pageData });
          break;
          
        case 'SAVE_LINK':
          const result = await this.saveLink(request.data);
          sendResponse({ success: true, result: result });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[SRT] Background message handling failed:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  extractPageData() {
    const getMetaContent = (name) => {
      const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      return meta ? meta.getAttribute('content') : null;
    };

    return {
      title: document.title,
      url: window.location.href,
      description: getMetaContent('description') || getMetaContent('og:description'),
      image: getMetaContent('og:image'),
      siteName: getMetaContent('og:site_name'),
      author: getMetaContent('author'),
      publishedDate: getMetaContent('article:published_time'),
      pageText: this.extractPageText(),
      favicon: this.getFaviconUrl()
    };
  }

  extractPageText() {
    try {
      // Remove script and style elements
      const clone = document.cloneNode(true);
      const scripts = clone.querySelectorAll('script, style, nav, header, footer, aside');
      scripts.forEach(el => el.remove());
      
      // Get text content
      const text = clone.body.innerText || clone.body.textContent || '';
      
      // Clean up and limit length
      return text.replace(/\s+/g, ' ').trim().substring(0, 2000);
    } catch (error) {
      console.error('[SRT] Failed to extract page text:', error);
      return '';
    }
  }

  getFaviconUrl() {
    const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    if (favicon) {
      const href = favicon.getAttribute('href');
      return href.startsWith('http') ? href : new URL(href, window.location.origin).href;
    }
    return `${window.location.origin}/favicon.ico`;
  }

  async saveLink(linkData) {
    try {
      // Save to IndexedDB
      const link = {
        id: Date.now().toString(),
        ...linkData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.saveToIndexedDB(link);
      
      // Notify background script
      chrome.runtime.sendMessage({
        type: 'LINK_SAVED',
        link: link
      });

      return link;
    } catch (error) {
      console.error('[SRT] Failed to save link:', error);
      throw error;
    }
  }

  async initIndexedDB() {
    try {
      const request = indexedDB.open('smartResearchDB', 1);
      
      request.onerror = () => {
        console.error('[SRT] IndexedDB failed to open');
      };
      
      request.onsuccess = () => {
        console.log('[SRT] ✅ IndexedDB connection established successfully');
        this.db = request.result;
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create links store
        if (!db.objectStoreNames.contains('links')) {
          const linksStore = db.createObjectStore('links', { keyPath: 'id' });
          linksStore.createIndex('url', 'url', { unique: false });
          linksStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    } catch (error) {
      console.error('[SRT] Failed to initialize IndexedDB:', error);
    }
  }

  async saveToIndexedDB(link) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['links'], 'readwrite');
      const store = transaction.objectStore('links');
      const request = store.add(link);

      request.onsuccess = () => {
        console.log('[SRT] Link saved to IndexedDB:', link.id);
        resolve(link);
      };

      request.onerror = () => {
        console.error('[SRT] Failed to save link to IndexedDB');
        reject(new Error('Failed to save link'));
      };
    });
  }
}

// Initialize content script
new SmarTrackContentScript();
}
