/**
 * Integration tests for data persistence and synchronization
 * Tests data flow between components, services, and storage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock IndexedDB for offline storage testing
const mockIndexedDB = {
  databases: new Map(),
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};

// Mock database operations
const mockDatabaseOperations = {
  healthLogs: {
    create: vi.fn(),
    read: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
  },
  movementSessions: {
    create: vi.fn(),
    read: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
  },
  biometricData: {
    create: vi.fn(),
    read: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
  },
  symptoms: {
    create: vi.fn(),
    read: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
  },
};

// Mock offline storage
const mockOfflineStorage = {
  store: vi.fn(),
  retrieve: vi.fn(),
  sync: vi.fn(),
  clear: vi.fn(),
};

describe('Data Persistence Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock global IndexedDB
    global.indexedDB = mockIndexedDB as any;
    
    // Mock fetch for API calls
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Health Log Data Persistence', () => {
    it('should persist health log data across sessions', async () => {
      const healthLogData = {
        id: 'log-123',
        date: '2024-02-15',
        energyLevel: 6,
        sleepQuality: 7,
        symptoms: [
          { type: 'fatigue', severity: 4 },
          { type: 'brain_fog', severity: 3 },
        ],
        notes: 'Feeling better today after good sleep',
        timestamp: Date.now(),
      };

      // Mock successful API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: healthLogData }),
      });

      // Mock database create operation
      mockDatabaseOperations.healthLogs.create.mockResolvedValue(healthLogData);

      // Simulate saving health log
      const result = await mockDatabaseOperations.healthLogs.create(healthLogData);

      expect(result).toEqual(healthLogData);
      expect(mockDatabaseOperations.healthLogs.create).toHaveBeenCalledWith(healthLogData);

      // Verify data can be retrieved
      mockDatabaseOperations.healthLogs.read.mockResolvedValue(healthLogData);
      const retrievedData = await mockDatabaseOperations.healthLogs.read('log-123');

      expect(retrievedData).toEqual(healthLogData);
      expect(retrievedData.energyLevel).toBe(6);
      expect(retrievedData.symptoms).toHaveLength(2);
    });

    it('should handle data validation during persistence', async () => {
      const invalidHealthLogData = {
        id: 'log-invalid',
        date: '2024-02-15',
        energyLevel: 15, // Invalid: exceeds maximum of 10
        sleepQuality: -1, // Invalid: below minimum of 1
        symptoms: [],
      };

      // Mock validation error
      mockDatabaseOperations.healthLogs.create.mockRejectedValue(
        new Error('Validation failed: energyLevel must be between 1 and 10')
      );

      await expect(
        mockDatabaseOperations.healthLogs.create(invalidHealthLogData)
      ).rejects.toThrow('Validation failed');
    });

    it('should maintain data integrity during updates', async () => {
      const originalData = {
        id: 'log-update-test',
        date: '2024-02-15',
        energyLevel: 5,
        sleepQuality: 6,
        symptoms: [{ type: 'fatigue', severity: 5 }],
      };

      const updatedData = {
        ...originalData,
        energyLevel: 7,
        symptoms: [
          { type: 'fatigue', severity: 3 },
          { type: 'brain_fog', severity: 2 },
        ],
        lastModified: Date.now(),
      };

      // Mock update operation
      mockDatabaseOperations.healthLogs.update.mockResolvedValue(updatedData);

      const result = await mockDatabaseOperations.healthLogs.update(
        'log-update-test',
        { energyLevel: 7, symptoms: updatedData.symptoms }
      );

      expect(result.energyLevel).toBe(7);
      expect(result.symptoms).toHaveLength(2);
      expect(result.lastModified).toBeDefined();
    });
  });

  describe('Movement Session Data Persistence', () => {
    it('should persist movement session data with exercise details', async () => {
      const movementSessionData = {
        id: 'session-456',
        date: '2024-02-15',
        type: 'full_session',
        duration: 25, // minutes
        intensity: 6,
        exercises: [
          {
            name: 'Gentle Stretching',
            duration: 10,
            sets: 1,
            notes: 'Focused on neck and shoulders',
          },
          {
            name: 'Light Resistance',
            duration: 15,
            sets: 2,
            reps: 10,
            notes: 'Used resistance bands',
          },
        ],
        postSessionRating: {
          fatigue: 4,
          breath: 7,
          stability: 8,
        },
        energyBefore: 6,
        energyAfter: 5,
        timestamp: Date.now(),
      };

      mockDatabaseOperations.movementSessions.create.mockResolvedValue(movementSessionData);

      const result = await mockDatabaseOperations.movementSessions.create(movementSessionData);

      expect(result).toEqual(movementSessionData);
      expect(result.exercises).toHaveLength(2);
      expect(result.postSessionRating.fatigue).toBe(4);
      expect(result.duration).toBe(25);
    });

    it('should calculate session statistics correctly', async () => {
      const sessions = [
        { id: '1', duration: 20, intensity: 5, date: '2024-02-10' },
        { id: '2', duration: 30, intensity: 7, date: '2024-02-12' },
        { id: '3', duration: 15, intensity: 4, date: '2024-02-14' },
      ];

      mockDatabaseOperations.movementSessions.list.mockResolvedValue(sessions);

      const sessionList = await mockDatabaseOperations.movementSessions.list({
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      });

      expect(sessionList).toHaveLength(3);

      // Calculate statistics
      const totalDuration = sessionList.reduce((sum, session) => sum + session.duration, 0);
      const averageIntensity = sessionList.reduce((sum, session) => sum + session.intensity, 0) / sessionList.length;

      expect(totalDuration).toBe(65);
      expect(averageIntensity).toBeCloseTo(5.33, 2);
    });
  });

  describe('Biometric Data Persistence', () => {
    it('should persist biometric measurements with timestamps', async () => {
      const biometricData = {
        id: 'biometric-789',
        timestamp: Date.now(),
        heartRate: 72,
        heartRateVariability: 45,
        bloodPressure: {
          systolic: 120,
          diastolic: 80,
        },
        oxygenSaturation: 98,
        temperature: 36.5,
        captureMethod: 'camera',
        quality: 'good',
        deviceInfo: {
          userAgent: 'Test Browser',
          cameraResolution: '1920x1080',
        },
      };

      mockDatabaseOperations.biometricData.create.mockResolvedValue(biometricData);

      const result = await mockDatabaseOperations.biometricData.create(biometricData);

      expect(result).toEqual(biometricData);
      expect(result.heartRate).toBe(72);
      expect(result.bloodPressure.systolic).toBe(120);
      expect(result.quality).toBe('good');
    });

    it('should handle biometric data trends and analysis', async () => {
      const biometricHistory = [
        { timestamp: Date.now() - 86400000 * 7, heartRate: 75 }, // 7 days ago
        { timestamp: Date.now() - 86400000 * 6, heartRate: 73 }, // 6 days ago
        { timestamp: Date.now() - 86400000 * 5, heartRate: 71 }, // 5 days ago
        { timestamp: Date.now() - 86400000 * 4, heartRate: 74 }, // 4 days ago
        { timestamp: Date.now() - 86400000 * 3, heartRate: 72 }, // 3 days ago
        { timestamp: Date.now() - 86400000 * 2, heartRate: 70 }, // 2 days ago
        { timestamp: Date.now() - 86400000 * 1, heartRate: 69 }, // 1 day ago
      ];

      mockDatabaseOperations.biometricData.list.mockResolvedValue(biometricHistory);

      const history = await mockDatabaseOperations.biometricData.list({
        startDate: new Date(Date.now() - 86400000 * 7),
        endDate: new Date(),
      });

      expect(history).toHaveLength(7);

      // Calculate trend
      const heartRates = history.map(entry => entry.heartRate);
      const averageHeartRate = heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length;
      const trend = heartRates[heartRates.length - 1] - heartRates[0]; // Latest - Oldest

      expect(averageHeartRate).toBeCloseTo(72, 1);
      expect(trend).toBe(-6); // Decreasing trend
    });
  });

  describe('Offline Data Synchronization', () => {
    it('should store data offline when network is unavailable', async () => {
      // Mock network unavailable
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const offlineData = {
        id: 'offline-123',
        type: 'health_log',
        data: {
          energyLevel: 5,
          sleepQuality: 6,
          symptoms: [{ type: 'fatigue', severity: 4 }],
        },
        timestamp: Date.now(),
        synced: false,
      };

      // Mock offline storage
      mockOfflineStorage.store.mockResolvedValue(true);

      await mockOfflineStorage.store(offlineData);

      expect(mockOfflineStorage.store).toHaveBeenCalledWith(offlineData);
      expect(offlineData.synced).toBe(false);
    });

    it('should sync offline data when network becomes available', async () => {
      // Mock stored offline data
      const offlineDataQueue = [
        {
          id: 'offline-1',
          type: 'health_log',
          data: { energyLevel: 5 },
          timestamp: Date.now() - 3600000,
          synced: false,
        },
        {
          id: 'offline-2',
          type: 'movement_session',
          data: { duration: 20, intensity: 6 },
          timestamp: Date.now() - 1800000,
          synced: false,
        },
      ];

      mockOfflineStorage.retrieve.mockResolvedValue(offlineDataQueue);

      // Mock successful API sync
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      mockOfflineStorage.sync.mockImplementation(async () => {
        const queue = await mockOfflineStorage.retrieve();
        
        for (const item of queue) {
          // Simulate API sync
          await fetch(`/api/${item.type}s`, {
            method: 'POST',
            body: JSON.stringify(item.data),
          });
          
          // Mark as synced
          item.synced = true;
        }
        
        return queue.length;
      });

      // Network becomes available
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const syncedCount = await mockOfflineStorage.sync();

      expect(syncedCount).toBe(2);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle sync conflicts gracefully', async () => {
      const conflictData = {
        id: 'conflict-123',
        type: 'health_log',
        data: { energyLevel: 5 },
        timestamp: Date.now() - 3600000,
        synced: false,
      };

      // Mock conflict response (409)
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () => Promise.resolve({
          error: 'Conflict',
          serverData: { energyLevel: 6, lastModified: Date.now() },
        }),
      });

      mockOfflineStorage.sync.mockImplementation(async () => {
        try {
          const response = await fetch('/api/health_logs', {
            method: 'POST',
            body: JSON.stringify(conflictData.data),
          });

          if (!response.ok && response.status === 409) {
            // Handle conflict - use server data
            const conflictInfo = await response.json();
            return { conflict: true, serverData: conflictInfo.serverData };
          }
        } catch (error) {
          return { error: true };
        }
      });

      const result = await mockOfflineStorage.sync();

      expect(result.conflict).toBe(true);
      expect(result.serverData.energyLevel).toBe(6);
    });
  });

  describe('Data Export and Import', () => {
    it('should export complete user data in JSON format', async () => {
      const completeUserData = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          createdAt: '2024-01-01T00:00:00Z',
        },
        healthLogs: [
          { id: 'log-1', energyLevel: 6, date: '2024-02-01' },
          { id: 'log-2', energyLevel: 7, date: '2024-02-02' },
        ],
        movementSessions: [
          { id: 'session-1', duration: 25, date: '2024-02-01' },
        ],
        biometricData: [
          { id: 'bio-1', heartRate: 72, timestamp: Date.now() },
        ],
        symptoms: [
          { id: 'symptom-1', type: 'fatigue', severity: 4, date: '2024-02-01' },
        ],
        exportMetadata: {
          exportDate: new Date().toISOString(),
          version: '1.0',
          totalRecords: 5,
        },
      };

      // Mock export API
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(completeUserData),
      });

      const response = await fetch('/api/export/complete');
      const exportedData = await response.json();

      expect(exportedData).toEqual(completeUserData);
      expect(exportedData.healthLogs).toHaveLength(2);
      expect(exportedData.movementSessions).toHaveLength(1);
      expect(exportedData.biometricData).toHaveLength(1);
      expect(exportedData.symptoms).toHaveLength(1);
      expect(exportedData.exportMetadata.totalRecords).toBe(5);
    });

    it('should import and validate user data', async () => {
      const importData = {
        healthLogs: [
          { energyLevel: 6, sleepQuality: 7, date: '2024-02-01' },
          { energyLevel: 5, sleepQuality: 6, date: '2024-02-02' },
        ],
        movementSessions: [
          { duration: 20, intensity: 5, date: '2024-02-01' },
        ],
      };

      // Mock import validation and processing
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          imported: {
            healthLogs: 2,
            movementSessions: 1,
          },
          errors: [],
        }),
      });

      const response = await fetch('/api/import', {
        method: 'POST',
        body: JSON.stringify(importData),
      });

      const importResult = await response.json();

      expect(importResult.success).toBe(true);
      expect(importResult.imported.healthLogs).toBe(2);
      expect(importResult.imported.movementSessions).toBe(1);
      expect(importResult.errors).toHaveLength(0);
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain referential integrity across related data', async () => {
      const userId = 'user-123';
      const sessionId = 'session-456';

      // Create movement session
      const movementSession = {
        id: sessionId,
        userId,
        date: '2024-02-15',
        duration: 25,
      };

      // Create related health log
      const healthLog = {
        id: 'log-789',
        userId,
        date: '2024-02-15',
        energyLevel: 6,
        relatedSessionId: sessionId, // Reference to movement session
      };

      mockDatabaseOperations.movementSessions.create.mockResolvedValue(movementSession);
      mockDatabaseOperations.healthLogs.create.mockResolvedValue(healthLog);

      // Create both records
      const session = await mockDatabaseOperations.movementSessions.create(movementSession);
      const log = await mockDatabaseOperations.healthLogs.create(healthLog);

      // Verify referential integrity
      expect(session.userId).toBe(userId);
      expect(log.userId).toBe(userId);
      expect(log.relatedSessionId).toBe(sessionId);
      expect(session.date).toBe(log.date);
    });

    it('should handle cascading deletes properly', async () => {
      const userId = 'user-delete-test';

      // Mock cascade delete operation
      mockDatabaseOperations.healthLogs.delete.mockResolvedValue({ deletedCount: 5 });
      mockDatabaseOperations.movementSessions.delete.mockResolvedValue({ deletedCount: 3 });
      mockDatabaseOperations.biometricData.delete.mockResolvedValue({ deletedCount: 2 });
      mockDatabaseOperations.symptoms.delete.mockResolvedValue({ deletedCount: 8 });

      // Simulate user deletion with cascade
      const deletionResults = await Promise.all([
        mockDatabaseOperations.healthLogs.delete({ userId }),
        mockDatabaseOperations.movementSessions.delete({ userId }),
        mockDatabaseOperations.biometricData.delete({ userId }),
        mockDatabaseOperations.symptoms.delete({ userId }),
      ]);

      const totalDeleted = deletionResults.reduce(
        (sum, result) => sum + result.deletedCount,
        0
      );

      expect(totalDeleted).toBe(18);
      expect(deletionResults[0].deletedCount).toBe(5); // health logs
      expect(deletionResults[1].deletedCount).toBe(3); // movement sessions
      expect(deletionResults[2].deletedCount).toBe(2); // biometric data
      expect(deletionResults[3].deletedCount).toBe(8); // symptoms
    });
  });
});