/**
 * Rate Limit Service
 * 
 * Provides client-side rate limiting with user-friendly feedback.
 * Tracks usage per authenticated user across different operations.
 * 
 * SECURITY: This is a CLIENT-SIDE rate limit for UX. 
 * Server-side rate limiting should also be implemented for security.
 * 
 * PRODUCTION ONLY: Rate limits are only enforced on Vercel (production).
 * Local development bypasses all rate limits for convenience.
 */

// Check if we're in production (Vercel)
const isProduction = import.meta.env.PROD && 
  (typeof window !== 'undefined' && (
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('smartracker.vercel.app') ||
    !window.location.hostname.includes('localhost')
  ));

// Enable rate limiting only in production
export const RATE_LIMIT_ENABLED = isProduction;

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message: string;
}

interface RateLimitState {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  message?: string;
}

// Rate limit configurations for different operations
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Link operations
  'link:create': {
    maxRequests: 10,
    windowMs: 60 * 1000, // 10 links per minute
    message: 'You can create up to 10 links per minute. Please wait a moment.',
  },
  'link:update': {
    maxRequests: 30,
    windowMs: 60 * 1000, // 30 updates per minute
    message: 'You can update up to 30 links per minute. Please slow down.',
  },
  'link:delete': {
    maxRequests: 20,
    windowMs: 60 * 1000, // 20 deletes per minute
    message: 'You can delete up to 20 links per minute. Please wait.',
  },
  
  // AI operations
  'ai:chat': {
    maxRequests: 20,
    windowMs: 60 * 1000, // 20 chat messages per minute
    message: 'You can send up to 20 AI messages per minute. Please wait before sending more.',
  },
  'ai:summary': {
    maxRequests: 10,
    windowMs: 60 * 1000, // 10 summaries per minute
    message: 'You can generate up to 10 AI summaries per minute. Please wait.',
  },
  
  // Bulk operations
  'bulk:operation': {
    maxRequests: 5,
    windowMs: 60 * 1000, // 5 bulk operations per minute
    message: 'You can perform up to 5 bulk operations per minute. Please wait.',
  },
  
  // API calls
  'api:request': {
    maxRequests: 100,
    windowMs: 60 * 1000, // 100 API calls per minute
    message: 'You\'ve made too many requests. Please wait a moment.',
  },
};

class RateLimitService {
  private limits: Map<string, Map<string, RateLimitState>> = new Map();

  /**
   * Check if an operation is allowed for a user
   * @param userId - Authenticated user ID
   * @param operation - Operation type (e.g., 'link:create', 'ai:chat')
   * @returns Rate limit result with allowed status and details
   */
  checkLimit(userId: string, operation: string): RateLimitResult {
    // BYPASS: Rate limiting disabled in development
    if (!RATE_LIMIT_ENABLED) {
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: Date.now(),
      };
    }

    const config = RATE_LIMITS[operation];
    
    if (!config) {
      // No rate limit configured for this operation
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: Date.now(),
      };
    }

    const now = Date.now();
    
    // Get or create user's rate limit map
    if (!this.limits.has(userId)) {
      this.limits.set(userId, new Map());
    }
    
    const userLimits = this.limits.get(userId)!;
    const state = userLimits.get(operation);
    
    // No previous requests or window expired
    if (!state || now > state.resetTime) {
      userLimits.set(operation, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs,
      };
    }
    
    // Check if limit exceeded
    if (state.count >= config.maxRequests) {
      const retryAfter = Math.ceil((state.resetTime - now) / 1000);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: state.resetTime,
        retryAfter,
        message: config.message,
      };
    }
    
    // Increment counter
    state.count++;
    
    return {
      allowed: true,
      remaining: config.maxRequests - state.count,
      resetTime: state.resetTime,
    };
  }

  /**
   * Reset rate limits for a specific user and operation
   */
  reset(userId: string, operation?: string): void {
    if (!operation) {
      // Reset all operations for user
      this.limits.delete(userId);
      return;
    }
    
    const userLimits = this.limits.get(userId);
    if (userLimits) {
      userLimits.delete(operation);
    }
  }

  /**
   * Get current usage status for a user and operation
   */
  getStatus(userId: string, operation: string): RateLimitResult {
    // BYPASS: Rate limiting disabled in development
    if (!RATE_LIMIT_ENABLED) {
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: Date.now(),
      };
    }

    const config = RATE_LIMITS[operation];
    
    if (!config) {
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: Date.now(),
      };
    }

    const userLimits = this.limits.get(userId);
    if (!userLimits) {
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs,
      };
    }

    const state = userLimits.get(operation);
    if (!state || Date.now() > state.resetTime) {
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs,
      };
    }

    return {
      allowed: state.count < config.maxRequests,
      remaining: Math.max(0, config.maxRequests - state.count),
      resetTime: state.resetTime,
    };
  }

  /**
   * Clean up expired rate limit entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [userId, userLimits] of this.limits.entries()) {
      for (const [operation, state] of userLimits.entries()) {
        if (now > state.resetTime) {
          userLimits.delete(operation);
        }
      }
      
      // Remove user entry if no operations left
      if (userLimits.size === 0) {
        this.limits.delete(userId);
      }
    }
  }
}

// Singleton instance
export const rateLimitService = new RateLimitService();

// Cleanup expired entries every minute (only in production)
if (typeof window !== 'undefined' && RATE_LIMIT_ENABLED) {
  setInterval(() => {
    rateLimitService.cleanup();
  }, 60 * 1000);
  
  console.log('🔒 [Rate Limit] Enabled for production environment');
} else if (typeof window !== 'undefined') {
  console.log('🔓 [Rate Limit] Disabled for development environment');
}

/**
 * Error class for rate limit violations
 */
export class RateLimitError extends Error {
  constructor(
    public result: RateLimitResult,
    message?: string
  ) {
    super(message || result.message || 'Rate limit exceeded');
    this.name = 'RateLimitError';
  }
}

