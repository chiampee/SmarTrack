import React, { useState, useEffect } from 'react';
import { chatService } from '../services/chatService';
import { ChatMessage } from '../types/ChatMessage';
import { Conversation } from '../types/Conversation';
import { Link } from '../types/Link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const ChatHistoryPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const convs = await chatService.getAllConversations();
        setConversations(convs);
        if (convs.length > 0) {
          setSelectedConversation(convs[0]);
          const msgs = await chatService.getMessages(convs[0].id);
          setMessages(msgs);
          
          // Load links for the conversation
          const linkPromises = convs[0].linkIds.map((id: string) => 
            import('../db/smartResearchDB').then(db => db.db.getLink(id))
          );
          const loadedLinks = await Promise.all(linkPromises);
          setLinks(loadedLinks.filter(Boolean) as Link[]);
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadConversations();
  }, []);

  const handleConversationSelect = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    try {
      const msgs = await chatService.getMessages(conversation.id);
      setMessages(msgs);
      
      // Load links for the selected conversation
      const linkPromises = conversation.linkIds.map((id: string) => 
        import('../db/smartResearchDB').then(db => db.db.getLink(id))
      );
      const loadedLinks = await Promise.all(linkPromises);
      setLinks(loadedLinks.filter(Boolean) as Link[]);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Chat History</h1>
      
      {conversations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No chat conversations found.</p>
        </div>
      ) : (
        <>
          {/* Conversation List */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <h2 className="text-lg font-semibold mb-4">Conversations</h2>
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {links.find(l => l.id === conversation.linkIds[0])?.metadata?.title || 'Untitled'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(conversation.startedAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="lg:col-span-3">
              <h2 className="text-lg font-semibold mb-4">Messages</h2>
              {selectedConversation && (
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
                            {message.role === 'assistant' ? (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm as any]}
                                className="prose prose-sm max-w-none 
                                  prose-headings:text-gray-900 prose-headings:font-semibold prose-headings:mb-2 prose-headings:mt-4
                                  prose-h1:text-lg prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-1
                                  prose-h2:text-base prose-h2:text-gray-800
                                  prose-h3:text-sm prose-h3:text-gray-700
                                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-3
                                  prose-strong:text-gray-900 prose-strong:font-semibold
                                  prose-em:text-gray-600 prose-em:italic
                                  prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
                                  prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-lg prose-pre:p-3 prose-pre:overflow-x-auto
                                  prose-blockquote:border-l-4 prose-blockquote:border-blue-200 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
                                  prose-ul:list-disc prose-ul:pl-5 prose-ul:space-y-1
                                  prose-ol:list-decimal prose-ol:pl-5 prose-ol:space-y-1
                                  prose-li:text-gray-700 prose-li:leading-relaxed
                                  prose-hr:border-gray-200 prose-hr:my-4
                                  prose-a:text-blue-600 prose-a:underline prose-a:decoration-blue-300 prose-a:underline-offset-2
                                  prose-table:border-collapse prose-table:w-full prose-table:my-4
                                  prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold
                                  prose-td:border prose-td:border-gray-300 prose-td:px-3 prose-td:py-2
                                  [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                              >
                                {message.content}
                              </ReactMarkdown>
                            ) : (
                              <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                            )}
                            <div className={`text-xs mt-2 ${
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
          </div>
        </>
      )}
    </div>
  );
}; 