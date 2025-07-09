export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  linkId: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
}
