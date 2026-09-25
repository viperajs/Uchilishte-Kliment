import { database } from './d1';
import { cookies } from 'next/headers';
import { digest, randomToken } from './password';

export const cookieName = 'school_admin_session';
export function authDb() {
  return database();
}
export type AdminAccount = { id: string; email: string; password_hash: string };
export async function getAdmin(): Promise<AdminAccount | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  try {
    return await authDb().prepare('SELECT a.id, a.email, a.password_hash FROM admin_sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=? AND s.expires>?').bind(digest(token), Date.now()).first<AdminAccount>();
  } catch { return null; }
}
export async function createSession(adminId: string) {
  const token = randomToken();
  const lifetime = 8 * 60 * 60;
  await authDb().batch([
    authDb().prepare('DELETE FROM admin_sessions WHERE expires<=?').bind(Date.now()),
    authDb().prepare('INSERT INTO admin_sessions (token_hash,admin_id,expires) VALUES (?,?,?)').bind(digest(token), adminId, Date.now() + lifetime * 1000),
  ]);
  (await cookies()).set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: lifetime });
}
export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token) await authDb().prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(digest(token)).run();
  jar.set(cookieName, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 });
}
export function trustedOrigin(req: Request) { return req.headers.get('origin') === new URL(req.url).origin; }
export async function allowAttempt(req: Request, action: string, email: string) {
  const now = Date.now(), windowStart = now - 15 * 60 * 1000;
  const ip = (req.headers.get('x-forwarded-for')?.split(',')[0].trim()||req.headers.get('x-real-ip')||'local');
  const keys = [action + ':ip:' + digest(ip), action + ':email:' + digest(email.toLowerCase())];
  const results = await authDb().batch(keys.map(key => authDb().prepare('INSERT INTO auth_limits (key,attempts,started) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN started<? THEN 1 ELSE attempts+1 END, started=CASE WHEN started<? THEN ? ELSE started END RETURNING attempts').bind(key,now,windowStart,windowStart,now)));
  await authDb().prepare('DELETE FROM auth_limits WHERE started<?').bind(now - 86400000).run();
  return results.every((r,i) => Number((r.results[0] as {attempts:number})?.attempts) <= (i === 0 ? 10 : 30));
}
export function authResponse(data: object, status = 200) { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } }); }
