import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccessibilitySettings } from './accessibility-settings';
import { AccessibilityProvider } from '@/lib/accessibility/accessibility-context';

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

function renderWithProvider(component: React.ReactElement) {
  return render(
    <AccessibilityProvider>
      {component}
    </AccessibilityProvider>
  );
}

describe('AccessibilitySettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders accessibility settings page', () => {
    renderWithProvider(<AccessibilitySettings />);
    
    expect(screen.getByText('Accessibility Settings')).toBeInTheDocument();
    expect(screen.getByText(/customize your experience/i)).toBeInTheDocument();
  });

  it('displays all accessibility preference sections', () => {
    renderWithProvider(<AccessibilitySettings />);
    
    expect(screen.getByText('Visual Preferences')).toBeInTheDocument();
    expect(screen.getByText('Interaction Preferences')).toBeInTheDocument();
    expect(screen.getByText('Audio & Voice Guidance')).toBeInTheDocument();
    expect(screen.getByText('Chronic Illness Support')).toBeInTheDocument();
  });

  it('allows toggling high contrast mode', async () => {
    renderWithProvider(<AccessibilitySettings />);
    
    const highContrastSwitch = screen.getByRole('switch', { name: /high contrast mode/i });
    expect(highContrastSwitch).not.toBeChecked();
    
    fireEvent.click(highContrastSwitch);
    
    await waitFor(() => {
      expect(highContrastSwitch).toBeChecked();
    });
  });

  it('allows toggling fatigue mode', async () => {
    renderWithProvider(<AccessibilitySettings />);
    
    const fatigueModeSwitch = screen.getByRole('switch', { name: /fatigue mode/i });
    expect(fatigueModeSwitch).not.toBeChecked();
    
    fireEvent.click(fatigueModeSwitch);
    
    await waitFor(() => {
      expect(fatigueModeSwitch).toBeChecked();
    });
  });

  it('allows toggling voice guidance', async () => {
    renderWithProvider(<AccessibilitySettings />);
    
    const voiceGuidanceSwitch = screen.getByRole('switch', { name: /voice guidance/i });
    expect(voiceGuidanceSwitch).not.toBeChecked();
    
    fireEvent.click(voiceGuidanceSwitch);
    
    await waitFor(() => {
      expect(voiceGuidanceSwitch).toBeChecked();
    });
  });

  it('shows WCAG compliance badges', () => {
    renderWithProvider(<AccessibilitySettings />);
    
    expect(screen.getByText('WCAG AAA')).toBeInTheDocument();
    expect(screen.getByText('Motor Friendly')).toBeInTheDocument();
    expect(screen.getByText('ME/CFS Optimized')).toBeInTheDocument();
  });

  it('provides fatigue mode quick setup', async () => {
    renderWithProvider(<AccessibilitySettings />);
    
    const fatigueModeButton = screen.getByRole('button', { name: /fatigue mode/i });
    fireEvent.click(fatigueModeButton);
    
    await waitFor(() => {
      const fatigueModeSwitch = screen.getByRole('switch', { name: /fatigue mode/i });
      const largeTouchSwitch = screen.getByRole('switch', { name: /large touch targets/i });
      const autoSaveSwitch = screen.getByRole('switch', { name: /automatic saving/i });
      const cognitiveSwitch = screen.getByRole('switch', { name: /cognitive support/i });
      
      expect(fatigueModeSwitch).toBeChecked();
      expect(largeTouchSwitch).toBeChecked();
      expect(autoSaveSwitch).toBeChecked();
      expect(cognitiveSwitch).toBeChecked();
    });
  });

  it('allows resetting all preferences', async () => {
    renderWithProvider(<AccessibilitySettings />);
    
    // First enable some preferences
    const highContrastSwitch = screen.getByRole('switch', { name: /high contrast mode/i });
    fireEvent.click(highContrastSwitch);
    
    await waitFor(() => {
      expect(highContrastSwitch).toBeChecked();
    });
    
    // Then reset
    const resetButton = screen.getByRole('button', { name: /reset all/i });
    fireEvent.click(resetButton);
    
    await waitFor(() => {
      expect(highContrastSwitch).not.toBeChecked();
    });
  });

  it('shows advanced settings when toggled', async () => {
    renderWithProvider(<AccessibilitySettings />);
    
    const advancedButton = screen.getByRole('button', { name: /advanced settings/i });
    fireEvent.click(advancedButton);
    
    await waitFor(() => {
      expect(screen.getByText('Screen Reader Optimization')).toBeInTheDocument();
      expect(screen.getByText('System Detection')).toBeInTheDocument();
    });
  });

  it('displays accessibility status indicator', () => {
    renderWithProvider(<AccessibilitySettings />);
    
    expect(screen.getByText('Accessibility Status: Active')).toBeInTheDocument();
    expect(screen.getByText(/your accessibility preferences are being applied/i)).toBeInTheDocument();
  });

  it('provides helpful descriptions for each setting', () => {
    renderWithProvider(<AccessibilitySettings />);
    
    expect(screen.getByText(/increases contrast between text and background/i)).toBeInTheDocument();
    expect(screen.getByText(/makes buttons and interactive elements larger/i)).toBeInTheDocument();
    expect(screen.getByText(/provides spoken instructions for breathing exercises/i)).toBeInTheDocument();
    expect(screen.getByText(/simplifies the interface with calming colors/i)).toBeInTheDocument();
  });

  it('has proper ARIA labels and descriptions', () => {
    renderWithProvider(<AccessibilitySettings />);
    
    const switches = screen.getAllByRole('switch');
    switches.forEach(switchElement => {
      expect(switchElement).toHaveAttribute('aria-describedby');
    });
  });

  it('supports keyboard navigation', () => {
    renderWithProvider(<AccessibilitySettings />);
    
    const switches = screen.getAllByRole('switch');
    switches.forEach(switchElement => {
      expect(switchElement).toHaveAttribute('tabindex', '0');
    });
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).not.toHaveAttribute('tabindex', '-1');
    });
  });
});