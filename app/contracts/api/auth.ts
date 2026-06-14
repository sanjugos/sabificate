import type { UserRole, DataSaverMode } from '../types';

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  invitation_token?: string;
  consent: {
    education_only: boolean;
    anonymized_aggregate: boolean;
    full_profile: boolean;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  org_id: string | null;
  department_id: string | null;
  language_preference: 'en';
  data_saver_mode: DataSaverMode;
}

export interface RefreshResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}
