import React, { useState } from 'react';
import { Task } from '../../types/Task';
import { Badge } from '..';
import { Circle, MoreVertical } from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';

interface TaskRowProps {
  task: Task;
}

const statusVariant = {
  open: 'default',
  in_progress: 'warning',
  in_flames: 'danger',
  done: 'success',
} as const;

const priorityVariant = {
  low: 'default',
  normal: 'success',
  high: 'warning',
  urgent: 'danger',
} as const;

export const TaskRow: React.FC<TaskRowProps> = ({ task }) => {
  const { updateTask } = useTaskStore();
  const [editing, setEditing] = useState<{
    field?: 'name' | 'priority' | 'status' | 'dueDate';
  }>({});
  const [draft, setDraft] = useState<string>('');

  const startEdit = (
    field: 'name' | 'priority' | 'status' | 'dueDate',
    currentValue: string
  ) => {
    setEditing({ field });
    setDraft(currentValue);
  };

  const commit = async () => {
    if (!editing.field) return;
    const changes: Partial<Task> = {};
    if (editing.field === 'name') changes.name = draft;
    if (editing.field === 'priority') changes.priority = draft;
    if (editing.field === 'status') changes.status = draft;
    if (editing.field === 'dueDate')
      changes.dueDate = draft ? new Date(draft) : undefined;
    await updateTask(task.id, changes);
    setEditing({});
  };

  const cancel = () => setEditing({});

  return (
    <div className="grid grid-cols-12 items-center gap-3 border-b border-gray-100 px-4 py-1.5 text-sm even:bg-gray-50 hover:bg-gray-100">
      <div className="flex items-center gap-2 col-span-4 truncate">
        <Circle size={16} className="text-gray-400" />
        {editing.field === 'name' ? (
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
            onDoubleClick={() => startEdit('name', task.name)}
          >
            {task.name}
          </span>
        )}
      </div>
      <div
        className="col-span-2 text-xs text-gray-600 cursor-pointer"
        onDoubleClick={() =>
          startEdit(
            'dueDate',
            task.dueDate
              ? new Date(task.dueDate).toISOString().substring(0, 10)
              : ''
          )
        }
      >
        {editing.field === 'dueDate' ? (
          <input
            type="date"
            value={draft}
            className="rounded border border-gray-300 px-1 text-xs"
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') cancel();
            }}
          />
        ) : task.dueDate ? (
          new Date(task.dueDate).toLocaleDateString()
        ) : (
          '--'
        )}
      </div>
      <div
        className="col-span-2 cursor-pointer"
        onDoubleClick={() => startEdit('priority', task.priority)}
      >
        {editing.field === 'priority' ? (
          <select
            className="rounded border border-gray-300 px-1 text-xs"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            autoFocus
          >
            <option value="low">low</option>
            <option value="normal">normal</option>
            <option value="high">high</option>
            <option value="urgent">urgent</option>
          </select>
        ) : (
          <Badge variant={priorityVariant[task.priority]}>
            {task.priority}
          </Badge>
        )}
      </div>
      <div
        className="col-span-2 cursor-pointer"
        onDoubleClick={() => startEdit('status', task.status)}
      >
        {editing.field === 'status' ? (
          <select
            className="rounded border border-gray-300 px-1 text-xs"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            autoFocus
          >
            <option value="open">open</option>
            <option value="in_progress">in progress</option>
            <option value="in_flames">in flames</option>
            <option value="done">done</option>
          </select>
        ) : (
          <Badge variant={statusVariant[task.status]}>
            {task.status.replace('_', ' ')}
          </Badge>
        )}
      </div>
      <div className="col-span-2 text-right text-gray-400 hover:text-gray-600">
        <MoreVertical size={16} />
      </div>
    </div>
  );
};
