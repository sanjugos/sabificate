import { query } from '../db/index.js';
import type { Pagination } from '../../contracts/types/index.js';
import type {
  AdminDashboardOverview,
  AdminLearnerRow,
  AdminCourseRow,
  BulkEnrollmentStatus,
  SeatOverview,
  ITFReportRequest,
  CPDReportRequest,
} from '../../contracts/api/admin.js';

// ── getOverview ────────────────────────────────────────────────────────────

export async function getOverview(orgId: string): Promise<AdminDashboardOverview> {
  const result = await query(
    `WITH org_users AS (
       SELECT id FROM users WHERE org_id = $1 AND is_active = true
     ),
     org_enrollments AS (
       SELECT e.* FROM enrollment e
       JOIN org_users u ON u.id = e.user_id
     ),
     active AS (
       SELECT DISTINCT lp.user_id FROM learner_progress lp
       JOIN org_users u ON u.id = lp.user_id
       WHERE lp.updated_at >= NOW() - INTERVAL '30 days'
     ),
     scores AS (
       SELECT AVG(CASE WHEN aa.is_correct THEN 100.0 ELSE 0.0 END) AS avg_score
       FROM assessment_attempts aa
       JOIN org_users u ON u.id = aa.user_id
     ),
     hours AS (
       SELECT COALESCE(SUM(lp.time_spent_seconds), 0) AS total_seconds
       FROM learner_progress lp
       JOIN org_users u ON u.id = lp.user_id
     )
     SELECT
       (SELECT COUNT(*)::int FROM org_users) AS total_learners,
       (SELECT COUNT(*)::int FROM active) AS active_learners_30d,
       (SELECT COUNT(*)::int FROM org_enrollments WHERE status = 'completed') AS completed_enrollments,
       (SELECT COUNT(*)::int FROM org_enrollments) AS total_enrollments,
       (SELECT COALESCE(avg_score, 0)::numeric(5,1) FROM scores) AS avg_assessment_score,
       (SELECT total_seconds FROM hours) AS total_seconds,
       (SELECT COUNT(DISTINCT course_id)::int FROM org_enrollments) AS courses_assigned`,
    [orgId],
  );

  const r = result.rows[0];
  const totalEnrollments = r.total_enrollments || 1;

  return {
    total_learners: r.total_learners,
    active_learners_30d: r.active_learners_30d,
    completion_rate: Math.round((r.completed_enrollments / totalEnrollments) * 100),
    avg_assessment_score: Number(r.avg_assessment_score) || 0,
    total_learning_hours: Math.round(r.total_seconds / 3600),
    courses_assigned: r.courses_assigned,
  };
}

// ── getLearners ────────────────────────────────────────────────────────────

export async function getLearners(
  orgId: string,
  params: { search?: string; department_id?: string; page?: number; limit?: number },
): Promise<{ learners: AdminLearnerRow[]; pagination: Pagination }> {
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 25, 100);
  const offset = (page - 1) * limit;

  const conditions: string[] = ['u.org_id = $1', 'u.is_active = true'];
  const values: unknown[] = [orgId];
  let paramIndex = 2;

  if (params.search) {
    conditions.push(
      `(u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`,
    );
    values.push(`%${params.search}%`);
    paramIndex++;
  }

  if (params.department_id) {
    conditions.push(`u.department_id = $${paramIndex}`);
    values.push(params.department_id);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Count
  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM users u WHERE ${whereClause}`,
    values,
  );
  const total: number = countResult.rows[0].total;

  // Data
  const dataResult = await query(
    `SELECT
       u.id AS user_id,
       u.email,
       u.first_name,
       u.last_name,
       d.name AS department,
       (SELECT COUNT(*)::int FROM enrollment e WHERE e.user_id = u.id) AS courses_enrolled,
       (SELECT COUNT(*)::int FROM enrollment e WHERE e.user_id = u.id AND e.status = 'completed') AS courses_completed,
       (SELECT COALESCE(AVG(CASE WHEN aa.is_correct THEN 100.0 ELSE 0.0 END), 0)::numeric(5,1)
        FROM assessment_attempts aa WHERE aa.user_id = u.id) AS avg_score,
       (SELECT COALESCE(SUM(lp.time_spent_seconds), 0)::numeric
        FROM learner_progress lp WHERE lp.user_id = u.id) AS total_seconds,
       (SELECT MAX(lp.updated_at) FROM learner_progress lp WHERE lp.user_id = u.id) AS last_active_at
     FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     WHERE ${whereClause}
     ORDER BY u.last_name, u.first_name
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...values, limit, offset],
  );

  const learners: AdminLearnerRow[] = dataResult.rows.map((r) => ({
    user_id: r.user_id,
    email: r.email,
    first_name: r.first_name,
    last_name: r.last_name,
    department: r.department,
    courses_enrolled: r.courses_enrolled,
    courses_completed: r.courses_completed,
    avg_score: Number(r.avg_score),
    total_hours: Math.round(Number(r.total_seconds) / 3600 * 10) / 10,
    last_active_at: r.last_active_at?.toISOString() ?? null,
  }));

  return {
    learners,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

// ── getCourseStats ─────────────────────────────────────────────────────────

export async function getCourseStats(orgId: string): Promise<AdminCourseRow[]> {
  const result = await query(
    `SELECT
       c.id AS course_id,
       c.title,
       COUNT(e.id)::int AS enrolled,
       COUNT(CASE WHEN e.status = 'completed' THEN 1 END)::int AS completed,
       COALESCE(AVG(CASE WHEN aa.is_correct THEN 100.0 ELSE 0.0 END), 0)::numeric(5,1) AS avg_score
     FROM courses c
     JOIN enrollment e ON e.course_id = c.id
     JOIN users u ON u.id = e.user_id AND u.org_id = $1
     LEFT JOIN assessment_attempts aa ON aa.user_id = u.id
       AND aa.lesson_id IN (SELECT l.id FROM lessons l WHERE l.course_id = c.id)
     GROUP BY c.id, c.title
     ORDER BY enrolled DESC`,
    [orgId],
  );

  return result.rows.map((r) => ({
    course_id: r.course_id,
    title: r.title,
    enrolled: r.enrolled,
    completed: r.completed,
    completion_rate: r.enrolled > 0 ? Math.round((r.completed / r.enrolled) * 100) : 0,
    avg_score: Number(r.avg_score),
  }));
}

// ── getBulkJobStatus ───────────────────────────────────────────────────────

export async function getBulkJobStatus(jobId: string): Promise<BulkEnrollmentStatus | null> {
  const jobResult = await query(
    `SELECT * FROM bulk_enrollment_jobs WHERE id = $1`,
    [jobId],
  );

  if (jobResult.rows.length === 0) return null;

  const job = jobResult.rows[0];

  const errorsResult = await query(
    `SELECT row_number, email, error_message FROM bulk_enrollment_errors WHERE job_id = $1 ORDER BY row_number`,
    [jobId],
  );

  return {
    job_id: job.id,
    status: job.status,
    total_rows: job.total_rows,
    processed: job.processed,
    succeeded: job.succeeded,
    failed: job.failed,
    errors: errorsResult.rows.map((e) => ({
      row: e.row_number,
      email: e.email ?? '',
      error: e.error_message,
    })),
  };
}

// ── getSeatOverview ────────────────────────────────────────────────────────

export async function getSeatOverview(orgId: string): Promise<SeatOverview> {
  const seatResult = await query(
    `SELECT sa.total_seats, sa.used_seats, sp.name AS plan_name
     FROM seat_allocations sa
     JOIN subscription_plans sp ON sp.id = sa.plan_id
     WHERE sa.org_id = $1
     LIMIT 1`,
    [orgId],
  );

  if (seatResult.rows.length === 0) {
    return {
      plan_name: 'No Plan',
      total_seats: 0,
      used_seats: 0,
      available_seats: 0,
      departments: [],
    };
  }

  const seat = seatResult.rows[0];

  const deptResult = await query(
    `SELECT
       dsa.department_id,
       d.name,
       dsa.allocated_seats AS allocated,
       dsa.used_seats AS used
     FROM department_seat_allocations dsa
     JOIN seat_allocations sa ON sa.id = dsa.seat_allocation_id
     JOIN departments d ON d.id = dsa.department_id
     WHERE sa.org_id = $1
     ORDER BY d.name`,
    [orgId],
  );

  return {
    plan_name: seat.plan_name,
    total_seats: seat.total_seats,
    used_seats: seat.used_seats,
    available_seats: seat.total_seats - seat.used_seats,
    departments: deptResult.rows.map((r) => ({
      department_id: r.department_id,
      name: r.name,
      allocated: r.allocated,
      used: r.used,
    })),
  };
}

// ── generateITFReport ──────────────────────────────────────────────────────

export async function generateITFReport(
  orgId: string,
  params: ITFReportRequest,
): Promise<string> {
  const conditions: string[] = [
    'u.org_id = $1',
    'e.status = $2',
    'e.completed_at >= $3',
    'e.completed_at <= $4',
  ];
  const values: unknown[] = [orgId, 'completed', params.start_date, params.end_date];
  let paramIndex = 5;

  if (params.department_id) {
    conditions.push(`u.department_id = $${paramIndex}`);
    values.push(params.department_id);
    paramIndex++;
  }

  // Suppress unused variable warning
  void paramIndex;

  const result = await query(
    `SELECT
       u.first_name,
       u.last_name,
       u.email,
       d.name AS department,
       c.title AS course_title,
       c.estimated_duration_minutes,
       e.completed_at
     FROM enrollment e
     JOIN users u ON u.id = e.user_id
     JOIN courses c ON c.id = e.course_id
     LEFT JOIN departments d ON d.id = u.department_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY u.last_name, u.first_name, e.completed_at`,
    values,
  );

  // ITF Form 7A CSV headers
  const headers = [
    'S/N',
    'Employee Name',
    'Email',
    'Department',
    'Training Programme',
    'Duration (Hours)',
    'Date Completed',
  ];

  const rows = result.rows.map((r, i) => [
    i + 1,
    csvEscape(`${r.last_name}, ${r.first_name}`),
    csvEscape(r.email),
    csvEscape(r.department ?? ''),
    csvEscape(r.course_title),
    Math.round((r.estimated_duration_minutes ?? 0) / 60 * 10) / 10,
    r.completed_at ? new Date(r.completed_at).toISOString().slice(0, 10) : '',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// ── generateCPDReport ──────────────────────────────────────────────────────

export async function generateCPDReport(
  orgId: string,
  params: CPDReportRequest,
): Promise<string> {
  const result = await query(
    `SELECT
       u.first_name,
       u.last_name,
       u.email,
       c.title AS course_title,
       c.professional_body,
       c.cpd_hours,
       e.completed_at
     FROM enrollment e
     JOIN users u ON u.id = e.user_id
     JOIN courses c ON c.id = e.course_id
     WHERE u.org_id = $1
       AND e.status = 'completed'
       AND e.completed_at >= $2
       AND e.completed_at <= $3
       AND c.professional_body = $4
     ORDER BY u.last_name, u.first_name`,
    [orgId, params.start_date, params.end_date, params.professional_body],
  );

  const headers = [
    'S/N',
    'Learner Name',
    'Email',
    'Course',
    'Professional Body',
    'CPD Hours',
    'Date Completed',
  ];

  const rows = result.rows.map((r, i) => [
    i + 1,
    csvEscape(`${r.last_name}, ${r.first_name}`),
    csvEscape(r.email),
    csvEscape(r.course_title),
    r.professional_body ?? '',
    r.cpd_hours ?? 0,
    r.completed_at ? new Date(r.completed_at).toISOString().slice(0, 10) : '',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// ── Helpers ────────────────────────────────────────────────────────────────

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
