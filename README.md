# Smart Research Tracker

A Chrome extension + React/Vite dashboard that lets you **capture webpages with up to 500 kB of raw text, auto-generate TL;DRs & embeddings, and chat with an AI assistant over your private research corpus.**

---

## 1  Features

### Browser Extension
* **One-click Save** – grabs title, description, and full article text (Readability-first, with auto-expand for “Read more”).
* **500 kB cap** per page, enforced client-side.
* **Background enrichment** – calls `/api/enrich` to create TL;DR + embedding; queues if dashboard closed.
* Resilient Dexie sync with `UPSERT_LINK` messages and retry queue.
* Responsive popup UI with label & priority selectors.

### Dashboard
* **Kanban-style Links view** with filtering, sort, labels, priorities.
* ℹ️ **Context viewer** – click the info icon to inspect every snippet the AI can access (raw, TL;DR, etc.).
* **Chat modal** with quick prompts and past-conversations sidebar.
* **Boards, Tasks** and statistics widgets.
* “Delete All Links” safety flow – drops IndexedDB and extension queues.

### AI Services
* OpenAI chat & embeddings with automatic retry / rate-limit / fallback to Mistral.
* Similarity search with cosine distance to choose top snippets.
* Caching layer for embeddings and page-text fetches (Jina.ai fallback).

### Data Model (Dexie v4)
```
boards      id, title, color, createdAt
links       id, normUrl*, labels[], priority, status, boardId, createdAt
summaries   id, linkId+kind*, content, embedding?, createdAt
chatMessages id, linkId, conversationId, role, timestamp
conversations id, linkIds[], startedAt, endedAt
```
`*` = unique index.

---

## 2  Getting Started

```bash
pnpm i           # install deps
pnpm dev         # start Vite dev server (http://localhost:5173)
```

### Extension (development)
1. `pnpm run build:extension` (see script below) – outputs `dist-extension/`.
2. Load unpacked in Chrome → Extensions → Developer mode.
3. Click the toolbar icon on any page to save.

Add to `package.json`:
```json
"scripts": {
  "build:extension": "vite build --config vite.config.extension.ts"
}
```
(Vite config copies `extension/` static assets.)

---

## 3  Environment Variables
| Var | Description |
|-----|-------------|
| `VITE_OPENAI_API_KEY` | OpenAI secret key |
| `VITE_OPENAI_MODEL`   | (opt) chat model, default `gpt-4.5-preview` |
| `VITE_OPENAI_EMBED_MODEL` | (opt) embedding model |
| `VITE_MISTRAL_API_KEY` | (opt) fallback provider |
| `VITE_ENRICH_ENDPOINT` | (opt) override `/api/enrich` |

Create `.env.local` in project root.

---

## 4  Tests & Quality

```bash
pnpm test          # Vitest unit tests (src/__tests__)
pnpm lint          # ESLint + Prettier
playwright test    # E2E sample
```

CI will also run `scripts/healthCheck.ts` which pings:
* `/api/enrich`
* OpenAI chat & embed endpoints
* (optional) Mistral chat endpoint

Fail-fast if any return non-200.

---

## 5  Architecture Diagram
```
Popup ➜ background.js ──saveLink──▶ Dexie (contentScript)
        │                           │
        │<──UPSERT_LINK─────────────┘
Dashboard ↕ Dexie ► React stores ► UI
Chat modal ─► chatService ► aiService (OpenAI)
```

---

## 6  Development Notes
* **URL normalisation** via `utils/url.ts` ensures no duplicate links.
* Extraction pipeline: auto-click “read more” → scroll → clone + strip boilerplate → Mozilla Readability → paragraph filter (centroid-cosine) → 500 kB trim.
* Summaries table uses a unique `[linkId+kind]` compound index.
* `migrationService.ts` contains one-off upgrade tasks (conversation backfill, embedding fill).

---

## 7  Roadmap
- [ ] Paragraph cosine filter integration (prototype centroids in `utils/centroids.json`).
- [ ] Optional LLM “Deep Clean” for stubborn sites.
- [ ] Mobile responsive tweaks (larger ℹ️ hit-target).
- [ ] Service-worker build of extension for Manifest V3.

Contributions & PRs welcome! :rocket:
