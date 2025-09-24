import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { offlineManager, storeForOfflineSync, syncWhenOnline } from './offline-manager';

// Mock IndexedDB
const mockDB = {
  transaction: vi.fn(),
  objectStoreNames: { contains: vi.fn() },
};

const mockObjectStore = {
  add: vi.fn(),
  put: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn(),
  delete: vi.fn(),
  createIndex: vi.fn(),
};

const mockTransaction = {
  objectStore: vi.fn(() => mockObjectStore),
  oncomplete: null,
  onerror: null,
};

const mockRequest = {
  result: mockDB,
  error: null,
  onsuccess: null,
  onerror: null,
  onupgradeneeded: null,
};

// Mock global IndexedDB
global.indexedDB = {
  open: vi.fn(() => mockRequest),
  deleteDatabase: vi.fn(),
  databases: vi.fn(),
} as any;

Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
  writable: true,
});

describe('OfflineManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockDB.transaction.mockReturnValue(mockTransaction);
    mockDB.objectStoreNames.contains.mockReturnValue(true);
    
    // Mock successful IndexedDB operations
    mockObjectStore.add.mockImplementation(() => ({
      onsuccess: null,
      onerror: null,
    }));
    
    mockObjectStore.getAll.mockImplementation(() => ({
      result: [],
      onsuccess: null,
      onerror: null,
    }));

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

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

  describe('getConnectionStatus', () => {
    it('should return online status when navigator.onLine is true', () => {
      const status = offlineManager.getConnectionStatus();
      
      expect(status.isOnline).toBe(true);
      expect(status.syncPending).toBe(false);
      expect(status.pendingCount).toBe(0);
    });

    it('should return offline status when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const status = offlineManager.getConnectionStatus();
      
      expect(status.isOnline).toBe(false);
    });

    it('should return last online time from localStorage', () => {
      const lastOnlineTime = '2024-01-01T12:00:00.000Z';
      vi.mocked(localStorage.getItem).mockReturnValue(lastOnlineTime);
      
      const status = offlineManager.getConnectionStatus();
      
      expect(status.lastOnline).toEqual(new Date(lastOnlineTime));
    });
  });

  describe('storeOfflineData', () => {
    it('should store data for offline sync', async () => {
      // Mock successful IndexedDB add operation
      const mockAddRequest = {
        onsuccess: null,
        onerror: null,
      };
      mockObjectStore.add.mockReturnValue(mockAddRequest);

      const promise = offlineManager.storeOfflineData({
        type: 'health-log',
        endpoint: '/api/health',
        data: { energy: 5 },
        method: 'POST',
      });

      // Simulate successful add
      setTimeout(() => {
        if (mockAddRequest.onsuccess) {
          mockAddRequest.onsuccess();
        }
      }, 0);

      const result = await promise;
      
      expect(result).toBe('test-uuid-123');
      expect(mockObjectStore.add).toHaveBeenCalledWith({
        id: 'test-uuid-123',
        type: 'health-log',
        endpoint: '/api/health',
        data: { energy: 5 },
        method: 'POST',
        timestamp: expect.any(Number),
      });
    });

    it('should handle IndexedDB errors', async () => {
      const mockAddRequest = {
        onsuccess: null,
        onerror: null,
        error: new Error('IndexedDB error'),
      };
      mockObjectStore.add.mockReturnValue(mockAddRequest);

      const promise = offlineManager.storeOfflineData({
        type: 'health-log',
        endpoint: '/api/health',
        data: { energy: 5 },
        method: 'POST',
      });

      // Simulate error
      setTimeout(() => {
        if (mockAddRequest.onerror) {
          mockAddRequest.onerror();
        }
      }, 0);

      await expect(promise).rejects.toThrow();
    });
  });

  describe('getPendingData', () => {
    it('should retrieve all pending data', async () => {
      const mockData = [
        {
          id: '1',
          type: 'health-log',
          endpoint: '/api/health',
          data: { energy: 5 },
          method: 'POST',
          timestamp: Date.now(),
        },
      ];

      const mockGetAllRequest = {
        result: mockData,
        onsuccess: null,
        onerror: null,
      };
      mockObjectStore.getAll.mockReturnValue(mockGetAllRequest);

      const promise = offlineManager.getPendingData();

      // Simulate successful retrieval
      setTimeout(() => {
        if (mockGetAllRequest.onsuccess) {
          mockGetAllRequest.onsuccess();
        }
      }, 0);

      const result = await promise;
      
      expect(result).toEqual(mockData);
    });

    it('should handle empty results', async () => {
      const mockGetAllRequest = {
        result: [],
        onsuccess: null,
        onerror: null,
      };
      mockObjectStore.getAll.mockReturnValue(mockGetAllRequest);

      const promise = offlineManager.getPendingData();

      setTimeout(() => {
        if (mockGetAllRequest.onsuccess) {
          mockGetAllRequest.onsuccess();
        }
      }, 0);

      const result = await promise;
      
      expect(result).toEqual([]);
    });
  });

  describe('syncOfflineData', () => {
    it('should not sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const fetchSpy = vi.spyOn(global, 'fetch');
      
      await offlineManager.syncOfflineData();
      
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should sync pending data when online', async () => {
      const mockData = [
        {
          id: '1',
          type: 'health-log',
          endpoint: '/api/health',
          data: { energy: 5 },
          method: 'POST',
          timestamp: Date.now(),
        },
      ];

      // Mock getPendingData
      const mockGetAllRequest = {
        result: mockData,
        onsuccess: null,
        onerror: null,
      };
      mockObjectStore.getAll.mockReturnValue(mockGetAllRequest);

      // Mock successful fetch
      const mockResponse = {
        ok: true,
        status: 200,
      };
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse as Response);

      // Mock removeSyncedData
      const mockDeleteRequest = {
        onsuccess: null,
        onerror: null,
      };
      mockObjectStore.delete.mockReturnValue(mockDeleteRequest);

      const syncPromise = offlineManager.syncOfflineData();

      // Simulate successful data retrieval
      setTimeout(() => {
        if (mockGetAllRequest.onsuccess) {
          mockGetAllRequest.onsuccess();
        }
      }, 0);

      // Simulate successful deletion
      setTimeout(() => {
        if (mockDeleteRequest.onsuccess) {
          mockDeleteRequest.onsuccess();
        }
      }, 10);

      await syncPromise;

      expect(fetchSpy).toHaveBeenCalledWith('/api/health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ energy: 5 }),
      });
    });
  });

  describe('cacheAPIResponse', () => {
    it('should cache API response with TTL', async () => {
      const mockPutRequest = {
        onsuccess: null,
        onerror: null,
      };
      mockObjectStore.put.mockReturnValue(mockPutRequest);

      const promise = offlineManager.cacheAPIResponse('/api/test', { data: 'test' }, 3600000);

      setTimeout(() => {
        if (mockPutRequest.onsuccess) {
          mockPutRequest.onsuccess();
        }
      }, 0);

      await promise;

      expect(mockObjectStore.put).toHaveBeenCalledWith({
        url: '/api/test',
        data: { data: 'test' },
        timestamp: expect.any(Number),
        ttl: 3600000,
      });
    });
  });

  describe('getCachedAPIResponse', () => {
    it('should return cached data if not expired', async () => {
      const cachedData = {
        url: '/api/test',
        data: { result: 'cached' },
        timestamp: Date.now() - 1000, // 1 second ago
        ttl: 3600000, // 1 hour TTL
      };

      const mockGetRequest = {
        result: cachedData,
        onsuccess: null,
        onerror: null,
      };
      mockObjectStore.get.mockReturnValue(mockGetRequest);

      const promise = offlineManager.getCachedAPIResponse('/api/test');

      setTimeout(() => {
        if (mockGetRequest.onsuccess) {
          mockGetRequest.onsuccess();
        }
      }, 0);

      const result = await promise;

      expect(result).toEqual({ result: 'cached' });
    });

    it('should return null for expired cache', async () => {
      const cachedData = {
        url: '/api/test',
        data: { result: 'cached' },
        timestamp: Date.now() - 7200000, // 2 hours ago
        ttl: 3600000, // 1 hour TTL
      };

      const mockGetRequest = {
        result: cachedData,
        onsuccess: null,
        onerror: null,
      };
      mockObjectStore.get.mockReturnValue(mockGetRequest);

      const promise = offlineManager.getCachedAPIResponse('/api/test');

      setTimeout(() => {
        if (mockGetRequest.onsuccess) {
          mockGetRequest.onsuccess();
        }
      }, 0);

      const result = await promise;

      expect(result).toBeNull();
    });
  });
});

describe('Utility Functions', () => {
  describe('storeForOfflineSync', () => {
    it('should call offlineManager.storeOfflineData', async () => {
      const storeSpy = vi.spyOn(offlineManager, 'storeOfflineData').mockResolvedValue('test-id');

      const result = await storeForOfflineSync('health-log', '/api/health', { energy: 5 });

      expect(storeSpy).toHaveBeenCalledWith({
        type: 'health-log',
        endpoint: '/api/health',
        data: { energy: 5 },
        method: 'POST',
      });
      expect(result).toBe('test-id');
    });
  });

  describe('syncWhenOnline', () => {
    it('should call offlineManager.syncOfflineData', async () => {
      const syncSpy = vi.spyOn(offlineManager, 'syncOfflineData').mockResolvedValue();

      await syncWhenOnline();

      expect(syncSpy).toHaveBeenCalled();
    });
  });
});