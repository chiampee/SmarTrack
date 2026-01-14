/**
 * Centralized Error Handling Utility
 * Provides consistent error handling across the application
 */

export enum ErrorType {
  AUTH_ERROR = 'AUTH_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  API_ERROR = 'API_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
  type: ErrorType
  message: string
  originalError?: Error
  statusCode?: number
  details?: Record<string, any>
  suppressLogging?: boolean // Flag to suppress logging for expected errors
}

/**
 * Create a standardized error object
 */
export function createError(
  type: ErrorType,
  message: string,
  originalError?: Error,
  details?: Record<string, any>
): AppError {
  return {
    type,
    message,
    originalError,
    details,
  }
}

/**
 * Parse error from different sources
 */
export function parseError(error: unknown): AppError {
  // Handle AppError - preserve suppressLogging flag if present
  if (isAppError(error)) {
    return error
  }

  // Handle Error objects
  if (error instanceof Error) {
    // ✅ SECURITY: Safely extract error message (handle cases where message might be an object)
    const errorMessage = typeof error.message === 'string' ? error.message : String(error.message)
    
    // If it's "Authentication required", create error with suppression
    if (errorMessage === 'Authentication required' || errorMessage.includes('Authentication required')) {
      const appError = createError(ErrorType.UNKNOWN_ERROR, errorMessage, error)
      appError.suppressLogging = true
      return appError
    }
    // Check for network errors
    if (errorMessage.includes('fetch') || errorMessage.includes('Network')) {
      return createError(
        ErrorType.NETWORK_ERROR,
        'Network error. Please check your internet connection.',
        error
      )
    }

    // Check for auth errors
    if (errorMessage.includes('auth') || errorMessage.includes('401')) {
      return createError(
        ErrorType.AUTH_ERROR,
        'Authentication failed. Please log in again.',
        error
      )
    }

    // Check for permission errors
    if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
      return createError(
        ErrorType.PERMISSION_DENIED,
        'You do not have permission to perform this action.',
        error
      )
    }

    // Check for rate limit errors
    if (errorMessage.includes('429') || errorMessage.includes('Too many requests') || errorMessage.includes('rate limit')) {
      return createError(
        ErrorType.API_ERROR,
        'Too many requests. Please wait a moment and try again.',
        error,
        { status: 429 }
      )
    }

    // Check for not found errors
    if (errorMessage.includes('404')) {
      return createError(
        ErrorType.NOT_FOUND,
        'The requested resource was not found.',
        error
      )
    }

    // Generic error
    return createError(ErrorType.UNKNOWN_ERROR, errorMessage, error)
  }

  // Handle HTTP Response errors
  if (typeof error === 'object' && error !== null) {
    const err = error as any
    if (err.status || err.statusCode) {
      const status = err.status || err.statusCode
      // ✅ SECURITY: Safely extract message (handle objects, strings, etc.)
      let message = 'An error occurred'
      if (err.message) {
        message = typeof err.message === 'string' ? err.message : String(err.message)
      } else if (err.detail) {
        message = typeof err.detail === 'string' ? err.detail : String(err.detail)
      }
      
      if (status === 401) {
        return createError(ErrorType.AUTH_ERROR, message, undefined, { status })
      }
      if (status === 403) {
        return createError(ErrorType.PERMISSION_DENIED, message, undefined, { status })
      }
      if (status === 429) {
        return createError(ErrorType.API_ERROR, 'Too many requests. Please wait a moment and try again.', undefined, { status })
      }
      if (status === 404) {
        return createError(ErrorType.NOT_FOUND, message, undefined, { status })
      }
      if (status >= 400 && status < 500) {
        return createError(ErrorType.VALIDATION_ERROR, message, undefined, { status })
      }
      if (status >= 500) {
        return createError(ErrorType.API_ERROR, message, undefined, { status })
      }
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    const appError = createError(ErrorType.UNKNOWN_ERROR, error)
    if (error === 'Authentication required' || (typeof error === 'string' && error.includes('Authentication required'))) {
      appError.suppressLogging = true
    }
    return appError
  }

  // Fallback
  return createError(
    ErrorType.UNKNOWN_ERROR,
    'An unexpected error occurred. Please try again.'
  )
}

/**
 * Check if object is AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error
  )
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: AppError): string {
  switch (error.type) {
    case ErrorType.AUTH_ERROR:
      return 'Please log in to continue.'
    case ErrorType.NETWORK_ERROR:
      return 'Unable to connect to the server. Please check your internet connection.'
    case ErrorType.VALIDATION_ERROR:
      return error.message || 'Please check your input and try again.'
    case ErrorType.API_ERROR:
      return 'Server error. Please try again later.'
    case ErrorType.NOT_FOUND:
      return 'The requested item was not found.'
    case ErrorType.PERMISSION_DENIED:
      return 'You do not have permission to perform this action.'
    default:
      return error.message || 'An unexpected error occurred. Please try again.'
  }
}

/**
 * Safely extract error message from unknown error type
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (typeof error === 'object' && error !== null) {
    const err = error as any
    if (err.message) return String(err.message)
    if (err.detail) return String(err.detail)
    if (err.error) return String(err.error)
    try {
      return JSON.stringify(error)
    } catch {
      return 'Unknown error'
    }
  }
  return 'Unknown error'
}

/**
 * Log error to console (and potentially external service)
 */
export function logError(error: AppError, context?: string): void {
  // Skip logging if explicitly suppressed (check FIRST before any other logic)
  if (error.suppressLogging === true) {
    return
  }

  const timestamp = new Date().toISOString()
  const errorMessage = error.message || extractErrorMessage(error.originalError) || 'Unknown error'
  const contextStr = context ? `[${context}]` : ''
  
  // Suppress "Authentication required" errors during initial load (expected behavior)
  // They occur when components mount before token is fetched or when user is not authenticated
  // Check multiple ways the error message might appear
  const isAuthRequiredError = error.message === 'Authentication required' || 
                               error.message?.includes('Authentication required') ||
                               errorMessage === 'Authentication required' ||
                               errorMessage?.includes('Authentication required')
  
  // Aggressively suppress ALL "Authentication required" errors - they're expected during initialization
  if (isAuthRequiredError) {
    // Silently suppress - these are expected during initialization
    // Only log in development at debug level for troubleshooting
    if (import.meta.env.DEV) {
      console.debug(`[Auth] Authentication required${contextStr} - this is expected during initialization`)
    }
    return
  }
  
  // Log to console with proper serialization - use multiple console.error calls
  // so browsers don't collapse them into just "Object"
  console.error(`[Error]${contextStr} ${errorMessage}`)
  console.error('Error details:', {
    type: error.type,
    message: errorMessage,
    details: error.details,
    originalError: error.originalError?.message,
    stack: error.originalError?.stack,
    timestamp,
  })

  // In production, send to error tracking service (e.g., Sentry)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to Sentry or other error tracking service
    // Sentry.captureException(error.originalError || new Error(error.message), {
    //   contexts: { app: { type: error.type, message: errorMessage, details: error.details } },
    // })
  }
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args)
    } catch (error) {
      const appError = parseError(error)
      logError(appError, context)
      throw appError
    }
  }) as T
}
