import { z } from 'zod';

// Sleep Quality Scale (1-10)
const SleepQualitySchema = z.number().int().min(1).max(10);

// Sleep Optimization Data Schema
export const SleepOptimizationSchema = z.object({
  date: z.string().date(),
  bluelightReduction: z.boolean().default(false),
  screenReplacement: z.boolean().default(false),
  environmentOptimized: z.boolean().default(false),
  bedtime: z.string().optional(), // HH:MM format
  sleepQuality: SleepQualitySchema.optional(),
  sleepDuration: z.number().min(0).max(24).optional(), // hours
  notes: z.string().max(500).optional(),
});

// Sleep Trend Data Schema
export const SleepTrendDataSchema = z.object({
  date: z.string().date(),
  sleepQuality: z.number().min(0).max(10),
  sleepDuration: z.number().min(0).max(24).optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  routineCompletion: z.number().min(0).max(100), // percentage
  bluelightReduction: z.boolean(),
  screenReplacement: z.boolean(),
  environmentOptimized: z.boolean(),
});

// Sleep Statistics Schema
export const SleepStatisticsSchema = z.object({
  averageQuality: z.number().min(0).max(10),
  averageDuration: z.number().min(0).max(24),
  averageRoutineCompletion: z.number().min(0).max(100),
  totalLogs: z.number().int().min(0),
  bestQualityDate: z.string().date().nullable(),
  worstQualityDate: z.string().date().nullable(),
});

// Sleep Insight Schema
export const SleepInsightSchema = z.object({
  type: z.enum(['positive', 'neutral', 'concern']),
  title: z.string(),
  description: z.string(),
  recommendation: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  evidenceBased: z.boolean().default(true),
});

// Sleep Tip Schema
export const SleepTipSchema = z.object({
  id: z.string(),
  category: z.enum(['environment', 'routine', 'technology', 'supplements']),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  evidenceBased: z.boolean().default(true),
  applicableConditions: z.array(z.enum(['ME/CFS', 'Long COVID', 'General'])).optional(),
});

// Evening Reminder Schema
export const EveningReminderSchema = z.object({
  id: z.string(),
  userId: z.string().uuid(),
  reminderTime: z.string(), // HH:MM format
  enabled: z.boolean().default(true),
  reminderType: z.enum(['routine_start', 'blue_light', 'screen_replacement', 'bedtime']),
  message: z.string(),
  daysOfWeek: z.array(z.number().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]), // 0 = Sunday
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Sleep Correlation Data Schema
export const SleepCorrelationDataSchema = z.object({
  sleepQuality: z.number().min(1).max(10),
  energyLevel: z.number().min(1).max(10),
  date: z.string().date(),
});

// Sleep Report Schema
export const SleepReportSchema = z.object({
  userId: z.string().uuid(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  statistics: SleepStatisticsSchema,
  trendData: z.array(SleepTrendDataSchema),
  insights: z.array(SleepInsightSchema),
  correlationWithEnergy: z.number().min(-1).max(1).nullable(),
  generatedAt: z.date(),
});

// Create Sleep Log Schema (for API requests)
export const CreateSleepLogSchema = SleepOptimizationSchema.omit({
  // No fields to omit for creation
});

// Update Sleep Log Schema (for API requests)
export const UpdateSleepLogSchema = SleepOptimizationSchema.partial().omit({
  date: true, // Date cannot be updated
});

// Sleep Quality Labels
export const SLEEP_QUALITY_LABELS = {
  1: 'Terrible',
  2: 'Very Poor',
  3: 'Poor',
  4: 'Below Average',
  5: 'Average',
  6: 'Above Average',
  7: 'Good',
  8: 'Very Good',
  9: 'Excellent',
  10: 'Perfect'
} as const;

// Sleep Duration Categories
export const SLEEP_DURATION_CATEGORIES = {
  'insufficient': { min: 0, max: 6, label: 'Insufficient', color: 'text-red-600' },
  'short': { min: 6, max: 7, label: 'Short', color: 'text-orange-600' },
  'optimal': { min: 7, max: 9, label: 'Optimal', color: 'text-green-600' },
  'long': { min: 9, max: 12, label: 'Long', color: 'text-blue-600' },
  'excessive': { min: 12, max: 24, label: 'Excessive', color: 'text-purple-600' }
} as const;

// Type exports
export type SleepOptimization = z.infer<typeof SleepOptimizationSchema>;
export type SleepTrendData = z.infer<typeof SleepTrendDataSchema>;
export type SleepStatistics = z.infer<typeof SleepStatisticsSchema>;
export type SleepInsight = z.infer<typeof SleepInsightSchema>;
export type SleepTip = z.infer<typeof SleepTipSchema>;
export type EveningReminder = z.infer<typeof EveningReminderSchema>;
export type SleepCorrelationData = z.infer<typeof SleepCorrelationDataSchema>;
export type SleepReport = z.infer<typeof SleepReportSchema>;
export type CreateSleepLog = z.infer<typeof CreateSleepLogSchema>;
export type UpdateSleepLog = z.infer<typeof UpdateSleepLogSchema>;

// Validation functions
export const validateSleepOptimization = (data: unknown): SleepOptimization => {
  return SleepOptimizationSchema.parse(data);
};

export const validateSleepTrendData = (data: unknown): SleepTrendData => {
  return SleepTrendDataSchema.parse(data);
};

export const validateCreateSleepLog = (data: unknown): CreateSleepLog => {
  return CreateSleepLogSchema.parse(data);
};

export const validateUpdateSleepLog = (data: unknown): UpdateSleepLog => {
  return UpdateSleepLogSchema.parse(data);
};

// Helper functions
export const getSleepQualityLabel = (quality: number): string => {
  return SLEEP_QUALITY_LABELS[quality as keyof typeof SLEEP_QUALITY_LABELS] || 'Unknown';
};

export const getSleepQualityColor = (quality: number): string => {
  if (quality <= 2) return 'text-red-600';
  if (quality <= 4) return 'text-orange-600';
  if (quality <= 6) return 'text-yellow-600';
  if (quality <= 8) return 'text-green-600';
  return 'text-emerald-600';
};

export const getSleepDurationCategory = (duration: number) => {
  for (const [key, category] of Object.entries(SLEEP_DURATION_CATEGORIES)) {
    if (duration >= category.min && duration < category.max) {
      return { key, ...category };
    }
  }
  return { key: 'unknown', min: 0, max: 0, label: 'Unknown', color: 'text-gray-600' };
};

export const calculateRoutineCompletion = (
  bluelightReduction: boolean,
  screenReplacement: boolean,
  environmentOptimized: boolean
): number => {
  const completed = [bluelightReduction, screenReplacement, environmentOptimized]
    .filter(Boolean).length;
  return Math.round((completed / 3) * 100);
};

export const formatBedtime = (bedtime: string | Date): string => {
  if (typeof bedtime === 'string') {
    return bedtime;
  }
  
  return bedtime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export const parseBedtime = (bedtimeString: string, date: string): Date => {
  return new Date(`${date}T${bedtimeString}:00`);
};

// Sleep optimization recommendations based on chronic fatigue research
export const CHRONIC_FATIGUE_SLEEP_TIPS: SleepTip[] = [
  {
    id: 'cf-consistent-schedule',
    category: 'routine',
    title: 'Consistent Sleep Schedule',
    description: 'Maintain the same bedtime and wake time daily to support circadian rhythm regulation, which is often disrupted in chronic fatigue conditions.',
    priority: 'high',
    evidenceBased: true,
    applicableConditions: ['ME/CFS', 'Long COVID']
  },
  {
    id: 'cf-pacing-rest',
    category: 'routine',
    title: 'Pacing and Rest Periods',
    description: 'Include planned rest periods throughout the day to prevent over-exertion that can worsen sleep quality.',
    priority: 'high',
    evidenceBased: true,
    applicableConditions: ['ME/CFS', 'Long COVID']
  },
  {
    id: 'cf-gentle-evening',
    category: 'routine',
    title: 'Gentle Evening Activities',
    description: 'Choose very low-energy evening activities like gentle breathing exercises or passive entertainment to avoid pre-sleep energy crashes.',
    priority: 'medium',
    evidenceBased: true,
    applicableConditions: ['ME/CFS', 'Long COVID']
  },
  {
    id: 'cf-temperature-regulation',
    category: 'environment',
    title: 'Temperature Regulation Support',
    description: 'Use layers and temperature control as chronic fatigue can affect thermoregulation, impacting sleep comfort.',
    priority: 'medium',
    evidenceBased: true,
    applicableConditions: ['ME/CFS', 'Long COVID']
  }
];