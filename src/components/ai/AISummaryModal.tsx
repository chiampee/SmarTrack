import React, { useState } from 'react';
import { Modal, Button, LoadingSpinner } from '..';
import { Link } from '../../types/Link';
import { aiSummaryService } from '../../services/aiSummaryService';

interface Props {
  link: Link;
  isOpen: boolean;
  onClose: () => void;
}

export const AISummaryModal: React.FC<Props> = ({ link, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');

  // Load existing summaries when the modal opens
  React.useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const summaries = await aiSummaryService.getByLink(link.id);
        const raw = summaries.find((s) => s.kind === 'raw');
        if (raw) setContent(raw.content);
      } catch (err) {
        console.error('Failed to load cached summaries', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, link.id]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await aiSummaryService.generate(link, 'raw');
      setContent(summary.content);
    } catch (err: any) {
      setError(err.message || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={onClose} disabled={loading}>
        Close
      </Button>
      {content && (
        <Button
          variant="secondary"
          onClick={() => {
            navigator.clipboard.writeText(content).catch(() => {});
          }}
        >
          Copy
        </Button>
      )}
      <Button onClick={refresh} disabled={loading}>
        {loading ? <LoadingSpinner /> : 'Refresh'}
      </Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`AI Summary – ${link.metadata.title || link.url}`} footer={footer}>
      <div className="flex flex-col gap-4">
        {/* Show error if any */}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {/* Always show the raw full text if available */}
        {content && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">Full Text</span>
            <pre className="whitespace-pre-wrap rounded border border-gray-200 p-3 text-sm bg-gray-50 max-h-80 overflow-y-auto">
              {content}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
}; 