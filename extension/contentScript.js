// Enhanced content script for Smart Research Tracker
// Handles data persistence, real-time sync, and improved error recovery

console.log('[Smart Research Tracker] Enhanced content script loaded');

// Mark presence so webpages can reliably detect the extension
function exposeExtensionPresence() {
  try {
    // 1) Add a stable data-attribute on <html>
    document.documentElement.setAttribute(
      'data-smart-research-tracker',
      'true'
    );
    document.documentElement.setAttribute(
      'data-extension',
      'smart-research-tracker'
    );

    // 2) Inject a small, inert marker element for querySelector checks
    const markerId = 'srt-extension-marker';
    if (!document.getElementById(markerId)) {
      const marker = document.createElement('meta');
      marker.id = markerId;
      marker.setAttribute('data-smart-research-tracker', 'true');
      marker.setAttribute('data-extension', 'smart-research-tracker');
      marker.content = 'installed';
      document.documentElement.appendChild(marker);
    }

    // 3) Fire a custom event for consumers that prefer events
    document.dispatchEvent(
      new CustomEvent('smart-research-tracker-ready', {
        detail: { source: 'smart-research-tracker-extension' },
      })
    );

    // Avoid inline script injection to respect strict site CSPs

    // 4) Answer simple postMessage pings from the page context
    window.addEventListener('message', (event) => {
      try {
        const data = event?.data || {};
        if (data.type !== 'SRT_PING') return;

        const manifest =
          (chrome?.runtime?.getManifest && chrome.runtime.getManifest()) || {};
        window.postMessage(
          {
            type: 'SRT_PONG',
            extensionId: chrome?.runtime?.id || '',
            source: 'smart-research-tracker-extension',
            status: 'ok',
            message: 'Extension is working',
            version: manifest.version || '',
            timestamp: Date.now(),
          },
          '*'
        );
      } catch (_) {
        // Avoid throwing in isolated world
      }
    });
  } catch (error) {
    console.debug('[SRT] Presence exposure failed:', error);
  }
}

exposeExtensionPresence();

// --- Auto-paste when opened by SRT via window.name payload ---
try {
  const wn = window.name || '';
  if (typeof wn === 'string' && wn.startsWith('SRT_PASTE::')) {
    const encoded = wn.slice('SRT_PASTE::'.length);
    try {
      const decoded = decodeURIComponent(escape(atob(encoded)));
      // Try to paste into any visible textarea/contenteditable
      const tryPaste = () => {
        const selectors = [
          'textarea',
          'textarea[placeholder*="Message"]',
          'textarea[placeholder*="Send a message"]',
          '[contenteditable="true"][role="textbox"]',
          '[contenteditable="true"]',
        ];
        let input = null;
        for (const s of selectors) {
          const el = document.querySelector(s);
          if (el && (el.offsetWidth || el.offsetHeight)) {
            input = el;
            break;
          }
        }
        if (input) {
          input.focus();
          if (
            input instanceof HTMLTextAreaElement ||
            input instanceof HTMLInputElement
          ) {
            input.value = decoded;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          } else if (
            input instanceof HTMLElement &&
            input.contentEditable === 'true'
          ) {
            input.textContent = decoded;
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
          console.log('[SRT] Auto-paste applied from window.name payload');
        } else {
          console.log('[SRT] No input found yet, retrying...');
          setTimeout(tryPaste, 1500);
        }
      };
      // Initial delay to allow page layout
      setTimeout(tryPaste, 2500);
    } catch (e) {
      console.log('[SRT] Failed to decode payload:', e);
    }
    // Clear the name to avoid leaking content across navigations
    try {
      window.name = '';
    } catch (_) {}
  }
} catch (e) {
  console.log('[SRT] window.name inspection failed:', e);
}

const DB_NAME = 'SmartResearchDB';
const DB_VERSION = 8;
const REQUIRED_STORES = ['links', 'summaries', 'settings'];

// Enhanced database management with better error handling
class EnhancedDBManager {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.useFallbackStorage = false;
  }

  async ensureStores(db) {
    const missingStores = REQUIRED_STORES.filter(
      (store) => !db.objectStoreNames.contains(store)
    );

    if (missingStores.length === 0) {
      return db;
    }

    const newVersion = db.version + 1;
    db.close();

    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, newVersion);

      req.onupgradeneeded = (event) => {
        const upDB = event.target.result;

        missingStores.forEach((store) => {
          if (!upDB.objectStoreNames.contains(store)) {
            const objStore = upDB.createObjectStore(store, { keyPath: 'id' });

            if (store === 'links') {
              objStore.createIndex('url', 'url', { unique: false });
              objStore.createIndex('createdAt', 'createdAt', { unique: false });
              objStore.createIndex('labels', 'labels', {
                unique: false,
                multiEntry: true,
              });
            }

            if (store === 'summaries') {
              objStore.createIndex('linkId', 'linkId', { unique: false });
              objStore.createIndex('kind', 'kind', { unique: false });
            }
          }
        });
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async openDB() {
    if (this.db && this.isInitialized) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const attemptOpen = async (versionSpecified = true) => {
        try {
          const req = versionSpecified
            ? indexedDB.open(DB_NAME, DB_VERSION)
            : indexedDB.open(DB_NAME);

          req.onupgradeneeded = async (event) => {
            const db = event.target.result;
            await this.ensureStores(db);
          };

          req.onsuccess = async () => {
            try {
              const db = req.result;
              await this.ensureStores(db);
              this.db = db;
              this.isInitialized = true;
              this.retryCount = 0;
              resolve(db);
            } catch (error) {
              reject(error);
            }
          };

          req.onerror = () => {
            if (
              req.error?.name === 'VersionError' &&
              versionSpecified &&
              this.retryCount < this.maxRetries
            ) {
              this.retryCount++;
              attemptOpen(false);
            } else {
              reject(req.error);
            }
          };
        } catch (error) {
          reject(error);
        }
      };

      attemptOpen();
    });
  }

  async addLink(link) {
    // Always try fallback first if we're on a restricted site
    if (this.useFallbackStorage || this.shouldUseFallback()) {
      return this.addLinkFallback(link);
    }

    try {
      const db = await this.openDB();
      const tx = db.transaction('links', 'readwrite');
      const store = tx.objectStore('links');

      // Enhanced duplicate detection
      const normalizedUrl = this.normalizeUrl(link.url);
      const existingLinks = await this.getAllLinks();
      const isDuplicate = existingLinks.some(
        (l) => this.normalizeUrl(l.url) === normalizedUrl
      );

      if (isDuplicate) {
        console.debug('[SRT] Duplicate link detected:', link.url);
        return { success: false, reason: 'duplicate' };
      }

      return new Promise((resolve, reject) => {
        const request = store.put(link);

        request.onsuccess = () => {
          console.log('[SRT] Link added successfully:', link.url);
          this.notifyDashboardUpdate();
          resolve({ success: true, link });
        };

        request.onerror = () => {
          console.error('[SRT] Failed to add link:', request.error);
          this.useFallbackStorage = true;
          this.addLinkFallback(link).then(resolve).catch(reject);
        };
      });
    } catch (error) {
      console.error(
        '[SRT] IndexedDB failed, falling back to chrome.storage:',
        error
      );
      this.useFallbackStorage = true;
      return this.addLinkFallback(link);
    }
  }

  shouldUseFallback() {
    // Check if we're on a site that likely blocks IndexedDB
    const restrictedDomains = [
      'gmail.com',
      'google.com',
      'workspace.google.com',
      'outlook.com',
      'office.com',
      'microsoft.com',
      'github.com',
      'gitlab.com',
      'stackoverflow.com',
      'stackexchange.com',
    ];

    const currentDomain = window.location.hostname.toLowerCase();
    const isRestricted = restrictedDomains.some((domain) =>
      currentDomain.includes(domain)
    );

    // Also use fallback if we've had any IndexedDB errors
    if (this.useFallbackStorage) {
      return true;
    }

    return isRestricted;
  }

  async addLinkFallback(link) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['links'], (result) => {
        const links = result.links || [];

        // Check for duplicates
        const normalizedUrl = this.normalizeUrl(link.url);
        const isDuplicate = links.some(
          (l) => this.normalizeUrl(l.url) === normalizedUrl
        );

        if (isDuplicate) {
          console.debug('[SRT] Duplicate link detected (fallback):', link.url);
          resolve({ success: false, reason: 'duplicate' });
          return;
        }

        // Add new link
        links.push(link);
        chrome.storage.local.set({ links }, () => {
          console.log('[SRT] Link added successfully (fallback):', link.url);
          this.notifyDashboardUpdate();
          resolve({ success: true, link });
        });
      });
    });
  }

  async addSummary(summary) {
    const db = await this.openDB();
    const tx = db.transaction('summaries', 'readwrite');
    const store = tx.objectStore('summaries');

    return new Promise((resolve, reject) => {
      const request = store.put(summary);

      request.onsuccess = () => {
        console.log(
          '[SRT] Summary added successfully for link:',
          summary.linkId
        );
        this.notifyDashboardUpdate();
        resolve({ success: true, summary });
      };

      request.onerror = () => {
        console.error('[SRT] Failed to add summary:', request.error);
        reject(request.error);
      };
    });
  }

  async getAllLinks() {
    // Always try fallback first if we're on a restricted site
    if (this.useFallbackStorage || this.shouldUseFallback()) {
      return this.getAllLinksFallback();
    }

    try {
      const db = await this.openDB();
      const tx = db.transaction('links', 'readonly');
      const store = tx.objectStore('links');

      return new Promise((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          this.useFallbackStorage = true;
          this.getAllLinksFallback().then(resolve).catch(reject);
        };
      });
    } catch (error) {
      console.error(
        '[SRT] IndexedDB failed, falling back to chrome.storage:',
        error
      );
      this.useFallbackStorage = true;
      return this.getAllLinksFallback();
    }
  }

  async getAllLinksFallback() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['links'], (result) => {
        resolve(result.links || []);
      });
    });
  }

  async getLabels() {
    try {
      const links = await this.getAllLinks();
      const labelSet = new Set();

      links.forEach((link) => {
        if (link.labels && Array.isArray(link.labels)) {
          link.labels.forEach((label) => labelSet.add(label));
        }
      });

      return Array.from(labelSet);
    } catch (error) {
      console.error('[SRT] Error getting labels:', error);
      return [];
    }
  }

  normalizeUrl(url) {
    return url.replace(/\/+$/, '').toLowerCase();
  }

  // Notify dashboard of data changes
  notifyDashboardUpdate() {
    // Send message to any open dashboard tabs (background may use this)
    try {
      chrome.runtime.sendMessage({
        type: 'DATA_UPDATED',
        timestamp: Date.now(),
      });
    } catch (_) {}

    // Also notify the page directly so the dashboard React app can refresh
    try {
      window.postMessage(
        { type: 'SRT_DB_UPDATED', timestamp: Date.now() },
        '*'
      );
      document.dispatchEvent(new CustomEvent('srt-db-updated'));
    } catch (_) {}
  }

  // Enhanced data cleanup
  async clearAllData() {
    try {
      const db = await this.openDB();
      const tx = db.transaction(['links', 'summaries'], 'readwrite');

      await Promise.all([
        new Promise((resolve, reject) => {
          const linksRequest = tx.objectStore('links').clear();
          linksRequest.onsuccess = resolve;
          linksRequest.onerror = reject;
        }),
        new Promise((resolve, reject) => {
          const summariesRequest = tx.objectStore('summaries').clear();
          summariesRequest.onsuccess = resolve;
          summariesRequest.onerror = reject;
        }),
      ]);

      console.log('[SRT] All data cleared successfully');
      this.notifyDashboardUpdate();
    } catch (error) {
      console.error('[SRT] Error clearing data:', error);
    }
  }
}

const dbManager = new EnhancedDBManager();

// Enhanced message handling with better error recovery
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('[SRT] Received message:', msg.type);

  // Always use fallback storage to avoid any DOMException issues
  if (!dbManager.useFallbackStorage) {
    console.log('[SRT] Forcing fallback storage to prevent DOMException');
    dbManager.useFallbackStorage = true;
  }

  // Handle messages immediately with fallback storage
  handleMessage(msg, sender, sendResponse);
  return true;
});

function handleMessage(msg, sender, sendResponse) {
  switch (msg.type) {
    case 'GET_LABELS':
      dbManager
        .getLabels()
        .then((labels) => sendResponse?.({ labels }))
        .catch(() => sendResponse?.({ labels: [] }));
      break;

    case 'UPSERT_LINK':
      handleUpsertLink(msg.link, msg.summaries || [])
        .then((result) => sendResponse?.(result))
        .catch((error) => {
          console.error('[SRT] UPSERT_LINK error:', error);
          sendResponse?.({ success: false, error: error.message });
        });
      break;

    case 'ADD_LINK':
      handleAddLink(msg.payload)
        .then((result) => sendResponse?.(result))
        .catch((error) => {
          console.error('[SRT] ADD_LINK error:', error);
          sendResponse?.({ success: false, error: error.message });
        });
      break;

    case 'ADD_SUMMARY':
      handleAddSummary(msg.payload)
        .then((result) => sendResponse?.(result))
        .catch((error) => {
          console.error('[SRT] ADD_SUMMARY error:', error);
          sendResponse?.({ success: false, error: error.message });
        });
      break;

    case 'CLEAR_ALL_DATA':
      dbManager
        .clearAllData()
        .then(() => sendResponse?.({ success: true }))
        .catch((error) =>
          sendResponse?.({ success: false, error: error.message })
        );
      break;

    default:
      console.warn('[SRT] Unknown message type:', msg.type);
      sendResponse?.({ success: false, error: 'Unknown message type' });
      break;
  }
}

async function handleUpsertLink(link, summaries = []) {
  try {
    // Create a completely safe link object with only primitive values
    const safeLink = {
      id: link.id || crypto.randomUUID(),
      url: String(link.url || ''),
      metadata: {
        title: String(link.metadata?.title || ''),
        description: String(link.metadata?.description || ''),
        image: String(link.metadata?.image || ''),
        author: String(link.metadata?.author || ''),
        publishedTime: String(link.metadata?.publishedTime || ''),
        siteName: String(link.metadata?.siteName || ''),
      },
      labels: Array.isArray(link.labels)
        ? link.labels.map(String)
        : ['research'],
      priority: String(link.priority || 'medium'),
      status: String(link.status || 'active'),
      boardId: link.boardId || null,
      createdAt: link.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('[SRT] Saving link using fallback storage:', safeLink.url);
    console.log('[SRT] Link metadata:', safeLink.metadata);
    console.log('[SRT] Link labels:', safeLink.labels);
    console.log('[SRT] Link status:', safeLink.status);
    console.log('[SRT] Link created:', safeLink.createdAt);
    console.log('[SRT] Full link object:', safeLink);

    // Always use fallback storage to prevent DOMException
    const linkResult = await dbManager.addLinkFallback(safeLink);

    if (linkResult.success && summaries.length > 0) {
      const safeSummaries = summaries.map((summary) => ({
        id: summary.id || crypto.randomUUID(),
        linkId: safeLink.id,
        kind: String(summary.kind || 'raw'),
        content: String(summary.content || ''),
        embedding: null,
        createdAt: summary.createdAt || new Date().toISOString(),
      }));

      // Store summaries in chrome.storage
      await Promise.all(
        safeSummaries.map((summary) => {
          return new Promise((resolve) => {
            chrome.storage.local.get(['summaries'], (result) => {
              const summaries = result.summaries || [];
              summaries.push(summary);
              chrome.storage.local.set({ summaries }, resolve);
            });
          });
        })
      );
    }

    // Forward to the page
    try {
      window.postMessage({ type: 'SRT_UPSERT_LINK', link: safeLink }, '*');
      document.dispatchEvent(
        new CustomEvent('srt-upsert-link', { detail: { link: safeLink } })
      );
    } catch (_) {}

    return { success: true, link: safeLink };
  } catch (error) {
    console.error('[SRT] UPSERT_LINK failed:', error);
    console.error('[SRT] Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    throw error;
  }
}

async function handleAddLink(linkData) {
  try {
    const result = await dbManager.addLink(linkData);
    return { ok: result.success, link: result.link };
  } catch (error) {
    console.error('[SRT] ADD_LINK failed:', error);
    throw error;
  }
}

async function handleAddSummary(summaryData) {
  try {
    const result = await dbManager.addSummary(summaryData);
    try {
      window.postMessage(
        { type: 'SRT_ADD_SUMMARY', summary: summaryData },
        '*'
      );
      document.dispatchEvent(
        new CustomEvent('srt-add-summary', { detail: { summary: summaryData } })
      );
    } catch (_) {}
    return { ok: result.success, summary: result.summary };
  } catch (error) {
    console.error('[SRT] ADD_SUMMARY failed:', error);
    throw error;
  }
}

// Enhanced page data extraction
async function extractPageData() {
  try {
    // Wait for page to be fully loaded
    if (document.readyState !== 'complete') {
      await new Promise((resolve) => {
        window.addEventListener('load', resolve, { once: true });
      });
    }

    // Auto-expand content
    await autoExpandContent();

    // Extract structured data
    const structuredData = extractStructuredData();
    const textContent = await extractTextContent();
    const metadata = extractMetadata();

    return {
      title: metadata.title,
      description: metadata.description,
      text: textContent,
      structuredData,
      metadata,
    };
  } catch (error) {
    console.error('[SRT] Page data extraction failed:', error);
    return {
      title: document.title || '',
      description: '',
      text: document.body?.innerText || '',
      structuredData: {},
      metadata: {},
    };
  }
}

async function autoExpandContent() {
  try {
    // Common "read more" patterns
    const expandSelectors = [
      'button:contains("Read more")',
      'button:contains("Show more")',
      'a:contains("Continue reading")',
      '[aria-expanded="false"]',
      '.collapsed',
      '.expandable',
    ];

    // Click expandable elements
    expandSelectors.forEach((selector) => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          if (el.offsetParent !== null) {
            // Only visible elements
            el.click();
          }
        });
      } catch (e) {
        // Ignore selector errors
      }
    });

    // Scroll to trigger lazy loading
    for (let i = 0; i < 3; i++) {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.debug('[SRT] Auto-expand failed:', error);
  }
}

function extractStructuredData() {
  try {
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    const structuredData = [];

    scripts.forEach((script) => {
      try {
        const data = JSON.parse(script.textContent);
        structuredData.push(data);
      } catch (e) {
        // Invalid JSON, skip
      }
    });

    return structuredData;
  } catch (error) {
    console.debug('[SRT] Structured data extraction failed:', error);
    return [];
  }
}

function extractMetadata() {
  const metadata = {
    title: document.title || '',
    description: '',
    keywords: '',
    author: '',
    publishedTime: '',
    modifiedTime: '',
    image: '',
    siteName: '',
  };

  // Meta tags
  const metaTags = {
    description: 'description',
    keywords: 'keywords',
    author: 'author',
    'article:published_time': 'publishedTime',
    'article:modified_time': 'modifiedTime',
    'og:title': 'title',
    'og:description': 'description',
    'og:image': 'image',
    'og:site_name': 'siteName',
    'twitter:title': 'title',
    'twitter:description': 'description',
    'twitter:image': 'image',
  };

  Object.entries(metaTags).forEach(([metaName, property]) => {
    const meta = document.querySelector(
      `meta[name="${metaName}"], meta[property="${metaName}"]`
    );
    if (meta?.content) {
      metadata[property] = meta.content;
    }
  });

  return metadata;
}

async function extractTextContent() {
  try {
    // Try Readability first
    const readabilityText = await extractWithReadability();
    if (readabilityText.length > 1000) {
      return readabilityText;
    }

    // Fallback to manual extraction
    return extractManualText();
  } catch (error) {
    console.debug('[SRT] Text extraction failed:', error);
    return document.body?.innerText || '';
  }
}

async function extractWithReadability() {
  // Disabled remote import to respect site CSP. Fallback to manual extraction.
  return '';
}

function extractManualText() {
  try {
    // Find main content areas
    const contentSelectors = [
      'main',
      'article',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.story-content',
      '.main-content',
    ];

    let content = '';

    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        content = element.innerText;
        if (content.length > 500) break;
      }
    }

    if (!content || content.length < 500) {
      content = document.body?.innerText || '';
    }

    // Clean up the text
    return cleanText(content);
  } catch (error) {
    console.debug('[SRT] Manual text extraction failed:', error);
    return document.body?.innerText || '';
  }
}

function cleanText(text) {
  if (!text) return '';

  // Remove common ad patterns
  const adPatterns = [
    /get the .*app/i,
    /subscribe.*substack/i,
    /^share .*twitter$/i,
    /advertisement/i,
    /sponsored/i,
    /sign up/i,
    /newsletter/i,
  ];

  return text
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (trimmed.split(/\s+/).length < 4) return false;
      if (adPatterns.some((pattern) => pattern.test(trimmed))) return false;
      return true;
    })
    .join('\n')
    .slice(0, 500000); // Limit size
}

// Listen for messages from the dashboard
window.addEventListener('message', (event) => {
  if (event.data?.type === 'SRT_CLEAR_ALL_LINKS') {
    console.log('[SRT] Clearing all data...');
    dbManager.clearAllData();
  }

  if (event.data?.type === 'SRT_GET_LINKS') {
    // Dashboard requesting links from extension storage
    chrome.storage.local.get(['links'], (result) => {
      const links = result.links || [];
      console.log(
        '[SRT] Dashboard requested links, sending',
        links.length,
        'links'
      );

      // Send response back to dashboard
      window.postMessage(
        {
          type: 'SRT_LINKS_RESPONSE',
          messageId: event.data.messageId,
          links: links,
        },
        '*'
      );
    });
  }

  if (event.data?.type === 'SRT_UPDATE_LINKS_STATUS') {
    // Dashboard updating link statuses
    chrome.storage.local.get(['links'], (result) => {
      const links = result.links || [];
      const updatedLinks = links.map((link) => {
        const update = event.data.links.find((u) => u.id === link.id);
        if (update) {
          return { ...link, status: update.status };
        }
        return link;
      });

      chrome.storage.local.set({ links: updatedLinks }, () => {
        console.log('[SRT] Updated link statuses in extension storage');
      });
    });
  }

  if (event.data?.type === 'SRT_UPDATE_LINK') {
    const { id, changes, messageId } = event.data || {};
    chrome.storage.local.get(['links'], (result) => {
      const links = result.links || [];
      const updatedLinks = links.map((link) => {
        if (link.id === id) {
          const updated = {
            ...link,
            ...changes,
            updatedAt: new Date().toISOString(),
          };
          if (changes?.metadata) {
            updated.metadata = { ...link.metadata, ...changes.metadata };
          }
          if (changes?.labels) {
            updated.labels = Array.isArray(changes.labels)
              ? changes.labels
              : link.labels;
          }
          return updated;
        }
        return link;
      });
      chrome.storage.local.set({ links: updatedLinks }, () => {
        // Notify dashboard and acknowledge
        try {
          window.postMessage({ type: 'SRT_DB_UPDATED' }, '*');
        } catch (_) {}
        try {
          window.postMessage({ type: 'SRT_UPDATE_LINK_OK', messageId }, '*');
        } catch (_) {}
      });
    });
  }
});

// Skip IndexedDB initialization entirely - use fallback storage only
console.log(
  '[SRT] Using fallback storage (chrome.storage.local) - no IndexedDB initialization needed'
);
dbManager.useFallbackStorage = true;

// Export for testing
if (typeof window !== 'undefined') {
  window.SRTContentScript = {
    dbManager,
    extractPageData,
    extractStructuredData,
    extractMetadata,
  };
}
