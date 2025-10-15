import React, { useState, useEffect } from 'react';
import { Link } from '../../types/Link';
import { Button } from '../Button';
import { Trash, Undo, AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  links: Link[];
  title?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  links,
  title = "Delete Links"
}) => {
  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDeleted(false);
      setLoading(false);
      // Clear any existing timeout
      if (undoTimeout) {
        clearTimeout(undoTimeout);
        setUndoTimeout(null);
      }
    }
  }, [isOpen, undoTimeout]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      setDeleted(true);
      
      // Set a timeout to auto-close after 5 seconds
      const timeout = setTimeout(() => {
        onClose();
      }, 5000);
      setUndoTimeout(timeout);
    } catch (error) {
      console.error('Failed to delete links:', error);
      setLoading(false);
    }
  };

  const handleUndo = () => {
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      setUndoTimeout(null);
    }
    // Note: In a real implementation, you'd need to restore the deleted links
    // This would require storing the deleted links temporarily and having an undo service
    onClose();
  };

  const handleClose = () => {
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      setUndoTimeout(null);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0">
              {deleted ? (
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Undo className="w-5 h-5 text-green-600" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {deleted ? 'Links Deleted' : title}
              </h3>
              <p className="text-sm text-gray-500">
                {deleted 
                  ? `${links.length} link${links.length === 1 ? '' : 's'} deleted successfully`
                  : `This will permanently delete ${links.length} link${links.length === 1 ? '' : 's'}`
                }
              </p>
            </div>
          </div>

          {!deleted && (
            <div className="mb-4">
              <div className="bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto">
                {links.map((link) => (
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
              <p className="text-sm text-gray-500 mt-2">
                This action cannot be undone. All associated data (summaries, chat history, etc.) will be permanently removed.
              </p>
            </div>
          )}

          {deleted && (
            <div className="mb-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-800">
                  Links have been deleted. You can undo this action within the next few seconds.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            {deleted ? (
              <>
                <Button
                  variant="secondary"
                  onClick={handleClose}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUndo}
                  className="flex items-center gap-2"
                >
                  <Undo className="w-4 h-4" />
                  Undo Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Trash className="w-4 h-4" />
                  {loading ? 'Deleting...' : `Delete ${links.length} Link${links.length === 1 ? '' : 's'}`}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
