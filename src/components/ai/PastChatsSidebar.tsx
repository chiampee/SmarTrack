import React, { useEffect, useState } from 'react';
import { Conversation } from '../../types/Conversation';
import { chatService } from '../../services/chatService';
import { db } from '../../db/smartResearchDB';
import { Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  onSelect?: (conversation: Conversation) => void;
  selectedId?: string;
}

export const PastChatsSidebar: React.FC<Props> = ({ onSelect, selectedId }) => {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // conversation id currently awaiting delete confirmation
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Loading conversations...');
        const c = (await chatService.getAllConversations()) as Conversation[];
        console.log('Raw conversations from service:', c);
        
        if (!c || c.length === 0) {
          console.log('No conversations found');
          setConvs([]);
          setLoading(false);
          return;
        }

        // Helper to pick first 4 words
        const firstWords = (txt: string) => {
          const words = txt.trim().split(/\s+/).slice(0, 4);
          return words.join(' ');
        };

        const withTitles = await Promise.all(
          c.map(async (conv) => {
            try {
              console.log('Processing conversation:', conv.id);
              
              // Fetch earliest non-system message to derive topic
              const msgs = await db.chatMessages
                .where('conversationId')
                .equals(conv.id)
                .sortBy('timestamp');
              
              console.log('Messages for conversation', conv.id, ':', msgs.length);
              
              const firstMsg = msgs.find((m) => m.role !== 'system');
              if (!firstMsg) {
                console.log('No non-system messages found for conversation', conv.id, '- deleting empty conversation');
                // delete empty conv silently
                await chatService.deleteConversation(conv.id);
                return null as any;
              }
              
              const base = firstWords(firstMsg.content);
              const title = `${base}, ${conv.linkIds.length} link${conv.linkIds.length === 1 ? '' : 's'}`;
              console.log('Generated title for conversation', conv.id, ':', title);
              
              return { ...conv, __title: title } as any;
            } catch (err) {
              console.error('Error processing conversation', conv.id, ':', err);
              return null;
            }
          }),
        );
        
        const filteredConvs = (withTitles as any).filter(Boolean);
        console.log('Final processed conversations:', filteredConvs);
        
        setConvs(filteredConvs);
      } catch (err) {
        console.error('Error loading conversations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };
    void load();

    // periodic refresh to capture newly created conversations
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-sm text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
        <p className="text-sm text-red-600 mb-2">Error loading chat history</p>
        <p className="text-xs text-gray-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!convs.length) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
        <p className="text-sm text-gray-500">No past chats</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {convs
          .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
          .map((conv) => (
            <div
              key={conv.id}
              className={`relative group rounded-md p-2 transition-colors cursor-pointer ${
                conv.id === selectedId 
                  ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                  : 'bg-white hover:bg-gray-100 border border-gray-200'
              }`}
              onClick={() => {
                if (onSelect) {
                  onSelect(conv);
                } else {
                  localStorage.setItem('openConversationId', conv.id);
                  navigate('/links');
                }
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium mb-1 line-clamp-2 ${
                    conv.id === selectedId ? 'text-blue-900' : 'text-gray-800'
                  }`}>
                    {(conv as any).__title || `${conv.linkIds.length} links`}
                  </div>
                  
                  <div className={`text-xs ${
                    conv.id === selectedId ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {new Date(conv.startedAt).toLocaleDateString()}
                  </div>
                </div>
                
                <button
                  className={`opacity-0 group-hover:opacity-100 transition-colors p-1 rounded ${
                    conv.id === selectedId 
                      ? 'hover:bg-blue-200 text-blue-700' 
                      : 'hover:bg-red-100 text-gray-400 hover:text-red-600'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmId((prev) => (prev === conv.id ? null : conv.id));
                  }}
                >
                  <Trash2 size={10} />
                </button>
              </div>

              {/* confirm popover */}
              {confirmId === conv.id && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 p-2 z-10">
                  <p className="text-xs text-gray-600 mb-2">Delete this conversation?</p>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void chatService.deleteConversation(conv.id);
                        setConfirmId(null);
                      }}
                      className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmId(null);
                      }}
                      className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
      
      {convs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={() => navigate('/chat-history')}
            className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-xs font-medium text-gray-700"
          >
            <ExternalLink size={10} />
            View All
          </button>
        </div>
      )}
    </div>
  );
}; 