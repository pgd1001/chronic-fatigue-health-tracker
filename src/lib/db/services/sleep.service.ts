import { db } from '@/lib/db/connection';
import { sleepLogs, dailyHealthLogs } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm';
import type { SleepLog, NewSleepLog } from '@/lib/db/schema';

export interface SleepOptimizationData {
  date: string;
  bluelightReduction: boolean;
  screenReplacement: boolean;
  environmentOptimized: boolean;
  bedtime?: string;
  sleepQuality?: number;
  sleepDuration?: number;
  notes?: string;
}

export interface SleepTrendData {
  date: string;
  sleepQuality: number;
  sleepDuration?: number;
  energyLevel?: number;
  routineCompletion: number;
  bluelightReduction: boolean;
  screenReplacement: boolean;
  environmentOptimized: boolean;
}

export interface SleepCorrelationData {
  sleepQuality: number;
  energyLevel: number;
  date: string;
}

export class SleepService {
  /**
   * Create or update a sleep log entry
   */
  static async createOrUpdateSleepLog(
    userId: string, 
    data: SleepOptimizationData
  ): Promise<SleepLog> {
    try {
      // Check if entry exists for this date
      const existingLog = await db
        .select()
        .from(sleepLogs)
        .where(and(
          eq(sleepLogs.userId, userId),
          eq(sleepLogs.date, data.date)
        ))
        .limit(1);

      const sleepLogData: Partial<NewSleepLog> = {
        userId,
        date: data.date,
        bluelightReduction: data.bluelightReduction,
        screenReplacement: data.screenReplacement,
        environmentOptimized: data.environmentOptimized,
        notes: data.notes || null,
      };

      // Add optional fields if provided
      if (data.bedtime) {
        // Convert time string to timestamp for today's date
        const bedtimeDate = new Date(data.date + 'T' + data.bedtime);
        sleepLogData.bedtime = bedtimeDate;
      }

      if (data.sleepQuality !== undefined) {
        sleepLogData.sleepQuality = data.sleepQuality;
      }

      if (data.sleepDuration !== undefined) {
        sleepLogData.sleepDuration = data.sleepDuration.toString();
      }

      if (existingLog.length > 0) {
        // Update existing log
        const [updatedLog] = await db
          .update(sleepLogs)
          .set(sleepLogData)
          .where(eq(sleepLogs.id, existingLog[0].id))
          .returning();
        
        return updatedLog;
      } else {
        // Create new log
        const [newLog] = await db
          .insert(sleepLogs)
          .values(sleepLogData as NewSleepLog)
          .returning();
        
        return newLog;
      }
    } catch (error) {
      console.error('Error creating/updating sleep log:', error);
      throw new Error('Failed to save sleep data');
    }
  }

  /**
   * Get sleep logs for a user within a date range
   */
  static async getSleepLogs(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<SleepLog[]> {
    try {
      const logs = await db
        .select()
        .from(sleepLogs)
        .where(and(
          eq(sleepLogs.userId, userId),
          gte(sleepLogs.date, startDate),
          lte(sleepLogs.date, endDate)
        ))
        .orderBy(asc(sleepLogs.date));

      return logs;
    } catch (error) {
      console.error('Error fetching sleep logs:', error);
      throw new Error('Failed to fetch sleep data');
    }
  }

  /**
   * Get sleep trend data with energy correlation
   */
  static async getSleepTrendData(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<SleepTrendData[]> {
    try {
      // Get sleep logs
      const sleepData = await this.getSleepLogs(userId, startDate, endDate);
      
      // Get corresponding health logs for energy levels
      const healthData = await db
        .select({
          date: dailyHealthLogs.date,
          energyLevel: dailyHealthLogs.energyLevel,
        })
        .from(dailyHealthLogs)
        .where(and(
          eq(dailyHealthLogs.userId, userId),
          gte(dailyHealthLogs.date, startDate),
          lte(dailyHealthLogs.date, endDate)
        ));

      // Create a map for quick energy level lookup
      const energyMap = new Map(
        healthData.map(h => [h.date, h.energyLevel])
      );

      // Combine data
      const trendData: SleepTrendData[] = sleepData.map(sleep => {
        const routineCompletion = this.calculateRoutineCompletion(
          sleep.bluelightReduction,
          sleep.screenReplacement,
          sleep.environmentOptimized
        );

        return {
          date: sleep.date,
          sleepQuality: sleep.sleepQuality || 0,
          sleepDuration: sleep.sleepDuration ? parseFloat(sleep.sleepDuration) : undefined,
          energyLevel: energyMap.get(sleep.date) || undefined,
          routineCompletion,
          bluelightReduction: sleep.bluelightReduction,
          screenReplacement: sleep.screenReplacement,
          environmentOptimized: sleep.environmentOptimized,
        };
      });

      return trendData;
    } catch (error) {
      console.error('Error fetching sleep trend data:', error);
      throw new Error('Failed to fetch sleep trend data');
    }
  }

  /**
   * Calculate correlation between sleep quality and energy levels
   */
  static async calculateSleepEnergyCorrelation(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<number | null> {
    try {
      const trendData = await this.getSleepTrendData(userId, startDate, endDate);
      
      // Filter data where both sleep quality and energy level are available
      const correlationData = trendData.filter(
        d => d.sleepQuality > 0 && d.energyLevel !== undefined
      );

      if (correlationData.length < 3) {
        return null; // Not enough data for meaningful correlation
      }

      // Calculate Pearson correlation coefficient
      const n = correlationData.length;
      const sleepValues = correlationData.map(d => d.sleepQuality);
      const energyValues = correlationData.map(d => d.energyLevel!);

      const sleepMean = sleepValues.reduce((sum, val) => sum + val, 0) / n;
      const energyMean = energyValues.reduce((sum, val) => sum + val, 0) / n;

      let numerator = 0;
      let sleepSumSquares = 0;
      let energySumSquares = 0;

      for (let i = 0; i < n; i++) {
        const sleepDiff = sleepValues[i] - sleepMean;
        const energyDiff = energyValues[i] - energyMean;
        
        numerator += sleepDiff * energyDiff;
        sleepSumSquares += sleepDiff * sleepDiff;
        energySumSquares += energyDiff * energyDiff;
      }

      const denominator = Math.sqrt(sleepSumSquares * energySumSquares);
      
      if (denominator === 0) {
        return 0;
      }

      const correlation = numerator / denominator;
      return Math.round(correlation * 1000) / 1000; // Round to 3 decimal places
    } catch (error) {
      console.error('Error calculating sleep-energy correlation:', error);
      return null;
    }
  }

  /**
   * Get recent sleep log for a user
   */
  static async getRecentSleepLog(userId: string): Promise<SleepLog | null> {
    try {
      const [recentLog] = await db
        .select()
        .from(sleepLogs)
        .where(eq(sleepLogs.userId, userId))
        .orderBy(desc(sleepLogs.date))
        .limit(1);

      return recentLog || null;
    } catch (error) {
      console.error('Error fetching recent sleep log:', error);
      return null;
    }
  }

  /**
   * Get sleep log for a specific date
   */
  static async getSleepLogByDate(
    userId: string, 
    date: string
  ): Promise<SleepLog | null> {
    try {
      const [log] = await db
        .select()
        .from(sleepLogs)
        .where(and(
          eq(sleepLogs.userId, userId),
          eq(sleepLogs.date, date)
        ))
        .limit(1);

      return log || null;
    } catch (error) {
      console.error('Error fetching sleep log by date:', error);
      return null;
    }
  }

  /**
   * Delete a sleep log
   */
  static async deleteSleepLog(userId: string, logId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(sleepLogs)
        .where(and(
          eq(sleepLogs.id, logId),
          eq(sleepLogs.userId, userId)
        ));

      return true;
    } catch (error) {
      console.error('Error deleting sleep log:', error);
      return false;
    }
  }

  /**
   * Calculate routine completion percentage
   */
  private static calculateRoutineCompletion(
    bluelightReduction: boolean,
    screenReplacement: boolean,
    environmentOptimized: boolean
  ): number {
    const completed = [bluelightReduction, screenReplacement, environmentOptimized]
      .filter(Boolean).length;
    return Math.round((completed / 3) * 100);
  }

  /**
   * Get sleep statistics for a user
   */
  static async getSleepStatistics(
    userId: string,
    days: number = 30
  ): Promise<{
    averageQuality: number;
    averageDuration: number;
    averageRoutineCompletion: number;
    totalLogs: number;
    bestQualityDate: string | null;
    worstQualityDate: string | null;
  }> {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      const trendData = await this.getSleepTrendData(userId, startDate, endDate);

      if (trendData.length === 0) {
        return {
          averageQuality: 0,
          averageDuration: 0,
          averageRoutineCompletion: 0,
          totalLogs: 0,
          bestQualityDate: null,
          worstQualityDate: null,
        };
      }

      const qualityData = trendData.filter(d => d.sleepQuality > 0);
      const durationData = trendData.filter(d => d.sleepDuration !== undefined);

      const averageQuality = qualityData.length > 0
        ? qualityData.reduce((sum, d) => sum + d.sleepQuality, 0) / qualityData.length
        : 0;

      const averageDuration = durationData.length > 0
        ? durationData.reduce((sum, d) => sum + (d.sleepDuration || 0), 0) / durationData.length
        : 0;

      const averageRoutineCompletion = trendData.reduce((sum, d) => sum + d.routineCompletion, 0) / trendData.length;

      // Find best and worst quality dates
      let bestQualityDate: string | null = null;
      let worstQualityDate: string | null = null;

      if (qualityData.length > 0) {
        const sortedByQuality = [...qualityData].sort((a, b) => b.sleepQuality - a.sleepQuality);
        bestQualityDate = sortedByQuality[0].date;
        worstQualityDate = sortedByQuality[sortedByQuality.length - 1].date;
      }

      return {
        averageQuality: Math.round(averageQuality * 10) / 10,
        averageDuration: Math.round(averageDuration * 10) / 10,
        averageRoutineCompletion: Math.round(averageRoutineCompletion),
        totalLogs: trendData.length,
        bestQualityDate,
        worstQualityDate,
      };
    } catch (error) {
      console.error('Error calculating sleep statistics:', error);
      throw new Error('Failed to calculate sleep statistics');
    }
  }
}