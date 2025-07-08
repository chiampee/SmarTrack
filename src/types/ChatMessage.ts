export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
} 