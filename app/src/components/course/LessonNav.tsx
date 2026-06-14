interface LessonNavProps {
  prevLessonId: string | null;
  nextLessonId: string | null;
  prevLessonTitle?: string;
  nextLessonTitle?: string;
  onNavigate: (lessonId: string) => void;
}

export function LessonNav({
  prevLessonId,
  nextLessonId,
  prevLessonTitle,
  nextLessonTitle,
  onNavigate,
}: LessonNavProps) {
  return (
    <nav className="flex gap-3 px-4 py-4 border-t border-[var(--border)]">
      {/* Previous */}
      <button
        type="button"
        disabled={!prevLessonId}
        onClick={() => prevLessonId && onNavigate(prevLessonId)}
        className="flex-1 min-h-[44px] flex flex-col items-start justify-center px-3 py-2 rounded-lg border border-[var(--border)] text-left transition-colors hover:border-[var(--accent)] active:bg-[var(--accent-bg)] disabled:opacity-30 disabled:cursor-default"
      >
        <span className="text-xs text-[var(--text)]">Previous</span>
        <span className="text-sm font-medium text-[var(--text-h)] truncate max-w-full">
          {prevLessonTitle ?? 'Lesson'}
        </span>
      </button>

      {/* Next */}
      <button
        type="button"
        disabled={!nextLessonId}
        onClick={() => nextLessonId && onNavigate(nextLessonId)}
        className="flex-1 min-h-[44px] flex flex-col items-end justify-center px-3 py-2 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-bg)] text-right transition-colors hover:bg-[var(--accent)] hover:text-white active:opacity-80 disabled:opacity-30 disabled:cursor-default disabled:bg-transparent disabled:border-[var(--border)]"
      >
        <span className="text-xs text-[var(--text)]">Next</span>
        <span className="text-sm font-medium text-[var(--text-h)] truncate max-w-full">
          {nextLessonTitle ?? 'Lesson'}
        </span>
      </button>
    </nav>
  );
}
