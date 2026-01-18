/**
 * SmarTrack Background Script
 * Handles extension lifecycle, offline queue, and cross-component communication
 * 
 * @fileoverview Service worker for Chrome extension background tasks
 * @version 2.0.0
 */

// Import configuration
try {
  importScripts('utils/config.js');
} catch (e) {
  console.error('[SRT] Failed to import scripts in background:', e);
}

// ============================================================================
// Constants
// ============================================================================

const BACKGROUND_CONSTANTS = {
  // URLs
  DASHBOARD_URL: typeof SRT_CONFIG !== 'undefined' ? SRT_CONFIG.getDashboardUrl() : 'https://smar-track.vercel.app',
  API_BASE_URL: typeof SRT_CONFIG !== 'undefined' ? SRT_CONFIG.getApiBaseUrl() : 'https://smartrack-back.onrender.com',
  LINKS_ENDPOINT: '/api/links',
  
  // Storage Keys
  STORAGE_KEYS: {
    PENDING_SAVES: 'pendingSaves',
    AUTH_TOKEN: 'authToken',
    SETTINGS: 'settings',
    LINKS: 'links'
  },
  
  // Alarms
  ALARM_NAMES: {
    RETRY_SAVES: 'srt-retry-saves'
  },
  RETRY_INTERVAL_MINUTES: 1,
  MAX_RETRY_ATTEMPTS: 5,
  
  // System URLs to Skip
  SKIP_URL_PREFIXES: [
    'chrome://',
    'chrome-extension://',
    'edge://',
    'about:',
    'moz-extension://',
    'brave://',
    'opera://'
  ],
  
  // Restricted domains that cannot be scripted (excluding Chrome Web Store for user request)
  RESTRICTED_DOMAINS: [
    'addons.mozilla.org',
    'microsoftedge.microsoft.com'
  ],
  
  // Context Menu IDs
  CONTEXT_MENU_IDS: {
    OPEN_DASHBOARD: 'smartrack-open-dashboard',
    SAVE_LINK: 'smartrack-save-link',
    SAVE_LINK_PAGE: 'smartrack-save-link-page'
  },
  
  // Default Settings
  DEFAULT_SETTINGS: {
    autoSave: true,
    extractContent: true,
    showNotifications: true,
    syncWithBackend: true,
    categories: ['research', 'articles', 'tools', 'references', 'other']
  },
  
  // Message Types
  MESSAGE_TYPES: {
    LINK_SAVED: 'LINK_SAVED',
    GET_SETTINGS: 'GET_SETTINGS',
    UPDATE_SETTINGS: 'UPDATE_SETTINGS',
    GET_LINKS: 'GET_LINKS',
    ENQUEUE_SAVE: 'ENQUEUE_SAVE',
    SAVE_CURRENT_PAGE: 'SAVE_CURRENT_PAGE',
    BATCH_SAVE_LINKS: 'BATCH_SAVE_LINKS'
  }
};

// ============================================================================
// Background Service Class
// ============================================================================

/**
 * SmarTrack Background Service
 * Manages extension lifecycle, offline queue, and message routing
 */
class SmarTrackBackground {
  /**
   * Creates a new SmarTrackBackground instance
   */
  constructor() {
    /** @type {boolean} */
    this.isInitialized = false;
    
    /** @type {Map<string, Function>} */
    this.messageHandlers = new Map();
    
    this.init();
  }

  /**
   * Initializes the background service
   * @returns {void}
   */
  init() {
    if (this.isInitialized) {
      console.warn('[SRT] Background script already initialized');
      return;
    }
    
    this.isInitialized = true;
    console.log('[SRT] Background script initialized');
    
    this.setupEventListeners();
    this.setupAlarms();
    this.registerMessageHandlers();
    
    // Retry pending saves on startup
    this.retryPendingSaves().catch((error) => {
      console.error('[SRT] Startup retry failed:', error);
    });
  }

  /**
   * Sets up Chrome extension event listeners
   * @returns {void}
   */
  setupEventListeners() {
    // Extension installation/update
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstall(details).catch((error) => {
        console.error('[SRT] Install handler failed:', error);
      });
    });

    // Messages from content scripts and popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse).catch((error) => {
        console.error('[SRT] Message handler failed:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true; // Keep channel open for async response
    });

    // Storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      this.handleStorageChange(changes, namespace);
    });

    // Browser action click
    if (chrome.action?.onClicked) {
      chrome.action.onClicked.addListener(() => {
        chrome.tabs.create({ url: `${BACKGROUND_CONSTANTS.DASHBOARD_URL}/dashboard` });
      });
    }
  }

  /**
   * Sets up Chrome alarms for periodic tasks
   * @returns {void}
   */
  setupAlarms() {
    if (!chrome.alarms) {
      // Alarms API might be missing in some contexts or strict environments
      console.debug('[SRT] Alarms API not available - skipping periodic tasks');
      return;
    }
    
    try {
      chrome.alarms.create(BACKGROUND_CONSTANTS.ALARM_NAMES.RETRY_SAVES, {
        periodInMinutes: BACKGROUND_CONSTANTS.RETRY_INTERVAL_MINUTES
      });
      
      chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === BACKGROUND_CONSTANTS.ALARM_NAMES.RETRY_SAVES) {
          this.retryPendingSaves().catch((error) => {
            console.error('[SRT] Alarm retry failed:', error);
          });
        }
      });
    } catch (error) {
      console.error('[SRT] Failed to setup alarms:', error);
    }
  }

  /**
   * Registers message handlers
   * @returns {void}
   */
  registerMessageHandlers() {
    this.messageHandlers.set(
      BACKGROUND_CONSTANTS.MESSAGE_TYPES.LINK_SAVED,
      (request) => this.handleLinkSaved(request.link)
    );
    
    this.messageHandlers.set(
      BACKGROUND_CONSTANTS.MESSAGE_TYPES.GET_SETTINGS,
      () => this.getSettings()
    );
    
    this.messageHandlers.set(
      BACKGROUND_CONSTANTS.MESSAGE_TYPES.UPDATE_SETTINGS,
      (request) => this.updateSettings(request.settings)
    );
    
    this.messageHandlers.set(
      BACKGROUND_CONSTANTS.MESSAGE_TYPES.GET_LINKS,
      () => this.getLinks()
    );
    
    this.messageHandlers.set(
      BACKGROUND_CONSTANTS.MESSAGE_TYPES.ENQUEUE_SAVE,
      (request) => {
        this.enqueueSave(request.linkData);
        this.retryPendingSaves();
      }
    );
    
    this.messageHandlers.set(
      BACKGROUND_CONSTANTS.MESSAGE_TYPES.BATCH_SAVE_LINKS,
      (request) => this.handleBatchSaveLinks(request.data)
    );
  }

  /**
   * Handles incoming messages
   * @async
   * @param {Object} request - Message request
   * @param {chrome.runtime.MessageSender} sender - Message sender
   * @param {Function} sendResponse - Response callback
   * @returns {Promise<void>}
   */
  async handleMessage(request, sender, sendResponse) {
    if (!request || !request.type) {
      sendResponse({ success: false, error: 'Invalid message format' });
      return;
    }
    
    const handler = this.messageHandlers.get(request.type);
    
    if (!handler) {
      sendResponse({ success: false, error: `Unknown message type: ${request.type}` });
      return;
    }
    
    try {
      const result = await handler(request);
      sendResponse({ success: true, ...(result && { data: result }) });
    } catch (error) {
      console.error(`[SRT] Handler for ${request.type} failed:`, error);
      sendResponse({ success: false, error: error.message || 'Handler failed' });
    }
  }

  /**
   * Handles extension installation/update
   * @async
   * @param {chrome.runtime.InstalledDetails} details - Installation details
   * @returns {Promise<void>}
   */
  async handleInstall(details) {
    console.log('[SRT] Extension installed/updated:', details.reason);
    
    if (details.reason === 'install') {
      await this.setupDefaultSettings();
      await this.setupContextMenu();
    } else if (details.reason === 'update') {
      await this.handleUpdate(details.previousVersion);
    }
  }

  /**
   * Sets up default settings
   * @async
   * @returns {Promise<void>}
   */
  async setupDefaultSettings() {
    try {
      const existing = await chrome.storage.sync.get([BACKGROUND_CONSTANTS.STORAGE_KEYS.SETTINGS]);
      
      // Only set defaults if no settings exist
      if (!existing[BACKGROUND_CONSTANTS.STORAGE_KEYS.SETTINGS]) {
        await chrome.storage.sync.set({
          [BACKGROUND_CONSTANTS.STORAGE_KEYS.SETTINGS]: BACKGROUND_CONSTANTS.DEFAULT_SETTINGS
        });
        console.log('[SRT] Default settings initialized');
      }
    } catch (error) {
      console.error('[SRT] Failed to setup default settings:', error);
    }
  }

  /**
   * Sets up context menu items
   * @async
   * @returns {Promise<void>}
   */
  async setupContextMenu() {
    if (!chrome.contextMenus?.create) {
      return;
    }
    
    try {
      // Remove all existing menu items
      chrome.contextMenus.removeAll(() => {
        // Ignore errors if items don't exist
      });
      
      // Create "Save Link" menu item for links
      chrome.contextMenus.create({
        id: BACKGROUND_CONSTANTS.CONTEXT_MENU_IDS.SAVE_LINK,
        title: 'Save Link to SmarTrack',
        contexts: ['link']
      });
      
      // Create "Save Page" menu item for pages
      chrome.contextMenus.create({
        id: BACKGROUND_CONSTANTS.CONTEXT_MENU_IDS.SAVE_LINK_PAGE,
        title: 'Save Page to SmarTrack',
        contexts: ['page', 'frame']
      });
      
      // Create "Open Dashboard" menu item
      chrome.contextMenus.create({
        id: BACKGROUND_CONSTANTS.CONTEXT_MENU_IDS.OPEN_DASHBOARD,
        title: 'Open SmarTrack Dashboard',
        contexts: ['action', 'page']
      });
      
      // Handle context menu clicks
      chrome.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === BACKGROUND_CONSTANTS.CONTEXT_MENU_IDS.OPEN_DASHBOARD) {
          chrome.tabs.create({ url: `${BACKGROUND_CONSTANTS.DASHBOARD_URL}/dashboard` });
        } else if (info.menuItemId === BACKGROUND_CONSTANTS.CONTEXT_MENU_IDS.SAVE_LINK) {
          // Save the clicked link
          this.handleSaveLinkFromContextMenu(info.linkUrl, info.linkText, tab).catch((error) => {
            console.error('[SRT] Failed to save link from context menu:', error);
            this.showNotification('Save Failed', 'Could not save link. Please try again.');
          });
        } else if (info.menuItemId === BACKGROUND_CONSTANTS.CONTEXT_MENU_IDS.SAVE_LINK_PAGE) {
          // Save the current page
          this.handleSavePageFromContextMenu(tab).catch((error) => {
            console.error('[SRT] Failed to save page from context menu:', error);
            this.showNotification('Save Failed', 'Could not save page. Please try again.');
          });
        }
      });
    } catch (error) {
      console.error('[SRT] Failed to setup context menu:', error);
    }
  }

  /**
   * Handles extension update
   * @async
   * @param {string} previousVersion - Previous version number
   * @returns {Promise<void>}
   */
  async handleUpdate(previousVersion) {
    console.log(`[SRT] Extension updated from ${previousVersion || 'unknown'}`);
    // Add migration logic here if needed
  }

  /**
   * Checks if a URL is a system URL that should be skipped
   * Note: Chrome Web Store is allowed (user request) but may still fail due to browser restrictions
   * @param {string} url - URL to check
   * @returns {boolean}
   */
  isSystemUrl(url) {
    if (!url || typeof url !== 'string') {
      return true;
    }
    
    // Check for protocol-based system URLs
    if (BACKGROUND_CONSTANTS.SKIP_URL_PREFIXES.some(prefix => 
      url.startsWith(prefix)
    )) {
      return true;
    }
    
    // Check for restricted domains (excluding Chrome Web Store per user request)
    try {
      const urlObj = new URL(url);
      if (BACKGROUND_CONSTANTS.RESTRICTED_DOMAINS.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      )) {
        return true;
      }
    } catch (e) {
      // Invalid URL, treat as system URL
      return true;
    }
    
    return false;
  }

  /**
   * Retries pending saves from offline queue
   * @async
   * @returns {Promise<void>}
   */
  async retryPendingSaves() {
    try {
      const result = await chrome.storage.local.get([
        BACKGROUND_CONSTANTS.STORAGE_KEYS.PENDING_SAVES
      ]);
      
      const pendingSaves = result[BACKGROUND_CONSTANTS.STORAGE_KEYS.PENDING_SAVES] || [];
      
      if (!Array.isArray(pendingSaves) || pendingSaves.length === 0) {
        return;
      }
      
      console.log(`[SRT] Retrying ${pendingSaves.length} pending saves`);
      
      // Get auth token
      const tokenResult = await chrome.storage.local.get([
        BACKGROUND_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN
      ]);
      const token = tokenResult[BACKGROUND_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN];
      
      if (!token || typeof token !== 'string') {
        console.log('[SRT] No auth token, skipping retry');
        return;
      }
      
      const remaining = [];
      const url = `${BACKGROUND_CONSTANTS.API_BASE_URL}${BACKGROUND_CONSTANTS.LINKS_ENDPOINT}`;
      
      // Process saves with rate limiting
      for (const item of pendingSaves) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(item),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          console.log('[SRT] Successfully synced pending save');
        } catch (error) {
          console.error('[SRT] Failed to sync pending save:', error);
          remaining.push(item);
        }
      }
      
      // Update storage with remaining items
      await chrome.storage.local.set({
        [BACKGROUND_CONSTANTS.STORAGE_KEYS.PENDING_SAVES]: remaining
      });
      
      if (remaining.length === 0) {
        console.log('[SRT] All pending saves synced successfully');
      } else {
        console.log(`[SRT] ${remaining.length} saves remain in queue`);
      }
    } catch (error) {
      console.error('[SRT] Retry queue failed:', error);
    }
  }

  /**
   * Enqueues a save for offline retry
   * @async
   * @param {Object} linkData - Link data to save
   * @returns {Promise<void>}
   */
  async enqueueSave(linkData) {
    if (!linkData || typeof linkData !== 'object') {
      console.error('[SRT] Invalid link data for enqueue');
      return;
    }
    
    try {
      const result = await chrome.storage.local.get([
        BACKGROUND_CONSTANTS.STORAGE_KEYS.PENDING_SAVES
      ]);
      
      const pendingSaves = result[BACKGROUND_CONSTANTS.STORAGE_KEYS.PENDING_SAVES] || [];
      
      if (!Array.isArray(pendingSaves)) {
        console.warn('[SRT] Pending saves is not an array, resetting');
        await chrome.storage.local.set({
          [BACKGROUND_CONSTANTS.STORAGE_KEYS.PENDING_SAVES]: [linkData]
        });
        return;
      }
      
      // Limit queue size to prevent storage issues
      const MAX_QUEUE_SIZE = 100;
      if (pendingSaves.length >= MAX_QUEUE_SIZE) {
        console.warn('[SRT] Queue size limit reached, dropping oldest item');
        pendingSaves.shift();
      }
      
      pendingSaves.push({
        ...linkData,
        enqueuedAt: Date.now()
      });
      
      await chrome.storage.local.set({
        [BACKGROUND_CONSTANTS.STORAGE_KEYS.PENDING_SAVES]: pendingSaves
      });
      
      console.log(`[SRT] Enqueued save (queue size: ${pendingSaves.length})`);
    } catch (error) {
      console.error('[SRT] Failed to enqueue save:', error);
    }
  }

  /**
   * Handles link saved notification
   * @async
   * @param {Object} link - Saved link object
   * @returns {Promise<void>}
   */
  async handleLinkSaved(link) {
    if (!link || !link.id) {
      console.warn('[SRT] Invalid link data in handleLinkSaved');
      return;
    }
    
    console.log('[SRT] Link saved:', link.id);
    
    try {
      const settings = await this.getSettings();
      
      if (settings.showNotifications !== false) {
        const title = link.title || 'Untitled';
        this.showNotification('Link Saved', `"${title}" saved to SmarTrack`);
      }
      
      if (settings.syncWithBackend !== false) {
        // Backend sync is handled by the popup/service directly
        // This is just a notification handler
      }
    } catch (error) {
      console.error('[SRT] Failed to handle link saved:', error);
    }
  }

  /**
   * Shows a browser notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @returns {void}
   */
  showNotification(title, message) {
    if (!chrome.notifications?.create) {
      return;
    }
    
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: title || 'SmarTrack',
        message: message || ''
      });
    } catch (error) {
      console.error('[SRT] Failed to show notification:', error);
    }
  }

  /**
   * Gets user settings
   * @async
   * @returns {Promise<Object>}
   */
  async getSettings() {
    try {
      const result = await chrome.storage.sync.get([
        BACKGROUND_CONSTANTS.STORAGE_KEYS.SETTINGS
      ]);
      return result[BACKGROUND_CONSTANTS.STORAGE_KEYS.SETTINGS] || {};
    } catch (error) {
      console.error('[SRT] Failed to get settings:', error);
      return {};
    }
  }

  /**
   * Updates user settings
   * @async
   * @param {Object} newSettings - Settings to update
   * @returns {Promise<void>}
   */
  async updateSettings(newSettings) {
    if (!newSettings || typeof newSettings !== 'object') {
      throw new Error('Invalid settings object');
    }
    
    try {
      const existing = await this.getSettings();
      const updated = { ...existing, ...newSettings };
      
      await chrome.storage.sync.set({
        [BACKGROUND_CONSTANTS.STORAGE_KEYS.SETTINGS]: updated
      });
      
      console.log('[SRT] Settings updated');
    } catch (error) {
      console.error('[SRT] Failed to update settings:', error);
      throw error;
    }
  }

  /**
   * Gets stored links
   * @async
   * @returns {Promise<Array>}
   */
  async getLinks() {
    try {
      const result = await chrome.storage.local.get([
        BACKGROUND_CONSTANTS.STORAGE_KEYS.LINKS
      ]);
      return result[BACKGROUND_CONSTANTS.STORAGE_KEYS.LINKS] || [];
    } catch (error) {
      console.error('[SRT] Failed to get links:', error);
      return [];
    }
  }

  /**
   * Handles saving a link from context menu
   * @async
   * @param {string} linkUrl - URL of the link to save
   * @param {string} linkText - Text of the link
   * @param {chrome.tabs.Tab} tab - Tab where the link was clicked
   * @returns {Promise<void>}
   */
  async handleSaveLinkFromContextMenu(linkUrl, linkText, tab) {
    if (!linkUrl) {
      throw new Error('No link URL provided');
    }
    
    // Get auth token
    const tokenResult = await chrome.storage.local.get([
      BACKGROUND_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN
    ]);
    const token = tokenResult[BACKGROUND_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN];
    
    if (!token || typeof token !== 'string') {
      this.showNotification('Login Required', 'Please log in to SmarTrack first');
      chrome.tabs.create({ url: `${BACKGROUND_CONSTANTS.DASHBOARD_URL}/login` });
      return;
    }
    
    // Prepare link data
    const linkData = {
      url: linkUrl,
      title: linkText || this.extractTitleFromUrl(linkUrl),
      description: '',
      category: 'research',
      contentType: 'webpage',
      source: 'extension',
      tags: []
    };
    
    // Try to save to backend
    try {
      await this.saveLinkToBackend(linkData, token);
      this.showNotification('Link Saved', `"${linkData.title}" saved to SmarTrack`);
    } catch (error) {
      // If backend save fails, enqueue for retry
      console.error('[SRT] Backend save failed, enqueueing:', error);
      await this.enqueueSave(linkData);
      this.showNotification('Link Queued', 'Link will be saved when online');
    }
  }
  
  /**
   * Handles saving the current page from context menu
   * @async
   * @param {chrome.tabs.Tab} tab - Tab to save
   * @returns {Promise<void>}
   */
  async handleSavePageFromContextMenu(tab) {
    if (!tab || !tab.url) {
      throw new Error('No tab or URL provided');
    }
    
    // Skip system URLs
    if (this.isSystemUrl(tab.url)) {
      this.showNotification('Cannot Save', 'System pages cannot be saved');
      return;
    }
    
    // Get auth token
    const tokenResult = await chrome.storage.local.get([
      BACKGROUND_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN
    ]);
    const token = tokenResult[BACKGROUND_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN];
    
    if (!token || typeof token !== 'string') {
      this.showNotification('Login Required', 'Please log in to SmarTrack first');
      chrome.tabs.create({ url: `${BACKGROUND_CONSTANTS.DASHBOARD_URL}/login` });
      return;
    }
    
    // Extract page data
    const pageData = await this.extractPageDataFromTab(tab);
    
    // Prepare link data
    const linkData = {
      url: pageData.url,
      title: pageData.title,
      description: pageData.description || '',
      category: 'research',
      contentType: 'webpage',
      source: 'extension',
      tags: [],
      thumbnail: pageData.image || null,
      favicon: pageData.favicon || null
    };
    
    // Try to save to backend
    try {
      await this.saveLinkToBackend(linkData, token);
      this.showNotification('Page Saved', `"${linkData.title}" saved to SmarTrack`);
    } catch (error) {
      // If backend save fails, enqueue for retry
      console.error('[SRT] Backend save failed, enqueueing:', error);
      await this.enqueueSave(linkData);
      this.showNotification('Page Queued', 'Page will be saved when online');
    }
  }
  
  /**
   * Extracts page data from a tab (works even for restricted pages like Chrome Web Store)
   * @async
   * @param {chrome.tabs.Tab} tab - Tab to extract data from
   * @returns {Promise<Object>}
   */
  async extractPageDataFromTab(tab) {
    const pageData = {
      url: tab.url || '',
      title: tab.title || 'Untitled',
      description: '',
      image: null,
      favicon: null
    };
    
    // Try to extract more data if we can inject scripts
    if (tab.id && !this.isSystemUrl(tab.url)) {
      try {
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            return {
              title: document.title || '',
              description: (() => {
                const meta = document.querySelector('meta[name="description"], meta[property="og:description"]');
                return meta ? meta.getAttribute('content') || '' : '';
              })(),
              image: (() => {
                const meta = document.querySelector('meta[property="og:image"]') ||
                  document.querySelector('meta[name="twitter:image"]');
                if (!meta) return null;
                
                const imageUrl = meta.getAttribute('content');
                if (!imageUrl) return null;
                
                // Convert relative URLs to absolute
                try {
                  // If already absolute URL, return as is
                  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                    return imageUrl;
                  }
                  // Handle protocol-relative URLs (//example.com/image.jpg)
                  if (imageUrl.startsWith('//')) {
                    return window.location.protocol + imageUrl;
                  }
                  // Convert relative URL to absolute
                  return new URL(imageUrl, window.location.origin).href;
                } catch {
                  return imageUrl;
                }
              })(),
              favicon: (() => {
                const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
                if (favicon) {
                  const href = favicon.getAttribute('href');
                  if (href) {
                    try {
                      return new URL(href, window.location.origin).href;
                    } catch {
                      return href;
                    }
                  }
                }
                try {
                  return new URL('/favicon.ico', window.location.origin).href;
                } catch {
                  return null;
                }
              })()
            };
          }
        });
        
        if (result?.result) {
          pageData.title = result.result.title || pageData.title;
          pageData.description = result.result.description || '';
          pageData.image = result.result.image || null;
          pageData.favicon = result.result.favicon || null;
        }
      } catch (error) {
        // Script injection failed (e.g., Chrome Web Store), use tab data only
        console.debug('[SRT] Could not extract page metadata, using tab data:', error.message);
      }
    }
    
    // For Chrome Web Store and other restricted pages, use tab data
    // Try to get favicon from tab
    if (tab.favIconUrl) {
      pageData.favicon = tab.favIconUrl;
    }
    
    return pageData;
  }
  
  /**
   * Extracts a title from a URL
   * @param {string} url - URL to extract title from
   * @returns {string}
   */
  extractTitleFromUrl(url) {
    if (!url || typeof url !== 'string') {
      return 'Untitled';
    }
    
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      const pathname = urlObj.pathname.split('/').filter(p => p).pop();
      
      if (pathname) {
        return decodeURIComponent(pathname).replace(/[-_]/g, ' ').trim();
      }
      
      return hostname;
    } catch {
      return 'Untitled';
    }
  }
  
  /**
   * Saves a link to the backend
   * @async
   * @param {Object} linkData - Link data to save
   * @param {string} token - Auth token
   * @returns {Promise<Object>}
   */
  async saveLinkToBackend(linkData, token) {
    const url = `${BACKGROUND_CONSTANTS.API_BASE_URL}${BACKGROUND_CONSTANTS.LINKS_ENDPOINT}`;
    
    // Get extension version
    let version = '1.0.0';
    try {
      if (chrome.runtime?.getManifest) {
        version = chrome.runtime.getManifest().version;
      }
    } catch (e) {
      // Use default
    }
    
    const body = {
      url: linkData.url || '',
      title: linkData.title || 'Untitled',
      description: linkData.description || '',
      content: linkData.content || '',
      category: linkData.category || 'research',
      tags: Array.isArray(linkData.tags) ? linkData.tags : [],
      contentType: linkData.contentType || 'webpage',
      thumbnail: linkData.thumbnail || null,
      favicon: linkData.favicon || null,
      isFavorite: linkData.isFavorite === true,
      isArchived: linkData.isArchived === true,
      source: linkData.source || 'extension',
      extensionVersion: version
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Handles batch save links request from content scripts
   * @async
   * @param {Array<Object>} batch - Array of link data objects to save
   * @returns {Promise<Object>} Result object with success count and errors
   */
  async handleBatchSaveLinks(batch) {
    if (!Array.isArray(batch) || batch.length === 0) {
      throw new Error('Invalid batch data: expected non-empty array');
    }
    
    // Retrieve auth token
    const tokenResult = await chrome.storage.local.get([
      BACKGROUND_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN
    ]);
    const token = tokenResult[BACKGROUND_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN];
    
    // If no token, open login page
    if (!token || typeof token !== 'string') {
      chrome.tabs.create({ url: `${BACKGROUND_CONSTANTS.DASHBOARD_URL}/login` });
      throw new Error('Authentication required. Please log in to SmarTrack.');
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    // Process each item in the batch
    for (let i = 0; i < batch.length; i++) {
      const item = batch[i];
      
      if (!item || !item.url) {
        results.failed++;
        results.errors.push({
          index: i,
          error: 'Invalid item: missing url'
        });
        continue;
      }
      
      try {
        // Prepare link data according to plan specification
        const linkData = {
          url: item.url,
          title: item.title || 'Untitled',
          description: item.description || '',
          category: item.category || 'research',
          contentType: item.contentType || 'webpage',
          source: item.source || 'linkedin',
          thumbnail: item.image || item.thumbnail || null
        };
        
        // Call existing saveLinkToBackend method
        await this.saveLinkToBackend(linkData, token);
        results.success++;
      } catch (error) {
        results.failed++;
        
        // Handle 401 (unauthorized) - token might be expired
        if (error.message && error.message.includes('401')) {
          // Open login page and stop processing
          chrome.tabs.create({ url: `${BACKGROUND_CONSTANTS.DASHBOARD_URL}/login` });
          throw new Error('Authentication expired. Please log in again.');
        }
        
        // Handle network errors - enqueue for retry
        if (error.message && (
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError') ||
          error.message.includes('network')
        )) {
          // Enqueue for offline retry
          await this.enqueueSave({
            url: item.url,
            title: item.title || 'Untitled',
            description: item.description || '',
            category: item.category || 'research',
            contentType: item.contentType || 'webpage',
            source: item.source || 'linkedin',
            thumbnail: item.image || item.thumbnail || null
          });
          results.errors.push({
            index: i,
            error: 'Network error - queued for retry',
            url: item.url
          });
        } else {
          // Other errors (e.g., 409 duplicate, validation errors)
          results.errors.push({
            index: i,
            error: error.message || 'Unknown error',
            url: item.url
          });
        }
      }
    }
    
    return results;
  }
  
  /**
   * Handles storage change events
   * @param {Object} changes - Changed storage values
   * @param {string} namespace - Storage namespace
   * @returns {void}
   */
  handleStorageChange(changes, namespace) {
    if (namespace === 'local' && changes[BACKGROUND_CONSTANTS.STORAGE_KEYS.LINKS]) {
      console.log('[SRT] Links storage changed');
    }
  }
}

// ============================================================================
// Initialization
// ============================================================================

// Initialize background service
try {
  new SmarTrackBackground();
} catch (error) {
  console.error('[SRT] Failed to initialize background service:', error);
}
