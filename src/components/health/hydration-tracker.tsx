"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Droplets, 
  Plus, 
  Minus, 
  Target, 
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HydrationEntry {
  amount: number; // ml
  timestamp: Date;
  type: 'water' | 'herbal_tea' | 'electrolytes' | 'other';
  notes?: string;
}

interface HydrationTrackerProps {
  dailyGoal?: number; // ml
  currentIntake?: number; // ml
  entries?: HydrationEntry[];
  onAddIntake?: (amount: number, type: HydrationEntry['type']) => void;
  onUpdateGoal?: (goal: number) => void;
  className?: string;
}

const QUICK_AMOUNTS = [
  { amount: 250, label: '1 Cup', icon: '☕' },
  { amount: 500, label: '1 Bottle', icon: '🍼' },
  { amount: 750, label: '1.5 Cups', icon: '🥤' },
  { amount: 1000, label: '1 Liter', icon: '🧴' },
];

const HYDRATION_TYPES = {
  water: { label: 'Water', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', multiplier: 1.0 },
  herbal_tea: { label: 'Herbal Tea', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', multiplier: 0.9 },
  electrolytes: { label: 'Electrolytes', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', multiplier: 1.1 },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', multiplier: 0.8 }
};

export function HydrationTracker({
  dailyGoal = 2000,
  currentIntake = 0,
  entries = [],
  onAddIntake,
  onUpdateGoal,
  className
}: HydrationTrackerProps) {
  const [selectedType, setSelectedType] = useState<HydrationEntry['type']>('water');
  const [customAmount, setCustomAmount] = useState('');

  // Calculate effective hydration (accounting for different liquid types)
  const effectiveIntake = useMemo(() => {
    return entries.reduce((total, entry) => {
      const multiplier = HYDRATION_TYPES[entry.type].multiplier;
      return total + (entry.amount * multiplier);
    }, 0);
  }, [entries]);

  const progressPercentage = Math.min((effectiveIntake / dailyGoal) * 100, 100);
  const remainingAmount = Math.max(dailyGoal - effectiveIntake, 0);

  const handleQuickAdd = useCallback((amount: number) => {
    onAddIntake?.(amount, selectedType);
  }, [onAddIntake, selectedType]);

  const handleCustomAdd = useCallback(() => {
    const amount = parseInt(customAmount);
    if (amount > 0) {
      onAddIntake?.(amount, selectedType);
      setCustomAmount('');
    }
  }, [customAmount, onAddIntake, selectedType]);

  const getHydrationStatus = () => {
    const percentage = progressPercentage;
    if (percentage >= 100) return { status: 'excellent', message: 'Excellent hydration! 🌟', color: 'text-green-600' };
    if (percentage >= 80) return { status: 'good', message: 'Good hydration level', color: 'text-green-600' };
    if (percentage >= 60) return { status: 'moderate', message: 'Moderate hydration', color: 'text-yellow-600' };
    if (percentage >= 40) return { status: 'low', message: 'Low hydration - drink more', color: 'text-orange-600' };
    return { status: 'critical', message: 'Critical - need more fluids', color: 'text-red-600' };
  };

  const getRecommendations = () => {
    const recs: string[] = [];
    const percentage = progressPercentage;
    
    if (percentage < 50) {
      recs.push("Start with small, frequent sips rather than large amounts");
      recs.push("Add electrolytes if you've been sweating or feeling dizzy");
    } else if (percentage < 80) {
      recs.push("You're on track! Keep sipping throughout the day");
      recs.push("Herbal teas count toward your hydration goal");
    } else {
      recs.push("Great job staying hydrated!");
      recs.push("Maintain this level throughout the day");
    }
    
    const now = new Date();
    const hour = now.getHours();
    
    if (hour < 12 && percentage < 25) {
      recs.push("Morning hydration is important - start your day with water");
    } else if (hour > 18 && percentage < 70) {
      recs.push("Evening catch-up needed - but avoid too much before bed");
    }
    
    return recs;
  };

  const todaysEntries = entries.filter(entry => {
    const today = new Date();
    const entryDate = new Date(entry.timestamp);
    return entryDate.toDateString() === today.toDateString();
  });

  const hydrationStatus = getHydrationStatus();
  const recommendations = getRecommendations();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-600" />
                Daily Hydration
              </CardTitle>
              <CardDescription>
                Track your fluid intake for optimal health
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(effectiveIntake)}ml
              </div>
              <div className="text-sm text-muted-foreground">
                of {dailyGoal}ml goal
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className={hydrationStatus.color}>
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0ml</span>
                <span className={hydrationStatus.color}>
                  {hydrationStatus.message}
                </span>
                <span>{dailyGoal}ml</span>
              </div>
            </div>
            
            {/* Status and Remaining */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-lg font-semibold text-blue-600">
                  {remainingAmount}ml
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Remaining
                </div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-lg font-semibold text-green-600">
                  {todaysEntries.length}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  Drinks Today
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Add Section */}
      <Card>
        <CardHeader>
          <CardTitle>Add Hydration</CardTitle>
          <CardDescription>
            Quick logging for different types of fluids
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Liquid Type Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {Object.entries(HYDRATION_TYPES).map(([type, config]) => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(type as HydrationEntry['type'])}
                className="h-auto p-3"
              >
                <div className="text-center">
                  <div className="font-medium">{config.label}</div>
                  <div className="text-xs opacity-75">
                    {config.multiplier}x value
                  </div>
                </div>
              </Button>
            ))}
          </div>
          
          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {QUICK_AMOUNTS.map((item) => (
              <Button
                key={item.amount}
                variant="outline"
                onClick={() => handleQuickAdd(item.amount)}
                className="h-auto p-3"
              >
                <div className="text-center">
                  <div className="text-lg mb-1">{item.icon}</div>
                  <div className="font-medium">{item.amount}ml</div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                </div>
              </Button>
            ))}
          </div>
          
          {/* Custom Amount */}
          <div className="flex gap-2">
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Custom amount (ml)"
              className="flex-1 p-2 border rounded-md"
              min="1"
              max="2000"
            />
            <Button onClick={handleCustomAdd} disabled={!customAmount}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today's Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today's Hydration Log
          </CardTitle>
          <CardDescription>
            {todaysEntries.length} entries recorded today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todaysEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Droplets className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hydration logged today</p>
              <p className="text-sm">Start tracking your fluid intake above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todaysEntries
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Droplets className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium">{entry.amount}ml</div>
                        <div className="text-sm text-muted-foreground">
                          {entry.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary"
                      className={HYDRATION_TYPES[entry.type].color}
                    >
                      {HYDRATION_TYPES[entry.type].label}
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {progressPercentage >= 80 ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <Target className="h-5 w-5 text-blue-600" />
            )}
            Hydration Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                <p className="text-sm">{rec}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💧 <strong>Chronic Illness Tip:</strong> Dehydration can worsen fatigue and brain fog. 
              Aim for consistent, gentle hydration throughout the day rather than large amounts at once.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}