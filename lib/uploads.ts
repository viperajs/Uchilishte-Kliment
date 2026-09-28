// Upload rules shared by the local upload route and the Vercel Blob client-upload route.
export const maxUploadBytes = 50 * 1024 * 1024;
export const uploadTypes: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  // Detached (.p7s) or enveloped (.p7m) electronic signatures.
  p7s: 'application/pkcs7-signature', p7m: 'application/pkcs7-mime',
};
export const extensionOf = (name: string) => name.split('.').pop()?.toLowerCase() || '';
const text = (bytes: Uint8Array, from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
// Checks the first bytes so a renamed file cannot pass as another type.
export function matchesSignature(ext: string, bytes: Uint8Array) {
  if (ext === 'pdf') return text(bytes, 0, 5) === '%PDF-';
  if (ext === 'docx' || ext === 'xlsx') return bytes[0] === 80 && bytes[1] === 75;
  if (ext === 'png') return bytes[0] === 137 && bytes[1] === 80;
  if (ext === 'webp') return text(bytes, 0, 4) === 'RIFF' && text(bytes, 8, 12) === 'WEBP';
  if (ext === 'jpg' || ext === 'jpeg') return bytes[0] === 255 && bytes[1] === 216;
  if (ext === 'p7s' || ext === 'p7m') return bytes[0] === 0x30 || text(bytes, 0, 10) === '-----BEGIN' || text(bytes, 0, 2) === 'MI';
  return false;
}
