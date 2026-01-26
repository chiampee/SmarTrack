/**
 * Pinterest URL and thumbnail utilities for SmarTrack extension
 * @fileoverview Helpers to detect Pinterest pin/ideas URLs and resolve thumbnails via og:image/twitter:image
 */

/** Matches pin and ideas paths (image-rich content) */
const PINTEREST_PIN_PATH = /(\/pin\/|\/ideas\/)/i;

/**
 * Returns true if the URL's hostname is pinterest.com (including www and subdomains)
 * @param {string} url - URL to check
 * @returns {boolean}
 */
function isPinterestUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === 'pinterest.com' || hostname.endsWith('.pinterest.com');
  } catch {
    return false;
  }
}

/**
 * Fetches a Pinterest pin/ideas thumbnail by loading the page and extracting og:image or twitter:image.
 * Only attempts for /pin/ and /ideas/ URLs.
 * @param {string} url - Pinterest pin or ideas URL
 * @returns {Promise<string|null>} Thumbnail URL or null
 */
async function getPinterestThumbnail(url) {
  if (!url || typeof url !== 'string') return null;
  if (!PINTEREST_PIN_PATH.test(url)) return null;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res || !res.ok) return null;

    const html = await res.text();
    if (!html || typeof html !== 'string') return null;

    const ogMatch = html.match(/property="og:image"[^>]*content="(https?:\/\/[^"]+)"/i) ||
      html.match(/content="(https?:\/\/[^"]+)"[^>]*property="og:image"/i);
    const twMatch = html.match(/name="twitter:image"[^>]*content="(https?:\/\/[^"]+)"/i) ||
      html.match(/content="(https?:\/\/[^"]+)"[^>]*name="twitter:image"/i);

    const raw = (ogMatch && ogMatch[1]) || (twMatch && twMatch[1]);
    if (!raw || typeof raw !== 'string') return null;

    return raw.replace(/&amp;/g, '&');
  } catch {
    return null;
  }
}

// Popup: attach to window
if (typeof window !== 'undefined') {
  window.isPinterestUrl = isPinterestUrl;
  window.getPinterestThumbnail = getPinterestThumbnail;
}
