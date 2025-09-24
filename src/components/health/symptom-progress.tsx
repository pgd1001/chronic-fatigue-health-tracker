'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Heart,
  Brain,
  Moon,
  Zap,
} from 'lucide-react';
import {
  type ProgressMetrics,
  type SymptomPattern,
  type SymptomCorrelation,
  type SymptomType,
  getSymptomDisplayName,
  getSeverityColor,
} from '@/lib/types/symptom.types';

interface SymptomProgressProps {
  userId: string;
  progressMetrics: ProgressMetrics | null;
  symptomTrends: Array<{ date: string; severity: number | null }>;
  correlations: SymptomCorrelation[];
  onPeriodChange: (period: 'week' | 'month' | 'quarter') => void;
  onSymptomSelect: (symptom: SymptomType) => void;
  selectedSymptom: SymptomType;
  isLoading?: boolean;
}

const TREND_COLORS = {
  improving: 'text-green-600',
  stable: 'text-blue-600',
  worsening: 'text-red-600',
  insufficient_data: 'text-gray-500',
};

const TREND_ICONS = {
  improving: TrendingUp,
  stable: Minus,
  worsening: TrendingDown,
  insufficient_data: Minus,
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function SymptomProgress({
  userId,
  progressMetrics,
  symptomTrends,
  correlations,
  onPeriodChange,
  onSymptomSelect,
  selectedSymptom,
  isLoading = false,
}: SymptomProgressProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'patterns'>('overview');

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (!progressMetrics) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center h-64 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600 max-w-md">
            Start tracking your symptoms to see progress insights and patterns over time.
          </p>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = TREND_ICONS[progressMetrics.fatiguetrend];

  // Prepare chart data
  const trendChartData = symptomTrends
    .filter(point => point.severity !== null)
    .map(point => ({
      date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      severity: point.severity,
    }));

  const symptomFrequencyData = progressMetrics.topSymptoms.map((symptom, index) => ({
    name: getSymptomDisplayName(symptom.symptomType),
    frequency: symptom.frequency,
    severity: symptom.averageSeverity,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Progress & Insights</h2>
        <Select onValueChange={(value) => onPeriodChange(value as 'week' | 'month' | 'quarter')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Past Week</SelectItem>
            <SelectItem value="month">Past Month</SelectItem>
            <SelectItem value="quarter">Past 3 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Fatigue</p>
                    <p className="text-2xl font-bold">
                      {progressMetrics.averageFatigue?.toFixed(1) || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Brain Fog</p>
                    <p className="text-2xl font-bold">
                      {progressMetrics.averageBrainFog?.toFixed(1) || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Moon className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Sleep</p>
                    <p className="text-2xl font-bold">
                      {progressMetrics.averageSleep?.toFixed(1) || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Good Days</p>
                    <p className="text-2xl font-bold">{progressMetrics.goodDays}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overall Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendIcon className={`h-5 w-5 ${TREND_COLORS[progressMetrics.fatiguetrend]}`} />
                Overall Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Badge
                    variant="outline"
                    className={TREND_COLORS[progressMetrics.fatiguetrend]}
                  >
                    {progressMetrics.fatiguetrend.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-2">
                    Based on fatigue levels over the selected period
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Good Days</p>
                  <p className="text-2xl font-bold text-green-600">
                    {progressMetrics.goodDays}
                  </p>
                  <p className="text-sm text-gray-600">Difficult Days</p>
                  <p className="text-2xl font-bold text-red-600">
                    {progressMetrics.difficultDays}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Symptoms */}
          {progressMetrics.topSymptoms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Most Frequent Symptoms</CardTitle>
                <CardDescription>
                  Symptoms you've tracked most often during this period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {progressMetrics.topSymptoms.slice(0, 5).map((symptom, index) => (
                    <div key={symptom.symptomType} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="font-medium">
                          {getSymptomDisplayName(symptom.symptomType)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                          {symptom.frequency}% of days
                        </span>
                        <Badge
                          variant="outline"
                          className={getSeverityColor(symptom.averageSeverity)}
                        >
                          Avg: {symptom.averageSeverity.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Symptom Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Symptom Trend</CardTitle>
              <CardDescription>
                Select a symptom to view its trend over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select onValueChange={(value) => onSymptomSelect(value as SymptomType)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select symptom to view trend" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fatigue">Fatigue</SelectItem>
                  <SelectItem value="brain_fog">Brain Fog</SelectItem>
                  <SelectItem value="sleep_disturbance">Sleep Quality</SelectItem>
                  {progressMetrics.topSymptoms.map(symptom => (
                    <SelectItem key={symptom.symptomType} value={symptom.symptomType}>
                      {getSymptomDisplayName(symptom.symptomType)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Trend Chart */}
          {trendChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{getSymptomDisplayName(selectedSymptom)} Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[1, 10]} />
                      <Tooltip
                        formatter={(value) => [`${value}/10`, 'Severity']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="severity"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Symptom Frequency Chart */}
          {symptomFrequencyData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Symptom Frequency</CardTitle>
                <CardDescription>
                  How often each symptom occurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={symptomFrequencyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => [
                          name === 'frequency' ? `${value}%` : `${value}/10`,
                          name === 'frequency' ? 'Frequency' : 'Avg Severity'
                        ]}
                      />
                      <Bar dataKey="frequency" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          {/* Symptom Correlations */}
          {correlations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Symptom Correlations</CardTitle>
                <CardDescription>
                  Symptoms that tend to occur together or influence each other
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {correlations.slice(0, 8).map((correlation, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">
                          {getSymptomDisplayName(correlation.symptom1)} ↔ {getSymptomDisplayName(correlation.symptom2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {correlation.correlation > 0 ? 'Positive' : 'Negative'} correlation
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className={
                            correlation.significance === 'high'
                              ? 'text-green-600'
                              : correlation.significance === 'moderate'
                              ? 'text-yellow-600'
                              : 'text-gray-600'
                          }
                        >
                          {correlation.significance}
                        </Badge>
                        <span className="font-mono text-sm">
                          {correlation.correlation.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Insights and Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Insights & Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progressMetrics.fatiguetrend === 'improving' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800">Positive Trend</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Your fatigue levels are showing improvement. Keep up your current routine and consider what factors might be contributing to this positive change.
                    </p>
                  </div>
                )}

                {progressMetrics.fatiguetrend === 'worsening' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-800">Concerning Trend</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Your fatigue levels have been increasing. Consider discussing this with your healthcare provider and reviewing recent changes in your routine or environment.
                    </p>
                  </div>
                )}

                {progressMetrics.goodDays > progressMetrics.difficultDays && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800">More Good Days</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      You've had more good days than difficult ones this period. This is a positive sign of your management strategies working.
                    </p>
                  </div>
                )}

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-800">Remember</h4>
                  <p className="text-sm text-gray-700 mt-1">
                    This data is for tracking purposes only and should not replace professional medical advice. Share these insights with your healthcare provider for the best care.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}