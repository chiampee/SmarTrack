// Fetch metadata for a URL using jina.ai readability API
// Docs: https://r.jina.ai/http://<url> returns JSON with keys: title, image, og:description etc.
export async function fetchMetadata(url: string) {
  try {
    // jina.ai returns a plain-text summary; the first line is the page title.
    const clean = url.replace(/^https?:\/\//, '');
    const res = await fetch(`https://r.jina.ai/http://${clean}`);
    if (!res.ok) throw new Error('meta fetch failed');
    const text = await res.text();
    const [firstLine, ...rest] = text.split('\n');
    // jina.ai sometimes prefixes the title with "Title: ". Remove it (case-insensitive)
    let title = firstLine.trim();
    if (/^title:\s*/i.test(title)) {
      title = title.replace(/^title:\s*/i, '').trim();
    }
    return {
      title,
      description: rest.join('\n').slice(0, 160),
      image: '',
    };
  } catch {
    // Fallback: derive title as clean domain
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      let host = u.hostname;
      if (host.startsWith('www.')) host = host.slice(4);
      return { title: host, description: '', image: '' };
    } catch {
      return { title: url, description: '', image: '' };
    }
  }
}
