import React from 'react';
import { EmptyState } from '../components';
import { PastChatsSidebar } from '../components/ai/PastChatsSidebar';

export const ChatHistoryPage: React.FC = () => {
  return (
    <div className="pt-0 px-4 pb-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Chat History</h1>
        <p className="text-sm text-gray-600 mt-1">
          Review your AI conversations and research insights
        </p>
      </div>
      
      <div className="max-w-2xl">
        <EmptyState 
          type="chat" 
          actionLabel="Go to Links"
        />
      </div>
    </div>
  );
}; 