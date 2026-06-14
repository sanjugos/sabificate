import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api/client';

/* ------------------------------------------------------------------ */
/*  Contract types                                                     */
/* ------------------------------------------------------------------ */

interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string | null;
  category: { id: string; name: string; slug: string };
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_minutes: number;
  cpd_hours: number | null;
  professional_body: string | null;
  lesson_count: number;
  module_count: number;
  learning_objectives: string[];
  prerequisites: string[];
  modules: {
    id: string;
    title: string;
    sort_order: number;
    lessons: {
      id: string;
      title: string;
      sort_order: number;
      estimated_duration_minutes: number;
      has_quiz: boolean;
      has_artifact: boolean;
    }[];
  }[];
  enrollment_status: 'enrolled' | 'not_enrolled' | null;
}

interface CourseProgressSummary {
  lessons: { lesson_id: string; status: string; progress_percent: number; completed_at: string | null }[];
  overall_percent: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs} hrs ${mins} min` : `${hrs} hrs`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CourseDetailView() {
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [progress, setProgress] = useState<CourseProgressSummary | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(),
  );

  // Fetch course
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const data = await api.get<CourseDetail>(`/courses/${slug}`);
        if (!cancelled) {
          setCourse(data);
          // Expand first module by default
          if (data.modules.length > 0) {
            setExpandedModules(new Set([data.modules[0].id]));
          }
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (slug) load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Fetch progress if enrolled
  useEffect(() => {
    if (!course || course.enrollment_status !== 'enrolled') return;
    let cancelled = false;

    async function loadProgress() {
      try {
        const data = await api.get<CourseProgressSummary>(
          `/learner/courses/${course!.id}/progress`,
        );
        if (!cancelled) setProgress(data);
      } catch {
        // silent
      }
    }

    loadProgress();
    return () => {
      cancelled = true;
    };
  }, [course]);

  async function handleEnroll() {
    if (!course) return;
    setEnrolling(true);
    try {
      await api.post(`/courses/${course.slug}/enroll`);
      setCourse({ ...course, enrollment_status: 'enrolled' });
    } catch {
      // silent
    } finally {
      setEnrolling(false);
    }
  }

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }

  /* Loading state */
  if (loading) {
    return (
      <section className="px-4 py-6 max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-48 bg-gray-200 rounded-lg" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-4/5" />
        </div>
      </section>
    );
  }

  /* 404 state */
  if (notFound || !course) {
    return (
      <section className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Course Not Found
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          The course you are looking for does not exist or has been removed.
        </p>
        <Link
          to="/courses"
          className="rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Browse Courses
        </Link>
      </section>
    );
  }

  const difficultyLabel =
    course.difficulty_level.charAt(0).toUpperCase() +
    course.difficulty_level.slice(1);

  const isEnrolled = course.enrollment_status === 'enrolled';
  const sortedModules = [...course.modules].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  return (
    <section className="px-4 py-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-gray-500">
        <Link to="/courses" className="hover:text-blue-600">
          Courses
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-900">{course.title}</span>
      </nav>

      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {course.title}
        </h1>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          {course.description}
        </p>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-block rounded-full bg-gray-100 text-gray-700 px-2.5 py-0.5 text-xs font-medium">
            {course.category.name}
          </span>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_STYLES[course.difficulty_level]}`}
          >
            {difficultyLabel}
          </span>
          <span className="inline-block text-xs text-gray-500">
            {formatDuration(course.estimated_duration_minutes)}
          </span>
          {course.cpd_hours != null && (
            <span className="inline-block rounded-full bg-blue-50 text-blue-700 px-2.5 py-0.5 text-xs font-medium">
              {course.cpd_hours} CPD hrs
            </span>
          )}
          {course.professional_body && (
            <span className="inline-block rounded-full bg-purple-50 text-purple-700 px-2.5 py-0.5 text-xs font-medium">
              {course.professional_body}
            </span>
          )}
        </div>

        {/* Progress bar (enrolled only) */}
        {isEnrolled && progress && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">
                Progress
              </span>
              <span className="text-xs text-gray-500">
                {progress.lessons.filter((l) => l.status === 'completed').length}/{progress.lessons.length} lessons (
                {progress.overall_percent}%)
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progress.overall_percent}%` }}
              />
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={isEnrolled ? undefined : handleEnroll}
          disabled={enrolling}
          className={`w-full sm:w-auto rounded-lg px-6 py-2.5 text-sm font-medium transition-colors ${
            isEnrolled
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-50`}
        >
          {enrolling
            ? 'Enrolling...'
            : isEnrolled
              ? 'Continue Learning'
              : 'Enroll Now'}
        </button>
      </header>

      {/* Learning objectives */}
      {course.learning_objectives.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            What you will learn
          </h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {course.learning_objectives.map((obj, i) => (
              <li key={i}>{obj}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Prerequisites */}
      {course.prerequisites.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Prerequisites
          </h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {course.prerequisites.map((pre, i) => (
              <li key={i}>{pre}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Modules accordion */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Course Content
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          {course.module_count} modules &middot; {course.lesson_count} lessons
          &middot; {formatDuration(course.estimated_duration_minutes)}
        </p>

        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 overflow-hidden">
          {sortedModules.map((mod) => {
            const isExpanded = expandedModules.has(mod.id);
            const sortedLessons = [...mod.lessons].sort(
              (a, b) => a.sort_order - b.sort_order,
            );

            return (
              <div key={mod.id}>
                <button
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {mod.title}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-500">
                      {sortedLessons.length} lessons
                    </span>
                    <svg
                      className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <ul className="divide-y divide-gray-100">
                    {sortedLessons.map((lesson) => (
                      <li key={lesson.id}>
                        <Link
                          to={
                            isEnrolled
                              ? `/courses/${course.slug}/lessons/${lesson.id}`
                              : '#'
                          }
                          className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                            isEnrolled
                              ? 'hover:bg-blue-50 text-gray-800'
                              : 'text-gray-500 cursor-default'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <svg
                              className="h-4 w-4 shrink-0 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="truncate">{lesson.title}</span>
                          </span>
                          <span className="flex items-center gap-2 shrink-0 text-xs text-gray-400">
                            {lesson.has_quiz && (
                              <span
                                title="Has quiz"
                                className="inline-flex items-center gap-0.5"
                              >
                                <svg
                                  className="h-3.5 w-3.5"
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
                                Quiz
                              </span>
                            )}
                            <span>
                              {formatDuration(
                                lesson.estimated_duration_minutes,
                              )}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
