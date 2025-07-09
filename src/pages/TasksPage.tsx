import React, { useState } from 'react';
import { Button, Modal } from '../components';
import { TaskList } from '../components/tasks/TaskList';
import { TaskForm } from '../components/tasks/TaskForm';

export const TasksPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <Button onClick={() => setOpen(true)}>Add Task</Button>
      </div>
      <TaskList />
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add Task">
        <TaskForm onSuccess={() => setOpen(false)} />
      </Modal>
    </div>
  );
};
