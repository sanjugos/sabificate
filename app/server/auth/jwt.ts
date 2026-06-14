import jwt from 'jsonwebtoken';
import { AUTH } from '../../contracts/shared/constants.js';
import type { UserRole } from '../../contracts/types/index.js';

export interface JwtPayload {
  user_id: string;
  email: string;
  role: UserRole;
  org_id: string | null;
  department_id: string | null;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

export function signAccessToken(claims: JwtPayload): string {
  return jwt.sign(claims, getSecret(), {
    expiresIn: AUTH.ACCESS_TOKEN_EXPIRY_SECONDS,
  });
}

export function signRefreshToken(claims: Pick<JwtPayload, 'user_id'>): string {
  return jwt.sign(claims, getSecret(), {
    expiresIn: AUTH.REFRESH_TOKEN_EXPIRY_SECONDS,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as JwtPayload;
}

export function verifyRefreshToken(token: string): { user_id: string } {
  return jwt.verify(token, getSecret()) as { user_id: string };
}
