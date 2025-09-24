// Voice Guidance System for Eyes-Closed Activities
// Provides spoken instructions for breathing exercises, movement sessions, and navigation

export interface VoiceGuidanceOptions {
  rate?: number; // Speech rate (0.1 to 10)
  pitch?: number; // Speech pitch (0 to 2)
  volume?: number; // Speech volume (0 to 1)
  voice?: string; // Preferred voice name
  lang?: string; // Language code
}

export interface GuidanceScript {
  id: string;
  title: string;
  steps: GuidanceStep[];
  totalDuration?: number; // in seconds
  category: 'breathing' | 'movement' | 'meditation' | 'navigation';
}

export interface GuidanceStep {
  id: string;
  text: string;
  duration?: number; // in seconds
  pause?: number; // pause after step in seconds
  emphasis?: 'normal' | 'strong' | 'gentle';
  tone?: 'instructional' | 'encouraging' | 'calming';
}

class VoiceGuidanceService {
  private synthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isEnabled = false;
  private options: VoiceGuidanceOptions = {
    rate: 0.8,
    pitch: 1.0,
    volume: 0.8,
    lang: 'en-US',
  };
  private voices: SpeechSynthesisVoice[] = [];
  private currentScript: GuidanceScript | null = null;
  private currentStepIndex = 0;
  private isPaused = false;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
      
      // Listen for voices changed event
      this.synthesis.addEventListener('voiceschanged', () => {
        this.loadVoices();
      });
    }
  }

  private loadVoices() {
    if (!this.synthesis) return;
    
    this.voices = this.synthesis.getVoices();
    
    // Prefer gentle, calm voices for chronic illness support
    const preferredVoices = [
      'Google UK English Female',
      'Microsoft Zira - English (United States)',
      'Alex',
      'Samantha',
      'Karen',
    ];

    for (const voiceName of preferredVoices) {
      const voice = this.voices.find(v => v.name.includes(voiceName));
      if (voice) {
        this.options.voice = voice.name;
        break;
      }
    }
  }

  public enable(options?: Partial<VoiceGuidanceOptions>) {
    this.isEnabled = true;
    if (options) {
      this.options = { ...this.options, ...options };
    }
    this.emit('enabled');
  }

  public disable() {
    this.isEnabled = false;
    this.stop();
    this.emit('disabled');
  }

  public isVoiceGuidanceEnabled(): boolean {
    return this.isEnabled && !!this.synthesis;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => 
      voice.lang.startsWith('en') && 
      !voice.name.includes('Google') // Prefer system voices for reliability
    );
  }

  public updateOptions(options: Partial<VoiceGuidanceOptions>) {
    this.options = { ...this.options, ...options };
  }

  public speak(text: string, options?: Partial<VoiceGuidanceOptions>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isEnabled || !this.synthesis) {
        resolve();
        return;
      }

      // Stop any current speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const finalOptions = { ...this.options, ...options };

      // Set voice properties
      utterance.rate = finalOptions.rate || 0.8;
      utterance.pitch = finalOptions.pitch || 1.0;
      utterance.volume = finalOptions.volume || 0.8;
      utterance.lang = finalOptions.lang || 'en-US';

      // Find and set preferred voice
      if (finalOptions.voice) {
        const voice = this.voices.find(v => v.name === finalOptions.voice);
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  public async startScript(script: GuidanceScript): Promise<void> {
    if (!this.isEnabled) return;

    this.currentScript = script;
    this.currentStepIndex = 0;
    this.isPaused = false;

    this.emit('scriptStarted', script);

    try {
      // Introduction
      await this.speak(`Starting ${script.title}. You can pause at any time by saying "pause" or pressing the space bar.`);
      
      // Execute steps
      await this.executeSteps();
      
      // Completion
      await this.speak('Session complete. Take a moment to notice how you feel.');
      
      this.emit('scriptCompleted', script);
    } catch (error) {
      this.emit('scriptError', error);
      throw error;
    } finally {
      this.currentScript = null;
      this.currentStepIndex = 0;
    }
  }

  private async executeSteps(): Promise<void> {
    if (!this.currentScript) return;

    for (let i = this.currentStepIndex; i < this.currentScript.steps.length; i++) {
      if (this.isPaused) {
        this.currentStepIndex = i;
        return;
      }

      const step = this.currentScript.steps[i];
      this.emit('stepStarted', step, i);

      try {
        // Speak the step
        await this.speak(this.formatStepText(step));

        // Wait for step duration if specified
        if (step.duration) {
          await this.wait(step.duration * 1000);
        }

        // Pause after step if specified
        if (step.pause) {
          await this.wait(step.pause * 1000);
        }

        this.emit('stepCompleted', step, i);
      } catch (error) {
        this.emit('stepError', step, i, error);
        throw error;
      }
    }
  }

  private formatStepText(step: GuidanceStep): string {
    let text = step.text;

    // Add emphasis based on tone
    switch (step.tone) {
      case 'encouraging':
        text = `${text} You're doing great.`;
        break;
      case 'calming':
        text = `${text} Let yourself relax.`;
        break;
    }

    // Add pauses for better pacing
    text = text.replace(/\./g, '... ');
    text = text.replace(/,/g, ', ');

    return text;
  }

  public pause(): void {
    if (this.synthesis) {
      this.synthesis.pause();
    }
    this.isPaused = true;
    this.emit('paused');
  }

  public resume(): void {
    if (this.synthesis) {
      this.synthesis.resume();
    }
    this.isPaused = false;
    this.emit('resumed');
    
    // Continue with remaining steps if in a script
    if (this.currentScript) {
      this.executeSteps();
    }
  }

  public stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.currentUtterance = null;
    this.currentScript = null;
    this.currentStepIndex = 0;
    this.isPaused = false;
    this.emit('stopped');
  }

  public getCurrentStep(): { step: GuidanceStep; index: number } | null {
    if (!this.currentScript || this.currentStepIndex >= this.currentScript.steps.length) {
      return null;
    }
    
    return {
      step: this.currentScript.steps[this.currentStepIndex],
      index: this.currentStepIndex,
    };
  }

  public getProgress(): number {
    if (!this.currentScript) return 0;
    return (this.currentStepIndex / this.currentScript.steps.length) * 100;
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Event system
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }
}

// Predefined guidance scripts
export const breathingScripts: GuidanceScript[] = [
  {
    id: 'basic-breathing',
    title: 'Basic Breathing Exercise',
    category: 'breathing',
    totalDuration: 300, // 5 minutes
    steps: [
      {
        id: 'intro',
        text: 'Find a comfortable position, either sitting or lying down. Close your eyes if that feels comfortable.',
        pause: 3,
        tone: 'calming',
      },
      {
        id: 'breath-awareness',
        text: 'Begin by simply noticing your natural breath. There\'s nothing to change right now.',
        pause: 5,
        tone: 'calming',
      },
      {
        id: 'inhale-1',
        text: 'Now, breathe in slowly through your nose for 4 counts. In... 2... 3... 4.',
        duration: 4,
        tone: 'instructional',
      },
      {
        id: 'hold-1',
        text: 'Hold gently for 2 counts. 1... 2.',
        duration: 2,
        tone: 'instructional',
      },
      {
        id: 'exhale-1',
        text: 'Exhale slowly through your mouth for 6 counts. Out... 2... 3... 4... 5... 6.',
        duration: 6,
        tone: 'instructional',
      },
      {
        id: 'continue',
        text: 'Continue this pattern at your own pace. Breathe in for 4, hold for 2, out for 6.',
        pause: 2,
        tone: 'encouraging',
      },
    ],
  },
  {
    id: 'energy-breathing',
    title: 'Gentle Energy Breathing',
    category: 'breathing',
    totalDuration: 180, // 3 minutes
    steps: [
      {
        id: 'setup',
        text: 'This is a gentle breathing exercise to help restore energy without strain.',
        pause: 2,
        tone: 'calming',
      },
      {
        id: 'natural-breath',
        text: 'Start with your natural breath. No effort needed.',
        pause: 3,
        tone: 'calming',
      },
      {
        id: 'gentle-inhale',
        text: 'On your next inhale, breathe in just a little deeper than usual.',
        pause: 2,
        tone: 'instructional',
      },
      {
        id: 'gentle-exhale',
        text: 'And exhale with a soft sigh, releasing any tension.',
        pause: 2,
        tone: 'calming',
      },
      {
        id: 'continue-gentle',
        text: 'Continue this gentle rhythm. Only as much as feels comfortable.',
        pause: 1,
        tone: 'encouraging',
      },
    ],
  },
];

export const movementScripts: GuidanceScript[] = [
  {
    id: 'gentle-warmup',
    title: 'Gentle Movement Warmup',
    category: 'movement',
    totalDuration: 600, // 10 minutes
    steps: [
      {
        id: 'start-position',
        text: 'Begin in a comfortable seated or standing position. Listen to your body.',
        pause: 3,
        tone: 'calming',
      },
      {
        id: 'neck-rolls',
        text: 'Gently roll your shoulders back and down. Let your neck lengthen.',
        duration: 10,
        tone: 'instructional',
      },
      {
        id: 'arm-circles',
        text: 'Make small, gentle circles with your arms. Only as much as feels good.',
        duration: 15,
        tone: 'instructional',
      },
      {
        id: 'check-in',
        text: 'Pause and check in with your body. How are you feeling?',
        pause: 5,
        tone: 'encouraging',
      },
    ],
  },
];

// Export singleton instance
export const voiceGuidance = new VoiceGuidanceService();