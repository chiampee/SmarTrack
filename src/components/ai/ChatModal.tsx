import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button, LoadingSpinner } from '..';
import { Link } from '../../types/Link';
import { chatService } from '../../services/chatService';
import { Conversation } from '../../types/Conversation';
import { useNavigate } from 'react-router-dom';
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
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const initConversation = async () => {
    const conv = await chatService.startConversation([link.id]);
    setConversation(conv);
    const hist = await chatService.getMessages(conv.id);
    setMessages(hist);
  };

  useEffect(() => {
    if (isOpen) {
      void initConversation();
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

    if (!conversation) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      linkId: link.id,
      conversationId: conversation.id,
      role: 'user',
      content: userContent,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const result = await chatService.sendMessage(conversation, userContent);
    setMessages((prev) => [...prev.filter((m) => m.id !== userMsg.id), ...result]);

    setLoading(false);
  };

  const endChat = async () => {
    if (conversation) {
      await chatService.endConversation(conversation.id);
    }
    await initConversation();
  };

  const footer = (
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
        placeholder="Ask a question..."
        rows={2}
        className="flex-1 rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y min-h-[3rem]"
      />
      <Button onClick={send} disabled={loading || !input.trim()}>
        {loading ? <LoadingSpinner /> : 'Send'}
      </Button>
      <Button variant="secondary" onClick={endChat} disabled={loading}>
        End & New
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
    >
      <div className="text-right mb-2">
        <button
          onClick={() => navigate('/chat-history')}
          className="text-xs text-gray-500 hover:underline"
        >
          Past chats
        </button>
      </div>
      {/* Quick prompt chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {quickPrompts.map((p) => (
          <button
            key={p}
            onClick={() => {
              setInput(p);
              document.querySelector<HTMLTextAreaElement>('textarea[placeholder="Ask a question..."]')?.focus();
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