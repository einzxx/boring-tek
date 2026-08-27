/* the boring tek — the scene strip. renders out/scenes-test.mp4, the five
   pictogram scenes back to back with the dead air taken out, so the layer can
   be judged in ten seconds instead of by scrubbing a twenty two second clip
   with a voice on it.

   tooling, not the site: nothing here ships and nothing here edits index.html.

   ---------- what it is and is not ----------

   it is post6's own scenes. `SCENES` and `SCENE_BOX` are imported out of
   `post6.mjs` rather than copied into this file, and that is the whole point:
   a second copy of a scene table drifts from the first one inside a week and
   then the strip is judging something that is not what ships. importing means
   post6.mjs must not render a clip when it is imported, which is why its run
   block sits behind a main() guard.

   the frame is production's frame, exactly: 1080x1920, light theme, the same
   vignette, the block in the same place at the same size, the wordmark where it
   always is. what is missing is the voice, the captions and the mascot, because
   those are the three things this is not for.

   ---------- the retiming ----------

   the five scenes run 23.3s end to end at their own speed, which does not fit
   in ten. the compression is on the *gaps* only: every step keeps its own
   duration, so a coin still falls in 0.58s and a lock still seats in 0.30, and
   what shrinks is the silence between them that the voice used to fill.

   that is the only honest way to speed this up. scaling the durations as well
   would give a ten second strip of a layer that moves at three times the speed
   of the one that ships, which is worse than useless: it would look fine and
   the real one would not.

   the strip is therefore whatever length the moves themselves add up to. the
   run prints it. K below is the gap compression and it is the one knob.

     node scenes-test.mjs                 the strip
     DEMO_FPS=12 node scenes-test.mjs     the fast preview pass
*/

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { brandTokens } from './lib/captions.mjs';
import {
  planScenes, sceneFrame, sceneMotion, pictogramCss, pictogramMarkup,
  pictogramPage, pictogramPagePlan, describeScenes, SCENE_ENTER, SCENE_EXITS,
} from './lib/pictograms.mjs';
import { SCENES, SCENE_BOX } from './post6.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-scenes-test');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = 2;
const VW = 540, VH = 960, SAFE = 48;
/* the shadow's floor, the same one post6 carries: the ink keeps the frame's 96
   device px and a large blur at low opacity is allowed to sit closer. */
const SOFT_SAFE = 36;
const WORDMARK_CY = 854, WORDMARK_W = 250;
/* the label sits under the block, in the air the captions use in the real clip,
   so it never collides with a scene and never covers one. */
const LABEL_Y = 400;
const TAIL = 0.55;

/* ---------- the retiming ----------
   K is how much of each scene's own dead air survives. every step keeps its
   `for`; only its start time moves closer to the one before it. 0.33 lands the
   strip near ten seconds with this table, and if the table changes the strip
   changes length rather than changing speed, which is the correct way round. */
const K = 0.33;
const HOLD = 0.24;    /* how long a finished scene sits still before it leaves */
const LAP = 0.28;     /* the crossfade, the same handoff the real clip uses */
const OPEN = 0.10;

function restrip(scenes) {
  const out = [];
  let cursor = OPEN;
  scenes.forEach((sc, i) => {
    const enter = { ...SCENE_ENTER, ...(sc.enterOpts || {}) };
    const floor = enter.for * 0.5 + 0.01;
    const exitFor = sc.exit ? SCENE_EXITS[sc.exit].for : 0;
    const inT = cursor;
    let lastEnd = inT + floor;
    const parts = (sc.parts || []).map(p => {
      const steps = (Array.isArray(p.steps) ? p.steps : [p.steps]).map(st => {
        const t = +(inT + Math.max(floor, (st.t - sc.in) * K)).toFixed(3);
        const dur = st.for == null ? 0.5 : st.for;
        lastEnd = Math.max(lastEnd, t + dur);
        return { ...st, t };
      });
      return { ...p, steps };
    });
    const leaving = +(lastEnd + HOLD).toFixed(3);
    const outT = +(leaving + exitFor + (i === scenes.length - 1 ? TAIL : 0)).toFixed(3);
    out.push({ ...sc, in: +inT.toFixed(3), out: outT, parts });
    cursor = +(outT - LAP).toFixed(3);
  });
  return out;
}

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- the scene ---------- */
function sceneHtml(pic, labels) {
  const { light, dark } = brandTokens();
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<title>scene strip</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500&display=swap">
<style>
:root{
${light}
}
html[data-theme=dark]{
${dark}
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}
${pictogramCss(pic, SCENE_BOX)}
/* the vignette, breathing on the site's own loop. it is load bearing rather
   than decorative: with nothing animating at all chrome stops producing
   compositor frames and Page.captureScreenshot blocks on a frame that never
   comes. post2.mjs found this and every clip since has carried the fix. */
.vignette{position:fixed;inset:-10%;background-image:var(--vig);pointer-events:none;z-index:0;
  will-change:transform,opacity;
  animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{
  from{transform:scale(1) translate3d(0,0,0);opacity:.88}
  to{transform:scale(1.045) translate3d(0,-1.2%,0);opacity:1}
}
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1}
/* the label. the system mono, which ships in the file and costs no request, at
   the micro size the site uses for its own small print. it names the scene and
   the seconds it holds in the real clip, so a judgement made here can be taken
   straight back to post6.mjs. */
.label{
  position:absolute;left:0;right:0;top:${LABEL_Y}px;text-align:center;
  font-family:var(--mono);font-size:13px;letter-spacing:.14em;line-height:1;
  color:var(--muted);white-space:nowrap;opacity:0;
}
.wordmark{
  position:absolute;left:50%;top:${WORDMARK_CY}px;transform:translate(-50%,-50%);
  font-family:var(--display);font-weight:400;color:var(--muted);
  text-transform:uppercase;letter-spacing:.18em;white-space:nowrap;line-height:1;
  text-indent:.09em;
}
</style>
</head>
<body>
<div class="vignette"></div>
<div class="stage">
  <div class="wordmark" id="wordmark">the boring tek</div>
  <div class="label" id="label"><span id="label-ink"></span></div>
${pictogramMarkup(pic)}
</div>
<script>
window.__PIC_PLAN = ${JSON.stringify(pictogramPagePlan(pic, SCENE_BOX))};
${pictogramPage.toString()}
pictogramPage();
window.__ST = ${JSON.stringify({ VW, VH, WORDMARK_W, labels })};
${stripPage.toString()}
stripPage();
</script>
</body>
</html>`;
}

/* ---------- the strip's own script ---------- */
function stripPage() {
  function fitWordmark() {
    const el = document.getElementById('wordmark');
    const s = el.textContent.toUpperCase();
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = '400 100px Michroma';
    /* measured rendered, in caps, because text-transform is invisible to
       measureText and costs michroma about 15% of its width. */
    const em = (cv.measureText(s).width + 0.18 * 100 * s.length) / 100;
    el.style.fontSize = (window.__ST.WORDMARK_W / em).toFixed(3) + 'px';
  }

  window.__st = {
    ready: false,
    /* the label follows whichever scene is most on screen, and fades with it,
       so a handoff reads as one name replacing another rather than as two. */
    label(f) {
      let best = -1, o = 0;
      for (let i = 0; i < f.s.length; i++) if (f.s[i][0] > o) { o = f.s[i][0]; best = i; }
      const el = document.getElementById('label');
      const ink = document.getElementById('label-ink');
      const txt = best < 0 ? '' : window.__ST.labels[best];
      if (ink.textContent !== txt) ink.textContent = txt;
      el.style.opacity = o.toFixed(4);
      return { which: best, o: +o.toFixed(4), txt: txt };
    },
    /* the whole frame's safe area, the pictogram half unioned with the two bits
       of type, and both the ink and the shadow answers kept apart exactly as
       post6 keeps them. */
    safe() {
      const pic = window.__pic.safe(window.__ST.VW, window.__ST.VH);
      if (!pic) return null;
      const out = {
        left: pic.left, top: pic.top, right: pic.right, bottom: pic.bottom,
        worst: pic.worst, low: pic.low, lowest: pic.lowest,
        soft: Math.min(pic.softLeft, pic.softTop, pic.softRight, pic.softBottom),
        softLow: pic.softLow,
      };
      /* the label's own box is the full frame width, so it is the span inside
         it that gets measured: a centred block that touches both borders is not
         a thing that comes near a border. */
      for (const sel of ['#wordmark', '#label-ink']) {
        const el = document.querySelector(sel);
        if (!el || !parseFloat(getComputedStyle(el).opacity)) continue;
        const b = el.getBoundingClientRect();
        if (!b.width && !b.height) continue;
        const d = [b.left, b.top, window.__ST.VW - b.right, window.__ST.VH - b.bottom];
        if (Math.min.apply(null, d) < Math.min(out.left, out.top, out.right, out.bottom)) out.worst = sel;
        out.left = Math.min(out.left, d[0]); out.top = Math.min(out.top, d[1]);
        out.right = Math.min(out.right, d[2]); out.bottom = Math.min(out.bottom, d[3]);
      }
      out.near = +Math.min(out.left, out.top, out.right, out.bottom).toFixed(1);
      out.soft = +out.soft.toFixed(1);
      return out;
    },
    /* how much clear air there is between the lowest pictogram shadow and the
       top of the label. the label is the only thing under the block here, and
       a scene that reached it would be a scene that reaches a caption in the
       real clip. */
    clearance() {
      const pic = window.__pic.safe(window.__ST.VW, window.__ST.VH);
      if (!pic) return null;
      const b = document.getElementById('label-ink').getBoundingClientRect();
      return { gap: +(b.top - pic.softLow).toFixed(1), inkGap: +(b.top - pic.low).toFixed(1), lowest: pic.lowest };
    },
  };

  document.fonts.load('400 1em Michroma')
    .then(() => document.fonts.ready)
    .then(() => {
      fitWordmark();
      window.__picBuilt = window.__pic.build();
      window.__st.ready = true;
    });
}

/* the rAF shim, flushed exactly once per captured frame, which is what makes
   one tick one frame. */
function injected() {
  let seed = 0x3f9a20c5;
  Math.random = function () {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; seed |= 0;
    return (seed >>> 0) / 4294967296;
  };
  const rafQ = [];
  let rafId = 1;
  window.requestAnimationFrame = function (cb) { rafQ.push({ id: rafId, cb: cb }); return rafId++; };
  window.cancelAnimationFrame = function (id) {
    const k = rafQ.findIndex(function (e) { return e.id === id; });
    if (k > -1) rafQ.splice(k, 1);
  };
  window.__dmRaf = function (now) {
    const batch = rafQ.splice(0, rafQ.length);
    for (const e of batch) { try { e.cb(now); } catch (err) { } }
    return rafQ.length;
  };
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

/* ---------- render ---------- */
async function render(pic, labels, seconds, motion) {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  const N = Math.round(FPS * seconds);
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.mkdirSync(FRAMES, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });
  console.log('  scenes-test: ' + VW * DSF + 'x' + VH * DSF + ', ' + N + ' frames');

  const { srv, port } = await serve(sceneHtml(pic, labels));
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none',
      '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });
  await page.evaluateOnNewDocument(injected);
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-reduced-motion', value: 'no-preference' },
      { name: 'prefers-color-scheme', value: 'light' },
    ],
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
  for (let i = 0; i < 150; i++) {
    const ok = await page.evaluate(() => !!(window.__st && window.__st.ready
      && window.__pic && window.__pic.ready && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  if (!await page.evaluate(() => !!(window.__st && window.__st.ready))) {
    throw new Error('the strip never became ready');
  }
  const picBuilt = await page.evaluate(() => window.__picBuilt);
  console.log('  scene layer built: ' + picBuilt.scenes + ' groups, ' + picBuilt.parts
    + ' parts, ' + picBuilt.drawn + ' path lengths measured, ' + picBuilt.shadows
    + ' shadow filters, ' + picBuilt.knocks + ' knocked');

  /* sampled where the layer is actually moving: the midpoint of every step of
     every part, the middle of every handoff, and each scene once it has
     settled. a sample on a resting frame proves nothing about a coin that is
     halfway down or a glass that is halfway across. */
  const samples = [];
  for (const p of pic.parts) {
    for (const st of p.steps) samples.push({ t: st.t + st.for / 2, who: p.id + ' ' + st.kind });
  }
  for (const h of motion.handoffs) samples.push({ t: (h[0] + h[1]) / 2, who: 'handoff' });
  for (const sc of pic.scenes) samples.push({ t: Math.min(sc.leaving - 0.05, sc.settled + 0.20), who: sc.id + ' settled' });
  samples.sort((a, b) => a.t - b.t);
  let next = 0;

  let safeWorst = null, softWorst = null, clearWorst = null, labelSeen = 0;
  let ticks = 0, visMax = 0, moved = 0, applied = 0, prevSum = null, prev = null;
  const faults = [];
  const wall = Date.now();

  for (let f = 0; f < N; f++) {
    const t = f / FPS;
    const fr = sceneFrame(pic, t);
    if (prev) {
      for (let i = 0; i < fr.p.length; i++) {
        const a = prev.p[i], b = fr.p[i];
        moved = Math.max(moved, Math.hypot(b[2] - a[2], b[3] - a[3]));
      }
    }
    prev = fr;
    const lab = await page.evaluate(fp => { window.__pic.set(fp); return window.__st.label(fp); }, fr);
    if (lab.o > 0.5 && lab.txt) labelSeen++;
    await page.evaluate(now => window.__dmRaf(now), (f + 1) * STEP);
    const last = await page.evaluate(() => window.__pic.last);
    if (!last) faults.push({ t, what: 'never ticked' });
    else {
      ticks = last.ticks;
      visMax = Math.max(visMax, last.vis);
      if (last.t !== fr.t) faults.push({ t, what: 'stale frame' });
      if (last.ticks !== f + 1) faults.push({ t, what: 'tick count' });
      if (prevSum !== null) applied = Math.max(applied, Math.abs(last.sum - prevSum));
      prevSum = last.sum;
    }

    while (next < samples.length && t >= samples[next].t) {
      const s = samples[next++];
      const [sa, cl] = await page.evaluate(() => [window.__st.safe(), window.__st.clearance()]);
      if (!sa) continue;
      if (!safeWorst || sa.near < safeWorst.near) safeWorst = { at: s.who, t: +t.toFixed(3), ...sa };
      if (!softWorst || sa.soft < softWorst.soft) softWorst = { at: s.who, t: +t.toFixed(3), ...sa };
      if (cl && (!clearWorst || cl.gap < clearWorst.gap)) clearWorst = { at: s.who, t: +t.toFixed(3), ...cl };
    }

    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'jpeg', quality: 94, captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
    });
    fs.writeFileSync(path.join(FRAMES, 'f' + String(f).padStart(5, '0') + '.jpg'),
      Buffer.from(shot.data, 'base64'));
    await advance(STEP);
    if (f % 180 === 0) {
      console.log('  ' + String(f).padStart(4) + '/' + N + '  t=' + t.toFixed(2) + 's  '
        + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
    }
  }

  console.log('  scenes: ' + ticks + ' rAF ticks for ' + N + ' frames, at most ' + visMax
    + ' on screen at once, biggest one-frame part move ' + moved.toFixed(3) + ' units, '
    + (faults.length || 'no') + ' fault(s)');
  console.log('  the layer never gets closer than ' + Math.round(safeWorst.near * DSF)
    + 'px to a border at ' + safeWorst.t.toFixed(2) + 's on ' + safeWorst.worst
    + ' (floor ' + SAFE * DSF + '), the shadow ' + Math.round(softWorst.soft * DSF)
    + 'px at ' + softWorst.t.toFixed(2) + 's (floor ' + SOFT_SAFE * DSF + ')');
  console.log('  and never closer than ' + clearWorst.gap.toFixed(0)
    + 'px to the label at ' + clearWorst.t.toFixed(2) + 's on "' + clearWorst.lowest
    + '" — that is the shadow; the ink stops ' + clearWorst.inkGap.toFixed(0) + 'px short');
  console.log('  the label was up and legible on ' + labelSeen + ' of ' + N + ' frames');

  await browser.close();
  srv.close();
  return { frames: N, ticks, visMax, moved, applied, faults, picBuilt,
    safe: safeWorst, soft: softWorst, clearance: clearWorst, labelSeen };
}

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }

function encode() {
  const out = path.join(OUT, 'scenes-test.mp4');
  console.log('  encoding ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-r', String(FPS), '-an', '-movflags', '+faststart', out]);
  return out;
}

function probe(file) {
  let out = '';
  try { execFileSync(ffmpeg, ['-hide_banner', '-i', file], { stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { out = (e.stderr || '').toString(); }
  const dur = out.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const res = out.match(/,\s*(\d{2,5})x(\d{2,5})[\s,]/);
  const fps = out.match(/([\d.]+)\s*fps/);
  return {
    seconds: dur ? (+dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3])) : null,
    w: res ? +res[1] : null, h: res ? +res[2] : null,
    fps: fps ? parseFloat(fps[1]) : null,
  };
}

/* ---------- go ---------- */
console.log('the boring tek — the scene strip, post6\'s five scenes with the air taken out');
brandTokens();

const strip = restrip(SCENES);
const pic = planScenes(strip);
const SECONDS = +(pic.seconds).toFixed(2);
const labels = strip.map((sc, i) => sc.id + '  ·  ' + SCENES[i].in.toFixed(2)
  + ' to ' + SCENES[i].out.toFixed(2) + ' in post6');

console.log(describeScenes(pic));
console.log('  ' + SECONDS.toFixed(2) + 's of strip against '
  + SCENES.reduce((a, s) => a + (s.out - s.in), 0).toFixed(2)
  + 's of scene in post6, gaps at ' + (K * 100).toFixed(0)
  + '% and every step at its own speed');

const motion = sceneMotion(pic, FPS, SECONDS);
{
  const R = STEP / 16.6667, w = motion.worst;
  const L = { partM: 4.5 * R, partS: 0.14 * R, partD: 0.12 * R, partO: 0.20 * R, partR: 10 * R, partL: 0.22 * R };
  console.log('  walked at ' + FPS + 'fps before rendering:');
  console.log('    move ' + w.partM.d.toFixed(3) + ' on ' + w.partM.who
    + ', scale ' + w.partS.d.toFixed(3) + ' on ' + w.partS.who
    + ', draw ' + w.partD.d.toFixed(3) + ' on ' + w.partD.who);
  console.log('    fade ' + w.partO.d.toFixed(3) + ' on ' + w.partO.who
    + ', turn ' + w.partR.d.toFixed(2) + ' on ' + w.partR.who
    + ', lift ' + w.partL.d.toFixed(3) + ' on ' + w.partL.who);
  console.log('    ' + motion.handoffs.length + ' handoffs, at most ' + motion.visMax
    + ' scenes at once, ' + motion.dark.toFixed(2) + 's with the zone empty');
  /* the same limits post6 runs, because it is the same layer. a strip that
     passed on numbers the clip would fail on would be judging nothing. */
  const bad = [];
  for (const [k, v] of Object.entries(L)) if (w[k].d > v) bad.push(k + ' ' + w[k].d.toFixed(3) + ' on ' + w[k].who + ' over ' + v.toFixed(3));
  if (motion.visMax > 2) bad.push(motion.visMax + ' scenes on screen at once');
  if (bad.length) {
    console.error(['', 'FAILED before rendering — the retimed layer snaps', ...bad].join('\n  '));
    process.exit(1);
  }
}

const state = await render(pic, labels, SECONDS, motion);
const file = encode();
const p = probe(file);
const mb = (fs.statSync(file).size / 1e6).toFixed(2) + ' MB';
console.log('  ' + p.w + 'x' + p.h + ' @' + p.fps + 'fps ' + p.seconds.toFixed(2)
  + 's  silent  ' + mb + '  ' + path.relative(ROOT, file));

/* one frame per scene, on the frame it has finished building, pulled back out
   of the finished mp4 rather than out of the render. */
const dir = path.join(OUT, 'verify-scenes-test');
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
pic.scenes.forEach((sc, i) => {
  const t = Math.min(sc.leaving - 0.06, sc.out - 0.2);
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(t.toFixed(2)),
    '-i', file, '-frames:v', '1', path.join(dir, String.fromCharCode(97 + i) + '-' + sc.id + '.png')]);
});
console.log('  one settled frame per scene into ' + path.relative(ROOT, dir));

fs.rmSync(FRAMES, { recursive: true, force: true });

/* ---------- the guards ----------
   the layer's, not the clip's: there is no voice to be in sync with and no
   caption to clear, so what is left is that it drew, that it drew on the shim's
   clock, and that it stayed inside the frame. */
const fail = [];
if (p.w !== VW * DSF || p.h !== VH * DSF) fail.push('not ' + VW * DSF + 'x' + VH * DSF);
if (Math.abs(p.fps - FPS) > 0.5) fail.push('not ' + FPS + 'fps');
if (Math.abs(p.seconds - SECONDS) > 0.2) fail.push(p.seconds + 's, wanted ' + SECONDS);
if (state.faults.length) {
  fail.push(state.faults.length + ' scene fault(s), first at '
    + state.faults[0].t.toFixed(2) + 's (' + state.faults[0].what + ')');
}
if (state.ticks !== state.frames) {
  fail.push('the scene layer ticked ' + state.ticks + ' times for ' + state.frames
    + ' frames — it is not on the rAF shim\'s clock');
}
if (!(state.moved > 0.0001)) fail.push('no part of the scene layer ever moved');
if (!(state.applied > 0.0001)) fail.push('the page never wrote a different scene value between two frames');
if (state.visMax > 2) fail.push(state.visMax + ' scenes were on screen at once');
if (state.picBuilt.scenes !== SCENES.length) {
  fail.push('the strip drew ' + state.picBuilt.scenes + ' scenes, post6 has ' + SCENES.length);
}
if (state.safe.near * DSF < SAFE * DSF - 0.5) {
  fail.push(state.safe.worst + ' comes within ' + Math.round(state.safe.near * DSF)
    + 'px of a border, floor is ' + SAFE * DSF);
}
if (state.soft.soft * DSF < SOFT_SAFE * DSF - 0.5) {
  fail.push('a shadow comes within ' + Math.round(state.soft.soft * DSF)
    + 'px of a border, floor is ' + SOFT_SAFE * DSF);
}
if (!state.clearance || state.clearance.gap < 0) {
  fail.push('a scene reaches the label, which means it would reach a caption in the clip');
}
if (!(state.labelSeen > state.frames * 0.6)) {
  fail.push('the label was legible on only ' + state.labelSeen + ' of ' + state.frames
    + ' frames — the strip is unreadable as a reference');
}

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
