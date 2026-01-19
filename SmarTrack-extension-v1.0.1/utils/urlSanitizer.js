/**
 * LinkedIn URL Sanitizer
 * Validates and sanitizes LinkedIn URLs for security and privacy
 * 
 * @fileoverview Utility for sanitizing LinkedIn URLs by removing tracking parameters
 * @version 1.0.0
 */

/**
 * Sanitizes a LinkedIn URL by validating it and removing tracking parameters
 * @param {string} dirtyUrl - The raw LinkedIn URL to sanitize
 * @returns {string|null} Clean URL string or null if validation fails
 */
function sanitizeLinkedInUrl(dirtyUrl) {
  if (!dirtyUrl || typeof dirtyUrl !== 'string') {
    return null;
  }

  try {
    const url = new URL(dirtyUrl);

    // Security Check 1: Enforce HTTPS protocol only
    if (url.protocol !== 'https:') {
      console.warn('[SmarTrack] Non-HTTPS URL rejected:', dirtyUrl);
      return null;
    }

    // Security Check 2: Allow ONLY these path prefixes
    const allowedPaths = ['/posts/', '/feed/update/', '/pulse/', '/learning/'];
    const pathMatches = allowedPaths.some(path => url.pathname.includes(path));
    
    if (!pathMatches) {
      console.warn('[SmarTrack] Path not in whitelist:', url.pathname);
      return null;
    }

    // Privacy Action: Strip ALL tracking parameters
    url.search = '';  // Removes query params like ?trackingId=, ?utm_source=
    url.hash = '';    // Removes hash fragments

    return url.toString();
  } catch (error) {
    console.warn('[SmarTrack] Invalid URL format:', dirtyUrl, error);
    return null;
  }
}

// Export as global function for content script access
if (typeof window !== 'undefined') {
  window.sanitizeLinkedInUrl = sanitizeLinkedInUrl;
}

// Also export for module systems (if needed in future)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sanitizeLinkedInUrl };
}
