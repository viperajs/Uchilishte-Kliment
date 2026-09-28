import { LoginForm } from '../AuthForms';
export const metadata={title:'Активиране на администратор | СУ „Св. Климент Охридски“',robots:{index:false,follow:false},referrer:'no-referrer'};
export default function SetupPage(){return <main id="main" className="a-login"><div style={{width:'min(460px,100%)'}}><div className="a-login-brand"><img src="/logo.jpg" alt=""/><div><strong>СУ „Св. Климент Охридски“</strong><small>Активиране на администратор</small></div></div><LoginForm setup/></div></main>;}
