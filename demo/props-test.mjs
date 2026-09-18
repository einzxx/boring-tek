/* the boring tek — the props test. every module in lib/props/ once, three
   seconds each, alternating the two themes, and nothing else in the frame.

     node props-test.mjs                  18s at 12fps to out/
     DEMO_FPS=60 node props-test.mjs      the same at 60
     node props-test.mjs still --at=4.5   one frame to out/props-still.png

   one output, one path, overwritten every run, which is rig-test.mjs's rule:

     demo/out/props-test-1080x1920.mp4

   the six scenes, in order, light dark light dark light dark:

     background paths     kokonutui's 37 sweeps, in --fg and --accent
     beams                kokonutui's blurred canvas beams, in --accent
     ai input             kokonutui's search box, typing, the toggle springs on
     hand written         kokonutui's loop drawn round a michroma title
     bar chart            bklit's bars growing up, staggered, dashed rows
     line chart           bklit's natural spline revealed left to right, ring

   each scene is `apply(t)` on its prop with the scene's own clock, so a frame
   is a function of time and of nothing else. the theme flips on <html>
   between scenes, which is how the site does it, and every prop follows
   because it holds no colour of its own. */

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { STAGE } from './lib/mascot.mjs';
import { propsTokens, propsBaseCss, propsRuntime, FONTS_LINK } from './lib/props/tokens.mjs';
import { pathsCss, pathsMarkup, pathsScript } from './lib/props/background-paths.mjs';
import { beamsCss, beamsMarkup, beamsScript } from './lib/props/beams.mjs';
import { aiInputCss, aiInputMarkup, aiInputScript } from './lib/props/ai-input.mjs';
import { handCss, handMarkup, handScript } from './lib/props/hand-written.mjs';
import { barCss, barMarkup, barScript, lineCss, lineMarkup, lineScript } from './lib/props/charts.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-props');
const VW = STAGE.w, VH = STAGE.h, DSF = STAGE.dsf;

const argv = process.argv.slice(2);
const flag = (name, d) => {
  const hit = argv.find(a => a.startsWith('--' + name + '='));
  return hit === undefined ? d : parseFloat(hit.split('=')[1]);
};
const STILL = argv.includes('still');
const KEEP = argv.includes('--keep-frames');
const FPS = Number(process.env.DEMO_FPS || 12);

/* the scenes. `for` is seconds on screen; the prop's own clock starts at 0
   when the scene does. */
const SCENES = [
  { id: 'paths', theme: 'light', for: 3, title: 'background paths', from: 'kokonutui, mit', bg: true },
  { id: 'beams', theme: 'dark',  for: 3, title: 'beams',            from: 'kokonutui, mit', bg: true },
  { id: 'ai',    theme: 'light', for: 3, title: 'ai input',         from: 'kokonutui, mit' },
  { id: 'hand',  theme: 'dark',  for: 3, title: 'hand written',     from: 'kokonutui, mit' },
  { id: 'bar',   theme: 'light', for: 3, title: 'bar chart',        from: 'bklit ui, mit' },
  { id: 'line',  theme: 'dark',  for: 3, title: 'line chart',       from: 'bklit ui, mit' },
];
const SECONDS = SCENES.reduce((s, x) => s + x.for, 0);

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

function pageHtml() {
  const opts = { w: VW, h: VH, dsf: DSF };
  const scene = (s, inner) => `<section class="scene" data-scene="${s.id}" data-theme="${s.theme}">
  <div class="tag"><span class="t1">// ${s.title}</span><span class="t2">${s.from}</span></div>
  ${inner}
</section>`;
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<title>props</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS_LINK}">
<style>
${propsTokens()}
${propsBaseCss()}
html,body{overflow:hidden}
body{width:${VW}px;height:${VH}px}
.stage{position:relative;width:${VW}px;height:${VH}px;overflow:hidden;background:var(--bg)}
/* load bearing, not decoration: with nothing animating at all chrome stops
   producing compositor frames and the screenshot call blocks on frame one
   forever. every clip in demo/ carries something like it. */
.tick{position:absolute;left:-20px;top:-20px;width:2px;height:2px;background:var(--bg);
  will-change:transform;animation:tick 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes tick{from{transform:translate3d(0,0,0)}to{transform:translate3d(1px,0,0)}}
.scene{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:var(--bg)}
.scene.is-on{display:flex}
.tag{position:absolute;left:0;right:0;top:96px;display:flex;flex-direction:column;align-items:center;gap:4px;
  font:12px/1.4 var(--mono);color:var(--muted);z-index:2}
.tag .t1{color:var(--fg)}
.mark{position:relative;z-index:1;font:400 22px/1.3 var(--display);color:var(--fg);text-align:center}
${pathsCss()}
${beamsCss(opts)}
${aiInputCss()}
${handCss()}
${barCss()}
${lineCss()}
</style>
</head>
<body>
<div class="stage">
  <div class="tick"></div>
  ${scene(SCENES[0], pathsMarkup() + '<div class="mark">the boring tek</div>')}
  ${scene(SCENES[1], beamsMarkup(opts) + '<div class="mark">the boring tek</div>')}
  ${scene(SCENES[2], aiInputMarkup())}
  ${scene(SCENES[3], handMarkup())}
  ${scene(SCENES[4], barMarkup())}
  ${scene(SCENES[5], lineMarkup())}
</div>
<script>
${propsRuntime()}
${pathsScript()}
${beamsScript(opts)}
${aiInputScript()}
${handScript()}
${barScript()}
${lineScript()}
(function(){
  var S = ${JSON.stringify(SCENES)};
  var els = {};
  document.querySelectorAll('.scene').forEach(function(el){ els[el.getAttribute('data-scene')] = el; });
  /* one call for the whole clip: pick the scene, set its theme, run its prop
     on the scene's own clock. */
  window.__show = function(t) {
    var t0 = 0, cur = S[S.length - 1], local = 0;
    for (var i = 0; i < S.length; i++) {
      if (t < t0 + S[i].for || i === S.length - 1) { cur = S[i]; local = t - t0; break; }
      t0 += S[i].for;
    }
    document.documentElement.setAttribute('data-theme', cur.theme);
    for (var k in els) els[k].classList.toggle('is-on', k === cur.id);
    window.__props.get(cur.id).apply(Math.max(0, local));
    return cur.id;
  };
  /* the lazy faces. a hidden scene never asks for its font, so ask now. */
  Promise.all([
    document.fonts.load('400 20px Michroma'),
    document.fonts.load('400 14px "Space Grotesk"'),
    document.fonts.load('500 14px "Space Grotesk"'),
  ]).then(function(){ return document.fonts.ready; }).then(function(){ window.__ready = true; });
})();
<\/script>
</body>
</html>`;
}

function serve(html) {
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/' || p === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }
    res.writeHead(404); res.end('not here');
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ srv, port: srv.address().port })));
}

async function open() {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  const { srv, port } = await serve(pageHtml());
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none',
      '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
  });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));

  let expired = null;
  cdp.on('Emulation.virtualTimeBudgetExpired', () => { const f = expired; expired = null; if (f) f(); });
  const advance = async ms => {
    const p = new Promise(r => { expired = r; });
    await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pauseIfNetworkFetchesPending', budget: ms });
    await p;
  };

  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' });
  for (let i = 0; i < 600; i++) {
    const ok = await page.evaluate(() => !!window.__ready).catch(() => false);
    if (ok) break;
    await advance(1000 / 60);
  }
  if (errors.length) throw new Error('the page threw: ' + errors.join(' | '));
  const ok = await page.evaluate(() => !!window.__ready);
  if (!ok) throw new Error('the page never became ready (fonts?)');
  const names = await page.evaluate(() => window.__props.names());
  console.log('  props on the page: ' + names.join(', '));

  const shoot = async file => {
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
    });
    fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
  };
  return { browser, srv, page, shoot, errors };
}

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }

function probe(file) {
  let out = '';
  try { execFileSync(ffmpeg, ['-hide_banner', '-i', file], { stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { out = (e.stderr || '').toString(); }
  const dur = out.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const res = out.match(/,\s*(\d{2,5})x(\d{2,5})[\s,]/);
  const fps = out.match(/([\d.]+)\s*fps/);
  return {
    seconds: dur ? +dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3]) : null,
    w: res ? +res[1] : null, h: res ? +res[2] : null,
    fps: fps ? parseFloat(fps[1]) : null,
  };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  if (STILL) {
    console.log('the boring tek — props, one frame\n');
    const { browser, srv, page, shoot } = await open();
    const at = flag('at', 0);
    const id = await page.evaluate(t => window.__show(t), at);
    const file = path.join(OUT, 'props-still.png');
    await shoot(file);
    await browser.close(); srv.close();
    console.log('  t=' + at + 's is ' + id);
    console.log('  ' + path.relative(HERE, file) + '  ' + (fs.statSync(file).size / 1024).toFixed(0) + ' KB');
    return;
  }

  console.log('the boring tek — props test, ' + SECONDS + 's at ' + FPS + 'fps\n');
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.mkdirSync(FRAMES, { recursive: true });

  const { browser, srv, page, shoot, errors } = await open();
  const N = Math.round(FPS * SECONDS);
  const wall = Date.now();
  const seen = {};
  for (let f = 0; f < N; f++) {
    const id = await page.evaluate(t => window.__show(t), f / FPS);
    seen[id] = (seen[id] || 0) + 1;
    await shoot(path.join(FRAMES, 'f' + String(f).padStart(5, '0') + '.png'));
  }
  await browser.close(); srv.close();
  if (errors.length) throw new Error('the page threw while rendering: ' + errors.join(' | '));
  console.log('  ' + N + ' frames in ' + ((Date.now() - wall) / 1000).toFixed(1) + 's');
  for (const s of SCENES) console.log('    ' + s.id.padEnd(6) + (seen[s.id] || 0) + ' frames, ' + s.theme);

  const out = path.join(OUT, 'props-test-' + VW * DSF + 'x' + VH * DSF + '.mp4');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.png'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-r', String(FPS), '-movflags', '+faststart', out]);
  if (!KEEP) fs.rmSync(FRAMES, { recursive: true, force: true });

  const p = probe(out);
  console.log('  ' + path.relative(HERE, out));
  console.log('  ' + p.w + 'x' + p.h + ', ' + p.seconds + 's, ' + p.fps + 'fps, '
    + (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
}

main().catch(e => { console.error('\n  ' + e.message); process.exit(1); });
