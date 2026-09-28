import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { isAdmin, sameOrigin } from '@/lib/server';
import { extensionOf, maxUploadBytes, uploadTypes } from '@/lib/uploads';
// Issues short-lived tokens so the browser uploads large files straight to Vercel Blob,
// bypassing the 4.5 MB request limit of Vercel functions. Only a signed-in admin gets a token.
export async function POST(req:Request){
  try{
    const body=await req.json() as HandleUploadBody;
    const result=await handleUpload({body,request:req,onBeforeGenerateToken:async pathname=>{
      if(!sameOrigin(req)||!await isAdmin())throw new Error('Нямате права за качване.');
      const type=uploadTypes[extensionOf(pathname)];
      if(!type)throw new Error('Този тип файл не е разрешен.');
      return {allowedContentTypes:[type],maximumSizeInBytes:maxUploadBytes,addRandomSuffix:true};
    }});
    return Response.json(result);
  }catch(e){return Response.json({error:e instanceof Error?e.message:'Файлът не е качен.'},{status:400});}
}
