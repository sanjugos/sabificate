import { query } from '../db/index.js';
import { TABLES } from '../db/schema.js';
import { PAYMENT } from '../../contracts/shared/constants.js';
import { queues } from '../queue/index.js';
import { QUEUE_NAMES } from '../../contracts/shared/events.js';
import type { DunningAttempt } from '../../contracts/api/payments.js';

// ── Schedule dunning retries ───────────────────────────────────────────────

export async function scheduleDunning(
  userId: string,
  transactionId: string,
): Promise<void> {
  const scheduleHours = PAYMENT.DUNNING_SCHEDULE_HOURS; // [24, 72, 168]

  for (let i = 0; i < scheduleHours.length; i++) {
    const delayMs = scheduleHours[i] * 60 * 60 * 1000;
    const attemptNumber = i + 1;
    const nextAttemptAt =
      i + 1 < scheduleHours.length
        ? new Date(Date.now() + scheduleHours[i + 1] * 60 * 60 * 1000).toISOString()
        : null;

    // Insert planned dunning attempt
    const result = await query(
      `INSERT INTO ${TABLES.DUNNING_ATTEMPTS}
         (transaction_id, user_id, attempt_number, channel, status, next_attempt_at)
       VALUES ($1, $2, $3, 'email', 'pending', $4)
       RETURNING id`,
      [transactionId, userId, attemptNumber, nextAttemptAt],
    );

    const attemptId = result.rows[0]?.id as string;

    // Schedule BullMQ delayed job
    await queues[QUEUE_NAMES.PAYMENT_FAILED].add(
      'dunning.attempt',
      {
        attempt_id: attemptId,
        user_id: userId,
        transaction_id: transactionId,
        attempt_number: attemptNumber,
        next_retry_at: nextAttemptAt,
      },
      {
        delay: delayMs,
        jobId: `dunning-${transactionId}-${attemptNumber}`,
      },
    );
  }
}

// ── Process a single dunning attempt ───────────────────────────────────────

export async function processDunningAttempt(attemptId: string): Promise<void> {
  // Load attempt details
  const result = await query(
    `SELECT da.*, u.email, u.phone, u.first_name
     FROM ${TABLES.DUNNING_ATTEMPTS} da
     JOIN ${TABLES.USERS} u ON u.id = da.user_id
     WHERE da.id = $1`,
    [attemptId],
  );

  const attempt = result.rows[0] as
    | (DunningAttempt & { email: string; phone: string | null; first_name: string })
    | undefined;

  if (!attempt) {
    console.error(`[dunning] Attempt ${attemptId} not found`);
    return;
  }

  // Check user consent for SMS / WhatsApp channels
  const consentResult = await query(
    `SELECT consent_type, granted
     FROM consent_records
     WHERE user_id = $1 AND consent_type IN ('sms', 'whatsapp')
     ORDER BY created_at DESC`,
    [attempt.user_id],
  );

  const consents = new Map<string, boolean>();
  for (const row of consentResult.rows as { consent_type: string; granted: boolean }[]) {
    if (!consents.has(row.consent_type)) {
      consents.set(row.consent_type, row.granted);
    }
  }

  // Always send email notification
  const channels: DunningAttempt['channel'][] = ['email'];

  // Only add SMS/WhatsApp if user consented
  if (consents.get('sms') && attempt.phone) {
    channels.push('sms');
  }
  if (consents.get('whatsapp') && attempt.phone) {
    channels.push('whatsapp');
  }

  for (const channel of channels) {
    await sendDunningNotification(attempt, channel);
  }

  // Update attempt status
  await query(
    `UPDATE ${TABLES.DUNNING_ATTEMPTS}
     SET status = 'sent', sent_at = NOW(), channel = $2
     WHERE id = $1`,
    [attemptId, channels[0]], // primary channel recorded
  );
}

// ── Grace period check ─────────────────────────────────────────────────────

export interface GracePeriodStatus {
  inGracePeriod: boolean;
  daysRemaining: number;
  degradedAccess: boolean;
  expiresAt: string | null;
}

export async function checkGracePeriod(
  subscriptionId: string,
): Promise<GracePeriodStatus> {
  const result = await query(
    `SELECT status, current_period_end
     FROM ${TABLES.SUBSCRIPTIONS}
     WHERE id = $1`,
    [subscriptionId],
  );

  const sub = result.rows[0] as
    | { status: string; current_period_end: Date }
    | undefined;

  if (!sub) {
    return { inGracePeriod: false, daysRemaining: 0, degradedAccess: false, expiresAt: null };
  }

  const periodEnd = new Date(sub.current_period_end);
  const now = new Date();
  const gracePeriodEnd = new Date(
    periodEnd.getTime() + PAYMENT.GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
  );

  if (sub.status === 'past_due' && now < gracePeriodEnd) {
    const msRemaining = gracePeriodEnd.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

    return {
      inGracePeriod: true,
      daysRemaining,
      degradedAccess: true,
      expiresAt: gracePeriodEnd.toISOString(),
    };
  }

  // Past grace period — subscription should be suspended
  if (sub.status === 'past_due' && now >= gracePeriodEnd) {
    await query(
      `UPDATE ${TABLES.SUBSCRIPTIONS} SET status = 'expired', updated_at = NOW() WHERE id = $1`,
      [subscriptionId],
    );

    return { inGracePeriod: false, daysRemaining: 0, degradedAccess: false, expiresAt: null };
  }

  return { inGracePeriod: false, daysRemaining: 0, degradedAccess: false, expiresAt: null };
}

// ── Notification stub ──────────────────────────────────────────────────────

async function sendDunningNotification(
  attempt: DunningAttempt & { email: string; phone: string | null; first_name: string },
  channel: DunningAttempt['channel'],
): Promise<void> {
  // In production, integrate with email/SMS/WhatsApp providers.
  // For now, log the notification intent.
  console.log(
    `[dunning] Sending ${channel} notification to user ${attempt.user_id} ` +
      `(${channel === 'email' ? attempt.email : attempt.phone}) ` +
      `— attempt #${attempt.attempt_number}`,
  );
}
