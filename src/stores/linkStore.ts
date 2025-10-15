import { create } from 'zustand';
import { Link } from '../types/Link';
import { linkService } from '../services/linkService';
import { db } from '../db/smartResearchDB';
import { errorHandler, createDatabaseError, createExtensionError } from '../utils/errorHandler';

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
  isClearing: boolean; // Flag to prevent auto-refresh during clearing
  isMirroring: boolean; // Flag to prevent DB hooks from refetching during mirror
  isFetching: boolean; // Flag to prevent concurrent fetches
  bulkDeleteModalOpen: boolean; // Moved from component state to prevent loss on re-renders
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
  setBulkDeleteModalOpen: (open: boolean) => void;
  // Extension bridge helpers
  getLinksFromExtension: () => Promise<Link[]>;
  injectContentScriptAndRetry: (messageId: string) => Promise<Link[]>;
}

// Function to normalize link structure from extension
function normalizeLinkStructure(link: any): Link {
  return {
    id: link.id || crypto.randomUUID(),
    url: link.url || '',
    metadata: {
      title: link.metadata?.title || link.title || 'Untitled',
      description: link.metadata?.description || link.description || '',
      image: link.metadata?.image || link.image || ''
    },
    labels: Array.isArray(link.labels) ? link.labels : (link.label ? [link.label] : ['research']),
    priority: link.priority || 'medium',
    status: link.status || 'active',
    createdAt: link.createdAt ? new Date(link.createdAt) : new Date(),
    updatedAt: link.updatedAt ? new Date(link.updatedAt) : new Date(),
    boardId: link.boardId || null
  };
}

// URL normalizer for cross-source comparisons
function normalizeUrlForCompare(u: string): string {
  return (u || '').toString().replace(/\/+$/, '').toLowerCase();
}

// Deduplicate links by URL, keeping the most recent one
function deduplicateLinks(links: Link[]): Link[] {
  const urlMap = new Map<string, Link>();
  
  for (const link of links) {
    const normalizedUrl = normalizeUrlForCompare(link.url);
    const existing = urlMap.get(normalizedUrl);
    
    if (!existing || new Date(link.updatedAt) > new Date(existing.updatedAt)) {
      urlMap.set(normalizedUrl, link);
    }
  }
  
  return Array.from(urlMap.values());
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
  isClearing: false,
  isMirroring: false,
  isFetching: false,
  bulkDeleteModalOpen: false,
  async loadLinks() {
    try {
      await get().fetchLinks();
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
  fetchLinks: async function () {
    // Don't fetch if we're in the middle of clearing
    if (get().isClearing) {
      console.log('🔄 Skipping fetchLinks during clear operation');
      return;
    }
    
    // Don't fetch if already fetching (prevent concurrent fetches)
    if (get().isFetching) {
      console.log('🔄 Already fetching links, skipping duplicate request');
      return;
    }
    
    set({ loading: true, error: undefined, isFetching: true });
    
    try {
      // Load directly from IndexedDB - the single source of truth
      console.log('[Dashboard] Loading links from IndexedDB (single source of truth)');
      const dbLinks = await linkService.getAll();
      
      // Deduplicate any potential duplicates
      const deduplicatedLinks = deduplicateLinks(dbLinks || []);
      
      console.log('[Dashboard] Loaded', deduplicatedLinks.length, 'links from IndexedDB');
      set({ rawLinks: deduplicatedLinks, loading: false, isFetching: false });
      get().applyFilters();
      
    } catch (error) {
      console.error('[Dashboard] Error fetching links from IndexedDB:', error);
      try {
        errorHandler.handleError(createDatabaseError(error as Error, { source: 'fetchLinks' }));
      } catch {}
      set({ rawLinks: [], loading: false, error: 'Failed to load links from database', isFetching: false });
    }
  },

  getLinksFromExtension: async function () {
    // Check if we should skip extension storage
    let skipLegacy = localStorage.getItem('skipExtensionStorage') === 'true';
    const skipUntilRaw = localStorage.getItem('skipExtensionStorageUntil');
    const skipUntil = skipUntilRaw ? parseInt(skipUntilRaw, 10) : 0;
    const now = Date.now();
    // Auto-cleanup expired flags
    if (skipUntil && now >= skipUntil) {
      try { localStorage.removeItem('skipExtensionStorageUntil'); } catch {}
      if (skipLegacy) {
        try { localStorage.removeItem('skipExtensionStorage'); } catch {}
        skipLegacy = false;
      }
    }
    const skipExtension = skipLegacy || (skipUntil && now < skipUntil);
    if (skipExtension) {
      // During skip window, still try robust background channel, but avoid postMessage
      console.log('[Dashboard] Skipping content-script storage due to clear operation; trying background channel');
      const w: any = window as any;
      if (w?.chrome?.runtime?.sendMessage) {
        try {
          return await new Promise<Link[]>((resolve) => {
            try {
              w.chrome.runtime.sendMessage({ type: 'GET_LINKS' }, (resp: any) => {
                const arr = Array.isArray(resp?.links) ? resp.links : [];
                const normalizedLinks = arr.map(normalizeLinkStructure);
                const deduplicatedLinks = deduplicateLinks(normalizedLinks);
                resolve(deduplicatedLinks);
              });
            } catch {
              resolve([]);
            }
          });
        } catch {
          return [];
        }
      }
      return [];
    }

    // Use window.postMessage communication since chrome.storage is not available from web page context
    console.log('[Dashboard] Using extension communication (bg + postMessage)...');
    return new Promise<Link[]>((resolve) => {
      let settled = false;
      
      // Try to get links from extension using window.postMessage
      const messageId = 'get-links-' + Date.now();
      let timeout: NodeJS.Timeout;
      
      const handleResponse = async (event: MessageEvent) => {
        if (event.data && event.data.type === 'SRT_LINKS_RESPONSE' && event.data.messageId === messageId) {
          console.log('[Dashboard] Received SRT_LINKS_RESPONSE for', messageId);
          window.removeEventListener('message', handleResponse);
          clearTimeout(timeout);
          
          if (event.data.links) {
            console.log('[Dashboard] Received', event.data.links.length, 'links from extension via postMessage');
            // Normalize the link data structure
            const normalizedLinks = event.data.links.map(normalizeLinkStructure);
            console.log('[Dashboard] Normalized first link:', normalizedLinks[0]);
            
            // Deduplicate links to prevent React key conflicts
            const deduplicatedLinks = deduplicateLinks(normalizedLinks);
            console.log('[Dashboard] After deduplication:', deduplicatedLinks.length, 'links');
            
            // Don't save to local database to avoid Dexie conflicts
            // Panel operations will work directly with extension storage
            console.log('[Dashboard] Using extension storage for panel operations');
            if (!settled) { settled = true; resolve(deduplicatedLinks); }
          } else {
            if (!settled) { settled = true; resolve([]); }
          }
        }
        if (event.data && event.data.type === 'SRT_LINKS_ERROR' && event.data.messageId === messageId) {
          // Extension context invalidated; schedule a retry after a short delay
          window.removeEventListener('message', handleResponse);
          clearTimeout(timeout);
          console.warn('[Dashboard] Extension context invalidated, retrying shortly...');
          setTimeout(() => {
            if (!settled) {
              settled = true;
              this.getLinksFromExtension().then(resolve).catch(() => resolve([]));
            }
          }, 1000);
        }
      };
      
      window.addEventListener('message', handleResponse);
      
      // Set timeout to avoid hanging
      timeout = setTimeout(() => {
        window.removeEventListener('message', handleResponse);
        console.log('[Dashboard] Extension not responding via postMessage for', messageId, ', trying fallback...');
        
        // Try to inject content script and retry
        this.injectContentScriptAndRetry(messageId).then((links) => {
          if (!settled) { settled = true; resolve(links); }
        }).catch(() => {
          if (!settled) { settled = true; resolve([]); }
        });
      }, 2000);
      
      // Primary: background GET_LINKS (robust during reloads)
      let w: any = window as any;
      if (w?.chrome?.runtime?.sendMessage) {
        try {
          w.chrome.runtime.sendMessage({ type: 'GET_LINKS' }, (resp: any) => {
            // Only settle if background actually has links; otherwise let postMessage fallback run
            if (!settled && Array.isArray(resp?.links) && resp.links.length > 0) {
              const normalized = resp.links.map(normalizeLinkStructure);
              const deduplicated = deduplicateLinks(normalized);
              settled = true; resolve(deduplicated);
            }
          });
        } catch (_) {}
      }
      // Secondary: postMessage bridge to content script
      try { 
        console.log('[Dashboard] Posting SRT_GET_LINKS with', messageId);
        window.postMessage({ type: 'SRT_GET_LINKS', messageId }, '*'); 
      } catch (_) { console.warn('[Dashboard] Failed to post SRT_GET_LINKS'); }
      
      // Also try to inject the content script if it's not loaded
      w = (window as any);
      if (typeof w !== 'undefined' && w.chrome?.runtime?.sendMessage) {
        try {
          w.chrome.runtime.sendMessage({ type: 'INJECT_CONTENT_SCRIPT' });
        } catch (_) {
          // Ignore errors - extension might not be available
        }
      }
    });
  },

  // Helper method to inject content script and retry communication
  injectContentScriptAndRetry: async function (messageId: string): Promise<Link[]> {
    return new Promise((resolve, reject) => {
      const w = window as any;
      if (typeof w === 'undefined' || !w.chrome?.scripting) {
        reject(new Error('Chrome scripting API not available'));
        return;
      }

      console.log('[Dashboard] Injecting content script...');
      
      // Try to inject content script into current tab
      w.chrome.scripting.executeScript({
        target: { tabId: (window as any).chrome.tabs.TAB_ID_NONE },
        files: ['extension/contentScript.js']
      }).then(() => {
        console.log('[Dashboard] Content script injected, retrying communication...');
        
        // Wait a bit for script to initialize, then retry
        setTimeout(() => {
          const retryMessageId = 'retry-' + Date.now();
          
          const handleRetryResponse = (event: MessageEvent) => {
            if (event.data && event.data.type === 'SRT_LINKS_RESPONSE' && event.data.messageId === retryMessageId) {
              window.removeEventListener('message', handleRetryResponse);
              
              if (event.data.links) {
                console.log('[Dashboard] Retry successful, received', event.data.links.length, 'links');
                const normalizedLinks = event.data.links.map(normalizeLinkStructure);
                const deduplicatedLinks = deduplicateLinks(normalizedLinks);
                resolve(deduplicatedLinks);
              } else {
                resolve([]);
              }
            }
          };
          
          window.addEventListener('message', handleRetryResponse);
          
          // Send retry request
           window.postMessage({
            type: 'SRT_GET_LINKS',
            messageId: retryMessageId
          }, '*');
          
          // Timeout for retry
          setTimeout(() => {
            window.removeEventListener('message', handleRetryResponse);
            console.log('[Dashboard] Retry failed, rejecting');
            reject(new Error('Retry failed'));
          }, 3000);
          
        }, 500);
        
      }).catch((error: unknown) => {
        console.error('[Dashboard] Content script injection failed:', error);
        reject(error as Error);
      });
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
    console.log('🗑️ Clearing all links from store...');
    
    // Set clearing flag to prevent auto-refresh
    set({ isClearing: true });
    
    try {
      // Clear the service
      await linkService.clearAll();
      
      // Reset the store state to empty
      set({ 
        links: [], 
        rawLinks: [], 
        loading: false, 
        error: undefined 
      });
      
      console.log('✅ Store state cleared');
    } finally {
      // Re-enable auto-refresh after a delay
      setTimeout(() => {
        set({ isClearing: false });
        console.log('🔄 Auto-refresh re-enabled');
      }, 3000);
    }
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
  setBulkDeleteModalOpen(open) {
    set({ bulkDeleteModalOpen: open });
  },
}));

// Refresh link list whenever Dexie links table changes (insert/update/delete)
['creating', 'updating', 'deleting'].forEach((hook) => {
  // @ts-ignore – dynamic hook name
  db.links.hook(hook, () => {
    const { isClearing, isMirroring } = linkStore.getState();
    if (!isClearing && !isMirroring) {
      linkStore.getState().fetchLinks();
    } else {
      console.log('🔄 Skipping auto-refresh during clear/mirror operation');
    }
  });
});

// Also listen for extension broadcasts so dashboard updates immediately
if (typeof window !== 'undefined') {
  window.addEventListener('message', async (event: MessageEvent) => {
    // Handle link upsert from extension - save to local IndexedDB
    if (event?.data?.type === 'SRT_UPSERT_LINK' && event?.data?.link) {
      if (linkStore.getState().isClearing) {
        console.log('🔄 Skipping link save during clear operation');
        return;
      }
      
      console.log('📥 [Dashboard] Received link from extension, saving to local IndexedDB');
      try {
        const extLink = event.data.link;
        
        // Convert to dashboard format
        const dashboardLink: Link = {
          id: extLink.id || crypto.randomUUID(),
          url: extLink.url,
          metadata: {
            title: extLink.metadata?.title || extLink.title || '',
            description: extLink.metadata?.description || extLink.description || '',
            image: extLink.metadata?.image || extLink.image || ''
          },
          labels: Array.isArray(extLink.labels) ? extLink.labels : [],
          priority: extLink.priority || 'medium',
          status: extLink.status || 'active',
          boardId: extLink.boardId,
          createdAt: extLink.createdAt ? new Date(extLink.createdAt) : new Date(),
          updatedAt: extLink.updatedAt ? new Date(extLink.updatedAt) : new Date()
        };
        
        // Check if exists
        const existing = await db.links.get(dashboardLink.id);
        if (existing) {
          // Update existing
          await db.links.update(dashboardLink.id, dashboardLink);
          console.log('✅ [Dashboard] Updated existing link in IndexedDB');
        } else {
          // Add new
          await db.links.add(dashboardLink);
          console.log('✅ [Dashboard] Added new link to IndexedDB');
        }
        
        // Refresh to show the new/updated link
        await linkStore.getState().fetchLinks();
      } catch (error) {
        console.error('❌ [Dashboard] Failed to save extension link:', error);
      }
      return;
    }
    
    // Handle generic DB update notifications from extension
    if (event?.data?.type === 'SRT_DB_UPDATED') {
      if (!linkStore.getState().isClearing) {
        console.log('📥 [Dashboard] Extension triggered refresh');
        linkStore.getState().fetchLinks();
      } else {
        console.log('🔄 Skipping auto-refresh during clear operation');
      }
    }
  });
  
  document.addEventListener('srt-db-updated', () => {
    if (!linkStore.getState().isClearing) {
      linkStore.getState().fetchLinks();
    } else {
      console.log('🔄 Skipping auto-refresh during clear operation');
    }
  });
  
  document.addEventListener('srt-upsert-link', () => {
    if (!linkStore.getState().isClearing) {
      linkStore.getState().fetchLinks();
    } else {
      console.log('🔄 Skipping auto-refresh during clear operation');
    }
  });
}

export const useLinkStore = linkStore;
export { linkStore };
