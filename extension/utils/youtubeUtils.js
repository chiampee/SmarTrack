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
 * Extracts a YouTube video thumbnail URL, with maxresdefault -> hqdefault fallback.
 * Returns null if the URL is not YouTube, no valid video ID, or both thumbnail URLs 404.
 * @param {string} url - YouTube page or embed URL
 * @returns {Promise<string|null>} Thumbnail URL or null
 */
async function getYoutubeThumbnail(url) {
  if (!url || typeof url !== 'string') return null;

  const m = url.match(YOUTUBE_VIDEO_ID_REGEX);
  const videoId = m && m[2] ? m[2].trim() : null;
  if (!videoId) return null;

  const maxres = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const hq = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  try {
    const resMax = await fetch(maxres, { method: 'HEAD' });
    if (resMax && resMax.ok) return maxres;
  } catch {
    // ignore
  }

  try {
    const resHq = await fetch(hq, { method: 'HEAD' });
    if (resHq && resHq.ok) return hq;
  } catch {
    // ignore
  }

  return null;
}

// Popup: attach to window
if (typeof window !== 'undefined') {
  window.isYoutubeUrl = isYoutubeUrl;
  window.getYoutubeThumbnail = getYoutubeThumbnail;
}

// Service worker: importScripts makes top-level names global; no extra export needed
