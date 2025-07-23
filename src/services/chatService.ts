/**
 * chatService.ts
 * --------------
 * Orchestrates chat conversations tied to saved research links.
 * Responsibilities:
 *   • Manage Conversation & ChatMessage records in IndexedDB (via db layer).
 *   • Build rich, context-aware prompts by harvesting TL;DRs, raw page text and
 *     similarity-matched snippets for each link.
 *   • Invoke aiService.chat/chatStream() with fallback logic and push assistant
 *     replies back into Dexie.
 *   • Provide helper utilities (`getContextSnippets`) for UI inspection.
 *
 * NOTE: This file contains many defensive fallbacks so the assistant always has
 *       some context to work with even if enrichment failed.
 */
import { db } from '../db/smartResearchDB';
import { ChatMessage, ChatRole } from '../types/ChatMessage';
import { aiService, ChatMessage as AIChatMessage } from './aiService';
import { Link } from '../types/Link';
import { aiSummaryService } from './aiSummaryService';
import { Conversation } from '../types/Conversation';
import { logError } from '../utils/logger';

// Lightweight helper to fetch readable summary via jina.ai with caching to avoid repeated 451 errors
const jinaCacheKey = 'jina_summary_cache_v1';
const jinaMemCache = new Map<string, { text: string; fetchedAt: number }>();
function loadJinaCache(): Record<string, { text: string; fetchedAt: number }> {
  try {
    const raw = localStorage.getItem(jinaCacheKey);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    logError('chatService.loadJinaCache', err);
  }
  return {};
}
function saveJinaCache(obj: Record<string, { text: string; fetchedAt: number }>) {
  try {
    localStorage.setItem(jinaCacheKey, JSON.stringify(obj));
  } catch (err) {
    logError('chatService.saveJinaCache', err);
  }
}
const jinaStore = loadJinaCache();
const JINA_TTL = 24 * 60 * 60 * 1000; // 1 day

async function fetchPageSummary(url: string): Promise<string> {
  const key = url;
  const now = Date.now();
  const fromMem = jinaMemCache.get(key) || jinaStore[key];
  if (fromMem && now - fromMem.fetchedAt < JINA_TTL) {
    return fromMem.text;
  }

  try {
    const clean = url.replace(/^https?:\/\//, '');
    const res = await fetch(`https://r.jina.ai/http://${clean}`);
    let txt = '';
    if (res.ok) {
      txt = await res.text();
      const [, ...rest] = txt.split('\n');
      txt = rest.join('\n').trim();
    }
    const entry = { text: txt, fetchedAt: now };
    jinaMemCache.set(key, entry);
    jinaStore[key] = entry;
    saveJinaCache(jinaStore);
    return txt;
  } catch (err) {
    const entry = { text: '', fetchedAt: now };
    jinaMemCache.set(key, entry);
    jinaStore[key] = entry;
    saveJinaCache(jinaStore);
    logError('chatService.fetchPageSummary', err);
    return '';
  }
}

// Utility: cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
}

export const chatService = {
  /** Conversations */
  async startConversation(linkIds: string[]): Promise<Conversation> {
    console.log('chatService.startConversation called with linkIds:', linkIds);
    
    // try reuse active conversation first
    const existing = await db.getActiveConversationByLinks(linkIds);
    if (existing) {
      console.log('Found existing conversation:', existing);
      return existing as Conversation;
    }
    
    const conv: Conversation = {
      id: crypto.randomUUID(),
      linkIds,
      startedAt: new Date(),
      endedAt: null,
    };
    
    console.log('Creating new conversation:', conv);
    await db.addConversation(conv);
    console.log('Conversation saved to database');
    
    return conv;
  },
  async endConversation(id: string) {
    const msgs = await db.getChatMessagesByConversation(id);
    if (msgs.length === 0) {
      // nothing was said – remove the conversation entirely
      return db.deleteConversation(id);
    }
    return db.endConversation(id);
  },
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    return db.getChatMessagesByConversation(conversationId);
  },
  async getAllConversations() {
    console.log('chatService.getAllConversations called');
    try {
      const conversations = await db.getAllConversations();
      console.log('Raw conversations from database:', conversations);
      return conversations;
    } catch (err) {
      console.error('Error in getAllConversations:', err);
      throw err;
    }
  },
  async deleteConversation(id: string) {
    return db.deleteConversation(id);
  },

  /** Gather context snippets for UI inspection – returns array per link */
  async getContextSnippets(linkIds: string[]): Promise<{ link: Link; summaries: { kind: string; content: string }[] }[]> {
    const result: { link: Link; summaries: { kind: string; content: string }[] }[] = [];
    for (const lid of linkIds) {
      const lnk = await db.getLink(lid);
      if (!lnk) continue;
      const list = await aiSummaryService.getByLink(lid);
      const items = list.map((s) => ({ kind: s.kind, content: s.content }));
      result.push({ link: lnk, summaries: items });
    }
    return result;
  },

  async getByLink(linkId: string): Promise<ChatMessage[]> {
    return db.getChatMessagesByLink(linkId);
  },
  async addMessage(msg: ChatMessage) {
    return db.addChatMessage(msg);
  },
  // Maintained for backward compatibility; new code should use sendMessage (below)
  async sendMessage(
    conv: Conversation,
    content: string,
    onProgress?: (partial: string) => void,
  ): Promise<ChatMessage[]> {
    // Use first link for legacy linkId storage but build context from all links
    const primaryLinkId = conv.linkIds[0];
    const primaryLink = await db.getLink(primaryLinkId);
    if (!primaryLink) throw new Error('Primary link not found');

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      linkId: primaryLinkId,
      conversationId: conv.id,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    await this.addMessage(userMsg);

    const history = await this.getMessages(conv.id);
    const aiMessages: AIChatMessage[] = history.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    // ---------- Build context ----------
    let pageContext = 'You are a helpful research assistant. Use the following information from the user\'s saved research pages to answer as accurately as possible.\n\n';

    // Gather summaries & embeddings for all links referenced in this conversation
    const allSummaries: { content: string; embedding?: number[]; link: Link }[] = [];
    for (const lid of conv.linkIds) {
      const lnk = await db.getLink(lid);
      if (!lnk) continue;
      let addedForLink = false; // NEW: track if we captured any content for this link
      try {
        const summaries = await aiSummaryService.getByLink(lid);
        for (const s of summaries) {
          allSummaries.push({ content: s.content, embedding: s.embedding, link: lnk });
          addedForLink = true;
        }

        // If no raw summary found, fetch page text (cached) as extra context
        if (!summaries.some((s) => s.kind === 'raw')) {
          const { getPageText } = await import('../utils/pageCache');
          const txt = await getPageText(lnk.url);
          if (txt) {
            const content = txt.slice(0, 500000); // limit to 500k chars
            allSummaries.push({ content, link: lnk });
            addedForLink = true;

            // Persist as raw summary so it is available next time
            try {
              const rawSumm: import('../types/AISummary').AISummary = {
                id: crypto.randomUUID(),
                linkId: lnk.id,
                kind: 'raw',
                content,
                createdAt: new Date(),
                updatedAt: new Date(),
              } as any;
              // Generate embedding asynchronously (non-blocking)
              aiService.embed(content.slice(0, 2000)).then((emb) => {
                rawSumm.embedding = emb;
                void db.addSummary(rawSumm); // store with embedding
              }).catch(() => {
                void db.addSummary(rawSumm); // store without embedding
              });
            } catch {}
          }
        }
      } catch {}

      // NEW FALLBACK: if nothing was gathered so far, grab a quick summary via jina.ai
      if (!addedForLink) {
        try {
          const quick = await fetchPageSummary(lnk.url);
          if (quick) {
            allSummaries.push({ content: quick, link: lnk });
            addedForLink = true;
          }
        } catch {}
      }
      // If no summaries exist at all for this link, generate a quick TL;DR on the fly so we always have *some* context
      if (!addedForLink) {
        try {
          const quickSum = await aiSummaryService.generate(lnk, 'tldr');
          allSummaries.push({ content: quickSum.content, embedding: quickSum.embedding, link: lnk });
          addedForLink = true;
        } catch (err) {
          console.debug?.('Failed to auto-generate TLDR for', lnk.url, err);
        }
      }
      // If still nothing was added for this link, include at least URL and metadata so the assistant knows something about it
      if (!addedForLink) {
        const metaSnippet = `URL: ${lnk.url}\n` +
          (lnk.metadata?.title ? `Title: ${lnk.metadata.title}\n` : '') +
          (lnk.metadata?.description ? `Description: ${lnk.metadata.description}\n` : '') +
          (lnk.labels.length ? `Labels: ${lnk.labels.join(', ')}\n` : '');
        allSummaries.push({ content: metaSnippet.trim(), link: lnk });
        addedForLink = true;
      }
    }

    // Ensure every summary has an embedding so vector search works
    for (const doc of allSummaries) {
      if (!doc.embedding) {
        try {
          doc.embedding = await aiService.embed(doc.content.slice(0, 2000));
        } catch {}
      }
    }

    let topSnippets: { content: string; link: Link }[] = [];
    try {
      const docsWithEmb = allSummaries.filter((d) => d.embedding && d.embedding.length);
      if (docsWithEmb.length) {
        // Compute embedding for user query
        const queryEmb = await aiService.embed(content);
        topSnippets = docsWithEmb
          .map((d) => ({ ...d, score: cosineSimilarity(queryEmb, d.embedding as number[]) }))
          .filter((d) => d.score >= 0.25)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map((d) => ({ content: d.content, link: d.link }));
      }
    } catch (err) {
      console.debug?.('Vector search failed, falling back to default summaries', err);
    }

    // Fallback: if no top snippets determined, include TLDR or raw from primary link
    if (!topSnippets.length) {
      const fallbackSumms = await aiSummaryService.getByLink(primaryLinkId);
      const tldr = fallbackSumms.find((s) => s.kind === 'tldr');
      const raw = fallbackSumms.find((s) => s.kind === 'raw');
      if (tldr) topSnippets.push({ content: tldr.content, link: primaryLink });
      else if (raw) topSnippets.push({ content: raw.content.slice(0, 800) + '...', link: primaryLink });
    }

    // FINAL GUARANTEE: if still no snippets, add up to first 3 gathered summaries
    if (!topSnippets.length && allSummaries.length) {
      topSnippets = allSummaries.slice(0, 3).map((d) => ({ content: d.content, link: d.link }));
    }

    // Always include metadata snippet per link first
    let metaIdx = 0;
    for (const lid of conv.linkIds) {
      const lnk = lid === primaryLinkId ? primaryLink : await db.getLink(lid);
      if (!lnk) continue;
      metaIdx += 1;
      const metaParts = [
        `URL: ${lnk.url}`,
        lnk.metadata?.title ? `Title: ${lnk.metadata.title}` : '',
        lnk.metadata?.description ? `Description: ${lnk.metadata.description}` : '',
        lnk.labels.length ? `Labels: ${lnk.labels.join(', ')}` : '',
      ].filter(Boolean);
      pageContext += `Metadata ${metaIdx}:\n${metaParts.join('\n')}\n\n`;
    }

    // Append similarity / summary snippets
    topSnippets.forEach((snip, idx) => {
      const title = snip.link.metadata?.title || snip.link.url;
      pageContext += `Snippet ${idx + 1} (from ${title}):\n${snip.content}\n\n`;
    });

    // Ensure each link contributes at least one content snippet
    for (const lid of conv.linkIds) {
      const lnk = lid === primaryLinkId ? primaryLink : await db.getLink(lid);
      if (!lnk) continue;
      const summs = await aiSummaryService.getByLink(lid);
      const tldr = summs.find((s) => s.kind === 'tldr');
      const raw = summs.find((s) => s.kind === 'raw');
      if (tldr) {
        pageContext += `TL;DR for ${lnk.metadata?.title || lnk.url}:\n${tldr.content}\n\n`;
      } else if (raw) {
        pageContext += `Excerpt from ${lnk.metadata?.title || lnk.url}:\n${raw.content.slice(0, 800)}...\n\n`;
      }
    }

    pageContext +=
      "Use these snippets to answer the user's question. When quoting, cite as (Snippet N). Respond in the same language as the user's query unless they ask for a different language.";

    // Token/char budget guard (~4 chars per token)
    const MAX_CHARS = 32000; // ≈ 8k tokens
    if (pageContext.length > MAX_CHARS) {
      pageContext = pageContext.slice(0, MAX_CHARS);
    }

    // ---------- Call AI (stream if onProgress supplied) ----------
    const assistantContent = onProgress
      ? await aiService.chatStream(
          [
            { role: 'system', content: pageContext },
            ...aiMessages,
          ],
          (partial) => {
            try {
              onProgress?.(partial);
            } catch (_) {}
          },
        )
      : await aiService.chat([
          { role: 'system', content: pageContext },
          ...aiMessages,
        ]);

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      linkId: primaryLinkId,
      conversationId: conv.id,
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date(),
    };
    await this.addMessage(assistantMsg);

    return [userMsg, assistantMsg];
  },
}; 