import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { SubscriptionPlan } from '../../../contracts/api/payments';
import { api } from '../../lib/api/client';
import { useAuth } from '../../lib/auth/useAuth';
import PaystackCheckout from '../../components/payments/PaystackCheckout';
import SubscriptionStatus from '../../components/payments/SubscriptionStatus';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

function billingLabel(cycle: string): string {
  switch (cycle) {
    case 'monthly':
      return '/month';
    case 'quarterly':
      return '/quarter';
    case 'annual':
      return '/year';
    default:
      return `/${cycle}`;
  }
}

// ── Static B2B data (not yet API-driven) ──────────────────────────────────

const b2bPlans = [
  {
    name: 'Compliance Essentials',
    price: '3,500',
    period: '/seat/month',
    currency: 'NGN',
  },
  {
    name: 'Professional',
    price: '5,500',
    period: '/seat/month',
    currency: 'NGN',
  },
  {
    name: 'Enterprise',
    price: '8,000',
    period: '/seat/month',
    currency: 'NGN',
  },
];

// ── Fallback plan data (used when API is unavailable) ─────────────────────

const FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    id: 'fallback-free',
    name: 'Free',
    type: 'individual',
    price_ngn: 0,
    billing_cycle: 'monthly',
    features: ['Access all course content', 'Completion badges', 'Community access'],
    max_courses: null,
    paystack_plan_code: '',
  },
  {
    id: 'fallback-professional',
    name: 'Professional',
    type: 'individual',
    price_ngn: 2500,
    billing_cycle: 'monthly',
    features: [
      'Everything in Free',
      'Verified certificates',
      'CPD tracking',
      'Priority support',
    ],
    max_courses: null,
    paystack_plan_code: 'PLN_professional_monthly',
  },
  {
    id: 'fallback-annual',
    name: 'Annual',
    type: 'individual',
    price_ngn: 24000,
    billing_cycle: 'annual',
    features: ['Everything in Professional', '2 months free'],
    max_courses: null,
    paystack_plan_code: 'PLN_professional_annual',
  },
];

// ── Component ──────────────────────────────────────────────────────────────

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // Fetch plans from API
  useEffect(() => {
    let cancelled = false;

    async function fetchPlans() {
      try {
        const json = await api.get<{ data: SubscriptionPlan[] }>('/plans');
        if (!cancelled) {
          // Filter to individual plans for this section
          const individualPlans = json.data.filter((p) => p.type === 'individual');
          setPlans(individualPlans.length > 0 ? individualPlans : FALLBACK_PLANS);
        }
      } catch {
        // Fallback to static data on API failure
        if (!cancelled) {
          setPlans(FALLBACK_PLANS);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchPlans();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSubscribe(plan: SubscriptionPlan) {
    setSelectedPlan(plan);
  }

  function handleCheckoutSuccess(reference: string) {
    setSelectedPlan(null);
    // Reload page to reflect new subscription status
    window.location.reload();
  }

  function handleCheckoutClose() {
    setSelectedPlan(null);
  }

  // Determine which plans are "highlight" (non-free, monthly)
  function isHighlighted(plan: SubscriptionPlan): boolean {
    return plan.price_ngn > 0 && plan.billing_cycle === 'monthly';
  }

  // Determine if plan is the Free tier
  function isFreePlan(plan: SubscriptionPlan): boolean {
    return plan.price_ngn === 0;
  }

  // Compute annual savings label
  function savingsLabel(plan: SubscriptionPlan): string | null {
    if (plan.billing_cycle !== 'annual' || plan.price_ngn === 0) return null;
    // Compare against monthly equivalent
    const monthlyPlan = plans.find(
      (p) => p.billing_cycle === 'monthly' && p.price_ngn > 0 && p.type === plan.type,
    );
    if (!monthlyPlan) return null;
    const annualEquivalent = monthlyPlan.price_ngn * 12;
    const savings = annualEquivalent - plan.price_ngn;
    if (savings > 0) {
      return `Save NGN ${new Intl.NumberFormat('en-NG').format(savings)}`;
    }
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Choose Your Plan
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Invest in your professional development with Nigeria's premier
          compliance education platform.
        </p>
      </div>

      {/* Subscription Status for authenticated users */}
      {isAuthenticated && (
        <div className="mb-12">
          <SubscriptionStatus />
        </div>
      )}

      {/* Individual Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {plans.map((plan) => {
          const highlighted = isHighlighted(plan);
          const free = isFreePlan(plan);
          const savings = savingsLabel(plan);

          return (
            <div
              key={plan.id}
              className={`rounded-xl border p-8 flex flex-col ${
                highlighted
                  ? 'border-blue-600 ring-2 ring-blue-600 shadow-lg'
                  : 'border-gray-200 shadow-sm'
              }`}
            >
              {highlighted && (
                <span className="inline-block self-start bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
                  Most Popular
                </span>
              )}
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h2>
              <div className="mb-6">
                <span className="text-sm text-gray-500">NGN </span>
                <span className="text-4xl font-bold text-gray-900">
                  {new Intl.NumberFormat('en-NG').format(plan.price_ngn)}
                </span>
                <span className="text-gray-500">{billingLabel(plan.billing_cycle)}</span>
                {savings && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    {savings}
                  </p>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                    <svg
                      className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              {free ? (
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-lg text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : isAuthenticated ? (
                <button
                  onClick={() => handleSubscribe(plan)}
                  className={`w-full py-3 px-4 rounded-lg text-sm font-semibold text-center ${
                    highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  Subscribe
                </button>
              ) : (
                <Link
                  to="/login"
                  className={`w-full py-3 px-4 rounded-lg text-sm font-semibold text-center block ${
                    highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  Subscribe
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* B2B Section */}
      <div className="border-t border-gray-200 pt-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            For Organizations
          </h2>
          <p className="text-gray-600">
            Empower your team with compliance training at scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {b2bPlans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-xl border border-gray-200 p-8 shadow-sm"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <div className="mb-4">
                <span className="text-sm text-gray-500">{plan.currency} </span>
                <span className="text-3xl font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-gray-500">{plan.period}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="mailto:sales@sabificate.com?subject=Enterprise%20Pricing%20Inquiry"
            className="inline-block py-3 px-8 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800"
          >
            Contact Sales
          </a>
        </div>
      </div>

      {/* PaystackCheckout modal */}
      {selectedPlan && (
        <PaystackCheckout
          plan={selectedPlan}
          paymentType="subscription"
          onSuccess={handleCheckoutSuccess}
          onClose={handleCheckoutClose}
        />
      )}
    </div>
  );
}
