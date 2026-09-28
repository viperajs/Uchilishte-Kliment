export type Entry = {id:string;kind:string;title:string;body:string;category:string;year:string;date:string;image:string;file:string;source:string;details:string;gallery?:string;attachments?:string;published:number};
export type Attachment={name:string;url:string};
export const currentYear = (date = new Date()) => {const y=date.getMonth()>=8?date.getFullYear():date.getFullYear()-1;return `${y}/${y+1}`;};
// School years offered in the admin, newest first: from 2020/2021 (oldest archive on ohridski.eu) to next year.
export const schoolYears=(date=new Date())=>{const last=Number(currentYear(date).slice(0,4))+1;return Array.from({length:last-2020+1},(_,i)=>`${last-i}/${last-i+1}`);};
const parseList=<T>(value:string|undefined,valid:(x:unknown)=>x is T):T[]=>{try{const list:unknown=JSON.parse(value||'[]');return Array.isArray(list)?list.filter(valid):[];}catch{return [];}};
export const galleryOf=(e:Entry)=>parseList(e.gallery,(x):x is string=>typeof x==='string'&&x.length>0);
export const attachmentsOf=(e:Entry)=>parseList(e.attachments,(x):x is Attachment=>!!x&&typeof (x as Attachment).url==='string'&&typeof (x as Attachment).name==='string');
export const coverOf=(e:Entry)=>e.image||galleryOf(e)[0]||'';
export const mission='Създаваме възможно най-добрите условия за развитие на личността и потенциала на всеки ученик, така че той да постигне пълноценна трудова и социална интеграция. Предоставяме качествено образование, което формира креативни, социално отговорни и пълноценно интегрирани личности. Следваме принципите на истината, доброто, непрекъснатото лично усъвършенстване и успешната лична реализация.';
export const history=[['1907','Поставено е началото на Пещерската непълна смесена гимназия.'],['1922','Ново начало с 63 ученици.'],['1937','Свети Климент Охридски е избран за патрон.'],['1939','Училището става пълна смесена гимназия.'],['1940','Завършва първият випуск.'],['1957','Училището е наградено с орден „Кирил и Методий“, II степен.'],['1969','Създаден е първият в България електромеханичен клас-автомат КОМ-ПАК-69.'],['1979','Завършена е новата училищна сграда.'],['1982','Училището получава орден „Кирил и Методий“, I степен.'],['1984–1986','Навлизат компютрите и е оборудвана компютърна зала.'],['1995','Създаден е танцов ансамбъл „Славейче“.'],['2005 и 2010','Сградата е обновена и санирана.'],['2019','Обновено е техническото оборудване.'],['Днес','Развиваме STEM образование и обучение в направление „Софтуерни и хардуерни науки“.']];
// Разделите на „Документи“ (менюто и бързите бутони). Документ с категория „Раздел“ или „Раздел / Подраздел“ се показва в този раздел.
// Раздел с href води към отделна страница, която се управлява от своя секция в администрацията.
export type DocumentSection={slug:string;title:string;note?:string;items?:string[];href?:string};
export const documentSections:DocumentSection[]=[
 {slug:'uchebni-planove',title:'Учебни планове',note:'Училищни и индивидуални учебни планове.',items:['Училищни учебни планове','Индивидуални учебни планове на деца със СОП']},
 {slug:'strategiya',title:'Стратегия',note:'Стратегия за развитие на училището.'},
 {slug:'pravilnici',title:'Правилници',note:'ПДУ, ПВТР, БУВОТ, етика и пропускателен режим.',items:['Правилник за дейността на училището (ПДУ)','Правилник за вътрешния трудов ред (ПВТР)','Правилник за безопасни условия на възпитание, обучение и труд (БУВОТ)','Етичен правилник','Правилник за пропускателния режим']},
 {slug:'planove',title:'Планове',note:'Годишен план, контролна и квалификационна дейност.',items:['Годишен план','План за квалификационната дейност','План за контролната дейност на директора','План за контролната дейност на ЗДУД','План за дейността на координационния съвет','План на педагогическия съвет','План за приключване на I срок','План за приключване на учебната година']},
 {slug:'plan-grafici',title:'План-графици',note:'Педагогически съвет и консултации.',items:['Заседания на педагогическия съвет','Консултации на педагогическите специалисти']},
 {slug:'plan-programi',title:'План-програми',note:'Безопасност на движението по пътищата.',items:['Безопасност на движението по пътищата (БДП)']},
 {slug:'programi',title:'Програми',note:'ЦДО, подкрепа, родители и интереси.',items:['Целодневна организация на учебния ден','Гражданско, здравно, екологично и интеркултурно образование','Подкрепа за личностно развитие','Работа с родителите','Занимания по интереси']},
 {slug:'etichen-kodeks',title:'Етичен кодекс',note:'Етичен кодекс на училищната общност.'},
 {slug:'proceduri',title:'Процедури',note:'Процедура за налагане на санкции.',items:['Налагане на санкции']},
 {slug:'pravila',title:'Правила',note:'Правила за извиняване на отсъствия.',items:['За извиняване на отсъствия']},
 {slug:'mehanizmi',title:'Механизми',note:'Механизъм за работа с родителите.',items:['За работа с родителите']},
 {slug:'ukazaniya',title:'Указания',note:'Действия при случаи с наркотични вещества.',items:['Действия при наркотични вещества']},
 {slug:'ores',title:'ОРЕС',note:'Обучение от разстояние в електронна среда.'},
 {slug:'formi-na-obuchenie',title:'Форми на обучение',note:'Формите на обучение в училището.'},
 {slug:'deynosti-po-interesi',title:'Дейности по интереси',note:'Занимания по интереси за учениците.'},
 {slug:'sport',title:'Спортни дейности и календар',note:'Спортни дейности и спортен календар.'},
 {slug:'dneven-rezhim',title:'Дневен режим',note:'Разпределение на учебния ден.'},
 {slug:'grafici',title:'Графици',note:'Графици за I и II срок.',items:['I срок','II срок']},
 {slug:'olimpiadi',title:'Олимпиади',note:'Информация за ученическите олимпиади.'},
 {slug:'izpiti',title:'Изпити',note:'Графици и информация за изпитите.'},
 {slug:'priem',title:'Прием',note:'Прием в I, V и VIII клас.',href:'/admissions'},
 {slug:'razpisanie',title:'Седмично разписание',note:'Седмичното разписание по класове.',href:'/schedule'},
];
// Групи за горното меню и бързите бутони — всеки раздел е точно в една група.
const bySlug=(slug:string)=>documentSections.find(s=>s.slug===slug)!;
export const documentGroups=[
 {title:'Обучение',sections:['uchebni-planove','formi-na-obuchenie','ores','dneven-rezhim','grafici','razpisanie','izpiti'].map(bySlug)},
 {title:'Ученици',sections:['priem','deynosti-po-interesi','sport','olimpiadi'].map(bySlug)},
 {title:'Планове и програми',sections:['strategiya','planove','plan-grafici','plan-programi','programi'].map(bySlug)},
 {title:'Правилници',sections:['pravilnici','etichen-kodeks','pravila','proceduri','mehanizmi','ukazaniya'].map(bySlug)},
];
// Категории за документи към другите страници на сайта (Услуги, Бюджет, Стипендии, съветите).
export const otherDocumentCategories=['Заявления','Декларации','Бюджет','Стипендии','Ученически съвет','Обществен съвет'];
// Archive documents outside the sections (orders and working materials) — shown in „Архив по години“.
export const archiveOnlyCategories=['Заповеди','Други документи'];
export const subCategory=(s:DocumentSection,item:string)=>s.title+' / '+item;
export const documentCategories=[...documentSections.filter(s=>!s.href).flatMap(s=>[s.title,...(s.items||[]).map(i=>subCategory(s,i))]),...otherDocumentCategories];
export const sectionOfCategory=(category:string)=>documentSections.find(s=>!s.href&&(category===s.title||category.startsWith(s.title+' / ')));
export const documentSectionHref=(s:DocumentSection)=>s.href||'/documents/'+s.slug;
export const categoryLabel=(category:string)=>category.replace(' / ',' › ');
export const pages:Record<string,{title:string;description:string}>={
 '/':{title:'Начало',description:'Традиция, която гледа напред. Училището на знанието и възможностите в Пещера.'},
 '/school/mission':{title:'Нашата мисия',description:'Образование за утрешния ден. Възможности за развитие на всеки ученик.'},
 '/school/history':{title:'Повече от век история',description:'От първите класни стаи през 1907 г. до съвременната STEM среда.'},
 '/team':{title:'Нашият екип',description:'Хората, които превръщат знанието във вдъхновение.'},
 '/admissions':{title:'Прием на ученици',description:'Открийте следващата стъпка в образованието на Вашето дете.'},
 '/admissions/1':{title:'Прием в I клас',description:'Първите големи открития започват тук.'},
 '/admissions/5':{title:'Прием в V клас',description:'Нови знания и нови хоризонти.'},
 '/admissions/8':{title:'Прием в VIII клас',description:'Избери своята посока.'},
 '/admissions/11':{title:'Прием в XI клас',description:'Поглед към бъдещето.'},
 '/news':{title:'Новини и обявления',description:'Събития, постижения и важни моменти от живота на училището.'},
 '/documents':{title:'Документи',description:'Всички училищни документи, подредени по раздели.'},
 '/documents/archive':{title:'Архив на документите',description:'Документацията и заповедите от началото на предишните учебни години – подредени по години и раздели, готови за изтегляне.'},
 '/schedule':{title:'Седмично разписание',description:'Изберете клас и учебна година, за да видите публикуваното разписание.'},
 '/menu':{title:'Ученическо меню',description:'Седмично меню, дати и информация за алергените.'},
 '/scholarships':{title:'Стипендии',description:'Условия, срокове и необходими документи.'},
 '/parents':{title:'За родителите',description:'Полезна информация за всеки учебен ден.'},
 '/council/students':{title:'Ученически съвет',description:'Състав, дейности, решения и документи.'},
 '/council/public':{title:'Обществен съвет',description:'Заедно за развитието на училището.'},
 '/budget':{title:'Бюджет',description:'Прозрачност и отчетност. Финансови документи по години.'},
 '/services':{title:'Административни услуги',description:'Заявления и декларации за изтегляне.'},
 '/contacts':{title:'Свържете се с нас',description:'Тук сме, за да отговорим на Вашите въпроси.'},
 '/search':{title:'Търсене в сайта',description:'Намерете страници, новини, документи и информация за прием.'},
 '/privacy':{title:'Поверителност и бисквитки',description:'Как обработваме информацията, която споделяте с нас.'},
};
for(const s of documentSections)if(!s.href)pages['/documents/'+s.slug]={title:s.title,description:s.note||'Документи от раздел „'+s.title+'“.'};
export type NavItem={title:string;href?:string;items?:[string,string][]};
export const navigation:NavItem[]=[{title:'Начало',href:'/'},...documentGroups.map(g=>({title:g.title,items:g.sections.map(s=>[s.title,documentSectionHref(s)] as [string,string])})),{title:'Всички документи',href:'/documents'}];
export const useful=[['Министерство на образованието и науката','https://www.mon.bg/'],['Държавна агенция за закрила на детето','https://www.sacp.government.bg/'],['Национален образователен портал','https://start.e-edu.bg/'],['Електронен дневник Shkolo','https://app.shkolo.bg/']];
const base={kind:'news',category:'STEM',year:'2025/2026',file:'',details:'',published:1};
export const initialEntries:Entry[]=[{...base,id:'stem-opening',title:'Новият STEM център: бъдещето започва днес',date:'2026-06-09',body:'В училището е открит нов STEM център с кабинети по природни науки, предприемачество и информационни технологии. Учениците представят експерименти, дигитални проекти и предприемачески идеи. Новата среда създава възможности за практическо обучение, научни изследвания и работа в екип.',image:'/stem.jpg',source:'https://ohridski.eu/2026/06/09/%d0%be%d1%82%d0%ba%d1%80%d0%b8%d0%b2%d0%b0%d0%bd%d0%b5-%d0%bd%d0%b0-stem-%d1%86%d0%b5%d0%bd%d1%82%d1%8a%d1%80-2/'},{...base,id:'stem-invitation',title:'Покана за откриване на STEM центъра',date:'2026-05-27',body:'Публикувана е официална покана за откриването на училищния STEM център. Материалът е от учебната 2025/2026 година и се съхранява в архива.',image:'/school.jpg',source:'https://ohridski.eu/2026/05/27/%d0%be%d1%82%d0%ba%d1%80%d0%b8%d0%b2%d0%b0%d0%bd%d0%b5-%d0%bd%d0%b0-stem-%d1%86%d0%b5%d0%bd%d1%82%d1%8a%d1%80/'},{...base,id:'offers-2025',category:'Обявления',title:'Покана за представяне на оферти',date:'2025-09-02',body:'Архивна покана за представяне на оферти. Оригиналният документ е достъпен в официалната публикация на училището.',image:'/school.jpg',source:'https://ohridski.eu/2025/09/02/%d0%bf%d0%be%d0%ba%d0%b0%d0%bd%d0%b0-%d0%b7%d0%b0-%d0%bf%d1%80%d0%b5%d0%b4%d1%81%d1%82%d0%b0%d0%b2%d1%8f%d0%bd%d0%b5-%d0%bd%d0%b0-%d0%be%d1%84%d0%b5%d1%80%d1%82%d0%b8/'}];
export const fileSize=(bytes:number)=>bytes>=1e6?(bytes/1e6).toLocaleString('bg-BG',{maximumFractionDigits:1})+' MB':Math.max(1,Math.round(bytes/1e3))+' KB';
export const fileType=(url:string)=>{let name='';try{name=new URL(url,'https://local').pathname.split('/').pop()||'';}catch{}return name.includes('.')?name.split('.').pop()!.toUpperCase():'';};
// Name for a downloaded file: the document title without characters that file systems reject.
export const downloadName=(title:string,url:string)=>{const ext=fileType(url).toLowerCase();return title.replace(/[\\/:*?"<>|]+/g,'-').replace(/[.\s]+$/,'')+(ext?'.'+ext:'');};
// File size of archive documents, stored as JSON in details.
export const documentSize=(e:Entry)=>{try{return Number(JSON.parse(e.details||'{}').size)||0;}catch{return 0;}};
export function entryHref(e:Entry){return e.kind==='news'?'/news/'+e.id:e.kind==='admission'?'/admissions/'+e.category:e.kind==='team'?'/team':e.kind==='page'?e.category:documentHref(e);}
const otherDocumentPages:Record<string,string>={'Заявления':'/services?category=Заявления','Декларации':'/services?category=Декларации','Бюджет':'/budget','Стипендии':'/scholarships','Ученически съвет':'/council/students','Обществен съвет':'/council/public'};
function documentHref(e:Entry){const s=sectionOfCategory(e.category);return s?'/documents/'+s.slug+'?q='+encodeURIComponent(e.title):otherDocumentPages[e.category]||(e.file.startsWith('/archive/')?'/documents/archive/'+e.year.replace('/','-')+'?q='+encodeURIComponent(e.title):'/documents?q='+encodeURIComponent(e.title));}
initialEntries.push({id:'schedule-archive-2025',kind:'document',title:'Седмично разписание — табло на класовете',body:'Официален архивен документ, публикуван през февруари 2026 г. Не използвайте като актуално разписание.',category:'Графици',year:'2025/2026',date:'',file:'/schedule-2025-2026.pdf',image:'',source:'https://ohridski.eu/седмично-разписание/',details:'',published:1},{id:'application-archive-2021',kind:'document',title:'Заявление-декларация за записване в I клас',body:'Архивен образец за учебната 2021/2022 година. Предназначен е за справка, а не за текущия прием.',category:'Заявления',year:'2021/2022',date:'',file:'/application-2021-2022.docx',image:'',source:'https://ohridski.eu/заявления/',details:'',published:1});
export type TeamMember={name:string;role:string;email:string;group:TeamGroup;photo?:string};
export type TeamGroup='Ръководство'|'Педагогически екип'|'Администрация'|'Помощен персонал';
export const teamGroups:TeamGroup[]=['Ръководство','Педагогически екип','Администрация','Помощен персонал'];
// Staff photos: put the file in public/team/ and add a line here, keyed by the part of the email before @.
// Example: 'radka.ibisheva':'/team/radka.ibisheva.jpg'. People without a photo show their initials.
export const teamPhotos:Record<string,string>={};
const t=(group:TeamGroup,rows:[string,string,string][])=>rows.map(([name,role,email])=>({name,role,email:email+'@edu.mon.bg',group,photo:teamPhotos[email]}));
export const team:TeamMember[]=[
 ...t('Ръководство',[['Павлинка Антониева Шопова-Начкова','Директор','pavlinka.shopova-nachkova'],['Радка Лазарова Попова','Заместник-директор','radka.ibisheva']]),
 ...t('Педагогически екип',[['Айрие Нуреттин Пехливан','Начален учител','ayrie.pehlivan'],['Айлин Емин Павлова','Учител по английски език','ailin.pavlova'],['Анастасия Викторова Мераклиева','Учител по физика и математика','anastasia.meraklieva'],['Аксиния Петкова Попова','Начален учител','aksinia.popova'],['Събка Божидарова Ковачева','Учител по български език','sabka.kovacheva'],['Георги Иванов Шопов','Учител по физическо възпитание и спорт','georgi.iv.shopov1'],['Гергана Веселинова Ангелчова','Учител по история и география','gergana.angelchova'],['Дамяна Иванова Райкова-Янева','Учител ГЦОУД','damiana.raikova'],['Димка Николова Герджикова','Учител по математика','dimka.gerdzhikova'],['Евгения Ангелова Дамянова','Учител ГЦОУД','evgenia.a.damianova'],['Елена Тодорова Гивечева-Михова','Педагогически съветник','elena.t.givecheva'],['Елена Николова Доркова','Учител ГЦОУД','elena.dorkova'],['Илиана Росенова Пейковска','Учител по химия','iliana.peykovska'],['Кристина Руменова Хаджиева','Учител ГЦОУД','kristina.hadzhieva'],['Христина Огнянова Илинчева','Учител ГЦОУД','hristina.ilincheva'],['Мария Иванова Стоименова','Учител по музика','maria.iv.stoimenova'],['Мария Михайлова Атанасова','Учител по информационни технологии','maria.mi.atanasova'],['Милена Георгиева Балтаджиева','Учител по изобразително изкуство','milena.baltadzhieva'],['Милен Николаев Бараков','Учител ГЦОУД','milen.ni.barakov'],['Нина Стоева Гемджиян','Начален учител','nina.gemdzhiian'],['Нели Илиева Славова','Учител по български език','neli.il.slavova'],['Ивелина Георгиева Димитрова','Начален учител ГЦОУД','ivelina.ge.dimitrova1'],['Петя Иванова Георгиева','Учител по биология','petya.iv.georgieva1'],['Екатерина Христова','Учител по английски език','ekaterina.iv.hristova'],['Николай Георгиев Щерев','Учител по физическо възпитание и спорт','nikolai.shcherev'],['Христина Костадинова Хаджиева','Учител по история и география','hristina.hadzhieva'],['Цветка Павлова Петкова','Учител по български език','tsvetka.petkova'],['Юсуф Ахмедов Мехмедов','Учител по информационни технологии','yusuf.mehmedov']]),
 ...t('Администрация',[['Цветана Стоянова Кънчева','Счетоводител','tsvetana.kancheva'],['Мария Петрова Цветанова','Завеждащ административна служба','mariia.pe.tsvetanova'],['Сузана Илианова Денисова','Домакин','suzana.denisova']]),
 ...t('Помощен персонал',[['Нели Димитрова Благоева','Хигиенист','neli.di.blagoeva'],['Даниела Димитрова Босева','Хигиенист','daniela.boseva'],['Нина Атанасова Атанасова','Хигиенист','nina.at.atanasova'],['Райна Петрова Гюзелева','Хигиенист','rayna.gyuzeleva'],['Сезгин Юсеинова Веиз','Хигиенист','sezgin.veiz'],['Димитър Йорданов Мантаров','Огняр','dimitar.io.mantarov'],['Ясен Левентов Билянов','Работник поддръжка','iasen.bilianov']]),
];
