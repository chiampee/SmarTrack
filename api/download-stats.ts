import { VercelRequest, VercelResponse } from '@vercel/node';

// In a real application, this would be stored in a database
// For now, we'll use a simple in-memory store (resets on each deployment)
let downloadStats: Array<{
  userId: string;
  source: string;
  timestamp: string;
  userAgent: string;
  ip: string;
  referer: string;
}> = [];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      // Return download statistics
      const stats = {
        totalDownloads: downloadStats.length,
        downloadsBySource: downloadStats.reduce((acc, download) => {
          acc[download.source] = (acc[download.source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        downloadsByUser: downloadStats.reduce((acc, download) => {
          const userId = download.userId || 'anonymous';
          acc[userId] = (acc[userId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recentDownloads: downloadStats
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10)
          .map(download => ({
            userId: download.userId || 'anonymous',
            source: download.source,
            timestamp: download.timestamp,
            userAgent: download.userAgent.substring(0, 50) + '...',
            ip: download.ip
          })),
        downloadsByDay: downloadStats.reduce((acc, download) => {
          const date = new Date(download.timestamp).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return res.status(200).json(stats);
    } catch (error: any) {
      console.error('Error fetching download stats:', error);
      return res.status(500).json({ error: 'Failed to fetch download stats' });
    }
  } else if (req.method === 'POST') {
    // Store download event (called by track-download.ts)
    try {
      const downloadEvent = {
        userId: req.body.userId || 'anonymous',
        source: req.body.source || 'unknown',
        timestamp: req.body.timestamp || new Date().toISOString(),
        userAgent: req.body.userAgent || 'unknown',
        ip: req.body.ip || 'unknown',
        referer: req.body.referer || 'direct'
      };

      downloadStats.push(downloadEvent);
      
      // Keep only last 1000 downloads to prevent memory issues
      if (downloadStats.length > 1000) {
        downloadStats = downloadStats.slice(-1000);
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error storing download event:', error);
      return res.status(500).json({ error: 'Failed to store download event' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
