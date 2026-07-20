import type { LessonStatus } from '../types';

export interface QuizAnswer {
  quiz_block_id: string;
  selected_option: number;
  is_correct: boolean;
  answered_at: string;
}

export interface ProgressSyncPayload {
  lesson_id: string;
  status: 'in_progress' | 'completed';
  progress_percent: number;
  time_spent_seconds: number;
  quiz_answers?: QuizAnswer[];
  synced_at: string;
  client_id: string;
}

export interface ProgressSyncResponse {
  accepted: boolean;
  server_progress: {
    lesson_id: string;
    status: LessonStatus;
    progress_percent: number;
    completed_at: string | null;
  };
  conflicts?: ProgressConflict[];
}

export interface ProgressConflict {
  field: string;
  client_value: unknown;
  server_value: unknown;
  resolution: 'server_wins' | 'client_wins';
}

export interface RecommendedCourse {
  course_id: string;
  course_title: string;
  course_slug: string;
  difficulty_tier: string;
  category: string;
}

export interface LearnerDashboard {
  enrolled_courses: EnrolledCourseSummary[];
  recent_activity: ActivityItem[];
  stats: {
    courses_completed: number;
    lessons_completed: number;
    total_learning_hours: number;
    current_streak_days: number;
  };
  recommended_courses?: RecommendedCourse[];
}

export interface EnrolledCourseSummary {
  course_id: string;
  course_title: string;
  course_slug: string;
  progress_percent: number;
  lessons_completed: number;
  lessons_total: number;
  last_accessed_at: string | null;
  difficulty_tier: string;
}

export interface ActivityItem {
  type: 'lesson_completed' | 'quiz_passed' | 'course_completed' | 'credential_earned';
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}
