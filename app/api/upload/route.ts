import { z } from 'zod';
import { createUpload } from '@/lib/storage';
import { isAdmin, sameOrigin } from '@/lib/server';
import { extensionOf, maxUploadBytes, uploadTypes } from '@/lib/uploads';
// Issues a signed Supabase Storage URL; the browser uploads straight to it, bypassing the 4.5 MB request limit of Vercel functions.
// The bucket itself enforces the 50 MB limit and the allowed types.
const file=z.object({name:z.string().min(1).max(300),size:z.number().int().min(4).max(maxUploadBytes)});
export async function POST(req:Request){if(!sameOrigin(req)||!await isAdmin())return Response.json({error:'Нямате права за качване.'},{status:403});try{const parsed=file.safeParse(await req.json());if(!parsed.success)return Response.json({error:'Изберете файл до 50 MB.'},{status:400});const ext=extensionOf(parsed.data.name);if(!uploadTypes[ext])return Response.json({error:'Разрешени са PDF, DOCX, XLSX, JPG, PNG, WebP и файлове с подпис (.p7s, .p7m).'},{status:400});const id=crypto.randomUUID()+'.'+ext;return Response.json({url:'/api/files/'+id,uploadUrl:await createUpload(id,parsed.data.name)},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Файлът не е качен. Опитайте отново.'},{status:503});}}
