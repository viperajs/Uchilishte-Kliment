import { z } from 'zod';
import { adminEmails, trustedOrigin, allowAttempt, signIn, authResponse } from '@/lib/auth';
const credentials = z.object({ email: z.string().email().max(200).transform(s => s.trim().toLowerCase()), password: z.string().min(1).max(128) });
export async function POST(req: Request) {
  if (!trustedOrigin(req)) return authResponse({error:'Невалидна заявка.'},403);
  try {
    if (Number(req.headers.get('content-length') || 0) > 4096) return authResponse({error:'Невалидна заявка.'},413);
    const parsed = credentials.safeParse(await req.json());
    if (!parsed.success) return authResponse({error:'Проверете имейла и паролата.'},400);
    const {email,password} = parsed.data;
    if (!await allowAttempt(req,'login',email)) return authResponse({error:'Твърде много опити. Опитайте след 15 минути.'},429);
    if (!adminEmails().includes(email) || !await signIn(email, password)) return authResponse({error:'Невалиден имейл или парола.'},401);
    return authResponse({ok:true});
  } catch { return authResponse({error:'Входът временно не е достъпен. Опитайте отново.'},503); }
}
