/**
 * Rate Limit Banner Component
 * 
 * Shows a visual indicator when user is approaching or has hit rate limits.
 * PRODUCTION ONLY: Only renders on Vercel, hidden in local development.
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { useRateLimit } from '../hooks/useRateLimit';
import { RATE_LIMIT_ENABLED } from '../services/rateLimitService';

interface Props {
  operation: string;
  warningThreshold?: number; // Show warning when remaining < threshold (default: 3)
}

export const RateLimitBanner: React.FC<Props> = ({ 
  operation, 
  warningThreshold = 3 
}) => {
  const { getStatus } = useRateLimit();
  const [status, setStatus] = useState(getStatus(operation));
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    // Only update in production
    if (!RATE_LIMIT_ENABLED) return;

    const updateStatus = () => {
      const newStatus = getStatus(operation);
      setStatus(newStatus);

      if (!newStatus.allowed || newStatus.remaining < warningThreshold) {
        const secondsLeft = Math.ceil((newStatus.resetTime - Date.now()) / 1000);
        if (secondsLeft > 0) {
          const minutes = Math.floor(secondsLeft / 60);
          const seconds = secondsLeft % 60;
          setTimeLeft(minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`);
        }
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [operation, getStatus, warningThreshold]);

  // Don't show in development
  if (!RATE_LIMIT_ENABLED) {
    return null;
  }

  // Don't show if user has plenty of requests left
  if (status.remaining >= warningThreshold && status.allowed) {
    return null;
  }

  // Rate limit exceeded
  if (!status.allowed) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">
            Rate Limit Reached
          </p>
          <p className="text-sm text-red-600 mt-1">
            You've reached the maximum rate for this operation. 
            Please wait <strong>{timeLeft}</strong> before trying again.
          </p>
        </div>
        <Clock className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
      </div>
    );
  }

  // Warning - approaching limit
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-yellow-800">
          Approaching Rate Limit
        </p>
        <p className="text-sm text-yellow-600 mt-1">
          You have <strong>{status.remaining}</strong> requests remaining. 
          Limit resets in <strong>{timeLeft}</strong>.
        </p>
      </div>
    </div>
  );
};

