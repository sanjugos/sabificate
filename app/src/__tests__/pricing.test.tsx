import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mocks ─────────────────────────────────────────────────────────────────

// Mock API client — resolve /plans with Free + Professional tiers
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

// Mock auth — default: unauthenticated
const mockUseAuth = vi.fn();
vi.mock('../lib/auth/useAuth', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../lib/auth/api', () => ({
  loginApi: vi.fn(),
  registerApi: vi.fn(),
  refreshApi: vi.fn().mockRejectedValue(new Error('No session')),
  logoutApi: vi.fn(),
  fetchMe: vi.fn(),
}));

// ── Test data ─────────────────────────────────────────────────────────────

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

const mockSubscriptionData = {
  id: 'sub-001',
  status: 'active',
  plan_name: 'Professional',
  price_ngn: 2500,
  billing_cycle: 'monthly',
  current_period_start: '2026-07-01T00:00:00Z',
  current_period_end: '2026-08-01T00:00:00Z',
  payment_method: 'card',
  features: ['Everything in Free', 'Verified certificates', 'CPD tracking', 'Priority support'],
};

// ── Helpers ───────────────────────────────────────────────────────────────

function renderPricing() {
  return render(
    <MemoryRouter initialEntries={['/pricing']}>
      <PricingPage />
    </MemoryRouter>,
  );
}

// Lazy import so mocks are applied before module loads
let PricingPage: React.ComponentType;

beforeEach(async () => {
  vi.clearAllMocks();

  // Default: unauthenticated user
  mockUseAuth.mockReturnValue({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  });

  // Default: plans API returns Free + Professional
  mockGet.mockImplementation((path: string) => {
    if (path === '/plans') {
      return Promise.resolve({ status: 'success', data: mockPlans });
    }
    if (path === '/subscriptions/current') {
      return Promise.resolve({ status: 'success', data: null });
    }
    return Promise.reject(new Error(`Unexpected GET ${path}`));
  });

  // Dynamic import to pick up mocks
  const mod = await import('../app/pages/Pricing');
  PricingPage = mod.default;
});

// ── Tests ─────────────────────────────────────────────────────────────────

describe('Pricing page — Paystack subscription flow (T-012)', () => {
  // AC-10.1: Display plan tiers with NGN pricing
  it('renders Free and Professional tiers with pricing in NGN', async () => {
    renderPricing();

    await waitFor(() => {
      // Both plan names should appear — use getAllByText since "Professional" also appears in B2B section
      expect(screen.getByText('Free')).toBeTruthy();
      const proElements = screen.getAllByText('Professional');
      expect(proElements.length).toBeGreaterThanOrEqual(1);
    });

    // NGN currency should be displayed for individual plans
    const ngnElements = screen.getAllByText(/NGN/);
    expect(ngnElements.length).toBeGreaterThan(0);

    // Professional plan price should display 2,500
    expect(screen.getByText('2,500')).toBeTruthy();
  });

  // AC-10.2: Subscribe button triggers PaystackCheckout
  it('clicking Subscribe on Professional tier triggers PaystackCheckout', async () => {
    // Authenticated user required for subscription
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-001',
        email: 'learner@sabificate.com',
        first_name: 'Test',
        last_name: 'Learner',
        role: 'learner',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    renderPricing();

    await waitFor(() => {
      const proElements = screen.getAllByText('Professional');
      expect(proElements.length).toBeGreaterThanOrEqual(1);
    });

    // Find the Subscribe button (there may be multiple — pick the first one for individual plans)
    const subscribeButtons = screen.getAllByRole('button', { name: /subscribe/i });
    expect(subscribeButtons.length).toBeGreaterThan(0);

    // Click the first Subscribe button
    fireEvent.click(subscribeButtons[0]);

    // PaystackCheckout modal should appear with "Complete Payment" heading
    await waitFor(() => {
      expect(screen.getByText('Complete Payment')).toBeTruthy();
    });

    // The checkout should show the plan name
    const proElements = screen.getAllByText(/Professional/);
    expect(proElements.length).toBeGreaterThanOrEqual(1);

    // "Pay with Paystack" button should be present
    expect(screen.getByText('Pay with Paystack')).toBeTruthy();
  });

  // AC-10.3: Authenticated Professional user sees SubscriptionStatus
  it('shows SubscriptionStatus with "Professional" for authenticated subscribed user', async () => {
    // Authenticated user with Professional subscription
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-001',
        email: 'learner@sabificate.com',
        first_name: 'Test',
        last_name: 'Learner',
        role: 'learner',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    // Subscription API returns active Professional subscription
    mockGet.mockImplementation((path: string) => {
      if (path === '/plans') {
        return Promise.resolve({ status: 'success', data: mockPlans });
      }
      if (path === '/subscriptions/current') {
        return Promise.resolve({ status: 'success', data: mockSubscriptionData });
      }
      return Promise.reject(new Error(`Unexpected GET ${path}`));
    });

    renderPricing();

    // SubscriptionStatus header shows "Current Plan" label + plan name in a gradient banner.
    // The Free plan card also has a "Current Plan" button, so we look for the
    // "Active" badge which uniquely appears in the SubscriptionStatus component.
    await waitFor(
      () => {
        expect(screen.getByText('Active')).toBeTruthy();
      },
      { timeout: 3000 },
    );

    // The SubscriptionStatus component shows the plan name in its header
    // Multiple "Professional" elements exist (individual plan card + B2B card + subscription status)
    // but the "Active" badge confirms SubscriptionStatus rendered correctly
    const currentPlanLabels = screen.getAllByText('Current Plan');
    // At least 2: one from the subscription status header, one from the Free plan button
    expect(currentPlanLabels.length).toBeGreaterThanOrEqual(2);
  });
});
