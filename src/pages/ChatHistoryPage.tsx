import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PastChatsSidebar } from '../components/ai/PastChatsSidebar';
import { Conversation } from '../types/Conversation';
import { chatService } from '../services/chatService';
import { ChatMessage } from '../types/ChatMessage';
import { LoadingSpinner } from '../components';
import { X, ArrowLeft } from 'lucide-react';

export const ChatHistoryPage: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSelectConversation = async (conversation: Conversation) => {
    try {
      setLoading(true);
      setSelectedConversation(conversation);
      
      const hist = await chatService.getMessages(conversation.id);
      setMessages(hist.filter((m) => m.role !== 'system'));
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHistory = () => {
    setSelectedConversation(null);
    setMessages([]);
  };

  return (
    <div className="pt-0 px-4 pb-4">
      {!selectedConversation ? (
        // Chat History List View
        <div className="max-w-4xl">
          <PastChatsSidebar
            onSelect={handleSelectConversation}
            selectedId={undefined}
          />
        </div>
      ) : (
        // Individual Conversation View
        <>
          <div className="mb-4">
            <button
              onClick={handleBackToHistory}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>
          
          <div className="max-w-4xl">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No messages
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`rounded-lg px-3 py-2 max-w-[75%] ${
                            message.role === 'user' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          <div className={`text-xs mt-1 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}; 