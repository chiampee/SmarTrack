export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  linkId: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  // Conversation this message belongs to (null for legacy data)
  conversationId?: string;
}
