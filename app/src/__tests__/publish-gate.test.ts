// ── T-006: Publish Gate Check ───────────────────────────────────────────
// Traces to: FR-9 / AC-9.1 through AC-9.6
// Validates the publish gate: trust claims must be verified, assembly flags resolved.

import { describe, it, expect } from 'vitest';
import {
  publishGateCheck,
  type PublishGateResult,
} from '../../server/services/publishGate';

// ── Tests ──────────────────────────────────────────────────────────────

describe('publishGateCheck (T-006)', () => {

  // ── AC-9.1: All clear — can publish ────────────────────────────────

  it('returns canPublish true when 0 unverified claims and 0 unresolved flags', () => {
    const result: PublishGateResult = publishGateCheck(
      { total: 5, unverified: 0 },
      { total: 3, unresolved: 0 },
    );

    expect(result.canPublish).toBe(true);
    expect(result.reason).toBeUndefined();
    expect(result.count).toBeUndefined();
  });

  // ── AC-9.2: Unverified trust claims block publish ──────────────────

  it('returns canPublish false with reason unverified_trust_claims when 1 unverified claim', () => {
    const result: PublishGateResult = publishGateCheck(
      { total: 4, unverified: 1 },
      { total: 2, unresolved: 0 },
    );

    expect(result.canPublish).toBe(false);
    expect(result.reason).toBe('unverified_trust_claims');
    expect(result.count).toBe(1);
  });

  // ── AC-9.3: Unresolved assembly flags block publish ────────────────

  it('returns canPublish false with reason unresolved_assembly_flags when 1 unresolved flag', () => {
    const result: PublishGateResult = publishGateCheck(
      { total: 3, unverified: 0 },
      { total: 5, unresolved: 1 },
    );

    expect(result.canPublish).toBe(false);
    expect(result.reason).toBe('unresolved_assembly_flags');
    expect(result.count).toBe(1);
  });

  // ── AC-9.4: Multiple unverified claims reports the count ───────────

  it('reports count of multiple unverified trust claims', () => {
    const result = publishGateCheck(
      { total: 10, unverified: 7 },
      { total: 0, unresolved: 0 },
    );

    expect(result.canPublish).toBe(false);
    expect(result.reason).toBe('unverified_trust_claims');
    expect(result.count).toBe(7);
  });

  // ── AC-9.5: Trust claims checked before assembly flags (priority) ──

  it('prioritizes unverified_trust_claims over unresolved_assembly_flags when both present', () => {
    const result = publishGateCheck(
      { total: 5, unverified: 2 },
      { total: 3, unresolved: 1 },
    );

    expect(result.canPublish).toBe(false);
    expect(result.reason).toBe('unverified_trust_claims');
    expect(result.count).toBe(2);
  });

  // ── AC-9.6: Zero totals still pass ────────────────────────────────

  it('returns canPublish true when both totals are zero (no claims, no flags)', () => {
    const result = publishGateCheck(
      { total: 0, unverified: 0 },
      { total: 0, unresolved: 0 },
    );

    expect(result.canPublish).toBe(true);
    expect(result.reason).toBeUndefined();
    expect(result.count).toBeUndefined();
  });
});
