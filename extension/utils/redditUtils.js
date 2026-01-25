/**
 * Reddit URL and thumbnail utilities for SmarTrack extension
 * @fileoverview Helpers to detect Reddit URLs and resolve post thumbnails via JSON API
 */

const REDDIT_POST_REGEX = /reddit\.com\/r\/([^\/]+)\/comments\/([^\/\?&#]+)/i;

/**
 * Returns true if the URL's hostname is reddit.com (www, old, or bare)
 * @param {string} url - URL to check
 * @returns {boolean}
 */
function isRedditUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === 'reddit.com' || hostname.endsWith('.reddit.com');
  } catch {
    return false;
  }
}

/**
 * Fetches a Reddit post thumbnail from the JSON API.
 * Uses preview.images[0].source.url, then data.thumbnail if it's an http URL.
 * @param {string} url - Reddit post URL (e.g. https://www.reddit.com/r/sub/comments/ID/...)
 * @returns {Promise<string|null>} Thumbnail URL or null
 */
async function getRedditThumbnail(url) {
  if (!url || typeof url !== 'string') return null;

  const m = url.match(REDDIT_POST_REGEX);
  const sub = m && m[1] ? m[1].trim() : null;
  const id = m && m[2] ? m[2].trim() : null;
  if (!sub || !id) return null;

  const apiUrl = `https://www.reddit.com/r/${sub}/comments/${id}.json`;

  try {
    const res = await fetch(apiUrl, { method: 'GET' });
    if (!res || !res.ok) return null;

    const json = await res.json();
    if (!Array.isArray(json) || !json[0]?.data?.children?.[0]?.data) return null;

    const data = json[0].data.children[0].data;

    // Prefer preview (full-size or best available)
    const previewUrl = data.preview?.images?.[0]?.source?.url;
    if (previewUrl && typeof previewUrl === 'string') {
      return previewUrl.replace(/&amp;/g, '&');
    }

    // Fallback: thumbnail when it's a full URL (not "self", "default", "nsfw", etc.)
    const thumb = data.thumbnail;
    if (thumb && typeof thumb === 'string' && (thumb.startsWith('http://') || thumb.startsWith('https://'))) {
      return thumb.replace(/&amp;/g, '&');
    }

    return null;
  } catch {
    return null;
  }
}

// Popup: attach to window
if (typeof window !== 'undefined') {
  window.isRedditUrl = isRedditUrl;
  window.getRedditThumbnail = getRedditThumbnail;
}
