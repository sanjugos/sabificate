import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import * as courseService from '../services/courseService.js';
import { verifyAccessToken } from '../auth/jwt.js';
import { query } from '../db/index.js';
import { TABLES } from '../db/schema.js';
import { checkSubscriptionAccess } from '../middleware/paywall.js';
import type { DifficultyTier } from '../../contracts/types/index.js';

// ── Query schemas ──────────────────────────────────────────────────────────

const courseListSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const lessonContentQuerySchema = z.object({
  tier: z.enum(['foundational', 'working', 'applied']).optional(),
});

// ── Plugin ─────────────────────────────────────────────────────────────────

export default async function coursesRoutes(fastify: FastifyInstance) {
  // GET /api/v1/courses — list with pagination and filters
  fastify.get(
    '/api/v1/courses',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = courseListSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid query parameters',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const result = await courseService.listCourses(parsed.data);
      return result;
    },
  );

  // GET /api/v1/courses/:slug — full course detail
  fastify.get(
    '/api/v1/courses/:slug',
    async (
      request: FastifyRequest<{ Params: { slug: string } }>,
      reply: FastifyReply,
    ) => {
      // Optional auth: try to extract user for enrollment status
      let userId: string | undefined;
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const payload = verifyAccessToken(authHeader.slice(7));
          userId = payload.user_id;
        } catch {
          // not authenticated, that's fine
        }
      }

      const course = await courseService.getCourseBySlug(request.params.slug, userId);
      if (!course) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Course not found',
        });
      }

      return course;
    },
  );

  // GET /api/v1/courses/:slug/content/:lessonId — lesson content
  fastify.get<{
    Params: { slug: string; lessonId: string };
    Querystring: { tier?: string };
  }>(
    '/api/v1/courses/:slug/content/:lessonId',
    async (request, reply) => {
      const parsed = lessonContentQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid query parameters',
        });
      }

      // Optional auth — free lessons work without login
      let userId: string | null = null;
      let orgId: string | null = null;
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const payload = verifyAccessToken(authHeader.slice(7));
          userId = payload.user_id;
          orgId = payload.org_id;
        } catch {
          // Invalid token — continue as unauthenticated
        }
      }

      // Paywall check
      const access = await checkSubscriptionAccess(
        request.params.lessonId,
        userId,
        orgId,
      );

      if (!access.allowed) {
        return reply.status(402).send({
          statusCode: 402,
          error: access.error,
          message: access.message,
          redirect: access.redirect,
        });
      }

      // Determine tier: explicit query param or auto-detect from user persona
      const explicitTier = (request.query as { tier?: string }).tier;
      const tier = explicitTier
        ? (parsed.data.tier as DifficultyTier)
        : undefined;

      const result = await courseService.getLessonContent(
        request.params.lessonId,
        tier,
        userId,
      );

      if (!result) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Lesson not found',
        });
      }

      if (!result.enrolled) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'You must be enrolled in this course to access lesson content',
        });
      }

      // Attach degraded access metadata if in grace period
      if (access.degraded) {
        return {
          ...result.content,
          degraded_access: true,
          days_remaining: access.daysRemaining,
        };
      }

      return result.content;
    },
  );

  // GET /api/v1/categories — category list with course counts
  fastify.get('/api/v1/categories', async () => {
    return courseService.listCategories();
  });

  // POST /api/v1/courses/:slug/enroll — enroll in a course
  fastify.post<{ Params: { slug: string } }>(
    '/api/v1/courses/:slug/enroll',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { slug } = request.params;
      const userId = request.user.user_id;

      // Look up course by slug
      const courseResult = await query(
        `SELECT id FROM ${TABLES.COURSES} WHERE slug = $1`,
        [slug],
      );

      if (courseResult.rows.length === 0) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Course not found',
        });
      }

      const courseId = (courseResult.rows[0] as { id: string }).id;

      // Check if already enrolled
      const existing = await query(
        `SELECT id FROM ${TABLES.ENROLLMENT} WHERE user_id = $1 AND course_id = $2`,
        [userId, courseId],
      );

      if (existing.rows.length > 0) {
        return reply.status(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: 'Already enrolled in this course',
        });
      }

      // Insert enrollment
      const result = await query(
        `INSERT INTO ${TABLES.ENROLLMENT} (user_id, course_id, enrollment_type, status)
         VALUES ($1, $2, 'individual', 'active')
         RETURNING id, user_id, course_id, org_id, enrollment_type, status, enrolled_at, completed_at`,
        [userId, courseId],
      );

      return reply.status(201).send({
        status: 'success',
        data: result.rows[0],
      });
    },
  );
}
