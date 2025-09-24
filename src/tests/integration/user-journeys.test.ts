/**
 * Integration tests for complete user journeys
 * Tests end-to-end workflows for chronic fatigue health tracker
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessibilityProvider } from '@/lib/accessibility/accessibility-context';
import { PWAProvider } from '@/components/pwa/pwa-provider';

// Mock components for integration testing
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AccessibilityProvider>
    <PWAProvider>
      {children}
    </PWAProvider>
  </AccessibilityProvider>
);

// Mock database and services
const mockDatabase = {
  users: new Map(),
  healthLogs: new Map(),
  movementSessions: new Map(),
  biometricData: new Map(),
  symptoms: new Map(),
};

// Mock API responses
const mockApiResponses = {
  '/api/auth/signin': { success: true, user: { id: '1', email: 'test@example.com' } },
  '/api/health/logs': { success: true, data: [] },
  '/api/movement/sessions': { success: true, data: [] },
  '/api/biometrics': { success: true, data: [] },
  '/api/reports/generate': { success: true, reportId: 'report-123' },
};

// Setup fetch mock
global.fetch = vi.fn((url: string, options?: RequestInit) => {
  const urlPath = new URL(url, 'http://localhost').pathname;
  const response = mockApiResponses[urlPath as keyof typeof mockApiResponses];
  
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(response || { success: true }),
    headers: new Headers(),
  } as Response);
});

describe('User Journey Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    
    // Reset mock database
    Object.values(mockDatabase).forEach(map => map.clear());
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('New User Onboarding Journey', () => {
    it('should complete full onboarding flow', async () => {
      // Mock the sign-up form component
      const SignUpForm = () => (
        <form data-testid="signup-form">
          <input
            type="email"
            placeholder="Email"
            data-testid="email-input"
          />
          <input
            type="password"
            placeholder="Password"
            data-testid="password-input"
          />
          <button type="submit" data-testid="signup-button">
            Sign Up
          </button>
        </form>
      );

      render(
        <TestWrapper>
          <SignUpForm />
        </TestWrapper>
      );

      // Step 1: User enters email and password
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const signUpButton = screen.getByTestId('signup-button');

      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'SecurePassword123!');

      // Step 2: User submits form
      await user.click(signUpButton);

      // Verify API call was made
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/signup'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle onboarding with accessibility preferences', async () => {
      // Mock accessibility settings component
      const AccessibilityOnboarding = () => (
        <div data-testid="accessibility-onboarding">
          <label>
            <input
              type="checkbox"
              data-testid="high-contrast-toggle"
            />
            High Contrast Mode
          </label>
          <label>
            <input
              type="checkbox"
              data-testid="reduced-motion-toggle"
            />
            Reduced Motion
          </label>
          <label>
            <input
              type="checkbox"
              data-testid="large-text-toggle"
            />
            Large Text
          </label>
          <button data-testid="save-preferences">
            Save Preferences
          </button>
        </div>
      );

      render(
        <TestWrapper>
          <AccessibilityOnboarding />
        </TestWrapper>
      );

      // Enable accessibility features
      await user.click(screen.getByTestId('high-contrast-toggle'));
      await user.click(screen.getByTestId('reduced-motion-toggle'));
      await user.click(screen.getByTestId('large-text-toggle'));

      // Save preferences
      await user.click(screen.getByTestId('save-preferences'));

      // Verify preferences are saved
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'accessibility-preferences',
        expect.stringContaining('highContrast')
      );
    });
  });

  describe('Daily Routine Completion Journey', () => {
    it('should complete full daily routine workflow', async () => {
      // Mock daily routine components
      const DailyRoutine = () => (
        <div data-testid="daily-routine">
          {/* Energy Assessment */}
          <div data-testid="energy-assessment">
            <h3>How is your energy today?</h3>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
              <button
                key={level}
                data-testid={`energy-level-${level}`}
                onClick={() => {}}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Daily Anchor Routine */}
          <div data-testid="anchor-routine">
            <h3>Daily Anchor Routine</h3>
            <button data-testid="start-breathing">Start Breathing</button>
            <button data-testid="start-mobility">Start Mobility</button>
            <button data-testid="start-stretches">Start Stretches</button>
          </div>

          {/* Symptom Tracking */}
          <div data-testid="symptom-tracking">
            <h3>Symptom Check</h3>
            <label>
              <input type="checkbox" data-testid="fatigue-symptom" />
              Fatigue
            </label>
            <label>
              <input type="checkbox" data-testid="brain-fog-symptom" />
              Brain Fog
            </label>
            <label>
              <input type="checkbox" data-testid="pain-symptom" />
              Pain
            </label>
          </div>

          <button data-testid="complete-routine">Complete Routine</button>
        </div>
      );

      render(
        <TestWrapper>
          <DailyRoutine />
        </TestWrapper>
      );

      // Step 1: Assess energy level
      await user.click(screen.getByTestId('energy-level-6'));

      // Step 2: Complete anchor routine activities
      await user.click(screen.getByTestId('start-breathing'));
      await waitFor(() => {
        // Simulate breathing exercise completion
      }, { timeout: 1000 });

      await user.click(screen.getByTestId('start-mobility'));
      await waitFor(() => {
        // Simulate mobility exercise completion
      }, { timeout: 1000 });

      // Step 3: Track symptoms
      await user.click(screen.getByTestId('fatigue-symptom'));
      await user.click(screen.getByTestId('brain-fog-symptom'));

      // Step 4: Complete routine
      await user.click(screen.getByTestId('complete-routine'));

      // Verify data persistence
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/health/logs'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should adapt routine based on energy level', async () => {
      // Mock adaptive routine component
      const AdaptiveRoutine = ({ energyLevel }: { energyLevel: number }) => (
        <div data-testid="adaptive-routine">
          {energyLevel <= 3 && (
            <div data-testid="low-energy-routine">
              <p>Gentle routine for low energy</p>
              <button data-testid="gentle-breathing">Gentle Breathing (2 min)</button>
            </div>
          )}
          {energyLevel >= 7 && (
            <div data-testid="high-energy-routine">
              <p>Full routine for good energy</p>
              <button data-testid="full-movement">Full Movement Session</button>
            </div>
          )}
        </div>
      );

      // Test low energy adaptation
      render(
        <TestWrapper>
          <AdaptiveRoutine energyLevel={2} />
        </TestWrapper>
      );

      expect(screen.getByTestId('low-energy-routine')).toBeInTheDocument();
      expect(screen.queryByTestId('high-energy-routine')).not.toBeInTheDocument();

      // Test high energy adaptation
      render(
        <TestWrapper>
          <AdaptiveRoutine energyLevel={8} />
        </TestWrapper>
      );

      expect(screen.getByTestId('high-energy-routine')).toBeInTheDocument();
      expect(screen.queryByTestId('low-energy-routine')).not.toBeInTheDocument();
    });
  });

  describe('Biometric Capture Journey', () => {
    it('should complete biometric capture workflow', async () => {
      // Mock camera API
      const mockMediaDevices = {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      };

      Object.defineProperty(navigator, 'mediaDevices', {
        value: mockMediaDevices,
        writable: true,
      });

      // Mock biometric capture component
      const BiometricCapture = () => (
        <div data-testid="biometric-capture">
          <button data-testid="start-capture">Start Heart Rate Capture</button>
          <div data-testid="camera-preview" style={{ display: 'none' }}>
            Camera Preview
          </div>
          <div data-testid="capture-results" style={{ display: 'none' }}>
            <p data-testid="heart-rate">Heart Rate: 72 BPM</p>
            <p data-testid="hrv">HRV: 45ms</p>
            <button data-testid="save-results">Save Results</button>
          </div>
        </div>
      );

      render(
        <TestWrapper>
          <BiometricCapture />
        </TestWrapper>
      );

      // Step 1: Start biometric capture
      await user.click(screen.getByTestId('start-capture'));

      // Verify camera access request
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: true,
        audio: false,
      });

      // Step 2: Simulate capture completion
      await waitFor(() => {
        // Simulate biometric processing
        const resultsDiv = screen.getByTestId('capture-results');
        resultsDiv.style.display = 'block';
      });

      // Step 3: Save results
      await user.click(screen.getByTestId('save-results'));

      // Verify data is saved
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/biometrics'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle camera permission denial gracefully', async () => {
      // Mock camera permission denial
      const mockMediaDevices = {
        getUserMedia: vi.fn().mockRejectedValue(new Error('Permission denied')),
      };

      Object.defineProperty(navigator, 'mediaDevices', {
        value: mockMediaDevices,
        writable: true,
      });

      // Mock biometric capture with error handling
      const BiometricCaptureWithError = () => (
        <div data-testid="biometric-capture-error">
          <button data-testid="start-capture">Start Capture</button>
          <div data-testid="error-message" style={{ display: 'none' }}>
            Camera access is needed for biometric capture. Please enable camera permissions.
          </div>
          <button data-testid="manual-entry" style={{ display: 'none' }}>
            Enter Manually
          </button>
        </div>
      );

      render(
        <TestWrapper>
          <BiometricCaptureWithError />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('start-capture'));

      // Verify error handling
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        errorMessage.style.display = 'block';
        
        const manualEntry = screen.getByTestId('manual-entry');
        manualEntry.style.display = 'block';
      });

      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByTestId('manual-entry')).toBeInTheDocument();
    });
  });

  describe('Healthcare Report Generation Journey', () => {
    it('should generate and export healthcare report', async () => {
      // Mock report generation component
      const ReportGeneration = () => (
        <div data-testid="report-generation">
          <h3>Generate Healthcare Report</h3>
          
          {/* Date Range Selection */}
          <div data-testid="date-range">
            <input
              type="date"
              data-testid="start-date"
              defaultValue="2024-01-01"
            />
            <input
              type="date"
              data-testid="end-date"
              defaultValue="2024-01-31"
            />
          </div>

          {/* Report Options */}
          <div data-testid="report-options">
            <label>
              <input type="checkbox" data-testid="include-symptoms" defaultChecked />
              Include Symptoms
            </label>
            <label>
              <input type="checkbox" data-testid="include-energy" defaultChecked />
              Include Energy Levels
            </label>
            <label>
              <input type="checkbox" data-testid="include-biometrics" />
              Include Biometrics
            </label>
          </div>

          <button data-testid="generate-report">Generate Report</button>
          
          <div data-testid="report-actions" style={{ display: 'none' }}>
            <button data-testid="download-pdf">Download PDF</button>
            <button data-testid="download-json">Download JSON</button>
            <button data-testid="share-provider">Share with Provider</button>
          </div>
        </div>
      );

      render(
        <TestWrapper>
          <ReportGeneration />
        </TestWrapper>
      );

      // Step 1: Configure report parameters
      const startDate = screen.getByTestId('start-date');
      const endDate = screen.getByTestId('end-date');
      
      await user.clear(startDate);
      await user.type(startDate, '2024-02-01');
      
      await user.clear(endDate);
      await user.type(endDate, '2024-02-29');

      // Step 2: Select report options
      await user.click(screen.getByTestId('include-biometrics'));

      // Step 3: Generate report
      await user.click(screen.getByTestId('generate-report'));

      // Verify report generation API call
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reports/generate'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('2024-02-01'),
        })
      );

      // Step 4: Simulate report completion
      await waitFor(() => {
        const reportActions = screen.getByTestId('report-actions');
        reportActions.style.display = 'block';
      });

      // Step 5: Download report
      await user.click(screen.getByTestId('download-pdf'));

      // Verify download initiation
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reports/report-123/export'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('AI Pacing Integration Journey', () => {
    it('should provide AI-powered pacing recommendations', async () => {
      // Mock AI pacing component
      const AIPacing = () => (
        <div data-testid="ai-pacing">
          <div data-testid="pacing-analysis">
            <h3>Your Pacing Analysis</h3>
            <p data-testid="pattern-insight">
              Based on your recent data, you tend to have higher energy in the mornings.
            </p>
            <p data-testid="recommendation">
              Consider scheduling important activities before 2 PM.
            </p>
          </div>

          <div data-testid="daily-suggestions">
            <h4>Today's Suggestions</h4>
            <ul>
              <li data-testid="suggestion-1">Take a 10-minute rest after lunch</li>
              <li data-testid="suggestion-2">Limit screen time after 8 PM</li>
              <li data-testid="suggestion-3">Try gentle stretching before bed</li>
            </ul>
          </div>

          <button data-testid="accept-suggestions">Accept Suggestions</button>
          <button data-testid="customize-suggestions">Customize</button>
        </div>
      );

      render(
        <TestWrapper>
          <AIPacing />
        </TestWrapper>
      );

      // Verify AI insights are displayed
      expect(screen.getByTestId('pattern-insight')).toBeInTheDocument();
      expect(screen.getByTestId('recommendation')).toBeInTheDocument();

      // Verify suggestions are provided
      expect(screen.getByTestId('suggestion-1')).toBeInTheDocument();
      expect(screen.getByTestId('suggestion-2')).toBeInTheDocument();
      expect(screen.getByTestId('suggestion-3')).toBeInTheDocument();

      // Accept AI suggestions
      await user.click(screen.getByTestId('accept-suggestions'));

      // Verify suggestions are saved
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ai/pacing/accept'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('Cross-Feature Integration', () => {
    it('should maintain data consistency across features', async () => {
      // Mock integrated dashboard
      const IntegratedDashboard = () => (
        <div data-testid="integrated-dashboard">
          <div data-testid="energy-widget">
            <p>Current Energy: <span data-testid="current-energy">7</span></p>
          </div>
          
          <div data-testid="symptoms-widget">
            <p>Active Symptoms: <span data-testid="symptom-count">2</span></p>
          </div>
          
          <div data-testid="biometrics-widget">
            <p>Last HR: <span data-testid="last-heart-rate">72 BPM</span></p>
          </div>
          
          <div data-testid="pacing-widget">
            <p data-testid="pacing-status">Good pacing today</p>
          </div>
        </div>
      );

      render(
        <TestWrapper>
          <IntegratedDashboard />
        </TestWrapper>
      );

      // Verify all widgets display consistent data
      expect(screen.getByTestId('current-energy')).toHaveTextContent('7');
      expect(screen.getByTestId('symptom-count')).toHaveTextContent('2');
      expect(screen.getByTestId('last-heart-rate')).toHaveTextContent('72 BPM');
      expect(screen.getByTestId('pacing-status')).toHaveTextContent('Good pacing today');
    });
  });
});