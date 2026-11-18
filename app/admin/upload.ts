'use client';
import { extensionOf, matchesSignature, maxUploadBytes, uploadTypes } from '@/lib/uploads';

export type Uploaded = { url: string; name: string };

export const fileTitle = (name: string) => name.replace(/\.(p7s|p7m)$/i, '').replace(/\.[a-z0-9]+$/i, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();

// The server hands out a signed Supabase Storage URL and the browser sends the file straight there,
// so files up to 50 MB never pass through the server.
export async function uploadFile(file: File, onProgress?: (percent: number) => void): Promise<Uploaded> {
  const ext = extensionOf(file.name), type = uploadTypes[ext];
  if (!type) throw new Error(`„${file.name}“: разрешени са PDF, DOCX, XLSX, JPG, PNG, WebP, .p7s и .p7m.`);
  if (file.size > maxUploadBytes) throw new Error(`„${file.name}“ е над 50 MB.`);
  if (file.size < 4 || !matchesSignature(ext, new Uint8Array(await file.slice(0, 16).arrayBuffer()))) throw new Error(`„${file.name}“: съдържанието не съответства на формата.`);
  const response = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: file.name, size: file.size }) });
  const target = await response.json().catch(() => ({})) as { url?: string; uploadUrl?: string; error?: string };
  if (!response.ok || !target.url || !target.uploadUrl) throw new Error(`„${file.name}“: ${target.error || 'файлът не е качен.'}`);
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', target.uploadUrl!);
    xhr.setRequestHeader('Content-Type', type);
    // Uploads are never replaced (each has a new id), so browsers and the CDN may keep them for a year.
    xhr.setRequestHeader('Cache-Control', 'max-age=31536000');
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress?.(Math.round(e.loaded / e.total * 100)); };
    xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`„${file.name}“: ${xhr.status === 413 ? 'файлът е над 50 MB.' : 'файлът не е качен.'}`));
    xhr.onerror = () => reject(new Error('Няма връзка със сървъра.'));
    xhr.send(file);
  });
  return { url: target.url, name: file.name };
}
