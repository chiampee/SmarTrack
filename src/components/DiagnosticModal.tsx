import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  ExternalLink,
  Download,
  Settings,
  Wifi,
  Key,
  Globe,
  Sparkles,
  Zap
} from 'lucide-react';
import { apiKeySetupService } from '../services/apiKeySetupService';

// Add Chrome API type declarations at the top
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (extensionId: string, message: any, callback: (response: any) => void) => void;
        id?: string;
      };
      tabs?: {
        create: (options: { url: string }) => void;
      };
    };
  }
}

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  recommendation?: string;
  action?: {
    label: string;
    url?: string;
    onClick?: () => void;
  };
  details?: string; // Added for more detailed information
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [animateResults, setAnimateResults] = useState(false);

  const checkExtensionStatus = async (): Promise<{ installed: boolean; accessible: boolean; details: string }> => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return { installed: false, accessible: false, details: 'Not in browser environment' };
    }

    const detectionMethods = [];
    let positiveDetections = 0;
    let totalChecks = 0;

    // Method 1: Fast path – handshake with content script via window.postMessage
    try {
      totalChecks++;
      detectionMethods.push('Window handshake');

      const handshake = await new Promise<{ valid: boolean; details: string }>((resolve) => {
        let resolved = false;
        const timeoutId = setTimeout(() => {
          if (!resolved) resolve({ valid: false, details: 'Timeout' });
        }, 1500);

        const handleMessage = (event: MessageEvent) => {
          const data = (event?.data || {}) as any;
          if (data?.type !== 'SRT_PONG') return;
          // Validate fields we set in the content script
          const hasSource = data.source === 'smart-research-tracker-extension';
          const hasStatus = data.status === 'ok' && data.message === 'Extension is working';
          const hasTimestamp = typeof data.timestamp === 'number';
          const identifierCount = [hasSource, hasStatus, hasTimestamp].filter(Boolean).length;
          const isValid = identifierCount >= 2;
          window.removeEventListener('message', handleMessage);
          clearTimeout(timeoutId);
          resolved = true;
          resolve({ valid: isValid, details: `Handshake identifiers: ${identifierCount}` });
        };

        window.addEventListener('message', handleMessage);
        // Send ping that content script listens for
        window.postMessage({ type: 'SRT_PING' }, '*');
        // Also look for passive presence variables that don't require inline script injection
        setTimeout(() => {
          try {
            const hasPresence = !!(window as any).smartResearchTracker || !!(window as any).__SMART_RESEARCH_TRACKER__;
            if (hasPresence && !resolved) {
              resolved = true;
              clearTimeout(timeoutId);
              window.removeEventListener('message', handleMessage);
              resolve({ valid: true, details: 'Passive presence variable detected' });
            }
          } catch (_) {}
        }, 200);
      });

      if (handshake.valid) {
        positiveDetections++;
        return { installed: true, accessible: true, details: `Extension responded via handshake: ${handshake.details}` };
      } else {
        detectionMethods.push(`Window handshake (${handshake.details})`);
      }
    } catch (error) {
      console.log('Extension handshake failed:', error);
      detectionMethods.push('Window handshake (failed)');
    }

    // Method 2: Check if extension is installed by trying to communicate with it using Chrome API (will fail on web pages without externally_connectable)
    try {
      totalChecks++;
      if (typeof window.chrome !== 'undefined' && window.chrome.runtime) {
        detectionMethods.push('Chrome API');
        
        // Try to send a message to our extension with specific validation
        const response = await new Promise<{ valid: boolean; details: string }>((resolve) => {
          const timeout = setTimeout(() => resolve({ valid: false, details: 'Timeout' }), 2000); // 2 second timeout
          
          window.chrome!.runtime!.sendMessage('smart-research-tracker', { 
            action: 'ping',
            timestamp: Date.now(),
            source: 'smart-research-tracker-app'
          }, (response: any) => {
            clearTimeout(timeout);
            
            // Validate the response is from our extension with stricter criteria
            if (response && typeof response === 'object') {
              // Require at least 2 specific identifiers to reduce false positives
              const hasExtensionId = response.extensionId === 'smart-research-tracker';
              const hasSource = response.source === 'smart-research-tracker-extension';
              const hasValidStatus = response.status === 'ok' && response.message === 'Extension is working';
              const hasTimestamp = response.timestamp && typeof response.timestamp === 'number';
              
              // Must have at least 2 of these specific identifiers
              const identifierCount = [hasExtensionId, hasSource, hasValidStatus, hasTimestamp].filter(Boolean).length;
              const isValidResponse = identifierCount >= 2;
              
              resolve({ 
                valid: isValidResponse, 
                details: isValidResponse ? `Valid extension response (${identifierCount} identifiers)` : `Invalid response format (${identifierCount} identifiers)`
              });
            } else {
              resolve({ valid: false, details: 'No response or invalid format' });
            }
          });
        });
        
        if (response.valid) {
          positiveDetections++;
          return { installed: true, accessible: true, details: `Extension responded via Chrome API: ${response.details}` };
        } else {
          detectionMethods.push(`Chrome API (${response.details})`);
        }
      }
    } catch (error) {
      console.log('Extension communication failed:', error);
      detectionMethods.push('Chrome API (failed)');
    }

    // Method 3: Check if extension elements are present in the DOM with specific attributes
    try {
      totalChecks++;
      detectionMethods.push('DOM elements');
      
      // Look for specific extension elements with proper attributes
      const extensionElements = document.querySelectorAll('[data-extension="smart-research-tracker"], [data-smart-research-tracker], .smart-research-tracker-extension');
      const validElements = Array.from(extensionElements).filter(el => {
        // Validate that the element has proper extension attributes
        const hasValidId = el.id && el.id.includes('smart-research-tracker');
        const hasValidClass = el.className && el.className.includes('smart-research-tracker');
        const hasValidData = el.getAttribute('data-extension') === 'smart-research-tracker' ||
                           el.getAttribute('data-smart-research-tracker') === 'true';
        
        return hasValidId || hasValidClass || hasValidData;
      });
      
      if (validElements.length > 0) {
        positiveDetections++;
        return { installed: true, accessible: true, details: `Extension elements found in DOM: ${validElements.length} valid elements` };
      }
    } catch (error) {
      console.log('Extension DOM check failed:', error);
      detectionMethods.push('DOM elements (failed)');
    }

    // Method 4: Check if extension script is loaded with specific validation
    try {
      totalChecks++;
      detectionMethods.push('Script detection');
      
      const extensionScripts = Array.from(document.scripts).filter(script => {
        if (!script.src) return false;
        
        const src = script.src.toLowerCase();
        const validPatterns = [
          'smart-research-tracker',
          'contentscript',
          'background',
          'extension.js',
          'smart-research-tracker.js'
        ];
        
        return validPatterns.some(pattern => src.includes(pattern));
      });
      
      if (extensionScripts.length > 0) {
        // Additional validation: check if scripts are actually loaded and functional
        const loadedScripts = extensionScripts.filter(script => {
          try {
            return script.src && !script.src.includes('404') && (script as any).readyState !== 'loading';
          } catch {
            return false;
          }
        });
        
        if (loadedScripts.length > 0) {
          positiveDetections++;
          return { installed: true, accessible: true, details: `Extension scripts detected: ${loadedScripts.length} loaded scripts` };
        }
      }
    } catch (error) {
      console.log('Extension script check failed:', error);
      detectionMethods.push('Script detection (failed)');
    }

    // Method 5: Check localStorage for extension data with validation
    try {
      totalChecks++;
      detectionMethods.push('localStorage');
      
      const extensionKeys = [
        'smart-research-tracker-extension',
        'smart-research-tracker-data',
        'smart-research-tracker-settings',
        'smart-research-tracker-cache'
      ];
      
      for (const key of extensionKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            // Validate that the data is actually from our extension
            const parsed = JSON.parse(data);
            const isValidData = parsed.extensionId === 'smart-research-tracker' ||
                              parsed.source === 'smart-research-tracker-extension' ||
                              parsed.timestamp ||
                              parsed.version;
            
            if (isValidData) {
              positiveDetections++;
              return { installed: true, accessible: true, details: `Extension data found in localStorage: ${key}` };
            }
          } catch {
            // Invalid JSON, continue checking other keys
            continue;
          }
        }
      }
    } catch (error) {
      console.log('Extension localStorage check failed:', error);
      detectionMethods.push('localStorage (failed)');
    }

    // Method 6: Check for extension manifest or specific window properties with validation
    try {
      totalChecks++;
      detectionMethods.push('Window properties');
      
      const extensionProperties = [
        'smartResearchTracker',
        '__SMART_RESEARCH_TRACKER__',
        'smartResearchTrackerExtension',
        'smartResearchTrackerAPI'
      ];
      
      for (const prop of extensionProperties) {
        if ((window as any)[prop]) {
          const value = (window as any)[prop];
          // Validate that the property is actually our extension
          const isValidProperty = typeof value === 'object' && 
                                (value.extensionId === 'smart-research-tracker' ||
                                 value.version ||
                                 value.isValid === true);
          
          if (isValidProperty) {
            positiveDetections++;
            return { installed: true, accessible: true, details: `Extension window properties detected: ${prop}` };
          }
        }
      }
    } catch (error) {
      console.log('Extension window property check failed:', error);
      detectionMethods.push('Window properties (failed)');
    }

    // Method 7: Check if we're in an extension context with validation
    try {
      totalChecks++;
      detectionMethods.push('Extension context');
      
      // On normal web pages this won't be present, but keep as a best-effort signal
      if (typeof window.chrome !== 'undefined' && window.chrome.runtime && window.chrome.runtime.id) {
        positiveDetections++;
        return { installed: true, accessible: true, details: 'Chrome runtime present (likely extension context)' };
      }
    } catch (error) {
      console.log('Extension context check failed:', error);
      detectionMethods.push('Extension context (failed)');
    }

    // Method 8: Check for extension-specific CSS or styles
    try {
      totalChecks++;
      detectionMethods.push('CSS detection');
      
      const styleSheets = Array.from(document.styleSheets);
      const extensionStyles = styleSheets.filter(sheet => {
        try {
          const href = sheet.href || '';
          return href.includes('smart-research-tracker') || 
                 href.includes('extension') ||
                 href.includes('content-script');
        } catch {
          return false;
        }
      });
      
      if (extensionStyles.length > 0) {
        positiveDetections++;
        return { installed: true, accessible: true, details: `Extension styles detected: ${extensionStyles.length} stylesheets` };
      }
    } catch (error) {
      console.log('Extension CSS check failed:', error);
      detectionMethods.push('CSS detection (failed)');
    }

    // Calculate confidence score
    const confidenceScore = totalChecks > 0 ? positiveDetections / totalChecks : 0;
    const isLikelyInstalled = positiveDetections >= 2; // Require at least 2 positive detections
    
    if (isLikelyInstalled) {
      return { 
        installed: true, 
        accessible: true, 
        details: `Extension likely installed (${positiveDetections}/${totalChecks} positive detections, ${Math.round(confidenceScore * 100)}% confidence)` 
      };
    }

    return { 
      installed: false, 
      accessible: false, 
      details: `Extension not detected. Methods tried: ${detectionMethods.join(', ')}. Confidence: ${Math.round(confidenceScore * 100)}%` 
    };
  };

  const openExtensionsPage = () => {
    try {
      // Try to open Chrome extensions page
      if (typeof window.chrome !== 'undefined' && window.chrome.tabs) {
        window.chrome.tabs.create({ url: 'chrome://extensions/' });
      } else {
        // Fallback: open in new window/tab
        const extensionsUrl = getExtensionsUrl();
        window.open(extensionsUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to open extensions page:', error);
      // Fallback: show instructions
      const extensionsUrl = getExtensionsUrl();
      alert(`Please manually open your browser's extensions page:\n\n${extensionsUrl}\n\nOr copy and paste this URL into your browser.`);
    }
  };

  const getExtensionsUrl = (): string => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) {
      return 'chrome://extensions/';
    } else if (userAgent.includes('firefox')) {
      return 'about:addons';
    } else if (userAgent.includes('edge')) {
      return 'edge://extensions/';
    } else if (userAgent.includes('safari')) {
      return 'safari://extensions/';
    } else {
      return 'chrome://extensions/'; // Default fallback
    }
  };

  const getExtensionInstallUrl = () => {
    // Since this is a local development extension, provide instructions instead of a web store link
    return null;
  };

  const testExtensionDetection = async () => {
    console.log('🧪 Testing extension detection with enhanced validation...');
    const startTime = Date.now();
    const result = await checkExtensionStatus();
    const duration = Date.now() - startTime;
    
    console.log('📊 Extension detection result:', result);
    console.log(`⏱️ Detection took ${duration}ms`);
    
    // Enhanced test results with more details
    const confidenceMatch = result.details.match(/Confidence: (\d+)%/);
    const confidence = confidenceMatch ? confidenceMatch[1] : 'Unknown';
    
    const message = `🧪 Extension Detection Test Results:\n\n` +
      `Status: ${result.installed ? '✅ INSTALLED' : '❌ NOT INSTALLED'}\n` +
      `Accessibility: ${result.accessible ? '✅ ACCESSIBLE' : '❌ NOT ACCESSIBLE'}\n` +
      `Confidence: ${confidence}%\n` +
      `Detection Time: ${duration}ms\n\n` +
      `Details:\n${result.details}\n\n` +
      `📋 Full results logged to browser console.\n` +
      `🔍 Check console for detailed detection logs.`;
    
    alert(message);
    return result;
  };

  const runDiagnostics = async () => {
    setLoading(true);
    setAnimateResults(false);
    const diagnosticResults: DiagnosticResult[] = [];

    // 1. Check if extension is installed and accessible
    try {
      console.log('🔍 Starting enhanced extension detection...');
      const extensionStatus = await checkExtensionStatus();
      console.log('📋 Extension status:', extensionStatus);
      
      // Extract confidence score for better status determination
      const confidenceMatch = extensionStatus.details.match(/Confidence: (\d+)%/);
      const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 0;
      
      if (extensionStatus.installed && extensionStatus.accessible) {
        const status = confidence >= 80 ? 'success' : confidence >= 50 ? 'warning' : 'error';
        const message = confidence >= 80 
          ? 'Extension is installed and working correctly'
          : confidence >= 50 
          ? 'Extension detected with moderate confidence'
          : 'Extension detected with low confidence';
        
        diagnosticResults.push({
          name: 'Browser Extension',
          status,
          message,
          details: extensionStatus.details,
          recommendation: confidence < 80 ? 'Consider reloading the extension or checking for conflicts.' : undefined,
          action: confidence < 80 ? {
            label: 'Check Extension',
            onClick: openExtensionsPage
          } : undefined
        });
      } else if (extensionStatus.installed && !extensionStatus.accessible) {
        diagnosticResults.push({
          name: 'Browser Extension',
          status: 'warning',
          message: 'Extension is installed but not accessible',
          details: extensionStatus.details,
          recommendation: 'The extension may be disabled, need to be refreshed, or require additional permissions.',
          action: {
            label: 'Check Extension',
            onClick: openExtensionsPage
          }
        });
      } else {
        // Check if there were any partial detections
        const hasPartialDetection = extensionStatus.details.includes('positive detections') && 
                                   extensionStatus.details.includes('0/');

        // If we are on a Chromium browser but handshake failed, most likely site access isn't granted
        const isChromium = typeof navigator !== 'undefined' && /chrome|edg|brave|opera/i.test(navigator.userAgent);
        const message = hasPartialDetection
          ? 'Extension not properly installed'
          : isChromium
            ? 'Extension not accessible on this site (likely site access not granted)'
            : 'Extension not detected';
        const recommendation = hasPartialDetection
          ? 'Extension was partially detected but not fully functional. Try reloading the extension.'
          : 'If the extension is installed, enable "Allow on all sites" or "On specific sites" for localhost, then refresh the page.';

        diagnosticResults.push({
          name: 'Browser Extension',
          status: hasPartialDetection ? 'warning' : 'warning',
          message,
          details: extensionStatus.details,
          recommendation,
          action: {
            label: 'Open Extensions',
            onClick: () => {
              openExtensionsPage();
              if (!hasPartialDetection) {
                const help = `Enable site access for the extension:

1. Open ${getExtensionsUrl()}
2. Enable "Developer mode" (toggle in top right)
 3. Find "Smart Research Tracker" and click "Details"
 4. Under "Site access", choose "On all sites" (or add http://localhost:5174)
 5. Refresh this page

 If you need help, check the console for detailed detection logs.`;
                alert(help);
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('Extension check failed:', error);
      diagnosticResults.push({
        name: 'Browser Extension',
        status: 'error',
        message: 'Unable to check extension status',
        details: error instanceof Error ? error.message : 'Unknown error',
        recommendation: 'Please check if the extension is installed and enabled in your browser.',
        action: {
          label: 'Check Extension',
          onClick: openExtensionsPage
        }
      });
    }

    // 2. Check API key configuration
    const isApiKeyConfigured = apiKeySetupService.isApiKeyConfigured();
    diagnosticResults.push({
      name: 'API Key Configuration',
      status: isApiKeyConfigured ? 'success' : 'error',
      message: isApiKeyConfigured ? 'API key is configured' : 'API key not found',
      recommendation: isApiKeyConfigured ? undefined : 'Configure your OpenAI API key to enable AI features.',
      action: isApiKeyConfigured ? undefined : {
        label: 'Configure API Key',
        onClick: () => {
          onClose();
        }
      }
    });

    // 3. Test API connectivity
    if (isApiKeyConfigured) {
      try {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (apiKey) {
          const testResult = await apiKeySetupService.testApiKey(apiKey);
          diagnosticResults.push({
            name: 'API Connectivity',
            status: testResult.success ? 'success' : 'error',
            message: testResult.success ? 'API is responding correctly' : testResult.message,
            recommendation: testResult.success ? undefined : 'Check your internet connection and API key validity.',
            action: testResult.success ? undefined : {
              label: 'Test Again',
              onClick: () => runDiagnostics()
            }
          });
        }
      } catch (error) {
        diagnosticResults.push({
          name: 'API Connectivity',
          status: 'error',
          message: 'Failed to test API connectivity',
          recommendation: 'Network issues detected. Check your internet connection.',
          action: {
            label: 'Retry',
            onClick: () => runDiagnostics()
          }
        });
      }
    }

    // 4. Check internet connectivity
    try {
      const response = await fetch('https://httpbin.org/status/200', { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      diagnosticResults.push({
        name: 'Internet Connection',
        status: 'success',
        message: 'Internet connection is working',
      });
    } catch (error) {
      diagnosticResults.push({
        name: 'Internet Connection',
        status: 'error',
        message: 'Unable to reach external services',
        recommendation: 'Check your internet connection and firewall settings.',
        action: {
          label: 'Check Network',
          onClick: () => runDiagnostics()
        }
      });
    }

    // 5. Check browser compatibility
    const isModernBrowser = typeof fetch !== 'undefined' && typeof AbortSignal !== 'undefined';
    diagnosticResults.push({
      name: 'Browser Compatibility',
      status: isModernBrowser ? 'success' : 'warning',
      message: isModernBrowser ? 'Browser supports all features' : 'Some features may not work properly',
      recommendation: isModernBrowser ? undefined : 'Consider updating to a modern browser for the best experience.',
      action: isModernBrowser ? undefined : {
        label: 'Update Browser',
        url: 'https://browsehappy.com/'
      }
    });

    setResults(diagnosticResults);
    setLastChecked(new Date());
    setLoading(false);
    
    // Trigger animation after a short delay
    setTimeout(() => setAnimateResults(true), 100);
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  // Listen for custom event to show diagnostics
  useEffect(() => {
    const handleShowDiagnostics = () => {
      if (!isOpen) {
        onClose(); // Close any existing modal first
        setTimeout(() => {
          // This will trigger the parent to open the diagnostic modal
          window.dispatchEvent(new CustomEvent('openDiagnosticModal'));
        }, 100);
      }
    };

    window.addEventListener('showDiagnostics', handleShowDiagnostics);
    return () => {
      window.removeEventListener('showDiagnostics', handleShowDiagnostics);
    };
  }, [isOpen, onClose]);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800 shadow-sm';
      case 'error':
        return 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-800 shadow-sm';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 text-yellow-800 shadow-sm';
    }
  };

  const hasErrors = results.some(r => r.status === 'error');
  const hasWarnings = results.some(r => r.status === 'warning');
  const allGood = results.length > 0 && !hasErrors && !hasWarnings;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title=""
      maxWidthClass="max-w-3xl w-full mx-4"
    >
      <div className="space-y-8">
        {/* Enhanced Header */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-3xl blur-xl opacity-40 animate-pulse"></div>
              <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl shadow-2xl">
                <div className="text-white">
                  <Settings className="w-10 h-10" />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">System Diagnostics</h2>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
              Comprehensive health check of your Smart Research Tracker setup
            </p>
          </div>
        </div>

        {/* Enhanced Status Summary */}
        {results.length > 0 && (
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 min-w-[300px]">
              <div className="flex items-center justify-center gap-4 mb-4">
                {allGood ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">All Systems Operational</h3>
                      <p className="text-sm text-gray-600">Your setup is working perfectly!</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      hasErrors ? 'bg-gradient-to-r from-red-400 to-rose-500' : 'bg-gradient-to-r from-yellow-400 to-amber-500'
                    }`}>
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {hasErrors ? 'Issues Detected' : 'Warnings Found'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {hasErrors ? `${results.filter(r => r.status === 'error').length} critical issue${results.filter(r => r.status === 'error').length > 1 ? 's' : ''}` : 
                         `${results.filter(r => r.status === 'warning').length} warning${results.filter(r => r.status === 'warning').length > 1 ? 's' : ''}`} need attention
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {lastChecked && (
                <div className="text-center">
                  <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                    Last checked: {lastChecked.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Diagnostic Results */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" style={{ animationDelay: '0.5s' }}></div>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-600 font-medium">Running comprehensive diagnostics...</p>
                  <p className="text-sm text-gray-500">Checking extension, API, network, and browser compatibility</p>
                </div>
              </div>
            </div>
          ) : (
            <div className={`space-y-4 transition-all duration-700 ${animateResults ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-6 rounded-2xl border-2 transition-all duration-500 hover:shadow-lg hover:scale-[1.02] ${getStatusColor(result.status)}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        result.status === 'success' ? 'bg-green-100' : 
                        result.status === 'error' ? 'bg-red-100' : 'bg-yellow-100'
                      }`}>
                        {getStatusIcon(result.status)}
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold">{result.name}</h4>
                        <Badge 
                          variant={result.status === 'success' ? 'success' : result.status === 'error' ? 'danger' : 'warning'}
                          className="text-xs px-3 py-1"
                        >
                          {result.status}
                        </Badge>
                      </div>
                      <p className="text-base leading-relaxed">{result.message}</p>
                      {result.details && (
                        <div className="bg-white/50 rounded-xl p-4 border border-white/20">
                          <p className="text-sm font-medium flex items-start gap-2">
                            <span className="text-lg">📝</span>
                            <span>Details: {result.details}</span>
                          </p>
                        </div>
                      )}
                      {result.recommendation && (
                        <div className="bg-white/50 rounded-xl p-4 border border-white/20">
                          <p className="text-sm font-medium flex items-start gap-2">
                            <span className="text-lg">💡</span>
                            {result.recommendation}
                          </p>
                        </div>
                      )}
                      {result.action && (
                        <div className="pt-2">
                          {result.action.url ? (
                            <a
                              href={result.action.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white text-sm font-medium rounded-xl border border-white/30 hover:shadow-md transition-all duration-200"
                            >
                              {result.action.label}
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : (
                            <button
                              onClick={result.action.onClick}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white text-sm font-medium rounded-xl border border-white/30 hover:shadow-md transition-all duration-200"
                            >
                              {result.action.label}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={runDiagnostics}
              disabled={loading}
              className="flex items-center gap-3 px-6 py-3 rounded-xl hover:shadow-md transition-all duration-200"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Run Diagnostics
            </Button>
            <Button
              variant="outline"
              onClick={testExtensionDetection}
              className="flex items-center gap-2 px-4 py-3 rounded-xl hover:shadow-md transition-all duration-200 border-green-300 text-green-700 hover:bg-green-50"
              title="Test extension detection methods"
            >
              <span className="text-lg">🧪</span>
              Test Extension
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                window.location.href = '/database-tests';
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl hover:shadow-md transition-all duration-200 border-blue-300 text-blue-700 hover:bg-blue-50"
              title="Test database integrity and performance"
            >
              <span className="text-lg">🗄️</span>
              Database Tests
            </Button>
          </div>
          <Button 
            onClick={onClose}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}; 