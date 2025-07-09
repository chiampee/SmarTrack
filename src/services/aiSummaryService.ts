import { db } from '../db/smartResearchDB';
import { AISummary, SummaryKind } from '../types/AISummary';
import { aiService, ChatMessage } from './aiService';
import { Link } from '../types/Link';

export const aiSummaryService = {
  async getByLink(linkId: string) {
    return db.summaries.where('linkId').equals(linkId).toArray() as Promise<AISummary[]>;
  },
  async create(summary: AISummary) {
    summary.createdAt = new Date();
    summary.updatedAt = new Date();
    await db.addSummary(summary);
  },
  async generate(link: Link, kind: SummaryKind, customPrompt?: string): Promise<AISummary> {
    const url = link.url;
    const templates: Record<SummaryKind, string> = {
      tldr: `Provide a concise TL;DR (max 3 sentences) of the content at ${url}.`,
      bullets: `Summarize the content at ${url} into bullet points.`,
      quotes: `Provide 3 notable direct quotes from the content at ${url}.`,
      insights: `As a product manager, highlight key insights from ${url}.`,
      custom: customPrompt || `Summarize the content at ${url}.`,
    };
    const prompt = kind === 'custom' ? customPrompt || '' : templates[kind];

    const messages: ChatMessage[] = [
      { role: 'system', content: 'You are a helpful research assistant.' },
      { role: 'user', content: prompt },
    ];

    const content = await aiService.chat(messages, { maxTokens: 400 });

    const summary: AISummary = {
      id: crypto.randomUUID(),
      linkId: link.id,
      kind,
      prompt: kind === 'custom' ? customPrompt : undefined,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.create(summary);
    return summary;
  },
}; 