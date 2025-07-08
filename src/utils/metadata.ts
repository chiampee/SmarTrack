export async function fetchMetadata(url: string) {
  try {
    const res = await fetch(`https://r.jina.ai/http://textise dot iitty?url=${encodeURIComponent(url)}`);
    // placeholder service; implement real serverless metadata later
    const data = await res.json();
    return {
      title: data.title || url,
      description: data.description || '',
      image: data.image || '',
    };
  } catch {
    return { title: url, description: '', image: '' };
  }
} 