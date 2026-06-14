import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'node:crypto';
import { z } from 'zod';
import { query } from '../db/index.js';
import { TABLES } from '../db/schema.js';
import { queues } from '../queue/index.js';
import { QUEUE_NAMES } from '../../contracts/shared/events.js';
import {
  initializeTransaction,
  verifyTransaction,
  handleChargeSuccess,
  handleChargeFailed,
} from '../services/paymentService.js';
import { scheduleDunning } from '../services/dunningService.js';
import {
  createInvoice,
  generatePDF,
  listInvoices,
  getInvoiceHTML,
} from '../services/invoiceService.js';
import { verifyAccessToken, type JwtPayload } from '../auth/jwt.js';

// ── Zod schemas ────────────────────────────────────────────────────────────

const initializePaymentSchema = z.object({
  plan_id: z.string().uuid(),
  payment_type: z.enum(['subscription', 'invoice']),
});

const paystackWebhookSchema = z.object({
  event: z.string(),
  data: z.record(z.string(), z.unknown()),
});

const invoiceCreateSchema = z.object({
  org_id: z.string().uuid(),
  plan_id: z.string().uuid(),
  seat_count: z.number().int().min(1),
  billing_contact_email: z.string().email(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Auth helpers ───────────────────────────────────────────────────────────

function extractUser(request: FastifyRequest): JwtPayload {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw { statusCode: 401, message: 'Missing or invalid authorization header' };
  }
  return verifyAccessToken(authHeader.slice(7));
}

function requireRole(user: JwtPayload, role: string): void {
  if (user.role !== role && user.role !== 'platform_admin') {
    throw { statusCode: 403, message: `Requires ${role} role` };
  }
}

// ── Paystack signature verification ────────────────────────────────────────

function verifyPaystackSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;

  const hash = crypto
    .createHmac('sha512', secret)
    .update(rawBody)
    .digest('hex');

  return hash === signature;
}

// ── Route plugin ───────────────────────────────────────────────────────────

export default async function paymentRoutes(app: FastifyInstance): Promise<void> {
  // Need raw body for webhook signature verification
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (_req, body, done) => {
      try {
        done(null, JSON.parse(body as string));
      } catch (err) {
        done(err as Error);
      }
    },
  );

  // ── GET /api/v1/plans ──────────────────────────────────────────────────

  app.get('/api/v1/plans', async (_request: FastifyRequest, reply: FastifyReply) => {
    const result = await query(
      `SELECT id, name, type, price_ngn, billing_cycle, features, max_courses, paystack_plan_code
       FROM ${TABLES.SUBSCRIPTION_PLANS}
       ORDER BY price_ngn ASC`,
    );

    return reply.send({
      status: 'success',
      data: result.rows.map((row) => ({
        ...row,
        features: typeof row.features === 'string' ? JSON.parse(row.features as string) : row.features,
      })),
    });
  });

  // ── POST /api/v1/payments/initialize ───────────────────────────────────

  app.post(
    '/api/v1/payments/initialize',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = extractUser(request);
      const body = initializePaymentSchema.parse(request.body);

      // Look up the plan
      const planResult = await query(
        `SELECT id, price_ngn, paystack_plan_code, billing_cycle
         FROM ${TABLES.SUBSCRIPTION_PLANS}
         WHERE id = $1`,
        [body.plan_id],
      );
      const plan = planResult.rows[0] as
        | { id: string; price_ngn: number; paystack_plan_code: string; billing_cycle: string }
        | undefined;

      if (!plan) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Plan not found',
        });
      }

      const amountKobo = Math.round(plan.price_ngn * 100);

      const result = await initializeTransaction({
        email: user.email,
        amount: amountKobo,
        plan_code: body.payment_type === 'subscription' ? plan.paystack_plan_code : undefined,
        metadata: {
          plan_id: plan.id,
          user_id: user.user_id,
          org_id: user.org_id,
          billing_cycle: plan.billing_cycle,
          payment_type: body.payment_type,
        },
      });

      return reply.status(200).send({
        status: 'success',
        data: {
          authorization_url: result.authorization_url,
          access_code: result.access_code,
          reference: result.reference,
        },
      });
    },
  );

  // ── POST /api/v1/webhooks/paystack ─────────────────────────────────────

  app.post(
    '/api/v1/webhooks/paystack',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const signature = request.headers['x-paystack-signature'] as string;
      const rawBody =
        typeof request.body === 'string'
          ? request.body
          : JSON.stringify(request.body);

      if (!signature || !verifyPaystackSignature(rawBody, signature)) {
        return reply.status(401).send({ message: 'Invalid signature' });
      }

      const parsed =
        typeof request.body === 'string'
          ? JSON.parse(request.body)
          : request.body;

      const webhook = paystackWebhookSchema.parse(parsed);

      // Use BullMQ for idempotent processing — jobId prevents duplicates
      const jobId = `webhook-${webhook.event}-${(webhook.data.reference as string) ?? Date.now()}`;

      await queues[QUEUE_NAMES.PAYMENT_SUCCEEDED].add(
        'webhook.process',
        { event: webhook.event, data: webhook.data },
        { jobId },
      );

      // Process synchronously as well (BullMQ job is for idempotency tracking)
      try {
        switch (webhook.event) {
          case 'charge.success':
            await handleChargeSuccess(webhook.data);
            break;

          case 'charge.failed':
            await handleChargeFailed(webhook.data);
            break;

          case 'subscription.create':
            // Handled via charge.success metadata
            console.log('[webhook] subscription.create received');
            break;

          case 'subscription.not_renew':
            // Mark subscription as past_due, begin dunning
            await handleSubscriptionNotRenew(webhook.data);
            break;

          case 'invoice.payment_failed':
            // Trigger dunning for invoice payment
            await handleInvoicePaymentFailed(webhook.data);
            break;

          default:
            console.log(`[webhook] Unhandled event: ${webhook.event}`);
        }
      } catch (err) {
        console.error(`[webhook] Error processing ${webhook.event}:`, err);
        // Still return 200 to Paystack so they don't retry
      }

      return reply.status(200).send({ message: 'ok' });
    },
  );

  // ── GET /api/v1/payments/verify/:reference ─────────────────────────────

  app.get(
    '/api/v1/payments/verify/:reference',
    async (
      request: FastifyRequest<{ Params: { reference: string } }>,
      reply: FastifyReply,
    ) => {
      extractUser(request); // require auth

      const { reference } = request.params;
      const result = await verifyTransaction(reference);

      return reply.send({
        status: 'success',
        data: {
          status: result.status,
          reference: result.reference,
          amount: result.amount / 100, // kobo -> naira
          currency: result.currency,
          channel: result.channel,
        },
      });
    },
  );

  // ── GET /api/v1/subscriptions/current ──────────────────────────────────

  app.get(
    '/api/v1/subscriptions/current',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = extractUser(request);

      const result = await query(
        `SELECT s.id, s.status, s.current_period_start, s.current_period_end,
                sp.name AS plan_name, sp.price_ngn, sp.billing_cycle, sp.features
         FROM ${TABLES.SUBSCRIPTIONS} s
         JOIN ${TABLES.SUBSCRIPTION_PLANS} sp ON sp.id = s.plan_id
         WHERE s.user_id = $1
         ORDER BY s.created_at DESC
         LIMIT 1`,
        [user.user_id],
      );

      const subscription = result.rows[0] as Record<string, unknown> | undefined;

      if (!subscription) {
        return reply.send({
          status: 'success',
          data: null,
        });
      }

      // Get last payment method
      const paymentResult = await query(
        `SELECT payment_method
         FROM ${TABLES.PAYMENT_TRANSACTIONS}
         WHERE user_id = $1 AND status = 'success'
         ORDER BY created_at DESC
         LIMIT 1`,
        [user.user_id],
      );

      return reply.send({
        status: 'success',
        data: {
          ...subscription,
          features:
            typeof subscription.features === 'string'
              ? JSON.parse(subscription.features as string)
              : subscription.features,
          payment_method: paymentResult.rows[0]?.payment_method ?? null,
        },
      });
    },
  );

  // ── POST /api/v1/admin/invoices ────────────────────────────────────────

  app.post(
    '/api/v1/admin/invoices',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = extractUser(request);
      requireRole(user, 'corporate_admin');

      const body = invoiceCreateSchema.parse(request.body);

      // Verify user belongs to this org
      if (user.org_id !== body.org_id && user.role !== 'platform_admin') {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Cannot create invoices for another organization',
        });
      }

      const invoice = await createInvoice({
        orgId: body.org_id,
        planId: body.plan_id,
        seatCount: body.seat_count,
        billingContactEmail: body.billing_contact_email,
      });

      // Generate PDF immediately
      await generatePDF(invoice.id);

      return reply.status(201).send({
        status: 'success',
        data: invoice,
      });
    },
  );

  // ── GET /api/v1/admin/invoices ─────────────────────────────────────────

  app.get(
    '/api/v1/admin/invoices',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = extractUser(request);
      requireRole(user, 'corporate_admin');

      if (!user.org_id) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'User is not associated with an organization',
        });
      }

      const { page, limit } = paginationSchema.parse(request.query);
      const { invoices, total } = await listInvoices(user.org_id, page, limit);

      return reply.send({
        status: 'success',
        data: invoices,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    },
  );

  // ── GET /api/v1/admin/invoices/:id/pdf ─────────────────────────────────

  app.get(
    '/api/v1/admin/invoices/:id/pdf',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const user = extractUser(request);
      requireRole(user, 'corporate_admin');

      const { id } = request.params;
      const html = await getInvoiceHTML(id);

      if (!html) {
        // Try generating it
        try {
          await generatePDF(id);
          const retryHtml = await getInvoiceHTML(id);
          if (!retryHtml) {
            return reply.status(404).send({
              statusCode: 404,
              error: 'Not Found',
              message: 'Invoice not found',
            });
          }
          return reply
            .header('Content-Type', 'text/html; charset=utf-8')
            .header(
              'Content-Disposition',
              `attachment; filename="invoice-${id}.html"`,
            )
            .send(retryHtml);
        } catch {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Invoice not found',
          });
        }
      }

      return reply
        .header('Content-Type', 'text/html; charset=utf-8')
        .header(
          'Content-Disposition',
          `attachment; filename="invoice-${id}.html"`,
        )
        .send(html);
    },
  );
}

// ── Internal webhook sub-handlers ──────────────────────────────────────────

async function handleSubscriptionNotRenew(
  data: Record<string, unknown>,
): Promise<void> {
  const customerEmail = (data.customer as { email?: string })?.email;
  if (!customerEmail) return;

  const userResult = await query(
    `SELECT id FROM ${TABLES.USERS} WHERE email = $1`,
    [customerEmail],
  );
  const userId = userResult.rows[0]?.id as string | undefined;
  if (!userId) return;

  // Mark subscription as past_due
  await query(
    `UPDATE ${TABLES.SUBSCRIPTIONS}
     SET status = 'past_due', updated_at = NOW()
     WHERE user_id = $1 AND status = 'active'`,
    [userId],
  );

  // Find the most recent failed transaction
  const txResult = await query(
    `SELECT id FROM ${TABLES.PAYMENT_TRANSACTIONS}
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId],
  );
  const transactionId = txResult.rows[0]?.id as string;

  if (transactionId) {
    await scheduleDunning(userId, transactionId);
  }
}

async function handleInvoicePaymentFailed(
  data: Record<string, unknown>,
): Promise<void> {
  const metadata = (data.metadata ?? {}) as Record<string, unknown>;
  const userId = metadata.user_id as string | undefined;

  if (!userId) return;

  const reference = data.reference as string;
  const txResult = await query(
    `SELECT id FROM ${TABLES.PAYMENT_TRANSACTIONS} WHERE gateway_reference = $1`,
    [reference],
  );

  const transactionId = txResult.rows[0]?.id as string | undefined;
  if (transactionId) {
    await scheduleDunning(userId, transactionId);
  }
}
