// Core Web Vitals monitoring and performance tracking
// Optimized for chronic illness users who may have slower devices or connections

export interface WebVitalsMetric {
  id: string;
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'prerender';
  timestamp: number;
}

export interface PerformanceMetrics {
  // Core Web Vitals
  cls?: number; // Cumulative Layout Shift
  fid?: number; // First Input Delay
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  ttfb?: number; // Time to First Byte
  inp?: number; // Interaction to Next Paint

  // Custom metrics for chronic illness users
  timeToInteractive?: number;
  memoryUsage?: number;
  connectionType?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  batteryLevel?: number;
  reducedMotion?: boolean;
  
  // User context
  energyLevel?: number; // If user has logged energy level
  fatigueMode?: boolean;
  accessibilityFeatures?: string[];
}

class WebVitalsMonitor {
  private metrics: Map<string, WebVitalsMetric> = new Map();
  private listeners: ((metric: WebVitalsMetric) => void)[] = [];
  private isMonitoring = false;
  private performanceObserver?: PerformanceObserver;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring(): void {
    // Initialize Web Vitals monitoring
    this.initWebVitals();
    
    // Monitor custom metrics
    this.initCustomMetrics();
    
    // Monitor resource loading
    this.initResourceMonitoring();
    
    this.isMonitoring = true;
  }

  private initWebVitals(): void {
    // Dynamic import to avoid SSR issues
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS(this.handleMetric.bind(this));
      onFCP(this.handleMetric.bind(this));
      onLCP(this.handleMetric.bind(this));
      onTTFB(this.handleMetric.bind(this));
      onINP(this.handleMetric.bind(this));
    }).catch(error => {
      console.warn('Failed to load web-vitals:', error);
      // Fallback to manual measurement
      this.initManualWebVitals();
    });
  }

  private initManualWebVitals(): void {
    // Manual FID measurement since it's deprecated in web-vitals v3
    this.measureFirstInputDelay();
    
    // Manual LCP measurement as fallback
    this.measureLargestContentfulPaint();
  }

  private measureFirstInputDelay(): void {
    let firstInputDelay: number | null = null;
    
    const handleFirstInput = (event: Event) => {
      if (firstInputDelay === null) {
        firstInputDelay = performance.now() - event.timeStamp;
        
        this.handleMetric({
          id: 'fid-manual',
          name: 'FID',
          value: firstInputDelay,
          delta: firstInputDelay,
          rating: firstInputDelay < 100 ? 'good' : firstInputDelay < 300 ? 'needs-improvement' : 'poor',
          navigationType: 'navigate',
        });
        
        // Remove listeners after first input
        ['mousedown', 'keydown', 'touchstart', 'pointerdown'].forEach(type => {
          document.removeEventListener(type, handleFirstInput, true);
        });
      }
    };

    // Listen for first input
    ['mousedown', 'keydown', 'touchstart', 'pointerdown'].forEach(type => {
      document.addEventListener(type, handleFirstInput, true);
    });
  }

  private measureLargestContentfulPaint(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          this.handleMetric({
            id: 'lcp-manual',
            name: 'LCP',
            value: lastEntry.startTime,
            delta: 0,
            rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor',
            navigationType: 'navigate',
          });
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        console.warn('Manual LCP measurement failed:', error);
      }
    }
  }

  private initCustomMetrics(): void {
    // Monitor Time to Interactive
    this.measureTimeToInteractive();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
    
    // Monitor connection quality
    this.monitorConnection();
    
    // Monitor battery status
    this.monitorBattery();
  }

  private initResourceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.analyzeResourceTiming(entry);
        }
      });

      this.performanceObserver.observe({ 
        entryTypes: ['resource', 'navigation', 'paint', 'layout-shift'] 
      });
    }
  }

  private handleMetric(metric: any): void {
    const webVitalsMetric: WebVitalsMetric = {
      id: metric.id,
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      rating: metric.rating,
      navigationType: metric.navigationType || 'navigate',
      timestamp: Date.now(),
    };

    this.metrics.set(metric.name, webVitalsMetric);
    this.notifyListeners(webVitalsMetric);
    
    // Log poor performance for chronic illness optimization
    if (metric.rating === 'poor') {
      this.handlePoorPerformance(webVitalsMetric);
    }
  }

  private measureTimeToInteractive(): void {
    // Measure when the page becomes interactive
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        const tti = performance.now();
        this.recordCustomMetric('TTI', tti);
      });
    }
  }

  private monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      };
      
      this.recordCustomMetric('MEMORY', memoryUsage.used / memoryUsage.limit);
    }
  }

  private monitorConnection(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.recordCustomMetric('CONNECTION', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      });
    }
  }

  private monitorBattery(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.recordCustomMetric('BATTERY', {
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
        });
      });
    }
  }

  private analyzeResourceTiming(entry: PerformanceEntry): void {
    if (entry.entryType === 'resource') {
      const resourceEntry = entry as PerformanceResourceTiming;
      
      // Flag slow resources that might impact chronic illness users
      const loadTime = resourceEntry.responseEnd - resourceEntry.requestStart;
      if (loadTime > 3000) { // 3 seconds threshold
        console.warn(`Slow resource detected: ${resourceEntry.name} took ${loadTime}ms`);
        this.recordSlowResource(resourceEntry);
      }
    }
  }

  private recordCustomMetric(name: string, value: any): void {
    const metric: WebVitalsMetric = {
      id: `${name}-${Date.now()}`,
      name: name as any,
      value: typeof value === 'number' ? value : 0,
      delta: 0,
      rating: this.getRating(name, value),
      navigationType: 'navigate',
      timestamp: Date.now(),
    };

    this.metrics.set(name, metric);
    this.notifyListeners(metric);
  }

  private recordSlowResource(entry: PerformanceResourceTiming): void {
    // Record slow resources for optimization
    const slowResource = {
      name: entry.name,
      duration: entry.duration,
      size: entry.transferSize,
      type: this.getResourceType(entry.name),
      timestamp: Date.now(),
    };

    // Send to analytics or logging service
    this.reportSlowResource(slowResource);
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.webp')) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    return 'other';
  }

  private getRating(name: string, value: any): 'good' | 'needs-improvement' | 'poor' {
    // Custom thresholds for chronic illness users (more lenient)
    switch (name) {
      case 'TTI':
        return value < 5000 ? 'good' : value < 10000 ? 'needs-improvement' : 'poor';
      case 'MEMORY':
        return value < 0.7 ? 'good' : value < 0.9 ? 'needs-improvement' : 'poor';
      default:
        return 'good';
    }
  }

  private handlePoorPerformance(metric: WebVitalsMetric): void {
    // Suggest performance optimizations for chronic illness users
    const suggestions = this.getPerformanceSuggestions(metric);
    
    // Could trigger gentle notifications or UI hints
    console.info(`Performance suggestion for ${metric.name}:`, suggestions);
    
    // Report to analytics
    this.reportPerformanceIssue(metric, suggestions);
  }

  private getPerformanceSuggestions(metric: WebVitalsMetric): string[] {
    const suggestions: string[] = [];

    switch (metric.name) {
      case 'LCP':
        suggestions.push('Consider enabling reduced motion mode for faster loading');
        suggestions.push('Images and content are being optimized for your connection');
        break;
      case 'FID':
        suggestions.push('The app is working to respond faster to your interactions');
        suggestions.push('Consider closing other browser tabs to improve responsiveness');
        break;
      case 'CLS':
        suggestions.push('Layout shifts are being minimized for better stability');
        break;
    }

    return suggestions;
  }

  private reportSlowResource(resource: any): void {
    // Send to monitoring service (implement based on chosen service)
    if (process.env.NODE_ENV === 'production') {
      // Example: send to analytics service
      console.log('Slow resource reported:', resource);
    }
  }

  private reportPerformanceIssue(metric: WebVitalsMetric, suggestions: string[]): void {
    // Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      console.log('Performance issue reported:', { metric, suggestions });
    }
  }

  private notifyListeners(metric: WebVitalsMetric): void {
    this.listeners.forEach(listener => listener(metric));
  }

  // Public API
  public onMetric(callback: (metric: WebVitalsMetric) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getMetrics(): WebVitalsMetric[] {
    return Array.from(this.metrics.values());
  }

  public getMetric(name: string): WebVitalsMetric | undefined {
    return this.metrics.get(name);
  }

  public getPerformanceSummary(): PerformanceMetrics {
    const summary: PerformanceMetrics = {};
    
    this.metrics.forEach((metric) => {
      switch (metric.name) {
        case 'CLS':
          summary.cls = metric.value;
          break;
        case 'FID':
          summary.fid = metric.value;
          break;
        case 'FCP':
          summary.fcp = metric.value;
          break;
        case 'LCP':
          summary.lcp = metric.value;
          break;
        case 'TTFB':
          summary.ttfb = metric.value;
          break;
        case 'INP':
          summary.inp = metric.value;
          break;
      }
    });

    // Add device and connection context
    summary.deviceType = this.getDeviceType();
    summary.connectionType = this.getConnectionType();
    summary.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return summary;
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getConnectionType(): string {
    if ('connection' in navigator) {
      return (navigator as any).connection?.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  public startMonitoring(): void {
    if (!this.isMonitoring) {
      this.initializeMonitoring();
    }
  }

  public stopMonitoring(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    this.isMonitoring = false;
  }

  public clearMetrics(): void {
    this.metrics.clear();
  }
}

// Export singleton instance
export const webVitalsMonitor = new WebVitalsMonitor();

// Utility functions
export function reportWebVitals(metric: WebVitalsMetric): void {
  // Send to your analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example implementations:
    // gtag('event', metric.name, { value: metric.value });
    // analytics.track('Web Vital', metric);
    console.log('Web Vital:', metric);
  }
}

export function getPerformanceScore(): number {
  const metrics = webVitalsMonitor.getMetrics();
  if (metrics.length === 0) return 100;

  let score = 100;
  metrics.forEach(metric => {
    if (metric.rating === 'poor') score -= 20;
    else if (metric.rating === 'needs-improvement') score -= 10;
  });

  return Math.max(0, score);
}

export function isSlowDevice(): boolean {
  const summary = webVitalsMonitor.getPerformanceSummary();
  
  // Detect slow devices based on multiple factors
  const slowFactors = [
    summary.memoryUsage && summary.memoryUsage > 0.8,
    summary.connectionType === '2g' || summary.connectionType === 'slow-2g',
    summary.deviceType === 'mobile' && (summary.lcp || 0) > 4000,
    summary.batteryLevel && summary.batteryLevel < 0.2,
  ].filter(Boolean);

  return slowFactors.length >= 2;
}