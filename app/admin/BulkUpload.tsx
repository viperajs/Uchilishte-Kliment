'use client';
import { useState } from 'react';
import { FileText, ShieldCheck, X, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { currentYear, documentCategories, schoolYears } from '@/lib/content';
import { extensionOf } from '@/lib/uploads';
import { DocumentCategorySelect, Dropzone } from './fields';
import { today } from './sections';
import { fileTitle, uploadFile } from './upload';

type Item = { key: string; file: File; title: string; signature?: File; state: 'ready' | 'uploading' | 'done' | 'failed'; percent: number; message?: string };
const isSignature = (f: File) => ['p7s', 'p7m'].includes(extensionOf(f.name));
// "Правилник.pdf.p7s" and "Правилник.p7s" both belong to "Правилник.pdf".
const baseName = (name: string) => name.toLowerCase().replace(/\.(p7s|p7m)$/, '').replace(/\.(pdf|docx|xlsx)$/, '');

// Adds files to the list, pairing each .p7s/.p7m signature with its document.
function withFiles(list: Item[], files: File[]) {
  const next = [...list];
  for (const f of files.filter(f => !isSignature(f))) next.push({ key: crypto.randomUUID(), file: f, title: fileTitle(f.name), state: 'ready', percent: 0 });
  for (const sig of files.filter(isSignature)) {
    const at = next.findIndex(i => !i.signature && !isSignature(i.file) && baseName(i.file.name) === baseName(sig.name));
    // A signature without a matching document (e.g. an enveloped .p7m) is published on its own.
    if (at >= 0) next[at] = { ...next[at], signature: sig }; else next.push({ key: crypto.randomUUID(), file: sig, title: fileTitle(sig.name), state: 'ready', percent: 0 });
  }
  return next;
}

export function BulkUpload({ open, initialCategory, initialFiles, onClose, onDone }: { open: boolean; initialCategory?: string; initialFiles?: File[]; onClose: () => void; onDone: () => void }) {
  const [items, setItems] = useState<Item[]>(() => withFiles([], initialFiles || []));
  const [category, setCategory] = useState(initialCategory || documentCategories[0]), [year, setYear] = useState(currentYear()), [date, setDate] = useState(today()), [publish, setPublish] = useState(true);
  const [running, setRunning] = useState(false);
  const patch = (key: string, p: Partial<Item>) => setItems(list => list.map(i => i.key === key ? { ...i, ...p } : i));

  const add = (files: File[]) => setItems(list => withFiles(list, files));

  async function start() {
    setRunning(true);
    const queue = items.filter(i => i.state !== 'done'), total = queue.length;
    let ok = 0;
    for (const item of queue) {
      patch(item.key, { state: 'uploading', percent: 0, message: undefined });
      try {
        const main = await uploadFile(item.file, p => patch(item.key, { percent: p }));
        const sig = item.signature ? await uploadFile(item.signature) : null;
        const entry = { id: crypto.randomUUID(), kind: 'document', title: item.title.trim() || fileTitle(item.file.name), body: '', category, year, date, image: '', file: main.url, source: '', details: '', gallery: '', attachments: sig ? JSON.stringify([{ name: 'Електронен подпис (' + extensionOf(sig.name) + ')', url: sig.url }]) : '', published: publish ? 1 : 0 };
        const r = await fetch('/api/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) });
        if (!r.ok) throw new Error(((await r.json()) as { error?: string }).error || 'Записът не е успешен.');
        patch(item.key, { state: 'done', percent: 100 });
        ok++;
      } catch (e) { patch(item.key, { state: 'failed', message: e instanceof Error ? e.message : 'Грешка' }); }
    }
    setRunning(false);
    if (ok) { toast.success(`Качени ${ok} ${ok === 1 ? 'документ' : 'документа'}.`); onDone(); }
    if (ok === total) { setItems([]); onClose(); } else setItems(list => list.filter(i => i.state !== 'done'));
  }

  const pending = items.filter(i => i.state !== 'done').length;
  return <Dialog open={open} onOpenChange={o => { if (!o && !running) { setItems([]); onClose(); } }}>
    <DialogContent className="a-bulk">
      <DialogTitle>Качване на документи</DialogTitle>
      <DialogDescription>Изберете категория и учебна година, пуснете файловете и ги качете наведнъж. Всеки файл става отделен документ.</DialogDescription>
      <div className="a-three" style={{ marginTop: 6 }}>
        <label className="a-field">Раздел<DocumentCategorySelect value={category} onChange={setCategory} disabled={running} /></label>
        <label className="a-field">Учебна година<select className="a-select" value={year} onChange={e => setYear(e.target.value)} disabled={running}>{schoolYears().map(y => <option key={y}>{y}</option>)}</select></label>
        <label className="a-field">Дата<input type="date" value={date} onChange={e => setDate(e.target.value)} disabled={running} /></label>
      </div>
      <Dropzone accept=".pdf,.docx,.xlsx,.p7s,.p7m" multiple title="Пуснете документите тук или натиснете" hint="PDF, DOCX, XLSX до 50 MB. Файлове с подпис (.p7s/.p7m) се закачат към документа със същото име." onFiles={add} />
      {items.length > 0 && <div className="a-bulk-list">{items.map(i => <div className="a-bulk-item" key={i.key}>
        <FileText size={20} />
        <div style={{ minWidth: 0 }}><input aria-label="Заглавие" value={i.title} disabled={running || i.state === 'done'} onChange={e => patch(i.key, { title: e.target.value })} style={{ width: '100%' }} /><small>{i.file.name}{i.message ? ' — ' + i.message : ''}</small></div>
        {i.signature ? <span className="a-sig" title={i.signature.name}><ShieldCheck size={13} />С подпис</span> : <span />}
        {i.state === 'ready' ? <button type="button" className="a-icon-btn danger" aria-label="Премахни" disabled={running} onClick={() => setItems(l => l.filter(x => x.key !== i.key))}><X size={17} /></button>
          : <span className={'a-state' + (i.state === 'done' ? ' ok' : i.state === 'failed' ? ' bad' : '')}>{i.state === 'done' ? 'Готово ✓' : i.state === 'failed' ? 'Грешка' : i.percent + '%'}</span>}
      </div>)}</div>}
      <label className="check-row" style={{ display: 'flex', gap: 9, alignItems: 'center', fontSize: 14 }}><input type="checkbox" checked={publish} onChange={e => setPublish(e.target.checked)} disabled={running} />Публикувай веднага в сайта</label>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button type="button" className="a-btn ghost" disabled={running} onClick={() => { setItems([]); onClose(); }}>Отказ</button>
        <button type="button" className="a-btn primary" disabled={running || !pending} onClick={start}><UploadCloud size={17} />{running ? 'Качване…' : pending ? `Качи ${pending} ${pending === 1 ? 'документ' : 'документа'}` : 'Качи'}</button>
      </div>
    </DialogContent>
  </Dialog>;
}
