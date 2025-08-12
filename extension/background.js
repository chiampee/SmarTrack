// Enhanced background script for Smart Research Tracker
// Handles data processing, AI enrichment, and dashboard synchronization

console.log('[Smart Research Tracker] Enhanced background script loaded');

// Respond to diagnostic pings from the dashboard for reliable detection
try {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.action === 'ping' || msg?.type === 'SRT_PING') {
      const manifest = chrome.runtime.getManifest();
      sendResponse({
        extensionId: chrome.runtime.id || 'smart-research-tracker',
        source: 'smart-research-tracker-extension',
        status: 'ok',
        message: 'Extension is working',
        version: manifest?.version || '0.0.0',
        timestamp: Date.now()
      });
      return true;
    }
    

  });
} catch (_) {
  // no-op
}

// Enhanced link processing with better metadata extraction
class EnhancedLinkProcessor {
  constructor() {
    this.pendingQueue = [];
    this.processingQueue = [];
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  async processLink(payload) {
    try {
      console.log('[SRT] Processing link:', payload.url);
      
      if (!payload.url) {
        throw new Error('No URL provided');
      }
      
      // Build enhanced Link object
      const linkForDexie = this.buildLinkObject(payload);
      
      // Store in chrome.storage for legacy compatibility
      try {
        await this.storeInChromeStorage(payload, linkForDexie.id);
      } catch (error) {
        console.error('[SRT] Chrome storage failed:', error);
        throw new Error('Failed to save to local storage');
      }
      
      // Broadcast to dashboard
      try {
        await this.broadcastToDashboard(linkForDexie);
      } catch (error) {
        console.error('[SRT] Dashboard broadcast failed:', error);
        // Don't throw here, just log - the link is still saved
      }
      
      // Process page content for AI enrichment (non-blocking)
      try {
        await this.processPageContent(payload, linkForDexie);
      } catch (error) {
        console.error('[SRT] Page content processing failed:', error);
        // Don't throw here, just log - the link is still saved
      }
      
      // Update badge
      try {
        this.updateBadge();
      } catch (error) {
        console.error('[SRT] Badge update failed:', error);
        // Don't throw here, just log
      }
      
      return { success: true, linkId: linkForDexie.id };
    } catch (error) {
      console.error('[SRT] Link processing failed:', error);
      return { 
        success: false, 
        error: error.message || 'Unknown error occurred',
        details: error.stack
      };
    }
  }

  buildLinkObject(payload) {
    const now = new Date();
    
    return {
      id: crypto.randomUUID(),
      url: payload.url,
      metadata: {
        title: payload.title || '',
        description: payload.description || '',
        image: payload.image || '',
        author: payload.author || '',
        publishedTime: payload.publishedTime || '',
        modifiedTime: payload.modifiedTime || '',
        siteName: payload.siteName || '',
        keywords: payload.keywords || '',
        structuredData: payload.structuredData || {}
      },
      labels: payload.label ? [payload.label] : ['research'], // Default label if none provided
      priority: payload.priority || 'medium',
      status: 'active',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      boardId: payload.boardId || null,
      source: 'extension',
      tabId: payload.tabId,
      pageText: payload.pageText || ''
    };
  }

  async storeInChromeStorage(payload, linkId) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['links'], (res) => {
        const links = res.links || [];
        const normUrl = payload.url.replace(/\/+$/, '').toLowerCase();
        const exists = links.some((l) => (l.url || '').replace(/\/+$/, '').toLowerCase() === normUrl);
        
        if (!exists) {
          links.push({ 
            ...payload, 
            savedAt: Date.now(), 
            id: linkId,
            processed: true
          });
          
          chrome.storage.local.set({ links }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              console.log('[SRT] Link saved to chrome.storage:', payload.url);
              resolve();
            }
          });
        } else {
          console.debug('[SRT] Duplicate link ignored:', payload.url);
          resolve();
        }
      });
    });
  }

  async broadcastToDashboard(linkObj, summaries = []) {
    const APP_URL_PATTERNS = [
      'http://localhost:5174/*',
      'http://localhost:5173/*', 
      'https://smartresearchtracker.vercel.app/*',
      'http://127.0.0.1:5174/*',
      'http://127.0.0.1:5173/*'
    ];

    try {
      const tabs = await this.queryTabs(APP_URL_PATTERNS);
      
      if (tabs.length === 0) {
        // Dashboard not open, queue for later
        this.queueForLater({ type: 'UPSERT_LINK', link: linkObj, summaries });
        return;
      }

      // Send to all dashboard tabs
      const promises = tabs.map(tab => 
        this.sendMessageToTab(tab.id, { 
          type: 'UPSERT_LINK', 
          link: linkObj, 
          summaries 
        })
      );

      await Promise.allSettled(promises);
      console.log('[SRT] Link broadcasted to dashboard');
    } catch (error) {
      console.error('[SRT] Dashboard broadcast failed:', error);
      this.queueForLater({ type: 'UPSERT_LINK', link: linkObj, summaries });
    }
  }

  async processPageContent(payload, linkObj) {
    try {
      let pageText = payload.pageText || '';
      
      // If no page text provided, extract from tab
      if (!pageText && payload.tabId) {
        pageText = await this.extractPageText(payload.tabId);
      }

      if (!pageText) {
        console.debug('[SRT] No page text available for processing');
        return;
      }

      // Store raw summary
      const rawSummary = this.createSummary(linkObj.id, 'raw', pageText);
      await this.broadcastSummary(rawSummary);

      // Enrich with AI
      await this.enrichWithAI(linkObj, pageText);
      
    } catch (error) {
      console.error('[SRT] Page content processing failed:', error);
    }
  }

  async extractPageText(tabId) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: async () => {
          try {
            // Use the enhanced extraction from content script if available
            if (window.SRTContentScript?.extractPageData) {
              return await window.SRTContentScript.extractPageData();
            }
            
            // Fallback to basic extraction
            return {
              title: document.title || '',
              description: document.querySelector('meta[name="description"]')?.content || '',
              text: document.body?.innerText || '',
              metadata: {
                author: document.querySelector('meta[name="author"]')?.content || '',
                publishedTime: document.querySelector('meta[property="article:published_time"]')?.content || '',
                siteName: document.querySelector('meta[property="og:site_name"]')?.content || ''
              }
            };
          } catch (error) {
            console.error('[SRT] Content script extraction failed:', error);
            // Return basic fallback
            return {
              title: document.title || '',
              description: document.querySelector('meta[name="description"]')?.content || '',
              text: document.body?.innerText || '',
              metadata: {}
            };
          }
        }
      });

      const pageData = results?.[0]?.result;
      return pageData?.text || '';
    } catch (error) {
      console.debug('[SRT] Page text extraction failed:', error);
      return '';
    }
  }

  async enrichWithAI(linkObj, pageText) {
    try {
      const apiBase = await this.getApiBase();
      const response = await fetch(`${apiBase}/api/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkId: linkObj.id,
          url: linkObj.url,
          text: pageText.slice(0, 100000) // Limit text size
        })
      });

      if (!response.ok) {
        throw new Error(`Enrich API returned ${response.status}`);
      }

      const data = await response.json();
      
      if (data?.summary) {
        const tldrSummary = this.createSummary(
          linkObj.id, 
          'tldr', 
          data.summary, 
          data.embeddings?.[0]
        );
        await this.broadcastSummary(tldrSummary);
      }
    } catch (error) {
      console.debug('[SRT] AI enrichment failed:', error);
    }
  }

  createSummary(linkId, kind, content, embedding = null) {
    return {
      id: crypto.randomUUID(),
      linkId,
      kind,
      content,
      embedding,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async broadcastSummary(summaryObj) {
    try {
      const APP_URL_PATTERNS = [
        'http://localhost:5174/*',
        'http://localhost:5173/*', 
        'https://smartresearchtracker.vercel.app/*',
        'http://127.0.0.1:5174/*',
        'http://127.0.0.1:5173/*'
      ];

      const tabs = await this.queryTabs(APP_URL_PATTERNS);
      
      if (tabs.length === 0) {
        this.queueForLater({ type: 'ADD_SUMMARY', payload: summaryObj });
        return;
      }

      const promises = tabs.map(tab => 
        this.sendMessageToTab(tab.id, { 
          type: 'ADD_SUMMARY', 
          payload: summaryObj 
        })
      );

      await Promise.allSettled(promises);
      console.log('[SRT] Summary broadcasted:', summaryObj.kind);
    } catch (error) {
      console.error('[SRT] Summary broadcast failed:', error);
      this.queueForLater({ type: 'ADD_SUMMARY', payload: summaryObj });
    }
  }

  queueForLater(message) {
    this.pendingQueue.push({
      ...message,
      timestamp: Date.now(),
      retries: 0
    });
    
    // Store in chrome.storage for persistence
    chrome.storage.local.set({ 
      pendingUpserts: this.pendingQueue 
    });
  }

  async flushPendingQueue() {
    if (this.pendingQueue.length === 0) return;

          const APP_URL_PATTERNS = [
        'http://localhost:5174/*',
        'http://localhost:5173/*', 
        'https://smartresearchtracker.vercel.app/*',
        'http://127.0.0.1:5174/*',
        'http://127.0.0.1:5173/*'
      ];

    try {
      const tabs = await this.queryTabs(APP_URL_PATTERNS);
      if (tabs.length === 0) return;

      const toProcess = [...this.pendingQueue];
      this.pendingQueue = [];

      for (const message of toProcess) {
        try {
          const promises = tabs.map(tab => 
            this.sendMessageToTab(tab.id, message)
          );
          
          await Promise.allSettled(promises);
          console.log('[SRT] Pending message processed:', message.type);
        } catch (error) {
          console.error('[SRT] Failed to process pending message:', error);
          message.retries++;
          
          if (message.retries < this.maxRetries) {
            this.pendingQueue.push(message);
          }
        }
      }

      // Update storage
      chrome.storage.local.set({ pendingUpserts: this.pendingQueue });
    } catch (error) {
      console.error('[SRT] Queue flush failed:', error);
    }
  }

  async queryTabs(patterns) {
    return new Promise((resolve) => {
      chrome.tabs.query({ url: patterns }, (tabs) => {
        resolve(tabs || []);
      });
    });
  }

  async sendMessageToTab(tabId, message) {
    // Ensure content script is present; if not, inject and retry once
    const tryOnce = () => new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });

    try {
      return await tryOnce();
    } catch (err) {
      const msg = err?.message || '';
      const missing = /Receiving end does not exist|Could not establish connection/i.test(msg);
      if (!missing) throw err;
      try {
        await chrome.scripting.executeScript({ target: { tabId }, files: ['contentScript.js'] });
      } catch (_) {}
      await new Promise(r => setTimeout(r, 150));
      return await tryOnce();
    }
  }

  async getApiBase() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['apiBase'], (res) => {
        resolve(res.apiBase || 'https://smartresearchtracker.vercel.app');
      });
    });
  }

  updateBadge() {
    chrome.storage.local.get(['links'], (res) => {
      const links = res.links || [];
      chrome.action.setBadgeText({ text: links.length.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    });
  }

  async clearAllData() {
    try {
      // Clear chrome.storage
      await new Promise((resolve) => {
        chrome.storage.local.remove(['links', 'pendingUpserts', 'labels'], resolve);
      });

      // Clear pending queue
      this.pendingQueue = [];
      
      // Reset badge
      chrome.action.setBadgeText({ text: '0' });
      
      console.log('[SRT] All data cleared');
    } catch (error) {
      console.error('[SRT] Clear data failed:', error);
    }
  }
}

const linkProcessor = new EnhancedLinkProcessor();

// Message handling
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('[SRT] Background received message:', msg.type);

  switch (msg.type) {
    case 'SAVE_LINK':
      console.log('[SRT] Processing SAVE_LINK message...');
      linkProcessor.processLink(msg.payload)
        .then(result => {
          console.log('[SRT] SAVE_LINK result:', result);
          sendResponse?.(result);
        })
        .catch(error => {
          console.error('[SRT] SAVE_LINK failed:', error);
          sendResponse?.({ 
            success: false, 
            error: error.message || 'Unknown error',
            details: error.stack
          });
        });
      return true;

    case 'CLEAR_ALL_LINKS':
      console.log('[SRT] Processing CLEAR_ALL_LINKS message...');
      linkProcessor.clearAllData()
        .then(() => {
          console.log('[SRT] CLEAR_ALL_LINKS completed');
          sendResponse?.({ success: true });
        })
        .catch(error => {
          console.error('[SRT] CLEAR_ALL_LINKS failed:', error);
          sendResponse?.({ 
            success: false, 
            error: error.message || 'Unknown error' 
          });
        });
      return true;

    case 'DATA_UPDATED':
      // Dashboard notified us of data change, update badge
      console.log('[SRT] Processing DATA_UPDATED message...');
      linkProcessor.updateBadge();
      return false;

    default:
      console.warn('[SRT] Unknown message type:', msg.type);
      return false;
  }
});

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'openDashboard',
      title: '📊 Open Smart Research Dashboard',
      contexts: ['action', 'page', 'selection']
    });
    
    chrome.contextMenus.create({
      id: 'saveToResearch',
      title: '💾 Save to Smart Research',
      contexts: ['page', 'link', 'selection']
    });

    chrome.contextMenus.create({
      id: 'separator1',
      type: 'separator',
      contexts: ['page', 'link', 'selection']
    });

    chrome.contextMenus.create({
      id: 'quickSave',
      title: '⚡ Quick Save (Current Page)',
      contexts: ['page']
    });
  });
  
  // Initialize badge
  linkProcessor.updateBadge();
  
  // Load pending queue from storage
  chrome.storage.local.get(['pendingUpserts'], (res) => {
    if (res.pendingUpserts) {
      linkProcessor.pendingQueue = res.pendingUpserts;
    }
  });
});

// Context menu handling
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'openDashboard':
      openDashboard();
      break;
      
    case 'saveToResearch':
      chrome.action.openPopup();
      break;
      
    case 'quickSave':
      quickSave(tab);
      break;
  }
});

// Dashboard opening with fallback
async function openDashboard() {
  const urls = [
    'http://localhost:5174/',
    'http://localhost:5173/',
    'http://127.0.0.1:5174/',
    'http://127.0.0.1:5173/',
    'https://smartresearchtracker.vercel.app/'
  ];

  for (const url of urls) {
    try {
      await new Promise((resolve, reject) => {
        chrome.tabs.create({ url }, (tab) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(tab);
          }
        });
      });
      return; // Success
    } catch (error) {
      console.debug('[SRT] Failed to open dashboard at:', url);
    }
  }

  // All URLs failed
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon.svg',
    title: 'Smart Research Tracker',
    message: 'Could not open dashboard. Make sure the app is running.'
  });
}

// Quick save functionality
async function quickSave(tab) {
  if (!tab?.url || tab.url.startsWith('chrome://')) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon.svg',
      title: 'Smart Research Tracker',
      message: 'Cannot save this page type.'
    });
    return;
  }

  try {
    // Extract basic page data
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        title: document.title || '',
        description: document.querySelector('meta[name="description"]')?.content || '',
        text: document.body?.innerText?.slice(0, 10000) || ''
      })
    });

    const pageData = results?.[0]?.result || {};
    
    // Process the link
    const result = await linkProcessor.processLink({
      url: tab.url,
      title: pageData.title,
      description: pageData.description,
      pageText: pageData.text,
      tabId: tab.id,
      priority: 'medium',
      label: 'quick-save'
    });

    if (result.success) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon.svg',
        title: 'Smart Research Tracker',
        message: 'Page saved successfully!'
      });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('[SRT] Quick save failed:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon.svg',
      title: 'Smart Research Tracker',
      message: 'Failed to save page. Please try again.'
    });
  }
}

// Periodic queue flushing
setInterval(() => {
  linkProcessor.flushPendingQueue();
}, 30000); // Every 30 seconds

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('[SRT] Extension started');
  linkProcessor.updateBadge();
});

// Handle tab updates to flush queue when dashboard opens
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      (tab.url?.includes('localhost:5173') || tab.url?.includes('localhost:5174') || tab.url?.includes('smartresearchtracker.vercel.app'))) {
    // Dashboard tab loaded, flush pending queue
    setTimeout(() => linkProcessor.flushPendingQueue(), 1000);
  }
}); 