'use client';

import React, { useState, useEffect } from 'react';
import { MovementSession } from '@/components/health/movement-session';
import { MovementDashboard } from '@/components/health/movement-dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, TrendingUp, Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

// Mock data for demonstration - in real app this would come from API
const mockMovementData = [
  {
    id: '1',
    date: '2024-01-15T10:30:00',
    sessionType: 'full_routine',
    duration: 1140, // 19 minutes
    completed: true,
    completionPercentage: 100,
    preSessionEnergy: 6,
    postSessionFatigue: 4,
    postSessionBreath: 7,
    postSessionStability: 6,
    intensity: 3,
    phasesCompleted: 4,
    totalPhases: 4,
  },
  {
    id: '2',
    date: '2024-01-13T09:15:00',
    sessionType: 'quick_mobility',
    duration: 480, // 8 minutes
    completed: true,
    completionPercentage: 100,
    preSessionEnergy: 4,
    postSessionFatigue: 3,
    postSessionBreath: 6,
    postSessionStability: 5,
    intensity: 2,
    phasesCompleted: 2,
    totalPhases: 2,
  },
  {
    id: '3',
    date: '2024-01-11T16:45:00',
    sessionType: 'full_routine',
    duration: 900, // 15 minutes
    completed: false,
    completionPercentage: 75,
    preSessionEnergy: 5,
    postSessionFatigue: 6,
    postSessionBreath: 5,
    postSessionStability: 4,
    intensity: 4,
    phasesCompleted: 3,
    totalPhases: 4,
    adaptations: 'Skipped resistance phase due to fatigue',
  },
  {
    id: '4',
    date: '2024-01-09T11:20:00',
    sessionType: 'breathing_only',
    duration: 300, // 5 minutes
    completed: true,
    completionPercentage: 100,
    preSessionEnergy: 3,
    postSessionFatigue: 2,
    postSessionBreath: 8,
    postSessionStability: 4,
    intensity: 1,
    phasesCompleted: 1,
    totalPhases: 1,
  },
];

const mockMovementStats = {
  totalSessions: 12,
  completedSessions: 9,
  completionRate: 75,
  averageIntensity: 2.8,
  averageDuration: 720, // 12 minutes
  totalExerciseTime: 144, // 2.4 hours
  trend: 'stable' as const,
  lastSessionDate: '2024-01-15',
};

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
  exercises: any[];
  completed: boolean;
  duration: number;
  skipped: boolean;
  adaptations?: string;
}

export default function MovementPage() {
  const [currentTab, setCurrentTab] = useState('session');
  const [userEnergyLevel, setUserEnergyLevel] = useState(6);
  const [movementData, setMovementData] = useState(mockMovementData);
  const [movementStats, setMovementStats] = useState(mockMovementStats);
  const [lastSession, setLastSession] = useState<MovementSessionData | null>(null);
  const [canStartSession, setCanStartSession] = useState(true);

  // Check if user can start a new session based on energy and recent activity
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaysSessions = movementData.filter(session => 
      session.date.startsWith(today)
    );
    
    // Limit to 1 session per day for chronic fatigue management
    const hasSessionToday = todaysSessions.length > 0;
    const energyTooLow = userEnergyLevel < 3;
    
    setCanStartSession(!hasSessionToday && !energyTooLow);
  }, [movementData, userEnergyLevel]);

  const handleSessionComplete = (sessionData: MovementSessionData) => {
    console.log('Movement session completed:', sessionData);
    
    // In real app, this would save to API
    const newSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      sessionType: sessionData.sessionType,
      duration: sessionData.duration,
      completed: sessionData.completed,
      completionPercentage: sessionData.completed ? 100 : 
        (Object.values(sessionData.phases).filter(p => p.completed).length / 4) * 100,
      preSessionEnergy: sessionData.preSessionEnergy,
      postSessionFatigue: sessionData.postSessionFatigue,
      postSessionBreath: sessionData.postSessionBreath,
      postSessionStability: sessionData.postSessionStability,
      intensity: Math.round(Math.random() * 3) + 2, // Mock intensity calculation
      phasesCompleted: Object.values(sessionData.phases).filter(p => p.completed).length,
      totalPhases: 4,
      adaptations: sessionData.adaptations,
    };
    
    setMovementData(prev => [newSession, ...prev]);
    setLastSession(sessionData);
    
    // Update stats
    setMovementStats(prev => ({
      ...prev,
      totalSessions: prev.totalSessions + 1,
      completedSessions: sessionData.completed ? prev.completedSessions + 1 : prev.completedSessions,
      completionRate: Math.round(((sessionData.completed ? prev.completedSessions + 1 : prev.completedSessions) / (prev.totalSessions + 1)) * 100),
      totalExerciseTime: prev.totalExerciseTime + Math.round(sessionData.duration / 60),
      lastSessionDate: new Date().toISOString().split('T')[0],
    }));
    
    // Switch to dashboard to show results
    setCurrentTab('dashboard');
  };

  const handleSessionUpdate = (sessionData: Partial<MovementSessionData>) => {
    console.log('Session updated:', sessionData);
    // In real app, this would update the session in progress
  };

  const handleExportData = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      sessions: movementData,
      stats: movementStats,
      summary: {
        totalSessions: movementStats.totalSessions,
        completionRate: movementStats.completionRate,
        averageIntensity: movementStats.averageIntensity,
        totalExerciseTime: movementStats.totalExerciseTime,
      }
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movement-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Movement Sessions</h1>
          {lastSession && (
            <Badge className="bg-green-100 text-green-800">
              Last session: {lastSession.completed ? 'Completed' : 'Partial'}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-lg">
          Gentle 4-phase movement routines designed for chronic fatigue management
        </p>
      </div>

      {/* Energy Level Selector */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Current Energy Level</CardTitle>
          <CardDescription>
            Help us adapt your movement session to your current energy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Energy Level: {userEnergyLevel}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={userEnergyLevel}
                onChange={(e) => setUserEnergyLevel(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Very Low</span>
                <span>Moderate</span>
                <span>High</span>
              </div>
            </div>
            
            {userEnergyLevel < 3 && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">
                    Your energy is very low. Consider resting today or doing only gentle breathing exercises.
                  </p>
                </div>
              </div>
            )}
            
            {userEnergyLevel >= 3 && userEnergyLevel <= 5 && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Moderate energy detected. Sessions will be adapted with gentler exercises and shorter durations.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-blue-600">3</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Sessions completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion</p>
                <p className="text-2xl font-bold text-green-600">{movementStats.completionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last Session</p>
                <p className="text-2xl font-bold text-purple-600">
                  {movementStats.lastSessionDate ? '2d' : '--'}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Days ago</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Time</p>
                <p className="text-2xl font-bold text-orange-600">{movementStats.totalExerciseTime}m</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Exercise minutes</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="session" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            New Session
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Progress & History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="session" className="mt-6">
          {canStartSession ? (
            <MovementSession
              userId="mock-user-id"
              userEnergyLevel={userEnergyLevel}
              onSessionComplete={handleSessionComplete}
              onSessionUpdate={handleSessionUpdate}
              previousSessionData={
                movementData.length > 0 
                  ? {
                      postSessionFatigue: movementData[0].postSessionFatigue,
                      completed: movementData[0].completed
                    }
                  : undefined
              }
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Session Not Available</h3>
                <p className="text-muted-foreground mb-4">
                  {userEnergyLevel < 3 
                    ? 'Your energy level is too low for a movement session today. Focus on rest and gentle breathing.'
                    : 'You\'ve already completed a session today. Rest and recovery are just as important as movement.'
                  }
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentTab('dashboard')}
                >
                  View Your Progress
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <MovementDashboard
            movementData={movementData}
            movementStats={movementStats}
            onExportData={handleExportData}
          />
        </TabsContent>
      </Tabs>

      {/* Educational Content */}
      <Card className="mt-8 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Activity className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 mb-1">
                Movement for Chronic Fatigue
              </p>
              <p className="text-sm text-blue-800">
                Our 4-phase movement sessions are specifically designed for people with ME/CFS and Long COVID. 
                Each session adapts to your energy level and includes gentle warm-up, light resistance, 
                coordinated flow, and relaxing cool-down phases. The goal is maintaining function and 
                preventing deconditioning without triggering post-exertional malaise (PEM).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}