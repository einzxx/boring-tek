/* the boring tek — post39. agi next year.

   dark only, 1080x1920, fourteen and a half seconds. three lines on
   elevenlabs, two narrator and one human, and one 1 khz bleep, and nothing
   else on the bus: einz puts every other sound on himself.

     the wall        he sits in the middle of the lower third, eyes calm. on
                     the wall above him a clean sign, agi next year, in
                     michroma, and next to it a tear off calendar on 2023.
     the years       the pages tear off one by one, 2024, 2025, 2026, each a
                     quick tug and a page fluttering down past him. the gaps
                     shrink, slow before fast. the sign never changes. a web
                     draws itself from the top corner down onto his head, and
                     dust settles on him. his eyes stay open; the blinks get
                     slower and heavier and the lids sit a little lower each
                     time. he never gets angry.
     the promise     on 2026 the sign flickers, the letters shuffle as if it
                     will change, and they land on agi next year again.
     the look        his eyes slide to the lens, one slow blink, and his
                     bubble says any day now, with the narrator.
     the spider      it spun the dropline on the way down and has sat on his
                     head since 4.8s.
     the ask         his bubble and the narrator: do you know what agi means.
     the reveal      the spider springs up in front of his face, head sized
                     for a moment, legs out, happy eyes, an AGI sign on its
                     thread, and says surprise surprise mother fucker in the
                     human voice, fuck bleeped. his eyes go to it, then to
                     the lens, one slow blink.
     the cut         post38's glitch.
     the end card    the wordmark alone.

   the rig, the bubble, the glitch and the end card are post38's. the web is
   the motion kit's trim path. no hands in this one.

     DEMO_FPS=12 node post39.mjs         the preview
     node post39.mjs                     60fps, shutter open, solved
     node post39.mjs --no-blur           shutter closed
     node post39.mjs --keep-frames       leave the jpegs on disk

     demo/out/post39-dark-1080x1920.mp4
     demo/out/verify-post39/contact.png, phone.png    the critique sheets
*/

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  planMascot, mascotFrame, mascotCss, mascotMarkup, mascotRuntime, mascotPagePlan,
  STAGE, HEAD, GRID, BUBBLE, EYE_CX, TURN, GLOW,
} from './lib/mascot.mjs';
import { brandTokens } from './lib/captions.mjs';
import { speak, VOICE_OUT, elevenReady } from './lib/voice.mjs';
import { SR, decode, writeWav, applyGain, limit, loudness } from './lib/sfx.mjs';
import { trim, pathMarkup, motionApply } from './lib/motion.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post39');
const SUBS = path.join(OUT, 'subframes-post39');
const VERIFY = path.join(OUT, 'verify-post39');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = STAGE.dsf;
const VW = STAGE.w, VH = STAGE.h;
const FLOOR_CSS = 120 / DSF;
const APP_ZONE = 300 / DSF;

const argv = process.argv.slice(2);
const KEEP = argv.includes('--keep-frames');
const BLUR = !argv.includes('--no-blur');
const SUB_STEP_WANT = 10, SUB_MAX = 12;
let SUB = 1, SUBSTEP = STEP;
const SHUTTER = 0.5;

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- the small maths, post38's ---------- */
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const fx = t => ((ax * t + bx) * t + cx) * t, dfx = t => (3 * ax * t + 2 * bx) * t + cx, fy = t => ((ay * t + by) * t + cy) * t;
  return x => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) { const d = dfx(t); if (Math.abs(d) < 1e-6) break; const e = fx(t) - x; if (Math.abs(e) < 1e-6) break; t -= e / d; }
    return fy(Math.max(0, Math.min(1, t)));
  };
}
const EASE = bezier(.16, 1, .3, 1);
const POP = bezier(.34, 1.4, .64, 1);
const IO = bezier(.45, 0, .55, 1);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a), 0, 1));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = q => (q <= 0 ? 0 : q >= 1 ? 1 : q * q * (3 - 2 * q));
const DEG = Math.PI / 180;
function phosphor(t, amp, slow, fast, phase) {
  return 1 + amp * 0.78 * Math.sin(2 * Math.PI * t / slow) + amp * 0.39 * Math.sin(2 * Math.PI * t / fast + phase);
}
function prng(seed) {
  let x = seed | 0 || 0x1a2b3c;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x |= 0; return (x >>> 0) / 4294967296; };
}
function onGrid(t, len, fps) {
  const f0 = Math.round(t * fps), n = Math.max(1, Math.round(len * fps));
  return { t0: f0 / fps, t1: (f0 + n) / fps, frames: n };
}

/* ---------- the words, exactly as written ---------- */
const SIGN = ['agi', 'next year'];
const YEARS = ['2023', '2024', '2025', '2026'];
const PILL = 'any day now';
const ASK = 'do you know what agi means';
const TAG = 'AGI';
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16 };
/* the shuffle only ever shows letters and digits, so no frame of it can put
   a dash or a quote on screen either */
const SHUFFLE = 'abcdefghijklmnopqrstuvwxyz0123456789';
for (const s of [...SIGN, ...YEARS, PILL, ASK, TAG, ...WM.lines, SHUFFLE]) {
  if (/[-\u2010-\u2015'"\u2018-\u201f`]/.test(s)) throw new Error('a dash, apostrophe or quote on screen: ' + s);
}

/* ==========================================================================
   the read: one line, the narrator, elevenlabs or nothing
   ========================================================================== */
const SILENCE_DB = -42, PRE = 0.06, POST = 0.10, EDGE_FADE = 0.012;
const TARGET_LUFS = -14, SAMPLE_CEILING = -1.8, MAX_REDUCTION = 12;
for (const id of ['narrator', 'human']) if (!elevenReady(id)) {
  console.error('\nSTOPPED. elevenlabs is not set up for the ' + id + ' voice in demo/.env, and this clip has no edge fallback.');
  process.exit(1);
}
function audioEdges(pcm) {
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  const gate = peak * Math.pow(10, SILENCE_DB / 20);
  const H = Math.round(0.005 * SR), n = Math.floor(pcm.length / H);
  const loud = k => { let m = 0; for (let j = k * H; j < Math.min((k + 1) * H, pcm.length); j++) m = Math.max(m, Math.abs(pcm[j])); return m > gate; };
  let a = 0, b = n - 1;
  while (a < n && !loud(a)) a++;
  while (b > a && !loud(b)) b--;
  return { start: +(a * 0.005).toFixed(4), end: +((b + 1) * 0.005).toFixed(4) };
}
/* what is read can differ from what is shown: the narrator spells agi out,
   and the spider's line has no bubble at all, the sign is its text */
const LINES = [
  { name: 'post39-l1', voice: 'calm', want: 'narrator', say: PILL },
  { name: 'post39-l2', voice: 'calm', want: 'narrator', say: 'do you know what A.G.I. means?' },
  { name: 'post39-l3', voice: 'human', want: 'human', say: 'surprise surprise, mother fucker.' },
];
const TAKES = [];
for (const L of LINES) {
  const cached = path.join(VOICE_OUT, L.name + '-' + L.voice + '.json');
  let got = null;
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === L.say && j.provider === 'elevenlabs' && j.elevenId === L.want && fs.existsSync(j.file)) got = j;
  }
  if (!got) {
    try { got = await speak(L.say, { voice: L.voice, name: L.name }); }
    catch (e) { console.error('\nSTOPPED. elevenlabs failed on ' + L.name + ': ' + (e && e.message || e)); process.exit(1); }
  }
  if (got.provider !== 'elevenlabs' || got.elevenId !== L.want) { console.error('\nSTOPPED. ' + L.name + ' came back from ' + got.provider + ', and this clip is elevenlabs or nothing.'); process.exit(1); }
  const pcm = decode(ffmpeg, got.file);
  TAKES.push({ ...L, text: L.say, file: got.file, pcm, edge: audioEdges(pcm), words: got.words, timing: got.timing });
}
const TAKE = TAKES[0];
const placeTake = (T, at) => { T.at = +at.toFixed(4); T.end = +(at + T.edge.end - T.edge.start).toFixed(4); };

/* ---------- the bleep: only the fuck of the one word, off the engine timings ----------
   the timings are per word, so the word's start is where the bleep starts. its
   end box is not usable: the alignment runs the last word on through the full
   stop and the silence after it. so the end of fuck is found in the audio: the
   vowel's peak, the drop into the k closure, and the first sustained rise after
   it, which is the er. the bleep stops there, so mother and the er stay clear. */
const BLEEP = (() => {
  const T = TAKES[2];
  if (T.timing !== 'engine') { console.error('\nSTOPPED. the spider line has no engine word timings, and the bleep is cut on them.'); process.exit(1); }
  const w = T.words.find(x => /fuck/i.test(x.word));
  if (!w) { console.error('\nSTOPPED. no word with fuck in it in the spider line timings.'); process.exit(1); }
  const W = Math.round(0.010 * SR);
  const db = t => { const a = Math.round(t * SR); let e = 0; for (let i = a; i < a + W && i < T.pcm.length; i++) e += T.pcm[i] * T.pcm[i]; return 10 * Math.log10(e / W + 1e-12); };
  let peak = { t: w.start, v: -120 };
  for (let t = w.start; t < w.start + 0.20; t += 0.005) { const v = db(t); if (v > peak.v) peak = { t, v }; }
  let drop = null, rise = null;
  for (let t = peak.t; t < Math.min(w.end, T.edge.end); t += 0.005) {
    if (drop == null) { if (db(t) < peak.v - 15) drop = t; continue; }
    if (t > drop + 0.02 && db(t) > peak.v - 14 && db(t + 0.01) > peak.v - 14) { rise = t; break; }
  }
  if (drop == null || rise == null) { console.error('\nSTOPPED. the k closure in ' + w.word + ' was not found, and the bleep is not guessed.'); process.exit(1); }
  const b0 = w.start - 0.015, b1 = rise - 0.005;
  let rms = 0, n = 0;
  for (let i = Math.round(b0 * SR); i < Math.round(b1 * SR); i++) { rms += T.pcm[i] * T.pcm[i]; n++; }
  return { word: w.word, w0: w.start, w1: Math.min(w.end, T.edge.end), er: +rise.toFixed(4), b0: +b0.toFixed(4), b1: +b1.toFixed(4), amp: Math.sqrt(rms / Math.max(1, n)) * Math.SQRT2 * 0.9 };
})();

/* ---------- where everything sits, in css px of the 540x960 stage ---------- */
const SIZE = 148;
const UNIT = SIZE / GRID;
const MID = { x: VW / 2, y: 650 };
const HOME = { left: +(MID.x - SIZE / 2).toFixed(2), top: +(MID.y - SIZE / 2).toFixed(2), size: SIZE };
const PLATE = {
  cx: HOME.left + (HEAD.plate.x + HEAD.plate.s / 2) * UNIT,
  cy: HOME.top + (HEAD.plate.y + HEAD.plate.s / 2) * UNIT,
  r: HEAD.plate.s / 2 * UNIT,
};
/* the wall: the sign on the left, the calendar beside it, one row */
const SGN = { l: 64, t: 240, w: 240, h: 140, textW: 196 };
const CAL = { l: 332, t: 230, w: 144, bar: 24, page: 140, yearW: 104 };
CAL.cx = CAL.l + CAL.w / 2; CAL.cy = CAL.t + CAL.bar + CAL.page / 2;

/* ---------- the clock ---------- */
/* three tears, each quicker and sooner than the one before */
const FLIPS = [
  { at: 1.00, tug: 0.30, fall: 1.90, sway: 38, spin: 22, seed: 3 },
  { at: 2.55, tug: 0.20, fall: 1.80, sway: -34, spin: -26, seed: 7 },
  { at: 3.60, tug: 0.12, fall: 1.70, sway: 30, spin: 30, seed: 11 },
];
const LANDED_2026 = FLIPS[2].at + FLIPS[2].tug;
/* the sign: a flicker, a shuffle, and every letter back where it was */
const SH = { flick: 5.50, shuffle: 5.66, resolve: 5.86, per: 0.024, settle: 0.18 };
/* the look: the eyes slide to the lens, then one slow blink, then the bubble */
const LOOK = { at: 5.95, for: 0.30 };
const BLINKS = [
  /* normal, then each one slower, and the last one a long heavy one */
  { at: 1.55, close: 0.07, hold: 0.03, open: 0.12 },
  { at: 2.45, close: 0.12, hold: 0.06, open: 0.18 },
  { at: 3.40, close: 0.17, hold: 0.11, open: 0.25 },
  { at: 4.62, close: 0.24, hold: 0.17, open: 0.34 },
  /* the one slow blink at the lens */
  { at: 6.20, close: 0.20, hold: 0.10, open: 0.28 },
];
/* the lids rest a little lower as the years go, and never past a fifth */
const DROOP = { from: 1.3, to: 5.3, max: 0.15 };
const BUB = {
  size: 24, weight: 600, padX: 18, padY: 10, lh: 1.25, angle: -122,
  gap: 9, d0: 9, d1: 13,
  step: 0.07, pillFor: 0.34, from: 0.55, outStep: 0.05, outFor: 0.15, outFrom: 0.86,
};
const SAY = 6.30;
const LINE_AT = +(SAY + 2 * BUB.step + 0.04).toFixed(4);
placeTake(TAKE, LINE_AT);
const SAY_OUT = +(TAKE.end + 0.10).toFixed(4);
const BUB_GONE = +(SAY_OUT + 2 * BUB.outStep + BUB.outFor).toFixed(4);
/* the ask: his second bubble as soon as the first is gone */
const SAY2 = +(BUB_GONE + 0.04).toFixed(4);
placeTake(TAKES[1], SAY2 + 2 * BUB.step + 0.04);
const SAY2_OUT = +(TAKES[1].end + 0.10).toFixed(4);
const BUB2_GONE = +(SAY2_OUT + 2 * BUB.outStep + BUB.outFor).toFixed(4);
/* the jump: off his head once the ask bubble is gone, a squat, a spring up in
   front of his face to about the size of his head, the sign pops on the thread,
   and the spider's line. big for a moment, then he settles to half of that. */
const JUMP = { at: BUB2_GONE, squat: 0.10, fly: 0.34, big: 5.6, after: 3.0, pos: { x: 344, y: 574 } };
JUMP.lands = +(JUMP.at + JUMP.squat + JUMP.fly).toFixed(4);
const TAGPOP = { at: +(JUMP.lands - 0.02).toFixed(4), for: 0.32 };
placeTake(TAKES[2], JUMP.lands + 0.05);
JUMP.shrink = +(TAKES[2].end + 0.02).toFixed(4);
/* his eyes: to the spider on the jump, to the lens after its line, one slow blink */
const LOOK2 = { spider: +(JUMP.at + 0.04).toFixed(4), lens: +(TAKES[2].end + 0.05).toFixed(4), for: 0.28 };
BLINKS.push({ at: +(LOOK2.lens + LOOK2.for + 0.02).toFixed(4), close: 0.20, hold: 0.10, open: 0.28 });
const LAST_BLINK = BLINKS[BLINKS.length - 1];
const CUT = +(LAST_BLINK.at + LAST_BLINK.close + LAST_BLINK.hold + LAST_BLINK.open + 0.08 + 0.40).toFixed(4);
const END_HOLD = 1.00;
const SECONDS = +(CUT + END_HOLD).toFixed(4);
const GL = {
  offsets: [{ d: 0.40, for: 2 / 60, heat: 0.75 }, { d: 0.25, for: 3 / 60, heat: 1.0 }, { d: 0.12, for: 3 / 60, heat: 1.0 }, { d: 0, for: 2 / 60, heat: 0.45, residue: true }],
  jumpX: 22, jumpY: 12, split: 11, slices: 3, sliceH: [24, 110], sliceDx: 70,
};
GL.bursts = GL.offsets.map(o => ({ t: +(CUT - o.d).toFixed(4), for: o.for, heat: o.heat, residue: !!o.residue }));
const WM1 = { at: CUT, for: 0.09 };
const CRF = 17;

/* ---------- the rig ---------- */
const SEED = 1;
const plan = planMascot({ hands: false, seconds: 14, theme: 'dark', size: SIZE, bias: 0, seed: SEED, marks: [{ t: 0.0, state: 'neutral' }] });
plan.box = { ...HOME };

/* ---------- the bubble: over his head, post38's geometry ---------- */
BUB.h = +(BUB.size * BUB.lh + 2 * BUB.padY + 2 * BUBBLE.stroke).toFixed(2);
BUB.r0 = +(PLATE.r + BUB.gap + BUB.d0 / 2).toFixed(4);
BUB.r1 = +(BUB.r0 + BUB.d0 / 2 + BUB.gap + BUB.d1 / 2).toFixed(4);
BUB.r2 = +(BUB.r1 + BUB.d1 / 2 + BUB.gap).toFixed(4);
BUB.c0x = +(PLATE.cx + BUB.r0 * Math.cos(BUB.angle * DEG)).toFixed(2);
BUB.c0y = +(PLATE.cy + BUB.r0 * Math.sin(BUB.angle * DEG)).toFixed(2);
BUB.c1x = +(PLATE.cx + BUB.r1 * Math.cos(BUB.angle * DEG)).toFixed(2);
BUB.c1y = +(PLATE.cy + BUB.r1 * Math.sin(BUB.angle * DEG)).toFixed(2);
BUB.py = +(PLATE.cy + BUB.r2 * Math.sin(BUB.angle * DEG)).toFixed(2);

/* ==========================================================================
   the web: one hub up in the corner, frame threads out to the walls and the
   sign, a spiral, and last one long thread down onto his head
   ========================================================================== */
const HUB = { x: 468, y: 96 };
/* the spider: he spins the dropline on the way down, lands on the head, walks
   a few px along the rim and sits there to the end. sizes in css px; the legs
   span about one of the mascot's eyes. */
const SPIDER = {
  drop: 3.00, dropFor: 1.05, walkFor: 0.62, walkGap: 0.10,
  sitDeg: -62, body: 5.5, raise: 5.0, scale: 1.6,
  hip: [-1.6, -0.3, 1.0, 2.2], up: [-52, -24, 6, 32], lo: [62, 78, 94, 110], L1: 6.6, L2: 7.4,
};
SPIDER.land = +(SPIDER.drop + SPIDER.dropFor).toFixed(4);
SPIDER.walkAt = +(SPIDER.land + SPIDER.walkGap).toFixed(4);
SPIDER.sat = +(SPIDER.walkAt + SPIDER.walkFor).toFixed(4);
/* the look: once, up at him after he lands, then back to the calendar */
const SPLOOK = { at: SPIDER.land + 0.02, in: 0.20, back: 4.52, out: 0.30 };
const GAP_X = +((SGN.l + SGN.w + CAL.l) / 2).toFixed(2);
const HEAD_PT = { x: GAP_X, y: +(PLATE.cy - Math.sqrt(PLATE.r * PLATE.r - (GAP_X - PLATE.cx) ** 2) + 1.5).toFixed(2) };
const TOP_A = { x: 296, y: -6 };
const DROP = { x: GAP_X, y: +(HUB.y + (TOP_A.y - HUB.y) * (HUB.x - GAP_X) / (HUB.x - TOP_A.x)).toFixed(2) };
const ANCH = [
  { x: 546, y: -6 }, { x: 400, y: -6 }, TOP_A, { x: 546, y: 118 }, { x: 546, y: 196 }, { x: CAL.l + CAL.w - 30, y: CAL.t - 1 },
];
function polyShape(pts) {
  let d = 'M' + pts[0].x.toFixed(2) + ' ' + pts[0].y.toFixed(2), len = 0;
  for (let i = 1; i < pts.length; i++) { d += 'L' + pts[i].x.toFixed(2) + ' ' + pts[i].y.toFixed(2); len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); }
  return { d, len };
}
/* a thread between two points that sags a hair toward the hub, as a polyline
   so the kit's trim has an exact length */
function sagShape(a, b, sag) {
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const k = i / 8, x = lerp(a.x, b.x, k), y = lerp(a.y, b.y, k), s = Math.sin(Math.PI * k) * sag;
    const dx = HUB.x - x, dy = HUB.y - y, dl = Math.hypot(dx, dy) || 1;
    pts.push({ x: x + dx / dl * s, y: y + dy / dl * s });
  }
  return polyShape(pts);
}
const WEB = (() => {
  const threads = [];
  /* the frame threads, corner first, and outward */
  const rays = ANCH.map(p => ({ ...p, a: Math.atan2(p.y - HUB.y, p.x - HUB.x), L: Math.hypot(p.x - HUB.x, p.y - HUB.y) }));
  rays.sort((p, q) => p.a - q.a);
  let t = 1.10;
  const order = [...rays].sort((p, q) => Math.hypot(VW - p.x, p.y) - Math.hypot(VW - q.x, q.y));
  for (const r of order) { threads.push({ shape: polyShape([HUB, r]), t0: t, dur: 0.34 }); t += 0.14; }
  /* the spiral, ring by ring from the middle out, only as far as the
     shortest thread in each gap reaches */
  const RINGS = [12, 21, 31, 42, 54, 67, 81];
  t = 1.95;
  for (const R of RINGS) {
    for (let i = 0; i < rays.length; i++) {
      const p = rays[i], q = rays[(i + 1) % rays.length];
      let da = q.a - p.a; if (da <= 0) da += 2 * Math.PI;
      if (da > Math.PI * 0.9) continue;
      if (R > p.L - 6 || R > q.L - 6) continue;
      const A = { x: HUB.x + R * Math.cos(p.a), y: HUB.y + R * Math.sin(p.a) }, B = { x: HUB.x + R * Math.cos(q.a), y: HUB.y + R * Math.sin(q.a) };
      threads.push({ shape: sagShape(A, B, R * 0.08), t0: t, dur: 0.16 });
      t += 0.035;
    }
  }
  /* and the long one: a dropline off the top thread, straight down the gap
     between the sign and the calendar, onto his head. last and slowest. */
  threads.push({ shape: polyShape([DROP, HEAD_PT]), t0: SPIDER.drop, dur: SPIDER.dropFor, head: true });
  return threads.map((w, i) => ({ ...w, id: 'wb' + i }));
})();
const WEB_DONE = Math.max(...WEB.map(w => w.t0 + w.dur));
const DROP_ID = WEB.find(w => w.head).id;

/* ---------- the spider ---------- */
const SP_DESCENT = bezier(.4, 0, .2, 1);
const SP_A0 = Math.atan2(HEAD_PT.y - 1.5 - PLATE.cy, GAP_X - PLATE.cx);
const SP_A1 = SPIDER.sitDeg * DEG;
/* where his body sits on the rim at angle a, in the head's own resting frame */
const rimAt = a => ({ x: PLATE.cx + (PLATE.r + SPIDER.raise * SPIDER.scale) * Math.cos(a), y: PLATE.cy + (PLATE.r + SPIDER.raise * SPIDER.scale) * Math.sin(a), rot: a / DEG + 90 });
/* the head's transform, applied to a point in its resting frame */
function onCard(p, card) {
  const dx = (p.x - PLATE.cx) * card.sx, dy = (p.y - PLATE.cy) * card.sy, r = card.rot * DEG;
  return { x: PLATE.cx + card.x + dx * Math.cos(r) - dy * Math.sin(r), y: PLATE.cy + card.y + dx * Math.sin(r) + dy * Math.cos(r), rot: p.rot + card.rot };
}
/* the resting frame position, for the gaze, which cannot wait on the card */
function spiderRest(t) {
  if (t < SPIDER.land) {
    const k = SP_DESCENT(span(t, SPIDER.drop, SPIDER.land)), L = rimAt(SP_A0);
    return { x: lerp(DROP.x, L.x, k), y: lerp(DROP.y + SPIDER.body * SPIDER.scale, L.y, k), rot: L.rot * smooth(span(t, SPIDER.land - 0.22, SPIDER.land)) };
  }
  return rimAt(lerp(SP_A0, SP_A1, IO(span(t, SPIDER.walkAt, SPIDER.sat))));
}
function spiderAt(t, card) {
  if (t < SPIDER.drop) return null;
  const rest = spiderRest(t);
  /* on the way down he is in the room; from the last fifth of a second he is on
     the head, so its drift and tilt carry him without a jump */
  const w = smooth(span(t, SPIDER.land - 0.2, SPIDER.land));
  const on = onCard(rest, card);
  let p = { x: lerp(rest.x, on.x, w), y: lerp(rest.y, on.y, w), rot: lerp(rest.rot, on.rot, w) };
  let sc = SPIDER.scale, spread = 0, happy = 0;
  if (t >= JUMP.at) {
    /* a squat into his head, then the spring: an arc up and out to the spot in
       front of his face, growing on the site's spring curve as he comes */
    const q1 = span(t, JUMP.at, JUMP.at + JUMP.squat), q = span(t, JUMP.at + JUMP.squat, JUMP.lands);
    const dip = 2.5 * Math.sin(Math.PI * q1) * (q > 0 ? 0 : 1), r0 = on.rot * DEG;
    const base = { x: on.x - dip * Math.sin(r0), y: on.y + dip * Math.cos(r0) };
    const k = EASE(q);
    p = { x: lerp(base.x, JUMP.pos.x, k), y: lerp(base.y, JUMP.pos.y, k) - 46 * Math.sin(Math.PI * Math.min(1, q * 1.15)), rot: lerp(on.rot, 0, k) };
    sc = lerp(SPIDER.scale, JUMP.big, POP(q));
    sc = lerp(sc, JUMP.after, EASE(span(t, JUMP.shrink, JUMP.shrink + 0.34)));
    spread = EASE(q); happy = q >= 0.55 ? 1 : 0;
    /* alive while he talks: a small bounce on the thread */
    if (t >= TAKES[2].at && t < TAKES[2].end) p.y += 2.2 * Math.sin(2 * Math.PI * 4.2 * (t - TAKES[2].at));
  }
  /* the legs: a quick paddle on the way down, a faster step on the walk, and
     a slow small fidget sitting */
  const walking = t >= SPIDER.walkAt && t < SPIDER.sat;
  const flying = t >= JUMP.at && t < JUMP.lands;
  const amp = t < SPIDER.land ? 13 : walking ? 17 : flying ? 10 : t >= JUMP.at ? 5 : 3;
  const hz = t < SPIDER.land ? 7 : walking ? 11 : flying ? 9 : t >= JUMP.at ? 2.6 : 1.3;
  let d = '';
  for (const sgn of [-1, 1]) for (let i = 0; i < 4; i++) {
    const wig = amp * Math.sin(2 * Math.PI * hz * t + i * 1.7 + (sgn > 0 ? Math.PI / 2 : 0)) * DEG;
    const hx = sgn * SPIDER.body * 0.62, hy = SPIDER.hip[i];
    /* legs out: the uppers lift and the lowers open, the whole star wider */
    const ua = (SPIDER.up[i] - 16 * spread) * DEG + wig, la = (SPIDER.lo[i] - 22 * spread) * DEG + wig * 0.6;
    const kx = hx + sgn * SPIDER.L1 * Math.cos(ua), ky = hy + SPIDER.L1 * Math.sin(ua);
    const fx = kx + sgn * SPIDER.L2 * Math.cos(la), fy = ky + SPIDER.L2 * Math.sin(la);
    d += 'M' + hx.toFixed(2) + ' ' + hy.toFixed(2) + 'L' + kx.toFixed(2) + ' ' + ky.toFixed(2) + 'L' + fx.toFixed(2) + ' ' + fy.toFixed(2);
  }
  /* a small bob while he walks */
  const bob = walking ? 0.8 * Math.abs(Math.sin(2 * Math.PI * hz * t)) : 0;
  const r = p.rot * DEG;
  const top = { x: p.x + SPIDER.body * sc * Math.sin(r), y: p.y - bob - SPIDER.body * sc * Math.cos(r) };
  /* the sign rides the thread a little above him, and pops in */
  let tag = null;
  if (t >= TAGPOP.at) {
    const L = Math.hypot(top.x - DROP.x, top.y - DROP.y), up = 12;
    tag = { x: +(top.x + (DROP.x - top.x) * up / L).toFixed(2), y: +(top.y + (DROP.y - top.y) * up / L).toFixed(2), s: +lerp(0.3, 1, POP(span(t, TAGPOP.at, TAGPOP.at + TAGPOP.for))).toFixed(4), o: +span(t, TAGPOP.at, TAGPOP.at + 0.06).toFixed(3) };
  }
  return { x: +p.x.toFixed(2), y: +(p.y - bob).toFixed(2), rot: +p.rot.toFixed(2), sc: +sc.toFixed(4), happy, tag, legs: d, top, o: +span(t, SPIDER.drop, SPIDER.drop + 0.08).toFixed(3) };
}

/* ==========================================================================
   the dust: specks drifting down onto the top of his head and staying there,
   in grid units, drawn inside the card so they ride every move he makes
   ========================================================================== */
const DUST = (() => {
  const r = prng(0x39d5), out = [];
  const N = 64, C = HEAD.plate.x + HEAD.plate.s / 2, R = HEAD.plate.s / 2;
  for (let i = 0; i < N; i++) {
    /* more of it later: the arrival times bunch toward the end */
    const at = 1.6 + 3.5 * Math.pow(i / N, 0.8) + r() * 0.2;
    const x = C + (r() * 2 - 1) * 19 * Math.sqrt(r());
    const sz = 0.8 + r() * 0.8;
    const yLand = C - Math.sqrt(R * R - (x - C) * (x - C)) + sz * 0.45;
    out.push({ at, x, yLand, y0: -26 - r() * 20, fall: 1.1 + r() * 0.6, sway: (r() * 2 - 1) * 2.6, ph: r() * 6.28, sz: +sz.toFixed(3) });
  }
  return out;
})();
function dustAt(t) {
  return DUST.map(d => {
    if (t < d.at) return { o: 0, x: d.x, y: d.y0, land: 0 };
    const p = span(t, d.at, d.at + d.fall);
    const y = lerp(d.y0, d.yLand, p);
    const x = d.x + d.sway * Math.sin(d.ph + p * 5.5) * (1 - p);
    return { o: +Math.min(1, (t - d.at) / 0.15).toFixed(3), x: +x.toFixed(3), y: +y.toFixed(3), land: p >= 1 ? 1 : 0 };
  });
}

/* ---------- the calendar pages ---------- */
function pageAt(i, t) {
  /* page i is the one showing YEARS[i]; the last one never leaves */
  const F = FLIPS[i];
  if (!F || t < F.at) return { o: 1, x: 0, y: 0, rx: 0, rz: 0, sh: 1 };
  const u = t - F.at;
  if (u < F.tug) {
    /* the tug: the bottom edge lifts toward us and the page stretches off the
       binding, the top of it still held */
    const p = EASE(u / F.tug);
    return { o: 1, x: 0, y: 4 * p, rx: -30 * p, rz: F.spin * 0.12 * p, sh: 1 - 0.18 * p };
  }
  const q = (u - F.tug) / F.fall;
  if (q >= 1) return { o: 0, x: 0, y: 700, rx: 0, rz: 0, sh: 1 };
  /* the fall: gravity with a terminal speed, a sway that grows then settles,
     and a flutter on the tilt */
  const y = 4 + 470 * (Math.pow(q, 1.4) * 0.75 + q * 0.25);
  const x = 18 + 74 * q + Math.abs(F.sway) * 0.55 * Math.sin(q * 5.2 + (F.sway < 0 ? Math.PI : 0)) * Math.min(1, q * 3) + (F.sway < 0 ? 12 : 0);
  const rx = -30 + 26 * Math.sin(q * 8.5 + 0.4);
  const rz = F.spin * (0.12 + q) + 14 * Math.sin(q * 6.3);
  const pageY = CAL.t + CAL.bar + y + CAL.page / 2;
  const o = 1 - span(pageY, 660, 770);
  return { o: +o.toFixed(3), x: +x.toFixed(2), y: +y.toFixed(2), rx: +rx.toFixed(2), rz: +rz.toFixed(2), sh: +(0.72 + 0.28 * Math.abs(Math.cos(rx * DEG))).toFixed(3) };
}

/* ---------- the sign: steady, then the flicker and the shuffle ---------- */
const SIGN_CHARS = [...SIGN.join('\n')];
function signAt(t) {
  const chars = SIGN_CHARS.map(c => c);
  let o = 1, glow = +phosphor(t, 0.04, 2.7, 0.9, 0.6).toFixed(4);
  if (t >= SH.flick && t < SH.resolve + SH.per * SIGN_CHARS.length + SH.settle) {
    const bucket = Math.floor(t * 30), r = prng(0x51a9 ^ (bucket * 2654435761));
    if (t < SH.shuffle + 0.08) {
      /* the flicker: the light stutters like a sign about to change */
      const seq = [1, 0.25, 0.9, 0.12, 0.7, 1];
      o = seq[Math.min(seq.length - 1, Math.floor((t - SH.flick) / ((SH.shuffle + 0.08 - SH.flick) / seq.length)))];
    }
    let k = 0;
    for (let i = 0; i < chars.length; i++) {
      if (chars[i] === ' ' || chars[i] === '\n') continue;
      const lands = SH.resolve + k * SH.per;
      if (t >= SH.shuffle && t < lands) {
        const r2 = prng(0x77 + i * 131 ^ (Math.floor(t * 24) * 40503));
        chars[i] = SHUFFLE[Math.floor(r2() * SHUFFLE.length)];
      }
      k++;
    }
    const last = SH.resolve + SH.per * (k - 1);
    /* when the last letter is home the whole sign gives one bright settle */
    if (t >= last) glow *= 1 + 0.35 * (1 - smooth(span(t, last, last + SH.settle)));
    void r;
  }
  return { chars: chars.join(''), o, glow: +glow.toFixed(4) };
}

/* ---------- the eyes: the gaze, post25's, and the lids written outright ---------- */
const GAZE = { span: 150, max: 0.75, vspan: 200, vy: 3.4 };
const EYE_PAGE_Y = HOME.top + HEAD.eye.cy * UNIT;
const PL_R = HEAD.plate.s / 2, PL_CX = HEAD.plate.x + PL_R;
function eyeRoom(ey, halfW, halfH) {
  const top = HEAD.eye.cy + ey - halfH, bot = HEAD.eye.cy + ey + halfH;
  const PL_CY = HEAD.plate.y + PL_R;
  const dy = Math.max(Math.abs(top - PL_CY), Math.abs(bot - PL_CY));
  const half = dy >= PL_R ? 0 : Math.sqrt(PL_R * PL_R - dy * dy);
  return Math.max(0, half - TURN.margin - halfW);
}
function applyGaze(mas, g) {
  if (!g.q && !g.v) return;
  const aq = Math.abs(g.q), sgn = g.q < 0 ? -1 : 1, far = g.q >= 0 ? 1 : 0;
  for (let k = 0; k < 2; k++) {
    const e = mas.eyes[k];
    if (k === far) { e.sx *= 1 - TURN.farX * aq; e.sy *= 1 - TURN.farY * aq; }
    const want = e.x + sgn * aq * (k === far ? TURN.shift : TURN.shift + TURN.wrap);
    const ey = e.y + GAZE.vy * g.v;
    const from = EYE_CX[k] - PL_CX + want;
    const lim = eyeRoom(ey, HEAD.eye.w / 2 * Math.abs(e.sx), HEAD.eye.h / 2 * Math.abs(e.sy));
    e.x = +(want + (clamp(from, -lim, lim) - from)).toFixed(4);
    e.y = +ey.toFixed(4);
  }
  mas.card.rot = +(mas.card.rot + TURN.tilt * g.q).toFixed(4);
}
/* where he is looking: up at the calendar from the start, down after each
   page for a moment as it falls, and to the lens at the look */
function lookTarget(t) {
  let p = { x: CAL.cx, y: CAL.cy };
  for (let i = 0; i < FLIPS.length; i++) {
    const F = FLIPS[i], a = F.at + F.tug + 0.10, b = a + 0.75;
    const w = smooth(span(t, a, a + 0.22)) * (1 - smooth(span(t, b - 0.25, b)));
    if (w <= 0) continue;
    const pg = pageAt(i, Math.min(t, a + 0.45));
    const fp = { x: CAL.cx + pg.x, y: CAL.t + CAL.bar + pg.y + CAL.page / 2 };
    p = { x: lerp(p.x, fp.x, w), y: lerp(p.y, fp.y, w) };
  }
  const ws = smooth(span(t, SPLOOK.at, SPLOOK.at + SPLOOK.in)) * (1 - smooth(span(t, SPLOOK.back, SPLOOK.back + SPLOOK.out)));
  if (ws > 0) { const sp = spiderRest(t); p = { x: lerp(p.x, sp.x, ws), y: lerp(p.y, sp.y, ws) }; }
  return p;
}
function gazeAt(t) {
  const w2 = smooth(span(t, LOOK2.spider, LOOK2.spider + 0.24)) * (1 - IO(span(t, LOOK2.lens, LOOK2.lens + LOOK2.for)));
  if (w2 > 0) return {
    q: +(clamp((JUMP.pos.x - PLATE.cx) / GAZE.span, -1, 1) * GAZE.max * w2).toFixed(5),
    v: +(clamp((JUMP.pos.y - EYE_PAGE_Y) / GAZE.vspan, -1, 1) * w2).toFixed(5),
  };
  const on = smooth(span(t, 0.30, 0.62)) * (1 - IO(span(t, LOOK.at, LOOK.at + LOOK.for)));
  if (on <= 0) return { q: 0, v: 0 };
  const p = lookTarget(t);
  return {
    q: +(clamp((p.x - PLATE.cx) / GAZE.span, -1, 1) * GAZE.max * on).toFixed(5),
    v: +(clamp((p.y - EYE_PAGE_Y) / GAZE.vspan, -1, 1) * on).toFixed(5),
  };
}
function lidAt(t) {
  let v = DROOP.max * smooth(span(t, DROOP.from, DROOP.to));
  for (const B of BLINKS) {
    const c = B.at + B.close, h = c + B.hold;
    if (t < B.at || t >= h + B.open) continue;
    const b = t < c ? IO(span(t, B.at, c)) : t < h ? 1 : 1 - smooth(span(t, h, h + B.open));
    v = Math.max(v, b);
  }
  return +v.toFixed(4);
}
function compose(t) {
  const mas = mascotFrame(plan, t);
  applyGaze(mas, gazeAt(t));
  /* every lid in the clip is written here: the rig's idle blinks would land
     wherever its seed put them, and the brief is about when he blinks */
  const lid = lidAt(t);
  for (const e of mas.eyes) e.lid = lid;
  mas.shadow = { ...mas.shadow, o: 0 };
  return mas;
}

/* ---------- the bubble, post38's ---------- */
function pillPop(t, at, outAt) {
  const inP = span(t, at, at + BUB.pillFor), outP = span(t, outAt, outAt + BUB.outFor);
  if (t < at) return { o: 0, s: BUB.from };
  if (outP >= 1) return { o: 0, s: BUB.outFrom };
  return { o: +(span(t, at, at + 0.08) * (1 - outP)).toFixed(4),
    s: +(outP > 0 ? lerp(1, BUB.outFrom, smooth(outP)) : lerp(BUB.from, 1, POP(inP))).toFixed(4) };
}
const SAYS = [{ at: () => SAY, out: () => SAY_OUT, gone: () => BUB_GONE }, { at: () => SAY2, out: () => SAY2_OUT, gone: () => BUB2_GONE }];
function bubbleAt(t) {
  const k = SAYS.findIndex(x => t >= x.at() && t < x.gone());
  if (k < 0) return { k: t >= SAY2 ? 1 : 0, o: 0, dots: [{ o: 0, s: 0.4 }, { o: 0, s: 0.4 }], pill: { o: 0, s: BUB.from } };
  const a = SAYS[k].at(), out = SAYS[k].out();
  const d0 = pillPop(t, a, out + 2 * BUB.outStep), d1 = pillPop(t, a + BUB.step, out + BUB.outStep), pl = pillPop(t, a + 2 * BUB.step, out);
  return { k, o: Math.max(d0.o, d1.o, pl.o), dots: [d0, d1], pill: pl };
}

/* ---------- the glitch, post38's ---------- */
const GL_WINDOWS = GL.bursts.map((b, i) => ({ ...onGrid(b.t, b.for, FPS), heat: b.heat, residue: !!b.residue, seed: 0x5c1a + i * 977 }));
function glitchAt(f) {
  const g = { heat: 0, jx: 0, jy: 0, split: 0, slices: [] };
  const t = f / FPS;
  const w = GL_WINDOWS.find(x => t >= x.t0 - 1e-9 && t < x.t1 - 1e-9);
  if (!w) return g;
  const r = prng(w.seed ^ (f * 2654435761));
  g.heat = w.heat;
  g.jx = +((r() * 2 - 1) * GL.jumpX * w.heat).toFixed(1);
  g.jy = +((r() * 2 - 1) * GL.jumpY * w.heat).toFixed(1);
  g.split = +(w.heat * (3 + r() * (GL.split - 3))).toFixed(1);
  for (let i = 0; i < (w.residue ? 0 : GL.slices); i++) {
    const h = lerp(GL.sliceH[0], GL.sliceH[1], r());
    g.slices.push({ top: +(r() * (VH - h)).toFixed(1), h: +h.toFixed(1), dx: +((r() * 2 - 1) * GL.sliceDx * w.heat).toFixed(1) });
  }
  return g;
}

/* ---------- what one frame is ---------- */
let PILL_W = [200, 300];
function frameAt(t, f, mas) {
  const web = {};
  for (const w of WEB) Object.assign(web, trim(t, { id: w.id, shape: w.shape, t0: w.t0, dur: w.dur }));
  const sp = spiderAt(t, mas.card);
  if (sp) {
    web[DROP_ID] = { attr: { d: 'M' + DROP.x + ' ' + DROP.y + 'L' + sp.top.x.toFixed(2) + ' ' + sp.top.y.toFixed(2), 'stroke-dasharray': 'none', 'stroke-dashoffset': '0', opacity: '1' } };
    web['sp-g'] = { attr: { transform: 'translate(' + sp.x + ' ' + sp.y + ') rotate(' + sp.rot + ') scale(' + sp.sc + ')', opacity: String(sp.o) } };
    web['sp-legs'] = { attr: { d: sp.legs } };
    web['sp-legs-o'] = { attr: { d: sp.legs } };
    web['sp-dots'] = { attr: { opacity: sp.happy ? '0' : '1' } };
    web['sp-happy'] = { attr: { opacity: sp.happy ? '1' : '0' } };
    web['sp-tag'] = sp.tag ? { attr: { transform: 'translate(' + sp.tag.x + ' ' + sp.tag.y + ') scale(' + sp.tag.s + ')', opacity: String(sp.tag.o) } } : { attr: { opacity: '0' } };
  } else { web['sp-g'] = { attr: { opacity: '0' } }; web['sp-tag'] = { attr: { opacity: '0' } }; }
  return {
    t: +t.toFixed(4), f, mo: t < CUT ? 1 : 0,
    pages: YEARS.map((_, i) => pageAt(i, t)),
    sign: signAt(t),
    web, dust: dustAt(t),
    bub: (() => { const b = bubbleAt(t); return { ...b, w: PILL_W[b.k] }; })(),
    g: glitchAt(f),
    wm: { o: t >= WM1.at ? 1 : 0, sc: +(1 + (1 - EASE(span(t, WM1.at, WM1.at + WM1.for))) * 0.085).toFixed(4), glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4) },
  };
}

/* ========================================================================== */
/* the page                                                                   */
/* ========================================================================== */
function sceneHtml() {
  const brand = brandTokens();
  const mcss = mascotCss(plan);
  const tok = /\[data-theme=dark\] \.m-zone\{([^}]*)\}/.exec(mcss)[1];
  const tokens = ['face', 'eye', 'bub'].map(k => '--' + k + ':' + new RegExp('--' + k + ':\\s*([^;]+);').exec(tok)[1]).join(';');
  const chan = (id, row) => `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${row}"/></filter>`;
  const signSpans = SIGN.map((line, li) => '<span class="ln">' + [...line].map((c, ci) => {
    const idx = SIGN.slice(0, li).reduce((a, l) => a + l.length + 1, 0) + ci;
    return c === ' ' ? '<span class="sp"> </span>' : '<span class="ch" id="sc' + idx + '">' + c + '</span>';
  }).join('') + '</span>').join('');
  const perf = Array.from({ length: 11 }, (_, i) => '<i style="left:' + (8 + i * ((CAL.w - 16) / 10)).toFixed(1) + 'px"></i>').join('');
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post39</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Nunito:wght@600&display=swap">
<style>
:root{
${brand.light}
}
html[data-theme=dark]{
${brand.dark}
}
:root{
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  --display:"Michroma",var(--mono);
  --cap:"Nunito",var(--mono);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--cap)}
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;background:var(--bg);overflow:hidden}
.vignette{position:absolute;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 80% 60% at 50% 40%,rgba(255,255,255,.028) 0%,rgba(255,255,255,.009) 50%,rgba(0,0,0,0) 74%)}

/* ---- the sign: a plate on the wall, two lines, michroma ---- */
#sign{position:absolute;left:${SGN.l}px;top:${SGN.t}px;width:${SGN.w}px;height:${SGN.h}px;z-index:2;
  border:2px solid #2a3038;border-radius:6px;background:#0c0e12;display:flex;align-items:center;justify-content:center}
#sign-t{font-family:var(--display);font-weight:400;color:var(--fg);text-align:center;line-height:1.5;letter-spacing:.06em;
  text-shadow:0 0 8px rgba(255,255,255,.28),0 0 22px rgba(255,255,255,.12);filter:brightness(var(--sg-glow,1));opacity:var(--sg-o,1)}
#sign-t .ln{display:block;white-space:nowrap}
#sign-t .ch{display:inline-block;text-align:center}
#sign i{position:absolute;top:8px;width:5px;height:5px;border-radius:50%;background:#2a3038}

/* ---- the calendar: a binding bar with two rings, and the pages under it ---- */
#cal{position:absolute;left:${CAL.l}px;top:${CAL.t}px;width:${CAL.w}px;z-index:2}
#cal .bar{position:relative;height:${CAL.bar}px;background:#1f242b;border-radius:4px 4px 0 0;z-index:9}
#cal .bar b{position:absolute;top:-7px;width:8px;height:16px;border-radius:4px;border:2px solid #59606a;background:#06070a}
#cal .pages{position:relative;height:${CAL.page}px;perspective:520px}
#cal .pg{position:absolute;left:0;top:0;width:${CAL.w}px;height:${CAL.page}px;background:#e6e9e7;border-radius:0 0 4px 4px;
  transform-origin:50% 0;display:flex;align-items:center;justify-content:center;backface-visibility:visible;will-change:transform,opacity}
#cal .pg i{position:absolute;top:3px;width:4px;height:4px;border-radius:50%;background:#b9bebb}
#cal .pg span{font-family:var(--display);color:#0b0d10;letter-spacing:.02em}
#cal .pg em{position:absolute;left:14px;right:14px;bottom:18px;height:2px;background:#0b0d10;opacity:.14}
#cal .under{position:absolute;left:3px;right:3px;top:${CAL.page}px;height:4px;background:#b5bab7;border-radius:0 0 3px 3px}

/* ---- the web ---- */
#web{position:absolute;left:0;top:0;width:${VW}px;height:${VH}px;z-index:3;pointer-events:none;overflow:visible}
#spider{position:absolute;left:0;top:0;width:${VW}px;height:${VH}px;z-index:6;pointer-events:none;overflow:visible}

#mas-cut{position:absolute;inset:0;z-index:6;opacity:1}
${mcss}
.m-glow-mid{filter:blur(${GLOW.mid.blur}px)}
.m-glow-wide{filter:blur(${GLOW.wide.blur}px)}
#dust{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}

/* ---- the house thought bubble, post38's ---- */
.sb{${tokens};position:absolute;inset:0;z-index:7;pointer-events:none}
.sb i{position:absolute;display:block;border-radius:50%;background:var(--eye);border:${BUBBLE.stroke}px solid var(--bub);opacity:0;will-change:transform,opacity}
#sb-d0{left:${(BUB.c0x - BUB.d0 / 2).toFixed(2)}px;top:${(BUB.c0y - BUB.d0 / 2).toFixed(2)}px;width:${BUB.d0}px;height:${BUB.d0}px}
#sb-d1{left:${(BUB.c1x - BUB.d1 / 2).toFixed(2)}px;top:${(BUB.c1y - BUB.d1 / 2).toFixed(2)}px;width:${BUB.d1}px;height:${BUB.d1}px}
.sb .p{position:absolute;left:50%;top:${BUB.py}px;width:var(--pill-w,200px);height:${BUB.h}px;
  margin-left:calc(var(--pill-w,200px) / -2);margin-top:${-BUB.h}px;
  border:${BUBBLE.stroke}px solid var(--bub);border-radius:${BUBBLE.radius}px;background:var(--eye);
  transform-origin:var(--pill-ox,38%) 100%;opacity:0;will-change:transform,opacity}
.sb .p span{position:absolute;left:50%;top:${BUB.padY}px;transform:translateX(-50%);
  color:var(--face);font-family:var(--cap);font-weight:${BUB.weight};font-size:${BUB.size}px;
  line-height:${BUB.lh};letter-spacing:.005em;white-space:nowrap}

/* ---- the end card ---- */
.wm{position:absolute;left:50%;top:${VH / 2}px;transform:translate(-50%,-50%) scale(var(--wm-s,1));transform-origin:50% 50%;
  font-family:var(--display);font-weight:400;color:var(--fg);text-align:center;text-transform:uppercase;letter-spacing:.18em;
  line-height:${WM.lh};white-space:nowrap;text-indent:.09em;opacity:var(--wm-o,0);
  text-shadow:0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),0 0 66px rgba(255,255,255,.10);
  filter:brightness(var(--wm-glow,1));z-index:8}
.wm span{display:block}
#scene{position:absolute;inset:0}

/* ---- the glitch, post38's ---- */
.gl{position:absolute;inset:0;z-index:30;background:var(--bg);isolation:isolate;overflow:hidden;display:none}
.gl img{position:absolute;left:0;top:0;width:${VW}px;height:${VH}px;display:block;will-change:transform}
.gl .ch{mix-blend-mode:screen}
.gl .r{filter:url(#p39-r)}
.gl .g{filter:url(#p39-g)}
.gl .b{filter:url(#p39-b)}
.gl .sl{position:absolute;inset:0;overflow:hidden;clip-path:inset(var(--st,0px) 0 var(--sb,100%) 0)}
</style>
</head>
<body>
<div class="stage" id="stage">
  <div class="vignette" aria-hidden="true"></div>
  <div id="scene">
    <div id="sign"><i style="left:10px"></i><i style="right:10px"></i><div id="sign-t">${signSpans}</div></div>
    <div id="cal">
      <div class="bar"><b style="left:26px"></b><b style="right:26px"></b></div>
      <div class="pages">
        <div class="under"></div>
        ${YEARS.map((y, i) => `<div class="pg" id="pg${i}" style="z-index:${10 - i}">${perf}<span>${y}</span><em></em></div>`).reverse().join('\n        ')}
      </div>
    </div>
    <svg id="web" viewBox="0 0 ${VW} ${VH}" aria-hidden="true">
      ${WEB.map(w => pathMarkup(w.id, w.shape, 'rgba(206,212,218,.62)', w.head ? 1.5 : 1.3)).join('\n      ')}
    </svg>
    <div id="mas-cut">${mascotMarkup(plan)}</div>
    <svg id="spider" viewBox="0 0 ${VW} ${VH}" aria-hidden="true"><g id="sp-g" opacity="0">
      <path id="sp-legs-o" d="" fill="none" stroke="#d5dbd8" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round"/>
      <path id="sp-legs" d="" fill="none" stroke="#101318" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle r="${SPIDER.body}" fill="#101318" stroke="#d5dbd8" stroke-width="1.5"/>
      <g id="sp-dots"><circle cx="-2.1" cy="1.1" r="1.15" fill="#ffffff"/><circle cx="2.1" cy="1.1" r="1.15" fill="#ffffff"/></g>
      <path id="sp-happy" d="M-3.2 1.7Q-2.1 0.1 -1.0 1.7M1.0 1.7Q2.1 0.1 3.2 1.7" fill="none" stroke="#ffffff" stroke-width="0.75" stroke-linecap="round" opacity="0"/>
    </g>
    <g id="sp-tag" opacity="0"><rect x="-38" y="-30" width="76" height="30" rx="5" fill="#0c0e12" stroke="#d5dbd8" stroke-width="1.5"/>
      <text x="0" y="-9" text-anchor="middle" font-family="Michroma" font-size="17" letter-spacing="1.5" fill="#d5dbd8">${TAG}</text></g>
    </svg>
    <div class="sb" id="sb">
      <i id="sb-d0"></i><i id="sb-d1"></i>
      <span class="p" id="sb-p"><span id="pl0">${PILL}</span><span id="pl1" style="opacity:0">${ASK}</span></span>
    </div>
  </div>
  <div class="wm" id="wm">${WM.lines.map(l => '<span>' + l + '</span>').join('')}</div>
  <div class="gl" id="gl">
    <img class="ch r" id="gl-r" alt=""><img class="ch g" id="gl-g" alt=""><img class="ch b" id="gl-b" alt="">
    ${Array.from({ length: GL.slices }, (_, i) => '<div class="sl" id="sl' + i + '"><img id="sl' + i + 'i" alt=""></div>').join('\n    ')}
  </div>
  <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    ${chan('p39-r', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0')}
    ${chan('p39-g', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0')}
    ${chan('p39-b', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0')}
  </defs></svg>
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
window.__P39 = ${JSON.stringify({ VW, VH, WM, SLICES: GL.slices, PAD: BUB.padX, STROKE: BUBBLE.stroke, D1X: BUB.c1x, GRID, NDUST: DUST.length, DSZ: DUST.map(d => d.sz), SIGNW: SGN.textW, YEARW: CAL.yearW })};
${mascotRuntime()}
${motionApply.toString()}
(${scenePage.toString()})();
Promise.all([document.fonts.load('400 40px Michroma'), document.fonts.load('${BUB.weight} ${BUB.size}px Nunito')])
  .then(function () { return document.fonts.ready; })
  .then(function () { window.__built = Object.assign({}, window.__p39.fit(), { mas: window.__mas.build() }); });
</script>
</body>
</html>`;
}

function scenePage() {
  const P = window.__P39;
  const stage = document.getElementById('stage');
  const scene = document.getElementById('scene');
  const dots = [document.getElementById('sb-d0'), document.getElementById('sb-d1')];
  const pill = document.getElementById('sb-p');
  const text = document.getElementById('pl0');
  const text1 = document.getElementById('pl1');
  const signT = document.getElementById('sign-t');
  const wm = document.getElementById('wm');
  const gl = document.getElementById('gl');
  const pages = [0, 1, 2, 3].map(i => document.getElementById('pg' + i));
  const chans = ['r', 'g', 'b'].map(k => document.getElementById('gl-' + k));
  const slices = [], sliceImgs = [];
  for (let i = 0; i < P.SLICES; i++) { slices.push(document.getElementById('sl' + i)); sliceImgs.push(document.getElementById('sl' + i + 'i')); }
  const signChars = [].slice.call(signT.querySelectorAll('.ch'));
  let dust = [];
  const rg = el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
  window.__p39 = {
    fit() {
      wm.style.fontSize = '100px';
      let widest = 0;
      for (const sp of wm.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      wm.style.fontSize = (100 * P.WM.w / widest).toFixed(2) + 'px';
      /* the sign: the longer line to its width, and every letter frozen at its
         own width so the shuffle never moves a neighbour */
      signT.style.fontSize = '100px';
      let sw = 0;
      for (const ln of signT.querySelectorAll('.ln')) sw = Math.max(sw, ln.getBoundingClientRect().width);
      signT.style.fontSize = (100 * P.SIGNW / sw).toFixed(2) + 'px';
      for (const c of signChars) c.style.width = c.getBoundingClientRect().width.toFixed(2) + 'px';
      for (const pg of pages) {
        const s = pg.querySelector('span');
        s.style.fontSize = '100px';
        s.style.fontSize = (100 * P.YEARW / s.getBoundingClientRect().width).toFixed(2) + 'px';
      }
      /* the dust lives in the card, in grid units, so it rides his every move */
      const card = document.getElementById('m-card');
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('id', 'dust'); svg.setAttribute('viewBox', '0 0 ' + P.GRID + ' ' + P.GRID);
      for (let i = 0; i < P.NDUST; i++) {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('r', (P.DSZ[i] / 2).toFixed(3)); c.setAttribute('opacity', '0');
        svg.appendChild(c); dust.push(c);
      }
      card.appendChild(svg);
      return { pill: [+(rg(text).width + 2 * P.PAD + 2 * P.STROKE).toFixed(2), +(rg(text1).width + 2 * P.PAD + 2 * P.STROKE).toFixed(2)], sign: +parseFloat(signT.style.fontSize).toFixed(2) };
    },
    rect(sel) {
      const e = document.querySelector(sel);
      if (!e) return null;
      let o = 1;
      for (let n = e; n && n.nodeType === 1; n = n.parentElement) o *= +getComputedStyle(n).opacity;
      if (o < 0.01) return null;
      const r = e.getBoundingClientRect();
      return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width };
    },
    apply(o) {
      const s = stage.style;
      scene.style.opacity = o.mo ? 1 : 0;
      for (let i = 0; i < 4; i++) {
        const p = o.pages[i];
        pages[i].style.opacity = p.o;
        pages[i].style.transform = 'translate(' + p.x + 'px,' + p.y + 'px) rotateZ(' + p.rz + 'deg) rotateX(' + p.rx + 'deg)';
        pages[i].style.filter = p.sh < 1 ? 'brightness(' + p.sh + ')' : '';
      }
      let k = 0;
      for (const ch of o.sign.chars) { if (ch === ' ' || ch === '\n') continue; if (signChars[k].textContent !== ch) signChars[k].textContent = ch; k++; }
      signT.style.setProperty('--sg-o', o.sign.o);
      signT.style.setProperty('--sg-glow', o.sign.glow);
      motionApply(o.web);
      for (let i = 0; i < dust.length; i++) {
        const d = o.dust[i];
        dust[i].setAttribute('cx', d.x); dust[i].setAttribute('cy', d.y);
        dust[i].setAttribute('opacity', d.o);
        dust[i].setAttribute('fill', d.land ? '#5f656c' : '#c3c8cc');
      }
      for (let i = 0; i < 2; i++) {
        dots[i].style.opacity = o.bub.dots[i].o.toFixed(4);
        dots[i].style.transform = 'scale(' + o.bub.dots[i].s.toFixed(4) + ')';
      }
      pill.style.opacity = o.bub.pill.o.toFixed(4);
      text.style.opacity = o.bub.k ? 0 : 1; text1.style.opacity = o.bub.k ? 1 : 0;
      pill.style.setProperty('--pill-w', o.bub.w.toFixed(2) + 'px');
      const left = P.VW / 2 - o.bub.w / 2;
      const ox = Math.max(10, Math.min(o.bub.w - 10, P.D1X - left));
      pill.style.setProperty('--pill-ox', (ox / o.bub.w * 100).toFixed(2) + '%');
      pill.style.transform = 'scale(' + o.bub.pill.s.toFixed(4) + ')';
      s.setProperty('--wm-o', o.wm.o.toFixed(4));
      s.setProperty('--wm-s', o.wm.sc.toFixed(4));
      s.setProperty('--wm-glow', o.wm.glow.toFixed(4));
      gl.style.display = 'none';
    },
    glitch(src, g) {
      const imgs = chans.concat(sliceImgs);
      for (const im of imgs) im.src = src;
      return Promise.all(imgs.map(im => im.decode())).then(function () {
        chans[0].style.transform = 'translate(' + (g.jx - g.split).toFixed(1) + 'px,' + g.jy.toFixed(1) + 'px)';
        chans[1].style.transform = 'translate(' + g.jx.toFixed(1) + 'px,' + g.jy.toFixed(1) + 'px)';
        chans[2].style.transform = 'translate(' + (g.jx + g.split).toFixed(1) + 'px,' + g.jy.toFixed(1) + 'px)';
        for (let i = 0; i < slices.length; i++) {
          const sl = g.slices[i];
          if (!sl) { slices[i].style.display = 'none'; continue; }
          slices[i].style.display = 'block';
          slices[i].style.setProperty('--st', sl.top.toFixed(1) + 'px');
          slices[i].style.setProperty('--sb', (P.VH - sl.top - sl.h).toFixed(1) + 'px');
          sliceImgs[i].style.transform = 'translate(' + (g.jx + sl.dx).toFixed(1) + 'px,' + g.jy.toFixed(1) + 'px)';
        }
        gl.style.display = 'block';
        return true;
      });
    },
  };
}

function serve(html) {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(html); });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}
function injected() {
  const rafQ = [];
  let rafId = 1;
  window.requestAnimationFrame = function (cb) { rafQ.push({ id: rafId, cb: cb }); return rafId++; };
  window.cancelAnimationFrame = function (id) { const k = rafQ.findIndex(function (e) { return e.id === id; }); if (k > -1) rafQ.splice(k, 1); };
  window.__dmRaf = function (now) { const batch = rafQ.splice(0, rafQ.length); for (const e of batch) { try { e.cb(now); } catch (err) { } } return rafQ.length; };
}

/* ---------- the shutter, solved off the falling pages at sixty ---------- */
const fastest = (fn, a, b) => { let d = 0; for (let f = Math.ceil(a * 60); f < Math.ceil(b * 60); f++) d = Math.max(d, Math.abs(fn((f + 1) / 60) - fn(f / 60))); return +d.toFixed(2); };
const FASTEST = Math.max(...FLIPS.map((F, i) => fastest(t => pageAt(i, t).y, F.at, F.at + F.tug + F.fall)));
if (BLUR) { SUB = Math.max(2, Math.min(SUB_MAX, Math.ceil(FASTEST / SUB_STEP_WANT))); SUBSTEP = STEP / SUB; }

console.log('\npost39, agi next year. ' + SECONDS + 's, ' + FPS + 'fps, ' + (BLUR ? SUB + ' subframes' : 'shutter closed'));
for (const [t, what] of [[0, 'the wall, 2023'], ...FLIPS.map((F, i) => [F.at, 'tear, ' + YEARS[i + 1]]), [WEB[0].t0, 'the web starts'], [WEB_DONE, 'the web is on his head'],
  [SPIDER.drop, 'the spider starts down'], [SPIDER.land, 'the spider lands'], [SPIDER.sat, 'the spider sits'], [SH.flick, 'the sign flickers'], [SH.shuffle, 'the shuffle'], [LOOK.at, 'eyes to the lens'], [BLINKS[4].at, 'the slow blink'],
  [SAY, 'the bubble'], [TAKE.at, 'any day now (to ' + TAKE.end.toFixed(2) + ')'],
  [SAY2, 'the ask bubble'], [TAKES[1].at, ASK + ' (to ' + TAKES[1].end.toFixed(2) + ')'], [JUMP.at, 'the spider jumps'], [JUMP.lands, 'the spider is big, the sign pops'],
  [TAKES[2].at, 'surprise surprise, bleep ' + (TAKES[2].at + BLEEP.b0 - TAKES[2].edge.start).toFixed(2) + ' to ' + (TAKES[2].at + BLEEP.b1 - TAKES[2].edge.start).toFixed(2) + ' (to ' + TAKES[2].end.toFixed(2) + ')'],
  [LOOK2.lens, 'eyes to the lens'], [LAST_BLINK.at, 'the slow blink'], ...GL.bursts.map(b => [b.t, 'glitch']), [CUT, 'the wordmark']]) {
  console.log('    ' + t.toFixed(2).padStart(5) + 's  ' + what);
}

function ff(args, stderr = false) {
  if (!stderr) return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  const { spawnSync } = process.getBuiltinModule('node:child_process');
  return spawnSync(ffmpeg, args, { encoding: 'utf8' }).stderr;
}
/* ---------- the bus: the three reads and the bleep, to -14 ---------- */
const VTRACK = new Float32Array(Math.ceil((SECONDS + 0.5) * SR));
for (const T of TAKES) {
  if (T === TAKES[2]) {
    /* the word goes out and a clean 1 khz tone at its level goes in, with 5ms
       ramps on both so neither end clicks */
    const b0 = Math.round(BLEEP.b0 * SR), b1 = Math.round(BLEEP.b1 * SR), rmp = Math.round(0.005 * SR);
    for (let i = b0; i < b1 && i < T.pcm.length; i++) {
      const e = Math.min(1, (i - b0) / rmp, (b1 - i) / rmp);
      T.pcm[i] = T.pcm[i] * (1 - e) + BLEEP.amp * e * Math.sin(2 * Math.PI * 1000 * (i - b0) / SR);
    }
  }
  const a = Math.max(0, Math.round((T.edge.start - PRE) * SR)), b = Math.min(T.pcm.length, Math.round((T.edge.end + POST) * SR));
  const at = Math.round((T.at - T.edge.start) * SR), fade = Math.round(EDGE_FADE * SR);
  for (let i = a; i < b; i++) {
    const j = at + i;
    if (j < 0 || j >= VTRACK.length) continue;
    let g = 1;
    if (i - a < fade) g = (i - a) / fade; else if (b - i < fade) g = (b - i) / fade;
    VTRACK[j] += T.pcm[i] * g;
  }
}
const WAV = path.join(OUT, 'post39-mix.wav'), RAW = path.join(OUT, 'post39-mix-raw.wav');
fs.mkdirSync(OUT, { recursive: true });
const attempt = gdb => { const buf = Float32Array.from(VTRACK); applyGain(buf, gdb); const lim = limit(buf, SAMPLE_CEILING); writeWav(RAW, buf); return { g: gdb, lim, r: loudness(ffmpeg, RAW) }; };
let lo = -6, hi = 30, best = null;
for (let i = 0; i < 12; i++) {
  const a = attempt((lo + hi) / 2);
  const legal = a.lim.reduction <= MAX_REDUCTION;
  if (legal && (!best || Math.abs(a.r.lufs - TARGET_LUFS) < Math.abs(best.r.lufs - TARGET_LUFS))) best = a;
  if (!legal || a.r.lufs > TARGET_LUFS) hi = a.g; else lo = a.g;
}
if (!best) best = attempt(0);
{ const buf = Float32Array.from(VTRACK); applyGain(buf, best.g); limit(buf, SAMPLE_CEILING); writeWav(RAW, buf); }
const AAC_LOSS = 0.5;
{
  const m = ff(['-hide_banner', '-nostats', '-i', RAW, '-af', 'loudnorm=I=' + (TARGET_LUFS + AAC_LOSS) + ':TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], true);
  const j = JSON.parse(m.slice(m.lastIndexOf('{'), m.lastIndexOf('}') + 1));
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-i', RAW, '-af', 'loudnorm=I=' + (TARGET_LUFS + AAC_LOSS) + ':TP=-1.5:LRA=11:measured_I=' + j.input_i + ':measured_TP=' + j.input_tp
    + ':measured_LRA=' + j.input_lra + ':measured_thresh=' + j.input_thresh + ':offset=' + j.target_offset + ':linear=true', '-ar', String(SR), WAV]);
}
fs.rmSync(RAW, { force: true });

/* ========================================================================== */
/* render                                                                     */
/* ========================================================================== */
async function render() {
  if (!CHROME) throw new Error('no chrome found');
  for (const d of [FRAMES, SUBS]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  const N = Math.round(FPS * SECONDS);
  const { srv, port } = await serve(sceneHtml());
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none', '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio', '--run-all-compositor-stages-before-draw'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });
  await page.evaluateOnNewDocument(injected);
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  let expired = null;
  cdp.on('Emulation.virtualTimeBudgetExpired', () => { const f = expired; expired = null; if (f) f(); });
  const advance = async ms => { const p = new Promise(r => { expired = r; }); await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pauseIfNetworkFetchesPending', budget: ms }); await p; };
  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' });
  for (let i = 0; i < 400; i++) {
    const ok = await page.evaluate(() => !!(window.__built && window.__mas && window.__mas.ready && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  if (errors.length) throw new Error('the page threw: ' + errors.join(' | '));
  if (!await page.evaluate(() => !!window.__built)) throw new Error('the scene never became ready');
  for (const q of ['400 40px "Michroma"', BUB.weight + ' ' + BUB.size + 'px "Nunito"']) if (!await page.evaluate(x => document.fonts.check(x), q)) throw new Error(q + ' did not load');
  const built = await page.evaluate(() => window.__built);
  PILL_W = built.pill;
  if (Math.max(...PILL_W) > VW - 2 * FLOOR_CSS) throw new Error('the ask bubble is wider than the safe width');

  const put = async (t, f) => {
    const mas = compose(t);
    const o = frameAt(t, f, mas);
    await page.evaluate(fr => window.__mas.apply(fr), mas);
    await page.evaluate(fr => window.__p39.apply(fr), o);
    if (o.g.heat > 0) {
      const clean = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
      if (!await page.evaluate((src, g) => window.__p39.glitch(src, g), 'data:image/png;base64,' + clean.data, o.g)) throw new Error('the glitch image did not decode at ' + t);
    }
    return o;
  };

  /* the margin and the app zone: everything a viewer reads, every tenth of a second */
  const fails = [];
  const SB = { l: FLOOR_CSS, t: FLOOR_CSS, r: VW - FLOOR_CSS, b: VH - APP_ZONE };
  for (let t = 0; t < CUT - 0.05; t += 0.1) {
    await put(t, Math.round(t * FPS));
    for (const sel of ['#sign', '#cal .bar', '#pg3', '#sb-p', '#sb-d1', '#m-card', '#sp-tag']) {
      const r = await page.evaluate(s => window.__p39.rect(s), sel);
      if (!r || !r.w) continue;
      if (r.l < SB.l - 0.5 || r.t < SB.t - 0.5 || r.r > SB.r + 0.5 || r.b > SB.b + 0.5) fails.push(sel + ' at ' + t.toFixed(1) + 's: ' + [r.l, r.t, r.r, r.b].map(v => v.toFixed(1)).join(' / '));
    }
    if (t >= SPIDER.land) {
      const sr = await page.evaluate(() => { const r = document.getElementById('sp-g').getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; });
      if (sr.l < SB.l || sr.r > SB.r || sr.t < SB.t || sr.b > SB.b) fails.push('the spider is past the margin at ' + t.toFixed(1));
      for (const q of ['#sb-p', '#sb-d0', '#sb-d1']) {
        const b = await page.evaluate(x => window.__p39.rect(x), q);
        if (b && b.w && b.l < sr.r && sr.l < b.r && b.t < sr.b && sr.t < b.b) { fails.push('the spider is under the bubble at ' + t.toFixed(1)); break; }
      }
    }
    const p = await page.evaluate(() => window.__p39.rect('#sb-p')), c = await page.evaluate(() => window.__p39.rect('#cal'));
    if (p && c && p.l < c.r && c.l < p.r && p.t < c.b && c.t < p.b) fails.push('the bubble overlaps the calendar at ' + t.toFixed(1) + 's');
  }
  await put(CUT + 0.3, Math.round((CUT + 0.3) * FPS));
  const wr = await page.evaluate(() => window.__p39.rect('#wm'));
  if (wr && (wr.l < SB.l || wr.r > SB.r)) fails.push('the wordmark is past the margin');

  const wall = Date.now();
  let glitched = 0;
  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB) * SHUTTER;
      const o = await put(t, f);
      if (k === 0 && o.g.heat > 0) glitched++;
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);
      const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 94, clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
      fs.writeFileSync(SUB > 1 ? path.join(SUBS, 's' + String(idx).padStart(6, '0') + '.jpg') : path.join(FRAMES, 'f' + String(f).padStart(5, '0') + '.jpg'), Buffer.from(shot.data, 'base64'));
      await advance(SUBSTEP);
    }
    if (f % Math.round(FPS * 2) === 0) console.log('  ' + String(f).padStart(4) + '/' + N + '  ' + ((Date.now() - wall) / 1000).toFixed(0) + 's');
  }
  if (errors.length) throw new Error('the page threw while rendering: ' + errors.join(' | '));
  await browser.close();
  srv.close();
  if (SUB > 1) ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS * SUB), '-i', path.join(SUBS, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1) + ',setpts=PTS-STARTPTS,framestep=' + SUB, '-q:v', '2', path.join(FRAMES, 'f%05d.jpg')]);
  return { frames: N, glitched, fails };
}

const state = await render();
const FILE = path.join(OUT, 'post39-dark-1080x1920.mp4');
ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'), '-i', WAV,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', FILE]);
/* the aac offset is measured on this clip rather than assumed: a steady tone
   encodes differently from speech, so the mp4 is read and, if it is off, the
   wav is re-aimed by the error and the audio alone is put back in */
for (let i = 0; i < 2; i++) {
  const got = loudness(ffmpeg, FILE);
  if (!got || !got.ok || Math.abs(got.lufs - TARGET_LUFS) <= 0.2) break;
  const fixed = path.join(OUT, 'post39-mix-fix.wav'), tmp = path.join(OUT, 'post39-tmp.mp4');
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-i', WAV, '-af', 'volume=' + (TARGET_LUFS - got.lufs).toFixed(2) + 'dB', fixed]);
  fs.renameSync(fixed, WAV);
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-i', FILE, '-i', WAV, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', tmp]);
  fs.renameSync(tmp, FILE);
}
if (!KEEP) { fs.rmSync(FRAMES, { recursive: true, force: true }); fs.rmSync(SUBS, { recursive: true, force: true }); }

/* ---------- the critique sheets: a frame every half second, six across ---------- */
fs.mkdirSync(VERIFY, { recursive: true });
const rows = Math.ceil(Math.floor(SECONDS * 2) / 6);
ff(['-y', '-hide_banner', '-loglevel', 'error', '-i', FILE, '-vf', 'fps=2,scale=270:-2,tile=6x' + rows + ':padding=4:color=0x303030', '-frames:v', '1', path.join(VERIFY, 'contact.png')]);
ff(['-y', '-hide_banner', '-loglevel', 'error', '-i', FILE, '-vf', 'fps=2,scale=360:-2,tile=6x' + rows, '-frames:v', '1', path.join(VERIFY, 'phone.png')]);

/* ---------- the guards ---------- */
let probe = '';
try { execFileSync(ffmpeg, ['-hide_banner', '-i', FILE], { stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { probe = (e.stderr || '').toString(); }
const dur = probe.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
const seconds = dur ? +dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3]) : 0;
const fail = [...state.fails];
if (!/1080x1920/.test(probe)) fail.push('the file is not 1080x1920');
if (Math.abs(seconds - SECONDS) > 0.15) fail.push('the file runs ' + seconds.toFixed(2) + 's, not ' + SECONDS);
if (!/Audio:/.test(probe)) fail.push('the file has no audio track');
if (BLEEP.b1 >= BLEEP.er) fail.push('the bleep runs into the er');
if (BLEEP.er >= BLEEP.w1 - 0.04) fail.push('the er is not clear before the line ends');
if (BLEEP.b1 - BLEEP.b0 < 0.10) fail.push('the bleep is too short to cover the word');
if (TAKES[2].at < BUB2_GONE) fail.push('the spider talks before the ask bubble is gone');
if (signAt(SH.resolve + 1).chars !== SIGN.join('\n')) fail.push('the sign does not land back on its own words');
for (let f = 0; f < CUT * 60; f++) if (signAt(f / 60).chars.replace(/\s/g, '').length !== SIGN.join('').replace(/\s/g, '').length) { fail.push('the sign changes length at ' + (f / 60).toFixed(2)); break; }
/* the happy arcs are never used; the lids never shut for longer than the heavy blink */
for (let f = 0, run = 0; f < CUT * 60; f++) { run = lidAt(f / 60) >= 0.98 ? run + 1 : 0; if (run / 60 > 0.4) { fail.push('the eyes are shut too long at ' + (f / 60).toFixed(2)); break; } }
const lu = loudness(ffmpeg, FILE);
if (!lu || !lu.ok) fail.push('the loudness could not be measured');
else if (Math.abs(lu.lufs - TARGET_LUFS) > 0.5) fail.push('the bus is ' + lu.lufs + ' LUFS, not ' + TARGET_LUFS);
console.log('\n  loudness ' + (lu && lu.lufs) + ' LUFS integrated, true peak ' + (lu && lu.truePeak) + ' dBFS, on the mp4');
console.log('  ' + state.glitched + ' glitched frames, sheets in ' + path.relative(ROOT, VERIFY));
console.log('  length ' + seconds.toFixed(2) + 's, three reads and one bleep on the bus, ' + path.relative(ROOT, FILE));
if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('  guards: all green');
