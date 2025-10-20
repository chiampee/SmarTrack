/**
 * Extension Installation Tracking Service
 * 
 * Tracks when users actually install the extension (not just download it).
 * This happens when the extension communicates with the dashboard for the first time.
 */

import { db } from '../db/smartResearchDB';

interface InstallationEvent {
  userId: string;
  extensionVersion: string;
  browserInfo: string;
  installTimestamp: string;
  firstHandshake: string;
  userAgent: string;
  ip?: string;
}

class ExtensionInstallationService {
  /**
   * Track when a user installs the extension
   * This is called when the extension first communicates with the dashboard
   */
  async trackInstallation(
    userId: string,
    extensionVersion: string = 'unknown',
    browserInfo: string = 'unknown',
    userAgent: string = 'unknown',
    ip?: string
  ) {
    try {
      const installationEvent: InstallationEvent = {
        userId,
        extensionVersion,
        browserInfo,
        installTimestamp: new Date().toISOString(),
        firstHandshake: new Date().toISOString(),
        userAgent,
        ip
      };

      // Store in IndexedDB
      await db.extensionInstallations.add(installationEvent);
      
      console.log('📱 Extension installation tracked:', installationEvent);
      return installationEvent;
    } catch (error) {
      console.error('Failed to track extension installation:', error);
      throw error;
    }
  }

  /**
   * Get all installation events
   */
  async getAllInstallations(): Promise<InstallationEvent[]> {
    try {
      return await db.extensionInstallations.toArray();
    } catch (error) {
      console.error('Failed to get installations:', error);
      return [];
    }
  }

  /**
   * Get installations by user
   */
  async getInstallationsByUser(userId: string): Promise<InstallationEvent[]> {
    try {
      return await db.extensionInstallations.where('userId').equals(userId).toArray();
    } catch (error) {
      console.error('Failed to get installations by user:', error);
      return [];
    }
  }

  /**
   * Get installation statistics
   */
  async getInstallationStats() {
    try {
      const installations = await this.getAllInstallations();
      
      const stats = {
        totalInstallations: installations.length,
        installationsByVersion: installations.reduce((acc, install) => {
          acc[install.extensionVersion] = (acc[install.extensionVersion] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        installationsByUser: installations.reduce((acc, install) => {
          acc[install.userId] = (acc[install.userId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        installationsByDay: installations.reduce((acc, install) => {
          const date = new Date(install.installTimestamp).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recentInstallations: installations
          .sort((a, b) => new Date(b.installTimestamp).getTime() - new Date(a.installTimestamp).getTime())
          .slice(0, 10)
      };

      return stats;
    } catch (error) {
      console.error('Failed to get installation stats:', error);
      return {
        totalInstallations: 0,
        installationsByVersion: {},
        installationsByUser: {},
        installationsByDay: {},
        recentInstallations: []
      };
    }
  }
}

export const extensionInstallationService = new ExtensionInstallationService();
