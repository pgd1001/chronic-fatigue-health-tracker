'use client';

import { Sidebar } from './sidebar';
import { PWAStatus } from '@/components/pwa/pwa-status';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="relative">
          {/* PWA Status indicator in top right */}
          <div className="absolute top-4 right-4 z-10">
            <PWAStatus />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}