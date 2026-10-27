const env = process.env;
import { z } from 'zod';
import { adminEmails, trustedOrigin, allowAttempt, signIn, authResponse } from '@/lib/auth';
import { digest, equalDigest } from '@/lib/password';
import { supabase } from '@/lib/supabase';
const setup = z.object({email:z.string().email().max(200).transform(s=>s.trim().toLowerCase()),password:z.string().min(12).max(128),token:z.string().regex(/^[a-f0-9]{64}$/)});
export async function POST(req:Request) {
  if (!trustedOrigin(req)) return authResponse({error:'Невалидна заявка.'},403);
  try {
    if (Number(req.headers.get('content-length')||0)>4096) return authResponse({error:'Невалидна заявка.'},413);
    const parsed=setup.safeParse(await req.json());
    if (!parsed.success) return authResponse({error:'Използвайте валиден имейл, парола от поне 12 знака и връзката за активиране.'},400);
    const {email,password,token}=parsed.data;
    if (!await allowAttempt(req,'setup',email)) return authResponse({error:'Твърде много опити. Опитайте след 15 минути.'},429);
    if (!env.ADMIN_SETUP_HASH || Number(env.ADMIN_SETUP_EXPIRES||0)<Date.now() || !equalDigest(digest(token),env.ADMIN_SETUP_HASH) || !adminEmails().includes(email)) return authResponse({error:'Връзката за активиране е невалидна или изтекла.'},403);
    // One-time: once any Supabase Auth account exists, activation is closed.
    const existing=await supabase().auth.admin.listUsers({page:1,perPage:1});
    if (existing.error) throw existing.error;
    if (existing.data.users.length) return authResponse({error:'Профилът вече е активиран. Използвайте входа с имейл и парола.'},409);
    const {error}=await supabase().auth.admin.createUser({email,password,email_confirm:true});
    if (error?.code==='email_exists') return authResponse({error:'Профилът вече е активиран.'},409);
    if (error?.code==='weak_password') return authResponse({error:'Паролата е твърде слаба. Изберете по-дълга и по-рядко срещана.'},400);
    if (error) throw error;
    if (!await signIn(email,password)) throw new Error('Sign-in after activation failed.');
    return authResponse({ok:true});
  } catch { return authResponse({error:'Активирането не е завършено. Опитайте отново.'},503); }
}
