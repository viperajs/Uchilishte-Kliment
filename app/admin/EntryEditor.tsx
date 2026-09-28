'use client';
import { useState } from 'react';
import { Save, Send, EyeOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { attachmentsOf, galleryOf, schoolYears, type Attachment, type Entry } from '@/lib/content';
import { AdmissionFields, AttachmentsField, DocumentCategorySelect, GalleryField, MainFile, TableField } from './fields';
import { newsCategories, pageTargets, sectionOf } from './sections';
import { fileTitle } from './upload';

export function EntryEditor({ entry, isNew, onClose, onSaved, onDelete }: { entry: Entry; isNew: boolean; onClose: () => void; onSaved: () => void; onDelete: (e: Entry) => void }) {
  const [draft, setDraft] = useState<Entry>(entry);
  const [gallery, setGallery] = useState<string[]>(galleryOf(entry));
  const [attachments, setAttachments] = useState<Attachment[]>(attachmentsOf(entry));
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const set = <K extends keyof Entry>(key: K, value: Entry[K]) => { setDraft(d => ({ ...d, [key]: value })); setDirty(true); };
  const kind = draft.kind, section = sectionOf(kind);
  const years = schoolYears();
  if (!years.includes(draft.year)) years.push(draft.year);

  function close() { if (busy) return; if (dirty && !confirm('Имате незапазени промени. Затваряне без запис?')) return; onClose(); }
  async function save(published: 0 | 1) {
    setError('');
    if (draft.title.trim().length < 2) { setError('Въведете заглавие (поне 2 знака).'); return; }
    setBusy(true);
    try {
      const cover = kind === 'news' ? (draft.image && gallery.includes(draft.image) ? draft.image : gallery[0] || draft.image) : draft.image;
      const body = { ...draft, title: draft.title.trim(), image: cover, gallery: gallery.length ? JSON.stringify(gallery) : '', attachments: attachments.length ? JSON.stringify(attachments) : '', published };
      const r = await fetch('/api/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json() as { error?: string };
      if (!r.ok) throw new Error(d.error || 'Записът не е успешен.');
      toast.success(published ? 'Публикувано в сайта.' : 'Запазено като чернова.');
      onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : 'Записът не е успешен.'); } finally { setBusy(false); }
  }

  const titleLabel = kind === 'team' ? 'Име и фамилия' : 'Заглавие';
  return <Sheet open onOpenChange={o => { if (!o) close(); }}>
    <SheetContent side="right" className="a-sheet" onInteractOutside={e => { if (dirty) e.preventDefault(); }}>
      <div className="a-sheet-head"><SheetTitle>{isNew ? 'Нов запис: ' + section.one : draft.title || 'Редакция'}</SheetTitle><SheetDescription>{isNew ? section.hint : (draft.published ? 'Публикувано в сайта' : 'Чернова — не се вижда в сайта')}</SheetDescription></div>
      <form className="a-sheet-body" onSubmit={e => e.preventDefault()}>
        <section className="a-group">
          <label className="a-field title">{titleLabel} *<input autoFocus={isNew} required minLength={2} maxLength={200} value={draft.title} onChange={e => set('title', e.target.value)} placeholder={kind === 'news' ? 'Напр. Коледен концерт в училището' : kind === 'document' ? 'Напр. Правилник за дейността на училището' : ''} /></label>
          <div className="a-three">
            <label className="a-field">Учебна година<select className="a-select" value={draft.year} onChange={e => set('year', e.target.value)}>{years.map(y => <option key={y}>{y}</option>)}</select></label>
            <label className="a-field">Дата<input type="date" required value={draft.date} onChange={e => set('date', e.target.value)} /></label>
            <CategoryField kind={kind} value={draft.category} onChange={v => set('category', v)} />
          </div>
        </section>

        {kind === 'document' && <section className="a-group"><h3>Файл</h3><MainFile value={draft.file} onChange={v => set('file', v)} onTitle={name => { if (!draft.title) set('title', fileTitle(name)); }} /></section>}

        {kind === 'news' && <section className="a-group"><h3>Снимки</h3><GalleryField gallery={gallery} cover={draft.image} onChange={(g, cover) => { setGallery(g); set('image', cover); }} /></section>}

        <section className="a-group">
          <h3>{kind === 'team' ? 'Представяне' : kind === 'document' ? 'Описание (по желание)' : 'Текст'}</h3>
          {kind === 'team' && <label className="a-field">Служебен имейл<input type="email" value={draft.details} onChange={e => set('details', e.target.value)} placeholder="име.фамилия@edu.mon.bg" /></label>}
          <label className="a-field"><span className="sr-only">Текст</span><textarea rows={kind === 'news' ? 10 : 5} maxLength={30000} value={draft.body} onChange={e => set('body', e.target.value)} placeholder={kind === 'news' ? 'Разкажете какво се случи…' : ''} /><small>Празен ред започва нов абзац.</small></label>
          {kind === 'admission' && <AdmissionFields value={draft.details} onChange={v => set('details', v)} />}
        </section>

        {(kind === 'schedule' || kind === 'menu') && <section className="a-group"><h3>Таблица</h3><TableField kind={kind} value={draft.details} onChange={v => set('details', v)} /></section>}

        {kind === 'team' && <section className="a-group"><h3>Снимка</h3><GalleryField gallery={draft.image ? [draft.image] : []} cover={draft.image} onChange={g => set('image', g[g.length - 1] || '')} /></section>}

        {kind !== 'team' && <section className="a-group"><h3>{kind === 'document' ? 'Електронен подпис и приложения' : 'Прикачени файлове'}</h3>
          {kind === 'document' && <p className="a-note">Ако документът е подписан с отделен файл (.p7s или .p7m), прикачете го тук — ще се показва до документа.</p>}
          {kind !== 'document' && kind !== 'news' && <MainFile value={draft.file} onChange={v => set('file', v)} />}
          <AttachmentsField value={attachments} onChange={list => { setAttachments(list); setDirty(true); }} />
        </section>}

        <details className="a-group"><summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Допълнително</summary>
          <label className="a-field" style={{ marginTop: 12 }}>Източник (адрес на оригиналната публикация)<input type="url" value={draft.source} onChange={e => set('source', e.target.value)} placeholder="https://" /></label>
        </details>
        {error && <p className="a-error" role="alert">{error}</p>}
      </form>
      <div className="a-sheet-foot">
        {!isNew && <button type="button" className="a-btn ghost spacer" disabled={busy} onClick={() => onDelete(draft)}><Trash2 size={16} />Изтрий</button>}
        <button type="button" className="a-btn ghost" disabled={busy} onClick={close}>Отказ</button>
        <button type="button" className="a-btn ghost" disabled={busy} onClick={() => save(0)}>{draft.published ? <><EyeOff size={16} />Скрий (чернова)</> : <><Save size={16} />Запази чернова</>}</button>
        <button type="button" className="a-btn primary" disabled={busy} onClick={() => save(1)}><Send size={16} />{busy ? 'Записване…' : draft.published ? 'Запази промените' : 'Публикувай'}</button>
      </div>
    </SheetContent>
  </Sheet>;
}

function CategoryField({ kind, value, onChange }: { kind: string; value: string; onChange: (v: string) => void }) {
  if (kind === 'document') return <label className="a-field">Раздел<DocumentCategorySelect value={value} onChange={onChange} /></label>;
  if (kind === 'admission') return <label className="a-field">Клас<select className="a-select" value={value} onChange={e => onChange(e.target.value)}>{[['1', 'I клас'], ['5', 'V клас'], ['8', 'VIII клас'], ['11', 'XI клас']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>;
  if (kind === 'page') return <label className="a-field">Страница<select className="a-select" value={value} onChange={e => onChange(e.target.value)}>{Object.entries(pageTargets).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>;
  if (kind === 'news') return <label className="a-field">Категория<input list="news-categories" value={value} onChange={e => onChange(e.target.value)} /><datalist id="news-categories">{newsCategories.map(c => <option key={c} value={c} />)}</datalist></label>;
  if (kind === 'team') return <label className="a-field">Длъжност<input value={value} onChange={e => onChange(e.target.value)} placeholder="Учител по…" /></label>;
  if (kind === 'schedule') return <label className="a-field">Клас<input value={value} onChange={e => onChange(e.target.value)} placeholder="Напр. VIII а" /></label>;
  return <span />;
}
