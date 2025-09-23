import { eq, and, desc, gte, lte, count } from 'drizzle-orm';
import { db } from '../connection';
import {
  movementSessions,
  type MovementSession,
  type NewMovementSession,
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
  validateMovementSession,
  validateCreateMovementSession,
  validateUpdateMovementSession,
  calculateSessionIntensity,
  calculateCompletionPercentage,
  type CreateMovementSession,
  type UpdateMovementSession,
} from '../../types/movement.types';

export class MovementService {
  // Create a new movement session
  static async createMovementSession(sessionData: CreateMovementSession): Promise<MovementSession> {
    try {
      // Validate input data
      const validatedData = validateCreateMovementSession(sessionData);
      
      // Calculate derived fields
      const intensity = calculateSessionIntensity(validatedData.exercises || []);
      const completionPercentage = calculateCompletionPercentage(validatedData.exercises || []);
      
      return await withRetry(async () => {
        const [session] = await db.insert(movementSessions).values({
          ...validatedData,
          intensity: validatedData.intensity || intensity,
          completionPercentage,
        }).returning();
        
        return validateMovementSession(session);
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get movement session by ID
  static async getMovementSessionById(id: string): Promise<MovementSession> {
    try {
      return await withRetry(async () => {
        const [session] = await db
          .select()
          .from(movementSessions)
          .where(eq(movementSessions.id, id));
        
        if (!session) {
          throw new NotFoundError('Movement session', id);
        }
        
        return validateMovementSession(session);
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get movement sessions for a user with pagination and filtering
  static async getMovementSessionsByUser(
    userId: string,
    options: PaginationOptions & {
      startDate?: string;
      endDate?: string;
      sessionType?: string;
      completed?: boolean;
    } = {}
  ): Promise<PaginatedResult<MovementSession>> {
    try {
      return await withRetry(async () => {
        const { page = 1, limit = 20, startDate, endDate, sessionType, completed } = options;

        // Build where conditions
        const conditions = [eq(movementSessions.userId, userId)];
        
        if (startDate) {
          conditions.push(gte(movementSessions.date, startDate));
        }
        
        if (endDate) {
          conditions.push(lte(movementSessions.date, endDate));
        }
        
        if (sessionType) {
          conditions.push(eq(movementSessions.sessionType, sessionType));
        }
        
        if (completed !== undefined) {
          conditions.push(eq(movementSessions.completed, completed));
        }

        const whereClause = and(...conditions);

        // Get total count
        const [{ total }] = await db
          .select({ total: count() })
          .from(movementSessions)
          .where(whereClause);

        // Calculate pagination
        const pagination = calculatePagination(page, limit, total);

        // Get data
        const data = await db
          .select()
          .from(movementSessions)
          .where(whereClause)
          .orderBy(desc(movementSessions.date), desc(movementSessions.createdAt))
          .limit(pagination.limit)
          .offset(pagination.offset);

        const validatedData = data.map(session => validateMovementSession(session));

        return {
          data: validatedData,
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

  // Update movement session
  static async updateMovementSession(
    id: string,
    sessionData: UpdateMovementSession
  ): Promise<MovementSession> {
    try {
      const validatedData = validateUpdateMovementSession(sessionData);
      
      // Recalculate derived fields if exercises were updated
      let updateData = { ...validatedData };
      if (validatedData.exercises) {
        updateData.intensity = calculateSessionIntensity(validatedData.exercises);
        updateData.completionPercentage = calculateCompletionPercentage(validatedData.exercises);
        updateData.completed = updateData.completionPercentage === 100;
      }
      
      return await withRetry(async () => {
        const [session] = await db
          .update(movementSessions)
          .set({ ...updateData, updatedAt: new Date() })
          .where(eq(movementSessions.id, id))
          .returning();
        
        if (!session) {
          throw new NotFoundError('Movement session', id);
        }
        
        return validateMovementSession(session);
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get movement session for specific date
  static async getMovementSessionByDate(
    userId: string,
    date: string,
    sessionType?: string
  ): Promise<MovementSession | null> {
    try {
      return await withRetry(async () => {
        const conditions = [
          eq(movementSessions.userId, userId),
          eq(movementSessions.date, date)
        ];
        
        if (sessionType) {
          conditions.push(eq(movementSessions.sessionType, sessionType));
        }

        const [session] = await db
          .select()
          .from(movementSessions)
          .where(and(...conditions))
          .orderBy(desc(movementSessions.createdAt))
          .limit(1);
        
        return session ? validateMovementSession(session) : null;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Complete a movement session (mark exercises as completed)
  static async completeMovementSession(id: string): Promise<MovementSession> {
    try {
      return await withRetry(async () => {
        // First get the current session
        const currentSession = await this.getMovementSessionById(id);
        
        // Mark all exercises as completed
        const completedExercises = currentSession.exercises?.map(exercise => ({
          ...exercise,
          completed: true,
        })) || [];
        
        // Update the session
        return await this.updateMovementSession(id, {
          exercises: completedExercises,
          completed: true,
          completionPercentage: 100,
        });
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get movement statistics for a user
  static async getMovementStats(
    userId: string,
    days: number = 30
  ): Promise<{
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
    averageIntensity: number;
    averageDuration: number;
    mostCommonSessionType: string | null;
    totalExerciseTime: number; // in minutes
  }> {
    try {
      return await withRetry(async () => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const sessions = await db
          .select()
          .from(movementSessions)
          .where(
            and(
              eq(movementSessions.userId, userId),
              gte(movementSessions.date, formatDateForDB(startDate)),
              lte(movementSessions.date, formatDateForDB(endDate))
            )
          );

        if (sessions.length === 0) {
          return {
            totalSessions: 0,
            completedSessions: 0,
            completionRate: 0,
            averageIntensity: 0,
            averageDuration: 0,
            mostCommonSessionType: null,
            totalExerciseTime: 0,
          };
        }

        const validatedSessions = sessions.map(s => validateMovementSession(s));
        const completedSessions = validatedSessions.filter(s => s.completed);
        
        // Calculate statistics
        const totalSessions = validatedSessions.length;
        const completionRate = Math.round((completedSessions.length / totalSessions) * 100);
        
        const intensities = validatedSessions
          .map(s => s.intensity)
          .filter((i): i is number => i !== null && i !== undefined);
        const averageIntensity = intensities.length > 0 
          ? Math.round((intensities.reduce((sum, i) => sum + i, 0) / intensities.length) * 10) / 10
          : 0;
        
        const durations = validatedSessions
          .map(s => s.duration)
          .filter((d): d is number => d !== null && d !== undefined);
        const averageDuration = durations.length > 0
          ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
          : 0;
        
        const totalExerciseTime = Math.round(durations.reduce((sum, d) => sum + d, 0) / 60); // convert to minutes
        
        // Find most common session type
        const sessionTypeCounts = validatedSessions.reduce((acc, session) => {
          acc[session.sessionType] = (acc[session.sessionType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const mostCommonSessionType = Object.entries(sessionTypeCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

        return {
          totalSessions,
          completedSessions: completedSessions.length,
          completionRate,
          averageIntensity,
          averageDuration,
          mostCommonSessionType,
          totalExerciseTime,
        };
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Delete movement session
  static async deleteMovementSession(id: string): Promise<void> {
    try {
      await withRetry(async () => {
        const result = await db
          .delete(movementSessions)
          .where(eq(movementSessions.id, id));
        
        if (result.rowCount === 0) {
          throw new NotFoundError('Movement session', id);
        }
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get recent movement sessions for dashboard
  static async getRecentMovementSessions(
    userId: string,
    limit: number = 5
  ): Promise<MovementSession[]> {
    try {
      return await withRetry(async () => {
        const sessions = await db
          .select()
          .from(movementSessions)
          .where(eq(movementSessions.userId, userId))
          .orderBy(desc(movementSessions.date), desc(movementSessions.createdAt))
          .limit(limit);

        return sessions.map(session => validateMovementSession(session));
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}