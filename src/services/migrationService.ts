export const migrationService = {
  /**
   * Backfill conversationId for chat messages that predate the conversations table.
   * Creates one conversation per unique linkId and assigns all orphan messages to it.
   * Uses localStorage flag to ensure this migration runs only once per browser.
   */
  async backfillConversations() {
    const FLAG = 'migration_chat_conversation_backfill_v1';
    if (localStorage.getItem(FLAG)) return;

    const { db } = await import('../db/smartResearchDB');

    // Fetch messages without a conversationId
    const orphanMsgs = await db.chatMessages
      .filter((m) => !m.conversationId)
      .toArray();

    if (!orphanMsgs.length) {
      localStorage.setItem(FLAG, 'done');
      return;
    }

    // Group by linkId
    const groups: Record<string, typeof orphanMsgs> = {};
    for (const msg of orphanMsgs) {
      (groups[msg.linkId] ||= []).push(msg);
    }

    await db.transaction('rw', db.conversations, db.chatMessages, async () => {
      for (const [linkId, msgs] of Object.entries(groups)) {
        // Determine conversation start/end from timestamps
        const sorted = msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const startedAt = new Date(sorted[0].timestamp);
        const endedAt = new Date(sorted[sorted.length - 1].timestamp);

        const convId = crypto.randomUUID();
        await db.addConversation({
          id: convId,
          linkIds: [linkId],
          startedAt,
          endedAt, // consider ended since legacy
        } as any);

        // Update messages
        await Promise.all(msgs.map((m) => db.chatMessages.update(m.id, { conversationId: convId })));
      }
    });

    localStorage.setItem(FLAG, 'done');
  },
  async backfillSummaryEmbeddings() {
    const FLAG = 'migration_summary_embedding_backfill_v1';
    if (localStorage.getItem(FLAG)) return;

    const { db } = await import('../db/smartResearchDB');
    const { aiService } = await import('./aiService');

    const batchSize = 20; // safety
    let missing = await db.summaries.filter((s) => !s.embedding).toArray();
    if (!missing.length) {
      localStorage.setItem(FLAG, 'done');
      return;
    }

    while (missing.length) {
      const batch = missing.splice(0, batchSize);
      await Promise.all(
        batch.map(async (s) => {
          try {
            const text = s.content.slice(0, 1000);
            const emb = await aiService.embed(text, 'text-embedding-3-small');
            await db.summaries.update(s.id, { embedding: emb, updatedAt: new Date() });
          } catch (err) {
            console.debug?.('Embedding backfill failed for', s.id, err);
          }
        }),
      );
    }

    localStorage.setItem(FLAG, 'done');
  },
}; 