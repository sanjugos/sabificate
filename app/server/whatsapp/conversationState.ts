import { query } from '../db/index.js';
import { TABLES } from '../db/schema.js';

const useInMemory = process.env.DEV_INMEMORY === 'true';

// ── Redis client (real or mock) ────────────────────────────────────────────

interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: (string | number)[]): Promise<'OK'>;
  del(...keys: string[]): Promise<number>;
}

let redis: RedisLike;

if (useInMemory) {
  const { createMockRedis } = await import('../dev/redis-mock.js');
  redis = createMockRedis();
  console.log('[dev/conversationState] Using in-memory Redis mock');
} else {
  const { default: Redis } = await import('ioredis');
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379') as unknown as RedisLike;
}

const TTL_SECONDS = 24 * 60 * 60; // 24-hour TTL per conversation

// ── Key Schema ──────────────────────────────────────────────────────────────

const KEYS = {
  conversation: (userId: string) => `wa:conv:${userId}`,
  buttonMap: (userId: string) => `wa:buttons:${userId}`,
} as const;

// ── Types ───────────────────────────────────────────────────────────────────

export interface ConversationState {
  user_id: string;
  lesson_id: string;
  course_id: string;
  phase: 'delivering_content' | 'quiz_pending' | 'quiz_feedback' | 'artifact_prompt' | 'idle';
  current_content_index: number;
  total_content_parts: number;
  current_quiz_index: number;
  total_quiz_count: number;
  pending_quiz_block_id: string | null;
  quiz_results: QuizResult[];
  started_at: string;
}

export interface QuizResult {
  quiz_block_id: string;
  selected_option: number;
  is_correct: boolean;
  answered_at: string;
}

export interface ButtonMapping {
  quiz_block_id: string;
  option_index: number;
  option_text: string;
  is_correct: boolean;
}

// ── State Management ────────────────────────────────────────────────────────

export async function getConversationState(userId: string): Promise<ConversationState | null> {
  const data = await redis.get(KEYS.conversation(userId));
  if (!data) return null;
  return JSON.parse(data) as ConversationState;
}

export async function setConversationState(
  userId: string,
  state: ConversationState,
): Promise<void> {
  await redis.set(KEYS.conversation(userId), JSON.stringify(state), 'EX', TTL_SECONDS);
}

export async function clearConversationState(userId: string): Promise<void> {
  await redis.del(KEYS.conversation(userId));
  await redis.del(KEYS.buttonMap(userId));
}

// ── Button Mapping ──────────────────────────────────────────────────────────

export async function setButtonMappings(
  userId: string,
  mappings: Record<string, ButtonMapping>,
): Promise<void> {
  await redis.set(KEYS.buttonMap(userId), JSON.stringify(mappings), 'EX', TTL_SECONDS);
}

export async function getButtonMapping(
  userId: string,
  buttonId: string,
): Promise<ButtonMapping | null> {
  const data = await redis.get(KEYS.buttonMap(userId));
  if (!data) return null;

  const mappings = JSON.parse(data) as Record<string, ButtonMapping>;
  return mappings[buttonId] ?? null;
}

export async function clearButtonMappings(userId: string): Promise<void> {
  await redis.del(KEYS.buttonMap(userId));
}

// ── Message Logging ─────────────────────────────────────────────────────────

export async function logOutboundMessage(params: {
  user_id: string;
  phone_number: string;
  message_type: string;
  wa_message_id: string | null;
  content_preview: string;
  lesson_id?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await query(
    `INSERT INTO ${TABLES.WHATSAPP_MESSAGES}
       (user_id, phone_number, direction, message_type, wa_message_id, content_preview, lesson_id, metadata, created_at)
     VALUES ($1, $2, 'outbound', $3, $4, $5, $6, $7, NOW())`,
    [
      params.user_id,
      params.phone_number,
      params.message_type,
      params.wa_message_id,
      params.content_preview.slice(0, 500),
      params.lesson_id ?? null,
      params.metadata ? JSON.stringify(params.metadata) : null,
    ],
  );
}

export async function logInboundMessage(params: {
  phone_number: string;
  message_type: string;
  wa_message_id: string;
  content_preview: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await query(
    `INSERT INTO ${TABLES.WHATSAPP_MESSAGES}
       (phone_number, direction, message_type, wa_message_id, content_preview, metadata, created_at)
     VALUES ($1, 'inbound', $2, $3, $4, $5, NOW())`,
    [
      params.phone_number,
      params.message_type,
      params.wa_message_id,
      params.content_preview.slice(0, 500),
      params.metadata ? JSON.stringify(params.metadata) : null,
    ],
  );
}

// ── User Lookup ─────────────────────────────────────────────────────────────

export async function findUserByPhone(phone: string): Promise<{ id: string; phone: string } | null> {
  const result = await query(
    `SELECT id, phone FROM ${TABLES.USERS} WHERE phone = $1 LIMIT 1`,
    [phone],
  );
  return (result.rows[0] as { id: string; phone: string }) ?? null;
}

export async function hasWhatsAppConsent(userId: string): Promise<boolean> {
  const result = await query(
    `SELECT granted FROM consent_records
     WHERE user_id = $1 AND consent_type = 'whatsapp'
     ORDER BY created_at DESC LIMIT 1`,
    [userId],
  );
  if (result.rows.length === 0) return false;
  return (result.rows[0] as { granted: boolean }).granted;
}
