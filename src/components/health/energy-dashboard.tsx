"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnergyAssessment } from "./energy-assessment";
import { EnergyMeter } from "./energy-meter";
import { EnergyHistory } from "./energy-history";
import { 
  Battery, 
  Plus, 
  BarChart3, 
  Calendar,
  Target,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EnergyReading {
  value: number;
  timestamp: Date;
  notes?: string;
}

interface EnergyEntry {
  id: string;
  value: number;
  timestamp: Date;
  notes?: string;
  context?: 'morning' | 'afternoon' | 'evening' | 'post_exercise' | 'post_meal' | 'other';
}

interface EnergyDashboardProps {
  onSaveAssessment?: (energy: number, notes?: string) => void;
  onExportData?: () => void;
  className?: string;
}

// Mock data for development
const MOCK_READINGS: EnergyReading[] = [
  { value: 6, timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
  { value: 5, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
  { value: 7, timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
  { value: 4, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  { value: 6, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  { value: 8, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  { value: 7, timestamp: new Date() },
];

const MOCK_ENTRIES: EnergyEntry[] = [
  {
    id: '1',
    value: 7,
    timestamp: new Date(),
    notes: 'Feeling good after morning routine',
    context: 'morning'
  },
  {
    id: '2', 
    value: 6,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    notes: 'Slight dip after lunch',
    context: 'post_meal'
  },
  {
    id: '3',
    value: 8,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    notes: 'Great energy yesterday morning',
    context: 'morning'
  },
  {
    id: '4',
    value: 4,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    notes: 'Low energy day, took it easy',
    context: 'afternoon'
  },
  {
    id: '5',
    value: 6,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    context: 'evening'
  }
];

export function EnergyDashboard({ 
  onSaveAssessment,
  onExportData,
  className 
}: EnergyDashboardProps) {
  const [currentEnergy, setCurrentEnergy] = useState<number>(7);
  const [showAssessment, setShowAssessment] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const handleAssessment = useCallback((energy: number, notes?: string) => {
    setCurrentEnergy(energy);
    setShowAssessment(false);
    onSaveAssessment?.(energy, notes);
  }, [onSaveAssessment]);

  const handleNewAssessment = useCallback(() => {
    setShowAssessment(true);
    setActiveTab('assess');
  }, []);

  const getEnergyInsights = (energy: number, readings: EnergyReading[]) => {
    const insights: string[] = [];
    
    if (readings.length >= 3) {
      const recent = readings.slice(-3);
      const trend = recent[2].value - recent[0].value;
      
      if (trend > 1) {
        insights.push("Your energy has been improving over the last few days! 🌟");
      } else if (trend < -1) {
        insights.push("Your energy has been declining. Consider extra rest and gentle activities.");
      } else {
        insights.push("Your energy levels have been stable recently.");
      }
    }
    
    if (energy >= 8) {
      insights.push("Excellent energy! This is a great time for your full daily routine.");
    } else if (energy <= 3) {
      insights.push("Low energy detected. Focus on rest and gentle breathing exercises.");
    }
    
    const average = readings.reduce((sum, r) => sum + r.value, 0) / readings.length;
    if (energy > average + 1) {
      insights.push("Your energy is above your recent average - make the most of it!");
    }
    
    return insights;
  };

  const insights = getEnergyInsights(currentEnergy, MOCK_READINGS);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Battery className="h-6 w-6 text-primary" />
                Energy Tracking Dashboard
              </CardTitle>
              <CardDescription>
                Monitor and understand your energy patterns for better pacing
              </CardDescription>
            </div>
            <Button onClick={handleNewAssessment}>
              <Plus className="h-4 w-4 mr-2" />
              New Assessment
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="assess" className="flex items-center gap-2">
            <Battery className="h-4 w-4" />
            Assess
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Current Energy Meter */}
            <EnergyMeter
              currentEnergy={currentEnergy}
              recentReadings={MOCK_READINGS}
              showTrend={true}
              showRecommendations={true}
            />
            
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
                <CardDescription>Your energy at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">This Week's Average</span>
                    <span className="font-semibold">
                      {(MOCK_READINGS.reduce((sum, r) => sum + r.value, 0) / MOCK_READINGS.length).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Best Day</span>
                    <span className="font-semibold text-green-600">
                      {Math.max(...MOCK_READINGS.map(r => r.value))}/10
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Challenging Day</span>
                    <span className="font-semibold text-orange-600">
                      {Math.min(...MOCK_READINGS.map(r => r.value))}/10
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Assessments</span>
                    <span className="font-semibold">{MOCK_ENTRIES.length}</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setActiveTab('history')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  View Full History
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assess">
          <EnergyAssessment
            onAssessment={handleAssessment}
            initialLevel={showAssessment ? undefined : currentEnergy}
          />
        </TabsContent>

        <TabsContent value="history">
          <EnergyHistory
            entries={MOCK_ENTRIES}
            onExport={onExportData}
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Energy Insights
              </CardTitle>
              <CardDescription>
                Personalized observations based on your tracking data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div key={index} className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {insight}
                    </p>
                  </div>
                ))}
                
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    Pacing Tip
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Try to maintain energy levels between 5-7 for optimal daily functioning. 
                    If you're consistently below 4, consider reducing activities and focusing on rest.
                  </p>
                </div>
                
                <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                  <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                    Pattern Recognition
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Look for patterns in your energy levels. Do you have better energy at certain times? 
                    After certain activities? Use this information to plan your day.
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