'use client';

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface SecurityTestResult {
  category: string;
  testName: string;
  passed: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation?: string;
}

interface SecurityReport {
  securityTests: {
    total: number;
    passed: number;
    failed: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    tests: SecurityTestResult[];
  };
  vulnerabilityScans: {
    vulnerabilities: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      recommendation: string;
    }>;
    score: number;
  };
  compliance: {
    gdpr: {
      compliant: boolean;
      issues: string[];
      recommendations: string[];
    };
    hipaa: {
      compliant: boolean;
      issues: string[];
      recommendations: string[];
    };
  };
}

export function SecurityDashboard() {
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const runSecurityTests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/security/test?type=all');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setReport(data.results);
      } else {
        throw new Error(data.message || 'Failed to run security tests');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Run security tests on component mount (only in development)
    if (process.env.NODE_ENV === 'development') {
      runSecurityTests();
    }
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getOverallSecurityScore = () => {
    if (!report) return 0;
    
    const testScore = report.securityTests.total > 0 
      ? (report.securityTests.passed / report.securityTests.total) * 100 
      : 0;
    
    const vulnerabilityScore = report.vulnerabilityScans.score || 0;
    
    const complianceScore = (
      (report.compliance.gdpr.compliant ? 50 : 0) +
      (report.compliance.hipaa.compliant ? 50 : 0)
    );
    
    return Math.round((testScore + vulnerabilityScore + complianceScore) / 3);
  };

  const filteredTests = report?.securityTests.tests.filter(test => 
    selectedCategory === 'all' || test.category.includes(selectedCategory)
  ) || [];

  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">Security Dashboard</span>
        </div>
        <p className="mt-2 text-sm text-yellow-700">
          Security dashboard is only available in development mode for security reasons.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
            <p className="text-sm text-gray-600">Monitor application security status and compliance</p>
          </div>
        </div>
        
        <button
          onClick={runSecurityTests}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Running Tests...' : 'Run Security Tests'}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Error</span>
          </div>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Running comprehensive security tests...</p>
        </div>
      )}

      {/* Security Report */}
      {report && !loading && (
        <>
          {/* Overall Security Score */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-1 md:col-span-2 p-6 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Overall Security Score</h3>
                  <p className="text-sm text-gray-600">Comprehensive security assessment</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">{getOverallSecurityScore()}%</div>
                  <div className="text-sm text-gray-500">Security Rating</div>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{report.securityTests.passed}</div>
                  <div className="text-sm text-gray-600">Tests Passed</div>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{report.securityTests.failed}</div>
                  <div className="text-sm text-gray-600">Tests Failed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Test Categories */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Test Results</h3>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['all', 'input_validation', 'authentication', 'data_protection', 'xss_prevention', 'sql_injection'].map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 text-sm rounded-full border ${
                    selectedCategory === category
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>

            {/* Test Results */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredTests.map((test, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${
                    test.passed ? 'bg-green-50 border-green-200' : getSeverityColor(test.severity)
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {test.passed ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">{test.testName}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(test.severity)}`}>
                          {test.severity}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{test.description}</p>
                      {test.recommendation && !test.passed && (
                        <p className="mt-2 text-sm text-blue-600">
                          <strong>Recommendation:</strong> {test.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">GDPR Compliance</h3>
              <div className="flex items-center gap-2 mb-3">
                {report.compliance.gdpr.compliant ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  report.compliance.gdpr.compliant ? 'text-green-800' : 'text-red-800'
                }`}>
                  {report.compliance.gdpr.compliant ? 'Compliant' : 'Non-Compliant'}
                </span>
              </div>
              
              {report.compliance.gdpr.issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Issues:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {report.compliance.gdpr.issues.map((issue, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">HIPAA Compliance</h3>
              <div className="flex items-center gap-2 mb-3">
                {report.compliance.hipaa.compliant ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  report.compliance.hipaa.compliant ? 'text-green-800' : 'text-red-800'
                }`}>
                  {report.compliance.hipaa.compliant ? 'Compliant' : 'Non-Compliant'}
                </span>
              </div>
              
              {report.compliance.hipaa.issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Issues:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {report.compliance.hipaa.issues.map((issue, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Vulnerability Scan Results */}
          {report.vulnerabilityScans.vulnerabilities.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vulnerability Scan Results</h3>
              <div className="space-y-3">
                {report.vulnerabilityScans.vulnerabilities.map((vuln, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg ${getSeverityColor(vuln.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">{vuln.type}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(vuln.severity)}`}>
                            {vuln.severity}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{vuln.description}</p>
                        <p className="mt-2 text-sm text-blue-600">
                          <strong>Recommendation:</strong> {vuln.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SecurityDashboard;