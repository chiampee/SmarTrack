chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'CLEAR_ALL_LINKS') {
    chrome.storage.local.remove(['pendingUpserts', 'links'], () => {
      sendResponse?.({ ok: true });
    });
    return true; // async
  }
  if (msg.type === 'SAVE_LINK') {
    const payload = msg.payload;

    // Build full Link object compatible with Dexie schema
    const linkForDexie = {
      id: crypto.randomUUID(),
      url: payload.url,
      metadata: {
        title: payload.title || '',
        description: payload.description || '',
        image: '',
      },
      labels: payload.label ? [payload.label] : [],
      priority: payload.priority || 'low',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      boardId: payload.boardId || null,
    };

    // Persist to chrome.storage as raw payload (legacy)
    chrome.storage.local.get(['links'], (res) => {
      const links = res.links || [];
      const normUrl = payload.url.replace(/\/+$/, '').toLowerCase();
      const exists = links.some((l) => (l.url || '').replace(/\/+$/, '').toLowerCase() === normUrl);
      if (!exists) {
        links.push({ ...payload, savedAt: Date.now(), id: linkForDexie.id });
      } else {
        console.debug?.('Duplicate link ignored', payload.url);
      }
      chrome.storage.local.set({ links }, () => {
        console.log('Link saved to chrome.storage', payload);
        sendResponse?.({ ok: true });
      });

      // store label if new
      if (payload.label) {
        chrome.storage.local.get(['labels'], (r2) => {
          const labels = new Set(r2.labels || []);
          labels.add(payload.label);
          chrome.storage.local.set({ labels: Array.from(labels) });
        });
      }
    });

    // Broadcast to all tabs so contentScript can add to Dexie
    const APP_URL_PATTERNS = ['http://localhost:5173/*', 'https://smartresearchtracker.vercel.app/*'];

    const storePending = (item) => {
      chrome.storage.local.get(['pendingUpserts'], (r) => {
        const arr = r.pendingUpserts || [];
        arr.push(item);
        chrome.storage.local.set({ pendingUpserts: arr });
      });
    };

    const flushPending = () => {
      chrome.storage.local.get(['pendingUpserts'], (r) => {
        const queue = r.pendingUpserts || [];
        if (!queue.length) return;
        chrome.tabs.query({ url: APP_URL_PATTERNS }, (tabs) => {
          if (!tabs.length) return; // still no dashboard
          const tabId = tabs[0].id;
          if (tabId === undefined) return;
          const toSend = queue.splice(0, queue.length);
          toSend.forEach((item) => {
            chrome.tabs.sendMessage(tabId, item, () => {
              if (chrome.runtime.lastError) {
                // push back
                queue.push(item);
              }
              chrome.storage.local.set({ pendingUpserts: queue });
            });
          });
        });
      });
    };

    // run flush every 30s
    setInterval(flushPending, 30_000);

    const broadcastUpsert = (linkObj, summariesArr = []) => {
      chrome.tabs.query({ url: APP_URL_PATTERNS }, (tabs) => {
        if (!tabs.length) {
          storePending({ type: 'UPSERT_LINK', link: linkObj, summaries: summariesArr });
          return;
        }
        tabs.forEach((t) => {
          if (t.id === undefined) return;
          chrome.tabs.sendMessage(t.id, { type: 'UPSERT_LINK', link: linkObj, summaries: summariesArr }, () => {
            if (chrome.runtime.lastError) {
              console.debug?.('UPSERT_LINK send error', chrome.runtime.lastError.message);
              storePending({ type: 'UPSERT_LINK', link: linkObj, summaries: summariesArr });
            }
          });
        });
      });
    };

    // send initial upsert with no summaries yet (summaries may be added later)
    broadcastUpsert(linkForDexie, []);

    /** Helper to broadcast summary to dashboard */
    const broadcastSummary = (summaryObj) => {
      broadcastUpsert(linkForDexie, [summaryObj]);
    };

    // Base endpoint can be configured via chrome.storage.local.set({ apiBase: 'https://your-domain.com' })
    const getApiBase = (cb) => {
      chrome.storage.local.get(['apiBase'], (res) => {
        cb(res.apiBase || 'https://smartresearchtracker.vercel.app');
      });
    };

    /** Helper to call enrich backend */
    const callEnrich = (pageText) => {
      getApiBase((base) => {
        fetch(`${base.replace(/\/$/, '')}/api/enrich`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linkId: linkForDexie.id, url: linkForDexie.url, text: pageText }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (!data?.summary) return;
            const tldrSummary = {
              id: crypto.randomUUID(),
              linkId: linkForDexie.id,
              kind: 'tldr',
              content: data.summary,
              embedding: data.embeddings?.[0] || undefined,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            broadcastSummary(tldrSummary);
          })
          .catch((err) => console.debug?.('enrich fetch error', err));
      });
    };

    // Use pageText if provided from popup extraction, else capture via executeScript
    let initialText = payload.pageText || '';

    const processText = (pageText) => {
      if (!pageText) return;

      // Store raw summary
      const rawSummary = {
        id: crypto.randomUUID(),
        linkId: linkForDexie.id,
        kind: 'raw',
        content: pageText,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      broadcastSummary(rawSummary);

      // Call backend enrich
      callEnrich(pageText);
    };

    if (initialText) {
      processText(initialText.slice(0, 500_000));
    } else {
      // Capture page text from the active tab as fallback
      const tabId = payload.tabId;
      if (tabId !== undefined) {
        chrome.scripting.executeScript(
          {
            target: { tabId },
            func: () => document.body.innerText.slice(0, 500_000),
          },
          async (res) => {
            let pageText = '';
            if (chrome.runtime.lastError) {
              console.debug?.('executeScript error:', chrome.runtime.lastError.message);
            } else {
              pageText = res?.[0]?.result || '';
            }

          // Fallback via jina.ai if executeScript gave nothing
          if (!pageText) {
            try {
              const clean = linkForDexie.url.replace(/^https?:\/\//, '');
              const jin = await fetch(`https://r.jina.ai/http://${clean}`).then((r) => (r.ok ? r.text() : ''));
              pageText = jin.slice(0, 500_000);
            } catch (err) {
              console.debug?.('jina.ai fetch failed', err);
            }
          }

          processText(pageText);
        },
        );
      }
    }

    return true; // keep message channel open for async sendResponse
  }
}); 