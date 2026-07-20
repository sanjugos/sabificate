import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { AuthProvider } from '../lib/auth/useAuth';

// Mock the auth API — we use forwarding fns so we can reset mockLoginApi per-test
const mockLoginApi = vi.fn();
const mockRefreshApi = vi.fn().mockRejectedValue(new Error('No session'));
const mockLogoutApi = vi.fn().mockResolvedValue(undefined);
const mockRegisterApi = vi.fn();
const mockFetchMe = vi.fn();

vi.mock('../lib/auth/api', () => ({
  loginApi: (...args: unknown[]) => mockLoginApi(...args),
  refreshApi: (...args: unknown[]) => mockRefreshApi(...args),
  logoutApi: (...args: unknown[]) => mockLogoutApi(...args),
  registerApi: (...args: unknown[]) => mockRegisterApi(...args),
  fetchMe: (...args: unknown[]) => mockFetchMe(...args),
}));

vi.mock('../lib/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  setAccessToken: vi.fn(),
}));

function renderLoginForm() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    </BrowserRouter>
  );
}

function fillAndSubmit(email: string, password: string) {
  const emailInput = screen.getByPlaceholderText('you@example.com');
  const passwordInput = screen.getByPlaceholderText('Enter your password');
  const submitBtn = screen.getByRole('button', { name: /sign in/i });

  fireEvent.change(emailInput, { target: { value: email } });
  fireEvent.change(passwordInput, { target: { value: password } });
  fireEvent.click(submitBtn);
}

describe('Login Auth — T-002', () => {
  beforeEach(() => {
    mockLoginApi.mockReset();
    mockRefreshApi.mockReset().mockRejectedValue(new Error('No session'));
  });

  it('AC-1.4: successful login calls loginApi with correct credentials and receives tokens', async () => {
    mockLoginApi.mockResolvedValue({
      access_token: 'test-access-token',
      token_type: 'Bearer' as const,
      expires_in: 900,
      user: {
        id: '1',
        email: 'user@sabificate.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'learner',
      },
    });

    renderLoginForm();
    fillAndSubmit('user@sabificate.com', 'correct-password');

    await waitFor(() => {
      expect(mockLoginApi).toHaveBeenCalledWith({
        email: 'user@sabificate.com',
        password: 'correct-password',
      });
    }, { timeout: 3000 });

    // Verify no error message is shown on success
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('AC-1.5: displays rate-limit message when API returns 429 with Retry-After', async () => {
    mockLoginApi.mockRejectedValue(new Error('Too many attempts. Please try again later.'));

    renderLoginForm();
    fillAndSubmit('user@sabificate.com', 'any-password');

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Too many attempts');
    }, { timeout: 3000 });
  });

  it('AC-1.6: submit button fires loginApi exactly once per click (no double-submit)', async () => {
    // Use a slow-resolving promise to keep isSubmitting true
    let resolveLogin!: (value: unknown) => void;
    mockLoginApi.mockImplementation(() => new Promise((resolve) => {
      resolveLogin = resolve;
    }));

    renderLoginForm();
    fillAndSubmit('user@sabificate.com', 'password123');

    // Button text should change to "Signing in…" while in-flight
    const busyBtn = screen.getByRole('button', { name: /signing in/i });
    expect(busyBtn).toBeTruthy();

    // Try clicking again while first request is in-flight
    fireEvent.click(busyBtn);

    // loginApi should have been called exactly once despite two clicks
    expect(mockLoginApi).toHaveBeenCalledTimes(1);

    // Resolve the pending login to clean up
    resolveLogin({
      access_token: 'tok',
      token_type: 'Bearer',
      expires_in: 900,
      user: { id: '1', email: 'user@sabificate.com', first_name: 'T', last_name: 'U', role: 'learner' },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy();
    }, { timeout: 3000 });
  });
});

describe('loginApi — 429 handling at API layer', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('loginApi throws user-friendly rate-limit error on 429 with server message', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ 'Retry-After': '30' }),
      json: () => Promise.resolve({ message: 'Too many attempts. Please try again later.' }),
    }) as unknown as typeof fetch;

    const realApi = await vi.importActual<typeof import('../lib/auth/api')>('../lib/auth/api');

    await expect(realApi.loginApi({ email: 'a@b.com', password: 'x' }))
      .rejects.toThrow(/too many attempts/i);
  });

  it('loginApi throws rate-limit error on bare 429 (no JSON body)', async () => {
    // Server returns 429 with no parseable body — the API layer should
    // still produce a user-friendly "Too many attempts" message, not
    // a generic "Request failed (429)".
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ 'Retry-After': '60' }),
      json: () => Promise.reject(new SyntaxError('Unexpected end of input')),
    }) as unknown as typeof fetch;

    const realApi = await vi.importActual<typeof import('../lib/auth/api')>('../lib/auth/api');

    await expect(realApi.loginApi({ email: 'a@b.com', password: 'x' }))
      .rejects.toThrow(/too many attempts/i);
  });
});
