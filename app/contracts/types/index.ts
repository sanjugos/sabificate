export type DifficultyTier = 'foundational' | 'working' | 'applied';
export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
export type UserRole = 'learner' | 'corporate_admin' | 'platform_admin';
export type DataSaverMode = 'full' | 'data_saver' | 'ultra_light';
export type EnrollmentStatus = 'active' | 'completed' | 'suspended' | 'expired';
export type LessonStatus = 'not_started' | 'in_progress' | 'completed';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'expired';
export type PaymentMethod = 'card' | 'bank_transfer' | 'ussd';
export type CredentialStatus = 'active' | 'revoked' | 'expired';
export type ConsentTier = 'education_only' | 'anonymized_aggregate' | 'full_profile';
export type ProfessionalBody = 'CIBN' | 'ICAN' | 'CITN' | 'CIPM' | null;
export type CustomerTier = 'freemium' | 'hiring' | 'upskilling' | 'premium';
export type TierTreatment = 'A' | 'B' | 'C';
export type CredentialType = 'completion_badge' | 'verified_certificate' | 'team_record' | 'professional_certificate';
export type AuthoringStatus = 'draft' | 'intake' | 'decomposition' | 'briefing' | 'generation' | 'review' | 'published';

export interface DepthDimensions {
  prior_knowledge: 'foundational' | 'basics_assumed' | 'fluent';
  abstraction: 'concrete' | 'mixed' | 'principle_first';
  pacing: 'one_concept' | 'two_three' | 'larger_leaps';
  scaffolding: 'template' | 'self_solve' | 'open_problem';
  depth_of_why: 'mechanism' | 'one_caveat' | 'tradeoffs';
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  details?: Record<string, string[]>;
}
