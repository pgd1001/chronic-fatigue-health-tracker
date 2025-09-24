"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyAnchorRoutine } from "@/components/health/daily-anchor-routine";
import { EnergyDashboard } from "@/components/health/energy-dashboard";
import { NutritionDashboard } from "@/components/health/nutrition-dashboard";
import { SleepOptimization } from "@/components/health/sleep-optimization";
import { SleepDashboard } from "@/components/health/sleep-dashboard";
import { EveningReminders } from "@/components/health/evening-reminders";
import { BiometricCapture } from "@/components/health/biometric-capture";
import { BiometricDashboard } from "@/components/health/biometric-dashboard";
import { MovementSession } from "@/components/health/movement-session";
import { MovementDashboard } from "@/components/health/movement-dashboard";
import { SymptomTracker } from "@/components/health/symptom-tracker";
import { SymptomProgress } from "@/components/health/symptom-progress";
import { HealthcareReports } from "@/components/health/healthcare-reports";
import { PrivacyDashboard } from "@/components/privacy/privacy-dashboard";
import { Heart, Activity, Moon, Droplets, User, Settings, AlertCircle, FileText, Shield } from "lucide-react";

export default function DevPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Heart className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">CF Tracker - Development Mode</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              Dev User
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            Welcome to Development Mode
          </h2>
          <p className="text-muted-foreground">
            This is a preview of the health tracking dashboard without authentication. 
            Browse through the tabs to see all implemented features.
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="movement">Movement</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Energy Level</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">7/10</div>
              <p className="text-xs text-muted-foreground">
                Good energy today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">72 BPM</div>
              <p className="text-xs text-muted-foreground">
                Resting rate - normal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sleep Quality</CardTitle>
              <Moon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">8/10</div>
              <p className="text-xs text-muted-foreground">
                7.5 hours - restful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hydration</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600">1,800ml</div>
              <p className="text-xs text-muted-foreground">
                Goal: 2,000ml (90%)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Energy Dashboard */}
        <EnergyDashboard 
          onSaveAssessment={(energy, notes) => {
            console.log('Energy assessment saved:', { energy, notes });
          }}
          onExportData={() => {
            console.log('Exporting energy data...');
          }}
        />

        {/* Nutrition Dashboard */}
        <NutritionDashboard 
          onSaveNutrition={(entry) => {
            console.log('Nutrition entry saved:', entry);
          }}
          onAddHydration={(amount, type) => {
            console.log('Hydration added:', { amount, type });
          }}
        />

        {/* Daily Anchor Routine */}
        <DailyAnchorRoutine 
          onComplete={(exercises, duration) => {
            console.log('Routine completed:', { exercises, duration });
          }}
          onProgress={(exercise, progress) => {
            console.log('Progress:', { exercise, progress });
          }}
        />

        {/* Sleep Optimization */}
        <div className="mt-8">
          <SleepOptimization 
            userId="dev-user"
            onSleepDataUpdate={(data) => {
              console.log('Sleep data updated:', data);
            }}
          />
        </div>

        {/* Sleep Dashboard */}
        <div className="mt-8">
          <SleepDashboard 
            sleepData={[
              {
                date: '2024-01-15',
                sleepQuality: 8,
                sleepDuration: 7.5,
                energyLevel: 7,
                routineCompletion: 100,
                bluelightReduction: true,
                screenReplacement: true,
                environmentOptimized: true,
              },
              {
                date: '2024-01-14',
                sleepQuality: 6,
                sleepDuration: 6.5,
                energyLevel: 5,
                routineCompletion: 67,
                bluelightReduction: true,
                screenReplacement: false,
                environmentOptimized: true,
              },
            ]}
            energyCorrelation={0.75}
          />
        </div>

        {/* Evening Reminders */}
        <div className="mt-8">
          <EveningReminders 
            userId="dev-user"
            onReminderUpdate={(reminders) => {
              console.log('Reminders updated:', reminders);
            }}
          />
        </div>

        {/* Biometric Capture */}
        <div className="mt-8">
          <BiometricCapture 
            onReadingComplete={(reading) => {
              console.log('Biometric reading completed:', reading);
            }}
            onError={(error) => {
              console.error('Biometric capture error:', error);
            }}
          />
        </div>

        {/* Biometric Dashboard */}
        <div className="mt-8">
          <BiometricDashboard 
            biometricData={[
              {
                id: '1',
                heartRate: 72,
                hrv: 35.2,
                timestamp: new Date('2024-01-15T10:30:00'),
                confidence: 0.85,
                quality: 'excellent',
                duration: 30,
              },
              {
                id: '2',
                heartRate: 68,
                hrv: 42.1,
                timestamp: new Date('2024-01-14T09:15:00'),
                confidence: 0.78,
                quality: 'good',
                duration: 30,
              },
            ]}
            onExportData={() => {
              console.log('Exporting biometric data...');
            }}
          />
        </div>

        {/* Movement Session */}
        <div className="mt-8">
          <MovementSession 
            userId="dev-user"
            userEnergyLevel={6}
            onSessionComplete={(sessionData) => {
              console.log('Movement session completed:', sessionData);
            }}
            onSessionUpdate={(sessionData) => {
              console.log('Movement session updated:', sessionData);
            }}
          />
        </div>

        {/* Movement Dashboard */}
        <div className="mt-8">
          <MovementDashboard 
            movementData={[
              {
                id: '1',
                date: '2024-01-15T10:30:00',
                sessionType: 'full_routine',
                duration: 1140,
                completed: true,
                completionPercentage: 100,
                preSessionEnergy: 6,
                postSessionFatigue: 4,
                postSessionBreath: 7,
                postSessionStability: 6,
                intensity: 3,
                phasesCompleted: 4,
                totalPhases: 4,
              },
              {
                id: '2',
                date: '2024-01-13T09:15:00',
                sessionType: 'quick_mobility',
                duration: 480,
                completed: true,
                completionPercentage: 100,
                preSessionEnergy: 4,
                postSessionFatigue: 3,
                postSessionBreath: 6,
                postSessionStability: 5,
                intensity: 2,
                phasesCompleted: 2,
                totalPhases: 2,
              },
            ]}
            movementStats={{
              totalSessions: 12,
              completedSessions: 9,
              completionRate: 75,
              averageIntensity: 2.8,
              averageDuration: 720,
              totalExerciseTime: 144,
              trend: 'stable',
              lastSessionDate: '2024-01-15',
            }}
            onExportData={() => {
              console.log('Exporting movement data...');
            }}
          />
        </div>

          </TabsContent>

          <TabsContent value="symptoms" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Symptom Tracking
                  </CardTitle>
                  <CardDescription>
                    Track your symptoms and view progress over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SymptomTracker
                    userId="dev-user"
                    date="2024-01-15"
                    onSave={async (data) => {
                      console.log('Symptoms saved:', data);
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Progress & Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <SymptomProgress
                    userId="dev-user"
                    progressMetrics={{
                      period: 'month',
                      startDate: '2024-01-01',
                      endDate: '2024-01-31',
                      averageFatigue: 6.5,
                      averagePEM: 5.2,
                      averageBrainFog: 7.1,
                      averageSleep: 4.8,
                      averageWellbeing: 5.5,
                      fatiguetrend: 'improving',
                      overallTrend: 'improving',
                      goodDays: 12,
                      difficultDays: 8,
                      topSymptoms: [
                        {
                          symptomType: 'fatigue',
                          averageSeverity: 6.5,
                          frequency: 85,
                          trendDirection: 'improving',
                        },
                      ],
                    }}
                    symptomTrends={[
                      { date: '2024-01-01', severity: 8 },
                      { date: '2024-01-02', severity: 7 },
                      { date: '2024-01-03', severity: 6 },
                    ]}
                    correlations={[]}
                    onPeriodChange={(period) => console.log('Period changed:', period)}
                    onSymptomSelect={(symptom) => console.log('Symptom selected:', symptom)}
                    selectedSymptom="fatigue"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Healthcare Provider Reports
                </CardTitle>
                <CardDescription>
                  Generate and manage reports for healthcare providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HealthcareReports userId="dev-user" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Data Control
                </CardTitle>
                <CardDescription>
                  Manage your privacy settings and exercise your GDPR rights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PrivacyDashboard userId="dev-user" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            {/* Energy Dashboard */}
            <EnergyDashboard 
              onSaveAssessment={(energy, notes) => {
                console.log('Energy assessment saved:', { energy, notes });
              }}
              onExportData={() => {
                console.log('Exporting energy data...');
              }}
            />

            {/* Nutrition Dashboard */}
            <NutritionDashboard 
              onSaveNutrition={(entry) => {
                console.log('Nutrition entry saved:', entry);
              }}
              onAddHydration={(amount, type) => {
                console.log('Hydration added:', { amount, type });
              }}
            />

            {/* Sleep Components */}
            <SleepOptimization 
              userId="dev-user"
              onSleepDataUpdate={(data) => {
                console.log('Sleep data updated:', data);
              }}
            />

            <SleepDashboard 
              sleepData={[
                {
                  date: '2024-01-15',
                  sleepQuality: 8,
                  sleepDuration: 7.5,
                  energyLevel: 7,
                  routineCompletion: 100,
                  bluelightReduction: true,
                  screenReplacement: true,
                  environmentOptimized: true,
                },
              ]}
              energyCorrelation={0.75}
            />

            {/* Biometric Components */}
            <BiometricCapture 
              onReadingComplete={(reading) => {
                console.log('Biometric reading completed:', reading);
              }}
              onError={(error) => {
                console.error('Biometric capture error:', error);
              }}
            />

            <BiometricDashboard 
              biometricData={[
                {
                  id: '1',
                  heartRate: 72,
                  hrv: 35.2,
                  timestamp: new Date('2024-01-15T10:30:00'),
                  confidence: 0.85,
                  quality: 'excellent',
                  duration: 30,
                },
              ]}
              onExportData={() => {
                console.log('Exporting biometric data...');
              }}
            />
          </TabsContent>

          <TabsContent value="movement" className="space-y-6">
            {/* Daily Anchor Routine */}
            <DailyAnchorRoutine 
              onComplete={(exercises, duration) => {
                console.log('Routine completed:', { exercises, duration });
              }}
              onProgress={(exercise, progress) => {
                console.log('Progress:', { exercise, progress });
              }}
            />

            {/* Movement Session */}
            <MovementSession 
              userId="dev-user"
              userEnergyLevel={6}
              onSessionComplete={(sessionData) => {
                console.log('Movement session completed:', sessionData);
              }}
              onSessionUpdate={(sessionData) => {
                console.log('Movement session updated:', sessionData);
              }}
            />

            {/* Movement Dashboard */}
            <MovementDashboard 
              movementData={[
                {
                  id: '1',
                  date: '2024-01-15T10:30:00',
                  sessionType: 'full_routine',
                  duration: 1140,
                  completed: true,
                  completionPercentage: 100,
                  preSessionEnergy: 6,
                  postSessionFatigue: 4,
                  postSessionBreath: 7,
                  postSessionStability: 6,
                  intensity: 3,
                  phasesCompleted: 4,
                  totalPhases: 4,
                },
              ]}
              movementStats={{
                totalSessions: 12,
                completedSessions: 9,
                completionRate: 75,
                averageIntensity: 2.8,
                averageDuration: 720,
                totalExerciseTime: 144,
                trend: 'stable',
                lastSessionDate: '2024-01-15',
              }}
              onExportData={() => {
                console.log('Exporting movement data...');
              }}
            />
          </TabsContent>

          {/* Development Notice */}
          <Card className="border-dashed border-2 border-muted mt-8">
            <CardHeader>
              <CardTitle className="text-muted-foreground">Development Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This is a development preview showing all implemented components. 
                In production, this would require authentication and connect to a real database.
                Navigate to <code className="bg-muted px-1 rounded">http://localhost:3000/dev</code> to see this preview.
              </p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/auth'}>
                  View Auth Flow
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </Tabs>
      </main>
    </div>
  );
}