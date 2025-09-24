'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Info,
  Heart,
  Activity,
  Clock,
  Lightbulb,
  Shield,
  Zap
} from 'lucide-react';
import { AIPacingService } from '@/lib/services/ai-pacing.service';
import { PacingNotificationsService } from '@/lib/services/pacing-notifications.service';
import type { 
  PacingRecommendation, 
  EnergyForecast, 
  PatternAnalysis,
  UserHealthData 
} from '@/lib/types/ai-pacing.types';

interface AIPacingDashboardProps {
  userId: string;
  userHealthData: UserHealthData;
  onRecommendationAction?: (action: string, recommendationId?: string) => void;
  className?: string;
}

interface DashboardState {
  recommendations: PacingRecommendation[];
  energyForecast: EnergyForecast | null;
  patternAnalysis: PatternAnalysis | null;
  isLoading: boolean;
  error: string | null;
}

export function AIPacingDashboard({ 
  userId, 
  userHealthData, 
  onRecommendationAction,
  className 
}: AIPacingDashboardProps) {
  const [state, setState] = useState<DashboardState>({
    recommendations: [],
    energyForecast: null,
    patternAnalysis: null,
    isLoading: true,
    error: null
  });

  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);

  useEffect(() => {
    loadAIPacingData();
  }, [userId, userHealthData]);

  const loadAIPacingData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const [recommendations, energyForecast, patternAnalysis] = await Promise.all([
        AIPacingService.analyzePacingNeeds(userHealthData),
        AIPacingService.predictEnergyLevels(userHealthData),
        AIPacingService.analyzePatterns(userHealthData)
      ]);

      setState({
        recommendations,
        energyForecast,
        patternAnalysis,
        isLoading: false,
        error: null
      });

      // Schedule gentle notifications for high-priority recommendations
      const highPriorityRecs = recommendations.filter(rec => rec.priority === 'high');
      if (highPriorityRecs.length > 0) {
        await PacingNotificationsService.scheduleNotifications(userId, highPriorityRecs);
      }

    } catch (error) {
      console.error('Error loading AI pacing data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Unable to load pacing insights. Please try again later.'
      }));
    }
  };

  const handleRecommendationAction = (action: string, recommendationId?: string) => {
    if (action === 'expand') {
      setExpandedRecommendation(
        expandedRecommendation === recommendationId ? null : recommendationId || null
      );
    } else {
      onRecommendationAction?.(action, recommendationId);
    }
  };

  const getPriorityIcon = (priority: PacingRecommendation['priority']) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <Lightbulb className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTypeIcon = (type: PacingRecommendation['type']) => {
    switch (type) {
      case 'energy_conservation':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'gentle_activity':
        return <Activity className="h-4 w-4 text-blue-600" />;
      case 'rest_recommendation':
        return <Heart className="h-4 w-4 text-purple-600" />;
      case 'routine_modification':
        return <Zap className="h-4 w-4 text-orange-600" />;
      case 'biometric_concern':
        return <Heart className="h-4 w-4 text-red-600" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
      case 'worsening':
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  if (state.isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Pacing Insights
          </CardTitle>
          <CardDescription>
            Analyzing your patterns to provide personalized pacing guidance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-muted-foreground">Analyzing your data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state.error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Pacing Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <p className="text-muted-foreground mb-4">{state.error}</p>
            <Button onClick={loadAIPacingData} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Pacing Insights
          </CardTitle>
          <CardDescription>
            Personalized guidance based on your energy patterns and health data
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Energy Forecast */}
      {state.energyForecast && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Energy Forecast
            </CardTitle>
            <CardDescription>
              Predicted energy for {new Date(state.energyForecast.forecastDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {state.energyForecast.predictedEnergyLevel}/10
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Confidence: {formatConfidence(state.energyForecast.confidence)}
                  </p>
                </div>
                <Progress 
                  value={state.energyForecast.predictedEnergyLevel * 10} 
                  className="w-32"
                />
              </div>

              {state.energyForecast.factors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Influencing Factors</h4>
                  <div className="space-y-2">
                    {state.energyForecast.factors.map((factor, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {factor.impact === 'positive' ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : factor.impact === 'negative' ? (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        ) : (
                          <Minus className="h-3 w-3 text-gray-600" />
                        )}
                        <span>{factor.factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {state.energyForecast.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tomorrow's Suggestions</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {state.energyForecast.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Recommendations */}
      {state.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Current Recommendations
            </CardTitle>
            <CardDescription>
              Personalized pacing suggestions based on your recent data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {state.recommendations.map((recommendation, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(recommendation.type)}
                      <h4 className="font-medium">{recommendation.title}</h4>
                      <Badge variant={
                        recommendation.priority === 'high' ? 'destructive' :
                        recommendation.priority === 'medium' ? 'default' : 'secondary'
                      }>
                        {recommendation.priority}
                      </Badge>
                    </div>
                    {getPriorityIcon(recommendation.priority)}
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {recommendation.message}
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-muted-foreground">
                      Confidence: {formatConfidence(recommendation.confidence)}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      Valid until: {new Date(recommendation.validUntil).toLocaleTimeString()}
                    </span>
                  </div>

                  {expandedRecommendation === `rec-${index}` && (
                    <div className="space-y-3 pt-3 border-t">
                      <div>
                        <h5 className="font-medium text-sm mb-1">Reasoning</h5>
                        <p className="text-sm text-muted-foreground">
                          {recommendation.reasoning}
                        </p>
                      </div>

                      {recommendation.actionItems.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">Suggested Actions</h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {recommendation.actionItems.map((item, itemIndex) => (
                              <li key={itemIndex}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {recommendation.disclaimers.length > 0 && (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <h5 className="font-medium text-sm text-amber-900 mb-1">
                            Important Notes
                          </h5>
                          <ul className="text-xs text-amber-800 space-y-1">
                            {recommendation.disclaimers.map((disclaimer, disclaimerIndex) => (
                              <li key={disclaimerIndex}>• {disclaimer}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRecommendationAction('expand', `rec-${index}`)}
                    >
                      {expandedRecommendation === `rec-${index}` ? 'Show Less' : 'Show More'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRecommendationAction('apply', `rec-${index}`)}
                    >
                      Apply Suggestion
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRecommendationAction('dismiss', `rec-${index}`)}
                    >
                      Not Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pattern Analysis */}
      {state.patternAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-green-600" />
              Pattern Analysis
            </CardTitle>
            <CardDescription>
              Insights from your health and activity patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Trends Overview */}
              <div>
                <h4 className="font-medium mb-3">Current Trends</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    {getTrendIcon(state.patternAnalysis.trends.energyTrend)}
                    <div>
                      <p className="font-medium text-sm">Energy</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {state.patternAnalysis.trends.energyTrend}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    {getTrendIcon(state.patternAnalysis.trends.symptomTrend)}
                    <div>
                      <p className="font-medium text-sm">Symptoms</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {state.patternAnalysis.trends.symptomTrend}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    {getTrendIcon(state.patternAnalysis.trends.activityTolerance)}
                    <div>
                      <p className="font-medium text-sm">Activity Tolerance</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {state.patternAnalysis.trends.activityTolerance}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identified Patterns */}
              {state.patternAnalysis.patterns.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Identified Patterns</h4>
                  <div className="space-y-3">
                    {state.patternAnalysis.patterns.map((pattern, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-sm capitalize">
                            {pattern.type.replace('_', ' ')}
                          </h5>
                          <Badge variant="outline">
                            {formatConfidence(pattern.confidence)} confidence
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {pattern.description}
                        </p>
                        
                        <p className="text-xs text-muted-foreground mb-2">
                          Timeframe: {pattern.timeframe}
                        </p>
                        
                        {pattern.recommendations.length > 0 && (
                          <div>
                            <h6 className="font-medium text-xs mb-1">Recommendations:</h6>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {pattern.recommendations.map((rec, recIndex) => (
                                <li key={recIndex}>• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Disclaimer */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 mb-1">
                AI-Powered Insights
              </p>
              <p className="text-sm text-blue-800">
                These insights are generated by analyzing your personal health patterns. 
                They are provided as information to support your self-management and are not 
                medical advice. Always consult with your healthcare provider for medical decisions 
                and if you experience worsening symptoms.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}