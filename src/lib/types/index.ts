// Core type exports
export * from './user.types';
export * from './health-log.types';
export * from './movement.types';
export * from './biometric.types';
export * from './nutrition.types';

// Common validation schemas and utilities
import { z } from 'zod';

// Common date and time schemas
export const DateSchema = z.string().date();
export const TimeSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/);
export const DateTimeSchema = z.date();

// Common ID schemas
export const UUIDSchema = z.string().uuid();

// Common rating scales
export const RatingScale1to10Schema = z.number().int().min(1).max(10);
export const RatingScale1to5Schema = z.number().int().min(1).max(5);
export const PercentageSchema = z.number().min(0).max(100);

// Common enums
export const PriorityLevelSchema = z.enum(['low', 'medium', 'high', 'urgent']);
export const StatusSchema = z.enum(['active', 'inactive', 'pending', 'completed']);

// API Response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

export const PaginatedResponseSchema = z.object({
  data: z.array(z.unknown()),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

// Error handling schemas
export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string().optional(),
});

export const ApiErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  details: z.array(ValidationErrorSchema).optional(),
});

// Type exports for common schemas
export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;

// Utility type helpers
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Database operation types
export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

// Health tracking specific types
export type HealthMetric = {
  value: number;
  timestamp: Date;
  quality?: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
};

export type TrendDirection = 'improving' | 'stable' | 'declining' | 'insufficient_data';

export type HealthInsight = {
  type: 'recommendation' | 'warning' | 'celebration' | 'information';
  priority: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  actionable: boolean;
  relatedMetrics?: string[];
};

// Chronic illness specific types
export type EnergyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type PainLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type FatigueLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type ChronicCondition = 
  | 'ME/CFS'
  | 'Long COVID'
  | 'Fibromyalgia'
  | 'POTS'
  | 'EDS'
  | 'Other';

// Accessibility and UI preferences
export type AccessibilityFeature = 
  | 'highContrast'
  | 'reducedMotion'
  | 'largeText'
  | 'voiceGuidance'
  | 'screenReader'
  | 'keyboardNavigation';

// Data export types
export type ExportFormat = 'json' | 'csv' | 'pdf';
export type ExportTimeRange = '7days' | '30days' | '90days' | '1year' | 'all';

export type HealthDataExport = {
  userId: string;
  exportDate: Date;
  timeRange: ExportTimeRange;
  format: ExportFormat;
  includePersonalInfo: boolean;
  includeBiometrics: boolean;
  includeSymptoms: boolean;
  includeMovement: boolean;
  includeNutrition: boolean;
};

// Validation helper functions
export const validateHealthRating = (value: unknown): number => {
  const result = RatingScale1to10Schema.safeParse(value);
  if (!result.success) {
    throw new Error(`Invalid health rating: must be between 1 and 10`);
  }
  return result.data;
};

export const validateDate = (value: unknown): string => {
  const result = DateSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`Invalid date format: expected YYYY-MM-DD`);
  }
  return result.data;
};

export const validateUUID = (value: unknown): string => {
  const result = UUIDSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`Invalid UUID format`);
  }
  return result.data;
};