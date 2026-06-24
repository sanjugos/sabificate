import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshResponse,
  UserProfile,
} from '../../../contracts/api/auth';
import { api as apiClient } from '../api/client';

const BASE = '/api/v1/auth';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json() as { message?: string; error?: string };
      message = body.message ?? body.error ?? message;
    } catch {
      // response body wasn't JSON
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function loginApi(data: LoginRequest): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<AuthResponse>(res);
}

export async function registerApi(data: RegisterRequest): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<AuthResponse>(res);
}

export async function refreshApi(): Promise<RefreshResponse> {
  const res = await fetch(`${BASE}/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  return handleResponse<RefreshResponse>(res);
}

export async function logoutApi(): Promise<void> {
  const res = await fetch(`${BASE}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json() as { message?: string; error?: string };
      message = body.message ?? body.error ?? message;
    } catch {
      // response body wasn't JSON
    }
    throw new Error(message);
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetch(`${BASE}/password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json() as { message?: string; error?: string };
      message = body.message ?? body.error ?? message;
    } catch {
      // response body wasn't JSON
    }
    throw new Error(message);
  }
}

export async function confirmPasswordReset(
  token: string,
  newPassword: string,
): Promise<void> {
  const res = await fetch(`${BASE}/password-reset/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json() as { message?: string; error?: string };
      message = body.message ?? body.error ?? message;
    } catch {
      // response body wasn't JSON
    }
    throw new Error(message);
  }
}

export async function fetchMe(): Promise<UserProfile> {
  const res = await apiClient.get<{ status: string; data: UserProfile }>('/auth/me');
  return res.data;
}
