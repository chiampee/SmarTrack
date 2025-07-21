import React, { useState } from 'react';
import { Button, Modal, EmptyState } from '../components';
import { TaskList } from '../components/tasks/TaskList';
import { TaskForm } from '../components/tasks/TaskForm';

export const TasksPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="pt-0 px-4 pb-4">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Research Tasks</h1>
          <p className="text-sm text-gray-600 mt-1">
            Track research goals and follow-up actions
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Add Task</Button>
      </div>
      
      <EmptyState 
        type="tasks" 
        onAction={() => setOpen(true)}
      />
      
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add Task">
        <TaskForm onSuccess={() => setOpen(false)} />
      </Modal>
    </div>
  );
};
