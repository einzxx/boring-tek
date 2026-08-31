/* the boring tek — post12, the sting.

   five seconds, dark only, 1080x1920. the mascot alone in the middle of a black
   frame. he fades up, says hi, holds still, farts, giggles about it, and the
   wordmark snaps in over a glitch. there is no voice, there are no captions and
   there is nothing written on the screen until the last half second. the sounds
   carry the whole thing.

     node post12.mjs                     1080x1920, 60fps, shutter closed
     DEMO_FPS=12 node post12.mjs         the fast preview pass
     node post12.mjs --blur              60fps with the shutter open
     node post12.mjs --blur=6            a wider shutter
     node post12.mjs --keep-frames       leave the jpegs on disk
     node post12.mjs --encode-only       re-encode from kept frames

   one output, one path, overwritten every run:

     demo/out/post12-dark-1080x1920.mp4

   ---------- why this one exists ----------

   every clip in demo/ before this one is an argument. post9 pitches, post10 is
   angry, post11 explains for forty seven seconds. none of them is *likeable*,
   and a feed is not only won by being right. this is the mascot being a small
   robot for five seconds with a joke in the middle, and the entire brand content
   is three words at the end.

   it is also the first clip here with **no words in it at all** until the
   wordmark. no captions, no read, no bubble. that is a real constraint rather
   than a saving: with nothing written down, every beat has to be legible from
   the picture and the sound alone, which is why the timings below are derived
   off the rig rather than typed against it.

   ---------- what is not in this file ----------

   the mascot. `lib/mascot.mjs` is used exactly as it is: the plan, the frame,
   the preflight, the css, the markup and the page runtime all come out of the
   module and nothing here reaches inside it. he is head only — there is no body
   in that module and this clip does not invent one.

   two things this file does do to the plan, and both are honest arithmetic on
   its output rather than a change to it. `plan.box` is rewritten to put him in
   the **middle** of the safe band instead of in a bottom corner, because
   `planMascot` places by corner and this clip wants him centred; `headRect`,
   `mascotCss` and `mascotPagePlan` all read `plan.box` when they are called, so
   moving it before any of them run is the same as having been placed there. and
   `size` is 148 rather than the default 128, which puts the plate at 277 device
   px against the module's own 220 to 280 window — larger than his corner size,
   which is what the brief asked for, and still a number the module checks.

   ---------- the sound ----------

   four new voices in `lib/sfx.mjs`: `hi`, `fart`, `giggle` and `glitch`. they
   are synthesised sample by sample like the twelve before them and there is
   still not one audio file in this repo. see that file for each recipe.

   **the hi was built twice.** once as the two tone bleep that shipped, and once
   as an edge tts "hi" pitched up and bit crushed, which is the other half of the
   brief. the comparison is written down under `THE HI, BOTH WAYS` below, along
   with the numbers it was decided on and the one thing those numbers cannot
   settle.

   ---------- the shutter, and what rides it ----------

   post10's rule, unchanged and it matters more here than anywhere. with
   `--blur` every output frame is captured four times inside its own sixtieth of
   a second and the four are averaged. anything written against `t` gets smeared
   by that, which is what a hop, a puff and a snapping wordmark all want. the
   glitch does not: a one frame rgb split written against `t` would be on for one
   subframe of four and land at a quarter strength. so the glitch and the cut
   that takes the mascot off the screen are computed once per **output** frame
   and held across every capture of it. `glitchAt` takes `f`; everything else
   takes `t`. */

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
  STATES, STAGE, SAFE, HEAD_PX, GRID,
} from './lib/mascot.mjs';
import { renderSfx, writeWav, applyGain, limit, loudness } from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post12');
const SUBS = path.join(OUT, 'subframes-post12');
const VERIFY = path.join(OUT, 'verify-post12');

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
const BLUR_ARG = (argv.find(a => a.startsWith('--blur')) || '').split('=')[1];
const BLUR = argv.some(a => a.startsWith('--blur'));
/* four is where a 60fps shutter stops reading as four ghosts and starts reading
   as one moving thing. post10's number and the reason is the same one. */
const SUB = BLUR ? Math.max(2, Math.min(12, Number(BLUR_ARG) || 4)) : 1;
const SUBSTEP = STEP / SUB;

/* ---------- where he stands ----------
   dead centre of the **safe band**, not of the frame. the platforms take 180
   device px off the top and 220 off the bottom, so the middle of what a viewer
   actually sees is ten css px above the middle of the file, and a thing centred
   on the frame reads as a shade low. the wordmark lands on the same line, which
   is the whole reason it is one number: he is replaced rather than followed. */
const CENTRE_Y = (SAFE_CSS.top + (VH - SAFE_CSS.bottom)) / 2;
const SIZE = 148;

/* ---------- the cut ----------
   four marks and every one of them is a beat in the brief, in order. the room
   between them is not taste: `planMascot` refuses a mark that has no room for
   its own entrance, a hold and its exit, so the floors below are the states'
   own and the clip is as short as these four states allow.

     neutral     he fades up, arrives at rest and is alive. blinking, drifting.
     agreeing    the hi. it goes **up** first and lands on a contact squash with
                 a warm half blink on it, which is "small squash and rise" and is
                 also, with a rising bleep on the contact, unmistakably a nod
                 hello. its hold is the beat of nothing.
     surprised   the fart. pulls back and down, snaps up with a stretch, eyes to
                 two and a half times their height, brows high. that is "eyes
                 widen", and the `turn` on it is "he tilts from it": the puff
                 goes to screen left and he turns away from it.
     delighted   the giggle. two hops with real lift and the eyes squashed into
                 arcs, which is a laugh with no mouth to laugh with.

   the pause is the part worth defending. it is not a gap left over between two
   marks — it is `agreeing`'s own hold plus its exit back to rest, about seven
   tenths of a second in which the only things moving are the idle drift, a
   saccade and a blink. a joke needs the room before it more than it needs the
   room after it, and this clip spends a seventh of itself on nothing. */
const CUT = {
  marks: [
    { t: 0.06, state: 'neutral' },
    { t: 1.14, state: 'agreeing' },
    /* the turn is positive, which is a turn to the mascot's right and so to
       screen right. the puff leaves to screen left. away from it, not at it. */
    { t: 2.38, state: 'surprised', turn: 0.30, turnFor: 0.34 },
    { t: 3.55, state: 'delighted' },
  ],
  seconds: 5.05,
};

/* how long he takes to arrive out of nothing. opacity only, and that is
   deliberate: a drift in would move the head, and every clearance number in the
   report is computed off `plan.box` from the geometry. a fade cannot make one of
   them wrong. the glow rides it, so what a viewer sees is a face coming up out
   of the black rather than a sticker being faded in. */
const FADE = { for: 0.42 };

/* ---------- the puff ----------
   drawn in code, like everything else here. nine soft blobs of white light,
   born under him a few hundredths apart, expanding as they travel and gone
   before they reach anything. no asset, no sprite, no gradient image.

   three things make it read as gas rather than as bubbles. they are born from
   **one point** and spread, so it is one event coming apart. they **grow** as
   they fade, because a cloud dissipating gets bigger and thinner at the same
   time and one without the other reads as either a balloon or a lamp. and they
   drift **up** as they go, slowly and increasingly, because gas does.

   they are blurred and screen blended, so on a black frame they add light
   rather than sit on it as grey discs — the same reason post10's noise burst is
   screen blended. `soft` is a blur in css px and it is set once per blob and
   never animated: animating a blur radius re-rasterises the layer every frame,
   which is the one thing in this file that would cost a render real time. */
const PUFF = {
  at: 2.34,                    /* four hundredths before he moves. the cause first. */
  n: 11,
  /* just outside the bottom left of the silhouette. the head is a 139 css px
     circle centred on the frame, so its lower left quadrant runs out to about
     (221, 519) — this is below and a little left of that, which is where a thing
     escaping from under him would first be seen.

     the first cut put the origin at (258, 536) and every blob was born inside
     the head's own thirty pixel glow, so the whole puff read as the glow leaking
     downward rather than as anything leaving. the frames said so and this is the
     fix: born outside the halo, and travelling far enough to separate from it. */
  from: { x: 244, y: 534 },
  spread: { x: 13, y: 9 },
  stagger: 0.030,
  life: [0.66, 1.08],
  /* **how far it goes, not how fast.** a velocity plus a life is two numbers
     that multiply into the one thing that actually matters, which is where the
     blob ends up — and where it ends up is what the safe area cares about. so
     the distance is the parameter and the velocity is derived from it, and the
     longest lived blob does not quietly become the one that leaves the frame. */
  dist: [58, 104],             /* css px travelled, to screen left */
  vy: [-4, -16],               /* and up a little, because gas rises */
  rise: [12, 34],              /* plus that much again as an acceleration */
  d0: [13, 22],                /* the diameter it is born at */
  grow: [2.2, 3.0],            /* and what it multiplies by before it is gone */
  soft: [4, 10],
  peak: [0.58, 0.88],
  seed: 0x7ac31f,
};

/* ---------- the end ----------
   a glitch, then three words. the glitch is post11's language and post10's
   machinery: a hard stretch where every channel is at full and the bands move
   every frame, then a short stutter that fires on some frames and not others.
   nothing here is longer than a fifth of a second, because a tv glitch that
   outstays that is a broken render rather than a fault.

   the mascot is **cut**, not faded: he is on the frame before the glitch starts
   and gone on the frame after it, which is what a cut is. the wordmark is born
   on the **same frame**, so the first thing it does is get torn — it glitches
   *in* rather than appearing and then being glitched.

   the two used to be two hundredths apart and a rendered still is what said no:
   at the preview rate that gap is a whole frame with the head already cut, the
   words not yet arrived and nothing on screen but the bloom, which reads as a
   dropped frame rather than as a cut. one exchanges for the other on one frame
   now, and there is never an instant with neither of them on it. */
const END = {
  at: 4.56,          /* the hit */
  hard: 0.10,        /* full heat, every frame */
  tail: 0.13,        /* the stutter after it */
  wmIn: 4.56,        /* and the wordmark is born on that same frame */
  wmFor: 0.09,       /* and is fully there five frames later at sixty */
  clean: 0.06,       /* how long after the tail before nothing may glitch at all */
};

/* ---------- the wordmark ----------
   three lines, centred, on the line his head was on. michroma, which is the
   site's display face and the only place it appears in this clip. it is fitted
   in the page rather than guessed: michroma is proportional and
   `letter-spacing` is nearly a fifth of an em, so the width of `BORING` is a
   measurement, not a ratio.

   330 css px is 660 device px, against a safe band 800 device px wide. that is
   70 device px of air either side of the widest line on top of the platform's
   own margin, and at that size the caps measure about eighty device px, which
   is legible on a phone held at arm's length with the sound off. */
const WM = {
  lines: ['THE', 'BORING', 'TEK'],
  w: 330,            /* the widest line, in css px */
  lh: 1.16,
  minCapPx: 56,      /* device px, and it clears this by a mile. a floor, not a target */
};

/* the glitch's own numbers, at full heat. post10's, with the shake pulled in:
   that clip glitches a frame that has captions and a bubble in it and can afford
   to throw the whole thing about, and this one glitches three words that have to
   be read a fifth of a second later. */
const GL = {
  shakeX: 11, shakeY: 6,
  split: 7.0,           /* css px of rgb separation */
  bandDx: 62,
  bands: 2,
  noise: [0.08, 0.22],
  /* ---------- the flash, and what it is not ----------
     it was a full frame white rect at 0.40 and the frame it fired on came back
     as **an even grey card**: the whole screen at forty per cent white with the
     noise layer screen blended over the top of it, on a frame where the mascot
     had already been cut and the wordmark had not yet arrived. that is not a
     glitch, it is a missing frame, and only a rendered still says so — every
     guard in this file was green on it.

     so it is a bloom rather than a wash: a soft radial at the centre of the
     frame, where the head was and where the words are about to be, at a third
     of the opacity. it lights the middle and leaves the edges black, which is
     what a tube firing looks like and is also, incidentally, the only version of
     this that a platform will not flag as a strobe. */
  flash: 0.30,
  flashSize: 420,       /* css px across the bloom */
  calmFrom: 0.86,
};

/* the encoder. crf 17 like the mascot test rather than post10's 22: this frame
   is nearly all flat black with a soft glow across it, which is exactly what a
   codec bands, and there is no film grain here to dither it. */
const CRF = 17;

/* ---------- the mix, and the ceiling that wins it ----------
   there is no voice in this clip, so `mixdown` is the wrong tool: it exists to
   put a bus under a read and there is nothing here to put it under. what
   survives of the house rule is the part that matters — the bus is scaled once
   and both the loudness and the peak are measured on the finished file rather
   than asserted.

   **and on this clip the ceiling wins, by about four decibels.** that is worth
   writing down rather than hiding, because it is a property of what a sting is.
   the target below is post10's. hitting it here would mean lifting the bus 25.6
   dB, which puts the loudest sound two and a half decibels *over* full scale and
   asks the limiter to take three and a half back — and this clip is five sounds
   and nothing else, so three and a half decibels of limiting is not glue, it is
   the glitch losing its snap and the fart losing its edge. the whole point of
   the balance in GAINS is the relationship between those five, and a limiter
   working that hard is a second opinion about it.

   so the bus is peak normalised to `SAMPLE_CEILING` instead, the loudness is
   reported as a fact rather than as a target, and the limiter is a backstop that
   should do nothing. the integrated figure comes out around -18, which is the
   honest description of a clip that is silent for three quarters of its length:
   every platform normalises on the same measure and will lift it back, and the
   loudest single event in the file is still sitting a decibel and a half under
   full scale where it belongs.

   `SAMPLE_CEILING` is lower than `PEAK_CEILING` on purpose, and it is post5's
   lesson: a sample peak limiter does not hold a true peak. the limiter here
   works on samples, ebur128 measures between them, and aac adds its own
   overshoot on top — 0.8 dB of margin is what covers both, measured rather than
   guessed. */
const TARGET_LUFS = -14;
const SAMPLE_CEILING = -1.8;
const PEAK_CEILING = -1.0;
/* the backstop should do nothing. if it starts working, the peak normalisation
   above stopped being the thing deciding the mix. */
const MAX_REDUCTION = 0.5;
/* and a floor, so "the ceiling won" can never quietly become "the clip is
   inaudible". */
const MIN_LUFS = -20;

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
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))));
const lerp = (a, b, p) => a + (b - a) * p;

function prng(seed) {
  let x = seed | 0 || 0x1a2b3c;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x |= 0; return (x >>> 0) / 4294967296; };
}

/* ---------- the puff, as a plan ----------
   worked out once, before a browser is opened, so the blobs are the same blobs
   on every run and the guard below can measure how far they get without
   rendering anything. */
function planPuff() {
  const r = prng(PUFF.seed);
  return Array.from({ length: PUFF.n }, (_, i) => {
    const p = i / Math.max(1, PUFF.n - 1);
    return {
      t0: +(PUFF.at + i * PUFF.stagger).toFixed(4),
      life: +lerp(PUFF.life[0], PUFF.life[1], r()).toFixed(4),
      x0: +(PUFF.from.x + (r() * 2 - 1) * PUFF.spread.x).toFixed(2),
      y0: +(PUFF.from.y + (r() * 2 - 1) * PUFF.spread.y).toFixed(2),
      /* the later blobs travel further, so the cloud stretches out behind the
         first one rather than expanding as a disc. */
      dist: +lerp(PUFF.dist[0], PUFF.dist[1], p * 0.6 + r() * 0.4).toFixed(2),
      vy: +lerp(PUFF.vy[0], PUFF.vy[1], r()).toFixed(2),
      rise: +lerp(PUFF.rise[0], PUFF.rise[1], r()).toFixed(2),
      d0: +lerp(PUFF.d0[0], PUFF.d0[1], r()).toFixed(2),
      grow: +lerp(PUFF.grow[0], PUFF.grow[1], r()).toFixed(3),
      soft: +lerp(PUFF.soft[0], PUFF.soft[1], r()).toFixed(2),
      peak: +lerp(PUFF.peak[0], PUFF.peak[1], r()).toFixed(3),
    };
  });
}

/* one blob at one instant, or null if it has not been born or is already gone.
   the opacity is a fast rise and a long fall, which is what a puff of anything
   does: it arrives all at once and it leaves slowly. */
function puffAt(blobs, t) {
  const out = [];
  for (const b of blobs) {
    const q = (t - b.t0) / b.life;
    if (q <= 0 || q >= 1) { out.push(null); continue; }
    const o = b.peak * (q < 0.12 ? EASE(q / 0.12) : Math.pow(1 - (q - 0.12) / 0.88, 1.45));
    const d = b.d0 * (1 + (b.grow - 1) * EASE(q));
    out.push({
      x: +(b.x0 - b.dist * EASE(q)).toFixed(2),
      y: +(b.y0 + b.vy * b.life * q - b.rise * q * q).toFixed(2),
      /* it slows as it goes, which is the `EASE` on the travel above: gas leaves
         fast and then stops going anywhere, and a blob at constant velocity
         reads as a bubble being blown across the screen. */
      d: +d.toFixed(2), o: +o.toFixed(4),
    });
  }
  return out;
}

/* how far the puff ever reaches, in device px from each border, including the
   blur radius on each blob. it is arithmetic on the plan, so it costs nothing
   and it is exact.

   two judgement calls in it and both are written down rather than left in the
   numbers. a blob is measured only while it is over a tenth opaque, because a
   cloud at three per cent is not a thing crossing a line — the same argument the
   mascot module makes for not folding a thirty pixel glow into the head's own
   clearance. and the extent is the disc plus one blur radius rather than three,
   because a css blur is a gaussian and what is past one sigma is under a fifth
   of an already faint edge. */
function puffReach(blobs) {
  let left = Infinity, right = Infinity, top = Infinity, bottom = Infinity;
  for (let f = 0; f <= Math.round(CUT.seconds * 240); f++) {
    for (let i = 0; i < blobs.length; i++) {
      const a = puffAt(blobs, f / 240)[i];
      if (!a || a.o < 0.10) continue;
      const rr = a.d / 2 + blobs[i].soft;
      left = Math.min(left, (a.x - rr) * DSF);
      right = Math.min(right, (VW - a.x - rr) * DSF);
      top = Math.min(top, (a.y - rr) * DSF);
      bottom = Math.min(bottom, (VH - a.y - rr) * DSF);
    }
  }
  return { left: +left.toFixed(1), right: +right.toFixed(1), top: +top.toFixed(1), bottom: +bottom.toFixed(1) };
}

/* ---------- the glitch ----------
   a function of the output frame index and of nothing else. see the note at the
   top of the file for why that is not a style choice.

   the envelope is post10's: full for the first eighth, decaying, and then clean
   for the last seventh, which is the "snaps back calm" the brief asks for and is
   a fact the guards check rather than a description. */
function heatAt(p) {
  if (p < 0) return 0;
  if (p < 0.13) return 1;
  if (p < 0.58) return 1 - (p - 0.13) / 0.45 * 0.58;
  if (p < GL.calmFrom) return 0.42 * (1 - (p - 0.58) / (GL.calmFrom - 0.58));
  return 0;
}
function calmGlitch() {
  return { sx: 0, sy: 0, split: 0, noise: 0, flash: 0, bands: [], heat: 0 };
}
function glitchAt(f) {
  const g = calmGlitch();
  const t = f / FPS;
  const t0 = END.at, t1 = END.at + END.hard + END.tail;
  if (t < t0 || t >= t1) return g;
  const p = (t - t0) / (t1 - t0);
  const r = prng(0x0c1a55 ^ (f * 2654435761));
  let heat = heatAt(p);
  /* a spike: one frame back at full strength somewhere in the decay, so the
     fault stutters rather than fading out politely. */
  if (heat > 0 && p > 0.13 && p < GL.calmFrom && r() < 0.34) heat = 1;
  if (heat <= 0) return g;
  g.heat = heat;
  g.sx = +((r() * 2 - 1) * GL.shakeX * heat).toFixed(2);
  g.sy = +((r() * 2 - 1) * GL.shakeY * heat).toFixed(2);
  g.split = +(heat * (2.2 + r() * (GL.split - 2.2))).toFixed(2);
  g.noise = +(heat * lerp(GL.noise[0], GL.noise[1], r())).toFixed(4);
  /* the white frame is one event rather than a channel: it is on the first
     frame of the hard stretch and on nothing else. a flash that repeats is a
     strobe, and a strobe is a thing platforms flag. */
  g.flash = f === Math.round(END.at * FPS) ? GL.flash : 0;
  const n = Math.min(GL.bands, Math.floor(heat * (GL.bands + 0.5)));
  for (let i = 0; i < n; i++) {
    const h = 18 + r() * 96;
    g.bands.push({
      top: +(r() * (VH - h)).toFixed(1), h: +h.toFixed(1),
      dx: +((r() * 2 - 1) * GL.bandDx * heat).toFixed(1),
    });
  }
  return g;
}

/* ---------- the phosphor ----------
   two sines on incommensurate periods rather than one, and post10 paid for that
   lesson: a sine stands still twice a period, so on an end card where the
   phosphor is the only thing still moving, the two frames either side of its
   turning point are identical. the liveness guard at the bottom of this file is
   what would catch it; the second component is what stops it happening. */
function phosphor(t, amp, slow, fast, phase) {
  return 1 + amp * 0.78 * Math.sin(2 * Math.PI * t / slow)
    + amp * 0.39 * Math.sin(2 * Math.PI * t / fast + phase);
}

/* ---------- what one frame is ----------
   everything this file writes, in one object, so the page has one entry point
   and the liveness signature at the bottom has one thing to hash. `t` is the
   instant being captured and `f` is the output frame it belongs to: they differ
   under the shutter and the difference is the whole point of the split. */
function frameAt(t, f, blobs) {
  const g = glitchAt(f);
  /* the cut. he is on the frame before the hit and gone on the frame after it. */
  const cutFrame = Math.round(END.at * FPS);
  const mo = f >= cutFrame ? 0 : EASE(span(t, 0, FADE.for));
  /* the wordmark snaps: a scale coming down through one on the site's own
     spring, so it overshoots a hair and settles, and an opacity that is there
     well before the scale is. it rides the shutter, so at 60 with --blur it
     smears on the way in and lands sharp, which is the house look. */
  const wp = span(t, END.wmIn, END.wmIn + END.wmFor);
  const wm = {
    o: +span(t, END.wmIn, END.wmIn + END.wmFor * 0.45).toFixed(4),
    sc: +(1 + (1 - POP(wp)) * 0.085).toFixed(4),
    glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4),
  };
  return { t: +t.toFixed(4), f, mo: +mo.toFixed(4), wm, g, puff: puffAt(blobs, t) };
}

/* ---------- the page ---------- */
function sceneHtml(plan) {
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post12</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500&display=swap">
<style>
:root{
  --bg:#06070a; --fg:#d5dbd8;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  --body:"Space Grotesk",var(--mono);
  --display:"Michroma",var(--mono);
  /* the two channels the rgb split is drawn in. they are the same white the
     glow is, pulled apart, rather than a red and a cyan out of a filter preset:
     this frame has no colour in it and the glitch is not where colour starts. */
  --gr:rgba(255,120,120,.55); --gc:rgba(120,220,255,.55);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}

/* the vignette, and it is load bearing rather than decoration. with nothing at
   all animating chrome stops producing compositor frames and the screenshot
   call blocks on a frame that never comes — post2.mjs found this and every clip
   in demo/ has carried the fix since. it is also the one thing in this file
   allowed to be a css animation, because it is the one thing that does not have
   to hit a mark. */
.vignette{position:fixed;inset:-10%;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 78% 62% at 50% 46%,
    rgba(255,255,255,.030) 0%, rgba(255,255,255,.010) 46%, rgba(0,0,0,0) 72%);
  will-change:transform,opacity;
  animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{
  from{transform:scale(1) translate3d(0,0,0);opacity:.85}
  to{transform:scale(1.05) translate3d(0,-1.1%,0);opacity:1}
}

/* the stage carries the frame's own shake and every custom property anything
   else reads. one place they are written and one place everything reads them
   from, which is what keeps the torn copies from drifting off the real one. */
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;
  transform:translate3d(calc(var(--sx,0) * 1px),calc(var(--sy,0) * 1px),0);
  will-change:transform}

${mascotCss(plan)}

/* the module places and draws him; these two lines are this clip's and nothing
   more. the id beats the module's class selector, which is how a clip adds an
   opacity channel without editing the module. */
#m-zone{opacity:var(--m-o,0)}
.stage[data-gl="1"] #m-zone{
  filter:drop-shadow(calc(var(--split,0) * -1px) 0 var(--gr))
         drop-shadow(calc(var(--split,0) * 1px) 0 var(--gc))}

/* ---- the puff ----
   soft white light, screen blended so it adds to a black frame rather than
   sitting on it as grey. the blur is per blob and set once, never animated. */
.puff{position:absolute;inset:0;z-index:3;pointer-events:none;mix-blend-mode:screen}
.blob{position:absolute;border-radius:50%;opacity:0;will-change:transform,opacity;
  background:radial-gradient(circle,
    rgba(255,255,255,.98) 0%, rgba(255,255,255,.80) 26%, rgba(255,255,255,.42) 46%,
    rgba(255,255,255,.13) 66%, rgba(255,255,255,0) 80%)}

/* ---- the wordmark ----
   three lines on the line his head was on. the deep glow is two text shadows
   rather than blurred duplicates, because it is fourteen glyphs and a duplicate
   would have to be written every frame. the brightness filter on top is the
   phosphor breathing, which is what stops the last half second from being a
   still picture. */
.wm{position:absolute;left:50%;top:${CENTRE_Y}px;
  transform:translate(-50%,-50%) scale(var(--wm-s,1));
  font-family:var(--display);font-weight:400;color:var(--fg);
  text-align:center;text-transform:uppercase;letter-spacing:.18em;
  line-height:${WM.lh};white-space:nowrap;
  /* letter-spacing is added after every glyph including the last, so the box is
     one full space wider than the ink and the ink sits half a space left of the
     box centre. shifting by half the tracking is what actually centres it. */
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
   a band of the frame, blacked out and redrawn shifted. the layer paints the
   page colour first so it covers what is under it, then draws its own copy of
   the wordmark displaced sideways, which is a tear rather than a ghost.

   only the wordmark is copied, and that is a decision rather than a shortcut.
   the mascot is one dom subtree driven by ids out of the mascot module own
   runtime and there is no second copy of it that could be kept in sync; the
   wordmark is three words of static text and duplicating it cannot go wrong.
   it is also the only thing on screen when the glitch is at full heat, because
   the mascot is cut on the same frame the hit lands. */
.tear{position:absolute;inset:0;z-index:6;overflow:hidden;background:var(--bg);
  clip-path:inset(var(--tt,0px) 0 calc(100% - var(--tt,0px) - var(--th,0px)) 0);
  opacity:var(--to,0)}
.tear-in{position:absolute;inset:0;transform:translate3d(calc(var(--tdx,0) * 1px),0,0)}

/* ---- the fault's own two layers ----
   noise, screen blended for the same reason the puff is, and a white frame that
   fires once. */
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
  <div class="puff" id="puff" aria-hidden="true">
${Array.from({ length: PUFF.n }, (_, i) => '    <i class="blob" data-blob="' + i + '"></i>').join('\n')}
  </div>
${mascotMarkup(plan)}
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
window.__P12 = ${JSON.stringify({ WM, PUFF: { n: PUFF.n }, VW, VH, DSF })};
${scenePage.toString()}
scenePage();
document.fonts.load('400 1em "Michroma"')
  .then(() => document.fonts.ready)
  .then(() => {
    window.__p12.fit();
    window.__built = window.__mas.build();
  });
</script>
</body>
</html>`;
}

/* ---------- the page's own script ----------
   it writes numbers to elements and it decides nothing, exactly like the
   mascot's own page half. serialised in with .toString(), so it must not close
   over anything: everything it needs arrives on window.__P12. */
function scenePage() {
  const P = window.__P12;
  const stage = document.getElementById('stage');
  const wms = [...document.querySelectorAll('.wm')];
  const blobs = [...document.querySelectorAll('.blob')];
  const tears = [...document.querySelectorAll('.tear')];
  const tearIns = tears.map(t => t.querySelector('.tear-in'));

  window.__p12 = {
    /* the wordmark, fitted. michroma is proportional and the tracking is nearly
       a fifth of an em, so the width of the widest line is a measurement rather
       than a ratio — the page-builder spec says this in as many words and it is
       the one rule about this face that is easy to get wrong.

       every copy is fitted, the torn ones included, or a tear would show a
       wordmark at a different size to the one under it. */
    fit() {
      const probe = wms[0];
      probe.style.fontSize = '100px';
      let widest = 0;
      for (const sp of probe.querySelectorAll('span')) {
        widest = Math.max(widest, sp.getBoundingClientRect().width);
      }
      const size = 100 * P.WM.w / widest;
      for (const el of wms) el.style.fontSize = size.toFixed(2) + 'px';
      return size;
    },

    /* what the wordmark actually measures, once, after the fit. the widest
       line's ink, the block's box, and the cap height off the rendered glyphs
       rather than off the ratio — a face that failed to load is caught here
       rather than in a review. */
    measure() {
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
        widestCss: +widest.toFixed(2), widestPx: +(widest * d).toFixed(1),
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

      for (let i = 0; i < blobs.length; i++) {
        const b = o.puff[i], el = blobs[i];
        if (!b) { el.style.opacity = '0'; continue; }
        el.style.opacity = b.o.toFixed(4);
        el.style.width = b.d.toFixed(2) + 'px';
        el.style.height = b.d.toFixed(2) + 'px';
        el.style.left = (b.x - b.d / 2).toFixed(2) + 'px';
        el.style.top = (b.y - b.d / 2).toFixed(2) + 'px';
      }

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

    /* the blur radius per blob, written once after build rather than per frame:
       animating a blur re-rasterises the layer on every frame and it is the one
       thing in this file that would cost a render real time. */
    soften(list) {
      for (let i = 0; i < blobs.length; i++) blobs[i].style.filter = 'blur(' + list[i] + 'px)';
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
   nothing in this scene animates by hand — node holds the whole animation and
   the page writes what it is handed — but the shim is installed and flushed once
   per capture anyway, so this layer runs under the same clock everything else in
   demo/ runs under. a shim that only appears when it is needed is a shim nobody
   tests. */
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
async function render(plan, blobs) {
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
      && window.__p12 && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  if (!await page.evaluate(() => !!(window.__mas && window.__mas.ready))) {
    throw new Error('the scene never became ready');
  }
  /* offline michroma falls back to the system mono and the wordmark looks
     almost right, which is the worst kind of wrong to judge type on. */
  if (!await page.evaluate(() => document.fonts.check('400 40px "Michroma"'))) {
    throw new Error('Michroma did not load — the wordmark would be judged in the mono fallback');
  }
  await page.evaluate(list => window.__p12.soften(list), blobs.map(b => b.soft));
  const built = await page.evaluate(() => window.__built);
  const wm = await page.evaluate(() => window.__p12.measure());
  console.log('  built: head ' + built.headPx + 'px, ' + built.eyes + ' eyes, '
    + built.glows + ' glow layers, theme ' + built.theme);
  console.log('  the wordmark: ' + wm.sizeCss + 'css px, widest line ' + wm.widestPx
    + ' device px, caps ' + wm.capPx + ', clear ' + wm.left + ' left / ' + wm.top
    + ' top / ' + wm.right + ' right / ' + wm.bottom + ' bottom');

  /* the head's clearance, off every frame rather than sampled, because the
     geometry is known and it costs nothing to do it properly. the glow and the
     shadow are reported beside the ink rather than folded into it. */
  let headWorst = null;
  for (let f = 0; f < N; f++) {
    const r = headRect(plan, mascotFrame(plan, f / FPS));
    const near = Math.min(r.left, r.top, r.right, r.bottom);
    if (!headWorst || near < headWorst.near) headWorst = { t: +(f / FPS).toFixed(2), near, ...r };
  }

  /* the liveness signature. one number per output frame off everything this
     file wrote plus everything the mascot wrote, so two identical frames are a
     fact rather than a suspicion. post10 shipped a pair of them and only found
     out at sixty. */
  const sigs = [];
  const wall = Date.now();

  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const mf = mascotFrame(plan, t);
      const o = frameAt(t, f, blobs);
      await page.evaluate(fr => window.__mas.apply(fr), mf);
      await page.evaluate(fr => window.__p12.apply(fr), o);
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);

      if (k === 0) {
        let s = o.mo * 7 + o.wm.o * 11 + o.wm.sc * 13 + o.wm.glow * 17
          + o.g.sx * 19 + o.g.sy * 23 + o.g.split * 29 + o.g.noise * 31 + o.g.flash * 37
          + o.g.bands.length * 41
          + mf.card.x * 43 + mf.card.y * 47 + mf.card.rot * 53
          + mf.card.sx * 59 + mf.card.sy * 61 + mf.glow * 67;
        for (let e = 0; e < 2; e++) {
          s += mf.eyes[e].x * (71 + e) + mf.eyes[e].y * (79 + e)
            + mf.eyes[e].sx * (83 + e) + mf.eyes[e].sy * (89 + e) + mf.eyes[e].lid * (97 + e);
          s += mf.brows[e].o * (101 + e) + mf.brows[e].y * (103 + e);
        }
        for (const b of o.puff) if (b) s += b.x * 107 + b.y * 109 + b.d * 113 + b.o * 127;
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

  /* a still per beat, so the cut can be read as a strip rather than as a video.
     the frame is written explicitly every time, so re-applying an earlier one
     after the loop renders exactly as it did. */
  fs.rmSync(VERIFY, { recursive: true, force: true });
  fs.mkdirSync(VERIFY, { recursive: true });
  const stills = [
    [FADE.for, 'a-faded-up'],
    [CUT.marks[1].t + STATES.agreeing.ding, 'b-the-hi'],
    [CUT.marks[1].t + STATES.agreeing.entry + 0.42, 'c-the-pause'],
    [PUFF.at + 0.26, 'd-the-fart'],
    [CUT.marks[2].t + STATES.surprised.entry, 'e-eyes-wide'],
    [CUT.marks[3].t + 0.47, 'f-the-giggle'],
    [END.at + 0.04, 'g-the-glitch'],
    [END.wmIn + END.wmFor + 0.10, 'h-the-wordmark'],
    [CUT.seconds - 0.06, 'i-the-last-frame'],
  ];
  for (const [t, name] of stills) {
    const f = Math.min(N - 1, Math.round(t * FPS));
    await page.evaluate(fr => window.__mas.apply(fr), mascotFrame(plan, t));
    await page.evaluate(fr => window.__p12.apply(fr), frameAt(t, f, blobs));
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
    });
    fs.writeFileSync(path.join(VERIFY, name + '.png'), Buffer.from(shot.data, 'base64'));
  }

  console.log('  head, worst of ' + N + ' frames at ' + headWorst.t + 's: '
    + headWorst.left + ' left, ' + headWorst.top + ' top, ' + headWorst.right + ' right, '
    + headWorst.bottom + ' bottom (floor '
    + Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom) + ')');
  console.log('  the glow reaches ' + headWorst.glowReach + 'px past the ink');

  await browser.close();
  srv.close();

  if (SUB > 1) blend(N);

  const state = { built, wm, head: headWorst, sigs, frames: N };
  fs.writeFileSync(path.join(OUT, 'post12.json'), JSON.stringify(state, null, 2));
  return state;
}

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }

/* ---------- the shutter ----------
   the subframes are averaged into frames, which is what a shutter is: a frame is
   the light that arrived over its own duration, not a sample of one instant.
   `tmix` averages a sliding window and `framestep` throws away the ones that
   straddle two output frames. post10's chain, unchanged. */
function blend(N) {
  console.log('  blending ' + N * SUB + ' subframes into ' + N + ' frames ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS * SUB), '-i', path.join(SUBS, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1)
      + ',setpts=PTS-STARTPTS,framestep=' + SUB,
    '-q:v', '2', path.join(FRAMES, 'f%05d.jpg')]);
}

function encode(wav) {
  const out = path.join(OUT, 'post12-dark-1080x1920.mp4');
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

/* ---------- the hops, measured ----------
   the giggle is three bleeps and the brief says he bounces on each one, so the
   three times are read off the rig rather than typed against it: walk
   `mascotFrame` through the `delighted` window at four times the master rate,
   find every turning point in the head's own y, and take the first three after
   the crouch. that is apex, dip, apex — up, down, up — which is what "bounces"
   means with two hops in it.

   this is the same argument `cuesFromCaptions` makes and it is the reason the
   sound in this repo is derived rather than placed: change the state, change the
   mark, change the frame rate, and the giggle moves with the picture because
   there is nothing to keep in sync. */
const HOP_PROMINENCE = 3.0;
function hopBeats(plan, from, until) {
  const RATE = 240;
  const ys = [];
  for (let i = Math.round(from * RATE); i <= Math.round(until * RATE); i++) {
    /* the **card**, which is the head a viewer is looking at, rather than
       `pose`, which is the rig. the card is three frames behind the rig by
       design — that is the overlapping action the module builds in — so a beat
       taken off the pose would land three frames before the picture got there.
       it also carries the idle drift, which is correct: a beat is where the
       drawn head actually turns around, not where the state alone says it
       does. */
    ys.push({ t: i / RATE, y: mascotFrame(plan, i / RATE).card.y });
  }
  const turns = [];
  for (let i = 1; i < ys.length - 1; i++) {
    const a = ys[i - 1].y, b = ys[i].y, c = ys[i + 1].y;
    if (!((b <= a && b < c) || (b >= a && b > c))) continue;
    const last = turns[turns.length - 1];
    /* **prominence, and it is the whole of this function working.** a hop is
       built out of several tweens handed to each other, and a handover writes
       its own `from` value: where one tween settled a quarter of a unit past
       where the next one starts, the curve steps, and a step is two turning
       points. those are real numbers and they are about half a device pixel on
       screen, which is not a bounce and must not get a bleep on it. so a turn
       only counts if it is at least three grid units away from the last one
       that did — the hops swing twelve and seven, the artefacts swing one. */
    if (last && Math.abs(b - last.y) < HOP_PROMINENCE) continue;
    turns.push({ t: +ys[i].t.toFixed(4), y: +b.toFixed(3), up: b < a || b < c });
  }
  /* the first turning point in the window is the bottom of the crouch, which is
     anticipation rather than a bounce. the giggle starts on the first apex, and
     the three it takes are apex, dip, apex: up, down, up, which is what "he
     bounces on each hi" means when the state gives you two hops. they are not
     evenly spaced and they are not meant to be — the gaps come out about 0.39
     and 0.22, so the laugh accelerates, which is what a laugh does. */
  const apex = turns.findIndex(p => p.up);
  return turns.slice(apex, apex + 3);
}

/* ---------- go ---------- */
console.log('the boring tek — post12, the sting');

const plan = planMascot({
  marks: CUT.marks, seconds: CUT.seconds, theme: 'dark',
  size: SIZE,
  /* dead straight on. the corner bias exists so a mascot standing in a corner
     looks into the frame; standing in the middle there is nothing to look into
     and a resting turn would read as him facing slightly away from camera for
     five seconds. */
  bias: 0,
});
/* centred, in the middle of the safe band. see the note on CENTRE_Y. */
const halfBox = (GRID / 2) * plan.unit;
plan.box = { left: +(VW / 2 - halfBox).toFixed(2), top: +(CENTRE_Y - halfBox).toFixed(2), size: SIZE };

console.log(describeMascot(plan));
const rep = mascotMotion(plan, FPS, CUT.seconds);
console.log(describeMotion(rep));
const rep60 = FPS === 60 ? rep : mascotMotion(plan, 60, CUT.seconds);
if (FPS !== 60) {
  console.log('  and at sixty, which is what the motion guards read:');
  console.log(describeMotion(rep60));
}

const blobs = planPuff();
const reach = puffReach(blobs);

/* ---------- the cues ----------
   five events and every one of them is a time somewhere else already decided.
   the hi is `agreeing`'s own ding offset, which is the bottom of the first nod
   and is the beat that means yes — the one moment in that state a sound belongs
   on. the fart is the puff's own birth, four hundredths before the head starts
   to move, so the buzz is the cause and the recoil is the effect. the giggle is
   three hops measured off the rig. the glitch is the cut.

   nothing in this list is a number somebody typed to taste. */
const hopped = hopBeats(plan, CUT.marks[3].t, END.at);
const cues = [
  { t: +(CUT.marks[1].t + STATES.agreeing.ding).toFixed(4), kind: 'hi',
    from: "agreeing's own ding offset, the bottom of the first nod" },
  { t: PUFF.at, kind: 'fart', from: "the puff's own birth" },
  ...hopped.map((h, i) => ({ t: h.t, kind: 'giggle', opts: { step: i },
    from: (h.up ? 'the top of a hop' : 'the dip between them') })),
  { t: END.at, kind: 'glitch', from: 'the cut' },
];
const { buf: sfx, report: sfxReport } = renderSfx(cues, CUT.seconds);
const WAV = path.join(OUT, 'post12-sfx.wav');
const RAW = path.join(OUT, 'post12-sfx-raw.wav');
fs.mkdirSync(OUT, { recursive: true });
writeWav(RAW, sfx);
/* the loudness is read off a written file with ebur128, which is the meter a
   broadcaster uses, rather than off an rms with a nice name. */
const before = loudness(ffmpeg, RAW);
let rawPeak = 0;
for (let i = 0; i < sfx.length; i++) rawPeak = Math.max(rawPeak, Math.abs(sfx[i]));
const rawPeakDb = 20 * Math.log10(rawPeak);
const wanted = before.lufs == null ? 0 : +(TARGET_LUFS - before.lufs).toFixed(2);
const allowed = +(SAMPLE_CEILING - rawPeakDb).toFixed(2);
const lift = Math.min(wanted, allowed);
applyGain(sfx, lift);
const peak = limit(sfx, SAMPLE_CEILING);
writeWav(WAV, sfx);
const after = loudness(ffmpeg, WAV);
fs.rmSync(RAW, { force: true });

console.log('\n  the beats');
console.log('    0.00s  he fades up over ' + FADE.for.toFixed(2) + 's');
for (const m of plan.marks) {
  console.log('    ' + m.t.toFixed(2) + 's  ' + m.state.padEnd(10) + ' settles '
    + m.settled.toFixed(2) + ', holds to ' + m.leaving.toFixed(2) + ', out '
    + m.out.toFixed(2));
}
console.log('    ' + END.at.toFixed(2) + 's  the glitch, and he is cut on that frame');
console.log('    ' + END.wmIn.toFixed(2) + 's  the wordmark snaps in over '
  + END.wmFor.toFixed(2) + 's and holds ' + (CUT.seconds - END.wmIn - END.wmFor).toFixed(2) + 's');
console.log('    ' + CUT.seconds.toFixed(2) + 's  end');
const pause = PUFF.at - (CUT.marks[1].t + STATES.agreeing.entry + 0.10);
console.log('  the pause before the fart is ' + pause.toFixed(2) + 's of holding still');

console.log('\n  the sound');
for (const r of sfxReport) {
  console.log('    ' + r.t.toFixed(2) + 's  ' + r.kind.padEnd(8) + r.seconds.toFixed(3)
    + 's  ' + String(r.gain).padStart(4) + ' dB  peak ' + String(r.peak).padStart(6)
    + '  ' + r.from);
}
console.log('    the bus came off the synth at ' + (before.lufs == null ? '?' : before.lufs)
  + ' LUFS with its peak at ' + rawPeakDb.toFixed(1) + ' dBFS');
console.log('    ' + TARGET_LUFS + ' LUFS wanted ' + wanted.toFixed(2) + ' dB of lift and the '
  + SAMPLE_CEILING + ' dBFS ceiling allowed ' + allowed.toFixed(2)
  + (allowed < wanted ? ', so the ceiling won by ' + (wanted - allowed).toFixed(2) + ' dB' : ''));
console.log('    lifted ' + lift.toFixed(2) + ' dB to ' + (after.lufs == null ? '?' : after.lufs)
  + ' LUFS, peak ' + peak.peak + ' dBFS, limiter took '
  + (peak.reduction > 0.01 ? peak.reduction.toFixed(2) + ' dB' : 'nothing'));

console.log('\n  the puff: ' + PUFF.n + ' blobs from ' + PUFF.at.toFixed(2) + 's, clear '
  + reach.left + ' left / ' + reach.top + ' top / ' + reach.right + ' right / '
  + reach.bottom + ' bottom (floor ' + Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom) + ')');

const state = ONLY_ENCODE
  ? JSON.parse(fs.readFileSync(path.join(OUT, 'post12.json'), 'utf8'))
  : await render(plan, blobs);
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

/* the head, as ink, on every frame. the glow and the shadow are not in it: a
   thirty px blur crossing a safe line is not ink crossing it. */
if (state.built.headPx < HEAD_PX.min || state.built.headPx > HEAD_PX.max) {
  fail.push('the head rendered at ' + state.built.headPx + 'px, window is '
    + HEAD_PX.min + ' to ' + HEAD_PX.max);
}
/* larger than his corner size, which is what the brief asked for and is a
   number rather than an impression. */
if (state.built.headPx <= 240) {
  fail.push('the head is ' + state.built.headPx + 'px, which is not larger than his corner size of 240');
}
if (state.head.near < floor - 0.5) {
  fail.push('the head comes within ' + Math.round(state.head.near)
    + 'px of a border at ' + state.head.t + 's, floor is ' + floor);
}
/* and he is actually in the middle, which is the other half of the brief. */
const offX = Math.abs(state.head.left - state.head.right);
if (offX > 2) fail.push('he is ' + offX.toFixed(1) + 'px off centre horizontally');

/* the puff. it is glow rather than ink, so this is generous by design — but a
   cloud that leaves the safe area is still a cloud a phone crops. */
for (const [k, v] of Object.entries(reach)) {
  if (v < floor - 0.5) fail.push('the puff comes within ' + Math.round(v) + 'px of the ' + k + ' border');
}

/* the wordmark: inside the safe area, legible, and actually michroma. */
const w = state.wm;
if (!/Michroma/.test(w.font)) fail.push('the wordmark is not set in michroma: ' + w.font);
if (w.capPx < WM.minCapPx) fail.push('the wordmark caps measure ' + w.capPx + ' device px, floor is ' + WM.minCapPx);
for (const k of ['left', 'top', 'right', 'bottom']) {
  if (w[k] < floor - 0.5) fail.push('the wordmark comes within ' + Math.round(w[k]) + 'px of the ' + k + ' border');
}
if (Math.abs(w.widestPx - WM.w * DSF) > 6) {
  fail.push('the wordmark fitted to ' + w.widestPx + ' device px, wanted ' + WM.w * DSF);
}

/* the motion, off the module's own preflight at sixty. these are the numbers
   the house asks for per state and they are guards, not notes. */
for (const st of rep60.states) {
  if (st.entryFrames == null) fail.push(st.state + ' never reached its own mark');
  else if (st.entryFrames < 3) fail.push(st.state + ' arrives in ' + st.entryFrames + ' frames, which is a cut');
  if (!['neutral'].includes(st.state) && st.antiFrames < 2) {
    fail.push(st.state + ' has no anticipation, only ' + st.antiFrames + ' frames back');
  }
  if (!(st.overshoot > 1)) fail.push(st.state + ' arrives with no overshoot, which is a hard stop');
}
if (rep60.outside.units > 0) {
  fail.push('feature ink lands ' + rep60.outside.units.toFixed(2)
    + ' units outside the head silhouette at ' + rep60.outside.at.toFixed(2) + 's');
}
if (rep60.blinks.repeatsInARow) fail.push(rep60.blinks.repeatsInARow + ' blinks repeat the one before them');
if (rep60.frozenFrames) fail.push(rep60.frozenFrames + ' frames where the face is not moving at all');
if (rep60.maxSquash > 0.08 + 1e-6) fail.push('the squash reached ' + (rep60.maxSquash * 100).toFixed(1) + '%');
if (rep60.maxBreathe >= 0.02) fail.push('breathing reached ' + (rep60.maxBreathe * 100).toFixed(2) + '%');

/* the joke's own shape, checked rather than described. a setup shorter than half
   a second is not a pause, it is a gap. */
if (pause < 0.50) fail.push('the pause before the fart is only ' + pause.toFixed(2) + 's');
/* the giggle: three of them, on the picture, and finished before the cut. */
if (hopped.length !== 3) fail.push('the giggle found ' + hopped.length + ' hop beats, wanted three');
for (let i = 1; i < hopped.length; i++) {
  const d = hopped[i].t - hopped[i - 1].t;
  /* the floor is about the sound rather than about the rhythm. a bleep is 62ms
     with a 30ms tail, so two of them 90ms apart are two events and two of them
     40ms apart are one event with a wobble in it. the *rhythm* is uneven on
     purpose and is not this guard's business: the state hops big and then small,
     so the giggle comes out as one and then two, which is what a laugh that
     catches sounds like. */
  if (d < 0.09) fail.push('two giggle bleeps are ' + d.toFixed(3) + 's apart, which is one sound');
  if (d > 0.60) fail.push('two giggle bleeps are ' + d.toFixed(2) + 's apart, which is not a giggle');
}
if (hopped.length && hopped[hopped.length - 1].t > END.at - 0.02) {
  fail.push('the last giggle bleep lands on or after the cut at ' + END.at);
}
/* every cue is inside the clip and in order. */
for (const r of sfxReport) {
  if (r.cut) fail.push('the ' + r.kind + ' cue at ' + r.t + 's was cut off by the end of the clip');
  if (r.t < 0 || r.t > CUT.seconds) fail.push('the ' + r.kind + ' cue at ' + r.t + 's is outside the clip');
}

/* the glitch: short, and over. the last stretch of the clip is three words
   holding still and nothing may be tearing them. */
{
  const N = state.frames;
  let on = 0, lastOn = -1;
  for (let f = 0; f < N; f++) {
    const g = glitchAt(f);
    if (g.heat > 0 || g.flash > 0) { on++; lastOn = f; }
  }
  if (!on) fail.push('nothing glitches on any frame');
  if (on / N > 0.18) fail.push('the glitch runs on ' + on + ' of ' + N
    + ' frames, which is a broken render rather than a fault');
  const cleanFrom = Math.round((END.at + END.hard + END.tail + END.clean) * FPS);
  if (lastOn >= cleanFrom) {
    fail.push('the glitch is still firing at frame ' + lastOn + ', past the clean line at ' + cleanFrom);
  }
}

/* the mix, on the finished file rather than on the intent. the true peak is the
   hard one and the loudness is a band rather than a point, because this clip is
   peak normalised on purpose — see the note by SAMPLE_CEILING. */
if (lu && lu.ok) {
  if (lu.truePeak > PEAK_CEILING) {
    fail.push('the true peak is ' + lu.truePeak + ' dBFS, over the ' + PEAK_CEILING + ' ceiling');
  }
  if (lu.lufs < MIN_LUFS) {
    fail.push('the file measures ' + lu.lufs + ' LUFS, under the ' + MIN_LUFS + ' floor');
  }
  if (lu.lufs > TARGET_LUFS + 0.5) {
    fail.push('the file measures ' + lu.lufs + ' LUFS, over the ' + TARGET_LUFS + ' target');
  }
} else fail.push('ebur128 said nothing about the finished file');
if (peak.reduction > MAX_REDUCTION) {
  fail.push('the limiter took ' + peak.reduction.toFixed(2)
    + ' dB, and on this clip it is a backstop that should do nothing');
}

/* the end card holds long enough to be read. */
const hold = CUT.seconds - (END.wmIn + END.wmFor);
if (hold < 0.35) fail.push('the wordmark holds ' + hold.toFixed(2) + 's, which is not long enough to read');

/* nothing is ever a still frame. two identical frames in a row is post10's own
   fault and it only appeared at sixty. */
{
  let repeats = 0, first = null, smallest = Infinity;
  for (let i = 1; i < state.sigs.length; i++) {
    const d = Math.abs(state.sigs[i] - state.sigs[i - 1]);
    if (d === 0) { repeats++; if (first == null) first = i; }
    smallest = Math.min(smallest, d);
  }
  console.log('  liveness: smallest change between frames ' + smallest.toExponential(2)
    + (repeats ? ', ' + repeats + ' IDENTICAL PAIRS' : ', no identical pairs'));
  if (repeats) {
    fail.push(repeats + ' pairs of identical frames, the first at frame ' + first
      + ' (' + (first / FPS).toFixed(2) + 's)');
  }
}

/* no green anywhere. this clip has no accent in it at all and that is a rule
   rather than an oversight, so it is asserted on the markup the render actually
   served rather than remembered. */
{
  const html = sceneHtml(plan);
  /* the hexes and the token are banned outright, comments included: neither
     belongs in a file that has no accent in it. the *word* is checked with the
     comments stripped, because `lib/mascot.mjs`'s own css comment explains that
     the two greens exist and are not used here, and a guard that fails on a
     comment saying "there is no green" is a guard nobody will keep. */
  const bare = html.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const bad of ['#0f8a3c', '#35ff6a', '--accent']) {
    if (html.includes(bad)) fail.push('the page carries "' + bad + '" — this clip has no accent in it');
  }
  if (/green/i.test(bare)) fail.push('the page draws with something called green');
}

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');

/* ---------- THE HI, BOTH WAYS ----------
   the brief asked for two builds of the greeting and for whichever is cuter to
   ship, with a note saying which. both were built. this is the note.

   **a — the synthesised bleep**, `VOICES.hi` in lib/sfx.mjs. two notes, 90ms and
   105ms, 34ms of air between them, each gliding up inside itself, third harmonic
   a quarter under, low passed at 3.4k.

   **b — edge tts**, `en-US-JennyNeural` via lib/voice.mjs, the word trimmed out
   of the take, pitched up with `asetrate` (which shortens and raises together,
   the way a tape sped up does), bit crushed with `acrusher`, low passed and
   normalised. seven takes: four on "hi" at 1.45x to 1.95x and three on "hi?" at
   1.55x to 1.8x with the pitch pushed up, because a question mark is the only
   handle a neural voice gives you on a terminal contour.

   measured, on the pitch track and the spectrum:

     take           length   f0 first -> last   rise    energy over 4k
     a  synth       0.229s   721 -> 1106        1.53x   0.0%
     b1 "hi"  1.45x 0.224s   341 -> 225         0.66x   8.3%
     b2 "hi"  1.70x 0.188s   403 -> 264         0.65x   7.5%
     b3 "hi"  1.95x 0.160s   459 -> 303         0.66x   6.5%
     b4 "hi"  1.70x 0.189s   403 -> 264         0.65x   6.3%
     q1 "hi?" 1.55x 0.185s   497 -> 514         1.03x   —
     q2 "hi?" 1.80x 0.129s   637 -> 800         1.26x   —
     q3 "hii?"1.70x 0.152s   573 -> 642         1.12x   —

   **the synthesised bleep ships.** three reasons and none of them is taste.

   it is the shape that was asked for. the brief says *two tone* rising, and a
   neural voice saying "hi" is one glide with a terminal contour on it. b1 to b4
   fall — 0.65x, which is what a statement does in english and is why they read
   as resigned rather than as a greeting. the question mark buys a rise back and
   q2 gets to 1.26x, which is real, and it is still one continuous glide: there
   is no gap in it, so there are not two notes in it, so there is no way to make
   it the thing the brief describes without pitch bending it into one — at which
   point it is not the tts take any more.

   it stays inside the house ceiling. every tts take carries six to eight per
   cent of its energy above four kilohertz, which is sibilance plus the crusher's
   own aliasing. every sound in lib/sfx.mjs is low passed under 3.8k on purpose
   and it is the reason the set sounds like one set. the bleep measures 0.0%.

   it costs nothing to render. the tts path is a network call to an
   unauthenticated microsoft endpoint plus a cached wav on disk, for a two
   hundred millisecond sound, in a clip that is otherwise reproducible from
   source with no network at all. that is not a tiebreaker on its own and it did
   not need to be, but it is the third argument and it points the same way.

   **what the numbers cannot settle, said plainly: nothing in this pipeline can
   hear.** the video review skill says so about itself and it is true here too. a
   pitch contour, a spectral centroid and a top end share are proxies for cute,
   not measurements of it. what is written above is the case for the bleep on the
   evidence available; a person who listens to the two and prefers the tts take
   is right and this is wrong, and the takes are left on disk for exactly that —
   `demo/out/p12-hi/`, from the comparison script, regenerable and gitignored. */
