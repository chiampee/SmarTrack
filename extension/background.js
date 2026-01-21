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
    LINKS: 'links',
    LAST_USAGE: 'lastUsage',
    LAST_INTERACTION: 'lastInteraction',
    EXTENSION_STATUS: 'extensionStatus'
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
    SAVE_LINK_PAGE: 'smartrack-save-link-page',
    DISCOVERY_SAVE: 'smartrack-discovery-save'
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
  },
  
  // Smart Discovery Constants
  SMART_DISCOVERY: {
    VISIT_THRESHOLD: 5,
    SUGGESTION_COOLDOWN_HOURS: 24,
    STORAGE_KEY: 'daily_visits',
    SAVED_URLS_CACHE_KEY: 'saved_urls_cache',
    BADGE_TEXT: '!',
    FILTERED_DOMAINS: ['localhost', 'google.com', '127.0.0.1']
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
    this.setupTabTracking();
    
    // Retry pending saves on startup
    this.retryPendingSaves().catch((error) => {
      console.error('[SRT] Startup retry failed:', error);
    });
    
    // Reset daily visits on startup (cleanup old entries)
    this.resetDailyVisits().catch((error) => {
      console.error('[SRT] Daily visits reset failed:', error);
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
      async (request) => {
        await this.enqueueSave(request.linkData);
        await this.trackInteraction();
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
        } else if (info.menuItemId === BACKGROUND_CONSTANTS.CONTEXT_MENU_IDS.DISCOVERY_SAVE) {
          // Save the page from discovery suggestion
          if (tab && tab.url) {
            this.handleSavePageFromContextMenu(tab).catch((error) => {
              console.error('[SRT] Failed to save page from discovery:', error);
              this.showNotification('Save Failed', 'Could not save page. Please try again.');
            });
            
            // Remove badge and context menu item after saving
            if (chrome.action?.setBadgeText) {
              chrome.action.setBadgeText({ text: '' });
            }
            // Remove context menu item - handle errors gracefully
            if (chrome.contextMenus?.remove) {
              chrome.contextMenus.remove(BACKGROUND_CONSTANTS.CONTEXT_MENU_IDS.DISCOVERY_SAVE, () => {
                // Ignore errors - item may not exist
                if (chrome.runtime.lastError) {
                  // Silently ignore - this is expected if item doesn't exist
                }
              });
            }
          }
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
      // Track interaction
      await this.trackInteraction();
      
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
   * Tracks extension interaction
   * @async
   * @returns {Promise<void>}
   */
  async trackInteraction() {
    try {
      const now = Date.now();
      await chrome.storage.local.set({
        [BACKGROUND_CONSTANTS.STORAGE_KEYS.LAST_INTERACTION]: now,
        [BACKGROUND_CONSTANTS.STORAGE_KEYS.LAST_USAGE]: now,
        [BACKGROUND_CONSTANTS.STORAGE_KEYS.EXTENSION_STATUS]: 'active'
      });
    } catch (error) {
      console.debug('[SRT] Failed to track interaction:', error);
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

  /**
   * Sets up tab tracking for Smart Discovery
   * @returns {void}
   */
  setupTabTracking() {
    if (!chrome.tabs?.onUpdated) {
      console.debug('[SRT] Tabs API not available - skipping tab tracking');
      return;
    }

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      // Only track when page is fully loaded
      if (changeInfo.status === 'complete' && tab.url) {
        // Skip system URLs
        if (this.isSystemUrl(tab.url)) {
          return;
        }

        // Skip filtered domains
        try {
          const urlObj = new URL(tab.url);
          const hostname = urlObj.hostname.toLowerCase();
          if (BACKGROUND_CONSTANTS.SMART_DISCOVERY.FILTERED_DOMAINS.some(domain => 
            hostname === domain || hostname.endsWith('.' + domain)
          )) {
            return;
          }
        } catch (e) {
          // Invalid URL, skip
          return;
        }

        // Track visit
        this.trackVisit(tab.url, tabId).catch((error) => {
          console.error('[SRT] Failed to track visit:', error);
        });
      }
    });
  }

  /**
   * Tracks a visit to a URL
   * @async
   * @param {string} url - URL to track
   * @param {number} tabId - Tab ID
   * @returns {Promise<void>}
   */
  async trackVisit(url, tabId) {
    if (!url || typeof url !== 'string') {
      return;
    }

    try {
      // Normalize URL for tracking
      const normalizedUrl = this.normalizeUrlForTracking(url);
      
      // Get current daily visits
      const result = await chrome.storage.local.get([
        BACKGROUND_CONSTANTS.SMART_DISCOVERY.STORAGE_KEY
      ]);
      
      const dailyVisits = result[BACKGROUND_CONSTANTS.SMART_DISCOVERY.STORAGE_KEY] || {};
      const now = Date.now();
      
      // Initialize or update visit count
      if (!dailyVisits[normalizedUrl]) {
        dailyVisits[normalizedUrl] = {
          count: 0,
          last_visit: now,
          last_suggestion: null
        };
      }
      
      // Increment count
      dailyVisits[normalizedUrl].count += 1;
      dailyVisits[normalizedUrl].last_visit = now;
      
      // Save updated visits
      await chrome.storage.local.set({
        [BACKGROUND_CONSTANTS.SMART_DISCOVERY.STORAGE_KEY]: dailyVisits
      });
      
      // Check threshold and suggest if needed
      await this.checkAndSuggest(normalizedUrl, dailyVisits[normalizedUrl].count, url);
    } catch (error) {
      console.error('[SRT] Failed to track visit:', error);
    }
  }

  /**
   * Normalizes URL for tracking (strips query params except video IDs)
   * @param {string} url - URL to normalize
   * @returns {string} Normalized URL hash
   */
  normalizeUrlForTracking(url) {
    if (!url || typeof url !== 'string') {
      return '';
    }

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      const pathname = urlObj.pathname;
      
      // Preserve video ID patterns for YouTube, Vimeo, etc.
      const videoIdPatterns = ['v=', 'id=', 'video_id=', 'watch?v='];
      let videoId = null;
      
      for (const pattern of videoIdPatterns) {
        const index = url.indexOf(pattern);
        if (index !== -1) {
          const start = index + pattern.length;
          const end = url.indexOf('&', start);
          if (end === -1) {
            videoId = url.substring(start);
          } else {
            videoId = url.substring(start, end);
          }
          break;
        }
      }
      
      // Create normalized URL hash
      let normalized = `${hostname}${pathname}`;
      if (videoId) {
        normalized += `?video_id=${videoId}`;
      }
      
      // Use a simple hash function to create a short identifier
      let hash = 0;
      for (let i = 0; i < normalized.length; i++) {
        const char = normalized.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      return `url_${Math.abs(hash).toString(36)}`;
    } catch (e) {
      // If URL parsing fails, use a hash of the entire URL
      let hash = 0;
      for (let i = 0; i < url.length; i++) {
        const char = url.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return `url_${Math.abs(hash).toString(36)}`;
    }
  }

  /**
   * Checks visit count and suggests saving if threshold is met
   * @async
   * @param {string} normalizedUrl - Normalized URL hash
   * @param {number} count - Visit count
   * @param {string} originalUrl - Original URL for saving
   * @returns {Promise<void>}
   */
  async checkAndSuggest(normalizedUrl, count, originalUrl) {
    if (count < BACKGROUND_CONSTANTS.SMART_DISCOVERY.VISIT_THRESHOLD) {
      return;
    }

    try {
      // Get daily visits to check last_suggestion timestamp
      const result = await chrome.storage.local.get([
        BACKGROUND_CONSTANTS.SMART_DISCOVERY.STORAGE_KEY
      ]);
      
      const dailyVisits = result[BACKGROUND_CONSTANTS.SMART_DISCOVERY.STORAGE_KEY] || {};
      const visitData = dailyVisits[normalizedUrl];
      
      if (!visitData) {
        return;
      }
      
      const now = Date.now();
      const cooldownMs = BACKGROUND_CONSTANTS.SMART_DISCOVERY.SUGGESTION_COOLDOWN_HOURS * 60 * 60 * 1000;
      
      // Check if we've suggested recently
      if (visitData.last_suggestion && (now - visitData.last_suggestion) < cooldownMs) {
        return;
      }
      
      // Check if URL is already saved
      const isSaved = await this.isUrlAlreadySaved(originalUrl);
      if (isSaved) {
        return;
      }
      
      // Update badge
      if (chrome.action?.setBadgeText) {
        chrome.action.setBadgeText({
          text: BACKGROUND_CONSTANTS.SMART_DISCOVERY.BADGE_TEXT
        });
        chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
      }
      
      // Add context menu item
      await this.addDiscoveryContextMenu(originalUrl);
      
      // Update last_suggestion timestamp
      visitData.last_suggestion = now;
      dailyVisits[normalizedUrl] = visitData;
      await chrome.storage.local.set({
        [BACKGROUND_CONSTANTS.SMART_DISCOVERY.STORAGE_KEY]: dailyVisits
      });
    } catch (error) {
      console.error('[SRT] Failed to check and suggest:', error);
    }
  }

  /**
   * Adds discovery context menu item
   * @async
   * @param {string} url - URL to suggest saving
   * @returns {Promise<void>}
   */
  async addDiscoveryContextMenu(url) {
    if (!chrome.contextMenus?.create) {
      return;
    }

    try {
      // Try to remove existing discovery menu item first (ignore errors if it doesn't exist)
      chrome.contextMenus.remove(BACKGROUND_CONSTANTS.CONTEXT_MENU_IDS.DISCOVERY_SAVE, () => {
        // Ignore errors - item may not exist
        if (chrome.runtime.lastError) {
          // Item doesn't exist, that's fine
        }
        
        // Create discovery menu item
        chrome.contextMenus.create({
          id: BACKGROUND_CONSTANTS.CONTEXT_MENU_IDS.DISCOVERY_SAVE,
          title: 'SmarTrack: You visit this often. Save it?',
          contexts: ['page', 'action']
        }, () => {
          if (chrome.runtime.lastError) {
            // Only log if it's not a "duplicate item" error
            if (!chrome.runtime.lastError.message.includes('duplicate')) {
              console.debug('[SRT] Failed to create discovery menu item:', chrome.runtime.lastError.message);
            }
          }
        });
      });
    } catch (error) {
      console.debug('[SRT] Failed to add discovery context menu:', error);
    }
  }

  /**
   * Checks if a URL is already saved
   * @async
   * @param {string} url - URL to check
   * @returns {Promise<boolean>}
   */
  async isUrlAlreadySaved(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }

    try {
      // Check local cache first
      const result = await chrome.storage.local.get([
        BACKGROUND_CONSTANTS.SMART_DISCOVERY.SAVED_URLS_CACHE_KEY
      ]);
      
      const cache = result[BACKGROUND_CONSTANTS.SMART_DISCOVERY.SAVED_URLS_CACHE_KEY] || {};
      const now = Date.now();
      const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
      
      // Check if cache is stale (>1 hour old)
      if (!cache.lastSync || (now - cache.lastSync) > CACHE_TTL_MS) {
        // Refresh cache from API
        const refreshed = await this.refreshSavedUrlsCache();
        if (refreshed) {
          return refreshed.includes(url);
        }
        // If refresh failed, use existing cache if available
        if (cache.urls && Array.isArray(cache.urls)) {
          return cache.urls.includes(url);
        }
        return false;
      }
      
      // Use cached data
      if (cache.urls && Array.isArray(cache.urls)) {
        return cache.urls.includes(url);
      }
      
      return false;
    } catch (error) {
      console.error('[SRT] Failed to check if URL is saved:', error);
      return false;
    }
  }

  /**
   * Refreshes the saved URLs cache from API
   * @async
   * @returns {Promise<Array<string>|null>} Array of saved URLs or null if failed
   */
  async refreshSavedUrlsCache() {
    try {
      // Get auth token
      const tokenResult = await chrome.storage.local.get([
        BACKGROUND_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN
      ]);
      const token = tokenResult[BACKGROUND_CONSTANTS.STORAGE_KEYS.AUTH_TOKEN];
      
      if (!token || typeof token !== 'string') {
        return null;
      }
      
      // Fetch links from API - try without query params first, API may not support limit parameter
      const url = `${BACKGROUND_CONSTANTS.API_BASE_URL}${BACKGROUND_CONSTANTS.LINKS_ENDPOINT}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        // Handle 422 and other errors gracefully - don't throw, just return null
        // Don't try to parse JSON from error responses
        if (response.status === 422) {
          console.debug('[SRT] API returned 422 (Unprocessable Entity) - endpoint may not support GET requests or requires different parameters');
        } else if (response.status === 401) {
          console.debug('[SRT] Unauthorized - token may be expired');
        } else {
          console.debug(`[SRT] Failed to refresh cache: HTTP ${response.status} ${response.statusText}`);
        }
        return null;
      }
      
      // Only parse JSON if response is OK
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.debug('[SRT] Failed to parse response JSON:', parseError);
        return null;
      }
      
      // Handle different response formats
      let links = [];
      if (Array.isArray(data)) {
        links = data;
      } else if (data.links && Array.isArray(data.links)) {
        links = data.links;
      } else if (data.data && Array.isArray(data.data)) {
        links = data.data;
      }
      
      // Extract URLs
      const urls = links.map(link => {
        // Handle both object format {url: ...} and string format
        if (typeof link === 'string') {
          return link;
        }
        return link.url;
      }).filter(Boolean);
      
      // Update cache
      await chrome.storage.local.set({
        [BACKGROUND_CONSTANTS.SMART_DISCOVERY.SAVED_URLS_CACHE_KEY]: {
          urls: urls,
          lastSync: Date.now()
        }
      });
      
      return urls;
    } catch (error) {
      // Silently handle errors - this is a non-critical background operation
      // Don't log full error stack for expected API errors
      if (error.message && error.message.includes('HTTP 422')) {
        console.debug('[SRT] Cache refresh skipped - API endpoint may not support GET requests');
      } else {
        console.debug('[SRT] Failed to refresh saved URLs cache:', error.message || error);
      }
      return null;
    }
  }

  /**
   * Resets daily visits (cleanup old entries)
   * @async
   * @returns {Promise<void>}
   */
  async resetDailyVisits() {
    try {
      const result = await chrome.storage.local.get([
        BACKGROUND_CONSTANTS.SMART_DISCOVERY.STORAGE_KEY
      ]);
      
      const dailyVisits = result[BACKGROUND_CONSTANTS.SMART_DISCOVERY.STORAGE_KEY] || {};
      const now = Date.now();
      const DAY_MS = 24 * 60 * 60 * 1000;
      
      // Remove entries older than 24 hours
      const cleaned = {};
      for (const [key, value] of Object.entries(dailyVisits)) {
        if (value.last_visit && (now - value.last_visit) < DAY_MS) {
          cleaned[key] = value;
        }
      }
      
      // Only update if we removed entries
      if (Object.keys(cleaned).length !== Object.keys(dailyVisits).length) {
        await chrome.storage.local.set({
          [BACKGROUND_CONSTANTS.SMART_DISCOVERY.STORAGE_KEY]: cleaned
        });
        console.log('[SRT] Cleaned up old daily visits');
      }
    } catch (error) {
      console.error('[SRT] Failed to reset daily visits:', error);
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
