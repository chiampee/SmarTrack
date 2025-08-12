import { create } from 'zustand';
import { Link } from '../types/Link';
import { linkService } from '../services/linkService';
import { db } from '../db/smartResearchDB';

type SortKey = 'createdAt' | 'labels';
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

// Function to normalize link structure from extension
function normalizeLinkStructure(link: any): Link {
  return {
    id: link.id || crypto.randomUUID(),
    url: link.url || '',
    metadata: {
      title: link.metadata?.title || link.title || 'Untitled',
      description: link.metadata?.description || link.description || '',
      image: link.metadata?.image || link.image || '',
      author: link.metadata?.author || link.author || '',
      publishedTime: link.metadata?.publishedTime || link.publishedTime || '',
      siteName: link.metadata?.siteName || link.siteName || ''
    },
    labels: Array.isArray(link.labels) ? link.labels : (link.label ? [link.label] : ['research']),
    priority: link.priority || 'medium',
    status: link.status || 'active',
    createdAt: link.createdAt || new Date().toISOString(),
    updatedAt: link.updatedAt || new Date().toISOString(),
    boardId: link.boardId || null
  };
}

const savedSort = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem('linkSort') || '');
    // If no saved sort or if it's the old default (createdAt), use labels as default
    if (!saved || saved.key === 'createdAt') {
      const defaultSort = { key: 'labels' as SortKey, dir: 'asc' as SortDir };
      localStorage.setItem('linkSort', JSON.stringify(defaultSort));
      return defaultSort;
    }
    return saved as { key: SortKey; dir: SortDir };
  } catch {
    // If parsing fails, set labels as default
    const defaultSort = { key: 'labels' as SortKey, dir: 'asc' as SortDir };
    localStorage.setItem('linkSort', JSON.stringify(defaultSort));
    return defaultSort;
  }
})();

const linkStore = create<LinkState>()((set, get) => ({
  links: [],
  rawLinks: [],
  loading: false,
  error: undefined,
  sortKey: savedSort?.key || 'labels',
  sortDir: savedSort?.dir || 'desc',
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
    
    try {
      // First try to get links from the extension's storage
      const extensionLinks = await this.getLinksFromExtension();
      if (extensionLinks.length > 0) {
        console.log('[Dashboard] Found', extensionLinks.length, 'links from extension storage');
        console.log('[Dashboard] First link structure:', extensionLinks[0]);
        set({ rawLinks: extensionLinks, loading: false });
        get().applyFilters();
        return;
      }
      
      console.log('[Dashboard] No links from extension');
      set({ rawLinks: [], loading: false });
      get().applyFilters();
    } catch (error) {
      console.error('[Dashboard] Error fetching links from extension:', error);
      set({ rawLinks: [], loading: false, error: 'Failed to load links from extension' });
    }
  },

  getLinksFromExtension: async function () {
    return new Promise<Link[]>((resolve) => {
      // Try to get links from extension using window.postMessage
      const messageId = 'get-links-' + Date.now();
      let timeout: NodeJS.Timeout;
      
            const handleResponse = async (event: MessageEvent) => {
        if (event.data && event.data.type === 'SRT_LINKS_RESPONSE' && event.data.messageId === messageId) {
          window.removeEventListener('message', handleResponse);
          clearTimeout(timeout);
          
          if (event.data.links) {
            console.log('[Dashboard] Received', event.data.links.length, 'links from extension');
            // Normalize the link data structure
            const normalizedLinks = event.data.links.map(normalizeLinkStructure);
            console.log('[Dashboard] Normalized first link:', normalizedLinks[0]);
            
            // Don't save to local database to avoid Dexie conflicts
            // Panel operations will work directly with extension storage
            console.log('[Dashboard] Using extension storage for panel operations');
            
            resolve(normalizedLinks);
          } else {
            resolve([]);
          }
        }
      };
      
      window.addEventListener('message', handleResponse);
      
      // Set timeout to avoid hanging
      timeout = setTimeout(() => {
        window.removeEventListener('message', handleResponse);
        console.log('[Dashboard] Extension not responding, using local storage');
        resolve([]);
      }, 2000);
      
      // Request links from extension
      window.postMessage({
        type: 'SRT_GET_LINKS',
        messageId: messageId
      }, '*');
      
      // Also try to inject the content script if it's not loaded
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        try {
          chrome.runtime.sendMessage({ type: 'INJECT_CONTENT_SCRIPT' });
        } catch (_) {
          // Ignore errors - extension might not be available
        }
      }
    });
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
    
    console.log('🔍 Applying filters:', {
      totalLinks: rawLinks.length,
      statusFilter,
      priorityFilter,
      searchTerm,
      sortKey,
      sortDir
    });
    
    let links = [...rawLinks];
    if (statusFilter) {
      links = links.filter((l) => l.status === statusFilter);
      console.log('📊 After status filter:', links.length);
    }
    if (priorityFilter) {
      links = links.filter((l) => l.priority === priorityFilter);
      console.log('📊 After priority filter:', links.length);
    }
    if (searchTerm) {
      links = links.filter(
        (l) =>
          (l.metadata?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.url.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('📊 After search filter:', links.length);
    }
    links.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'labels') {
        const aLabel = (a.labels && a.labels.length > 0) ? a.labels[0] : '';
        const bLabel = (b.labels && b.labels.length > 0) ? b.labels[0] : '';
        cmp = aLabel.localeCompare(bLabel);
      } else if (sortKey === 'createdAt') {
        // Sort by creation date
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
    console.log('🔄 Setting status filter:', status);
    set({ statusFilter: status });
    const { rawLinks } = get();
    if (rawLinks.length === 0) {
      void get().loadLinks();
    } else {
      get().applyFilters();
    }
  },
  setPriorityFilter(priority) {
    console.log('🔄 Setting priority filter:', priority);
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
      const dir: SortDir = state.sortKey === key ? (state.sortDir === 'asc' ? 'desc' : 'asc') : 'asc';
      const obj = { sortKey: key, sortDir: dir };
      localStorage.setItem('linkSort', JSON.stringify({ key, dir }));
      return obj;
    });
    get().applyFilters();
  },
  setSearchTerm(term) {
    console.log('🔄 Setting search term:', term);
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

// Also listen for extension broadcasts so dashboard updates immediately
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event: MessageEvent) => {
    if (event?.data?.type === 'SRT_DB_UPDATED' || event?.data?.type === 'SRT_UPSERT_LINK') {
      linkStore.getState().fetchLinks();
    }
  });
  document.addEventListener('srt-db-updated', () => {
    linkStore.getState().fetchLinks();
  });
  document.addEventListener('srt-upsert-link', () => {
    linkStore.getState().fetchLinks();
  });
}

export const useLinkStore = linkStore;
export { linkStore };
