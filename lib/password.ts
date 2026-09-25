import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';

const options = { N: 16384, r: 8, p: 5, maxmem: 32 * 1024 * 1024 };
const derive = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => {
  scrypt(password, salt, 32, options, (error, result) => error ? reject(error) : resolve(result));
});
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const randomToken = () => randomBytes(32).toString('hex');
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt);
  return `scrypt:16384:8:5:${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password: string, stored: string) {
  const parts = stored.split(':');
  const valid = parts.length === 6 && parts.slice(0,4).join(':') === 'scrypt:16384:8:5' && /^[a-f0-9]{32}$/.test(parts[4]) && /^[a-f0-9]{64}$/.test(parts[5]);
  const key = await derive(password, valid ? parts[4] : '00000000000000000000000000000000');
  return valid && timingSafeEqual(key, Buffer.from(parts[5], 'hex'));
}
export function equalDigest(a: string, b: string) {
  if (!/^[a-f0-9]{64}$/.test(a) || !/^[a-f0-9]{64}$/.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
