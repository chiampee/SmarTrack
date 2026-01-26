/**
 * X (Twitter) URL and thumbnail utilities for SmarTrack extension
 * @fileoverview Helpers to detect X/Twitter URLs and resolve post thumbnails via og:image/twitter:image
 */

/**
 * Returns true if the URL's hostname is twitter.com or x.com (including www and subdomains)
 * @param {string} url - URL to check
 * @returns {boolean}
 */
function isXUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return (
      hostname === 'twitter.com' ||
      hostname === 'x.com' ||
      hostname.endsWith('.twitter.com') ||
      hostname.endsWith('.x.com')
    );
  } catch {
    return false;
  }
}

/**
 * Fetches a tweet/X post thumbnail by loading the page and extracting og:image or twitter:image.
 * Only attempts for URLs with /status/ in the path (tweet permalinks).
 * @param {string} url - X/Twitter post URL (e.g. https://twitter.com/user/status/123 or https://x.com/user/status/123)
 * @returns {Promise<string|null>} Thumbnail URL or null
 */
async function getXThumbnail(url) {
  if (!url || typeof url !== 'string') return null;
  if (!/\/status\/[^/?#]+/.test(url)) return null;

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

    // Prefer og:image, then twitter:image (attribute order may vary)
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
  window.isXUrl = isXUrl;
  window.getXThumbnail = getXThumbnail;
}
