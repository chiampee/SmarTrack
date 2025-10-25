export const apiKeySetupService = {
  /**
   * Validates an OpenAI API key format
   */
  validateApiKey(apiKey: string): boolean {
    // OpenAI API keys start with 'sk-' and are typically 51 characters long
    // But some newer keys might have different lengths, so we'll be more flexible
    return (
      apiKey.startsWith('sk-') && apiKey.length >= 20 && apiKey.length <= 100
    );
  },

  /**
   * Tests the API key by making a real API call to OpenAI
   */
  async testApiKey(
    apiKey: string
  ): Promise<{ success: boolean; message: string; errorType?: string }> {
    try {
      // Make a simple API call to test the key
      // Use a lightweight, cache-busting request and allow failure without crashing UI
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return {
          success: true,
          message: 'API key is valid and working!',
        };
      } else {
        // Handle different error types based on status code
        switch (response.status) {
          case 401:
            return {
              success: false,
              message:
                "API Key Not Found: The API key you provided doesn't exist in our system.",
              errorType: 'API Key Not Found',
            };
          case 402:
            return {
              success: false,
              message:
                "Insufficient Credits: Your OpenAI account doesn't have enough credits for API calls.",
              errorType: 'Insufficient Credits',
            };
          case 429:
            return {
              success: false,
              message:
                "Rate Limit Exceeded: You've made too many API requests in a short time period.",
              errorType: 'Rate Limit Exceeded',
            };
          case 403:
            return {
              success: false,
              message:
                "Access Denied: Your API key doesn't have the required permissions.",
              errorType: 'Model Access Restricted',
            };
          default:
            return {
              success: false,
              message: `API Error (${response.status}): ${response.statusText}`,
              errorType: 'Network Connection Issue',
            };
        }
      }
    } catch (error) {
      // Handle network/CORS errors gracefully
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          success: false,
          message: 'Network timeout: Unable to reach OpenAI. Try again later.',
          errorType: 'Network Connection Issue',
        };
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          message:
            'Network Connection Issue: Network/CORS Issue: Your browser blocked the test request. You can still paste your API key; features may work in production.',
          errorType: 'Network Connection Issue',
        };
      }

      return {
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorType: 'Network Connection Issue',
      };
    }
  },

  /**
   * Creates or updates the .env.local file with the provided API key
   */
  async setupApiKey(
    apiKey: string
  ): Promise<{ success: boolean; message: string; envContent?: string }> {
    try {
      // First validate the API key format
      if (!this.validateApiKey(apiKey)) {
        return {
          success: false,
          message:
            'Invalid API key format. OpenAI API keys should start with "sk-" and be at least 20 characters long.',
        };
      }

      // Then test the API key to ensure it works
      const testResult = await this.testApiKey(apiKey);
      if (!testResult.success) {
        return {
          success: false,
          message: testResult.message,
        };
      }

      // Create the .env.local content
      const envContent = `# Smart Research Tracker Configuration
# Generated automatically during setup

# OpenAI API Configuration
VITE_OPENAI_API_KEY=${apiKey}

# Optional: Customize AI behavior
VITE_OPENAI_MODEL=gpt-4o
VITE_OPENAI_EMBED_MODEL=text-embedding-3-large

# Optional: Custom settings
VITE_MAX_SUMMARY_LENGTH=500
VITE_ENABLE_ANALYTICS=false
`;

      // In a browser environment, we can't directly write files
      // Instead, we'll provide the content for download and instructions
      return {
        success: true,
        message:
          'API key validated and tested successfully! Please follow the instructions below to complete setup.',
        envContent,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to setup API key: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },

  /**
   * Downloads the .env.local file content
   */
  downloadEnvFile(content: string): void {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env.local';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Checks if the API key is already configured
   */
  isApiKeyConfigured(): boolean {
    return (
      !!import.meta.env.VITE_OPENAI_API_KEY &&
      import.meta.env.VITE_OPENAI_API_KEY !== 'sk-your-key-here' &&
      import.meta.env.VITE_OPENAI_API_KEY.length > 0
    );
  },
};
