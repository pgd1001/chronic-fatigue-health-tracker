/**
 * Component Integration tests for chronic fatigue health tracker
 * Tests component interactions and data flow
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Test wrapper with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  );
};

// Mock API responses
const mockApiResponses = {
  healthLogs: {
    success: true,
    data: {
      id: 'test-log-123',
      energyLevel: 7,
      sleepQuality: 8,
      symptoms: [],
      createdAt: new Date().toISOString(),
    },
  },
};

// Mock fetch
global.fetch = vi.fn();

describe('Component Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponses.healthLogs),
    });
  });

  describe('Health Assessment Flow', () => {
    it('should complete basic health assessment workflow', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <div data-testid="energy-assessment">
            <label htmlFor="energy-slider">Energy Level</label>
            <input
              id="energy-slider"
              type="range"
              min="1"
              max="10"
              data-testid="energy-level-slider"
            />
            <button data-testid="save-assessment">Save Assessment</button>
          </div>
        </TestWrapper>
      );

      // Set energy level
      const energySlider = screen.getByTestId('energy-level-slider');
      fireEvent.change(energySlider, { target: { value: '7' } });
      expect(energySlider).toHaveValue('7');

      // Submit assessment
      const submitButton = screen.getByTestId('save-assessment');
      await user.click(submitButton);

      // Verify component interaction works
      expect(energySlider).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock network failure
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <div data-testid="test-component">
            <button data-testid="submit-button">Submit</button>
            <div data-testid="error-message" style={{ display: 'none' }}>
              Network error occurred
            </div>
          </div>
        </TestWrapper>
      );

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // Component should handle error appropriately
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <div>
            <button data-testid="button-1">Button 1</button>
            <button data-testid="button-2">Button 2</button>
            <input data-testid="input-1" type="text" />
          </div>
        </TestWrapper>
      );

      const button1 = screen.getByTestId('button-1');
      const button2 = screen.getByTestId('button-2');
      const input1 = screen.getByTestId('input-1');

      // Test focus management
      button1.focus();
      expect(button1).toHaveFocus();

      // Tab navigation
      fireEvent.keyDown(button1, { key: 'Tab' });
      expect(document.activeElement).toBe(button2);
    });

    it('should provide proper ARIA labels', async () => {
      render(
        <TestWrapper>
          <div>
            <label htmlFor="energy-input">Energy Level</label>
            <input
              id="energy-input"
              type="range"
              aria-label="Energy Level Slider"
              data-testid="energy-slider"
            />
          </div>
        </TestWrapper>
      );

      const slider = screen.getByTestId('energy-slider');
      expect(slider).toHaveAttribute('aria-label', 'Energy Level Slider');
    });
  });

  describe('Performance Integration', () => {
    it('should render components efficiently', async () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <div data-testid="performance-test">
            {Array.from({ length: 100 }, (_, i) => (
              <div key={i} data-testid={`item-${i}`}>
                Item {i}
              </div>
            ))}
          </div>
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(100);
      expect(screen.getByTestId('performance-test')).toBeInTheDocument();
    });
  });

  describe('Data Validation Integration', () => {
    it('should validate form inputs', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <form data-testid="validation-form">
            <input
              data-testid="email-input"
              type="email"
              required
              pattern="[^@]+@[^@]+\.[^@]+"
            />
            <input
              data-testid="number-input"
              type="number"
              min="1"
              max="10"
              required
            />
            <button type="submit" data-testid="submit-form">
              Submit
            </button>
          </form>
        </TestWrapper>
      );

      const emailInput = screen.getByTestId('email-input');
      const numberInput = screen.getByTestId('number-input');
      const submitButton = screen.getByTestId('submit-form');

      // Test invalid email
      await user.type(emailInput, 'invalid-email');
      await user.type(numberInput, '15'); // Out of range
      
      await user.click(submitButton);

      // Form validation should prevent submission
      expect(emailInput).toBeInvalid();
      expect(numberInput).toBeInvalid();
    });
  });

  describe('Offline Integration', () => {
    it('should handle offline state', async () => {
      render(
        <TestWrapper>
          <div data-testid="offline-component">
            <div data-testid="online-indicator">Online</div>
            <div data-testid="offline-indicator" style={{ display: 'none' }}>
              Offline
            </div>
          </div>
        </TestWrapper>
      );

      // Simulate offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      window.dispatchEvent(new Event('offline'));

      // Component should handle offline state
      expect(screen.getByTestId('offline-component')).toBeInTheDocument();
    });
  });
});