import { useEffect, useState, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth/useAuth';
import { api } from '../../lib/api/client';
import type { LearnerDashboard, EnrolledCourseSummary } from '../../../contracts/api/progress';

interface PersonaResponse {
  persona: { id: string; persona_slug: string } | null;
}

function CourseCard({ course }: { course: EnrolledCourseSummary }) {
  const isCompleted = course.progress_percent >= 100;

  return (
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
          className={`h-full rounded-full transition-all ${isCompleted ? 'bg-green-600' : 'bg-blue-600'}`}
          style={{ width: `${course.progress_percent}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{course.progress_percent}% complete</p>
    </Link>
  );
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [dashboard, setDashboard] = useState<LearnerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [personaChecked, setPersonaChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Check persona onboarding status
  useEffect(() => {
    if (!isAuthenticated) {
      setPersonaChecked(true);
      return;
    }
    const staffRoles = ['corporate_admin', 'platform_admin', 'curriculum_author', 'sme_reviewer'];
    if (user && staffRoles.includes(user.role)) {
      setPersonaChecked(true);
      return;
    }
    api.get<PersonaResponse>('/learner/persona')
      .then((res) => {
        if (!res.persona) {
          setNeedsOnboarding(true);
        }
      })
      .catch(() => {})
      .finally(() => setPersonaChecked(true));
  }, [isAuthenticated, user]);

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

  // Split enrolled courses into in-progress and completed
  const { inProgress, completed } = useMemo(() => {
    if (!dashboard) return { inProgress: [], completed: [] };
    const ip: EnrolledCourseSummary[] = [];
    const done: EnrolledCourseSummary[] = [];
    for (const course of dashboard.enrolled_courses) {
      if (course.progress_percent >= 100) {
        done.push(course);
      } else {
        ip.push(course);
      }
    }
    return { inProgress: ip, completed: done };
  }, [dashboard]);

  if (authLoading || !personaChecked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
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

  const isStaffRole = user?.role && ['platform_admin', 'corporate_admin', 'curriculum_author', 'sme_reviewer'].includes(user.role);

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Welcome back, {user?.first_name}
        </h1>
        <p className="text-sm text-gray-500">
          {isStaffRole ? 'Manage your platform' : 'Continue your learning journey'}
        </p>
      </div>

      {isStaffRole && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {['platform_admin', 'corporate_admin'].includes(user!.role) && (
            <Link to="/admin" className="block rounded-lg border border-blue-200 bg-blue-50 p-4 active:bg-blue-100">
              <h3 className="font-medium text-blue-900 text-sm">Admin Panel</h3>
              <p className="text-xs text-blue-700 mt-1">User management, organization settings</p>
            </Link>
          )}
          <Link to="/studio" className="block rounded-lg border border-purple-200 bg-purple-50 p-4 active:bg-purple-100">
            <h3 className="font-medium text-purple-900 text-sm">Curriculum Studio</h3>
            <p className="text-xs text-purple-700 mt-1">Authoring pipeline, track management</p>
          </Link>
          <Link to="/courses" className="block rounded-lg border border-gray-200 bg-gray-50 p-4 active:bg-gray-100">
            <h3 className="font-medium text-gray-900 text-sm">Course Catalog</h3>
            <p className="text-xs text-gray-600 mt-1">Browse all published courses</p>
          </Link>
        </div>
      )}

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

      {/* In Progress section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">In Progress</h2>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : inProgress.length === 0 && completed.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <p className="text-gray-500 mb-3">No courses enrolled yet</p>
            <Link to="/courses" className="text-blue-700 font-medium">Browse Courses →</Link>
          </div>
        ) : inProgress.length === 0 ? (
          <p className="text-sm text-gray-500">No courses in progress</p>
        ) : (
          <div className="space-y-3">
            {inProgress.map((course) => (
              <CourseCard key={course.course_id} course={course} />
            ))}
          </div>
        )}
      </div>

      {/* Completed section */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Completed</h2>
          <div className="space-y-3">
            {completed.map((course) => (
              <CourseCard key={course.course_id} course={course} />
            ))}
          </div>
        </div>
      )}

      {/* Recommended Next section */}
      {dashboard && dashboard.recommended_courses && dashboard.recommended_courses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recommended Next</h2>
          <div className="space-y-3">
            {dashboard.recommended_courses.map((course) => (
              <Link
                key={course.course_id}
                to={`/courses/${course.course_slug}`}
                className="block rounded-lg border border-blue-100 bg-blue-50 p-4 active:bg-blue-100"
              >
                <h3 className="font-medium text-gray-900 text-sm">{course.course_title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 capitalize">
                    {course.difficulty_tier}
                  </span>
                  <span className="text-xs text-gray-500">{course.category}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

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
