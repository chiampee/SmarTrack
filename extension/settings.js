// Extract user ID from JWT token
function extractUserIdFromToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const payload = JSON.parse(jsonPayload);
    return payload.sub || payload.user_id || payload.id || null;
  } catch (error) {
    console.error('[SRT] Failed to extract user ID:', error);
    return null;
  }
}

// Get extension version from manifest
function getExtensionVersion() {
  try {
    if (chrome.runtime?.getManifest) {
      return chrome.runtime.getManifest().version || 'Unknown';
    }
    return 'Unknown';
  } catch (error) {
    console.error('[SRT] Failed to get extension version:', error);
    return 'Unknown';
  }
}

// Format timestamp
function formatTimestamp(timestamp) {
  if (!timestamp) return 'Never';
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleString();
  } catch (error) {
    return 'Invalid date';
  }
}

// Load and display extension info
async function loadExtensionInfo() {
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const infoSection = document.getElementById('infoSection');

  try {
    loading.style.display = 'block';
    error.style.display = 'none';
    infoSection.style.display = 'none';

    // Get stored data
    const result = await chrome.storage.local.get([
      'lastUsage',
      'lastInteraction',
      'extensionStatus',
      'authToken'
    ]);

    const lastUsage = result.lastUsage || null;
    const lastInteraction = result.lastInteraction || null;
    const status = result.extensionStatus || 'unknown';
    const token = result.authToken || null;

    // Get user ID from token
    const userId = token ? extractUserIdFromToken(token) : null;

    // Get extension version
    const version = getExtensionVersion();

    // Current timestamp
    const currentTimestamp = Date.now();

    // Update UI
    document.getElementById('status').textContent = status === 'active' ? '🟢 Active' : '⚪ Inactive';
    document.getElementById('status').className = `info-value status-${status}`;
    document.getElementById('version').textContent = version;
    document.getElementById('userId').textContent = userId ? userId.substring(0, 8) + '...' : 'Not logged in';
    document.getElementById('lastUsage').textContent = formatTimestamp(lastUsage);
    document.getElementById('lastInteraction').textContent = formatTimestamp(lastInteraction);
    document.getElementById('timestamp').textContent = new Date(currentTimestamp).toLocaleString();

    loading.style.display = 'none';
    infoSection.style.display = 'block';
  } catch (err) {
    console.error('[SRT] Failed to load extension info:', err);
    loading.style.display = 'none';
    error.style.display = 'block';
    error.textContent = 'Failed to load extension information. Please try again.';
  }
}

// Setup refresh button
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('refreshBtn').addEventListener('click', loadExtensionInfo);
  // Load info on page load
  loadExtensionInfo();
});
