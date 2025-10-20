/**
 * Console Test Runner
 * Simple tests that can be run from the browser console
 */

import { databaseTestRunner } from './databaseTestRunner';
import { databaseValidationService } from '../services/databaseValidationService';
import { linkService } from '../services/linkService';
import { databaseCleanup } from './databaseCleanup';

// Make test functions available globally for console access
declare global {
  interface Window {
    runDatabaseTests: () => Promise<void>;
    quickHealthCheck: () => Promise<void>;
    validateDatabase: () => Promise<void>;
    testCRUD: () => Promise<void>;
    clearAllData: () => Promise<void>;
    getDatabaseStats: () => Promise<void>;
    cleanupDatabase: () => Promise<void>;
    cleanupDuplicates: () => Promise<void>;
  }
}

export const consoleTestRunner = {
  /**
   * Initialize console test functions
   */
  init() {
    if (typeof window !== 'undefined') {
      window.runDatabaseTests = this.runDatabaseTests;
      window.quickHealthCheck = this.quickHealthCheck;
      window.validateDatabase = this.validateDatabase;
      window.testCRUD = this.testCRUD;
      window.clearAllData = this.clearAllData;
      window.getDatabaseStats = this.getDatabaseStats;
      window.cleanupDatabase = this.cleanupDatabase;
      window.cleanupDuplicates = this.cleanupDuplicates;

      console.log('🧪 Console test functions loaded!');
      console.log('Available functions:');
      console.log('  - runDatabaseTests() - Run full test suite');
      console.log('  - quickHealthCheck() - Quick health check');
      console.log('  - validateDatabase() - Full database validation');
      console.log('  - testCRUD() - Test CRUD operations');
      console.log('  - clearAllData() - Clear all data (use with caution)');
      console.log('  - getDatabaseStats() - Get database statistics');
      console.log('  - cleanupDatabase() - Clean up duplicates and orphaned data');
      console.log('  - cleanupDuplicates() - Clean up duplicate URLs only');
    }
  },

  /**
   * Run full database test suite
   */
  async runDatabaseTests() {
    console.log('🧪 Running full database test suite...');
    try {
      const results = await databaseTestRunner.runAllTests();
      console.log('🧪 Test Results:', results);
      console.log(`✅ ${results.passed}/${results.results.length} tests passed`);
      if (results.failed > 0) {
        console.log(`❌ ${results.failed} tests failed`);
        results.results.filter(r => !r.passed).forEach(test => {
          console.log(`  - ${test.testName}: ${test.message}`);
        });
      }
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  },

  /**
   * Quick health check
   */
  async quickHealthCheck() {
    console.log('🏥 Running quick health check...');
    try {
      const health = await databaseTestRunner.quickHealthCheck();
      console.log('🏥 Health Check Result:', health);
      if (health.healthy) {
        console.log('✅ Database is healthy');
      } else {
        console.log('❌ Database has issues:', health.message);
      }
    } catch (error) {
      console.error('❌ Health check failed:', error);
    }
  },

  /**
   * Full database validation
   */
  async validateDatabase() {
    console.log('🔍 Running full database validation...');
    try {
      const health = await databaseValidationService.getDatabaseHealth();
      console.log('🔍 Validation Result:', health);
      
      if (health.status === 'healthy') {
        console.log('✅ Database is healthy');
      } else if (health.status === 'warning') {
        console.log('⚠️ Database has warnings');
        health.details.warnings.forEach(warning => {
          console.log(`  - ${warning}`);
        });
      } else {
        console.log('❌ Database has errors');
        health.details.errors.forEach(error => {
          console.log(`  - ${error}`);
        });
      }
    } catch (error) {
      console.error('❌ Validation failed:', error);
    }
  },

  /**
   * Test CRUD operations
   */
  async testCRUD() {
    console.log('🔧 Testing CRUD operations...');
    try {
      const testLink = {
        id: 'console-test-' + Date.now(),
      userId: 'test-user',
        url: 'https://console-test.example.com',
        metadata: {
          title: 'Console Test',
          description: 'Test link created from console',
          image: ''
        },
        labels: ['console-test'],
        priority: 'medium' as const,
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        boardId: null
      };

      console.log('📝 Creating test link...');
      await linkService.create(testLink);
      console.log('✅ Link created');

      console.log('📖 Reading test link...');
      const retrieved = await linkService.getById(testLink.id);
      if (retrieved) {
        console.log('✅ Link retrieved:', retrieved);
      } else {
        throw new Error('Failed to retrieve link');
      }

      console.log('✏️ Updating test link...');
      await linkService.update(testLink.id, { status: 'archived' });
      const updated = await linkService.getById(testLink.id);
      if (updated?.status === 'archived') {
        console.log('✅ Link updated');
      } else {
        throw new Error('Failed to update link');
      }

      console.log('🗑️ Deleting test link...');
      await linkService.remove(testLink.id);
      const deleted = await linkService.getById(testLink.id);
      if (!deleted) {
        console.log('✅ Link deleted');
      } else {
        throw new Error('Failed to delete link');
      }

      console.log('🎉 All CRUD operations successful!');
    } catch (error) {
      console.error('❌ CRUD test failed:', error);
    }
  },

  /**
   * Clear all data (use with caution)
   */
  async clearAllData() {
    const confirmed = confirm('⚠️ This will delete ALL data. Are you sure?');
    if (!confirmed) {
      console.log('❌ Operation cancelled');
      return;
    }

    console.log('🗑️ Clearing all data...');
    try {
      const links = await linkService.getAll();
      for (const link of links) {
        await linkService.remove(link.id);
      }
      console.log(`✅ Deleted ${links.length} links`);
      console.log('🔄 Please refresh the page to see changes');
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
    }
  },

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    console.log('📊 Getting database statistics...');
    try {
      const links = await linkService.getAll();
      const health = await databaseValidationService.getDatabaseHealth();
      
      console.log('📊 Database Statistics:');
      console.log(`  Total Links: ${links.length}`);
      console.log(`  Duplicate URLs: ${health.details.stats.duplicateUrls}`);
      console.log(`  Invalid Links: ${health.details.stats.invalidLinks}`);
      console.log(`  Orphaned Summaries: ${health.details.stats.orphanedSummaries}`);
      console.log(`  Orphaned Chat Messages: ${health.details.stats.orphanedChatMessages}`);
      console.log(`  Health Status: ${health.status}`);
      
      if (links.length > 0) {
        console.log('📋 Sample Links:');
        links.slice(0, 5).forEach((link, index) => {
          console.log(`  ${index + 1}. ${link.metadata?.title || 'Untitled'} - ${link.url}`);
        });
        if (links.length > 5) {
          console.log(`  ... and ${links.length - 5} more`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to get statistics:', error);
    }
  },

  /**
   * Clean up database (duplicates and orphaned data)
   */
  async cleanupDatabase() {
    console.log('🧹 Running complete database cleanup...');
    try {
      const result = await databaseCleanup.runCompleteCleanup();
      console.log('🧹 Cleanup Results:', result);
      console.log(`✅ Removed ${result.duplicatesRemoved} duplicate links`);
      console.log(`✅ Removed ${result.orphanedSummariesRemoved} orphaned summaries`);
      console.log(`✅ Removed ${result.orphanedChatMessagesRemoved} orphaned chat messages`);
      
      if (result.errors.length > 0) {
        console.log('❌ Errors during cleanup:');
        result.errors.forEach(error => console.log(`  - ${error}`));
      }
      
      console.log('🔄 Please refresh the page to see changes');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  },

  /**
   * Clean up duplicate URLs only
   */
  async cleanupDuplicates() {
    console.log('🧹 Running duplicate URL cleanup...');
    try {
      const result = await databaseCleanup.cleanupDuplicates();
      console.log('🧹 Duplicate Cleanup Results:', result);
      console.log(`✅ Removed ${result.removed} duplicate links`);
      
      if (result.errors.length > 0) {
        console.log('❌ Errors during cleanup:');
        result.errors.forEach(error => console.log(`  - ${error}`));
      }
      
      console.log('🔄 Please refresh the page to see changes');
    } catch (error) {
      console.error('❌ Duplicate cleanup failed:', error);
    }
  }
};

// Auto-initialize when this module is loaded
if (typeof window !== 'undefined') {
  consoleTestRunner.init();
}
