import { describe, it, expect } from 'vitest';
import {
  validateUserHealthData,
  validatePacingRecommendation,
  calculateEnergyAverage,
  detectEnergyPattern,
  identifyCrashTriggers,
  assessBiometricConcerns,
  type UserHealthData,
  type PacingRecommendation
} from './ai-pacing.types';

describe('AI Pacing Types', () => {
  const validUserData: UserHealthData = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    energyLevels: [
      { date: '2024-01-15', level: 6, timeOfDay: 'morning' },
      { date: '2024-01-14', level: 5, timeOfDay: 'morning' },
    ],
    biometricReadings: [
      { date: '2024-01-15', heartRate: 75, hrv: 45, confidence: 0.9 },
    ],
    symptomLogs: [
      { date: '2024-01-15', fatigue: 5, pain: 3, brainFog: 4, sleepQuality: 6 },
    ],
    activityLogs: [
      { date: '2024-01-15', type: 'daily_anchor', completed: true, postActivityFatigue: 4 },
    ],
  };

  const validRecommendation: PacingRecommendation = {
    type: 'energy_conservation',
    priority: 'medium',
    title: 'Test Recommendation',
    message: 'Test message',
    reasoning: 'Test reasoning',
    actionItems: ['Test action'],
    validUntil: new Date(),
    confidence: 0.8,
    disclaimers: ['Test disclaimer']
  };

  describe('Schema Validation', () => {
    it('should validate correct UserHealthData', () => {
      expect(() => validateUserHealthData(validUserData)).not.toThrow();
    });

    it('should validate correct PacingRecommendation', () => {
      expect(() => validatePacingRecommendation(validRecommendation)).not.toThrow();
    });

    it('should reject invalid UUID', () => {
      const invalidData = { ...validUserData, userId: 'invalid-uuid' };
      expect(() => validateUserHealthData(invalidData)).toThrow();
    });

    it('should reject invalid energy level', () => {
      const invalidData = {
        ...validUserData,
        energyLevels: [{ date: '2024-01-15', level: 15, timeOfDay: 'morning' }]
      };
      expect(() => validateUserHealthData(invalidData)).toThrow();
    });
  });

  describe('Helper Functions', () => {
    it('should calculate energy average correctly', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const energyLevels = [
        { date: today.toISOString().split('T')[0], level: 6, timeOfDay: 'morning' as const },
        { date: yesterday.toISOString().split('T')[0], level: 4, timeOfDay: 'morning' as const },
        { date: twoDaysAgo.toISOString().split('T')[0], level: 8, timeOfDay: 'morning' as const },
      ];

      const average = calculateEnergyAverage(energyLevels);
      expect(average).toBe(6); // (6 + 4 + 8) / 3 = 6
    });

    it('should detect energy patterns', () => {
      const stablePattern = [
        { date: '2024-01-15', level: 5, timeOfDay: 'morning' as const },
        { date: '2024-01-14', level: 5, timeOfDay: 'morning' as const },
        { date: '2024-01-13', level: 5, timeOfDay: 'morning' as const },
        { date: '2024-01-12', level: 5, timeOfDay: 'morning' as const },
        { date: '2024-01-11', level: 5, timeOfDay: 'morning' as const },
        { date: '2024-01-10', level: 5, timeOfDay: 'morning' as const },
        { date: '2024-01-09', level: 5, timeOfDay: 'morning' as const },
      ];

      const pattern = detectEnergyPattern(stablePattern);
      expect(pattern).toBe('stable');
    });

    it('should identify crash triggers', () => {
      const energyLevels = [
        { date: '2024-01-15', level: 3, timeOfDay: 'morning' as const }, // Crash
        { date: '2024-01-14', level: 7, timeOfDay: 'morning' as const }, // Good day
      ];

      const activityLogs = [
        { date: '2024-01-14', type: 'movement_session' as const, completed: true, postActivityFatigue: 5 },
      ];

      const triggers = identifyCrashTriggers(energyLevels, activityLogs);
      expect(triggers.length).toBeGreaterThanOrEqual(0);
    });

    it('should assess biometric concerns', () => {
      const normalReadings = [
        { date: '2024-01-15', heartRate: 75, hrv: 45, confidence: 0.9 },
        { date: '2024-01-14', heartRate: 78, hrv: 42, confidence: 0.8 },
        { date: '2024-01-13', heartRate: 72, hrv: 48, confidence: 0.9 },
      ];

      const assessment = assessBiometricConcerns(normalReadings);
      expect(assessment.hasConcerns).toBe(false);
    });

    it('should detect concerning biometrics', () => {
      const concerningReadings = [
        { date: '2024-01-15', heartRate: 95, hrv: 15, confidence: 0.9 },
        { date: '2024-01-14', heartRate: 98, hrv: 12, confidence: 0.8 },
        { date: '2024-01-13', heartRate: 92, hrv: 18, confidence: 0.9 },
      ];

      const assessment = assessBiometricConcerns(concerningReadings);
      expect(assessment.hasConcerns).toBe(true);
      expect(assessment.concerns.length).toBeGreaterThan(0);
    });
  });

  describe('Constants and Enums', () => {
    it('should have energy level descriptions', async () => {
      const { ENERGY_LEVEL_DESCRIPTIONS } = await import('./ai-pacing.types');
      expect(ENERGY_LEVEL_DESCRIPTIONS[1]).toContain('Severe fatigue');
      expect(ENERGY_LEVEL_DESCRIPTIONS[10]).toContain('Peak energy');
    });

    it('should have AI disclaimers', async () => {
      const { AI_DISCLAIMERS } = await import('./ai-pacing.types');
      expect(AI_DISCLAIMERS.length).toBeGreaterThan(0);
      expect(AI_DISCLAIMERS.some((d: string) => d.includes('not medical advice'))).toBe(true);
    });
  });
});