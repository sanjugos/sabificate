export type DifficultyTier = 'beginner' | 'intermediate' | 'advanced';
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
