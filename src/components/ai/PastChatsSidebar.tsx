import React, { useEffect, useState } from 'react';
import { Conversation } from '../../types/Conversation';
import { chatService } from '../../services/chatService';
import { db } from '../../db/smartResearchDB';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

interface Props {
  onSelect?: (conv: Conversation) => void;
}

export const PastChatsSidebar: React.FC<Props> = ({ onSelect }) => {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const c = (await chatService.getAllConversations()) as Conversation[];
      // Fetch links referenced for titles
      const ids = Array.from(new Set(c.flatMap((conv) => conv.linkIds)));
      const linkRecords = await db.links.bulkGet(ids);
      const map: Record<string, string> = {};
      linkRecords.forEach((l) => {
        if (l) map[l.id] = l.metadata?.title || l.url;
      });
      // attach a computed title property
      const withTitles = c.map((conv) => {
        if (conv.linkIds.length === 1) {
          return { ...conv, __title: map[conv.linkIds[0]] || 'Chat' } as any;
        }
        const firstTitle = map[conv.linkIds[0]] || 'Link';
        return { ...conv, __title: `${firstTitle} + ${conv.linkIds.length - 1} more` } as any;
      });
      setConvs(withTitles as any);
    };
    void load();
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
              className="cursor-pointer hover:text-blue-600 flex justify-between items-center group"
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
                onClick={async (e) => {
                  e.stopPropagation();
                  if (confirm('Delete this conversation?')) {
                    await chatService.deleteConversation(conv.id);
                    setConvs((prev) => prev.filter((c) => c.id !== conv.id));
                  }
                }}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}; 