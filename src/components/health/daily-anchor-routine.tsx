"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Circle, 
  Wind, 
  Zap, 
  Stretch,
  Timer,
  Heart
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Exercise {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  icon: React.ComponentType<{ className?: string }>;
  instructions: string[];
  completed: boolean;
}

interface DailyAnchorRoutineProps {
  onComplete?: (completedExercises: Exercise[], totalDuration: number) => void;
  onProgress?: (currentExercise: string, progress: number) => void;
  className?: string;
}

const DEFAULT_EXERCISES: Exercise[] = [
  {
    id: "breathing",
    name: "Gentle Breathing",
    description: "Deep, calming breaths to center yourself",
    duration: 300, // 5 minutes
    icon: Wind,
    instructions: [
      "Find a comfortable seated or lying position",
      "Place one hand on your chest, one on your belly",
      "Breathe in slowly through your nose for 4 counts",
      "Hold gently for 2 counts",
      "Exhale slowly through your mouth for 6 counts",
      "Focus on the hand on your belly rising and falling"
    ],
    completed: false,
  },
  {
    id: "mobility",
    name: "Gentle Mobility",
    description: "Soft movements to awaken your body",
    duration: 600, // 10 minutes
    icon: Zap,
    instructions: [
      "Start with gentle neck rolls - 5 each direction",
      "Shoulder rolls - 5 forward, 5 backward",
      "Gentle arm circles - 5 each direction",
      "Seated spinal twists - 5 each side",
      "Ankle circles - 5 each direction",
      "Listen to your body - stop if anything feels uncomfortable"
    ],
    completed: false,
  },
  {
    id: "stretching",
    name: "Mindful Stretching",
    description: "Gentle stretches to release tension",
    duration: 300, // 5 minutes
    icon: Stretch,
    instructions: [
      "Gentle neck stretch - hold 15 seconds each side",
      "Shoulder blade squeeze - hold 10 seconds, repeat 3 times",
      "Seated forward fold - hold 30 seconds",
      "Gentle spinal extension - hold 15 seconds",
      "Deep breathing between each stretch",
      "Never force - stretch should feel good, not painful"
    ],
    completed: false,
  },
];

export function DailyAnchorRoutine({ 
  onComplete, 
  onProgress, 
  className 
}: DailyAnchorRoutineProps) {
  const [exercises, setExercises] = useState<Exercise[]>(DEFAULT_EXERCISES);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [totalSessionTime, setTotalSessionTime] = useState(0);

  const currentExercise = currentExerciseIndex !== null ? exercises[currentExerciseIndex] : null;
  const completedCount = exercises.filter(ex => ex.completed).length;
  const totalExercises = exercises.length;
  const isAllCompleted = completedCount === totalExercises;

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => {
          const newTime = time - 1;
          setTotalSessionTime(prev => prev + 1);
          
          if (currentExercise && onProgress) {
            const progress = ((currentExercise.duration - newTime) / currentExercise.duration) * 100;
            onProgress(currentExercise.name, progress);
          }
          
          return newTime;
        });
      }, 1000);
    } else if (timeRemaining === 0 && isActive && currentExercise) {
      // Exercise completed
      completeCurrentExercise();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, timeRemaining, currentExercise, onProgress]);

  const startExercise = useCallback((index: number) => {
    const exercise = exercises[index];
    if (exercise.completed) return;

    setCurrentExerciseIndex(index);
    setTimeRemaining(exercise.duration);
    setIsActive(true);
    setIsPaused(false);
    setShowInstructions(true);
  }, [exercises]);

  const pauseTimer = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeTimer = useCallback(() => {
    setIsPaused(false);
  }, []);

  const resetTimer = useCallback(() => {
    if (currentExercise) {
      setTimeRemaining(currentExercise.duration);
      setIsActive(false);
      setIsPaused(false);
    }
  }, [currentExercise]);

  const completeCurrentExercise = useCallback(() => {
    if (currentExerciseIndex === null) return;

    setExercises(prev => prev.map((ex, idx) => 
      idx === currentExerciseIndex ? { ...ex, completed: true } : ex
    ));
    
    setIsActive(false);
    setIsPaused(false);
    setCurrentExerciseIndex(null);
    setTimeRemaining(0);
    setShowInstructions(false);

    // Check if all exercises are completed
    const updatedExercises = exercises.map((ex, idx) => 
      idx === currentExerciseIndex ? { ...ex, completed: true } : ex
    );
    
    if (updatedExercises.every(ex => ex.completed) && onComplete) {
      onComplete(updatedExercises, totalSessionTime);
    }
  }, [currentExerciseIndex, exercises, onComplete, totalSessionTime]);

  const skipExercise = useCallback(() => {
    completeCurrentExercise();
  }, [completeCurrentExercise]);

  const resetRoutine = useCallback(() => {
    setExercises(DEFAULT_EXERCISES);
    setCurrentExerciseIndex(null);
    setTimeRemaining(0);
    setIsActive(false);
    setIsPaused(false);
    setShowInstructions(false);
    setTotalSessionTime(0);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    if (!currentExercise) return 0;
    return ((currentExercise.duration - timeRemaining) / currentExercise.duration) * 100;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Daily Anchor Routine
              </CardTitle>
              <CardDescription>
                A gentle 20-minute routine to ground and energize your day
              </CardDescription>
            </div>
            <Badge variant={isAllCompleted ? "default" : "secondary"}>
              {completedCount}/{totalExercises} Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={(completedCount / totalExercises) * 100} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Total time: ~20 minutes • Session time: {formatTime(totalSessionTime)}
          </p>
        </CardContent>
      </Card>

      {/* Exercise List */}
      <div className="grid gap-4">
        {exercises.map((exercise, index) => {
          const Icon = exercise.icon;
          const isCurrent = currentExerciseIndex === index;
          const isCompleted = exercise.completed;
          
          return (
            <Card 
              key={exercise.id} 
              className={cn(
                "transition-all duration-200",
                isCurrent && "ring-2 ring-primary",
                isCompleted && "bg-green-50 dark:bg-green-950"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-full",
                      isCompleted ? "bg-green-100 dark:bg-green-900" : "bg-muted"
                    )}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <Icon className={cn(
                          "h-6 w-6",
                          isCurrent ? "text-primary" : "text-muted-foreground"
                        )} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{exercise.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {exercise.description} • {formatTime(exercise.duration)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isCurrent && (
                      <div className="flex items-center gap-2 mr-4">
                        <Timer className="h-4 w-4 text-primary" />
                        <span className="font-mono text-lg">
                          {formatTime(timeRemaining)}
                        </span>
                      </div>
                    )}
                    
                    {!isCompleted && !isCurrent && (
                      <Button
                        onClick={() => startExercise(index)}
                        size="sm"
                        variant="outline"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    )}
                    
                    {isCurrent && (
                      <div className="flex gap-2">
                        {isActive && !isPaused ? (
                          <Button onClick={pauseTimer} size="sm" variant="outline">
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button onClick={resumeTimer} size="sm" variant="outline">
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button onClick={resetTimer} size="sm" variant="outline">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button onClick={skipExercise} size="sm" variant="ghost">
                          Skip
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Progress bar for current exercise */}
                {isCurrent && (
                  <div className="mt-4">
                    <Progress value={getProgressPercentage()} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Instructions Panel */}
      {showInstructions && currentExercise && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">
              {currentExercise.name} Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {currentExercise.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Circle className="h-2 w-2 mt-2 text-primary flex-shrink-0" />
                  <span className="text-sm">{instruction}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💙 Remember: This is your gentle time. Listen to your body and modify as needed. 
                There's no pressure to be perfect.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Message */}
      {isAllCompleted && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
              Beautiful work! 🌟
            </h3>
            <p className="text-green-700 dark:text-green-300 mb-4">
              You've completed your Daily Anchor Routine. Take a moment to notice how you feel.
            </p>
            <Button onClick={resetRoutine} variant="outline" className="mt-2">
              Start New Session
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}