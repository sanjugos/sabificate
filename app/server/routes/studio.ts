import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { query } from '../db/index.js';
import { TABLES } from '../db/schema.js';
import * as curriculumAI from '../services/curriculumAI.js';

// ── Zod Schemas ───────────────────────────────────────────────────────────

const trackListQuerySchema = z.object({
  status: z.enum(['draft', 'intake', 'decomposition', 'briefing', 'generation', 'review', 'published']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createTrackSchema = z.object({
  name: z.string().min(1).max(255),
  vertical: z.enum(['financial-literacy', 'banking-compliance', 'insurance', 'fintech', 'professional-development']),
  customer_tier: z.enum(['freemium', 'hiring', 'upskilling', 'premium']),
  tier_treatment: z.enum(['A', 'B', 'C']).default('A'),
  credential_type: z.enum(['completion_badge', 'verified_certificate', 'team_record', 'professional_certificate']).default('completion_badge'),
  paywall_lesson_index: z.number().int().min(0).default(2),
});

const updateTrackSetupSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  vertical: z.enum(['financial-literacy', 'banking-compliance', 'insurance', 'fintech', 'professional-development']).optional(),
  customer_tier: z.enum(['freemium', 'hiring', 'upskilling', 'premium']).optional(),
  tier_treatment: z.enum(['A', 'B', 'C']).optional(),
  credential_type: z.enum(['completion_badge', 'verified_certificate', 'team_record', 'professional_certificate']).optional(),
  paywall_lesson_index: z.number().int().min(0).optional(),
});

const intakeSchema = z.object({
  skill_statement: z.string().min(1),
  target_learner_role: z.string().min(1).max(255),
  context_mode: z.enum(['nigerian', 'generic']).default('nigerian'),
});

const spineNodeSchema = z.object({
  index: z.number().int().min(0),
  concept_id: z.string().nullable(),
  title: z.string().min(1),
  objective: z.string().min(1),
  bloom_level: z.string(),
  artifact_intent: z.string(),
  catalog_overlap: z.enum(['linked', 'fork', 'new']),
  linked_concept_catalog_id: z.string().uuid().nullable(),
  depth_cards: z.any().nullable(),
  trust_claim_count: z.number().int().default(0),
  sme_approved: z.boolean().default(false),
});

const updateSpineSchema = z.object({
  spine: z.array(spineNodeSchema),
});

const linkSpineNodeSchema = z.object({
  concept_catalog_id: z.string().uuid(),
});

const conceptCatalogQuerySchema = z.object({
  q: z.string().optional(),
  domain: z.string().optional(),
});

const createConceptSchema = z.object({
  concept_id: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  domain: z.string().min(1).max(100),
  prerequisites: z.array(z.string()).default([]),
  spine_position: z.number().int().optional(),
});

const briefSchema = z.object({
  things_to_avoid: z.string().nullable().optional(),
  gateway_personas: z.array(z.object({
    slug: z.string(),
    label: z.string(),
    description: z.string(),
    default_proficiency: z.enum(['foundational', 'working', 'applied']),
    calibration_questions: z.array(z.object({
      question_text: z.string(),
      options: z.array(z.string()),
      proficiency_map: z.record(z.string()),
    })).default([]),
  })),
});

const updateBriefSchema = z.object({
  things_to_avoid: z.string().nullable().optional(),
  gateway_personas: z.array(z.object({
    slug: z.string(),
    label: z.string(),
    description: z.string(),
    default_proficiency: z.enum(['foundational', 'working', 'applied']),
    calibration_questions: z.array(z.object({
      question_text: z.string(),
      options: z.array(z.string()),
      proficiency_map: z.record(z.string()),
    })).default([]),
  })).optional(),
});

const trustClaimUpdateSchema = z.object({
  source_url: z.string().nullable().optional(),
  source_label: z.string().max(255).nullable().optional(),
  verified: z.boolean().optional(),
});

const depthCardUpdateSchema = z.object({
  blocks: z.array(z.object({
    type: z.enum(['text_block', 'quiz_block', 'scenario_block', 'artifact_block']),
    id: z.string(),
    content: z.string().optional(),
    question: z.string().optional(),
    options: z.array(z.string()).optional(),
    correct_answer: z.number().int().optional(),
    explanation: z.string().optional(),
    bloom_level: z.string().optional(),
    difficulty_tier: z.string().optional(),
  })),
});

const reviewActionSchema = z.object({
  spine_node_index: z.number().int().min(0),
  depth_tier: z.enum(['foundational', 'working', 'applied']),
  action: z.enum(['approve', 'edit', 'reject']),
  category: z.enum(['terminology_drift', 'difficulty_inversion', 'artifact_redundancy', 'coverage_gap', 'general']).optional(),
  reason: z.string().optional(),
  edited_content: z.any().optional(),
});

const completeReviewSchema = z.object({
  terminology_drift_ok: z.boolean(),
  difficulty_inversion_ok: z.boolean(),
  artifact_redundancy_ok: z.boolean(),
  coverage_gap_ok: z.boolean(),
  reviewer_notes: z.string().optional(),
});

const previewQuerySchema = z.object({
  node: z.coerce.number().int().min(0).default(0),
  tier: z.enum(['foundational', 'working', 'applied']).default('foundational'),
});

const promptTemplateQuerySchema = z.object({
  stage: z.string().optional(),
  tier: z.string().optional(),
});

// ── Helpers ───────────────────────────────────────────────────────────────

function hasStudioRole(role: string): boolean {
  return ['curriculum_author', 'platform_admin', 'sme_reviewer', 'corporate_admin', 'founder', 'admin'].includes(role);
}

function canAuthor(role: string): boolean {
  return ['curriculum_author', 'platform_admin', 'corporate_admin', 'founder', 'admin'].includes(role);
}

function canReview(role: string): boolean {
  return ['sme_reviewer', 'curriculum_author', 'platform_admin', 'corporate_admin', 'founder', 'admin'].includes(role);
}

function isAdmin(role: string): boolean {
  return ['platform_admin', 'founder', 'admin'].includes(role);
}

function forbidden(reply: FastifyReply, msg = 'Insufficient permissions') {
  return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: msg });
}

function notFound(reply: FastifyReply, msg = 'Not found') {
  return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: msg });
}

function badRequest(reply: FastifyReply, msg: string, details?: unknown) {
  return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: msg, details });
}

// ── Plugin ────────────────────────────────────────────────────────────────

export default async function studioRoutes(fastify: FastifyInstance) {

  // All studio routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // ── GET /api/v1/studio/tracks — List tracks ──────────────────────────

  fastify.get(
    '/api/v1/studio/tracks',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!canAuthor(request.user.role)) return forbidden(reply);

      const parsed = trackListQuerySchema.safeParse(request.query);
      if (!parsed.success) return badRequest(reply, 'Invalid query parameters', parsed.error.flatten().fieldErrors);

      const { status, page, limit } = parsed.data;
      const offset = (page - 1) * limit;
      const params: unknown[] = [];
      const conditions: string[] = [];

      // Scope to user unless admin
      if (!isAdmin(request.user.role)) {
        params.push(request.user.user_id);
        conditions.push(`created_by = $${params.length}`);
      }

      if (status) {
        params.push(status);
        conditions.push(`status = $${params.length}`);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countResult = await query(
        `SELECT COUNT(*) as total FROM ${TABLES.AUTHORING_TRACKS} ${where}`,
        params,
      );
      const total = parseInt((countResult.rows[0] as { total: string }).total, 10);

      params.push(limit, offset);
      const result = await query(
        `SELECT id, name, vertical, status, customer_tier, updated_at
         FROM ${TABLES.AUTHORING_TRACKS} ${where}
         ORDER BY updated_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params,
      );

      return {
        data: result.rows,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    },
  );

  // ── GET /api/v1/studio/tracks/:trackId — Track detail ────────────────

  fastify.get<{ Params: { trackId: string } }>(
    '/api/v1/studio/tracks/:trackId',
    async (request, reply) => {
      if (!canAuthor(request.user.role)) return forbidden(reply);

      const { trackId } = request.params;
      const trackResult = await query(
        `SELECT * FROM ${TABLES.AUTHORING_TRACKS} WHERE id = $1`,
        [trackId],
      );

      if (trackResult.rows.length === 0) return notFound(reply, 'Track not found');

      const track = trackResult.rows[0] as Record<string, unknown>;

      // Get trust claims count
      const claimsResult = await query(
        `SELECT COUNT(*) as count FROM ${TABLES.TRUST_CLAIMS} WHERE track_id = $1`,
        [trackId],
      );
      const trustClaimCount = parseInt((claimsResult.rows[0] as { count: string }).count, 10);

      // Get latest assembly review
      const reviewResult = await query(
        `SELECT id, status, reviewer_id, started_at, completed_at
         FROM ${TABLES.ASSEMBLY_REVIEWS} WHERE track_id = $1
         ORDER BY started_at DESC LIMIT 1`,
        [trackId],
      );

      return {
        ...track,
        trust_claim_count: trustClaimCount,
        latest_review: reviewResult.rows[0] || null,
      };
    },
  );

  // ── DELETE /api/v1/studio/tracks/:trackId — Delete track ─────────────

  fastify.delete<{ Params: { trackId: string } }>(
    '/api/v1/studio/tracks/:trackId',
    async (request, reply) => {
      if (!canAuthor(request.user.role)) return forbidden(reply, 'Insufficient permissions');

      const { trackId } = request.params;
      const trackResult = await query(
        `SELECT status FROM ${TABLES.AUTHORING_TRACKS} WHERE id = $1`,
        [trackId],
      );

      if (trackResult.rows.length === 0) return notFound(reply, 'Track not found');

      const trackStatus = (trackResult.rows[0] as { status: string }).status;
      if (!['draft', 'intake'].includes(trackStatus)) {
        return badRequest(reply, 'Can only delete tracks in draft or intake status');
      }

      // Cascade deletes
      await query(`DELETE FROM ${TABLES.GENERATION_JOBS} WHERE track_id = $1`, [trackId]);
      await query(`DELETE FROM ${TABLES.LANGUAGE_READINESS} WHERE track_id = $1`, [trackId]);
      await query(`DELETE FROM ${TABLES.TRUST_CLAIMS} WHERE track_id = $1`, [trackId]);
      await query(`DELETE FROM ${TABLES.ASSEMBLY_REVIEWS} WHERE track_id = $1`, [trackId]);
      await query(`DELETE FROM ${TABLES.AUTHORING_TRACKS} WHERE id = $1`, [trackId]);

      return { status: 'deleted', id: trackId };
    },
  );

  // ── POST /api/v1/studio/tracks — Stage 1: Create track ──────────────

  fastify.post(
    '/api/v1/studio/tracks',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!canAuthor(request.user.role)) return forbidden(reply, 'Requires curriculum_author role');

      const parsed = createTrackSchema.safeParse(request.body);
      if (!parsed.success) return badRequest(reply, 'Invalid track data', parsed.error.flatten().fieldErrors);

      const { name, vertical, customer_tier, tier_treatment, credential_type, paywall_lesson_index } = parsed.data;

      const result = await query(
        `INSERT INTO ${TABLES.AUTHORING_TRACKS}
         (name, vertical, customer_tier, tier_treatment, credential_type, paywall_lesson_index, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7)
         RETURNING *`,
        [name, vertical, customer_tier, tier_treatment, credential_type, paywall_lesson_index, request.user.user_id],
      );

      return reply.status(201).send({ status: 'success', data: result.rows[0] });
    },
  );

  // ── PUT /api/v1/studio/tracks/:trackId/setup — Stage 1: Update setup ─

  fastify.put<{ Params: { trackId: string } }>(
    '/api/v1/studio/tracks/:trackId/setup',
    async (request, reply) => {
      if (!canAuthor(request.user.role)) return forbidden(reply);

      const parsed = updateTrackSetupSchema.safeParse(request.body);
      if (!parsed.success) return badRequest(reply, 'Invalid setup data', parsed.error.flatten().fieldErrors);

      const { trackId } = request.params;
      const trackResult = await query(
        `SELECT status FROM ${TABLES.AUTHORING_TRACKS} WHERE id = $1`,
        [trackId],
      );

      if (trackResult.rows.length === 0) return notFound(reply, 'Track not found');
      if ((trackResult.rows[0] as { status: string }).status !== 'draft') {
        return badRequest(reply, 'Can only update setup when track is in draft status');
      }

      const fields: string[] = [];
      const values: unknown[] = [];
      let paramIdx = 1;

      for (const [key, value] of Object.entries(parsed.data)) {
        if (value !== undefined) {
          fields.push(`${key} = $${paramIdx}`);
          values.push(value);
          paramIdx++;
        }
      }

      if (fields.length === 0) return badRequest(reply, 'No fields to update');

      fields.push(`updated_at = NOW()`);
      values.push(trackId);

      const result = await query(
        `UPDATE ${TABLES.AUTHORING_TRACKS} SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
        values,
      );

      return { status: 'success', data: result.rows[0] };
    },
  );

  // ── POST /api/v1/studio/tracks/:trackId/intake — Stage 2: Skill Intake ─

  fastify.post<{ Params: { trackId: string } }>(
    '/api/v1/studio/tracks/:trackId/intake',
    async (request, reply) => {
      if (!canAuthor(request.user.role)) return forbidden(reply);

      const parsed = intakeSchema.safeParse(request.body);
      if (!parsed.success) return badRequest(reply, 'Invalid intake data', parsed.error.flatten().fieldErrors);

      const { trackId } = request.params;
      const trackResult = await query(
        `SELECT status FROM ${TABLES.AUTHORING_TRACKS} WHERE id = $1`,
        [trackId],
      );

      if (trackResult.rows.length === 0) return notFound(reply, 'Track not found');

      const { skill_statement, target_learner_role, context_mode } = parsed.data;

      const result = await query(
        `UPDATE ${TABLES.AUTHORING_TRACKS}
         SET skill_statement = $1, target_learner_role = $2, context_mode = $3, status = 'intake', updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [skill_statement, target_learner_role, context_mode, trackId],
      );

      return { status: 'success', data: result.rows[0] };
    },
  );

  // ── POST /api/v1/studio/tracks/:trackId/decompose — Stage 3: AI Decomposition ─

  fastify.post<{ Params: { trackId: string } }>(
    '/api/v1/studio/tracks/:trackId/decompose',
    async (request, reply) => {
      if (!canAuthor(request.user.role)) return forbidden(reply);

      const { trackId } = request.params;
      const trackResult = await query(
        `SELECT * FROM ${TABLES.AUTHORING_TRACKS} WHERE id = $1`,
        [trackId],
      );

      if (trackResult.rows.length === 0) return notFound(reply, 'Track not found');

      const track = trackResult.rows[0] as Record<string, unknown>;
      const skillStatement = track.skill_statement as string;
      const vertical = track.vertical as string;
      const contextMode = (track.context_mode as string) || 'nigerian';

      if (!skillStatement) {
        return badRequest(reply, 'Skill statement is required before decomposition. Complete intake first.');
      }

      // Create generation job
      await query(
        `INSERT INTO ${TABLES.GENERATION_JOBS} (track_id, job_type, status, input_params, started_at)
         VALUES ($1, 'decomposition', 'running', $2, NOW())`,
        [trackId, JSON.stringify({ skill_statement: skillStatement, vertical, context_mode: contextMode })],
      );

      // Run AI decomposition (mock)
      const spine = await curriculumAI.decomposeSkill(skillStatement, vertical, contextMode);

      // Check concept catalog for matches
      for (const node of spine) {
        if (node.concept_id) {
          const catalogMatch = await query(
            `SELECT id FROM ${TABLES.CONCEPT_CATALOG} WHERE concept_id = $1`,
            [node.concept_id],
          );
          if (catalogMatch.rows.length > 0) {
            node.catalog_overlap = 'linked';
            node.linked_concept_catalog_id = (catalogMatch.rows[0] as { id: string }).id;
          }
        }
      }

      const decompositionMeta = {
        ai_model_used: 'mock-v1',
        decomposed_at: new Date().toISOString(),
        original_spine_count: spine.length,
        catalog_matches_found: spine.filter((n) => n.catalog_overlap === 'linked').length,
      };

      // Update track
      await query(
        `UPDATE ${TABLES.AUTHORING_TRACKS}
         SET spine = $1, decomposition_meta = $2, status = 'decomposition', updated_at = NOW()
         WHERE id = $3`,
        [JSON.stringify(spine), JSON.stringify(decompositionMeta), trackId],
      );

      // Update generation job to completed
      await query(
        `UPDATE ${TABLES.GENERATION_JOBS}
         SET status = 'completed', output_data = $1, completed_at = NOW()
         WHERE track_id = $2 AND job_type = 'decomposition' AND status = 'running'`,
        [JSON.stringify({ spine_count: spine.length }), trackId],
      );

      return { status: 'success', data: { spine, decomposition_meta: decompositionMeta } };
    },
  );

  // ── PUT /api/v1/studio/tracks/:trackId/spine — Stage 3: Edit spine ───

  fastify.put<{ Params: { trackId: string } }>(
    '/api/v1/studio/tracks/:trackId/spine',
    async (request, reply) => {
      if (!canAuthor(request.user.role)) return forbidden(reply);

      const parsed = updateSpineSchema.safeParse(request.body);
      if (!parsed.success) return badRequest(reply, 'Invalid spine data', parsed.error.flatten().fieldErrors);

      const { trackId } = request.params;
      const trackResult = await query(
        `SELECT status FROM ${TABLES.AUTHORING_TRACKS} WHERE id = $1`,
        [trackId],
      );

      if (trackResult.rows.length === 0) return notFound(reply, 'Track not found');
      if ((trackResult.rows[0] as { status: string }).status !== 'decomposition') {
        return badRequest(reply, 'Spine can only be edited in decomposition status');
      }

      const result = await query(
        `UPDATE ${TABLES.AUTHORING_TRACKS}
         SET spine = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [JSON.stringify(parsed.data.spine), trackId],
      );

      return { status: 'success', data: result.rows[0] };
    },
  );

  // ── POST /api/v1/studio/tracks/:trackId/spine/:nodeIndex/link — Link spine node to catalog ─

  fastify.post<{ Params: { trackId: string; nodeIndex: string } }>(
    '/api/v1/studio/tracks/:trackId/spine/:nodeIndex/link',
    async (request, reply) => {
      if (!canAuthor(request.user.role)) return forbidden(reply);

      const parsed = linkSpineNodeSchema.safeParse(request.body);
      if (!parsed.success) return badRequest(reply, 'Invalid link data', parsed.error.flatten().fieldErrors);

      const { trackId, nodeIndex } = request.params;
      const idx = parseInt(nodeIndex, 10);

      const trackResult = await query(
        `SELECT spine FROM ${TABLES.AUTHORING_TRACKS} WHERE id = $1`,
        [trackId],
      );

      if (trackResult.rows.length === 0) return notFound(reply, 'Track not found');

      const spine = (trackResult.rows[0] as { spine: curriculumAI.SpineNode[] }).spine;
      if (!Array.isArray(spine) || idx >= spine.length) {
        return badRequest(reply, 'Invalid spine node index');
      }

      // Verify concept catalog entry exists
      const catalogResult = await query(
        `SELECT id, concept_id FROM ${TABLES.CONCEPT_CATALOG} WHERE id = $1`,
        [parsed.data.concept_catalog_id],
      );

      if (catalogResult.rows.length === 0) return notFound(reply, 'Concept catalog entry not found');

      spine[idx].catalog_overlap = 'linked';
      spine[idx].linked_concept_catalog_id = parsed.data.concept_catalog_id;
      spine[idx].concept_id = (catalogResult.rows[0] as { concept_id: string }).concept_id;

      await query(
        `UPDATE ${TABLES.AUTHORING_TRACKS} SET spine = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(spine), trackId],
      );

      return { status: 'success', data: spine[idx] };
    },
  );

  // ── GET /api/v1/studio/concept-catalog — Search catalog ──────────────

  fastify.get(
    '/api/v1/studio/concept-catalog',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!canAuthor(request.user.role)) return forbidden(reply);

      const parsed = conceptCatalogQuerySchema.safeParse(request.query);
      if (!parsed.success) return badRequest(reply, 'Invalid query', parsed.error.flatten().fieldErrors);

      const { q, domain } = parsed.data;
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (q) {
        params.push(`%${q}%`);
        conditions.push(`(name ILIKE $${params.length} OR domain ILIKE $${params.length})`);
      }

      if (domain) {
        params.push(domain);
        conditions.push(`domain = $${params.length}`);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const result = await query(
        `SELECT * FROM ${TABLES.CONCEPT_CATALOG} ${where} ORDER BY name LIMIT 50`,
        params,
      );

      return { data: result.rows };
    },
  );

  // ── POST /api/v1/studio/concept-catalog — Create catalog entry ───────

  fastify.post(
    '/api/v1/studio/concept-catalog',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!canAuthor(request.user.role)) return forbidden(reply);

      const parsed = createConceptSchema.safeParse(request.body);
      if (!parsed.success) return badRequest(reply, 'Invalid concept data', parsed.error.flatten().fieldErrors);

      const { concept_id, name, domain, prerequisites, spine_position } = parsed.data;

      const result = await query(
        `INSERT INTO ${TABLES.CONCEPT_CATALOG} (concept_id, name, domain, prerequisites, spine_position)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [concept_id, name, domain, JSON.stringify(prerequisites), spine_position ?? null],
      );

      return reply.status(201).send({ status: 'success', data: result.rows[0] });
    },
  );

  // ── POST /api/v1/studio/tracks/:trackId/brief — Stage 4: Pre-filled Brief ─

  fastify.post<{ Params: { trackId: string } }>(
    '/api/v1/studio/tracks/:trackId/brief',
    async (request, reply) => {
      if (!canAuthor(request.user.role)) return forbidden(reply);

      const parsed = briefSchema.safeParse(request.body);
      if (!parsed.success) return badRequest(reply, 'Invalid brief data', parsed.error.flatten().fieldErrors);

      const { trackId } = request.params;
      const trackResult = await query(
        `SELECT status FROM ${TABLES.AUTHORING_TRACKS} WHERE id = $1`,
        [trackId],
      );

      if (trackResult.rows.length === 0) return notFound(reply, 'Track not found');

      const { things_to_avoid, gateway_personas } = parsed.data;

      const briefMeta = {
        brief_completed_at: new Date().toISOString(),
        persona_count: gateway_personas.length,
        calibration_question_count: gateway_personas.reduce(
          (sum, p) => sum + p.calibration_questions.length,
          0,
        ),
      };

      const result = await query(
        `UPDATE ${TABLES.AUTHORING_TRACKS}
         SET things_to_avoid = $1, gateway_personas = $2, brief_meta = $3, status = 'briefing', updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [things_to_avoid ?? null, JSON.stringify(gateway_personas), JSON.stringify(briefMeta), trackId],
      );

      return { status: 'success', data: result.rows[0] };
    },
  );

  // ── PUT /api/v1/studio/tracks/:trackId/brief — Stage 4: Update brief ──

  fastify.put<{ Params: { trackId: string } }>(
    '/api/v1/studio/tracks/:trackId/brief',
    async (request, reply) => {
      if (!canAuthor(request.user.role)) return forbidden(reply);

      const parsed = updateBriefSchema.safeParse(request.body);
      if (!parsed.success) return badRequest(reply, 'Invalid brief data', parsed.error.flatten().fieldErrors);

      const { trackId } = request.params;
      const trackResult = await query(
        `SELECT status FROM ${TABLES.AUTHORING_TRACKS} WHERE id = $1`,
        [trackId],
      );

      if (trackResult.rows.length === 0) return notFound(reply, 'Track not found');
      if ((trackResult.rows[0] as { status: string }).status !== 'briefing') {
        return badRequest(reply, 'Brief can only be updated in briefing status');
      }

      const fields: string[] = [];
      const values: unknown[] = [];
      let paramIdx = 1;

      if (parsed.data.things_to_avoid !== undefined) {
        fields.push(`things_to_avoid = $${paramIdx}`);
        values.push(parsed.data.things_to_avoid);
        paramIdx++;
      }

      if (parsed.data.gateway_personas !== undefined) {
        fields.push(`gateway_personas = $${paramIdx}`);
        values.push(JSON.stringify(parsed.data.gateway_personas));
        paramIdx++;
      }

      if (fields.length === 0) return badRequest(reply, 'No fields to update');

      fields.push(`updated_at = NOW()`);
      values.push(trackId);

      const result = await query(
        `UPDATE ${TABLES.AUTHORING_TRACKS} SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
        values,
      );

      return { status: 'success', data: result.rows[0] };
    },
  );

  // ── POST /api/v1/studio/tracks/:trackId/generate — Stage 5: AI Course Generation ─

  fastify.post<{ Params: { trackId: string } }>(
    '/api/v1/studio/tracks/:trackId/generate',
    async (request, reply) => {
      if (!canAuthor(request.user.role)) return forbidden(reply);

      const { trackId } = request.params;
      const trackResult = await query(
        `SELECT * FROM ${TABLES.AUTHORING_TRACKS} WHERE id = $1`,
        [trackId],
      );

      if (trackResult.rows.length === 0) return notFound(reply, 'Track not found');

      const track = trackResult.rows[0] as Record<string, unknown>;
      const spine = track.spine as curriculumAI.SpineNode[];
      const gatewayPersonas = track.gateway_personas as unknown[];

      if (!spine || !Array.isArray(spine) || spine.length === 0) {
        return badRequest(reply, 'Track must have a spine before generation. Complete decomposition first.');
      }

      // Create generation job
      await query(
        `INSERT INTO ${TABLES.GENERATION_JOBS} (track_id, job_type, status, input_params, started_at)
         VALUES ($1, 'course_generation', 'running', $2, NOW())`,
        [trackId, JSON.stringify({ spine_count: spine.length })],
      );

      // Run AI generation (mock)
      const genResult = await curriculumAI.generateCourse({
        trackName: track.name as string,
        vertical: track.vertical as string,
        contextMode: (track.context_mode as string) || 'nigerian',
        spine,
        thingsToAvoid: track.things_to_avoid as string | null,
        gatewayPersonas: gatewayPersonas || [],
      });

      // Insert trust claims
      for (const claim of genResult.trust_claims) {
        await query(
          `INSERT INTO ${TABLES.TRUST_CLAIMS}
           (track_id, spine_node_index, depth_tier, claim_text, claim_type, source_url, source_label)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [trackId, claim.spine_node_index, claim.depth_tier, claim.claim_text, claim.claim_type, claim.source_url, claim.source_label],
        );
      }

      // Create language readiness records
      for (const lang of genResult.languages_requested) {
        await query(
          `INSERT INTO ${TABLES.LANGUAGE_READINESS} (track_id, language_code, generation_status)
           VALUES ($1, $2, 'generated')
           ON CONFLICT (track_id, language_code) DO UPDATE SET generation_status = 'generated', updated_at = NOW()`,
          [trackId, lang],
        );
      }

      const generationMeta = {
        generated_at: new Date().toISOString(),
        ai_model_used: 'mock-v1',
        total_blocks_generated: genResult.total_blocks_generated,
        trust_claims_flagged: genResult.trust_claims.length,
        languages_requested: genResult.languages_requested,
      };

      // Update track with generated content
      await query(
        `UPDATE ${TABLES.AUTHORING_TRACKS}
         SET spine = $1, generation_meta = $2, status = 'generation', updated_at = NOW()
         WHERE id = $3`,
        [JSON.stringify(genResult.spine), JSON.stringify(generationMeta), trackId],
      );

      // Update generation job
      await query(
        `UPDATE ${TABLES.GENERATION_JOBS}
         SET status = 'completed', output_data = $1, completed_at = NOW()
         WHERE track_id = $2 AND job_type = 'course_generation' AND status = 'running'`,
        [JSON.stringify(generationMeta), trackId],
      );

      return {
        status: 'success',
        data: {
          spine: genResult.spine,
          generation_meta: generationMeta,
          trust_claims_count: genResult.trust_claims.length,
          languages: genResult.languages_requested,
        },
      };
    },
  );

  // ── GET /api/v1/studio/tracks/:trackId/trust-claims — List trust claims ─

  fastify.get<{ Params: { trackId: string } }>(
    '/api/v1/studio/tracks/:trackId/trust-claims',
    async (request, reply) => {
      if (!canReview(request.user.role)) return forbidden(reply);

      const { trackId } = request.params;
      const verified = (request.query as { verified?: string }).verified;

      const conditions = ['track_id = $1'];
      const params: unknown[] = [trackId];

      if (verified === 'true') {
        conditions.push('verified = true');
      } else if (verified === 'false') {
        conditions.push('verified = false');
      }

      const result = await query(
        `SELECT * FROM ${TABLES.TRUST_CLAIMS}
         WHERE ${conditions.join(' AND ')}
         ORDER BY spine_node_index, depth_tier`,
        params,
      );

      return { data: result.rows };
    },
  );

  // ── PUT /api/v1/studio/tracks/:trackId/trust-claims/:claimId — Verify claim ─

  fastify.put<{ Params: { trackId: string; claimId: string } }>(
    '/api/v1/studio/tracks/:trackId/trust-claims/:claimId',
    async (request, reply) => {
      if (!canReview(request.user.role)) return forbidden(reply);

      const parsed = trustClaimUpdateSchema.safeParse(request.body);
      if (!parsed.success) return badRequest(reply, 'Invalid claim update', parsed.error.flatten().fieldErrors);

      const { claimId } = request.params;

      const fields: string[] = [];
      const values: unknown[] = [];
      let paramIdx = 1;

      if (parsed.data.source_url !== undefined) {
        fields.push(`source_url = $${paramIdx}`);
        values.push(parsed.data.source_url);
        paramIdx++;
      }

      if (parsed.data.source_label !== undefined) {
        fields.push(`source_label = $${paramIdx}`);
        values.push(parsed.data.source_label);
        paramIdx++;
      }

      if (parsed.data.verified !== undefined) {
        fields.push(`verified = $${paramIdx}`);
        values.push(parsed.data.verified);
        paramIdx++;

        if (parsed.data.verified) {
          fields.push(`verified_by = $${paramIdx}`);
          values.push(request.user.user_id);
          paramIdx++;
          fields.push(`verified_at = NOW()`);
        }
      }

      if (fields.length === 0) return badRequest(reply, 'No fields to update');

      values.push(claimId);
      const result = await query(
        `UPDATE ${TABLES.TRUST_CLAIMS} SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
        values,
      );

      if (result.rows.length === 0) return notFound(reply, 'Trust claim not found');

      return { status: 'success', data: result.rows[0] };
    },
  );

  // ── GET /api/v1/studio/tracks/:trackId/languages — Language readiness ─

  fastify.get<{ Params: { trackId: string } }>(
    '/api/v1/studio/tracks/:trackId/languages',
    async (request, reply) => {
      if (!canAuthor(request.user.role)) return forbidden(reply);

      const { trackId } = request.params;
      const result = await query(
        `SELECT * FROM ${TABLES.LANGUAGE_READINESS} WHERE track_id = $1 ORDER BY language_code`,
        [trackId],
      );

      return { data: result.rows };
    },
  );

  // ── PUT /api/v1/studio/tracks/:trackId/spine/:nodeIndex/depth/:tier — Edit depth card ─

  fastify.put<{ Params: { trackId: string; nodeIndex: string; tier: string } }>(
    '/api/v1/studio/tracks/:trackId/spine/:nodeIndex/depth/:tier',
    async (request, reply) => {
      if (!canAuthor(request.user.role)) return forbidden(reply);

      const parsed = depthCardUpdateSchema.safeParse(request.body);
      if (!parsed.success) return badRequest(reply, 'Invalid depth card data', parsed.error.flatten().fieldErrors);

      const { trackId, nodeIndex, tier } = request.params;
      const idx = parseInt(nodeIndex, 10);

      if (!['foundational', 'working', 'applied'].includes(tier)) {
        return badRequest(reply, 'Invalid tier. Must be foundational, working, or applied.');
      }

      const trackResult = await query(
        `SELECT spine FROM ${TABLES.AUTHORING_TRACKS} WHERE id = $1`,
        [trackId],
      );

      if (trackResult.rows.length === 0) return notFound(reply, 'Track not found');

      const spine = (trackResult.rows[0] as { spine: curriculumAI.SpineNode[] }).spine;
      if (!Array.isArray(spine) || idx >= spine.length) {
        return badRequest(reply, 'Invalid spine node index');
      }

      if (!spine[idx].depth_cards) {
        spine[idx].depth_cards = {
          foundational: { blocks: [] },
          working: { blocks: [] },
          applied: { blocks: [] },
        };
      }

      const tierKey = tier as 'foundational' | 'working' | 'applied';
      spine[idx].depth_cards![tierKey] = { blocks: parsed.data.blocks };

      await query(
        `UPDATE ${TABLES.AUTHORING_TRACKS} SET spine = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(spine), trackId],
      );

      return { status: 'success', data: spine[idx] };
    },
  );

  // ── POST /api/v1/studio/tracks/:trackId/review — Stage 6: Start review ─

  fastify.post<{ Params: { trackId: string } }>(
    '/api/v1/studio/tracks/:trackId/review',
    async (request, reply) => {
      if (!canReview(request.user.role)) return forbidden(reply);

      const { trackId } = request.params;
      const trackResult = await query(
        `SELECT status FROM ${TABLES.AUTHORING_TRACKS} WHERE id = $1`,
        [trackId],
      );

      if (trackResult.rows.length === 0) return notFound(reply, 'Track not found');

      const result = await query(
        `INSERT INTO ${TABLES.ASSEMBLY_REVIEWS} (track_id, reviewer_id, status)
         VALUES ($1, $2, 'in_progress')
         RETURNING *`,
        [trackId, request.user.user_id],
      );

      return reply.status(201).send({ status: 'success', data: result.rows[0] });
    },
  );

  // ── GET /api/v1/studio/tracks/:trackId/review — Get current review ────

  fastify.get<{ Params: { trackId: string } }>(
    '/api/v1/studio/tracks/:trackId/review',
    async (request, reply) => {
      if (!canReview(request.user.role)) return forbidden(reply);

      const { trackId } = request.params;

      const reviewResult = await query(
        `SELECT * FROM ${TABLES.ASSEMBLY_REVIEWS}
         WHERE track_id = $1
         ORDER BY started_at DESC LIMIT 1`,
        [trackId],
      );

      if (reviewResult.rows.length === 0) return notFound(reply, 'No review found for this track');

      const review = reviewResult.rows[0] as { id: string };

      const actionsResult = await query(
        `SELECT * FROM ${TABLES.REVIEW_ACTIONS}
         WHERE review_id = $1
         ORDER BY spine_node_index, depth_tier`,
        [review.id],
      );

      return {
        review: reviewResult.rows[0],
        actions: actionsResult.rows,
      };
    },
  );

  // ── POST /api/v1/studio/tracks/:trackId/review/actions — Submit review action ─

  fastify.post<{ Params: { trackId: string } }>(
    '/api/v1/studio/tracks/:trackId/review/actions',
    async (request, reply) => {
      if (!canReview(request.user.role)) return forbidden(reply);

      const parsed = reviewActionSchema.safeParse(request.body);
      if (!parsed.success) return badRequest(reply, 'Invalid review action', parsed.error.flatten().fieldErrors);

      const { trackId } = request.params;

      // Get the current review
      const reviewResult = await query(
        `SELECT id FROM ${TABLES.ASSEMBLY_REVIEWS}
         WHERE track_id = $1 AND status = 'in_progress'
         ORDER BY started_at DESC LIMIT 1`,
        [trackId],
      );

      if (reviewResult.rows.length === 0) {
        return badRequest(reply, 'No active review found. Start a review first.');
      }

      const reviewId = (reviewResult.rows[0] as { id: string }).id;

      // We need a lesson_id for the review_actions table since it has NOT NULL constraint.
      // Use a placeholder approach: find any lesson or use the trackId-based approach.
      // Since the original schema requires lesson_id as NOT NULL, we must provide one.
      // Get any lesson to satisfy the constraint, or create a dummy ref.
      const lessonResult = await query(
        `SELECT id FROM ${TABLES.LESSONS} LIMIT 1`,
        [],
      );

      // If no lessons exist yet, we cannot insert into review_actions with the NOT NULL constraint
      // We'll use the first available lesson as a placeholder
      const lessonId = lessonResult.rows.length > 0
        ? (lessonResult.rows[0] as { id: string }).id
        : null;

      if (!lessonId) {
        return badRequest(reply, 'Cannot create review actions before any lessons exist in the system');
      }

      const { spine_node_index, depth_tier, action, category, reason, edited_content } = parsed.data;

      const result = await query(
        `INSERT INTO ${TABLES.REVIEW_ACTIONS}
         (lesson_id, reviewer_id, action, reason, edited_content, track_id, review_id, spine_node_index, depth_tier, category)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          lessonId,
          request.user.user_id,
          action,
          reason ?? null,
          edited_content ? JSON.stringify(edited_content) : null,
          trackId,
          reviewId,
          spine_node_index,
          depth_tier,
          category ?? 'general',
        ],
      );

      return reply.status(201).send({ status: 'success', data: result.rows[0] });
    },
  );

  // ── POST /api/v1/studio/tracks/:trackId/review/complete — Complete review ─

  fastify.post<{ Params: { trackId: string } }>(
    '/api/v1/studio/tracks/:trackId/review/complete',
    async (request, reply) => {
      if (!canReview(request.user.role)) return forbidden(reply);

      const parsed = completeReviewSchema.safeParse(request.body);
      if (!parsed.success) return badRequest(reply, 'Invalid review completion data', parsed.error.flatten().fieldErrors);

      const { trackId } = request.params;
      const { terminology_drift_ok, difficulty_inversion_ok, artifact_redundancy_ok, coverage_gap_ok, reviewer_notes } = parsed.data;

      // Determine if all checks pass
      const allPassed = terminology_drift_ok && difficulty_inversion_ok && artifact_redundancy_ok && coverage_gap_ok;
      const reviewStatus = allPassed ? 'approved' : 'changes_requested';

      // Update the latest in-progress review
      const reviewResult = await query(
        `UPDATE ${TABLES.ASSEMBLY_REVIEWS}
         SET status = $1, terminology_drift_ok = $2, difficulty_inversion_ok = $3,
             artifact_redundancy_ok = $4, coverage_gap_ok = $5, reviewer_notes = $6, completed_at = NOW()
         WHERE track_id = $7 AND status = 'in_progress'
         RETURNING *`,
        [reviewStatus, terminology_drift_ok, difficulty_inversion_ok, artifact_redundancy_ok, coverage_gap_ok, reviewer_notes ?? null, trackId],
      );

      if (reviewResult.rows.length === 0) {
        return badRequest(reply, 'No active review found for this track');
      }

      // Update track status
      const newTrackStatus = allPassed ? 'review' : 'generation';
      await query(
        `UPDATE ${TABLES.AUTHORING_TRACKS} SET status = $1, updated_at = NOW() WHERE id = $2`,
        [newTrackStatus, trackId],
      );

      return {
        status: 'success',
        data: {
          review: reviewResult.rows[0],
          track_status: newTrackStatus,
          approved: allPassed,
        },
      };
    },
  );

  // ── POST /api/v1/studio/tracks/:trackId/publish — Stage 7: Publish ───

  fastify.post<{ Params: { trackId: string } }>(
    '/api/v1/studio/tracks/:trackId/publish',
    async (request, reply) => {
      if (!canAuthor(request.user.role)) return forbidden(reply, 'Insufficient permissions');

      const { trackId } = request.params;
      const trackResult = await query(
        `SELECT * FROM ${TABLES.AUTHORING_TRACKS} WHERE id = $1`,
        [trackId],
      );

      if (trackResult.rows.length === 0) return notFound(reply, 'Track not found');

      const track = trackResult.rows[0] as Record<string, unknown>;
      if (track.status !== 'review') {
        return badRequest(reply, 'Track must be in review status to publish');
      }

      const spine = track.spine as curriculumAI.SpineNode[];
      if (!spine || spine.length === 0) {
        return badRequest(reply, 'Track has no spine content to publish');
      }

      // Create the course
      const slug = (track.name as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 100);

      // Check if slug exists, append trackId prefix if so
      const existingSlug = await query(
        `SELECT id FROM ${TABLES.COURSES} WHERE slug = $1`,
        [slug],
      );
      const finalSlug = existingSlug.rows.length > 0 ? `${slug}-${trackId.slice(0, 8)}` : slug;

      const courseResult = await query(
        `INSERT INTO ${TABLES.COURSES}
         (title, slug, description, difficulty_level, customer_tier_treatment, credential_type, is_published, published_at)
         VALUES ($1, $2, $3, 'working', $4, $5, true, NOW())
         RETURNING id`,
        [
          track.name,
          finalSlug,
          `Auto-published from authoring track: ${track.name}`,
          track.tier_treatment || 'A',
          track.credential_type || 'completion_badge',
        ],
      );

      const courseId = (courseResult.rows[0] as { id: string }).id;

      // Create one module per spine node
      for (const node of spine) {
        const moduleResult = await query(
          `INSERT INTO ${TABLES.MODULES} (course_id, title, sort_order)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [courseId, node.title, node.index],
        );

        const moduleId = (moduleResult.rows[0] as { id: string }).id;
        const paywallIndex = (track.paywall_lesson_index as number) ?? 2;
        const isFree = node.index < paywallIndex;

        // Create one lesson per spine node with depth card content
        const depthCards = node.depth_cards;
        await query(
          `INSERT INTO ${TABLES.LESSONS}
           (module_id, course_id, title, sort_order, estimated_duration_minutes,
            content_foundational, content_working, content_applied,
            has_quiz, is_free, is_published)
           VALUES ($1, $2, $3, $4, 20, $5, $6, $7, true, $8, true)`,
          [
            moduleId,
            courseId,
            node.title,
            node.index,
            depthCards ? JSON.stringify(depthCards.foundational) : JSON.stringify({ blocks: [] }),
            depthCards ? JSON.stringify(depthCards.working) : JSON.stringify({ blocks: [] }),
            depthCards ? JSON.stringify(depthCards.applied) : JSON.stringify({ blocks: [] }),
            isFree,
          ],
        );
      }

      // Create personas from gateway_personas
      const gatewayPersonas = track.gateway_personas as Array<{
        slug: string;
        label: string;
        description: string;
        default_proficiency: string;
        calibration_questions: Array<{
          question_text: string;
          options: string[];
          proficiency_map: Record<string, string>;
        }>;
      }>;

      if (gatewayPersonas && Array.isArray(gatewayPersonas)) {
        for (const persona of gatewayPersonas) {
          const personaResult = await query(
            `INSERT INTO ${TABLES.PERSONAS} (vertical, slug, label, description, default_proficiency, sort_order)
             VALUES ($1, $2, $3, $4, $5, 0)
             ON CONFLICT (slug) DO NOTHING
             RETURNING id`,
            [track.vertical, persona.slug, persona.label, persona.description, persona.default_proficiency],
          );

          if (personaResult.rows.length > 0) {
            const personaId = (personaResult.rows[0] as { id: string }).id;
            for (const cq of persona.calibration_questions) {
              await query(
                `INSERT INTO ${TABLES.CALIBRATION_QUESTIONS} (persona_id, question_text, options, proficiency_map)
                 VALUES ($1, $2, $3, $4)`,
                [personaId, cq.question_text, JSON.stringify(cq.options), JSON.stringify(cq.proficiency_map)],
              );
            }
          }
        }
      }

      // Create credential template
      await query(
        `INSERT INTO ${TABLES.CREDENTIAL_TEMPLATES} (course_id, name, description, credential_tier)
         VALUES ($1, $2, $3, $4)`,
        [
          courseId,
          `${track.name} - ${track.credential_type === 'completion_badge' ? 'Completion Badge' : 'Certificate'}`,
          `Credential for completing ${track.name}`,
          track.credential_type || 'completion_badge',
        ],
      );

      // Update track as published
      await query(
        `UPDATE ${TABLES.AUTHORING_TRACKS}
         SET status = 'published', published_course_id = $1, published_at = NOW(), updated_at = NOW()
         WHERE id = $2`,
        [courseId, trackId],
      );

      return {
        status: 'success',
        data: {
          track_id: trackId,
          course_id: courseId,
          course_slug: finalSlug,
          modules_created: spine.length,
          lessons_created: spine.length,
        },
      };
    },
  );

  // ── POST /api/v1/studio/tracks/:trackId/unpublish — Unpublish ────────

  fastify.post<{ Params: { trackId: string } }>(
    '/api/v1/studio/tracks/:trackId/unpublish',
    async (request, reply) => {
      if (!canAuthor(request.user.role)) return forbidden(reply, 'Insufficient permissions');

      const { trackId } = request.params;
      const trackResult = await query(
        `SELECT status, published_course_id FROM ${TABLES.AUTHORING_TRACKS} WHERE id = $1`,
        [trackId],
      );

      if (trackResult.rows.length === 0) return notFound(reply, 'Track not found');

      const track = trackResult.rows[0] as { status: string; published_course_id: string | null };
      if (track.status !== 'published') {
        return badRequest(reply, 'Track is not published');
      }

      if (track.published_course_id) {
        await query(
          `UPDATE ${TABLES.COURSES} SET is_published = false, updated_at = NOW() WHERE id = $1`,
          [track.published_course_id],
        );
      }

      await query(
        `UPDATE ${TABLES.AUTHORING_TRACKS} SET status = 'review', updated_at = NOW() WHERE id = $1`,
        [trackId],
      );

      return { status: 'success', data: { track_id: trackId, new_status: 'review' } };
    },
  );

  // ── GET /api/v1/studio/tracks/:trackId/preview — Preview content ─────

  fastify.get<{ Params: { trackId: string } }>(
    '/api/v1/studio/tracks/:trackId/preview',
    async (request, reply) => {
      if (!canReview(request.user.role)) return forbidden(reply);

      const parsed = previewQuerySchema.safeParse(request.query);
      if (!parsed.success) return badRequest(reply, 'Invalid preview query', parsed.error.flatten().fieldErrors);

      const { trackId } = request.params;
      const { node, tier } = parsed.data;

      const trackResult = await query(
        `SELECT spine FROM ${TABLES.AUTHORING_TRACKS} WHERE id = $1`,
        [trackId],
      );

      if (trackResult.rows.length === 0) return notFound(reply, 'Track not found');

      const spine = (trackResult.rows[0] as { spine: curriculumAI.SpineNode[] }).spine;
      if (!Array.isArray(spine) || node >= spine.length) {
        return badRequest(reply, 'Invalid spine node index');
      }

      const spineNode = spine[node];
      const depthCards = spineNode.depth_cards;

      if (!depthCards || !depthCards[tier]) {
        return { data: { node: spineNode, tier, blocks: [] } };
      }

      return {
        data: {
          node_index: node,
          title: spineNode.title,
          objective: spineNode.objective,
          tier,
          blocks: depthCards[tier].blocks,
        },
      };
    },
  );

  // ── GET /api/v1/studio/tracks/:trackId/jobs — List generation jobs ───

  fastify.get<{ Params: { trackId: string } }>(
    '/api/v1/studio/tracks/:trackId/jobs',
    async (request, reply) => {
      if (!canAuthor(request.user.role)) return forbidden(reply);

      const { trackId } = request.params;
      const result = await query(
        `SELECT id, job_type, status, started_at, completed_at, created_at, error_message
         FROM ${TABLES.GENERATION_JOBS}
         WHERE track_id = $1
         ORDER BY created_at DESC`,
        [trackId],
      );

      return { data: result.rows };
    },
  );

  // ── GET /api/v1/studio/prompt-templates — List prompt templates ───────

  fastify.get(
    '/api/v1/studio/prompt-templates',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!canAuthor(request.user.role)) return forbidden(reply);

      const parsed = promptTemplateQuerySchema.safeParse(request.query);
      if (!parsed.success) return badRequest(reply, 'Invalid query', parsed.error.flatten().fieldErrors);

      const conditions: string[] = ['is_active = true'];
      const params: unknown[] = [];

      if (parsed.data.stage) {
        params.push(parsed.data.stage);
        conditions.push(`stage = $${params.length}`);
      }

      if (parsed.data.tier) {
        params.push(parsed.data.tier);
        conditions.push(`tier = $${params.length}`);
      }

      const result = await query(
        `SELECT * FROM ${TABLES.PROMPT_TEMPLATES}
         WHERE ${conditions.join(' AND ')}
         ORDER BY stage, tier`,
        params,
      );

      return { data: result.rows };
    },
  );
}
