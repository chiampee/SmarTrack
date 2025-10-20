/**
 * Database Test Runner
 * Automated tests to ensure the single database approach works correctly
 */

import { databaseValidationService } from '../services/databaseValidationService';
import { linkService } from '../services/linkService';
import { Link } from '../types/Link';

export interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  duration: number;
  details?: any;
}

export interface TestSuite {
  name: string;
  results: TestResult[];
  passed: number;
  failed: number;
  totalDuration: number;
}

export const databaseTestRunner = {
  /**
   * Run all database tests
   */
  async runAllTests(): Promise<TestSuite> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    console.log('🧪 Starting database test suite...');

    // Test 1: Basic connectivity
    results.push(await this.testBasicConnectivity());

    // Test 2: CRUD operations
    results.push(await this.testCRUDOperations());

    // Test 3: Data consistency
    results.push(await this.testDataConsistency());

    // Test 4: Duplicate handling
    results.push(await this.testDuplicateHandling());

    // Test 5: Service layer consistency
    results.push(await this.testServiceLayerConsistency());

    // Test 6: Database validation
    results.push(await this.testDatabaseValidation());

    const totalDuration = Date.now() - startTime;
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    const suite: TestSuite = {
      name: 'Database Test Suite',
      results,
      passed,
      failed,
      totalDuration
    };

    console.log(`🧪 Test suite completed: ${passed}/${results.length} passed in ${totalDuration}ms`);
    return suite;
  },

  /**
   * Test basic database connectivity
   */
  async testBasicConnectivity(): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Basic Connectivity';

    try {
      const links = await linkService.getAll();
      const duration = Date.now() - startTime;

      return {
        testName,
        passed: true,
        message: `Successfully connected to database and retrieved ${links.length} links`,
        duration,
        details: { linkCount: links.length }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName,
        passed: false,
        message: `Failed to connect to database: ${(error instanceof Error ? error.message : String(error))}`,
        duration
      };
    }
  },

  /**
   * Test CRUD operations
   */
  async testCRUDOperations(): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'CRUD Operations';

    try {
      const testLink: Link = {
        id: 'test-crud-' + Date.now(),
        url: 'https://test-crud.example.com',
        metadata: {
          title: 'CRUD Test',
          description: 'Test link for CRUD operations',
          image: ''
        },
        labels: ['test'],
        priority: 'medium',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        boardId: null
      };

      // Create
      await linkService.create(testLink);

      // Read
      const retrieved = await linkService.getById(testLink.id);
      if (!retrieved) {
        throw new Error('Failed to retrieve created link');
      }

      // Update
      await linkService.update(testLink.id, { status: 'archived' });
      const updated = await linkService.getById(testLink.id);
      if (updated?.status !== 'archived') {
        throw new Error('Failed to update link');
      }

      // Delete
      await linkService.remove(testLink.id);
      const deleted = await linkService.getById(testLink.id);
      if (deleted) {
        throw new Error('Failed to delete link');
      }

      const duration = Date.now() - startTime;
      return {
        testName,
        passed: true,
        message: 'All CRUD operations completed successfully',
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName,
        passed: false,
        message: `CRUD operations failed: ${(error instanceof Error ? error.message : String(error))}`,
        duration
      };
    }
  },

  /**
   * Test data consistency
   */
  async testDataConsistency(): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Data Consistency';

    try {
      const result = await databaseValidationService.testDataConsistency();
      const duration = Date.now() - startTime;

      return {
        testName,
        passed: result.consistent,
        message: result.consistent 
          ? 'Data is consistent across all operations'
          : `Data consistency issues found: ${result.issues.join(', ')}`,
        duration,
        details: result
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName,
        passed: false,
        message: `Data consistency test failed: ${(error instanceof Error ? error.message : String(error))}`,
        duration
      };
    }
  },

  /**
   * Test duplicate handling
   */
  async testDuplicateHandling(): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Duplicate Handling';

    try {
      const testUrl = 'https://test-duplicate.example.com';
      const link1: Link = {
        id: 'test-dup-1-' + Date.now(),
        url: testUrl,
        metadata: { title: 'Duplicate Test 1', description: '', image: '' },
        labels: ['test'],
        priority: 'medium',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        boardId: null
      };

      const link2: Link = {
        id: 'test-dup-2-' + Date.now(),
        url: testUrl,
        metadata: { title: 'Duplicate Test 2', description: '', image: '' },
        labels: ['test'],
        priority: 'medium',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        boardId: null
      };

      // Create two links with the same URL
      await linkService.create(link1);
      await linkService.create(link2);

      // Check if both exist (they should, as we're not preventing duplicates at service level)
      const allLinks = await linkService.getAll();
      const duplicates = allLinks.filter(l => l.url === testUrl);

      // Clean up
      await linkService.remove(link1.id);
      await linkService.remove(link2.id);

      const duration = Date.now() - startTime;
      return {
        testName,
        passed: true,
        message: `Duplicate handling test completed. Found ${duplicates.length} links with same URL.`,
        duration,
        details: { duplicateCount: duplicates.length }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName,
        passed: false,
        message: `Duplicate handling test failed: ${(error instanceof Error ? error.message : String(error))}`,
        duration
      };
    }
  },

  /**
   * Test service layer consistency
   */
  async testServiceLayerConsistency(): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Service Layer Consistency';

    try {
      const initialLinks = await linkService.getAll();
      const initialCount = initialLinks.length;

      const testLink: Link = {
        id: 'test-service-' + Date.now(),
        url: 'https://test-service.example.com',
        metadata: { title: 'Service Test', description: '', image: '' },
        labels: ['test'],
        priority: 'medium',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        boardId: null
      };

      // Create via service
      await linkService.create(testLink);

      // Verify count increased
      const afterCreate = await linkService.getAll();
      if (afterCreate.length !== initialCount + 1) {
        throw new Error('Link count did not increase after create');
      }

      // Remove via service
      await linkService.remove(testLink.id);

      // Verify count returned to original
      const afterDelete = await linkService.getAll();
      if (afterDelete.length !== initialCount) {
        throw new Error('Link count did not return to original after delete');
      }

      const duration = Date.now() - startTime;
      return {
        testName,
        passed: true,
        message: 'Service layer operations are consistent',
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName,
        passed: false,
        message: `Service layer consistency test failed: ${(error instanceof Error ? error.message : String(error))}`,
        duration
      };
    }
  },

  /**
   * Test database validation
   */
  async testDatabaseValidation(): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Database Validation';

    try {
      const health = await databaseValidationService.getDatabaseHealth();
      const duration = Date.now() - startTime;

      return {
        testName,
        passed: health.status !== 'error',
        message: `Database validation completed with status: ${health.status}`,
        duration,
        details: health
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName,
        passed: false,
        message: `Database validation test failed: ${(error instanceof Error ? error.message : String(error))}`,
        duration
      };
    }
  },

  /**
   * Run a quick health check
   */
  async quickHealthCheck(): Promise<{ healthy: boolean; message: string; details?: any }> {
    try {
      const health = await databaseValidationService.getDatabaseHealth();
      return {
        healthy: health.status === 'healthy',
        message: health.message,
        details: health
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Health check failed: ${(error instanceof Error ? error.message : String(error))}`
      };
    }
  }
};
