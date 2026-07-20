import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RegisterForm } from '../components/auth/RegisterForm';
import { AuthProvider } from '../lib/auth/useAuth';

// Mock the auth API — mirrors pattern from login.test.tsx
vi.mock('../lib/auth/api', () => ({
  loginApi: vi.fn(),
  registerApi: vi.fn().mockResolvedValue({
    access_token: 'test-token',
    token_type: 'Bearer',
    expires_in: 900,
    user: {
      id: '1',
      email: 'new@sabificate.com',
      first_name: 'New',
      last_name: 'User',
      role: 'learner',
    },
  }),
  refreshApi: vi.fn().mockRejectedValue(new Error('No session')),
  logoutApi: vi.fn().mockResolvedValue(undefined),
  fetchMe: vi.fn(),
}));

vi.mock('../lib/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  setAccessToken: vi.fn(),
}));

function renderRegisterForm() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    </BrowserRouter>
  );
}

describe('RegisterForm', () => {
  beforeEach(async () => {
    const { registerApi } = await import('../lib/auth/api');
    (registerApi as ReturnType<typeof vi.fn>).mockClear();
    // Reset to default success response
    (registerApi as ReturnType<typeof vi.fn>).mockResolvedValue({
      access_token: 'test-token',
      token_type: 'Bearer',
      expires_in: 900,
      user: {
        id: '1',
        email: 'new@sabificate.com',
        first_name: 'New',
        last_name: 'User',
        role: 'learner',
      },
    });
  });

  it('renders submit button with "Create account" text', () => {
    renderRegisterForm();

    const submitBtn = screen.getByRole('button', { name: /create account/i });
    expect(submitBtn).toBeTruthy();
    expect(submitBtn.getAttribute('type')).toBe('submit');
  });

  it('calls registerApi with valid fields on submit', async () => {
    const { registerApi } = await import('../lib/auth/api');

    renderRegisterForm();

    // Fill all required fields
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'New' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'User' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'new@sabificate.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'secure1234' },
    });

    // Submit the form
    const submitBtn = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitBtn);

    await waitFor(
      () => {
        expect(registerApi).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'new@sabificate.com',
            password: 'secure1234',
            first_name: 'New',
            last_name: 'User',
            consent: expect.objectContaining({
              education_only: true,
            }),
          })
        );
      },
      { timeout: 3000 }
    );
  });

  it('displays "already registered" error on 409 duplicate email', async () => {
    const { registerApi } = await import('../lib/auth/api');
    (registerApi as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('already registered')
    );

    renderRegisterForm();

    // Fill all required fields
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Dup' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'User' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'existing@sabificate.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'secure1234' },
    });

    // Submit the form
    const submitBtn = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitBtn);

    await waitFor(
      () => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toContain('already registered');
      },
      { timeout: 3000 }
    );
  });
});
