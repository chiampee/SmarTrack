// Replace old categorySelect logic
let selectedCat = 'link';
const boardSelect = document.getElementById('board');
const linkFields = document.getElementById('linkFields');
const statusEl = document.getElementById('status');

// label elements
const labelSelect = document.getElementById('labelSelect');
const labelInput = document.getElementById('labelInput');

const catEls = document.querySelectorAll('.cat');
catEls.forEach((el) => {
  el.addEventListener('click', () => {
    catEls.forEach((e) => e.classList.remove('active'));
    el.classList.add('active');
    selectedCat = el.dataset.cat;
    toggleFields();
  });
});

const toggleFields = () => {
  const show = selectedCat === 'link';
  linkFields.style.display = show ? 'block' : 'none';
  boardSelect.style.display = show ? 'block' : 'none';
  document.getElementById('saveBtn').disabled = !show;
};

toggleFields();

// Load boards and labels from storage
chrome.storage.local.get(['boards', 'labels', 'links'], (res) => {
  const boards = (res.boards || []).filter((b) => b.title !== 'Default');
  if (boards.length === 0) {
    boardSelect.style.display = 'none';
  } else {
    boards.forEach((b) => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.title;
      boardSelect.appendChild(opt);
    });
  }

  let labels = res.labels || [];
  if ((!labels || labels.length === 0) && res.links) {
    const set = new Set();
    res.links.forEach((lnk) => {
      if (lnk.label) set.add(lnk.label);
    });
    labels = Array.from(set);
  }
  const makeNewOption = () => {
    const o = document.createElement('option');
    o.value = '__new';
    o.textContent = '➕ New label…';
    return o;
  };

  if (labels.length) {
    labelSelect.style.display = 'block';
    labelSelect.innerHTML = '';
    labels.forEach((l) => {
      const opt = document.createElement('option');
      opt.value = l;
      opt.textContent = l;
      labelSelect.appendChild(opt);
    });
    labelSelect.appendChild(makeNewOption());

    labelSelect.addEventListener('change', () => {
      if (labelSelect.value === '__new') {
        labelSelect.style.display = 'none';
        labelInput.style.display = 'block';
        labelInput.focus();
      }
    });
  } else {
    // no labels yet: show input
    labelInput.style.display = 'block';
  }

  // Always ask content script for labels in Dexie to merge any new ones
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (!tabId) return;
    chrome.tabs.sendMessage(tabId, { type: 'GET_LABELS' }, (resp) => {
      if (chrome.runtime.lastError) return; // content script not available
      const labs = resp?.labels || [];
      if (!labs.length) return;

      // Build Set of existing labels for quick check
      const existing = new Set();
      Array.from(labelSelect.options).forEach((o) => {
        if (o.value !== '__new') existing.add(o.value);
      });

      let added = false;
      labs.forEach((l) => {
        if (!existing.has(l)) {
          const opt = document.createElement('option');
          opt.value = l;
          opt.textContent = l;
          // insert before the "+ New label" option if present
          const newOpt = labelSelect.querySelector('option[value="__new"]');
          if (newOpt) labelSelect.insertBefore(opt, newOpt);
          else labelSelect.appendChild(opt);
          existing.add(l);
          added = true;
        }
      });

      if (added) {
        // ensure select visible if labels now exist
        labelSelect.style.display = 'block';
        if (labelInput.style.display !== 'none') {
          // keep whatever user typed, do not overwrite
        }

        // persist merged label list back to chrome.storage
        chrome.storage.local.set({ labels: Array.from(existing) });
      }
    });
  });
});

// Prefill title and enable button
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  const input = document.getElementById('title');
  if (input && tab && tab.title) {
    input.value = tab.title;
    document.getElementById('saveBtn').disabled = false;
  }
});

// Save handler
document.getElementById('saveBtn').addEventListener('click', () => {
  document.getElementById('saveBtn').disabled = true;
  statusEl.textContent = 'Saving…';
  const cat = selectedCat;
  if (cat !== 'link') {
    statusEl.textContent = 'Only Link saving supported right now.';
    return;
  }

  const boardId = boardSelect.value;
  let label = '';
  if (labelSelect && labelSelect.style.display !== 'none') {
    label = labelSelect.value === '__new' ? '' : labelSelect.value;
  }
  if (labelInput && labelInput.style.display !== 'none') {
    label = labelInput.value.trim();
  }
  const priority = document.getElementById('priority').value;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.url || tab.id === undefined) return;

    // Inject script to extract page data
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: async () => {
          const title = document.title || '';
          const desc = document.querySelector('meta[name="description"]')?.content || '';
          async function extractText() {
            // 0. Auto-expand common "Read more" / "Show more" collapsible sections
            const autoExpand = async () => {
              try {
                const triggers = Array.from(document.querySelectorAll('button, a, span'));
                const re = /(read more|show more|continue reading|more…|more\u2026|read full)/i;
                triggers.forEach((el) => {
                  if (re.test(el.textContent || '')) {
                    try { el.click(); } catch {}
                  }
                });

                // Scroll down to trigger lazy loading (images/infinite articles)
                for (let i = 0; i < 3; i++) {
                  window.scrollTo(0, document.body.scrollHeight);
                  await new Promise((res) => setTimeout(res, 350));
                }
              } catch {}
            };

            await autoExpand();

            // Helper: deep-clone and strip boilerplate elements
            const cleanClone = () => {
              const doc = document.cloneNode(true);
              const removeSel = [
                'script',
                'style',
                'nav',
                'header',
                'footer',
                'aside',
                '.ads',
                '[aria-label*="advert" i]',
                '[role="banner" i]',
                '[role="contentinfo" i]',
              ];
              removeSel.forEach((sel) => {
                doc.querySelectorAll(sel).forEach((el) => el.remove());
              });
              return doc;
            };

            let txt = '';
            // 1. Try Readability (best for main article content)
            try {
              const { Readability } = await import('https://cdn.jsdelivr.net/npm/@mozilla/readability@0.4.4/+esm');
              const article = new Readability(cleanClone()).parse();
              if (article?.textContent) txt = article.textContent;
            } catch {}

            // 2. Fallback to body innerText if Readability failed or too short
            if (txt.trim().length < 500) {
              try {
                const raw = document.body?.innerText || '';
                if (raw.trim().length > txt.length) txt = raw;
              } catch {}
            }

            // 3. Second fallback to documentElement.innerText
            if (txt.trim().length < 500) {
              try {
                const raw2 = document.documentElement?.innerText || '';
                if (raw2.trim().length > txt.length) txt = raw2;
              } catch {}
            }

            // Basic cleanup: remove short lines & common promotional phrases
            const AD_PATTERNS = [
              /get the .*app/i,
              /subscribe.*substack/i,
              /^share .*twitter$/i,
              /advertisement/i,
              /sponsored/i,
              /sign up/i,
            ];

            txt = txt.split('\n').filter((line) => {
              const l = line.trim();
              if (!l) return false;
              if (l.split(/\s+/).length < 4) return false; // very short = likely nav or caption
              if (AD_PATTERNS.some((re) => re.test(l))) return false;
              return true;
            }).join('\n');

            return txt.slice(0, 500_000);
          }

          const txt = await extractText();
          return { title, description: desc, text: txt };
        },
      },
      (res) => {
        const pageData = res?.[0]?.result || { title: '', description: '', text: '' };

        chrome.runtime.sendMessage(
          {
            type: 'SAVE_LINK',
            payload: {
              url: tab.url,
              title: pageData.title,
              boardId,
              label,
              description: pageData.description,
              priority,
              tabId: tab.id,
              pageText: pageData.text,
            },
          },
          () => {
            statusEl.textContent = 'Saved!';
            setTimeout(() => window.close(), 800);
          },
        );
      },
    );
  });
}); 