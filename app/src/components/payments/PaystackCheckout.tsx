import { useState, useCallback } from 'react';
import type { SubscriptionPlan, InitializePaymentResponse } from '../../../contracts/api/payments';

interface PaystackCheckoutProps {
  plan: SubscriptionPlan;
  paymentType: 'subscription' | 'invoice';
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

type CheckoutState = 'idle' | 'initializing' | 'redirecting' | 'error';

export default function PaystackCheckout({
  plan,
  paymentType,
  onSuccess,
  onClose,
}: PaystackCheckoutProps) {
  const [state, setState] = useState<CheckoutState>('idle');
  const [error, setError] = useState<string | null>(null);

  const handlePayment = useCallback(async () => {
    setState('initializing');
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/v1/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan_id: plan.id,
          payment_type: paymentType,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string }).message ?? 'Failed to initialize payment',
        );
      }

      const json = (await res.json()) as { data: InitializePaymentResponse };
      const { authorization_url, reference } = json.data;

      setState('redirecting');

      // Store reference for verification on return
      sessionStorage.setItem('paystack_reference', reference);

      // Redirect to Paystack checkout
      window.location.href = authorization_url;
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Payment initialization failed');
    }
  }, [plan.id, paymentType]);

  // Check for returning from Paystack
  const urlParams = new URLSearchParams(window.location.search);
  const returnRef = urlParams.get('reference') ?? urlParams.get('trxref');

  if (returnRef) {
    // Verify the payment
    void verifyAndNotify(returnRef, onSuccess);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Complete Payment
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Plan summary */}
        <div className="rounded-lg bg-gray-50 p-4 mb-6">
          <p className="text-sm text-gray-500">You are subscribing to</p>
          <p className="text-lg font-semibold text-gray-900">{plan.name}</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {new Intl.NumberFormat('en-NG', {
              style: 'currency',
              currency: 'NGN',
              minimumFractionDigits: 0,
            }).format(plan.price_ngn)}
            <span className="text-sm text-gray-500 font-normal">
              /{plan.billing_cycle === 'monthly' ? 'mo' : plan.billing_cycle === 'quarterly' ? 'qtr' : 'yr'}
            </span>
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Payment button */}
        <button
          onClick={handlePayment}
          disabled={state === 'initializing' || state === 'redirecting'}
          className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          {state === 'idle' && 'Pay with Paystack'}
          {state === 'initializing' && (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Initializing...
            </span>
          )}
          {state === 'redirecting' && (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Redirecting to Paystack...
            </span>
          )}
          {state === 'error' && 'Try Again'}
        </button>

        <p className="mt-4 text-xs text-center text-gray-400">
          Secured by Paystack. Your card details are encrypted.
        </p>
      </div>
    </div>
  );
}

// ── Verification helper ────────────────────────────────────────────────────

async function verifyAndNotify(
  reference: string,
  onSuccess: (reference: string) => void,
): Promise<void> {
  try {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`/api/v1/payments/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return;

    const json = (await res.json()) as { data: { status: string } };
    if (json.data.status === 'success') {
      // Clean up URL params
      const url = new URL(window.location.href);
      url.searchParams.delete('reference');
      url.searchParams.delete('trxref');
      window.history.replaceState({}, '', url.toString());

      sessionStorage.removeItem('paystack_reference');
      onSuccess(reference);
    }
  } catch {
    // Silently fail — user can manually verify
  }
}
