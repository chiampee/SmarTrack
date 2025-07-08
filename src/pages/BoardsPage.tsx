import React, { useEffect, useState } from 'react';
import { useBoardStore } from '../stores/boardStore';
import { Button, Modal } from '../components';
import { BoardForm } from '../components/boards/BoardForm';
import { BoardGrid } from '../components/boards/BoardGrid';

export const BoardsPage: React.FC = () => {
  const { boards, loadBoards } = useBoardStore();
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between">
        <h1 className="text-2xl font-semibold">Boards</h1>
        <Button onClick={() => setModalOpen(true)}>New Board</Button>
      </div>
      <BoardGrid boards={boards} />
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Create Board">
        <BoardForm
          onSuccess={() => {
            setModalOpen(false);
            loadBoards();
          }}
        />
      </Modal>
    </div>
  );
}; 