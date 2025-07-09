import { db } from '../db/smartResearchDB';
import { ChatMessage, ChatRole } from '../types/ChatMessage';
import { aiService, ChatMessage as AIChatMessage } from './aiService';
import { Link } from '../types/Link';
import { aiSummaryService } from './aiSummaryService';

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
  async getByLink(linkId: string): Promise<ChatMessage[]> {
    return db.getChatMessagesByLink(linkId);
  },
  async addMessage(msg: ChatMessage) {
    return db.addChatMessage(msg);
  },
  async sendUserMessage(link: Link, content: string): Promise<ChatMessage[]> {
    // ---------------------------------------------------------------------------------
    // 1. Persist the user message first so history stays in order
    // ---------------------------------------------------------------------------------
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      linkId: link.id,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    await this.addMessage(userMsg);

    // Build history
    const history = await this.getByLink(link.id);
    const aiMessages: AIChatMessage[] = history.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    // ---------------------------------------------------------------------------------
    // 2. Build a rich system prompt with page context so GPT has the necessary info
    // ---------------------------------------------------------------------------------
    let pageContext = `You are a helpful research assistant. The conversation is about the following web page.\n`;
    pageContext += `URL: ${link.url}\n`;
    if (link.metadata?.title) {
      pageContext += `Title: ${link.metadata.title}\n`;
    }
    if (link.metadata?.description) {
      pageContext += `Description: ${link.metadata.description}\n`;
    }

    if (link.labels?.length) {
      pageContext += `Labels: ${link.labels.join(', ')}\n`;
    }

    // @ts-ignore optional notes property
    if (link.notes) {
      pageContext += `User notes: ${link.notes}\n`;
    }

    // If we already have an AI-generated summary, include the first one (TL;DR, etc.)
    try {
      const summaries = await aiSummaryService.getByLink(link.id);
      if (summaries.length) {
        // prefer tldr, otherwise first
        const preferred =
          summaries.find((s) => s.kind === 'tldr') ?? summaries[0];
        pageContext += `Summary: ${preferred.content}\n`;
      }
    } catch {
      /* non-fatal */
    }

    pageContext +=
      'Use this information to answer the user\'s questions as accurately as possible.\n';

    // ---------------------------------------------------------------------------------
    // 3. Fetch readable summary/content (up to ~3000 chars) and append
    // ---------------------------------------------------------------------------------
    const summaryText = await fetchPageSummary(link.url);
    if (summaryText) {
      const maxChars = 3000;
      const trimmed = summaryText.slice(0, maxChars);
      pageContext += `\nPage content summary (truncated):\n${trimmed}`;
    }

    const assistantContent = await aiService.chat([
      { role: 'system', content: pageContext },
      ...aiMessages,
    ]);

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      linkId: link.id,
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date(),
    };
    await this.addMessage(assistantMsg);

    return [userMsg, assistantMsg];
  },
}; 