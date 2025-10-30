/**
 * SmarTrack Chrome Extension Popup
 * Enhanced with selected text capture and metadata extraction
 */

class SmarTrackPopup {
  constructor() {
    this.tags = [];
    this.isProcessing = false;
    this.currentTab = null;
    this.pageData = {};
    this.selectedText = '';
    this.categories = [];
    
    this.init();
  }

  async init() {
    try {
      // Load categories from settings first
      await this.loadCategories();

      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
      
      // Check if user is logged in
      const token = await this.getAuthToken();
      
      // Always setup event listeners first
      this.setupEventListeners();
      
      // Render category options
      this.renderCategories();
      
      if (!token) {
        // Show login view
        this.showLoginView();
      } else {
        // Extract page metadata
        await this.extractPageMetadata();
        
        // Check for selected text
        await this.captureSelectedText();
        
        // Populate UI
        this.populateUI();
        
        // Show main view
        this.showMainView();
      }

      // Focus title for quick editing
      setTimeout(() => {
        const titleInput = document.getElementById('title');
        if (titleInput) titleInput.focus();
      }, 0);
      
    } catch (error) {
      // Silently handle error
      this.showStatus('Failed to load page', 'error');
    }
  }

  async loadCategories() {
    try {
      const result = await chrome.storage.sync.get(['settings', 'lastCategory']);
      const defaults = ['research', 'articles', 'tools', 'references', 'other'];
      const stored = result?.settings?.categories;
      this.categories = Array.isArray(stored) && stored.length ? stored : defaults;
      this.lastCategory = result?.lastCategory || null;
    } catch (_) {
      this.categories = ['research', 'articles', 'tools', 'references', 'other'];
      this.lastCategory = null;
    }
  }

  async saveCategories(categories) {
    try {
      const res = await chrome.storage.sync.get(['settings']);
      const settings = res.settings || {};
      settings.categories = categories;
      await chrome.storage.sync.set({ settings });
      this.categories = categories;
    } catch (_) {
      // ignore
    }
  }

  renderCategories(selectedValue = null) {
    const select = document.getElementById('category');
    if (!select) return;

    select.innerHTML = '';

    // Add stored categories
    this.categories.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = this.capitalize(c);
      select.appendChild(opt);
    });

    // Custom… option
    const customOpt = document.createElement('option');
    customOpt.value = '__custom__';
    customOpt.textContent = 'Custom…';
    select.appendChild(customOpt);

    // Determine selection priority: explicit > lastCategory > default
    const fallback = this.categories[0] || 'research';
    const toSelect = selectedValue || this.lastCategory || fallback;
    select.value = this.categories.includes(toSelect) ? toSelect : fallback;
  }

  showCustomCategoryRow(show) {
    const row = document.getElementById('customCategoryRow');
    const input = document.getElementById('customCategoryInput');
    if (!row || !input) return;
    if (show) {
      row.classList.remove('hidden');
      setTimeout(() => input.focus(), 0);
    } else {
      row.classList.add('hidden');
      input.value = '';
    }
  }

  capitalize(str) {
    try {
      if (!str) return str;
      return str.charAt(0).toUpperCase() + str.slice(1);
    } catch (_) {
      return str;
    }
  }

  showLoginView() {
    document.getElementById('loginView').classList.remove('hidden');
    document.getElementById('mainView').classList.add('hidden');
  }

  showMainView() {
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('mainView').classList.remove('hidden');
  }

  async extractPageMetadata() {
    try {
      // Extract metadata silently
      
      // Execute content script to extract metadata
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        func: () => {
          const getMetaContent = (name) => {
            const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
            return meta ? meta.getAttribute('content') : null;
          };

          // Get favicon URL
          const getFaviconUrl = () => {
            const favicon = document.querySelector('link[rel="icon"]') || 
                          document.querySelector('link[rel="shortcut icon"]') ||
                          document.querySelector('link[rel="apple-touch-icon"]');
            if (favicon) {
              const href = favicon.getAttribute('href');
              try {
                return new URL(href, window.location.origin).href;
              } catch (e) {
                return href;
              }
            }
            // Try to get default favicon
            try {
              return new URL('/favicon.ico', window.location.origin).href;
            } catch (e) {
              return '';
            }
          };

          const selectedText = window.getSelection().toString().trim();
          const title = document.title;
          const url = window.location.href;
          const desc = getMetaContent('description') || 
                       getMetaContent('og:description') || 
                       getMetaContent('twitter:description') ||
                       (document.querySelector('p') ? document.querySelector('p').textContent.substring(0, 200) : '');
          const image = getMetaContent('og:image') || getMetaContent('twitter:image');
          const favicon = getFaviconUrl();

          // Metadata extracted

          return {
            title: title,
            url: url,
            description: desc,
            image: image,
            favicon: favicon,
            selectedText: selectedText
          };
        }
      });
      
      this.pageData = result.result || {};
      
      // Fallback to tab data if extraction failed
      if (!this.pageData.title) {
        this.pageData = {
          title: this.currentTab.title || 'Untitled',
          url: this.currentTab.url || '',
          description: '',
          favicon: null,
          selectedText: ''
        };
      }
      
      // Page data extracted successfully
      
    } catch (error) {
      // Failed to extract metadata, using fallback
      // Use tab data as fallback
      this.pageData = {
        title: this.currentTab.title || 'Untitled',
        url: this.currentTab.url || '',
        description: '',
        favicon: null,
        selectedText: ''
      };
    }
  }

  async captureSelectedText() {
    try {
      // Check if there's selected text
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        func: () => window.getSelection().toString().trim()
      });
      
      this.selectedText = result.result || '';
      
      if (this.selectedText) {
        this.showSelectedTextInfo(this.selectedText);
      }
    } catch (error) {
      // Failed to capture selected text
      this.selectedText = '';
    }
  }

  populateUI() {
    // Set page preview
    const titleEl = document.getElementById('pageTitle');
    const urlEl = document.getElementById('pageUrl');
    const faviconEl = document.getElementById('favicon');
    
    const title = this.pageData.title || this.currentTab.title || 'Untitled';
    const url = this.pageData.url || this.currentTab.url || '';
    
    titleEl.textContent = title;
    urlEl.textContent = url;
    
    // Set favicon
    if (this.pageData.favicon) {
      try {
        const faviconUrl = this.pageData.favicon.startsWith('http') 
          ? this.pageData.favicon 
          : new URL(this.pageData.favicon, url).href;
        faviconEl.style.backgroundImage = `url(${faviconUrl})`;
        faviconEl.style.backgroundSize = 'cover';
        faviconEl.style.backgroundPosition = 'center';
        faviconEl.style.backgroundColor = '#e2e8f0';
      } catch (e) {
        // Could not load favicon
      }
    }
    
    // Auto-fill title in form
    document.getElementById('title').value = title;
    
    // Auto-fill description (only if there's actual content)
    if (this.pageData.description && this.pageData.description.length > 20) {
      document.getElementById('description').value = this.pageData.description;
    }
    
    // UI populated
  }

  showSelectedTextInfo(text) {
    const infoEl = document.getElementById('selectedTextInfo');
    infoEl.textContent = `📝 Using selected text (${text.length} chars)`;
    infoEl.classList.remove('hidden');
  }

  setupEventListeners() {
    // Form submission
    const linkForm = document.getElementById('linkForm');
    if (linkForm) {
      linkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSave();
      });
    }

    // Tag input
    const tagInput = document.getElementById('tagInput');
    if (tagInput) {
      tagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const tag = tagInput.value.trim();
          if (tag) {
            this.addTag(tag);
            tagInput.value = '';
          }
        }
      });
    }

    // Cancel button
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        window.close();
      });
    }

    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        this.handleLogin();
      });
    }

    // Category: open custom input
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
      addCategoryBtn.addEventListener('click', () => {
        this.showCustomCategoryRow(true);
        const select = document.getElementById('category');
        if (select) select.value = '__custom__';
      });
    }

    // Category select change
    const categorySelect = document.getElementById('category');
    if (categorySelect) {
      categorySelect.addEventListener('change', () => {
        if (categorySelect.value === '__custom__') {
          this.showCustomCategoryRow(true);
        } else {
          this.showCustomCategoryRow(false);
          // remember last category on change
          try { chrome.storage.sync.set({ lastCategory: categorySelect.value }); } catch(_) {}
        }
      });
    }

    // Save custom category
    const saveCustomCategoryBtn = document.getElementById('saveCustomCategoryBtn');
    const customCategoryInput = document.getElementById('customCategoryInput');
    if (saveCustomCategoryBtn && customCategoryInput) {
      saveCustomCategoryBtn.addEventListener('click', async () => {
        const raw = customCategoryInput.value.trim();
        if (!raw) return;
        const value = raw.toLowerCase();
        if (!this.categories.includes(value)) {
          const next = [...this.categories, value];
          await this.saveCategories(next);
          this.renderCategories(value);
        } else {
          this.renderCategories(value);
        }
        // remember last category
        try { await chrome.storage.sync.set({ lastCategory: value }); } catch(_) {}
        this.showCustomCategoryRow(false);
      });
      // Enter key to save
      customCategoryInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveCustomCategoryBtn.click();
        }
      });
    }

    // Open dashboard button
    const openDash = document.getElementById('openDashboardBtn');
    if (openDash) {
      openDash.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://smar-track.vercel.app/dashboard' });
        window.close();
      });
    }

    // Start background token checker
    this.startBackgroundTokenCheck();

    // Keyboard shortcut: Cmd/Ctrl + Enter to save
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        const form = document.getElementById('linkForm');
        if (form) {
          e.preventDefault();
          this.handleSave();
        }
      }
    });

    // Quick Save button
    const quickSaveBtn = document.getElementById('quickSaveBtn');
    if (quickSaveBtn) {
      quickSaveBtn.addEventListener('click', () => {
        this.handleSave();
      });
    }
  }

  startBackgroundTokenCheck() {
    // Check for token every 2 seconds if showing login view
    setInterval(async () => {
      const loginView = document.getElementById('loginView');
      if (loginView && !loginView.classList.contains('hidden')) {
        // Checking for token in background
        const token = await this.getAuthToken();
        
        if (token) {
          // Token found, reloading
          location.reload();
        }
      }
    }, 2000); // Check every 2 seconds
  }

  handleLogin() {
    // Open web app in new tab
    chrome.tabs.create({
      url: 'https://smar-track.vercel.app'
    });
    
    // Close popup
    window.close();
  }

  addTag(tagText) {
    if (tagText && !this.tags.includes(tagText)) {
      this.tags.push(tagText);
      this.renderTags();
    }
  }

  removeTag(tagText) {
    this.tags = this.tags.filter(tag => tag !== tagText);
    this.renderTags();
  }

  renderTags() {
    const container = document.getElementById('tagsContainer');
    container.innerHTML = '';
    
    this.tags.forEach(tag => {
      const tagEl = document.createElement('div');
      tagEl.className = 'tag';
      tagEl.innerHTML = `
        ${tag}
        <span class="tag-remove" data-tag="${tag}">×</span>
      `;
      
      tagEl.querySelector('.tag-remove').addEventListener('click', () => {
        this.removeTag(tag);
      });
      
      container.appendChild(tagEl);
    });
  }

  async handleSave() {
    if (this.isProcessing) return;
    
    try {
      this.isProcessing = true;
      // Hide form immediately, show loading
      this.showLoading(true);
      this.hideStatus();
      // Disable save button and show progress text
      const saveBtn = document.getElementById('saveBtn');
      if (saveBtn) { saveBtn.setAttribute('disabled', 'true'); saveBtn.textContent = 'Saving…'; }
      
      // Get auth token first
      const token = await this.getAuthToken();
      
      if (!token) {
        throw new Error('Please log in at https://smar-track.vercel.app first');
      }
      
      // Get form data
      const linkData = this.getLinkData();
      // Remember last category
      try { await chrome.storage.sync.set({ lastCategory: linkData.category }); } catch(_) {}
      
      // Save to backend
      const result = await this.saveLink(linkData, token);
      
      // Show browser notification
      this.showNotification('Saved', 'Link added to SmarTrack');
      
      // Make body toast-only (transparent, shows only notification)
      document.body.classList.add('toast-only');
      this.showToast('Link added to SmarTrack', 'success');
      
      // Close after 2 seconds
      setTimeout(() => {
        window.close();
      }, 2000);
      
    } catch (error) {
      // Silently handle errors without showing technical details to user
      
      // Show detailed error message
        let errorMsg = 'Failed to save link';
        let isDuplicate = false;
        
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMsg = 'Please log in to SmarTrack';
        } else if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
          errorMsg = 'Connection error. Check your internet';
          // enqueue offline save
          try {
            const payload = this.getLinkData();
            chrome.runtime.sendMessage({ type: 'ENQUEUE_SAVE', linkData: payload });
            document.body.classList.add('toast-only');
            this.showToast('Saved offline. Will retry.', 'error');
            setTimeout(() => window.close(), 1500);
            return;
          } catch(_) {}
        } else if (error.message.includes('500')) {
          errorMsg = 'Server error. Please try again';
        } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          isDuplicate = true;
          errorMsg = 'This link already exists in SmarTrack';
        } else if (error.message) {
          errorMsg = error.message;
        }
      
      // Show message based on error type
      if (isDuplicate) {
        // Show error notification for duplicate
        this.showNotification('Duplicate', 'Link already exists in SmarTrack');
        // Make body toast-only (transparent, shows only error)
        document.body.classList.add('toast-only');
        this.showToast('Link already exists!', 'error');
        // Close after 2 seconds
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        // Show error and keep popup open
        this.showStatus(`❌ ${errorMsg}`, 'error');
      }
    } finally {
      this.isProcessing = false;
      this.showLoading(false);
      const saveBtn = document.getElementById('saveBtn');
      if (saveBtn) { saveBtn.removeAttribute('disabled'); saveBtn.textContent = 'Save Link'; }
    }
  }

  showSuccessAnimation() {
    // Add a brief success animation
    const container = document.querySelector('.container');
    if (container) {
      container.style.transition = 'all 0.3s ease';
      container.style.transform = 'scale(0.98)';
      setTimeout(() => {
        container.style.transform = 'scale(1)';
      }, 100);
    }
  }

  showNotification(title, message) {
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: title,
        message: message
      });
      // Notification sent
    } catch (e) {
      // Notification not supported
    }
    
    // Also show visual toast
    this.showToast(message, 'success');
  }

  showToast(message, type = 'success') {
    // Remove existing toast if any
    const existingToast = document.getElementById('toast');
    if (existingToast) {
      existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideDown 0.3s ease-out reverse';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  getLinkData() {
    const url = this.pageData.url || this.currentTab.url;
    
    // Get content text - prefer selected text, fallback to page metadata description
    const content = this.selectedText || this.pageData.description || '';
    
    // Resolve category (custom or selected)
    let category = 'research';
    try {
      const select = document.getElementById('category');
      const customInput = document.getElementById('customCategoryInput');
      if (select && select.value === '__custom__' && customInput && customInput.value.trim()) {
        category = customInput.value.trim().toLowerCase();
      } else if (select && select.value) {
        category = select.value;
      }
    } catch (_) {}

    return {
      url: url,
      title: document.getElementById('title').value.trim(),
      description: document.getElementById('description').value.trim(),
      content: content, // Full text content (selected text or description)
      category: category,
      tags: this.tags,
      contentType: this.detectContentType(url),
      thumbnail: this.pageData.image || null,
      favicon: this.pageData.favicon || null,
      isFavorite: false,
      isArchived: false
    };
  }

  detectContentType(url) {
    if (!url) return 'webpage';
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('.pdf')) return 'pdf';
    if (urlLower.includes('youtube.com') || urlLower.includes('vimeo.com')) return 'video';
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'image';
    if (urlLower.includes('arxiv.org') || urlLower.includes('scholar.google')) return 'article';
    if (urlLower.includes('.doc') || urlLower.includes('.docx')) return 'document';
    
    return 'webpage';
  }

  async saveLink(linkData) {
    try {
      // Get auth token
      const token = await this.getAuthToken();
      
      if (!token) {
        throw new Error('Please log in to SmarTrack first at https://smar-track.vercel.app');
      }
      
      // Save to backend
      const backendApi = new BackendApiService();
      await backendApi.saveLink(linkData, token);
      
    } catch (error) {
      // Silently re-throw error without logging
      throw error;
    }
  }

  async getAuthToken() {
    try {
      // First, try to get from Chrome storage
      const result = await chrome.storage.local.get(['authToken', 'tokenExpiry']);
      
      if (result.authToken) {
        // Check if token is valid (not expired)
        if (this.isTokenValid(result.tokenExpiry)) {
          return result.authToken;
        } else {
          // Token expired, clearing
          await chrome.storage.local.remove(['authToken', 'tokenExpiry']);
        }
      }
      
      // Try to get from localStorage (current page)
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const injectionResults = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            try {
              return localStorage.getItem('authToken');
            } catch (e) {
              return null;
            }
          }
        });
        
        const token = injectionResults[0]?.result;
        
        if (token && this.isTokenValid(null, token)) {
          // Extract expiry from token
          const expiry = this.getTokenExpiry(token);
          // Store in Chrome storage with expiry
          await chrome.storage.local.set({ 
            authToken: token, 
            tokenExpiry: expiry 
          });
          return token;
        }
      } catch (e) {
        // Not a problem
      }
      
      return null;
      
    } catch (error) {
      // Failed to get auth token
      return null;
    }
  }

  isTokenValid(expiry, token = null) {
    // If expiry is a timestamp
    if (expiry && expiry > Date.now()) {
      return true;
    }
    
    // Decode token to check expiry
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = payload.exp * 1000; // Convert to milliseconds
        return expiryTime > Date.now();
      } catch (e) {
        return true; // Assume valid if can't decode
      }
    }
    
    return !expiry; // If no expiry stored and no token, assume not valid
  }

  getTokenExpiry(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Return in milliseconds
    } catch (e) {
      return null;
    }
  }

  showLoading(show) {
    const loading = document.getElementById('loading');
    const form = document.getElementById('linkForm');
    
    if (show) {
      loading.style.display = 'block';
      form.style.display = 'none';
    } else {
      loading.style.display = 'none';
      form.style.display = 'block';
    }
  }

  showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status status-${type}`;
    status.classList.remove('hidden');
    
    // Add pulse animation for success
    if (type === 'success') {
      status.classList.add('pulse');
    }
    
    // No console logging
  }

  hideStatus() {
    const status = document.getElementById('status');
    status.classList.add('hidden');
    status.classList.remove('pulse');
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SmarTrackPopup();
});
