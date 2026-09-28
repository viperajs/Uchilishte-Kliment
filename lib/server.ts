import { database } from './d1';
import { getAdmin } from './auth';
import { initialEntries, type Entry } from './content';
import { archiveEntries } from './archive';
const builtIn=[...initialEntries,...archiveEntries];
export function db(){return database();}
export async function isAdmin(){return Boolean(await getAdmin());}
export function sameOrigin(req:Request){return req.headers.get('origin')===new URL(req.url).origin;}
export async function allEntries(admin=false){const result=await db().prepare('SELECT * FROM entries').all<Entry>();const overrides=new Map(result.results.map(e=>[e.id,e]));const all=[...builtIn.filter(e=>!overrides.has(e.id)),...result.results];return all.filter(e=>admin||e.published===1).sort((a,b)=>b.year.localeCompare(a.year)||b.date.localeCompare(a.date));}
export async function safeEntries(){try{return {entries:await allEntries(),unavailable:false};}catch(e){console.error('Content storage unavailable');return {entries:builtIn,unavailable:true};}}
export async function ipHash(req:Request){const ip=(req.headers.get('x-forwarded-for')?.split(',')[0].trim()||req.headers.get('x-real-ip')||'local');const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip));return Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join('');}
