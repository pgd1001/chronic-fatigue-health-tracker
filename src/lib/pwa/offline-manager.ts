// PWA Offline Manager
// Handles offline data storage, sync, and connection status

export interface OfflineData {
  id: string;
  type: 'health-log' | 'symptom' | 'energy' | 'movement' | 'biometric';
  data: any;
  timestamp: number;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
}

export interface ConnectionStatus {
  isOnline: boolean;
  lastOnline: Date | null;
  syncPending: boolean;
  pendingCount: number;
}

class OfflineManager {
  private dbName = 'cf-tracker-offline';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private connectionListeners: ((status: ConnectionStatus) => void)[] = [];
  private syncInProgress = false;

  constructor() {
    this.initDB();
    this.setupConnectionListeners();
  }

  // Initialize IndexedDB for offline storage
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for offline health data
        if (!db.objectStoreNames.contains('offline-data')) {
          const store = db.createObjectStore('offline-data', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for app settings and preferences
        if (!db.objectStoreNames.contains('app-settings')) {
          db.createObjectStore('app-settings', { keyPath: 'key' });
        }

        // Store for cached API responses
        if (!db.objectStoreNames.contains('api-cache')) {
          const cacheStore = db.createObjectStore('api-cache', { keyPath: 'url' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Setup connection status listeners
  private setupConnectionListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.notifyConnectionChange();
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.notifyConnectionChange();
    });

    // Check connection periodically
    setInterval(() => {
      this.checkConnection();
    }, 30000); // Check every 30 seconds
  }

  // Get current connection status
  public getConnectionStatus(): ConnectionStatus {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const lastOnline = this.getLastOnlineTime();
    const pendingCount = this.getPendingDataCount();

    return {
      isOnline,
      lastOnline,
      syncPending: pendingCount > 0,
      pendingCount,
    };
  }

  // Subscribe to connection status changes
  public onConnectionChange(callback: (status: ConnectionStatus) => void): () => void {
    this.connectionListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionListeners.indexOf(callback);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  // Store data for offline sync
  public async storeOfflineData(data: Omit<OfflineData, 'id' | 'timestamp'>): Promise<string> {
    if (!this.db) await this.initDB();

    const offlineData: OfflineData = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...data,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline-data'], 'readwrite');
      const store = transaction.objectStore('offline-data');
      const request = store.add(offlineData);

      request.onsuccess = () => resolve(offlineData.id);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all pending offline data
  public async getPendingData(): Promise<OfflineData[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline-data'], 'readonly');
      const store = transaction.objectStore('offline-data');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Remove synced data
  public async removeSyncedData(id: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline-data'], 'readwrite');
      const store = transaction.objectStore('offline-data');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync offline data when connection is restored
  public async syncOfflineData(): Promise<void> {
    if (this.syncInProgress || !this.getConnectionStatus().isOnline) {
      return;
    }

    this.syncInProgress = true;
    console.log('[OfflineManager] Starting data sync...');

    try {
      const pendingData = await this.getPendingData();
      
      if (pendingData.length === 0) {
        console.log('[OfflineManager] No pending data to sync');
        return;
      }

      console.log(`[OfflineManager] Syncing ${pendingData.length} items...`);

      for (const item of pendingData) {
        try {
          const response = await fetch(item.endpoint, {
            method: item.method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(item.data),
          });

          if (response.ok) {
            await this.removeSyncedData(item.id);
            console.log(`[OfflineManager] Synced item: ${item.id}`);
          } else {
            console.error(`[OfflineManager] Failed to sync item ${item.id}:`, response.status);
          }
        } catch (error) {
          console.error(`[OfflineManager] Error syncing item ${item.id}:`, error);
        }
      }

      this.notifyConnectionChange();
      console.log('[OfflineManager] Data sync completed');

    } catch (error) {
      console.error('[OfflineManager] Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Cache API response for offline access
  public async cacheAPIResponse(url: string, data: any, ttl: number = 3600000): Promise<void> {
    if (!this.db) await this.initDB();

    const cacheData = {
      url,
      data,
      timestamp: Date.now(),
      ttl,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['api-cache'], 'readwrite');
      const store = transaction.objectStore('api-cache');
      const request = store.put(cacheData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get cached API response
  public async getCachedAPIResponse(url: string): Promise<any | null> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['api-cache'], 'readonly');
      const store = transaction.objectStore('api-cache');
      const request = store.get(url);

      request.onsuccess = () => {
        const result = request.result;
        
        if (!result) {
          resolve(null);
          return;
        }

        // Check if cache is expired
        const now = Date.now();
        if (now - result.timestamp > result.ttl) {
          // Cache expired, remove it
          this.removeCachedAPIResponse(url);
          resolve(null);
          return;
        }

        resolve(result.data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Remove cached API response
  public async removeCachedAPIResponse(url: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['api-cache'], 'readwrite');
      const store = transaction.objectStore('api-cache');
      const request = store.delete(url);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Store app setting
  public async storeSetting(key: string, value: any): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['app-settings'], 'readwrite');
      const store = transaction.objectStore('app-settings');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get app setting
  public async getSetting(key: string): Promise<any | null> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['app-settings'], 'readonly');
      const store = transaction.objectStore('app-settings');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Private helper methods
  private notifyConnectionChange(): void {
    const status = this.getConnectionStatus();
    this.connectionListeners.forEach(callback => callback(status));
  }

  private getLastOnlineTime(): Date | null {
    if (typeof localStorage === 'undefined') return null;
    
    const lastOnline = localStorage.getItem('cf-tracker-last-online');
    return lastOnline ? new Date(lastOnline) : null;
  }

  private getPendingDataCount(): number {
    // This would be implemented with a proper IndexedDB query
    // For now, return 0 as placeholder
    return 0;
  }

  private async checkConnection(): Promise<void> {
    if (typeof navigator === 'undefined') return;

    const wasOnline = this.getConnectionStatus().isOnline;
    const isOnline = navigator.onLine;

    if (wasOnline !== isOnline) {
      if (isOnline) {
        localStorage.setItem('cf-tracker-last-online', new Date().toISOString());
        this.syncOfflineData();
      }
      this.notifyConnectionChange();
    }
  }

  // Clean up old cached data
  public async cleanupCache(): Promise<void> {
    if (!this.db) await this.initDB();

    const transaction = this.db.transaction(['api-cache'], 'readwrite');
    const store = transaction.objectStore('api-cache');
    const index = store.index('timestamp');
    
    const now = Date.now();
    const cutoff = now - (7 * 24 * 60 * 60 * 1000); // 7 days ago

    const request = index.openCursor(IDBKeyRange.upperBound(cutoff));
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }
}

// Export singleton instance
export const offlineManager = new OfflineManager();

// Utility functions for components
export const useOfflineStatus = () => {
  if (typeof window === 'undefined') {
    return { isOnline: true, syncPending: false, pendingCount: 0 };
  }
  
  return offlineManager.getConnectionStatus();
};

export const storeForOfflineSync = async (
  type: OfflineData['type'],
  endpoint: string,
  data: any,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST'
): Promise<string> => {
  return offlineManager.storeOfflineData({
    type,
    endpoint,
    data,
    method,
  });
};

export const syncWhenOnline = async (): Promise<void> => {
  return offlineManager.syncOfflineData();
};