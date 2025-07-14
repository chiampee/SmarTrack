import React, { useEffect, useState } from 'react';
import { useBoardStore } from '../../stores/boardStore';
import { useLinkStore } from '../../stores/linkStore';
import { Link } from 'react-router-dom';
import { Modal, Button } from '..';
import { LinkForm } from '../links/LinkForm';

export const Sidebar: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const { boards, loadBoards } = useBoardStore();
  const { clearAll, rawLinks } = useLinkStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

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
        {boards.length > 0 && (
          <>
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
            </nav>
            <hr className="my-3" />
          </>
        )}
        {/* Quick actions – always visible */}
        <div className="flex flex-col gap-2 mb-3">
          <Button
            size="sm"
            variant="secondary"
            className="w-full"
            onClick={() => setAddOpen(true)}
          >
            Add Link
          </Button>
          {rawLinks.length > 0 && (
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={() => setConfirmOpen(true)}
            >
              Delete All
            </Button>
          )}
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          <Link to="/chat-history" className="rounded px-2 py-1 hover:bg-gray-200" onClick={onClose}>
            Chat History
          </Link>
        </nav>

        {/* Add Link modal */}
        <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Link">
          <LinkForm onSuccess={() => setAddOpen(false)} />
        </Modal>

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
                variant="secondary"
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
