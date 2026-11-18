// Supabase is the only backend: Postgres for content and messages, Auth for the administrator, Storage for uploads.
// Used on the server only; the browser talks to Supabase solely through signed upload URLs.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions, type GetAllCookies, type SetAllCookies } from '@supabase/ssr';
import { cookies } from 'next/headers';

// The second name of each pair is what the Vercel ↔ Supabase integration sets for older projects.
const names = { url: ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'], publishable: ['SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY'], secret: ['SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY'] };
const read = (key: keyof typeof names) => names[key].map(n => process.env[n]).find(Boolean);
const env = (key: keyof typeof names) => { const value = read(key); if (!value) throw new Error(names[key][0] + ' is not set.'); return value; };
export const hasSupabase = () => Boolean(read('url') && read('publishable'));
// A request that hangs is given up after 10 s, so public pages fall back to the built-in content instead of waiting.
// It fails as an AbortError because supabase-js retries reads that time out, but not ones that were aborted.
const timedFetch: typeof fetch = async (input, init) => {
  const timeout = AbortSignal.timeout(10_000);
  try { return await fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout }); }
  catch (e) { throw timeout.aborted ? new DOMException('Supabase did not answer within 10 s.', 'AbortError') : e; }
};

// The admin session never needs to be read by page scripts, so its cookies are HttpOnly and SameSite=Strict.
const sessionCookie: CookieOptions = { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' };
// @supabase/ssr always writes them for 400 days; here they expire 8 hours after the last token refresh (hourly while in use).
const sessionMaxAge = 8 * 60 * 60;
export const sessionClient = ({ getAll, setAll }: { getAll: GetAllCookies; setAll: SetAllCookies }) => createServerClient(env('url'), env('publishable'), {
  cookieOptions: sessionCookie,
  global: { fetch: timedFetch },
  cookies: { getAll, setAll: (list, headers) => setAll(list.map(c => c.options.maxAge ? { ...c, options: { ...c.options, maxAge: sessionMaxAge } } : c), headers) },
});

let admin: SupabaseClient | undefined;
// Full access with the secret key. RLS keeps the public keys out of every table, so all data goes through here.
export function supabase() {
  return admin ??= createClient(env('url'), env('secret'), { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: timedFetch } });
}

// The signed-in administrator's Supabase Auth session, kept in cookies.
export async function supabaseSession() {
  const jar = await cookies();
  return sessionClient({
    getAll: () => jar.getAll(),
    // Server Components cannot set cookies; proxy.ts refreshes the session before they run.
    setAll: list => { try { list.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch {} },
  });
}

export const uploadsBucket = 'uploads';
