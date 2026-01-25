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
  DASHBOARD_URL: typeof SRT_CONFIG !== 'undefined' ? SRT_CONFIG.getDashboardUrl() : 'https://smar-track.vercel.app',
  TOKEN_CHECK_INTERVAL: 2000, // ms
  TOAST_DISPLAY_DURATION: 3000, // ms
  AUTO_CLOSE_DELAY: 2000, // ms
  SELECTED_TEXT_MIN_LENGTH: 20,
  
  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    TOKEN_EXPIRY: 'tokenExpiry',
    SETTINGS: 'settings',
    LAST_CATEGORY: 'lastCategory',
    CUSTOM_CATEGORIES: 'customCategories', // Track extension-created categories
    LAST_USAGE: 'lastUsage',
    LAST_INTERACTION: 'lastInteraction',
    EXTENSION_STATUS: 'extensionStatus'
  },
  
  // Default Categories
  DEFAULT_CATEGORIES: ['research', 'articles', 'tools', 'references'],
  
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
    FAVICON: 'favicon',
    THUMBNAIL: 'thumbnail',
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
 * Validates and sanitizes category name
 * @param {string} category - Raw category input
 * @returns {string|null} - Validated category name or null if invalid
 */
/**
 * Capitalizes the first letter of a category name
 * @param {string} category - Category name
 * @returns {string} Category with first letter capitalized
 */
const capitalizeCategoryName = (category) => {
  if (!category || typeof category !== 'string') return category;
  const trimmed = category.trim();
  if (trimmed.length === 0) return category;
  // Capitalize first letter, keep rest as-is (allows user overrides)
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

/**
 * Auto-capitalizes first letter when user types in category input
 * @param {string} value - Input value
 * @returns {string} Value with first letter capitalized (if applicable)
 */
const autoCapitalizeCategoryInput = (value) => {
  if (!value || value.length === 0) return value;
  // If first character is a lowercase letter, capitalize it
  // This allows users to override by typing uppercase manually
  if (value.length > 0 && /^[a-z]/.test(value)) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  return value;
};

const validateCategoryName = (category) => {
  if (!category || typeof category !== 'string') return null;
  
  const trimmed = category.trim();
  if (!trimmed || trimmed.length === 0) return null;
  
  // Length validation (max 30 characters)
  if (trimmed.length > 30) return null;
  
  // Character validation: alphanumeric, spaces, hyphens, underscores only
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) return null;
  
  // Reject reserved names
  const reserved = ['other', 'uncategorized', 'default'];
  if (reserved.includes(trimmed.toLowerCase())) return null;
  
  // Capitalize first letter by default, but store lowercase for consistency
  const capitalized = capitalizeCategoryName(trimmed);
  return capitalized.toLowerCase(); // Still store lowercase, but user sees capitalized
};

/**
 * Extracts user ID from JWT token
 * @param {string} token - JWT token
 * @returns {string|null} User ID or null if not found
 */
const extractUserIdFromToken = (token) => {
  if (!token || typeof token !== 'string') return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    // Auth0 typically uses 'sub' for user ID, but may also use 'user_id' or 'id'
    return payload.sub || payload.user_id || payload.id || null;
  } catch {
    return null;
  }
};

/**
 * Formats timestamp to readable string
 * @param {number|null} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted date string
 */
const formatTimestamp = (timestamp) => {
  if (!timestamp || typeof timestamp !== 'number') return 'Never';
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    // For older dates, show full date
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return 'Invalid date';
  }
};

/**
 * Gets extension version from manifest
 * @returns {string} Extension version
 */
const getExtensionVersion = () => {
  try {
    if (chrome.runtime?.getManifest) {
      return chrome.runtime.getManifest().version || 'Unknown';
    }
  } catch {
    // Fallback
  }
  return 'Unknown';
};

/**
 * Validates URL format and security
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    
    // Security: Only allow http and https protocols
    const allowedProtocols = ['http:', 'https:'];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return false;
    }
    
    // Security: Block dangerous protocols explicitly
    const dangerousProtocols = ['javascript:', 'data:', 'file:', 'vbscript:', 'about:'];
    const urlLower = url.toLowerCase();
    if (dangerousProtocols.some(proto => urlLower.startsWith(proto))) {
      return false;
    }
    
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

/**
 * Checks if a URL's hostname matches any of the allowed domains
 * Handles exact matches and subdomains (e.g., myblog.wordpress.com matches wordpress.com)
 * @param {string} url - URL to check
 * @param {string[]} allowedDomains - Array of allowed domain strings (e.g., ['wordpress.com', 'medium.com'])
 * @returns {boolean} True if hostname matches any allowed domain
 */
const isDomainMatch = (url, allowedDomains) => {
  if (!url || typeof url !== 'string' || !Array.isArray(allowedDomains) || allowedDomains.length === 0) {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check each allowed domain
    for (const domain of allowedDomains) {
      const normalizedDomain = domain.toLowerCase().trim();
      if (!normalizedDomain) continue;
      
      // Exact match
      if (hostname === normalizedDomain) {
        return true;
      }
      
      // Subdomain match (e.g., myblog.wordpress.com matches wordpress.com)
      // Check if hostname ends with '.' + domain
      if (hostname.endsWith('.' + normalizedDomain)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    // Invalid URL - return false (don't crash extension)
    console.debug('[SRT] Failed to parse URL for domain matching:', error);
    return false;
  }
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
      
      // Sync categories from backend if authenticated (non-blocking)
      if (token) {
        this.syncCategoriesFromBackend().catch(() => {
          // Silently fail - categories will use local storage
        });
      }
      
      if (!token) {
        this.showLoginView();
        this.startBackgroundTokenCheck();
      } else {
        await this.extractPageMetadata();
        await this.captureSelectedText();
        // Debug: Log pageData before populating UI
        console.log('[SRT] Page data before populateUI:', JSON.stringify(this.pageData, null, 2));
        this.populateUI();
        this.showMainView();
        // Track usage
        await this.trackUsage();
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
      let categories = Array.isArray(stored) && stored.length > 0
        ? stored
        : [...CONSTANTS.DEFAULT_CATEGORIES];
      
      // Filter out "other" if it exists (legacy cleanup)
      categories = categories.filter(cat => cat !== 'other');
      
      this.categories = categories.length > 0 ? categories : [...CONSTANTS.DEFAULT_CATEGORIES];
      this.lastCategory = result?.[CONSTANTS.STORAGE_KEYS.LAST_CATEGORY] || null;
      
      // If last category was "other", reset it
      if (this.lastCategory === 'other') {
        this.lastCategory = null;
      }
    } catch (error) {
      console.error('[SRT] Failed to load categories:', error);
      this.categories = [...CONSTANTS.DEFAULT_CATEGORIES];
      this.lastCategory = null;
    }
  }

  /**
   * Syncs categories from backend API
   * Uses backend as source of truth, only preserves extension-created custom categories
   * @async
   * @returns {Promise<void>}
   */
  async syncCategoriesFromBackend() {
    try {
      const api = new BackendApiService();
      const backendCategories = await api.getCategories();
      
      if (backendCategories.length === 0) {
        // If backend fetch failed, keep existing categories
        return;
      }
      
      // Get extension-created custom categories (tracked separately)
      const result = await chrome.storage.sync.get([
        CONSTANTS.STORAGE_KEYS.CUSTOM_CATEGORIES
      ]);
      const customCategories = result?.[CONSTANTS.STORAGE_KEYS.CUSTOM_CATEGORIES] || [];
      
      // Normalize backend categories for comparison
      const backendSet = new Set(backendCategories.map(c => c.toLowerCase()));
      
      // Only keep custom categories that aren't in backend (user-created in extension)
      const validCustomCategories = customCategories.filter(cat => {
        const normalized = cat.toLowerCase();
        return !backendSet.has(normalized) && normalized !== 'other';
      });
      
      // Clean up stored custom categories list (remove ones now in backend)
      if (validCustomCategories.length !== customCategories.length) {
        await chrome.storage.sync.set({
          [CONSTANTS.STORAGE_KEYS.CUSTOM_CATEGORIES]: validCustomCategories
        });
      }
      
      // Combine: backend categories (source of truth) + valid custom categories
      const mergedCategories = [...backendCategories, ...validCustomCategories];
      
      // Update if categories changed
      if (JSON.stringify(mergedCategories.sort()) !== JSON.stringify(this.categories.sort())) {
        this.categories = mergedCategories.length > 0 ? mergedCategories : [...CONSTANTS.DEFAULT_CATEGORIES];
        await this.saveCategories(this.categories);
        this.renderCategories();
      }
    } catch (error) {
      // Non-critical - silently fail and keep existing categories
      console.debug('[SRT] Failed to sync categories from backend:', error);
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
    // Security: Safe innerHTML usage - only clearing element, no user data inserted
    select.innerHTML = '';

    // Add stored categories
    this.categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = capitalize(category);
      select.appendChild(option);
    });

    // Determine selection: explicit > lastCategory > default
    const fallback = this.categories[0] || CONSTANTS.DEFAULT_CATEGORIES[0];
    const toSelect = selectedValue || this.lastCategory || fallback;
    select.value = this.categories.includes(toSelect) ? toSelect : fallback;
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
      
      // Script execution complete
      
      this.pageData = result?.result || this.getFallbackPageData();
      
      // Try to extract image from content script as fallback if no image found
      if (!this.pageData.image) {
        try {
          const fallbackData = await this.extractDataFromContentScript();
          if (fallbackData && fallbackData.image) {
            this.pageData = { ...this.pageData, ...fallbackData };
          }
        } catch (err) {
          // Silently continue - content script might not be available
          console.debug('[SRT] Content script image extraction failed:', err);
        }
      }
      
      // Fetch potential duplicates (best-effort, non-blocking)
      this.fetchDuplicates().catch(() => {
        // Silently fail - duplicates are not critical
      });
      
      // Override image with YouTube thumbnail when applicable (prioritize over og:image/generic icon)
      if (typeof isYoutubeUrl === 'function' && isYoutubeUrl(currentUrl) && typeof getYoutubeThumbnail === 'function') {
        const thumb = await getYoutubeThumbnail(currentUrl);
        if (thumb !== null) this.pageData.image = thumb;
      } else if (typeof isRedditUrl === 'function' && isRedditUrl(currentUrl) && typeof getRedditThumbnail === 'function') {
        const thumb = await getRedditThumbnail(currentUrl);
        if (thumb !== null) this.pageData.image = thumb;
      }
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
   * Extracts data using the content script (fallback method)
   * @async
   * @returns {Promise<Object|null>}
   */
  async extractDataFromContentScript() {
    if (!this.currentTab?.id) return null;
    
    return new Promise((resolve) => {
      try {
        chrome.tabs.sendMessage(
          this.currentTab.id,
          { type: 'EXTRACT_PAGE_DATA' },
          (response) => {
            if (chrome.runtime.lastError) {
              // Content script might not be loaded yet
              resolve(null);
              return;
            }
            resolve(response && response.success ? response.data : null);
          }
        );
      } catch (error) {
        console.debug('[SRT] Failed to send message to content script:', error);
        resolve(null);
      }
    });
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
    const url = window.location.href;
    
    // Improved title extraction - prioritize H1, then og:title, then document.title
    const getBestTitle = () => {
      // Try H1 first (most accurate for articles)
      const h1 = document.querySelector('h1');
      if (h1 && h1.textContent.trim()) {
        return h1.textContent.trim();
      }
      
      // Try og:title (social media optimized)
      const ogTitle = getMetaContent('og:title');
      if (ogTitle && ogTitle.trim()) {
        return ogTitle.trim();
      }
      
      // Fallback to document.title but clean it up
      let docTitle = document.title || '';
      // Remove common suffixes like " - Site Name"
      docTitle = docTitle.replace(/\s*[-|–|—]\s*[^-|–|—]+$/, '').trim();
      return docTitle;
    };
    
    const title = getBestTitle();
    
    // Improved description extraction - prioritize meta descriptions, then article content
    const getBestDescription = () => {
      // Try meta descriptions first (usually well-crafted)
      const metaDesc = getMetaContent('description') ||
                      getMetaContent('og:description') ||
                      getMetaContent('twitter:description');
      
      if (metaDesc && metaDesc.trim().length > 20) {
        return metaDesc.trim();
      }
      
      // Try article tag content (structured content)
      const article = document.querySelector('article');
      if (article) {
        // Get first few paragraphs from article
        const paragraphs = article.querySelectorAll('p');
        for (const p of paragraphs) {
          const text = p.textContent.trim();
          if (text.length > 50 && text.length < 300) {
            return text;
          }
        }
        // If no good paragraph, get first 200 chars of article text
        const articleText = article.textContent.trim();
        if (articleText.length > 50) {
          return articleText.substring(0, 250).replace(/\s+/g, ' ').trim();
        }
      }
      
      // Try main content area
      const main = document.querySelector('main');
      if (main) {
        const paragraphs = main.querySelectorAll('p');
        for (const p of paragraphs) {
          const text = p.textContent.trim();
          if (text.length > 50 && text.length < 300) {
            return text;
          }
        }
      }
      
      // Fallback: get first meaningful paragraph from body
      const paragraphs = document.querySelectorAll('body p');
      for (const p of paragraphs) {
        const text = p.textContent.trim();
        // Skip very short or very long paragraphs
        if (text.length > 50 && text.length < 400) {
          // Skip navigation/header/footer content
          if (!p.closest('nav, header, footer, aside')) {
            return text.substring(0, 250).trim();
          }
        }
      }
      
      return '';
    };
    
    const description = getBestDescription();
    
    // Extract image and convert to absolute URL
    const getImageUrl = () => {
      // Try meta tags first (og:image, twitter:image)
      // Check multiple variations to catch all cases
      let imageMeta = getMetaContent('og:image') || 
                      getMetaContent('og:image:url') ||
                      getMetaContent('og:image:secure_url') ||
                      getMetaContent('twitter:image') ||
                      getMetaContent('twitter:image:src') ||
                      getMetaContent('image') ||
                      getMetaContent('thumbnail');
      
      // If no meta tag, try to find first large image on page
      if (!imageMeta) {
        try {
          // Check for lazy-loaded images (data-src, data-lazy-src, etc.) - common on Medium
          const lazyImages = Array.from(document.querySelectorAll('img[data-src], img[data-lazy-src], img[data-original]'));
          for (const img of lazyImages) {
            const lazySrc = img.getAttribute('data-src') || 
                          img.getAttribute('data-lazy-src') || 
                          img.getAttribute('data-original');
            if (lazySrc && !lazySrc.startsWith('data:image/gif') && !lazySrc.includes('1x1')) {
              const width = img.naturalWidth || img.width || img.offsetWidth || 0;
              const height = img.naturalHeight || img.height || img.offsetHeight || 0;
              // Accept smaller images from lazy loading (they might not have loaded dimensions yet)
              if (width >= 100 || height >= 100 || (width === 0 && height === 0)) {
                imageMeta = lazySrc;
                break;
              }
            }
          }
          
          // If still no image, check regular img tags
          if (!imageMeta) {
            const images = Array.from(document.querySelectorAll('img[src]'));
            
            // Sort by size (prefer larger images)
            const imageCandidates = images.map(img => {
              const src = img.getAttribute('src');
              if (!src || src.startsWith('data:image/gif') || src.includes('1x1')) return null;
              
              // Try to get actual dimensions
              const width = img.naturalWidth || img.width || img.offsetWidth || 0;
              const height = img.naturalHeight || img.height || img.offsetHeight || 0;
              const area = width * height;
              
              return { src, width, height, area };
            }).filter(img => img && img.src);
            
            // Sort by area (largest first)
            imageCandidates.sort((a, b) => b.area - a.area);
            
            // Prefer images that are at least 200x200 pixels
            const largeImage = imageCandidates.find(img => img.width >= 200 && img.height >= 200);
            if (largeImage) {
              imageMeta = largeImage.src;
            } else if (imageCandidates.length > 0) {
              // Use largest available image
              imageMeta = imageCandidates[0].src;
            }
          }
          
          // For Medium specifically, check article header images and specific selectors
          if (!imageMeta && isDomainMatch(url, ['medium.com'])) {
            try {
              // Medium often uses figure or picture elements in article
              const articleFigure = document.querySelector('article figure img, article picture img, article img');
              if (articleFigure) {
                const src = articleFigure.getAttribute('src') || 
                           articleFigure.getAttribute('data-src') ||
                           articleFigure.getAttribute('data-lazy-src');
                if (src && !src.startsWith('data:image/gif') && !src.includes('1x1')) {
                  imageMeta = src;
                }
              }
              
              // Check for Medium's header image (often in the first section)
              if (!imageMeta) {
                const firstSection = document.querySelector('article section, article > div');
                if (firstSection) {
                  const sectionImg = firstSection.querySelector('img');
                  if (sectionImg) {
                    const src = sectionImg.getAttribute('src') || 
                               sectionImg.getAttribute('data-src');
                    if (src && !src.startsWith('data:image/gif') && !src.includes('1x1')) {
                      imageMeta = src;
                    }
                  }
                }
              }
            } catch (e) {
              // Silently continue
            }
          }
        } catch (e) {
          console.error('[SRT] Error finding images on page:', e);
        }
      }
      
      if (!imageMeta) return null;
      
      // Convert relative URLs to absolute
      try {
        // If already absolute URL, return as is
        if (imageMeta.startsWith('http://') || imageMeta.startsWith('https://')) {
          return imageMeta;
        }
        // Handle protocol-relative URLs (//example.com/image.jpg)
        if (imageMeta.startsWith('//')) {
          return window.location.protocol + imageMeta;
        }
        // Handle data URLs
        if (imageMeta.startsWith('data:')) {
          return imageMeta;
        }
        // Convert relative URL to absolute
        return new URL(imageMeta, window.location.origin).href;
      } catch (e) {
        // If URL construction fails, try to prepend origin
        if (imageMeta.startsWith('//')) {
          return window.location.protocol + imageMeta;
        }
        console.error('[SRT] Failed to convert image URL:', imageMeta, e);
        return imageMeta; // Return as-is if conversion fails
      }
    };
    
    const image = getImageUrl();
    const favicon = getFaviconUrl();

    // Image extraction complete (debug logging removed to reduce noise)

    // Detect content type
    const detectContentType = () => {
      const urlLower = url.toLowerCase();
      
      // PDF files
      if (urlLower.includes('.pdf') || urlLower.endsWith('.pdf')) return 'pdf';
      
      // Video platforms
      if (isDomainMatch(url, ['youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com', 'twitch.tv'])) {
        return 'video';
      }
      
      // Image files
      if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/)) return 'image';
      
      // Documents
      if (urlLower.match(/\.(doc|docx|xls|xlsx|ppt|pptx|txt|rtf)$/)) return 'document';
      
      // Academic/Research articles and discussion (Reddit)
      if (isDomainMatch(url, ['arxiv.org', 'scholar.google.com', 'pubmed.ncbi.nlm.nih.gov', 'researchgate.net', 'reddit.com'])) {
        return 'article';
      }
      
      // Blog detection
      const ogType = getMetaContent('og:type');
      if (ogType === 'article') {
        // Check if it's a blog post
        if (urlLower.includes('/blog/') ||
            urlLower.includes('/post/') ||
            isDomainMatch(url, ['medium.com', 'wordpress.com', 'blogspot.com']) ||
            document.querySelector('[itemtype*="BlogPosting"]')) {
          return 'blog';
        }
        return 'article';
      }
      
      // Check for article/blog structure
      if (document.querySelector('article')) {
        if (urlLower.match(/\/(blog|post|article|news)\//) ||
            isDomainMatch(url, ['medium.com', 'wordpress.com', 'blogspot.com', 'tumblr.com'])) {
          return 'blog';
        }
      }
      
      // Default to website
      return 'website';
    };

    return {
      title: title || 'Untitled',
      url: url || '',
      description: description || '',
      image: image || null,
      favicon: favicon || null,
      selectedText: selectedText || '',
      contentType: detectContentType()
    };
  }

  /**
   * Gets fallback page data from tab information
   * @returns {Object} Fallback page data
   */
  getFallbackPageData() {
    const url = this.currentTab?.url || '';
    return {
      title: this.currentTab?.title || 'Untitled',
      url: url,
      description: '',
      favicon: null,
      selectedText: '',
      image: null,
      contentType: this.detectContentType(url)
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
      // Use debug level to avoid console noise for expected network failures
      console.debug('[SRT] Duplicate search failed (non-critical):', error.message || error);
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
    // Security: Safe innerHTML usage - only clearing element, no user data inserted
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
    const thumbnailEl = getElement(CONSTANTS.SELECTORS.THUMBNAIL);
    const titleInput = getElement(CONSTANTS.SELECTORS.TITLE_INPUT);
    const descriptionInput = getElement(CONSTANTS.SELECTORS.DESCRIPTION_INPUT);
    
    const title = this.pageData.title || this.currentTab?.title || 'Untitled';
    const url = this.pageData.url || this.currentTab?.url || '';
    
    // Check if this is a system URL
    const isSystemPage = isSystemUrl(url);
    
    // Truncate title if too long (max 60 chars for preview)
    const displayTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;
    if (titleEl) {
      titleEl.textContent = displayTitle;
      titleEl.setAttribute('title', title); // Full title in tooltip
    }
    
    if (urlEl) {
      urlEl.textContent = url;
      urlEl.setAttribute('title', url); // Tooltip for long URLs
    }
    
    // Display content type badge
    const contentTypeBadge = getElement('contentTypeBadge');
    if (contentTypeBadge) {
      if (isSystemPage) {
        contentTypeBadge.textContent = 'SYSTEM';
        contentTypeBadge.setAttribute('data-type', 'website');
        contentTypeBadge.style.display = 'inline-block';
      } else {
        const contentType = this.pageData.contentType || this.detectContentType(url);
        if (contentType) {
          contentTypeBadge.textContent = contentType.toUpperCase();
          contentTypeBadge.setAttribute('data-type', contentType);
          contentTypeBadge.style.display = 'inline-block';
        } else {
          contentTypeBadge.style.display = 'none';
        }
      }
    }
    
    // Set thumbnail image (if available)
    if (thumbnailEl) {
      // Debug logging removed to reduce console noise
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup.js:985',message:'populateUI thumbnail section entry',data:{hasImage:!!this.pageData.image,imageUrl:this.pageData.image,thumbnailElExists:!!thumbnailEl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      if (this.pageData.image) {
        try {
          let imageUrl = this.pageData.image;
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup.js:992',message:'Before URL conversion',data:{originalUrl:imageUrl,isAbsolute:imageUrl.startsWith('http://')||imageUrl.startsWith('https://')||imageUrl.startsWith('data:')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          
          // Ensure absolute URL
          if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('data:')) {
            try {
              imageUrl = new URL(imageUrl, url).href;
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup.js:996',message:'URL converted to absolute',data:{convertedUrl:imageUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
              // #endregion
            } catch (e) {
              console.error('[SRT] Failed to convert image URL to absolute:', e);
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup.js:998',message:'URL conversion failed',data:{error:e?.message,errorType:typeof e},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
            }
          }
          
          // Image URL ready for thumbnail
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup.js:1002',message:'About to create img element',data:{finalImageUrl:imageUrl,urlLength:imageUrl?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          
          // Clear any existing content
          // Security: Safe innerHTML usage - only clearing element, no user data inserted
          thumbnailEl.innerHTML = '';
          
          // Show thumbnail immediately (don't wait for image to load)
          thumbnailEl.classList.add('has-image');
          
          // Set thumbnail container styles first
          thumbnailEl.style.cssText = `
            width: 96px;
            height: 96px;
            background: #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            display: block;
            flex-shrink: 0;
          `;
          
          // Create and configure image element
          const img = document.createElement('img');
          img.src = imageUrl;
          img.alt = 'Page thumbnail';
          img.referrerPolicy = 'no-referrer';
          img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          `;
          
          img.onerror = () => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup.js:1051',message:'img.onerror triggered',data:{imageUrl:imageUrl,imgSrc:img.src,imgComplete:img.complete,imgNaturalWidth:img.naturalWidth,imgNaturalHeight:img.naturalHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            // Image failed to load (CORS, 404, invalid format, etc.)
            // Silently handle - this is expected behavior for many images
            // Do NOT log to console to avoid noise - gracefully fall back to favicon
            thumbnailEl.classList.remove('has-image');
            thumbnailEl.style.display = 'none';
            // Security: Safe innerHTML usage - only clearing element, no user data inserted
            thumbnailEl.innerHTML = '';
            
            // Show favicon as fallback when thumbnail fails
            if (faviconEl) {
              faviconEl.style.display = 'block';
            }
          };
          
          img.onload = () => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup.js:1047',message:'img.onload triggered',data:{imageUrl:imageUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            // Thumbnail image loaded successfully
            // Image loaded, ensure it's visible
            thumbnailEl.classList.add('has-image');
            thumbnailEl.style.display = 'block';
            
            // Hide favicon when thumbnail is present
            if (faviconEl) {
              faviconEl.style.display = 'none';
            }
          };
          
          thumbnailEl.appendChild(img);
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup.js:1059',message:'img element appended to DOM',data:{imageUrl:imageUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          
        } catch (error) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup.js:1061',message:'catch block triggered',data:{errorMessage:error?.message,errorType:typeof error,errorName:error?.name,hasStack:!!error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          console.error('[SRT] Failed to set thumbnail:', error, error.stack);
          thumbnailEl.classList.remove('has-image');
          thumbnailEl.style.display = 'none';
        }
      } else {
        // No image available - gracefully hide thumbnail
        thumbnailEl.classList.remove('has-image');
        thumbnailEl.style.display = 'none';
        // Security: Safe innerHTML usage - only clearing element, no user data inserted
        thumbnailEl.innerHTML = '';
      }
    } else {
      console.error('[SRT] Thumbnail element not found!');
    }
    
    // Set favicon
    if (faviconEl && this.pageData.favicon) {
      try {
        const faviconUrl = this.pageData.favicon.startsWith('http')
          ? this.pageData.favicon
          : new URL(this.pageData.favicon, url).href;
        
        faviconEl.style.cssText = `
          width: 96px;
          height: 96px;
          border-radius: 12px;
          background-image: url(${faviconUrl});
          background-size: cover;
          background-position: center;
          background-color: #e2e8f0;
          display: block;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border: 2px solid #ffffff;
        `;
      } catch (error) {
        console.error('[SRT] Failed to set favicon:', error);
      }
    }
    
    // Auto-fill form inputs with cleaned title
    if (titleInput) {
      // Clean title: remove extra whitespace, normalize, and limit length
      let cleanedTitle = title
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .trim();
      
      // Only remove site suffix if it follows this specific pattern: " - SiteName" or " | SiteName" at the END
      // This regex matches: space + (dash/pipe/em-dash) + space + word(s) at the very end
      // BUT only if there are NO other dashes before it (to avoid removing meaningful dashes like "AI-powered")
      const suffixMatch = cleanedTitle.match(/^(.+?)\s+[-|–|—]\s+([A-Z][A-Za-z0-9\s&.]+)$/);
      if (suffixMatch) {
        const mainPart = suffixMatch[1].trim();
        const suffixPart = suffixMatch[2].trim();
        
        // Only remove if suffix looks like a site name (short, capitalized, no punctuation except &.)
        // and main part is substantial
        if (mainPart.length > 20 && suffixPart.length < 30 && !suffixPart.includes(',')) {
          cleanedTitle = mainPart;
        }
      }
      
      // Limit to 70 chars for better UX in popup (user can edit if needed)
      if (cleanedTitle.length > 70) {
        cleanedTitle = cleanedTitle.substring(0, 67) + '...';
      }
      
      titleInput.value = cleanedTitle;
    }
    
    // Only auto-fill description if meaningful content exists
    if (descriptionInput && this.pageData.description) {
      // Clean description: remove extra whitespace and normalize
      let description = this.pageData.description
        .replace(/\s+/g, ' ')  // Replace multiple spaces/newlines with single space
        .replace(/\n\s*\n/g, '\n')  // Remove multiple newlines
        .trim();
      
      // Limit to reasonable length (500 chars for description field)
      if (description.length > 500) {
        description = description.substring(0, 497) + '...';
      }
      
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
    this.setupStorageListener();
  }

  /**
   * Sets up storage change listener to detect token updates and category sync needs
   * @returns {void}
   */
  setupStorageListener() {
    const handleStorageChange = (changes, namespace) => {
      if (namespace === 'local') {
        // Handle token updates
        if (changes[CONSTANTS.STORAGE_KEYS.AUTH_TOKEN]) {
          const newToken = changes[CONSTANTS.STORAGE_KEYS.AUTH_TOKEN].newValue;
          if (newToken) {
            console.log('[SRT] Token detected in storage, reloading popup...');
            // If we're showing login view and token appears, reload to show main view
            const loginView = getElement(CONSTANTS.SELECTORS.LOGIN_VIEW);
            if (loginView && !loginView.classList.contains('hidden')) {
              location.reload();
            }
          }
        }
        
        // Handle category sync trigger
        if (changes.categoriesSyncNeeded && changes.categoriesSyncNeeded.newValue === true) {
          // Sync categories from backend when dashboard visit is detected
          this.syncCategoriesFromBackend().catch(() => {
            // Silently fail
          });
          // Clear the flag
          chrome.storage.local.set({ categoriesSyncNeeded: false }).catch(() => {});
        }
      }
    };
    
    chrome.storage.onChanged.addListener(handleStorageChange);
    this.cleanupFunctions.push(() => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    });
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
    const addCategoryBtn = getElement(CONSTANTS.SELECTORS.ADD_CATEGORY_BTN);
    const categorySelect = getElement(CONSTANTS.SELECTORS.CATEGORY_SELECT);
    const saveCustomCategoryBtn = getElement(CONSTANTS.SELECTORS.SAVE_CUSTOM_CATEGORY_BTN);
    const cancelCustomCategoryBtn = document.getElementById('cancelCustomCategoryBtn');
    const customCategoryInput = getElement(CONSTANTS.SELECTORS.CUSTOM_CATEGORY_INPUT);
    const customCategoryRow = getElement(CONSTANTS.SELECTORS.CUSTOM_CATEGORY_ROW);

    // Handle add button click
    if (addCategoryBtn && customCategoryRow && customCategoryInput) {
      const handleAddClick = () => {
        customCategoryRow.classList.toggle('hidden');
        if (!customCategoryRow.classList.contains('hidden')) {
          customCategoryInput.focus();
        }
      };
      addCategoryBtn.addEventListener('click', handleAddClick);
      this.cleanupFunctions.push(() => {
        addCategoryBtn.removeEventListener('click', handleAddClick);
      });
    }

    // Handle category select change
    if (categorySelect) {
      const handleCategoryChange = () => {
        if (categorySelect.value) {
          this.saveLastCategory(categorySelect.value);
        }
      };
      categorySelect.addEventListener('change', handleCategoryChange);
      this.cleanupFunctions.push(() => {
        categorySelect.removeEventListener('change', handleCategoryChange);
      });
    }
    
    // Handle save custom category
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
        if (e.key === 'Escape') {
          e.preventDefault();
          if (customCategoryRow) {
            customCategoryRow.classList.add('hidden');
            customCategoryInput.value = '';
          }
        }
      };
      customCategoryInput.addEventListener('keydown', handleCustomCategoryKeyPress);
      
      // Auto-capitalize first letter as user types
      const handleInput = (e) => {
        const value = e.target.value;
        if (value.length > 0 && /^[a-z]/.test(value)) {
          const capitalized = autoCapitalizeCategoryInput(value);
          if (capitalized !== value) {
            e.target.value = capitalized;
          }
        }
      };
      customCategoryInput.addEventListener('input', handleInput);
      
      this.cleanupFunctions.push(() => {
        saveCustomCategoryBtn.removeEventListener('click', handleSaveCustomCategory);
        customCategoryInput.removeEventListener('keydown', handleCustomCategoryKeyPress);
        customCategoryInput.removeEventListener('input', handleInput);
      });
    }

    // Cancel button
    if (cancelCustomCategoryBtn && customCategoryRow && customCategoryInput) {
      const handleCancel = () => {
        customCategoryRow.classList.add('hidden');
        customCategoryInput.value = '';
      };
      cancelCustomCategoryBtn.addEventListener('click', handleCancel);
      this.cleanupFunctions.push(() => {
        cancelCustomCategoryBtn.removeEventListener('click', handleCancel);
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
    
    // Validate and sanitize category name
    const validatedCategory = validateCategoryName(input.value);
    if (!validatedCategory) {
      // Invalid category name - show error and return
      this.showStatus('Invalid category name. Use letters, numbers, spaces, hyphens, or underscores (max 30 chars).', 'error');
      return;
    }
    
    // Add to categories if not already present (but keep "other" out of the saved list)
    if (!this.categories.includes(validatedCategory) && validatedCategory !== 'other') {
      const updatedCategories = [...this.categories, validatedCategory];
      await this.saveCategories(updatedCategories);
      
      // Track this as an extension-created custom category
      await this.addCustomCategory(validatedCategory);
    }
    
    // Select the new category and update UI
    this.renderCategories(validatedCategory);
    await this.saveLastCategory(validatedCategory);
    
    // Clear and hide the custom input
    input.value = '';
    this.showCustomCategoryRow(false);
  }

  /**
   * Adds a category to the tracked custom categories list
   * @async
   * @param {string} category - Category name to track
   * @returns {Promise<void>}
   */
  async addCustomCategory(category) {
    try {
      const result = await chrome.storage.sync.get([CONSTANTS.STORAGE_KEYS.CUSTOM_CATEGORIES]);
      const customCategories = result?.[CONSTANTS.STORAGE_KEYS.CUSTOM_CATEGORIES] || [];
      
      const normalized = category.toLowerCase();
      if (!customCategories.includes(normalized)) {
        customCategories.push(normalized);
        await chrome.storage.sync.set({
          [CONSTANTS.STORAGE_KEYS.CUSTOM_CATEGORIES]: customCategories
        });
      }
    } catch (error) {
      console.error('[SRT] Failed to track custom category:', error);
    }
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
          console.log('[SRT] Token found during background check, ensuring persistence...');
          // Ensure token is saved to chrome.storage.local
          const expiry = this.getTokenExpiry(token);
          await chrome.storage.local.set({
            [CONSTANTS.STORAGE_KEYS.AUTH_TOKEN]: token,
            [CONSTANTS.STORAGE_KEYS.TOKEN_EXPIRY]: expiry
          });
          console.log('[SRT] Token persisted to chrome.storage.local');
          
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
      
      // Track interaction
      await this.trackInteraction();
      
      // Success - show toast only (no duplicate Chrome notification)
      document.body.classList.add('toast-only');
      this.showToast('Link saved to SmarTrack', 'success');
      
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
      document.body.classList.add('toast-only');
      this.showToast('Link already saved', 'error');
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
      
      if (select?.value) {
        category = select.value;
      }
    } catch (error) {
      console.error('[SRT] Failed to get category:', error);
    }
    
    const titleInput = getElement(CONSTANTS.SELECTORS.TITLE_INPUT);
    const descriptionInput = getElement(CONSTANTS.SELECTORS.DESCRIPTION_INPUT);
    
    // Use detected content type from pageData, or detect it if not available
    const contentType = this.pageData.contentType || this.detectContentType(url);
    
    return {
      url: url,
      title: sanitizeString(titleInput?.value || '', 200),
      description: sanitizeString(descriptionInput?.value || '', 1000),
      content: sanitizeString(content, 5000),
      category: category,
      tags: [], // Tags removed for better UX - can be added later in dashboard
      contentType: contentType,
      thumbnail: this.pageData.image || null,
      favicon: this.pageData.favicon || null,
      isFavorite: false,
      isArchived: false
    };
  }

  /**
   * Detects content type from URL and page structure
   * @param {string} url - URL to analyze
   * @returns {string} Content type
   */
  detectContentType(url) {
    if (!url || typeof url !== 'string') return 'website';
    
    const urlLower = url.toLowerCase();
    
    // PDF files
    if (urlLower.includes('.pdf') || urlLower.endsWith('.pdf')) return 'pdf';
    
    // Video platforms
    if (isDomainMatch(url, ['youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com', 'twitch.tv'])) {
      return 'video';
    }
    
    // Image files
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/)) return 'image';
    
    // Documents
    if (urlLower.match(/\.(doc|docx|xls|xlsx|ppt|pptx|txt|rtf)$/)) return 'document';
    
    // Academic/Research articles
    if (isDomainMatch(url, ['arxiv.org', 'scholar.google.com', 'pubmed.ncbi.nlm.nih.gov', 'researchgate.net', 'reddit.com'])) {
      return 'article';
    }
    
    // Blog detection - check for common blog patterns
    try {
      // Check for article tag (common in blogs)
      if (document.querySelector('article')) {
        // Check for blog-specific meta tags
        const isBlog = getMetaContent('og:type') === 'article' ||
                      document.querySelector('[itemtype*="BlogPosting"]') ||
                      document.querySelector('[itemtype*="Article"]') ||
                      urlLower.includes('/blog/') ||
                      urlLower.includes('/post/') ||
                      urlLower.includes('/article/');
        
        if (isBlog) {
          return 'blog';
        }
      }
      
      // Check URL patterns for blogs
      if (urlLower.match(/\/(blog|post|article|news)\//) ||
          isDomainMatch(url, ['medium.com', 'wordpress.com', 'blogspot.com', 'tumblr.com'])) {
        return 'blog';
      }
    } catch (e) {
      // If we can't check DOM, just use URL
    }
    
    // Default to website
    return 'website';
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
      
      // Track extension usage when link is saved
      this.trackUsageOnBackend('link_saved').catch((error) => {
        console.debug('[SRT] Failed to track link save usage:', error);
      });
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
      // Try Chrome storage first (most reliable)
      const result = await chrome.storage.local.get([
        CONSTANTS.STORAGE_KEYS.AUTH_TOKEN,
        CONSTANTS.STORAGE_KEYS.TOKEN_EXPIRY
      ]);
      
      const storedToken = result[CONSTANTS.STORAGE_KEYS.AUTH_TOKEN];
      if (storedToken) {
        // Check if token is still valid (with 5 minute buffer)
        if (this.isTokenValid(result[CONSTANTS.STORAGE_KEYS.TOKEN_EXPIRY], storedToken)) {
          console.log('[SRT] Using stored token from chrome.storage.local');
          return storedToken;
        } else {
          console.log('[SRT] Stored token expired, clearing...');
          // Token expired, clear it
          await chrome.storage.local.remove([
            CONSTANTS.STORAGE_KEYS.AUTH_TOKEN,
            CONSTANTS.STORAGE_KEYS.TOKEN_EXPIRY
          ]);
        }
      }
      
      // Try to get from current page localStorage (if on SmarTrack dashboard)
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
            console.log('[SRT] Found token in page localStorage, saving to chrome.storage...');
            const expiry = this.getTokenExpiry(token);
            await chrome.storage.local.set({
              [CONSTANTS.STORAGE_KEYS.AUTH_TOKEN]: token,
              [CONSTANTS.STORAGE_KEYS.TOKEN_EXPIRY]: expiry
            });
            return token;
          }
        } catch (error) {
          // Not a problem - page might not allow script injection
          console.debug('[SRT] Could not get token from page (not on SmarTrack dashboard?):', error.message);
        }
      }
      
      // Try message passing via content script (works on any page)
      try {
        const token = await this.requestTokenViaMessage();
        if (token && this.isTokenValid(null, token)) {
          console.log('[SRT] Found token via message passing, saving to chrome.storage...');
          const expiry = this.getTokenExpiry(token);
          await chrome.storage.local.set({
            [CONSTANTS.STORAGE_KEYS.AUTH_TOKEN]: token,
            [CONSTANTS.STORAGE_KEYS.TOKEN_EXPIRY]: expiry
          });
          return token;
        }
      } catch (error) {
        console.debug('[SRT] Message passing failed:', error.message);
      }
      
      console.log('[SRT] No valid token found');
      return null;
    } catch (error) {
      console.error('[SRT] Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Requests token via message passing (content script)
   * @async
   * @returns {Promise<string|null>}
   */
  async requestTokenViaMessage() {
    if (!this.currentTab?.id) {
      return null;
    }

    const messageId = `get-token-${Date.now()}`;

    // 1. Try Content Script Message
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(
          this.currentTab.id,
          {
            type: 'SRT_REQUEST_AUTH_TOKEN',
            messageId: messageId
          },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          }
        );
      });

      if (response?.token) {
        return response.token;
      }
    } catch (e) {
      // Content script might not be loaded or page is restricted
      console.debug('[SRT] Content script message failed:', e.message);
    }

    // 2. Fallback: Direct Script Injection (reads localStorage if on Dashboard)
    try {
      // Check if URL is a system URL (cannot inject scripts)
      const currentUrl = this.currentTab.url || '';
      if (isSystemUrl(currentUrl)) {
        console.debug('[SRT] Cannot inject script into system URL');
        return null;
      }

      const [result] = await chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        func: () => {
          try {
            return localStorage.getItem('authToken');
          } catch {
            return null;
          }
        }
      });

      return result?.result || null;
    } catch (e) {
      console.debug('[SRT] Script injection failed:', e.message);
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
    // Buffer time: consider token valid if it expires within 5 minutes (gives time for refresh)
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Check stored expiry (with buffer)
    if (expiry && typeof expiry === 'number') {
      if (expiry > (Date.now() + bufferTime)) {
        return true;
      }
    }
    
    // Decode token to check expiry (with buffer)
    if (token && typeof token === 'string') {
      try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        
        const payload = JSON.parse(atob(parts[1]));
        const expiryTime = payload.exp * 1000; // Convert to milliseconds
        // Token is valid if it expires more than 5 minutes from now
        return expiryTime > (Date.now() + bufferTime);
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
   * Tracks extension usage (when popup is opened)
   * @async
   * @returns {Promise<void>}
   */
  async trackUsage() {
    try {
      const now = Date.now();
      // Store locally for extension settings page
      await chrome.storage.local.set({
        [CONSTANTS.STORAGE_KEYS.LAST_USAGE]: now,
        [CONSTANTS.STORAGE_KEYS.EXTENSION_STATUS]: 'active'
      });
      
      // Also track usage on backend for accurate analytics (non-blocking)
      this.trackUsageOnBackend().catch((error) => {
        // Silently fail - analytics tracking shouldn't break extension functionality
        console.debug('[SRT] Failed to track usage on backend:', error);
      });
    } catch (error) {
      console.debug('[SRT] Failed to track usage:', error);
    }
  }

  /**
   * Tracks extension usage on backend API
   * @async
   * @param {string} eventType - Type of event ('popup_open', 'link_saved', etc.)
   * @returns {Promise<void>}
   */
  async trackUsageOnBackend(eventType = 'popup_open') {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return; // Not authenticated, skip tracking
      }
      
      const extensionVersion = getExtensionVersion();
      const backendApi = new BackendApiService();
      
      // Track extension usage event (non-blocking - don't wait for response)
      await backendApi.makeRequest('/api/extension/usage', {
        method: 'POST',
        body: JSON.stringify({
          extensionVersion: extensionVersion !== 'Unknown' ? extensionVersion : null,
          eventType: eventType
        })
      });
    } catch (error) {
      // Silently fail - analytics tracking shouldn't break extension functionality
      console.debug('[SRT] Failed to track usage on backend:', error);
    }
  }

  /**
   * Tracks user interaction (when link is saved or form is interacted with)
   * @async
   * @returns {Promise<void>}
   */
  async trackInteraction() {
    try {
      const now = Date.now();
      await chrome.storage.local.set({
        [CONSTANTS.STORAGE_KEYS.LAST_INTERACTION]: now,
        [CONSTANTS.STORAGE_KEYS.LAST_USAGE]: now,
        [CONSTANTS.STORAGE_KEYS.EXTENSION_STATUS]: 'active'
      });
    } catch (error) {
      console.debug('[SRT] Failed to track interaction:', error);
    }
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

