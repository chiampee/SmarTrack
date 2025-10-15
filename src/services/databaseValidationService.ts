import { db } from '../db/smartResearchDB';
import { Link } from '../types/Link';
import { linkService } from './linkService';
import { databaseCleanup } from '../utils/databaseCleanup';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalLinks: number;
    duplicateUrls: number;
    invalidLinks: number;
    orphanedSummaries: number;
    orphanedChatMessages: number;
  };
}

export interface DatabaseHealth {
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details: ValidationResult;
  timestamp: string;
}

export const databaseValidationService = {
  /**
   * Comprehensive database validation
   */
  async validateDatabase(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let totalLinks = 0;
    let duplicateUrls = 0;
    let invalidLinks = 0;
    let orphanedSummaries = 0;
    let orphanedChatMessages = 0;

    try {
      // Test 1: Basic database connectivity
      console.log('[Validation] Testing database connectivity...');
      const allLinks = await db.links.toArray();
      totalLinks = allLinks.length;
      console.log(`[Validation] Found ${totalLinks} links in database`);

      // Test 2: Check for duplicate URLs
      console.log('[Validation] Checking for duplicate URLs...');
      const urlMap = new Map<string, Link[]>();
      allLinks.forEach(link => {
        const normalizedUrl = link.url.toLowerCase().replace(/\/+$/, '');
        if (!urlMap.has(normalizedUrl)) {
          urlMap.set(normalizedUrl, []);
        }
        urlMap.get(normalizedUrl)!.push(link);
      });

      urlMap.forEach((links, url) => {
        if (links.length > 1) {
          duplicateUrls += links.length - 1;
          errors.push(`Duplicate URL found: ${url} (${links.length} instances)`);
        }
      });

      // Test 3: Validate link structure
      console.log('[Validation] Validating link structure...');
      allLinks.forEach((link, index) => {
        if (!link.id) {
          invalidLinks++;
          errors.push(`Link at index ${index} missing ID`);
        }
        if (!link.url) {
          invalidLinks++;
          errors.push(`Link at index ${index} missing URL`);
        }
        if (!link.metadata?.title) {
          warnings.push(`Link at index ${index} missing title`);
        }
        if (!link.createdAt) {
          invalidLinks++;
          errors.push(`Link at index ${index} missing createdAt`);
        }
        if (!link.updatedAt) {
          invalidLinks++;
          errors.push(`Link at index ${index} missing updatedAt`);
        }
      });

      // Test 4: Check for orphaned summaries
      console.log('[Validation] Checking for orphaned summaries...');
      const summaries = await db.summaries.toArray();
      const linkIds = new Set(allLinks.map(l => l.id));
      summaries.forEach(summary => {
        if (!linkIds.has(summary.linkId)) {
          orphanedSummaries++;
          warnings.push(`Orphaned summary found for non-existent link: ${summary.linkId}`);
        }
      });

      // Test 5: Check for orphaned chat messages
      console.log('[Validation] Checking for orphaned chat messages...');
      const chatMessages = await db.chatMessages.toArray();
      chatMessages.forEach(message => {
        if (message.linkId && !linkIds.has(message.linkId)) {
          orphanedChatMessages++;
          warnings.push(`Orphaned chat message found for non-existent link: ${message.linkId}`);
        }
      });

      // Test 6: Test link service consistency
      console.log('[Validation] Testing link service consistency...');
      const serviceLinks = await linkService.getAll();
      if (serviceLinks.length !== allLinks.length) {
        errors.push(`Link service returned ${serviceLinks.length} links, but database has ${allLinks.length}`);
      }

      // Test 7: Test database operations
      console.log('[Validation] Testing database operations...');
      try {
        const testLink: Link = {
          id: 'validation-test-' + Date.now(),
          url: 'https://validation-test.example.com',
          metadata: {
            title: 'Validation Test',
            description: 'Test link for validation',
            image: ''
          },
          labels: ['validation'],
          priority: 'low',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          boardId: null
        };

        // Test insert
        await db.links.add(testLink);
        
        // Test read
        const retrieved = await db.links.get(testLink.id);
        if (!retrieved) {
          errors.push('Failed to retrieve test link after insert');
        }

        // Test update
        await db.links.update(testLink.id, { status: 'archived' });
        const updated = await db.links.get(testLink.id);
        if (updated?.status !== 'archived') {
          errors.push('Failed to update test link');
        }

        // Test delete
        await db.links.delete(testLink.id);
        const deleted = await db.links.get(testLink.id);
        if (deleted) {
          errors.push('Failed to delete test link');
        }

        console.log('[Validation] Database operations test passed');
      } catch (opError) {
        errors.push(`Database operations test failed: ${opError.message}`);
      }

    } catch (error) {
      errors.push(`Database validation failed: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalLinks,
        duplicateUrls,
        invalidLinks,
        orphanedSummaries,
        orphanedChatMessages
      }
    };
  },

  /**
   * Get database health status
   */
  async getDatabaseHealth(): Promise<DatabaseHealth> {
    const result = await this.validateDatabase();
    const timestamp = new Date().toISOString();

    if (result.errors.length > 0) {
      return {
        status: 'error',
        message: `Database has ${result.errors.length} errors`,
        details: result,
        timestamp
      };
    } else if (result.warnings.length > 0) {
      return {
        status: 'warning',
        message: `Database has ${result.warnings.length} warnings`,
        details: result,
        timestamp
      };
    } else {
      return {
        status: 'healthy',
        message: 'Database is healthy',
        details: result,
        timestamp
      };
    }
  },

  /**
   * Clean up database issues
   */
  async cleanupDatabase(): Promise<{ cleaned: number; errors: string[] }> {
    try {
      console.log('[Cleanup] Starting database cleanup...');
      
      const result = await databaseCleanup.runCompleteCleanup();
      const totalCleaned = result.duplicatesRemoved + result.orphanedSummariesRemoved + result.orphanedChatMessagesRemoved;
      
      console.log(`[Cleanup] Cleaned up ${totalCleaned} items`);
      
      return { 
        cleaned: totalCleaned, 
        errors: result.errors 
      };
    } catch (error) {
      return { 
        cleaned: 0, 
        errors: [`Cleanup failed: ${error.message}`] 
      };
    }
  },

  /**
   * Test data consistency across operations
   */
  async testDataConsistency(): Promise<{ consistent: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      console.log('[Consistency] Testing data consistency...');

      // Test 1: Add a link and verify it appears in all queries
      const testLink: Link = {
        id: 'consistency-test-' + Date.now(),
        url: 'https://consistency-test.example.com',
        metadata: {
          title: 'Consistency Test',
          description: 'Test link for consistency',
          image: ''
        },
        labels: ['consistency'],
        priority: 'medium',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        boardId: null
      };

      // Add via service
      await linkService.create(testLink);

      // Verify it appears in direct DB query
      const dbLink = await db.links.get(testLink.id);
      if (!dbLink) {
        issues.push('Link not found in database after service create');
      }

      // Verify it appears in service getAll
      const serviceLinks = await linkService.getAll();
      const serviceLink = serviceLinks.find(l => l.id === testLink.id);
      if (!serviceLink) {
        issues.push('Link not found in service getAll after create');
      }

      // Test update consistency
      await linkService.update(testLink.id, { status: 'archived' });
      
      const updatedDbLink = await db.links.get(testLink.id);
      if (updatedDbLink?.status !== 'archived') {
        issues.push('Database not updated after service update');
      }

      const updatedServiceLinks = await linkService.getAll();
      const updatedServiceLink = updatedServiceLinks.find(l => l.id === testLink.id);
      if (updatedServiceLink?.status !== 'archived') {
        issues.push('Service getAll not reflecting update');
      }

      // Clean up
      await linkService.remove(testLink.id);

      const deletedDbLink = await db.links.get(testLink.id);
      if (deletedDbLink) {
        issues.push('Link not deleted from database after service remove');
      }

      const finalServiceLinks = await linkService.getAll();
      const finalServiceLink = finalServiceLinks.find(l => l.id === testLink.id);
      if (finalServiceLink) {
        issues.push('Link not removed from service getAll after remove');
      }

      console.log('[Consistency] Data consistency test completed');
    } catch (error) {
      issues.push(`Consistency test failed: ${error.message}`);
    }

    return {
      consistent: issues.length === 0,
      issues
    };
  }
};
