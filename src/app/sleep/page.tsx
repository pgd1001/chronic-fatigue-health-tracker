'use client';

import React, { useState, useEffect } from 'react';
import { SleepOptimization } from '@/components/health/sleep-optimization';
import { SleepDashboard } from '@/components/health/sleep-dashboard';
import { EveningReminders } from '@/components/health/evening-reminders';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Moon, TrendingUp, Bell, Lightbulb } from 'lucide-react';
import type { SleepTrendData } from '@/components/health/sleep-dashboard';

// Mock data for demonstration - in real app this would come from API
const mockSleepData: SleepTrendData[] = [
  {
    date: '2024-01-15',
    sleepQuality: 7,
    sleepDuration: 8.5,
    energyLevel: 6,
    routineCompletion: 100,
    bluelightReduction: true,
    screenReplacement: true,
    environmentOptimized: true,
  },
  {
    date: '2024-01-14',
    sleepQuality: 5,
    sleepDuration: 6.5,
    energyLevel: 4,
    routineCompletion: 67,
    bluelightReduction: true,
    screenReplacement: false,
    environmentOptimized: true,
  },
  {
    date: '2024-01-13',
    sleepQuality: 8,
    sleepDuration: 9,
    energyLevel: 7,
    routineCompletion: 100,
    bluelightReduction: true,
    screenReplacement: true,
    environmentOptimized: true,
  },
  {
    date: '2024-01-12',
    sleepQuality: 6,
    sleepDuration: 7.5,
    energyLevel: 5,
    routineCompletion: 33,
    bluelightReduction: false,
    screenReplacement: false,
    environmentOptimized: true,
  },
  {
    date: '2024-01-11',
    sleepQuality: 9,
    sleepDuration: 8,
    energyLevel: 8,
    routineCompletion: 100,
    bluelightReduction: true,
    screenReplacement: true,
    environmentOptimized: true,
  },
];

export default function SleepPage() {
  const [currentTab, setCurrentTab] = useState('optimization');
  const [sleepData, setSleepData] = useState<SleepTrendData[]>(mockSleepData);
  const [energyCorrelation, setEnergyCorrelation] = useState<number>(0.75);
  const [isEvening, setIsEvening] = useState(false);

  // Check if it's evening (after 6 PM)
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      setIsEvening(hour >= 18 || hour <= 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);

    return () => clearInterval(interval);
  }, []);

  // Auto-switch to optimization tab in the evening
  useEffect(() => {
    if (isEvening && currentTab === 'dashboard') {
      setCurrentTab('optimization');
    }
  }, [isEvening, currentTab]);

  const handleSleepDataUpdate = (newData: any) => {
    console.log('Sleep data updated:', newData);
    // In real app, this would save to API and update local state
  };

  const handleReminderUpdate = (reminders: any[]) => {
    console.log('Reminders updated:', reminders);
    // In real app, this would save to API
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Moon className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold">Sleep Optimization</h1>
          {isEvening && (
            <Badge className="bg-indigo-100 text-indigo-800">
              Evening Mode Active
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-lg">
          Gentle sleep preparation and tracking designed for chronic fatigue management
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last Night</p>
                <p className="text-2xl font-bold text-green-600">8/10</p>
              </div>
              <Moon className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Sleep Quality</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">7-Day Avg</p>
                <p className="text-2xl font-bold">7.0/10</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Quality Trend</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Routine</p>
                <p className="text-2xl font-bold">80%</p>
              </div>
              <Bell className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Completion Rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Energy Link</p>
                <p className="text-2xl font-bold text-yellow-600">75%</p>
              </div>
              <Lightbulb className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Sleep-Energy Correlation</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Sleep Routine
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends & Insights
          </TabsTrigger>
          <TabsTrigger value="reminders" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Evening Reminders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="optimization" className="mt-6">
          <SleepOptimization
            userId="mock-user-id"
            currentDate={new Date()}
            onSleepDataUpdate={handleSleepDataUpdate}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <SleepDashboard
            sleepData={sleepData}
            energyCorrelation={energyCorrelation}
          />
        </TabsContent>

        <TabsContent value="reminders" className="mt-6">
          <EveningReminders
            userId="mock-user-id"
            onReminderUpdate={handleReminderUpdate}
          />
        </TabsContent>
      </Tabs>

      {/* Evening Mode Notice */}
      {isEvening && (
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Evening Mode Active</p>
                <p className="text-sm text-blue-700">
                  The interface has switched to evening mode with calmer colors and gentle reminders 
                  to support your wind-down routine.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Educational Note */}
      <Card className="mt-8 border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 mb-1">
                Sleep and Chronic Fatigue
              </p>
              <p className="text-sm text-amber-800">
                Quality sleep is crucial for managing chronic fatigue conditions. Poor sleep can worsen 
                symptoms and reduce your energy envelope. These tools are designed to support gentle, 
                sustainable sleep habits that work with your condition, not against it.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}