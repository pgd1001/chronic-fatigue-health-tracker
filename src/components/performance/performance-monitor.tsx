'use client';

import React, { useEffect, useState } from 'react';
import { webVitalsMonitor, useWebVitals } from '@/lib/performance/web-vitals';
import { performanceOptimizer, onOptimizationSuggestion } from '@/lib/performance/optimization';
import { errorTracker } from '@/lib/monitoring/error-tracking';
import { performanceTestRunner, getPerformanceReport } from '@/lib/performance/performance-testing';

interface PerformanceMonitorProps {
  enableTesting?: boolean;
  showSuggestions?: boolean;
}

interface PerformanceSuggestion {
  id: string;
  message: string;
  type: 'performance' | 'accessibility' | 'network';
  timestamp: number;
}

export function PerformanceMonitor({ 
  enableTesting = false, 
  showSuggestions = true 
}: PerformanceMonitorProps) {
  const [suggestions, setSuggestions] = useState<PerformanceSuggestion[]>([]);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  const [performanceMode, setPerformanceMode] = useState(false);
  const { getReport, isLowEndDevice: checkLowEnd } = useWebVitals();

  useEffect(() => {
    // Initialize error tracking
    errorTracker.initialize(process.env.NEXT_PUBLIC_SENTRY_DSN);

    // Check device capabilities
    const lowEnd = checkLowEnd();
    setIsLowEndDevice(lowEnd);

    // Check for saved performance mode preference
    const savedMode = localStorage.getItem('performance-mode') === 'enabled';
    setPerformanceMode(savedMode);

    if (savedMode) {
      performanceOptimizer.enablePerformanceMode();
    }

    // Set up optimization suggestion listener
    const unsubscribe = onOptimizationSuggestion((message: string) => {
      if (showSuggestions) {
        const suggestion: PerformanceSuggestion = {
          id: Date.now().toString(),
          message,
          type: 'performance',
          timestamp: Date.now(),
        };
        
        setSuggestions(prev => [...prev.slice(-4), suggestion]); // Keep only last 5 suggestions
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
          setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
        }, 10000);
      }
    });

    // Run performance tests if enabled
    if (enableTesting && process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        runPerformanceTests();
      }, 5000); // Wait 5 seconds after page load
    }

    return () => {
      unsubscribe();
    };
  }, [enableTesting, showSuggestions, checkLowEnd]);

  const runPerformanceTests = async () => {
    try {
      console.log('Running performance tests...');
      const results = await performanceTestRunner.runTestSuite('Chronic Illness UX Tests');
      const report = getPerformanceReport();
      
      console.log('Performance test results:', report);
      
      // Track performance issues
      if (report.summary.averageScore < 75) {
        errorTracker.captureMessage(
          `Performance test average score: ${report.summary.averageScore}`,
          'warning'
        );
      }
    } catch (error) {
      console.error('Performance tests failed:', error);
      errorTracker.captureException(error as Error);
    }
  };

  const enablePerformanceMode = () => {
    performanceOptimizer.enablePerformanceMode();
    setPerformanceMode(true);
    
    const suggestion: PerformanceSuggestion = {
      id: Date.now().toString(),
      message: 'Performance mode enabled for better user experience',
      type: 'performance',
      timestamp: Date.now(),
    };
    
    setSuggestions(prev => [...prev.slice(-4), suggestion]);
  };

  const disablePerformanceMode = () => {
    performanceOptimizer.disablePerformanceMode();
    setPerformanceMode(false);
    
    const suggestion: PerformanceSuggestion = {
      id: Date.now().toString(),
      message: 'Performance mode disabled',
      type: 'performance',
      timestamp: Date.now(),
    };
    
    setSuggestions(prev => [...prev.slice(-4), suggestion]);
  };

  const dismissSuggestion = (id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  if (!showSuggestions && suggestions.length === 0) {
    return null;
  }

  return (
    <>
      {/* Performance Suggestions */}
      {suggestions.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="max-w-sm rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-blue-500">💡</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-800">
                      Performance Tip
                    </p>
                    <p className="mt-1 text-sm text-blue-700">
                      {suggestion.message}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => dismissSuggestion(suggestion.id)}
                  className="ml-4 inline-flex flex-shrink-0 rounded-md bg-blue-50 p-1.5 text-blue-500 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-blue-50"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Performance Mode Toggle (only show for low-end devices or in dev mode) */}
      {(isLowEndDevice || process.env.NODE_ENV === 'development') && (
        <div className="fixed bottom-4 left-4 z-40">
          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">
                Performance Mode
              </span>
              <button
                onClick={performanceMode ? disablePerformanceMode : enablePerformanceMode}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  performanceMode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    performanceMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {isLowEndDevice && (
              <p className="mt-1 text-xs text-gray-500">
                Recommended for your device
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default PerformanceMonitor;