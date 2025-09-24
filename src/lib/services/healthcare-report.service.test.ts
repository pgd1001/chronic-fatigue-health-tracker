import { HealthcareReportService } from './healthcare-report.service';
import { db } from '../db/connection';
import { dailyHealthLogs, movementSessions, biometricMeasurements, sleepLogs, nutritionLogs, healthReports } from '../db/schema';
import { SymptomService } from '../db/services/symptom.service';
import { type GenerateReportRequest } from '../types/healthcare-report.types';

// Mock the database connection and services
jest.mock('../db/connection', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../db/utils', () => ({
  handleDatabaseError: jest.fn((error) => { throw error; }),
  NotFoundError: class NotFoundError extends Error {
    constructor(resource: string, id: string) {
      super(`${resource} with id ${id} not found`);
    }
  },
  withRetry: jest.fn((fn) => fn()),
  formatDateForDB: jest.fn((date) => date.toISOString().split('T')[0]),
}));

jest.mock('../db/services/symptom.service', () => ({
  SymptomService: {
    calculateProgressMetrics: jest.fn(),
    analyzeSymptomCorrelations: jest.fn(),
  },
}));

const mockDb = db as jest.Mocked<typeof db>;
const mockSymptomService = SymptomService as jest.Mocked<typeof SymptomService>;

describe('HealthcareReportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateReport', () => {
    const mockRequest: GenerateReportRequest = {
      reportType: 'summary',
      reportPeriod: 'month',
      consentLevel: 'basic_metrics',
    };

    const mockHealthLogs = [
      {
        id: 'log-1',
        userId: 'test-user',
        date: '2024-01-15',
        energyLevel: 7,
        fatigueLevel: 5,
        painLevel: 3,
        brainFogLevel: 4,
        sleepQuality: 6,
        completedDailyAnchor: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'log-2',
        userId: 'test-user',
        date: '2024-01-14',
        energyLevel: 5,
        fatigueLevel: 7,
        painLevel: 6,
        brainFogLevel: 8,
        sleepQuality: 4,
        completedDailyAnchor: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockBiometrics = [
      {
        id: 'bio-1',
        userId: 'test-user',
        timestamp: new Date('2024-01-15'),
        heartRate: 72,
        heartRateVariability: 45.5,
        measurementDuration: 60,
        quality: 'good',
        createdAt: new Date(),
      },
    ];

    const mockProgressMetrics = {
      period: 'month' as const,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      averageFatigue: 6.0,
      averagePEM: null,
      averageBrainFog: 6.0,
      averageSleep: 5.0,
      averageWellbeing: null,
      fatiguetrend: 'stable' as const,
      overallTrend: 'stable' as const,
      goodDays: 1,
      difficultDays: 1,
      topSymptoms: [
        {
          symptomType: 'fatigue' as const,
          averageSeverity: 6.0,
          frequency: 100,
          trendDirection: 'stable' as const,
        },
      ],
    };

    const mockCorrelations = [
      {
        symptom1: 'fatigue' as const,
        symptom2: 'brain_fog' as const,
        correlation: 0.75,
        significance: 'high' as const,
        sampleSize: 30,
      },
    ];

    beforeEach(() => {
      // Mock database queries
      mockDb.select.mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockHealthLogs),
        }),
      }) as any);

      // Mock symptom service
      mockSymptomService.calculateProgressMetrics.mockResolvedValue(mockProgressMetrics);
      mockSymptomService.analyzeSymptomCorrelations.mockResolvedValue(mockCorrelations);

      // Mock insert operation
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      } as any);
    });

    it('generates a comprehensive healthcare report', async () => {
      const report = await HealthcareReportService.generateReport('test-user', mockRequest);

      expect(report).toMatchObject({
        userId: 'test-user',
        reportType: 'summary',
        reportPeriod: 'month',
        consentLevel: 'basic_metrics',
      });

      expect(report.id).toBeDefined();
      expect(report.patientId).toBeDefined();
      expect(report.executiveSummary).toBeDefined();
      expect(report.healthMetrics).toBeDefined();
      expect(report.symptomAnalysis).toBeDefined();
      expect(report.activityPatterns).toBeDefined();
      expect(report.clinicalObservations).toBeDefined();
      expect(report.disclaimers).toHaveLength(5);
    });

    it('calculates health metrics correctly', async () => {
      const report = await HealthcareReportService.generateReport('test-user', mockRequest);

      expect(report.healthMetrics.averageEnergyLevel).toBe(6.0); // (7 + 5) / 2
      expect(report.healthMetrics.averageFatigueLevel).toBe(6.0); // (5 + 7) / 2
      expect(report.healthMetrics.averagePainLevel).toBe(4.5); // (3 + 6) / 2
      expect(report.healthMetrics.averageBrainFogLevel).toBe(6.0); // (4 + 8) / 2
      expect(report.healthMetrics.averageSleepQuality).toBe(5.0); // (6 + 4) / 2
      expect(report.healthMetrics.totalDaysTracked).toBe(2);
      expect(report.healthMetrics.dailyAnchorCompletionRate).toBe(50); // 1 out of 2
    });

    it('includes symptom analysis from symptom service', async () => {
      const report = await HealthcareReportService.generateReport('test-user', mockRequest);

      expect(report.symptomAnalysis.topSymptoms).toHaveLength(1);
      expect(report.symptomAnalysis.topSymptoms[0].symptomType).toBe('Fatigue');
      expect(report.symptomAnalysis.symptomCorrelations).toHaveLength(1);
      expect(report.symptomAnalysis.symptomCorrelations[0].symptom1).toBe('Fatigue');
    });

    it('generates appropriate executive summary', async () => {
      const report = await HealthcareReportService.generateReport('test-user', mockRequest);

      expect(report.executiveSummary).toContain('2 days');
      expect(report.executiveSummary).toContain('fatigue level was 6');
      expect(report.executiveSummary).toContain('stable trend');
    });

    it('handles custom date range', async () => {
      const customRequest: GenerateReportRequest = {
        ...mockRequest,
        reportPeriod: 'custom',
        startDate: '2024-01-01',
        endDate: '2024-01-15',
      };

      const report = await HealthcareReportService.generateReport('test-user', customRequest);

      expect(report.startDate).toBe('2024-01-01');
      expect(report.endDate).toBe('2024-01-15');
    });

    it('generates anonymized patient ID consistently', async () => {
      const report1 = await HealthcareReportService.generateReport('test-user', mockRequest);
      const report2 = await HealthcareReportService.generateReport('test-user', mockRequest);

      expect(report1.patientId).toBe(report2.patientId);
      expect(report1.patientId).toMatch(/^PT\d{8}$/);
    });

    it('handles empty data gracefully', async () => {
      // Mock empty data
      mockDb.select.mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      }) as any);

      mockSymptomService.calculateProgressMetrics.mockResolvedValue({
        ...mockProgressMetrics,
        averageFatigue: null,
        averageBrainFog: null,
        averageSleep: null,
        fatiguetrend: 'insufficient_data',
        overallTrend: 'insufficient_data',
        goodDays: 0,
        difficultDays: 0,
        topSymptoms: [],
      });

      mockSymptomService.analyzeSymptomCorrelations.mockResolvedValue([]);

      const report = await HealthcareReportService.generateReport('test-user', mockRequest);

      expect(report.healthMetrics.averageEnergyLevel).toBeNull();
      expect(report.healthMetrics.totalDaysTracked).toBe(0);
      expect(report.executiveSummary).toContain('Insufficient data');
    });

    it('includes correct data types based on consent level', async () => {
      const fullDataRequest: GenerateReportRequest = {
        ...mockRequest,
        consentLevel: 'full_data',
      };

      const report = await HealthcareReportService.generateReport('test-user', fullDataRequest);

      expect(report.includedDataTypes).toContain('daily_health_logs');
      expect(report.includedDataTypes).toContain('movement_sessions');
      expect(report.includedDataTypes).toContain('biometric_measurements');
    });
  });

  describe('getUserReports', () => {
    it('returns user reports in descending order', async () => {
      const mockReports = [
        {
          id: 'report-1',
          userId: 'test-user',
          reportType: 'summary',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          reportData: JSON.stringify({ id: 'report-1', reportTitle: 'Test Report 1' }),
          generatedAt: new Date('2024-02-01'),
        },
        {
          id: 'report-2',
          userId: 'test-user',
          reportType: 'detailed',
          startDate: '2024-02-01',
          endDate: '2024-02-28',
          reportData: JSON.stringify({ id: 'report-2', reportTitle: 'Test Report 2' }),
          generatedAt: new Date('2024-03-01'),
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockReports),
          }),
        }),
      } as any);

      const reports = await HealthcareReportService.getUserReports('test-user');

      expect(reports).toHaveLength(2);
      expect(reports[0].id).toBe('report-1');
      expect(reports[1].id).toBe('report-2');
    });

    it('returns empty array when no reports exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const reports = await HealthcareReportService.getUserReports('test-user');

      expect(reports).toEqual([]);
    });
  });

  describe('getReport', () => {
    it('returns specific report for user', async () => {
      const mockReport = {
        id: 'report-1',
        userId: 'test-user',
        reportData: JSON.stringify({ id: 'report-1', reportTitle: 'Test Report' }),
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockReport]),
        }),
      } as any);

      const report = await HealthcareReportService.getReport('report-1', 'test-user');

      expect(report.id).toBe('report-1');
      expect(report.reportTitle).toBe('Test Report');
    });

    it('throws NotFoundError when report does not exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      } as any);

      await expect(
        HealthcareReportService.getReport('nonexistent', 'test-user')
      ).rejects.toThrow('Healthcare report with id nonexistent not found');
    });
  });

  describe('deleteReport', () => {
    it('deletes report successfully', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue({ rowCount: 1 }),
      } as any);

      await expect(
        HealthcareReportService.deleteReport('report-1', 'test-user')
      ).resolves.not.toThrow();
    });

    it('throws NotFoundError when report does not exist', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue({ rowCount: 0 }),
      } as any);

      await expect(
        HealthcareReportService.deleteReport('nonexistent', 'test-user')
      ).rejects.toThrow('Healthcare report with id nonexistent not found');
    });
  });

  describe('Data Quality Calculation', () => {
    it('calculates data quality score correctly', async () => {
      // Mock 20 days of data out of 30 days period
      const mockLogs = Array.from({ length: 20 }, (_, i) => ({
        id: `log-${i}`,
        userId: 'test-user',
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        energyLevel: 5,
        fatigueLevel: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockDb.select.mockImplementation((fields) => {
        if (fields && 'count' in fields) {
          // Mock count query
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([{ count: 20 }]),
            }),
          } as any;
        } else {
          // Mock data query
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockLogs),
            }),
          } as any;
        }
      });

      const report = await HealthcareReportService.generateReport('test-user', {
        reportType: 'summary',
        reportPeriod: 'month',
        consentLevel: 'basic_metrics',
      });

      // Data quality should be calculated based on consistency and completeness
      expect(report.dataQualityScore).toBeGreaterThan(0);
      expect(report.dataQualityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Trend Analysis', () => {
    it('calculates improving trend correctly', async () => {
      const improvingLogs = [
        { id: '1', userId: 'test-user', date: '2024-01-01', fatigueLevel: 8, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', userId: 'test-user', date: '2024-01-02', fatigueLevel: 7, createdAt: new Date(), updatedAt: new Date() },
        { id: '3', userId: 'test-user', date: '2024-01-03', fatigueLevel: 6, createdAt: new Date(), updatedAt: new Date() },
        { id: '4', userId: 'test-user', date: '2024-01-04', fatigueLevel: 5, createdAt: new Date(), updatedAt: new Date() },
        { id: '5', userId: 'test-user', date: '2024-01-05', fatigueLevel: 4, createdAt: new Date(), updatedAt: new Date() },
        { id: '6', userId: 'test-user', date: '2024-01-06', fatigueLevel: 3, createdAt: new Date(), updatedAt: new Date() },
        { id: '7', userId: 'test-user', date: '2024-01-07', fatigueLevel: 2, createdAt: new Date(), updatedAt: new Date() },
      ];

      mockDb.select.mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(improvingLogs),
        }),
      }) as any);

      const report = await HealthcareReportService.generateReport('test-user', {
        reportType: 'summary',
        reportPeriod: 'week',
        consentLevel: 'basic_metrics',
      });

      expect(report.healthMetrics.fatigueTrend).toBe('improving');
    });

    it('calculates worsening trend correctly', async () => {
      const worseningLogs = [
        { id: '1', userId: 'test-user', date: '2024-01-01', fatigueLevel: 2, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', userId: 'test-user', date: '2024-01-02', fatigueLevel: 3, createdAt: new Date(), updatedAt: new Date() },
        { id: '3', userId: 'test-user', date: '2024-01-03', fatigueLevel: 4, createdAt: new Date(), updatedAt: new Date() },
        { id: '4', userId: 'test-user', date: '2024-01-04', fatigueLevel: 5, createdAt: new Date(), updatedAt: new Date() },
        { id: '5', userId: 'test-user', date: '2024-01-05', fatigueLevel: 6, createdAt: new Date(), updatedAt: new Date() },
        { id: '6', userId: 'test-user', date: '2024-01-06', fatigueLevel: 7, createdAt: new Date(), updatedAt: new Date() },
        { id: '7', userId: 'test-user', date: '2024-01-07', fatigueLevel: 8, createdAt: new Date(), updatedAt: new Date() },
      ];

      mockDb.select.mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(worseningLogs),
        }),
      }) as any);

      const report = await HealthcareReportService.generateReport('test-user', {
        reportType: 'summary',
        reportPeriod: 'week',
        consentLevel: 'basic_metrics',
      });

      expect(report.healthMetrics.fatigueTrend).toBe('declining');
    });
  });
});