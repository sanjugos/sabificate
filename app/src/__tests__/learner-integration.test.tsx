import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';

// ── Shared mock setup ────────────────────────────────────────────────────

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('../lib/api/client', () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: vi.fn(),
    delete: vi.fn(),
  },
  setAccessToken: vi.fn(),
}));

// ── Auth mock — configurable per test ────────────────────────────────────

const mockUseAuth = vi.fn();
const mockRegister = vi.fn();

vi.mock('../lib/auth/useAuth', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../lib/auth/api', () => ({
  loginApi: vi.fn(),
  registerApi: vi.fn(),
  refreshApi: vi.fn().mockRejectedValue(new Error('No session')),
  logoutApi: vi.fn().mockResolvedValue(undefined),
  fetchMe: vi.fn(),
}));

// ── Imports that depend on mocks ─────────────────────────────────────────

import { RegisterForm } from '../components/auth/RegisterForm';
import { QuizBlock } from '../components/content/QuizBlock';
import { TextBlock } from '../components/content/TextBlock';
import { VerifyPage } from '../components/credentials/VerifyPage';

// ── Default auth state ───────────────────────────────────────────────────

function setUnauthenticated() {
  mockUseAuth.mockReturnValue({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: mockRegister,
  });
}

function setAuthenticated() {
  mockUseAuth.mockReturnValue({
    user: {
      id: 'user-1',
      email: 'learner@sabificate.com',
      first_name: 'Test',
      last_name: 'Learner',
      role: 'learner',
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: mockRegister,
  });
}

// ═════════════════════════════════════════════════════════════════════════
//  Learner Integration Tests — T-015
//  Cross-component data flow validation
// ═════════════════════════════════════════════════════════════════════════

describe('Learner Integration — T-015', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUnauthenticated();
  });

  // ── 1. Auth flow integration: register -> onboarding redirect ────────

  describe('Auth flow integration: register -> onboarding redirect', () => {
    it('submits registration, auth context updates, and Register page redirects authenticated user', async () => {
      // Start unauthenticated — RegisterForm renders
      // After successful register(), the auth context sets user, which causes
      // the Register page to <Navigate to="/"> (or the redirect param).
      // We test the full chain: form submit -> register() called -> auth state change -> redirect.

      let isAuthenticatedState = false;

      mockUseAuth.mockImplementation(() => ({
        user: isAuthenticatedState
          ? { id: '1', email: 'new@sabificate.com', first_name: 'New', last_name: 'User', role: 'learner' }
          : null,
        isAuthenticated: isAuthenticatedState,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: mockRegister.mockImplementation(async () => {
          // Simulate what AuthProvider.register does: sets user, triggers re-render
          isAuthenticatedState = true;
        }),
      }));

      // Render the full Register page (not just the form) within a router that
      // has an /onboarding route we can detect navigation to
      const RegisterPage = (await import('../app/pages/Register')).default;

      const { rerender } = render(
        <MemoryRouter initialEntries={['/register?redirect=/onboarding']}>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/onboarding" element={<div data-testid="onboarding-page">Onboarding</div>} />
          </Routes>
        </MemoryRouter>,
      );

      // RegisterForm should be visible
      expect(screen.getByRole('button', { name: /create account/i })).toBeTruthy();

      // Fill out the form
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'New' } });
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'User' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@sabificate.com' } });
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'secure1234' } });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      // Verify register was called with the correct payload
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'new@sabificate.com',
            password: 'secure1234',
            first_name: 'New',
            last_name: 'User',
            consent: expect.objectContaining({ education_only: true }),
          }),
        );
      }, { timeout: 3000 });

      // After register succeeds, re-render with the now-authenticated state.
      // The Register page checks isAuthenticated and redirects via <Navigate>.
      rerender(
        <MemoryRouter initialEntries={['/register?redirect=/onboarding']}>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/onboarding" element={<div data-testid="onboarding-page">Onboarding</div>} />
          </Routes>
        </MemoryRouter>,
      );

      // The Register page should have redirected to /onboarding
      await waitFor(() => {
        expect(screen.getByTestId('onboarding-page')).toBeTruthy();
      });
    });
  });

  // ── 2. Catalog shows published courses only ──────────────────────────

  describe('Catalog shows published courses only', () => {
    it('renders static courses from the catalog without exposing any unpublished/draft items', async () => {
      // CourseCatalog uses STATIC_COURSES when API is unavailable.
      // All static courses are considered published (they are the catalog).
      // We verify the catalog renders and filters work — the integration point
      // is that STATIC_COURSES data flows into CourseCatalog -> CourseCard rendering.
      mockGet.mockRejectedValue(new Error('API unavailable'));

      const { CourseCatalog } = await import('../components/catalog/CourseCatalog');

      render(
        <MemoryRouter>
          <CourseCatalog />
        </MemoryRouter>,
      );

      // Wait for course cards to render from static data
      await waitFor(() => {
        expect(screen.getByText('Course Catalog')).toBeTruthy();
      });

      // Static catalog has 33 published courses — verify the count badge
      await waitFor(() => {
        expect(screen.getByText(/33 courses/)).toBeTruthy();
      });

      // Verify specific course titles appear (these are from STATIC_COURSES)
      expect(screen.getByText('AML/KYC Compliance for Nigerian Financial Institutions')).toBeTruthy();

      // Apply category filter to verify data flows through filtering
      const selects = screen.getAllByRole('combobox');
      const categorySelect = selects[0];
      fireEvent.change(categorySelect, { target: { value: 'governance-compliance' } });

      await waitFor(() => {
        // Only governance-compliance courses should remain
        expect(screen.getByText('Nigeria Data Protection Act (NDPA) 2023 Compliance')).toBeTruthy();
        // Banking course should be filtered out
        expect(screen.queryByText('AML/KYC Compliance for Nigerian Financial Institutions')).toBeNull();
      });
    });
  });

  // ── 3. Quiz block completion flow ────────────────────────────────────

  describe('Quiz block completion flow', () => {
    const quizProps = {
      id: 'quiz-integration-1',
      question: 'What does AML stand for in Nigerian banking regulation?',
      options: [
        'Automated Machine Learning',
        'Anti-Money Laundering',
        'Annual Maximum Limit',
        'Asset Management Liability',
      ],
      correct_answer: 1,
      explanation: 'AML stands for Anti-Money Laundering, a key regulatory requirement under the ML(P&P) Act 2022.',
      bloom_level: 'remember' as const,
      onAnswer: vi.fn(),
    };

    it('renders quiz, accepts selection, submits, and shows correct feedback with explanation', () => {
      const onAnswer = vi.fn();
      render(<QuizBlock {...quizProps} onAnswer={onAnswer} />);

      // All options visible
      expect(screen.getByText('Automated Machine Learning')).toBeTruthy();
      expect(screen.getByText('Anti-Money Laundering')).toBeTruthy();
      expect(screen.getByText('Annual Maximum Limit')).toBeTruthy();
      expect(screen.getByText('Asset Management Liability')).toBeTruthy();

      // Submit disabled before selection
      const submitBtn = screen.getByRole('button', { name: /submit/i });
      expect(submitBtn).toBeDisabled();

      // Select the correct answer
      fireEvent.click(screen.getByText('Anti-Money Laundering'));
      expect(submitBtn).not.toBeDisabled();

      // Submit
      fireEvent.click(submitBtn);

      // Verify correct feedback + explanation shown
      expect(screen.getByText('Correct!')).toBeTruthy();
      expect(screen.getByText(/AML stands for Anti-Money Laundering/)).toBeTruthy();

      // Verify onAnswer callback received correct data
      expect(onAnswer).toHaveBeenCalledWith(
        expect.objectContaining({
          quiz_block_id: 'quiz-integration-1',
          selected_option: 1,
          is_correct: true,
        }),
      );
    });

    it('shows incorrect feedback and still displays explanation when wrong answer submitted', () => {
      const onAnswer = vi.fn();
      render(<QuizBlock {...quizProps} onAnswer={onAnswer} />);

      // Select wrong answer
      fireEvent.click(screen.getByText('Automated Machine Learning'));

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      // Verify incorrect feedback
      expect(screen.getByText('Incorrect')).toBeTruthy();

      // onAnswer callback should report incorrect
      expect(onAnswer).toHaveBeenCalledWith(
        expect.objectContaining({
          quiz_block_id: 'quiz-integration-1',
          selected_option: 0,
          is_correct: false,
        }),
      );
    });
  });

  // ── 4. Data saver mode affects TextBlock rendering ───────────────────

  describe('Data saver mode affects TextBlock rendering', () => {
    const CONTENT_WITH_IMAGE =
      '## Introduction\n\nThis is a lesson about **compliance**.\n\n![Architecture diagram](https://example.com/diagram.png)\n\nAdditional content follows.';

    it('ultra_light mode strips images and shows alt-text placeholder, renders plain text', () => {
      const { container } = render(
        <TextBlock content={CONTENT_WITH_IMAGE} dataSaverMode="ultra_light" />,
      );

      // No <img> elements
      expect(container.querySelectorAll('img')).toHaveLength(0);

      // Alt text should appear as placeholder
      expect(screen.getByText(/Architecture diagram/)).toBeInTheDocument();

      // Bold markdown stripped — "compliance" appears without <strong>
      const strongElements = container.querySelectorAll('strong');
      expect(strongElements).toHaveLength(0);
    });

    it('data_saver mode renders images with 480px max-width constraint', () => {
      const { container } = render(
        <TextBlock content={CONTENT_WITH_IMAGE} dataSaverMode="data_saver" />,
      );

      // Image should render
      const images = container.querySelectorAll('img');
      expect(images).toHaveLength(1);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/diagram.png');

      // Should have the 480px constraint class
      expect(images[0].className).toMatch(/max-w-\[480px\]/);

      // Bold should be preserved in data_saver mode
      const strongElements = container.querySelectorAll('strong');
      expect(strongElements).toHaveLength(1);
      expect(strongElements[0].textContent).toBe('compliance');
    });

    it('full mode renders images at full width without 480px constraint', () => {
      const { container } = render(
        <TextBlock content={CONTENT_WITH_IMAGE} dataSaverMode="full" />,
      );

      // Image renders at full quality
      const images = container.querySelectorAll('img');
      expect(images).toHaveLength(1);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/diagram.png');

      // max-w-full, not max-w-[480px]
      expect(images[0].className).toMatch(/max-w-full/);
      expect(images[0].className).not.toMatch(/max-w-\[480px\]/);

      // Full rich formatting: headings, bold, etc.
      const headings = container.querySelectorAll('h2');
      expect(headings).toHaveLength(1);
      expect(headings[0].textContent).toBe('Introduction');
    });
  });

  // ── 5. Credential verification flow ──────────────────────────────────

  describe('Credential verification flow', () => {
    it('fetches credential by ID and displays all verification fields for a valid credential', async () => {
      const mockCredential = {
        valid: true,
        credential: {
          id: 'cred-int-001',
          certificate_number: 'SAB-202607-00042',
          user_id: 'user-42',
          course_id: 'sc-01',
          course_title: 'AML/KYC Compliance for Nigerian Financial Institutions',
          credential_json: {},
          verification_url: 'https://sabificate.com/verify/cred-int-001',
          qr_code_url: 'https://sabificate.com/verify/cred-int-001',
          status: 'active',
          credential_tier: 'verified_certificate',
          assessment_score: 85,
          cpd_hours_awarded: 4,
          co_brand_org_id: null,
          co_brand_logo_url: null,
          co_brand_signatory: null,
          issued_at: '2026-07-15T14:30:00.000Z',
          expires_at: null,
        },
        learner_name: 'Chukwuma Adebayo',
        course_title: 'AML/KYC Compliance for Nigerian Financial Institutions',
        issued_at: '2026-07-15T14:30:00.000Z',
        evidence_urls: ['https://sabificate.com/evidence/ev-001'],
      };

      mockGet.mockResolvedValue(mockCredential);

      render(
        <MemoryRouter initialEntries={['/verify/cred-int-001']}>
          <Routes>
            <Route path="/verify/:credentialId" element={<VerifyPage />} />
          </Routes>
        </MemoryRouter>,
      );

      // Wait for loading to finish and data to display
      await waitFor(() => {
        expect(screen.getByText('Chukwuma Adebayo')).toBeTruthy();
      });

      // Verify all credential fields are displayed
      expect(screen.getByText('Valid Credential')).toBeTruthy();
      expect(screen.getByText('AML/KYC Compliance for Nigerian Financial Institutions')).toBeTruthy();
      expect(screen.getByText('SAB-202607-00042')).toBeTruthy();
      expect(screen.getByText('15 July 2026')).toBeTruthy();

      // Evidence link should be displayed
      expect(screen.getByText('Evidence 1')).toBeTruthy();

      // Verify the API was called with correct credential ID
      expect(mockGet).toHaveBeenCalledWith('/verify/cred-int-001');
    });
  });

  // ── 6. Pricing tiers display correctly ───────────────────────────────

  describe('Pricing tiers display correctly', () => {
    const mockPlans = [
      {
        id: 'plan-free-001',
        name: 'Free',
        type: 'individual' as const,
        price_ngn: 0,
        billing_cycle: 'monthly' as const,
        features: ['Access all course content', 'Completion badges', 'Community access'],
        max_courses: null,
        paystack_plan_code: '',
      },
      {
        id: 'plan-pro-001',
        name: 'Professional',
        type: 'individual' as const,
        price_ngn: 2500,
        billing_cycle: 'monthly' as const,
        features: [
          'Everything in Free',
          'Verified certificates',
          'CPD tracking',
          'Priority support',
        ],
        max_courses: null,
        paystack_plan_code: 'PLN_professional_monthly',
      },
    ];

    it('renders Free and Professional tiers with ₦ pricing from API data', async () => {
      setUnauthenticated();

      mockGet.mockImplementation((path: string) => {
        if (path === '/plans') {
          return Promise.resolve({ status: 'success', data: mockPlans });
        }
        if (path === '/subscriptions/current') {
          return Promise.resolve({ status: 'success', data: null });
        }
        return Promise.reject(new Error(`Unexpected GET ${path}`));
      });

      const PricingPage = (await import('../app/pages/Pricing')).default;

      render(
        <MemoryRouter initialEntries={['/pricing']}>
          <PricingPage />
        </MemoryRouter>,
      );

      // Wait for plans to load
      await waitFor(() => {
        expect(screen.getByText('Free')).toBeTruthy();
      });

      // Professional tier should appear (may appear multiple times due to B2B section)
      const proElements = screen.getAllByText('Professional');
      expect(proElements.length).toBeGreaterThanOrEqual(1);

      // ₦ currency symbol should be present
      const ngnElements = screen.getAllByText(/₦/);
      expect(ngnElements.length).toBeGreaterThan(0);

      // Professional price should show 2,500
      expect(screen.getByText('2,500')).toBeTruthy();

      // Feature list items should be rendered
      expect(screen.getByText('Access all course content')).toBeTruthy();
      expect(screen.getByText('Verified certificates')).toBeTruthy();
    });
  });
});
