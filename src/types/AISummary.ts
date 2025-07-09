export type SummaryKind = 'tldr' | 'bullets' | 'quotes' | 'insights' | 'custom';

export interface AISummary {
  id: string;
  linkId: string;
  kind: SummaryKind;
  prompt?: string; // for custom prompts
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
