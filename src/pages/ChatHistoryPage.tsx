import React, { useEffect, useState } from 'react';
import { chatService } from '../services/chatService';
import { Conversation } from '../types/Conversation';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/smartResearchDB';
import { Link as LinkType } from '../types/Link';

export const ChatHistoryPage: React.FC = () => {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    chatService.getAllConversations().then((c) => setConvs(c as Conversation[]));
  }, []);

  const openConversation = async (conv: Conversation) => {
    // Navigate to links page with chat modal open? For now, go to /links and rely on UI to open.
    // Simpler: store selected conversation in localStorage and navigate.
    localStorage.setItem('openConversationId', conv.id);
    navigate('/links');
  };

  const [linksMap, setLinksMap] = useState<Record<string, LinkType>>({});

  useEffect(() => {
    const fetchLinks = async () => {
      const map: Record<string, LinkType> = {};
      for (const conv of convs) {
        for (const id of conv.linkIds) {
          if (!map[id]) {
            const l = await db.getLink(id);
            if (l) map[id] = l as LinkType;
          }
        }
      }
      setLinksMap(map);
    };
    if (convs.length) void fetchLinks();
  }, [convs]);

  return (
    <div className="pt-0 px-4 pb-4">
      <h1 className="text-xl font-semibold mb-4">Chat History</h1>
      {convs.length === 0 ? (
        <p className="text-sm text-gray-500">No conversations yet.</p>
      ) : (
        <ul className="space-y-3">
          {convs
            .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
            .map((conv) => (
              <li
                key={conv.id}
                className="border rounded p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => openConversation(conv)}
              >
                <div className="text-sm font-medium">
                  {new Date(conv.startedAt).toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {conv.linkIds
                    .map((id) => linksMap[id]?.metadata?.title || linksMap[id]?.url || 'link')
                    .join(', ')}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {conv.linkIds.flatMap((id) => linksMap[id]?.labels || []).map((lbl) => (
                    <span key={lbl} className="bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-[10px]">
                      {lbl}
                    </span>
                  ))}
                </div>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}; 