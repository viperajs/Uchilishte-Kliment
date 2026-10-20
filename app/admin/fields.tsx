'use client';
import { useRef, useState } from 'react';
import { UploadCloud, FileText, X, Plus, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { documentCategories, documentSections, otherDocumentCategories, subCategory, type Attachment, archiveOnlyCategories } from '@/lib/content';
import { uploadFile, type Uploaded } from './upload';

// Categories grouped as on the site's „Документи“ page: a section, then its subsections.
export function DocumentCategorySelect({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return <select className="a-select" value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
    {value && !documentCategories.includes(value) && !archiveOnlyCategories.includes(value) && <option value={value}>{value} (стара категория)</option>}
    {documentSections.filter(s => !s.href).map((s, i) => <optgroup key={s.slug} label={`${i + 1}. ${s.title}`}>
      <option value={s.title}>{s.items ? s.title + ' — общо за раздела' : s.title}</option>
      {s.items?.map(item => <option key={item} value={subCategory(s, item)}>{item}</option>)}
    </optgroup>)}
    <optgroup label="Други страници на сайта">{otherDocumentCategories.map(c => <option key={c}>{c}</option>)}</optgroup>
    <optgroup label="Само в „Архив по години“">{archiveOnlyCategories.map(c => <option key={c}>{c}</option>)}</optgroup>
  </select>;
}

type Progress = { key: string; name: string; percent: number; failed?: boolean };

export function Dropzone({ accept, multiple = false, title, hint, onFiles }: { accept: string; multiple?: boolean; title: string; hint: string; onFiles: (files: File[]) => void }) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const take = (list: FileList | null) => { const files = Array.from(list || []); if (files.length) onFiles(multiple ? files : files.slice(0, 1)); };
  return <div role="button" tabIndex={0} className={'a-drop' + (over ? ' over' : '')} onClick={() => input.current?.click()} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click(); } }}
    onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}>
    <UploadCloud size={28} /><strong>{title}</strong><span>{hint}</span>
    <input ref={input} type="file" accept={accept} multiple={multiple} onChange={e => { take(e.target.files); e.target.value = ''; }} />
  </div>;
}

// Uploads files one after another and shows a progress bar per file.
export function useUploads() {
  const [items, setItems] = useState<Progress[]>([]);
  async function run(files: File[]): Promise<Uploaded[]> {
    const done: Uploaded[] = [];
    const batch = files.map(f => ({ key: crypto.randomUUID(), name: f.name, percent: 0 }));
    setItems(i => [...i, ...batch]);
    for (const [n, file] of files.entries()) {
      const key = batch[n].key;
      try {
        done.push(await uploadFile(file, p => setItems(i => i.map(x => x.key === key ? { ...x, percent: p } : x))));
        setItems(i => i.filter(x => x.key !== key));
      } catch (e) {
        setItems(i => i.map(x => x.key === key ? { ...x, failed: true } : x));
        toast.error(e instanceof Error ? e.message : 'Файлът не е качен.');
      }
    }
    return done;
  }
  const view = items.length ? <ul className="a-progress">{items.map(i => <li key={i.key} className={i.failed ? 'failed' : ''}><span>{i.name}</span><b>{i.failed ? 'Грешка' : i.percent + '%'}</b><i style={{ '--p': (i.failed ? 100 : i.percent) + '%' } as React.CSSProperties} /></li>)}</ul> : null;
  return { run, view, busy: items.some(i => !i.failed) };
}

export function MainFile({ value, onChange, onTitle }: { value: string; onChange: (url: string) => void; onTitle?: (name: string) => void }) {
  const uploads = useUploads();
  return <div className="a-file-list">
    {value ? <div className="a-file"><FileText size={20} /><span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14 }}>{decodeURIComponent(value.split('/').pop() || value)}</span><a href={value} target="_blank" rel="noreferrer">Отвори</a><button type="button" className="a-icon-btn danger" aria-label="Премахни файла" onClick={() => onChange('')}><X size={17} /></button></div>
      : <Dropzone accept=".pdf,.docx,.xlsx,.p7m" title="Пуснете файла тук или натиснете" hint="PDF, DOCX или XLSX до 50 MB" onFiles={async files => { const [f] = await uploads.run(files); if (f) { onChange(f.url); onTitle?.(f.name); } }} />}
    {uploads.view}
  </div>;
}

export function GalleryField({ gallery, cover, onChange }: { gallery: string[]; cover: string; onChange: (gallery: string[], cover: string) => void }) {
  const uploads = useUploads();
  const current = cover && gallery.includes(cover) ? cover : gallery[0] || '';
  return <div className="a-file-list">
    {gallery.length > 0 && <div className="a-gallery">{gallery.map(url => <figure key={url} className={url === current ? 'cover' : ''}>
      <img src={url} alt="" loading="lazy" />
      {url === current && <span className="cover-tag">Заглавна</span>}
      <figcaption>{url !== current ? <button type="button" title="Направи заглавна снимка" aria-label="Направи заглавна снимка" onClick={() => onChange(gallery, url)}><Star size={13} /></button> : <span />}<button type="button" className="remove" aria-label="Премахни снимката" onClick={() => { const next = gallery.filter(u => u !== url); onChange(next, url === current ? next[0] || '' : current); }}><Trash2 size={13} /></button></figcaption>
    </figure>)}</div>}
    <Dropzone accept=".jpg,.jpeg,.png,.webp" multiple title="Добавете снимки" hint="Пуснете една или много снимки (JPG, PNG, WebP)" onFiles={async files => { const done = await uploads.run(files); if (done.length) { const next = [...gallery, ...done.map(d => d.url)]; onChange(next, current || next[0]); } }} />
    {uploads.view}
  </div>;
}

export function AttachmentsField({ value, onChange }: { value: Attachment[]; onChange: (list: Attachment[]) => void }) {
  const uploads = useUploads();
  return <div className="a-file-list">
    {value.map((a, i) => <div className="a-file" key={a.url}><FileText size={20} /><input aria-label="Име на файла" value={a.name} onChange={e => onChange(value.map((x, n) => n === i ? { ...x, name: e.target.value } : x))} /><a href={a.url} target="_blank" rel="noreferrer">Отвори</a><button type="button" className="a-icon-btn danger" aria-label="Премахни" onClick={() => onChange(value.filter((_, n) => n !== i))}><X size={17} /></button></div>)}
    <Dropzone accept=".pdf,.docx,.xlsx,.p7s,.p7m,.jpg,.jpeg,.png,.webp" multiple title="Прикачете файлове" hint="Напр. файл с електронен подпис (.p7s), приложения, образци" onFiles={async files => { const done = await uploads.run(files); if (done.length) onChange([...value, ...done.map(d => ({ name: d.name, url: d.url }))]); }} />
    {uploads.view}
  </div>;
}

export function AdmissionFields({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  let data: Record<string, string> = {};
  try { data = JSON.parse(value || '{}'); } catch {}
  return <>{[['schedule', 'График'], ['plan', 'План-прием'], ['documents', 'Необходими документи'], ['stages', 'Класиране и срокове'], ['places', 'Свободни места']].map(([key, title]) => <label className="a-field" key={key}>{title}<textarea rows={3} style={{ minHeight: 80 }} value={data[key] || ''} onChange={e => onChange(JSON.stringify({ ...data, [key]: e.target.value }))} /></label>)}</>;
}

export function TableField({ kind, value, onChange }: { kind: string; value: string; onChange: (v: string) => void }) {
  const labels = kind === 'schedule' ? ['Час', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък'] : ['Дата', 'Ястия', 'Алергени'];
  let rows: string[][] = [];
  try { rows = (JSON.parse(value || '[]') as string[][]).map(r => labels.map((_, j) => r[j] || '')); } catch {}
  const set = (next: string[][]) => onChange(JSON.stringify(next));
  return <div className="a-file-list">
    {rows.length > 0 && <div className="a-table-wrap"><table className="a-table"><thead><tr>{labels.map(l => <th key={l}>{l}</th>)}<th /></tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{labels.map((l, j) => <td key={l}><input aria-label={l + ', ред ' + (i + 1)} value={r[j] || ''} onChange={e => set(rows.map((x, n) => n === i ? x.map((c, m) => m === j ? e.target.value : c) : x))} /></td>)}<td><button type="button" className="a-icon-btn danger" aria-label="Премахни реда" onClick={() => set(rows.filter((_, n) => n !== i))}><Trash2 size={16} /></button></td></tr>)}</tbody></table></div>}
    <div><button type="button" className="a-btn ghost small" onClick={() => set([...rows, labels.map(() => '')])}><Plus size={15} />Добави ред</button></div>
  </div>;
}
