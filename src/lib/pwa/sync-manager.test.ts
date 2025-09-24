import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncManager, queueHealthData, syncAllData, getSyncStatus, retryFailedSync } from './sync-manager';

// Mock the offline manager
vi.mock('./offline-manager', () => ({
  offlineManager: {
    storeOfflineData: vi.fn(),
    getPendingData: vi.fn(),
    removeSyncedData: vi.fn(),
  },
}));

describe('SyncManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Mock fetch
    global.fetch = vi.fn();

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });

    // Mock window events
    global.window = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('queueForSync', () => {
    it('should queue data for sync', async () => {
      const { offlineManager } = await import('./offline-manager');
      vi.mocked(offlineManager.storeOfflineData).mockResolvedValue('test-id');

      const result = await syncManager.queueForSync('health-log', '/api/health', { energy: 5 });

      expect(offlineManager.storeOfflineData).toHaveBeenCalledWith({
        type: 'health-log',
        endpoint: '/api/health',
        data: { energy: 5 },
        method: 'POST',
      });
      expect(result).toBe('test-id');
    });

    it('should handle storage errors', async () => {
      const { offlineManager } = await import('./offline-manager');
      vi.mocked(offlineManager.storeOfflineData).mockRejectedValue(new Error('Storage failed'));

      await expect(
        syncManager.queueForSync('health-log', '/api/health', { energy: 5 })
      ).rejects.toThrow('Storage failed');
    });
  });

  describe('syncAll', () => {
    it('should return early if sync is in progress', async () => {
      const { offlineManager } = await import('./offline-manager');
      
      // Start a sync
      const syncPromise1 = syncManager.syncAll();
      const syncPromise2 = syncManager.syncAll();

      vi.mocked(offlineManager.getPendingData).mockResolvedValue([]);

      const result1 = await syncPromise1;
      const result2 = await syncPromise2;

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);
    });

    it('should handle empty pending data', async () => {
      const { offlineManager } = await import('./offline-manager');
      vi.mocked(offlineManager.getPendingData).mockResolvedValue([]);

      const result = await syncManager.syncAll();

      expect(result).toEqual({
        success: true,
        synced: 0,
        failed: 0,
        errors: [],
      });
    });

    it('should sync pending data successfully', async () => {
      const { offlineManager } = await import('./offline-manager');
      
      const pendingData = [
        {
          id: '1',
          type: 'health-log' as const,
          endpoint: '/api/health',
          data: { energy: 5 },
          method: 'POST' as const,
          timestamp: Date.now(),
        },
      ];

      vi.mocked(offlineManager.getPendingData).mockResolvedValue(pendingData);
      vi.mocked(offlineManager.removeSyncedData).mockResolvedValue();
      
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const result = await syncManager.syncAll();

      expect(result.success).toBe(true);
      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);
      expect(fetch).toHaveBeenCalledWith('/api/health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Request': 'true',
          'X-Retry-Count': '0',
        },
        body: JSON.stringify({ energy: 5 }),
        signal: expect.any(AbortSignal),
      });
    });

    it('should handle server errors with retry', async () => {
      const { offlineManager } = await import('./offline-manager');
      
      const pendingData = [
        {
          id: '1',
          type: 'health-log' as const,
          endpoint: '/api/health',
          data: { energy: 5 },
          method: 'POST' as const,
          timestamp: Date.now(),
        },
      ];

      vi.mocked(offlineManager.getPendingData).mockResolvedValue(pendingData);
      
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error'),
      } as Response);

      const result = await syncManager.syncAll();

      expect(result.success).toBe(false);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Server error: 500');
    });

    it('should handle client errors without retry', async () => {
      const { offlineManager } = await import('./offline-manager');
      
      const pendingData = [
        {
          id: '1',
          type: 'health-log' as const,
          endpoint: '/api/health',
          data: { energy: 5 },
          method: 'POST' as const,
          timestamp: Date.now(),
        },
      ];

      vi.mocked(offlineManager.getPendingData).mockResolvedValue(pendingData);
      vi.mocked(offlineManager.removeSyncedData).mockResolvedValue();
      
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad request'),
      } as Response);

      const result = await syncManager.syncAll();

      expect(result.success).toBe(false);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
      expect(offlineManager.removeSyncedData).toHaveBeenCalledWith('1');
    });

    it('should handle network errors with retry', async () => {
      const { offlineManager } = await import('./offline-manager');
      
      const pendingData = [
        {
          id: '1',
          type: 'health-log' as const,
          endpoint: '/api/health',
          data: { energy: 5 },
          method: 'POST' as const,
          timestamp: Date.now(),
        },
      ];

      vi.mocked(offlineManager.getPendingData).mockResolvedValue(pendingData);
      
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const result = await syncManager.syncAll();

      expect(result.success).toBe(false);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors[0].error).toBe('Network error');
    });

    it('should respect batch size', async () => {
      const { offlineManager } = await import('./offline-manager');
      
      const pendingData = Array.from({ length: 25 }, (_, i) => ({
        id: `${i + 1}`,
        type: 'health-log' as const,
        endpoint: '/api/health',
        data: { energy: i + 1 },
        method: 'POST' as const,
        timestamp: Date.now(),
      }));

      vi.mocked(offlineManager.getPendingData).mockResolvedValue(pendingData);
      vi.mocked(offlineManager.removeSyncedData).mockResolvedValue();
      
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const result = await syncManager.syncAll({ batchSize: 10 });

      expect(result.success).toBe(true);
      expect(result.synced).toBe(25);
      expect(fetch).toHaveBeenCalledTimes(25);
    });

    it('should handle timeout', async () => {
      const { offlineManager } = await import('./offline-manager');
      
      const pendingData = [
        {
          id: '1',
          type: 'health-log' as const,
          endpoint: '/api/health',
          data: { energy: 5 },
          method: 'POST' as const,
          timestamp: Date.now(),
        },
      ];

      vi.mocked(offlineManager.getPendingData).mockResolvedValue(pendingData);
      
      // Mock fetch to never resolve (timeout scenario)
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));

      const result = await syncManager.syncAll({ timeout: 100 });

      expect(result.success).toBe(false);
      expect(result.failed).toBe(1);
    });
  });

  describe('getSyncStatus', () => {
    it('should return sync status', async () => {
      const { offlineManager } = await import('./offline-manager');
      
      const pendingData = [
        {
          id: '1',
          type: 'health-log' as const,
          endpoint: '/api/health',
          data: { energy: 5 },
          method: 'POST' as const,
          timestamp: Date.now(),
        },
      ];

      vi.mocked(offlineManager.getPendingData).mockResolvedValue(pendingData);

      const status = await syncManager.getSyncStatus();

      expect(status.pending).toBe(1);
      expect(status.inProgress).toBe(false);
      expect(status.errors).toEqual([]);
    });

    it('should include retry errors in status', async () => {
      const { offlineManager } = await import('./offline-manager');
      
      const pendingData = [
        {
          id: '1',
          type: 'health-log' as const,
          endpoint: '/api/health',
          data: { energy: 5 },
          method: 'POST' as const,
          timestamp: Date.now(),
        },
      ];

      vi.mocked(offlineManager.getPendingData).mockResolvedValue(pendingData);
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      // Trigger a failed sync to create retry entries
      await syncManager.syncAll();

      const status = await syncManager.getSyncStatus();

      expect(status.errors).toHaveLength(1);
      expect(status.errors[0].retryCount).toBe(1);
    });
  });

  describe('retryFailed', () => {
    it('should retry only failed items', async () => {
      const { offlineManager } = await import('./offline-manager');
      
      const pendingData = [
        {
          id: '1',
          type: 'health-log' as const,
          endpoint: '/api/health',
          data: { energy: 5 },
          method: 'POST' as const,
          timestamp: Date.now(),
        },
      ];

      vi.mocked(offlineManager.getPendingData).mockResolvedValue(pendingData);
      vi.mocked(offlineManager.removeSyncedData).mockResolvedValue();

      // First sync fails
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
      await syncManager.syncAll();

      // Retry should succeed
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const result = await syncManager.retryFailed();

      expect(result.success).toBe(true);
      expect(result.synced).toBe(1);
    });
  });

  describe('onSyncComplete', () => {
    it('should notify listeners of sync completion', async () => {
      const { offlineManager } = await import('./offline-manager');
      
      const listener = vi.fn();
      const unsubscribe = syncManager.onSyncComplete(listener);

      vi.mocked(offlineManager.getPendingData).mockResolvedValue([]);

      await syncManager.syncAll();

      expect(listener).toHaveBeenCalledWith({
        success: true,
        synced: 0,
        failed: 0,
        errors: [],
      });

      unsubscribe();
    });
  });
});

describe('Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('queueHealthData', () => {
    it('should call syncManager.queueForSync', async () => {
      const queueSpy = vi.spyOn(syncManager, 'queueForSync').mockResolvedValue('test-id');

      const result = await queueHealthData('health-log', '/api/health', { energy: 5 });

      expect(queueSpy).toHaveBeenCalledWith('health-log', '/api/health', { energy: 5 }, 'POST');
      expect(result).toBe('test-id');
    });
  });

  describe('syncAllData', () => {
    it('should call syncManager.syncAll', async () => {
      const syncSpy = vi.spyOn(syncManager, 'syncAll').mockResolvedValue({
        success: true,
        synced: 0,
        failed: 0,
        errors: [],
      });

      const result = await syncAllData();

      expect(syncSpy).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('getSyncStatus', () => {
    it('should call syncManager.getSyncStatus', async () => {
      const statusSpy = vi.spyOn(syncManager, 'getSyncStatus').mockResolvedValue({
        pending: 0,
        inProgress: false,
        lastSync: null,
        errors: [],
      });

      const result = await getSyncStatus();

      expect(statusSpy).toHaveBeenCalled();
      expect(result.pending).toBe(0);
    });
  });

  describe('retryFailedSync', () => {
    it('should call syncManager.retryFailed', async () => {
      const retrySpy = vi.spyOn(syncManager, 'retryFailed').mockResolvedValue({
        success: true,
        synced: 0,
        failed: 0,
        errors: [],
      });

      const result = await retryFailedSync();

      expect(retrySpy).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });
});