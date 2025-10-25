/**
 * Panel Diagnostics Utility
 * Helps diagnose issues with the MultiChatPanel functionality
 */

// Type declaration for Chrome extension API (only available in extension context)
declare const chrome: any;

export interface PanelDiagnosticResult {
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

export interface PanelDiagnostics {
  database: PanelDiagnosticResult;
  chatService: PanelDiagnosticResult;
  apiKeys: PanelDiagnosticResult;
  extension: PanelDiagnosticResult;
  links: PanelDiagnosticResult;
  overall: PanelDiagnosticResult;
}

export class PanelDiagnosticsRunner {
  private results: Partial<PanelDiagnostics> = {};

  async runFullDiagnostics(): Promise<PanelDiagnostics> {
    console.log('🔧 Starting panel diagnostics...');
    
    // Run all diagnostic tests
    await Promise.all([
      this.testDatabase(),
      this.testChatService(),
      this.testAPIKeys(),
      this.testExtension(),
      this.testLinks(),
    ]);

    // Determine overall status
    const results = this.results as PanelDiagnostics;
    const hasErrors = Object.values(results).some(r => r.status === 'error');
    const hasWarnings = Object.values(results).some(r => r.status === 'warning');
    
    results.overall = {
      status: hasErrors ? 'error' : hasWarnings ? 'warning' : 'success',
      message: hasErrors 
        ? 'Panel has critical issues that need to be fixed'
        : hasWarnings 
        ? 'Panel has some issues but should work'
        : 'Panel is working correctly',
      details: results
    };

    console.log('🔧 Panel diagnostics completed:', results);
    return results;
  }

  private async testDatabase(): Promise<void> {
    try {
      console.log('🔧 Testing database connection...');
      
      if (!('indexedDB' in window)) {
        this.results.database = {
          status: 'error',
          message: 'IndexedDB not available in this browser',
        };
        return;
      }

      // Try to open the database
      const request = indexedDB.open('SmartResearchDB', 1);
      
      await new Promise<void>((resolve, reject) => {
        request.onsuccess = () => {
          const db = request.result;
          console.log('✅ Database connection successful');
          this.results.database = {
            status: 'success',
            message: `Database connected successfully (${db.name} v${db.version})`,
            details: { name: db.name, version: db.version }
          };
          db.close();
          resolve();
        };
        
        request.onerror = () => {
          console.error('❌ Database connection failed');
          this.results.database = {
            status: 'error',
            message: 'Failed to connect to database',
            details: request.error
          };
          reject(request.error);
        };
        
        request.onupgradeneeded = () => {
          console.log('⚠️ Database upgrade needed');
        };
      });
    } catch (error) {
      this.results.database = {
        status: 'error',
        message: 'Database test failed',
        details: error
      };
    }
  }

  private async testChatService(): Promise<void> {
    try {
      console.log('🔧 Testing chat service...');
      
      // Check if chat service is available
      const { chatService } = await import('../services/chatService');
      
      if (!chatService) {
        this.results.chatService = {
          status: 'error',
          message: 'Chat service not available',
        };
        return;
      }

      // Test basic functionality
      try {
        // Try to start a test conversation
        const testLinkIds = ['test-link-1'];
        const conversation = await chatService.startConversation(testLinkIds);
        
        this.results.chatService = {
          status: 'success',
          message: 'Chat service is working correctly',
          details: { conversationId: conversation.id }
        };
        
        // Clean up test conversation
        try {
          await chatService.endConversation(conversation.id);
        } catch (e) {
          // Ignore cleanup errors
        }
      } catch (error) {
        this.results.chatService = {
          status: 'warning',
          message: 'Chat service has issues but may still work',
          details: error
        };
      }
    } catch (error) {
      this.results.chatService = {
        status: 'error',
        message: 'Chat service test failed',
        details: error
      };
    }
  }

  private async testAPIKeys(): Promise<void> {
    try {
      console.log('🔧 Testing API keys...');
      
      const hasOpenAIKey = !!import.meta.env.VITE_OPENAI_API_KEY;
      const hasMistralKey = !!import.meta.env.VITE_MISTRAL_API_KEY;
      const hasUserKey = !!localStorage.getItem('userApiKey');
      
      if (hasOpenAIKey || hasMistralKey || hasUserKey) {
        this.results.apiKeys = {
          status: 'success',
          message: 'API keys are configured',
          details: { 
            openai: hasOpenAIKey, 
            mistral: hasMistralKey, 
            user: hasUserKey 
          }
        };
      } else {
        this.results.apiKeys = {
          status: 'warning',
          message: 'No API keys found - using free tier',
          details: { 
            openai: hasOpenAIKey, 
            mistral: hasMistralKey, 
            user: hasUserKey 
          }
        };
      }
    } catch (error) {
      this.results.apiKeys = {
        status: 'error',
        message: 'API key test failed',
        details: error
      };
    }
  }

  private async testExtension(): Promise<void> {
    try {
      console.log('🔧 Testing extension communication...');
      
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        try {
          const manifest = chrome.runtime.getManifest();
          this.results.extension = {
            status: 'success',
            message: 'Extension is available',
            details: { name: manifest.name, version: manifest.version }
          };
        } catch (error) {
          this.results.extension = {
            status: 'warning',
            message: 'Extension API available but manifest not accessible',
            details: error
          };
        }
      } else {
        this.results.extension = {
          status: 'warning',
          message: 'Extension not available (running in web mode)',
        };
      }
    } catch (error) {
      this.results.extension = {
        status: 'error',
        message: 'Extension test failed',
        details: error
      };
    }
  }

  private async testLinks(): Promise<void> {
    try {
      console.log('🔧 Testing links availability...');
      
      // Check if link store is available
      const { useLinkStore } = await import('../stores/linkStore');
      const linkStore = useLinkStore.getState();
      
      if (!linkStore) {
        this.results.links = {
          status: 'error',
          message: 'Link store not available',
        };
        return;
      }

      const links = linkStore.rawLinks || [];
      
      if (links.length > 0) {
        this.results.links = {
          status: 'success',
          message: `${links.length} links available`,
          details: { count: links.length, sample: links.slice(0, 3) }
        };
      } else {
        this.results.links = {
          status: 'warning',
          message: 'No links available for chat',
          details: { count: 0 }
        };
      }
    } catch (error) {
      this.results.links = {
        status: 'error',
        message: 'Links test failed',
        details: error
      };
    }
  }

  // Utility method to display results in console
  displayResults(results: PanelDiagnostics): void {
    console.group('🔧 Panel Diagnostics Results');
    
    Object.entries(results).forEach(([key, result]) => {
      const icon = result.status === 'success' ? '✅' : 
                   result.status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${key.toUpperCase()}: ${result.message}`);
      if (result.details) {
        console.log('   Details:', result.details);
      }
    });
    
    console.groupEnd();
  }

  // Utility method to get recommendations
  getRecommendations(results: PanelDiagnostics): string[] {
    const recommendations: string[] = [];
    
    if (results.database.status === 'error') {
      recommendations.push('Fix database connection - check IndexedDB permissions');
    }
    
    if (results.chatService.status === 'error') {
      recommendations.push('Fix chat service - check database and API configuration');
    }
    
    if (results.apiKeys.status === 'warning') {
      recommendations.push('Consider configuring API keys for better performance');
    }
    
    if (results.links.status === 'warning') {
      recommendations.push('Add some research links to test the chat functionality');
    }
    
    if (results.overall.status === 'success') {
      recommendations.push('Panel should be working correctly - try selecting links and starting a chat');
    }
    
    return recommendations;
  }
}

// Export a singleton instance
export const panelDiagnostics = new PanelDiagnosticsRunner();

// Add to window for easy access in console
if (typeof window !== 'undefined') {
  (window as any).panelDiagnostics = panelDiagnostics;
}
