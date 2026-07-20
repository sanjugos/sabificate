import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { verifyAccessToken } from '../auth/jwt.js';
import type { JwtPayload } from '../auth/jwt.js';
import authRoutes from '../auth/routes.js';
import coursesRoutes from '../routes/courses.js';
import progressRoutes from '../routes/progress.js';
import adminRoutes from '../routes/admin.js';
import paymentRoutes from '../routes/payments.js';
import credentialRoutes from '../routes/credentials.js';
import whatsappRoutes from '../routes/whatsapp.js';
import personaRoutes from '../routes/personas.js';
import complianceRoutes from '../routes/compliance.js';
import studioRoutes from '../routes/studio.js';

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
      role: string | string[],
    ) => (
      request: import('fastify').FastifyRequest,
      reply: import('fastify').FastifyReply,
    ) => Promise<void>;
  }
  interface FastifyContextConfig {
    rawBody?: boolean;
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

  server.decorate('requireRole', function (role: string | string[]) {
    const allowed = Array.isArray(role) ? role : [role];
    return async function (
      request: import('fastify').FastifyRequest,
      reply: import('fastify').FastifyReply,
    ) {
      if (!request.user || !allowed.includes(request.user.role)) {
        return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: `Requires ${allowed.join(' or ')} role` });
      }
    };
  });

  // ── Health check ───────────────────────────────────────────────────────

  server.get('/api/v1/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // ── Route plugins ──────────────────────────────────────────────────────

  await server.register(authRoutes);
  await server.register(coursesRoutes);
  await server.register(progressRoutes);
  await server.register(adminRoutes);
  await server.register(paymentRoutes);
  await server.register(credentialRoutes);
  await server.register(whatsappRoutes);
  await server.register(personaRoutes);
  await server.register(complianceRoutes);
  await server.register(studioRoutes);

  return server;
}

// ── Demo seed (in-memory mode only) ───────────────────────────────────────

async function seedDemoUsers() {
  if (process.env.DEV_INMEMORY !== 'true') return;

  const { query: dbQuery } = await import('../db/index.js');
  const bcrypt = await import('bcryptjs');

  // pg-mem names the role CHECK as users_constraint_1 — drop it so new roles work
  for (const name of ['users_role_check', 'users_constraint_1']) {
    try { await dbQuery(`ALTER TABLE users DROP CONSTRAINT ${name}`); } catch {}
  }

  const demoHash = await bcrypt.hash('demo1234', 12);
  const adminHash = await bcrypt.hash('admin1234', 12);
  const staffHash = await bcrypt.hash('staff1234', 12);

  const users: [string, string, string, string, string][] = [
    ['demo@sabificate.com', 'Demo', 'Learner', 'learner', demoHash],
    ['admin@firstbank-training.ng', 'FirstBank', 'Admin', 'corporate_admin', adminHash],
    ['platform@sabificate.com', 'Sanju', 'Gosain', 'platform_admin', staffHash],
    ['author@sabificate.com', 'Gbitse', 'Barrow', 'curriculum_author', staffHash],
    ['reviewer@sabificate.com', 'Mark', 'Otis', 'sme_reviewer', staffHash],
  ];

  for (const [email, first, last, role, hash] of users) {
    try {
      const exists = await dbQuery('SELECT id FROM users WHERE email = $1', [email]);
      if (exists.rows.length === 0) {
        await dbQuery(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
           VALUES ($1, $2, $3, $4, $5, true)`,
          [email, hash, first, last, role],
        );
      }
    } catch (err) {
      console.warn(`[seed] Could not create ${email}:`, err instanceof Error ? err.message : err);
    }
  }
  console.log('[seed] Demo users seeded');
}

// ── Entrypoint ─────────────────────────────────────────────────────────────

async function main() {
  const server = await buildServer();
  const port = Number(process.env.PORT ?? 3001);

  try {
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Server listening on http://0.0.0.0:${port}`);
    await seedDemoUsers();
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
