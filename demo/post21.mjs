/* the boring tek — post21.

   dark only, 1080x1920. he hums in a lit room, gets plugged into the mains, is
   electrocuted, comes out of it with laser eyes and burns the room down, and
   then it turns out somebody asked him about the weather.

     0.0  he is tired. four notes climb off his crown and pop.
     2.0  a cable slides in from the left and plugs into his face. click.
     3.0  the shock: the camera shakes, his head jitters, his eyes strobe red,
          sparks come off the plug and a run of thin key ticks crackles under it.
     5.0  the eyes lock red and two beams sweep the room left to right. every
          lamp they cross goes out, and a scan line runs down the frame behind.
     7.0  the red drains, he is tired again, one slow blink, and the caption
          swaps to the line the whole thing was for.
     9.0  the fault, and the wordmark.

     node post21.mjs                     1080x1920, 60fps, shutter closed
     DEMO_FPS=12 node post21.mjs         the fast preview pass
     node post21.mjs --blur=6            60fps with the shutter open
     node post21.mjs --keep-frames       leave the jpegs on disk
     node post21.mjs --encode-only       re-encode from kept frames

   one output, one path, overwritten every run:

     demo/out/post21-dark-1080x1920.mp4

   ---------- what is the module's and what is this file's ----------

   the mascot is `lib/mascot.mjs` and nothing here reaches inside it. three
   marks off its own table — `unimpressed` for tired, `surprised` for the shock,
   `unimpressed` again for the come down — and everything that is red is
   composed on top:

     the iris colour is one css variable this file writes per frame, behind a
     selector of its own (`#m-zone .m-iris`) rather than a change to the
     module's. the module paints the iris with --eye and this overrides the
     fill; --eye itself is left alone, because the brows, the pill's ground and
     a glove's edge are all drawn in it and none of them is meant to go red.

     the eye glow, the beams, the sparks, the cable, the notes, the lamps and
     the scan line are this file's layers, positioned off `mascotFrame`'s own
     numbers. `eyeSpots` works an eye's centre out of the card exactly the way
     `headRect` works a glove corner out of it, so a beam leaves the eye that is
     actually drawn rather than the one the plan describes.

     the head jitter goes on `frame.card` after the module has written it, which
     is post19's and post20's move: a transform laid over the element would
     leave `headRect` answering about a head that is somewhere else.

   ---------- the eyes are not white, and that is the theme ----------

   the brief says the eyes flicker between white and red and fade back to white.
   on the dark theme they are not white and cannot be: the module inverts, so
   the head is #f4f7f5 and the iris is --eye, which is defined to equal the page
   background. white eyes on a white head are no eyes. so "white" is read here
   as "back to their own colour", the iris mixes from the module's own token to
   red and back, and red slabs on a white plate is where the read is loudest
   anyway. it is the one place this cut does not do what the brief says in the
   words the brief says it in.

   ---------- one invented colour, and it is the lamps ----------

   the eyes, the beams, the glow and the scan line are all **index.html's own
   `--red`** on the dark theme, written out as components so they can be used at
   an alpha. there is a guard that the number in this file is still the number in
   the site. the lamps are warm and there is no warm token, so that one is
   invented — a lamp is a light source in a room rather than an accent, which is
   the same argument post18 and post19 made for the blue on somebody else's
   panel. the brand's green appears nowhere in this clip.

   ---------- the captions ----------

   `lib/captions.mjs`'s float style in one fixed band near the top, set in
   Manrope ExtraBold and refitted in the page against the face that actually
   renders, which is post19's `capRefit` unchanged. there is no voice in this
   film, so the word timings are typed rather than cut from a read — they are a
   reading pace and nothing downstream is derived from them.

   ---------- the sound ----------

   the brief names three: a pop on each note, a click on the plug, and the shock
   as key ticks fired fast and thin. that is what is in here, plus the fault's
   own glitch and its two stutters. **the laser and the come down are silent**,
   which is three and a half seconds of nothing but the picture, and it is
   deliberate rather than missed — see the outstanding note the run prints. no
   voice and no music, which is the brief.

   ---------- the shutter ----------

   post10's rule. with `--blur` every output frame is captured `SUB` times
   inside its own sixtieth and averaged. anything written against `t` smears;
   the jitter, the strobe, the sparks, the glitch and the wordmark's birth are
   written against the output frame and are held across every capture of it. the
   fastest thing in the file is the cable and it is printed on every run. */

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
  STAGE, SAFE, HEAD, HEAD_PX, EYE_CX, GRID,
} from './lib/mascot.mjs';
import {
  planCaptions, captionFrame, captionCss, captionMarkup, captionPage, describe,
  brandTokens,
} from './lib/captions.mjs';
import {
  renderSfx, writeWav, applyGain, limit, loudness, describeMix,
} from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post21');
const SUBS = path.join(OUT, 'subframes-post21');
const VERIFY = path.join(OUT, 'verify-post21');

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
   post12's line and post20's: the middle of the **safe band**, not of the
   frame. the platforms take 180 device px off the top and 220 off the bottom,
   so the middle of what a viewer sees is ten css px above the middle of the
   file. the wordmark lands on the same line, so he is replaced rather than
   followed. */
const CENTRE_Y = (SAFE_CSS.top + (VH - SAFE_CSS.bottom)) / 2;
const SIZE = 148;

/* ---------- the red ----------
   index.html's own dark `--red`, as components so it can be used at an alpha.
   the guard at the bottom reads the token back out of the site and compares, so
   the day somebody changes it there this file fails rather than quietly drifting
   off the palette. */
const RED = [255, 92, 92];
/* and the one invented colour: a warm lamp. there is no warm token in the site
   and there is not going to be one, because this is a light source in a room
   rather than a thing the brand paints with. */
const LAMP_RGB = [255, 196, 126];

/* ---------- the clock ----------
   there is no read in this film, so unlike post20 nothing here is derived: the
   brief hands over six beats on whole and half seconds and these are them. the
   only numbers that are not the brief's are the lengths of the moves inside a
   beat, and each is noted where it lives. */
const CABLE = { at: 2.00, for: 0.55, travel: 480 };
const PLUG = +(CABLE.at + CABLE.for).toFixed(3);
const SHOCK = { at: 3.00, to: 5.00, settle: 0.30 };
const LOCK = 5.00;
const SWEEP = { at: 5.20, to: 6.50, in: 0.20, out: 0.35 };
const SCAN = { at: 5.00, to: 6.90 };
const CALM = 7.00;
const RED_OUT = 0.55;          /* how long the red takes to drain at the calm */
const CARD = 0.95;             /* how long the end card holds after the fault */

/* the four notes off the crown. they are 0.42s apart, which is a hum rather
   than a tune, and each lives 0.70s so the last one is gone as the cable
   arrives. the rise is 118 css px, which stops a note well under the caption
   band it is about to share the frame with. */
const NOTE = { at: [0.10, 0.52, 0.94, 1.36], life: 0.70, rise: 92, drift: 26, w: 30, h: 38 };

/* the shock, and both channels are the same fact at two scales: the camera
   moves the whole frame and the head moves inside it, so the two never cancel.
   they are held for two frames at a time on the sixty grid, which is what makes
   a jitter read as a jitter rather than as noise. */
const JIT = { cam: 5.0, head: 4.2, hold: 2 };
/* the strobe. the eyes are red for two or three frames at a time and dark for
   two or three, and the run schedule is built backwards from the lock so the
   last run before 5.00 is a red one and the eyes are already red when they lock. */
const STROBE = { min: 2, max: 3 };
/* the sparks. six slots round the plug, each alive two or three frames on a
   period of its own, so they never fire as a chorus. */
const SPARK = { n: 8, period: 4, life: [2, 3], r0: 7, r1: 20, len0: 13, len1: 38 };
/* the crackle. a run of key ticks that thins as it goes, because a shock that
   keeps its rate is a machine and one that lets go is an accident. */
const CRACKLE = { from: 3.00, to: 4.58, gap: [0.036, 0.052], thin: 1.9 };

/* the snap zoom on the plug. it is on the stage rather than on him, because the
   brief asks for a camera move and a head that grew would be him flinching. */
const ZOOM = { by: 0.035, in: 0.05, out: 0.14 };

/* ---------- the room ----------
   four lamps, sorted left to right, at four heights, all of them below the
   caption band and clear of the head. they are light rather than ink, so they
   are not measured against the safe borders: a lamp cropped by a platform's
   chrome is still a lamp, and there is nothing on one to read. */
const LAMPS = [
  { x: 84, y: 356, r: 150 },
  { x: 160, y: 742, r: 168 },
  { x: 384, y: 402, r: 140 },
  { x: 452, y: 660, r: 176 },
];
/* the sweep aims at a point that travels from off the left edge to off the
   right one, and its height is a straight line between the lamps: so the beams
   cross every one of them, in order, and the aim wanders up and down on the way
   the way a scanner does. the four deaths fall out of that rather than being
   placed, which is why there is no table of them. */
const AIM = { from: -60, to: 600 };
const DEATH = LAMPS.map(l =>
  +(SWEEP.at + (SWEEP.to - SWEEP.at) * (l.x - AIM.from) / (AIM.to - AIM.from)).toFixed(4));
const LAMP_OUT = { flare: 0.05, fade: 0.16, peak: 1.75 };

/* ---------- the cable ----------
   drawn as one stroked path with a chunky plug on the end, twice over: a wider
   stroke in the site's own outline token under a narrower one in a ground a
   shade above the page. that pair is post17's dark redraw and it is the only
   way a black cable reads on a black frame — a genuinely black cable on #06070a
   is not a cable, it is nothing.

   the prongs end inside the plate's left edge and the whole thing is drawn
   **behind** him, so what a frame shows is a plug against his cheek with its
   pins gone into it. the tail runs 260px past the left edge, so there is never
   a loose end on screen. */
const CAB = {
  d: 'M -260 604 C -54 640 102 470 156 470',
  w: 13, edge: 16,
  plug: { x: 154, y: 452, w: 48, h: 36, r: 7 },
  prong: { x: 202, w: 16, h: 5, dy: 8 },
  tip: 218,
};

/* ---------- the captions ----------
   one band, near the top, bottom anchored, and it does not move for either
   line. the face is Manrope ExtraBold rather than the module's Space Grotesk
   700 and the fit is redone in the page — post19's `capRefit`, unchanged.

   `hold` is 3.60 because the first card has to stay up until the second one
   arrives, and the module clamps a group's exit against the next group's
   entrance anyway: so it is a ceiling rather than a duration, and the swap
   lands where the second card's own lead puts it. */
const CAP_BOX = { x: 80, y: 120, w: 380, h: 120 };
const CAP = {
  style: 'float', perCard: 6, floatSize: 42, lead: 0.10, hold: 3.60, bodyGap: 0.30,
  family: 'Manrope', weight: 800, tracking: -0.015,
};
/* the copy, and the word times are a reading pace rather than a read. the full
   stop on `thinking` is there so `cardBreak` cuts between the two lines, and
   `punctuation: 'drop'` takes it off again before a card is drawn. */
const WORDS = [
  { word: 'ai', start: 2.65, end: 2.82 },
  { word: 'is', start: 2.86, end: 2.99 },
  { word: 'thinking.', start: 3.03, end: 3.42 },
  { word: 'you', start: 7.00, end: 7.16 },
  { word: 'asked', start: 7.20, end: 7.50 },
  { word: 'how', start: 7.54, end: 7.68 },
  { word: 'the', start: 7.72, end: 7.83 },
  { word: 'weather', start: 7.87, end: 8.24 },
  { word: 'is', start: 8.28, end: 8.42 },
];

/* ---------- the end ----------
   post20's machinery at post20's numbers: two stutters, a hard hit, and he and
   both captions are cut on the hit frame while the wordmark is born on it, so
   the frame exchanges one thing for another and is never empty. */
const END = { at: 9.00, pre: [], hard: 0.12, tail: 0.18, wmIn: 9.00, wmFor: 0.09, clean: 0.06 };
END.pre = [
  { t: +(END.at - 0.38).toFixed(3), for: 0.05, force: 0.34 },
  { t: +(END.at - 0.18).toFixed(3), for: 0.05, force: 0.60 },
];
const SECONDS = +(END.at + CARD).toFixed(2);
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16, minCapPx: 56 };
const GL = {
  shakeX: 15, shakeY: 8, split: 9.5, bandDx: 88, bands: 3,
  noise: [0.10, 0.24], flash: 0.30, flashSize: 420, calmFrom: 0.86,
};

/* crf 17, every dark clip's: this frame is nearly all flat black with soft
   glows across it, which is exactly what a codec bands. */
const CRF = 17;

/* ---------- the mix ----------
   post16's rig rather than post20's, because there is no voice: thirty odd
   transients on silence, so the peak ceiling is the likely winner and both
   numbers are printed either way. nothing to duck under and no envelope. */
const TARGET_LUFS = -14;
const SAMPLE_CEILING = -1.8;
const PEAK_CEILING = -1.0;
const LIMIT_ALLOW = 1.5;
/* the key goes up from the table's -34, which was set for a run of ticks under
   a read. there is no read here and the crackle is the whole of the shock. */
const KEY_DB = -27;

/* how fast anything in this file may move, in css px between two frames at
   sixty. post19's number and it is the shutter's rather than the animation's:
   past it `tmix` blends separated copies rather than a smear. */
const STEP_CEIL = 42;

/* ---------- the small maths ---------- */
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const fx = t => ((ax * t + bx) * t + cx) * t;
  const dx = t => (3 * ax * t + 2 * bx) * t + cx;
  return x => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const e = fx(t) - x;
      if (Math.abs(e) < 1e-5) break;
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return ((ay * t + by) * t + cy) * t;
  };
}
const EASE = bezier(.16, 1, .3, 1);            /* the site's own --ease */
const MOVE = bezier(.4, 0, .2, 1);             /* and the one the cable rides */
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))));
const lerp = (a, b, p) => a + (b - a) * p;
const n4 = v => +v.toFixed(4);

function prng(seed) {
  let x = seed | 0 || 0x1a2b3c;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x |= 0; return (x >>> 0) / 4294967296; };
}

/* post11's rule: a window is a length in seconds snapped to the grid that is
   actually rendering, or a fifty millisecond stutter is six hundredths of a
   frame at twelve and simply does not happen on the pass it is judged on. */
function onGrid(t, len, fps) {
  const f0 = Math.round(t * fps);
  const n = Math.max(1, Math.round(len * fps));
  return { t0: f0 / fps, t1: (f0 + n) / fps, frames: n };
}

/* ---------- everything that is held on a frame rather than eased ------------
   the jitter, the strobe and the sparks are all written against the **sixty
   frame grid** and sampled at the output frame's own instant, so they are held
   across every capture of a frame under the shutter and they still change on
   every frame of a twelve fps preview: two consecutive twelfths are five sixty
   frames apart, which is a different draw every time. */
const g60 = t => Math.round(t * 60);

/* the strobe, precomputed once as a run length schedule so it can be walked and
   checked rather than sampled and hoped for. it is built backwards from the
   lock, so the last run before 5.00 is red and the eyes are already on when
   they lock rather than snapping on a frame later. */
const STROBE_RUNS = (() => {
  const a = g60(SHOCK.at);
  const r = prng(0x51e4b1);
  const runs = [];
  let n = g60(LOCK), red = true;
  while (n > a - STROBE.max) {
    const len = STROBE.min + (r() < 0.5 ? 0 : STROBE.max - STROBE.min);
    runs.unshift({ from: n - len, to: n, red });
    n -= len; red = !red;
  }
  return runs;
})();
function strobeAt(n) {
  for (const r of STROBE_RUNS) if (n >= r.from && n < r.to) return r.red ? 1 : 0;
  return 0;
}

/* how red the iris is, nought to one: dark before the shock, strobing through
   it, locked through the sweep, and drained over the calm. */
function redAt(t) {
  if (t < SHOCK.at) return 0;
  if (t < LOCK) return strobeAt(g60(t));
  if (t < CALM) return 1;
  return n4(1 - EASE(span(t, CALM, CALM + RED_OUT)));
}

/* the two jitters. one envelope, two amplitudes, and the envelope lets go over
   the last third of a second so the shock settles into the lock rather than
   being switched off at it. */
function shockAt(t) {
  if (t < SHOCK.at || t >= SHOCK.to) return 0;
  return n4(span(t, SHOCK.at, SHOCK.at + 0.05)
    * (1 - EASE(span(t, SHOCK.to - SHOCK.settle, SHOCK.to))));
}
function jitterAt(t) {
  const e = shockAt(t);
  if (!e) return { cx: 0, cy: 0, hx: 0, hy: 0 };
  const r = prng(0x7a1c03 ^ (Math.floor(g60(t) / JIT.hold) * 2654435761));
  return {
    cx: n4((r() * 2 - 1) * JIT.cam * e), cy: n4((r() * 2 - 1) * JIT.cam * 0.6 * e),
    hx: n4((r() * 2 - 1) * JIT.head * e), hy: n4((r() * 2 - 1) * JIT.head * e),
  };
}

/* the sparks. six slots, each on a period of its own so they never fire
   together, each alive two or three frames, all of them inside the shock. */
function sparksAt(t) {
  /* **the sparks do not ride the jitter's envelope**, and that is a rendered
     frame's correction. the jitter ramps over 0.05s so the shake starts rather
     than snaps, and a spark multiplied by that envelope is nought on the first
     frame of the shock — which is the one frame the guard found with nothing on
     it. contact is not a ramp: the first frame is the loudest one. so they are
     full from the mark and only the settle takes them down, and never all the
     way, because the shake letting go is not the current going off. */
  const e = t < SHOCK.at || t >= SHOCK.to ? 0
    : Math.max(0.35, 1 - EASE(span(t, SHOCK.to - SHOCK.settle, SHOCK.to)));
  const out = [];
  for (let k = 0; k < SPARK.n; k++) {
    if (!e) { out.push(null); continue; }
    /* the offset is `k` rather than a multiple of it, and that is the whole
       fix for a frame with no spark on it: with `k * 2` the three slots on the
       four frame period land on phases 0, 2 and 0, so two of them are the same
       slot twice and the fourth phase is covered by nobody. */
    const period = SPARK.period + (k % 3);
    const m = g60(t) - k;
    const c = Math.floor(m / period), i = m - c * period;
    const r = prng(0x5aa117 ^ (c * 2654435761) ^ (k * 40503));
    const len = SPARK.life[0] + (r() < 0.5 ? 0 : SPARK.life[1] - SPARK.life[0]);
    if (i < 0 || i >= len) { out.push(null); continue; }
    const a = r() * Math.PI * 2;
    const r0 = SPARK.r0 + r() * (SPARK.r1 - SPARK.r0);
    const L = (SPARK.len0 + r() * (SPARK.len1 - SPARK.len0)) * (0.5 + 0.5 * e);
    out.push({
      x1: n4(CAB.tip + Math.cos(a) * r0), y1: n4(CENTRE_Y + Math.sin(a) * r0),
      x2: n4(CAB.tip + Math.cos(a) * (r0 + L)), y2: n4(CENTRE_Y + Math.sin(a) * (r0 + L)),
      o: n4((1 - i / len * 0.45) * e),
    });
  }
  return out;
}

/* ---------- the sweep ----------
   the aim point travels off one edge to off the other and its height is a
   straight line between the lamps, so the beams cross every one in order. */
function aimAt(t) {
  const p = span(t, SWEEP.at, SWEEP.to);
  const x = lerp(AIM.from, AIM.to, p);
  const last = LAMPS[LAMPS.length - 1];
  if (x <= LAMPS[0].x) return { x, y: LAMPS[0].y };
  if (x >= last.x) return { x, y: last.y };
  for (let i = 1; i < LAMPS.length; i++) {
    if (x <= LAMPS[i].x) {
      const a = LAMPS[i - 1], b = LAMPS[i];
      return { x, y: lerp(a.y, b.y, (x - a.x) / (b.x - a.x)) };
    }
  }
  return { x, y: last.y };
}
function beamO(t) {
  return n4(span(t, LOCK, LOCK + SWEEP.in) * (1 - span(t, SWEEP.to, SWEEP.to + SWEEP.out)));
}
/* a lamp is on until the aim passes it, flares as it is crossed, and is gone.
   the slow breathe under it is what stops a lit room being a still image, and
   the four periods are incommensurate so the set never pulses as one. */
function lampO(i, t) {
  const b = 0.90 + 0.10 * Math.sin(2 * Math.PI * t / (3.1 + i * 0.7) + i * 1.9);
  const d = DEATH[i];
  if (t < d) return n4(b);
  const a = span(t, d, d + LAMP_OUT.flare);
  const o = span(t, d + LAMP_OUT.flare, d + LAMP_OUT.flare + LAMP_OUT.fade);
  return n4(lerp(b, LAMP_OUT.peak, a) * (1 - o));
}

/* ---------- the notes ----------
   one at a time off the crown, up and gone. the drift alternates side, so four
   notes are a hum rather than a column. what comes back is an offset from the
   crown rather than a place on the frame: the crown is where the head actually
   is on that frame, and `unimpressed` sinks and leans over the whole hum, so a
   note placed by arithmetic would leave from a head that has moved out from
   under it. */
function noteAt(i, t) {
  const at = NOTE.at[i];
  const p = span(t, at, at + NOTE.life);
  if (p <= 0 || p >= 1) return { o: 0, dy: 0, dx: 0, s: 1 };
  const s = i % 2 ? -1 : 1;
  return {
    o: n4(Math.min(1, p / 0.14) * (1 - span(t, at + NOTE.life * 0.55, at + NOTE.life))),
    dy: n4(-NOTE.rise * EASE(p)),
    dx: n4(s * NOTE.drift * Math.sin(Math.PI * p * 0.9)),
    s: n4(lerp(0.72, 1.02, EASE(Math.min(1, p / 0.30)))),
  };
}

/* the cable's own x, which is the fastest thing in the file and is measured
   against the shutter's ceiling on every run. */
const cableX = t => n4(-CABLE.travel * (1 - MOVE(span(t, CABLE.at, PLUG))));
const zoomAt = t => n4(1 + ZOOM.by * span(t, PLUG, PLUG + ZOOM.in)
  * (1 - EASE(span(t, PLUG + ZOOM.in, PLUG + ZOOM.in + ZOOM.out))));
const scanAt = t => ({
  y: n4(lerp(-40, VH + 40, span(t, SCAN.at, SCAN.to))),
  o: n4(span(t, SCAN.at, SCAN.at + 0.15) * (1 - span(t, SCAN.to - 0.30, SCAN.to))),
});

/* ---------- the mascot for one instant, with the jitter composed onto him ----
   the module writes the head and this adds the shock to it. `ft` is the output
   frame's own instant and `t` is the instant being captured: they differ under
   the shutter, and the jitter takes the first so it is held across a frame,
   while everything eased takes the second and smears. */
function compose(plan, t, ft = t) {
  const f = mascotFrame(plan, t);
  const j = jitterAt(ft);
  if (!j.hx && !j.hy) return f;
  f.card = { ...f.card, x: n4(f.card.x + j.hx), y: n4(f.card.y + j.hy) };
  return f;
}

/* ---------- a point on the head, in css px on the frame ----------
   `headRect`'s own chain for a point in card space: its offset from the card's
   centre, through the card's two scales and its rotation, then out to the page.
   three things hang off it and all three have to leave the head that is drawn
   rather than the one the plan describes — the beams, the red glow and the
   crown the notes come off. */
function cardPoint(plan, fr, gx, gy) {
  const u = plan.unit, c = fr.card;
  const th = c.rot * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
  const ax = c.sx * (gx - GRID / 2), ay = c.sy * (gy - GRID / 2);
  return {
    x: n4(plan.box.left + (GRID / 2) * u + c.x + (cs * ax - sn * ay) * u),
    y: n4(plan.box.top + (GRID / 2) * u + c.y + (sn * ax + cs * ay) * u),
  };
}
const eyeSpots = (plan, fr) =>
  [0, 1].map(k => cardPoint(plan, fr, EYE_CX[k] + fr.eyes[k].x, HEAD.eye.cy + fr.eyes[k].y));
/* the top of the plate, on the middle of it, which is what a hum comes off. */
const crownAt = (plan, fr) => cardPoint(plan, fr, GRID / 2, HEAD.plate.y);

/* ---------- the glitch ----------
   post12's, through post20's: a function of the output frame index and of
   nothing else, so a one frame rgb split is not on for one subframe of four and
   landing at a quarter strength. */
function heatAt(p) {
  if (p < 0) return 0;
  if (p < 0.13) return 1;
  if (p < 0.58) return 1 - (p - 0.13) / 0.45 * 0.58;
  if (p < GL.calmFrom) return 0.42 * (1 - (p - 0.58) / (GL.calmFrom - 0.58));
  return 0;
}
function glitchWindows(fps) {
  return [
    ...END.pre.map((w, i) => ({ ...onGrid(w.t, w.for, fps), force: w.force, seed: 0x51a0 + i * 977, pre: i })),
    { ...onGrid(END.at, END.hard + END.tail, fps), force: 1, seed: 0x0c1a55, pre: null },
  ];
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
  let heat = w.pre != null ? w.force : heatAt(p);
  if (w.pre == null && heat > 0 && p > 0.13 && p < GL.calmFrom && r() < 0.34) heat = 1;
  if (heat <= 0) return g;
  g.heat = heat;
  g.sx = +((r() * 2 - 1) * GL.shakeX * heat).toFixed(2);
  g.sy = +((r() * 2 - 1) * GL.shakeY * heat).toFixed(2);
  g.split = +(heat * (2.2 + r() * (GL.split - 2.2))).toFixed(2);
  g.noise = +(heat * lerp(GL.noise[0], GL.noise[1], r())).toFixed(4);
  g.flash = f === Math.round(END.at * FPS) ? GL.flash : 0;
  /* the bands belong to the hit and only to the hit: a tear redraws the
     wordmark shifted, and before the hit there is no wordmark to redraw. */
  const n = w.pre != null ? 0 : Math.min(GL.bands, Math.floor(heat * (GL.bands + 0.5)));
  for (let i = 0; i < n; i++) {
    const h = 18 + r() * 96;
    g.bands.push({
      top: +(r() * (VH - h)).toFixed(1), h: +h.toFixed(1),
      dx: +((r() * 2 - 1) * GL.bandDx * heat).toFixed(1),
    });
  }
  return g;
}

/* two sines on incommensurate periods rather than one: a sine stands still
   twice a period, so on an end card where this is the only thing moving the two
   frames either side of its turning point are identical. */
function phosphor(t, amp, slow, fast, phase) {
  return 1 + amp * 0.78 * Math.sin(2 * Math.PI * t / slow)
    + amp * 0.39 * Math.sin(2 * Math.PI * t / fast + phase);
}

/* ---------- what one frame is ----------
   everything this file writes, in one object. `t` is the instant being captured
   and `f` is the output frame it belongs to. */
function frameAt(plan, mf, t, f) {
  const g = glitchAt(f);
  const ft = f / FPS;
  const cut = f >= Math.round(END.at * FPS);
  const j = jitterAt(ft);
  const eyes = eyeSpots(plan, mf);
  const crown = crownAt(plan, mf);
  const red = redAt(t);
  const aim = aimAt(t);
  const wp = span(t, END.wmIn, END.wmIn + END.wmFor);
  /* the beams leave each eye and go out past the frame, so what is drawn is a
     ray rather than a segment stopping at whatever it happens to be aimed at. */
  const beams = eyes.map(e => {
    const dx = aim.x - e.x, dy = aim.y - e.y;
    const m = Math.hypot(dx, dy) || 1;
    return { x1: e.x, y1: e.y, x2: n4(e.x + dx / m * 1300), y2: n4(e.y + dy / m * 1300) };
  });
  return {
    t: +t.toFixed(4), f,
    mo: cut ? 0 : 1,
    red,
    /* the iris, mixed from the module's own token to the site's own red. it is
       written as a resolved colour rather than as a colour-mix so the number in
       the report and the number on the frame are the same one. */
    iris: 'rgb(' + Math.round(lerp(6, RED[0], red)) + ',' + Math.round(lerp(7, RED[1], red))
      + ',' + Math.round(lerp(10, RED[2], red)) + ')',
    eyes,
    eyeGlow: cut ? 0 : n4(red * (t >= LOCK && t < CALM ? 0.95 : 0.55)),
    beams, bo: cut ? 0 : beamO(t),
    lamps: LAMPS.map((_, i) => (cut ? 0 : lampO(i, t))),
    /* the notes are placed off the crown here rather than in the page: what the
       page gets is a spot on the frame, which is the same split every other
       layer in this file is on. */
    notes: NOTE.at.map((_, i) => {
      const nn = cut ? { o: 0, dx: 0, dy: 0, s: 1 } : noteAt(i, t);
      return { o: nn.o, s: nn.s, x: n4(crown.x + nn.dx), y: n4(crown.y + nn.dy) };
    }),
    cable: { x: cableX(t), o: cut || t < CABLE.at ? 0 : 1 },
    sparks: cut ? new Array(SPARK.n).fill(null) : sparksAt(ft),
    scan: cut ? { y: 0, o: 0 } : scanAt(t),
    zoom: zoomAt(t),
    sx: +(g.sx + j.cx).toFixed(2), sy: +(g.sy + j.cy).toFixed(2),
    cap: cut ? 0 : 1,
    wm: {
      /* a cut rather than a ramp, and on the output frame rather than on the
         instant, which is the same switch `mo` and the captions are on: post20's
         60fps finding, that every channel in an exchange goes on the frame. */
      o: cut ? 1 : 0,
      sc: +(1 + (1 - EASE(wp)) * 0.085).toFixed(4),
      glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4),
    },
    g,
  };
}

/* ---------- the page ---------- */
function sceneHtml(plan, cap) {
  const rgb = a => a.join(',');
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post21</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Manrope:wght@800&family=Space+Grotesk:wght@400;500&display=swap">
<style>
${captionCss(cap, CAP_BOX)}
:root{
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  --body:"Space Grotesk",var(--mono);
  --display:"Michroma",var(--mono);
  /* the two channels the rgb split is drawn in: the same white the glow is,
     pulled apart, rather than a red and a cyan out of a filter preset. */
  --split-r:rgba(255,120,120,.55); --split-c:rgba(120,220,255,.55);
  /* the laser, which is index.html's own dark --red written as components so it
     can be used at an alpha. there is a guard that these are still that. */
  --laser:${rgb(RED)};
  /* and the lamps, which are the one colour in this clip the site does not own. */
  --lamp:${rgb(LAMP_RGB)};
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}

/* the vignette, and it is load bearing rather than decoration: with nothing at
   all animating chrome stops producing compositor frames and the screenshot
   call blocks on a frame that never comes. it is the one thing here allowed to
   be a css animation, because it is the one thing that does not hit a mark. */
.vignette{position:fixed;inset:-10%;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 78% 62% at 50% 46%,
    rgba(255,255,255,.028) 0%, rgba(255,255,255,.010) 46%, rgba(0,0,0,0) 72%);
  will-change:transform,opacity;
  animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{
  from{transform:scale(1) translate3d(0,0,0);opacity:.85}
  to{transform:scale(1.05) translate3d(0,-1.1%,0);opacity:1}
}

/* the camera. the shake and the plug's snap zoom are one transform, in that
   order, about the frame's own centre. */
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;background:var(--bg);
  transform:translate3d(calc(var(--sx,0) * 1px),calc(var(--sy,0) * 1px),0) scale(var(--zoom,1));
  transform-origin:center center;will-change:transform}

${mascotCss(plan)}
#m-zone{opacity:var(--m-o,1)}
/* ---- the iris, and it is the whole of the red ----
   this beats the module's own class selector rather than changing the token:
   --eye also draws the brows, the pill's ground and a glove's edge, and none of
   those is meant to go red. */
#m-zone .m-iris{fill:var(--iris,var(--eye))}
.stage[data-gl="1"] #m-zone{
  filter:drop-shadow(calc(var(--split,0) * -1px) 0 var(--split-r))
         drop-shadow(calc(var(--split,0) * 1px) 0 var(--split-c))}

/* ---- the room ----
   four soft lamps and one scan line, both behind him. a lamp is a radial
   gradient and nothing else: no css filter, because a blur on four layers under
   a moving head is four rasters a frame for a shape that is already soft. */
.lamp{position:absolute;border-radius:50%;pointer-events:none;z-index:1;
  opacity:var(--o,0);will-change:opacity;
  background:radial-gradient(circle,
    rgba(var(--lamp),.26) 0%, rgba(var(--lamp),.13) 34%,
    rgba(var(--lamp),.04) 62%, rgba(var(--lamp),0) 78%)}
.scan{position:absolute;left:0;right:0;height:26px;z-index:2;pointer-events:none;
  opacity:var(--o,0);transform:translate3d(0,calc(var(--y,0) * 1px),0);
  will-change:transform,opacity;
  background:linear-gradient(to bottom,
    rgba(var(--laser),0) 0%, rgba(var(--laser),.05) 42%,
    rgba(var(--laser),.16) 50%, rgba(var(--laser),.05) 58%, rgba(var(--laser),0) 100%)}

/* ---- the cable ----
   behind him, so the prongs go into his cheek rather than lying on it. the two
   strokes are the dark redraw: an outline in the site's own bubble token under
   a ground a shade above the page. */
.cable{position:absolute;inset:0;z-index:3;pointer-events:none;overflow:visible;
  transform:translate3d(calc(var(--cx,0) * 1px),0,0);opacity:var(--co,0);
  will-change:transform}
.cab-edge{fill:none;stroke:var(--bub);stroke-width:${CAB.edge};stroke-linecap:round;stroke-linejoin:round}
.cab-ink{fill:none;stroke:#12161a;stroke-width:${CAB.w};stroke-linecap:round;stroke-linejoin:round}
.plug-edge{fill:var(--bub)}
.plug-ink{fill:#12161a}

/* ---- the notes ----
   a head, a stem and a flag, drawn in the page's own ink so they belong to him.
   they are a hum made visible rather than a pictogram of music. the margin puts
   the note's own bottom centre on the spot node hands it, which is the crown. */
.note{position:absolute;left:0;top:0;z-index:3;pointer-events:none;overflow:visible;
  width:${NOTE.w}px;height:${NOTE.h}px;margin:${-NOTE.h}px 0 0 ${-NOTE.w / 2}px;
  opacity:var(--o,0);
  transform:translate3d(calc(var(--x,0) * 1px),calc(var(--y,0) * 1px),0) scale(var(--s,1));
  transform-origin:center bottom;will-change:transform,opacity}
.note path,.note ellipse{fill:var(--fg)}

/* ---- the eyes, on fire ----
   a soft red disc laid over each eye, on top of the head rather than under it,
   because it is a bloom coming off the ink. no css filter anywhere near the
   mascot's own layers — the module's own note about a filter over a promoted
   layer is the reason. */
.eyeglow{position:absolute;left:0;top:0;width:104px;height:104px;margin:-52px 0 0 -52px;
  border-radius:50%;pointer-events:none;z-index:5;opacity:var(--o,0);
  transform:translate3d(calc(var(--x,0) * 1px),calc(var(--y,0) * 1px),0);
  will-change:transform,opacity;
  background:radial-gradient(circle,
    rgba(var(--laser),.62) 0%, rgba(var(--laser),.26) 30%,
    rgba(var(--laser),.07) 56%, rgba(var(--laser),0) 74%)}

/* ---- the beams and the sparks ----
   one overlay in front of him. a beam is three stacked strokes rather than one
   under a blur: a wide faint one, a middle one and a hot core, which is the
   same picture a gaussian would give for no filter and no re-raster. */
.fx{position:absolute;left:0;top:0;z-index:5;pointer-events:none;overflow:visible}
.beam{opacity:var(--bo,0)}
.beam line{stroke-linecap:round}
.b0{stroke:rgba(var(--laser),.13);stroke-width:30}
.b1{stroke:rgba(var(--laser),.34);stroke-width:11}
.b2{stroke:rgba(255,214,206,.92);stroke-width:3}
.spark{stroke:#fff6ee;stroke-width:2.6;stroke-linecap:round;opacity:0}

/* ---- the caption's own face ----
   the module sets the float style in the body face at 700; this file asks for
   something cleaner and heavier, so the rule is written after the module's and
   the fit is redone in the page against the face that actually renders.
   (no backticks in this block: it is inside a template literal, and one would
   end the string rather than mark a name.) */
.cap{z-index:6;opacity:var(--capo,1)}
.cap-float{font-family:"${CAP.family}",var(--mono); font-weight:${CAP.weight};
  letter-spacing:${CAP.tracking}em;
  text-shadow:0 0 8px rgba(255,255,255,.18),0 0 22px rgba(255,255,255,.07)}
.stage[data-gl="1"] .cap{
  filter:drop-shadow(calc(var(--split,0) * -1px) 0 var(--split-r))
         drop-shadow(calc(var(--split,0) * 1px) 0 var(--split-c))}

/* ---- the wordmark ---- */
.wm{position:absolute;left:50%;top:${CENTRE_Y}px;
  transform:translate(-50%,-50%) scale(var(--wm-s,1));
  font-family:var(--display);font-weight:400;color:var(--fg);
  text-align:center;text-transform:uppercase;letter-spacing:.18em;
  line-height:${WM.lh};white-space:nowrap;
  /* letter-spacing is added after every glyph including the last, so the box is
     one full space wider than the ink; half the tracking is what centres it. */
  text-indent:.09em;
  opacity:var(--wm-o,0);
  text-shadow:0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),
    0 0 66px rgba(255,255,255,.10);
  filter:brightness(var(--wm-glow,1));
  z-index:7}
.wm span{display:block}
.stage[data-gl="1"] .wm{
  text-shadow:0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),
    0 0 66px rgba(255,255,255,.10),
    calc(var(--split,0) * -1px) 0 var(--split-r),calc(var(--split,0) * 1px) 0 var(--split-c)}

/* ---- the tear ----
   a band of the frame, blacked out and redrawn shifted. only the wordmark is
   copied: the mascot is one dom subtree driven by ids out of its own module and
   there is no second copy of it that could be kept in sync. */
.tear{position:absolute;inset:0;z-index:8;overflow:hidden;background:var(--bg);
  clip-path:inset(var(--tt,0px) 0 calc(100% - var(--tt,0px) - var(--th,0px)) 0);
  opacity:var(--to,0)}
.tear-in{position:absolute;inset:0;transform:translate3d(calc(var(--tdx,0) * 1px),0,0)}
.noise{position:absolute;inset:-40px;z-index:9;pointer-events:none;
  mix-blend-mode:screen;opacity:var(--noise,0);
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.0' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23m)'/%3E%3C/svg%3E")}
.flash{position:absolute;left:50%;top:${CENTRE_Y}px;z-index:10;pointer-events:none;
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
${LAMPS.map((l, i) => '  <i class="lamp" data-lamp="' + i + '" style="left:' + (l.x - l.r)
    + 'px;top:' + (l.y - l.r) + 'px;width:' + (l.r * 2) + 'px;height:' + (l.r * 2) + 'px"></i>').join('\n')}
  <i class="scan" id="scan" aria-hidden="true"></i>
  <svg class="cable" id="cable" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}" aria-hidden="true">
    <path class="cab-edge" d="${CAB.d}"/>
${[0, 1].map(s => '    <rect class="plug-edge" x="' + (CAB.prong.x - 2) + '" y="'
    + (CENTRE_Y + (s ? CAB.prong.dy : -CAB.prong.dy) - CAB.prong.h / 2 - 1.5) + '" width="'
    + (CAB.prong.w + 2) + '" height="' + (CAB.prong.h + 3) + '" rx="2.5"/>').join('\n')}
    <rect class="plug-edge" x="${CAB.plug.x - 1.5}" y="${CAB.plug.y - 1.5}" width="${CAB.plug.w + 3}" height="${CAB.plug.h + 3}" rx="${CAB.plug.r + 1.5}"/>
    <path class="cab-ink" d="${CAB.d}"/>
${[0, 1].map(s => '    <rect class="plug-ink" x="' + CAB.prong.x + '" y="'
    + (CENTRE_Y + (s ? CAB.prong.dy : -CAB.prong.dy) - CAB.prong.h / 2) + '" width="'
    + CAB.prong.w + '" height="' + CAB.prong.h + '" rx="2"/>').join('\n')}
    <rect class="plug-ink" x="${CAB.plug.x}" y="${CAB.plug.y}" width="${CAB.plug.w}" height="${CAB.plug.h}" rx="${CAB.plug.r}"/>
  </svg>
${NOTE.at.map((_, i) => '  <svg class="note" data-note="' + i + '" viewBox="0 0 34 44" aria-hidden="true">'
    + '<ellipse cx="11" cy="35" rx="9.5" ry="7"/>'
    + '<path d="M18.6 34.4 V6.2 h3.4 V34.4 z"/>'
    + '<path d="M22 5.4 c6.6 1.9 9.6 5.2 9.4 10.6 c-1.9 -4.4 -5 -6.3 -9.4 -6.6 z"/>'
    + '</svg>').join('\n')}
${mascotMarkup(plan)}
  <i class="eyeglow" data-glow="0"></i><i class="eyeglow" data-glow="1"></i>
  <svg class="fx" id="fx" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}" aria-hidden="true">
${[0, 1].map(k => '    <g class="beam" data-beam="' + k + '">'
    + '<line class="b0"/><line class="b1"/><line class="b2"/></g>').join('\n')}
${Array.from({ length: SPARK.n }, (_, i) => '    <line class="spark" data-spark="' + i + '"/>').join('\n')}
  </svg>
${captionMarkup(cap)}
  <div class="wm" id="wm">${WM.lines.map(l => '<span>' + l + '</span>').join('')}</div>
${Array.from({ length: GL.bands }, (_, i) => '  <div class="tear" data-tear="' + i
    + '"><div class="tear-in"><div class="wm">'
    + WM.lines.map(l => '<span>' + l + '</span>').join('') + '</div></div></div>').join('\n')}
  <div class="noise" aria-hidden="true"></div>
  <div class="flash" aria-hidden="true"></div>
</div>
<script>
window.__CAP_PLAN = ${JSON.stringify(cap)};
window.__CAP_BOX = ${JSON.stringify(CAP_BOX)};
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
window.__P21 = ${JSON.stringify({ VW, VH, DSF, WM, CAP })};
(${captionPage.toString()})();
${mascotRuntime()}
(${scenePage.toString()})();
/* the layers measure and fit themselves once, after both faces are really here.
   offline everything renders in the mono fallback and looks almost right, which
   is the worst kind of wrong to fit type against. */
Promise.all([
  document.fonts.load('400 40px Michroma'),
  document.fonts.load('800 42px Manrope'),
])
  .then(function () { return document.fonts.ready; })
  .then(function () {
    var built = Object.assign({}, window.__p21.fit(), {
      cap: window.__cap.build(), mas: window.__mas.build(),
    });
    built.capRefit = window.__p21.capRefit();
    window.__built = built;
  });
</script>
</body>
</html>`;
}

/* ---------- the page's own script ----------
   it writes numbers to elements and it decides nothing, exactly like the
   mascot's and the caption's page halves. serialised in with .toString(), so it
   must not close over anything: everything it needs arrives on window.__P21. */
function scenePage() {
  const P = window.__P21;
  const stage = document.getElementById('stage');
  const cable = document.getElementById('cable');
  const scan = document.getElementById('scan');
  const fx = document.getElementById('fx');
  const wms = [...document.querySelectorAll('.wm')];
  const capEl = document.querySelector('.cap');
  const lamps = [...document.querySelectorAll('.lamp')];
  const notes = [...document.querySelectorAll('.note')];
  const glows = [...document.querySelectorAll('.eyeglow')];
  const beamGs = [...fx.querySelectorAll('.beam')];
  const beams = beamGs.map(g => [...g.querySelectorAll('line')]);
  const sparks = [...fx.querySelectorAll('.spark')];
  const tears = [...document.querySelectorAll('.tear')];
  const tearIns = tears.map(t => t.querySelector('.tear-in'));

  const capOf = el => {
    const cs = getComputedStyle(el);
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    const m = cv.measureText('H');
    return { cap: m.actualBoundingBoxAscent || 0, font: cv.font };
  };

  window.__p21 = {
    /* the wordmark, fitted its own way: michroma is proportional and the
       tracking is nearly a fifth of an em, so the width of the widest line is a
       measurement rather than a ratio. every copy is fitted, the torn ones
       included, or a tear would show a wordmark at a different size. */
    fit() {
      const probe = wms[0];
      probe.style.fontSize = '100px';
      let widest = 0;
      for (const sp of probe.querySelectorAll('span')) {
        widest = Math.max(widest, sp.getBoundingClientRect().width);
      }
      const ws = 100 * P.WM.w / widest;
      for (const el of wms) el.style.fontSize = ws.toFixed(2) + 'px';
      return { wm: +ws.toFixed(2) };
    },

    /* ---------- the caption, refitted, and it is allowed to wrap ------------
       post19's refit for post19's reason: lib fits the float style by measuring
       its cards in Space Grotesk at 700, and Manrope at 800 is a different width
       for the same string, so the size the module solved is the wrong one.

       **but it is not post19's arithmetic, because this clip has a six word
       card.** the module measures a card as one row and solves a size from the
       widest of them, which is right for the three and four word cards that
       style is written for. `you asked how the weather is` on one row inside a
       400px box comes out at 23 css px — a caption at half the cap height of
       every other clip in the folder, which is a footnote rather than a caption.
       `.cap-float` already carries `flex-wrap`, so the card can take two lines
       and the fit becomes the same one post20 wrote for its own blocks: the
       largest size whose **wrapped** block still fits the box's height, with no
       single word wider than the box, which is the only way a flex wrap fails.

       one size for every card, which is the module's own rule and the reason it
       is: cards that each fit their own width change size between beats and read
       as a zoom nobody asked for. lib is untouched — this is a rule and a
       measurement in the clip. */
    capRefit() {
      const cards = [...document.querySelectorAll('.cap-float')];
      if (!cards.length) return null;
      const plan = window.__CAP_PLAN, box = window.__CAP_BOX;
      /* a word springs about its own centre and overshoots past 1, so the
         widest one has to fit at the largest scale it ever reaches. it is the
         module's own number rather than one typed here. */
      const maxScale = plan.maxScale || 1;
      let size = P.CAP.floatSize, at = null;
      for (; size >= 12; size -= 0.5) {
        let ok = true;
        for (const card of cards) {
          card.style.fontSize = size + 'px';
          if (card.getBoundingClientRect().height > box.h) { ok = false; at = 'height'; break; }
          for (const w of card.querySelectorAll('.cap-w')) {
            if (w.getBoundingClientRect().width * maxScale > box.w) { ok = false; at = w.textContent; break; }
          }
          if (!ok) break;
        }
        if (ok) { at = null; break; }
      }
      for (const card of cards) card.style.fontSize = size.toFixed(3) + 'px';
      const c = capOf(cards[0]);
      const lh = parseFloat(getComputedStyle(cards[0]).lineHeight) || 1;
      return {
        size: +size.toFixed(3), maxScale, stoppedBy: at,
        family: P.CAP.family, weight: P.CAP.weight,
        capPx: +(c.cap * P.DSF).toFixed(1), font: c.font,
        blocks: cards.map(el => ({
          text: el.textContent.slice(0, 30),
          h: +el.getBoundingClientRect().height.toFixed(1),
          lines: Math.round(el.getBoundingClientRect().height / lh),
        })),
      };
    },

    measureWm() {
      const el = wms[0], r = el.getBoundingClientRect(), d = P.DSF;
      let widest = 0;
      for (const sp of el.querySelectorAll('span')) {
        widest = Math.max(widest, sp.getBoundingClientRect().width);
      }
      const c = capOf(el);
      return {
        sizeCss: +parseFloat(getComputedStyle(el).fontSize).toFixed(2),
        widestPx: +(widest * d).toFixed(1), capPx: +(c.cap * d).toFixed(1), font: c.font,
        left: +(r.left * d).toFixed(1), top: +(r.top * d).toFixed(1),
        right: +((P.VW - r.right) * d).toFixed(1), bottom: +((P.VH - r.bottom) * d).toFixed(1),
      };
    },

    /* ---------- the prong, as it actually painted ----------
       **only the prong.** the obvious version of this measures the plate too and
       subtracts, and it is wrong for the reason lib/mascot.mjs writes down in as
       many words: a browser's rect for a turned shape is the box of its geometry
       rather than of its ink, so a circle rotated two and a half degrees comes
       back three css px wider on each side than it is. the head is turned on
       nearly every frame of this film, so how deep the plug sits is worked out
       from `headRect` in node and this only answers "is the prong where the
       table put it", which is a question about an axis aligned rect in a group
       that never rotates. the plate is returned beside it, marked, so a reader
       can see the two disagree rather than wonder why. */
    measurePlug() {
      const plate = document.querySelector('#m-card .m-face .m-plate').getBoundingClientRect();
      const prong = document.querySelectorAll('.plug-ink')[0].getBoundingClientRect();
      return {
        prongRight: +prong.right.toFixed(2), prongW: +prong.width.toFixed(2),
        plateLeftRotatedBox: +plate.left.toFixed(2),
      };
    },

    apply(o) {
      const s = stage.style;
      s.setProperty('--m-o', o.mo.toFixed(4));
      s.setProperty('--iris', o.iris);
      s.setProperty('--zoom', o.zoom.toFixed(4));
      s.setProperty('--sx', o.sx.toFixed(2));
      s.setProperty('--sy', o.sy.toFixed(2));
      s.setProperty('--split', o.g.split.toFixed(2));
      s.setProperty('--noise', o.g.noise.toFixed(4));
      s.setProperty('--flash', o.g.flash.toFixed(4));
      s.setProperty('--wm-o', o.wm.o.toFixed(4));
      s.setProperty('--wm-s', o.wm.sc.toFixed(4));
      s.setProperty('--wm-glow', o.wm.glow.toFixed(4));
      /* the split is behind an attribute rather than a zero valued shadow: a
         shadow at offset 0 in full colour is a coloured halo, not "off". */
      if (o.g.split > 0.01) stage.setAttribute('data-gl', '1');
      else stage.removeAttribute('data-gl');

      capEl.style.setProperty('--capo', o.cap.toFixed(4));
      cable.style.setProperty('--cx', o.cable.x.toFixed(2));
      cable.style.setProperty('--co', o.cable.o.toFixed(4));
      scan.style.setProperty('--y', o.scan.y.toFixed(2));
      scan.style.setProperty('--o', o.scan.o.toFixed(4));

      for (let i = 0; i < lamps.length; i++) lamps[i].style.setProperty('--o', o.lamps[i].toFixed(4));
      for (let i = 0; i < notes.length; i++) {
        const nn = o.notes[i], el = notes[i];
        el.style.setProperty('--o', nn.o.toFixed(4));
        el.style.setProperty('--x', nn.x.toFixed(2));
        el.style.setProperty('--y', nn.y.toFixed(2));
        el.style.setProperty('--s', nn.s.toFixed(4));
      }
      for (let k = 0; k < 2; k++) {
        const e = o.eyes[k], el = glows[k];
        el.style.setProperty('--x', e.x.toFixed(2));
        el.style.setProperty('--y', e.y.toFixed(2));
        el.style.setProperty('--o', o.eyeGlow.toFixed(4));
        beamGs[k].style.setProperty('--bo', o.bo.toFixed(4));
        if (o.bo > 0.004) {
          const b = o.beams[k];
          for (const ln of beams[k]) {
            ln.setAttribute('x1', b.x1.toFixed(2)); ln.setAttribute('y1', b.y1.toFixed(2));
            ln.setAttribute('x2', b.x2.toFixed(2)); ln.setAttribute('y2', b.y2.toFixed(2));
          }
        }
      }
      for (let i = 0; i < sparks.length; i++) {
        const sp = o.sparks[i], el = sparks[i];
        if (!sp) { el.style.opacity = '0'; continue; }
        el.style.opacity = sp.o.toFixed(4);
        el.setAttribute('x1', sp.x1.toFixed(2)); el.setAttribute('y1', sp.y1.toFixed(2));
        el.setAttribute('x2', sp.x2.toFixed(2)); el.setAttribute('y2', sp.y2.toFixed(2));
      }
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

/* ---------- a local static server, so the load sequence is the clip's ------- */
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

/* ---------- the rAF shim ----------
   nothing in this scene animates by hand, but the shim is installed and flushed
   once per capture anyway, so this layer runs under the same clock everything
   else in demo/ runs under. a shim that only appears when it is needed is a shim
   nobody tests. */
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
async function render(plan, cap) {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  for (const d of [FRAMES, SUBS]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  fs.mkdirSync(OUT, { recursive: true });

  const N = Math.round(FPS * SECONDS);
  const { srv, port } = await serve(sceneHtml(plan, cap));
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
      { name: 'prefers-color-scheme', value: 'dark' },
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
  for (let i = 0; i < 240; i++) {
    const ok = await page.evaluate(() => !!(window.__built && window.__mas && window.__mas.ready
      && window.__cap && window.__cap.ready && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  if (!await page.evaluate(() => !!window.__built)) throw new Error('the scene never became ready');
  /* offline both faces fall back to the system mono and everything looks almost
     right, which is the worst kind of wrong to judge type on. */
  for (const [f, what] of [['400 40px "Michroma"', 'the wordmark'], ['800 42px "Manrope"', 'the captions']]) {
    if (!await page.evaluate(s => document.fonts.check(s), f)) {
      throw new Error(f + ' did not load — ' + what + ' would be judged in the mono fallback');
    }
  }

  const built = await page.evaluate(() => window.__built);
  const wm = await page.evaluate(() => window.__p21.measureWm());
  console.log('  built: head ' + built.mas.headPx + 'px, ' + built.mas.eyes + ' eyes, '
    + built.mas.glows + ' glow layers, theme ' + built.mas.theme);
  console.log('  the captions: ' + built.capRefit.family + ' ' + built.capRefit.weight + ', '
    + built.capRefit.size + 'css px, caps ' + built.capRefit.capPx + ' device — the module fitted '
    + built.cap.size.toFixed(2) + ' on one row in its own face');
  for (const b of built.capRefit.blocks) {
    console.log('    "' + b.text + '"  ' + b.lines + ' line' + (b.lines === 1 ? '' : 's')
      + ', ' + b.h + 'css tall in a box of ' + CAP_BOX.h);
  }
  console.log('  the wordmark: ' + wm.sizeCss + 'css px, widest line ' + wm.widestPx
    + ' device px, caps ' + wm.capPx + ', clear ' + wm.left + ' left / ' + wm.top
    + ' top / ' + wm.right + ' right / ' + wm.bottom + ' bottom');

  /* the plug against the head, with him on his mark and the cable home. */
  {
    const f = Math.round(PLUG * FPS), t = f / FPS;
    const mf = compose(plan, t, t);
    await page.evaluate(fr => window.__mas.apply(fr), mf);
    await page.evaluate(fr => window.__p21.apply(fr), frameAt(plan, mf, t, f));
  }
  const plug = await page.evaluate(() => window.__p21.measurePlug());
  plug.at = +(Math.round(PLUG * FPS) / FPS).toFixed(4);
  plug.zoom = zoomAt(plug.at);
  console.log('  the prong: it ends at ' + plug.prongRight.toFixed(1) + ' css px on the plug frame, '
    + plug.prongW.toFixed(1) + ' wide (the table says ' + CAB.tip + ' at zoom '
    + plug.zoom.toFixed(4) + ', which is ' + (VW / 2 - (VW / 2 - CAB.tip) * plug.zoom).toFixed(1) + ')');

  /* the caption ink, on the frame each card is fully up on, measured off the
     drawn cells rather than off the box they were told to live in. */
  const capSafe = [];
  for (let gi = 0; gi < cap.groups.length; gi++) {
    const at = +(cap.groups[gi].in + 0.30).toFixed(3);
    await page.evaluate(fr => window.__cap.apply(fr), captionFrame(cap, at));
    const s = await page.evaluate((w, h) => window.__cap.safe(w, h), VW, VH);
    capSafe.push({ g: gi, at, ...s });
  }

  /* the head, as ink, on every frame the fault has not taken. the glow and the
     shadow are reported beside it rather than folded into it: a thirty px blur
     crossing a safe line is not ink crossing it. */
  let worst = null, crown = VH;
  for (let f = 0; f < N; f++) {
    const t = f / FPS;
    if (t >= END.at) break;
    const r = headRect(plan, compose(plan, t, t));
    const near = Math.min(r.left, r.top, r.right, r.bottom);
    if (!worst || near < worst.near) worst = { t: +t.toFixed(3), near, ...r };
    crown = Math.min(crown, r.top / DSF);
  }

  const sigs = [];
  const wall = Date.now();

  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const mf = compose(plan, t, f / FPS);
      const o = frameAt(plan, mf, t, f);
      const cf = captionFrame(cap, t);
      await page.evaluate(fr => window.__mas.apply(fr), mf);
      await page.evaluate(fr => window.__cap.apply(fr), cf);
      await page.evaluate(fr => window.__p21.apply(fr), o);
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);

      if (k === 0) {
        /* the liveness signature: one number per output frame off everything
           this file wrote plus everything both modules wrote, so two identical
           frames are a fact rather than a suspicion. */
        let s = o.mo * 7 + o.red * 11 + o.bo * 13 + o.zoom * 17 + o.cable.x * 19
          + o.sx * 23 + o.sy * 29 + o.scan.y * 31 + o.scan.o * 37 + o.eyeGlow * 41
          + o.wm.o * 43 + o.wm.sc * 47 + o.wm.glow * 53 + o.cap * 59
          + o.g.split * 61 + o.g.noise * 67 + o.g.flash * 71 + o.g.bands.length * 73
          + mf.card.x * 79 + mf.card.y * 83 + mf.card.rot * 89
          + mf.card.sx * 97 + mf.card.sy * 101 + mf.glow * 103;
        for (let e = 0; e < 2; e++) {
          s += mf.eyes[e].x * (107 + e) + mf.eyes[e].y * (113 + e)
            + mf.eyes[e].sx * (127 + e) + mf.eyes[e].sy * (131 + e) + mf.eyes[e].lid * (137 + e);
          s += mf.brows[e].o * (139 + e) + mf.brows[e].y * (149 + e);
          s += o.beams[e].x2 * (151 + e) + o.beams[e].y2 * (157 + e);
        }
        for (let i = 0; i < o.lamps.length; i++) s += o.lamps[i] * (163 + i);
        for (let i = 0; i < o.notes.length; i++) s += o.notes[i].o * (181 + i) + o.notes[i].y * (191 + i);
        for (let i = 0; i < o.sparks.length; i++) if (o.sparks[i]) s += o.sparks[i].x2 * (197 + i) + o.sparks[i].o;
        for (let i = 0; i < cf.g.length; i++) s += cf.g[i][0] * (211 + i) + cf.g[i][1] * (223 + i);
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

  /* a still per beat, so the cut can be read as a strip rather than scrubbed as
     a video. the time asked for is rounded to a frame and that frame's own
     instant is drawn, so the glitch, which is a function of the frame index, and
     everything else, which is a function of time, cannot disagree. */
  fs.rmSync(VERIFY, { recursive: true, force: true });
  fs.mkdirSync(VERIFY, { recursive: true });
  const stills = [
    [0.02, 'a-frame-zero'],
    [NOTE.at[1] + 0.30, 'b-the-hum'],
    [CABLE.at + CABLE.for * 0.55, 'c-the-cable-arriving'],
    [PLUG + 0.06, 'd-plugged-in'],
    [PLUG + 0.50, 'e-the-caption'],
    [SHOCK.at + 0.12, 'f-the-shock'],
    [SHOCK.at + 0.90, 'g-sparks'],
    [LOCK + 0.14, 'h-the-lock'],
    [DEATH[0] + 0.02, 'i-the-first-lamp-goes'],
    [DEATH[2] + 0.02, 'j-the-third-lamp-goes'],
    [SWEEP.to - 0.05, 'k-the-room-is-out'],
    [CALM + 0.35, 'l-the-red-drains'],
    [8.10, 'm-the-punchline'],
    [GL_WINDOWS[1].t0, 'n-the-second-stutter'],
    [END.at + END.hard + END.tail + 0.16, 'o-the-wordmark'],
    [SECONDS - 0.06, 'p-the-last-frame'],
  ];
  for (const [want, name] of stills) {
    const f = Math.min(N - 1, Math.round(want * FPS));
    const t = f / FPS;
    const mf = compose(plan, t, t);
    await page.evaluate(fr => window.__mas.apply(fr), mf);
    await page.evaluate(fr => window.__cap.apply(fr), captionFrame(cap, t));
    await page.evaluate(fr => window.__p21.apply(fr), frameAt(plan, mf, t, f));
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
    });
    fs.writeFileSync(path.join(VERIFY, name + '.png'), Buffer.from(shot.data, 'base64'));
  }

  console.log('  the head, worst frame at ' + worst.t + 's: ' + worst.left + ' left, '
    + worst.top + ' top, ' + worst.right + ' right, ' + worst.bottom + ' bottom (floor '
    + Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom) + ')');
  console.log('  the glow reaches ' + worst.glowReach + 'px past the ink');

  await browser.close();
  srv.close();
  if (SUB > 1) blend(N);

  const state = { built, wm, plug, capSafe, head: worst, crown, sigs, frames: N };
  fs.writeFileSync(path.join(OUT, 'post21.json'), JSON.stringify(state, null, 2));
  return state;
}

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }

/* the subframes are averaged into frames, which is what a shutter is: a frame is
   the light that arrived over its own duration, not a sample of one instant. */
function blend(N) {
  console.log('  blending ' + N * SUB + ' subframes into ' + N + ' frames ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS * SUB), '-i', path.join(SUBS, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1)
      + ',setpts=PTS-STARTPTS,framestep=' + SUB,
    '-q:v', '2', path.join(FRAMES, 'f%05d.jpg')]);
}

function encode(wav) {
  const out = path.join(OUT, 'post21-dark-1080x1920.mp4');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'),
    '-i', wav,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p',
    '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-shortest',
    '-movflags', '+faststart', out]);
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
    audio: /Audio:\s*aac/.test(out),
  };
}

/* ========================================================================== */
/* go                                                                         */
/* ========================================================================== */

const cap = planCaptions(WORDS, {
  style: CAP.style, perCard: CAP.perCard, floatSize: CAP.floatSize,
  lead: CAP.lead, hold: CAP.hold, bodyGap: CAP.bodyGap,
});

/* ---------- the three marks ----------
   tired, shocked, tired again, and all three are the module's own table. there
   is no state for a mascot being electrocuted and this file is not allowed to
   add one, so the shock is `surprised` under a jitter and a strobe: the module
   does the face and this file does the electricity.

   `unimpressed` is what tired is here — it sinks, half lids, looks away and
   takes one slow blink over its own hold, which is the blink the brief asks for
   at the end and it arrives for free rather than being written. */
const plan = planMascot({
  seconds: SECONDS,
  size: SIZE,
  theme: 'dark',
  /* dead straight on. `pos` defaults to bottom-left and the module derives
     TURN.bias 0.35 from it, which is right for a head standing in a corner
     looking into the frame and wrong for one centred and talking to camera.
     any clip that centres him should say this, which is post20's note. */
  bias: 0,
  /* the caption band, so the module knows where the words live. this clip never
     opens a thought bubble, so nothing is placed against it — it is here so a
     later cut that adds one cannot put a pill through the caption. */
  band: CAP_BOX,
  marks: [
    { t: 0.00, state: 'unimpressed' },
    { t: SHOCK.at, state: 'surprised' },
    { t: CALM, state: 'unimpressed' },
  ],
});

/* centred, in the middle of the safe band. `headRect`, `mascotCss` and
   `mascotPagePlan` all read `plan.box` when they are called, so moving it first
   is the same as having been placed there. */
const halfBox = (GRID / 2) * plan.unit;
plan.box.left = +(VW / 2 - halfBox).toFixed(2);
plan.box.top = +(CENTRE_Y - halfBox).toFixed(2);

const rep = mascotMotion(plan, FPS, SECONDS);
const rep60 = FPS === 60 ? rep : mascotMotion(plan, 60, SECONDS);

console.log(describeMascot(plan));
console.log(describeMotion(rep));
console.log('\n  the captions');
console.log(describe(cap));

/* ---------- the crackle ----------
   a run of thin key ticks that thins as it goes. seeded, so the run is the same
   on every render, and the whole of it is inside the shock. */
const CRACK = (() => {
  const r = prng(0x0cead1);
  const out = [];
  let t = CRACKLE.from;
  while (t < CRACKLE.to) {
    out.push(+t.toFixed(4));
    const p = (t - CRACKLE.from) / (CRACKLE.to - CRACKLE.from);
    t += (CRACKLE.gap[0] + r() * (CRACKLE.gap[1] - CRACKLE.gap[0])) * (1 + CRACKLE.thin * p * p);
  }
  return out;
})();

/* ---------- the cues ----------
   the brief's three, plus the fault. nothing in this list is a number typed to
   taste: a pop is a note leaving the crown, the click is the plug landing, every
   tick is one crack of the shock and the glitch is the cut. */
const cues = [
  ...NOTE.at.map((t, i) => ({ t, kind: 'pop', from: 'note ' + (i + 1) + ' of four, off the crown' })),
  { t: PLUG, kind: 'click', from: 'the plug going into his face' },
  ...CRACK.map((t, i) => ({ t, kind: 'key', from: i ? '' : 'the shock: ' + CRACK.length + ' ticks, fired thin' })),
  { t: END.at, kind: 'glitch', from: 'the cut' },
];
const { buf: sfx, report: sfxReport } = renderSfx(cues, SECONDS, { gains: { key: KEY_DB } });

/* the two stutters before the hit: the same recipe, shorter and crushed harder
   each time, and quieter than the hit by a long way. one bus, three calls. */
const PRE_DB = [-32, -27];
for (let i = 0; i < END.pre.length; i++) {
  const w = GL_WINDOWS[i];
  const one = renderSfx([{
    t: w.t0, kind: 'glitch',
    opts: { len: 0.05 + i * 0.014, burst: 0.004, crush: 3800 - i * 600, f0: 210 + i * 20, f1: 120, seed: w.seed },
    from: 'stutter ' + (i + 1) + ' of two, into the hit',
  }], SECONDS, { gains: { glitch: PRE_DB[i] } });
  for (let j = 0; j < sfx.length; j++) sfx[j] += one.buf[j];
  sfxReport.push(...one.report);
}
sfxReport.sort((a, b) => a.t - b.t);

/* ---------- the mix ---------- */
const WAV = path.join(OUT, 'post21-sfx.wav');
const RAW = path.join(OUT, 'post21-sfx-raw.wav');
fs.mkdirSync(OUT, { recursive: true });
writeWav(RAW, sfx);
const before = loudness(ffmpeg, RAW);
let rawPeak = 0;
for (let i = 0; i < sfx.length; i++) rawPeak = Math.max(rawPeak, Math.abs(sfx[i]));
const rawPeakDb = 20 * Math.log10(rawPeak || 1e-9);
const wanted = before.lufs == null ? 0 : +(TARGET_LUFS - before.lufs).toFixed(2);
const allowed = +(SAMPLE_CEILING - rawPeakDb + LIMIT_ALLOW).toFixed(2);
const lift = Math.min(wanted, allowed);
applyGain(sfx, lift);
const peak = limit(sfx, SAMPLE_CEILING);
writeWav(WAV, sfx);
const after = loudness(ffmpeg, WAV);
fs.rmSync(RAW, { force: true });

/* ---------- the beats, printed ---------- */
console.log('\n  the beats');
const beats = [
  [0, 'he is tired in the middle of a lit room, four lamps behind him'],
  ...NOTE.at.map((t, i) => [t, 'note ' + (i + 1) + ' leaves the crown and pops, gone by '
    + (t + NOTE.life).toFixed(2)]),
  [CABLE.at, 'the cable slides in ' + CABLE.travel + 'px over ' + CABLE.for.toFixed(2) + 's'],
  [PLUG, 'the plug lands: a click, a ' + (ZOOM.by * 100).toFixed(1)
    + '% snap zoom, and the caption arrives'],
  [SHOCK.at, 'the shock. the camera shakes ' + JIT.cam + 'px and his head ' + JIT.head
    + 'px, held ' + JIT.hold + ' frames at a time, the eyes strobe and the sparks start'],
  [SHOCK.to - SHOCK.settle, 'the shake lets go over ' + SHOCK.settle.toFixed(2) + 's'],
  [LOCK, 'the eyes lock red and the glow comes up. the scan line is already running'],
  [SWEEP.at, 'the beams sweep, left to right'],
  ...DEATH.map((t, i) => [t, 'lamp ' + (i + 1) + ' at x' + LAMPS[i].x + ' is crossed and goes out']),
  [SWEEP.to, 'the sweep is off the right edge, the room is dark, the beams fade over '
    + SWEEP.out.toFixed(2) + 's'],
  [CALM, 'the red drains over ' + RED_OUT.toFixed(2) + 's and he is tired again, with the slow '
    + 'blink at ' + (CALM + 0.64 + 0.86).toFixed(2)],
  [cap.groups[1].in, 'the first card leaves and the second arrives on the same frame'],
  ...GL_WINDOWS.filter(w => w.pre != null).map(w => [w.t0, 'stutter ' + (w.pre + 1) + ' of two, '
    + w.frames + ' frame' + (w.frames === 1 ? '' : 's') + ' at ' + (w.force * 100).toFixed(0) + '% heat']),
  [END.at, 'the hit. he and both captions are cut and the wordmark is born on that frame'],
  [SECONDS, 'end, after ' + (SECONDS - END.wmIn - END.wmFor).toFixed(2) + 's of the end card'],
].sort((a, b) => a[0] - b[0]);
for (const [t, what] of beats) console.log('    ' + t.toFixed(2).padStart(5) + 's  ' + what);

console.log('\n  the sound');
console.log(describeMix(sfxReport, {
  'off the synth': (before.lufs == null ? '?' : before.lufs) + ' LUFS, peak ' + rawPeakDb.toFixed(1) + ' dBFS',
  'the lift': TARGET_LUFS + ' LUFS wanted ' + wanted.toFixed(2) + ' dB and the ' + SAMPLE_CEILING
    + ' dBFS ceiling plus ' + LIMIT_ALLOW + ' dB of limiting allowed ' + allowed.toFixed(2)
    + (allowed < wanted ? ', so the ceiling won by ' + (wanted - allowed).toFixed(2) + ' dB'
      : ', so the loudness target won'),
  'the bus': 'lifted ' + lift.toFixed(2) + ' dB to ' + (after.lufs == null ? '?' : after.lufs)
    + ' LUFS, peak ' + peak.peak + ' dBFS, limiter took '
    + (peak.reduction > 0.01 ? peak.reduction.toFixed(2) + ' dB' : 'nothing'),
  'the silence': 'nothing at all from ' + (CRACK[CRACK.length - 1] + 0.10).toFixed(2) + 's to '
    + GL_WINDOWS[0].t0.toFixed(2) + 's. the laser and the come down carry no sound, which is what '
    + 'the brief names and is the first thing to argue about',
}));

/* ---------- the fast things, measured before anything renders ----------
   the cable and the scan line are the only moves in this file that could outrun
   the shutter, so both are walked at sixty in the unit the argument is had in.
   the jitter is deliberately not in here: it is a hold rather than a move, and a
   two frame hold is meant to be a hard step. */
const fastest = (fn, a, b) => {
  let d = 0, at = a;
  for (let f = Math.floor(a * 60); f <= Math.ceil(b * 60); f++) {
    const s = Math.abs(fn((f + 1) / 60) - fn(f / 60));
    if (s > d) { d = s; at = f / 60; }
  }
  return { d: +d.toFixed(2), at: +at.toFixed(3) };
};
const cabStep = fastest(cableX, CABLE.at - 0.05, PLUG + 0.05);
const scanStep = fastest(t => scanAt(t).y, SCAN.at, SCAN.to);
console.log('\n  the fast things, at sixty');
console.log('    the cable peaks at ' + cabStep.d + ' css px a frame at ' + cabStep.at + 's, which is '
  + (cabStep.d * DSF / SUB).toFixed(1) + ' device px between samples at ' + SUB + ' subframe'
  + (SUB === 1 ? '' : 's') + ' (ceiling ' + STEP_CEIL + ' css px)');
console.log('    the scan line peaks at ' + scanStep.d + ' css px a frame');

const state = ONLY_ENCODE
  ? JSON.parse(fs.readFileSync(path.join(OUT, 'post21.json'), 'utf8'))
  : await render(plan, cap);
const file = encode(WAV);
const p = probe(file);
const lu = loudness(ffmpeg, file);

console.log('\nrendered');
console.log('  ' + p.w + 'x' + p.h + ' @' + p.fps + 'fps  ' + p.seconds.toFixed(2) + 's  '
  + (p.audio ? 'with sound' : 'SILENT') + '  '
  + (fs.statSync(file).size / 1e6).toFixed(2) + ' MB  ' + path.relative(ROOT, file));
console.log('  the shutter is ' + (BLUR ? 'open, ' + SUB + ' subframes to a frame' : 'closed'));
if (lu && lu.ok) {
  console.log('  loudness ' + lu.lufs + ' LUFS integrated, ' + lu.lra
    + ' LU range, true peak ' + lu.truePeak + ' dBFS, measured on the mp4');
}
console.log('  a still per beat in ' + path.relative(ROOT, VERIFY));

if (!KEEP && !ONLY_ENCODE) {
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.rmSync(SUBS, { recursive: true, force: true });
}

/* ---------- the guards ---------- */
const fail = [];
const floor = Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom);

if (p.w !== VW * DSF || p.h !== VH * DSF) fail.push('not ' + VW * DSF + 'x' + VH * DSF);
if (Math.abs(p.fps - FPS) > 0.5) fail.push('not ' + FPS + 'fps');
if (Math.abs(p.seconds - SECONDS) > 0.25) fail.push(p.seconds + 's, wanted ' + SECONDS);
if (!p.audio) fail.push('no audio track — the sounds did not mux');

/* ---------- the red is still the site's own ----------
   the one guard that reaches back into index.html: this file writes the laser
   as three numbers and they have to be the dark theme's --red. */
{
  const m = /--red:\s*#([0-9a-f]{6})/i.exec(brandTokens().dark);
  if (!m) fail.push('index.html\'s dark block has no --red in it any more');
  else {
    const want = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16));
    if (want.join(',') !== RED.join(',')) {
      fail.push('the laser is rgb(' + RED.join(',') + ') and the site\'s --red is now rgb('
        + want.join(',') + ') — this clip paints with the site\'s red');
    }
  }
}

/* ---------- him ---------- */
if (state.built.mas.headPx < HEAD_PX.min || state.built.mas.headPx > HEAD_PX.max) {
  fail.push('the head rendered at ' + state.built.mas.headPx + 'px, window is '
    + HEAD_PX.min + ' to ' + HEAD_PX.max);
}
if (state.head.near < floor - 0.5) {
  fail.push('the head comes within ' + Math.round(state.head.near) + 'px of a border at '
    + state.head.t + 's, floor is ' + floor);
}
const offX = +(Math.abs(plan.box.left + halfBox - VW / 2) * DSF).toFixed(2);
if (offX > 1) fail.push('his box is ' + offX + 'px off centre horizontally');
/* three marks, and they are the ones the brief asks for in the order it asks for
   them. asserted on the plan, so a fourth cannot arrive unnoticed. */
{
  const want = ['unimpressed', 'surprised', 'unimpressed'];
  const got = plan.marks.map(m => m.state);
  if (got.join(',') !== want.join(',')) {
    fail.push('the states are ' + got.join(', ') + ', wanted ' + want.join(', '));
  }
  if (plan.hands || plan.hand) fail.push('the plan draws hands, and the brief says none');
  if (plan.marks.some(m => m.hands || m.yap)) fail.push('a mark asks for a hand, and this clip has none');
}
for (const st of rep60.states) {
  if (st.entryFrames == null) fail.push(st.state + ' never reached its own mark');
  /* the overshoot is asked of the states that have one. `unimpressed` is
     measured on the **lid** and a lid does not overshoot: the module's own note
     calls it the one entrance in the table with almost no anticipation, because
     the whole read is that it cannot be bothered. asking a lid to bounce would
     be asking the module to be a different module. */
  if (st.state !== 'unimpressed' && !(st.overshoot > 1)) {
    fail.push(st.state + ' arrives with no overshoot');
  }
}
if (rep60.poses.length) fail.push('the report has ' + rep60.poses.length + ' hand poses in it, wanted none');
if (rep60.outside.units > 0) {
  fail.push('feature ink lands ' + rep60.outside.units.toFixed(2) + ' units outside the head silhouette');
}
if (rep60.blinks.repeatsInARow) fail.push(rep60.blinks.repeatsInARow + ' blinks repeat the one before them');
if (rep60.frozenFrames) fail.push(rep60.frozenFrames + ' frames where the face is not moving at all');
/* the come down's slow blink is the module's own, at 0.86 into the hold of a
   state whose entrance is 0.64. it has to be on screen rather than past the cut. */
if (!(CALM + 0.64 + 0.86 < END.at)) fail.push('the come down\'s slow blink lands after the fault');

/* ---------- the plug ---------- */
{
  /* how deep the prongs sit inside the plate, over every frame they are plugged
     in for, off the same geometry `headRect` uses. it is a range rather than one
     number because the head is the thing that moves: `unimpressed` leans away
     over a second and a half and the shock jitters him four css px either way,
     and the cable stays where it was put. what matters is that it is never
     nought — a plug resting against a cheek is not plugged in — and never so
     deep the plug's own body disappears. */
  let lo = Infinity, hi = -Infinity, loAt = 0, hiAt = 0;
  for (let f = Math.round(PLUG * 60); f < Math.round(END.at * 60); f++) {
    const t = f / 60;
    const c = compose(plan, t, t).card;
    const left = plan.box.left + (GRID / 2) * plan.unit + c.x - (HEAD.plate.s / 2) * plan.unit * Math.abs(c.sx);
    const into = CAB.tip - left;
    if (into < lo) { lo = into; loAt = t; }
    if (into > hi) { hi = into; hiAt = t; }
  }
  console.log('  the plug sits ' + lo.toFixed(1) + ' css px into the plate at ' + loAt.toFixed(2)
    + 's at its shallowest and ' + hi.toFixed(1) + ' at ' + hiAt.toFixed(2)
    + 's at its deepest, against a prong of ' + CAB.prong.w + ' and a body of ' + CAB.plug.w);
  if (lo < 8) {
    fail.push('the prongs are only ' + lo.toFixed(1) + ' css px into the plate at ' + loAt.toFixed(2)
      + 's, which is a plug resting on a cheek rather than in it');
  }
  if (hi > CAB.prong.w + CAB.plug.w / 2) {
    fail.push('the plug is ' + hi.toFixed(1) + ' css px into the plate at ' + hiAt.toFixed(2)
      + 's, which is half the body gone behind his head');
  }
  /* and the prong is where the table put it, on the frame it lands. this is a
     rendered check on an axis aligned rect: what was typed and what chrome
     resolved are two different numbers and only one of them is on screen. */
  {
    const q = state.plug;
    const want = VW / 2 - (VW / 2 - CAB.tip) * q.zoom;
    if (Math.abs(q.prongRight - want) > 0.6) {
      fail.push('the prong ends at ' + q.prongRight + ' css px and the table plus the zoom says '
        + want.toFixed(1));
    }
    if (Math.abs(q.prongW - CAB.prong.w * q.zoom) > 0.6) {
      fail.push('the prong drew ' + q.prongW + ' css px wide against the table\'s ' + CAB.prong.w);
    }
  }
  if (cableX(CABLE.at - 0.01) !== -CABLE.travel) fail.push('the cable is not fully off frame before it slides');
  if (cableX(PLUG) !== 0) fail.push('the cable is not home on the plug frame');
  if (CAB.tip - CABLE.travel > 0) fail.push('the cable is still on screen at its start position');
  if (cabStep.d > STEP_CEIL) {
    fail.push('the cable moves ' + cabStep.d + ' css px on one frame at 60, ceiling is ' + STEP_CEIL);
  }
  /* the plug's own snap zoom is over before the shock starts, or two camera
     moves would be arguing over the same frames. */
  if (PLUG + ZOOM.in + ZOOM.out > SHOCK.at) fail.push('the snap zoom is still running when the shock starts');
  if (Math.abs(zoomAt(SHOCK.at) - 1) > 1e-6) fail.push('the zoom has not returned to 1 by the shock');
  if (!(zoomAt(PLUG + ZOOM.in) > 1 + ZOOM.by - 1e-6)) fail.push('the snap zoom never reaches its own depth');
}

/* ---------- the notes ---------- */
{
  if (NOTE.at.length !== 4) fail.push('there are ' + NOTE.at.length + ' notes and the brief asks for four');
  const pops = sfxReport.filter(r => r.kind === 'pop');
  if (pops.length !== NOTE.at.length) fail.push('there are ' + pops.length + ' pops for ' + NOTE.at.length + ' notes');
  for (let i = 0; i < NOTE.at.length; i++) {
    if (pops[i] && Math.abs(pops[i].t - NOTE.at[i]) > 0.006) {
      fail.push('note ' + (i + 1) + '\'s pop is not on the note');
    }
    if (i && !(NOTE.at[i] > NOTE.at[i - 1])) fail.push('the notes are not in order');
  }
  /* nothing on the crown once the cable is home. */
  for (let f = Math.round(PLUG * 60); f < Math.round(SECONDS * 60); f++) {
    const o = Math.max(...NOTE.at.map((_, i) => noteAt(i, f / 60).o));
    if (o > 0.004) { fail.push('a note is on screen at ' + (f / 60).toFixed(2) + 's, after the plug'); break; }
  }
  /* and a note never climbs into the caption band. measured off the crown the
     note actually left, which is the head's own on that frame rather than the
     one the plan describes — the same reason the beams are. */
  let highest = VH;
  for (let f = 0; f < Math.round(PLUG * 60); f++) {
    const t = f / 60;
    const crown = crownAt(plan, compose(plan, t, t));
    for (let i = 0; i < NOTE.at.length; i++) {
      const nn = noteAt(i, t);
      if (nn.o > 0.02) highest = Math.min(highest, crown.y + nn.dy - NOTE.h);
    }
  }
  console.log('  the notes reach ' + (highest * DSF).toFixed(0) + 'px and the caption band starts at '
    + ((CAP_BOX.y + CAP_BOX.h) * DSF) + 'px');
  if (highest < CAP_BOX.y + CAP_BOX.h) fail.push('a note climbs into the caption band');
}

/* ---------- the red ----------
   nought before the shock, both values inside it, locked through the sweep,
   drained by the calm, and every strobe run is two or three frames. */
{
  if (redAt(SHOCK.at - 0.02) !== 0) fail.push('the eyes are red before the shock');
  const vals = new Set();
  for (let f = Math.round(SHOCK.at * 60); f < Math.round(LOCK * 60); f++) vals.add(redAt(f / 60));
  if (!vals.has(0) || !vals.has(1)) {
    fail.push('the eyes do not strobe: the shock only ever shows ' + [...vals].join(', '));
  }
  for (const r of STROBE_RUNS) {
    const len = r.to - r.from;
    if (len < STROBE.min || len > STROBE.max) {
      fail.push('a strobe run is ' + len + ' frames, and they live between ' + STROBE.min + ' and ' + STROBE.max);
      break;
    }
  }
  if (!STROBE_RUNS[STROBE_RUNS.length - 1].red) fail.push('the strobe does not land on red at the lock');
  for (let f = Math.round(LOCK * 60); f < Math.round(CALM * 60); f++) {
    if (redAt(f / 60) !== 1) { fail.push('the eyes are not locked red at ' + (f / 60).toFixed(2) + 's'); break; }
  }
  if (redAt(CALM + RED_OUT + 0.02) !== 0) fail.push('the red has not drained by ' + (CALM + RED_OUT).toFixed(2) + 's');
  if (redAt(SECONDS - 0.1) !== 0) fail.push('the eyes are still red on the end card');
}

/* ---------- the sparks ----------
   only inside the shock, always at least one on screen while it runs at full,
   and never one held past three frames. */
{
  let none = 0, longest = 0, outside = null;
  const run = new Array(SPARK.n).fill(0);
  for (let f = 0; f < Math.round(SECONDS * 60); f++) {
    const t = f / 60;
    const s = sparksAt(t);
    const live = s.filter(Boolean).length;
    if (t < SHOCK.at || t >= SHOCK.to) { if (live && outside == null) outside = t; continue; }
    /* the whole shock, not just the part before the settle: the sparks are on
       their own envelope now and the settle thins them rather than ending them. */
    if (!live) none++;
    for (let k = 0; k < SPARK.n; k++) {
      run[k] = s[k] ? run[k] + 1 : 0;
      longest = Math.max(longest, run[k]);
    }
  }
  console.log('  the sparks: longest life ' + longest + ' frames at sixty, ' + none
    + ' frame(s) of the shock with none on screen');
  if (outside != null) fail.push('a spark fires at ' + outside.toFixed(2) + 's, outside the shock');
  if (longest > SPARK.life[1]) {
    fail.push('a spark is on for ' + longest + ' frames, and they live ' + SPARK.life.join(' or '));
  }
  if (none > 0) fail.push(none + ' frames of the shock have no spark on them at all');
}

/* ---------- the crackle ---------- */
{
  const keys = sfxReport.filter(r => r.kind === 'key');
  if (keys.length !== CRACK.length) fail.push('there are ' + keys.length + ' ticks for ' + CRACK.length + ' cracks');
  if (keys.length < 20) fail.push('the crackle is only ' + keys.length + ' ticks, which is a tap rather than a crackle');
  for (const k of keys) {
    if (k.t < SHOCK.at - 1e-6 || k.t > SHOCK.to) fail.push('a key tick at ' + k.t + 's is outside the shock');
  }
  /* and it thins: the last third's gaps are wider than the first third's. */
  const gaps = CRACK.slice(1).map((t, i) => t - CRACK[i]);
  const third = Math.max(1, Math.floor(gaps.length / 3));
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  if (!(mean(gaps.slice(-third)) > mean(gaps.slice(0, third)) * 1.2)) {
    fail.push('the crackle does not thin: it starts at ' + mean(gaps.slice(0, third)).toFixed(3)
      + 's a tick and ends at ' + mean(gaps.slice(-third)).toFixed(3));
  }
}

/* ---------- the sweep and the room ----------
   the aim only ever goes right, every lamp dies exactly once and in order, the
   room is dark before the calm, and no lamp comes back. */
{
  let last = -Infinity;
  for (let f = Math.round(SWEEP.at * 60); f <= Math.round(SWEEP.to * 60); f++) {
    const x = aimAt(f / 60).x;
    if (x < last - 1e-9) { fail.push('the sweep goes backwards at ' + (f / 60).toFixed(2) + 's'); break; }
    last = x;
  }
  for (let i = 1; i < DEATH.length; i++) {
    if (!(DEATH[i] > DEATH[i - 1])) fail.push('lamp ' + (i + 1) + ' dies before the one to its left');
    if (!(LAMPS[i].x > LAMPS[i - 1].x)) fail.push('the lamps are not sorted left to right');
  }
  if (DEATH[0] < SWEEP.at) fail.push('the first lamp is out before the sweep starts');
  const dark = +(DEATH[DEATH.length - 1] + LAMP_OUT.flare + LAMP_OUT.fade).toFixed(3);
  console.log('  the room is out at ' + dark + 's, ' + (CALM - dark).toFixed(2) + 's before the calm');
  if (dark > CALM) fail.push('the room is still lit at the calm: the last lamp is not out until ' + dark);
  /* ceil rather than round: the frame the fade lands on is the last one that is
     legitimately still fading, and rounding down asks about it. */
  for (let f = Math.ceil(dark * 60); f < Math.round(SECONDS * 60); f++) {
    const o = Math.max(...LAMPS.map((_, i) => lampO(i, f / 60)));
    if (o > 0.004) { fail.push('a lamp is back at ' + (f / 60).toFixed(2) + 's, after the room went dark'); break; }
  }
  for (let i = 0; i < LAMPS.length; i++) {
    if (!(lampO(i, DEATH[i] - 0.02) > 0.5)) fail.push('lamp ' + (i + 1) + ' is already out before it is crossed');
    if (!(lampO(i, 0.5) > 0.5)) fail.push('lamp ' + (i + 1) + ' is not lit in the first beat');
  }
  /* and the beams are only ever on inside their own window. */
  if (beamO(LOCK - 0.02) !== 0) fail.push('a beam is on before the eyes lock');
  if (!(beamO(SWEEP.at + 0.2) > 0.99)) fail.push('the beams are not fully up during the sweep');
  if (beamO(CALM) !== 0) fail.push('a beam is still on at the calm');
  if (SWEEP.to + SWEEP.out > CALM) fail.push('the beams are still fading into the calm beat');
  if (SCAN.to > CALM) fail.push('the scan line is still running into the calm beat');
  if (scanAt(SCAN.at - 0.02).o !== 0 || scanAt(SCAN.to).o !== 0) fail.push('the scan line is on outside its window');
}

/* ---------- the captions ---------- */
{
  const r = state.built.capRefit;
  if (!/Manrope/.test(r.font)) fail.push('the captions are not set in Manrope: ' + r.font);
  /* 44 device px of cap height, which is what a caption is at 1080 wide. the
     one row fit came out at 34 and that is the number that opened the wrapped
     fit above. */
  if (r.capPx < 44) fail.push('the caption caps measure ' + r.capPx + ' device px, floor is 44');
  if (r.stoppedBy) {
    fail.push('the caption fit ran all the way down and was still stopped by "' + r.stoppedBy + '"');
  }
  if (cap.groups.length !== 2) fail.push('the plan cut ' + cap.groups.length + ' cards, and there are two lines');
  const said = cap.groups.map(g => g.words.map(w => w.word).join(' '));
  if (said[0] !== 'ai is thinking') fail.push('the first card reads "' + said[0] + '"');
  if (said[1] !== 'you asked how the weather is') fail.push('the second card reads "' + said[1] + '"');
  /* one at a time, on every frame at sixty. */
  for (let f = 0; f < Math.round(SECONDS * 60); f++) {
    if (captionFrame(cap, f / 60).g.filter(x => x[0] > 0.01).length > 1) {
      fail.push('both captions are on screen at ' + (f / 60).toFixed(2) + 's');
      break;
    }
  }
  if (cap.groups[0].in > PLUG + 1e-6) {
    fail.push('the first caption arrives at ' + cap.groups[0].in + 's, before the plug lands');
  }
  if (cap.groups[0].out < LOCK) {
    fail.push('the first caption leaves at ' + cap.groups[0].out + 's, before the laser is over');
  }
  if (Math.abs(cap.groups[1].in - (CALM - CAP.lead)) > 1e-6) {
    fail.push('the second caption arrives at ' + cap.groups[1].in + 's rather than a lead before the calm');
  }
  if (!(captionFrame(cap, END.at - 0.02).g[1][0] > 0.9)) fail.push('the punchline is not fully up before the fault');
  /* the ink, against the borders, and with the snap zoom folded in **for the
     card that is on screen while it fires**. the first card arrives on the frame
     the zoom starts, so a rest measurement would clear a line it does not clear
     on the frame it is judged on. the second card arrives four seconds later and
     folding a zoom that is long over into its check is not being careful, it is
     being wrong — it failed the second card by seven px on a move it never sees. */
  for (const s of state.capSafe) {
    const g = cap.groups[s.g];
    let Z = 1;
    for (let f = Math.round(g.in * 60); f <= Math.round(Math.min(g.out, END.at) * 60); f++) {
      Z = Math.max(Z, zoomAt(f / 60));
    }
    const zoomed = {
      left: (VW / 2 - (VW / 2 - s.left) * Z) * DSF,
      right: (VW / 2 - (VW / 2 - s.right) * Z) * DSF,
      top: (VH / 2 - (VH / 2 - s.top) * Z) * DSF,
      bottom: (VH / 2 - (VH / 2 - s.bottom) * Z) * DSF,
    };
    console.log('  card ' + s.g + ' at ' + s.at + 's clears ' + (s.left * DSF).toFixed(0) + ' left / '
      + (s.top * DSF).toFixed(0) + ' top / ' + (s.right * DSF).toFixed(0) + ' right / '
      + (s.bottom * DSF).toFixed(0) + ' bottom, and ' + zoomed.left.toFixed(0) + ' / '
      + zoomed.top.toFixed(0) + ' / ' + zoomed.right.toFixed(0) + ' / ' + zoomed.bottom.toFixed(0)
      + ' at the worst zoom it is on screen for (' + Z.toFixed(4) + ')');
    for (const k of ['left', 'top', 'right', 'bottom']) {
      if (zoomed[k] < floor - 0.5) {
        fail.push('card ' + s.g + ' comes within ' + Math.round(zoomed[k]) + 'px of the ' + k
          + ' border at the worst zoom it is on screen for');
      }
    }
  }
  /* and it does not collide with him: the band is above his crown and stays
     there, so this is one comparison against the highest he ever reaches. */
  const capBottom = CAP_BOX.y + CAP_BOX.h;
  console.log('  the caption band ends at ' + (capBottom * DSF) + 'px and his crown reaches '
    + (state.crown * DSF).toFixed(0) + 'px, a gap of '
    + ((state.crown - capBottom) * DSF).toFixed(0) + ' device px');
  if (state.crown <= capBottom) {
    fail.push('the caption band overlaps him: his crown reaches ' + state.crown.toFixed(1) + 'css px');
  }
}

/* every cue is inside the clip and none of them was cut off by the end of it. */
for (const r of sfxReport) {
  if (r.cut) fail.push('the ' + r.kind + ' cue at ' + r.t + 's was cut off by the end of the clip');
  if (r.t < 0 || r.t > SECONDS) fail.push('the ' + r.kind + ' cue at ' + r.t + 's is outside the clip');
}
/* no voice and no music, which is the brief, asserted on the bus rather than
   remembered: the only kinds in this film are the four it names. */
{
  const kinds = [...new Set(sfxReport.map(r => r.kind))].sort();
  const want = ['click', 'glitch', 'key', 'pop'];
  if (kinds.join(',') !== want.join(',')) {
    fail.push('the bus carries ' + kinds.join(', ') + ', wanted ' + want.join(', '));
  }
  if (mascotCues(plan).length) fail.push('the module offered a cue and this clip takes none — check it');
}

/* ---------- the wordmark ---------- */
{
  const w = state.wm;
  if (!/Michroma/.test(w.font)) fail.push('the wordmark is not set in michroma: ' + w.font);
  if (w.capPx < WM.minCapPx) fail.push('the wordmark caps measure ' + w.capPx + ' device px, floor is ' + WM.minCapPx);
  for (const k of ['left', 'top', 'right', 'bottom']) {
    if (w[k] < floor - 0.5) fail.push('the wordmark comes within ' + Math.round(w[k]) + 'px of the ' + k + ' border');
  }
  if (Math.abs(w.widestPx - WM.w * DSF) > 6) {
    fail.push('the wordmark fitted to ' + w.widestPx + ' device px, wanted ' + WM.w * DSF);
  }
  if (WM.lines.length !== 3) fail.push('the end card is ' + WM.lines.length + ' lines, and it is stacked three');
  if (WM.lines.join(' ').toLowerCase().includes('.com')) fail.push('the end card carries an address');
}

/* ---------- the cut ---------- */
{
  const cutF = Math.round(END.at * FPS);
  const at = f => frameAt(plan, compose(plan, f / FPS, f / FPS), f / FPS, f);
  const just = at(cutF - 1), on = at(cutF);
  if (at(0).mo !== 1) fail.push('he is not on frame zero');
  if (just.mo !== 1 || just.cap !== 1) fail.push('he or the captions are already gone before the hit');
  if (on.mo !== 0 || on.cap !== 0) fail.push('he or the captions are still on the frame the wordmark arrives on');
  if (!(on.wm.o > 0)) fail.push('the wordmark is not born on the hit frame');
  if (on.lamps.some(v => v > 0)) fail.push('a lamp survives the hit');
  if (on.cable.o !== 0) fail.push('the cable survives the hit');
}

/* ---------- the fault ---------- */
{
  const count = (fps, windows) => {
    const N = Math.round(fps * SECONDS);
    let on = 0, lastOn = -1, flashes = 0;
    const per = windows.map(() => 0);
    for (let f = 0; f < N; f++) {
      const g = glitchAt(f, fps, windows);
      if (g.flash > 0) flashes++;
      if (g.heat > 0 || g.flash > 0) {
        on++; lastOn = f;
        const k = windows.findIndex(w => f / fps >= w.t0 && f / fps < w.t1);
        if (k > -1) per[k]++;
      }
    }
    return { N, on, lastOn, flashes, per };
  };
  const here = count(FPS, GL_WINDOWS);
  const at60 = FPS === 60 ? here : count(60, GL_WINDOWS_60);
  console.log('  the fault: ' + here.on + ' of ' + here.N + ' frames ('
    + (here.on / here.N * 100).toFixed(1) + '%), '
    + here.per.map((c, i) => (GL_WINDOWS[i].pre != null ? 'stutter' + (GL_WINDOWS[i].pre + 1) : 'hit') + ' ' + c).join(', ')
    + ', ' + here.flashes + ' white frame');
  if (!here.on) fail.push('nothing glitches on any frame');
  /* post12's named exception: the ceiling on how much of a clip may be glitching
     is 30% and it is read against the ending the fault lives in. */
  const endFrom = Math.round(GL_WINDOWS_60[0].t0 * 60);
  const endFrames = at60.N - endFrom;
  const localDuty = at60.on / endFrames;
  console.log('    and against the ending it lives in, at sixty: ' + at60.on + ' of ' + endFrames
    + ' frames from ' + GL_WINDOWS_60[0].t0.toFixed(2) + 's (' + (localDuty * 100).toFixed(1) + '%, ceiling 30%)');
  if (localDuty > 0.30) fail.push('the ending glitches on ' + (localDuty * 100).toFixed(1) + '% of its own frames');
  for (let i = 0; i < GL_WINDOWS.length; i++) {
    if (!here.per[i]) fail.push('glitch window ' + i + ' fired on no frames at ' + FPS + 'fps');
    if (!at60.per[i]) fail.push('glitch window ' + i + ' fired on no frames at 60fps');
  }
  if (here.flashes !== 1) fail.push(here.flashes + ' white frames, and there may be exactly one');
  const cleanFrom = Math.round((END.at + END.hard + END.tail + END.clean) * FPS);
  if (here.lastOn >= cleanFrom) fail.push('the fault is still firing at frame ' + here.lastOn);
  for (let i = 1; i < GL_WINDOWS.length; i++) {
    if (GL_WINDOWS[i].t0 < GL_WINDOWS[i - 1].t1 - 1e-9) {
      fail.push('glitch windows ' + (i - 1) + ' and ' + i + ' overlap');
    }
  }
  for (let i = 1; i < END.pre.length; i++) {
    if (!(END.pre[i].force > END.pre[i - 1].force)) {
      fail.push('stutter ' + (i + 1) + ' is not louder than the one before it');
    }
  }
  const hold = SECONDS - (END.wmIn + END.wmFor);
  if (hold < 0.80) fail.push('the wordmark holds ' + hold.toFixed(2) + 's, which is not long enough to be read');
}

/* ---------- the mix, on the finished file rather than on the intent -------- */
if (lu && lu.ok) {
  if (lu.truePeak > PEAK_CEILING) {
    fail.push('the true peak is ' + lu.truePeak + ' dBFS, over the ' + PEAK_CEILING + ' ceiling');
  }
  if (lu.lufs > TARGET_LUFS + 0.5) {
    fail.push('the file measures ' + lu.lufs + ' LUFS, over the ' + TARGET_LUFS + ' target');
  }
} else fail.push('ebur128 said nothing about the finished file');
if (peak.reduction > LIMIT_ALLOW + 1e-6) {
  fail.push('the limiter took ' + peak.reduction.toFixed(2) + ' dB, over the ' + LIMIT_ALLOW + ' dB this clip allows');
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

/* the copy, on the words that actually reach the screen. the dash rule is the
   caption engine's own and it ran inside planCaptions. */
for (const w of WORDS) {
  if (w.word !== w.word.toLowerCase()) fail.push('a caption word is not lower case: "' + w.word + '"');
  if (/[!]/.test(w.word)) fail.push('a caption word carries an exclamation mark');
}

console.log('\n  outstanding');
console.log('    the clip is ' + SECONDS.toFixed(2) + 's: the brief\'s beats run to '
  + END.at.toFixed(2) + ' and the end card follows them, which is where post20 put it too');
console.log('    the eyes go red from the module\'s own iris token rather than from white —'
  + ' on the dark theme the head is the white thing. see the note at the top of this file');
console.log('    ' + (GL_WINDOWS[0].t0 - CRACK[CRACK.length - 1]).toFixed(2)
  + 's of the film carries no sound at all, from the last crack to the first stutter');

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
