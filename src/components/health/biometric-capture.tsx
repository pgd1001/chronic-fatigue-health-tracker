'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Heart, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Info,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';

interface BiometricCaptureProps {
  onReadingComplete: (data: BiometricReading) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface BiometricReading {
  heartRate: number;
  hrv: number;
  timestamp: Date;
  confidence: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  duration: number; // in seconds
}

interface CameraState {
  isActive: boolean;
  hasPermission: boolean;
  error: string | null;
  stream: MediaStream | null;
}

interface MeasurementState {
  isCapturing: boolean;
  progress: number;
  currentHeartRate: number | null;
  samples: number[];
  startTime: Date | null;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | null;
}

const MEASUREMENT_DURATION = 30; // seconds
const SAMPLE_RATE = 30; // fps
const MIN_SAMPLES_FOR_HR = 60; // minimum samples needed for heart rate calculation

export function BiometricCapture({ onReadingComplete, onError, className }: BiometricCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const intervalRef = useRef<NodeJS.Timeout>();

  const [cameraState, setCameraState] = useState<CameraState>({
    isActive: false,
    hasPermission: false,
    error: null,
    stream: null,
  });

  const [measurementState, setMeasurementState] = useState<MeasurementState>({
    isCapturing: false,
    progress: 0,
    currentHeartRate: null,
    samples: [],
    startTime: null,
    quality: null,
  });

  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);

  // Check camera permissions and availability
  const checkCameraSupport = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }

      // Check if we have camera permission
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      
      setCameraState(prev => ({
        ...prev,
        hasPermission: permission.state === 'granted',
        error: null,
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Camera access failed';
      setCameraState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
      return false;
    }
  }, [onError]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setCameraState(prev => ({
        ...prev,
        isActive: true,
        hasPermission: true,
        stream,
        error: null,
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to access camera';
      setCameraState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [onError]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (cameraState.stream) {
      cameraState.stream.getTracks().forEach(track => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraState(prev => ({
      ...prev,
      isActive: false,
      stream: null,
    }));
  }, [cameraState.stream]);

  // Extract color values from video frame
  const extractColorValues = useCallback((): number | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return null;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data from center region (where finger should be)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const regionSize = Math.min(canvas.width, canvas.height) * 0.3;

    const imageData = ctx.getImageData(
      centerX - regionSize / 2,
      centerY - regionSize / 2,
      regionSize,
      regionSize
    );

    // Calculate average red channel value (blood absorption)
    let redSum = 0;
    let pixelCount = 0;

    for (let i = 0; i < imageData.data.length; i += 4) {
      redSum += imageData.data[i]; // Red channel
      pixelCount++;
    }

    return pixelCount > 0 ? redSum / pixelCount : null;
  }, []);

  // Calculate heart rate from samples using FFT-like approach
  const calculateHeartRate = useCallback((samples: number[]): { heartRate: number; confidence: number } => {
    if (samples.length < MIN_SAMPLES_FOR_HR) {
      return { heartRate: 0, confidence: 0 };
    }

    // Simple peak detection algorithm
    const peaks: number[] = [];
    const threshold = samples.reduce((sum, val) => sum + val, 0) / samples.length;

    for (let i = 1; i < samples.length - 1; i++) {
      if (samples[i] > samples[i - 1] && 
          samples[i] > samples[i + 1] && 
          samples[i] > threshold) {
        peaks.push(i);
      }
    }

    if (peaks.length < 2) {
      return { heartRate: 0, confidence: 0 };
    }

    // Calculate intervals between peaks
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }

    // Convert to BPM (samples per second * 60 / average interval)
    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const heartRate = Math.round((SAMPLE_RATE * 60) / avgInterval);

    // Calculate confidence based on interval consistency
    const intervalVariance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
    const confidence = Math.max(0, Math.min(1, 1 - (intervalVariance / (avgInterval * avgInterval))));

    // Validate heart rate range (40-200 BPM)
    if (heartRate < 40 || heartRate > 200) {
      return { heartRate: 0, confidence: 0 };
    }

    return { heartRate, confidence };
  }, []);

  // Calculate HRV from heart rate intervals
  const calculateHRV = useCallback((samples: number[]): number => {
    if (samples.length < MIN_SAMPLES_FOR_HR) return 0;

    // Find peaks for interval calculation
    const peaks: number[] = [];
    const threshold = samples.reduce((sum, val) => sum + val, 0) / samples.length;

    for (let i = 1; i < samples.length - 1; i++) {
      if (samples[i] > samples[i - 1] && 
          samples[i] > samples[i + 1] && 
          samples[i] > threshold) {
        peaks.push(i);
      }
    }

    if (peaks.length < 3) return 0;

    // Calculate RR intervals (time between heartbeats)
    const rrIntervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      const interval = (peaks[i] - peaks[i - 1]) * (1000 / SAMPLE_RATE); // Convert to milliseconds
      rrIntervals.push(interval);
    }

    // Calculate RMSSD (Root Mean Square of Successive Differences)
    if (rrIntervals.length < 2) return 0;

    const successiveDifferences: number[] = [];
    for (let i = 1; i < rrIntervals.length; i++) {
      successiveDifferences.push(Math.pow(rrIntervals[i] - rrIntervals[i - 1], 2));
    }

    const meanSquaredDiff = successiveDifferences.reduce((sum, val) => sum + val, 0) / successiveDifferences.length;
    return Math.sqrt(meanSquaredDiff);
  }, []);

  // Process video frame for biometric data
  const processFrame = useCallback(() => {
    if (!measurementState.isCapturing) return;

    const colorValue = extractColorValues();
    if (colorValue === null) return;

    setMeasurementState(prev => {
      const newSamples = [...prev.samples, colorValue];
      const { heartRate, confidence } = calculateHeartRate(newSamples);
      
      // Determine quality based on confidence and sample consistency
      let quality: 'excellent' | 'good' | 'fair' | 'poor';
      if (confidence > 0.8) quality = 'excellent';
      else if (confidence > 0.6) quality = 'good';
      else if (confidence > 0.4) quality = 'fair';
      else quality = 'poor';

      return {
        ...prev,
        samples: newSamples,
        currentHeartRate: heartRate > 0 ? heartRate : prev.currentHeartRate,
        quality,
      };
    });

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [measurementState.isCapturing, extractColorValues, calculateHeartRate]);

  // Start biometric measurement
  const startMeasurement = useCallback(() => {
    if (!cameraState.isActive) return;

    const startTime = new Date();
    
    setMeasurementState({
      isCapturing: true,
      progress: 0,
      currentHeartRate: null,
      samples: [],
      startTime,
      quality: null,
    });

    // Start processing frames
    processFrame();

    // Update progress
    intervalRef.current = setInterval(() => {
      setMeasurementState(prev => {
        if (!prev.startTime) return prev;
        
        const elapsed = (Date.now() - prev.startTime.getTime()) / 1000;
        const progress = Math.min((elapsed / MEASUREMENT_DURATION) * 100, 100);

        if (progress >= 100) {
          // Measurement complete
          const { heartRate, confidence } = calculateHeartRate(prev.samples);
          const hrv = calculateHRV(prev.samples);
          
          const reading: BiometricReading = {
            heartRate,
            hrv,
            timestamp: new Date(),
            confidence,
            quality: prev.quality || 'poor',
            duration: MEASUREMENT_DURATION,
          };

          onReadingComplete(reading);
          return { ...prev, isCapturing: false, progress: 100 };
        }

        return { ...prev, progress };
      });
    }, 100);

  }, [cameraState.isActive, processFrame, calculateHeartRate, calculateHRV, onReadingComplete]);

  // Stop measurement
  const stopMeasurement = useCallback(() => {
    setMeasurementState(prev => ({ ...prev, isCapturing: false }));
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopMeasurement();
    };
  }, [stopCamera, stopMeasurement]);

  // Initialize camera support check
  useEffect(() => {
    checkCameraSupport();
  }, [checkCameraSupport]);

  const getQualityColor = (quality: string | null) => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getQualityBadgeVariant = (quality: string | null) => {
    switch (quality) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'fair': return 'outline';
      case 'poor': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600" />
              <CardTitle>Biometric Capture</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPrivacyInfo(!showPrivacyInfo)}
            >
              {showPrivacyInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              Privacy
            </Button>
          </div>
          <CardDescription>
            Measure heart rate and HRV using your device camera
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showPrivacyInfo && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Privacy-First Design</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• All processing happens locally on your device</li>
                    <li>• No video data is transmitted or stored</li>
                    <li>• Camera access is only used during measurement</li>
                    <li>• Only final heart rate and HRV values are saved</li>
                    <li>• You can revoke camera permission at any time</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Camera Error */}
            {cameraState.error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Camera Error</p>
                  <p className="text-sm text-red-700">{cameraState.error}</p>
                </div>
              </div>
            )}

            {/* Camera Controls */}
            <div className="flex gap-2">
              {!cameraState.isActive ? (
                <Button onClick={startCamera} disabled={!!cameraState.error}>
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <Button variant="outline" onClick={stopCamera}>
                  <Camera className="h-4 w-4 mr-2" />
                  Stop Camera
                </Button>
              )}

              {cameraState.isActive && !measurementState.isCapturing && (
                <Button onClick={startMeasurement}>
                  <Activity className="h-4 w-4 mr-2" />
                  Start Measurement
                </Button>
              )}

              {measurementState.isCapturing && (
                <Button variant="outline" onClick={stopMeasurement}>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Stop Measurement
                </Button>
              )}
            </div>

            {/* Video Preview */}
            {cameraState.isActive && (
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full max-w-md mx-auto rounded-lg border"
                  autoPlay
                  muted
                  playsInline
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Finger placement guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-24 h-24 border-2 border-white border-dashed rounded-full bg-black bg-opacity-20 flex items-center justify-center">
                    <p className="text-white text-xs text-center">
                      Place finger here
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Measurement Progress */}
            {measurementState.isCapturing && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Measuring...</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(measurementState.progress)}%
                  </span>
                </div>
                <Progress value={measurementState.progress} />
                
                {/* Real-time readings */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Heart Rate</p>
                    <p className="text-2xl font-bold text-red-600">
                      {measurementState.currentHeartRate || '--'}
                      <span className="text-sm font-normal"> BPM</span>
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Signal Quality</p>
                    <Badge variant={getQualityBadgeVariant(measurementState.quality)}>
                      {measurementState.quality || 'Detecting...'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-1">Measurement Tips</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Cover the camera lens completely with your fingertip</li>
                    <li>• Keep your finger still and apply gentle pressure</li>
                    <li>• Ensure good lighting for best results</li>
                    <li>• Stay relaxed and breathe normally</li>
                    <li>• Measurement takes 30 seconds for accuracy</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Medical Disclaimer */}
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-xs text-gray-600">
                <strong>Medical Disclaimer:</strong> This measurement is for wellness tracking only 
                and should not be used for medical diagnosis. Consult healthcare professionals 
                for medical concerns.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}