import React, { useState } from 'react';
import { Modal, Button, LoadingSpinner, Select, Input } from '..';
import { Link } from '../../types/Link';
import { SummaryKind } from '../../types/AISummary';
import { aiSummaryService } from '../../services/aiSummaryService';

interface Props {
  link: Link;
  isOpen: boolean;
  onClose: () => void;
}

const KIND_LABELS: Record<SummaryKind, string> = {
  tldr: 'TL;DR',
  bullets: 'Bullets',
  quotes: 'Quotes',
  insights: 'PM Insights',
  custom: 'Custom',
};

export const AISummaryModal: React.FC<Props> = ({ link, isOpen, onClose }) => {
  const [kind, setKind] = useState<SummaryKind>('tldr');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await aiSummaryService.generate(link, kind, prompt);
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
      <Button onClick={generate} disabled={loading}>
        {loading ? <LoadingSpinner /> : 'Generate'}
      </Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`AI Summary – ${link.metadata.title || link.url}`} footer={footer}>
      <div className="flex flex-col gap-4">
        <Select value={kind} onChange={(e) => setKind(e.target.value as SummaryKind)}>
          {Object.entries(KIND_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </Select>
        {kind === 'custom' && (
          <Input
            label="Custom Prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your custom prompt..."
          />
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {content && (
          <pre className="whitespace-pre-wrap rounded border border-gray-200 p-3 text-sm bg-gray-50 max-h-80 overflow-y-auto">
            {content}
          </pre>
        )}
      </div>
    </Modal>
  );
}; 