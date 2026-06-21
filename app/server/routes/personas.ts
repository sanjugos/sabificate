import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { query } from '../db/index.js';
import { TABLES } from '../db/schema.js';

// ── Request schemas ────────────────────────────────────────────────────────

const personaListQuerySchema = z.object({
  vertical: z.string().min(1),
});

const personaSelectionSchema = z.object({
  vertical: z.string().min(1),
  persona_slug: z.string().min(1),
  proficiency_level: z.enum(['foundational', 'working', 'applied']),
  customer_tier: z.enum(['freemium', 'hiring', 'upskilling', 'premium']),
  calibration_answer: z.object({
    question_id: z.string().uuid(),
    selected_option: z.number().int().min(0),
  }).optional(),
});

// ── Plugin ─────────────────────────────────────────────────────────────────

export default async function personaRoutes(fastify: FastifyInstance) {

  // GET /api/v1/personas?vertical=financial-literacy — public, no auth
  fastify.get(
    '/api/v1/personas',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = personaListQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Missing or invalid "vertical" query parameter',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const { vertical } = parsed.data;

      // Fetch personas for the vertical
      const personasResult = await query(
        `SELECT id, vertical, slug, label, description, icon_svg,
                default_proficiency, default_customer_tier, sort_order
         FROM ${TABLES.PERSONAS}
         WHERE vertical = $1 AND is_active = true
         ORDER BY sort_order ASC`,
        [vertical],
      );

      // Fetch calibration questions for all returned personas
      const personaIds = personasResult.rows.map((p: Record<string, unknown>) => p.id);

      let questions: Record<string, unknown>[] = [];
      if (personaIds.length > 0) {
        const placeholders = personaIds.map((_: unknown, i: number) => `$${i + 1}`).join(', ');
        const questionsResult = await query(
          `SELECT id, persona_id, question_text, options, proficiency_map, sort_order
           FROM ${TABLES.CALIBRATION_QUESTIONS}
           WHERE persona_id IN (${placeholders})
           ORDER BY sort_order ASC`,
          personaIds,
        );
        questions = questionsResult.rows as Record<string, unknown>[];
      }

      // Group questions by persona_id
      const questionsByPersona: Record<string, Record<string, unknown>[]> = {};
      for (const q of questions) {
        const pid = q.persona_id as string;
        if (!questionsByPersona[pid]) questionsByPersona[pid] = [];
        questionsByPersona[pid].push(q);
      }

      // Attach questions to each persona
      const personas = (personasResult.rows as Record<string, unknown>[]).map((p) => ({
        ...p,
        calibration_questions: questionsByPersona[p.id as string] ?? [],
      }));

      return { personas };
    },
  );

  // POST /api/v1/learner/persona — requires auth
  fastify.post(
    '/api/v1/learner/persona',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = personaSelectionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid persona selection payload',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const userId = request.user.user_id;
      const { vertical, persona_slug, proficiency_level, customer_tier, calibration_answer } = parsed.data;

      // Upsert user_personas (user_id is UNIQUE)
      const upsertResult = await query(
        `INSERT INTO ${TABLES.USER_PERSONAS} (user_id, vertical, persona_slug, proficiency_level, customer_tier, calibration_answer, resolved_tier, selected_at)
         VALUES ($1, $2, $3, $4, $5, $6, $4, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           vertical = EXCLUDED.vertical,
           persona_slug = EXCLUDED.persona_slug,
           proficiency_level = EXCLUDED.proficiency_level,
           customer_tier = EXCLUDED.customer_tier,
           calibration_answer = EXCLUDED.calibration_answer,
           resolved_tier = EXCLUDED.proficiency_level,
           selected_at = NOW()
         RETURNING id, user_id, vertical, persona_slug, proficiency_level, customer_tier, calibration_answer, resolved_tier, selected_at`,
        [
          userId,
          vertical,
          persona_slug,
          proficiency_level,
          customer_tier,
          calibration_answer ? JSON.stringify(calibration_answer) : null,
        ],
      );

      // Also update the users table
      await query(
        `UPDATE ${TABLES.USERS} SET proficiency_level = $1, customer_tier = $2, persona_slug = $3, updated_at = NOW()
         WHERE id = $4`,
        [proficiency_level, customer_tier, persona_slug, userId],
      );

      return reply.status(201).send({
        status: 'success',
        data: upsertResult.rows[0],
      });
    },
  );

  // GET /api/v1/learner/persona — requires auth
  fastify.get(
    '/api/v1/learner/persona',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest) => {
      const userId = request.user.user_id;

      const result = await query(
        `SELECT id, user_id, vertical, persona_slug, proficiency_level, customer_tier, calibration_answer, resolved_tier, selected_at
         FROM ${TABLES.USER_PERSONAS}
         WHERE user_id = $1`,
        [userId],
      );

      if (result.rows.length === 0) {
        return { persona: null };
      }

      return { persona: result.rows[0] };
    },
  );
}
