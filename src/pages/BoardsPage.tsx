import React, { useEffect, useState } from 'react';
import { useBoardStore } from '../stores/boardStore';
import { Button, Modal, EmptyState } from '../components';
import { BoardForm } from '../components/boards/BoardForm';
import { BoardList } from '../components/boards/BoardList';

export const BoardsPage: React.FC = () => {
  const { boards, loadBoards } = useBoardStore();
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  return (
    <div className="pt-0 px-4 pb-4 space-y-4">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Research Boards</h1>
          <p className="text-sm text-gray-600 mt-1">
            Organize your research into projects and topics
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>New Board</Button>
      </div>
      
      {boards.length === 0 ? (
        <EmptyState 
          type="boards" 
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <BoardList />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Board"
      >
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
