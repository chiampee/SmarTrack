import React from 'react';
import { AlertCircle } from 'lucide-react';
import { AUTH_ENABLED } from '../config/auth0';

export const DevModeBanner: React.FC = () => {
  // Only show in development mode
  if (AUTH_ENABLED) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-yellow-500 text-yellow-900 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-semibold">
      <AlertCircle className="w-4 h-4" />
      <span>Development Mode - Auth Disabled</span>
    </div>
  );
};

