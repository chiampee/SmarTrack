import React, { useEffect, useState } from 'react';
import { Conversation } from '../../types/Conversation';
import { chatService } from '../../services/chatService';
import { db } from '../../db/smartResearchDB';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

interface Props {
  onSelect?: (conv: Conversation) => void;
  selectedId?: string;
}

export const PastChatsSidebar: React.FC<Props> = ({ onSelect, selectedId }) => {
  const [convs, setConvs] = useState<Conversation[]>([]);
  // conversation id currently awaiting delete confirmation
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const c = (await chatService.getAllConversations()) as Conversation[];
      // Helper to pick first 4 words
      const firstWords = (txt: string) => {
        const words = txt.trim().split(/\s+/).slice(0, 4);
        return words.join(' ');
      };

      const withTitles = await Promise.all(
        c.map(async (conv) => {
          // Fetch earliest non-system message to derive topic
          const msgs = await db.chatMessages
            .where('conversationId')
            .equals(conv.id)
            .sortBy('timestamp');
          const firstMsg = msgs.find((m) => m.role !== 'system');
          if (!firstMsg) {
            // delete empty conv silently
            await chatService.deleteConversation(conv.id);
            return null as any;
          }
          const base = firstWords(firstMsg.content);
          const title = `${base}, ${conv.linkIds.length} link${conv.linkIds.length === 1 ? '' : 's'}`;
          return { ...conv, __title: title } as any;
        }),
      );
      setConvs((withTitles as any).filter(Boolean));
    };
    void load();

    // periodic refresh to capture newly created conversations
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  if (!convs.length) return <div className="text-xs text-gray-500">No past chats</div>;

  return (
    <div className="w-60 border-l pl-3 overflow-y-auto max-h-[28rem] text-sm">
      <h4 className="font-semibold mb-2">Past chats</h4>
      <ul className="space-y-2">
        {convs
          .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
          .map((conv) => (
            <li
              key={conv.id}
              className={`relative cursor-pointer flex justify-between items-center group rounded px-1 py-0.5 ${
                conv.id === selectedId ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-50'
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
              <div className="truncate font-medium text-gray-700 text-xs group-hover:underline">
                {(conv as any).__title || `${conv.linkIds.length} links`} – {new Date(conv.startedAt).toLocaleDateString()}
              </div>
              <button
                className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmId((prev) => (prev === conv.id ? null : conv.id));
                }}
              >
                <Trash2 size={14} />
              </button>

              {/* confirm popover */}
              {confirmId === conv.id && (
                <div
                  className="absolute right-6 top-1 z-30 w-40 rounded border border-gray-200 bg-white p-2 shadow-lg text-xs flex flex-col gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-gray-700">Delete this conversation?</span>
                  <div className="flex justify-end gap-2">
                    <button
                      className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                      onClick={() => setConfirmId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-2 py-0.5 rounded bg-red-600 text-white hover:bg-red-700"
                      onClick={async () => {
                        await chatService.deleteConversation(conv.id);
                        setConvs((prev) => prev.filter((c) => c.id !== conv.id));
                        setConfirmId(null);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}; 