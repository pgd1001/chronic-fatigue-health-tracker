'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  Clock,
  Heart,
  Wind,
  Zap,
  AlertTriangle,
  CheckCircle2,
  SkipForward,
  Download
} from 'lucide-react';
import { getIntensityLabel, getIntensityColor, getSessionTypeLabel } from '@/lib/types/movement.types';

interface MovementDashboardProps {
  movementData: MovementSessionSummary[];
  movementStats: MovementStats;
  onExportData?: () => void;
  className?: string;
}

interface MovementSessionSummary {
  id: string;
  date: string;
  sessionType: string;
  duration: number;
  completed: boolean;
  completionPercentage: number;
  preSessionEnergy: number;
  postSessionFatigue?: number;
  postSessionBreath?: number;
  postSessionStability?: number;
  intensity: number;
  phasesCompleted: number;
  totalPhases: number;
  adaptations?: string;
}

interface MovementStats {
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  averageIntensity: number;
  averageDuration: number;
  totalExerciseTime: number;
  trend: 'improving' | 'stable' | 'declining';
  lastSessionDate: string | null;
}

interface MovementInsight {
  type: 'positive' | 'neutral' | 'concern';
  title: string;
  description: string;
  recommendation?: string;
}

export function MovementDashboard({ 
  movementData, 
  movementStats, 
  onExportData, 
  className 
}: MovementDashboardProps) {
  
  // Generate insights based on movement data
  const generateInsights = (): MovementInsight[] => {
    const insights: MovementInsight[] = [];
    
    if (movementData.length === 0) {
      insights.push({
        type: 'neutral',
        title: 'Start Moving',
        description: 'Begin with gentle movement sessions to establish a routine.',
        recommendation: 'Start with a low-energy session to see how your body responds.'
      });
      return insights;
    }

    // Completion rate insights
    if (movementStats.completionRate >= 80) {
      insights.push({
        type: 'positive',
        title: 'Excellent Consistency',
        description: `You're completing ${movementStats.completionRate}% of your movement sessions.`
      });
    } else if (movementStats.completionRate < 50) {
      insights.push({
        type: 'concern',
        title: 'Low Completion Rate',
        description: `You're completing ${movementStats.completionRate}% of sessions.`,
        recommendation: 'Consider shorter sessions or gentler exercises that match your energy levels.'
      });
    }

    // Energy vs fatigue analysis
    const recentSessions = movementData.slice(-5);
    const energyFatigueCorrelation = recentSessions.filter(s => 
      s.postSessionFatigue !== undefined && s.preSessionEnergy !== undefined
    );

    if (energyFatigueCorrelation.length >= 3) {
      const avgEnergyIncrease = energyFatigueCorrelation.reduce((sum, session) => {
        const energyChange = session.preSessionEnergy - (session.postSessionFatigue || 5);
        return sum + energyChange;
      }, 0) / energyFatigueCorrelation.length;

      if (avgEnergyIncrease > 1) {
        insights.push({
          type: 'positive',
          title: 'Movement is Energizing',
          description: 'Your movement sessions are generally leaving you feeling more energized.',
          recommendation: 'Continue with your current routine - it seems to be working well for you.'
        });
      } else if (avgEnergyIncrease < -1) {
        insights.push({
          type: 'concern',
          title: 'Sessions May Be Too Intense',
          description: 'Your movement sessions seem to be increasing fatigue.',
          recommendation: 'Consider reducing intensity or duration, and focus on gentler movements.'
        });
      }
    }

    // Trend analysis
    if (movementStats.trend === 'improving') {
      insights.push({
        type: 'positive',
        title: 'Improving Trend',
        description: 'Your movement consistency and performance are improving over time.'
      });
    } else if (movementStats.trend === 'declining') {
      insights.push({
        type: 'concern',
        title: 'Declining Activity',
        description: 'Your movement activity has decreased recently.',
        recommendation: 'Consider if you need to adjust your routine or if other factors are affecting your energy.'
      });
    }

    // Intensity insights
    if (movementStats.averageIntensity > 6) {
      insights.push({
        type: 'neutral',
        title: 'High Intensity Sessions',
        description: `Your average session intensity is ${movementStats.averageIntensity.toFixed(1)}/10.`,
        recommendation: 'Monitor your post-session fatigue to ensure you\'re not overexerting.'
      });
    }

    return insights;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600';
      case 'declining':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const insights = generateInsights();

  if (movementData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Movement Dashboard
          </CardTitle>
          <CardDescription>
            Track your movement sessions and progress over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Start your first movement session to see insights here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{movementStats.completionRate}%</p>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(movementStats.trend)}
                <span className={`text-sm ${getTrendColor(movementStats.trend)}`}>
                  {movementStats.trend}
                </span>
              </div>
            </div>
            <Progress value={movementStats.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Intensity</p>
                <p className={`text-2xl font-bold ${getIntensityColor(movementStats.averageIntensity)}`}>
                  {movementStats.averageIntensity.toFixed(1)}/10
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getIntensityLabel(movementStats.averageIntensity)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{movementStats.totalSessions}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {movementStats.completedSessions} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exercise Time</p>
                <p className="text-2xl font-bold">{movementStats.totalExerciseTime}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total minutes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Movement Sessions</CardTitle>
            {onExportData && (
              <Button variant="outline" size="sm" onClick={onExportData}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            )}
          </div>
          <CardDescription>
            Your latest movement sessions with completion details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {movementData.slice(-10).reverse().map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium text-sm">{formatDate(session.date)}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium text-sm">{getSessionTypeLabel(session.sessionType)}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium text-sm">{formatDuration(session.duration)}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Phases</p>
                    <p className="font-medium text-sm">{session.phasesCompleted}/{session.totalPhases}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Pre/Post Session Indicators */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-blue-600" />
                      <span>{session.preSessionEnergy}</span>
                    </div>
                    {session.postSessionFatigue && (
                      <>
                        <span>→</span>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-red-600" />
                          <span>{session.postSessionFatigue}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Completion Status */}
                  <div className="flex items-center gap-2">
                    {session.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : session.completionPercentage > 0 ? (
                      <div className="flex items-center gap-1">
                        <SkipForward className="h-4 w-4 text-yellow-600" />
                        <span className="text-xs">{session.completionPercentage}%</span>
                      </div>
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    
                    <Badge 
                      variant={session.completed ? 'default' : 'outline'}
                      className={getIntensityColor(session.intensity)}
                    >
                      {getIntensityLabel(session.intensity)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Movement Insights</CardTitle>
            <CardDescription>
              Personalized observations based on your movement patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.type === 'positive' 
                      ? 'bg-green-50 border-green-500' 
                      : insight.type === 'concern'
                      ? 'bg-red-50 border-red-500'
                      : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <h4 className="font-medium mb-1">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {insight.description}
                  </p>
                  {insight.recommendation && (
                    <p className="text-sm font-medium">
                      💡 {insight.recommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chronic Fatigue Specific Guidance */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Activity className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 mb-1">
                Movement and Chronic Fatigue
              </p>
              <p className="text-sm text-amber-800">
                For people with ME/CFS and Long COVID, gentle movement can help maintain function 
                without triggering post-exertional malaise (PEM). Always listen to your body and 
                stop if you feel worse during or after exercise. The goal is gentle maintenance, 
                not fitness improvement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}