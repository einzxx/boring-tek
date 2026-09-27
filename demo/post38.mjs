/* the boring tek — post38. no thanks, i use ai.

   dark only, 1080x1920, about six seconds. two lines on elevenlabs and
   nothing else on the bus: einz puts every other sound on himself.

     the pop         he comes up from under the bottom edge to the middle on
                     the rise, stretched on the way up and squashed on the
                     landing, eyes calm.
     the plate       demo/assets/brain-plate.png slides up from the bottom and
                     stops under him.
     the offer       the human, a voice of its own, says here is a brain for
                     you. on screen it is a grey phone message at the bottom
                     with a small label, you.
     the stop        he lifts one glove beside his face, palm out, and holds
                     it there: a small spring on the way up and then still,
                     like stop. his bubble and the narrator say no thanks, i
                     use ai.
     the beat        the hand stays up a beat after the line, and he blinks
                     once.
     the cut         post37's: bursts of a frame jump, torn slices and a
                     colour split, a residue on the first end card frame.
     the end card    the wordmark alone.

   ---------- the hand is the wave glove, held ----------
   the brief asked for the hello hand we already had, palm out, no new
   drawing, and to hold it still as a stop. it is `demo/assets/hands/wave.svg`,
   which the rig already carries as its `wave` pose: the pose's own entrance
   is the lift and its pop is the spring. what the pose does after that, five
   rocks at the wrist and then an exit, is taken off: from the frame the pose
   settles to the cut the whole glove pair is held at that settled frame, so
   the hand does not wave, drift or leave.

   ---------- the clock is the read's ----------
   past the pop and the plate, every beat hangs off where a line starts or
   stops, with only the air a move needs between them.

     DEMO_FPS=12 node post38.mjs         the preview
     node post38.mjs                     60fps, shutter open, solved
     node post38.mjs --no-blur           shutter closed
     node post38.mjs --keep-frames       leave the jpegs on disk

     demo/out/post38-dark-1080x1920.mp4
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
  STAGE, HEAD, GRID, GLOW, BUBBLE, EYE_CX, TURN, HAND_POSES,
} from './lib/mascot.mjs';
import { brandTokens } from './lib/captions.mjs';
import { speak, VOICE_OUT, elevenReady } from './lib/voice.mjs';
import { SR, decode, writeWav, applyGain, limit, loudness } from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post38');
const SUBS = path.join(OUT, 'subframes-post38');
const VERIFY = path.join(OUT, 'verify-post38');
const ASSET = path.join(HERE, 'assets', 'brain-plate.png');
const HAND_FILE = path.join(HERE, 'assets', 'hands', 'wave.svg');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = STAGE.dsf;
const VW = STAGE.w, VH = STAGE.h;
const FLOOR_CSS = 120 / DSF;

const argv = process.argv.slice(2);
const KEEP = argv.includes('--keep-frames');
const BLUR = !argv.includes('--no-blur');
const SUB_STEP_WANT = 10, SUB_MAX = 12;
let SUB = 1, SUBSTEP = STEP;

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

for (const [f, what] of [[ASSET, 'the brain plate'], [HAND_FILE, 'the wave glove']]) {
  if (!fs.existsSync(f)) { console.error('\nSTOPPED. ' + path.relative(ROOT, f) + ' is missing, and ' + what + ' is not drawn in code.'); process.exit(1); }
}
if (!HAND_POSES.wave || HAND_POSES.wave.shape !== 'wave') { console.error('\nSTOPPED. the rig\'s wave pose no longer draws the wave glove.'); process.exit(1); }

/* ---------- the small maths ---------- */
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
/* the site's own --ease and --spring, the same two numbers index.html
   carries, written here so the clip stands on its own */
const EASE = bezier(.16, 1, .3, 1);
const POP = bezier(.34, 1.4, .64, 1);
const RISE = bezier(.5, 0, .3, 1.3);
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
const MSG = { label: 'you', text: 'here is a brain for you.' };
const PILL = 'no thanks, i use ai.';
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16 };
for (const s of [MSG.label, MSG.text, PILL, ...WM.lines]) {
  if (/[-\u2010-\u2015'"\u2018-\u201f`]/.test(s)) throw new Error('a dash, apostrophe or quote on screen: ' + s);
}

/* ==========================================================================
   the read: two lines, two people, elevenlabs or nothing
   ==========================================================================
   the human is the third id, will, relaxed and chill, kept in demo/.env as
   ELEVENLABS_VOICE_ID_HUMAN. his line is the narrator's voice. one take a
   line, cached on the text. no edge fallback: a failed call stops the file. */
const LINES = [
  { who: 'human', voice: 'human', text: MSG.text },
  { who: 'mascot', voice: 'calm', text: PILL },
];
const SILENCE_DB = -42, PRE = 0.06, POST = 0.10, EDGE_FADE = 0.012;
/* the bus goes to -14, and the limiter is allowed the reduction that takes.
   two dry reads have peaks well above their average, and round one's cap of
   5 dB left the file at -17.2. a guard measures the mp4 and fails outside
   half a unit of the target. */
const TARGET_LUFS = -14, SAMPLE_CEILING = -1.8, MAX_REDUCTION = 12;
for (const id of ['narrator', 'human']) if (!elevenReady(id)) {
  console.error('\nSTOPPED. elevenlabs is not set up for the ' + id + ' voice in demo/.env, and the brief says no edge fallback.');
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
const TAKES = [];
for (let i = 0; i < LINES.length; i++) {
  const L = LINES[i], name = 'post38r2-l' + (i + 1);
  const want = L.voice === 'human' ? 'human' : 'narrator';
  const cached = path.join(VOICE_OUT, name + '-' + L.voice + '.json');
  let got = null;
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === L.text && j.provider === 'elevenlabs' && j.elevenId === want && fs.existsSync(j.file)) got = j;
  }
  if (!got) {
    try { got = await speak(L.text, { voice: L.voice, name }); }
    catch (e) {
      console.error('\nSTOPPED. elevenlabs failed on line ' + (i + 1) + ': ' + (e && e.message || e));
      console.error('  the brief says stop rather than fall back to edge, so nothing was rendered.');
      process.exit(1);
    }
  }
  if (got.provider !== 'elevenlabs' || got.elevenId !== want) { console.error('\nSTOPPED. line ' + (i + 1) + ' came back from ' + got.provider + ', and this clip is elevenlabs or nothing.'); process.exit(1); }
  const pcm = decode(ffmpeg, got.file);
  TAKES.push({ ...L, elevenId: want, file: got.file, pcm, edge: audioEdges(pcm) });
}
const placeLine = (i, at) => { const T = TAKES[i]; T.at = +at.toFixed(4); T.end = +(at + T.edge.end - T.edge.start).toFixed(4); };

/* ---------- the photo: only where the brain and the dish are ---------- */
const IMG = 1254;
const PHOTO = (() => {
  const RGBA = execFileSync(ffmpeg, ['-v', 'error', '-i', ASSET, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1 << 28 });
  if (RGBA.length !== IMG * IMG * 4) throw new Error('brain-plate.png is not ' + IMG + ' square any more');
  let bx0 = IMG, by0 = IMG, bx1 = 0, by1 = 0, dx0 = IMG, dx1 = 0, dy1 = 0;
  for (let i = 0; i < IMG * IMG; i++) {
    const r = RGBA[i * 4], b = RGBA[i * 4 + 2], a = RGBA[i * 4 + 3];
    if (a < 40) continue;
    const x = i % IMG, y = (i / IMG) | 0;
    if (r - b > 22) { bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y); }
    else if (Math.abs(r - b) < 14 && r > 120 && y > 300) { dx0 = Math.min(dx0, x); dx1 = Math.max(dx1, x); dy1 = Math.max(dy1, y); }
  }
  return { bc: { x: (bx0 + bx1) / 2, y: (by0 + by1) / 2 }, box: { x0: bx0, y0: by0, x1: bx1, y1: by1 }, dish: { x0: dx0, x1: dx1, y1: dy1 } };
})();

/* ---------- where he stands, and where the plate stops ---------- */
const SIZE = 148;
const UNIT = SIZE / GRID;
const MID = { x: VW / 2, y: 420 };
const HOME = { left: +(MID.x - SIZE / 2).toFixed(2), top: +(MID.y - SIZE / 2).toFixed(2), size: SIZE };
const PLATE = {
  cx: HOME.left + (HEAD.plate.x + HEAD.plate.s / 2) * UNIT,
  cy: HOME.top + (HEAD.plate.y + HEAD.plate.s / 2) * UNIT,
  r: HEAD.plate.s / 2 * UNIT,
};
const GLOW_REACH = Math.ceil(3 * GLOW.wide.blur) + 10;
const BRAIN_W = 112;
const S0 = BRAIN_W / (PHOTO.box.x1 - PHOTO.box.x0);
const DISH = { size: +(IMG * S0).toFixed(2), bx: MID.x, by: 612 };
DISH.left = +(DISH.bx - PHOTO.bc.x * S0).toFixed(2);
DISH.top = +(DISH.by - PHOTO.bc.y * S0).toFixed(2);
/* the phone message: grey, a small label over it, centred, its top 40 css
   px under the plate at rest. it used to sit at the bottom margin, which is
   where tiktok and shorts put their captions and buttons: the bottom 300
   device px, 150 css px, and a guard keeps the message clear of it. */
const PLATE_BOTTOM = +(DISH.top + PHOTO.dish.y1 * S0).toFixed(2);
const MSGBOX = { top: +(PLATE_BOTTOM + 40).toFixed(2), size: 24, padX: 18, padY: 11, label: 14 };
const APP_ZONE = 300 / DSF;

/* ---------- the clock ---------- */
const POP_IN = { at: 0.00, for: 0.80, from: VH + PLATE.r + GLOW_REACH + 30 };
const LAND = POP_IN.at + POP_IN.for;
const LANDSQ = { at: LAND - 0.10, for: 0.30, by: 0.10 };
/* the plate comes up from under the frame and stops on --ease, no bounce */
const SLIDE = { at: +(LAND - 0.12).toFixed(4), for: 0.56, from: VH - 612 + 140 };
const PLATE_IN = +(SLIDE.at + SLIDE.for * 0.82).toFixed(4);   /* where it reads as stopped */
/* the offer: the message pops as the plate stops and the human reads it */
const MSG_T = { at: PLATE_IN, for: 0.34 };
placeLine(0, MSG_T.at + 0.10);
/* the stop: the glove comes up after the offer, his bubble when it has
   landed, and the narrator as the pill arrives */
/* the glove starts up on the human's last word, so the answer follows the
   offer with no gap in it */
const HAND = { at: +(TAKES[0].end - 0.15).toFixed(4) };
const BUB = {
  size: 24, weight: 600, padX: 18, padY: 10, lh: 1.25, angle: -122,
  gap: 9, d0: 9, d1: 13,
  step: 0.07, pillFor: 0.34, from: 0.55, outStep: 0.05, outFor: 0.15, outFrom: 0.86,
};
const BEAT = 0.45;
const BLINK = { at: 0, close: 0.08, hold: 0.05, open: 0.16 };
/* the rest of the clock needs the plan, for when the pose settles */
const PLAN_SECONDS = 12;
const mkPlan = seed => planMascot({
  hands: true, seconds: PLAN_SECONDS, theme: 'dark', size: SIZE, bias: 0, seed,
  marks: [{ t: 0.30, state: 'neutral' }, { t: HAND.at, state: 'neutral', hands: 'wave' }],
});
const settledOf = p => p.marks.find(m => m.hands).hands.settled;
const clockFor = p => {
  const C = {};
  C.settled = settledOf(p);
  C.say = +(C.settled + 0.02).toFixed(4);
  C.lineAt = +(C.say + 0.12).toFixed(4);
  return C;
};
/* the rig's idle blinks come every second or two, so no seed leaves the
   stop alone; from the lift to the cut the lids are written instead, open
   but for the one blink in the held beat (see compose). */
const SEED = 1;
const plan = mkPlan(SEED), C = clockFor(plan);
plan.box = { ...HOME };
placeLine(1, C.lineAt);
const SAY = C.say, SAY_OUT = +TAKES[1].end.toFixed(4);
const BUB_GONE = +(SAY_OUT + 2 * BUB.outStep + BUB.outFor).toFixed(4);
/* the held beat, clear of the bubble and clear of the glitch, with the blink
   inside it. the glitch's first burst is the end of the beat, and the cut is
   the glitch's own 0.40 after that. */
BLINK.at = +(BUB_GONE + 0.10).toFixed(4);
const CUT = +(BUB_GONE + BEAT + 0.40).toFixed(4);
const END_HOLD = 0.90;
const SECONDS = +(CUT + END_HOLD).toFixed(4);
const GL = {
  offsets: [{ d: 0.40, for: 2 / 60, heat: 0.75 }, { d: 0.25, for: 3 / 60, heat: 1.0 }, { d: 0.12, for: 3 / 60, heat: 1.0 }, { d: 0, for: 2 / 60, heat: 0.45, residue: true }],
  jumpX: 22, jumpY: 12, split: 11, slices: 3, sliceH: [24, 110], sliceDx: 70,
};
GL.bursts = GL.offsets.map(o => ({ t: +(CUT - o.d).toFixed(4), for: o.for, heat: o.heat, residue: !!o.residue }));
const WM1 = { at: CUT, for: 0.09 };
const CRF = 17;
if (GL.bursts[0].t < BLINK.at + BLINK.close + BLINK.hold + BLINK.open) throw new Error('the glitch comes in over the blink');

/* ---------- the held glove ---------- */
const HELD = mascotFrame(plan, C.settled).hands;

/* ---------- the bubble: over his head, on the side away from the glove ---------- */
BUB.h = +(BUB.size * BUB.lh + 2 * BUB.padY + 2 * BUBBLE.stroke).toFixed(2);
BUB.r0 = +(PLATE.r + BUB.gap + BUB.d0 / 2).toFixed(4);
BUB.r1 = +(BUB.r0 + BUB.d0 / 2 + BUB.gap + BUB.d1 / 2).toFixed(4);
BUB.r2 = +(BUB.r1 + BUB.d1 / 2 + BUB.gap).toFixed(4);
BUB.c0x = +(PLATE.cx + BUB.r0 * Math.cos(BUB.angle * DEG)).toFixed(2);
BUB.c0y = +(PLATE.cy + BUB.r0 * Math.sin(BUB.angle * DEG)).toFixed(2);
BUB.c1x = +(PLATE.cx + BUB.r1 * Math.cos(BUB.angle * DEG)).toFixed(2);
BUB.c1y = +(PLATE.cy + BUB.r1 * Math.sin(BUB.angle * DEG)).toFixed(2);
BUB.py = +(PLATE.cy + BUB.r2 * Math.sin(BUB.angle * DEG)).toFixed(2);

/* ---------- the pose of everything that is not him ---------- */
function plateAt(t) {
  if (t < SLIDE.at) return { o: 0, y: SLIDE.from };
  return { o: 1, y: +lerp(SLIDE.from, 0, EASE(span(t, SLIDE.at, SLIDE.at + SLIDE.for))).toFixed(3) };
}
function msgAt(t) {
  if (t < MSG_T.at) return { o: 0, s: 0.6, y: 12 };
  const p = span(t, MSG_T.at, MSG_T.at + MSG_T.for);
  return { o: +span(t, MSG_T.at, MSG_T.at + 0.08).toFixed(4), s: +lerp(0.6, 1, POP(p)).toFixed(4), y: +((1 - EASE(p)) * 12).toFixed(3) };
}

/* ---------- the zone: the pop, stretched and squashed ---------- */
function zoneAt(t) {
  const z = { x: 0, y: 0, sx: 1, sy: 1, rot: 0 };
  if (t < LAND + 0.4) {
    const y = k => lerp(POP_IN.from, MID.y, RISE(span(k, POP_IN.at, LAND))) - MID.y;
    z.y = y(t);
    const v = (y(t + 1 / 240) - y(t - 1 / 240)) * 120;
    const st = clamp(-v / 2600, -0.4, 1) * 0.20;
    const sq = t >= LANDSQ.at && t < LANDSQ.at + LANDSQ.for ? LANDSQ.by * Math.sin(Math.PI * span(t, LANDSQ.at, LANDSQ.at + LANDSQ.for)) * (1 - 0.5 * span(t, LANDSQ.at, LANDSQ.at + LANDSQ.for)) : 0;
    const s = st - sq;
    z.sy = 1 + s; z.sx = 1 / (1 + s);
  }
  return z;
}

/* ---------- the gaze, post25's ---------- */
const GAZE = { span: 172, max: 0.60, vspan: 200, vy: 2.4, in: 0.26, out: 0.22 };
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
/* the plate as it comes in, the message while it is read, the lens for the stop */
const MSG_AT = { x: VW / 2, y: MSGBOX.top + 40 };
const LOOKS = [
  [SLIDE.at + 0.10, PLATE_IN + 0.20, () => ({ x: DISH.bx, y: DISH.by })],
  [MSG_T.at + 0.12, TAKES[0].end + 0.05, () => MSG_AT],
];
function gazeAt(t) {
  let q = 0, v = 0;
  for (const [a, b, at] of LOOKS) {
    const w = smooth(span(t, a, a + GAZE.in)) * (1 - smooth(span(t, b - GAZE.out, b)));
    if (w <= 0) continue;
    const p = at(t);
    q += clamp((p.x - PLATE.cx) / GAZE.span, -1, 1) * GAZE.max * w;
    v += clamp((p.y - EYE_PAGE_Y) / GAZE.vspan, -1, 1) * w;
  }
  return { q: +q.toFixed(5), v: +v.toFixed(5) };
}
function blinkAt(t) {
  const B = BLINK, c = B.at + B.close, h = c + B.hold;
  if (t < B.at || t >= h + B.open) return 0;
  if (t < c) return EASE(span(t, B.at, c));
  if (t < h) return 1;
  return 1 - smooth(span(t, h, h + B.open));
}
function compose(t) {
  const mas = mascotFrame(plan, t);
  applyGaze(mas, gazeAt(t));
  const bl = blinkAt(t);
  if (t >= HAND.at && t < CUT) for (const e of mas.eyes) e.lid = bl;
  else if (bl > 0) for (const e of mas.eyes) e.lid = Math.max(e.lid, bl);
  /* the stop is held: from the frame the pose settles, the gloves are the
     settled frame's gloves, so the wave's rocking and its exit never play */
  if (t >= C.settled) mas.hands = HELD;
  mas.shadow = { ...mas.shadow, o: 0 };
  return mas;
}

/* ---------- the bubble, post37's ---------- */
function pillPop(t, at, outAt) {
  const inP = span(t, at, at + BUB.pillFor), outP = span(t, outAt, outAt + BUB.outFor);
  if (t < at) return { o: 0, s: BUB.from };
  if (outP >= 1) return { o: 0, s: BUB.outFrom };
  return { o: +(span(t, at, at + 0.08) * (1 - outP)).toFixed(4),
    s: +(outP > 0 ? lerp(1, BUB.outFrom, smooth(outP)) : lerp(BUB.from, 1, POP(inP))).toFixed(4) };
}
function bubbleAt(t) {
  if (t < SAY || t >= BUB_GONE) return { o: 0, dots: [{ o: 0, s: 0.4 }, { o: 0, s: 0.4 }], pill: { o: 0, s: BUB.from } };
  const d0 = pillPop(t, SAY, SAY_OUT + 2 * BUB.outStep), d1 = pillPop(t, SAY + BUB.step, SAY_OUT + BUB.outStep), pl = pillPop(t, SAY + 2 * BUB.step, SAY_OUT);
  return { o: Math.max(d0.o, d1.o, pl.o), dots: [d0, d1], pill: pl };
}

/* ---------- the glitch, post37's ---------- */
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
let PILL_W = 240;
function frameAt(t, f) {
  return {
    t: +t.toFixed(4), f, mo: t < CUT ? 1 : 0,
    zone: zoneAt(t), plate: plateAt(t), msg: msgAt(t),
    bub: { ...bubbleAt(t), w: PILL_W },
    g: glitchAt(f),
    wm: { o: t >= WM1.at ? 1 : 0, sc: +(1 + (1 - EASE(span(t, WM1.at, WM1.at + WM1.for))) * 0.085).toFixed(4), glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4) },
  };
}

/* ========================================================================== */
/* the page                                                                   */
/* ========================================================================== */
const dataUrl = file => 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
function sceneHtml() {
  const brand = brandTokens();
  const mcss = mascotCss(plan);
  const tok = /\[data-theme=dark\] \.m-zone\{([^}]*)\}/.exec(mcss)[1];
  const tokens = ['face', 'eye', 'bub'].map(k => '--' + k + ':' + new RegExp('--' + k + ':\\s*([^;]+);').exec(tok)[1]).join(';');
  const chan = (id, row) => `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${row}"/></filter>`;
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post38</title>
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
.vignette{position:fixed;inset:-10%;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 78% 62% at 50% 46%,rgba(255,255,255,.030) 0%,rgba(255,255,255,.010) 46%,rgba(0,0,0,0) 72%);
  will-change:transform,opacity;animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{from{transform:scale(1) translate3d(0,0,0);opacity:.85}to{transform:scale(1.05) translate3d(0,-1.1%,0);opacity:1}}
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;background:var(--bg);overflow:hidden}

/* ---- the plate: the photo, as it is ---- */
#dish{position:absolute;left:${DISH.left}px;top:${DISH.top}px;width:${DISH.size}px;height:${DISH.size}px;z-index:2;opacity:0;will-change:transform}
#dish img{position:absolute;inset:0;width:100%;height:100%;display:block}

#mas-cut{position:absolute;inset:0;z-index:4;opacity:1}
${mcss}
.m-glow-mid{filter:blur(${GLOW.mid.blur}px)}
.m-glow-wide{filter:blur(${GLOW.wide.blur}px)}

/* ---- the phone message: a grey received bubble, and a small label ---- */
#msgw{position:absolute;left:0;right:0;top:${MSGBOX.top}px;z-index:6;display:flex;justify-content:center;pointer-events:none}
#msg{display:block;opacity:0;transform-origin:50% 100%;will-change:transform,opacity}
#msg .lab{display:block;margin:0 0 6px ${MSGBOX.padX - 4}px;font-family:var(--cap);font-weight:600;font-size:${MSGBOX.label}px;letter-spacing:.02em;color:var(--muted)}
#msg .txt{display:inline-block;padding:${MSGBOX.padY}px ${MSGBOX.padX}px;background:var(--pill-on-hover);color:var(--fg);
  font-family:var(--cap);font-weight:600;font-size:${MSGBOX.size}px;line-height:1.25;white-space:nowrap;border-radius:22px 22px 22px 6px}

/* ---- the house thought bubble, post37's ---- */
.sb{${tokens};position:absolute;inset:0;z-index:6;pointer-events:none}
.sb i{position:absolute;display:block;border-radius:50%;background:var(--eye);border:${BUBBLE.stroke}px solid var(--bub);opacity:0;will-change:transform,opacity}
#sb-d0{left:${(BUB.c0x - BUB.d0 / 2).toFixed(2)}px;top:${(BUB.c0y - BUB.d0 / 2).toFixed(2)}px;width:${BUB.d0}px;height:${BUB.d0}px}
#sb-d1{left:${(BUB.c1x - BUB.d1 / 2).toFixed(2)}px;top:${(BUB.c1y - BUB.d1 / 2).toFixed(2)}px;width:${BUB.d1}px;height:${BUB.d1}px}
.sb .p{position:absolute;left:50%;top:${BUB.py}px;width:var(--pill-w,240px);height:${BUB.h}px;
  margin-left:calc(var(--pill-w,240px) / -2);margin-top:${-BUB.h}px;
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

/* ---- the glitch, post37's ---- */
.gl{position:absolute;inset:0;z-index:30;background:var(--bg);isolation:isolate;overflow:hidden;display:none}
.gl img{position:absolute;left:0;top:0;width:${VW}px;height:${VH}px;display:block;will-change:transform}
.gl .ch{mix-blend-mode:screen}
.gl .r{filter:url(#p38-r)}
.gl .g{filter:url(#p38-g)}
.gl .b{filter:url(#p38-b)}
.gl .sl{position:absolute;inset:0;overflow:hidden;clip-path:inset(var(--st,0px) 0 var(--sb,100%) 0)}
</style>
</head>
<body>
<div class="vignette" aria-hidden="true"></div>
<div class="stage" id="stage">
  <div id="dish"><img alt="" src="${dataUrl(ASSET)}"></div>
  <div id="mas-cut">${mascotMarkup(plan)}</div>
  <div class="sb" id="sb">
    <i id="sb-d0"></i><i id="sb-d1"></i>
    <span class="p" id="sb-p"><span id="pl0">${PILL}</span></span>
  </div>
  <div id="msgw"><div id="msg"><span class="lab">${MSG.label}</span><span class="txt" id="msg-t">${MSG.text}</span></div></div>
  <div class="wm" id="wm">${WM.lines.map(l => '<span>' + l + '</span>').join('')}</div>
  <div class="gl" id="gl">
    <img class="ch r" id="gl-r" alt=""><img class="ch g" id="gl-g" alt=""><img class="ch b" id="gl-b" alt="">
    ${Array.from({ length: GL.slices }, (_, i) => '<div class="sl" id="sl' + i + '"><img id="sl' + i + 'i" alt=""></div>').join('\n    ')}
  </div>
  <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    ${chan('p38-r', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0')}
    ${chan('p38-g', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0')}
    ${chan('p38-b', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0')}
  </defs></svg>
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
window.__P38 = ${JSON.stringify({ VW, VH, WM, SLICES: GL.slices, PAD: BUB.padX, STROKE: BUBBLE.stroke, D1X: BUB.c1x })};
${mascotRuntime()}
(${scenePage.toString()})();
Promise.all([document.fonts.load('400 40px Michroma'), document.fonts.load('${BUB.weight} ${BUB.size}px Nunito')])
  .then(function () { return Promise.all([].slice.call(document.images).filter(function (i) { return i.src; }).map(function (i) { return i.decode(); })); })
  .then(function () { return document.fonts.ready; })
  .then(function () { window.__built = Object.assign({}, window.__p38.fit(), { mas: window.__mas.build() }); });
</script>
</body>
</html>`;
}

function scenePage() {
  const P = window.__P38;
  const stage = document.getElementById('stage');
  const dish = document.getElementById('dish');
  const zone = document.getElementById('m-zone');
  const cut = document.getElementById('mas-cut');
  const dots = [document.getElementById('sb-d0'), document.getElementById('sb-d1')];
  const pill = document.getElementById('sb-p');
  const text = document.getElementById('pl0');
  const msg = document.getElementById('msg');
  const wm = document.getElementById('wm');
  const gl = document.getElementById('gl');
  const chans = ['r', 'g', 'b'].map(k => document.getElementById('gl-' + k));
  const slices = [], sliceImgs = [];
  for (let i = 0; i < P.SLICES; i++) { slices.push(document.getElementById('sl' + i)); sliceImgs.push(document.getElementById('sl' + i + 'i')); }
  const rg = el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
  window.__p38 = {
    fit() {
      wm.style.fontSize = '100px';
      let widest = 0;
      for (const sp of wm.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      const ws = 100 * P.WM.w / widest;
      wm.style.fontSize = ws.toFixed(2) + 'px';
      return { wm: +ws.toFixed(2), pill: +(rg(text).width + 2 * P.PAD + 2 * P.STROKE).toFixed(2) };
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
      cut.style.opacity = o.mo ? 1 : 0;
      const z = o.zone;
      zone.style.transform = 'translate(' + z.x.toFixed(2) + 'px,' + z.y.toFixed(2) + 'px) rotate(' + z.rot.toFixed(2) + 'deg) scale(' + z.sx.toFixed(5) + ',' + z.sy.toFixed(5) + ')';
      dish.style.opacity = o.mo ? o.plate.o : 0;
      dish.style.transform = 'translateY(' + o.plate.y.toFixed(2) + 'px)';
      msg.style.opacity = o.mo ? o.msg.o.toFixed(4) : 0;
      msg.style.transform = 'translateY(' + o.msg.y.toFixed(2) + 'px) scale(' + o.msg.s.toFixed(4) + ')';
      for (let i = 0; i < 2; i++) {
        dots[i].style.opacity = o.bub.dots[i].o.toFixed(4);
        dots[i].style.transform = 'scale(' + o.bub.dots[i].s.toFixed(4) + ')';
      }
      pill.style.opacity = o.bub.pill.o.toFixed(4);
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

/* ---------- the shutter, solved off the fastest thing at sixty ---------- */
const fastest = (fn, a, b) => { let d = 0; for (let f = Math.ceil(a * 60); f < Math.ceil(b * 60); f++) d = Math.max(d, Math.abs(fn((f + 1) / 60) - fn(f / 60))); return +d.toFixed(2); };
const FASTEST = Math.max(fastest(t => zoneAt(t).y, 0, LAND + 0.1), fastest(t => plateAt(t).y, SLIDE.at, SLIDE.at + SLIDE.for));
if (BLUR) { SUB = Math.max(2, Math.min(SUB_MAX, Math.ceil(FASTEST / SUB_STEP_WANT))); SUBSTEP = STEP / SUB; }

/* ---------- the clock, printed, with the moments a sound would want ---------- */
console.log('\npost38, no thanks i use ai. ' + SECONDS + 's, seed ' + SEED + ', ' + FPS + 'fps, ' + (BLUR ? SUB + ' subframes' : 'shutter closed'));
console.log('  the stop hand: ' + path.relative(ROOT, HAND_FILE) + ', the rig\'s wave pose, held from ' + C.settled.toFixed(2) + 's');
for (const [t, what] of [[0, 'the pop starts'], [LAND, 'he lands'], [SLIDE.at, 'the plate slides in'], [PLATE_IN, 'the plate stops, the message pops'],
  [TAKES[0].at, 'the human: ' + TAKES[0].text + ' (to ' + TAKES[0].end.toFixed(2) + ')'], [HAND.at, 'the glove comes up'], [C.settled, 'the glove lands, held'],
  [TAKES[1].at, 'he says: ' + TAKES[1].text + ' (to ' + TAKES[1].end.toFixed(2) + ')'], [BLINK.at, 'the blink'], ...GL.bursts.map(b => [b.t, 'glitch']), [CUT, 'the wordmark']]) {
  console.log('    ' + t.toFixed(2).padStart(5) + 's  ' + what);
}

function ff(args, stderr = false) {
  if (!stderr) return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  const { spawnSync } = process.getBuiltinModule('node:child_process');
  return spawnSync(ffmpeg, args, { encoding: 'utf8' }).stderr;
}
/* ---------- the bus: the two reads and nothing else, to -14 ---------- */
const VTRACK = new Float32Array(Math.ceil((SECONDS + 0.5) * SR));
for (const T of TAKES) {
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
const WAV = path.join(OUT, 'post38-mix.wav'), RAW = path.join(OUT, 'post38-mix-raw.wav');
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
/* the aac encode reads about half a unit quieter than the wav it was made
   from, measured on this clip, so the wav is aimed that much above target
   and the guard checks the mp4 */
const AAC_LOSS = 0.5;
/* the limiter alone stops short of -14 on two dry reads without squashing
   them flat, so the last step is ffmpeg's own loudness normaliser, measured
   first and then applied, to -14 integrated with a -1.5 true peak ceiling */
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

  const put = async (t, f) => {
    const o = frameAt(t, f);
    await page.evaluate(fr => window.__mas.apply(fr), compose(t));
    await page.evaluate(fr => window.__p38.apply(fr), o);
    if (o.g.heat > 0) {
      const clean = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
      if (!await page.evaluate((src, g) => window.__p38.glitch(src, g), 'data:image/png;base64,' + clean.data, o.g)) throw new Error('the glitch image did not decode at ' + t);
    }
    return o;
  };

  /* the margin: everything a viewer reads, the plate, his ink and the glove,
   sampled every tenth of a second once each has arrived. */
  const fails = [];
  const SB = { l: FLOOR_CSS, t: FLOOR_CSS, r: VW - FLOOR_CSS, b: VH - FLOOR_CSS };
  for (let t = LAND; t < CUT - 0.45; t += 0.1) {
    await put(t, Math.round(t * FPS));
    for (const sel of ['#sb-p', '#sb-d1', '#msg', '#m-card', '#m-hands-ink', '#dish']) {
      if (sel === '#dish' && t < SLIDE.at + SLIDE.for) continue;
      const r = await page.evaluate(s => window.__p38.rect(s), sel);
      if (!r || !r.w) continue;
      let q = r;
      if (sel === '#dish') { const k = r.w / IMG; q = { l: r.l + PHOTO.dish.x0 * k, r: r.l + PHOTO.dish.x1 * k, t: r.t + PHOTO.box.y0 * k, b: r.t + PHOTO.dish.y1 * k }; }
      if (q.l < SB.l - 0.5 || q.t < SB.t - 0.5 || q.r > SB.r + 0.5 || q.b > SB.b + 0.5) fails.push(sel + ' at ' + t.toFixed(1) + 's: ' + [q.l, q.t, q.r, q.b].map(v => v.toFixed(1)).join(' / '));
    }
    /* his bubble and the glove must not overlap */
    const p = await page.evaluate(() => window.__p38.rect('#sb-p')), h = await page.evaluate(() => window.__p38.rect('#m-hands-ink'));
    if (p && h && p.w && h.w && p.l < h.r && h.l < p.r && p.t < h.b && h.t < p.b) fails.push('the bubble overlaps the glove at ' + t.toFixed(1) + 's');
  }
  /* the message: 40 under the plate at rest, centred, clear of the app zone */
  await put(TAKES[0].end, Math.round(TAKES[0].end * FPS));
  const mr = await page.evaluate(() => window.__p38.rect('#msg'));
  if (!mr) fails.push('the message is not up while it is read');
  else {
    if (Math.abs(mr.t - MSGBOX.top) > 0.6) fails.push('the message top is ' + mr.t.toFixed(1) + ', not ' + MSGBOX.top);
    if (Math.abs((mr.l + mr.r) / 2 - VW / 2) > 0.6) fails.push('the message is not centred');
    if (mr.b > VH - APP_ZONE) fails.push('the message reaches into the bottom ' + APP_ZONE + ' css px');
    console.log('  the message: top ' + mr.t.toFixed(1) + ', ' + (mr.t - PLATE_BOTTOM).toFixed(1) + ' under the plate, bottom ' + mr.b.toFixed(1)
      + ', clear of the app zone by ' + (VH - APP_ZONE - mr.b).toFixed(1) + ' css px');
  }
  await put(CUT + 0.3, Math.round((CUT + 0.3) * FPS));
  const wr = await page.evaluate(() => window.__p38.rect('#wm'));
  if (wr && (wr.l < SB.l || wr.r > SB.r)) fails.push('the wordmark is past the margin');

  const wall = Date.now();
  let glitched = 0;
  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
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

  fs.rmSync(VERIFY, { recursive: true, force: true });
  fs.mkdirSync(VERIFY, { recursive: true });
  for (const [want, name] of [[lerp(TAKES[0].at, TAKES[0].end, 0.6), 'a-the-offer'], [lerp(TAKES[1].at, TAKES[1].end, 0.6), 'b-the-stop'], [CUT + 0.5, 'c-the-wordmark']]) {
    const f = Math.round(want * FPS);
    await put(f / FPS, f);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
    fs.writeFileSync(path.join(VERIFY, name + '.png'), Buffer.from(shot.data, 'base64'));
  }
  await browser.close();
  srv.close();
  if (SUB > 1) ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS * SUB), '-i', path.join(SUBS, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1) + ',setpts=PTS-STARTPTS,framestep=' + SUB, '-q:v', '2', path.join(FRAMES, 'f%05d.jpg')]);
  return { frames: N, glitched, fails };
}

const state = await render();
const FILE = path.join(OUT, 'post38-dark-1080x1920.mp4');
ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'), '-i', WAV,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', FILE]);
if (!KEEP) { fs.rmSync(FRAMES, { recursive: true, force: true }); fs.rmSync(SUBS, { recursive: true, force: true }); }

/* ---------- the guards ---------- */
let probe = '';
try { execFileSync(ffmpeg, ['-hide_banner', '-i', FILE], { stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { probe = (e.stderr || '').toString(); }
const dur = probe.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
const seconds = dur ? +dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3]) : 0;
const fail = [...state.fails];
if (!/1080x1920/.test(probe)) fail.push('the file is not 1080x1920');
if (Math.abs(seconds - SECONDS) > 0.15) fail.push('the file runs ' + seconds.toFixed(2) + 's, not ' + SECONDS);
if (!/Audio:/.test(probe)) fail.push('the file has no audio track');
if (TAKES[1].at < TAKES[0].end) fail.push('his line starts before the offer ends');
if (Math.abs(MSG_T.at - PLATE_IN) > 1e-6) fail.push('the message does not pop as the plate stops');
/* the glove is still from its settled frame to the cut: the same numbers, every frame */
for (let f = Math.ceil(C.settled * 60); f < Math.floor(CUT * 60); f++) {
  if (JSON.stringify(compose(f / 60).hands) !== JSON.stringify(HELD)) { fail.push('the glove moves at ' + (f / 60).toFixed(2) + 's'); break; }
}
const lu = loudness(ffmpeg, FILE);
if (!lu || !lu.ok) fail.push('the loudness could not be measured');
else if (Math.abs(lu.lufs - TARGET_LUFS) > 0.5) fail.push('the bus is ' + lu.lufs + ' LUFS, not ' + TARGET_LUFS);
console.log('\n  loudness ' + (lu && lu.lufs) + ' LUFS integrated, true peak ' + (lu && lu.truePeak) + ' dBFS, on the mp4');
console.log('  ' + state.glitched + ' glitched frames, three stills in ' + path.relative(ROOT, VERIFY));
console.log('  length ' + seconds.toFixed(2) + 's, voice only on the bus, ' + path.relative(ROOT, FILE));
if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('  guards: all green');
