import { NextResponse, type NextRequest } from 'next/server';
import { hasSupabase, sessionClient } from '@/lib/supabase';

// Refreshes the administrator's Supabase session before the admin pages and APIs run: Server Components cannot
// set cookies, and a refresh token that was already used must not be sent again.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!hasSupabase() || !request.cookies.getAll().some(c => c.name.startsWith('sb-'))) return response;
  const supabase = sessionClient({
    getAll: () => request.cookies.getAll(),
    setAll: (list, headers) => {
      list.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
    },
  });
  try { await supabase.auth.getClaims(); } catch {}
  return response;
}

export const config = { matcher: ['/admin/:path*', '/api/auth/:path*', '/api/content', '/api/contact', '/api/upload'] };
