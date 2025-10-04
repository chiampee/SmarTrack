# 🔧 Extension Troubleshooting Guide

## 🚨 **Current Issue: Links Not Showing in Dashboard**

Your extension is not properly communicating with the dashboard. Let's fix this step by step.

## 📋 **Step-by-Step Troubleshooting**

### **Step 1: Verify Extension Installation**

1. **Open Chrome Extensions Page**
   - Go to `chrome://extensions/`
   - Make sure "Developer mode" is turned ON (top right toggle)

2. **Check Extension Status**
   - Look for "Smart Research Tracker" in the list
   - Status should show "Enabled" with a green checkmark
   - If you see "Error" or "Corrupted", remove and reinstall

3. **Extension Details**
   - Click on the extension name
   - Check that all files are present:
     - ✅ `background.js`
     - ✅ `contentScript.js`
     - ✅ `popup.html`
     - ✅ `manifest.json`

### **Step 2: Test Extension Functionality**

1. **Open the Basic Test Page**
   - File: `test-extension-basic.html` (should be open now)
   - Click "Check Extension" button
   - **What do you see?**

2. **Check Console for Errors**
   - Press F12 to open DevTools
   - Go to Console tab
   - Look for any red error messages
   - **What errors do you see?**

### **Step 3: Verify Extension Communication**

1. **Test Extension Response**
   - Click "Check if Working" button
   - **Does it show "Extension is working and responding!"?**

2. **Test Storage Access**
   - Click "Check Storage" button
   - **Does it show "Storage accessible"?**

3. **Test Link Operations**
   - Click "Add Test Link" button
   - **Does it successfully add a link?**
   - Click "Get All Links" button
   - **Do you see the test link?**

### **Step 4: Check Dashboard Communication**

1. **Open Your Dashboard**
   - Go to `http://localhost:5174`
   - Navigate to Links page
   - Click the "🐛 Debug" button
   - **What does it show?**

2. **Check Dashboard Console**
   - Open DevTools (F12)
   - Look for any error messages
   - **What errors do you see?**

## 🔍 **Common Issues & Solutions**

### **Issue 1: Extension Not Loading**
**Symptoms:**
- No extension markers on page
- Chrome storage not available
- Extension not responding to ping

**Solutions:**
1. **Reinstall Extension:**
   - Remove from `chrome://extensions/`
   - Click "Load unpacked"
   - Select the `extension` folder
   - Refresh the test page

2. **Check File Permissions:**
   - Make sure all extension files are readable
   - Check that `manifest.json` is valid JSON

### **Issue 2: Content Script Not Injecting**
**Symptoms:**
- Extension markers found
- Chrome storage available
- But no response to postMessage

**Solutions:**
1. **Check Content Script:**
   - Verify `contentScript.js` exists and is valid
   - Check that `manifest.json` has correct content script configuration

2. **Force Reload:**
   - Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
   - Check if content script loads

### **Issue 3: Storage Access Denied**
**Symptoms:**
- Extension loaded but chrome.storage not available
- Permission errors in console

**Solutions:**
1. **Check Permissions:**
   - Verify `manifest.json` has `"storage"` permission
   - Check that extension is enabled

2. **Clear Extension Data:**
   - Go to `chrome://extensions/`
   - Click "Details" on your extension
   - Click "Clear data"

### **Issue 4: Dashboard Can't Access Extension**
**Symptoms:**
- Extension works on other pages
- Dashboard shows no links
- Communication timeouts

**Solutions:**
1. **Check Dashboard URL:**
   - Make sure dashboard is running on `http://localhost:5174`
   - Verify extension has access to localhost

2. **Check Content Script Injection:**
   - Dashboard page should have extension markers
   - Content script should be running

## 🧪 **Diagnostic Tests**

### **Test 1: Extension Loading**
```javascript
// Check if extension is loaded
console.log('Extension markers:', document.documentElement.hasAttribute('data-smart-research-tracker'));
console.log('Chrome runtime:', typeof chrome !== 'undefined' && chrome.runtime);
console.log('Chrome storage:', typeof chrome !== 'undefined' && chrome.storage);
```

### **Test 2: Storage Access**
```javascript
// Test storage access
if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['links'], (result) => {
        console.log('Storage result:', result);
    });
}
```

### **Test 3: Communication**
```javascript
// Test postMessage communication
window.postMessage({ type: 'SRT_PING' }, '*');
```

## 📊 **Expected Results**

### **✅ Extension Working Correctly:**
- Extension markers found
- Chrome storage accessible
- Extension responds to ping
- Can add/retrieve links
- Dashboard shows links

### **❌ Extension Not Working:**
- No extension markers
- Chrome storage not available
- Extension not responding
- Cannot add/retrieve links
- Dashboard shows no links

## 🆘 **Next Steps**

1. **Run the Basic Test Page** (`test-extension-basic.html`)
2. **Tell me exactly what you see** for each test
3. **Share any error messages** from the console
4. **Check extension status** in `chrome://extensions/`

## 📞 **What to Tell Me**

Please provide:
1. **Extension Status:** Is it enabled in Chrome extensions?
2. **Test Results:** What does each test button show?
3. **Console Errors:** Any red error messages?
4. **Extension Markers:** Does the page show extension is loaded?
5. **Storage Access:** Can you access chrome.storage?

This will help me identify the exact problem and fix it! 🚀
