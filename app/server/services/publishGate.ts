// ── Publish Gate Check ────────────────────────────────────────────────────
// Pure gate function that decides whether a track may be published.
// Traces to: FR-9 / AC-9.1 through AC-9.6
// No DB calls — accepts pre-counted data and returns a verdict.

// ── Input types ──────────────────────────────────────────────────────────

export interface TrustClaimCounts {
  total: number;
  unverified: number;
}

export interface AssemblyFlagCounts {
  total: number;
  unresolved: number;
}

// ── Output type ──────────────────────────────────────────────────────────

export interface PublishGateResult {
  canPublish: boolean;
  reason?: 'unverified_trust_claims' | 'unresolved_assembly_flags';
  count?: number;
}

// ── Gate check ───────────────────────────────────────────────────────────

export function publishGateCheck(
  trustClaims: TrustClaimCounts,
  assemblyFlags: AssemblyFlagCounts,
): PublishGateResult {
  // Trust claims are checked first (higher priority)
  if (trustClaims.unverified > 0) {
    return {
      canPublish: false,
      reason: 'unverified_trust_claims',
      count: trustClaims.unverified,
    };
  }

  // Assembly flags checked second
  if (assemblyFlags.unresolved > 0) {
    return {
      canPublish: false,
      reason: 'unresolved_assembly_flags',
      count: assemblyFlags.unresolved,
    };
  }

  // All clear
  return { canPublish: true };
}
