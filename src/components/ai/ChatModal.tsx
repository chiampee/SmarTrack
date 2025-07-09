import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button, Input, LoadingSpinner } from '..';
import { Link } from '../../types/Link';
import { chatService } from '../../services/chatService';
import { aiService } from '../../services/aiService';
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
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadHistory = async () => {
    const hist = await chatService.getByLink(link.id);
    setMessages(hist);
  };

  useEffect(() => {
    if (isOpen) {
      void loadHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const userContent = input.trim();
    setInput('');

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      linkId: link.id,
      role: 'user',
      content: userContent,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Build history (no GPT yet)
    const history = await chatService.getByLink(link.id);
    const aiMessages = history
      .concat(userMsg)
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

    let assistantId = crypto.randomUUID();
    let assistantMsg: ChatMessage = {
      id: assistantId,
      linkId: link.id,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMsg]);

    await aiService.chatStream(
      [{ role: 'system', content: 'You are a helpful research assistant.' }, ...aiMessages],
      (partial) => {
        assistantMsg.content = partial;
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: partial } : m)));
      },
    );

    // Persist both messages
    await chatService.addMessage(userMsg);
    await chatService.addMessage(assistantMsg);

    setLoading(false);
  };

  const footer = (
    <div className="flex items-center gap-2">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') send();
        }}
        placeholder="Ask a question..."
        className="flex-1"
      />
      <Button onClick={send} disabled={loading || !input.trim()}>
        {loading ? <LoadingSpinner /> : 'Send'}
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
      size="lg"
    >
      {/* Quick prompt chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {quickPrompts.map((p) => (
          <button
            key={p}
            onClick={() => {
              setInput(p);
              document.querySelector<HTMLInputElement>('input[placeholder="Ask a question..."]')?.focus();
            }}
            className="rounded-full bg-gray-100 px-3 py-1 text-xs hover:bg-gray-200 transition"
          >
            {p}
          </button>
        ))}
      </div>
      <div className="max-h-96 overflow-y-auto space-y-3">
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
        {loading && (
          <div className="text-center text-gray-500 text-sm">Thinking...</div>
        )}
        <div ref={bottomRef} />
      </div>
    </Modal>
  );
}; 