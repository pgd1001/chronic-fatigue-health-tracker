import {
  ReportTypeSchema,
  ReportPeriodSchema,
  ConsentLevelSchema,
  HealthMetricsSummarySchema,
  SymptomAnalysisSchema,
  ActivityPatternsSchema,
  ClinicalObservationsSchema,
  HealthcareReportSchema,
  GenerateReportRequestSchema,
  ReportSharingConfigSchema,
  validateHealthcareReport,
  validateGenerateReportRequest,
  validateReportSharingConfig,
  getReportTypeDisplayName,
  getReportPeriodDisplayName,
  getConsentLevelDescription,
  calculateDataQualityScore,
  generateReportDisclaimer,
} from './healthcare-report.types';

describe('Healthcare Report Types', () => {
  describe('Schema Validations', () => {
    describe('ReportTypeSchema', () => {
      it('validates valid report types', () => {
        const validTypes = [
          'summary',
          'detailed',
          'symptom_focused',
          'activity_focused',
          'biometric_focused',
          'comprehensive'
        ];

        validTypes.forEach(type => {
          expect(() => ReportTypeSchema.parse(type)).not.toThrow();
        });
      });

      it('rejects invalid report types', () => {
        const invalidTypes = ['invalid', 'random', 123, null, undefined];
        
        invalidTypes.forEach(type => {
          expect(() => ReportTypeSchema.parse(type)).toThrow();
        });
      });
    });

    describe('ReportPeriodSchema', () => {
      it('validates valid report periods', () => {
        const validPeriods = [
          'week',
          'month',
          'quarter',
          'six_months',
          'year',
          'custom'
        ];

        validPeriods.forEach(period => {
          expect(() => ReportPeriodSchema.parse(period)).not.toThrow();
        });
      });
    });

    describe('ConsentLevelSchema', () => {
      it('validates valid consent levels', () => {
        const validLevels = [
          'basic_metrics',
          'detailed_symptoms',
          'full_data',
          'custom'
        ];

        validLevels.forEach(level => {
          expect(() => ConsentLevelSchema.parse(level)).not.toThrow();
        });
      });
    });
  });

  describe('HealthMetricsSummarySchema', () => {
    it('validates complete health metrics summary', () => {
      const validSummary = {
        averageEnergyLevel: 6.5,
        averageFatigueLevel: 7.2,
        averagePainLevel: 4.8,
        averageBrainFogLevel: 5.5,
        averageSleepQuality: 6.0,
        averageMoodRating: 5.8,
        energyTrend: 'improving',
        fatigueTrend: 'stable',
        overallTrend: 'improving',
        goodDays: 12,
        difficultDays: 8,
        totalDaysTracked: 30,
        dailyAnchorCompletionRate: 85,
        movementSessionCompletionRate: 70,
        averageHeartRate: 72,
        averageHRV: 45.5,
        biometricMeasurements: 15,
      };

      expect(() => HealthMetricsSummarySchema.parse(validSummary)).not.toThrow();
    });

    it('validates minimal health metrics summary', () => {
      const minimalSummary = {
        averageEnergyLevel: null,
        averageFatigueLevel: null,
        averagePainLevel: null,
        averageBrainFogLevel: null,
        averageSleepQuality: null,
        averageMoodRating: null,
        energyTrend: 'insufficient_data',
        fatigueTrend: 'insufficient_data',
        overallTrend: 'insufficient_data',
        goodDays: 0,
        difficultDays: 0,
        totalDaysTracked: 0,
        dailyAnchorCompletionRate: 0,
        movementSessionCompletionRate: 0,
        averageHeartRate: null,
        averageHRV: null,
        biometricMeasurements: 0,
      };

      expect(() => HealthMetricsSummarySchema.parse(minimalSummary)).not.toThrow();
    });

    it('rejects invalid completion rates', () => {
      const invalidSummary = {
        averageEnergyLevel: null,
        averageFatigueLevel: null,
        averagePainLevel: null,
        averageBrainFogLevel: null,
        averageSleepQuality: null,
        averageMoodRating: null,
        energyTrend: 'insufficient_data',
        fatigueTrend: 'insufficient_data',
        overallTrend: 'insufficient_data',
        goodDays: 0,
        difficultDays: 0,
        totalDaysTracked: 0,
        dailyAnchorCompletionRate: 150, // Invalid: > 100
        movementSessionCompletionRate: -10, // Invalid: < 0
        averageHeartRate: null,
        averageHRV: null,
        biometricMeasurements: 0,
      };

      expect(() => HealthMetricsSummarySchema.parse(invalidSummary)).toThrow();
    });
  });

  describe('SymptomAnalysisSchema', () => {
    it('validates complete symptom analysis', () => {
      const validAnalysis = {
        topSymptoms: [
          {
            symptomType: 'fatigue',
            frequency: 85,
            averageSeverity: 7.2,
            trendDirection: 'stable',
          },
          {
            symptomType: 'brain_fog',
            frequency: 70,
            averageSeverity: 6.5,
            trendDirection: 'improving',
          },
        ],
        symptomCorrelations: [
          {
            symptom1: 'fatigue',
            symptom2: 'brain_fog',
            correlation: 0.75,
            significance: 'high',
            sampleSize: 30,
          },
        ],
        postExertionalMalaise: {
          frequency: 60,
          averageSeverity: 8.0,
          triggerPatterns: ['physical_activity', 'cognitive_exertion'],
        },
      };

      expect(() => SymptomAnalysisSchema.parse(validAnalysis)).not.toThrow();
    });

    it('validates empty symptom analysis', () => {
      const emptyAnalysis = {
        topSymptoms: [],
        symptomCorrelations: [],
      };

      expect(() => SymptomAnalysisSchema.parse(emptyAnalysis)).not.toThrow();
    });

    it('rejects too many symptoms', () => {
      const tooManySymptoms = {
        topSymptoms: Array.from({ length: 11 }, (_, i) => ({
          symptomType: `symptom_${i}`,
          frequency: 50,
          averageSeverity: 5,
          trendDirection: 'stable',
        })),
        symptomCorrelations: [],
      };

      expect(() => SymptomAnalysisSchema.parse(tooManySymptoms)).toThrow();
    });
  });

  describe('HealthcareReportSchema', () => {
    it('validates complete healthcare report', () => {
      const validReport = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        reportType: 'comprehensive',
        reportPeriod: 'month',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        generatedAt: new Date(),
        patientId: 'PT12345678',
        reportTitle: 'Comprehensive Health Report - January 2024',
        consentLevel: 'full_data',
        sharedWithProvider: false,
        executiveSummary: 'Patient tracked health data consistently during the reporting period.',
        healthMetrics: {
          averageEnergyLevel: 6.5,
          averageFatigueLevel: 7.2,
          averagePainLevel: null,
          averageBrainFogLevel: 5.5,
          averageSleepQuality: 6.0,
          averageMoodRating: null,
          energyTrend: 'improving',
          fatigueTrend: 'stable',
          overallTrend: 'improving',
          goodDays: 12,
          difficultDays: 8,
          totalDaysTracked: 30,
          dailyAnchorCompletionRate: 85,
          movementSessionCompletionRate: 70,
          averageHeartRate: 72,
          averageHRV: 45.5,
          biometricMeasurements: 15,
        },
        symptomAnalysis: {
          topSymptoms: [],
          symptomCorrelations: [],
        },
        activityPatterns: {
          movementSessions: {
            totalSessions: 20,
            averageDuration: 25,
            averageIntensity: 6.0,
            completionRate: 85,
            adaptationFrequency: 15,
          },
          sleepPatterns: {
            averageSleepDuration: 7.5,
            averageSleepQuality: 6.0,
            sleepOptimizationCompliance: 80,
            sleepDisturbanceFrequency: 20,
          },
          nutritionPatterns: {
            averageHydration: 2000,
            supplementCompliance: 90,
            oneProductFoodCompliance: 75,
          },
          pacingPatterns: {
            aiRecommendationsFollowed: 70,
            overexertionEpisodes: 3,
            restDaysUtilized: 5,
          },
        },
        clinicalObservations: {
          keyFindings: ['Consistent tracking behavior'],
          concerningPatterns: [],
          positiveIndicators: ['Regular engagement'],
          recommendationsForProvider: ['Consider pacing strategies'],
          dataCompleteness: 85,
          trackingConsistency: 90,
          reportReliability: 'high',
        },
        includedDataTypes: ['daily_health_logs', 'symptom_logs'],
        dataQualityScore: 88,
        disclaimers: ['This is for informational purposes only'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => HealthcareReportSchema.parse(validReport)).not.toThrow();
    });
  });

  describe('GenerateReportRequestSchema', () => {
    it('validates minimal report request', () => {
      const minimalRequest = {
        reportType: 'summary',
        reportPeriod: 'month',
        consentLevel: 'basic_metrics',
      };

      expect(() => GenerateReportRequestSchema.parse(minimalRequest)).not.toThrow();
    });

    it('validates complete report request', () => {
      const completeRequest = {
        reportType: 'comprehensive',
        reportPeriod: 'custom',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        consentLevel: 'full_data',
        includeRawData: true,
        customTitle: 'My Custom Report',
        focusAreas: ['symptoms', 'activity', 'sleep'],
      };

      expect(() => GenerateReportRequestSchema.parse(completeRequest)).not.toThrow();
    });

    it('rejects invalid date format', () => {
      const invalidRequest = {
        reportType: 'summary',
        reportPeriod: 'custom',
        startDate: 'invalid-date',
        endDate: '2024-01-31',
        consentLevel: 'basic_metrics',
      };

      expect(() => GenerateReportRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('ReportSharingConfigSchema', () => {
    it('validates sharing configuration', () => {
      const validConfig = {
        shareWithProvider: true,
        providerEmail: 'doctor@example.com',
        providerName: 'Dr. Smith',
        accessDuration: '7_days',
        allowDownload: true,
        requiresPassword: false,
        notifyOnAccess: true,
      };

      expect(() => ReportSharingConfigSchema.parse(validConfig)).not.toThrow();
    });

    it('validates password requirement', () => {
      const configWithPassword = {
        shareWithProvider: true,
        accessDuration: '24_hours',
        allowDownload: true,
        requiresPassword: true,
        customPassword: 'securepass123',
        notifyOnAccess: true,
      };

      expect(() => ReportSharingConfigSchema.parse(configWithPassword)).not.toThrow();
    });

    it('rejects invalid email format', () => {
      const invalidConfig = {
        shareWithProvider: true,
        providerEmail: 'invalid-email',
        accessDuration: '7_days',
        allowDownload: true,
        requiresPassword: false,
        notifyOnAccess: true,
      };

      expect(() => ReportSharingConfigSchema.parse(invalidConfig)).toThrow();
    });
  });

  describe('Validation Functions', () => {
    describe('validateHealthcareReport', () => {
      it('validates and returns valid healthcare report', () => {
        const validData = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: '123e4567-e89b-12d3-a456-426614174001',
          reportType: 'summary',
          reportPeriod: 'month',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          generatedAt: new Date(),
          patientId: 'PT12345678',
          reportTitle: 'Test Report',
          consentLevel: 'basic_metrics',
          sharedWithProvider: false,
          executiveSummary: 'Test summary',
          healthMetrics: {
            averageEnergyLevel: null,
            averageFatigueLevel: null,
            averagePainLevel: null,
            averageBrainFogLevel: null,
            averageSleepQuality: null,
            averageMoodRating: null,
            energyTrend: 'insufficient_data',
            fatigueTrend: 'insufficient_data',
            overallTrend: 'insufficient_data',
            goodDays: 0,
            difficultDays: 0,
            totalDaysTracked: 0,
            dailyAnchorCompletionRate: 0,
            movementSessionCompletionRate: 0,
            averageHeartRate: null,
            averageHRV: null,
            biometricMeasurements: 0,
          },
          symptomAnalysis: {
            topSymptoms: [],
            symptomCorrelations: [],
          },
          activityPatterns: {
            movementSessions: {
              totalSessions: 0,
              averageDuration: null,
              averageIntensity: null,
              completionRate: 0,
              adaptationFrequency: 0,
            },
            sleepPatterns: {
              averageSleepDuration: null,
              averageSleepQuality: null,
              sleepOptimizationCompliance: 0,
              sleepDisturbanceFrequency: 0,
            },
            nutritionPatterns: {
              averageHydration: null,
              supplementCompliance: 0,
              oneProductFoodCompliance: 0,
            },
            pacingPatterns: {
              aiRecommendationsFollowed: 0,
              overexertionEpisodes: 0,
              restDaysUtilized: 0,
            },
          },
          clinicalObservations: {
            keyFindings: [],
            concerningPatterns: [],
            positiveIndicators: [],
            recommendationsForProvider: [],
            dataCompleteness: 0,
            trackingConsistency: 0,
            reportReliability: 'low',
          },
          includedDataTypes: ['daily_health_logs'],
          dataQualityScore: 0,
          disclaimers: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = validateHealthcareReport(validData);
        expect(result).toEqual(expect.objectContaining({
          id: validData.id,
          reportType: validData.reportType,
        }));
      });

      it('throws error for invalid healthcare report', () => {
        const invalidData = {
          id: 'invalid-uuid',
          reportType: 'invalid_type',
        };

        expect(() => validateHealthcareReport(invalidData)).toThrow();
      });
    });

    describe('validateGenerateReportRequest', () => {
      it('validates and returns valid request', () => {
        const validRequest = {
          reportType: 'summary',
          reportPeriod: 'month',
          consentLevel: 'basic_metrics',
        };

        const result = validateGenerateReportRequest(validRequest);
        expect(result).toEqual(expect.objectContaining(validRequest));
      });
    });

    describe('validateReportSharingConfig', () => {
      it('validates and returns valid sharing config', () => {
        const validConfig = {
          shareWithProvider: true,
          accessDuration: '7_days',
          allowDownload: true,
          requiresPassword: false,
          notifyOnAccess: true,
        };

        const result = validateReportSharingConfig(validConfig);
        expect(result).toEqual(expect.objectContaining(validConfig));
      });
    });
  });

  describe('Helper Functions', () => {
    describe('getReportTypeDisplayName', () => {
      it('returns correct display names', () => {
        expect(getReportTypeDisplayName('summary')).toBe('Summary Report');
        expect(getReportTypeDisplayName('detailed')).toBe('Detailed Analysis');
        expect(getReportTypeDisplayName('symptom_focused')).toBe('Symptom-Focused Report');
        expect(getReportTypeDisplayName('comprehensive')).toBe('Comprehensive Health Report');
      });
    });

    describe('getReportPeriodDisplayName', () => {
      it('returns correct period names', () => {
        expect(getReportPeriodDisplayName('week')).toBe('Past Week');
        expect(getReportPeriodDisplayName('month')).toBe('Past Month');
        expect(getReportPeriodDisplayName('quarter')).toBe('Past 3 Months');
        expect(getReportPeriodDisplayName('custom')).toBe('Custom Period');
      });
    });

    describe('getConsentLevelDescription', () => {
      it('returns correct descriptions', () => {
        expect(getConsentLevelDescription('basic_metrics')).toContain('Basic health metrics');
        expect(getConsentLevelDescription('detailed_symptoms')).toContain('detailed symptom');
        expect(getConsentLevelDescription('full_data')).toContain('Complete health data');
        expect(getConsentLevelDescription('custom')).toContain('Custom data selection');
      });
    });

    describe('calculateDataQualityScore', () => {
      it('calculates quality score correctly', () => {
        expect(calculateDataQualityScore(30, 25, 80)).toBe(82); // (25/30)*100*0.6 + 80*0.4
        expect(calculateDataQualityScore(0, 0, 0)).toBe(0);
        expect(calculateDataQualityScore(10, 10, 100)).toBe(100);
      });
    });

    describe('generateReportDisclaimer', () => {
      it('returns array of disclaimer strings', () => {
        const disclaimers = generateReportDisclaimer();
        expect(Array.isArray(disclaimers)).toBe(true);
        expect(disclaimers.length).toBeGreaterThan(0);
        expect(disclaimers[0]).toContain('informational purposes only');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles maximum allowed values', () => {
      const maxValues = {
        topSymptoms: Array.from({ length: 10 }, (_, i) => ({
          symptomType: `symptom_${i}`,
          frequency: 100,
          averageSeverity: 10,
          trendDirection: 'stable',
        })),
        symptomCorrelations: Array.from({ length: 20 }, (_, i) => ({
          symptom1: `symptom_${i}`,
          symptom2: `symptom_${i + 1}`,
          correlation: 1,
          significance: 'high',
          sampleSize: 1000,
        })),
      };

      expect(() => SymptomAnalysisSchema.parse(maxValues)).not.toThrow();
    });

    it('handles boundary correlation values', () => {
      const boundaryCorrelations = {
        topSymptoms: [],
        symptomCorrelations: [
          {
            symptom1: 'fatigue',
            symptom2: 'energy',
            correlation: -1, // minimum
            significance: 'high',
            sampleSize: 1,
          },
          {
            symptom1: 'pain',
            symptom2: 'mood',
            correlation: 1, // maximum
            significance: 'low',
            sampleSize: 1,
          },
        ],
      };

      expect(() => SymptomAnalysisSchema.parse(boundaryCorrelations)).not.toThrow();
    });

    it('handles empty arrays and null values', () => {
      const emptyData = {
        topSymptoms: [],
        symptomCorrelations: [],
        postExertionalMalaise: {
          frequency: 0,
          averageSeverity: null,
          triggerPatterns: [],
        },
      };

      expect(() => SymptomAnalysisSchema.parse(emptyData)).not.toThrow();
    });
  });
});