'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Volume2, 
  Keyboard, 
  Heart, 
  Settings, 
  RotateCcw,
  Info,
  CheckCircle,
  Zap,
  Moon,
  Sun,
  Accessibility
} from 'lucide-react';
import { useAccessibility } from '@/lib/accessibility/accessibility-context';

interface SettingsSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SettingsSection({ title, description, icon, children }: SettingsSectionProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

interface SettingItemProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  badge?: string;
  disabled?: boolean;
}

function SettingItem({ id, label, description, checked, onChange, badge, disabled }: SettingItemProps) {
  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg border bg-card/50">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="mt-1"
        aria-describedby={`${id}-description`}
      />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Label 
            htmlFor={id} 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </Label>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <p id={`${id}-description`} className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

export function AccessibilitySettings() {
  const { preferences, updatePreference, resetPreferences, announceToScreenReader } = useAccessibility();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handlePreferenceChange = <K extends keyof typeof preferences>(
    key: K,
    value: typeof preferences[K]
  ) => {
    updatePreference(key, value);
    announceToScreenReader(`${key} ${value ? 'enabled' : 'disabled'}`);
  };

  const handleReset = () => {
    resetPreferences();
    announceToScreenReader('Accessibility preferences reset to defaults');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Accessibility className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Accessibility Settings</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Customize your experience to work best with your needs. These settings are designed 
          with chronic illness considerations in mind, helping reduce cognitive load and fatigue.
        </p>
      </div>

      {/* Quick Actions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-blue-900">Quick Setup</h3>
              <p className="text-sm text-blue-700">
                Enable common accessibility features for chronic illness support
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updatePreference('fatigueMode', true);
                  updatePreference('largeTouchTargets', true);
                  updatePreference('autoSave', true);
                  updatePreference('cognitiveSupport', true);
                  announceToScreenReader('Fatigue-friendly settings enabled');
                }}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Zap className="h-4 w-4 mr-2" />
                Fatigue Mode
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="border-gray-300"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Preferences */}
      <SettingsSection
        title="Visual Preferences"
        description="Adjust visual elements to reduce eye strain and improve readability during fatigue episodes."
        icon={<Eye className="h-5 w-5 text-purple-600" />}
      >
        <SettingItem
          id="high-contrast"
          label="High Contrast Mode"
          description="Increases contrast between text and background for better visibility. Helpful during brain fog episodes."
          checked={preferences.highContrast}
          onChange={(checked) => handlePreferenceChange('highContrast', checked)}
          badge="WCAG AAA"
        />
        
        <SettingItem
          id="large-text"
          label="Large Text"
          description="Increases font size throughout the app. Reduces eye strain when experiencing fatigue."
          checked={preferences.largeText}
          onChange={(checked) => handlePreferenceChange('largeText', checked)}
        />
        
        <SettingItem
          id="reduced-motion"
          label="Reduced Motion"
          description="Minimizes animations and transitions. Helpful for vestibular sensitivity and motion intolerance."
          checked={preferences.reducedMotion}
          onChange={(checked) => handlePreferenceChange('reducedMotion', checked)}
          badge="Vestibular Safe"
        />
        
        <SettingItem
          id="focus-indicators"
          label="Enhanced Focus Indicators"
          description="Makes keyboard focus more visible with stronger outlines and colors."
          checked={preferences.focusIndicators}
          onChange={(checked) => handlePreferenceChange('focusIndicators', checked)}
        />
      </SettingsSection>

      {/* Interaction Preferences */}
      <SettingsSection
        title="Interaction Preferences"
        description="Modify how you interact with the app to accommodate motor difficulties and fatigue."
        icon={<Keyboard className="h-5 w-5 text-green-600" />}
      >
        <SettingItem
          id="large-touch-targets"
          label="Large Touch Targets"
          description="Makes buttons and interactive elements larger and easier to tap. Helpful for tremor or coordination issues."
          checked={preferences.largeTouchTargets}
          onChange={(checked) => handlePreferenceChange('largeTouchTargets', checked)}
          badge="Motor Friendly"
        />
        
        <SettingItem
          id="keyboard-navigation"
          label="Enhanced Keyboard Navigation"
          description="Improves keyboard-only navigation throughout the app."
          checked={preferences.keyboardNavigation}
          onChange={(checked) => handlePreferenceChange('keyboardNavigation', checked)}
        />
        
        <SettingItem
          id="auto-save"
          label="Automatic Saving"
          description="Automatically saves your progress to prevent data loss during fatigue episodes or crashes."
          checked={preferences.autoSave}
          onChange={(checked) => handlePreferenceChange('autoSave', checked)}
          badge="Fatigue Safe"
        />
      </SettingsSection>

      {/* Audio Preferences */}
      <SettingsSection
        title="Audio & Voice Guidance"
        description="Audio features to support eyes-closed activities and provide gentle feedback."
        icon={<Volume2 className="h-5 w-5 text-orange-600" />}
      >
        <SettingItem
          id="voice-guidance"
          label="Voice Guidance"
          description="Provides spoken instructions for breathing exercises and movement sessions. Perfect for eyes-closed activities."
          checked={preferences.voiceGuidance}
          onChange={(checked) => handlePreferenceChange('voiceGuidance', checked)}
          badge="Eyes-Closed Friendly"
        />
        
        <SettingItem
          id="sound-effects"
          label="Gentle Sound Effects"
          description="Soft audio feedback for actions and transitions. Can be calming during stress."
          checked={preferences.soundEffects}
          onChange={(checked) => handlePreferenceChange('soundEffects', checked)}
        />
        
        <SettingItem
          id="audio-descriptions"
          label="Audio Descriptions"
          description="Describes visual elements and charts for screen reader users."
          checked={preferences.audioDescriptions}
          onChange={(checked) => handlePreferenceChange('audioDescriptions', checked)}
        />
      </SettingsSection>

      {/* Chronic Illness Support */}
      <SettingsSection
        title="Chronic Illness Support"
        description="Features specifically designed to support those with ME/CFS, Long COVID, and similar conditions."
        icon={<Heart className="h-5 w-5 text-red-600" />}
      >
        <SettingItem
          id="fatigue-mode"
          label="Fatigue Mode"
          description="Simplifies the interface with calming colors and reduced cognitive load. Ideal for low-energy days."
          checked={preferences.fatigueMode}
          onChange={(checked) => handlePreferenceChange('fatigueMode', checked)}
          badge="ME/CFS Optimized"
        />
        
        <SettingItem
          id="cognitive-support"
          label="Cognitive Support"
          description="Adds step indicators, progress tracking, and memory aids to reduce brain fog impact."
          checked={preferences.cognitiveSupport}
          onChange={(checked) => handlePreferenceChange('cognitiveSupport', checked)}
          badge="Brain Fog Friendly"
        />
        
        <SettingItem
          id="simplified-interface"
          label="Simplified Interface"
          description="Hides advanced features and reduces visual complexity. Focuses on essential functions only."
          checked={preferences.simplifiedInterface}
          onChange={(checked) => handlePreferenceChange('simplifiedInterface', checked)}
        />
      </SettingsSection>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <Button
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full justify-between p-0 h-auto"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              <span className="text-lg font-semibold">Advanced Settings</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {showAdvanced ? 'Hide' : 'Show'}
            </span>
          </Button>
        </CardHeader>
        
        {showAdvanced && (
          <CardContent className="space-y-4">
            <SettingItem
              id="screen-reader"
              label="Screen Reader Optimization"
              description="Optimizes the interface for screen reader users with enhanced ARIA labels and descriptions."
              checked={preferences.screenReader}
              onChange={(checked) => handlePreferenceChange('screenReader', checked)}
            />
            
            <Separator />
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                System Detection
              </h4>
              <p className="text-sm text-muted-foreground">
                The app automatically detects some accessibility preferences from your system settings, 
                including reduced motion and high contrast preferences.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Status Indicator */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Accessibility Status: Active</span>
          </div>
          <p className="text-sm text-green-700 mt-2">
            Your accessibility preferences are being applied throughout the app. 
            Changes are saved automatically and will persist across sessions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}