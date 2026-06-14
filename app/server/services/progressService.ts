import { query } from '../db/index.js';
import type { LessonStatus } from '../../contracts/types/index.js';
import type {
  ProgressSyncPayload,
  ProgressSyncResponse,
  ProgressConflict,
  QuizAnswer,
  LearnerDashboard,
  EnrolledCourseSummary,
  ActivityItem,
} from '../../contracts/api/progress.js';

// ── getLearnerDashboard ────────────────────────────────────────────────────

export async function getLearnerDashboard(userId: string): Promise<LearnerDashboard> {
  // Enrolled courses with progress
  const enrolledResult = await query(
    `SELECT
       e.course_id,
       c.title AS course_title,
       c.slug  AS course_slug,
       c.difficulty_level AS difficulty_tier,
       (SELECT COUNT(*)::int FROM lessons l WHERE l.course_id = c.id AND l.is_published = true) AS lessons_total,
       (SELECT COUNT(*)::int FROM learner_progress lp
        WHERE lp.user_id = $1 AND lp.course_id = c.id AND lp.status = 'completed') AS lessons_completed,
       (SELECT MAX(lp.updated_at) FROM learner_progress lp
        WHERE lp.user_id = $1 AND lp.course_id = c.id) AS last_accessed_at
     FROM enrollment e
     JOIN courses c ON c.id = e.course_id
     WHERE e.user_id = $1 AND e.status = 'active'
     ORDER BY last_accessed_at DESC NULLS LAST`,
    [userId],
  );

  const enrolled_courses: EnrolledCourseSummary[] = enrolledResult.rows.map((r) => {
    const lessonsTotal = r.lessons_total || 1;
    const lessonsCompleted = r.lessons_completed || 0;
    return {
      course_id: r.course_id,
      course_title: r.course_title,
      course_slug: r.course_slug,
      progress_percent: Math.round((lessonsCompleted / lessonsTotal) * 100),
      lessons_completed: lessonsCompleted,
      lessons_total: r.lessons_total,
      last_accessed_at: r.last_accessed_at?.toISOString() ?? null,
      difficulty_tier: r.difficulty_tier,
    };
  });

  // Recent activity
  const activityResult = await query(
    `(
       SELECT 'lesson_completed' AS type, l.title, lp.completed_at AS timestamp,
              jsonb_build_object('course_id', lp.course_id::text, 'lesson_id', lp.lesson_id::text) AS metadata
       FROM learner_progress lp
       JOIN lessons l ON l.id = lp.lesson_id
       WHERE lp.user_id = $1 AND lp.status = 'completed' AND lp.completed_at IS NOT NULL
     )
     UNION ALL
     (
       SELECT 'course_completed' AS type, c.title, e.completed_at AS timestamp,
              jsonb_build_object('course_id', e.course_id::text) AS metadata
       FROM enrollment e
       JOIN courses c ON c.id = e.course_id
       WHERE e.user_id = $1 AND e.status = 'completed' AND e.completed_at IS NOT NULL
     )
     ORDER BY timestamp DESC
     LIMIT 20`,
    [userId],
  );

  const recent_activity: ActivityItem[] = activityResult.rows.map((r) => ({
    type: r.type as ActivityItem['type'],
    title: r.title,
    timestamp: r.timestamp?.toISOString() ?? new Date().toISOString(),
    metadata: typeof r.metadata === 'object' ? r.metadata : {},
  }));

  // Stats
  const statsResult = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM enrollment WHERE user_id = $1 AND status = 'completed') AS courses_completed,
       (SELECT COUNT(*)::int FROM learner_progress WHERE user_id = $1 AND status = 'completed') AS lessons_completed,
       (SELECT COALESCE(SUM(time_spent_seconds), 0)::int FROM learner_progress WHERE user_id = $1) AS total_seconds`,
    [userId],
  );

  const s = statsResult.rows[0];

  // Streak calculation: count consecutive days with activity ending today
  const streakResult = await query(
    `WITH daily AS (
       SELECT DISTINCT DATE(updated_at) AS d
       FROM learner_progress
       WHERE user_id = $1
       ORDER BY d DESC
     ),
     numbered AS (
       SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d DESC))::int * INTERVAL '1 day' AS grp
       FROM daily
     )
     SELECT COUNT(*)::int AS streak
     FROM numbered
     WHERE grp = (SELECT grp FROM numbered LIMIT 1)`,
    [userId],
  );

  return {
    enrolled_courses,
    recent_activity,
    stats: {
      courses_completed: s.courses_completed,
      lessons_completed: s.lessons_completed,
      total_learning_hours: Math.round((s.total_seconds / 3600) * 10) / 10,
      current_streak_days: streakResult.rows[0]?.streak ?? 0,
    },
  };
}

// ── getCourseProgress ──────────────────────────────────────────────────────

export async function getCourseProgress(
  userId: string,
  courseId: string,
): Promise<{
  lessons: { lesson_id: string; status: LessonStatus; progress_percent: number; completed_at: string | null }[];
  overall_percent: number;
}> {
  const result = await query(
    `SELECT
       lp.lesson_id,
       lp.status,
       lp.progress_percent,
       lp.completed_at
     FROM learner_progress lp
     WHERE lp.user_id = $1 AND lp.course_id = $2
     ORDER BY lp.created_at`,
    [userId, courseId],
  );

  const totalLessonsResult = await query(
    `SELECT COUNT(*)::int AS total FROM lessons WHERE course_id = $1 AND is_published = true`,
    [courseId],
  );

  const totalLessons = totalLessonsResult.rows[0]?.total ?? 1;
  const completedLessons = result.rows.filter((r) => r.status === 'completed').length;

  return {
    lessons: result.rows.map((r) => ({
      lesson_id: r.lesson_id,
      status: r.status as LessonStatus,
      progress_percent: r.progress_percent,
      completed_at: r.completed_at?.toISOString() ?? null,
    })),
    overall_percent: Math.round((completedLessons / totalLessons) * 100),
  };
}

// ── syncProgress ───────────────────────────────────────────────────────────

export async function syncProgress(
  userId: string,
  payload: ProgressSyncPayload,
): Promise<ProgressSyncResponse> {
  const conflicts: ProgressConflict[] = [];

  // Get the course_id for this lesson
  const lessonResult = await query(
    `SELECT course_id FROM lessons WHERE id = $1`,
    [payload.lesson_id],
  );

  if (lessonResult.rows.length === 0) {
    throw new Error('Lesson not found');
  }

  const courseId = lessonResult.rows[0].course_id;

  // Check existing progress
  const existingResult = await query(
    `SELECT * FROM learner_progress WHERE user_id = $1 AND lesson_id = $2`,
    [userId, payload.lesson_id],
  );

  let finalStatus: LessonStatus = payload.status;
  let finalPercent: number = payload.progress_percent;
  let finalCompletedAt: string | null = null;

  if (existingResult.rows.length > 0) {
    const existing = existingResult.rows[0];

    // Conflict resolution: status — server wins if completed
    if (existing.status === 'completed' && payload.status !== 'completed') {
      conflicts.push({
        field: 'status',
        client_value: payload.status,
        server_value: existing.status,
        resolution: 'server_wins',
      });
      finalStatus = 'completed';
    }

    // Conflict resolution: progress_percent — client wins if higher
    if (payload.progress_percent > existing.progress_percent) {
      if (existing.progress_percent !== payload.progress_percent) {
        conflicts.push({
          field: 'progress_percent',
          client_value: payload.progress_percent,
          server_value: existing.progress_percent,
          resolution: 'client_wins',
        });
      }
      finalPercent = payload.progress_percent;
    } else {
      finalPercent = existing.progress_percent;
    }

    finalCompletedAt =
      finalStatus === 'completed'
        ? existing.completed_at?.toISOString() ?? new Date().toISOString()
        : null;

    // Update existing record
    await query(
      `UPDATE learner_progress
       SET status = $1,
           progress_percent = $2,
           time_spent_seconds = time_spent_seconds + $3,
           completed_at = $4,
           client_id = $5,
           synced_at = $6,
           updated_at = NOW()
       WHERE user_id = $7 AND lesson_id = $8`,
      [
        finalStatus,
        finalPercent,
        payload.time_spent_seconds,
        finalCompletedAt,
        payload.client_id,
        payload.synced_at,
        userId,
        payload.lesson_id,
      ],
    );
  } else {
    // Insert new record
    finalCompletedAt = finalStatus === 'completed' ? new Date().toISOString() : null;

    await query(
      `INSERT INTO learner_progress
         (user_id, lesson_id, course_id, status, progress_percent, time_spent_seconds,
          completed_at, client_id, synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        payload.lesson_id,
        courseId,
        finalStatus,
        finalPercent,
        payload.time_spent_seconds,
        finalCompletedAt,
        payload.client_id,
        payload.synced_at,
      ],
    );
  }

  // Quiz answers: append-only — insert new, skip duplicates by quiz_block_id
  if (payload.quiz_answers && payload.quiz_answers.length > 0) {
    for (const answer of payload.quiz_answers) {
      // Check if this quiz_block_id answer already exists for this user/lesson
      const existingAnswer = await query(
        `SELECT id FROM assessment_attempts
         WHERE user_id = $1 AND lesson_id = $2 AND quiz_block_id = $3`,
        [userId, payload.lesson_id, answer.quiz_block_id],
      );

      if (existingAnswer.rows.length === 0) {
        await query(
          `INSERT INTO assessment_attempts
             (user_id, lesson_id, quiz_block_id, selected_option, is_correct, answered_at, difficulty_tier)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            userId,
            payload.lesson_id,
            answer.quiz_block_id,
            answer.selected_option,
            answer.is_correct,
            answer.answered_at,
            'beginner', // default tier; could be derived from enrollment
          ],
        );
      }
    }
  }

  return {
    accepted: true,
    server_progress: {
      lesson_id: payload.lesson_id,
      status: finalStatus,
      progress_percent: finalPercent,
      completed_at: finalCompletedAt,
    },
    conflicts: conflicts.length > 0 ? conflicts : undefined,
  };
}

// ── submitAssessment ───────────────────────────────────────────────────────

export async function submitAssessment(
  userId: string,
  lessonId: string,
  answers: QuizAnswer[],
): Promise<{ submitted: number; correct: number; total: number }> {
  let correct = 0;

  for (const answer of answers) {
    // Upsert: skip if already answered
    const existing = await query(
      `SELECT id FROM assessment_attempts
       WHERE user_id = $1 AND lesson_id = $2 AND quiz_block_id = $3`,
      [userId, lessonId, answer.quiz_block_id],
    );

    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO assessment_attempts
           (user_id, lesson_id, quiz_block_id, selected_option, is_correct, answered_at, difficulty_tier)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          lessonId,
          answer.quiz_block_id,
          answer.selected_option,
          answer.is_correct,
          answer.answered_at,
          'beginner',
        ],
      );
    }

    if (answer.is_correct) correct++;
  }

  return { submitted: answers.length, correct, total: answers.length };
}
