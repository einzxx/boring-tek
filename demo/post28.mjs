/* the boring tek — post28. the dance.

   dark only, 1080x1920, silent. two clips of him dancing, made outside this
   folder, cut together with the house fault between them and the house
   end card after them. the clips are the picture; nothing is drawn over them.

     0.00  clip one, full length, filling the frame exactly. the camera pushes
           in five per cent over it.
     5.05  the fault: two stutters into it, the hit, and clip two is on the
           frame of the hit. the camera snaps out on that frame.
     5.05  clip two, full length, the same push.
    10.10  the fault again, and the wordmark stacked three lines is born on
           the hit's own frame; the camera snaps out onto it.
    11.05  end.

     node post28.mjs                     1080x1920, 60fps, the shutter solved
     DEMO_FPS=12 node post28.mjs         the fast preview pass
     node post28.mjs --blur=4            the shutter said outright
     node post28.mjs --keep-frames       leave the pngs and jpegs on disk
     node post28.mjs --encode-only       re-encode from kept frames
     node post28.mjs --clock             the clock and the camera, no browser
     node post28.mjs --html=<file>       the clock, then the page written out

   one output, one path, overwritten every run:

     demo/out/post28-dark-1080x1920.mp4

   ---------- the clips ----------

   `demo/music/kling-dance-1.mp4` and `kling-dance-2.mp4`, gitignored, 720x1280
   at 24fps, 121 frames each, a black background and a `KlingAI 3.0` mark in
   the bottom right corner. the mark's box was measured rather than eyeballed:
   the per pixel minimum over every frame of each clip, on the corner alone,
   which leaves only what never moves. it is the same box in both, on every
   frame, and nothing else ever enters that corner. `WATERMARK` below is that
   measurement, in the clip's own pixels.

   the clips are read once each by ffmpeg: scaled to fill 1080x1920 exactly
   (they are 9:16, so 1.5 on both axes), the mark covered with a filled
   rectangle, and written out as png frames. **the cover is pure black, as
   asked, and the clip's own floor is not:** the background sits at luma 7,
   which is index.html's own dark `--bg`, so the rectangle is seven levels
   under what surrounds it. `COVER` is the colour and it is one line.

   **24 into 60 is a three, two, three, two cadence.** every source frame is
   drawn on two or three output frames, in order, none skipped and none
   blended, which is what "full length" means at 60fps without inventing
   frames. the source frame is chosen by the output frame's index rather than
   by the subframe's time, so an open shutter blurs the camera and never the
   picture: the clips carry their own blur.

   ---------- the camera ----------

   `lib/camera.mjs`, free mode, and the plan is a push, a reset and a snap,
   twice.

   the push is a glide from 1.0 to 1.05 over each clip's length. the snap is
   the module's own, with post16's negative anticipation: a push in of 3.5 per
   cent over the last 0.18s of the clip as the wind-up, then the pop out over
   0.22s starting on the hit's own frame. the reset is a leg a tenth of a
   millisecond long ending on the hit, taking the leg zoom from 1.05 back to
   1.0 between the last frame of one clip and the first of the next, because
   a camera cut on a picture cut is a cut and not a move. it is that short so
   that no subframe can land inside it: a one frame leg is still a tween, and
   an open shutter would smear the clip's last frame with it.

   **`by` is derived, not chosen.** the picture is exactly the stage's size, so
   any zoom under 1.0 brings its edge into shot, and `btk.pop` overshoots its
   mark. the overshoot is read off the curve at 240Hz and `by` is solved so
   the pop bottoms at exactly 1.0. the resting zoom after a snap is a third of
   a per cent over 1, which is the price of the overshoot never showing an
   edge, and the guard walks it at 60 and at 240.

   the drift is off. a drift's z channel dips under 1.0 and its y channel
   moves the picture off the frame; and no frame here is a still frame,
   because the picture is a film.

   ---------- the fault and the end ----------

   post23's ending as post27 carries it: two stutters into the hit, the hit
   with its bands, noise and flash, calm by 86 per cent of its window. here
   it happens twice. on the first hit the bands tear the picture, drawn into
   the canvas as displaced strips; on the second the picture is cut and the
   bands carry the wordmark, which is post27's markup exactly. the split
   reaches the wordmark and nothing else. the wordmark has no scale pop of
   its own here: the camera's snap out is its birth.

   the glitch's shake is written against the frame index and the camera
   against time, which is the split lib/camera.mjs's header argues for. the
   shake moves the picture by up to fifteen css px on a hit frame and the
   page behind it is the same black the clip is on.

   ---------- what is not here ----------

   no sound at all: no voice, no music, no effects, no audio stream in the
   file. the music is added later, outside. `lib/sfx.mjs` is not imported.
   `lib/mascot.mjs` draws nothing here: it is read for the stage and the safe
   area, which are the house's numbers, and for nothing else. */

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { STAGE, SAFE } from './lib/mascot.mjs';
import { brandTokens } from './lib/captions.mjs';
import {
  planCamera, cameraFrame, cameraMotion, minZoomFor, describeCamera,
  cameraCss, cameraMarkup, cameraRuntime,
} from './lib/camera.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const SRC = path.join(OUT, 'frames-post28-src');
const FRAMES = path.join(OUT, 'frames-post28');
const SUBS = path.join(OUT, 'subframes-post28');
const VERIFY = path.join(OUT, 'verify-post28');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = STAGE.dsf;
const VW = STAGE.w, VH = STAGE.h;
const SAFE_CSS = {
  top: SAFE.top / DSF, bottom: SAFE.bottom / DSF,
  left: SAFE.left / DSF, right: SAFE.right / DSF,
};

const argv = process.argv.slice(2);
const ONLY_ENCODE = argv.includes('--encode-only');
const CLOCK_ONLY = argv.includes('--clock');
const KEEP = argv.includes('--keep-frames');
/* ---------- the shutter, and it is solved ----------
   post26's rule, taken all the way: how many samples a frame is averaged
   over is a property of the cut. the quickest thing this file moves is the
   picture's corner under the camera, walked at sixty below, and the shutter
   is however many samples put that under `SUB_STEP_WANT` css px, post20's
   landing. one is a real answer and it is the closed shutter. `--blur=N`
   says it outright. */
const BLUR_ARG = Number((argv.find(a => a.startsWith('--blur=')) || '').split('=')[1]) || 0;
const SUB_STEP_WANT = 6.3;
const SUB_MAX = 12;
let SUB = 1;
let SUBSTEP = STEP;

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- the clips ---------- */
const CLIPS = [
  { name: 'one', file: path.join(HERE, 'music', 'kling-dance-1.mp4') },
  { name: 'two', file: path.join(HERE, 'music', 'kling-dance-2.mp4') },
];
/* the mark's box, measured: the per pixel minimum over every frame, corner
   only, pixels over luma 12 (the floor is 7). inclusive, in the clip's own
   720x1280 pixels, and identical in both clips. */
const WATERMARK = { x0: 566, y0: 1233, x1: 691, y1: 1258 };
const COVER = 'black';       /* the brief's word. the floor is #06070a, see the header */
const COVER_PAD = 4;         /* device px around the box, for the scaler's own bleed */

/* ---------- the end card, post27's ---------- */
const CENTRE_Y = (SAFE_CSS.top + (VH - SAFE_CSS.bottom)) / 2;
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16, minCapPx: 56 };
const CARD = 0.95;
const FAULT = { hard: 0.12, tail: 0.18, pre: [{ before: 0.38, for: 0.05, force: 0.34 }, { before: 0.18, for: 0.05, force: 0.60 }] };
const GL = {
  shakeX: 15, shakeY: 8, split: 9.5, bandDx: 88, bands: 3,
  noise: [0.10, 0.24], flash: 0.30, flashSize: 420, calmFrom: 0.86,
};

/* ---------- the camera's numbers ---------- */
const PUSH = 1.05;
const ANT = { by: 0.035, for: 0.18 };   /* the wind-up: a push in, post16's */
const SNAP_FOR = 0.22;
const RESET = 0.0001;                   /* the reset's length: a jump, see the header */

const CRF = 17;
const STEP_CEIL = 42;

/* ---------- the small maths ---------- */
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))));
const lerp = (a, b, p) => a + (b - a) * p;
const n4 = v => +v.toFixed(4);
function prng(seed) {
  let x = seed | 0 || 0x1a2b3c;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x |= 0; return (x >>> 0) / 4294967296; };
}
function onGrid(t, len, fps) {
  const f0 = Math.round(t * fps);
  const n = Math.max(1, Math.round(len * fps));
  return { t0: f0 / fps, t1: (f0 + n) / fps, frames: n };
}
function phosphor(t, amp, slow, fast, phase) {
  return 1 + amp * 0.78 * Math.sin(2 * Math.PI * t / slow)
    + amp * 0.39 * Math.sin(2 * Math.PI * t / fast + phase);
}

/* ---------- ffmpeg, twice ----------
   `ff` for a command that must succeed; `ffErr` for the stderr of one that
   reports on it, because ffmpeg-static ships no ffprobe and everything about
   a file is read off ffmpeg's own stderr. */
function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }
function ffErr(args) { const r = spawnSync(ffmpeg, args, { encoding: 'utf8', maxBuffer: 1 << 26 }); return (r.stderr || '') + (r.stdout || ''); }
function probe(file) {
  const out = ffErr(['-hide_banner', '-i', file]);
  const dur = out.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const res = out.match(/,\s*(\d{2,5})x(\d{2,5})[\s,]/);
  const fps = out.match(/([\d.]+)\s*fps/);
  return {
    seconds: dur ? (+dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3])) : null,
    w: res ? +res[1] : null, h: res ? +res[2] : null,
    fps: fps ? parseFloat(fps[1]) : null, audio: /Audio:/.test(out),
  };
}
function countFrames(file) {
  const out = ffErr(['-hide_banner', '-i', file, '-map', '0:v', '-f', 'null', '-']);
  const m = out.match(/frame=\s*(\d+)/g);
  if (!m) throw new Error('could not count the frames of ' + file);
  return +m[m.length - 1].replace(/\D/g, '');
}

/* ---------- the clock ----------
   the clips are measured before anything is planned: their length in frames
   is the clock. at sixty a 24fps frame lasts two and a half output frames,
   so a clip's length on the output grid is the ceiling of that, and the hit
   is the first frame after it. */
for (const c of CLIPS) {
  if (!fs.existsSync(c.file)) throw new Error(c.file + ' is not on disk (it is gitignored, and it has to be put there)');
  const p = probe(c.file);
  c.w = p.w; c.h = p.h; c.fps = p.fps; c.seconds = p.seconds;
  c.frames = countFrames(c.file);
  if (Math.abs(c.w / c.h - VW / VH) > 1e-3) throw new Error(c.name + ' is ' + c.w + 'x' + c.h + ', not 9:16');
}
const SRC_FPS = CLIPS[0].fps;
if (CLIPS.some(c => c.fps !== SRC_FPS)) throw new Error('the two clips run at different rates');
/* output frames per clip, at sixty and at the working rate */
for (const c of CLIPS) c.out60 = Math.ceil(c.frames * 60 / SRC_FPS);
const H1 = +(CLIPS[0].out60 / 60).toFixed(4);
const H2 = +((CLIPS[0].out60 + CLIPS[1].out60) / 60).toFixed(4);
const HITS = [H1, H2];
const SECONDS = +(H2 + CARD).toFixed(2);
const FRAME = { hit1: Math.round(H1 * FPS), hit2: Math.round(H2 * FPS) };
CLIPS[0].start = 0; CLIPS[1].start = FRAME.hit1;
CLIPS[0].outFrames = FRAME.hit1; CLIPS[1].outFrames = FRAME.hit2 - FRAME.hit1;

/* which clip and which of its frames an output frame shows. by index, never
   by subframe time: see the header. */
function picAt(f) {
  if (f >= FRAME.hit2) return null;
  const c = f < FRAME.hit1 ? 0 : 1;
  const clip = CLIPS[c];
  const src = Math.min(clip.frames - 1, Math.floor((f - clip.start) * SRC_FPS / FPS));
  return { clip: c, src };
}

/* ---------- the camera ---------- */
const SHOT = { cx: VW / 2, cy: VH / 2 };
function planFor(by) {
  const legs = [], snaps = [];
  let from = 0;
  for (let i = 0; i < 2; i++) {
    const hit = HITS[i];
    const resetAt = +(hit - RESET).toFixed(4);
    legs.push({ at: from, for: +(resetAt - from).toFixed(4), to: { ...SHOT, z: PUSH }, ease: 'glide',
      why: 'the push over clip ' + CLIPS[i].name });
    legs.push({ at: resetAt, for: +(hit - resetAt).toFixed(4), to: { ...SHOT, z: 1 }, ease: 'glide',
      why: 'the reset, a jump between two frames, on the cut' });
    snaps.push({ at: +(hit - ANT.for).toFixed(4), by, anticipate: -ANT.by, anticipateFor: ANT.for, for: SNAP_FOR, back: false,
      why: 'the snap out on hit ' + (i + 1) + ', and the wind-up is a push in' });
    from = hit;
  }
  return planCamera({
    mode: 'free', stage: { w: VW, h: VH, dsf: DSF }, seconds: SECONDS,
    zoom: { min: 1, max: 1.5 }, drift: false,
    start: { ...SHOT, z: 1 }, legs, snaps,
  });
}
/* the pop's overshoot, read off the curve rather than typed: with `by` at 1
   the snap goes from 1 + ANT.by to 1 and dips OVER times ANT.by under. */
const OVER = (() => {
  const trial = planFor(1);
  let m = Infinity;
  for (let f = Math.floor(H1 * 240); f <= Math.ceil((H1 + SNAP_FOR + 0.10) * 240); f++) m = Math.min(m, cameraFrame(trial, f / 240).snap);
  return +((1 - m) / ANT.by).toFixed(5);
})();
/* solved so the pop bottoms at exactly 1.0: min = by - OVER * (A - by) = 1 */
const A = 1 + ANT.by;
const BY = +((1 + OVER * A) / (1 + OVER)).toFixed(6);
const cam = planFor(BY);

/* ---------- the glitch, post23's, twice ---------- */
function heatAt(p) {
  if (p < 0) return 0;
  if (p < 0.13) return 1;
  if (p < 0.58) return 1 - (p - 0.13) / 0.45 * 0.58;
  if (p < GL.calmFrom) return 0.42 * (1 - (p - 0.58) / (GL.calmFrom - 0.58));
  return 0;
}
function glitchWindows(fps) {
  const out = [];
  HITS.forEach((hit, h) => {
    FAULT.pre.forEach((w, i) => out.push({ ...onGrid(hit - w.before, w.for, fps), kind: 'stutter', force: w.force, seed: 0x51a0 + h * 4001 + i * 977 }));
    out.push({ ...onGrid(hit, FAULT.hard + FAULT.tail, fps), kind: 'hit', hitF: Math.round(hit * fps), seed: 0x0c1a55 + h * 7919 });
  });
  return out.sort((a, b) => a.t0 - b.t0);
}
const GL_WINDOWS = glitchWindows(FPS);
const GL_WINDOWS_60 = FPS === 60 ? GL_WINDOWS : glitchWindows(60);
function glitchAt(f, fps = FPS, windows = GL_WINDOWS) {
  const g = { sx: 0, sy: 0, split: 0, noise: 0, flash: 0, bands: [], heat: 0 };
  const t = f / fps;
  const w = windows.find(x => t >= x.t0 && t < x.t1);
  if (!w) return g;
  const p = (t - w.t0) / (w.t1 - w.t0);
  const r = prng(w.seed ^ (f * 2654435761));
  let heat = w.kind === 'stutter' ? w.force : heatAt(p);
  if (w.kind !== 'stutter' && heat > 0 && p > 0.13 && p < GL.calmFrom && r() < 0.34) heat = 1;
  if (heat <= 0) return g;
  g.heat = heat;
  g.sx = +((r() * 2 - 1) * GL.shakeX * heat).toFixed(2);
  g.sy = +((r() * 2 - 1) * GL.shakeY * heat).toFixed(2);
  g.split = +(heat * (2.2 + r() * (GL.split - 2.2))).toFixed(2);
  g.noise = +(heat * lerp(GL.noise[0], GL.noise[1], r())).toFixed(4);
  g.flash = (w.kind === 'hit' && f === w.hitF) ? GL.flash : 0;
  const n = w.kind === 'hit' ? Math.min(GL.bands, Math.floor(heat * (GL.bands + 0.5))) : 0;
  for (let i = 0; i < n; i++) {
    const h = 18 + r() * 96;
    g.bands.push({
      top: +(r() * (VH - h)).toFixed(1), h: +h.toFixed(1),
      dx: +((r() * 2 - 1) * GL.bandDx * heat).toFixed(1),
    });
  }
  return g;
}

/* ---------- what one frame is ----------
   `t` is the instant, for the camera; `f` the output frame, for the picture
   and the glitch. the cut, the hit and the wordmark's birth are on the frame. */
function frameAt(t, f) {
  const g = glitchAt(f);
  const pic = picAt(f);
  const cut = f >= FRAME.hit2;
  return {
    t: +t.toFixed(4), f,
    pic: pic ? { clip: pic.clip, src: pic.src, bands: g.bands } : null,
    sx: g.sx, sy: g.sy,
    cam: cameraFrame(cam, t),
    wm: { o: cut ? 1 : 0, glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4) },
    tears: cut ? g.bands : [],
    g,
  };
}

/* ---------- the page ---------- */
function sceneHtml() {
  const brand = brandTokens();
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post28</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&display=swap">
<style>
:root{
${brand.light}
}
html[data-theme=dark]{
${brand.dark}
}
/* ==== this clip's own css starts here ==== */
:root{
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  --display:"Michroma",var(--mono);
  --split-r:rgba(255,120,120,.55); --split-c:rgba(120,220,255,.55);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg)}
/* the glitch's shake is on the stage, the camera is inside it. the page
   behind is the same black the clips are on, so a knock exposes nothing. */
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;background:var(--bg);
  transform:translate3d(calc(var(--sx,0) * 1px),calc(var(--sy,0) * 1px),0);
  will-change:transform}
${cameraCss()}
/* the picture: one canvas at device size, exactly the stage, inside the rig */
#pic{position:absolute;left:0;top:0;width:${VW}px;height:${VH}px;display:block;
  background:var(--bg);opacity:var(--pic-o,1)}

/* ---- the wordmark, post27's, less its own pop ---- */
.wm{position:absolute;left:50%;top:${CENTRE_Y}px;
  transform:translate(-50%,-50%);
  font-family:var(--display);font-weight:400;color:var(--fg);
  text-align:center;text-transform:uppercase;letter-spacing:.18em;
  line-height:${WM.lh};white-space:nowrap;text-indent:.09em;
  opacity:var(--wm-o,0);
  text-shadow:0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),
    0 0 66px rgba(255,255,255,.10);
  filter:brightness(var(--wm-glow,1));z-index:8}
.wm span{display:block}
.stage[data-gl="1"] .wm{
  text-shadow:0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),
    0 0 66px rgba(255,255,255,.10),
    calc(var(--split,0) * -1px) 0 var(--split-r),calc(var(--split,0) * 1px) 0 var(--split-c)}
.tear{position:absolute;inset:0;z-index:9;overflow:hidden;background:var(--bg);
  clip-path:inset(var(--tt,0px) 0 calc(100% - var(--tt,0px) - var(--th,0px)) 0);
  opacity:var(--to,0)}
.tear-in{position:absolute;inset:0;transform:translate3d(calc(var(--tdx,0) * 1px),0,0)}
.noise{position:absolute;inset:-40px;z-index:10;pointer-events:none;
  mix-blend-mode:screen;opacity:var(--noise,0);
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.0' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23m)'/%3E%3C/svg%3E")}
.flash{position:absolute;left:50%;top:${CENTRE_Y}px;z-index:11;pointer-events:none;
  width:${GL.flashSize}px;height:${GL.flashSize}px;margin:${-GL.flashSize / 2}px 0 0 ${-GL.flashSize / 2}px;
  background:radial-gradient(circle,
    rgba(255,255,255,1) 0%, rgba(255,255,255,.62) 34%,
    rgba(255,255,255,.18) 60%, rgba(255,255,255,0) 78%);
  opacity:var(--flash,0)}
</style>
</head>
<body>
<div class="stage" id="stage">
${cameraMarkup(`
  <canvas id="pic" width="${VW * DSF}" height="${VH * DSF}"></canvas>
  <div class="wm" id="wm">${WM.lines.map(l => '<span>' + l + '</span>').join('')}</div>
${Array.from({ length: GL.bands }, (_, i) => '  <div class="tear" data-tear="' + i
    + '"><div class="tear-in"><div class="wm">'
    + WM.lines.map(l => '<span>' + l + '</span>').join('') + '</div></div></div>').join('\n')}`)}
  <div class="noise" aria-hidden="true"></div>
  <div class="flash" aria-hidden="true"></div>
</div>
<script>
window.__P28 = ${JSON.stringify({
    VW, VH, DSF, WM, BG: (brand.dark.match(/--bg:\s*(#[0-9a-fA-F]{6})/) || [])[1] || '#000',
    clips: CLIPS.map(c => ({ name: c.name, frames: c.frames })),
  })};
${cameraRuntime()}
(${scenePage.toString()})();
Promise.all([document.fonts.load('400 40px Michroma'), window.__p28.preload()])
  .then(function () { return document.fonts.ready; })
  .then(function () { window.__built = window.__p28.fit(); });
</script>
</body>
</html>`;
}

/* ---------- the page's own script ----------
   writes numbers to elements and decides nothing. serialised in with
   .toString(), so it closes over nothing: everything arrives on window.__P28. */
function scenePage() {
  const P = window.__P28;
  const stage = document.getElementById('stage');
  const pic = document.getElementById('pic');
  const ctx = pic.getContext('2d', { alpha: false });
  const wms = [...document.querySelectorAll('.wm')];
  const tears = [...document.querySelectorAll('.tear')];
  const tearIns = tears.map(t => t.querySelector('.tear-in'));
  const imgs = P.clips.map(() => []);
  let lastPic = null;

  const capOf = el => {
    const cs = getComputedStyle(el);
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    const m = cv.measureText('H');
    return { cap: m.actualBoundingBoxAscent || 0, font: cv.font };
  };

  window.__p28 = {
    /* every source frame of both clips, fetched once and held. drawImage
       off a loaded image is synchronous, which is what lets a frame be
       painted and captured with no event loop between the two. */
    preload() {
      const all = [];
      P.clips.forEach((c, k) => {
        for (let i = 0; i < c.frames; i++) {
          const im = new Image();
          all.push(new Promise((res, rej) => {
            im.onload = () => res();
            im.onerror = () => rej(new Error('frame ' + i + ' of clip ' + c.name + ' did not load'));
          }));
          im.src = '/src/' + c.name + '/f' + String(i).padStart(5, '0') + '.png';
          imgs[k].push(im);
        }
      });
      return Promise.all(all).then(() => all.length);
    },
    fit() {
      const probe = wms[0];
      probe.style.fontSize = '100px';
      let widest = 0;
      for (const sp of probe.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      const ws = 100 * P.WM.w / widest;
      for (const el of wms) el.style.fontSize = ws.toFixed(2) + 'px';
      return { wm: +ws.toFixed(2), frames: imgs.reduce((a, b) => a + b.length, 0),
        loaded: imgs.reduce((a, b) => a + b.filter(i => i.complete && i.naturalWidth === P.VW * P.DSF).length, 0) };
    },
    /* the wordmark as it lands on the screen, which is the element times the
       camera, per side against the frame in device px */
    measureWm() {
      const el = wms[0], r = el.getBoundingClientRect(), d = P.DSF;
      const rig = document.getElementById('cam-rig');
      const z = new DOMMatrixReadOnly(getComputedStyle(rig).transform).a || 1;
      let widest = 0;
      for (const sp of el.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      const c = capOf(el);
      return {
        sizeCss: +parseFloat(getComputedStyle(el).fontSize).toFixed(2), z: +z.toFixed(5),
        widestPx: +(widest * d).toFixed(1), capPx: +(c.cap * z * d).toFixed(1), font: c.font,
        left: +(r.left * d).toFixed(1), top: +(r.top * d).toFixed(1),
        right: +((P.VW - r.right) * d).toFixed(1), bottom: +((P.VH - r.bottom) * d).toFixed(1),
      };
    },
    /* the picture's box on the screen, off the canvas element through the camera */
    measurePic() {
      const r = pic.getBoundingClientRect(), d = P.DSF;
      return { left: +(r.left * d).toFixed(2), top: +(r.top * d).toFixed(2),
        right: +((P.VW - r.right) * d).toFixed(2), bottom: +((P.VH - r.bottom) * d).toFixed(2),
        w: +(r.width * d).toFixed(2), h: +(r.height * d).toFixed(2) };
    },
    apply(o) {
      const s = stage.style;
      s.setProperty('--sx', o.sx.toFixed(2));
      s.setProperty('--sy', o.sy.toFixed(2));
      s.setProperty('--split', o.g.split.toFixed(2));
      s.setProperty('--noise', o.g.noise.toFixed(4));
      s.setProperty('--flash', o.g.flash.toFixed(4));
      s.setProperty('--wm-o', o.wm.o.toFixed(4));
      s.setProperty('--wm-glow', o.wm.glow.toFixed(4));
      s.setProperty('--pic-o', o.pic ? '1' : '0');
      if (o.g.split > 0.01) stage.setAttribute('data-gl', '1');
      else stage.removeAttribute('data-gl');

      /* the picture, redrawn only when its frame or its bands change: the
         camera moves the canvas, it does not repaint it. */
      if (o.pic) {
        const key = o.pic.clip + ':' + o.pic.src + ':' + JSON.stringify(o.pic.bands);
        if (key !== lastPic) {
          lastPic = key;
          const im = imgs[o.pic.clip][o.pic.src];
          const d = P.DSF;
          ctx.drawImage(im, 0, 0, P.VW * d, P.VH * d);
          for (const b of o.pic.bands) {
            const y = Math.round(b.top * d), h = Math.round(b.h * d), dx = Math.round(b.dx * d);
            ctx.fillStyle = P.BG;
            ctx.fillRect(0, y, P.VW * d, h);
            ctx.drawImage(im, 0, y, P.VW * d, h, dx, y, P.VW * d, h);
          }
        }
      }

      for (let i = 0; i < tears.length; i++) {
        const band = o.tears[i], st = tears[i].style;
        if (!band) { st.setProperty('--to', '0'); st.setProperty('--th', '0px'); continue; }
        st.setProperty('--to', '1');
        st.setProperty('--tt', band.top.toFixed(1) + 'px');
        st.setProperty('--th', band.h.toFixed(1) + 'px');
        tearIns[i].style.setProperty('--tdx', band.dx.toFixed(1));
      }
    },
  };
}

function serve(html) {
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/' || p === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }
    const m = /^\/src\/(one|two)\/(f\d{5}\.png)$/.exec(p);
    if (m) {
      const file = path.join(SRC, m[1], m[2]);
      if (fs.existsSync(file)) {
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' });
        return fs.createReadStream(file).pipe(res);
      }
    }
    res.writeHead(404); res.end('not here');
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ srv, port: srv.address().port })));
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

/* ---------- the clips, read once ----------
   scale to the frame, cover the mark, write pngs. the box is the measured
   one scaled by the same factor the picture is, padded by COVER_PAD device
   px for the scaler's bleed, and the check reads it back off the frames. */
function extractClips() {
  fs.rmSync(SRC, { recursive: true, force: true });
  const k = (VW * DSF) / CLIPS[0].w;
  const box = {
    x: Math.floor(WATERMARK.x0 * k) - COVER_PAD, y: Math.floor(WATERMARK.y0 * k) - COVER_PAD,
    w: Math.ceil((WATERMARK.x1 + 1) * k) - Math.floor(WATERMARK.x0 * k) + 2 * COVER_PAD,
    h: Math.ceil((WATERMARK.y1 + 1) * k) - Math.floor(WATERMARK.y0 * k) + 2 * COVER_PAD,
  };
  const inner = {
    x: Math.floor(WATERMARK.x0 * k), y: Math.floor(WATERMARK.y0 * k),
    w: Math.ceil((WATERMARK.x1 + 1) * k) - Math.floor(WATERMARK.x0 * k),
    h: Math.ceil((WATERMARK.y1 + 1) * k) - Math.floor(WATERMARK.y0 * k),
  };
  const report = { scale: k, box, inner, clips: [] };
  for (const c of CLIPS) {
    const dir = path.join(SRC, c.name);
    fs.mkdirSync(dir, { recursive: true });
    const wall = Date.now();
    ff(['-y', '-hide_banner', '-loglevel', 'error', '-i', c.file, '-map', '0:v',
      '-vf', 'scale=' + VW * DSF + ':' + VH * DSF + ':flags=lanczos,drawbox=x=' + box.x + ':y=' + box.y + ':w=' + box.w + ':h=' + box.h + ':color=' + COVER + ':t=fill',
      '-fps_mode', 'passthrough', '-start_number', '0', path.join(dir, 'f%05d.png')]);
    const n = fs.readdirSync(dir).filter(f => /^f\d{5}\.png$/.test(f)).length;
    console.log('  ' + c.name + ': ' + c.frames + ' frames of ' + c.w + 'x' + c.h + ' at ' + c.fps + 'fps read, ' + n
      + ' pngs of ' + VW * DSF + 'x' + VH * DSF + ' written in ' + ((Date.now() - wall) / 1000).toFixed(0) + 's');
    if (n !== c.frames) throw new Error(c.name + ' wrote ' + n + ' frames and has ' + c.frames);
    report.clips.push({ name: c.name, written: n });
  }
  return report;
}

/* the cover, checked on the frames the picture is drawn from: the luma of
   every pixel inside the measured box on the first, the middle and the last
   frame of each clip, and the floor in a ring around it, so the seven levels
   between the cover and the clip's own black are a number and not a guess.
   the corner is also written out as a png, before and after, for the eye. */
function checkCover(inner) {
  fs.mkdirSync(VERIFY, { recursive: true });
  const FW = VW * DSF, FH = VH * DSF;
  /* a window around the box, held inside the frame: ffmpeg's crop clamps an
     offset that runs past the edge without saying so, and the box sits 31
     device px off the bottom, so the window is clamped here and everything
     is read relative to where it actually is. */
  const around = (pad) => {
    const x0 = Math.max(0, inner.x - pad), y0 = Math.max(0, inner.y - pad);
    const x1 = Math.min(FW, inner.x + inner.w + pad), y1 = Math.min(FH, inner.y + inner.h + pad);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  };
  const gray = (input, extra, crop) => {
    const r = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', ...extra, '-i', input, '-frames:v', '1',
      '-vf', 'crop=' + crop.w + ':' + crop.h + ':' + crop.x + ':' + crop.y + ':exact=1', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { maxBuffer: 1 << 26 });
    return r.stdout;
  };
  const ring = around(40);
  const bx = inner.x - ring.x, by = inner.y - ring.y;
  const out = [];
  for (const c of CLIPS) {
    const picks = [0, Math.floor(c.frames / 2), c.frames - 1];
    let boxMax = 0, floorSum = 0, floorN = 0, floorMax = 0;
    for (const i of picks) {
      const file = path.join(SRC, c.name, 'f' + String(i).padStart(5, '0') + '.png');
      const buf = gray(file, [], ring);
      if (!buf || buf.length !== ring.w * ring.h) throw new Error('could not read the corner of ' + file);
      for (let y = 0; y < ring.h; y++) for (let x = 0; x < ring.w; x++) {
        const v = buf[y * ring.w + x];
        const inBox = x >= bx && x < bx + inner.w && y >= by && y < by + inner.h;
        const inPad = x >= bx - COVER_PAD - 2 && x < bx + inner.w + COVER_PAD + 2 && y >= by - COVER_PAD - 2 && y < by + inner.h + COVER_PAD + 2;
        if (inBox) boxMax = Math.max(boxMax, v);
        else if (!inPad) { floorSum += v; floorN++; floorMax = Math.max(floorMax, v); }
      }
    }
    const corner = around(100);
    ff(['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(picks[1] / c.fps), '-i', c.file, '-frames:v', '1',
      '-vf', 'scale=' + FW + ':' + FH + ':flags=lanczos,crop=' + corner.w + ':' + corner.h + ':' + corner.x + ':' + corner.y + ':exact=1',
      path.join(VERIFY, 'cover-' + c.name + '-before.png')]);
    ff(['-y', '-hide_banner', '-loglevel', 'error', '-i', path.join(SRC, c.name, 'f' + String(picks[1]).padStart(5, '0') + '.png'), '-frames:v', '1',
      '-vf', 'crop=' + corner.w + ':' + corner.h + ':' + corner.x + ':' + corner.y + ':exact=1',
      path.join(VERIFY, 'cover-' + c.name + '-after.png')]);
    const r = { name: c.name, frames: picks, boxMax, floorMean: +(floorSum / floorN).toFixed(2), floorMax, ring, corner };
    out.push(r);
    console.log('  the cover on ' + c.name + ': box luma max ' + boxMax + ' over frames ' + picks.join(', ')
      + '; the floor around it averages ' + r.floorMean + ' (max ' + floorMax + ')');
  }
  return out;
}

/* ---------- render ---------- */
async function render() {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  for (const d of [FRAMES, SUBS]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  fs.mkdirSync(OUT, { recursive: true });

  console.log('\n  the clips');
  const extract = extractClips();
  const cover = checkCover(extract.inner);

  const N = Math.round(FPS * SECONDS);
  const { srv, port } = await serve(sceneHtml());
  /* `--run-all-compositor-stages-before-draw` is new to this folder and it
     is not optional here. a page that paints a bitmap, canvas or img, hands
     the compositor a decode to finish after the first frame, and under a
     paused virtual clock the frame that would carry the finished decode is
     never driven: `Page.captureScreenshot` then waits on it for ever. it
     was measured rather than argued: the same page captured one to ninety
     frames and then hung, on the gpu, on swiftshader, with a canvas and with
     an img, and with the flag it captured every frame of both clips twice
     over. the flag makes each forced frame run every compositor stage to
     the end before it draws, which is what a frame by frame render wants
     anyway. the other clips never needed it because none of them paint a
     bitmap. */
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none',
      '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio',
      '--run-all-compositor-stages-before-draw'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });
  await page.evaluateOnNewDocument(injected);
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }, { name: 'prefers-color-scheme', value: 'dark' }],
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
  for (let i = 0; i < 600; i++) {
    const ok = await page.evaluate(() => !!(window.__built && window.__cam && window.__cam.ready
      && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  const built = await page.evaluate(() => window.__built);
  if (!built) throw new Error('the scene never became ready');
  if (!await page.evaluate(() => document.fonts.check('400 40px "Michroma"'))) throw new Error('Michroma did not load, and the wordmark would be judged in the fallback');
  const total = CLIPS.reduce((a, c) => a + c.frames, 0);
  if (built.loaded !== total) throw new Error('the page holds ' + built.loaded + ' decoded source frames of ' + total);
  console.log('  built: ' + built.loaded + ' source frames in the page, the wordmark at ' + built.wm + 'css px');

  const put = async (t, f) => {
    const o = frameAt(t, f);
    await page.evaluate(fr => window.__cam.apply(fr.cam), o);
    await page.evaluate(fr => window.__p28.apply(fr), o);
    return o;
  };

  /* the wordmark through the camera: on the hit's frame, where the card is
     largest, and on the last frame, where it rests */
  await put(FRAME.hit2 / FPS, FRAME.hit2);
  const wmHit = await page.evaluate(() => window.__p28.measureWm());
  await put((N - 1) / FPS, N - 1);
  const wmRest = await page.evaluate(() => window.__p28.measureWm());
  console.log('  the wordmark on the hit: z ' + wmHit.z + ', clear ' + wmHit.left + ' left / ' + wmHit.top + ' top / ' + wmHit.right + ' right / ' + wmHit.bottom + ' bottom');
  console.log('  the wordmark at rest: z ' + wmRest.z + ', ' + wmRest.sizeCss + 'css px, widest line ' + wmRest.widestPx
    + ' device px, caps ' + wmRest.capPx + ', ' + wmRest.font);

  /* the picture's edges on the frame the zoom is lowest, off the rendered rect */
  const lowest = (() => { let m = null; for (let f = 0; f < FRAME.hit2; f++) { const z = cameraFrame(cam, f / FPS).z; if (!m || z < m.z) m = { f, z }; } return m; })();
  await put(lowest.f / FPS, lowest.f);
  const edges = await page.evaluate((vw, vh, d) => window.__cam.edges(vw, vh, d), VW, VH, DSF);
  const picBox = await page.evaluate(() => window.__p28.measurePic());
  console.log('  the picture at its lowest zoom, ' + lowest.z.toFixed(5) + ' at frame ' + lowest.f + ': the rig sits ' + edges.left + ' / ' + edges.top + ' / ' + edges.right + ' / ' + edges.bottom + ' device px outside the frame; the canvas is ' + picBox.w + 'x' + picBox.h);

  const sigs = [];
  const wall = Date.now();
  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const o = await put(t, f);
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);
      /* the frame's signature is the sum over its subframes: with the
         shutter open a frame is their average, and two frames whose first
         samples agree can still differ on their second. the glow at a peak
         of its own curve is where that happens. */
      {
        let s = o.sx * 29 + o.sy * 31 + o.cam.z * 1e4 + o.cam.tx * 37 + o.cam.ty * 41
          + o.wm.o * 61 + o.wm.glow * 71
          + o.g.split * 73 + o.g.noise * 79 + o.g.flash * 83 + o.g.bands.length * 89;
        if (o.pic) s += 1000 + o.pic.clip * 500 + o.pic.src * 3;
        if (k === 0) sigs.push(0);
        sigs[f] = +(sigs[f] + s * (k + 1)).toFixed(6);
      }
      const shot = await cdp.send('Page.captureScreenshot', {
        format: 'jpeg', quality: 94, captureBeyondViewport: false,
        clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
      });
      const file = SUB > 1
        ? path.join(SUBS, 's' + String(idx).padStart(6, '0') + '.jpg')
        : path.join(FRAMES, 'f' + String(f).padStart(5, '0') + '.jpg');
      fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
      await advance(SUBSTEP);
    }
    if (f % 60 === 0) {
      console.log('  ' + String(f).padStart(4) + '/' + N + '  t=' + (f / FPS).toFixed(2) + 's  '
        + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
    }
  }

  const stills = [
    [0.02, 'a-the-first-frame'],
    [H1 * 0.5, 'b-clip-one-halfway'],
    [H1 - 0.02, 'c-clip-one-wound-up'],
    [H1, 'd-the-first-hit'],
    [H1 + 0.08, 'e-the-first-hit-torn'],
    [H1 + SNAP_FOR + 0.10, 'f-clip-two-landed'],
    [H1 + (H2 - H1) * 0.5, 'g-clip-two-halfway'],
    [H2 - 0.18, 'h-the-second-stutter'],
    [H2, 'i-the-second-hit'],
    [H2 + FAULT.hard + FAULT.tail + 0.16, 'j-the-wordmark'],
    [SECONDS - 0.06, 'k-the-last-frame'],
  ];
  for (const [want, name] of stills) {
    const f = Math.min(N - 1, Math.round(want * FPS));
    await put(f / FPS, f);
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false, clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
    });
    fs.writeFileSync(path.join(VERIFY, name + '.png'), Buffer.from(shot.data, 'base64'));
  }

  await browser.close();
  srv.close();
  if (SUB > 1) blend(N);
  const state = { built, extract, cover, wmHit, wmRest, lowest, edges, picBox, sigs, frames: N };
  fs.writeFileSync(path.join(OUT, 'post28.json'), JSON.stringify(state, null, 2));
  return state;
}

function blend(N) {
  console.log('  blending ' + N * SUB + ' subframes into ' + N + ' frames ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS * SUB), '-i', path.join(SUBS, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1) + ',setpts=PTS-STARTPTS,framestep=' + SUB,
    '-q:v', '2', path.join(FRAMES, 'f%05d.jpg')]);
}
/* no audio input and `-an`: the file carries no audio stream at all */
function encode() {
  const out = path.join(OUT, 'post28-dark-1080x1920.mp4');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-an', '-movflags', '+faststart', out]);
  return out;
}

/* ========================================================================== */
/* go                                                                         */
/* ========================================================================== */

console.log('post28 — the dance, dark, ' + VW * DSF + 'x' + VH * DSF + ' at ' + FPS + 'fps, ' + SECONDS + 's, silent');
console.log('\n  the clips');
for (const c of CLIPS) {
  console.log('    ' + c.name + ': ' + path.relative(ROOT, c.file) + ', ' + c.w + 'x' + c.h + ' at ' + c.fps + 'fps, ' + c.frames + ' frames, '
    + c.seconds.toFixed(2) + 's; ' + c.out60 + ' frames at sixty, ' + c.outFrames + ' at ' + FPS);
}
console.log('    the mark: x ' + WATERMARK.x0 + '..' + WATERMARK.x1 + ', y ' + WATERMARK.y0 + '..' + WATERMARK.y1
  + ' in the clip\'s own pixels, ' + (WATERMARK.x1 - WATERMARK.x0 + 1) + 'x' + (WATERMARK.y1 - WATERMARK.y0 + 1) + ', covered ' + COVER + ' with ' + COVER_PAD + ' device px around it');

console.log('\n  the beats');
const beats = [
  [0, 'clip one, from its first frame, filling the frame at zoom 1.0; the push begins'],
  [H1 - ANT.for, 'the wind-up: a push in of ' + (ANT.by * 100).toFixed(1) + ' per cent over ' + ANT.for + 's'],
  ...FAULT.pre.map((w, i) => [H1 - w.before, 'stutter ' + (i + 1) + ' of two, into the first fault']),
  [H1, 'the first hit: clip two is on this frame, the reset lands the leg zoom on 1.0, the snap out begins'],
  [H1 + SNAP_FOR, 'the snap lands, zoom ' + BY + '; the push over clip two is under way'],
  [H2 - ANT.for, 'the wind-up again'],
  ...FAULT.pre.map((w, i) => [H2 - w.before, 'stutter ' + (i + 1) + ' of two, into the second fault']),
  [H2, 'the second hit: the picture is cut, the wordmark is born on this frame, the snap out is its birth'],
  [SECONDS, 'end, after ' + CARD.toFixed(2) + 's of the end card'],
].sort((a, b) => a[0] - b[0]);
for (const [t, what] of beats) console.log('    ' + t.toFixed(2).padStart(5) + 's  ' + what);

console.log('\n  the camera');
console.log(describeCamera(cam).split('\n').map(l => '  ' + l).join('\n'));
console.log('    the pop overshoots its mark by ' + (OVER * 100).toFixed(2) + ' per cent of the travel, read off the curve at 240; by is ' + BY + ' so the dip bottoms at 1.0');
const camMo60 = cameraMotion(cam, 60);
const camMo240 = cameraMotion(cam, 240);
console.log('    zoom ' + camMo60.z.min + ' to ' + camMo60.z.max + ' at sixty, ' + camMo240.z.min + ' to ' + camMo240.z.max + ' at 240; the floor is ' + camMo60.z.floor
  + ' and the plan is under it on ' + camMo60.z.underCount + ' frames');

/* ---------- the fast thing, at sixty ----------
   the picture's corner under the camera: the page point (VW, VH) on the
   screen, a frame apart. the glitch's shake is not in it, on purpose, and
   neither is the pair of frames either side of a hit: that step is the
   reset, which is a cut, and the picture cuts on the same frame. */
const corner = t => { const c = cameraFrame(cam, t); return { x: c.tx + VW * c.z, y: c.ty + VH * c.z }; };
const isCut = f => HITS.some(h => f + 1 === Math.round(h * 60));
const FAST = (() => {
  let d = 0, at = 0;
  for (let f = 0; f < Math.round(SECONDS * 60) - 1; f++) {
    if (isCut(f)) continue;
    const a = corner(f / 60), b = corner((f + 1) / 60);
    const s = Math.hypot(b.x - a.x, b.y - a.y);
    if (s > d) { d = s; at = f / 60; }
  }
  return { d: +d.toFixed(2), at: +at.toFixed(3) };
})();
SUB = BLUR_ARG
  ? Math.max(1, Math.min(SUB_MAX, Math.round(BLUR_ARG)))
  : Math.max(1, Math.min(SUB_MAX, Math.ceil(FAST.d / SUB_STEP_WANT)));
SUBSTEP = STEP / SUB;
console.log('\n  the fast thing, at sixty');
console.log('    the picture\'s corner moves at most ' + FAST.d + ' css px a frame, at ' + FAST.at + 's, against a ceiling of ' + STEP_CEIL);
console.log('  the shutter: ' + (SUB > 1
  ? SUB + ' subframes' + (BLUR_ARG ? ' because --blur=' + BLUR_ARG + ' said so' : ', solved') + ', which is ' + (FAST.d / SUB).toFixed(2) + ' css px between samples (wanted ' + SUB_STEP_WANT + ')'
  : 'closed' + (BLUR_ARG ? ' because --blur=1 said so' : ', solved: one sample already puts the fastest move under ' + SUB_STEP_WANT + ' css px')));

const HTML_TO = (argv.find(a => a.startsWith('--html=')) || '').split('=')[1];
if (HTML_TO) { fs.writeFileSync(HTML_TO, sceneHtml()); console.log('\n  the page written to ' + HTML_TO); process.exit(0); }
if (CLOCK_ONLY) process.exit(0);

const state = ONLY_ENCODE
  ? JSON.parse(fs.readFileSync(path.join(OUT, 'post28.json'), 'utf8'))
  : await render();
const file = encode();
const p = probe(file);

console.log('\nrendered');
console.log('  ' + p.w + 'x' + p.h + ' @' + p.fps + 'fps  ' + p.seconds.toFixed(2) + 's  '
  + (p.audio ? 'WITH SOUND' : 'silent, no audio stream') + '  ' + (fs.statSync(file).size / 1e6).toFixed(2) + ' MB  ' + path.relative(ROOT, file));
console.log('  the shutter is ' + (SUB > 1 ? 'open, ' + SUB + ' subframes to a frame' : 'closed'));
console.log('  a still per beat in ' + path.relative(ROOT, VERIFY) + ', and the covered corner before and after');
if (!KEEP && !ONLY_ENCODE) {
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.rmSync(SUBS, { recursive: true, force: true });
  fs.rmSync(SRC, { recursive: true, force: true });
}

/* ========================================================================== */
/* the guards                                                                 */
/* ========================================================================== */
const fail = [];
console.log('\nchecks');

/* ---------- the file ---------- */
if (p.w !== VW * DSF || p.h !== VH * DSF) fail.push('the file is ' + p.w + 'x' + p.h);
if (Math.abs(p.fps - FPS) > 0.01) fail.push('the file runs at ' + p.fps + 'fps rather than ' + FPS);
if (Math.abs(p.seconds - SECONDS) > 0.15) fail.push('the file runs ' + p.seconds.toFixed(2) + 's rather than ' + SECONDS);
if (p.audio) fail.push('the file has an audio stream, and this clip is silent');
if (state.frames !== Math.round(FPS * SECONDS)) fail.push('rendered ' + state.frames + ' frames');

/* ---------- the cover ---------- */
for (const c of state.cover) {
  if (c.boxMax > 0) fail.push('the mark\'s box on ' + c.name + ' reads luma ' + c.boxMax + ' after the cover');
  if (c.floorMax > 40) fail.push('something other than the floor is in the ring around the mark on ' + c.name + ': luma ' + c.floorMax);
}
for (const c of state.extract.clips) {
  const clip = CLIPS.find(x => x.name === c.name);
  if (c.written !== clip.frames) fail.push(c.name + ' wrote ' + c.written + ' frames of ' + clip.frames);
}

/* ---------- the cut: every source frame, in order, none skipped ---------- */
{
  for (let k = 0; k < 2; k++) {
    const clip = CLIPS[k];
    const seen = new Array(clip.frames).fill(0);
    let last = -1;
    for (let f = clip.start; f < clip.start + clip.outFrames; f++) {
      const pic = picAt(f);
      if (!pic || pic.clip !== k) { fail.push('frame ' + f + ' is not clip ' + clip.name); break; }
      if (pic.src < last) { fail.push('clip ' + clip.name + ' runs backwards at frame ' + f); break; }
      if (pic.src > last + 1) { fail.push('clip ' + clip.name + ' skips source frame ' + (last + 1) + ' at output frame ' + f); break; }
      seen[pic.src]++; last = pic.src;
    }
    const missing = seen.map((n, i) => (n ? null : i)).filter(i => i != null);
    if (missing.length) fail.push('clip ' + clip.name + ' never shows source frames ' + missing.slice(0, 6).join(', '));
    if (picAt(clip.start).src !== 0) fail.push('clip ' + clip.name + ' does not start on its first frame');
    if (picAt(clip.start + clip.outFrames - 1).src !== clip.frames - 1) fail.push('clip ' + clip.name + ' does not end on its last frame');
    const copies = seen.reduce((a, b) => Math.min(a, b), Infinity);
    if (FPS === 60 && copies < Math.floor(60 / SRC_FPS)) fail.push('a source frame of ' + clip.name + ' is shown ' + copies + ' time(s) at sixty');
  }
  if (picAt(FRAME.hit1 - 1).clip !== 0 || picAt(FRAME.hit1).clip !== 1) fail.push('the first cut is not on the first hit\'s frame');
  if (picAt(FRAME.hit2 - 1) === null || picAt(FRAME.hit2) !== null) fail.push('the picture is not cut on the second hit\'s frame');
  const a = frameAt((FRAME.hit2 - 1) / FPS, FRAME.hit2 - 1), b = frameAt(FRAME.hit2 / FPS, FRAME.hit2);
  if (a.wm.o !== 0 || b.wm.o !== 1 || a.pic === null || b.pic !== null) fail.push('the wordmark is not born on the frame the picture is cut');
  if (Math.abs(H1 - CLIPS[0].out60 / 60) > 1e-9 || Math.abs(H2 - H1 - CLIPS[1].out60 / 60) > 1e-9) fail.push('a hit is not on the first frame after its clip');
}

/* ---------- the camera never shows the edge ---------- */
{
  if (camMo60.z.min < 1 - 1e-6) fail.push('the zoom goes to ' + camMo60.z.min + ' at sixty, under 1.0, and the picture\'s edge is in shot');
  if (camMo240.z.min < 1 - 1e-6) fail.push('the zoom goes to ' + camMo240.z.min + ' at 240, under 1.0');
  if (camMo60.z.underCount) fail.push('the plan is under the edge floor on ' + camMo60.z.underCount + ' frames');
  if (Math.abs(minZoomFor(cam).z - 1) > 1e-9) fail.push('the edge floor is ' + minZoomFor(cam).z + ' and this plan has no camera shake');
  const e = state.edges;
  if (e.left < -0.5 || e.top < -0.5 || e.right < -0.5 || e.bottom < -0.5) fail.push('a border of the picture came into shot at its lowest zoom: ' + JSON.stringify(e));
  if (Math.abs(state.picBox.w - VW * DSF * state.lowest.z) > 2) fail.push('the canvas on the screen is ' + state.picBox.w + ' device px wide at zoom ' + state.lowest.z);
  /* the push lands, the reset is on the cut, the snap lands where it was aimed */
  for (let i = 0; i < 2; i++) {
    const hit = HITS[i];
    const before = cameraFrame(cam, hit - 1 / 60), on = cameraFrame(cam, hit), landed = cameraFrame(cam, hit + SNAP_FOR + 0.01);
    if (Math.abs(before.legZ - PUSH) > 2e-4) fail.push('the push over clip ' + CLIPS[i].name + ' ends at ' + before.legZ + ', not ' + PUSH);
    if (Math.abs(on.legZ - 1) > 1e-6) fail.push('the leg zoom on hit ' + (i + 1) + ' is ' + on.legZ + ', not reset to 1');
    if (Math.abs(on.snap - A) > 2e-4) fail.push('the wind-up is at ' + on.snap + ' on hit ' + (i + 1) + ', not ' + A);
    if (Math.abs(landed.snap - BY) > 1e-4) fail.push('the snap on hit ' + (i + 1) + ' lands at ' + landed.snap + ', not ' + BY);
    if (on.z <= landed.z) fail.push('the snap on hit ' + (i + 1) + ' is not a zoom out: ' + on.z + ' to ' + landed.z);
    /* and the dip bottoms at 1.0 rather than somewhere above it: the overshoot is used, not avoided */
    let m = Infinity;
    for (let f = Math.floor(hit * 240); f <= Math.ceil((hit + SNAP_FOR + 0.1) * 240); f++) m = Math.min(m, cameraFrame(cam, f / 240).z);
    if (Math.abs(m - 1) > 5e-4) fail.push('the snap on hit ' + (i + 1) + ' bottoms at ' + m.toFixed(5) + ', not at 1.0');
  }
  if (Math.abs(cameraFrame(cam, 0).z - 1) > 1e-9) fail.push('the first frame is at zoom ' + cameraFrame(cam, 0).z);
  if (FAST.d > STEP_CEIL) fail.push('the camera moves ' + FAST.d + ' css px on one frame');
  /* the reset is a jump and no subframe lands inside it, at the widest shutter */
  for (const hit of HITS) {
    const last = hit - 1 / 60 + (SUB_MAX - 1) / (60 * SUB_MAX);
    if (Math.abs(cameraFrame(cam, last).legZ - PUSH) > 1e-6) fail.push('the last subframe before the hit at ' + hit + 's already carries the reset');
  }
  if (SUB > 1 && !BLUR_ARG && FAST.d / SUB > SUB_STEP_WANT + 1e-6) fail.push('the solved shutter leaves ' + (FAST.d / SUB).toFixed(2) + ' css px between samples');
  if (cam.drift) fail.push('the drift is on, and its z channel goes under 1.0');
}

/* ---------- the wordmark clears the safe area through the camera ---------- */
for (const [what, w] of [['on the hit', state.wmHit], ['at rest', state.wmRest]]) {
  if (w.left < SAFE.left || w.right < SAFE.right || w.top < SAFE.top || w.bottom < SAFE.bottom) fail.push('the wordmark ' + what + ' is inside the safe area: ' + w.left + ' / ' + w.top + ' / ' + w.right + ' / ' + w.bottom);
  if (!/Michroma/.test(w.font)) fail.push('the wordmark is not in Michroma: ' + w.font);
}
if (state.wmRest.capPx < WM.minCapPx) fail.push('the wordmark caps are ' + state.wmRest.capPx + ' device px at rest, under ' + WM.minCapPx);
if (Math.abs(state.wmHit.z - A) > 1e-3) fail.push('the wordmark is born at zoom ' + state.wmHit.z + ', not at the wind-up\'s ' + A);

/* ---------- no green, and nothing painted but the picture and the card ---------- */
{
  const dark = brandTokens().dark;
  const mine = sceneHtml().split('==== this clip\'s own css starts here ====')[1];
  const acc = /--accent:\s*#([0-9a-f]{6})/i.exec(dark);
  if (acc && mine.toLowerCase().includes('#' + acc[1].toLowerCase())) fail.push('the site accent is painted somewhere in this clip, and there is no green in it');
  if (/--accent/.test(mine)) fail.push('the accent token is read somewhere in this clip');
}

/* ---------- the faults are short and the ending glitches on a minority of its frames ---------- */
{
  const at60 = Math.round(SECONDS * 60);
  const endFrom = Math.round(H2 * 60);
  let endOn = 0;
  for (let f = endFrom; f < at60; f++) if (glitchAt(f, 60, GL_WINDOWS_60).heat > 0) endOn++;
  if (endOn / (at60 - endFrom) > 0.30) fail.push('the ending glitches on ' + (endOn / (at60 - endFrom) * 100).toFixed(1) + '% of its own frames');
  for (let i = 0; i < 2; i++) {
    const hf = Math.round(HITS[i] * 60);
    const g = glitchAt(hf, 60, GL_WINDOWS_60);
    if (g.heat < 1 || g.flash !== GL.flash || g.bands.length !== GL.bands) fail.push('hit ' + (i + 1) + ' does not land whole on its own frame');
    if (glitchAt(hf - 1, 60, GL_WINDOWS_60).bands.length) fail.push('bands before hit ' + (i + 1));
  }
  /* the picture's bands are in the canvas and the wordmark's in the dom, never both */
  for (let f = 0; f < Math.round(SECONDS * FPS); f++) {
    const o = frameAt(f / FPS, f);
    if (o.pic && o.tears.length) { fail.push('dom tears over the picture at frame ' + f); break; }
    if (!o.pic && o.pic === null && f < FRAME.hit2) { fail.push('no picture at frame ' + f); break; }
  }
}

/* nothing is ever a still frame. */
{
  let repeats = 0, first = null, smallest = Infinity;
  for (let i = 1; i < state.sigs.length; i++) {
    const d = Math.abs(state.sigs[i] - state.sigs[i - 1]);
    if (d === 0) { repeats++; if (first == null) first = i; }
    smallest = Math.min(smallest, d);
  }
  console.log('  liveness: smallest change between frames ' + smallest.toExponential(2)
    + (repeats ? ', ' + repeats + ' IDENTICAL PAIRS' : ', no identical pairs'));
  if (repeats) fail.push(repeats + ' pairs of identical frames, the first at frame ' + first);
}

console.log('\n  outstanding');
console.log('    the cover is ' + COVER + ' and the clip\'s floor is about luma ' + (state.cover[0] ? state.cover[0].floorMean : '?')
  + ': the rectangle is that many levels under its surroundings. one line to paint it the floor\'s own colour');
console.log('    24 into 60 is a three, two cadence and it is left as it is: no frame is invented and none is blended');
console.log('    the shutter is ' + (SUB > 1 ? 'open at ' + SUB : 'closed') + ' because the camera is the only thing this file moves and it moves slowly; the clips carry their own blur');

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
