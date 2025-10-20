/**
 * useRateLimit Hook
 * 
 * React hook for checking and enforcing rate limits with user feedback
 */

import { useCallback } from 'react';
import { rateLimitService, RateLimitError } from '../services/rateLimitService';
import { useUserId } from './useCurrentUser';

interface UseRateLimitResult {
  /**
   * Check if an operation is allowed
   * @throws RateLimitError if limit exceeded
   */
  checkLimit: (operation: string) => void;
  
  /**
   * Check if an operation is allowed (returns boolean)
   */
  isAllowed: (operation: string) => boolean;
  
  /**
   * Get current status for an operation
   */
  getStatus: (operation: string) => {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  };
}

export function useRateLimit(): UseRateLimitResult {
  const userId = useUserId();

  const checkLimit = useCallback((operation: string) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const result = rateLimitService.checkLimit(userId, operation);
    
    if (!result.allowed) {
      throw new RateLimitError(result);
    }
  }, [userId]);

  const isAllowed = useCallback((operation: string): boolean => {
    if (!userId) return false;
    
    const result = rateLimitService.checkLimit(userId, operation);
    return result.allowed;
  }, [userId]);

  const getStatus = useCallback((operation: string) => {
    if (!userId) {
      return { allowed: false, remaining: 0, resetTime: Date.now() };
    }
    
    return rateLimitService.getStatus(userId, operation);
  }, [userId]);

  return {
    checkLimit,
    isAllowed,
    getStatus,
  };
}

