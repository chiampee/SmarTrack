export type SummaryKind = 'raw' | 'tldr' | 'bullets' | 'quotes' | 'insights' | 'custom';

export interface AISummary {
  id: string;
  linkId: string;
  kind: SummaryKind;
  prompt?: string; // for custom prompts
  content: string;
  /** Optional embedding vector for semantic search */
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}
