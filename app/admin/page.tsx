import { getAdmin } from '@/lib/auth';
import AdminApp from './AdminApp';
import { toSection } from './sections';
import { LoginForm } from './AuthForms';
export const dynamic='force-dynamic';
export default async function AdminPage({searchParams}:{searchParams:Promise<{s?:string}>}){
  const user=await getAdmin();
  if(user)return <AdminApp email={user.email} initialSection={toSection((await searchParams).s)}/>;
  return <main id="main" className="a-login"><div style={{width:'min(460px,100%)'}}><div className="a-login-brand"><img src="/logo.jpg" alt=""/><div><strong>СУ „Св. Климент Охридски“</strong><small>Администрация на сайта</small></div></div><LoginForm/></div></main>;
}
