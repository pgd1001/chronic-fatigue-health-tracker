import { z } from 'zod';

// Symptom severity scale (1-10)
const SeverityRatingSchema = z.number().int().min(1).max(10);

// Comprehensive symptom types for ME/CFS and Long COVID
export const SymptomTypeSchema = z.enum([
  'fatigue',
  'post_exertional_malaise',
  'brain_fog',
  'cognitive_dysfunction',
  'memory_issues',
  'concentration_difficulty',
  'headache',
  'migraine',
  'muscle_pain',
  'joint_pain',
  'muscle_weakness',
  'nausea',
  'dizziness',
  'orthostatic_intolerance',
  'heart_palpitations',
  'chest_pain',
  'shortness_of_breath',
  'temperature_regulation',
  'chills',
  'fever',
  'night_sweats',
  'sleep_disturbance',
  'unrefreshing_sleep',
  'insomnia',
  'mood_changes',
  'anxiety',
  'depression',
  'irritability',
  'digestive_issues',
  'nausea_digestive',
  'loss_of_appetite',
  'sensory_sensitivity',
  'light_sensitivity',
  'sound_sensitivity',
  'smell_sensitivity',
  'taste_changes',
  'skin_sensitivity',
  'lymph_node_pain',
  'sore_throat',
  'flu_like_symptoms',
  'other'
]);

// Symptom tracking entry
export const SymptomEntrySchema = z.object({
  type: SymptomTypeSchema,
  severity: SeverityRatingSchema,
  location: z.string().max(100).optional(), // for pain/symptoms with location
  duration: z.enum(['minutes', 'hours', 'all_day', 'multiple_days']).optional(),
  triggers: z.array(z.string().max(50)).max(5).optional(), // potential triggers
  notes: z.string().max(300).optional(),
  timestamp: z.date().optional(),
});

// Daily symptom log
export const DailySymptomLogSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.string().date(),
  
  // Core ME/CFS symptoms (1-10 scale)
  fatigueLevel: SeverityRatingSchema.optional(),
  postExertionalMalaise: SeverityRatingSchema.optional(),
  brainFogLevel: SeverityRatingSchema.optional(),
  sleepQuality: SeverityRatingSchema.optional(),
  
  // Additional symptoms
  symptoms: z.array(SymptomEntrySchema).max(20).optional(),
  
  // Overall wellbeing
  overallWellbeing: SeverityRatingSchema.optional(),
  
  // Activity level (what they were able to do)
  activityLevel: z.enum(['bedbound', 'housebound', 'limited_activity', 'normal_activity']).optional(),
  
  // Mood and mental health
  moodRating: SeverityRatingSchema.optional(),
  anxietyLevel: SeverityRatingSchema.optional(),
  
  // General notes
  notes: z.string().max(500).optional(),
  
  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Symptom pattern analysis
export const SymptomPatternSchema = z.object({
  symptomType: SymptomTypeSchema,
  averageSeverity: z.number().min(1).max(10),
  frequency: z.number().min(0).max(100), // percentage of days
  trendDirection: z.enum(['improving', 'stable', 'worsening']),
  correlations: z.array(z.object({
    factor: z.string(),
    correlation: z.number().min(-1).max(1),
    significance: z.enum(['low', 'moderate', 'high']),
  })).optional(),
});

// Progress tracking
export const ProgressMetricsSchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year']),
  startDate: z.string().date(),
  endDate: z.string().date(),
  
  // Core metrics
  averageFatigue: z.number().nullable(),
  averagePEM: z.number().nullable(),
  averageBrainFog: z.number().nullable(),
  averageSleep: z.number().nullable(),
  averageWellbeing: z.number().nullable(),
  
  // Trend analysis
  fatiguetrend: z.enum(['improving', 'stable', 'worsening', 'insufficient_data']),
  overallTrend: z.enum(['improving', 'stable', 'worsening', 'insufficient_data']),
  
  // Activity metrics
  goodDays: z.number().int().min(0), // days with wellbeing > 6
  difficultDays: z.number().int().min(0), // days with wellbeing < 4
  
  // Symptom patterns
  topSymptoms: z.array(SymptomPatternSchema).max(5),
  
  // Positive indicators
  improvements: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
});

// Quick symptom check (for low energy days)
export const QuickSymptomCheckSchema = z.object({
  userId: z.string().uuid(),
  date: z.string().date(),
  fatigueLevel: SeverityRatingSchema,
  overallWellbeing: SeverityRatingSchema,
  canDoBasicTasks: z.boolean(),
  needsRest: z.boolean(),
});

// Symptom correlation analysis
export const SymptomCorrelationSchema = z.object({
  symptom1: SymptomTypeSchema,
  symptom2: SymptomTypeSchema,
  correlation: z.number().min(-1).max(1),
  significance: z.enum(['low', 'moderate', 'high']),
  sampleSize: z.number().int().positive(),
});

// Type exports
export type SymptomType = z.infer<typeof SymptomTypeSchema>;
export type SymptomEntry = z.infer<typeof SymptomEntrySchema>;
export type DailySymptomLog = z.infer<typeof DailySymptomLogSchema>;
export type SymptomPattern = z.infer<typeof SymptomPatternSchema>;
export type ProgressMetrics = z.infer<typeof ProgressMetricsSchema>;
export type QuickSymptomCheck = z.infer<typeof QuickSymptomCheckSchema>;
export type SymptomCorrelation = z.infer<typeof SymptomCorrelationSchema>;

// Helper functions
export const getSymptomDisplayName = (symptomType: SymptomType): string => {
  const displayNames: Record<SymptomType, string> = {
    fatigue: 'Fatigue',
    post_exertional_malaise: 'Post-Exertional Malaise (PEM)',
    brain_fog: 'Brain Fog',
    cognitive_dysfunction: 'Cognitive Dysfunction',
    memory_issues: 'Memory Issues',
    concentration_difficulty: 'Concentration Difficulty',
    headache: 'Headache',
    migraine: 'Migraine',
    muscle_pain: 'Muscle Pain',
    joint_pain: 'Joint Pain',
    muscle_weakness: 'Muscle Weakness',
    nausea: 'Nausea',
    dizziness: 'Dizziness',
    orthostatic_intolerance: 'Orthostatic Intolerance',
    heart_palpitations: 'Heart Palpitations',
    chest_pain: 'Chest Pain',
    shortness_of_breath: 'Shortness of Breath',
    temperature_regulation: 'Temperature Regulation Issues',
    chills: 'Chills',
    fever: 'Fever',
    night_sweats: 'Night Sweats',
    sleep_disturbance: 'Sleep Disturbance',
    unrefreshing_sleep: 'Unrefreshing Sleep',
    insomnia: 'Insomnia',
    mood_changes: 'Mood Changes',
    anxiety: 'Anxiety',
    depression: 'Depression',
    irritability: 'Irritability',
    digestive_issues: 'Digestive Issues',
    nausea_digestive: 'Digestive Nausea',
    loss_of_appetite: 'Loss of Appetite',
    sensory_sensitivity: 'Sensory Sensitivity',
    light_sensitivity: 'Light Sensitivity',
    sound_sensitivity: 'Sound Sensitivity',
    smell_sensitivity: 'Smell Sensitivity',
    taste_changes: 'Taste Changes',
    skin_sensitivity: 'Skin Sensitivity',
    lymph_node_pain: 'Lymph Node Pain',
    sore_throat: 'Sore Throat',
    flu_like_symptoms: 'Flu-like Symptoms',
    other: 'Other',
  };
  
  return displayNames[symptomType] || symptomType;
};

export const getSeverityLabel = (severity: number): string => {
  if (severity <= 2) return 'Very Mild';
  if (severity <= 4) return 'Mild';
  if (severity <= 6) return 'Moderate';
  if (severity <= 8) return 'Severe';
  return 'Very Severe';
};

export const getSeverityColor = (severity: number): string => {
  if (severity <= 2) return 'text-green-600';
  if (severity <= 4) return 'text-yellow-600';
  if (severity <= 6) return 'text-orange-600';
  if (severity <= 8) return 'text-red-600';
  return 'text-red-800';
};

export const getWellbeingLabel = (rating: number): string => {
  if (rating <= 2) return 'Very Difficult Day';
  if (rating <= 4) return 'Challenging Day';
  if (rating <= 6) return 'Managing';
  if (rating <= 8) return 'Good Day';
  return 'Great Day';
};

export const getActivityLevelLabel = (level: string): string => {
  const labels = {
    bedbound: 'Bedbound',
    housebound: 'Housebound',
    limited_activity: 'Limited Activity',
    normal_activity: 'Normal Activity',
  };
  return labels[level as keyof typeof labels] || level;
};

// Validation functions
export const validateSymptomEntry = (data: unknown): SymptomEntry => {
  return SymptomEntrySchema.parse(data);
};

export const validateDailySymptomLog = (data: unknown): DailySymptomLog => {
  return DailySymptomLogSchema.parse(data);
};

export const validateQuickSymptomCheck = (data: unknown): QuickSymptomCheck => {
  return QuickSymptomCheckSchema.parse(data);
};