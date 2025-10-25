// Enhanced popup for Smart Research Tracker
// Improved data extraction, better UX, and enhanced error handling

console.log('🚀 Smart Research Tracker Enhanced Popup Loaded');

// State management
let selectedCat = 'link';
let isProcessing = false;
let currentTab = null;
let addLabelDebounce = null;

// DOM elements
const linkFields = document.getElementById('linkFields');
const statusEl = document.getElementById('status');
const saveBtn = document.getElementById('saveBtn');
const labelSelect = document.getElementById('labelSelect');
const labelInput = document.getElementById('labelInput');
const inlineDeleteLabel = document.getElementById('inlineDeleteLabel');

// Utility: detect storage availability
const hasChromeLocal = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
const hasChromeSync = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync;

// Initialize popup
async function initializePopup() {
  try {
    // Get current tab
    const tabs = await queryTabs({ active: true, currentWindow: true });
    currentTab = tabs[0];
    
    if (!currentTab || !currentTab.url || currentTab.url.startsWith('chrome://')) {
      showStatus('❌ Cannot save this page type', 'error');
      disableSaveButton();
      return;
    }

    // Show current URL info
    const url = new URL(currentTab.url);
    const currentUrlEl = document.getElementById('currentUrl');
    if (currentUrlEl) {
      currentUrlEl.textContent = url.hostname;
    }

    // Pre-fill title if auto-fill is enabled
    await prefillTitle();
    
    // Wire label input handlers once
    setupLabelInputHandlers();

    // Load labels
    await loadLabels();
    
    // Show welcome message on first load
    await showWelcomeMessage();
    
  } catch (error) {
    console.error('[SRT] Popup initialization failed:', error);
    showStatus('❌ Failed to initialize popup', 'error');
  }
}

// Query tabs with Promise wrapper
function queryTabs(queryInfo) {
  return new Promise((resolve) => {
    chrome.tabs.query(queryInfo, resolve);
  });
}

// Pre-fill title from tab
async function prefillTitle() {
  try {
    const settings = await getStorageSync({ autoFillTitle: true });
    const titleInput = document.getElementById('title');
    
    if (titleInput && currentTab?.title && settings.autoFillTitle) {
      titleInput.value = currentTab.title;
      titleInput.placeholder = 'Page title (auto-filled)';
    } else if (titleInput) {
      titleInput.placeholder = 'Page title';
    }
  } catch (error) {
    console.debug('[SRT] Title pre-fill failed:', error);
  }
}

// Load labels from storage and content script
async function loadLabels() {
  try {
    // Get labels from chrome.storage
    const storage = await getStorageLocal(['labels', 'links']);
    let labels = storage.labels || [];
    const hasStoredLabels = Object.prototype.hasOwnProperty.call(storage, 'labels');
    
    // Extract labels from existing links if none stored
    if (!labels.length && storage.links) {
      const labelSet = new Set();
      storage.links.forEach(link => {
        if (link.label) labelSet.add(link.label);
      });
      labels = Array.from(labelSet);
    }

    // Only set defaults on first-run (no labels key present)
    if (!hasStoredLabels && labels.length === 0) {
      labels = ['research', 'article', 'tutorial', 'documentation', 'news', 'blog'];
    }

    // Get labels from content script (Dexie) - only for compatible pages
    if (currentTab?.id && currentTab?.url && !currentTab.url.startsWith('chrome://')) {
      try {
        const response = await sendMessageToTab(currentTab.id, { type: 'GET_LABELS' });
        if (response?.labels && Array.isArray(response.labels)) {
          const dexieLabels = response.labels;
          const allLabels = new Set([...labels, ...dexieLabels]);
          labels = Array.from(allLabels);
        }
      } catch (error) {
        // Silently ignore errors for incompatible pages
      }
    }

    // Populate label select
    populateLabelSelect(labels);
    
    // Store merged labels
    await setStorageLocal({ labels });
    
  } catch (error) {
    console.error('[SRT] Label loading failed:', error);
  }
}

// Populate label select dropdown
function populateLabelSelect(labels) {
  if (!labelSelect) return;

  labelSelect.innerHTML = '';
  
  // Always show the label select; no implicit defaults here
  labelSelect.style.display = 'block';
  
  labels.forEach(label => {
    const option = document.createElement('option');
    option.value = label;
    option.textContent = label;
    labelSelect.appendChild(option);
  });
  
  // Add "New label" option
  const newOption = document.createElement('option');
  newOption.value = '__new';
  newOption.textContent = '➕ New label…';
  labelSelect.appendChild(newOption);
  
  // Set selection and delete button state
  if (labels.length > 0) {
    labelSelect.value = labels[0];
  } else {
    labelSelect.value = '__new';
  }
  if (inlineDeleteLabel) {
    inlineDeleteLabel.disabled = (labelSelect.value === '__new');
  }
  // If we're defaulting to new label, show the input immediately
  if (labelSelect.value === '__new') {
    labelSelect.style.display = 'none';
    labelInput.style.display = 'block';
    labelInput.focus();
  }

  // Handle selection
  labelSelect.onchange = () => {
    handleLabelChange();
    if (inlineDeleteLabel) {
      inlineDeleteLabel.disabled = (labelSelect.value === '__new');
    }
  };

  // Delete handler with cascade option
  if (inlineDeleteLabel) {
    inlineDeleteLabel.onclick = async () => {
      try {
        const value = labelSelect?.value;
        if (!value || value === '__new') {
          showStatus('Select an existing label first', 'error');
          return;
        }
        const storage = await getStorageLocal(['labels', 'links']);
        const links = storage.links || [];
        const usedBy = links.filter(l => l.label === value || (Array.isArray(l.labels) && l.labels.includes(value)));
        let next = (storage.labels || []).filter(l => l !== value);

        if (usedBy.length > 0) {
          const proceed = confirm(`Label "${value}" is used by ${usedBy.length} link(s). Remove it from those links and delete the label?`);
          if (!proceed) {
            showStatus('Deletion cancelled', 'info');
            return;
          }
          // Remove label from links
          const updatedLinks = links.map(l => {
            const copy = { ...l };
            if (copy.label === value) copy.label = '';
            if (Array.isArray(copy.labels)) {
              copy.labels = copy.labels.filter(v => v !== value);
            }
            return copy;
          });
          // Persist links
          await setStorageLocal({ links: updatedLinks });
        }

        // Persist labels
        await setStorageLocal({ labels: next });
        // Refresh UI
        populateLabelSelect(next);
        showStatus(`✅ Deleted label "${value}"`, 'success');
      } catch (e) {
        console.error('[SRT] Delete label failed:', e);
        showStatus('❌ Failed to delete label', 'error');
      }
    };
  }
}

// Create a new label from the input (auto on Enter/blur)
async function addNewLabelFromInput() {
  try {
    let raw = (labelInput?.value || '').trim();
    // Normalize: collapse whitespace, remove commas, prevent duplicates
    let value = raw.replace(/[\s\u00A0]+/g, ' ').replace(/,/g, '').trim();
    if (!value) {
      // If empty, just return to dropdown
      labelInput.style.display = 'none';
      labelSelect.style.display = 'block';
      return;
    }

    if (value.length > 50) value = value.slice(0, 50);

    const storage = await getStorageLocal(['labels']);
    let labels = storage.labels || [];
    const lowerSet = new Set(labels.map(l => l.toLowerCase()));
    if (!lowerSet.has(value.toLowerCase())) {
      labels.push(value);
      labels.sort((a, b) => a.localeCompare(b));
      await setStorageLocal({ labels });
    }

    populateLabelSelect(labels);
    labelSelect.value = value;
    if (inlineDeleteLabel) inlineDeleteLabel.disabled = false;

    labelInput.value = '';
    labelInput.style.display = 'none';
    labelSelect.style.display = 'block';

    showStatus(`✅ Added label "${value}"`, 'success');
  } catch (e) {
    showStatus('❌ Failed to add label', 'error');
  }
}

function setupLabelInputHandlers() {
  if (!labelInput) return;
  // Add on Enter
  labelInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addNewLabelFromInput();
    }
  };
  // Debounced auto-add while typing (no need to blur)
  labelInput.oninput = () => {
    if (addLabelDebounce) clearTimeout(addLabelDebounce);
    addLabelDebounce = setTimeout(() => {
      addNewLabelFromInput();
    }, 800);
  };
  // Add on blur as last resort
  labelInput.onblur = () => {
    if (labelInput.style.display !== 'none') {
      addNewLabelFromInput();
    }
  };
}

// Handle label selection change
function handleLabelChange() {
  if (labelSelect.value === '__new') {
    labelSelect.style.display = 'none';
    labelInput.style.display = 'block';
    labelInput.focus();
  }
}

// Show welcome message
async function showWelcomeMessage() {
  try {
    const result = await getStorageLocal(['firstLoad']);
    if (!result.firstLoad) {
      showStatus('👋 Welcome! Click "Save to Research" to save this page.', 'info');
      await setStorageLocal({ firstLoad: true });
    }
  } catch (error) {
    console.debug('[SRT] Welcome message failed:', error);
  }
}

// Category selection
const catEls = document.querySelectorAll('.cat');
catEls.forEach(el => {
  el.addEventListener('click', () => {
    catEls.forEach(e => e.classList.remove('active'));
    el.classList.add('active');
    selectedCat = el.dataset.cat;
    toggleFields();
  });
});

function toggleFields() {
  const show = selectedCat === 'link';
  if (linkFields) linkFields.style.display = show ? 'block' : 'none';
  if (saveBtn) saveBtn.disabled = !show || isProcessing;
}

// Enhanced save handler
saveBtn?.addEventListener('click', handleSave);

async function handleSave() {
  if (isProcessing) return;
  
  try {
    isProcessing = true;
    updateSaveButton('🔄 Saving...', true);
    
    console.log('[SRT] Starting save process...');
    
    const cat = selectedCat;
    if (cat !== 'link') {
      showStatus('Only Link saving supported right now.', 'error');
      return;
    }

    // Get form data
    console.log('[SRT] Getting form data...');
    const formData = getFormData();
    console.log('[SRT] Form data:', formData);
    
    // Extract page data
    console.log('[SRT] Extracting page data...');
    const pageData = await extractPageData();
    console.log('[SRT] Page data extracted:', { 
      title: pageData.title, 
      description: pageData.description,
      image: pageData.image,
      textLength: pageData.pageText?.length || 0
    });
    
    // Combine extracted data with form data (form data wins)
    const payload = {
      ...pageData,
      ...formData,
      tabId: currentTab?.id
    };
    
    console.log('[SRT] Final payload:', {
      url: payload.url,
      title: payload.title,
      label: payload.label,
      priority: payload.priority,
      tabId: payload.tabId
    });

    // Show duplicate checking status
    showDuplicateStatus('checking', 'Checking for duplicates...', 'Scanning your research library');

    // Send to background script
    console.log('[SRT] Sending to background script...');
    const response = await sendMessageToBackground({
      type: 'SAVE_LINK',
      payload
    });
    
    console.log('[SRT] Background response:', response);

    if (response?.success) {
      showDuplicateStatus('no-duplicates', '✅ No duplicates found!', 'Link saved successfully');
      showStatus('✅ Page saved successfully!', 'success');
      
      // Auto-close if enabled
      const settings = await getStorageSync({ autoClose: true });
      if (settings.autoClose) {
        setTimeout(() => window.close(), 2000);
      }
    } else if (response?.isDuplicate) {
      // Handle duplicate link - show confirmation popup
      console.log('[SRT] Duplicate detected, showing confirmation popup');
      showDuplicateStatus('duplicate-found', '⚠️ Duplicate detected!', `${response.duplicateInfo.count} existing link(s) found`);
      showDuplicateConfirmation(payload, response.duplicateInfo);
    } else {
      console.error('[SRT] Save failed with response:', response);
      throw new Error(response?.error || 'Save failed');
    }
    
  } catch (error) {
    console.error('[SRT] Save failed:', error);
    console.error('[SRT] Error stack:', error.stack);
    showStatus(`❌ Failed to save: ${error.message}`, 'error');
    hideDuplicateStatus();
  } finally {
    isProcessing = false;
    updateSaveButton('Save to Research', false);
  }
}

// Get form data
function getFormData() {
  const title = document.getElementById('title')?.value || '';
  const priority = document.getElementById('priority')?.value || 'low';
  const description = document.getElementById('desc')?.value || '';
  
  let label = '';
  if (labelSelect && labelSelect.style.display !== 'none') {
    label = labelSelect.value === '__new' ? '' : labelSelect.value;
  }
  if (labelInput && labelInput.style.display !== 'none') {
    label = labelInput.value.trim();
  }

  const formData = {
    url: currentTab?.url || '',
    title,
    description,
    label,
    priority
  };
  
  console.log('[SRT] Form data extracted:', formData);
  return formData;
}

// Enhanced page data extraction
async function extractPageData() {
  try {
    if (!currentTab?.id) {
      throw new Error('No active tab');
    }

    // Use content script extraction if available
    const results = await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      func: async () => {
        try {
          // Use enhanced extraction from content script
          if (window.SRTContentScript?.extractPageData) {
            return await window.SRTContentScript.extractPageData();
          }
          
          // Fallback to basic extraction
          return {
            title: document.title || '',
            description: document.querySelector('meta[name="description"]')?.content || '',
            text: document.body?.innerText || '',
            metadata: {
              image: document.querySelector('meta[property="og:image"]')?.content || '',
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

    const pageData = results?.[0]?.result || {};
    
    return {
      title: pageData.title || '',
      description: pageData.description || '',
      pageText: pageData.text || '',
      image: pageData.metadata?.image || '',
      author: pageData.metadata?.author || '',
      publishedTime: pageData.metadata?.publishedTime || '',
      siteName: pageData.metadata?.siteName || '',
      structuredData: pageData.structuredData || {}
    };
    
  } catch (error) {
    console.error('[SRT] Page data extraction failed:', error);
    return {
      title: '',
      description: '',
      pageText: '',
      image: '',
      author: '',
      publishedTime: '',
      siteName: '',
      structuredData: {}
    };
  }
}

// Dashboard and Settings buttons
document.getElementById('openDashboardBtn')?.addEventListener('click', async () => {
  try {
    const btn = document.getElementById('openDashboardBtn');
    updateButton(btn, '🔄 Opening...', true);
    
    // Use the intelligent URL detection from background script
    try {
      // Send message to background script to open dashboard
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'openDashboard' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
      
      showStatus('✅ Dashboard opened successfully!', 'success');
    } catch (error) {
      console.error('[SRT] Failed to open dashboard via background script:', error);
      
      // Fallback to direct URL opening
      const settings = await getStorageSync({
        dashboardUrl: 'https://smartracker.vercel.app/',
        fallbackUrl: 'http://localhost:5174/'
      });

      const urls = [settings.dashboardUrl, settings.fallbackUrl];
      
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
          
          showStatus('✅ Dashboard opened successfully!', 'success');
          return;
        } catch (error) {
          console.debug('[SRT] Failed to open dashboard at:', url);
        }
      }
      
      showStatus('❌ Could not open dashboard. Check your settings.', 'error');
    }
    
  } catch (error) {
    console.error('[SRT] Dashboard opening failed:', error);
    showStatus('❌ Failed to open dashboard', 'error');
  } finally {
    const btn = document.getElementById('openDashboardBtn');
    updateButton(btn, 'Open Dashboard', false);
  }
});

// Settings functionality
document.getElementById('minimalSettingsBtn')?.addEventListener('click', () => {
  const settingsPanel = document.getElementById('minimalSettingsPanel');
  if (settingsPanel) {
    settingsPanel.style.display = 'block';
    loadMinimalSettings();
  }
});

document.getElementById('closeMinimalSettings')?.addEventListener('click', () => {
  const settingsPanel = document.getElementById('minimalSettingsPanel');
  if (settingsPanel) {
    settingsPanel.style.display = 'none';
  }
});

// Load minimal settings
async function loadMinimalSettings() {
  try {
    const settings = await getStorageSync({
      dashboardUrl: 'https://smartracker.vercel.app/',
      autoFillTitle: true,
      autoClose: true
    });
    
    const dashboardUrlEl = document.getElementById('minimalDashboardUrl');
    const autoFillEl = document.getElementById('minimalAutoFill');
    const autoCloseEl = document.getElementById('minimalAutoClose');
    
    if (dashboardUrlEl) dashboardUrlEl.value = settings.dashboardUrl;
    if (autoFillEl) autoFillEl.checked = settings.autoFillTitle;
    if (autoCloseEl) autoCloseEl.checked = settings.autoClose;
    
  } catch (error) {
    console.error('[SRT] Settings loading failed:', error);
  }
}

// Save minimal settings
document.getElementById('saveMinimalSettings')?.addEventListener('click', async () => {
  try {
    const settings = {
      dashboardUrl: document.getElementById('minimalDashboardUrl')?.value?.trim() || 'https://smartracker.vercel.app/',
      autoFillTitle: document.getElementById('minimalAutoFill')?.checked || false,
      autoClose: document.getElementById('minimalAutoClose')?.checked || false
    };

    await setStorageSync(settings);
    showStatus('✅ Settings saved!', 'success');
    
    setTimeout(() => {
      const settingsPanel = document.getElementById('minimalSettingsPanel');
      if (settingsPanel) {
        settingsPanel.style.display = 'none';
      }
    }, 1500);
    
  } catch (error) {
    console.error('[SRT] Settings save failed:', error);
    showStatus('❌ Failed to save settings', 'error');
  }
});

// Open full settings
document.getElementById('openFullSettingsFromMinimal')?.addEventListener('click', () => {
  chrome.runtime.openOptionsPage(() => {
    if (chrome.runtime.lastError) {
      chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id });
    }
  });
});

// Utility functions
function showStatus(message, type = 'info') {
  if (!statusEl) return;
  
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.style.display = 'block';
  
  // Auto-hide success messages
  if (type === 'success') {
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 2000);
  }
}

function updateSaveButton(text, disabled) {
  if (!saveBtn) return;
  saveBtn.textContent = text;
  saveBtn.disabled = disabled;
}

function updateButton(button, text, disabled) {
  if (!button) return;
  button.textContent = text;
  button.disabled = disabled;
}

function disableSaveButton() {
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Cannot Save';
  }
}

// Chrome storage wrappers with safe fallbacks
function getStorageSync(keys) {
  if (hasChromeSync) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(keys, resolve);
    });
  }
  // Fallback to localStorage namespace
  const result = {};
  keys && Object.keys(keys).forEach?.(() => {}); // noop to satisfy shapes
  return Promise.resolve({
    dashboardUrl: localStorage.getItem('srt_dashboardUrl') || 'https://smartracker.vercel.app/',
    autoFillTitle: localStorage.getItem('srt_autoFillTitle') === 'true',
    autoClose: localStorage.getItem('srt_autoClose') !== 'false',
  });
}

function setStorageSync(items) {
  if (hasChromeSync) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(items, resolve);
    });
  }
  // Fallback
  if (items.dashboardUrl) localStorage.setItem('srt_dashboardUrl', items.dashboardUrl);
  if (typeof items.autoFillTitle !== 'undefined') localStorage.setItem('srt_autoFillTitle', String(items.autoFillTitle));
  if (typeof items.autoClose !== 'undefined') localStorage.setItem('srt_autoClose', String(items.autoClose));
  return Promise.resolve();
}

function getStorageLocal(keys) {
  if (hasChromeLocal) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, resolve);
    });
  }
  // Fallback to localStorage
  const out = {};
  if (Array.isArray(keys)) {
    keys.forEach((k) => {
      if (k === 'labels') {
        out.labels = JSON.parse(localStorage.getItem('srt_labels') || '[]');
      } else if (k === 'links') {
        out.links = JSON.parse(localStorage.getItem('srt_links') || '[]');
      } else if (k === 'firstLoad') {
        out.firstLoad = localStorage.getItem('srt_firstLoad') === 'true';
      }
    });
  }
  return Promise.resolve(out);
}

function setStorageLocal(items) {
  if (hasChromeLocal) {
    return new Promise((resolve) => {
      chrome.storage.local.set(items, resolve);
    });
  }
  // Fallback
  if (items.labels) localStorage.setItem('srt_labels', JSON.stringify(items.labels));
  if (items.links) localStorage.setItem('srt_links', JSON.stringify(items.links));
  if (typeof items.firstLoad !== 'undefined') localStorage.setItem('srt_firstLoad', String(items.firstLoad));
  return Promise.resolve();
}

// Message sending wrappers
function sendMessageToBackground(message) {
  return new Promise((resolve, reject) => {
    console.log('[SRT] Sending message to background:', message.type);
    
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
        // No background available in fallback context
        return resolve({ success: false, error: 'background_unavailable' });
      }
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[SRT] Background message error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message || 'Background script error'));
        } else {
          console.log('[SRT] Background message response:', response);
          resolve(response);
        }
      });
    } catch (error) {
      console.error('[SRT] Message sending failed:', error);
      reject(error);
    }
  });
}

async function ensureContentScriptLoaded(tabId) {
  // First check if the tab is injectable
  try {
    const tab = await chrome.tabs.get(tabId);
    
    // Skip restricted pages - these can't have content scripts
    if (!tab.url || 
        tab.url.startsWith('chrome://') || 
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:') ||
        tab.url === 'about:blank') {
      return false;
    }
  } catch (e) {
    return false;
  }

  // Try to detect presence of our exposed object first
  try {
    const presence = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        try {
          return Boolean(window.SRTContentScript || window.smartResearchTracker || window.__SMART_RESEARCH_TRACKER__);
        } catch (_) {
          return false;
        }
      }
    });
    const isPresent = Array.isArray(presence) ? !!presence[0]?.result : !!presence;
    if (isPresent) return true;
  } catch (e) {
    // Silently fail for restricted pages
    const msg = e?.message || '';
    if (msg.includes('error page') || msg.includes('Cannot access')) {
      return false;
    }
  }

  // Attempt to inject our content script file
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['contentScript.js'] });
    return true;
  } catch (e) {
    // Silently handle injection failures for restricted pages
    return false;
  }
}

function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    console.log('[SRT] Sending message to tab:', tabId, message.type);

    chrome.tabs.get(tabId, async (tab) => {
      if (chrome.runtime.lastError) {
        console.warn('[SRT] Tab not accessible:', chrome.runtime.lastError.message);
        reject(new Error('Tab not accessible'));
        return;
      }

      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        console.warn('[SRT] Cannot send message to this tab type:', tab.url);
        reject(new Error('Cannot send message to this tab type'));
        return;
      }

      // Ensure the content script is present before first attempt
      const trySend = async (attempt = 1) => {
        if (attempt === 1) {
          await ensureContentScriptLoaded(tabId);
        }
        try {
          chrome.tabs.sendMessage(tabId, message, async (response) => {
            if (chrome.runtime.lastError) {
              const msg = chrome.runtime.lastError.message || '';
              console.warn(`[SRT] Tab message error (attempt ${attempt}):`, msg);

              // If content script is missing, try to inject once and retry
              const missingReceiver = /Receiving end does not exist|Could not establish connection/i.test(msg);
              if (attempt === 1 && missingReceiver) {
                const injected = await ensureContentScriptLoaded(tabId);
                if (injected) {
                  // Small delay to allow script to initialize
                  setTimeout(() => trySend(2), 150);
                  return;
                }
              }

              // Resolve gracefully with structured error
              resolve({ success: false, error: 'content_script_unavailable' });
            } else {
              console.log('[SRT] Tab message response:', response);
              resolve(response);
            }
          });
        } catch (error) {
          console.error('[SRT] Tab message sending failed:', error);
          resolve({ success: false, error: 'content_script_unavailable' });
        }
      };

      trySend(1);
    });
  });
}

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePopup);
} else {
  initializePopup();
}

// Toggle fields on initial load
toggleFields();

// Duplicate confirmation functionality
let currentDuplicatePayload = null;
let currentDuplicateInfo = null;

// Duplicate status display functions
function showDuplicateStatus(type, title, details) {
  const statusEl = document.getElementById('duplicateStatus');
  if (!statusEl) return;
  
  // Remove existing classes and add new one
  statusEl.className = `duplicate-status ${type}`;
  
  // Update content
  const titleEl = statusEl.querySelector('.duplicate-status-title');
  const detailsEl = statusEl.querySelector('.duplicate-status-details');
  
  if (titleEl) titleEl.textContent = title;
  if (detailsEl) detailsEl.textContent = details;
  
  // Show the status
  statusEl.style.display = 'flex';
}

function hideDuplicateStatus() {
  const statusEl = document.getElementById('duplicateStatus');
  if (statusEl) {
    statusEl.style.display = 'none';
  }
}

function showDuplicateConfirmation(payload, duplicateInfo) {
  currentDuplicatePayload = payload;
  currentDuplicateInfo = duplicateInfo;
  
  // Update popup content
  document.getElementById('duplicateCount').textContent = duplicateInfo.count;
  
  // Populate duplicate list
  const duplicateList = document.getElementById('duplicateList');
  duplicateList.innerHTML = '';
  
  duplicateInfo.duplicates.forEach(duplicate => {
    const duplicateItem = document.createElement('div');
    duplicateItem.className = 'duplicate-item';
    
    const title = document.createElement('div');
    title.className = 'duplicate-item-title';
    title.textContent = duplicate.title || 'Untitled';
    
    const details = document.createElement('div');
    details.className = 'duplicate-item-details';
    details.innerHTML = `
      <div>URL: ${duplicate.url}</div>
      <div>Labels: ${Array.isArray(duplicate.labels) ? duplicate.labels.join(', ') : duplicate.labels || 'research'}</div>
      <div>Priority: ${duplicate.priority || 'medium'}</div>
      <div>Status: ${duplicate.status || 'active'}</div>
      <div>Created: ${new Date(duplicate.createdAt).toLocaleDateString()}</div>
    `;
    
    duplicateItem.appendChild(title);
    duplicateItem.appendChild(details);
    duplicateList.appendChild(duplicateItem);
  });
  
  // Show popup
  document.getElementById('duplicatePopup').style.display = 'flex';
  
  // Reset save button
  isProcessing = false;
  updateSaveButton('Save to Research', false);
}

function hideDuplicateConfirmation() {
  document.getElementById('duplicatePopup').style.display = 'none';
  currentDuplicatePayload = null;
  currentDuplicateInfo = null;
  
  // Hide the duplicate status as well
  hideDuplicateStatus();
}

async function handleSaveAnyway() {
  if (!currentDuplicatePayload || !currentDuplicateInfo) return;
  
  try {
    isProcessing = true;
    updateSaveButton('🔄 Saving...', true);
    
    console.log('[SRT] User confirmed saving duplicate link');
    
    // Send confirmation to background script
    const response = await sendMessageToBackground({
      type: 'SAVE_LINK_CONFIRMED',
      payload: currentDuplicatePayload,
      duplicateInfo: currentDuplicateInfo
    });
    
    if (response?.success) {
      showDuplicateStatus('no-duplicates', '✅ Link saved successfully!', 'User confirmed saving despite duplicates');
      showStatus('✅ Page saved successfully!', 'success');
      hideDuplicateConfirmation();
      
      // Auto-close if enabled
      const settings = await getStorageSync({ autoClose: true });
      if (settings.autoClose) {
        setTimeout(() => window.close(), 2000);
      }
    } else {
      throw new Error(response?.error || 'Save failed');
    }
    
  } catch (error) {
    console.error('[SRT] Save anyway failed:', error);
    showStatus(`❌ Failed to save: ${error.message}`, 'error');
  } finally {
    isProcessing = false;
    updateSaveButton('Save to Research', false);
  }
}

function handleCancelSave() {
  hideDuplicateConfirmation();
  showDuplicateStatus('duplicate-found', '❌ Save cancelled', 'User chose not to save duplicate link');
  showStatus('❌ Save cancelled', 'info');
  
  // Hide the status after a few seconds
  setTimeout(() => {
    hideDuplicateStatus();
  }, 3000);
}

// Wire up duplicate popup event handlers
document.addEventListener('DOMContentLoaded', () => {
  // Close button
  document.getElementById('closeDuplicatePopup')?.addEventListener('click', hideDuplicateConfirmation);
  
  // Save anyway button
  document.getElementById('saveAnywayBtn')?.addEventListener('click', handleSaveAnyway);
  
  // Cancel button
  document.getElementById('cancelSaveBtn')?.addEventListener('click', handleCancelSave);
  
  // Close on background click
  document.getElementById('duplicatePopup')?.addEventListener('click', (e) => {
    if (e.target.id === 'duplicatePopup') {
      hideDuplicateConfirmation();
    }
  });
}); 