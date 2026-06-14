import { useState, useEffect } from 'react';
import type { Credential } from '../../../contracts/api/credentials';

interface CredentialListProps {
  onSelect: (credential: Credential) => void;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
  revoked: { bg: 'bg-red-100', text: 'text-red-800', label: 'Revoked' },
  expired: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Expired' },
};

async function fetchCredentials(): Promise<Credential[]> {
  const res = await fetch('/api/v1/credentials', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load credentials');
  const body = (await res.json()) as { credentials: Credential[] };
  return body.credentials;
}

export function CredentialList({ onSelect }: CredentialListProps) {
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

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {credentials.map((credential) => {
        const style = STATUS_STYLES[credential.status] ?? STATUS_STYLES.active;

        return (
          <button
            key={credential.id}
            type="button"
            onClick={() => onSelect(credential)}
            className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {/* Co-brand logo */}
            {credential.co_brand_logo_url && (
              <img
                src={credential.co_brand_logo_url}
                alt="Partner organization"
                className="mb-2 h-8 w-auto object-contain"
              />
            )}

            {/* Course name */}
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
              {credential.course_title}
            </h3>

            {/* Certificate number */}
            <p className="mt-1 font-mono text-xs text-gray-500">
              {credential.certificate_number}
            </p>

            {/* Bottom row: date + status */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {new Date(credential.issued_at).toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
              >
                {style.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
