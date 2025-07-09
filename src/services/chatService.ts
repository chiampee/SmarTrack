import { db } from '../db/smartResearchDB';
import { ChatMessage, ChatRole } from '../types/ChatMessage';
import { aiService, ChatMessage as AIChatMessage } from './aiService';
import { Link } from '../types/Link';

export const chatService = {
  async getByLink(linkId: string): Promise<ChatMessage[]> {
    return db.getChatMessagesByLink(linkId);
  },
  async addMessage(msg: ChatMessage) {
    return db.addChatMessage(msg);
  },
  async sendUserMessage(link: Link, content: string): Promise<ChatMessage[]> {
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

    const assistantContent = await aiService.chat([
      { role: 'system', content: 'You are a helpful research assistant.' },
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