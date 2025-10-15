/**
 * Data Source Manager
 * Helps manage the data source priority for links in Smart Research Tracker
 */

export interface DataSourceInfo {
  extensionLinks: number;
  localLinks: number;
  mergedLinks: number;
  mode: 'extension-only' | 'merged';
}

export const dataSourceManager = {
  /**
   * Set the data source preference
   * @param preferExtensionOnly - If true, only show extension links. If false, merge with local DB.
   */
  setPreference(preferExtensionOnly: boolean): void {
    try {
      localStorage.setItem('preferExtensionOnly', preferExtensionOnly.toString());
      console.log(`[DataSourceManager] Set preference: ${preferExtensionOnly ? 'extension-only' : 'merged'}`);
    } catch (error) {
      console.error('[DataSourceManager] Failed to set preference:', error);
    }
  },

  /**
   * Get the current data source preference
   */
  getPreference(): boolean {
    try {
      return localStorage.getItem('preferExtensionOnly') === 'true';
    } catch (error) {
      console.error('[DataSourceManager] Failed to get preference:', error);
      return false; // Default to merged mode
    }
  },

  /**
   * Get information about current data sources
   */
  async getDataSourceInfo(): Promise<DataSourceInfo> {
    try {
      // This would need to be called from the link store context
      // For now, return basic info
      const preferExtensionOnly = this.getPreference();
      return {
        extensionLinks: 0, // Would be populated by link store
        localLinks: 0,     // Would be populated by link store
        mergedLinks: 0,    // Would be populated by link store
        mode: preferExtensionOnly ? 'extension-only' : 'merged'
      };
    } catch (error) {
      console.error('[DataSourceManager] Failed to get data source info:', error);
      return {
        extensionLinks: 0,
        localLinks: 0,
        mergedLinks: 0,
        mode: 'merged'
      };
    }
  },

  /**
   * Clear all data source preferences and reset to defaults
   */
  resetPreferences(): void {
    try {
      localStorage.removeItem('preferExtensionOnly');
      localStorage.removeItem('skipExtensionStorage');
      localStorage.removeItem('skipExtensionStorageUntil');
      console.log('[DataSourceManager] Reset all data source preferences');
    } catch (error) {
      console.error('[DataSourceManager] Failed to reset preferences:', error);
    }
  },

  /**
   * Get a user-friendly description of the current mode
   */
  getModeDescription(): string {
    const preferExtensionOnly = this.getPreference();
    if (preferExtensionOnly) {
      return 'Extension Only - Shows only links saved via the Chrome extension';
    } else {
      return 'Merged Mode - Shows extension links plus any local database links';
    }
  }
};
