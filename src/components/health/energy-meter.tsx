"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Battery, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  CheckCircle2,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EnergyReading {
  value: number;
  timestamp: Date;
  notes?: string;
}

interface EnergyMeterProps {
  currentEnergy?: number;
  recentReadings?: EnergyReading[];
  showTrend?: boolean;
  showRecommendations?: boolean;
  className?: string;
}

const ENERGY_COLORS = {
  1: { bg: "bg-red-500", text: "text-red-600", ring: "ring-red-200" },
  2: { bg: "bg-red-400", text: "text-red-500", ring: "ring-red-200" },
  3: { bg: "bg-orange-400", text: "text-orange-600", ring: "ring-orange-200" },
  4: { bg: "bg-orange-300", text: "text-orange-500", ring: "ring-orange-200" },
  5: { bg: "bg-yellow-400", text: "text-yellow-600", ring: "ring-yellow-200" },
  6: { bg: "bg-yellow-300", text: "text-yellow-500", ring: "ring-yellow-200" },
  7: { bg: "bg-green-400", text: "text-green-600", ring: "ring-green-200" },
  8: { bg: "bg-green-500", text: "text-green-600", ring: "ring-green-200" },
  9: { bg: "bg-emerald-500", text: "text-emerald-600", ring: "ring-emerald-200" },
  10: { bg: "bg-emerald-600", text: "text-emerald-600", ring: "ring-emerald-200" },
} as const;

const ENERGY_LABELS = {
  1: "Exhausted",
  2: "Very Low", 
  3: "Low",
  4: "Below Average",
  5: "Moderate",
  6: "Fair", 
  7: "Good",
  8: "Very Good",
  9: "Excellent",
  10: "Peak"
} as const;

export function EnergyMeter({ 
  currentEnergy, 
  recentReadings = [], 
  showTrend = true,
  showRecommendations = true,
  className 
}: EnergyMeterProps) {
  
  const energyData = useMemo(() => {
    if (!currentEnergy) return null;
    
    const colors = ENERGY_COLORS[currentEnergy as keyof typeof ENERGY_COLORS];
    const label = ENERGY_LABELS[currentEnergy as keyof typeof ENERGY_LABELS];
    
    return { colors, label };
  }, [currentEnergy]);

  const trendData = useMemo(() => {
    if (!showTrend || recentReadings.length < 2) return null;
    
    const recent = recentReadings.slice(-7); // Last 7 readings
    const current = recent[recent.length - 1]?.value || 0;
    const previous = recent[recent.length - 2]?.value || 0;
    const average = recent.reduce((sum, r) => sum + r.value, 0) / recent.length;
    
    const difference = current - previous;
    const trend = Math.abs(difference) < 0.5 ? 'stable' : 
                  difference > 0 ? 'improving' : 'declining';
    
    return {
      trend,
      difference,
      average: Math.round(average * 10) / 10,
      readings: recent
    };
  }, [recentReadings, showTrend]);

  const recommendations = useMemo(() => {
    if (!showRecommendations || !currentEnergy) return [];
    
    const recs: string[] = [];
    
    if (currentEnergy <= 3) {
      recs.push("Consider resting and gentle breathing exercises only");
      recs.push("Avoid demanding activities today");
      recs.push("Focus on hydration and gentle nutrition");
    } else if (currentEnergy <= 5) {
      recs.push("Light activities are appropriate with frequent breaks");
      recs.push("Consider your daily anchor routine with modifications");
      recs.push("Listen to your body and pace yourself");
    } else if (currentEnergy <= 7) {
      recs.push("Good energy for your daily anchor routine");
      recs.push("You might enjoy a gentle walk or light stretching");
      recs.push("Consider some light household tasks if needed");
    } else {
      recs.push("Great energy for your full daily routine");
      recs.push("Perfect time for movement and gentle exercise");
      recs.push("You might tackle some projects you've been putting off");
    }
    
    return recs;
  }, [currentEnergy, showRecommendations]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600 bg-green-50 dark:bg-green-950';
      case 'declining': return 'text-red-600 bg-red-50 dark:bg-red-950';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950';
    }
  };

  if (!currentEnergy) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6 text-center">
          <Battery className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No Energy Reading
          </h3>
          <p className="text-sm text-muted-foreground">
            Take a moment to assess your current energy level
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Energy Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Battery className="h-5 w-5 text-primary" />
            Current Energy Level
          </CardTitle>
          <CardDescription>
            Your energy assessment helps personalize your routine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Energy Indicator */}
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center ring-4",
                energyData?.colors.bg,
                energyData?.colors.ring
              )}>
                {currentEnergy <= 3 ? (
                  <AlertTriangle className="h-6 w-6 text-white" />
                ) : currentEnergy >= 8 ? (
                  <Zap className="h-6 w-6 text-white" />
                ) : (
                  <Battery className="h-6 w-6 text-white" />
                )}
              </div>
              
              <div>
                <div className="text-3xl font-bold">{currentEnergy}/10</div>
                <div className={cn("text-lg font-semibold", energyData?.colors.text)}>
                  {energyData?.label}
                </div>
              </div>
            </div>
            
            {/* Trend Indicator */}
            {trendData && (
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg",
                getTrendColor(trendData.trend)
              )}>
                {getTrendIcon(trendData.trend)}
                <span className="text-sm font-medium capitalize">
                  {trendData.trend}
                </span>
              </div>
            )}
          </div>
          
          {/* Energy Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Energy Level</span>
              <span>{currentEnergy * 10}%</span>
            </div>
            <Progress 
              value={currentEnergy * 10} 
              className="h-3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Trend Analysis */}
      {trendData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Energy Trends</CardTitle>
            <CardDescription>
              Based on your recent assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{trendData.average}</div>
                <div className="text-sm text-muted-foreground">7-day Average</div>
              </div>
              <div className="text-center">
                <div className={cn(
                  "text-2xl font-bold",
                  trendData.difference > 0 ? "text-green-600" : 
                  trendData.difference < 0 ? "text-red-600" : "text-gray-600"
                )}>
                  {trendData.difference > 0 ? '+' : ''}{trendData.difference.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Change from Yesterday</div>
              </div>
            </div>
            
            {/* Mini Chart */}
            <div className="flex items-end justify-between h-16 gap-1">
              {trendData.readings.map((reading, index) => (
                <div
                  key={index}
                  className="flex-1 bg-primary/20 rounded-t"
                  style={{ height: `${(reading.value / 10) * 100}%` }}
                  title={`${reading.value}/10 - ${reading.timestamp.toLocaleDateString()}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Personalized Recommendations
            </CardTitle>
            <CardDescription>
              Based on your current energy level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💙 Remember: These are gentle suggestions. You know your body best - 
                trust your instincts and adjust as needed.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}