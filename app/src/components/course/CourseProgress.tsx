interface ModuleProgress {
  moduleId: string;
  moduleTitle: string;
  completedLessons: number;
  totalLessons: number;
}

interface CourseProgressProps {
  modules: ModuleProgress[];
}

export function CourseProgress({ modules }: CourseProgressProps) {
  const totalCompleted = modules.reduce((sum, m) => sum + m.completedLessons, 0);
  const totalLessons = modules.reduce((sum, m) => sum + m.totalLessons, 0);
  const overallPercent = totalLessons > 0
    ? Math.round((totalCompleted / totalLessons) * 100)
    : 0;

  return (
    <div className="px-4 py-4">
      {/* Overall progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-[var(--text-h)]">
            Course Progress
          </span>
          <span className="text-xs text-[var(--text)]">
            {totalCompleted}/{totalLessons} lessons ({overallPercent}%)
          </span>
        </div>
        <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
      </div>

      {/* Per-module progress */}
      <div className="space-y-3">
        {modules.map((mod) => {
          const percent = mod.totalLessons > 0
            ? Math.round((mod.completedLessons / mod.totalLessons) * 100)
            : 0;

          return (
            <div key={mod.moduleId}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[var(--text-h)] truncate max-w-[70%]">
                  {mod.moduleTitle}
                </span>
                <span className="text-xs text-[var(--text)]">
                  {mod.completedLessons}/{mod.totalLessons}
                </span>
              </div>
              <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
