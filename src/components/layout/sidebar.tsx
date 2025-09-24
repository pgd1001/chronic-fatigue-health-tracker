'use client';

import { Heart } from 'lucide-react';
import { Navigation } from './navigation';
import { UserMenu } from '@/components/auth/user-menu';

export function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col bg-background border-r">
      {/* Logo */}
      <div className="flex items-center space-x-2 px-6 py-4 border-b">
        <Heart className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">CF Tracker</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6">
        <Navigation />
      </div>

      {/* User Menu */}
      <div className="px-4 py-4 border-t">
        <UserMenu />
      </div>
    </div>
  );
}