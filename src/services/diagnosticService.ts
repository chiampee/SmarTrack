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
        recommendation: 'Configure your OpenAI API key to enable AI features.',
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
              recommendation:
                'Check your internet connection and API key validity.',
            });
          }
        }
      } catch {
        issues.push({
          name: 'api_connectivity',
          status: 'error',
          message: 'Failed to test API connectivity',
          recommendation:
            'Network issues detected. Check your internet connection.',
        });
      }
    }

    // Check extension availability using the content-script handshake
    try {
      const detected = await new Promise<boolean>((resolve) => {
        let settled = false;
        const timeoutId = setTimeout(() => {
          if (!settled) resolve(false);
        }, 1500);

        const handle = (event: MessageEvent) => {
          const data = (event?.data || {}) as {
            type?: string;
            source?: string;
            status?: string;
            message?: string;
          };
          if (data?.type !== 'SRT_PONG') return;
          const hasSource = data.source === 'smart-research-tracker-extension';
          const hasStatus =
            data.status === 'ok' && data.message === 'Extension is working';
          if (hasSource || hasStatus) {
            settled = true;
            window.removeEventListener('message', handle);
            clearTimeout(timeoutId);
            resolve(true);
          }
        };
        window.addEventListener('message', handle);
        try {
          window.postMessage({ type: 'SRT_PING' }, '*');
        } catch {
          // ignore
        }
      });

      // Fallback markers (DOM attributes / marker element set by content script)
      const hasDomMarker =
        document.documentElement.getAttribute('data-smart-research-tracker') ===
          'true' || !!document.getElementById('srt-extension-marker');

      if (!detected && !hasDomMarker) {
        issues.push({
          name: 'extension',
          status: 'warning',
          message: 'Browser extension not detected',
          recommendation:
            'Install or reload the Smart Research Tracker extension, then refresh this page.',
        });
      }
    } catch {
      // Ignore detection errors; extension presence is a non-critical warning here
    }

    // Check internet connectivity in a way that avoids noisy CORS errors in dev
    try {
      if (
        typeof window !== 'undefined' &&
        (import.meta as unknown as { env?: Record<string, unknown> }).env
      ) {
        if (!navigator.onLine) {
          issues.push({
            name: 'network',
            status: 'error',
            message: 'You appear to be offline',
            recommendation: 'Reconnect to the internet and refresh the page.',
          });
        }
      } else {
        // Low-noise external check that typically succeeds without CORS complaints
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch('https://www.google.com/generate_204', {
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeout);
      }
    } catch {
      issues.push({
        name: 'network',
        status: 'warning',
        message:
          'Unable to verify external connectivity (blocked by CORS or network)',
        recommendation:
          'If features fail, check your connection and any network restrictions.',
      });
    }

    // Check browser compatibility
    const isModernBrowser =
      typeof fetch !== 'undefined' && typeof AbortSignal !== 'undefined';
    if (!isModernBrowser) {
      issues.push({
        name: 'browser',
        status: 'warning',
        message: 'Browser compatibility issues',
        recommendation:
          'Consider updating to a modern browser for the best experience.',
      });
    }

    return issues;
  },

  /**
   * Check if there are critical issues that should trigger the diagnostic modal
   */
  async hasCriticalIssues(): Promise<boolean> {
    const issues = await this.runAutomaticDiagnostics();
    return issues.some((issue) => issue.status === 'error');
  },

  /**
   * Get a summary of issues for display
   */
  async getIssueSummary(): Promise<{
    critical: number;
    warnings: number;
    total: number;
  }> {
    const issues = await this.runAutomaticDiagnostics();
    const critical = issues.filter((i) => i.status === 'error').length;
    const warnings = issues.filter((i) => i.status === 'warning').length;

    return {
      critical,
      warnings,
      total: issues.length,
    };
  },
};
