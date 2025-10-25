export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  userId: string; // Auth0 user ID
  linkId: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  // Conversation this message belongs to (null for legacy data)
  conversationId?: string;
}
