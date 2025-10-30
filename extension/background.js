/**
 * SmarTrack Background Script
 * Handles extension lifecycle and communication
 */

class SmarTrackBackground {
  constructor() {
    this.init();
  }

  init() {
    console.log('[SRT] Background script initialized');
    
    // Setup event listeners
    this.setupEventListeners();

    // Setup periodic retry for offline save queue
    if (chrome.alarms) {
      chrome.alarms.create('srt-retry-saves', { periodInMinutes: 1 });
      chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === 'srt-retry-saves') {
          this.retryPendingSaves();
        }
      });
    }

    // Immediate retry on startup
    this.retryPendingSaves();
  }

  setupEventListeners() {
    // Extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstall(details);
    });

    // Tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // Messages from content scripts and popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
    });

    // Storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      this.handleStorageChange(changes, namespace);
    });

    // Browser action click: open dashboard quickly
    if (chrome.action && chrome.action.onClicked) {
      chrome.action.onClicked.addListener(() => {
        chrome.tabs.create({ url: 'https://smar-track.vercel.app/dashboard' });
      });
    }
  }

  async retryPendingSaves() {
    try {
      const { pendingSaves = [] } = await chrome.storage.local.get(['pendingSaves']);
      if (!pendingSaves.length) return;
      console.log(`[SRT] Retrying ${pendingSaves.length} pending saves`);

      const tokenData = await chrome.storage.local.get(['authToken']);
      const token = tokenData?.authToken;
      if (!token) return; // wait until authenticated

      const baseUrl = 'https://smartrack-back.onrender.com';

      const remaining = [];
      for (const item of pendingSaves) {
        try {
          const res = await fetch(`${baseUrl}/api/links`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(item),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
        } catch (e) {
          remaining.push(item); // keep for next retry
        }
      }

      await chrome.storage.local.set({ pendingSaves: remaining });
      if (remaining.length === 0) {
        console.log('[SRT] All pending saves synced');
      }
    } catch (e) {
      console.error('[SRT] Retry queue failed', e);
    }
  }

  async enqueueSave(linkData) {
    try {
      const { pendingSaves = [] } = await chrome.storage.local.get(['pendingSaves']);
      pendingSaves.push(linkData);
      await chrome.storage.local.set({ pendingSaves });
      console.log('[SRT] Enqueued save (offline queue). Size:', pendingSaves.length);
    } catch (e) {
      console.error('[SRT] Failed to enqueue save', e);
    }
  }

  handleInstall(details) {
    console.log('[SRT] Extension installed:', details.reason);
    
    if (details.reason === 'install') {
      // First time installation
      this.setupDefaultSettings();
      // Create context menu for quick dashboard access
      if (chrome.contextMenus && chrome.contextMenus.create) {
        try {
          chrome.contextMenus.create({
            id: 'smartrack-open-dashboard',
            title: 'Open SmarTrack Dashboard',
            contexts: ['action']
          });
          chrome.contextMenus.onClicked.addListener((info) => {
            if (info.menuItemId === 'smartrack-open-dashboard') {
              chrome.tabs.create({ url: 'https://smar-track.vercel.app/dashboard' });
            }
          });
        } catch (e) {
          // Ignore if already exists
        }
      }
    } else if (details.reason === 'update') {
      // Extension updated
      this.handleUpdate();
    }
  }

  async setupDefaultSettings() {
    const defaultSettings = {
      autoSave: true,
      extractContent: true,
      showNotifications: true,
      syncWithBackend: true,
      categories: ['research', 'articles', 'tools', 'references', 'other']
    };

    await chrome.storage.sync.set({ settings: defaultSettings });
    console.log('[SRT] Default settings initialized');
  }

  handleUpdate() {
    console.log('[SRT] Extension updated');
    // Handle any migration logic here
  }

  handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      // Tab finished loading
      this.injectContentScript(tabId);
    }
  }

  async injectContentScript(tabId) {
    try {
      // Get tab info to check URL
      const tab = await chrome.tabs.get(tabId);
      
      // Skip Chrome system pages (chrome://, chrome-extension://, edge://, etc.)
      const url = tab.url || '';
      if (url.startsWith('chrome://') || 
          url.startsWith('chrome-extension://') || 
          url.startsWith('edge://') ||
          url.startsWith('about:') ||
          url.startsWith('moz-extension://')) {
        return;
      }
      
      // Check if content script is already injected
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: () => window.smartrackContentScript
      });

      if (!results[0]?.result) {
        // Inject content script
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['contentScript.js']
        });
      }
    } catch (error) {
      // Silently ignore errors for system pages
      if (error.message && error.message.includes('Cannot access')) {
        console.log('[SRT] Skipping system page:', error.message);
      } else {
        console.error('[SRT] Failed to inject content script:', error);
      }
    }
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.type) {
        case 'LINK_SAVED':
          await this.handleLinkSaved(request.link);
          sendResponse({ success: true });
          break;
          
        case 'GET_SETTINGS':
          const settings = await this.getSettings();
          sendResponse({ success: true, settings: settings });
          break;
          
        case 'UPDATE_SETTINGS':
          await this.updateSettings(request.settings);
          sendResponse({ success: true });
          break;
          
        case 'GET_LINKS':
          const links = await this.getLinks();
          sendResponse({ success: true, links: links });
          break;

        case 'ENQUEUE_SAVE':
          await this.enqueueSave(request.linkData);
          this.retryPendingSaves();
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[SRT] Message handling failed:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleLinkSaved(link) {
    console.log('[SRT] Link saved:', link.id);
    
    // Show notification if enabled
    const settings = await this.getSettings();
    if (settings.showNotifications) {
      this.showNotification('Link Saved', `"${link.title}" saved to SmarTrack`);
    }
    
    // Sync with backend if enabled
    if (settings.syncWithBackend) {
      this.syncWithBackend(link);
    }
  }

  showNotification(title, message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: title,
      message: message
    });
  }

  async syncWithBackend(link) {
    try {
      // This would sync with the Python FastAPI backend
      // For now, we'll just log it
      console.log('[SRT] Syncing with backend:', link.id);
    } catch (error) {
      console.error('[SRT] Backend sync failed:', error);
    }
  }

  async getSettings() {
    const result = await chrome.storage.sync.get(['settings']);
    return result.settings || {};
  }

  async updateSettings(newSettings) {
    await chrome.storage.sync.set({ settings: newSettings });
  }

  async getLinks() {
    const result = await chrome.storage.local.get(['links']);
    return result.links || [];
  }

  handleStorageChange(changes, namespace) {
    if (namespace === 'local' && changes.links) {
      console.log('[SRT] Links storage changed');
    }
  }
}

// Initialize background script
new SmarTrackBackground();
