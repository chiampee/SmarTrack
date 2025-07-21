import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';

export const WelcomeBanner: React.FC = () => {
  const { setShowOnboarding } = useSettingsStore();

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              Welcome to Smart Research Tracker!
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              Your AI-powered research companion is ready to help you save, organize, and chat with web content.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowOnboarding(true)}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Get Started Guide
              </button>
              <button
                onClick={() => setShowOnboarding(true)}
                className="text-xs text-blue-700 hover:text-blue-900 font-medium hover:underline"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
        <button
          className="flex-shrink-0 text-blue-400 hover:text-blue-600 transition-colors"
          aria-label="Dismiss welcome banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}; 