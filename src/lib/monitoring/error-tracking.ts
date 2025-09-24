// Error tracking and monitoring system optimized for chronic illness users
// Focuses on user-friendly error handling and privacy-conscious reporting

import * as Sentry from '@sentry/nextjs';

export interface ErrorContext {
  userId?: string;
  userAgent: string;
  url: string;
  timestamp: number;
  energyLevel?: number;
  fatigueMode?: boolean;
  accessibilityFeatures?: string[];
  deviceCapabilities?: {
    memory: number;
    connection: string;
    batteryLevel?: number;
  };
}

export interface UserFriendlyError {
  id: string;
  title: string;
  message: string;
  suggestion: string;
  severity: 'low' | 'medium' | 'high';
  canRetry: boolean;
  supportContact?: string;
}

class ErrorTracker {
  private isInitialized = false;
  private errorQueue: Array<{ error: Error; context: ErrorContext }> = [];
  private userFriendlyMessages: Map<string, UserFriendlyError> = new Map();

  constructor() {
    this.initializeErrorMessages();
  }

  public initialize(dsn?: string): void {
    if (this.isInitialized) return;

    // Only initialize Sentry in production with user consent
    if (process.env.NODE_ENV === 'production' && dsn) {
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV,
        
        // Performance monitoring
        tracesSampleRate: 0.1, // Low sample rate to respect user privacy
        
        // Privacy-focused configuration
        beforeSend: this.beforeSendHandler.bind(this),
        beforeSendTransaction: this.beforeSendTransactionHandler.bind(this),
        
        // Chronic illness specific configuration
        integrations: [
          // Remove BrowserTracing for now due to compatibility issues
        ],
        
        // Filter out non-critical errors
        ignoreErrors: [
          'ResizeObserver loop limit exceeded',
          'Non-Error promise rejection captured',
          'Network request failed',
          'Loading chunk',
        ],
        
        // Custom tags for chronic illness context
        initialScope: {
          tags: {
            healthApp: true,
            chronicIllness: true,
          },
        },
      });
    }

    // Set up global error handlers
    this.setupGlobalErrorHandlers();
    this.isInitialized = true;

    // Process queued errors
    this.processErrorQueue();
  }

  private beforeSendHandler(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
    // Privacy protection - remove sensitive data
    if (event.user) {
      // Only keep non-identifying information
      event.user = {
        id: event.user.id ? 'user-' + btoa(String(event.user.id)).slice(0, 8) : undefined,
      };
    }

    // Remove sensitive URLs or data
    if (event.request?.url) {
      event.request.url = this.sanitizeUrl(event.request.url);
    }

    // Add chronic illness context without personal data
    event.contexts = {
      ...event.contexts,
      'chronic-illness': {
        fatigueMode: this.getFatigueMode(),
        accessibilityFeatures: this.getAccessibilityFeatures(),
        deviceOptimizations: this.getDeviceOptimizations(),
      },
    };

    return event;
  }

  private beforeSendTransactionHandler(event: any): any | null {
    // Reduce transaction volume for privacy and performance
    if (Math.random() > 0.05) { // Only send 5% of transactions
      return null;
    }
    
    // Privacy protection - remove sensitive data
    if (event.user) {
      event.user = {
        id: event.user.id ? 'user-' + btoa(String(event.user.id)).slice(0, 8) : undefined,
      };
    }

    // Remove sensitive URLs or data
    if (event.request?.url) {
      event.request.url = this.sanitizeUrl(event.request.url);
    }

    return event;
  }

  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove query parameters that might contain sensitive data
      urlObj.search = '';
      return urlObj.toString();
    } catch {
      return '[sanitized-url]';
    }
  }

  private getFatigueMode(): boolean {
    return document.documentElement.classList.contains('fatigue-mode');
  }

  private getAccessibilityFeatures(): string[] {
    const features: string[] = [];
    
    if (document.documentElement.classList.contains('high-contrast')) {
      features.push('high-contrast');
    }
    if (document.documentElement.classList.contains('reduced-motion')) {
      features.push('reduced-motion');
    }
    if (document.documentElement.classList.contains('large-text')) {
      features.push('large-text');
    }
    
    return features;
  }

  private getDeviceOptimizations(): string[] {
    const optimizations: string[] = [];
    
    if (document.documentElement.classList.contains('slow-device-mode')) {
      optimizations.push('slow-device-mode');
    }
    if (document.documentElement.classList.contains('performance-mode')) {
      optimizations.push('performance-mode');
    }
    
    return optimizations;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason), {
        type: 'unhandled-promise-rejection',
        url: window.location.href,
      });
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        type: 'javascript-error',
        url: window.location.href,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        const target = event.target as HTMLElement;
        this.handleResourceError(target);
      }
    }, true);
  }

  private handleResourceError(element: HTMLElement): void {
    const tagName = element.tagName.toLowerCase();
    const src = (element as any).src || (element as any).href;
    
    const error = new Error(`Failed to load ${tagName}: ${src}`);
    this.handleError(error, {
      type: 'resource-error',
      resource: tagName,
      url: src,
    });

    // Provide fallback for failed resources
    this.handleResourceFallback(element, tagName);
  }

  private handleResourceFallback(element: HTMLElement, tagName: string): void {
    switch (tagName) {
      case 'img':
        const img = element as HTMLImageElement;
        img.src = '/images/placeholder.svg';
        img.alt = 'Image temporarily unavailable';
        break;
      
      case 'script':
        // Log script loading failure but don't break the app
        console.warn('Script failed to load, some features may be limited');
        break;
      
      case 'link':
        // CSS loading failure - use fallback styles
        console.warn('Stylesheet failed to load, using fallback styles');
        break;
    }
  }

  private processErrorQueue(): void {
    while (this.errorQueue.length > 0) {
      const { error, context } = this.errorQueue.shift()!;
      this.reportError(error, context);
    }
  }

  private initializeErrorMessages(): void {
    // User-friendly error messages for common issues
    this.userFriendlyMessages.set('NetworkError', {
      id: 'network-error',
      title: 'Connection Issue',
      message: 'We\'re having trouble connecting to our servers. Your data is safe and will sync when connection is restored.',
      suggestion: 'You can continue using the app offline. Try refreshing the page or check your internet connection.',
      severity: 'medium',
      canRetry: true,
    });

    this.userFriendlyMessages.set('ChunkLoadError', {
      id: 'chunk-load-error',
      title: 'Loading Issue',
      message: 'Some app features are taking longer to load than usual.',
      suggestion: 'Please refresh the page. If this continues, try clearing your browser cache.',
      severity: 'low',
      canRetry: true,
    });

    this.userFriendlyMessages.set('QuotaExceededError', {
      id: 'storage-full',
      title: 'Storage Full',
      message: 'Your device storage is full, which may affect app performance.',
      suggestion: 'Consider freeing up some space on your device or clearing old app data.',
      severity: 'medium',
      canRetry: false,
    });

    this.userFriendlyMessages.set('SecurityError', {
      id: 'security-error',
      title: 'Security Restriction',
      message: 'A security setting is preventing some features from working.',
      suggestion: 'Check your browser security settings or try using a different browser.',
      severity: 'high',
      canRetry: false,
    });
  }

  public handleError(error: Error, additionalContext?: any): void {
    const context: ErrorContext = {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now(),
      ...additionalContext,
    };

    // Add chronic illness specific context
    context.fatigueMode = this.getFatigueMode();
    context.accessibilityFeatures = this.getAccessibilityFeatures();

    if (this.isInitialized) {
      this.reportError(error, context);
    } else {
      // Queue error for later processing
      this.errorQueue.push({ error, context });
    }

    // Always show user-friendly error message
    this.showUserFriendlyError(error);
  }

  private reportError(error: Error, context: ErrorContext): void {
    if (process.env.NODE_ENV === 'production') {
      Sentry.withScope((scope) => {
        // Add context to Sentry scope
        scope.setContext('error-context', {
          userAgent: context.userAgent,
          url: context.url,
          timestamp: context.timestamp,
          fatigueMode: context.fatigueMode,
          accessibilityFeatures: context.accessibilityFeatures,
        });
        scope.setLevel('error');
        
        // Add chronic illness specific tags
        if (context.fatigueMode) {
          scope.setTag('fatigue-mode', true);
        }
        
        if (context.accessibilityFeatures?.length) {
          scope.setTag('accessibility-features', context.accessibilityFeatures.join(','));
        }

        Sentry.captureException(error);
      });
    } else {
      // Development logging
      console.error('Error captured:', error, context);
    }
  }

  private showUserFriendlyError(error: Error): void {
    const errorType = error.constructor.name;
    const friendlyError = this.userFriendlyMessages.get(errorType) || this.getGenericError();

    // Show gentle, non-alarming error message
    this.displayErrorToUser(friendlyError);
  }

  private getGenericError(): UserFriendlyError {
    return {
      id: 'generic-error',
      title: 'Something Went Wrong',
      message: 'We encountered a small hiccup, but your data is safe.',
      suggestion: 'Try refreshing the page. If the problem continues, please let us know.',
      severity: 'low',
      canRetry: true,
    };
  }

  private displayErrorToUser(error: UserFriendlyError): void {
    // Create a gentle, non-intrusive error notification
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `
      <div class="error-notification-content">
        <div class="error-icon">💙</div>
        <div class="error-text">
          <h4>${error.title}</h4>
          <p>${error.message}</p>
          <small>${error.suggestion}</small>
        </div>
        ${error.canRetry ? '<button class="retry-button">Try Again</button>' : ''}
        <button class="dismiss-button">×</button>
      </div>
    `;

    // Add gentle styling
    const style = document.createElement('style');
    style.textContent = `
      .error-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        background: #fef7f7;
        border: 1px solid #fecaca;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        font-family: system-ui, sans-serif;
      }
      
      .error-notification-content {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }
      
      .error-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
      }
      
      .error-text h4 {
        margin: 0 0 8px 0;
        color: #dc2626;
        font-size: 1rem;
        font-weight: 600;
      }
      
      .error-text p {
        margin: 0 0 8px 0;
        color: #374151;
        font-size: 0.875rem;
        line-height: 1.4;
      }
      
      .error-text small {
        color: #6b7280;
        font-size: 0.75rem;
        line-height: 1.3;
      }
      
      .retry-button, .dismiss-button {
        background: none;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 0.75rem;
        margin-left: 8px;
      }
      
      .retry-button:hover, .dismiss-button:hover {
        background: #f3f4f6;
      }
      
      .dismiss-button {
        position: absolute;
        top: 8px;
        right: 8px;
        border: none;
        font-size: 1.2rem;
        color: #9ca3af;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(notification);

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);

    // Handle dismiss button
    const dismissButton = notification.querySelector('.dismiss-button');
    dismissButton?.addEventListener('click', () => {
      notification.remove();
    });

    // Handle retry button
    const retryButton = notification.querySelector('.retry-button');
    retryButton?.addEventListener('click', () => {
      window.location.reload();
    });
  }

  // Public API
  public captureException(error: Error, context?: any): void {
    this.handleError(error, context);
  }

  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (this.isInitialized && process.env.NODE_ENV === 'production') {
      Sentry.captureMessage(message, level);
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`);
    }
  }

  public setUserContext(user: { id?: string; email?: string }): void {
    if (this.isInitialized) {
      Sentry.setUser({
        id: user.id ? 'user-' + btoa(String(user.id)).slice(0, 8) : undefined, // Anonymized ID
        // Don't include email for privacy
      });
    }
  }

  public addBreadcrumb(message: string, category?: string, level?: 'info' | 'warning' | 'error'): void {
    if (this.isInitialized) {
      Sentry.addBreadcrumb({
        message,
        category: category || 'user-action',
        level: level || 'info',
        timestamp: Date.now() / 1000,
      });
    }
  }

  public setTag(key: string, value: string): void {
    if (this.isInitialized) {
      Sentry.setTag(key, value);
    }
  }

  public setContext(key: string, context: any): void {
    if (this.isInitialized) {
      Sentry.setContext(key, context);
    }
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

// Utility functions
export function captureError(error: Error, context?: any): void {
  errorTracker.captureException(error, context);
}

export function captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void {
  errorTracker.captureMessage(message, level);
}

export function setUserContext(user: { id?: string; email?: string }): void {
  errorTracker.setUserContext(user);
}

export function addBreadcrumb(message: string, category?: string): void {
  errorTracker.addBreadcrumb(message, category);
}