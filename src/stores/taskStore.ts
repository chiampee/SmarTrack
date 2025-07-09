import { create } from 'zustand';
import { Task } from '../types/Task';
import { taskService } from '../services/taskService';

type SortKey = 'createdAt' | 'dueDate' | 'priority';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  statusFilter?: Task['status'];
  priorityFilter?: Task['priority'];
  sortKey: SortKey;
  loadTasks: () => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  updateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setStatusFilter: (status?: Task['status']) => void;
  setPriorityFilter: (priority?: Task['priority']) => void;
  setSortKey: (key: SortKey) => void;
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  loading: false,
  sortKey: 'createdAt',
  async loadTasks() {
    set({ loading: true });
    let tasks = await taskService.getAll();
    const { statusFilter, priorityFilter, sortKey } = get();
    if (statusFilter) tasks = tasks.filter((t) => t.status === statusFilter);
    if (priorityFilter)
      tasks = tasks.filter((t) => t.priority === priorityFilter);
    tasks.sort((a, b) => {
      if (sortKey === 'dueDate') {
        return (
          (a.dueDate ? new Date(a.dueDate).getTime() : 0) -
          (b.dueDate ? new Date(b.dueDate).getTime() : 0)
        );
      }
      if (sortKey === 'priority') return a.priority.localeCompare(b.priority);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    set({ tasks, loading: false });
  },
  async addTask(task) {
    await taskService.create(task);
    await get().loadTasks();
  },
  async updateTask(id, changes) {
    await taskService.update(id, changes);
    await get().loadTasks();
  },
  async deleteTask(id) {
    await taskService.remove(id);
    await get().loadTasks();
  },
  setStatusFilter(status) {
    set({ statusFilter: status });
    get().loadTasks();
  },
  setPriorityFilter(priority) {
    set({ priorityFilter: priority });
    get().loadTasks();
  },
  setSortKey(key) {
    set({ sortKey: key });
    get().loadTasks();
  },
}));
