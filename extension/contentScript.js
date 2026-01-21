/**
 * SmarTrack Content Script
 * Handles page content extraction and communication with popup/background
 * 
 * @fileoverview Content script injected into web pages for metadata extraction
 * @version 2.0.0
 */

// ============================================================================
// Constants
// ============================================================================

const CONTENT_SCRIPT_CONSTANTS = {
  // Message Types
  MESSAGE_TYPES: {
    REQUEST_AUTH_TOKEN: 'SRT_REQUEST_AUTH_TOKEN',
    AUTH_TOKEN_RESPONSE: 'SRT_AUTH_TOKEN_RESPONSE',
    EXTRACT_PAGE_DATA: 'EXTRACT_PAGE_DATA',
    SAVE_LINK: 'SAVE_LINK',
    LINK_SAVED: 'LINK_SAVED'
  },
  
  // Storage
  INDEXEDDB_NAME: 'smartResearchDB',
  INDEXEDDB_VERSION: 1,
  OBJECT_STORE_NAME: 'links',
  
  // Text Extraction
  MAX_PAGE_TEXT_LENGTH: 2000,
  ELEMENTS_TO_REMOVE: ['script', 'style', 'nav', 'header', 'footer', 'aside'],
  
  // Meta Tags
  META_TAGS: {
    DESCRIPTION: ['description', 'og:description', 'twitter:description'],
    IMAGE: ['og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image', 'twitter:image:src', 'image', 'thumbnail'],
    SITE_NAME: ['og:site_name'],
    AUTHOR: ['author'],
    PUBLISHED_DATE: ['article:published_time']
  }
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Gets meta content from page
 * @param {string|Array<string>} names - Meta name(s) to search for
 * @returns {string|null}
 */
const getMetaContent = (names) => {
  const nameArray = Array.isArray(names) ? names : [names];
  
  for (const name of nameArray) {
    const meta = document.querySelector(
      `meta[name="${name}"], meta[property="${name}"]`
    );
    if (meta) {
      const content = meta.getAttribute('content');
      if (content) return content;
    }
  }
  
  return null;
};

/**
 * Gets favicon URL from page
 * @returns {string}
 */
const getFaviconUrl = () => {
  const favicon = document.querySelector(
    'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
  );
  
  if (favicon) {
    const href = favicon.getAttribute('href');
    if (!href) return '';
    
    try {
      if (href.startsWith('http://') || href.startsWith('https://')) {
        return href;
      }
      return new URL(href, window.location.origin).href;
    } catch {
      return href;
    }
  }
  
  // Fallback to default favicon
  try {
    return new URL('/favicon.ico', window.location.origin).href;
  } catch {
    return '';
  }
};

/**
 * Converts image URL to absolute URL
 * @param {string|null} imageUrl - Image URL (may be relative)
 * @returns {string|null}
 */
const getAbsoluteImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return null;
  }
  
  // If already absolute URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Convert relative URL to absolute
  try {
    // Handle protocol-relative URLs (//example.com/image.jpg)
    if (imageUrl.startsWith('//')) {
      return window.location.protocol + imageUrl;
    }
    // Convert relative URL to absolute
    return new URL(imageUrl, window.location.origin).href;
  } catch (error) {
    // If URL construction fails, return original
    console.debug('[SRT] Failed to convert image URL to absolute:', error);
    return imageUrl;
  }
};

/**
 * Finds the first large image on the page as fallback
 * @returns {string|null}
 */
const findFirstLargeImage = () => {
  try {
    const url = window.location.href;
    
    // Check for lazy-loaded images first (common on Medium and modern sites)
    const lazyImages = Array.from(document.querySelectorAll('img[data-src], img[data-lazy-src], img[data-original]'));
    for (const img of lazyImages) {
      const lazySrc = img.getAttribute('data-src') || 
                     img.getAttribute('data-lazy-src') || 
                     img.getAttribute('data-original');
      if (lazySrc && !lazySrc.startsWith('data:image/gif') && !lazySrc.includes('1x1')) {
        const width = img.naturalWidth || img.width || img.offsetWidth || 0;
        const height = img.naturalHeight || img.height || img.offsetHeight || 0;
        if (width >= 100 || height >= 100 || (width === 0 && height === 0)) {
          return getAbsoluteImageUrl(lazySrc);
        }
      }
    }
    
    // Check regular img tags
    const images = document.querySelectorAll('img[src]');
    for (const img of images) {
      const src = img.getAttribute('src');
      if (!src || src.startsWith('data:image/gif') || src.includes('1x1')) continue;
      
      const width = img.naturalWidth || img.width || 0;
      const height = img.naturalHeight || img.height || 0;
      
      // Prefer images that are at least 200x200 pixels
      if (width >= 200 && height >= 200) {
        return getAbsoluteImageUrl(src);
      }
    }
    
    // For Medium specifically, check article images
    if (url.includes('medium.com')) {
      try {
        const articleImg = document.querySelector('article figure img, article picture img, article img');
        if (articleImg) {
          const src = articleImg.getAttribute('src') || 
                     articleImg.getAttribute('data-src') ||
                     articleImg.getAttribute('data-lazy-src');
          if (src && !src.startsWith('data:image/gif') && !src.includes('1x1')) {
            return getAbsoluteImageUrl(src);
          }
        }
      } catch (e) {
        // Silently continue
      }
    }
    
    // If no large image found, use first non-placeholder image
    if (images.length > 0) {
      for (const img of images) {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('data:image/gif') && !src.includes('1x1')) {
          return getAbsoluteImageUrl(src);
        }
      }
    }
  } catch (error) {
    console.debug('[SRT] Failed to find image on page:', error);
  }
  
  return null;
};

/**
 * Extracts text content from page
 * @param {number} maxLength - Maximum text length
 * @returns {string}
 */
const extractPageText = (maxLength = CONTENT_SCRIPT_CONSTANTS.MAX_PAGE_TEXT_LENGTH) => {
  try {
    // Clone document to avoid modifying original
    const clone = document.cloneNode(true);
    
    // Remove unwanted elements
    CONTENT_SCRIPT_CONSTANTS.ELEMENTS_TO_REMOVE.forEach(selector => {
      const elements = clone.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    // Get text content
    const text = clone.body?.innerText || clone.body?.textContent || '';
    
    // Clean up whitespace and limit length
    return text
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, maxLength);
  } catch (error) {
    console.error('[SRT] Failed to extract page text:', error);
    return '';
  }
};

// ============================================================================
// Content Script Class
// ============================================================================

/**
 * SmarTrack Content Script
 * Manages page data extraction and IndexedDB operations
 */
class SmarTrackContentScript {
  /**
   * Creates a new SmarTrackContentScript instance
   */
  constructor() {
    /** @type {boolean} */
    this.isInitialized = false;
    
    /** @type {IDBDatabase|null} */
    this.db = null;
    
    this.init();
  }

  /**
   * Initializes the content script
   * @returns {void}
   */
  init() {
    if (this.isInitialized) {
      console.warn('[SRT] Content script already initialized');
      return;
    }
    
    // Prevent multiple initializations
    if (typeof window.smartrackContentScript !== 'undefined') {
      return;
    }
    
    window.smartrackContentScript = true;
    this.isInitialized = true;
    
    console.log('[SRT] Content script loaded on:', window.location.href);
    
    this.setupMessageListeners();
    this.initIndexedDB();
    this.syncTokenIfOnDashboard();
  }

  /**
   * Syncs auth token from localStorage to extension storage if on dashboard
   * Also triggers category sync notification
   * @returns {void}
   */
  syncTokenIfOnDashboard() {
    const hostname = window.location.hostname;
    const isDashboard = hostname === 'smar-track.vercel.app' || 
                        hostname === 'smartracker.vercel.app' || 
                        hostname === 'smartrack.vercel.app' ||
                        hostname === 'localhost';
    
    if (!isDashboard) return;

    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        console.log('[SRT] Found auth token on dashboard, syncing to extension storage');
        chrome.storage.local.set({ 'authToken': token });
        
        // Notify background that categories should be synced (dashboard visit detected)
        // This will trigger category sync when popup opens next
        chrome.storage.local.set({ 
          'categoriesSyncNeeded': true,
          'categoriesLastSync': Date.now()
        }).catch(() => {
          // Non-critical
        });
      }
    } catch (error) {
      console.debug('[SRT] Failed to sync token:', error);
    }
  }

  /**
   * Sets up message listeners for communication
   * @returns {void}
   */
  setupMessageListeners() {
    // Store extension origin outside callback to prevent crash if extension context is invalidated
    let extensionOrigin = '';
    try {
      if (chrome.runtime?.id) {
        extensionOrigin = chrome.runtime.getURL('').replace(/\/$/, '');
      }
    } catch (error) {
      console.debug('[SRT] Could not get extension origin:', error);
    }

    // Listen for token requests from popup via window.postMessage
    // Only accept messages from whitelisted dashboard origins or extension origin
    window.addEventListener('message', (event) => {
      // Check if extension context is still valid (prevents crash after extension reload)
      if (!chrome.runtime?.id) {
        return;
      }

      // Security: Whitelist specific dashboard domains
      const ALLOWED_DASHBOARD_ORIGINS = [
        'https://smar-track.vercel.app',
        'https://smartracker.vercel.app',
        'https://smartrack.vercel.app',
        'http://localhost'
      ];
      
      const hostname = window.location.hostname;
      const isDashboard = ALLOWED_DASHBOARD_ORIGINS.some(origin => {
        try {
          const originUrl = new URL(origin);
          return window.location.origin === origin || hostname === originUrl.hostname;
        } catch {
          return false;
        }
      });
      
      // Security: Only accept messages from whitelisted dashboard origins or extension origin
      const allowedOrigins = isDashboard 
        ? [window.location.origin, extensionOrigin]
        : [extensionOrigin];
      
      if (!allowedOrigins.includes(event.origin)) {
        console.debug('[SRT] Rejected message from unauthorized origin:', event.origin);
        return;
      }
      
      if (!event.data || typeof event.data !== 'object') {
        return;
      }
      
      if (event.data.type === CONTENT_SCRIPT_CONSTANTS.MESSAGE_TYPES.REQUEST_AUTH_TOKEN) {
        this.handleTokenRequest(event.data.messageId, event.origin).catch((error) => {
          console.error('[SRT] Token request handler failed:', error);
        });
      }
    });

    // Listen for messages from background script and popup via chrome.runtime.onMessage
    if (chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        // Check if extension context is still valid
        if (!chrome.runtime?.id) {
          return false;
        }

        // Handle token requests from popup/extension
        if (request.type === CONTENT_SCRIPT_CONSTANTS.MESSAGE_TYPES.REQUEST_AUTH_TOKEN) {
          // Get token from localStorage if available
          // Get extension version for dashboard detection
          let extensionVersion = null;
          try {
            if (chrome.runtime?.getManifest) {
              extensionVersion = chrome.runtime.getManifest().version || null;
            }
          } catch (error) {
            console.debug('[SRT] Could not get extension version:', error);
          }
          
          try {
            const token = localStorage.getItem('authToken');
            sendResponse({ 
              type: CONTENT_SCRIPT_CONSTANTS.MESSAGE_TYPES.AUTH_TOKEN_RESPONSE,
              messageId: request.messageId,
              token: token,
              version: extensionVersion
            });
          } catch (error) {
            console.error('[SRT] Failed to get token from localStorage:', error);
            sendResponse({ 
              type: CONTENT_SCRIPT_CONSTANTS.MESSAGE_TYPES.AUTH_TOKEN_RESPONSE,
              messageId: request.messageId,
              token: null,
              version: extensionVersion
            });
          }
          return true; // Keep channel open for async response
        }
        
        // Handle other background messages
        this.handleBackgroundMessage(request, sender, sendResponse).catch((error) => {
          console.error('[SRT] Background message handler failed:', error);
          sendResponse({ success: false, error: error.message });
        });
        return true; // Keep channel open for async response
      });
    }
  }

  /**
   * Handles token request from popup
   * @async
   * @param {string} messageId - Message ID for response matching
   * @param {string} targetOrigin - Origin to send response to (for security)
   * @returns {Promise<void>}
   */
  async handleTokenRequest(messageId, targetOrigin = window.location.origin) {
    if (!messageId || typeof messageId !== 'string') {
      console.warn('[SRT] Invalid message ID in token request');
      return;
    }
    
    // Only allow token retrieval from SmarTrack dashboard domains
    const hostname = window.location.hostname;
    const isDashboard = hostname === 'smar-track.vercel.app' || 
                        hostname === 'smartracker.vercel.app' || 
                        hostname === 'smartrack.vercel.app' ||
                        hostname === 'localhost';
    
    if (!isDashboard) {
      console.debug('[SRT] Token request ignored: not on dashboard domain');
      return;
    }
    
    try {
      let token = null;
      
      // Try to get token from localStorage (set by frontend)
      try {
        token = localStorage.getItem('authToken');
      } catch (error) {
        // localStorage might be blocked in some contexts
        console.debug('[SRT] Could not access localStorage:', error);
      }
      
      // Get extension version for dashboard detection
      let extensionVersion = null;
      try {
        if (chrome.runtime?.getManifest) {
          extensionVersion = chrome.runtime.getManifest().version || null;
        }
      } catch (error) {
        console.debug('[SRT] Could not get extension version:', error);
      }
      
      // Send response - use provided targetOrigin for security (only send to authorized origin)
      window.postMessage({
        type: CONTENT_SCRIPT_CONSTANTS.MESSAGE_TYPES.AUTH_TOKEN_RESPONSE,
        messageId: messageId,
        token: token,
        version: extensionVersion
      }, targetOrigin);
    } catch (error) {
      console.error('[SRT] Failed to handle token request:', error);
      
      // Get extension version even on error
      let extensionVersion = null;
      try {
        if (chrome.runtime?.getManifest) {
          extensionVersion = chrome.runtime.getManifest().version || null;
        }
      } catch (e) {
        // Ignore
      }
      
      // Send error response - use provided targetOrigin for security
      window.postMessage({
        type: CONTENT_SCRIPT_CONSTANTS.MESSAGE_TYPES.AUTH_TOKEN_RESPONSE,
        messageId: messageId,
        token: null,
        version: extensionVersion
      }, targetOrigin);
    }
  }

  /**
   * Handles messages from background script
   * @async
   * @param {Object} request - Message request
   * @param {chrome.runtime.MessageSender} sender - Message sender
   * @param {Function} sendResponse - Response callback
   * @returns {Promise<void>}
   */
  async handleBackgroundMessage(request, sender, sendResponse) {
    if (!request || !request.type) {
      sendResponse({ success: false, error: 'Invalid message format' });
      return;
    }
    
    try {
      switch (request.type) {
        case CONTENT_SCRIPT_CONSTANTS.MESSAGE_TYPES.EXTRACT_PAGE_DATA:
          const pageData = this.extractPageData();
          sendResponse({ success: true, data: pageData });
          break;
          
        case CONTENT_SCRIPT_CONSTANTS.MESSAGE_TYPES.SAVE_LINK:
          const result = await this.saveLink(request.data);
          sendResponse({ success: true, result: result });
          break;
          
        default:
          sendResponse({ success: false, error: `Unknown message type: ${request.type}` });
      }
    } catch (error) {
      console.error('[SRT] Message handling failed:', error);
      sendResponse({ success: false, error: error.message || 'Handler failed' });
    }
  }

  /**
   * Extracts page data and metadata
   * @returns {Object} Page data object
   */
  extractPageData() {
    try {
      // Extract image URL from meta tags and convert to absolute
      const imageMeta = getMetaContent(CONTENT_SCRIPT_CONSTANTS.META_TAGS.IMAGE);
      let image = getAbsoluteImageUrl(imageMeta);
      
      // If no meta image, try to find first large image on page
      if (!image) {
        image = findFirstLargeImage();
      }
      
      return {
        title: document.title || 'Untitled',
        url: window.location.href || '',
        description: getMetaContent(CONTENT_SCRIPT_CONSTANTS.META_TAGS.DESCRIPTION) || '',
        image: image || null,
        siteName: getMetaContent(CONTENT_SCRIPT_CONSTANTS.META_TAGS.SITE_NAME) || null,
        author: getMetaContent(CONTENT_SCRIPT_CONSTANTS.META_TAGS.AUTHOR) || null,
        publishedDate: getMetaContent(CONTENT_SCRIPT_CONSTANTS.META_TAGS.PUBLISHED_DATE) || null,
        pageText: extractPageText(),
        favicon: getFaviconUrl()
      };
    } catch (error) {
      console.error('[SRT] Failed to extract page data:', error);
      return {
        title: document.title || 'Untitled',
        url: window.location.href || '',
        description: '',
        image: null,
        siteName: null,
        author: null,
        publishedDate: null,
        pageText: '',
        favicon: ''
      };
    }
  }

  /**
   * Saves link to IndexedDB and notifies background
   * @async
   * @param {Object} linkData - Link data to save
   * @returns {Promise<Object>}
   */
  async saveLink(linkData) {
    if (!linkData || typeof linkData !== 'object') {
      throw new Error('Invalid link data');
    }
    
    try {
      const link = {
        id: linkData.id || `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...linkData,
        createdAt: linkData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.saveToIndexedDB(link);
      
      // Notify background script
      if (chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({
          type: CONTENT_SCRIPT_CONSTANTS.MESSAGE_TYPES.LINK_SAVED,
          link: link
        }).catch((error) => {
          console.error('[SRT] Failed to notify background:', error);
        });
      }

      return link;
    } catch (error) {
      console.error('[SRT] Failed to save link:', error);
      throw error;
    }
  }

  /**
   * Initializes IndexedDB connection
   * @returns {void}
   */
  initIndexedDB() {
    if (!window.indexedDB) {
      console.warn('[SRT] IndexedDB not available');
      return;
    }
    
    try {
      const request = indexedDB.open(
        CONTENT_SCRIPT_CONSTANTS.INDEXEDDB_NAME,
        CONTENT_SCRIPT_CONSTANTS.INDEXEDDB_VERSION
      );
      
      request.onerror = () => {
        console.error('[SRT] IndexedDB failed to open:', request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('[SRT] IndexedDB connection established');
        
        // Handle database closure
        this.db.onerror = (event) => {
          console.error('[SRT] IndexedDB error:', event.target?.error);
        };
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create links store if it doesn't exist
        if (!db.objectStoreNames.contains(CONTENT_SCRIPT_CONSTANTS.OBJECT_STORE_NAME)) {
          const linksStore = db.createObjectStore(
            CONTENT_SCRIPT_CONSTANTS.OBJECT_STORE_NAME,
            { keyPath: 'id' }
          );
          
          // Create indexes
          linksStore.createIndex('url', 'url', { unique: false });
          linksStore.createIndex('createdAt', 'createdAt', { unique: false });
          linksStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
    } catch (error) {
      console.error('[SRT] Failed to initialize IndexedDB:', error);
    }
  }

  /**
   * Saves link to IndexedDB
   * @async
   * @param {Object} link - Link object to save
   * @returns {Promise<Object>}
   */
  async saveToIndexedDB(link) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    if (!link || !link.id) {
      throw new Error('Invalid link: missing id');
    }
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(
          [CONTENT_SCRIPT_CONSTANTS.OBJECT_STORE_NAME],
          'readwrite'
        );
        
        const store = transaction.objectStore(CONTENT_SCRIPT_CONSTANTS.OBJECT_STORE_NAME);
        const request = store.put(link); // Use put to handle updates
        
        request.onsuccess = () => {
          console.log('[SRT] Link saved to IndexedDB:', link.id);
          resolve(link);
        };
        
        request.onerror = () => {
          const error = request.error || new Error('Failed to save link');
          console.error('[SRT] Failed to save link to IndexedDB:', error);
          reject(error);
        };
      } catch (error) {
        console.error('[SRT] IndexedDB transaction failed:', error);
        reject(error);
      }
    });
  }
}

// ============================================================================
// Initialization
// ============================================================================

// Initialize content script
try {
  new SmarTrackContentScript();
} catch (error) {
  console.error('[SRT] Failed to initialize content script:', error);
}
