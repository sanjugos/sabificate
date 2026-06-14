import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { query } from '../db/index.js';
import { TABLES } from '../db/schema.js';
import { verifyAccessToken, type JwtPayload } from '../auth/jwt.js';
import {
  handleIncomingMessage,
  verifyWebhookSignature,
} from '../whatsapp/client.js';
import { processQuizReply } from '../whatsapp/lessonDelivery.js';
import { findUserByPhone, hasWhatsAppConsent } from '../whatsapp/conversationState.js';
import { scheduleDaily, cancelSchedule } from '../whatsapp/scheduler.js';
import { recordConsent } from '../auth/consent.js';

// ── Auth Helper ─────────────────────────────────────────────────────────────

function extractUser(request: FastifyRequest): JwtPayload {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw { statusCode: 401, message: 'Missing or invalid authorization header' };
  }
  return verifyAccessToken(authHeader.slice(7));
}

// ── Plugin ──────────────────────────────────────────────────────────────────

export default async function whatsappRoutes(app: FastifyInstance): Promise<void> {
  // ── GET /api/v1/webhooks/whatsapp — Meta webhook verification ───────────
  app.get('/api/v1/webhooks/whatsapp', async (request: FastifyRequest, reply: FastifyReply) => {
    const qs = request.query as Record<string, string>;
    const mode = qs['hub.mode'];
    const token = qs['hub.verify_token'];
    const challenge = qs['hub.challenge'];

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    if (!verifyToken) {
      return reply.status(500).send({ error: 'WHATSAPP_VERIFY_TOKEN not configured' });
    }

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WhatsApp webhook verification successful');
      return reply.status(200).send(challenge);
    }

    return reply.status(403).send({ error: 'Verification failed' });
  });

  // ── POST /api/v1/webhooks/whatsapp — Meta webhook handler ──────────────
  app.post(
    '/api/v1/webhooks/whatsapp',
    {
      config: {
        rawBody: true,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Validate signature
      const signature = request.headers['x-hub-signature-256'] as string | undefined;
      if (!signature) {
        return reply.status(401).send({ error: 'Missing signature' });
      }

      const rawBody = (request as FastifyRequest & { rawBody?: Buffer }).rawBody;
      if (!rawBody) {
        return reply.status(400).send({ error: 'Missing raw body' });
      }

      const isValid = await verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        return reply.status(401).send({ error: 'Invalid signature' });
      }

      // Process messages asynchronously — respond 200 immediately per Meta requirement
      const body = request.body as Record<string, unknown>;
      reply.status(200).send('EVENT_RECEIVED');

      try {
        const messages = await handleIncomingMessage(body as Parameters<typeof handleIncomingMessage>[0]);

        for (const msg of messages) {
          // Handle button replies (quiz answers)
          if (msg.type === 'interactive' && msg.interactive?.type === 'button_reply') {
            const user = await findUserByPhone(msg.from);
            if (user) {
              await processQuizReply(
                user.id,
                msg.message_id,
                msg.interactive.button_reply.id,
              );
            }
          }

          // Handle text messages (future: free-form responses, commands)
          if (msg.type === 'text' && msg.text) {
            const user = await findUserByPhone(msg.from);
            if (user) {
              console.log(`Received text from user ${user.id}: ${msg.text.body.slice(0, 100)}`);
              // Future: handle text commands like "STOP", "HELP", etc.
            }
          }
        }
      } catch (err) {
        console.error('Error processing WhatsApp webhook:', err);
      }
    },
  );

  // ── POST /api/v1/whatsapp/subscribe — Subscribe to WhatsApp delivery ───
  app.post('/api/v1/whatsapp/subscribe', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = extractUser(request);

    const body = request.body as {
      preferred_time?: string;
      timezone?: string;
    };

    const preferredTime = body.preferred_time ?? '09:00';
    const timezone = body.timezone ?? 'Africa/Lagos';

    // Check if user has a phone number
    const userResult = await query(
      `SELECT phone FROM ${TABLES.USERS} WHERE id = $1`,
      [user.user_id],
    );

    if (userResult.rows.length === 0) {
      return reply.status(404).send({ error: 'User not found' });
    }

    const phone = (userResult.rows[0] as { phone: string | null }).phone;
    if (!phone) {
      return reply.status(400).send({
        error: 'No phone number on file. Please add a phone number to your profile first.',
      });
    }

    // Record WhatsApp consent
    await recordConsent({
      user_id: user.user_id,
      consents: { whatsapp: true },
      ip_address: request.ip,
    });

    // Create/update subscription
    await query(
      `INSERT INTO ${TABLES.WHATSAPP_SUBSCRIPTIONS}
         (user_id, preferred_time, timezone, active, created_at)
       VALUES ($1, $2, $3, true, NOW())
       ON CONFLICT (user_id) DO UPDATE
         SET preferred_time = $2, timezone = $3, active = true, updated_at = NOW()`,
      [user.user_id, preferredTime, timezone],
    );

    // Schedule daily lesson delivery
    await scheduleDaily(user.user_id, preferredTime);

    return reply.status(201).send({
      subscribed: true,
      preferred_time: preferredTime,
      timezone,
      phone: phone.slice(0, 4) + '****' + phone.slice(-2), // Mask phone
    });
  });

  // ── DELETE /api/v1/whatsapp/subscribe — Unsubscribe ────────────────────
  app.delete('/api/v1/whatsapp/subscribe', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = extractUser(request);

    // Cancel schedule
    await cancelSchedule(user.user_id);

    // Revoke WhatsApp consent
    await recordConsent({
      user_id: user.user_id,
      consents: { whatsapp: false },
      ip_address: request.ip,
    });

    return reply.status(200).send({ subscribed: false });
  });

  // ── GET /api/v1/whatsapp/status — Current subscription status ──────────
  app.get('/api/v1/whatsapp/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = extractUser(request);

    const subResult = await query(
      `SELECT preferred_time, timezone, active, created_at, updated_at
       FROM ${TABLES.WHATSAPP_SUBSCRIPTIONS}
       WHERE user_id = $1`,
      [user.user_id],
    );

    if (subResult.rows.length === 0) {
      return reply.status(200).send({
        subscribed: false,
        has_consent: false,
      });
    }

    const sub = subResult.rows[0] as {
      preferred_time: string;
      timezone: string;
      active: boolean;
      created_at: string;
      updated_at: string | null;
    };

    const consented = await hasWhatsAppConsent(user.user_id);

    // Get recent message count
    const messageCountResult = await query(
      `SELECT COUNT(*) AS count FROM ${TABLES.WHATSAPP_MESSAGES}
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'`,
      [user.user_id],
    );
    const recentMessageCount = parseInt(
      (messageCountResult.rows[0] as { count: string }).count,
      10,
    );

    return reply.status(200).send({
      subscribed: sub.active,
      has_consent: consented,
      preferred_time: sub.preferred_time,
      timezone: sub.timezone,
      subscribed_at: sub.created_at,
      updated_at: sub.updated_at,
      recent_messages_7d: recentMessageCount,
    });
  });
}
