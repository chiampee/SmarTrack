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
    <div className="py-16 text-center">
      <div className="flex justify-center mb-6">
        {config.icon}
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {config.title}
      </h3>
      
      <p className="text-sm text-gray-600 max-w-sm mx-auto mb-8">
        {config.description}
      </p>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
        {onAction && (
          <Button 
            onClick={onAction}
            className="inline-flex items-center gap-2"
          >
            {config.actionIcon}
            {actionLabel || config.defaultAction}
          </Button>
        )}
        
        {showOnboarding && onShowOnboarding && (
          <Button 
            variant="secondary"
            onClick={onShowOnboarding}
            className="inline-flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Show Setup Guide
          </Button>
        )}
      </div>

      {/* Tips section */}
      <div className="max-w-md mx-auto">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Tips:</h4>
        <ul className="text-sm text-gray-600 space-y-2 text-left">
          {config.tips.map((tip, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Keyboard shortcuts hint */}
      {type === 'links' && (
        <div className="mt-6 p-3 bg-gray-50 rounded-lg max-w-sm mx-auto">
          <p className="text-xs text-gray-600">
            💡 <strong>Pro tip:</strong> Press <kbd className="bg-white px-1 rounded text-xs">⌘K</kbd> to quickly add a link, 
            or <kbd className="bg-white px-1 rounded text-xs">/</kbd> to search.
          </p>
        </div>
      )}
    </div>
  );
}; 