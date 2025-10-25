import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import { RefreshCcw, Edit3, Check, X as XIcon, Copy, Check as CheckIcon, Plus, Settings, Key } from 'lucide-react';
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
  console.log('MultiChatPanel rendered with links:', links);
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
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [isInitialized, setIsInitialized] = useState(false);

  // Debug conversation state
  console.log('Current conversation state:', conversation);
  console.log('Current messages state:', messages);
  console.log('Buttons should be visible:', !!conversation);

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

  // Initialize chat when component mounts (only once)
  useEffect(() => {
    if (links && links.length > 0 && !isInitialized) {
      console.log('Initializing chat with links:', links);
      setIsInitialized(true);
      void buildContext(links);
    } else if (!links || links.length === 0) {
      console.log('No links provided for chat initialization');
    }
  }, [links, isInitialized]); // Only run when links change and not already initialized

  // Save custom prompts to localStorage
  const saveCustomPrompts = (prompts: CustomPrompt[]) => {
    localStorage.setItem('customPrompts', JSON.stringify(prompts));
    setCustomPrompts(prompts);
  };

  const buildContext = useCallback(async (selectedLinks: Link[], forceNew = false) => {
    setContextReady(false);
    setError(null);
    setInput(''); // Clear input field
    setEditingMessageId(null); // Clear any editing state
    setEditContent(''); // Clear edit content
    setCopiedMessageId(null); // Clear copy feedback
    
    // Show loading state
    setLoading(true);
    
    let conv: Conversation | null = null;
    try {
      // Check if we have any links selected
      if (!selectedLinks || selectedLinks.length === 0) {
        setError('No links selected. Please select at least one link to start a conversation.');
        setLoading(false);
        return;
      }
      
      // If forcing new conversation, end the current one first
      if (forceNew && conversation) {
        try {
          await chatService.endConversation(conversation.id);
          console.log('Ended previous conversation for new chat');
        } catch (err) {
          console.warn('Failed to end previous conversation:', err);
        }
      }
      
      console.log('Calling chatService.startConversation with linkIds:', selectedLinks.map((l) => l.id));
      conv = await chatService.startConversation(selectedLinks.map((l) => l.id));
      console.log('Received conversation from chatService:', conv);
      setConversation(conv);
      
      // Load existing messages from the conversation
      const existingMessages = await chatService.getMessages(conv.id);
      
      if (existingMessages.length > 0) {
        // Convert database messages to local format, filtering out system messages
        const localMessages: LocalMsg[] = existingMessages
          .filter(msg => msg.role === 'user' || msg.role === 'assistant')
          .map(msg => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          }));
        
        setMessages(localMessages);
        console.log(`Loaded ${existingMessages.length} existing messages from conversation ${conv.id}`);
      } else {
        // This is a new conversation - add welcome message
        const welcomeMsg: LocalMsg = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `🎯 **Research Assistant Ready!**

I'm ready to help you analyze your selected research materials. I have access to ${selectedLinks.length} link${selectedLinks.length === 1 ? '' : 's'}:

${selectedLinks.map((link, index) => `**${index + 1}.** ${link.metadata?.title || link.url}`).join('\n')}

**What would you like to know?** You can ask me to:
- Summarize the key points
- Compare different sources
- Find specific information
- Analyze trends or patterns
- Generate insights and recommendations

Just type your question below! 👇`
        };
        
        setMessages([welcomeMsg]);
        console.log('Started new conversation with welcome message');
      }
      
      setContextReady(true);
      
    } catch (err: any) {
      console.error('Failed to start conversation', err);
      const errorMessage = err.message || 'Failed to start conversation. Please try again.';
      setError(errorMessage);
      
      // Add helpful error message
      const errorMsg: LocalMsg = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `❌ **Unable to start conversation**

${errorMessage}

**Troubleshooting:**
1. Check your internet connection
2. Ensure you have an API key configured
3. Try selecting different links
4. Refresh the page and try again

If the problem persists, use the diagnostic modal to check your configuration.`
      };
      
      setMessages([errorMsg]);
    } finally {
      setLoading(false);
    }

    let ctx = `You are an expert research assistant powered by GPT-4o, designed to help users analyze and understand their research materials. You have access to multiple pages of content that the user has selected.

Your capabilities:
- Analyze and synthesize information from multiple sources
- Provide detailed, well-structured responses
- Identify patterns, connections, and insights across different materials
- Answer questions with depth and accuracy
- Suggest research directions and questions
- Help organize and categorize information

Response Formatting Guidelines:
- Use clear headings (##) to organize your responses into logical sections
- Use bullet points and numbered lists for better readability
- Highlight key points using **bold text** for emphasis
- Use code blocks for technical terms, commands, or structured data
- Include blockquotes for important quotes or citations
- Break up long paragraphs into digestible chunks
- Use tables when comparing multiple items or presenting structured data
- Always provide clear, actionable insights rather than just summaries

Content Guidelines:
- Respond in the same language the user uses, unless they request otherwise
- Provide comprehensive, thoughtful answers with proper structure
- Use the context from the selected pages to inform your responses
- Be analytical and insightful rather than just summarizing
- Ask clarifying questions when needed
- Cite specific information from the provided sources when relevant
- Use markdown formatting to improve readability and visual hierarchy

The user has selected ${selectedLinks.length} page${selectedLinks.length === 1 ? '' : 's'} for analysis. Use the information below to provide intelligent, research-focused assistance with clear, well-formatted responses.\n`;
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
  }, []); // Empty dependencies to prevent re-creation

  // This useEffect was causing infinite re-renders - removed

  useEffect(() => {
    if (autoScroll && listRef.current && bottomRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
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
    console.log('Send function called with:', { content, conversation: !!conversation, contextReady });
    if (!content || !conversation || !contextReady) {
      console.log('Send function returning early:', { 
        noContent: !content, 
        noConversation: !conversation, 
        notContextReady: !contextReady 
      });
      return;
    }
    
    setLoading(true);
    if (!contentOverride) setInput('');
    setError(null);
    
    let assistantPlaceholderId: string | null = null;
    
    try {
      const userMsg: LocalMsg = { id: crypto.randomUUID(), role: 'user', content };
      const assistantPlaceholder: LocalMsg = { 
        id: crypto.randomUUID(), 
        role: 'assistant', 
        content: '🤔 Thinking...' 
      };
      assistantPlaceholderId = assistantPlaceholder.id;
      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);

      console.log('Sending message to chat service...');
      const newMsgs = await chatService.sendMessage(conversation, content, (partial) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantPlaceholderId ? { ...m, content: partial } : m)),
        );
      }, selectedModel);

      console.log('Received response from chat service:', newMsgs);
      const finalAssistant = newMsgs.find((m) => m.role === 'assistant');
      if (finalAssistant) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantPlaceholderId ? { id: finalAssistant.id, role: 'assistant', content: finalAssistant.content } : m,
          ),
        );
        console.log('Updated messages with assistant response');
      }
    } catch (err: any) {
      console.error('Chat failed', err);
      const errorMessage = err.message || 'Chat failed. Please try again.';
      setError(errorMessage);
      
      // Replace the placeholder with an error message
      if (assistantPlaceholderId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantPlaceholderId ? { 
              id: m.id, 
              role: 'assistant', 
              content: `❌ **Chat Error**

${errorMessage}

**Possible solutions:**
1. Check your internet connection
2. Verify your API key is configured correctly
3. Ensure your API key has sufficient credits
4. Try asking a simpler question
5. Check the diagnostic modal for configuration issues

If the problem persists, try refreshing the page or selecting different links.`
            } : m
          )
        );
      }
    } finally {
      setLoading(false);
    }
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
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="gpt-4o">GPT-4o (Best)</option>
            <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          </select>
          <button
            onClick={() => {
              setContextReady(false);
              setLoading(true);
              void buildContext(links);
            }}
            disabled={loading}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
            title="Refresh chat context"
          >
            <RefreshCcw size={14} />
          </button>
          <button 
            onClick={() => navigate('/chat-history')} 
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            title="View all chat history"
          >
            Chat History
          </button>
          {conversation && (
            <div className="text-xs text-gray-500">
              {messages.filter(m => m.role === 'user').length} messages
            </div>
          )}
          {conversation && (
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  console.log('New Chat button clicked');
                  
                  // First, properly end the current conversation if it exists
                  if (conversation) {
                    try {
                      console.log('Ending current conversation:', conversation.id);
                      await chatService.endConversation(conversation.id);
                      console.log('Successfully ended conversation');
                    } catch (err) {
                      console.warn('Failed to end conversation:', err);
                    }
                  }
                  
                  // Clear all state
                  setMessages([]);
                  setContextReady(false);
                  setConversation(null);
                  setError(null);
                  setInput('');
                  setEditingMessageId(null);
                  setEditContent('');
                  setCopiedMessageId(null);
                  setIsInitialized(false); // Reset initialization flag
                  
                  // Force a completely fresh start
                  setTimeout(() => {
                    void buildContext(links, true);
                  }, 100);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                title="Start a new chat"
              >
                New Chat
              </button>
              <button
                onClick={() => {
                  console.log('Clear Chat button clicked');
                  console.log('Current messages before clear:', messages);
                  console.log('Current conversation:', conversation);
                  
                  // Just clear messages but keep the same conversation
                  setMessages([]);
                  setInput('');
                  setEditingMessageId(null);
                  setEditContent('');
                  setCopiedMessageId(null);
                  
                  // Add welcome message back
                  const welcomeMsg: LocalMsg = {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: `🎯 **Chat Cleared!**

I'm ready to help you analyze your selected research materials. I have access to ${links.length} link${links.length === 1 ? '' : 's'}:

${links.map((link, index) => `**${index + 1}.** ${link.metadata?.title || link.url}`).join('\n')}

**What would you like to know?** You can ask me to:
- Summarize the key points
- Compare different sources
- Find specific information
- Analyze trends or patterns
- Generate insights and recommendations

Just type your question below! 👇`
                  };
                  
                  console.log('Setting welcome message:', welcomeMsg);
                  setMessages([welcomeMsg]);
                  console.log('Clear Chat operation completed');
                }}
                className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
                title="Clear current chat messages"
              >
                Clear Chat
              </button>
            </div>
          )}
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon size={16} />
          </button>
        </div>
      </div>
      
      {/* API Key Setup Warning */}
      {!import.meta.env.VITE_OPENAI_API_KEY && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Key className="w-5 h-5 text-yellow-600 mt-0.5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800 mb-1">
                API Key Required
              </h4>
              <p className="text-sm text-yellow-700 mb-3">
                To use the AI chat functionality, you need to configure an OpenAI API key.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    onClose();
                    // Trigger diagnostic modal
                    window.dispatchEvent(new CustomEvent('showDiagnostics'));
                  }}
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Configure API Key
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
                  className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                >
                  Get API Key
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
              onClick={() => {
                console.log('Quick prompt clicked:', prompt, { contextReady, loading });
                send(prompt);
              }}
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
                        {m.content}
                      </ReactMarkdown>
                    ) : (
                      <span className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</span>
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