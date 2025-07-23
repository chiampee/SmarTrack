import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from '../../types/Link';
import { aiService, ChatMessage as AIChatMessage } from '../../services/aiService';
import { chatService } from '../../services/chatService';
import { ChatMessage } from '../../types/ChatMessage';
import { Conversation } from '../../types/Conversation';
import { useNavigate } from 'react-router-dom';
import { aiSummaryService } from '../../services/aiSummaryService';
import { LoadingSpinner, Button } from '..';
import { ErrorBanner } from '../ErrorBanner';
import { RefreshCcw, Edit3, Check, X as XIcon, Copy, Check as CheckIcon, Plus, Settings } from 'lucide-react';
import { getPageText } from '../../utils/pageCache';

interface Props {
  links: Link[];
  onClose: () => void;
}

interface LocalMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface CustomPrompt {
  id: string;
  name: string;
  content: string;
}

export const MultiChatPanel: React.FC<Props> = ({ links, onClose }) => {
  const [messages, setMessages] = useState<LocalMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [contextReady, setContextReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const navigate = useNavigate();
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>([]);
  const [showPromptManager, setShowPromptManager] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<CustomPrompt | null>(null);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');

  // Load custom prompts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('customPrompts');
    if (saved) {
      try {
        setCustomPrompts(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to load custom prompts:', err);
      }
    }
  }, []);

  // Save custom prompts to localStorage
  const saveCustomPrompts = (prompts: CustomPrompt[]) => {
    localStorage.setItem('customPrompts', JSON.stringify(prompts));
    setCustomPrompts(prompts);
  };

  const buildContext = async (selectedLinks: Link[]) => {
    setContextReady(false);
    setError(null);
    let conv: Conversation | null = null;
    try {
      conv = await chatService.startConversation(selectedLinks.map((l) => l.id));
      setConversation(conv);
      const hist = await chatService.getMessages(conv.id);
      setMessages(
        hist
          .filter((m) => m.role !== 'system')
          .map((m) => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content }))
      );
    } catch (err: any) {
      console.error('Failed to start conversation', err);
      setError(err.message || 'Failed to start conversation. Please try again.');
    }

    let ctx = 'You are a helpful research assistant. The user selected multiple pages. Use the info below. Respond in the same language that the user uses in their question, unless they explicitly request a different language.\n';
    setSystemPrompt(ctx);
    await Promise.all(
      selectedLinks.map(async (link) => {
        ctx += '----\n';
        ctx += `URL: ${link.url}\n`;
        if (link.metadata?.title) ctx += `Title: ${link.metadata.title}\n`;
        if (link.metadata?.description) ctx += `Description: ${link.metadata.description}\n`;
        if (link.labels?.length) ctx += `Labels: ${link.labels.join(', ')}\n`;
        // @ts-ignore optional notes
        if (link.notes) ctx += `User notes: ${link.notes}\n`;
        try {
          const summaries = await aiSummaryService.getByLink(link.id);
          if (summaries.length) {
            const tldr = summaries.find((s) => s.kind === 'tldr');
            const raw = summaries.find((s) => s.kind === 'raw');
            if (tldr) {
              ctx += `Existing summary: ${tldr.content}\n`;
            } else if (raw) {
              // include first 800 chars of raw text
              ctx += `Page excerpt:\n${raw.content.slice(0, 800)}...\n`;
            }
          }
          // fetch cached page text
          if (!(summaries.find((s) => s.kind === 'raw'))) {
            const text = await getPageText(link.url);
            if (text) {
              const [, ...rest2] = text.split('\n');
              const content = rest2.join('\n').trim().slice(0, 3000);
              ctx += `Page text (truncated):\n${content}\n`;
            }
          }
        } catch {}
      })
    );
    setSystemPrompt(ctx);
    setContextReady(true);
  };

  useEffect(() => {
    void buildContext(links);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [links]);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, autoScroll]);

  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    setAutoScroll(distanceFromBottom < 20);
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };

  if (error) {
    return <ErrorBanner message={error} onRetry={() => { setError(null); void buildContext(links); }} />;
  }

  if (!systemPrompt) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-gray-600 text-sm">Preparing context...</span>
        </div>
        <p className="text-xs text-gray-500">Analyzing {links.length} selected page{links.length === 1 ? '' : 's'}</p>
      </div>
    );
  }

  const send = async (contentOverride?: string) => {
    const content = (contentOverride ?? input).trim();
    if (!content || !conversation || !contextReady) return;
    setLoading(true);
    if (!contentOverride) setInput('');

    setError(null);
    try {
      const userMsg: LocalMsg = { id: crypto.randomUUID(), role: 'user', content };
      const assistantPlaceholder: LocalMsg = { id: crypto.randomUUID(), role: 'assistant', content: '' };
      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);

      const newMsgs = await chatService.sendMessage(conversation, content, (partial) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantPlaceholder.id ? { ...m, content: partial } : m)),
        );
      });

      const finalAssistant = newMsgs.find((m) => m.role === 'assistant');
      if (finalAssistant) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantPlaceholder.id ? { id: finalAssistant.id, role: 'assistant', content: finalAssistant.content } : m,
          ),
        );
      }
    } catch (err: any) {
      console.error('Chat failed', err);
      setError(err.message || 'Chat failed. Please try again.');
    }

    setLoading(false);
  };

  const startEditMessage = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditContent(currentContent);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const saveEdit = async () => {
    if (!editingMessageId || !editContent.trim()) return;
    
    // Update the message content
    setMessages((prev) =>
      prev.map((m) =>
        m.id === editingMessageId ? { ...m, content: editContent.trim() } : m
      )
    );

    // Remove the assistant's response that followed this message
    const messageIndex = messages.findIndex(m => m.id === editingMessageId);
    if (messageIndex !== -1 && messageIndex < messages.length - 1) {
      const nextMessage = messages[messageIndex + 1];
      if (nextMessage.role === 'assistant') {
        setMessages((prev) => prev.filter((_, index) => index <= messageIndex));
      }
    }

    setEditingMessageId(null);
    setEditContent('');

    // Resend the edited message
    await send(editContent.trim());
  };

  const endChat = async () => {
    if (conversation) await chatService.endConversation(conversation.id);
    // reset
    setMessages([]);
    setInput('');
    setSystemPrompt('');
    // rebuild context to start new conversation
    await buildContext(links);
  };

  const defaultPrompts = [
    'Summarise selected pages',
    'Highlight key differences',
    'Aggregate PM insights',
    'Provide pros and cons',
  ];

  const addCustomPrompt = () => {
    if (!newPromptName.trim() || !newPromptContent.trim()) return;
    
    const newPrompt: CustomPrompt = {
      id: crypto.randomUUID(),
      name: newPromptName.trim(),
      content: newPromptContent.trim(),
    };
    
    const updatedPrompts = [...customPrompts, newPrompt];
    saveCustomPrompts(updatedPrompts);
    
    setNewPromptName('');
    setNewPromptContent('');
    setShowPromptManager(false);
  };

  const editCustomPrompt = (prompt: CustomPrompt) => {
    setEditingPrompt(prompt);
    setNewPromptName(prompt.name);
    setNewPromptContent(prompt.content);
    setShowPromptManager(false);
  };

  const saveEditedPrompt = () => {
    if (!editingPrompt || !newPromptName.trim() || !newPromptContent.trim()) return;
    
    const updatedPrompts = customPrompts.map(p => 
      p.id === editingPrompt.id 
        ? { ...p, name: newPromptName.trim(), content: newPromptContent.trim() }
        : p
    );
    saveCustomPrompts(updatedPrompts);
    
    setEditingPrompt(null);
    setNewPromptName('');
    setNewPromptContent('');
  };

  const deleteCustomPrompt = (promptId: string) => {
    const updatedPrompts = customPrompts.filter(p => p.id !== promptId);
    saveCustomPrompts(updatedPrompts);
  };

  const allPrompts = [...defaultPrompts, ...customPrompts.map(p => p.content)];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Simple Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <div>
          <h3 className="font-medium text-gray-900">AI Chat ({links.length} pages)</h3>
          <p className="text-sm text-gray-500">Ask questions about your selected pages</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/chat-history')} 
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Chat History
          </button>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon size={16} />
          </button>
        </div>
      </div>
      
      {/* Quick Prompts */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Quick Prompts</h4>
          <button
            onClick={() => setShowPromptManager(true)}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Settings size={12} />
            Manage
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {allPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => send(prompt)}
              disabled={!contextReady || loading}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                !contextReady || loading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Manager Modal */}
      {showPromptManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-900">Manage Custom Prompts</h3>
              <button
                onClick={() => setShowPromptManager(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon size={16} />
              </button>
            </div>
            
            {/* Add New Prompt */}
            <div className="mb-6 p-4 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Prompt</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Prompt name"
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Prompt content"
                  value={newPromptContent}
                  onChange={(e) => setNewPromptContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={addCustomPrompt}
                    disabled={!newPromptName.trim() || !newPromptContent.trim()}
                    size="sm"
                    className="px-3 py-1.5"
                  >
                    Add Prompt
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setNewPromptName('');
                      setNewPromptContent('');
                    }}
                    size="sm"
                    className="px-3 py-1.5"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            {/* Custom Prompts List */}
            {customPrompts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Custom Prompts</h4>
                <div className="space-y-2">
                  {customPrompts.map((prompt) => (
                    <div key={prompt.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="text-sm font-medium text-gray-900">{prompt.name}</h5>
                        <div className="flex gap-1">
                          <button
                            onClick={() => editCustomPrompt(prompt)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => deleteCustomPrompt(prompt.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <XIcon size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{prompt.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Prompt Modal */}
      {editingPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-900">Edit Prompt</h3>
              <button
                onClick={() => {
                  setEditingPrompt(null);
                  setNewPromptName('');
                  setNewPromptContent('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon size={16} />
              </button>
            </div>
            
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Prompt name"
                value={newPromptName}
                onChange={(e) => setNewPromptName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <textarea
                placeholder="Prompt content"
                value={newPromptContent}
                onChange={(e) => setNewPromptContent(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
              <div className="flex gap-2">
                <Button
                  onClick={saveEditedPrompt}
                  disabled={!newPromptName.trim() || !newPromptContent.trim()}
                  size="sm"
                  className="px-3 py-1.5"
                >
                  Save Changes
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingPrompt(null);
                    setNewPromptName('');
                    setNewPromptContent('');
                  }}
                  size="sm"
                  className="px-3 py-1.5"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Chat Messages */}
        <div
          className="max-h-80 overflow-y-auto space-y-3 mb-4"
          ref={listRef}
          onScroll={handleScroll}
        >
          {messages.length === 0 && contextReady && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">Start a conversation by asking a question or using the quick prompts above.</p>
            </div>
          )}
          
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`rounded-lg px-3 py-2 max-w-[75%] relative group ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {m.role === 'user' && editingMessageId === m.id ? (
                  // Edit mode for user messages
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void saveEdit();
                        }
                        if (e.key === 'Escape') {
                          cancelEdit();
                        }
                      }}
                      className="w-full rounded border border-white/30 bg-white/10 text-white placeholder-white/70 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/50 resize-none text-sm"
                      rows={Math.max(2, editContent.split('\n').length)}
                      placeholder="Edit your message..."
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => void saveEdit()}
                        className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
                      >
                        Save & Resend
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {m.role === 'assistant' ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm as any]}
                        className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:bg-gray-200 prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
                      >
                        {m.content}
                      </ReactMarkdown>
                    ) : (
                      <span className="whitespace-pre-wrap text-sm">{m.content}</span>
                    )}
                    
                    {/* Action buttons for messages */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1">
                      {m.role === 'user' && (
                        <button
                          onClick={() => startEditMessage(m.id, m.content)}
                          className="p-1 bg-white/20 hover:bg-white/30 rounded transition-colors"
                          title="Edit message"
                        >
                          <Edit3 size={10} />
                        </button>
                      )}
                      {m.role === 'assistant' && (
                        <button
                          onClick={() => copyToClipboard(m.content, m.id)}
                          className={`p-1 rounded transition-colors ${
                            copiedMessageId === m.id 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                          }`}
                          title={copiedMessageId === m.id ? "Copied!" : "Copy response"}
                        >
                          {copiedMessageId === m.id ? (
                            <CheckIcon size={10} />
                          ) : (
                            <Copy size={10} />
                          )}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span>AI is thinking...</span>
              </div>
            </div>
          )}
          
          <div ref={bottomRef} />
          
          {!autoScroll && (
            <button
              onClick={() => {
                setAutoScroll(true);
                bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="fixed bottom-20 right-4 bg-blue-600 text-white text-xs rounded px-3 py-2 shadow-lg hover:bg-blue-700 transition-colors"
            >
              Latest
            </button>
          )}
        </div>

        {/* Input Area */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask a question..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none text-sm"
            />
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              onClick={() => send()} 
              disabled={loading || !input.trim() || !contextReady} 
              size="sm"
              className="px-4 py-2"
            >
              {loading ? <LoadingSpinner /> : 'Send'}
            </Button>
            
            <Button
              variant="secondary"
              onClick={endChat}
              disabled={loading}
              size="sm"
              title="End chat & start new"
              className="px-2 py-2"
            >
              <RefreshCcw size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 