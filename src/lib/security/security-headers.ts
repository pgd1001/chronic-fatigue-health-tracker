/**
 * Security headers and Content Security Policy configuration
 * Implements comprehensive security measures for chronic fatigue health tracker
 */

import { NextRequest, NextResponse } from 'next/server';

// Content Security Policy configuration
export const CSP_DIRECTIVES = {
  // Default source - only allow same origin
  'default-src': ["'self'"],
  
  // Script sources - allow self, inline scripts for Next.js, and trusted CDNs
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Next.js
    "'unsafe-eval'", // Required for development and some libraries
    'https://vercel.live',
    'https://cdn.jsdelivr.net',
    'https://unpkg.com',
    // TensorFlow.js CDN for biometric processing
    'https://cdn.jsdelivr.net/npm/@tensorflow/',
    // Sentry for error tracking
    'https://browser.sentry-cdn.com',
  ],
  
  // Style sources - allow self, inline styles, and font providers
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for CSS-in-JS and Tailwind
    'https://fonts.googleapis.com',
  ],
  
  // Font sources
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
    'data:', // For base64 encoded fonts
  ],
  
  // Image sources - allow self, data URLs, and trusted domains
  'img-src': [
    "'self'",
    'data:', // For base64 images and canvas
    'blob:', // For camera capture
    'https:', // Allow HTTPS images
  ],
  
  // Media sources for camera and audio
  'media-src': [
    "'self'",
    'blob:', // For camera/microphone access
  ],
  
  // Connect sources for API calls
  'connect-src': [
    "'self'",
    // Sentry error reporting
    'https://sentry.io',
    'https://*.sentry.io',
    // Vercel analytics
    'https://vitals.vercel-analytics.com',
    // WebSocket connections for development
    'ws://localhost:*',
    'wss://localhost:*',
  ],
  
  // Frame sources - restrict embedding
  'frame-src': [
    "'none'", // Prevent embedding in frames
  ],
  
  // Object sources - prevent plugins
  'object-src': ["'none'"],
  
  // Base URI - prevent injection
  'base-uri': ["'self'"],
  
  // Form action - restrict form submissions
  'form-action': ["'self'"],
  
  // Frame ancestors - prevent clickjacking
  'frame-ancestors': ["'none'"],
  
  // Upgrade insecure requests in production
  'upgrade-insecure-requests': process.env.NODE_ENV === 'production' ? [] : undefined,
  
  // Block mixed content
  'block-all-mixed-content': process.env.NODE_ENV === 'production' ? [] : undefined,
};

// Generate CSP header value
function generateCSPHeader(): string {
  const directives = Object.entries(CSP_DIRECTIVES)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => {
      if (Array.isArray(value) && value.length === 0) {
        return key; // Directive without value (like upgrade-insecure-requests)
      }
      if (Array.isArray(value)) {
        return `${key} ${value.join(' ')}`;
      }
      return `${key} ${value}`;
    });
  
  return directives.join('; ');
}

// Security headers configuration
export const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': generateCSPHeader(),
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // XSS Protection (legacy browsers)
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer Policy - limit referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy - restrict browser features
  'Permissions-Policy': [
    'camera=(self)', // Allow camera for biometric capture
    'microphone=()', // Disable microphone by default
    'geolocation=()', // Disable geolocation
    'payment=()', // Disable payment API
    'usb=()', // Disable USB API
    'magnetometer=()', // Disable magnetometer
    'gyroscope=()', // Disable gyroscope
    'accelerometer=()', // Disable accelerometer
    'ambient-light-sensor=()', // Disable ambient light sensor
    'autoplay=()', // Disable autoplay
    'encrypted-media=()', // Disable encrypted media
    'fullscreen=(self)', // Allow fullscreen on same origin
    'picture-in-picture=()', // Disable picture-in-picture
  ].join(', '),
  
  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Cross-Origin Embedder Policy
  'Cross-Origin-Embedder-Policy': 'credentialless',
  
  // Cross-Origin Opener Policy
  'Cross-Origin-Opener-Policy': 'same-origin',
  
  // Cross-Origin Resource Policy
  'Cross-Origin-Resource-Policy': 'same-origin',
  
  // Server identification (remove server info)
  'Server': 'CF-Health-Tracker',
  
  // Cache control for sensitive pages
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// Route-specific security configurations
export const ROUTE_SECURITY_CONFIG = {
  // Authentication routes - extra strict
  '/api/auth/*': {
    headers: {
      ...SECURITY_HEADERS,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive',
    },
    rateLimit: { requests: 5, window: 15 * 60 * 1000 }, // 5 per 15 minutes
  },
  
  // Health data routes - strict privacy
  '/api/health/*': {
    headers: {
      ...SECURITY_HEADERS,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive',
    },
    rateLimit: { requests: 100, window: 60 * 60 * 1000 }, // 100 per hour
  },
  
  // File upload routes - very strict
  '/api/upload/*': {
    headers: {
      ...SECURITY_HEADERS,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive',
    },
    rateLimit: { requests: 10, window: 60 * 60 * 1000 }, // 10 per hour
  },
  
  // Static assets - allow caching but secure
  '/static/*': {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  },
  
  // Public pages - basic security
  '/': {
    headers: {
      ...SECURITY_HEADERS,
      'Cache-Control': 'public, max-age=3600', // 1 hour cache
    },
  },
};

// Security middleware factory
export function withSecurityHeaders(
  customHeaders: Record<string, string> = {},
  options: {
    skipCSP?: boolean;
    skipHSTS?: boolean;
    allowFraming?: boolean;
  } = {}
) {
  return function securityMiddleware(
    handler: (request: NextRequest) => Promise<NextResponse>
  ) {
    return async function (request: NextRequest): Promise<NextResponse> {
      const response = await handler(request);
      
      // Apply security headers
      const headers = { ...SECURITY_HEADERS, ...customHeaders };
      
      // Skip CSP if requested (for development)
      if (options.skipCSP) {
        delete headers['Content-Security-Policy'];
      }
      
      // Skip HSTS for non-HTTPS (development)
      if (options.skipHSTS || !request.url.startsWith('https://')) {
        delete headers['Strict-Transport-Security'];
      }
      
      // Allow framing if requested
      if (options.allowFraming) {
        delete headers['X-Frame-Options'];
        headers['Content-Security-Policy'] = headers['Content-Security-Policy']
          ?.replace("frame-ancestors 'none'", "frame-ancestors 'self'");
      }
      
      // Apply headers to response
      Object.entries(headers).forEach(([key, value]) => {
        if (value) {
          response.headers.set(key, value);
        }
      });
      
      return response;
    };
  };
}

// CORS configuration for API routes
export const CORS_CONFIG = {
  // Allowed origins (restrict in production)
  origins: process.env.NODE_ENV === 'production' 
    ? [process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  
  // Allowed methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'User-Agent',
  ],
  
  // Exposed headers
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  
  // Credentials
  credentials: true,
  
  // Preflight cache
  maxAge: 86400, // 24 hours
};

// CORS middleware
export function withCORS(config: Partial<typeof CORS_CONFIG> = {}) {
  const corsConfig = { ...CORS_CONFIG, ...config };
  
  return function corsMiddleware(
    handler: (request: NextRequest) => Promise<NextResponse>
  ) {
    return async function (request: NextRequest): Promise<NextResponse> {
      const origin = request.headers.get('origin');
      
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 200 });
        
        // Check origin
        if (origin && corsConfig.origins.includes(origin)) {
          response.headers.set('Access-Control-Allow-Origin', origin);
        }
        
        response.headers.set('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
        response.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
        response.headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString());
        
        if (corsConfig.credentials) {
          response.headers.set('Access-Control-Allow-Credentials', 'true');
        }
        
        return response;
      }
      
      // Handle actual request
      const response = await handler(request);
      
      // Add CORS headers
      if (origin && corsConfig.origins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      }
      
      response.headers.set('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '));
      
      if (corsConfig.credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }
      
      return response;
    };
  };
}

// Security audit utilities
export class SecurityAuditor {
  static auditRequest(request: NextRequest): {
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;
    
    // Check for HTTPS
    if (!request.url.startsWith('https://') && process.env.NODE_ENV === 'production') {
      issues.push('Request not using HTTPS');
      recommendations.push('Enforce HTTPS in production');
      score -= 20;
    }
    
    // Check for suspicious headers
    const userAgent = request.headers.get('user-agent');
    if (!userAgent || userAgent.length < 10) {
      issues.push('Missing or suspicious User-Agent header');
      recommendations.push('Implement bot detection');
      score -= 10;
    }
    
    // Check for security headers in response
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'content-security-policy',
    ];
    
    // This would be checked on the response, not request
    // Keeping for reference
    
    return { score, issues, recommendations };
  }
  
  static auditResponse(response: NextResponse): {
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;
    
    // Check for security headers
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'content-security-policy',
      'referrer-policy',
    ];
    
    requiredHeaders.forEach(header => {
      if (!response.headers.get(header)) {
        issues.push(`Missing security header: ${header}`);
        recommendations.push(`Add ${header} header`);
        score -= 15;
      }
    });
    
    // Check cache control for sensitive routes
    const cacheControl = response.headers.get('cache-control');
    if (!cacheControl?.includes('no-store') && response.url?.includes('/api/')) {
      issues.push('API responses should not be cached');
      recommendations.push('Add no-store cache control to API responses');
      score -= 10;
    }
    
    return { score, issues, recommendations };
  }
}

// Export utilities
export { generateCSPHeader };