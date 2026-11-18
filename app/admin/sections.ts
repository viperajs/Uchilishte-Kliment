import { LayoutDashboard, Newspaper, FileText, GraduationCap, Armchair, Users, UsersRound, PanelsTopLeft, CalendarDays, UtensilsCrossed, Inbox, type LucideIcon } from 'lucide-react';
import { currentYear, documentCategories, type Entry } from '@/lib/content';

// Each section lists the entries of the kind with the same name, except „За родители“: its entries are page texts for /parents.
export type SectionKey = 'dashboard' | 'news' | 'parents' | 'document' | 'admission' | 'places' | 'team' | 'page' | 'schedule' | 'menu' | 'inbox';
export type Section = { key: SectionKey; label: string; icon: LucideIcon; one?: string; hint?: string };
export const sections: Section[] = [
  { key: 'dashboard', label: 'Табло', icon: LayoutDashboard },
  { key: 'news', label: 'Новини', icon: Newspaper, one: 'новина', hint: 'Събития и обявления със снимки.' },
  { key: 'parents', label: 'За родители', icon: UsersRound, one: 'текст за родители', hint: 'Текстове за страницата „За родителите“ в сайта. Показват се под бързите връзки към дневника, менюто и разписанието.' },
  { key: 'document', label: 'Документи', icon: FileText, one: 'документ', hint: 'Всеки документ се показва в избрания раздел на страницата „Документи“ в сайта.' },
  { key: 'admission', label: 'Прием', icon: GraduationCap, one: 'информация за прием', hint: 'График, план-прием и документи за I, V, VIII и XI клас.' },
  { key: 'places', label: 'Свободни места', icon: Armchair, one: 'таблица със свободни места', hint: 'Незаетите места по класове и паралелки за страницата „Свободни места“. Обновявайте ги при всяка промяна.' },
  { key: 'team', label: 'Екип', icon: Users, one: 'член на екипа', hint: 'Допълнителни хора към списъка на страницата „Екип“.' },
  { key: 'page', label: 'Страници', icon: PanelsTopLeft, one: 'текст за страница', hint: 'Текстове за „Стипендии“, съветите и „Бюджет“.' },
  { key: 'schedule', label: 'Разписание', icon: CalendarDays, one: 'разписание', hint: 'Седмично разписание по класове.' },
  { key: 'menu', label: 'Меню', icon: UtensilsCrossed, one: 'меню', hint: 'Седмично ученическо меню.' },
  { key: 'inbox', label: 'Входящи', icon: Inbox, hint: 'Съобщения от формата за контакт.' },
];
export const toSection = (s: string | null | undefined): SectionKey => sections.some(x => x.key === s) ? s as SectionKey : 'dashboard';
export const sectionOf = (key: string) => sections.find(s => s.key === key) || sections[0];
export const parentsPage = '/parents';
export const sectionKeyOf = (e: Entry): SectionKey => e.kind === 'page' && e.category === parentsPage ? 'parents' : toSection(e.kind);
// Pages whose texts are edited in „Страници“.
export const pageTargets: Record<string, string> = { '/scholarships': 'Стипендии', '/council/students': 'Ученически съвет', '/council/public': 'Обществен съвет', '/budget': 'Бюджет' };
export const newsCategories = ['Училищен живот', 'Постижения', 'Обявления', 'Проекти', 'STEM', 'Спорт', 'Празници'];
export const today = () => new Date().toISOString().slice(0, 10);
export const bgDate = (iso: string) => /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split('-').reverse().join('.') : iso;

// A new entry for a section of the admin.
export function blank(section: string): Entry {
  const kind = section === 'parents' ? 'page' : section;
  const category: Record<string, string> = { news: 'Училищен живот', parents: parentsPage, document: documentCategories[0], admission: '1', schedule: 'I', page: Object.keys(pageTargets)[0] };
  return { id: crypto.randomUUID(), kind, title: kind === 'places' ? 'Свободни места ' + currentYear() : '', body: '', category: category[section] || '', year: currentYear(), date: today(), image: '', file: '', source: '', details: '', gallery: '', attachments: '', published: 0 };
}
