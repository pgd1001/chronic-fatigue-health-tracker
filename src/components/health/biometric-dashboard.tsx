'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  Download,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface BiometricDashboardProps {
  biometricData: BiometricReading[];
  onExportData?: () => void;
  className?: string;
}

interface BiometricReading {
  id: string;
  heartRate: number;
  hrv: number;
  timestamp: Date;
  confidence: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  duration: number;
}

interface BiometricStats {
  avgHeartRate: number;
  avgHRV: number;
  restingHeartRate: number;
  heartRateTrend: 'improving' | 'stable' | 'declining';
  hrvTrend: 'improving' | 'stable' | 'declining';
  measurementCount: number;
  lastMeasurement: Date | null;
}

interface BiometricInsight {
  type: 'positive' | 'neutral' | 'concern';
  title: string;
  description: string;
  recommendation?: string;
}

export function BiometricDashboard({ biometricData, onExportData, className }: BiometricDashboardProps) {
  // Calculate biometric statistics
  const calculateStats = (): BiometricStats => {
    if (biometricData.length === 0) {
      return {
        avgHeartRate: 0,
        avgHRV: 0,
        restingHeartRate: 0,
        heartRateTrend: 'stable',
        hrvTrend: 'stable',
        measurementCount: 0,
        lastMeasurement: null,
      };
    }

    // Filter high-quality measurements for more accurate stats
    const qualityData = biometricData.filter(d => 
      d.quality === 'excellent' || d.quality === 'good'
    );

    const dataToUse = qualityData.length >= 3 ? qualityData : biometricData;

    const avgHeartRate = dataToUse.reduce((sum, d) => sum + d.heartRate, 0) / dataToUse.length;
    const avgHRV = dataToUse.reduce((sum, d) => sum + d.hrv, 0) / dataToUse.length;

    // Calculate resting heart rate (lowest 20% of measurements)
    const sortedHR = [...dataToUse].sort((a, b) => a.heartRate - b.heartRate);
    const restingCount = Math.max(1, Math.floor(sortedHR.length * 0.2));
    const restingHeartRate = sortedHR.slice(0, restingCount)
      .reduce((sum, d) => sum + d.heartRate, 0) / restingCount;

    // Calculate trends (compare recent vs older measurements)
    const heartRateTrend = calculateTrend(dataToUse.map(d => d.heartRate));
    const hrvTrend = calculateTrend(dataToUse.map(d => d.hrv));

    const lastMeasurement = biometricData.length > 0 
      ? new Date(Math.max(...biometricData.map(d => d.timestamp.getTime())))
      : null;

    return {
      avgHeartRate: Math.round(avgHeartRate),
      avgHRV: Math.round(avgHRV * 10) / 10,
      restingHeartRate: Math.round(restingHeartRate),
      heartRateTrend,
      hrvTrend,
      measurementCount: biometricData.length,
      lastMeasurement,
    };
  };

  const calculateTrend = (values: number[]): 'improving' | 'stable' | 'declining' => {
    if (values.length < 4) return 'stable';

    const midpoint = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, midpoint);
    const secondHalf = values.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;
    const threshold = firstAvg * 0.05; // 5% threshold

    if (Math.abs(difference) < threshold) return 'stable';
    return difference > 0 ? 'improving' : 'declining';
  };

  // Generate insights based on biometric data
  const generateInsights = (): BiometricInsight[] => {
    const insights: BiometricInsight[] = [];
    const stats = calculateStats();

    if (biometricData.length === 0) {
      insights.push({
        type: 'neutral',
        title: 'Start Tracking',
        description: 'Begin taking biometric measurements to see personalized insights.',
        recommendation: 'Take your first measurement to establish baseline values.'
      });
      return insights;
    }

    // Heart rate insights
    if (stats.avgHeartRate > 0) {
      if (stats.avgHeartRate < 60) {
        insights.push({
          type: 'positive',
          title: 'Low Resting Heart Rate',
          description: `Your average heart rate of ${stats.avgHeartRate} BPM suggests good cardiovascular fitness.`
        });
      } else if (stats.avgHeartRate > 100) {
        insights.push({
          type: 'concern',
          title: 'Elevated Heart Rate',
          description: `Your average heart rate of ${stats.avgHeartRate} BPM is higher than typical resting rates.`,
          recommendation: 'Consider discussing this with your healthcare provider, especially if you have chronic fatigue.'
        });
      }
    }

    // HRV insights
    if (stats.avgHRV > 0) {
      if (stats.avgHRV > 30) {
        insights.push({
          type: 'positive',
          title: 'Good Heart Rate Variability',
          description: `Your HRV of ${stats.avgHRV}ms indicates good autonomic nervous system function.`
        });
      } else if (stats.avgHRV < 20) {
        insights.push({
          type: 'concern',
          title: 'Low Heart Rate Variability',
          description: `Your HRV of ${stats.avgHRV}ms may indicate stress or fatigue.`,
          recommendation: 'Focus on stress management, quality sleep, and gentle exercise as tolerated.'
        });
      }
    }

    // Trend insights
    if (stats.heartRateTrend === 'improving' && stats.hrvTrend === 'improving') {
      insights.push({
        type: 'positive',
        title: 'Improving Cardiovascular Health',
        description: 'Both your heart rate and HRV trends show positive changes over time.'
      });
    } else if (stats.heartRateTrend === 'declining' || stats.hrvTrend === 'declining') {
      insights.push({
        type: 'concern',
        title: 'Declining Trends',
        description: 'Your recent measurements show some concerning trends.',
        recommendation: 'Consider reviewing your pacing, stress levels, and sleep quality.'
      });
    }

    // Data quality insights
    const lowQualityCount = biometricData.filter(d => d.quality === 'poor').length;
    const qualityPercentage = ((biometricData.length - lowQualityCount) / biometricData.length) * 100;

    if (qualityPercentage < 70) {
      insights.push({
        type: 'neutral',
        title: 'Measurement Quality',
        description: `${Math.round(100 - qualityPercentage)}% of your measurements had poor quality.`,
        recommendation: 'Try improving lighting conditions and finger placement for more accurate readings.'
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

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = calculateStats();
  const insights = generateInsights();

  if (biometricData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Biometric Dashboard
          </CardTitle>
          <CardDescription>
            Track your heart rate and HRV patterns over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Take your first biometric measurement to see insights here.</p>
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
                <p className="text-sm text-muted-foreground">Avg Heart Rate</p>
                <p className="text-2xl font-bold text-red-600">{stats.avgHeartRate}</p>
                <p className="text-xs text-muted-foreground">BPM</p>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(stats.heartRateTrend)}
                <span className={`text-sm ${getTrendColor(stats.heartRateTrend)}`}>
                  {stats.heartRateTrend}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg HRV</p>
                <p className="text-2xl font-bold text-blue-600">{stats.avgHRV}</p>
                <p className="text-xs text-muted-foreground">ms</p>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(stats.hrvTrend)}
                <span className={`text-sm ${getTrendColor(stats.hrvTrend)}`}>
                  {stats.hrvTrend}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resting HR</p>
                <p className="text-2xl font-bold text-green-600">{stats.restingHeartRate}</p>
                <p className="text-xs text-muted-foreground">BPM</p>
              </div>
              <Heart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Measurements</p>
                <p className="text-2xl font-bold">{stats.measurementCount}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.lastMeasurement ? formatDate(stats.lastMeasurement) : 'Never'}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Measurements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Measurements</CardTitle>
            {onExportData && (
              <Button variant="outline" size="sm" onClick={onExportData}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            )}
          </div>
          <CardDescription>
            Your latest biometric readings with quality indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {biometricData.slice(-10).reverse().map((reading) => (
              <div key={reading.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{formatDate(reading.timestamp)}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Heart Rate</p>
                    <p className="font-bold text-red-600">{reading.heartRate} BPM</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">HRV</p>
                    <p className="font-bold text-blue-600">{reading.hrv.toFixed(1)} ms</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge 
                    variant={reading.quality === 'excellent' || reading.quality === 'good' ? 'default' : 'outline'}
                    className={getQualityColor(reading.quality)}
                  >
                    {reading.quality}
                  </Badge>
                  
                  {reading.confidence > 0.8 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : reading.confidence < 0.5 ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  ) : null}
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
            <CardTitle>Biometric Insights</CardTitle>
            <CardDescription>
              Personalized observations based on your measurements
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
            <Heart className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 mb-1">
                Biometrics and Chronic Fatigue
              </p>
              <p className="text-sm text-amber-800">
                For people with ME/CFS and Long COVID, biometric monitoring can help identify 
                patterns and early warning signs of post-exertional malaise (PEM). Use these 
                measurements alongside your energy levels and symptoms for better pacing decisions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}