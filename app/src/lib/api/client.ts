// ── Shared API client ────────────────────────────────────────────────────
//
// Centralised fetch wrapper for SABIficate frontend.
//
// Usage:
//   import { api, setAccessToken } from '@/lib/api/client';
//   const courses = await api.get<CourseListResponse>('/courses');
//   await api.post('/courses/enroll', { course_id: '...' });

const BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1';

const DATA_SAVER_KEY = 'sabificate:data-saver-mode';

// ── Token management ─────────────────────────────────────────────────────

let accessToken: string | null = null;

/** Set (or clear) the access token used by every subsequent request. */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// ── Error type ───────────────────────────────────────────────────────────

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ── Internal helpers ─────────────────────────────────────────────────────

function buildHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  try {
    const dataSaver = localStorage.getItem(DATA_SAVER_KEY);
    if (dataSaver) {
      headers.set('X-Data-Saver-Mode', dataSaver);
    }
  } catch {
    // localStorage unavailable
  }

  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { message?: string; error?: string };
      message = body.message ?? body.error ?? message;
    } catch {
      // response body wasn't JSON
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

/** Attempt a silent token refresh and return `true` on success. */
async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;

    const body = (await res.json()) as { access_token: string };
    accessToken = body.access_token;
    return true;
  } catch {
    return false;
  }
}

/**
 * Core request function. On a 401 it will attempt a single token refresh
 * and retry the original request.
 */
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const init: RequestInit = {
    method,
    headers: buildHeaders(
      body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    ),
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  let res = await fetch(url, init);

  // On 401 try a single refresh-and-retry cycle
  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      // Rebuild headers with the new token
      const retryInit: RequestInit = {
        ...init,
        headers: buildHeaders(
          body !== undefined
            ? { 'Content-Type': 'application/json' }
            : undefined,
        ),
      };
      res = await fetch(url, retryInit);
    }
  }

  return handleResponse<T>(res);
}

// ── Public API ───────────────────────────────────────────────────────────

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>('GET', path);
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('POST', path, body);
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('PUT', path, body);
  },

  delete<T>(path: string): Promise<T> {
    return request<T>('DELETE', path);
  },
};
