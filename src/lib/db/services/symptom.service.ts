import { eq, and, desc, gte, lte, count, avg, sql } from 'drizzle-orm';
import { db } from '../connection';
import {
  dailyHealthLogs,
  type DailyHealthLog,
  type NewDailyHealthLog,
} from '../schema';
import {
  handleDatabaseError,
  NotFoundError,
  withRetry,
  type PaginationOptions,
  type PaginatedResult,
  calculatePagination,
  formatDateForDB,
} from '../utils';
import {
  type SymptomEntry,
  type ProgressMetrics,
  type SymptomPattern,
  type SymptomCorrelation,
  type SymptomType,
  getSymptomDisplayName,
} from '../../types/symptom.types';

export class SymptomService {
  // Create or update symptom log for a specific date
  static async upsertSymptomLog(
    userId: string,
    date: string,
    symptomData: {
      fatigueLevel?: number;
      postExertionalMalaise?: number;
      brainFogLevel?: number;
      sleepQuality?: number;
      overallWellbeing?: number;
      moodRating?: number;
      anxietyLevel?: number;
      symptoms?: SymptomEntry[];
      notes?: string;
    }
  ): Promise<DailyHealthLog> {
    try {
      return await withRetry(async () => {
        // Check if log exists for this date
        const [existingLog] = await db
          .select()
          .from(dailyHealthLogs)
          .where(
            and(
              eq(dailyHealthLogs.userId, userId),
              eq(dailyHealthLogs.date, date)
            )
          );

        const logData = {
          fatigueLevel: symptomData.fatigueLevel,
          brainFogLevel: symptomData.brainFogLevel,
          sleepQuality: symptomData.sleepQuality,
          notes: symptomData.notes,
          symptoms: symptomData.symptoms ? JSON.stringify(symptomData.symptoms) : null,
          updatedAt: new Date(),
        };

        if (existingLog) {
          // Update existing log
          const [updatedLog] = await db
            .update(dailyHealthLogs)
            .set(logData)
            .where(eq(dailyHealthLogs.id, existingLog.id))
            .returning();
          return updatedLog;
        } else {
          // Create new log
          const [newLog] = await db
            .insert(dailyHealthLogs)
            .values({
              userId,
              date,
              ...logData,
            })
            .returning();
          return newLog;
        }
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get symptom logs for a date range
  static async getSymptomLogs(
    userId: string,
    startDate: string,
    endDate: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<DailyHealthLog>> {
    try {
      return await withRetry(async () => {
        const { page = 1, limit = 30 } = options;

        const whereClause = and(
          eq(dailyHealthLogs.userId, userId),
          gte(dailyHealthLogs.date, startDate),
          lte(dailyHealthLogs.date, endDate)
        );

        // Get total count
        const [{ total }] = await db
          .select({ total: count() })
          .from(dailyHealthLogs)
          .where(whereClause);

        // Calculate pagination
        const pagination = calculatePagination(page, limit, total);

        // Get data
        const data = await db
          .select()
          .from(dailyHealthLogs)
          .where(whereClause)
          .orderBy(desc(dailyHealthLogs.date))
          .limit(pagination.limit)
          .offset(pagination.offset);

        return {
          data,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages: pagination.totalPages,
            hasNext: pagination.hasNext,
            hasPrev: pagination.hasPrev,
          },
        };
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Calculate progress metrics for a time period
  static async calculateProgressMetrics(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ProgressMetrics> {
    try {
      return await withRetry(async () => {
        const logs = await db
          .select()
          .from(dailyHealthLogs)
          .where(
            and(
              eq(dailyHealthLogs.userId, userId),
              gte(dailyHealthLogs.date, startDate),
              lte(dailyHealthLogs.date, endDate)
            )
          )
          .orderBy(dailyHealthLogs.date);

        if (logs.length === 0) {
          return {
            period: 'month',
            startDate,
            endDate,
            averageFatigue: null,
            averagePEM: null,
            averageBrainFog: null,
            averageSleep: null,
            averageWellbeing: null,
            fatiguetrend: 'insufficient_data',
            overallTrend: 'insufficient_data',
            goodDays: 0,
            difficultDays: 0,
            topSymptoms: [],
          };
        }

        // Calculate averages
        const totals = logs.reduce(
          (acc, log) => ({
            fatigue: acc.fatigue + (log.fatigueLevel || 0),
            brainFog: acc.brainFog + (log.brainFogLevel || 0),
            sleep: acc.sleep + (log.sleepQuality || 0),
            count: acc.count + 1,
          }),
          { fatigue: 0, brainFog: 0, sleep: 0, count: 0 }
        );

        const averageFatigue = totals.count > 0 ? Math.round((totals.fatigue / totals.count) * 10) / 10 : null;
        const averageBrainFog = totals.count > 0 ? Math.round((totals.brainFog / totals.count) * 10) / 10 : null;
        const averageSleep = totals.count > 0 ? Math.round((totals.sleep / totals.count) * 10) / 10 : null;

        // Calculate trend (compare first half vs second half)
        const midPoint = Math.floor(logs.length / 2);
        const firstHalf = logs.slice(0, midPoint);
        const secondHalf = logs.slice(midPoint);

        const firstHalfAvg = firstHalf.reduce((sum, log) => sum + (log.fatigueLevel || 0), 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, log) => sum + (log.fatigueLevel || 0), 0) / secondHalf.length;

        let fatiguetrend: 'improving' | 'stable' | 'worsening' | 'insufficient_data' = 'insufficient_data';
        if (logs.length >= 7) {
          const difference = secondHalfAvg - firstHalfAvg;
          if (Math.abs(difference) < 0.5) {
            fatiguetrend = 'stable';
          } else {
            fatiguetrend = difference < 0 ? 'improving' : 'worsening';
          }
        }

        // Count good and difficult days (using fatigue as proxy for wellbeing)
        const goodDays = logs.filter(log => (log.fatigueLevel || 10) <= 4).length;
        const difficultDays = logs.filter(log => (log.fatigueLevel || 0) >= 7).length;

        // Analyze symptom patterns
        const symptomCounts: Record<string, { total: number; count: number }> = {};
        
        logs.forEach(log => {
          if (log.symptoms) {
            try {
              const symptoms = JSON.parse(log.symptoms as string) as SymptomEntry[];
              symptoms.forEach(symptom => {
                if (!symptomCounts[symptom.type]) {
                  symptomCounts[symptom.type] = { total: 0, count: 0 };
                }
                symptomCounts[symptom.type].total += symptom.severity;
                symptomCounts[symptom.type].count += 1;
              });
            } catch (e) {
              // Skip invalid JSON
            }
          }
        });

        const topSymptoms: SymptomPattern[] = Object.entries(symptomCounts)
          .map(([type, data]) => ({
            symptomType: type as SymptomType,
            averageSeverity: Math.round((data.total / data.count) * 10) / 10,
            frequency: Math.round((data.count / logs.length) * 100),
            trendDirection: 'stable' as const, // Would need more complex analysis
          }))
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 5);

        return {
          period: 'month',
          startDate,
          endDate,
          averageFatigue,
          averagePEM: null, // Would need separate tracking
          averageBrainFog,
          averageSleep,
          averageWellbeing: null, // Would need separate tracking
          fatiguetrend,
          overallTrend: fatiguetrend,
          goodDays,
          difficultDays,
          topSymptoms,
        };
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get symptom trends over time
  static async getSymptomTrends(
    userId: string,
    symptomType: SymptomType,
    days: number = 30
  ): Promise<Array<{ date: string; severity: number | null }>> {
    try {
      return await withRetry(async () => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const logs = await db
          .select()
          .from(dailyHealthLogs)
          .where(
            and(
              eq(dailyHealthLogs.userId, userId),
              gte(dailyHealthLogs.date, formatDateForDB(startDate)),
              lte(dailyHealthLogs.date, formatDateForDB(endDate))
            )
          )
          .orderBy(dailyHealthLogs.date);

        return logs.map(log => {
          let severity: number | null = null;

          // Check core symptoms first
          if (symptomType === 'fatigue') {
            severity = log.fatigueLevel;
          } else if (symptomType === 'brain_fog') {
            severity = log.brainFogLevel;
          } else if (symptomType === 'sleep_disturbance') {
            severity = log.sleepQuality ? 11 - log.sleepQuality : null; // Invert sleep quality
          } else {
            // Check in symptoms JSON
            if (log.symptoms) {
              try {
                const symptoms = JSON.parse(log.symptoms as string) as SymptomEntry[];
                const symptom = symptoms.find(s => s.type === symptomType);
                severity = symptom?.severity || null;
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }

          return {
            date: log.date,
            severity,
          };
        });
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Analyze symptom correlations
  static async analyzeSymptomCorrelations(
    userId: string,
    days: number = 90
  ): Promise<SymptomCorrelation[]> {
    try {
      return await withRetry(async () => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const logs = await db
          .select()
          .from(dailyHealthLogs)
          .where(
            and(
              eq(dailyHealthLogs.userId, userId),
              gte(dailyHealthLogs.date, formatDateForDB(startDate)),
              lte(dailyHealthLogs.date, formatDateForDB(endDate))
            )
          );

        // Extract all symptom data
        const dailySymptoms: Record<string, Record<SymptomType, number>> = {};

        logs.forEach(log => {
          const dateKey = log.date;
          dailySymptoms[dateKey] = {} as Record<SymptomType, number>;

          // Add core symptoms
          if (log.fatigueLevel) dailySymptoms[dateKey]['fatigue'] = log.fatigueLevel;
          if (log.brainFogLevel) dailySymptoms[dateKey]['brain_fog'] = log.brainFogLevel;
          if (log.sleepQuality) dailySymptoms[dateKey]['sleep_disturbance'] = 11 - log.sleepQuality;

          // Add additional symptoms
          if (log.symptoms) {
            try {
              const symptoms = JSON.parse(log.symptoms as string) as SymptomEntry[];
              symptoms.forEach(symptom => {
                dailySymptoms[dateKey][symptom.type] = symptom.severity;
              });
            } catch (e) {
              // Skip invalid JSON
            }
          }
        });

        // Calculate correlations between symptoms
        const correlations: SymptomCorrelation[] = [];
        const symptomTypes = Array.from(
          new Set(
            Object.values(dailySymptoms).flatMap(day => Object.keys(day))
          )
        ) as SymptomType[];

        for (let i = 0; i < symptomTypes.length; i++) {
          for (let j = i + 1; j < symptomTypes.length; j++) {
            const symptom1 = symptomTypes[i];
            const symptom2 = symptomTypes[j];

            // Get paired data points
            const pairs: Array<[number, number]> = [];
            Object.values(dailySymptoms).forEach(day => {
              if (day[symptom1] !== undefined && day[symptom2] !== undefined) {
                pairs.push([day[symptom1], day[symptom2]]);
              }
            });

            if (pairs.length >= 5) { // Minimum sample size
              const correlation = this.calculateCorrelation(pairs);
              const significance = this.getCorrelationSignificance(correlation, pairs.length);

              correlations.push({
                symptom1,
                symptom2,
                correlation: Math.round(correlation * 100) / 100,
                significance,
                sampleSize: pairs.length,
              });
            }
          }
        }

        return correlations
          .filter(c => Math.abs(c.correlation) > 0.3) // Only meaningful correlations
          .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Helper method to calculate Pearson correlation coefficient
  private static calculateCorrelation(pairs: Array<[number, number]>): number {
    const n = pairs.length;
    if (n < 2) return 0;

    const sumX = pairs.reduce((sum, [x]) => sum + x, 0);
    const sumY = pairs.reduce((sum, [, y]) => sum + y, 0);
    const sumXY = pairs.reduce((sum, [x, y]) => sum + x * y, 0);
    const sumX2 = pairs.reduce((sum, [x]) => sum + x * x, 0);
    const sumY2 = pairs.reduce((sum, [, y]) => sum + y * y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  // Helper method to determine correlation significance
  private static getCorrelationSignificance(
    correlation: number,
    sampleSize: number
  ): 'low' | 'moderate' | 'high' {
    const absCorr = Math.abs(correlation);
    
    if (sampleSize < 10) return 'low';
    if (absCorr > 0.7 && sampleSize >= 20) return 'high';
    if (absCorr > 0.5 && sampleSize >= 15) return 'moderate';
    if (absCorr > 0.3) return 'low';
    
    return 'low';
  }
}