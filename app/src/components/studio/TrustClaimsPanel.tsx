import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api/client';

// ── Types ───────────────────────────────────────────────────────────────

interface TrustClaim {
  id: string;
  track_id: string;
  spine_node_index: number;
  depth_tier: 'foundational' | 'working' | 'applied';
  claim_text: string;
  claim_type: 'numeric' | 'regulatory' | 'statistical' | 'citation';
  source_url: string | null;
  source_label: string | null;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
}

interface TrustClaimsResponse {
  data: TrustClaim[];
}

type FilterTab = 'all' | 'unverified' | 'verified';

// ── Helpers ─────────────────────────────────────────────────────────────

const CLAIM_TYPE_BADGE: Record<TrustClaim['claim_type'], string> = {
  regulatory: 'bg-red-100 text-red-700',
  numeric: 'bg-blue-100 text-blue-700',
  statistical: 'bg-purple-100 text-purple-700',
  citation: 'bg-gray-100 text-gray-600',
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unverified', label: 'Unverified' },
  { key: 'verified', label: 'Verified' },
];

// ── Component ───────────────────────────────────────────────────────────

interface TrustClaimsPanelProps {
  trackId: string;
}

export function TrustClaimsPanel({ trackId }: TrustClaimsPanelProps) {
  const [claims, setClaims] = useState<TrustClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch claims
  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filterParam =
        filter === 'verified'
          ? '?verified=true'
          : filter === 'unverified'
            ? '?verified=false'
            : '';
      const res = await api.get<TrustClaimsResponse>(
        `/studio/tracks/${trackId}/trust-claims${filterParam}`,
      );
      setClaims(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trust claims');
    } finally {
      setLoading(false);
    }
  }, [trackId, filter]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Grouped by spine node index
  const grouped = useMemo(() => {
    const map = new Map<number, TrustClaim[]>();
    for (const claim of claims) {
      const existing = map.get(claim.spine_node_index);
      if (existing) {
        existing.push(claim);
      } else {
        map.set(claim.spine_node_index, [claim]);
      }
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [claims]);

  // Summary counts (computed from claims array — reflects current filter page)
  const verifiedCount = claims.filter((c) => c.verified).length;
  const totalCount = claims.length;

  // Start editing a claim's source fields
  const startEdit = (claim: TrustClaim) => {
    setEditingId(claim.id);
    setEditUrl(claim.source_url ?? '');
    setEditLabel(claim.source_label ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditUrl('');
    setEditLabel('');
  };

  // Save source + optionally toggle verified
  const saveClaim = async (claimId: string, markVerified: boolean) => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (editUrl.trim()) body.source_url = editUrl.trim();
      else body.source_url = null;
      if (editLabel.trim()) body.source_label = editLabel.trim();
      else body.source_label = null;
      if (markVerified) body.verified = true;

      const updated = await api.put<TrustClaim>(
        `/studio/tracks/${trackId}/trust-claims/${claimId}`,
        body,
      );

      setClaims((prev) => prev.map((c) => (c.id === claimId ? updated : c)));
      setEditingId(null);
      setEditUrl('');
      setEditLabel('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Toggle verified status (for already-sourced claims)
  const toggleVerified = async (claim: TrustClaim) => {
    setSaving(true);
    try {
      const updated = await api.put<TrustClaim>(
        `/studio/tracks/${trackId}/trust-claims/${claim.id}`,
        { verified: !claim.verified },
      );
      setClaims((prev) => prev.map((c) => (c.id === claim.id ? updated : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">Trust Claims Verification</h4>
        {!loading && (
          <span className="text-xs text-gray-500">
            {filter === 'all'
              ? `${verifiedCount} of ${totalCount} claims verified`
              : `${totalCount} claim${totalCount === 1 ? '' : 's'}`}
          </span>
        )}
      </div>

      {/* Summary bar */}
      {!loading && filter === 'all' && totalCount > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              verifiedCount === totalCount ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${totalCount > 0 ? (verifiedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filter === tab.key
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-xs text-red-700">{error}</p>
          <button
            onClick={fetchClaims}
            className="text-xs text-red-600 underline mt-1"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">Loading trust claims...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && totalCount === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-center">
          <p className="text-sm text-gray-500">
            {filter === 'all'
              ? 'No trust claims flagged for this track.'
              : filter === 'unverified'
                ? 'All claims have been verified.'
                : 'No verified claims yet.'}
          </p>
        </div>
      )}

      {/* Claims grouped by spine node */}
      {!loading && grouped.map(([nodeIndex, nodeClaims]) => (
        <div key={nodeIndex} className="border border-gray-200 rounded-md">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-600">
              Spine Node {nodeIndex + 1}
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {nodeClaims.map((claim) => (
              <div key={claim.id} className="px-3 py-3 space-y-2">
                {/* Claim header */}
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => toggleVerified(claim)}
                    disabled={saving}
                    className={`mt-0.5 flex-shrink-0 h-4 w-4 rounded border transition-colors ${
                      claim.verified
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                    title={claim.verified ? 'Mark as unverified' : 'Mark as verified'}
                  >
                    {claim.verified && (
                      <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${claim.verified ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {claim.claim_text}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${CLAIM_TYPE_BADGE[claim.claim_type]}`}
                      >
                        {claim.claim_type}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {claim.depth_tier}
                      </span>
                      {claim.verified && claim.verified_at && (
                        <span className="text-[10px] text-green-600">
                          verified {new Date(claim.verified_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Source display (when not editing) */}
                {editingId !== claim.id && (
                  <div className="ml-6">
                    {claim.source_url ? (
                      <div className="flex items-center gap-2 text-xs">
                        <a
                          href={claim.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate max-w-[300px]"
                        >
                          {claim.source_label || claim.source_url}
                        </a>
                        {!claim.verified && (
                          <button
                            onClick={() => startEdit(claim)}
                            className="text-gray-400 hover:text-gray-600 text-[10px]"
                          >
                            edit
                          </button>
                        )}
                      </div>
                    ) : (
                      !claim.verified && (
                        <button
                          onClick={() => startEdit(claim)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          + Add source
                        </button>
                      )
                    )}
                  </div>
                )}

                {/* Source editing */}
                {editingId === claim.id && (
                  <div className="ml-6 space-y-2 bg-blue-50 border border-blue-200 rounded-md p-2">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600 mb-0.5">
                        Source URL
                      </label>
                      <input
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-600 mb-0.5">
                        Source Label
                      </label>
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        placeholder="e.g., CBN Annual Report 2025"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveClaim(claim.id, false)}
                        disabled={saving}
                        className="px-2 py-1 text-[10px] font-medium bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                      >
                        Save Source
                      </button>
                      <button
                        onClick={() => saveClaim(claim.id, true)}
                        disabled={saving || !editUrl.trim()}
                        className="px-2 py-1 text-[10px] font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Save & Verify
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-2 py-1 text-[10px] text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
