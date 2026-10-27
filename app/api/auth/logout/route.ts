import { trustedOrigin, authResponse } from '@/lib/auth';
import { supabaseSession } from '@/lib/supabase';
export async function POST(req:Request) {
  if (!trustedOrigin(req)) return authResponse({error:'Невалидна заявка.'},403);
  try {
    const { error } = await (await supabaseSession()).auth.signOut({ scope: 'local' });
    if (error) throw error;
    return authResponse({ok:true});
  } catch { return authResponse({error:'Изходът не е завършен. Опитайте отново.'},503); }
}
