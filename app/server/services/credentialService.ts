import { query } from '../db/index.js';
import { TABLES } from '../db/schema.js';
import { queues } from '../queue/index.js';
import { QUEUE_NAMES } from '../../contracts/shared/events.js';
import type { Credential, CredentialVerification } from '../../contracts/api/credentials.js';
import type { CredentialIssuedEvent } from '../../contracts/shared/events.js';
import type { CredentialType } from '../../contracts/types/index.js';
import { computeCourseAssessmentScore } from './progressService.js';

// ── Certificate number generation ─────────────────────────────────────────

function generateCertificateNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0');
  return `SAB-${yyyy}${mm}-${seq}`;
}

// ── Open Badges 3.0 builder ──────────────────────────────────────────────

interface CredentialTemplateRow {
  id: string;
  course_id: string;
  name: string;
  description: string | null;
  co_brand_org_id: string | null;
  co_brand_logo_url: string | null;
  co_brand_signatory: string | null;
  badge_image_url: string | null;
  criteria_narrative: string | null;
  credential_tier: CredentialType;
  minimum_score: number;
  price_ngn: number;
  cpd_eligible: boolean;
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
  cpd_hours: number | null;
  professional_body: string | null;
}

function buildOpenBadge(
  template: CredentialTemplateRow,
  user: UserInfo,
  course: CourseInfo,
  evidence: string[],
  certificateNumber: string,
  verificationUrl: string,
  credentialTier: CredentialType,
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
    credentialTier,
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

// ── Tier eligibility checks ──────────────────────────────────────────────

async function checkAllLessonsCompleted(userId: string, courseId: string): Promise<boolean> {
  const totalResult = await query(
    `SELECT COUNT(*)::int AS total FROM lessons WHERE course_id = $1 AND is_published = true`,
    [courseId],
  );
  const completedResult = await query(
    `SELECT COUNT(*)::int AS completed FROM learner_progress
     WHERE user_id = $1 AND course_id = $2 AND status = 'completed'`,
    [userId, courseId],
  );

  const total = totalResult.rows[0]?.total ?? 0;
  const completed = completedResult.rows[0]?.completed ?? 0;

  return total > 0 && completed >= total;
}

async function checkActiveSubscription(userId: string): Promise<boolean> {
  const result = await query(
    `SELECT id FROM ${TABLES.SUBSCRIPTIONS}
     WHERE user_id = $1 AND status = 'active'
     LIMIT 1`,
    [userId],
  );
  return result.rows.length > 0;
}

async function checkCredentialPurchase(userId: string, courseId: string): Promise<boolean> {
  const result = await query(
    `SELECT cp.id FROM ${TABLES.CREDENTIAL_PURCHASES} cp
     WHERE cp.user_id = $1 AND cp.status = 'paid'
       AND cp.credential_template_id IN (
         SELECT id FROM ${TABLES.CREDENTIAL_TEMPLATES}
         WHERE course_id = $2 AND credential_tier = 'verified_certificate'
       )
     LIMIT 1`,
    [userId, courseId],
  );
  return result.rows.length > 0;
}

async function getEnrollmentType(userId: string, courseId: string): Promise<string | null> {
  const result = await query(
    `SELECT enrollment_type FROM ${TABLES.ENROLLMENT}
     WHERE user_id = $1 AND course_id = $2
     LIMIT 1`,
    [userId, courseId],
  );
  return result.rows[0]?.enrollment_type ?? null;
}

async function getOrgName(userId: string): Promise<string | null> {
  const result = await query(
    `SELECT o.name FROM ${TABLES.ORGANIZATIONS} o
     JOIN ${TABLES.USERS} u ON u.org_id = o.id
     WHERE u.id = $1`,
    [userId],
  );
  return result.rows[0]?.name ?? null;
}

// ── Public API ────────────────────────────────────────────────────────────

const BASE_URL = process.env.APP_BASE_URL ?? 'https://sabificate.com';

export async function issueCredential(
  userId: string,
  courseId: string,
  credentialTier: CredentialType = 'completion_badge',
  evidenceUrls: string[] = [],
): Promise<Credential> {
  // Look up user
  const userResult = await query(
    `SELECT id, first_name, last_name, email FROM ${TABLES.USERS} WHERE id = $1`,
    [userId],
  );
  const user = userResult.rows[0] as UserInfo | undefined;
  if (!user) throw new Error(`User not found: ${userId}`);

  // Look up course (including cpd_hours and professional_body)
  const courseResult = await query(
    `SELECT id, title, slug, description, cpd_hours, professional_body
     FROM ${TABLES.COURSES} WHERE id = $1`,
    [courseId],
  );
  const course = courseResult.rows[0] as CourseInfo | undefined;
  if (!course) throw new Error(`Course not found: ${courseId}`);

  // Look up template for the requested tier
  const templateResult = await query(
    `SELECT * FROM ${TABLES.CREDENTIAL_TEMPLATES}
     WHERE course_id = $1 AND credential_tier = $2
     LIMIT 1`,
    [courseId, credentialTier],
  );

  // Fallback: any template for the course, then a synthetic default
  let template: CredentialTemplateRow;
  if (templateResult.rows.length > 0) {
    template = templateResult.rows[0] as CredentialTemplateRow;
  } else {
    const anyTemplate = await query(
      `SELECT * FROM ${TABLES.CREDENTIAL_TEMPLATES} WHERE course_id = $1 LIMIT 1`,
      [courseId],
    );
    if (anyTemplate.rows.length > 0) {
      template = anyTemplate.rows[0] as CredentialTemplateRow;
    } else {
      template = {
        id: 'default',
        course_id: courseId,
        name: `${course.title} Completion Badge`,
        description: `Awarded for completing ${course.title}`,
        co_brand_org_id: null,
        co_brand_logo_url: null,
        co_brand_signatory: null,
        badge_image_url: null,
        criteria_narrative: null,
        credential_tier: 'completion_badge',
        minimum_score: 0,
        price_ngn: 0,
        cpd_eligible: false,
      };
    }
  }

  // ── Gate checks per tier ───────────────────────────────────────────────

  // All tiers require course completion
  const allCompleted = await checkAllLessonsCompleted(userId, courseId);
  if (!allCompleted) {
    throw Object.assign(new Error('All lessons must be completed before issuing a credential'), {
      statusCode: 400,
    });
  }

  // Compute assessment score (used by verified_certificate and professional_certificate)
  const assessmentScore = await computeCourseAssessmentScore(userId, courseId);

  if (credentialTier === 'verified_certificate' || credentialTier === 'professional_certificate') {
    const minScore = template.minimum_score || 70;
    if (assessmentScore === null || assessmentScore < minScore) {
      throw Object.assign(
        new Error(`Assessment score must be at least ${minScore}%. Current: ${assessmentScore ?? 'none'}`),
        { statusCode: 400 },
      );
    }

    // Payment gate: active subscription OR credential purchase
    const hasSubscription = await checkActiveSubscription(userId);
    const hasPurchase = await checkCredentialPurchase(userId, courseId);
    if (!hasSubscription && !hasPurchase) {
      throw Object.assign(
        new Error('Active subscription or credential purchase required for verified certificate'),
        { statusCode: 402 },
      );
    }
  }

  if (credentialTier === 'team_record') {
    const enrollmentType = await getEnrollmentType(userId, courseId);
    if (enrollmentType !== 'corporate') {
      throw Object.assign(
        new Error('Team record credentials require corporate enrollment'),
        { statusCode: 400 },
      );
    }
  }

  if (credentialTier === 'professional_certificate') {
    if (!course.professional_body) {
      throw Object.assign(
        new Error('Course is not associated with a professional body'),
        { statusCode: 400 },
      );
    }
    // TODO: Manual verification step for professional certificates
    // For now, we allow issuance if the course has a professional_body and score gate passes
  }

  // Check for existing credential of the same tier (idempotency)
  const existing = await query(
    `SELECT id FROM ${TABLES.ISSUED_CREDENTIALS}
     WHERE user_id = $1 AND course_id = $2 AND credential_tier = $3`,
    [userId, courseId, credentialTier],
  );
  if (existing.rows.length > 0) {
    return fetchCredentialById(existing.rows[0].id as string);
  }

  // Determine CPD hours to award
  const cpdHoursAwarded = template.cpd_eligible && course.cpd_hours
    ? Number(course.cpd_hours)
    : null;

  // Generate identifiers
  const certificateNumber = generateCertificateNumber();
  const credentialId = crypto.randomUUID();
  const verificationUrl = `${BASE_URL}/verify/${credentialId}`;
  const qrCodeUrl = verificationUrl;

  // Build Open Badge JSON-LD
  const credentialJson = buildOpenBadge(
    template,
    user,
    course,
    evidenceUrls,
    certificateNumber,
    verificationUrl,
    credentialTier,
  );

  // Add org name for team_record
  if (credentialTier === 'team_record') {
    const orgName = await getOrgName(userId);
    if (orgName) {
      (credentialJson as Record<string, unknown>).organizationName = orgName;
    }
  }

  // Store in database
  await query(
    `INSERT INTO ${TABLES.ISSUED_CREDENTIALS}
       (id, template_id, user_id, course_id, certificate_number, credential_json,
        verification_url, qr_code_url, status, credential_tier, assessment_score,
        cpd_hours_awarded, evidence_urls, issued_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10, $11, $12, NOW())`,
    [
      credentialId,
      template.id === 'default' ? null : template.id,
      userId,
      courseId,
      certificateNumber,
      JSON.stringify(credentialJson),
      verificationUrl,
      qrCodeUrl,
      credentialTier,
      assessmentScore,
      cpdHoursAwarded,
      JSON.stringify(evidenceUrls),
    ],
  );

  // If CPD-eligible, log CPD credits
  if (cpdHoursAwarded && course.professional_body) {
    const currentYear = new Date().getFullYear();
    await query(
      `INSERT INTO ${TABLES.CPD_CREDIT_LOG}
         (user_id, course_id, credential_id, professional_body, credit_hours, period_year)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, courseId, credentialId, course.professional_body, cpdHoursAwarded, currentYear],
    );
  }

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

// ── CPD summary ──────────────────────────────────────────────────────────

export async function getCpdSummary(
  userId: string,
  professionalBody: string,
  year: number,
): Promise<{
  professional_body: string;
  period_year: number;
  total_hours: number;
  required_hours: number;
  remaining_hours: number;
  courses: { course_id: string; course_title: string; credit_hours: number; logged_at: string }[];
}> {
  const result = await query(
    `SELECT cl.course_id, c.title AS course_title, cl.credit_hours, cl.logged_at
     FROM ${TABLES.CPD_CREDIT_LOG} cl
     JOIN ${TABLES.COURSES} c ON c.id = cl.course_id
     WHERE cl.user_id = $1 AND cl.professional_body = $2 AND cl.period_year = $3
     ORDER BY cl.logged_at DESC`,
    [userId, professionalBody, year],
  );

  const courses = result.rows.map((r) => ({
    course_id: r.course_id as string,
    course_title: r.course_title as string,
    credit_hours: Number(r.credit_hours),
    logged_at: r.logged_at instanceof Date ? r.logged_at.toISOString() : (r.logged_at as string),
  }));

  const totalHours = courses.reduce((sum, c) => sum + c.credit_hours, 0);
  const requiredHours = 40; // Standard CPD requirement

  return {
    professional_body: professionalBody,
    period_year: year,
    total_hours: totalHours,
    required_hours: requiredHours,
    remaining_hours: Math.max(0, requiredHours - totalHours),
    courses,
  };
}

// ── Credential detail for PDF/export ─────────────────────────────────────

export async function getCredentialDetail(
  credentialId: string,
  userId: string,
): Promise<{
  certificate_number: string;
  learner_name: string;
  course_title: string;
  credential_tier: string;
  issued_at: string;
  cpd_hours: number | null;
  assessment_score: number | null;
  professional_body: string | null;
  verification_url: string;
} | null> {
  const result = await query(
    `SELECT ic.certificate_number, ic.verification_url, ic.credential_tier,
            ic.assessment_score, ic.cpd_hours_awarded, ic.issued_at,
            u.first_name, u.last_name,
            c.title AS course_title, c.professional_body
     FROM ${TABLES.ISSUED_CREDENTIALS} ic
     JOIN ${TABLES.USERS} u ON u.id = ic.user_id
     JOIN ${TABLES.COURSES} c ON c.id = ic.course_id
     WHERE ic.id = $1 AND ic.user_id = $2`,
    [credentialId, userId],
  );

  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;

  return {
    certificate_number: row.certificate_number as string,
    learner_name: `${row.first_name} ${row.last_name}`,
    course_title: row.course_title as string,
    credential_tier: (row.credential_tier as string) ?? 'completion_badge',
    issued_at: row.issued_at instanceof Date ? row.issued_at.toISOString() : (row.issued_at as string),
    cpd_hours: row.cpd_hours_awarded ? Number(row.cpd_hours_awarded) : null,
    assessment_score: row.assessment_score ? Number(row.assessment_score) : null,
    professional_body: (row.professional_body as string) ?? null,
    verification_url: row.verification_url as string,
  };
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
    credential_tier: (row.credential_tier as Credential['credential_tier']) ?? null,
    assessment_score: row.assessment_score != null ? Number(row.assessment_score) : null,
    cpd_hours_awarded: row.cpd_hours_awarded != null ? Number(row.cpd_hours_awarded) : null,
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
