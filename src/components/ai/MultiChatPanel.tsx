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
import { RefreshCcw } from 'lucide-react';
import { PastChatsSidebar } from './PastChatsSidebar';
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
    setSystemPrompt(ctx); // show UI immediately
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

  if (error) {
    return <ErrorBanner message={error} onRetry={() => { setError(null); void buildContext(links); }} />;
  }

  if (!systemPrompt) {
    return (
      <div className="border border-gray-200 p-4 text-center text-sm text-gray-600 flex items-center justify-center gap-2">
        <LoadingSpinner /> Preparing context…
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

  const endChat = async () => {
    if (conversation) await chatService.endConversation(conversation.id);
    // reset
    setMessages([]);
    setInput('');
    setSystemPrompt('');
    // rebuild context to start new conversation
    await buildContext(links);
  };

  const quickPrompts = [
    'Summarise selected pages',
    'Highlight key differences',
    'Aggregate PM insights',
    'Provide pros and cons',
  ];

  return (
    <div className="border border-blue-300 rounded p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm">Multi-link Chat ({links.length} pages)</h3>
        <div className="space-x-3 text-xs">
          <button onClick={() => navigate('/chat-history')} className="text-gray-500 hover:underline">Past chats</button>
          <button onClick={onClose} className="text-gray-500 hover:underline">Close</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {quickPrompts.map((p) => (
          <button
            key={p}
            onClick={() => send(p)}
            disabled={!contextReady || loading}
            className={`rounded-full px-3 py-1 text-xs transition ${!contextReady || loading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            {!contextReady && <span className="animate-spin inline-block mr-1 h-3 w-3 border rounded-full border-t-transparent border-gray-500" />}
            {p}
          </button>
        ))}
      </div>
      <div className="flex gap-6">
        <div className="flex-1">
          <div
            className="max-h-80 overflow-y-auto space-y-3 mb-3 relative"
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
            {loading && <div className="text-center text-gray-500 text-sm">Thinking…</div>}
            <div ref={bottomRef} />
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
          <div className="flex items-center gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask a question…"
              rows={2}
              className="flex-1 rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y min-h-[3rem]"
            />
            <Button onClick={() => send()} disabled={loading || !input.trim() || !contextReady} size="sm">
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
        </div>
        <PastChatsSidebar
          onSelect={async (conv) => {
            setConversation(conv);
            const hist = await chatService.getMessages(conv.id);
            setMessages(
              hist
                .filter((m) => m.role !== 'system')
                .map((m) => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content }))
            );
          }}
          selectedId={conversation?.id}
        />
      </div>
    </div>
  );
}; 