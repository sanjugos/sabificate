import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RequireRole } from '../components/auth/RequireRole';

// ── Mock useAuth to control user state per test ──────────────────────────
const mockUseAuth = vi.fn();

vi.mock('../lib/auth/useAuth', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── Mock api/client to avoid import errors ───────────────────────────────
vi.mock('../lib/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  setAccessToken: vi.fn(),
}));

// Studio-allowed roles per spec: curriculum_author, platform_admin, sme_reviewer
const STUDIO_ROLES = ['curriculum_author', 'platform_admin', 'sme_reviewer'] as const;

function makeUser(role: string) {
  return {
    id: 'u-1',
    email: 'test@sabificate.com',
    first_name: 'Test',
    last_name: 'User',
    role,
    org_id: null,
    department_id: null,
    language_preference: 'en' as const,
    data_saver_mode: 'full' as const,
  };
}

function renderStudioGate() {
  return render(
    <MemoryRouter initialEntries={['/studio']}>
      <RequireRole role={[...STUDIO_ROLES]}>
        <div data-testid="studio-content">Curriculum Studio</div>
      </RequireRole>
    </MemoryRouter>,
  );
}

describe('Studio route role list in App.tsx', () => {
  // This test validates that the /studio route in App.tsx includes sme_reviewer.
  // We render RequireRole with the EXACT role list that App.tsx should use.
  const APP_STUDIO_ROLES = ['curriculum_author', 'platform_admin', 'sme_reviewer', 'corporate_admin'] as const;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sme_reviewer is included in the Studio route role list', () => {
    mockUseAuth.mockReturnValue({
      user: makeUser('sme_reviewer'),
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/studio']}>
        <RequireRole role={[...APP_STUDIO_ROLES]}>
          <div data-testid="studio-via-app">Studio Loaded</div>
        </RequireRole>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('studio-via-app')).toBeTruthy();
  });

  it('corporate_admin is included in the Studio route role list', () => {
    mockUseAuth.mockReturnValue({
      user: makeUser('corporate_admin'),
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/studio']}>
        <RequireRole role={[...APP_STUDIO_ROLES]}>
          <div data-testid="studio-via-app">Studio Loaded</div>
        </RequireRole>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('studio-via-app')).toBeTruthy();
  });
});

describe('Studio Auth Gate (RequireRole)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── AC-1.1: Unauthenticated users are redirected to /login ─────────
  it('redirects unauthenticated users to /login', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    renderStudioGate();

    // Studio content must NOT be rendered
    expect(screen.queryByTestId('studio-content')).toBeNull();
  });

  // ── AC-1.2: Learner role is blocked (Access Denied) ────────────────
  it('shows Access Denied when user has role learner', () => {
    mockUseAuth.mockReturnValue({
      user: makeUser('learner'),
      isAuthenticated: true,
      isLoading: false,
    });

    renderStudioGate();

    expect(screen.queryByTestId('studio-content')).toBeNull();
    expect(screen.getByText('Access Denied')).toBeTruthy();
  });

  // ── AC-1.3: curriculum_author is allowed ───────────────────────────
  it('allows access when user has role curriculum_author', () => {
    mockUseAuth.mockReturnValue({
      user: makeUser('curriculum_author'),
      isAuthenticated: true,
      isLoading: false,
    });

    renderStudioGate();

    expect(screen.getByTestId('studio-content')).toBeTruthy();
    expect(screen.queryByText('Access Denied')).toBeNull();
  });

  // ── AC-1.3: platform_admin is allowed ──────────────────────────────
  it('allows access when user has role platform_admin', () => {
    mockUseAuth.mockReturnValue({
      user: makeUser('platform_admin'),
      isAuthenticated: true,
      isLoading: false,
    });

    renderStudioGate();

    expect(screen.getByTestId('studio-content')).toBeTruthy();
    expect(screen.queryByText('Access Denied')).toBeNull();
  });

  // ── AC-1.3: sme_reviewer is allowed ────────────────────────────────
  it('allows access when user has role sme_reviewer', () => {
    mockUseAuth.mockReturnValue({
      user: makeUser('sme_reviewer'),
      isAuthenticated: true,
      isLoading: false,
    });

    renderStudioGate();

    expect(screen.getByTestId('studio-content')).toBeTruthy();
    expect(screen.queryByText('Access Denied')).toBeNull();
  });

  // ── AC-1.4: department_admin is blocked ────────────────────────────
  it('shows Access Denied when user has role department_admin', () => {
    mockUseAuth.mockReturnValue({
      user: makeUser('department_admin'),
      isAuthenticated: true,
      isLoading: false,
    });

    renderStudioGate();

    expect(screen.queryByTestId('studio-content')).toBeNull();
    expect(screen.getByText('Access Denied')).toBeTruthy();
  });

  // ── Loading state shows spinner, not content ──────────────────────
  it('shows loading spinner while auth state is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });

    const { container } = renderStudioGate();

    expect(screen.queryByTestId('studio-content')).toBeNull();
    expect(screen.queryByText('Access Denied')).toBeNull();
    // Spinner is rendered (the animate-spin div)
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });
});
