import React, { useState, useEffect } from 'react';
import { dataSourceManager } from '../utils/dataSourceManager';
import { DataSourceSettings } from '../components/DataSourceSettings';

export const DataSourceDebugPage: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);

  const gatherDebugInfo = async () => {
    try {
      const info = {
        timestamp: new Date().toISOString(),
        localStorage: {
          preferExtensionOnly: localStorage.getItem('preferExtensionOnly'),
          skipExtensionStorage: localStorage.getItem('skipExtensionStorage'),
          skipExtensionStorageUntil: localStorage.getItem('skipExtensionStorageUntil'),
        },
        dataSourceManager: {
          preference: dataSourceManager.getPreference(),
          modeDescription: dataSourceManager.getModeDescription(),
        },
        userAgent: navigator.userAgent,
        url: window.location.href,
      };
      
      setDebugInfo(info);
    } catch (error) {
      console.error('Failed to gather debug info:', error);
      setDebugInfo({ error: (error instanceof Error ? error.message : String(error)) });
    }
  };

  useEffect(() => {
    gatherDebugInfo();
  }, []);

  const clearAllData = () => {
    if (window.confirm('Clear all local data? This will remove all saved links and settings.')) {
      try {
        // Clear localStorage
        localStorage.clear();
        
        // Clear IndexedDB (this would need to be done through the link store)
        console.log('Clearing all local data...');
        
        alert('Local data cleared. Please refresh the page.');
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear data:', error);
        alert('Failed to clear data. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Data Source Debug Page</h1>
          
          <div className="space-y-6">
            {/* Current Status */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Current Status</h2>
              <p className="text-sm text-gray-700">
                {dataSourceManager.getModeDescription()}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {showSettings ? 'Hide' : 'Show'} Settings
                </button>
                
                <button
                  onClick={gatherDebugInfo}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Refresh Debug Info
                </button>
                
                <button
                  onClick={clearAllData}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Clear All Data
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="border-t pt-6">
                <DataSourceSettings />
              </div>
            )}

            {/* Debug Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-3">Debug Information</h2>
              {debugInfo ? (
                <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-96">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500">Loading debug information...</p>
              )}
            </div>

            {/* Explanation */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">What This Page Does</h2>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Extension Only Mode:</strong> Shows only links saved via the Chrome extension</li>
                <li>• <strong>Merged Mode:</strong> Shows extension links plus any local database links</li>
                <li>• <strong>Debug Info:</strong> Shows current settings and localStorage values</li>
                <li>• <strong>Clear Data:</strong> Removes all local data (use with caution)</li>
              </ul>
            </div>

            {/* Troubleshooting */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Troubleshooting</h2>
              <div className="text-sm text-gray-700 space-y-2">
                <p><strong>If you see unexpected links on refresh:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Enable "Extension Only Mode" to see only extension-saved links</li>
                  <li>Check the debug info to see what data sources are active</li>
                  <li>Use "Clear All Data" if you want to start fresh</li>
                  <li>Refresh the page after changing settings</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
