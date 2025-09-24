import { z } from 'zod';

// Core symptom types for chronic fatigue management
export const SymptomTypeSchema = z.enum([
  'fatigue',
  'pain',
  'brain_fog',
  'sleep_quality',
  'mood',
  'anxiety',
  'depression',
  'headache',
  'muscle_weakness',
  'joint_pain',
  'nausea',
  'dizziness',
  'temperature_regulation',
  'sensory_sensitivity',
  'custom'
]);

export const SeverityLevelSchema = z.number().int().min(1).max(10);

// Individual symptom log entry
export const SymptomEntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.string().date(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
  
  symptomType: SymptomTypeSchema,
  severity: SeverityLevelSchema,
  
  // Additional context
  notes: z.string().max(500).optional(),
  triggers: z.array(z.string().max(100)).optional(),
  location: z.string().max(100).optional(), // For pain tracking
  
  // Custom symptom details
  customSymptomName: z.string().max(100).optional(),
  
  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Daily symptom summary
export const DailySymptomSummarySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.string().date(),
  
  // Core symptoms (most important for chronic fatigue)
  fatigue: SeverityLevelSchema.optional(),
  pain: SeverityLevelSchema.optional(),
  brainFog: SeverityLevelSchema.optional(),
  sleepQuality: SeverityLevelSchema.optional(),
  mood: SeverityLevelSchema.optional(),
  
  // Additional symptoms
  anxiety: SeverityLevelSchema.optional(),
  headache: SeverityLevelSchema.optional(),
  muscleWeakness: SeverityLevelSchema.optional(),
  jointPain: SeverityLevelSchema.optional(),
  nausea: SeverityLevelSchema.optional(),
  dizziness: SeverityLevelSchema.optional(),
  temperatureRegulation: SeverityLevelSchema.optional(),
  sensorySensitivity: SeverityLevelSchema.optional(),
  
  // Overall assessments
  overallWellbeing: SeverityLevelSchema.optional(),
  functionalCapacity: SeverityLevelSchema.optional(), // How much could you do today?
  
  // Context
  notes: z.string().max(1000).optional(),
  significantEvents: z.array(z.string().max(200)).optional(),
  
  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Symptom pattern analysis
export const SymptomPatternSchema = z.object({
  userId: z.string().uuid(),
  analysisDate: z.date(),
  timeframe: z.enum(['week', 'month', 'quarter', 'year']),
  
  patterns: z.array(z.object({
    symptomType: SymptomTypeSchema,
    trend: z.enum(['improving', 'stable', 'worsening', 'volatile']),
    averageSeverity: z.number().min(1).max(10),
    peakSeverity: z.number().min(1).max(10),
    frequency: z.number().min(0).max(1), // Percentage of days with this symptom
    
    // Pattern insights
    commonTriggers: z.array(z.string()).optional(),
    timeOfDayPatterns: z.array(z.object({
      timeRange: z.string(),
      averageSeverity: z.number(),
    })).optional(),
    correlations: z.array(z.object({
      correlatedSymptom: SymptomTypeSchema,
      strength: z.number().min(-1).max(1), // Correlation coefficient
    })).optional(),
  })),
  
  // Overall insights
  overallTrend: z.enum(['improving', 'stable', 'worsening', 'mixed']),
  bestDays: z.array(z.string().date()).optional(),
  worstDays: z.array(z.string().date()).optional(),
  
  recommendations: z.array(z.string().max(300)),
  confidence: z.number().min(0).max(1),
});

// Progress tracking metrics
export const ProgressMetricsSchema = z.object({
  userId: z.string().uuid(),
  calculationDate: z.date(),
  timeframe: z.enum(['week', 'month', 'quarter']),
  
  // Improvement indicators
  symptomsImproving: z.array(SymptomTypeSchema),
  symptomsStable: z.array(SymptomTypeSchema),
  symptomsWorsening: z.array(SymptomTypeSchema),
  
  // Functional improvements
  goodDaysCount: z.number().int().min(0),
  badDaysCount: z.number().int().min(0),
  averageFunctionalCapacity: z.number().min(1).max(10),
  
  // Milestone achievements
  milestones: z.array(z.object({
    type: z.enum(['symptom_improvement', 'functional_gain', 'consistency', 'self_care']),
    description: z.string().max(200),
    achievedDate: z.string().date(),
    significance: z.enum(['minor', 'moderate', 'major']),
  })),
  
  // Validating messages (non-toxic positivity)
  encouragingInsights: z.array(z.string().max(300)),
  acknowledgments: z.array(z.string().max(300)),
});

// Symptom correlation analysis
export const SymptomCorrelationSchema = z.object({
  userId: z.string().uuid(),
  analysisDate: z.date(),
  
  correlations: z.array(z.object({
    symptom1: SymptomTypeSchema,
    symptom2: SymptomTypeSchema,
    correlationCoefficient: z.number().min(-1).max(1),
    significance: z.enum(['weak', 'moderate', 'strong']),
    description: z.string().max(200),
  })),
  
  // External factor correlations
  externalFactors: z.array(z.object({
    factor: z.string().max(100), // weather, stress, activity, etc.
    correlatedSymptoms: z.array(SymptomTypeSchema),
    impact: z.enum(['positive', 'negative', 'neutral']),
    strength: z.number().min(0).max(1),
  })),
});

// Type exports
export type SymptomType = z.infer<typeof SymptomTypeSchema>;
export type SeverityLevel = z.infer<typeof SeverityLevelSchema>;
export type SymptomEntry = z.infer<typeof SymptomEntrySchema>;
export type DailySymptomSummary = z.infer<typeof DailySymptomSummarySchema>;
export type SymptomPattern = z.infer<typeof SymptomPatternSchema>;
export type ProgressMetrics = z.infer<typeof ProgressMetricsSchema>;
export type SymptomCorrelation = z.infer<typeof SymptomCorrelationSchema>;

// Create schemas for API operations
export const CreateSymptomEntrySchema = SymptomEntrySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateSymptomEntrySchema = SymptomEntrySchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const CreateDailySymptomSummarySchema = DailySymptomSummarySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateDailySymptomSummarySchema = DailySymptomSummarySchema.omit({
  id: true,
  userId: true,
  date: true,
  createdAt: true,
  updatedAt: true,
}).partial();

// Validation functions
export const validateSymptomEntry = (data: unknown): SymptomEntry => {
  return SymptomEntrySchema.parse(data);
};

export const validateDailySymptomSummary = (data: unknown): DailySymptomSummary => {
  return DailySymptomSummarySchema.parse(data);
};

export const validateCreateSymptomEntry = (data: unknown) => {
  return CreateSymptomEntrySchema.parse(data);
};

export const validateUpdateSymptomEntry = (data: unknown) => {
  return UpdateSymptomEntrySchema.parse(data);
};

// Helper functions
export const getSymptomDisplayName = (symptomType: SymptomType): string => {
  const displayNames: Record<SymptomType, string> = {
    fatigue: 'Fatigue',
    pain: 'Pain',
    brain_fog: 'Brain Fog',
    sleep_quality: 'Sleep Quality',
    mood: 'Mood',
    anxiety: 'Anxiety',
    depression: 'Depression',
    headache: 'Headache',
    muscle_weakness: 'Muscle Weakness',
    joint_pain: 'Joint Pain',
    nausea: 'Nausea',
    dizziness: 'Dizziness',
    temperature_regulation: 'Temperature Regulation',
    sensory_sensitivity: 'Sensory Sensitivity',
    custom: 'Custom Symptom',
  };
  
  return displayNames[symptomType] || symptomType;
};

export const getSeverityLabel = (severity: SeverityLevel): string => {
  if (severity <= 2) return 'Minimal';
  if (severity <= 4) return 'Mild';
  if (severity <= 6) return 'Moderate';
  if (severity <= 8) return 'Severe';
  return 'Very Severe';
};

export const getSeverityColor = (severity: SeverityLevel): string => {
  if (severity <= 2) return 'text-green-600';
  if (severity <= 4) return 'text-yellow-600';
  if (severity <= 6) return 'text-orange-600';
  if (severity <= 8) return 'text-red-600';
  return 'text-red-800';
};

export const getTrendIcon = (trend: string): string => {
  switch (trend) {
    case 'improving':
      return '📈';
    case 'worsening':
      return '📉';
    case 'stable':
      return '➡️';
    case 'volatile':
      return '📊';
    default:
      return '❓';
  }
};

// Chronic fatigue specific symptom groupings
export const CORE_SYMPTOMS: SymptomType[] = [
  'fatigue',
  'brain_fog',
  'sleep_quality',
  'pain',
  'mood'
];

export const SECONDARY_SYMPTOMS: SymptomType[] = [
  'anxiety',
  'headache',
  'muscle_weakness',
  'joint_pain',
  'nausea',
  'dizziness',
  'temperature_regulation',
  'sensory_sensitivity'
];

// Empathetic messaging for different severity levels
export const SEVERITY_DESCRIPTIONS = {
  1: 'Very manageable today',
  2: 'Quite manageable',
  3: 'Noticeable but okay',
  4: 'Somewhat challenging',
  5: 'Moderately difficult',
  6: 'Quite challenging',
  7: 'Very challenging',
  8: 'Extremely difficult',
  9: 'Nearly overwhelming',
  10: 'Overwhelming'
} as const;

// Validating progress messages (avoiding toxic positivity)
export const PROGRESS_ACKNOWLEDGMENTS = [
  'Your tracking shows you\'re paying attention to your body\'s signals.',
  'Managing a chronic condition takes real strength and awareness.',
  'Every day you track is valuable data about your experience.',
  'Your consistency in tracking shows dedication to your wellbeing.',
  'You\'re building a helpful picture of your health patterns.',
  'This information will be valuable for your healthcare team.',
  'Tracking during difficult times shows real resilience.',
  'Your awareness of symptoms is an important self-care skill.',
] as const;