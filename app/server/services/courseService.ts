import { query } from '../db/index.js';
import type { DifficultyTier } from '../../contracts/types/index.js';
import type {
  CourseListRequest,
  CourseListResponse,
  CourseSummary,
  CourseDetail,
  CategoryListResponse,
} from '../../contracts/api/courses.js';

// ── listCourses ────────────────────────────────────────────────────────────

export async function listCourses(params: CourseListRequest): Promise<CourseListResponse> {
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 20, 100);
  const offset = (page - 1) * limit;

  const conditions: string[] = ['courses.is_published = true'];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (params.query) {
    conditions.push(`(courses.title ILIKE $${paramIndex} OR courses.description ILIKE $${paramIndex})`);
    values.push(`%${params.query}%`);
    paramIndex++;
  }

  if (params.category) {
    conditions.push(`course_categories.slug = $${paramIndex}`);
    values.push(params.category);
    paramIndex++;
  }

  if (params.difficulty) {
    conditions.push(`courses.difficulty_level = $${paramIndex}`);
    values.push(params.difficulty);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count query
  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM courses
     LEFT JOIN course_categories ON course_categories.id = courses.category_id
     ${whereClause}`,
    values,
  );
  const total: number = countResult.rows[0].total;

  // Data query — avoid correlated subqueries for pg-mem compatibility
  const dataResult = await query(
    `SELECT
       courses.id,
       courses.title,
       courses.slug,
       courses.description,
       courses.thumbnail_url,
       courses.difficulty_level,
       courses.estimated_duration_minutes,
       courses.cpd_hours,
       courses.professional_body,
       course_categories.id   AS cat_id,
       course_categories.name AS cat_name,
       course_categories.slug AS cat_slug
     FROM courses
     LEFT JOIN course_categories ON course_categories.id = courses.category_id
     ${whereClause.replace(/\bc\./g, 'courses.').replace(/\bcc\./g, 'course_categories.')}
     ORDER BY courses.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...values, limit, offset],
  );

  // Fetch counts separately per course
  for (const r of dataResult.rows) {
    const mc = await query('SELECT COUNT(*)::int AS cnt FROM modules WHERE course_id = $1', [r.id]);
    r.module_count = mc.rows[0].cnt;
    const lc = await query('SELECT COUNT(*)::int AS cnt FROM lessons WHERE course_id = $1 AND is_published = true', [r.id]);
    r.lesson_count = lc.rows[0].cnt;
  }

  const courses: CourseSummary[] = dataResult.rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    description: r.description ?? '',
    thumbnail_url: r.thumbnail_url,
    category: { id: r.cat_id, name: r.cat_name, slug: r.cat_slug },
    difficulty_level: r.difficulty_level as DifficultyTier,
    estimated_duration_minutes: r.estimated_duration_minutes ?? 0,
    cpd_hours: r.cpd_hours ? Number(r.cpd_hours) : null,
    professional_body: r.professional_body ?? null,
    lesson_count: r.lesson_count,
    module_count: r.module_count,
  }));

  return {
    courses,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

// ── getCourseBySlug ────────────────────────────────────────────────────────

export async function getCourseBySlug(
  slug: string,
  userId?: string,
): Promise<CourseDetail | null> {
  const courseResult = await query(
    `SELECT
       courses.*,
       course_categories.id   AS cat_id,
       course_categories.name AS cat_name,
       course_categories.slug AS cat_slug
     FROM courses
     LEFT JOIN course_categories ON course_categories.id = courses.category_id
     WHERE courses.slug = $1 AND courses.is_published = true`,
    [slug],
  );

  if (courseResult.rows.length === 0) return null;

  const c = courseResult.rows[0];

  // Separate count queries
  const mc = await query('SELECT COUNT(*)::int AS cnt FROM modules WHERE course_id = $1', [c.id]);
  c.module_count = mc.rows[0].cnt;
  const lc = await query('SELECT COUNT(*)::int AS cnt FROM lessons WHERE course_id = $1 AND is_published = true', [c.id]);
  c.lesson_count = lc.rows[0].cnt;

  // Fetch modules with lessons
  const modulesResult = await query(
    `SELECT id, title, sort_order
     FROM modules
     WHERE course_id = $1
     ORDER BY sort_order`,
    [c.id],
  );

  const modules = await Promise.all(
    modulesResult.rows.map(async (mod) => {
      const lessonsResult = await query(
        `SELECT id, title, sort_order, estimated_duration_minutes, has_quiz, has_artifact
         FROM lessons
         WHERE module_id = $1 AND is_published = true
         ORDER BY sort_order`,
        [mod.id],
      );

      return {
        id: mod.id,
        title: mod.title,
        sort_order: mod.sort_order,
        lessons: lessonsResult.rows.map((l) => ({
          id: l.id,
          title: l.title,
          sort_order: l.sort_order,
          estimated_duration_minutes: l.estimated_duration_minutes ?? 0,
          has_quiz: l.has_quiz ?? false,
          has_artifact: l.has_artifact ?? false,
        })),
      };
    }),
  );

  // Check enrollment status
  let enrollment_status: 'enrolled' | 'not_enrolled' | null = null;
  if (userId) {
    const enrollResult = await query(
      `SELECT status FROM enrollment WHERE user_id = $1 AND course_id = $2`,
      [userId, c.id],
    );
    enrollment_status =
      enrollResult.rows.length > 0 && enrollResult.rows[0].status === 'active'
        ? 'enrolled'
        : 'not_enrolled';
  }

  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description ?? '',
    thumbnail_url: c.thumbnail_url,
    category: { id: c.cat_id, name: c.cat_name, slug: c.cat_slug },
    difficulty_level: c.difficulty_level as DifficultyTier,
    estimated_duration_minutes: c.estimated_duration_minutes ?? 0,
    cpd_hours: c.cpd_hours ? Number(c.cpd_hours) : null,
    professional_body: c.professional_body ?? null,
    lesson_count: c.lesson_count,
    module_count: c.module_count,
    learning_objectives: (c.learning_objectives as string[]) ?? [],
    prerequisites: (c.prerequisites as string[]) ?? [],
    modules,
    enrollment_status,
  };
}

// ── getLessonContent ───────────────────────────────────────────────────────

export async function getLessonContent(
  lessonId: string,
  tier: DifficultyTier,
  userId: string,
): Promise<{ content: object; enrolled: boolean } | null> {
  // Get lesson and verify it exists
  const lessonResult = await query(
    `SELECT id, course_id, content_beginner, content_intermediate, content_advanced
     FROM lessons
     WHERE id = $1 AND is_published = true`,
    [lessonId],
  );

  if (lessonResult.rows.length === 0) return null;

  const lesson = lessonResult.rows[0];

  // Check enrollment
  const enrollResult = await query(
    `SELECT id FROM enrollment
     WHERE user_id = $1 AND course_id = $2 AND status = 'active'`,
    [userId, lesson.course_id],
  );

  if (enrollResult.rows.length === 0) {
    return { content: {}, enrolled: false };
  }

  const contentColumn = `content_${tier}` as keyof typeof lesson;
  const content = lesson[contentColumn] ?? lesson.content_beginner ?? {};

  return { content, enrolled: true };
}

// ── listCategories ─────────────────────────────────────────────────────────

export async function listCategories(): Promise<CategoryListResponse> {
  const result = await query(
    `SELECT id, name, slug FROM course_categories ORDER BY sort_order, name`,
  );

  for (const r of result.rows) {
    const cc = await query(
      'SELECT COUNT(*)::int AS cnt FROM courses WHERE category_id = $1 AND is_published = true',
      [r.id],
    );
    r.course_count = cc.rows[0].cnt;
  }

  return {
    categories: result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      course_count: r.course_count,
    })),
  };
}
