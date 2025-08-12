// Enhanced popup for Smart Research Tracker
// Improved data extraction, better UX, and enhanced error handling

console.log('🚀 Smart Research Tracker Enhanced Popup Loaded');

// State management
let selectedCat = 'link';
let isProcessing = false;
let currentTab = null;

// DOM elements
const linkFields = document.getElementById('linkFields');
const statusEl = document.getElementById('status');
const saveBtn = document.getElementById('saveBtn');
const labelSelect = document.getElementById('labelSelect');
const labelInput = document.getElementById('labelInput');

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
    
    // Extract labels from existing links if none stored
    if (!labels.length && storage.links) {
      const labelSet = new Set();
      storage.links.forEach(link => {
        if (link.label) labelSet.add(link.label);
      });
      labels = Array.from(labelSet);
    }

    // Get labels from content script (Dexie)
    if (currentTab?.id) {
      try {
        const response = await sendMessageToTab(currentTab.id, { type: 'GET_LABELS' });
        if (response?.labels) {
          const dexieLabels = response.labels;
          const allLabels = new Set([...labels, ...dexieLabels]);
          labels = Array.from(allLabels);
        }
      } catch (error) {
        console.debug('[SRT] Content script labels fetch failed:', error);
      }
    }

    // Populate label select
    populateLabelSelect(labels);
    
    // Store merged labels
    if (labels.length > 0) {
      await setStorageLocal({ labels });
    }
    
  } catch (error) {
    console.error('[SRT] Label loading failed:', error);
  }
}

// Populate label select dropdown
function populateLabelSelect(labels) {
  if (!labelSelect) return;

  labelSelect.innerHTML = '';
  
  // Always show the label select, even if no labels exist
  labelSelect.style.display = 'block';
  
  // Add default labels if none exist
  if (labels.length === 0) {
    const defaultLabels = ['research', 'article', 'tutorial', 'documentation', 'news', 'blog'];
    labels = defaultLabels;
  }
  
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
  
  // Handle new label selection
  labelSelect.addEventListener('change', handleLabelChange);
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
    
    // Combine form data with extracted data
    const payload = {
      ...formData,
      ...pageData,
      tabId: currentTab?.id
    };
    
    console.log('[SRT] Final payload:', {
      url: payload.url,
      title: payload.title,
      label: payload.label,
      priority: payload.priority,
      tabId: payload.tabId
    });

    // Send to background script
    console.log('[SRT] Sending to background script...');
    const response = await sendMessageToBackground({
      type: 'SAVE_LINK',
      payload
    });
    
    console.log('[SRT] Background response:', response);

    if (response?.success) {
      showStatus('✅ Page saved successfully!', 'success');
      
      // Auto-close if enabled
      const settings = await getStorageSync({ autoClose: true });
      if (settings.autoClose) {
        setTimeout(() => window.close(), 2000);
      }
    } else {
      console.error('[SRT] Save failed with response:', response);
      throw new Error(response?.error || 'Save failed');
    }
    
  } catch (error) {
    console.error('[SRT] Save failed:', error);
    console.error('[SRT] Error stack:', error.stack);
    showStatus(`❌ Failed to save: ${error.message}`, 'error');
  } finally {
    isProcessing = false;
    updateSaveButton('Save to Research', false);
  }
}

// Get form data
function getFormData() {
  const title = document.getElementById('title')?.value || '';
  const priority = document.getElementById('priority')?.value || 'low';
  
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
    
    const settings = await getStorageSync({
              dashboardUrl: 'http://localhost:5174/',
      fallbackUrl: 'https://smartresearchtracker.vercel.app/'
    });

    // Try to open dashboard
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
              dashboardUrl: 'http://localhost:5174/',
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
              dashboardUrl: document.getElementById('minimalDashboardUrl')?.value?.trim() || 'http://localhost:5174/',
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
    }, 3000);
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

// Chrome storage wrappers
function getStorageSync(keys) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(keys, resolve);
  });
}

function setStorageSync(items) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(items, resolve);
  });
}

function getStorageLocal(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, resolve);
  });
}

function setStorageLocal(items) {
  return new Promise((resolve) => {
    chrome.storage.local.set(items, resolve);
  });
}

// Message sending wrappers
function sendMessageToBackground(message) {
  return new Promise((resolve, reject) => {
    console.log('[SRT] Sending message to background:', message.type);
    
    try {
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
    // ignore detection error; we'll attempt injection next
  }

  // Attempt to inject our content script file
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['contentScript.js'] });
    return true;
  } catch (e) {
    console.warn('[SRT] Content script injection failed:', e?.message || e);
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