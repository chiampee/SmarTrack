/**
 * URL Detection Utility for Smart Research Tracker Extension
 * Automatically detects the correct dashboard URL based on environment
 */

// Production URLs (Vercel)
const PRODUCTION_URLS = [
  'https://smart-research-tracker.vercel.app/',
  'https://smart-research-tracker-git-main.vercel.app/',
  'https://smart-research-tracker-git-develop.vercel.app/'
];

// Development URLs (Local)
const DEVELOPMENT_URLS = [
  'http://localhost:5174/',
  'http://localhost:5173/',
  'http://127.0.0.1:5174/',
  'http://127.0.0.1:5173/'
];

// All possible URLs in order of preference
const ALL_URLS = [
  ...PRODUCTION_URLS,
  ...DEVELOPMENT_URLS
];

/**
 * Detects the best dashboard URL to use
 * @returns {Promise<string>} The best URL to use
 */
export async function detectBestDashboardUrl() {
  try {
    // First, check if user has manually configured a URL
    const settings = await chrome.storage.sync.get(['dashboardUrl']);
    if (settings.dashboardUrl && settings.dashboardUrl.trim()) {
      console.log('[URL Detection] Using user-configured URL:', settings.dashboardUrl);
      return settings.dashboardUrl;
    }

    // Check if we can find an existing dashboard tab
    const existingTab = await findExistingDashboardTab();
    if (existingTab) {
      console.log('[URL Detection] Found existing dashboard tab:', existingTab.url);
      return existingTab.url;
    }

    // Try to detect environment based on extension context
    const isDevelopment = await detectDevelopmentEnvironment();
    
    if (isDevelopment) {
      console.log('[URL Detection] Development environment detected, using localhost');
      return DEVELOPMENT_URLS[0]; // http://localhost:5174/
    } else {
      console.log('[URL Detection] Production environment detected, using Vercel');
      return PRODUCTION_URLS[0]; // https://smart-research-tracker.vercel.app/
    }
  } catch (error) {
    console.error('[URL Detection] Error detecting URL, using fallback:', error);
    return PRODUCTION_URLS[0]; // Default to production
  }
}

/**
 * Finds an existing dashboard tab if one is open
 * @returns {Promise<chrome.tabs.Tab|null>}
 */
async function findExistingDashboardTab() {
  try {
    const tabs = await chrome.tabs.query({});
    
    for (const tab of tabs) {
      if (tab.url && ALL_URLS.some(url => tab.url.startsWith(url))) {
        return tab;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[URL Detection] Error finding existing tab:', error);
    return null;
  }
}

/**
 * Detects if we're in a development environment
 * @returns {Promise<boolean>}
 */
async function detectDevelopmentEnvironment() {
  try {
    // Check if we can access localhost
    const localhostTabs = await chrome.tabs.query({
      url: ['http://localhost:*/*', 'http://127.0.0.1:*/*']
    });
    
    if (localhostTabs.length > 0) {
      console.log('[URL Detection] Found localhost tabs, assuming development');
      return true;
    }

    // Check if extension was loaded in developer mode
    const manifest = chrome.runtime.getManifest();
    if (manifest.update_url) {
      console.log('[URL Detection] Extension has update_url, assuming production');
      return false;
    }

    // Default to production for safety
    return false;
  } catch (error) {
    console.error('[URL Detection] Error detecting environment:', error);
    return false;
  }
}

/**
 * Tests if a URL is accessible
 * @param {string} url - URL to test
 * @returns {Promise<boolean>}
 */
export async function testUrlAccessibility(url) {
  try {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.timeout = 3000; // 3 second timeout
      
      xhr.onload = () => {
        resolve(xhr.status >= 200 && xhr.status < 400);
      };
      
      xhr.onerror = () => {
        resolve(false);
      };
      
      xhr.ontimeout = () => {
        resolve(false);
      };
      
      xhr.open('HEAD', url, true);
      xhr.send();
    });
  } catch (error) {
    console.error('[URL Detection] Error testing URL:', url, error);
    return false;
  }
}

/**
 * Gets all possible dashboard URLs in order of preference
 * @returns {string[]}
 */
export function getAllPossibleUrls() {
  return [...ALL_URLS];
}

/**
 * Gets production URLs only
 * @returns {string[]}
 */
export function getProductionUrls() {
  return [...PRODUCTION_URLS];
}

/**
 * Gets development URLs only
 * @returns {string[]}
 */
export function getDevelopmentUrls() {
  return [...DEVELOPMENT_URLS];
}
