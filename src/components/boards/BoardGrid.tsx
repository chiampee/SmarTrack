import React from 'react';
import { Board } from '../../types/Board';
import { BoardCard } from './BoardCard';

export const BoardGrid: React.FC<{ boards: Board[] }> = ({ boards }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {boards.map((b) => (
      <BoardCard key={b.id} board={b} />
    ))}
  </div>
); 