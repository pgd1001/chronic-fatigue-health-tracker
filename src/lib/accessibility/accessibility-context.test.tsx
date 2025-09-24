import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccessibilityProvider, useAccessibility } from './accessibility-context';
import { renderHook, act } from '@testing-library/react';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Test component to use the hook
function TestComponent() {
  const { preferences, updatePreference, isHighContrast, announceToScreenReader } = useAccessibility();
  
  return (
    <div>
      <span data-testid="high-contrast">{isHighContrast.toString()}</span>
      <span data-testid="fatigue-mode">{preferences.fatigueMode.toString()}</span>
      <button 
        onClick={() => updatePreference('highContrast', !preferences.highContrast)}
        data-testid="toggle-contrast"
      >
        Toggle Contrast
      </button>
      <button 
        onClick={() => announceToScreenReader('Test announcement')}
        data-testid="announce"
      >
        Announce
      </button>
    </div>
  );
}

describe('AccessibilityContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Clear any existing live regions
    const existingLiveRegion = document.getElementById('cf-tracker-live-region');
    if (existingLiveRegion) {
      existingLiveRegion.remove();
    }
  });

  it('provides default accessibility preferences', () => {
    const { result } = renderHook(() => useAccessibility(), {
      wrapper: AccessibilityProvider,
    });

    expect(result.current.preferences.highContrast).toBe(false);
    expect(result.current.preferences.reducedMotion).toBe(false);
    expect(result.current.preferences.fatigueMode).toBe(false);
    expect(result.current.preferences.voiceGuidance).toBe(false);
    expect(result.current.preferences.autoSave).toBe(true);
  });

  it('allows updating preferences', () => {
    const { result } = renderHook(() => useAccessibility(), {
      wrapper: AccessibilityProvider,
    });

    act(() => {
      result.current.updatePreference('highContrast', true);
    });

    expect(result.current.preferences.highContrast).toBe(true);
    expect(result.current.isHighContrast).toBe(true);
  });

  it('saves preferences to localStorage', async () => {
    const { result } = renderHook(() => useAccessibility(), {
      wrapper: AccessibilityProvider,
    });

    act(() => {
      result.current.updatePreference('fatigueMode', true);
    });

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cf-tracker-accessibility-preferences',
        expect.stringContaining('"fatigueMode":true')
      );
    });
  });

  it('loads preferences from localStorage', async () => {
    const savedPreferences = JSON.stringify({
      highContrast: true,
      fatigueMode: true,
    });
    localStorageMock.getItem.mockReturnValue(savedPreferences);

    const { result } = renderHook(() => useAccessibility(), {
      wrapper: AccessibilityProvider,
    });

    // Wait for the effect to run
    await waitFor(() => {
      expect(result.current.preferences.highContrast).toBe(true);
      expect(result.current.preferences.fatigueMode).toBe(true);
    });
  });

  it('resets preferences to defaults', () => {
    const { result } = renderHook(() => useAccessibility(), {
      wrapper: AccessibilityProvider,
    });

    // First set some preferences
    act(() => {
      result.current.updatePreference('highContrast', true);
      result.current.updatePreference('fatigueMode', true);
    });

    expect(result.current.preferences.highContrast).toBe(true);
    expect(result.current.preferences.fatigueMode).toBe(true);

    // Then reset
    act(() => {
      result.current.resetPreferences();
    });

    expect(result.current.preferences.highContrast).toBe(false);
    expect(result.current.preferences.fatigueMode).toBe(false);
  });

  it('applies CSS classes based on preferences', () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    const toggleButton = screen.getByTestId('toggle-contrast');
    fireEvent.click(toggleButton);

    // Check if high-contrast class is applied to document root
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
  });

  it('creates live region for screen reader announcements', () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    const announceButton = screen.getByTestId('announce');
    fireEvent.click(announceButton);

    const liveRegion = document.getElementById('cf-tracker-live-region');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('announces messages to screen readers', async () => {
    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    const announceButton = screen.getByTestId('announce');
    fireEvent.click(announceButton);

    const liveRegion = document.getElementById('cf-tracker-live-region');
    expect(liveRegion?.textContent).toBe('Test announcement');

    // Message should be cleared after delay
    await waitFor(() => {
      expect(liveRegion?.textContent).toBe('');
    }, { timeout: 1500 });
  });

  it('detects system preferences', async () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useAccessibility(), {
      wrapper: AccessibilityProvider,
    });

    // Wait for system preferences to be detected
    await waitFor(() => {
      expect(result.current.preferences.reducedMotion).toBe(true);
    });
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAccessibility());
    }).toThrow('useAccessibility must be used within an AccessibilityProvider');

    consoleSpy.mockRestore();
  });

  it('handles localStorage errors gracefully', async () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useAccessibility(), {
      wrapper: AccessibilityProvider,
    });

    // Wait for the effect to run and handle the error
    await waitFor(() => {
      // Should still provide default preferences
      expect(result.current.preferences.highContrast).toBe(false);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to parse accessibility preferences:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('provides computed accessibility states', async () => {
    // Reset matchMedia to default behavior
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useAccessibility(), {
      wrapper: AccessibilityProvider,
    });

    // Wait for initial state
    await waitFor(() => {
      expect(result.current.isHighContrast).toBe(false);
      expect(result.current.isReducedMotion).toBe(false);
      expect(result.current.isFatigueMode).toBe(false);
    });

    act(() => {
      result.current.updatePreference('highContrast', true);
      result.current.updatePreference('reducedMotion', true);
      result.current.updatePreference('fatigueMode', true);
    });

    expect(result.current.isHighContrast).toBe(true);
    expect(result.current.isReducedMotion).toBe(true);
    expect(result.current.isFatigueMode).toBe(true);
  });
});