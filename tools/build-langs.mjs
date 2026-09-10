/* the boring tek — language build.

   the site is still one file. this reads `index.html`, which is the english
   page, and writes `ru/index.html` and `lv/index.html`: the same markup, the
   same stylesheet, the same script, with the text already painted in that
   language and `lang`, `canonical` and the og tags already set. it writes
   `sitemap.xml` too, so the three addresses are named in exactly one place.

   why it exists: a page that paints itself in russian after the script runs is
   an english page to a crawler, and a hash is not an address. three documents
   at three urls is the only thing search understands. the source stays one
   file, so nothing has to be kept in step by hand.

     node tools/build-langs.mjs          write the folders
     node tools/build-langs.mjs --check  verify they match the source, write nothing

   this is tooling. it never ships, it has no dependencies, and it is the only
   thing that may write `ru/` and `lv/` — those two are output, so editing them
   by hand is editing a build artifact and it will be overwritten.

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
const CHECK = process.argv.includes('--check');

const ORIGIN = 'https://theboringtek.com';
const LANGS = ['en', 'ru', 'lv'];
const AT = { en: '/', ru: '/ru/', lv: '/lv/' };
const OG_LOCALE = { en: 'en_US', ru: 'ru_RU', lv: 'lv_LV' };

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
  ru: {
    title: 'ai агенты и автоматизация для бизнеса | the boring tek',
    desc: 'делаем ai агентов, бэкенд системы и автоматизацию процессов для бизнеса. сайты, приложения и боты тоже. напишите что вам нужно.',
  },
  lv: {
    title: 'ai aģenti un automatizācija biznesam | the boring tek',
    desc: 'būvējam ai aģentus, backend sistēmas un darba procesu automatizāciju biznesam. mājaslapas, aplikācijas un boti arī. pastāstiet ko jums vajag.',
  },
};

/* ---------- house rules, enforced ---------- */

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

/* ---------- read the source ---------- */

const src = fs.readFileSync(SRC, 'utf8');
const cut = src.indexOf('</head>');
if (cut < 0) throw new Error('no </head> in index.html');

/* the copy comes out of the page's own dictionary. `new Function` on an object
   literal we wrote ourselves, in a script that only ever runs on this machine.
   parsing it by hand would be a second thing to keep in step with the first. */
const dict = src.match(/\nvar T=(\{[\s\S]*?\n\});\nfunction t\(k\)/);
if (!dict) throw new Error('could not find `var T={...}` in index.html');
const T = new Function('return ' + dict[1])();

for (const l of LANGS) {
  if (!T[l]) throw new Error(`T has no ${l}`);
  const missing = Object.keys(T.en).filter((k) => T[l][k] === undefined);
  if (missing.length) throw new Error(`T.${l} is missing ${missing.join(', ')}`);
  for (const [k, v] of Object.entries(T[l])) {
    if (Array.isArray(v)) v.forEach((x, i) => noDash(`T.${l}.${k}[${i}]`, x));
    else noDash(`T.${l}.${k}`, v);
  }
  noDash(`SEO.${l}.title`, SEO[l].title);
  noDash(`SEO.${l}.desc`, SEO[l].desc);
  if (SEO[l].title.length >= 60) throw new Error(`SEO.${l}.title is ${SEO[l].title.length} signs, needs under 60`);
  if (SEO[l].desc.length >= 155) throw new Error(`SEO.${l}.desc is ${SEO[l].desc.length} signs, needs under 155`);
}

/* the same document is served from /, /ru/ and /lv/, so a document-relative url
   resolves against whichever folder the visitor is in and 404s from two of the
   three. this is the rule that is easy to break months later, in a line of JS
   rather than in the markup, and impossible to notice from the english page -
   which is exactly what happened to CHAPTERS on the day this was written. */
{
  const rel = [];
  for (const m of src.matchAll(/(?:src|href|poster)\s*[=:]\s*["']([^"'/][^"']*)["']/g)) {
    const u = m[1];
    if (/^(https?:|data:|mailto:|tel:|#)/.test(u)) continue;
    rel.push(u);
  }
  if (rel.length) {
    throw new Error('document-relative url(s) in index.html, which 404 from /ru/ and /lv/:\n  '
      + rel.join('\n  ') + '\nmake them root-relative (a leading /).');
  }
}

/* english is written by hand in index.html and by this file for the other two.
   assert they are the same sentence, so changing one without the other stops
   the build instead of shipping two different english pages. */
for (const [what, want] of [['title', `<title>${esc(SEO.en.title)}</title>`],
                            ['description', `<meta name="description" content="${escAttr(SEO.en.desc)}">`],
                            ['og:title', `<meta property="og:title" content="${escAttr(SEO.en.title)}">`],
                            ['og:description', `<meta property="og:description" content="${escAttr(SEO.en.desc)}">`]]) {
  if (!src.includes(want)) {
    throw new Error(`index.html and SEO.en disagree about ${what}. index.html is the english page; make them match.\n  wanted: ${want}`);
  }
}

/* ---------- the transforms ---------- */

function one(s, from, to, label) {
  const hits = s.split(from).length - 1;
  if (hits !== 1) throw new Error(`[${label}] expected 1 match in the source, found ${hits}`);
  return s.replace(from, to);
}

function buildPage(lang) {
  let head = src.slice(0, cut);
  let body = src.slice(cut);
  const t = (k) => T[lang][k];

  /* --- the document says what it is --- */
  head = one(head, '<html lang="en" data-theme="light">', `<html lang="${lang}" data-theme="light">`, 'html-lang');
  head = one(head, `<title>${esc(SEO.en.title)}</title>`, `<title>${esc(SEO[lang].title)}</title>`, 'title');
  head = one(head,
    `<meta name="description" content="${escAttr(SEO.en.desc)}">`,
    `<meta name="description" content="${escAttr(SEO[lang].desc)}">`, 'description');

  /* canonical and og:url point at this document, never at the root. the
     hreflang set is the same on all three by design: every page names every
     page, itself included, which is what makes the group reciprocal. */
  head = one(head, `<link rel="canonical" href="${ORIGIN}/">`, `<link rel="canonical" href="${ORIGIN}${AT[lang]}">`, 'canonical');
  head = one(head, `<meta property="og:url" content="${ORIGIN}/">`, `<meta property="og:url" content="${ORIGIN}${AT[lang]}">`, 'og:url');
  head = one(head, `<meta property="og:locale" content="${OG_LOCALE.en}">`, `<meta property="og:locale" content="${OG_LOCALE[lang]}">`, 'og:locale');
  head = one(head,
    `<meta property="og:title" content="${escAttr(SEO.en.title)}">`,
    `<meta property="og:title" content="${escAttr(SEO[lang].title)}">`, 'og:title');
  head = one(head,
    `<meta property="og:description" content="${escAttr(SEO.en.desc)}">`,
    `<meta property="og:description" content="${escAttr(SEO[lang].desc)}">`, 'og:description');

  /* --- the switch marks the page it is on --- */
  body = one(body, ' aria-current="true"', '', 'lang-current-off');
  body = one(body, `<a class="lang" href="${AT[lang]}">`, `<a class="lang" href="${AT[lang]}" aria-current="true">`, 'lang-current-on');

  /* --- every keyed string, painted --- */
  /* the same keys `paintKeys()` uses at runtime, applied once at build time.
     matching on the attribute rather than on a list of elements means a card
     added later is painted without touching this file. */
  let painted = 0;
  body = body.replace(/(<([a-z]+)\b[^>]*\sdata-k="([a-z0-9_]+)"[^>]*>)([^<]*)(<\/\2>)/g,
    (all, open, tag, key, inner, close) => {
      if (T[lang][key] === undefined) throw new Error(`markup wants T.${lang}.${key} and it does not exist`);
      painted++;
      return open + esc(t(key)) + close;
    });
  if (painted < 7) throw new Error(`only ${painted} data-k elements painted, expected at least 7`);

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

  return head + body;
}

/* the sitemap names the same three addresses the canonicals do, off the same
   two constants, so they cannot disagree. */
function buildSitemap() {
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + LANGS.map((l) => `  <url>\n    <loc>${ORIGIN}${AT[l]}</loc>\n  </url>\n`).join('')
    + '</urlset>\n';
}

/* ---------- write ---------- */

const out = [
  ...LANGS.filter((l) => l !== 'en').map((l) => [path.join(ROOT, l, 'index.html'), buildPage(l)]),
  [path.join(ROOT, 'sitemap.xml'), buildSitemap()],
];

let stale = 0;
for (const [file, text] of out) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  let had = null;
  try { had = fs.readFileSync(file, 'utf8'); } catch {}
  if (had === text) { console.log(`  ok       ${rel}`); continue; }
  stale++;
  if (CHECK) { console.log(`  STALE    ${rel}`); continue; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  console.log(`  written  ${rel}  ${(Buffer.byteLength(text) / 1024).toFixed(1)} KB`);
}

if (CHECK && stale) {
  console.error(`\n${stale} file(s) out of date. run: node tools/build-langs.mjs`);
  process.exit(1);
}
console.log(CHECK ? '\nup to date.' : '\ndone.');
