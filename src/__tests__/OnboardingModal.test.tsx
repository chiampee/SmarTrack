import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingModal } from '../components/OnboardingModal';

// Mock the API key setup service
vi.mock('../services/apiKeySetupService', () => ({
  apiKeySetupService: {
    isApiKeyConfigured: vi.fn(() => false),
    setupApiKey: vi.fn(),
    downloadEnvFile: vi.fn(),
  },
}));

describe('OnboardingModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  it('should render the modal when open', () => {
    render(<OnboardingModal {...defaultProps} />);
    expect(screen.getByText('Welcome to Smart Research Tracker')).toBeInTheDocument();
  });

  it('should show manual setup section when expanded', () => {
    render(<OnboardingModal {...defaultProps} />);
    
    // Navigate to the AI setup step (step 2)
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // Find and click the manual setup toggle
    const manualSetupButton = screen.getByText('Manual Setup');
    fireEvent.click(manualSetupButton);
    
    // Check that the detailed instructions are now visible
    expect(screen.getByText('Follow these steps if you prefer to set up the configuration manually:')).toBeInTheDocument();
    expect(screen.getByText('Complete .env.local Example')).toBeInTheDocument();
  });

  it('should hide manual setup section when collapsed', () => {
    render(<OnboardingModal {...defaultProps} />);
    
    // Navigate to the AI setup step
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // Initially, the detailed instructions should not be visible
    expect(screen.queryByText('Follow these steps if you prefer to set up the configuration manually:')).not.toBeInTheDocument();
    
    // Expand the manual setup
    const manualSetupButton = screen.getByText('Manual Setup');
    fireEvent.click(manualSetupButton);
    
    // Collapse it again
    fireEvent.click(manualSetupButton);
    
    // The detailed instructions should be hidden again
    expect(screen.queryByText('Follow these steps if you prefer to set up the configuration manually:')).not.toBeInTheDocument();
  });

  it('should show API key input field when API key is not configured', () => {
    render(<OnboardingModal {...defaultProps} />);
    
    // Navigate to the AI setup step
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // Check that the API key input is visible
    expect(screen.getByPlaceholderText('sk-your-api-key-here')).toBeInTheDocument();
    expect(screen.getByText('Setup')).toBeInTheDocument();
  });
}); 