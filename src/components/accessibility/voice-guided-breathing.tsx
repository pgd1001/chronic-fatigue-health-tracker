'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  Settings,
  Eye,
  EyeOff,
  Heart
} from 'lucide-react';
import { useAccessibility } from '@/lib/accessibility/accessibility-context';
import { voiceGuidance, breathingScripts, type GuidanceScript, type GuidanceStep } from '@/lib/accessibility/voice-guidance';

interface VoiceGuidedBreathingProps {
  className?: string;
}

export function VoiceGuidedBreathing({ className = '' }: VoiceGuidedBreathingProps) {
  const { preferences, announceToScreenReader } = useAccessibility();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentScript, setCurrentScript] = useState<GuidanceScript | null>(null);
  const [currentStep, setCurrentStep] = useState<{ step: GuidanceStep; index: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [eyesClosed, setEyesClosed] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(preferences.voiceGuidance);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setVoiceEnabled(preferences.voiceGuidance);
  }, [preferences.voiceGuidance]);

  useEffect(() => {
    // Set up voice guidance event listeners
    const handleScriptStarted = (script: GuidanceScript) => {
      setCurrentScript(script);
      setIsPlaying(true);
      setIsPaused(false);
      announceToScreenReader(`Starting ${script.title}`);
    };

    const handleScriptCompleted = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentScript(null);
      setCurrentStep(null);
      setProgress(100);
      announceToScreenReader('Breathing session completed');
    };

    const handleStepStarted = (step: GuidanceStep, index: number) => {
      setCurrentStep({ step, index });
      setProgress(voiceGuidance.getProgress());
    };

    const handlePaused = () => {
      setIsPaused(true);
      announceToScreenReader('Session paused');
    };

    const handleResumed = () => {
      setIsPaused(false);
      announceToScreenReader('Session resumed');
    };

    const handleStopped = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentScript(null);
      setCurrentStep(null);
      setProgress(0);
      announceToScreenReader('Session stopped');
    };

    voiceGuidance.on('scriptStarted', handleScriptStarted);
    voiceGuidance.on('scriptCompleted', handleScriptCompleted);
    voiceGuidance.on('stepStarted', handleStepStarted);
    voiceGuidance.on('paused', handlePaused);
    voiceGuidance.on('resumed', handleResumed);
    voiceGuidance.on('stopped', handleStopped);

    return () => {
      voiceGuidance.off('scriptStarted', handleScriptStarted);
      voiceGuidance.off('scriptCompleted', handleScriptCompleted);
      voiceGuidance.off('stepStarted', handleStepStarted);
      voiceGuidance.off('paused', handlePaused);
      voiceGuidance.off('resumed', handleResumed);
      voiceGuidance.off('stopped', handleStopped);
    };
  }, [announceToScreenReader]);

  useEffect(() => {
    // Update progress periodically when playing
    if (isPlaying && !isPaused) {
      intervalRef.current = setInterval(() => {
        setProgress(voiceGuidance.getProgress());
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, isPaused]);

  const startSession = async (script: GuidanceScript) => {
    if (!voiceEnabled) {
      announceToScreenReader('Voice guidance is disabled. Please enable it in accessibility settings.');
      return;
    }

    try {
      voiceGuidance.enable();
      await voiceGuidance.startScript(script);
    } catch (error) {
      console.error('Failed to start voice guidance:', error);
      announceToScreenReader('Failed to start voice guidance session');
    }
  };

  const pauseSession = () => {
    voiceGuidance.pause();
  };

  const resumeSession = () => {
    voiceGuidance.resume();
  };

  const stopSession = () => {
    voiceGuidance.stop();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const toggleVoice = () => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    
    if (newState) {
      voiceGuidance.enable();
      announceToScreenReader('Voice guidance enabled');
    } else {
      voiceGuidance.disable();
      announceToScreenReader('Voice guidance disabled');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className={`${eyesClosed ? 'bg-gray-900 text-white border-gray-700' : ''}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-blue-600" />
                Voice-Guided Breathing
              </CardTitle>
              <CardDescription className={eyesClosed ? 'text-gray-300' : ''}>
                Gentle breathing exercises with spoken guidance for eyes-closed practice
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEyesClosed(!eyesClosed)}
                className={eyesClosed ? 'bg-gray-800 border-gray-600 text-white' : ''}
              >
                {eyesClosed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {eyesClosed ? 'Eyes Open' : 'Eyes Closed'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleVoice}
                className={voiceEnabled ? 'bg-blue-50 border-blue-200' : ''}
              >
                {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                Voice
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Current Session Status */}
        {isPlaying && (
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{currentScript?.title}</h3>
                  {currentStep && (
                    <p className={`text-sm ${eyesClosed ? 'text-gray-300' : 'text-muted-foreground'}`}>
                      Step {currentStep.index + 1}: {currentStep.step.text}
                    </p>
                  )}
                </div>
                <Badge variant={isPaused ? 'secondary' : 'default'}>
                  {isPaused ? 'Paused' : 'Playing'}
                </Badge>
              </div>

              <Progress value={progress} className="w-full" />

              <div className="flex gap-2 justify-center">
                {isPaused ? (
                  <Button onClick={resumeSession} size="lg">
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                ) : (
                  <Button onClick={pauseSession} variant="outline" size="lg">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}
                <Button onClick={stopSession} variant="outline" size="lg">
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Available Sessions */}
      {!isPlaying && (
        <div className="grid gap-4 md:grid-cols-2">
          {breathingScripts.map((script) => (
            <Card 
              key={script.id} 
              className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                eyesClosed ? 'bg-gray-900 text-white border-gray-700 hover:bg-gray-800' : ''
              }`}
              onClick={() => startSession(script)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{script.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {Math.floor((script.totalDuration || 0) / 60)} min
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {script.steps.length} steps
                  </Badge>
                  {voiceEnabled && (
                    <Badge variant="default" className="text-xs">
                      <Volume2 className="h-3 w-3 mr-1" />
                      Voice Guided
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-sm ${eyesClosed ? 'text-gray-300' : 'text-muted-foreground'} mb-4`}>
                  {script.steps[0]?.text || 'A gentle breathing exercise to help you relax and restore energy.'}
                </p>
                <Button 
                  className="w-full" 
                  disabled={!voiceEnabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    startSession(script);
                  }}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Session
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Voice Guidance Disabled Notice */}
      {!voiceEnabled && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <VolumeX className="h-5 w-5" />
              <span className="font-medium">Voice Guidance Disabled</span>
            </div>
            <p className="text-sm text-yellow-700 mt-2">
              Enable voice guidance in accessibility settings to use spoken instructions for eyes-closed breathing exercises.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleVoice}
              className="mt-3 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Enable Voice Guidance
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instructions for Eyes-Closed Mode */}
      {eyesClosed && (
        <Card className="bg-gray-900 text-white border-gray-700">
          <CardContent className="pt-6">
            <h3 className="font-medium text-gray-100 mb-2">Eyes-Closed Mode Active</h3>
            <div className="text-sm text-gray-300 space-y-1">
              <p>• Voice guidance will provide all instructions</p>
              <p>• Use spacebar to pause/resume</p>
              <p>• Press Escape to stop the session</p>
              <p>• Focus on your breath and let the voice guide you</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keyboard Shortcuts */}
      <Card className={eyesClosed ? 'bg-gray-900 text-white border-gray-700' : ''}>
        <CardContent className="pt-6">
          <h3 className={`font-medium mb-2 ${eyesClosed ? 'text-gray-100' : ''}`}>
            Keyboard Shortcuts
          </h3>
          <div className={`text-sm space-y-1 ${eyesClosed ? 'text-gray-300' : 'text-muted-foreground'}`}>
            <p><kbd className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">Space</kbd> Pause/Resume</p>
            <p><kbd className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">Escape</kbd> Stop session</p>
            <p><kbd className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">V</kbd> Toggle voice guidance</p>
            <p><kbd className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">E</kbd> Toggle eyes-closed mode</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Keyboard event handler hook
export function useBreathingKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case ' ':
          event.preventDefault();
          // Toggle pause/resume
          const currentStep = voiceGuidance.getCurrentStep();
          if (currentStep) {
            voiceGuidance.pause();
          } else {
            voiceGuidance.resume();
          }
          break;
        
        case 'Escape':
          event.preventDefault();
          voiceGuidance.stop();
          break;
        
        case 'v':
        case 'V':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            // Toggle voice guidance
            if (voiceGuidance.isVoiceGuidanceEnabled()) {
              voiceGuidance.disable();
            } else {
              voiceGuidance.enable();
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}