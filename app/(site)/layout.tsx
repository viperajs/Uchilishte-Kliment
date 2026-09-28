import '../documents.css';
import { WebTools } from '../WebTools';
import { SiteHeader, SiteFooter, CookieNotice } from '../SiteShell';
export default function SiteLayout({children}:{children:React.ReactNode}){return <><SiteHeader/>{children}<SiteFooter/><CookieNotice/><WebTools/></>}
