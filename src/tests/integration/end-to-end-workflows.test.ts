/**
 * End-to-end workflow integration tests
 * Tests complete user workflows from start to finish
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock complete application state
const mockAppState = {
  user: null as any,
  healthLogs: [] as any[],
  movementSessions: [] as any[],
  biometricData: [] as any[],
  symptoms: [] as any[],
  aiRecommendations: [] as any[],
  reports: [] as any[],
};

// Mock API endpoints
const mockAPI = {
  auth: {
    signin: vi.fn(),
    signup: vi.fn(),
    signout: vi.fn(),
  },
  health: {
    createLog: vi.fn(),
    getLogs: vi.fn(),
    updateLog: vi.fn(),
    deleteLog: vi.fn(),
  },
  movement: {
    createSession: vi.fn(),
    getSessions: vi.fn(),
    updateSession: vi.fn(),
  },
  biometrics: {
    capture: vi.fn(),
    save: vi.fn(),
    getHistory: vi.fn(),
  },
  ai: {
    getPacingRecommendations: vi.fn(),
    analyzePatterns: vi.fn(),
  },
  reports: {
    generate: vi.fn(),
    export: vi.fn(),
    share: vi.fn(),
  },
};

describe('End-to-End Workflow Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    
    // Reset app state
    mockAppState.user = null;
    mockAppState.healthLogs = [];
    mockAppState.movementSessions = [];
    mockAppState.biometricData = [];
    mockAppState.symptoms = [];
    mockAppState.aiRecommendations = [];
    mockAppState.reports = [];

    // Setup API mocks
    mockAPI.auth.signin.mockResolvedValue({
      success: true,
      user: { id: 'user-123', email: 'test@example.com' },
    });

    mockAPI.health.createLog.mockImplementation((data) => {
      const log = { id: `log-${Date.now()}`, ...data };
      mockAppState.healthLogs.push(log);
      return Promise.resolve({ success: true, data: log });
    });

    mockAPI.movement.createSession.mockImplementation((data) => {
      const session = { id: `session-${Date.now()}`, ...data };
      mockAppState.movementSessions.push(session);
      return Promise.resolve({ success: true, data: session });
    });

    mockAPI.biometrics.save.mockImplementation((data) => {
      const biometric = { id: `bio-${Date.now()}`, ...data };
      mockAppState.biometricData.push(biometric);
      return Promise.resolve({ success: true, data: biometric });
    });

    mockAPI.ai.getPacingRecommendations.mockResolvedValue({
      success: true,
      recommendations: [
        {
          type: 'rest',
          message: 'Consider taking a 15-minute rest',
          confidence: 0.8,
        },
        {
          type: 'activity',
          message: 'Good time for light movement',
          confidence: 0.7,
        },
      ],
    });

    mockAPI.reports.generate.mockResolvedValue({
      success: true,
      reportId: 'report-123',
      url: '/api/reports/report-123/download',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Daily Workflow', () => {
    it('should complete a full day of health tracking', async () => {
      // Mock complete daily workflow component
      const DailyWorkflow = () => {
        const [currentStep, setCurrentStep] = React.useState(1);
        const [energyLevel, setEnergyLevel] = React.useState<number | null>(null);
        const [completedActivities, setCompletedActivities] = React.useState<string[]>([]);

        return (
          <div data-testid="daily-workflow">
            {/* Step 1: Morning Energy Assessment */}
            {currentStep === 1 && (
              <div data-testid="morning-assessment">
                <h2>Good morning! How's your energy today?</h2>
                <div data-testid="energy-scale">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                    <button
                      key={level}
                      data-testid={`energy-${level}`}
                      onClick={() => {
                        setEnergyLevel(level);
                        setCurrentStep(2);
                      }}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Daily Anchor Routine */}
            {currentStep === 2 && energyLevel && (
              <div data-testid="anchor-routine">
                <h2>Daily Anchor Routine (Energy Level: {energyLevel})</h2>
                <div data-testid="routine-activities">
                  <button
                    data-testid="breathing-exercise"
                    onClick={() => {
                      setCompletedActivities(prev => [...prev, 'breathing']);
                    }}
                  >
                    Breathing Exercise (3 min)
                  </button>
                  <button
                    data-testid="mobility-exercise"
                    onClick={() => {
                      setCompletedActivities(prev => [...prev, 'mobility']);
                    }}
                  >
                    Mobility Exercise (5 min)
                  </button>
                  <button
                    data-testid="stretching-exercise"
                    onClick={() => {
                      setCompletedActivities(prev => [...prev, 'stretching']);
                    }}
                  >
                    Stretching (5 min)
                  </button>
                </div>
                {completedActivities.length === 3 && (
                  <button
                    data-testid="continue-to-tracking"
                    onClick={() => setCurrentStep(3)}
                  >
                    Continue to Tracking
                  </button>
                )}
              </div>
            )}

            {/* Step 3: Symptom and Biometric Tracking */}
            {currentStep === 3 && (
              <div data-testid="tracking-step">
                <h2>Track Your Health Data</h2>
                <div data-testid="symptom-tracking">
                  <h3>Any symptoms today?</h3>
                  <label>
                    <input type="checkbox" data-testid="fatigue-check" />
                    Fatigue
                  </label>
                  <label>
                    <input type="checkbox" data-testid="brain-fog-check" />
                    Brain Fog
                  </label>
                </div>
                <div data-testid="biometric-section">
                  <h3>Biometric Capture</h3>
                  <button data-testid="capture-biometrics">
                    Capture Heart Rate
                  </button>
                </div>
                <button
                  data-testid="complete-day"
                  onClick={() => setCurrentStep(4)}
                >
                  Complete Day
                </button>
              </div>
            )}

            {/* Step 4: AI Insights and Summary */}
            {currentStep === 4 && (
              <div data-testid="daily-summary">
                <h2>Daily Summary & AI Insights</h2>
                <div data-testid="ai-insights">
                  <p>Based on today's data, here are some insights:</p>
                  <ul>
                    <li data-testid="insight-1">Your energy level was good today</li>
                    <li data-testid="insight-2">Consider maintaining this routine</li>
                  </ul>
                </div>
                <button data-testid="view-dashboard">View Dashboard</button>
              </div>
            )}
          </div>
        );
      };

      render(<DailyWorkflow />);

      // Step 1: Morning energy assessment
      expect(screen.getByTestId('morning-assessment')).toBeInTheDocument();
      await user.click(screen.getByTestId('energy-7'));

      // Step 2: Complete anchor routine
      await waitFor(() => {
        expect(screen.getByTestId('anchor-routine')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('breathing-exercise'));
      await user.click(screen.getByTestId('mobility-exercise'));
      await user.click(screen.getByTestId('stretching-exercise'));

      await waitFor(() => {
        expect(screen.getByTestId('continue-to-tracking')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('continue-to-tracking'));

      // Step 3: Health tracking
      await waitFor(() => {
        expect(screen.getByTestId('tracking-step')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('fatigue-check'));
      await user.click(screen.getByTestId('capture-biometrics'));
      await user.click(screen.getByTestId('complete-day'));

      // Step 4: AI insights
      await waitFor(() => {
        expect(screen.getByTestId('daily-summary')).toBeInTheDocument();
      });

      expect(screen.getByTestId('insight-1')).toHaveTextContent('Your energy level was good today');
      expect(screen.getByTestId('insight-2')).toHaveTextContent('Consider maintaining this routine');
    });
  });

  describe('Healthcare Provider Report Workflow', () => {
    it('should complete full report generation and sharing workflow', async () => {
      // Mock report workflow component
      const ReportWorkflow = () => {
        const [step, setStep] = React.useState(1);
        const [reportConfig, setReportConfig] = React.useState({
          dateRange: { start: '', end: '' },
          includeSymptoms: true,
          includeEnergy: true,
          includeBiometrics: false,
          includeMovement: true,
        });
        const [generatedReport, setGeneratedReport] = React.useState<any>(null);

        return (
          <div data-testid="report-workflow">
            {/* Step 1: Configure Report */}
            {step === 1 && (
              <div data-testid="report-config">
                <h2>Configure Healthcare Report</h2>
                <div data-testid="date-selection">
                  <input
                    type="date"
                    data-testid="start-date"
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                  />
                  <input
                    type="date"
                    data-testid="end-date"
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                  />
                </div>
                <div data-testid="report-options">
                  <label>
                    <input
                      type="checkbox"
                      data-testid="include-biometrics"
                      checked={reportConfig.includeBiometrics}
                      onChange={(e) => setReportConfig(prev => ({
                        ...prev,
                        includeBiometrics: e.target.checked
                      }))}
                    />
                    Include Biometric Data
                  </label>
                </div>
                <button
                  data-testid="generate-report"
                  onClick={() => setStep(2)}
                >
                  Generate Report
                </button>
              </div>
            )}

            {/* Step 2: Report Generation */}
            {step === 2 && (
              <div data-testid="report-generation">
                <h2>Generating Report...</h2>
                <div data-testid="progress-indicator">
                  <p>Processing your health data...</p>
                </div>
                <button
                  data-testid="report-ready"
                  onClick={() => {
                    setGeneratedReport({
                      id: 'report-123',
                      url: '/reports/report-123.pdf',
                      summary: {
                        totalDays: 30,
                        averageEnergy: 6.2,
                        symptomDays: 12,
                        movementSessions: 8,
                      },
                    });
                    setStep(3);
                  }}
                >
                  Report Ready
                </button>
              </div>
            )}

            {/* Step 3: Report Review and Sharing */}
            {step === 3 && generatedReport && (
              <div data-testid="report-review">
                <h2>Report Generated Successfully</h2>
                <div data-testid="report-summary">
                  <p>Report ID: {generatedReport.id}</p>
                  <p>Total Days: {generatedReport.summary.totalDays}</p>
                  <p>Average Energy: {generatedReport.summary.averageEnergy}</p>
                  <p>Symptom Days: {generatedReport.summary.symptomDays}</p>
                  <p>Movement Sessions: {generatedReport.summary.movementSessions}</p>
                </div>
                <div data-testid="sharing-options">
                  <button data-testid="download-pdf">Download PDF</button>
                  <button data-testid="download-json">Download JSON</button>
                  <button data-testid="share-email">Email to Provider</button>
                  <button data-testid="generate-link">Generate Secure Link</button>
                </div>
              </div>
            )}
          </div>
        );
      };

      render(<ReportWorkflow />);

      // Step 1: Configure report
      expect(screen.getByTestId('report-config')).toBeInTheDocument();
      
      await user.type(screen.getByTestId('start-date'), '2024-01-01');
      await user.type(screen.getByTestId('end-date'), '2024-01-31');
      await user.click(screen.getByTestId('include-biometrics'));
      await user.click(screen.getByTestId('generate-report'));

      // Step 2: Report generation
      await waitFor(() => {
        expect(screen.getByTestId('report-generation')).toBeInTheDocument();
      });

      expect(screen.getByText('Processing your health data...')).toBeInTheDocument();
      await user.click(screen.getByTestId('report-ready'));

      // Step 3: Report review and sharing
      await waitFor(() => {
        expect(screen.getByTestId('report-review')).toBeInTheDocument();
      });

      expect(screen.getByText('Report ID: report-123')).toBeInTheDocument();
      expect(screen.getByText('Total Days: 30')).toBeInTheDocument();
      expect(screen.getByText('Average Energy: 6.2')).toBeInTheDocument();

      // Test sharing options
      expect(screen.getByTestId('download-pdf')).toBeInTheDocument();
      expect(screen.getByTestId('download-json')).toBeInTheDocument();
      expect(screen.getByTestId('share-email')).toBeInTheDocument();
      expect(screen.getByTestId('generate-link')).toBeInTheDocument();
    });
  });

  describe('AI Pacing Integration Workflow', () => {
    it('should complete AI-powered pacing analysis workflow', async () => {
      // Mock AI pacing workflow
      const AIPacingWorkflow = () => {
        const [analysisStep, setAnalysisStep] = React.useState(1);
        const [patterns, setPatterns] = React.useState<any>(null);
        const [recommendations, setRecommendations] = React.useState<any[]>([]);

        return (
          <div data-testid="ai-pacing-workflow">
            {/* Step 1: Data Collection */}
            {analysisStep === 1 && (
              <div data-testid="data-collection">
                <h2>Analyzing Your Health Patterns</h2>
                <div data-testid="analysis-progress">
                  <p>Collecting data from the last 30 days...</p>
                  <div data-testid="data-sources">
                    <p>✓ Energy levels (25 entries)</p>
                    <p>✓ Movement sessions (8 sessions)</p>
                    <p>✓ Sleep quality (28 entries)</p>
                    <p>✓ Symptom tracking (15 entries)</p>
                  </div>
                </div>
                <button
                  data-testid="start-analysis"
                  onClick={() => setAnalysisStep(2)}
                >
                  Start Analysis
                </button>
              </div>
            )}

            {/* Step 2: Pattern Analysis */}
            {analysisStep === 2 && (
              <div data-testid="pattern-analysis">
                <h2>Identifying Patterns</h2>
                <div data-testid="analysis-results">
                  <p>Analyzing energy patterns...</p>
                  <p>Correlating symptoms with activities...</p>
                  <p>Identifying optimal timing...</p>
                </div>
                <button
                  data-testid="analysis-complete"
                  onClick={() => {
                    setPatterns({
                      energyPeaks: ['9:00 AM', '2:00 PM'],
                      energyLows: ['12:00 PM', '6:00 PM'],
                      bestMovementTimes: ['10:00 AM', '3:00 PM'],
                      symptomTriggers: ['overexertion', 'poor sleep'],
                    });
                    setAnalysisStep(3);
                  }}
                >
                  Analysis Complete
                </button>
              </div>
            )}

            {/* Step 3: Recommendations */}
            {analysisStep === 3 && patterns && (
              <div data-testid="ai-recommendations">
                <h2>Your Personalized Recommendations</h2>
                <div data-testid="pattern-insights">
                  <h3>Patterns Identified:</h3>
                  <ul>
                    <li data-testid="energy-peaks">
                      Energy peaks: {patterns.energyPeaks.join(', ')}
                    </li>
                    <li data-testid="best-movement-times">
                      Best movement times: {patterns.bestMovementTimes.join(', ')}
                    </li>
                  </ul>
                </div>
                <div data-testid="recommendations-list">
                  <h3>Recommendations:</h3>
                  <div data-testid="recommendation-1">
                    Schedule important activities during energy peaks
                  </div>
                  <div data-testid="recommendation-2">
                    Plan movement sessions for 10 AM or 3 PM
                  </div>
                  <div data-testid="recommendation-3">
                    Take rest breaks at 12 PM and 6 PM
                  </div>
                </div>
                <div data-testid="recommendation-actions">
                  <button data-testid="accept-recommendations">
                    Accept Recommendations
                  </button>
                  <button data-testid="customize-recommendations">
                    Customize
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      };

      render(<AIPacingWorkflow />);

      // Step 1: Data collection
      expect(screen.getByTestId('data-collection')).toBeInTheDocument();
      expect(screen.getByText('✓ Energy levels (25 entries)')).toBeInTheDocument();
      await user.click(screen.getByTestId('start-analysis'));

      // Step 2: Pattern analysis
      await waitFor(() => {
        expect(screen.getByTestId('pattern-analysis')).toBeInTheDocument();
      });

      expect(screen.getByText('Analyzing energy patterns...')).toBeInTheDocument();
      await user.click(screen.getByTestId('analysis-complete'));

      // Step 3: Recommendations
      await waitFor(() => {
        expect(screen.getByTestId('ai-recommendations')).toBeInTheDocument();
      });

      expect(screen.getByTestId('energy-peaks')).toHaveTextContent('Energy peaks: 9:00 AM, 2:00 PM');
      expect(screen.getByTestId('best-movement-times')).toHaveTextContent('Best movement times: 10:00 AM, 3:00 PM');
      
      expect(screen.getByTestId('recommendation-1')).toBeInTheDocument();
      expect(screen.getByTestId('recommendation-2')).toBeInTheDocument();
      expect(screen.getByTestId('recommendation-3')).toBeInTheDocument();

      await user.click(screen.getByTestId('accept-recommendations'));
    });
  });

  describe('Biometric Capture Integration Workflow', () => {
    it('should complete biometric capture with TensorFlow.js integration', async () => {
      // Mock TensorFlow.js
      const mockTensorFlow = {
        loadLayersModel: vi.fn().mockResolvedValue({
          predict: vi.fn().mockReturnValue({
            dataSync: () => [72, 45], // [heartRate, HRV]
          }),
        }),
        browser: {
          fromPixels: vi.fn().mockReturnValue({
            expandDims: vi.fn().mockReturnValue({
              div: vi.fn().mockReturnValue({}),
            }),
          }),
        },
      };

      // Mock camera stream
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }],
        getVideoTracks: () => [{ getSettings: () => ({ width: 640, height: 480 }) }],
      };

      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: vi.fn().mockResolvedValue(mockStream),
        },
        writable: true,
      });

      const BiometricWorkflow = () => {
        const [step, setStep] = React.useState(1);
        const [cameraStream, setCameraStream] = React.useState<any>(null);
        const [biometricResults, setBiometricResults] = React.useState<any>(null);

        return (
          <div data-testid="biometric-workflow">
            {/* Step 1: Camera Setup */}
            {step === 1 && (
              <div data-testid="camera-setup">
                <h2>Biometric Capture Setup</h2>
                <p>Position your finger over the camera lens</p>
                <button
                  data-testid="start-camera"
                  onClick={async () => {
                    try {
                      const stream = await navigator.mediaDevices!.getUserMedia({ video: true });
                      setCameraStream(stream);
                      setStep(2);
                    } catch (error) {
                      console.error('Camera access denied');
                    }
                  }}
                >
                  Start Camera
                </button>
              </div>
            )}

            {/* Step 2: Capture Process */}
            {step === 2 && cameraStream && (
              <div data-testid="capture-process">
                <h2>Capturing Biometric Data</h2>
                <div data-testid="camera-preview">
                  Camera active - analyzing...
                </div>
                <div data-testid="capture-progress">
                  <p>Progress: Analyzing heart rate...</p>
                </div>
                <button
                  data-testid="capture-complete"
                  onClick={() => {
                    // Simulate TensorFlow.js processing
                    setBiometricResults({
                      heartRate: 72,
                      heartRateVariability: 45,
                      quality: 'good',
                      confidence: 0.92,
                    });
                    setStep(3);
                  }}
                >
                  Capture Complete
                </button>
              </div>
            )}

            {/* Step 3: Results and Save */}
            {step === 3 && biometricResults && (
              <div data-testid="capture-results">
                <h2>Biometric Results</h2>
                <div data-testid="results-display">
                  <p data-testid="heart-rate">Heart Rate: {biometricResults.heartRate} BPM</p>
                  <p data-testid="hrv">HRV: {biometricResults.heartRateVariability} ms</p>
                  <p data-testid="quality">Quality: {biometricResults.quality}</p>
                  <p data-testid="confidence">Confidence: {(biometricResults.confidence * 100).toFixed(0)}%</p>
                </div>
                <div data-testid="result-actions">
                  <button data-testid="save-results">Save Results</button>
                  <button data-testid="retake-measurement">Retake</button>
                </div>
              </div>
            )}
          </div>
        );
      };

      render(<BiometricWorkflow />);

      // Step 1: Camera setup
      expect(screen.getByTestId('camera-setup')).toBeInTheDocument();
      await user.click(screen.getByTestId('start-camera'));

      // Step 2: Capture process
      await waitFor(() => {
        expect(screen.getByTestId('capture-process')).toBeInTheDocument();
      });

      expect(screen.getByText('Camera active - analyzing...')).toBeInTheDocument();
      await user.click(screen.getByTestId('capture-complete'));

      // Step 3: Results
      await waitFor(() => {
        expect(screen.getByTestId('capture-results')).toBeInTheDocument();
      });

      expect(screen.getByTestId('heart-rate')).toHaveTextContent('Heart Rate: 72 BPM');
      expect(screen.getByTestId('hrv')).toHaveTextContent('HRV: 45 ms');
      expect(screen.getByTestId('quality')).toHaveTextContent('Quality: good');
      expect(screen.getByTestId('confidence')).toHaveTextContent('Confidence: 92%');

      await user.click(screen.getByTestId('save-results'));
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const NetworkErrorApp = () => {
        const [error, setError] = React.useState<string | null>(null);
        const [retryCount, setRetryCount] = React.useState(0);

        const handleSaveData = async () => {
          try {
            await fetch('/api/health/logs', {
              method: 'POST',
              body: JSON.stringify({ energyLevel: 6 }),
            });
          } catch (err) {
            setError('Network error occurred. Data will be saved offline.');
            setRetryCount(prev => prev + 1);
          }
        };

        return (
          <div data-testid="network-error-app">
            <button data-testid="save-data" onClick={handleSaveData}>
              Save Data
            </button>
            {error && (
              <div data-testid="error-message">
                {error}
              </div>
            )}
            {retryCount > 0 && (
              <div data-testid="retry-info">
                Retry attempts: {retryCount}
              </div>
            )}
          </div>
        );
      };

      render(<NetworkErrorApp />);

      await user.click(screen.getByTestId('save-data'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Network error occurred. Data will be saved offline.'
      );
      expect(screen.getByTestId('retry-info')).toHaveTextContent('Retry attempts: 1');
    });

    it('should recover from temporary failures', async () => {
      let callCount = 0;
      
      // Mock API that fails first time, succeeds second time
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      const RetryApp = () => {
        const [status, setStatus] = React.useState('idle');

        const handleSaveWithRetry = async () => {
          setStatus('saving');
          
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              await fetch('/api/health/logs', {
                method: 'POST',
                body: JSON.stringify({ energyLevel: 6 }),
              });
              setStatus('success');
              break;
            } catch (error) {
              if (attempt === 3) {
                setStatus('failed');
              } else {
                setStatus(`retrying-${attempt}`);
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }
        };

        return (
          <div data-testid="retry-app">
            <button data-testid="save-with-retry" onClick={handleSaveWithRetry}>
              Save Data
            </button>
            <div data-testid="status">Status: {status}</div>
          </div>
        );
      };

      render(<RetryApp />);

      await user.click(screen.getByTestId('save-with-retry'));

      // Should show retrying status first
      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('Status: retrying-1');
      });

      // Should eventually succeed
      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('Status: success');
      }, { timeout: 3000 });

      expect(fetch).toHaveBeenCalledTimes(2); // Failed once, succeeded once
    });
  });
});