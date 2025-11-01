/**
 * Centralized logging utility
 * Replaces console.error with structured logging
 * In production, this can be connected to logging services (Sentry, LogRocket, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  component?: string
  action?: string
  userId?: string
  metadata?: Record<string, unknown>
}

class Logger {
  private isDevelopment = import.meta.env.DEV

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): string {
    const timestamp = new Date().toISOString()
    const contextStr = context
      ? `[${context.component || 'App'}${context.action ? `::${context.action}` : ''}]`
      : '[App]'

    return `[${timestamp}] [${level.toUpperCase()}] ${contextStr} ${message}`
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (!this.isDevelopment && (level === 'debug' || level === 'info')) {
      return false
    }
    return true
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return
    console.debug(this.formatMessage('debug', message, context))
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return
    console.info(this.formatMessage('info', message, context))
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog('warn')) return
    console.warn(this.formatMessage('warn', message, context, error), error)
  }

  private extractErrorMessage(error: unknown): string {
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

  error(message: string, context?: LogContext, error?: Error | unknown): void {
    // Always log errors
    const errorMsg = error ? this.extractErrorMessage(error) : ''
    const fullMessage = errorMsg ? `${message}: ${errorMsg}` : message
    
    // Log message first on its own line so it's always visible
    console.error(this.formatMessage('error', fullMessage, context, error instanceof Error ? error : undefined))
    
    // If error is provided, log it separately with full details
    // Use separate console.error calls so browsers don't collapse them
    if (error) {
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        })
      } else {
        console.error('Error object:', error)
      }
    }
    
    // In production, send to error tracking service
    if (!this.isDevelopment && error instanceof Error) {
      // TODO: Integrate with error tracking service (e.g., Sentry)
      // Sentry.captureException(error, { extra: context })
    }
  }
}

export const logger = new Logger()

