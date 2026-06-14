import { useState, useEffect } from 'react';

interface SubscriptionData {
  id: string;
  status: 'active' | 'past_due' | 'cancelled' | 'expired';
  plan_name: string;
  price_ngn: number;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  payment_method: 'card' | 'bank_transfer' | 'ussd' | null;
  features: string[];
}

interface SubscriptionStatusProps {
  onManage?: () => void;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
  past_due: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Past Due' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
  expired: { bg: 'bg-red-100', text: 'text-red-800', label: 'Expired' },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: 'Debit/Credit Card',
  bank_transfer: 'Bank Transfer',
  ussd: 'USSD',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function SubscriptionStatus({ onManage }: SubscriptionStatusProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('/api/v1/subscriptions/current', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch subscription');
        const json = (await res.json()) as { data: SubscriptionData | null };
        setSubscription(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load subscription');
      } finally {
        setLoading(false);
      }
    }
    void fetchSubscription();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl bg-white border border-gray-200 p-6">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-64 bg-gray-200 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700">
        {error}
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="rounded-xl bg-white border border-gray-200 p-6 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-300 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
        <p className="text-gray-500 mb-4">No active subscription</p>
        {onManage && (
          <button
            onClick={onManage}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            View Plans
          </button>
        )}
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[subscription.status] ?? STATUS_STYLES.expired;

  return (
    <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Current Plan</p>
            <h3 className="text-xl font-bold text-white">{subscription.plan_name}</h3>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
          >
            {statusStyle.label}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="px-6 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Price</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatNGN(subscription.price_ngn)}
              <span className="text-sm font-normal text-gray-500">
                /{subscription.billing_cycle === 'monthly' ? 'mo' : subscription.billing_cycle === 'quarterly' ? 'qtr' : 'yr'}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Next Billing</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(subscription.current_period_end)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Payment Method</p>
            <p className="text-sm font-medium text-gray-900">
              {subscription.payment_method
                ? PAYMENT_METHOD_LABELS[subscription.payment_method] ?? subscription.payment_method
                : 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Period Start</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(subscription.current_period_start)}
            </p>
          </div>
        </div>

        {/* Past due warning */}
        {subscription.status === 'past_due' && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
            <p className="text-sm text-yellow-800">
              Your payment is past due. Please update your payment method to avoid service interruption.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {onManage && (
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onManage}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Manage Subscription
          </button>
        </div>
      )}
    </div>
  );
}
