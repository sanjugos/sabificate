import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken, type JwtPayload } from './jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload;
  }
}

/**
 * Fastify onRequest hook that validates the JWT from the Authorization header.
 * Extracts user claims and attaches them to `request.user`.
 * Returns 401 on missing, invalid, or expired token.
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    reply.code(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Missing Authorization header',
    });
    return;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    reply.code(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid Authorization header format. Expected: Bearer <token>',
    });
    return;
  }

  const token = parts[1];

  try {
    const claims = verifyAccessToken(token);
    request.user = claims;
  } catch {
    reply.code(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}
