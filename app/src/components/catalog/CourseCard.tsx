import { Link } from 'react-router-dom';

interface CourseSummary {
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
}

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

interface CourseCardProps {
  course: CourseSummary;
}

export function CourseCard({ course }: CourseCardProps) {
  const difficultyLabel =
    course.difficulty_level.charAt(0).toUpperCase() +
    course.difficulty_level.slice(1);

  return (
    <Link
      to={`/courses/${course.slug}`}
      className="block rounded-lg shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {/* Thumbnail */}
      {course.thumbnail_url ? (
        <img
          src={course.thumbnail_url}
          alt={course.title}
          className="w-full h-40 object-cover rounded-t-lg"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-40 rounded-t-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <span className="text-white text-3xl font-bold opacity-60">
            {course.title.charAt(0)}
          </span>
        </div>
      )}

      <div className="p-4 space-y-2">
        {/* Title */}
        <h3 className="text-base font-semibold text-gray-900 line-clamp-2 leading-snug">
          {course.title}
        </h3>

        {/* Category pill + difficulty badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-block rounded-full bg-gray-100 text-gray-700 px-2.5 py-0.5 text-xs font-medium">
            {course.category.name}
          </span>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_STYLES[course.difficulty_level]}`}
          >
            {difficultyLabel}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
          <span className="flex items-center gap-1">
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
                d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
              />
            </svg>
            {formatDuration(course.estimated_duration_minutes)}
          </span>
          <span className="flex items-center gap-1">
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
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
            {course.lesson_count} lessons
          </span>
        </div>
      </div>
    </Link>
  );
}
