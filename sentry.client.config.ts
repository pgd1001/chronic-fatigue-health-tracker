import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Privacy-first configuration for chronic illness users
  beforeSend(event) {
    // Remove sensitive health data
    if (event.extra) {
      delete event.extra.healthData;
      delete event.extra.biometricData;
      delete event.extra.personalInfo;
    }

    // Remove PII from error messages
    if (event.message) {
      event.message = event.message
        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]')
        .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[phone]');
    }

    return event;
  },
  
  // Filter out non-critical errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'Network request failed',
    'Loading chunk',
    'ChunkLoadError',
    'NotAllowedError', // Camera/media permissions
    'NotFoundError',   // Camera/media not found
  ],
  
  // Custom tags for chronic illness context
  initialScope: {
    tags: {
      component: 'chronic-fatigue-tracker',
      userType: 'chronic-illness',
    },
  },
  
  // Environment-specific configuration
  environment: process.env.NODE_ENV,
  
  // Integrations
  integrations: [
    new Sentry.Replay({
      // Mask sensitive content in session replays
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
});