import type { Link } from '../types/Link';

const STOP_WORDS = new Set([
  'the','and','for','with','that','this','from','you','your','are','was','were','has','have','had','but','not','can','will','its','into','about','over','under','after','before','what','when','where','why','how','who','whose','which','also','more','most','some','such','only','other','than','then','too','very','via','on','in','of','to','a','an','is','it','as','by','be','or','we','our','us','at','out','up','down','off','if','so','no','yes','do','does','did','done','use','used','using','new'
]);

function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/https?:\/\/[^\s]+/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
}

function buildFrequency(tokens: string[]): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
  return freq;
}

function cosineSimilarity(a: Record<string, number>, b: Record<string, number>): number {
  let dot = 0;
  let aMag = 0;
  let bMag = 0;
  for (const k in a) {
    aMag += a[k] * a[k];
    if (b[k]) dot += a[k] * b[k];
  }
  for (const k in b) bMag += b[k] * b[k];
  if (aMag === 0 || bMag === 0) return 0;
  return dot / (Math.sqrt(aMag) * Math.sqrt(bMag));
}

export interface DraftLinkInfo {
  url: string;
  title?: string;
  description?: string;
}

/**
 * Suggest labels for a draft link based on similarity to existing saved links.
 * Pure function: caller supplies existing links.
 */
export function suggestLabelsForDraft(
  draft: DraftLinkInfo,
  existingLinks: Link[],
  opts?: { maxSuggestions?: number; topK?: number }
): string[] {
  const { maxSuggestions = 6, topK = 10 } = opts || {};

  const urlObj = (() => { try { return new URL(/^https?:\/\//i.test(draft.url) ? draft.url : `https://${draft.url}`); } catch { return null; }})()
  const hostWords = urlObj?.hostname.replace(/^www\./, '').split(/[.-]/g).filter(Boolean).join(' ') || '';

  const draftTokens = tokenize([draft.title || '', draft.description || '', hostWords].join(' '));
  const draftFreq = buildFrequency(draftTokens);

  const scored: { link: Link; score: number }[] = [];
  for (const l of existingLinks) {
    const text = [l.metadata?.title || '', l.metadata?.description || '', l.summary || '', (l.url || '').replace(/^https?:\/\//, '')].join(' ');
    const tokens = tokenize(text);
    if (!tokens.length) continue;
    const freq = buildFrequency(tokens);
    const score = cosineSimilarity(draftFreq, freq);
    if (score > 0) scored.push({ link: l, score });
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK);

  // Aggregate label counts weighted by similarity
  const labelScore: Record<string, number> = {};
  for (const { link, score } of top) {
    for (const label of link.labels || []) {
      const key = label.trim().toLowerCase();
      if (!key) continue;
      labelScore[key] = (labelScore[key] || 0) + score;
    }
  }

  const ranked = Object.entries(labelScore)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .slice(0, maxSuggestions);

  return ranked;
}

/**
 * Suggest priority based on majority among top similar links.
 */
export function suggestPriorityForDraft(
  draft: DraftLinkInfo,
  existingLinks: Link[],
  opts?: { topK?: number }
): Link['priority'] | null {
  const { topK = 10 } = opts || {};
  const draftTokens = tokenize([draft.title || '', draft.description || '', draft.url].join(' '));
  const draftFreq = buildFrequency(draftTokens);
  const scored: { link: Link; score: number }[] = [];
  for (const l of existingLinks) {
    const text = [l.metadata?.title || '', l.metadata?.description || '', l.summary || '', l.url || ''].join(' ');
    const freq = buildFrequency(tokenize(text));
    const score = cosineSimilarity(draftFreq, freq);
    if (score > 0) scored.push({ link: l, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK);
  if (!top.length) return null;
  const counts: Record<Link['priority'], number> = { low: 0, medium: 0, high: 0 };
  for (const { link } of top) counts[link.priority] += 1;
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return (best?.[0] as Link['priority']) || null;
}

/**
 * Suggest a boardId for a draft link based on label overlap and text similarity
 */
export function suggestBoardForDraft(
  draft: DraftLinkInfo,
  existingLinks: Link[],
  opts?: { topK?: number }
): string | null {
  const { topK = 12 } = opts || {};
  const draftTokens = tokenize([draft.title || '', draft.description || '', draft.url].join(' '));
  const draftFreq = buildFrequency(draftTokens);

  const scored: { link: Link; score: number }[] = [];
  for (const l of existingLinks) {
    if (!l.boardId) continue;
    const text = [l.metadata?.title || '', l.metadata?.description || '', l.summary || '', l.url || '', (l.labels || []).join(' ')].join(' ');
    const freq = buildFrequency(tokenize(text));
    const score = cosineSimilarity(draftFreq, freq);
    if (score > 0) scored.push({ link: l, score });
  }

  if (!scored.length) return null;
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK);

  const boardScore: Record<string, number> = {};
  for (const { link, score } of top) {
    if (!link.boardId) continue;
    boardScore[link.boardId] = (boardScore[link.boardId] || 0) + score;
  }

  const best = Object.entries(boardScore).sort((a, b) => b[1] - a[1])[0];
  return best?.[0] || null;
}



