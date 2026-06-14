import { query } from '../db/index.js';

const CONSENT_TYPES = [
  'education_only',
  'anonymized_aggregate',
  'full_profile',
  'whatsapp',
  'sms',
] as const;

type ConsentType = (typeof CONSENT_TYPES)[number];

export interface RecordConsentParams {
  user_id: string;
  consents: Partial<Record<ConsentType, boolean>>;
  ip_address?: string;
  user_agent?: string;
}

export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  granted: boolean;
  version: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export async function recordConsent(params: RecordConsentParams): Promise<void> {
  const { user_id, consents, ip_address, user_agent } = params;

  const entries = Object.entries(consents) as [ConsentType, boolean][];

  if (entries.length === 0) {
    return;
  }

  // Build a multi-row INSERT to avoid N round-trips
  const values: unknown[] = [];
  const placeholders: string[] = [];
  let paramIndex = 1;

  for (const [consentType, granted] of entries) {
    placeholders.push(
      `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`,
    );
    values.push(user_id, consentType, granted, ip_address ?? null, user_agent ?? null);
  }

  const sql = `
    INSERT INTO consent_records (user_id, consent_type, granted, ip_address, user_agent)
    VALUES ${placeholders.join(', ')}
  `;

  await query(sql, values);
}

export async function getConsent(userId: string): Promise<ConsentRecord[]> {
  const result = await query(
    `SELECT id, user_id, consent_type, granted, version, ip_address, user_agent, created_at
     FROM consent_records
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  );

  return result.rows as ConsentRecord[];
}
