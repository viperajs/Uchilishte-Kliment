// Imports a school-year document archive (folders named "Начало на 2023 - 2024 уч.г. …") into the site.
// Files are copied to public/archive/<year>/ under ASCII paths and listed in lib/archive.json;
// the original Bulgarian file names are kept for downloads.
//   node scripts/import-archive.mjs "<extracted archive folder>" ["<folder>" …]
// Re-importing a year replaces that year. Documents with personal data of individual students
// (support teams, individual education plans and programmes) are withheld and only counted, unless
// their data has been erased and the file name says so: "… (без лични данни).docx".
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import path from 'node:path';

const DATA = 'lib/archive.json', PUBLIC = 'public/archive';
const EXTENSIONS = new Set(['doc', 'docx', 'pdf', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'rtf']);
const PERSONAL = /ЕПЛР|Индивид|ИУП (за|без)|ИУП - СОП|ИУП СОП|допълнителна подкрепа/;
const STAFF_ONLY = /Коорд/; // coordinator appointments name staff members only
const ANONYMIZED = /\(без лични данни\)/;

const cyr = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ь: 'y', ю: 'yu', я: 'ya', ѝ: 'i' };
const slug = (s, max = 70) => {
  const x = s.toLowerCase().replace(/[а-яѝ]/g, c => cyr[c]).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return (x.length > max ? x.slice(0, max + 1).replace(/-[^-]*$/, '') : x) || 'document';
};

// Latin letters typed inside Bulgarian words ("лицe", "5 a клас").
const lookalike = { a: 'а', e: 'е', o: 'о', p: 'р', c: 'с', x: 'х', y: 'у', A: 'А', B: 'В', E: 'Е', K: 'К', M: 'М', H: 'Н', O: 'О', P: 'Р', C: 'С', T: 'Т', X: 'Х' };
const isCyr = ch => /[А-Яа-яЁёѝЍ]/.test(ch || '');
const fixLatin = s => s.replace(/[A-Za-z]+/g, (w, i) => {
  if (![...w].every(ch => lookalike[ch])) return w;
  const near = isCyr(s[i - 1]) || isCyr(s[i + w.length]);
  const classLetter = w.length === 1 && /\d\s*$/.test(s.slice(0, i)) && /^\s*кл/.test(s.slice(i + 1));
  return near || classLetter ? [...w].map(ch => lookalike[ch]).join('') : w;
});

const TYPOS = [['безопастност', 'безопасност'], ['заседнаията', 'заседанията'], ['учиилище', 'училище'], ['правенция', 'превенция'], [' нз ', ' на '], ['Комиисия', 'Комисия'], ['кординантора', 'координатора'], ['образовани е', 'образование'], ['- оред.', '- опред.'], ['Иларон', 'Иларион'], ['Цвтанова', 'Цветанова']];

// School years become "2023/2024", other periods "2020–2028".
const years = s => s.replace(/(20\d\d)\s*([-–]|\s)\s*(20\d\d)/g, (m, a, sep, b) => (+b === +a + 1 ? `${a}/${b}` : sep.trim() ? `${a}–${b}` : m));

export function tidy(raw) {
  let s = fixLatin(raw.normalize('NFC').replace(/\s+/g, ' ').trim());
  for (const [a, b] of TYPOS) s = s.replaceAll(a, b);
  s = years(s)
    .replace(/уч\s*\.\s*\.?\s*г(од)?\s*\.?\.?(?=\s|,|$)/g, 'уч. г.')
    .replace(/уч\s*\.\s*$/, 'уч. г.')
    .replace(/(\d{4})\s+уч\.?\s*г\b\.?/g, '$1 уч. г.')
    .replace(/\bг\s*\.\s*\.+/g, 'г.')
    .replace(/\s+,/g, ',')
    .replace(/(План|план)\s*-\s*(графици|график|програма)/g, '$1-$2')
    .replace(/(санитарно|Худож\.|Худ\.)\s*-\s*/g, '$1-')
    .replace(/(\d)\s*-\s*(\d)/g, '$1–$2')
    .replace(/\s+-\s+|\s+-(?=\S)|(?<=\S)-\s+/g, ' – ')
    .replace(/\.{2,}$/, '.');
  return s.replace(/\s+/g, ' ').trim();
}

// Folder names without the school year, as shown on the site.
const FOLDERS = [
  [/^Документация за началото на/, 'Документация'],
  [/^Заповеди - начало на/, 'Заповеди'],
  [/^Работни материали за началото на/, 'Работни материали'],
  [/^Планове на МО/, 'Планове на методическите обединения (МО)'],
  [/^Планове на ЕКК/, 'Планове на екипите за ключови компетентности (ЕКК)'],
  [/^УУП и ИУП/, 'Училищни учебни планове (УУП)'],
  [/^Работни материали за УУП/, 'Работни материали за УУП'],
  [/^Рамкови учебни планове/, 'Рамкови учебни планове'],
  [/^Нова Стратегия за период (\d{4})\s*-\s*(\d{4})/, 'Нова стратегия за периода $1–$2 г.'],
  [/^ИУП - СОП/, 'Индивидуални учебни планове'],
  [/^Заповеди\s*-?\s*(План )?БДП/, 'Безопасност на движението по пътищата (БДП)'],
  [/^Заповеди\s*-?\s*БАК/, 'Защита при бедствия, аварии и катастрофи (БАК)'],
  [/^Заповеди\s*-?\s*пожарна/, 'Пожарна безопасност'],
  [/^Заповеди\s*-?\s*пътуващи ученици/, 'Пътуващи ученици'],
  [/^Заповеди\s*-?\s*(приобщаващо образов|СОП)/, 'Приобщаващо образование'],
  [/^Заповеди\s*-?\s*седмично разписание/, 'Седмично разписание'],
  [/^Заповеди\s*-?\s*утв\. Графици/, 'Графици – първи учебен срок'],
  [/^Заповеди\s*-?\s*утв\. Списъци на приети/, 'Приети ученици в I, V и VIII клас'],
  [/^Заповеди\s*-?\s*утв\. Учебни програми/, 'Учебни програми по ИМ от ПП и по ИУЧ'],
  [/^Заповеди\s*-?\s*утв\. УУП/, 'Утвърждаване на училищните учебни планове'],
];
function folderName(raw) {
  const s = raw.normalize('NFC').replace(/\s+/g, ' ').trim();
  for (const [re, name] of FOLDERS) {
    const m = s.match(re);
    if (m) return name.replace(/\$(\d)/g, (_, i) => m[i]);
  }
  return tidy(s.replace(/\s*(за\s+)?\d{4}\s*-\s*\d{4}\s*уч.*$/, ''));
}

// Section and sub-item of the documents section (lib/content.ts documentSections) for a document.
const word = w => new RegExp(`(?<![а-яa-z])${w}(?![а-яa-z])`);
const RULES = [
  [/етичен кодекс/, 'Етичен кодекс'],
  [/индивидуален учебен план|^иуп /, 'Учебни планове', 'Индивидуални учебни планове на ученици със СОП'],
  [/учебен план|учеб\. план|уч\. план|рамков уп|ууп|заглавна страница|нар\. ?4|бр\. часове/, 'Учебни планове', 'Училищни учебни планове'],
  [/стратеги/, 'Стратегия'],
  [/^пду/, 'Правилници', 'Правилник за дейността на училището (ПДУ)'],
  [/^пвтр|вътрешния трудов ред/, 'Правилници', 'Правилник за вътрешния трудов ред (ПВТР)'],
  [/буовт|збуот|бувот|безопасни условия/, 'Правилници', 'Правилник за БУВОТ'],
  [/правилник.*етика/, 'Правилници', 'Правилник на комисията по етика'],
  [/пропускателн/, 'Правилници', 'Правилник за пропускателния режим'],
  [/процедура.*санкции/, 'Процедури', 'Налагане на санкции'],
  [word('орес'), 'ОРЕС'],
  [/форми на обучение/, 'Форми на обучение'],
  [/дейности по интереси/, 'Дейности по интереси'],
  [/спортен календар/, 'Спортни дейности и календар'],
  [/дневен режим/, 'Дневен режим'],
  [/план-график за заседанията/, 'План-графици', 'Заседания на педагогическия съвет'],
  [/консултативната дейност/, 'План-графици', 'Консултативна дейност на педагогическия съветник'],
  [/квалификация/, 'Планове', 'План за квалификационната дейност'],
  [/годишен план|год\. план/, 'Планове', 'Годишен план'],
  [/контролната дейност на директора/, 'Планове', 'План за контролната дейност на директора'],
  [word('здуд'), 'Планове', 'План за контролната дейност на ЗДУД'],
  [word('укс'), 'Планове', 'План за дейността на училищния координационен съвет'],
  [/^план на (мо|екк)/, 'Планове', 'Планове на методическите обединения и ЕКК'],
  [/план-програма по бдп|график бдп/, 'План-програми', 'БДП'],
  [/^график|^седмичен график/, 'Графици'],
  [/пед\. съвет|педагогическия съветник/, 'Планове', 'План за дейността на педагогическия съветник'],
  [/цоуд/, 'Програми', 'ЦОУД'],
  [/гражданско|гзеио/, 'Програми', 'Гражданско, здравно, екологично и интеркултурно образование'],
  [/личностно/, 'Програми', 'Подкрепа за личностно развитие'],
  [/работа с родители/, 'Програми', 'Работа с родители'],
  [/^програма/, 'Програми'],
  [/^мерки|^план/, 'Планове'],
];
// Orders go to "Заповеди", except the ones that are the only record of a schedule or of admission.
const ORDER_RULES = [
  [/седмично разписание/, 'Седмично разписание'],
  [/списък на приети/, 'Прием в I, V и VIII клас'],
  [/график на учебното време/, 'Графици'],
  [/утв\. график/, 'Графици', 'I срок'],
];
function section(title, folders) {
  const t = title.toLowerCase();
  if (folders[0] === 'Заповеди' || t.startsWith('заповед')) {
    const [, category, sub] = ORDER_RULES.find(([re]) => re.test(t)) || (/^Графици/.test(folders[1] || '') ? [, 'Графици', 'I срок'] : [, 'Заповеди']);
    return { category, sub };
  }
  const [, category = 'Други документи', sub] = RULES.find(([re]) => re.test(t)) || [];
  return { category, sub };
}

const collator = new Intl.Collator('bg', { numeric: true, sensitivity: 'base' });
const sortKey = name => fixLatin(name.normalize('NFC'));
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter(d => !d.name.startsWith('.') && d.name !== '__MACOSX')
    .sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || collator.compare(sortKey(a.name), sortKey(b.name)))
    .flatMap(d => d.isDirectory() ? walk(path.join(dir, d.name)).map(p => [d.name, ...p]) : [[d.name]]);
}

// Text of a .docx (word/document.xml) read straight from the ZIP container.
function docxText(buf) {
  const end = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) return '';
  for (let i = 0, p = buf.readUInt32LE(end + 16); i < buf.readUInt16LE(end + 10); i++) {
    const nameLength = buf.readUInt16LE(p + 28), next = p + 46 + nameLength + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
    if (buf.toString('utf8', p + 46, p + 46 + nameLength) === 'word/document.xml') {
      const offset = buf.readUInt32LE(p + 42), start = offset + 30 + buf.readUInt16LE(offset + 26) + buf.readUInt16LE(offset + 28);
      const raw = buf.subarray(start, start + buf.readUInt32LE(p + 20));
      const xml = (buf.readUInt16LE(p + 10) === 0 ? raw : inflateRawSync(raw)).toString('utf8');
      return xml.replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    }
    p = next;
  }
  return '';
}
// Bulgarian personal numbers (ЕГН) with a valid date and checksum; .doc text may be 8-bit or UTF-16.
function hasEgn(buf, text) {
  const candidates = [text, buf.toString('latin1'), buf.toString('utf16le')].join(' ').match(/(?<!\d)\d{10}(?!\d)/g) || [];
  return candidates.some(n => {
    const d = [...n].map(Number), month = +n.slice(2, 4) % 20, day = +n.slice(4, 6);
    const sum = [2, 4, 8, 5, 10, 9, 7, 3, 6].reduce((a, w, i) => a + w * d[i], 0) % 11 % 10;
    return +n.slice(2, 4) <= 52 && month >= 1 && month <= 12 && day >= 1 && day <= 31 && sum === d[9];
  });
}

function importYear(root) {
  const base = path.basename(path.resolve(root)).normalize('NFC');
  const m = base.match(/(\d{4})\s*-\s*(\d{4})/);
  if (!m) throw new Error(`Не е открита учебна година в името на папката: ${base}`);
  const year = `${m[1]}/${m[2]}`, yearSlug = `${m[1]}-${m[2]}`, ownYear = new RegExp(`${m[1]}\\s*-\\s*${m[2]}`);
  const files = [], withheld = [], duplicates = [], seen = new Map(), used = new Set();
  const candidates = walk(root).map(parts => {
    const name = parts.at(-1).normalize('NFC'), buf = readFileSync(path.join(root, ...parts));
    const text = name.toLowerCase().endsWith('.docx') ? docxText(buf) : '';
    return { parts, name, rel: parts.map(p => p.normalize('NFC')).join('/'), buf, text, ext: name.split('.').pop().toLowerCase() };
  }).filter(c => EXTENSIONS.has(c.ext));
  // Everything sent is published; the same file or text under another name is only reported for review.
  for (const c of candidates) {
    const key = c.text ? 'text:' + c.text : 'md5:' + createHash('md5').update(c.buf).digest('hex');
    const other = seen.get(key);
    if (!other) seen.set(key, c);
    else if (c.buf.equals(other.buf) || !ownYear.test(c.name) || !ownYear.test(other.name)) duplicates.push(`${c.rel} (= ${other.name})`);
  }
  rmSync(path.join(PUBLIC, yearSlug), { recursive: true, force: true });
  for (const { parts, name, rel, buf, text, ext } of candidates) {
    if ((PERSONAL.test(rel) && !STAFF_ONLY.test(name) && !ANONYMIZED.test(name)) || hasEgn(buf, text)) { withheld.push(rel); continue; }
    const folders = parts.slice(0, -1).map(folderName), stem = name.slice(0, -(ext.length + 1));
    const title = tidy(stem);
    const fileBase = slug(title.replace(/\s*уч\. г\./g, '')), dir = [yearSlug, ...folders.map(f => slug(f, 60))].join('/');
    let fileSlug = fileBase, n = 2;
    while (used.has(`${dir}/${fileSlug}.${ext}`)) fileSlug = `${fileBase}-${n++}`;
    const file = `${dir}/${fileSlug}.${ext}`;
    used.add(file);
    mkdirSync(path.join(PUBLIC, dir), { recursive: true });
    copyFileSync(path.join(root, ...parts), path.join(PUBLIC, file));
    const id = `arch-${m[1].slice(2)}${m[2].slice(2)}-${createHash('sha1').update(`${yearSlug}/${rel}`).digest('hex').slice(0, 10)}`;
    const { category, sub } = section(title, folders);
    files.push({ id, year, folders, title, category, ...(sub && { sub }), file: `/archive/${file}`, name, size: buf.length });
  }
  return { info: { year, slug: yearSlug, title: tidy(base), files: files.length, size: files.reduce((a, f) => a + f.size, 0), withheld: withheld.length }, files, withheld, duplicates };
}

const roots = process.argv.slice(2);
if (!roots.length) { console.error('Употреба: node scripts/import-archive.mjs "<папка с архив>" …'); process.exit(1); }
const data = existsSync(DATA) ? JSON.parse(readFileSync(DATA, 'utf8')) : { years: [], files: [] };
for (const root of roots) {
  const { info, files, withheld, duplicates } = importYear(root);
  data.years = [...data.years.filter(y => y.year !== info.year), info].sort((a, b) => b.year.localeCompare(a.year));
  data.files = [...data.files.filter(f => f.year !== info.year), ...files];
  console.log(`${info.year}: ${info.files} документа (${(info.size / 1e6).toFixed(1)} MB), ${withheld.length} не са публикувани поради лични данни:`);
  for (const w of withheld) console.log('  - ' + w);
  if (duplicates.length) console.log(`  Възможни дубликати (публикувани са; прегледайте ги):\n` + duplicates.map(d => '  = ' + d).join('\n'));
}
data.files.sort((a, b) => b.year.localeCompare(a.year));
writeFileSync(DATA, JSON.stringify(data, null, 1) + '\n');
