import { create } from 'zustand';
import { Link } from '../types/Link';
import { linkService } from '../services/linkService';

type SortKey = 'createdAt' | 'priority' | 'title';

interface LinkState {
  links: Link[];
  loading: boolean;
  statusFilter?: Link['status'];
  priorityFilter?: Link['priority'];
  sortKey: SortKey;
  loadLinks: () => Promise<void>;
  addLink: (link: Link) => Promise<void>;
  updateLink: (id: string, changes: Partial<Link>) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
  setStatusFilter: (status?: Link['status']) => void;
  setPriorityFilter: (priority?: Link['priority']) => void;
  setSortKey: (key: SortKey) => void;
}

export const useLinkStore = create<LinkState>()((set, get) => ({
  links: [],
  loading: false,
  sortKey: 'createdAt',
  async loadLinks() {
    set({ loading: true });
    let links = await linkService.getAll();
    const { statusFilter, priorityFilter, sortKey } = get();
    if (statusFilter) links = links.filter((l) => l.status === statusFilter);
    if (priorityFilter) links = links.filter((l) => l.priority === priorityFilter);
    links.sort((a, b) => {
      if (sortKey === 'title') return a.metadata.title.localeCompare(b.metadata.title);
      if (sortKey === 'priority') return a.priority.localeCompare(b.priority);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    set({ links, loading: false });
  },
  async addLink(link) {
    await linkService.create(link);
    await this.loadLinks();
  },
  async updateLink(id, changes) {
    await linkService.update(id, changes);
    await this.loadLinks();
  },
  async deleteLink(id) {
    await linkService.remove(id);
    await this.loadLinks();
  },
  setStatusFilter(status) {
    set({ statusFilter: status });
    this.loadLinks();
  },
  setPriorityFilter(priority) {
    set({ priorityFilter: priority });
    this.loadLinks();
  },
  setSortKey(key) {
    set({ sortKey: key });
    this.loadLinks();
  },
})); 