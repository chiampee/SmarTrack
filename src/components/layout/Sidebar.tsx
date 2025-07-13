import React, { useEffect, useState } from 'react';
import { useBoardStore } from '../../stores/boardStore';
import { useLinkStore } from '../../stores/linkStore';
import { Link } from 'react-router-dom';
import { Modal, Button } from '..';

export const Sidebar: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const { boards, loadBoards } = useBoardStore();
  const { clearAll, rawLinks } = useLinkStore();
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-10 bg-black/30 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-12 inset-y-0 left-0 z-20 w-64 transform bg-gray-50 p-4 shadow-lg transition-transform md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <h2 className="mb-2 text-sm font-semibold text-gray-600">Boards</h2>
        <nav className="flex flex-col gap-1 text-sm">
          {boards.map((b) => (
            <Link
              key={b.id}
              to="/"
              className="truncate rounded px-2 py-1 hover:bg-gray-200"
              onClick={onClose}
            >
              {b.title}
            </Link>
          ))}
          {boards.length === 0 && (
            <p className="text-xs text-gray-500">No boards</p>
          )}
        </nav>
        <hr className="my-3" />
        <nav className="flex flex-col gap-1 text-sm">
          <Link to="/chat-history" className="rounded px-2 py-1 hover:bg-gray-200" onClick={onClose}>
            Chat History
          </Link>
          {rawLinks.length > 0 && (
            <button
              className="rounded px-2 py-1 text-red-600 hover:bg-red-50 hover:text-red-700 text-left"
              onClick={() => setConfirmOpen(true)}
            >
              Delete All Links
            </button>
          )}
        </nav>
        {/* Confirm modal */}
        <Modal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Delete All Links"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  await clearAll();
                  setConfirmOpen(false);
                  onClose();
                }}
              >
                Delete All
              </Button>
            </div>
          }
          maxWidthClass="max-w-md"
        >
          <p className="text-sm text-gray-700">
            Are you sure you want to permanently delete <strong>all</strong> links and their summaries? This action cannot be undone.
          </p>
        </Modal>
      </aside>
    </>
  );
};
