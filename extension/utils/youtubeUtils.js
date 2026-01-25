/**
 * YouTube URL and thumbnail utilities for SmarTrack extension
 * @fileoverview Helpers to detect YouTube URLs and resolve video thumbnails
 */

const YOUTUBE_VIDEO_ID_REGEX = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;

/**
 * Returns true if the URL's hostname is youtube.com or youtu.be
 * @param {string} url - URL to check
 * @returns {boolean}
 */
function isYoutubeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes('youtube.com') || hostname.includes('youtu.be');
  } catch {
    return false;
  }
}

/**
 * Returns a YouTube video thumbnail URL for the given watch/embed URL.
 * Uses hqdefault.jpg (no fetch) so it works in extension and web contexts without
 * CORS or CSP connect-src. The <img> tag loads the URL directly.
 * @param {string} url - YouTube page or embed URL
 * @returns {Promise<string|null>} Thumbnail URL or null
 */
async function getYoutubeThumbnail(url) {
  if (!url || typeof url !== 'string') return null;

  const m = url.match(YOUTUBE_VIDEO_ID_REGEX);
  const videoId = m && m[2] ? m[2].trim() : null;
  if (!videoId) return null;

  // hqdefault (480x360) exists for virtually all public videos. No fetch — avoid
  // CORS, 405 from HEAD, and CSP connect-src; <img> loads the URL directly.
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

// Popup: attach to window
if (typeof window !== 'undefined') {
  window.isYoutubeUrl = isYoutubeUrl;
  window.getYoutubeThumbnail = getYoutubeThumbnail;
}

// Service worker: importScripts makes top-level names global; no extra export needed
