import { SymptomService } from './symptom.service';
import { db } from '../connection';
import { dailyHealthLogs } from '../schema';
import { type SymptomEntry } from '../../types/symptom.types';

// Mock the database connection and utilities
jest.mock('../connection', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../utils', () => ({
  handleDatabaseError: jest.fn((error) => { throw error; }),
  NotFoundError: class NotFoundError extends Error {
    constructor(resource: string, id: string) {
      super(`${resource} with id ${id} not found`);
    }
  },
  withRetry: jest.fn((fn) => fn()),
  calculatePagination: jest.fn((page, limit, total) => ({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
    offset: (page - 1) * limit,
  })),
  formatDateForDB: jest.fn((date) => date.toISOString().split('T')[0]),
}));

const mockDb = db as jest.Mocked<typeof db>;

describe('SymptomService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertSymptomLog', () => {
    it('creates new symptom log when none exists', async () => {
      const mockSymptomData = {
        fatigueLevel: 7,
        brainFogLevel: 5,
        symptoms: [
          {
            type: 'headache' as const,
            severity: 6,
            timestamp: new Date(),
          },
        ] as SymptomEntry[],
        notes: 'Test notes',
      };

      // Mock select to return empty result (no existing log)
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      } as any);

      // Mock insert to return new log
      const mockNewLog = {
        id: 'new-log-id',
        userId: 'test-user',
        date: '2024-01-15',
        ...mockSymptomData,
        symptoms: JSON.stringify(mockSymptomData.symptoms),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockNewLog]),
        }),
      } as any);

      const result = await SymptomService.upsertSymptomLog(
        'test-user',
        '2024-01-15',
        mockSymptomData
      );

      expect(result).toEqual(mockNewLog);
      expect(mockDb.insert).toHaveBeenCalledWith(dailyHealthLogs);
    });

    it('updates existing symptom log when one exists', async () => {
      const mockSymptomData = {
        fatigueLevel: 8,
        brainFogLevel: 6,
        notes: 'Updated notes',
      };

      const existingLog = {
        id: 'existing-log-id',
        userId: 'test-user',
        date: '2024-01-15',
        fatigueLevel: 5,
        brainFogLevel: 4,
        notes: 'Old notes',
      };

      // Mock select to return existing log
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([existingLog]),
        }),
      } as any);

      // Mock update to return updated log
      const mockUpdatedLog = {
        ...existingLog,
        ...mockSymptomData,
        updatedAt: new Date(),
      };

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUpdatedLog]),
          }),
        }),
      } as any);

      const result = await SymptomService.upsertSymptomLog(
        'test-user',
        '2024-01-15',
        mockSymptomData
      );

      expect(result).toEqual(mockUpdatedLog);
      expect(mockDb.update).toHaveBeenCalledWith(dailyHealthLogs);
    });
  });

  describe('getSymptomLogs', () => {
    it('returns paginated symptom logs for date range', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          userId: 'test-user',
          date: '2024-01-15',
          fatigueLevel: 7,
          brainFogLevel: 5,
        },
        {
          id: 'log-2',
          userId: 'test-user',
          date: '2024-01-14',
          fatigueLevel: 6,
          brainFogLevel: 4,
        },
      ];

      // Mock count query
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ total: 2 }]),
        }),
      } as any);

      // Mock data query
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue(mockLogs),
              }),
            }),
          }),
        }),
      } as any);

      const result = await SymptomService.getSymptomLogs(
        'test-user',
        '2024-01-14',
        '2024-01-15',
        { page: 1, limit: 10 }
      );

      expect(result.data).toEqual(mockLogs);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe('calculateProgressMetrics', () => {
    it('calculates progress metrics correctly', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          date: '2024-01-15',
          fatigueLevel: 7,
          brainFogLevel: 5,
          sleepQuality: 6,
          symptoms: JSON.stringify([
            { type: 'headache', severity: 6 },
            { type: 'muscle_pain', severity: 4 },
          ]),
        },
        {
          id: 'log-2',
          date: '2024-01-14',
          fatigueLevel: 5,
          brainFogLevel: 3,
          sleepQuality: 7,
          symptoms: JSON.stringify([
            { type: 'headache', severity: 5 },
          ]),
        },
        {
          id: 'log-3',
          date: '2024-01-13',
          fatigueLevel: 3,
          brainFogLevel: 2,
          sleepQuality: 8,
          symptoms: null,
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockLogs),
          }),
        }),
      } as any);

      const result = await SymptomService.calculateProgressMetrics(
        'test-user',
        '2024-01-13',
        '2024-01-15'
      );

      expect(result.averageFatigue).toBe(5.0); // (7 + 5 + 3) / 3
      expect(result.averageBrainFog).toBe(3.3); // (5 + 3 + 2) / 3
      expect(result.averageSleep).toBe(7.0); // (6 + 7 + 8) / 3
      expect(result.goodDays).toBe(1); // Only one day with fatigue <= 4
      expect(result.difficultDays).toBe(1); // Only one day with fatigue >= 7
      expect(result.topSymptoms).toHaveLength(2); // headache and muscle_pain
    });

    it('handles empty logs gracefully', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const result = await SymptomService.calculateProgressMetrics(
        'test-user',
        '2024-01-13',
        '2024-01-15'
      );

      expect(result.averageFatigue).toBeNull();
      expect(result.averageBrainFog).toBeNull();
      expect(result.averageSleep).toBeNull();
      expect(result.fatiguetrend).toBe('insufficient_data');
      expect(result.goodDays).toBe(0);
      expect(result.difficultDays).toBe(0);
      expect(result.topSymptoms).toEqual([]);
    });
  });

  describe('getSymptomTrends', () => {
    it('returns symptom trends for core symptoms', async () => {
      const mockLogs = [
        {
          date: '2024-01-15',
          fatigueLevel: 7,
          brainFogLevel: 5,
          sleepQuality: 6,
          symptoms: null,
        },
        {
          date: '2024-01-14',
          fatigueLevel: 5,
          brainFogLevel: 3,
          sleepQuality: 7,
          symptoms: null,
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockLogs),
          }),
        }),
      } as any);

      const result = await SymptomService.getSymptomTrends(
        'test-user',
        'fatigue',
        30
      );

      expect(result).toEqual([
        { date: '2024-01-15', severity: 7 },
        { date: '2024-01-14', severity: 5 },
      ]);
    });

    it('returns symptom trends for additional symptoms', async () => {
      const mockLogs = [
        {
          date: '2024-01-15',
          fatigueLevel: 7,
          symptoms: JSON.stringify([
            { type: 'headache', severity: 6 },
          ]),
        },
        {
          date: '2024-01-14',
          fatigueLevel: 5,
          symptoms: JSON.stringify([
            { type: 'headache', severity: 4 },
          ]),
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockLogs),
          }),
        }),
      } as any);

      const result = await SymptomService.getSymptomTrends(
        'test-user',
        'headache',
        30
      );

      expect(result).toEqual([
        { date: '2024-01-15', severity: 6 },
        { date: '2024-01-14', severity: 4 },
      ]);
    });
  });

  describe('analyzeSymptomCorrelations', () => {
    it('calculates correlations between symptoms', async () => {
      const mockLogs = [
        {
          date: '2024-01-15',
          fatigueLevel: 8,
          brainFogLevel: 7,
          symptoms: null,
        },
        {
          date: '2024-01-14',
          fatigueLevel: 6,
          brainFogLevel: 5,
          symptoms: null,
        },
        {
          date: '2024-01-13',
          fatigueLevel: 4,
          brainFogLevel: 3,
          symptoms: null,
        },
        {
          date: '2024-01-12',
          fatigueLevel: 2,
          brainFogLevel: 2,
          symptoms: null,
        },
        {
          date: '2024-01-11',
          fatigueLevel: 7,
          brainFogLevel: 6,
          symptoms: null,
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockLogs),
        }),
      } as any);

      const result = await SymptomService.analyzeSymptomCorrelations(
        'test-user',
        90
      );

      expect(result).toHaveLength(1); // Only fatigue-brain_fog correlation
      expect(result[0].symptom1).toBe('fatigue');
      expect(result[0].symptom2).toBe('brain_fog');
      expect(result[0].correlation).toBeGreaterThan(0.8); // Strong positive correlation
      expect(result[0].sampleSize).toBe(5);
    });

    it('filters out weak correlations', async () => {
      const mockLogs = [
        {
          date: '2024-01-15',
          fatigueLevel: 5,
          brainFogLevel: 3,
          symptoms: null,
        },
        {
          date: '2024-01-14',
          fatigueLevel: 4,
          brainFogLevel: 7,
          symptoms: null,
        },
        {
          date: '2024-01-13',
          fatigueLevel: 6,
          brainFogLevel: 2,
          symptoms: null,
        },
        {
          date: '2024-01-12',
          fatigueLevel: 3,
          brainFogLevel: 8,
          symptoms: null,
        },
        {
          date: '2024-01-11',
          fatigueLevel: 7,
          brainFogLevel: 1,
          symptoms: null,
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockLogs),
        }),
      } as any);

      const result = await SymptomService.analyzeSymptomCorrelations(
        'test-user',
        90
      );

      // Should filter out weak correlations (< 0.3)
      expect(result).toHaveLength(0);
    });
  });

  describe('correlation calculation helpers', () => {
    it('calculates correlation significance correctly', () => {
      // Access private method through any cast for testing
      const service = SymptomService as any;
      
      expect(service.getCorrelationSignificance(0.8, 25)).toBe('high');
      expect(service.getCorrelationSignificance(0.6, 15)).toBe('moderate');
      expect(service.getCorrelationSignificance(0.4, 10)).toBe('low');
      expect(service.getCorrelationSignificance(0.2, 5)).toBe('low');
    });

    it('calculates Pearson correlation correctly', () => {
      // Access private method through any cast for testing
      const service = SymptomService as any;
      
      // Perfect positive correlation
      const perfectPositive: Array<[number, number]> = [[1, 1], [2, 2], [3, 3], [4, 4]];
      expect(service.calculateCorrelation(perfectPositive)).toBeCloseTo(1, 2);
      
      // Perfect negative correlation
      const perfectNegative: Array<[number, number]> = [[1, 4], [2, 3], [3, 2], [4, 1]];
      expect(service.calculateCorrelation(perfectNegative)).toBeCloseTo(-1, 2);
      
      // No correlation
      const noCorrelation: Array<[number, number]> = [[1, 3], [2, 1], [3, 4], [4, 2]];
      expect(Math.abs(service.calculateCorrelation(noCorrelation))).toBeLessThan(0.5);
    });
  });
});