import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Privacy-first configuration
  beforeSend(event) {
    // Remove sensitive health data from server-side errors
    if (event.extra) {
      delete event.extra.healthData;
      delete event.extra.biometricData;
      delete event.extra.personalInfo;
      delete event.extra.databaseQuery;
    }

    // Remove PII from error messages
    if (event.message) {
      event.message = event.message
        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]')
        .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[phone]');
    }

    return event;
  },
  
  // Filter out non-critical server errors
  ignoreErrors: [
    'ECONNRESET',
    'ENOTFOUND',
    'ETIMEDOUT',
    'Database connection failed',
  ],
  
  // Custom tags
  initialScope: {
    tags: {
      component: 'chronic-fatigue-tracker-server',
      userType: 'chronic-illness',
    },
  },
  
  // Environment
  environment: process.env.NODE_ENV,
});