## Database Schema Overview

This app uses IndexedDB via Dexie for offline-first storage. The database is defined in `src/db/smartResearchDB.ts` and instantiated as `db`.

### Tables

- **boards**: user boards
  - Key: `id`
  - Indexes: `title`, `color`, `createdAt`

- **links**: saved links and optional AI summaries
  - Key: `id`
  - Indexes: `url`, `summary`, `labels`, `priority`, `status`, `boardId`, `createdAt`

- **summaries**: AI-generated content related to links
  - Key: `id`
  - Indexes: `linkId`, `kind`, `createdAt`

- **chatMessages**: chat message history
  - Key: `id`
  - Indexes: `linkId`, `conversationId`, `timestamp`

- **conversations**: conversational threads across one or more links
  - Key: `id`
  - Indexes: `linkIdsKey` (derived from `linkIds`), `startedAt`, `endedAt`

- **settings**: app/user settings (singleton with `id = "user"`)
  - Key: `id`

- **tasks**: task items optionally linked to boards
  - Key: `id`
  - Indexes: `status`, `priority`, `dueDate`, `createdAt`, `boardId`, `parentId`

### Version History (indexes only)

- v1: initial tables
- v2: add `tasks`
- v3: `summaries.kind/linkId`; `chatMessages.linkId`
- v4: ensure `chatMessages.linkId` index
- v5: add `conversations` and `chatMessages.conversationId`
- v6: `links.boardId` index
- v7: `links.summary` index
- v8: backfill and normalize Date fields across tables
- v9: add `conversations.linkIdsKey` derived index

### Common Operations

```ts
import { db } from '../src/db/smartResearchDB';

// Add a link
await db.addLink({ id, url, metadata, labels: [], priority: 'medium', status: 'active', createdAt: new Date(), updatedAt: new Date() });

// Get messages in a conversation
const messages = await db.getChatMessagesByConversation(conversationId);

// Find active conversation matching a set of links
const active = await db.getActiveConversationByLinks([linkId1, linkId2]);

// Upsert settings (singleton with id 'user')
await db.upsertSettings({ id: 'user', theme: 'system', sortOrder: 'desc', language: 'en', createdAt: new Date(), updatedAt: new Date() });
```

### Migrations

Add a new version in `SmartResearchDB` constructor using `this.version(n).stores({...})`. If you need data changes, chain `.upgrade(async (tx) => { ... })` to transform existing rows.

Guidelines:
- Only add indexes/fields via `stores` on a new version; never modify past versions.
- Normalize data during `.upgrade` and handle legacy nullable/optional fields.
- Use `try/catch` and the `logError(scope, err)` helper for visibility.

Example skeleton:

```ts
this.version(10).stores({
  links: 'id, url, summary, labels, priority, status, boardId, createdAt, /* newIndex */',
  // ...other tables unchanged
});

this.version(10).upgrade(async (tx) => {
  await tx.table('links').toCollection().modify((l: Link & { /* new fields */ }) => {
    // backfill values or normalize formats
  });
});
```

### Clearing Data (development/diagnostics)

Use `await db.clearAll()` to remove data across tables. This runs in safe, separate transactions and should only be used for diagnostics or full resets.

### Notes

- Verbose debug logs are suppressed during tests.
- Error paths use `logError(scope, error)` for consistent reporting.





