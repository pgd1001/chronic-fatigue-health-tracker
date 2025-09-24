import { z } from 'zod';

// Report time periods
export const ReportPeriodSchema = z.enum([
  'week',
  'month',
  'quarter',
  'six_months',
  'year',
  'custom'
]);

// Report types
export const ReportTypeSchema = z.enum([
  'summary',
  'detailed',
  'symptom_focused',
  'activity_focused',
  'biometric_focused',
  'comprehensive'
]);

// Report format
export const ReportFormatSchema = z.enum([
  'pdf',
  'json',
  'csv'
]);

// Privacy consent levels
export const ConsentLevelSchema = z.enum([
  'basic_metrics',
  'detailed_symptoms',
  'full_data',
  'custom'
]);

// Health metrics summary
export const HealthMetricsSummarySchema = z.object({
  averageEnergyLevel: z.number().nullable(),
  averageFatigueLevel: z.number().nullable(),
  averagePainLevel: z.number().nullable(),
  averageBrainFogLevel: z.number().nullable(),
  averageSleepQuality: z.number().nullable(),
  averageMoodRating: z.number().nullable(),
  
  // Trend indicators
  energyTrend: z.enum(['improving', 'stable', 'declining', 'insufficient_data']),
  fatigueTrend: z.enum(['improving', 'stable', 'declining', 'insufficient_data']),
  overallTrend: z.enum(['improving', 'stable', 'declining', 'insufficient_data']),
  
  // Activity metrics
  goodDays: z.number().int().min(0),
  difficultDays: z.number().int().min(0),
  totalDaysTracked: z.number().int().min(0),
  
  // Completion rates
  dailyAnchorCompletionRate: z.number().min(0).max(100),
  movementSessionCompletionRate: z.number().min(0).max(100),
  
  // Biometric data
  averageHeartRate: z.number().nullable(),
  averageHRV: z.number().nullable(),
  biometricMeasurements: z.number().int().min(0),
});

// Symptom analysis
export const SymptomAnalysisSchema = z.object({
  topSymptoms: z.array(z.object({
    symptomType: z.string(),
    frequency: z.number().min(0).max(100), // percentage
    averageSeverity: z.number().min(1).max(10),
    trendDirection: z.enum(['improving', 'stable', 'worsening']),
  })).max(10),
  
  symptomCorrelations: z.array(z.object({
    symptom1: z.string(),
    symptom2: z.string(),
    correlation: z.number().min(-1).max(1),
    significance: z.enum(['low', 'moderate', 'high']),
    sampleSize: z.number().int().positive(),
  })).max(20),
  
  postExertionalMalaise: z.object({
    frequency: z.number().min(0).max(100),
    averageSeverity: z.number().min(1).max(10).nullable(),
    triggerPatterns: z.array(z.string()).max(10),
  }).optional(),
});

// Activity patterns
export const ActivityPatternsSchema = z.object({
  movementSessions: z.object({
    totalSessions: z.number().int().min(0),
    averageDuration: z.number().nullable(),
    averageIntensity: z.number().min(1).max(10).nullable(),
    completionRate: z.number().min(0).max(100),
    adaptationFrequency: z.number().min(0).max(100),
  }),
  
  sleepPatterns: z.object({
    averageSleepDuration: z.number().nullable(),
    averageSleepQuality: z.number().min(1).max(10).nullable(),
    sleepOptimizationCompliance: z.number().min(0).max(100),
    sleepDisturbanceFrequency: z.number().min(0).max(100),
  }),
  
  nutritionPatterns: z.object({
    averageHydration: z.number().nullable(),
    supplementCompliance: z.number().min(0).max(100),
    oneProductFoodCompliance: z.number().min(0).max(100),
  }),
  
  pacingPatterns: z.object({
    aiRecommendationsFollowed: z.number().min(0).max(100),
    overexertionEpisodes: z.number().int().min(0),
    restDaysUtilized: z.number().int().min(0),
  }),
});

// Clinical observations
export const ClinicalObservationsSchema = z.object({
  keyFindings: z.array(z.string()).max(10),
  concerningPatterns: z.array(z.string()).max(10),
  positiveIndicators: z.array(z.string()).max(10),
  recommendationsForProvider: z.array(z.string()).max(10),
  
  // Data quality indicators
  dataCompleteness: z.number().min(0).max(100),
  trackingConsistency: z.number().min(0).max(100),
  reportReliability: z.enum(['high', 'moderate', 'low']),
});

// Healthcare report schema
export const HealthcareReportSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  
  // Report metadata
  reportType: ReportTypeSchema,
  reportPeriod: ReportPeriodSchema,
  startDate: z.string().date(),
  endDate: z.string().date(),
  generatedAt: z.date(),
  
  // Patient information (anonymized for sharing)
  patientId: z.string(), // Anonymized identifier
  reportTitle: z.string().max(200),
  
  // Consent and privacy
  consentLevel: ConsentLevelSchema,
  sharedWithProvider: z.boolean().default(false),
  providerAccessCode: z.string().optional(),
  expiresAt: z.date().optional(),
  
  // Report content
  executiveSummary: z.string().max(1000),
  healthMetrics: HealthMetricsSummarySchema,
  symptomAnalysis: SymptomAnalysisSchema,
  activityPatterns: ActivityPatternsSchema,
  clinicalObservations: ClinicalObservationsSchema,
  
  // Raw data references (for detailed reports)
  includedDataTypes: z.array(z.enum([
    'daily_health_logs',
    'symptom_logs',
    'movement_sessions',
    'biometric_measurements',
    'sleep_logs',
    'nutrition_logs',
    'ai_recommendations'
  ])),
  
  // Report generation metadata
  dataQualityScore: z.number().min(0).max(100),
  disclaimers: z.array(z.string()),
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Report generation request
export const GenerateReportRequestSchema = z.object({
  reportType: ReportTypeSchema,
  reportPeriod: ReportPeriodSchema,
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  consentLevel: ConsentLevelSchema,
  includeRawData: z.boolean().default(false),
  customTitle: z.string().max(200).optional(),
  focusAreas: z.array(z.enum([
    'symptoms',
    'activity',
    'sleep',
    'biometrics',
    'pacing',
    'nutrition'
  ])).optional(),
});

// Report sharing configuration
export const ReportSharingConfigSchema = z.object({
  shareWithProvider: z.boolean(),
  providerEmail: z.string().email().optional(),
  providerName: z.string().max(100).optional(),
  accessDuration: z.enum(['24_hours', '7_days', '30_days', '90_days']),
  allowDownload: z.boolean().default(true),
  requiresPassword: z.boolean().default(false),
  customPassword: z.string().min(8).optional(),
  notifyOnAccess: z.boolean().default(true),
});

// Export formats
export const ReportExportSchema = z.object({
  reportId: z.string().uuid(),
  format: ReportFormatSchema,
  includeCharts: z.boolean().default(true),
  includeRawData: z.boolean().default(false),
  anonymizeData: z.boolean().default(true),
  customSections: z.array(z.string()).optional(),
});

// Type exports
export type ReportPeriod = z.infer<typeof ReportPeriodSchema>;
export type ReportType = z.infer<typeof ReportTypeSchema>;
export type ReportFormat = z.infer<typeof ReportFormatSchema>;
export type ConsentLevel = z.infer<typeof ConsentLevelSchema>;
export type HealthMetricsSummary = z.infer<typeof HealthMetricsSummarySchema>;
export type SymptomAnalysis = z.infer<typeof SymptomAnalysisSchema>;
export type ActivityPatterns = z.infer<typeof ActivityPatternsSchema>;
export type ClinicalObservations = z.infer<typeof ClinicalObservationsSchema>;
export type HealthcareReport = z.infer<typeof HealthcareReportSchema>;
export type GenerateReportRequest = z.infer<typeof GenerateReportRequestSchema>;
export type ReportSharingConfig = z.infer<typeof ReportSharingConfigSchema>;
export type ReportExport = z.infer<typeof ReportExportSchema>;

// Helper functions
export const getReportTypeDisplayName = (type: ReportType): string => {
  const displayNames: Record<ReportType, string> = {
    summary: 'Summary Report',
    detailed: 'Detailed Analysis',
    symptom_focused: 'Symptom-Focused Report',
    activity_focused: 'Activity & Movement Report',
    biometric_focused: 'Biometric Analysis',
    comprehensive: 'Comprehensive Health Report',
  };
  return displayNames[type];
};

export const getReportPeriodDisplayName = (period: ReportPeriod): string => {
  const displayNames: Record<ReportPeriod, string> = {
    week: 'Past Week',
    month: 'Past Month',
    quarter: 'Past 3 Months',
    six_months: 'Past 6 Months',
    year: 'Past Year',
    custom: 'Custom Period',
  };
  return displayNames[period];
};

export const getConsentLevelDescription = (level: ConsentLevel): string => {
  const descriptions: Record<ConsentLevel, string> = {
    basic_metrics: 'Basic health metrics only (averages, trends)',
    detailed_symptoms: 'Includes detailed symptom tracking and patterns',
    full_data: 'Complete health data including notes and correlations',
    custom: 'Custom data selection based on your preferences',
  };
  return descriptions[level];
};

export const calculateDataQualityScore = (
  totalDays: number,
  daysWithData: number,
  completenessScore: number
): number => {
  const consistencyScore = totalDays > 0 ? (daysWithData / totalDays) * 100 : 0;
  return Math.round((consistencyScore * 0.6 + completenessScore * 0.4));
};

export const generateReportDisclaimer = (): string[] => {
  return [
    'This report is generated from self-reported health data and is intended for informational purposes only.',
    'The information in this report should not be used as a substitute for professional medical advice, diagnosis, or treatment.',
    'Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.',
    'The data patterns and correlations shown are observational and do not imply causation.',
    'This application is not a medical device and has not been evaluated by regulatory authorities for diagnostic purposes.',
  ];
};

// Validation functions
export const validateHealthcareReport = (data: unknown): HealthcareReport => {
  return HealthcareReportSchema.parse(data);
};

export const validateGenerateReportRequest = (data: unknown): GenerateReportRequest => {
  return GenerateReportRequestSchema.parse(data);
};

export const validateReportSharingConfig = (data: unknown): ReportSharingConfig => {
  return ReportSharingConfigSchema.parse(data);
};