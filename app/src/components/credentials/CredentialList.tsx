import { useState, useEffect } from 'react';
import type { Credential } from '../../../contracts/api/credentials';
import type { CredentialType } from '../../../contracts/types';
import { api } from '../../lib/api/client';

interface CredentialListProps {
  onSelect: (credential: Credential) => void;
  onUpgrade?: (credential: Credential) => void;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
  revoked: { bg: 'bg-red-100', text: 'text-red-800', label: 'Revoked' },
  expired: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Expired' },
};

const TIER_STYLES: Record<CredentialType, { bg: string; text: string; border: string; label: string }> = {
  completion_badge: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    label: 'Completion Badge',
  },
  verified_certificate: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    label: 'Verified Certificate',
  },
  team_record: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    label: 'Team Record',
  },
  professional_certificate: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    label: 'Professional Certificate',
  },
};

async function fetchCredentials(): Promise<Credential[]> {
  const body = await api.get<{ credentials: Credential[] }>('/credentials');
  return body.credentials;
}

export function CredentialList({ onSelect, onUpgrade }: CredentialListProps) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const creds = await fetchCredentials();
        if (!cancelled) {
          setCredentials(creds);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load credentials');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-900">No credentials yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Complete a course to earn your first credential
        </p>
      </div>
    );
  }

  // Determine which courses have a completion_badge but no verified_certificate
  const courseCredentialTiers = new Map<string, Set<string>>();
  for (const cred of credentials) {
    if (!courseCredentialTiers.has(cred.course_id)) {
      courseCredentialTiers.set(cred.course_id, new Set());
    }
    if (cred.credential_tier) {
      courseCredentialTiers.get(cred.course_id)!.add(cred.credential_tier);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {credentials.map((credential) => {
        const statusStyle = STATUS_STYLES[credential.status] ?? STATUS_STYLES.active;
        const tier = credential.credential_tier ?? 'completion_badge';
        const tierStyle = TIER_STYLES[tier] ?? TIER_STYLES.completion_badge;

        // Show upgrade button if this is a completion_badge and no verified_certificate exists for this course
        const courseTiers = courseCredentialTiers.get(credential.course_id);
        const canUpgrade =
          tier === 'completion_badge' &&
          credential.status === 'active' &&
          courseTiers &&
          !courseTiers.has('verified_certificate');

        return (
          <div
            key={credential.id}
            className={`flex flex-col rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${tierStyle.border}`}
          >
            <button
              type="button"
              onClick={() => onSelect(credential)}
              className="flex flex-1 flex-col text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              {/* Tier badge */}
              <span
                className={`inline-flex self-start items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tierStyle.bg} ${tierStyle.text}`}
              >
                {tierStyle.label}
              </span>

              {/* Co-brand logo */}
              {credential.co_brand_logo_url && (
                <img
                  src={credential.co_brand_logo_url}
                  alt="Partner organization"
                  className="mt-2 h-8 w-auto object-contain"
                />
              )}

              {/* Course name */}
              <h3 className="mt-2 text-sm font-semibold text-gray-900 line-clamp-2">
                {credential.course_title}
              </h3>

              {/* Certificate number */}
              <p className="mt-1 font-mono text-xs text-gray-500">
                {credential.certificate_number}
              </p>

              {/* Assessment score (if present) */}
              {credential.assessment_score != null && (
                <p className="mt-1 text-xs text-gray-600">
                  Score: {credential.assessment_score}%
                </p>
              )}

              {/* CPD hours (if present) */}
              {credential.cpd_hours_awarded != null && credential.cpd_hours_awarded > 0 && (
                <p className="mt-0.5 text-xs text-gray-600">
                  CPD: {credential.cpd_hours_awarded} hours
                </p>
              )}

              {/* Bottom row: date + status */}
              <div className="mt-3 flex items-center justify-between w-full">
                <span className="text-xs text-gray-500">
                  {new Date(credential.issued_at).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                >
                  {statusStyle.label}
                </span>
              </div>
            </button>

            {/* Upgrade button */}
            {canUpgrade && onUpgrade && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpgrade(credential);
                }}
                className="mt-3 w-full rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Get Verified Certificate
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
