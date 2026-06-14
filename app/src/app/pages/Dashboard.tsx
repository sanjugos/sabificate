import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth/useAuth';
import { api } from '../../lib/api/client';
import type { LearnerDashboard } from '../../../contracts/api/progress';

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [dashboard, setDashboard] = useState<LearnerDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    api.get<LearnerDashboard>('/learner/dashboard')
      .then(setDashboard)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SABIficate</h1>
        <p className="text-gray-600 mb-6">Professional microlearning for Nigerian working professionals</p>
        <div className="space-y-3 max-w-xs mx-auto">
          <Link to="/login" className="block w-full rounded-lg bg-blue-700 px-4 py-3 text-center font-medium text-white">
            Sign In
          </Link>
          <Link to="/register" className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-center font-medium text-gray-700">
            Create Account
          </Link>
        </div>
        <div className="mt-8">
          <Link to="/courses" className="text-blue-700 font-medium">Browse Courses →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Welcome back, {user?.first_name}
        </h1>
        <p className="text-sm text-gray-500">Continue your learning journey</p>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-2xl font-bold text-blue-700">{dashboard.stats.lessons_completed}</p>
            <p className="text-xs text-gray-600">Lessons Done</p>
          </div>
          <div className="rounded-lg bg-green-50 p-3">
            <p className="text-2xl font-bold text-green-700">{dashboard.stats.courses_completed}</p>
            <p className="text-xs text-gray-600">Courses Completed</p>
          </div>
          <div className="rounded-lg bg-purple-50 p-3">
            <p className="text-2xl font-bold text-purple-700">{dashboard.stats.total_learning_hours}h</p>
            <p className="text-xs text-gray-600">Learning Time</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-3">
            <p className="text-2xl font-bold text-orange-700">{dashboard.stats.current_streak_days}</p>
            <p className="text-xs text-gray-600">Day Streak</p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">My Courses</h2>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : dashboard?.enrolled_courses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <p className="text-gray-500 mb-3">No courses enrolled yet</p>
            <Link to="/courses" className="text-blue-700 font-medium">Browse Courses →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {dashboard?.enrolled_courses.map((course) => (
              <Link
                key={course.course_id}
                to={`/courses/${course.course_slug}`}
                className="block rounded-lg border border-gray-200 p-4 active:bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 text-sm">{course.course_title}</h3>
                  <span className="text-xs text-gray-500">
                    {course.lessons_completed}/{course.lessons_total}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{ width: `${course.progress_percent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{course.progress_percent}% complete</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {dashboard && dashboard.recent_activity.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h2>
          <div className="space-y-2">
            {dashboard.recent_activity.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-green-600">✓</span>
                <span className="text-gray-700">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
