'use client';
import { upload as blobUpload } from '@vercel/blob/client';
import { extensionOf, maxUploadBytes, uploadTypes } from '@/lib/uploads';

export type Uploaded = { url: string; name: string };
let blobMode: Promise<boolean> | null = null;
// On Vercel (Blob token set) files go straight from the browser to Blob; locally they go through /api/upload.
const blobEnabled = () => blobMode ??= fetch('/api/upload').then(r => (r.ok ? r.json() : {}) as Promise<{ blob?: boolean }>).then(d => Boolean(d.blob)).catch(() => false);

export const fileTitle = (name: string) => name.replace(/\.(p7s|p7m)$/i, '').replace(/\.[a-z0-9]+$/i, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();

export async function uploadFile(file: File, onProgress?: (percent: number) => void): Promise<Uploaded> {
  const ext = extensionOf(file.name);
  if (!uploadTypes[ext]) throw new Error(`„${file.name}“: разрешени са PDF, DOCX, XLSX, JPG, PNG, WebP, .p7s и .p7m.`);
  if (file.size > maxUploadBytes) throw new Error(`„${file.name}“ е над 50 MB.`);
  if (await blobEnabled()) {
    const safe = file.name.replace(/[^\p{L}\p{N}._-]+/gu, '_').slice(-120);
    const result = await blobUpload('uploads/' + safe, file, { access: 'public', handleUploadUrl: '/api/upload/blob', multipart: file.size > 8 * 1024 * 1024, onUploadProgress: e => onProgress?.(Math.round(e.percentage)) });
    return { url: result.url, name: file.name };
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress?.(Math.round(e.loaded / e.total * 100)); };
    xhr.onload = () => {
      let data: { url?: string; error?: string } = {};
      try { data = JSON.parse(xhr.responseText); } catch {}
      if (xhr.status < 300 && data.url) resolve({ url: data.url, name: file.name });
      else reject(new Error(`„${file.name}“: ${data.error || 'файлът не е качен.'}`));
    };
    xhr.onerror = () => reject(new Error('Няма връзка със сървъра.'));
    const form = new FormData();
    form.set('file', file);
    xhr.send(form);
  });
}
