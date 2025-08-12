# 🔧 Error Handling & User Messages Guide

This guide covers the comprehensive error handling system and user-friendly messages for Smart Research Tracker.

## 🎯 Overview

The error handling system provides:
- **User-friendly error messages** with actionable suggestions
- **Automatic error categorization** by severity and type
- **Retry mechanisms** for recoverable errors
- **Visual notifications** with proper styling
- **Error logging** for debugging

## 📋 Error Categories

### 1. Network Errors
- **Offline detection** - When user loses internet connection
- **Timeout handling** - When requests take too long
- **CORS issues** - Cross-origin request problems
- **API rate limits** - When AI services are rate-limited

### 2. Database Errors
- **Initialization failures** - IndexedDB setup issues
- **Storage quota exceeded** - When local storage is full
- **Data corruption** - When database becomes corrupted
- **Version mismatches** - When database schema changes

### 3. Extension Errors
- **Extension not loaded** - When browser extension is missing
- **Permission denied** - When extension lacks required permissions
- **Content script failures** - When page extraction fails
- **Background script issues** - When extension background processes fail

### 4. AI Service Errors
- **Provider unavailable** - When AI services are down
- **Invalid API keys** - When authentication fails
- **Quota exceeded** - When AI usage limits are reached
- **Model unavailable** - When specific AI models are down

### 5. System Errors
- **Memory issues** - When system runs out of memory
- **Browser compatibility** - When browser doesn't support features
- **Permission issues** - When system permissions are denied

## 🚀 Usage Examples

### Basic Error Handling

```typescript
import { errorHandler, ERROR_CODES } from '../utils/errorHandler';

// Handle a network error
try {
  const response = await fetch('/api/data');
  if (!response.ok) {
    throw new Error('Network request failed');
  }
} catch (error) {
  errorHandler.handleError(error, { endpoint: '/api/data' });
}
```

### Custom Error Creation

```typescript
import { errorHandler, ERROR_CODES } from '../utils/errorHandler';

// Create a specific error
const dbError = errorHandler.createError(
  ERROR_CODES.DB_INIT_FAILED,
  originalError,
  { context: 'database initialization' }
);

// Handle the error
errorHandler.handleError(dbError);
```

### User Messages

```typescript
import { useMessages, USER_MESSAGES } from '../utils/userMessages';

const MyComponent = () => {
  const { showSuccess, showError, showWarning } = useMessages();

  const handleSaveLink = async () => {
    try {
      await saveLink(linkData);
      showSuccess('Link Saved! 💾', 'Your link has been successfully saved.');
    } catch (error) {
      showError('Save Failed', 'There was an error saving your link. Please try again.');
    }
  };

  const handleAIAnalysis = async () => {
    showWarning('AI Processing...', 'This may take a few moments.');
    // ... AI processing
  };
};
```

## 🎨 Message Display

### Message Types

1. **Success Messages** - Green, auto-dismiss after 5 seconds
2. **Info Messages** - Blue, auto-dismiss after 8 seconds
3. **Warning Messages** - Yellow, require user action
4. **Error Messages** - Red, require user action

### Message Actions

Messages can include actionable buttons:

```typescript
const message = {
  id: 'custom_message',
  type: 'warning',
  title: 'Storage Full',
  message: 'Please free up some space.',
  actions: [
    { label: 'Clean Up', action: 'cleanup', primary: true },
    { label: 'Export Data', action: 'export' }
  ]
};
```

## 🔄 Error Recovery

### Automatic Recovery

Some errors can be automatically recovered:

```typescript
// Network errors are automatically retried
if (errorHandler.isRetryable(error)) {
  setTimeout(() => {
    retryOperation();
  }, 2000);
}
```

### Manual Recovery

Users can manually retry operations:

```typescript
const handleRetry = () => {
  // Clear error state
  setError(null);
  // Retry the operation
  performOperation();
};
```

## 📊 Error Monitoring

### Error Logging

All errors are logged for debugging:

```typescript
// Get error log
const errorLog = errorHandler.getErrorLog();

// Clear error log
errorHandler.clearErrorLog();
```

### Error Reporting

Errors can be reported to analytics services:

```typescript
// In production, errors are automatically reported
if (process.env.NODE_ENV === 'production') {
  // Send to error tracking service
  reportErrorToAnalytics(error);
}
```

## 🎯 Use Case Examples

### 1. Extension Installation

```typescript
// Check if extension is loaded
const checkExtension = () => {
  if (!window.chrome?.runtime?.id) {
    showWarning(
      'Extension Required',
      'Please install the Smart Research Tracker extension.',
      {
        actions: [
          { label: 'Install Extension', action: 'install_extension', primary: true },
          { label: 'Learn More', action: 'show_help' }
        ],
        persistent: true
      }
    );
  }
};
```

### 2. AI Service Unavailable

```typescript
const handleAIService = async () => {
  try {
    const result = await callAIService();
    showSuccess('AI Analysis Complete', 'Your content has been analyzed.');
  } catch (error) {
    if (error.code === 'AI_SERVICE_UNAVAILABLE') {
      showWarning(
        'AI Service Unavailable',
        'The AI service is temporarily down. You can still save links without AI features.',
        {
          actions: [
            { label: 'Save Without AI', action: 'save_without_ai', primary: true },
            { label: 'Try Again Later', action: 'retry_later' }
          ]
        }
      );
    }
  }
};
```

### 3. Storage Management

```typescript
const handleStorageFull = () => {
  showError(
    'Storage Full',
    'Your local storage is full. Please delete some items or export your data.',
    {
      actions: [
        { label: 'Manage Storage', action: 'manage_storage', primary: true },
        { label: 'Export All', action: 'export_all' }
      ],
      persistent: true
    }
  );
};
```

### 4. Network Connectivity

```typescript
// Monitor network status
window.addEventListener('online', () => {
  showSuccess('Connection Restored! 🌐', 'Your internet connection has been restored.');
});

window.addEventListener('offline', () => {
  showWarning(
    'Working Offline',
    'You\'re currently offline. Some features may be limited.',
    {
      actions: [
        { label: 'Check Connection', action: 'check_connection' }
      ]
    }
  );
});
```

## 🎨 Styling

### Error Notification Styles

Error notifications are styled with:
- **Color-coded borders** based on severity
- **Smooth animations** for appearance/disappearance
- **Responsive design** for mobile devices
- **Dark mode support** for accessibility
- **High contrast mode** for accessibility

### CSS Classes

```css
.error-notification.error-info { /* Blue styling */ }
.error-notification.error-warning { /* Yellow styling */ }
.error-notification.error-error { /* Red styling */ }
.error-notification.error-critical { /* Dark red styling */ }
```

## 🔧 Configuration

### Error Handler Configuration

```typescript
// Configure error handler
const errorHandler = ErrorHandler.getInstance();

// Set custom error definitions
errorHandler.addErrorDefinition('CUSTOM_ERROR', {
  code: 'CUSTOM_ERROR',
  message: 'Custom error message',
  userMessage: 'User-friendly message',
  severity: 'warning',
  category: 'system',
  suggestions: ['Suggestion 1', 'Suggestion 2'],
  retryable: true
});
```

### Message Configuration

```typescript
// Configure message display
const messageConfig = {
  position: 'top-right', // or 'top-left', 'bottom-right', etc.
  maxMessages: 5, // Maximum number of messages to show
  autoDismiss: true, // Enable auto-dismiss
  persistent: false // Allow persistent messages
};
```

## 🧪 Testing

### Error Testing

```typescript
// Test error handling
const testErrorHandling = () => {
  // Simulate network error
  const networkError = errorHandler.createError(ERROR_CODES.NETWORK_OFFLINE);
  errorHandler.handleError(networkError);

  // Simulate database error
  const dbError = errorHandler.createError(ERROR_CODES.DB_INIT_FAILED);
  errorHandler.handleError(dbError);
};
```

### Message Testing

```typescript
// Test message display
const testMessages = () => {
  showSuccess('Test Success', 'This is a success message');
  showInfo('Test Info', 'This is an info message');
  showWarning('Test Warning', 'This is a warning message');
  showError('Test Error', 'This is an error message');
};
```

## 📚 Best Practices

1. **Always provide actionable suggestions** in error messages
2. **Use appropriate severity levels** for different error types
3. **Implement retry mechanisms** for recoverable errors
4. **Log errors for debugging** but show user-friendly messages
5. **Test error scenarios** thoroughly
6. **Consider accessibility** in error message design
7. **Provide fallback options** when services are unavailable

## 🆘 Troubleshooting

### Common Issues

1. **Messages not appearing** - Check z-index and positioning
2. **Auto-dismiss not working** - Verify autoDismiss property
3. **Actions not responding** - Check action handler implementation
4. **Styling issues** - Verify CSS is loaded correctly

### Debug Mode

Enable debug mode for detailed error information:

```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('Error details:', error);
  console.log('Error log:', errorHandler.getErrorLog());
}
```

---

**Need help?** Check the error log or contact support with error details! 🚀 