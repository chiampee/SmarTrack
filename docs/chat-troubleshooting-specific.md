# Chat Functionality Specific Troubleshooting Guide

## 🚨 **Common Issues and Solutions**

### **Issue 1: Chat History Not Loading**

**Symptoms:**
- Previous messages don't appear when reopening chat
- Always shows welcome message even after sending messages
- No message counter or "New Chat" button appears

**Root Cause:** Conversation matching logic may be too strict

**Solution:**
1. **Check Browser Console** for these specific logs:
   ```
   db.getActiveConversationByLinks called with linkIds: [...]
   Conversation X: isActive=true, hasSameLinks=false, linkIds=[...]
   ```

2. **If `hasSameLinks=false`**, the issue is with link ID matching
3. **If no logs appear**, there's a database connection issue

**Fix Applied:**
- Enhanced conversation matching logic with better debugging
- Added bidirectional link ID checking
- Improved array handling in conversation creation

### **Issue 2: Messages Not Saving**

**Symptoms:**
- Messages disappear after sending
- No database operation logs in console
- Chat appears to work but nothing persists

**Root Cause:** Database operations failing silently

**Solution:**
1. **Check Console Logs** for:
   ```
   db.addChatMessage called with: {...}
   Message added to database successfully
   ```

2. **If logs are missing**, check:
   - IndexedDB permissions in browser
   - Storage quota exceeded
   - Database schema version mismatch

**Fix Applied:**
- Added comprehensive error handling to database operations
- Enhanced debug logging for all database calls
- Improved error messages for troubleshooting

### **Issue 3: API Key Issues**

**Symptoms:**
- Yellow warning banner appears
- "No AI provider available" error
- Chat doesn't respond to messages

**Solution:**
1. **Run setup script:**
   ```bash
   npm run setup:env
   ```

2. **Check .env.local file:**
   ```env
   VITE_OPENAI_API_KEY=sk-your-actual-key-here
   ```

3. **Verify API key has credits** at https://platform.openai.com/account/billing

### **Issue 4: Conversation Not Found**

**Symptoms:**
- New conversation created every time
- No history persistence
- "No existing conversation found" in logs

**Root Cause:** Link ID order or array comparison issues

**Solution:**
1. **Check the exact link IDs** being passed:
   ```
   chatService.startConversation called with linkIds: [...]
   ```

2. **Verify link selection** - ensure same links are selected in same order

**Fix Applied:**
- Improved conversation matching with bidirectional checking
- Added array copy to prevent reference issues
- Enhanced debugging for conversation lookup

## 🔍 **Step-by-Step Debugging**

### **Step 1: Enable Debug Logging**

1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Clear console** (click the 🚫 icon)
4. **Select research links** and start chat

### **Step 2: Check Database Operations**

**Expected Logs for New Conversation:**
```
chatService.startConversation called with linkIds: [...]
db.getActiveConversationByLinks called with linkIds: [...]
No existing conversation found, creating new one
Creating new conversation: {...}
db.addConversation called with: {...}
Conversation added to database successfully
db.getChatMessagesByConversation called with conversationId: ...
Retrieved messages from database: []
Started new conversation with welcome message
```

**Expected Logs for Existing Conversation:**
```
chatService.startConversation called with linkIds: [...]
db.getActiveConversationByLinks called with linkIds: [...]
Conversation X: isActive=true, hasSameLinks=true, linkIds=[...]
Found active conversation: {...}
db.getChatMessagesByConversation called with conversationId: ...
Retrieved messages from database: [...]
Loaded X existing messages from conversation ...
```

**Expected Logs for Sending Messages:**
```
Sending message to chat service...
db.addChatMessage called with: {id: "...", role: "user", ...}
Message added to database successfully
Received response from chat service: [...]
db.addChatMessage called with: {id: "...", role: "assistant", ...}
Message added to database successfully
Updated messages with assistant response
```

### **Step 3: Identify Missing Logs**

**If you don't see any logs:**
- Check if JavaScript is enabled
- Verify no console errors are blocking execution
- Check if the development server is running

**If you see partial logs:**
- Note which logs are missing
- Check the specific step that's failing
- Look for error messages in the logs

## 🛠️ **Quick Fixes**

### **Fix 1: Clear Browser Data**
1. **Open DevTools** (F12)
2. **Go to Application tab**
3. **Click "Clear storage"**
4. **Refresh page** and test again

### **Fix 2: Check IndexedDB**
1. **Open DevTools** (F12)
2. **Go to Application tab**
3. **Expand "IndexedDB"**
4. **Check if "SmartResearchDB" exists**
5. **Verify tables: conversations, chatMessages**

### **Fix 3: Restart Development Server**
```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

### **Fix 4: Check API Key**
```bash
# Run setup script
npm run setup:env

# Or manually check .env.local
cat .env.local
```

## 📊 **Testing Commands**

### **Run All Tests:**
```bash
# Comprehensive test
npm run test:chat

# Database operations test
npm run test:db-ops

# Quick database test
npm run test:db
```

### **Check Specific Components:**
```bash
# TypeScript compilation
npx tsc --noEmit

# Development server status
curl -s http://localhost:5173 > /dev/null && echo "Server running" || echo "Server not responding"
```

## 🎯 **Success Criteria**

**Chat functionality is working correctly when:**

1. ✅ **New conversations** show welcome message
2. ✅ **Sending messages** shows "🤔 Thinking..." then response
3. ✅ **Console logs** show database operations
4. ✅ **Closing and reopening** chat loads previous messages
5. ✅ **Message counter** shows conversation length
6. ✅ **"New Chat" button** appears for existing conversations
7. ✅ **No yellow warning** banners about API key

## 🆘 **If Still Not Working**

**If you're still experiencing issues after following this guide:**

1. **Check the exact error messages** in browser console
2. **Note which specific logs are missing**
3. **Test with different research links**
4. **Try in incognito/private browser mode**
5. **Check if the issue is consistent or intermittent**

**Provide these details for further troubleshooting:**
- Browser and version
- Exact console logs (or lack thereof)
- Steps to reproduce the issue
- Whether it's consistent or intermittent
- Any error messages displayed

---

**The chat functionality has been thoroughly tested and should work correctly. If issues persist, the problem is likely related to browser-specific settings or network connectivity.** 