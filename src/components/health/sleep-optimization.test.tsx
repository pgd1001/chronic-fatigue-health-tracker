import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { SleepOptimization } from './sleep-optimization';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, id }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      id={id}
    />
  ),
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue }: any) => <div data-testid="tabs">{children}</div>,
  TabsContent: ({ children, value }: any) => <div data-testid={`tab-content-${value}`}>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button data-testid={`tab-${value}`}>{children}</button>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: any) => <div data-testid="progress" data-value={value}></div>,
}));

describe('SleepOptimization', () => {
  const mockProps = {
    userId: 'test-user-id',
    currentDate: new Date('2024-01-15'),
    onSleepDataUpdate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sleep optimization component', () => {
    render(<SleepOptimization {...mockProps} />);
    
    expect(screen.getByText('Sleep Optimization')).toBeInTheDocument();
    expect(screen.getByText(/Gentle sleep preparation and quality tracking/)).toBeInTheDocument();
  });

  it('displays evening checklist items', () => {
    render(<SleepOptimization {...mockProps} />);
    
    expect(screen.getByText('Blue Light Protection')).toBeInTheDocument();
    expect(screen.getByText('Screen-Free Activities')).toBeInTheDocument();
    expect(screen.getByText('Sleep Environment')).toBeInTheDocument();
  });

  it('updates checklist completion when items are checked', async () => {
    render(<SleepOptimization {...mockProps} />);
    
    const bluelightCheckbox = screen.getByLabelText('Blue Light Protection');
    
    fireEvent.click(bluelightCheckbox);
    
    await waitFor(() => {
      expect(mockProps.onSleepDataUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          bluelightReduction: true,
        })
      );
    });
  });

  it('calculates completion percentage correctly', () => {
    render(<SleepOptimization {...mockProps} />);
    
    // Initially 0% completion
    const progressBar = screen.getByTestId('progress');
    expect(progressBar).toHaveAttribute('data-value', '0');
    
    // Check one item (33% completion)
    const bluelightCheckbox = screen.getByLabelText('Blue Light Protection');
    fireEvent.click(bluelightCheckbox);
    
    // Progress should update to 33%
    expect(progressBar).toHaveAttribute('data-value', '33');
  });

  it('shows completion message when all items are checked', async () => {
    render(<SleepOptimization {...mockProps} />);
    
    // Check all three items
    fireEvent.click(screen.getByLabelText('Blue Light Protection'));
    fireEvent.click(screen.getByLabelText('Screen-Free Activities'));
    fireEvent.click(screen.getByLabelText('Sleep Environment'));
    
    await waitFor(() => {
      expect(screen.getByText(/Evening routine complete!/)).toBeInTheDocument();
    });
  });

  it('allows sleep quality rating selection', () => {
    render(<SleepOptimization {...mockProps} />);
    
    // Find and click a rating button (e.g., rating 7)
    const ratingButton = screen.getByRole('button', { name: '7' });
    fireEvent.click(ratingButton);
    
    expect(screen.getByText('Good sleep quality')).toBeInTheDocument();
  });

  it('validates sleep quality before saving', () => {
    render(<SleepOptimization {...mockProps} />);
    
    const saveButton = screen.getByText('Save Sleep Data');
    expect(saveButton).toBeDisabled();
    
    // Select a rating
    const ratingButton = screen.getByRole('button', { name: '8' });
    fireEvent.click(ratingButton);
    
    expect(saveButton).not.toBeDisabled();
  });

  it('handles bedtime input correctly', () => {
    render(<SleepOptimization {...mockProps} />);
    
    const bedtimeInput = screen.getByLabelText('Bedtime (optional)');
    fireEvent.change(bedtimeInput, { target: { value: '22:30' } });
    
    expect(bedtimeInput).toHaveValue('22:30');
  });

  it('handles notes input correctly', () => {
    render(<SleepOptimization {...mockProps} />);
    
    const notesTextarea = screen.getByPlaceholderText('Any observations about your sleep...');
    const testText = 'Had a good night sleep';
    
    fireEvent.change(notesTextarea, { target: { value: testText } });
    
    expect(notesTextarea).toHaveValue(testText);
  });

  it('displays sleep tips with evidence-based badges', () => {
    render(<SleepOptimization {...mockProps} />);
    
    expect(screen.getByText('Blue Light Reduction')).toBeInTheDocument();
    expect(screen.getByText('Screen-Free Evening Activities')).toBeInTheDocument();
    expect(screen.getAllByText('Evidence-based').length).toBeGreaterThan(0);
  });

  it('shows evening mode indicator when appropriate', () => {
    // Mock current time to be evening (7 PM)
    const mockDate = new Date('2024-01-15T19:00:00');
    vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
    
    render(<SleepOptimization {...mockProps} />);
    
    expect(screen.getByText('Evening Mode')).toBeInTheDocument();
    
    // Restore Date
    vi.restoreAllMocks();
  });

  it('provides medical disclaimer', () => {
    render(<SleepOptimization {...mockProps} />);
    
    expect(screen.getByText(/These are general wellness suggestions, not medical advice/)).toBeInTheDocument();
  });

  it('handles save sleep data correctly', async () => {
    render(<SleepOptimization {...mockProps} />);
    
    // Select sleep quality
    fireEvent.click(screen.getByRole('button', { name: '8' }));
    
    // Add bedtime
    const bedtimeInput = screen.getByLabelText('Bedtime (optional)');
    fireEvent.change(bedtimeInput, { target: { value: '22:00' } });
    
    // Add notes
    const notesTextarea = screen.getByPlaceholderText('Any observations about your sleep...');
    fireEvent.change(notesTextarea, { target: { value: 'Felt well rested' } });
    
    // Save
    const saveButton = screen.getByText('Save Sleep Data');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockProps.onSleepDataUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          sleepQuality: 8,
          bedtime: '22:00',
          notes: 'Felt well rested',
        })
      );
    });
  });
});