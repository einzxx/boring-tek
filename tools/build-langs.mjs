/* the boring tek — language build.

   the site is still one file a page. this reads `index.html`, which is the
   english page, and writes `ru/index.html` and `lv/index.html`: the same
   markup, the same stylesheet, the same script, with the text already painted
   in that language and `lang`, `canonical` and the og tags already set. it does
   the same for the tools hub, `tools/index.html`, into `ru/tools/` and
   `lv/tools/`, for the cleaner, `tools/clean/index.html`, into
   `ru/tools/clean/` and `lv/tools/clean/`, and for the link checker,
   `tools/check/index.html`, into `ru/tools/check/` and `lv/tools/check/`. it
   writes `sitemap.xml` too, so the twelve addresses are named in exactly one
   place, and the three stubs at the cleaner's old addresses (`/clean/`,
   `/ru/clean/`, `/lv/clean/`) that forward a shared link to the new ones.

   the pages keep their copy differently. the main page carries all three
   dictionaries in its own `T` and the build reads them out of it. the hub,
   the cleaner and the checker carry only english in their `T`; the russian
   and latvian live here, in `TOOLS`, `CLEAN` and `CHECK` below, and the build
   asserts each page's english against its `.en` before swapping the object
   in.

   why it exists: a page that paints itself in russian after the script runs is
   an english page to a crawler, and a hash is not an address. three documents
   at three urls is the only thing search understands. the source stays one
   file, so nothing has to be kept in step by hand.

     node tools/build-langs.mjs          write the folders
     node tools/build-langs.mjs --check  verify they match the source, write nothing

   this is tooling. it never ships, it has no dependencies, and it is the only
   thing that may write `ru/`, `lv/` and the three stubs under `clean/` — those
   are output, so editing them by hand is editing a build artifact and it will
   be overwritten.

   every replacement below asserts it matched exactly once. a rule that stops
   matching because the markup moved is a page that ships in the wrong language
   and looks fine, so a silent miss is the one failure mode worth throwing on.
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SRC = path.join(ROOT, 'index.html');
const SRC_TOOLS = path.join(ROOT, 'tools', 'index.html');
const SRC_CLEAN = path.join(ROOT, 'tools', 'clean', 'index.html');
const SRC_CHECK = path.join(ROOT, 'tools', 'check', 'index.html');
const SRC_PRIVACY = path.join(ROOT, 'privacy', 'index.html');
const CHECK_ONLY = process.argv.includes('--check');

const ORIGIN = 'https://theboringtek.com';
/* norwegian is bokmal: `nb` in `lang`, hreflang and the dictionaries, `/no/`
   in the address. every output path comes off these maps, never off the code. */
const LANGS = ['en', 'nb', 'ru', 'lv'];
const AT = { en: '/', nb: '/no/', ru: '/ru/', lv: '/lv/' };
const AT_TOOLS = { en: '/tools/', nb: '/no/tools/', ru: '/ru/tools/', lv: '/lv/tools/' };
const AT_CLEAN = { en: '/tools/clean/', nb: '/no/tools/clean/', ru: '/ru/tools/clean/', lv: '/lv/tools/clean/' };
const AT_CHECK = { en: '/tools/check/', nb: '/no/tools/check/', ru: '/ru/tools/check/', lv: '/lv/tools/check/' };
const AT_PRIVACY = { en: '/privacy/', nb: '/no/privacy/', ru: '/ru/privacy/', lv: '/lv/privacy/' };
/* where the cleaner lived until 2026-09-17. a stub at each forwards to the
   same language's new address, so a link somebody shared keeps working.
   norwegian came after the move, so it never had one. */
const AT_CLEAN_OLD = { en: '/clean/', ru: '/ru/clean/', lv: '/lv/clean/' };
const OG_LOCALE = { en: 'en_US', nb: 'nb_NO', ru: 'ru_RU', lv: 'lv_LV' };

/* the head copy. it is not painted by the page, so it does not live in `T` with
   the strings that are — it lives here, beside the thing that writes it. plain
   words, no brand voice tricks: a search result is read by someone who has not
   met us yet. title under 60, description under 155, both measured below.
   english is asserted against what `index.html` already carries, so the two
   cannot drift apart quietly. */
const SEO = {
  en: {
    title: 'ai agents and automation for business | the boring tek',
    desc: 'we build custom ai agents, backend systems and workflow automation for businesses. websites, apps and bots too. tell us what you need.',
  },
  nb: {
    title: 'ai og automatisering for bedrifter i Norge | the boring tek',
    desc: 'vi lager ai-agenter, backend og automatisering for bedrifter. nettsider og apper også. basert på Frøya i Trøndelag, vi jobber med bedrifter i hele Norge.',
  },
  ru: {
    title: 'ai агенты и автоматизация для бизнеса | the boring tek',
    desc: 'делаем ai агентов, бэкенд системы и автоматизацию процессов для бизнеса. сайты, приложения и боты тоже. напишите что вам нужно.',
  },
  lv: {
    title: 'ai aģenti un automatizācija biznesam | the boring tek',
    desc: 'būvējam ai aģentus, backend sistēmas un darba procesu automatizāciju biznesam. mājaslapas, aplikācijas un boti arī. pastāstiet ko jums vajag.',
  },
};
const SEO_TOOLS = {
  en: {
    title: 'free tools | the boring tek',
    desc: 'free browser tools by the boring tek. a watermark remover for ai text and files, and a link checker. nothing leaves your browser.',
  },
  nb: {
    title: 'gratis verktøy | the boring tek',
    desc: 'gratis verktøy i nettleseren fra the boring tek. fjern vannmerker fra ai-tekst og filer, og sjekk lenker. ingenting forlater nettleseren din.',
  },
  ru: {
    title: 'бесплатные инструменты | the boring tek',
    desc: 'бесплатные инструменты в браузере от the boring tek. удаление водяных знаков из текста и файлов ии и проверка ссылок. всё в браузере.',
  },
  lv: {
    title: 'bezmaksas rīki | the boring tek',
    desc: 'bezmaksas pārlūka rīki no the boring tek. ūdenszīmju noņemšana no mi teksta un failiem un saites pārbaude. nekas neaiziet no pārlūka.',
  },
};
/* the hub's copy. the english is the page's own `T`, repeated here so the
   build can assert the two agree; ru and lv exist only here. */
const TOOLS = {
  en: {
    h1: 'free tools',
    t_clean: 'watermark remover',
    d_clean: 'clean hidden ai marks from your text and files',
    t_check: 'link checker',
    d_check: 'see what is hiding in a link before you open it',
    open: 'open',
    home: 'home',
    privacy: 'privacy',
    th_dark: 'dark mode',
    th_light: 'light mode',
  },
  nb: {
    h1: 'gratis verktøy',
    t_clean: 'fjern vannmerker',
    d_clean: 'fjerner skjulte ai-merker fra teksten og filene dine',
    t_check: 'lenkesjekk',
    d_check: 'se hva som skjuler seg i en lenke før du åpner den',
    open: 'åpne',
    home: 'hjem',
    privacy: 'personvern',
    th_dark: 'mørk modus',
    th_light: 'lys modus',
  },
  ru: {
    h1: 'бесплатные инструменты',
    t_clean: 'удаление водяных знаков',
    d_clean: 'убирает скрытые метки ии из вашего текста и файлов',
    t_check: 'проверка ссылки',
    d_check: 'посмотрите, что скрыто в ссылке, до того как её открыть',
    open: 'открыть',
    home: 'главная',
    privacy: 'конфиденциальность',
    th_dark: 'тёмная тема',
    th_light: 'светлая тема',
  },
  lv: {
    h1: 'bezmaksas rīki',
    t_clean: 'ūdenszīmju noņemšana',
    d_clean: 'notīra slēptās mi zīmes no jūsu teksta un failiem',
    t_check: 'saites pārbaude',
    d_check: 'redziet, kas slēpjas saitē, pirms to atverat',
    open: 'atvērt',
    home: 'sākums',
    privacy: 'privātums',
    th_dark: 'tumšais režīms',
    th_light: 'gaišais režīms',
  },
};
const SEO_CLEAN = {
  en: {
    title: 'watermark remover for claude and chatgpt | the boring tek',
    desc: 'remove hidden watermarks from claude, chatgpt and other ai text: zero width characters, direction marks and file metadata. nothing leaves your browser.',
  },
  nb: {
    title: 'fjern vannmerker fra claude og chatgpt | the boring tek',
    desc: 'fjern skjulte vannmerker fra claude, chatgpt og annen ai-tekst: tegn med null bredde, retningstegn og metadata i filer. ingenting forlater nettleseren.',
  },
  ru: {
    title: 'удаление водяных знаков claude и chatgpt | the boring tek',
    desc: 'убирает скрытые водяные знаки из текста claude, chatgpt и других ии: символы нулевой ширины, знаки направления, метаданные файлов. всё в браузере.',
  },
  lv: {
    title: 'ūdenszīmju noņemšana claude un chatgpt | the boring tek',
    desc: 'noņem slēptās ūdenszīmes no claude, chatgpt un citu mi teksta: nulles platuma rakstzīmes, virziena zīmes un failu metadatus. nekas neaiziet no pārlūka.',
  },
};

/* the cleaner's copy. the english is the page's own `T`, repeated here so the
   build can assert the two agree; ru and lv exist only here. plural nouns are
   arrays: [one, many] in english, [one, few, many] in russian and latvian,
   picked by the page's own `plural()`. `{list}`, `{verb}`, `{n}`, `{a}` and
   `{b}` are filled at runtime. plain words, no dashes, same rules as the site. */
const CLEAN = {
  en: {
    h1: 'Watermark Remover for Claude, ChatGPT and more',
    say: 'drop a file here, or tap to pick one.',
    zone_label: 'drop a file, or press to pick one',
    ph: 'paste your text here',
    run: 'clean my text or file',
    ready: '{name} is in.',
    honest: 'this tool removes hidden marks from your text and files. it does not make text look human. no tool can promise an ai checker will pass or fail.',
    noscript: 'this tool runs in your browser and needs javascript on.',
    home: 'home',
    privacy: 'privacy',
    th_dark: 'dark mode',
    th_light: 'light mode',
    clean_none: 'already clean, nothing hidden found.',
    lbl_in: 'your text',
    lbl_out: 'clean text',
    found: 'found {list}, {verb}.',
    checked: 'checked again, {left}.',
    n_left: ['hidden mark left', 'hidden marks left'],
    and: 'and',
    v_removed: 'removed',
    v_replaced: 'replaced',
    v_fixed: 'fixed',
    n_hidden: ['hidden character', 'hidden characters'],
    n_space: ['odd space', 'odd spaces'],
    n_curly: ['curly mark', 'curly marks'],
    n_tag: ['metadata tag', 'metadata tags'],
    n_field: ['metadata field', 'metadata fields'],
    l_zero: 'zero width',
    l_soft: 'soft hyphens',
    l_dir: 'direction marks',
    l_vs: 'variation selectors',
    l_tag: 'tag characters',
    l_sep: 'invisible separators',
    l_sp: 'odd spaces',
    l_punct: 'curly marks',
    m_icc: 'icc profile',
    m_c2pa: 'c2pa manifest',
    m_text: 'text chunks',
    m_comment: 'comments',
    m_time: 'timestamp',
    reenc: 're encoded anyway, so the copy carries nothing at all',
    chk_ok: 'checked the copy: nothing left',
    chk_left: 'checked the copy: {n} left, this browser wrote them back',
    saved_as: 'saved as {a}, this browser cannot write {b}',
    info_fields: 'info fields',
    docprops: 'document properties',
    supported: 'i read text, png, jpg, webp, pdf and docx.',
    e_other: 'this file type is not supported yet.',
    e_nolib: 'could not fetch the tool for this file type. check the connection and try again.',
    e_locked: 'this pdf is locked. i cannot open it.',
    e_badpdf: 'this pdf will not open. it may be damaged.',
    e_decode: 'this image will not decode.',
    e_encode: 'could not re encode this image. it may be too large for this browser.',
    e_canvas: 'this browser cannot draw the image.',
    e_empty: 'nothing to clean yet. paste text or drop a file.',
    dl: 'download clean file',
    cp: 'copy',
    copied: 'copied',
    nocopy: 'could not copy',
    clear: 'clear all',
  },
  nb: {
    h1: 'Fjern vannmerker fra Claude, ChatGPT og flere',
    say: 'slipp en fil her, eller trykk for å velge en.',
    zone_label: 'slipp en fil, eller trykk for å velge en',
    ph: 'lim inn teksten din her',
    run: 'rens teksten eller filen min',
    ready: '{name} er klar.',
    honest: 'dette verktøyet fjerner skjulte merker fra tekst og filer. det får ikke teksten til å virke menneskelig. ingen verktøy kan love hva en ai-sjekker kommer til å si.',
    noscript: 'dette verktøyet kjører i nettleseren og trenger javascript.',
    home: 'hjem',
    privacy: 'personvern',
    th_dark: 'mørk modus',
    th_light: 'lys modus',
    clean_none: 'allerede rent, fant ingenting skjult.',
    lbl_in: 'teksten din',
    lbl_out: 'ren tekst',
    found: 'fant {list}, {verb}.',
    checked: 'sjekket igjen, {left}.',
    n_left: ['skjult merke igjen', 'skjulte merker igjen'],
    and: 'og',
    v_removed: 'fjernet alt',
    v_replaced: 'byttet ut alt',
    v_fixed: 'fikset alt',
    n_hidden: ['skjult tegn', 'skjulte tegn'],
    n_space: ['rart mellomrom', 'rare mellomrom'],
    n_curly: ['typografisk tegn', 'typografiske tegn'],
    n_tag: ['metadatatagg', 'metadatatagger'],
    n_field: ['metadatafelt', 'metadatafelt'],
    l_zero: 'null bredde',
    l_soft: 'myke bindestreker',
    l_dir: 'retningstegn',
    l_vs: 'variantvelgere',
    l_tag: 'taggtegn',
    l_sep: 'usynlige skilletegn',
    l_sp: 'rare mellomrom',
    l_punct: 'typografiske tegn',
    m_icc: 'icc-profil',
    m_c2pa: 'c2pa-manifest',
    m_text: 'tekstbiter',
    m_comment: 'kommentarer',
    m_time: 'tidsstempel',
    reenc: 'kodet på nytt uansett, så kopien har ingenting med seg',
    chk_ok: 'sjekket kopien: ingenting igjen',
    chk_left: 'sjekket kopien: {n} igjen, denne nettleseren skrev dem tilbake',
    saved_as: 'lagret som {a}, denne nettleseren kan ikke lage {b}',
    info_fields: 'infofelt',
    docprops: 'dokumentegenskaper',
    supported: 'jeg leser tekst, png, jpg, webp, pdf og docx.',
    e_other: 'denne filtypen støttes ikke ennå.',
    e_nolib: 'fikk ikke hentet verktøyet for denne filtypen. sjekk nettet og prøv igjen.',
    e_locked: 'denne pdf-en er låst. jeg får ikke åpnet den.',
    e_badpdf: 'denne pdf-en vil ikke åpne seg. den kan være ødelagt.',
    e_decode: 'dette bildet lar seg ikke lese.',
    e_encode: 'fikk ikke kodet bildet på nytt. det kan være for stort for denne nettleseren.',
    e_canvas: 'denne nettleseren klarer ikke å tegne bildet.',
    e_empty: 'ingenting å rense ennå. lim inn tekst eller slipp en fil.',
    dl: 'last ned ren fil',
    cp: 'kopier',
    copied: 'kopiert',
    nocopy: 'fikk ikke kopiert',
    clear: 'tøm alt',
  },
  ru: {
    h1: 'Удаление водяных знаков для Claude, ChatGPT и других',
    say: 'перетащите файл сюда или нажмите, чтобы выбрать.',
    zone_label: 'перетащите файл или нажмите, чтобы выбрать',
    ph: 'вставьте текст сюда',
    run: 'почистить текст или файл',
    ready: '{name} на месте.',
    honest: 'этот инструмент убирает скрытые метки из текста и файлов. он не делает текст похожим на человеческий. ни один инструмент не может обещать, что проверка на ии пройдёт или нет.',
    noscript: 'этот инструмент работает прямо в браузере. без javascript он не запустится.',
    home: 'главная',
    privacy: 'конфиденциальность',
    th_dark: 'тёмная тема',
    th_light: 'светлая тема',
    clean_none: 'уже чисто, скрытых меток нет.',
    lbl_in: 'ваш текст',
    lbl_out: 'чистый текст',
    found: 'нашёл {list}, {verb}.',
    checked: 'проверил ещё раз, осталось {left}.',
    n_left: ['скрытая метка', 'скрытые метки', 'скрытых меток'],
    and: 'и',
    v_removed: 'всё убрал',
    v_replaced: 'всё заменил',
    v_fixed: 'всё поправил',
    n_hidden: ['скрытый символ', 'скрытых символа', 'скрытых символов'],
    n_space: ['необычный пробел', 'необычных пробела', 'необычных пробелов'],
    n_curly: ['типографский знак', 'типографских знака', 'типографских знаков'],
    n_tag: ['тег метаданных', 'тега метаданных', 'тегов метаданных'],
    n_field: ['поле метаданных', 'поля метаданных', 'полей метаданных'],
    l_zero: 'нулевая ширина',
    l_soft: 'мягкие переносы',
    l_dir: 'знаки направления',
    l_vs: 'селекторы вариантов',
    l_tag: 'символы тегов',
    l_sep: 'невидимые разделители',
    l_sp: 'необычные пробелы',
    l_punct: 'типографские знаки',
    m_icc: 'профиль icc',
    m_c2pa: 'манифест c2pa',
    m_text: 'текстовые блоки',
    m_comment: 'комментарии',
    m_time: 'метка времени',
    reenc: 'всё равно перекодировал, в копии ничего нет',
    chk_ok: 'проверил копию: ничего не осталось',
    chk_left: 'проверил копию: осталось {n}, этот браузер записал их обратно',
    saved_as: 'сохранено как {a}, этот браузер не умеет писать {b}',
    info_fields: 'поля info',
    docprops: 'свойства документа',
    supported: 'я читаю текст, png, jpg, webp, pdf и docx.',
    e_other: 'этот тип файла пока не поддерживается.',
    e_nolib: 'не удалось загрузить инструмент для этого типа файла. проверьте интернет и попробуйте ещё раз.',
    e_locked: 'этот pdf защищён паролем. я не могу его открыть.',
    e_badpdf: 'этот pdf не открывается. возможно, он повреждён.',
    e_decode: 'не могу прочитать эту картинку.',
    e_encode: 'не удалось перекодировать картинку. возможно, она слишком большая для этого браузера.',
    e_canvas: 'этот браузер не может нарисовать картинку.',
    e_empty: 'пока нечего чистить. вставьте текст или перетащите файл.',
    dl: 'скачать чистый файл',
    cp: 'копировать',
    copied: 'скопировано',
    nocopy: 'не удалось скопировать',
    clear: 'очистить всё',
  },
  lv: {
    h1: 'Ūdenszīmju noņemšana Claude, ChatGPT un citiem',
    say: 'ievelciet failu šeit vai nospiediet, lai to izvēlētos.',
    zone_label: 'ievelciet failu vai nospiediet, lai to izvēlētos',
    ph: 'ielīmējiet tekstu šeit',
    run: 'notīrīt tekstu vai failu',
    ready: '{name} ir šeit.',
    honest: 'šis rīks noņem slēptās zīmes no teksta un failiem. tas nepadara tekstu cilvēcīgāku. neviens rīks nevar solīt, ka mi pārbaude tiks izturēta vai nē.',
    noscript: 'šis rīks strādā tieši pārlūkā. bez javascript tas nedarbojas.',
    home: 'sākums',
    privacy: 'privātums',
    th_dark: 'tumšais režīms',
    th_light: 'gaišais režīms',
    clean_none: 'jau tīrs, slēptu zīmju nav.',
    lbl_in: 'jūsu teksts',
    lbl_out: 'tīrais teksts',
    found: 'te bija {list}, {verb}.',
    checked: 'pārbaudīju vēlreiz, palika {left}.',
    n_left: ['slēpta zīme', 'slēptas zīmes', 'slēptu zīmju'],
    and: 'un',
    v_removed: 'visu noņēmu',
    v_replaced: 'visu aizstāju',
    v_fixed: 'visu salaboju',
    n_hidden: ['slēpta rakstzīme', 'slēptas rakstzīmes', 'slēptu rakstzīmju'],
    n_space: ['neparasta atstarpe', 'neparastas atstarpes', 'neparastu atstarpju'],
    n_curly: ['tipogrāfiska zīme', 'tipogrāfiskas zīmes', 'tipogrāfisku zīmju'],
    n_tag: ['metadatu tags', 'metadatu tagi', 'metadatu tagu'],
    n_field: ['metadatu lauks', 'metadatu lauki', 'metadatu lauku'],
    l_zero: 'nulles platuma zīmes',
    l_soft: 'mīkstās defises',
    l_dir: 'virziena zīmes',
    l_vs: 'variāciju selektori',
    l_tag: 'tagu rakstzīmes',
    l_sep: 'neredzami atdalītāji',
    l_sp: 'neparastas atstarpes',
    l_punct: 'tipogrāfiskas zīmes',
    m_icc: 'icc profils',
    m_c2pa: 'c2pa manifests',
    m_text: 'teksta bloki',
    m_comment: 'komentāri',
    m_time: 'laika zīmogs',
    reenc: 'tik un tā pārkodēju, kopijā nekā nav',
    chk_ok: 'pārbaudīju kopiju: nekas nav palicis',
    chk_left: 'pārbaudīju kopiju: palika {n}, šis pārlūks tos ierakstīja atpakaļ',
    saved_as: 'saglabāts kā {a}, šis pārlūks neprot rakstīt {b}',
    info_fields: 'info lauki',
    docprops: 'dokumenta īpašības',
    supported: 'es lasu tekstu, png, jpg, webp, pdf un docx.',
    e_other: 'šis faila tips vēl nav atbalstīts.',
    e_nolib: 'neizdevās ielādēt rīku šim faila tipam. pārbaudiet internetu un mēģiniet vēlreiz.',
    e_locked: 'šim pdf ir parole. es nevaru to atvērt.',
    e_badpdf: 'šis pdf neatveras. iespējams, tas ir bojāts.',
    e_decode: 'nevaru nolasīt šo attēlu.',
    e_encode: 'neizdevās pārkodēt attēlu. iespējams, tas ir par lielu šim pārlūkam.',
    e_canvas: 'šis pārlūks nevar uzzīmēt attēlu.',
    e_empty: 'vēl nav ko tīrīt. ielīmējiet tekstu vai ievelciet failu.',
    dl: 'lejupielādēt tīro failu',
    cp: 'kopēt',
    copied: 'nokopēts',
    nocopy: 'neizdevās nokopēt',
    clear: 'notīrīt visu',
  },
};

/* ---------- house rules, enforced ---------- */

const SEO_CHECK = {
  en: {
    title: 'link checker | the boring tek',
    desc: 'paste a link and see what is hiding in it before you open it: the real address, lookalike letters, brand copies, shorteners. nothing leaves your browser.',
  },
  nb: {
    title: 'lenkesjekk | the boring tek',
    desc: 'lim inn en lenke og se hva som skjuler seg i den før du åpner: den ekte adressen, falske bokstaver, merkekopier, forkortere. alt skjer i nettleseren.',
  },
  ru: {
    title: 'проверка ссылки | the boring tek',
    desc: 'вставьте ссылку и посмотрите, что в ней скрыто, до того как открыть: настоящий адрес, похожие буквы, подделки брендов, сокращатели. всё в браузере.',
  },
  lv: {
    title: 'saites pārbaude | the boring tek',
    desc: 'ielīmējiet saiti un redziet, kas tajā slēpjas, pirms to atverat: īstā adrese, līdzīgi burti, zīmolu kopijas, saīsinātāji. nekas neaiziet no pārlūka.',
  },
};

/* the link checker's copy. the english is the page's own `T`, repeated here
   so the build can assert the two agree; ru and lv exist only here. the
   `k_` keys are the line labels, the `v_` keys the values after the comma,
   the `r_` keys the short reason on the summary pill. `{host}`, `{shown}`,
   `{scheme}`, `{a}`, `{word}`, `{brand}`, `{tld}`, `{url}` and `{reason}`
   are filled at runtime. plain words a kid or an old man reads in one go,
   no dashes, same rules as the site. */
const CHECK = {
  en: {
    h1: 'link checker',
    honest: 'we cannot say a link is safe. we can show you what looks wrong.',
    ph: 'paste the link here',
    run: 'check it',
    idle: 'paste a link above and press check it',
    bad_link: 'i cannot read this as a link. check it and try again.',
    k_addr: 'real address',
    v_addr_ok: 'the link goes to {host}',
    v_addr_at: 'the link goes to {host} but the text you pasted shows {shown}',
    v_addr_scheme: 'this is not a normal web link, it starts with {scheme}',
    k_https: 'https',
    v_https_ok: 'yes, it is encrypted',
    v_https_no: 'no, it is not encrypted',
    k_short: 'shortener',
    v_short_ok: 'no',
    v_short_no: 'yes, {host} hides where it really goes',
    k_look: 'lookalike letters',
    v_look_ok: 'none',
    v_look_no: 'found a letter that looks like {a} but is not, in the word {word}',
    v_look_mix: 'found letters from two alphabets in the word {word}',
    k_brand: 'brand copy',
    v_brand_ok: 'none',
    v_brand_no: 'it looks like {brand} but the real address is {host}',
    k_ip: 'ip address',
    v_ip_ok: 'no',
    v_ip_no: 'yes, a number instead of a name, that is unusual',
    k_odd: 'strange address',
    v_odd_ok: 'ok',
    o_long: 'very long',
    o_dots: 'many dots',
    o_dash: 'many dashes',
    o_tld: 'an unusual ending like {tld}',
    k_lists: 'known bad lists',
    v_lists: 'not checked yet, coming soon',
    last: 'if you did not expect this link, do not open it',
    s_ok: 'nothing found',
    s_warn: 'be careful',
    s_bad: 'danger',
    r_ok: 'nothing looks wrong here',
    r_addr: 'the address is not what it shows',
    r_scheme: 'this is not a normal web link',
    r_https: 'the link is not encrypted',
    r_short: 'the real address is hidden',
    r_look: 'a letter in the address is fake',
    r_brand: 'the address copies a known brand',
    r_ip: 'a number instead of a name',
    r_odd: 'the address looks strange',
    rep_link: 'link: {url}',
    rep_sum: 'result: {word}, {reason}',
    copy: 'copy report',
    copied: 'copied',
    nocopy: 'could not copy',
    again: 'check another link',
    noscript: 'this tool runs in your browser and needs javascript on.',
    home: 'home',
    privacy: 'privacy',
    th_dark: 'dark mode',
    th_light: 'light mode',
  },
  nb: {
    h1: 'lenkesjekk',
    honest: 'vi kan ikke si at en lenke er trygg. vi kan vise deg hva som ser feil ut.',
    ph: 'lim inn lenken her',
    run: 'sjekk den',
    idle: 'lim inn en lenke over og trykk sjekk den',
    bad_link: 'jeg klarer ikke å lese dette som en lenke. sjekk den og prøv igjen.',
    k_addr: 'ekte adresse',
    v_addr_ok: 'lenken går til {host}',
    v_addr_at: 'lenken går til {host}, men teksten du limte inn viser {shown}',
    v_addr_scheme: 'dette er ikke en vanlig nettlenke, den starter med {scheme}',
    k_https: 'https',
    v_https_ok: 'ja, den er kryptert',
    v_https_no: 'nei, den er ikke kryptert',
    k_short: 'lenkeforkorter',
    v_short_ok: 'nei',
    v_short_no: 'ja, {host} skjuler hvor den egentlig går',
    k_look: 'falske bokstaver',
    v_look_ok: 'ingen',
    v_look_no: 'fant en bokstav som ligner på {a}, men ikke er det, i ordet {word}',
    v_look_mix: 'fant bokstaver fra to alfabeter i ordet {word}',
    k_brand: 'merkekopi',
    v_brand_ok: 'ingen',
    v_brand_no: 'den ligner på {brand}, men den ekte adressen er {host}',
    k_ip: 'ip-adresse',
    v_ip_ok: 'nei',
    v_ip_no: 'ja, et tall i stedet for et navn, det er uvanlig',
    k_odd: 'rar adresse',
    v_odd_ok: 'ok',
    o_long: 'veldig lang',
    o_dots: 'mange punktum',
    o_dash: 'mange bindestreker',
    o_tld: 'en uvanlig endelse som {tld}',
    k_lists: 'kjente svartelister',
    v_lists: 'ikke sjekket ennå, kommer snart',
    last: 'hvis du ikke ventet denne lenken, ikke åpne den',
    s_ok: 'ingenting funnet',
    s_warn: 'vær forsiktig',
    s_bad: 'fare',
    r_ok: 'ingenting ser feil ut her',
    r_addr: 'adressen er ikke det den viser',
    r_scheme: 'dette er ikke en vanlig nettlenke',
    r_https: 'lenken er ikke kryptert',
    r_short: 'den ekte adressen er skjult',
    r_look: 'en bokstav i adressen er falsk',
    r_brand: 'adressen kopierer et kjent merke',
    r_ip: 'et tall i stedet for et navn',
    r_odd: 'adressen ser rar ut',
    rep_link: 'lenke: {url}',
    rep_sum: 'resultat: {word}, {reason}',
    copy: 'kopier rapporten',
    copied: 'kopiert',
    nocopy: 'fikk ikke kopiert',
    again: 'sjekk en annen lenke',
    noscript: 'dette verktøyet kjører i nettleseren og trenger javascript.',
    home: 'hjem',
    privacy: 'personvern',
    th_dark: 'mørk modus',
    th_light: 'lys modus',
  },
  ru: {
    h1: 'проверка ссылки',
    honest: 'мы не можем сказать, что ссылка безопасна. мы можем показать, что выглядит подозрительно.',
    ph: 'вставьте ссылку сюда',
    run: 'проверить',
    idle: 'вставьте ссылку выше и нажмите проверить',
    bad_link: 'не могу прочитать это как ссылку. проверьте и попробуйте ещё раз.',
    k_addr: 'настоящий адрес',
    v_addr_ok: 'ссылка ведёт на {host}',
    v_addr_at: 'ссылка ведёт на {host}, но в тексте, который вы вставили, видно {shown}',
    v_addr_scheme: 'это не обычная ссылка на сайт, она начинается с {scheme}',
    k_https: 'https',
    v_https_ok: 'да, соединение зашифровано',
    v_https_no: 'нет, соединение не зашифровано',
    k_short: 'сокращатель',
    v_short_ok: 'нет',
    v_short_no: 'да, {host} скрывает, куда ссылка ведёт на самом деле',
    k_look: 'похожие буквы',
    v_look_ok: 'нет',
    v_look_no: 'нашёл букву, которая похожа на {a}, но это не она, в слове {word}',
    v_look_mix: 'в слове {word} буквы из двух алфавитов',
    k_brand: 'подделка бренда',
    v_brand_ok: 'нет',
    v_brand_no: 'похоже на {brand}, но настоящий адрес {host}',
    k_ip: 'ip адрес',
    v_ip_ok: 'нет',
    v_ip_no: 'да, вместо имени цифры, это необычно',
    k_odd: 'странный адрес',
    v_odd_ok: 'всё в порядке',
    o_long: 'очень длинный',
    o_dots: 'много точек',
    o_dash: 'много дефисов',
    o_tld: 'необычное окончание {tld}',
    k_lists: 'списки опасных сайтов',
    v_lists: 'пока не проверяю, скоро',
    last: 'если вы не ждали эту ссылку, не открывайте её',
    s_ok: 'ничего не найдено',
    s_warn: 'будьте осторожны',
    s_bad: 'опасно',
    r_ok: 'ничего подозрительного',
    r_addr: 'адрес не тот, что показан',
    r_scheme: 'это не обычная ссылка',
    r_https: 'соединение не зашифровано',
    r_short: 'настоящий адрес скрыт',
    r_look: 'в адресе поддельная буква',
    r_brand: 'адрес копирует известный бренд',
    r_ip: 'вместо имени цифры',
    r_odd: 'адрес выглядит странно',
    rep_link: 'ссылка: {url}',
    rep_sum: 'итог: {word}, {reason}',
    copy: 'скопировать отчёт',
    copied: 'скопировано',
    nocopy: 'не удалось скопировать',
    again: 'проверить другую ссылку',
    noscript: 'этот инструмент работает прямо в браузере. без javascript он не запустится.',
    home: 'главная',
    privacy: 'конфиденциальность',
    th_dark: 'тёмная тема',
    th_light: 'светлая тема',
  },
  lv: {
    h1: 'saites pārbaude',
    honest: 'mēs nevaram teikt, ka saite ir droša. mēs varam parādīt, kas izskatās aizdomīgi.',
    ph: 'ielīmējiet saiti šeit',
    run: 'pārbaudīt',
    idle: 'ielīmējiet saiti augšā un nospiediet pārbaudīt',
    bad_link: 'nevaru to nolasīt kā saiti. pārbaudiet un mēģiniet vēlreiz.',
    k_addr: 'īstā adrese',
    v_addr_ok: 'saite ved uz {host}',
    v_addr_at: 'saite ved uz {host}, bet ielīmētajā tekstā redzams {shown}',
    v_addr_scheme: 'šī nav parasta saite uz lapu, tā sākas ar {scheme}',
    k_https: 'https',
    v_https_ok: 'jā, savienojums ir šifrēts',
    v_https_no: 'nē, savienojums nav šifrēts',
    k_short: 'saīsinātājs',
    v_short_ok: 'nē',
    v_short_no: 'jā, {host} slēpj, kurp saite ved patiesībā',
    k_look: 'līdzīgi burti',
    v_look_ok: 'nav',
    v_look_no: 'atradu burtu, kas izskatās kā {a}, bet tāds nav, vārdā {word}',
    v_look_mix: 'vārdā {word} ir burti no diviem alfabētiem',
    k_brand: 'zīmola kopija',
    v_brand_ok: 'nav',
    v_brand_no: 'izskatās kā {brand}, bet īstā adrese ir {host}',
    k_ip: 'ip adrese',
    v_ip_ok: 'nē',
    v_ip_no: 'jā, cipari vārda vietā, tas ir neparasti',
    k_odd: 'dīvaina adrese',
    v_odd_ok: 'viss kārtībā',
    o_long: 'ļoti gara',
    o_dots: 'daudz punktu',
    o_dash: 'daudz defišu',
    o_tld: 'neparasta beigu daļa {tld}',
    k_lists: 'bīstamo lapu saraksti',
    v_lists: 'vēl nepārbaudu, drīz',
    last: 'ja jūs šo saiti negaidījāt, neatveriet to',
    s_ok: 'nekas nav atrasts',
    s_warn: 'esiet uzmanīgi',
    s_bad: 'bīstami',
    r_ok: 'nekas aizdomīgs',
    r_addr: 'adrese nav tā, kas redzama',
    r_scheme: 'šī nav parasta saite',
    r_https: 'savienojums nav šifrēts',
    r_short: 'īstā adrese ir paslēpta',
    r_look: 'adresē ir viltots burts',
    r_brand: 'adrese kopē zināmu zīmolu',
    r_ip: 'cipari vārda vietā',
    r_odd: 'adrese izskatās dīvaini',
    rep_link: 'saite: {url}',
    rep_sum: 'rezultāts: {word}, {reason}',
    copy: 'kopēt atskaiti',
    copied: 'nokopēts',
    nocopy: 'neizdevās nokopēt',
    again: 'pārbaudīt citu saiti',
    noscript: 'šis rīks strādā tieši pārlūkā. bez javascript tas nedarbojas.',
    home: 'sākums',
    privacy: 'privātums',
    th_dark: 'tumšais režīms',
    th_light: 'gaišais režīms',
  },
};

const SEO_PRIVACY = {
  en: {
    title: 'privacy | the boring tek',
    desc: 'how the boring tek handles what you send through the contact form. what we collect, why, where it goes and how to have it deleted.',
  },
  nb: {
    title: 'personvern | the boring tek',
    desc: 'hvordan the boring tek behandler det du sender i kontaktskjemaet. hva vi samler inn, hvorfor, hvor det går og hvordan du får det slettet.',
  },
  ru: {
    title: 'конфиденциальность | the boring tek',
    desc: 'как the boring tek обращается с данными из формы. что мы собираем, зачем, куда это уходит и как это удалить.',
  },
  lv: {
    title: 'privātums | the boring tek',
    desc: 'kā the boring tek rīkojas ar to, ko sūtāt kontaktformā. ko mēs vācam, kāpēc, kur tas nonāk un kā to izdzēst.',
  },
};

/* the privacy page's copy. the english is the page's own `T`, repeated here
   so the build can assert the two agree; the other three exist only here.
   it says what the code does and nothing more: if the form, the storage or a
   request changes, this changes with it. */
const PRIVACY = {
  en: {
    h1: 'privacy',
    intro: 'short version. we collect only what you type into the form, we use it only to reply to you, and we never sell it.',
    s_who: 'who runs this site',
    who: 'THE BORING TEK. questions about your data go to the email below.',
    s_form: 'what the form collects',
    form: 'only what you type or pick. depending on your answers, that is:',
    f1: 'what brought you here, and the options you picked',
    f2: 'your own words, if you explain something or ask a question',
    f3: 'how big your business is, what takes most of your time, how customers reach you',
    f4: 'business or your name, registration number and website, both optional, and country',
    f5: 'your email',
    f6: 'which language the page was in',
    form_none: 'nothing is sent until you press send.',
    s_why: 'why',
    why: 'only to reply to you and talk about your request. we never sell it, and it never goes on a marketing list.',
    s_where: 'where it goes',
    where: 'when you press send, the same answers go to two places at once:',
    w1: 'web3forms, which turns them into an email to us',
    w2: 'our own worker on cloudflare, which sends them to us on telegram',
    s_keep: 'how long we keep it',
    keep: 'if we do not end up working together, we delete it within 12 months. sooner if you ask.',
    s_device: 'what the site stores on your device',
    device: 'one thing: whether you picked dark or light mode, saved in local storage in your browser. no cookies, no tracking, no ads, no analytics. your language is the address you are on, so nothing is saved for it.',
    s_loads: 'what loads from elsewhere',
    loads: 'the site is hosted on github pages, and the fonts come from google fonts. like on any website, your browser connects to them when a page opens.',
    s_tools: 'the free tools',
    tools: 'the watermark remover and the link checker run in your browser. your text, files and links are never uploaded. when you drop a pdf or docx into the watermark remover, it fetches a helper library from jsdelivr, but your file stays with you.',
    s_rights: 'your rights',
    rights: 'you can ask to see, fix or delete what we have about you. write to the email below.',
    complain: 'if you think we handle your data wrong, you can complain to datatilsynet, the norwegian data protection authority.',
    updated: 'last updated 1 october 2026',
    home: 'home',
    privacy: 'privacy',
    th_dark: 'dark mode',
    th_light: 'light mode',
  },
  nb: {
    h1: 'personvern',
    intro: 'kort fortalt. vi samler bare inn det du skriver i skjemaet, vi bruker det bare til å svare deg, og vi selger det aldri.',
    s_who: 'hvem som står bak',
    who: 'THE BORING TEK. spørsmål om dataene dine sender du til e-posten under.',
    s_form: 'hva skjemaet samler inn',
    form: 'bare det du skriver eller velger. avhengig av svarene dine er det:',
    f1: 'hva du kom for, og valgene du tok',
    f2: 'dine egne ord, hvis du forklarer noe eller stiller et spørsmål',
    f3: 'hvor stor bedriften er, hva som tar mest tid, hvordan kundene tar kontakt',
    f4: 'bedriften eller navnet ditt, organisasjonsnummer og nettside, begge valgfrie, og land',
    f5: 'e-posten din',
    f6: 'hvilket språk siden var på',
    form_none: 'ingenting sendes før du trykker send.',
    s_why: 'hvorfor',
    why: 'bare for å svare deg og snakke om det du spør om. vi selger det aldri, og det havner aldri på en markedsføringsliste.',
    s_where: 'hvor det går',
    where: 'når du trykker send, går de samme svarene til to steder samtidig:',
    w1: 'web3forms, som gjør dem om til en e-post til oss',
    w2: 'vår egen worker hos cloudflare, som sender dem til oss på telegram',
    s_keep: 'hvor lenge vi tar vare på det',
    keep: 'hvis vi ikke ender opp med å jobbe sammen, sletter vi det innen 12 måneder. før, hvis du ber om det.',
    s_device: 'hva siden lagrer på enheten din',
    device: 'én ting: om du valgte mørk eller lys modus, lagret i local storage i nettleseren. ingen cookies, ingen sporing, ingen reklame, ingen analyse. språket er adressen du er på, så det lagres ikke.',
    s_loads: 'hva som lastes fra andre steder',
    loads: 'siden ligger på github pages, og skriftene kommer fra google fonts. som på alle nettsider kobler nettleseren seg til dem når en side åpnes.',
    s_tools: 'gratisverktøyene',
    tools: 'vannmerkefjerneren og lenkesjekken kjører i nettleseren din. tekst, filer og lenker lastes aldri opp. når du slipper en pdf eller docx i vannmerkefjerneren, henter den et hjelpebibliotek fra jsdelivr, men filen din blir hos deg.',
    s_rights: 'rettighetene dine',
    rights: 'du kan be om å se, rette eller slette det vi har om deg. skriv til e-posten under.',
    complain: 'mener du at vi behandler dataene dine feil, kan du klage til datatilsynet.',
    updated: 'sist oppdatert 1. oktober 2026',
    home: 'hjem',
    privacy: 'personvern',
    th_dark: 'mørk modus',
    th_light: 'lys modus',
  },
  ru: {
    h1: 'конфиденциальность',
    intro: 'коротко. мы собираем только то, что вы пишете в форме, используем это только чтобы ответить вам и никогда это не продаём.',
    s_who: 'кто ведёт сайт',
    who: 'THE BORING TEK. вопросы о ваших данных пишите на почту ниже.',
    s_form: 'что собирает форма',
    form: 'только то, что вы пишете или выбираете. в зависимости от ответов это:',
    f1: 'зачем вы пришли и какие варианты выбрали',
    f2: 'ваши слова, если вы что-то объясняете или задаёте вопрос',
    f3: 'размер бизнеса, на что уходит больше всего времени, как с вами связываются клиенты',
    f4: 'бизнес или ваше имя, регистрационный номер и сайт, оба необязательны, и страна',
    f5: 'ваша почта',
    f6: 'на каком языке была страница',
    form_none: 'ничего не отправляется, пока вы не нажмёте отправить.',
    s_why: 'зачем',
    why: 'только чтобы ответить вам и обсудить ваш запрос. мы никогда их не продаём и не добавляем в рассылки.',
    s_where: 'куда это уходит',
    where: 'когда вы нажимаете отправить, одни и те же ответы уходят сразу в два места:',
    w1: 'web3forms, который превращает их в письмо нам',
    w2: 'наш собственный worker на cloudflare, который присылает их нам в telegram',
    s_keep: 'как долго мы храним',
    keep: 'если мы в итоге не работаем вместе, мы удаляем их в течение 12 месяцев. раньше, если вы попросите.',
    s_device: 'что сайт хранит на вашем устройстве',
    device: 'одно: выбрали ли вы тёмную или светлую тему, в local storage вашего браузера. никаких cookies, слежки, рекламы и аналитики. язык определяется адресом страницы, поэтому он не сохраняется.',
    s_loads: 'что загружается с других сайтов',
    loads: 'сайт размещён на github pages, а шрифты загружаются с google fonts. как и на любом сайте, ваш браузер подключается к ним, когда открывается страница.',
    s_tools: 'бесплатные инструменты',
    tools: 'удаление водяных знаков и проверка ссылки работают в вашем браузере. текст, файлы и ссылки никуда не загружаются. если вы перетащите pdf или docx в удаление водяных знаков, оно скачает вспомогательную библиотеку с jsdelivr, но ваш файл остаётся у вас.',
    s_rights: 'ваши права',
    rights: 'вы можете попросить показать, исправить или удалить то, что у нас есть о вас. напишите на почту ниже.',
    complain: 'если вы считаете, что мы обращаемся с вашими данными неправильно, вы можете пожаловаться в datatilsynet, норвежскую службу по защите данных.',
    updated: 'обновлено 1 октября 2026',
    home: 'главная',
    privacy: 'конфиденциальность',
    th_dark: 'тёмная тема',
    th_light: 'светлая тема',
  },
  lv: {
    h1: 'privātums',
    intro: 'īsumā. mēs vācam tikai to, ko jūs ierakstāt formā, izmantojam to tikai, lai jums atbildētu, un nekad to nepārdodam.',
    s_who: 'kas uztur šo lapu',
    who: 'THE BORING TEK. jautājumus par saviem datiem rakstiet uz e-pastu zemāk.',
    s_form: 'ko forma savāc',
    form: 'tikai to, ko jūs ierakstāt vai izvēlaties. atkarībā no atbildēm tas ir:',
    f1: 'kāpēc jūs atnācāt un kādus variantus izvēlējāties',
    f2: 'jūsu pašu vārdi, ja kaut ko paskaidrojat vai uzdodat jautājumu',
    f3: 'cik liels ir jūsu bizness, kas aizņem visvairāk laika, kā klienti ar jums sazinās',
    f4: 'bizness vai jūsu vārds, reģistrācijas numurs un mājaslapa, abi nav obligāti, un valsts',
    f5: 'jūsu e-pasts',
    f6: 'kādā valodā bija lapa',
    form_none: 'nekas netiek nosūtīts, kamēr jūs nenospiežat sūtīt.',
    s_why: 'kāpēc',
    why: 'tikai lai jums atbildētu un runātu par jūsu pieprasījumu. mēs tos nekad nepārdodam un neliekam mārketinga sarakstos.',
    s_where: 'kur tas nonāk',
    where: 'kad nospiežat sūtīt, tās pašas atbildes vienlaikus nonāk divās vietās:',
    w1: 'web3forms, kas tās pārvērš e-pastā mums',
    w2: 'mūsu pašu worker uz cloudflare, kas tās nosūta mums telegram',
    s_keep: 'cik ilgi mēs tos glabājam',
    keep: 'ja mēs galu galā nesadarbojamies, mēs tos izdzēšam 12 mēnešu laikā. ātrāk, ja jūs palūdzat.',
    s_device: 'ko lapa saglabā jūsu ierīcē',
    device: 'vienu lietu: vai izvēlējāties tumšo vai gaišo režīmu, jūsu pārlūka local storage. nekādu sīkdatņu, izsekošanas, reklāmu vai analītikas. valodu nosaka adrese, kurā esat, tāpēc tā netiek saglabāta.',
    s_loads: 'kas ielādējas no citurienes',
    loads: 'lapa atrodas github pages, un fonti nāk no google fonts. kā jebkurā mājaslapā, jūsu pārlūks pieslēdzas tiem, kad lapa atveras.',
    s_tools: 'bezmaksas rīki',
    tools: 'ūdenszīmju noņemšana un saites pārbaude strādā jūsu pārlūkā. teksts, faili un saites nekad netiek augšupielādēti. ja ievelkat pdf vai docx ūdenszīmju noņemšanā, tā ielādē palīgbibliotēku no jsdelivr, bet jūsu fails paliek pie jums.',
    s_rights: 'jūsu tiesības',
    rights: 'jūs varat lūgt parādīt, labot vai dzēst to, kas mums par jums ir. rakstiet uz e-pastu zemāk.',
    complain: 'ja uzskatāt, ka mēs ar jūsu datiem rīkojamies nepareizi, varat sūdzēties datatilsynet, norvēģijas datu aizsardzības iestādē.',
    updated: 'atjaunināts 2026. gada 1. oktobrī',
    home: 'sākums',
    privacy: 'privātums',
    th_dark: 'tumšais režīms',
    th_light: 'gaišais režīms',
  },
};

/* no punctuation dash anywhere a visitor can read it, in any language. the trap
   is ru and lv, which reach for the em dash where english uses a comma. hyphens
   inside words are spelling and stay, so this looks for a dash with space on at
   least one side, plus the two dash characters that are never spelling. */
const DASH = /[–—―]|(^|\s)-(\s|$)|(\s)-|-(\s)/;

function noDash(where, str) {
  if (typeof str !== 'string') return;
  if (DASH.test(str)) throw new Error(`punctuation dash in ${where}: ${JSON.stringify(str)}`);
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escAttr(s) {
  return esc(s).replace(/"/g, '&quot;');
}

/* ---------- read the sources ---------- */

function readPage(file) {
  const text = fs.readFileSync(file, 'utf8');
  const cut = text.indexOf('</head>');
  if (cut < 0) throw new Error(`no </head> in ${path.relative(ROOT, file)}`);
  return { src: text, cut };
}
const { src, cut } = readPage(SRC);
const { src: srcClean, cut: cutClean } = readPage(SRC_CLEAN);
const { src: srcTools, cut: cutTools } = readPage(SRC_TOOLS);
const { src: srcCheck, cut: cutCheck } = readPage(SRC_CHECK);
const { src: srcPrivacy, cut: cutPrivacy } = readPage(SRC_PRIVACY);

/* the copy comes out of the page's own dictionary. `new Function` on an object
   literal we wrote ourselves, in a script that only ever runs on this machine.
   parsing it by hand would be a second thing to keep in step with the first. */
const dict = src.match(/\nvar T=(\{[\s\S]*?\n\});\nfunction t\(k\)/);
if (!dict) throw new Error('could not find `var T={...}` in index.html');
const T = new Function('return ' + dict[1])();

/* the cleaner's own `T` is english only, so the same regex finds it; the
   function after it is `t(k)` there too. */
const dictClean = srcClean.match(/\nvar T=(\{[\s\S]*?\n\});\nvar lang=/);
if (!dictClean) throw new Error('could not find `var T={...}` in clean/index.html');
const T_CLEAN_EN = new Function('return ' + dictClean[1])();
/* the hub's `T` is english only too, and its `t(k)` follows it like the
   main page's */
const dictTools = srcTools.match(/\nvar T=(\{[\s\S]*?\n\});\nfunction t\(k\)/);
if (!dictTools) throw new Error('could not find `var T={...}` in tools/index.html');
const T_TOOLS_EN = new Function('return ' + dictTools[1])();
/* and the checker's, laid out like the hub's */
const dictCheck = srcCheck.match(/\nvar T=(\{[\s\S]*?\n\});\nfunction t\(k\)/);
if (!dictCheck) throw new Error('could not find `var T={...}` in tools/check/index.html');
const T_CHECK_EN = new Function('return ' + dictCheck[1])();
/* and the privacy page's, laid out like the hub's */
const dictPrivacy = srcPrivacy.match(/\nvar T=(\{[\s\S]*?\n\});\nfunction t\(k\)/);
if (!dictPrivacy) throw new Error('could not find `var T={...}` in privacy/index.html');
const T_PRIVACY_EN = new Function('return ' + dictPrivacy[1])();

function checkDict(name, dict, seo) {
  for (const l of LANGS) {
    if (!dict[l]) throw new Error(`${name} has no ${l}`);
    const missing = Object.keys(dict.en).filter((k) => dict[l][k] === undefined);
    if (missing.length) throw new Error(`${name}.${l} is missing ${missing.join(', ')}`);
    const extra = Object.keys(dict[l]).filter((k) => dict.en[k] === undefined);
    if (extra.length) throw new Error(`${name}.${l} has keys english does not: ${extra.join(', ')}`);
    for (const [k, v] of Object.entries(dict[l])) {
      if (Array.isArray(v)) v.forEach((x, i) => noDash(`${name}.${l}.${k}[${i}]`, x));
      else noDash(`${name}.${l}.${k}`, v);
    }
    noDash(`${name} SEO.${l}.title`, seo[l].title);
    noDash(`${name} SEO.${l}.desc`, seo[l].desc);
    if (seo[l].title.length >= 60) throw new Error(`${name} SEO.${l}.title is ${seo[l].title.length} signs, needs under 60`);
    if (seo[l].desc.length >= 155) throw new Error(`${name} SEO.${l}.desc is ${seo[l].desc.length} signs, needs under 155`);
  }
}
checkDict('T', T, SEO);
checkDict('CLEAN', CLEAN, SEO_CLEAN);
checkDict('TOOLS', TOOLS, SEO_TOOLS);
checkDict('CHECK', CHECK, SEO_CHECK);
checkDict('PRIVACY', PRIVACY, SEO_PRIVACY);

/* the cleaner's english is written in two places, the page and CLEAN.en, and
   they have to be the same object: a key or a word that drifts in one of them
   ships a russian page with an english line in it, or the other way round. */
{
  const bad = [];
  const keys = new Set([...Object.keys(T_CLEAN_EN), ...Object.keys(CLEAN.en)]);
  for (const k of keys) {
    if (JSON.stringify(T_CLEAN_EN[k]) !== JSON.stringify(CLEAN.en[k])) bad.push(k);
  }
  if (bad.length) throw new Error(`tools/clean/index.html T and CLEAN.en disagree about: ${bad.join(', ')}`);
}
{
  const bad = [];
  const keys = new Set([...Object.keys(T_TOOLS_EN), ...Object.keys(TOOLS.en)]);
  for (const k of keys) {
    if (JSON.stringify(T_TOOLS_EN[k]) !== JSON.stringify(TOOLS.en[k])) bad.push(k);
  }
  if (bad.length) throw new Error(`tools/index.html T and TOOLS.en disagree about: ${bad.join(', ')}`);
}
{
  const bad = [];
  const keys = new Set([...Object.keys(T_CHECK_EN), ...Object.keys(CHECK.en)]);
  for (const k of keys) {
    if (JSON.stringify(T_CHECK_EN[k]) !== JSON.stringify(CHECK.en[k])) bad.push(k);
  }
  if (bad.length) throw new Error(`tools/check/index.html T and CHECK.en disagree about: ${bad.join(', ')}`);
}
{
  const bad = [];
  const keys = new Set([...Object.keys(T_PRIVACY_EN), ...Object.keys(PRIVACY.en)]);
  for (const k of keys) {
    if (JSON.stringify(T_PRIVACY_EN[k]) !== JSON.stringify(PRIVACY.en[k])) bad.push(k);
  }
  if (bad.length) throw new Error(`privacy/index.html T and PRIVACY.en disagree about: ${bad.join(', ')}`);
}

/* the same document is served from /, /ru/ and /lv/, so a document-relative url
   resolves against whichever folder the visitor is in and 404s from two of the
   three. this is the rule that is easy to break months later, in a line of JS
   rather than in the markup, and impossible to notice from the english page -
   which is exactly what happened to CHAPTERS on the day this was written. */
function noRelativeUrls(text, label) {
  const rel = [];
  for (const m of text.matchAll(/(?:src|href|poster)\s*[=:]\s*["']([^"'/][^"']*)["']/g)) {
    const u = m[1];
    if (/^(https?:|data:|mailto:|tel:|#)/.test(u)) continue;
    rel.push(u);
  }
  if (rel.length) {
    throw new Error(`document-relative url(s) in ${label}, which 404 from /ru/ and /lv/:\n  `
      + rel.join('\n  ') + '\nmake them root-relative (a leading /).');
  }
}
noRelativeUrls(src, 'index.html');
noRelativeUrls(srcClean, 'tools/clean/index.html');
noRelativeUrls(srcTools, 'tools/index.html');
noRelativeUrls(srcCheck, 'tools/check/index.html');
noRelativeUrls(srcPrivacy, 'privacy/index.html');

/* english is written by hand in index.html and by this file for the other two.
   assert they are the same sentence, so changing one without the other stops
   the build instead of shipping two different english pages. */
function assertEnglishHead(text, seo, label) {
  for (const [what, want] of [['title', `<title>${esc(seo.en.title)}</title>`],
                              ['description', `<meta name="description" content="${escAttr(seo.en.desc)}">`],
                              ['og:title', `<meta property="og:title" content="${escAttr(seo.en.title)}">`],
                              ['og:description', `<meta property="og:description" content="${escAttr(seo.en.desc)}">`]]) {
    if (!text.includes(want)) {
      throw new Error(`${label} and its SEO.en disagree about ${what}. ${label} is the english page; make them match.\n  wanted: ${want}`);
    }
  }
}
assertEnglishHead(src, SEO, 'index.html');
assertEnglishHead(srcClean, SEO_CLEAN, 'tools/clean/index.html');
assertEnglishHead(srcTools, SEO_TOOLS, 'tools/index.html');
assertEnglishHead(srcCheck, SEO_CHECK, 'tools/check/index.html');
assertEnglishHead(srcPrivacy, SEO_PRIVACY, 'privacy/index.html');

/* ---------- the transforms ---------- */

function one(s, from, to, label) {
  const hits = s.split(from).length - 1;
  if (hits !== 1) throw new Error(`[${label}] expected 1 match in the source, found ${hits}`);
  return s.replace(from, to);
}

/* the head is the same job on both pages: the document says what it is,
   canonical and og:url point at this document and never at the english one.
   the hreflang set is the same on all three by design: every page names every
   page, itself included, which is what makes the group reciprocal. */
function swapHead(head, lang, seo, at) {
  head = one(head, '<html lang="en" data-theme="light">', `<html lang="${lang}" data-theme="light">`, 'html-lang');
  head = one(head, `<title>${esc(seo.en.title)}</title>`, `<title>${esc(seo[lang].title)}</title>`, 'title');
  head = one(head,
    `<meta name="description" content="${escAttr(seo.en.desc)}">`,
    `<meta name="description" content="${escAttr(seo[lang].desc)}">`, 'description');
  head = one(head, `<link rel="canonical" href="${ORIGIN}${at.en}">`, `<link rel="canonical" href="${ORIGIN}${at[lang]}">`, 'canonical');
  head = one(head, `<meta property="og:url" content="${ORIGIN}${at.en}">`, `<meta property="og:url" content="${ORIGIN}${at[lang]}">`, 'og:url');
  head = one(head, `<meta property="og:locale" content="${OG_LOCALE.en}">`, `<meta property="og:locale" content="${OG_LOCALE[lang]}">`, 'og:locale');
  head = one(head,
    `<meta property="og:title" content="${escAttr(seo.en.title)}">`,
    `<meta property="og:title" content="${escAttr(seo[lang].title)}">`, 'og:title');
  head = one(head,
    `<meta property="og:description" content="${escAttr(seo.en.desc)}">`,
    `<meta property="og:description" content="${escAttr(seo[lang].desc)}">`, 'og:description');
  return head;
}

/* the switch marks the page it is on. three links, one current. */
function swapSwitch(body, lang, at) {
  body = one(body, ' aria-current="true"', '', 'lang-current-off');
  body = one(body, `<a class="lang" href="${at[lang]}">`, `<a class="lang" href="${at[lang]}" aria-current="true">`, 'lang-current-on');
  return body;
}

/* the footer's privacy link, on every page, goes to this language's privacy page */
function swapFoot(body, lang, label) {
  return one(body, `<a class="fl" href="${AT_PRIVACY.en}" data-k="privacy">`, `<a class="fl" href="${AT_PRIVACY[lang]}" data-k="privacy">`, label + ' privacy-link');
}

/* every keyed string, painted. the same keys the page paints at runtime,
   applied once at build time. matching on the attribute rather than on a list
   of elements means an element added later is painted without touching this
   file. */
function paintKeys(body, dict, lang, atLeast, label) {
  let painted = 0;
  body = body.replace(/(<([a-z0-9]+)\b[^>]*\sdata-k="([a-z0-9_]+)"[^>]*>)([^<]*)(<\/\2>)/g,
    (all, open, tag, key, inner, close) => {
      if (dict[lang][key] === undefined) throw new Error(`${label} wants ${lang}.${key} and it does not exist`);
      painted++;
      return open + esc(dict[lang][key]) + close;
    });
  if (painted < atLeast) throw new Error(`[${label}] only ${painted} data-k elements painted, expected at least ${atLeast}`);
  return body;
}

function buildPage(lang) {
  let head = swapHead(src.slice(0, cut), lang, SEO, AT);
  let body = swapSwitch(src.slice(cut), lang, AT);
  const t = (k) => T[lang][k];

  /* --- every keyed string, painted --- */
  body = paintKeys(body, T, lang, 7, 'index.html');

  /* --- the tools link opens this language's tools --- */
  body = one(body, `<a class="lang more" href="${AT_TOOLS.en}" data-k="tools">`,
                   `<a class="lang more" href="${AT_TOOLS[lang]}" data-k="tools">`, 'tools-link');

  /* --- the strings the script paints by hand, because they are measured,
         typed or spoken rather than just written --- */
  const sub = t('sub'), cta = t('cta');
  body = one(body, `<span class="tag-size" aria-hidden="true">${esc(T.en.sub)}</span>`,
                   `<span class="tag-size" aria-hidden="true">${esc(sub)}</span>`, 'tag-size');
  body = one(body, `<span class="tag-txt">${esc(T.en.sub)}</span>`,
                   `<span class="tag-txt">${esc(sub)}</span>`, 'tag-txt');
  body = one(body, `<span class="cta-t">${esc(T.en.cta)}</span>`,
                   `<span class="cta-t">${esc(cta)}</span>`, 'cta-t');
  body = one(body, `<p class="hint">${esc(T.en.hint)}</p>`,
                   `<p class="hint">${esc(t('hint'))}</p>`, 'hint');

  /* --- the labels a screen reader gets before the script has run --- */
  body = one(body, `aria-label="${escAttr(T.en.cta)}"`, `aria-label="${escAttr(cta)}"`, 'mascot-label');
  body = one(body, `<button class="theme" type="button" aria-label="${escAttr(T.en.th_dark)}">`,
                   `<button class="theme" type="button" aria-label="${escAttr(t('th_dark'))}">`, 'theme-label');
  body = one(body, `<button class="pv-b" type="button" aria-label="${escAttr(T.en.play)}">`,
                   `<button class="pv-b" type="button" aria-label="${escAttr(t('play'))}">`, 'play-label');

  body = swapFoot(body, lang, 'index.html');
  return head + body;
}

function buildClean(lang) {
  let head = swapHead(srcClean.slice(0, cutClean), lang, SEO_CLEAN, AT_CLEAN);
  let body = swapSwitch(srcClean.slice(cutClean), lang, AT_CLEAN);
  const t = (k) => CLEAN[lang][k];

  /* --- the dictionary itself. the page ships english; this document ships
         its own language in the same slot, so the script's runtime strings,
         the result words and the errors, come out painted too. json is a
         valid object literal, and the page's `T` was written as json for
         exactly this swap. --- */
  head = one(head, dictClean[1], JSON.stringify(CLEAN[lang], null, 1), 'clean-dict');

  /* --- every keyed string, painted --- */
  body = paintKeys(body, CLEAN, lang, 6, 'tools/clean/index.html');

  /* --- the link home goes to this language's home --- */
  body = one(body, `<a class="lang more" href="/" data-k="home">`, `<a class="lang more" href="${AT[lang]}" data-k="home">`, 'home-link');

  /* --- the labels a screen reader gets before the script has run, and the
         placeholder everyone gets --- */
  body = one(body, `aria-label="${escAttr(CLEAN.en.zone_label)}"`, `aria-label="${escAttr(t('zone_label'))}"`, 'zone-label');
  body = one(body, `placeholder="${escAttr(CLEAN.en.ph)}"`, `placeholder="${escAttr(t('ph'))}"`, 'placeholder');
  body = one(body, `<button class="theme" type="button" aria-label="${escAttr(CLEAN.en.th_dark)}">`,
                   `<button class="theme" type="button" aria-label="${escAttr(t('th_dark'))}">`, 'theme-label');

  body = swapFoot(body, lang, 'tools/clean/index.html');
  return head + body;
}

function buildTools(lang) {
  let head = swapHead(srcTools.slice(0, cutTools), lang, SEO_TOOLS, AT_TOOLS);
  let body = swapSwitch(srcTools.slice(cutTools), lang, AT_TOOLS);
  const t = (k) => TOOLS[lang][k];

  /* --- the dictionary itself, swapped the way the cleaner's is --- */
  head = one(head, dictTools[1], JSON.stringify(TOOLS[lang], null, 1), 'tools-dict');

  /* --- every keyed string, painted --- */
  body = paintKeys(body, TOOLS, lang, 7, 'tools/index.html');

  /* --- the link home goes to this language's home --- */
  body = one(body, `<a class="lang more" href="/" data-k="home">`, `<a class="lang more" href="${AT[lang]}" data-k="home">`, 'home-link');

  /* --- each card opens this language's tool --- */
  body = one(body, `<a class="btn" href="${AT_CLEAN.en}" data-k="open">`, `<a class="btn" href="${AT_CLEAN[lang]}" data-k="open">`, 'open-link-clean');
  body = one(body, `<a class="btn" href="${AT_CHECK.en}" data-k="open">`, `<a class="btn" href="${AT_CHECK[lang]}" data-k="open">`, 'open-link-check');

  /* --- the label a screen reader gets before the script has run --- */
  body = one(body, `<button class="theme" type="button" aria-label="${escAttr(TOOLS.en.th_dark)}">`,
                   `<button class="theme" type="button" aria-label="${escAttr(t('th_dark'))}">`, 'theme-label');

  body = swapFoot(body, lang, 'tools/index.html');
  return head + body;
}

function buildCheck(lang) {
  let head = swapHead(srcCheck.slice(0, cutCheck), lang, SEO_CHECK, AT_CHECK);
  let body = swapSwitch(srcCheck.slice(cutCheck), lang, AT_CHECK);
  const t = (k) => CHECK[lang][k];

  /* --- the dictionary itself, swapped the way the cleaner's is, so the
         lines the scan types come out in this language too --- */
  head = one(head, dictCheck[1], JSON.stringify(CHECK[lang], null, 1), 'check-dict');

  /* --- every keyed string, painted --- */
  body = paintKeys(body, CHECK, lang, 7, 'tools/check/index.html');

  /* --- the link home goes to this language's home --- */
  body = one(body, `<a class="lang more" href="/" data-k="home">`, `<a class="lang more" href="${AT[lang]}" data-k="home">`, 'home-link');

  /* --- the placeholder everyone gets, and the label a screen reader gets
         before the script has run --- */
  body = one(body, `placeholder="${escAttr(CHECK.en.ph)}"`, `placeholder="${escAttr(t('ph'))}"`, 'placeholder');
  body = one(body, `<button class="theme" type="button" aria-label="${escAttr(CHECK.en.th_dark)}">`,
                   `<button class="theme" type="button" aria-label="${escAttr(t('th_dark'))}">`, 'theme-label');

  body = swapFoot(body, lang, 'tools/check/index.html');
  return head + body;
}

function buildPrivacy(lang) {
  let head = swapHead(srcPrivacy.slice(0, cutPrivacy), lang, SEO_PRIVACY, AT_PRIVACY);
  let body = swapSwitch(srcPrivacy.slice(cutPrivacy), lang, AT_PRIVACY);
  const t = (k) => PRIVACY[lang][k];

  /* --- the dictionary itself, swapped the way the hub's is --- */
  head = one(head, dictPrivacy[1], JSON.stringify(PRIVACY[lang], null, 1), 'privacy-dict');

  /* --- every keyed string, painted --- */
  body = paintKeys(body, PRIVACY, lang, 20, 'privacy/index.html');

  /* --- the link home goes to this language's home --- */
  body = one(body, `<a class="lang more" href="/" data-k="home">`, `<a class="lang more" href="${AT[lang]}" data-k="home">`, 'home-link');

  /* --- the label a screen reader gets before the script has run --- */
  body = one(body, `<button class="theme" type="button" aria-label="${escAttr(PRIVACY.en.th_dark)}">`,
                   `<button class="theme" type="button" aria-label="${escAttr(t('th_dark'))}">`, 'theme-label');

  body = swapFoot(body, lang, 'privacy/index.html');
  return head + body;
}

/* the stub at an old address: a meta refresh to the new one, a canonical
   that says the new one is the page, and a plain link for anything that
   follows neither. nothing else, so nothing here can go stale. */
function buildRedirect(lang) {
  const to = ORIGIN + AT_CLEAN[lang];
  return '<!doctype html>\n'
    + `<html lang="${lang}">\n<head>\n<meta charset="utf-8">\n`
    + `<meta http-equiv="refresh" content="0; url=${to}">\n`
    + `<link rel="canonical" href="${to}">\n`
    + '<meta name="robots" content="noindex">\n'
    + `<title>the boring tek</title>\n</head>\n<body>\n<p><a href="${to}">${to}</a></p>\n</body>\n</html>\n`;
}

/* the sitemap names the same twelve addresses the canonicals do, off the same
   constants, so they cannot disagree. the old cleaner addresses are stubs
   and are not in it. */
function buildSitemap() {
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + LANGS.map((l) => `  <url>\n    <loc>${ORIGIN}${AT[l]}</loc>\n  </url>\n`).join('')
    + LANGS.map((l) => `  <url>\n    <loc>${ORIGIN}${AT_TOOLS[l]}</loc>\n  </url>\n`).join('')
    + LANGS.map((l) => `  <url>\n    <loc>${ORIGIN}${AT_CLEAN[l]}</loc>\n  </url>\n`).join('')
    + LANGS.map((l) => `  <url>\n    <loc>${ORIGIN}${AT_CHECK[l]}</loc>\n  </url>\n`).join('')
    + LANGS.map((l) => `  <url>\n    <loc>${ORIGIN}${AT_PRIVACY[l]}</loc>\n  </url>\n`).join('')
    + '</urlset>\n';
}

/* ---------- write ---------- */

/* the folder is the address, which for norwegian is not the code */
const fileAt = (url) => path.join(ROOT, ...url.split('/').filter(Boolean), 'index.html');
const out = [
  ...LANGS.filter((l) => l !== 'en').map((l) => [fileAt(AT[l]), buildPage(l)]),
  ...LANGS.filter((l) => l !== 'en').map((l) => [fileAt(AT_TOOLS[l]), buildTools(l)]),
  ...LANGS.filter((l) => l !== 'en').map((l) => [fileAt(AT_CLEAN[l]), buildClean(l)]),
  ...LANGS.filter((l) => l !== 'en').map((l) => [fileAt(AT_CHECK[l]), buildCheck(l)]),
  ...LANGS.filter((l) => l !== 'en').map((l) => [fileAt(AT_PRIVACY[l]), buildPrivacy(l)]),
  ...Object.keys(AT_CLEAN_OLD).map((l) => [fileAt(AT_CLEAN_OLD[l]), buildRedirect(l)]),
  [path.join(ROOT, 'sitemap.xml'), buildSitemap()],
];

let stale = 0;
for (const [file, text] of out) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  let had = null;
  try { had = fs.readFileSync(file, 'utf8'); } catch {}
  if (had === text) { console.log(`  ok       ${rel}`); continue; }
  stale++;
  if (CHECK_ONLY) { console.log(`  STALE    ${rel}`); continue; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  console.log(`  written  ${rel}  ${(Buffer.byteLength(text) / 1024).toFixed(1)} KB`);
}

if (CHECK_ONLY && stale) {
  console.error(`\n${stale} file(s) out of date. run: node tools/build-langs.mjs`);
  process.exit(1);
}
console.log(CHECK_ONLY ? '\nup to date.' : '\ndone.');
