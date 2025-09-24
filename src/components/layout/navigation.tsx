'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Activity, 
  Heart, 
  Moon, 
  Droplets, 
  Dumbbell,
  AlertCircle,
  Camera,
  FileText,
  Shield
} from 'lucide-react';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Daily Anchor',
    href: '/anchor',
    icon: Activity,
  },
  {
    name: 'Energy Tracking',
    href: '/energy',
    icon: Heart,
  },
  {
    name: 'Symptoms',
    href: '/symptoms',
    icon: AlertCircle,
  },
  {
    name: 'Biometrics',
    href: '/biometrics',
    icon: Camera,
  },
  {
    name: 'Movement',
    href: '/movement',
    icon: Dumbbell,
  },
  {
    name: 'Sleep',
    href: '/sleep',
    icon: Moon,
  },
  {
    name: 'Nutrition',
    href: '/nutrition',
    icon: Droplets,
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
  },
  {
    name: 'Privacy',
    href: '/privacy',
    icon: Shield,
  },
];

interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav className={cn('space-y-2', className)}>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}