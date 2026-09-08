/* the boring tek — post22.

   dark only, 1080x1920. somebody types a question into a chat box while a voice
   reads it, the box is knocked down to the lower third, and he falls into the
   space it left with the lights on behind his eyes.

     0.0  a chat input box in the middle of a black frame. the line types itself
          in, letter by letter, cut to the read. **no key ticks** — the voice is
          the sound of the typing.
     ~3.5 the caret blinks off and the box slides down to its line and settles.
     ~3.7 he falls in from above and lands, green eyed, on a glitch hit, with
          three rgb stutters after it.
     ~4.2 he holds. the green breathes. the question is still on screen under him
          and **nothing is said**, because the answer is a line to be added later.
     6.32 a thought pops off his crown: AI LL BE BACK.
     8.00 the fault, and the wordmark.

     node post22.mjs                     1080x1920, 60fps, shutter closed
     DEMO_FPS=12 node post22.mjs         the fast preview pass
     node post22.mjs --voice             the read and the clock only, no browser
     node post22.mjs --blur=6            60fps with the shutter open, which the
                                         fall wants
     node post22.mjs --keep-frames       leave the jpegs on disk
     node post22.mjs --encode-only       re-encode from kept frames

   one output, one path, overwritten every run:

     demo/out/post22-dark-1080x1920.mp4

   ---------- what is borrowed and from where ----------

   **the knock down, the fall and the smash are post20's, at post20's numbers.**
   they are not re-derived and they are not re-tuned: `SNAP`, `DROP` and `SMASH`
   below are that file's tables, `fallAt` and `squashAt` are that file's two
   functions, and the only thing this clip changes is how far the box travels,
   because a 190px box going to a line is not a 268px caption block going to a
   different one. the curves, the bounce, the stretch on the way down, the flat
   and the damped cosine out of it are all that clip's.

   **the read is post20's spine as well.** the picture is cut to the voice rather
   than beside it: every character is placed inside its own spoken word's window,
   the caret blinks off a beat after the last word, the box goes down a beat
   after that and he starts falling a beat after that. a slower reading moves the
   whole first half and nothing here has to be retyped.

   **the end of the clock is not derived.** the bubble and the fault are pinned —
   6.32 and 8.00, and the mascot's second mark at 5.74 that places the bubble —
   because they were signed off on the last cut and this round was not allowed to
   move them. so the read has a ceiling rather than a free run, and there is a
   guard on it: if the take comes back long enough to push the landing past the
   room the hold beat needs, the run fails and prints by how much.

   the mascot is `lib/mascot.mjs` and nothing here reaches inside it. two marks,
   both `neutral`, and the module's own thought bubble.

   ---------- the green, and the one thing that is not painted ----------

   the eyes are **index.html's own dark `--accent`**, #35ff6a, which is the only
   accent the brand has. it is on the iris and on a tight glow that sits over each
   eye and nowhere else.

   **there is no coloured light on him.** the halo round his head is the module's
   own white glow, which is what every other clip on the dark theme draws and is
   already on — this file adds nothing to it and takes nothing off it. the red
   bloom the first cut painted round the plate is gone, and so is every other red
   in the film.

   ---------- the sound ----------

   the read, the impact and the bubble. that is all of it.

     the voice is edge's Andrew, this house's `calm`, at the voice's **own**
     rate and pitch — a natural read rather than a delivery. the copy is one
     line and it is the line on the screen, with one deliberate difference: the
     box says `ai` and the take is sent `AI`, because a synthesiser reads the
     lower case one as a word. there is a guard that those are the only two
     characters between them.

     **there are no key ticks.** the last cut had 27 of them and the brief for
     this round took them out: the line types, the voice says it, and a tick per
     letter under a read is a machine gun over a man talking.

     **there is no rumble.** the box does not fall out of the frame any more, so
     the thing the rumble was under does not happen.

     the glitch carries the landing, the three stutters after it and the whole
     end card, and the module's own `pop` carries the pill.

   **nothing is said after the read.** the answer beat is deliberately voice free
   so a line can be laid over it outside the render.

   ---------- the shutter ----------

   post10's rule. with `--blur` every output frame is captured `SUB` times inside
   its own sixtieth and averaged. anything written against `t` smears; the
   glitch, the caret, the typed line and the wordmark's birth are written against
   the output frame and are held across every capture of it. the fastest things
   in the file are the fall and the knock down and both are printed on every run. */

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
  STAGE, SAFE, HEAD, HEAD_PX, GRID, BUBBLE,
} from './lib/mascot.mjs';
import { brandTokens } from './lib/captions.mjs';
import {
  renderSfx, writeWav, applyGain, limit, loudness, describeMix,
  decode, mixdown, voiceEnvelope, checkUnderVoice, SR,
} from './lib/sfx.mjs';
import { speak, VOICES, VOICE_OUT } from './lib/voice.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post22');
const SUBS = path.join(OUT, 'subframes-post22');
const VERIFY = path.join(OUT, 'verify-post22');

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
const VOICE_ONLY = argv.includes('--voice');
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

/* ---------- where things stand ----------
   post12's line and post20's: the middle of the **safe band**, not of the frame.
   the platforms take 180 device px off the top and 220 off the bottom, so the
   middle of what a viewer sees is ten css px above the middle of the file. the
   box starts on it, he lands on it, and the wordmark replaces him on it. */
const CENTRE_Y = (SAFE_CSS.top + (VH - SAFE_CSS.bottom)) / 2;
const SIZE = 148;
/* and the one place he is not centred. the pill climbs off his crown to the
   right and it is as wide as the copy needs it to be, so the head gives up
   exactly enough ground for the far end of the run to clear the safe border.
   **this is held from the last cut on instruction** — the bubble's timing and
   its position were signed off and this round does not move either. */
const LEFT_OF_CENTRE = 54;

/* ---------- the green ----------
   index.html's own dark `--accent`, as components so it can be used at an alpha.
   the guard at the bottom reads the token back out of the site and compares, so
   the day somebody changes it there this file fails rather than quietly drifting
   off the palette. it is the only colour in the film. */
const NEON = [53, 255, 106];
/* the iris at rest is the module's own --eye, which on the dark theme is defined
   to equal the page background. the mix runs from there to the accent above. */
const EYE_DARK = [6, 7, 10];

/* ---------- the copy ----------
   what the box says and what the take is sent, and they are one line with one
   difference. a synthesiser reads lower case `ai` as a word; capitalised it
   spells the two letters, which is what a person saying this sentence does. the
   guard below is on the pair rather than on either one. */
const COPY = 'what did ai say to the terminator';
const SAID = 'what did AI say to the terminator';
const BUB_TEXT = 'AI LL BE BACK';

/* ---------- the read ----------
   edge's Andrew, this house's `calm`, at **the voice's own rate and pitch**.
   post20 pushed its take to -4% and +3Hz for "slightly amused"; the brief for
   this round asks for a natural read, so the delivery is the voice's default and
   it is taken off `VOICES` rather than typed, which also keeps the cache key
   honest — `speak()` resolves the defaults before it writes the sidecar, so a
   take that left them off would miss its own cache on every run. */
const VOICE = 'calm';
const RATE = VOICES[VOICE].rate, PITCH = VOICES[VOICE].pitch;
const SILENCE_DB = -42;
const PRE = 0.30, POST = 0.10, EDGE_FADE = 0.012;
/* the bus ducks while a word is being said. there is nothing at all playing
   under the read in this cut — the glitches and the pop are all after it — so
   this is a rule being kept rather than a level doing work. */
const DUCK = 0.30;
const VOICE_TRIM = 0;

/* ---------- the joins ----------
   the four numbers in the first half of the clock that are not the read's own.
   everything else in it is derived from where the words land. */
const CARET_AFTER = 0.14;   /* the caret blinks this long after the last word */
const FALL_LEAD = 0.18;     /* he starts falling this far into the knock down */
const STUT_AT = [0.34, 0.62, 0.90];  /* the three stutters, off the landing */

/* ---------- the end, and it is pinned ----------
   post20's machinery at post20's numbers, through post21. the fault, the end
   card and the mascot's second mark are held from the last cut because the
   bubble hangs off them and the bubble was signed off. */
const MARK2 = 5.74;
const END = { at: 8.00, pre: [], hard: 0.12, tail: 0.18, wmIn: 8.00, wmFor: 0.09, clean: 0.06 };
END.pre = [
  { t: +(END.at - 0.38).toFixed(3), for: 0.05, force: 0.34 },
  { t: +(END.at - 0.18).toFixed(3), for: 0.05, force: 0.60 },
];
const CARD = 0.95;
const SECONDS = +(END.at + CARD).toFixed(2);
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16, minCapPx: 56 };
const GL = {
  shakeX: 15, shakeY: 8, split: 9.5, bandDx: 88, bands: 3,
  noise: [0.10, 0.24], flash: 0.30, flashSize: 420, calmFrom: 0.86,
};
const AP = { hard: 0.13, tail: 0.17 };   /* the hit he lands on */

/* ---------- the knock down, which is post20's ----------
   0.24s of travel and then a small bounce, and the travel is on an ease in out
   rather than on the site's spring for that clip's reason: 268 css px on
   `--ease` peaks at about five times its own average, which is a caption that
   teleports at sixty and is simply missing from the preview. this box travels
   190 rather than 268 and the curve and the bounce are unchanged.

   the bounce is a damped sine written separately, so the landing overshoot is a
   number in this table rather than a property of a curve. */
const SNAP = { at: 0, for: 0.30, bounce: 12, bounceFor: 0.34, damp: 4.5, cycles: 1.0 };

/* ---------- the fall and the smash, which are post20's outright -------------
   560 css px in 0.47s, `p²` because that is what gravity is and no bezier says
   it more clearly, and 37.9 css px on the frame it lands against a ceiling of
   42. he stretches a tenth on the way down, compresses to 1.52 wide by 0.66 tall
   over 70ms with his chin on the ground, and springs out on a damped cosine that
   goes below zero exactly once. **not one number here was chosen by this file.** */
const DROP = { at: 0, for: 0.47, from: 560 };
let LAND = 0;
const SMASH = { air: 0.10, flat: 0.07, back: 0.42, k: 0.52, damp: 4.2, cycles: 1.15 };

/* ---------- the breathing ----------
   one period, slower than a person's because it is a thing pretending to be
   calm. it drives the eye glow and nothing else — the iris is a flat green, or a
   pulse would read as a flicker rather than as a glow. */
const PULSE = { period: 2.60, lo: 0.62, hi: 1.00 };

/* ---------- the chat box ----------
   a rounded rectangle with a hairline outline, the line of type across the top,
   and one row underneath with a plus on the left and a filled send disc on the
   right. **that is the whole of it.** no logo, no model name, no placeholder — a
   chat box that is recognisable from three parts does not need a fourth.

   384 wide leaves 78 css px either side, which is 156 device against a floor of
   140. the type is fitted in the page against the face that actually renders and
   it is fitted on the **whole line**, so the size never changes while it types.

   `line` is where the box's own centre sits once it has been knocked down, and
   it is derived rather than chosen: his ink reaches 69 css px below his mark, the
   box is 95 tall from its own centre, and 660 puts the box's top 26 css px under
   his chin with the bottom still 95 clear of the platform's line. **the box
   stays there** — it is the question, it is still being answered, and a question
   that leaves the frame before the answer arrives is a joke with its setup cut. */
const BOX = {
  w: 384, h: 190, r: 30, pad: 26, padTop: 24,
  textH: 84, size: 34, minCapPx: 34,
  line: 660,
  plus: { r: 15, arm: 6.5 },
  send: { r: 17 },
};
BOX.x = +(VW / 2 - BOX.w / 2).toFixed(2);
BOX.y = +(CENTRE_Y - BOX.h / 2).toFixed(2);
BOX.travel = +(BOX.line - CENTRE_Y).toFixed(2);
BOX.rowY = BOX.h - BOX.pad - BOX.send.r;
BOX.plusX = BOX.pad + BOX.plus.r;
BOX.sendX = BOX.w - BOX.pad - BOX.send.r;
/* the caret blinks on its own clock while the line is being typed and is off the
   moment the box is knocked down, which is post20's rule: a caret on a line that
   has stopped being written is a caret nobody is holding. */
const CARET = { period: 1.06, on: 0.62 };

/* crf 17, every dark clip's: this frame is nearly all flat black with soft glows
   across it, which is exactly what a codec bands. */
const CRF = 17;

/* ---------- the mix ---------- */
const TARGET_LUFS = -14;
const SAMPLE_CEILING = -1.8;
const PEAK_CEILING = -1.0;
const MAX_REDUCTION = 5.0;

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
const MOVE = bezier(.4, 0, .2, 1);             /* and the one the knock down uses */
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

/* two sines on incommensurate periods rather than one: a sine stands still twice
   a period, so on a beat where this is the only thing moving the two frames
   either side of its turning point are identical. */
function phosphor(t, amp, slow, fast, phase) {
  return 1 + amp * 0.78 * Math.sin(2 * Math.PI * t / slow)
    + amp * 0.39 * Math.sin(2 * Math.PI * t / fast + phase);
}

/* ---------- the typing, and it is the read ----------
   character by character, which is what a chat box does and is what the brief
   asks for, but **placed by the read rather than by a grid**: each word's own
   characters are spread across that word's own spoken window, and the space in
   front of a word arrives with the word. so the typing is uneven in exactly the
   way the reading is, which is post20's argument done at character level instead
   of word level.

   `CHARS[i]` is when character `i` of COPY is on screen. it is filled once the
   take is back and everything downstream reads it rather than re-deriving. */
const WORDS = [];
const CHARS = [];
const charsAt = t => {
  let n = 0;
  while (n < CHARS.length && t >= CHARS[n]) n++;
  return n;
};

/* the caret, a hard step on its own clock, and gone once the box is knocked
   down. */
const caretAt = t => (t < SNAP.at && (t % CARET.period) / CARET.period < CARET.on ? 1 : 0);

/* ---------- the box going down, which is post20's knock down ---------------
   the travel and the bounce added on top of it rather than folded into it, so
   the overshoot is a number in the table rather than a property of a curve. it
   only ever moves down: the horizontal is settled once, in the css, so there is
   no lateral channel here to disagree with anything. */
function boxDy(t) {
  const p = span(t, SNAP.at, SNAP.at + SNAP.for);
  const q = span(t, SNAP.at + SNAP.for, SNAP.at + SNAP.for + SNAP.bounceFor);
  const bounce = q > 0 && q < 1
    ? SNAP.bounce * Math.exp(-SNAP.damp * q) * Math.sin(2 * Math.PI * SNAP.cycles * q) * (1 - q)
    : 0;
  return n4(BOX.travel * MOVE(p) + bounce);
}

/* ---------- the fall and the landing, which are post20's -------------------
   `dy` is how far above his mark he is and `k` is the compression; the third
   line of `compose` is the ground compensation, which is the whole difference
   between a thing landing and a thing being squeezed in mid air. */
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

/* the module writes the head and this adds two things to it: how far above his
   mark he is, and how much he is squashed. both go on `frame.card`, which is
   what `headRect` and every clearance downstream already read. there are no
   hands in this clip, so post20's third gate is not here. */
function compose(plan, t, R) {
  const f = mascotFrame(plan, t);
  const k = squashAt(t);
  if (!k && t >= LAND) return f;
  const sq = 1 + k;
  const ground = t >= LAND ? R * (1 - 1 / sq) : 0;
  return {
    ...f,
    card: {
      ...f.card,
      y: +(f.card.y + fallAt(t) + ground).toFixed(4),
      sx: +(f.card.sx * sq).toFixed(5),
      sy: +(f.card.sy / sq).toFixed(5),
    },
  };
}

/* ---------- a point on the head, in css px on the frame ----------
   `headRect`'s own chain for a point in card space: its offset from the card's
   centre, through the card's two scales and its rotation, then out to the page.
   the two eye glows hang off it and both have to sit on the eyes that are drawn
   rather than the ones the plan describes — under the smash the card is half as
   tall again as wide, and an eye placed by arithmetic would be off his face. */
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

/* how green the iris is, nought to one: dark until he is on screen, then flat
   for the rest of the film. the breathing is on the glow and not on this. */
const greenAt = t => (t < DROP.at ? 0 : 1);
const pulseAt = t => n4(lerp(PULSE.lo, PULSE.hi,
  0.5 + 0.5 * Math.sin(2 * Math.PI * (t - LAND) / PULSE.period - Math.PI / 2)));

/* ---------- the glitch ----------
   post12's, through post20's and post21's: a function of the output frame index
   and of nothing else, so a one frame rgb split is not on for one subframe of
   four and landing at a quarter strength.

   three kinds of window. `impact` and `hit` both ride the heat curve, because
   both are an event; a `stutter` is a fixed force held for its own frames,
   because a stutter is a dropped frame rather than a shock. only the hit tears
   bands, and only the hit flashes: before 8.00 there is no wordmark to redraw
   shifted and nothing the white frame would be announcing. */
function heatAt(p) {
  if (p < 0) return 0;
  if (p < 0.13) return 1;
  if (p < 0.58) return 1 - (p - 0.13) / 0.45 * 0.58;
  if (p < GL.calmFrom) return 0.42 * (1 - (p - 0.58) / (GL.calmFrom - 0.58));
  return 0;
}
let STUT = [];
function glitchWindows(fps) {
  return [
    { ...onGrid(LAND, AP.hard + AP.tail, fps), kind: 'impact', seed: 0x22a1e0 },
    ...STUT.map((w, i) => ({ ...onGrid(w.t, w.for, fps), kind: 'stutter', force: w.force, seed: 0x3300 + i * 811 })),
    ...END.pre.map((w, i) => ({ ...onGrid(w.t, w.for, fps), kind: 'stutter', force: w.force, seed: 0x51a0 + i * 977 })),
    { ...onGrid(END.at, END.hard + END.tail, fps), kind: 'hit', seed: 0x0c1a55 },
  ];
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
  g.flash = (w.kind === 'hit' && f === Math.round(END.at * FPS)) ? GL.flash : 0;
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
   everything this file writes, in one object. `t` is the instant being captured
   and `f` is the output frame it belongs to. the two switches — he starts
   falling, and he is exchanged for the wordmark — are on the **frame** rather
   than on the instant, which is post20's 60fps finding: every channel in an
   exchange goes on the same frame or the shutter finds the seam. */
function frameAt(plan, mf, t, f) {
  const g = glitchAt(f);
  const born = f >= Math.round(DROP.at * FPS);
  const cut = f >= Math.round(END.at * FPS);
  const on = born && !cut;
  const green = on ? greenAt(t) : 0;
  const wp = span(t, END.wmIn, END.wmIn + END.wmFor);
  return {
    t: +t.toFixed(4), f,
    mo: on ? 1 : 0,
    /* the iris, mixed from the module's own token to the site's own accent,
       written as a resolved colour rather than as a colour-mix so the number in
       the report and the number on the frame are the same one. */
    iris: 'rgb(' + EYE_DARK.map((c, i) => Math.round(lerp(c, NEON[i], green))).join(',') + ')',
    eyes: eyeSpots(plan, mf),
    /* the glow is over the eyes and nowhere else. the halo round his head is the
       module's own white one and this file does not touch it. */
    eyeGlow: n4(green * (t < LAND ? 1 : pulseAt(t))),
    box: {
      dy: cut ? 0 : boxDy(t),
      o: cut ? 0 : 1,
      chars: charsAt(t),
      caret: cut ? 0 : caretAt(f / FPS),
      /* the focus glow, and it is load bearing rather than decoration: for the
         first three and a half seconds it is the only thing on the frame that
         changes on every frame, and the liveness guard is measured on what this
         file writes. a focused input that breathes is also simply what one does. */
      glow: +phosphor(t, 0.30, 2.9, 1.13, 0.4).toFixed(4),
    },
    sx: g.sx, sy: g.sy,
    wm: {
      o: cut ? 1 : 0,
      sc: +(1 + (1 - EASE(wp)) * 0.085).toFixed(4),
      glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4),
    },
    g,
  };
}

/* ---------- the page ---------- */
function sceneHtml(plan) {
  const rgb = a => a.join(',');
  /* index.html's own two blocks, verbatim, which is `captionCss`'s move and the
     reason it is: --bg, --fg, --bub and --accent are the site's and this file is
     not allowed a second opinion about any of them. there is no caption engine
     in this cut to emit them, so it is done here instead. the overrides below
     come after and only touch the faces, none of which the dark block declares. */
  const brand = brandTokens();
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post22</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Manrope:wght@500;800&display=swap">
<style>
:root{
${brand.light}
}
html[data-theme=dark]{
${brand.dark}
}
:root{
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  /* there is no caption band in this cut, so what is taken from the captions is
     the face: manrope, which is what every clip since post18 sets words in. the
     module's bubble and this file's typed line both read var(--body), so setting
     it once here is the whole of it and space grotesk is not requested at all. */
  --body:"Manrope",var(--mono);
  --display:"Michroma",var(--mono);
  /* the two channels the rgb split is drawn in: the same white the glow is,
     pulled apart, rather than a red and a cyan out of a filter preset. */
  --split-r:rgba(255,120,120,.55); --split-c:rgba(120,220,255,.55);
  /* the eyes, which are index.html's own dark --accent written as components so
     they can be used at an alpha. there is a guard that these are still that. */
  --neon:${rgb(NEON)};
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}

/* the vignette, and it is load bearing rather than decoration: with nothing at
   all animating chrome stops producing compositor frames and the screenshot call
   blocks on a frame that never comes. it is the one thing here allowed to be a
   css animation, because it is the one thing that does not hit a mark. */
.vignette{position:fixed;inset:-10%;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 78% 62% at 50% 46%,
    rgba(255,255,255,.028) 0%, rgba(255,255,255,.010) 46%, rgba(0,0,0,0) 72%);
  will-change:transform,opacity;
  animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{
  from{transform:scale(1) translate3d(0,0,0);opacity:.85}
  to{transform:scale(1.05) translate3d(0,-1.1%,0);opacity:1}
}

/* the camera, and it only ever shakes: there is no zoom and no pan in this cut. */
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;background:var(--bg);
  transform:translate3d(calc(var(--sx,0) * 1px),calc(var(--sy,0) * 1px),0);
  will-change:transform}

${mascotCss(plan)}
#m-zone{opacity:var(--m-o,1)}
/* ---- the iris, and it is the whole of the green ----
   this beats the module's own class selector rather than changing the token:
   --eye also draws the brows, the pill's ground and a glove's edge, and none of
   those is meant to go green. */
#m-zone .m-iris{fill:var(--iris,var(--eye))}
/* ---- the pill's face ----
   the module sets it in var(--body) at 500, which is now manrope. the punchline
   is the thing the whole clip is for, so it is set at the captions' own weight.
   nothing else about the bubble is touched: the dots, the outline, the ground,
   the spring corner and every number in the timing are the module's. */
.m-pill{font-weight:800}
.stage[data-gl="1"] #m-zone{
  filter:drop-shadow(calc(var(--split,0) * -1px) 0 var(--split-r))
         drop-shadow(calc(var(--split,0) * 1px) 0 var(--split-c))}

/* ---- the eyes, lit ----
   two small discs, one over each eye, on top of the head rather than under it,
   because it is a bloom coming off the ink. it is hot in the middle and gone
   inside 84px, so what it lights is the **eye** and not the face: the halo round
   his head is the module's own white glow and there is nothing coloured on it.
   no css filter anywhere near the mascot's own layers — the module's own note
   about a filter over a promoted layer is the reason. */
.eyeglow{position:absolute;left:0;top:0;width:84px;height:84px;margin:-42px 0 0 -42px;
  border-radius:50%;pointer-events:none;z-index:5;opacity:var(--o,0);
  transform:translate3d(calc(var(--x,0) * 1px),calc(var(--y,0) * 1px),0);
  will-change:transform,opacity;
  background:radial-gradient(circle,
    rgba(var(--neon),.80) 0%, rgba(var(--neon),.44) 22%,
    rgba(var(--neon),.15) 44%, rgba(var(--neon),.03) 66%,
    rgba(var(--neon),0) 80%)}

/* ---- the chat box ----
   an outline in the site's own --bub over a ground a shade above the page, which
   is post17's dark redraw: a genuinely black box on #06070a is not a box, it is
   nothing. the glow is the focus ring and it breathes. it only ever translates
   down, and it stays where it lands. */
.box{position:absolute;left:${BOX.x}px;top:${BOX.y}px;
  width:${BOX.w}px;height:${BOX.h}px;border-radius:${BOX.r}px;
  background:#12161a;border:2px solid var(--bub);
  opacity:var(--bo,1);z-index:3;
  transform:translate3d(0,calc(var(--by,0) * 1px),0);
  box-shadow:0 0 calc(var(--bg-glow,0) * 26px) rgba(255,255,255,.07),
    inset 0 0 calc(var(--bg-glow,0) * 18px) rgba(255,255,255,.028);
  will-change:transform,opacity}
.box-text{position:absolute;left:${BOX.pad}px;top:${BOX.padTop}px;
  width:${BOX.w - BOX.pad * 2}px;height:${BOX.textH}px;
  color:var(--fg);font-family:var(--body);font-weight:500;line-height:1.26;
  letter-spacing:-.005em;white-space:pre-wrap;overflow:hidden}
.caret{display:inline-block;width:3px;height:1em;background:var(--fg);
  vertical-align:text-bottom;transform:translateY(.14em);margin-left:2px;
  opacity:var(--co,1)}
.ui .ring{fill:none;stroke:var(--bub);stroke-width:2}
.ui .glyph{fill:none;stroke:var(--fg);stroke-width:2.4;stroke-linecap:round;opacity:.78}
.ui .disc{fill:var(--fg)}
.ui .arrow{fill:none;stroke:var(--bg);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.stage[data-gl="1"] .box{
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
  <div class="box" id="box">
    <div class="box-text" id="boxtext"><span id="typed"></span><i class="caret" id="caret"></i></div>
    <svg class="ui" viewBox="0 0 ${BOX.w} ${BOX.h}" width="${BOX.w}" height="${BOX.h}" aria-hidden="true">
      <circle class="ring" cx="${BOX.plusX}" cy="${BOX.rowY}" r="${BOX.plus.r}"/>
      <path class="glyph" d="M ${BOX.plusX - BOX.plus.arm} ${BOX.rowY} h ${BOX.plus.arm * 2}
        M ${BOX.plusX} ${BOX.rowY - BOX.plus.arm} v ${BOX.plus.arm * 2}"/>
      <circle class="disc" cx="${BOX.sendX}" cy="${BOX.rowY}" r="${BOX.send.r}"/>
      <path class="arrow" d="M ${BOX.sendX} ${BOX.rowY + 7} V ${BOX.rowY - 7}
        M ${BOX.sendX - 5.5} ${BOX.rowY - 1.5} L ${BOX.sendX} ${BOX.rowY - 7} L ${BOX.sendX + 5.5} ${BOX.rowY - 1.5}"/>
    </svg>
  </div>
${mascotMarkup(plan)}
  <i class="eyeglow" data-glow="0"></i><i class="eyeglow" data-glow="1"></i>
  <div class="wm" id="wm">${WM.lines.map(l => '<span>' + l + '</span>').join('')}</div>
${Array.from({ length: GL.bands }, (_, i) => '  <div class="tear" data-tear="' + i
    + '"><div class="tear-in"><div class="wm">'
    + WM.lines.map(l => '<span>' + l + '</span>').join('') + '</div></div></div>').join('\n')}
  <div class="noise" aria-hidden="true"></div>
  <div class="flash" aria-hidden="true"></div>
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
window.__P22 = ${JSON.stringify({ VW, VH, DSF, WM, BOX, COPY })};
${mascotRuntime()}
(${scenePage.toString()})();
/* the layers measure and fit themselves once, after both faces are really here.
   offline everything renders in the mono fallback and looks almost right, which
   is the worst kind of wrong to fit type against. */
Promise.all([
  document.fonts.load('400 40px Michroma'),
  document.fonts.load('500 34px Manrope'),
  document.fonts.load('800 26px Manrope'),
])
  .then(function () { return document.fonts.ready; })
  .then(function () {
    window.__built = Object.assign({}, window.__p22.fit(), { mas: window.__mas.build() });
  });
</script>
</body>
</html>`;
}

/* ---------- the page's own script ----------
   it writes numbers to elements and it decides nothing, exactly like the
   mascot's page half. serialised in with .toString(), so it must not close over
   anything: everything it needs arrives on window.__P22. */
function scenePage() {
  const P = window.__P22;
  const stage = document.getElementById('stage');
  const box = document.getElementById('box');
  const boxText = document.getElementById('boxtext');
  const typed = document.getElementById('typed');
  const caret = document.getElementById('caret');
  const wms = [...document.querySelectorAll('.wm')];
  const glows = [...document.querySelectorAll('.eyeglow')];
  const tears = [...document.querySelectorAll('.tear')];
  const tearIns = tears.map(t => t.querySelector('.tear-in'));
  let lastChars = -1;

  const capOf = el => {
    const cs = getComputedStyle(el);
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    const m = cv.measureText('H');
    return { cap: m.actualBoundingBoxAscent || 0, font: cv.font };
  };

  window.__p22 = {
    fit() {
      /* the wordmark, fitted its own way: michroma is proportional and the
         tracking is nearly a fifth of an em, so the width of the widest line is a
         measurement rather than a ratio. every copy is fitted, the torn ones
         included, or a tear would show a wordmark at a different size. */
      const probe = wms[0];
      probe.style.fontSize = '100px';
      let widest = 0;
      for (const sp of probe.querySelectorAll('span')) {
        widest = Math.max(widest, sp.getBoundingClientRect().width);
      }
      const ws = 100 * P.WM.w / widest;
      for (const el of wms) el.style.fontSize = ws.toFixed(2) + 'px';

      /* and the typed line, fitted on the **whole** string with the caret in
         place: the largest size whose wrapped block still fits the text box, so
         the type never changes size while it types and the caret never pushes a
         word onto a third line on the last character. */
      typed.textContent = P.COPY;
      /* the caret is forced on **through its own variable** for the measurement,
         never with an inline `opacity`. an inline opacity is a declaration and it
         beats `opacity:var(--co,1)` in the stylesheet for the rest of the render,
         so a caret fitted that way is welded on: it never blinks and it is still
         there under a line nobody is typing any more. the guards cannot see that
         — every number they read is correct — and the frames can. */
      caret.style.setProperty('--co', '1');
      let size = P.BOX.size, stoppedBy = null;
      for (; size >= 10; size -= 0.5) {
        boxText.style.fontSize = size + 'px';
        if (boxText.scrollHeight <= P.BOX.textH + 0.5) { stoppedBy = null; break; }
        stoppedBy = 'height';
      }
      boxText.style.fontSize = size.toFixed(2) + 'px';
      const lh = parseFloat(getComputedStyle(boxText).lineHeight) || 1;
      const c = capOf(boxText);
      return {
        wm: +ws.toFixed(2),
        box: {
          size: +size.toFixed(2), stoppedBy,
          capPx: +(c.cap * P.DSF).toFixed(1), font: c.font,
          h: +boxText.scrollHeight.toFixed(1),
          lines: Math.round(boxText.scrollHeight / lh),
        },
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

    /* the box as it actually painted, in device px off each border. the outline
       is measured too: chrome floors border-width to a whole css pixel and the
       module's own note about the bubble's stroke is why that is worth reading
       back rather than trusting. it is called twice, once on its starting line
       and once on the line it is knocked down to. */
    measureBox() {
      const r = box.getBoundingClientRect(), d = P.DSF;
      return {
        left: +(r.left * d).toFixed(1), top: +(r.top * d).toFixed(1),
        right: +((P.VW - r.right) * d).toFixed(1), bottom: +((P.VH - r.bottom) * d).toFixed(1),
        topCss: +r.top.toFixed(2),
        w: +(r.width * d).toFixed(1), h: +(r.height * d).toFixed(1),
        stroke: getComputedStyle(box).borderTopWidth,
      };
    },

    apply(o) {
      const s = stage.style;
      s.setProperty('--m-o', o.mo.toFixed(4));
      s.setProperty('--iris', o.iris);
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

      box.style.setProperty('--by', o.box.dy.toFixed(2));
      box.style.setProperty('--bo', o.box.o.toFixed(4));
      box.style.setProperty('--bg-glow', o.box.glow.toFixed(4));
      box.style.visibility = o.box.o < 0.004 ? 'hidden' : 'visible';
      caret.style.setProperty('--co', o.box.caret.toFixed(2));
      if (o.box.chars !== lastChars) {
        typed.textContent = P.COPY.slice(0, o.box.chars);
        lastChars = o.box.chars;
      }

      for (let k = 0; k < 2; k++) {
        const e = o.eyes[k], el = glows[k];
        el.style.setProperty('--x', e.x.toFixed(2));
        el.style.setProperty('--y', e.y.toFixed(2));
        el.style.setProperty('--o', o.eyeGlow.toFixed(4));
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
async function render(plan, R) {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  for (const d of [FRAMES, SUBS]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  fs.mkdirSync(OUT, { recursive: true });

  const N = Math.round(FPS * SECONDS);
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
  for (let i = 0; i < 240; i++) {
    const ok = await page.evaluate(() => !!(window.__built && window.__mas && window.__mas.ready
      && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  if (!await page.evaluate(() => !!window.__built)) throw new Error('the scene never became ready');
  for (const [f, what] of [['400 40px "Michroma"', 'the wordmark'], ['500 34px "Manrope"', 'the typed line'],
  ['800 26px "Manrope"', 'the bubble']]) {
    if (!await page.evaluate(s => document.fonts.check(s), f)) {
      throw new Error(f + ' did not load — ' + what + ' would be judged in the mono fallback');
    }
  }

  const built = await page.evaluate(() => window.__built);
  const wm = await page.evaluate(() => window.__p22.measureWm());
  const boxUp = await page.evaluate(() => window.__p22.measureBox());
  console.log('  built: head ' + built.mas.headPx + 'px, ' + built.mas.eyes + ' eyes, '
    + built.mas.glows + ' glow layers, theme ' + built.mas.theme);
  console.log('  the typed line: Manrope 500 at ' + built.box.size + 'css px, caps '
    + built.box.capPx + ' device, ' + built.box.lines + ' lines, ' + built.box.h
    + 'css tall in a text box of ' + BOX.textH);
  console.log('  the box on its first line: ' + boxUp.w + 'x' + boxUp.h + ' device, outline '
    + boxUp.stroke + ', clear ' + boxUp.left + ' left / ' + boxUp.top + ' top / '
    + boxUp.right + ' right / ' + boxUp.bottom + ' bottom');
  console.log('  the wordmark: ' + wm.sizeCss + 'css px, widest line ' + wm.widestPx
    + ' device px, caps ' + wm.capPx + ', clear ' + wm.left + ' left / ' + wm.top
    + ' top / ' + wm.right + ' right / ' + wm.bottom + ' bottom');

  /* the box on the line it is knocked down to, which is the one that has to
     clear the platform's bottom band. */
  {
    const t = SNAP.at + SNAP.for + SNAP.bounceFor + 0.2, f = Math.round(t * FPS);
    const mf = compose(plan, f / FPS, R);
    await page.evaluate(fr => window.__mas.apply(fr), mf);
    await page.evaluate(fr => window.__p22.apply(fr), frameAt(plan, mf, f / FPS, f));
  }
  const boxDown = await page.evaluate(() => window.__p22.measureBox());
  console.log('  the box on its settled line: clear ' + boxDown.left + ' left / ' + boxDown.top
    + ' top / ' + boxDown.right + ' right / ' + boxDown.bottom + ' bottom, its top at '
    + boxDown.topCss + 'css');

  /* the bubble, on the frame it is fully up on, measured off the rendered pill
     rather than off the numbers that placed it. */
  const bub = plan.marks[plan.marks.length - 1].bubble;
  const bubAt = +(bub.full + 0.10).toFixed(3);
  {
    const f = Math.round(bubAt * FPS), t = f / FPS;
    const mf = compose(plan, t, R);
    await page.evaluate(fr => window.__mas.apply(fr), mf);
    await page.evaluate(fr => window.__p22.apply(fr), frameAt(plan, mf, t, f));
  }
  const bubSafe = await page.evaluate((w, h) => window.__mas.bubbleSafe(w, h), VW, VH);
  const bubCaps = await page.evaluate(() => window.__mas.caps());
  console.log('  the bubble at ' + bubAt + 's: ' + bubSafe.w + ' device px wide, clear '
    + bubSafe.left + ' left / ' + bubSafe.top + ' top / ' + bubSafe.right + ' right / '
    + bubSafe.bottom + ' bottom, caps ' + bubCaps.capPx + ' device');

  /* the head, as ink, on every frame he is on, with the fall and the smash
     composed on. **the air and the mark are measured apart**, which is post20's
     split and it is not a nicety: while he is falling he is deliberately off the
     top of the frame, so a single worst-of-four would report a head 300px past
     the top border as a failure on every run. on the mark all four sides are
     judged; in the air only the three he is not supposed to be leaving through.
     the third number is how close his chin gets to the top of the box. */
  let worst = null, air = null, gap = Infinity, gapAt = 0;
  for (let f = 0; f < N; f++) {
    const t = f / FPS;
    if (t < DROP.at) continue;
    if (t >= END.at) break;
    const r = headRect(plan, compose(plan, t, R));
    if (t >= LAND) {
      const near = Math.min(r.left, r.top, r.right, r.bottom);
      if (!worst || near < worst.near) worst = { t: +t.toFixed(3), near, ...r };
    } else {
      const near = Math.min(r.left, r.right, r.bottom);
      if (!air || near < air.near) air = { t: +t.toFixed(3), near, top: r.top, ...r };
      if (!air.highest || r.top < air.highest) air.highest = r.top;
    }
    const chin = VH - r.bottom / DSF;
    const top = BOX.y + boxDy(t);
    if (top - chin < gap) { gap = +(top - chin).toFixed(2); gapAt = +t.toFixed(3); }
  }

  const sigs = [];
  const wall = Date.now();

  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const mf = compose(plan, t, R);
      const o = frameAt(plan, mf, t, f);
      await page.evaluate(fr => window.__mas.apply(fr), mf);
      await page.evaluate(fr => window.__p22.apply(fr), o);
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);

      if (k === 0) {
        /* the liveness signature: one number per output frame off everything
           this file wrote plus everything the module wrote, so two identical
           frames are a fact rather than a suspicion.

           **the mascot's channels are multiplied by `mo`.** he is planned from
           zero and drifts the whole time, so counting his numbers while he is
           not on the frame would let the first three and a half seconds pass
           this guard on motion nobody can see. what carries the opening is the
           box's own focus glow, which is the honest answer. */
        let s = o.mo * 7 + o.eyeGlow * 11 + o.box.dy * 17 + o.box.o * 19
          + o.box.chars * 23 + o.box.caret * 29 + o.box.glow * 31
          + o.sx * 37 + o.sy * 41 + o.wm.o * 43 + o.wm.sc * 47 + o.wm.glow * 53
          + o.g.split * 61 + o.g.noise * 67 + o.g.flash * 71 + o.g.bands.length * 73;
        s += o.mo * (mf.card.x * 79 + mf.card.y * 83 + mf.card.rot * 89
          + mf.card.sx * 97 + mf.card.sy * 101 + mf.glow * 103);
        for (let e = 0; e < 2; e++) {
          s += o.mo * (mf.eyes[e].x * (107 + e) + mf.eyes[e].y * (113 + e)
            + mf.eyes[e].sx * (127 + e) + mf.eyes[e].sy * (131 + e) + mf.eyes[e].lid * (137 + e));
          s += o.mo * (mf.brows[e].o * (139 + e) + mf.brows[e].y * (149 + e));
        }
        s += o.mo * (mf.bubble.o * 151 + mf.bubble.pill.sc * 157
          + mf.bubble.dots[0].sc * 163 + mf.bubble.dots[1].sc * 167);
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
    [0.02, 'a-the-empty-box'],
    [WORDS[2].start + 0.06, 'b-typing'],
    [WORDS[WORDS.length - 1].end + 0.04, 'c-the-line'],
    [SNAP.at + SNAP.for * 0.6, 'd-the-box-going-down'],
    [DROP.at + DROP.for * 0.6, 'e-he-falls'],
    [LAND + 0.01, 'f-the-landing'],
    [LAND + 0.30, 'g-green-eyes'],
    [STUT[1].t, 'h-a-stutter'],
    [+(LAND + (MARK2 - LAND) / 2).toFixed(3), 'i-holding'],
    [bub.in + 0.10, 'j-the-dots'],
    [bubAt, 'k-the-line-he-says'],
    [7.55, 'l-the-hold'],
    [END.pre[1].t, 'm-the-second-stutter'],
    [END.at + END.hard + END.tail + 0.16, 'n-the-wordmark'],
    [SECONDS - 0.06, 'o-the-last-frame'],
  ];
  for (const [want, name] of stills) {
    const f = Math.min(N - 1, Math.round(want * FPS));
    const t = f / FPS;
    const mf = compose(plan, t, R);
    await page.evaluate(fr => window.__mas.apply(fr), mf);
    await page.evaluate(fr => window.__p22.apply(fr), frameAt(plan, mf, t, f));
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
    });
    fs.writeFileSync(path.join(VERIFY, name + '.png'), Buffer.from(shot.data, 'base64'));
  }

  console.log('  the head, worst frame at ' + worst.t + 's: ' + worst.left + ' left, '
    + worst.top + ' top, ' + worst.right + ' right, ' + worst.bottom + ' bottom (floor '
    + Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom) + ')');
  console.log('  in the air, worst of the three sides he may not leave, at ' + air.t + 's: '
    + air.left + ' left, ' + air.right + ' right, ' + air.bottom + ' bottom. he reaches '
    + air.highest + ' at the top, which is off the frame on purpose');
  console.log('  the glow reaches ' + worst.glowReach + 'px past the ink');
  console.log('  his chin clears the top of the box by ' + gap + 'css px at ' + gapAt + 's');

  await browser.close();
  srv.close();
  if (SUB > 1) blend(N);

  const state = { built, wm, boxUp, boxDown, bubSafe, bubCaps, bubAt, head: worst, air, gap, gapAt, sigs, frames: N };
  fs.writeFileSync(path.join(OUT, 'post22.json'), JSON.stringify(state, null, 2));
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
  const out = path.join(OUT, 'post22-dark-1080x1920.mp4');
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

/* ---------- the read ----------
   one take, cached, and **the delivery is part of the cache key**: the copy is
   one half of what a take is and the rate and the pitch are the other. post19's
   shape through post20's, unchanged. */
async function take() {
  const name = 'post22-l1';
  const cached = path.join(VOICE_OUT, name + '-' + VOICE + '.json');
  const want = SAID.replace(/\s+/g, ' ').trim();
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === want && j.rate === RATE && j.pitch === PITCH && fs.existsSync(j.file)) {
      return { ...j, cached: true };
    }
  }
  return { ...(await speak(SAID, { voice: VOICE, name, rate: RATE, pitch: PITCH })), cached: false };
}

/* where the take's sound actually starts and stops, off the waveform rather than
   off the word list: the synthesiser's WordBoundary carries a duration shorter
   than the sound, so a silence trusted to the word list is not the silence in
   the file. post19's, unchanged. */
function audioEdges(pcm) {
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  const gate = peak * Math.pow(10, SILENCE_DB / 20);
  const H = Math.round(0.005 * SR);
  const n = Math.floor(pcm.length / H);
  const loud = k => {
    let m = 0;
    for (let j = k * H; j < Math.min((k + 1) * H, pcm.length); j++) m = Math.max(m, Math.abs(pcm[j]));
    return m > gate;
  };
  let a = 0, b = n - 1;
  while (a < n && !loud(a)) a++;
  while (b > a && !loud(b)) b--;
  return { start: +(a * 0.005).toFixed(4), end: +((b + 1) * 0.005).toFixed(4), peak: +(20 * Math.log10(peak)).toFixed(1) };
}

const TAKE = await take();
const PCM = decode(ffmpeg, TAKE.file);
const EDGE = audioEdges(PCM);
if (TAKE.timing !== 'engine') {
  throw new Error('the take came back with estimated timings — the picture is cut to the read'
    + ' and an estimate is not a read');
}

/* ---------- the clock ----------
   the first half is the read's, the second half is pinned. the read is laid in
   with `PRE` of silence in front of it, the words are pushed onto the clip's own
   clock, the characters are placed inside the words, and the caret, the knock
   down and the fall follow in that order. */
const off = +(PRE - EDGE.start).toFixed(4);
const wv = TAKE.words;
if (wv.length !== SAID.split(' ').length) {
  throw new Error('the take came back with ' + wv.length + ' words and the line has '
    + SAID.split(' ').length + ' — the typing cannot be cut to a read it does not match');
}
for (let i = 0; i < wv.length; i++) {
  WORDS.push({
    word: COPY.split(' ')[i], said: wv[i].word,
    start: +(wv[i].start + off).toFixed(4),
    end: +(wv[i].end + off).toFixed(4),
  });
}
/* the characters, inside the words. a word's own letters are spread across its
   own spoken window and the space in front of it arrives with it, so the typing
   is uneven in exactly the way the reading is. */
{
  let at = 0;
  for (let i = 0; i < WORDS.length; i++) {
    const w = WORDS[i];
    const lead = i ? 1 : 0;                       /* the space before this word */
    const n = w.word.length + lead;
    for (let k = 0; k < n; k++) {
      CHARS.push(+(w.start + (w.end - w.start) * ((k + 1) / n)).toFixed(4));
    }
    at += n;
  }
  if (at !== COPY.length) {
    throw new Error('the character clock is ' + at + ' long and the line is ' + COPY.length);
  }
}

const READ_END = +Math.max(WORDS[WORDS.length - 1].end, EDGE.end + off).toFixed(3);
SNAP.at = +(WORDS[WORDS.length - 1].end + CARET_AFTER).toFixed(3);
DROP.at = +(SNAP.at + FALL_LEAD).toFixed(3);
LAND = +(DROP.at + DROP.for).toFixed(4);
STUT = STUT_AT.map((d, i) => ({ t: +(LAND + d).toFixed(3), for: 0.05, force: [0.62, 0.44, 0.30][i] }));
GL_WINDOWS = glitchWindows(FPS);
GL_WINDOWS_60 = FPS === 60 ? GL_WINDOWS : glitchWindows(60);

console.log('  the read: ' + (TAKE.cached ? 'cached' : 'fetched') + ', ' + VOICE + ' ('
  + VOICES[VOICE].id + ') at ' + RATE + ' / ' + PITCH + ', ' + WORDS.length + ' words, sound from '
  + EDGE.start.toFixed(2) + ' to ' + EDGE.end.toFixed(2) + 's in the file');
console.log('    "' + SAID + '"');
console.log('    on the clip\'s clock: ' + WORDS[0].start.toFixed(2) + ' to '
  + READ_END.toFixed(2) + 's, which is ' + (READ_END - WORDS[0].start).toFixed(2) + 's of reading');

if (VOICE_ONLY) {
  console.log('\n  the clock the read bought');
  for (const w of WORDS) console.log('    ' + w.start.toFixed(2).padStart(5) + 's  ' + w.word);
  console.log('    ' + SNAP.at.toFixed(2).padStart(5) + 's  the box goes down');
  console.log('    ' + DROP.at.toFixed(2).padStart(5) + 's  he starts falling');
  console.log('    ' + LAND.toFixed(2).padStart(5) + 's  he lands');
  console.log('    ' + MARK2.toFixed(2).padStart(5) + 's  the pinned mark that places the bubble');
  console.log('    the hold beat is ' + (MARK2 - LAND).toFixed(2) + 's');
  process.exit(0);
}

/* ---------- the two marks ----------
   both `neutral`, which is the only calm state in the module's table: the brief
   rules out angry and unimpressed outright and says the read is in the eyes.

   the second one exists for one reason and it is worth stating rather than
   hiding. the module's single bubble is placed at its mark's `settled` plus
   0.12, so a thought at 6.32 needs a mark at 5.74, and there is no other way to
   ask for it — the list spelling runs on the `quick` profile, which is 0.80s end
   to end and would be gone before the last beat starts. what that costs is a
   small settle from 5.44: neutral's own exit and entrance, which is two per cent
   of scale, and it lands as an anticipation before he speaks. */
const plan = planMascot({
  seconds: SECONDS,
  size: SIZE,
  theme: 'dark',
  /* dead straight on. `pos` defaults to bottom-left and the module derives
     TURN.bias 0.35 from it, which is right for a head standing in a corner
     looking into the frame and wrong for one facing camera. post20's note. */
  bias: 0,
  /* the idle's seed, and it is chosen rather than left. the brief asks for one
     slow blink while the bubble holds, and a blink is the module's own schedule
     rather than something a clip may place: so the seed is walked until the
     schedule puts exactly one inside 7.00 to 7.50. the guard below re-checks the
     window rather than trusting this comment. */
  seed: 27,
  /* the brief says beside. `beside` wants the head's own width again in clear
     space off his flank and a four word pill does not have it anywhere near the
     middle of a 540 wide stage, so it is the module's own answer to exactly
     that — the run climbs off the crown to his right at 50 degrees. **held from
     the last cut on instruction**, along with every number in its timing. */
  thought: 'over-right',
  marks: [
    { t: 0.00, state: 'neutral' },
    { t: MARK2, state: 'neutral', bubble: BUB_TEXT },
  ],
});

/* his box, placed. `headRect`, `mascotCss` and `mascotPagePlan` all read
   `plan.box` when they are called, so moving it first is the same as having been
   placed there. */
const halfBox = (GRID / 2) * plan.unit;
plan.box.left = +(VW / 2 - halfBox - LEFT_OF_CENTRE).toFixed(2);
plan.box.top = +(CENTRE_Y - halfBox).toFixed(2);
/* the plate's own radius in css px, which is what the smash's ground
   compensation is measured in: post20's number, from the same expression. */
const R = +(HEAD.plate.s / 2 * plan.unit).toFixed(3);

const BUB = plan.marks[plan.marks.length - 1].bubble;
const rep = mascotMotion(plan, FPS, SECONDS);
const rep60 = FPS === 60 ? rep : mascotMotion(plan, 60, SECONDS);

console.log(describeMascot(plan));
console.log(describeMotion(rep));

/* ---------- the voice, on the clip's own clock ----------
   the take laid into one track at the offset the clock worked out, with a short
   fade on each end so a trimmed silence cannot click. */
const VTRACK = new Float32Array(Math.ceil(SECONDS * SR));
{
  const a = Math.max(0, Math.round((EDGE.start - PRE) * SR));
  const b = Math.min(PCM.length, Math.round((EDGE.end + POST) * SR));
  const at = Math.round(off * SR) + a;
  const fade = Math.round(EDGE_FADE * SR);
  for (let i = a; i < b; i++) {
    const j = at + (i - a);
    if (j < 0 || j >= VTRACK.length) continue;
    let g = 1;
    if (i - a < fade) g = (i - a) / fade;
    else if (b - i < fade) g = (b - i) / fade;
    VTRACK[j] += PCM[i] * g;
  }
}

/* ---------- the cues ----------
   three kinds and nothing else. **there are no key ticks and there is no
   rumble**: the last cut had 27 of the first and one of the second and this
   round's brief took both out. the glitch carries the landing and the fault, and
   the module's own `pop` carries the pill. */
const cues = [
  { t: LAND, kind: 'glitch', opts: { len: 0.16, burst: 0.010, crush: 2300, f0: 280, f1: 92, seed: 0x22a1e0 },
    from: 'the hit he lands on' },
  ...mascotCues(plan).map(c => ({ ...c, from: 'the module\'s own cue for its own bubble' })),
  { t: END.at, kind: 'glitch', from: 'the cut' },
];
const { buf: sfx, report: sfxReport } = renderSfx(cues, SECONDS, {});

/* the five stutters, on one bus: three after the landing getting quieter as the
   picture settles, and two before the fault getting louder into it. same recipe
   every time, and the level is the only argument. */
const STUT_DB = [-29, -32, -35], PRE_DB = [-32, -27];
const STUT_ALL = [
  ...STUT.map((w, i) => ({ w, db: STUT_DB[i], seed: 0x3300 + i * 811, len: 0.05 + i * 0.008, what: 'stutter ' + (i + 1) + ' of three, after the landing' })),
  ...END.pre.map((w, i) => ({ w, db: PRE_DB[i], seed: 0x51a0 + i * 977, len: 0.05 + i * 0.014, what: 'stutter ' + (i + 1) + ' of two, into the fault' })),
];
for (const s of STUT_ALL) {
  const g = GL_WINDOWS.find(x => x.kind === 'stutter' && Math.abs(x.t0 - Math.round(s.w.t * FPS) / FPS) < 1e-9);
  const one = renderSfx([{
    t: g ? g.t0 : s.w.t, kind: 'glitch',
    opts: { len: s.len, burst: 0.004, crush: 3800, f0: 210, f1: 120, seed: s.seed },
    from: s.what,
  }], SECONDS, { gains: { glitch: s.db } });
  for (let j = 0; j < sfx.length; j++) sfx[j] += one.buf[j];
  sfxReport.push(...one.report);
}
sfxReport.sort((a, b) => a.t - b.t);

/* ---------- the mix ----------
   the read on top, the small bus of effects under it ducked while a word is
   being said. there is nothing at all playing under the read in this cut — every
   effect is after the last word — so the duck is a rule being kept rather than a
   level doing work, and the report says as much. */
const WAV = path.join(OUT, 'post22-mix.wav');
const RAW = path.join(OUT, 'post22-mix-raw.wav');
fs.mkdirSync(OUT, { recursive: true });
const env = voiceEnvelope(WORDS, SECONDS);
const mix = mixdown(VTRACK, sfx, env, { duck: DUCK, voiceGain: VOICE_TRIM });
const under = checkUnderVoice(mix.voiceOut, mix.bus);

/* ---------- and the loudness bisects rather than giving up ----------
   post19's lesson through post20's: a pass over the limiting allowance is a
   **ceiling** rather than a stop, so the last lift under it and the first one
   over it bracket the answer and the loop halves the gap. */
function pass(lift) {
  const buf = mix.out.slice();
  applyGain(buf, lift);
  const peak = limit(buf, SAMPLE_CEILING);
  writeWav(RAW, buf);
  const lu = loudness(ffmpeg, RAW);
  return { lift: +lift.toFixed(2), buf, peak, lufs: lu.lufs };
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
      const p = pass(mid); tries++;
      if (p.peak.reduction <= MAX_REDUCTION) { lo = mid; best = p; } else hi = mid;
    }
  }
} else if (wantLift < -0.05) { best = pass(wantLift); tries++; }
writeWav(WAV, best.buf);
const after = loudness(ffmpeg, WAV);
const peak = best.peak;
fs.rmSync(RAW, { force: true });

/* ---------- the beats, printed ---------- */
console.log('\n  the beats');
const QUIET_FROM = +(STUT[STUT.length - 1].t + 0.06).toFixed(2);
const POP_AT = +(BUB.in + BUBBLE.step * 2).toFixed(3);
const beats = [
  [0, 'a chat box in the middle of a black frame, empty, its caret blinking'],
  [WORDS[0].start, 'the read starts and the line types itself, cut to it, no ticks'],
  [WORDS[WORDS.length - 1].end, 'the last word: "' + WORDS[WORDS.length - 1].said + '"'],
  [SNAP.at, 'the caret goes out and the box is knocked down ' + BOX.travel + 'px over '
    + SNAP.for.toFixed(2) + 's with a ' + SNAP.bounce + 'px bounce'],
  [DROP.at, 'he starts falling, ' + DROP.from + 'px over ' + DROP.for.toFixed(2) + 's'],
  [LAND, 'he lands on a glitch hit and smashes to ' + (1 + SMASH.k).toFixed(2) + ' wide by '
    + (1 / (1 + SMASH.k)).toFixed(2) + ' tall. the green starts breathing'],
  ...STUT.map((w, i) => [w.t, 'stutter ' + (i + 1) + ' of three, ' + (w.force * 100).toFixed(0) + '% heat']),
  [QUIET_FROM, 'nothing sounds from here to ' + POP_AT.toFixed(2) + 's. the answer is voice free on purpose'],
  [MARK2, 'the second neutral mark: a two per cent settle before he speaks'],
  [BUB.in, 'the dots leave the crown'],
  [POP_AT, 'the pill pops. "' + BUB_TEXT + '"'],
  [BUB.leaving, 'it starts to go, and the fault takes it at ' + BUB.out.toFixed(2)],
  ...END.pre.map((w, i) => [w.t, 'stutter ' + (i + 1) + ' of two, into the fault']),
  [END.at, 'the fault. he, the box and the bubble are cut and the wordmark is born on that frame'],
  [SECONDS, 'end, after ' + (SECONDS - END.wmIn - END.wmFor).toFixed(2) + 's of the end card'],
].sort((a, b) => a[0] - b[0]);
for (const [t, what] of beats) console.log('    ' + t.toFixed(2).padStart(5) + 's  ' + what);

console.log('\n  the sound');
console.log(describeMix(sfxReport, {
  'the read': '1 take, ' + VOICES[VOICE].id + ', ' + WORDS.length + ' words from '
    + WORDS[0].start.toFixed(2) + ' to ' + READ_END.toFixed(2) + 's',
  'the duck': 'the bus is ducked to ' + DUCK + ' under a word. **nothing plays under the read '
    + 'in this cut** — every effect is after the last word — so it is a rule kept rather than '
    + 'a level doing work',
  'under the voice': 'worst ' + under.worst.db + ' dB at ' + under.worst.at + 's, '
    + under.over.length + ' window' + (under.over.length === 1 ? '' : 's') + ' over',
  'the lift': 'off the mix at ' + (zero.lufs == null ? '?' : zero.lufs) + ' LUFS, ' + TARGET_LUFS
    + ' wanted ' + wantLift.toFixed(2) + ' dB, took ' + best.lift.toFixed(2) + ' in ' + tries + ' pass'
    + (tries === 1 ? '' : 'es'),
  'the bus': (after.lufs == null ? '?' : after.lufs) + ' LUFS, peak ' + peak.peak
    + ' dBFS, limiter took ' + (peak.reduction > 0.01 ? peak.reduction.toFixed(2) + ' dB' : 'nothing'),
  'what is gone': 'the 27 key ticks and the rumble, both on instruction. no music, and no voice '
    + 'at all after ' + READ_END.toFixed(2) + 's',
}));

/* ---------- the fast things, measured before anything renders ----------
   the fall and the knock down are the only moves in this file that could outrun
   the shutter, so both are walked at sixty in the unit the argument is had in. */
const fastest = (fn, a, b) => {
  let d = 0, at = a;
  for (let f = Math.floor(a * 60); f <= Math.ceil(b * 60); f++) {
    const s = Math.abs(fn((f + 1) / 60) - fn(f / 60));
    if (s > d) { d = s; at = f / 60; }
  }
  return { d: +d.toFixed(2), at: +at.toFixed(3) };
};
const fallStep = fastest(fallAt, DROP.at - 0.05, LAND + 0.05);
const snapStep = fastest(boxDy, SNAP.at - 0.05, SNAP.at + SNAP.for + SNAP.bounceFor);
console.log('\n  the fast things, at sixty');
console.log('    the fall peaks at ' + fallStep.d + ' css px a frame at ' + fallStep.at + 's, which is '
  + (fallStep.d * DSF / SUB).toFixed(1) + ' device px between samples at ' + SUB + ' subframe'
  + (SUB === 1 ? '' : 's') + ' (ceiling ' + STEP_CEIL + ' css px)');
console.log('    the box peaks at ' + snapStep.d + ' css px a frame at ' + snapStep.at + 's');

const state = ONLY_ENCODE
  ? JSON.parse(fs.readFileSync(path.join(OUT, 'post22.json'), 'utf8'))
  : await render(plan, R);
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
if (!p.audio) fail.push('no audio track — the read did not mux');

/* ---------- the palette is still the site's ----------
   the one guard that reaches back into index.html. this file writes the eyes as
   three numbers and they have to be the dark theme's --accent, and **there must
   be no red left anywhere in it**, which is the whole of this round's item five
   asserted on the source rather than remembered. */
{
  const dark = brandTokens().dark;
  if (!/--bub:/.test(dark)) fail.push('index.html\'s dark block has no --bub, and the chat box is outlined in it');
  const m = /--accent:\s*#([0-9a-f]{6})/i.exec(dark);
  if (!m) fail.push('index.html\'s dark block has no --accent in it any more');
  else {
    const want = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16));
    if (want.join(',') !== NEON.join(',')) {
      fail.push('the eyes are rgb(' + NEON.join(',') + ') and the site\'s --accent is now rgb('
        + want.join(',') + ') — this clip paints with the site\'s green');
    }
  }
  /* and no red is left in what this file paints with. it is asserted on the
     page's own css rather than on this file's source, because the source
     contains this guard and a scan of it matches itself — which is exactly how
     the first run of this round failed. the slice starts after index.html's two
     token blocks, so the site's own `--red` sitting unused in the dark block is
     not mistaken for this clip using it. */
  const css = sceneHtml(plan);
  const mine = css.slice(css.indexOf('--mono:'));
  if (/--laser|var\(--red\)|rgba\(var\(--red/.test(mine)) {
    fail.push('there is still a red token in what this clip paints with, and this cut has no red in it');
  }
  if (!/rgba\(var\(--neon\)/.test(mine)) fail.push('the eye glow is not drawn in the green');
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
{
  const got = plan.marks.map(m => m.state);
  if (got.join(',') !== 'neutral,neutral') fail.push('the states are ' + got.join(', ') + ', wanted neutral, neutral');
  if (plan.hands || plan.hand) fail.push('the plan draws hands, and the brief says none');
  if (plan.marks.some(m => m.hands || m.yap)) fail.push('a mark asks for a hand, and this clip has none');
}
for (const st of rep60.states) {
  if (st.entryFrames == null) fail.push(st.state + ' never reached its own mark');
  if (!(st.overshoot > 1)) fail.push(st.state + ' arrives with no overshoot');
}
if (rep60.poses.length) fail.push('the report has ' + rep60.poses.length + ' hand poses in it, wanted none');
if (rep60.outside.units > 0) {
  fail.push('feature ink lands ' + rep60.outside.units.toFixed(2) + ' units outside the head silhouette');
}
if (rep60.blinks.repeatsInARow) fail.push(rep60.blinks.repeatsInARow + ' blinks repeat the one before them');
if (rep60.frozenFrames) fail.push(rep60.frozenFrames + ' frames where the face is not moving at all');
{
  const offX = +((VW / 2 - (plan.box.left + halfBox)) * DSF).toFixed(2);
  console.log('  he stands ' + (offX / DSF).toFixed(1) + ' css px left of centre, and the pill is why');
  if (Math.abs(offX / DSF - LEFT_OF_CENTRE) > 0.5) fail.push('his box is not where LEFT_OF_CENTRE put it');
}
{
  const inBeat = plan.idle.blinks.filter(b => b.t >= 7.00 && b.t < END.at);
  console.log('  blinks: ' + plan.idle.blinks.length + ' in the film, '
    + plan.idle.blinks.filter(b => b.t >= LAND && b.t < END.at).length + ' while he is on his mark, '
    + inBeat.length + ' in the last beat at ' + inBeat.map(b => b.t.toFixed(2)).join(', '));
  if (inBeat.length !== 1) fail.push('there are ' + inBeat.length + ' blinks between 7.00s and the fault, '
    + 'and the brief asks for one — walk the seed');
}

/* ---------- the read, and the picture cut to it ---------- */
{
  if (TAKE.timing !== 'engine') fail.push('the take is not on engine timings');
  const said = SAID.split(' '), shown = COPY.split(' ');
  if (said.length !== shown.length) fail.push('the spoken line and the typed line are different lengths');
  /* one deliberate difference and it is a capital. anything else between the two
     is a mistake rather than a decision. */
  const differ = said.filter((w, i) => w !== shown[i]);
  if (said.join(' ').toLowerCase() !== shown.join(' ').toLowerCase()) {
    fail.push('the spoken line and the typed line are not the same words: "' + SAID + '" / "' + COPY + '"');
  }
  if (differ.length !== 1 || differ[0] !== 'AI') {
    fail.push('the only difference between the take and the screen should be `AI` for `ai`, and it is '
      + (differ.length ? differ.join(', ') : 'nothing'));
  }
  for (let i = 0; i < WORDS.length; i++) {
    if (WORDS[i].said.toLowerCase().replace(/[^a-z]/g, '') !== said[i].toLowerCase().replace(/[^a-z]/g, '')) {
      fail.push('word ' + i + ' came back as "' + WORDS[i].said + '" and the line says "' + said[i] + '"');
    }
    if (i && !(WORDS[i].start >= WORDS[i - 1].end - 0.02)) fail.push('the words overlap at ' + i);
  }
  /* the read has a ceiling, because the back half of the clock is pinned. the
     hold beat between his landing and the mark that places the bubble may not go
     under half a second, or the fall and the thought are one event. */
  const hold = +(MARK2 - LAND).toFixed(3);
  console.log('  the read bought a landing at ' + LAND.toFixed(2) + 's and a hold beat of '
    + hold.toFixed(2) + 's before the bubble\'s own mark');
  if (hold < 0.50) {
    fail.push('the read runs long: he lands at ' + LAND.toFixed(2) + ' and the pinned mark is at '
      + MARK2 + ', a hold of ' + hold.toFixed(2) + 's — shorten the copy or unpin the bubble');
  }
  if (READ_END > SNAP.at + 0.01) fail.push('the box is knocked down while the read is still going');
  if (WORDS[0].start < 0.10) fail.push('the read starts at ' + WORDS[0].start + 's, with no frame to establish the box');
}

/* ---------- the typing ---------- */
{
  if (charsAt(WORDS[0].start - 0.01) !== 0) fail.push('the line has started before the first word');
  if (charsAt(WORDS[WORDS.length - 1].end) !== COPY.length) fail.push('the line is not finished on the last word');
  if (charsAt(SNAP.at) !== COPY.length) fail.push('the line is not finished when the box goes down');
  /* every character is inside its own word's window, which is the whole of "the
     typing is the read". */
  {
    let at = 0, bad = null;
    for (const w of WORDS) {
      const lead = at ? 1 : 0, n = w.word.length + lead;
      for (let k = 0; k < n; k++) {
        const c = CHARS[at + k];
        if (c < w.start - 1e-6 || c > w.end + 1e-6) bad = bad || { w: w.word, c };
      }
      at += n;
    }
    if (bad) fail.push('a character of "' + bad.w + '" is placed at ' + bad.c + 's, outside its own word');
  }
  /* a character a frame at most, or two letters arrive on one frame and the
     typing reads as a paste. */
  let biggest = 0, biggestAt = 0;
  for (let f = 1; f < Math.round(SNAP.at * 60); f++) {
    const d = charsAt(f / 60) - charsAt((f - 1) / 60);
    if (d > biggest) { biggest = d; biggestAt = +(f / 60).toFixed(2); }
  }
  console.log('  the typing: ' + COPY.length + ' characters cut to the read, at most ' + biggest
    + ' arriving on one frame at sixty (at ' + biggestAt + 's)');
  if (biggest > 2) fail.push(biggest + ' characters arrive on one frame at sixty, at ' + biggestAt + 's');
  /* the copy, on what reaches the screen. */
  if (COPY !== COPY.toLowerCase()) fail.push('the typed line is not lower case');
  for (const [what, s] of [['the typed line', COPY], ['the bubble', BUB_TEXT], ['the take', SAID]]) {
    if (/['\u2019]/.test(s)) fail.push(what + ' carries an apostrophe: "' + s + '"');
    if (/[!]/.test(s)) fail.push(what + ' carries an exclamation mark');
    if (/[—–]/.test(s) || /\s-\s/.test(s)) fail.push(what + ' carries a punctuation dash');
  }
  if (BUB_TEXT !== BUB_TEXT.toUpperCase()) fail.push('the bubble is not in caps: "' + BUB_TEXT + '"');
}

/* ---------- the box ---------- */
{
  const b = state.built.box, up = state.boxUp, down = state.boxDown;
  if (!/Manrope/.test(b.font)) fail.push('the typed line is not set in Manrope: ' + b.font);
  if (b.stoppedBy) fail.push('the box fit ran all the way down and was still stopped by ' + b.stoppedBy);
  if (b.capPx < BOX.minCapPx) fail.push('the typed line caps measure ' + b.capPx + ' device px, floor is ' + BOX.minCapPx);
  if (b.lines > 2) fail.push('the typed line wraps to ' + b.lines + ' lines and the box is drawn for two');
  for (const [where, r] of [['on its first line', up], ['on its settled line', down]]) {
    for (const k of ['left', 'top', 'right', 'bottom']) {
      if (r[k] < floor - 0.5) {
        fail.push('the box ' + where + ' comes within ' + Math.round(r[k]) + 'px of the ' + k + ' border');
      }
    }
  }
  if (parseFloat(up.stroke) < 1.5) fail.push('the box outline resolved to ' + up.stroke + ', which h.264 will eat');
  /* it slides down and it **stays**. this is the round's own instruction and it
     is asserted rather than remembered: it does not leave the frame, it does not
     fade, and it is still there on the last frame before the fault. */
  if (boxDy(0) !== 0) fail.push('the box has moved before the read is over');
  if (boxDy(SNAP.at) !== 0) fail.push('the box has moved before it is knocked down');
  const settled = boxDy(SNAP.at + SNAP.for + SNAP.bounceFor + 0.2);
  console.log('  the box goes down ' + settled + ' css px and stays: its top settles at '
    + (BOX.y + settled).toFixed(0) + ' of ' + VH + ', ' + down.bottom + ' device px off the bottom border');
  if (Math.abs(settled - BOX.travel) > 0.5) fail.push('the box settles at ' + settled + ' rather than ' + BOX.travel);
  if (Math.abs(boxDy(END.at - 0.02) - BOX.travel) > 0.5) fail.push('the box has moved again after it settled');
  /* walked on the **output** frames rather than on a sixty grid converted to
     them: `round(f * FPS / 60)` on the frame just under the fault rounds up onto
     it, which is the cut frame, and the box is correctly gone there. */
  for (let f = 0; f < Math.round(END.at * FPS); f++) {
    const o = frameAt(plan, compose(plan, f / FPS, R), f / FPS, f);
    if (o.box.o !== 1) { fail.push('the box is not fully on the frame at ' + (f / FPS).toFixed(2) + 's'); break; }
  }
  if (snapStep.d > STEP_CEIL) {
    fail.push('the box moves ' + snapStep.d + ' css px on one frame at 60, ceiling is ' + STEP_CEIL);
  }
  /* and he does not sit on it. */
  if (state.gap < 8) {
    fail.push('his chin comes within ' + state.gap + ' css px of the top of the box at ' + state.gapAt + 's');
  }
}

/* ---------- the fall ---------- */
{
  if (fallStep.d > STEP_CEIL) {
    fail.push('the fall moves ' + fallStep.d + ' css px on one frame at 60, ceiling is ' + STEP_CEIL);
  }
  if (fallAt(DROP.at) !== -DROP.from) fail.push('the fall does not start ' + DROP.from + 'px above his mark');
  if (Math.abs(fallAt(LAND)) > 1e-9 || !(fallAt(LAND - 0.002) < 0)) {
    fail.push('the fall does not arrive at nought on its landing frame');
  }
  /* he is off the top of the frame when he starts. `headRect` in the air is
     measured on composed frames, so this is the ink rather than the plan. the
     other three sides are held to the floor even while he is falling. */
  if (!(state.air.highest < 0)) {
    fail.push('he starts ' + state.air.highest + 'px inside the top border rather than above it');
  }
  if (state.air.near < floor - 0.5) {
    fail.push('while he is falling the head comes within ' + Math.round(state.air.near)
      + 'px of a side or the bottom at ' + state.air.t + 's');
  }
  /* the smash is a compression and it comes back to nothing. */
  if (!(squashAt(LAND + SMASH.flat) > SMASH.k * 0.9)) fail.push('the smash never reaches its own depth');
  if (squashAt(LAND + SMASH.flat + SMASH.back) !== 0) fail.push('the smash does not come back to rest');
  /* **one dip below zero, not one zero crossing.** post20's note says the damped
     cosine "goes below zero exactly once", and a single excursion is two
     crossings — down and back. counting crossings and asking for one is asking
     the curve to end on the wrong side of the axis, which is what the first run
     of this round caught. so what is counted is the number of contiguous runs
     below nought, and there is one: he stretches once on the way back out. */
  let runs = 0, below = false;
  for (let f = Math.round((LAND + SMASH.flat) * 60); f < Math.round((LAND + SMASH.flat + SMASH.back) * 60); f++) {
    const v = squashAt(f / 60);
    if (v < 0 && !below) runs++;
    below = v < 0;
  }
  if (runs !== 1) fail.push('the smash dips below zero ' + runs + ' times, and it may dip once');
  if (DROP.at < SNAP.at) fail.push('he starts falling before the box is knocked down');
  if (LAND > MARK2) fail.push('he lands after the mark that places the bubble');
}

/* ---------- the bubble, held from the last cut ---------- */
{
  const s = state.bubSafe;
  if (!s) fail.push('the bubble was not on screen at ' + state.bubAt + 's');
  else {
    for (const k of ['left', 'top', 'right', 'bottom']) {
      if (s[k] < floor - 0.5) {
        fail.push('the bubble comes within ' + Math.round(s[k]) + 'px of the ' + k
          + ' border — move LEFT_OF_CENTRE to ' + (LEFT_OF_CENTRE + Math.ceil((floor - s[k]) / DSF)));
      }
    }
  }
  if (state.bubCaps.capPx < BUBBLE.minCap) {
    fail.push('the bubble caps measure ' + state.bubCaps.capPx + ' device px, floor is ' + BUBBLE.minCap);
  }
  if (!/Manrope/.test(state.bubCaps.font)) fail.push('the bubble is not set in Manrope: ' + state.bubCaps.font);
  if (BUB.words !== 4) fail.push('the bubble is ' + BUB.words + ' words and the line is four');
  /* the numbers that were signed off, asserted so this round cannot have moved
     them by accident. */
  if (Math.abs(BUB.in - 6.32) > 0.005) fail.push('the bubble now starts at ' + BUB.in + ' rather than 6.32');
  if (Math.abs(POP_AT - 6.46) > 0.005) fail.push('the pill now pops at ' + POP_AT + ' rather than 6.46');
  if (Math.abs(BUB.out - END.at) > 0.02) {
    fail.push('the bubble is out at ' + BUB.out + 's rather than on the fault at ' + END.at);
  }
  const pops = sfxReport.filter(r => r.kind === 'pop');
  if (pops.length !== 1) fail.push('there are ' + pops.length + ' pops for one bubble');
  if (pops[0] && Math.abs(pops[0].t - POP_AT) > 0.006) fail.push('the pop is not on the pill');
}

/* ---------- the green ---------- */
{
  if (greenAt(DROP.at - 0.02) !== 0) fail.push('the eyes are lit before he is on the frame');
  if (greenAt(DROP.at) !== 1) fail.push('the eyes are not lit on the frame he starts falling');
  if (greenAt(END.at - 0.02) !== 1) fail.push('the eyes have gone out before the fault');
  /* the pulse is a breath rather than a flicker: it never lets go completely and
     it turns over at least twice while he is on his mark. */
  let lo = 2, hi = -1, turns = 0, up = null;
  for (let f = Math.round(LAND * 60); f < Math.round(END.at * 60); f++) {
    const a = pulseAt(f / 60), b = pulseAt((f + 1) / 60);
    lo = Math.min(lo, a); hi = Math.max(hi, a);
    const dir = b > a;
    if (up != null && dir !== up) turns++;
    up = dir;
  }
  console.log('  the glow breathes between ' + lo.toFixed(2) + ' and ' + hi.toFixed(2)
    + ', turning over ' + turns + ' times on a ' + PULSE.period.toFixed(2) + 's period');
  if (lo < PULSE.lo - 0.01) fail.push('the glow drops to ' + lo.toFixed(2) + ', under its own floor');
  if (turns < 2) fail.push('the glow turns over ' + turns + ' times, which is not breathing');
  /* nothing lit survives the fault. */
  const cutF = Math.round(END.at * FPS);
  const on = frameAt(plan, compose(plan, cutF / FPS, R), cutF / FPS, cutF);
  if (on.eyeGlow !== 0) fail.push('the eye glow survives the fault');
  /* and the glow is the eyes and nothing else: two layers, both 84px, and no
     third layer anywhere near the head. */
  if (on.eyes.length !== 2) fail.push('there are ' + on.eyes.length + ' eye glows and there are two eyes');
}

/* every cue is inside the clip and none of them was cut off by the end of it. */
for (const r of sfxReport) {
  if (r.cut) fail.push('the ' + r.kind + ' cue at ' + r.t + 's was cut off by the end of the clip');
  if (r.t < 0 || r.t > SECONDS) fail.push('the ' + r.kind + ' cue at ' + r.t + 's is outside the clip');
}
/* the bus carries two kinds and no more. **the key ticks and the rumble are gone
   on instruction and this is where that is asserted** rather than remembered: if
   either comes back the run fails. */
{
  const kinds = [...new Set(sfxReport.map(r => r.kind))].sort();
  const wantKinds = ['glitch', 'pop'];
  if (kinds.join(',') !== wantKinds.join(',')) {
    fail.push('the bus carries ' + kinds.join(', ') + ', wanted ' + wantKinds.join(', '));
  }
  if (sfxReport.some(r => r.kind === 'key')) fail.push('a key tick is back, and this cut has none');
  if (sfxReport.some(r => r.kind === 'hum' || r.kind === 'popDeep')) fail.push('a rumble is back, and this cut has none');
  /* and the answer is voice free: the read is over long before the pill and
     nothing after it is a voice. */
  if (READ_END > BUB.in) fail.push('the read is still running when the bubble arrives');
  let lastVoice = 0;
  for (let i = 0; i < VTRACK.length; i++) if (Math.abs(VTRACK[i]) > 1e-4) lastVoice = i / SR;
  console.log('  the voice track is silent from ' + lastVoice.toFixed(2) + 's, which is '
    + (BUB.in - lastVoice).toFixed(2) + 's before the bubble and ' + (END.at - lastVoice).toFixed(2)
    + 's before the fault');
  if (lastVoice > READ_END + 0.20) fail.push('there is voice at ' + lastVoice.toFixed(2) + 's, after the read');
}
if (under.over.length) {
  fail.push('the bus is over the read on ' + under.over.length + ' windows, worst '
    + under.worst.db + ' dB at ' + under.worst.at + 's');
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

/* ---------- the two cuts ---------- */
{
  const at = f => frameAt(plan, compose(plan, f / FPS, R), f / FPS, f);
  const apF = Math.round(DROP.at * FPS), cutF = Math.round(END.at * FPS);
  if (at(0).mo !== 0) fail.push('he is on frame zero, and there is no mascot until he falls');
  if (at(apF - 1).mo !== 0) fail.push('he is on the frame before he starts falling');
  if (at(apF).mo !== 1) fail.push('he is not on the frame he starts falling on');
  if (at(cutF - 1).mo !== 1) fail.push('he is already gone before the fault');
  if (at(cutF).mo !== 0) fail.push('he is still on the frame the wordmark arrives on');
  if (at(cutF).box.o !== 0) fail.push('the box is still on the frame the wordmark arrives on');
  if (!(at(cutF).wm.o > 0)) fail.push('the wordmark is not born on the fault frame');
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
  console.log('  the glitch: ' + here.on + ' of ' + here.N + ' frames ('
    + (here.on / here.N * 100).toFixed(1) + '%), '
    + here.per.map((c, i) => GL_WINDOWS[i].kind + ' ' + c).join(', ')
    + ', ' + here.flashes + ' white frame');
  if (!here.on) fail.push('nothing glitches on any frame');
  const endFrom = Math.round(END.pre[0].t * 60);
  const endFrames = at60.N - endFrom;
  let endOn = 0;
  for (let f = endFrom; f < at60.N; f++) {
    const g = glitchAt(f, 60, GL_WINDOWS_60);
    if (g.heat > 0 || g.flash > 0) endOn++;
  }
  console.log('    and against the ending it lives in, at sixty: ' + endOn + ' of ' + endFrames
    + ' frames from ' + END.pre[0].t.toFixed(2) + 's (' + (endOn / endFrames * 100).toFixed(1)
    + '%, ceiling 30%)');
  if (endOn / endFrames > 0.30) fail.push('the ending glitches on ' + (endOn / endFrames * 100).toFixed(1) + '% of its own frames');
  for (let i = 0; i < GL_WINDOWS.length; i++) {
    if (!here.per[i]) fail.push('glitch window ' + i + ' (' + GL_WINDOWS[i].kind + ') fired on no frames at ' + FPS + 'fps');
    if (!at60.per[i]) fail.push('glitch window ' + i + ' (' + GL_WINDOWS[i].kind + ') fired on no frames at 60fps');
  }
  if (here.flashes !== 1) fail.push(here.flashes + ' white frames, and there may be exactly one');
  const cleanFrom = Math.round((END.at + END.hard + END.tail + END.clean) * FPS);
  if (here.lastOn >= cleanFrom) fail.push('the fault is still firing at frame ' + here.lastOn);
  for (let i = 1; i < GL_WINDOWS.length; i++) {
    if (GL_WINDOWS[i].t0 < GL_WINDOWS[i - 1].t1 - 1e-9) {
      fail.push('glitch windows ' + (i - 1) + ' and ' + i + ' overlap');
    }
  }
  /* the three that follow the landing: all of them inside the second after it,
     all of them weaker than the hit that came first, and all of them over before
     the mark that places the bubble. */
  const after = GL_WINDOWS.filter(w => w.kind === 'stutter' && w.t0 < MARK2);
  if (after.length !== 3) fail.push('there are ' + after.length + ' stutters after the landing, wanted three');
  for (let i = 0; i < after.length; i++) {
    if (after[i].t0 < LAND || after[i].t1 > LAND + 1.0 + 1e-9) {
      fail.push('stutter ' + (i + 1) + ' is outside the second after the landing');
    }
    if (i && !(after[i].force < after[i - 1].force)) fail.push('stutter ' + (i + 1) + ' is not weaker than the one before it');
  }
  for (let i = 1; i < END.pre.length; i++) {
    if (!(END.pre[i].force > END.pre[i - 1].force)) {
      fail.push('the fault\'s stutter ' + (i + 1) + ' is not louder than the one before it');
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
if (peak.reduction > MAX_REDUCTION + 1e-6) {
  fail.push('the limiter took ' + peak.reduction.toFixed(2) + ' dB, over the ' + MAX_REDUCTION + ' dB this clip allows');
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
console.log('    the clip is ' + SECONDS.toFixed(2) + 's and the back half of the clock is pinned:'
  + ' the bubble at ' + BUB.in.toFixed(2) + ' and the fault at ' + END.at.toFixed(2)
  + ' are held from the last cut, so the read has a ceiling rather than a free run');
console.log('    the knock down, the fall and the smash are post20\'s tables and post20\'s two'
  + ' functions, unchanged. only the box\'s travel is this clip\'s, because the box is not that'
  + ' clip\'s caption block');
console.log('    the box says `ai` and the take says `AI`, which is the one deliberate difference'
  + ' between the screen and the read');
console.log('    the glitch hit is on his landing now rather than on a materialisation, because'
  + ' he arrives by falling. the three stutters follow it, which is the relationship the brief asked for');

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
