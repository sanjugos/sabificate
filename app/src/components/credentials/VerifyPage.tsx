import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { CredentialVerification } from '../../../contracts/api/credentials';

async function fetchVerification(
  credentialId: string,
): Promise<CredentialVerification> {
  const res = await fetch(`/api/v1/verify/${credentialId}`);
  if (!res.ok) throw new Error('Verification failed');
  return (await res.json()) as CredentialVerification;
}

export function VerifyPage() {
  const { credentialId } = useParams<{ credentialId: string }>();
  const [verification, setVerification] = useState<CredentialVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!credentialId) {
      setError('No credential ID provided');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const data = await fetchVerification(credentialId!);
        if (!cancelled) {
          setVerification(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Verification failed');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [credentialId]);

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Verifying credential...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Verification Error</h1>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!verification) return null;

  const isValid = verification.valid;

  return (
    <div className="flex min-h-svh items-start justify-center bg-gray-50 p-4 pt-8 sm:pt-16">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-lg">
        {/* SABIficate branding header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-sm font-bold text-white">
              S
            </div>
            <span className="text-lg font-bold text-white">SABIficate</span>
          </div>
          <p className="mt-1 text-sm text-blue-100">Credential Verification</p>
        </div>

        {/* Validity banner */}
        <div
          className={`flex items-center gap-3 px-6 py-4 ${
            isValid
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {isValid ? (
            <svg className="h-8 w-8 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
          ) : (
            <svg className="h-8 w-8 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          )}
          <div>
            <p className="text-lg font-bold">
              {isValid ? 'Valid Credential' : 'Invalid Credential'}
            </p>
            <p className="text-sm opacity-80">
              {isValid
                ? 'This credential has been verified by SABIficate'
                : 'This credential could not be verified'}
            </p>
          </div>
        </div>

        {/* Credential details */}
        {verification.credential && (
          <div className="space-y-4 px-6 py-5">
            {/* Learner name */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Awarded To
              </label>
              <p className="mt-0.5 text-lg font-semibold text-gray-900">
                {verification.learner_name}
              </p>
            </div>

            {/* Course title */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Course
              </label>
              <p className="mt-0.5 text-base font-medium text-gray-900">
                {verification.course_title}
              </p>
            </div>

            {/* Certificate number */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Certificate Number
              </label>
              <p className="mt-0.5 font-mono text-sm text-gray-700">
                {verification.credential.certificate_number}
              </p>
            </div>

            {/* Issue date */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Issued
              </label>
              <p className="mt-0.5 text-sm text-gray-700">
                {new Date(verification.issued_at).toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            {/* Co-brand info */}
            {verification.credential.co_brand_signatory && (
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                {verification.credential.co_brand_logo_url && (
                  <img
                    src={verification.credential.co_brand_logo_url}
                    alt="Partner"
                    className="h-10 w-10 rounded object-contain"
                  />
                )}
                <div>
                  <p className="text-xs text-gray-500">Co-issued by</p>
                  <p className="text-sm font-medium text-gray-900">
                    {verification.credential.co_brand_signatory}
                  </p>
                </div>
              </div>
            )}

            {/* Evidence links */}
            {verification.evidence_urls.length > 0 && (
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Evidence
                </label>
                <ul className="mt-2 space-y-1.5">
                  {verification.evidence_urls.map((url, i) => (
                    <li key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                          />
                        </svg>
                        Evidence {i + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-3">
          <p className="text-center text-xs text-gray-400">
            Verified by SABIficate &mdash; sabificate.com
          </p>
        </div>
      </div>
    </div>
  );
}
