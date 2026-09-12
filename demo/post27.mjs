/* the boring tek — post27.

   dark only, 1080x1920, no voice. a caption types itself at the top, his eyes
   go red and scan the viewer top to bottom, the scan completes, and a hand
   pops in beside his head with one finger up. then the fault.

     0.0  he is on the frame, idle, the module's own white glow. a caption
          types in at the top, a key tick a character:
          `attention.` / `we are scanning your face`.
     2.0  his eyes go the site's own red on one frame, with post22's own lamp
          on each: the hot core and the flare, in red. the scan begins.
     2.0  two red beams out of the eyes, aimed at a thin red scan line that
   -4.5  runs down the whole frame, so the beams pitch from the top of the
          frame to the bottom as the line does. a hum under it.
     4.5  one beep. beams, line, lamps all gone on the frame, the iris back to
          the module's own, the caption swapped to `scan complete`.
     5.5  the hand pops in beside his head: `assets/finger-sample.png` as it
          is, an image layer with the head's own glow scaled onto it, a small
          scale pop and a pop on the bus.
     6.0  one slow blink.
     7.0  the fault, and the wordmark stacked three lines: post23's ending.

     node post27.mjs                     1080x1920, 60fps, shutter closed
     DEMO_FPS=12 node post27.mjs         the fast preview pass
     node post27.mjs --blur=6            60fps with the shutter open
     node post27.mjs --keep-frames       leave the jpegs on disk
     node post27.mjs --encode-only       re-encode from kept frames
     node post27.mjs --clock             the clock only, no browser

   one output, one path, overwritten every run:

     demo/out/post27-dark-1080x1920.mp4

   ---------- what is borrowed and from where ----------

   **the red is post22's.** the iris override, the core, the flare and the beam
   are that file's three layers at that file's numbers, in index.html's own
   dark `--red`, read out of the site and guarded. what is new is only that
   the beams turn: post22 held them at twelve degrees apart, and here each is
   aimed at the scan line, so the pair sweeps like a scanner does.

   **the end is post23's.** the wordmark, the two stutters into the fault, the
   hit, the bands, the noise and the flash are that file's tables and its
   `glitchAt`, untouched. the split reaches the wordmark and nothing else.

   **the hand is a png, and the module is not asked about it.** it is not a
   glove and it is not registered as one: `assets/finger-sample.png` is drawn
   as it is, beside the head, and what makes it belong is the same thing that
   makes the boots belong in post23 — the plate's own glow scaled onto it. the
   png is white on black, so it is screen blended and the black is the page.

   the mascot is `lib/mascot.mjs` and nothing here reaches inside it. one
   mark, `neutral`, no hands, no bubble, bias nought so he faces the lens.
   this file writes his iris colour for two and a half seconds and his lids
   for half a second, and nothing else about his face. */

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  planMascot, mascotFrame, mascotMotion, mascotCss, mascotMarkup, mascotRuntime,
  mascotPagePlan, describeMascot, describeMotion, headRect,
  STAGE, SAFE, HEAD, GRID, GLOW,
} from './lib/mascot.mjs';
import { brandTokens } from './lib/captions.mjs';
import { renderSfx, writeWav, applyGain, limit, loudness, describeMix } from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post27');
const SUBS = path.join(OUT, 'subframes-post27');
const VERIFY = path.join(OUT, 'verify-post27');

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
const BLUR = argv.some(a => a.startsWith('--blur'));
const BLUR_ARG = (argv.find(a => a.startsWith('--blur=')) || '').split('=')[1];
const SUB = BLUR ? Math.max(2, Math.min(12, Number(BLUR_ARG) || 4)) : 1;
const SUBSTEP = STEP / SUB;

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- where he stands ----------
   post12's line: the middle of the safe band, not of the frame. 148 is the
   head every still in this folder is cut at. */
const CENTRE_Y = (SAFE_CSS.top + (VH - SAFE_CSS.bottom)) / 2;
const SIZE = 148;

/* ---------- the beats ---------- */
const CAP = {
  lines: ['attention.', 'we are scanning your face'],
  done: 'scan complete',
  from: 0.15, to: 1.85,         /* the typing's first and last character */
  size: 26, top: 104,           /* css px. the safe top is 90 */
  gap: 0.047, jitter: 0.40, stop: 0.22,   /* seconds a character, its spread, the pause after a full stop */
  caretHz: 2.4,
};
const SCAN = { at: 2.0, to: 4.5 };
const BEEP = 4.5;
const HAND = { at: 5.5, pop: 0.30, over: 1.08 };
const BLINK = { at: 6.0, close: 0.22, hold: 0.08, open: 0.26 };
const END = { at: 7.0, pre: [], hard: 0.12, tail: 0.18, wmIn: 0, wmFor: 0.09, clean: 0.06 };
const CARD = 0.95;
const SECONDS = +(END.at + CARD).toFixed(2);
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16, minCapPx: 56 };
const GL = {
  shakeX: 15, shakeY: 8, split: 9.5, bandDx: 88, bands: 3,
  noise: [0.10, 0.24], flash: 0.30, flashSize: 420, calmFrom: 0.86,
};

/* ---------- the red ----------
   index.html's own dark `--red`, as components so it can be used at an alpha,
   which is post22's laser exactly. the guard at the bottom reads the token
   back out of the site and compares. **there is no other colour in this
   film**: red, the plate's white and the page's black. */
const RED = [255, 92, 92];
const LASER = {
  core: 22,
  flare: { w: 440, h: 112 },
  beam: { w: 240, h: 1000, aimOut: 120, maxDeg: 110 },
};

/* ---------- the hand ----------
   the png as it is: 636 square, the hand's ink from 112 to 516 across and 42
   to 581 down, measured off the file. it is sized so the hand stands forty
   grid units on the head's own 64, which is a raised fist and a half, and its
   ink's middle is put at grid (81, 28): beside the plate, its cuff just clear
   of the silhouette, its knuckles level with the crown. */
const PNG = { file: 'finger-sample.png', px: 636, ink: { x0: 112, y0: 42, x1: 516, y1: 581 } };
const FINGER = { units: 40, at: { x: 81, y: 28 } };

const CRF = 17;
const TARGET_LUFS = -14;
const SAMPLE_CEILING = -1.8;
const PEAK_CEILING = -1.0;
const MAX_REDUCTION = 5.0;
const STEP_CEIL = 42;

/* ---------- the small maths ---------- */
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const fx = t => ((ax * t + bx) * t + cx) * t;
  const dfx = t => (3 * ax * t + 2 * bx) * t + cx;
  const fy = t => ((ay * t + by) * t + cy) * t;
  return x => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const d = dfx(t);
      if (Math.abs(d) < 1e-6) break;
      const e = fx(t) - x;
      if (Math.abs(e) < 1e-6) break;
      t -= e / d;
    }
    return fy(Math.max(0, Math.min(1, t)));
  };
}
const EASE = bezier(.16, 1, .3, 1);            /* the site's own --ease */
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

/* ---------- the typing ----------
   a character at a time on an uneven clock, seeded, with a longer pause after
   the full stop. the schedule is scaled so the last character lands on
   `CAP.to` exactly, whatever the jitter did. a key tick per character that is
   not a space. */
const COPY = CAP.lines.join('\n');
const TYPED = (() => {
  const r = prng(0x2701);
  const at = [];
  let t = 0;
  for (let i = 0; i < COPY.length; i++) {
    at.push(t);
    let gap = CAP.gap * (1 + (r() * 2 - 1) * CAP.jitter);
    if (COPY[i] === '.') gap += CAP.stop;
    if (COPY[i] === '\n') gap = 0.02;
    t += gap;
  }
  const scale = (CAP.to - CAP.from) / at[at.length - 1];
  return at.map(v => +(CAP.from + v * scale).toFixed(4));
})();
const charsAt = t => TYPED.filter(v => v <= t).length;
const KEYS = TYPED.map((t, i) => ({ t, ch: COPY[i] })).filter(k => k.ch !== ' ' && k.ch !== '\n');

/* ---------- the scan ---------- */
const scanY = t => lerp(-12, VH + 12, span(t, SCAN.at, SCAN.to));
const scanning = f => f >= Math.round(SCAN.at * FPS) && f < Math.round(SCAN.to * FPS);

/* ---------- the hand's pop ----------
   in over `pop` seconds: up past one on the site's own ease, then back onto
   one, which is the module's own anticipation read the other way round. the
   opacity is on in the first frame's worth so there is no ghost. */
function handScale(t) {
  const p = span(t, HAND.at, HAND.at + HAND.pop);
  if (p <= 0) return 0.6;
  if (p < 0.55) return lerp(0.6, HAND.over, EASE(p / 0.55));
  return lerp(HAND.over, 1, EASE((p - 0.55) / 0.45));
}

/* ---------- the slow blink ---------- */
function blinkLid(t) {
  const t0 = BLINK.at, t1 = t0 + BLINK.close, t2 = t1 + BLINK.hold, t3 = t2 + BLINK.open;
  if (t < t0 || t >= t3) return 0;
  if (t < t1) return EASE(span(t, t0, t1));
  if (t < t2) return 1;
  return 1 - EASE(span(t, t2, t3));
}

/* ---------- a point on the head, in css px on the frame ----------
   post22's `cardPoint`: a point in card space through the card's two scales
   and its rotation, then out to the page. the lamps hang off the eyes that are
   drawn rather than the ones the plan describes. */
function cardPoint(plan, fr, gx, gy) {
  const u = plan.unit, c = fr.card;
  const th = c.rot * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
  const ax = c.sx * (gx - GRID / 2), ay = c.sy * (gy - GRID / 2);
  return {
    x: n4(plan.box.left + (GRID / 2) * u + c.x + (cs * ax - sn * ay) * u),
    y: n4(plan.box.top + (GRID / 2) * u + c.y + (sn * ax + cs * ay) * u),
  };
}
const EYE_CX_LOCAL = [
  HEAD.plate.x + HEAD.plate.s / 2 - HEAD.eye.sep / 2,
  HEAD.plate.x + HEAD.plate.s / 2 + HEAD.eye.sep / 2,
];
const eyeSpots = (plan, fr) =>
  [0, 1].map(k => cardPoint(plan, fr, EYE_CX_LOCAL[k] + fr.eyes[k].x, HEAD.eye.cy + fr.eyes[k].y));

/* ---------- the mascot's frame, composed ----------
   the module's own frame with three things written over it: the shadow
   declined (post26's finding, the module paints it in the face colour on
   both themes), the slow blink on the lids, and nothing else. */
function compose(plan, t) {
  const f = mascotFrame(plan, t);
  const lid = blinkLid(t);
  return {
    ...f,
    shadow: { ...f.shadow, o: 0 },
    eyes: lid > 0 ? f.eyes.map(e => ({ ...e, lid: Math.max(e.lid, +lid.toFixed(4)) })) : f.eyes,
  };
}

/* ---------- the glitch, post23's ---------- */
function heatAt(p) {
  if (p < 0) return 0;
  if (p < 0.13) return 1;
  if (p < 0.58) return 1 - (p - 0.13) / 0.45 * 0.58;
  if (p < GL.calmFrom) return 0.42 * (1 - (p - 0.58) / (GL.calmFrom - 0.58));
  return 0;
}
function glitchWindows(fps) {
  return [
    ...END.pre.map((w, i) => ({ ...onGrid(w.t, w.for, fps), kind: 'stutter', force: w.force, seed: 0x51a0 + i * 977 })),
    { ...onGrid(END.at, END.hard + END.tail, fps), kind: 'hit', seed: 0x0c1a55 },
  ].sort((a, b) => a.t0 - b.t0);
}
let GL_WINDOWS = [], GL_WINDOWS_60 = [];
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
  g.flash = (w.kind === 'hit' && f === Math.round(END.at * fps)) ? GL.flash : 0;
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
   everything this file writes, in one object. `t` is the instant and `f` the
   output frame. every exchange — the eyes lighting, the scan ending, the
   caption swapping, the hand arriving, the fault — is on the **frame**, post20's
   60fps rule: the channels of an exchange go on one frame or the shutter
   finds the seam between them. */
function frameAt(plan, t, f, mf) {
  const g = glitchAt(f);
  const cut = f >= Math.round(END.at * FPS);
  const lit = !cut && scanning(f);
  const done = !cut && f >= Math.round(BEEP * FPS);
  const handOn = !cut && f >= Math.round(HAND.at * FPS);
  const eyes = eyeSpots(plan, mf);
  const sy = scanY(t);
  const lampIn = lit ? +EASE(span(t, SCAN.at, SCAN.at + 0.10)).toFixed(4) : 0;
  return {
    t: +t.toFixed(4), f,
    mo: cut ? 0 : 1,
    sx: g.sx, sy: g.sy,
    iris: lit ? 'rgb(' + RED.join(',') + ')' : null,
    lit: lit ? 1 : 0,
    lamps: eyes.map((e, k) => {
      /* the beam is aimed at the scan line, a little outward of its own eye,
         and it may not pitch past the horizontal by more than twenty degrees,
         which is what keeps a beam pointed at the top of the frame off the
         caption. rot 0 is straight down at the lens. */
      const dx = (k ? 1 : -1) * LASER.beam.aimOut, dy = sy - e.y;
      let deg = Math.atan2(-dx, dy) * 180 / Math.PI;
      deg = Math.max(-LASER.beam.maxDeg, Math.min(LASER.beam.maxDeg, deg));
      return { x: n4(e.x), y: n4(e.y), o: lampIn, rot: +deg.toFixed(2) };
    }),
    scan: { y: +sy.toFixed(2), o: lit ? 1 : 0 },
    cap: {
      chars: cut ? 0 : charsAt(t),
      done: done ? 1 : 0,
      caret: !cut && !done && (Math.floor(t * CAP.caretHz * 2) % 2 === 0) ? 1 : 0,
      /* the swap pops the way a caption card does, off the site's ease. */
      sc: done ? +(1 + (1 - EASE(span(t, BEEP, BEEP + 0.16))) * 0.06).toFixed(4) : 1,
      o: cut ? 0 : 1,
    },
    hand: {
      o: handOn ? +Math.min(1, span(t, HAND.at, HAND.at + 1 / 60) + (handOn ? 1 : 0)).toFixed(4) : 0,
      sc: handOn ? +handScale(t).toFixed(4) : 0.6,
      glow: +phosphor(t, 0.10, 3.1, 1.19, 0.7).toFixed(4),
    },
    wm: {
      o: cut ? 1 : 0,
      sc: +(1 + (1 - EASE(span(t, END.wmIn, END.wmIn + END.wmFor))) * 0.085).toFixed(4),
      glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4),
    },
    g,
  };
}

/* ---------- the page ---------- */
function sceneHtml(plan, fingerPlace) {
  const brand = brandTokens();
  const png = fs.readFileSync(path.join(HERE, 'assets', PNG.file)).toString('base64');
  const src = 'data:image/png;base64,' + png;
  /* the head's own glow, scaled onto the hand the way post23 scales it onto
     the boots: the same two radii and the same two opacities, by how big the
     thing wearing it is against the plate. */
  const plate = HEAD.plate.s * plan.unit;
  const handH = FINGER.units * plan.unit;
  const glow = {
    mid: +(GLOW.mid.blur * handH / plate).toFixed(2),
    wide: +(GLOW.wide.blur * handH / plate).toFixed(2),
  };
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post27</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Manrope:wght@800&display=swap">
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
  --body:"Manrope",var(--mono);
  --split-r:rgba(255,120,120,.55); --split-c:rgba(120,220,255,.55);
  /* the laser, which is index.html's own dark --red as components. */
  --laser:${RED.join(',')};
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}

.vignette{position:fixed;inset:-10%;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 78% 62% at 50% 46%,
    rgba(255,255,255,.030) 0%, rgba(255,255,255,.010) 46%, rgba(0,0,0,0) 72%);
  will-change:transform,opacity;
  animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{
  from{transform:scale(1) translate3d(0,0,0);opacity:.85}
  to{transform:scale(1.05) translate3d(0,-1.1%,0);opacity:1}
}
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;background:var(--bg);
  transform:translate3d(calc(var(--sx,0) * 1px),calc(var(--sy,0) * 1px),0);
  will-change:transform}

${mascotCss(plan)}
#m-zone{opacity:var(--m-o,1)}
/* ---- the iris, and it is the whole of the red on his face ----
   post22's rule: this beats the module's own selector rather than changing
   the token, because --eye also draws the brows and none of those goes red. */
#m-zone .m-iris{fill:var(--iris,var(--eye))}

/* ---- the caption ----
   one zone for the whole film, at the top, inside the safe band. manrope at
   the captions' own weight. */
.cap{position:absolute;left:${SAFE_CSS.left}px;right:${SAFE_CSS.right}px;top:${CAP.top}px;
  text-align:center;font-family:var(--body);font-weight:800;font-size:${CAP.size}px;
  line-height:1.25;letter-spacing:-.01em;color:var(--fg);white-space:pre;
  opacity:var(--cap-o,1);transform:scale(var(--cap-s,1));transform-origin:50% 0;z-index:6}
.cap .ln{display:block;min-height:1.25em}
.caret{display:inline-block;width:3px;height:1em;background:var(--fg);
  vertical-align:text-bottom;transform:translateY(.12em);margin-left:2px;opacity:var(--co,1)}

/* ---- the lamps, post22's three layers ----
   every one a radial gradient that reaches zero alpha inside its own box, so
   there is nothing to clip and no seam. above the zone. */
.core{position:absolute;left:0;top:0;width:${LASER.core}px;height:${LASER.core}px;
  margin:${-LASER.core / 2}px 0 0 ${-LASER.core / 2}px;border-radius:50%;pointer-events:none;
  z-index:6;opacity:var(--o,0);
  transform:translate3d(calc(var(--x,0) * 1px),calc(var(--y,0) * 1px),0);will-change:transform,opacity;
  background:radial-gradient(circle,
    rgba(255,255,255,.96) 0%, rgba(255,240,238,.62) 22%,
    rgba(255,180,176,.34) 42%, rgba(var(--laser),.16) 60%,
    rgba(var(--laser),.05) 76%, rgba(var(--laser),0) 92%)}
.flare{position:absolute;left:0;top:0;width:${LASER.flare.w}px;height:${LASER.flare.h}px;
  margin:${-LASER.flare.h / 2}px 0 0 ${-LASER.flare.w / 2}px;pointer-events:none;z-index:5;opacity:var(--o,0);
  transform:translate3d(calc(var(--x,0) * 1px),calc(var(--y,0) * 1px),0);will-change:transform,opacity;
  background:radial-gradient(ellipse 50% 50% at 50% 50%,
    rgba(255,226,220,.34) 0%, rgba(var(--laser),.26) 12%,
    rgba(var(--laser),.15) 28%, rgba(var(--laser),.06) 48%,
    rgba(var(--laser),.015) 68%, rgba(var(--laser),0) 86%)}
.beam{position:absolute;left:0;top:0;width:${LASER.beam.w}px;height:${LASER.beam.h}px;
  margin:0 0 0 ${-LASER.beam.w / 2}px;pointer-events:none;z-index:5;opacity:var(--o,0);
  transform:translate3d(calc(var(--x,0) * 1px),calc(var(--y,0) * 1px),0) rotate(var(--rot,0deg));
  transform-origin:${LASER.beam.w / 2}px 0;will-change:transform,opacity;
  background:
    radial-gradient(ellipse 8% 97% at 50% 0%,
      rgba(255,232,226,.60) 0%, rgba(255,232,226,.22) 22%,
      rgba(255,232,226,.05) 48%, rgba(255,232,226,0) 70%),
    radial-gradient(ellipse 30% 94% at 50% 0%,
      rgba(var(--laser),.32) 0%, rgba(var(--laser),.14) 24%,
      rgba(var(--laser),.045) 50%, rgba(var(--laser),0) 76%)}

/* ---- the scan line ----
   a hairline the width of the frame in the same red, with a soft red glow
   either side, over everything but the end card. */
.scan{position:absolute;left:0;top:0;width:${VW}px;height:2px;z-index:7;pointer-events:none;
  background:rgba(var(--laser),.92);opacity:var(--so,0);
  box-shadow:0 0 6px rgba(var(--laser),.75),0 0 22px rgba(var(--laser),.35),0 0 60px rgba(var(--laser),.12);
  transform:translate3d(0,calc(var(--sy2,0) * 1px),0);will-change:transform,opacity}

/* ---- the hand ----
   the png three times: the ink, and two blurred copies behind it carrying
   the head's own glow. each copy is screen blended and transformed on its
   own, because a wrapper with a transform or an opacity on it isolates the
   blend and the png's black comes back as a black square. */
.hand{position:absolute;left:${fingerPlace.left}px;top:${fingerPlace.top}px;
  width:${fingerPlace.size}px;height:${fingerPlace.size}px;z-index:3;pointer-events:none}
.hand img{position:absolute;left:0;top:0;width:100%;height:100%;display:block;
  mix-blend-mode:screen;transform-origin:${fingerPlace.ox}px ${fingerPlace.oy}px;
  transform:scale(var(--hs,1));will-change:transform,opacity}
.hand .ink{opacity:var(--ho,0)}
.hand .g1{filter:blur(${glow.mid}px);opacity:calc(var(--ho,0) * var(--hg,1) * ${GLOW.mid.o})}
.hand .g2{filter:blur(${glow.wide}px);opacity:calc(var(--ho,0) * var(--hg,1) * ${GLOW.wide.o})}

/* ---- the wordmark, post23's ---- */
.wm{position:absolute;left:50%;top:${CENTRE_Y}px;
  transform:translate(-50%,-50%) scale(var(--wm-s,1));
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
<div class="vignette" aria-hidden="true"></div>
<div class="stage" id="stage">
  <div class="hand" id="hand">
    <img class="g2" src="${src}" alt=""><img class="g1" src="${src}" alt=""><img class="ink" src="${src}" alt="">
  </div>
${mascotMarkup(plan)}
  <div class="flare" id="flare0"></div><div class="flare" id="flare1"></div>
  <div class="beam" id="beam0"></div><div class="beam" id="beam1"></div>
  <div class="core" id="core0"></div><div class="core" id="core1"></div>
  <div class="scan" id="scan"></div>
  <div class="cap" id="cap"><span class="ln" id="ln0"></span><span class="ln" id="ln1"></span></div>
  <div class="wm" id="wm">${WM.lines.map(l => '<span>' + l + '</span>').join('')}</div>
${Array.from({ length: GL.bands }, (_, i) => '  <div class="tear" data-tear="' + i
    + '"><div class="tear-in"><div class="wm">'
    + WM.lines.map(l => '<span>' + l + '</span>').join('') + '</div></div></div>').join('\n')}
  <div class="noise" aria-hidden="true"></div>
  <div class="flash" aria-hidden="true"></div>
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
window.__P27 = ${JSON.stringify({ VW, VH, DSF, WM, CAP })};
${mascotRuntime()}
(${scenePage.toString()})();
Promise.all([document.fonts.load('400 40px Michroma'), document.fonts.load('800 ${CAP.size}px Manrope')])
  .then(function () { return document.fonts.ready; })
  .then(function () {
    window.__built = Object.assign({}, window.__p27.fit(), { mas: window.__mas.build() });
  });
</script>
</body>
</html>`;
}

/* ---------- the page's own script ----------
   writes numbers to elements and decides nothing. serialised in with
   .toString(), so it closes over nothing: everything arrives on window.__P27. */
function scenePage() {
  const P = window.__P27;
  const stage = document.getElementById('stage');
  const zone = document.getElementById('m-zone');
  const hand = document.getElementById('hand');
  const scan = document.getElementById('scan');
  const cap = document.getElementById('cap');
  const ln = [document.getElementById('ln0'), document.getElementById('ln1')];
  const wms = [...document.querySelectorAll('.wm')];
  const tears = [...document.querySelectorAll('.tear')];
  const tearIns = tears.map(t => t.querySelector('.tear-in'));
  const lamps = [0, 1].map(k => ({
    core: document.getElementById('core' + k),
    flare: document.getElementById('flare' + k),
    beam: document.getElementById('beam' + k),
  }));
  let lastCap = null;

  const capOf = el => {
    const cs = getComputedStyle(el);
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    const m = cv.measureText('H');
    return { cap: m.actualBoundingBoxAscent || 0, font: cv.font };
  };

  window.__p27 = {
    fit() {
      const probe = wms[0];
      probe.style.fontSize = '100px';
      let widest = 0;
      for (const sp of probe.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      const ws = 100 * P.WM.w / widest;
      for (const el of wms) el.style.fontSize = ws.toFixed(2) + 'px';
      return { wm: +ws.toFixed(2) };
    },
    measureWm() {
      const el = wms[0], r = el.getBoundingClientRect(), d = P.DSF;
      let widest = 0;
      for (const sp of el.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      const c = capOf(el);
      return {
        sizeCss: +parseFloat(getComputedStyle(el).fontSize).toFixed(2),
        widestPx: +(widest * d).toFixed(1), capPx: +(c.cap * d).toFixed(1), font: c.font,
        left: +(r.left * d).toFixed(1), top: +(r.top * d).toFixed(1),
        right: +((P.VW - r.right) * d).toFixed(1), bottom: +((P.VH - r.bottom) * d).toFixed(1),
      };
    },
    /* the caption as painted: the widest line's box and the font it computed to. */
    measureCap() {
      const d = P.DSF, c = capOf(cap);
      let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
      for (const el of ln) {
        if (!el.textContent) continue;
        const rg = document.createRange(); rg.selectNodeContents(el);
        const r = rg.getBoundingClientRect();
        left = Math.min(left, r.left); right = Math.max(right, r.right);
        top = Math.min(top, r.top); bottom = Math.max(bottom, r.bottom);
      }
      return { font: c.font, capPx: +(c.cap * d).toFixed(1),
        left: +(left * d).toFixed(1), right: +((P.VW - right) * d).toFixed(1),
        top: +(top * d).toFixed(1), bottom: +((P.VH - bottom) * d).toFixed(1),
        widthPx: +((right - left) * d).toFixed(1) };
    },
    /* the hand's ink box on the frame, off the png's own ink numbers through
       the element's box and its scale. */
    measureHand(ink, px) {
      const el = hand.querySelector('.ink'), r = el.getBoundingClientRect(), d = P.DSF;
      const s = r.width / px;
      return { left: +((r.left + ink.x0 * s) * d).toFixed(1), top: +((r.top + ink.y0 * s) * d).toFixed(1),
        right: +((P.VW - (r.left + ink.x1 * s)) * d).toFixed(1), bottom: +((P.VH - (r.top + ink.y1 * s)) * d).toFixed(1),
        w: +((ink.x1 - ink.x0) * s * d).toFixed(1), h: +((ink.y1 - ink.y0) * s * d).toFixed(1) };
    },
    apply(o) {
      const s = stage.style;
      s.setProperty('--m-o', o.mo.toFixed(4));
      s.setProperty('--sx', o.sx.toFixed(2));
      s.setProperty('--sy', o.sy.toFixed(2));
      s.setProperty('--split', o.g.split.toFixed(2));
      s.setProperty('--noise', o.g.noise.toFixed(4));
      s.setProperty('--flash', o.g.flash.toFixed(4));
      s.setProperty('--wm-o', o.wm.o.toFixed(4));
      s.setProperty('--wm-s', o.wm.sc.toFixed(4));
      s.setProperty('--wm-glow', o.wm.glow.toFixed(4));
      if (o.g.split > 0.01) stage.setAttribute('data-gl', '1');
      else stage.removeAttribute('data-gl');

      if (o.iris) zone.style.setProperty('--iris', o.iris);
      else zone.style.removeProperty('--iris');
      for (let k = 0; k < 2; k++) {
        const L = o.lamps[k];
        for (const el of [lamps[k].core, lamps[k].flare, lamps[k].beam]) {
          el.style.setProperty('--x', L.x.toFixed(2));
          el.style.setProperty('--y', L.y.toFixed(2));
          el.style.setProperty('--o', L.o.toFixed(4));
          el.style.visibility = L.o < 0.004 ? 'hidden' : 'visible';
        }
        lamps[k].beam.style.setProperty('--rot', L.rot.toFixed(2) + 'deg');
      }
      scan.style.setProperty('--sy2', o.scan.y.toFixed(2));
      scan.style.setProperty('--so', o.scan.o.toFixed(4));
      scan.style.visibility = o.scan.o < 0.004 ? 'hidden' : 'visible';

      /* the caption: the typed prefix across its two lines, or the done line */
      const key = o.cap.done + ':' + o.cap.chars + ':' + o.cap.caret;
      if (key !== lastCap) {
        lastCap = key;
        if (o.cap.done) { ln[0].textContent = P.CAP.done; ln[1].textContent = ''; }
        else {
          const a = P.CAP.lines[0], b = P.CAP.lines[1];
          const n0 = Math.min(o.cap.chars, a.length);
          const n1 = Math.max(0, Math.min(o.cap.chars - a.length - 1, b.length));
          ln[0].textContent = a.slice(0, n0);
          ln[1].textContent = b.slice(0, n1);
          const target = o.cap.chars <= a.length ? ln[0] : ln[1];
          const old = cap.querySelector('.caret'); if (old) old.remove();
          if (o.cap.caret) { const c = document.createElement('span'); c.className = 'caret'; target.appendChild(c); }
        }
      }
      s.setProperty('--cap-o', o.cap.o.toFixed(4));
      s.setProperty('--cap-s', o.cap.sc.toFixed(4));

      hand.style.setProperty('--ho', o.hand.o.toFixed(4));
      hand.style.setProperty('--hs', o.hand.sc.toFixed(4));
      hand.style.setProperty('--hg', o.hand.glow.toFixed(4));
      hand.style.visibility = o.hand.o < 0.004 ? 'hidden' : 'visible';

      for (let i = 0; i < tears.length; i++) {
        const band = o.g.bands[i], st = tears[i].style;
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

/* ---------- render ---------- */
async function render(plan, fingerPlace) {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  for (const d of [FRAMES, SUBS]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  fs.mkdirSync(OUT, { recursive: true });

  const N = Math.round(FPS * SECONDS);
  const { srv, port } = await serve(sceneHtml(plan, fingerPlace));
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none',
      '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio'],
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
  for (let i = 0; i < 240; i++) {
    const ok = await page.evaluate(() => !!(window.__built && window.__mas && window.__mas.ready
      && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  if (!await page.evaluate(() => !!window.__built)) throw new Error('the scene never became ready');
  for (const [f, what] of [['400 40px "Michroma"', 'the wordmark'], ['800 26px "Manrope"', 'the caption']]) {
    if (!await page.evaluate(q => document.fonts.check(q), f)) throw new Error(f + ' did not load, and ' + what + ' would be judged in the fallback');
  }

  const put = async (t, f) => {
    const mf = compose(plan, t);
    await page.evaluate(fr => window.__mas.apply(fr), mf);
    await page.evaluate(fr => window.__p27.apply(fr), frameAt(plan, t, f, mf));
  };
  const built = await page.evaluate(() => window.__built);
  const wm = await page.evaluate(() => window.__p27.measureWm());
  console.log('  built: head ' + built.mas.headPx + 'px, ' + built.mas.eyes + ' eyes, '
    + built.mas.glows + ' glow layers, theme ' + built.mas.theme);
  console.log('  the wordmark: ' + wm.sizeCss + 'css px, widest line ' + wm.widestPx
    + ' device px, caps ' + wm.capPx + ', clear ' + wm.left + ' left / ' + wm.top
    + ' top / ' + wm.right + ' right / ' + wm.bottom + ' bottom');

  /* the caption fully typed, and the hand fully in, both read off the frame */
  const capF = Math.round((CAP.to + 0.10) * FPS);
  await put(capF / FPS, capF);
  const capBox = await page.evaluate(() => window.__p27.measureCap());
  const doneF = Math.round((BEEP + 0.30) * FPS);
  await put(doneF / FPS, doneF);
  const doneBox = await page.evaluate(() => window.__p27.measureCap());
  const handF = Math.round((HAND.at + HAND.pop + 0.20) * FPS);
  await put(handF / FPS, handF);
  const handBox = await page.evaluate((ink, px) => window.__p27.measureHand(ink, px), PNG.ink, PNG.px);
  console.log('  the caption: ' + capBox.font + ', caps ' + capBox.capPx + ' device px, widest '
    + capBox.widthPx + ', clear ' + capBox.left + ' left / ' + capBox.top + ' top / ' + capBox.right + ' right');
  console.log('  the hand: ' + handBox.w + 'x' + handBox.h + ' device px of ink, clear ' + handBox.right
    + ' right / ' + handBox.top + ' top');

  let worst = null;
  for (let f = 0; f < Math.round(END.at * FPS); f++) {
    const t = f / FPS;
    const r = headRect(plan, compose(plan, t));
    const near = Math.min(r.left, r.top, r.right, r.bottom);
    if (!worst || near < worst.near) worst = { t: +t.toFixed(3), near, ...r };
  }

  const sigs = [];
  const wall = Date.now();
  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const mf = compose(plan, t);
      const o = frameAt(plan, t, f, mf);
      await page.evaluate(fr => window.__mas.apply(fr), mf);
      await page.evaluate(fr => window.__p27.apply(fr), o);
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);
      if (k === 0) {
        let s = o.mo * 7 + o.sx * 29 + o.sy * 31 + o.lit * 13 + o.scan.y * 17 * o.scan.o
          + o.cap.chars * 19 + o.cap.done * 23 + o.cap.caret * 37 + o.cap.sc * 41 + o.cap.o * 43
          + o.hand.o * 47 + o.hand.sc * 53 + o.hand.glow * 59
          + o.wm.o * 61 + o.wm.sc * 67 + o.wm.glow * 71
          + o.g.split * 73 + o.g.noise * 79 + o.g.flash * 83 + o.g.bands.length * 89;
        for (const L of o.lamps) s += L.o * (L.rot * 97 + L.x * 101 + L.y * 103);
        s += o.mo * (mf.card.x * 107 + mf.card.y * 109 + mf.card.rot * 113 + mf.card.sx * 127 + mf.card.sy * 131);
        for (let e = 0; e < 2; e++) {
          s += o.mo * (mf.eyes[e].x * (137 + e) + mf.eyes[e].y * (139 + e) + mf.eyes[e].lid * (149 + e));
        }
        sigs.push(+s.toFixed(6));
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

  fs.rmSync(VERIFY, { recursive: true, force: true });
  fs.mkdirSync(VERIFY, { recursive: true });
  const stills = [
    [0.02, 'a-the-first-frame'],
    [CAP.from + (CAP.to - CAP.from) * 0.5, 'b-typing'],
    [CAP.to + 0.05, 'c-typed'],
    [SCAN.at + 0.10, 'd-the-eyes-go-red'],
    [SCAN.at + (SCAN.to - SCAN.at) * 0.35, 'e-the-scan-high'],
    [SCAN.at + (SCAN.to - SCAN.at) * 0.75, 'f-the-scan-low'],
    [BEEP + 0.20, 'g-scan-complete'],
    [HAND.at + HAND.pop * 0.5, 'h-the-hand-popping'],
    [HAND.at + HAND.pop + 0.20, 'i-the-hand'],
    [BLINK.at + BLINK.close + BLINK.hold * 0.5, 'j-the-blink'],
    [END.at - 0.20, 'k-the-second-stutter'],
    [END.at + END.hard + END.tail + 0.16, 'l-the-wordmark'],
    [SECONDS - 0.06, 'm-the-last-frame'],
  ];
  for (const [want, name] of stills) {
    const f = Math.min(N - 1, Math.round(want * FPS));
    await put(f / FPS, f);
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false, clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
    });
    fs.writeFileSync(path.join(VERIFY, name + '.png'), Buffer.from(shot.data, 'base64'));
  }
  console.log('  the head, worst frame at ' + worst.t + 's: ' + worst.left + ' left, ' + worst.top
    + ' top, ' + worst.right + ' right, ' + worst.bottom + ' bottom (floor '
    + Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom) + ')');

  await browser.close();
  srv.close();
  if (SUB > 1) blend(N);
  const state = { built, wm, capBox, doneBox, handBox, head: worst, sigs, frames: N };
  fs.writeFileSync(path.join(OUT, 'post27.json'), JSON.stringify(state, null, 2));
  return state;
}

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }
function blend(N) {
  console.log('  blending ' + N * SUB + ' subframes into ' + N + ' frames ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS * SUB), '-i', path.join(SUBS, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1) + ',setpts=PTS-STARTPTS,framestep=' + SUB,
    '-q:v', '2', path.join(FRAMES, 'f%05d.jpg')]);
}
function encode(wav) {
  const out = path.join(OUT, 'post27-dark-1080x1920.mp4');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'), '-i', wav,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
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
    fps: fps ? parseFloat(fps[1]) : null, audio: /Audio:\s*aac/.test(out),
  };
}

/* ========================================================================== */
/* go                                                                         */
/* ========================================================================== */

END.wmIn = END.at;
END.pre = [
  { t: +(END.at - 0.38).toFixed(3), for: 0.05, force: 0.34 },
  { t: +(END.at - 0.18).toFixed(3), for: 0.05, force: 0.60 },
];
GL_WINDOWS = glitchWindows(FPS);
GL_WINDOWS_60 = FPS === 60 ? GL_WINDOWS : glitchWindows(60);

/* ---------- the plan ----------
   one mark, calm, and the seed walked so the module's own blinks stay out of
   the way of the one this file asks for: none from a beat before the hand
   lands to the fault, and none on the frame the eyes go red. */
const makePlan = seed => planMascot({
  seconds: SECONDS, size: SIZE, theme: 'dark', bias: 0, seed,
  marks: [{ t: 0, state: 'neutral' }],
});
const SEED = (() => {
  for (let s = 1; s <= 400; s++) {
    const b = makePlan(s).idle.blinks;
    if (b.some(x => x.t >= HAND.at - 0.30 && x.t < END.at)) continue;
    if (b.some(x => Math.abs(x.t - SCAN.at) < 0.30 || Math.abs(x.t - SCAN.to) < 0.30)) continue;
    return s;
  }
  throw new Error('no seed under 400 keeps the module\'s blinks clear of the beats');
})();
const plan = makePlan(SEED);
console.log('  the idle seed is ' + SEED + ', walked so no module blink lands between '
  + (HAND.at - 0.30).toFixed(2) + 's and the fault');

const halfBox = (GRID / 2) * plan.unit;
plan.box.left = +(VW / 2 - halfBox).toFixed(2);
plan.box.top = +(CENTRE_Y - halfBox).toFixed(2);

/* the hand's place: the png element sized so its ink stands FINGER.units on
   the head's grid, put so the ink's middle lands on FINGER.at in card space. */
const fingerPlace = (() => {
  const inkH = PNG.ink.y1 - PNG.ink.y0;
  const size = +(FINGER.units * plan.unit * PNG.px / inkH).toFixed(2);
  const s = size / PNG.px;
  const ox = (PNG.ink.x0 + PNG.ink.x1) / 2 * s, oy = (PNG.ink.y0 + PNG.ink.y1) / 2 * s;
  const cx = plan.box.left + FINGER.at.x * plan.unit, cy = plan.box.top + FINGER.at.y * plan.unit;
  return { size, ox: +ox.toFixed(2), oy: +oy.toFixed(2), left: +(cx - ox).toFixed(2), top: +(cy - oy).toFixed(2) };
})();

const rep = mascotMotion(plan, FPS, SECONDS);
const rep60 = FPS === 60 ? rep : mascotMotion(plan, 60, SECONDS);
console.log(describeMascot(plan));
console.log(describeMotion(rep));

/* ---------- the sound ----------
   no voice, no music, no bed. key ticks under the typing, the hum under the
   scan, one beep, one pop and post23's five glitches. */
const cues = [
  ...KEYS.map((k, i) => ({ t: k.t, kind: 'key', opts: { seed: 0x2700 + i * 131 }, from: 'typing "' + k.ch + '"' })),
  { t: SCAN.at, kind: 'hum', opts: { len: SCAN.to - SCAN.at }, from: 'the scan' },
  { t: BEEP, kind: 'ding', opts: { f: 880, tau: 0.09, len: 0.30 }, from: 'the beep, scan complete' },
  { t: HAND.at, kind: 'pop', from: 'the hand' },
  { t: END.at, kind: 'glitch', from: 'the cut' },
];
const { buf: sfx, report: sfxReport } = renderSfx(cues, SECONDS, {});
const PRE_DB = [-32, -27];
for (let i = 0; i < END.pre.length; i++) {
  const g = GL_WINDOWS.find(x => x.kind === 'stutter' && Math.abs(x.t0 - Math.round(END.pre[i].t * FPS) / FPS) < 1e-9);
  const one = renderSfx([{
    t: g ? g.t0 : END.pre[i].t, kind: 'glitch',
    opts: { len: 0.05 + i * 0.014, burst: 0.004, crush: 3800, f0: 210, f1: 120, seed: 0x51a0 + i * 977 },
    from: 'stutter ' + (i + 1) + ' of two, into the fault',
  }], SECONDS, { gains: { glitch: PRE_DB[i] } });
  for (let j = 0; j < sfx.length; j++) sfx[j] += one.buf[j];
  sfxReport.push(...one.report);
}
sfxReport.sort((a, b) => a.t - b.t);

/* ---------- the mix, post23's rig ---------- */
const WAV = path.join(OUT, 'post27-mix.wav');
const RAW = path.join(OUT, 'post27-mix-raw.wav');
fs.mkdirSync(OUT, { recursive: true });
function pass(lift) {
  const buf = sfx.slice();
  applyGain(buf, lift);
  const pk = limit(buf, SAMPLE_CEILING);
  writeWav(RAW, buf);
  const lu = loudness(ffmpeg, RAW);
  return { lift: +lift.toFixed(2), buf, peak: pk, lufs: lu.lufs };
}
const zero = pass(0);
const wantLift = zero.lufs == null ? 0 : +(TARGET_LUFS - zero.lufs).toFixed(2);
let best = zero, tries = 1;
if (wantLift > 0.05) {
  let lo = 0, hi = wantLift;
  const top = pass(wantLift); tries++;
  if (top.peak.reduction <= MAX_REDUCTION) best = top;
  else {
    while (hi - lo > 0.20 && tries < 10) {
      const mid = (lo + hi) / 2;
      const p2 = pass(mid); tries++;
      if (p2.peak.reduction <= MAX_REDUCTION) { lo = mid; best = p2; } else hi = mid;
    }
  }
} else if (wantLift < -0.05) { best = pass(wantLift); tries++; }
writeWav(WAV, best.buf);
const after = loudness(ffmpeg, WAV);
const peak = best.peak;
fs.rmSync(RAW, { force: true });

console.log('\n  the beats');
const beats = [
  [0, 'he is on the frame, idle, the module\'s own white glow'],
  [CAP.from, 'the caption types: ' + CAP.lines.join(' / ') + ', a key tick a character'],
  [CAP.to, 'the last character'],
  [SCAN.at, 'the eyes go red on this frame, the lamps come up, the beams and the scan line start at the top'],
  [SCAN.to, 'the beep. beams, line and lamps gone, the iris back, the caption swaps to ' + CAP.done],
  [HAND.at, 'the hand pops in beside his head, a pop on the bus'],
  [BLINK.at, 'one slow blink, ' + (BLINK.close + BLINK.hold + BLINK.open).toFixed(2) + 's'],
  ...END.pre.map((w, i) => [w.t, 'stutter ' + (i + 1) + ' of two, into the fault']),
  [END.at, 'the fault. he, the caption and the hand are cut and the wordmark is born on that frame'],
  [SECONDS, 'end, after ' + (SECONDS - END.wmIn - END.wmFor).toFixed(2) + 's of the end card'],
].sort((a, b) => a[0] - b[0]);
for (const [t, what] of beats) console.log('    ' + t.toFixed(2).padStart(5) + 's  ' + what);
console.log('  the typing: ' + KEYS.length + ' key ticks from ' + TYPED[0].toFixed(2) + 's to ' + TYPED[TYPED.length - 1].toFixed(2) + 's');

console.log('\n  the sound');
console.log(describeMix(sfxReport, {
  'the voice': 'there is none, and there is no music and no bed either',
  'the lift': 'off the bus at ' + (zero.lufs == null ? '?' : zero.lufs) + ' LUFS, ' + TARGET_LUFS
    + ' wanted ' + wantLift.toFixed(2) + ' dB, took ' + best.lift.toFixed(2) + ' in ' + tries + ' pass' + (tries === 1 ? '' : 'es'),
  'the bus': (after.lufs == null ? '?' : after.lufs) + ' LUFS, peak ' + peak.peak
    + ' dBFS, limiter took ' + (peak.reduction > 0.01 ? peak.reduction.toFixed(2) + ' dB' : 'nothing'),
}));

/* ---------- the fast things, at sixty ----------
   the beam's far end, the scan line and the hand's pop, in css px a frame. */
const fastest = (fn, a, b) => {
  let d = 0, at = a;
  for (let f = Math.floor(a * 60); f < Math.ceil(b * 60); f++) {
    const s = Math.abs(fn((f + 1) / 60) - fn(f / 60));
    if (s > d) { d = s; at = f / 60; }
  }
  return { d: +d.toFixed(2), at: +at.toFixed(3) };
};
const scanStep = fastest(scanY, SCAN.at, SCAN.to);
const handStep = fastest(t => handScale(t) * (PNG.ink.y1 - PNG.ink.y0) * fingerPlace.size / PNG.px / 2, HAND.at, HAND.at + HAND.pop);
console.log('  the scan line moves ' + scanStep.d + ' css px a frame at sixty; the hand\'s edge moves at most '
  + handStep.d + ' css px a frame in its pop (ceiling ' + STEP_CEIL + ')');

if (CLOCK_ONLY) process.exit(0);

const state = ONLY_ENCODE
  ? JSON.parse(fs.readFileSync(path.join(OUT, 'post27.json'), 'utf8'))
  : await render(plan, fingerPlace);
const file = encode(WAV);
const p = probe(file);
const lu = loudness(ffmpeg, file);

console.log('\nrendered');
console.log('  ' + p.w + 'x' + p.h + ' @' + p.fps + 'fps  ' + p.seconds.toFixed(2) + 's  '
  + (p.audio ? 'with sound' : 'SILENT') + '  ' + (fs.statSync(file).size / 1e6).toFixed(2) + ' MB  ' + path.relative(ROOT, file));
console.log('  the shutter is ' + (BLUR ? 'open, ' + SUB + ' subframes to a frame' : 'closed'));
if (lu && lu.ok) console.log('  loudness ' + lu.lufs + ' LUFS integrated, ' + lu.lra + ' LU range, true peak ' + lu.truePeak + ' dBFS, measured on the mp4');
console.log('  a still per beat in ' + path.relative(ROOT, VERIFY));
if (!KEEP && !ONLY_ENCODE) {
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.rmSync(SUBS, { recursive: true, force: true });
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
if (!p.audio) fail.push('the file has no audio track');
if (state.frames !== Math.round(FPS * SECONDS)) fail.push('rendered ' + state.frames + ' frames');

/* ---------- the beats are where the brief put them ---------- */
{
  const want = [['the scan', SCAN.at, 2.0], ['the scan\'s end', SCAN.to, 4.5], ['the beep', BEEP, 4.5],
    ['the hand', HAND.at, 5.5], ['the fault', END.at, 7.0]];
  for (const [what, is, should] of want) if (Math.abs(is - should) > 1e-9) fail.push(what + ' is at ' + is + 's, and the brief says ' + should);
  if (!(CAP.from >= 0 && CAP.to <= 2.0)) fail.push('the typing runs ' + CAP.from + ' to ' + CAP.to + ', outside 0 to 2');
  if (!(BLINK.at >= HAND.at && BLINK.at + BLINK.close + BLINK.hold + BLINK.open <= END.at)) fail.push('the blink is not inside the hand\'s beat');
  if (CAP.done !== 'scan complete') fail.push('the swapped caption reads "' + CAP.done + '"');
  if (CAP.lines.join(' ') !== 'attention. we are scanning your face') fail.push('the typed caption reads "' + CAP.lines.join(' ') + '"');
  /* every exchange is one frame: the frame before it has none of it and the
     frame of it has all of it */
  const at = f => { const t = f / FPS; const mf = compose(plan, t); return frameAt(plan, t, f, mf); };
  const fs0 = Math.round(SCAN.at * FPS), fe = Math.round(SCAN.to * FPS), fh = Math.round(HAND.at * FPS), fc = Math.round(END.at * FPS);
  if (at(fs0 - 1).iris !== null || at(fs0).iris === null) fail.push('the iris does not go red on the scan\'s own frame');
  if (at(fs0 - 1).scan.o !== 0 || at(fs0).scan.o !== 1) fail.push('the scan line is not born on the scan\'s own frame');
  if (at(fe - 1).iris === null || at(fe).iris !== null) fail.push('the iris is not back on the beep\'s frame');
  if (at(fe - 1).scan.o !== 1 || at(fe).scan.o !== 0 || at(fe).lamps.some(l => l.o !== 0)) fail.push('the scan does not end on the beep\'s frame');
  if (at(fe - 1).cap.done !== 0 || at(fe).cap.done !== 1) fail.push('the caption does not swap on the beep\'s frame');
  if (at(fh - 1).hand.o !== 0 || at(fh).hand.o !== 1) fail.push('the hand is not on its own frame, whole');
  if (at(fc - 1).mo !== 1 || at(fc).mo !== 0 || at(fc).wm.o !== 1 || at(fc).hand.o !== 0 || at(fc).cap.o !== 0) fail.push('the fault does not cut everything on one frame');
  /* the beams pitch top to bottom: the far end of a beam is above the eye at
     the start and below it at the end, and the pitch only ever falls */
  let lastRot = null, monotone = true;
  for (let f = fs0; f < fe; f++) {
    const r = Math.abs(at(f).lamps[1].rot);
    if (lastRot != null && r > lastRot + 1e-6) monotone = false;
    lastRot = r;
  }
  if (Math.abs(at(fs0).lamps[1].rot) < 90) fail.push('the beams start aimed below the horizontal, not at the top of the frame');
  if (Math.abs(at(fe - 1).lamps[1].rot) > 30) fail.push('the beams end ' + at(fe - 1).lamps[1].rot + ' degrees off straight down');
  if (!monotone) fail.push('a beam pitches back up during the scan');
  if (scanY(SCAN.at) > 0 || scanY(SCAN.to) < VH) fail.push('the scan line does not cross the whole frame');
  /* the lid closes fully once in the blink and the module does not blink in the beat */
  let closed = 0;
  for (let f = Math.round(HAND.at * FPS); f < fc; f++) { const e = compose(plan, f / FPS).eyes; if (e[0].lid >= 0.98 && e[1].lid >= 0.98) closed++; }
  if (closed < 1) fail.push('the slow blink never closes the lids');
  if (plan.idle.blinks.some(x => x.t >= HAND.at - 0.30 && x.t < END.at)) fail.push('a module blink lands in the hand\'s beat, so there would be two');
}

/* ---------- the red is the site's, and it is the only colour ---------- */
{
  const dark = brandTokens().dark;
  const m = /--red:\s*#([0-9a-f]{6})/i.exec(dark);
  if (!m) fail.push('index.html\'s dark block has no --red in it');
  else {
    const want = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16));
    if (want.join(',') !== RED.join(',')) fail.push('the laser is rgb(' + RED.join(',') + ') and the site\'s --red is rgb(' + want.join(',') + ')');
  }
  const mine = sceneHtml(plan, fingerPlace).split('==== this clip\'s own css starts here ====')[1];
  const acc = /--accent:\s*#([0-9a-f]{6})/i.exec(dark);
  if (acc && mine.toLowerCase().includes('#' + acc[1].toLowerCase())) fail.push('the site accent is painted somewhere in this clip, and there is no green in it');
  if (/rgba\(255,\s*92,\s*92/.test(mine)) fail.push('the red is typed as a literal somewhere rather than taken off --laser');
}

/* ---------- the caption, the hand and the wordmark clear the safe area ---------- */
{
  for (const [what, b] of [['the typed caption', state.capBox], ['the swapped caption', state.doneBox]]) {
    if (!/Manrope/.test(b.font)) fail.push(what + ' is not set in Manrope: ' + b.font);
    if (b.left < SAFE.left || b.right < SAFE.right) fail.push(what + ' is inside the side margins: ' + b.left + ' / ' + b.right);
    if (b.top < SAFE.top) fail.push(what + ' sits ' + b.top + ' device px from the top, inside the 180 band');
  }
  const h = state.handBox;
  if (h.right < SAFE.right) fail.push('the hand\'s ink is ' + h.right + ' device px from the right edge, inside the 140 band');
  if (h.top < SAFE.top) fail.push('the hand\'s ink is ' + h.top + ' device px from the top');
  if (state.head.near < Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom)) fail.push('the head comes within ' + state.head.near + ' device px of a border');
  const w = state.wm;
  if (w.left < SAFE.left || w.right < SAFE.right || w.top < SAFE.top || w.bottom < SAFE.bottom) fail.push('the wordmark is inside the safe area');
  if (w.capPx < WM.minCapPx) fail.push('the wordmark caps are ' + w.capPx + ' device px, under ' + WM.minCapPx);
  if (!/Michroma/.test(w.font)) fail.push('the wordmark is not in Michroma: ' + w.font);
}

/* ---------- the module's own report ---------- */
for (const st of rep60.states) {
  if (st.entryFrames == null) fail.push(st.state + ' never reached its own mark');
}
if (rep60.outside.units > 0) fail.push('feature ink lands ' + rep60.outside.units.toFixed(2) + ' units outside the head silhouette');
if (rep60.frozenFrames) fail.push(rep60.frozenFrames + ' frames where the face is not moving at all');

/* ---------- the sound ---------- */
{
  for (const r of sfxReport) {
    if (r.cut) fail.push('the ' + r.kind + ' cue at ' + r.t + 's was cut off by the end of the clip');
    if (r.t < 0 || r.t > SECONDS) fail.push('the ' + r.kind + ' cue at ' + r.t + 's is outside the clip');
  }
  const allowed = ['key', 'hum', 'ding', 'pop', 'glitch'];
  const strays = sfxReport.filter(r => !allowed.includes(r.kind));
  if (strays.length) fail.push('the bus carries ' + [...new Set(strays.map(r => r.kind))].join(', '));
  const keys = sfxReport.filter(r => r.kind === 'key');
  if (keys.length !== KEYS.length) fail.push('there are ' + keys.length + ' key ticks and ' + KEYS.length + ' typed characters');
  if (keys.some(r => r.t < CAP.from - 1e-6 || r.t > CAP.to + 1e-6)) fail.push('a key tick sounds outside the typing');
  if (sfxReport.filter(r => r.kind === 'hum').length !== 1) fail.push('the scan has no hum, or more than one');
  if (sfxReport.filter(r => r.kind === 'ding').length !== 1) fail.push('there is not exactly one beep');
  if (sfxReport.filter(r => r.kind === 'pop').length !== 1) fail.push('there is not exactly one pop');
  if (sfxReport.filter(r => r.kind === 'glitch').length !== 3) fail.push('the ending is not two stutters and a hit');
  console.log('  the bus: ' + sfxReport.length + ' cues, ' + keys.length + ' key ticks, one hum, one beep, one pop, three glitches. no voice, no music');
}
if (lu && lu.ok) {
  if (lu.truePeak > PEAK_CEILING) fail.push('the true peak is ' + lu.truePeak + ' dBFS, over the ' + PEAK_CEILING + ' ceiling');
  if (lu.lufs > TARGET_LUFS + 0.5) fail.push('the file measures ' + lu.lufs + ' LUFS, over the ' + TARGET_LUFS + ' target');
} else fail.push('ebur128 said nothing about the finished file');
if (peak.reduction > MAX_REDUCTION + 1e-6) fail.push('the limiter took ' + peak.reduction.toFixed(2) + ' dB, over the ' + MAX_REDUCTION + ' dB this clip allows');

/* ---------- the fast things ---------- */
if (scanStep.d > STEP_CEIL) fail.push('the scan line moves ' + scanStep.d + ' css px on one frame at 60');
if (handStep.d > STEP_CEIL) fail.push('the hand\'s edge moves ' + handStep.d + ' css px on one frame in its pop');

/* ---------- the ending glitches on a minority of its own frames ---------- */
{
  const at60 = { N: Math.round(SECONDS * 60) };
  const endFrom = Math.round(END.at * 60);
  let endOn = 0;
  for (let f = endFrom; f < at60.N; f++) if (glitchAt(f, 60, GL_WINDOWS_60).heat > 0) endOn++;
  if (endOn / (at60.N - endFrom) > 0.30) fail.push('the ending glitches on ' + (endOn / (at60.N - endFrom) * 100).toFixed(1) + '% of its own frames');
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
console.log('    the hand is a png and not a glove: it is not in the module, it does not pose, and it is'
  + ' screen blended so the png\'s own black is the page');
console.log('    the beams are aimed at the scan line and clamped ' + LASER.beam.maxDeg + ' degrees off straight'
  + ' down, so a beam never points at the caption');
console.log('    the slow blink is written over the module\'s lids for half a second; the module\'s own'
  + ' blinks are kept out of that beat by the seed');

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
