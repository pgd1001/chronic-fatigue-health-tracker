// Sync Manager for PWA offline data synchronization
// Handles queuing, retrying, and conflict resolution for health data

import { offlineManager, type OfflineData } from './offline-manager';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: SyncError[];
}

export interface SyncError {
  id: string;
  type: string;
  error: string;
  retryCount: number;
}

export interface SyncOptions {
  maxRetries?: number;
  retryDelay?: number;
  batchSize?: number;
  timeout?: number;
}

class SyncManager {
  private syncInProgress = false;
  private syncQueue: OfflineData[] = [];
  private retryQueue: Map<string, number> = new Map();
  private syncListeners: ((result: SyncResult) => void)[] = [];

  private defaultOptions: Required<SyncOptions> = {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    batchSize: 10,
    timeout: 30000, // 30 seconds
  };

  constructor() {
    // Listen for online events to trigger sync
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.syncWhenOnline();
      });
    }
  }

  // Add data to sync queue
  async queueForSync(
    type: OfflineData['type'],
    endpoint: string,
    data: any,
    method: 'POST' | 'PUT' | 'PATCH' = 'POST'
  ): Promise<string> {
    try {
      // Store in offline manager
      const id = await offlineManager.storeOfflineData({
        type,
        endpoint,
        data,
        method,
      });

      // Add to sync queue if online
      if (navigator.onLine) {
        this.syncWhenOnline();
      }

      return id;
    } catch (error) {
      console.error('[SyncManager] Failed to queue data:', error);
      throw error;
    }
  }

  // Sync all pending data
  async syncAll(options: SyncOptions = {}): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('[SyncManager] Sync already in progress');
      return { success: false, synced: 0, failed: 0, errors: [] };
    }

    const opts = { ...this.defaultOptions, ...options };
    this.syncInProgress = true;

    try {
      console.log('[SyncManager] Starting sync...');
      
      const pendingData = await offlineManager.getPendingData();
      
      if (pendingData.length === 0) {
        console.log('[SyncManager] No pending data to sync');
        return { success: true, synced: 0, failed: 0, errors: [] };
      }

      const result = await this.processSyncBatches(pendingData, opts);
      
      // Notify listeners
      this.syncListeners.forEach(listener => listener(result));
      
      console.log(`[SyncManager] Sync completed: ${result.synced} synced, ${result.failed} failed`);
      return result;

    } catch (error) {
      console.error('[SyncManager] Sync failed:', error);
      return { success: false, synced: 0, failed: 0, errors: [] };
    } finally {
      this.syncInProgress = false;
    }
  }

  // Process sync in batches
  private async processSyncBatches(
    data: OfflineData[],
    options: Required<SyncOptions>
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    };

    // Process in batches
    for (let i = 0; i < data.length; i += options.batchSize) {
      const batch = data.slice(i, i + options.batchSize);
      const batchResult = await this.processBatch(batch, options);
      
      result.synced += batchResult.synced;
      result.failed += batchResult.failed;
      result.errors.push(...batchResult.errors);
      
      // Small delay between batches to avoid overwhelming the server
      if (i + options.batchSize < data.length) {
        await this.delay(100);
      }
    }

    result.success = result.failed === 0;
    return result;
  }

  // Process a single batch
  private async processBatch(
    batch: OfflineData[],
    options: Required<SyncOptions>
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    };

    const promises = batch.map(item => this.syncItem(item, options));
    const results = await Promise.allSettled(promises);

    results.forEach((itemResult, index) => {
      const item = batch[index];
      
      if (itemResult.status === 'fulfilled' && itemResult.value.success) {
        result.synced++;
      } else {
        result.failed++;
        const error = itemResult.status === 'rejected' 
          ? itemResult.reason.message 
          : itemResult.value.error;
        
        result.errors.push({
          id: item.id,
          type: item.type,
          error,
          retryCount: this.retryQueue.get(item.id) || 0,
        });
      }
    });

    return result;
  }

  // Sync a single item
  private async syncItem(
    item: OfflineData,
    options: Required<SyncOptions>
  ): Promise<{ success: boolean; error?: string }> {
    const retryCount = this.retryQueue.get(item.id) || 0;
    
    if (retryCount >= options.maxRetries) {
      console.error(`[SyncManager] Max retries exceeded for item ${item.id}`);
      return { success: false, error: 'Max retries exceeded' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout);

      const response = await fetch(item.endpoint, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Request': 'true',
          'X-Retry-Count': retryCount.toString(),
        },
        body: JSON.stringify(item.data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Success - remove from offline storage
        await offlineManager.removeSyncedData(item.id);
        this.retryQueue.delete(item.id);
        console.log(`[SyncManager] Synced item ${item.id}`);
        return { success: true };
      } else {
        // Server error - handle based on status
        const errorText = await response.text();
        
        if (response.status >= 400 && response.status < 500) {
          // Client error - don't retry
          await offlineManager.removeSyncedData(item.id);
          this.retryQueue.delete(item.id);
          console.error(`[SyncManager] Client error for item ${item.id}:`, response.status);
          return { success: false, error: `Client error: ${response.status}` };
        } else {
          // Server error - retry
          this.retryQueue.set(item.id, retryCount + 1);
          console.error(`[SyncManager] Server error for item ${item.id}:`, response.status);
          return { success: false, error: `Server error: ${response.status}` };
        }
      }
    } catch (error) {
      // Network error - retry
      this.retryQueue.set(item.id, retryCount + 1);
      
      if (retryCount < options.maxRetries - 1) {
        // Wait before retry
        await this.delay(options.retryDelay * Math.pow(2, retryCount));
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[SyncManager] Network error for item ${item.id}:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Sync when online
  async syncWhenOnline(): Promise<void> {
    if (!navigator.onLine) {
      console.log('[SyncManager] Offline - skipping sync');
      return;
    }

    try {
      await this.syncAll();
    } catch (error) {
      console.error('[SyncManager] Auto-sync failed:', error);
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    pending: number;
    inProgress: boolean;
    lastSync: Date | null;
    errors: SyncError[];
  }> {
    const pendingData = await offlineManager.getPendingData();
    const errors: SyncError[] = [];
    
    // Get retry information
    pendingData.forEach(item => {
      const retryCount = this.retryQueue.get(item.id) || 0;
      if (retryCount > 0) {
        errors.push({
          id: item.id,
          type: item.type,
          error: 'Sync failed, will retry',
          retryCount,
        });
      }
    });

    return {
      pending: pendingData.length,
      inProgress: this.syncInProgress,
      lastSync: this.getLastSyncTime(),
      errors,
    };
  }

  // Listen for sync results
  onSyncComplete(callback: (result: SyncResult) => void): () => void {
    this.syncListeners.push(callback);
    
    return () => {
      const index = this.syncListeners.indexOf(callback);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  // Clear all pending data (use with caution)
  async clearPendingData(): Promise<void> {
    const pendingData = await offlineManager.getPendingData();
    
    for (const item of pendingData) {
      await offlineManager.removeSyncedData(item.id);
    }
    
    this.retryQueue.clear();
    console.log('[SyncManager] Cleared all pending data');
  }

  // Retry failed items
  async retryFailed(): Promise<SyncResult> {
    const pendingData = await offlineManager.getPendingData();
    const failedItems = pendingData.filter(item => this.retryQueue.has(item.id));
    
    if (failedItems.length === 0) {
      return { success: true, synced: 0, failed: 0, errors: [] };
    }

    // Reset retry counts for manual retry
    failedItems.forEach(item => {
      this.retryQueue.delete(item.id);
    });

    return this.syncAll();
  }

  // Private helper methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getLastSyncTime(): Date | null {
    if (typeof localStorage === 'undefined') return null;
    
    const lastSync = localStorage.getItem('cf-tracker-last-sync');
    return lastSync ? new Date(lastSync) : null;
  }

  private setLastSyncTime(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cf-tracker-last-sync', new Date().toISOString());
    }
  }
}

// Export singleton instance
export const syncManager = new SyncManager();

// Export class for testing
export { SyncManager };

// Utility functions for components
export const queueHealthData = async (
  type: OfflineData['type'],
  endpoint: string,
  data: any,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST'
): Promise<string> => {
  return syncManager.queueForSync(type, endpoint, data, method);
};

export const syncAllData = async (options?: SyncOptions): Promise<SyncResult> => {
  return syncManager.syncAll(options);
};

export const getSyncStatus = async () => {
  return syncManager.getSyncStatus();
};

export const retryFailedSync = async (): Promise<SyncResult> => {
  return syncManager.retryFailed();
};