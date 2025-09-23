"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Battery, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnergyAssessmentProps {
  onAssessment?: (energyLevel: number, notes?: string) => void;
  initialLevel?: number;
  className?: string;
}

const ENERGY_LEVELS = [
  { 
    value: 1, 
    label: "Exhausted", 
    description: "Can barely function, need to rest immediately",
    color: "bg-red-500",
    textColor: "text-red-600",
    icon: AlertTriangle
  },
  { 
    value: 2, 
    label: "Very Low", 
    description: "Struggling with basic tasks, very limited energy",
    color: "bg-red-400",
    textColor: "text-red-500",
    icon: Battery
  },
  { 
    value: 3, 
    label: "Low", 
    description: "Can do light activities but need frequent breaks",
    color: "bg-orange-400",
    textColor: "text-orange-600",
    icon: Battery
  },
  { 
    value: 4, 
    label: "Below Average", 
    description: "Limited energy, can do some activities with care",
    color: "bg-orange-300",
    textColor: "text-orange-500",
    icon: Battery
  },
  { 
    value: 5, 
    label: "Moderate", 
    description: "Steady energy for basic daily activities",
    color: "bg-yellow-400",
    textColor: "text-yellow-600",
    icon: Battery
  },
  { 
    value: 6, 
    label: "Fair", 
    description: "Good energy for most activities with some caution",
    color: "bg-yellow-300",
    textColor: "text-yellow-500",
    icon: Battery
  },
  { 
    value: 7, 
    label: "Good", 
    description: "Solid energy levels, can handle normal activities",
    color: "bg-green-400",
    textColor: "text-green-600",
    icon: Zap
  },
  { 
    value: 8, 
    label: "Very Good", 
    description: "High energy, can do more demanding activities",
    color: "bg-green-500",
    textColor: "text-green-600",
    icon: Zap
  },
  { 
    value: 9, 
    label: "Excellent", 
    description: "Very high energy, feeling strong and capable",
    color: "bg-emerald-500",
    textColor: "text-emerald-600",
    icon: Zap
  },
  { 
    value: 10, 
    label: "Peak", 
    description: "Maximum energy, feeling fantastic and energized",
    color: "bg-emerald-600",
    textColor: "text-emerald-600",
    icon: CheckCircle2
  },
];

export function EnergyAssessment({ 
  onAssessment, 
  initialLevel, 
  className 
}: EnergyAssessmentProps) {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(initialLevel || null);
  const [notes, setNotes] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleLevelSelect = (level: number) => {
    setSelectedLevel(level);
    setIsSubmitted(false);
  };

  const handleSubmit = () => {
    if (selectedLevel !== null) {
      onAssessment?.(selectedLevel, notes || undefined);
      setIsSubmitted(true);
    }
  };

  const selectedLevelData = selectedLevel ? ENERGY_LEVELS.find(l => l.value === selectedLevel) : null;

  const getRecommendation = (level: number): string => {
    if (level <= 3) {
      return "Consider resting and gentle breathing exercises only. Listen to your body's need for recovery.";
    } else if (level <= 5) {
      return "Light activities are okay. Consider the daily anchor routine with modifications as needed.";
    } else if (level <= 7) {
      return "Good energy for your daily anchor routine. You might also enjoy a gentle walk.";
    } else {
      return "Great energy! Perfect for your full daily anchor routine and perhaps some additional gentle movement.";
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Battery className="h-5 w-5 text-primary" />
            Energy Assessment
          </CardTitle>
          <CardDescription>
            How are you feeling right now? This helps us personalize your routine.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Energy Level Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ENERGY_LEVELS.map((level) => {
                const Icon = level.icon;
                const isSelected = selectedLevel === level.value;
                
                return (
                  <button
                    key={level.value}
                    onClick={() => handleLevelSelect(level.value)}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all duration-200 text-center hover:scale-105",
                      isSelected 
                        ? "border-primary bg-primary/10 shadow-md" 
                        : "border-muted hover:border-primary/50"
                    )}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", level.color)}>
                        <Icon className="h-3 w-3 text-white" />
                      </div>
                      <div className="text-lg font-bold">{level.value}</div>
                      <div className="text-xs font-medium">{level.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Level Details */}
            {selectedLevelData && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="default" className="text-sm">
                      Level {selectedLevelData.value}
                    </Badge>
                    <span className={cn("font-semibold", selectedLevelData.textColor)}>
                      {selectedLevelData.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {selectedLevelData.description}
                  </p>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💡 <strong>Recommendation:</strong> {getRecommendation(selectedLevelData.value)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes Section */}
            {selectedLevel && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Additional notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 200))}
                  placeholder="How are you feeling? Any specific concerns or observations?"
                  className="w-full p-3 border rounded-lg resize-none h-20 text-sm"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {notes.length}/200 characters
                </p>
              </div>
            )}

            {/* Submit Button */}
            {selectedLevel && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmit}
                  className="flex-1"
                  disabled={isSubmitted}
                >
                  {isSubmitted ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Assessment Recorded
                    </>
                  ) : (
                    "Record Assessment"
                  )}
                </Button>
                {isSubmitted && (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsSubmitted(false)}
                  >
                    Update
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gentle Reminder */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950">
        <CardContent className="p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            🌟 <strong>Remember:</strong> Your energy levels can change throughout the day. 
            It's perfectly okay to reassess and adjust your activities accordingly. 
            You know your body best.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}