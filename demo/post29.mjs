/* the boring tek — post29.

   dark only, 1080x1920, four lines read by edge's andrew. the offer. he sits
   small in the bottom left, three captions type in big in the middle one after
   another while a voice says them, he waves once, then the caption clears, he
   jumps into the middle of the frame, lands with post20's squash, grows to
   the house size and a bubble pops over his crown with the address.

     0.0  caption one types in the middle, silently, cut to the read word by
          word: `if you need help with ai.`
     2.5  caption two replaces it: `the boring tek is between you and ai.`
     5.0  caption three: `write to us. it costs nothing.` he does one small
          wave with the wave hand, screen right, the one that gestures into
          the frame from a bottom left corner.
     8.0  the caption clears on the frame. a crouch, then he jumps from the
          corner into the middle of the safe band, growing from 0.65 of the
          house size to all of it in the air, and lands 1.52 wide by 0.66
          tall, chin on the ground, post20's table. the pill pops on the word
          `the` of `the boring tek`, floored just after the landing, and
          `delighted` hops once the rebound is done.
          voice line four is `go to. the boring tek, dot com.`: `go to` is
          the jump and the address is the bubble.
     END  the fault, 0.08s after the read's last sound, post20's rule. the
          brief says 10.5 and the read says a shade later; see the report.
          the wordmark stacked three lines, post23's ending, 0.95s of card.

     node post29.mjs                     1080x1920, 60fps, shutter closed
     DEMO_FPS=12 node post29.mjs         the fast preview pass
     node post29.mjs --voice             the read and the clock only, no browser
     node post29.mjs --blur              60fps with the shutter open, solved
     node post29.mjs --blur=6            the same with the count said outright
     node post29.mjs --keep-frames       leave the jpegs on disk
     node post29.mjs --encode-only       re-encode from kept frames

   one output, one path, overwritten every run:

     demo/out/post29-dark-1080x1920.mp4

   ---------- what is borrowed and from where ----------

   **the mascot is `lib/mascot.mjs` and nothing here reaches inside it.**
   three marks: neutral, neutral with the wave, delighted after the landing.
   `bias: 0` because he ends up centred talking to the lens, post20's note.
   the small corner state and the jump are one transform composed onto
   `frame.card`, post20's own pattern for the fall, and the landing is post20's
   table at post20's numbers. the gloves are gated to the wave alone, post20's
   two gates, so no hand is drawn on the fall or the jump.

   **the voice is edge, on purpose.** elevenlabs is not available for this
   clip, so every take says `provider: 'edge'` outright and the sidecar is
   asserted on it. the read is `calm`, which is andrew, with a rate and a pitch
   a line: a shade quick and a hair up reads as somebody pleased to be saying
   it, post20's finding, and two lines carry a quicker rate because they are
   eight and seven words in two and a half second beats.

   **the bubble is drawn here, in the module's own numbers.** the module hangs
   its pill to one side of the crown, which is right for two words and wrong
   for an address: from a centred head `theboringtek.com` at the pill's own
   size runs past the edge of the frame. so the two dots and the pill are laid
   straight up over the crown, centred, from `BUBBLE`'s sizes, tokens, stagger
   and spring, and held up until the fault the way post22 freezes the module's.

   **the end is post23's**, via post27: the wordmark, two stutters, the hit,
   the bands, the noise and the flash, unchanged.

   the typing is silent. no key ticks, no music. the bus is a thud on the
   landing, a pop on the pill and the fault, and nothing else. */

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  planMascot, mascotFrame, mascotMotion, mascotCues, mascotCss, mascotMarkup,
  mascotRuntime, mascotPagePlan, describeMascot, describeMotion, headRect,
  STAGE, SAFE, HEAD, GRID, BUBBLE,
} from './lib/mascot.mjs';
import { brandTokens, checkCopy } from './lib/captions.mjs';
import { speak, VOICE_OUT } from './lib/voice.mjs';
import {
  renderSfx, writeWav, applyGain, limit, loudness, decode, mixdown,
  voiceEnvelope, checkUnderVoice, describeMix, SR,
} from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post29');
const SUBS = path.join(OUT, 'subframes-post29');
const VERIFY = path.join(OUT, 'verify-post29');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = STAGE.dsf;
const VW = STAGE.w, VH = STAGE.h;
const SAFE_CSS = { top: SAFE.top / DSF, bottom: SAFE.bottom / DSF, left: SAFE.left / DSF, right: SAFE.right / DSF };

const argv = process.argv.slice(2);
const ONLY_ENCODE = argv.includes('--encode-only');
const VOICE_ONLY = argv.includes('--voice');
const KEEP = argv.includes('--keep-frames');
/* the shutter, post26's rule: solved off the fastest thing in the cut, which
   here is the jump's take off. `--blur=8` still says it outright. */
const BLUR = argv.some(a => a === '--blur' || a.startsWith('--blur='));
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

/* ---------- where he ends up ----------
   post12's line: the middle of the safe band, not of the frame. 148 is the
   house head, 240 device px. */
const CENTRE_Y = (SAFE_CSS.top + (VH - SAFE_CSS.bottom)) / 2;
const SIZE = 148;

/* ---------- the beats, the brief's ---------- */
const BEAT = [0.0, 2.5, 5.0, 8.0];
const BRIEF_END = 10.5;
const CARD = 0.95;

/* ---------- the copy, and the read ----------
   the screen lines are broken by hand so a line never wraps on its own, and
   every line's words are the take's words: the typing is cut to the read and
   a caption that does not match its take cannot be.

   **the read keeps its full stops and the screen drops the last one.** the
   stop is what the synthesiser turns into the sentence's fall, so it stays in
   `text`; on a caption it is a dot doing no work, so the final one is gone
   from `lines`. a stop inside a caption stays, because `write to us. it costs
   nothing` is two sentences and the second line is the second one. */
const VOICE = 'calm';
const LINES = [
  { lines: ['if you need', 'help with ai'], text: 'if you need help with ai.', rate: '-4%', pitch: '+2Hz' },
  { lines: ['the boring tek is', 'between you and ai'], text: 'the boring tek is between you and ai.', rate: '+6%', pitch: '+1Hz' },
  { lines: ['write to us.', 'it costs nothing'], text: 'write to us. it costs nothing.', rate: '-4%', pitch: '+3Hz' },
  /* the full stop after `go to` is post11's domain read: the stop is the pause
     and the pause is what makes the address a thing you go to. */
  { lines: [], text: 'go to. the boring tek, dot com.', rate: '+2%', pitch: '+2Hz' },
];
const ADDRESS = 'theboringtek.com';
const SILENCE_DB = -42;
const PRE = 0.06, POST = 0.10, EDGE_FADE = 0.012;
const AFTER_READ = 0.08;

/* ---------- the caption ----------
   big, in the middle, nunito at semibold, one at a time. the block's middle
   sits on the safe band's middle, where he will land once it has cleared. */
const CAP = { size: 36, lh: 1.25, caretHz: 2.4, caretAfter: 0.20 };

/* ---------- where he sits, and the jump ----------
   small in the bottom left: 0.65 of the house size, his ink a little clear of
   the two safe edges. the jump is a crouch, a ballistic flight that grows him
   to the house size on the way, and post20's landing. `rise` is how far above
   the chord the arc goes, and it is what sets the landing speed: at 230 he
   arrives at post20's own 37.7 css px a frame and leaves the corner at the
   same. */
const SMALL = { s: 0.65, left: 80, bottom: 120 };
const JUMP = { at: BEAT[3], anti: 0.14, antiK: 0.12, for: 0.55, rise: 230, air: 0.10 };
const LAND = +(JUMP.at + JUMP.anti + JUMP.for).toFixed(4);
const SMASH = { flat: 0.07, back: 0.42, k: 0.52, damp: 4.2, cycles: 1.15 };
const REBOUND = +(LAND + SMASH.flat + SMASH.back).toFixed(4);

/* ---------- the wave ----------
   one small wave, the pose's own entrance and exit, a hold short enough that
   the hand is home well before the jump. */
const WAVE = { at: BEAT[2], hold: 0.90 };
const GLOVE_IN = 0.18, GLOVE_OUT = 0.22;
let GATE = null;

/* ---------- the bubble ----------
   pops on the word `the` of the address, floored a beat after the chin hits
   the ground, and stays up to the fault. */
const BUB = { floorAfter: SMASH.flat + 0.10, at: 0, pill: 0, dotFor: BUBBLE.dotFor, pillFor: BUBBLE.pillFor, step: BUBBLE.step };

/* ---------- the end, post27's ---------- */
const END = { at: 0, pre: [], hard: 0.12, tail: 0.18, wmIn: 0, wmFor: 0.09 };
let SECONDS = 0;
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16, minCapPx: 56 };
const GL = { shakeX: 15, shakeY: 8, split: 9.5, bandDx: 88, bands: 3, noise: [0.10, 0.24], flash: 0.30, flashSize: 420, calmFrom: 0.86 };

const CRF = 17;
const TARGET_LUFS = -14;
const SAMPLE_CEILING = -1.8;
const PEAK_CEILING = -1.0;
const MAX_REDUCTION = 5.0;
const DUCK = 0.50;
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
const POP = bezier(.34, 1.4, .64, 1);          /* the site's own --spring */
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))));
const lerp = (a, b, p) => a + (b - a) * p;
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
  return 1 + amp * 0.78 * Math.sin(2 * Math.PI * t / slow) + amp * 0.39 * Math.sin(2 * Math.PI * t / fast + phase);
}

/* ---------- the read ----------
   one take a line, cached on the copy and the delivery, post20's shape. every
   take is asked for on edge by name and refused if it came back from anywhere
   else, because a cached elevenlabs take with the same copy would otherwise
   pass silently. */
async function take(i) {
  const L = LINES[i];
  const name = 'post29-l' + (i + 1);
  const cached = path.join(VOICE_OUT, name + '-' + VOICE + '.json');
  const want = L.text.replace(/\s+/g, ' ').trim();
  let got = null;
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === want && j.rate === L.rate && j.pitch === L.pitch && j.provider === 'edge' && fs.existsSync(j.file)) got = { ...j, cached: true };
  }
  if (!got) got = { ...(await speak(L.text, { voice: VOICE, provider: 'edge', name, rate: L.rate, pitch: L.pitch })), cached: false };
  if (got.provider !== 'edge') throw new Error('take ' + (i + 1) + ' was read by ' + got.provider + ', and this clip is edge');
  if (got.timing !== 'engine') throw new Error('take ' + (i + 1) + ' came back with estimated timings, and the picture is cut to the read');
  return { ...got, i };
}
/* where a take's sound starts and stops, off the waveform. post19's. */
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

/* ---------- the typing ----------
   post17's rule at the character: a word's characters are laid across that
   word's spoken span, so the caption is being typed while the word is being
   said and is whole when it ends. the separator before a word arrives with
   the word. silent. `TYPED[i]` is the schedule of caption i on the clip's
   clock and `charsAt` counts it. */
const TYPED = [[], [], []];
function typedOf(i, words) {
  const copy = LINES[i].lines.join('\n');
  const out = [];
  let p = 0;
  for (const w of words) {
    /* the separator, if there is one, and then the word's own characters */
    while (p < copy.length && /\s/.test(copy[p])) { out.push({ ch: copy[p], t: w.start }); p++; }
    const n = w.word.length;
    for (let k = 0; k < n; k++) { out.push({ ch: copy[p], t: +lerp(w.start, w.end, k / n).toFixed(4) }); p++; }
  }
  if (p !== copy.length) throw new Error('caption ' + (i + 1) + ' has characters the read never typed');
  return out;
}
const charsAt = (i, t) => TYPED[i].filter(e => e.t <= t).length;
const typedEnd = i => TYPED[i][TYPED[i].length - 1].t;

/* ---------- where he is, and how big ----------
   the corner to the centre. before the jump he is small in the corner; the
   crouch is a squash in place; the flight is ballistic on the chord with the
   arc `rise` above it, the scale easing to one across it; then he is home. */
const SMALL_R = HEAD.plate.s / GRID * SIZE * SMALL.s / 2;
const SMALL_C = { x: +(SAFE_CSS.left + (SMALL.left - SAFE_CSS.left) + SMALL_R).toFixed(3), y: +(VH - SMALL.bottom - SMALL_R).toFixed(3) };
const HOME = { x: VW / 2, y: CENTRE_Y };
const FLY = { at: +(JUMP.at + JUMP.anti).toFixed(4), to: LAND };
function placeAt(t) {
  if (t >= LAND) return { dx: 0, dy: 0, s: 1 };
  const dx0 = SMALL_C.x - HOME.x, dy0 = SMALL_C.y - HOME.y;
  if (t < FLY.at) return { dx: dx0, dy: dy0, s: SMALL.s };
  const p = span(t, FLY.at, FLY.to);
  /* y0 + v0 p + a p² / 2 with y(1) = y1 and the apex `rise` above the chord */
  const v0 = dy0 * -1 - 4 * JUMP.rise, a = 8 * JUMP.rise;
  const dy = dy0 + v0 * p + a * p * p / 2;
  return { dx: +lerp(dx0, 0, p).toFixed(3), dy: +dy.toFixed(3), s: +lerp(SMALL.s, 1, EASE(p)).toFixed(5) };
}
/* the crouch, the stretch in the air and post20's landing, as one squash
   channel: positive is wide and short, negative is tall and thin. */
function squashAt(t) {
  if (t < JUMP.at || t >= REBOUND) return 0;
  if (t < FLY.at) return +(JUMP.antiK * EASE(span(t, JUMP.at, FLY.at))).toFixed(5);
  if (t < LAND) return +lerp(JUMP.antiK, -JUMP.air, EASE(span(t, FLY.at, FLY.at + 0.12))).toFixed(5);
  const flat = span(t, LAND, LAND + SMASH.flat);
  if (flat < 1) return +lerp(-JUMP.air, SMASH.k, EASE(flat)).toFixed(5);
  const p = span(t, LAND + SMASH.flat, REBOUND);
  return +(SMASH.k * Math.exp(-SMASH.damp * p) * Math.cos(2 * Math.PI * SMASH.cycles * p) * (1 - p)).toFixed(5);
}

/* ---------- the mascot for one instant, composed ----------
   the module's frame with three things written over it: the glove gate, the
   place and size, and the squash with post20's ground compensation. the
   gloves scale with the head through `card`, which is what a small mascot
   with small hands is, and carry the inverse of the squash alone so they do
   not deform under it, post20's line. the shadow is declined, post26. */
function compose(plan, t) {
  const f = mascotFrame(plan, t);
  if (f.hands && GATE) {
    const g = span(t, GATE.from, GATE.from + GLOVE_IN) * (1 - span(t, GATE.leaving, GATE.leaving + GLOVE_OUT));
    f.hands = { ...f.hands, list: f.hands.list.map((h, k) => ({ ...h, o: +(h.o * (GATE.acting.includes(k) ? g : 0)).toFixed(4) })) };
  }
  const P = placeAt(t);
  const k = squashAt(t), sq = 1 + k;
  const R = HEAD.plate.s / 2 * plan.unit * P.s;
  /* the ground compensation holds his bottom edge on the ground while he is
     on it: through the crouch, until the stretch takes over in the air, and
     from the chin hitting the floor on. continuous at both ends. */
  const grounded = (t >= JUMP.at && t < LAND && k > 0) || t >= LAND;
  const ground = grounded ? R * (1 - 1 / sq) : 0;
  f.card = {
    ...f.card,
    x: +(f.card.x + P.dx).toFixed(4),
    y: +(f.card.y + P.dy + ground).toFixed(4),
    sx: +(f.card.sx * P.s * sq).toFixed(5),
    sy: +(f.card.sy * P.s / sq).toFixed(5),
  };
  if (f.hands && sq !== 1) f.hands = { ...f.hands, fit: { cx: +(f.hands.fit.cx / sq).toFixed(5), cy: +(f.hands.fit.cy * sq).toFixed(5) } };
  f.shadow = { ...f.shadow, o: 0 };
  return f;
}

/* ---------- the bubble ----------
   the module's dot, dot, pill on the module's stagger and the site's spring,
   laid straight up over the crown. up from the pop to the fault, no exit. */
function bubbleAt(t, f) {
  const cut = f >= Math.round(END.at * FPS);
  if (cut || t < BUB.at) return { o: 0, dots: [{ o: 0, sc: 0.2 }, { o: 0, sc: 0.2 }], pill: { o: 0, sc: 0.7, y: 6 } };
  const part = (at, len, from) => {
    const p = span(t, at, at + len);
    return { o: +span(t, at, at + 0.08).toFixed(4), sc: +lerp(from, 1, POP(p)).toFixed(4), p };
  };
  const d0 = part(BUB.at, BUB.dotFor, 0.2), d1 = part(BUB.at + BUB.step, BUB.dotFor, 0.2), pl = part(BUB.pill, BUB.pillFor, 0.7);
  return {
    o: Math.max(d0.o, d1.o, pl.o),
    dots: [{ o: d0.o, sc: d0.sc }, { o: d1.o, sc: d1.sc }],
    pill: { o: pl.o, sc: pl.sc, y: +(6 * (1 - EASE(pl.p))).toFixed(3) },
  };
}

/* ---------- the glitch, post23's via post27 ---------- */
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
    g.bands.push({ top: +(r() * (VH - h)).toFixed(1), h: +h.toFixed(1), dx: +((r() * 2 - 1) * GL.bandDx * heat).toFixed(1) });
  }
  return g;
}

/* ---------- what one frame is ----------
   every exchange, the caption swaps, the clear, the fault, is on the frame:
   post20's 60fps rule. */
const beatFrame = i => Math.round(BEAT[i] * FPS);
function capOn(f) {
  if (f >= beatFrame(3)) return -1;
  for (let i = 2; i >= 0; i--) if (f >= beatFrame(i)) return i;
  return -1;
}
function frameAt(t, f) {
  const g = glitchAt(f);
  const cut = f >= Math.round(END.at * FPS);
  const i = cut ? -1 : capOn(f);
  const chars = i < 0 ? 0 : charsAt(i, t);
  const typing = i >= 0 && t < typedEnd(i) + CAP.caretAfter;
  return {
    t: +t.toFixed(4), f,
    mo: cut ? 0 : 1,
    sx: g.sx, sy: g.sy,
    cap: {
      i, chars,
      caret: typing && (Math.floor(t * CAP.caretHz * 2) % 2 === 0) ? 1 : 0,
      /* the swap pops the way a caption card does, off the site's ease */
      sc: i >= 0 ? +(1 + (1 - EASE(span(t, BEAT[i], BEAT[i] + 0.16))) * 0.06).toFixed(4) : 1,
    },
    bub: bubbleAt(t, f),
    wm: {
      o: cut ? 1 : 0,
      sc: +(1 + (1 - EASE(span(t, END.wmIn, END.wmIn + END.wmFor))) * 0.085).toFixed(4),
      glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4),
    },
    g,
  };
}

/* ---------- the page ---------- */
function sceneHtml(plan, bubPlace) {
  const brand = brandTokens();
  const mcss = mascotCss(plan);
  /* the bubble's three tokens are the module's own dark ones, read off its
     css rather than typed again, so the pill is the module's pill. */
  const tok = /\[data-theme=dark\] \.m-zone\{([^}]*)\}/.exec(mcss)[1];
  const tokens = ['face', 'eye', 'bub'].map(k => '--' + k + ':' + new RegExp('--' + k + ':\\s*([^;]+);').exec(tok)[1]).join(';');
  const capTop = +(CENTRE_Y - CAP.size * CAP.lh).toFixed(2);
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post29</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Nunito:wght@600&family=Space+Grotesk:wght@500&display=swap">
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
  --body:"Space Grotesk",var(--mono);
  --cap:"Nunito",var(--mono);
  --split-r:rgba(255,120,120,.55); --split-c:rgba(120,220,255,.55);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}
.vignette{position:fixed;inset:-10%;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 78% 62% at 50% 46%,rgba(255,255,255,.030) 0%,rgba(255,255,255,.010) 46%,rgba(0,0,0,0) 72%);
  will-change:transform,opacity;animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{from{transform:scale(1) translate3d(0,0,0);opacity:.85}to{transform:scale(1.05) translate3d(0,-1.1%,0);opacity:1}}
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;background:var(--bg);
  transform:translate3d(calc(var(--sx,0) * 1px),calc(var(--sy,0) * 1px),0);will-change:transform}

${mcss}
#m-zone{opacity:var(--m-o,1)}

/* ---- the caption ----
   one block for the whole film, two lines whose middle sits on the safe
   band's middle. nunito at semibold, the site's ink. */
.cap{position:absolute;left:${SAFE_CSS.left}px;right:${SAFE_CSS.right}px;top:${capTop}px;
  text-align:center;font-family:var(--cap);font-weight:600;font-size:${CAP.size}px;line-height:${CAP.lh};
  color:var(--fg);white-space:pre;transform:scale(var(--cap-s,1));transform-origin:50% 50%;z-index:6}
.cap .ln{display:block;min-height:${CAP.lh}em}
.caret{display:inline-block;width:3px;height:1em;background:var(--fg);vertical-align:text-bottom;transform:translateY(.12em);margin-left:2px}

/* ---- the bubble, the module's pill laid straight up ----
   the same tokens, dots, stroke, padding, face and radius the module draws
   its own from. it is anchored to the page over the crown's highest reach
   while it is up, and it is not a child of the card, so it does not squash. */
.sb{${tokens};position:absolute;left:50%;bottom:${bubPlace.bottom}px;transform:translateX(-50%);
  display:flex;flex-direction:column-reverse;align-items:center;gap:${BUBBLE.dotGap}px;width:max-content;z-index:5;pointer-events:none}
.sb .d{display:block;border-radius:50%;background:var(--eye);border:${BUBBLE.stroke}px solid var(--bub);opacity:0;will-change:transform,opacity}
.sb #sb-d0{width:${BUBBLE.dots[0].d}px;height:${BUBBLE.dots[0].d}px}
.sb #sb-d1{width:${BUBBLE.dots[1].d}px;height:${BUBBLE.dots[1].d}px}
.sb .p{padding:${BUBBLE.padY}px ${BUBBLE.padX}px;border:${BUBBLE.stroke}px solid var(--bub);border-radius:${BUBBLE.radius}px;
  background:var(--eye);color:var(--face);font-family:var(--body);font-weight:${BUBBLE.weight};font-size:${BUBBLE.size}px;
  line-height:1.25;letter-spacing:.005em;white-space:nowrap;transform-origin:50% 100%;opacity:0;will-change:transform,opacity}

/* ---- the wordmark, post23's ---- */
.wm{position:absolute;left:50%;top:${CENTRE_Y}px;transform:translate(-50%,-50%) scale(var(--wm-s,1));
  font-family:var(--display);font-weight:400;color:var(--fg);text-align:center;text-transform:uppercase;letter-spacing:.18em;
  line-height:${WM.lh};white-space:nowrap;text-indent:.09em;opacity:var(--wm-o,0);
  text-shadow:0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),0 0 66px rgba(255,255,255,.10);
  filter:brightness(var(--wm-glow,1));z-index:8}
.wm span{display:block}
.stage[data-gl="1"] .wm{text-shadow:0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),0 0 66px rgba(255,255,255,.10),
  calc(var(--split,0) * -1px) 0 var(--split-r),calc(var(--split,0) * 1px) 0 var(--split-c)}
.tear{position:absolute;inset:0;z-index:9;overflow:hidden;background:var(--bg);
  clip-path:inset(var(--tt,0px) 0 calc(100% - var(--tt,0px) - var(--th,0px)) 0);opacity:var(--to,0)}
.tear-in{position:absolute;inset:0;transform:translate3d(calc(var(--tdx,0) * 1px),0,0)}
.noise{position:absolute;inset:-40px;z-index:10;pointer-events:none;mix-blend-mode:screen;opacity:var(--noise,0);
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.0' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23m)'/%3E%3C/svg%3E")}
.flash{position:absolute;left:50%;top:${CENTRE_Y}px;z-index:11;pointer-events:none;width:${GL.flashSize}px;height:${GL.flashSize}px;
  margin:${-GL.flashSize / 2}px 0 0 ${-GL.flashSize / 2}px;
  background:radial-gradient(circle,rgba(255,255,255,1) 0%,rgba(255,255,255,.62) 34%,rgba(255,255,255,.18) 60%,rgba(255,255,255,0) 78%);opacity:var(--flash,0)}
</style>
</head>
<body>
<div class="vignette" aria-hidden="true"></div>
<div class="stage" id="stage">
${mascotMarkup(plan)}
  <div class="sb" id="sb"><span class="d" id="sb-d0"></span><span class="d" id="sb-d1"></span><span class="p" id="sb-p">${ADDRESS}</span></div>
  <div class="cap" id="cap"><span class="ln" id="ln0"></span><span class="ln" id="ln1"></span></div>
  <div class="wm" id="wm">${WM.lines.map(l => '<span>' + l + '</span>').join('')}</div>
${Array.from({ length: GL.bands }, (_, i) => '  <div class="tear" data-tear="' + i + '"><div class="tear-in"><div class="wm">'
    + WM.lines.map(l => '<span>' + l + '</span>').join('') + '</div></div></div>').join('\n')}
  <div class="noise" aria-hidden="true"></div>
  <div class="flash" aria-hidden="true"></div>
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
window.__P29 = ${JSON.stringify({ VW, VH, DSF, WM, LINES: LINES.map(l => l.lines) })};
${mascotRuntime()}
(${scenePage.toString()})();
Promise.all([document.fonts.load('400 40px Michroma'), document.fonts.load('600 ${CAP.size}px Nunito'), document.fonts.load('${BUBBLE.weight} ${BUBBLE.size}px "Space Grotesk"')])
  .then(function () { return document.fonts.ready; })
  .then(function () { window.__built = Object.assign({}, window.__p29.fit(), { mas: window.__mas.build() }); });
</script>
</body>
</html>`;
}

/* ---------- the page's own script ----------
   writes numbers to elements and decides nothing. */
function scenePage() {
  const P = window.__P29;
  const stage = document.getElementById('stage');
  const cap = document.getElementById('cap');
  const ln = [document.getElementById('ln0'), document.getElementById('ln1')];
  const sb = document.getElementById('sb');
  const dots = [document.getElementById('sb-d0'), document.getElementById('sb-d1')];
  const pill = document.getElementById('sb-p');
  const wms = [...document.querySelectorAll('.wm')];
  const tears = [...document.querySelectorAll('.tear')];
  const tearIns = tears.map(t => t.querySelector('.tear-in'));
  let lastCap = null;
  const capOf = el => {
    const cs = getComputedStyle(el);
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    return { cap: cv.measureText('H').actualBoundingBoxAscent || 0, font: cv.font };
  };
  const box = (r, d) => ({ left: +(r.left * d).toFixed(1), top: +(r.top * d).toFixed(1),
    right: +((P.VW - r.right) * d).toFixed(1), bottom: +((P.VH - r.bottom) * d).toFixed(1),
    w: +((r.right - r.left) * d).toFixed(1), h: +((r.bottom - r.top) * d).toFixed(1) });
  window.__p29 = {
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
      const el = wms[0], c = capOf(el);
      let widest = 0;
      for (const sp of el.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      return { ...box(el.getBoundingClientRect(), P.DSF), widestPx: +(widest * P.DSF).toFixed(1), capPx: +(c.cap * P.DSF).toFixed(1), font: c.font };
    },
    /* a caption as painted, whole: every line's ink box, and the widest */
    measureCap(i) {
      const d = P.DSF, c = capOf(cap);
      for (let k = 0; k < 2; k++) ln[k].textContent = P.LINES[i][k] || '';
      lastCap = null;
      let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity, widest = 0;
      for (const el of ln) {
        if (!el.textContent) continue;
        const rg = document.createRange(); rg.selectNodeContents(el);
        const r = rg.getBoundingClientRect();
        left = Math.min(left, r.left); right = Math.max(right, r.right); top = Math.min(top, r.top); bottom = Math.max(bottom, r.bottom);
        widest = Math.max(widest, r.width);
      }
      return { font: c.font, capPx: +(c.cap * d).toFixed(1), widestPx: +(widest * d).toFixed(1),
        ...box({ left, right, top, bottom }, d) };
    },
    measureBubble() {
      const c = capOf(pill);
      return { pill: box(pill.getBoundingClientRect(), P.DSF), cluster: box(sb.getBoundingClientRect(), P.DSF), font: c.font, capPx: +(c.cap * P.DSF).toFixed(1) };
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
      if (o.g.split > 0.01) stage.setAttribute('data-gl', '1'); else stage.removeAttribute('data-gl');

      const key = o.cap.i + ':' + o.cap.chars + ':' + o.cap.caret;
      if (key !== lastCap) {
        lastCap = key;
        const old = cap.querySelector('.caret'); if (old) old.remove();
        if (o.cap.i < 0) { ln[0].textContent = ''; ln[1].textContent = ''; }
        else {
          const copy = P.LINES[o.cap.i].join('\n').slice(0, o.cap.chars).split('\n');
          ln[0].textContent = copy[0] || '';
          ln[1].textContent = copy[1] || '';
          if (o.cap.caret) { const c = document.createElement('span'); c.className = 'caret'; ln[copy.length > 1 ? 1 : 0].appendChild(c); }
        }
      }
      s.setProperty('--cap-s', o.cap.sc.toFixed(4));

      for (let k = 0; k < 2; k++) {
        dots[k].style.opacity = o.bub.dots[k].o.toFixed(4);
        dots[k].style.transform = 'scale(' + o.bub.dots[k].sc.toFixed(4) + ')';
      }
      pill.style.opacity = o.bub.pill.o.toFixed(4);
      pill.style.transform = 'translateY(' + o.bub.pill.y.toFixed(3) + 'px) scale(' + o.bub.pill.sc.toFixed(4) + ')';
      sb.style.visibility = o.bub.o < 0.004 ? 'hidden' : 'visible';

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
  Math.random = function () { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; seed |= 0; return (seed >>> 0) / 4294967296; };
  const rafQ = [];
  let rafId = 1;
  window.requestAnimationFrame = function (cb) { rafQ.push({ id: rafId, cb: cb }); return rafId++; };
  window.cancelAnimationFrame = function (id) { const k = rafQ.findIndex(function (e) { return e.id === id; }); if (k > -1) rafQ.splice(k, 1); };
  window.__dmRaf = function (now) { const batch = rafQ.splice(0, rafQ.length); for (const e of batch) { try { e.cb(now); } catch (err) { } } return rafQ.length; };
}

/* ---------- render ---------- */
async function render(plan, bubPlace) {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  for (const d of [FRAMES, SUBS]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  fs.mkdirSync(OUT, { recursive: true });
  const N = Math.round(FPS * SECONDS);
  const { srv, port } = await serve(sceneHtml(plan, bubPlace));
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none', '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });
  await page.evaluateOnNewDocument(injected);
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
  for (let i = 0; i < 240; i++) {
    const ok = await page.evaluate(() => !!(window.__built && window.__mas && window.__mas.ready && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  if (!await page.evaluate(() => !!window.__built)) throw new Error('the scene never became ready');
  for (const [f, what] of [['400 40px "Michroma"', 'the wordmark'], ['600 ' + CAP.size + 'px "Nunito"', 'the caption'], [BUBBLE.weight + ' ' + BUBBLE.size + 'px "Space Grotesk"', 'the bubble']]) {
    if (!await page.evaluate(q => document.fonts.check(q), f)) throw new Error(f + ' did not load, and ' + what + ' would be judged in the fallback');
  }
  const put = async (t, f) => {
    const mf = compose(plan, t);
    await page.evaluate(fr => window.__mas.apply(fr), mf);
    await page.evaluate(fr => window.__p29.apply(fr), frameAt(t, f));
    return mf;
  };
  const built = await page.evaluate(() => window.__built);
  const wm = await page.evaluate(() => window.__p29.measureWm());
  console.log('  built: head ' + built.mas.headPx + 'px, ' + built.mas.eyes + ' eyes, ' + built.mas.glows + ' glow layers, theme ' + built.mas.theme
    + (built.mas.hands ? ', ' + built.mas.hands.gloves + ' glove layers' : ''));
  console.log('  the wordmark: ' + wm.widestPx + ' device px wide, caps ' + wm.capPx + ', clear ' + wm.left + ' / ' + wm.top + ' / ' + wm.right + ' / ' + wm.bottom);

  /* the three captions whole, and the bubble up, read off the frame */
  const capBox = [];
  for (let i = 0; i < 3; i++) {
    capBox.push(await page.evaluate(k => window.__p29.measureCap(k), i));
    console.log('  caption ' + (i + 1) + ': ' + capBox[i].font + ', caps ' + capBox[i].capPx + ' device px, widest line ' + capBox[i].widestPx
      + ', clear ' + capBox[i].left + ' left / ' + capBox[i].top + ' top / ' + capBox[i].right + ' right / ' + capBox[i].bottom + ' bottom');
  }
  const bubF = Math.round((BUB.pill + BUB.pillFor + 0.10) * FPS);
  await put(bubF / FPS, bubF);
  const bubBox = await page.evaluate(() => window.__p29.measureBubble());
  console.log('  the bubble: ' + bubBox.font + ', caps ' + bubBox.capPx + ' device px, pill ' + bubBox.pill.w + 'x' + bubBox.pill.h
    + ', clear ' + bubBox.cluster.left + ' left / ' + bubBox.cluster.top + ' top / ' + bubBox.cluster.right + ' right');

  /* the head's worst clearance over the whole film, composed, at the render rate */
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
      const mf = await put(t, f);
      const o = frameAt(t, f);
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);
      /* the liveness signature sums its subframes, post28's corrected guard */
      let s = o.mo * 7 + o.sx * 29 + o.sy * 31 + o.cap.i * 11 + o.cap.chars * 19 + o.cap.caret * 37 + o.cap.sc * 41
        + o.bub.o * 47 + o.bub.pill.sc * 53 + o.bub.dots[0].sc * 57 + o.bub.dots[1].sc * 59
        + o.wm.o * 61 + o.wm.sc * 67 + o.wm.glow * 71 + o.g.split * 73 + o.g.noise * 79 + o.g.flash * 83 + o.g.bands.length * 89;
      s += o.mo * (mf.card.x * 107 + mf.card.y * 109 + mf.card.rot * 113 + mf.card.sx * 127 + mf.card.sy * 131);
      for (let e = 0; e < 2; e++) s += o.mo * (mf.eyes[e].x * (137 + e) + mf.eyes[e].y * (139 + e) + mf.eyes[e].lid * (149 + e) + mf.eyes[e].sy * (151 + e));
      if (mf.hands) for (const h of mf.hands.list) s += o.mo * h.o * (h.x * 157 + h.y * 163 + h.rot * 167);
      if (k === 0) sigs.push(0);
      sigs[f] = +(sigs[f] + s * (k + 1)).toFixed(6);
      const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 94, captureBeyondViewport: false, clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
      const file = SUB > 1 ? path.join(SUBS, 's' + String(idx).padStart(6, '0') + '.jpg') : path.join(FRAMES, 'f' + String(f).padStart(5, '0') + '.jpg');
      fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
      await advance(SUBSTEP);
    }
    if (f % 60 === 0) console.log('  ' + String(f).padStart(4) + '/' + N + '  t=' + (f / FPS).toFixed(2) + 's  ' + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
  }

  fs.rmSync(VERIFY, { recursive: true, force: true });
  fs.mkdirSync(VERIFY, { recursive: true });
  const stills = [
    [0.02, 'a-the-first-frame'],
    [(BEAT[0] + typedEnd(0)) / 2, 'b-caption-one-typing'],
    [BEAT[1] - 0.05, 'c-caption-one-whole'],
    [(BEAT[1] + typedEnd(1)) / 2, 'd-caption-two-typing'],
    [BEAT[2] + 0.45, 'e-the-wave-arriving'],
    [WAVE.at + 0.44 + WAVE.hold * 0.5, 'f-the-wave'],
    [BEAT[3] - 0.05, 'g-caption-three-whole'],
    [JUMP.at + JUMP.anti * 0.9, 'h-the-crouch'],
    [FLY.at + JUMP.for * 0.55, 'i-in-the-air'],
    [LAND + SMASH.flat * 0.8, 'j-the-landing'],
    [BUB.pill + BUB.pillFor * 0.5, 'k-the-pill-popping'],
    [BUB.pill + BUB.pillFor + 0.30, 'l-the-address'],
    [END.at - 0.20, 'm-the-second-stutter'],
    [END.at + END.hard + END.tail + 0.16, 'n-the-wordmark'],
    [SECONDS - 0.06, 'o-the-last-frame'],
  ];
  for (const [want, name] of stills) {
    const f = Math.min(N - 1, Math.round(want * FPS));
    await put(f / FPS, f);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
    fs.writeFileSync(path.join(VERIFY, name + '.png'), Buffer.from(shot.data, 'base64'));
  }
  console.log('  the head, worst frame at ' + worst.t + 's: ' + worst.left + ' left, ' + worst.top + ' top, ' + worst.right + ' right, ' + worst.bottom
    + ' bottom (floor ' + Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom) + ')');
  await browser.close();
  srv.close();
  if (SUB > 1) blend(N);
  const state = { built, wm, capBox, bubBox, head: worst, sigs, frames: N };
  fs.writeFileSync(path.join(OUT, 'post29.json'), JSON.stringify(state, null, 2));
  return state;
}

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }
function blend(N) {
  console.log('  blending ' + N * SUB + ' subframes into ' + N + ' frames ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS * SUB), '-i', path.join(SUBS, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1) + ',setpts=PTS-STARTPTS,framestep=' + SUB, '-q:v', '2', path.join(FRAMES, 'f%05d.jpg')]);
}
function encode(wav) {
  const out = path.join(OUT, 'post29-dark-1080x1920.mp4');
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

/* ========================================================================== */
/* go                                                                         */
/* ========================================================================== */

/* ---------- the read, and the clock hung off it ----------
   each take's sound starts PRE into its beat. lines one to three type their
   caption; line four starts on the jump and its `the` is where the pill pops.
   the fault waits for the last sound plus AFTER_READ, post20's rule. */
const TAKES = [];
for (let i = 0; i < 4; i++) TAKES.push(await take(i));
const PCM = TAKES.map(t => decode(ffmpeg, t.file));
const EDGE = PCM.map(audioEdges);
const OFF = TAKES.map((t, i) => +(BEAT[i] + PRE - EDGE[i].start).toFixed(4));
/* `word` is what the screen types and `said` is the take's own token, and the
   two may differ by a trailing stop and nothing else: the read keeps its
   sentence and the caption drops the last dot. */
const WORDS = TAKES.map((t, i) => t.words.map(w => ({ word: w.word, said: w.word, start: +(w.start + OFF[i]).toFixed(4), end: +(w.end + OFF[i]).toFixed(4) })));
const SOUND = TAKES.map((t, i) => ({ start: +(EDGE[i].start + OFF[i]).toFixed(4), end: +(EDGE[i].end + OFF[i]).toFixed(4) }));
for (let i = 0; i < 3; i++) {
  const want = LINES[i].lines.join(' ').split(' ');
  if (WORDS[i].length !== want.length) throw new Error('line ' + (i + 1) + ' came back with ' + WORDS[i].length + ' words and the caption has ' + want.length);
  for (let k = 0; k < want.length; k++) {
    const said = WORDS[i][k].said, last = k === want.length - 1;
    if (said !== want[k] && !(last && said === want[k] + '.')) throw new Error('line ' + (i + 1) + ' word ' + k + ' is "' + said + '" on the read and "' + want[k] + '" on the screen');
    WORDS[i][k].word = want[k];
  }
  TYPED[i] = typedOf(i, WORDS[i]);
  checkCopy(WORDS[i]);
}
const THE = WORDS[3].find((w, k) => w.word === 'the' && WORDS[3][k + 1] && WORDS[3][k + 1].word === 'boring');
if (!THE) throw new Error('line four has no "the boring" in it to pop the pill on');
BUB.at = +Math.max(THE.start, LAND + BUB.floorAfter).toFixed(4);
BUB.pill = +(BUB.at + 2 * BUB.step).toFixed(4);
const READ_END = +Math.max(WORDS[3][WORDS[3].length - 1].end, SOUND[3].end).toFixed(3);
END.at = +(READ_END + AFTER_READ).toFixed(3);
END.wmIn = END.at;
END.pre = [{ t: +(END.at - 0.38).toFixed(3), for: 0.05, force: 0.34 }, { t: +(END.at - 0.18).toFixed(3), for: 0.05, force: 0.60 }];
SECONDS = +(END.at + CARD).toFixed(2);
GL_WINDOWS = glitchWindows(FPS);
GL_WINDOWS_60 = FPS === 60 ? GL_WINDOWS : glitchWindows(60);

/* ---------- the plan ----------
   three marks. the seed is walked so the module's own blinks stay off the
   landing frame, the pill's pop and the fault: a bubble under a blink is a
   blank face, post19's finding. */
const DELIGHT_AT = +(REBOUND + 0.02).toFixed(3);
const MARKS = [
  { t: 0, state: 'neutral' },
  { t: WAVE.at, state: 'neutral', hands: { pose: 'wave', hold: WAVE.hold } },
  { t: DELIGHT_AT, state: 'delighted' },
];
const makePlan = seed => planMascot({ seconds: SECONDS, size: SIZE, theme: 'dark', bias: 0, hands: true, seed, marks: MARKS });
const CLEAR = [[LAND - 0.20, LAND + 0.30], [BUB.at - 0.20, BUB.pill + BUB.pillFor + 0.10], [END.at - 0.30, END.at]];
const SEED = (() => {
  for (let s = 1; s <= 400; s++) {
    const b = makePlan(s).idle.blinks;
    if (!b.some(x => CLEAR.some(([a, z]) => x.t >= a && x.t < z))) return s;
  }
  throw new Error('no seed under 400 keeps the module\'s blinks clear of the landing, the pill and the fault');
})();
const plan = makePlan(SEED);
const halfBox = (GRID / 2) * plan.unit;
plan.box.left = +(VW / 2 - halfBox).toFixed(2);
plan.box.top = +(CENTRE_Y - halfBox).toFixed(2);
const WV = plan.marks[1].hands;
GATE = { from: WAVE.at, leaving: WV.leaving, acting: WV.acting };

/* the bubble's anchor: the highest the crown reaches while it is up, walked
   on the composed frames, and the module's gap above that. */
const bubPlace = (() => {
  let top = Infinity;
  for (let f = Math.floor(BUB.at * 60); f <= Math.ceil(END.at * 60); f++) top = Math.min(top, headRect(plan, compose(plan, f / 60)).top / DSF);
  return { crownTop: +top.toFixed(2), bottom: +(VH - top + BUBBLE.gap).toFixed(2) };
})();

const rep = mascotMotion(plan, FPS, SECONDS);
const rep60 = FPS === 60 ? rep : mascotMotion(plan, 60, SECONDS);
console.log(describeMascot(plan));
console.log(describeMotion(rep));

/* ---------- the voice, on the clip's own clock ---------- */
const VTRACK = new Float32Array(Math.ceil(SECONDS * SR));
for (let k = 0; k < 4; k++) {
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
const READ_WORDS = WORDS.flat();

/* ---------- the cues, and there are three kinds ----------
   a thud on the landing, post20's heavier popDeep; the module's own pop on
   the pill; the fault. no key, no music. the module offers no cue of its own
   on this plan and that is asserted. */
const MODULE_CUES = mascotCues(plan);
const cues = [
  { t: LAND, kind: 'popDeep', opts: { f0: 78, f1: 42, tau: 0.13, len: 0.32 }, from: 'the mascot hitting his mark' },
  { t: BUB.pill, kind: 'pop', from: 'the pill' },
  { t: END.at, kind: 'glitch', from: 'the cut' },
];
const { buf: sfx, report: sfxReport } = renderSfx(cues, SECONDS, {});
const PRE_DB = [-32, -27];
for (let i = 0; i < END.pre.length; i++) {
  const w = GL_WINDOWS[i];
  const one = renderSfx([{ t: w.t0, kind: 'glitch', opts: { len: 0.05 + i * 0.014, burst: 0.004, crush: 3800 - i * 600, f0: 210 + i * 20, f1: 120, seed: w.seed },
    from: 'stutter ' + (i + 1) + ' of two, into the hit' }], SECONDS, { gains: { glitch: PRE_DB[i] } });
  for (let j = 0; j < sfx.length; j++) sfx[j] += one.buf[j];
  sfxReport.push(...one.report);
}
sfxReport.sort((a, b) => a.t - b.t);

/* ---------- the mix, post20's rig, and the loudness bisects ---------- */
const WAV = path.join(OUT, 'post29-mix.wav');
const RAW = path.join(OUT, 'post29-mix-raw.wav');
fs.mkdirSync(OUT, { recursive: true });
const env = voiceEnvelope(READ_WORDS, SECONDS);
const mix = mixdown(VTRACK, sfx, env, { duck: DUCK });
const under = checkUnderVoice(mix.voiceOut, mix.bus);
function pass(lift) {
  const buf = mix.out.slice();
  applyGain(buf, lift);
  const peak = limit(buf, SAMPLE_CEILING);
  writeWav(RAW, buf);
  return { lift: +lift.toFixed(2), buf, peak, lufs: loudness(ffmpeg, RAW).lufs };
}
const zero = pass(0);
const want = zero.lufs == null ? 0 : +(TARGET_LUFS - zero.lufs).toFixed(2);
let best = zero, tries = 1;
if (want > 0.05) {
  let lo = 0, hi = want;
  const top = pass(want); tries++;
  if (top.peak.reduction <= MAX_REDUCTION) best = top;
  else while (hi - lo > 0.20 && tries < 10) { const mid = (lo + hi) / 2, p = pass(mid); tries++; if (p.peak.reduction <= MAX_REDUCTION) { lo = mid; best = p; } else hi = mid; }
} else if (want < -0.05) { best = pass(want); tries++; }
writeWav(WAV, best.buf);
const after = loudness(ffmpeg, WAV);
const peak = best.peak;
fs.rmSync(RAW, { force: true });

/* ---------- the fast things, at sixty ---------- */
const fastest = (fn, a, b) => {
  let d = 0, at = a;
  for (let f = Math.floor(a * 60); f < Math.ceil(b * 60); f++) { const s = Math.abs(fn((f + 1) / 60) - fn(f / 60)); if (s > d) { d = s; at = f / 60; } }
  return { d: +d.toFixed(2), at: +at.toFixed(3) };
};
const R_FULL = HEAD.plate.s / 2 * plan.unit;
const jumpStep = (() => {
  let d = 0, at = FLY.at;
  for (let f = Math.floor(FLY.at * 60); f < Math.ceil(LAND * 60); f++) {
    const a = placeAt(f / 60), b = placeAt((f + 1) / 60), s = Math.hypot(b.dx - a.dx, b.dy - a.dy);
    if (s > d) { d = s; at = f / 60; }
  }
  return { d: +d.toFixed(2), at: +at.toFixed(3) };
})();
const edgeStep = fastest(t => { const c = compose(plan, t).card; return c.y + R_FULL * c.sy; }, JUMP.at, REBOUND);
const FASTEST = Math.max(jumpStep.d, edgeStep.d);
if (BLUR) { SUB = BLUR_ARG ? Math.max(2, Math.min(SUB_MAX, Math.round(BLUR_ARG))) : Math.max(2, Math.min(SUB_MAX, Math.ceil(FASTEST / SUB_STEP_WANT))); SUBSTEP = STEP / SUB; }

/* ---------- the beats, printed ---------- */
console.log('\n  the read, edge, ' + TAKES[0].voiceId);
for (const t of TAKES) {
  const w = WORDS[t.i];
  console.log('    line ' + (t.i + 1) + '  "' + t.text + '"  ' + t.rate + ' ' + t.pitch + (t.cached ? '  cached' : '  fetched')
    + '\n             sound ' + SOUND[t.i].start.toFixed(2) + ' to ' + SOUND[t.i].end.toFixed(2) + 's in a beat of ' + BEAT[t.i].toFixed(2) + ' to '
    + (t.i < 3 ? BEAT[t.i + 1].toFixed(2) : END.at.toFixed(2)) + ', ' + (w.length / (w[w.length - 1].end - w[0].start)).toFixed(2) + ' words a second');
}
console.log('\n  the beats');
const beats = [
  [0, 'he is small in the bottom left, idle, the module\'s own glow. caption one types, silently'],
  [BEAT[1], 'caption two replaces it on the frame'],
  [BEAT[2], 'caption three replaces it. the wave: entrance to ' + WV.settled.toFixed(2) + ', holds to ' + WV.leaving.toFixed(2) + ', home by ' + WV.out.toFixed(2)],
  [BEAT[3], 'the caption clears on the frame. the crouch, ' + JUMP.anti.toFixed(2) + 's'],
  [FLY.at, 'he leaves the corner, ' + JUMP.for.toFixed(2) + 's in the air, growing from ' + SMALL.s + ' to 1'],
  [LAND, 'he lands: ' + (1 + SMASH.k).toFixed(2) + ' wide by ' + (1 / (1 + SMASH.k)).toFixed(2) + ' tall, back out of it by ' + REBOUND.toFixed(2) + ', with a thud'],
  [BUB.at, 'the first dot, on "the" of the address' + (BUB.at > THE.start + 1e-6 ? ' (floored ' + (BUB.at - THE.start).toFixed(2) + 's after the word)' : '')],
  [BUB.pill, 'the pill, "' + ADDRESS + '", with a pop. it holds to the fault'],
  [DELIGHT_AT, 'delighted, once the rebound is done'],
  ...END.pre.map((w, i) => [w.t, 'stutter ' + (i + 1) + ' of two']),
  [END.at, 'the fault, ' + AFTER_READ + 's after the read\'s last sound. he and the bubble are cut and the wordmark is born on that frame'
    + ' (the brief says ' + BRIEF_END.toFixed(2) + ', this is ' + (END.at - BRIEF_END >= 0 ? '+' : '') + (END.at - BRIEF_END).toFixed(2) + ')'],
  [SECONDS, 'end, after ' + (SECONDS - END.wmIn - END.wmFor).toFixed(2) + 's of the end card'],
].sort((a, b) => a[0] - b[0]);
for (const [t, what] of beats) console.log('    ' + t.toFixed(2).padStart(5) + 's  ' + what);
console.log('\n  the fast things, at sixty');
console.log('    the head\'s centre moves at most ' + jumpStep.d + ' css px a frame in the air, at ' + jumpStep.at + 's');
console.log('    his bottom edge moves at most ' + edgeStep.d + ' css px a frame through the crouch, the flight and the landing, at ' + edgeStep.at + 's');
console.log('  the shutter: ' + (BLUR ? SUB + ' subframes' + (BLUR_ARG ? ' because --blur=' + BLUR_ARG + ' said so' : ', solved') + ', ' + (FASTEST / SUB).toFixed(2) + ' css px between samples' : 'closed'));
console.log('\n  the sound');
console.log(describeMix(sfxReport, {
  'the voice': 'four edge takes on the clip\'s clock, the bus ducked to ' + (1 - DUCK).toFixed(2) + ' under a word',
  'the lift': 'off the mix at ' + (zero.lufs == null ? '?' : zero.lufs) + ' LUFS, took ' + best.lift.toFixed(2) + ' dB in ' + tries + ' pass' + (tries === 1 ? '' : 'es'),
  'the bus': (after.lufs == null ? '?' : after.lufs) + ' LUFS, peak ' + peak.peak + ' dBFS, limiter took ' + (peak.reduction > 0.01 ? peak.reduction.toFixed(2) + ' dB' : 'nothing')
    + ', ' + (under.over.length ? 'OVER THE VOICE on ' + under.over.length + ' window(s)' : 'under the voice on every window, worst ' + under.worst.db + ' dB at ' + under.worst.at + 's'),
}));

if (VOICE_ONLY) process.exit(0);

const state = ONLY_ENCODE ? JSON.parse(fs.readFileSync(path.join(OUT, 'post29.json'), 'utf8')) : await render(plan, bubPlace);
const file = encode(WAV);
const p = probe(file);
const lu = loudness(ffmpeg, file);
console.log('\nrendered');
console.log('  ' + p.w + 'x' + p.h + ' @' + p.fps + 'fps  ' + p.seconds.toFixed(2) + 's  ' + (p.audio ? 'with sound' : 'SILENT') + '  '
  + (fs.statSync(file).size / 1e6).toFixed(2) + ' MB  ' + path.relative(ROOT, file));
console.log('  the shutter is ' + (BLUR ? 'open, ' + SUB + ' subframes to a frame' : 'closed'));
if (lu && lu.ok) console.log('  loudness ' + lu.lufs + ' LUFS integrated, true peak ' + lu.truePeak + ' dBFS, measured on the mp4');
console.log('  a still per beat in ' + path.relative(ROOT, VERIFY));
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

/* ---------- the read is edge, in sync, and inside its beats ---------- */
{
  for (const t of TAKES) {
    if (t.provider !== 'edge' || !/Andrew/.test(t.voiceId)) fail.push('take ' + (t.i + 1) + ' is ' + t.provider + ' ' + t.voiceId + ', not edge\'s andrew');
    const to = t.i < 3 ? BEAT[t.i + 1] : END.at;
    if (SOUND[t.i].start < BEAT[t.i] - 1e-6) fail.push('line ' + (t.i + 1) + ' starts sounding at ' + SOUND[t.i].start + 's, before its beat');
    if (SOUND[t.i].end > to + 1e-6) fail.push('line ' + (t.i + 1) + ' is still sounding at ' + SOUND[t.i].end + 's, past ' + to);
    if (t.i < 3 && SOUND[t.i + 1] && SOUND[t.i].end > SOUND[t.i + 1].start) fail.push('lines ' + (t.i + 1) + ' and ' + (t.i + 2) + ' overlap');
  }
  for (const [i, L] of LINES.entries()) {
    if (/[—–]/.test(L.text) || /\s-\s/.test(L.text) || /!/.test(L.text) || /[A-Z]/.test(L.text)) fail.push('line ' + (i + 1) + ' breaks the copy rules: "' + L.text + '"');
    /* the read keeps its sentence and the screen drops the last dot */
    if (!/\.$/.test(L.text)) fail.push('line ' + (i + 1) + '\'s read has lost its full stop: "' + L.text + '"');
    if (L.lines.length && /\.$/.test(L.lines[L.lines.length - 1])) fail.push('caption ' + (i + 1) + ' ends in a full stop: "' + L.lines.join(' / ') + '"');
  }
  if (ADDRESS !== 'theboringtek.com') fail.push('the pill reads "' + ADDRESS + '"');
  if (Math.abs(END.at - BRIEF_END) > 0.35) fail.push('the fault is at ' + END.at + 's, more than 0.35 off the brief\'s ' + BRIEF_END);
  if (!(SECONDS >= 10.5 && SECONDS <= 12.0)) fail.push('the film is ' + SECONDS + 's, and the brief says about eleven');
  /* every caption is whole before its beat ends, typed while its line is
     said, and the exchanges are on the frame */
  for (let i = 0; i < 3; i++) {
    if (typedEnd(i) > BEAT[i + 1] - 0.10) fail.push('caption ' + (i + 1) + ' is still typing at ' + typedEnd(i) + 's');
    if (charsAt(i, BEAT[i + 1] - 1 / FPS) !== TYPED[i].length) fail.push('caption ' + (i + 1) + ' is not whole on its last frame');
    if (TYPED[i][0].t < BEAT[i] - 1e-6) fail.push('caption ' + (i + 1) + ' starts typing before its beat');
    if (Math.abs(TYPED[i][0].t - SOUND[i].start) > 0.20) fail.push('caption ' + (i + 1) + ' starts typing ' + (TYPED[i][0].t - SOUND[i].start).toFixed(2) + 's off its line');
    const f = beatFrame(i);
    if (i > 0 && (frameAt((f - 1) / FPS, f - 1).cap.i !== i - 1 || frameAt(f / FPS, f).cap.i !== i)) fail.push('caption ' + (i + 1) + ' does not replace caption ' + i + ' on its own frame');
  }
  const f3 = beatFrame(3), fc = Math.round(END.at * FPS);
  if (frameAt((f3 - 1) / FPS, f3 - 1).cap.i !== 2 || frameAt(f3 / FPS, f3).cap.i !== -1) fail.push('the caption does not clear on the jump\'s frame');
  if (frameAt((fc - 1) / FPS, fc - 1).mo !== 1 || frameAt(fc / FPS, fc).mo !== 0 || frameAt(fc / FPS, fc).wm.o !== 1 || frameAt(fc / FPS, fc).bub.o !== 0) fail.push('the fault does not cut everything on one frame');
  if (!(BUB.at >= LAND + SMASH.flat && BUB.pill + BUB.pillFor < END.at - 0.5)) fail.push('the pill pops at ' + BUB.pill + 's, which is not between the landing and well before the fault');
  if (BUB.at - THE.start > 0.30) fail.push('the first dot is ' + (BUB.at - THE.start).toFixed(2) + 's after "the", too far off the word to be on it');
  for (let f = Math.ceil((BUB.pill + BUB.pillFor) * FPS); f < fc; f++) { const b = frameAt(f / FPS, f).bub; if (b.pill.o < 1 || Math.abs(b.pill.sc - 1) > 1e-6) { fail.push('the pill is not held whole at ' + (f / FPS).toFixed(3) + 's'); break; } }
}

/* ---------- the states are calm or happy, the pose is the wave, and the left glove never draws ---------- */
{
  for (const m of plan.marks) if (!['neutral', 'delighted'].includes(m.state)) fail.push('mark ' + m.i + ' is ' + m.state + ', and only calm or happy eyes are allowed');
  const poses = plan.marks.filter(m => m.hands).map(m => m.hands.pose);
  if (poses.join() !== 'wave') fail.push('the poses are ' + poses.join(', ') + ', and this clip has one wave');
  if (WV.out > BEAT[3] - 0.10) fail.push('the wave is home at ' + WV.out + 's, not before the jump');
  if (!WV.acting.includes(1) || WV.acting.includes(0)) fail.push('the waving hand is ' + WV.acting.join() + ', and it should be the screen right one');
  let stray = 0, before = 0;
  for (let f = 0; f < Math.round(END.at * 60); f++) {
    const t = f / 60, h = compose(plan, t).hands;
    if (!h) continue;
    if (h.list[0].o > 0.004) stray++;
    if (h.list[1].o > 0.004 && (t < WAVE.at || t > WV.out + GLOVE_OUT + 0.02)) before++;
  }
  if (stray) fail.push('the screen left glove is drawn on ' + stray + ' frames');
  if (before) fail.push('the waving glove is on screen outside the wave on ' + before + ' frames');
  if (MODULE_CUES.length) fail.push('the module offers ' + MODULE_CUES.length + ' cue(s) this clip did not expect');
  /* the small size and the house size, off the composed card */
  const small = compose(plan, 1.0).card, home = compose(plan, END.at - 0.02).card;
  if (Math.abs(small.sx / mascotFrame(plan, 1.0).card.sx - SMALL.s) > 1e-3) fail.push('he is not at ' + SMALL.s + ' of the house size in the corner');
  if (Math.abs(home.sx / mascotFrame(plan, END.at - 0.02).card.sx - 1) > 1e-3) fail.push('he is not at the house size after the landing');
  /* one hill: the flight goes up before it comes down, and the crouch and the landing are the only squashes */
  let apex = Infinity; for (let f = Math.floor(FLY.at * 60); f <= Math.ceil(LAND * 60); f++) apex = Math.min(apex, placeAt(f / 60).dy);
  if (!(apex < -40)) fail.push('the jump never rises above his landing spot');
  if (squashAt(LAND + SMASH.flat / 2) < SMASH.k * 0.5) fail.push('the landing does not squash');
}

/* ---------- the captions, the bubble and the wordmark clear the safe area and each other ---------- */
{
  for (let i = 0; i < 3; i++) {
    const b = state.capBox[i];
    if (!/Nunito/.test(b.font) || !/600/.test(b.font)) fail.push('caption ' + (i + 1) + ' is not nunito semibold: ' + b.font);
    if (b.left < SAFE.left || b.right < SAFE.right) fail.push('caption ' + (i + 1) + ' is inside the side margins: ' + b.left + ' / ' + b.right);
    if (b.top < SAFE.top || b.bottom < SAFE.bottom) fail.push('caption ' + (i + 1) + ' is inside the top or bottom band');
    const mid = (b.top + (VH * DSF - b.bottom)) / 2 / DSF;
    if (Math.abs(mid - CENTRE_Y) > 12) fail.push('caption ' + (i + 1) + '\'s middle is at ' + mid.toFixed(0) + ' css px, not the safe band\'s ' + CENTRE_Y.toFixed(0));
    /* and it is above him while he is in the corner */
    const capBottom = VH * DSF - b.bottom;
    let headTop = Infinity;
    for (let f = 0; f < Math.round(BEAT[3] * 60); f++) headTop = Math.min(headTop, headRect(plan, compose(plan, f / 60)).top);
    if (headTop < capBottom + 8) fail.push('caption ' + (i + 1) + '\'s foot is on his head');
  }
  const B = state.bubBox;
  if (!/Space Grotesk/.test(B.font)) fail.push('the pill is not in space grotesk: ' + B.font);
  if (B.capPx < BUBBLE.minCap) fail.push('the pill\'s caps are ' + B.capPx + ' device px, under ' + BUBBLE.minCap);
  if (B.cluster.left < SAFE.left || B.cluster.right < SAFE.right || B.cluster.top < SAFE.top) fail.push('the bubble is inside the safe area: ' + B.cluster.left + ' / ' + B.cluster.top + ' / ' + B.cluster.right);
  const crownDev = bubPlace.crownTop * DSF;
  if (VH * DSF - B.cluster.bottom > crownDev - BUBBLE.gap * DSF + 1) fail.push('the first dot sits on his crown');
  if (state.head.near < Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom)) fail.push('the head comes within ' + state.head.near + ' device px of a border at ' + state.head.t + 's');
  const w = state.wm;
  if (w.left < SAFE.left || w.right < SAFE.right || w.top < SAFE.top || w.bottom < SAFE.bottom) fail.push('the wordmark is inside the safe area');
  if (w.capPx < WM.minCapPx) fail.push('the wordmark caps are ' + w.capPx + ' device px, under ' + WM.minCapPx);
  if (!/Michroma/.test(w.font)) fail.push('the wordmark is not in Michroma: ' + w.font);
}

/* ---------- no colour but the house's ---------- */
{
  const mine = sceneHtml(plan, bubPlace).split('==== this clip\'s own css starts here ====')[1];
  const dark = brandTokens().dark;
  for (const tokn of ['accent', 'red']) {
    const m = new RegExp('--' + tokn + ':\\s*#([0-9a-f]{6})', 'i').exec(dark);
    if (m && mine.toLowerCase().includes('#' + m[1].toLowerCase())) fail.push('the site\'s --' + tokn + ' is painted somewhere in this clip');
  }
  if (/--iris/.test(mine)) fail.push('the iris is overridden, and his eyes stay the module\'s');
}

/* ---------- the module's own report ---------- */
for (const st of rep60.states) if (st.entryFrames == null) fail.push(st.state + ' never reached its own mark');
if (rep60.outside.units > 0) fail.push('feature ink lands ' + rep60.outside.units.toFixed(2) + ' units outside the head silhouette');
if (rep60.frozenFrames) fail.push(rep60.frozenFrames + ' frames where the face is not moving at all');

/* ---------- the sound ---------- */
{
  for (const r of sfxReport) {
    if (r.cut) fail.push('the ' + r.kind + ' cue at ' + r.t + 's was cut off by the end of the clip');
    if (!['popDeep', 'pop', 'glitch'].includes(r.kind)) fail.push('the bus carries a ' + r.kind + ', and this clip has a thud, a pop and the fault');
  }
  if (sfxReport.filter(r => r.kind === 'glitch').length !== 3) fail.push('the fault is not two stutters and a hit');
  if (under.over.length) fail.push('the bus is over the voice on ' + under.over.length + ' window(s), the first at ' + under.over[0].t + 's');
  if (lu && lu.ok) {
    if (lu.truePeak > PEAK_CEILING) fail.push('the true peak is ' + lu.truePeak + ' dBFS, over the ' + PEAK_CEILING + ' ceiling');
    if (lu.lufs > TARGET_LUFS + 0.5) fail.push('the file measures ' + lu.lufs + ' LUFS, over the ' + TARGET_LUFS + ' target');
  } else fail.push('ebur128 said nothing about the finished file');
  if (peak.reduction > MAX_REDUCTION + 1e-6) fail.push('the limiter took ' + peak.reduction.toFixed(2) + ' dB, over the ' + MAX_REDUCTION + ' dB this clip allows');
}

/* ---------- the fast things, the ending, and nothing is a still ---------- */
if (jumpStep.d > STEP_CEIL) fail.push('the head moves ' + jumpStep.d + ' css px on one frame at 60 in the air');
if (edgeStep.d > STEP_CEIL) fail.push('his bottom edge moves ' + edgeStep.d + ' css px on one frame at 60');
if (BLUR && !BLUR_ARG && FASTEST / SUB > SUB_STEP_WANT + 1e-6) fail.push('the solved shutter leaves ' + (FASTEST / SUB).toFixed(2) + ' css px between samples');
{
  const N60 = Math.round(SECONDS * 60), endFrom = Math.round(END.at * 60);
  let endOn = 0;
  for (let f = endFrom; f < N60; f++) if (glitchAt(f, 60, GL_WINDOWS_60).heat > 0) endOn++;
  if (endOn / (N60 - endFrom) > 0.30) fail.push('the ending glitches on ' + (endOn / (N60 - endFrom) * 100).toFixed(1) + '% of its own frames');
}
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
console.log('    the fault is at ' + END.at + 's against the brief\'s ' + BRIEF_END + ': it waits for the read, and the address takes ' + (SOUND[3].end - SOUND[3].start).toFixed(2) + 's to say');
console.log('    the bubble is this file\'s, laid straight up over the crown in the module\'s own numbers, because the module\'s own placement runs an address off the frame');
console.log('    the glow is the module\'s own two layers, not pushed');

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
