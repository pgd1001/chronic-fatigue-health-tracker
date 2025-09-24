'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  SkipForward, 
  CheckCircle2, 
  Activity, 
  Heart,
  Wind,
  Zap,
  Clock,
  AlertTriangle,
  Info
} from 'lucide-react';
import type { Exercise, MovementSession } from '@/lib/types/movement.types';

interface MovementSessionProps {
  userId: string;
  userEnergyLevel: number;
  onSessionComplete: (sessionData: MovementSessionData) => void;
  onSessionUpdate?: (sessionData: Partial<MovementSessionData>) => void;
  previousSessionData?: { postSessionFatigue?: number; completed: boolean };
  className?: string;
}

interface MovementSessionData {
  sessionType: 'full_routine' | 'quick_mobility' | 'breathing_only' | 'custom';
  preSessionEnergy: number;
  preSessionPain?: number;
  preSessionMood?: number;
  phases: {
    warmup: PhaseData;
    resistance: PhaseData;
    flow: PhaseData;
    cooldown: PhaseData;
  };
  postSessionFatigue?: number;
  postSessionBreath?: number;
  postSessionStability?: number;
  postSessionMood?: number;
  adaptations?: string;
  completed: boolean;
  duration: number;
}

interface PhaseData {
  exercises: Exercise[];
  completed: boolean;
  duration: number;
  skipped: boolean;
  adaptations?: string;
}

interface ExerciseLibrary {
  warmup: Exercise[];
  resistance: Exercise[];
  flow: Exercise[];
  cooldown: Exercise[];
}

const PHASE_DURATIONS = {
  warmup: 4 * 60, // 4 minutes
  resistance: 8 * 60, // 8 minutes
  flow: 4 * 60, // 3-5 minutes (average 4)
  cooldown: 3 * 60, // 3 minutes
};

const PHASE_LABELS = {
  warmup: 'Warm-up',
  resistance: 'Light Resistance',
  flow: 'Integrated Flow',
  cooldown: 'Cool Down',
};

const PHASE_DESCRIPTIONS = {
  warmup: 'Gentle movements to prepare your body',
  resistance: 'Light strengthening exercises',
  flow: 'Coordinated movement patterns',
  cooldown: 'Relaxing stretches and breathing',
};

// Automatic session scaling based on energy and previous session data
const getSessionRecommendations = (
  energyLevel: number, 
  previousSessionData?: { postSessionFatigue?: number; completed: boolean }
): {
  sessionType: 'full_routine' | 'quick_mobility' | 'breathing_only' | 'custom';
  modifications: string[];
  intensityReduction: number; // 0-1 scale
} => {
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

// Exercise library based on energy levels and chronic fatigue considerations
const createExerciseLibrary = (
  energyLevel: number, 
  intensityReduction: number = 0
): ExerciseLibrary => {
  const isLowEnergy = energyLevel <= 4;
  const isModerateEnergy = energyLevel >= 5 && energyLevel <= 7;
  const scalingFactor = 1 - intensityReduction;
  
  return {
    warmup: [
      {
        name: 'Gentle Neck Rolls',
        category: 'mobility',
        duration: 60,
        intensity: isLowEnergy ? 1 : 2,
        notes: 'Slow, controlled movements',
        completed: false,
      },
      {
        name: 'Shoulder Shrugs',
        category: 'mobility',
        duration: 45,
        intensity: isLowEnergy ? 1 : 2,
        notes: 'Release tension gently',
        completed: false,
      },
      {
        name: 'Arm Circles',
        category: 'mobility',
        duration: 60,
        intensity: isLowEnergy ? 1 : 2,
        notes: 'Small, controlled circles',
        completed: false,
      },
      {
        name: 'Gentle Marching',
        category: 'mobility',
        duration: Math.round((isLowEnergy ? 90 : 120) * scalingFactor),
        intensity: Math.max(1, Math.round((isLowEnergy ? 2 : 3) * scalingFactor)),
        notes: 'Lift knees gently, seated option available',
        completed: false,
      },
    ],
    resistance: [
      {
        name: 'Wall Push-ups',
        category: 'resistance',
        repetitions: Math.max(3, Math.round((isLowEnergy ? 5 : isModerateEnergy ? 8 : 12) * scalingFactor)),
        sets: 1,
        intensity: Math.max(1, Math.round((isLowEnergy ? 2 : 3) * scalingFactor)),
        notes: 'Use wall for support, adjust distance as needed',
        completed: false,
      },
      {
        name: 'Seated Leg Extensions',
        category: 'resistance',
        repetitions: Math.max(4, Math.round((isLowEnergy ? 6 : isModerateEnergy ? 10 : 15) * scalingFactor)),
        sets: 1,
        intensity: Math.max(1, Math.round((isLowEnergy ? 2 : 3) * scalingFactor)),
        notes: 'Slow, controlled movements',
        completed: false,
      },
      {
        name: 'Arm Raises',
        category: 'resistance',
        repetitions: Math.max(5, Math.round((isLowEnergy ? 8 : isModerateEnergy ? 12 : 16) * scalingFactor)),
        sets: 1,
        intensity: Math.max(1, Math.round((isLowEnergy ? 1 : 2) * scalingFactor)),
        notes: 'Light weights optional, focus on form',
        completed: false,
      },
      {
        name: 'Gentle Squats',
        category: 'resistance',
        repetitions: Math.max(2, Math.round((isLowEnergy ? 4 : isModerateEnergy ? 8 : 12) * scalingFactor)),
        sets: 1,
        intensity: Math.max(1, Math.round((isLowEnergy ? 3 : 4) * scalingFactor)),
        notes: 'Use chair for support if needed',
        completed: false,
      },
    ],
    flow: [
      {
        name: 'Tai Chi Movements',
        category: 'coordination',
        duration: Math.round((isLowEnergy ? 90 : 120) * scalingFactor),
        intensity: Math.max(1, Math.round((isLowEnergy ? 2 : 3) * scalingFactor)),
        notes: 'Slow, flowing movements',
        completed: false,
      },
      {
        name: 'Balance Practice',
        category: 'balance',
        duration: Math.round(60 * scalingFactor),
        intensity: Math.max(1, Math.round((isLowEnergy ? 2 : 3) * scalingFactor)),
        notes: 'Hold onto chair if needed',
        completed: false,
      },
      {
        name: 'Coordinated Breathing',
        category: 'breathing',
        duration: Math.round(90 * scalingFactor),
        intensity: 1,
        notes: 'Match breath to gentle movements',
        completed: false,
      },
    ],
    cooldown: [
      {
        name: 'Gentle Stretching',
        category: 'stretching',
        duration: Math.round(120 * scalingFactor),
        intensity: 1,
        notes: 'Hold stretches gently, no forcing',
        completed: false,
      },
      {
        name: 'Deep Breathing',
        category: 'breathing',
        duration: Math.round(60 * scalingFactor),
        intensity: 1,
        notes: 'Focus on slow, deep breaths',
        completed: false,
      },
    ],
  };
};

export function MovementSession({ 
  userId, 
  userEnergyLevel, 
  onSessionComplete, 
  onSessionUpdate,
  previousSessionData,
  className 
}: MovementSessionProps) {
  const [currentPhase, setCurrentPhase] = useState<keyof typeof PHASE_DURATIONS>('warmup');
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [phaseTime, setPhaseTime] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  
  const [preSessionAssessment, setPreSessionAssessment] = useState({
    energy: userEnergyLevel,
    pain: 5,
    mood: 5,
  });
  
  const [postSessionAssessment, setPostSessionAssessment] = useState({
    fatigue: 5,
    breath: 5,
    stability: 5,
    mood: 5,
  });
  
  const [sessionRecommendations] = useState(() => 
    getSessionRecommendations(userEnergyLevel, previousSessionData)
  );
  
  const [exerciseLibrary] = useState<ExerciseLibrary>(() => 
    createExerciseLibrary(userEnergyLevel, sessionRecommendations.intensityReduction)
  );
  
  const [sessionData, setSessionData] = useState<MovementSessionData>({
    sessionType: sessionRecommendations.sessionType,
    preSessionEnergy: userEnergyLevel,
    phases: {
      warmup: { exercises: exerciseLibrary.warmup, completed: false, duration: 0, skipped: false },
      resistance: { exercises: exerciseLibrary.resistance, completed: false, duration: 0, skipped: false },
      flow: { exercises: exerciseLibrary.flow, completed: false, duration: 0, skipped: false },
      cooldown: { exercises: exerciseLibrary.cooldown, completed: false, duration: 0, skipped: false },
    },
    completed: false,
    duration: 0,
    adaptations: sessionRecommendations.modifications.join('; '),
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && !isPaused && sessionStarted && !sessionCompleted) {
      interval = setInterval(() => {
        setPhaseTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isActive, isPaused, sessionStarted, sessionCompleted]);

  // Auto-advance phase when time is up
  useEffect(() => {
    const phaseDuration = PHASE_DURATIONS[currentPhase];
    if (phaseTime >= phaseDuration && isActive) {
      handlePhaseComplete();
    }
  }, [phaseTime, currentPhase, isActive]);

  const startSession = useCallback(() => {
    setSessionStarted(true);
    setIsActive(true);
    setPhaseTime(0);
    
    const updatedSessionData = {
      ...sessionData,
      preSessionEnergy: preSessionAssessment.energy,
      preSessionPain: preSessionAssessment.pain,
      preSessionMood: preSessionAssessment.mood,
    };
    
    setSessionData(updatedSessionData);
    onSessionUpdate?.(updatedSessionData);
  }, [sessionData, preSessionAssessment, onSessionUpdate]);

  const pauseSession = useCallback(() => {
    setIsPaused(!isPaused);
  }, [isPaused]);

  const handlePhaseComplete = useCallback(() => {
    const phases = Object.keys(PHASE_DURATIONS) as Array<keyof typeof PHASE_DURATIONS>;
    const currentIndex = phases.indexOf(currentPhase);
    
    // Mark current phase as completed
    const updatedSessionData = {
      ...sessionData,
      phases: {
        ...sessionData.phases,
        [currentPhase]: {
          ...sessionData.phases[currentPhase],
          completed: true,
          duration: phaseTime,
        },
      },
    };
    
    setSessionData(updatedSessionData);
    
    if (currentIndex < phases.length - 1) {
      // Move to next phase
      const nextPhase = phases[currentIndex + 1];
      setCurrentPhase(nextPhase);
      setPhaseTime(0);
    } else {
      // Session complete
      completeSession(updatedSessionData);
    }
    
    onSessionUpdate?.(updatedSessionData);
  }, [currentPhase, phaseTime, sessionData, onSessionUpdate]);

  const skipPhase = useCallback(() => {
    const updatedSessionData = {
      ...sessionData,
      phases: {
        ...sessionData.phases,
        [currentPhase]: {
          ...sessionData.phases[currentPhase],
          completed: true,
          skipped: true,
          duration: phaseTime,
        },
      },
    };
    
    setSessionData(updatedSessionData);
    handlePhaseComplete();
  }, [currentPhase, phaseTime, sessionData, handlePhaseComplete]);

  const completeSession = useCallback((finalSessionData: MovementSessionData) => {
    setIsActive(false);
    setSessionCompleted(true);
    
    const completedSessionData = {
      ...finalSessionData,
      completed: true,
      duration: Object.values(finalSessionData.phases).reduce((sum, phase) => sum + phase.duration, 0),
      postSessionFatigue: postSessionAssessment.fatigue,
      postSessionBreath: postSessionAssessment.breath,
      postSessionStability: postSessionAssessment.stability,
      postSessionMood: postSessionAssessment.mood,
    };
    
    onSessionComplete(completedSessionData);
  }, [postSessionAssessment, onSessionComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseProgress = (): number => {
    const phaseDuration = PHASE_DURATIONS[currentPhase];
    return Math.min((phaseTime / phaseDuration) * 100, 100);
  };

  const getOverallProgress = (): number => {
    const phases = Object.keys(PHASE_DURATIONS) as Array<keyof typeof PHASE_DURATIONS>;
    const currentIndex = phases.indexOf(currentPhase);
    const phaseProgress = getPhaseProgress();
    
    return ((currentIndex * 100) + phaseProgress) / phases.length;
  };

  const shouldShowEnergyWarning = (): boolean => {
    return userEnergyLevel <= 4;
  };

  const getPostSessionRecommendations = (): string[] => {
    const recommendations: string[] = [];
    
    if (postSessionAssessment.fatigue > 6) {
      recommendations.push('High fatigue detected - consider reducing intensity or duration for next session');
      recommendations.push('Focus on rest and gentle activities for the remainder of the day');
    } else if (postSessionAssessment.fatigue < 4) {
      recommendations.push('Great! You handled this session well - you might be able to maintain or slightly increase activity');
    }
    
    if (postSessionAssessment.breath < 5) {
      recommendations.push('Breathing difficulty noted - ensure adequate rest between exercises next time');
      recommendations.push('Consider focusing more on breathing exercises in future sessions');
    }
    
    if (postSessionAssessment.stability < 5) {
      recommendations.push('Balance concerns noted - include more stability exercises in warmup');
      recommendations.push('Consider using support (chair/wall) for all standing exercises');
    }
    
    if (postSessionAssessment.mood > 7) {
      recommendations.push('Excellent mood improvement! Movement is having a positive effect');
    }
    
    // Overall session assessment
    const avgPostScore = (postSessionAssessment.fatigue + postSessionAssessment.breath + postSessionAssessment.stability) / 3;
    if (avgPostScore > 6) {
      recommendations.push('Session may have been too challenging - consider gentler approach next time');
    } else if (avgPostScore < 4) {
      recommendations.push('Session went well - you can maintain this level of activity');
    }
    
    return recommendations;
  };

  if (!sessionStarted) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Movement Session
          </CardTitle>
          <CardDescription>
            Gentle 4-phase movement routine adapted to your energy level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Energy Warning */}
            {shouldShowEnergyWarning() && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">Low Energy Detected</p>
                    <p className="text-sm text-amber-800">
                      Your energy level is {userEnergyLevel}/10. This session has been adapted with 
                      gentler exercises and shorter durations. Listen to your body and stop if needed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Session Recommendations */}
            {sessionRecommendations.modifications.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Session Adaptations</p>
                    <ul className="text-sm text-blue-800 mt-1 space-y-1">
                      {sessionRecommendations.modifications.map((modification, index) => (
                        <li key={index}>• {modification}</li>
                      ))}
                    </ul>
                    {sessionRecommendations.intensityReduction > 0 && (
                      <p className="text-sm text-blue-800 mt-2">
                        Intensity reduced by {Math.round(sessionRecommendations.intensityReduction * 100)}% 
                        based on your current state.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Pre-Session Assessment */}
            <div className="space-y-4">
              <h3 className="font-medium">Pre-Session Check-in</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Energy Level: {preSessionAssessment.energy}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={preSessionAssessment.energy}
                    onChange={(e) => setPreSessionAssessment(prev => ({
                      ...prev,
                      energy: parseInt(e.target.value)
                    }))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Pain Level: {preSessionAssessment.pain}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={preSessionAssessment.pain}
                    onChange={(e) => setPreSessionAssessment(prev => ({
                      ...prev,
                      pain: parseInt(e.target.value)
                    }))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mood: {preSessionAssessment.mood}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={preSessionAssessment.mood}
                    onChange={(e) => setPreSessionAssessment(prev => ({
                      ...prev,
                      mood: parseInt(e.target.value)
                    }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Session Overview */}
            <div className="space-y-3">
              <h3 className="font-medium">Session Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(PHASE_DURATIONS).map(([phase, duration]) => (
                  <div key={phase} className="p-3 border rounded-lg">
                    <p className="font-medium text-sm">{PHASE_LABELS[phase as keyof typeof PHASE_LABELS]}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(duration)}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Total estimated time: {formatTime(Object.values(PHASE_DURATIONS).reduce((sum, d) => sum + d, 0))}
              </p>
            </div>

            <Button onClick={startSession} className="w-full" size="lg">
              <Play className="h-4 w-4 mr-2" />
              Start Movement Session
            </Button>

            {/* Important Notes */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 mb-1">Important Reminders</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Stop immediately if you feel unwell or experience increased fatigue</li>
                    <li>• All exercises can be modified or skipped based on how you feel</li>
                    <li>• Focus on gentle movements and proper breathing</li>
                    <li>• This is about movement, not intensity</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessionCompleted) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Session Complete!
          </CardTitle>
          <CardDescription>
            Great job completing your movement session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Post-Session Assessment */}
            <div className="space-y-4">
              <h3 className="font-medium">Post-Session Self-Check</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Heart className="h-4 w-4 inline mr-1" />
                    Fatigue Level: {postSessionAssessment.fatigue}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={postSessionAssessment.fatigue}
                    onChange={(e) => setPostSessionAssessment(prev => ({
                      ...prev,
                      fatigue: parseInt(e.target.value)
                    }))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Wind className="h-4 w-4 inline mr-1" />
                    Breathing Ease: {postSessionAssessment.breath}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={postSessionAssessment.breath}
                    onChange={(e) => setPostSessionAssessment(prev => ({
                      ...prev,
                      breath: parseInt(e.target.value)
                    }))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Activity className="h-4 w-4 inline mr-1" />
                    Balance/Stability: {postSessionAssessment.stability}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={postSessionAssessment.stability}
                    onChange={(e) => setPostSessionAssessment(prev => ({
                      ...prev,
                      stability: parseInt(e.target.value)
                    }))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Zap className="h-4 w-4 inline mr-1" />
                    Mood: {postSessionAssessment.mood}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={postSessionAssessment.mood}
                    onChange={(e) => setPostSessionAssessment(prev => ({
                      ...prev,
                      mood: parseInt(e.target.value)
                    }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Session Summary */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">Session Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-700">Duration: {formatTime(sessionData.duration)}</p>
                  <p className="text-green-700">Phases Completed: {Object.values(sessionData.phases).filter(p => p.completed).length}/4</p>
                </div>
                <div>
                  <p className="text-green-700">Pre-Energy: {sessionData.preSessionEnergy}/10</p>
                  <p className="text-green-700">Post-Fatigue: {postSessionAssessment.fatigue}/10</p>
                </div>
              </div>
            </div>

            {/* Post-Session Recommendations */}
            {(postSessionAssessment.fatigue !== 5 || postSessionAssessment.breath !== 5 || postSessionAssessment.stability !== 5) && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 mb-2">Recommendations for Next Session</p>
                    <ul className="text-sm text-green-800 space-y-1">
                      {getPostSessionRecommendations().map((recommendation, index) => (
                        <li key={index}>• {recommendation}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={() => completeSession(sessionData)} 
              className="w-full" 
              size="lg"
            >
              Complete Session
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active session view
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              {PHASE_LABELS[currentPhase]}
            </CardTitle>
            <CardDescription>
              {PHASE_DESCRIPTIONS[currentPhase]}
            </CardDescription>
          </div>
          <Badge variant="outline">
            Phase {Object.keys(PHASE_DURATIONS).indexOf(currentPhase) + 1}/4
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Phase Progress</span>
              <span>{formatTime(phaseTime)} / {formatTime(PHASE_DURATIONS[currentPhase])}</span>
            </div>
            <Progress value={getPhaseProgress()} />
            
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(getOverallProgress())}%</span>
            </div>
            <Progress value={getOverallProgress()} />
          </div>

          {/* Current Exercises */}
          <div className="space-y-3">
            <h4 className="font-medium">Current Exercises</h4>
            <div className="space-y-2">
              {exerciseLibrary[currentPhase].map((exercise, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{exercise.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {exercise.duration ? `${exercise.duration}s` : 
                         exercise.repetitions ? `${exercise.repetitions} reps` : ''}
                        {exercise.sets && exercise.sets > 1 ? ` × ${exercise.sets} sets` : ''}
                      </p>
                      {exercise.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{exercise.notes}</p>
                      )}
                    </div>
                    <Badge variant={exercise.completed ? 'default' : 'outline'}>
                      {exercise.completed ? 'Done' : 'Active'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <Button 
              onClick={pauseSession} 
              variant="outline" 
              className="flex-1"
            >
              {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            
            <Button 
              onClick={skipPhase} 
              variant="outline"
              className="flex-1"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Skip Phase
            </Button>
            
            <Button 
              onClick={handlePhaseComplete} 
              className="flex-1"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Phase
            </Button>
          </div>

          {/* Timer Display */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-2xl font-mono">
              <Clock className="h-6 w-6" />
              {formatTime(phaseTime)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isPaused ? 'Paused' : 'Active'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}