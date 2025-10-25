import React, { useState } from 'react';
import { Link } from '../../types/Link';
import { Button } from '../Button';

interface BulkEditFormProps {
  selectedLinks: Link[];
  onSave: (changes: Partial<Link>) => Promise<void>;
  onCancel: () => void;
}

export const BulkEditForm: React.FC<BulkEditFormProps> = ({
  selectedLinks,
  onSave,
  onCancel,
}) => {
  const [changes, setChanges] = useState<Partial<Link> & { addLabels?: string }>({});
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(changes);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = Object.keys(changes).length > 0;

  return (
    <div className="space-y-6">
      <div className="text-gray-700">
        <p className="mb-3">
          Edit properties for <strong>{selectedLinks.length}</strong> selected link{selectedLinks.length === 1 ? '' : 's'}:
        </p>
        <div className="bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto">
          {selectedLinks.map((link) => (
            <div key={link.id} className="mb-2 last:mb-0">
              <div className="text-sm font-medium text-gray-900">
                {link.metadata?.title || 'Untitled'}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {link.url}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={changes.status || ''}
            onChange={(e) => setChanges(prev => ({ ...prev, status: e.target.value as Link['status'] }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Keep current</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            value={changes.priority || ''}
            onChange={(e) => setChanges(prev => ({ ...prev, priority: e.target.value as Link['priority'] }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Keep current</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Labels */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Labels (comma-separated)
          </label>
          <input
            type="text"
            value={changes.labels?.join(', ') || ''}
            onChange={(e) => {
              const labels = e.target.value
                .split(',')
                .map(l => l.trim())
                .filter(Boolean);
              setChanges(prev => ({ ...prev, labels }));
            }}
            placeholder="e.g., research, important, todo"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to keep current labels. Use commas to separate multiple labels.
          </p>
        </div>

        {/* Add Labels (append to existing) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Labels (append to existing)
          </label>
          <input
            type="text"
            value={changes.addLabels || ''}
            onChange={(e) => setChanges(prev => ({ ...prev, addLabels: e.target.value }))}
            placeholder="e.g., urgent, review"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            These labels will be added to existing labels for each link.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!hasChanges || loading}
        >
          {loading ? 'Saving...' : `Update ${selectedLinks.length} Link${selectedLinks.length === 1 ? '' : 's'}`}
        </Button>
      </div>
    </div>
  );
};
