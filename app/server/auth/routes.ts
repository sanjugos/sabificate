import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import { hashPassword, verifyPassword } from './password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, type JwtPayload } from './jwt.js';
import { checkRateLimit, recordFailedAttempt, clearFailedAttempts } from './rate-limiter.js';
import { recordConsent } from './consent.js';
import { AUTH } from '../../contracts/shared/constants.js';
import type { UserRole, DataSaverMode } from '../../contracts/types/index.js';

// ── Zod Schemas ──────────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/\d/, 'Password must contain at least one number'),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  phone_number: z.string().max(20).optional(),
  invitation_token: z.string().optional(),
  consent: z.object({
    education_only: z.boolean(),
    anonymized_aggregate: z.boolean(),
    full_profile: z.boolean(),
  }),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  new_password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/\d/, 'Password must contain at least one number'),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  role: UserRole;
  org_id: string | null;
  department_id: string | null;
  language_preference: string;
  data_saver_mode: DataSaverMode;
  is_active: boolean;
}

function buildUserProfile(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    first_name: row.first_name,
    last_name: row.last_name,
    role: row.role,
    org_id: row.org_id,
    department_id: row.department_id,
    language_preference: row.language_preference as 'en',
    data_saver_mode: row.data_saver_mode,
  };
}

function buildAuthResponse(row: UserRow, accessToken: string) {
  return {
    access_token: accessToken,
    token_type: 'Bearer' as const,
    expires_in: AUTH.ACCESS_TOKEN_EXPIRY_SECONDS,
    user: buildUserProfile(row),
  };
}

function getClientIp(request: FastifyRequest): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return request.ip;
}

function formatZodErrors(err: z.ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const path = issue.path.join('.');
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(issue.message);
  }
  return details;
}

// ── Refresh Token Cookie Config ──────────────────────────────────────────────

const REFRESH_COOKIE_NAME = 'refresh_token';

function setRefreshCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: AUTH.REFRESH_TOKEN_EXPIRY_SECONDS,
  });
}

function clearRefreshCookie(reply: FastifyReply): void {
  reply.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
  });
}

// ── Route Plugin ─────────────────────────────────────────────────────────────

export default async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // ── POST /api/v1/auth/register ─────────────────────────────────────────────

  fastify.post('/api/v1/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = registerSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        details: formatZodErrors(parsed.error),
      });
    }

    const { email, password, first_name, last_name, phone_number, consent } = parsed.data;

    // Check email uniqueness
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return reply.code(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: 'An account with this email already exists',
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert user
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone_number,
        consent_education_only, consent_anonymized_aggregate, consent_full_profile)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, first_name, last_name, password_hash, role, org_id, department_id,
         language_preference, data_saver_mode, is_active`,
      [
        email.toLowerCase(),
        passwordHash,
        first_name,
        last_name,
        phone_number ?? null,
        consent.education_only,
        consent.anonymized_aggregate,
        consent.full_profile,
      ],
    );

    const user = result.rows[0] as UserRow;

    // Record consent entries
    const ip = getClientIp(request);
    const ua = request.headers['user-agent'] ?? undefined;

    await recordConsent({
      user_id: user.id,
      consents: {
        education_only: consent.education_only,
        anonymized_aggregate: consent.anonymized_aggregate,
        full_profile: consent.full_profile,
      },
      ip_address: ip,
      user_agent: ua,
    });

    // Generate tokens
    const claims: JwtPayload = {
      user_id: user.id,
      email: user.email,
      role: user.role,
      org_id: user.org_id,
      department_id: user.department_id,
    };

    const accessToken = signAccessToken(claims);
    const refreshToken = signRefreshToken({ user_id: user.id });

    setRefreshCookie(reply, refreshToken);

    return reply.code(201).send(buildAuthResponse(user, accessToken));
  });

  // ── POST /api/v1/auth/login ────────────────────────────────────────────────

  fastify.post('/api/v1/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = loginSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        details: formatZodErrors(parsed.error),
      });
    }

    const { email, password } = parsed.data;
    const ip = getClientIp(request);

    // Check rate limiting
    const rateCheck = await checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return reply.code(429).send({
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Too many login attempts. Please try again in ${rateCheck.retryAfter} seconds.`,
      });
    }

    // Find user
    const result = await query(
      `SELECT id, email, first_name, last_name, password_hash, role, org_id, department_id,
        language_preference, data_saver_mode, is_active
       FROM users WHERE email = $1`,
      [email.toLowerCase()],
    );

    if (result.rows.length === 0) {
      await recordFailedAttempt(ip);
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    const user = result.rows[0] as UserRow;

    if (!user.is_active) {
      return reply.code(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Account is deactivated',
      });
    }

    // Verify password
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      await recordFailedAttempt(ip);
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // Clear failed attempts on success
    await clearFailedAttempts(ip);

    // Generate tokens
    const claims: JwtPayload = {
      user_id: user.id,
      email: user.email,
      role: user.role,
      org_id: user.org_id,
      department_id: user.department_id,
    };

    const accessToken = signAccessToken(claims);
    const refreshToken = signRefreshToken({ user_id: user.id });

    setRefreshCookie(reply, refreshToken);

    return reply.code(200).send(buildAuthResponse(user, accessToken));
  });

  // ── POST /api/v1/auth/refresh ──────────────────────────────────────────────

  fastify.post('/api/v1/auth/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies[REFRESH_COOKIE_NAME];

    if (!token) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Missing refresh token',
      });
    }

    let userId: string;
    try {
      const decoded = verifyRefreshToken(token);
      userId = decoded.user_id;
    } catch {
      clearRefreshCookie(reply);
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token',
      });
    }

    // Look up user to build fresh claims
    const result = await query(
      `SELECT id, email, first_name, last_name, password_hash, role, org_id, department_id,
        language_preference, data_saver_mode, is_active
       FROM users WHERE id = $1`,
      [userId],
    );

    if (result.rows.length === 0 || !(result.rows[0] as UserRow).is_active) {
      clearRefreshCookie(reply);
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'User not found or deactivated',
      });
    }

    const user = result.rows[0] as UserRow;

    // Rotate: issue new tokens
    const claims: JwtPayload = {
      user_id: user.id,
      email: user.email,
      role: user.role,
      org_id: user.org_id,
      department_id: user.department_id,
    };

    const newAccessToken = signAccessToken(claims);
    const newRefreshToken = signRefreshToken({ user_id: user.id });

    setRefreshCookie(reply, newRefreshToken);

    return reply.code(200).send({
      access_token: newAccessToken,
      token_type: 'Bearer' as const,
      expires_in: AUTH.ACCESS_TOKEN_EXPIRY_SECONDS,
    });
  });

  // ── POST /api/v1/auth/logout ───────────────────────────────────────────────

  fastify.post('/api/v1/auth/logout', async (_request: FastifyRequest, reply: FastifyReply) => {
    clearRefreshCookie(reply);
    return reply.code(200).send({ message: 'Logged out successfully' });
  });

  // ── POST /api/v1/auth/password-reset ───────────────────────────────────────

  fastify.post(
    '/api/v1/auth/password-reset',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = passwordResetSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation failed',
          details: formatZodErrors(parsed.error),
        });
      }

      const { email } = parsed.data;

      // Look up user (but always return success to prevent email enumeration)
      const result = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);

      if (result.rows.length > 0) {
        const userId = (result.rows[0] as { id: string }).id;
        const resetToken = uuidv4();
        const expiresAt = new Date(
          Date.now() + AUTH.PASSWORD_RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
        );

        // Store token — using a simple approach: store in users table or a
        // dedicated table. For now, store in a transient way via the DB.
        await query(
          `INSERT INTO password_reset_tokens (user_id, token, expires_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3`,
          [userId, resetToken, expiresAt.toISOString()],
        ).catch(() => {
          // If the password_reset_tokens table doesn't exist yet, log and continue.
          // The token is generated but email sending is stubbed anyway.
          console.warn(
            'password_reset_tokens table not found. Reset token generated but not persisted.',
          );
        });

        // STUB: send email with reset link
        console.log(`[STUB] Password reset email for ${email}. Token: ${resetToken}`);
      }

      // Always return success to prevent email enumeration
      return reply.code(200).send({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    },
  );

  // ── POST /api/v1/auth/password-reset/confirm ──────────────────────────────

  fastify.post(
    '/api/v1/auth/password-reset/confirm',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = passwordResetConfirmSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation failed',
          details: formatZodErrors(parsed.error),
        });
      }

      const { token, new_password } = parsed.data;

      // Look up the reset token
      let tokenRow: { user_id: string; expires_at: string } | undefined;

      try {
        const result = await query(
          'SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1',
          [token],
        );
        tokenRow = result.rows[0] as typeof tokenRow;
      } catch {
        // Table may not exist yet
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid or expired reset token',
        });
      }

      if (!tokenRow) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid or expired reset token',
        });
      }

      if (new Date(tokenRow.expires_at) < new Date()) {
        // Token expired — delete it
        await query('DELETE FROM password_reset_tokens WHERE token = $1', [token]).catch(() => {});
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid or expired reset token',
        });
      }

      // Update password
      const passwordHash = await hashPassword(new_password);
      await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
        passwordHash,
        tokenRow.user_id,
      ]);

      // Delete the used token
      await query('DELETE FROM password_reset_tokens WHERE token = $1', [token]).catch(() => {});

      return reply.code(200).send({ message: 'Password updated successfully' });
    },
  );

  // ── GET /api/v1/auth/me ─────────────────────────────────────────────────────

  fastify.get(
    '/api/v1/auth/me',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const result = await query(
        `SELECT id, email, first_name, last_name, role, org_id, department_id, language_preference, data_saver_mode, avatar_url
         FROM users WHERE id = $1`,
        [request.user.user_id],
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found',
        });
      }

      return reply.code(200).send({
        status: 'success',
        data: result.rows[0],
      });
    },
  );
}
