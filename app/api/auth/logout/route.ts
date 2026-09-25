import { trustedOrigin, clearSession, authResponse } from '@/lib/auth';
export async function POST(req:Request) {
  if (!trustedOrigin(req)) return authResponse({error:'Невалидна заявка.'},403);
  try { await clearSession(); return authResponse({ok:true}); }
  catch { return authResponse({error:'Изходът не е завършен. Опитайте отново.'},503); }
}
