import { z } from 'zod';
import { authDb, getAdmin, trustedOrigin, allowAttempt, createSession, authResponse } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/password';
const input=z.object({currentPassword:z.string().min(1).max(128),password:z.string().min(12).max(128)});
export async function POST(req:Request) {
  if(!trustedOrigin(req)) return authResponse({error:'Невалидна заявка.'},403);
  const user=await getAdmin();
  if(!user) return authResponse({error:'Влезте отново в профила си.'},401);
  try {
    const parsed=input.safeParse(await req.json());
    if(!parsed.success) return authResponse({error:'Новата парола трябва да е между 12 и 128 знака.'},400);
    if(!await allowAttempt(req,'password',user.email)) return authResponse({error:'Твърде много опити. Опитайте след 15 минути.'},429);
    if(!await verifyPassword(parsed.data.currentPassword,user.password_hash)) return authResponse({error:'Текущата парола е неправилна.'},401);
    const hash=await hashPassword(parsed.data.password);
    const updated=await authDb().prepare('UPDATE admins SET password_hash=? WHERE id=? AND password_hash=?').bind(hash,user.id,user.password_hash).run();
    if(!updated.meta.changes) return authResponse({error:'Паролата е променена от друга сесия. Влезте отново.'},409);
    await authDb().prepare('DELETE FROM admin_sessions WHERE admin_id=?').bind(user.id).run();
    await createSession(user.id);
    return authResponse({ok:true});
  } catch { return authResponse({error:'Паролата не е променена. Опитайте отново.'},503); }
}
