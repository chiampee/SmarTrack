/**
 * SmarTrack Chrome Extension Popup
 * Enhanced with selected text capture and metadata extraction
 * 
 * @fileoverview Main popup controller for the SmarTrack Chrome extension
 * @version 2.0.0
 */

// ============================================================================
// Constants
// ============================================================================

const CONSTANTS = {
  // API Configuration
  DASHBOARD_URL: 'https://smar-track.vercel.app',
  TOKEN_CHECK_INTERVAL: 2000, // ms
  TOAST_DISPLAY_DURATION: 3000, // ms
  AUTO_CLOSE_DELAY: 2000, // ms
  SELECTED_TEXT_MIN_LENGTH: 20,
  
  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    TOKEN_EXPIRY: 'tokenExpiry',
    SETTINGS: 'settings',
    LAST_CATEGORY: 'lastCategory'
  },
  
  // Default Categories (note: "other" is always added separately to trigger custom category input)
  DEFAULT_CATEGORIES: ['research', 'articles', 'tools', 'references', 'other'],
  
  // DOM Selectors
  SELECTORS: {
    LOGIN_VIEW: 'loginView',
    MAIN_VIEW: 'mainView',
    LINK_FORM: 'linkForm',
    TITLE_INPUT: 'title',
    DESCRIPTION_INPUT: 'description',
    CATEGORY_SELECT: 'category',
    CUSTOM_CATEGORY_ROW: 'customCategoryRow',
    CUSTOM_CATEGORY_INPUT: 'customCategoryInput',
    SAVE_CUSTOM_CATEGORY_BTN: 'saveCustomCategoryBtn',
    ADD_CATEGORY_BTN: 'addCategoryBtn',
    SAVE_BTN: 'saveBtn',
    CANCEL_BTN: 'cancelBtn',
    LOGIN_BTN: 'loginBtn',
    OPEN_DASHBOARD_BTN: 'openDashboardBtn',
    LOADING: 'loading',
    STATUS: 'status',
    DUPLICATES_PANEL: 'duplicatesPanel',
    DUPE_LIST: 'dupeList',
    SELECTED_TEXT_INFO: 'selectedTextInfo',
    PAGE_TITLE: 'pageTitle',
    PAGE_URL: 'pageUrl',
    FAVICON: 'favicon'
  },
  
  // Error Messages
  ERROR_MESSAGES: {
    GENERIC: 'Failed to save link',
    UNAUTHORIZED: 'Please log in to SmarTrack',
    NETWORK: 'Connection error. Check your internet',
    SERVER_ERROR: 'Server error. Please try again',
    DUPLICATE: 'This link already exists in SmarTrack',
    INVALID_TOKEN: 'Please log in at https://smar-track.vercel.app first'
  },
  
  // Custom Category Option Value
  CUSTOM_CATEGORY_VALUE: '__custom__',
  
  // System URLs to skip (cannot inject scripts)
  SKIP_URL_PREFIXES: [
    'chrome://',
    'chrome-extension://',
    'edge://',
    'about:',
    'moz-extension://',
    'brave://',
    'opera://'
  ]
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Safely gets an element by ID
 * @param {string} id - Element ID
 * @returns {HTMLElement|null}
 */
const getElement = (id) => {
  try {
    return document.getElementById(id);
  } catch {
    return null;
  }
};

/**
 * Capitalizes the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string}
 */
const capitalize = (str) => {
  if (!str || typeof str !== 'string') return str;
  try {
    return str.charAt(0).toUpperCase() + str.slice(1);
  } catch {
    return str;
  }
};

/**
 * Trims and validates a string
 * @param {string} str - String to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string}
 */
const sanitizeString = (str, maxLength = 1000) => {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
};

/**
 * Validates URL format
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Checks if a URL is a system URL that should be skipped
 * @param {string} url - URL to check
 * @returns {boolean}
 */
const isSystemUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return true;
  }
  
  return CONSTANTS.SKIP_URL_PREFIXES.some(prefix => 
    url.toLowerCase().startsWith(prefix.toLowerCase())
  );
};

/**
 * Creates a debounced function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function}
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// ============================================================================
// Main Popup Class
// ============================================================================

/**
 * SmarTrack Popup Controller
 * Manages the Chrome extension popup UI and interactions
 */
class SmarTrackPopup {
  /**
   * Creates a new SmarTrackPopup instance
   */
  constructor() {
    /** @type {boolean} */
    this.isProcessing = false;
    
    /** @type {chrome.tabs.Tab|null} */
    this.currentTab = null;
    
    /** @type {Object} */
    this.pageData = {};
    
    /** @type {string} */
    this.selectedText = '';
    
    /** @type {string[]} */
    this.categories = [];
    
    /** @type {string|null} */
    this.lastCategory = null;
    
    /** @type {number|null} */
    this.tokenCheckInterval = null;
    
    /** @type {Function[]} */
    this.cleanupFunctions = [];
    
    this.init();
  }

  /**
   * Initializes the popup
   * @async
   * @returns {Promise<void>}
   */
  async init() {
    try {
      await this.loadCategories();
      await this.loadCurrentTab();
      
      const token = await this.getAuthToken();
      this.setupEventListeners();
      this.renderCategories();
      
      if (!token) {
        this.showLoginView();
        this.startBackgroundTokenCheck();
      } else {
        await this.extractPageMetadata();
        await this.captureSelectedText();
        this.populateUI();
        this.showMainView();
      }
      
      this.focusTitleInput();
    } catch (error) {
      this.handleInitializationError(error);
    }
  }

  /**
   * Handles initialization errors gracefully
   * @param {Error} error - Error object
   * @returns {void}
   */
  handleInitializationError(error) {
    this.showStatus('Failed to load page', 'error');
    // Log error for debugging without exposing to user
    if (chrome.runtime?.lastError) {
      console.error('[SRT] Initialization error:', chrome.runtime.lastError);
    }
  }

  /**
   * Loads the current active tab
   * @async
   * @returns {Promise<void>}
   */
  async loadCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        throw new Error('No active tab found');
      }
      this.currentTab = tab;
    } catch (error) {
      console.error('[SRT] Failed to load current tab:', error);
      throw error;
    }
  }

  /**
   * Focuses the title input field for quick editing
   * @returns {void}
   */
  focusTitleInput() {
    // Use requestAnimationFrame for better timing
    requestAnimationFrame(() => {
      const titleInput = getElement(CONSTANTS.SELECTORS.TITLE_INPUT);
      if (titleInput) {
        titleInput.focus();
        // Select all text for quick replacement
        titleInput.select();
      }
    });
  }

  /**
   * Loads categories from storage
   * @async
   * @returns {Promise<void>}
   */
  async loadCategories() {
    try {
      const result = await chrome.storage.sync.get([
        CONSTANTS.STORAGE_KEYS.SETTINGS,
        CONSTANTS.STORAGE_KEYS.LAST_CATEGORY
      ]);
      
      const stored = result?.[CONSTANTS.STORAGE_KEYS.SETTINGS]?.categories;
      this.categories = Array.isArray(stored) && stored.length > 0
        ? stored
        : [...CONSTANTS.DEFAULT_CATEGORIES];
      
      this.lastCategory = result?.[CONSTANTS.STORAGE_KEYS.LAST_CATEGORY] || null;
    } catch (error) {
      console.error('[SRT] Failed to load categories:', error);
      this.categories = [...CONSTANTS.DEFAULT_CATEGORIES];
      this.lastCategory = null;
    }
  }

  /**
   * Saves categories to storage
   * @async
   * @param {string[]} categories - Array of category names
   * @returns {Promise<void>}
   */
  async saveCategories(categories) {
    if (!Array.isArray(categories) || categories.length === 0) {
      return;
    }
    
    try {
      const result = await chrome.storage.sync.get([CONSTANTS.STORAGE_KEYS.SETTINGS]);
      const settings = result[CONSTANTS.STORAGE_KEYS.SETTINGS] || {};
      settings.categories = categories;
      
      await chrome.storage.sync.set({ [CONSTANTS.STORAGE_KEYS.SETTINGS]: settings });
      this.categories = categories;
    } catch (error) {
      console.error('[SRT] Failed to save categories:', error);
      // Non-critical, continue execution
    }
  }

  /**
   * Renders category options in the select dropdown
   * @param {string|null} selectedValue - Value to pre-select
   * @returns {void}
   */
  renderCategories(selectedValue = null) {
    const select = getElement(CONSTANTS.SELECTORS.CATEGORY_SELECT);
    if (!select) return;

    // Clear existing options
    select.innerHTML = '';

    // Ensure "other" is in the categories list
    const categoriesWithOther = [...this.categories];
    if (!categoriesWithOther.includes('other')) {
      categoriesWithOther.push('other');
    }

    // Add stored categories (including "other")
    categoriesWithOther.forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = capitalize(category);
      select.appendChild(option);
    });

    // Determine selection: explicit > lastCategory > default
    const fallback = this.categories[0] || CONSTANTS.DEFAULT_CATEGORIES[0];
    const toSelect = selectedValue || this.lastCategory || fallback;
    select.value = categoriesWithOther.includes(toSelect) ? toSelect : fallback;
    
    // Show/hide custom category input based on selection
    this.updateCustomCategoryVisibility();
  }

  /**
   * Shows or hides the custom category input row
   * @param {boolean} show - Whether to show the row
   * @returns {void}
   */
  showCustomCategoryRow(show) {
    const row = getElement(CONSTANTS.SELECTORS.CUSTOM_CATEGORY_ROW);
    const input = getElement(CONSTANTS.SELECTORS.CUSTOM_CATEGORY_INPUT);
    
    if (!row || !input) return;
    
    if (show) {
      row.classList.remove('hidden');
      // Focus input after DOM update
      requestAnimationFrame(() => input.focus());
    } else {
      row.classList.add('hidden');
      input.value = '';
    }
  }

  /**
   * Updates custom category input visibility based on current selection
   * @returns {void}
   */
  updateCustomCategoryVisibility() {
    const select = getElement(CONSTANTS.SELECTORS.CATEGORY_SELECT);
    if (!select) return;
    
    // Show custom input only when "other" is selected
    const isOtherSelected = select.value === 'other';
    this.showCustomCategoryRow(isOtherSelected);
  }

  /**
   * Shows the login view and hides main view
   * @returns {void}
   */
  showLoginView() {
    const loginView = getElement(CONSTANTS.SELECTORS.LOGIN_VIEW);
    const mainView = getElement(CONSTANTS.SELECTORS.MAIN_VIEW);
    
    if (loginView) loginView.classList.remove('hidden');
    if (mainView) mainView.classList.add('hidden');
  }

  /**
   * Shows the main view and hides login view
   * @returns {void}
   */
  showMainView() {
    const loginView = getElement(CONSTANTS.SELECTORS.LOGIN_VIEW);
    const mainView = getElement(CONSTANTS.SELECTORS.MAIN_VIEW);
    
    if (loginView) loginView.classList.add('hidden');
    if (mainView) mainView.classList.remove('hidden');
  }

  /**
   * Extracts page metadata from the current tab
   * @async
   * @returns {Promise<void>}
   */
  async extractPageMetadata() {
    if (!this.currentTab?.id) {
      this.pageData = this.getFallbackPageData();
      return;
    }
    
    // Check if URL is a system URL (cannot inject scripts)
    const currentUrl = this.currentTab.url || '';
    if (isSystemUrl(currentUrl)) {
      // Use fallback data for system pages (this is expected behavior)
      this.pageData = this.getFallbackPageData();
      return;
    }
    
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        func: this.extractMetadataFromPage
      });
      
      this.pageData = result?.result || this.getFallbackPageData();
      
      // Fetch potential duplicates (best-effort, non-blocking)
      this.fetchDuplicates().catch(() => {
        // Silently fail - duplicates are not critical
      });
      
    } catch (error) {
      // Check if error is due to system page (expected)
      const errorMessage = error.message || '';
      if (errorMessage.includes('Cannot access') && errorMessage.includes('chrome://')) {
        // Expected error for system pages, use fallback silently
        this.pageData = this.getFallbackPageData();
      } else {
        // Unexpected error, log but continue with fallback
        console.error('[SRT] Failed to extract metadata:', error);
        this.pageData = this.getFallbackPageData();
      }
    }
  }

  /**
   * Extracts metadata from the current page (injected function)
   * @returns {Object} Page metadata
   */
  extractMetadataFromPage() {
    const getMetaContent = (name) => {
      const meta = document.querySelector(
        `meta[name="${name}"], meta[property="${name}"]`
      );
      return meta ? meta.getAttribute('content') : null;
    };

    const getFaviconUrl = () => {
      const favicon = document.querySelector('link[rel="icon"]') ||
        document.querySelector('link[rel="shortcut icon"]') ||
        document.querySelector('link[rel="apple-touch-icon"]');
      
      if (favicon) {
        const href = favicon.getAttribute('href');
        try {
          return new URL(href, window.location.origin).href;
        } catch {
          return href;
        }
      }
      
      try {
        return new URL('/favicon.ico', window.location.origin).href;
      } catch {
        return '';
      }
    };

    const selectedText = window.getSelection().toString().trim();
    const title = document.title;
    const url = window.location.href;
    
    const description = getMetaContent('description') ||
      getMetaContent('og:description') ||
      getMetaContent('twitter:description') ||
      (document.querySelector('p')?.textContent?.substring(0, 200) || '');
    
    const image = getMetaContent('og:image') || getMetaContent('twitter:image');
    const favicon = getFaviconUrl();

    return {
      title: title || 'Untitled',
      url: url || '',
      description: description || '',
      image: image || null,
      favicon: favicon || null,
      selectedText: selectedText || ''
    };
  }

  /**
   * Gets fallback page data from tab information
   * @returns {Object} Fallback page data
   */
  getFallbackPageData() {
    return {
      title: this.currentTab?.title || 'Untitled',
      url: this.currentTab?.url || '',
      description: '',
      favicon: null,
      selectedText: '',
      image: null
    };
  }

  /**
   * Fetches potential duplicate links
   * @async
   * @returns {Promise<void>}
   */
  async fetchDuplicates() {
    try {
      const api = new BackendApiService();
      const url = this.pageData.url || this.currentTab?.url || '';
      
      // Skip duplicate search for system URLs or invalid URLs
      if (!url || isSystemUrl(url)) {
        return;
      }
      
      const duplicates = await api.searchDuplicates(url);
      this.renderDuplicates(duplicates || []);
    } catch (error) {
      // Silently fail - duplicates are non-critical
      console.error('[SRT] Duplicate search failed:', error);
    }
  }

  /**
   * Renders duplicate links panel
   * @param {Array<Object>} duplicates - Array of duplicate link objects
   * @returns {void}
   */
  renderDuplicates(duplicates) {
    const panel = getElement(CONSTANTS.SELECTORS.DUPLICATES_PANEL);
    const list = getElement(CONSTANTS.SELECTORS.DUPE_LIST);
    
    if (!panel || !list) return;
    
    if (!Array.isArray(duplicates) || duplicates.length === 0) {
      panel.classList.add('hidden');
      return;
    }
    
    panel.classList.remove('hidden');
    list.innerHTML = '';
    
    // Show max 3 duplicates
    duplicates.slice(0, 3).forEach((duplicate) => {
      const li = document.createElement('li');
      li.className = 'row';
      li.setAttribute('role', 'listitem');
      
      const title = document.createElement('div');
      title.style.cssText = 'flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;';
      title.textContent = duplicate.title || duplicate.url || 'Untitled';
      title.setAttribute('title', duplicate.title || duplicate.url || '');
      
      const openButton = document.createElement('button');
      openButton.className = 'open';
      openButton.textContent = 'Open';
      openButton.setAttribute('aria-label', `Open ${duplicate.title || 'duplicate link'}`);
      openButton.addEventListener('click', () => {
        try {
          chrome.tabs.create({ url: duplicate.url });
        } catch (error) {
          console.error('[SRT] Failed to open duplicate:', error);
        }
      });
      
      li.appendChild(title);
      li.appendChild(openButton);
      list.appendChild(li);
    });
  }

  /**
   * Captures selected text from the current page
   * @async
   * @returns {Promise<void>}
   */
  async captureSelectedText() {
    if (!this.currentTab?.id) {
      this.selectedText = '';
      return;
    }
    
    // Check if URL is a system URL (cannot inject scripts)
    const currentUrl = this.currentTab.url || '';
    if (isSystemUrl(currentUrl)) {
      // Cannot capture text from system pages
      this.selectedText = '';
      return;
    }
    
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        func: () => window.getSelection().toString().trim()
      });
      
      this.selectedText = result?.result || '';
      
      if (this.selectedText) {
        this.showSelectedTextInfo(this.selectedText);
      }
    } catch (error) {
      // Check if error is due to system page (expected)
      const errorMessage = error.message || '';
      if (errorMessage.includes('Cannot access') && errorMessage.includes('chrome://')) {
        // Expected error for system pages, silently skip
        this.selectedText = '';
      } else {
        // Unexpected error, log but continue
        console.error('[SRT] Failed to capture selected text:', error);
        this.selectedText = '';
      }
    }
  }

  /**
   * Populates the UI with extracted page data
   * @returns {void}
   */
  populateUI() {
    const titleEl = getElement(CONSTANTS.SELECTORS.PAGE_TITLE);
    const urlEl = getElement(CONSTANTS.SELECTORS.PAGE_URL);
    const faviconEl = getElement(CONSTANTS.SELECTORS.FAVICON);
    const titleInput = getElement(CONSTANTS.SELECTORS.TITLE_INPUT);
    const descriptionInput = getElement(CONSTANTS.SELECTORS.DESCRIPTION_INPUT);
    
    const title = this.pageData.title || this.currentTab?.title || 'Untitled';
    const url = this.pageData.url || this.currentTab?.url || '';
    
    if (titleEl) titleEl.textContent = title;
    if (urlEl) {
      urlEl.textContent = url;
      urlEl.setAttribute('title', url); // Tooltip for long URLs
    }
    
    // Set favicon
    if (faviconEl && this.pageData.favicon) {
      try {
        const faviconUrl = this.pageData.favicon.startsWith('http')
          ? this.pageData.favicon
          : new URL(this.pageData.favicon, url).href;
        
        faviconEl.style.cssText = `
          background-image: url(${faviconUrl});
          background-size: cover;
          background-position: center;
          background-color: #e2e8f0;
        `;
      } catch (error) {
        console.error('[SRT] Failed to set favicon:', error);
      }
    }
    
    // Auto-fill form inputs
    if (titleInput) {
      titleInput.value = sanitizeString(title, 200);
    }
    
    // Only auto-fill description if meaningful content exists
    if (descriptionInput && this.pageData.description) {
      const description = sanitizeString(this.pageData.description);
      if (description.length >= CONSTANTS.SELECTED_TEXT_MIN_LENGTH) {
        descriptionInput.value = description;
      }
    }
  }

  /**
   * Shows selected text info banner
   * @param {string} text - Selected text
   * @returns {void}
   */
  showSelectedTextInfo(text) {
    const infoEl = getElement(CONSTANTS.SELECTORS.SELECTED_TEXT_INFO);
    if (!infoEl) return;
    
    const charCount = text.length;
    infoEl.textContent = `📝 Using selected text (${charCount} chars)`;
    infoEl.classList.remove('hidden');
    infoEl.setAttribute('aria-live', 'polite');
  }

  /**
   * Sets up all event listeners
   * @returns {void}
   */
  setupEventListeners() {
    this.setupFormListeners();
    this.setupButtonListeners();
    this.setupCategoryListeners();
    this.setupKeyboardShortcuts();
  }

  /**
   * Sets up form-related event listeners
   * @returns {void}
   */
  setupFormListeners() {
    const linkForm = getElement(CONSTANTS.SELECTORS.LINK_FORM);
    if (linkForm) {
      const handleSubmit = (e) => {
        e.preventDefault();
        this.handleSave();
      };
      linkForm.addEventListener('submit', handleSubmit);
      this.cleanupFunctions.push(() => {
        linkForm.removeEventListener('submit', handleSubmit);
      });
    }
  }

  /**
   * Sets up button event listeners
   * @returns {void}
   */
  setupButtonListeners() {
    const cancelBtn = getElement(CONSTANTS.SELECTORS.CANCEL_BTN);
    if (cancelBtn) {
      const handleCancel = () => window.close();
      cancelBtn.addEventListener('click', handleCancel);
      this.cleanupFunctions.push(() => {
        cancelBtn.removeEventListener('click', handleCancel);
      });
    }

    const loginBtn = getElement(CONSTANTS.SELECTORS.LOGIN_BTN);
    if (loginBtn) {
      const handleLogin = () => this.handleLogin();
      loginBtn.addEventListener('click', handleLogin);
      this.cleanupFunctions.push(() => {
        loginBtn.removeEventListener('click', handleLogin);
      });
    }

    const openDashBtn = getElement(CONSTANTS.SELECTORS.OPEN_DASHBOARD_BTN);
    if (openDashBtn) {
      const handleOpenDashboard = () => {
        chrome.tabs.create({ url: CONSTANTS.DASHBOARD_URL + '/dashboard' });
        window.close();
      };
      openDashBtn.addEventListener('click', handleOpenDashboard);
      this.cleanupFunctions.push(() => {
        openDashBtn.removeEventListener('click', handleOpenDashboard);
      });
    }
  }

  /**
   * Sets up category-related event listeners
   * @returns {void}
   */
  setupCategoryListeners() {
    // Hide the "Add custom category" button since it's triggered by selecting "other"
    const addCategoryBtn = getElement(CONSTANTS.SELECTORS.ADD_CATEGORY_BTN);
    if (addCategoryBtn) {
      addCategoryBtn.style.display = 'none';
    }

    const categorySelect = getElement(CONSTANTS.SELECTORS.CATEGORY_SELECT);
    if (categorySelect) {
      const handleCategoryChange = () => {
        // Show custom input only when "other" is selected
        this.updateCustomCategoryVisibility();
        
        // Save last category if not "other" (don't save "other" as it's just a trigger)
        if (categorySelect.value !== 'other') {
          this.saveLastCategory(categorySelect.value);
        }
      };
      categorySelect.addEventListener('change', handleCategoryChange);
      this.cleanupFunctions.push(() => {
        categorySelect.removeEventListener('change', handleCategoryChange);
      });
    }

    const saveCustomCategoryBtn = getElement(CONSTANTS.SELECTORS.SAVE_CUSTOM_CATEGORY_BTN);
    const customCategoryInput = getElement(CONSTANTS.SELECTORS.CUSTOM_CATEGORY_INPUT);
    
    if (saveCustomCategoryBtn && customCategoryInput) {
      const handleSaveCustomCategory = async () => {
        await this.handleSaveCustomCategory();
      };
      
      saveCustomCategoryBtn.addEventListener('click', handleSaveCustomCategory);
      
      // Enter key support
      const handleCustomCategoryKeyPress = async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          await handleSaveCustomCategory();
        }
      };
      customCategoryInput.addEventListener('keypress', handleCustomCategoryKeyPress);
      
      this.cleanupFunctions.push(() => {
        saveCustomCategoryBtn.removeEventListener('click', handleSaveCustomCategory);
        customCategoryInput.removeEventListener('keypress', handleCustomCategoryKeyPress);
      });
    }
  }

  /**
   * Handles saving a custom category
   * @async
   * @returns {Promise<void>}
   */
  async handleSaveCustomCategory() {
    const input = getElement(CONSTANTS.SELECTORS.CUSTOM_CATEGORY_INPUT);
    if (!input) return;
    
    const rawValue = input.value.trim();
    if (!rawValue) return;
    
    const normalizedValue = rawValue.toLowerCase();
    
    // Add to categories if not already present (but keep "other" out of the saved list)
    if (!this.categories.includes(normalizedValue) && normalizedValue !== 'other') {
      const updatedCategories = [...this.categories, normalizedValue];
      await this.saveCategories(updatedCategories);
    }
    
    // Select the new category and update UI
    this.renderCategories(normalizedValue);
    await this.saveLastCategory(normalizedValue);
    
    // Clear and hide the custom input
    input.value = '';
    this.showCustomCategoryRow(false);
  }

  /**
   * Saves the last selected category
   * @async
   * @param {string} category - Category name
   * @returns {Promise<void>}
   */
  async saveLastCategory(category) {
    if (!category) return;
    
    try {
      await chrome.storage.sync.set({
        [CONSTANTS.STORAGE_KEYS.LAST_CATEGORY]: category
      });
      this.lastCategory = category;
    } catch (error) {
      console.error('[SRT] Failed to save last category:', error);
    }
  }

  /**
   * Sets up keyboard shortcuts
   * @returns {void}
   */
  setupKeyboardShortcuts() {
    const handleKeyboardShortcut = (e) => {
      // Cmd/Ctrl + Enter to save
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        const form = getElement(CONSTANTS.SELECTORS.LINK_FORM);
        if (form && !this.isProcessing) {
          e.preventDefault();
          this.handleSave();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyboardShortcut);
    this.cleanupFunctions.push(() => {
      document.removeEventListener('keydown', handleKeyboardShortcut);
    });
  }

  /**
   * Starts background token checking when showing login view
   * @returns {void}
   */
  startBackgroundTokenCheck() {
    // Clear any existing interval
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
    }
    
    this.tokenCheckInterval = setInterval(async () => {
      const loginView = getElement(CONSTANTS.SELECTORS.LOGIN_VIEW);
      if (loginView && !loginView.classList.contains('hidden')) {
        const token = await this.getAuthToken();
        if (token) {
          // Stop checking once token is found
          this.stopBackgroundTokenCheck();
          location.reload();
        }
      }
    }, CONSTANTS.TOKEN_CHECK_INTERVAL);
    
    // Cleanup on window close
    window.addEventListener('beforeunload', () => {
      this.stopBackgroundTokenCheck();
    });
  }

  /**
   * Stops background token checking
   * @returns {void}
   */
  stopBackgroundTokenCheck() {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = null;
    }
  }

  /**
   * Handles login button click
   * @returns {void}
   */
  handleLogin() {
    chrome.tabs.create({
      url: CONSTANTS.DASHBOARD_URL
    });
    window.close();
  }

  /**
   * Handles saving a link
   * @async
   * @returns {Promise<void>}
   */
  async handleSave() {
    if (this.isProcessing) return;
    
    try {
      this.isProcessing = true;
      this.showLoading(true);
      this.hideStatus();
      this.setSaveButtonState(true, 'Saving…');
      
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error(CONSTANTS.ERROR_MESSAGES.INVALID_TOKEN);
      }
      
      const linkData = this.getLinkData();
      
      // Validate link data
      if (!isValidUrl(linkData.url)) {
        throw new Error('Invalid URL');
      }
      
      if (!linkData.title || linkData.title.trim().length === 0) {
        throw new Error('Title is required');
      }
      
      await this.saveLastCategory(linkData.category);
      await this.saveLink(linkData, token);
      
      // Success
      this.showNotification('Saved', 'Link added to SmarTrack');
      document.body.classList.add('toast-only');
      this.showToast('Link added to SmarTrack', 'success');
      
      setTimeout(() => {
        window.close();
      }, CONSTANTS.AUTO_CLOSE_DELAY);
      
    } catch (error) {
      this.handleSaveError(error);
    } finally {
      this.isProcessing = false;
      this.showLoading(false);
      this.setSaveButtonState(false, 'Save Link');
    }
  }

  /**
   * Sets the save button state
   * @param {boolean} disabled - Whether button should be disabled
   * @param {string} text - Button text
   * @returns {void}
   */
  setSaveButtonState(disabled, text) {
    const saveBtn = getElement(CONSTANTS.SELECTORS.SAVE_BTN);
    if (!saveBtn) return;
    
    if (disabled) {
      saveBtn.setAttribute('disabled', 'true');
      saveBtn.setAttribute('aria-busy', 'true');
    } else {
      saveBtn.removeAttribute('disabled');
      saveBtn.removeAttribute('aria-busy');
    }
    saveBtn.textContent = text;
  }

  /**
   * Handles save errors with appropriate user feedback
   * @param {Error} error - Error object
   * @returns {void}
   */
  handleSaveError(error) {
    const errorMessage = error.message || '';
    let userMessage = CONSTANTS.ERROR_MESSAGES.GENERIC;
    let isDuplicate = false;
    
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      userMessage = CONSTANTS.ERROR_MESSAGES.UNAUTHORIZED;
    } else if (errorMessage.includes('Network') || errorMessage.includes('Failed to fetch')) {
      userMessage = CONSTANTS.ERROR_MESSAGES.NETWORK;
      this.handleOfflineSave();
      return;
    } else if (errorMessage.includes('500')) {
      userMessage = CONSTANTS.ERROR_MESSAGES.SERVER_ERROR;
    } else if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
      isDuplicate = true;
      userMessage = CONSTANTS.ERROR_MESSAGES.DUPLICATE;
    } else if (errorMessage) {
      userMessage = errorMessage;
    }
    
    if (isDuplicate) {
      this.showNotification('Duplicate', 'Link already exists in SmarTrack');
      document.body.classList.add('toast-only');
      this.showToast('Link already exists!', 'error');
      setTimeout(() => window.close(), CONSTANTS.AUTO_CLOSE_DELAY);
    } else {
      this.showStatus(`❌ ${userMessage}`, 'error');
    }
  }

  /**
   * Handles offline save by enqueuing for later
   * @returns {void}
   */
  handleOfflineSave() {
    try {
      const payload = this.getLinkData();
      chrome.runtime.sendMessage({
        type: 'ENQUEUE_SAVE',
        linkData: payload
      });
      document.body.classList.add('toast-only');
      this.showToast('Saved offline. Will retry.', 'error');
      setTimeout(() => window.close(), 1500);
    } catch (error) {
      console.error('[SRT] Failed to enqueue offline save:', error);
      this.showStatus(`❌ ${CONSTANTS.ERROR_MESSAGES.NETWORK}`, 'error');
    }
  }

  /**
   * Shows a browser notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @returns {void}
   */
  showNotification(title, message) {
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: title,
        message: message
      });
    } catch (error) {
      // Notifications not supported or permission not granted
      console.error('[SRT] Failed to show notification:', error);
    }
    
    this.showToast(message, 'success');
  }

  /**
   * Shows a toast message
   * @param {string} message - Toast message
   * @param {string} type - Toast type ('success' or 'error')
   * @returns {void}
   */
  showToast(message, type = 'success') {
    // Remove existing toast
    const existingToast = document.getElementById('toast');
    if (existingToast) {
      existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    document.body.appendChild(toast);
    
    // Remove after duration
    setTimeout(() => {
      toast.style.animation = 'slideDown 0.3s ease-out reverse';
      setTimeout(() => toast.remove(), 300);
    }, CONSTANTS.TOAST_DISPLAY_DURATION);
  }

  /**
   * Gets link data from form inputs
   * @returns {Object} Link data object
   */
  getLinkData() {
    const url = this.pageData.url || this.currentTab?.url || '';
    const content = this.selectedText || this.pageData.description || '';
    
    // Get category
    let category = CONSTANTS.DEFAULT_CATEGORIES[0];
    try {
      const select = getElement(CONSTANTS.SELECTORS.CATEGORY_SELECT);
      const customInput = getElement(CONSTANTS.SELECTORS.CUSTOM_CATEGORY_INPUT);
      
      // If "other" is selected and there's a custom category input, use that
      if (select?.value === 'other' && customInput?.value.trim()) {
        category = sanitizeString(customInput.value.trim().toLowerCase(), 50);
      } else if (select?.value && select.value !== 'other') {
        // Use selected category (not "other")
        category = select.value;
      } else if (select?.value === 'other' && !customInput?.value.trim()) {
        // If "other" is selected but no custom value, default to "other"
        category = 'other';
      }
    } catch (error) {
      console.error('[SRT] Failed to get category:', error);
    }
    
    const titleInput = getElement(CONSTANTS.SELECTORS.TITLE_INPUT);
    const descriptionInput = getElement(CONSTANTS.SELECTORS.DESCRIPTION_INPUT);
    
    return {
      url: url,
      title: sanitizeString(titleInput?.value || '', 200),
      description: sanitizeString(descriptionInput?.value || '', 1000),
      content: sanitizeString(content, 5000),
      category: category,
      tags: [], // Tags removed for better UX - can be added later in dashboard
      contentType: this.detectContentType(url),
      thumbnail: this.pageData.image || null,
      favicon: this.pageData.favicon || null,
      isFavorite: false,
      isArchived: false
    };
  }

  /**
   * Detects content type from URL
   * @param {string} url - URL to analyze
   * @returns {string} Content type
   */
  detectContentType(url) {
    if (!url || typeof url !== 'string') return 'webpage';
    
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('.pdf')) return 'pdf';
    if (urlLower.includes('youtube.com') || urlLower.includes('vimeo.com')) return 'video';
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'image';
    if (urlLower.includes('arxiv.org') || urlLower.includes('scholar.google')) return 'article';
    if (urlLower.includes('.doc') || urlLower.includes('.docx')) return 'document';
    
    return 'webpage';
  }

  /**
   * Saves link to backend
   * @async
   * @param {Object} linkData - Link data object
   * @param {string} token - Auth token
   * @returns {Promise<void>}
   */
  async saveLink(linkData, token) {
    if (!token) {
      throw new Error(CONSTANTS.ERROR_MESSAGES.INVALID_TOKEN);
    }
    
    try {
      const backendApi = new BackendApiService();
      await backendApi.saveLink(linkData, token);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets auth token from storage or page
   * @async
   * @returns {Promise<string|null>}
   */
  async getAuthToken() {
    try {
      // Try Chrome storage first
      const result = await chrome.storage.local.get([
        CONSTANTS.STORAGE_KEYS.AUTH_TOKEN,
        CONSTANTS.STORAGE_KEYS.TOKEN_EXPIRY
      ]);
      
      if (result[CONSTANTS.STORAGE_KEYS.AUTH_TOKEN]) {
        if (this.isTokenValid(result[CONSTANTS.STORAGE_KEYS.TOKEN_EXPIRY])) {
          return result[CONSTANTS.STORAGE_KEYS.AUTH_TOKEN];
        } else {
          // Token expired, clear it
          await chrome.storage.local.remove([
            CONSTANTS.STORAGE_KEYS.AUTH_TOKEN,
            CONSTANTS.STORAGE_KEYS.TOKEN_EXPIRY
          ]);
        }
      }
      
      // Try to get from page localStorage
      if (this.currentTab?.id) {
        try {
          const [injectionResult] = await chrome.scripting.executeScript({
            target: { tabId: this.currentTab.id },
            func: () => {
              try {
                return localStorage.getItem('authToken');
              } catch {
                return null;
              }
            }
          });
          
          const token = injectionResult?.result;
          
          if (token && this.isTokenValid(null, token)) {
            const expiry = this.getTokenExpiry(token);
            await chrome.storage.local.set({
              [CONSTANTS.STORAGE_KEYS.AUTH_TOKEN]: token,
              [CONSTANTS.STORAGE_KEYS.TOKEN_EXPIRY]: expiry
            });
            return token;
          }
        } catch (error) {
          // Not a problem - page might not allow script injection
          console.error('[SRT] Failed to get token from page:', error);
        }
      }
      
      return null;
    } catch (error) {
      console.error('[SRT] Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Checks if token is valid
   * @param {number|null} expiry - Expiry timestamp
   * @param {string|null} token - Token string
   * @returns {boolean}
   */
  isTokenValid(expiry, token = null) {
    // Check stored expiry
    if (expiry && typeof expiry === 'number' && expiry > Date.now()) {
      return true;
    }
    
    // Decode token to check expiry
    if (token && typeof token === 'string') {
      try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        
        const payload = JSON.parse(atob(parts[1]));
        const expiryTime = payload.exp * 1000; // Convert to milliseconds
        return expiryTime > Date.now();
      } catch {
        return false; // Invalid token format
      }
    }
    
    return false;
  }

  /**
   * Gets token expiry from JWT
   * @param {string} token - JWT token
   * @returns {number|null}
   */
  getTokenExpiry(token) {
    if (!token || typeof token !== 'string') return null;
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
    } catch {
      return null;
    }
  }

  /**
   * Shows or hides loading state
   * @param {boolean} show - Whether to show loading
   * @returns {void}
   */
  showLoading(show) {
    const loading = getElement(CONSTANTS.SELECTORS.LOADING);
    const form = getElement(CONSTANTS.SELECTORS.LINK_FORM);
    
    if (loading) {
      loading.style.display = show ? 'block' : 'none';
    }
    
    if (form) {
      form.style.display = show ? 'none' : 'block';
    }
  }

  /**
   * Shows status message
   * @param {string} message - Status message
   * @param {string} type - Status type ('success' or 'error')
   * @returns {void}
   */
  showStatus(message, type) {
    const status = getElement(CONSTANTS.SELECTORS.STATUS);
    if (!status) return;
    
    status.textContent = message;
    status.className = `status status-${type}`;
    status.classList.remove('hidden');
    status.setAttribute('role', 'alert');
    status.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    
    if (type === 'success') {
      status.classList.add('pulse');
    }
  }

  /**
   * Hides status message
   * @returns {void}
   */
  hideStatus() {
    const status = getElement(CONSTANTS.SELECTORS.STATUS);
    if (!status) return;
    
    status.classList.add('hidden');
    status.classList.remove('pulse');
  }

  /**
   * Cleanup function to remove event listeners
   * @returns {void}
   */
  cleanup() {
    this.stopBackgroundTokenCheck();
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];
  }
}

// ============================================================================
// Initialization
// ============================================================================

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SmarTrackPopup();
  });
} else {
  // DOM already loaded
  new SmarTrackPopup();
}
