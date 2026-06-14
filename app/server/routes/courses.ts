import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import * as courseService from '../services/courseService.js';
import { verifyAccessToken } from '../auth/jwt.js';
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
  tier: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
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

  // GET /api/v1/courses/:slug/content/:lessonId — lesson content (requires auth)
  fastify.get(
    '/api/v1/courses/:slug/content/:lessonId',
    { preHandler: [fastify.authenticate] },
    async (
      request: FastifyRequest<{
        Params: { slug: string; lessonId: string };
        Querystring: { tier?: string };
      }>,
      reply: FastifyReply,
    ) => {
      const parsed = lessonContentQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid query parameters',
        });
      }

      const tier = parsed.data.tier as DifficultyTier;
      const result = await courseService.getLessonContent(
        request.params.lessonId,
        tier,
        request.user.user_id,
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

      return result.content;
    },
  );

  // GET /api/v1/categories — category list with course counts
  fastify.get('/api/v1/categories', async () => {
    return courseService.listCategories();
  });
}
