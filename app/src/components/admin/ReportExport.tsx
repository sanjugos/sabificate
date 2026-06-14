import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

type ReportType = 'itf' | 'cpd';

const PROFESSIONAL_BODIES = ['CIBN', 'ICAN', 'CITN', 'CIPM'] as const;

interface ReportExportProps {
  onClose: () => void;
  orgId: string;
}

export function ReportExport({ onClose, orgId }: ReportExportProps) {
  const [reportType, setReportType] = useState<ReportType>('itf');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [professionalBody, setProfessionalBody] = useState<string>(
    PROFESSIONAL_BODIES[0],
  );
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint =
        reportType === 'itf'
          ? `${API_BASE}/admin/reports/itf`
          : `${API_BASE}/admin/reports/cpd`;

      const body: Record<string, string> = {
        start_date: startDate,
        end_date: endDate,
        org_id: orgId,
      };

      if (reportType === 'cpd') {
        body.professional_body = professionalBody;
      }

      if (reportType === 'itf' && department.trim()) {
        body.department = department.trim();
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(errBody.message || `Export failed (${res.status})`);
      }

      // Trigger browser download
      const blob = await res.blob();
      const filename =
        reportType === 'itf'
          ? `ITF_Form7A_${startDate}_${endDate}.csv`
          : `CPD_Hours_${professionalBody}_${startDate}_${endDate}.csv`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Export Report
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
          {/* Report type selector */}
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">
              Report Type
            </legend>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="reportType"
                  value="itf"
                  checked={reportType === 'itf'}
                  onChange={() => setReportType('itf')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">ITF Form 7A</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="reportType"
                  value="cpd"
                  checked={reportType === 'cpd'}
                  onChange={() => setReportType('cpd')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">CPD Hours Report</span>
              </label>
            </div>
          </fieldset>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="start-date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="end-date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* CPD-specific: professional body */}
          {reportType === 'cpd' && (
            <div>
              <label
                htmlFor="professional-body"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Professional Body
              </label>
              <select
                id="professional-body"
                value={professionalBody}
                onChange={(e) => setProfessionalBody(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                {PROFESSIONAL_BODIES.map((body) => (
                  <option key={body} value={body}>
                    {body}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ITF-specific: department filter */}
          {reportType === 'itf' && (
            <div>
              <label
                htmlFor="department"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Department{' '}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="department"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Finance"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Download button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={loading}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download{' '}
                {reportType === 'itf' ? 'ITF Form 7A' : 'CPD Hours Report'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
