"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DailyAnchorRoutine } from "@/components/health/daily-anchor-routine";
import { EnergyDashboard } from "@/components/health/energy-dashboard";
import { Heart, Activity, Moon, Droplets, User, Settings } from "lucide-react";

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
          </p>
        </div>

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

        {/* Daily Anchor Routine */}
        <DailyAnchorRoutine 
          onComplete={(exercises, duration) => {
            console.log('Routine completed:', { exercises, duration });
          }}
          onProgress={(exercise, progress) => {
            console.log('Progress:', { exercise, progress });
          }}
        />

        {/* Development Notice */}
        <div className="mt-8">
          <Card className="border-dashed border-2 border-muted">
            <CardHeader>
              <CardTitle className="text-muted-foreground">Development Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This is a development preview showing the dashboard layout and components. 
                In production, this would require authentication and connect to a real database.
              </p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm">
                  View Auth Flow
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}