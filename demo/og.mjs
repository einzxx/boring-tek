/* the boring tek — og card renderer.
   writes assets/og.png, 1200x630, the image a shared link shows.

   nothing here ships with the site: it is tooling, it lives in demo/, and the
   only thing it puts in the repo is the png. the card is not a separate design.
   the light :root block is lifted out of index.html at run time and the mascot
   out of assets/mascot.svg, so the card cannot drift from the page it is a
   picture of — change a token on the site, re-run this, the card follows.

   method: one throwaway html, headless chrome, one screenshot. the same chrome
   discovery and the same flags as record.mjs. */

import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

const PREVIEW = process.argv.includes('--preview');
const OUT = PREVIEW
  ? path.join(HERE, 'out', 'og.png')      /* gitignored. for looking at it. */
  : path.join(ROOT, 'assets', 'og.png');  /* the tracked asset. */

const W = 1200, H = 630;

/* the composition. sizes are fitted, not set: the wordmark and the subline are
   each measured at 100px and divided down to the width they should occupy.

   the subline is fitted on its own rather than at the site's 44:16 ratio,
   deliberately. michroma's subline at that ratio comes out 939px wide against
   a 760px wordmark — wider than the thing it sits under. on the page that is
   right, the subline is nearly as wide as the wordmark and always has been. on
   a card it inverts the hierarchy and eats the margins. */
const MASCOT = 190;      /* px. the site caps him at 130 in a 900px column. */
const HERO_W = 760;      /* px wide, fitted. leaves 220 either side. */
const TAG_W = 660;       /* px wide, fitted. narrower than the wordmark. */
const PILL_RATIO = 13 / 44;  /* of the wordmark's size. the site's cta is 15:44. */

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- lift the site's own light theme ---------- */

/* the first :root block in index.html is the light theme. taking the whole
   block rather than picking tokens out of it means --halo and --vig arrive
   with their gradients intact and a token added later is already here. */
function lightRoot() {
  const css = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const m = css.match(/\n:root\{([\s\S]*?)\n\}/);
  if (!m) throw new Error('no :root block found in index.html');
  const need = ['--bg', '--fg', '--sub', '--face', '--eye', '--halo', '--vig', '--display'];
  const missing = need.filter(t => !m[1].includes(t + ':'));
  if (missing.length) throw new Error('light :root is missing ' + missing.join(', '));
  return m[1].trim();
}

/* the mascot, from the one file that is allowed to define him. the standalone
   svg is the dark colourway — white face, dark eyes — because it is used as an
   avatar. the card is light, so the two fills swap to tokens and invert with
   the page, exactly as the in-page mascot does. geometry is never touched. */
function mascotBody() {
  const svg = fs.readFileSync(path.join(ROOT, 'assets', 'mascot.svg'), 'utf8');
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '').trim();
  if (!inner.includes('fill="#f4f7f5"') || !inner.includes('fill="#06070a"'))
    throw new Error('mascot.svg is not the dark colourway any more');
  if ((inner.match(/<circle/g) || []).length !== 1 || (inner.match(/<rect/g) || []).length !== 2)
    throw new Error('mascot.svg is not one circle and two eyes any more');
  return inner
    .replace(/fill="#f4f7f5"/g, 'fill="var(--face)"')
    .replace(/fill="#06070a"/g, 'fill="var(--eye)"');
}

/* ---------- the card ---------- */

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>og card</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500&display=swap">
<style>
:root{
${lightRoot()}
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{
  width:${W}px;height:${H}px;overflow:hidden;
  background:var(--bg);color:var(--fg);
  font-family:var(--display);
  -webkit-font-smoothing:antialiased;
}
.card{position:relative;width:${W}px;height:${H}px;
  display:flex;flex-direction:column;align-items:center;justify-content:center}
/* the vignette, at its light value. no grain layer: every platform recompresses
   a card, and grain through that is noise rather than texture. */
.vignette{position:absolute;inset:0;background-image:var(--vig);pointer-events:none}

.m-wrap{position:relative;display:block;margin-bottom:52px}
.m-wrap::before{content:"";position:absolute;left:50%;top:50%;
  width:210%;height:210%;transform:translate(-50%,-50%);
  border-radius:50%;background-image:var(--halo)}
.mascot{position:relative;display:block;width:${MASCOT}px;height:auto}

.hero{margin:0;font-family:var(--display);font-weight:400;
  line-height:1.04;letter-spacing:0;white-space:pre}
.tag{margin:28px 0 0;font-family:var(--display);font-weight:400;
  color:var(--sub);letter-spacing:.18em;text-transform:uppercase;white-space:pre}
/* the site's pill, at the site's radius and padding. */
.pill{margin-top:54px;font-family:var(--display);font-weight:400;
  letter-spacing:.12em;text-transform:uppercase;
  padding:14px 26px;border:1px solid var(--fg);border-radius:999px;
  background:transparent;color:var(--fg);white-space:pre}
</style>
</head>
<body>
<div class="card">
  <div class="vignette"></div>
  <div class="m-wrap">
    <svg class="mascot" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      ${mascotBody()}
    </svg>
  </div>
  <h1 class="hero">THE BORING TEK</h1>
  <p class="tag">building the boring part of the future</p>
  <div class="pill">tell us what you need</div>
</div>
<script>
/* fit-to-width, the divide the page itself uses: measure the rendered string,
   then size from the space it has to fill. measuring at 100px and scaling is
   exact because font metrics are linear in size. */
window.fit = function(heroW, tagW, pillRatio){
  const hero = document.querySelector('.hero');
  const tag  = document.querySelector('.tag');
  const pill = document.querySelector('.pill');
  const at = (el, px) => { el.style.fontSize = px + 'px'; return el.getBoundingClientRect().width; };
  const heroSize = 100 * heroW / at(hero, 100);
  at(hero, heroSize);
  at(tag, 100 * tagW / at(tag, 100));
  at(pill, heroSize * pillRatio);
  const r = el => el.getBoundingClientRect();
  return {
    hero: +heroSize.toFixed(2),
    heroW: +r(hero).width.toFixed(1),
    tagW: +r(tag).width.toFixed(1),
    pillW: +r(pill).width.toFixed(1),
    top: +r(document.querySelector('.m-wrap')).top.toFixed(1),
    bottom: +(${H} - r(pill).bottom).toFixed(1),
    /* michroma has to be the real face. offline, the card silently renders in
       the mono fallback and looks almost right, which is the worst kind of
       wrong to ship. */
    michroma: document.fonts.check('40px Michroma'),
  };
};
</script>
</body>
</html>`;

/* ---------- render ---------- */

if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none',
    '--force-color-profile=srgb', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
const m = await page.evaluate((a, b, c) => window.fit(a, b, c), HERO_W, TAG_W, PILL_RATIO);
await page.screenshot({ path: OUT, type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
await browser.close();

/* ---------- checks ---------- */

const png = fs.readFileSync(OUT);
const w = png.readUInt32BE(16), h = png.readUInt32BE(20);

console.log(path.relative(ROOT, OUT) + '  ' + w + 'x' + h + '  '
  + (png.length / 1024).toFixed(1) + ' KB');
console.log('  wordmark ' + m.heroW + 'px at ' + m.hero + 'px   subline ' + m.tagW
  + 'px   pill ' + m.pillW + 'px');
console.log('  clear space ' + m.top + 'px top, ' + m.bottom + 'px bottom');

const fail = [];
if (w !== W || h !== H) fail.push('the card is not ' + W + 'x' + H);
if (!m.michroma) fail.push('michroma did not load — the card is set in the mono fallback');
if (m.tagW >= m.heroW) fail.push('the subline is wider than the wordmark');
if (m.top < 60 || m.bottom < 60) fail.push('the margins are tighter than 60px');
if (png.length > 300 * 1024) fail.push('the png is over 300KB');
if (fail.length) { console.error('\nFAILED\n  ' + fail.join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
