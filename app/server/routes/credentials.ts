import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { verifyAccessToken } from '../auth/jwt.js';
import { query } from '../db/index.js';
import { TABLES } from '../db/schema.js';
import type { IssueCredentialRequest } from '../../contracts/api/credentials.js';
import {
  issueCredential,
  verifyCredential,
  listUserCredentials,
  getCredentialById,
  getCpdSummary,
  getCredentialDetail,
} from '../services/credentialService.js';

// ── Auth helper ───────────────────────────────────────────────────────────

function extractUserId(request: FastifyRequest): string {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw { statusCode: 401, error: 'Unauthorized', message: 'Missing or invalid authorization header' };
  }
  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);
  return payload.user_id;
}

// ── Zod schemas ───────────────────────────────────────────────────────────

const purchaseSchema = z.object({
  credential_template_id: z.string().uuid(),
  course_id: z.string().uuid(),
});

const cpdQuerySchema = z.object({
  body: z.string().min(1),
  year: z.coerce.number().int().min(2020).max(2100),
});

// ── Plugin ────────────────────────────────────────────────────────────────

export default async function credentialRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /api/v1/credentials/issue — internal, triggered by COURSE_COMPLETED event
  fastify.post(
    '/api/v1/credentials/issue',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = extractUserId(request);
        const body = request.body as IssueCredentialRequest;

        if (!body.course_id) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'course_id is required',
          });
        }

        // For internal calls, the user_id in the body takes precedence
        // (e.g., when triggered by a queue worker on behalf of the learner).
        // For direct API calls, use the authenticated user.
        const targetUserId = body.user_id || userId;
        const credentialTier = body.credential_tier ?? 'completion_badge';

        const credential = await issueCredential(
          targetUserId,
          body.course_id,
          credentialTier,
          body.evidence_urls ?? [],
        );

        return reply.status(201).send(credential);
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        if (error.statusCode) {
          return reply.status(error.statusCode).send(error);
        }
        request.log.error(err, 'Failed to issue credential');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message ?? 'Failed to issue credential',
        });
      }
    },
  );

  // POST /api/v1/credentials/purchase — initiate Paystack payment for verified certificate
  fastify.post(
    '/api/v1/credentials/purchase',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = extractUserId(request);
        const parsed = purchaseSchema.safeParse(request.body);

        if (!parsed.success) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Invalid purchase payload',
            details: parsed.error.flatten().fieldErrors,
          });
        }

        const { credential_template_id, course_id } = parsed.data;

        // Look up the credential template to get the price
        const templateResult = await query(
          `SELECT id, price_ngn, credential_tier FROM ${TABLES.CREDENTIAL_TEMPLATES}
           WHERE id = $1 AND course_id = $2`,
          [credential_template_id, course_id],
        );

        const template = templateResult.rows[0] as
          | { id: string; price_ngn: number; credential_tier: string }
          | undefined;

        if (!template) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Credential template not found for this course',
          });
        }

        if (template.price_ngn <= 0) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'This credential does not require payment',
          });
        }

        // Create a payment_transactions row
        const txnId = crypto.randomUUID();
        const reference = `cred-${txnId.slice(0, 8)}`;

        await query(
          `INSERT INTO ${TABLES.PAYMENT_TRANSACTIONS}
             (id, user_id, amount_ngn, currency, gateway, gateway_reference, status, purpose, metadata_json)
           VALUES ($1, $2, $3, 'NGN', 'paystack', $4, 'pending', 'credential_purchase', $5)`,
          [
            txnId,
            userId,
            template.price_ngn,
            reference,
            JSON.stringify({
              credential_template_id,
              course_id,
              credential_tier: template.credential_tier,
            }),
          ],
        );

        // Create credential_purchases row
        await query(
          `INSERT INTO ${TABLES.CREDENTIAL_PURCHASES}
             (user_id, credential_template_id, payment_transaction_id, amount_ngn, status)
           VALUES ($1, $2, $3, $4, 'pending')`,
          [userId, credential_template_id, txnId, template.price_ngn],
        );

        // Return mock authorization URL (Paystack integration can be wired later)
        return reply.status(200).send({
          authorization_url: '/payment/mock',
          reference,
          amount_ngn: template.price_ngn,
        });
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        if (error.statusCode) {
          return reply.status(error.statusCode).send(error);
        }
        request.log.error(err, 'Failed to initiate credential purchase');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error.message ?? 'Failed to initiate credential purchase',
        });
      }
    },
  );

  // GET /api/v1/credentials — list user's credentials
  fastify.get(
    '/api/v1/credentials',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = extractUserId(request);
        const credentials = await listUserCredentials(userId);
        return reply.send({ credentials });
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        if (error.statusCode) {
          return reply.status(error.statusCode).send(error);
        }
        request.log.error(err, 'Failed to list credentials');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to list credentials',
        });
      }
    },
  );

  // GET /api/v1/credentials/:id — get credential detail
  fastify.get(
    '/api/v1/credentials/:id',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = extractUserId(request);
        const { id } = request.params;
        const credential = await getCredentialById(id, userId);

        if (!credential) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Credential not found',
          });
        }

        return reply.send(credential);
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        if (error.statusCode) {
          return reply.status(error.statusCode).send(error);
        }
        request.log.error(err, 'Failed to get credential');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to get credential',
        });
      }
    },
  );

  // GET /api/v1/credentials/:id/pdf — credential detail for PDF generation
  fastify.get(
    '/api/v1/credentials/:id/pdf',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = extractUserId(request);
        const { id } = request.params;
        const detail = await getCredentialDetail(id, userId);

        if (!detail) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Credential not found',
          });
        }

        return reply.send(detail);
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        if (error.statusCode) {
          return reply.status(error.statusCode).send(error);
        }
        request.log.error(err, 'Failed to get credential PDF data');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to get credential PDF data',
        });
      }
    },
  );

  // GET /api/v1/learner/cpd-summary — CPD credit summary by body and year
  fastify.get(
    '/api/v1/learner/cpd-summary',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = extractUserId(request);
        const parsed = cpdQuerySchema.safeParse(request.query);

        if (!parsed.success) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Required query params: body (professional body code) and year',
            details: parsed.error.flatten().fieldErrors,
          });
        }

        const summary = await getCpdSummary(userId, parsed.data.body, parsed.data.year);
        return reply.send(summary);
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        if (error.statusCode) {
          return reply.status(error.statusCode).send(error);
        }
        request.log.error(err, 'Failed to get CPD summary');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to get CPD summary',
        });
      }
    },
  );

  // GET /api/v1/verify/:credentialId — PUBLIC endpoint (no auth)
  fastify.get(
    '/api/v1/verify/:credentialId',
    async (
      request: FastifyRequest<{ Params: { credentialId: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        const { credentialId } = request.params;
        const verification = await verifyCredential(credentialId);
        return reply.send(verification);
      } catch (err: unknown) {
        request.log.error(err, 'Failed to verify credential');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to verify credential',
        });
      }
    },
  );
}
