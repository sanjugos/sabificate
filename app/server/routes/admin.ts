import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import { queues } from '../queue/index.js';
import { QUEUE_NAMES } from '../../contracts/shared/events.js';
import * as adminService from '../services/adminService.js';

// ── Request schemas ───────────────────────────────────────────────────────

const bulkUploadJobParamsSchema = z.object({
  jobId: z.string().uuid(),
});

const dashboardLearnersQuerySchema = z.object({
  search: z.string().optional(),
  department_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

const itfReportSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  department_id: z.string().uuid().optional(),
});

const cpdReportSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  professional_body: z.string(),
});

// ── Plugin ────────────────────────────────────────────────────────────────

export default async function adminRoutes(fastify: FastifyInstance) {
  // All routes require authentication + corporate_admin role
  fastify.addHook('preHandler', fastify.authenticate);
  fastify.addHook('preHandler', fastify.requireRole('corporate_admin'));

  // ── POST /api/v1/admin/learners/bulk-upload ────────────────────────────
  // Accepts raw CSV text body (content-type: text/csv)
  fastify.post(
    '/api/v1/admin/learners/bulk-upload',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const orgId = request.user.org_id;
      if (!orgId) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'User is not associated with an organization',
        });
      }

      // Read the raw CSV body
      const csvText =
        typeof request.body === 'string'
          ? request.body
          : Buffer.isBuffer(request.body)
            ? (request.body as Buffer).toString('utf-8')
            : '';

      if (!csvText.trim()) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'CSV body is empty',
        });
      }

      // Parse header + count data rows
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'CSV must contain a header row and at least one data row',
        });
      }

      const totalRows = lines.length - 1; // subtract header

      // Create bulk_enrollment_jobs record
      const jobId = uuidv4();
      await query(
        `INSERT INTO bulk_enrollment_jobs
           (id, org_id, admin_user_id, file_name, total_rows, processed, succeeded, failed, status, created_at)
         VALUES ($1, $2, $3, $4, $5, 0, 0, 0, 'processing', NOW())`,
        [jobId, orgId, request.user.user_id, 'upload.csv', totalRows],
      );

      // Queue the BullMQ job for async processing
      await queues[QUEUE_NAMES.CSV_ENROLLMENT_UPLOADED].add(
        'csv-enrollment',
        {
          job_id: jobId,
          csv_text: csvText,
          org_id: orgId,
          admin_user_id: request.user.user_id,
        },
      );

      return reply.status(202).send({
        job_id: jobId,
        status: 'processing' as const,
        total_rows: totalRows,
      });
    },
  );

  // ── GET /api/v1/admin/learners/bulk-upload/:jobId ─────────────────────
  fastify.get(
    '/api/v1/admin/learners/bulk-upload/:jobId',
    async (
      request: FastifyRequest<{ Params: { jobId: string } }>,
      reply: FastifyReply,
    ) => {
      const parsed = bulkUploadJobParamsSchema.safeParse(request.params);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid job ID',
        });
      }

      const status = await adminService.getBulkJobStatus(parsed.data.jobId);
      if (!status) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Bulk enrollment job not found',
        });
      }

      return status;
    },
  );

  // ── GET /api/v1/admin/dashboard/overview ──────────────────────────────
  fastify.get(
    '/api/v1/admin/dashboard/overview',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const orgId = request.user.org_id;
      if (!orgId) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'User is not associated with an organization',
        });
      }

      return adminService.getOverview(orgId);
    },
  );

  // ── GET /api/v1/admin/dashboard/learners ──────────────────────────────
  fastify.get(
    '/api/v1/admin/dashboard/learners',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const orgId = request.user.org_id;
      if (!orgId) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'User is not associated with an organization',
        });
      }

      const parsed = dashboardLearnersQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid query parameters',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      return adminService.getLearners(orgId, parsed.data);
    },
  );

  // ── GET /api/v1/admin/dashboard/courses ───────────────────────────────
  fastify.get(
    '/api/v1/admin/dashboard/courses',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const orgId = request.user.org_id;
      if (!orgId) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'User is not associated with an organization',
        });
      }

      return adminService.getCourseStats(orgId);
    },
  );

  // ── POST /api/v1/admin/reports/itf ────────────────────────────────────
  // Generates ITF Form 7A CSV report
  fastify.post(
    '/api/v1/admin/reports/itf',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const orgId = request.user.org_id;
      if (!orgId) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'User is not associated with an organization',
        });
      }

      const parsed = itfReportSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid report parameters',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const csv = await adminService.generateITFReport(orgId, parsed.data);

      const filename = `ITF-Form7A_${parsed.data.start_date}_${parsed.data.end_date}.csv`;
      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csv);
    },
  );

  // ── POST /api/v1/admin/reports/cpd ────────────────────────────────────
  // Generates CPD hours CSV report
  fastify.post(
    '/api/v1/admin/reports/cpd',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const orgId = request.user.org_id;
      if (!orgId) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'User is not associated with an organization',
        });
      }

      const parsed = cpdReportSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid report parameters',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const csv = await adminService.generateCPDReport(orgId, parsed.data);

      const filename = `CPD-Report_${parsed.data.professional_body}_${parsed.data.start_date}_${parsed.data.end_date}.csv`;
      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csv);
    },
  );

  // ── GET /api/v1/admin/seats/overview ──────────────────────────────────
  fastify.get(
    '/api/v1/admin/seats/overview',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const orgId = request.user.org_id;
      if (!orgId) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'User is not associated with an organization',
        });
      }

      return adminService.getSeatOverview(orgId);
    },
  );
}
