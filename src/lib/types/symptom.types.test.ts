import {
  SymptomTypeSchema,
  SymptomEntrySchema,
  DailySymptomLogSchema,
  QuickSymptomCheckSchema,
  validateSymptomEntry,
  validateDailySymptomLog,
  validateQuickSymptomCheck,
  getSymptomDisplayName,
  getSeverityLabel,
  getSeverityColor,
  getWellbeingLabel,
  getActivityLevelLabel,
  type SymptomType,
  type SymptomEntry,
} from './symptom.types';

describe('Symptom Types', () => {
  describe('SymptomTypeSchema', () => {
    it('validates valid symptom types', () => {
      const validSymptoms = [
        'fatigue',
        'post_exertional_malaise',
        'brain_fog',
        'headache',
        'muscle_pain',
        'joint_pain',
        'nausea',
        'dizziness',
        'heart_palpitations',
        'sleep_disturbance',
        'anxiety',
        'depression',
        'other',
      ];

      validSymptoms.forEach(symptom => {
        expect(() => SymptomTypeSchema.parse(symptom)).not.toThrow();
      });
    });

    it('rejects invalid symptom types', () => {
      const invalidSymptoms = [
        'invalid_symptom',
        'random_text',
        123,
        null,
        undefined,
        {},
      ];

      invalidSymptoms.forEach(symptom => {
        expect(() => SymptomTypeSchema.parse(symptom)).toThrow();
      });
    });
  });

  describe('SymptomEntrySchema', () => {
    it('validates valid symptom entry', () => {
      const validEntry = {
        type: 'fatigue',
        severity: 7,
        location: 'whole body',
        duration: 'all_day',
        triggers: ['exercise', 'stress'],
        notes: 'Feeling very tired today',
        timestamp: new Date(),
      };

      expect(() => SymptomEntrySchema.parse(validEntry)).not.toThrow();
    });

    it('validates minimal symptom entry', () => {
      const minimalEntry = {
        type: 'headache',
        severity: 5,
      };

      expect(() => SymptomEntrySchema.parse(minimalEntry)).not.toThrow();
    });

    it('rejects invalid severity values', () => {
      const invalidEntries = [
        { type: 'fatigue', severity: 0 }, // too low
        { type: 'fatigue', severity: 11 }, // too high
        { type: 'fatigue', severity: 5.5 }, // not integer
        { type: 'fatigue', severity: 'high' }, // not number
      ];

      invalidEntries.forEach(entry => {
        expect(() => SymptomEntrySchema.parse(entry)).toThrow();
      });
    });

    it('rejects entries with too many triggers', () => {
      const entryWithTooManyTriggers = {
        type: 'fatigue',
        severity: 5,
        triggers: ['trigger1', 'trigger2', 'trigger3', 'trigger4', 'trigger5', 'trigger6'],
      };

      expect(() => SymptomEntrySchema.parse(entryWithTooManyTriggers)).toThrow();
    });

    it('rejects entries with notes too long', () => {
      const entryWithLongNotes = {
        type: 'fatigue',
        severity: 5,
        notes: 'a'.repeat(301), // exceeds 300 character limit
      };

      expect(() => SymptomEntrySchema.parse(entryWithLongNotes)).toThrow();
    });
  });

  describe('DailySymptomLogSchema', () => {
    it('validates complete daily symptom log', () => {
      const validLog = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2024-01-15',
        fatigueLevel: 7,
        postExertionalMalaise: 6,
        brainFogLevel: 5,
        sleepQuality: 4,
        symptoms: [
          {
            type: 'headache',
            severity: 6,
            location: 'temples',
            notes: 'Throbbing pain',
          },
        ],
        overallWellbeing: 5,
        activityLevel: 'limited_activity',
        moodRating: 6,
        anxietyLevel: 4,
        notes: 'Had a difficult day overall',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => DailySymptomLogSchema.parse(validLog)).not.toThrow();
    });

    it('validates minimal daily symptom log', () => {
      const minimalLog = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2024-01-15',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => DailySymptomLogSchema.parse(minimalLog)).not.toThrow();
    });

    it('rejects logs with too many symptoms', () => {
      const symptoms = Array.from({ length: 21 }, (_, i) => ({
        type: 'other',
        severity: 5,
        notes: `Symptom ${i}`,
      }));

      const logWithTooManySymptoms = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2024-01-15',
        symptoms,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => DailySymptomLogSchema.parse(logWithTooManySymptoms)).toThrow();
    });
  });

  describe('QuickSymptomCheckSchema', () => {
    it('validates quick symptom check', () => {
      const validCheck = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2024-01-15',
        fatigueLevel: 7,
        overallWellbeing: 4,
        canDoBasicTasks: false,
        needsRest: true,
      };

      expect(() => QuickSymptomCheckSchema.parse(validCheck)).not.toThrow();
    });

    it('rejects invalid quick symptom check', () => {
      const invalidCheck = {
        userId: 'invalid-uuid',
        date: 'invalid-date',
        fatigueLevel: 15, // too high
        overallWellbeing: 0, // too low
      };

      expect(() => QuickSymptomCheckSchema.parse(invalidCheck)).toThrow();
    });
  });

  describe('Validation Functions', () => {
    describe('validateSymptomEntry', () => {
      it('validates and returns valid symptom entry', () => {
        const validEntry = {
          type: 'fatigue',
          severity: 7,
          notes: 'Very tired today',
        };

        const result = validateSymptomEntry(validEntry);
        expect(result).toEqual(expect.objectContaining(validEntry));
      });

      it('throws error for invalid symptom entry', () => {
        const invalidEntry = {
          type: 'invalid_type',
          severity: 15,
        };

        expect(() => validateSymptomEntry(invalidEntry)).toThrow();
      });
    });

    describe('validateDailySymptomLog', () => {
      it('validates and returns valid daily symptom log', () => {
        const validLog = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: '123e4567-e89b-12d3-a456-426614174001',
          date: '2024-01-15',
          fatigueLevel: 7,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = validateDailySymptomLog(validLog);
        expect(result).toEqual(expect.objectContaining(validLog));
      });
    });

    describe('validateQuickSymptomCheck', () => {
      it('validates and returns valid quick symptom check', () => {
        const validCheck = {
          userId: '123e4567-e89b-12d3-a456-426614174001',
          date: '2024-01-15',
          fatigueLevel: 7,
          overallWellbeing: 4,
          canDoBasicTasks: false,
          needsRest: true,
        };

        const result = validateQuickSymptomCheck(validCheck);
        expect(result).toEqual(expect.objectContaining(validCheck));
      });
    });
  });

  describe('Helper Functions', () => {
    describe('getSymptomDisplayName', () => {
      it('returns correct display names for symptoms', () => {
        expect(getSymptomDisplayName('fatigue')).toBe('Fatigue');
        expect(getSymptomDisplayName('post_exertional_malaise')).toBe('Post-Exertional Malaise (PEM)');
        expect(getSymptomDisplayName('brain_fog')).toBe('Brain Fog');
        expect(getSymptomDisplayName('heart_palpitations')).toBe('Heart Palpitations');
        expect(getSymptomDisplayName('other')).toBe('Other');
      });

      it('handles unknown symptom types gracefully', () => {
        const unknownSymptom = 'unknown_symptom' as SymptomType;
        expect(getSymptomDisplayName(unknownSymptom)).toBe('unknown_symptom');
      });
    });

    describe('getSeverityLabel', () => {
      it('returns correct severity labels', () => {
        expect(getSeverityLabel(1)).toBe('Very Mild');
        expect(getSeverityLabel(2)).toBe('Very Mild');
        expect(getSeverityLabel(3)).toBe('Mild');
        expect(getSeverityLabel(4)).toBe('Mild');
        expect(getSeverityLabel(5)).toBe('Moderate');
        expect(getSeverityLabel(6)).toBe('Moderate');
        expect(getSeverityLabel(7)).toBe('Severe');
        expect(getSeverityLabel(8)).toBe('Severe');
        expect(getSeverityLabel(9)).toBe('Very Severe');
        expect(getSeverityLabel(10)).toBe('Very Severe');
      });
    });

    describe('getSeverityColor', () => {
      it('returns correct color classes for severity levels', () => {
        expect(getSeverityColor(1)).toBe('text-green-600');
        expect(getSeverityColor(2)).toBe('text-green-600');
        expect(getSeverityColor(3)).toBe('text-yellow-600');
        expect(getSeverityColor(4)).toBe('text-yellow-600');
        expect(getSeverityColor(5)).toBe('text-orange-600');
        expect(getSeverityColor(6)).toBe('text-orange-600');
        expect(getSeverityColor(7)).toBe('text-red-600');
        expect(getSeverityColor(8)).toBe('text-red-600');
        expect(getSeverityColor(9)).toBe('text-red-800');
        expect(getSeverityColor(10)).toBe('text-red-800');
      });
    });

    describe('getWellbeingLabel', () => {
      it('returns correct wellbeing labels', () => {
        expect(getWellbeingLabel(1)).toBe('Very Difficult Day');
        expect(getWellbeingLabel(2)).toBe('Very Difficult Day');
        expect(getWellbeingLabel(3)).toBe('Challenging Day');
        expect(getWellbeingLabel(4)).toBe('Challenging Day');
        expect(getWellbeingLabel(5)).toBe('Managing');
        expect(getWellbeingLabel(6)).toBe('Managing');
        expect(getWellbeingLabel(7)).toBe('Good Day');
        expect(getWellbeingLabel(8)).toBe('Good Day');
        expect(getWellbeingLabel(9)).toBe('Great Day');
        expect(getWellbeingLabel(10)).toBe('Great Day');
      });
    });

    describe('getActivityLevelLabel', () => {
      it('returns correct activity level labels', () => {
        expect(getActivityLevelLabel('bedbound')).toBe('Bedbound');
        expect(getActivityLevelLabel('housebound')).toBe('Housebound');
        expect(getActivityLevelLabel('limited_activity')).toBe('Limited Activity');
        expect(getActivityLevelLabel('normal_activity')).toBe('Normal Activity');
      });

      it('handles unknown activity levels gracefully', () => {
        expect(getActivityLevelLabel('unknown_level')).toBe('unknown_level');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty symptom arrays', () => {
      const logWithEmptySymptoms = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2024-01-15',
        symptoms: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => DailySymptomLogSchema.parse(logWithEmptySymptoms)).not.toThrow();
    });

    it('handles boundary severity values', () => {
      const boundaryEntries = [
        { type: 'fatigue', severity: 1 }, // minimum
        { type: 'fatigue', severity: 10 }, // maximum
      ];

      boundaryEntries.forEach(entry => {
        expect(() => SymptomEntrySchema.parse(entry)).not.toThrow();
      });
    });

    it('handles maximum allowed string lengths', () => {
      const maxLengthEntry = {
        type: 'fatigue',
        severity: 5,
        location: 'a'.repeat(100), // max location length
        notes: 'a'.repeat(300), // max notes length
        triggers: ['a'.repeat(50)], // max trigger length
      };

      expect(() => SymptomEntrySchema.parse(maxLengthEntry)).not.toThrow();
    });

    it('handles all valid duration options', () => {
      const durations = ['minutes', 'hours', 'all_day', 'multiple_days'];
      
      durations.forEach(duration => {
        const entry = {
          type: 'fatigue',
          severity: 5,
          duration,
        };
        expect(() => SymptomEntrySchema.parse(entry)).not.toThrow();
      });
    });

    it('handles all valid activity levels', () => {
      const activityLevels = ['bedbound', 'housebound', 'limited_activity', 'normal_activity'];
      
      activityLevels.forEach(level => {
        const log = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: '123e4567-e89b-12d3-a456-426614174001',
          date: '2024-01-15',
          activityLevel: level,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        expect(() => DailySymptomLogSchema.parse(log)).not.toThrow();
      });
    });
  });
});