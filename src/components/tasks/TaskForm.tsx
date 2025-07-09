import React, { useState } from 'react';
import { Input, Select, Button } from '..';
import { Task } from '../../types/Task';
import { useTaskStore } from '../../stores/taskStore';

interface TaskFormProps {
  onSuccess?: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onSuccess }) => {
  const { addTask } = useTaskStore();

  const [name, setName] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('normal');
  const [status, setStatus] = useState<Task['status']>('open');
  const [dueDate, setDueDate] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const task: Task = {
      id: crypto.randomUUID(),
      name,
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await addTask(task);
    onSuccess?.();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <div className="flex gap-4">
        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Task['priority'])}
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </Select>
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as Task['status'])}
        >
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="in_flames">In Flames</option>
          <option value="done">Done</option>
        </Select>
      </div>
      <Input
        type="date"
        label="Due Date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      <div className="text-right">
        <Button type="submit">Save Task</Button>
      </div>
    </form>
  );
};
