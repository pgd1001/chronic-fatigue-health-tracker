import { describe, it, expect } from 'vitest';

// Test the movement adaptation logic
describe('Movement Session Adaptations', () => {
  // Mock the adaptation functions that would be in the component
  const getSessionRecommendations = (
    energyLevel: number, 
    previousSessionData?: { postSessionFatigue?: number; completed: boolean }
  ) => {
    const recommendations = {
      sessionType: 'full_routine' as const,
      modifications: [] as string[],
      intensityReduction: 0,
    };

    // Energy-based scaling
    if (energyLevel <= 3) {
      recommendations.sessionType = 'breathing_only';
      recommendations.modifications.push('Focus on breathing exercises only');
      recommendations.intensityReduction = 0.8;
    } else if (energyLevel <= 5) {
      recommendations.sessionType = 'quick_mobility';
      recommendations.modifications.push('Reduced session duration');
      recommendations.modifications.push('Gentler exercises with more rest');
      recommendations.intensityReduction = 0.5;
    } else if (energyLevel <= 7) {
      recommendations.modifications.push('Standard session with optional modifications');
      recommendations.intensityReduction = 0.2;
    }

    // Previous session impact
    if (previousSessionData?.postSessionFatigue && previousSessionData.postSessionFatigue > 6) {
      recommendations.modifications.push('Previous session caused fatigue - reducing intensity');
      recommendations.intensityReduction = Math.max(recommendations.intensityReduction, 0.4);
      
      if (recommendations.sessionType === 'full_routine') {
        recommendations.sessionType = 'quick_mobility';
      }
    }

    if (previousSessionData && !previousSessionData.completed) {
      recommendations.modifications.push('Previous session was incomplete - consider shorter phases');
      recommendations.intensityReduction = Math.max(recommendations.intensityReduction, 0.3);
    }

    return recommendations;
  };

  const getPostSessionRecommendations = (assessment: {
    fatigue: number;
    breath: number;
    stability: number;
    mood: number;
  }) => {
    const recommendations: string[] = [];
    
    if (assessment.fatigue > 6) {
      recommendations.push('High fatigue detected - consider reducing intensity or duration for next session');
      recommendations.push('Focus on rest and gentle activities for the remainder of the day');
    } else if (assessment.fatigue < 4) {
      recommendations.push('Great! You handled this session well - you might be able to maintain or slightly increase activity');
    }
    
    if (assessment.breath < 5) {
      recommendations.push('Breathing difficulty noted - ensure adequate rest between exercises next time');
      recommendations.push('Consider focusing more on breathing exercises in future sessions');
    }
    
    if (assessment.stability < 5) {
      recommendations.push('Balance concerns noted - include more stability exercises in warmup');
      recommendations.push('Consider using support (chair/wall) for all standing exercises');
    }
    
    if (assessment.mood > 7) {
      recommendations.push('Excellent mood improvement! Movement is having a positive effect');
    }
    
    // Overall session assessment
    const avgPostScore = (assessment.fatigue + assessment.breath + assessment.stability) / 3;
    if (avgPostScore > 6) {
      recommendations.push('Session may have been too challenging - consider gentler approach next time');
    } else if (avgPostScore < 4) {
      recommendations.push('Session went well - you can maintain this level of activity');
    }
    
    return recommendations;
  };

  describe('Session Recommendations Based on Energy Level', () => {
    it('recommends breathing only for very low energy (≤3)', () => {
      const recommendations = getSessionRecommendations(2);
      
      expect(recommendations.sessionType).toBe('breathing_only');
      expect(recommendations.modifications).toContain('Focus on breathing exercises only');
      expect(recommendations.intensityReduction).toBe(0.8);
    });

    it('recommends quick mobility for low energy (4-5)', () => {
      const recommendations = getSessionRecommendations(4);
      
      expect(recommendations.sessionType).toBe('quick_mobility');
      expect(recommendations.modifications).toContain('Reduced session duration');
      expect(recommendations.modifications).toContain('Gentler exercises with more rest');
      expect(recommendations.intensityReduction).toBe(0.5);
    });

    it('allows standard session for moderate energy (6-7)', () => {
      const recommendations = getSessionRecommendations(6);
      
      expect(recommendations.sessionType).toBe('full_routine');
      expect(recommendations.modifications).toContain('Standard session with optional modifications');
      expect(recommendations.intensityReduction).toBe(0.2);
    });

    it('allows full routine for high energy (≥8)', () => {
      const recommendations = getSessionRecommendations(8);
      
      expect(recommendations.sessionType).toBe('full_routine');
      expect(recommendations.intensityReduction).toBe(0);
    });
  });

  describe('Session Recommendations Based on Previous Session', () => {
    it('reduces intensity when previous session caused high fatigue', () => {
      const previousData = { postSessionFatigue: 8, completed: true };
      const recommendations = getSessionRecommendations(6, previousData);
      
      expect(recommendations.modifications).toContain('Previous session caused fatigue - reducing intensity');
      expect(recommendations.intensityReduction).toBeGreaterThanOrEqual(0.4);
      expect(recommendations.sessionType).toBe('quick_mobility');
    });

    it('adjusts when previous session was incomplete', () => {
      const previousData = { postSessionFatigue: 5, completed: false };
      const recommendations = getSessionRecommendations(6, previousData);
      
      expect(recommendations.modifications).toContain('Previous session was incomplete - consider shorter phases');
      expect(recommendations.intensityReduction).toBeGreaterThanOrEqual(0.3);
    });

    it('combines energy and previous session factors', () => {
      const previousData = { postSessionFatigue: 7, completed: false };
      const recommendations = getSessionRecommendations(4, previousData);
      
      expect(recommendations.sessionType).toBe('quick_mobility');
      expect(recommendations.intensityReduction).toBe(0.5); // Max of 0.5 (energy) and 0.4 (fatigue)
      expect(recommendations.modifications.length).toBeGreaterThan(2);
    });
  });

  describe('Post-Session Recommendations', () => {
    it('provides fatigue-based recommendations', () => {
      const highFatigueAssessment = { fatigue: 8, breath: 5, stability: 5, mood: 5 };
      const recommendations = getPostSessionRecommendations(highFatigueAssessment);
      
      expect(recommendations).toContain('High fatigue detected - consider reducing intensity or duration for next session');
      expect(recommendations).toContain('Focus on rest and gentle activities for the remainder of the day');
    });

    it('provides positive feedback for low fatigue', () => {
      const lowFatigueAssessment = { fatigue: 3, breath: 6, stability: 6, mood: 6 };
      const recommendations = getPostSessionRecommendations(lowFatigueAssessment);
      
      expect(recommendations).toContain('Great! You handled this session well - you might be able to maintain or slightly increase activity');
    });

    it('provides breathing-specific recommendations', () => {
      const breathingIssueAssessment = { fatigue: 5, breath: 3, stability: 6, mood: 5 };
      const recommendations = getPostSessionRecommendations(breathingIssueAssessment);
      
      expect(recommendations).toContain('Breathing difficulty noted - ensure adequate rest between exercises next time');
      expect(recommendations).toContain('Consider focusing more on breathing exercises in future sessions');
    });

    it('provides stability-specific recommendations', () => {
      const stabilityIssueAssessment = { fatigue: 5, breath: 6, stability: 3, mood: 5 };
      const recommendations = getPostSessionRecommendations(stabilityIssueAssessment);
      
      expect(recommendations).toContain('Balance concerns noted - include more stability exercises in warmup');
      expect(recommendations).toContain('Consider using support (chair/wall) for all standing exercises');
    });

    it('recognizes mood improvements', () => {
      const goodMoodAssessment = { fatigue: 5, breath: 6, stability: 6, mood: 8 };
      const recommendations = getPostSessionRecommendations(goodMoodAssessment);
      
      expect(recommendations).toContain('Excellent mood improvement! Movement is having a positive effect');
    });

    it('provides overall session assessment', () => {
      const challengingSessionAssessment = { fatigue: 7, breath: 7, stability: 6, mood: 5 };
      const recommendations = getPostSessionRecommendations(challengingSessionAssessment);
      
      expect(recommendations).toContain('Session may have been too challenging - consider gentler approach next time');
    });

    it('provides positive overall assessment', () => {
      const goodSessionAssessment = { fatigue: 3, breath: 4, stability: 3, mood: 6 };
      const recommendations = getPostSessionRecommendations(goodSessionAssessment);
      
      expect(recommendations).toContain('Session went well - you can maintain this level of activity');
    });
  });

  describe('Exercise Scaling Logic', () => {
    const scaleExercise = (baseValue: number, scalingFactor: number, minimum: number = 1) => {
      return Math.max(minimum, Math.round(baseValue * scalingFactor));
    };

    it('scales exercise duration correctly', () => {
      const baseDuration = 120; // 2 minutes
      const scalingFactor = 0.5; // 50% reduction
      
      const scaledDuration = scaleExercise(baseDuration, scalingFactor, 30);
      expect(scaledDuration).toBe(60); // 1 minute
    });

    it('scales exercise repetitions correctly', () => {
      const baseReps = 10;
      const scalingFactor = 0.3; // 70% reduction
      
      const scaledReps = scaleExercise(baseReps, scalingFactor, 2);
      expect(scaledReps).toBe(3);
    });

    it('respects minimum values', () => {
      const baseValue = 5;
      const scalingFactor = 0.1; // 90% reduction
      
      const scaledValue = scaleExercise(baseValue, scalingFactor, 2);
      expect(scaledValue).toBe(2); // Should not go below minimum
    });

    it('handles zero scaling factor', () => {
      const baseValue = 10;
      const scalingFactor = 0;
      
      const scaledValue = scaleExercise(baseValue, scalingFactor, 1);
      expect(scaledValue).toBe(1); // Should use minimum
    });
  });

  describe('Session Type Adaptations', () => {
    it('adapts full routine to quick mobility when needed', () => {
      const previousData = { postSessionFatigue: 8, completed: true };
      const recommendations = getSessionRecommendations(6, previousData);
      
      expect(recommendations.sessionType).toBe('quick_mobility');
    });

    it('maintains breathing only for very low energy regardless of previous session', () => {
      const previousData = { postSessionFatigue: 3, completed: true };
      const recommendations = getSessionRecommendations(2, previousData);
      
      expect(recommendations.sessionType).toBe('breathing_only');
    });

    it('escalates intensity reduction when multiple factors combine', () => {
      const previousData = { postSessionFatigue: 7, completed: false };
      const recommendations = getSessionRecommendations(4, previousData);
      
      // Should take the maximum of energy-based (0.5) and fatigue-based (0.4) reductions
      expect(recommendations.intensityReduction).toBe(0.5);
    });
  });

  describe('Chronic Fatigue Specific Adaptations', () => {
    it('prioritizes safety over progression', () => {
      // Even with moderate energy, if previous session caused issues, be conservative
      const previousData = { postSessionFatigue: 8, completed: false };
      const recommendations = getSessionRecommendations(7, previousData);
      
      expect(recommendations.sessionType).toBe('quick_mobility');
      expect(recommendations.intensityReduction).toBeGreaterThanOrEqual(0.4);
    });

    it('provides conservative recommendations for post-exertional malaise prevention', () => {
      const assessment = { fatigue: 7, breath: 7, stability: 6, mood: 5 };
      const recommendations = getPostSessionRecommendations(assessment);
      
      expect(recommendations).toContain('Session may have been too challenging - consider gentler approach next time');
    });

    it('encourages rest when multiple symptoms are elevated', () => {
      const assessment = { fatigue: 7, breath: 4, stability: 4, mood: 4 };
      const recommendations = getPostSessionRecommendations(assessment);
      
      expect(recommendations.length).toBeGreaterThan(3); // Multiple recommendations
      expect(recommendations.some(r => r.includes('rest'))).toBe(true);
    });
  });
});