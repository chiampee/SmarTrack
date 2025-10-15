import { db } from '../db/smartResearchDB';
import { Link } from '../types/Link';
import { errorHandler, createExtensionError, createDatabaseError } from '../utils/errorHandler';

export const linkService = {
  async getAll() {
    try {
      return await db.links.toArray();
    } catch (err) {
      // Dexie/IndexedDB unavailable (incognito, blocked cookies, etc.)
      // Fail soft: return empty so the app can rely on extension storage without noisy errors
      console.warn('[Dashboard] Local DB unavailable in getAll(); returning empty list');
      return [] as Link[];
    }
  },
  async getById(id: string) {
    try {
      return await db.getLink(id);
    } catch (err) {
      console.warn('[Dashboard] Local DB unavailable in getById(); returning null');
      return null as unknown as Link;
    }
  },
  async create(link: Link) {
    link.createdAt = new Date();
    link.updatedAt = new Date();
    
    // Use only the local database as the single source of truth
    try {
      console.log('[LinkService] Creating link in local database:', link.id);
      return await db.addLink(link);
    } catch (err) {
      console.error('[LinkService] Failed to create link:', err);
      try { errorHandler.handleError(createDatabaseError(err as Error, { source: 'linkService.create' })); } catch {}
      throw err;
    }
  },
  async update(id: string, changes: Partial<Link>) {
    changes.updatedAt = new Date();
    
    // Use only the local database as the single source of truth
    try {
      console.log('[LinkService] Updating link in local database:', id);
      return await db.updateLink(id, changes);
    } catch (err) {
      console.error('[LinkService] Failed to update link:', err);
      try { errorHandler.handleError(createDatabaseError(err as Error, { source: 'linkService.update' })); } catch {}
      throw err;
    }
  },
  async remove(id: string) {
    // Use only the local database as the single source of truth
    try {
      console.log('[LinkService] Removing link from local database:', id);
      
      // Fetch the link first so we can archive minimal metadata before hard-deleting
      const link = await db.getLink(id);

      // Delete the link and any summaries inside a single transaction to keep Dexie happy
      await db.transaction('rw', db.links, db.summaries, async () => {
        // Wipe summaries for this link to free large raw-text entries
        await db.summaries.where('linkId').equals(id).delete();
        await db.deleteLink(id);
      });

      // Persist trimmed metadata (≤ 5 KB once stringified) for potential future use
      if (link && typeof window !== 'undefined') {
        const metaOnly = {
          id: link.id,
          url: link.url,
          metadata: {
            title: link.metadata?.title || '',
            description: (link.metadata?.description || '').slice(0, 5000),
          },
          labels: link.labels,
          deletedAt: new Date().toISOString(),
        };

        try {
          const key = 'deletedLinkMeta_v1';
          const existing: (typeof metaOnly)[] = JSON.parse(
            localStorage.getItem(key) || '[]'
          );
          existing.push(metaOnly);
          // Guard total per-item size and keep JSON under control
          localStorage.setItem(key, JSON.stringify(existing));
        } catch {
          /* ignore quota / JSON errors */
        }
      }
      
      return Promise.resolve();
    } catch (err) {
      console.error('[LinkService] Failed to remove link:', err);
      try { errorHandler.handleError(createDatabaseError(err as Error, { source: 'linkService.remove' })); } catch {}
      throw err;
    }
  },

  async clearAll() {
    console.log('🗑️ Starting clearAll operation...');
    
    // Clear all data from the database
    await db.clearAll();
    
    // Clear localStorage metadata stubs and any other localStorage items
    if (typeof window !== 'undefined') {
      const keysToRemove = [
        'deletedLinkMeta_v1',
        'linkColumnWidths',
        'linkVisibleColumns',
        'linkColumnOrder',
        'linkTextPresentationMode',
        'linkGroupOrder',
        'linkSort'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('🗑️ Cleared localStorage items:', keysToRemove);
    }
    
    // Notify content scripts to purge any extension queues / IndexedDB copies
    if (typeof window !== 'undefined') {
      window.postMessage({ type: 'SRT_CLEAR_ALL_LINKS' }, '*');
      console.log('🗑️ Sent clear message to content scripts');
    }
    
    // Send message to extension to clear its storage
    if (typeof window !== 'undefined' && (window as any).chrome?.runtime) {
      try {
        await new Promise<void>((resolve, reject) => {
          (window as any).chrome.runtime.sendMessage({ type: 'CLEAR_ALL_LINKS' }, (response: any) => {
            if ((window as any).chrome.runtime.lastError) {
              console.warn('Extension not available:', (window as any).chrome.runtime.lastError);
              resolve(); // Don't fail if extension is not available
            } else if (response?.success) {
              console.log('🗑️ Extension storage cleared successfully');
              resolve();
            } else {
              console.warn('Extension clear failed:', response?.error);
              resolve(); // Don't fail if extension clear fails
            }
          });
        });
      } catch (error) {
        console.warn('Failed to communicate with extension:', error);
      }
    }
    
    // Also try to clear any IndexedDB instances that might be used by content scripts
    if (typeof window !== 'undefined') {
      try {
        // Try to clear any other IndexedDB databases that might exist
        const databases = await window.indexedDB.databases();
        for (const database of databases) {
          if (database.name && database.name.includes('SmartResearch')) {
            console.log('🗑️ Clearing additional IndexedDB database:', database.name);
            const db = await window.indexedDB.deleteDatabase(database.name);
          }
        }
      } catch (error) {
        console.warn('Failed to clear additional IndexedDB databases:', error);
      }
    }
    
    // Force clear extension storage directly if possible
    if (typeof window !== 'undefined' && (window as any).chrome?.storage) {
      try {
        await new Promise<void>((resolve) => {
          (window as any).chrome.storage.local.clear(() => {
            console.log('🗑️ Force cleared all Chrome storage');
            resolve();
          });
        });
      } catch (error) {
        console.warn('Failed to force clear Chrome storage:', error);
      }
    }
    
    // Also try to clear extension storage via runtime message
    if (typeof window !== 'undefined' && (window as any).chrome?.runtime) {
      try {
        await new Promise<void>((resolve) => {
          (window as any).chrome.runtime.sendMessage({ type: 'CLEAR_ALL_DATA' }, (response: any) => {
            if ((window as any).chrome.runtime.lastError) {
              console.warn('Extension runtime not available:', (window as any).chrome.runtime.lastError);
            } else if (response?.success) {
              console.log('🗑️ Extension runtime clear successful');
            } else {
              console.warn('Extension runtime clear failed:', response?.error);
            }
            resolve();
          });
        });
      } catch (error) {
        console.warn('Failed to clear via extension runtime:', error);
      }
    }
    
    // Briefly pause content-script bridge to avoid races, with an auto-expiring TTL
    if (typeof window !== 'undefined') {
      try {
        const ttlMs = 4000;
        const until = Date.now() + ttlMs;
        localStorage.setItem('skipExtensionStorageUntil', String(until));
        // Do NOT set legacy flag; we only support TTL moving forward
        console.log('🗑️ Set skipExtensionStorage TTL for', ttlMs, 'ms');
        setTimeout(() => {
          // Clean TTL if expired
          const raw = localStorage.getItem('skipExtensionStorageUntil');
          const exp = raw ? parseInt(raw, 10) : 0;
          if (!exp || Date.now() >= exp) {
            localStorage.removeItem('skipExtensionStorageUntil');
          }
        }, ttlMs + 50);
      } catch {
        /* ignore */
      }
    }
    
    console.log('✅ ClearAll operation completed');
    return Promise.resolve();
  },
  async filterByStatus(status: Link['status']) {
    return db.links.where('status').equals(status).toArray();
  },
  async filterByPriority(priority: Link['priority']) {
    return db.links.where('priority').equals(priority).toArray();
  },
};
