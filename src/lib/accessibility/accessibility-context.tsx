'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AccessibilityPreferences {
  // Visual preferences
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  largeTouchTargets: boolean;
  
  // Audio preferences
  voiceGuidance: boolean;
  soundEffects: boolean;
  audioDescriptions: boolean;
  
  // Interaction preferences
  keyboardNavigation: boolean;
  screenReader: boolean;
  focusIndicators: boolean;
  
  // Chronic illness specific
  cognitiveSupport: boolean;
  fatigueMode: boolean;
  simplifiedInterface: boolean;
  autoSave: boolean;
}

export interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => void;
  resetPreferences: () => void;
  isHighContrast: boolean;
  isReducedMotion: boolean;
  isFatigueMode: boolean;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
}

const defaultPreferences: AccessibilityPreferences = {
  highContrast: false,
  reducedMotion: false,
  largeText: false,
  largeTouchTargets: false,
  voiceGuidance: false,
  soundEffects: true,
  audioDescriptions: false,
  keyboardNavigation: true,
  screenReader: false,
  focusIndicators: true,
  cognitiveSupport: false,
  fatigueMode: false,
  simplifiedInterface: false,
  autoSave: true,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(defaultPreferences);
  const [mounted, setMounted] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cf-tracker-accessibility-preferences');
      if (stored) {
        try {
          const parsedPreferences = JSON.parse(stored);
          setPreferences({ ...defaultPreferences, ...parsedPreferences });
        } catch (error) {
          console.error('Failed to parse accessibility preferences:', error);
        }
      }

      // Detect system preferences
      detectSystemPreferences();
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('cf-tracker-accessibility-preferences', JSON.stringify(preferences));
      applyAccessibilityStyles();
    }
  }, [preferences, mounted]);

  const detectSystemPreferences = () => {
    if (typeof window === 'undefined') return;

    // Detect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Detect high contrast preference
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    // Detect color scheme preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    setPreferences(prev => ({
      ...prev,
      reducedMotion: prefersReducedMotion,
      highContrast: prefersHighContrast || prefersDark,
    }));
  };

  const applyAccessibilityStyles = () => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    // Apply high contrast mode
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply reduced motion
    if (preferences.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Apply large text
    if (preferences.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Apply large touch targets
    if (preferences.largeTouchTargets) {
      root.classList.add('large-touch-targets');
    } else {
      root.classList.remove('large-touch-targets');
    }

    // Apply fatigue mode
    if (preferences.fatigueMode) {
      root.classList.add('fatigue-mode');
    } else {
      root.classList.remove('fatigue-mode');
    }

    // Apply simplified interface
    if (preferences.simplifiedInterface) {
      root.classList.add('simplified-interface');
    } else {
      root.classList.remove('simplified-interface');
    }

    // Apply focus indicators
    if (preferences.focusIndicators) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }
  };

  const updatePreference = <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
  };

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (typeof document === 'undefined') return;

    // Create or update the live region for screen reader announcements
    let liveRegion = document.getElementById('cf-tracker-live-region');
    
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'cf-tracker-live-region';
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }

    // Update the live region content
    liveRegion.textContent = message;
    
    // Clear the message after a delay to allow for repeated announcements
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 1000);
  };

  const contextValue: AccessibilityContextType = {
    preferences,
    updatePreference,
    resetPreferences,
    isHighContrast: preferences.highContrast,
    isReducedMotion: preferences.reducedMotion,
    isFatigueMode: preferences.fatigueMode,
    announceToScreenReader,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Hook for detecting system accessibility preferences
export function useSystemAccessibilityPreferences() {
  const [systemPrefs, setSystemPrefs] = useState({
    reducedMotion: false,
    highContrast: false,
    prefersDark: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSystemPrefs = () => {
      setSystemPrefs({
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        highContrast: window.matchMedia('(prefers-contrast: high)').matches,
        prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
      });
    };

    // Initial check
    updateSystemPrefs();

    // Listen for changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    reducedMotionQuery.addEventListener('change', updateSystemPrefs);
    highContrastQuery.addEventListener('change', updateSystemPrefs);
    darkModeQuery.addEventListener('change', updateSystemPrefs);

    return () => {
      reducedMotionQuery.removeEventListener('change', updateSystemPrefs);
      highContrastQuery.removeEventListener('change', updateSystemPrefs);
      darkModeQuery.removeEventListener('change', updateSystemPrefs);
    };
  }, []);

  return systemPrefs;
}