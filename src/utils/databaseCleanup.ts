/**
 * Database Cleanup Utilities
 * Functions to clean up database issues like duplicates and orphaned data
 */

import { db } from '../db/smartResearchDB';
import { linkService } from '../services/linkService';

export interface CleanupResult {
  duplicatesRemoved: number;
  orphanedSummariesRemoved: number;
  orphanedChatMessagesRemoved: number;
  errors: string[];
}

export const databaseCleanup = {
  /**
   * Clean up duplicate URLs (keep the most recent one)
   */
  async cleanupDuplicates(): Promise<{ removed: number; errors: string[] }> {
    const errors: string[] = [];
    let removed = 0;

    try {
      console.log('[Cleanup] Starting duplicate URL cleanup...');
      
      const allLinks = await db.links.toArray();
      const urlMap = new Map<string, any[]>();
      
      // Group links by normalized URL
      allLinks.forEach(link => {
        const normalizedUrl = link.url.toLowerCase().replace(/\/+$/, '');
        if (!urlMap.has(normalizedUrl)) {
          urlMap.set(normalizedUrl, []);
        }
        urlMap.get(normalizedUrl)!.push(link);
      });

      // Remove duplicates, keeping the most recent one
      for (const [url, links] of urlMap) {
        if (links.length > 1) {
          // Sort by updatedAt, keep the most recent
          links.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          const toDelete = links.slice(1); // Keep first (most recent), delete the rest
          
          console.log(`[Cleanup] Found ${links.length} duplicates for URL: ${url}`);
          console.log(`[Cleanup] Keeping most recent (${links[0].id}), removing ${toDelete.length} duplicates`);
          
          for (const link of toDelete) {
            try {
              await linkService.remove(link.id);
              removed++;
            } catch (error) {
              errors.push(`Failed to remove duplicate link ${link.id}: ${(error instanceof Error ? error.message : String(error))}`);
            }
          }
        }
      }

      console.log(`[Cleanup] Removed ${removed} duplicate links`);
    } catch (error) {
      errors.push(`Duplicate cleanup failed: ${(error instanceof Error ? error.message : String(error))}`);
    }

    return { removed, errors };
  },

  /**
   * Clean up orphaned summaries
   */
  async cleanupOrphanedSummaries(): Promise<{ removed: number; errors: string[] }> {
    const errors: string[] = [];
    let removed = 0;

    try {
      console.log('[Cleanup] Starting orphaned summaries cleanup...');
      
      const summaries = await db.summaries.toArray();
      const links = await db.links.toArray();
      const linkIds = new Set(links.map(l => l.id));
      
      for (const summary of summaries) {
        if (!linkIds.has(summary.linkId)) {
          try {
            await db.summaries.delete(summary.id);
            removed++;
            console.log(`[Cleanup] Removed orphaned summary: ${summary.id} for link: ${summary.linkId}`);
          } catch (error) {
            errors.push(`Failed to remove orphaned summary ${summary.id}: ${(error instanceof Error ? error.message : String(error))}`);
          }
        }
      }

      console.log(`[Cleanup] Removed ${removed} orphaned summaries`);
    } catch (error) {
      errors.push(`Orphaned summaries cleanup failed: ${(error instanceof Error ? error.message : String(error))}`);
    }

    return { removed, errors };
  },

  /**
   * Clean up orphaned chat messages
   */
  async cleanupOrphanedChatMessages(): Promise<{ removed: number; errors: string[] }> {
    const errors: string[] = [];
    let removed = 0;

    try {
      console.log('[Cleanup] Starting orphaned chat messages cleanup...');
      
      const chatMessages = await db.chatMessages.toArray();
      const links = await db.links.toArray();
      const linkIds = new Set(links.map(l => l.id));
      
      for (const message of chatMessages) {
        if (message.linkId && !linkIds.has(message.linkId)) {
          try {
            await db.chatMessages.delete(message.id);
            removed++;
            console.log(`[Cleanup] Removed orphaned chat message: ${message.id} for link: ${message.linkId}`);
          } catch (error) {
            errors.push(`Failed to remove orphaned chat message ${message.id}: ${(error instanceof Error ? error.message : String(error))}`);
          }
        }
      }

      console.log(`[Cleanup] Removed ${removed} orphaned chat messages`);
    } catch (error) {
      errors.push(`Orphaned chat messages cleanup failed: ${(error instanceof Error ? error.message : String(error))}`);
    }

    return { removed, errors };
  },

  /**
   * Run complete database cleanup
   */
  async runCompleteCleanup(): Promise<CleanupResult> {
    console.log('[Cleanup] Starting complete database cleanup...');
    
    const result: CleanupResult = {
      duplicatesRemoved: 0,
      orphanedSummariesRemoved: 0,
      orphanedChatMessagesRemoved: 0,
      errors: []
    };

    try {
      // Clean up duplicates
      const duplicateResult = await this.cleanupDuplicates();
      result.duplicatesRemoved = duplicateResult.removed;
      result.errors.push(...duplicateResult.errors);

      // Clean up orphaned summaries
      const summaryResult = await this.cleanupOrphanedSummaries();
      result.orphanedSummariesRemoved = summaryResult.removed;
      result.errors.push(...summaryResult.errors);

      // Clean up orphaned chat messages
      const messageResult = await this.cleanupOrphanedChatMessages();
      result.orphanedChatMessagesRemoved = messageResult.removed;
      result.errors.push(...messageResult.errors);

      console.log('[Cleanup] Complete cleanup finished:', result);
    } catch (error) {
      result.errors.push(`Complete cleanup failed: ${(error instanceof Error ? error.message : String(error))}`);
    }

    return result;
  },

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    totalLinks: number;
    duplicateUrls: number;
    orphanedSummaries: number;
    orphanedChatMessages: number;
  }> {
    try {
      const links = await db.links.toArray();
      const summaries = await db.summaries.toArray();
      const chatMessages = await db.chatMessages.toArray();
      
      // Count duplicates
      const urlMap = new Map<string, any[]>();
      links.forEach(link => {
        const normalizedUrl = link.url.toLowerCase().replace(/\/+$/, '');
        if (!urlMap.has(normalizedUrl)) {
          urlMap.set(normalizedUrl, []);
        }
        urlMap.get(normalizedUrl)!.push(link);
      });
      
      let duplicateUrls = 0;
      urlMap.forEach(links => {
        if (links.length > 1) {
          duplicateUrls += links.length - 1;
        }
      });

      // Count orphaned summaries
      const linkIds = new Set(links.map(l => l.id));
      const orphanedSummaries = summaries.filter(s => !linkIds.has(s.linkId)).length;

      // Count orphaned chat messages
      const orphanedChatMessages = chatMessages.filter(m => m.linkId && !linkIds.has(m.linkId)).length;

      return {
        totalLinks: links.length,
        duplicateUrls,
        orphanedSummaries,
        orphanedChatMessages
      };
    } catch (error) {
      console.error('[Cleanup] Failed to get database stats:', error);
      return {
        totalLinks: 0,
        duplicateUrls: 0,
        orphanedSummaries: 0,
        orphanedChatMessages: 0
      };
    }
  }
};
