import { checkDatabaseConnection } from './connection';
import { handleDatabaseError } from './utils';

export interface DatabaseHealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  latency?: number;
  error?: string;
}

export async function getDatabaseHealth(): Promise<DatabaseHealthStatus> {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  try {
    const isConnected = await checkDatabaseConnection();
    const latency = Date.now() - startTime;

    if (isConnected) {
      return {
        status: 'healthy',
        timestamp,
        latency,
      };
    } else {
      return {
        status: 'unhealthy',
        timestamp,
        error: 'Database connection failed',
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

// API route handler for health checks
export async function createHealthCheckHandler() {
  return async function healthCheck() {
    try {
      const health = await getDatabaseHealth();
      
      return Response.json(health, {
        status: health.status === 'healthy' ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } catch (error) {
      return Response.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Health check failed',
        },
        { status: 503 }
      );
    }
  };
}