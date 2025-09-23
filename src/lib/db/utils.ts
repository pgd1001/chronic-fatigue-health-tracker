import { PostgresError } from 'postgres';

// Database error types
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id ${id}` : ''} not found`);
    this.name = 'NotFoundError';
  }
}

// Error handler for database operations
export function handleDatabaseError(error: unknown): never {
  if (error instanceof PostgresError) {
    switch (error.code) {
      case '23505': // unique_violation
        throw new DatabaseError('Resource already exists', error.code, error);
      case '23503': // foreign_key_violation
        throw new DatabaseError('Referenced resource does not exist', error.code, error);
      case '23502': // not_null_violation
        throw new DatabaseError('Required field is missing', error.code, error);
      case '23514': // check_violation
        throw new ValidationError('Data validation failed');
      default:
        throw new DatabaseError(
          'Database operation failed',
          error.code,
          error
        );
    }
  }

  if (error instanceof Error) {
    throw new DatabaseError(error.message, undefined, error);
  }

  throw new DatabaseError('Unknown database error', undefined, error);
}

// Retry mechanism for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry validation errors or not found errors
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }

      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
}

// Transaction wrapper with error handling
export async function withTransaction<T>(
  operation: (tx: any) => Promise<T>
): Promise<T> {
  const { db } = await import('./connection');
  
  try {
    return await db.transaction(async (tx) => {
      return await operation(tx);
    });
  } catch (error) {
    handleDatabaseError(error);
  }
}

// Pagination utilities
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function calculatePagination(
  page: number = 1,
  limit: number = 10,
  total: number
) {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    offset: (page - 1) * limit,
  };
}

// Date utilities for health tracking
export function getDateRange(days: number): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return { startDate, endDate };
}

export function formatDateForDB(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function parseDBDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00.000Z');
}