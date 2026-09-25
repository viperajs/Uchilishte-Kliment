import { getAdmin } from '@/lib/auth';
import Admin from './Admin';
import { LoginForm, AccountControls } from './AuthForms';
export const dynamic='force-dynamic';
export const metadata={title:'Администрация | СУ „Св. Климент Охридски“',robots:{index:false,follow:false}};
export default async function AdminPage(){
  const user=await getAdmin();
  return <main id="main" className="wrap page-content"><div className="section-heading"><div><span className="eyebrow">Управление на съдържанието</span><h1>Администрация</h1></div></div>{user?<><AccountControls email={user.email}/><Admin/></>:<LoginForm/>}</main>;
}
