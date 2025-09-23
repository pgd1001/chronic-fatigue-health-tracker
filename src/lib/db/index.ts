// Database connection and configuration
export { db, checkDatabaseConnection, closeDatabaseConnection } from './connection';

// Database schema and types
export * from './schema';

// Database utilities and error handling
export * from './utils';

// Database services
export { UserService } from './services/user.service';
export { HealthLogService } from './services/health-log.service';
export { MovementService } from './services/movement.service';
export { BiometricService } from './services/biometric.service';

// Health check utilities
export { getDatabaseHealth, createHealthCheckHandler } from './health-check';

// Re-export commonly used Drizzle utilities
export { eq, and, or, desc, asc, count, sum, avg } from 'drizzle-orm';