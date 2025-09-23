'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Moon, 
  Sun, 
  Clock, 
  Shield, 
  Smartphone, 
  Home, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Lightbulb
} from 'lucide-react';

interface SleepOptimizationProps {
  userId: string;
  currentDate?: Date;
  onSleepDataUpdate?: (data: SleepOptimizationData) => void;
}

interface SleepOptimizationData {
  date: string;
  bluelightReduction: boolean;
  screenReplacement: boolean;
  environmentOptimized: boolean;
  bedtime?: string;
  sleepQuality?: number;
  notes?: string;
}

interface SleepTip {
  id: string;
  category: 'environment' | 'routine' | 'technology' | 'supplements';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  evidenceBased: boolean;
}

const sleepTips: SleepTip[] = [
  {
    id: 'blue-light',
    category: 'technology',
    title: 'Blue Light Reduction',
    description: 'Use blue light blocking glasses or screen filters 2-3 hours before bedtime to support natural melatonin production.',
    priority: 'high',
    evidenceBased: true
  },
  {
    id: 'screen-replacement',
    category: 'routine',
    title: 'Screen-Free Evening Activities',
    description: 'Replace screens with calming activities like gentle reading, meditation, or light stretching.',
    priority: 'high',
    evidenceBased: true
  },
  {
    id: 'room-temperature',
    category: 'environment',
    title: 'Cool Room Temperature',
    description: 'Keep bedroom between 16-19°C (60-67°F) for optimal sleep quality.',
    priority: 'medium',
    evidenceBased: true
  },
  {
    id: 'darkness',
    category: 'environment',
    title: 'Complete Darkness',
    description: 'Use blackout curtains or eye mask to eliminate light sources that can disrupt sleep cycles.',
    priority: 'high',
    evidenceBased: true
  },
  {
    id: 'magnesium',
    category: 'supplements',
    title: 'Magnesium Supplementation',
    description: 'Consider magnesium glycinate 1-2 hours before bed to support muscle relaxation and sleep quality.',
    priority: 'medium',
    evidenceBased: true
  },
  {
    id: 'consistent-schedule',
    category: 'routine',
    title: 'Consistent Sleep Schedule',
    description: 'Go to bed and wake up at the same time daily, even on weekends, to regulate your circadian rhythm.',
    priority: 'high',
    evidenceBased: true
  }
];

export function SleepOptimization({ userId, currentDate = new Date(), onSleepDataUpdate }: SleepOptimizationProps) {
  const [sleepData, setSleepData] = useState<SleepOptimizationData>({
    date: currentDate.toISOString().split('T')[0],
    bluelightReduction: false,
    screenReplacement: false,
    environmentOptimized: false,
  });

  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [bedtime, setBedtime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isEvening, setIsEvening] = useState(false);

  // Check if it's evening (after 6 PM)
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      setIsEvening(hour >= 18 || hour <= 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleChecklistChange = (field: keyof SleepOptimizationData, checked: boolean) => {
    const updatedData = { ...sleepData, [field]: checked };
    setSleepData(updatedData);
    
    if (onSleepDataUpdate) {
      onSleepDataUpdate(updatedData);
    }
  };

  const handleSleepQualitySubmit = () => {
    const updatedData = {
      ...sleepData,
      sleepQuality,
      bedtime: bedtime || undefined,
      notes: notes || undefined,
    };
    
    setSleepData(updatedData);
    
    if (onSleepDataUpdate) {
      onSleepDataUpdate(updatedData);
    }
  };

  const getCompletionPercentage = () => {
    const checklist = [sleepData.bluelightReduction, sleepData.screenReplacement, sleepData.environmentOptimized];
    const completed = checklist.filter(Boolean).length;
    return Math.round((completed / checklist.length) * 100);
  };

  const getQualityColor = (quality: number) => {
    if (quality <= 3) return 'text-red-600';
    if (quality <= 5) return 'text-orange-600';
    if (quality <= 7) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getQualityLabel = (quality: number) => {
    if (quality <= 2) return 'Very Poor';
    if (quality <= 4) return 'Poor';
    if (quality <= 6) return 'Fair';
    if (quality <= 8) return 'Good';
    return 'Excellent';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-indigo-600" />
            <CardTitle>Sleep Optimization</CardTitle>
            {isEvening && (
              <Badge variant="secondary" className="ml-auto">
                <Clock className="h-3 w-3 mr-1" />
                Evening Mode
              </Badge>
            )}
          </div>
          <CardDescription>
            Gentle sleep preparation and quality tracking for better rest and recovery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="checklist" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="checklist">Evening Checklist</TabsTrigger>
              <TabsTrigger value="quality">Sleep Quality</TabsTrigger>
              <TabsTrigger value="tips">Sleep Tips</TabsTrigger>
            </TabsList>

            <TabsContent value="checklist" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Evening Routine Checklist</h3>
                  <div className="flex items-center gap-2">
                    <Progress value={getCompletionPercentage()} className="w-20" />
                    <span className="text-sm text-muted-foreground">
                      {getCompletionPercentage()}%
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 rounded-lg border">
                    <Checkbox
                      id="bluelight"
                      checked={sleepData.bluelightReduction}
                      onCheckedChange={(checked) => 
                        handleChecklistChange('bluelightReduction', checked as boolean)
                      }
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <label htmlFor="bluelight" className="font-medium cursor-pointer">
                          Blue Light Protection
                        </label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Using blue light blocking glasses or screen filters
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg border">
                    <Checkbox
                      id="screen-replacement"
                      checked={sleepData.screenReplacement}
                      onCheckedChange={(checked) => 
                        handleChecklistChange('screenReplacement', checked as boolean)
                      }
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-purple-600" />
                        <label htmlFor="screen-replacement" className="font-medium cursor-pointer">
                          Screen-Free Activities
                        </label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Replaced screens with calming activities (reading, meditation, stretching)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg border">
                    <Checkbox
                      id="environment"
                      checked={sleepData.environmentOptimized}
                      onCheckedChange={(checked) => 
                        handleChecklistChange('environmentOptimized', checked as boolean)
                      }
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-green-600" />
                        <label htmlFor="environment" className="font-medium cursor-pointer">
                          Sleep Environment
                        </label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Room is cool, dark, and quiet for optimal sleep
                      </p>
                    </div>
                  </div>
                </div>

                {getCompletionPercentage() === 100 && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-green-800 font-medium">
                      Evening routine complete! You're ready for restful sleep.
                    </span>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Sleep Quality Tracking</h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="bedtime-input" className="block text-sm font-medium mb-2">
                      Bedtime (optional)
                    </label>
                    <input
                      id="bedtime-input"
                      type="time"
                      value={bedtime}
                      onChange={(e) => setBedtime(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Sleep Quality (1-10 scale)
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                        <Button
                          key={rating}
                          variant={sleepQuality === rating ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSleepQuality(rating)}
                          className="h-10"
                        >
                          {rating}
                        </Button>
                      ))}
                    </div>
                    {sleepQuality && (
                      <p className={`text-sm mt-2 ${getQualityColor(sleepQuality)}`}>
                        {getQualityLabel(sleepQuality)} sleep quality
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Sleep Notes (optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any observations about your sleep..."
                      className="w-full p-2 border rounded-md h-20 resize-none"
                      maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {notes.length}/200 characters
                    </p>
                  </div>

                  <Button 
                    onClick={handleSleepQualitySubmit}
                    className="w-full"
                    disabled={!sleepQuality}
                  >
                    Save Sleep Data
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tips" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Evidence-Based Sleep Tips</h3>
                
                <div className="space-y-3">
                  {sleepTips.map((tip) => (
                    <Card key={tip.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {tip.category === 'environment' && <Home className="h-5 w-5 text-green-600" />}
                          {tip.category === 'routine' && <Clock className="h-5 w-5 text-blue-600" />}
                          {tip.category === 'technology' && <Shield className="h-5 w-5 text-purple-600" />}
                          {tip.category === 'supplements' && <Lightbulb className="h-5 w-5 text-orange-600" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{tip.title}</h4>
                            <Badge 
                              variant={tip.priority === 'high' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {tip.priority}
                            </Badge>
                            {tip.evidenceBased && (
                              <Badge variant="outline" className="text-xs">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Evidence-based
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {tip.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800">
                        <strong>Important:</strong> These are general wellness suggestions, not medical advice. 
                        Always consult with your healthcare provider about sleep issues, especially if you have 
                        chronic fatigue or other health conditions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}