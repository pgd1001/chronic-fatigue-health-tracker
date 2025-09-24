'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Save, AlertCircle } from 'lucide-react';
import {
  type SymptomEntry,
  type SymptomType,
  SymptomTypeSchema,
  getSymptomDisplayName,
  getSeverityLabel,
  getSeverityColor,
} from '@/lib/types/symptom.types';

interface SymptomTrackerProps {
  userId: string;
  date: string;
  initialData?: {
    fatigueLevel?: number;
    brainFogLevel?: number;
    sleepQuality?: number;
    symptoms?: SymptomEntry[];
    notes?: string;
  };
  onSave: (data: {
    fatigueLevel?: number;
    brainFogLevel?: number;
    sleepQuality?: number;
    symptoms?: SymptomEntry[];
    notes?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

const CORE_SYMPTOMS: Array<{ key: keyof SymptomTrackerProps['initialData'], type: SymptomType, label: string }> = [
  { key: 'fatigueLevel', type: 'fatigue', label: 'Fatigue Level' },
  { key: 'brainFogLevel', type: 'brain_fog', label: 'Brain Fog' },
  { key: 'sleepQuality', type: 'sleep_disturbance', label: 'Sleep Quality' },
];

const COMMON_SYMPTOMS: SymptomType[] = [
  'post_exertional_malaise',
  'muscle_pain',
  'joint_pain',
  'headache',
  'dizziness',
  'heart_palpitations',
  'nausea',
  'temperature_regulation',
  'mood_changes',
  'anxiety',
  'sensory_sensitivity',
];

export function SymptomTracker({
  userId,
  date,
  initialData,
  onSave,
  isLoading = false,
}: SymptomTrackerProps) {
  const [fatigueLevel, setFatigueLevel] = useState<number>(initialData?.fatigueLevel || 5);
  const [brainFogLevel, setBrainFogLevel] = useState<number>(initialData?.brainFogLevel || 5);
  const [sleepQuality, setSleepQuality] = useState<number>(initialData?.sleepQuality || 5);
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>(initialData?.symptoms || []);
  const [notes, setNotes] = useState<string>(initialData?.notes || '');
  const [activeTab, setActiveTab] = useState<'core' | 'additional'>('core');
  const [isSaving, setIsSaving] = useState(false);

  // Update state when initialData changes
  useEffect(() => {
    if (initialData) {
      setFatigueLevel(initialData.fatigueLevel || 5);
      setBrainFogLevel(initialData.brainFogLevel || 5);
      setSleepQuality(initialData.sleepQuality || 5);
      setSymptoms(initialData.symptoms || []);
      setNotes(initialData.notes || '');
    }
  }, [initialData]);

  const handleAddSymptom = (symptomType: SymptomType) => {
    const existingSymptom = symptoms.find(s => s.type === symptomType);
    if (existingSymptom) return;

    const newSymptom: SymptomEntry = {
      type: symptomType,
      severity: 5,
      timestamp: new Date(),
    };

    setSymptoms([...symptoms, newSymptom]);
  };

  const handleUpdateSymptom = (index: number, updates: Partial<SymptomEntry>) => {
    const updatedSymptoms = symptoms.map((symptom, i) =>
      i === index ? { ...symptom, ...updates } : symptom
    );
    setSymptoms(updatedSymptoms);
  };

  const handleRemoveSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        fatigueLevel,
        brainFogLevel,
        sleepQuality,
        symptoms,
        notes: notes.trim() || undefined,
      });
    } catch (error) {
      console.error('Failed to save symptom data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getSeverityDescription = (severity: number): string => {
    if (severity <= 2) return 'Very mild, barely noticeable';
    if (severity <= 4) return 'Mild, manageable with some effort';
    if (severity <= 6) return 'Moderate, affecting daily activities';
    if (severity <= 8) return 'Severe, significantly limiting';
    return 'Very severe, overwhelming';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          Symptom Tracking
        </CardTitle>
        <CardDescription>
          Track your symptoms to identify patterns and share with healthcare providers.
          Rate each symptom from 1 (very mild) to 10 (very severe).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'core' | 'additional')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="core">Core Symptoms</TabsTrigger>
            <TabsTrigger value="additional">Additional Symptoms</TabsTrigger>
          </TabsList>

          <TabsContent value="core" className="space-y-6">
            {/* Fatigue Level */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Fatigue Level</label>
                <Badge variant="outline" className={getSeverityColor(fatigueLevel)}>
                  {fatigueLevel}/10 - {getSeverityLabel(fatigueLevel)}
                </Badge>
              </div>
              <Slider
                value={[fatigueLevel]}
                onValueChange={([value]) => setFatigueLevel(value)}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {getSeverityDescription(fatigueLevel)}
              </p>
            </div>

            {/* Brain Fog Level */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Brain Fog</label>
                <Badge variant="outline" className={getSeverityColor(brainFogLevel)}>
                  {brainFogLevel}/10 - {getSeverityLabel(brainFogLevel)}
                </Badge>
              </div>
              <Slider
                value={[brainFogLevel]}
                onValueChange={([value]) => setBrainFogLevel(value)}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Difficulty thinking clearly, concentrating, or remembering
              </p>
            </div>

            {/* Sleep Quality */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Sleep Quality</label>
                <Badge variant="outline" className={getSeverityColor(11 - sleepQuality)}>
                  {sleepQuality}/10 - {sleepQuality <= 3 ? 'Poor' : sleepQuality <= 6 ? 'Fair' : sleepQuality <= 8 ? 'Good' : 'Excellent'}
                </Badge>
              </div>
              <Slider
                value={[sleepQuality]}
                onValueChange={([value]) => setSleepQuality(value)}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                How refreshing and restorative was your sleep?
              </p>
            </div>
          </TabsContent>

          <TabsContent value="additional" className="space-y-6">
            {/* Add Common Symptoms */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Add Common Symptoms</h4>
              <div className="flex flex-wrap gap-2">
                {COMMON_SYMPTOMS.map((symptomType) => {
                  const isAdded = symptoms.some(s => s.type === symptomType);
                  return (
                    <Button
                      key={symptomType}
                      variant={isAdded ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => !isAdded && handleAddSymptom(symptomType)}
                      disabled={isAdded}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {getSymptomDisplayName(symptomType)}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Current Additional Symptoms */}
            {symptoms.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Current Symptoms</h4>
                {symptoms.map((symptom, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">{getSymptomDisplayName(symptom.type)}</h5>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getSeverityColor(symptom.severity)}>
                            {symptom.severity}/10
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSymptom(index)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Slider
                        value={[symptom.severity]}
                        onValueChange={([value]) => handleUpdateSymptom(index, { severity: value })}
                        max={10}
                        min={1}
                        step={1}
                        className="w-full"
                      />

                      {/* Optional location for pain symptoms */}
                      {(symptom.type.includes('pain') || symptom.type === 'headache') && (
                        <input
                          type="text"
                          placeholder="Location (optional)"
                          value={symptom.location || ''}
                          onChange={(e) => handleUpdateSymptom(index, { location: e.target.value })}
                          className="w-full px-3 py-1 text-sm border rounded-md"
                        />
                      )}

                      {/* Optional notes */}
                      <Textarea
                        placeholder="Additional notes about this symptom (optional)"
                        value={symptom.notes || ''}
                        onChange={(e) => handleUpdateSymptom(index, { notes: e.target.value })}
                        className="min-h-[60px] text-sm"
                        maxLength={300}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* General Notes */}
        <div className="space-y-3">
          <label className="text-sm font-medium">General Notes</label>
          <Textarea
            placeholder="Any additional observations about your symptoms today..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px]"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {notes.length}/500 characters
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="min-w-[120px]"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Symptoms
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}