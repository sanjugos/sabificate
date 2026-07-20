import { describe, it, expect } from 'vitest';
import {
  validateArtifactSubmission,
  validateEmail,
  validatePassword,
} from '../../server/validation/schemas';

describe('Input Validation Schemas', () => {
  // ── Artifact Submission ──────────────────────────────────────────────────

  describe('validateArtifactSubmission', () => {
    it('rejects text shorter than 50 characters', () => {
      const result = validateArtifactSubmission({
        block_id: 'block-1',
        response_text: 'Too short',
      });
      expect(result.success).toBe(false);
    });

    it('rejects text longer than 10000 characters', () => {
      const result = validateArtifactSubmission({
        block_id: 'block-1',
        response_text: 'x'.repeat(10001),
      });
      expect(result.success).toBe(false);
    });

    it('accepts text between 50 and 10000 characters', () => {
      const result = validateArtifactSubmission({
        block_id: 'block-1',
        response_text: 'a'.repeat(50),
      });
      expect(result.success).toBe(true);
    });

    it('accepts text at exactly 10000 characters', () => {
      const result = validateArtifactSubmission({
        block_id: 'block-1',
        response_text: 'b'.repeat(10000),
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing block_id', () => {
      const result = validateArtifactSubmission({
        response_text: 'a'.repeat(100),
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty block_id', () => {
      const result = validateArtifactSubmission({
        block_id: '',
        response_text: 'a'.repeat(100),
      });
      expect(result.success).toBe(false);
    });
  });

  // ── Email Validation ─────────────────────────────────────────────────────

  describe('validateEmail', () => {
    it('rejects invalid email without @ symbol', () => {
      const result = validateEmail('not-an-email');
      expect(result.success).toBe(false);
    });

    it('rejects invalid email without domain', () => {
      const result = validateEmail('user@');
      expect(result.success).toBe(false);
    });

    it('rejects empty string', () => {
      const result = validateEmail('');
      expect(result.success).toBe(false);
    });

    it('accepts valid email format', () => {
      const result = validateEmail('learner@sabificate.com');
      expect(result.success).toBe(true);
    });

    it('accepts email with subdomain', () => {
      const result = validateEmail('user@mail.example.co.ng');
      expect(result.success).toBe(true);
    });
  });

  // ── Password Validation ──────────────────────────────────────────────────

  describe('validatePassword', () => {
    it('rejects password shorter than 8 characters', () => {
      const result = validatePassword('Ab1cde');
      expect(result.success).toBe(false);
    });

    it('rejects empty password', () => {
      const result = validatePassword('');
      expect(result.success).toBe(false);
    });

    it('rejects password without a digit', () => {
      const result = validatePassword('abcdefgh');
      expect(result.success).toBe(false);
    });

    it('accepts password with 8+ chars and at least one digit', () => {
      const result = validatePassword('securePass1');
      expect(result.success).toBe(true);
    });

    it('accepts password at exactly 8 characters with a digit', () => {
      const result = validatePassword('abcdefg1');
      expect(result.success).toBe(true);
    });
  });
});
