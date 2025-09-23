import { eq, and, desc, gte, lte, count, avg } from 'drizzle-orm';
import { db } from '../connection';
import {
  biometricMeasurements,
  type BiometricMeasurement,
  type NewBiometricMeasurement,
} from '../schema';
import {
  handleDatabaseError,
  NotFoundError,
  withRetry,
  type PaginationOptions,
  type PaginatedResult,
  calculatePagination,
} from '../utils';
import {
  validateBiometricMeasurement,
  validateCreateBiometricMeasurement,
  type CreateBiometricMeasurement,
  type BiometricTrends,
  getHeartRateZone,
  isHeartRateNormal,
  getHRVInterpretation,
} from '../../types/biometric.types';

export class BiometricService {
  // Create a new biometric measurement
  static async createBiometricMeasurement(
    measurementData: CreateBiometricMeasurement
  ): Promise<BiometricMeasurement> {
    try {
      const validatedData = validateCreateBiometricMeasurement(measurementData);
      
      return await withRetry(async () => {
        const [measurement] = await db
          .insert(biometricMeasurements)
          .values(validatedData)
          .returning();
        
        return validateBiometricMeasurement(measurement);
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get biometric measurement by ID
  static async getBiometricMeasurementById(id: string): Promise<BiometricMeasurement> {
    try {
      return await withRetry(async () => {
        const [measurement] = await db
          .select()
          .from(biometricMeasurements)
          .where(eq(biometricMeasurements.id, id));
        
        if (!measurement) {
          throw new NotFoundError('Biometric measurement', id);
        }
        
        return validateBiometricMeasurement(measurement);
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get biometric measurements for a user with pagination and filtering
  static async getBiometricMeasurementsByUser(
    userId: string,
    options: PaginationOptions & {
      startDate?: Date;
      endDate?: Date;
      quality?: string;
      measurementContext?: string;
    } = {}
  ): Promise<PaginatedResult<BiometricMeasurement>> {
    try {
      return await withRetry(async () => {
        const { page = 1, limit = 50, startDate, endDate, quality, measurementContext } = options;

        // Build where conditions
        const conditions = [eq(biometricMeasurements.userId, userId)];
        
        if (startDate) {
          conditions.push(gte(biometricMeasurements.timestamp, startDate));
        }
        
        if (endDate) {
          conditions.push(lte(biometricMeasurements.timestamp, endDate));
        }
        
        if (quality) {
          conditions.push(eq(biometricMeasurements.quality, quality));
        }
        
        if (measurementContext) {
          conditions.push(eq(biometricMeasurements.measurementContext, measurementContext));
        }

        const whereClause = and(...conditions);

        // Get total count
        const [{ total }] = await db
          .select({ total: count() })
          .from(biometricMeasurements)
          .where(whereClause);

        // Calculate pagination
        const pagination = calculatePagination(page, limit, total);

        // Get data
        const data = await db
          .select()
          .from(biometricMeasurements)
          .where(whereClause)
          .orderBy(desc(biometricMeasurements.timestamp))
          .limit(pagination.limit)
          .offset(pagination.offset);

        const validatedData = data.map(measurement => validateBiometricMeasurement(measurement));

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

  // Get latest biometric measurement for a user
  static async getLatestBiometricMeasurement(userId: string): Promise<BiometricMeasurement | null> {
    try {
      return await withRetry(async () => {
        const [measurement] = await db
          .select()
          .from(biometricMeasurements)
          .where(eq(biometricMeasurements.userId, userId))
          .orderBy(desc(biometricMeasurements.timestamp))
          .limit(1);
        
        return measurement ? validateBiometricMeasurement(measurement) : null;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get biometric trends for a user
  static async getBiometricTrends(
    userId: string,
    days: number = 30
  ): Promise<BiometricTrends> {
    try {
      return await withRetry(async () => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get measurements in the period
        const measurements = await db
          .select()
          .from(biometricMeasurements)
          .where(
            and(
              eq(biometricMeasurements.userId, userId),
              gte(biometricMeasurements.timestamp, startDate),
              lte(biometricMeasurements.timestamp, endDate)
            )
          )
          .orderBy(desc(biometricMeasurements.timestamp));

        if (measurements.length === 0) {
          return {
            userId,
            periodStart: startDate.toISOString().split('T')[0],
            periodEnd: endDate.toISOString().split('T')[0],
            averageHeartRate: undefined,
            restingHeartRate: undefined,
            heartRateVariability: undefined,
            heartRateTrend: 'insufficient_data',
            hrvTrend: 'insufficient_data',
            measurementCount: 0,
            averageQuality: 'poor',
            recommendations: ['Take more biometric measurements to establish trends'],
          };
        }

        const validatedMeasurements = measurements.map(m => validateBiometricMeasurement(m));

        // Calculate averages
        const heartRates = validatedMeasurements
          .map(m => m.heartRate)
          .filter((hr): hr is number => hr !== null && hr !== undefined);
        
        const hrvValues = validatedMeasurements
          .map(m => m.heartRateVariability)
          .filter((hrv): hrv is number => hrv !== null && hrv !== undefined);

        const averageHeartRate = heartRates.length > 0
          ? Math.round(heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length)
          : undefined;

        const averageHRV = hrvValues.length > 0
          ? Math.round((hrvValues.reduce((sum, hrv) => sum + hrv, 0) / hrvValues.length) * 100) / 100
          : undefined;

        // Calculate resting heart rate (measurements marked as 'resting' context)
        const restingMeasurements = validatedMeasurements.filter(m => m.measurementContext === 'resting');
        const restingHeartRates = restingMeasurements
          .map(m => m.heartRate)
          .filter((hr): hr is number => hr !== null && hr !== undefined);
        
        const restingHeartRate = restingHeartRates.length > 0
          ? Math.round(restingHeartRates.reduce((sum, hr) => sum + hr, 0) / restingHeartRates.length)
          : undefined;

        // Calculate quality distribution
        const qualityScores = { excellent: 4, good: 3, fair: 2, poor: 1 };
        const averageQualityScore = validatedMeasurements.reduce((sum, m) => {
          return sum + qualityScores[m.quality];
        }, 0) / validatedMeasurements.length;

        let averageQuality: 'excellent' | 'good' | 'fair' | 'poor';
        if (averageQualityScore >= 3.5) averageQuality = 'excellent';
        else if (averageQualityScore >= 2.5) averageQuality = 'good';
        else if (averageQualityScore >= 1.5) averageQuality = 'fair';
        else averageQuality = 'poor';

        // Calculate trends (simplified - compare first half vs second half of period)
        const midPoint = Math.floor(validatedMeasurements.length / 2);
        const firstHalf = validatedMeasurements.slice(midPoint);
        const secondHalf = validatedMeasurements.slice(0, midPoint);

        const firstHalfHR = firstHalf
          .map(m => m.heartRate)
          .filter((hr): hr is number => hr !== null && hr !== undefined);
        const secondHalfHR = secondHalf
          .map(m => m.heartRate)
          .filter((hr): hr is number => hr !== null && hr !== undefined);

        let heartRateTrend: 'improving' | 'stable' | 'concerning' | 'insufficient_data' = 'insufficient_data';
        if (firstHalfHR.length >= 3 && secondHalfHR.length >= 3) {
          const firstAvg = firstHalfHR.reduce((sum, hr) => sum + hr, 0) / firstHalfHR.length;
          const secondAvg = secondHalfHR.reduce((sum, hr) => sum + hr, 0) / secondHalfHR.length;
          const difference = Math.abs(firstAvg - secondAvg);
          
          if (difference < 3) heartRateTrend = 'stable';
          else if (secondAvg < firstAvg) heartRateTrend = 'improving'; // Lower resting HR is better
          else heartRateTrend = 'concerning';
        }

        // Similar calculation for HRV trend
        const firstHalfHRV = firstHalf
          .map(m => m.heartRateVariability)
          .filter((hrv): hrv is number => hrv !== null && hrv !== undefined);
        const secondHalfHRV = secondHalf
          .map(m => m.heartRateVariability)
          .filter((hrv): hrv is number => hrv !== null && hrv !== undefined);

        let hrvTrend: 'improving' | 'stable' | 'concerning' | 'insufficient_data' = 'insufficient_data';
        if (firstHalfHRV.length >= 3 && secondHalfHRV.length >= 3) {
          const firstAvg = firstHalfHRV.reduce((sum, hrv) => sum + hrv, 0) / firstHalfHRV.length;
          const secondAvg = secondHalfHRV.reduce((sum, hrv) => sum + hrv, 0) / secondHalfHRV.length;
          const difference = Math.abs(firstAvg - secondAvg);
          
          if (difference < 2) hrvTrend = 'stable';
          else if (secondAvg > firstAvg) hrvTrend = 'improving'; // Higher HRV is better
          else hrvTrend = 'concerning';
        }

        // Generate recommendations
        const recommendations: string[] = [];
        
        if (averageQuality === 'poor' || averageQuality === 'fair') {
          recommendations.push('Try to take measurements in better lighting conditions for more accurate results');
        }
        
        if (restingMeasurements.length < measurements.length * 0.3) {
          recommendations.push('Take more measurements in a resting state for better baseline data');
        }
        
        if (heartRateTrend === 'concerning') {
          recommendations.push('Consider discussing heart rate trends with your healthcare provider');
        }
        
        if (hrvTrend === 'concerning') {
          recommendations.push('Focus on stress management and recovery practices to improve HRV');
        }

        if (measurements.length < 10) {
          recommendations.push('Take measurements more regularly to establish reliable trends');
        }

        return {
          userId,
          periodStart: startDate.toISOString().split('T')[0],
          periodEnd: endDate.toISOString().split('T')[0],
          averageHeartRate,
          restingHeartRate,
          heartRateVariability: averageHRV,
          heartRateTrend,
          hrvTrend,
          measurementCount: validatedMeasurements.length,
          averageQuality,
          recommendations: recommendations.length > 0 ? recommendations : undefined,
        };
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Delete biometric measurement
  static async deleteBiometricMeasurement(id: string): Promise<void> {
    try {
      await withRetry(async () => {
        const result = await db
          .delete(biometricMeasurements)
          .where(eq(biometricMeasurements.id, id));
        
        if (result.rowCount === 0) {
          throw new NotFoundError('Biometric measurement', id);
        }
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get biometric summary for dashboard
  static async getBiometricSummary(userId: string): Promise<{
    latestHeartRate: number | null;
    latestHRV: number | null;
    latestMeasurementDate: Date | null;
    weeklyAverage: number | null;
    measurementQuality: string | null;
    trend: 'improving' | 'stable' | 'concerning' | 'insufficient_data';
  }> {
    try {
      return await withRetry(async () => {
        const latest = await this.getLatestBiometricMeasurement(userId);
        const trends = await this.getBiometricTrends(userId, 7); // Last 7 days

        return {
          latestHeartRate: latest?.heartRate || null,
          latestHRV: latest?.heartRateVariability || null,
          latestMeasurementDate: latest?.timestamp || null,
          weeklyAverage: trends.averageHeartRate || null,
          measurementQuality: latest?.quality || null,
          trend: trends.heartRateTrend,
        };
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}