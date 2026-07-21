import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth/useAuth';
import { useDataSaverMode } from '../../lib/pwa/useDataSaverMode';
import { api, ApiError } from '../../lib/api/client';
import { LessonPlayer as LessonPlayerComponent } from '../../components/course/LessonPlayer';
import { DegradedAccessBanner } from '../../components/ui/DegradedAccessBanner';
import type { LessonContent } from '../../../contracts/schemas/content';
import type { DifficultyTier } from '../../../contracts/types';

interface LessonResponse extends LessonContent {
  degraded_access?: boolean;
  days_remaining?: number;
}

export default function LessonPlayerPage() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { mode } = useDataSaverMode();
  const [content, setContent] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degradedAccess, setDegradedAccess] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const tier: DifficultyTier = (user as Record<string, unknown> | null)?.proficiency_level as DifficultyTier ?? 'working';

  useEffect(() => {
    if (authLoading || !slug || !lessonId) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    // Build URL: omit tier param to let backend auto-detect from persona
    const url = tier
      ? `/courses/${slug}/content/${lessonId}?tier=${tier}`
      : `/courses/${slug}/content/${lessonId}`;

    api.get<LessonResponse>(url)
      .then((data) => {
        if (data.degraded_access) {
          setDegradedAccess(true);
          setDaysRemaining(data.days_remaining ?? 0);
        }
        setContent(data);
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 402) {
          navigate('/pricing');
          return;
        }
        if (e instanceof ApiError && e.status === 403) {
          setError('This lesson requires enrollment. Enroll in the course to access all lessons.');
        } else if (e instanceof ApiError && e.status === 401) {
          setError('sign-in-required');
        } else {
          setError(e.message ?? 'Failed to load lesson');
        }
      })
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated, slug, lessonId, tier, navigate]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 mb-4">Sign in to access this lesson</p>
        <Link
          to={`/login?redirect=/courses/${slug}/lessons/${lessonId}`}
          className="text-blue-700 font-medium"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to={`/courses/${slug}`} className="text-blue-700 font-medium">Back to Course</Link>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Lesson not found</p>
      </div>
    );
  }

  const themeVars = {
    '--bg': '#ffffff',
    '--text': '#6b7280',
    '--text-h': '#111827',
    '--border': '#e5e7eb',
    '--accent': '#2563eb',
    '--accent-bg': '#eff6ff',
    '--accent-border': '#93c5fd',
    '--code-bg': '#f3f4f6',
    '--social-bg': '#f9fafb',
  } as React.CSSProperties;

  return (
    <div style={themeVars}>
      {degradedAccess && <DegradedAccessBanner daysRemaining={daysRemaining} />}
      <LessonPlayerComponent
        lesson={content}
        difficulty={tier}
        dataSaverMode={mode}
        isOffline={false}
        onProgressUpdate={(percent: number) => {
          if (!lessonId) return;
          api.post(`/learner/lessons/${lessonId}/progress`, {
            lesson_id: lessonId,
            status: percent >= 100 ? 'completed' : 'in_progress',
            progress_percent: Math.min(percent, 100),
          }).catch(() => {});
        }}
        onQuizSubmit={() => {}}
        onLessonComplete={() => {
          if (!lessonId) return;
          api.post(`/learner/lessons/${lessonId}/progress`, {
            lesson_id: lessonId,
            status: 'completed',
            progress_percent: 100,
          }).catch(() => {});
        }}
      />
    </div>
  );
}
