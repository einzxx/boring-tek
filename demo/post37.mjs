/* the boring tek — post37. what should we make next.

   dark only, 1080x1920. three lines in the narrator's voice, a bug that walks
   in and gets eaten, a green puff, and the wordmark.

   **the clock is the read's.** past the pop there is not one typed beat time
   in this file: a line starts AFTER_LINE after the one before it stops making
   noise, a bubble pops on the frame its own sentence starts, the bug walks in
   on the line about the bug, and the end card comes AFTER_READ after the last
   word. `SECONDS` is whatever that adds up to. the only fixed lengths are the
   pop, post25's eating and the puff.

     the pop         he comes up from under the bottom edge to the middle of
                     the frame on the rise.
     line one        `we made two free tools. what should we make next.`
                     two bubbles, one a sentence.
     line two        `or maybe we need to fix some bug for you.` one bubble,
                     and the bug walks in over the top edge on the first
                     frame of it, around his left and along the floor to a
                     stop under him. his eyes follow it the whole way.
     the eating      post25's, whole: the rise, the lunge, the contact, three
                     chews and the bob, on one transform on `#m-zone`.
     the puff        post25's six soft fields in the accent, out from under
                     him and away to one side, on the sputter. the eyes
                     squint, and that is the only squint in the film.
     line three      `maybe fresh air. or you have a better idea. do not be
                     shy, share it.` three bubbles, one a sentence.
     the cut         three short bursts of a frame jump, torn slices and a
                     colour split, and a residue on the first end card frame.
                     no flash.
     the end card    the wordmark alone in the middle of the frame, michroma.

   ---------- fix round two: there is no pacman ----------
   the wedge clip, the chomp table, the hub's polygons and every guard about
   them are gone. **the eating is post25's**, which is post15's: one transform
   on `#m-zone`, which `lib/mascot.mjs` writes nothing to — he rises, lunges,
   lands with a volume preserving squash, comes back up, chews three times
   with the side alternating, and bobs. the bug is switched off on the frame
   his ink covers it, and how deep the lunge has to go to make that true is
   **walked rather than typed**: down in half pixel steps until his drawn
   ellipse contains every corner of the bug's drawn ink on the contact frame,
   then the middle of the admissible range.

   **the bug is post25's asset, walk, tripod gait and knees, unchanged.** the
   table, the arclength driven gait, the planted foot, the two bone knee on the
   outside, the seeded antennae and the curved lane are copied across with one
   thing rebuilt: the lane is derived off *this* clip's plate, so his size and
   the bug's scale decide it the way they did there.

   ---------- the sound ----------
   the voice is the elevenlabs narrator, and under it two things and nothing
   else: **one tick a footstep**, read off the walk rather than laid on a grid,
   so as the bug decelerates the last few spread out and stop on their own; and
   **the sputter on the puff**, `FART.sputter` at the house's own `fart` level.
   the ticks stop when the walk does, which is before the bite, so there is
   nothing at all on the bus between the last footstep and the sputter — no
   crunch on the bite or the chews, because einz is putting his own there. the
   two sit under the read through `mixdown`'s duck, and a guard measures the
   bus against the voice rather than trusting the levels.

   ---------- the eyes are alive the whole way through ----------
   open and normal nearly all of it, and what they do is look at things: at the
   bug for the whole of its walk, at the pill whenever one is up, at the lens
   otherwise. the looking is post25's gaze — the module's own `TURN` table, its
   `EYE_CX`, its `headSD` and its own clamp — driven per frame by where the
   thing being looked at actually is, which no mark can express. the module's
   idle blinks run underneath it untouched.

   three things are written on top, all one directional:
   **the happy arcs**, delighted's own numbers, twice and briefly — 0.55s on
   the first bubble and 0.55s on the last, and a guard fails if any run of them
   reaches 0.6s.
   **the eating's shut**, post25's: hold a lid down for a second and the face
   is not a face with its eyes closed, it is a face with no eyes, so the eye is
   squashed to a quarter of its height instead and a thin bar of the same ink
   stays on the plate.
   **the squint**, on the puff and nowhere else.
   nothing widens them, and no state in the plan does either: the plan is one
   neutral mark.

   ---------- the bubbles are the house thought bubble ----------
   two dots climbing off his rim toward a pill, which is index.html's own and
   the module's own: the pill is `--eye` filled with a `--bub` hairline and
   `--face` text, read off the module's css rather than typed again, and the
   two dots are the tail pointing back at him. **one bubble a line, popping in
   and popping out** — the dots first and the pill behind them, and out the
   other way round. nothing crossfades.

   **the pill sits above him rather than off his side, and that is measured.**
   a pill at his side starts past the dots at his rim, which leaves 137 css px
   before the safe line, and the shortest of the six lines is 197. so every one
   of them goes over his head with the tail still on it, and the file says so
   at run time rather than asserting it here.

   ---------- the rest ----------
   the glow stays the house's css px at every size. the glitch is the clean
   frame captured, handed back to the page, split into channels and screen
   blended with the red and the blue slid apart, three torn slices over that,
   the whole thing jumped. a glitch frame is a pure function of time, twice.

     node post37.mjs                     1080x1920, 60fps, shutter open, solved
     DEMO_FPS=12 node post37.mjs         the fast preview pass
     node post37.mjs --voice             the read and the clock only, no browser
     node post37.mjs --no-blur           shutter closed
     node post37.mjs --blur=N            N subframes rather than the solved count
     node post37.mjs --keep-frames       leave the jpegs on disk
     node post37.mjs --encode-only       re-encode from kept frames

   one output, one path, overwritten every run:

     demo/out/post37-dark-1080x1920.mp4
*/

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  planMascot, mascotFrame, mascotMotion, mascotCues, mascotCss, mascotMarkup,
  mascotRuntime, mascotPagePlan, describeMascot, describeMotion, headRect, headSD,
  STAGE, SAFE, HEAD, GRID, GLOW, BUBBLE, EYE_CX, TURN,
} from './lib/mascot.mjs';
import { brandTokens } from './lib/captions.mjs';
import { speak, VOICE_OUT, elevenReady, elevenIdOf } from './lib/voice.mjs';
import {
  SR, FART, GAINS, renderSfx, mixdown, voiceEnvelope,
  writeWav, applyGain, limit, loudness, decode, describeMix,
} from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post37');
const SUBS = path.join(OUT, 'subframes-post37');
const VERIFY = path.join(OUT, 'verify-post37');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = STAGE.dsf;
const VW = STAGE.w, VH = STAGE.h;
/* the brief's own margin, 120 device px on every side. the house safe area is
   stricter on every side and both are checked. */
const BRIEF_SAFE = 120;
const FLOOR_CSS = Math.max(Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom), BRIEF_SAFE) / DSF;
const TICK_TOL = 1e-3;

const argv = process.argv.slice(2);
const ONLY_ENCODE = argv.includes('--encode-only');
const VOICE_ONLY = argv.includes('--voice');
const KEEP = argv.includes('--keep-frames');
const BLUR = !argv.includes('--no-blur');
const BLUR_ARG = Number((argv.find(a => a.startsWith('--blur=')) || '').split('=')[1]) || 0;
const SUB_STEP_WANT = 10;
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
const POP = bezier(.34, 1.4, .64, 1);          /* the site's own --spring */
const RISE = bezier(.5, 0, .3, 1.3);           /* post30's rise, the overshoot with a slow start */
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a), 0, 1));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = q => (q <= 0 ? 0 : q >= 1 ? 1 : q * q * (3 - 2 * q));
const OUTC = p => 1 - Math.pow(1 - p, 3);
const r2 = v => Math.round(v * 100) / 100;
const DEG = Math.PI / 180;
function phosphor(t, amp, slow, fast, phase) {
  return 1 + amp * 0.78 * Math.sin(2 * Math.PI * t / slow) + amp * 0.39 * Math.sin(2 * Math.PI * t / fast + phase);
}
function prng(seed) {
  let x = seed | 0 || 0x1a2b3c;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x |= 0; return (x >>> 0) / 4294967296; };
}
function onGrid(t, len, fps) {
  const f0 = Math.round(t * fps);
  const n = Math.max(1, Math.round(len * fps));
  return { t0: f0 / fps, t1: (f0 + n) / fps, frames: n };
}

/* ---------- the read ----------
   the narrator, and no fallback. one take a sentence, cached on the copy, and
   a stop inside a line is 200ms of real silence between two takes. */
const VOICE = 'calm';
const RATE = '+0%';
const BREAK_MS = 200;
const LINES = [
  { text: 'we made two free tools. what should we make next.', rate: RATE, pitch: '+0Hz' },
  { text: 'or maybe we need to fix some bug for you.', rate: RATE, pitch: '+0Hz' },
  { text: 'maybe fresh air. or you have a better idea. do not be shy, share it.', rate: RATE, pitch: '+0Hz' },
];
/* six bubbles, one a sentence, each popping on the frame its own sentence
   starts making noise. `line` and `s` are which take it hangs off. */
const BUBBLES = [
  { line: 0, s: 0, text: 'we made 2 free tools' },
  { line: 0, s: 1, text: 'what should we make next' },
  { line: 1, s: 0, text: 'or fix a bug for you' },
  { line: 2, s: 0, text: 'maybe fresh air' },
  { line: 2, s: 1, text: 'got a better idea' },
  { line: 2, s: 2, text: 'share it below' },
];
const PILL_LINES = BUBBLES.map(b => b.text);
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16, minCapPx: 56 };
const CENTRE_Y = VH / 2;

const SILENCE_DB = -42;
const PRE = 0.06, POST = 0.10, EDGE_FADE = 0.012;
const TARGET_LUFS = -14;
const SAMPLE_CEILING = -1.8;
const PEAK_CEILING = -1.0;
const MAX_REDUCTION = 5.0;

/* ---------- the joins, and they are the whole of the clock ---------- */
const AFTER_LINE = 0.20;
const AFTER_READ = 0.80;
const END_HOLD = 1.00;
const LEAD_IN = 0.18;

/* ---------- where he stands ---------- */
const SIZE = 148;
const UNIT = SIZE / GRID;
const MID = { x: VW / 2, y: 470 };
const HOME = { left: +(MID.x - SIZE / 2).toFixed(2), top: +(MID.y - SIZE / 2).toFixed(2), size: SIZE };
const PLATE = {
  cx: HOME.left + (HEAD.plate.x + HEAD.plate.s / 2) * UNIT,
  cy: HOME.top + (HEAD.plate.y + HEAD.plate.s / 2) * UNIT,
  r: HEAD.plate.s / 2 * UNIT,
};
const GLOW_REACH = Math.ceil(3 * GLOW.wide.blur) + 10;
const IDLE_ROOM = 30;
const POP_IN = { at: 0.00, for: 0.72, from: VH + PLATE.r + GLOW_REACH + IDLE_ROOM };
const LAND = +(POP_IN.at + POP_IN.for).toFixed(4);

/* ==========================================================================
   the bug — post25's table, which is post15's, unchanged
   ==========================================================================
   drawn in code, flat, in the mascot's own ink, and it is a top view: six
   legs, two antennae and a body. every number is css px in the bug's own
   frame, with +x its heading and +y its right hand side. */
const SC = 1.30;
const BUG = {
  body: { l: 29, w: 16, r: 8 },
  head: { l: 10.6, w: 12, r: 5.5, gap: 1.2 },
  hips: [{ x: 9.6, y: 6.0 }, { x: 0.6, y: 7.4 }, { x: -9.2, y: 6.0 }],
  feet: [{ x: 19.0, y: 14.5 }, { x: 0.6, y: 21.0 }, { x: -18.0, y: 15.0 }],
  femur: 10.8, tibia: 10.8, legW: 2.2,
  ant: { len: 15, w: 2.0, angle: 28, bend: 18, y: 0.30,
    wob: [{ amp: 5.5, period: 0.47 }, { amp: 3.0, period: 0.31 }],
    flick: { every: [0.44, 1.05], for: 0.13, by: 14 } },
  stride: 34, duty: 0.55, swingPull: 1.8, sway: 1.5, yaw: 3.2,
  path: { mid: 0, a1: 4.6, l1: 137, p1: 0.9, a2: 2.2, l2: 61, p2: 2.4 },
  seed: 0x51b0e3,
};
const BUG_INK = (() => {
  const sweep = BUG.stride * BUG.duty / 2;
  const nose = BUG.body.l / 2 + BUG.head.gap + BUG.head.l;
  const ant = nose + BUG.ant.len * Math.cos((BUG.ant.angle - BUG.ant.bend) * DEG);
  const front = Math.max(ant, BUG.feet[0].x + sweep) + BUG.legW / 2;
  const back = Math.min(-BUG.body.l / 2, BUG.feet[2].x - sweep) - BUG.legW / 2;
  const side = Math.max(...BUG.feet.map(f => f.y)) + BUG.legW / 2;
  return { front, back, side, sweep, len: front - back, w: side * 2 };
})();

/* the walk, as a speed profile: constant, then a smoothstep down into nothing.
   the integral of one minus a smoothstep over its window is exactly a half, so
   `V * (flat + dec/2)` is the distance, and that is what fixes V. */
const WALK = { t0: 0, t1: 0, dec: 0.36, x0: null, x1: null, for: 2.20 };
function walkSetup(startX, stopX) {
  WALK.x0 = startX; WALK.x1 = stopX;
  WALK.flat = WALK.t1 - WALK.t0 - WALK.dec;
  WALK.v = (stopX - startX) / (WALK.flat + WALK.dec / 2);
  WALK.xd = startX + WALK.v * WALK.flat;
  return WALK;
}
function walkX(t) {
  if (t <= WALK.t0) return WALK.x0;
  if (t >= WALK.t1) return WALK.x1;
  const u = t - WALK.t0;
  if (u <= WALK.flat) return WALK.x0 + WALK.v * u;
  const q = (u - WALK.flat) / WALK.dec;
  return WALK.xd + WALK.v * WALK.dec * (q - q * q * q + q * q * q * q / 2);
}
const pathY = x => { const P = BUG.path; return P.mid + P.a1 * Math.sin(x / P.l1 + P.p1) + P.a2 * Math.sin(x / P.l2 + P.p2); };
const pathSlope = x => { const P = BUG.path; return P.a1 / P.l1 * Math.cos(x / P.l1 + P.p1) + P.a2 / P.l2 * Math.cos(x / P.l2 + P.p2); };

/* the lane, as a curve: straights and arcs, tangent at every join, walked by
   arclength — because every line in the gait below is a function of how far the
   body has actually travelled, and an arc's parameter is its arclength. */
function buildPath(start, th0, plan) {
  const segs = [];
  let p = { ...start }, th = th0 * DEG, S = 0;
  for (const g of plan) {
    if (g.line != null) {
      segs.push({ at: S, len: g.line, kind: 'line', x: p.x, y: p.y, th, why: g.why });
      p = { x: p.x + Math.cos(th) * g.line, y: p.y + Math.sin(th) * g.line };
      S += g.line;
    } else {
      const sign = Math.sign(g.turn), R = g.r, d = Math.abs(g.turn) * DEG;
      const c = { x: p.x + R * Math.cos(th + sign * Math.PI / 2), y: p.y + R * Math.sin(th + sign * Math.PI / 2) };
      segs.push({ at: S, len: R * d, kind: 'arc', cx: c.x, cy: c.y, r: R, th0: th, sign, why: g.why });
      th += sign * d;
      p = { x: c.x + R * Math.cos(th - sign * Math.PI / 2), y: c.y + R * Math.sin(th - sign * Math.PI / 2) };
      S += R * d;
    }
  }
  return { segs, len: +S.toFixed(3), end: p, endTh: th };
}
function arcAt(S) {
  const L = PATH.segs;
  let i = 0;
  while (i + 1 < L.length && S >= L[i + 1].at) i++;
  const g = L[i], u = S - g.at;
  if (g.kind === 'line') return { x: g.x + Math.cos(g.th) * u, y: g.y + Math.sin(g.th) * u, th: g.th };
  const th = g.th0 + g.sign * u / g.r;
  return { x: g.cx + g.r * Math.cos(th - g.sign * Math.PI / 2), y: g.cy + g.r * Math.sin(th - g.sign * Math.PI / 2), th };
}
/* the same, with post15's wobble on top as a **normal offset**: the two sines
   read against the curve rather than against a horizontal. */
function pathPoint(s) {
  const p = arcAt(s * SC);
  const n = pathY(s) * SC;
  return { x: p.x - n * Math.sin(p.th), y: p.y + n * Math.cos(p.th), th: p.th + Math.atan(pathSlope(s)) };
}
function place(f, lx, ly) {
  const c = Math.cos(f.th), sn = Math.sin(f.th);
  return { x: f.x + (lx * c - ly * sn) * SC, y: f.y + (lx * sn + ly * c) * SC };
}
const normal = f => ({ x: -Math.sin(f.th), y: Math.cos(f.th) });

/* one leg, and the whole no-sliding argument: the stance that phase `k` opens
   began with the body at arclength `xs`; the foot was set down at that frame's
   own position and is returned unchanged for the whole stance. */
const planted = (xs, rest) => place(pathPoint(xs), rest.x + BUG_INK.sweep, rest.y);
function legFoot(x, off, rest) {
  const S = BUG.stride, D = BUG.duty;
  const ph = x / S + off;
  const k = Math.floor(ph), p = ph - k;
  const a = planted((k - off) * S, rest);
  if (p < D) return { x: a.x, y: a.y, planted: true, pull: 0 };
  const b = planted((k + 1 - off) * S, rest);
  const q = (p - D) / (1 - D);
  return { x: lerp(a.x, b.x, smooth(q)), y: lerp(a.y, b.y, smooth(q)), planted: false, pull: BUG.swingPull * Math.sin(Math.PI * q) };
}
/* two bones to a foot, the knee off the circle intersection on the side away
   from the body, which is what an insect knee does and a mammal knee does not. */
function knee(hip, foot, side) {
  const dx = foot.x - hip.x, dy = foot.y - hip.y;
  const d = Math.max(1e-3, Math.hypot(dx, dy));
  const L1 = BUG.femur * SC, L2 = BUG.tibia * SC;
  const dd = Math.min(d, (L1 + L2) * 0.999);
  const a = (L1 * L1 - L2 * L2 + dd * dd) / (2 * dd);
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const ux = dx / d, uy = dy / d, s = side >= 0 ? 1 : -1;
  return { x: hip.x + ux * a - uy * h * s, y: hip.y + uy * a + ux * h * s, reach: d };
}
function antennaSchedule(from, until, seed) {
  const rnd = prng(seed), out = [];
  let t = from + 0.25, side = 0;
  while (t < until) {
    out.push({ t: +t.toFixed(3), side, for: BUG.ant.flick.for });
    t += lerp(BUG.ant.flick.every[0], BUG.ant.flick.every[1], rnd());
    side = 1 - side;
  }
  return out;
}
const BUG_SETTLE = 0.22;
function bugFrame(t, sched) {
  const x = walkX(t);
  const ph = x / BUG.stride;
  const set = smooth(span(t, WALK.t1, WALK.t1 + BUG_SETTLE));
  const gait = 1 - set;
  const pf = pathPoint(x);
  const sway = BUG.sway * Math.sin(2 * Math.PI * ph) * gait;
  const yaw = BUG.yaw * Math.cos(2 * Math.PI * ph) * gait;
  const nrm = normal(pf);
  const body = { x: pf.x + nrm.x * sway * SC, y: pf.y + nrm.y * sway * SC, th: pf.th + yaw * DEG };
  const rot = body.th / DEG;
  const legs = [];
  let worstReach = 0;
  for (let s = 0; s < 2; s++) {
    const sg = s === 0 ? -1 : 1;
    for (let i = 0; i < 3; i++) {
      const off = ((s === 1) !== (i === 1)) ? 0.5 : 0;   /* the alternating tripod */
      const rest = { x: BUG.feet[i].x, y: BUG.feet[i].y * sg };
      const hip = place(body, BUG.hips[i].x, BUG.hips[i].y * sg);
      const f = legFoot(x, off, rest);
      const restPos = place(pf, rest.x, rest.y);
      const pull = f.pull * sg * (1 - set) * SC;
      const foot = { x: lerp(f.x, restPos.x, set) - nrm.x * pull, y: lerp(f.y, restPos.y, set) - nrm.y * pull };
      const kn = knee(hip, foot, sg);
      worstReach = Math.max(worstReach, kn.reach);
      legs.push([hip.x, hip.y, kn.x, kn.y, foot.x, foot.y]);
    }
  }
  const A = BUG.ant;
  const nose = BUG.body.l / 2 + BUG.head.gap + BUG.head.l;
  const ants = [];
  for (let s = 0; s < 2; s++) {
    const sg = s === 0 ? -1 : 1;
    let a = A.angle;
    for (const w of A.wob) a += w.amp * Math.sin(2 * Math.PI * t / w.period + s * 1.7);
    for (const fl of sched) if (fl.side === s && t >= fl.t && t < fl.t + fl.for) a += A.flick.by * Math.sin(Math.PI * (t - fl.t) / fl.for);
    const root = { x: nose - A.len * 0.14, y: BUG.head.w * A.y * sg };
    const r1 = a * sg * DEG, rr = (a + A.bend) * sg * DEG;
    const mid = { x: root.x + Math.cos(r1) * A.len * 0.52, y: root.y + Math.sin(r1) * A.len * 0.52 };
    const tip = { x: mid.x + Math.cos(rr) * A.len * 0.48, y: mid.y + Math.sin(rr) * A.len * 0.48 };
    const P = [root, mid, tip].map(q => place(body, q.x, q.y));
    ants.push([P[0].x, P[0].y, P[1].x, P[1].y, P[2].x, P[2].y]);
  }
  return { x, ph, body, rot, legs, ants, worstReach, settled: set >= 1 };
}
function bugPoints(bf) {
  const out = [];
  const nose = BUG.body.l / 2 + BUG.head.gap + BUG.head.l;
  const corner = (px, py) => { const p = place(bf.body, px, py); out.push([p.x, p.y]); };
  for (const px of [-BUG.body.l / 2, nose]) for (const py of [-BUG.head.w / 2 - 1, BUG.head.w / 2 + 1]) corner(px, py);
  for (const py of [-BUG.body.w / 2, BUG.body.w / 2]) corner(-BUG.body.l / 2, py);
  for (const L of bf.legs) { out.push([L[2], L[3]]); out.push([L[4], L[5]]); }
  for (const A of bf.ants) { out.push([A[2], A[3]]); out.push([A[4], A[5]]); }
  return out;
}
function bugPage(bf) {
  const P = bugPoints(bf);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of P) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  const pad = BUG.legW * SC / 2;
  return {
    body: [r2(bf.body.x), r2(bf.body.y), r2(bf.rot)],
    legs: bf.legs.map(L => L.map(r2)), ants: bf.ants.map(A => A.map(r2)),
    rect: { x: x0 - pad, y: y0 - pad, w: (x1 - x0) + pad * 2, h: (y1 - y0) + pad * 2 },
  };
}
/* one tick per stride boundary, read off the walk rather than laid on a grid:
   the times are the instants the body has covered another whole stride, so as
   it decelerates the last few spread out and then stop on their own. */
function stepTimes() {
  const out = [];
  let last = Math.floor(walkX(WALK.t0) / BUG.stride);
  for (let i = 1; i <= Math.round(480 * (WALK.t1 - WALK.t0)); i++) {
    const t = WALK.t0 + i / 480;
    const k = Math.floor(walkX(t) / BUG.stride);
    if (k > last) { out.push(+t.toFixed(4)); last = k; }
  }
  return out;
}

/* ---------- the eating, post25's table ----------
   `by` is derived below rather than typed. `fwd` is small and negative on
   purpose — he leans out over the bug rather than back off it. */
const BITE = { at: 0, rise: 0.10, riseBy: 7, down: 0.10, fwd: -4, land: 0.10, squash: 0.075, up: 0.14, by: 0 };
const CHEW = { at: 0, pulses: 3, for: 0.20, peak: 0.34, squash: 0.055, shift: 3.4, roll: 1.7, bob: { for: 0.20, by: 5 } };
/* the eyes shut for the eating. shut is a line, not a lid: hold the module's
   blink for a second and the face is not a face with its eyes closed, it is a
   face with no eyes, so the eye is squashed to a quarter of its own height and
   a thin bar of the same ink stays. */
const SHUT = { at: 0, in: 0.09, until: 0, out: 0.16, sy: 0.26 };
const SHAKE = { at: 0, for: 0.72, by: 1.5, hz: 11 };
/* the puff: six soft fields, seeded, out from under him and away to one side */
const SIDE = -1;
const CLOUD = { n: 6, for: 0.82, rise: 96, out: 70, r0: 26, grow: 2.5, o: 0.42,
  from: { x: +(PLATE.cx - 34).toFixed(1), y: +(HOME.top + SIZE - 6).toFixed(1) },
  at: 0, lead: 0.16, room: 0.55 };
const PUFFS = (() => {
  const rnd = prng(0x2f7a11);
  return Array.from({ length: CLOUD.n }, (_, i) => ({
    delay: +(i * 0.038 + rnd() * 0.035).toFixed(3),
    life: +(CLOUD.for * (0.62 + rnd() * 0.38)).toFixed(3),
    dx: +((rnd() * 2 - 1) * 26).toFixed(1), dy: +(rnd() * 14).toFixed(1),
    out: +(0.45 + rnd() * 0.75).toFixed(3), rise: +(0.70 + rnd() * 0.55).toFixed(3),
    r: +(CLOUD.r0 * (0.72 + rnd() * 0.60)).toFixed(1),
  }));
})();
const OFF_CLOUD = PUFFS.map(() => ({ o: 0, x: 0, y: 0, s: 1 }));
/* the squint, and it is the only one in the film */
const SQUINT = { at: 0, in: 0.30, until: 0, out: 0.25, sy: 0.55, sx: 1.12 };
/* the arcs, twice and briefly. delighted's own numbers. */
const ARC = { rise: 0.14, hold: 0.27, fall: 0.14, sy: 0.40, sx: 1.28, max: 0.60, at: [] };
ARC.len = +(ARC.rise + ARC.hold + ARC.fall).toFixed(4);

/* ---------- the bubbles ----------
   the house thought bubble: two dots climbing off his rim toward a pill. the
   dots are the tail and they point back at him. */
const BUB = {
  size: 24, weight: 600, padX: 18, padY: 10, lh: 1.25,
  angle: -58,                      /* the ray the tail climbs, screen degrees */
  /* **one distance, three times.** the chain is laid out along the ray by its
     edges rather than by its centres: his rim to the small dot, the small dot
     to the big one, and the big one to the pill's bottom edge are all `gap`.
     the two diameters are the only other numbers in it, and how high the pill
     ends up is what falls out rather than something typed. the small dot is
     nearest him, the bigger one next, then the pill: the module's own order. */
  gap: 9, d0: 9, d1: 13,
  step: 0.07, dotFor: 0.26, pillFor: 0.34, from: 0.55,
  outStep: 0.05, outFor: 0.15, outFrom: 0.86,
};
BUB.h = +(BUB.size * BUB.lh + 2 * BUB.padY + 2 * BUBBLE.stroke).toFixed(2);
BUB.r0 = +(PLATE.r + BUB.gap + BUB.d0 / 2).toFixed(4);
BUB.r1 = +(BUB.r0 + BUB.d0 / 2 + BUB.gap + BUB.d1 / 2).toFixed(4);
BUB.r2 = +(BUB.r1 + BUB.d1 / 2 + BUB.gap).toFixed(4);   /* where the ray meets the pill */
BUB.c0x = +(PLATE.cx + BUB.r0 * Math.cos(BUB.angle * DEG)).toFixed(2);
BUB.c0y = +(PLATE.cy + BUB.r0 * Math.sin(BUB.angle * DEG)).toFixed(2);
BUB.c1x = +(PLATE.cx + BUB.r1 * Math.cos(BUB.angle * DEG)).toFixed(2);
BUB.c1y = +(PLATE.cy + BUB.r1 * Math.sin(BUB.angle * DEG)).toFixed(2);
BUB.py = +(PLATE.cy + BUB.r2 * Math.sin(BUB.angle * DEG)).toFixed(2);   /* the pill's bottom edge */
BUB.lift = +(PLATE.cy - PLATE.r - BUB.py).toFixed(2);   /* derived, for the print */
/* how much room a pill hanging off his side would have before the safe line.
   printed at run time, because it is the measurement that sends every line
   over his head instead. */
BUB.sideRoom = +(VW - FLOOR_CSS - (BUB.c1x + BUB.d1 / 2 + 6)).toFixed(1);

/* ---------- the gaze, post25's ----------
   the module's own five moves, driven per frame by where the thing being
   looked at actually is. `bias: 0` means the module writes nothing to the
   channel, so there is nothing here for this to fight. */
const GAZE = { span: 172, max: 0.60, vspan: 200, vy: 2.4, off: 0.14, pill: 0.85, in: 0.30 };
const EYE_PAGE_Y = HOME.top + HEAD.eye.cy * UNIT;
const PL_R = HEAD.plate.s / 2, PL_CX = HEAD.plate.x + PL_R, PL_CY = HEAD.plate.y + PL_R;
function eyeRoom(ey, halfW, halfH) {
  const top = HEAD.eye.cy + ey - halfH, bot = HEAD.eye.cy + ey + halfH;
  const dy = Math.max(Math.abs(top - PL_CY), Math.abs(bot - PL_CY));
  const half = dy >= PL_R ? 0 : Math.sqrt(PL_R * PL_R - dy * dy);
  return Math.max(0, half - TURN.margin - halfW);
}
/* the five moves, in the module's order: the far eye is the one the turn
   carries toward the silhouette, so it foreshortens and travels the shorter
   distance; the near one is full width and travels further. */
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
  mas.card.rot = +(mas.card.rot + TURN.tilt * g.q).toFixed(4);   /* the head leaning */
}
function eyeOutside(mas, plan) {
  let worst = -Infinity;
  for (let k = 0; k < 2; k++) {
    const e = mas.eyes[k];
    const hw = HEAD.eye.w / 2 * Math.abs(e.sx), hh = HEAD.eye.h / 2 * Math.abs(e.sy);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) worst = Math.max(worst, headSD(EYE_CX[k] + e.x + sx * hw, HEAD.eye.cy + e.y + sy * hh, plan));
  }
  return worst;
}

/* ---------- the cut and the end card ---------- */
const GL = {
  offsets: [{ d: 0.40, for: 2 / 60, heat: 0.75 }, { d: 0.25, for: 3 / 60, heat: 1.0 }, { d: 0.12, for: 3 / 60, heat: 1.0 }, { d: 0, for: 2 / 60, heat: 0.45, residue: true }],
  bursts: [], jumpX: 22, jumpY: 12, split: 11, slices: 3, sliceH: [24, 110], sliceDx: 70, flash: 0,
};
const WM1 = { at: 0, for: 0.09 };
const CRF = 17;
const STEP_CEIL = 130;
const LANE_CLEAR = 26;
const LEFT_CLEAR = 16;

/* ========================================================================== */
/* the read, first, because it is the thing that can stop us                  */
/* ========================================================================== */
if (!elevenReady('narrator')) {
  console.error('\nSTOPPED. the voice is the elevenlabs narrator and there is no fallback in this clip.');
  console.error('  demo/.env needs ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID, both filled.');
  console.error('  the brief says stop rather than read this in edge, so nothing was fetched and nothing was rendered.');
  process.exit(1);
}
if (elevenIdOf(VOICE) !== 'narrator') { console.error('\nSTOPPED. "' + VOICE + '" no longer asks for the narrator\'s voice id.'); process.exit(1); }

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
async function take(i) {
  const L = LINES[i];
  const parts = L.text.split(/(?<=[.!?])\s+/);
  const takes = [];
  for (let k = 0; k < parts.length; k++) {
    const name = 'post37-l' + (i + 1) + (parts.length > 1 ? 's' + (k + 1) : '');
    const cached = path.join(VOICE_OUT, name + '-' + VOICE + '.json');
    const want = parts[k].replace(/\s+/g, ' ').trim();
    let got = null;
    if (fs.existsSync(cached)) {
      const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
      if (j.text === want && j.rate === L.rate && j.provider === 'elevenlabs' && j.elevenId === 'narrator' && fs.existsSync(j.file)) got = { ...j, cached: true };
    }
    if (!got) {
      let r;
      try { r = await speak(parts[k], { voice: VOICE, name, rate: L.rate, pitch: L.pitch }); }
      catch (e) {
        console.error('\nSTOPPED. elevenlabs failed on line ' + (i + 1) + ', sentence ' + (k + 1) + ': ' + (e && e.message || e));
        console.error('  the brief says stop rather than fall back to edge, so nothing was rendered.');
        process.exit(1);
      }
      got = { ...r, cached: false };
    }
    if (got.provider !== 'elevenlabs' || got.elevenId !== 'narrator') {
      console.error('\nSTOPPED. line ' + (i + 1) + ' sentence ' + (k + 1) + ' came back from ' + got.provider + ', and this clip is the narrator or nothing.');
      process.exit(1);
    }
    if (got.timing !== 'engine') { console.error('\nSTOPPED. line ' + (i + 1) + ' sentence ' + (k + 1) + ' came back with estimated timings.'); process.exit(1); }
    takes.push(got);
  }
  const pcms = takes.map(t => decode(ffmpeg, t.file));
  const edges = pcms.map(audioEdges);
  let total = 0;
  const off = [];
  for (let k = 0; k < takes.length; k++) {
    off.push(k === 0 ? 0 : +(off[k - 1] + edges[k - 1].end + BREAK_MS / 1000 - edges[k].start).toFixed(4));
    total = Math.max(total, off[k] + pcms[k].length / SR);
  }
  const pcm = new Float32Array(Math.ceil(total * SR));
  for (let k = 0; k < takes.length; k++) {
    const at = Math.round(off[k] * SR);
    const a = Math.max(0, Math.round((edges[k].start - PRE) * SR)), b = Math.min(pcms[k].length, Math.round((edges[k].end + POST) * SR));
    for (let j = a; j < b; j++) { const q = at + j; if (q >= 0 && q < pcm.length) pcm[q] += pcms[k][j]; }
  }
  const words = [];
  for (let k = 0; k < takes.length; k++) for (const w of takes[k].words) words.push({ word: w.word, start: +(w.start + off[k]).toFixed(4), end: +(w.end + off[k]).toFixed(4) });
  return {
    i, text: L.text, rate: L.rate, pitch: L.pitch, provider: 'elevenlabs', elevenId: 'narrator', timing: 'engine',
    words, pcm, parts: parts.map(p => p.trim()), sentences: takes.length,
    cached: takes.every(t => t.cached), breaks: takes.length > 1 ? BREAK_MS : 0,
    says: takes.map((_, k) => +(off[k] + edges[k].start - edges[0].start).toFixed(4)),
    gaps: takes.slice(1).map((t, k) => +(off[k + 1] + edges[k + 1].start - off[k] - edges[k].end).toFixed(4)),
  };
}

const TAKES = [];
for (let i = 0; i < LINES.length; i++) TAKES.push(await take(i));
const PCM = TAKES.map(t => t.pcm);
const EDGE = PCM.map(audioEdges);

/* ========================================================================== */
/* the clock, and every number in it comes off the read                       */
/* ========================================================================== */
const SC_T = [], SOUND = [], OFF = [];
const place2 = (i, at) => {
  SC_T[i] = +at.toFixed(4);
  SOUND[i] = { start: SC_T[i], end: +(SC_T[i] + (EDGE[i].end - EDGE[i].start)).toFixed(4) };
};
place2(0, LAND + LEAD_IN);
place2(1, SOUND[0].end + AFTER_LINE);

/* ---------- the plan ----------
   one neutral mark and nothing else: no state in the module's table is on the
   face here, because everything the face does in this clip is a look, a blink,
   the arcs, the eating's shut or the squint, and all five are written on top
   of neutral. the plan is cut longer than the film because the film's own
   length is not known until the eating is placed, and the eating needs the
   plan to work out how deep the lunge has to go. */
const PLAN_SECONDS = 26.0;
const SEED = 11;
const plan = planMascot({
  marks: [{ t: 0.30, state: 'neutral' }],
  seconds: PLAN_SECONDS, theme: 'dark', size: SIZE, bias: 0, seed: SEED,
});
plan.box = { ...HOME };

/* ---------- the lane ----------
   his ink, plus the clearance, plus the bug's own reach sideways — sideways,
   because it arrives along the floor heading right and the part of it nearest
   him is its flank. everything below is derived: change his size or the bug's
   scale and every one of them moves. */
const HEAD_BOTTOM = (() => {
  let worst = -Infinity, at = 0;
  for (let f = 0; f < Math.round(60 * (PLAN_SECONDS - 0.1)); f++) {
    const t = f / 60;
    const bottom = VH - headRect(plan, mascotFrame(plan, t)).bottom / DSF;
    if (bottom > worst) { worst = bottom; at = +t.toFixed(3); }
  }
  return { y: +worst.toFixed(2), at };
})();
const LANE = +(HEAD_BOTTOM.y + LANE_CLEAR + BUG_INK.side * SC).toFixed(2);
const LEFT = +(SAFE.left / DSF + BUG_INK.side * SC + LEFT_CLEAR).toFixed(2);
const S_TURN = 45, FLOOR_R = 84, DOWN_RUN = 20;
const TURN_R = +((PLATE.cx - LEFT) / (2 * (1 - Math.cos(S_TURN * DEG)))).toFixed(3);
const FLOOR_RUN = +(PLATE.cx - LEFT - FLOOR_R).toFixed(2);
const S_DROP = 2 * TURN_R * Math.sin(S_TURN * DEG);
const TOP_Y = +(LANE - FLOOR_R - DOWN_RUN - S_DROP).toFixed(2);
const START_Y = +(-BUG_INK.front * SC - 6).toFixed(2);
const PATH = buildPath({ x: PLATE.cx, y: START_Y }, 90, [
  { line: +(TOP_Y - START_Y).toFixed(2), why: 'in over the top edge, dead centre' },
  { turn: S_TURN, r: TURN_R, why: 'the wide arc left, around him' },
  { turn: -S_TURN, r: TURN_R, why: 'and back to vertical, out on the left lane' },
  { line: DOWN_RUN, why: 'down the left side' },
  { turn: -90, r: FLOOR_R, why: 'the quarter turn onto the floor' },
  { line: FLOOR_RUN, why: 'along the floor, to a stop under him' },
]);
for (const [what, v] of [['the entry run', TOP_Y - START_Y], ['the floor run', FLOOR_RUN]]) {
  if (v <= 0) throw new Error(what + ' came out at ' + v.toFixed(1) + ' — the lane does not fit');
}
/* the bug walks in on the first frame of the line about the bug */
WALK.t0 = SC_T[1];
WALK.t1 = +(WALK.t0 + WALK.for).toFixed(4);
walkSetup(0, PATH.len / SC);
/* the wobble is offset so the stop is dead under him. one line, solved. */
BUG.path.mid = -(BUG.path.a1 * Math.sin(WALK.x1 / BUG.path.l1 + BUG.path.p1) + BUG.path.a2 * Math.sin(WALK.x1 / BUG.path.l2 + BUG.path.p2));
const ANT_SCHED = antennaSchedule(WALK.t0, WALK.t1 + 1, BUG.seed);
const STEPS = stepTimes();

/* ---------- the eating, on the clock ---------- */
BITE.at = +(WALK.t1 + 0.26).toFixed(4);
const BITE_HIT = +(BITE.at + BITE.rise + BITE.down).toFixed(4);
const BITE_END = +(BITE_HIT + BITE.land + BITE.up).toFixed(4);
CHEW.at = BITE_END;
const CHEW_END = +(CHEW.at + CHEW.pulses * CHEW.for + CHEW.bob.for).toFixed(4);
const CHEW_HITS = Array.from({ length: CHEW.pulses }, (_, i) => +(CHEW.at + i * CHEW.for + CHEW.for * CHEW.peak * 0.5).toFixed(4));
SHUT.at = +(BITE.at + BITE.rise).toFixed(4);
SHUT.until = +(CHEW_END + 0.02).toFixed(4);
SHAKE.at = +(CHEW_END + 0.14).toFixed(4);
/* the frame the bug goes is a ceiling, not a rounding: a landing time that
   rounds down puts the switch a frame before his head is on it. */
const VANISH_FRAME = Math.ceil(BITE_HIT * FPS);
const VANISH_AT = +(VANISH_FRAME / FPS).toFixed(4);

/* ---------- the puff, then line three ---------- */
CLOUD.at = +(CHEW_END + CLOUD.lead).toFixed(4);
const CLOUD_END = +(CLOUD.at + Math.max(...PUFFS.map(p => p.delay + p.life))).toFixed(4);
SQUINT.at = +(CLOUD.at + 0.04).toFixed(4);
SQUINT.until = +(CLOUD_END + 0.10).toFixed(4);
const SC2_WANT = Math.max(SOUND[1].end + AFTER_LINE, CLOUD.at + CLOUD.room);
place2(2, SC2_WANT);

/* ---------- where every bubble pops, and where it goes ---------- */
const SAY = BUBBLES.map(b => +(SC_T[b.line] + TAKES[b.line].says[b.s]).toFixed(4));
const CUT = +(SOUND[2].end + AFTER_READ).toFixed(4);
const SECONDS = +(CUT + END_HOLD).toFixed(4);
if (SECONDS > PLAN_SECONDS) throw new Error('the film is ' + SECONDS + 's and the plan is only ' + PLAN_SECONDS);
/* each bubble is out before the next is in. the third goes before he winds up
   to lunge, and the sixth on the last word. */
const BUB_GAP = 0.34;
const SAY_OUT = SAY.map((t, k) => {
  if (k === 2) return +(BITE.at - 0.35).toFixed(4);
  if (k === BUBBLES.length - 1) return +SOUND[2].end.toFixed(4);
  return +(SAY[k + 1] - BUB_GAP).toFixed(4);
});
/* the two short arcs: on the first bubble and on the last */
ARC.at = [+(SAY[0] + 0.15).toFixed(4), +(SAY[BUBBLES.length - 1] + 0.20).toFixed(4)];
WM1.at = CUT;
GL.bursts = GL.offsets.map(o => ({ t: +(CUT - o.d).toFixed(4), for: o.for, heat: o.heat, residue: !!o.residue }));
for (let k = 0; k < LINES.length; k++) OFF[k] = +(SC_T[k] - EDGE[k].start).toFixed(4);

const rep = mascotMotion(plan, FPS, SECONDS);
const rep60 = FPS === 60 ? rep : mascotMotion(plan, 60, SECONDS);
const MODULE_CUES = mascotCues(plan);
let GL_WINDOWS = [], GL_WINDOWS_60 = [];
const glitchWindows = fps => GL.bursts.map((b, i) => ({ ...onGrid(b.t, b.for, fps), heat: b.heat, residue: !!b.residue, seed: 0x5c1a + i * 977 }));
GL_WINDOWS = glitchWindows(FPS);
GL_WINDOWS_60 = FPS === 60 ? GL_WINDOWS : glitchWindows(60);

/* ========================================================================== */
/* the bite depth, and the clearance                                          */
/* ========================================================================== */
function biteZone(t) {
  const z = { x: 0, y: 0, sx: 1, sy: 1, rot: 0 };
  const T = BITE;
  if (t >= T.at && t < T.at + T.rise) {
    /* he goes up before he goes down, which is every entrance in the module */
    z.y = -T.riseBy * smooth((t - T.at) / T.rise);
  } else if (t >= T.at + T.rise && t < BITE_HIT) {
    const u = (t - T.at - T.rise) / T.down;
    z.y = lerp(-T.riseBy, T.by, u * u);         /* accelerating: it has mass */
    z.x = T.fwd * (u * u);
  } else if (t >= BITE_HIT && t < BITE_HIT + T.land) {
    const q = T.squash * Math.sin(Math.PI * (t - BITE_HIT) / T.land) ** 0.6;
    z.y = T.by; z.x = T.fwd; z.sx = 1 + q; z.sy = 1 / (1 + q);
  } else if (t >= BITE_HIT + T.land && t < BITE_END) {
    const e = 1 - (1 - (t - BITE_HIT - T.land) / T.up) ** 2;
    z.y = lerp(T.by, 0, e); z.x = lerp(T.fwd, 0, e);
  }
  if (t >= CHEW.at && t < CHEW.at + CHEW.pulses * CHEW.for) {
    const i = Math.min(CHEW.pulses - 1, Math.floor((t - CHEW.at) / CHEW.for));
    const u = (t - CHEW.at - i * CHEW.for) / CHEW.for;
    /* fast in, slower out: the peak sits a third of the way through */
    const q = u < CHEW.peak ? smooth(u / CHEW.peak) : 1 - smooth((u - CHEW.peak) / (1 - CHEW.peak));
    const side = i % 2 === 0 ? -1 : 1, k = CHEW.squash * q;
    z.sx = 1 + k; z.sy = 1 / (1 + k);
    z.x += side * CHEW.shift * q;
    z.rot = side * CHEW.roll * q;
  }
  const bobAt = CHEW.at + CHEW.pulses * CHEW.for;
  if (t >= bobAt && t < bobAt + CHEW.bob.for) z.y += -CHEW.bob.by * Math.sin(Math.PI * ((t - bobAt) / CHEW.bob.for));
  if (t >= SHAKE.at && t < SHAKE.at + SHAKE.for) {
    const p = span(t, SHAKE.at, SHAKE.at + SHAKE.for);
    z.x += SHAKE.by * (1 - p) * Math.sin(2 * Math.PI * SHAKE.hz * (t - SHAKE.at));
  }
  /* the pop in, on the module's own rise. it is on the zone with everything
     else so there is one transform on him and not two. */
  if (t < LAND) z.y += lerp(POP_IN.from, MID.y, RISE(span(t, POP_IN.at, POP_IN.at + POP_IN.for))) - MID.y;
  return z;
}
function headInk(mas, zone) {
  return {
    cx: PLATE.cx + zone.x + mas.card.x * zone.sx, cy: PLATE.cy + zone.y + mas.card.y * zone.sy,
    a: PLATE.r * Math.abs(mas.card.sx) * zone.sx, b: PLATE.r * Math.abs(mas.card.sy) * zone.sy,
    th: (mas.card.rot + zone.rot) * DEG,
  };
}
function containment(ink, box) {
  const c = Math.cos(-ink.th), sn = Math.sin(-ink.th);
  let worst = 0;
  for (const px of [box.x, box.x + box.w]) for (const py of [box.y, box.y + box.h]) {
    const dx = px - ink.cx, dy = py - ink.cy;
    worst = Math.max(worst, Math.hypot((dx * c - dy * sn) / ink.a, (dx * sn + dy * c) / ink.b));
  }
  return worst;
}
/* how deep the lunge has to go: walked rather than solved, down in half pixel
   steps until his drawn ellipse contains every corner of the bug's drawn ink on
   the contact frame. the middle of the admissible range, not its first entry —
   the window is narrow and a flat margin walks past the far side of it. */
const DEPTH = (() => {
  const mas = mascotFrame(plan, VANISH_AT);
  const box = bugPage(bugFrame(VANISH_AT, ANT_SCHED)).rect;
  const u = clamp((VANISH_AT - BITE_HIT) / BITE.land, 0, 1);
  const q = BITE.squash * Math.sin(Math.PI * u) ** 0.6;
  const at = d => containment(headInk(mas, { x: BITE.fwd, y: d, sx: 1 + q, sy: 1 / (1 + q), rot: 0 }), box);
  let lo = null, hi = null;
  for (let d = 0; d <= 300; d += 0.5) { if (at(d) <= 1) { if (lo == null) lo = d; hi = d; } else if (lo != null) break; }
  if (lo == null) throw new Error('no lunge inside 300px puts the bug under his ink');
  const mid = +((lo + hi) / 2).toFixed(2);
  return { need: lo, lo, hi, mid, margin: +((hi - lo) / 2).toFixed(2), hold: +at(mid).toFixed(4), box };
})();
BITE.by = DEPTH.mid;

/* the closest the bug's ink ever gets to his before he goes for it, and where
   its own ink sits against the four safe lines. his ellipse against the bug's
   points, not two boxes: two boxes cannot see a corner that is empty on both
   sides, and the bug is diagonal for most of the walk. */
const CLEAR = (() => {
  let worst = Infinity, at = 0, hit = null;
  let inAt = null, out = null, worstAir = Infinity, airAt = 0;
  const S = { left: SAFE.left / DSF, right: VW - SAFE.right / DSF, top: SAFE.top / DSF, bottom: VH - SAFE.bottom / DSF };
  const pad = BUG.legW * SC / 2;
  for (let f = Math.floor(WALK.t0 * 60); f <= Math.round(60 * (WALK.t1 + BUG_SETTLE)); f++) {
    const t = f / 60;
    const bf = bugFrame(t, ANT_SCHED);
    const ink = headInk(mascotFrame(plan, t), { x: 0, y: 0, sx: 1, sy: 1, rot: 0 });
    const c = Math.cos(-ink.th), sn = Math.sin(-ink.th);
    for (const [px, py] of bugPoints(bf)) {
      const dx = px - ink.cx, dy = py - ink.cy;
      const u = dx * c - dy * sn, v = dx * sn + dy * c;
      const ratio = Math.hypot(u / ink.a, v / ink.b);
      const gap = Math.hypot(dx, dy) * (1 - 1 / Math.max(ratio, 1e-6)) - pad;
      if (gap < worst) { worst = gap; at = +t.toFixed(3); }
      if (ratio <= 1 && !hit) hit = +t.toFixed(3);
    }
    const b = bugPage(bf).rect;
    const air = Math.min(b.x - S.left, S.right - (b.x + b.w), b.y - S.top, S.bottom - (b.y + b.h));
    if (air >= 0 && inAt == null) inAt = +t.toFixed(3);
    if (inAt != null) {
      if (air < worstAir) { worstAir = air; airAt = +t.toFixed(3); }
      if (air < 0 && out == null) out = +t.toFixed(3);
    }
  }
  return { hit, worst: +worst.toFixed(2), at, inAt, out, worstAir: +worstAir.toFixed(2), airAt };
})();

/* ========================================================================== */
/* the face                                                                   */
/* ========================================================================== */
/* which bubble, if any, is up enough to be looked at */
const bubOutEnd = k => +(SAY_OUT[k] + 2 * BUB.outStep + BUB.outFor).toFixed(4);
function bubbleUp(t) {
  for (let k = 0; k < BUBBLES.length; k++) if (t >= SAY[k] && t < bubOutEnd(k)) return k;
  return -1;
}
/* the gaze: the bug for the whole of its walk, the pill whenever one is up,
   the lens otherwise. he lets go of the bug on the anticipation, because a
   head that is still tracking while it winds up to lunge is two moves at once
   and neither reads. */
function gazeAt(t) {
  const bugLive = (t >= WALK.t0 && t < BITE.at + GAZE.off)
    ? smooth(span(t, WALK.t0, WALK.t0 + GAZE.in)) * (1 - smooth(span(t, BITE.at, BITE.at + GAZE.off))) : 0;
  let q = 0, v = 0;
  if (bugLive > 0) {
    const b = bugFrame(Math.min(t, WALK.t1 + BUG_SETTLE), ANT_SCHED).body;
    q += clamp((b.x - PLATE.cx) / GAZE.span, -1, 1) * GAZE.max * bugLive;
    v += clamp((b.y - EYE_PAGE_Y) / GAZE.vspan, -1, 1) * bugLive;
  }
  const k = bubbleUp(t);
  if (k >= 0) {
    const w = GAZE.pill * (1 - bugLive) * smooth(span(t, SAY[k], SAY[k] + GAZE.in)) * (1 - smooth(span(t, SAY_OUT[k], SAY_OUT[k] + BUB.outFor)));
    if (w > 0) {
      q += clamp((MID.x - PLATE.cx) / GAZE.span, -1, 1) * GAZE.max * w;
      v += clamp((BUB.py - BUB.h / 2 - EYE_PAGE_Y) / GAZE.vspan, -1, 1) * w;
    }
  }
  return { q: +q.toFixed(5), v: +v.toFixed(5) };
}
/* the arcs: delighted's own numbers, twice and briefly */
function arcAtT(t) {
  let a = 0;
  for (const at of ARC.at) {
    a = Math.max(a, smooth(span(t, at, at + ARC.rise)) * (1 - smooth(span(t, at + ARC.rise + ARC.hold, at + ARC.len))));
  }
  return +a.toFixed(4);
}
const squeezeAt = t => smooth(span(t, SHUT.at, SHUT.at + SHUT.in)) * (1 - smooth(span(t, SHUT.until, SHUT.until + SHUT.out)));
const squintAt = t => (t >= CUT) ? 0 : +(smooth(span(t, SQUINT.at, SQUINT.at + SQUINT.in)) * (1 - smooth(span(t, SQUINT.until, SQUINT.until + SQUINT.out)))).toFixed(4);

function compose(plan, t) {
  const mas = mascotFrame(plan, t);
  /* the gaze first, because everything below multiplies the eye scale the
     turn has already foreshortened. every write is one directional. */
  applyGaze(mas, gazeAt(t));
  const a = arcAtT(t);
  if (a > 0) for (const e of mas.eyes) { e.sy *= lerp(1, ARC.sy, a); e.sx *= lerp(1, ARC.sx, a); e.y += 0.9 * a; }
  const sq = squintAt(t);
  if (sq > 0) for (const e of mas.eyes) { e.sy *= lerp(1, SQUINT.sy, sq); e.sx *= lerp(1, SQUINT.sx, sq); e.y += 0.5 * sq; }
  const sh = squeezeAt(t);
  if (sh > 0) for (const e of mas.eyes) e.sy = Math.min(e.sy, lerp(e.sy, SHUT.sy, sh));
  mas.shadow = { ...mas.shadow, o: 0 };
  return mas;
}

/* ---------- the bubble, on the clock ----------
   the dots first and the pill behind them, and out the other way round. */
function pillPop(t, at, outAt) {
  const inP = span(t, at, at + BUB.pillFor);
  const outP = span(t, outAt, outAt + BUB.outFor);
  if (t < at) return { o: 0, s: BUB.from };
  if (outP >= 1) return { o: 0, s: BUB.outFrom };
  return {
    o: +(span(t, at, at + 0.08) * (1 - outP)).toFixed(4),
    s: +(outP > 0 ? lerp(1, BUB.outFrom, smooth(outP)) : lerp(BUB.from, 1, POP(inP))).toFixed(4),
  };
}
/* bubble k's own state at t, whichever one is actually up. the dots come in
   first and go out last, so the pill's window is always inside theirs. */
function bubbleOf(k, t) {
  const at = SAY[k], out = SAY_OUT[k];
  const d0 = pillPop(t, at, out + 2 * BUB.outStep);
  const d1 = pillPop(t, at + BUB.step, out + BUB.outStep);
  const pl = pillPop(t, at + 2 * BUB.step, out);
  return { k, o: Math.max(d0.o, d1.o, pl.o), dots: [d0, d1], pill: pl };
}
const NO_BUB = { k: -1, o: 0, dots: [{ o: 0, s: 0.4 }, { o: 0, s: 0.4 }], pill: { o: 0, s: BUB.from } };
function bubbleAt(t) {
  const k = bubbleUp(t);
  return k < 0 ? NO_BUB : bubbleOf(k, t);
}

/* ---------- the puff ---------- */
function cloudAt(t) {
  if (t >= CUT) return OFF_CLOUD;
  return PUFFS.map(p => {
    const q = span(t, CLOUD.at + p.delay, CLOUD.at + p.delay + p.life);
    if (q <= 0 || q >= 1) return { o: 0, x: 0, y: 0, s: 1 };
    return {
      o: +(CLOUD.o * Math.sin(Math.PI * q) ** 0.75).toFixed(4),
      x: +(p.dx + SIDE * CLOUD.out * p.out * OUTC(q)).toFixed(2),
      y: +(p.dy - CLOUD.rise * p.rise * q * q).toFixed(2),
      s: +(0.45 + CLOUD.grow * q).toFixed(3),
    };
  });
}

/* ---------- the glitch ---------- */
function glitchAt(f, fps = FPS, windows = GL_WINDOWS) {
  const g = { heat: 0, jx: 0, jy: 0, split: 0, slices: [] };
  const t = f / fps;
  const w = windows.find(x => t >= x.t0 - 1e-9 && t < x.t1 - 1e-9);
  if (!w) return g;
  const r = prng(w.seed ^ (f * 2654435761));
  g.heat = w.heat;
  g.jx = +((r() * 2 - 1) * GL.jumpX * w.heat).toFixed(1);
  g.jy = +((r() * 2 - 1) * GL.jumpY * w.heat).toFixed(1);
  g.split = +(w.heat * (3 + r() * (GL.split - 3))).toFixed(1);
  const n = w.residue ? 0 : GL.slices;
  for (let i = 0; i < n; i++) {
    const h = lerp(GL.sliceH[0], GL.sliceH[1], r());
    g.slices.push({ top: +(r() * (VH - h)).toFixed(1), h: +h.toFixed(1), dx: +((r() * 2 - 1) * GL.sliceDx * w.heat).toFixed(1) });
  }
  return g;
}

/* ---------- what one frame is ---------- */
let PILL_W = PILL_LINES.map(() => 240);
function frameAt(t, f) {
  const wmP = span(t, WM1.at, WM1.at + WM1.for);
  const on = t >= WALK.t0 && t < VANISH_AT && t < CUT;
  const bug = on ? bugPage(bugFrame(t, ANT_SCHED)) : null;
  const b = bubbleAt(t);
  return {
    t: +t.toFixed(4), f,
    mo: t < CUT ? 1 : 0,
    zone: biteZone(t),
    bug: { o: on ? 1 : 0, body: bug ? bug.body : [0, 0, 0], legs: bug ? bug.legs : [], ants: bug ? bug.ants : [] },
    bub: { k: b.k, o: b.o, dots: b.dots, pill: b.pill, w: b.k >= 0 ? PILL_W[b.k] : PILL_W[0] },
    cloud: cloudAt(t),
    g: glitchAt(f),
    wm: { o: t >= WM1.at ? 1 : 0, sc: +(1 + (1 - EASE(wmP)) * 0.085).toFixed(4), glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4) },
  };
}

/* ========================================================================== */
/* the sound                                                                  */
/* ========================================================================== */
/* one tick a footstep and the sputter on the puff, and nothing else. the
   eating is silent on purpose: einz puts his own crunch on that stretch, and a
   synthesised placeholder under a real one is two takes of the same beat
   fighting each other. so between the last footstep and the sputter there is
   nothing at all, and a guard says so. */
function cues() {
  return [
    ...STEPS.map((t, i) => ({ t, kind: 'tick',
      opts: { seed: (0x6ad13f ^ (i * 2654435761)) >>> 0, hz: 288 + (i % 3) * 16 },
      from: 'stride ' + (i + 1) + ', read off the walk' })),
    { t: CLOUD.at, kind: 'fart', opts: FART.sputter, from: 'the puff' },
  ].filter(c => c.t >= 0 && c.t < SECONDS).sort((a, b) => a.t - b.t);
}
const VWORDS = [];
for (let k = 0; k < LINES.length; k++) for (const w of TAKES[k].words) VWORDS.push({ word: w.word, start: +(w.start + OFF[k]).toFixed(4), end: +(w.end + OFF[k]).toFixed(4) });
const VTRACK = new Float32Array(Math.ceil(SECONDS * SR));
for (let k = 0; k < LINES.length; k++) {
  const pcm = PCM[k], e = EDGE[k];
  const a = Math.max(0, Math.round((e.start - PRE) * SR)), b = Math.min(pcm.length, Math.round((e.end + POST) * SR));
  const at = Math.round(OFF[k] * SR) + a, fade = Math.round(EDGE_FADE * SR);
  for (let i = a; i < b; i++) {
    const j = at + (i - a);
    if (j < 0 || j >= VTRACK.length) continue;
    let g = 1;
    if (i - a < fade) g = (i - a) / fade; else if (b - i < fade) g = (b - i) / fade;
    VTRACK[j] += pcm[i] * g;
  }
}
const CUE_LIST = cues();
const ENV = voiceEnvelope(VWORDS, SECONDS);
/* ---------- the two levels, and neither of them is typed ----------
   fix round three asks for the footsteps 12 dB under the voice and the sputter
   as loud as it. both are relationships to the read rather than absolute
   levels, so both are solved against the read's own peak: one probe render at
   the house levels, the two peaks measured off it, and the offsets that put
   them where the brief says. the ticks are measured **after the duck**, because
   they run under line two and the ducked one is the one anybody hears.

   the tick recipe itself does not move. it is already three milliseconds of
   band passed noise and a short pulse, over in a thirtieth of a second, with no
   body under it at all: a dry click by construction rather than a hiss. only
   its level changes, and the sputter is still FART.sputter. */
const TICK_UNDER = 12;
const DUCK = 0.60;
let VOICE_PEAK = 0;
for (let i = 0; i < VTRACK.length; i++) VOICE_PEAK = Math.max(VOICE_PEAK, Math.abs(VTRACK[i]));
const VOICE_PEAK_DB = +(20 * Math.log10(VOICE_PEAK)).toFixed(2);
const TICK_WIN = [STEPS[0] - 0.05, STEPS[STEPS.length - 1] + 0.12];
const LEVELS = (() => {
  const probe = renderSfx(CUE_LIST, SECONDS, {});
  let tickPeak = 0, fartPeak = 0;
  for (let i = 0; i < probe.buf.length; i++) {
    const t = i / SR, v = Math.abs(probe.buf[i]);
    if (t >= TICK_WIN[0] && t <= TICK_WIN[1]) tickPeak = Math.max(tickPeak, v * (1 - DUCK * (ENV[i] || 0)));
    if (t >= CLOUD.at - 0.02) fartPeak = Math.max(fartPeak, v);
  }
  return {
    tick: +(GAINS.tick + (VOICE_PEAK_DB - TICK_UNDER) - 20 * Math.log10(tickPeak)).toFixed(2),
    fart: +(GAINS.fart + VOICE_PEAK_DB - 20 * Math.log10(fartPeak)).toFixed(2),
  };
})();
const SFX = renderSfx(CUE_LIST, SECONDS, { gains: { tick: LEVELS.tick, fart: LEVELS.fart } });
const MIXED = mixdown(VTRACK, SFX.buf, ENV, {});
const WAV = path.join(OUT, 'post37-mix.wav');
const RAW = path.join(OUT, 'post37-mix-raw.wav');
fs.mkdirSync(OUT, { recursive: true });
function attempt(gdb) {
  const buf = Float32Array.from(MIXED.out);
  applyGain(buf, gdb);
  const lim = limit(buf, SAMPLE_CEILING);
  writeWav(RAW, buf);
  return { g: gdb, lim, r: loudness(ffmpeg, RAW) };
}
/* the limiter is the constraint, not the target: the search is for the loudest
   gain whose reduction is still legal, and the target is where it stops. */
let lo = -6, hi = 26, best = null;
for (let i = 0; i < 11; i++) {
  const a = attempt((lo + hi) / 2);
  const legal = a.lim.reduction <= MAX_REDUCTION;
  if (legal && (!best || a.r.lufs > best.r.lufs)) best = a;
  if (!legal || a.r.lufs > TARGET_LUFS) hi = a.g; else lo = a.g;
}
if (!best) best = attempt(0);
{
  const buf = Float32Array.from(MIXED.out);
  applyGain(buf, best.g);
  limit(buf, SAMPLE_CEILING);
  writeWav(WAV, buf);
}
const AFTER = loudness(ffmpeg, WAV);
fs.rmSync(RAW, { force: true });

/* ========================================================================== */
/* the page                                                                   */
/* ========================================================================== */
function sceneHtml() {
  const brand = brandTokens();
  const mcss = mascotCss(plan);
  const tok = /\[data-theme=dark\] \.m-zone\{([^}]*)\}/.exec(mcss)[1];
  const tokens = ['face', 'eye', 'bub'].map(k => '--' + k + ':' + new RegExp('--' + k + ':\\s*([^;]+);').exec(tok)[1]).join(';');
  const chan = (id, row) => `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${row}"/></filter>`;
  const b = BUG.body, h = BUG.head;
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post37</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Nunito:wght@600&display=swap">
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
  --cap:"Nunito",var(--mono);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--cap)}
.vignette{position:fixed;inset:-10%;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 78% 62% at 50% 46%,rgba(255,255,255,.030) 0%,rgba(255,255,255,.010) 46%,rgba(0,0,0,0) 72%);
  will-change:transform,opacity;animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{from{transform:scale(1) translate3d(0,0,0);opacity:.85}to{transform:scale(1.05) translate3d(0,-1.1%,0);opacity:1}}
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;background:var(--bg);overflow:hidden}

/* ---- the bug, post25's ----
   one svg the size of the stage. every point in it is written in page space by
   node, so nothing in here decides anything: the body is a translate, a rotate
   and the scale, and the eight polylines are lists of numbers. the glow is an
   svg filter on the ink group rather than a css filter on the svg, because an
   svg filter's region is the group's own bounding box. */
#bug{position:absolute;inset:0;z-index:2;overflow:visible;pointer-events:none}
#bug .lim{fill:none;stroke:var(--face);stroke-width:${(BUG.legW * SC).toFixed(2)};stroke-linecap:round;stroke-linejoin:round}
#bug .ant{fill:none;stroke:var(--face);stroke-width:${(BUG.ant.w * SC).toFixed(2)};stroke-linecap:round;stroke-linejoin:round}
#bug .sh{fill:var(--face)}

/* ---- the puff, post25's ----
   six soft fields and no drawn shape: a radial gradient is a puff and an
   outline would be a pictogram. it sits under him, so it comes out from behind
   his ink rather than over it, and it is screen blended so it adds light to a
   near black frame rather than sitting on it as a patch. */
#cloud{position:absolute;left:0;top:0;z-index:3;pointer-events:none;filter:blur(9px);mix-blend-mode:screen}
#cloud i{position:absolute;display:block;border-radius:50%;opacity:0;will-change:transform,opacity;
  background:radial-gradient(circle,
    color-mix(in srgb, var(--accent) 70%, transparent) 0%,
    color-mix(in srgb, var(--accent) 26%, transparent) 46%,
    rgba(0,0,0,0) 72%)}

/* his own cut, as a wrapper rather than a rule on the zone: the zone carries
   the eating and a second thing writing it would be two things on one channel. */
#mas-cut{position:absolute;inset:0;z-index:4;opacity:1}
${mcss}
.m-glow-mid{filter:blur(${GLOW.mid.blur}px)}
.m-glow-wide{filter:blur(${GLOW.wide.blur}px)}

/* ---- the bubble: the house thought bubble, two dots and a pill ----
   the dots are the tail and they point back at him. the pill's tokens are the
   module's own dark ones, read off its css rather than typed again. */
.sb{${tokens};position:absolute;inset:0;z-index:6;pointer-events:none}
.sb i{position:absolute;display:block;border-radius:50%;background:var(--eye);border:${BUBBLE.stroke}px solid var(--bub);
  opacity:0;will-change:transform,opacity}
#sb-d0{left:${(BUB.c0x - BUB.d0 / 2).toFixed(2)}px;top:${(BUB.c0y - BUB.d0 / 2).toFixed(2)}px;width:${BUB.d0}px;height:${BUB.d0}px}
#sb-d1{left:${(BUB.c1x - BUB.d1 / 2).toFixed(2)}px;top:${(BUB.c1y - BUB.d1 / 2).toFixed(2)}px;width:${BUB.d1}px;height:${BUB.d1}px}
.sb .p{position:absolute;left:50%;top:${BUB.py}px;width:var(--pill-w,240px);height:${BUB.h}px;
  margin-left:calc(var(--pill-w,240px) / -2);margin-top:${-BUB.h}px;
  border:${BUBBLE.stroke}px solid var(--bub);border-radius:${BUBBLE.radius}px;background:var(--eye);
  transform-origin:var(--pill-ox,62%) 100%;opacity:0;will-change:transform,opacity}
.sb .p span{position:absolute;left:50%;top:${BUB.padY}px;transform:translateX(-50%);
  color:var(--face);font-family:var(--cap);font-weight:${BUB.weight};font-size:${BUB.size}px;
  line-height:${BUB.lh};letter-spacing:.005em;white-space:nowrap;opacity:0}

/* ---- the end card: the wordmark alone on the middle of the frame ---- */
.wm{position:absolute;left:50%;top:${CENTRE_Y}px;transform:translate(-50%,-50%) scale(var(--wm-s,1));transform-origin:50% 50%;
  font-family:var(--display);font-weight:400;color:var(--fg);text-align:center;text-transform:uppercase;letter-spacing:.18em;
  line-height:${WM.lh};white-space:nowrap;text-indent:.09em;opacity:var(--wm-o,0);
  text-shadow:0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),0 0 66px rgba(255,255,255,.10);
  filter:brightness(var(--wm-glow,1));z-index:8}
.wm span{display:block}

/* ---- the glitch: the clean frame, back as an image, cut up ---- */
.gl{position:absolute;inset:0;z-index:30;background:var(--bg);isolation:isolate;overflow:hidden;display:none}
.gl img{position:absolute;left:0;top:0;width:${VW}px;height:${VH}px;display:block;will-change:transform}
.gl .ch{mix-blend-mode:screen}
.gl .r{filter:url(#p37-r)}
.gl .g{filter:url(#p37-g)}
.gl .b{filter:url(#p37-b)}
.gl .sl{position:absolute;inset:0;overflow:hidden;clip-path:inset(var(--st,0px) 0 var(--sb,100%) 0)}
</style>
</head>
<body>
<div class="vignette" aria-hidden="true"></div>
<div class="stage" id="stage">
  <svg id="bug" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}" aria-hidden="true">
    <defs>
      <filter id="bug-glow" x="-70%" y="-70%" width="240%" height="240%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b1"/>
        <feComponentTransfer in="b1" result="b1o"><feFuncA type="linear" slope="0.50"/></feComponentTransfer>
        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b2"/>
        <feComponentTransfer in="b2" result="b2o"><feFuncA type="linear" slope="0.26"/></feComponentTransfer>
        <feMerge><feMergeNode in="b2o"/><feMergeNode in="b1o"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g id="bug-ink" filter="url(#bug-glow)">
      <g id="bug-limbs">
${Array.from({ length: 6 }, (_, i) => '        <polyline class="lim" id="bug-leg' + i + '" points=""/>').join('\n')}
${Array.from({ length: 2 }, (_, i) => '        <polyline class="ant" id="bug-ant' + i + '" points=""/>').join('\n')}
      </g>
      <g id="bug-body">
        <rect class="sh" x="${-b.l / 2}" y="${-b.w / 2}" width="${b.l}" height="${b.w}" rx="${b.r}"/>
        <rect class="sh" x="${b.l / 2 + h.gap}" y="${-h.w / 2}" width="${h.l}" height="${h.w}" rx="${h.r}"/>
      </g>
    </g>
  </svg>
  <div id="cloud" aria-hidden="true">${PUFFS.map(p => '<i style="width:' + (p.r * 2).toFixed(1)
    + 'px;height:' + (p.r * 2).toFixed(1) + 'px;left:' + (CLOUD.from.x - p.r).toFixed(1)
    + 'px;top:' + (CLOUD.from.y - p.r).toFixed(1) + 'px"></i>').join('')}</div>
  <div id="mas-cut">${mascotMarkup(plan)}</div>
  <div class="sb" id="sb">
    <i id="sb-d0"></i><i id="sb-d1"></i>
    <span class="p" id="sb-p">${PILL_LINES.map((l, i) => '<span id="pl' + i + '">' + l + '</span>').join('')}</span>
  </div>
  <div class="wm" id="wm">${WM.lines.map(l => '<span>' + l + '</span>').join('')}</div>
  <div class="gl" id="gl">
    <img class="ch r" id="gl-r" alt=""><img class="ch g" id="gl-g" alt=""><img class="ch b" id="gl-b" alt="">
    ${Array.from({ length: GL.slices }, (_, i) => '<div class="sl" id="sl' + i + '"><img id="sl' + i + 'i" alt=""></div>').join('\n    ')}
  </div>
  <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    ${chan('p37-r', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0')}
    ${chan('p37-g', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0')}
    ${chan('p37-b', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0')}
  </defs></svg>
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
window.__P37 = ${JSON.stringify({ VW, VH, DSF, SC, WM, SLICES: GL.slices, LINES: PILL_LINES.length, PAD: BUB.padX, STROKE: BUBBLE.stroke, D1X: BUB.c1x, FLOOR: FLOOR_CSS })};
${mascotRuntime()}
(${scenePage.toString()})();
Promise.all([document.fonts.load('400 40px Michroma'), document.fonts.load('${BUB.weight} ${BUB.size}px Nunito')])
  .then(function () { return document.fonts.ready; })
  .then(function () { window.__built = Object.assign({}, window.__p37.fit(), { mas: window.__mas.build() }); });
</script>
</body>
</html>`;
}

function scenePage() {
  const P = window.__P37;
  const stage = document.getElementById('stage');
  const bug = document.getElementById('bug');
  const bugBody = document.getElementById('bug-body');
  const legs = [0, 1, 2, 3, 4, 5].map(i => document.getElementById('bug-leg' + i));
  const ants = [0, 1].map(i => document.getElementById('bug-ant' + i));
  const puffs = [].slice.call(document.querySelectorAll('#cloud i'));
  const zone = document.getElementById('m-zone');
  const cut = document.getElementById('mas-cut');
  const dots = [document.getElementById('sb-d0'), document.getElementById('sb-d1')];
  const pill = document.getElementById('sb-p');
  const texts = [];
  for (let i = 0; i < P.LINES; i++) texts.push(document.getElementById('pl' + i));
  const wm = document.getElementById('wm');
  const gl = document.getElementById('gl');
  const chans = ['r', 'g', 'b'].map(k => document.getElementById('gl-' + k));
  const slices = [], sliceImgs = [];
  for (let i = 0; i < P.SLICES; i++) { slices.push(document.getElementById('sl' + i)); sliceImgs.push(document.getElementById('sl' + i + 'i')); }
  let widths = texts.map(() => 240);
  const pts = a => { let s = ''; for (let i = 0; i < a.length; i += 2) s += (i ? ' ' : '') + a[i] + ',' + a[i + 1]; return s; };
  const rg = el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
  const capOf = el => {
    const cs = getComputedStyle(el);
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    return { cap: cv.measureText('H').actualBoundingBoxAscent || 0, font: cv.font };
  };
  const box = (r, d) => ({ left: +(r.left * d).toFixed(1), top: +(r.top * d).toFixed(1),
    right: +((P.VW - r.right) * d).toFixed(1), bottom: +((P.VH - r.bottom) * d).toFixed(1),
    w: +((r.right - r.left) * d).toFixed(1), h: +((r.bottom - r.top) * d).toFixed(1) });
  const cssBox = r => ({ cssLeft: +r.left.toFixed(2), cssTop: +r.top.toFixed(2), cssRight: +r.right.toFixed(2), cssBottom: +r.bottom.toFixed(2) });
  window.__p37 = {
    fit() {
      wm.style.fontSize = '100px';
      let widest = 0;
      for (const sp of wm.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      const ws = 100 * P.WM.w / widest;
      wm.style.fontSize = ws.toFixed(2) + 'px';
      widths = texts.map(el => +(rg(el).width + 2 * P.PAD + 2 * P.STROKE).toFixed(2));
      return { wm: +ws.toFixed(2), widths };
    },
    measure() {
      const d = P.DSF;
      const c = capOf(wm);
      let widest = 0;
      for (const sp of wm.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      const was = pill.style.transform, wasW = pill.style.getPropertyValue('--pill-w');
      pill.style.transform = 'none';
      const lines = [];
      for (let i = 0; i < texts.length; i++) {
        pill.style.setProperty('--pill-w', widths[i] + 'px');
        const pr = pill.getBoundingClientRect();
        const tr = rg(texts[i]);
        lines.push(Object.assign({}, box(pr, d), cssBox(pr), {
          text: texts[i].textContent, w: widths[i],
          inside: tr.left >= pr.left + 1 && tr.right <= pr.right - 1 && tr.top >= pr.top && tr.bottom <= pr.bottom,
        }));
      }
      pill.style.transform = was; pill.style.setProperty('--pill-w', wasW);
      const bs = getComputedStyle(pill);
      const dr = dots.map(el => Object.assign({}, cssBox(el.getBoundingClientRect()), {
        fill: getComputedStyle(el).backgroundColor, stroke: getComputedStyle(el).borderTopWidth }));
      return {
        wm: Object.assign({}, box(wm.getBoundingClientRect(), d), { widestPx: +(widest * d).toFixed(1), capPx: +(c.cap * d).toFixed(1), font: c.font,
          midY: +((wm.getBoundingClientRect().top + wm.getBoundingClientRect().bottom) / 2).toFixed(2) }),
        pill: { lines, font: capOf(texts[0]).font, stroke: bs.borderTopWidth, bg: bs.backgroundColor },
        dots: dr,
        bug: { legs: legs.length, ants: ants.length, ink: getComputedStyle(document.querySelector('#bug .lim')).stroke,
          body: getComputedStyle(document.querySelector('#bug .sh')).fill },
        cloud: { blobs: puffs.length, bg: getComputedStyle(puffs[0]).backgroundImage, filter: getComputedStyle(document.getElementById('cloud')).filter },
      };
    },
    apply(o) {
      const s = stage.style;
      cut.style.opacity = o.mo ? 1 : 0;
      /* the zone: translate, then rotate, then scale, so he is carried to where
         he is standing and then deformed about the place he is standing. */
      const z = o.zone;
      zone.style.transform = 'translate(' + z.x.toFixed(2) + 'px,' + z.y.toFixed(2) + 'px) rotate('
        + z.rot.toFixed(2) + 'deg) scale(' + z.sx.toFixed(5) + ',' + z.sy.toFixed(5) + ')';
      /* off screen the bug is switched off rather than left at nought: a
         filtered group is still rastered at opacity zero. */
      bug.style.visibility = o.bug.o ? 'visible' : 'hidden';
      if (o.bug.o) {
        bugBody.setAttribute('transform', 'translate(' + o.bug.body[0] + ' ' + o.bug.body[1] + ') rotate(' + o.bug.body[2] + ') scale(' + P.SC + ')');
        for (let i = 0; i < legs.length; i++) legs[i].setAttribute('points', pts(o.bug.legs[i]));
        for (let i = 0; i < ants.length; i++) ants[i].setAttribute('points', pts(o.bug.ants[i]));
      }
      for (let i = 0; i < puffs.length; i++) {
        const c = o.cloud[i];
        puffs[i].style.opacity = c.o;
        puffs[i].style.transform = 'translate3d(' + c.x + 'px,' + c.y + 'px,0) scale(' + c.s + ')';
      }
      /* the bubble: the two dots, then the pill, then which line is in it */
      for (let i = 0; i < 2; i++) {
        dots[i].style.opacity = o.bub.dots[i].o.toFixed(4);
        dots[i].style.transform = 'scale(' + o.bub.dots[i].s.toFixed(4) + ')';
      }
      pill.style.opacity = o.bub.pill.o.toFixed(4);
      pill.style.setProperty('--pill-w', o.bub.w.toFixed(2) + 'px');
      /* the spring origin is the point on the pill's bottom edge nearest the
         dots, so it grows out of them rather than out of its own middle. */
      const left = P.VW / 2 - o.bub.w / 2;
      const ox = Math.max(10, Math.min(o.bub.w - 10, P.D1X - left));
      pill.style.setProperty('--pill-ox', (ox / o.bub.w * 100).toFixed(2) + '%');
      pill.style.transform = 'scale(' + o.bub.pill.s.toFixed(4) + ')';
      for (let k = 0; k < texts.length; k++) texts[k].style.opacity = (k === o.bub.k ? 1 : 0);
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

/* ---------- the server and the page's clock ---------- */
function serve(html) {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      res.end(html);
    });
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

/* ---------- the fast things, at sixty, on screen ---------- */
const fastest = (fn, a, b) => {
  let d = 0, at = a;
  for (let f = Math.ceil(a * 60 - 1e-6); f < Math.ceil(b * 60); f++) { const s = Math.abs(fn((f + 1) / 60) - fn(f / 60)); if (s > d) { d = s; at = f / 60; } }
  return { d: +d.toFixed(2), at: +at.toFixed(3) };
};
const popStep = fastest(t => biteZone(t).y, POP_IN.at, LAND + 0.05);
const lungeStep = fastest(t => biteZone(t).y, BITE.at, BITE_END);
const bugStep = (() => {
  let d = 0, at = WALK.t0;
  for (let f = Math.floor(WALK.t0 * 60); f / 60 < WALK.t1; f++) {
    const a = bugFrame(f / 60, ANT_SCHED).body, b = bugFrame((f + 1) / 60, ANT_SCHED).body;
    const s = Math.hypot(b.x - a.x, b.y - a.y);
    if (s > d) { d = s; at = f / 60; }
  }
  return { d: +d.toFixed(2), at: +at.toFixed(3) };
})();
const FASTEST = Math.max(popStep.d, lungeStep.d, bugStep.d);
const shutterOpen = t => BLUR && (t >= POP_IN.at - 1e-9);
if (BLUR) { SUB = BLUR_ARG ? Math.max(2, Math.min(SUB_MAX, Math.round(BLUR_ARG))) : Math.max(2, Math.min(SUB_MAX, Math.ceil(FASTEST / SUB_STEP_WANT))); SUBSTEP = STEP / SUB; }

/* ---------- the clock, printed ---------- */
console.log(describeMascot(plan));
console.log(describeMotion(rep));
console.log('\n  the read, elevenlabs, the narrator, ' + RATE);
for (const t of TAKES) {
  const w = t.words;
  console.log('    line ' + (t.i + 1) + '  "' + t.text + '"' + (t.cached ? '  cached' : '  fetched')
    + (t.sentences > 1 ? ', ' + t.sentences + ' sentences, stops of ' + t.gaps.map(g => (g * 1000).toFixed(0) + 'ms').join(', ') : '')
    + '\n             sound ' + SOUND[t.i].start.toFixed(2) + ' to ' + SOUND[t.i].end.toFixed(2) + 's, '
    + (w.length / (w[w.length - 1].end - w[0].start)).toFixed(2) + ' words a second');
  if (VOICE_ONLY) console.log('             words: ' + w.map((x, k) => k + ':' + x.word).join(' '));
}
console.log('\n  the lane, derived');
for (const g of PATH.segs) console.log('    ' + String(g.at.toFixed(0)).padStart(4) + 'px  ' + g.kind.padEnd(4) + ' ' + g.len.toFixed(1) + 'px  ' + g.why);
console.log('    ' + PATH.len.toFixed(1) + 'px of lane in ' + WALK.for + 's, ' + STEPS.length + ' strides, floor at ' + LANE + ', left lane at ' + LEFT);
console.log('    the lunge goes ' + BITE.by + 'px, inside a ' + DEPTH.lo + ' to ' + DEPTH.hi + ' window (margin ' + DEPTH.margin + '), containment ' + DEPTH.hold);
console.log('    the bug clears his ink by ' + CLEAR.worst + 'px at worst, at ' + CLEAR.at + 's; worst air to a safe line ' + CLEAR.worstAir + 'px');
console.log('\n  the beats');
const beats = [
  [POP_IN.at, 'the pop from under the bottom edge to the middle on the rise, ' + POP_IN.for + 's'],
  ...SAY.map((t, k) => [t, 'bubble ' + (k + 1) + ' pops, "' + BUBBLES[k].text + '", on "' + TAKES[BUBBLES[k].line].parts[BUBBLES[k].s] + '"']),
  ...SAY_OUT.map((t, k) => [t, 'bubble ' + (k + 1) + ' pops out']),
  ...ARC.at.map(t => [t, 'the happy arcs, ' + ARC.len + 's']),
  [WALK.t0, 'the bug walks in over the top edge, ' + WALK.for + 's of lane, and his eyes follow it'],
  [WALK.t1, 'it stops under him and plants its feet over ' + BUG_SETTLE + 's'],
  [BITE.at, 'he rises ' + BITE.riseBy + 'px'],
  [BITE_HIT, 'the lunge lands, the bug is gone, and the squash is ' + BITE.squash],
  [CHEW.at, 'three chews, ' + CHEW.for + 's each, the side alternating'],
  ...CHEW_HITS.map((t, i) => [t, 'chew ' + (i + 1) + ' of ' + CHEW.pulses]),
  [CHEW_END, 'the bob, and the small shake after it'],
  [CLOUD.at, 'the puff, with the sputter on it; the eyes squint'],
  [CLOUD_END, 'the puff is gone'],
  ...plan.idle.blinks.filter(b => b.t < CUT).map(b => [b.t, 'an idle blink, the module\'s']),
  ...GL_WINDOWS_60.map((w, i) => [w.t0, (w.residue ? 'the residue on the first end card frame, ' : 'burst ' + (i + 1) + ', ') + w.frames + ' frame' + (w.frames > 1 ? 's' : '') + ' at sixty, heat ' + w.heat]),
  [CUT, 'the cut: he is gone, the wordmark pops on the middle of the frame, held ' + END_HOLD + 's'],
  [SECONDS, 'end'],
].sort((a, b) => a[0] - b[0]);
for (const [t, what] of beats) console.log('    ' + t.toFixed(2).padStart(5) + 's  ' + what);
console.log('  seed ' + SEED + ': blinks at ' + plan.idle.blinks.filter(b => b.t < SECONDS).map(b => b.t.toFixed(2)).join(', '));
console.log('\n  the bubbles: a pill at his side would have ' + BUB.sideRoom + ' css px before the safe line, and the shortest of the six is '
  + Math.min(...PILL_W).toFixed(0) + ' — so every one of them goes over his head with the tail on it');
console.log('\n  the fast things, at sixty, on screen');
console.log('    the pop moves ' + popStep.d + ' css px a frame, the lunge ' + lungeStep.d + ', the bug ' + bugStep.d);
console.log('  the shutter: ' + (BLUR ? SUB + ' subframes' + (BLUR_ARG ? ' because --blur=' + BLUR_ARG + ' said so' : ', solved') + ', ' + (FASTEST * 60 / FPS / SUB).toFixed(2) + ' css px between samples at ' + FPS : 'closed'));
console.log('\n  the sound');
console.log(describeMix(SFX.report, {
  'the voice': TAKES.reduce((a, t) => a + t.sentences, 0) + ' elevenlabs takes on the narrator at ' + RATE
    + ', assembled into ' + LINES.length + ' lines with ' + BREAK_MS + 'ms at every stop',
  'the walk': STEPS.length + ' dry clicks at ' + LEVELS.tick + ' dB, one a footstep, ' + STEPS[0].toFixed(2) + ' to '
    + STEPS[STEPS.length - 1].toFixed(2) + 's, and they stop with the walk',
  'the levels': 'the read peaks at ' + VOICE_PEAK_DB + ' dBFS; the clicks are solved to ' + TICK_UNDER
    + ' dB under it after the duck and the sputter to the same peak, both off one probe render',
  'the eating': 'silent on purpose, ' + (CLOUD.at - STEPS[STEPS.length - 1]).toFixed(2) + 's of nothing between the last footstep and the sputter',
  'the bus': (AFTER.lufs == null ? '?' : AFTER.lufs) + ' LUFS, bus peak ' + (20 * Math.log10(MIXED.busPeak)).toFixed(1)
    + ' dBFS against the voice at ' + (20 * Math.log10(MIXED.voicePeak)).toFixed(1) + ', gain ' + best.g.toFixed(1),
}));

if (VOICE_ONLY) process.exit(0);

/* ========================================================================== */
/* render                                                                     */
/* ========================================================================== */
async function render() {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  for (const d of [FRAMES, SUBS]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  fs.mkdirSync(OUT, { recursive: true });
  const N = Math.round(FPS * SECONDS);
  const { srv, port } = await serve(sceneHtml());
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none', '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio',
      '--run-all-compositor-stages-before-draw'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });
  await page.evaluateOnNewDocument(injected);
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }, { name: 'prefers-color-scheme', value: 'dark' }] });
  let expired = null;
  cdp.on('Emulation.virtualTimeBudgetExpired', () => { const f = expired; expired = null; if (f) f(); });
  const advance = async ms => {
    const p = new Promise(r => { expired = r; });
    await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pauseIfNetworkFetchesPending', budget: ms });
    await p;
  };
  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' });
  for (let i = 0; i < 400; i++) {
    const ok = await page.evaluate(() => !!(window.__built && window.__mas && window.__mas.ready && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  if (errors.length) throw new Error('the page threw: ' + errors.join(' | '));
  if (!await page.evaluate(() => !!window.__built)) throw new Error('the scene never became ready');
  for (const [f, what] of [['400 40px "Michroma"', 'the wordmark'], [BUB.weight + ' ' + BUB.size + 'px "Nunito"', 'the pill']]) {
    if (!await page.evaluate(q => document.fonts.check(q), f)) throw new Error(f + ' did not load, and ' + what + ' would be judged in the fallback');
  }
  const built = await page.evaluate(() => window.__built);
  PILL_W = built.widths;
  const measured = await page.evaluate(() => window.__p37.measure());
  console.log('\n  built: head ' + built.mas.headPx + 'px, ' + built.mas.eyes + ' eyes, ' + built.mas.glows + ' glow layers, theme ' + built.mas.theme);
  for (const l of measured.pill.lines) console.log('  the pill: "' + l.text + '", ' + l.w + ' css px, clear ' + l.left + ' / ' + l.top + ' / ' + l.right + ' / ' + l.bottom);
  console.log('  the tail: ' + measured.dots.length + ' dots in ' + measured.dots[0].fill + ' with a ' + measured.dots[0].stroke + ' outline');
  console.log('  the bug: ' + measured.bug.legs + ' legs, ' + measured.bug.ants + ' antennae, ink ' + measured.bug.ink);
  console.log('  the puff: ' + measured.cloud.blobs + ' fields under ' + measured.cloud.filter);

  const put = async (t, f) => {
    const mf = compose(plan, t);
    const o = frameAt(t, f);
    await page.evaluate(fr => window.__mas.apply(fr), mf);
    await page.evaluate(fr => window.__p37.apply(fr), o);
    if (o.g.heat > 0) {
      const clean = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
      const ok = await page.evaluate((src, g) => window.__p37.glitch(src, g), 'data:image/png;base64,' + clean.data, o.g);
      if (!ok) throw new Error('the glitch image did not decode at ' + t);
    }
    return { mf, o };
  };

  let worst = null;
  for (let f = 0; f < N; f++) {
    const t = f / FPS;
    if (t < LAND || t >= CUT) continue;
    const z = biteZone(t);
    const r = headRect(plan, compose(plan, t));
    const near = Math.min(r.left + z.x * DSF, r.top + z.y * DSF, r.right - z.x * DSF, r.bottom - z.y * DSF);
    if (!worst || near < worst.near) worst = { t: +t.toFixed(3), near: +near.toFixed(1) };
  }

  const sigs = [];
  const wall = Date.now();
  let glitched = 0, sharp = 0;
  for (let f = 0; f < N; f++) {
    const open = shutterOpen(f / FPS);
    if (!open) sharp++;
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      if (k > 0 && !open) {
        fs.copyFileSync(path.join(SUBS, 's' + String(f * SUB).padStart(6, '0') + '.jpg'), path.join(SUBS, 's' + String(idx).padStart(6, '0') + '.jpg'));
        await advance(SUBSTEP);
        continue;
      }
      const t = f / FPS + k / (FPS * SUB);
      const { mf, o } = await put(t, f);
      if (k === 0 && o.g.heat > 0) glitched++;
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);
      let s = o.mo * 7 + o.zone.x * 11 + o.zone.y * 13 + o.zone.sx * 17 + o.zone.sy * 19 + o.zone.rot * 23
        + o.bug.o * 29 + (o.bug.body[0] || 0) * 31 + (o.bug.body[1] || 0) * 37 + (o.bug.body[2] || 0) * 41
        + o.bub.o * 43 + o.bub.pill.o * 47 + o.bub.pill.s * 53 + o.bub.w * 59 + (o.bub.k + 2) * 61
        + o.bub.dots[0].o * 67 + o.bub.dots[0].s * 71 + o.bub.dots[1].o * 73 + o.bub.dots[1].s * 79
        + o.g.heat * 83 + o.g.jx * 89 + o.g.jy * 97 + o.g.split * 101 + o.g.slices.length * 103
        + o.wm.o * 107 + o.wm.sc * 109 + o.wm.glow * 113;
      for (let i = 0; i < o.cloud.length; i++) s += o.cloud[i].o * (127 + i) + o.cloud[i].x * (149 + i) + o.cloud[i].y * (167 + i) + o.cloud[i].s * (191 + i);
      if (o.bug.o) for (const L of o.bug.legs) for (const v of L) s += v * 0.013;
      s += mf.card.x * 211 + mf.card.y * 223 + mf.card.rot * 227 + mf.card.sx * 229 + mf.card.sy * 233;
      for (let e = 0; e < 2; e++) s += mf.eyes[e].x * (239 + e) + mf.eyes[e].y * (251 + e) + mf.eyes[e].lid * (257 + e) + mf.eyes[e].sy * (263 + e) + mf.eyes[e].sx * (269 + e);
      if (k === 0) sigs.push(0);
      sigs[f] = +(sigs[f] + s * (open ? k + 1 : SUB * (SUB + 1) / 2)).toFixed(6);
      const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 94, captureBeyondViewport: false, clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
      const file = SUB > 1 ? path.join(SUBS, 's' + String(idx).padStart(6, '0') + '.jpg') : path.join(FRAMES, 'f' + String(f).padStart(5, '0') + '.jpg');
      fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
      await advance(SUBSTEP);
    }
    if (f % 60 === 0) console.log('  ' + String(f).padStart(4) + '/' + N + '  t=' + (f / FPS).toFixed(2) + 's  ' + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
  }
  if (errors.length) throw new Error('the page threw while rendering: ' + errors.join(' | '));

  fs.rmSync(VERIFY, { recursive: true, force: true });
  fs.mkdirSync(VERIFY, { recursive: true });
  const stills = [
    [WALK.t0 + WALK.for * 0.52, 'a-the-bug-walking-in-his-eyes-on-it'],
    [VANISH_AT, 'b-the-bite'],
    [CLOUD.at + 0.34, 'c-the-fart-and-the-squint'],
    [SAY[1] + 0.55, 'd-a-bubble-with-its-tail'],
  ];
  for (const [want, name] of stills) {
    const f = Math.max(0, Math.min(N - 1, Math.round(want * FPS)));
    await put(f / FPS, f);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
    fs.writeFileSync(path.join(VERIFY, name + '.png'), Buffer.from(shot.data, 'base64'));
  }
  console.log('  his ink, worst clearance from the landing to the cut: ' + worst.near + ' device px at ' + worst.t + 's (floor ' + Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom) + ')');
  await browser.close();
  srv.close();
  if (SUB > 1) blend(N);
  const state = { built, measured, head: worst, sigs, frames: N, glitched, sharp };
  fs.writeFileSync(path.join(OUT, 'post37.json'), JSON.stringify(state, null, 2));
  return state;
}

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }
function blend(N) {
  console.log('  blending ' + N * SUB + ' subframes into ' + N + ' frames ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS * SUB), '-i', path.join(SUBS, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1) + ',setpts=PTS-STARTPTS,framestep=' + SUB, '-q:v', '2', path.join(FRAMES, 'f%05d.jpg')]);
}
function encode(wav) {
  const out = path.join(OUT, 'post37-dark-1080x1920.mp4');
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'), '-i', wav,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
  return out;
}
function probe(file) {
  let out = '';
  try { execFileSync(ffmpeg, ['-hide_banner', '-i', file], { stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { out = (e.stderr || '').toString(); }
  const dur = out.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const res = out.match(/,\s*(\d{2,5})x(\d{2,5})[\s,]/);
  const fps = out.match(/([\d.]+)\s*fps/);
  return { seconds: dur ? (+dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3])) : null, w: res ? +res[1] : null, h: res ? +res[2] : null,
    fps: fps ? parseFloat(fps[1]) : null, audio: /Audio:\s*aac/.test(out) };
}

const state = ONLY_ENCODE ? JSON.parse(fs.readFileSync(path.join(OUT, 'post37.json'), 'utf8')) : await render();
PILL_W = state.built.widths;
const file = encode(WAV);
const p = probe(file);
const lu = loudness(ffmpeg, file);
console.log('\nrendered');
console.log('  ' + p.w + 'x' + p.h + ' @' + p.fps + 'fps  ' + p.seconds.toFixed(2) + 's  ' + (p.audio ? 'with sound' : 'SILENT') + '  '
  + (fs.statSync(file).size / 1e6).toFixed(2) + ' MB  ' + path.relative(ROOT, file));
console.log('  the shutter is ' + (BLUR ? 'open, ' + SUB + ' subframes to a frame' : 'closed'));
if (lu && lu.ok) console.log('  loudness ' + lu.lufs + ' LUFS integrated, true peak ' + lu.truePeak + ' dBFS, measured on the mp4');
console.log('  ' + state.glitched + ' glitched frames of ' + state.frames);
console.log('  four stills in ' + path.relative(ROOT, VERIFY));
if (!KEEP && !ONLY_ENCODE) { fs.rmSync(FRAMES, { recursive: true, force: true }); fs.rmSync(SUBS, { recursive: true, force: true }); }

/* ========================================================================== */
/* the guards                                                                 */
/* ========================================================================== */
const fail = [];
console.log('\nchecks');
if (p.w !== VW * DSF || p.h !== VH * DSF) fail.push('the file is ' + p.w + 'x' + p.h);
if (Math.abs(p.fps - FPS) > 0.01) fail.push('the file runs at ' + p.fps + 'fps rather than ' + FPS);
if (Math.abs(p.seconds - SECONDS) > 0.15) fail.push('the file runs ' + p.seconds.toFixed(2) + 's rather than ' + SECONDS);
if (!p.audio) fail.push('the file has no audio track');
if (state.frames !== Math.round(FPS * SECONDS)) fail.push('rendered ' + state.frames + ' frames');

/* ---------- there is no pacman anywhere in this file ---------- */
{
  /* the comments are prose and the words below are built out of fragments, so
     neither the header nor this guard can match itself. what is left is code. */
  const src = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
  for (const word of ['pac' + 'man', 'wedge' + 'Clip', 'CH' + 'OMP', 'clip' + 'At']) {
    if (new RegExp('\b' + word + '\b', 'i').test(src)) fail.push('"' + word + '" is still in the code of this file');
  }
  if (/clip-path/.test(sceneHtml().split('==== this clip\'s own css starts here ====')[1].split('</style>')[0].replace(/\.gl \.sl\{[^}]*\}/, ''))) {
    fail.push('a clip-path is still written on something that is not a glitch slice');
  }
}

/* ---------- the read ---------- */
{
  for (const t of TAKES) {
    if (t.provider !== 'elevenlabs') fail.push('take ' + (t.i + 1) + ' is ' + t.provider);
    if (t.elevenId !== 'narrator') fail.push('take ' + (t.i + 1) + ' is the ' + t.elevenId + ' voice, not the narrator');
    if (t.timing !== 'engine') fail.push('take ' + (t.i + 1) + ' came back with estimated timings');
    for (const g of t.gaps) if (Math.abs(g * 1000 - BREAK_MS) > 12) fail.push('a stop in line ' + (t.i + 1) + ' is ' + (g * 1000).toFixed(0) + 'ms, not ' + BREAK_MS);
  }
  if (TAKES[0].text !== 'we made two free tools. what should we make next.') fail.push('line one is "' + TAKES[0].text + '"');
  if (TAKES[1].text !== 'or maybe we need to fix some bug for you.') fail.push('line two is "' + TAKES[1].text + '"');
  if (TAKES[2].text !== 'maybe fresh air. or you have a better idea. do not be shy, share it.') fail.push('line three is "' + TAKES[2].text + '"');
  if (TAKES.reduce((a, t) => a + t.sentences, 0) !== BUBBLES.length) fail.push('the sentences and the bubbles do not match one to one');
  if (Math.abs(SC_T[0] - (LAND + LEAD_IN)) > TICK_TOL) fail.push('line one does not start on the landing plus ' + LEAD_IN);
  if (Math.abs(SC_T[1] - (SOUND[0].end + AFTER_LINE)) > TICK_TOL) fail.push('line two does not start ' + AFTER_LINE + ' after line one');
  if (Math.abs(SC_T[2] - SC2_WANT) > TICK_TOL) fail.push('line three has air in front of it that neither the read nor the puff asked for');
  if (Math.abs(CUT - (SOUND[2].end + AFTER_READ)) > TICK_TOL) fail.push('the cut is not ' + AFTER_READ + ' after the last word');
  for (let i = 1; i < TAKES.length; i++) if (SOUND[i - 1].end > SOUND[i].start) fail.push('lines ' + i + ' and ' + (i + 1) + ' overlap');
  if (lu && lu.ok && lu.lufs > TARGET_LUFS + 0.5) fail.push('the file measures ' + lu.lufs + ' LUFS, over the ' + TARGET_LUFS + ' target');
  if (lu && lu.ok && lu.truePeak > PEAK_CEILING + 0.2) fail.push('the file peaks at ' + lu.truePeak + ' dBTP');
}

/* ---------- the sound: ticks on the walk, the sputter on the puff, nothing else ---------- */
{
  const kinds = [...new Set(CUE_LIST.map(c => c.kind))].sort();
  if (kinds.join(',') !== 'fart,tick') fail.push('the bus carries ' + kinds.join(', ') + ' and it should carry a tick and a fart');
  if (CUE_LIST.filter(c => c.kind === 'fart').length !== 1) fail.push('there is not exactly one sputter');
  if (CUE_LIST.filter(c => c.kind === 'tick').length !== STEPS.length) fail.push('the ticks and the strides do not match');
  const fartCue = CUE_LIST.find(c => c.kind === 'fart');
  if (Math.abs(fartCue.t - CLOUD.at) > TICK_TOL) fail.push('the sputter is not on the puff');
  if (fartCue.opts !== FART.sputter) fail.push('the fart is not the sputter recipe from lib/sfx.mjs');
  /* the ticks stop with the walk, and nothing at all is on the bus between the
     last footstep and the sputter */
  const lastTick = STEPS[STEPS.length - 1];
  if (lastTick > WALK.t1 + 1e-6) fail.push('a tick lands after the walk has stopped');
  if (lastTick > BITE.at) fail.push('a tick lands after he starts the bite');
  const intruder = CUE_LIST.find(c => c.t > lastTick + 1e-6 && c.t < CLOUD.at - 1e-6);
  if (intruder) fail.push('a ' + intruder.kind + ' at ' + intruder.t + ' is inside the stretch that is meant to be silent');
  if (/crunch/.test(CUE_LIST.map(c => c.kind).join(','))) fail.push('there is a crunch on the bus and einz is adding his own');
  /* quiet under the voice: the bus peak is under the voice's, and the fart is
     the loudest thing on the bus. */
  /* the sputter is as loud as the read and no louder, so the bus may reach the
     voice's peak but may not pass it by more than a decibel */
  const busOver = 20 * Math.log10(MIXED.busPeak / Math.max(MIXED.voicePeak, 1e-9));
  if (busOver > 1.0) fail.push('the bus is ' + busOver.toFixed(1) + ' dB over the voice');
  if (LEVELS.tick >= LEVELS.fart) fail.push('the click is not quieter than the sputter');
  /* and the ticks in particular are well under the read */
  {
    let tickPeak = 0, voicePeak = 0;
    for (let i = 0; i < SFX.buf.length; i++) {
      const t = i / SR;
      if (t >= STEPS[0] && t <= lastTick + 0.12) tickPeak = Math.max(tickPeak, Math.abs(SFX.buf[i] * (1 - 0.6 * (ENV[i] || 0))));
      voicePeak = Math.max(voicePeak, Math.abs(VTRACK[i] || 0));
    }
    const under = 20 * Math.log10(tickPeak / Math.max(voicePeak, 1e-9));
    console.log('  the footsteps sit ' + under.toFixed(1) + ' dB under the read, at ' + LEVELS.tick + ' dB');
    if (Math.abs(under + TICK_UNDER) > 1.0) fail.push('the footsteps sit ' + under.toFixed(1) + ' dB under the read, and the brief says about ' + (-TICK_UNDER));
    let fartPeak = 0;
    for (let i = 0; i < SFX.buf.length; i++) if (i / SR >= CLOUD.at - 0.02) fartPeak = Math.max(fartPeak, Math.abs(SFX.buf[i]));
    const fartAt = 20 * Math.log10(fartPeak / Math.max(voicePeak, 1e-9));
    console.log('  the sputter sits ' + fartAt.toFixed(1) + ' dB against the read, at ' + LEVELS.fart + ' dB');
    if (Math.abs(fartAt) > 1.0) fail.push('the sputter is ' + fartAt.toFixed(1) + ' dB against the read, and the brief says as loud as it');
  }
}

/* ---------- what is on the screen ---------- */
{
  const WANT = ['we made 2 free tools', 'what should we make next', 'or fix a bug for you', 'maybe fresh air', 'got a better idea', 'share it below'];
  const screen = [...PILL_LINES.map((l, i) => ['bubble ' + (i + 1), l]), ['the wordmark', WM.lines.join(' ')]];
  for (const [what, s] of screen) {
    if (/[-—–'"“”‘’!]/.test(s)) fail.push(what + ' carries a dash, an apostrophe, a quote or a bang: "' + s + '"');
    if (/\./.test(s)) fail.push(what + ' has a dot in it: "' + s + '"');
  }
  for (let i = 0; i < WANT.length; i++) if (PILL_LINES[i] !== WANT[i]) fail.push('bubble ' + (i + 1) + ' says "' + PILL_LINES[i] + '"');
  const rendered = state.measured.pill.lines.map(l => l.text);
  for (let i = 0; i < PILL_LINES.length; i++) if (rendered[i] !== PILL_LINES[i]) fail.push('the rendered bubble ' + (i + 1) + ' says "' + rendered[i] + '"');
  if (WM.lines.join(' ') !== 'THE BORING TEK') fail.push('the wordmark reads ' + WM.lines.join(' '));
}

/* ---------- the bubbles: one a line, in and out, with the tail on it ---------- */
{
  for (const l of state.measured.pill.lines) {
    if (l.left < SAFE.left || l.right < SAFE.right || l.top < SAFE.top || l.bottom < SAFE.bottom) fail.push('the pill "' + l.text + '" is inside the house safe area: ' + l.left + ' / ' + l.top + ' / ' + l.right + ' / ' + l.bottom);
    if (l.left < BRIEF_SAFE || l.right < BRIEF_SAFE || l.top < BRIEF_SAFE || l.bottom < BRIEF_SAFE) fail.push('the pill "' + l.text + '" is inside the brief\'s 120px margin');
    if (!l.inside) fail.push('the line "' + l.text + '" spills out of the pill');
  }
  if (!/Nunito/.test(state.measured.pill.font)) fail.push('the pill is not in nunito: ' + state.measured.pill.font);
  if (parseFloat(state.measured.pill.stroke) < BUBBLE.stroke) fail.push('the pill\'s outline is ' + state.measured.pill.stroke);
  /* the tail: two dots, the house pill's own fill and outline, climbing off
     his rim toward the pill and pointing back at him */
  if (state.measured.dots.length !== 2) fail.push('the tail is ' + state.measured.dots.length + ' dots');
  for (const [i, d] of state.measured.dots.entries()) {
    if (d.fill !== state.measured.pill.bg) fail.push('dot ' + (i + 1) + ' is not filled the way the pill is');
    if (parseFloat(d.stroke) < BUBBLE.stroke) fail.push('dot ' + (i + 1) + '\'s outline is ' + d.stroke);
  }
  {
    /* the three gaps, edge to edge along the ray, and they are one number */
    const g = [
      Math.hypot(BUB.c0x - PLATE.cx, BUB.c0y - PLATE.cy) - PLATE.r - BUB.d0 / 2,
      Math.hypot(BUB.c1x - BUB.c0x, BUB.c1y - BUB.c0y) - BUB.d0 / 2 - BUB.d1 / 2,
      BUB.r2 - BUB.r1 - BUB.d1 / 2,
    ].map(v => +v.toFixed(3));
    console.log('  the tail: gaps of ' + g.join(', ') + ' css px, dots of ' + BUB.d0 + ' and ' + BUB.d1 + ', the pill ' + BUB.lift + ' over his rim');
    if (Math.max(...g) - Math.min(...g) > 0.01) fail.push('the tail gaps are ' + g.join(', ') + ' and they have to be one distance');
    if (Math.abs(g[0] - BUB.gap) > 0.01) fail.push('the tail gap is ' + g[0] + ', not ' + BUB.gap);
    if (!(BUB.d0 < BUB.d1)) fail.push('the dot nearest him is not the smaller one');
    if (!(BUB.c0y > BUB.c1y && BUB.c1y > BUB.py)) fail.push('the tail does not point back at him');
    const widest = state.measured.pill.lines.reduce((a, l) => (l.w > a.w ? l : a));
    if (Math.abs((widest.cssLeft + widest.cssRight) / 2 - MID.x) > 1) fail.push('the pill is not centred over him');
    const gap = (PLATE.cy - PLATE.r) - widest.cssBottom;
    if (gap < 8 || gap > 70) fail.push('the pill sits ' + gap.toFixed(1) + ' css px over his rim');
    /* and the reason it is over him rather than off his side, measured */
    if (BUB.sideRoom >= Math.min(...PILL_W)) fail.push('a pill would fit off his side after all: ' + BUB.sideRoom + ' px of room against ' + Math.min(...PILL_W));
  }
  /* one a line, each fully out before the next is in, and a real hold on each */
  for (let k = 0; k < BUBBLES.length; k++) {
    const b = BUBBLES[k];
    if (Math.abs(SAY[k] - (SC_T[b.line] + TAKES[b.line].says[b.s])) > TICK_TOL) fail.push('bubble ' + (k + 1) + ' does not pop on its own sentence');
    if (SAY_OUT[k] <= SAY[k] + 2 * BUB.step + BUB.pillFor) fail.push('bubble ' + (k + 1) + ' starts leaving before it has finished arriving');
    if (SAY_OUT[k] - SAY[k] < 0.65) fail.push('bubble ' + (k + 1) + ' is only up for ' + (SAY_OUT[k] - SAY[k]).toFixed(2) + 's');
    if (k && SAY[k] < bubOutEnd(k - 1) - 1e-6) fail.push('bubble ' + (k + 1) + ' arrives before bubble ' + k + ' has gone');
    if (bubbleOf(k, SAY[k] + 2 * BUB.step + BUB.pillFor).pill.o < 0.999) fail.push('bubble ' + (k + 1) + ' has not sprung in');
    if (bubbleOf(k, SAY[k] - 0.02).o !== 0) fail.push('bubble ' + (k + 1) + ' is up before its sentence');
    if (bubbleOf(k, bubOutEnd(k) + 0.02).o !== 0) fail.push('bubble ' + (k + 1) + ' has not popped out');
  }
  if (bubbleAt(BITE.at).o !== 0) fail.push('a bubble is up when he goes for the bug');
  if (bubbleAt(CLOUD.at + 0.2).o !== 0) fail.push('a bubble is up over the puff');
  if (bubbleAt(CUT).o !== 0) fail.push('a bubble is on the end card');
  /* exactly one at a time, walked */
  for (let f = 0; f < Math.ceil(SECONDS * 60); f++) {
    const b = bubbleAt(f / 60);
    if (b.k >= 0 && b.o > 0.02) {
      let others = 0;
      for (let k = 0; k < BUBBLES.length; k++) if (k !== b.k && f / 60 >= SAY[k] && f / 60 < bubOutEnd(k)) others++;
      if (others) { fail.push('two bubbles overlap at ' + (f / 60).toFixed(2)); break; }
    }
  }
}

/* ---------- the eyes ---------- */
{
  for (const m of plan.marks) if (m.state !== 'neutral') fail.push('mark ' + m.i + ' is ' + m.state + ', and this clip writes everything on neutral');
  if (plan.marks.some(m => m.hands || m.bubble || m.bubbles)) fail.push('a mark asks for hands or a bubble, and this clip draws its own');
  if (MODULE_CUES.length) fail.push('the module offers ' + MODULE_CUES.length + ' cue(s) this clip did not expect');
  if (plan.bias !== 0) fail.push('he rests turned, and the gaze needs the channel free');
  /* never wider or taller than the module drew them, on any frame */
  let widened = 0, worstOut = -Infinity;
  for (let f = 0; f < Math.ceil(SECONDS * 60); f++) {
    const t = f / 60, m = mascotFrame(plan, t), c = compose(plan, t);
    for (let k = 0; k < 2; k++) {
      if (c.eyes[k].sy > m.eyes[k].sy + 1e-6) widened++;
      if (c.eyes[k].lid !== m.eyes[k].lid) fail.push('a lid is not the module\'s at ' + t.toFixed(2));
    }
    worstOut = Math.max(worstOut, eyeOutside(c, plan));
  }
  if (widened) fail.push('an eye is taller than the module drew it on ' + widened + ' frames, and nothing here may widen them');
  if (worstOut > 0) fail.push('the drawn eye ink reaches ' + worstOut.toFixed(2) + ' units outside the silhouette');
  /* the arcs are short: no run of them reaches 0.6s */
  {
    let run = 0, worstRun = 0;
    for (let f = 0; f < Math.ceil(SECONDS * 120); f++) {
      const a = arcAtT(f / 120);
      run = a > 0.02 ? run + 1 / 120 : 0;
      worstRun = Math.max(worstRun, run);
    }
    console.log('  the arcs: ' + ARC.at.length + ' of them, the longest run ' + worstRun.toFixed(2) + 's');
    if (worstRun > ARC.max + 1e-6) fail.push('the arcs run ' + worstRun.toFixed(2) + 's, over the ' + ARC.max + ' ceiling');
    if (ARC.at.length !== 2) fail.push('there are ' + ARC.at.length + ' arc moments');
    for (const at of ARC.at) if (Math.abs(arcAtT(at + ARC.rise + ARC.hold / 2) - 1) > 0.01) fail.push('an arc never reaches the arcs');
  }
  /* the squint is on the puff and nowhere else */
  if (squintAt(CLOUD.at - 0.02) !== 0) fail.push('he squints before the puff');
  if (squintAt(CLOUD.at + 0.5) < 0.9) fail.push('he does not squint on the puff');
  if (squintAt(CUT - 0.05) !== 0) fail.push('the squint is still on at the cut');
  if (squintAt(SAY[0] + 0.5) !== 0) fail.push('he squints on line one');
  /* the eating shuts his eyes and they come back */
  if (squeezeAt(BITE.at - 0.02) !== 0) fail.push('his eyes shut before the bite');
  if (squeezeAt(BITE_HIT) < 0.9) fail.push('his eyes are not shut on the bite');
  if (squeezeAt(SHUT.until + SHUT.out + 0.02) !== 0) fail.push('his eyes have not come back after the chews');
  /* and they are a bar rather than nothing: the shut never takes an eye under
     a quarter of the height the module drew it */
  {
    let worstRatio = 1;
    for (let f = Math.floor(SHUT.at * 60); f / 60 < SHUT.until + SHUT.out; f++) {
      const t = f / 60, m = mascotFrame(plan, t), c = compose(plan, t);
      for (let k = 0; k < 2; k++) if (m.eyes[k].sy > 1e-6) worstRatio = Math.min(worstRatio, c.eyes[k].sy / m.eyes[k].sy);
    }
    if (worstRatio < SHUT.sy - 0.02) fail.push('the eating takes an eye to ' + worstRatio.toFixed(3) + ' of itself, under the bar at ' + SHUT.sy);
  }
  /* the gaze: on the bug while it walks, on the pill when one is up, on the
     lens when neither */
  {
    const mid = WALK.t0 + WALK.for * 0.55;
    const g = gazeAt(mid), b = bugFrame(mid, ANT_SCHED).body;
    if (Math.sign(g.q) !== Math.sign(b.x - PLATE.cx)) fail.push('he is not looking at the bug at ' + mid.toFixed(2));
    if (!(Math.abs(g.q) > 0.05)) fail.push('the gaze barely moves while the bug walks: ' + g.q);
    const bubT = SAY[0] + 0.6;
    if (!(gazeAt(bubT).v < -0.1)) fail.push('he is not looking up at the bubble at ' + bubT.toFixed(2) + ': ' + gazeAt(bubT).v);
    const lensT = CLOUD_END + 0.05;
    if (bubbleAt(lensT).o === 0 && Math.abs(gazeAt(lensT).q) > 0.05) fail.push('he is not back on the lens at ' + lensT.toFixed(2));
    if (gazeAt(BITE_HIT).q !== 0 || gazeAt(BITE_HIT).v !== 0) fail.push('he is still tracking while he lunges');
  }
  /* the module's idle blinks are still there and untouched */
  if (!plan.idle.blinks.some(b => b.t > 0 && b.t < CUT)) fail.push('there are no idle blinks in the film');
}

/* ---------- the eating, post25's ---------- */
{
  if (DEPTH.hold > 1) fail.push('the bug is not under his ink on the frame it goes: containment ' + DEPTH.hold);
  if (DEPTH.margin < 0.5) fail.push('the lunge depth window is only ' + DEPTH.margin + 'px either side');
  if (VANISH_AT < BITE_HIT - 1e-9) fail.push('the bug goes before the lunge lands');
  if (VANISH_AT > BITE_HIT + BITE.land) fail.push('the bug goes after the contact is over');
  if (CHEW.pulses !== 3) fail.push('there are ' + CHEW.pulses + ' chews and post25 has three');
  if (biteZone(BITE.at + BITE.rise / 2).y >= 0) fail.push('he does not rise before he lunges');
  if (Math.abs(biteZone(BITE_HIT).y - BITE.by) > 0.01) fail.push('the lunge does not reach its depth');
  if (Math.abs(biteZone(BITE_END + 0.001).y) > 0.01) fail.push('he does not come back up after the bite');
  {
    const z = biteZone(BITE_HIT + BITE.land / 2);
    if (!(z.sx > 1 && Math.abs(z.sx * z.sy - 1) < 1e-6)) fail.push('the contact squash is not volume preserving: ' + z.sx + ' by ' + z.sy);
  }
  for (const [i, t] of CHEW_HITS.entries()) {
    const z = biteZone(t);
    if (Math.abs(z.sx * z.sy - 1) > 1e-6) fail.push('chew ' + (i + 1) + ' is not volume preserving');
    if (Math.sign(z.x) !== (i % 2 === 0 ? -1 : 1)) fail.push('chew ' + (i + 1) + ' works the wrong side');
  }
  if (biteZone(CHEW_END - CHEW.bob.for / 2).y >= 0) fail.push('there is no bob after the chews');
  /* the bug: it walks in on the line about the bug, it clears his ink until he
     goes for it, and it stays inside the safe rect once it is in */
  if (!/bug/.test(TAKES[1].text)) fail.push('line two is not the line about the bug');
  if (Math.abs(WALK.t0 - SC_T[1]) > TICK_TOL) fail.push('the bug does not walk in on the first frame of its line');
  if (CLEAR.hit) fail.push('the bug touches his ink at ' + CLEAR.hit + 's, before he goes for it');
  if (CLEAR.worst < 4) fail.push('the bug comes within ' + CLEAR.worst + 'px of his ink on the walk');
  if (CLEAR.out) fail.push('the bug leaves the safe rect at ' + CLEAR.out + 's after it was inside it');
  if (CLEAR.worstAir < 0) fail.push('the bug is outside the safe rect by ' + (-CLEAR.worstAir) + 'px');
  if (frameAt(WALK.t0 - 0.02, 0).bug.o) fail.push('the bug is on screen before its line');
  if (!frameAt(WALK.t0 + 0.3, 0).bug.o) fail.push('the bug is not on screen once its line starts');
  if (frameAt(VANISH_AT, 0).bug.o) fail.push('the bug is still there on the frame it is eaten');
  /* the gait: no foot slides while it is planted */
  {
    let worstSlide = 0;
    for (let f = Math.ceil(WALK.t0 * 60); f / 60 < WALK.t1 - 1 / 60; f++) {
      const t0 = f / 60, t1 = (f + 1) / 60;
      const a = bugFrame(t0, ANT_SCHED), b = bugFrame(t1, ANT_SCHED);
      const xa = walkX(t0), xb = walkX(t1);
      for (let i = 0; i < 6; i++) {
        const s = i % 3, sg = i < 3 ? -1 : 1;
        const rest = { x: BUG.feet[s].x, y: BUG.feet[s].y * sg };
        const off = ((i >= 3) !== (s === 1)) ? 0.5 : 0;
        const fa = legFoot(xa, off, rest), fb = legFoot(xb, off, rest);
        if (fa.planted && fb.planted) worstSlide = Math.max(worstSlide, Math.hypot(fb.x - fa.x, fb.y - fa.y));
      }
    }
    console.log('  the gait: a planted foot moves ' + worstSlide.toFixed(4) + 'px between frames');
    if (worstSlide > 0.001) fail.push('a planted foot slides ' + worstSlide.toFixed(3) + 'px');
  }
  if (state.measured.bug.legs !== 6) fail.push('the bug has ' + state.measured.bug.legs + ' legs');
  if (state.measured.bug.ants !== 2) fail.push('the bug has ' + state.measured.bug.ants + ' antennae');
  if (!/rgb\(244, 247, 245\)/.test(state.measured.bug.ink)) fail.push('the bug is not drawn in the house face ink: ' + state.measured.bug.ink);
}

/* ---------- the puff ---------- */
{
  if (state.measured.cloud.blobs !== CLOUD.n) fail.push('the puff is ' + state.measured.cloud.blobs + ' fields');
  if (!/blur/.test(state.measured.cloud.filter)) fail.push('the puff is not blurred');
  /* chrome resolves color-mix to `color(srgb r g b / a)` with the channels in
     nought to one, so the accent is checked as numbers rather than as the
     `rgb()` string it never comes back as. */
  {
    const m = /color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/.exec(state.measured.cloud.bg) || /rgba?\((\d+), (\d+), (\d+)/.exec(state.measured.cloud.bg);
    const chan = m ? [+m[1], +m[2], +m[3]].map(v => Math.round(v <= 1.0001 ? v * 255 : v)) : null;
    if (!chan || chan.join(',') !== '53,255,106') fail.push('the puff is not the house accent: ' + state.measured.cloud.bg);
  }
  if (cloudAt(CLOUD.at - 0.02).some(c => c.o > 0)) fail.push('the puff is up before its beat');
  if (cloudAt(BITE_HIT).some(c => c.o > 0)) fail.push('the puff is up while he is still eating');
  if (!cloudAt(CLOUD.at + 0.3).some(c => c.o > 0.1)) fail.push('the puff never comes up');
  if (cloudAt(CLOUD_END + 0.02).some(c => c.o > 0)) fail.push('the puff has not gone by ' + CLOUD_END);
  if (cloudAt(CUT).some(c => c.o > 0)) fail.push('the puff is on the end card');
  /* it drifts up and out, and it is the only colour in the film */
  const a = cloudAt(CLOUD.at + 0.25), b = cloudAt(CLOUD.at + 0.55);
  if (!(b[0].y < a[0].y && Math.sign(b[0].x - a[0].x) === SIDE)) fail.push('the puff does not drift up and out');
  {
    const mine = sceneHtml().split('==== this clip\'s own css starts here ====')[1].split('</style>')[0].replace(mascotCss(plan), '')
      .replace(/\.sb\{--face:[^;]*;--eye:[^;]*;--bub:[^;]*;/, '.sb{');
    if (/#[0-9a-f]{3,8}\b/i.test(mine.replace(/url\(#[^)]*\)/g, ''))) fail.push('a hex colour is typed in the css');
    if (/var\(--red\)/.test(mine)) fail.push('the red is painted somewhere');
    if (/--iris/.test(mine)) fail.push('the iris is overridden');
    const accents = (mine.match(/var\(--accent\)/g) || []).length;
    if (accents !== 2) fail.push('the accent is painted in ' + accents + ' places, and the only green is the puff\'s two stops');
    if (!/#cloud i\{[^}]*var\(--accent\)/.test(mine)) fail.push('the accent is not the puff');
  }
}

/* ---------- the margins, the cut and the liveness ---------- */
{
  const M = state.measured;
  if (M.wm.left < SAFE.left || M.wm.right < SAFE.right || M.wm.top < SAFE.top || M.wm.bottom < SAFE.bottom) fail.push('the wordmark is inside the house safe area');
  if (M.wm.left < BRIEF_SAFE || M.wm.right < BRIEF_SAFE || M.wm.top < BRIEF_SAFE || M.wm.bottom < BRIEF_SAFE) fail.push('the wordmark is inside the brief\'s 120px margin');
  if (!/Michroma/.test(M.wm.font)) fail.push('the wordmark is not in Michroma: ' + M.wm.font);
  if (M.wm.capPx < WM.minCapPx) fail.push('the wordmark caps are ' + M.wm.capPx + ' device px');
  if (Math.abs(M.wm.midY - CENTRE_Y) > 1) fail.push('the wordmark\'s middle is at ' + M.wm.midY + ' css px');
  if (state.head && state.head.near < Math.max(Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom), BRIEF_SAFE)) fail.push('his ink comes within ' + state.head.near + ' device px of a border at ' + state.head.t + 's');
  if (frameAt(CUT, 0).mo !== 0 || frameAt(CUT - 1 / 60, 0).mo !== 1) fail.push('he is on the end card');
  if (frameAt(CUT - 1 / 60, 0).wm.o !== 0 || frameAt(CUT, 0).wm.o !== 1) fail.push('the wordmark is not on the cut');
  const on = [];
  for (let f = 0; f < Math.round(SECONDS * 60); f++) if (glitchAt(f, 60, GL_WINDOWS_60).heat > 0) on.push(f);
  const runs = []; for (const f of on) { if (runs.length && runs[runs.length - 1].end === f - 1) runs[runs.length - 1].end = f; else runs.push({ start: f, end: f }); }
  if (runs.length !== 4) fail.push('the glitch is ' + runs.length + ' runs at sixty');
  for (let i = 1; i < runs.length; i++) if (runs[i].start - runs[i - 1].end - 1 < 4) fail.push('two bursts are a strobe apart');
  if (GL.flash !== 0) fail.push('the glitch flashes');
  if (state.glitched !== GL_WINDOWS.reduce((a, w) => a + w.frames, 0)) fail.push(state.glitched + ' frames were glitched');
}
for (const st of rep60.states) if (st.entryFrames == null) fail.push(st.state + ' never reached its own mark');
if (rep60.frozenFrames) fail.push(rep60.frozenFrames + ' frames where the face is not moving at all');
if (FASTEST > STEP_CEIL) fail.push('something moves ' + FASTEST + ' css px on one frame at 60');
if (BLUR && !BLUR_ARG && FPS === 60 && FASTEST / SUB > SUB_STEP_WANT + 1e-6) fail.push('the solved shutter leaves ' + (FASTEST / SUB).toFixed(2) + ' css px between samples');
{
  let repeats = 0, first = null, smallest = Infinity;
  for (let i = 1; i < state.sigs.length; i++) {
    const d = Math.abs(state.sigs[i] - state.sigs[i - 1]);
    if (d === 0) { repeats++; if (first == null) first = i; }
    smallest = Math.min(smallest, d);
  }
  console.log('  liveness: smallest change between frames ' + smallest.toExponential(2) + (repeats ? ', ' + repeats + ' IDENTICAL PAIRS' : ', no identical pairs'));
  if (repeats) fail.push(repeats + ' pairs of identical frames, the first at frame ' + first);
}

console.log('\n  outstanding');
console.log('    every bubble goes over his head rather than off his side, and the file measures why: ' + BUB.sideRoom + ' css px of room against a shortest line of ' + Math.min(...PILL_W).toFixed(0));
console.log('    the eating is silent; einz adds the crunch and the music himself');

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
