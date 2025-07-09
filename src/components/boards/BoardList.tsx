import React, { useEffect } from 'react';
import { useBoardStore } from '../../stores/boardStore';
import { BoardRow } from './BoardRow';
import { Skeleton } from '../Skeleton';
import { ErrorBanner } from '../ErrorBanner';

export const BoardList: React.FC = () => {
  const { boards, loading, loadBoards, error } = useBoardStore();

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  if (loading)
    return (
      <div className="border border-gray-200">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full border-b border-gray-100" />
        ))}
      </div>
    );

  if (error) return <ErrorBanner message={error} onRetry={loadBoards} />;

  return (
    <div className="border border-gray-200">
      <div className="grid grid-cols-12 bg-gray-50 px-4 py-1.5 text-xs font-semibold text-gray-500">
        <div className="col-span-4">Name</div>
        <div className="col-span-4">Description</div>
        <div className="col-span-2">Created</div>
        <div className="col-span-2 text-right">&nbsp;</div>
      </div>
      {boards.map((b) => (
        <BoardRow key={b.id} board={b} />
      ))}
      {boards.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-gray-500">
          No boards yet
        </p>
      )}
    </div>
  );
};
