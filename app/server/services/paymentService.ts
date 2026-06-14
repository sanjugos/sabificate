import { query } from '../db/index.js';
import { TABLES } from '../db/schema.js';
import { queues } from '../queue/index.js';
import { QUEUE_NAMES } from '../../contracts/shared/events.js';
import type {
  PaymentTransaction,
  PaymentMetadata,
} from '../../contracts/api/payments.js';
import type { PaymentSucceededEvent } from '../../contracts/shared/events.js';

// ── Paystack helpers ───────────────────────────────────────────────────────

const PAYSTACK_BASE = 'https://api.paystack.co';

function paystackHeaders(): Record<string, string> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('PAYSTACK_SECRET_KEY not set');
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

async function paystackFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...options,
    headers: { ...paystackHeaders(), ...(options.headers ?? {}) },
  });

  const body = (await res.json()) as { status: boolean; message: string; data: T };

  if (!res.ok || !body.status) {
    throw new Error(`Paystack API error: ${body.message}`);
  }

  return body.data;
}

// ── Public API ─────────────────────────────────────────────────────────────

export interface InitializeParams {
  email: string;
  amount: number; // kobo
  plan_code?: string;
  metadata?: Record<string, unknown>;
  callback_url?: string;
}

interface InitializeResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export async function initializeTransaction(
  params: InitializeParams,
): Promise<InitializeResult> {
  return paystackFetch<InitializeResult>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      plan: params.plan_code,
      metadata: params.metadata,
      callback_url: params.callback_url,
    }),
  });
}

interface VerifyResult {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  channel: string;
  customer: { email: string; customer_code: string };
  metadata: Record<string, unknown>;
}

export async function verifyTransaction(reference: string): Promise<VerifyResult> {
  return paystackFetch<VerifyResult>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
}

interface CreateSubscriptionResult {
  subscription_code: string;
  email_token: string;
  status: string;
}

export async function createSubscription(
  customerCode: string,
  planCode: string,
): Promise<CreateSubscriptionResult> {
  return paystackFetch<CreateSubscriptionResult>('/subscription', {
    method: 'POST',
    body: JSON.stringify({
      customer: customerCode,
      plan: planCode,
    }),
  });
}

// ── Webhook handlers ───────────────────────────────────────────────────────

export async function handleChargeSuccess(
  data: Record<string, unknown>,
): Promise<void> {
  const reference = data.reference as string;
  const amount = data.amount as number;
  const channel = (data.channel ?? 'card') as PaymentTransaction['payment_method'];
  const customer = data.customer as { email: string } | undefined;
  const metadata = (data.metadata ?? {}) as Record<string, unknown>;

  // Idempotency: skip if already recorded
  const existing = await query(
    `SELECT id FROM ${TABLES.PAYMENT_TRANSACTIONS} WHERE gateway_reference = $1`,
    [reference],
  );
  if (existing.rows.length > 0) return;

  // Resolve user
  const userResult = await query(
    `SELECT id FROM ${TABLES.USERS} WHERE email = $1`,
    [customer?.email],
  );
  const userId = userResult.rows[0]?.id as string | undefined;
  if (!userId) {
    console.error(`[payment] No user found for email ${customer?.email}`);
    return;
  }

  const paymentMeta: PaymentMetadata = {
    subscription_plan_id: metadata.plan_id as string | undefined,
    invoice_number: metadata.invoice_number as string | undefined,
    billing_cycle: metadata.billing_cycle as string | undefined,
  };

  // Insert transaction
  await query(
    `INSERT INTO ${TABLES.PAYMENT_TRANSACTIONS}
       (user_id, org_id, amount_ngn, currency, payment_method, gateway, gateway_reference, status, metadata)
     VALUES ($1, $2, $3, 'NGN', $4, 'paystack', $5, 'success', $6)`,
    [
      userId,
      (metadata.org_id as string) ?? null,
      amount / 100, // kobo -> naira
      channel,
      reference,
      JSON.stringify(paymentMeta),
    ],
  );

  // Activate / renew subscription if plan-related
  if (metadata.plan_id) {
    await activateSubscription(userId, metadata.plan_id as string, metadata.org_id as string | undefined);
  }

  // Mark invoice as paid if invoice payment
  if (metadata.invoice_number) {
    await query(
      `UPDATE ${TABLES.INVOICES} SET status = 'paid', updated_at = NOW() WHERE invoice_number = $1`,
      [metadata.invoice_number],
    );
  }

  // Emit event
  const event: PaymentSucceededEvent = {
    user_id: userId,
    subscription_id: (metadata.subscription_id as string) ?? '',
    plan_id: (metadata.plan_id as string) ?? '',
  };

  await queues[QUEUE_NAMES.PAYMENT_SUCCEEDED].add(
    'payment.succeeded',
    event,
    { jobId: `pay-success-${reference}` },
  );
}

export async function handleChargeFailed(
  data: Record<string, unknown>,
): Promise<void> {
  const reference = data.reference as string;
  const customer = data.customer as { email: string } | undefined;

  const userResult = await query(
    `SELECT id FROM ${TABLES.USERS} WHERE email = $1`,
    [customer?.email],
  );
  const userId = userResult.rows[0]?.id as string | undefined;
  if (!userId) return;

  // Record the failed transaction
  const txResult = await query(
    `INSERT INTO ${TABLES.PAYMENT_TRANSACTIONS}
       (user_id, amount_ngn, currency, payment_method, gateway, gateway_reference, status, metadata)
     VALUES ($1, $2, 'NGN', 'card', 'paystack', $3, 'failed', '{}')
     ON CONFLICT (gateway_reference) DO NOTHING
     RETURNING id`,
    [userId, ((data.amount as number) ?? 0) / 100, reference],
  );

  const transactionId = txResult.rows[0]?.id as string | undefined;

  // Emit failure event for dunning
  await queues[QUEUE_NAMES.PAYMENT_FAILED].add(
    'payment.failed',
    {
      user_id: userId,
      transaction_id: transactionId ?? reference,
      attempt_number: 1,
      next_retry_at: null,
    },
    { jobId: `pay-fail-${reference}` },
  );
}

// ── Internal helpers ───────────────────────────────────────────────────────

async function activateSubscription(
  userId: string,
  planId: string,
  orgId?: string,
): Promise<void> {
  // Look up plan to determine billing period
  const planResult = await query(
    `SELECT billing_cycle FROM ${TABLES.SUBSCRIPTION_PLANS} WHERE id = $1`,
    [planId],
  );
  const plan = planResult.rows[0] as { billing_cycle: string } | undefined;

  let intervalDays = 30;
  if (plan?.billing_cycle === 'quarterly') intervalDays = 90;
  if (plan?.billing_cycle === 'annual') intervalDays = 365;

  // Upsert subscription
  await query(
    `INSERT INTO ${TABLES.SUBSCRIPTIONS}
       (user_id, organization_id, plan_id, status, current_period_start, current_period_end)
     VALUES ($1, $2, $3, 'active', NOW(), NOW() + INTERVAL '${intervalDays} days')
     ON CONFLICT (user_id) DO UPDATE SET
       plan_id = EXCLUDED.plan_id,
       status = 'active',
       current_period_start = NOW(),
       current_period_end = NOW() + INTERVAL '${intervalDays} days',
       updated_at = NOW()`,
    [userId, orgId ?? null, planId],
  );
}
