import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Modal, Button, LoadingSpinner } from '..';
import { ContextInspectorModal } from './ContextInspectorModal';
import { Link } from '../../types/Link';
import { chatService } from '../../services/chatService';
import { RefreshCcw } from 'lucide-react';
import { Conversation } from '../../types/Conversation';
import { useNavigate } from 'react-router-dom';
import { PastChatsSidebar } from './PastChatsSidebar';
import { ChatMessage } from '../../types/ChatMessage';

interface Props {
  link: Link;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatModal: React.FC<Props> = ({ link, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextReady, setContextReady] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const navigate = useNavigate();
  const [contextOpen, setContextOpen] = useState(false);

  const initConversation = async () => {
    const conv = await chatService.startConversation([link.id]);
    setConversation(conv);
    const hist = await chatService.getMessages(conv.id);
    setMessages(hist);
    setContextReady(true);
  };

  useEffect(() => {
    if (isOpen) {
      void initConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, autoScroll]);

  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    setAutoScroll(distanceFromBottom < 20);
  };

  const send = async (contentOverride?: string) => {
    const userContent = (contentOverride ?? input).trim();
    if (!userContent || !contextReady) return;
    setLoading(true);
    if (!contentOverride) setInput('');

    if (!conversation) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      linkId: link.id,
      conversationId: conversation.id,
      role: 'user',
      content: userContent,
      timestamp: new Date(),
    };
    const assistantPlaceholder: ChatMessage = {
      id: crypto.randomUUID(),
      linkId: link.id,
      conversationId: conversation.id,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    // Add both messages optimistically
    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);

    try {
      const result = await chatService.sendMessage(conversation, userContent, (partial) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantPlaceholder.id ? { ...m, content: partial } : m)),
        );
      });

      // Replace placeholder with final assistant message from result
      const finalAssistant = result.find((m) => m.role === 'assistant');
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantPlaceholder.id && finalAssistant ? finalAssistant : m)),
      );
    } catch (err) {
      console.error('Chat failed', err);
      setMessages((prev) => prev.filter((m) => m.id !== assistantPlaceholder.id));
    } finally {
      setLoading(false);
    }
  };

  const endChat = async () => {
    if (conversation) {
      await chatService.endConversation(conversation.id);
    }
    await initConversation();
  };

  const footer = (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setContextOpen(true)}
        disabled={!conversation}
        title="View AI Context"
      >
        Context
      </Button>
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
        className="flex-1 rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y min-h-[3rem]"
      />
      <Button onClick={() => send()} disabled={loading || !input.trim() || !contextReady}>
        {loading ? <LoadingSpinner /> : 'Send'}
      </Button>
      <Button
        variant="secondary"
        onClick={endChat}
        disabled={loading}
        size="sm"
        title="End chat & start new"
      >
        <RefreshCcw size={16} />
      </Button>
    </div>
  );

  const quickPrompts = [
    'Summarise this page in 5 bullet points',
    'What are the key takeaways?',
    'Give me PM insights',
    'Translate the content to Hebrew',
    'List pros and cons mentioned here',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chat – ${link.metadata.title || link.url}`}
      footer={footer}
      maxWidthClass="max-w-5xl"
    >
      <div className="flex gap-6">
        <div className="flex-1">
          {/* Quick prompt chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {quickPrompts.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs hover:bg-gray-200 transition"
              >
                {p}
              </button>
            ))}
          </div>
          <div
            className="max-h-96 overflow-y-auto space-y-3 relative"
            ref={listRef}
            onScroll={handleScroll}
          >
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`rounded px-3 py-2 text-sm max-w-[70%] ${
                    m.role === 'user' ? 'bg-blue-600 text-white whitespace-pre-wrap' : 'bg-gray-100'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm as any]}
                      className="prose prose-sm max-w-none"
                    >
                      {m.content}
                    </ReactMarkdown>
                  ) : (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-center text-gray-500 text-sm">Thinking...</div>
            )}
            <div ref={bottomRef} />

            {/* scroll to latest button */}
            {!autoScroll && (
              <button
                onClick={() => {
                  setAutoScroll(true);
                  bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="absolute right-2 bottom-2 bg-blue-600 text-white text-xs rounded-full px-2 py-1 shadow hover:bg-blue-700"
              >
                ⬇ Latest
              </button>
            )}
          </div>
        </div>
        <PastChatsSidebar
          onSelect={async (conv) => {
            setConversation(conv);
            const hist = await chatService.getMessages(conv.id);
            setMessages(hist);
          }}
          selectedId={conversation?.id}
        />
        <ContextInspectorModal
          linkIds={conversation?.linkIds || [link.id]}
          isOpen={contextOpen}
          onClose={() => setContextOpen(false)}
        />
      </div>
    </Modal>
  );
}; 