import { describe, it, expect } from 'vitest';
import {
  validateDailyHealthLog,
  validateCreateDailyHealthLog,
  validateUpdateDailyHealthLog,
  validateQuickHealthCheck,
  calculateHealthTrend,
  getHealthRatingLabel,
  getHealthRatingColor,
  type DailyHealthLog,
  type CreateDailyHealthLog,
  type Symptom,
} from './health-log.types';

describe('Health Log Types', () => {
  describe('DailyHealthLog validation', () => {
    const validHealthLog: DailyHealthLog = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      date: '2024-01-15',
      energyLevel: 7,
      fatigueLevel: 3,
      painLevel: 2,
      brainFogLevel: 4,
      sleepQuality: 8,
      sleepHours: 7.5,
      waterIntake: 2000,
      completedDailyAnchor: true,
      notes: 'Feeling good today',
      symptoms: [],
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-15T10:00:00Z'),
    };

    it('should validate a complete health log', () => {
      expect(() => validateDailyHealthLog(validHealthLog)).not.toThrow();
    });

    it('should validate health ratings within 1-10 range', () => {
      const validRatings = [1, 5, 10];
      validRatings.forEach(rating => {
        const log = { ...validHealthLog, energyLevel: rating };
        expect(() => validateDailyHealthLog(log)).not.toThrow();
      });
    });

    it('should reject health ratings outside 1-10 range', () => {
      const invalidRatings = [0, 11, -1, 15];
      invalidRatings.forEach(rating => {
        const log = { ...validHealthLog, energyLevel: rating };
        expect(() => validateDailyHealthLog(log)).toThrow();
      });
    });

    it('should validate symptoms array', () => {
      const validSymptoms: Symptom[] = [
        {
          type: 'fatigue',
          severity: 7,
          notes: 'Persistent fatigue after activity',
        },
        {
          type: 'pain',
          severity: 4,
          location: 'lower back',
        },
      ];

      const log = { ...validHealthLog, symptoms: validSymptoms };
      expect(() => validateDailyHealthLog(log)).not.toThrow();
    });

    it('should validate optional fields as undefined', () => {
      const minimalLog = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2024-01-15',
        completedDailyAnchor: false,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
      };

      expect(() => validateDailyHealthLog(minimalLog)).not.toThrow();
    });
  });

  describe('CreateDailyHealthLog validation', () => {
    it('should validate create data without id and timestamps', () => {
      const createData: CreateDailyHealthLog = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2024-01-15',
        energyLevel: 7,
        completedDailyAnchor: true,
      };

      expect(() => validateCreateDailyHealthLog(createData)).not.toThrow();
    });

    it('should accept create data with extra fields (Zod strips them)', () => {
      const createData = {
        id: '123e4567-e89b-12d3-a456-426614174000', // This will be stripped
        userId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2024-01-15',
        energyLevel: 7,
      };

      const result = validateCreateDailyHealthLog(createData);
      expect(result).not.toHaveProperty('id');
      expect(result.userId).toBe('123e4567-e89b-12d3-a456-426614174001');
    });
  });

  describe('UpdateDailyHealthLog validation', () => {
    it('should validate partial update data', () => {
      const updateData = {
        energyLevel: 8,
        notes: 'Updated notes',
      };

      expect(() => validateUpdateDailyHealthLog(updateData)).not.toThrow();
    });

    it('should strip userId and date from update data', () => {
      const updateDataWithUserId = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        energyLevel: 8,
      };

      const updateDataWithDate = {
        date: '2024-01-15',
        energyLevel: 8,
      };

      const result1 = validateUpdateDailyHealthLog(updateDataWithUserId);
      const result2 = validateUpdateDailyHealthLog(updateDataWithDate);

      expect(result1).not.toHaveProperty('userId');
      expect(result2).not.toHaveProperty('date');
      expect(result1.energyLevel).toBe(8);
      expect(result2.energyLevel).toBe(8);
    });
  });

  describe('QuickHealthCheck validation', () => {
    it('should validate quick health check data', () => {
      const quickCheck = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2024-01-15',
        energyLevel: 6,
        completedDailyAnchor: true,
      };

      expect(() => validateQuickHealthCheck(quickCheck)).not.toThrow();
    });

    it('should require energyLevel for quick check', () => {
      const quickCheck = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2024-01-15',
        completedDailyAnchor: true,
      };

      expect(() => validateQuickHealthCheck(quickCheck)).toThrow();
    });
  });

  describe('Helper functions', () => {
    describe('calculateHealthTrend', () => {
      it('should identify improving trend', () => {
        expect(calculateHealthTrend(7, 5)).toBe('improving');
        expect(calculateHealthTrend(6.8, 6.2)).toBe('improving');
      });

      it('should identify declining trend', () => {
        expect(calculateHealthTrend(5, 7)).toBe('declining');
        expect(calculateHealthTrend(6.2, 6.8)).toBe('declining');
      });

      it('should identify stable trend', () => {
        expect(calculateHealthTrend(6.5, 6.3)).toBe('stable');
        expect(calculateHealthTrend(7, 7)).toBe('stable');
      });

      it('should use custom threshold', () => {
        expect(calculateHealthTrend(6.8, 6.2, 1.0)).toBe('stable');
        expect(calculateHealthTrend(7.5, 6.0, 1.0)).toBe('improving');
      });
    });

    describe('getHealthRatingLabel', () => {
      it('should return correct labels for rating ranges', () => {
        expect(getHealthRatingLabel(1)).toBe('Very Low');
        expect(getHealthRatingLabel(2)).toBe('Very Low');
        expect(getHealthRatingLabel(3)).toBe('Low');
        expect(getHealthRatingLabel(4)).toBe('Low');
        expect(getHealthRatingLabel(5)).toBe('Moderate');
        expect(getHealthRatingLabel(6)).toBe('Moderate');
        expect(getHealthRatingLabel(7)).toBe('Good');
        expect(getHealthRatingLabel(8)).toBe('Good');
        expect(getHealthRatingLabel(9)).toBe('Excellent');
        expect(getHealthRatingLabel(10)).toBe('Excellent');
      });
    });

    describe('getHealthRatingColor', () => {
      it('should return appropriate color classes', () => {
        expect(getHealthRatingColor(1)).toBe('text-red-600');
        expect(getHealthRatingColor(3)).toBe('text-orange-600');
        expect(getHealthRatingColor(5)).toBe('text-yellow-600');
        expect(getHealthRatingColor(7)).toBe('text-green-600');
        expect(getHealthRatingColor(9)).toBe('text-emerald-600');
      });
    });
  });
});