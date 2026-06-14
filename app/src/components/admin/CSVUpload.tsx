import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../../lib/api/client';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

/* ------------------------------------------------------------------ */
/*  Contract types                                                     */
/* ------------------------------------------------------------------ */

interface BulkEnrollmentStatus {
  job_id: string;
  status: 'processing' | 'completed' | 'failed';
  total_rows: number;
  processed: number;
  succeeded: number;
  failed: number;
  errors: { row: number; email: string; error: string }[];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface CSVUploadProps {
  onClose: () => void;
  orgId: string;
}

type UploadState = 'idle' | 'uploading' | 'polling' | 'completed' | 'failed';

export function CSVUpload({ onClose, orgId }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [dragActive, setDragActive] = useState(false);
  const [jobStatus, setJobStatus] = useState<BulkEnrollmentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up poll on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const pollStatus = useCallback(
    (jobId: string) => {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const data = await api.get<BulkEnrollmentStatus>(
            `/admin/learners/bulk-upload/${jobId}`,
          );
          setJobStatus(data);

          if (data.status === 'completed') {
            setState('completed');
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          } else if (data.status === 'failed') {
            setState('failed');
            setError('The bulk upload job failed. Please try again.');
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          }
        } catch {
          // Keep polling on transient network errors
        }
      }, 2000);
    },
    [],
  );

  async function handleUpload() {
    if (!file) return;

    setState('uploading');
    setError(null);

    try {
      const text = await file.text();
      const res = await fetch(`${API_BASE}/admin/learners/bulk-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/csv',
          'X-Org-Id': orgId,
        },
        credentials: 'include',
        body: text,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(body.message || `Upload failed (${res.status})`);
      }

      const data = (await res.json()) as BulkEnrollmentStatus;
      setJobStatus(data);
      setState('polling');
      pollStatus(data.job_id);
    } catch (err) {
      setState('failed');
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  }

  const progressPercent =
    jobStatus && jobStatus.total_rows > 0
      ? Math.round((jobStatus.processed / jobStatus.total_rows) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Upload Learners CSV
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-4 py-5 space-y-4">
          {/* Drop zone (idle state) */}
          {(state === 'idle' || state === 'failed') && (
            <>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <svg
                  className="h-10 w-10 text-gray-400 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <p className="text-sm text-gray-600 text-center">
                  Drag and drop your CSV file here, or{' '}
                  <span className="text-blue-600 font-medium">
                    click to browse
                  </span>
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {file && (
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                  <svg
                    className="h-4 w-4 text-gray-400 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="truncate">{file.name}</span>
                  <span className="text-gray-400 shrink-0">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="button"
                disabled={!file}
                onClick={handleUpload}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Upload CSV
              </button>
            </>
          )}

          {/* Uploading state */}
          {state === 'uploading' && (
            <div className="flex flex-col items-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-3" />
              <p className="text-sm text-gray-600">Uploading file...</p>
            </div>
          )}

          {/* Polling / progress state */}
          {state === 'polling' && jobStatus && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                Processing learners...
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    {jobStatus.processed} / {jobStatus.total_rows} rows
                  </span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Completed state */}
          {state === 'completed' && jobStatus && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2">
                <svg
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium">Upload complete</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-lg font-bold text-gray-900">
                    {jobStatus.total_rows}
                  </p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-lg font-bold text-green-700">
                    {jobStatus.succeeded}
                  </p>
                  <p className="text-xs text-gray-500">Succeeded</p>
                </div>
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-lg font-bold text-red-700">
                    {jobStatus.failed}
                  </p>
                  <p className="text-xs text-gray-500">Failed</p>
                </div>
              </div>

              {/* Error table */}
              {jobStatus.errors.length > 0 && (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Row
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Email
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {jobStatus.errors.map((err, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-gray-700">
                            {err.row}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {err.email}
                          </td>
                          <td className="px-3 py-2 text-red-600">
                            {err.error}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
