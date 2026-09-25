'use client';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, ArrowRight, LogOut } from 'lucide-react';

function PasswordField({label,name,autoComplete='current-password',minLength=1}:{label:string;name:string;autoComplete?:string;minLength?:number}) {
  const [visible,setVisible]=useState(false);
  return <label>{label}<div className="password-input"><input name={name} required type={visible?'text':'password'} minLength={minLength} maxLength={128} autoComplete={autoComplete}/><button type="button" aria-label={visible?'Скрий паролата':'Покажи паролата'} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></label>;
}
export function LoginForm({setup=false}:{setup?:boolean}) {
  const [token,setToken]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  useEffect(()=>{if(setup){const fragment=new URLSearchParams(window.location.hash.slice(1));setToken(fragment.get('token')||'');window.history.replaceState(null,'',window.location.pathname);}},[setup]);
  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();setError('');
    const data=Object.fromEntries(new FormData(event.currentTarget));
    if(setup&&data.password!==data.confirm){setError('Двете пароли не съвпадат.');return;}
    setBusy(true);
    try {
      const response=await fetch('/api/auth/'+(setup?'setup':'login'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,token})});
      const result=await response.json() as {error?:string};
      if(!response.ok)throw new Error(result.error||'Входът не е успешен.');
      window.location.assign('/admin');
    } catch(error){setError(error instanceof Error?error.message:'Няма връзка със сървъра.');setBusy(false);}
  }
  return <section className="auth-card"><div className="auth-symbol"><LockKeyhole size={27}/></div><h2>{setup?'Активирайте администраторския профил':'Добре дошли отново'}</h2><p>{setup?'Задайте своя парола. Връзката може да се използва само веднъж.':'Влезте с имейла и паролата на училищния администратор.'}</p><form onSubmit={submit} className="contact-form"><label>Имейл<input name="email" type="email" required autoComplete="username" maxLength={200} defaultValue={setup?'ohridski@gmail.com':''}/></label><PasswordField label={setup?'Нова парола':'Парола'} name="password" autoComplete={setup?'new-password':'current-password'} minLength={setup?12:1}/>{setup&&<><PasswordField label="Повторете паролата" name="confirm" autoComplete="new-password" minLength={12}/><small>Използвайте поне 12 знака.</small>{!token&&<p className="notice">Отворете еднократната връзка за активиране, предоставена от собственика на сайта.</p>}</>}{error&&<p className="error-message" role="alert">{error}</p>}<button className="btn green" disabled={busy||(setup&&!token)}>{busy?'Моля, изчакайте…':setup?'Активирай профила':'Вход'}<ArrowRight size={17}/></button></form><a className="text-link" href={setup?'/admin':'/'}>{setup?'Вече имате парола? Вход':'Обратно към училищния сайт'}</a></section>;
}
export function AccountControls({email}:{email:string}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  async function logout(){setBusy(true);setError('');try{const r=await fetch('/api/auth/logout',{method:'POST'});if(!r.ok)throw new Error('Изходът не е завършен. Опитайте отново.');window.location.assign('/admin');}catch(e){setError(e instanceof Error?e.message:'Няма връзка.');setBusy(false);}}
  async function changePassword(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setError('');setMessage('');const form=event.currentTarget;const data=Object.fromEntries(new FormData(form));if(data.password!==data.confirm){setError('Двете нови пароли не съвпадат.');return;}setBusy(true);try{const response=await fetch('/api/auth/password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await response.json() as {error?:string};if(!response.ok)throw new Error(result.error);form.reset();setMessage('Паролата е сменена. Другите сесии са прекратени.');}catch(e){setError(e instanceof Error?e.message:'Промяната не е успешна.');}finally{setBusy(false);}}
  return <div className="account-controls"><div><span>{email}</span><button type="button" className="btn outline" onClick={logout} disabled={busy}><LogOut size={16}/>Изход</button></div><details><summary>Смяна на парола</summary><form className="contact-form password-change" onSubmit={changePassword}><PasswordField label="Текуща парола" name="currentPassword"/><PasswordField label="Нова парола" name="password" autoComplete="new-password" minLength={12}/><PasswordField label="Повторете новата парола" name="confirm" autoComplete="new-password" minLength={12}/><button className="btn green" disabled={busy}>Запази новата парола</button></form></details>{error&&<p role="alert" className="error-message">{error}</p>}{message&&<p role="status" className="success-message">{message}</p>}</div>;
}
