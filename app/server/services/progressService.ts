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
  // Enrolled courses
  const enrolledResult = await query(
    `SELECT
       enrollment.course_id,
       courses.title AS course_title,
       courses.slug  AS course_slug,
       courses.difficulty_level AS difficulty_tier
     FROM enrollment
     JOIN courses ON courses.id = enrollment.course_id
     WHERE enrollment.user_id = $1 AND enrollment.status = 'active'`,
    [userId],
  );

  const enrolled_courses: EnrolledCourseSummary[] = [];
  for (const r of enrolledResult.rows) {
    const lt = await query(
      'SELECT COUNT(*)::int AS cnt FROM lessons WHERE course_id = $1 AND is_published = true',
      [r.course_id],
    );
    const lc = await query(
      "SELECT COUNT(*)::int AS cnt FROM learner_progress WHERE user_id = $1 AND course_id = $2 AND status = 'completed'",
      [userId, r.course_id],
    );
    const la = await query(
      'SELECT MAX(updated_at) AS last_at FROM learner_progress WHERE user_id = $1 AND course_id = $2',
      [userId, r.course_id],
    );
    const lessonsTotal = lt.rows[0].cnt || 1;
    const lessonsCompleted = lc.rows[0].cnt || 0;
    enrolled_courses.push({
      course_id: r.course_id,
      course_title: r.course_title,
      course_slug: r.course_slug,
      progress_percent: Math.round((lessonsCompleted / lessonsTotal) * 100),
      lessons_completed: lessonsCompleted,
      lessons_total: lt.rows[0].cnt,
      last_accessed_at: la.rows[0].last_at?.toISOString?.() ?? la.rows[0].last_at ?? null,
      difficulty_tier: r.difficulty_tier,
    });
  }
  enrolled_courses.sort((a, b) => {
    if (!a.last_accessed_at) return 1;
    if (!b.last_accessed_at) return -1;
    return b.last_accessed_at.localeCompare(a.last_accessed_at);
  });

  // Recent activity — separate queries to avoid UNION/jsonb_build_object
  const lessonActivity = await query(
    `SELECT learner_progress.course_id, learner_progress.lesson_id, lessons.title, learner_progress.completed_at
     FROM learner_progress
     JOIN lessons ON lessons.id = learner_progress.lesson_id
     WHERE learner_progress.user_id = $1 AND learner_progress.status = 'completed' AND learner_progress.completed_at IS NOT NULL
     ORDER BY learner_progress.completed_at DESC
     LIMIT 20`,
    [userId],
  );

  const recent_activity: ActivityItem[] = lessonActivity.rows.map((r) => ({
    type: 'lesson_completed' as const,
    title: r.title,
    timestamp: r.completed_at?.toISOString?.() ?? r.completed_at ?? new Date().toISOString(),
    metadata: { course_id: r.course_id, lesson_id: r.lesson_id },
  }));

  // Stats — separate simple queries
  const cc = await query(
    "SELECT COUNT(*)::int AS cnt FROM enrollment WHERE user_id = $1 AND status = 'completed'",
    [userId],
  );
  const lcc = await query(
    "SELECT COUNT(*)::int AS cnt FROM learner_progress WHERE user_id = $1 AND status = 'completed'",
    [userId],
  );
  const ts = await query(
    'SELECT COALESCE(SUM(time_spent_seconds), 0)::int AS total FROM learner_progress WHERE user_id = $1',
    [userId],
  );

  return {
    enrolled_courses,
    recent_activity,
    stats: {
      courses_completed: cc.rows[0].cnt,
      lessons_completed: lcc.rows[0].cnt,
      total_learning_hours: Math.round((ts.rows[0].total / 3600) * 10) / 10,
      current_streak_days: 0, // streak calculation requires CTEs not supported by pg-mem
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
