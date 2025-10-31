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

  error(message: string, context?: LogContext, error?: Error): void {
    // Always log errors
    console.error(this.formatMessage('error', message, context, error), error)
    
    // In production, send to error tracking service
    if (!this.isDevelopment && error) {
      // TODO: Integrate with error tracking service (e.g., Sentry)
      // Sentry.captureException(error, { extra: context })
    }
  }
}

export const logger = new Logger()

