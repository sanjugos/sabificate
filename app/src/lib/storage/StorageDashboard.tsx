import { useState, useCallback } from 'react';
import { useStorageManager } from './useStorageManager';

// ── Helpers ───────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

/** Estimate Naira data cost: roughly NGN 350/GB on Nigerian networks. */
function estimateDataCostNGN(bytes: number): number {
  const gb = bytes / (1024 * 1024 * 1024);
  return Math.ceil(gb * 350);
}

// ── Component ─────────────────────────────────────────────────────────────

export function StorageDashboard() {
  const {
    usedBytes,
    totalBytes,
    usagePercent,
    courseStorageMap,
    evictCourse,
    refreshEstimates,
    isWarning,
  } = useStorageManager();

  const [evicting, setEvicting] = useState<string | null>(null);

  const handleEvict = useCallback(
    async (courseId: string) => {
      setEvicting(courseId);
      await evictCourse(courseId);
      setEvicting(null);
    },
    [evictCourse],
  );

  const handleCleanupCompleted = useCallback(async () => {
    // Evict all courses (in a real implementation, we'd check completion status
    // via the progress DB — for now, this triggers a refresh)
    for (const entry of courseStorageMap) {
      await evictCourse(entry.courseId);
    }
    await refreshEstimates();
  }, [courseStorageMap, evictCourse, refreshEstimates]);

  const percentDisplay = Math.round(usagePercent * 100);
  const barColor = isWarning
    ? 'bg-amber-500'
    : usagePercent > 0.6
      ? 'bg-blue-500'
      : 'bg-green-500';

  return (
    <div className="space-y-6">
      {/* Storage warning banner */}
      {isWarning && (
        <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-4">
          <svg
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">
              Storage almost full
            </p>
            <p className="mt-1 text-sm text-amber-700">
              You are using {percentDisplay}% of available storage. Remove
              completed courses to free up space.
            </p>
          </div>
        </div>
      )}

      {/* Overall storage bar */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Device Storage</h3>
          <span className="text-xs text-gray-500">
            {formatBytes(usedBytes)} / {totalBytes > 0 ? formatBytes(totalBytes) : 'Unknown'}
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(percentDisplay, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {percentDisplay}% used
          {totalBytes > 0 && ` — ${formatBytes(totalBytes - usedBytes)} available`}
        </p>
      </div>

      {/* Per-course storage */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Offline Courses ({courseStorageMap.length})
          </h3>
          {courseStorageMap.length > 0 && (
            <button
              type="button"
              onClick={handleCleanupCompleted}
              className="text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              Clean up completed
            </button>
          )}
        </div>

        {courseStorageMap.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">
            No offline course data stored
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {courseStorageMap.map((entry) => {
              const entryPercent =
                usedBytes > 0
                  ? Math.max(1, Math.round((entry.bytes / usedBytes) * 100))
                  : 0;

              return (
                <li
                  key={entry.courseId}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {entry.courseTitle}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-blue-400"
                          style={{ width: `${entryPercent}%` }}
                        />
                      </div>
                      <span className="flex-shrink-0 text-xs text-gray-500">
                        {formatBytes(entry.bytes)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      ~NGN {estimateDataCostNGN(entry.bytes).toLocaleString()} of data
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={evicting === entry.courseId}
                    onClick={() => void handleEvict(entry.courseId)}
                    className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    aria-label={`Remove ${entry.courseTitle} offline data`}
                  >
                    {evicting === entry.courseId ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                    ) : (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Data cost info */}
      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-xs text-blue-700">
          <span className="font-medium">Data costs:</span> Downloading a course
          uses approximately{' '}
          {formatBytes(100 * 1024)} of data (NGN{' '}
          {estimateDataCostNGN(100 * 1024).toLocaleString()} estimated). Offline
          courses save data by avoiding repeated downloads.
        </p>
      </div>
    </div>
  );
}
