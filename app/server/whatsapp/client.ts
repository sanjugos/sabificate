import { query } from '../db/index.js';
import { TABLES } from '../db/schema.js';

// ── Configuration ───────────────────────────────────────────────────────────

const WHATSAPP_API_TOKEN = () => {
  const token = process.env.WHATSAPP_API_TOKEN;
  if (!token) throw new Error('WHATSAPP_API_TOKEN environment variable is not set');
  return token;
};

const WHATSAPP_PHONE_NUMBER_ID = () => {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!id) throw new Error('WHATSAPP_PHONE_NUMBER_ID environment variable is not set');
  return id;
};

const GRAPH_API_BASE = 'https://graph.facebook.com/v20.0';

// ── Rate Limiting ───────────────────────────────────────────────────────────

const RATE_LIMIT_WINDOW_MS = 1000;
const MAX_MESSAGES_PER_SECOND = 80;

let messageCountInWindow = 0;
let windowStartTime = Date.now();

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  if (now - windowStartTime >= RATE_LIMIT_WINDOW_MS) {
    messageCountInWindow = 0;
    windowStartTime = now;
  }

  if (messageCountInWindow >= MAX_MESSAGES_PER_SECOND) {
    const waitMs = RATE_LIMIT_WINDOW_MS - (now - windowStartTime);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    messageCountInWindow = 0;
    windowStartTime = Date.now();
  }

  messageCountInWindow++;
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface WhatsAppButton {
  id: string;
  title: string;
}

export interface IncomingMessage {
  from: string;
  message_id: string;
  timestamp: string;
  type: 'text' | 'interactive' | 'button';
  text?: { body: string };
  interactive?: {
    type: 'button_reply';
    button_reply: { id: string; title: string };
  };
}

export interface WebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      metadata: { display_phone_number: string; phone_number_id: string };
      contacts?: Array<{ profile: { name: string }; wa_id: string }>;
      messages?: Array<IncomingMessage>;
      statuses?: Array<{
        id: string;
        status: 'sent' | 'delivered' | 'read' | 'failed';
        timestamp: string;
        recipient_id: string;
        errors?: Array<{ code: number; title: string }>;
      }>;
    };
    field: string;
  }>;
}

export interface WebhookBody {
  object: string;
  entry: WebhookEntry[];
}

export interface SendMessageResult {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

// ── Audit Logging ───────────────────────────────────────────────────────────

async function logMessage(params: {
  user_id: string | null;
  phone_number: string;
  direction: 'outbound' | 'inbound';
  message_type: string;
  wa_message_id: string | null;
  content_preview: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await query(
    `INSERT INTO ${TABLES.WHATSAPP_MESSAGES}
       (user_id, phone_number, direction, message_type, wa_message_id, content_preview, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      params.user_id,
      params.phone_number,
      params.direction,
      params.message_type,
      params.wa_message_id,
      params.content_preview.slice(0, 500),
      params.metadata ? JSON.stringify(params.metadata) : null,
    ],
  );
}

// ── API Calls ───────────────────────────────────────────────────────────────

async function callGraphApi(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<SendMessageResult> {
  await waitForRateLimit();

  const url = `${GRAPH_API_BASE}/${WHATSAPP_PHONE_NUMBER_ID()}/${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_API_TOKEN()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`WhatsApp API error: ${response.status} ${errorBody}`);
    throw new Error(`WhatsApp API error: ${response.status} — ${errorBody}`);
  }

  return (await response.json()) as SendMessageResult;
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function sendTextMessage(
  phoneNumber: string,
  text: string,
  userId?: string,
): Promise<SendMessageResult> {
  const result = await callGraphApi('messages', {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: 'text',
    text: { body: text },
  });

  await logMessage({
    user_id: userId ?? null,
    phone_number: phoneNumber,
    direction: 'outbound',
    message_type: 'text',
    wa_message_id: result.messages?.[0]?.id ?? null,
    content_preview: text,
  });

  return result;
}

export async function sendInteractiveButtons(
  phoneNumber: string,
  bodyText: string,
  buttons: WhatsAppButton[],
  userId?: string,
): Promise<SendMessageResult> {
  if (buttons.length > 3) {
    throw new Error('WhatsApp interactive messages support a maximum of 3 buttons');
  }

  const result = await callGraphApi('messages', {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.map((btn) => ({
          type: 'reply',
          reply: { id: btn.id, title: btn.title.slice(0, 20) },
        })),
      },
    },
  });

  await logMessage({
    user_id: userId ?? null,
    phone_number: phoneNumber,
    direction: 'outbound',
    message_type: 'interactive_buttons',
    wa_message_id: result.messages?.[0]?.id ?? null,
    content_preview: bodyText,
    metadata: { buttons },
  });

  return result;
}

export async function sendTemplate(
  phoneNumber: string,
  templateName: string,
  parameters: string[],
  userId?: string,
): Promise<SendMessageResult> {
  const result = await callGraphApi('messages', {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: parameters.map((text) => ({ type: 'text', text })),
        },
      ],
    },
  });

  await logMessage({
    user_id: userId ?? null,
    phone_number: phoneNumber,
    direction: 'outbound',
    message_type: 'template',
    wa_message_id: result.messages?.[0]?.id ?? null,
    content_preview: `template:${templateName}`,
    metadata: { template_name: templateName, parameters },
  });

  return result;
}

export async function handleIncomingMessage(
  webhookBody: WebhookBody,
): Promise<IncomingMessage[]> {
  const messages: IncomingMessage[] = [];

  for (const entry of webhookBody.entry) {
    for (const change of entry.changes) {
      if (change.field !== 'messages') continue;
      const value = change.value;

      if (!value.messages) continue;

      for (const msg of value.messages) {
        messages.push(msg);

        // Log inbound message
        let preview = '';
        if (msg.type === 'text' && msg.text) {
          preview = msg.text.body;
        } else if (msg.type === 'interactive' && msg.interactive) {
          preview = `button_reply:${msg.interactive.button_reply.id}`;
        }

        await logMessage({
          user_id: null,
          phone_number: msg.from,
          direction: 'inbound',
          message_type: msg.type,
          wa_message_id: msg.message_id,
          content_preview: preview,
        });
      }
    }
  }

  return messages;
}

// ── Webhook Signature Verification ──────────────────────────────────────────

export async function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string,
): Promise<boolean> {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    throw new Error('WHATSAPP_APP_SECRET environment variable is not set');
  }

  const crypto = await import('node:crypto');
  const expectedSig = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  return `sha256=${expectedSig}` === signature;
}
