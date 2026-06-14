import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth/useAuth';
import { useDataSaverMode } from '../../lib/pwa/useDataSaverMode';
import { api } from '../../lib/api/client';
import { LessonPlayer as LessonPlayerComponent } from '../../components/course/LessonPlayer';
import type { LessonContent } from '../../../contracts/schemas/content';
import type { DifficultyTier } from '../../../contracts/types';

export default function LessonPlayerPage() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { mode } = useDataSaverMode();
  const [content, setContent] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tier: DifficultyTier = (user?.data_saver_mode as DifficultyTier) ?? 'intermediate';

  useEffect(() => {
    if (!isAuthenticated || !slug || !lessonId) return;
    setLoading(true);
    api.get<LessonContent>(`/courses/${slug}/content/${lessonId}?tier=${tier}`)
      .then(setContent)
      .catch((e) => setError(e.message ?? 'Failed to load lesson'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, slug, lessonId, tier]);

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
        <p className="text-gray-500 mb-4">Sign in to access lessons</p>
        <Link to="/login" className="text-blue-700 font-medium">Sign In</Link>
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

  return (
    <LessonPlayerComponent
      lesson={content}
      difficulty={tier}
      dataSaverMode={mode}
      isOffline={false}
      onProgressUpdate={() => {}}
      onQuizSubmit={() => {}}
      onLessonComplete={() => {}}
    />
  );
}
