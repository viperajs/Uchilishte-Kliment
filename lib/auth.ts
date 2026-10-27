import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase, supabaseSession } from './supabase';
import { digest } from './password';

// Accounts live in Supabase Auth (sign-ups disabled); only the addresses in ADMIN_EMAILS may administer the site.
export const adminEmails = () => (process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
export type AdminAccount = { id: string; email: string };
// A session ends 8 hours after sign-in, however often it is refreshed: the token's amr claim keeps the sign-in time.
const sessionLifetime = 8 * 60 * 60 * 1000;
// getUser() asks Supabase Auth, so a signed-out or revoked session stops working at once.
export async function getAdmin(): Promise<AdminAccount | null> {
  try {
    const { auth } = await supabaseSession();
    const { data: { user } } = await auth.getUser();
    const email = user?.email?.toLowerCase();
    if (!user || !email || !adminEmails().includes(email)) return null;
    const { data } = await auth.mfa.getAuthenticatorAssuranceLevel();
    const signedIn = Math.max(0, ...(data?.currentAuthenticationMethods ?? []).map(m => typeof m === 'string' ? 0 : m.timestamp * 1000));
    return Date.now() - signedIn < sessionLifetime ? { id: user.id, email } : null;
  } catch { return null; }
}
// Signs in on the session cookies. False for a wrong email or password; other failures throw.
export async function signIn(email: string, password: string, session?: SupabaseClient) {
  const { error } = await (session ?? await supabaseSession()).auth.signInWithPassword({ email, password });
  if (error?.code === 'invalid_credentials') return false;
  if (error) throw error;
  return true;
}
export function trustedOrigin(req: Request) { return req.headers.get('origin') === new URL(req.url).origin; }
export async function allowAttempt(req: Request, action: string, email: string) {
  const now = Date.now();
  const ip = (req.headers.get('x-forwarded-for')?.split(',')[0].trim()||req.headers.get('x-real-ip')||'local');
  const keys = [action + ':ip:' + digest(ip), action + ':email:' + digest(email.toLowerCase())];
  const attempts = await Promise.all(keys.map(async key => {
    const { data, error } = await supabase().rpc('auth_attempt', { attempt_key: key, now_ms: now });
    if (error) throw error;
    return Number(data);
  }));
  return attempts[0] <= 10 && attempts[1] <= 30;
}
export function authResponse(data: object, status = 200) { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } }); }
