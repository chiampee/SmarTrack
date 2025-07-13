import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const s3Enabled = !!process.env.SUMMARY_BUCKET;
let s3: S3Client | null = null;
if (s3Enabled) {
  s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.AWS_ACCESS_KEY_ID
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
      : undefined,
  });
}

interface Chunk {
  id: number;
  text: string;
}

function chunkText(text: string, maxTokens = 800): Chunk[] {
  const approxChars = maxTokens * 4; // rough heuristic
  const parts: Chunk[] = [];
  for (let i = 0; i < text.length; i += approxChars) {
    parts.push({ id: parts.length, text: text.slice(i, i + approxChars) });
  }
  return parts;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { text = '', url = '' } = req.body as { text: string; url?: string };
  if (!text || text.length < 100) {
    res.status(400).json({ error: 'Text required' });
    return;
  }

  try {
    // 1. TLDR summary
    const summaryResp = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-16k',
      messages: [
        { role: 'system', content: 'Summarise the following web page in 3 concise sentences.' },
        { role: 'user', content: text.slice(0, 8000) },
      ],
      max_tokens: 150,
      temperature: 0.5,
    });
    const summary = summaryResp.choices[0].message?.content?.trim() || '';

    // 2. Embeddings per chunk
    const chunks = chunkText(text);
    const embeddings: number[][] = [];
    for (const chunk of chunks) {
      const emb = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunk.text,
      });
      embeddings.push(emb.data[0].embedding);
    }

    // Persist to remote storage if enabled
    if (s3Enabled && s3) {
      const Key = `${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
      const Body = JSON.stringify({ url, summary, embeddings });
      try {
        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.SUMMARY_BUCKET!,
            Key,
            Body,
            ContentType: 'application/json',
          }),
        );
      } catch (err) {
        console.error('S3 put error', err);
      }
    }

    res.status(200).json({ summary, embeddings });
  } catch (err: any) {
    console.error('Enrich error', err);
    res.status(500).json({ error: err.message });
  }
} 