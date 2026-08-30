/* the boring tek — standalone mascot overlay clips.

   the second half of lib/mascot.mjs. the module drives our own renders; this
   renders the same seven states as clips on their own, 1080x1920, with the
   mascot already in its corner, so one can be dropped straight on top of a
   phone video in canva with nothing to reposition.

     node mascot-export.mjs                      every state, both themes
     node mascot-export.mjs curious delighted     just those two
     node mascot-export.mjs --theme=dark          just one theme
     node mascot-export.mjs --no-bubble           skip the bubble variants
     node mascot-export.mjs --no-turned           skip the turned variants
     node mascot-export.mjs --blur=4              a wider shutter
     DEMO_FPS=12 node mascot-export.mjs           the fast preview pass

   ---------- how many clips that is ----------

   nine states, two themes, with and without a bubble, and — for the seven that
   do not turn on their own — straight on and held at a three quarter turn. that
   is 64 clips and three flavours apiece, and it is about ninety minutes.
   `--no-turned` halves it and `--no-bubble` halves it again, which is what the
   flags are for: the full set is a thing to kick off and walk away from, not a
   thing to run while iterating.

   `turn-away` and `snap-back` are exported straight only, because the turn is
   what those two *are* — a turned variant of a state about turning would be the
   same clip starting somewhere else.

   ---------- what comes out ----------

   three flavours per clip, from one capture:

     -alpha.webm     vp9 with real alpha. the one to use. canva keeps the
                     transparency, so the mascot sits on the footage with
                     nothing behind it.
     -onblack.mp4    the same clip flattened onto solid black, for an editor
                     that will not take a webm. screen it, or key the black.
     -onwhite.mp4    and onto solid white, for the same reason on light footage.

   and a bubble variant of each, so a bubble can be used or skipped without
   re-rendering: `-bubble-` in the name, the same three flavours.

   ---------- the capture is small and the canvas is not ----------

   the frame is 1080x1920 and the mascot occupies a corner of it. capturing the
   whole canvas would be fourteen times the pixels, almost all of them
   transparent, and png at that size is a gigabyte a state.

   so the capture is a region: the union of every head rect in the clip and the
   bubble's own, grown by the glow's reach and the shadow's, rounded out to even
   device pixels. ffmpeg pads it back to 1080x1920 at exactly the offset it came
   from, so the output is the full canvas and the mascot is where the module put
   it. the region is computed from the same `headRect` the guards use, so it
   cannot disagree with them.

   ---------- there is no sound in these ----------

   they go over someone else's footage, which has its own. the two cues the
   module would emit are written to a json sidecar beside the clips instead, so
   the pop and the ding can be placed in the edit if they are wanted. */

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  planMascot, mascotFrame, mascotCss, mascotMarkup, mascotRuntime,
  mascotPagePlan, mascotCues, headRect, stillMoment,
  STATES, STATE_NAMES, THEMES, STAGE, SAFE, HEAD_PX, BUBBLE, GLOW, SHADOW,
} from './lib/mascot.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out', 'mascot');
const WORK = path.join(HERE, 'out', 'work-mascot');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = STAGE.dsf;
const VW = STAGE.w, VH = STAGE.h;

const argv = process.argv.slice(2);
const WANT = argv.filter(a => STATE_NAMES.includes(a));
const THEME_ARG = (argv.find(a => a.startsWith('--theme=')) || '').split('=')[1];
const NO_BUBBLE = argv.includes('--no-bubble');
const NO_TURNED = argv.includes('--no-turned');
/* where a turned variant sits. it is short of a full turn on purpose: at 1 he
   is in profile and the far eye is a sliver, which is a pose rather than an
   overlay you can drop under any shot. 0.6 is unmistakably three quarter and
   still reads as him. */
const TURNED = 0.6;
const KEEP = argv.includes('--keep-frames');
const BLUR_ARG = (argv.find(a => a.startsWith('--blur')) || '').split('=')[1];
const NO_BLUR = argv.includes('--no-blur');
/* the shutter is open by default here, unlike the test's, because these are the
   clips that ship. three rather than post10's four: an overlay is a small thing
   in a corner of somebody else's video, three subframes is where its motion
   stops stepping, and every extra subframe is another full png of a 1080x1920
   canvas on disk. */
const SUB = NO_BLUR ? 1 : Math.max(2, Math.min(12, Number(BLUR_ARG) || 3));
const SUBSTEP = STEP / SUB;

/* ---------- the clip ----------
   three and a half seconds: a beat of rest, the entrance, the hold, the exit,
   and it ends on the frame the exit finishes. that shape matters for an overlay
   more than it does for a clip — it starts and ends at the same pose, so two of
   them butt together and a single one can sit under a longer shot without a
   visible in or out. */
const SECONDS = 3.5;
const AT = 0.30;

/* two words each, in the house voice, and they are placeholders on purpose: the
   point of the bubble variants is that a bubble is available, not that these
   are the lines. `planMascot` refuses anything over the ceiling and refuses a
   dash, so a replacement cannot quietly break the rules. */
const BUBBLES = {
  neutral: 'still here',
  curious: 'go on',
  surprised: 'wait what',
  thinking: 'one sec',
  agreeing: 'yes',
  unimpressed: 'sure it is',
  delighted: 'shipped it',
};

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- the scene ----------
   the same page the test builds, with the background taken out. `html` and
   `body` are transparent and chrome is told its default background is
   transparent too, which is what makes `Page.captureScreenshot` in png carry an
   alpha channel rather than a white one. */
function sceneHtml(plan, theme) {
  return `<!doctype html>
<html lang="en" data-theme="${theme}">
<head>
<meta charset="utf-8">
<title>mascot overlay</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500&display=swap">
<style>
:root{
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  --body:"Space Grotesk",var(--mono);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:transparent}
body{width:${VW}px;height:${VH}px;font-family:var(--body)}
.stage{position:relative;width:${VW}px;height:${VH}px}
/* load bearing, not decoration: with nothing animating at all chrome stops
   producing compositor frames and the screenshot call blocks on frame one
   forever. two pixels off frame, and transparent like everything else. */
.tick{position:absolute;left:-20px;top:-20px;width:2px;height:2px;
  will-change:transform;animation:tick 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes tick{from{transform:translate3d(0,0,0)}to{transform:translate3d(1px,0,0)}}
${mascotCss(plan)}
</style>
</head>
<body>
<div class="stage">
  <div class="tick"></div>
${mascotMarkup(plan)}
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
${mascotRuntime()}
document.fonts.load('500 1em "Space Grotesk"')
  .then(() => document.fonts.ready)
  .then(() => { window.__built = window.__mas.build(); });
</script>
</body>
</html>`;
}

function injected() {
  let seed = 0x51d0c3a7;
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

/* ---------- the capture region ----------
   every head rect the clip draws, plus the bubble's own if there is one, grown
   by what the glow and the shadow reach past the ink, rounded out to even
   device pixels so the pad offsets stay whole and the chroma planes line up.

   it is computed from `headRect`, which is the same function the safe area
   guard reads, so a region that clipped the mascot would be a region the guard
   also thought was somewhere else — and it cannot be, because there is one of
   them. */
function region(plan, N, bubbleCss) {
  let L = 1e9, T = 1e9, R = -1e9, B = -1e9;
  for (let f = 0; f < N; f++) {
    const r = headRect(plan, mascotFrame(plan, f / FPS));
    L = Math.min(L, r.left / DSF);
    T = Math.min(T, r.top / DSF);
    R = Math.max(R, VW - r.right / DSF);
    B = Math.max(B, VH - r.bottom / DSF);
  }
  /* the glow is a blur, so it reaches three sigma past the ink in every
     direction; the shadow hangs below the head and softens outward. both are
     part of the picture even though neither counts as ink for the safe area. */
  const glow = GLOW.wide.blur * 3;
  const shad = SHADOW.dy * plan.size + plan.size * SHADOW.h * SHADOW.rise;
  L -= glow; T -= glow; R += glow; B = Math.max(B + glow, T + shad);
  if (bubbleCss) {
    L = Math.min(L, bubbleCss.left - 6); T = Math.min(T, bubbleCss.top - 10);
    R = Math.max(R, bubbleCss.right + 6); B = Math.max(B, bubbleCss.bottom + 6);
  }
  /* clamped to the canvas, and even on both axes. */
  const ev = v => Math.round(v / 2) * 2;
  const x = Math.max(0, ev(L)), y = Math.max(0, ev(T));
  const w = Math.min(VW - x, ev(R - x) + 2), h = Math.min(VH - y, ev(B - y) + 2);
  return { x, y, w, h, dev: { x: x * DSF, y: y * DSF, w: w * DSF, h: h * DSF } };
}

/* ---------- render ---------- */
async function render(state, theme, withBubble, turned) {
  const tag = state + '-' + theme + (turned ? '-turned' : '') + (withBubble ? '-bubble' : '');
  const plan = planMascot({
    seconds: SECONDS, theme,
    marks: [{
      t: AT, state,
      bubble: withBubble ? BUBBLES[state] : undefined,
      /* held at the turn for the whole mark rather than swung into it: the
         clip is an overlay, and a turn happening inside it would be a second
         event competing with the state's own. */
      turn: turned ? TURNED : undefined,
      turnFor: turned ? 0.5 : undefined,
    }],
  });
  const N = Math.round(FPS * SECONDS);
  const work = path.join(WORK, tag);
  fs.rmSync(work, { recursive: true, force: true });
  fs.mkdirSync(path.join(work, 'sub'), { recursive: true });
  fs.mkdirSync(path.join(work, 'blend'), { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });

  const { srv, port } = await serve(sceneHtml(plan, theme));
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
      { name: 'prefers-color-scheme', value: theme },
    ],
  });
  /* the whole point of this file. without it chrome paints its own white behind
     the page and every png comes back opaque, which looks correct in a preview
     and is useless the moment it is layered over anything. */
  await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });

  let expired = null;
  cdp.on('Emulation.virtualTimeBudgetExpired', () => { const f = expired; expired = null; if (f) f(); });
  const advance = async ms => {
    const p = new Promise(r => { expired = r; });
    await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pauseIfNetworkFetchesPending', budget: ms });
    await p;
  };

  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' });
  for (let i = 0; i < 160; i++) {
    const ok = await page.evaluate(() => !!(window.__mas && window.__mas.ready
      && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  if (!await page.evaluate(() => !!(window.__mas && window.__mas.ready))) {
    throw new Error(tag + ': the mascot scene never became ready');
  }
  if (withBubble && !await page.evaluate(() => document.fonts.check('500 20px "Space Grotesk"'))) {
    throw new Error(tag + ': Space Grotesk did not load and the bubble would ship in the mono fallback');
  }
  const built = await page.evaluate(() => window.__built);
  const caps = withBubble ? await page.evaluate(() => window.__mas.caps()) : null;

  /* the bubble's rect, measured once with it fully out, so the region can be
     drawn around the widest it ever is. */
  let bubbleCss = null;
  if (withBubble) {
    const m = plan.marks[0];
    await page.evaluate(fr => window.__mas.apply(fr), mascotFrame(plan, m.bubble.full + 0.02));
    bubbleCss = await page.evaluate(() => {
      const r = document.getElementById('m-bubble').getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width };
    });
  }
  const R = region(plan, N, bubbleCss);

  /* the safe area, on the same numbers the test guards on, because an overlay
     that breaks the platform margins is the one thing nobody can fix in the
     edit. */
  let headWorst = null;
  for (let f = 0; f < N; f++) {
    const r = headRect(plan, mascotFrame(plan, f / FPS));
    const near = Math.min(r.left, r.top, r.right, r.bottom);
    if (!headWorst || near < headWorst.near) headWorst = { t: +(f / FPS).toFixed(2), near, ...r };
  }
  let bubbleNear = null;
  if (bubbleCss) {
    bubbleNear = Math.min(bubbleCss.left, bubbleCss.top,
      VW - bubbleCss.right, VH - bubbleCss.bottom) * DSF;
  }

  const wall = Date.now();
  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      await page.evaluate(fr => window.__mas.apply(fr), mascotFrame(plan, t));
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);
      const shot = await cdp.send('Page.captureScreenshot', {
        format: 'png', captureBeyondViewport: false,
        clip: { x: R.x, y: R.y, width: R.w, height: R.h, scale: DSF },
      });
      fs.writeFileSync(path.join(work, 'sub', 's' + String(idx).padStart(6, '0') + '.png'),
        Buffer.from(shot.data, 'base64'));
      await advance(SUBSTEP);
    }
  }

  /* one still, clear of the blinks, as a poster frame for the folder. */
  const m = plan.marks[0];
  await page.evaluate(fr => window.__mas.apply(fr),
    mascotFrame(plan, stillMoment(plan, m.bubble ? m.bubble.full + 0.06 : m.settled + 0.08)));
  const poster = await cdp.send('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: false,
    clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
  });
  fs.writeFileSync(path.join(OUT, 'mascot-' + tag + '-still.png'), Buffer.from(poster.data, 'base64'));

  await browser.close();
  srv.close();

  const files = encode(tag, work, R, N);
  if (!KEEP) fs.rmSync(work, { recursive: true, force: true });

  console.log('  ' + tag.padEnd(34)
    + R.dev.w + 'x' + R.dev.h + ' region at ' + R.dev.x + ',' + R.dev.y
    + '  head ' + built.headPx + 'px, outline ' + built.strokePx + 'px, gap '
    + built.bubbleGapPx + 'px'
    + (caps ? ', caps ' + caps.capPx + 'px' : '')
    + '  ' + ((Date.now() - wall) / 1000).toFixed(0) + 's');

  return { tag, state, theme, withBubble, turned, plan, built, caps, R, headWorst, bubbleNear, bubbleCss, files };
}

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }

/* ---------- the three flavours ----------
   the shutter is applied once, into a blended png sequence, and the three
   encodes read that. blending three times would give three identical answers
   for three times the work.

   the alpha one is the deliverable and the two flat ones are conveniences, so
   the flat ones are made by compositing the alpha one over a colour rather than
   by rendering again. that is the only way to be sure all three are the same
   animation. */
function encode(tag, work, R, N) {
  const sub = path.join(work, 'sub', 's%06d.png');
  const blend = path.join(work, 'blend', 'b%05d.png');

  if (SUB > 1) {
    ff(['-y', '-hide_banner', '-loglevel', 'error',
      '-framerate', String(FPS * SUB), '-i', sub,
      '-vf', 'format=rgba,tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1)
        + ',setpts=PTS-STARTPTS,framestep=' + SUB,
      blend]);
  }
  const src = SUB > 1 ? blend : path.join(work, 'sub', 's%06d.png');
  const pad = 'pad=' + VW * DSF + ':' + VH * DSF + ':' + R.dev.x + ':' + R.dev.y + ':color=0x00000000';

  const out = {};
  /* vp9 with alpha. `-auto-alt-ref 0` is not optional: with alt refs on,
     libvpx encodes hidden frames the alpha plane has no partner for, and the
     transparency comes out of the muxer attached to the wrong pictures. */
  out.alpha = path.join(OUT, 'mascot-' + tag + '-alpha.webm');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', src,
    '-vf', 'format=rgba,' + pad + ',format=yuva420p',
    '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '26',
    '-auto-alt-ref', '0', '-row-mt', '1', '-r', String(FPS), '-an', out.alpha]);

  for (const [name, colour] of [['onblack', 'black'], ['onwhite', 'white']]) {
    out[name] = path.join(OUT, 'mascot-' + tag + '-' + name + '.mp4');
    ff(['-y', '-hide_banner', '-loglevel', 'error',
      '-f', 'lavfi', '-i', 'color=c=' + colour + ':s=' + VW * DSF + 'x' + VH * DSF + ':r=' + FPS,
      '-framerate', String(FPS), '-i', src,
      '-filter_complex', '[1:v]format=rgba,' + pad + '[m];[0:v][m]overlay=shortest=1,format=yuv420p',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
      '-r', String(FPS), '-frames:v', String(N), '-an', '-movflags', '+faststart', out[name]]);
  }
  return out;
}

function probe(file) {
  let out = '';
  try { execFileSync(ffmpeg, ['-hide_banner', '-i', file], { stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { out = (e.stderr || '').toString(); }
  const dur = out.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const res = out.match(/,\s*(\d{2,5})x(\d{2,5})[\s,]/);
  return {
    seconds: dur ? (+dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3])) : null,
    w: res ? +res[1] : null, h: res ? +res[2] : null,
  };
}

/* whether the alpha actually survived, proved rather than assumed. the file is
   composited over a colour nothing in the mascot uses and the corner is read
   back: if it is that colour the transparency is real, and if it is not the
   webm is a rectangle and would arrive in canva as one. a stream tagged
   yuva420p is not proof of this — the encoder reports the tag it was asked for
   whether or not the plane made it to the muxer. */
function alphaHolds(webm) {
  const probeFile = path.join(WORK, 'alpha-probe.png');
  fs.mkdirSync(WORK, { recursive: true });
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'color=c=0xff00ff:s=' + VW * DSF + 'x' + VH * DSF + ':r=1',
    '-c:v', 'libvpx-vp9', '-i', webm,
    '-filter_complex', '[0:v][1:v]overlay=shortest=1,format=rgb24',
    '-frames:v', '1', probeFile]);
  const raw = execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-i', probeFile,
    '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'], { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 3e8 });
  const at = (x, y) => { const i = (y * VW * DSF + x) * 3; return [raw[i], raw[i + 1], raw[i + 2]]; };
  const magenta = p => p[0] > 200 && p[1] < 60 && p[2] > 200;
  fs.rmSync(probeFile, { force: true });
  /* the top right corner, which no state ever reaches, and the very first
     pixel. both have to be the colour underneath. */
  return magenta(at(4, 4)) && magenta(at(VW * DSF - 6, 6));
}

/* ---------- go ---------- */
if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
console.log('the boring tek — mascot overlay export');

const states = WANT.length ? WANT : STATE_NAMES;
const themes = THEME_ARG ? [THEME_ARG] : THEMES;
for (const th of themes) if (!THEMES.includes(th)) throw new Error('no theme called "' + th + '"');

const variants = NO_BUBBLE ? [false] : [false, true];
const jobs = [];
for (const state of states) {
  /* the two states whose subject is the turn are exported straight only. a
     turned variant of one of them would be the same clip starting somewhere
     else, which is not a variant. */
  const turns = (NO_TURNED || STATES[state].authorsTurn) ? [false] : [false, true];
  for (const theme of themes) for (const b of variants) for (const tn of turns) {
    jobs.push([state, theme, b, tn]);
  }
}

console.log('  ' + jobs.length + ' clips, ' + SECONDS.toFixed(1) + 's each, ' + FPS + 'fps, '
  + (SUB > 1 ? SUB + ' subframes to a frame' : 'shutter closed') + ', three flavours apiece');
console.log('  out: ' + path.relative(ROOT, OUT));
console.log('');

const done = [];
const wall = Date.now();
for (const [state, theme, b, tn] of jobs) done.push(await render(state, theme, b, tn));

/* the cue sheet. there is no sound in the clips, so this is where the two the
   module would have emitted are written down. */
const cueSheet = {};
for (const state of states) {
  const p = planMascot({ seconds: SECONDS, theme: 'light', marks: [{ t: AT, state, bubble: BUBBLES[state] }] });
  cueSheet[state] = mascotCues(p);
}
fs.writeFileSync(path.join(OUT, 'cues.json'), JSON.stringify({
  note: 'the clips are silent. these are the seconds, from the start of each clip, '
    + 'where lib/mascot.mjs would put its two sounds if the mascot were in one of our own renders.',
  seconds: SECONDS, cues: cueSheet,
}, null, 2));

console.log('\nrendered ' + done.length * 3 + ' files in '
  + ((Date.now() - wall) / 1000 / 60).toFixed(1) + ' minutes');
const mb = f => (fs.statSync(f).size / 1e6).toFixed(2);
for (const d of done) {
  console.log('  ' + d.tag.padEnd(34)
    + 'webm ' + mb(d.files.alpha).padStart(5) + ' MB   '
    + 'black ' + mb(d.files.onblack).padStart(5) + ' MB   '
    + 'white ' + mb(d.files.onwhite).padStart(5) + ' MB');
}

if (!KEEP) fs.rmSync(WORK, { recursive: true, force: true });

/* ---------- the guards ---------- */
const fail = [];
const floor = Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom);
for (const d of done) {
  const tag = d.tag + ': ';
  for (const [flavour, file] of Object.entries(d.files)) {
    const p = probe(file);
    if (p.w !== VW * DSF || p.h !== VH * DSF) {
      fail.push(tag + flavour + ' is ' + p.w + 'x' + p.h + ', not ' + VW * DSF + 'x' + VH * DSF
        + ' — it would not drop onto a phone video without being moved');
    }
    if (Math.abs(p.seconds - SECONDS) > 0.2) {
      fail.push(tag + flavour + ' runs ' + p.seconds + 's, wanted ' + SECONDS);
    }
  }
  if (d.built.headPx < HEAD_PX.min || d.built.headPx > HEAD_PX.max) {
    fail.push(tag + 'the head rendered at ' + d.built.headPx + 'px, window is '
      + HEAD_PX.min + ' to ' + HEAD_PX.max);
  }
  if (d.caps && d.caps.capPx < BUBBLE.minCap) {
    fail.push(tag + 'the bubble caps rendered at ' + d.caps.capPx + 'px, floor is ' + BUBBLE.minCap);
  }
  /* the outline as it computed, not as it was written. a browser that rounded
     1.5 css px down to one device px would give an outline the encoder eats,
     and the whole point of the thought bubble is that it is an outline. */
  if (d.built.strokePx < 3.5) {
    fail.push(tag + 'the bubble outline rendered at ' + d.built.strokePx
      + 'px, wanted four — chrome floors border-width to a whole css pixel, so a '
      + 'fractional stroke silently halves');
  }
  /* and the cluster has to stay attached to him. the site sits it sixteen from
     the ink; this is meant to be about ten, and much past twenty it stops
     reading as his thought and starts reading as a caption that happens to be
     nearby. */
  if (d.built.bubbleGapPx > 20) {
    fail.push(tag + 'the bubble sits ' + d.built.bubbleGapPx + 'px off the head, wanted about ten');
  }
  if (d.headWorst.near < floor - 0.5) {
    fail.push(tag + 'the head comes within ' + Math.round(d.headWorst.near) + 'px of a border');
  }
  if (d.bubbleNear != null && d.bubbleNear < floor - 0.5) {
    fail.push(tag + 'the bubble comes within ' + Math.round(d.bubbleNear) + 'px of a border');
  }
  /* the region has to contain the picture. if the head's rect ever reached the
     edge of what was captured, the pad put a straight cut through the mascot. */
  const rr = d.headWorst;
  if (rr.left / DSF < d.R.x + 1 || rr.top / DSF < d.R.y + 1
    || (VW - rr.right / DSF) > d.R.x + d.R.w - 1 || (VH - rr.bottom / DSF) > d.R.y + d.R.h - 1) {
    fail.push(tag + 'the head touches the edge of the capture region, so the clip is cropped');
  }
  if (d.bubbleCss) {
    const b = d.bubbleCss;
    if (b.left < d.R.x + 1 || b.top < d.R.y + 1
      || b.right > d.R.x + d.R.w - 1 || b.bottom > d.R.y + d.R.h - 1) {
      fail.push(tag + 'the bubble touches the edge of the capture region, so a word is cut off');
    }
  }
}
/* alpha, on one clip per theme, because it is a property of the encode rather
   than of the state and checking twenty eight of them would only prove the
   encoder is deterministic. */
for (const theme of themes) {
  const d = done.find(x => x.theme === theme);
  if (d && !alphaHolds(d.files.alpha)) {
    fail.push(theme + ': the webm has no working alpha — it would land in canva as a rectangle');
  } else if (d) {
    console.log('  alpha holds on ' + d.tag);
  }
}
if (!KEEP) fs.rmSync(WORK, { recursive: true, force: true });

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
