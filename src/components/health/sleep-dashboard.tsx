'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Moon, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Clock,
  Zap,
  BarChart3,
  Calendar
} from 'lucide-react';

interface SleepDashboardProps {
  sleepData: SleepTrendData[];
  energyCorrelation?: number;
  className?: string;
}

interface SleepTrendData {
  date: string;
  sleepQuality: number;
  sleepDuration?: number;
  energyLevel?: number;
  routineCompletion: number; // percentage of evening routine completed
  bluelightReduction: boolean;
  screenReplacement: boolean;
  environmentOptimized: boolean;
}

interface SleepInsight {
  type: 'positive' | 'neutral' | 'concern';
  title: string;
  description: string;
  recommendation?: string;
}

export function SleepDashboard({ sleepData, energyCorrelation, className }: SleepDashboardProps) {
  // Calculate averages and trends
  const calculateAverages = () => {
    if (sleepData.length === 0) return null;

    const avgQuality = sleepData.reduce((sum, day) => sum + day.sleepQuality, 0) / sleepData.length;
    const avgDuration = sleepData
      .filter(day => day.sleepDuration)
      .reduce((sum, day) => sum + (day.sleepDuration || 0), 0) / 
      sleepData.filter(day => day.sleepDuration).length;
    const avgRoutineCompletion = sleepData.reduce((sum, day) => sum + day.routineCompletion, 0) / sleepData.length;

    return {
      quality: Math.round(avgQuality * 10) / 10,
      duration: Math.round(avgDuration * 10) / 10,
      routineCompletion: Math.round(avgRoutineCompletion)
    };
  };

  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-3);
    const earlier = values.slice(0, -3);
    
    if (recent.length === 0 || earlier.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length;
    
    const difference = recentAvg - earlierAvg;
    
    if (Math.abs(difference) < 0.5) return 'stable';
    return difference > 0 ? 'improving' : 'declining';
  };

  const generateInsights = (): SleepInsight[] => {
    const insights: SleepInsight[] = [];
    const averages = calculateAverages();
    
    if (!averages) return insights;

    // Sleep quality insights
    if (averages.quality >= 7) {
      insights.push({
        type: 'positive',
        title: 'Good Sleep Quality',
        description: `Your average sleep quality is ${averages.quality}/10, which is excellent for managing chronic fatigue.`
      });
    } else if (averages.quality < 5) {
      insights.push({
        type: 'concern',
        title: 'Sleep Quality Needs Attention',
        description: `Your average sleep quality is ${averages.quality}/10, which may be impacting your energy levels.`,
        recommendation: 'Focus on completing your evening routine consistently and consider discussing sleep issues with your healthcare provider.'
      });
    }

    // Routine completion insights
    if (averages.routineCompletion >= 80) {
      insights.push({
        type: 'positive',
        title: 'Consistent Evening Routine',
        description: `You're completing ${averages.routineCompletion}% of your evening routine on average.`
      });
    } else if (averages.routineCompletion < 50) {
      insights.push({
        type: 'concern',
        title: 'Evening Routine Inconsistency',
        description: `You're completing only ${averages.routineCompletion}% of your evening routine on average.`,
        recommendation: 'Try setting gentle reminders to help establish a consistent evening routine.'
      });
    }

    // Energy correlation insights
    if (energyCorrelation !== undefined) {
      if (energyCorrelation > 0.6) {
        insights.push({
          type: 'positive',
          title: 'Strong Sleep-Energy Connection',
          description: 'Your sleep quality shows a strong positive correlation with your energy levels.',
          recommendation: 'Continue prioritizing sleep optimization as it directly benefits your energy management.'
        });
      } else if (energyCorrelation < 0.3) {
        insights.push({
          type: 'neutral',
          title: 'Weak Sleep-Energy Correlation',
          description: 'Your sleep quality shows a weak correlation with energy levels.',
          recommendation: 'Consider tracking other factors that might be influencing your energy, such as activity levels or stress.'
        });
      }
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

  const getQualityColor = (quality: number) => {
    if (quality >= 8) return 'text-green-600';
    if (quality >= 6) return 'text-yellow-600';
    if (quality >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  const averages = calculateAverages();
  const qualityTrend = calculateTrend(sleepData.map(d => d.sleepQuality));
  const insights = generateInsights();

  if (!averages) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Sleep Dashboard
          </CardTitle>
          <CardDescription>
            Track your sleep patterns and their impact on energy levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Start tracking your sleep to see insights and trends here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Sleep Quality</p>
                <p className={`text-2xl font-bold ${getQualityColor(averages.quality)}`}>
                  {averages.quality}/10
                </p>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(qualityTrend)}
                <span className={`text-sm ${getTrendColor(qualityTrend)}`}>
                  {qualityTrend}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Routine Completion</p>
                <p className="text-2xl font-bold">{averages.routineCompletion}%</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={averages.routineCompletion} className="mt-2" />
          </CardContent>
        </Card>

        {energyCorrelation !== undefined && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sleep-Energy Link</p>
                  <p className="text-2xl font-bold">
                    {Math.round(energyCorrelation * 100)}%
                  </p>
                </div>
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Correlation strength
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Recent Sleep Pattern */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Sleep Pattern
          </CardTitle>
          <CardDescription>
            Last 7 days of sleep quality and routine completion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sleepData.slice(-7).map((day, index) => (
              <div key={day.date} className="flex items-center gap-4 p-3 rounded-lg border">
                <div className="flex-shrink-0 w-16">
                  <p className="text-sm font-medium">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sleep Quality</span>
                    <span className={`font-medium ${getQualityColor(day.sleepQuality)}`}>
                      {day.sleepQuality}/10
                    </span>
                  </div>
                  <Progress value={day.sleepQuality * 10} className="h-2" />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Routine</span>
                    <span className="font-medium">{day.routineCompletion}%</span>
                  </div>
                  <Progress value={day.routineCompletion} className="h-2" />
                </div>

                {day.energyLevel && (
                  <div className="flex-shrink-0">
                    <Badge variant="outline" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      {day.energyLevel}/10
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sleep Insights</CardTitle>
            <CardDescription>
              Personalized observations based on your sleep patterns
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
    </div>
  );
}