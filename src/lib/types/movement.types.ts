import { z } from 'zod';

// Exercise Types
export const ExerciseSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum([
    'breathing',
    'mobility',
    'stretching',
    'resistance',
    'balance',
    'coordination',
    'relaxation'
  ]),
  duration: z.number().int().min(0).max(3600).optional(), // seconds
  repetitions: z.number().int().min(0).max(1000).optional(),
  sets: z.number().int().min(0).max(50).optional(),
  intensity: z.number().int().min(1).max(10).optional(), // 1-10 scale
  notes: z.string().max(200).optional(),
  completed: z.boolean().default(false),
});

// Movement Session Types
export const MovementSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.string().date(),
  
  // Session metadata
  sessionType: z.enum([
    'daily_anchor',
    'full_routine',
    'quick_mobility',
    'breathing_only',
    'custom'
  ]),
  
  // 4-phase structure
  phase: z.enum(['warmup', 'resistance', 'flow', 'cooldown']).optional(),
  
  // Session details
  duration: z.number().int().min(0).max(7200).optional(), // seconds
  intensity: z.number().int().min(1).max(10).optional(), // overall session intensity
  
  // Exercises performed
  exercises: z.array(ExerciseSchema),
  
  // Pre-session assessment
  preSessionEnergy: z.number().int().min(1).max(10).optional(),
  preSessionPain: z.number().int().min(1).max(10).optional(),
  preSessionMood: z.number().int().min(1).max(10).optional(),
  
  // Post-session self-check
  postSessionFatigue: z.number().int().min(1).max(10).optional(),
  postSessionBreath: z.number().int().min(1).max(10).optional(), // breathing ease
  postSessionStability: z.number().int().min(1).max(10).optional(), // balance/coordination
  postSessionMood: z.number().int().min(1).max(10).optional(),
  
  // Session adaptations and modifications
  adaptations: z.string().max(500).optional(),
  modificationReason: z.enum([
    'low_energy',
    'high_pain',
    'time_constraint',
    'equipment_unavailable',
    'feeling_unwell',
    'other'
  ]).optional(),
  
  // Completion status
  completed: z.boolean().default(false),
  completionPercentage: z.number().min(0).max(100).optional(),
  
  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateMovementSessionSchema = MovementSessionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateMovementSessionSchema = MovementSessionSchema.omit({
  id: true,
  userId: true,
  date: true,
  createdAt: true,
  updatedAt: true,
}).partial();

// Daily Anchor Routine Schema (simplified for quick completion)
export const DailyAnchorRoutineSchema = z.object({
  userId: z.string().uuid(),
  date: z.string().date(),
  
  // Three core components
  breathingCompleted: z.boolean().default(false),
  breathingDuration: z.number().int().min(0).max(1800).optional(), // seconds
  
  mobilityCompleted: z.boolean().default(false),
  mobilityDuration: z.number().int().min(0).max(1800).optional(),
  
  stretchingCompleted: z.boolean().default(false),
  stretchingDuration: z.number().int().min(0).max(1800).optional(),
  
  // Overall completion
  fullyCompleted: z.boolean().default(false),
  totalDuration: z.number().int().min(0).max(3600).optional(),
  
  // Energy assessment
  preEnergy: z.number().int().min(1).max(10).optional(),
  postEnergy: z.number().int().min(1).max(10).optional(),
  
  notes: z.string().max(300).optional(),
});

// Movement Recommendations Schema
export const MovementRecommendationSchema = z.object({
  userId: z.string().uuid(),
  date: z.string().date(),
  
  recommendationType: z.enum([
    'reduce_intensity',
    'skip_session',
    'focus_breathing',
    'gentle_mobility_only',
    'full_routine_ok',
    'increase_gradually'
  ]),
  
  reason: z.string().max(200),
  confidence: z.number().min(0).max(1), // AI confidence level
  
  suggestedModifications: z.array(z.string()).optional(),
  alternativeExercises: z.array(ExerciseSchema).optional(),
  
  basedOnMetrics: z.object({
    energyLevel: z.number().optional(),
    painLevel: z.number().optional(),
    sleepQuality: z.number().optional(),
    recentSessionData: z.boolean().default(false),
  }),
});

// Type exports
export type Exercise = z.infer<typeof ExerciseSchema>;
export type MovementSession = z.infer<typeof MovementSessionSchema>;
export type CreateMovementSession = z.infer<typeof CreateMovementSessionSchema>;
export type UpdateMovementSession = z.infer<typeof UpdateMovementSessionSchema>;
export type DailyAnchorRoutine = z.infer<typeof DailyAnchorRoutineSchema>;
export type MovementRecommendation = z.infer<typeof MovementRecommendationSchema>;

// Validation functions
export const validateMovementSession = (data: unknown): MovementSession => {
  return MovementSessionSchema.parse(data);
};

export const validateCreateMovementSession = (data: unknown): CreateMovementSession => {
  return CreateMovementSessionSchema.parse(data);
};

export const validateUpdateMovementSession = (data: unknown): UpdateMovementSession => {
  return UpdateMovementSessionSchema.parse(data);
};

export const validateDailyAnchorRoutine = (data: unknown): DailyAnchorRoutine => {
  return DailyAnchorRoutineSchema.parse(data);
};

// Helper functions
export const calculateSessionIntensity = (exercises: Exercise[]): number => {
  if (exercises.length === 0) return 1;
  
  const totalIntensity = exercises.reduce((sum, exercise) => {
    return sum + (exercise.intensity || 1);
  }, 0);
  
  return Math.round(totalIntensity / exercises.length);
};

export const calculateCompletionPercentage = (exercises: Exercise[]): number => {
  if (exercises.length === 0) return 0;
  
  const completedCount = exercises.filter(ex => ex.completed).length;
  return Math.round((completedCount / exercises.length) * 100);
};

export const getSessionTypeLabel = (sessionType: string): string => {
  const labels: Record<string, string> = {
    daily_anchor: 'Daily Anchor Routine',
    full_routine: 'Full Movement Session',
    quick_mobility: 'Quick Mobility',
    breathing_only: 'Breathing Exercise',
    custom: 'Custom Session',
  };
  
  return labels[sessionType] || sessionType;
};

export const getIntensityLabel = (intensity: number): string => {
  if (intensity <= 2) return 'Very Gentle';
  if (intensity <= 4) return 'Gentle';
  if (intensity <= 6) return 'Moderate';
  if (intensity <= 8) return 'Active';
  return 'Vigorous';
};

export const getIntensityColor = (intensity: number): string => {
  if (intensity <= 2) return 'text-blue-600';
  if (intensity <= 4) return 'text-green-600';
  if (intensity <= 6) return 'text-yellow-600';
  if (intensity <= 8) return 'text-orange-600';
  return 'text-red-600';
};