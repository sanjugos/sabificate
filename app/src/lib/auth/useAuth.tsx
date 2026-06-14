import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import type { UserProfile, LoginRequest, RegisterRequest } from '../../../contracts/api/auth';
import { loginApi, registerApi, refreshApi, logoutApi, fetchMe } from './api';
import { setAccessToken } from '../api/client';

interface AuthContextValue {
  user: UserProfile | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Percentage of expires_in after which we trigger a proactive refresh. */
const REFRESH_THRESHOLD = 0.8;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accessTokenRef = useRef<string | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current !== null) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback(
    (expiresIn: number) => {
      clearRefreshTimer();
      const delayMs = expiresIn * REFRESH_THRESHOLD * 1000;
      refreshTimerRef.current = setTimeout(async () => {
        try {
          const res = await refreshApi();
          accessTokenRef.current = res.access_token;
          setAccessToken(res.access_token);
          scheduleRefresh(res.expires_in);
        } catch {
          // Refresh failed — session expired
          accessTokenRef.current = null;
          setAccessToken(null);
          setUser(null);
        }
      }, delayMs);
    },
    [clearRefreshTimer],
  );

  // Silent refresh on mount to restore session from httpOnly cookie
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const res = await refreshApi();
        if (cancelled) return;
        accessTokenRef.current = res.access_token;
        setAccessToken(res.access_token);
        scheduleRefresh(res.expires_in);

        // Fetch user profile now that we have a valid token
        try {
          const user = await fetchMe();
          if (!cancelled) setUser(user);
        } catch {
          // Token works but /me failed — keep the token, user stays null
        }
      } catch {
        // No valid session — that's fine
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [scheduleRefresh]);

  // Cleanup timer on unmount
  useEffect(() => clearRefreshTimer, [clearRefreshTimer]);

  const login = useCallback(
    async (data: LoginRequest) => {
      const res = await loginApi(data);
      accessTokenRef.current = res.access_token;
      setAccessToken(res.access_token);
      setUser(res.user);
      scheduleRefresh(res.expires_in);
    },
    [scheduleRefresh],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      const res = await registerApi(data);
      accessTokenRef.current = res.access_token;
      setAccessToken(res.access_token);
      setUser(res.user);
      scheduleRefresh(res.expires_in);
    },
    [scheduleRefresh],
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      accessTokenRef.current = null;
      setAccessToken(null);
      setUser(null);
      clearRefreshTimer();
    }
  }, [clearRefreshTimer]);

  const value: AuthContextValue = {
    user,
    login,
    logout,
    register,
    isAuthenticated: user !== null,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
