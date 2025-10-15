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

// Announce readiness to background so it messages only ready tabs
try { chrome.runtime?.sendMessage?.({ type: 'CS_READY' }); } catch (_) {}
window.addEventListener('load', () => {
  try { chrome.runtime?.sendMessage?.({ type: 'CS_READY' }); } catch (_) {}
});

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

// Simple in-memory cache for links (guard against double-injection)
try {
  if (!window.__SRT_cachedLinks) {
    window.__SRT_cachedLinks = [];
  }
} catch (_) {}
var __SRT_cachedLinks = (typeof window !== 'undefined' && window.__SRT_cachedLinks) || [];
try { if (typeof window !== 'undefined') window.__SRT_cachedLinks = __SRT_cachedLinks; } catch (_) {}

// Safe helpers to read/write links without requiring live chrome.* context
function __SRT_getLinksSafe() {
  try {
    if (__SRT_cachedLinks && __SRT_cachedLinks.length) return __SRT_cachedLinks;
    return [];
  } catch (_) {
    return [];
  }
}

function __SRT_setLinksSafe(links) {
  try { 
    __SRT_cachedLinks = Array.isArray(links) ? links : []; 
  } catch (_) { 
    __SRT_cachedLinks = []; 
  }
  
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local?.set) {
      chrome.storage.local.set({ links: __SRT_cachedLinks }, () => {});
    }
  } catch (_) {}
}

// Load cached links from chrome storage
try {
  if (typeof chrome !== 'undefined' && chrome.storage?.local?.get) {
    chrome.storage.local.get(['links'], (res) => {
      __SRT_cachedLinks = res?.links || [];
    });
    chrome.storage?.onChanged?.addListener?.((changes, area) => {
      if (area === 'local' && changes.links) {
        __SRT_cachedLinks = changes.links.newValue || [];
      }
    });
  }
} catch (_) {}

// Fallback storage helpers (chrome.storage.local only)
async function __SRT_addLinkFallback(link) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(['links'], (result) => {
        const links = result?.links || [];
        const normalize = (u) => String(u || '').replace(/\/+$/, '').toLowerCase();
        const exists = links.some((l) => normalize(l.url) === normalize(link.url));
        if (exists) {
          // Upsert existing
          const idx = links.findIndex((l) => normalize(l.url) === normalize(link.url));
          links[idx] = { ...links[idx], ...link, updatedAt: new Date().toISOString() };
        } else {
          links.push(link);
        }
        chrome.storage.local.set({ links }, () => {
          __SRT_cachedLinks = links;
          try { window.postMessage({ type: 'SRT_DB_UPDATED' }, '*'); } catch (_) {}
          resolve({ success: true, link });
        });
      });
    } catch (error) {
      console.debug('[SRT] addLinkFallback failed:', error);
      resolve({ success: false, error: String(error) });
    }
  });
}

async function __SRT_addSummaryFallback(summary) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(['summaries'], (result) => {
        const summaries = result?.summaries || [];
        summaries.push(summary);
        chrome.storage.local.set({ summaries }, () => resolve({ success: true, summary }));
      });
    } catch (error) {
      console.debug('[SRT] addSummaryFallback failed:', error);
      resolve({ success: false, error: String(error) });
    }
  });
}

async function __SRT_clearAllDataFallback() {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.remove(['links', 'pendingUpserts', 'labels', 'summaries'], () => {
        __SRT_cachedLinks = [];
        try { window.postMessage({ type: 'SRT_DB_UPDATED' }, '*'); } catch (_) {}
        resolve({ success: true });
      });
    } catch (error) {
      console.debug('[SRT] clearAllDataFallback failed:', error);
      resolve({ success: false, error: String(error) });
    }
  });
}

// Content script is now simplified - no IndexedDB operations

// Enhanced message handling with better error recovery
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('[SRT] Received message:', msg.type);

  // Always use fallback storage to avoid any DOMException issues
  // (dbManager removed; we exclusively use fallback helpers here)

  // Handle messages immediately with fallback storage
  handleMessage(msg, sender, sendResponse);
  return true;
});

function handleMessage(msg, sender, sendResponse) {
  switch (msg.type) {
    case 'GET_LABELS':
      try {
        const links = __SRT_getLinksSafe();
        const labelSet = new Set();
        (links || []).forEach((l) => Array.isArray(l.labels) && l.labels.forEach((x) => labelSet.add(String(x))));
        sendResponse?.({ labels: Array.from(labelSet) });
      } catch (_) {
        sendResponse?.({ labels: [] });
      }
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

    case 'SRT_GET_DISPLAYED_LINKS':
      try {
        // Background script is checking which links are actually displayed on this dashboard
        const currentLinks = __SRT_getLinksSafe();
        console.log('[SRT] Background checking displayed links, current count:', currentLinks.length);
        
        // Send back the links this dashboard is currently showing
        sendResponse?.({ links: currentLinks });
      } catch (error) {
        console.debug('[SRT] Error getting displayed links:', error);
        // Send empty response if we can't get the links
        sendResponse?.({ links: [] });
      }
      break;

    case 'CLEAR_ALL_DATA':
      __SRT_clearAllDataFallback()
        .then((res) => sendResponse?.(res))
        .catch((error) => sendResponse?.({ success: false, error: String(error) }));
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

    console.log('[SRT] 📝 Saving link to IndexedDB:', safeLink.url);
    console.log('[SRT] Link title:', safeLink.metadata.title);

    // Initialize IndexedDB connection
    const db = await __SRT_initDB();
    
    // Check for duplicates by URL
    const existingLink = await new Promise((resolve, reject) => {
      const transaction = db.transaction(['links'], 'readonly');
      const store = transaction.objectStore('links');
      const index = store.index('url');
      const request = index.get(safeLink.url);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (existingLink) {
      console.log('[SRT] ⚠️  Link already exists, updating:', safeLink.url);
      // Update existing link - preserve ID and createdAt
      safeLink.id = existingLink.id;
      safeLink.createdAt = existingLink.createdAt;
    } else {
      console.log('[SRT] ✨ New link, saving:', safeLink.url);
    }

    // Save to IndexedDB (single source of truth)
    const linkResult = await new Promise((resolve, reject) => {
      const transaction = db.transaction(['links'], 'readwrite');
      const store = transaction.objectStore('links');
      const request = store.put(safeLink);
      
      request.onsuccess = () => {
        console.log('[SRT] ✅ Link saved successfully to IndexedDB');
        resolve({ success: true, link: safeLink, isUpdate: !!existingLink });
      };
      
      request.onerror = () => {
        console.error('[SRT] ❌ Failed to save link to IndexedDB:', request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
        console.log('[SRT] 💾 Transaction completed successfully');
      };
      
      transaction.onerror = () => {
        console.error('[SRT] ❌ Transaction failed:', transaction.error);
      };
    });

    // Save summaries to IndexedDB if provided
    if (linkResult.success && summaries.length > 0) {
      console.log('[SRT] 📄 Saving', summaries.length, 'summaries to IndexedDB');
      
      const safeSummaries = summaries.map((summary) => ({
        id: summary.id || crypto.randomUUID(),
        linkId: safeLink.id,
        kind: String(summary.kind || 'raw'),
        content: String(summary.content || ''),
        embedding: null,
        createdAt: summary.createdAt || new Date().toISOString(),
      }));

      // Store summaries in IndexedDB (same database)
      try {
        await Promise.all(
          safeSummaries.map(async (summary) => {
            return new Promise((resolve, reject) => {
              const transaction = db.transaction(['summaries'], 'readwrite');
              const store = transaction.objectStore('summaries');
              const request = store.put(summary);
              
              request.onsuccess = () => resolve();
              request.onerror = () => reject(request.error);
            });
          })
        );
        console.log('[SRT] ✅ All summaries saved to IndexedDB');
      } catch (error) {
        console.error('[SRT] ⚠️  Failed to save some summaries:', error);
      }
    }

    // Notify dashboard to refresh (if it's open)
    try {
      window.postMessage({ 
        type: 'SRT_DB_UPDATED',
        action: linkResult.isUpdate ? 'update' : 'create',
        linkId: safeLink.id
      }, '*');
      
      document.dispatchEvent(
        new CustomEvent('srt-db-updated', { 
          detail: { 
            link: safeLink,
            action: linkResult.isUpdate ? 'update' : 'create'
          } 
        })
      );
      
      console.log('[SRT] 📢 Dashboard notified of', linkResult.isUpdate ? 'update' : 'new link');
    } catch (error) {
      console.error('[SRT] ⚠️  Failed to notify dashboard:', error);
    }

    return { 
      success: true, 
      link: safeLink,
      isUpdate: linkResult.isUpdate,
      message: linkResult.isUpdate ? 'Link updated successfully' : 'Link saved successfully'
    };
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
    const result = await __SRT_addLinkFallback(linkData);
    return { ok: Boolean(result?.success), link: result?.link };
  } catch (error) {
    console.error('[SRT] ADD_LINK failed:', error);
    throw error;
  }
}

async function handleAddSummary(summaryData) {
  try {
    const result = await __SRT_addSummaryFallback(summaryData);
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

// Listen for messages from the dashboard (also respond to PING reliably)
window.addEventListener('message', (event) => {
  if (event.data?.type === 'SRT_PING') {
    try {
      const manifest = (chrome?.runtime?.getManifest && chrome.runtime.getManifest()) || {};
      window.postMessage({
        type: 'SRT_PONG',
        extensionId: chrome?.runtime?.id || '',
        source: 'smart-research-tracker-extension',
        status: 'ok',
        version: manifest.version || '',
        timestamp: Date.now(),
      }, '*');
    } catch (_) {}
  }
  if (event.data?.type === 'SRT_CLEAR_ALL_LINKS') {
    console.log('[SRT] Clearing all data...');
    __SRT_clearAllDataFallback();
  }

  if (event.data?.type === 'SRT_GET_LINKS') {
    const messageId = event.data.messageId;
    const respond = (links) => {
      try { window.postMessage({ type: 'SRT_LINKS_RESPONSE', messageId, links }, '*'); } catch (_) {}
    };
    const getFromBackground = () => new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: 'GET_LINKS' }, (resp) => {
          if (Array.isArray(resp?.links)) return resolve(resp.links);
          resolve(null);
        });
      } catch (_) { resolve(null); }
    });
    const getFromChromeStorage = () => new Promise((resolve) => {
      try {
        chrome.storage?.local?.get?.(['links'], (res) => resolve(res?.links || null));
      } catch (_) { resolve(null); }
    });
    (async () => {
      let links = await getFromBackground();
      if (!links || links.length === 0) {
        links = await getFromChromeStorage();
      }
      if (!links || links.length === 0) {
        try { links = __SRT_getLinksSafe(); } catch (_) { links = []; }
      }
      console.log('[SRT] Dashboard requested links, sending', (links || []).length, 'links');
      respond(links || []);
    })();
  }

  if (event.data?.type === 'SRT_GET_DISPLAYED_LINKS') {
    // Background script is checking which links are actually displayed on this dashboard
    try {
      // Get the current links that this dashboard is displaying
      const currentLinks = __SRT_getLinksSafe();
      console.log('[SRT] Background checking displayed links, current count:', currentLinks.length);
      
      // Send back the links this dashboard is currently showing
      try {
        window.postMessage({ 
          type: 'SRT_DISPLAYED_LINKS_RESPONSE', 
          links: currentLinks 
        }, '*');
      } catch (_) {}
    } catch (error) {
      console.debug('[SRT] Error getting displayed links:', error);
      // Send empty response if we can't get the links
      try {
        window.postMessage({ 
          type: 'SRT_DISPLAYED_LINKS_RESPONSE', 
          links: [] 
        }, '*');
      } catch (_) {}
    }
  }

  if (event.data?.type === 'SRT_UPDATE_LINKS_STATUS') {
    // Dashboard updating link statuses (safe/local only)
    try {
      const current = __SRT_getLinksSafe();
      const updatedLinks = current.map((link) => {
        const update = event.data.links.find((u) => u.id === link.id);
        return update ? { ...link, status: update.status } : link;
      });
      __SRT_setLinksSafe(updatedLinks);
      console.log('[SRT] Updated link statuses (cached/local)');
    } catch (_) {}
  }

  if (event.data?.type === 'SRT_UPDATE_LINK') {
    const { id, changes, messageId } = event.data || {};
    try {
      const links = __SRT_getLinksSafe();
      const updatedLinks = links.map((link) => {
        if (link.id === id) {
          const updated = { ...link, ...changes, updatedAt: new Date().toISOString() };
          if (changes?.metadata) updated.metadata = { ...link.metadata, ...changes.metadata };
          if (changes?.labels) updated.labels = Array.isArray(changes.labels) ? changes.labels : link.labels;
          return updated;
        }
        return link;
      });
      __SRT_setLinksSafe(updatedLinks);
      try { window.postMessage({ type: 'SRT_DB_UPDATED' }, '*'); } catch (_) {}
      try { window.postMessage({ type: 'SRT_UPDATE_LINK_OK', messageId }, '*'); } catch (_) {}
    } catch (_) {}
  }

  if (event.data?.type === 'SRT_REMOVE_LINK') {
    const { id, messageId } = event.data || {};
    try {
      const links = __SRT_getLinksSafe();
      const updatedLinks = links.filter((link) => link.id !== id);
      __SRT_setLinksSafe(updatedLinks);
      try { window.postMessage({ type: 'SRT_DB_UPDATED' }, '*'); } catch (_) {}
      try { window.postMessage({ type: 'SRT_REMOVE_LINK_OK', messageId }, '*'); } catch (_) {}
    } catch (_) {}
  }

  if (event.data?.type === 'SRT_ADD_LINK') {
    const { link, messageId } = event.data || {};
    try {
      const links = __SRT_getLinksSafe();
      const normalize = (u) => (u || '').toString().replace(/\/+$/, '').toLowerCase();
      const idx = links.findIndex((l) => normalize(l.url) === normalize(link?.url) || l.id === link?.id);
      if (idx === -1 && link) {
        links.push(link);
      } else if (idx !== -1 && link) {
        // Upsert: merge fields so repeated saves update existing record
        links[idx] = { ...links[idx], ...link, updatedAt: new Date().toISOString() };
      }
      __SRT_setLinksSafe(links);
      try { window.postMessage({ type: 'SRT_DB_UPDATED' }, '*'); } catch (_) {}
      try { window.postMessage({ type: 'SRT_ADD_LINK_OK', messageId }, '*'); } catch (_) {}
    } catch (_) {}
  }
});

// Initialize IndexedDB for direct database access (single source of truth)
console.log('[SRT] 🗄️  Initializing IndexedDB connection for direct database access');

// Database connection state
let __SRT_db = null;
let __SRT_dbInitPromise = null;
const DB_NAME = 'smartResearchDB';
const DB_VERSION = 1;

async function __SRT_initDB(retryCount = 0) {
  // Return existing connection if available
  if (__SRT_db) return __SRT_db;
  
  // Return existing init promise if initialization is in progress
  if (__SRT_dbInitPromise) return __SRT_dbInitPromise;
  
  __SRT_dbInitPromise = (async () => {
    try {
      // Try to access existing Dexie instance from dashboard (if on dashboard page)
      if (typeof window !== 'undefined' && window.smartResearchDB) {
        console.log('[SRT] ✅ Using existing smartResearchDB from dashboard');
        __SRT_db = window.smartResearchDB;
        return __SRT_db;
      }
      
      // Create our own IndexedDB connection using the same database name
      console.log('[SRT] 🔌 Opening IndexedDB:', DB_NAME);
      
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
          const error = request.error;
          console.error('[SRT] ❌ IndexedDB open failed:', error);
          
          // Retry logic for transient errors
          if (retryCount < 3 && error.name === 'UnknownError') {
            console.log(`[SRT] 🔄 Retrying IndexedDB connection (attempt ${retryCount + 1}/3)`);
            setTimeout(() => {
              __SRT_dbInitPromise = null;
              resolve(__SRT_initDB(retryCount + 1));
            }, 1000 * (retryCount + 1));
          } else {
            reject(error);
          }
        };
        
        request.onsuccess = () => {
          __SRT_db = request.result;
          console.log('[SRT] ✅ IndexedDB connection established successfully');
          
          // Handle connection being closed
          __SRT_db.onclose = () => {
            console.log('[SRT] ⚠️  IndexedDB connection closed');
            __SRT_db = null;
            __SRT_dbInitPromise = null;
          };
          
          // Handle version change (e.g., if dashboard upgrades the schema)
          __SRT_db.onversionchange = () => {
            console.log('[SRT] ⚠️  IndexedDB version changed, closing connection');
            __SRT_db.close();
            __SRT_db = null;
            __SRT_dbInitPromise = null;
          };
          
          resolve(__SRT_db);
        };
        
        request.onupgradeneeded = (event) => {
          console.log('[SRT] 🔧 Upgrading IndexedDB schema...');
          const db = event.target.result;
          
          // Create links table if it doesn't exist
          if (!db.objectStoreNames.contains('links')) {
            console.log('[SRT] Creating links object store');
            const linksStore = db.createObjectStore('links', { keyPath: 'id' });
            linksStore.createIndex('url', 'url', { unique: false });
            linksStore.createIndex('createdAt', 'createdAt', { unique: false });
          }
          
          // Create summaries table if it doesn't exist
          if (!db.objectStoreNames.contains('summaries')) {
            console.log('[SRT] Creating summaries object store');
            const summariesStore = db.createObjectStore('summaries', { keyPath: 'id' });
            summariesStore.createIndex('linkId', 'linkId', { unique: false });
          }
          
          // Create chatMessages table if it doesn't exist
          if (!db.objectStoreNames.contains('chatMessages')) {
            console.log('[SRT] Creating chatMessages object store');
            const chatStore = db.createObjectStore('chatMessages', { keyPath: 'id' });
            chatStore.createIndex('linkId', 'linkId', { unique: false });
          }
          
          console.log('[SRT] ✅ Schema upgrade completed');
        };
        
        request.onblocked = () => {
          console.warn('[SRT] ⚠️  IndexedDB open blocked - close other tabs/windows using this database');
        };
      });
    } catch (error) {
      console.error('[SRT] ❌ Failed to initialize IndexedDB:', error);
      __SRT_dbInitPromise = null;
      throw error;
    }
  })();
  
  return __SRT_dbInitPromise;
}

// Initialize DB immediately (but don't block)
__SRT_initDB()
  .then(() => console.log('[SRT] 🚀 IndexedDB ready for use'))
  .catch(err => console.error('[SRT] ❌ DB init failed:', err));

// Export for testing
if (typeof window !== 'undefined') {
  window.SRTContentScript = {
    addLinkFallback: __SRT_addLinkFallback,
    addSummaryFallback: __SRT_addSummaryFallback,
    clearAllDataFallback: __SRT_clearAllDataFallback,
    extractPageData,
    extractStructuredData,
    extractMetadata,
  };
}
