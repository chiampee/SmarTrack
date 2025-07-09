import { db } from '../db/smartResearchDB';
import { ChatMessage, ChatRole } from '../types/ChatMessage';
import { aiService, ChatMessage as AIChatMessage } from './aiService';
import { Link } from '../types/Link';
import { aiSummaryService } from './aiSummaryService';

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
      'Use this information to answer the user\'s questions as accurately as possible.';

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