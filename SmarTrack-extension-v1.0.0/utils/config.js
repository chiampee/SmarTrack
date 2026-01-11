/**
 * SmarTrack Extension Configuration
 * Consolidates all environment-specific settings
 */

const CONFIG = {
  // Production URLs
  PRODUCTION: {
    DASHBOARD_URL: 'https://smar-track.vercel.app',
    API_BASE_URL: 'https://smartrack-back.onrender.com'
  },
  
  // Development URLs (uncomment to use)
  DEVELOPMENT: {
    DASHBOARD_URL: 'http://localhost:5554',
    API_BASE_URL: 'http://localhost:8000'
  },
  
  // Current Environment (change to true for production)
  IS_PRODUCTION: true,
  
  /**
   * Gets the current dashboard URL based on environment
   * @returns {string}
   */
  getDashboardUrl() {
    return this.IS_PRODUCTION ? this.PRODUCTION.DASHBOARD_URL : this.DEVELOPMENT.DASHBOARD_URL;
  },
  
  /**
   * Gets the current API base URL based on environment
   * @returns {string}
   */
  getApiBaseUrl() {
    return this.IS_PRODUCTION ? this.PRODUCTION.API_BASE_URL : this.DEVELOPMENT.API_BASE_URL;
  }
};

// Export for use in different contexts
if (typeof window !== 'undefined') {
  window.SRT_CONFIG = CONFIG;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
