import React, { useEffect, useState } from 'react';
import { Modal, LoadingSpinner, Button } from '..';
import { chatService } from '../../services/chatService';

interface Props {
  linkIds: string[];
  isOpen: boolean;
  onClose: () => void;
}

export const ContextInspectorModal: React.FC<Props> = ({ linkIds, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Awaited<ReturnType<typeof chatService.getContextSnippets>>>([]);
  const [wrap, setWrap] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    chatService
      .getContextSnippets(linkIds)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [isOpen, linkIds]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Context"
      maxWidthClass={fullscreen ? 'max-w-none w-screen h-screen' : 'max-w-6xl'}
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : (
        <div className={`space-y-6 ${fullscreen ? 'max-h-[calc(100vh-8rem)]' : 'max-h-[70vh]'} overflow-y-auto`}>
          {items.map(({ link, summaries }) => (
            <div key={link.id} className="border rounded p-3">
              <h3 className="text-sm font-semibold mb-2">
                {link.metadata.title || link.url}
              </h3>
              {summaries.length === 0 ? (
                <p className="text-xs text-gray-500">No summaries yet.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {summaries.map((s, idx) => (
                    <li key={idx} className="border rounded bg-gray-50 p-2">
                      <div className="text-xs font-semibold mb-1">{s.kind}</div>
                      <pre className={`${wrap ? 'whitespace-pre-wrap' : 'whitespace-pre'} font-mono text-xs max-h-60 overflow-y-auto`}>{s.content}</pre>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}; 