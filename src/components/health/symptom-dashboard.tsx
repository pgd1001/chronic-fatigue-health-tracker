'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { SymptomTracker } from './symptom-tracker';
import { SymptomProgress } from './symptom-progress';
import { SymptomService } from '@/lib/db/services/symptom.service';
import {
  type ProgressMetrics,
  type SymptomCorrelation,
  type SymptomType,
  type SymptomEntry,
} from '@/lib/types/symptom.types';
import { useToast } from '@/hooks/use-toast';

interface SymptomDashboardProps {
  userId: string;
}

export function SymptomDashboard({ userId }: SymptomDashboardProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'track' | 'progress'>('track');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Tracking data
  const [currentSymptomData, setCurrentSymptomData] = useState<{
    fatigueLevel?: number;
    brainFogLevel?: number;
    sleepQuality?: number;
    symptoms?: SymptomEntry[];
    notes?: string;
  } | null>(null);

  // Progress data
  const [progressMetrics, setProgressMetrics] = useState<ProgressMetrics | null>(null);
  const [symptomTrends, setSymptomTrends] = useState<Array<{ date: string; severity: number | null }>>([]);
  const [correlations, setCorrelations] = useState<SymptomCorrelation[]>([]);
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomType>('fatigue');
  const [progressPeriod, setProgressPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  const { toast } = useToast();

  // Load symptom data for selected date
  useEffect(() => {
    loadSymptomData();
  }, [selectedDate, userId]);

  // Load progress data when tab changes or period changes
  useEffect(() => {
    if (activeTab === 'progress') {
      loadProgressData();
    }
  }, [activeTab, progressPeriod, selectedSymptom, userId]);

  const loadSymptomData = async () => {
    setIsLoading(true);
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const logs = await SymptomService.getSymptomLogs(
        userId,
        dateString,
        dateString,
        { limit: 1 }
      );

      if (logs.data.length > 0) {
        const log = logs.data[0];
        setCurrentSymptomData({
          fatigueLevel: log.fatigueLevel || undefined,
          brainFogLevel: log.brainFogLevel || undefined,
          sleepQuality: log.sleepQuality || undefined,
          symptoms: log.symptoms ? JSON.parse(log.symptoms as string) : undefined,
          notes: log.notes || undefined,
        });
      } else {
        setCurrentSymptomData(null);
      }
    } catch (error) {
      console.error('Failed to load symptom data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load symptom data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadProgressData = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      // Calculate start date based on period
      switch (progressPeriod) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
      }

      const [metrics, trends, correlationData] = await Promise.all([
        SymptomService.calculateProgressMetrics(
          userId,
          format(startDate, 'yyyy-MM-dd'),
          format(endDate, 'yyyy-MM-dd')
        ),
        SymptomService.getSymptomTrends(userId, selectedSymptom, 30),
        SymptomService.analyzeSymptomCorrelations(userId, 90),
      ]);

      setProgressMetrics(metrics);
      setSymptomTrends(trends);
      setCorrelations(correlationData);
    } catch (error) {
      console.error('Failed to load progress data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load progress data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSymptoms = async (data: {
    fatigueLevel?: number;
    brainFogLevel?: number;
    sleepQuality?: number;
    symptoms?: SymptomEntry[];
    notes?: string;
  }) => {
    setIsSaving(true);
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      await SymptomService.upsertSymptomLog(userId, dateString, data);
      
      setCurrentSymptomData(data);
      
      toast({
        title: 'Success',
        description: 'Symptoms saved successfully.',
      });
    } catch (error) {
      console.error('Failed to save symptoms:', error);
      toast({
        title: 'Error',
        description: 'Failed to save symptoms. Please try again.',
        variant: 'destructive',
      });
      throw error; // Re-throw to let the component handle it
    } finally {
      setIsSaving(false);
    }
  };

  const handlePeriodChange = (period: 'week' | 'month' | 'quarter') => {
    setProgressPeriod(period);
  };

  const handleSymptomSelect = (symptom: SymptomType) => {
    setSelectedSymptom(symptom);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Symptom Management</h1>
        <p className="text-gray-600">
          Track your symptoms and monitor progress to better understand your condition and share insights with healthcare providers.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'track' | 'progress')}>
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="track" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Track Symptoms
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Progress & Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="track" className="space-y-6">
          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Daily Symptom Tracking</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </CardTitle>
              <CardDescription>
                Select a date to track or review your symptoms. You can track symptoms for today or previous days.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Symptom Tracker */}
          <SymptomTracker
            userId={userId}
            date={format(selectedDate, 'yyyy-MM-dd')}
            initialData={currentSymptomData || undefined}
            onSave={handleSaveSymptoms}
            isLoading={isLoading || isSaving}
          />

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Tracking Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Rating Scale</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• 1-2: Very mild, barely noticeable</li>
                    <li>• 3-4: Mild, manageable with effort</li>
                    <li>• 5-6: Moderate, affecting activities</li>
                    <li>• 7-8: Severe, significantly limiting</li>
                    <li>• 9-10: Very severe, overwhelming</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Best Practices</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Track consistently for better patterns</li>
                    <li>• Note triggers or contributing factors</li>
                    <li>• Be honest about severity levels</li>
                    <li>• Include location for pain symptoms</li>
                    <li>• Use notes for additional context</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <SymptomProgress
            userId={userId}
            progressMetrics={progressMetrics}
            symptomTrends={symptomTrends}
            correlations={correlations}
            onPeriodChange={handlePeriodChange}
            onSymptomSelect={handleSymptomSelect}
            selectedSymptom={selectedSymptom}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}