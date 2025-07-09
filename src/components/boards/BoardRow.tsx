import React, { useState } from 'react';
import { Board } from '../../types/Board';
import { Circle, MoreVertical } from 'lucide-react';
import { useBoardStore } from '../../stores/boardStore';

interface Props {
  board: Board;
}

export const BoardRow: React.FC<Props> = ({ board }) => {
  const { updateBoard } = useBoardStore();
  const [editing, setEditing] = useState<{ field?: 'title' | 'description' }>(
    {}
  );
  const [draft, setDraft] = useState<string>('');

  const startEdit = (field: 'title' | 'description', value: string) => {
    setEditing({ field });
    setDraft(value);
  };

  const commit = async () => {
    if (!editing.field) return;
    const changes: Partial<Board> = {};
    if (editing.field === 'title') changes.title = draft;
    if (editing.field === 'description') changes.description = draft;
    await updateBoard(board.id, changes);
    setEditing({});
  };

  const cancel = () => setEditing({});

  return (
    <div className="grid grid-cols-12 items-center gap-3 border-b border-gray-100 px-4 py-1.5 text-sm even:bg-gray-50 hover:bg-gray-100">
      <div className="flex items-center gap-2 col-span-4 truncate">
        <Circle size={16} style={{ color: board.color }} />
        {editing.field === 'title' ? (
          <input
            className="w-full rounded border border-gray-300 px-1 text-sm"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') cancel();
            }}
          />
        ) : (
          <span
            className="truncate font-medium cursor-pointer"
            style={{ color: board.color }}
            onDoubleClick={() => startEdit('title', board.title)}
          >
            {board.title}
          </span>
        )}
      </div>
      <div
        className="col-span-4 truncate text-xs text-gray-600 cursor-pointer"
        onDoubleClick={() => startEdit('description', board.description)}
      >
        {editing.field === 'description' ? (
          <input
            className="w-full rounded border border-gray-300 px-1 text-xs"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') cancel();
            }}
          />
        ) : (
          board.description
        )}
      </div>
      <div className="col-span-2 text-xs text-gray-600">
        {new Date(board.createdAt).toLocaleDateString()}
      </div>
      <div className="col-span-2 text-right text-gray-400 hover:text-gray-600">
        <MoreVertical size={16} />
      </div>
    </div>
  );
};
