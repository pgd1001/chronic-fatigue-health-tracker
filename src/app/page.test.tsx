import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Home from './page';

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />);
    
    const heading = screen.getByRole('heading', {
      name: /chronic fatigue health tracker/i,
    });
    
    expect(heading).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<Home />);
    
    const description = screen.getByText(
      /gentle, evidence-based health management for me\/cfs and long covid/i
    );
    
    expect(description).toBeInTheDocument();
  });
});