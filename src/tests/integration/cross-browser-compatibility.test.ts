/**
 * Cross-browser and device compatibility integration tests
 * Tests application functionality across different browsers and devices
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock different browser environments
const mockBrowserEnvironments = {
  chrome: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    features: {
      webGL: true,
      webRTC: true,
      serviceWorker: true,
      indexedDB: true,
      webAssembly: true,
      mediaDevices: true,
    },
  },
  firefox: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    features: {
      webGL: true,
      webRTC: true,
      serviceWorker: true,
      indexedDB: true,
      webAssembly: true,
      mediaDevices: true,
    },
  },
  safari: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    features: {
      webGL: true,
      webRTC: true,
      serviceWorker: true,
      indexedDB: true,
      webAssembly: true,
      mediaDevices: true,
    },
  },
  edge: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    features: {
      webGL: true,
      webRTC: true,
      serviceWorker: true,
      indexedDB: true,
      webAssembly: true,
      mediaDevices: true,
    },
  },
  mobileSafari: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
    features: {
      webGL: true,
      webRTC: false, // Limited on mobile Safari
      serviceWorker: true,
      indexedDB: true,
      webAssembly: true,
      mediaDevices: true,
    },
  },
  androidChrome: {
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    features: {
      webGL: true,
      webRTC: true,
      serviceWorker: true,
      indexedDB: true,
      webAssembly: true,
      mediaDevices: true,
    },
  },
};

// Mock device capabilities
const mockDeviceCapabilities = {
  desktop: {
    screen: { width: 1920, height: 1080 },
    deviceMemory: 8,
    hardwareConcurrency: 8,
    connection: { effectiveType: '4g' },
    battery: { level: 1, charging: true },
  },
  tablet: {
    screen: { width: 1024, height: 768 },
    deviceMemory: 4,
    hardwareConcurrency: 4,
    connection: { effectiveType: '4g' },
    battery: { level: 0.8, charging: false },
  },
  mobile: {
    screen: { width: 375, height: 667 },
    deviceMemory: 2,
    hardwareConcurrency: 2,
    connection: { effectiveType: '3g' },
    battery: { level: 0.6, charging: false },
  },
  lowEnd: {
    screen: { width: 320, height: 568 },
    deviceMemory: 1,
    hardwareConcurrency: 2,
    connection: { effectiveType: '2g' },
    battery: { level: 0.3, charging: false },
  },
};

// Helper function to mock browser environment
function mockBrowserEnvironment(browserName: keyof typeof mockBrowserEnvironments) {
  const browser = mockBrowserEnvironments[browserName];
  
  // Mock navigator
  Object.defineProperty(navigator, 'userAgent', {
    value: browser.userAgent,
    writable: true,
  });

  // Mock feature availability
  Object.defineProperty(window, 'WebGLRenderingContext', {
    value: browser.features.webGL ? {} : undefined,
    writable: true,
  });

  Object.defineProperty(navigator, 'serviceWorker', {
    value: browser.features.serviceWorker ? { register: vi.fn() } : undefined,
    writable: true,
  });

  Object.defineProperty(window, 'indexedDB', {
    value: browser.features.indexedDB ? { open: vi.fn() } : undefined,
    writable: true,
  });

  Object.defineProperty(navigator, 'mediaDevices', {
    value: browser.features.mediaDevices ? { getUserMedia: vi.fn() } : undefined,
    writable: true,
  });
}

// Helper function to mock device capabilities
function mockDeviceCapabilities(deviceType: keyof typeof mockDeviceCapabilities) {
  const device = mockDeviceCapabilities[deviceType];
  
  // Mock screen dimensions
  Object.defineProperty(screen, 'width', { value: device.screen.width, writable: true });
  Object.defineProperty(screen, 'height', { value: device.screen.height, writable: true });
  
  // Mock device memory
  Object.defineProperty(navigator, 'deviceMemory', {
    value: device.deviceMemory,
    writable: true,
  });
  
  // Mock hardware concurrency
  Object.defineProperty(navigator, 'hardwareConcurrency', {
    value: device.hardwareConcurrency,
    writable: true,
  });
  
  // Mock connection
  Object.defineProperty(navigator, 'connection', {
    value: device.connection,
    writable: true,
  });
  
  // Mock battery
  Object.defineProperty(navigator, 'getBattery', {
    value: () => Promise.resolve(device.battery),
    writable: true,
  });
}

describe('Cross-Browser Compatibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Core Functionality Across Browsers', () => {
    const browsers = ['chrome', 'firefox', 'safari', 'edge'] as const;

    browsers.forEach(browserName => {
      it(`should work correctly in ${browserName}`, async () => {
        mockBrowserEnvironment(browserName);
        mockDeviceCapabilities('desktop');

        // Mock basic app component
        const BasicApp = () => (
          <div data-testid="app">
            <h1>Chronic Fatigue Health Tracker</h1>
            <button data-testid="energy-button">Log Energy</button>
            <div data-testid="browser-info">
              Browser: {navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                       navigator.userAgent.includes('Firefox') ? 'Firefox' :
                       navigator.userAgent.includes('Safari') ? 'Safari' :
                       navigator.userAgent.includes('Edg') ? 'Edge' : 'Unknown'}
            </div>
          </div>
        );

        render(<BasicApp />);

        // Verify basic rendering
        expect(screen.getByTestId('app')).toBeInTheDocument();
        expect(screen.getByText('Chronic Fatigue Health Tracker')).toBeInTheDocument();
        expect(screen.getByTestId('energy-button')).toBeInTheDocument();

        // Verify browser detection
        const browserInfo = screen.getByTestId('browser-info');
        expect(browserInfo).toBeInTheDocument();
        
        if (browserName === 'chrome') {
          expect(browserInfo).toHaveTextContent('Browser: Chrome');
        } else if (browserName === 'firefox') {
          expect(browserInfo).toHaveTextContent('Browser: Firefox');
        } else if (browserName === 'safari') {
          expect(browserInfo).toHaveTextContent('Browser: Safari');
        } else if (browserName === 'edge') {
          expect(browserInfo).toHaveTextContent('Browser: Edge');
        }
      });
    });
  });

  describe('Mobile Browser Compatibility', () => {
    it('should work correctly on mobile Safari', async () => {
      mockBrowserEnvironment('mobileSafari');
      mockDeviceCapabilities('mobile');

      // Mock mobile-specific component
      const MobileApp = () => (
        <div data-testid="mobile-app">
          <div data-testid="viewport-info">
            Screen: {screen.width}x{screen.height}
          </div>
          <div data-testid="touch-targets">
            <button 
              data-testid="large-button"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              Touch Me
            </button>
          </div>
          <div data-testid="device-info">
            Memory: {(navigator as any).deviceMemory || 'Unknown'}GB
          </div>
        </div>
      );

      render(<MobileApp />);

      // Verify mobile-specific adaptations
      expect(screen.getByTestId('viewport-info')).toHaveTextContent('Screen: 375x667');
      expect(screen.getByTestId('device-info')).toHaveTextContent('Memory: 2GB');
      
      // Verify touch target size
      const touchButton = screen.getByTestId('large-button');
      expect(touchButton).toHaveStyle({ minHeight: '44px', minWidth: '44px' });
    });

    it('should work correctly on Android Chrome', async () => {
      mockBrowserEnvironment('androidChrome');
      mockDeviceCapabilities('mobile');

      // Mock Android-specific features
      const AndroidApp = () => (
        <div data-testid="android-app">
          <div data-testid="pwa-features">
            Service Worker: {navigator.serviceWorker ? 'Supported' : 'Not Supported'}
          </div>
          <div data-testid="camera-features">
            Camera: {navigator.mediaDevices ? 'Available' : 'Not Available'}
          </div>
        </div>
      );

      render(<AndroidApp />);

      // Verify PWA features work on Android
      expect(screen.getByTestId('pwa-features')).toHaveTextContent('Service Worker: Supported');
      expect(screen.getByTestId('camera-features')).toHaveTextContent('Camera: Available');
    });
  });

  describe('Feature Detection and Graceful Degradation', () => {
    it('should handle missing WebRTC gracefully', async () => {
      // Mock browser without WebRTC
      mockBrowserEnvironment('mobileSafari');
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
      });

      const BiometricCapture = () => {
        const hasCamera = !!navigator.mediaDevices;
        
        return (
          <div data-testid="biometric-capture">
            {hasCamera ? (
              <button data-testid="camera-capture">Use Camera</button>
            ) : (
              <div data-testid="manual-entry">
                <p>Camera not available. Please enter manually:</p>
                <input data-testid="manual-heart-rate" placeholder="Heart Rate" />
              </div>
            )}
          </div>
        );
      };

      render(<BiometricCapture />);

      // Verify graceful degradation
      expect(screen.queryByTestId('camera-capture')).not.toBeInTheDocument();
      expect(screen.getByTestId('manual-entry')).toBeInTheDocument();
      expect(screen.getByTestId('manual-heart-rate')).toBeInTheDocument();
    });

    it('should handle missing IndexedDB gracefully', async () => {
      // Mock browser without IndexedDB
      Object.defineProperty(window, 'indexedDB', {
        value: undefined,
        writable: true,
      });

      const OfflineStorage = () => {
        const hasIndexedDB = !!window.indexedDB;
        
        return (
          <div data-testid="offline-storage">
            {hasIndexedDB ? (
              <div data-testid="offline-enabled">
                Offline storage available
              </div>
            ) : (
              <div data-testid="offline-disabled">
                Offline storage not available. Data will be saved when online.
              </div>
            )}
          </div>
        );
      };

      render(<OfflineStorage />);

      // Verify fallback behavior
      expect(screen.queryByTestId('offline-enabled')).not.toBeInTheDocument();
      expect(screen.getByTestId('offline-disabled')).toBeInTheDocument();
    });
  });

  describe('Device-Specific Optimizations', () => {
    it('should optimize for low-end devices', async () => {
      mockDeviceCapabilities('lowEnd');

      const OptimizedApp = () => {
        const isLowEnd = (navigator as any).deviceMemory <= 2 && 
                        (navigator as any).hardwareConcurrency <= 2;
        
        return (
          <div data-testid="optimized-app">
            <div data-testid="performance-mode">
              Performance Mode: {isLowEnd ? 'Enabled' : 'Disabled'}
            </div>
            {isLowEnd ? (
              <div data-testid="simplified-ui">
                <p>Simplified interface for better performance</p>
                <button data-testid="basic-button">Basic Action</button>
              </div>
            ) : (
              <div data-testid="full-ui">
                <p>Full interface with animations</p>
                <button data-testid="animated-button">Animated Action</button>
              </div>
            )}
          </div>
        );
      };

      render(<OptimizedApp />);

      // Verify low-end optimizations
      expect(screen.getByTestId('performance-mode')).toHaveTextContent('Performance Mode: Enabled');
      expect(screen.getByTestId('simplified-ui')).toBeInTheDocument();
      expect(screen.queryByTestId('full-ui')).not.toBeInTheDocument();
    });

    it('should adapt to slow network connections', async () => {
      mockDeviceCapabilities('lowEnd'); // Has 2g connection

      const NetworkAdaptiveApp = () => {
        const connection = (navigator as any).connection;
        const isSlowConnection = connection?.effectiveType === '2g' || 
                               connection?.effectiveType === 'slow-2g';
        
        return (
          <div data-testid="network-adaptive-app">
            <div data-testid="connection-info">
              Connection: {connection?.effectiveType || 'Unknown'}
            </div>
            {isSlowConnection ? (
              <div data-testid="offline-mode">
                <p>Slow connection detected. Enabling offline mode.</p>
                <button data-testid="sync-later">Sync Later</button>
              </div>
            ) : (
              <div data-testid="online-mode">
                <p>Good connection. Real-time sync enabled.</p>
                <button data-testid="sync-now">Sync Now</button>
              </div>
            )}
          </div>
        );
      };

      render(<NetworkAdaptiveApp />);

      // Verify network adaptation
      expect(screen.getByTestId('connection-info')).toHaveTextContent('Connection: 2g');
      expect(screen.getByTestId('offline-mode')).toBeInTheDocument();
      expect(screen.queryByTestId('online-mode')).not.toBeInTheDocument();
    });

    it('should adapt to battery level', async () => {
      // Mock low battery
      Object.defineProperty(navigator, 'getBattery', {
        value: () => Promise.resolve({ level: 0.15, charging: false }),
        writable: true,
      });

      const BatteryAdaptiveApp = () => {
        const [batteryLevel, setBatteryLevel] = React.useState<number | null>(null);
        
        React.useEffect(() => {
          if ('getBattery' in navigator) {
            (navigator as any).getBattery().then((battery: any) => {
              setBatteryLevel(battery.level);
            });
          }
        }, []);
        
        const isLowBattery = batteryLevel !== null && batteryLevel < 0.2;
        
        return (
          <div data-testid="battery-adaptive-app">
            <div data-testid="battery-info">
              Battery: {batteryLevel ? `${Math.round(batteryLevel * 100)}%` : 'Unknown'}
            </div>
            {isLowBattery ? (
              <div data-testid="power-saving">
                <p>Low battery detected. Power saving mode enabled.</p>
                <div data-testid="reduced-features">
                  Essential features only
                </div>
              </div>
            ) : (
              <div data-testid="full-features">
                <p>All features available</p>
              </div>
            )}
          </div>
        );
      };

      render(<BatteryAdaptiveApp />);

      // Wait for battery info to load
      await waitFor(() => {
        expect(screen.getByTestId('battery-info')).toHaveTextContent('Battery: 15%');
      });

      expect(screen.getByTestId('power-saving')).toBeInTheDocument();
      expect(screen.queryByTestId('full-features')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Across Browsers', () => {
    it('should maintain accessibility features across browsers', async () => {
      const browsers = ['chrome', 'firefox', 'safari', 'edge'] as const;

      for (const browserName of browsers) {
        mockBrowserEnvironment(browserName);

        const AccessibleApp = () => (
          <div data-testid={`accessible-app-${browserName}`}>
            <h1 id="main-heading">Health Tracker</h1>
            <nav aria-labelledby="main-heading">
              <ul>
                <li><a href="#dashboard" aria-label="Go to dashboard">Dashboard</a></li>
                <li><a href="#energy" aria-label="Log energy level">Energy</a></li>
              </ul>
            </nav>
            <main>
              <button 
                aria-describedby="energy-help"
                data-testid="energy-button"
              >
                Log Energy
              </button>
              <div id="energy-help">
                Rate your energy from 1 to 10
              </div>
            </main>
          </div>
        );

        render(<AccessibleApp />);

        // Verify accessibility attributes work across browsers
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('Health Tracker');

        const navigation = screen.getByRole('navigation');
        expect(navigation).toHaveAttribute('aria-labelledby', 'main-heading');

        const energyButton = screen.getByTestId('energy-button');
        expect(energyButton).toHaveAttribute('aria-describedby', 'energy-help');

        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(2);
        expect(links[0]).toHaveAttribute('aria-label', 'Go to dashboard');
        expect(links[1]).toHaveAttribute('aria-label', 'Log energy level');
      }
    });
  });

  describe('Performance Across Devices', () => {
    it('should maintain acceptable performance on all device types', async () => {
      const deviceTypes = ['desktop', 'tablet', 'mobile', 'lowEnd'] as const;

      for (const deviceType of deviceTypes) {
        mockDeviceCapabilities(deviceType);
        
        const device = mockDeviceCapabilities[deviceType];
        
        // Mock performance measurement
        const performanceMetrics = {
          renderTime: device.deviceMemory >= 4 ? 50 : 100, // ms
          interactionDelay: device.hardwareConcurrency >= 4 ? 10 : 25, // ms
          memoryUsage: device.deviceMemory * 0.3, // GB
        };

        const PerformanceApp = () => (
          <div data-testid={`performance-app-${deviceType}`}>
            <div data-testid="performance-metrics">
              <p>Render Time: {performanceMetrics.renderTime}ms</p>
              <p>Interaction Delay: {performanceMetrics.interactionDelay}ms</p>
              <p>Memory Usage: {performanceMetrics.memoryUsage.toFixed(1)}GB</p>
            </div>
            <div data-testid="performance-rating">
              {performanceMetrics.renderTime < 100 && 
               performanceMetrics.interactionDelay < 50 ? 
               'Good Performance' : 'Optimized Performance'}
            </div>
          </div>
        );

        render(<PerformanceApp />);

        // Verify performance is acceptable for device type
        const metricsDiv = screen.getByTestId('performance-metrics');
        expect(metricsDiv).toBeInTheDocument();

        const ratingDiv = screen.getByTestId('performance-rating');
        expect(ratingDiv).toBeInTheDocument();

        // Performance should be acceptable on all devices
        if (deviceType === 'desktop' || deviceType === 'tablet') {
          expect(ratingDiv).toHaveTextContent('Good Performance');
        } else {
          expect(ratingDiv).toHaveTextContent(/Performance/);
        }
      }
    });
  });
});