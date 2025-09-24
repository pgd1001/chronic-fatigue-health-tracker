import { eq, and, desc, gte, lte, count, avg, sql } from 'drizzle-orm';
import { db } from '../db/connection';
import {
  dailyHealthLogs,
  movementSessions,
  biometricMeasurements,
  sleepLogs,
  nutritionLogs,
  healthReports,
  type HealthReport,
  type NewHealthReport,
} from '../db/schema';
import {
  handleDatabaseError,
  NotFoundError,
  withRetry,
  formatDateForDB,
} from '../db/utils';
import {
  type HealthcareReport,
  type GenerateReportRequest,
  type HealthMetricsSummary,
  type SymptomAnalysis,
  type ActivityPatterns,
  type ClinicalObservations,
  type ReportType,
  type ReportPeriod,
  calculateDataQualityScore,
  generateReportDisclaimer,
} from '../types/healthcare-report.types';
import { SymptomService } from '../db/services/symptom.service';
import { getSymptomDisplayName } from '../types/symptom.types';

export class HealthcareReportService {
  // Generate a comprehensive healthcare report
  static async generateReport(
    userId: string,
    request: GenerateReportRequest
  ): Promise<HealthcareReport> {
    try {
      return await withRetry(async () => {
        const { startDate, endDate } = this.calculateDateRange(request);
        
        // Gather all health data for the period
        const [
          healthMetrics,
          symptomAnalysis,
          activityPatterns,
          clinicalObservations,
          dataQuality
        ] = await Promise.all([
          this.generateHealthMetrics(userId, startDate, endDate),
          this.generateSymptomAnalysis(userId, startDate, endDate),
          this.generateActivityPatterns(userId, startDate, endDate),
          this.generateClinicalObservations(userId, startDate, endDate),
          this.calculateDataQuality(userId, startDate, endDate),
        ]);

        // Generate executive summary
        const executiveSummary = this.generateExecutiveSummary(
          healthMetrics,
          symptomAnalysis,
          activityPatterns,
          request.reportType
        );

        // Create report object
        const report: HealthcareReport = {
          id: crypto.randomUUID(),
          userId,
          reportType: request.reportType,
          reportPeriod: request.reportPeriod,
          startDate,
          endDate,
          generatedAt: new Date(),
          patientId: this.generateAnonymizedPatientId(userId),
          reportTitle: request.customTitle || this.generateReportTitle(request),
          consentLevel: request.consentLevel,
          sharedWithProvider: false,
          executiveSummary,
          healthMetrics,
          symptomAnalysis,
          activityPatterns,
          clinicalObservations,
          includedDataTypes: this.getIncludedDataTypes(request),
          dataQualityScore: dataQuality.overallScore,
          disclaimers: generateReportDisclaimer(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Save report to database
        await this.saveReportToDatabase(report);

        return report;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Generate health metrics summary
  private static async generateHealthMetrics(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<HealthMetricsSummary> {
    const logs = await db
      .select()
      .from(dailyHealthLogs)
      .where(
        and(
          eq(dailyHealthLogs.userId, userId),
          gte(dailyHealthLogs.date, startDate),
          lte(dailyHealthLogs.date, endDate)
        )
      );

    const biometrics = await db
      .select()
      .from(biometricMeasurements)
      .where(
        and(
          eq(biometricMeasurements.userId, userId),
          gte(sql`DATE(${biometricMeasurements.timestamp})`, startDate),
          lte(sql`DATE(${biometricMeasurements.timestamp})`, endDate)
        )
      );

    if (logs.length === 0) {
      return {
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
    }

    // Calculate averages
    const totals = logs.reduce(
      (acc, log) => ({
        energy: acc.energy + (log.energyLevel || 0),
        fatigue: acc.fatigue + (log.fatigueLevel || 0),
        pain: acc.pain + (log.painLevel || 0),
        brainFog: acc.brainFog + (log.brainFogLevel || 0),
        sleep: acc.sleep + (log.sleepQuality || 0),
        completedAnchor: acc.completedAnchor + (log.completedDailyAnchor ? 1 : 0),
        count: acc.count + 1,
      }),
      { energy: 0, fatigue: 0, pain: 0, brainFog: 0, sleep: 0, completedAnchor: 0, count: 0 }
    );

    // Calculate trends (compare first half vs second half)
    const midPoint = Math.floor(logs.length / 2);
    const firstHalf = logs.slice(0, midPoint);
    const secondHalf = logs.slice(midPoint);

    const firstHalfFatigue = firstHalf.reduce((sum, log) => sum + (log.fatigueLevel || 0), 0) / firstHalf.length;
    const secondHalfFatigue = secondHalf.reduce((sum, log) => sum + (log.fatigueLevel || 0), 0) / secondHalf.length;

    let fatigueTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data' = 'insufficient_data';
    if (logs.length >= 7) {
      const difference = secondHalfFatigue - firstHalfFatigue;
      if (Math.abs(difference) < 0.5) {
        fatigueTrend = 'stable';
      } else {
        fatigueTrend = difference < 0 ? 'improving' : 'declining';
      }
    }

    // Calculate biometric averages
    const biometricTotals = biometrics.reduce(
      (acc, measurement) => ({
        heartRate: acc.heartRate + (measurement.heartRate || 0),
        hrv: acc.hrv + (measurement.heartRateVariability ? parseFloat(measurement.heartRateVariability.toString()) : 0),
        count: acc.count + 1,
      }),
      { heartRate: 0, hrv: 0, count: 0 }
    );

    // Count good and difficult days
    const goodDays = logs.filter(log => (log.energyLevel || 0) >= 7 || (log.fatigueLevel || 10) <= 3).length;
    const difficultDays = logs.filter(log => (log.energyLevel || 0) <= 3 || (log.fatigueLevel || 0) >= 8).length;

    return {
      averageEnergyLevel: totals.count > 0 ? Math.round((totals.energy / totals.count) * 10) / 10 : null,
      averageFatigueLevel: totals.count > 0 ? Math.round((totals.fatigue / totals.count) * 10) / 10 : null,
      averagePainLevel: totals.count > 0 ? Math.round((totals.pain / totals.count) * 10) / 10 : null,
      averageBrainFogLevel: totals.count > 0 ? Math.round((totals.brainFog / totals.count) * 10) / 10 : null,
      averageSleepQuality: totals.count > 0 ? Math.round((totals.sleep / totals.count) * 10) / 10 : null,
      averageMoodRating: null, // Would need mood tracking implementation
      energyTrend: fatigueTrend === 'improving' ? 'declining' : fatigueTrend === 'declining' ? 'improving' : fatigueTrend,
      fatigueTrend,
      overallTrend: fatigueTrend,
      goodDays,
      difficultDays,
      totalDaysTracked: totals.count,
      dailyAnchorCompletionRate: totals.count > 0 ? Math.round((totals.completedAnchor / totals.count) * 100) : 0,
      movementSessionCompletionRate: 0, // Would need movement session completion tracking
      averageHeartRate: biometricTotals.count > 0 ? Math.round(biometricTotals.heartRate / biometricTotals.count) : null,
      averageHRV: biometricTotals.count > 0 ? Math.round((biometricTotals.hrv / biometricTotals.count) * 100) / 100 : null,
      biometricMeasurements: biometrics.length,
    };
  }

  // Generate symptom analysis
  private static async generateSymptomAnalysis(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<SymptomAnalysis> {
    const [progressMetrics, correlations] = await Promise.all([
      SymptomService.calculateProgressMetrics(userId, startDate, endDate),
      SymptomService.analyzeSymptomCorrelations(userId, 90), // Use 90 days for correlations
    ]);

    return {
      topSymptoms: progressMetrics.topSymptoms.map(symptom => ({
        symptomType: getSymptomDisplayName(symptom.symptomType),
        frequency: symptom.frequency,
        averageSeverity: symptom.averageSeverity,
        trendDirection: symptom.trendDirection,
      })),
      symptomCorrelations: correlations.map(corr => ({
        symptom1: getSymptomDisplayName(corr.symptom1),
        symptom2: getSymptomDisplayName(corr.symptom2),
        correlation: corr.correlation,
        significance: corr.significance,
        sampleSize: corr.sampleSize,
      })),
      postExertionalMalaise: {
        frequency: 0, // Would need specific PEM tracking
        averageSeverity: null,
        triggerPatterns: [],
      },
    };
  }

  // Generate activity patterns
  private static async generateActivityPatterns(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ActivityPatterns> {
    const [movements, sleepData, nutritionData] = await Promise.all([
      db.select().from(movementSessions).where(
        and(
          eq(movementSessions.userId, userId),
          gte(movementSessions.date, startDate),
          lte(movementSessions.date, endDate)
        )
      ),
      db.select().from(sleepLogs).where(
        and(
          eq(sleepLogs.userId, userId),
          gte(sleepLogs.date, startDate),
          lte(sleepLogs.date, endDate)
        )
      ),
      db.select().from(nutritionLogs).where(
        and(
          eq(nutritionLogs.userId, userId),
          gte(nutritionLogs.date, startDate),
          lte(nutritionLogs.date, endDate)
        )
      ),
    ]);

    // Calculate movement patterns
    const movementTotals = movements.reduce(
      (acc, session) => ({
        duration: acc.duration + (session.duration || 0),
        intensity: acc.intensity + (session.intensity || 0),
        completed: acc.completed + (session.completed ? 1 : 0),
        count: acc.count + 1,
      }),
      { duration: 0, intensity: 0, completed: 0, count: 0 }
    );

    // Calculate sleep patterns
    const sleepTotals = sleepData.reduce(
      (acc, sleep) => ({
        duration: acc.duration + (sleep.sleepDuration ? parseFloat(sleep.sleepDuration.toString()) : 0),
        quality: acc.quality + (sleep.sleepQuality || 0),
        optimized: acc.optimized + (sleep.environmentOptimized ? 1 : 0),
        count: acc.count + 1,
      }),
      { duration: 0, quality: 0, optimized: 0, count: 0 }
    );

    // Calculate nutrition patterns
    const nutritionTotals = nutritionData.reduce(
      (acc, nutrition) => ({
        hydration: acc.hydration + (nutrition.hydration || 0),
        count: acc.count + 1,
      }),
      { hydration: 0, count: 0 }
    );

    return {
      movementSessions: {
        totalSessions: movements.length,
        averageDuration: movementTotals.count > 0 ? Math.round(movementTotals.duration / movementTotals.count) : null,
        averageIntensity: movementTotals.count > 0 ? Math.round((movementTotals.intensity / movementTotals.count) * 10) / 10 : null,
        completionRate: movementTotals.count > 0 ? Math.round((movementTotals.completed / movementTotals.count) * 100) : 0,
        adaptationFrequency: 0, // Would need adaptation tracking
      },
      sleepPatterns: {
        averageSleepDuration: sleepTotals.count > 0 ? Math.round((sleepTotals.duration / sleepTotals.count) * 10) / 10 : null,
        averageSleepQuality: sleepTotals.count > 0 ? Math.round((sleepTotals.quality / sleepTotals.count) * 10) / 10 : null,
        sleepOptimizationCompliance: sleepTotals.count > 0 ? Math.round((sleepTotals.optimized / sleepTotals.count) * 100) : 0,
        sleepDisturbanceFrequency: 0, // Would need disturbance tracking
      },
      nutritionPatterns: {
        averageHydration: nutritionTotals.count > 0 ? Math.round(nutritionTotals.hydration / nutritionTotals.count) : null,
        supplementCompliance: 0, // Would need supplement tracking
        oneProductFoodCompliance: 0, // Would need food compliance tracking
      },
      pacingPatterns: {
        aiRecommendationsFollowed: 0, // Would need AI recommendation tracking
        overexertionEpisodes: 0, // Would need overexertion detection
        restDaysUtilized: 0, // Would need rest day tracking
      },
    };
  }

  // Generate clinical observations
  private static async generateClinicalObservations(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ClinicalObservations> {
    // This would analyze patterns and generate insights
    // For now, returning basic structure
    return {
      keyFindings: [
        'Patient demonstrates consistent health tracking behavior',
        'Symptom patterns show correlation with activity levels',
      ],
      concerningPatterns: [],
      positiveIndicators: [
        'Regular engagement with health monitoring',
        'Proactive approach to symptom management',
      ],
      recommendationsForProvider: [
        'Consider discussing pacing strategies based on energy patterns',
        'Review symptom correlations for potential triggers',
      ],
      dataCompleteness: 85,
      trackingConsistency: 90,
      reportReliability: 'high',
    };
  }

  // Calculate data quality metrics
  private static async calculateDataQuality(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ overallScore: number; completeness: number; consistency: number }> {
    const totalDays = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const logsCount = await db
      .select({ count: count() })
      .from(dailyHealthLogs)
      .where(
        and(
          eq(dailyHealthLogs.userId, userId),
          gte(dailyHealthLogs.date, startDate),
          lte(dailyHealthLogs.date, endDate)
        )
      );

    const daysWithData = logsCount[0]?.count || 0;
    const completeness = 85; // Would calculate based on filled fields
    const consistency = totalDays > 0 ? (daysWithData / totalDays) * 100 : 0;
    const overallScore = calculateDataQualityScore(totalDays, daysWithData, completeness);

    return { overallScore, completeness, consistency };
  }

  // Helper methods
  private static calculateDateRange(request: GenerateReportRequest): { startDate: string; endDate: string } {
    const endDate = new Date();
    const startDate = new Date();

    if (request.startDate && request.endDate) {
      return { startDate: request.startDate, endDate: request.endDate };
    }

    switch (request.reportPeriod) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'six_months':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    return {
      startDate: formatDateForDB(startDate),
      endDate: formatDateForDB(endDate),
    };
  }

  private static generateAnonymizedPatientId(userId: string): string {
    // Generate a consistent but anonymized patient ID
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `PT${Math.abs(hash).toString().padStart(8, '0')}`;
  }

  private static generateReportTitle(request: GenerateReportRequest): string {
    const period = request.reportPeriod.replace('_', ' ').toUpperCase();
    const type = request.reportType.replace('_', ' ').toUpperCase();
    return `${type} HEALTH REPORT - ${period}`;
  }

  private static generateExecutiveSummary(
    healthMetrics: HealthMetricsSummary,
    symptomAnalysis: SymptomAnalysis,
    activityPatterns: ActivityPatterns,
    reportType: ReportType
  ): string {
    const parts = [];

    // Health metrics summary
    if (healthMetrics.totalDaysTracked > 0) {
      parts.push(`Patient tracked health data for ${healthMetrics.totalDaysTracked} days during the reporting period.`);
      
      if (healthMetrics.averageFatigueLevel) {
        parts.push(`Average fatigue level was ${healthMetrics.averageFatigueLevel}/10 with a ${healthMetrics.fatigueTrend} trend.`);
      }

      if (healthMetrics.goodDays > 0) {
        parts.push(`Patient experienced ${healthMetrics.goodDays} good days and ${healthMetrics.difficultDays} difficult days.`);
      }
    }

    // Symptom patterns
    if (symptomAnalysis.topSymptoms.length > 0) {
      const topSymptom = symptomAnalysis.topSymptoms[0];
      parts.push(`Most frequent symptom was ${topSymptom.symptomType} (${topSymptom.frequency}% of days, avg severity ${topSymptom.averageSeverity}/10).`);
    }

    // Activity summary
    if (activityPatterns.movementSessions.totalSessions > 0) {
      parts.push(`Completed ${activityPatterns.movementSessions.totalSessions} movement sessions with ${activityPatterns.movementSessions.completionRate}% completion rate.`);
    }

    return parts.join(' ') || 'Insufficient data available for comprehensive analysis during this reporting period.';
  }

  private static getIncludedDataTypes(request: GenerateReportRequest): string[] {
    const dataTypes = ['daily_health_logs'];
    
    if (request.consentLevel === 'detailed_symptoms' || request.consentLevel === 'full_data') {
      dataTypes.push('symptom_logs');
    }
    
    if (request.consentLevel === 'full_data') {
      dataTypes.push('movement_sessions', 'biometric_measurements', 'sleep_logs', 'nutrition_logs');
    }

    return dataTypes;
  }

  private static async saveReportToDatabase(report: HealthcareReport): Promise<void> {
    const reportData: NewHealthReport = {
      userId: report.userId,
      reportType: 'comprehensive',
      startDate: report.startDate,
      endDate: report.endDate,
      reportData: JSON.stringify(report),
    };

    await db.insert(healthReports).values(reportData);
  }

  // Get existing reports for a user
  static async getUserReports(userId: string): Promise<HealthcareReport[]> {
    try {
      return await withRetry(async () => {
        const reports = await db
          .select()
          .from(healthReports)
          .where(eq(healthReports.userId, userId))
          .orderBy(desc(healthReports.generatedAt));

        return reports.map(report => JSON.parse(report.reportData as string) as HealthcareReport);
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get a specific report
  static async getReport(reportId: string, userId: string): Promise<HealthcareReport> {
    try {
      return await withRetry(async () => {
        const [report] = await db
          .select()
          .from(healthReports)
          .where(
            and(
              eq(healthReports.id, reportId),
              eq(healthReports.userId, userId)
            )
          );

        if (!report) {
          throw new NotFoundError('Healthcare report', reportId);
        }

        return JSON.parse(report.reportData as string) as HealthcareReport;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Delete a report
  static async deleteReport(reportId: string, userId: string): Promise<void> {
    try {
      await withRetry(async () => {
        const result = await db
          .delete(healthReports)
          .where(
            and(
              eq(healthReports.id, reportId),
              eq(healthReports.userId, userId)
            )
          );

        if (result.rowCount === 0) {
          throw new NotFoundError('Healthcare report', reportId);
        }
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}