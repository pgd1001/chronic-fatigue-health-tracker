'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Database
} from 'lucide-react';
import { offlineManager, type ConnectionStatus } from '@/lib/pwa/offline-manager';

interface PWAStatusProps {
  showDetails?: boolean;
  className?: string;
}

export function PWAStatus({ showDetails = false, className = '' }: PWAStatusProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isOnline: true,
    lastOnline: null,
    syncPending: false,
    pendingCount: 0,
  });
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    synced: number;
    failed: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    // Initial status
    setConnectionStatus(offlineManager.getConnectionStatus());

    // Listen for connection changes
    const unsubscribe = offlineManager.onConnectionChange(setConnectionStatus);

    // Listen for service worker messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        setLastSyncResult({
          synced: event.data.synced,
          failed: event.data.failed,
          total: event.data.total,
        });
        // Update connection status after sync
        setConnectionStatus(offlineManager.getConnectionStatus());
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    return () => {
      unsubscribe();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Try to sync offline data
      await offlineManager.syncOfflineData();
      // Force a connection check
      window.location.reload();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleForceSync = async () => {
    try {
      await offlineManager.syncOfflineData();
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  };

  if (!showDetails) {
    // Simple status indicator
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {connectionStatus.isOnline ? (
          <Badge variant="secondary" className="text-xs">
            <Wifi className="h-3 w-3 mr-1" />
            Online
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            <WifiOff className="h-3 w-3 mr-1" />
            Offline
          </Badge>
        )}
        
        {connectionStatus.syncPending && (
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {connectionStatus.pendingCount} pending
          </Badge>
        )}
      </div>
    );
  }

  // Detailed status card
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {connectionStatus.isOnline ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          )}
          Connection Status
        </CardTitle>
        <CardDescription>
          {connectionStatus.isOnline 
            ? 'You are connected to the internet'
            : 'You are currently offline'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Network</span>
          {connectionStatus.isOnline ? (
            <Badge variant="secondary">
              <Wifi className="h-3 w-3 mr-1" />
              Online
            </Badge>
          ) : (
            <Badge variant="outline">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>

        {/* Last Online */}
        {!connectionStatus.isOnline && connectionStatus.lastOnline && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Last Online</span>
            <span className="text-sm text-gray-600">
              {connectionStatus.lastOnline.toLocaleString()}
            </span>
          </div>
        )}

        {/* Pending Sync */}
        {connectionStatus.syncPending && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Pending Sync</span>
            <Badge variant="secondary">
              <Database className="h-3 w-3 mr-1" />
              {connectionStatus.pendingCount} items
            </Badge>
          </div>
        )}

        {/* Last Sync Result */}
        {lastSyncResult && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-1">
              Last Sync Complete
            </div>
            <div className="text-xs text-blue-700">
              {lastSyncResult.synced} synced, {lastSyncResult.failed} failed 
              of {lastSyncResult.total} total
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!connectionStatus.isOnline && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Checking...' : 'Retry Connection'}
            </Button>
          )}
          
          {connectionStatus.isOnline && connectionStatus.syncPending && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleForceSync}
              className="flex-1"
            >
              <Database className="h-4 w-4 mr-2" />
              Force Sync
            </Button>
          )}
        </div>

        {/* Offline Capabilities */}
        {!connectionStatus.isOnline && (
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-green-900 mb-2">
              Available Offline
            </div>
            <div className="space-y-1 text-xs text-green-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                Energy and symptom tracking
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                Daily anchor routines
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                Recent health data
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                Movement sessions
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for simple connection status
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncPending, setSyncPending] = useState(false);

  useEffect(() => {
    const updateStatus = (status: ConnectionStatus) => {
      setIsOnline(status.isOnline);
      setSyncPending(status.syncPending);
    };

    updateStatus(offlineManager.getConnectionStatus());
    const unsubscribe = offlineManager.onConnectionChange(updateStatus);

    return unsubscribe;
  }, []);

  return { isOnline, syncPending };
}