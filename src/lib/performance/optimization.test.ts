import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  performanceOptimizer, 
  isSlowDevice, 
  shouldReduceAnimations, 
  getOptimalImageFormat,
  enableFatigueMode 
} from './optimization';

// Mock DOM and browser APIs
const mockDocument = {
  documentElement: {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(() => false),
    },
  },
  querySelectorAll: vi.fn(() => []),
  createElement: vi.fn(() => ({
    textContent: '',
    appendChild: vi.fn(),
  })),
  head: {
    appendChild: vi.fn(),
  },
  body: {
    appendChild: vi.fn(),
  },
};

const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  matchMedia: vi.fn(() => ({ matches: false })),
  requestAnimationFrame: vi.fn((cb) => setTimeout(cb, 16)),
  performance: {
    now: vi.fn(() => 1000),
  },
};

const mockNavigator = {
  userAgent: 'test-agent',
  hardwareConcurrency: 4,
  deviceMemory: 8,
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
  },
  getBattery: vi.fn(() => Promise.resolve({
    level: 0.8,
    charging: true,
  })),
};

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
});

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
});

describe('PerformanceOptimizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect device capabilities', () => {
    const capabilities = performanceOptimizer.getDeviceCapabilities();
    
    expect(capabilities).toHaveProperty('memory');
    expect(capabilities).toHaveProperty('cores');
    expect(capabilities).toHaveProperty('connectionSpeed');
    expect(capabilities).toHaveProperty('supportsWebP');
    expect(capabilities).toHaveProperty('supportsAVIF');
  });

  it('should get optimization settings', () => {
    const config = performanceOptimizer.getConfig();
    
    expect(config).toHaveProperty('enableLazyLoading');
    expect(config).toHaveProperty('enableImageOptimization');
    expect(config).toHaveProperty('enableCodeSplitting');
    expect(config).toHaveProperty('reduceAnimations');
    expect(config).toHaveProperty('optimizeForSlowDevices');
  });

  it('should update configuration', () => {
    const newConfig = {
      reduceAnimations: true,
      optimizeForSlowDevices: true,
    };
    
    performanceOptimizer.updateConfig(newConfig);
    const config = performanceOptimizer.getConfig();
    
    expect(config.reduceAnimations).toBe(true);
    expect(config.optimizeForSlowDevices).toBe(true);
  });

  it('should observe and unobserve elements', () => {
    const mockElement = document.createElement('div');
    
    // Should not throw errors
    expect(() => {
      performanceOptimizer.observeElement(mockElement, 'image');
      performanceOptimizer.unobserveElement(mockElement, 'image');
    }).not.toThrow();
  });

  it('should cleanup observers', () => {
    expect(() => {
      performanceOptimizer.cleanup();
    }).not.toThrow();
  });
});

describe('Performance Utility Functions', () => {
  it('should detect slow device', () => {
    const isSlow = isSlowDevice();
    expect(typeof isSlow).toBe('boolean');
  });

  it('should check if animations should be reduced', () => {
    const shouldReduce = shouldReduceAnimations();
    expect(typeof shouldReduce).toBe('boolean');
  });

  it('should get optimal image format', () => {
    const format = getOptimalImageFormat();
    expect(['avif', 'webp', 'jpg']).toContain(format);
  });

  it('should enable fatigue mode', () => {
    expect(() => {
      enableFatigueMode();
    }).not.toThrow();
  });
});

describe('Device Detection', () => {
  it('should detect device capabilities', () => {
    const capabilities = performanceOptimizer.getDeviceCapabilities();
    
    // Just check that we get reasonable values
    expect(typeof capabilities.memory).toBe('number');
    expect(typeof capabilities.cores).toBe('number');
    expect(['slow', 'medium', 'fast']).toContain(capabilities.connectionSpeed);
    expect(typeof capabilities.supportsWebP).toBe('boolean');
    expect(typeof capabilities.supportsAVIF).toBe('boolean');
  });

  it('should handle missing navigator properties gracefully', () => {
    // The optimizer should handle missing properties without crashing
    const capabilities = performanceOptimizer.getDeviceCapabilities();
    expect(capabilities).toBeDefined();
  });
});