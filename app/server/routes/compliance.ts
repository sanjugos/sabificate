import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { query } from '../db/index.js';
import { TABLES } from '../db/schema.js';

// ── Request schemas ───────────────────────────────────────────────────────

const createRequirementSchema = z.object({
  course_id: z.string().uuid(),
  regulatory_body: z.string().min(1).max(50),
  compliance_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_mandatory: z.boolean().default(true),
});

const topPerformersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const pilotSetupSchema = z.object({
  organization_name: z.string().min(1).max(255),
  industry: z.string().min(1).max(100),
  billing_contact_email: z.string().email(),
});

// ── Helpers ───────────────────────────────────────────────────────────────

function isAdminRole(role: string): boolean {
  return role === 'corporate_admin' || role === 'platform_admin';
}

// ── Plugin ────────────────────────────────────────────────────────────────

export default async function complianceRoutes(fastify: FastifyInstance) {
  // All routes in this plugin require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // ── GET /api/v1/admin/compliance/status ────────────────────────────────
  fastify.get(
    '/api/v1/admin/compliance/status',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!isAdminRole(request.user.role)) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Requires corporate_admin or platform_admin role',
        });
      }

      const orgId = request.user.org_id;
      if (!orgId) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'User is not associated with an organization',
        });
      }

      // Fetch compliance requirements for this org
      const reqResult = await query(
        `SELECT
           ccr.id AS requirement_id,
           ccr.course_id,
           c.title AS course_title,
           ccr.regulatory_body,
           ccr.compliance_deadline,
           ccr.is_mandatory
         FROM ${TABLES.COURSE_COMPLIANCE_REQUIREMENTS} ccr
         JOIN ${TABLES.COURSES} c ON c.id = ccr.course_id
         WHERE ccr.org_id = $1
         ORDER BY ccr.compliance_deadline ASC`,
        [orgId],
      );

      // Fetch departments for this org
      const deptResult = await query(
        `SELECT id, name FROM ${TABLES.DEPARTMENTS} WHERE org_id = $1 ORDER BY name`,
        [orgId],
      );

      const departments = deptResult.rows as Array<{ id: string; name: string }>;
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const requirements = await Promise.all(
        reqResult.rows.map(async (req: Record<string, unknown>) => {
          const deadline = new Date(req.compliance_deadline as string);

          const deptStats = await Promise.all(
            departments.map(async (dept) => {
              // Count total employees in this department for this org
              const totalResult = await query(
                `SELECT COUNT(*)::int AS total
                 FROM ${TABLES.USERS}
                 WHERE org_id = $1 AND department_id = $2 AND is_active = true`,
                [orgId, dept.id],
              );
              const totalEmployees: number =
                (totalResult.rows[0] as Record<string, unknown>)?.total as number ?? 0;

              // Count employees who completed this course
              const compliantResult = await query(
                `SELECT COUNT(DISTINCT e.user_id)::int AS compliant
                 FROM ${TABLES.ENROLLMENT} e
                 JOIN ${TABLES.USERS} u ON u.id = e.user_id
                 WHERE e.course_id = $1
                   AND u.org_id = $2
                   AND u.department_id = $3
                   AND u.is_active = true
                   AND e.status = 'completed'`,
                [req.course_id, orgId, dept.id],
              );
              const compliantCount: number =
                (compliantResult.rows[0] as Record<string, unknown>)?.compliant as number ?? 0;

              // Determine status
              const allCompliant = totalEmployees > 0 && compliantCount >= totalEmployees;
              let status: 'red' | 'yellow' | 'green';

              if (allCompliant) {
                status = 'green';
              } else if (deadline < now) {
                // Deadline passed and not 100% compliant
                status = 'red';
              } else if (deadline <= thirtyDaysFromNow) {
                // Within 30 days of deadline
                status = 'yellow';
              } else {
                // More than 30 days away, not yet fully compliant
                status = 'yellow';
              }

              return {
                department_id: dept.id,
                department_name: dept.name,
                total_employees: totalEmployees,
                compliant_count: compliantCount,
                status,
              };
            }),
          );

          const deadlineValue = req.compliance_deadline;
          const deadlineStr = deadlineValue instanceof Date
            ? deadlineValue.toISOString().slice(0, 10)
            : String(deadlineValue);

          return {
            course_id: req.course_id,
            course_title: req.course_title,
            regulatory_body: req.regulatory_body,
            deadline: deadlineStr,
            departments: deptStats,
          };
        }),
      );

      return { requirements };
    },
  );

  // ── POST /api/v1/admin/compliance/requirements ────────────────────────
  fastify.post(
    '/api/v1/admin/compliance/requirements',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!isAdminRole(request.user.role)) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Requires corporate_admin or platform_admin role',
        });
      }

      const orgId = request.user.org_id;
      if (!orgId) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'User is not associated with an organization',
        });
      }

      const parsed = createRequirementSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid request body',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const { course_id, regulatory_body, compliance_deadline, is_mandatory } = parsed.data;

      // Verify the course exists
      const courseResult = await query(
        `SELECT id FROM ${TABLES.COURSES} WHERE id = $1`,
        [course_id],
      );
      if (courseResult.rows.length === 0) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Course not found',
        });
      }

      const result = await query(
        `INSERT INTO ${TABLES.COURSE_COMPLIANCE_REQUIREMENTS}
           (org_id, course_id, regulatory_body, compliance_deadline, is_mandatory)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, org_id, course_id, regulatory_body, compliance_deadline, is_mandatory, created_at`,
        [orgId, course_id, regulatory_body, compliance_deadline, is_mandatory],
      );

      return reply.status(201).send(result.rows[0]);
    },
  );

  // ── GET /api/v1/admin/dashboard/top-performers ────────────────────────
  fastify.get(
    '/api/v1/admin/dashboard/top-performers',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!isAdminRole(request.user.role)) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Requires corporate_admin or platform_admin role',
        });
      }

      const orgId = request.user.org_id;
      if (!orgId) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'User is not associated with an organization',
        });
      }

      const parsed = topPerformersQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid query parameters',
        });
      }

      const { limit } = parsed.data;

      const result = await query(
        `SELECT
           u.id AS user_id,
           u.first_name,
           u.last_name,
           u.email,
           d.name AS department,
           COUNT(CASE WHEN e.status = 'completed' THEN 1 END)::int AS courses_completed,
           COUNT(e.id)::int AS courses_enrolled,
           COALESCE(
             AVG(CASE WHEN aa.is_correct THEN 100.0 ELSE 0.0 END),
             0
           )::numeric(5,1) AS avg_score
         FROM ${TABLES.USERS} u
         LEFT JOIN ${TABLES.DEPARTMENTS} d ON d.id = u.department_id
         LEFT JOIN ${TABLES.ENROLLMENT} e ON e.user_id = u.id
         LEFT JOIN ${TABLES.LESSONS} l ON l.course_id = e.course_id
         LEFT JOIN ${TABLES.ASSESSMENT_ATTEMPTS} aa ON aa.user_id = u.id AND aa.lesson_id = l.id
         WHERE u.org_id = $1 AND u.is_active = true
         GROUP BY u.id, u.first_name, u.last_name, u.email, d.name
         ORDER BY courses_completed DESC, avg_score DESC
         LIMIT $2`,
        [orgId, limit],
      );

      const performers = result.rows.map((r: Record<string, unknown>) => ({
        user_id: r.user_id,
        first_name: r.first_name,
        last_name: r.last_name,
        email: r.email,
        department: r.department ?? null,
        courses_completed: r.courses_completed,
        courses_enrolled: r.courses_enrolled,
        avg_score: Number(r.avg_score),
      }));

      return { performers };
    },
  );

  // ── POST /api/v1/admin/pilot/setup ────────────────────────────────────
  fastify.post(
    '/api/v1/admin/pilot/setup',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = pilotSetupSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid request body',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const { organization_name, industry, billing_contact_email } = parsed.data;

      // Generate a slug from org name
      const slug = organization_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if slug already exists
      const existingOrg = await query(
        `SELECT id FROM ${TABLES.ORGANIZATIONS} WHERE slug = $1`,
        [slug],
      );
      if (existingOrg.rows.length > 0) {
        return reply.status(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: 'An organization with a similar name already exists',
        });
      }

      // Calculate pilot expiry (30 days from now)
      const pilotExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Create organization with pilot status
      const orgResult = await query(
        `INSERT INTO ${TABLES.ORGANIZATIONS}
           (name, slug, industry, pilot_status, pilot_expires_at, customer_tier)
         VALUES ($1, $2, $3, 'active', $4, 'freemium')
         RETURNING id, name, slug, industry, pilot_status, pilot_expires_at, customer_tier, created_at`,
        [organization_name, slug, industry, pilotExpiresAt.toISOString()],
      );

      const org = orgResult.rows[0] as Record<string, unknown>;

      // Get the default corporate plan for seat allocation
      const planResult = await query(
        `SELECT id FROM ${TABLES.SUBSCRIPTION_PLANS} WHERE type = 'corporate' LIMIT 1`,
      );

      if (planResult.rows.length > 0) {
        const planId = (planResult.rows[0] as Record<string, unknown>).id;
        await query(
          `INSERT INTO ${TABLES.SEAT_ALLOCATIONS}
             (org_id, plan_id, total_seats, used_seats)
           VALUES ($1, $2, 10, 0)`,
          [org.id, planId],
        );
      }

      // Update the requesting user's org_id if they don't have one
      if (!request.user.org_id) {
        await query(
          `UPDATE ${TABLES.USERS} SET org_id = $1, role = 'corporate_admin', updated_at = NOW() WHERE id = $2`,
          [org.id, request.user.user_id],
        );
      }

      return reply.status(201).send({
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          industry: org.industry,
          pilot_status: org.pilot_status,
          pilot_expires_at: org.pilot_expires_at,
          customer_tier: org.customer_tier,
          billing_contact_email,
          total_seats: 10,
        },
      });
    },
  );
}
