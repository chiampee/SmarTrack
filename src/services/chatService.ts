import { db } from '../db/smartResearchDB';
import { ChatMessage, ChatRole } from '../types/ChatMessage';
import { aiService, ChatMessage as AIChatMessage } from './aiService';
import { Link } from '../types/Link';
import { aiSummaryService } from './aiSummaryService';
import { getPageText } from '../utils/pageCache';
import { Conversation } from '../types/Conversation';

// Lightweight helper to fetch readable summary via jina.ai
async function fetchPageSummary(url: string): Promise<string> {
  try {
    const clean = url.replace(/^https?:\/\//, '');
    const res = await fetch(`https://r.jina.ai/http://${clean}`);
    if (!res.ok) return '';
    const text = await res.text();
    // Remove first line (title) because we already include title separately
    const [, ...rest] = text.split('\n');
    return rest.join('\n').trim();
  } catch {
    return '';
  }
}

export const chatService = {
  /** Conversations */
  async startConversation(linkIds: string[]): Promise<Conversation> {
    // try reuse active conversation first
    const existing = await db.getActiveConversationByLinks(linkIds);
    if (existing) return existing as Conversation;
    const conv: Conversation = {
      id: crypto.randomUUID(),
      linkIds,
      startedAt: new Date(),
      endedAt: null,
    };
    await db.addConversation(conv);
    return conv;
  },
  async endConversation(id: string) {
    return db.endConversation(id);
  },
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    return db.getChatMessagesByConversation(conversationId);
  },

  async getByLink(linkId: string): Promise<ChatMessage[]> {
    return db.getChatMessagesByLink(linkId);
  },
  async addMessage(msg: ChatMessage) {
    return db.addChatMessage(msg);
  },
  // Maintained for backward compatibility; new code should use sendMessage (below)
  async sendMessage(conv: Conversation, content: string): Promise<ChatMessage[]> {
    // For now assume single-link conversation for prompt building
    const primaryLinkId = conv.linkIds[0];
    const link = await db.getLink(primaryLinkId);
    if (!link) throw new Error('Primary link not found');

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

    // Build system prompt similar to existing logic
    let pageContext = `You are a helpful research assistant. The conversation is about the following web page.\n`;
    pageContext += `URL: ${link.url}\n`;
    if (link.metadata?.title) pageContext += `Title: ${link.metadata.title}\n`;
    if (link.metadata?.description) pageContext += `Description: ${link.metadata.description}\n`;
    if (link.labels?.length) pageContext += `Labels: ${link.labels.join(', ')}\n`;
    // @ts-ignore optional notes
    if (link.notes) pageContext += `User notes: ${link.notes}\n`;

    try {
      const summaries = await aiSummaryService.getByLink(link.id);
      if (summaries.length) {
        const preferred = summaries.find((s) => s.kind === 'tldr') ?? summaries[0];
        pageContext += `Summary: ${preferred.content}\n`;
      }
    } catch {}

    pageContext +=
      "Use this information to answer the user's questions as accurately as possible. Unless the user explicitly requests otherwise (e.g. asks for a translation), respond in English.\n";

    const summaryText = await getPageText(link.url).then((t) => {
      const [, ...rest] = t.split('\n');
      return rest.join('\n').trim();
    });
    if (summaryText) {
      const trimmed = summaryText.slice(0, 3000);
      pageContext += `\nPage content summary (truncated):\n${trimmed}`;
    }

    const assistantContent = await aiService.chat([
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