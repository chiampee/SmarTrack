// Extension Options Page JavaScript
console.log('🚀 Smart Research Tracker Extension Options Loaded');

// Default settings
const defaultSettings = {
          dashboardUrl: 'http://localhost:5174/',
  fallbackUrl: 'https://smartresearchtracker.vercel.app/',
  autoFillTitle: true,
  showBadge: true,
  autoClose: true
};

// DOM elements
const dashboardUrlInput = document.getElementById('dashboardUrl');
const fallbackUrlInput = document.getElementById('fallbackUrl');
const autoFillTitleCheckbox = document.getElementById('autoFillTitle');
const showBadgeCheckbox = document.getElementById('showBadge');
const autoCloseCheckbox = document.getElementById('autoClose');
const saveSettingsBtn = document.getElementById('saveSettings');
const resetSettingsBtn = document.getElementById('resetSettings');
const exportDataBtn = document.getElementById('exportData');
const importDataBtn = document.getElementById('importData');
const importFileInput = document.getElementById('importFile');
const clearDataBtn = document.getElementById('clearData');
const statusDiv = document.getElementById('status');

// Load settings when page loads
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
});

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get(defaultSettings, (settings) => {
    dashboardUrlInput.value = settings.dashboardUrl || defaultSettings.dashboardUrl;
    fallbackUrlInput.value = settings.fallbackUrl || defaultSettings.fallbackUrl;
    autoFillTitleCheckbox.checked = settings.autoFillTitle !== false;
    showBadgeCheckbox.checked = settings.showBadge !== false;
    autoCloseCheckbox.checked = settings.autoClose !== false;
  });
}

// Save settings
saveSettingsBtn.addEventListener('click', () => {
  const settings = {
    dashboardUrl: dashboardUrlInput.value.trim(),
    fallbackUrl: fallbackUrlInput.value.trim(),
    autoFillTitle: autoFillTitleCheckbox.checked,
    showBadge: showBadgeCheckbox.checked,
    autoClose: autoCloseCheckbox.checked
  };

  chrome.storage.sync.set(settings, () => {
    showStatus('✅ Settings saved successfully!', 'success');
    
    // Update badge if setting changed
    if (!settings.showBadge) {
      chrome.action.setBadgeText({ text: '' });
    } else {
      // Update badge with current count
      chrome.storage.local.get(['links'], (result) => {
        const links = result.links || [];
        chrome.action.setBadgeText({ text: links.length.toString() });
      });
    }
  });
});

// Reset settings to defaults
resetSettingsBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    chrome.storage.sync.set(defaultSettings, () => {
      loadSettings();
      showStatus('✅ Settings reset to defaults!', 'success');
    });
  }
});

// Export data
exportDataBtn.addEventListener('click', () => {
  chrome.storage.local.get(null, (data) => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-research-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('✅ Data exported successfully!', 'success');
  });
});

// Import data
importDataBtn.addEventListener('click', () => {
  importFileInput.click();
});

importFileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      if (confirm('This will replace all existing data. Are you sure?')) {
        chrome.storage.local.clear(() => {
          chrome.storage.local.set(data, () => {
            showStatus('✅ Data imported successfully!', 'success');
            
            // Update badge
            const links = data.links || [];
            chrome.action.setBadgeText({ text: links.length.toString() });
          });
        });
      }
    } catch (error) {
      showStatus('❌ Invalid file format. Please select a valid JSON file.', 'error');
    }
  };
  reader.readAsText(file);
});

// Clear all data
clearDataBtn.addEventListener('click', () => {
  if (confirm('⚠️ This will permanently delete ALL saved links and settings. Are you absolutely sure?')) {
    chrome.storage.local.clear(() => {
      chrome.storage.sync.clear(() => {
        showStatus('✅ All data cleared successfully!', 'success');
        chrome.action.setBadgeText({ text: '' });
        loadSettings(); // Reload default settings
      });
    });
  }
});

// Show status message
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

// Validate URLs when input changes
dashboardUrlInput.addEventListener('blur', () => {
  const url = dashboardUrlInput.value.trim();
  if (url && !isValidUrl(url)) {
    showStatus('⚠️ Please enter a valid URL for the dashboard', 'error');
  }
});

fallbackUrlInput.addEventListener('blur', () => {
  const url = fallbackUrlInput.value.trim();
  if (url && !isValidUrl(url)) {
    showStatus('⚠️ Please enter a valid URL for the fallback', 'error');
  }
});

// URL validation helper
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
} 