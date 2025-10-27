/**
 * Backend API Service for Chrome Extension
 * Connects extension to Python FastAPI backend
 */

class BackendApiService {
  constructor() {
    // Use localhost for development, production URL for deployed
    this.baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:8000'
      : 'https://smartrack-back.onrender.com';
    this.authToken = null;
  }

  // Get Auth0 token from extension storage or request from frontend
  async getAuthToken() {
    if (this.authToken) {
      return this.authToken;
    }

    try {
      // Try to get token from extension storage
      const result = await chrome.storage.local.get(['authToken']);
      if (result.authToken) {
        this.authToken = result.authToken;
        return this.authToken;
      }

      // If no token in storage, request from frontend
      return await this.requestTokenFromFrontend();
    } catch (error) {
      console.error('Failed to get auth token:', error);
      throw new Error('Authentication required');
    }
  }

  // Request token from frontend via message passing
  async requestTokenFromFrontend() {
    return new Promise((resolve, reject) => {
      const messageId = 'get-token-' + Date.now();
      
      const handleResponse = (event) => {
        if (event.data && event.data.type === 'SRT_AUTH_TOKEN_RESPONSE' && event.data.messageId === messageId) {
          window.removeEventListener('message', handleResponse);
          clearTimeout(timeout);
          
          if (event.data.token) {
            this.authToken = event.data.token;
            // Store token for future use
            chrome.storage.local.set({ authToken: event.data.token });
            resolve(event.data.token);
          } else {
            reject(new Error('No auth token received'));
          }
        }
      };

      const timeout = setTimeout(() => {
        window.removeEventListener('message', handleResponse);
        reject(new Error('Token request timeout'));
      }, 5000);

      window.addEventListener('message', handleResponse);
      
      // Request token from frontend
      window.postMessage({
        type: 'SRT_REQUEST_AUTH_TOKEN',
        messageId: messageId
      }, '*');
    });
  }

  // Make authenticated request to backend
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = await this.getAuthToken();
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // Save link to backend
  async saveLink(linkData) {
    return this.makeRequest('/api/links', {
      method: 'POST',
      body: JSON.stringify({
        url: linkData.url,
        title: linkData.title || '',
        description: linkData.description || '',
        category: linkData.category || 'Research',
        tags: linkData.tags || [],
        contentType: this.detectContentType(linkData.url),
        thumbnail: linkData.image || null,
        favicon: linkData.favicon || null,
        isFavorite: false,
        isArchived: false
      }),
    });
  }

  // Detect content type from URL
  detectContentType(url) {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('.pdf')) return 'pdf';
    if (urlLower.includes('youtube.com') || urlLower.includes('vimeo.com')) return 'video';
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'image';
    if (urlLower.includes('arxiv.org') || urlLower.includes('scholar.google')) return 'article';
    if (urlLower.includes('.doc') || urlLower.includes('.docx')) return 'document';
    
    return 'webpage';
  }

  // Get user stats
  async getUserStats() {
    return this.makeRequest('/api/users/stats');
  }

  // Search for duplicates
  async searchDuplicates(url) {
    try {
      const response = await this.makeRequest(`/api/links/search?q=${encodeURIComponent(url)}`);
      return response.links || [];
    } catch (error) {
      console.error('Duplicate search failed:', error);
      return [];
    }
  }
}

// Export for use in popup and content scripts
window.BackendApiService = BackendApiService;