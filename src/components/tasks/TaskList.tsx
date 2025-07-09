import React, { useEffect, useState } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { TaskRow } from './TaskRow';
import { Badge } from '..';
import { ChevronDown, ChevronRight } from 'lucide-react';

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  in_flames: 'In Flames',
  done: 'Done',
};

const statusOrder: Array<keyof typeof statusLabels> = [
  'open',
  'in_progress',
  'in_flames',
  'done',
];

export const TaskList: React.FC = () => {
  const { tasks, loadTasks, loading } = useTaskStore();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const grouped = tasks.reduce<Record<string, typeof tasks>>((acc, task) => {
    (acc[task.status] = acc[task.status] || []).push(task);
    return acc;
  }, {});

  return (
    <div>
      {statusOrder.map((status) => {
        const groupTasks = grouped[status] || [];
        const isCollapsed = collapsed[status];
        return (
          <div key={status} className="mb-4">
            <button
              type="button"
              className="flex w-full items-center gap-2 bg-gray-100 px-4 py-2 text-left text-sm font-semibold hover:bg-gray-200"
              onClick={() =>
                setCollapsed({ ...collapsed, [status]: !isCollapsed })
              }
            >
              {isCollapsed ? (
                <ChevronRight size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
              <span className="mr-2 uppercase tracking-wide text-gray-700">
                {statusLabels[status]}
              </span>
              <Badge className="ml-auto">{groupTasks.length}</Badge>
            </button>
            {!isCollapsed && (
              <div className="border-x border-b border-gray-200">
                <div className="grid grid-cols-12 bg-gray-50 px-4 py-1.5 text-xs font-semibold text-gray-500">
                  <div className="col-span-4">Name</div>
                  <div className="col-span-2">Due Date</div>
                  <div className="col-span-2">Priority</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1 text-right">&nbsp;</div>
                </div>
                {groupTasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        );
      })}
      {loading && (
        <p className="text-center text-sm text-gray-500">Loading...</p>
      )}
    </div>
  );
};
