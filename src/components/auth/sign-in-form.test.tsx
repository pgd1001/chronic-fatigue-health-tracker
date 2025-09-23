import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SignInForm } from './sign-in-form';

// Mock the auth client
vi.mock('@/lib/auth/client', () => ({
  signIn: {
    email: vi.fn(),
  },
}));

describe('SignInForm', () => {
  it('renders sign in form elements', () => {
    render(<SignInForm />);
    
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows password when toggle is clicked', async () => {
    render(<SignInForm />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole('button', { name: /show password/i });
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(toggleButton);
    
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('validates required fields', async () => {
    render(<SignInForm />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    // HTML5 validation should prevent submission
    expect(screen.getByLabelText(/email/i)).toBeInvalid();
  });

  it('calls onSwitchToSignUp when sign up link is clicked', () => {
    const mockSwitch = vi.fn();
    render(<SignInForm onSwitchToSignUp={mockSwitch} />);
    
    const signUpLink = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(signUpLink);
    
    expect(mockSwitch).toHaveBeenCalled();
  });
});