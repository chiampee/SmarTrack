import { create } from 'zustand';
import { Link } from '../types/Link';
import { linkService } from '../services/linkService';

type SortKey = 'createdAt' | 'priority' | 'title' | 'labels';

interface LinkState {
  links: Link[];
  rawLinks: Link[];
  loading: boolean;
  error?: string;
  statusFilter?: Link['status'];
  priorityFilter?: Link['priority'];
  sortKey: SortKey;
  searchTerm?: string;
  loadLinks: () => Promise<void>;
  addLink: (link: Link) => Promise<void>;
  updateLink: (id: string, changes: Partial<Link>) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
  setStatusFilter: (status?: Link['status']) => void;
  setPriorityFilter: (priority?: Link['priority']) => void;
  setSortKey: (key: SortKey) => void;
  setSearchTerm: (term: string) => void;
  applyFilters: () => void;
}

export const useLinkStore = create<LinkState>()((set, get) => ({
  links: [],
  rawLinks: [],
  loading: false,
  error: undefined,
  sortKey: 'createdAt',
  searchTerm: undefined,
  async loadLinks() {
    try {
      await get().fetchLinks();
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
  fetchLinks: async function () {
    set({ loading: true, error: undefined });
    const all = await linkService.getAll();
    set({ rawLinks: all, loading: false });
    get().applyFilters();
  },

  applyFilters() {
    const {
      rawLinks,
      statusFilter,
      priorityFilter,
      sortKey,
      searchTerm,
    } = get();
    let links = [...rawLinks];
    if (statusFilter) links = links.filter((l) => l.status === statusFilter);
    if (priorityFilter)
      links = links.filter((l) => l.priority === priorityFilter);
    if (searchTerm)
      links = links.filter(
        (l) =>
          l.metadata.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.url.toLowerCase().includes(searchTerm.toLowerCase())
      );
    links.sort((a, b) => {
      if (sortKey === 'title')
        return a.metadata.title.localeCompare(b.metadata.title);
      if (sortKey === 'priority') return a.priority.localeCompare(b.priority);
      if (sortKey === 'labels') {
        const aLabel = a.labels[0] || '';
        const bLabel = b.labels[0] || '';
        return aLabel.localeCompare(bLabel);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    set({ links });
  },
  async addLink(link) {
    await linkService.create(link);
    await get().loadLinks();
  },
  async updateLink(id, changes) {
    await linkService.update(id, changes);
    await get().loadLinks();
  },
  async deleteLink(id) {
    await linkService.remove(id);
    await get().loadLinks();
  },
  setStatusFilter(status) {
    set({ statusFilter: status });
    const { rawLinks } = get();
    if (rawLinks.length === 0) {
      void get().loadLinks();
    } else {
      get().applyFilters();
    }
  },
  setPriorityFilter(priority) {
    set({ priorityFilter: priority });
    const { rawLinks } = get();
    if (rawLinks.length === 0) {
      void get().loadLinks();
    } else {
      get().applyFilters();
    }
  },
  setSortKey(key) {
    set({ sortKey: key });
    const { rawLinks } = get();
    if (rawLinks.length === 0) {
      void get().loadLinks();
    } else {
      get().applyFilters();
    }
  },
  setSearchTerm(term) {
    set({ searchTerm: term });
    const { rawLinks } = get();
    if (rawLinks.length === 0) {
      void get().loadLinks();
    } else {
      get().applyFilters();
    }
  },
}));
