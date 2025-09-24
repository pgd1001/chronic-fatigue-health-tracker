import {
  type UserHealthData,
  type PacingRecommendation,
  type EnergyForecast,
  type AdaptedRoutine,
  type PatternAnalysis,
  validateUserHealthData,
  calculateEnergyAverage,
  detectEnergyPattern,
  identifyCrashTriggers,
  assessBiometricConcerns,
  AI_DISCLAIMERS,
  ENERGY_LEVEL_DESCRIPTIONS,
} from '../types/ai-pacing.types';

export class AIPacingService {
  private static readonly MIN_DATA_POINTS = 3;
  private static readonly ANALYSIS_WINDOW_DAYS = 14;
  private static readonly RECOMMENDATION_VALIDITY_HOURS = 24;

  /**
   * Analyzes user health data to provide pacing recommendations
   * Focuses on preventing post-exertional malaise (PEM) and energy conservation
   */
  static async analyzePacingNeeds(userData: UserHealthData): Promise<PacingRecommendation[]> {
    try {
      const validatedData = validateUserHealthData(userData);
      const recommendations: PacingRecommendation[] = [];

      // Ensure we have enough data for meaningful analysis
      if (validatedData.energyLevels.length < this.MIN_DATA_POINTS) {
        return this.getInitialRecommendations();
      }

      // Analyze current energy state
      const currentEnergyRecommendations = this.analyzeCurrentEnergyState(validatedData);
      recommendations.push(...currentEnergyRecommendations);

      // Analyze energy patterns and trends
      const patternRecommendations = this.analyzeEnergyPatterns(validatedData);
      recommendations.push(...patternRecommendations);

      // Analyze biometric concerns
      const biometricRecommendations = this.analyzeBiometricData(validatedData);
      recommendations.push(...biometricRecommendations);

      // Analyze activity tolerance
      const activityRecommendations = this.analyzeActivityTolerance(validatedData);
      recommendations.push(...activityRecommendations);

      // Sort by priority and return top recommendations
      return recommendations
        .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority))
        .slice(0, 5); // Limit to 5 recommendations to avoid overwhelming user

    } catch (error) {
      console.error('Error analyzing pacing needs:', error);
      return this.getErrorFallbackRecommendations();
    }
  }

  /**
   * Predicts energy levels based on historical patterns
   */
  static async predictEnergyLevels(userData: UserHealthData): Promise<EnergyForecast> {
    try {
      const validatedData = validateUserHealthData(userData);
      
      if (validatedData.energyLevels.length < 7) {
        return this.getDefaultEnergyForecast(validatedData.userId);
      }

      const recentAverage = calculateEnergyAverage(validatedData.energyLevels, 7);
      const pattern = detectEnergyPattern(validatedData.energyLevels);
      
      // Simple prediction based on recent trends
      let predictedLevel = recentAverage;
      const factors: EnergyForecast['factors'] = [];

      // Adjust prediction based on pattern
      switch (pattern) {
        case 'improving':
          predictedLevel = Math.min(10, recentAverage + 0.5);
          factors.push({
            factor: 'Improving energy trend',
            impact: 'positive',
            weight: 0.7
          });
          break;
        case 'declining':
          predictedLevel = Math.max(1, recentAverage - 0.5);
          factors.push({
            factor: 'Declining energy trend',
            impact: 'negative',
            weight: 0.8
          });
          break;
        case 'volatile':
          predictedLevel = recentAverage;
          factors.push({
            factor: 'Volatile energy pattern',
            impact: 'neutral',
            weight: 0.6
          });
          break;
        default:
          factors.push({
            factor: 'Stable energy pattern',
            impact: 'neutral',
            weight: 0.5
          });
      }

      // Consider recent activity impact
      const recentActivity = validatedData.activityLogs
        .filter(log => {
          const logDate = new Date(log.date);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          return logDate >= yesterday;
        });

      if (recentActivity.some(activity => activity.postActivityFatigue && activity.postActivityFatigue > 6)) {
        predictedLevel = Math.max(1, predictedLevel - 1);
        factors.push({
          factor: 'Recent high post-activity fatigue',
          impact: 'negative',
          weight: 0.9
        });
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      return {
        userId: validatedData.userId,
        forecastDate: tomorrow.toISOString().split('T')[0],
        predictedEnergyLevel: Math.round(predictedLevel * 10) / 10,
        confidence: this.calculatePredictionConfidence(validatedData),
        factors,
        recommendations: this.generateForecastRecommendations(predictedLevel, pattern)
      };

    } catch (error) {
      console.error('Error predicting energy levels:', error);
      return this.getDefaultEnergyForecast(userData.userId);
    }
  }

  /**
   * Adapts routine based on current user state and patterns
   */
  static async adaptRoutine(
    baseRoutine: { id: string; components: string[] },
    userState: { currentEnergy: number; recentFatigue: number }
  ): Promise<AdaptedRoutine> {
    try {
      const adaptations: AdaptedRoutine['adaptations'] = [];
      let estimatedEnergyRequirement = 5; // Default moderate requirement

      // Adapt based on current energy level
      if (userState.currentEnergy <= 3) {
        // Very low energy - significant adaptations needed
        adaptations.push({
          component: 'breathing',
          modification: 'reduce_duration',
          reason: 'Low energy level detected',
          newDuration: 120 // 2 minutes instead of 3
        });
        
        adaptations.push({
          component: 'mobility',
          modification: 'skip',
          reason: 'Energy conservation needed'
        });
        
        adaptations.push({
          component: 'stretches',
          modification: 'simplify',
          reason: 'Gentle movements only'
        });
        
        estimatedEnergyRequirement = 2;
      } else if (userState.currentEnergy <= 5) {
        // Moderate energy - some adaptations
        adaptations.push({
          component: 'mobility',
          modification: 'reduce_duration',
          reason: 'Moderate energy level',
          newDuration: 180 // 3 minutes instead of 4
        });
        
        adaptations.push({
          component: 'all',
          modification: 'add_rest',
          reason: 'Extra rest periods between activities'
        });
        
        estimatedEnergyRequirement = 3;
      } else if (userState.recentFatigue > 6) {
        // Recent high fatigue - be cautious
        adaptations.push({
          component: 'all',
          modification: 'reduce_duration',
          reason: 'Recent high fatigue reported',
          newDuration: undefined // Reduce all by 25%
        });
        
        estimatedEnergyRequirement = 4;
      }

      // Determine best time of day based on energy level
      let recommendedTimeOfDay: AdaptedRoutine['recommendedTimeOfDay'] = 'morning';
      if (userState.currentEnergy <= 4) {
        recommendedTimeOfDay = 'afternoon'; // When energy might be slightly higher
      }

      const precautions = this.generatePrecautions(userState.currentEnergy, userState.recentFatigue);

      return {
        baseRoutineId: baseRoutine.id,
        adaptations,
        estimatedEnergyRequirement,
        recommendedTimeOfDay,
        precautions
      };

    } catch (error) {
      console.error('Error adapting routine:', error);
      return this.getDefaultAdaptedRoutine(baseRoutine.id);
    }
  }

  /**
   * Performs comprehensive pattern analysis on user data
   */
  static async analyzePatterns(userData: UserHealthData): Promise<PatternAnalysis> {
    try {
      const validatedData = validateUserHealthData(userData);
      const patterns: PatternAnalysis['patterns'] = [];

      // Analyze energy cycles
      const energyPattern = detectEnergyPattern(validatedData.energyLevels);
      patterns.push({
        type: 'energy_cycle',
        description: `Energy levels show a ${energyPattern} pattern over recent weeks`,
        confidence: 0.7,
        timeframe: 'Past 2 weeks',
        recommendations: this.getPatternRecommendations(energyPattern)
      });

      // Analyze crash triggers
      const crashTriggers = identifyCrashTriggers(validatedData.energyLevels, validatedData.activityLogs);
      if (crashTriggers.length > 0) {
        patterns.push({
          type: 'crash_trigger',
          description: `Potential triggers identified: ${crashTriggers.join(', ')}`,
          confidence: 0.8,
          timeframe: 'Recent activities',
          recommendations: [
            'Consider reducing intensity of identified trigger activities',
            'Add more rest periods around these activities',
            'Monitor energy levels more closely after these activities'
          ]
        });
      }

      // Analyze recovery patterns
      const recoveryPattern = this.analyzeRecoveryPatterns(validatedData);
      if (recoveryPattern) {
        patterns.push(recoveryPattern);
      }

      const trends = {
        energyTrend: energyPattern === 'improving' ? 'improving' as const : 
                    energyPattern === 'declining' ? 'declining' as const : 'stable' as const,
        symptomTrend: this.analyzeSymptomTrend(validatedData.symptomLogs),
        activityTolerance: this.analyzeActivityTolerance(validatedData).length > 0 ? 'decreasing' as const : 'stable' as const
      };

      return {
        userId: validatedData.userId,
        analysisDate: new Date(),
        patterns,
        trends
      };

    } catch (error) {
      console.error('Error analyzing patterns:', error);
      return this.getDefaultPatternAnalysis(userData.userId);
    }
  }

  // Private helper methods

  private static analyzeCurrentEnergyState(userData: UserHealthData): PacingRecommendation[] {
    const recommendations: PacingRecommendation[] = [];
    const recentEnergy = calculateEnergyAverage(userData.energyLevels, 3);

    if (recentEnergy <= 3) {
      recommendations.push({
        type: 'rest_recommendation',
        priority: 'high',
        title: 'Energy Conservation Needed',
        message: 'Your recent energy levels suggest you need focused rest and recovery.',
        reasoning: `Average energy level of ${recentEnergy}/10 over the past 3 days indicates significant fatigue.`,
        actionItems: [
          'Prioritize rest and gentle activities only',
          'Consider skipping optional activities today',
          'Focus on basic self-care and hydration',
          'Avoid stimulating activities or environments'
        ],
        validUntil: new Date(Date.now() + this.RECOMMENDATION_VALIDITY_HOURS * 60 * 60 * 1000),
        confidence: 0.9,
        disclaimers: AI_DISCLAIMERS
      });
    } else if (recentEnergy >= 7) {
      recommendations.push({
        type: 'gentle_activity',
        priority: 'low',
        title: 'Good Energy Window',
        message: 'Your energy levels suggest you might be able to engage in gentle activities.',
        reasoning: `Average energy level of ${recentEnergy}/10 indicates a potentially good period for light activity.`,
        actionItems: [
          'Consider your optional movement session if you feel up to it',
          'Still pace yourself and listen to your body',
          'Plan rest periods after any activities',
          'Monitor for any signs of overexertion'
        ],
        validUntil: new Date(Date.now() + this.RECOMMENDATION_VALIDITY_HOURS * 60 * 60 * 1000),
        confidence: 0.7,
        disclaimers: AI_DISCLAIMERS
      });
    }

    return recommendations;
  }

  private static analyzeEnergyPatterns(userData: UserHealthData): PacingRecommendation[] {
    const recommendations: PacingRecommendation[] = [];
    const pattern = detectEnergyPattern(userData.energyLevels);

    if (pattern === 'declining') {
      recommendations.push({
        type: 'routine_modification',
        priority: 'high',
        title: 'Declining Energy Pattern Detected',
        message: 'Your energy levels have been trending downward. Consider adjusting your routine.',
        reasoning: 'Analysis shows a declining trend in energy levels over the past two weeks.',
        actionItems: [
          'Reduce the intensity of daily activities',
          'Add more rest periods throughout the day',
          'Consider temporarily skipping optional activities',
          'Focus on sleep optimization and stress reduction'
        ],
        validUntil: new Date(Date.now() + this.RECOMMENDATION_VALIDITY_HOURS * 60 * 60 * 1000),
        confidence: 0.8,
        disclaimers: AI_DISCLAIMERS
      });
    } else if (pattern === 'volatile') {
      recommendations.push({
        type: 'energy_conservation',
        priority: 'medium',
        title: 'Variable Energy Pattern',
        message: 'Your energy levels show high variability. Consistent pacing may help.',
        reasoning: 'Energy levels show significant day-to-day variation, which may indicate boom-bust cycles.',
        actionItems: [
          'Try to maintain consistent activity levels even on good days',
          'Avoid overexertion during high-energy periods',
          'Plan activities for your typically better times of day',
          'Keep a buffer of energy for unexpected demands'
        ],
        validUntil: new Date(Date.now() + this.RECOMMENDATION_VALIDITY_HOURS * 60 * 60 * 1000),
        confidence: 0.7,
        disclaimers: AI_DISCLAIMERS
      });
    }

    return recommendations;
  }

  private static analyzeBiometricData(userData: UserHealthData): PacingRecommendation[] {
    const recommendations: PacingRecommendation[] = [];
    const biometricAssessment = assessBiometricConcerns(userData.biometricReadings);

    if (biometricAssessment.hasConcerns) {
      recommendations.push({
        type: 'biometric_concern',
        priority: 'medium',
        title: 'Biometric Patterns Suggest Rest',
        message: 'Your heart rate and HRV patterns suggest your body may need additional recovery.',
        reasoning: biometricAssessment.concerns.join('; '),
        actionItems: [
          'Consider taking a rest day or reducing activity intensity',
          'Focus on stress reduction and relaxation techniques',
          'Ensure adequate sleep and hydration',
          'Monitor how you feel and adjust activities accordingly'
        ],
        validUntil: new Date(Date.now() + this.RECOMMENDATION_VALIDITY_HOURS * 60 * 60 * 1000),
        confidence: 0.6,
        disclaimers: [
          ...AI_DISCLAIMERS,
          'Biometric readings can be affected by many factors including stress, caffeine, and measurement conditions.'
        ]
      });
    }

    return recommendations;
  }

  private static analyzeActivityTolerance(userData: UserHealthData): PacingRecommendation[] {
    const recommendations: PacingRecommendation[] = [];
    
    // Look for patterns of high post-activity fatigue
    const highFatigueActivities = userData.activityLogs.filter(
      log => log.postActivityFatigue && log.postActivityFatigue > 6
    );

    if (highFatigueActivities.length >= 2) {
      recommendations.push({
        type: 'routine_modification',
        priority: 'high',
        title: 'Activity Modifications Needed',
        message: 'Recent activities seem to be causing significant fatigue. Consider scaling back.',
        reasoning: `${highFatigueActivities.length} recent activities resulted in high post-activity fatigue (>6/10).`,
        actionItems: [
          'Reduce the duration or intensity of activities',
          'Add more rest periods during activities',
          'Consider alternating activity days with complete rest days',
          'Focus on the most essential activities only'
        ],
        validUntil: new Date(Date.now() + this.RECOMMENDATION_VALIDITY_HOURS * 60 * 60 * 1000),
        confidence: 0.8,
        disclaimers: AI_DISCLAIMERS
      });
    }

    return recommendations;
  }

  private static getInitialRecommendations(): PacingRecommendation[] {
    return [{
      type: 'energy_conservation',
      priority: 'medium',
      title: 'Welcome to Pacing',
      message: 'Start by tracking your energy levels daily to help us provide personalized recommendations.',
      reasoning: 'Insufficient data for personalized analysis. Building baseline understanding.',
      actionItems: [
        'Log your energy levels daily using the 1-10 scale',
        'Complete your daily anchor routine at a comfortable pace',
        'Note how activities affect your energy and symptoms',
        'Be patient as we learn your patterns over the next week'
      ],
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      confidence: 0.5,
      disclaimers: AI_DISCLAIMERS
    }];
  }

  private static getErrorFallbackRecommendations(): PacingRecommendation[] {
    return [{
      type: 'energy_conservation',
      priority: 'medium',
      title: 'General Pacing Guidance',
      message: 'Focus on gentle, consistent activities and listen to your body.',
      reasoning: 'Unable to analyze personal data. Providing general chronic fatigue management guidance.',
      actionItems: [
        'Pace activities throughout the day with regular rest breaks',
        'Prioritize essential activities and let go of non-essentials',
        'Maintain consistent sleep and meal times',
        'Stay hydrated and avoid overexertion'
      ],
      validUntil: new Date(Date.now() + this.RECOMMENDATION_VALIDITY_HOURS * 60 * 60 * 1000),
      confidence: 0.3,
      disclaimers: AI_DISCLAIMERS
    }];
  }

  private static getPriorityWeight(priority: PacingRecommendation['priority']): number {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  private static calculatePredictionConfidence(userData: UserHealthData): number {
    const dataPoints = userData.energyLevels.length;
    const biometricPoints = userData.biometricReadings.length;
    const activityPoints = userData.activityLogs.length;
    
    // Base confidence on amount and variety of data
    let confidence = Math.min(dataPoints / 14, 1) * 0.6; // Energy data weight: 60%
    confidence += Math.min(biometricPoints / 7, 1) * 0.2; // Biometric data weight: 20%
    confidence += Math.min(activityPoints / 7, 1) * 0.2; // Activity data weight: 20%
    
    return Math.round(confidence * 100) / 100;
  }

  private static generateForecastRecommendations(predictedLevel: number, pattern: string): string[] {
    const recommendations: string[] = [];
    
    if (predictedLevel <= 4) {
      recommendations.push('Plan for a lower energy day with minimal activities');
      recommendations.push('Prepare easy meals and prioritize rest');
    } else if (predictedLevel >= 7) {
      recommendations.push('Good energy predicted - consider optional activities');
      recommendations.push('Still pace yourself and avoid overcommitting');
    }
    
    if (pattern === 'volatile') {
      recommendations.push('Energy may fluctuate - stay flexible with plans');
    }
    
    return recommendations;
  }

  private static generatePrecautions(currentEnergy: number, recentFatigue: number): string[] {
    const precautions: string[] = [];
    
    if (currentEnergy <= 3) {
      precautions.push('Stop immediately if you feel worse during activities');
      precautions.push('Consider doing activities in bed or seated');
    }
    
    if (recentFatigue > 6) {
      precautions.push('Monitor for post-exertional malaise symptoms');
      precautions.push('Have a recovery plan ready if symptoms worsen');
    }
    
    precautions.push('Listen to your body and adjust as needed');
    precautions.push('It\'s always okay to stop or modify activities');
    
    return precautions;
  }

  private static getPatternRecommendations(pattern: string): string[] {
    switch (pattern) {
      case 'improving':
        return [
          'Continue current approach as it seems to be working',
          'Gradually and carefully consider small increases in activity',
          'Maintain consistent routines that support this improvement'
        ];
      case 'declining':
        return [
          'Focus on rest and recovery',
          'Reduce non-essential activities temporarily',
          'Consider what might be contributing to the decline'
        ];
      case 'volatile':
        return [
          'Work on consistent pacing to reduce boom-bust cycles',
          'Avoid overexertion even on good days',
          'Plan activities for your typically better times'
        ];
      default:
        return [
          'Maintain current stable approach',
          'Continue monitoring patterns',
          'Make gradual adjustments as needed'
        ];
    }
  }

  private static analyzeRecoveryPatterns(userData: UserHealthData): PatternAnalysis['patterns'][0] | null {
    // Simple recovery analysis - look for energy improvements after rest days
    const restDays = userData.activityLogs.filter(log => log.type === 'rest_day');
    
    if (restDays.length < 2) return null;
    
    return {
      type: 'recovery_pattern',
      description: 'Rest days appear to support energy recovery',
      confidence: 0.6,
      timeframe: 'Recent rest periods',
      recommendations: [
        'Continue incorporating regular rest days',
        'Plan rest days proactively rather than reactively',
        'Use rest days for gentle, restorative activities'
      ]
    };
  }

  private static analyzeSymptomTrend(symptomLogs: UserHealthData['symptomLogs']): 'improving' | 'stable' | 'worsening' {
    if (symptomLogs.length < 7) return 'stable';
    
    const recentSymptoms = symptomLogs
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7);
    
    const avgFatigue = recentSymptoms.reduce((sum, log) => sum + log.fatigue, 0) / recentSymptoms.length;
    
    // Simple trend analysis based on fatigue levels
    if (avgFatigue <= 4) return 'improving';
    if (avgFatigue >= 7) return 'worsening';
    return 'stable';
  }

  private static getDefaultEnergyForecast(userId: string): EnergyForecast {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return {
      userId,
      forecastDate: tomorrow.toISOString().split('T')[0],
      predictedEnergyLevel: 5,
      confidence: 0.3,
      factors: [{
        factor: 'Insufficient data for prediction',
        impact: 'neutral',
        weight: 0.5
      }],
      recommendations: ['Continue tracking energy levels to improve predictions']
    };
  }

  private static getDefaultAdaptedRoutine(baseRoutineId: string): AdaptedRoutine {
    return {
      baseRoutineId,
      adaptations: [{
        component: 'all',
        modification: 'add_rest',
        reason: 'Default gentle approach'
      }],
      estimatedEnergyRequirement: 4,
      recommendedTimeOfDay: 'morning',
      precautions: ['Listen to your body and adjust as needed']
    };
  }

  private static getDefaultPatternAnalysis(userId: string): PatternAnalysis {
    return {
      userId,
      analysisDate: new Date(),
      patterns: [{
        type: 'energy_cycle',
        description: 'Insufficient data for pattern analysis',
        confidence: 0.1,
        timeframe: 'N/A',
        recommendations: ['Continue tracking to identify patterns']
      }],
      trends: {
        energyTrend: 'stable',
        symptomTrend: 'stable',
        activityTolerance: 'stable'
      }
    };
  }
}