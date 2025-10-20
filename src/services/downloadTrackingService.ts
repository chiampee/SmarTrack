/**
 * Download Tracking Service
 * 
 * Tracks when users download the extension for analytics purposes.
 */

import { downloadEventService } from './downloadEventService';

interface DownloadEvent {
  userId?: string;
  userAgent: string;
  timestamp: string;
  source: 'onboarding' | 'sidebar' | 'quickstart' | 'direct';
}

class DownloadTrackingService {
  private async trackDownload(source: DownloadEvent['source'], userId?: string) {
    try {
      const event: DownloadEvent = {
        userId: userId || 'anonymous',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        source
      };

      // Store in local database for persistence
      await downloadEventService.trackDownload({
        userId: event.userId || 'anonymous',
        source: event.source,
        timestamp: event.timestamp,
        userAgent: event.userAgent,
        ip: 'unknown', // Can't get IP from client-side
        referer: document.referrer || 'direct'
      });

      // Also send to API for server-side logging
      try {
        await fetch('/api/track-download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        });
      } catch (apiError) {
        console.warn('Failed to send download event to API:', apiError);
        // Don't fail the whole operation if API call fails
      }

      console.log('📊 Extension download tracked:', event);
    } catch (error) {
      console.error('Failed to track download:', error);
      // Don't throw - tracking failures shouldn't break the download
    }
  }

  /**
   * Track extension download from onboarding modal
   */
  async trackOnboardingDownload(userId?: string) {
    await this.trackDownload('onboarding', userId);
  }

  /**
   * Track extension download from sidebar
   */
  async trackSidebarDownload(userId?: string) {
    await this.trackDownload('sidebar', userId);
  }

  /**
   * Track extension download from quickstart guide
   */
  async trackQuickstartDownload(userId?: string) {
    await this.trackDownload('quickstart', userId);
  }

  /**
   * Track direct extension download
   */
  async trackDirectDownload(userId?: string) {
    await this.trackDownload('direct', userId);
  }
}

export const downloadTrackingService = new DownloadTrackingService();
