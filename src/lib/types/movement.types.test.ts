import { describe, it, expect } from 'vitest';
import {
  validateMovementSession,
  validateCreateMovementSession,
  validateDailyAnchorRoutine,
  calculateSessionIntensity,
  calculateCompletionPercentage,
  getSessionTypeLabel,
  getIntensityLabel,
  type MovementSession,
  type Exercise,
  type DailyAnchorRoutine,
} from './movement.types';

describe('Movement Types', () => {
  describe('MovementSession validation', () => {
    const validExercises: Exercise[] = [
      {
        name: 'Deep Breathing',
        category: 'breathing',
        duration: 300,
        intensity: 2,
        completed: true,
      },
      {
        name: 'Gentle Neck Rolls',
        category: 'mobility',
        repetitions: 10,
        sets: 2,
        intensity: 3,
        completed: false,
      },
    ];

    const validMovementSession: MovementSession = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      date: '2024-01-15',
      sessionType: 'daily_anchor',
      phase: 'warmup',
      duration: 1200,
      intensity: 3,
      exercises: validExercises,
      preSessionEnergy: 6,
      postSessionFatigue: 4,
      postSessionBreath: 8,
      postSessionStability: 7,
      completed: false,
      completionPercentage: 50,
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-15T10:00:00Z'),
    };

    it('should validate a complete movement session', () => {
      expect(() => validateMovementSession(validMovementSession)).not.toThrow();
    });

    it('should validate session types', () => {
      const validTypes = ['daily_anchor', 'full_routine', 'quick_mobility', 'breathing_only', 'custom'];
      
      validTypes.forEach(type => {
        const session = { ...validMovementSession, sessionType: type };
        expect(() => validateMovementSession(session)).not.toThrow();
      });
    });

    it('should validate exercise categories', () => {
      const validCategories = ['breathing', 'mobility', 'stretching', 'resistance', 'balance', 'coordination', 'relaxation'];
      
      validCategories.forEach(category => {
        const exercise: Exercise = {
          name: 'Test Exercise',
          category: category as any,
          completed: false,
        };
        const session = { ...validMovementSession, exercises: [exercise] };
        expect(() => validateMovementSession(session)).not.toThrow();
      });
    });

    it('should validate intensity ratings within 1-10 range', () => {
      const validIntensities = [1, 5, 10];
      validIntensities.forEach(intensity => {
        const session = { ...validMovementSession, intensity };
        expect(() => validateMovementSession(session)).not.toThrow();
      });
    });

    it('should reject intensity ratings outside 1-10 range', () => {
      const invalidIntensities = [0, 11, -1];
      invalidIntensities.forEach(intensity => {
        const session = { ...validMovementSession, intensity };
        expect(() => validateMovementSession(session)).toThrow();
      });
    });

    it('should validate modification reasons', () => {
      const validReasons = ['low_energy', 'high_pain', 'time_constraint', 'equipment_unavailable', 'feeling_unwell', 'other'];
      
      validReasons.forEach(reason => {
        const session = { ...validMovementSession, modificationReason: reason as any };
        expect(() => validateMovementSession(session)).not.toThrow();
      });
    });
  });

  describe('CreateMovementSession validation', () => {
    it('should validate create data without id and timestamps', () => {
      const createData = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2024-01-15',
        sessionType: 'daily_anchor' as const,
        exercises: [],
        completed: false,
      };

      expect(() => validateCreateMovementSession(createData)).not.toThrow();
    });

    it('should accept create data with extra fields (Zod strips them)', () => {
      const createData = {
        id: '123e4567-e89b-12d3-a456-426614174000', // This will be stripped
        userId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2024-01-15',
        sessionType: 'daily_anchor' as const,
        exercises: [],
        completed: false,
      };

      const result = validateCreateMovementSession(createData);
      expect(result).not.toHaveProperty('id');
      expect(result.userId).toBe('123e4567-e89b-12d3-a456-426614174001');
    });
  });

  describe('DailyAnchorRoutine validation', () => {
    const validAnchorRoutine: DailyAnchorRoutine = {
      userId: '123e4567-e89b-12d3-a456-426614174001',
      date: '2024-01-15',
      breathingCompleted: true,
      breathingDuration: 300,
      mobilityCompleted: true,
      mobilityDuration: 600,
      stretchingCompleted: false,
      stretchingDuration: 0,
      fullyCompleted: false,
      totalDuration: 900,
      preEnergy: 6,
      postEnergy: 7,
      notes: 'Good session, felt energized after',
    };

    it('should validate a complete daily anchor routine', () => {
      expect(() => validateDailyAnchorRoutine(validAnchorRoutine)).not.toThrow();
    });

    it('should validate minimal daily anchor routine', () => {
      const minimalRoutine = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2024-01-15',
      };

      expect(() => validateDailyAnchorRoutine(minimalRoutine)).not.toThrow();
    });

    it('should validate energy ratings within 1-10 range', () => {
      const routine = { ...validAnchorRoutine, preEnergy: 1, postEnergy: 10 };
      expect(() => validateDailyAnchorRoutine(routine)).not.toThrow();
    });

    it('should reject energy ratings outside 1-10 range', () => {
      const routineWithInvalidPre = { ...validAnchorRoutine, preEnergy: 0 };
      const routineWithInvalidPost = { ...validAnchorRoutine, postEnergy: 11 };

      expect(() => validateDailyAnchorRoutine(routineWithInvalidPre)).toThrow();
      expect(() => validateDailyAnchorRoutine(routineWithInvalidPost)).toThrow();
    });
  });

  describe('Helper functions', () => {
    describe('calculateSessionIntensity', () => {
      it('should calculate average intensity from exercises', () => {
        const exercises: Exercise[] = [
          { name: 'Exercise 1', category: 'breathing', intensity: 2, completed: false },
          { name: 'Exercise 2', category: 'mobility', intensity: 4, completed: false },
          { name: 'Exercise 3', category: 'stretching', intensity: 6, completed: false },
        ];

        expect(calculateSessionIntensity(exercises)).toBe(4);
      });

      it('should handle exercises without intensity', () => {
        const exercises: Exercise[] = [
          { name: 'Exercise 1', category: 'breathing', completed: false },
          { name: 'Exercise 2', category: 'mobility', intensity: 4, completed: false },
        ];

        expect(calculateSessionIntensity(exercises)).toBe(3); // (1 + 4) / 2 = 2.5, rounded to 3
      });

      it('should return 1 for empty exercise array', () => {
        expect(calculateSessionIntensity([])).toBe(1);
      });
    });

    describe('calculateCompletionPercentage', () => {
      it('should calculate completion percentage correctly', () => {
        const exercises: Exercise[] = [
          { name: 'Exercise 1', category: 'breathing', completed: true },
          { name: 'Exercise 2', category: 'mobility', completed: true },
          { name: 'Exercise 3', category: 'stretching', completed: false },
          { name: 'Exercise 4', category: 'resistance', completed: false },
        ];

        expect(calculateCompletionPercentage(exercises)).toBe(50);
      });

      it('should return 100 for all completed exercises', () => {
        const exercises: Exercise[] = [
          { name: 'Exercise 1', category: 'breathing', completed: true },
          { name: 'Exercise 2', category: 'mobility', completed: true },
        ];

        expect(calculateCompletionPercentage(exercises)).toBe(100);
      });

      it('should return 0 for empty exercise array', () => {
        expect(calculateCompletionPercentage([])).toBe(0);
      });
    });

    describe('getSessionTypeLabel', () => {
      it('should return correct labels for session types', () => {
        expect(getSessionTypeLabel('daily_anchor')).toBe('Daily Anchor Routine');
        expect(getSessionTypeLabel('full_routine')).toBe('Full Movement Session');
        expect(getSessionTypeLabel('quick_mobility')).toBe('Quick Mobility');
        expect(getSessionTypeLabel('breathing_only')).toBe('Breathing Exercise');
        expect(getSessionTypeLabel('custom')).toBe('Custom Session');
        expect(getSessionTypeLabel('unknown')).toBe('unknown');
      });
    });

    describe('getIntensityLabel', () => {
      it('should return correct labels for intensity levels', () => {
        expect(getIntensityLabel(1)).toBe('Very Gentle');
        expect(getIntensityLabel(2)).toBe('Very Gentle');
        expect(getIntensityLabel(3)).toBe('Gentle');
        expect(getIntensityLabel(4)).toBe('Gentle');
        expect(getIntensityLabel(5)).toBe('Moderate');
        expect(getIntensityLabel(6)).toBe('Moderate');
        expect(getIntensityLabel(7)).toBe('Active');
        expect(getIntensityLabel(8)).toBe('Active');
        expect(getIntensityLabel(9)).toBe('Vigorous');
        expect(getIntensityLabel(10)).toBe('Vigorous');
      });
    });
  });
});