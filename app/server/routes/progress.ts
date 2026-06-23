import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import * as progressService from '../services/progressService.js';

// ── Request schemas ────────────────────────────────────────────────────────

const progressSyncSchema = z.object({
  lesson_id: z.string().uuid(),
  status: z.enum(['in_progress', 'completed']),
  progress_percent: z.number().int().min(0).max(100),
  time_spent_seconds: z.number().int().min(0),
  quiz_answers: z
    .array(
      z.object({
        quiz_block_id: z.string(),
        selected_option: z.number().int(),
        is_correct: z.boolean(),
        answered_at: z.string(),
      }),
    )
    .optional(),
  synced_at: z.string(),
  client_id: z.string(),
});

const assessmentSubmitSchema = z.object({
  answers: z.array(
    z.object({
      quiz_block_id: z.string(),
      selected_option: z.number().int(),
      is_correct: z.boolean(),
      answered_at: z.string(),
    }),
  ),
});

// ── Plugin ─────────────────────────────────────────────────────────────────

export default async function progressRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/v1/learner/dashboard
  fastify.get(
    '/api/v1/learner/dashboard',
    async (request: FastifyRequest) => {
      return progressService.getLearnerDashboard(request.user.user_id);
    },
  );

  // GET /api/v1/learner/courses/:courseId/progress
  fastify.get(
    '/api/v1/learner/courses/:courseId/progress',
    async (request: FastifyRequest<{ Params: { courseId: string } }>) => {
      return progressService.getCourseProgress(
        request.user.user_id,
        request.params.courseId,
      );
    },
  );

  // POST /api/v1/learner/lessons/:lessonId/progress
  fastify.post(
    '/api/v1/learner/lessons/:lessonId/progress',
    async (
      request: FastifyRequest<{ Params: { lessonId: string } }>,
      reply: FastifyReply,
    ) => {
      const parsed = progressSyncSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid progress payload',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      // Ensure the lessonId in params matches the body
      if (parsed.data.lesson_id !== request.params.lessonId) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'lesson_id in body must match URL parameter',
        });
      }

      try {
        const result = await progressService.syncProgress(
          request.user.user_id,
          parsed.data,
        );
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sync failed';
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message,
        });
      }
    },
  );

  // POST /api/v1/learner/lessons/:lessonId/artifacts
  fastify.post(
    '/api/v1/learner/lessons/:lessonId/artifacts',
    async (
      request: FastifyRequest<{ Params: { lessonId: string } }>,
      reply: FastifyReply,
    ) => {
      const schema = z.object({
        block_id: z.string(),
        response_text: z.string().min(1).max(10000),
      });
      const parsed = schema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid artifact submission',
        });
      }

      return progressService.submitArtifact(
        request.user.user_id,
        request.params.lessonId,
        parsed.data.block_id,
        parsed.data.response_text,
      );
    },
  );

  // POST /api/v1/learner/lessons/:lessonId/scenarios
  fastify.post(
    '/api/v1/learner/lessons/:lessonId/scenarios',
    async (
      request: FastifyRequest<{ Params: { lessonId: string } }>,
      reply: FastifyReply,
    ) => {
      const schema = z.object({
        block_id: z.string(),
        decisions: z.array(
          z.object({
            nodeId: z.string(),
            choiceLabel: z.string(),
            feedback: z.string(),
          }),
        ),
      });
      const parsed = schema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid scenario submission',
        });
      }

      return progressService.submitScenarioDecisions(
        request.user.user_id,
        request.params.lessonId,
        parsed.data.block_id,
        parsed.data.decisions,
      );
    },
  );

  // POST /api/v1/learner/assessments/:assessmentId/submit
  fastify.post(
    '/api/v1/learner/assessments/:assessmentId/submit',
    async (
      request: FastifyRequest<{ Params: { assessmentId: string } }>,
      reply: FastifyReply,
    ) => {
      const parsed = assessmentSubmitSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid assessment submission',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const result = await progressService.submitAssessment(
        request.user.user_id,
        request.params.assessmentId,
        parsed.data.answers,
      );

      return result;
    },
  );
}
