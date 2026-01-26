/**
 * Backend API Service for Chrome Extension
 * Connects extension to Python FastAPI backend
 * 
 * @fileoverview API service for making authenticated requests to the SmarTrack backend
 * @version 2.0.0
 */

// ============================================================================
// Constants
// ============================================================================

const API_CONSTANTS = {
  BASE_URL: typeof SRT_CONFIG !== 'undefined' ? SRT_CONFIG.getApiBaseUrl() : 'https://smartrack-back.onrender.com',
  HEALTH_ENDPOINT: '/api/health',
  LINKS_ENDPOINT: '/api/links',
  USER_STATS_ENDPOINT: '/api/users/stats',
  TOKEN_REQUEST_TIMEOUT: 5000, // ms
  STORAGE_KEY: 'authToken',
  DEFAULT_CATEGORY: 'research',
  DEFAULT_CONTENT_TYPE: 'webpage'
};

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Custom error for authentication failures
 */
class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Custom error for network failures
 */
class NetworkError extends Error {
  constructor(message = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Custom error for API failures
 */
class ApiError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ============================================================================
// Backend API Service
// ============================================================================

/**
 * Backend API Service
 * Handles all communication with the SmarTrack backend API
 */
class BackendApiService {
  /**
   * Creates a new BackendApiService instance
   */
  constructor() {
    /** @type {string} */
    this.baseUrl = API_CONSTANTS.BASE_URL;
    
    /** @type {string|null} */
    this.authToken = null;
    
    /** @type {Map<string, AbortController>} */
    this.activeRequests = new Map();
  }

  /**
   * Gets Auth0 token from extension storage or requests from frontend
   * @async
   * @returns {Promise<string>}
   * @throws {AuthenticationError}
   */
  async getAuthToken() {
    if (this.authToken) {
      return this.authToken;
    }

    try {
      // Try to get token from extension storage
      const result = await chrome.storage.local.get([API_CONSTANTS.STORAGE_KEY]);
      
      if (result[API_CONSTANTS.STORAGE_KEY]) {
        this.authToken = result[API_CONSTANTS.STORAGE_KEY];
        return this.authToken;
      }

      // If no token in storage, request from frontend
      return await this.requestTokenFromFrontend();
    } catch (error) {
      console.error('[SRT] Failed to get auth token:', error);
      throw new AuthenticationError('Authentication required');
    }
  }

  /**
   * Requests token from frontend via message passing
   * @async
   * @returns {Promise<string>}
   * @throws {AuthenticationError}
   */
  async requestTokenFromFrontend() {
    return new Promise((resolve, reject) => {
      const messageId = `get-token-${Date.now()}-${Math.random()}`;
      
      const handleResponse = (event) => {
        if (!event.data) return;
        
        const { type, messageId: responseId, token } = event.data;
        
        if (type === 'SRT_AUTH_TOKEN_RESPONSE' && responseId === messageId) {
          cleanup();
          
          if (token && typeof token === 'string') {
            this.authToken = token;
            // Store token for future use
            chrome.storage.local.set({ [API_CONSTANTS.STORAGE_KEY]: token }).catch(() => {
              // Non-critical, continue
            });
            resolve(token);
          } else {
            reject(new AuthenticationError('No auth token received'));
          }
        }
      };

      const timeout = setTimeout(() => {
        cleanup();
        reject(new AuthenticationError('Token request timeout'));
      }, API_CONSTANTS.TOKEN_REQUEST_TIMEOUT);

      const cleanup = () => {
        window.removeEventListener('message', handleResponse);
        clearTimeout(timeout);
      };

      window.addEventListener('message', handleResponse);
      
      // Request token from frontend
      // Security: Only send to whitelisted dashboard origins
      const ALLOWED_DASHBOARD_ORIGINS = [
        'https://smar-track.vercel.app',
        'https://smartracker.vercel.app',
        'https://smartrack.vercel.app',
        'http://localhost'
      ];
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].url) {
          try {
            const tabUrl = new URL(tabs[0].url);
            const targetOrigin = tabUrl.origin;
            
            // Security: Only send to whitelisted dashboard origins
            const isAllowedOrigin = ALLOWED_DASHBOARD_ORIGINS.some(origin => {
              try {
                const originUrl = new URL(origin);
                return targetOrigin === origin || tabUrl.hostname === originUrl.hostname;
              } catch {
                return false;
              }
            });
            
            if (isAllowedOrigin) {
              window.postMessage({
                type: 'SRT_REQUEST_AUTH_TOKEN',
                messageId: messageId
              }, targetOrigin);
            } else {
              // Not a dashboard origin, don't send message
              console.debug('[SRT] Token request skipped: not a dashboard origin');
              cleanup();
              reject(new AuthenticationError('Not on a SmarTrack dashboard page'));
            }
          } catch (error) {
            // If URL parsing fails, reject the request
            console.debug('[SRT] Token request failed: invalid URL', error);
            cleanup();
            reject(new AuthenticationError('Invalid page URL'));
          }
        } else {
          // No tab available, reject
          cleanup();
          reject(new AuthenticationError('No active tab available'));
        }
      });
    });
  }

  /**
   * Makes an authenticated request to the backend
   * @async
   * @param {string} endpoint - API endpoint
   * @param {RequestInit} options - Fetch options
   * @returns {Promise<any>}
   * @throws {ApiError|NetworkError|AuthenticationError}
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const requestId = `${endpoint}-${Date.now()}`;
    
    // Create abort controller for request cancellation
    const abortController = new AbortController();
    this.activeRequests.set(requestId, abortController);
    
    try {
      const token = await this.getAuthToken();
      
      const fetchOptions = {
        ...options,
        signal: abortController.signal,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      const response = await fetch(url, fetchOptions);

      // Clean up abort controller
      this.activeRequests.delete(requestId);

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        const errorMessage = errorData.detail || 
          errorData.message || 
          `HTTP ${response.status}: ${response.statusText}`;
        
        throw new ApiError(errorMessage, response.status);
      }

      return await response.json();
    } catch (error) {
      // Clean up abort controller on error
      this.activeRequests.delete(requestId);
      
      if (error.name === 'AbortError') {
        throw new NetworkError('Request was cancelled');
      }
      
      if (error instanceof ApiError || error instanceof AuthenticationError) {
        throw error;
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network request failed. Please check your internet connection.');
      }
      
      console.error(`[SRT] API request failed for ${endpoint}:`, error);
      throw new ApiError(error.message || 'Request failed');
    }
  }

  /**
   * Parses error response from API
   * @async
   * @param {Response} response - Fetch response object
   * @returns {Promise<Object>}
   */
  async parseErrorResponse(response) {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return { detail: response.statusText };
    } catch {
      return { detail: `HTTP ${response.status}` };
    }
  }

  /**
   * Cancels all active requests
   * @returns {void}
   */
  cancelAllRequests() {
    this.activeRequests.forEach((controller) => {
      controller.abort();
    });
    this.activeRequests.clear();
  }

  /**
   * Performs a health check on the backend
   * @async
   * @returns {Promise<Object>}
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONSTANTS.HEALTH_ENDPOINT}`);
      
      if (!response.ok) {
        throw new ApiError(`Health check failed: ${response.statusText}`, response.status);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('[SRT] Health check failed:', error);
      throw new NetworkError('Health check failed');
    }
  }

  /**
   * Saves a link to the backend
   * @async
   * @param {Object} linkData - Link data object
   * @param {string} token - Auth token
   * @returns {Promise<Object>}
   * @throws {ApiError|NetworkError|AuthenticationError}
   */
  async saveLink(linkData, token) {
    if (!token || typeof token !== 'string') {
      throw new AuthenticationError('Invalid authentication token');
    }
    
    // Validate required fields
    if (!linkData || typeof linkData !== 'object') {
      throw new Error('Invalid link data');
    }
    
    const url = `${this.baseUrl}${API_CONSTANTS.LINKS_ENDPOINT}`;
    
    try {
      // Get extension version dynamically if possible
      let version = '2.0.0';
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
          version = chrome.runtime.getManifest().version;
        }
      } catch (e) {
        // Fallback to default
      }

      // Prepare request body with defaults
      const body = {
        url: linkData.url || '',
        title: linkData.title || '',
        description: linkData.description || '',
        content: linkData.content || '',
        category: linkData.category || API_CONSTANTS.DEFAULT_CATEGORY,
        tags: Array.isArray(linkData.tags) ? linkData.tags : [],
        contentType: linkData.contentType || API_CONSTANTS.DEFAULT_CONTENT_TYPE,
        thumbnail: linkData.thumbnail || null,
        favicon: linkData.favicon || null,
        isFavorite: linkData.isFavorite === true,
        isArchived: linkData.isArchived === true,
        source: 'extension',
        extensionVersion: version
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        const errorMsg = errorData.detail || 
          errorData.message || 
          `HTTP ${response.status}`;
        
        throw new ApiError(errorMsg, response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError || error instanceof AuthenticationError) {
        throw error;
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network request failed. Please check your internet connection.');
      }
      
      throw new ApiError(error.message || 'Failed to save link');
    }
  }

  /**
   * Detects content type from URL
   * @param {string} url - URL to analyze
   * @returns {string} Content type
   */
  detectContentType(url) {
    if (!url || typeof url !== 'string') {
      return API_CONSTANTS.DEFAULT_CONTENT_TYPE;
    }
    
    const urlLower = url.toLowerCase();
    
    // PDF files
    if (urlLower.includes('.pdf')) return 'pdf';
    
    // Video platforms
    if (urlLower.includes('youtube.com') || 
        urlLower.includes('youtu.be') ||
        urlLower.includes('vimeo.com') ||
        urlLower.includes('dailymotion.com')) {
      return 'video';
    }
    
    // Image files
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/)) {
      return 'image';
    }
    
    // Academic/Research
    if (urlLower.includes('arxiv.org') || 
        urlLower.includes('scholar.google') ||
        urlLower.includes('pubmed.ncbi.nlm.nih.gov')) {
      return 'article';
    }
    
    // Documents
    if (urlLower.match(/\.(doc|docx|xls|xlsx|ppt|pptx|txt|rtf)$/)) {
      return 'document';
    }
    
    return API_CONSTANTS.DEFAULT_CONTENT_TYPE;
  }

  /**
   * Gets user statistics
   * @async
   * @returns {Promise<Object>}
   * @throws {ApiError|NetworkError|AuthenticationError}
   */
  async getUserStats() {
    return this.makeRequest(API_CONSTANTS.USER_STATS_ENDPOINT);
  }

  /**
   * Searches for duplicate links
   * @async
   * @param {string} url - URL to search for
   * @returns {Promise<Array<Object>>}
   */
  async searchDuplicates(url) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendApi.js:460',message:'searchDuplicates: Starting search',data:{url:url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (!url || typeof url !== 'string') {
      return [];
    }
    
    try {
      const encodedUrl = encodeURIComponent(url);
      const response = await this.makeRequest(
        `${API_CONSTANTS.LINKS_ENDPOINT}/search?q=${encodedUrl}`
      );
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendApi.js:468',message:'searchDuplicates: Response received',data:{linksCount:response?.links?.length||0,links:response?.links?.map(l=>({id:l.id,url:l.url,title:l.title,isArchived:l.isArchived}))||[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      return Array.isArray(response.links) ? response.links : [];
    } catch (error) {
      // Non-critical operation, return empty array on failure
      // Use debug level to avoid console noise for expected network failures
      console.debug('[SRT] Duplicate search failed (non-critical):', error.message || error);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendApi.js:475',message:'searchDuplicates: Error during search',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return [];
    }
  }

  /**
   * Fetches categories from the backend
   * Includes predefined categories + user-created categories from links (like Dashboard)
   * @async
   * @returns {Promise<Array<string>>} Array of category names
   */
  async getCategories() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendApi.js:485',message:'getCategories: Starting fetch',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    try {
      // Step 1: Fetch predefined categories from /api/types
      const predefinedCategories = await this.makeRequest('/api/types');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendApi.js:492',message:'getCategories: Predefined categories fetched',data:{predefinedCategories:predefinedCategories,isArray:Array.isArray(predefinedCategories),length:Array.isArray(predefinedCategories)?predefinedCategories.length:0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      // Extract predefined category names (preserve original casing to match dashboard)
      const predefinedNames = Array.isArray(predefinedCategories)
        ? predefinedCategories.map(cat => {
            if (typeof cat === 'string') {
              return cat; // Preserve original casing
            }
            return cat.name || cat.id || '';
          }).filter(Boolean)
        : [];
      
      // Step 2: Fetch links to extract user-created categories (like Dashboard does)
      // Fetch all pages to get all categories (max limit is 100 per page)
      let userCreatedCategories = [];
      try {
        const allLinks = [];
        let page = 1;
        let hasMore = true;
        const maxPages = 20; // Safety limit to prevent infinite loops
        
        while (hasMore && page <= maxPages) {
          // Explicitly exclude archived links (isArchived=false) - only get active links for categories
          const linksResponse = await this.makeRequest(`/api/links?page=${page}&limit=100&isArchived=false`);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendApi.js:512',message:'getCategories: Links page fetched (active only)',data:{page:page,linksCount:linksResponse?.links?.length||0,hasMore:linksResponse?.hasMore||false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          
          if (linksResponse && Array.isArray(linksResponse.links)) {
            allLinks.push(...linksResponse.links);
            hasMore = linksResponse.hasMore === true;
            page++;
          } else {
            hasMore = false;
          }
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendApi.js:525',message:'getCategories: All links fetched',data:{totalLinks:allLinks.length,pagesFetched:page-1},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        if (allLinks.length > 0) {
          // Extract unique categories from ACTIVE links only (exclude archived, like Dashboard does)
          // Archived links should not contribute to category list
          const activeLinks = allLinks.filter(link => !link.isArchived);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendApi.js:537',message:'getCategories: Filtering archived links',data:{totalLinks:allLinks.length,activeLinks:activeLinks.length,archivedLinks:allLinks.length-activeLinks.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          
          // Use Map to preserve original casing while deduplicating (lowercase -> originalCase)
          const categoryMap = new Map(); // lowercase -> originalCase
          activeLinks.forEach(link => {
            if (link.category && link.category.trim()) {
              const original = link.category.trim();
              const normalized = original.toLowerCase();
              // Only add if we haven't seen this category before (case-insensitive)
              if (!categoryMap.has(normalized)) {
                categoryMap.set(normalized, original);
              }
            }
          });
          
          // Filter out predefined categories (case-insensitive comparison)
          const predefinedSet = new Set(predefinedNames.map(name => name.toLowerCase()));
          userCreatedCategories = Array.from(categoryMap.values()).filter(cat => {
            return !predefinedSet.has(cat.toLowerCase());
          });
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendApi.js:551',message:'getCategories: User-created categories extracted from active links',data:{userCreatedCategories:userCreatedCategories,userCreatedCount:userCreatedCategories.length,uniqueCategoriesFromLinks:userCategoriesSet.size,activeLinksCount:activeLinks.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
        }
      } catch (linksError) {
        // Non-critical - if links fetch fails, just use predefined categories
        console.debug('[SRT] Failed to fetch links for categories:', linksError.message || linksError);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendApi.js:545',message:'getCategories: Links fetch failed, using predefined only',data:{error:linksError.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      }
      
      // Step 3: Combine predefined + user-created categories
      const allCategories = [...predefinedNames, ...userCreatedCategories];
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendApi.js:530',message:'getCategories: Final combined categories',data:{allCategories:allCategories,totalCount:allCategories.length,predefinedCount:predefinedNames.length,userCreatedCount:userCreatedCategories.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      return allCategories;
    } catch (error) {
      // Non-critical operation, return empty array on failure
      console.debug('[SRT] Failed to fetch categories from backend:', error.message || error);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendApi.js:535',message:'getCategories: Error fetching',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return [];
    }
  }
}

// ============================================================================
// Export
// ============================================================================

// Export for use in popup and content scripts
if (typeof window !== 'undefined') {
  window.BackendApiService = BackendApiService;
}

// Also export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BackendApiService };
}
