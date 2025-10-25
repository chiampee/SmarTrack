# 🔧 Panel Functionality Test Guide

## **Quick Test Steps**

### **Step 1: Run Panel Diagnostics**
1. Open your app at `http://localhost:5173`
2. Look for the **🔧 Panel Test** button in the top-right corner
3. Click it to run comprehensive diagnostics
4. Check the console for detailed results

### **Step 2: Test Panel Functionality**
1. **Select some links** by clicking the checkboxes
2. **Click "Start AI Chat"** button
3. **Watch the console** for these logs:
   ```
   MultiChatPanel rendered with links: [array of links]
   Initializing chat with links: [array of links]
   Calling chatService.startConversation with linkIds: [array]
   ```

### **Step 3: Test Chat Features**
1. **Try a quick prompt** like "Summarise selected pages"
2. **Type a custom message** and press Enter
3. **Test buttons**: New Chat, Clear Chat

## **Expected Behavior**

### ✅ **Working Panel Should Show:**
- Chat interface opens in a modal/overlay
- Welcome message appears
- Input field is enabled
- Quick prompt buttons are clickable
- No error messages in console

### ❌ **Broken Panel Might Show:**
- No chat interface appears
- Error messages in console
- Buttons are disabled/grayed out
- "No AI provider available" warning

## **Common Issues & Solutions**

### **Issue 1: Panel Doesn't Open**
**Symptoms:** Clicking "Start AI Chat" does nothing
**Solution:** 
1. Run Panel Test diagnostics
2. Check console for errors
3. Ensure you have links selected

### **Issue 2: API Key Issues**
**Symptoms:** Yellow warning banner, "No AI provider available"
**Solution:**
1. Check if you have API keys configured
2. Run the setup script: `npm run setup:env`
3. Or use the free tier (should still work)

### **Issue 3: Database Issues**
**Symptoms:** Chat doesn't save messages, errors in console
**Solution:**
1. Check browser IndexedDB permissions
2. Clear browser storage and try again
3. Check console for database errors

### **Issue 4: Extension Issues**
**Symptoms:** Links not syncing, extension features not working
**Solution:**
1. Check if extension is installed and enabled
2. Refresh the page
3. Check extension popup for errors

## **Debug Commands**

You can also run these commands in the browser console:

```javascript
// Test panel diagnostics
window.panelDiagnostics.runFullDiagnostics().then(results => {
  console.log('Panel Diagnostics:', results);
});

// Test link store
const { useLinkStore } = await import('./src/stores/linkStore');
const store = useLinkStore.getState();
console.log('Link Store:', store);

// Test chat service
const { chatService } = await import('./src/services/chatService');
console.log('Chat Service:', chatService);
```

## **What to Share**

If the panel still doesn't work, please share:

1. **Console output** from the Panel Test button
2. **Console logs** when trying to start a chat
3. **Any error messages** you see
4. **Browser and version** you're using
5. **Whether you're using the extension** or just the web app

## **Quick Fixes to Try**

1. **Refresh the page** and try again
2. **Clear browser storage** (localStorage, IndexedDB)
3. **Restart the dev server** (`npm run dev`)
4. **Check your internet connection**
5. **Try in a different browser**

---

**Need Help?** Run the Panel Test diagnostics and share the results!
