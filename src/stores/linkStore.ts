import { create } from 'zustand';
import { Link } from '../types/Link';
import { linkService } from '../services/linkService';
import { db } from '../db/smartResearchDB';

type SortKey = 'createdAt' | 'priority' | 'title' | 'labels' | 'status';
type SortDir = 'asc' | 'desc';

interface LinkState {
  links: Link[];
  rawLinks: Link[];
  loading: boolean;
  error?: string;
  statusFilter?: Link['status'];
  priorityFilter?: Link['priority'];
  sortKey: SortKey;
  sortDir: SortDir;
  searchTerm?: string;
  loadLinks: () => Promise<void>;
  addLink: (link: Link) => Promise<void>;
  updateLink: (id: string, changes: Partial<Link>) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  setStatusFilter: (status?: Link['status']) => void;
  setPriorityFilter: (priority?: Link['priority']) => void;
  setSortKey: (key: SortKey) => void;
  toggleSort: (key: SortKey) => void;
  setSearchTerm: (term: string) => void;
  applyFilters: () => void;
  fetchLinks: () => Promise<void>;
}

const savedSort = (() => {
  try {
    return JSON.parse(localStorage.getItem('linkSort') || '') as { key: SortKey; dir: SortDir };
  } catch {
    return null;
  }
})();

const linkStore = create<LinkState>()((set, get) => ({
  links: [],
  rawLinks: [],
  loading: false,
  error: undefined,
  sortKey: savedSort?.key || 'labels',
  sortDir: savedSort?.dir || 'asc',
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
      sortDir,
      searchTerm,
    } = get();
    let links = [...rawLinks];
    if (statusFilter) links = links.filter((l) => l.status === statusFilter);
    if (priorityFilter)
      links = links.filter((l) => l.priority === priorityFilter);
    if (searchTerm)
      links = links.filter(
        (l) =>
          (l.metadata.title ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.url.toLowerCase().includes(searchTerm.toLowerCase())
      );
    links.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'title')
        cmp = (a.metadata.title ?? '').localeCompare(b.metadata.title ?? '');
      else if (sortKey === 'priority') cmp = a.priority.localeCompare(b.priority);
      else if (sortKey === 'labels') {
        const aLabel = a.labels[0] || '';
        const bLabel = b.labels[0] || '';
        cmp = aLabel.localeCompare(bLabel);
      } else if (sortKey === 'status') {
        cmp = a.status.localeCompare(b.status);
      } else {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDir === 'asc' ? cmp : -cmp;
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
  async clearAll() {
    await linkService.clearAll();
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
  toggleSort(key) {
    set((state) => {
      const dir = state.sortKey === key ? (state.sortDir === 'asc' ? 'desc' : 'asc') : 'asc';
      const obj = { sortKey: key, sortDir: dir };
      localStorage.setItem('linkSort', JSON.stringify({ key, dir }));
      return obj;
    });
    get().applyFilters();
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

// Refresh link list whenever Dexie links table changes (insert/update/delete)
['creating', 'updating', 'deleting'].forEach((hook) => {
  // @ts-ignore – dynamic hook name
  db.links.hook(hook, () => {
    // Load links but avoid infinite loop
    linkStore.getState().fetchLinks();
  });
});

export const useLinkStore = linkStore;
