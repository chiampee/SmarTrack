import { expect, vi, it, beforeEach } from 'vitest';
import { useTaskStore } from '../stores/taskStore';
import { Task } from '../types/Task';

const data: Task[] = [
  {
    id: 't1',
    name: 'Task A',
    priority: 'low',
    status: 'open',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 't2',
    name: 'Task B',
    priority: 'urgent',
    status: 'done',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
  },
];

vi.mock('../services/taskService', () => ({
  taskService: {
    getAll: vi.fn(async () => data),
  },
}));

beforeEach(() => {
  useTaskStore.setState({ tasks: [], loading: false, statusFilter: undefined, priorityFilter: undefined, sortKey: 'createdAt' });
});

it('filters by status', async () => {
  const st = useTaskStore.getState();
  await st.loadTasks();
  st.setStatusFilter('done');
  await new Promise((r)=> setTimeout(r,10));
  expect(useTaskStore.getState().tasks.length).toBe(1);
});

it('sorts by due date', async () => {
  const st = useTaskStore.getState();
  await st.loadTasks();
  st.setSortKey('createdAt');
  await new Promise((r)=> setTimeout(r,10));
  const ids = useTaskStore.getState().tasks.map(t=>t.id);
  expect(ids).toEqual(['t2','t1']);
}); 