import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { verifyAccessToken } from '../auth/jwt.js';
import type { JwtPayload } from '../auth/jwt.js';
import coursesRoutes from '../routes/courses.js';
import progressRoutes from '../routes/progress.js';
import adminRoutes from '../routes/admin.js';

// ── Module augmentation ────────────────────────────────────────────────────

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: JwtPayload;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload;
  }
  interface FastifyInstance {
    authenticate: (
      request: import('fastify').FastifyRequest,
      reply: import('fastify').FastifyReply,
    ) => Promise<void>;
    requireRole: (
      role: string,
    ) => (
      request: import('fastify').FastifyRequest,
      reply: import('fastify').FastifyReply,
    ) => Promise<void>;
  }
}

// ── Server factory ─────────────────────────────────────────────────────────

export async function buildServer() {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // ── Plugins ────────────────────────────────────────────────────────────

  await server.register(cors, {
    origin: process.env.CORS_ORIGIN ?? true,
    credentials: true,
  });

  await server.register(fastifyJwt, {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  });

  await server.register(cookie, {
    secret: process.env.COOKIE_SECRET ?? 'cookie-secret-change-me',
  });

  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // ── Content-type parsers ────────────────────────────────────────────────
  // Allow raw text/csv bodies for the bulk enrollment upload endpoint
  server.addContentTypeParser(
    'text/csv',
    { parseAs: 'string' },
    (_req, body, done) => {
      done(null, body);
    },
  );

  // ── Decorators ─────────────────────────────────────────────────────────

  server.decorate(
    'authenticate',
    async function (
      request: import('fastify').FastifyRequest,
      reply: import('fastify').FastifyReply,
    ) {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Missing or invalid authorization header' });
      }
      const token = authHeader.slice(7);
      try {
        request.user = verifyAccessToken(token);
      } catch {
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid or expired token' });
      }
    },
  );

  server.decorate('requireRole', function (role: string) {
    return async function (
      request: import('fastify').FastifyRequest,
      reply: import('fastify').FastifyReply,
    ) {
      if (!request.user || request.user.role !== role) {
        return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: `Requires ${role} role` });
      }
    };
  });

  // ── Health check ───────────────────────────────────────────────────────

  server.get('/api/v1/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // ── Route plugins ──────────────────────────────────────────────────────

  await server.register(coursesRoutes);
  await server.register(progressRoutes);
  await server.register(adminRoutes);

  return server;
}

// ── Entrypoint ─────────────────────────────────────────────────────────────

async function main() {
  const server = await buildServer();
  const port = Number(process.env.PORT ?? 3001);

  try {
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Server listening on http://0.0.0.0:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
