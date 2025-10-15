import React, { useState, useEffect } from 'react';
import { databaseValidationService, DatabaseHealth, ValidationResult } from '../services/databaseValidationService';
import { useLinkStore } from '../stores/linkStore';

export const DatabaseValidationPage: React.FC = () => {
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isTestingConsistency, setIsTestingConsistency] = useState(false);
  const [consistencyResult, setConsistencyResult] = useState<{ consistent: boolean; issues: string[] } | null>(null);
  const [cleanupResult, setCleanupResult] = useState<{ cleaned: number; errors: string[] } | null>(null);
  const { rawLinks, loadLinks } = useLinkStore();

  const runValidation = async () => {
    setIsValidating(true);
    try {
      const result = await databaseValidationService.getDatabaseHealth();
      setHealth(result);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const runCleanup = async () => {
    setIsCleaning(true);
    try {
      const result = await databaseValidationService.cleanupDatabase();
      setCleanupResult(result);
      // Refresh links after cleanup
      await loadLinks();
      // Re-run validation
      await runValidation();
    } catch (error) {
      console.error('Cleanup failed:', error);
    } finally {
      setIsCleaning(false);
    }
  };

  const testConsistency = async () => {
    setIsTestingConsistency(true);
    try {
      const result = await databaseValidationService.testDataConsistency();
      setConsistencyResult(result);
    } catch (error) {
      console.error('Consistency test failed:', error);
    } finally {
      setIsTestingConsistency(false);
    }
  };

  useEffect(() => {
    runValidation();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6">Database Validation & Testing</h1>
          
          {/* Current Status */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Current Status</h2>
            {health ? (
              <div className={`p-4 rounded-lg ${getStatusColor(health.status)}`}>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getStatusIcon(health.status)}</span>
                  <div>
                    <p className="font-semibold">{health.message}</p>
                    <p className="text-sm opacity-75">Last checked: {new Date(health.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-gray-100">
                <p>No validation data available</p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {health && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Database Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{health.details.stats.totalLinks}</div>
                  <div className="text-sm text-blue-800">Total Links</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{health.details.stats.duplicateUrls}</div>
                  <div className="text-sm text-red-800">Duplicates</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{health.details.stats.invalidLinks}</div>
                  <div className="text-sm text-orange-800">Invalid Links</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">{health.details.stats.orphanedSummaries}</div>
                  <div className="text-sm text-yellow-800">Orphaned Summaries</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{health.details.stats.orphanedChatMessages}</div>
                  <div className="text-sm text-purple-800">Orphaned Messages</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={runValidation}
                disabled={isValidating}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isValidating ? 'Validating...' : 'Run Validation'}
              </button>
              
              <button
                onClick={testConsistency}
                disabled={isTestingConsistency}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isTestingConsistency ? 'Testing...' : 'Test Consistency'}
              </button>
              
              <button
                onClick={runCleanup}
                disabled={isCleaning}
                className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
              >
                {isCleaning ? 'Cleaning...' : 'Cleanup Database'}
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
              >
                Refresh Page
              </button>
            </div>
          </div>

          {/* Errors */}
          {health && health.details.errors.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-red-600">Errors</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <ul className="space-y-2">
                  {health.details.errors.map((error, index) => (
                    <li key={index} className="text-red-800">• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Warnings */}
          {health && health.details.warnings.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-yellow-600">Warnings</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <ul className="space-y-2">
                  {health.details.warnings.map((warning, index) => (
                    <li key={index} className="text-yellow-800">• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Consistency Test Results */}
          {consistencyResult && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Consistency Test Results</h2>
              <div className={`p-4 rounded-lg ${consistencyResult.consistent ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">{consistencyResult.consistent ? '✅' : '❌'}</span>
                  <span className="font-semibold">
                    {consistencyResult.consistent ? 'Data is consistent' : 'Data consistency issues found'}
                  </span>
                </div>
                {consistencyResult.issues.length > 0 && (
                  <ul className="space-y-1">
                    {consistencyResult.issues.map((issue, index) => (
                      <li key={index} className="text-red-800">• {issue}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Cleanup Results */}
          {cleanupResult && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Cleanup Results</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  <strong>Cleaned:</strong> {cleanupResult.cleaned} items
                </p>
                {cleanupResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-red-800 font-semibold">Errors:</p>
                    <ul className="space-y-1">
                      {cleanupResult.errors.map((error, index) => (
                        <li key={index} className="text-red-800">• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Current Links Display */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Current Links in Store</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Total links in store:</strong> {rawLinks.length}
              </p>
              {rawLinks.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Sample links:</p>
                  <ul className="text-sm space-y-1 mt-1">
                    {rawLinks.slice(0, 5).map((link, index) => (
                      <li key={index} className="text-gray-700">
                        {index + 1}. {link.metadata?.title || 'Untitled'} - {link.url}
                      </li>
                    ))}
                    {rawLinks.length > 5 && (
                      <li className="text-gray-500">... and {rawLinks.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">How to Use This Page</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Run Validation:</strong> Check database health and identify issues</li>
              <li>• <strong>Test Consistency:</strong> Verify that all operations work correctly</li>
              <li>• <strong>Cleanup Database:</strong> Remove duplicates and orphaned data</li>
              <li>• <strong>Refresh Page:</strong> Reload to see current state</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
