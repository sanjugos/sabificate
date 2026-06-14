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

  const conditions: string[] = ['c.is_published = true'];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (params.query) {
    conditions.push(`(c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`);
    values.push(`%${params.query}%`);
    paramIndex++;
  }

  if (params.category) {
    conditions.push(`cc.slug = $${paramIndex}`);
    values.push(params.category);
    paramIndex++;
  }

  if (params.difficulty) {
    conditions.push(`c.difficulty_level = $${paramIndex}`);
    values.push(params.difficulty);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count query
  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM courses c
     LEFT JOIN course_categories cc ON cc.id = c.category_id
     ${whereClause}`,
    values,
  );
  const total: number = countResult.rows[0].total;

  // Data query
  const dataResult = await query(
    `SELECT
       c.id,
       c.title,
       c.slug,
       c.description,
       c.thumbnail_url,
       c.difficulty_level,
       c.estimated_duration_minutes,
       c.cpd_hours,
       c.professional_body,
       cc.id   AS cat_id,
       cc.name AS cat_name,
       cc.slug AS cat_slug,
       (SELECT COUNT(*)::int FROM modules m WHERE m.course_id = c.id) AS module_count,
       (SELECT COUNT(*)::int FROM lessons l WHERE l.course_id = c.id AND l.is_published = true) AS lesson_count
     FROM courses c
     LEFT JOIN course_categories cc ON cc.id = c.category_id
     ${whereClause}
     ORDER BY c.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...values, limit, offset],
  );

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
       c.*,
       cc.id   AS cat_id,
       cc.name AS cat_name,
       cc.slug AS cat_slug,
       (SELECT COUNT(*)::int FROM modules m WHERE m.course_id = c.id) AS module_count,
       (SELECT COUNT(*)::int FROM lessons l WHERE l.course_id = c.id AND l.is_published = true) AS lesson_count
     FROM courses c
     LEFT JOIN course_categories cc ON cc.id = c.category_id
     WHERE c.slug = $1 AND c.is_published = true`,
    [slug],
  );

  if (courseResult.rows.length === 0) return null;

  const c = courseResult.rows[0];

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
    `SELECT l.id, l.course_id, l.content_beginner, l.content_intermediate, l.content_advanced
     FROM lessons l
     WHERE l.id = $1 AND l.is_published = true`,
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
    `SELECT
       cc.id,
       cc.name,
       cc.slug,
       COUNT(c.id)::int AS course_count
     FROM course_categories cc
     LEFT JOIN courses c ON c.category_id = cc.id AND c.is_published = true
     GROUP BY cc.id, cc.name, cc.slug
     ORDER BY cc.sort_order, cc.name`,
  );

  return {
    categories: result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      course_count: r.course_count,
    })),
  };
}
