import React, { useEffect, useRef, useState } from 'react';
import { Link } from '../../types/Link';
import { aiService, ChatMessage as AIChatMessage } from '../../services/aiService';
import { aiSummaryService } from '../../services/aiSummaryService';
import { LoadingSpinner, Input, Button } from '..';
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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const buildContext = async () => {
      let ctx = 'You are a helpful research assistant. The user selected multiple pages. Use the info below.\n';
      await Promise.all(
        links.map(async (link) => {
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
              const preferred = summaries.find((s) => s.kind === 'tldr') ?? summaries[0];
              ctx += `Existing summary: ${preferred.content}\n`;
            }
          } catch {}
          // fetch cached page text
          const text = await getPageText(link.url);
          if (text) {
            const [, ...rest2] = text.split('\n');
            const content = rest2.join('\n').trim().slice(0, 3000);
            ctx += `Page text (truncated):\n${content}\n`;
          }
        })
      );
      setSystemPrompt(ctx);
    };
    void buildContext();
  }, [links]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!systemPrompt) {
    return (
      <div className="border border-gray-200 p-4 text-center text-sm text-gray-600 flex items-center justify-center gap-2">
        <LoadingSpinner /> Preparing context…
      </div>
    );
  }

  const send = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const userMsg: LocalMsg = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    const aiHistory: AIChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMsg.content },
    ];

    const assistantId = crypto.randomUUID();
    let assistantMsg: LocalMsg = {
      id: assistantId,
      role: 'assistant',
      content: '',
    };
    setMessages((prev) => [...prev, assistantMsg]);

    await aiService.chatStream(aiHistory, (partial) => {
      assistantMsg.content = partial;
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: partial } : m)));
    });

    setLoading(false);
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
        <button onClick={onClose} className="text-xs text-gray-500 hover:underline">Close</button>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {quickPrompts.map((p) => (
          <button
            key={p}
            onClick={() => setInput(p)}
            className="rounded-full bg-gray-100 px-3 py-1 text-xs hover:bg-gray-200 transition"
          >
            {p}
          </button>
        ))}
      </div>
      <div className="max-h-80 overflow-y-auto space-y-3 mb-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`rounded px-3 py-2 text-sm whitespace-pre-wrap max-w-[70%] ${
                m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-center text-gray-500 text-sm">Thinking…</div>}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
          placeholder="Ask a question…"
          className="flex-1"
        />
        <Button onClick={send} disabled={loading || !input.trim()} size="sm">
          {loading ? <LoadingSpinner /> : 'Send'}
        </Button>
      </div>
    </div>
  );
}; 