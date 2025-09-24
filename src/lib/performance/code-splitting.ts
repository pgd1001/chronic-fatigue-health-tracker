/**
 * Code splitting utilities for optimal performance
 * Implements lazy loading for components and routes
 */

import { lazy, ComponentType } from 'react';

// Lazy load components with error boundaries
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
) => {
  const LazyComponent = lazy(importFn);
  
  return LazyComponent;
};

// Route-based code splitting
export const LazyRoutes = {
  Dashboard: lazy(() => import('@/app/dashboard/page')),
  Movement: lazy(() => import('@/app/movement/page')),
  Sleep: lazy(() => import('@/app/sleep/page')),
  Biometrics: lazy(() => import('@/app/biometrics/page')),
  Reports: lazy(() => import('@/app/reports/page')),
  Offline: lazy(() => import('@/app/offline/page')),
};

// Component-based code splitting for heavy components
export const LazyComponents = {
  BiometricCapture: lazy(() => import('@/components/health/biometric-capture')),
  MovementSession: lazy(() => import('@/components/health/movement-session')),
  HealthcareReports: lazy(() => import('@/components/health/healthcare-reports')),
  SymptomProgress: lazy(() => import('@/components/health/symptom-progress')),
  EvidenceBasedContent: lazy(() => import('@/components/content/evidence-based-content')),
};

// Dynamic imports for utilities and services
export const dynamicImports = {
  // AI/ML libraries - load only when needed
  tensorFlow: () => import('@tensorflow/tfjs'),
  
  // Chart libraries for data visualization
  charts: () => import('recharts'),
  
  // PDF generation for reports
  pdfLib: () => import('jspdf'),
  
  // Camera utilities for biometrics
  mediaDevices: () => import('@/lib/utils/camera'),
  
  // Heavy calculation utilities
  statistics: () => import('@/lib/utils/statistics'),
};

// Preload critical components based on user behavior
export const preloadComponents = {
  // Preload dashboard components for authenticated users
  preloadDashboard: () => {
    import('@/components/health/daily-anchor-routine');
    import('@/components/health/energy-assessment');
  },
  
  // Preload movement components when energy level is suitable
  preloadMovement: () => {
    import('@/components/health/movement-session');
    import('@/components/health/movement-dashboard');
  },
  
  // Preload biometric components when camera permission granted
  preloadBiometrics: () => {
    import('@/components/health/biometric-capture');
    import('@/lib/utils/camera');
  },
};

// Bundle analysis utilities
export const bundleAnalysis = {
  // Track component load times
  trackComponentLoad: (componentName: string, startTime: number) => {
    const loadTime = performance.now() - startTime;
    
    // Report to performance monitoring
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`component-${componentName}-loaded`);
      performance.measure(
        `component-${componentName}-load-time`,
        `component-${componentName}-start`,
        `component-${componentName}-loaded`
      );
    }
    
    return loadTime;
  },
  
  // Monitor bundle sizes
  getBundleInfo: () => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        transferSize: navigation.transferSize,
        encodedBodySize: navigation.encodedBodySize,
        decodedBodySize: navigation.decodedBodySize,
      };
    }
    return null;
  },
};