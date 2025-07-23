import { apiKeySetupService } from './apiKeySetupService';



export interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  recommendation?: string;
  action?: {
    label: string;
    url?: string;
    onClick?: () => void;
  };
}

export const diagnosticService = {
  /**
   * Run automatic diagnostics and return any issues found
   */
  async runAutomaticDiagnostics(): Promise<DiagnosticResult[]> {
    const issues: DiagnosticResult[] = [];

    // Check API key configuration
    const isApiKeyConfigured = apiKeySetupService.isApiKeyConfigured();
    if (!isApiKeyConfigured) {
      issues.push({
        name: 'api_key',
        status: 'error',
        message: 'API key not configured',
        recommendation: 'Configure your OpenAI API key to enable AI features.'
      });
    } else {
      // Test API connectivity if key is configured
      try {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (apiKey) {
          const testResult = await apiKeySetupService.testApiKey(apiKey);
          if (!testResult.success) {
            issues.push({
              name: 'api_connectivity',
              status: 'error',
              message: testResult.message,
              recommendation: 'Check your internet connection and API key validity.'
            });
          }
        }
      } catch (error) {
        issues.push({
          name: 'api_connectivity',
          status: 'error',
          message: 'Failed to test API connectivity',
          recommendation: 'Network issues detected. Check your internet connection.'
        });
      }
    }

    // Check extension availability
    try {
      const extensionId = 'your-extension-id'; // Replace with actual extension ID
      const extensionCheck = await new Promise<boolean>((resolve) => {
        if (typeof window.chrome !== 'undefined' && window.chrome.runtime) {
          window.chrome.runtime.sendMessage(extensionId, { action: 'ping' }, (response) => {
            resolve(!!response);
          });
        } else {
          resolve(false);
        }
      });

      if (!extensionCheck) {
        issues.push({
          name: 'extension',
          status: 'warning',
          message: 'Browser extension not detected',
          recommendation: 'Install the Smart Research Tracker browser extension for the best experience.'
        });
      }
    } catch (error) {
      // Extension check failed, but don't treat as critical error
    }

    // Check internet connectivity - use a more reliable endpoint
    try {
      const response = await fetch('https://httpbin.org/status/200', { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      if (!response.ok) {
        issues.push({
          name: 'network',
          status: 'error',
          message: 'Unable to reach external services',
          recommendation: 'Check your internet connection and firewall settings.'
        });
      }
    } catch (error) {
      issues.push({
        name: 'network',
        status: 'error',
        message: 'Network connectivity issues detected',
        recommendation: 'Check your internet connection and try again.'
      });
    }

    // Check browser compatibility
    const isModernBrowser = typeof fetch !== 'undefined' && typeof AbortSignal !== 'undefined';
    if (!isModernBrowser) {
      issues.push({
        name: 'browser',
        status: 'warning',
        message: 'Browser compatibility issues',
        recommendation: 'Consider updating to a modern browser for the best experience.'
      });
    }

    return issues;
  },

  /**
   * Check if there are critical issues that should trigger the diagnostic modal
   */
  async hasCriticalIssues(): Promise<boolean> {
    const issues = await this.runAutomaticDiagnostics();
    return issues.some(issue => issue.status === 'error');
  },

  /**
   * Get a summary of issues for display
   */
  async getIssueSummary(): Promise<{ critical: number; warnings: number; total: number }> {
    const issues = await this.runAutomaticDiagnostics();
    const critical = issues.filter(i => i.status === 'error').length;
    const warnings = issues.filter(i => i.status === 'warning').length;
    
    return {
      critical,
      warnings,
      total: issues.length
    };
  }
}; 