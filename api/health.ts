/**
 * /api/health
 * ------------
 * Lightweight liveness probe. Used by `scripts/healthCheck.ts` and deployment
 * platforms to ensure the API routes are healthy.
 * Responds with `{ status: 'ok', timestamp }` on GET.
 */
export default async function handler(req: import('@vercel/node').VercelRequest, res: import('@vercel/node').VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  return res.status(200).json({ status: 'ok', timestamp: Date.now() });
} 