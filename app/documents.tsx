import { ArrowUpRight, FolderArchive, Search } from 'lucide-react';
import { documentMeta, documentSections, type Entry } from '@/lib/content';

const count = (n: number) => n + (n === 1 ? ' документ' : ' документа');
const href = (category: string) => '/documents?category=' + encodeURIComponent(category);

// The documents section as structured by the school: numbered sections with their sub-items.
export function DocumentSections({ entries }: { entries: Entry[] }) {
  const docs = entries.filter(e => e.kind === 'document');
  const total = (category: string, sub?: string) => docs.filter(e => e.category === category && (sub === undefined || documentMeta(e).sub === sub)).length;
  return <div className="document-sections">
    <form className="search-field site-search" action="/documents">
      <Search aria-hidden="true" />
      <input name="q" type="search" required aria-label="Търсене в документите" placeholder="Потърсете документ, напр. „правилник“ или „годишен план“" />
      <input type="hidden" name="year" value="Всички години" />
      <button className="btn green">Търси</button>
    </form>
    <ol className="section-grid">{documentSections.map(([category, subs]) => {
      const n = total(category);
      return <li key={category}><a className={'section-card' + (n ? '' : ' empty')} href={href(category)}>
        <h2>{category}</h2>
        {subs.length > 0 && <ul>{subs.map(sub => <li key={sub}><span>{sub}</span><small>{total(category, sub) || '–'}</small></li>)}</ul>}
        <span className="section-count">{n ? count(n) : 'Предстои публикуване'}<ArrowUpRight size={16} aria-hidden="true" /></span>
      </a></li>;
    })}</ol>
    <div className="section-extra">
      {['Заповеди', 'Други документи'].map(category => <a key={category} href={href(category)}><strong>{category}</strong><span>{count(total(category))}</span><ArrowUpRight size={18} aria-hidden="true" /></a>)}
      <a href="/documents/archive"><FolderArchive size={20} aria-hidden="true" /><strong>Архив по години</strong><span>по раздели и папки, с ZIP изтегляне</span><ArrowUpRight size={18} aria-hidden="true" /></a>
    </div>
  </div>;
}
