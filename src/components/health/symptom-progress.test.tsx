import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SymptomProgress } from './symptom-progress';
import { type ProgressMetrics, type SymptomCorrelation } from '@/lib/types/symptom.types';

// Mock recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div data-testid="card-title">{children}</div>,
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      {children}
    </div>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tabs-content-${value}`}>{children}</div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => (
    <button data-testid={`tab-trigger-${value}`} onClick={() => {}}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange }: any) => (
    <div data-testid="select" onClick={() => onValueChange?.('month')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-testid={`select-item-${value}`}>{children}</div>
  ),
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <div data-testid="select-value">{placeholder}</div>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span data-testid="badge">{children}</span>,
}));

describe('SymptomProgress', () => {
  const mockOnPeriodChange = jest.fn();
  const mockOnSymptomSelect = jest.fn();

  const mockProgressMetrics: ProgressMetrics = {
    period: 'month',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    averageFatigue: 6.5,
    averagePEM: 5.2,
    averageBrainFog: 7.1,
    averageSleep: 4.8,
    averageWellbeing: 5.5,
    fatiguetrend: 'improving',
    overallTrend: 'improving',
    goodDays: 12,
    difficultDays: 8,
    topSymptoms: [
      {
        symptomType: 'fatigue',
        averageSeverity: 6.5,
        frequency: 85,
        trendDirection: 'improving',
      },
      {
        symptomType: 'brain_fog',
        averageSeverity: 7.1,
        frequency: 70,
        trendDirection: 'stable',
      },
    ],
  };

  const mockSymptomTrends = [
    { date: '2024-01-01', severity: 6 },
    { date: '2024-01-02', severity: 5 },
    { date: '2024-01-03', severity: 7 },
  ];

  const mockCorrelations: SymptomCorrelation[] = [
    {
      symptom1: 'fatigue',
      symptom2: 'brain_fog',
      correlation: 0.75,
      significance: 'high',
      sampleSize: 30,
    },
    {
      symptom1: 'fatigue',
      symptom2: 'sleep_disturbance',
      correlation: -0.65,
      significance: 'moderate',
      sampleSize: 25,
    },
  ];

  const defaultProps = {
    userId: 'test-user-id',
    progressMetrics: mockProgressMetrics,
    symptomTrends: mockSymptomTrends,
    correlations: mockCorrelations,
    onPeriodChange: mockOnPeriodChange,
    onSymptomSelect: mockOnSymptomSelect,
    selectedSymptom: 'fatigue' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    render(<SymptomProgress {...defaultProps} isLoading={true} />);
    
    expect(screen.getByTestId('card')).toBeInTheDocument();
    // Should show loading spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders no data state when progressMetrics is null', () => {
    render(<SymptomProgress {...defaultProps} progressMetrics={null} />);
    
    expect(screen.getByText('No Data Available')).toBeInTheDocument();
    expect(screen.getByText(/start tracking your symptoms/i)).toBeInTheDocument();
  });

  it('renders progress metrics correctly', () => {
    render(<SymptomProgress {...defaultProps} />);
    
    expect(screen.getByText('Progress & Insights')).toBeInTheDocument();
    expect(screen.getByText('6.5')).toBeInTheDocument(); // Average fatigue
    expect(screen.getByText('7.1')).toBeInTheDocument(); // Average brain fog
    expect(screen.getByText('4.8')).toBeInTheDocument(); // Average sleep
    expect(screen.getByText('12')).toBeInTheDocument(); // Good days
  });

  it('shows overall trend correctly', () => {
    render(<SymptomProgress {...defaultProps} />);
    
    expect(screen.getByText('Overall Trend')).toBeInTheDocument();
    expect(screen.getByText('IMPROVING')).toBeInTheDocument();
  });

  it('displays top symptoms', () => {
    render(<SymptomProgress {...defaultProps} />);
    
    expect(screen.getByText('Most Frequent Symptoms')).toBeInTheDocument();
    expect(screen.getByText('Fatigue')).toBeInTheDocument();
    expect(screen.getByText('Brain Fog')).toBeInTheDocument();
    expect(screen.getByText('85% of days')).toBeInTheDocument();
    expect(screen.getByText('70% of days')).toBeInTheDocument();
  });

  it('calls onPeriodChange when period is selected', async () => {
    const user = userEvent.setup();
    render(<SymptomProgress {...defaultProps} />);
    
    const select = screen.getByTestId('select');
    await user.click(select);
    
    expect(mockOnPeriodChange).toHaveBeenCalledWith('month');
  });

  it('renders trend chart when data is available', () => {
    render(<SymptomProgress {...defaultProps} />);
    
    // Switch to trends tab
    const trendsTab = screen.getByTestId('tab-trigger-trends');
    fireEvent.click(trendsTab);
    
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('renders symptom correlations', () => {
    render(<SymptomProgress {...defaultProps} />);
    
    // Switch to patterns tab
    const patternsTab = screen.getByTestId('tab-trigger-patterns');
    fireEvent.click(patternsTab);
    
    expect(screen.getByText('Symptom Correlations')).toBeInTheDocument();
    expect(screen.getByText(/Fatigue ↔ Brain Fog/)).toBeInTheDocument();
    expect(screen.getByText(/Fatigue ↔ Sleep Disturbance/)).toBeInTheDocument();
    expect(screen.getByText('Positive correlation')).toBeInTheDocument();
    expect(screen.getByText('Negative correlation')).toBeInTheDocument();
  });

  it('shows insights based on trend', () => {
    render(<SymptomProgress {...defaultProps} />);
    
    // Switch to patterns tab
    const patternsTab = screen.getByTestId('tab-trigger-patterns');
    fireEvent.click(patternsTab);
    
    expect(screen.getByText('Insights & Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Positive Trend')).toBeInTheDocument();
    expect(screen.getByText(/your fatigue levels are showing improvement/i)).toBeInTheDocument();
  });

  it('shows concerning trend insight when worsening', () => {
    const worseningMetrics = {
      ...mockProgressMetrics,
      fatiguetrend: 'worsening' as const,
      overallTrend: 'worsening' as const,
    };
    
    render(<SymptomProgress {...defaultProps} progressMetrics={worseningMetrics} />);
    
    // Switch to patterns tab
    const patternsTab = screen.getByTestId('tab-trigger-patterns');
    fireEvent.click(patternsTab);
    
    expect(screen.getByText('Concerning Trend')).toBeInTheDocument();
    expect(screen.getByText(/your fatigue levels have been increasing/i)).toBeInTheDocument();
  });

  it('shows more good days insight when applicable', () => {
    const goodDaysMetrics = {
      ...mockProgressMetrics,
      goodDays: 20,
      difficultDays: 5,
    };
    
    render(<SymptomProgress {...defaultProps} progressMetrics={goodDaysMetrics} />);
    
    // Switch to patterns tab
    const patternsTab = screen.getByTestId('tab-trigger-patterns');
    fireEvent.click(patternsTab);
    
    expect(screen.getByText('More Good Days')).toBeInTheDocument();
    expect(screen.getByText(/you've had more good days than difficult ones/i)).toBeInTheDocument();
  });

  it('renders frequency chart when symptom data is available', () => {
    render(<SymptomProgress {...defaultProps} />);
    
    // Switch to trends tab
    const trendsTab = screen.getByTestId('tab-trigger-trends');
    fireEvent.click(trendsTab);
    
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByText('Symptom Frequency')).toBeInTheDocument();
  });

  it('handles empty correlations gracefully', () => {
    render(<SymptomProgress {...defaultProps} correlations={[]} />);
    
    // Switch to patterns tab
    const patternsTab = screen.getByTestId('tab-trigger-patterns');
    fireEvent.click(patternsTab);
    
    // Should still show insights section
    expect(screen.getByText('Insights & Recommendations')).toBeInTheDocument();
  });

  it('handles empty symptom trends gracefully', () => {
    render(<SymptomProgress {...defaultProps} symptomTrends={[]} />);
    
    // Switch to trends tab
    const trendsTab = screen.getByTestId('tab-trigger-trends');
    fireEvent.click(trendsTab);
    
    expect(screen.getByText('Symptom Trend')).toBeInTheDocument();
    // Chart should not render with empty data
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('shows insufficient data trend correctly', () => {
    const insufficientDataMetrics = {
      ...mockProgressMetrics,
      fatiguetrend: 'insufficient_data' as const,
      overallTrend: 'insufficient_data' as const,
    };
    
    render(<SymptomProgress {...defaultProps} progressMetrics={insufficientDataMetrics} />);
    
    expect(screen.getByText('INSUFFICIENT_DATA')).toBeInTheDocument();
  });

  it('displays correlation significance badges correctly', () => {
    render(<SymptomProgress {...defaultProps} />);
    
    // Switch to patterns tab
    const patternsTab = screen.getByTestId('tab-trigger-patterns');
    fireEvent.click(patternsTab);
    
    const badges = screen.getAllByTestId('badge');
    expect(badges.some(badge => badge.textContent === 'high')).toBe(true);
    expect(badges.some(badge => badge.textContent === 'moderate')).toBe(true);
  });
});