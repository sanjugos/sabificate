import bcrypt from 'bcryptjs';
import { AUTH } from '../../contracts/shared/constants.js';

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(AUTH.BCRYPT_COST_FACTOR);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
