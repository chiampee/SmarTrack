import React, { useState, useEffect } from 'react';
import { dataSourceManager } from '../utils/dataSourceManager';

interface DataSourceSettingsProps {
  onClose?: () => void;
}

export const DataSourceSettings: React.FC<DataSourceSettingsProps> = ({ onClose }) => {
  const [preferExtensionOnly, setPreferExtensionOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setPreferExtensionOnly(dataSourceManager.getPreference());
  }, []);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const newValue = !preferExtensionOnly;
      dataSourceManager.setPreference(newValue);
      setPreferExtensionOnly(newValue);
      
      // Show success message
      console.log(`Data source preference updated: ${newValue ? 'Extension Only' : 'Merged Mode'}`);
      
      // Optionally refresh the page to apply changes
      if (window.confirm('Data source preference updated. Refresh the page to see changes?')) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update data source preference:', error);
      alert('Failed to update preference. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all data source preferences to defaults?')) {
      dataSourceManager.resetPreferences();
      setPreferExtensionOnly(false);
      if (window.confirm('Preferences reset. Refresh the page to apply changes?')) {
        window.location.reload();
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Data Source Settings</h3>
      
      <div className="space-y-4">
        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferExtensionOnly}
              onChange={handleToggle}
              disabled={isLoading}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium">
              Extension Only Mode
            </span>
          </label>
          <p className="text-xs text-gray-600 mt-1 ml-7">
            {preferExtensionOnly 
              ? 'Only shows links saved via the Chrome extension'
              : 'Shows extension links plus any local database links'
            }
          </p>
        </div>

        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-700">
            <strong>Current Mode:</strong> {dataSourceManager.getModeDescription()}
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleToggle}
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Update Preference'}
          </button>
          
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Reset
          </button>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Close
          </button>
        )}
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-xs text-yellow-800">
          <strong>Note:</strong> Changes will take effect after refreshing the page. 
          This setting controls how links from different sources are combined.
        </p>
      </div>
    </div>
  );
};
