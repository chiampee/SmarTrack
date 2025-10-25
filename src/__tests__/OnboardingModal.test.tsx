import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnboardingModal } from '../components/OnboardingModal';

// Mock the API key setup service
vi.mock('../services/apiKeySetupService', () => ({
  apiKeySetupService: {
    isApiKeyConfigured: vi.fn(() => false),
    setupApiKey: vi.fn(),
    downloadEnvFile: vi.fn(),
  },
}));

describe('🎯 Onboarding Modal', () => {
  
  // ============================================================================
  // TEST SETUP
  // ============================================================================
  
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  // ============================================================================
  // BASIC RENDERING TESTS
  // ============================================================================
  
  describe('📱 Basic Rendering', () => {
    
    it('✅ should render the modal when open', () => {
      // Act
      render(<OnboardingModal {...defaultProps} />);
      
      // Assert
      expect(screen.getByText('Welcome to Smart Research Tracker')).toBeInTheDocument();
    });

    it('✅ should display the welcome message and description', () => {
      // Act
      render(<OnboardingModal {...defaultProps} />);
      
      // Assert
      expect(screen.getByText('Your AI-powered research companion')).toBeInTheDocument();
    });

    it('✅ should show the modal dialog', () => {
      // Act
      render(<OnboardingModal {...defaultProps} />);
      
      // Assert
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });
}); 