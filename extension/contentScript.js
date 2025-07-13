// Content script injected into every page. It handles messages from the
// background script and persists data into an IndexedDB database that mirrors
// the schema used by the Smart Research Tracker web app. On third-party pages
// the DB may not exist yet, so we lazily create the required object stores in
// an onupgradeneeded handler. This prevents `NotFoundError: One of the
// specified object stores was not found.` runtime exceptions.

console.log('[Smart Research Tracker] content script loaded');

const DB_NAME = 'SmartResearchDB';
const DB_VERSION = 7; // keep in sync with Dexie schema version in the web app
const REQUIRED_STORES = ['links', 'summaries'];

function ensureStores(db) {
  let created = false;
  REQUIRED_STORES.forEach((store) => {
    if (!db.objectStoreNames.contains(store)) {
      const version = db.version + 1;
      db.close();
      const req2 = indexedDB.open(DB_NAME, version);
      req2.onupgradeneeded = () => {
        const upDB = req2.result;
        const objStore = upDB.createObjectStore(store, { keyPath: 'id' });
        if (store === 'links') {
          objStore.createIndex('url', 'url', { unique: false });
        }
      };
      return new Promise((res, rej) => {
        req2.onsuccess = () => res(req2.result);
        req2.onerror = () => rej(req2.error);
      });
    }
  });
  if (!created) return Promise.resolve(db);
}

function openDB() {
  return new Promise((resolve, reject) => {
    const attemptOpen = (verSpecified, cb) => {
      const req = verSpecified ? indexedDB.open(DB_NAME, DB_VERSION) : indexedDB.open(DB_NAME);

      req.onupgradeneeded = () => {
        const db = req.result;
        REQUIRED_STORES.forEach((store) => {
          if (!db.objectStoreNames.contains(store)) {
            const objStore = db.createObjectStore(store, { keyPath: 'id' });
            if (store === 'links') {
              objStore.createIndex('url', 'url', { unique: false });
            }
          }
        });
      };

      req.onsuccess = () => {
        ensureStores(req.result)?.then(resolve).catch(reject) || resolve(req.result);
      };

      req.onerror = () => {
        if (req.error?.name === 'VersionError' && verSpecified) {
          // Retry without explicit version (open existing higher version)
          attemptOpen(false, cb);
        } else {
          reject(req.error);
        }
      };
    };

    attemptOpen(true);
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_LABELS') {
    openDB()
      .then((db) => {
        const tx = db.transaction('links', 'readonly');
        const store = tx.objectStore('links');
        const getAllReq = store.getAll();
        getAllReq.onsuccess = () => {
          const links = getAllReq.result || [];
          const set = new Set();
          links.forEach((l) => {
            if (l.labels && Array.isArray(l.labels)) {
              l.labels.forEach((lab) => set.add(lab));
            }
          });
          sendResponse?.({ labels: Array.from(set) });
        };
        getAllReq.onerror = () => {
          sendResponse?.({ labels: [] });
        };
      })
      .catch(() => sendResponse?.({ labels: [] }));
    return true; // async
  }

  if (msg.type === 'UPSERT_LINK') {
    const { link, summaries = [] } = msg;
    openDB().then((db) => {
      const tx = db.transaction(['links', 'summaries'], 'readwrite');
      const lstore = tx.objectStore('links');
      lstore.put(link);
      const sstore = tx.objectStore('summaries');
      summaries.forEach((s) => sstore.put(s));
    }).catch((err) => console.warn('[SRT] UPSERT_LINK DB error', err));
    return;
  }

  if (msg.type === 'ADD_LINK') {
    const link = msg.payload;
    try {
      openDB()
        .then((db) => {
          const tx = db.transaction('links', 'readwrite');
          const store = tx.objectStore('links');
          const normUrl = link.url.replace(/\/+$/, '').toLowerCase();
          let duplicateCheckDone = false;
          try {
            const idx = store.index('url');
            const checkReq = idx.getAll();
            checkReq.onsuccess = () => {
              duplicateCheckDone = true;
              const exists = (checkReq.result || []).some((l) => (l.url || '').replace(/\/+$/, '').toLowerCase() === normUrl);
              if (!exists) {
                store.put(link);
              } else {
                console.debug('[SRT] Duplicate link ignored by content script', link.url);
              }
            };
          } catch (e) {
            // Index missing – fallback to getAll and linear scan
          }

          if (!duplicateCheckDone) {
            const allReq = store.getAll();
            allReq.onsuccess = () => {
              const exists = (allReq.result || []).some((l) => (l.url || '').replace(/\/+$/, '').toLowerCase() === normUrl);
              if (!exists) {
                store.put(link);
              } else {
                console.debug('[SRT] Duplicate link ignored (fallback)', link.url);
              }
            };
          }
          tx.oncomplete = () => {
            console.log('[SRT] Link added to Dexie via content script', link);
            sendResponse?.({ ok: true });
          };
          tx.onerror = () => {
            console.warn('[SRT] Failed to add link to Dexie', tx.error);
            sendResponse?.({ ok: false, error: tx.error?.message });
          };
        })
        .catch((err) => {
          console.warn('[SRT] Failed to open Dexie DB', err);
          sendResponse?.({ ok: false, error: err?.message });
        });
    } catch (err) {
      console.error('[SRT] ADD_LINK error', err);
      sendResponse?.({ ok: false, error: err.message });
    }
    return true; // async
  }

  if (msg.type === 'ADD_SUMMARY') {
    const summary = msg.payload;
    try {
      openDB()
        .then((db) => {
          const tx = db.transaction('summaries', 'readwrite');
          const store = tx.objectStore('summaries');
          store.put(summary);
          tx.oncomplete = () => {
            console.log('[SRT] Summary added to Dexie via content script', summary);
            sendResponse?.({ ok: true });
          };
          tx.onerror = () => {
            console.warn('[SRT] Failed to add summary to Dexie', tx.error);
            sendResponse?.({ ok: false, error: tx.error?.message });
          };
        })
        .catch((err) => {
          console.warn('[SRT] Failed to open Dexie DB', err);
          sendResponse?.({ ok: false, error: err?.message });
        });
    } catch (err) {
      console.error('[SRT] ADD_SUMMARY error', err);
      sendResponse?.({ ok: false, error: err.message });
    }
    return true; // async
  }
});

// Listen for clear-all signal from the dashboard
window.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'SRT_CLEAR_ALL_LINKS') return;

  // 1. Clear IndexedDB stores
  openDB()
    .then((db) => {
      const tx = db.transaction(['links', 'summaries'], 'readwrite');
      tx.objectStore('links').clear();
      tx.objectStore('summaries').clear();
    })
    .catch((err) => console.warn('[SRT] clearAll IndexedDB error', err));

  // 2. Clear extension queues so they don't repopulate
  if (chrome?.storage?.local) {
    chrome.storage.local.remove(['pendingUpserts', 'links'], () => {
      if (chrome.runtime.lastError) {
        console.debug('[SRT] clearAll storage error', chrome.runtime.lastError.message);
      }
    });
  }

  // 3. Notify background script to clear any in-memory queues
  try {
    chrome.runtime.sendMessage({ type: 'CLEAR_ALL_LINKS' });
  } catch {}
}); 