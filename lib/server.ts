import { supabase } from './supabase';
import { getAdmin } from './auth';
import { initialEntries, type Entry } from './content';
import { archiveEntries } from './archive';
export const builtIn=[...initialEntries,...archiveEntries];
export function db(){return supabase();}
export async function isAdmin(){return Boolean(await getAdmin());}
export function sameOrigin(req:Request){return req.headers.get('origin')===new URL(req.url).origin;}
// Supabase returns at most 1000 rows per request, so the table is read page by page.
async function storedEntries(){const rows:Entry[]=[];for(let from=0;;from+=1000){const {data,error}=await db().from('entries').select('*').order('id').range(from,from+999);if(error)throw error;rows.push(...data as Entry[]);if(data.length<1000)return rows;}}
export async function allEntries(admin=false){const stored=await storedEntries();const overrides=new Map(stored.map(e=>[e.id,e]));const all=[...builtIn.filter(e=>!overrides.has(e.id)),...stored];return all.filter(e=>e.kind!=='deleted'&&(admin||e.published===1)).sort((a,b)=>b.year.localeCompare(a.year)||b.date.localeCompare(a.date));}
export async function safeEntries(){try{return {entries:await allEntries(),unavailable:false};}catch(e){console.error('Content storage unavailable');return {entries:builtIn,unavailable:true};}}
export async function ipHash(req:Request){const ip=(req.headers.get('x-forwarded-for')?.split(',')[0].trim()||req.headers.get('x-real-ip')||'local');const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip));return Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join('');}
