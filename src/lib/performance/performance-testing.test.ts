import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock browser APIs
const mockPerformance = {
  now: vi.fn(() => 1000),
  getEntriesByType: vi.fn(() => [
    {
      entryType: 'navigation',
      fetchStart: 100,
      loadEventEnd: 1000,
      responseStart: 200,
      requestStart: 150,
    }
  ]),
};

const mockDocument = {
  querySelectorAll: vi.fn(() => [
    { getBoundingClientRect: () => ({ width: 48, height: 48 }) },
    { getBoundingClientRect: () => ({ width: 44, height: 44 }) },
  ]),
};

const mockWindow = {
  innerWidth: 1024,
  location: { href: 'http://localhost:3000' },
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
});

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

// Mock fetch
global.fetch = vi.fn(() => 
  Promise.resolve({
    ok: true,
    status: 200,
  } as Response)
);

describe('PerformanceTestRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be importable', async () => {
    const module = await import('./performance-testing');
    expect(module).toBeDefined();
    expect(module.performanceTestRunner).toBeDefined();
  });

  it('should have test runner methods', async () => {
    const { performanceTestRunner } = await import('./performance-testing');
    
    expect(typeof performanceTestRunner.getTestSuites).toBe('function');
    expect(typeof performanceTestRunner.generateReport).toBe('function');
    expect(typeof performanceTestRunner.runTestSuite).toBe('function');
  });

  it('should get test suites', async () => {
    const { performanceTestRunner } = await import('./performance-testing');
    const suites = performanceTestRunner.getTestSuites();
    
    expect(suites).toBeInstanceOf(Array);
    expect(suites.length).toBeGreaterThan(0);
    
    // Check that we have the expected test suites
    const suiteNames = suites.map(s => s.name);
    expect(suiteNames).toContain('Low-End Device Tests');
    expect(suiteNames).toContain('Chronic Illness UX Tests');
    expect(suiteNames).toContain('Network Performance Tests');
  });

  it('should generate performance report', async () => {
    const { performanceTestRunner } = await import('./performance-testing');
    const report = performanceTestRunner.generateReport();
    
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('results');
    expect(report).toHaveProperty('recommendations');
    expect(report).toHaveProperty('timestamp');
    
    expect(report.summary).toHaveProperty('totalTests');
    expect(report.summary).toHaveProperty('passedTests');
    expect(report.summary).toHaveProperty('failedTests');
    expect(report.summary).toHaveProperty('averageScore');
    expect(report.summary).toHaveProperty('overallRating');
  });
});

describe('Performance Test Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export utility functions', async () => {
    const module = await import('./performance-testing');
    
    expect(typeof module.runPerformanceTests).toBe('function');
    expect(typeof module.runCriticalTests).toBe('function');
    expect(typeof module.getPerformanceReport).toBe('function');
    expect(typeof module.runLowEndDeviceTests).toBe('function');
    expect(typeof module.runNetworkTests).toBe('function');
  });

  it('should get performance report', async () => {
    const { getPerformanceReport } = await import('./performance-testing');
    const report = getPerformanceReport();
    
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('results');
  });
});

describe('Individual Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have test suites with expected tests', async () => {
    const { performanceTestRunner } = await import('./performance-testing');
    const suites = performanceTestRunner.getTestSuites();
    
    const lowEndSuite = suites.find(s => s.name === 'Low-End Device Tests');
    expect(lowEndSuite).toBeDefined();
    expect(lowEndSuite?.tests.some(t => t.name === 'Page Load Time')).toBe(true);
    
    const chronicSuite = suites.find(s => s.name === 'Chronic Illness UX Tests');
    expect(chronicSuite).toBeDefined();
    expect(chronicSuite?.tests.some(t => t.name === 'Cognitive Load Test')).toBe(true);
    expect(chronicSuite?.tests.some(t => t.name === 'Touch Target Size')).toBe(true);
    
    const networkSuite = suites.find(s => s.name === 'Network Performance Tests');
    expect(networkSuite).toBeDefined();
    expect(networkSuite?.tests.some(t => t.name === 'API Response Time')).toBe(true);
  });
});

describe('Test Scoring and Recommendations', () => {
  it('should have scoring thresholds defined', async () => {
    const { performanceTestRunner } = await import('./performance-testing');
    const suites = performanceTestRunner.getTestSuites();
    
    suites.forEach(suite => {
      suite.tests.forEach(test => {
        expect(test.thresholds).toBeDefined();
        expect(test.thresholds.good).toBeDefined();
        expect(test.thresholds.needsImprovement).toBeDefined();
        expect(typeof test.thresholds.good).toBe('number');
        expect(typeof test.thresholds.needsImprovement).toBe('number');
      });
    });
  });

  it('should have test functions defined', async () => {
    const { performanceTestRunner } = await import('./performance-testing');
    const suites = performanceTestRunner.getTestSuites();
    
    suites.forEach(suite => {
      suite.tests.forEach(test => {
        expect(typeof test.run).toBe('function');
        expect(test.name).toBeTruthy();
        expect(test.description).toBeTruthy();
        expect(test.metric).toBeTruthy();
      });
    });
  });
});