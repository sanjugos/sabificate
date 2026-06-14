import { useState, useEffect, useMemo } from 'react';
import { CSVUpload } from './CSVUpload';
import { ReportExport } from './ReportExport';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

/* ------------------------------------------------------------------ */
/*  Contract types                                                     */
/* ------------------------------------------------------------------ */

interface AdminDashboardOverview {
  total_learners: number;
  active_learners_30d: number;
  completion_rate: number;
  avg_assessment_score: number;
  total_learning_hours: number;
  courses_assigned: number;
}

interface AdminLearnerRow {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  department: string | null;
  courses_enrolled: number;
  courses_completed: number;
  avg_score: number;
  total_hours: number;
  last_active_at: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface PaginatedLearners {
  learners: AdminLearnerRow[];
  pagination: Pagination;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function MetricCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | string;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        {suffix && (
          <span className="text-base font-medium text-gray-500 ml-0.5">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const PER_PAGE = 20;

export function AdminDashboardView() {
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null);
  const [learners, setLearners] = useState<AdminLearnerRow[]>([]);
  const [totalLearnerRows, setTotalLearnerRows] = useState(0);
  const [learnerPage, setLearnerPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [showReportExport, setShowReportExport] = useState(false);

  // Fetch overview stats
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/admin/dashboard/overview`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = (await res.json()) as AdminDashboardOverview;
        if (!cancelled) setOverview(data);
      } catch {
        // silent
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch learners
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(learnerPage));
        params.set('limit', String(PER_PAGE));

        const res = await fetch(
          `${API_BASE}/admin/dashboard/learners?${params.toString()}`,
          { credentials: 'include' },
        );
        if (!res.ok) return;
        const data = (await res.json()) as PaginatedLearners;
        if (!cancelled) {
          setLearners(data.learners);
          setTotalLearnerRows(data.pagination.total);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [learnerPage]);

  // Client-side search filtering
  const filteredLearners = useMemo(() => {
    if (!searchQuery.trim()) return learners;
    const q = searchQuery.toLowerCase();
    return learners.filter(
      (l) =>
        l.first_name.toLowerCase().includes(q) ||
        l.last_name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.department && l.department.toLowerCase().includes(q)),
    );
  }, [learners, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(totalLearnerRows / PER_PAGE));

  return (
    <section className="px-4 py-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowCSVUpload(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Upload CSV
          </button>
          <button
            type="button"
            onClick={() => setShowReportExport(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard
          label="Total Learners"
          value={overview?.total_learners ?? '--'}
        />
        <MetricCard
          label="Active (30d)"
          value={overview?.active_learners_30d ?? '--'}
        />
        <MetricCard
          label="Completion Rate"
          value={overview ? Math.round(overview.completion_rate) : '--'}
          suffix="%"
        />
        <MetricCard
          label="Avg Score"
          value={overview ? Math.round(overview.avg_assessment_score) : '--'}
          suffix="%"
        />
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search learners by name, email, or department..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Learners table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Name
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                Email
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">
                Department
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                Courses
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                Completed
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">
                Avg Score
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                Hours
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                Last Active
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-3 py-3">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <div className="h-4 bg-gray-200 rounded w-32" />
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <div className="h-4 bg-gray-200 rounded w-20" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-4 bg-gray-200 rounded w-8 ml-auto" />
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <div className="h-4 bg-gray-200 rounded w-8 ml-auto" />
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <div className="h-4 bg-gray-200 rounded w-10 ml-auto" />
                  </td>
                  <td className="px-3 py-3 hidden lg:table-cell">
                    <div className="h-4 bg-gray-200 rounded w-10 ml-auto" />
                  </td>
                  <td className="px-3 py-3 hidden lg:table-cell">
                    <div className="h-4 bg-gray-200 rounded w-16 ml-auto" />
                  </td>
                </tr>
              ))
            ) : filteredLearners.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-gray-500"
                >
                  No learners found.
                </td>
              </tr>
            ) : (
              filteredLearners.map((l) => (
                <tr key={l.user_id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">
                    {l.first_name} {l.last_name}
                  </td>
                  <td className="px-3 py-3 text-gray-600 hidden sm:table-cell">
                    {l.email}
                  </td>
                  <td className="px-3 py-3 text-gray-600 hidden md:table-cell">
                    {l.department ?? '--'}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-700">
                    {l.courses_enrolled}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-700 hidden sm:table-cell">
                    {l.courses_completed}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-700 hidden md:table-cell">
                    {Math.round(l.avg_score)}%
                  </td>
                  <td className="px-3 py-3 text-right text-gray-700 hidden lg:table-cell">
                    {l.total_hours.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-500 hidden lg:table-cell whitespace-nowrap">
                    {formatDate(l.last_active_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <nav
          className="flex items-center justify-between mt-4"
          aria-label="Learner pagination"
        >
          <button
            type="button"
            disabled={learnerPage <= 1}
            onClick={() => setLearnerPage((p) => Math.max(1, p - 1))}
            className="rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {learnerPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={learnerPage >= totalPages}
            onClick={() => setLearnerPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </nav>
      )}

      {/* CSV Upload modal */}
      {showCSVUpload && (
        <CSVUpload
          onClose={() => setShowCSVUpload(false)}
          orgId="default"
        />
      )}

      {/* Report Export modal */}
      {showReportExport && (
        <ReportExport
          onClose={() => setShowReportExport(false)}
          orgId="default"
        />
      )}
    </section>
  );
}
