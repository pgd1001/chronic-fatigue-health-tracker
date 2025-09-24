/**
 * Comprehensive Test Runner for Chronic Fatigue Health Tracker
 * Orchestrates all testing phases and generates comprehensive reports
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage?: number;
  errors: string[];
}

interface TestReport {
  timestamp: string;
  environment: string;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  overallDuration: number;
  overallCoverage: number;
  suites: TestResult[];
  summary: {
    unitTests: TestResult;
    integrationTests: TestResult;
    e2eTests: TestResult;
    securityTests: TestResult;
    performanceTests: TestResult;
    accessibilityTests: TestResult;
  };
  recommendations: string[];
  healthScore: number;
}

class TestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  async runAllTests(): Promise<TestReport> {
    console.log('🚀 Starting Comprehensive Test Suite for Chronic Fatigue Health Tracker');
    this.startTime = Date.now();

    try {
      // Phase 1: Unit Tests
      console.log('\n📋 Phase 1: Running Unit Tests...');
      const unitResults = await this.runUnitTests();
      this.results.push(unitResults);

      // Phase 2: Integration Tests
      console.log('\n🔗 Phase 2: Running Integration Tests...');
      const integrationResults = await this.runIntegrationTests();
      this.results.push(integrationResults);

      // Phase 3: End-to-End Tests
      console.log('\n🌐 Phase 3: Running End-to-End Tests...');
      const e2eResults = await this.runE2ETests();
      this.results.push(e2eResults);

      // Phase 4: Security Tests
      console.log('\n🔒 Phase 4: Running Security Tests...');
      const securityResults = await this.runSecurityTests();
      this.results.push(securityResults);

      // Phase 5: Performance Tests
      console.log('\n⚡ Phase 5: Running Performance Tests...');
      const performanceResults = await this.runPerformanceTests();
      this.results.push(performanceResults);

      // Phase 6: Accessibility Tests
      console.log('\n♿ Phase 6: Running Accessibility Tests...');
      const accessibilityResults = await this.runAccessibilityTests();
      this.results.push(accessibilityResults);

      // Generate comprehensive report
      const report = await this.generateReport();
      
      // Save report
      await this.saveReport(report);
      
      // Display summary
      this.displaySummary(report);

      return report;

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }

  private async runUnitTests(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Run unit tests with coverage
      const output = execSync('npm run test:unit -- --coverage --reporter=json', {
        encoding: 'utf-8',
        cwd: process.cwd(),
      });

      const result = this.parseTestOutput(output);
      
      return {
        suite: 'Unit Tests',
        passed: result.passed,
        failed: result.failed,
        skipped: result.skipped,
        duration: Date.now() - startTime,
        coverage: result.coverage,
        errors: result.errors,
      };
    } catch (error) {
      return {
        suite: 'Unit Tests',
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async runIntegrationTests(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const output = execSync('npm run test:integration -- --reporter=json', {
        encoding: 'utf-8',
        cwd: process.cwd(),
      });

      const result = this.parseTestOutput(output);
      
      return {
        suite: 'Integration Tests',
        passed: result.passed,
        failed: result.failed,
        skipped: result.skipped,
        duration: Date.now() - startTime,
        errors: result.errors,
      };
    } catch (error) {
      return {
        suite: 'Integration Tests',
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async runE2ETests(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const output = execSync('npm run test:e2e -- --reporter=json', {
        encoding: 'utf-8',
        cwd: process.cwd(),
      });

      const result = this.parseTestOutput(output);
      
      return {
        suite: 'End-to-End Tests',
        passed: result.passed,
        failed: result.failed,
        skipped: result.skipped,
        duration: Date.now() - startTime,
        errors: result.errors,
      };
    } catch (error) {
      return {
        suite: 'End-to-End Tests',
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async runSecurityTests(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const output = execSync('npm run test:security -- --reporter=json', {
        encoding: 'utf-8',
        cwd: process.cwd(),
      });

      const result = this.parseTestOutput(output);
      
      return {
        suite: 'Security Tests',
        passed: result.passed,
        failed: result.failed,
        skipped: result.skipped,
        duration: Date.now() - startTime,
        errors: result.errors,
      };
    } catch (error) {
      return {
        suite: 'Security Tests',
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async runPerformanceTests(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const output = execSync('npm run test:performance -- --reporter=json', {
        encoding: 'utf-8',
        cwd: process.cwd(),
      });

      const result = this.parseTestOutput(output);
      
      return {
        suite: 'Performance Tests',
        passed: result.passed,
        failed: result.failed,
        skipped: result.skipped,
        duration: Date.now() - startTime,
        errors: result.errors,
      };
    } catch (error) {
      return {
        suite: 'Performance Tests',
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async runAccessibilityTests(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const output = execSync('npm run test:accessibility -- --reporter=json', {
        encoding: 'utf-8',
        cwd: process.cwd(),
      });

      const result = this.parseTestOutput(output);
      
      return {
        suite: 'Accessibility Tests',
        passed: result.passed,
        failed: result.failed,
        skipped: result.skipped,
        duration: Date.now() - startTime,
        errors: result.errors,
      };
    } catch (error) {
      return {
        suite: 'Accessibility Tests',
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private parseTestOutput(output: string): any {
    try {
      // Parse JSON output from test runners
      const lines = output.split('\n').filter(line => line.trim());
      const jsonLine = lines.find(line => line.startsWith('{'));
      
      if (jsonLine) {
        const result = JSON.parse(jsonLine);
        return {
          passed: result.numPassedTests || 0,
          failed: result.numFailedTests || 0,
          skipped: result.numPendingTests || 0,
          coverage: result.coverageMap ? this.calculateCoverage(result.coverageMap) : undefined,
          errors: result.testResults?.map((test: any) => 
            test.failureMessages || []
          ).flat() || [],
        };
      }
    } catch (error) {
      console.warn('Failed to parse test output:', error);
    }

    // Fallback parsing
    return {
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: ['Failed to parse test output'],
    };
  }

  private calculateCoverage(coverageMap: any): number {
    if (!coverageMap) return 0;
    
    let totalStatements = 0;
    let coveredStatements = 0;

    Object.values(coverageMap).forEach((file: any) => {
      if (file.s) {
        Object.values(file.s).forEach((count: any) => {
          totalStatements++;
          if (count > 0) coveredStatements++;
        });
      }
    });

    return totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0;
  }

  private async generateReport(): Promise<TestReport> {
    const totalDuration = Date.now() - this.startTime;
    
    const totalTests = this.results.reduce((sum, result) => 
      sum + result.passed + result.failed + result.skipped, 0);
    const totalPassed = this.results.reduce((sum, result) => sum + result.passed, 0);
    const totalFailed = this.results.reduce((sum, result) => sum + result.failed, 0);
    const totalSkipped = this.results.reduce((sum, result) => sum + result.skipped, 0);
    
    const coverageResults = this.results.filter(r => r.coverage !== undefined);
    const overallCoverage = coverageResults.length > 0 
      ? coverageResults.reduce((sum, r) => sum + (r.coverage || 0), 0) / coverageResults.length
      : 0;

    const healthScore = this.calculateHealthScore(totalPassed, totalFailed, overallCoverage);
    const recommendations = this.generateRecommendations();

    return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'test',
      totalTests,
      totalPassed,
      totalFailed,
      totalSkipped,
      overallDuration: totalDuration,
      overallCoverage,
      suites: this.results,
      summary: {
        unitTests: this.results.find(r => r.suite === 'Unit Tests') || this.createEmptyResult('Unit Tests'),
        integrationTests: this.results.find(r => r.suite === 'Integration Tests') || this.createEmptyResult('Integration Tests'),
        e2eTests: this.results.find(r => r.suite === 'End-to-End Tests') || this.createEmptyResult('End-to-End Tests'),
        securityTests: this.results.find(r => r.suite === 'Security Tests') || this.createEmptyResult('Security Tests'),
        performanceTests: this.results.find(r => r.suite === 'Performance Tests') || this.createEmptyResult('Performance Tests'),
        accessibilityTests: this.results.find(r => r.suite === 'Accessibility Tests') || this.createEmptyResult('Accessibility Tests'),
      },
      recommendations,
      healthScore,
    };
  }

  private createEmptyResult(suite: string): TestResult {
    return {
      suite,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      errors: [],
    };
  }

  private calculateHealthScore(passed: number, failed: number, coverage: number): number {
    const total = passed + failed;
    if (total === 0) return 0;
    
    const passRate = (passed / total) * 100;
    const coverageWeight = 0.3;
    const passRateWeight = 0.7;
    
    return Math.round((passRate * passRateWeight) + (coverage * coverageWeight));
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Analyze results and generate recommendations
    const failedSuites = this.results.filter(r => r.failed > 0);
    const lowCoverageSuites = this.results.filter(r => r.coverage && r.coverage < 80);
    
    if (failedSuites.length > 0) {
      recommendations.push(`Address failing tests in: ${failedSuites.map(s => s.suite).join(', ')}`);
    }
    
    if (lowCoverageSuites.length > 0) {
      recommendations.push(`Improve test coverage for: ${lowCoverageSuites.map(s => s.suite).join(', ')}`);
    }
    
    const slowSuites = this.results.filter(r => r.duration > 30000); // > 30 seconds
    if (slowSuites.length > 0) {
      recommendations.push(`Optimize performance for slow test suites: ${slowSuites.map(s => s.suite).join(', ')}`);
    }
    
    // Chronic illness specific recommendations
    const performanceResult = this.results.find(r => r.suite === 'Performance Tests');
    if (performanceResult && performanceResult.failed > 0) {
      recommendations.push('Performance issues detected - critical for chronic illness users who need responsive interfaces');
    }
    
    const accessibilityResult = this.results.find(r => r.suite === 'Accessibility Tests');
    if (accessibilityResult && accessibilityResult.failed > 0) {
      recommendations.push('Accessibility issues detected - essential for users with chronic fatigue and cognitive symptoms');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All tests passing! Consider adding more edge case tests and monitoring for regressions.');
    }
    
    return recommendations;
  }

  private async saveReport(report: TestReport): Promise<void> {
    const reportsDir = path.join(process.cwd(), 'test-reports');
    
    try {
      await fs.mkdir(reportsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportsDir, `test-report-${timestamp}.json`);
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Also save as latest report
    const latestPath = path.join(reportsDir, 'latest-report.json');
    await fs.writeFile(latestPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📊 Test report saved to: ${reportPath}`);
  }

  private displaySummary(report: TestReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('🏥 CHRONIC FATIGUE HEALTH TRACKER - TEST SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`\n📊 Overall Results:`);
    console.log(`   Total Tests: ${report.totalTests}`);
    console.log(`   ✅ Passed: ${report.totalPassed}`);
    console.log(`   ❌ Failed: ${report.totalFailed}`);
    console.log(`   ⏭️  Skipped: ${report.totalSkipped}`);
    console.log(`   📈 Coverage: ${report.overallCoverage.toFixed(1)}%`);
    console.log(`   ⏱️  Duration: ${(report.overallDuration / 1000).toFixed(1)}s`);
    console.log(`   🏥 Health Score: ${report.healthScore}/100`);
    
    console.log(`\n📋 Test Suite Breakdown:`);
    report.suites.forEach(suite => {
      const status = suite.failed === 0 ? '✅' : '❌';
      const coverage = suite.coverage ? ` (${suite.coverage.toFixed(1)}% coverage)` : '';
      console.log(`   ${status} ${suite.suite}: ${suite.passed}/${suite.passed + suite.failed} passed${coverage}`);
    });
    
    if (report.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      report.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }
    
    // Health score interpretation
    console.log(`\n🏥 Health Score Interpretation:`);
    if (report.healthScore >= 90) {
      console.log('   🟢 Excellent - Application is ready for chronic illness users');
    } else if (report.healthScore >= 80) {
      console.log('   🟡 Good - Minor improvements needed for optimal user experience');
    } else if (report.healthScore >= 70) {
      console.log('   🟠 Fair - Several issues need attention before deployment');
    } else {
      console.log('   🔴 Poor - Critical issues must be resolved before release');
    }
    
    console.log('\n' + '='.repeat(80));
    
    if (report.totalFailed > 0) {
      console.log('❌ Some tests failed. Please review and fix before deployment.');
      process.exit(1);
    } else {
      console.log('✅ All tests passed! Application is ready for chronic illness users.');
    }
  }
}

// CLI interface
if (require.main === module) {
  const runner = new TestRunner();
  
  runner.runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { TestRunner, TestReport, TestResult };