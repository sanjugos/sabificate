import { query } from '../db/index.js';
import { TABLES } from '../db/schema.js';
import { PAYMENT } from '../../contracts/shared/constants.js';

/**
 * Check whether a lesson is free. If it is, no subscription check is needed.
 */
async function isLessonFree(lessonId: string): Promise<boolean> {
  const result = await query(
    `SELECT is_free FROM ${TABLES.LESSONS} WHERE id = $1`,
    [lessonId],
  );
  if (result.rows.length === 0) return false;
  return result.rows[0].is_free === true;
}

/**
 * Check whether a user (or their org) has an active subscription.
 * Returns:
 *   - { active: true, degraded: false } — valid subscription
 *   - { active: true, degraded: true, daysRemaining: N } — in grace period
 *   - { active: false } — no valid subscription
 */
async function checkUserSubscription(
  userId: string,
  orgId: string | null,
): Promise<{ active: boolean; degraded: boolean; daysRemaining?: number }> {
  // Check individual subscription first
  const individualResult = await query(
    `SELECT id, status, current_period_end
     FROM ${TABLES.SUBSCRIPTIONS}
     WHERE user_id = $1 AND status = 'active' AND current_period_end > NOW()`,
    [userId],
  );

  if (individualResult.rows.length > 0) {
    return { active: true, degraded: false };
  }

  // Check org-level subscription if user has org_id
  if (orgId) {
    const orgResult = await query(
      `SELECT id, status, current_period_end
       FROM ${TABLES.SUBSCRIPTIONS}
       WHERE org_id = $1 AND status = 'active' AND current_period_end > NOW()`,
      [orgId],
    );

    if (orgResult.rows.length > 0) {
      return { active: true, degraded: false };
    }
  }

  // Check grace period: subscription exists but expired within GRACE_PERIOD_DAYS
  const graceResult = await query(
    `SELECT id, current_period_end
     FROM ${TABLES.SUBSCRIPTIONS}
     WHERE user_id = $1
       AND current_period_end IS NOT NULL
       AND current_period_end <= NOW()
       AND current_period_end > NOW() - INTERVAL '7 days'
     ORDER BY current_period_end DESC
     LIMIT 1`,
    [userId],
  );

  if (graceResult.rows.length > 0) {
    const periodEnd = new Date(graceResult.rows[0].current_period_end);
    const graceEnd = new Date(periodEnd.getTime() + PAYMENT.GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((graceEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

    return { active: true, degraded: true, daysRemaining };
  }

  // Also check org grace period
  if (orgId) {
    const orgGraceResult = await query(
      `SELECT id, current_period_end
       FROM ${TABLES.SUBSCRIPTIONS}
       WHERE org_id = $1
         AND current_period_end IS NOT NULL
         AND current_period_end <= NOW()
         AND current_period_end > NOW() - INTERVAL '7 days'
       ORDER BY current_period_end DESC
       LIMIT 1`,
      [orgId],
    );

    if (orgGraceResult.rows.length > 0) {
      const periodEnd = new Date(orgGraceResult.rows[0].current_period_end);
      const graceEnd = new Date(periodEnd.getTime() + PAYMENT.GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
      const now = new Date();
      const daysRemaining = Math.max(0, Math.ceil((graceEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

      return { active: true, degraded: true, daysRemaining };
    }
  }

  return { active: false, degraded: false };
}

/**
 * Paywall check for lesson content endpoints.
 *
 * Call this inside the route handler since it needs the lessonId from
 * request params and optionally the userId from auth.
 *
 * Returns:
 *   - { allowed: true, degraded: false } — full access
 *   - { allowed: true, degraded: true, daysRemaining } — grace period access
 *   - { allowed: false, error, message, redirect } — blocked
 */
export async function checkSubscriptionAccess(
  lessonId: string,
  userId: string | null,
  orgId: string | null,
): Promise<
  | { allowed: true; degraded: false }
  | { allowed: true; degraded: true; daysRemaining: number }
  | { allowed: false; error: string; message: string; redirect: string }
> {
  // 1. Free lessons are always accessible
  if (await isLessonFree(lessonId)) {
    return { allowed: true, degraded: false };
  }

  // 2. Unauthenticated users cannot access paid content
  if (!userId) {
    return {
      allowed: false,
      error: 'subscription_required',
      message: 'Please subscribe to access this content',
      redirect: '/pricing',
    };
  }

  // 3. Check subscription status
  const subscription = await checkUserSubscription(userId, orgId);

  if (subscription.active && !subscription.degraded) {
    return { allowed: true, degraded: false };
  }

  if (subscription.active && subscription.degraded) {
    return {
      allowed: true,
      degraded: true,
      daysRemaining: subscription.daysRemaining ?? 0,
    };
  }

  // 4. No active subscription
  return {
    allowed: false,
    error: 'subscription_required',
    message: 'Please subscribe to access this content',
    redirect: '/pricing',
  };
}
