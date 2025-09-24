import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PWAStatus, useConnectionStatus } from './pwa-status';
import { renderHook } from '@testing-library/react';

// Mock the offline manager
vi.mock('@/lib/pwa/offline-manager', () => ({
  offlineManager: {
    getConnectionStatus: vi.fn(() => ({
      isOnline: true,
      lastOnline: null,
      syncPending: false,
      pendingCount: 0,
    })),
    onConnectionChange: vi.fn(() => vi.fn()),
    syncOfflineData: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('PWAStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Mock service worker
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      value: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
  });

  it('should render simple online status', () => {
    render(<PWAStatus />);
    
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should render offline status when offline', async () => {
    const { offlineManager } = await import('@/lib/pwa/offline-manager');
    
    vi.mocked(offlineManager.getConnectionStatus).mockReturnValue({
      isOnline: false,
      lastOnline: new Date('2024-01-01T12:00:00Z'),
      syncPending: true,
      pendingCount: 3,
    });

    render(<PWAStatus />);
    
    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByText('3 pending')).toBeInTheDocument();
  });

  it('should render detailed status card', async () => {
    const { offlineManager } = await import('@/lib/pwa/offline-manager');
    
    vi.mocked(offlineManager.getConnectionStatus).mockReturnValue({
      isOnline: false,
      lastOnline: new Date('2024-01-01T12:00:00Z'),
      syncPending: true,
      pendingCount: 5,
    });

    render(<PWAStatus showDetails={true} />);
    
    expect(screen.getByText('Connection Status')).toBeInTheDocument();
    expect(screen.getByText('You are currently offline')).toBeInTheDocument();
    expect(screen.getByText('5 items')).toBeInTheDocument();
    expect(screen.getByText('Available Offline')).toBeInTheDocument();
  });

  it('should show retry button when offline', async () => {
    const { offlineManager } = await import('@/lib/pwa/offline-manager');
    
    vi.mocked(offlineManager.getConnectionStatus).mockReturnValue({
      isOnline: false,
      lastOnline: new Date(),
      syncPending: false,
      pendingCount: 0,
    });

    // Mock window.location.reload
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { reload: mockReload },
    });

    render(<PWAStatus showDetails={true} />);
    
    const retryButton = screen.getByText('Retry Connection');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(offlineManager.syncOfflineData).toHaveBeenCalled();
    });
  });

  it('should show force sync button when online with pending data', async () => {
    const { offlineManager } = await import('@/lib/pwa/offline-manager');
    
    vi.mocked(offlineManager.getConnectionStatus).mockReturnValue({
      isOnline: true,
      lastOnline: null,
      syncPending: true,
      pendingCount: 2,
    });

    render(<PWAStatus showDetails={true} />);
    
    const syncButton = screen.getByText('Force Sync');
    expect(syncButton).toBeInTheDocument();
    
    fireEvent.click(syncButton);
    
    await waitFor(() => {
      expect(offlineManager.syncOfflineData).toHaveBeenCalled();
    });
  });

  it('should display last online time', async () => {
    const { offlineManager } = await import('@/lib/pwa/offline-manager');
    
    const lastOnline = new Date('2024-01-01T12:00:00Z');
    vi.mocked(offlineManager.getConnectionStatus).mockReturnValue({
      isOnline: false,
      lastOnline,
      syncPending: false,
      pendingCount: 0,
    });

    render(<PWAStatus showDetails={true} />);
    
    expect(screen.getByText('Last Online')).toBeInTheDocument();
    expect(screen.getByText(lastOnline.toLocaleString())).toBeInTheDocument();
  });

  it('should show offline capabilities when offline', async () => {
    const { offlineManager } = await import('@/lib/pwa/offline-manager');
    
    vi.mocked(offlineManager.getConnectionStatus).mockReturnValue({
      isOnline: false,
      lastOnline: null,
      syncPending: false,
      pendingCount: 0,
    });

    render(<PWAStatus showDetails={true} />);
    
    expect(screen.getByText('Available Offline')).toBeInTheDocument();
    expect(screen.getByText('Energy and symptom tracking')).toBeInTheDocument();
    expect(screen.getByText('Daily anchor routines')).toBeInTheDocument();
    expect(screen.getByText('Recent health data')).toBeInTheDocument();
    expect(screen.getByText('Movement sessions')).toBeInTheDocument();
  });
});

describe('useConnectionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial connection status', async () => {
    const { offlineManager } = await import('@/lib/pwa/offline-manager');
    
    vi.mocked(offlineManager.getConnectionStatus).mockReturnValue({
      isOnline: true,
      lastOnline: null,
      syncPending: false,
      pendingCount: 0,
    });

    const { result } = renderHook(() => useConnectionStatus());
    
    expect(result.current.isOnline).toBe(true);
    expect(result.current.syncPending).toBe(false);
  });

  it('should update when connection status changes', async () => {
    const { offlineManager } = await import('@/lib/pwa/offline-manager');
    
    let connectionCallback: (status: any) => void = () => {};
    
    vi.mocked(offlineManager.onConnectionChange).mockImplementation((callback) => {
      connectionCallback = callback;
      return vi.fn();
    });

    vi.mocked(offlineManager.getConnectionStatus).mockReturnValue({
      isOnline: true,
      lastOnline: null,
      syncPending: false,
      pendingCount: 0,
    });

    const { result } = renderHook(() => useConnectionStatus());
    
    expect(result.current.isOnline).toBe(true);
    
    // Simulate connection change
    connectionCallback({
      isOnline: false,
      lastOnline: new Date(),
      syncPending: true,
      pendingCount: 2,
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
      expect(result.current.syncPending).toBe(true);
    });
  });
});