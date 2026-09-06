/* the boring tek — post20, the point.

   eight seconds, dark only, 1080x1920. a thought types itself in the middle of a
   black frame, gets knocked down to the lower third, and the mascot falls into
   the space it left. he lands, takes a beat, points at the viewer, laughs about
   it, and the punchline pops under him. then a hard fault takes the lot and puts
   the wordmark up.

   the line is: everyone says ai will replace u. the answer is: it will replace
   the guy who does not use it.

     node post20.mjs                     1080x1920, 60fps, shutter closed
     DEMO_FPS=12 node post20.mjs         the fast preview pass
     node post20.mjs --blur              60fps with the shutter open
     node post20.mjs --blur=6            a wider shutter, which the fall wants
     node post20.mjs --keep-frames       leave the jpegs on disk
     node post20.mjs --encode-only       re-encode from kept frames

   one output, one path, overwritten every run:

     demo/out/post20-dark-1080x1920.mp4

   ---------- why this one exists ----------

   it is **the first clip to use the floating hands**. the pose table has been in
   `lib/mascot.mjs` since the traced gloves landed and nothing outside
   `mascot-test.mjs` had ever asked for one, so every number in that table was
   proved on a test strip rather than on a film. this is the film: two poses, one
   chained into the other, both on bought timings, under a face that never
   changes state.

   the two poses are the whole joke. `point-viewer` is the finger aimed down and
   out at camera — the pose the traced review had to open a second drawing for,
   because the sheet's own point aims at the lens and closes into a fist. `laugh`
   is the flat hand over the mouth with the head bouncing under it, which is the
   one pose in the table that moves the head. he accuses, then he cannot keep it
   up, and the caption underneath finishes the sentence.

   ---------- what is not in this file ----------

   the mascot. `lib/mascot.mjs` supplies the plan, the frame, the preflight, the
   css, the markup and the page runtime, and nothing here reaches inside it. two
   things this file does to its output, and both are arithmetic on it rather than
   a change to it:

     `plan.box` is rewritten to centre him, which is post12's move and post12's
     reason: `planMascot` places by corner and this clip wants him in the middle
     of the safe band. `headRect`, `mascotCss` and `mascotPagePlan` all read
     `plan.box` when they are called, so moving it first is the same as having
     been placed there.

     the fall and the landing are composed onto `frame.card` after the module has
     written it, which is post19's move and post19's reason: a transform laid over
     the element would leave `headRect` answering about a head that is somewhere
     else. the one line post19 did not need is the glove's counter scale — see
     `compose` below, because the gloves are on in this clip and post19's were
     not.

   ---------- what is not the module's ----------

   the two captions. `lib/captions.mjs`'s `pop` fit measures a card as **one
   row** — michroma at a size that puts every word of it on a single line — which
   is right for the three word cards that style is written for and wrong for a
   six word line and a nine word one: both would be fitted down to about sixteen
   css px, which is not a caption, it is a footnote. so the two blocks are drawn
   here, in the pop idiom rather than by the pop engine: michroma caps, `--fg`,
   the site's own spring on every word, wrapped inside a fixed box and fitted to
   it in the page. what is borrowed from that module is `brandTokens`, so the
   colours still come out of `index.html` rather than out of this file, and
   `checkCopy`, so the dash rule is the same dash rule.

   ---------- the sound ----------

   synthesised, all of it, out of `lib/sfx.mjs`, and no new recipe. the key tick
   on each typed word, a `popDeep` when the caption lands and a heavier one when
   he does, the module's own three `titter`s on the laugh's first three bounces,
   a `pop` on the punchline and the `glitch` on the fault. no music and no voice.

   the keys are lifted from -34 to -26. that number was set for a run of ticks
   playing **under a read**; there is no read here and at -34 the typing would be
   silent on a phone. the recipe is untouched.

   ---------- the shutter ----------

   post10's rule and post19's warning. with `--blur` every output frame is
   captured `SUB` times inside its own sixtieth and the captures are averaged.
   anything written against `t` smears; the glitch and the cut are written
   against the output frame `f` and are held across every capture of it, or a one
   frame rgb split would land at a quarter strength. **the fall is 39.7 css px on
   its fastest frame**, which is post19's territory: four subframes is 19.9
   device px between samples and six is 13.2. it reads at four and it is cleaner
   at six, and the number is printed on every run. */

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
  STAGE, SAFE, HEAD, HEAD_PX, HANDS, GRID,
} from './lib/mascot.mjs';
import { brandTokens, checkCopy } from './lib/captions.mjs';
import { renderSfx, writeWav, applyGain, limit, loudness } from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post20');
const SUBS = path.join(OUT, 'subframes-post20');
const VERIFY = path.join(OUT, 'verify-post20');

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
   post12's line: the middle of the **safe band**, not of the frame. the
   platforms take 180 device px off the top and 220 off the bottom, so the
   middle of what a viewer sees is ten css px above the middle of the file. the
   wordmark lands on the same line, so he is replaced rather than followed. */
const CENTRE_Y = (SAFE_CSS.top + (VH - SAFE_CSS.bottom)) / 2;
const SIZE = 148;

/* ---------- the copy ----------
   two lines, lower case in the source and drawn in caps, which is what the pop
   style is. `checkCopy` runs over both below, so the dash rule is the caption
   engine's rather than a second copy of it. */
const COPY = {
  one: 'everyone says ai will replace u',
  two: 'it will replace the guy who does not use it',
};

/* ---------- the typing ----------
   word by word rather than character by character, which is what the brief asks
   for and is also the only version of this that has a sound to put on it: a key
   tick per word is six events, and a tick per character would be thirty one
   inside a second, which is a machine gun rather than typing.

   0.21s apart. five words a second is fast for a person and right for a thought
   arriving, and it is what fits the front of an eight second clip after the
   hands have taken the 3.15s the two poses need at the back.

   **the first word is on frame zero rather than arriving on it**, and that is a
   rendered frame's correction. it used to start at 0.10s and the review found
   the obvious consequence: frame zero was an empty black rectangle, which is the
   thumbnail and is also the first thing a feed shows before anybody has decided
   to watch. post12 cut its own fade up for exactly this. so word one's reveal
   window opens `wordFor` before the clip does and is finished at t=0, and its
   key tick is still on frame zero — the keystroke that put it there is the first
   thing you hear, and the film opens on a thought already half thought. */
const TYPE = { from: 0, step: 0.21, wordFor: 0.20, from0: 0.68 };

/* the cursor. it is the one accent in the clip and it is the machine: the words
   arrive in the ink and the green block is what is putting them there. it sits
   after the last word that has arrived, measured off that word's own rendered
   box rather than placed by arithmetic, and it blinks on its own period. */
const CUR = { period: 0.44, duty: 0.55, w: 0.44, h: 0.76, gap: 0.16 };

/* ---------- the caption box ----------
   one box, two blocks, one type size for both — the pop rule, because two cards
   at two sizes read as a zoom nobody asked for.

   `line` is where the block's centre sits once it has been knocked down, and it
   is derived from the bottom safe line rather than chosen: a four line block at
   forty css px is 179 tall, the platform's bottom line is at 850, and 726 puts
   the resting bottom 35 css px inside it with the landing bounce still clear.
   `dx` is the shift onto the side the finger points — he points down and out to
   screen right, and a punchline sitting on the other side of the frame from the
   gesture would be two things rather than one. it is 25 css px, which is as far
   right as a 340 wide box goes before its edge is on the safe line. */
const CAP = {
  box: { w: 340, h: 210 },
  max: 40,                 /* the caption engine's own cap, and for its reason */
  minCapPx: 30,            /* device px of cap height. a floor, not a target */
  mid: CENTRE_Y,
  line: 726,
  dx: 25,
  gap: 0.42,               /* em between words, the engine's own `wordGap` */
  lh: 1.12,
  outFor: 0.10,            /* how fast the setup leaves */
  inFor: 0.24,             /* and how fast the punchline springs */
};

/* ---------- the knock down ----------
   0.24s of travel and then a small bounce. the travel is on an ease in out
   rather than on the site's spring, and that is arithmetic rather than taste:
   268 css px on `--ease` peaks at about five times its own average, which is
   ninety css px on one frame — a caption that teleports at sixty and is simply
   missing from the preview. the curve here peaks at about 1.6 times its average,
   and 0.30s is what that number needs to land under the ceiling: it measured
   47.7 css px a frame at 0.24 and 38.2 at 0.30, against a fall that peaks at
   37.9 and a ceiling of 42.

   the bounce is a damped sine written separately, so the landing overshoot is a
   number in this table rather than a property of a curve: twelve css px down and
   back, one zero crossing, gone in a third of a second. */
const SNAP = { at: 1.66, for: 0.30, bounce: 12, bounceFor: 0.34, damp: 4.5, cycles: 1.0 };

/* ---------- the fall ----------
   post19's, at post19's numbers, and the length is the shutter's rather than
   taste's: 560 css px in 0.47s is 39.7 on the frame it lands, which is 19.9
   device px between samples at four subframes. `p²`, because that is what
   gravity is.

   the smash is post19's shape at a fifth of its depth. that clip is a head
   hitting the floor after a smash cut; this is a small robot arriving, and the
   brief says soft. 1.16 wide by 0.86 tall, one stretch on the way back out. */
const DROP = { at: 1.96, for: 0.47, from: 560 };
const LAND = +(DROP.at + DROP.for).toFixed(4);
const SMASH = { air: 0.05, flat: 0.05, back: 0.20, k: 0.16, damp: 4.2, cycles: 1.15 };

/* ---------- the cut ----------
   two marks, and both of them are hands marks: the face never changes state in
   this clip, because both poses already say everything. `neutral` is what is
   under them and it is there so the marks are legal — a mark carries a state.

   the room between them is not taste. `planMascot` refuses a mark with no room
   for its own entrance, hold and exit, and the two poses have floors of their
   own on top of that:

     `point-viewer` is bought at a 0.34s entrance against the table's 0.40, which
     is `mascot-test.mjs`'s chain chapter's own number. its hold is 0.74, which
     carries the first jab and hands the second one over mid extension — the
     chain is what makes that legal, and it reads as a hand that has already
     decided where it is going next.

     `laugh` is bought at 0.62 against the table's 1.01. the module's own search
     names 0.54 as the floor for a laugh coming off a rest and it refuses 0.54
     here, because this one comes off a `point-viewer` and the travel is longer:
     13.5 css px on one frame against the ceiling of 12. 0.62 clears it at 11.9.
     the hold is 1.55, which is the four bounces plus the beat the eyes take to
     open, and the module measures that rather than taking it on trust.

   so the two poses cost 3.15s between the mark the first one lands on and the
   frame the second one stops, and everything else in the clip is fitted round
   that number rather than the other way about. */
const CUT = {
  marks: [
    { t: 2.72, state: 'neutral', hands: { pose: 'point-viewer', entry: 0.34, hold: 0.74, next: true } },
    { t: 3.80, state: 'neutral', hands: { pose: 'laugh', entry: 0.62, hold: 1.55 } },
  ],
  seconds: 8.05,
};

/* ---------- the end ----------
   post12's machinery at post12's numbers, walked down a little: two stutters
   rather than three, and a shorter hit, because the fault here has to happen
   over a punchline somebody is reading rather than under a laugh.

   he and both captions are **cut** on the hit frame and the wordmark is born on
   that same frame, so the frame exchanges one thing for another and is never
   empty. that is post12's rule and it was a rendered still that wrote it. */
const END = {
  pre: [
    { t: 6.72, for: 0.05, force: 0.34 },
    { t: 6.86, for: 0.05, force: 0.60 },
  ],
  at: 7.00,
  hard: 0.12,
  tail: 0.18,
  wmIn: 7.00,
  wmFor: 0.09,
  clean: 0.06,
};

/* the wordmark: three words, no domain, on the line his head was on. post12's
   table unchanged, because it is the same frame at the same size. */
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16, minCapPx: 56 };

/* post12's glitch table, and the same argument about the flash: it is a bloom at
   the centre rather than a full frame wash, because a wash on a frame with the
   subject already cut renders as an even grey card. */
const GL = {
  shakeX: 15, shakeY: 8,
  split: 9.5,
  bandDx: 88,
  bands: 3,
  noise: [0.10, 0.24],
  flash: 0.30,
  flashSize: 420,
  calmFrom: 0.86,
};

const CRF = 17;

/* ---------- the mix ----------
   post12's, unchanged: -14 LUFS wanted, a -1.8 dBFS sample ceiling, a decibel
   and a half of limiting allowed, and the ceiling wins when the two disagree
   because this bus is a handful of transients on silence. */
const TARGET_LUFS = -14;
const SAMPLE_CEILING = -1.8;
const PEAK_CEILING = -1.0;
const LIMIT_ALLOW = 1.5;
const MAX_REDUCTION = LIMIT_ALLOW + 0.3;
const MIN_LUFS = -22;

/* how fast anything in this file may move, in css px between two frames at
   sixty. post19's number, and it is the shutter's rather than the animation's:
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
const POP = bezier(.34, 1.4, .64, 1);          /* the site's own --spring */
const MOVE = bezier(.4, 0, .2, 1);             /* and the one the knock down uses */
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))));
const lerp = (a, b, p) => a + (b - a) * p;

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

/* ---------- the two lines, as words with times ----------
   the first one is typed, so every word has a moment; the second arrives whole,
   so all nine share one. both go through the caption engine's own copy check,
   which is where the dash rule lives. */
const WORDS = {
  one: COPY.one.split(' ').map((word, i) => ({
    word, start: +(TYPE.from + i * TYPE.step).toFixed(4),
    end: +(TYPE.from + i * TYPE.step + TYPE.wordFor).toFixed(4),
    /* when the reveal opens, which is the tick's own moment for every word but
       the first. see the note in TYPE for why that one is different. */
    show: +(i === 0 ? -TYPE.wordFor : TYPE.from + i * TYPE.step).toFixed(4),
  })),
  two: COPY.two.split(' ').map(word => ({ word, start: 0, end: 0.2 })),
};
checkCopy(WORDS.one);
checkCopy(WORDS.two);
const TYPED_LAST = WORDS.one[WORDS.one.length - 1].start;

/* ---------- where the caption is, and what is showing on it ---------- */
function capAt(t, swap) {
  /* the block's own centre, as an offset from the middle of the frame. it sits
     on the middle of the safe band while it types and on the caption line after
     the knock down, and the bounce is added on top of the travel rather than
     being part of its curve. */
  const p = span(t, SNAP.at, SNAP.at + SNAP.for);
  const q = span(t, SNAP.at + SNAP.for, SNAP.at + SNAP.for + SNAP.bounceFor);
  const bounce = q > 0 && q < 1
    ? SNAP.bounce * Math.exp(-SNAP.damp * q) * Math.sin(2 * Math.PI * SNAP.cycles * q) * (1 - q)
    : 0;
  const cy = lerp(CAP.mid, CAP.line, MOVE(p)) - VH / 2 + bounce;
  const cx = CAP.dx * MOVE(p);

  /* the setup: every word invisible until its own moment, then a spring about
     its own centre. it holds its place from frame zero, so nothing already on
     screen slides sideways as the line fills — the caption engine's own reason,
     and here it is also what lets the cursor be placed off a box that never
     moves. */
  const one = WORDS.one.map(w => {
    const a = span(t, w.show, w.show + 0.10);
    const s = span(t, w.show, w.show + TYPE.wordFor);
    return { o: +a.toFixed(4), s: +lerp(TYPE.from0, 1, POP(s)).toFixed(4) };
  });
  /* how many have arrived, which is what the cursor sits after. */
  let n = 0;
  for (const w of WORDS.one) if (t >= w.start) n++;

  const cut = t >= END.at;
  const oneO = cut ? 0 : +(1 - span(t, swap - CAP.outFor, swap)).toFixed(4);
  const twoP = span(t, swap, swap + CAP.inFor);
  return {
    cx: +cx.toFixed(3), cy: +cy.toFixed(3),
    one, oneO,
    /* the punchline springs in whole, which is what a pop card does and is the
       opposite of the line above it. it is the answer arriving, not being typed. */
    twoO: cut ? 0 : +span(t, swap, swap + 0.06).toFixed(4),
    twoS: +lerp(0.86, 1, POP(twoP)).toFixed(4),
    /* the cursor is on while the line is being typed and off the moment the
       block is knocked down: a caret on a caption that has stopped being written
       is a caret nobody is holding. */
    cur: t >= TYPE.from && t < SNAP.at
      && ((t - TYPE.from) % CUR.period) < CUR.period * CUR.duty ? 1 : 0,
    curAt: Math.max(0, n - 1),
  };
}

/* ---------- the fall and the landing ----------
   post19's two functions at this clip's numbers. `dy` is how far above his mark
   he is and `k` is the compression; the third line of the second one is the
   ground compensation, which is the whole difference between a thing landing and
   a thing being squeezed in mid air. */
function fallAt(t) {
  if (t >= LAND) return 0;
  if (t <= DROP.at) return -DROP.from;
  const p = span(t, DROP.at, LAND);
  return +(-DROP.from * (1 - p * p)).toFixed(3);
}
function squashAt(t) {
  if (t <= DROP.at) return 0;
  /* he stretches on the way down. a thing falling is longer than a thing
     standing, and it is what makes the compression read as an arrival. */
  if (t < LAND) return +(-SMASH.air * EASE(span(t, DROP.at, LAND))).toFixed(5);
  const flat = span(t, LAND, LAND + SMASH.flat);
  if (flat < 1) return +lerp(-SMASH.air, SMASH.k, EASE(flat)).toFixed(5);
  const p = span(t, LAND + SMASH.flat, LAND + SMASH.flat + SMASH.back);
  if (p >= 1) return 0;
  /* a damped cosine tapered to nought: one zero crossing inside the window, so
     there is exactly one stretch on the way back out and then rest. */
  return +(SMASH.k * Math.exp(-SMASH.damp * p) * Math.cos(2 * Math.PI * SMASH.cycles * p)
    * (1 - p)).toFixed(5);
}

/* ---------- the mascot for one instant, with the fall composed onto him ------
   the module writes the head and this adds two things to it: how far above his
   mark he is, and how much he is squashed. both go on `frame.card`, which is
   what `headRect` and every clearance downstream already read.

   the third line is the one post19 did not need. `frame.hands.fit` is the
   inverse of the card's own two scales and it is what keeps a glove's outline an
   even weight under a squash — the module computes it from the card it wrote, so
   a card this file then scales leaves that inverse describing a head that no
   longer exists. dividing it by the same factor is not a correction to the
   module, it is this file finishing the composition it started. */
function compose(plan, t, R) {
  const f = mascotFrame(plan, t);
  const k = squashAt(t);
  if (!k && t >= LAND) return f;
  const sq = 1 + k;
  const ground = t >= LAND ? R * (1 - 1 / sq) : 0;
  f.card = {
    ...f.card,
    y: +(f.card.y + fallAt(t) + ground).toFixed(4),
    sx: +(f.card.sx * sq).toFixed(5),
    sy: +(f.card.sy / sq).toFixed(5),
  };
  if (f.hands) {
    f.hands = { ...f.hands, fit: { cx: +(f.hands.fit.cx / sq).toFixed(5), cy: +(f.hands.fit.cy * sq).toFixed(5) } };
  }
  return f;
}

/* ---------- the glitch ----------
   a function of the output frame index and of nothing else, which is post10's
   rule and post12's note: a one frame rgb split written against `t` would be on
   for one subframe of four and land at a quarter strength. */
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
/* and the same list on the master's grid, because a duty is a property of the
   animation rather than of the pass it is sampled at. the guards read sixty. */
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
  /* one white frame in the clip, on the hit, and it did not go up when the rest
     of the table did: several white frames inside a third of a second is a
     strobe rather than a glitch. */
  g.flash = f === Math.round(END.at * FPS) ? GL.flash : 0;
  /* the bands belong to the hit and only to the hit. a tear paints the page
     colour and redraws **the wordmark** shifted, and before the hit there is no
     wordmark to redraw — a band over the punchline would be a black bar with
     nothing behind it. post12 shipped that once and the still is why. */
  const n = w.pre != null ? 0 : Math.min(GL.bands, Math.floor(heat * (GL.bands + 0.5)));
  for (let i = 0; i < n; i++) {
    const h = 18 + r() * 96;
    g.bands.push({ top: +(r() * (VH - h)).toFixed(1), h: +h.toFixed(1), dx: +((r() * 2 - 1) * GL.bandDx * heat).toFixed(1) });
  }
  return g;
}

/* two sines on incommensurate periods rather than one: a sine stands still twice
   a period, so on an end card where this is the only thing moving the two frames
   either side of its turning point are identical. */
function phosphor(t, amp, slow, fast, phase) {
  return 1 + amp * 0.78 * Math.sin(2 * Math.PI * t / slow)
    + amp * 0.39 * Math.sin(2 * Math.PI * t / fast + phase);
}

/* ---------- what one frame is ----------
   everything this file writes, in one object. `t` is the instant being captured
   and `f` is the output frame it belongs to: they differ under the shutter and
   the difference is the whole point of the split. */
function frameAt(t, f, swap) {
  const g = glitchAt(f);
  const cutFrame = Math.round(END.at * FPS);
  /* he is off until he starts falling — 560 css px above his mark is off the top
     of the frame apart from the tips of the resting gloves — and he is cut on
     the hit frame, with both captions, on the same switch. */
  const mo = f >= cutFrame ? 0 : (t < DROP.at ? 0 : 1);
  const wp = span(t, END.wmIn, END.wmIn + END.wmFor);
  return {
    t: +t.toFixed(4), f, mo,
    cap: capAt(t, swap),
    wm: {
      /* a cut rather than a ramp, and the reason is arithmetic. post12 fades the
         opacity in over the front of the snap because its hit does not land on a
         whole frame at either rate; this one lands on 7.00, which is exactly on
         both grids, so a ramp starting there is nought on the birth frame — and
         a birth frame with the mascot already cut and the wordmark not yet
         arrived is an empty frame, which is the fault post12's own note is
         about. so the wordmark is simply there, and the snap is the scale. */
      o: t >= END.wmIn ? 1 : 0,
      sc: +(1 + (1 - POP(wp)) * 0.085).toFixed(4),
      glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4),
    },
    g,
  };
}

/* ---------- the page ---------- */
function sceneHtml(plan) {
  const { dark } = brandTokens();
  const cells = which => WORDS[which]
    .map((w, i) => '<span class="cw" data-c="' + which + '" data-i="' + i + '">' + w.word.toUpperCase() + '</span>')
    .join('');
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post20</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500&display=swap">
<style>
/* the tokens are index.html's own dark block, lifted at run time by
   lib/captions.mjs. a caption cannot drift from the site if it never holds a
   colour of its own. */
:root{
${dark}
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  --body:"Space Grotesk",var(--mono);
  --display:"Michroma",var(--mono);
  /* the two channels the rgb split is drawn in: the same white the glow is,
     pulled apart, rather than a red and a cyan out of a filter preset. */
  --gr:rgba(255,120,120,.55); --gc:rgba(120,220,255,.55);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}

/* the vignette, and it is load bearing rather than decoration: with nothing at
   all animating chrome stops producing compositor frames and the screenshot call
   blocks on a frame that never comes. it is the one thing here allowed to be a
   css animation, because it is the one thing that does not have to hit a mark. */
.vignette{position:fixed;inset:-10%;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 78% 62% at 50% 46%,
    rgba(255,255,255,.030) 0%, rgba(255,255,255,.010) 46%, rgba(0,0,0,0) 72%);
  will-change:transform,opacity;
  animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{
  from{transform:scale(1) translate3d(0,0,0);opacity:.85}
  to{transform:scale(1.05) translate3d(0,-1.1%,0);opacity:1}
}

.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;
  transform:translate3d(calc(var(--sx,0) * 1px),calc(var(--sy,0) * 1px),0);
  will-change:transform}

${mascotCss(plan)}

/* the module places and draws him; this line is this clip's. the id beats the
   module's class selector, which is how a clip adds an opacity channel without
   editing the module. */
#m-zone{opacity:var(--m-o,0)}
.stage[data-gl="1"] #m-zone{
  filter:drop-shadow(calc(var(--split,0) * -1px) 0 var(--gr))
         drop-shadow(calc(var(--split,0) * 1px) 0 var(--gc))}

/* ---- the captions ----
   one container carrying the position of both blocks, so the knock down is one
   transform rather than two that can disagree. each block centres itself inside
   the frame and the container is what moves it. */
.cap{position:absolute;inset:0;z-index:4;pointer-events:none;
  transform:translate3d(calc(var(--cx,0) * 1px),calc(var(--cy,0) * 1px),0);
  will-change:transform}
.cbox{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  opacity:var(--o,0);will-change:opacity}
.cblk{width:${CAP.box.w}px;display:flex;flex-wrap:wrap;
  justify-content:center;gap:.14em ${CAP.gap}em;
  font-family:var(--display);font-weight:400;text-transform:uppercase;
  letter-spacing:0;line-height:${CAP.lh};
  transform:scale(var(--s,1));transform-origin:center center;will-change:transform}
/* michroma ships one weight and it is never faked here: no 700, no text stroke,
   no shadow. it reads heavy on its own, which is why it is the headline face. */
.cw{display:inline-block;color:var(--fg);transform-origin:center bottom;
  opacity:var(--wo,1);will-change:opacity,transform}
.stage[data-gl="1"] .cap{
  filter:drop-shadow(calc(var(--split,0) * -1px) 0 var(--gr))
         drop-shadow(calc(var(--split,0) * 1px) 0 var(--gc))}

/* the caret. the one accent in the clip, and it is the machine rather than a
   highlight: the words arrive in the ink and the green block is what is putting
   them there. it is placed off the box of the word it follows, measured once
   after the fit, because the words hold their places and so does it. */
.cur{position:absolute;left:0;top:0;display:block;
  background:var(--accent);opacity:var(--cur,0);
  box-shadow:0 0 8px rgba(53,255,106,.45),0 0 22px rgba(53,255,106,.22)}

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
  z-index:5}
.wm span{display:block}
.stage[data-gl="1"] .wm{
  text-shadow:0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),
    0 0 66px rgba(255,255,255,.10),
    calc(var(--split,0) * -1px) 0 var(--gr),calc(var(--split,0) * 1px) 0 var(--gc)}

/* ---- the tear ----
   a band of the frame, blacked out and redrawn shifted. only the wordmark is
   copied: the mascot is one dom subtree driven by ids out of its own module and
   there is no second copy of it that could be kept in sync. */
.tear{position:absolute;inset:0;z-index:6;overflow:hidden;background:var(--bg);
  clip-path:inset(var(--tt,0px) 0 calc(100% - var(--tt,0px) - var(--th,0px)) 0);
  opacity:var(--to,0)}
.tear-in{position:absolute;inset:0;transform:translate3d(calc(var(--tdx,0) * 1px),0,0)}

.noise{position:absolute;inset:-40px;z-index:7;pointer-events:none;
  mix-blend-mode:screen;opacity:var(--noise,0);
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.0' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23m)'/%3E%3C/svg%3E")}
.flash{position:absolute;left:50%;top:${CENTRE_Y}px;z-index:8;pointer-events:none;
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
${mascotMarkup(plan)}
  <div class="cap" id="cap">
    <div class="cbox" data-b="0"><div class="cblk">${cells('one')}</div></div>
    <div class="cbox" data-b="1"><div class="cblk">${cells('two')}</div></div>
    <i class="cur" id="cur" aria-hidden="true"></i>
  </div>
  <div class="wm" id="wm">${WM.lines.map(l => '<span>' + l + '</span>').join('')}</div>
${Array.from({ length: GL.bands }, (_, i) => '  <div class="tear" data-tear="' + i
    + '"><div class="tear-in"><div class="wm">'
    + WM.lines.map(l => '<span>' + l + '</span>').join('') + '</div></div></div>').join('\n')}
  <div class="noise" aria-hidden="true"></div>
  <div class="flash" aria-hidden="true"></div>
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
${mascotRuntime()}
window.__P20 = ${JSON.stringify({ WM, CAP, CUR, VW, VH, DSF, n1: WORDS.one.length })};
${scenePage.toString()}
scenePage();
document.fonts.load('400 1em "Michroma"')
  .then(() => document.fonts.ready)
  .then(() => {
    window.__p20.fit();
    window.__built = window.__mas.build();
  });
</script>
</body>
</html>`;
}

/* ---------- the page's own script ----------
   it writes numbers to elements and it decides nothing, exactly like the
   mascot's own page half. serialised in with .toString(), so it must not close
   over anything: everything it needs arrives on window.__P20. */
function scenePage() {
  const P = window.__P20;
  const stage = document.getElementById('stage');
  const cap = document.getElementById('cap');
  const cur = document.getElementById('cur');
  const boxes = [...document.querySelectorAll('.cbox')];
  const blks = boxes.map(b => b.querySelector('.cblk'));
  const cells = [[], []];
  document.querySelectorAll('.cw').forEach(el => {
    cells[el.dataset.c === 'one' ? 0 : 1][+el.dataset.i] = el;
  });
  const wms = [...document.querySelectorAll('.wm')];
  const tears = [...document.querySelectorAll('.tear')];
  const tearIns = tears.map(t => t.querySelector('.tear-in'));
  let caret = [];

  window.__p20 = {
    /* one size for both blocks, and it is the largest that fits the box: the
       tallest block inside the box's height, and no single word wider than the
       box, which is the only way a flex wrap can fail. the pop engine fits a
       card to one row and that is exactly what does not work with six and nine
       word lines, so this measures the wrapped block instead. */
    fit() {
      const box = P.CAP.box;
      let size = P.CAP.max;
      for (; size >= 12; size -= 0.5) {
        let ok = true;
        for (const b of blks) {
          b.style.fontSize = size + 'px';
          if (b.getBoundingClientRect().height > box.h) { ok = false; break; }
          for (const w of b.querySelectorAll('.cw')) {
            if (w.getBoundingClientRect().width > box.w) { ok = false; break; }
          }
          if (!ok) break;
        }
        if (ok) break;
      }
      for (const b of blks) b.style.fontSize = size.toFixed(2) + 'px';

      /* the caret's spot after every word, measured once. the words hold their
         places for the whole of the typing, so the list is fixed and the caret
         is a lookup rather than a measurement per frame. */
      caret = cells[0].map(el => {
        const r = el.getBoundingClientRect();
        return {
          x: +(r.right + size * P.CUR.gap).toFixed(2),
          y: +(r.top + r.height * (1 - P.CUR.h) / 2).toFixed(2),
        };
      });
      cur.style.width = (size * P.CUR.w).toFixed(2) + 'px';
      cur.style.height = (size * P.CUR.h).toFixed(2) + 'px';

      /* and the wordmark, fitted its own way: michroma is proportional and the
         tracking is nearly a fifth of an em, so the width of the widest line is
         a measurement rather than a ratio. every copy is fitted, the torn ones
         included, or a tear would show a wordmark at a different size. */
      const probe = wms[0];
      probe.style.fontSize = '100px';
      let widest = 0;
      for (const sp of probe.querySelectorAll('span')) {
        widest = Math.max(widest, sp.getBoundingClientRect().width);
      }
      const ws = 100 * P.WM.w / widest;
      for (const el of wms) el.style.fontSize = ws.toFixed(2) + 'px';
      return { cap: size, wm: ws };
    },

    /* what the two blocks actually measure, once, after the fit: the union of
       the drawn words rather than the flex row that holds them, because a full
       width row reports the box back and proves nothing about what is in it.
       the numbers are relative to the frame with the container at rest, so node
       adds the position it is about to be moved to. */
    measure() {
      const d = P.DSF;
      const cs = getComputedStyle(cells[0][0]);
      const cv = document.createElement('canvas').getContext('2d');
      cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      const m = cv.measureText('H');
      const inkOf = list => {
        let l = Infinity, r = -Infinity, t = Infinity, b = -Infinity;
        for (const el of list) {
          const q = el.getBoundingClientRect();
          l = Math.min(l, q.left); r = Math.max(r, q.right);
          t = Math.min(t, q.top); b = Math.max(b, q.bottom);
        }
        return { l: +l.toFixed(2), r: +r.toFixed(2), t: +t.toFixed(2), b: +b.toFixed(2) };
      };
      return {
        sizeCss: +parseFloat(cs.fontSize).toFixed(2),
        capPx: +((m.actualBoundingBoxAscent || 0) * d).toFixed(1),
        font: cv.font,
        one: inkOf(cells[0]), two: inkOf(cells[1]),
        lines: blks.map(b => +(b.getBoundingClientRect().height).toFixed(1)),
      };
    },

    measureWm() {
      const el = wms[0], r = el.getBoundingClientRect(), d = P.DSF;
      let widest = 0;
      for (const sp of el.querySelectorAll('span')) {
        widest = Math.max(widest, sp.getBoundingClientRect().width);
      }
      const cv = document.createElement('canvas').getContext('2d');
      const cs = getComputedStyle(el);
      cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      const m = cv.measureText('H');
      return {
        sizeCss: +parseFloat(cs.fontSize).toFixed(2),
        widestPx: +(widest * d).toFixed(1),
        capPx: +((m.actualBoundingBoxAscent || 0) * d).toFixed(1),
        left: +(r.left * d).toFixed(1), top: +(r.top * d).toFixed(1),
        right: +((P.VW - r.right) * d).toFixed(1), bottom: +((P.VH - r.bottom) * d).toFixed(1),
        font: cv.font,
      };
    },

    apply(o) {
      const s = stage.style;
      s.setProperty('--m-o', o.mo.toFixed(4));
      s.setProperty('--wm-o', o.wm.o.toFixed(4));
      s.setProperty('--wm-s', o.wm.sc.toFixed(4));
      s.setProperty('--wm-glow', o.wm.glow.toFixed(4));
      s.setProperty('--sx', o.g.sx.toFixed(2));
      s.setProperty('--sy', o.g.sy.toFixed(2));
      s.setProperty('--split', o.g.split.toFixed(2));
      s.setProperty('--noise', o.g.noise.toFixed(4));
      s.setProperty('--flash', o.g.flash.toFixed(4));
      /* the split is behind an attribute rather than a zero valued shadow: a
         shadow at offset 0 in full colour is a coloured halo, not "off". */
      if (o.g.split > 0.01) stage.setAttribute('data-gl', '1');
      else stage.removeAttribute('data-gl');

      const c = o.cap;
      cap.style.setProperty('--cx', c.cx.toFixed(3));
      cap.style.setProperty('--cy', c.cy.toFixed(3));
      boxes[0].style.setProperty('--o', c.oneO.toFixed(4));
      boxes[1].style.setProperty('--o', c.twoO.toFixed(4));
      blks[1].style.setProperty('--s', c.twoS.toFixed(4));
      for (let i = 0; i < cells[0].length; i++) {
        const w = c.one[i], el = cells[0][i];
        el.style.setProperty('--wo', w.o.toFixed(4));
        el.style.transform = 'scale(' + w.s.toFixed(4) + ')';
      }
      cur.style.setProperty('--cur', c.cur ? '1' : '0');
      const spot = caret[c.curAt];
      if (spot) { cur.style.left = spot.x + 'px'; cur.style.top = spot.y + 'px'; }

      for (let i = 0; i < tears.length; i++) {
        const band = o.g.bands[i];
        const st = tears[i].style;
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
async function render(plan, R, swap) {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  for (const d of [FRAMES, SUBS]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  fs.mkdirSync(OUT, { recursive: true });

  const N = Math.round(FPS * CUT.seconds);
  const { srv, port } = await serve(sceneHtml(plan));
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
  for (let i = 0; i < 200; i++) {
    const ok = await page.evaluate(() => !!(window.__mas && window.__mas.ready
      && window.__p20 && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  if (!await page.evaluate(() => !!(window.__mas && window.__mas.ready))) {
    throw new Error('the scene never became ready');
  }
  /* offline michroma falls back to the system mono and both the captions and the
     wordmark look almost right, which is the worst kind of wrong to judge type
     on. */
  if (!await page.evaluate(() => document.fonts.check('400 40px "Michroma"'))) {
    throw new Error('Michroma did not load — the captions would be judged in the mono fallback');
  }
  const built = await page.evaluate(() => window.__built);
  const cap = await page.evaluate(() => window.__p20.measure());
  const wm = await page.evaluate(() => window.__p20.measureWm());
  console.log('  built: head ' + built.headPx + 'px, ' + built.eyes + ' eyes, '
    + built.glows + ' glow layers, ' + (built.hands ? built.hands.gloves : 0) + ' glove layers, '
    + (built.hands ? built.hands.poses : 0) + ' poses a glove, theme ' + built.theme);
  console.log('  the captions: ' + cap.sizeCss + 'css px, caps ' + cap.capPx
    + ' device px, blocks ' + cap.lines.map(h => h + 'css').join(' and ') + ' tall');
  console.log('  the wordmark: ' + wm.sizeCss + 'css px, widest line ' + wm.widestPx
    + ' device px, caps ' + wm.capPx + ', clear ' + wm.left + ' left / ' + wm.top
    + ' top / ' + wm.right + ' right / ' + wm.bottom + ' bottom');

  /* the head, as ink, on every frame, with the fall and the smash composed on.
     the glow and the shadow are reported beside it rather than folded into it: a
     thirty px blur crossing a safe line is not ink crossing it.

     it is split at the landing on purpose. before it he is arriving from above
     the frame and crossing the top border is the entrance rather than a fault,
     so only the other three are asked about; from the landing on, all four. */
  let worstIn = null, worstAir = null;
  for (let f = 0; f < N; f++) {
    const t = f / FPS;
    if (t >= END.at) break;
    const r = headRect(plan, compose(plan, t, R));
    const landed = t >= LAND;
    const near = landed ? Math.min(r.left, r.top, r.right, r.bottom)
      : Math.min(r.left, r.right, r.bottom);
    const box = { t: +t.toFixed(3), near, ...r };
    if (landed) { if (!worstIn || near < worstIn.near) worstIn = box; }
    else if (t >= DROP.at && (!worstAir || near < worstAir.near)) worstAir = box;
  }

  const sigs = [];
  const wall = Date.now();

  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const mf = compose(plan, t, R);
      const o = frameAt(t, f, swap);
      await page.evaluate(fr => window.__mas.apply(fr), mf);
      await page.evaluate(fr => window.__p20.apply(fr), o);
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);

      if (k === 0) {
        /* the liveness signature: one number per output frame off everything
           this file wrote plus everything the module wrote, so two identical
           frames are a fact rather than a suspicion. */
        let s = o.mo * 7 + o.wm.o * 11 + o.wm.sc * 13 + o.wm.glow * 17
          + o.g.sx * 19 + o.g.sy * 23 + o.g.split * 29 + o.g.noise * 31 + o.g.flash * 37
          + o.g.bands.length * 41
          + o.cap.cx * 149 + o.cap.cy * 151 + o.cap.oneO * 157 + o.cap.twoO * 163
          + o.cap.twoS * 167 + o.cap.cur * 173 + o.cap.curAt * 179
          + mf.card.x * 43 + mf.card.y * 47 + mf.card.rot * 53
          + mf.card.sx * 59 + mf.card.sy * 61 + mf.glow * 67;
        for (let e = 0; e < 2; e++) {
          s += mf.eyes[e].x * (71 + e) + mf.eyes[e].y * (79 + e)
            + mf.eyes[e].sx * (83 + e) + mf.eyes[e].sy * (89 + e) + mf.eyes[e].lid * (97 + e);
          s += mf.brows[e].o * (101 + e) + mf.brows[e].y * (103 + e);
        }
        for (let i = 0; i < o.cap.one.length; i++) s += o.cap.one[i].o * (181 + i) + o.cap.one[i].s * (191 + i);
        if (mf.hands) for (const h of mf.hands.list) s += h.o * 107 + h.x * 109 + h.y * 113 + h.rot * 127 + h.sx * 131;
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
     a video. the time asked for is rounded to a frame and the frame's own instant
     is what gets drawn, so the glitch, which is a function of the frame index,
     and everything else, which is a function of time, cannot disagree about which
     moment this is. */
  fs.rmSync(VERIFY, { recursive: true, force: true });
  fs.mkdirSync(VERIFY, { recursive: true });
  const stills = [
    [WORDS.one[2].start + 0.10, 'a-typing'],
    [TYPED_LAST + 0.24, 'b-typed-and-blinking'],
    [SNAP.at + SNAP.for + 0.04, 'c-knocked-down'],
    [DROP.at + DROP.for * 0.62, 'd-falling'],
    [LAND + SMASH.flat * 0.6, 'e-the-landing'],
    [CUT.marks[0].t + 0.44, 'f-the-point'],
    [CUT.marks[0].t + 1.00, 'g-the-second-jab'],
    [CUT.marks[1].t + 0.72, 'h-the-laugh-lands'],
    [CUT.marks[1].t + 1.21, 'i-the-giggle'],
    [swap + 0.30, 'j-the-punchline'],
    [GL_WINDOWS[1].t0, 'k-the-second-stutter'],
    [GL_WINDOWS[2].t0, 'l-the-hit'],
    [END.at + END.hard + END.tail + 0.16, 'm-the-wordmark'],
    [CUT.seconds - 0.06, 'n-the-last-frame'],
  ];
  for (const [want, name] of stills) {
    const f = Math.min(N - 1, Math.round(want * FPS));
    const t = f / FPS;
    await page.evaluate(fr => window.__mas.apply(fr), compose(plan, t, R));
    await page.evaluate(fr => window.__p20.apply(fr), frameAt(t, f, swap));
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
    });
    fs.writeFileSync(path.join(VERIFY, name + '.png'), Buffer.from(shot.data, 'base64'));
  }

  console.log('  head once he has landed, worst frame at ' + worstIn.t + 's: '
    + worstIn.left + ' left, ' + worstIn.top + ' top, ' + worstIn.right + ' right, '
    + worstIn.bottom + ' bottom (floor ' + Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom) + ')');
  console.log('  and in the air, worst at ' + worstAir.t + 's: ' + worstAir.left
    + ' left, ' + worstAir.right + ' right, ' + worstAir.bottom + ' bottom, top '
    + worstAir.top + ' (he is entering through it)');
  console.log('  the glow reaches ' + worstIn.glowReach + 'px past the ink');

  await browser.close();
  srv.close();

  if (SUB > 1) blend(N);

  const state = { built, cap, wm, head: worstIn, air: worstAir, sigs, frames: N };
  fs.writeFileSync(path.join(OUT, 'post20.json'), JSON.stringify(state, null, 2));
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
  const out = path.join(OUT, 'post20-dark-1080x1920.mp4');
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

/* ---------- go ---------- */

const plan = planMascot({
  seconds: CUT.seconds,
  hands: true,
  size: SIZE,
  theme: 'dark',
  /* dead straight on, and it is a rendered frame's correction. `pos` defaults to
     `bottom-left` and the module derives `TURN.bias` 0.35 from it, which is the
     right answer for a mascot standing in a corner looking into the frame and
     the wrong one for a mascot centred and pointing at the camera: it turned his
     face 0.35 toward the same side the finger already goes, so the whole
     composition leaned out of the frame together. an explicit bias is the
     module's own documented way of saying it. */
  bias: 0,
  marks: CUT.marks,
});

/* centred, in the middle of the safe band. see the note on CENTRE_Y. */
const halfBox = (GRID / 2) * plan.unit;
plan.box.left = +(VW / 2 - halfBox).toFixed(2);
plan.box.top = +(CENTRE_Y - halfBox).toFixed(2);

/* the plate's own radius in css px, which is what the ground compensation is
   measured in. off the module's geometry rather than off `size`, because the
   plate is 60 of the 64 grid and the four units are the margin the face is drawn
   inside. */
const R = +(HEAD.plate.s / 2 * plan.unit).toFixed(3);

/* when the laugh stops and the punchline arrives. it is the module's own
   `leaving` for that pose rather than a number typed beside it: the laugh's hold
   was bought and a punchline placed against a hold somebody later changes is a
   punchline that lands on a hand still over a mouth. */
const SWAP = plan.marks[1].hands.leaving;

const rep = mascotMotion(plan, FPS, CUT.seconds);
const rep60 = FPS === 60 ? rep : mascotMotion(plan, 60, CUT.seconds);

console.log(describeMascot(plan));
console.log(describeMotion(rep));

/* ---------- the cues ----------
   nothing in this list is a number typed to taste. the keys are the typed words'
   own moments, the two thuds are the two landings, the titters come out of the
   module because they are the pose's, the punchline pop is the swap, and the
   glitch is the cut. */
const cues = [
  ...WORDS.one.map(w => ({ t: w.start, kind: 'key', from: 'the word "' + w.word + '" arriving' })),
  { t: +(SNAP.at + SNAP.for).toFixed(4), kind: 'popDeep', from: 'the caption landing on its line' },
  /* his landing is the same gesture lower and longer, which is a heavier thing
     being set down rather than a second sound. */
  { t: LAND, kind: 'popDeep', opts: { f0: 78, f1: 42, tau: 0.13, len: 0.32 },
    from: 'the mascot hitting his mark' },
  ...mascotCues(plan),
  { t: SWAP, kind: 'pop', from: 'the punchline card' },
  { t: END.at, kind: 'glitch', from: 'the cut' },
];
/* the key is lifted eight decibels. -34 was set for a run of ticks under a read
   and there is no read here, so at the table's own level the typing would be
   silent on a phone. the recipe is untouched and the table is not edited: the
   override is this clip's, per render, which is what `gains` is for. */
const { buf: sfx, report: sfxReport } = renderSfx(cues, CUT.seconds, { gains: { key: -26 } });

/* the two stutters before the hit: the same recipe, shorter and crushed harder
   each time, and quieter than the hit by a long way. one bus, three calls. */
const PRE_DB = [-32, -27];
for (let i = 0; i < END.pre.length; i++) {
  const w = GL_WINDOWS[i];
  const one = renderSfx([{
    t: w.t0, kind: 'glitch',
    opts: { len: 0.05 + i * 0.014, burst: 0.004, crush: 3800 - i * 600, f0: 210 + i * 20, f1: 120, seed: w.seed },
    from: 'stutter ' + (i + 1) + ' of two, into the hit',
  }], CUT.seconds, { gains: { glitch: PRE_DB[i] } });
  for (let j = 0; j < sfx.length; j++) sfx[j] += one.buf[j];
  sfxReport.push(...one.report);
}
sfxReport.sort((a, b) => a.t - b.t);

const WAV = path.join(OUT, 'post20-sfx.wav');
const RAW = path.join(OUT, 'post20-sfx-raw.wav');
fs.mkdirSync(OUT, { recursive: true });
writeWav(RAW, sfx);
const before = loudness(ffmpeg, RAW);
let rawPeak = 0;
for (let i = 0; i < sfx.length; i++) rawPeak = Math.max(rawPeak, Math.abs(sfx[i]));
const rawPeakDb = 20 * Math.log10(rawPeak);
const wanted = before.lufs == null ? 0 : +(TARGET_LUFS - before.lufs).toFixed(2);
const allowed = +(SAMPLE_CEILING - rawPeakDb + LIMIT_ALLOW).toFixed(2);
const lift = Math.min(wanted, allowed);
applyGain(sfx, lift);
const peak = limit(sfx, SAMPLE_CEILING);
writeWav(WAV, sfx);
const after = loudness(ffmpeg, WAV);
fs.rmSync(RAW, { force: true });

/* ---------- the beats, printed ---------- */
const SILENCE = +(CUT.marks[0].t - LAND).toFixed(3);
console.log('\n  the beats');
console.log('    0.00s  black. the card is on the frame and empty');
console.log('    ' + TYPE.from.toFixed(2) + 's  the line types itself, '
  + WORDS.one.length + ' words ' + TYPE.step.toFixed(2) + 's apart, a key tick on each');
console.log('    ' + TYPED_LAST.toFixed(2) + 's  the last word lands and the caret blinks after it for '
  + (SNAP.at - TYPED_LAST).toFixed(2) + 's');
console.log('    ' + SNAP.at.toFixed(2) + 's  it is knocked down to the caption line over '
  + SNAP.for.toFixed(2) + 's, lands ' + (SNAP.at + SNAP.for).toFixed(2)
  + ' with a ' + SNAP.bounce + 'px bounce and a thud');
console.log('    ' + DROP.at.toFixed(2) + 's  he falls ' + DROP.from + 'px over '
  + DROP.for.toFixed(2) + 's and lands at ' + LAND.toFixed(2) + ', soft squash');
console.log('    ' + LAND.toFixed(2) + 's  a beat of nothing, ' + SILENCE.toFixed(2)
  + 's of it, and the only thing moving is the idle layer');
for (const m of plan.marks) {
  const h = m.hands;
  console.log('    ' + m.t.toFixed(2) + 's  ' + h.pose.padEnd(13)
    + 'entrance ' + h.entry.toFixed(2) + ', settles ' + h.settled.toFixed(2)
    + ', holds to ' + h.leaving.toFixed(2)
    + (h.next ? ', straight into ' + h.next : ', home by ' + h.out.toFixed(2)));
}
console.log('    ' + SWAP.toFixed(2) + 's  the laugh stops, the hands go home and the punchline pops');
for (const w of GL_WINDOWS.filter(x => x.pre != null)) {
  console.log('    ' + w.t0.toFixed(2) + 's  stutter ' + (w.pre + 1) + ' of two, '
    + w.frames + ' frame' + (w.frames === 1 ? '' : 's') + ' at ' + (w.force * 100).toFixed(0) + '% heat');
}
console.log('    ' + END.at.toFixed(2) + 's  the hit, ' + (END.hard + END.tail).toFixed(2)
  + 's of it. he and both captions are cut and the wordmark is born on that frame');
console.log('    ' + CUT.seconds.toFixed(2) + 's  end, after '
  + (CUT.seconds - END.wmIn - END.wmFor).toFixed(2) + 's of the end card holding');

console.log('\n  the sound');
for (const r of sfxReport) {
  console.log('    ' + r.t.toFixed(2) + 's  ' + r.kind.padEnd(8) + r.seconds.toFixed(3)
    + 's  ' + String(r.gain).padStart(4) + ' dB  peak ' + String(r.peak).padStart(6) + '  ' + r.from);
}
console.log('    the bus came off the synth at ' + (before.lufs == null ? '?' : before.lufs)
  + ' LUFS with its peak at ' + rawPeakDb.toFixed(1) + ' dBFS');
console.log('    ' + TARGET_LUFS + ' LUFS wanted ' + wanted.toFixed(2) + ' dB and the '
  + SAMPLE_CEILING + ' dBFS ceiling plus ' + LIMIT_ALLOW + ' dB of limiting allowed ' + allowed.toFixed(2)
  + (allowed < wanted ? ', so the ceiling won by ' + (wanted - allowed).toFixed(2) + ' dB' : ''));
console.log('    lifted ' + lift.toFixed(2) + ' dB to ' + (after.lufs == null ? '?' : after.lufs)
  + ' LUFS, peak ' + peak.peak + ' dBFS, limiter took '
  + (peak.reduction > 0.01 ? peak.reduction.toFixed(2) + ' dB' : 'nothing'));

/* ---------- the two fast things, measured before anything renders ----------
   the fall and the knock down are the only moves in this file that could outrun
   the shutter, so both are walked at sixty and reported in the unit the argument
   is had in. */
const fastest = (fn, a, b) => {
  let d = 0, at = a;
  for (let f = Math.floor(a * 60); f <= Math.ceil(b * 60); f++) {
    const s = Math.abs(fn((f + 1) / 60) - fn(f / 60));
    if (s > d) { d = s; at = f / 60; }
  }
  return { d: +d.toFixed(2), at: +at.toFixed(3) };
};
const fallStep = fastest(fallAt, DROP.at - 0.05, LAND + 0.05);
const snapStep = fastest(t => capAt(t, SWAP).cy, SNAP.at - 0.05, SNAP.at + SNAP.for + SNAP.bounceFor);
console.log('\n  the two fast things, at sixty');
console.log('    the fall peaks at ' + fallStep.d + ' css px a frame at ' + fallStep.at
  + 's, which is ' + (fallStep.d * DSF / SUB).toFixed(1) + ' device px between samples at '
  + SUB + ' subframe' + (SUB === 1 ? '' : 's') + ' (ceiling ' + STEP_CEIL + ' css px)');
console.log('    the knock down peaks at ' + snapStep.d + ' css px a frame at ' + snapStep.at + 's');

const state = ONLY_ENCODE
  ? JSON.parse(fs.readFileSync(path.join(OUT, 'post20.json'), 'utf8'))
  : await render(plan, R, SWAP);
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
if (Math.abs(p.seconds - CUT.seconds) > 0.25) fail.push(p.seconds + 's, wanted ' + CUT.seconds);
if (!p.audio) fail.push('no audio track — the sounds did not mux');

/* ---------- him ---------- */
if (state.built.headPx < HEAD_PX.min || state.built.headPx > HEAD_PX.max) {
  fail.push('the head rendered at ' + state.built.headPx + 'px, window is ' + HEAD_PX.min + ' to ' + HEAD_PX.max);
}
if (state.built.headPx <= 240) {
  fail.push('the head is ' + state.built.headPx + 'px, which is not larger than his corner size of 240');
}
if (state.head.near < floor - 0.5) {
  fail.push('the head comes within ' + Math.round(state.head.near) + 'px of a border at '
    + state.head.t + 's, floor is ' + floor);
}
for (const k of ['left', 'right', 'bottom']) {
  if (state.air[k] < floor - 0.5) {
    fail.push('while he is falling the head comes within ' + Math.round(state.air[k]) + 'px of the ' + k + ' border');
  }
}
const offX = +(Math.abs(plan.box.left + halfBox - VW / 2) * DSF).toFixed(2);
if (offX > 1) fail.push('his box is ' + offX + 'px off centre horizontally');

/* ---------- the hands, which is what this clip is for ----------
   two poses, both reaching their own marks, both with a wind up and an overshoot
   on the front and back of the arrival, and neither of them moving a hand faster
   than the module's own ceiling. every one of those is the module's measurement
   rather than this file's opinion. */
if (rep60.poses.length !== 2) fail.push('the report has ' + rep60.poses.length + ' poses in it, wanted two');
for (const q of rep60.poses) {
  if (q.entryFrames == null) fail.push(q.pose + ' never reached its own mark');
  else if (q.entryFrames < 3) fail.push(q.pose + ' arrives in ' + q.entryFrames + ' frames, which is a cut');
  if (q.antiFrames < 2) fail.push(q.pose + ' has no anticipation, only ' + q.antiFrames + ' frames back');
  if (!(q.overshoot > 1)) fail.push(q.pose + ' arrives with no overshoot, which is a hard stop');
}
if (rep60.worst.hands && rep60.worst.hands.d > HANDS.stepCeil) {
  fail.push('a hand moves ' + rep60.worst.hands.d.toFixed(2) + ' css px between two frames at 60, ceiling is ' + HANDS.stepCeil);
}
/* the chain is a chain: no exit on the first pose, the second one named as its
   successor, and the second one knowing where it came from. */
{
  const a = plan.marks[0].hands, b = plan.marks[1].hands;
  if (a.pose !== 'point-viewer' || b.pose !== 'laugh') fail.push('the two poses are not point-viewer into laugh');
  if (a.next !== 'laugh' || a.exit !== 0) fail.push('the point does not chain into the laugh');
  if (b.from !== 'point-viewer') fail.push('the laugh does not know it came off the point');
  if (a.out !== b.at && Math.abs(a.out - CUT.marks[1].t) > 1e-6) {
    fail.push('the point stops at ' + a.out + 's rather than on the laugh\'s own mark');
  }
}
/* no unimpressed and no angry face anywhere: the brief bans both and the states
   are in the plan, so it is asserted rather than remembered. */
for (const m of plan.marks) {
  if (m.state !== 'neutral') fail.push('mark at ' + m.t + 's is ' + m.state + ', and this clip holds one face');
}
/* the laugh's three bleeps, on the picture rather than on a grid: they come out
   of the module, so what is checked here is that all three are inside the pose's
   own window and none of them lands after it has stopped. */
{
  const t = mascotCues(plan).filter(c => c.kind === 'titter');
  const h = plan.marks[1].hands;
  if (t.length !== 3) fail.push('the laugh made ' + t.length + ' bleeps, wanted three');
  for (const c of t) {
    if (c.t < h.settled - 0.10 || c.t > h.leaving) {
      fail.push('a titter at ' + c.t + 's is outside the laugh\'s own ' + h.settled + ' to ' + h.leaving);
    }
  }
}

/* the face, off the module's own preflight at sixty. */
for (const st of rep60.states) {
  if (st.entryFrames == null) fail.push(st.state + ' never reached its own mark');
  if (!(st.overshoot > 1)) fail.push(st.state + ' arrives with no overshoot');
}
if (rep60.outside.units > 0) {
  fail.push('feature ink lands ' + rep60.outside.units.toFixed(2) + ' units outside the head silhouette');
}
if (rep60.blinks.repeatsInARow) fail.push(rep60.blinks.repeatsInARow + ' blinks repeat the one before them');
if (rep60.frozenFrames) fail.push(rep60.frozenFrames + ' frames where the face is not moving at all');
if (rep60.maxSquash > 0.08 + 1e-6) fail.push('the module\'s squash reached ' + (rep60.maxSquash * 100).toFixed(1) + '%');
if (rep60.maxBreathe >= 0.02) fail.push('breathing reached ' + (rep60.maxBreathe * 100).toFixed(2) + '%');

/* ---------- the fall and the landing ----------
   the compression is this file's channel rather than the module's, so it has its
   own ceiling and its own shape check: it goes exactly as deep as the table says,
   it stretches on the way down, it crosses zero once on the way out, and it is
   gone before the point is. */
{
  if (fallStep.d > STEP_CEIL) {
    fail.push('the fall moves ' + fallStep.d + ' css px on one frame at 60, ceiling is ' + STEP_CEIL);
  }
  if (snapStep.d > STEP_CEIL) {
    fail.push('the knock down moves ' + snapStep.d + ' css px on one frame at 60, ceiling is ' + STEP_CEIL);
  }
  if (Math.abs(fallAt(LAND)) > 1e-9 || !(fallAt(LAND - 0.002) < 0)) {
    fail.push('the fall does not arrive at nought on its landing frame');
  }
  let deep = 0, air = 0, dips = 0, below = false;
  for (let i = 0; i <= 900; i++) {
    const t = DROP.at + (LAND + SMASH.flat + SMASH.back + 0.05 - DROP.at) * i / 900;
    const v = squashAt(t);
    deep = Math.max(deep, v); air = Math.min(air, v);
    /* one stretch on the way back out, counted as one run below zero rather than
       as two zero crossings: a run has two of those and the shape wanted is the
       run. only after the flat, because the flat itself legitimately carries the
       air stretch back through zero into the compression. */
    if (t > LAND + SMASH.flat) {
      if (v < 0 && !below) { dips++; below = true; }
      if (v >= 0) below = false;
    }
  }
  if (Math.abs(deep - SMASH.k) > 0.005) fail.push('the compression reached ' + deep.toFixed(3) + ', wanted ' + SMASH.k);
  if (Math.abs(air + SMASH.air) > 0.003) fail.push('he does not stretch on the way down');
  if (dips !== 1) fail.push('the spring out of the landing stretches ' + dips + ' times, wanted one');
  if (Math.abs(squashAt(LAND + SMASH.flat + SMASH.back + 0.02)) > 1e-9) {
    fail.push('the landing is still springing when it should be over');
  }
  if (LAND + SMASH.flat + SMASH.back > CUT.marks[0].t + 1e-6) {
    fail.push('the landing is still going when the point starts');
  }
  if (SILENCE < 0.20) fail.push('the beat between the landing and the point is only ' + SILENCE.toFixed(2) + 's');
}

/* ---------- the captions ----------
   the same four questions the wordmark answers, asked at both of the positions
   the block is drawn at rather than at one, plus two of their own: is the type
   big enough to read on a phone, and does the lower block clear him.

   the ink is measured in the page with the container at rest and this adds the
   offsets it is about to be moved by, which is exact rather than approximate:
   the container's transform is a translation and the block's own scale is a
   number this file wrote. */
{
  const c = state.cap;
  if (!/Michroma/.test(c.font)) fail.push('the captions are not set in michroma: ' + c.font);
  if (c.capPx < CAP.minCapPx) {
    fail.push('the caption caps measure ' + c.capPx + ' device px, floor is ' + CAP.minCapPx);
  }
  if (c.sizeCss > CAP.max + 1e-6) fail.push('the captions fitted to ' + c.sizeCss + 'css px, over the ' + CAP.max + ' cap');
  /* the setup while it types: the container is at rest, so the ink is where it
     was measured. and after the knock down, at the bottom of the bounce, which
     is the lowest it ever gets. */
  const cyRest = CAP.mid - VH / 2;
  const cyLow = CAP.line - VH / 2 + SNAP.bounce;
  const cyLine = CAP.line - VH / 2;
  const at = (ink, dx, dy, grow = 0) => ({
    left: +((ink.l + dx - grow) * DSF).toFixed(1),
    right: +((VW - ink.r - dx - grow) * DSF).toFixed(1),
    top: +((ink.t + dy - grow) * DSF).toFixed(1),
    bottom: +((VH - ink.b - dy - grow) * DSF).toFixed(1),
  });
  /* the punchline springs about its own centre and the site's own curve
     overshoots by a shade over a tenth of the way from 0.86 to 1, so its ink is
     briefly 1.9% wider than it is at rest. the box grows by that much rather
     than being measured at rest and hoped for. */
  const over = +((POP(0.36) - 1) * (1 - 0.86)).toFixed(4);
  const grow2 = Math.max(0, (c.two.r - c.two.l) / 2 * over);
  const spots = [
    ['the setup while it types', at(c.one, 0, cyRest)],
    ['the setup on its line', at(c.one, CAP.dx, cyLow)],
    ['the punchline', at(c.two, CAP.dx, cyLine, grow2)],
  ];
  for (const [what, box] of spots) {
    for (const k of ['left', 'top', 'right', 'bottom']) {
      if (box[k] < floor - 0.5) {
        fail.push(what + ' comes within ' + Math.round(box[k]) + 'px of the ' + k + ' border');
      }
    }
  }
  /* and it does not collide with him. the head's own rect already holds the
     gloves, so this is the whole of "nothing collides" rather than half of it:
     the worst case is the lowest the ink ever reaches over the frames the lower
     block is up for, against the top of that block at the top of its bounce. */
  let lowest = 0, at2 = 0;
  for (let f = 0; f < Math.round(END.at * 60); f++) {
    const t = f / 60;
    if (t < LAND) continue;
    const r = headRect(plan, compose(plan, t, R));
    const bottom = VH - r.bottom / DSF;
    if (bottom > lowest) { lowest = bottom; at2 = +t.toFixed(2); }
  }
  const capTop = Math.min(c.one.t + cyLine, c.two.t + cyLine - grow2);
  console.log('  he reaches ' + (lowest * DSF).toFixed(0) + 'px down at ' + at2
    + 's and the caption block starts at ' + (capTop * DSF).toFixed(0)
    + 'px, a gap of ' + ((capTop - lowest) * DSF).toFixed(0) + ' device px');
  if (capTop <= lowest) {
    fail.push('the caption block overlaps him: he reaches ' + lowest.toFixed(1)
      + 'css px at ' + at2 + 's and the block starts at ' + capTop.toFixed(1));
  }
  /* the caption sits on the side the finger points, which is screen right: the
     pose is not mirrored and the acting hand is the screen right one. */
  if (CAP.dx <= 0) fail.push('the caption is not shifted onto the side the finger points');
  if (plan.marks[0].hands.acting[0] !== 1) {
    fail.push('the point is acted by the screen left hand and the caption is shifted right');
  }
}

/* ---------- the typing ----------
   six words, in order, all of them typed before the block is knocked down, and a
   key on every one of them. */
{
  for (let i = 1; i < WORDS.one.length; i++) {
    if (!(WORDS.one[i].start > WORDS.one[i - 1].start)) fail.push('the typed words are not in order');
  }
  if (TYPED_LAST + TYPE.wordFor > SNAP.at) {
    fail.push('the last word is still springing when the block is knocked down');
  }
  /* and frame zero is not an empty frame. the whole of item one from the review
     is this assertion: something is drawn on the thumbnail. */
  {
    const c = capAt(0, SWAP);
    if (!(c.one[0].o > 0.99)) fail.push('the first word is at ' + c.one[0].o + ' on frame zero');
    if (!c.cur) fail.push('the caret is not on frame zero');
  }
  const keys = sfxReport.filter(r => r.kind === 'key');
  if (keys.length !== WORDS.one.length) {
    fail.push('there are ' + keys.length + ' key ticks for ' + WORDS.one.length + ' words');
  }
  /* the caret is on for the whole of the typing and off the moment the block
     moves, and it blinks: on some frames and off on others. */
  let on = 0, off = 0;
  for (let f = 0; f < Math.round(SNAP.at * 60); f++) {
    if (capAt(f / 60, SWAP).cur) on++; else off++;
  }
  if (!on || !off) fail.push('the caret does not blink: ' + on + ' frames on, ' + off + ' off');
  if (capAt(SNAP.at + 0.02, SWAP).cur) fail.push('the caret is still on after the block has been knocked down');
  /* one card at a time, which is the caption engine's own rule: the setup is
     gone before the punchline is anywhere. */
  for (let f = 0; f < Math.round(CUT.seconds * 60); f++) {
    const c = capAt(f / 60, SWAP);
    if (c.oneO > 0.01 && c.twoO > 0.01) {
      fail.push('both captions are on screen at ' + (f / 60).toFixed(2) + 's');
      break;
    }
  }
}

/* every cue is inside the clip and none of them was cut off by the end of it. */
for (const r of sfxReport) {
  if (r.cut) fail.push('the ' + r.kind + ' cue at ' + r.t + 's was cut off by the end of the clip');
  if (r.t < 0 || r.t > CUT.seconds) fail.push('the ' + r.kind + ' cue at ' + r.t + 's is outside the clip');
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
  /* no domain on the end card, which is post14's decision and it stays. */
  if (WM.lines.join(' ').toLowerCase().includes('.com')) fail.push('the end card carries an address');
}

/* ---------- the cut, as three assertions about frameAt ---------- */
{
  const cutF = Math.round(END.at * FPS);
  const first = frameAt(0, 0, SWAP);
  const just = frameAt((cutF - 1) / FPS, cutF - 1, SWAP);
  const on = frameAt(cutF / FPS, cutF, SWAP);
  if (first.mo !== 0) fail.push('he is on the frame before he has started falling');
  if (frameAt(DROP.at, Math.round(DROP.at * FPS), SWAP).mo !== 1) fail.push('he is not on when the fall starts');
  if (!(just.cap.twoO > 0.9) || just.mo !== 1) fail.push('he or the punchline is already gone before the hit');
  if (on.mo !== 0 || on.cap.twoO !== 0) fail.push('he or the punchline is still on the frame the wordmark arrives on');
  if (!(on.wm.o > 0)) fail.push('the wordmark is not born on the hit frame');
}

/* ---------- the fault ---------- */
{
  const count = (fps, windows) => {
    const N = Math.round(fps * CUT.seconds);
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
  const { N, on, lastOn, flashes, per: perWindow } = here;
  console.log('  the fault: ' + on + ' of ' + N + ' frames (' + (on / N * 100).toFixed(1) + '%), '
    + perWindow.map((c, i) => (GL_WINDOWS[i].pre != null ? 'stutter' + (GL_WINDOWS[i].pre + 1) : 'hit') + ' ' + c).join(', ')
    + ', ' + flashes + ' white frame');
  if (!on) fail.push('nothing glitches on any frame');
  /* post12's named exception: the ceiling on how much of a clip may be glitching
     is 30% and it is read against **the ending the fault lives in** rather than
     against the file, because a fault in the last second and a half of eight is
     under a twentieth of the clip either way and the number worth defending is
     the local one. */
  const endFrom = Math.round(GL_WINDOWS_60[0].t0 * 60);
  const endFrames = at60.N - endFrom;
  const localDuty = at60.on / endFrames;
  console.log('    and against the ending it lives in, at sixty: ' + at60.on + ' of ' + endFrames
    + ' frames from ' + GL_WINDOWS_60[0].t0.toFixed(2) + 's (' + (localDuty * 100).toFixed(1) + '%, ceiling 30%)');
  if (localDuty > 0.30) {
    fail.push('the ending glitches on ' + (localDuty * 100).toFixed(1) + '% of its own frames, over the 30% ceiling');
  }
  for (let i = 0; i < GL_WINDOWS.length; i++) {
    if (!perWindow[i]) fail.push('glitch window ' + i + ' at ' + GL_WINDOWS[i].t0.toFixed(2) + 's fired on no frames at ' + FPS + 'fps');
    if (!at60.per[i]) fail.push('glitch window ' + i + ' fired on no frames at 60fps');
  }
  if (flashes !== 1) fail.push(flashes + ' white frames, and there may be exactly one');
  const cleanFrom = Math.round((END.at + END.hard + END.tail + END.clean) * FPS);
  if (lastOn >= cleanFrom) fail.push('the fault is still firing at frame ' + lastOn + ', past the clean line at ' + cleanFrom);
  for (let i = 1; i < GL_WINDOWS.length; i++) {
    if (GL_WINDOWS[i].t0 < GL_WINDOWS[i - 1].t1 - 1e-9) fail.push('glitch windows ' + (i - 1) + ' and ' + i + ' overlap');
  }
  for (let i = 1; i < END.pre.length; i++) {
    if (!(END.pre[i].force > END.pre[i - 1].force)) fail.push('stutter ' + (i + 1) + ' is not louder than the one before it');
  }
  /* the end card: short, as the brief asks, and long enough to be read. */
  const hold = CUT.seconds - (END.wmIn + END.wmFor);
  if (hold < 0.85) fail.push('the wordmark holds ' + hold.toFixed(2) + 's, which is not long enough to be read');
  const clean = CUT.seconds - (END.at + END.hard + END.tail + END.clean);
  if (clean < 0.50) fail.push('the wordmark is only clean for ' + clean.toFixed(2) + 's');
}

/* ---------- the mix, on the finished file rather than on the intent ---------- */
if (lu && lu.ok) {
  if (lu.truePeak > PEAK_CEILING) fail.push('the true peak is ' + lu.truePeak + ' dBFS, over the ' + PEAK_CEILING + ' ceiling');
  if (lu.lufs < MIN_LUFS) fail.push('the file measures ' + lu.lufs + ' LUFS, under the ' + MIN_LUFS + ' floor');
  if (lu.lufs > TARGET_LUFS + 0.5) fail.push('the file measures ' + lu.lufs + ' LUFS, over the ' + TARGET_LUFS + ' target');
} else fail.push('ebur128 said nothing about the finished file');
if (peak.reduction > MAX_REDUCTION) {
  fail.push('the limiter took ' + peak.reduction.toFixed(2) + ' dB, over the ' + LIMIT_ALLOW + ' dB this clip allows it');
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

/* the copy, on the strings that actually reach the screen. `checkCopy` already
   threw on a dash at plan time; this is the other half of the house rule and it
   is asserted rather than remembered. */
for (const [k, v] of Object.entries(COPY)) {
  if (v !== v.toLowerCase()) fail.push('the ' + k + ' line is not lower case in the source: "' + v + '"');
  if (/[!]/.test(v)) fail.push('the ' + k + ' line carries an exclamation mark');
}

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
