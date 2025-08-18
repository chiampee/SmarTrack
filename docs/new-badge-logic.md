# New Badge Logic: Stuck Links Detection

## Overview

The Smart Research Tracker extension badge has been updated to show only the count of "stuck" links instead of the total count of all saved links. This provides users with actionable information about potential issues with their saved research.

## What Changed

### Before (Old Logic)
- Badge always showed total count of all links in extension storage
- No indication of whether links were working properly
- Users couldn't tell if there were any issues

### After (New Logic)
- **Red badge with number**: Shows count of "stuck" links
- **Green badge with no number**: All links are working properly
- **No badge**: No links saved or all links cleared

## What Makes a Link "Stuck"

A link is considered "stuck" when:

1. **It exists in extension storage** but **isn't displayed on any dashboard**
2. **Communication issues** between extension and dashboard
3. **Dashboard not running** or not accessible
4. **Data corruption** or sync issues
5. **Extension context invalidation** preventing proper communication

## How It Works

### 1. Stuck Links Detection
The extension periodically checks:
- Total links in `chrome.storage.local`
- Which dashboard tabs are currently open and ready (explicit http/https URL patterns)
- What links each dashboard is actually displaying (via `SRT_GET_DISPLAYED_LINKS`)
- Calculates the difference = stuck links count

### 2. Badge Updates
Badge updates automatically when:
- Links are saved/updated/deleted
- Dashboard data changes
- Every 30 seconds (periodic check)
- Manually triggered via `REFRESH_BADGE` message

### 3. Color Coding
- **🔴 Red**: Indicates problems - links exist but aren't displayed
- **🟢 Green**: All good - no stuck links detected
- **No badge**: No links to worry about

## Technical Implementation

### Background Script (`background.js`)
```javascript
updateBadge() {
  // Count only "stuck" links - links that exist in extension but aren't displayed on dashboard
  this.countStuckLinks().then(stuckCount => {
    const badgeText = stuckCount > 0 ? stuckCount.toString() : '';
    chrome.action.setBadgeText({ text: badgeText });
    
    // Color coding: red for stuck links, green for no issues
    const badgeColor = stuckCount > 0 ? '#ef4444' : '#10b981';
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  });
}
```

### Content Script (`contentScript.js`)
Two response paths are supported for robustness:

1) `chrome.runtime.onMessage` handler with `sendResponse`:
```javascript
case 'SRT_GET_DISPLAYED_LINKS':
  try {
    const currentLinks = __SRT_getLinksSafe();
    sendResponse?.({ links: currentLinks });
  } catch {
    sendResponse?.({ links: [] });
  }
  break;
```

2) `window.postMessage` fallback listener:
```javascript
if (event.data?.type === 'SRT_GET_DISPLAYED_LINKS') {
  try {
    const currentLinks = __SRT_getLinksSafe();
    window.postMessage({ type: 'SRT_DISPLAYED_LINKS_RESPONSE', links: currentLinks }, '*');
  } catch {
    window.postMessage({ type: 'SRT_DISPLAYED_LINKS_RESPONSE', links: [] }, '*');
  }
}
```

## Testing the New Logic

Use the `test-badge-logic.html` page to test various scenarios:

1. **Add Test Links**: See badge turn red with count
2. **Close Dashboard**: Badge stays red (links are "stuck")
3. **Reopen Dashboard**: Badge turns green (no stuck links)
4. **Clear All Links**: Badge disappears (no links)

## Benefits

1. **Actionable Information**: Users know when there are problems
2. **Problem Detection**: Identifies communication or sync issues
3. **Health Monitoring**: Dashboard shows extension health status
4. **Debugging Aid**: Helps identify when links aren't syncing properly

## Troubleshooting

### Badge Always Red
- Check if dashboard is running
- Verify extension permissions
- Check browser console for errors
- Try refreshing the dashboard

### Badge Not Updating
- Use "Force Badge Update" button in test page
- Check extension service worker console
- Verify content script is injected

### Links Not Appearing
- Check if links are actually "stuck" (red badge)
- Verify dashboard communication
- Check IndexedDB/localStorage for data

## Commands

### Manual Badge Refresh
```javascript
chrome.runtime.sendMessage({ type: 'REFRESH_BADGE' });
```

### Get Current Badge Status
```javascript
chrome.runtime.sendMessage({ type: 'GET_LINKS' });
```

## Future Enhancements

1. **Detailed Stuck Link Info**: Show which specific links are stuck
2. **Auto-Recovery**: Automatically attempt to fix stuck links
3. **Notification System**: Alert users when links become stuck
4. **Sync Status**: Show overall extension-dashboard sync health

## Migration Notes

- **No breaking changes** to existing functionality
- **Backward compatible** with existing saved links
- **Automatic detection** of stuck links on next badge update
- **Gradual improvement** as users interact with the extension
