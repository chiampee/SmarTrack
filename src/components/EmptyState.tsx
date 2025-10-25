import React from 'react';
import { Button } from './Button';
import { BookOpen, Link, Plus, MessageSquare, Search, Settings } from 'lucide-react';

interface EmptyStateProps {
  type: 'links' | 'boards' | 'tasks' | 'chat' | 'search';
  onAction?: () => void;
  actionLabel?: string;
  showOnboarding?: boolean;
  onShowOnboarding?: () => void;
}

const emptyStateConfig = {
  links: {
    icon: <Link className="w-12 h-12 text-gray-400" />,
    title: "No research links yet",
    description: "Start building your research collection by saving web pages.",
    tips: [
      "Use the browser extension to save pages with one click",
      "Add labels to organize your research by topic",
      "Set priorities to focus on important content",
      "Use AI summaries to quickly understand key points"
    ],
    actionIcon: <Plus className="w-4 h-4" />,
    defaultAction: "Add Your First Link"
  },
  boards: {
    icon: <BookOpen className="w-12 h-12 text-gray-400" />,
    title: "No boards yet",
    description: "Create boards to organize your research into projects or topics.",
    tips: [
      "Create boards for different research projects",
      "Group related links together",
      "Use boards to track progress on specific topics",
      "Share board ideas with collaborators"
    ],
    actionIcon: <Plus className="w-4 h-4" />,
    defaultAction: "Create Your First Board"
  },
  tasks: {
    icon: <MessageSquare className="w-12 h-12 text-gray-400" />,
    title: "No tasks yet",
    description: "Create tasks to track research goals and follow-up actions.",
    tips: [
      "Create tasks for research questions you want to answer",
      "Set due dates to keep your research on track",
      "Link tasks to specific research links",
      "Use tasks to plan your next research steps"
    ],
    actionIcon: <Plus className="w-4 h-4" />,
    defaultAction: "Add Your First Task"
  },
  chat: {
    icon: <MessageSquare className="w-12 h-12 text-gray-400" />,
    title: "No chat history",
    description: "Start conversations with your research to get AI-powered insights.",
    tips: [
      "Select links and click the chat icon to start a conversation",
      "Ask questions about specific research topics",
      "Get AI summaries and insights from your saved content",
      "Use chat to explore connections between different sources"
    ],
    actionIcon: <MessageSquare className="w-4 h-4" />,
    defaultAction: "Start Your First Chat"
  },
  search: {
    icon: <Search className="w-12 h-12 text-gray-400" />,
    title: "No search results",
    description: "Try adjusting your search terms or filters.",
    tips: [
      "Use broader search terms",
      "Check your filter settings",
      "Try searching by labels or status",
      "Make sure you have some links saved first"
    ],
    actionIcon: <Search className="w-4 h-4" />,
    defaultAction: "Clear Filters"
  }
};

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  type, 
  onAction, 
  actionLabel,
  showOnboarding = false,
  onShowOnboarding
}) => {
  const config = emptyStateConfig[type];

  return (
    <div className="py-12 px-6 text-center">
      {/* Enhanced Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center shadow-lg">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-xl">
            {React.cloneElement(config.icon, { className: "w-5 h-5 text-white" })}
          </div>
        </div>
      </div>
      
      {/* Enhanced Title */}
      <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
        {config.title}
      </h3>
      
      {/* Enhanced Description */}
      <p className="text-sm text-gray-600 max-w-md mx-auto mb-6 leading-relaxed">
        {config.description}
      </p>

      {/* Enhanced Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
        {onAction && (
          <Button 
            onClick={onAction}
            className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            {React.cloneElement(config.actionIcon, { className: "w-4 h-4 group-hover:scale-110 transition-transform duration-300" })}
            {actionLabel || config.defaultAction}
          </Button>
        )}
        
        {showOnboarding && onShowOnboarding && (
          <Button 
            variant="secondary"
            onClick={onShowOnboarding}
            className="group inline-flex items-center gap-2 px-6 py-3 bg-white/80 hover:bg-white border border-gray-200/60 hover:border-gray-300 text-gray-700 hover:text-gray-900 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
          >
            <Settings className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
            Show Setup Guide
          </Button>
        )}
      </div>

      {/* Enhanced Tips section */}
      <div className="max-w-xl mx-auto">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-xl p-4 shadow-md backdrop-blur-sm">
          <h4 className="text-sm font-semibold text-blue-900 mb-4 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            Quick Tips
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
          </h4>
          <div className="grid md:grid-cols-2 gap-3 text-left">
            {config.tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-white/60 rounded-lg border border-white/40">
                <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">{index + 1}</span>
                </div>
                <span className="text-xs text-gray-700 font-medium">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Keyboard shortcuts hint */}
      {type === 'links' && (
        <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-slate-100 border border-gray-200/60 rounded-2xl max-w-md mx-auto shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">💡</span>
            </div>
            <p className="text-sm font-semibold text-gray-800">Pro tip</p>
          </div>
          <p className="text-sm text-gray-600">
            Press <kbd className="bg-white px-2 py-1 rounded-lg text-xs font-mono border border-gray-200 shadow-sm">⌘K</kbd> to quickly add a link, 
            or <kbd className="bg-white px-2 py-1 rounded-lg text-xs font-mono border border-gray-200 shadow-sm">/</kbd> to search.
          </p>
        </div>
      )}
    </div>
  );
}; 