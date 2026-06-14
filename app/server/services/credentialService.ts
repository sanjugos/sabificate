import { query } from '../db/index.js';
import { TABLES } from '../db/schema.js';
import { queues } from '../queue/index.js';
import { QUEUE_NAMES } from '../../contracts/shared/events.js';
import type { Credential, CredentialVerification } from '../../contracts/api/credentials.js';
import type { CredentialIssuedEvent } from '../../contracts/shared/events.js';

// ── Certificate number generation ─────────────────────────────────────────

function generateCertificateNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0');
  return `SAB-${yyyy}${mm}-${seq}`;
}

// ── Open Badges 3.0 builder ──────────────────────────────────────────────

interface CredentialTemplate {
  id: string;
  course_id: string;
  name: string;
  description: string | null;
  co_brand_org_id: string | null;
  co_brand_logo_url: string | null;
  co_brand_signatory: string | null;
  badge_image_url: string | null;
  criteria_narrative: string | null;
}

interface UserInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface CourseInfo {
  id: string;
  title: string;
  slug: string;
  description: string | null;
}

function buildOpenBadge(
  template: CredentialTemplate,
  user: UserInfo,
  course: CourseInfo,
  evidence: string[],
  certificateNumber: string,
  verificationUrl: string,
): object {
  const issuanceDate = new Date().toISOString();

  const credential: Record<string, unknown> = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    id: verificationUrl,
    name: template.name,
    description: template.description ?? `Credential for completing ${course.title}`,
    issuer: {
      type: 'Profile',
      id: 'https://sabificate.com',
      name: 'SABIficate',
      url: 'https://sabificate.com',
    },
    issuanceDate,
    credentialSubject: {
      type: 'AchievementSubject',
      id: `urn:uuid:${user.id}`,
      name: `${user.first_name} ${user.last_name}`,
      achievement: {
        type: 'Achievement',
        id: `urn:course:${course.id}`,
        name: course.title,
        description: course.description ?? course.title,
        criteria: {
          narrative: template.criteria_narrative ?? `Completed all lessons and assessments in ${course.title}`,
        },
        ...(template.badge_image_url ? { image: { id: template.badge_image_url, type: 'Image' } } : {}),
      },
    },
    evidence: evidence.map((url, i) => ({
      type: 'Evidence',
      id: url,
      name: `Evidence ${i + 1}`,
    })),
    credentialStatus: {
      type: 'StatusList2021Entry',
      id: `${verificationUrl}#status`,
    },
    certificateNumber,
  };

  // Co-branding fields
  if (template.co_brand_org_id) {
    credential.coBranding = {
      organizationId: template.co_brand_org_id,
      logoUrl: template.co_brand_logo_url,
      signatory: template.co_brand_signatory,
    };
  }

  return credential;
}

// ── Public API ────────────────────────────────────────────────────────────

const BASE_URL = process.env.APP_BASE_URL ?? 'https://sabificate.com';

export async function issueCredential(
  userId: string,
  courseId: string,
  evidenceUrls: string[] = [],
): Promise<Credential> {
  // Look up user
  const userResult = await query(
    `SELECT id, first_name, last_name, email FROM ${TABLES.USERS} WHERE id = $1`,
    [userId],
  );
  const user = userResult.rows[0] as UserInfo | undefined;
  if (!user) throw new Error(`User not found: ${userId}`);

  // Look up course
  const courseResult = await query(
    `SELECT id, title, slug, description FROM ${TABLES.COURSES} WHERE id = $1`,
    [courseId],
  );
  const course = courseResult.rows[0] as CourseInfo | undefined;
  if (!course) throw new Error(`Course not found: ${courseId}`);

  // Look up template (or use defaults)
  const templateResult = await query(
    `SELECT * FROM ${TABLES.CREDENTIAL_TEMPLATES} WHERE course_id = $1 LIMIT 1`,
    [courseId],
  );
  const template: CredentialTemplate = templateResult.rows[0]
    ? (templateResult.rows[0] as CredentialTemplate)
    : {
        id: 'default',
        course_id: courseId,
        name: `${course.title} Completion Certificate`,
        description: `Awarded for completing ${course.title}`,
        co_brand_org_id: null,
        co_brand_logo_url: null,
        co_brand_signatory: null,
        badge_image_url: null,
        criteria_narrative: null,
      };

  // Check for existing credential (idempotency)
  const existing = await query(
    `SELECT id FROM ${TABLES.ISSUED_CREDENTIALS} WHERE user_id = $1 AND course_id = $2`,
    [userId, courseId],
  );
  if (existing.rows.length > 0) {
    // Return existing credential
    return fetchCredentialById(existing.rows[0].id as string);
  }

  // Generate identifiers
  const certificateNumber = generateCertificateNumber();
  const credentialId = crypto.randomUUID();
  const verificationUrl = `${BASE_URL}/verify/${credentialId}`;
  const qrCodeUrl = verificationUrl; // QR code will encode this URL

  // Build Open Badge JSON-LD
  const credentialJson = buildOpenBadge(
    template,
    user,
    course,
    evidenceUrls,
    certificateNumber,
    verificationUrl,
  );

  // Store in database
  await query(
    `INSERT INTO ${TABLES.ISSUED_CREDENTIALS}
       (id, template_id, user_id, course_id, certificate_number, credential_json,
        verification_url, qr_code_url, status, evidence_urls, issued_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, NOW())`,
    [
      credentialId,
      template.id === 'default' ? null : template.id,
      userId,
      courseId,
      certificateNumber,
      JSON.stringify(credentialJson),
      verificationUrl,
      qrCodeUrl,
      JSON.stringify(evidenceUrls),
    ],
  );

  // Emit CREDENTIAL_ISSUED event
  const event: CredentialIssuedEvent = {
    user_id: userId,
    credential_id: credentialId,
    course_title: course.title,
  };

  await queues[QUEUE_NAMES.CREDENTIAL_ISSUED].add(
    'credential.issued',
    event,
    { jobId: `cred-${credentialId}` },
  );

  return fetchCredentialById(credentialId);
}

export async function verifyCredential(
  credentialId: string,
): Promise<CredentialVerification> {
  const result = await query(
    `SELECT ic.*, c.title AS course_title, u.first_name, u.last_name
     FROM ${TABLES.ISSUED_CREDENTIALS} ic
     JOIN ${TABLES.COURSES} c ON c.id = ic.course_id
     JOIN ${TABLES.USERS} u ON u.id = ic.user_id
     WHERE ic.id = $1`,
    [credentialId],
  );

  const row = result.rows[0] as Record<string, unknown> | undefined;

  if (!row) {
    return {
      valid: false,
      credential: null,
      learner_name: '',
      course_title: '',
      issued_at: '',
      evidence_urls: [],
    };
  }

  const isActive = row.status === 'active';
  const isNotExpired =
    !row.expires_at || new Date(row.expires_at as string) > new Date();

  return {
    valid: isActive && isNotExpired,
    credential: mapCredentialRow(row),
    learner_name: `${row.first_name} ${row.last_name}`,
    course_title: row.course_title as string,
    issued_at: (row.issued_at as Date).toISOString(),
    evidence_urls: (row.evidence_urls as string[]) ?? [],
  };
}

export async function revokeCredential(
  credentialId: string,
  reason: string,
): Promise<void> {
  const result = await query(
    `UPDATE ${TABLES.ISSUED_CREDENTIALS}
     SET status = 'revoked', revoked_at = NOW()
     WHERE id = $1 AND status = 'active'
     RETURNING id`,
    [credentialId],
  );

  if (result.rows.length === 0) {
    throw new Error(`Credential not found or already revoked: ${credentialId}`);
  }

  // Log revocation reason (store in credential_json metadata)
  await query(
    `UPDATE ${TABLES.ISSUED_CREDENTIALS}
     SET credential_json = jsonb_set(
       credential_json::jsonb,
       '{revocationReason}',
       $2::jsonb
     )
     WHERE id = $1`,
    [credentialId, JSON.stringify(reason)],
  );
}

export async function listUserCredentials(
  userId: string,
): Promise<Credential[]> {
  const result = await query(
    `SELECT ic.*, c.title AS course_title,
            ct.co_brand_org_id, ct.co_brand_logo_url, ct.co_brand_signatory
     FROM ${TABLES.ISSUED_CREDENTIALS} ic
     JOIN ${TABLES.COURSES} c ON c.id = ic.course_id
     LEFT JOIN ${TABLES.CREDENTIAL_TEMPLATES} ct ON ct.id = ic.template_id
     WHERE ic.user_id = $1
     ORDER BY ic.issued_at DESC`,
    [userId],
  );

  return result.rows.map((row) => mapCredentialRow(row as Record<string, unknown>));
}

export async function getCredentialById(
  credentialId: string,
  userId: string,
): Promise<Credential | null> {
  const result = await query(
    `SELECT ic.*, c.title AS course_title,
            ct.co_brand_org_id, ct.co_brand_logo_url, ct.co_brand_signatory
     FROM ${TABLES.ISSUED_CREDENTIALS} ic
     JOIN ${TABLES.COURSES} c ON c.id = ic.course_id
     LEFT JOIN ${TABLES.CREDENTIAL_TEMPLATES} ct ON ct.id = ic.template_id
     WHERE ic.id = $1 AND ic.user_id = $2`,
    [credentialId, userId],
  );

  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;

  return mapCredentialRow(row);
}

// ── Internal helpers ──────────────────────────────────────────────────────

async function fetchCredentialById(credentialId: string): Promise<Credential> {
  const result = await query(
    `SELECT ic.*, c.title AS course_title,
            ct.co_brand_org_id, ct.co_brand_logo_url, ct.co_brand_signatory
     FROM ${TABLES.ISSUED_CREDENTIALS} ic
     JOIN ${TABLES.COURSES} c ON c.id = ic.course_id
     LEFT JOIN ${TABLES.CREDENTIAL_TEMPLATES} ct ON ct.id = ic.template_id
     WHERE ic.id = $1`,
    [credentialId],
  );

  const row = result.rows[0] as Record<string, unknown>;
  if (!row) throw new Error(`Credential not found: ${credentialId}`);

  return mapCredentialRow(row);
}

function mapCredentialRow(row: Record<string, unknown>): Credential {
  return {
    id: row.id as string,
    certificate_number: row.certificate_number as string,
    user_id: row.user_id as string,
    course_id: row.course_id as string,
    course_title: row.course_title as string,
    credential_json: (row.credential_json ?? {}) as object,
    verification_url: row.verification_url as string,
    qr_code_url: (row.qr_code_url ?? row.verification_url) as string,
    status: row.status as Credential['status'],
    co_brand_org_id: (row.co_brand_org_id as string) ?? null,
    co_brand_logo_url: (row.co_brand_logo_url as string) ?? null,
    co_brand_signatory: (row.co_brand_signatory as string) ?? null,
    issued_at: row.issued_at instanceof Date
      ? row.issued_at.toISOString()
      : (row.issued_at as string),
    expires_at: row.expires_at
      ? row.expires_at instanceof Date
        ? row.expires_at.toISOString()
        : (row.expires_at as string)
      : null,
  };
}
