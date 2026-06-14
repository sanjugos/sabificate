import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../auth/jwt.js';
import type { IssueCredentialRequest } from '../../contracts/api/credentials.js';
import {
  issueCredential,
  verifyCredential,
  listUserCredentials,
  getCredentialById,
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
        const credential = await issueCredential(
          targetUserId,
          body.course_id,
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
