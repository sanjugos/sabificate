import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mock data ────────────────────────────────────────────────────────────

const MOCK_DASHBOARD_IN_PROGRESS = {
  enrolled_courses: [
    {
      course_id: 'c1',
      course_title: 'AML/KYC Compliance',
      course_slug: 'aml-kyc-compliance',
      progress_percent: 40,
      lessons_completed: 4,
      lessons_total: 10,
      last_accessed_at: '2026-07-19T10:00:00.000Z',
      difficulty_tier: 'working',
    },
    {
      course_id: 'c2',
      course_title: 'Data Protection Act',
      course_slug: 'data-protection-act',
      progress_percent: 75,
      lessons_completed: 6,
      lessons_total: 8,
      last_accessed_at: '2026-07-18T10:00:00.000Z',
      difficulty_tier: 'foundational',
    },
  ],
  recent_activity: [],
  stats: {
    courses_completed: 0,
    lessons_completed: 10,
    total_learning_hours: 5.2,
    current_streak_days: 3,
  },
};

const MOCK_DASHBOARD_COMPLETED = {
  enrolled_courses: [
    {
      course_id: 'c3',
      course_title: 'Corporate Governance',
      course_slug: 'corporate-governance',
      progress_percent: 100,
      lessons_completed: 12,
      lessons_total: 12,
      last_accessed_at: '2026-07-17T10:00:00.000Z',
      difficulty_tier: 'applied',
    },
    {
      course_id: 'c4',
      course_title: 'Financial Analysis',
      course_slug: 'financial-analysis',
      progress_percent: 50,
      lessons_completed: 5,
      lessons_total: 10,
      last_accessed_at: '2026-07-16T10:00:00.000Z',
      difficulty_tier: 'working',
    },
  ],
  recent_activity: [],
  stats: {
    courses_completed: 1,
    lessons_completed: 17,
    total_learning_hours: 8.5,
    current_streak_days: 5,
  },
};

const MOCK_DASHBOARD_WITH_RECOMMENDATION = {
  enrolled_courses: [
    {
      course_id: 'c5',
      course_title: 'Basic Budgeting',
      course_slug: 'basic-budgeting',
      progress_percent: 100,
      lessons_completed: 6,
      lessons_total: 6,
      last_accessed_at: '2026-07-15T10:00:00.000Z',
      difficulty_tier: 'foundational',
    },
  ],
  recent_activity: [],
  stats: {
    courses_completed: 1,
    lessons_completed: 6,
    total_learning_hours: 3,
    current_streak_days: 1,
  },
  recommended_courses: [
    {
      course_id: 'c6',
      course_title: 'Advanced Financial Planning',
      course_slug: 'advanced-financial-planning',
      difficulty_tier: 'working',
      category: 'Banking & Finance',
    },
  ],
};

// ── Mocks ────────────────────────────────────────────────────────────────

const mockApiGet = vi.fn();

vi.mock('../lib/api/client', () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  setAccessToken: vi.fn(),
}));

vi.mock('../lib/auth/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      email: 'test@sabificate.com',
      first_name: 'Amina',
      last_name: 'Okafor',
      role: 'learner',
      org_id: null,
      department_id: null,
      language_preference: 'en',
      data_saver_mode: 'full',
    },
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    isAuthenticated: true,
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import Dashboard from '../app/pages/Dashboard';

// ── Test suite ──────────────────────────────────────────────────────────

describe('Dashboard — Progress Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderDashboard() {
    return render(
      <MemoryRouter initialEntries={['/']}>
        <Dashboard />
      </MemoryRouter>,
    );
  }

  // ── AC-5.1: Progress percentages displayed ─────────────────────────

  it('renders 2 in-progress courses with their progress percentages', async () => {
    mockApiGet.mockImplementation((path: string) => {
      if (path === '/learner/persona') {
        return Promise.resolve({ persona: { id: 'p1', persona_slug: 'new-graduate' } });
      }
      if (path === '/learner/dashboard') {
        return Promise.resolve(MOCK_DASHBOARD_IN_PROGRESS);
      }
      return Promise.reject(new Error('Unknown path'));
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('AML/KYC Compliance')).toBeTruthy();
    }, { timeout: 5000 });

    expect(screen.getByText('Data Protection Act')).toBeTruthy();

    // Progress percentages should be displayed
    expect(screen.getByText('40% complete')).toBeTruthy();
    expect(screen.getByText('75% complete')).toBeTruthy();

    // Both should be in the "In Progress" section
    expect(screen.getByText('In Progress')).toBeTruthy();
  });

  // ── AC-5.2: Completed section shows completed courses ─────────────

  it('renders a "Completed" section with 1 completed course card', async () => {
    mockApiGet.mockImplementation((path: string) => {
      if (path === '/learner/persona') {
        return Promise.resolve({ persona: { id: 'p1', persona_slug: 'new-graduate' } });
      }
      if (path === '/learner/dashboard') {
        return Promise.resolve(MOCK_DASHBOARD_COMPLETED);
      }
      return Promise.reject(new Error('Unknown path'));
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Corporate Governance')).toBeTruthy();
    }, { timeout: 5000 });

    // There should be a "Completed" section
    expect(screen.getByText('Completed')).toBeTruthy();

    // The completed course (100%) should show in the Completed section
    expect(screen.getByText('Corporate Governance')).toBeTruthy();

    // The in-progress course should show separately
    expect(screen.getByText('Financial Analysis')).toBeTruthy();
    expect(screen.getByText('50% complete')).toBeTruthy();
  });

  // ── AC-5.3: Recommended Next section matches user persona ─────────

  it('renders a "Recommended Next" section with a course matching user persona', async () => {
    mockApiGet.mockImplementation((path: string) => {
      if (path === '/learner/persona') {
        return Promise.resolve({ persona: { id: 'p1', persona_slug: 'new-graduate' } });
      }
      if (path === '/learner/dashboard') {
        return Promise.resolve(MOCK_DASHBOARD_WITH_RECOMMENDATION);
      }
      return Promise.reject(new Error('Unknown path'));
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Recommended Next')).toBeTruthy();
    }, { timeout: 5000 });

    // The recommended course should be visible
    expect(screen.getByText('Advanced Financial Planning')).toBeTruthy();
  });
});
