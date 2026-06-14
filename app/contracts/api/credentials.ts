import type { CredentialStatus } from '../types';

export interface IssueCredentialRequest {
  user_id: string;
  course_id: string;
  evidence_urls?: string[];
}

export interface Credential {
  id: string;
  certificate_number: string;
  user_id: string;
  course_id: string;
  course_title: string;
  credential_json: object;
  verification_url: string;
  qr_code_url: string;
  status: CredentialStatus;
  co_brand_org_id: string | null;
  co_brand_logo_url: string | null;
  co_brand_signatory: string | null;
  issued_at: string;
  expires_at: string | null;
}

export interface CredentialVerification {
  valid: boolean;
  credential: Credential | null;
  learner_name: string;
  course_title: string;
  issued_at: string;
  evidence_urls: string[];
}
