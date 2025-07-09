export interface CachedPage {
  text: string;
  fetchedAt: number; // epoch ms
}

const CACHE_KEY = 'pageTextCache_v1';
const TTL_MS = 24 * 60 * 60 * 1000; // 1 day

function loadCache(): Record<string, CachedPage> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveCache(cache: Record<string, CachedPage>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

export async function getPageText(url: string): Promise<string> {
  const cache = loadCache();
  const key = url;
  const now = Date.now();
  const cached = cache[key];
  if (cached && now - cached.fetchedAt < TTL_MS && cached.text) {
    return cached.text;
  }

  try {
    const clean = url.replace(/^https?:\/\//, '');
    const res = await fetch(`https://r.jina.ai/http://${clean}`);
    if (res.ok) {
      const text = await res.text();
      cache[key] = { text, fetchedAt: now };
      saveCache(cache);
      return text;
    }
  } catch {}
  return '';
} 