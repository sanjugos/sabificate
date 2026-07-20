/**
 * Shared Zod validation schemas for input hardening.
 *
 * These are pure validation functions with no side effects — they can be
 * imported by both server routes and client-side code for consistent
 * validation rules across the stack.
 */
import { z } from 'zod';

// ── Artifact Submission ────────────────────────────────────────────────────

export const artifactSubmissionSchema = z.object({
  block_id: z.string().min(1, 'block_id is required'),
  response_text: z
    .string()
    .min(50, 'Response must be at least 50 characters')
    .max(10000, 'Response must not exceed 10 000 characters'),
});

export type ArtifactSubmission = z.infer<typeof artifactSubmissionSchema>;

/**
 * Validate an artifact submission payload.
 * Returns a Zod SafeParseReturnType — caller checks `.success`.
 */
export function validateArtifactSubmission(data: unknown) {
  return artifactSubmissionSchema.safeParse(data);
}

// ── Email ──────────────────────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

/**
 * Validate an email string.
 * Returns a Zod SafeParseReturnType — caller checks `.success`.
 */
export function validateEmail(value: unknown) {
  return emailSchema.safeParse(value);
}

// ── Password ───────────────────────────────────────────────────────────────

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/\d/, 'Password must contain at least one number');

/**
 * Validate a password string.
 * Returns a Zod SafeParseReturnType — caller checks `.success`.
 */
export function validatePassword(value: unknown) {
  return passwordSchema.safeParse(value);
}
