/**
 * Performance testing suite for chronic fatigue health tracker
 * Tests performance under various conditions and device capabilities
 */

export interface PerformanceTestResult {
  testName: string;
  passed: boolean;
  score: number;
  metrics: {
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
    memory?: number;
    fps?: number;
    cognitiveLoad?: number;
    touchTarget?: number;
    offlineScore?: number;
    resourceLoad?: number;
    apiResponse?: number;
    imageLoad?: number;
  };
  recommendations: string[];
  timestamp: number;
  duration: number;
}

export interface TestSuite {
  name: string;
  tests: PerformanceTest[];
  deviceType: 'low-end' | 'mid-range' | 'high-end';
  connectionType: 'slow' | 'medium' | 'fast';
}

export interface PerformanceTest {
  name: string;
  description: string;
  thresholds: {
    good: number;
    needsImprovement: number;
  };
  metric: string;
  run: () => Promise<number>;
}

export interface PerformanceReport {
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageScore: number;
    overallRating: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  };
  results: PerformanceTestResult[];
  recommendations: string[];
  timestamp: number;
}

class PerformanceTestRunner {
  private testSuites: TestSuite[] = [];
  private results: PerformanceTestResult[] = [];

  constructor() {
    this.initializeTestSuites();
  }

  private initializeTestSuites(): void {
    // Low-end device test suite
    this.testSuites.push({
      name: 'Low-End Device Tests',
      deviceType: 'low-end',
      connectionType: 'slow',
      tests: [
        {
          name: 'Page Load Time',
          description: 'Time for initial page load on slow devices',
          thresholds: { good: 3000, needsImprovement: 5000 },
          metric: 'LCP',
          run: this.testPageLoadTime.bind(this),
        },
        {
          name: 'First Input Delay',
          description: 'Responsiveness to user interactions',
          thresholds: { good: 100, needsImprovement: 300 },
          metric: 'FID',
          run: this.testFirstInputDelay.bind(this),
        },
        {
          name: 'Memory Usage',
          description: 'JavaScript heap memory consumption',
          thresholds: { good: 50, needsImprovement: 80 },
          metric: 'Memory',
          run: this.testMemoryUsage.bind(this),
        },
        {
          name: 'Component Load Time',
          description: 'Time to load heavy components',
          thresholds: { good: 1000, needsImprovement: 2000 },
          metric: 'ComponentLoad',
          run: this.testComponentLoadTime.bind(this),
        },
      ],
    });

    // Chronic illness specific tests
    this.testSuites.push({
      name: 'Chronic Illness UX Tests',
      deviceType: 'mid-range',
      connectionType: 'medium',
      tests: [
        {
          name: 'Cognitive Load Test',
          description: 'UI complexity and cognitive burden',
          thresholds: { good: 5, needsImprovement: 8 },
          metric: 'CognitiveLoad',
          run: this.testCognitiveLoad.bind(this),
        },
        {
          name: 'Animation Performance',
          description: 'Smooth animations without causing fatigue',
          thresholds: { good: 60, needsImprovement: 30 },
          metric: 'FPS',
          run: this.testAnimationPerformance.bind(this),
        },
        {
          name: 'Touch Target Size',
          description: 'Accessibility of interactive elements',
          thresholds: { good: 44, needsImprovement: 36 },
          metric: 'TouchTarget',
          run: this.testTouchTargetSize.bind(this),
        },
        {
          name: 'Offline Functionality',
          description: 'App functionality without internet',
          thresholds: { good: 90, needsImprovement: 70 },
          metric: 'OfflineScore',
          run: this.testOfflineFunctionality.bind(this),
        },
      ],
    });

    // Network performance tests
    this.testSuites.push({
      name: 'Network Performance Tests',
      deviceType: 'mid-range',
      connectionType: 'slow',
      tests: [
        {
          name: 'Resource Loading',
          description: 'Critical resource loading time',
          thresholds: { good: 2000, needsImprovement: 4000 },
          metric: 'ResourceLoad',
          run: this.testResourceLoading.bind(this),
        },
        {
          name: 'API Response Time',
          description: 'Health data API responsiveness',
          thresholds: { good: 500, needsImprovement: 1000 },
          metric: 'APIResponse',
          run: this.testAPIResponseTime.bind(this),
        },
        {
          name: 'Image Optimization',
          description: 'Optimized image loading',
          thresholds: { good: 1500, needsImprovement: 3000 },
          metric: 'ImageLoad',
          run: this.testImageOptimization.bind(this),
        },
      ],
    });
  }

  // Test implementations
  private async testPageLoadTime(): Promise<number> {
    if (typeof window === 'undefined') return 0;
    
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return 0;
    
    return navigation.loadEventEnd - navigation.fetchStart;
  }

  private async testFirstInputDelay(): Promise<number> {
    if (typeof window === 'undefined') return 0;
    
    return new Promise((resolve) => {
      let firstInputDelay = 0;
      let resolved = false;
      
      const handleFirstInput = (event: Event) => {
        if (resolved) return;
        resolved = true;
        
        firstInputDelay = performance.now() - event.timeStamp;
        ['mousedown', 'keydown', 'touchstart'].forEach(type => {
          document.removeEventListener(type, handleFirstInput, true);
        });
        resolve(firstInputDelay);
      };

      ['mousedown', 'keydown', 'touchstart'].forEach(type => {
        document.addEventListener(type, handleFirstInput, true);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(0);
        }
      }, 5000);
    });
  }

  private async testMemoryUsage(): Promise<number> {
    if (typeof window === 'undefined' || !('memory' in performance)) return 0;
    
    const memory = (performance as any).memory;
    return (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
  }

  private async testComponentLoadTime(): Promise<number> {
    if (typeof window === 'undefined') return 0;
    
    const startTime = performance.now();
    
    try {
      // Test loading a heavy component
      await import('@/components/health/healthcare-reports');
      return performance.now() - startTime;
    } catch (error) {
      return 5000; // Return high value if component fails to load
    }
  }

  private async testCognitiveLoad(): Promise<number> {
    if (typeof window === 'undefined') return 0;
    
    // Measure UI complexity
    const interactiveElements = document.querySelectorAll('button, input, select, textarea, a[href]');
    const visibleElements = Array.from(interactiveElements).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    // Score based on number of visible interactive elements
    // Lower is better for chronic illness users
    return Math.min(visibleElements.length, 10);
  }

  private async testAnimationPerformance(): Promise<number> {
    if (typeof window === 'undefined') return 60;
    
    return new Promise((resolve) => {
      let frames = 0;
      const startTime = performance.now();
      
      function countFrames() {
        frames++;
        if (performance.now() - startTime < 1000) {
          requestAnimationFrame(countFrames);
        } else {
          resolve(frames);
        }
      }
      
      requestAnimationFrame(countFrames);
    });
  }

  private async testTouchTargetSize(): Promise<number> {
    if (typeof window === 'undefined') return 44;
    
    const interactiveElements = document.querySelectorAll('button, input, select, textarea, a[href]');
    let minSize = Infinity;

    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      if (size > 0 && size < minSize) {
        minSize = size;
      }
    });

    return minSize === Infinity ? 44 : minSize;
  }

  private async testOfflineFunctionality(): Promise<number> {
    if (typeof window === 'undefined') return 0;
    
    // Test offline capabilities
    let score = 0;
    
    // Check service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      score += 30;
    }
    
    // Check local storage usage
    if (localStorage.length > 0) {
      score += 20;
    }
    
    // Check cache API
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        if (cacheNames.length > 0) {
          score += 30;
        }
      } catch (error) {
        // Cache not available
      }
    }
    
    // Check offline page
    try {
      const response = await fetch('/offline', { method: 'HEAD' });
      if (response.ok) {
        score += 20;
      }
    } catch (error) {
      // Offline page not available
    }
    
    return score;
  }

  private async testResourceLoading(): Promise<number> {
    if (typeof window === 'undefined') return 0;
    
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const criticalResources = resources.filter(resource => 
      resource.name.includes('.css') || 
      resource.name.includes('.js') ||
      resource.name.includes('font')
    );

    if (criticalResources.length === 0) return 0;

    const averageLoadTime = criticalResources.reduce((sum, resource) => 
      sum + resource.duration, 0) / criticalResources.length;

    return averageLoadTime;
  }

  private async testAPIResponseTime(): Promise<number> {
    if (typeof window === 'undefined') return 0;
    
    const startTime = performance.now();
    
    try {
      // Test a lightweight API endpoint
      const response = await fetch('/api/health', { method: 'HEAD' });
      if (!response.ok) {
        return 2000; // Return moderate value for failed API
      }
      return performance.now() - startTime;
    } catch (error) {
      return 5000; // Return high value if API is unavailable
    }
  }

  private async testImageOptimization(): Promise<number> {
    if (typeof window === 'undefined') return 0;
    
    const images = document.querySelectorAll('img');
    if (images.length === 0) return 0;

    const imagePromises = Array.from(images).slice(0, 5).map(img => { // Test only first 5 images
      return new Promise<number>((resolve) => {
        if (img.complete) {
          resolve(0);
          return;
        }

        const startTime = performance.now();
        
        const onLoad = () => {
          const loadTime = performance.now() - startTime;
          img.removeEventListener('load', onLoad);
          img.removeEventListener('error', onError);
          resolve(loadTime);
        };

        const onError = () => {
          img.removeEventListener('load', onLoad);
          img.removeEventListener('error', onError);
          resolve(5000); // High value for failed images
        };

        img.addEventListener('load', onLoad);
        img.addEventListener('error', onError);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          img.removeEventListener('load', onLoad);
          img.removeEventListener('error', onError);
          resolve(10000);
        }, 10000);
      });
    });

    const loadTimes = await Promise.all(imagePromises);
    const validLoadTimes = loadTimes.filter(time => time > 0);
    
    if (validLoadTimes.length === 0) return 0;
    
    return validLoadTimes.reduce((sum, time) => sum + time, 0) / validLoadTimes.length;
  }

  // Public API
  public async runTestSuite(suiteName: string): Promise<PerformanceTestResult[]> {
    const suite = this.testSuites.find(s => s.name === suiteName);
    if (!suite) {
      throw new Error(`Test suite "${suiteName}" not found`);
    }

    const results: PerformanceTestResult[] = [];

    for (const test of suite.tests) {
      console.log(`Running test: ${test.name}`);
      
      try {
        const startTime = performance.now();
        const testValue = await test.run();
        const duration = performance.now() - startTime;

        const passed = testValue <= test.thresholds.good;
        const score = this.calculateScore(testValue, test.thresholds);
        const recommendations = this.generateRecommendations(test, testValue, passed);

        const result: PerformanceTestResult = {
          testName: test.name,
          passed,
          score,
          metrics: { [test.metric.toLowerCase()]: testValue },
          recommendations,
          timestamp: Date.now(),
          duration,
        };

        results.push(result);
        this.results.push(result);

        console.log(`Test "${test.name}" completed in ${duration.toFixed(2)}ms:`, {
          value: testValue,
          passed,
          score,
        });
      } catch (error) {
        console.error(`Test "${test.name}" failed:`, error);
        
        const result: PerformanceTestResult = {
          testName: test.name,
          passed: false,
          score: 0,
          metrics: {},
          recommendations: ['Test failed to execute. Check console for errors.'],
          timestamp: Date.now(),
          duration: 0,
        };

        results.push(result);
        this.results.push(result);
      }
    }

    return results;
  }

  public async runAllTests(): Promise<PerformanceTestResult[]> {
    const allResults: PerformanceTestResult[] = [];

    for (const suite of this.testSuites) {
      const suiteResults = await this.runTestSuite(suite.name);
      allResults.push(...suiteResults);
    }

    return allResults;
  }

  private calculateScore(value: number, thresholds: { good: number; needsImprovement: number }): number {
    if (value <= thresholds.good) return 100;
    if (value <= thresholds.needsImprovement) {
      // Linear interpolation between 100 and 50
      const ratio = (value - thresholds.good) / (thresholds.needsImprovement - thresholds.good);
      return Math.round(100 - (ratio * 50));
    }
    // Linear interpolation between 50 and 0
    const ratio = Math.min((value - thresholds.needsImprovement) / thresholds.needsImprovement, 1);
    return Math.round(50 - (ratio * 50));
  }

  private generateRecommendations(test: PerformanceTest, testValue: number, passed: boolean): string[] {
    const recommendations: string[] = [];

    if (!passed) {
      switch (test.metric) {
        case 'LCP':
          recommendations.push('Consider enabling performance mode for faster loading');
          recommendations.push('Optimize images and reduce initial bundle size');
          break;
        case 'FID':
          recommendations.push('Reduce JavaScript execution time');
          recommendations.push('Consider code splitting for better responsiveness');
          break;
        case 'Memory':
          recommendations.push('High memory usage detected - consider closing other tabs');
          recommendations.push('Enable aggressive optimizations');
          break;
        case 'CognitiveLoad':
          recommendations.push('Simplify the user interface');
          recommendations.push('Reduce the number of visible interactive elements');
          break;
        case 'FPS':
          recommendations.push('Enable reduced motion mode');
          recommendations.push('Simplify animations and visual effects');
          break;
        case 'TouchTarget':
          recommendations.push('Increase touch target sizes for better accessibility');
          recommendations.push('Ensure minimum 44px touch targets');
          break;
        case 'OfflineScore':
          recommendations.push('Improve offline functionality');
          recommendations.push('Enable service worker and local caching');
          break;
        case 'ResourceLoad':
          recommendations.push('Optimize critical resource loading');
          recommendations.push('Consider resource preloading and compression');
          break;
        case 'APIResponse':
          recommendations.push('Optimize API response times');
          recommendations.push('Consider caching and request optimization');
          break;
        case 'ImageLoad':
          recommendations.push('Optimize image loading and compression');
          recommendations.push('Consider lazy loading and modern image formats');
          break;
      }
    }

    return recommendations;
  }

  public getTestResults(): PerformanceTestResult[] {
    return [...this.results];
  }

  public getTestSuites(): TestSuite[] {
    return [...this.testSuites];
  }

  public generateReport(): PerformanceReport {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const averageScore = totalTests > 0 ? this.results.reduce((sum, r) => sum + r.score, 0) / totalTests : 0;
    
    let overallRating: 'excellent' | 'good' | 'needs-improvement' | 'poor';
    if (averageScore >= 90) overallRating = 'excellent';
    else if (averageScore >= 75) overallRating = 'good';
    else if (averageScore >= 50) overallRating = 'needs-improvement';
    else overallRating = 'poor';

    // Generate overall recommendations
    const recommendations: string[] = [];
    const failedResults = this.results.filter(r => !r.passed);
    
    if (failedResults.length > 0) {
      recommendations.push(`${failedResults.length} tests failed. Review individual test recommendations.`);
    }
    
    if (averageScore < 75) {
      recommendations.push('Consider enabling performance mode for better user experience.');
    }
    
    if (failedResults.some(r => r.testName.includes('Cognitive Load'))) {
      recommendations.push('Simplify the user interface to reduce cognitive burden for chronic illness users.');
    }

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        averageScore: Math.round(averageScore),
        overallRating,
      },
      results: [...this.results],
      recommendations,
      timestamp: Date.now(),
    };
  }

  public clearResults(): void {
    this.results = [];
  }
}

// Export singleton instance
export const performanceTestRunner = new PerformanceTestRunner();

// Utility functions
export async function runPerformanceTests(): Promise<PerformanceTestResult[]> {
  return await performanceTestRunner.runAllTests();
}

export async function runCriticalTests(): Promise<PerformanceTestResult[]> {
  return await performanceTestRunner.runTestSuite('Chronic Illness UX Tests');
}

export function getPerformanceReport(): PerformanceReport {
  return performanceTestRunner.generateReport();
}

export async function runLowEndDeviceTests(): Promise<PerformanceTestResult[]> {
  return await performanceTestRunner.runTestSuite('Low-End Device Tests');
}

export async function runNetworkTests(): Promise<PerformanceTestResult[]> {
  return await performanceTestRunner.runTestSuite('Network Performance Tests');
}