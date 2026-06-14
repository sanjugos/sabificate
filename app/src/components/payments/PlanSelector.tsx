import { useState, useEffect } from 'react';
import type { SubscriptionPlan } from '../../../contracts/api/payments';

type BillingCycle = 'monthly' | 'quarterly' | 'annual';

interface PlanSelectorProps {
  onSelectPlan: (plan: SubscriptionPlan) => void;
}

const CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
};

const CYCLE_SAVINGS: Record<BillingCycle, string> = {
  monthly: '',
  quarterly: 'Save 10%',
  annual: 'Save 20%',
};

function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function PlanSelector({ onSelectPlan }: PlanSelectorProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch('/api/v1/plans');
        if (!res.ok) throw new Error('Failed to fetch plans');
        const json = (await res.json()) as { data: SubscriptionPlan[] };
        setPlans(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load plans');
      } finally {
        setLoading(false);
      }
    }
    void fetchPlans();
  }, []);

  const filteredPlans = plans.filter((p) => p.billing_cycle === cycle);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
        Choose Your Plan
      </h2>
      <p className="text-gray-500 text-center mb-8">
        Start learning with SABIficate today
      </p>

      {/* Billing cycle toggle */}
      <div className="flex items-center justify-center gap-1 mb-8 bg-gray-100 rounded-lg p-1 w-fit mx-auto">
        {(Object.keys(CYCLE_LABELS) as BillingCycle[]).map((c) => (
          <button
            key={c}
            onClick={() => setCycle(c)}
            className={`relative px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              cycle === c
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {CYCLE_LABELS[c]}
            {CYCLE_SAVINGS[c] && (
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {CYCLE_SAVINGS[c]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Plans grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlans.map((plan) => (
          <div
            key={plan.id}
            className="relative flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="mb-4">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  plan.type === 'corporate'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {plan.type === 'corporate' ? 'Corporate' : 'Individual'}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {plan.name}
            </h3>

            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">
                {formatNGN(plan.price_ngn)}
              </span>
              <span className="text-gray-500 text-sm">
                /{cycle === 'monthly' ? 'mo' : cycle === 'quarterly' ? 'qtr' : 'yr'}
              </span>
            </div>

            <ul className="flex-1 space-y-2 mb-6">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <svg
                    className="h-4 w-4 mt-0.5 shrink-0 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
              {plan.max_courses !== null && (
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <svg
                    className="h-4 w-4 mt-0.5 shrink-0 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Up to {plan.max_courses} courses
                </li>
              )}
            </ul>

            <button
              onClick={() => onSelectPlan(plan)}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Subscribe
            </button>
          </div>
        ))}
      </div>

      {filteredPlans.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          No plans available for {CYCLE_LABELS[cycle].toLowerCase()} billing.
        </p>
      )}
    </div>
  );
}
