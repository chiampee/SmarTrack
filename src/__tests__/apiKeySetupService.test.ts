import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiKeySetupService } from '../services/apiKeySetupService';

describe('apiKeySetupService', () => {
  describe('validateApiKey', () => {
    it('should validate correct OpenAI API key format', () => {
      const validKey = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(apiKeySetupService.validateApiKey(validKey)).toBe(true);
    });

    it('should reject invalid API key format', () => {
      const invalidKeys = [
        'invalid-key',
        'sk-',
        'sk-123',
        '1234567890abcdef1234567890abcdef1234567890abcdef',
        '',
        'sk-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      ];

      invalidKeys.forEach(key => {
        expect(apiKeySetupService.validateApiKey(key)).toBe(false);
      });
    });
  });

  describe('setupApiKey', () => {
    it('should return success for valid API key', async () => {
      const validKey = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
      
      // Mock the testApiKey function to return success
      const originalTestApiKey = apiKeySetupService.testApiKey;
      apiKeySetupService.testApiKey = vi.fn().mockResolvedValue({
        success: true,
        message: 'API key is valid and working!'
      });

      const result = await apiKeySetupService.setupApiKey(validKey);

      expect(result.success).toBe(true);
      expect(result.message).toContain('API key validated and tested successfully');
      expect(result.envContent).toContain('VITE_OPENAI_API_KEY=');
      expect(result.envContent).toContain(validKey);

      // Restore original function
      apiKeySetupService.testApiKey = originalTestApiKey;
    });

    it('should return error for invalid API key format', async () => {
      const invalidKey = 'invalid-key';
      const result = await apiKeySetupService.setupApiKey(invalidKey);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid API key format');
      expect(result.envContent).toBeUndefined();
    });

    it('should return error when API key test fails', async () => {
      const validKey = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
      
      // Mock the testApiKey function to return failure
      const originalTestApiKey = apiKeySetupService.testApiKey;
      apiKeySetupService.testApiKey = vi.fn().mockResolvedValue({
        success: false,
        message: 'API Key Not Found: The API key you provided doesn\'t exist in our system.',
        errorType: 'API Key Not Found'
      });

      const result = await apiKeySetupService.setupApiKey(validKey);

      expect(result.success).toBe(false);
      expect(result.message).toContain('API Key Not Found');
      expect(result.envContent).toBeUndefined();

      // Restore original function
      apiKeySetupService.testApiKey = originalTestApiKey;
    });

    it('should include proper environment configuration', async () => {
      const validKey = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = await apiKeySetupService.setupApiKey(validKey);

      expect(result.envContent).toContain('# Smart Research Tracker Configuration');
      expect(result.envContent).toContain('VITE_OPENAI_API_KEY=');
      expect(result.envContent).toContain('VITE_OPENAI_MODEL=');
      expect(result.envContent).toContain('VITE_OPENAI_EMBED_MODEL=');
    });
  });

  describe('isApiKeyConfigured', () => {
    it('should return false when no API key is set', () => {
      // Mock environment variables
      const originalEnv = import.meta.env;
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, VITE_OPENAI_API_KEY: undefined },
        writable: true
      });

      expect(apiKeySetupService.isApiKeyConfigured()).toBe(false);
    });

    it('should return false for placeholder API key', () => {
      // Mock environment variables
      const originalEnv = import.meta.env;
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, VITE_OPENAI_API_KEY: 'sk-your-key-here' },
        writable: true
      });

      expect(apiKeySetupService.isApiKeyConfigured()).toBe(false);
    });

    it('should return true for valid API key', () => {
      // Mock environment variables
      const originalEnv = import.meta.env;
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, VITE_OPENAI_API_KEY: 'sk-1234567890abcdef1234567890abcdef1234567890abcdef' },
        writable: true
      });

      expect(apiKeySetupService.isApiKeyConfigured()).toBe(true);
    });
  });

  describe('testApiKey', () => {
    beforeEach(() => {
      // Mock fetch globally
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return success for valid API key', async () => {
      const validKey = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] })
      });

      const result = await apiKeySetupService.testApiKey(validKey);

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

    it('should return error for 401 status', async () => {
      const invalidKey = 'sk-invalid-key';
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      const result = await apiKeySetupService.testApiKey(invalidKey);

      expect(result.success).toBe(false);
      expect(result.message).toContain('API Key Not Found');
      expect(result.errorType).toBe('API Key Not Found');
    });

    it('should return error for 402 status', async () => {
      const key = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 402,
        statusText: 'Payment Required'
      });

      const result = await apiKeySetupService.testApiKey(key);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Insufficient Credits');
      expect(result.errorType).toBe('Insufficient Credits');
    });

    it('should return error for network issues', async () => {
      const key = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
      
      (global.fetch as any).mockRejectedValueOnce(new TypeError('fetch failed'));

      const result = await apiKeySetupService.testApiKey(key);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Network Connection Issue');
      expect(result.errorType).toBe('Network Connection Issue');
    });
  });
}); 