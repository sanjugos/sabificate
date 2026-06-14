import Redis from 'ioredis';
import { AUTH } from '../../contracts/shared/constants.js';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const KEYS = {
  attempts: (ip: string) => `login:attempts:${ip}`,
  lockout: (ip: string) => `login:lockout:${ip}`,
  lockoutTier: (ip: string) => `login:lockout_tier:${ip}`,
} as const;

export async function checkRateLimit(
  ip: string,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const lockoutTtl = await redis.ttl(KEYS.lockout(ip));
  if (lockoutTtl > 0) {
    return { allowed: false, retryAfter: lockoutTtl };
  }

  const attempts = await redis.get(KEYS.attempts(ip));
  if (attempts !== null && parseInt(attempts, 10) >= AUTH.MAX_LOGIN_ATTEMPTS) {
    // Threshold reached but no lockout key yet — shouldn't normally happen,
    // but treat as blocked with a short retry window.
    return { allowed: false, retryAfter: AUTH.LOCKOUT_MINUTES[0] * 60 };
  }

  return { allowed: true };
}

export async function recordFailedAttempt(ip: string): Promise<void> {
  const attemptsKey = KEYS.attempts(ip);
  const windowSeconds = AUTH.LOGIN_WINDOW_MINUTES * 60;

  const current = await redis.incr(attemptsKey);

  // Set expiry on first attempt so the window auto-resets
  if (current === 1) {
    await redis.expire(attemptsKey, windowSeconds);
  }

  if (current >= AUTH.MAX_LOGIN_ATTEMPTS) {
    // Determine lockout tier (0-indexed into LOCKOUT_MINUTES)
    const tierKey = KEYS.lockoutTier(ip);
    const rawTier = await redis.get(tierKey);
    const tier = rawTier !== null ? parseInt(rawTier, 10) : 0;

    const lockoutIndex = Math.min(tier, AUTH.LOCKOUT_MINUTES.length - 1);
    const lockoutSeconds = AUTH.LOCKOUT_MINUTES[lockoutIndex] * 60;

    // Apply lockout
    await redis.set(KEYS.lockout(ip), '1', 'EX', lockoutSeconds);

    // Advance tier for next lockout (persists 24 hours so repeat offenders escalate)
    const nextTier = Math.min(tier + 1, AUTH.LOCKOUT_MINUTES.length - 1);
    await redis.set(tierKey, String(nextTier), 'EX', 24 * 60 * 60);

    // Reset the attempt counter so the window restarts after lockout expires
    await redis.del(attemptsKey);
  }
}

export async function clearFailedAttempts(ip: string): Promise<void> {
  await redis.del(KEYS.attempts(ip), KEYS.lockout(ip));
}
