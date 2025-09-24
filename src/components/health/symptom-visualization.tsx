'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Calendar,
  Heart,
  Brain,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Info,
  Download
} from 'lucide-react';
import {
  type DailySymptomSummary,
  type SymptomType,
  type SymptomPattern,
  type ProgressMetrics,
  CORE_SYMPTOMS,
  getSymptomDisplayName,
  getSeverityLabel,
  getSeverityColor,
  getTrendIcon,
  PROGRESS_ACKNOWLEDGMENTS
} from '@/lib/types/symptom-tracking.types';

interface SymptomVisualizationProps {
  userId: string;
  symptomData: DailySymptomSummary[];
  patterns?: SymptomPattern;
  progressMetrics?: ProgressMetrics;
  onExportData?: () => void;
  className?: string;
}

interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

interface SymptomInsight {
  type: 'positive' | 'neutral' | 'concern' | 'acknowledgment';
  title: string;
  description: string;
  recommendation?: string;
}

export function SymptomVisualization({ 
  userId, 
  symptomData, 
  patterns, 
  progressMetrics,
  onExportData,
  className 
}: SymptomVisualizationProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomType[]>(CORE_SYMPTOMS);

  // Process data for visualization
  const chartData = useMemo(() => {
    const cutoffDate = new Date();
    const daysBack = selectedTimeframe === 'week' ? 7 : selectedTimeframe === 'month' ? 30 : 90;
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    return symptomData
      .filter(entry => new Date(entry.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(entry => {
        const dataPoint: ChartDataPoint = {
          date: entry.date,
        };
        
        selectedSymptoms.forEach(symptom => {
          const value = entry[symptom as keyof DailySymptomSummary] as number;
          if (value !== undefined && value !== null) {
            dataPoint[symptom] = value;
          }
        });
        
        return dataPoint;
      });
  }, [symptomData, selectedTimeframe, selectedSymptoms]);

  // Generate insights from the data
  const generateInsights = (): SymptomInsight[] => {
    const insights: SymptomInsight[] = [];
    
    if (symptomData.length === 0) {
      insights.push({
        type: 'neutral',
        title: 'Start Tracking',
        description: 'Begin tracking your symptoms to identify patterns and progress over time.',
        recommendation: 'Try to log your main symptoms daily, even if it\'s just a quick check-in.'
      });
      return insights;
    }

    // Add a random acknowledgment
    const randomAcknowledgment = PROGRESS_ACKNOWLEDGMENTS[
      Math.floor(Math.random() * PROGRESS_ACKNOWLEDGMENTS.length)
    ];
    insights.push({
      type: 'acknowledgment',
      title: 'Your Tracking Matters',
      description: randomAcknowledgment
    });

    // Analyze recent trends
    if (chartData.length >= 7) {
      const recentWeek = chartData.slice(-7);
      const previousWeek = chartData.slice(-14, -7);
      
      if (previousWeek.length >= 3) {
        CORE_SYMPTOMS.forEach(symptom => {
          const recentAvg = recentWeek
            .map(d => d[symptom] as number)
            .filter(v => v !== undefined)
            .reduce((sum, val, _, arr) => sum + val / arr.length, 0);
          
          const previousAvg = previousWeek
            .map(d => d[symptom] as number)
            .filter(v => v !== undefined)
            .reduce((sum, val, _, arr) => sum + val / arr.length, 0);
          
          if (recentAvg && previousAvg) {
            const improvement = previousAvg - recentAvg;
            
            if (improvement >= 1) {
              insights.push({
                type: 'positive',
                title: `${getSymptomDisplayName(symptom)} Improving`,
                description: `Your ${getSymptomDisplayName(symptom).toLowerCase()} has improved by ${improvement.toFixed(1)} points over the past week.`,
                recommendation: 'Consider what might be contributing to this improvement and try to maintain those factors.'
              });
            } else if (improvement <= -1) {
              insights.push({
                type: 'concern',
                title: `${getSymptomDisplayName(symptom)} Increased`,
                description: `Your ${getSymptomDisplayName(symptom).toLowerCase()} has increased recently.`,
                recommendation: 'Consider if any recent changes or stressors might be contributing. It might be helpful to discuss this with your healthcare provider.'
              });
            }
          }
        });
      }
    }

    // Pattern-based insights
    if (patterns) {
      patterns.patterns.forEach(pattern => {
        if (pattern.trend === 'improving') {
          insights.push({
            type: 'positive',
            title: `${getSymptomDisplayName(pattern.symptomType)} Pattern`,
            description: `Your ${getSymptomDisplayName(pattern.symptomType).toLowerCase()} shows an improving trend over time.`
          });
        } else if (pattern.trend === 'worsening') {
          insights.push({
            type: 'concern',
            title: `${getSymptomDisplayName(pattern.symptomType)} Pattern`,
            description: `Your ${getSymptomDisplayName(pattern.symptomType).toLowerCase()} has been more challenging recently.`,
            recommendation: 'Consider discussing this trend with your healthcare provider.'
          });
        }
      });
    }

    // Progress metrics insights
    if (progressMetrics) {
      if (progressMetrics.symptomsImproving.length > 0) {
        insights.push({
          type: 'positive',
          title: 'Symptoms Improving',
          description: `${progressMetrics.symptomsImproving.length} symptoms are showing improvement over time.`
        });
      }
      
      if (progressMetrics.goodDaysCount > progressMetrics.badDaysCount) {
        insights.push({
          type: 'positive',
          title: 'More Good Days',
          description: `You've had ${progressMetrics.goodDaysCount} good days compared to ${progressMetrics.badDaysCount} difficult days recently.`
        });
      }
    }

    return insights.slice(0, 5); // Limit to avoid overwhelming
  };

  const getInsightIcon = (type: SymptomInsight['type']) => {
    switch (type) {
      case 'positive':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'concern':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'acknowledgment':
        return <Heart className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getInsightBorderColor = (type: SymptomInsight['type']) => {
    switch (type) {
      case 'positive':
        return 'border-green-200 bg-green-50';
      case 'concern':
        return 'border-yellow-200 bg-yellow-50';
      case 'acknowledgment':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateSymptomAverage = (symptom: SymptomType): number => {
    const values = chartData
      .map(d => d[symptom] as number)
      .filter(v => v !== undefined && v !== null);
    
    if (values.length === 0) return 0;
    return Math.round((values.reduce((sum, val) => sum + val, 0) / values.length) * 10) / 10;
  };

  const insights = generateInsights();

  if (symptomData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Symptom Trends
          </CardTitle>
          <CardDescription>
            Track your symptoms over time to identify patterns and progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Start tracking your symptoms to see trends and insights here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Symptom Trends & Progress
              </CardTitle>
              <CardDescription>
                Visualize your symptom patterns and track progress over time
              </CardDescription>
            </div>
            {onExportData && (
              <Button variant="outline" size="sm" onClick={onExportData}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Timeframe Selection */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Timeframe:</span>
              <div className="flex gap-1">
                {(['week', 'month', 'quarter'] as const).map(timeframe => (
                  <Button
                    key={timeframe}
                    variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeframe(timeframe)}
                  >
                    {timeframe === 'week' ? '7 days' : timeframe === 'month' ? '30 days' : '90 days'}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Symptom Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {CORE_SYMPTOMS.map(symptom => {
          const average = calculateSymptomAverage(symptom);
          const hasData = average > 0;
          
          return (
            <Card key={symptom}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-blue-600">
                      {SYMPTOM_ICONS[symptom]}
                    </div>
                    <span className="font-medium text-sm">
                      {getSymptomDisplayName(symptom)}
                    </span>
                  </div>
                </div>
                
                {hasData ? (
                  <>
                    <div className="text-2xl font-bold mb-1" style={{ color: getSeverityColor(Math.round(average)).replace('text-', '') }}>
                      {average.toFixed(1)}/10
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getSeverityLabel(Math.round(average))} average
                    </p>
                  </>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">No data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Simple Trend Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Symptom Timeline</CardTitle>
          <CardDescription>
            Your symptom levels over the selected timeframe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {selectedSymptoms.map(symptom => {
              const symptomData = chartData.map(d => ({
                date: d.date,
                value: d[symptom] as number || null
              })).filter(d => d.value !== null);

              if (symptomData.length === 0) return null;

              return (
                <div key={symptom} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <div className="text-blue-600">
                        {SYMPTOM_ICONS[symptom]}
                      </div>
                      {getSymptomDisplayName(symptom)}
                    </h4>
                    <Badge variant="outline">
                      Avg: {calculateSymptomAverage(symptom).toFixed(1)}/10
                    </Badge>
                  </div>
                  
                  {/* Simple bar chart representation */}
                  <div className="space-y-1">
                    {symptomData.slice(-14).map((dataPoint, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <span className="w-16 text-muted-foreground">
                          {formatDate(dataPoint.date)}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 relative">
                          <div
                            className={`h-full rounded-full transition-all ${
                              dataPoint.value <= 3 ? 'bg-green-500' :
                              dataPoint.value <= 6 ? 'bg-yellow-500' :
                              dataPoint.value <= 8 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${(dataPoint.value / 10) * 100}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                            {dataPoint.value}/10
                          </span>
                        </div>
                        <span className="w-20 text-muted-foreground">
                          {getSeverityLabel(dataPoint.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Insights and Progress */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Insights & Progress
            </CardTitle>
            <CardDescription>
              Patterns and observations from your symptom tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${getInsightBorderColor(insight.type)}`}
                >
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
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
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pattern Analysis */}
      {patterns && patterns.patterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Pattern Analysis
            </CardTitle>
            <CardDescription>
              Identified patterns in your symptom data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patterns.patterns.map((pattern, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getTrendIcon(pattern.trend)}</span>
                      <h4 className="font-medium">
                        {getSymptomDisplayName(pattern.symptomType)}
                      </h4>
                      <Badge variant="outline" className="capitalize">
                        {pattern.trend}
                      </Badge>
                    </div>
                    <Badge variant="secondary">
                      {Math.round(pattern.frequency * 100)}% frequency
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-muted-foreground">Average: </span>
                      <span className={getSeverityColor(Math.round(pattern.averageSeverity))}>
                        {pattern.averageSeverity.toFixed(1)}/10
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Peak: </span>
                      <span className={getSeverityColor(Math.round(pattern.peakSeverity))}>
                        {pattern.peakSeverity}/10
                      </span>
                    </div>
                  </div>

                  {pattern.commonTriggers && pattern.commonTriggers.length > 0 && (
                    <div className="mb-3">
                      <h5 className="font-medium text-sm mb-1">Common Triggers:</h5>
                      <div className="flex flex-wrap gap-1">
                        {pattern.commonTriggers.map((trigger, triggerIndex) => (
                          <Badge key={triggerIndex} variant="outline" className="text-xs">
                            {trigger}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {pattern.correlations && pattern.correlations.length > 0 && (
                    <div>
                      <h5 className="font-medium text-sm mb-1">Correlations:</h5>
                      <div className="space-y-1">
                        {pattern.correlations.map((correlation, corrIndex) => (
                          <div key={corrIndex} className="text-sm text-muted-foreground">
                            Correlates with {getSymptomDisplayName(correlation.correlatedSymptom)} 
                            ({correlation.strength > 0 ? 'positive' : 'negative'} relationship)
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Milestones */}
      {progressMetrics && progressMetrics.milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Progress Milestones
            </CardTitle>
            <CardDescription>
              Recognizing your achievements in managing your condition
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {progressMetrics.milestones.map((milestone, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{milestone.description}</h4>
                      <Badge variant={
                        milestone.significance === 'major' ? 'default' :
                        milestone.significance === 'moderate' ? 'secondary' : 'outline'
                      }>
                        {milestone.significance}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Achieved on {new Date(milestone.achievedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empathetic Reminder */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-purple-900 mb-1">
                Your Experience Matters
              </p>
              <p className="text-sm text-purple-800">
                Chronic illness experiences are complex and individual. Your symptom tracking provides 
                valuable insights into your unique patterns. Remember that fluctuations are normal, 
                and every piece of data helps build a clearer picture for you and your healthcare team.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Add the missing SYMPTOM_ICONS constant
const SYMPTOM_ICONS: Record<SymptomType, React.ReactNode> = {
  fatigue: <Zap className="h-4 w-4" />,
  pain: <AlertTriangle className="h-4 w-4" />,
  brain_fog: <Brain className="h-4 w-4" />,
  sleep_quality: <Moon className="h-4 w-4" />,
  mood: <Smile className="h-4 w-4" />,
  anxiety: <Heart className="h-4 w-4" />,
  depression: <Heart className="h-4 w-4" />,
  headache: <Brain className="h-4 w-4" />,
  muscle_weakness: <Zap className="h-4 w-4" />,
  joint_pain: <AlertTriangle className="h-4 w-4" />,
  nausea: <AlertTriangle className="h-4 w-4" />,
  dizziness: <Brain className="h-4 w-4" />,
  temperature_regulation: <AlertTriangle className="h-4 w-4" />,
  sensory_sensitivity: <Brain className="h-4 w-4" />,
  custom: <Plus className="h-4 w-4" />,
};