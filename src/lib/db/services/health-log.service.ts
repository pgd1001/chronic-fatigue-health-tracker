import { eq, and, desc, gte, lte, count } from 'drizzle-orm';
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

export class HealthLogService {
  // Create a new health log entry
  static async createHealthLog(logData: NewDailyHealthLog): Promise<DailyHealthLog> {
    try {
      return await withRetry(async () => {
        const [log] = await db.insert(dailyHealthLogs).values(logData).returning();
        return log;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get health log by ID
  static async getHealthLogById(id: string): Promise<DailyHealthLog> {
    try {
      return await withRetry(async () => {
        const [log] = await db
          .select()
          .from(dailyHealthLogs)
          .where(eq(dailyHealthLogs.id, id));
        
        if (!log) {
          throw new NotFoundError('Health log', id);
        }
        return log;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get health log for specific user and date
  static async getHealthLogByDate(
    userId: string,
    date: string
  ): Promise<DailyHealthLog | null> {
    try {
      return await withRetry(async () => {
        const [log] = await db
          .select()
          .from(dailyHealthLogs)
          .where(
            and(
              eq(dailyHealthLogs.userId, userId),
              eq(dailyHealthLogs.date, date)
            )
          );
        return log || null;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get health logs for a user with pagination
  static async getHealthLogsByUser(
    userId: string,
    options: PaginationOptions & {
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<PaginatedResult<DailyHealthLog>> {
    try {
      return await withRetry(async () => {
        const { page = 1, limit = 30, startDate, endDate } = options;

        // Build where conditions
        const conditions = [eq(dailyHealthLogs.userId, userId)];
        
        if (startDate) {
          conditions.push(gte(dailyHealthLogs.date, startDate));
        }
        
        if (endDate) {
          conditions.push(lte(dailyHealthLogs.date, endDate));
        }

        const whereClause = and(...conditions);

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

  // Update health log
  static async updateHealthLog(
    id: string,
    logData: Partial<NewDailyHealthLog>
  ): Promise<DailyHealthLog> {
    try {
      return await withRetry(async () => {
        const [log] = await db
          .update(dailyHealthLogs)
          .set({ ...logData, updatedAt: new Date() })
          .where(eq(dailyHealthLogs.id, id))
          .returning();
        
        if (!log) {
          throw new NotFoundError('Health log', id);
        }
        return log;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Update or create health log for a specific date
  static async upsertHealthLogByDate(
    userId: string,
    date: string,
    logData: Partial<NewDailyHealthLog>
  ): Promise<DailyHealthLog> {
    try {
      return await withRetry(async () => {
        const existingLog = await this.getHealthLogByDate(userId, date);
        
        if (existingLog) {
          return await this.updateHealthLog(existingLog.id, logData);
        } else {
          return await this.createHealthLog({
            userId,
            date,
            ...logData,
          });
        }
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Delete health log
  static async deleteHealthLog(id: string): Promise<void> {
    try {
      await withRetry(async () => {
        const result = await db
          .delete(dailyHealthLogs)
          .where(eq(dailyHealthLogs.id, id));
        
        if (result.rowCount === 0) {
          throw new NotFoundError('Health log', id);
        }
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get recent health trends
  static async getHealthTrends(
    userId: string,
    days: number = 30
  ): Promise<{
    averageEnergy: number | null;
    averageFatigue: number | null;
    averagePain: number | null;
    averageSleep: number | null;
    completionRate: number;
  }> {
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

        if (logs.length === 0) {
          return {
            averageEnergy: null,
            averageFatigue: null,
            averagePain: null,
            averageSleep: null,
            completionRate: 0,
          };
        }

        const totals = logs.reduce(
          (acc, log) => ({
            energy: acc.energy + (log.energyLevel || 0),
            fatigue: acc.fatigue + (log.fatigueLevel || 0),
            pain: acc.pain + (log.painLevel || 0),
            sleep: acc.sleep + (log.sleepQuality || 0),
            completed: acc.completed + (log.completedDailyAnchor ? 1 : 0),
          }),
          { energy: 0, fatigue: 0, pain: 0, sleep: 0, completed: 0 }
        );

        const count = logs.length;

        return {
          averageEnergy: Math.round((totals.energy / count) * 10) / 10,
          averageFatigue: Math.round((totals.fatigue / count) * 10) / 10,
          averagePain: Math.round((totals.pain / count) * 10) / 10,
          averageSleep: Math.round((totals.sleep / count) * 10) / 10,
          completionRate: Math.round((totals.completed / count) * 100),
        };
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}