import { db } from '../db/smartResearchDB';
import { errorHandler, createDatabaseError } from '../utils/errorHandler';
import { AISummary, SummaryKind } from '../types/AISummary';
import { aiService, ChatMessage } from './aiService';
import { Link } from '../types/Link';

export const aiSummaryService = {
  async getByLink(linkId: string) {
    try {
      // Try to get summaries from extension storage first
      if (typeof window !== 'undefined' && (window as any).chrome?.storage?.local) {
        return new Promise<AISummary[]>((resolve) => {
          try {
            (window as any).chrome.storage.local.get(['summaries'], (res: any) => {
              const summaries = res?.summaries || [];
              const linkSummaries = summaries.filter((s: any) => s.linkId === linkId);
              resolve(linkSummaries as AISummary[]);
            });
          } catch {
            resolve([]);
          }
        });
      }
      
      // Fallback to IndexedDB if extension storage not available
      return (await db.summaries.where('linkId').equals(linkId).toArray()) as AISummary[];
    } catch (err) {
      try { errorHandler.handleError(createDatabaseError(err as Error, { source: 'aiSummaryService.getByLink' })); } catch {}
      return [] as AISummary[];
    }
  },
  async create(summary: AISummary) {
    summary.createdAt = new Date();
    summary.updatedAt = new Date();

    // Auto-generate embedding if missing and content is short enough
    if (!summary.embedding) {
      try {
        const textForEmb = summary.content.slice(0, 1000);
        summary.embedding = await aiService.embed(textForEmb, 'text-embedding-3-small');
      } catch (err) {
        console.debug?.('Embedding generation failed', err);
      }
    }

    try {
      // Try to store in extension storage first
      if (typeof window !== 'undefined' && (window as any).chrome?.storage?.local) {
        await new Promise<void>((resolve, reject) => {
          try {
            (window as any).chrome.storage.local.get(['summaries'], (res: any) => {
              const summaries = res?.summaries || [];
              summaries.push(summary);
              (window as any).chrome.storage.local.set({ summaries }, () => {
                if ((window as any).chrome.runtime.lastError) {
                  reject(new Error((window as any).chrome.runtime.lastError.message));
                } else {
                  resolve();
                }
              });
            });
          } catch (err) {
            reject(err);
          }
        });
        return;
      }
    } catch (err) {
      console.debug('Extension storage failed, falling back to IndexedDB:', err);
    }

    // Fallback to IndexedDB if extension storage not available
    await db.addSummary(summary);
  },
  async generate(link: Link, kind: SummaryKind, customPrompt?: string): Promise<AISummary> {
    const url = link.url;
    const templates: Record<SummaryKind, string> = {
      tldr: `Provide a concise TL;DR (max 3 sentences) of the content at ${url}. Use clear, direct language and highlight the most important points.`,
      bullets: `Summarize the content at ${url} into well-organized bullet points. Use clear headings and structure the information logically.`,
      quotes: `Provide 3 notable direct quotes from the content at ${url}. Format each quote clearly and include context where relevant.`,
      raw: `Provide the full raw text of the page at ${url}.`,
      insights: `As a product manager, highlight key insights from ${url}. Use clear headings, bullet points, and bold text to emphasize important findings.`,
      custom: customPrompt || `Summarize the content at ${url}. Use clear formatting with headings, bullet points, and proper structure for maximum readability.`,
    };
    const prompt = kind === 'custom' ? customPrompt || '' : templates[kind];

    const messages: ChatMessage[] = [
      { role: 'system', content: 'You are a helpful research assistant.' },
      { role: 'user', content: prompt },
    ];

    const content = await aiService.chat(messages, { maxTokens: 400 });

    const summary: AISummary = {
      id: crypto.randomUUID(),
      userId: link.userId, // Inherit from parent link
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