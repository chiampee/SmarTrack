import React from 'react';
import { Board } from '../../types/Board';
import { Badge, Button } from '..';
import { boardService } from '../../services/boardService';
import { useBoardStore } from '../../stores/boardStore';

interface Props {
  board: Board;
}

export const BoardCard: React.FC<Props> = ({ board }) => {
  const { deleteBoard } = useBoardStore();

  return (
    <div className="rounded border border-gray-200 p-4 shadow-sm hover:shadow">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-medium" style={{ color: board.color }}>
          {board.title}
        </h3>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (confirm('Delete board?')) deleteBoard(board.id);
          }}
        >
          Delete
        </Button>
      </div>
      <p className="text-sm text-gray-600 line-clamp-3">{board.description}</p>
      <div className="mt-2">
        <Badge>{new Date(board.createdAt).toLocaleDateString()}</Badge>
      </div>
    </div>
  );
}; 