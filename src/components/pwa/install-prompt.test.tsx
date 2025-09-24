import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InstallPrompt, usePWAInstall } from './install-prompt';
import { renderHook, act } from '@testing-library/react';

// Mock the BeforeInstallPromptEvent
class MockBeforeInstallPromptEvent extends Event {
  platforms = ['web'];
  userChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });
  prompt = vi.fn().mockResolvedValue(undefined);
}

describe('InstallPrompt', () => {
  let mockEvent: MockBeforeInstallPromptEvent;

  beforeEach(() => {
    vi.useFakeTimers();
    mockEvent = new MockBeforeInstallPromptEvent('beforeinstallprompt');
    
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

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Clear session storage
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should not render initially', () => {
    render(<InstallPrompt />);
    expect(screen.queryByText('Install CF Tracker')).not.toBeInTheDocument();
  });

  it('should render after beforeinstallprompt event', async () => {
    render(<InstallPrompt />);
    
    // Simulate beforeinstallprompt event
    fireEvent(window, mockEvent);
    
    // Wait for the 10-second delay
    vi.advanceTimersByTime(10000);
    
    await waitFor(() => {
      expect(screen.getByText('Install CF Tracker')).toBeInTheDocument();
    });
  });

  it('should show install button and handle click', async () => {
    render(<InstallPrompt />);
    
    fireEvent(window, mockEvent);
    vi.advanceTimersByTime(10000);
    
    await waitFor(() => {
      expect(screen.getByText('Install App')).toBeInTheDocument();
    });

    const installButton = screen.getByText('Install App');
    fireEvent.click(installButton);

    expect(mockEvent.prompt).toHaveBeenCalled();
  });

  it('should handle dismiss button', async () => {
    render(<InstallPrompt />);
    
    fireEvent(window, mockEvent);
    vi.advanceTimersByTime(10000);
    
    await waitFor(() => {
      expect(screen.getByText('Install CF Tracker')).toBeInTheDocument();
    });

    const dismissButton = screen.getByText('Later');
    fireEvent.click(dismissButton);

    expect(screen.queryByText('Install CF Tracker')).not.toBeInTheDocument();
    expect(sessionStorage.getItem('cf-tracker-install-dismissed')).toBe('true');
  });

  it('should not show if already dismissed in session', () => {
    sessionStorage.setItem('cf-tracker-install-dismissed', 'true');
    
    render(<InstallPrompt />);
    
    fireEvent(window, mockEvent);
    vi.advanceTimersByTime(10000);
    
    expect(screen.queryByText('Install CF Tracker')).not.toBeInTheDocument();
  });

  it('should show online/offline status', async () => {
    render(<InstallPrompt />);
    
    fireEvent(window, mockEvent);
    vi.advanceTimersByTime(10000);
    
    await waitFor(() => {
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    fireEvent(window, new Event('offline'));

    await waitFor(() => {
      expect(screen.getByText('Offline Ready')).toBeInTheDocument();
    });
  });

  it('should not show if app is already installed', () => {
    // Mock standalone mode
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<InstallPrompt />);
    
    fireEvent(window, mockEvent);
    vi.advanceTimersByTime(10000);
    
    expect(screen.queryByText('Install CF Tracker')).not.toBeInTheDocument();
  });
});

describe('usePWAInstall', () => {
  beforeEach(() => {
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
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => usePWAInstall());
    
    expect(result.current.isInstallable).toBe(false);
    expect(result.current.isInstalled).toBe(false);
    expect(typeof result.current.install).toBe('function');
  });

  it('should detect installable state', async () => {
    const { result } = renderHook(() => usePWAInstall());
    
    const mockEvent = new MockBeforeInstallPromptEvent('beforeinstallprompt');
    
    act(() => {
      fireEvent(window, mockEvent);
    });

    await waitFor(() => {
      expect(result.current.isInstallable).toBe(true);
    });
  });

  it('should detect installed state', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() => usePWAInstall());
    
    expect(result.current.isInstalled).toBe(true);
  });

  it('should handle install function', async () => {
    const { result } = renderHook(() => usePWAInstall());
    
    const mockEvent = new MockBeforeInstallPromptEvent('beforeinstallprompt');
    
    act(() => {
      fireEvent(window, mockEvent);
    });

    await waitFor(() => {
      expect(result.current.isInstallable).toBe(true);
    });

    let installResult: boolean | undefined;
    
    await act(async () => {
      installResult = await result.current.install();
    });

    expect(installResult).toBe(true);
    expect(mockEvent.prompt).toHaveBeenCalled();
  });
});