'use client';

import { useEffect } from 'react';
import { InstallPrompt } from './install-prompt';
import { PWAUpdateNotification } from './pwa-update-notification';

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })
        .then((registration) => {
          console.log('[PWA] Service worker registered:', registration.scope);
          
          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute
        })
        .catch((error) => {
          console.error('[PWA] Service worker registration failed:', error);
        });

      // Handle service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Service worker controller changed');
        // Optionally show a notification that the app has been updated
      });
    }

    // Handle app installation
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App was installed');
      // Track installation analytics if needed
    });

    // Handle beforeinstallprompt for custom install UI
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWA] Before install prompt fired');
      // The InstallPrompt component will handle this
    });

    // Handle online/offline status
    const handleOnline = () => {
      console.log('[PWA] App is online');
      // Trigger sync when coming back online
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_REQUEST',
          tag: 'health-data-sync'
        });
      }
    };

    const handleOffline = () => {
      console.log('[PWA] App is offline');
      // Show offline indicator or notification
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {children}
      <InstallPrompt />
      <PWAUpdateNotification />
    </>
  );
}