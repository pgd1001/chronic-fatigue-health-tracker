import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SymptomTracker } from './symptom-tracker';
import { type SymptomEntry } from '@/lib/types/symptom.types';

// Mock the UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div data-testid="card-title">{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/slider', () => ({
  Slider: ({ value, onValueChange, max, min }: any) => (
    <input
      type="range"
      value={value[0]}
      onChange={(e) => onValueChange([parseInt(e.target.value)])}
      max={max}
      min={min}
      data-testid="slider"
    />
  ),
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, placeholder, ...props }: any) => (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      data-testid="textarea"
      {...props}
    />
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span data-testid="badge">{children}</span>,
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
  TabsTrigger: ({ children, value, onClick }: any) => (
    <button data-testid={`tab-trigger-${value}`} onClick={() => onClick?.(value)}>
      {children}
    </button>
  ),
}));

describe('SymptomTracker', () => {
  const mockOnSave = jest.fn();
  const defaultProps = {
    userId: 'test-user-id',
    date: '2024-01-15',
    onSave: mockOnSave,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default values', () => {
    render(<SymptomTracker {...defaultProps} />);
    
    expect(screen.getByText('Symptom Tracking')).toBeInTheDocument();
    expect(screen.getByText('Core Symptoms')).toBeInTheDocument();
    expect(screen.getByText('Additional Symptoms')).toBeInTheDocument();
  });

  it('initializes with provided initial data', () => {
    const initialData = {
      fatigueLevel: 7,
      brainFogLevel: 5,
      sleepQuality: 3,
      notes: 'Test notes',
    };

    render(<SymptomTracker {...defaultProps} initialData={initialData} />);
    
    // Check if sliders are initialized with correct values
    const sliders = screen.getAllByTestId('slider');
    expect(sliders[0]).toHaveValue('7'); // fatigue
    expect(sliders[1]).toHaveValue('5'); // brain fog
    expect(sliders[2]).toHaveValue('3'); // sleep quality
    
    // Check if notes are initialized
    expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument();
  });

  it('updates fatigue level when slider changes', async () => {
    const user = userEvent.setup();
    render(<SymptomTracker {...defaultProps} />);
    
    const fatigueSlider = screen.getAllByTestId('slider')[0];
    await user.clear(fatigueSlider);
    await user.type(fatigueSlider, '8');
    
    expect(fatigueSlider).toHaveValue('8');
  });

  it('updates brain fog level when slider changes', async () => {
    const user = userEvent.setup();
    render(<SymptomTracker {...defaultProps} />);
    
    const brainFogSlider = screen.getAllByTestId('slider')[1];
    await user.clear(brainFogSlider);
    await user.type(brainFogSlider, '6');
    
    expect(brainFogSlider).toHaveValue('6');
  });

  it('updates sleep quality when slider changes', async () => {
    const user = userEvent.setup();
    render(<SymptomTracker {...defaultProps} />);
    
    const sleepSlider = screen.getAllByTestId('slider')[2];
    await user.clear(sleepSlider);
    await user.type(sleepSlider, '9');
    
    expect(sleepSlider).toHaveValue('9');
  });

  it('updates notes when textarea changes', async () => {
    const user = userEvent.setup();
    render(<SymptomTracker {...defaultProps} />);
    
    const notesTextarea = screen.getByPlaceholderText(/additional observations/i);
    await user.type(notesTextarea, 'New symptom notes');
    
    expect(notesTextarea).toHaveValue('New symptom notes');
  });

  it('calls onSave with correct data when save button is clicked', async () => {
    const user = userEvent.setup();
    render(<SymptomTracker {...defaultProps} />);
    
    // Update some values
    const fatigueSlider = screen.getAllByTestId('slider')[0];
    await user.clear(fatigueSlider);
    await user.type(fatigueSlider, '7');
    
    const notesTextarea = screen.getByPlaceholderText(/additional observations/i);
    await user.type(notesTextarea, 'Test notes');
    
    // Click save
    const saveButton = screen.getByText('Save Symptoms');
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        fatigueLevel: 7,
        brainFogLevel: 5, // default value
        sleepQuality: 5, // default value
        symptoms: [],
        notes: 'Test notes',
      });
    });
  });

  it('shows loading state when saving', async () => {
    const user = userEvent.setup();
    
    // Mock onSave to return a pending promise
    let resolveSave: () => void;
    const savePromise = new Promise<void>((resolve) => {
      resolveSave = resolve;
    });
    mockOnSave.mockReturnValue(savePromise);
    
    render(<SymptomTracker {...defaultProps} />);
    
    const saveButton = screen.getByText('Save Symptoms');
    await user.click(saveButton);
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
    
    // Resolve the promise
    resolveSave!();
    await waitFor(() => {
      expect(screen.getByText('Save Symptoms')).toBeInTheDocument();
    });
  });

  it('adds additional symptoms when buttons are clicked', async () => {
    const user = userEvent.setup();
    render(<SymptomTracker {...defaultProps} />);
    
    // Switch to additional symptoms tab
    const additionalTab = screen.getByText('Additional Symptoms');
    await user.click(additionalTab);
    
    // Add a symptom
    const pemButton = screen.getByText(/Post-Exertional Malaise/);
    await user.click(pemButton);
    
    // Should show the symptom in current symptoms
    expect(screen.getByText('Current Symptoms')).toBeInTheDocument();
    expect(screen.getByText('Post-Exertional Malaise (PEM)')).toBeInTheDocument();
  });

  it('removes symptoms when remove button is clicked', async () => {
    const user = userEvent.setup();
    const initialData = {
      symptoms: [{
        type: 'post_exertional_malaise' as const,
        severity: 6,
        timestamp: new Date(),
      }] as SymptomEntry[],
    };
    
    render(<SymptomTracker {...defaultProps} initialData={initialData} />);
    
    // Switch to additional symptoms tab
    const additionalTab = screen.getByText('Additional Symptoms');
    await user.click(additionalTab);
    
    // Should show the symptom
    expect(screen.getByText('Post-Exertional Malaise (PEM)')).toBeInTheDocument();
    
    // Remove the symptom
    const removeButton = screen.getByRole('button', { name: /remove/i });
    await user.click(removeButton);
    
    // Should not show current symptoms section anymore
    expect(screen.queryByText('Current Symptoms')).not.toBeInTheDocument();
  });

  it('validates character limits for notes', async () => {
    const user = userEvent.setup();
    render(<SymptomTracker {...defaultProps} />);
    
    const notesTextarea = screen.getByPlaceholderText(/additional observations/i);
    const longText = 'a'.repeat(600); // Exceeds 500 character limit
    
    await user.type(notesTextarea, longText);
    
    // Should be truncated to 500 characters
    expect(notesTextarea.value.length).toBeLessThanOrEqual(500);
  });

  it('shows severity descriptions correctly', () => {
    render(<SymptomTracker {...defaultProps} />);
    
    // Should show default severity description
    expect(screen.getByText(/moderate, affecting daily activities/i)).toBeInTheDocument();
  });

  it('handles error in onSave gracefully', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    mockOnSave.mockRejectedValue(new Error('Save failed'));
    
    render(<SymptomTracker {...defaultProps} />);
    
    const saveButton = screen.getByText('Save Symptoms');
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save symptom data:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  it('updates symptom severity when slider changes', async () => {
    const user = userEvent.setup();
    const initialData = {
      symptoms: [{
        type: 'headache' as const,
        severity: 5,
        timestamp: new Date(),
      }] as SymptomEntry[],
    };
    
    render(<SymptomTracker {...defaultProps} initialData={initialData} />);
    
    // Switch to additional symptoms tab
    const additionalTab = screen.getByText('Additional Symptoms');
    await user.click(additionalTab);
    
    // Find the symptom slider (should be the last slider)
    const sliders = screen.getAllByTestId('slider');
    const symptomSlider = sliders[sliders.length - 1];
    
    await user.clear(symptomSlider);
    await user.type(symptomSlider, '8');
    
    expect(symptomSlider).toHaveValue('8');
  });
});