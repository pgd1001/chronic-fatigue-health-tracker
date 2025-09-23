import { z } from 'zod';

// Health Rating Scale (1-10)
const HealthRatingSchema = z.number().int().min(1).max(10);

// Symptom Types
export const SymptomSchema = z.object({
  type: z.enum([
    'fatigue',
    'pain',
    'brain_fog',
    'headache',
    'nausea',
    'dizziness',
    'muscle_weakness',
    'joint_pain',
    'sleep_disturbance',
    'mood_changes',
    'temperature_regulation',
    'digestive_issues',
    'breathing_difficulty',
    'heart_palpitations',
    'sensory_sensitivity',
    'other'
  ]),
  severity: HealthRatingSchema,
  location: z.string().optional(), // for pain/symptoms with location
  notes: z.string().max(500).optional(),
});

// Daily Health Log Schema
export const DailyHealthLogSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.string().date(),
  
  // Core metrics (1-10 scale)
  energyLevel: HealthRatingSchema.optional(),
  fatigueLevel: HealthRatingSchema.optional(),
  painLevel: HealthRatingSchema.optional(),
  brainFogLevel: HealthRatingSchema.optional(),
  sleepQuality: HealthRatingSchema.optional(),
  
  // Sleep data
  sleepHours: z.number().min(0).max(24).optional(),
  
  // Hydration
  waterIntake: z.number().int().min(0).max(10000).optional(), // ml
  
  // Daily routine completion
  completedDailyAnchor: z.boolean().default(false),
  
  // Flexible symptom tracking
  symptoms: z.array(SymptomSchema).optional(),
  
  // General notes
  notes: z.string().max(1000).optional(),
  
  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateDailyHealthLogSchema = DailyHealthLogSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateDailyHealthLogSchema = DailyHealthLogSchema.omit({
  id: true,
  userId: true,
  date: true,
  createdAt: true,
  updatedAt: true,
}).partial();

// Health Trends Schema
export const HealthTrendsSchema = z.object({
  averageEnergy: z.number().nullable(),
  averageFatigue: z.number().nullable(),
  averagePain: z.number().nullable(),
  averageSleep: z.number().nullable(),
  completionRate: z.number().min(0).max(100),
  trendDirection: z.enum(['improving', 'stable', 'declining', 'insufficient_data']),
  periodDays: z.number().int().positive(),
});

// Quick Health Check Schema (for rapid logging during low energy)
export const QuickHealthCheckSchema = z.object({
  userId: z.string().uuid(),
  date: z.string().date(),
  energyLevel: HealthRatingSchema,
  fatigueLevel: HealthRatingSchema.optional(),
  completedDailyAnchor: z.boolean().default(false),
});

// Type exports
export type Symptom = z.infer<typeof SymptomSchema>;
export type DailyHealthLog = z.infer<typeof DailyHealthLogSchema>;
export type CreateDailyHealthLog = z.infer<typeof CreateDailyHealthLogSchema>;
export type UpdateDailyHealthLog = z.infer<typeof UpdateDailyHealthLogSchema>;
export type HealthTrends = z.infer<typeof HealthTrendsSchema>;
export type QuickHealthCheck = z.infer<typeof QuickHealthCheckSchema>;

// Validation functions
export const validateDailyHealthLog = (data: unknown): DailyHealthLog => {
  return DailyHealthLogSchema.parse(data);
};

export const validateCreateDailyHealthLog = (data: unknown): CreateDailyHealthLog => {
  return CreateDailyHealthLogSchema.parse(data);
};

export const validateUpdateDailyHealthLog = (data: unknown): UpdateDailyHealthLog => {
  return UpdateDailyHealthLogSchema.parse(data);
};

export const validateQuickHealthCheck = (data: unknown): QuickHealthCheck => {
  return QuickHealthCheckSchema.parse(data);
};

// Helper functions for health data
export const calculateHealthTrend = (
  currentAverage: number,
  previousAverage: number,
  threshold: number = 0.5
): 'improving' | 'stable' | 'declining' => {
  const difference = currentAverage - previousAverage;
  
  if (Math.abs(difference) < threshold) {
    return 'stable';
  }
  
  return difference > 0 ? 'improving' : 'declining';
};

export const getHealthRatingLabel = (rating: number): string => {
  if (rating <= 2) return 'Very Low';
  if (rating <= 4) return 'Low';
  if (rating <= 6) return 'Moderate';
  if (rating <= 8) return 'Good';
  return 'Excellent';
};

export const getHealthRatingColor = (rating: number): string => {
  if (rating <= 2) return 'text-red-600';
  if (rating <= 4) return 'text-orange-600';
  if (rating <= 6) return 'text-yellow-600';
  if (rating <= 8) return 'text-green-600';
  return 'text-emerald-600';
};