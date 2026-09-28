import { LayoutDashboard, Newspaper, FileText, GraduationCap, Users, PanelsTopLeft, CalendarDays, UtensilsCrossed, Inbox, type LucideIcon } from 'lucide-react';
import { currentYear, documentCategories, type Entry } from '@/lib/content';

export type SectionKey = 'dashboard' | 'news' | 'document' | 'admission' | 'team' | 'page' | 'schedule' | 'menu' | 'inbox';
export type Section = { key: SectionKey; label: string; icon: LucideIcon; one?: string; hint?: string };
export const sections: Section[] = [
  { key: 'dashboard', label: 'Табло', icon: LayoutDashboard },
  { key: 'news', label: 'Новини', icon: Newspaper, one: 'новина', hint: 'Събития и обявления със снимки.' },
  { key: 'document', label: 'Документи', icon: FileText, one: 'документ', hint: 'Всеки документ се показва в избрания раздел на страницата „Документи“ в сайта.' },
  { key: 'admission', label: 'Прием', icon: GraduationCap, one: 'информация за прием', hint: 'График, план-прием и документи за I, V, VIII и XI клас.' },
  { key: 'team', label: 'Екип', icon: Users, one: 'член на екипа', hint: 'Допълнителни хора към списъка на страницата „Екип“.' },
  { key: 'page', label: 'Страници', icon: PanelsTopLeft, one: 'текст за страница', hint: 'Текстове за „Родители“, „Стипендии“, съветите и „Бюджет“.' },
  { key: 'schedule', label: 'Разписание', icon: CalendarDays, one: 'разписание', hint: 'Седмично разписание по класове.' },
  { key: 'menu', label: 'Меню', icon: UtensilsCrossed, one: 'меню', hint: 'Седмично ученическо меню.' },
  { key: 'inbox', label: 'Входящи', icon: Inbox, hint: 'Съобщения от формата за контакт.' },
];
export const toSection = (s: string | null | undefined): SectionKey => sections.some(x => x.key === s) ? s as SectionKey : 'dashboard';
export const sectionOf = (key: string) => sections.find(s => s.key === key) || sections[0];
export const pageTargets: Record<string, string> = { '/parents': 'За родителите', '/scholarships': 'Стипендии', '/council/students': 'Ученически съвет', '/council/public': 'Обществен съвет', '/budget': 'Бюджет' };
export const newsCategories = ['Училищен живот', 'Постижения', 'Обявления', 'Проекти', 'STEM', 'Спорт', 'Празници'];
export const today = () => new Date().toISOString().slice(0, 10);
export const bgDate = (iso: string) => /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split('-').reverse().join('.') : iso;

export function blank(kind: string): Entry {
  const category: Record<string, string> = { news: 'Училищен живот', document: documentCategories[0], admission: '1', schedule: 'I', page: '/parents' };
  return { id: crypto.randomUUID(), kind, title: '', body: '', category: category[kind] || '', year: currentYear(), date: today(), image: '', file: '', source: '', details: '', gallery: '', attachments: '', published: 0 };
}
