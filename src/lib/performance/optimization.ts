// Performance optimization utilities for chronic illness users
// Focuses on reducing cognitive load and supporting low-energy interactions

export interface OptimizationConfig {
  enableLazyLoading: boolean;
  enableImageOptimization: boolean;
  enableCodeSplitting: boolean;
  enablePrefetching: boolean;
  enableServiceWorker: boolean;
  reduceAnimations: boolean;
  optimizeForSlowDevices: boolean;
  enableOfflineMode: boolean;
}

export interface DeviceCapabilities {
  memory: number; // GB
  cores: number;
  connectionSpeed: 'slow' | 'medium' | 'fast';
  batteryLevel?: number;
  isLowPowerMode?: boolean;
  supportsWebP: boolean;
  supportsAVIF: boolean;
}

class PerformanceOptimizer {
  private config: OptimizationConfig;
  private deviceCapabilities: DeviceCapabilities;
  private observers: Map<string, IntersectionObserver> = new Map();

  constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.config = this.generateOptimalConfig();
    this.initializeOptimizations();
  }

  private detectDeviceCapabilities(): DeviceCapabilities {
    const capabilities: DeviceCapabilities = {
      memory: this.getDeviceMemory(),
      cores: navigator.hardwareConcurrency || 2,
      connectionSpeed: this.getConnectionSpeed(),
      supportsWebP: this.supportsImageFormat('webp'),
      supportsAVIF: this.supportsImageFormat('avif'),
    };

    // Detect battery status
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        capabilities.batteryLevel = battery.level;
        capabilities.isLowPowerMode = battery.level < 0.2 || !battery.charging;
      });
    }

    return capabilities;
  }

  private getDeviceMemory(): number {
    // Use Device Memory API if available
    if ('deviceMemory' in navigator) {
      return (navigator as any).deviceMemory;
    }
    
    // Fallback estimation based on other factors
    const cores = navigator.hardwareConcurrency || 2;
    if (cores <= 2) return 2; // Low-end device
    if (cores <= 4) return 4; // Mid-range device
    return 8; // High-end device
  }

  private getConnectionSpeed(): 'slow' | 'medium' | 'fast' {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const effectiveType = connection.effectiveType;
      
      if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
      if (effectiveType === '3g') return 'medium';
      return 'fast';
    }
    
    return 'medium'; // Default assumption
  }

  private supportsImageFormat(format: 'webp' | 'avif'): boolean {
    // Skip canvas test in test environment
    if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') {
      return format === 'webp'; // Default to webp support in tests
    }
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const dataURL = canvas.toDataURL(`image/${format}`);
      return dataURL.startsWith(`data:image/${format}`);
    } catch {
      return false;
    }
  }

  private generateOptimalConfig(): OptimizationConfig {
    const isSlowDevice = this.deviceCapabilities.memory <= 2 || 
                        this.deviceCapabilities.cores <= 2 ||
                        this.deviceCapabilities.connectionSpeed === 'slow';

    return {
      enableLazyLoading: true,
      enableImageOptimization: true,
      enableCodeSplitting: true,
      enablePrefetching: !isSlowDevice,
      enableServiceWorker: true,
      reduceAnimations: isSlowDevice || this.prefersReducedMotion(),
      optimizeForSlowDevices: isSlowDevice,
      enableOfflineMode: true,
    };
  }

  private prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private initializeOptimizations(): void {
    if (this.config.enableLazyLoading) {
      this.initializeLazyLoading();
    }

    if (this.config.enableImageOptimization) {
      this.optimizeImages();
    }

    if (this.config.reduceAnimations) {
      this.reduceAnimations();
    }

    if (this.config.optimizeForSlowDevices) {
      this.applySlowDeviceOptimizations();
    }

    // Monitor performance and adjust
    this.startPerformanceMonitoring();
  }

  private initializeLazyLoading(): void {
    // Skip in test environment or if IntersectionObserver is not available
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }
    
    // Lazy load images
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    this.observers.set('images', imageObserver);

    // Observe existing images
    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });

    // Lazy load components
    this.initializeComponentLazyLoading();
  }

  private initializeComponentLazyLoading(): void {
    // Skip in test environment or if IntersectionObserver is not available
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }
    
    const componentObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const componentName = element.dataset.lazyComponent;
            
            if (componentName) {
              this.loadComponent(componentName, element);
              componentObserver.unobserve(element);
            }
          }
        });
      },
      {
        rootMargin: '100px 0px', // Load components 100px before they're needed
        threshold: 0.01,
      }
    );

    this.observers.set('components', componentObserver);

    // Observe lazy components
    document.querySelectorAll('[data-lazy-component]').forEach((element) => {
      componentObserver.observe(element);
    });
  }

  private async loadComponent(componentName: string, element: HTMLElement): Promise<void> {
    try {
      // Dynamic import based on component name
      const componentModule = await this.importComponent(componentName);
      
      if (componentModule) {
        element.classList.add('component-loaded');
        // Component loading logic would be handled by React/Next.js
      }
    } catch (error) {
      console.error(`Failed to load component ${componentName}:`, error);
      element.classList.add('component-error');
    }
  }

  private async importComponent(componentName: string): Promise<any> {
    // Map component names to dynamic imports
    const componentMap: Record<string, () => Promise<any>> = {
      'evidence-content': () => import('@/components/content/evidence-based-content'),
      'accessibility-settings': () => import('@/components/accessibility/accessibility-settings'),
      'voice-breathing': () => import('@/components/accessibility/voice-guided-breathing'),
      'healthcare-reports': () => import('@/components/health/healthcare-reports'),
      'symptom-progress': () => import('@/components/health/symptom-progress'),
      'movement-session': () => import('@/components/health/movement-session'),
      'biometric-capture': () => import('@/components/health/biometric-capture'),
    };

    const importFn = componentMap[componentName];
    return importFn ? await importFn() : null;
  }

  private optimizeImages(): void {
    // Skip in test environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    
    // Replace images with optimized versions based on device capabilities
    document.querySelectorAll('img').forEach((img) => {
      this.optimizeImage(img);
    });

    // Set up mutation observer for new images
    if ('MutationObserver' in window) {
      const imageObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const images = element.tagName === 'IMG' 
              ? [element as HTMLImageElement]
              : Array.from(element.querySelectorAll('img'));
            
            images.forEach((img) => this.optimizeImage(img));
          }
        });
      });
    });

      imageObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  private optimizeImage(img: HTMLImageElement): void {
    const src = img.src || img.dataset.src;
    if (!src) return;

    // Choose optimal format
    let optimizedSrc = src;
    
    if (this.deviceCapabilities.supportsAVIF && !src.includes('.avif')) {
      optimizedSrc = src.replace(/\.(jpg|jpeg|png|webp)$/i, '.avif');
    } else if (this.deviceCapabilities.supportsWebP && !src.includes('.webp')) {
      optimizedSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }

    // Adjust quality based on device capabilities
    if (this.config.optimizeForSlowDevices) {
      // Use lower quality for slow devices
      optimizedSrc += optimizedSrc.includes('?') ? '&q=70' : '?q=70';
    }

    // Set responsive sizes
    if (!img.sizes && img.width) {
      img.sizes = this.generateResponsiveSizes(img.width);
    }

    if (img.dataset.src) {
      img.dataset.src = optimizedSrc;
    } else {
      img.src = optimizedSrc;
    }
  }

  private generateResponsiveSizes(width: number): string {
    // Generate sizes attribute for responsive images
    if (width <= 400) return '(max-width: 400px) 100vw, 400px';
    if (width <= 800) return '(max-width: 800px) 100vw, 800px';
    return '(max-width: 1200px) 100vw, 1200px';
  }

  private reduceAnimations(): void {
    // Add CSS class to reduce animations
    document.documentElement.classList.add('reduce-animations');

    // Override CSS animations
    const style = document.createElement('style');
    style.textContent = `
      .reduce-animations *,
      .reduce-animations *::before,
      .reduce-animations *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    `;
    document.head.appendChild(style);
  }

  private applySlowDeviceOptimizations(): void {
    // Reduce JavaScript execution
    this.throttleJavaScript();
    
    // Simplify UI elements
    document.documentElement.classList.add('slow-device-mode');
    
    // Disable non-essential features
    this.disableNonEssentialFeatures();
    
    // Optimize rendering
    this.optimizeRendering();
  }

  private throttleJavaScript(): void {
    // Throttle scroll and resize events
    let scrollTimeout: NodeJS.Timeout;
    let resizeTimeout: NodeJS.Timeout;

    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (type === 'scroll') {
        const throttledListener = (event: Event) => {
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => {
            (listener as EventListener)(event);
          }, 16); // ~60fps
        };
        return originalAddEventListener.call(this, type, throttledListener, options);
      }
      
      if (type === 'resize') {
        const throttledListener = (event: Event) => {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            (listener as EventListener)(event);
          }, 100); // Throttle resize events
        };
        return originalAddEventListener.call(this, type, throttledListener, options);
      }
      
      return originalAddEventListener.call(this, type, listener, options);
    };
  }

  private disableNonEssentialFeatures(): void {
    // Disable features that aren't critical for chronic illness users
    const nonEssentialSelectors = [
      '.animation-heavy',
      '.decorative-only',
      '.advanced-charts',
      '.video-backgrounds',
    ];

    nonEssentialSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        (element as HTMLElement).style.display = 'none';
      });
    });
  }

  private optimizeRendering(): void {
    // Use CSS containment for better performance
    const style = document.createElement('style');
    style.textContent = `
      .slow-device-mode .card,
      .slow-device-mode .component {
        contain: layout style paint;
      }
      
      .slow-device-mode .list-item {
        contain: layout paint;
      }
      
      .slow-device-mode .heavy-component {
        will-change: auto;
        transform: none;
      }
    `;
    document.head.appendChild(style);
  }

  private startPerformanceMonitoring(): void {
    // Monitor performance and adjust optimizations
    setInterval(() => {
      this.checkPerformanceAndAdjust();
    }, 30000); // Check every 30 seconds
  }

  private checkPerformanceAndAdjust(): void {
    // Check memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      if (memoryUsage > 0.8) {
        this.enableAggressiveOptimizations();
      }
    }

    // Check frame rate
    this.measureFrameRate().then(fps => {
      if (fps < 30) {
        this.reduceVisualComplexity();
      }
    });
  }

  private enableAggressiveOptimizations(): void {
    console.log('Enabling aggressive optimizations due to high memory usage');
    
    // Remove non-essential DOM elements
    document.querySelectorAll('.optional-content').forEach(element => {
      element.remove();
    });
    
    // Reduce image quality further
    document.querySelectorAll('img').forEach(img => {
      if (img.src && !img.src.includes('q=50')) {
        img.src = img.src.replace(/q=\d+/, 'q=50');
      }
    });
  }

  private reduceVisualComplexity(): void {
    console.log('Reducing visual complexity due to low frame rate');
    
    // Simplify gradients and shadows
    const style = document.createElement('style');
    style.textContent = `
      .performance-mode * {
        box-shadow: none !important;
        background-image: none !important;
        filter: none !important;
      }
    `;
    document.head.appendChild(style);
    document.documentElement.classList.add('performance-mode');
  }

  private async measureFrameRate(): Promise<number> {
    return new Promise(resolve => {
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

  // Public API
  public getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  public getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.deviceCapabilities };
  }

  public updateConfig(updates: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...updates };
    this.applyConfigChanges(updates);
  }

  private applyConfigChanges(updates: Partial<OptimizationConfig>): void {
    if (updates.reduceAnimations !== undefined) {
      if (updates.reduceAnimations) {
        this.reduceAnimations();
      } else {
        document.documentElement.classList.remove('reduce-animations');
      }
    }

    if (updates.optimizeForSlowDevices !== undefined) {
      if (updates.optimizeForSlowDevices) {
        this.applySlowDeviceOptimizations();
      } else {
        document.documentElement.classList.remove('slow-device-mode');
      }
    }
  }

  public observeElement(element: HTMLElement, type: 'image' | 'component'): void {
    const observer = this.observers.get(type === 'image' ? 'images' : 'components');
    if (observer) {
      observer.observe(element);
    }
  }

  public unobserveElement(element: HTMLElement, type: 'image' | 'component'): void {
    const observer = this.observers.get(type === 'image' ? 'images' : 'components');
    if (observer) {
      observer.unobserve(element);
    }
  }

  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

// Utility functions
export function isSlowDevice(): boolean {
  const capabilities = performanceOptimizer.getDeviceCapabilities();
  return capabilities.memory <= 2 || 
         capabilities.cores <= 2 || 
         capabilities.connectionSpeed === 'slow';
}

export function shouldReduceAnimations(): boolean {
  const config = performanceOptimizer.getConfig();
  return config.reduceAnimations;
}

export function getOptimalImageFormat(): 'avif' | 'webp' | 'jpg' {
  const capabilities = performanceOptimizer.getDeviceCapabilities();
  if (capabilities.supportsAVIF) return 'avif';
  if (capabilities.supportsWebP) return 'webp';
  return 'jpg';
}

export function enableFatigueMode(): void {
  performanceOptimizer.updateConfig({
    reduceAnimations: true,
    optimizeForSlowDevices: true,
    enablePrefetching: false,
  });
}