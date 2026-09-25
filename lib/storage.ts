// Uploaded files: Vercel Blob when BLOB_READ_WRITE_TOKEN is set, otherwise a local folder for development.
import { put, list } from '@vercel/blob';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const localDir = path.join(process.cwd(), '.data', 'uploads');
const safeName = (name: string) => name.replace(/[^\p{L}\p{N}._-]+/gu, '_').slice(0, 120) || 'file';

export async function saveFile(id: string, bytes: Uint8Array, contentType: string, filename: string) {
  const name = safeName(filename);
  if (useBlob()) {
    await put(`uploads/${id}/${name}`, Buffer.from(bytes), { access: 'public', contentType, addRandomSuffix: false });
    return;
  }
  await mkdir(path.join(localDir, id), { recursive: true });
  await writeFile(path.join(localDir, id, name), bytes);
}

export async function loadFile(id: string): Promise<{ body: BodyInit; contentType: string; filename: string } | null> {
  if (useBlob()) {
    const { blobs } = await list({ prefix: `uploads/${id}/`, limit: 1 });
    if (!blobs[0]) return null;
    const res = await fetch(blobs[0].url);
    if (!res.ok || !res.body) return null;
    return { body: res.body, contentType: res.headers.get('content-type') || 'application/octet-stream', filename: blobs[0].pathname.split('/').pop() || id };
  }
  try {
    const [name] = await readdir(path.join(localDir, id));
    if (!name) return null;
    const ext = id.split('.').pop() || '';
    const types: Record<string, string> = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    return { body: new Uint8Array(await readFile(path.join(localDir, id, name))), contentType: types[ext] || 'application/octet-stream', filename: name };
  } catch { return null; }
}
