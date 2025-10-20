/**
 * Download Event Service
 * 
 * Manages download tracking data in the database for persistent storage.
 */

import { db } from '../db/smartResearchDB';

interface DownloadEvent {
  userId: string;
  source: string;
  timestamp: string;
  userAgent: string;
  ip: string;
  referer: string;
}

class DownloadEventService {
  /**
   * Track a download event
   */
  async trackDownload(event: DownloadEvent): Promise<void> {
    try {
      await db.downloadEvents.add(event);
      console.log('📊 Download event tracked in database:', event);
    } catch (error) {
      console.error('Failed to track download event:', error);
      throw error;
    }
  }

  /**
   * Get all download events
   */
  async getAllDownloadEvents(): Promise<DownloadEvent[]> {
    try {
      return await db.downloadEvents.toArray();
    } catch (error) {
      console.error('Failed to get download events:', error);
      return [];
    }
  }

  /**
   * Get download events by user
   */
  async getDownloadEventsByUser(userId: string): Promise<DownloadEvent[]> {
    try {
      return await db.downloadEvents.where('userId').equals(userId).toArray();
    } catch (error) {
      console.error('Failed to get download events by user:', error);
      return [];
    }
  }

  /**
   * Get download statistics
   */
  async getDownloadStats() {
    try {
      const events = await this.getAllDownloadEvents();
      
      const stats = {
        totalDownloads: events.length,
        downloadsBySource: events.reduce((acc, event) => {
          acc[event.source] = (acc[event.source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        downloadsByUser: events.reduce((acc, event) => {
          acc[event.userId] = (acc[event.userId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recentDownloads: events
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10)
          .map(event => ({
            userId: event.userId,
            source: event.source,
            timestamp: event.timestamp,
            userAgent: event.userAgent.substring(0, 50) + '...',
            ip: event.ip
          })),
        downloadsByDay: events.reduce((acc, event) => {
          try {
            const date = new Date(event.timestamp).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
          } catch (error) {
            console.error('Error parsing date:', event.timestamp, error);
          }
          return acc;
        }, {} as Record<string, number>)
      };

      return stats;
    } catch (error) {
      console.error('Failed to get download stats:', error);
      return {
        totalDownloads: 0,
        downloadsBySource: {},
        downloadsByUser: {},
        recentDownloads: [],
        downloadsByDay: {}
      };
    }
  }
}

export const downloadEventService = new DownloadEventService();
