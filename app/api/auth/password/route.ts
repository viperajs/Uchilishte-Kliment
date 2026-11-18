import { z } from 'zod';
import { getAdmin, trustedOrigin, allowAttempt, signIn, authResponse } from '@/lib/auth';
import { supabaseSession } from '@/lib/supabase';
const input=z.object({currentPassword:z.string().min(1).max(128),password:z.string().min(12).max(128)});
export async function POST(req:Request) {
  if(!trustedOrigin(req)) return authResponse({error:'Невалидна заявка.'},403);
  const user=await getAdmin();
  if(!user) return authResponse({error:'Влезте отново в профила си.'},401);
  try {
    const parsed=input.safeParse(await req.json());
    if(!parsed.success) return authResponse({error:'Новата парола трябва да е между 12 и 128 знака.'},400);
    if(!await allowAttempt(req,'password',user.email)) return authResponse({error:'Твърде много опити. Опитайте след 15 минути.'},429);
    // Signing in again checks the current password and gives this browser a fresh session,
    // which the same client then uses to change the password and sign out the rest.
    const session=await supabaseSession(),auth=session.auth;
    if(!await signIn(user.email,parsed.data.currentPassword,session)) return authResponse({error:'Текущата парола е неправилна.'},401);
    const {error}=await auth.updateUser({password:parsed.data.password});
    if(error?.code==='same_password') return authResponse({error:'Новата парола трябва да е различна от текущата.'},400);
    if(error?.code==='weak_password') return authResponse({error:'Паролата е твърде слаба. Изберете по-дълга и по-рядко срещана.'},400);
    if(error) throw error;
    // Every other session (other browsers, the session before the change) is signed out.
    const {error:revoke}=await auth.signOut({scope:'others'});
    if(revoke) return authResponse({error:'Паролата е сменена, но другите устройства не бяха изведени от профила. Сменете я още веднъж, за да ги изведете.'},503);
    return authResponse({ok:true});
  } catch { return authResponse({error:'Паролата не е променена. Опитайте отново.'},503); }
}
