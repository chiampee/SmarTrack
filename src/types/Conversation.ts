export interface Conversation {
  id: string;
  userId: string; // Auth0 user ID
  linkIds: string[]; // links included in this conversation
  /** Canonical sorted key for indexing; derived from linkIds */
  linkIdsKey?: string;
  startedAt: Date;
  endedAt: Date | null;
}
