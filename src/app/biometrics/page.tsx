'use client';

import React, { useState, useEffect } from 'react';
import { BiometricCapture } from '@/components/health/biometric-capture';
import { BiometricDashboard } from '@/components/health/biometric-dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Activity, Camera, TrendingUp, Shield, AlertTriangle } from 'lucide-react';

// Mock data for demonstration - in real app this would come from API
const mockBiometricData = [
  {
    id: '1',
    heartRate: 72,
    hrv: 35.2,
    timestamp: new Date('2024-01-15T10:30:00'),
    confidence: 0.85,
    quality: 'excellent' as const,
    duration: 30,
  },
  {
    id: '2',
    heartRate: 68,
    hrv: 42.1,
    timestamp: new Date('2024-01-14T09:15:00'),
    confidence: 0.78,
    quality: 'good' as const,
    duration: 30,
  },
  {
    id: '3',
    heartRate: 75,
    hrv: 28.9,
    timestamp: new Date('2024-01-13T11:45:00'),
    confidence: 0.92,
    quality: 'excellent' as const,
    duration: 30,
  },
  {
    id: '4',
    heartRate: 71,
    hrv: 38.7,
    timestamp: new Date('2024-01-12T08:20:00'),
    confidence: 0.65,
    quality: 'fair' as const,
    duration: 30,
  },
  {
    id: '5',
    heartRate: 69,
    hrv: 45.3,
    timestamp: new Date('2024-01-11T16:10:00'),
    confidence: 0.88,
    quality: 'excellent' as const,
    duration: 30,
  },
];

interface BiometricReading {
  id?: string;
  heartRate: number;
  hrv: number;
  timestamp: Date;
  confidence: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  duration: number;
}

export default function BiometricsPage() {
  const [currentTab, setCurrentTab] = useState('capture');
  const [biometricData, setBiometricData] = useState<BiometricReading[]>(mockBiometricData);
  const [lastReading, setLastReading] = useState<BiometricReading | null>(null);
  const [cameraSupported, setCameraSupported] = useState<boolean | null>(null);

  // Check camera support on mount
  useEffect(() => {
    const checkCameraSupport = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraSupported(false);
          return;
        }
        
        // Try to enumerate devices to check for camera
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        setCameraSupported(hasCamera);
      } catch (error) {
        setCameraSupported(false);
      }
    };

    checkCameraSupport();
  }, []);

  const handleBiometricReading = (reading: BiometricReading) => {
    const newReading = {
      ...reading,
      id: Date.now().toString(),
    };
    
    setBiometricData(prev => [newReading, ...prev]);
    setLastReading(newReading);
    
    // Auto-switch to dashboard to show the new reading
    setCurrentTab('dashboard');
    
    console.log('New biometric reading:', newReading);
    // In real app, this would save to API
  };

  const handleExportData = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      measurements: biometricData,
      summary: {
        totalMeasurements: biometricData.length,
        averageHeartRate: Math.round(biometricData.reduce((sum, d) => sum + d.heartRate, 0) / biometricData.length),
        averageHRV: Math.round((biometricData.reduce((sum, d) => sum + d.hrv, 0) / biometricData.length) * 10) / 10,
      }
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biometric-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleError = (error: string) => {
    console.error('Biometric capture error:', error);
    // In real app, this would show a toast notification
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold">Biometric Monitoring</h1>
          {lastReading && (
            <Badge className="bg-green-100 text-green-800">
              Latest: {lastReading.heartRate} BPM
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-lg">
          Monitor your heart rate and HRV using camera-based measurement technology
        </p>
      </div>

      {/* Camera Support Warning */}
      {cameraSupported === false && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900 mb-1">Camera Not Available</p>
                <p className="text-sm text-amber-800">
                  Camera access is required for biometric measurements. Please ensure your device 
                  has a camera and grant permission when prompted.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Latest HR</p>
                <p className="text-2xl font-bold text-red-600">
                  {lastReading?.heartRate || biometricData[0]?.heartRate || '--'}
                </p>
              </div>
              <Heart className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Beats per minute</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Latest HRV</p>
                <p className="text-2xl font-bold text-blue-600">
                  {lastReading?.hrv?.toFixed(1) || biometricData[0]?.hrv?.toFixed(1) || '--'}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Milliseconds</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Measurements</p>
                <p className="text-2xl font-bold">{biometricData.length}</p>
              </div>
              <Camera className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total captured</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Quality</p>
                <p className="text-2xl font-bold text-green-600">
                  {biometricData.length > 0 
                    ? Math.round((biometricData.filter(d => d.quality === 'excellent' || d.quality === 'good').length / biometricData.length) * 100)
                    : '--'
                  }%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Good/Excellent</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="capture" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Capture Biometrics
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            View Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="capture" className="mt-6">
          <BiometricCapture
            onReadingComplete={handleBiometricReading}
            onError={handleError}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <BiometricDashboard
            biometricData={biometricData}
            onExportData={handleExportData}
          />
        </TabsContent>
      </Tabs>

      {/* Privacy and Medical Disclaimers */}
      <div className="mt-8 space-y-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 mb-1">Privacy Protection</p>
                <p className="text-sm text-blue-800">
                  All biometric processing happens locally on your device. No video data is transmitted 
                  or stored. Only the final heart rate and HRV measurements are saved to help you track 
                  your health patterns over time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Heart className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900 mb-1">For Chronic Fatigue Management</p>
                <p className="text-sm text-amber-800">
                  Biometric monitoring can help identify patterns related to post-exertional malaise (PEM) 
                  and energy crashes. Use these measurements alongside your symptom tracking and energy 
                  levels for better pacing decisions. Always consult healthcare professionals for medical concerns.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}