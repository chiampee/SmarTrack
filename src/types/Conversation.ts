export interface Conversation {
  id: string;
  linkIds: string[]; // links included in this conversation
  startedAt: Date;
  endedAt: Date | null;
} 