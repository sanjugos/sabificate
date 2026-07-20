import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { AuthProvider } from '../lib/auth/useAuth';

// Mock the auth API
vi.mock('../lib/auth/api', () => ({
  loginApi: vi.fn().mockResolvedValue({
    access_token: 'test-token',
    token_type: 'Bearer',
    expires_in: 900,
    user: { id: '1', email: 'demo@sabificate.com', first_name: 'Test', last_name: 'User', role: 'learner' },
  }),
  refreshApi: vi.fn().mockRejectedValue(new Error('No session')),
  logoutApi: vi.fn().mockResolvedValue(undefined),
  registerApi: vi.fn(),
  fetchMe: vi.fn(),
}));

vi.mock('../lib/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  setAccessToken: vi.fn(),
}));

describe('LoginForm', () => {
  it('should call login when form is submitted via click', async () => {
    const { loginApi } = await import('../lib/auth/api');

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </BrowserRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    expect(submitBtn).toBeTruthy();

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('Enter your password');

    fireEvent.change(emailInput, { target: { value: 'demo@sabificate.com' } });
    fireEvent.change(passwordInput, { target: { value: 'demo1234' } });

    console.log('Button disabled:', submitBtn.hasAttribute('disabled'));

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(loginApi).toHaveBeenCalledWith({
        email: 'demo@sabificate.com',
        password: 'demo1234',
      });
    }, { timeout: 3000 });
  });

  it('should handle direct form submit event', async () => {
    const { loginApi } = await import('../lib/auth/api');
    (loginApi as any).mockClear();

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </BrowserRouter>
    );

    const form = screen.getByRole('button', { name: /sign in/i }).closest('form')!;
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('Enter your password');

    fireEvent.change(emailInput, { target: { value: 'demo@sabificate.com' } });
    fireEvent.change(passwordInput, { target: { value: 'demo1234' } });

    fireEvent.submit(form);

    await waitFor(() => {
      expect(loginApi).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});
