// School-year document archive imported with scripts/import-archive.mjs (files in public/archive).
// Server-side only: pages pass the parts they need to client components.
import data from './archive.json';
import { documentMeta, type Entry } from './content';

export type ArchiveYear = { year: string; slug: string; title: string; files: number; size: number; withheld: number };
export type ArchiveFile = { id: string; year: string; folders: string[]; title: string; category: string; sub?: string; file: string; size: number };

export const archiveYears: ArchiveYear[] = data.years;
const files: (ArchiveFile & { name: string })[] = data.files;

export const archiveEntries: Entry[] = files.map(f => ({
  id: f.id, kind: 'document', title: f.title, body: f.folders.join(' › '), category: f.category, year: f.year,
  date: f.year.slice(0, 4) + '-09-15', image: '', file: f.file, source: '', details: JSON.stringify({ size: f.size, sub: f.sub }), published: 1,
}));

// Archive files of one school year that are still published, with any edits made in the administration.
export function archiveFiles(year: string, entries: Entry[]): ArchiveFile[] {
  const published = new Map(entries.filter(e => e.kind === 'document').map(e => [e.id, e]));
  return files.filter(f => f.year === year && published.has(f.id)).map(f => {
    const e = published.get(f.id)!;
    return { id: f.id, year: f.year, folders: f.folders, title: e.title, category: e.category, sub: documentMeta(e).sub, file: e.file || f.file, size: f.size };
  });
}
