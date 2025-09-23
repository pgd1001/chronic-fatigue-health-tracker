import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from './page';

// Mock the auth client
vi.mock('@/lib/auth/client', () => ({
  useSession: vi.fn(() => ({
    data: null,
    isPending: false,
  })),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

describe('Home Page', () => {
  it('renders the main heading when not authenticated', () => {
    render(<Home />);
    
    const heading = screen.getByRole('heading', {
      name: /gentle health tracking for/i,
    });
    
    expect(heading).toBeInTheDocument();
  });

  it('renders the description when not authenticated', () => {
    render(<Home />);
    
    const description = screen.getByText(
      /evidence-based, empathetic health management/i
    );
    
    expect(description).toBeInTheDocument();
  });
});