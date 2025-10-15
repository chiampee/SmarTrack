// Enhanced background script for Smart Research Tracker
// Handles data processing, AI enrichment, and dashboard synchronization

console.log('[Smart Research Tracker] Enhanced background script loaded');

// Robust URL normalizer for duplicate detection
function normalizeUrlForCompare(rawUrl) {
  try {
    const u = new URL(String(rawUrl || '').trim());
    const host = (u.hostname || '').replace(/^www\./i, '');
    // Drop query and hash; keep only host + pathname
    let path = decodeURIComponent(u.pathname || '/');
    // Remove trailing slashes
    path = path.replace(/\/+$/, '');
    // Treat root as empty path to keep host only
    if (path === '/') path = '';
    return `${host}${path}`.toLowerCase();
  } catch (_) {
    // Fallback best-effort normalization
    return String(rawUrl || '')
      .trim()
      .replace(/#.*/, '')
      .replace(/\?.*/, '')
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .replace(/\/+$/, '')
      .toLowerCase();
  }
}

// Track tabs where the content script has announced readiness
const __SRT_readyTabs = new Set();
// Suppress transient tab connection rejections (navigation/race)
self.addEventListener('unhandledrejection', (e) => {
  const msg = (e.reason && e.reason.message) || '';
  if (/Could not establish connection|Receiving end does not exist/i.test(msg)) {
    e.preventDefault();
    console.debug('[SRT] Ignored transient tab connection error:', msg);
  }
});

// Listen for readiness pings from content scripts
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === 'CS_READY' && sender?.tab?.id) {
    __SRT_readyTabs.add(sender.tab.id);
  }
});

// Clean up registry on tab lifecycle
chrome.tabs.onRemoved.addListener((tabId) => __SRT_readyTabs.delete(tabId));
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') __SRT_readyTabs.delete(tabId);
});

// Periodic stuck links check (every 30 seconds)
setInterval(() => {
  try {
    linkProcessor.updateBadge();
  } catch (error) {
    console.debug('[SRT] Periodic badge update failed:', error);
  }
}, 30000);

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
      
      // Check for duplicates first
      console.log('[SRT] Starting duplicate check...');
      const duplicateCheck = await this.checkForDuplicates(payload.url);
      console.log('[SRT] Duplicate check completed:', duplicateCheck);
      
      if (duplicateCheck.hasDuplicates) {
        console.log('[SRT] Duplicates detected, returning duplicate response');
        return {
          success: false,
          isDuplicate: true,
          duplicateInfo: duplicateCheck,
          message: 'Duplicate link detected'
        };
      }
      
      console.log('[SRT] No duplicates, proceeding with save...');
      
      // Build enhanced Link object
      const linkForDexie = this.buildLinkObject(payload);
      
      // Save to chrome.storage.local (shared storage accessible by background script)
      console.log('[SRT] Saving link to chrome.storage.local');
      try {
        await this.storeNewLinkInChromeStorage(payload, linkForDexie.id);
        console.log('[SRT] ✅ Link saved to chrome.storage.local');
      } catch (error) {
        console.error('[SRT] ❌ Chrome storage save failed:', error);
        throw new Error('Failed to save to chrome.storage: ' + error.message);
      }
      
      // Broadcast to dashboard with the link data (dashboard will save to its IndexedDB)
      try {
        await this.broadcastToDashboard(linkForDexie);
        console.log('[SRT] 📢 Dashboard notified with link data');
      } catch (error) {
        console.error('[SRT] Dashboard broadcast failed (not critical):', error);
        // Don't throw - link is saved in chrome.storage
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

  async checkForDuplicates(url) {
    try {
      console.log('[SRT] Checking for duplicates in IndexedDB for URL:', url);
      
      // Ask content script to check IndexedDB for duplicates
      // Since background script can't access IndexedDB, we delegate to content script
      console.log('[SRT] Duplicate check delegated to content script (IndexedDB)');
      
      // For now, skip duplicate checking and let UPSERT_LINK handle it
      // The content script's handleUpsertLink will check and update if duplicate exists
      return { hasDuplicates: false, count: 0, duplicates: [] };
    } catch (error) {
      console.error('[SRT] Duplicate check failed:', error);
      return { hasDuplicates: false, count: 0, duplicates: [] };
    }
  }

  async saveLinkWithConfirmation(payload, duplicateInfo) {
    try {
      console.log('[SRT] Saving link with user confirmation:', payload.url);
      
      // Build enhanced Link object
      const linkForDexie = this.buildLinkObject(payload);
      
      // CHANGED: No longer save to chrome.storage.local - dashboard handles all storage via IndexedDB
      // The dashboard will receive the SRT_UPSERT_LINK message and save to IndexedDB
      console.log('[SRT] Skipping chrome.storage - using dashboard IndexedDB as single source of truth');
      
      // Broadcast to dashboard (dashboard will save to IndexedDB)
      try {
        await this.broadcastToDashboard(linkForDexie);
        console.log('[SRT] Link sent to dashboard for IndexedDB storage:', linkForDexie.url);
      } catch (error) {
        console.error('[SRT] Dashboard broadcast failed:', error);
        throw new Error('Failed to send link to dashboard. Make sure the dashboard is open.');
      }
      
      // Process page content for AI enrichment (non-blocking)
      try {
        await this.processPageContent(payload, linkForDexie);
      } catch (error) {
        console.error('[SRT] Page content processing failed:', error);
        // Don't throw here, just log - the link is still saved
      }
      
      // Update badge (will show 0 since we no longer use chrome.storage)
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
        // Ensure popup-provided description wins
        description: payload.description || payload.metadata?.description || '',
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
        const normUrl = normalizeUrlForCompare(payload.url);
        const existingIndex = links.findIndex((l) => normalizeUrlForCompare(l.url) === normUrl);

        if (existingIndex === -1) {
          // New link
          links.push({
            ...payload,
            normalizedUrl: normUrl,
            savedAt: Date.now(),
            id: linkId,
            processed: true,
            updatedAt: new Date().toISOString(),
          });
        } else {
          // Upsert existing: merge new data so the latest save is reflected in the dashboard
          const current = links[existingIndex] || {};
          links[existingIndex] = {
            ...current,
            ...payload,
            normalizedUrl: current.normalizedUrl || normUrl,
            id: current.id || linkId,
            processed: true,
            // Ensure we keep/refresh timestamps
            createdAt: current.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          console.log('[SRT] Link updated in chrome.storage (upsert):', payload.url);
        }

        chrome.storage.local.set({ links }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            console.log('[SRT] Links persisted. Total:', links.length);
            try { chrome.runtime.sendMessage({ type: 'DATA_UPDATED', timestamp: Date.now() }); } catch (_) {}
            resolve();
          }
        });
      });
    });
  }

  async storeNewLinkInChromeStorage(payload, linkId) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['links'], (res) => {
        const links = res.links || [];
        const normUrl = normalizeUrlForCompare(payload.url);
        
        // Always add as a new link, even if URL exists
        const newLink = {
          ...payload,
          normalizedUrl: normUrl,
          savedAt: Date.now(),
          id: linkId,
          processed: true,
          updatedAt: new Date().toISOString(),
          // Mark as duplicate for tracking
          isDuplicate: true,
          duplicateOf: payload.url
        };
        
        links.push(newLink);

        chrome.storage.local.set({ links }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            console.log('[SRT] Duplicate link saved as new entry:', payload.url);
            try { chrome.runtime.sendMessage({ type: 'DATA_UPDATED', timestamp: Date.now() }); } catch (_) {}
            resolve();
          }
        });
      });
    });
  }

  async sendToContentScript(tabId, linkObj) {
    if (!tabId) {
      throw new Error('No tab ID provided');
    }

    try {
      console.log('[SRT] Sending UPSERT_LINK to content script on tab:', tabId);
      
      const response = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, {
          type: 'UPSERT_LINK',
          link: linkObj,
          summaries: []
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      if (response?.success) {
        console.log('[SRT] ✅ Content script confirmed save:', response);
        return response;
      } else {
        throw new Error(response?.error || 'Content script save failed');
      }
    } catch (error) {
      console.error('[SRT] Failed to send to content script:', error);
      throw error;
    }
  }

  async broadcastToDashboard(linkObj, summaries = []) {
    const APP_URL_PATTERNS = [
      'http://localhost:5174/*',
      'http://localhost:5173/*', 
      'https://localhost:5174/*',
      'https://localhost:5173/*',
      'http://127.0.0.1:5174/*',
      'http://127.0.0.1:5173/*',
      'https://127.0.0.1:5174/*',
      'https://127.0.0.1:5173/*',
      'file://*/*'
    ];

    try {
      // Only target tabs that have announced readiness
      const allTabs = await this.queryTabs(APP_URL_PATTERNS);
      const tabs = (allTabs || []).filter(t => __SRT_readyTabs.has(t.id));
      
      if (tabs.length === 0) {
        // Dashboard not open, queue for later AND proactively set badge to indicate pending item
        this.queueForLater({ type: 'UPSERT_LINK', link: linkObj, summaries });
        try { this.updateBadge(); } catch (_) {}
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
      // Guard: only attempt script execution on eligible tabs
      if (!pageText && payload.tabId) {
        const tabOk = await new Promise((resolve) => {
          try {
            chrome.tabs.get(payload.tabId, (tab) => {
              if (chrome.runtime.lastError) return resolve(false);
              const url = tab?.url || '';
              const isHttp = /^https?:\/\//i.test(url);
              const isSpecial = /^(about:|chrome:|edge:|chrome-extension:)/i.test(url);
              resolve(Boolean(tab?.id) && isHttp && !isSpecial);
            });
          } catch (_) { resolve(false); }
        });
        if (!tabOk) return;
        try {
          const injected = await new Promise((resolve) => {
            chrome.scripting.executeScript({
              target: { tabId: payload.tabId },
              func: async () => {
                try {
                  if (window.SRTContentScript?.extractPageData) {
                    return await window.SRTContentScript.extractPageData();
                  }
                  return {
                    title: document.title || '',
                    description: document.querySelector('meta[name="description"]')?.content || '',
                    text: document.body?.innerText || '',
                    metadata: {}
                  };
                } catch (err) {
                  console.debug('[SRT] Inline extraction failed:', err);
                  return { title: document.title || '', description: '', text: document.body?.innerText || '', metadata: {} };
                }
              }
            }, (res) => resolve(res?.[0]?.result || null));
          });
          if (injected?.text && !pageText) pageText = injected.text;
        } catch (e) {
          console.debug('[SRT] Script execute failed:', e);
        }
      }

      // Create a raw summary and broadcast
      if (pageText) {
        const rawSummary = this.createSummary(linkObj.id, 'raw', pageText);
        await this.broadcastSummary(rawSummary);
      }

      // Kick off AI enrichment
      try {
        await this.enrichWithAI(linkObj, pageText || '');
      } catch (_) {}
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
        'http://127.0.0.1:5174/*',
        'http://127.0.0.1:5173/*',
        'file://*/*'
      ];

      const allTabs = await this.queryTabs(APP_URL_PATTERNS);
      const tabs = (allTabs || []).filter(t => __SRT_readyTabs.has(t.id));
      
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
        'http://127.0.0.1:5174/*',
        'http://127.0.0.1:5173/*',
        'file://*/*'
      ];

    try {
      const allTabs = await this.queryTabs(APP_URL_PATTERNS);
      const tabs = (allTabs || []).filter(t => __SRT_readyTabs.has(t.id));
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

      // Update storage and badge
      chrome.storage.local.set({ pendingUpserts: this.pendingQueue });
      try { this.updateBadge(); } catch (_) {}
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
    // Robust send that never throws; injects content script once if needed
    const tryOnce = () => new Promise((resolve) => {
      try {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ ok: false, error: chrome.runtime.lastError.message || 'send_failed' });
          } else {
            resolve(response ?? { ok: true });
          }
        });
      } catch (e) {
        resolve({ ok: false, error: e?.message || 'send_failed' });
      }
    });

    let result = await tryOnce();
    const missing = typeof result === 'object' && result && result.ok === false && /Receiving end does not exist|Could not establish connection/i.test(result.error || '');
    if (missing) {
      try { await chrome.scripting.executeScript({ target: { tabId }, files: ['contentScript.js'] }); } catch (_) {}
      await new Promise(r => setTimeout(r, 150));
      result = await tryOnce();
    }
    return result;
  }

  async getApiBase() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['apiBase', 'dashboardUrl'], (res) => {
        const stored = res.apiBase || res.dashboardUrl || '';
        if (stored && /^https?:\/\//i.test(stored)) return resolve(stored.replace(/\/?$/,'') );
        resolve('http://localhost:5174');
      });
    });
  }

  updateBadge() {
    // Count only "stuck" links - links that exist in extension but aren't displayed on dashboard
    this.countStuckLinks().then(stuckCount => {
      const badgeText = stuckCount > 0 ? stuckCount.toString() : '';
      chrome.action.setBadgeText({ text: badgeText });
      
      // Color coding: red for stuck links, green for no issues
      const badgeColor = stuckCount > 0 ? '#ef4444' : '#10b981';
      chrome.action.setBadgeBackgroundColor({ color: badgeColor });
      
      console.log(`[SRT] Badge updated: ${stuckCount} stuck links`);
    }).catch(error => {
      console.error('[SRT] Badge update failed:', error);
      // Fallback to showing total count if stuck detection fails
      chrome.storage.local.get(['links'], (res) => {
        const links = res.links || [];
        chrome.action.setBadgeText({ text: links.length.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
      });
    });
  }

  async countStuckLinks() {
    try {
      // Get all links from extension storage
      const extensionLinks = await new Promise((resolve) => {
        chrome.storage.local.get(['links'], (res) => {
          resolve(res.links || []);
        });
      });

      if (extensionLinks.length === 0) {
        return 0;
      }

      // Find dashboard tabs that are ready to receive messages
      const dashboardTabs = await this.getReadyDashboardTabs([
        "http://localhost:5173/*",
        "https://localhost:5173/*",
        "http://localhost:5174/*",
        "https://localhost:5174/*", 
        "https://smartresearchtracker.vercel.app/*"
      ]);

      if (dashboardTabs.length === 0) {
        // No dashboard tabs open - all links are potentially stuck
        return extensionLinks.length;
      }

      // Check each dashboard tab to see which links are actually displayed
      let stuckLinks = new Set(extensionLinks.map(link => link.url));
      
      for (const tab of dashboardTabs) {
        try {
          // Use a more reliable method to check displayed links
          const displayedLinks = await this.getDisplayedLinksFromTab(tab.id);
          
          if (displayedLinks && displayedLinks.length > 0) {
            // Remove links that are displayed on this dashboard tab
            displayedLinks.forEach(link => {
              stuckLinks.delete(link.url);
            });
          }
        } catch (error) {
          console.debug(`[SRT] Could not check tab ${tab.id} for displayed links:`, error);
          // If we can't check a tab, assume all links might be stuck
          continue;
        }
      }

      return stuckLinks.size;
    } catch (error) {
      console.error('[SRT] Error counting stuck links:', error);
      throw error;
    }
  }

  async getDisplayedLinksFromTab(tabId) {
    return new Promise((resolve) => {
      let timeout;
      let responseReceived = false;
      
      // Set up a listener for the response from the content script
      const messageListener = (message, sender) => {
        if (sender.tab?.id === tabId && message.type === 'SRT_DISPLAYED_LINKS_RESPONSE') {
          responseReceived = true;
          clearTimeout(timeout);
          chrome.runtime.onMessage.removeListener(messageListener);
          resolve(message.links || []);
        }
      };
      
      // Listen for the response
      chrome.runtime.onMessage.addListener(messageListener);
      
      // Send the request to the content script
      try {
        chrome.tabs.sendMessage(tabId, { type: 'SRT_GET_DISPLAYED_LINKS' }, (response) => {
          // Check if we got a direct response (content script might use sendResponse)
          if (response && response.links) {
            responseReceived = true;
            clearTimeout(timeout);
            chrome.runtime.onMessage.removeListener(messageListener);
            resolve(response.links || []);
            return;
          }
          
          if (chrome.runtime.lastError) {
            console.debug(`[SRT] Could not send message to tab ${tabId}:`, chrome.runtime.lastError.message);
            // Fallback: try to inject content script and retry
            chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['contentScript.js']
            }, () => {
              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, { type: 'SRT_GET_DISPLAYED_LINKS' });
              }, 100);
            });
          }
        });
      } catch (error) {
        console.debug(`[SRT] Error sending message to tab ${tabId}:`, error);
      }
      
      // Set a timeout to avoid hanging
      timeout = setTimeout(() => {
        if (!responseReceived) {
          chrome.runtime.onMessage.removeListener(messageListener);
          console.debug(`[SRT] Timeout waiting for displayed links response from tab ${tabId}`);
          resolve([]);
        }
      }, 2000);
    });
  }

  async getReadyDashboardTabs(patterns) {
    return new Promise((resolve) => {
      chrome.tabs.query({ url: patterns }, (tabs) => {
        resolve(tabs || []);
      });
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
    case 'CS_READY':
      try { linkProcessor.flushPendingQueue(); } catch (_) {}
      return false;
    case 'GET_LINKS':
      try {
        chrome.storage.local.get(['links'], (res) => {
          sendResponse?.({ links: res.links || [] });
        });
      } catch (e) {
        sendResponse?.({ links: [] });
      }
      return true;
    case 'INJECT_CONTENT_SCRIPT':
      // Best-effort injection into active tab for debugging/assist
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tab = tabs?.[0];
          if (!tab?.id) return sendResponse?.({ success: false });
          chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['contentScript.js'] }, () => {
            sendResponse?.({ success: true });
          });
        });
      } catch (_) {
        sendResponse?.({ success: false });
      }
      return true;

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
      console.log('[SRT] Processing DATA_UPDATED message...');
      linkProcessor.updateBadge();
      return false;
      
    case 'REFRESH_BADGE':
      console.log('[SRT] Manually refreshing badge...');
      linkProcessor.updateBadge();
      sendResponse?.({ success: true });
      return true;

    case 'SAVE_LINK_CONFIRMED':
      console.log('[SRT] Processing SAVE_LINK_CONFIRMED message...');
      linkProcessor.saveLinkWithConfirmation(msg.payload, msg.duplicateInfo)
        .then(result => {
          console.log('[SRT] SAVE_LINK_CONFIRMED result:', result);
          sendResponse?.(result);
        })
        .catch(error => {
          console.error('[SRT] SAVE_LINK_CONFIRMED failed:', error);
          sendResponse?.({ 
            success: false, 
            error: error.message || 'Unknown error',
            details: error.stack
          });
        });
      return true;

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
  try {
    // Try user-configured dashboard URL first (supports file:/// and http(s))
    const syncSettings = await new Promise((resolve) => chrome.storage.sync.get({ dashboardUrl: '' }, resolve));
    const localSettings = await new Promise((resolve) => chrome.storage.local.get({ apiBase: '', dashboardUrl: '' }, resolve));
    const candidates = [syncSettings.dashboardUrl, localSettings.dashboardUrl, localSettings.apiBase].filter(Boolean);
    for (const u of candidates) {
      try {
        if (u) {
          await new Promise((resolve, reject) => {
            chrome.tabs.create({ url: u }, (tab) => {
              if (chrome.runtime.lastError) reject(chrome.runtime.lastError); else resolve(tab);
            });
          });
          return;
        }
      } catch (_) {}
    }
  } catch (e) {
    // fall through to defaults
  }

  const defaults = [
    'http://localhost:5174/',
    'http://localhost:5173/',
    'http://127.0.0.1:5174/',
    'http://127.0.0.1:5173/'
  ];
  for (const url of defaults) {
    try {
      await new Promise((resolve, reject) => {
        chrome.tabs.create({ url }, (tab) => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError); else resolve(tab);
        });
      });
      return;
    } catch (_) {}
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
      (tab.url?.startsWith('file:///') || tab.url?.includes('localhost:5173') || tab.url?.includes('localhost:5174'))) {
    // Dashboard tab loaded, flush pending queue
    setTimeout(() => linkProcessor.flushPendingQueue(), 1000);
  }
}); 