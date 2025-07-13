export interface CachedPage {
  text: string; // empty string if fetch failed
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
  const norm = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const key = norm;
  const now = Date.now();

  // In-memory inflight cache to avoid parallel requests
  type InflightMap = Record<string, Promise<string> | undefined>;
  const inflightMap: InflightMap = (window as any).__pageTextInflight || ((window as any).__pageTextInflight = {});
  if (inflightMap[key]) return inflightMap[key]!;

  const cached = cache[key];
  if (cached && now - cached.fetchedAt < TTL_MS && cached.text !== undefined) {
    return cached.text;
  }

  const clean = norm;
  const inflightPromise = (async () => {
    try {
      const res = await fetch(`https://r.jina.ai/http://${clean}`);
      if (res.ok) {
        const text = (await res.text()).slice(0, 500_000);
        cache[key] = { text, fetchedAt: now };
        saveCache(cache);
        return text;
      } else {
        // Cache failure to prevent repeated blocked requests
        cache[key] = { text: '', fetchedAt: now };
        saveCache(cache);
      }
    } catch {}
    return '';
  })();

  inflightMap[key] = inflightPromise;
  const result = await inflightPromise;
  delete inflightMap[key];
  return result;
} 