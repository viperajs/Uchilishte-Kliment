const env = process.env;
import { z } from 'zod';
import { authDb, trustedOrigin, allowAttempt, createSession, authResponse } from '@/lib/auth';
import { digest, equalDigest, hashPassword } from '@/lib/password';
const setup = z.object({email:z.string().email().max(200).transform(s=>s.trim().toLowerCase()),password:z.string().min(12).max(128),token:z.string().regex(/^[a-f0-9]{64}$/)});
export async function POST(req:Request) {
  if (!trustedOrigin(req)) return authResponse({error:'Невалидна заявка.'},403);
  try {
    if (Number(req.headers.get('content-length')||0)>4096) return authResponse({error:'Невалидна заявка.'},413);
    const parsed=setup.safeParse(await req.json());
    if (!parsed.success) return authResponse({error:'Използвайте валиден имейл, парола от поне 12 знака и връзката за активиране.'},400);
    const {email,password,token}=parsed.data;
    if (!await allowAttempt(req,'setup',email)) return authResponse({error:'Твърде много опити. Опитайте след 15 минути.'},429);
    const allowed=(env.ADMIN_EMAILS||'').toLowerCase().split(',').map(s=>s.trim());
    if (!env.ADMIN_SETUP_HASH || Number(env.ADMIN_SETUP_EXPIRES||0)<Date.now() || !equalDigest(digest(token),env.ADMIN_SETUP_HASH) || !allowed.includes(email)) return authResponse({error:'Връзката за активиране е невалидна или изтекла.'},403);
    const existing=await authDb().prepare('SELECT id FROM admins WHERE id=?').bind('school-admin').first();
    if (existing) return authResponse({error:'Профилът вече е активиран. Използвайте входа с имейл и парола.'},409);
    const hash=await hashPassword(password);
    const created=await authDb().prepare('INSERT OR IGNORE INTO admins (id,email,password_hash,created) VALUES (?,?,?,?)').bind('school-admin',email,hash,Date.now()).run();
    if (!created.meta.changes) return authResponse({error:'Профилът вече е активиран.'},409);
    await createSession('school-admin');
    return authResponse({ok:true});
  } catch { return authResponse({error:'Активирането не е завършено. Опитайте отново.'},503); }
}
