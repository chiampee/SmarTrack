import React, { useState, useEffect } from 'react';
import { databaseTestRunner, TestSuite, TestResult } from '../utils/databaseTestRunner';
import { databaseCleanup } from '../utils/databaseCleanup';
import { linkService } from '../services/linkService';
import { db } from '../db/smartResearchDB';
import type { Link } from '../types/Link';

export const DatabaseTestPage: React.FC = () => {
  const [testSuite, setTestSuite] = useState<TestSuite | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [quickHealth, setQuickHealth] = useState<{ healthy: boolean; message: string; details?: any } | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [cleanupResult, setCleanupResult] = useState<any>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [saveTestResult, setSaveTestResult] = useState<{ success: boolean; message: string; link?: Link } | null>(null);

  const loadStats = async () => {
    try {
      const stats = await databaseCleanup.getDatabaseStats();
      setStats(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const runAllTests = async () => {
    setIsRunning(true);
    try {
      const results = await databaseTestRunner.runAllTests();
      setTestSuite(results);
    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runQuickHealthCheck = async () => {
    try {
      const health = await databaseTestRunner.quickHealthCheck();
      setQuickHealth(health);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const runCompleteCleanup = async () => {
    setIsCleaning(true);
    setCleanupResult(null);
    
    try {
      console.log('🧹 Starting complete database cleanup...');
      const result = await databaseCleanup.runCompleteCleanup();
      setCleanupResult(result);
      
      // Reload stats after cleanup
      await loadStats();
      
      console.log('✅ Complete cleanup finished:', result);
    } catch (error) {
      console.error('❌ Complete cleanup failed:', error);
      setCleanupResult({ error: (error instanceof Error ? error.message : String(error)) });
    } finally {
      setIsCleaning(false);
    }
  };

  const runDuplicateCleanup = async () => {
    setIsCleaning(true);
    setCleanupResult(null);
    
    try {
      console.log('🧹 Starting duplicate cleanup...');
      const result = await databaseCleanup.cleanupDuplicates();
      setCleanupResult(result);
      
      // Reload stats after cleanup
      await loadStats();
      
      console.log('✅ Duplicate cleanup finished:', result);
    } catch (error) {
      console.error('❌ Duplicate cleanup failed:', error);
      setCleanupResult({ error: (error instanceof Error ? error.message : String(error)) });
    } finally {
      setIsCleaning(false);
    }
  };

  const runOrphanedCleanup = async () => {
    setIsCleaning(true);
    setCleanupResult(null);
    
    try {
      console.log('🧹 Starting orphaned data cleanup...');
      const summaryResult = await databaseCleanup.cleanupOrphanedSummaries();
      const messageResult = await databaseCleanup.cleanupOrphanedChatMessages();
      
      setCleanupResult({
        orphanedSummariesRemoved: summaryResult.removed,
        orphanedChatMessagesRemoved: messageResult.removed,
        errors: [...summaryResult.errors, ...messageResult.errors]
      });
      
      // Reload stats after cleanup
      await loadStats();
      
      console.log('✅ Orphaned data cleanup finished');
    } catch (error) {
      console.error('❌ Orphaned data cleanup failed:', error);
      setCleanupResult({ error: (error as Error).message });
    } finally {
      setIsCleaning(false);
    }
  };

  const testSaveLink = async () => {
    setSaveTestResult(null);
    
    try {
      console.log('🧪 Testing link save functionality...');
      
      // Create a test link
      const testLink: Link = {
        id: crypto.randomUUID(),
      userId: 'test-user',
        url: 'https://example.com/test-' + Date.now(),
        metadata: {
          title: 'Test Link ' + new Date().toLocaleTimeString(),
          description: 'This is a test link to verify database saving',
          image: ''
        },
        labels: ['test'],
        priority: 'medium',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('📝 Created test link:', testLink);
      
      // Try saving via linkService
      console.log('💾 Saving via linkService...');
      await linkService.create(testLink);
      
      // Verify it was saved
      console.log('🔍 Verifying save...');
      const retrieved = await db.getLink(testLink.id);
      
      if (retrieved) {
        console.log('✅ Link saved and retrieved successfully!');
        setSaveTestResult({
          success: true,
          message: `Successfully saved and retrieved link: "${testLink.metadata.title}"`,
          link: retrieved
        });
        
        // Reload stats to show updated count
        await loadStats();
      } else {
        console.error('❌ Link was not found after saving!');
        setSaveTestResult({
          success: false,
          message: 'Link was not found in database after saving. Save operation may have failed silently.'
        });
      }
      
    } catch (error) {
      console.error('❌ Test save failed:', error);
      setSaveTestResult({
        success: false,
        message: `Save failed: ${(error as Error).message}`
      });
    }
  };

  const getTestResultColor = (passed: boolean) => {
    return passed ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getTestResultIcon = (passed: boolean) => {
    return passed ? '✅' : '❌';
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6">Database Test Runner</h1>
          
          {/* Quick Health Check */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Quick Health Check</h2>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={runQuickHealthCheck}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Run Health Check
              </button>
              <button
                onClick={testSaveLink}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                🧪 Test Save Link
              </button>
              {quickHealth && (
                <div className={`p-3 rounded-lg ${quickHealth.healthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <span className="font-semibold">
                    {quickHealth.healthy ? '✅ Healthy' : '❌ Issues Found'}
                  </span>
                  <span className="ml-2">{quickHealth.message}</span>
                </div>
              )}
            </div>
            
            {/* Save Test Result */}
            {saveTestResult && (
              <div className={`mt-4 p-4 rounded-lg ${saveTestResult.success ? 'bg-green-100 text-green-800 border-2 border-green-300' : 'bg-red-100 text-red-800 border-2 border-red-300'}`}>
                <div className="font-semibold mb-2">
                  {saveTestResult.success ? '✅ Save Test Passed' : '❌ Save Test Failed'}
                </div>
                <div className="text-sm">{saveTestResult.message}</div>
                {saveTestResult.link && (
                  <div className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded">
                    <div><strong>ID:</strong> {saveTestResult.link.id}</div>
                    <div><strong>URL:</strong> {saveTestResult.link.url}</div>
                    <div><strong>Created:</strong> {new Date(saveTestResult.link.createdAt).toLocaleString()}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Database Statistics */}
          {stats && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Database Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalLinks}</div>
                  <div className="text-sm text-blue-800">Total Links</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.duplicateUrls}</div>
                  <div className="text-sm text-red-800">Duplicate URLs</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.orphanedSummaries}</div>
                  <div className="text-sm text-yellow-800">Orphaned Summaries</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.orphanedChatMessages}</div>
                  <div className="text-sm text-purple-800">Orphaned Messages</div>
                </div>
              </div>
            </div>
          )}

          {/* Cleanup Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Database Cleanup</h2>
            <div className="flex flex-wrap gap-4 mb-4">
              <button
                onClick={runCompleteCleanup}
                disabled={isCleaning}
                className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isCleaning ? 'Cleaning...' : '🧹 Complete Cleanup'}
              </button>
              
              <button
                onClick={runDuplicateCleanup}
                disabled={isCleaning}
                className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
              >
                {isCleaning ? 'Cleaning...' : '🔗 Clean Duplicates Only'}
              </button>
              
              <button
                onClick={runOrphanedCleanup}
                disabled={isCleaning}
                className="bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
              >
                {isCleaning ? 'Cleaning...' : '🗑️ Clean Orphaned Data Only'}
              </button>
              
              <button
                onClick={loadStats}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                🔄 Refresh Stats
              </button>
            </div>

            {/* Cleanup Results */}
            {cleanupResult && (
              <div className="bg-gray-50 p-4 rounded-lg">
                {cleanupResult.error ? (
                  <div className="text-red-600">
                    <p>❌ Error: {cleanupResult.error}</p>
                  </div>
                ) : (
                  <div className="text-green-600">
                    <div className="space-y-1">
                      {cleanupResult.duplicatesRemoved !== undefined && (
                        <p>✅ Removed {cleanupResult.duplicatesRemoved} duplicate links</p>
                      )}
                      {cleanupResult.removed !== undefined && (
                        <p>✅ Removed {cleanupResult.removed} duplicate links</p>
                      )}
                      {cleanupResult.orphanedSummariesRemoved !== undefined && (
                        <p>✅ Removed {cleanupResult.orphanedSummariesRemoved} orphaned summaries</p>
                      )}
                      {cleanupResult.orphanedChatMessagesRemoved !== undefined && (
                        <p>✅ Removed {cleanupResult.orphanedChatMessagesRemoved} orphaned chat messages</p>
                      )}
                      {cleanupResult.errors && cleanupResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-red-600 font-semibold">Errors:</p>
                          <ul className="text-red-600">
                            {cleanupResult.errors.map((error: string, index: number) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Test Suite */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Full Test Suite</h2>
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={runAllTests}
                disabled={isRunning}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isRunning ? 'Running Tests...' : 'Run All Tests'}
              </button>
              {testSuite && (
                <div className="text-sm text-gray-600">
                  Completed in {testSuite.totalDuration}ms
                </div>
              )}
            </div>

            {testSuite && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="text-2xl font-bold">
                    {testSuite.passed}/{testSuite.results.length}
                  </div>
                  <div>
                    <div className="font-semibold">Tests Passed</div>
                    <div className="text-sm text-gray-600">
                      {testSuite.failed > 0 && `${testSuite.failed} failed`}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {testSuite.results.map((result, index) => (
                    <div key={index} className={`p-3 rounded-lg ${getTestResultColor(result.passed)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getTestResultIcon(result.passed)}</span>
                          <span className="font-semibold">{result.testName}</span>
                        </div>
                        <div className="text-sm opacity-75">
                          {result.duration}ms
                        </div>
                      </div>
                      <div className="mt-1 text-sm">
                        {result.message}
                      </div>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-sm cursor-pointer">Details</summary>
                          <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Test Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Test Suite Information</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Basic Connectivity:</strong> Tests database connection and basic queries</p>
              <p><strong>CRUD Operations:</strong> Tests Create, Read, Update, Delete operations</p>
              <p><strong>Data Consistency:</strong> Verifies data integrity across operations</p>
              <p><strong>Duplicate Handling:</strong> Tests how duplicates are managed</p>
              <p><strong>Service Layer Consistency:</strong> Ensures service layer works correctly</p>
              <p><strong>Database Validation:</strong> Runs comprehensive database health checks</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">How to Use</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• <strong>Quick Health Check:</strong> Fast check of database status</li>
              <li>• <strong>Database Statistics:</strong> Shows current database state (links, duplicates, orphaned data)</li>
              <li>• <strong>Database Cleanup:</strong> Remove duplicates and orphaned data</li>
              <li>• <strong>Run All Tests:</strong> Comprehensive test suite (takes a few seconds)</li>
              <li>• <strong>Test Results:</strong> Green = passed, Red = failed</li>
              <li>• <strong>Details:</strong> Click "Details" to see additional information</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
