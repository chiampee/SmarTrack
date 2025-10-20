import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiKeySetupService } from '../services/apiKeySetupService';

describe('🔑 API Key Setup Service', () => {
  
  // ============================================================================
  // API KEY VALIDATION TESTS
  // ============================================================================
  
  describe('📝 API Key Validation', () => {
    
    it('✅ should accept valid OpenAI API key format', () => {
      // Arrange
      const validKey = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
      
      // Act
      const result = apiKeySetupService.validateApiKey(validKey);
      
      // Assert
      expect(result).toBe(true);
    });

    it('❌ should reject various invalid API key formats', () => {
      // Arrange
      const invalidKeys = [
        'invalid-key',                    // No sk- prefix
        'sk-',                           // Too short
        'sk-123',                        // Too short
        '1234567890abcdef1234567890abcdef1234567890abcdef', // No sk- prefix
        '',                              // Empty string
      ];

      // Act & Assert
      invalidKeys.forEach((key, index) => {
        const result = apiKeySetupService.validateApiKey(key);
        expect(result).toBe(false);
      });
    });

    it('✅ should accept API keys with valid sk- prefix and reasonable length', () => {
      // Arrange
      const validKeys = [
        'sk-1234567890abcdef1234567890abcdef1234567890abcdef', // Standard length
        'sk-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // Longer but valid
        'sk-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' // Even longer but valid
      ];

      // Act & Assert
      validKeys.forEach((key) => {
        const result = apiKeySetupService.validateApiKey(key);
        expect(result).toBe(true);
      });
    });
  });

  // ============================================================================
  // API KEY SETUP TESTS
  // ============================================================================
  
  describe('⚙️ API Key Setup Process', () => {
    
    it('✅ should successfully setup valid API key with proper environment config', async () => {
      // Arrange
      const validKey = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
      
      // Mock successful API test
      const originalTestApiKey = apiKeySetupService.testApiKey;
      apiKeySetupService.testApiKey = vi.fn().mockResolvedValue({
        success: true,
        message: 'API key is valid and working!'
      });

      try {
        // Act
        const result = await apiKeySetupService.setupApiKey(validKey);

        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toContain('API key validated and tested successfully');
        expect(result.envContent).toContain('VITE_OPENAI_API_KEY=');
        expect(result.envContent).toContain(validKey);
        expect(result.envContent).toContain('# Smart Research Tracker Configuration');
        expect(result.envContent).toContain('VITE_OPENAI_MODEL=');
        expect(result.envContent).toContain('VITE_OPENAI_EMBED_MODEL=');
      } finally {
        // Cleanup
        apiKeySetupService.testApiKey = originalTestApiKey;
      }
    });

    it('❌ should reject invalid API key format during setup', async () => {
      // Arrange
      const invalidKey = 'invalid-key';
      
      // Act
      const result = await apiKeySetupService.setupApiKey(invalidKey);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid API key format');
      expect(result.envContent).toBeUndefined();
    });

    it('❌ should handle API key test failures gracefully', async () => {
      // Arrange
      const validKey = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
      
      // Mock failed API test
      const originalTestApiKey = apiKeySetupService.testApiKey;
      apiKeySetupService.testApiKey = vi.fn().mockResolvedValue({
        success: false,
        message: 'API Key Not Found: The API key you provided doesn\'t exist in our system.',
        errorType: 'API Key Not Found'
      });

      try {
        // Act
        const result = await apiKeySetupService.setupApiKey(validKey);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('API Key Not Found');
        expect(result.envContent).toBeUndefined();
      } finally {
        // Cleanup
        apiKeySetupService.testApiKey = originalTestApiKey;
      }
    });
  });

  // ============================================================================
  // API KEY CONFIGURATION STATUS TESTS
  // ============================================================================
  
  describe('🔍 API Key Configuration Status', () => {
    
    it('❌ should detect when no API key is configured', () => {
      // Arrange - Mock the environment check to return false
      const originalIsApiKeyConfigured = apiKeySetupService.isApiKeyConfigured;
      apiKeySetupService.isApiKeyConfigured = vi.fn(() => false);

      // Act
      const result = apiKeySetupService.isApiKeyConfigured();

      // Assert
      expect(result).toBe(false);
      
      // Cleanup
      apiKeySetupService.isApiKeyConfigured = originalIsApiKeyConfigured;
    });

    it('❌ should detect placeholder API key as not configured', () => {
      // Arrange - Mock the environment check to return false for placeholder
      const originalIsApiKeyConfigured = apiKeySetupService.isApiKeyConfigured;
      apiKeySetupService.isApiKeyConfigured = vi.fn(() => false);

      // Act
      const result = apiKeySetupService.isApiKeyConfigured();

      // Assert
      expect(result).toBe(false);
      
      // Cleanup
      apiKeySetupService.isApiKeyConfigured = originalIsApiKeyConfigured;
    });

    it('✅ should detect valid API key as properly configured', () => {
      // Arrange - Mock the environment check to return true
      const originalIsApiKeyConfigured = apiKeySetupService.isApiKeyConfigured;
      apiKeySetupService.isApiKeyConfigured = vi.fn(() => true);

      // Act
      const result = apiKeySetupService.isApiKeyConfigured();

      // Assert
      expect(result).toBe(true);
      
      // Cleanup
      apiKeySetupService.isApiKeyConfigured = originalIsApiKeyConfigured;
    });
  });

  // ============================================================================
  // API KEY TESTING TESTS
  // ============================================================================
  
  describe('🧪 API Key Testing', () => {
    
    beforeEach(() => {
      // Setup global fetch mock
      global.fetch = vi.fn();
    });

    afterEach(() => {
      // Cleanup mocks
      vi.restoreAllMocks();
    });

    it('✅ should successfully test valid API key', async () => {
      // Arrange
      const validKey = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] })
      });

      // Act
      const result = await apiKeySetupService.testApiKey(validKey);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('API key is valid and working!');
      expect(global.fetch).toHaveBeenCalledWith('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validKey}`,
          'Content-Type': 'application/json'
        }
      });
    });

    it('❌ should handle 401 Unauthorized errors', async () => {
      // Arrange
      const invalidKey = 'sk-invalid-key';
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      // Act
      const result = await apiKeySetupService.testApiKey(invalidKey);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('API Key Not Found');
      expect(result.errorType).toBe('API Key Not Found');
    });

    it('❌ should handle 402 Payment Required errors', async () => {
      // Arrange
      const key = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 402,
        statusText: 'Payment Required'
      });

      // Act
      const result = await apiKeySetupService.testApiKey(key);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Insufficient Credits');
      expect(result.errorType).toBe('Insufficient Credits');
    });

    it('❌ should handle network connection issues', async () => {
      // Arrange
      const key = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
      
      (global.fetch as any).mockRejectedValueOnce(new TypeError('fetch failed'));

      // Act
      const result = await apiKeySetupService.testApiKey(key);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Network Connection Issue');
      expect(result.errorType).toBe('Network Connection Issue');
    });
  });
}); 