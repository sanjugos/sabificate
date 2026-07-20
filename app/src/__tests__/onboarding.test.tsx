import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mock data ────────────────────────────────────────────────────────────

const MOCK_PERSONAS = [
  {
    id: 'p1',
    vertical: 'financial-literacy',
    slug: 'new-graduate',
    label: 'New Graduate',
    description: 'Fresh out of school, ready to learn the ropes.',
    icon_svg: null,
    default_proficiency: 'foundational',
    default_customer_tier: 'freemium',
    sort_order: 1,
    calibration_questions: [
      {
        id: 'q1',
        persona_id: 'p1',
        question_text: 'How familiar are you with personal budgeting?',
        options: ['Not at all', 'Somewhat', 'Very familiar'],
        proficiency_map: { '0': 'foundational', '1': 'working', '2': 'applied' },
        sort_order: 1,
      },
    ],
  },
  {
    id: 'p2',
    vertical: 'financial-literacy',
    slug: 'mid-career-professional',
    label: 'Mid-Career Professional',
    description: 'Working professional looking to upskill.',
    icon_svg: null,
    default_proficiency: 'working',
    default_customer_tier: 'upskilling',
    sort_order: 2,
    calibration_questions: [
      {
        id: 'q2',
        persona_id: 'p2',
        question_text: 'How do you manage team budgets?',
        options: ['Never done it', 'Sometimes', 'Regularly'],
        proficiency_map: { '0': 'foundational', '1': 'working', '2': 'applied' },
        sort_order: 1,
      },
    ],
  },
];

// ── Mocks ────────────────────────────────────────────────────────────────

const mockApiGet = vi.fn();
const mockApiPost = vi.fn();

vi.mock('../lib/api/client', () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: (...args: unknown[]) => mockApiPost(...args),
    put: vi.fn(),
    delete: vi.fn(),
  },
  setAccessToken: vi.fn(),
}));

// Mock useAuth to return an authenticated user directly
vi.mock('../lib/auth/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@sabificate.com', first_name: 'Test', last_name: 'User', role: 'learner' },
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    isAuthenticated: true,
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import Onboarding from '../app/pages/Onboarding';

// ── Test suite ───────────────────────────────────────────────────────────

describe('Onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGet.mockResolvedValue({ personas: MOCK_PERSONAS });
    mockApiPost.mockResolvedValue({ status: 'success' });
  });

  function renderOnboarding() {
    return render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <Onboarding />
      </MemoryRouter>,
    );
  }

  // ── Test 1: Persona cards render ─────────────────────────────────────

  it('renders persona cards after loading mock data', async () => {
    renderOnboarding();

    // Wait for persona labels to appear in the DOM
    await waitFor(() => {
      expect(screen.getByText('New Graduate')).toBeTruthy();
    }, { timeout: 5000 });

    expect(screen.getByText('Mid-Career Professional')).toBeTruthy();
    expect(screen.getByText('Fresh out of school, ready to learn the ropes.')).toBeTruthy();
    expect(screen.getByText('Working professional looking to upskill.')).toBeTruthy();
  });

  // ── Test 2: Clicking persona advances to calibration screen ──────────

  it('advances to calibration screen when a persona card is clicked', async () => {
    renderOnboarding();

    // Wait for personas to load
    await waitFor(() => {
      expect(screen.getByText('New Graduate')).toBeTruthy();
    }, { timeout: 5000 });

    // Click the "New Graduate" persona card
    const personaButton = screen.getByText('New Graduate').closest('button')!;
    fireEvent.click(personaButton);

    // Should now show calibration screen (screen 2) with the question text
    await waitFor(() => {
      expect(screen.getByText('Quick check')).toBeTruthy();
    });

    expect(screen.getByText('How familiar are you with personal budgeting?')).toBeTruthy();
    expect(screen.getByText('Not at all')).toBeTruthy();
    expect(screen.getByText('Somewhat')).toBeTruthy();
    expect(screen.getByText('Very familiar')).toBeTruthy();
  });

  // ── Test 3: flushSync is imported and used ───────────────────────────

  it('imports and uses flushSync from react-dom', async () => {
    // Verify the Onboarding source imports flushSync
    const fs = await import('fs');
    const path = await import('path');
    const source = fs.readFileSync(
      path.resolve(__dirname, '../app/pages/Onboarding.tsx'),
      'utf-8',
    );

    // Check for the import statement
    expect(source).toContain("import { flushSync } from 'react-dom'");
    // Check that flushSync is actually called (not just imported)
    expect(source).toContain('flushSync(');
  });
});
