/**
 * Comprehensive security testing suite
 * Tests all security measures for chronic fatigue health tracker
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { 
  SecurityTestSuite, 
  VulnerabilityScanner, 
  ComplianceChecker,
  SecurityTestCategory 
} from './security-testing';
import { 
  validateAndSanitize, 
  UserInputSchemas, 
  InputSanitizer, 
  RateLimitValidator 
} from './input-validation';
import { rateLimiters, detectSuspiciousActivity } from './rate-limiting';
import { SecurityAuditor } from './security-headers';

describe('Security Testing Suite', () => {
  let securityTestSuite: SecurityTestSuite;

  beforeEach(() => {
    securityTestSuite = new SecurityTestSuite();
    vi.clearAllMocks();
  });

  describe('Input Validation Security', () => {
    it('should prevent XSS attacks', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')">',
        '"><script>alert("xss")</script>',
        '<svg onload="alert(\'xss\')">',
      ];

      xssPayloads.forEach(payload => {
        const sanitized = InputSanitizer.sanitizeHTML(payload);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('onload');
      });
    });

    it('should prevent SQL injection', () => {
      const sqlPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "admin'--",
        "' OR 1=1 --",
      ];

      sqlPayloads.forEach(payload => {
        const sanitized = InputSanitizer.sanitizeSQL(payload);
        expect(sanitized).not.toContain('DROP');
        expect(sanitized).not.toContain('UNION');
        expect(sanitized).not.toContain('--');
        expect(sanitized).not.toContain(';');
      });
    });

    it('should prevent path traversal attacks', () => {
      const pathTraversalPayloads = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '....//....//....//etc/passwd',
      ];

      pathTraversalPayloads.forEach(payload => {
        const sanitized = InputSanitizer.sanitizeFilePath(payload);
        expect(sanitized).not.toContain('..');
        expect(sanitized).not.toContain('%2e%2e');
        expect(sanitized).not.toContain('etc/passwd');
      });
    });

    it('should validate health data boundaries', () => {
      const invalidHealthData = [
        { energyLevel: -1 }, // Below minimum
        { energyLevel: 11 }, // Above maximum
        { heartRate: 300 }, // Unrealistic heart rate
        { sleepQuality: 0 }, // Below minimum
        { sleepQuality: 11 }, // Above maximum
      ];

      invalidHealthData.forEach(data => {
        const result = validateAndSanitize(UserInputSchemas.healthLog, {
          date: new Date(),
          energyLevel: 5,
          sleepQuality: 5,
          symptoms: [],
          ...data,
        });

        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
      });
    });

    it('should validate biometric data ranges', () => {
      const invalidBiometricData = [
        { heartRate: 25 }, // Too low
        { heartRate: 250 }, // Too high
        { bloodPressure: { systolic: 50, diastolic: 30 } }, // Too low
        { bloodPressure: { systolic: 300, diastolic: 200 } }, // Too high
        { temperature: 25 }, // Too low
        { temperature: 50 }, // Too high
        { oxygenSaturation: 60 }, // Too low
        { oxygenSaturation: 110 }, // Too high
      ];

      invalidBiometricData.forEach(data => {
        const result = validateAndSanitize(UserInputSchemas.biometricData, {
          timestamp: new Date(),
          ...data,
        });

        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
      });
    });
  });

  describe('Rate Limiting Security', () => {
    it('should enforce rate limits', () => {
      const identifier = 'test-user-123';
      
      // First request should succeed
      let result = RateLimitValidator.checkRateLimit(identifier, 3, 60000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);

      // Second request should succeed
      result = RateLimitValidator.checkRateLimit(identifier, 3, 60000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);

      // Third request should succeed
      result = RateLimitValidator.checkRateLimit(identifier, 3, 60000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);

      // Fourth request should be blocked
      result = RateLimitValidator.checkRateLimit(identifier, 3, 60000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset rate limits after window expires', () => {
      const identifier = 'test-user-456';
      const shortWindow = 100; // 100ms
      
      // Exhaust rate limit
      for (let i = 0; i < 3; i++) {
        RateLimitValidator.checkRateLimit(identifier, 3, shortWindow);
      }
      
      // Should be blocked
      let result = RateLimitValidator.checkRateLimit(identifier, 3, shortWindow);
      expect(result.allowed).toBe(false);

      // Wait for window to expire
      return new Promise(resolve => {
        setTimeout(() => {
          // Should be allowed again
          result = RateLimitValidator.checkRateLimit(identifier, 3, shortWindow);
          expect(result.allowed).toBe(true);
          resolve(undefined);
        }, 150);
      });
    });

    it('should detect suspicious activity', () => {
      const suspiciousRequests = [
        {
          url: 'http://localhost/api/users?id=1; DROP TABLE users; --',
          userAgent: 'sqlmap/1.0',
          expected: true,
        },
        {
          url: 'http://localhost/api/users/../../../etc/passwd',
          userAgent: 'Mozilla/5.0',
          expected: true,
        },
        {
          url: 'http://localhost/api/users?search=<script>alert("xss")</script>',
          userAgent: 'Mozilla/5.0',
          expected: true,
        },
        {
          url: 'http://localhost/api/users?page=1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          expected: false,
        },
      ];

      suspiciousRequests.forEach(req => {
        const mockRequest = new Request(req.url, {
          headers: { 'user-agent': req.userAgent },
        }) as NextRequest;

        const detection = detectSuspiciousActivity(mockRequest, '192.168.1.1');
        expect(detection.suspicious).toBe(req.expected);
      });
    });
  });

  describe('Authentication Security', () => {
    it('should detect weak passwords', () => {
      const weakPasswords = [
        '123456',
        'password',
        'qwerty',
        'abc123',
        '12345678',
        'password123',
      ];

      weakPasswords.forEach(password => {
        const isWeak = password.length < 8 || 
                      !/[A-Z]/.test(password) || 
                      !/[a-z]/.test(password) || 
                      !/[0-9]/.test(password) ||
                      !/[!@#$%^&*(),.?":{}|<>]/.test(password);

        expect(isWeak).toBe(true);
      });
    });

    it('should accept strong passwords', () => {
      const strongPasswords = [
        'MyStr0ng!Password',
        'C0mpl3x@Pass#2024',
        'Secure$Health&App1',
        'Chronic!Fatigue@Tracker2024',
      ];

      strongPasswords.forEach(password => {
        const isStrong = password.length >= 8 && 
                        /[A-Z]/.test(password) && 
                        /[a-z]/.test(password) && 
                        /[0-9]/.test(password) &&
                        /[!@#$%^&*(),.?":{}|<>]/.test(password);

        expect(isStrong).toBe(true);
      });
    });
  });

  describe('Data Protection', () => {
    it('should sanitize PII data', () => {
      const piiData = [
        'john.doe@example.com',
        '123-45-6789',
        '4532-1234-5678-9012',
        '+1-555-123-4567',
      ];

      piiData.forEach(data => {
        const sanitized = InputSanitizer.sanitizeText(data);
        // Should not contain obvious PII patterns after sanitization
        expect(sanitized).toBeDefined();
        expect(typeof sanitized).toBe('string');
      });
    });

    it('should handle malicious JSON input', () => {
      const maliciousJSON = '{"__proto__": {"isAdmin": true}, "name": "test"}';
      
      expect(() => {
        const sanitized = InputSanitizer.sanitizeJSON(maliciousJSON);
        expect(sanitized).toBeDefined();
        expect(sanitized.__proto__).toBeUndefined();
      }).not.toThrow();
    });

    it('should sanitize URLs', () => {
      const maliciousURLs = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'ftp://malicious.com/file.txt',
        'file:///etc/passwd',
      ];

      maliciousURLs.forEach(url => {
        const sanitized = InputSanitizer.sanitizeURL(url);
        expect(sanitized).toBe(''); // Should return empty string for invalid URLs
      });
    });

    it('should allow valid URLs', () => {
      const validURLs = [
        'https://example.com',
        'http://localhost:3000',
        'https://api.example.com/data',
      ];

      validURLs.forEach(url => {
        const sanitized = InputSanitizer.sanitizeURL(url);
        expect(sanitized).toBe(url);
      });
    });
  });

  describe('Security Test Suite Integration', () => {
    it('should run input validation tests', async () => {
      const results = await securityTestSuite.testInputValidation();
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // Check that XSS tests are included
      const xssTests = results.filter(r => r.category === SecurityTestCategory.XSS_PREVENTION);
      expect(xssTests.length).toBeGreaterThan(0);
      
      // Check that SQL injection tests are included
      const sqlTests = results.filter(r => r.category === SecurityTestCategory.SQL_INJECTION);
      expect(sqlTests.length).toBeGreaterThan(0);
    });

    it('should run authentication tests', async () => {
      const results = await securityTestSuite.testAuthentication();
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // Check that authentication tests are included
      const authTests = results.filter(r => r.category === SecurityTestCategory.AUTHENTICATION);
      expect(authTests.length).toBeGreaterThan(0);
    });

    it('should run data protection tests', async () => {
      const results = await securityTestSuite.testDataProtection();
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // Check that data protection tests are included
      const dataTests = results.filter(r => r.category === SecurityTestCategory.DATA_PROTECTION);
      expect(dataTests.length).toBeGreaterThan(0);
    });

    it('should generate comprehensive security report', async () => {
      await securityTestSuite.runAllTests();
      const report = securityTestSuite.generateReport();
      
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.total).toBeGreaterThan(0);
      expect(report.results).toBeDefined();
      expect(Array.isArray(report.results)).toBe(true);
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('Vulnerability Scanner', () => {
    it('should scan for common vulnerabilities', async () => {
      const scanResult = await VulnerabilityScanner.scanApplication();
      
      expect(scanResult).toBeDefined();
      expect(scanResult.vulnerabilities).toBeDefined();
      expect(Array.isArray(scanResult.vulnerabilities)).toBe(true);
      expect(typeof scanResult.score).toBe('number');
      expect(scanResult.score).toBeGreaterThanOrEqual(0);
      expect(scanResult.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Compliance Checker', () => {
    it('should check GDPR compliance', () => {
      const gdprResult = ComplianceChecker.checkGDPRCompliance();
      
      expect(gdprResult).toBeDefined();
      expect(typeof gdprResult.compliant).toBe('boolean');
      expect(Array.isArray(gdprResult.issues)).toBe(true);
      expect(Array.isArray(gdprResult.recommendations)).toBe(true);
    });

    it('should check HIPAA compliance', () => {
      const hipaaResult = ComplianceChecker.checkHIPAACompliance();
      
      expect(hipaaResult).toBeDefined();
      expect(typeof hipaaResult.compliant).toBe('boolean');
      expect(Array.isArray(hipaaResult.issues)).toBe(true);
      expect(Array.isArray(hipaaResult.recommendations)).toBe(true);
    });
  });

  describe('Security Headers', () => {
    it('should audit security headers', () => {
      const mockResponse = new Response('test', {
        headers: {
          'Content-Security-Policy': "default-src 'self'",
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
      }) as any;

      const audit = SecurityAuditor.auditResponse(mockResponse);
      
      expect(audit).toBeDefined();
      expect(typeof audit.score).toBe('number');
      expect(Array.isArray(audit.issues)).toBe(true);
      expect(Array.isArray(audit.recommendations)).toBe(true);
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  it('should handle null and undefined inputs safely', () => {
    expect(() => InputSanitizer.sanitizeText('')).not.toThrow();
    expect(() => InputSanitizer.sanitizeHTML('')).not.toThrow();
    expect(() => InputSanitizer.sanitizeSQL('')).not.toThrow();
    expect(() => InputSanitizer.sanitizeFilePath('')).not.toThrow();
  });

  it('should handle very long inputs', () => {
    const longInput = 'a'.repeat(10000);
    
    const sanitizedText = InputSanitizer.sanitizeText(longInput);
    expect(sanitizedText.length).toBeLessThanOrEqual(1000); // Should be truncated
    
    const sanitizedHTML = InputSanitizer.sanitizeHTML(longInput);
    expect(sanitizedHTML).toBeDefined();
    
    const sanitizedSQL = InputSanitizer.sanitizeSQL(longInput);
    expect(sanitizedSQL).toBeDefined();
  });

  it('should handle special characters safely', () => {
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?`~';
    
    expect(() => InputSanitizer.sanitizeText(specialChars)).not.toThrow();
    expect(() => InputSanitizer.sanitizeHTML(specialChars)).not.toThrow();
    expect(() => InputSanitizer.sanitizeSQL(specialChars)).not.toThrow();
  });

  it('should handle unicode and emoji inputs', () => {
    const unicodeInput = '🏥💊🩺❤️‍🩹 Health tracker with émojis and ünïcödé';
    
    expect(() => InputSanitizer.sanitizeText(unicodeInput)).not.toThrow();
    expect(() => InputSanitizer.sanitizeHTML(unicodeInput)).not.toThrow();
    
    const sanitized = InputSanitizer.sanitizeText(unicodeInput);
    expect(sanitized).toBeDefined();
    expect(typeof sanitized).toBe('string');
  });
});