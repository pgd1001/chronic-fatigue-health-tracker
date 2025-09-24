/**
 * Next.js middleware for security hardening
 * Implements comprehensive security measures for chronic fatigue health tracker
 */

import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders, withCORS, ROUTE_SECURITY_CONFIG } from './lib/security/security-headers';
import { withRateLimit, withDDoSProtection, getClientIP } from './lib/security/rate-limiting';

// Security middleware configuration
const SECURITY_CONFIG = {
  // Routes that require authentication
  protectedRoutes: [
    '/dashboard',
    '/health',
    '/movement',
    '/sleep',
    '/biometrics',
    '/reports',
    '/api/health',
    '/api/movement',
    '/api/biometrics',
    '/api/reports',
  ],
  
  // Routes that should be publicly accessible
  publicRoutes: [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/reset-password',
    '/privacy',
    '/terms',
    '/api/auth',
    '/api/health/ping',
  ],
  
  // Static assets and API routes with different security requirements
  staticRoutes: [
    '/_next',
    '/favicon.ico',
    '/manifest.json',
    '/sw.js',
    '/images',
    '/icons',
  ],
};

// Check if route matches pattern
function matchesRoute(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    if (pattern.endsWith('*')) {
      return pathname.startsWith(pattern.slice(0, -1));
    }
    return pathname === pattern || pathname.startsWith(pattern + '/');
  });
}

// Get route-specific security configuration
function getRouteConfig(pathname: string) {
  for (const [pattern, config] of Object.entries(ROUTE_SECURITY_CONFIG)) {
    if (pattern.endsWith('*')) {
      if (pathname.startsWith(pattern.slice(0, -1))) {
        return config;
      }
    } else if (pathname === pattern) {
      return config;
    }
  }
  return null;
}

// Main middleware function
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIP = getClientIP(request);
  
  // Skip middleware for Next.js internal routes
  if (pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  console.log(`[Security] Processing request: ${request.method} ${pathname} from ${clientIP}`);

  try {
    // Get route-specific configuration
    const routeConfig = getRouteConfig(pathname);
    
    // Apply DDoS protection to all routes
    const ddosProtection = withDDoSProtection({
      maxRequestsPerSecond: 10,
      maxConcurrentRequests: 50,
    });

    // Apply rate limiting based on route type
    let rateLimitConfig = { requests: 1000, window: 60 * 60 * 1000 }; // Default: 1000/hour
    
    if (matchesRoute(pathname, ['/api/auth/*'])) {
      rateLimitConfig = { requests: 5, window: 15 * 60 * 1000 }; // Auth: 5/15min
    } else if (matchesRoute(pathname, ['/api/health/*', '/api/movement/*', '/api/biometrics/*'])) {
      rateLimitConfig = { requests: 100, window: 60 * 60 * 1000 }; // Health APIs: 100/hour
    } else if (matchesRoute(pathname, ['/api/upload/*'])) {
      rateLimitConfig = { requests: 10, window: 60 * 60 * 1000 }; // Upload: 10/hour
    }

    // Create rate limiter
    const rateLimiter = withRateLimit(rateLimitConfig, {
      onLimitReached: (req) => {
        console.warn(`[Security] Rate limit exceeded for ${getClientIP(req)} on ${pathname}`);
        return new NextResponse(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil(rateLimitConfig.window / 1000),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil(rateLimitConfig.window / 1000).toString(),
            },
          }
        );
      },
    });

    // Apply security headers based on route type
    let securityHeaders = {};
    let securityOptions = {};

    if (matchesRoute(pathname, SECURITY_CONFIG.staticRoutes)) {
      // Static assets - minimal security headers
      securityHeaders = {
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      };
      securityOptions = { skipCSP: true, skipHSTS: true };
    } else if (matchesRoute(pathname, ['/api/*'])) {
      // API routes - strict security
      securityHeaders = {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive',
      };
    } else {
      // Regular pages - full security headers
      securityHeaders = {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      };
    }

    // Apply route-specific headers if configured
    if (routeConfig?.headers) {
      securityHeaders = { ...securityHeaders, ...routeConfig.headers };
    }

    // Create security middleware
    const securityMiddleware = withSecurityHeaders(securityHeaders, {
      ...securityOptions,
      skipHSTS: process.env.NODE_ENV !== 'production',
    });

    // Create CORS middleware for API routes
    const corsMiddleware = matchesRoute(pathname, ['/api/*']) 
      ? withCORS({
          origins: process.env.NODE_ENV === 'production' 
            ? [process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com']
            : ['http://localhost:3000', 'http://127.0.0.1:3000'],
        })
      : (handler: any) => handler;

    // Compose middleware chain
    const composedMiddleware = ddosProtection(
      rateLimiter(
        corsMiddleware(
          securityMiddleware(async (req: NextRequest) => {
            // Check for authentication on protected routes
            if (matchesRoute(pathname, SECURITY_CONFIG.protectedRoutes)) {
              const authHeader = req.headers.get('authorization');
              const sessionCookie = req.cookies.get('session');
              
              // Simple auth check - in production, verify JWT or session
              if (!authHeader && !sessionCookie) {
                // Redirect to login for page requests
                if (!pathname.startsWith('/api/')) {
                  const loginUrl = new URL('/auth/signin', req.url);
                  loginUrl.searchParams.set('redirect', pathname);
                  return NextResponse.redirect(loginUrl);
                }
                
                // Return 401 for API requests
                return new NextResponse(
                  JSON.stringify({
                    error: 'Unauthorized',
                    message: 'Authentication required',
                  }),
                  {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                  }
                );
              }
            }

            // Log security events
            if (pathname.startsWith('/api/auth/')) {
              console.log(`[Security] Auth attempt: ${request.method} ${pathname} from ${clientIP}`);
            }

            // Continue to next middleware or route handler
            return NextResponse.next();
          })
        )
      )
    );

    // Execute middleware chain
    return await composedMiddleware(request);

  } catch (error) {
    console.error(`[Security] Middleware error for ${pathname}:`, error);
    
    // Return generic error response
    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An error occurred processing your request',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  }
}

// Configure middleware matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};