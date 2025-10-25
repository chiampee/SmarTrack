import { VercelRequest, VercelResponse } from '@vercel/node';

interface DownloadEvent {
  userId: string;
  source: string;
  timestamp: string;
  userAgent: string;
  ip: string;
  referer: string;
}

// In-memory storage for download events (resets on each deployment)
// TODO: Move to persistent database storage
let downloadEvents: DownloadEvent[] = [];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const downloadEvent: DownloadEvent = {
        userId: req.body.userId || 'anonymous',
        source: req.body.source || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: req.body.timestamp || new Date().toISOString(),
        ip: req.headers['x-forwarded-for'] as string || req.connection?.remoteAddress || 'unknown',
        referer: req.headers.referer || 'direct'
      };

      // Store the download event
      downloadEvents.push(downloadEvent);
      
      // Keep only last 1000 downloads to prevent memory issues
      if (downloadEvents.length > 1000) {
        downloadEvents = downloadEvents.slice(-1000);
      }

      console.log('Extension download tracked:', downloadEvent);

      return res.status(200).json({ 
        success: true, 
        message: 'Download tracked successfully',
        event: downloadEvent
      });
    } catch (error: any) {
      console.error('Error tracking download:', error);
      return res.status(500).json({ 
        error: 'Failed to track download', 
        details: error.message 
      });
    }
  } else if (req.method === 'GET') {
    // Return download statistics
    try {
      const stats = {
        totalDownloads: downloadEvents.length,
        downloadsBySource: downloadEvents.reduce((acc, download) => {
          acc[download.source] = (acc[download.source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        downloadsByUser: downloadEvents.reduce((acc, download) => {
          acc[download.userId] = (acc[download.userId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recentDownloads: downloadEvents
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10)
          .map(download => ({
            userId: download.userId,
            source: download.source,
            timestamp: download.timestamp,
            userAgent: download.userAgent.substring(0, 50) + '...',
            ip: download.ip
          })),
        downloadsByDay: downloadEvents.reduce((acc, download) => {
          try {
            const date = new Date(download.timestamp).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
          } catch (error) {
            console.error('Error parsing date:', download.timestamp, error);
          }
          return acc;
        }, {} as Record<string, number>)
      };

      return res.status(200).json(stats);
    } catch (error: any) {
      console.error('Error fetching download stats:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch download stats',
        details: error.message,
        stack: error.stack
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}