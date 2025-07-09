import React, { useEffect } from 'react';
import { useBoardStore } from '../../stores/boardStore';
import { Link } from 'react-router-dom';

export const Sidebar: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const { boards, loadBoards } = useBoardStore();

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
        className={`fixed top-12 inset-y-0 left-0 z-20 w-64 transform bg-gray-50 p-4 shadow-lg transition-transform md:static md:translate-x-0 md:top-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
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
        </nav>
      </aside>
    </>
  );
};
