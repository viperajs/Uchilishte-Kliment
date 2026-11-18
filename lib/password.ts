import { timingSafeEqual, createHash } from 'node:crypto';

// Passwords are kept by Supabase Auth; these hash the activation token and rate-limit keys.
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export function equalDigest(a: string, b: string) {
  if (!/^[a-f0-9]{64}$/.test(a) || !/^[a-f0-9]{64}$/.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
