import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { BiometricCapture } from './biometric-capture';
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

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: any) => <div data-testid="progress" data-value={value}></div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => <span data-variant={variant}>{children}</span>,
}));

describe('BiometricCapture', () => {
  const mockProps = {
    onReadingComplete: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the biometric capture component', () => {
    render(<BiometricCapture {...mockProps} />);
    
    expect(screen.getByText('Biometric Capture')).toBeInTheDocument();
    expect(screen.getByText(/Measure heart rate and HRV using your device camera/)).toBeInTheDocument();
  });

  it('shows privacy information when privacy button is clicked', () => {
    render(<BiometricCapture {...mockProps} />);
    
    const privacyButton = screen.getByText('Privacy');
    fireEvent.click(privacyButton);
    
    expect(screen.getByText('Privacy-First Design')).toBeInTheDocument();
    expect(screen.getByText(/All processing happens locally on your device/)).toBeInTheDocument();
  });

  it('displays start camera button initially', () => {
    render(<BiometricCapture {...mockProps} />);
    
    expect(screen.getByText('Start Camera')).toBeInTheDocument();
  });

  it('displays measurement instructions', () => {
    render(<BiometricCapture {...mockProps} />);
    
    expect(screen.getByText('Measurement Tips')).toBeInTheDocument();
    expect(screen.getByText(/Cover the camera lens completely with your fingertip/)).toBeInTheDocument();
    expect(screen.getByText(/Keep your finger still and apply gentle pressure/)).toBeInTheDocument();
  });

  it('shows medical disclaimer', () => {
    render(<BiometricCapture {...mockProps} />);
    
    expect(screen.getByText(/Medical Disclaimer/)).toBeInTheDocument();
    expect(screen.getByText(/This measurement is for wellness tracking only/)).toBeInTheDocument();
  });

  it('validates basic functionality', () => {
    render(<BiometricCapture {...mockProps} />);
    
    expect(screen.getByText('Biometric Capture')).toBeInTheDocument();
    expect(screen.getByText('Start Camera')).toBeInTheDocument();
  });
});