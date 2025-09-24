import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { webVitalsMonitor, getPerformanceScore, isSlowDevice } from './web-vitals';

// Mock web-vitals library
vi.mock('web-vitals', () => ({
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onLCP: vi.fn(),
  onTTFB: vi.fn(),
  onINP: vi.fn(),
}));

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => 1000),
  getEntriesByType: vi.fn(() => []),
  mark: vi.fn(),
  measure: vi.fn(),
  memory: {
    usedJSHeapSize: 50000000,
    totalJSHeapSize: 100000000,
    jsHeapSizeLimit: 200000000,
  },
};

const mockNavigator = {
  userAgent: 'test-agent',
  hardwareConcurrency: 4,
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
  },
  getBattery: vi.fn(() => Promise.resolve({
    level: 0.8,
    charging: true,
    chargingTime: 3600,
    dischargingTime: Infinity,
  })),
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
});

Object.defineProperty(global, 'window', {
  value: {
    innerWidth: 1024,
    matchMedia: vi.fn(() => ({ matches: false })),
  },
  writable: true,
});

describe('WebVitalsMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    webVitalsMonitor.clearMetrics();
  });

  it('should initialize monitoring', () => {
    expect(webVitalsMonitor).toBeDefined();
  });

  it('should get performance summary', () => {
    const summary = webVitalsMonitor.getPerformanceSummary();
    
    expect(summary).toHaveProperty('deviceType');
    expect(summary).toHaveProperty('connectionType');
    expect(summary).toHaveProperty('reducedMotion');
  });

  it('should detect device type correctly', () => {
    const summary = webVitalsMonitor.getPerformanceSummary();
    expect(summary.deviceType).toBe('desktop'); // 1024px width
  });

  it('should start and stop monitoring', () => {
    webVitalsMonitor.startMonitoring();
    webVitalsMonitor.stopMonitoring();
    // Should not throw errors
  });

  it('should clear metrics', () => {
    webVitalsMonitor.clearMetrics();
    const metrics = webVitalsMonitor.getMetrics();
    expect(metrics).toHaveLength(0);
  });
});

describe('Performance Utilities', () => {
  it('should calculate performance score', () => {
    const score = getPerformanceScore();
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should detect slow device', () => {
    const isSlow = isSlowDevice();
    expect(typeof isSlow).toBe('boolean');
  });
});

describe('Web Vitals Integration', () => {
  it('should handle web-vitals import failure gracefully', async () => {
    // Mock import failure
    vi.doMock('web-vitals', () => {
      throw new Error('Failed to load web-vitals');
    });

    // Should not throw when web-vitals fails to load
    expect(() => {
      webVitalsMonitor.startMonitoring();
    }).not.toThrow();
  });
});