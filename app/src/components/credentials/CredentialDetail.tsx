import { useState, useCallback } from 'react';
import type { Credential } from '../../../contracts/api/credentials';
import { QRCode } from './QRCode';

interface CredentialDetailProps {
  credential: Credential;
  onBack: () => void;
}

export function CredentialDetail({ credential, onBack }: CredentialDetailProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(credential.verification_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = credential.verification_url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [credential.verification_url]);

  const statusStyle = {
    active: 'bg-green-100 text-green-800',
    revoked: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-600',
  }[credential.status] ?? 'bg-gray-100 text-gray-600';

  const credentialJson = credential.credential_json as Record<string, unknown>;
  const evidence = (credentialJson.evidence ?? []) as Array<{
    id?: string;
    name?: string;
  }>;

  return (
    <div className="mx-auto max-w-lg">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to credentials
      </button>

      {/* Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
          {credential.co_brand_logo_url && (
            <img
              src={credential.co_brand_logo_url}
              alt="Partner organization"
              className="mb-3 h-10 w-auto rounded bg-white/20 object-contain p-1"
            />
          )}
          <h2 className="text-lg font-bold">{credential.course_title}</h2>
          <p className="mt-1 font-mono text-sm text-blue-100">
            {credential.certificate_number}
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center border-b border-gray-100 bg-gray-50 py-6">
          <div data-qr-svg>
            <QRCode url={credential.verification_url} size={200} />
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4 px-6 py-5">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Status</span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}
            >
              {credential.status.charAt(0).toUpperCase() + credential.status.slice(1)}
            </span>
          </div>

          {/* Issue date */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Issued</span>
            <span className="text-sm font-medium text-gray-900">
              {new Date(credential.issued_at).toLocaleDateString('en-NG', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* Expiry */}
          {credential.expires_at && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Expires</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(credential.expires_at).toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}

          {/* Assessment score */}
          {credential.assessment_score != null && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Score</span>
              <span className="text-sm font-medium text-gray-900">
                {credential.assessment_score}%
              </span>
            </div>
          )}

          {/* CPD hours */}
          {credential.cpd_hours_awarded != null && credential.cpd_hours_awarded > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">CPD Hours</span>
              <span className="text-sm font-medium text-gray-900">
                {credential.cpd_hours_awarded} hours
              </span>
            </div>
          )}

          {/* Co-brand signatory */}
          {credential.co_brand_signatory && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Signatory</span>
              <span className="text-sm font-medium text-gray-900">
                {credential.co_brand_signatory}
              </span>
            </div>
          )}

          {/* Evidence links */}
          {evidence.length > 0 && (
            <div>
              <span className="text-sm text-gray-500">Evidence / Artifacts</span>
              <ul className="mt-2 space-y-1">
                {evidence.map((item, i) => (
                  <li key={i}>
                    <a
                      href={item.id}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
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
                          d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                        />
                      </svg>
                      {item.name ?? `Artifact ${i + 1}`}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={handleShare}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935-2.186 2.25 2.25 0 0 0-3.935 2.186Zm0-12.814a2.25 2.25 0 1 0 3.935-2.186 2.25 2.25 0 0 0-3.935 2.186Z"
              />
            </svg>
            {copied ? 'Link copied!' : 'Share verification link'}
          </button>
        </div>
      </div>
    </div>
  );
}
