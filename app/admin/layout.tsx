import { Toaster } from 'sonner';
import './admin.css';
export const metadata={title:'Администрация | СУ „Св. Климент Охридски“',robots:{index:false,follow:false}};
export default function AdminLayout({children}:{children:React.ReactNode}){return <div className="adm">{children}<Toaster position="bottom-right" richColors closeButton theme="light"/></div>}
