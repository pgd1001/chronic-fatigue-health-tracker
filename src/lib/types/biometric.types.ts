import { z } from 'zod';

// Biometric Measurement Schema
export const BiometricMeasurementSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  timestamp: z.date(),
  
  // Heart rate data
  heartRate: z.number().int().min(30).max(220).optional(), // BPM
  heartRateVariability: z.number().min(0).max(200).optional(), // HRV in ms
  
  // Measurement quality and metadata
  measurementDuration: z.number().int().min(10).max(300), // seconds
  quality: z.enum(['excellent', 'good', 'fair', 'poor']),
  
  // Environmental factors
  lightingCondition: z.enum(['optimal', 'adequate', 'poor']).optional(),
  deviceStability: z.enum(['stable', 'slight_movement', 'unstable']).optional(),
  
  // Raw data for future analysis (stored as JSON)
  rawData: z.object({
    samples: z.array(z.number()).optional(),
    timestamps: z.array(z.number()).optional(),
    processingNotes: z.string().optional(),
  }).optional(),
  
  // User context
  measurementContext: z.enum([
    'resting',
    'post_exercise',
    'stressed',
    'relaxed',
    'morning',
    'evening',
    'other'
  ]).optional(),
  
  notes: z.string().max(200).optional(),
  
  createdAt: z.date(),
});

export const CreateBiometricMeasurementSchema = BiometricMeasurementSchema.omit({
  id: true,
  createdAt: true,
});

// Biometric Trends Schema
export const BiometricTrendsSchema = z.object({
  userId: z.string().uuid(),
  periodStart: z.string().date(),
  periodEnd: z.string().date(),
  
  // Heart rate trends
  averageHeartRate: z.number().optional(),
  restingHeartRate: z.number().optional(),
  heartRateVariability: z.number().optional(),
  
  // Trend analysis
  heartRateTrend: z.enum(['improving', 'stable', 'concerning', 'insufficient_data']),
  hrvTrend: z.enum(['improving', 'stable', 'concerning', 'insufficient_data']),
  
  // Data quality metrics
  measurementCount: z.number().int().min(0),
  averageQuality: z.enum(['excellent', 'good', 'fair', 'poor']),
  
  // Recommendations
  recommendations: z.array(z.string()).optional(),
});

// Camera Measurement Session Schema
export const CameraMeasurementSessionSchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().uuid(),
  
  // Session setup
  startTime: z.date(),
  endTime: z.date().optional(),
  
  // Instructions and guidance
  instructionsCompleted: z.boolean().default(false),
  calibrationCompleted: z.boolean().default(false),
  
  // Real-time feedback during measurement
  currentHeartRate: z.number().optional(),
  signalQuality: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  
  // Session status
  status: z.enum(['setup', 'calibrating', 'measuring', 'completed', 'failed']),
  
  // Error handling
  errorReason: z.enum([
    'poor_lighting',
    'camera_blocked',
    'excessive_movement',
    'low_signal_quality',
    'user_cancelled',
    'technical_error'
  ]).optional(),
  
  // Final measurement (if successful)
  finalMeasurement: BiometricMeasurementSchema.optional(),
});

// Type exports
export type BiometricMeasurement = z.infer<typeof BiometricMeasurementSchema>;
export type CreateBiometricMeasurement = z.infer<typeof CreateBiometricMeasurementSchema>;
export type BiometricTrends = z.infer<typeof BiometricTrendsSchema>;
export type CameraMeasurementSession = z.infer<typeof CameraMeasurementSessionSchema>;

// Validation functions
export const validateBiometricMeasurement = (data: unknown): BiometricMeasurement => {
  return BiometricMeasurementSchema.parse(data);
};

export const validateCreateBiometricMeasurement = (data: unknown): CreateBiometricMeasurement => {
  return CreateBiometricMeasurementSchema.parse(data);
};

// Helper functions
export const getHeartRateZone = (heartRate: number, age: number): string => {
  const maxHR = 220 - age;
  const percentage = (heartRate / maxHR) * 100;
  
  if (percentage < 50) return 'Resting';
  if (percentage < 60) return 'Very Light';
  if (percentage < 70) return 'Light';
  if (percentage < 80) return 'Moderate';
  if (percentage < 90) return 'Vigorous';
  return 'Maximum';
};

export const getHeartRateZoneColor = (zone: string): string => {
  const colors: Record<string, string> = {
    'Resting': 'text-blue-600',
    'Very Light': 'text-green-600',
    'Light': 'text-yellow-600',
    'Moderate': 'text-orange-600',
    'Vigorous': 'text-red-600',
    'Maximum': 'text-red-800',
  };
  
  return colors[zone] || 'text-gray-600';
};

export const isHeartRateNormal = (heartRate: number, age: number, isResting: boolean = true): boolean => {
  if (isResting) {
    // Normal resting heart rate ranges
    if (age < 18) return heartRate >= 70 && heartRate <= 100;
    if (age < 65) return heartRate >= 60 && heartRate <= 100;
    return heartRate >= 60 && heartRate <= 100;
  }
  
  // During activity, wider range is acceptable
  const maxHR = 220 - age;
  return heartRate >= 60 && heartRate <= maxHR * 0.85;
};

export const getHRVInterpretation = (hrv: number, age: number): string => {
  // Simplified HRV interpretation (actual ranges vary significantly)
  if (age < 30) {
    if (hrv > 50) return 'Excellent';
    if (hrv > 35) return 'Good';
    if (hrv > 25) return 'Fair';
    return 'Needs Attention';
  } else if (age < 50) {
    if (hrv > 40) return 'Excellent';
    if (hrv > 30) return 'Good';
    if (hrv > 20) return 'Fair';
    return 'Needs Attention';
  } else {
    if (hrv > 30) return 'Excellent';
    if (hrv > 20) return 'Good';
    if (hrv > 15) return 'Fair';
    return 'Needs Attention';
  }
};