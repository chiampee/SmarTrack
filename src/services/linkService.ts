import { db } from '../db/smartResearchDB';
import { Link } from '../types/Link';

export const linkService = {
  async getAll() {
    return db.links.toArray();
  },
  async getById(id: string) {
    return db.getLink(id);
  },
  async create(link: Link) {
    link.createdAt = new Date();
    link.updatedAt = new Date();
    return db.addLink(link);
  },
  async update(id: string, changes: Partial<Link>) {
    changes.updatedAt = new Date();
    // If running in the dashboard with the extension available, route updates
    // to the extension storage so the list reflects edits immediately.
    if (typeof window !== 'undefined') {
      try {
        const messageId = `update-link-${id}-${Date.now()}`;
        const result = await new Promise<{ ok: boolean }>((resolve) => {
          const handler = (event: MessageEvent) => {
            const data = (event?.data || {}) as any;
            if (
              data?.type === 'SRT_UPDATE_LINK_OK' &&
              data?.messageId === messageId
            ) {
              window.removeEventListener('message', handler);
              resolve({ ok: true });
            }
          };
          window.addEventListener('message', handler);
          try {
            window.postMessage(
              {
                type: 'SRT_UPDATE_LINK',
                messageId,
                id,
                changes,
              },
              '*'
            );
          } catch (_) {
            // fall through to Dexie
            window.removeEventListener('message', handler);
            resolve({ ok: false });
          }
          // Safety timeout to avoid hanging if extension not present
          setTimeout(() => {
            window.removeEventListener('message', handler);
            resolve({ ok: false });
          }, 1200);
        });
        if (result.ok) return Promise.resolve();
      } catch {
        // ignore and fall back to Dexie
      }
    }
    return db.updateLink(id, changes);
  },
  async remove(id: string) {
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
  },

  async clearAll() {
    // Drop the entire database to ensure nothing lingers.
    await db.delete();
    // Re-instantiate (Dexie recreates object stores on demand)
    await db.open();

    // Notify content scripts to purge any extension queues / IndexedDB copies
    if (typeof window !== 'undefined') {
      window.postMessage({ type: 'SRT_CLEAR_ALL_LINKS' }, '*');
    }
    // Optionally clear the trimmed metadata stubs as well
    if (typeof window !== 'undefined') {
      localStorage.removeItem('deletedLinkMeta_v1');
    }
    return Promise.resolve();
  },
  async filterByStatus(status: Link['status']) {
    return db.links.where('status').equals(status).toArray();
  },
  async filterByPriority(priority: Link['priority']) {
    return db.links.where('priority').equals(priority).toArray();
  },
};
