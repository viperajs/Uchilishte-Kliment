'use client';
import { useMemo, useState } from 'react';
import { ChevronRight, Download, FileText, FolderArchive, FolderOpen, LoaderCircle, Search } from 'lucide-react';
import { categoryLabel, downloadName, fileSize, fileType, sectionOfCategory } from '@/lib/content';
import { downloadZip, type ZipItem } from '@/lib/zip';
import type { ArchiveFile, ArchiveYear } from '@/lib/archive';

const documents = (n: number) => n + (n === 1 ? ' документ' : ' документа');
const zipName = (...parts: string[]) => parts.join(' – ').replace(/[\\/:*?"<>|]+/g, '-').replace(/[.\s]+$/, '') + '.zip';

export function ZipButton({ items, filename, label, size }: { items: ZipItem[]; filename: string; label: string; size?: number }) {
  const [progress, setProgress] = useState<[number, number] | null>(null), [error, setError] = useState('');
  async function run() {
    setError('');
    setProgress([0, items.length]);
    try { await downloadZip(items, filename, (done, total) => setProgress([done, total])); }
    catch { setError('Архивът не беше създаден. Опитайте отново или изтеглете файловете поотделно.'); }
    finally { setProgress(null); }
  }
  return <div className="zip-download">
    <button type="button" className="btn outline" onClick={run} disabled={!!progress || !items.length}>
      {progress ? <><LoaderCircle size={17} className="spin" />Подготвяне {progress[0]} от {progress[1]}…</> : <><FolderArchive size={17} />{label}{size ? <small>ZIP · {fileSize(size)}</small> : null}</>}
    </button>
    {error && <p role="alert" className="error-message">{error}</p>}
  </div>;
}

type Folder = { name: string; files: ArchiveFile[]; folders: Map<string, Folder>; count: number; size: number };
function tree(files: ArchiveFile[]) {
  const root: Folder = { name: '', files: [], folders: new Map(), count: 0, size: 0 };
  for (const f of files) {
    let node = root;
    node.count++; node.size += f.size;
    for (const name of f.folders) {
      if (!node.folders.has(name)) node.folders.set(name, { name, files: [], folders: new Map(), count: 0, size: 0 });
      node = node.folders.get(name)!;
      node.count++; node.size += f.size;
    }
    node.files.push(f);
  }
  return root;
}
// Files under a folder, placed in the ZIP below `root` with the same subfolders as on the page.
const zipItems = (files: ArchiveFile[], path: string[], root: string): ZipItem[] => files
  .filter(f => path.every((p, i) => f.folders[i] === p))
  .map(f => ({ url: f.file, path: [root, ...f.folders.slice(path.length), downloadName(f.title, f.file)].join('/') }));

function FileRow({ file, showFolder = false }: { file: ArchiveFile; showFolder?: boolean }) {
  const section = sectionOfCategory(file.category);
  return <li className="archive-file">
    <FileText size={20} aria-hidden="true" />
    <div>
      <h3>{file.title}</h3>
      <p>{showFolder && <span>{file.folders.join(' › ')}</span>}{section ? <a href={'/documents/' + section.slug}>{categoryLabel(file.category)}</a> : <span>{file.category}</span>}<span>{fileType(file.file)} · {fileSize(file.size)}</span></p>
    </div>
    <a className="btn outline" href={file.file} download={downloadName(file.title, file.file)} aria-label={'Изтегли: ' + file.title}><Download size={16} />Изтегли</a>
  </li>;
}

function FolderView({ folder, path, files, year }: { folder: Folder; path: string[]; files: ArchiveFile[]; year: ArchiveYear }) {
  return <details className="archive-folder">
    <summary><ChevronRight size={18} className="chevron" aria-hidden="true" /><FolderOpen size={19} aria-hidden="true" /><span>{folder.name}</span><small>{documents(folder.count)}</small></summary>
    <div className="archive-folder-body">
      <ZipButton items={zipItems(files, path, folder.name)} filename={zipName('Архив ' + year.slug, folder.name)} label="Изтегли папката" size={folder.size} />
      {[...folder.folders.values()].map(child => <FolderView key={child.name} folder={child} path={[...path, child.name]} files={files} year={year} />)}
      {folder.files.length > 0 && <ul className="archive-files">{folder.files.map(f => <FileRow key={f.id} file={f} />)}</ul>}
    </div>
  </details>;
}

export function ArchiveBrowser({ year, years, files, initialQuery = '' }: { year: ArchiveYear; years: ArchiveYear[]; files: ArchiveFile[]; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const root = useMemo(() => tree(files), [files]);
  const zipRoot = `Архив ${year.slug} – начало на учебната година`;
  const needle = query.trim().toLowerCase();
  const found = needle ? files.filter(f => `${f.title} ${f.category} ${f.folders.join(' ')}`.toLowerCase().includes(needle)) : [];
  return <div className="archive-browser">
    <nav className="archive-years" aria-label="Учебни години в архива">{years.map(y => <a key={y.slug} href={'/documents/archive/' + y.slug} aria-current={y.slug === year.slug ? 'page' : undefined}>{y.year}<small>{documents(y.files)}</small></a>)}</nav>
    <div className="archive-summary">
      <div><strong>{files.length}</strong><span>документа</span></div>
      <div><strong>{root.folders.size}</strong><span>раздела</span></div>
      <div><strong>{fileSize(root.size)}</strong><span>общ размер</span></div>
      <ZipButton items={zipItems(files, [], zipRoot)} filename={zipName(zipRoot)} label="Изтегли цялата година" size={root.size} />
    </div>
    <div className="filters"><label className="search-field"><Search size={18} /><input type="search" aria-label="Търсене в архива" placeholder="Търсене в архива, напр. „етичен кодекс“ или „учебен план 5“" value={query} onChange={e => setQuery(e.target.value)} /></label></div>
    {needle ? <>
      <p className="result-count" aria-live="polite">{documents(found.length)} за „{query.trim()}“</p>
      {found.length ? <ul className="archive-files">{found.map(f => <FileRow key={f.id} file={f} showFolder />)}</ul> : <p className="notice">Няма документи, които отговарят на търсенето. Опитайте с друга дума.</p>}
    </> : <>
      {[...root.folders.values()].map(section => <section className="archive-section" key={section.name}>
        <header>
          <div><h2>{section.name}</h2><p>{documents(section.count)} · {fileSize(section.size)}</p></div>
          <ZipButton items={zipItems(files, [section.name], section.name)} filename={zipName('Архив ' + year.slug, section.name)} label="Изтегли раздела" size={section.size} />
        </header>
        {[...section.folders.values()].map(folder => <FolderView key={folder.name} folder={folder} path={[section.name, folder.name]} files={files} year={year} />)}
        {section.files.length > 0 && <ul className="archive-files">{section.files.map(f => <FileRow key={f.id} file={f} />)}</ul>}
      </section>)}
      {root.files.length > 0 && <ul className="archive-files">{root.files.map(f => <FileRow key={f.id} file={f} />)}</ul>}
    </>}
    {year.withheld > 0 && <p className="notice archive-withheld">{documents(year.withheld)} от архива за {year.year} не са публикувани, защото съдържат лични данни на ученици (екипи за подкрепа за личностно развитие, индивидуални учебни програми, планове за допълнителна подкрепа).</p>}
  </div>;
}
