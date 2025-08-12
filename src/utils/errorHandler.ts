// Comprehensive Error Handling System for Smart Research Tracker

export interface ErrorInfo {
  code: string;
  message: string;
  userMessage: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'network' | 'database' | 'extension' | 'ai' | 'auth' | 'system';
  suggestions: string[];
  retryable: boolean;
}

export class SmartResearchError extends Error {
  public readonly errorInfo: ErrorInfo;
  public readonly originalError?: Error;
  public readonly context?: Record<string, any>;

  constructor(errorInfo: ErrorInfo, originalError?: Error, context?: Record<string, any>) {
    super(errorInfo.message);
    this.name = 'SmartResearchError';
    this.errorInfo = errorInfo;
    this.originalError = originalError;
    this.context = context;
  }
}

// Error definitions for different use cases
export const ERROR_CODES = {
  // Network Errors
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_CORS: 'NETWORK_CORS',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  API_UNAUTHORIZED: 'API_UNAUTHORIZED',
  API_FORBIDDEN: 'API_FORBIDDEN',
  API_NOT_FOUND: 'API_NOT_FOUND',
  API_SERVER_ERROR: 'API_SERVER_ERROR',

  // Database Errors
  DB_INIT_FAILED: 'DB_INIT_FAILED',
  DB_QUOTA_EXCEEDED: 'DB_QUOTA_EXCEEDED',
  DB_CORRUPTED: 'DB_CORRUPTED',
  DB_VERSION_MISMATCH: 'DB_VERSION_MISMATCH',
  DB_READ_FAILED: 'DB_READ_FAILED',
  DB_WRITE_FAILED: 'DB_WRITE_FAILED',

  // Extension Errors
  EXTENSION_NOT_LOADED: 'EXTENSION_NOT_LOADED',
  EXTENSION_PERMISSION_DENIED: 'EXTENSION_PERMISSION_DENIED',
  EXTENSION_CONTENT_SCRIPT_FAILED: 'EXTENSION_CONTENT_SCRIPT_FAILED',
  EXTENSION_BACKGROUND_SCRIPT_FAILED: 'EXTENSION_BACKGROUND_SCRIPT_FAILED',
  EXTENSION_MANIFEST_INVALID: 'EXTENSION_MANIFEST_INVALID',
  EXTENSION_TAB_NOT_ACCESSIBLE: 'EXTENSION_TAB_NOT_ACCESSIBLE',

  // AI Service Errors
  AI_PROVIDER_UNAVAILABLE: 'AI_PROVIDER_UNAVAILABLE',
  AI_API_KEY_INVALID: 'AI_API_KEY_INVALID',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
  AI_MODEL_UNAVAILABLE: 'AI_MODEL_UNAVAILABLE',
  AI_REQUEST_TOO_LARGE: 'AI_REQUEST_TOO_LARGE',
  AI_RESPONSE_INVALID: 'AI_RESPONSE_INVALID',

  // Authentication Errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',

  // System Errors
  SYSTEM_OUT_OF_MEMORY: 'SYSTEM_OUT_OF_MEMORY',
  SYSTEM_DISK_FULL: 'SYSTEM_DISK_FULL',
  SYSTEM_PERMISSION_DENIED: 'SYSTEM_PERMISSION_DENIED',
  SYSTEM_UNSUPPORTED_BROWSER: 'SYSTEM_UNSUPPORTED_BROWSER',
  SYSTEM_UNSUPPORTED_OS: 'SYSTEM_UNSUPPORTED_OS',
} as const;

// Error definitions with user-friendly messages
export const ERROR_DEFINITIONS: Record<string, ErrorInfo> = {
  [ERROR_CODES.NETWORK_OFFLINE]: {
    code: ERROR_CODES.NETWORK_OFFLINE,
    message: 'Network connection is offline',
    userMessage: 'You appear to be offline. Please check your internet connection and try again.',
    severity: 'warning',
    category: 'network',
    suggestions: [
      'Check your internet connection',
      'Try refreshing the page',
      'Check if your firewall is blocking the connection'
    ],
    retryable: true
  },

  [ERROR_CODES.NETWORK_TIMEOUT]: {
    code: ERROR_CODES.NETWORK_TIMEOUT,
    message: 'Network request timed out',
    userMessage: 'The request took too long to complete. This might be due to a slow connection.',
    severity: 'warning',
    category: 'network',
    suggestions: [
      'Check your internet connection speed',
      'Try again in a few moments',
      'Contact support if the problem persists'
    ],
    retryable: true
  },

  [ERROR_CODES.API_RATE_LIMIT]: {
    code: ERROR_CODES.API_RATE_LIMIT,
    message: 'API rate limit exceeded',
    userMessage: 'You\'ve reached the limit for AI requests. Please wait a moment before trying again.',
    severity: 'warning',
    category: 'ai',
    suggestions: [
      'Wait a few minutes before making another request',
      'Consider upgrading your API plan',
      'Use the free AI providers as an alternative'
    ],
    retryable: true
  },

  [ERROR_CODES.API_UNAUTHORIZED]: {
    code: ERROR_CODES.API_UNAUTHORIZED,
    message: 'API key is invalid or missing',
    userMessage: 'Your API key is invalid or has expired. Please check your settings.',
    severity: 'error',
    category: 'ai',
    suggestions: [
      'Check your API key in the settings',
      'Generate a new API key',
      'Use the free AI providers instead'
    ],
    retryable: false
  },

  [ERROR_CODES.DB_INIT_FAILED]: {
    code: ERROR_CODES.DB_INIT_FAILED,
    message: 'Failed to initialize database',
    userMessage: 'Unable to set up the local database. This might be due to browser restrictions.',
    severity: 'error',
    category: 'database',
    suggestions: [
      'Check if private browsing mode is enabled',
      'Clear browser cache and cookies',
      'Try using a different browser',
      'Check browser storage permissions'
    ],
    retryable: true
  },

  [ERROR_CODES.DB_QUOTA_EXCEEDED]: {
    code: ERROR_CODES.DB_QUOTA_EXCEEDED,
    message: 'Database storage quota exceeded',
    userMessage: 'You\'ve reached the storage limit. Please delete some items to free up space.',
    severity: 'warning',
    category: 'database',
    suggestions: [
      'Delete old or unused links',
      'Clear browser cache and cookies',
      'Export your data and start fresh'
    ],
    retryable: false
  },

  [ERROR_CODES.EXTENSION_NOT_LOADED]: {
    code: ERROR_CODES.EXTENSION_NOT_LOADED,
    message: 'Browser extension is not loaded',
    userMessage: 'The Smart Research Tracker extension is not installed or not working properly.',
    severity: 'error',
    category: 'extension',
    suggestions: [
      'Install the browser extension',
      'Reload the extension in chrome://extensions/',
      'Check if the extension is enabled',
      'Try refreshing the page'
    ],
    retryable: true
  },

  [ERROR_CODES.EXTENSION_PERMISSION_DENIED]: {
    code: ERROR_CODES.EXTENSION_PERMISSION_DENIED,
    message: 'Extension permission denied',
    userMessage: 'The extension needs permission to access this page. Please grant the required permissions.',
    severity: 'error',
    category: 'extension',
    suggestions: [
      'Grant permissions when prompted',
      'Check extension permissions in chrome://extensions/',
      'Try refreshing the page',
      'Reinstall the extension if needed'
    ],
    retryable: true
  },

  [ERROR_CODES.AI_PROVIDER_UNAVAILABLE]: {
    code: ERROR_CODES.AI_PROVIDER_UNAVAILABLE,
    message: 'AI provider is currently unavailable',
    userMessage: 'The AI service is temporarily unavailable. Please try again later.',
    severity: 'warning',
    category: 'ai',
    suggestions: [
      'Try again in a few minutes',
      'Use a different AI provider',
      'Check the service status page'
    ],
    retryable: true
  },

  [ERROR_CODES.SYSTEM_UNSUPPORTED_BROWSER]: {
    code: ERROR_CODES.SYSTEM_UNSUPPORTED_BROWSER,
    message: 'Browser is not supported',
    userMessage: 'Your browser is not supported. Please use Chrome, Firefox, Safari, or Edge.',
    severity: 'error',
    category: 'system',
    suggestions: [
      'Update to the latest version of your browser',
      'Try using Chrome or Firefox',
      'Enable JavaScript if it\'s disabled'
    ],
    retryable: false
  },

  [ERROR_CODES.SYSTEM_OUT_OF_MEMORY]: {
    code: ERROR_CODES.SYSTEM_OUT_OF_MEMORY,
    message: 'System is running out of memory',
    userMessage: 'Your system is running low on memory. Please close some applications and try again.',
    severity: 'critical',
    category: 'system',
    suggestions: [
      'Close unnecessary browser tabs',
      'Close other applications',
      'Restart your browser',
      'Restart your computer if needed'
    ],
    retryable: true
  }
};

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: Array<{ timestamp: Date; error: SmartResearchError }> = [];

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Create error from error code
  createError(code: string, originalError?: Error, context?: Record<string, any>): SmartResearchError {
    const errorInfo = ERROR_DEFINITIONS[code];
    if (!errorInfo) {
      // Fallback to generic error
      return new SmartResearchError({
        code: 'UNKNOWN_ERROR',
        message: originalError?.message || 'An unknown error occurred',
        userMessage: 'Something went wrong. Please try again.',
        severity: 'error',
        category: 'system',
        suggestions: ['Try refreshing the page', 'Contact support if the problem persists'],
        retryable: true
      }, originalError, context);
    }

    return new SmartResearchError(errorInfo, originalError, context);
  }

  // Handle error with logging and user notification
  handleError(error: Error | SmartResearchError, context?: Record<string, any>): void {
    let smartError: SmartResearchError;

    if (error instanceof SmartResearchError) {
      smartError = error;
    } else {
      // Convert regular error to SmartResearchError
      smartError = this.createError('UNKNOWN_ERROR', error, context);
    }

    // Log the error
    this.logError(smartError);

    // Show user notification
    this.showUserNotification(smartError);

    // Report to analytics (if enabled)
    this.reportError(smartError);
  }

  // Log error for debugging
  private logError(error: SmartResearchError): void {
    const logEntry = {
      timestamp: new Date(),
      error
    };
    this.errorLog.push(logEntry);

    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.error('SmartResearchError:', {
        code: error.errorInfo.code,
        message: error.errorInfo.message,
        userMessage: error.errorInfo.userMessage,
        severity: error.errorInfo.severity,
        category: error.errorInfo.category,
        context: error.context,
        originalError: error.originalError
      });
    }
  }

  // Show user-friendly notification
  private showUserNotification(error: SmartResearchError): void {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `error-notification error-${error.errorInfo.severity}`;
    notification.innerHTML = `
      <div class="error-header">
        <span class="error-icon">${this.getErrorIcon(error.errorInfo.severity)}</span>
        <span class="error-title">${this.getErrorTitle(error.errorInfo.severity)}</span>
        <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="error-message">${error.errorInfo.userMessage}</div>
      ${error.errorInfo.suggestions.length > 0 ? `
        <div class="error-suggestions">
          <strong>Suggestions:</strong>
          <ul>
            ${error.errorInfo.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      ${error.errorInfo.retryable ? `
        <div class="error-actions">
          <button class="error-retry" onclick="window.location.reload()">Try Again</button>
        </div>
      ` : ''}
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto-remove after 10 seconds for non-critical errors
    if (error.errorInfo.severity !== 'critical') {
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 10000);
    }
  }

  // Get error icon based on severity
  private getErrorIcon(severity: string): string {
    switch (severity) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'critical': return '🚨';
      default: return '❓';
    }
  }

  // Get error title based on severity
  private getErrorTitle(severity: string): string {
    switch (severity) {
      case 'info': return 'Information';
      case 'warning': return 'Warning';
      case 'error': return 'Error';
      case 'critical': return 'Critical Error';
      default: return 'Unknown';
    }
  }

  // Report error to analytics (placeholder)
  private reportError(error: SmartResearchError): void {
    // TODO: Implement error reporting to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      console.log('Error reported:', error.errorInfo.code);
    }
  }

  // Get error log for debugging
  getErrorLog(): Array<{ timestamp: Date; error: SmartResearchError }> {
    return [...this.errorLog];
  }

  // Clear error log
  clearErrorLog(): void {
    this.errorLog = [];
  }

  // Check if error is retryable
  isRetryable(error: SmartResearchError): boolean {
    return error.errorInfo.retryable;
  }

  // Get suggestions for error
  getSuggestions(error: SmartResearchError): string[] {
    return error.errorInfo.suggestions;
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions for common error scenarios
export const createNetworkError = (originalError?: Error, context?: Record<string, any>): SmartResearchError => {
  if (!navigator.onLine) {
    return errorHandler.createError(ERROR_CODES.NETWORK_OFFLINE, originalError, context);
  }
  return errorHandler.createError(ERROR_CODES.NETWORK_TIMEOUT, originalError, context);
};

export const createDatabaseError = (originalError?: Error, context?: Record<string, any>): SmartResearchError => {
  if (originalError?.name === 'QuotaExceededError') {
    return errorHandler.createError(ERROR_CODES.DB_QUOTA_EXCEEDED, originalError, context);
  }
  return errorHandler.createError(ERROR_CODES.DB_INIT_FAILED, originalError, context);
};

export const createExtensionError = (originalError?: Error, context?: Record<string, any>): SmartResearchError => {
  return errorHandler.createError(ERROR_CODES.EXTENSION_NOT_LOADED, originalError, context);
};

export const createAIError = (originalError?: Error, context?: Record<string, any>): SmartResearchError => {
  return errorHandler.createError(ERROR_CODES.AI_PROVIDER_UNAVAILABLE, originalError, context);
}; 