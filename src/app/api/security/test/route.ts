/**
 * Security testing API endpoint
 * Demonstrates secure API implementation with comprehensive security measures
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAndSanitize, UserInputSchemas } from '@/lib/security/input-validation';
import { withRateLimit } from '@/lib/security/rate-limiting';
import { withSecurityHeaders, withCORS } from '@/lib/security/security-headers';
import { runSecurityTests, VulnerabilityScanner, ComplianceChecker } from '@/lib/security/security-testing';

// Security test endpoint with comprehensive protection
async function securityTestHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'all';

    // Validate test type parameter
    const validTestTypes = ['all', 'input', 'auth', 'data', 'headers', 'vulnerability', 'compliance'];
    if (!validTestTypes.includes(testType)) {
      return NextResponse.json(
        {
          error: 'Invalid test type',
          message: 'Test type must be one of: ' + validTestTypes.join(', '),
          validTypes: validTestTypes,
        },
        { status: 400 }
      );
    }

    let results: any = {};

    switch (testType) {
      case 'all':
        // Run comprehensive security tests
        const securityTests = await runSecurityTests();
        const vulnerabilityScans = await VulnerabilityScanner.scanApplication();
        const gdprCompliance = ComplianceChecker.checkGDPRCompliance();
        const hipaaCompliance = ComplianceChecker.checkHIPAACompliance();

        results = {
          securityTests: {
            total: securityTests.length,
            passed: securityTests.filter(t => t.passed).length,
            failed: securityTests.filter(t => !t.passed).length,
            critical: securityTests.filter(t => t.severity === 'critical').length,
            high: securityTests.filter(t => t.severity === 'high').length,
            medium: securityTests.filter(t => t.severity === 'medium').length,
            low: securityTests.filter(t => t.severity === 'low').length,
            tests: securityTests,
          },
          vulnerabilityScans,
          compliance: {
            gdpr: gdprCompliance,
            hipaa: hipaaCompliance,
          },
        };
        break;

      case 'vulnerability':
        results = await VulnerabilityScanner.scanApplication();
        break;

      case 'compliance':
        results = {
          gdpr: ComplianceChecker.checkGDPRCompliance(),
          hipaa: ComplianceChecker.checkHIPAACompliance(),
        };
        break;

      default:
        // Run specific test category
        const allTests = await runSecurityTests();
        results = {
          tests: allTests.filter(t => t.category.includes(testType)),
          summary: {
            total: allTests.filter(t => t.category.includes(testType)).length,
            passed: allTests.filter(t => t.category.includes(testType) && t.passed).length,
          },
        };
    }

    return NextResponse.json({
      success: true,
      testType,
      timestamp: new Date().toISOString(),
      results,
    });

  } catch (error) {
    console.error('Security test endpoint error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to run security tests',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Input validation test endpoint
async function inputValidationTestHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Test various input validation scenarios
    const testResults = [];

    // Test health log validation
    if (body.healthLog) {
      const healthLogResult = validateAndSanitize(UserInputSchemas.healthLog, body.healthLog);
      testResults.push({
        type: 'healthLog',
        input: body.healthLog,
        result: healthLogResult,
      });
    }

    // Test biometric data validation
    if (body.biometricData) {
      const biometricResult = validateAndSanitize(UserInputSchemas.biometricData, body.biometricData);
      testResults.push({
        type: 'biometricData',
        input: body.biometricData,
        result: biometricResult,
      });
    }

    // Test user profile validation
    if (body.userProfile) {
      const userProfileResult = validateAndSanitize(UserInputSchemas.userProfile, body.userProfile);
      testResults.push({
        type: 'userProfile',
        input: body.userProfile,
        result: userProfileResult,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Input validation tests completed',
      results: testResults,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Input validation test error:', error);
    
    return NextResponse.json(
      {
        error: 'Invalid request',
        message: 'Failed to parse request body or run validation tests',
      },
      { status: 400 }
    );
  }
}

// Apply security middleware
const secureHandler = withRateLimit(
  { requests: 10, window: 60 * 60 * 1000 }, // 10 requests per hour
  {
    onLimitReached: () => NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many security test requests. Please try again later.',
      },
      { status: 429 }
    ),
  }
)(
  withCORS()(
    withSecurityHeaders({
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive',
    })(securityTestHandler)
  )
);

const secureInputHandler = withRateLimit(
  { requests: 50, window: 60 * 60 * 1000 }, // 50 requests per hour
)(
  withCORS()(
    withSecurityHeaders({
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    })(inputValidationTestHandler)
  )
);

// Export HTTP methods
export async function GET(request: NextRequest): Promise<NextResponse> {
  return await secureHandler(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { pathname } = new URL(request.url);
  
  if (pathname.includes('/input-validation')) {
    return await secureInputHandler(request);
  }
  
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'POST method only available for input validation tests',
    },
    { status: 405 }
  );
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}