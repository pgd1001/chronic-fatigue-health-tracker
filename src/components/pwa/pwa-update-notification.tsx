'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, RefreshCw, Sparkles } from 'lucide-react';

interface PWAUpdateNotificationProps {
  onDismiss?: () => void;
}

export function PWAUpdateNotification({ onDismiss }: PWAUpdateNotificationProps) {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateVersion, setUpdateVersion] = useState<string>('');

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Listen for service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Service worker updated');
        setShowUpdate(false);
        // Optionally reload the page
        window.location.reload();
      });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SW_UPDATED') {
          setUpdateVersion(event.data.version || '');
          setShowUpdate(true);
        }
      });

      // Check for waiting service worker
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          setShowUpdate(true);
        }
      });
    }
  }, []);

  const handleUpdate = async () => {
    if (!('serviceWorker' in navigator)) return;

    setIsUpdating(true);
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration?.waiting) {
        // Tell the waiting service worker to skip waiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        // Force update by reloading
        window.location.reload();
      }
    } catch (error) {
      console.error('[PWA] Update failed:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    onDismiss?.();
    // Don't show again for this session
    sessionStorage.setItem('cf-tracker-update-dismissed', 'true');
  };

  // Don't show if dismissed this session
  if (typeof sessionStorage !== 'undefined' && 
      sessionStorage.getItem('cf-tracker-update-dismissed')) {
    return null;
  }

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="shadow-lg border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">App Update Available</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    <Download className="h-3 w-3 mr-1" />
                    New Version
                  </Badge>
                  {updateVersion && (
                    <Badge variant="outline" className="text-xs">
                      v{updateVersion}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <CardDescription className="mb-4">
            A new version of CF Tracker is available with improvements and bug fixes. 
            Update now for the best experience.
          </CardDescription>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Sparkles className="h-4 w-4 text-green-600" />
              <span>Enhanced offline functionality</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RefreshCw className="h-4 w-4 text-green-600" />
              <span>Improved data synchronization</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Download className="h-4 w-4 text-green-600" />
              <span>Better performance and stability</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleUpdate} 
              disabled={isUpdating}
              className="flex-1"
            >
              {isUpdating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isUpdating ? 'Updating...' : 'Update Now'}
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for update status
export function usePWAUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'SW_UPDATED') {
          setUpdateAvailable(true);
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      
      // Check for waiting service worker
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          setUpdateAvailable(true);
        }
      });

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  const update = async () => {
    if (!('serviceWorker' in navigator)) return false;

    setIsUpdating(true);
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        return true;
      } else {
        window.location.reload();
        return true;
      }
    } catch (error) {
      console.error('Update failed:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateAvailable,
    isUpdating,
    update,
  };
}