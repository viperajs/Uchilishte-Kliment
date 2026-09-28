'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, ExternalLink, UploadCloud, Newspaper, Inbox as InboxIcon, Menu, LogOut, KeyRound, Globe, CalendarCheck, FileText, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { attachmentsOf, categoryLabel as docCategoryLabel, coverOf, currentYear, documentCategories, documentGroups, entryHref, otherDocumentCategories, schoolYears, subCategory, type DocumentSection, type Entry } from '@/lib/content';
import { sectionIcons } from '@/app/section-icons';
import './documents-board.css';
import { PasswordField } from './AuthForms';
import { BulkUpload } from './BulkUpload';
import { EntryEditor } from './EntryEditor';
import { bgDate, blank, pageTargets, sectionOf, sections, toSection, type SectionKey } from './sections';

type Message = { id: string; first: string; last: string; email: string; phone: string; message: string; created: number };
const listKinds = sections.filter(s => s.one).map(s => s.key);

export default function AdminApp({ email, initialSection }: { email: string; initialSection: SectionKey }) {
  const [section, setSection] = useState<SectionKey>(initialSection);
  const [items, setItems] = useState<Entry[]>([]), [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [editing, setEditing] = useState<{ entry: Entry; isNew: boolean } | null>(null);
  const [bulk, setBulk] = useState<{ category?: string; files?: File[]; n: number } | null>(null), [removing, setRemoving] = useState<Entry | null>(null), [profile, setProfile] = useState(false), [menu, setMenu] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([fetch('/api/content?admin=1'), fetch('/api/contact?inbox=1')]);
      if (a.status === 403 || b.status === 403) { window.location.reload(); return; }
      const [x, y] = await Promise.all([a.json() as Promise<{ error?: string; entries: Entry[] }>, b.json() as Promise<{ error?: string; messages: Message[] }>]);
      if (!a.ok || !b.ok) throw new Error(x.error || y.error);
      setItems(x.entries); setMessages(y.messages); setError('');
    } catch (e) { setError(e instanceof Error && e.message ? e.message : 'Информацията не може да се зареди.'); } finally { setLoading(false); }
  }, []);
  // load() only sets state after awaiting the fetches, so this does not cascade renders.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); const back = () => setSection(toSection(new URLSearchParams(window.location.search).get('s'))); window.addEventListener('popstate', back); return () => window.removeEventListener('popstate', back); }, [load]);
  const go = (key: SectionKey) => { setSection(key); setMenu(false); window.history.pushState(null, '', key === 'dashboard' ? '/admin' : '/admin?s=' + key); window.scrollTo(0, 0); };
  const create = (kind: string, category?: string) => setEditing({ entry: { ...blank(kind), ...(category ? { category } : {}) }, isNew: true });

  async function remove(entry: Entry) {
    const r = await fetch('/api/content?id=' + encodeURIComponent(entry.id), { method: 'DELETE' });
    const d = await r.json() as { error?: string };
    if (!r.ok) { toast.error(d.error || 'Записът не е изтрит.'); return; }
    toast.success('„' + entry.title + '“ е изтрит.');
    setRemoving(null); setEditing(null); load();
  }
  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); window.location.assign('/admin'); }

  const counts = useMemo(() => Object.fromEntries(listKinds.map(k => [k, items.filter(e => e.kind === k).length])), [items]);
  const current = sectionOf(section);
  return <div className={'a-shell' + (menu ? ' menu-open' : '')}>
    <aside className="a-side" aria-label="Администрация">
      <div className="a-brand"><img src="/logo.jpg" alt="" /><div><strong>Администрация</strong><small>СУ „Св. Климент Охридски“</small></div></div>
      <nav className="a-nav">{sections.map((s, i) => <div key={s.key}>
        {i === sections.length - 1 && <div className="a-nav-sep" />}
        <button type="button" aria-current={section === s.key ? 'page' : undefined} onClick={() => go(s.key)}><s.icon size={19} />{s.label}
          {s.key === 'inbox' ? messages.length > 0 && <span className="count alert">{messages.length}</span> : s.one && counts[s.key] > 0 && <span className="count">{counts[s.key]}</span>}
        </button>
        {i === 0 && <div className="a-nav-sep" />}
      </div>)}</nav>
      <div className="a-side-foot">
        <span className="who" title={email}>{email}</span>
        <a href="/" target="_blank" rel="noreferrer"><Globe size={17} />Отвори сайта</a>
        <button type="button" onClick={() => { setProfile(true); setMenu(false); }}><KeyRound size={17} />Смяна на парола</button>
        <button type="button" onClick={logout}><LogOut size={17} />Изход</button>
      </div>
    </aside>
    <div className="a-scrim" onClick={() => setMenu(false)} />
    <div style={{ minWidth: 0 }}>
      <header className="a-topbar"><button type="button" className="a-icon-btn" aria-label="Меню" onClick={() => setMenu(true)}><Menu size={22} /></button><strong>{current.label}</strong></header>
      <main className="a-main" id="main">
        {error && <p className="a-error" role="alert" style={{ marginBottom: 16 }}>{error} <button type="button" className="a-btn ghost small" onClick={load}><RefreshCw size={14} />Опитай отново</button></p>}
        {section === 'dashboard' ? <Dashboard items={items} messages={messages} loading={loading} go={go} create={create} onBulk={() => setBulk({ n: Date.now() })} />
          : section === 'inbox' ? <InboxView messages={messages} />
            : <EntryList key={section} kind={section} items={items.filter(e => e.kind === section)} loading={loading} onNew={() => create(section)} onBulk={() => setBulk({ n: Date.now() })} onNewIn={category => create('document', category)} onBulkIn={(category, files) => setBulk({ category, files, n: Date.now() })} go={go} onEdit={e => setEditing({ entry: { ...e }, isNew: false })} onDelete={setRemoving} />}
      </main>
    </div>
    {editing && <EntryEditor key={editing.entry.id} entry={editing.entry} isNew={editing.isNew} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} onDelete={setRemoving} />}
    <BulkUpload key={bulk?.n ?? 0} open={bulk !== null} initialCategory={bulk?.category} initialFiles={bulk?.files} onClose={() => setBulk(null)} onDone={() => { load(); if (section !== 'document') go('document'); }} />
    <AlertDialog open={!!removing} onOpenChange={o => { if (!o) setRemoving(null); }}>
      <AlertDialogContent style={{ fontFamily: 'var(--font-body)' }}>
        <AlertDialogTitle>Да изтрия ли „{removing?.title}“?</AlertDialogTitle>
        <AlertDialogDescription>Записът ще изчезне от сайта и от администрацията. Това действие не може да бъде отменено. Ако искате само да го скриете, използвайте „Скрий (чернова)“.</AlertDialogDescription>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}><button type="button" className="a-btn ghost" onClick={() => setRemoving(null)}>Отказ</button><button type="button" className="a-btn danger" onClick={() => removing && remove(removing)}><Trash2 size={16} />Изтрий</button></div>
      </AlertDialogContent>
    </AlertDialog>
    <PasswordDialog open={profile} onClose={() => setProfile(false)} />
  </div>;
}

function Dashboard({ items, messages, loading, go, create, onBulk }: { items: Entry[]; messages: Message[]; loading: boolean; go: (k: SectionKey) => void; create: (kind: string) => void; onBulk: () => void }) {
  const year = currentYear();
  const docsThisYear = items.filter(e => e.kind === 'document' && e.year === year).length;
  const drafts = items.filter(e => !e.published).length;
  const recent = [...items].filter(e => listKinds.includes(e.kind as SectionKey)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  return <>
    <div className="a-head"><div><h1>Добре дошли 👋</h1><p>Какво искате да направите днес?</p></div></div>
    <div className="a-quick">
      <button type="button" onClick={onBulk}><UploadCloud /><div><strong>Качи документи</strong><span>Много PDF файла наведнъж, с подпис</span></div></button>
      <button type="button" onClick={() => create('news')}><Newspaper /><div><strong>Нова новина</strong><span>Текст и галерия със снимки</span></div></button>
      <button type="button" onClick={() => go('inbox')}><InboxIcon /><div><strong>Входящи съобщения</strong><span>{messages.length ? messages.length + ' от формата за контакт' : 'Няма нови съобщения'}</span></div></button>
    </div>
    <div className="a-year-banner"><CalendarCheck size={26} /><p>Текуща учебна година: <strong>{year}</strong> · {loading ? '…' : docsThisYear === 0 ? 'все още няма качени документи' : docsThisYear + (docsThisYear === 1 ? ' документ' : ' документа')}{drafts > 0 && ` · ${drafts} ${drafts === 1 ? 'чернова' : 'чернови'}`}</p></div>
    <div className="a-stats">{sections.filter(s => ['news', 'document', 'admission', 'schedule'].includes(s.key)).map(s => <button type="button" className="a-stat" key={s.key} onClick={() => go(s.key)}><s.icon /><div><strong>{loading ? '–' : items.filter(e => e.kind === s.key).length}</strong><span>{s.label}</span></div></button>)}</div>
    <section className="a-card"><h2 className="a-section-title">Последни записи</h2>
      {recent.length ? <ul className="a-list">{recent.map(e => <li className="a-row" key={e.id} style={{ gridTemplateColumns: '52px minmax(0,1fr) auto' }}><Thumb entry={e} /><div className="a-row-main" onClick={() => go(e.kind as SectionKey)}><strong>{e.title}</strong><span>{[sectionOf(e.kind).label, bgDate(e.date), e.year].filter(Boolean).join(' · ')}</span></div><Status entry={e} /></li>)}</ul>
        : <div className="a-empty">{loading ? 'Зареждане…' : 'Все още няма записи.'}</div>}
    </section>
  </>;
}

function EntryList({ kind, items, loading, onNew, onBulk, onNewIn, onBulkIn, go, onEdit, onDelete }: { kind: SectionKey; items: Entry[]; loading: boolean; onNew: () => void; onBulk: () => void; onNewIn: (category: string) => void; onBulkIn: (category: string, files?: File[]) => void; go: (k: SectionKey) => void; onEdit: (e: Entry) => void; onDelete: (e: Entry) => void }) {
  const s = sectionOf(kind);
  const [q, setQ] = useState(''), [year, setYear] = useState(''), [status, setStatus] = useState(''), [category, setCategory] = useState('');
  const years = [...new Set([...schoolYears(), ...items.map(e => e.year)])].sort().reverse();
  const categories = [...new Set(items.map(e => e.category).filter(Boolean))].sort();
  const needle = q.trim().toLowerCase();
  const shown = items.filter(e => (!year || e.year === year) && (!status || String(e.published) === status) && (!category || e.category === category) && (!needle || (e.title + ' ' + e.body + ' ' + e.category).toLowerCase().includes(needle)));
  const categoryLabel = (c: string) => kind === 'page' ? pageTargets[c] || c : kind === 'admission' ? c + ' клас' : kind === 'document' ? docCategoryLabel(c) : c;
  const row = (e: Entry) => <li className="a-row" key={e.id}>
        <Thumb entry={e} />
        <div className="a-row-main" onClick={() => onEdit(e)}><strong>{e.title}</strong><span>{[categoryLabel(e.category), e.year, bgDate(e.date)].filter(Boolean).join(' · ')}{attachmentsOf(e).length > 0 && <> · <ShieldCheck size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> {attachmentsOf(e).length} прикачени</>}</span></div>
        <Status entry={e} />
        <div className="a-row-actions">
          <button type="button" className="a-icon-btn" aria-label={'Редактирай ' + e.title} title="Редактирай" onClick={() => onEdit(e)}><Pencil size={17} /></button>
          {e.published === 1 && <a className="a-icon-btn" href={entryHref(e)} target="_blank" rel="noreferrer" aria-label={'Виж в сайта: ' + e.title} title="Виж в сайта"><ExternalLink size={17} /></a>}
          <button type="button" className="a-icon-btn danger" aria-label={'Изтрий ' + e.title} title="Изтрий" onClick={() => onDelete(e)}><Trash2 size={17} /></button>
        </div>
      </li>;
  return <>
    <div className="a-head"><div><h1>{s.label}</h1><p>{s.hint}</p></div>
      <div className="a-head-actions">{kind === 'document' && <button type="button" className="a-btn navy" onClick={onBulk}><UploadCloud size={17} />Качи много документи</button>}<button type="button" className="a-btn primary" onClick={onNew}><Plus size={17} />Добави {s.one}</button></div>
    </div>
    <section className="a-card">
      <div className="a-toolbar">
        <label className="a-search"><Search size={17} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Търсене…" aria-label={'Търсене в ' + s.label} /></label>
        <select className="a-select" value={year} onChange={e => setYear(e.target.value)} aria-label="Учебна година"><option value="">Всички години</option>{years.map(y => <option key={y}>{y}</option>)}</select>
        {kind !== 'document' && categories.length > 1 && <select className="a-select" value={category} onChange={e => setCategory(e.target.value)} aria-label="Категория"><option value="">Всички категории</option>{categories.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}</select>}
        <select className="a-select" value={status} onChange={e => setStatus(e.target.value)} aria-label="Статус"><option value="">Всички</option><option value="1">Публикувани</option><option value="0">Чернови</option></select>
      </div>
      {kind === 'document' ? <DocumentBoard docs={shown} loading={loading} filtering={!!(needle || year || status)} row={row} onAdd={onNewIn} onUpload={onBulkIn} go={go} />
        : shown.length ? <ul className="a-list">{shown.map(row)}</ul>
        : <div className="a-empty"><s.icon size={34} /><strong>{loading ? 'Зареждане…' : items.length ? 'Няма резултати' : 'Все още няма записи'}</strong>{!loading && (items.length ? 'Опитайте с друго търсене или филтър.' : <><span>Добавете първия запис в този раздел.</span><br /><button type="button" className="a-btn primary" onClick={onNew}><Plus size={17} />Добави {s.one}</button></>)}</div>}
      {kind !== 'document' && shown.length > 0 && <p className="a-count">Показани {shown.length} от {items.length}</p>}
    </section>
  </>;
}

// „Документи“ arranged as on the site: a tab per group, a button per section, then a box per subsection.
// Each box has „Добави“ and accepts dropped files, so the category is always chosen for the user.
function DocumentBoard({ docs, loading, filtering, row, onAdd, onUpload, go }: { docs: Entry[]; loading: boolean; filtering: boolean; row: (e: Entry) => React.ReactNode; onAdd: (category: string) => void; onUpload: (category: string, files?: File[]) => void; go: (k: SectionKey) => void }) {
  const [slug, setSlug] = useState(documentGroups[0].sections[0].slug);
  const inSection = (s: DocumentSection) => docs.filter(e => e.category === s.title || e.category.startsWith(s.title + ' / '));
  const other = docs.filter(e => otherDocumentCategories.includes(e.category) || !documentCategories.includes(e.category));
  const group = documentGroups.find(g => g.sections.some(s => s.slug === slug));
  const section = group?.sections.find(s => s.slug === slug);
  const legacy = [...new Set(other.map(e => e.category).filter(c => !otherDocumentCategories.includes(c)))];
  const boxes = section
    ? [...(section.items || []).map(item => ({ title: item, category: subCategory(section, item) })), { title: section.items ? 'Общо за раздела' : section.title, category: section.title }]
    : [...otherDocumentCategories, ...legacy].map(c => ({ title: c + (legacy.includes(c) ? ' (стара категория)' : ''), category: c }));
  const Icon = section ? sectionIcons[section.slug] || FileText : FileText;
  const groupCount = (sections: DocumentSection[]) => sections.reduce((n, s) => n + inSection(s).length, 0);
  return <div className="a-docs">
    <div className="a-docs-tabs" role="tablist" aria-label="Групи документи">
      {documentGroups.map(g => <button type="button" role="tab" key={g.title} aria-selected={group === g} onClick={() => setSlug(g.sections.find(s => !s.href)!.slug)}>{g.title}<span className="n">{groupCount(g.sections)}</span></button>)}
      <button type="button" role="tab" aria-selected={!group} onClick={() => setSlug('')}>Други<span className="n">{other.length}</span></button>
    </div>
    {group && <div className="a-docs-sections">{group.sections.map(s => {
      const SIcon = sectionIcons[s.slug] || FileText;
      if (s.href) return <button type="button" key={s.slug} className="linked" onClick={() => go(s.slug === 'priem' ? 'admission' : 'schedule')}><SIcon size={17} /><span>{s.title}<small>Отделна секция →</small></span></button>;
      const n = inSection(s).length;
      return <button type="button" key={s.slug} aria-pressed={slug === s.slug} onClick={() => setSlug(s.slug)}><SIcon size={17} /><span>{s.title}<small>{n === 0 ? 'Няма документи' : n === 1 ? '1 документ' : n + ' документа'}</small></span></button>;
    })}</div>}
    <div className="a-docs-main">
      <header className="a-docs-head"><span className="a-docs-icon"><Icon size={22} /></span><div><h2>{section ? section.title : 'Други страници'}</h2><p>{section ? section.note : 'Заявления, декларации, бюджет, стипендии и съветите.'}</p></div>{section && <a className="a-btn ghost small" href={'/documents/' + section.slug} target="_blank" rel="noreferrer"><ExternalLink size={15} />Виж в сайта</a>}</header>
      {boxes.map(b => {
        const list = docs.filter(e => e.category === b.category);
        if (filtering && !list.length) return null;
        return <DropBox key={b.category} title={b.title} count={list.length} onAdd={() => onAdd(b.category)} onFiles={files => onUpload(b.category, files)}>
          {list.length ? <ul className="a-list">{list.map(row)}</ul> : <p className="a-docs-empty"><UploadCloud size={18} />{loading ? 'Зареждане…' : 'Няма документи. Пуснете файлове тук или натиснете „Добави“.'}</p>}
        </DropBox>;
      })}
      {filtering && boxes.every(b => !docs.some(e => e.category === b.category)) && <p className="a-docs-empty">Няма резултати в този раздел.</p>}
    </div>
  </div>;
}

function DropBox({ title, count, onAdd, onFiles, children }: { title: string; count: number; onAdd: () => void; onFiles: (files: File[]) => void; children: React.ReactNode }) {
  const [over, setOver] = useState(false);
  return <section className={'a-docs-box' + (over ? ' over' : '')} onDragOver={e => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setOver(true); } }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false); }} onDrop={e => { e.preventDefault(); setOver(false); const files = Array.from(e.dataTransfer.files); if (files.length) onFiles(files); }}>
    <div className="a-docs-box-head"><strong>{title}</strong><span className="n">{count}</span>
      <button type="button" className="a-btn ghost small" onClick={() => onFiles([])}><UploadCloud size={15} />Качи файлове</button>
      <button type="button" className="a-btn primary small" onClick={onAdd}><Plus size={15} />Добави</button></div>
    {children}
    {over && <div className="a-docs-drop"><UploadCloud size={26} />Пуснете, за да качите в „{title}“</div>}
  </section>;
}

function Thumb({ entry }: { entry: Entry }) {
  const src = coverOf(entry);
  const Icon = sectionOf(entry.kind).icon;
  return <div className="a-thumb">{src && /\.(jpe?g|png|webp)(\?|$)/i.test(src) ? <img src={src} alt="" loading="lazy" /> : entry.kind === 'document' ? <FileText size={22} /> : <Icon size={22} />}</div>;
}
const Status = ({ entry }: { entry: Entry }) => entry.published ? <span className="a-badge live">Публикувано</span> : <span className="a-badge draft">Чернова</span>;

function InboxView({ messages }: { messages: Message[] }) {
  return <>
    <div className="a-head"><div><h1>Входящи</h1><p>Съобщения от формата за контакт в сайта. Отговорете директно по имейл или телефон.</p></div></div>
    <section className="a-card">{messages.length ? messages.map(m => <article className="a-message" key={m.id}>
      <header><h3>{m.first} {m.last}</h3><time>{new Date(m.created).toLocaleString('bg-BG')}</time></header>
      <div className="contact"><a href={'mailto:' + m.email}>{m.email}</a>{m.phone && <a href={'tel:' + m.phone}>{m.phone}</a>}</div>
      <p>{m.message}</p>
    </article>) : <div className="a-empty"><InboxIcon size={34} /><strong>Няма съобщения</strong>Когато някой пише през сайта, съобщението ще се появи тук.</div>}</section>
  </>;
}

function PasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const form = event.currentTarget, data = Object.fromEntries(new FormData(form));
    if (data.password !== data.confirm) { setError('Двете нови пароли не съвпадат.'); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/auth/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const d = await r.json() as { error?: string };
      if (!r.ok) throw new Error(d.error || 'Промяната не е успешна.');
      form.reset(); toast.success('Паролата е сменена. Другите сесии са прекратени.'); onClose();
    } catch (e) { setError(e instanceof Error ? e.message : 'Промяната не е успешна.'); } finally { setBusy(false); }
  }
  return <Dialog open={open} onOpenChange={o => { if (!o && !busy) { setError(''); onClose(); } }}>
    <DialogContent className="a-bulk" style={{ maxWidth: 460 }}>
      <DialogTitle>Смяна на парола</DialogTitle><DialogDescription>Новата парола трябва да е поне 12 знака.</DialogDescription>
      <form className="contact-form" onSubmit={submit}><PasswordField label="Текуща парола" name="currentPassword" /><PasswordField label="Нова парола" name="password" autoComplete="new-password" minLength={12} /><PasswordField label="Повторете новата парола" name="confirm" autoComplete="new-password" minLength={12} />{error && <p className="a-error" role="alert">{error}</p>}<button className="a-btn primary" disabled={busy}>{busy ? 'Записване…' : 'Запази новата парола'}</button></form>
    </DialogContent>
  </Dialog>;
}
