import { ArrowUpRight, FolderArchive } from 'lucide-react';
import { documentCategories, fileSize, type Entry } from '@/lib/content';
import { archiveFiles, archiveYears } from '@/lib/archive';

const count = (n: number) => n + (n === 1 ? ' документ' : ' документа');

export function ArchiveBanner() {
  return <a className="archive-banner" href="/documents/archive"><FolderArchive size={26} aria-hidden="true" /><span><strong>Архив на документите</strong>Документация и заповеди от началото на учебните {archiveYears.map(y => y.year).join(', ')} г. – подредени по години и раздели.</span><ArrowUpRight size={20} aria-hidden="true" /></a>;
}

export function ArchiveOverview({ entries }: { entries: Entry[] }) {
  const years = archiveYears.map(y => ({ ...y, list: archiveFiles(y.year, entries) }));
  const all = years.flatMap(y => y.list);
  const categories = documentCategories.map(c => [c, all.filter(f => f.category === c).length] as const).filter(([, n]) => n > 0);
  const withheld = archiveYears.reduce((a, y) => a + y.withheld, 0);
  return <div className="archive-overview">
    <p className="lead">Тук се съхраняват документацията и заповедите, изготвени в началото на всяка учебна година. Подредени са по години и раздели, както ги архивира училището. Всеки документ може да се изтегли поотделно, а цяла папка или година – като ZIP архив.</p>
    <div className="archive-year-grid">{years.map(y => {
      const sections = [...new Set(y.list.map(f => f.folders[0] || 'Други'))].map(name => [name, y.list.filter(f => (f.folders[0] || 'Други') === name).length] as const);
      return <a key={y.slug} className="archive-year-card" href={'/documents/archive/' + y.slug}>
        <span className="eyebrow">Учебна година</span>
        <h2>{y.year}</h2>
        <p>Начало на учебната година – документация и заповеди</p>
        <ul>{sections.map(([name, n]) => <li key={name}><span>{name}</span><strong>{n}</strong></li>)}</ul>
        <div className="archive-year-meta"><span>{count(y.list.length)} · {fileSize(y.list.reduce((a, f) => a + f.size, 0))}</span><span className="text-link">Отвори архива <ArrowUpRight size={17} /></span></div>
      </a>;
    })}</div>
    <h2 className="subheading">Търсите определен вид документ?</h2>
    <div className="archive-categories">{categories.map(([c, n]) => <a key={c} href={'/documents?category=' + encodeURIComponent(c) + '&year=' + encodeURIComponent('Всички години')}>{c}<span>{n}</span></a>)}</div>
    {withheld > 0 && <p className="notice archive-withheld">{count(withheld)} от архивите не са публикувани, защото съдържат лични данни на ученици (екипи за подкрепа за личностно развитие, индивидуални учебни планове и програми).</p>}
  </div>;
}
