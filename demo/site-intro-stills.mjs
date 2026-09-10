/* the boring tek — site-intro's two approval stills, and the font sheet.

     cd demo
     node site-intro.mjs --stills        both stills
     node site-intro.mjs --stills --only=dark
     node site-intro.mjs --fonts         the subtitle font sheet

   **this is the contract the film is built against, not a leftover.** the two
   stills are the two ends of `site-intro.mjs`: the light one is what the first
   half of the film looks like and the dark one is what the second half looks
   like, and the cut in the middle is the film going from one to the other on a
   single frame. every number the film places — where he stands, how big the
   globe is, where the subtitle sits — is a number that was agreed here.

   it is a sibling rather than a mode inside the film for one reason: the film
   fetches a read from elevenlabs before it does anything else, and a still does
   not have a read. keeping them in one file would mean either a stills path
   that skips half the file's own setup, or a still that waits on a voice it
   does not use.

   the font sheet is tooling. it set the subtitle face and it dies the day
   nobody is arguing about that any more.
*/

import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import {
  planMascot, mascotFrame, mascotCss, mascotMarkup, mascotRuntime,
  mascotPagePlan, stillMoment,
} from './lib/mascot.mjs';
import { globeCss, globeMarkup, globeScript, readLand } from './lib/globe.mjs';
import { brandTokens } from './lib/captions.mjs';

/* the film's own numbers, and they are the same numbers because they are the
   same picture. a change here is a change to the film. */
const SIZE = 127;
const MAS = { cx: 250, cy: 252 };
const G = { d: 212, cx: 720, cy: 252, tilt: 14, spin: 340 };
const GLOBE_T = 0.9, GLOBE_SECONDS = 2;
const SUB = { size: 18, bottom: 70 };
const AT = 1.45;

const STILLS = [
  {
    key: 'light', theme: 'light', state: 'delighted', hands: 'wave', side: 'right',
    text: 'hello',
    globe: {
      ink: { land: '10,12,15', ocean: '224,228,232' },
      limb: { amount: 0.42, power: 2.6, radial: 0.18 },
      grid: { on: true, ink: [170, 170, 170], o: 0.5 },
      ping: { on: true, lum: [0, 60], every: [0.20, 0.34] },
    },
    glow: false,
  },
  {
    key: 'dark', theme: 'dark', state: 'delighted', hands: 'wave', side: 'right',
    text: 'now much better. welcome.',
    globe: { ping: { lum: [90, 255], every: [0.20, 0.34] } },
    glow: true,
  },
];

const FONTS = {
  out: 'site-font-test.png',
  line: 'now much better. welcome.',
  size: 18, weight: 500,
  label: { size: 13, x: 96 },
  rowH: 76,
  families: [
    { name: 'Barlow Condensed' },
    { name: 'Nunito' },
    { name: 'IBM Plex Mono' },
    /* google ships this one at 400 and only 400. asking css2 for it at 500 on
       its own is a 400; asking inside a request with four other families is a
       **200 with that family missing from the reply** — nothing errors and one
       candidate is quietly the fallback serif wearing its name. */
    { name: 'Instrument Serif', weight: 400 },
    { name: 'Bricolage Grotesque' },
  ],
};
const FACES = FONTS.families.map(f => ({ ...f, weight: f.weight || FONTS.weight }));

function planFor(s, SIZE_) {
  return planMascot({
    seconds: 4, hands: true, size: SIZE_, theme: s.theme, side: s.side,
    marks: [{ t: 0.20, state: s.state, side: s.side, hands: { pose: s.hands, entry: 0.5, hold: 2.4 } }],
  });
}

function stillHtml(s, plan, geojson, C) {
  const { light, dark } = brandTokens();
  const dx = +(MAS.cx - SIZE / 2 - plan.box.left).toFixed(3);
  const dy = +(MAS.cy - SIZE / 2 - plan.box.top).toFixed(3);
  const g = { d: G.d, cx: G.cx, cy: G.cy, tilt: G.tilt, spin0: G.spin, rate: 0,
    seconds: GLOBE_SECONDS, ...s.globe };
  return `<!doctype html>
<html lang="en" data-theme="${s.theme}">
<head>
<meta charset="utf-8">
<title>site-intro ${s.key}</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@700&family=Nunito:wght@500&display=swap">
<style>
:root{
${light}
}
html[data-theme=dark]{
${dark}
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${C.VW}px;height:${C.VH}px;color:var(--fg)}
.stage{position:relative;width:${C.VW}px;height:${C.VH}px;overflow:hidden;background:var(--bg)}
#globe-move{position:absolute;inset:0}
#mas-move{position:absolute;inset:0;transform:translate3d(${dx}px,${dy}px,0)}
${globeCss(g)}
${mascotCss(plan)}
${s.glow ? '' : `
/* a white blur on a white page is a smudge, and the page spec bans a glow on
   paper. this is the same rule applied to the globe. */
#globe-move .g-glow{display:none}`}
.sub{position:absolute;left:0;right:0;bottom:${SUB.bottom}px;text-align:center;
  font-family:"Nunito",var(--body);font-weight:500;letter-spacing:-.005em;
  font-size:${SUB.size}px;line-height:1.2}
.sub span{display:inline-block;white-space:nowrap;color:var(--sub)}
[data-theme=dark] .sub span{color:#ffffff}
</style>
</head>
<body>
<div class="stage">
  <div id="globe-move">${globeMarkup(geojson)}</div>
  <div id="mas-move">${mascotMarkup(plan)}</div>
  <div class="sub"><span>${s.text}</span></div>
</div>
<script>
${globeScript(g)}
<\/script>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
${mascotRuntime()}
window.__intro = {
  inkBox(){
    const els = [document.querySelector('.m-plate'),
      document.getElementById('m-gl-ink0'), document.getElementById('m-gl-ink1')];
    let l = 1e9, r = -1e9, t = 1e9, b = -1e9;
    for (const el of els){
      if (!el) continue;
      if (+getComputedStyle(el).opacity === 0) continue;
      const q = el.getBoundingClientRect();
      if (!q.width || !q.height) continue;
      l = Math.min(l, q.left); r = Math.max(r, q.right);
      t = Math.min(t, q.top); b = Math.max(b, q.bottom);
    }
    return { l: +l.toFixed(1), r: +r.toFixed(1), t: +t.toFixed(1), b: +b.toFixed(1) };
  },
  subBox(){
    const q = document.querySelector('.sub span').getBoundingClientRect();
    return { l: +q.left.toFixed(1), r: +q.right.toFixed(1), t: +q.top.toFixed(1), b: +q.bottom.toFixed(1) };
  },
};
Promise.all([
  document.fonts.load('500 ${SUB.size}px Nunito'),
  document.fonts.load('700 12px Manrope'),
])
  .then(function () { return document.fonts.ready; })
  .then(function () {
    window.__built = Object.assign({}, window.__mas.build(), {
      sub: { nunito: document.fonts.check('500 ${SUB.size}px Nunito') },
    });
  });
</script>
</body>
</html>`;
}

function fontsHtml(C) {
  const { light, dark } = brandTokens();
  const n = FACES.length;
  const top = (C.VH - n * FONTS.rowH) / 2;
  const link = FACES.map(f => 'family=' + f.name.replace(/ /g, '+') + ':wght@' + f.weight)
    .sort().join('&');
  const rows = FACES.map((f, i) => `  <div class="row" style="top:${(top + i * FONTS.rowH).toFixed(1)}px">
    <b>${f.name.toLowerCase()}<i>${f.weight}</i></b>
    <em style="font-family:'${f.name}',var(--body);font-weight:${f.weight}">${FONTS.line}</em>
  </div>`).join('\n');
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>site-intro fonts</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${link}&display=swap">
<style>
:root{
${light}
}
html[data-theme=dark]{
${dark}
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${C.VW}px;height:${C.VH}px;color:var(--fg)}
.stage{position:relative;width:${C.VW}px;height:${C.VH}px;overflow:hidden;background:var(--bg)}
.row{position:absolute;left:0;right:0;height:${FONTS.rowH}px}
.row b{position:absolute;left:${FONTS.label.x}px;top:50%;transform:translateY(-50%);
  font-family:var(--mono);font-weight:400;font-size:${FONTS.label.size}px;
  letter-spacing:.02em;color:var(--muted);white-space:nowrap}
.row b i{font-style:normal;opacity:.55;margin-left:.6em}
.row em{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);
  display:block;text-align:center;font-style:normal;
  font-size:${FONTS.size}px;line-height:1.2;white-space:nowrap;color:#ffffff}
</style>
</head>
<body>
<div class="stage">
${rows}
</div>
<script>
var FACES = ${JSON.stringify(FACES)};
var SPEC = function (f) { return f.weight + ' ${FONTS.size}px "' + f.name + '"'; };
Promise.all(FACES.map(function (f) { return document.fonts.load(SPEC(f)); }))
  .then(function () { return document.fonts.ready; })
  .then(function () {
    window.__built = {
      missing: FACES.filter(function (f) { return !document.fonts.check(SPEC(f)); })
        .map(function (f) { return f.name; }),
    };
  });
</script>
</body>
</html>`;
}

function serve(html) {
  return import('node:http').then(({ default: http }) => {
    const srv = http.createServer((req, res) => {
      const p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/' || p === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end(html);
      }
      res.writeHead(204); res.end();
    });
    return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ srv, port: srv.address().port })));
  });
}

async function open(browser, html, C, theme) {
  const { srv, port } = await serve(html);
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('  page error: ' + e.message));
  await page.setViewport({ width: C.VW, height: C.VH, deviceScaleFactor: C.DSF });
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' },
      { name: 'prefers-color-scheme', value: theme }],
  });
  let expired = null;
  cdp.on('Emulation.virtualTimeBudgetExpired', () => { const f = expired; expired = null; if (f) f(); });
  const advance = async ms => {
    const p = new Promise(r => { expired = r; });
    await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pauseIfNetworkFetchesPending', budget: ms });
    await p;
  };
  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' });
  return { page, cdp, srv, advance };
}

export async function run(C) {
  if (!C.CHROME) throw new Error('no chrome found');
  const browser = await puppeteer.launch({
    executablePath: C.CHROME, headless: true,
    args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none',
      '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio'],
  });
  const made = [];
  if (C.FONT_SHEET) {
    console.log('\n  ' + C.VW * C.DSF + 'x' + C.VH * C.DSF + ', the font sheet\n');
    const { page, cdp, srv, advance } = await open(browser, fontsHtml(C), C, 'dark');
    for (let i = 0; i < 900; i++) {
      const ok = await page.evaluate(() => !!window.__built).catch(() => false);
      if (ok) break;
      await advance(1000 / 60);
    }
    const built = await page.evaluate(() => window.__built);
    if (!built) throw new Error('the font sheet never finished building');
    if (built.missing.length) throw new Error('these did not load: ' + built.missing.join(', '));
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: C.VW, height: C.VH, scale: C.DSF },
    });
    const file = path.join(C.OUT, FONTS.out);
    fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
    await page.close(); srv.close();
    console.log('  ' + FACES.length + ' faces at ' + FONTS.size + ' css px, all loaded — '
      + Math.round(fs.statSync(file).size / 1024) + ' KB');
    made.push(file);
  } else {
    console.log('\n  ' + C.VW * C.DSF + 'x' + C.VH * C.DSF + ', two stills, title safe '
      + C.SAFE.left + '/' + C.SAFE.top + ' css\n');
    const geojson = readLand();
    for (const s of STILLS) {
      if (C.ONLY && s.key !== C.ONLY) continue;
      const plan = planFor(s, SIZE);
      const at = stillMoment(plan, AT);
      const { page, cdp, srv, advance } = await open(browser, stillHtml(s, plan, geojson, C), C, s.theme);
      for (let i = 0; i < 1200; i++) {
        const ok = await page.evaluate(() => !!(window.__built && window.__globe && window.__globe.ready))
          .catch(() => false);
        if (ok) break;
        await advance(1000 / 60);
      }
      const built = await page.evaluate(() => window.__built);
      if (!built) throw new Error(s.key + ': the page never finished building');
      if (!built.sub.nunito) throw new Error(s.key + ': Nunito did not load');
      const pings = await page.evaluate((t, spin) => window.__globe.apply(t, spin), GLOBE_T, G.spin);
      await page.evaluate(f => window.__mas.apply(f), mascotFrame(plan, at));
      const ink = await page.evaluate(() => window.__intro.inkBox());
      const sub = await page.evaluate(() => window.__intro.subBox());
      const shot = await cdp.send('Page.captureScreenshot', {
        format: 'png', captureBeyondViewport: false,
        clip: { x: 0, y: 0, width: C.VW, height: C.VH, scale: C.DSF },
      });
      const file = path.join(C.OUT, 'site-still-' + s.key + '.png');
      fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
      await page.close(); srv.close();
      const cl = b => [b.l - C.SAFE.left, C.VW - C.SAFE.right - b.r,
        b.t - C.SAFE.top, C.VH - C.SAFE.bottom - b.b].map(v => +v.toFixed(1));
      console.log('  ' + s.key + '  head ' + built.headPx + ' device px, ' + pings
        + ' pings, still at ' + at.toFixed(3) + 's — '
        + Math.round(fs.statSync(file).size / 1024) + ' KB');
      console.log('    him       safe by  ' + cl(ink).join('  ') + '  css px (l r t b)');
      console.log('    subtitle  safe by  ' + cl(sub).join('  ') + '  css px (l r t b)');
      const bad = [...cl(ink), ...cl(sub)].some(v => v < 0);
      if (bad) throw new Error(s.key + ': something is outside the safe area');
      made.push(file);
    }
  }
  await browser.close();
  console.log('\n  ' + made.map(f => path.relative(path.join(C.HERE, '..'), f).replace(/\\/g, '/')).join('\n  ') + '\n');
}
