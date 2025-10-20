import React from 'react';
import { Link, MessageSquare, Settings, Download, BookOpen } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { downloadTrackingService } from '../services/downloadTrackingService';
import { useAuth } from '../contexts/AuthContext';

interface QuickStartStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: string;
  onClick?: () => void;
}

export const QuickStartGuide: React.FC = () => {
  const { user } = useAuth();
  const { setShowOnboarding } = useSettingsStore();

  const steps: QuickStartStep[] = [
    {
      icon: <Download className="w-5 h-5 text-blue-600" />,
      title: "Install Extension",
      description: "Download and install the Chrome extension to save pages with one click",
      action: "Download Extension",
      onClick: async () => {
        await downloadTrackingService.trackQuickstartDownload(user?.sub);
        window.open('https://smartracker.vercel.app/downloads/SmartResearchTracker-extension-v1.0.3.zip', '_blank');
      }
    },
    {
      icon: <Link className="w-5 h-5 text-green-600" />,
      title: "Add Your First Link",
      description: "Start building your collection",
      action: "Add Link"
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-purple-600" />,
      title: "Try AI Chat",
      description: "Ask questions about your research",
      action: "Start Chat"
    },
    {
      icon: <BookOpen className="w-5 h-5 text-orange-600" />,
      title: "Create a Board",
      description: "Organize by project or topic",
      action: "New Board"
    }
  ];

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
        <Settings className="w-4 h-4" />
        Quick Start Guide
      </h3>
      
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {step.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900">{step.title}</h4>
              <p className="text-xs text-gray-600 mt-0.5">{step.description}</p>
              {step.action && (
                <button
                  onClick={step.onClick}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 hover:underline"
                >
                  {step.action} →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-blue-200">
        <button
          onClick={() => setShowOnboarding(true)}
          className="text-xs text-blue-700 hover:text-blue-900 font-medium hover:underline"
        >
          View full setup guide →
        </button>
      </div>
    </div>
  );
}; 