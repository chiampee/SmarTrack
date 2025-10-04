# Smart Research Tracker Extension Installation Guide

## Quick Start (hosted dashboard)

- Dashboard (hosted): https://smart-research-tracker-jjh48shzs-chiampees-projects.vercel.app
- After loading the extension (see below), open the popup → ⚙️ and ensure Dashboard URL points to the hosted URL above (it defaults to it).

## Quick Fix for Links Not Showing in Dashboard

The issue you're experiencing is that the extension is saving links to `chrome.storage.local`, but the dashboard wasn't properly communicating with the extension to retrieve them.

## What I Fixed

1. **Direct Chrome Storage Access**: The dashboard now tries to access the extension's storage directly first
2. **Fallback Communication**: If direct access fails, it falls back to `window.postMessage` communication
3. **Content Script Injection**: If communication fails, it attempts to inject the content script and retry
4. **Enhanced Error Handling**: Better logging and fallback mechanisms

## Installation Steps

### 1. Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension/` folder from this project

### 2. Verify Extension is Working

1. Look for "Smart Research Tracker" in your extensions list
2. The extension should show a badge with "0" (or the number of saved links)
3. Click the extension icon to open the popup

### 3. Test Link Saving

1. Go to any webpage (e.g., `https://example.com`)
2. Click the extension icon
3. Fill in the form and click "Save to Research"
4. You should see a success message

### 4. Test Dashboard Integration

1. Open the hosted dashboard: https://smart-research-tracker-jjh48shzs-chiampees-projects.vercel.app
2. Or use local dev: `http://localhost:5173`
3. In the popup, click "Dashboard" to open it quickly

## Troubleshooting

### If Links Still Don't Show

1. **Check Console**: Open browser dev tools and look for errors
2. **Debug Button**: Use the debug button to test extension communication
3. **Extension Status**: Verify the extension is enabled and working
4. **Storage Check**: Use the debug button to see if links are actually in storage

### Common Issues

1. **Extension Not Loaded**: Make sure you loaded the unpacked extension
2. **Dashboard Not Running**: Ensure your React app is running (`npm run dev`) if using local dev
3. **Permission Issues**: The extension needs storage and scripting permissions
4. **Content Script Issues**: The extension might not be injecting properly

### Manual Testing

You can also test the extension manually:

1. Open the debug HTML file I created (`debug-extension-communication.html`)
2. This will test all communication methods
3. Check the console for detailed logs

## How It Works Now

1. **Primary Method**: Dashboard directly accesses `chrome.storage.local`
2. **Secondary Method**: Uses `window.postMessage` to communicate with content script
3. **Fallback Method**: Injects content script if needed and retries
4. **Final Fallback**: Uses local database if all else fails

## Expected Behavior

- Links saved via the extension should appear in the dashboard within a few seconds
- The dashboard should automatically refresh when links are added/updated
- All CRUD operations (Create, Read, Update, Delete) should work seamlessly
- The extension badge should show the correct count of saved links

## Still Having Issues?

If you're still experiencing problems:

1. Check the browser console for error messages
2. Use the debug button to see what's happening
3. Verify the extension is properly installed and enabled
4. Make sure you're running the latest version of the code

The fixes I implemented should resolve the communication issues between the extension and dashboard, allowing your saved links to appear properly.
