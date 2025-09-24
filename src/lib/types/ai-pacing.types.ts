import { z } from 'zod';

// AI Pacing Types and Schemas
export const UserHealthDataSchema = z.object({
  userId: z.string().uuid(),
  energyLevels: z.array(z.object({
    date: z.string().date(),
    level: z.number().int().min(1).max(10),
    timeOfDay: z.enum(['morning', 'afternoon', 'evening']),
  })),
  biometricReadings: z.array(z.object({
    date: z.string().date(),
    heartRate: z.number().min(40).max(200),
    hrv: z.number().min(0).max(200),
    confidence: z.number().min(0).max(1),
  })),
  symptomLogs: z.array(z.object({
    date: z.string().date(),
    fatigue: z.number().int().min(1).max(10),
    pain: z.number().int().min(1).max(10).optional(),
    brainFog: z.number().int().min(1).max(10).optional(),
    sleepQuality: z.number().int().min(1).max(10).optional(),
  })),
  activityLogs: z.array(z.object({
    date: z.string().date(),
    type: z.enum(['daily_anchor', 'movement_session', 'rest_day']),
    completed: z.boolean(),
    postActivityFatigue: z.number().int().min(1).max(10).optional(),
  })),
});

export const PacingRecommendationSchema = z.object({
  type: z.enum([
    'energy_conservation',
    'gentle_activity',
    'rest_recommendation',
    'routine_modification',
    'biometric_concern'
  ]),
  priority: z.enum(['low', 'medium', 'high']),
  title: z.string().max(100),
  message: z.string().max(500),
  reasoning: z.string().max(300),
  actionItems: z.array(z.string().max(200)),
  validUntil: z.date(),
  confidence: z.number().min(0).max(1),
  disclaimers: z.array(z.string()),
});

export const EnergyForecastSchema = z.object({
  userId: z.string().uuid(),
  forecastDate: z.string().date(),
  predictedEnergyLevel: z.number().min(1).max(10),
  confidence: z.number().min(0).max(1),
  factors: z.array(z.object({
    factor: z.string(),
    impact: z.enum(['positive', 'negative', 'neutral']),
    weight: z.number().min(0).max(1),
  })),
  recommendations: z.array(z.string()),
});

export const AdaptedRoutineSchema = z.object({
  baseRoutineId: z.string(),
  adaptations: z.array(z.object({
    component: z.string(),
    modification: z.enum(['reduce_duration', 'skip', 'simplify', 'add_rest']),
    reason: z.string(),
    newDuration: z.number().optional(),
  })),
  estimatedEnergyRequirement: z.number().min(1).max(10),
  recommendedTimeOfDay: z.enum(['morning', 'afternoon', 'evening']),
  precautions: z.array(z.string()),
});

export const PatternAnalysisSchema = z.object({
  userId: z.string().uuid(),
  analysisDate: z.date(),
  patterns: z.array(z.object({
    type: z.enum(['energy_cycle', 'crash_trigger', 'recovery_pattern', 'seasonal_variation']),
    description: z.string(),
    confidence: z.number().min(0).max(1),
    timeframe: z.string(),
    recommendations: z.array(z.string()),
  })),
  trends: z.object({
    energyTrend: z.enum(['improving', 'stable', 'declining']),
    symptomTrend: z.enum(['improving', 'stable', 'worsening']),
    activityTolerance: z.enum(['increasing', 'stable', 'decreasing']),
  }),
});

// Type exports
export type UserHealthData = z.infer<typeof UserHealthDataSchema>;
export type PacingRecommendation = z.infer<typeof PacingRecommendationSchema>;
export type EnergyForecast = z.infer<typeof EnergyForecastSchema>;
export type AdaptedRoutine = z.infer<typeof AdaptedRoutineSchema>;
export type PatternAnalysis = z.infer<typeof PatternAnalysisSchema>;

// Validation functions
export const validateUserHealthData = (data: unknown): UserHealthData => {
  return UserHealthDataSchema.parse(data);
};

export const validatePacingRecommendation = (data: unknown): PacingRecommendation => {
  return PacingRecommendationSchema.parse(data);
};

export const validateEnergyForecast = (data: unknown): EnergyForecast => {
  return EnergyForecastSchema.parse(data);
};

export const validateAdaptedRoutine = (data: unknown): AdaptedRoutine => {
  return AdaptedRoutineSchema.parse(data);
};

export const validatePatternAnalysis = (data: unknown): PatternAnalysis => {
  return PatternAnalysisSchema.parse(data);
};

// Helper functions for AI analysis
export const calculateEnergyAverage = (energyLevels: UserHealthData['energyLevels'], days: number = 7): number => {
  const recentLevels = energyLevels
    .filter(level => {
      const levelDate = new Date(level.date);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      return levelDate >= cutoffDate;
    })
    .map(level => level.level);

  if (recentLevels.length === 0) return 5; // Default middle value
  
  return Math.round((recentLevels.reduce((sum, level) => sum + level, 0) / recentLevels.length) * 10) / 10;
};

export const detectEnergyPattern = (energyLevels: UserHealthData['energyLevels']): 'stable' | 'declining' | 'improving' | 'volatile' => {
  if (energyLevels.length < 7) return 'stable';

  const sortedLevels = energyLevels
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14); // Last 2 weeks

  if (sortedLevels.length < 7) return 'stable';

  const firstWeek = sortedLevels.slice(0, 7).map(l => l.level);
  const secondWeek = sortedLevels.slice(-7).map(l => l.level);

  const firstAvg = firstWeek.reduce((sum, level) => sum + level, 0) / firstWeek.length;
  const secondAvg = secondWeek.reduce((sum, level) => sum + level, 0) / secondWeek.length;

  const difference = secondAvg - firstAvg;
  const variance = calculateVariance(sortedLevels.map(l => l.level));

  if (variance > 4) return 'volatile'; // High variance indicates volatility
  if (difference > 1) return 'improving';
  if (difference < -1) return 'declining';
  return 'stable';
};

export const calculateVariance = (values: number[]): number => {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
  return squaredDifferences.reduce((sum, diff) => sum + diff, 0) / values.length;
};

export const identifyCrashTriggers = (
  energyLevels: UserHealthData['energyLevels'],
  activityLogs: UserHealthData['activityLogs']
): string[] => {
  const triggers: string[] = [];
  
  // Look for energy drops after activities
  const sortedEnergy = energyLevels.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  for (let i = 1; i < sortedEnergy.length; i++) {
    const current = sortedEnergy[i];
    const previous = sortedEnergy[i - 1];
    
    // Significant energy drop (3+ points)
    if (previous.level - current.level >= 3) {
      const activityOnPreviousDay = activityLogs.find(log => log.date === previous.date);
      
      if (activityOnPreviousDay && activityOnPreviousDay.completed) {
        if (activityOnPreviousDay.type === 'movement_session') {
          triggers.push('Movement session may have been too intense');
        } else if (activityOnPreviousDay.type === 'daily_anchor') {
          triggers.push('Daily routine may need modification');
        }
      }
    }
  }
  
  return [...new Set(triggers)]; // Remove duplicates
};

export const assessBiometricConcerns = (
  biometricReadings: UserHealthData['biometricReadings']
): { hasConcerns: boolean; concerns: string[] } => {
  const concerns: string[] = [];
  
  if (biometricReadings.length < 3) {
    return { hasConcerns: false, concerns: [] };
  }
  
  const recentReadings = biometricReadings
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7); // Last 7 readings
  
  const avgHeartRate = recentReadings.reduce((sum, reading) => sum + reading.heartRate, 0) / recentReadings.length;
  const avgHRV = recentReadings.reduce((sum, reading) => sum + reading.hrv, 0) / recentReadings.length;
  
  // Check for elevated resting heart rate (may indicate overexertion)
  if (avgHeartRate > 90) {
    concerns.push('Elevated resting heart rate detected - consider more rest');
  }
  
  // Check for low HRV (may indicate stress or overexertion)
  if (avgHRV < 20) {
    concerns.push('Low heart rate variability - may indicate need for recovery');
  }
  
  // Check for declining HRV trend
  if (recentReadings.length >= 5) {
    const firstHalf = recentReadings.slice(-5, -2).map(r => r.hrv);
    const secondHalf = recentReadings.slice(-3).map(r => r.hrv);
    
    const firstAvg = firstHalf.reduce((sum, hrv) => sum + hrv, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, hrv) => sum + hrv, 0) / secondHalf.length;
    
    if (firstAvg - secondAvg > 10) {
      concerns.push('Declining HRV trend - consider reducing activity intensity');
    }
  }
  
  return {
    hasConcerns: concerns.length > 0,
    concerns
  };
};

// Constants for AI recommendations
export const AI_DISCLAIMERS = [
  'This information is for general wellness purposes only and is not medical advice.',
  'Always consult with your healthcare provider before making changes to your health routine.',
  'These suggestions are based on patterns in your data and may not apply to your specific situation.',
  'If you experience worsening symptoms, please contact your healthcare provider.',
];

export const ENERGY_LEVEL_DESCRIPTIONS = {
  1: 'Severe fatigue - rest is essential',
  2: 'Very low energy - minimal activity only',
  3: 'Low energy - gentle activities only',
  4: 'Below average - light activities with frequent rest',
  5: 'Moderate energy - standard daily routine',
  6: 'Good energy - can handle routine plus light extras',
  7: 'High energy - can manage additional activities',
  8: 'Very good energy - productive day possible',
  9: 'Excellent energy - can handle challenging tasks',
  10: 'Peak energy - maximum activity tolerance'
} as const;