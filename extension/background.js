/**
 * SmarTrack Background Script
 * Handles extension lifecycle, offline queue, and cross-component communication
 * 
 * @fileoverview Service worker for Chrome extension background tasks
 * @version 2.0.0
 */

// ============================================================================
// Constants
// ============================================================================

const BACKGROUND_CONSTANTS = {
  // URLs
  DASHBOARD_URL: 'https://smar-track.vercel.app',
  API_BASE_URL: 'https://smartrack-back.onrender.com',
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
  
  // Context Menu IDs
  CONTEXT_MENU_IDS: {
    OPEN_DASHBOARD: 'smartrack-open-dashboard'
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
    ENQUEUE_SAVE: 'ENQUEUE_SAVE'
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

    // Tab updates (for content script injection)
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.injectContentScript(tabId).catch((error) => {
          // Silently fail for system pages
          if (!this.isSystemUrl(tab.url)) {
            console.error('[SRT] Content script injection failed:', error);
          }
        });
      }
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
      console.warn('[SRT] Alarms API not available');
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
      // Remove existing menu item if it exists
      chrome.contextMenus.remove(
        BACKGROUND_CONSTANTS.CONTEXT_MENU_IDS.OPEN_DASHBOARD,
        () => {
          // Ignore errors if item doesn't exist
        }
      );
      
      // Create context menu item
      chrome.contextMenus.create({
        id: BACKGROUND_CONSTANTS.CONTEXT_MENU_IDS.OPEN_DASHBOARD,
        title: 'Open SmarTrack Dashboard',
        contexts: ['action']
      });
      
      chrome.contextMenus.onClicked.addListener((info) => {
        if (info.menuItemId === BACKGROUND_CONSTANTS.CONTEXT_MENU_IDS.OPEN_DASHBOARD) {
          chrome.tabs.create({ url: `${BACKGROUND_CONSTANTS.DASHBOARD_URL}/dashboard` });
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
   * Injects content script into a tab if needed
   * @async
   * @param {number} tabId - Tab ID
   * @returns {Promise<void>}
   */
  async injectContentScript(tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      
      if (!tab || !tab.url) {
        return;
      }
      
      // Skip system pages
      if (this.isSystemUrl(tab.url)) {
        return;
      }
      
      // Check if content script is already injected
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: () => window.smartrackContentScript
        });
        
        if (results[0]?.result) {
          // Already injected
          return;
        }
      } catch (error) {
        // Script injection check failed, try to inject anyway
        console.debug('[SRT] Could not check for existing script:', error);
      }
      
      // Inject content script
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['contentScript.js']
      });
    } catch (error) {
      // Silently ignore errors for system pages
      if (error.message && error.message.includes('Cannot access')) {
        return;
      }
      throw error;
    }
  }

  /**
   * Checks if a URL is a system URL that should be skipped
   * @param {string} url - URL to check
   * @returns {boolean}
   */
  isSystemUrl(url) {
    if (!url || typeof url !== 'string') {
      return true;
    }
    
    return BACKGROUND_CONSTANTS.SKIP_URL_PREFIXES.some(prefix => 
      url.startsWith(prefix)
    );
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
