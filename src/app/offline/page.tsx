import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  Heart, 
  RefreshCw, 
  Database, 
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Offline Mode | CF Tracker',
  description: 'You are currently offline. Some features may be limited, but your health data is safe.',
};

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Heart className="h-16 w-16 text-blue-600" />
                <WifiOff className="h-6 w-6 text-red-500 absolute -top-1 -right-1 bg-white rounded-full p-1" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              You're Offline
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Don't worry - your health data is safe and secure
            </p>
          </div>

          {/* Status Cards */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Available Offline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Recent health data</span>
                  <Badge variant="secondary">Cached</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Energy tracking</span>
                  <Badge variant="secondary">Local</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Symptom logging</span>
                  <Badge variant="secondary">Local</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Daily routines</span>
                  <Badge variant="secondary">Available</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  Limited Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Report generation</span>
                  <Badge variant="outline">Requires connection</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Data export</span>
                  <Badge variant="outline">Requires connection</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Healthcare sharing</span>
                  <Badge variant="outline">Requires connection</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Account settings</span>
                  <Badge variant="outline">Requires connection</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Offline Features */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                What You Can Do Offline
              </CardTitle>
              <CardDescription>
                These features work without an internet connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 text-left">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Health Tracking</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Log energy levels and fatigue
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Track symptoms and pain
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Record sleep quality
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Monitor mood and wellbeing
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Activities</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Complete daily anchor routine
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      View recent health history
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Access breathing exercises
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Review pacing guidance
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sync Status */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Data Synchronization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  Your data will sync automatically when connection is restored
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Any health data you log while offline will be safely stored locally 
                  and uploaded when you're back online.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleRetry} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Check Connection
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Continue Offline
            </Button>
          </div>

          {/* Helpful Tips */}
          <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
              Tips for Offline Use
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <p>• Your health data is automatically saved locally for offline access</p>
              <p>• Use the quick energy check to log how you're feeling</p>
              <p>• Complete your daily anchor routine to maintain consistency</p>
              <p>• All offline data will sync when you reconnect to the internet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}