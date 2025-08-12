export interface Conversation {
  id: string;
  linkIds: string[]; // links included in this conversation
  /** Canonical sorted key for indexing; derived from linkIds */
  linkIdsKey?: string;
  startedAt: Date;
  endedAt: Date | null;
}
