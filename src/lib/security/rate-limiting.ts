/**
 * Rate limiting and DDoS protection for chronic fatigue health tracker
 * Implements multiple layers of protection while being gentle to legitimate users
 */

import { NextRequest, NextResponse } from 'next/server';

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  // Authentication endpoints - stricter limits
  auth: {
    login: { requests: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    register: { requests: 3, window: 60 * 60 * 1000 }, // 3 attempts per hour
    resetPassword: { requests: 3, window: 60 * 60 * 1000 }, // 3 attempts per hour
  },
  
  // API endpoints - moderate limits
  api: {
    healthLog: { requests: 100, window: 60 * 60 * 1000 }, // 100 per hour
    biometrics: { requests: 50, window: 60 * 60 * 1000 }, // 50 per hour
    movement: { requests: 30, window: 60 * 60 * 1000 }, // 30 per hour
    reports: { requests: 10, window: 60 * 60 * 1000 }, // 10 per hour
  },
  
  // General endpoints - lenient limits for chronic illness users
  general: {
    default: { requests: 1000, window: 60 * 60 * 1000 }, // 1000 per hour
    static: { requests: 2000, window: 60 * 60 * 1000 }, // 2000 per hour
  },
  
  // File upload - very strict
  upload: {
    files: { requests: 10, window: 60 * 60 * 1000 }, // 10 uploads per hour
  },
};

// In-memory store for rate limiting (in production, use Redis)
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number; blocked: boolean }>();
  private blockedIPs = new Map<string, { until: number; reason: string }>();

  get(key: string) {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    // Clean up expired entries
    if (Date.now() > entry.resetTime) {
      this.store.delete(key);
      return null;
    }
    
    return entry;
  }

  set(key: string, value: { count: number; resetTime: number; blocked: boolean }) {
    this.store.set(key, value);
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const existing = this.get(key);
    
    if (!existing) {
      const entry = { count: 1, resetTime: now + windowMs, blocked: false };
      this.set(key, entry);
      return { count: 1, resetTime: now + windowMs };
    }
    
    existing.count++;
    this.set(key, existing);
    return { count: existing.count, resetTime: existing.resetTime };
  }

  blockIP(ip: string, durationMs: number, reason: string) {
    this.blockedIPs.set(ip, {
      until: Date.now() + durationMs,
      reason,
    });
  }

  isBlocked(ip: string): { blocked: boolean; reason?: string; until?: number } {
    const block = this.blockedIPs.get(ip);
    if (!block) return { blocked: false };
    
    if (Date.now() > block.until) {
      this.blockedIPs.delete(ip);
      return { blocked: false };
    }
    
    return { blocked: true, reason: block.reason, until: block.until };
  }

  // Clean up expired entries periodically
  cleanup() {
    const now = Date.now();
    
    // Clean rate limit entries
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
    
    // Clean blocked IPs
    for (const [ip, block] of this.blockedIPs.entries()) {
      if (now > block.until) {
        this.blockedIPs.delete(ip);
      }
    }
  }
}

const rateLimitStore = new RateLimitStore();

// Clean up expired entries every 5 minutes
setInterval(() => rateLimitStore.cleanup(), 5 * 60 * 1000);

// Get client IP address
function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  // Fallback to connection IP (may be proxy)
  return request.ip || 'unknown';
}

// Generate rate limit key
function getRateLimitKey(request: NextRequest, identifier?: string): string {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const path = request.nextUrl.pathname;
  
  // Use custom identifier if provided (e.g., user ID for authenticated requests)
  if (identifier) {
    return `${identifier}:${path}`;
  }
  
  // Use IP + User Agent hash for anonymous requests
  const hash = Buffer.from(`${ip}:${userAgent}`).toString('base64').slice(0, 16);
  return `${hash}:${path}`;
}

// Detect suspicious patterns
function detectSuspiciousActivity(request: NextRequest, ip: string): {
  suspicious: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high';
} {
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';
  const path = request.nextUrl.pathname;
  
  // Check for bot patterns
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i,
  ];
  
  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    return { suspicious: true, reason: 'Bot-like user agent', severity: 'medium' };
  }
  
  // Check for missing or suspicious user agent
  if (!userAgent || userAgent.length < 10) {
    return { suspicious: true, reason: 'Missing or suspicious user agent', severity: 'low' };
  }
  
  // Check for path traversal attempts
  if (path.includes('..') || path.includes('%2e%2e')) {
    return { suspicious: true, reason: 'Path traversal attempt', severity: 'high' };
  }
  
  // Check for SQL injection patterns in query params
  const queryString = request.nextUrl.search;
  const sqlPatterns = [
    /union\s+select/i, /drop\s+table/i, /insert\s+into/i,
    /delete\s+from/i, /update\s+set/i, /exec\s*\(/i,
  ];
  
  if (sqlPatterns.some(pattern => pattern.test(queryString))) {
    return { suspicious: true, reason: 'SQL injection attempt', severity: 'high' };
  }
  
  // Check for XSS patterns
  const xssPatterns = [
    /<script/i, /javascript:/i, /onload=/i, /onerror=/i,
  ];
  
  if (xssPatterns.some(pattern => pattern.test(queryString))) {
    return { suspicious: true, reason: 'XSS attempt', severity: 'high' };
  }
  
  return { suspicious: false, severity: 'low' };
}

// Main rate limiting middleware
export function createRateLimiter(config: {
  requests: number;
  window: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
}) {
  return async function rateLimitMiddleware(
    request: NextRequest,
    identifier?: string
  ): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
    blocked?: boolean;
    reason?: string;
  }> {
    const ip = getClientIP(request);
    
    // Check if IP is blocked
    const blockStatus = rateLimitStore.isBlocked(ip);
    if (blockStatus.blocked) {
      return {
        success: false,
        limit: 0,
        remaining: 0,
        reset: blockStatus.until || 0,
        blocked: true,
        reason: blockStatus.reason,
      };
    }
    
    // Detect suspicious activity
    const suspiciousActivity = detectSuspiciousActivity(request, ip);
    if (suspiciousActivity.suspicious && suspiciousActivity.severity === 'high') {
      // Block IP for high severity threats
      rateLimitStore.blockIP(ip, 60 * 60 * 1000, suspiciousActivity.reason || 'Suspicious activity'); // 1 hour block
      return {
        success: false,
        limit: 0,
        remaining: 0,
        reset: Date.now() + 60 * 60 * 1000,
        blocked: true,
        reason: 'Blocked due to suspicious activity',
      };
    }
    
    // Generate rate limit key
    const key = config.keyGenerator ? config.keyGenerator(request) : getRateLimitKey(request, identifier);
    
    // Check current rate limit status
    const current = rateLimitStore.get(key);
    const now = Date.now();
    
    if (!current) {
      // First request in window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.window,
        blocked: false,
      });
      
      return {
        success: true,
        limit: config.requests,
        remaining: config.requests - 1,
        reset: now + config.window,
      };
    }
    
    // Check if limit exceeded
    if (current.count >= config.requests) {
      // Check for repeated violations (potential attack)
      if (current.count > config.requests * 2) {
        rateLimitStore.blockIP(ip, 30 * 60 * 1000, 'Rate limit violation'); // 30 minute block
      }
      
      return {
        success: false,
        limit: config.requests,
        remaining: 0,
        reset: current.resetTime,
      };
    }
    
    // Increment counter
    const updated = rateLimitStore.increment(key, config.window);
    
    return {
      success: true,
      limit: config.requests,
      remaining: Math.max(0, config.requests - updated.count),
      reset: updated.resetTime,
    };
  };
}

// Predefined rate limiters for common use cases
export const rateLimiters = {
  auth: createRateLimiter(RATE_LIMITS.auth.login),
  api: createRateLimiter(RATE_LIMITS.api.healthLog),
  upload: createRateLimiter(RATE_LIMITS.upload.files),
  general: createRateLimiter(RATE_LIMITS.general.default),
};

// Middleware factory for Next.js API routes
export function withRateLimit(
  config: { requests: number; window: number },
  options: {
    onLimitReached?: (request: NextRequest) => NextResponse;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
  } = {}
) {
  const rateLimiter = createRateLimiter(config);
  
  return function middleware(handler: (request: NextRequest) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      const result = await rateLimiter(request);
      
      if (!result.success) {
        const response = options.onLimitReached 
          ? options.onLimitReached(request)
          : new NextResponse(
              JSON.stringify({
                error: result.blocked ? 'IP blocked' : 'Rate limit exceeded',
                message: result.blocked 
                  ? `Your IP has been temporarily blocked: ${result.reason}`
                  : 'Too many requests. Please try again later.',
                retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
              }),
              {
                status: result.blocked ? 403 : 429,
                headers: {
                  'Content-Type': 'application/json',
                  'X-RateLimit-Limit': result.limit.toString(),
                  'X-RateLimit-Remaining': result.remaining.toString(),
                  'X-RateLimit-Reset': result.reset.toString(),
                  'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
                },
              }
            );
        
        return response;
      }
      
      // Add rate limit headers to successful responses
      const response = await handler(request);
      response.headers.set('X-RateLimit-Limit', result.limit.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.reset.toString());
      
      return response;
    };
  };
}

// DDoS protection middleware
export function withDDoSProtection(options: {
  maxRequestsPerSecond?: number;
  maxConcurrentRequests?: number;
  suspiciousThreshold?: number;
} = {}) {
  const {
    maxRequestsPerSecond = 10,
    maxConcurrentRequests = 50,
    suspiciousThreshold = 100,
  } = options;
  
  const requestCounts = new Map<string, number[]>();
  const concurrentRequests = new Map<string, number>();
  
  return function middleware(handler: (request: NextRequest) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      const ip = getClientIP(request);
      const now = Date.now();
      
      // Track concurrent requests
      const concurrent = concurrentRequests.get(ip) || 0;
      if (concurrent >= maxConcurrentRequests) {
        return new NextResponse(
          JSON.stringify({
            error: 'Too many concurrent requests',
            message: 'Please wait for previous requests to complete',
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Track requests per second
      const requests = requestCounts.get(ip) || [];
      const recentRequests = requests.filter(time => now - time < 1000);
      
      if (recentRequests.length >= maxRequestsPerSecond) {
        // Potential DDoS - block temporarily
        rateLimitStore.blockIP(ip, 5 * 60 * 1000, 'DDoS protection triggered');
        
        return new NextResponse(
          JSON.stringify({
            error: 'Request rate too high',
            message: 'Your IP has been temporarily blocked due to excessive requests',
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Update tracking
      recentRequests.push(now);
      requestCounts.set(ip, recentRequests);
      concurrentRequests.set(ip, concurrent + 1);
      
      try {
        const response = await handler(request);
        return response;
      } finally {
        // Decrement concurrent request count
        const newConcurrent = (concurrentRequests.get(ip) || 1) - 1;
        if (newConcurrent <= 0) {
          concurrentRequests.delete(ip);
        } else {
          concurrentRequests.set(ip, newConcurrent);
        }
      }
    };
  };
}

// Export utilities
export { rateLimitStore, getClientIP, detectSuspiciousActivity };