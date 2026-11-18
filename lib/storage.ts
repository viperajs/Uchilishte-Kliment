// Uploaded files: the public Supabase Storage bucket "uploads", one folder per file id (<uuid>.<ext>).
// Storage keys must be ASCII, so the original (often Cyrillic) file name is kept base64url-encoded as the object name.
import { supabase, uploadsBucket } from './supabase';

const bucket = () => supabase().storage.from(uploadsBucket);
// A long name is shortened before its extension, which the downloaded file needs.
const safeName = (name: string) => {
  const clean = name.replace(/[^\p{L}\p{N}._-]+/gu, '_'), ext = /\.[a-z0-9]{1,5}$/i.exec(clean)?.[0] ?? '';
  return (clean.length > 120 ? clean.slice(0, 120 - ext.length) + ext : clean) || 'file';
};

// A one-time URL (valid 2 hours) the browser sends the file to directly, so large files never pass through the server.
export async function createUpload(id: string, filename: string) {
  const { data, error } = await bucket().createSignedUploadUrl(`${id}/${Buffer.from(safeName(filename)).toString('base64url')}`);
  if (error) throw error;
  return data.signedUrl;
}

// The public address of an uploaded file; documents download under their original name.
export async function fileUrl(id: string) {
  const { data, error } = await bucket().list(id, { limit: 1 });
  if (error) throw error;
  const key = data[0]?.name;
  if (!key) return null;
  const download = /\.(pdf|docx|xlsx|p7s|p7m)$/.test(id) ? { download: Buffer.from(key, 'base64url').toString() } : undefined;
  return bucket().getPublicUrl(`${id}/${key}`, download).data.publicUrl;
}
