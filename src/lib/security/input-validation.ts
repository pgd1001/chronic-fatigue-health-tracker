/**
 * Comprehensive input validation and sanitization for chronic fatigue health tracker
 * Implements security best practices for health data protection
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Common validation patterns
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?[\d\s\-\(\)]{10,}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_STRING_REGEX = /^[a-zA-Z0-9\s\-_.,!?()]+$/;

// Health data specific validation
export const HealthDataValidation = {
  // Energy level (1-10 scale)
  energyLevel: z.number().min(1).max(10).int(),
  
  // Symptom severity (0-10 scale)
  symptomSeverity: z.number().min(0).max(10).int(),
  
  // Heart rate (30-220 BPM reasonable range)
  heartRate: z.number().min(30).max(220).int(),
  
  // Blood pressure (systolic: 70-250, diastolic: 40-150)
  bloodPressure: z.object({
    systolic: z.number().min(70).max(250).int(),
    diastolic: z.number().min(40).max(150).int(),
  }),
  
  // Weight in kg (20-300 kg reasonable range)
  weight: z.number().min(20).max(300),
  
  // Height in cm (100-250 cm reasonable range)
  height: z.number().min(100).max(250),
  
  // Sleep hours (0-24 hours)
  sleepHours: z.number().min(0).max(24),
  
  // Water intake in ml (0-10000 ml per day)
  waterIntake: z.number().min(0).max(10000).int(),
  
  // Exercise duration in minutes (0-480 minutes = 8 hours max)
  exerciseDuration: z.number().min(0).max(480).int(),
};

// User input validation schemas
export const UserInputSchemas = {
  // Basic user information
  userProfile: z.object({
    name: z.string().min(1).max(100).regex(SAFE_STRING_REGEX, 'Invalid characters in name'),
    email: z.string().email().regex(EMAIL_REGEX, 'Invalid email format'),
    phone: z.string().optional().refine(
      (val) => !val || PHONE_REGEX.test(val),
      'Invalid phone number format'
    ),
    dateOfBirth: z.date().max(new Date(), 'Date of birth cannot be in the future'),
    timezone: z.string().min(1).max(50),
  }),
  
  // Health log entry
  healthLog: z.object({
    date: z.date().max(new Date(), 'Date cannot be in the future'),
    energyLevel: HealthDataValidation.energyLevel,
    sleepQuality: z.number().min(1).max(10).int(),
    symptoms: z.array(z.object({
      type: z.enum(['fatigue', 'pain', 'brain_fog', 'nausea', 'headache', 'other']),
      severity: HealthDataValidation.symptomSeverity,
      notes: z.string().max(500).optional(),
    })).max(10), // Limit to 10 symptoms per entry
    notes: z.string().max(1000).optional(),
  }),
  
  // Movement session
  movementSession: z.object({
    type: z.enum(['warmup', 'resistance', 'flow', 'cooldown', 'full_session']),
    duration: HealthDataValidation.exerciseDuration,
    intensity: z.number().min(1).max(10).int(),
    exercises: z.array(z.object({
      name: z.string().min(1).max(100).regex(SAFE_STRING_REGEX),
      sets: z.number().min(0).max(20).int().optional(),
      reps: z.number().min(0).max(100).int().optional(),
      duration: z.number().min(0).max(3600).int().optional(), // Max 1 hour per exercise
    })).max(20), // Limit to 20 exercises per session
    postSessionRating: z.object({
      fatigue: z.number().min(1).max(10).int(),
      breath: z.number().min(1).max(10).int(),
      stability: z.number().min(1).max(10).int(),
    }),
  }),
  
  // Biometric data
  biometricData: z.object({
    heartRate: HealthDataValidation.heartRate.optional(),
    bloodPressure: HealthDataValidation.bloodPressure.optional(),
    weight: HealthDataValidation.weight.optional(),
    temperature: z.number().min(30).max(45).optional(), // Celsius
    oxygenSaturation: z.number().min(70).max(100).optional(),
    timestamp: z.date().max(new Date()),
  }),
  
  // Nutrition entry
  nutritionEntry: z.object({
    date: z.date().max(new Date()),
    meals: z.array(z.object({
      type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
      foods: z.array(z.object({
        name: z.string().min(1).max(100).regex(SAFE_STRING_REGEX),
        category: z.enum(['1_product_food', '1000_year_rule', 'supplement', 'other']),
        quantity: z.string().max(50).optional(),
      })).max(20), // Limit foods per meal
    })).max(10), // Limit meals per day
    waterIntake: HealthDataValidation.waterIntake,
    supplements: z.array(z.object({
      name: z.string().min(1).max(100).regex(SAFE_STRING_REGEX),
      dosage: z.string().max(50),
      timing: z.string().max(50),
    })).max(20), // Limit supplements
  }),
};

// API request validation
export const APIRequestSchemas = {
  // Pagination parameters
  pagination: z.object({
    page: z.number().min(1).max(1000).int().default(1),
    limit: z.number().min(1).max(100).int().default(20),
    sortBy: z.string().max(50).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
  
  // Date range filters
  dateRange: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }).refine(
    (data) => data.startDate <= data.endDate,
    'Start date must be before or equal to end date'
  ).refine(
    (data) => {
      const daysDiff = (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 365; // Limit to 1 year range
    },
    'Date range cannot exceed 365 days'
  ),
  
  // Search parameters
  search: z.object({
    query: z.string().min(1).max(100).regex(SAFE_STRING_REGEX, 'Invalid search query'),
    filters: z.record(z.string().max(100)).optional(),
  }),
  
  // File upload validation
  fileUpload: z.object({
    filename: z.string().min(1).max(255).regex(/^[a-zA-Z0-9._-]+$/, 'Invalid filename'),
    size: z.number().min(1).max(10 * 1024 * 1024), // 10MB max
    type: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  }),
};

// Sanitization functions
export class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHTML(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: [],
    });
  }

  /**
   * Sanitize plain text input
   */
  static sanitizeText(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .slice(0, 1000); // Limit length
  }

  /**
   * Sanitize SQL-like input (though we use ORM, extra safety)
   */
  static sanitizeSQL(input: string): string {
    return input
      .replace(/[';]/g, '') // Remove SQL injection patterns
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER|CREATE)\b/gi, '') // Remove SQL keywords
      .trim();
  }

  /**
   * Sanitize file paths
   */
  static sanitizeFilePath(input: string): string {
    return input
      .replace(/\.\./g, '') // Remove directory traversal
      .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
      .replace(/^\/+/, '') // Remove leading slashes
      .slice(0, 255); // Limit length
  }

  /**
   * Sanitize URL input
   */
  static sanitizeURL(input: string): string {
    try {
      const url = new URL(input);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
      return url.toString();
    } catch {
      return '';
    }
  }

  /**
   * Sanitize JSON input
   */
  static sanitizeJSON(input: string): any {
    try {
      const parsed = JSON.parse(input);
      return this.sanitizeObject(parsed);
    } catch {
      throw new Error('Invalid JSON format');
    }
  }

  /**
   * Recursively sanitize object properties
   */
  private static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeText(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeText(key);
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  }
}

// Rate limiting helpers
export class RateLimitValidator {
  private static attempts = new Map<string, { count: number; resetTime: number }>();

  /**
   * Check if request is within rate limits
   */
  static checkRateLimit(
    identifier: string,
    maxAttempts: number = 100,
    windowMs: number = 15 * 60 * 1000 // 15 minutes
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = identifier;
    const current = this.attempts.get(key);

    if (!current || now > current.resetTime) {
      // Reset or initialize
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: maxAttempts - 1, resetTime: now + windowMs };
    }

    if (current.count >= maxAttempts) {
      return { allowed: false, remaining: 0, resetTime: current.resetTime };
    }

    current.count++;
    this.attempts.set(key, current);
    return { allowed: true, remaining: maxAttempts - current.count, resetTime: current.resetTime };
  }

  /**
   * Clear rate limit for identifier (useful for successful auth)
   */
  static clearRateLimit(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// Security validation middleware
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
  sanitize: boolean = true
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    // Sanitize input if requested
    let processedInput = input;
    if (sanitize && typeof input === 'object' && input !== null) {
      processedInput = InputSanitizer.sanitizeObject(input);
    }

    // Validate with schema
    const result = schema.safeParse(processedInput);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
  } catch (error) {
    return { 
      success: false, 
      errors: ['Validation failed: ' + (error instanceof Error ? error.message : 'Unknown error')]
    };
  }
}

// Export validation utilities
export { z };
export type ValidationResult<T> = ReturnType<typeof validateAndSanitize<T>>;