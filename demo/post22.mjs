/* the boring tek — post22.

   dark only, 1080x1920. somebody types a question into a chat box, the box
   falls out of the frame, and what answers it is him, with the lights on behind
   his eyes.

     0.0  a chat input box on a black frame. the line types in, tick by tick.
     2.5  the box and everything in it drop out of frame and fade. a low rumble.
     2.9  nothing at all on the frame.
     3.0  a glitch hit and he is there, red eyed, with three rgb stutters after.
     4.0  he holds. the red breathes. no sound in this window at all.
     6.0  a thought pops off his crown: AI LL BE BACK.
     7.0  it holds, he blinks, the red is still breathing.
     8.0  the fault, and the wordmark.

     node post22.mjs                     1080x1920, 60fps, shutter closed
     DEMO_FPS=12 node post22.mjs         the fast preview pass
     node post22.mjs --blur=6            60fps with the shutter open
     node post22.mjs --keep-frames       leave the jpegs on disk
     node post22.mjs --encode-only       re-encode from kept frames

   one output, one path, overwritten every run:

     demo/out/post22-dark-1080x1920.mp4

   ---------- what is the module's and what is this file's ----------

   the mascot is `lib/mascot.mjs` and nothing here reaches inside it. two marks,
   both `neutral`, which is the only state in the table that is calm — the brief
   rules out angry and unimpressed and the whole read is meant to be in the eyes.
   the thought bubble is the module's own too, timing, dots, pill and pop.

   everything red is composed on top, which is post21's split, unchanged:

     the iris colour is one css variable this file writes per frame, behind a
     selector of its own (`#m-zone .m-iris`). the module paints the iris with
     --eye and this overrides the fill; --eye itself is left alone, because the
     brows, the pill's ground and a glove's edge are all drawn in it.

     the eye glow and the face bloom are this file's layers, placed off
     `mascotFrame`'s own numbers through `cardPoint`, so they leave the head that
     is actually drawn rather than the one the plan describes.

   the chat box, the typing, the drop and the stutters are this file's and
   nothing else's. no pictogram scene, no captions engine, no camera.

   ---------- the two places this cut does not do what the brief says ----------

   **the bubble is over-right, not beside.** the brief asks for it beside the
   head. `beside` is written for a mascot standing in a corner and the module
   says so in as many words: it wants the head's own width again in clear space
   off his flank, and a four word pill at 26px is 200 odd css px of it. beside a
   head anywhere near the middle of a 540 wide stage that pill leaves the safe
   box, and the only way to buy the room is to push him a third of the way to the
   left edge — which is a worse break, because the brief also says he is in the
   middle. so it is the module's `over-right`: the same two dots and the same
   pill, climbing off the crown to his right at 50 degrees. he still gives up
   some ground for it, and how much is `LEFT_OF_CENTRE` below.

   **the bubble pops at 6.32 rather than at 6.00.** the module's thought is 0.48
   in, a hold capped at 0.90, and 0.30 out: 1.68 seconds, and that ceiling is not
   a number a clip may pass. so there is exactly one start time that leaves the
   pill on the frame the fault takes, and it is 8.00 minus 1.68. starting it at
   6.00 instead would have it gone by 7.68 and the brief's last beat — bubble
   holds — would be a third of a second of empty frame. the pop is still inside
   the brief's own 6.0 to 7.0 window.

   ---------- the sound ----------

   the brief names three: a tick a letter, a low rumble on the drop, and a pop on
   the bubble. all three are in here off `lib/sfx.mjs` with no new voice added.
   **there is no thunder in the set and there is not going to be one**: what a
   rumble is here is `hum` taken down to 38 hertz with a slow swell, which is a
   sub drone rather than a crack. the glitch is the fourth kind and it carries
   the hit at 3.00, the three stutters after it and the whole end card.

   **nothing at all sounds between 3.96 and 6.46**, which covers the brief's own
   silent window with a second and a half either side. no voice and no music.

   ---------- the shutter ----------

   post10's rule. with `--blur` every output frame is captured `SUB` times inside
   its own sixtieth and averaged. anything written against `t` smears; the
   glitch, the caret, the typed line and the wordmark's birth are written against
   the output frame and are held across every capture of it. the fastest thing in
   the file is the box falling and it is printed on every run. */

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
import { renderSfx, writeWav, applyGain, limit, loudness, describeMix } from './lib/sfx.mjs';

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
   box, the head and the wordmark all land on it, so each one replaces the last
   rather than following it. */
const CENTRE_Y = (SAFE_CSS.top + (VH - SAFE_CSS.bottom)) / 2;
const SIZE = 148;
/* and the one place he is not centred. the pill climbs off his crown to the
   right and it is as wide as the copy needs it to be, so the head gives up
   exactly enough ground for the far end of the run to clear the safe border and
   not a pixel more. the guard measures the rendered bubble and fails with the
   number to use, so this is a measurement written down rather than a taste. */
const LEFT_OF_CENTRE = 54;

/* ---------- the red ----------
   index.html's own dark `--red`, as components so it can be used at an alpha.
   the guard at the bottom reads the token back out of the site and compares, so
   the day somebody changes it there this file fails rather than quietly drifting
   off the palette. the brand's green appears nowhere in this clip. */
const RED = [255, 92, 92];
/* the iris at rest is the module's own --eye, which on the dark theme is defined
   to equal the page background. the mix runs from there to the red above. */
const EYE_DARK = [6, 7, 10];

/* ---------- the clock ----------
   there is no read in this film, so nothing here is derived: the brief hands
   over its beats on whole and half seconds and these are them. the only numbers
   that are not the brief's are the lengths of the moves inside a beat, and each
   is noted where it lives. */
const LINE = 'what did ai say to the terminator';
/* the typing. it starts a third of a second in, so the empty box and its caret
   are established before anything happens to them, and it is finished with a
   third of a second to spare, so the completed line is read as a line rather
   than glimpsed as the box leaves. 27 ticks over 1.84s is 14.7 letters a second,
   which is fast typing and slower than post17's 21.4 characters of speech. */
const TYPE = { from: 0.34, to: 2.18 };
/* the drop. 0.40s rather than the brief's 0.50, because the brief also asks for
   a dark beat after it and a beat has to be at least one frame of the pass it is
   judged on: at twelve fps that is a twelfth, so the box is down by 2.90 and
   nothing is on the frame from there to 3.00.

   470 is the ceiling and not a preference. the shutter allows 42 css px between
   two frames at sixty, `FALL` peaks at 8.2% of its distance on the last of 24
   frames, and 470 times that is 38. clearing the frame outright would need 585
   and 48, which is over. so the fade is what finishes it — which is what the
   brief says as well: drop out of frame **and fade**. */
const DROP = { at: 2.50, for: 0.40, fall: 470 };
const DARK = +(DROP.at + DROP.for).toFixed(3);   /* nothing on the frame from here */
const APPEAR = 3.00;
const AP = { hard: 0.13, tail: 0.17 };           /* the hit he arrives on */
/* the three stutters the brief asks for, after the hit and getting weaker: an
   image settling rather than a second event. each is four frames at sixty and
   one frame at twelve, which is what `onGrid` is for. */
const STUT = [
  { t: 3.34, for: 0.05, force: 0.62 },
  { t: 3.62, for: 0.05, force: 0.44 },
  { t: 3.90, for: 0.05, force: 0.30 },
];
/* the breathing. one period, and it is slower than a person's because it is a
   thing pretending to be calm. it drives the eye glow and the face bloom and
   nothing else — the iris itself is a flat red, or a pulse would read as a
   flicker rather than as a glow. */
const PULSE = { period: 2.60, lo: 0.62, hi: 1.00 };

/* ---------- the end ----------
   post20's machinery at post20's numbers, through post21: two stutters, a hard
   hit, and he and the bubble are cut on the hit frame while the wordmark is born
   on it, so the frame exchanges one thing for another and is never empty. */
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

/* ---------- the chat box ----------
   drawn here and nowhere else: a rounded rectangle with a hairline outline, the
   line of type across the top of it, and one row underneath with a plus on the
   left and a filled send disc on the right. **that is the whole of it.** no
   logo, no model name, no placeholder, no attachment tray, no character count —
   a chat box that is recognisable from three parts does not need a fourth, and
   every extra part is a thing a viewer has to decide is not the joke.

   384 wide leaves 78 css px either side, which is 156 device against a floor of
   140. the type is fitted in the page against the face that actually renders and
   it is fitted on the **whole line**, so the size never changes while it types.
   two rows of it is the design rather than an accident: one row of 33 characters
   inside 332 css px is 20 css px of type, which is a footnote. */
const BOX = {
  w: 384, h: 190, r: 30, pad: 26, padTop: 24,
  textH: 84, size: 34, minCapPx: 34,
  plus: { r: 15, arm: 6.5 },
  send: { r: 17 },
};
BOX.x = +(VW / 2 - BOX.w / 2).toFixed(2);
BOX.y = +(CENTRE_Y - BOX.h / 2).toFixed(2);
BOX.rowY = BOX.h - BOX.pad - BOX.send.r;
BOX.plusX = BOX.pad + BOX.plus.r;
BOX.sendX = BOX.w - BOX.pad - BOX.send.r;
/* the caret blinks on its own clock and it never stops, because a caret that
   goes solid while typing and blinks when it is not is two behaviours and one of
   them always looks broken at twelve fps. 1.06s is the system rate. */
const CARET = { period: 1.06, on: 0.62 };

/* crf 17, every dark clip's: this frame is nearly all flat black with soft
   glows across it, which is exactly what a codec bands. */
const CRF = 17;

/* ---------- the mix ----------
   post16's rig, because there is no voice: thirty odd transients on silence, so
   the peak ceiling is the likely winner and both numbers are printed either way.
   nothing to duck under and no envelope. */
const TARGET_LUFS = -14;
const SAMPLE_CEILING = -1.8;
const PEAK_CEILING = -1.0;
const LIMIT_ALLOW = 1.5;
/* the key goes up from the table's -34, which was set for a run of ticks under a
   read. there is no read here and the typing is the whole of the first beat. */
const KEY_DB = -28;
/* the rumble. a 38 hertz drone is nearly invisible to a k weighted meter and
   very visible to a peak one, so it is set by ear against the ticks either side
   of it rather than by the loudness target. */
const HUM_DB = -24;
/* the three stutters after the hit, getting quieter as the picture settles. */
const STUT_DB = [-29, -32, -35];
const PRE_DB = [-32, -27];

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
/* the fall, and it is a square rather than a bezier on purpose. a thing let go
   of covers time squared, which is the one curve here that is not a taste; it
   also happens to be the flattest accelerating curve there is, and that matters
   because the shutter's ceiling is on the **peak** step rather than the average
   one. a bezier steep enough to read as a drop peaks at nearly four times its
   own average and blows the ceiling at a third of this distance. */
const FALL = p => p * p;
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

/* ---------- the typing ----------
   one character per slot, and a slot is the line divided by its own window. what
   comes back is a count rather than a string, so the same function answers the
   frame, the cue list and every guard. */
const PER = (TYPE.to - TYPE.from) / LINE.length;
const charsAt = t => Math.max(0, Math.min(LINE.length,
  Math.floor(span(t, TYPE.from, TYPE.to) * LINE.length + 1e-9)));
/* a tick lands on the frame a character appears on, and **a space does not
   tick**: a space bar under a finger is a different, quieter thing, and dropping
   it is what makes the run read as six words rather than as one buzz. */
const TICKS = [];
for (let i = 0; i < LINE.length; i++) {
  if (LINE[i] !== ' ') TICKS.push(+(TYPE.from + (i + 1) * PER).toFixed(4));
}

/* the caret. a hard step, held on its own clock, never eased. */
const caretAt = t => ((t % CARET.period) / CARET.period < CARET.on ? 1 : 0);

/* the box, falling. it is let go of rather than thrown: the curve starts slow
   and it never comes back, and the fade runs behind the fall so the last thing
   that leaves the frame is the outline rather than the type. */
const boxY = t => n4(DROP.fall * FALL(span(t, DROP.at, DROP.at + DROP.for)));
const boxO = t => n4(1 - EASE(span(t, DROP.at + DROP.for * 0.30, DROP.at + DROP.for)));

/* how red the iris is, nought to one: dark until the hit, then flat red for the
   rest of the film. the breathing is on the glow and not on this. */
const redAt = t => (t < APPEAR ? 0 : 1);
const pulseAt = t => n4(lerp(PULSE.lo, PULSE.hi,
  0.5 + 0.5 * Math.sin(2 * Math.PI * (t - APPEAR) / PULSE.period - Math.PI / 2)));

/* ---------- a point on the head, in css px on the frame ----------
   `headRect`'s own chain for a point in card space: its offset from the card's
   centre, through the card's two scales and its rotation, then out to the page.
   the eye glow and the face bloom both hang off it, and both have to sit on the
   head that is drawn rather than the one the plan describes. */
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
const faceSpot = (plan, fr) =>
  cardPoint(plan, fr, HEAD.plate.x + HEAD.plate.s / 2, HEAD.plate.y + HEAD.plate.s / 2);

/* ---------- the glitch ----------
   post12's, through post20's and post21's: a function of the output frame index
   and of nothing else, so a one frame rgb split is not on for one subframe of
   four and landing at a quarter strength.

   three kinds of window. `appear` and `hit` both ride the heat curve, because
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
function glitchWindows(fps) {
  return [
    { ...onGrid(APPEAR, AP.hard + AP.tail, fps), kind: 'appear', seed: 0x22a1e0 },
    ...STUT.map((w, i) => ({ ...onGrid(w.t, w.for, fps), kind: 'stutter', force: w.force, seed: 0x3300 + i * 811 })),
    ...END.pre.map((w, i) => ({ ...onGrid(w.t, w.for, fps), kind: 'stutter', force: w.force, seed: 0x51a0 + i * 977 })),
    { ...onGrid(END.at, END.hard + END.tail, fps), kind: 'hit', seed: 0x0c1a55 },
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
   and `f` is the output frame it belongs to. the two switches — he arrives, and
   he is exchanged for the wordmark — are on the **frame** rather than on the
   instant, which is post20's 60fps finding: every channel in an exchange goes on
   the same frame or the shutter finds the seam. */
function frameAt(plan, mf, t, f) {
  const g = glitchAt(f);
  const born = f >= Math.round(APPEAR * FPS);
  const cut = f >= Math.round(END.at * FPS);
  const on = born && !cut;
  const red = on ? redAt(t) : 0;
  const pulse = pulseAt(t);
  const wp = span(t, END.wmIn, END.wmIn + END.wmFor);
  const eyes = eyeSpots(plan, mf);
  const face = faceSpot(plan, mf);
  return {
    t: +t.toFixed(4), f,
    mo: on ? 1 : 0,
    /* the iris, mixed from the module's own token to the site's own red, written
       as a resolved colour rather than as a colour-mix so the number in the
       report and the number on the frame are the same one. */
    iris: 'rgb(' + EYE_DARK.map((c, i) => Math.round(lerp(c, RED[i], red))).join(',') + ')',
    eyes, face,
    eyeGlow: n4(red * pulse),
    /* the bloom is a ring rather than a disc and it is well under the eyes: it
       is light coming off the edges of a lit face, and a face that glows evenly
       is a lamp. */
    bloom: n4(red * pulse * 0.72),
    box: {
      y: cut ? 0 : boxY(t), o: cut ? 0 : boxO(t),
      chars: charsAt(t),
      caret: (!cut && boxO(t) > 0.004) ? caretAt(f / FPS) : 0,
      /* the focus glow, and it is load bearing rather than decoration: for the
         first two and a half seconds it is the only thing on the frame that
         changes on every frame, and the liveness guard is measured on what this
         file writes. a focused input that breathes is also simply what one
         does. */
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
     reason it is: --bg, --fg, --bub and --red are the site's and this file is
     not allowed a second opinion about any of them. there is no caption engine
     in this cut to emit them, so it is done here instead. the overrides below
     come after and only touch the three faces, none of which the dark block
     declares. */
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
  /* the eyes, which are index.html's own dark --red written as components so
     they can be used at an alpha. there is a guard that these are still that. */
  --laser:${rgb(RED)};
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
/* ---- the iris, and it is the whole of the red ----
   this beats the module's own class selector rather than changing the token:
   --eye also draws the brows, the pill's ground and a glove's edge, and none of
   those is meant to go red. */
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
   a soft red disc over each eye, on top of the head rather than under it,
   because it is a bloom coming off the ink. no css filter anywhere near the
   mascot's own layers — the module's own note about a filter over a promoted
   layer is the reason. */
.eyeglow{position:absolute;left:0;top:0;width:96px;height:96px;margin:-48px 0 0 -48px;
  border-radius:50%;pointer-events:none;z-index:5;opacity:var(--o,0);
  transform:translate3d(calc(var(--x,0) * 1px),calc(var(--y,0) * 1px),0);
  will-change:transform,opacity;
  background:radial-gradient(circle,
    rgba(var(--laser),.66) 0%, rgba(var(--laser),.28) 30%,
    rgba(var(--laser),.07) 56%, rgba(var(--laser),0) 74%)}
/* ---- and the face, bloomed ----
   a ring rather than a disc: it is nought across the middle of the head, comes
   up where the silhouette is and falls away outside it, so what it lights is the
   **edge** of the plate. behind him, so his own ink stays the darkest thing on
   his own face. */
.bloom{position:absolute;left:0;top:0;pointer-events:none;z-index:2;opacity:var(--o,0);
  width:${(SIZE * 1.62).toFixed(1)}px;height:${(SIZE * 1.62).toFixed(1)}px;
  margin:${(-SIZE * 0.81).toFixed(1)}px 0 0 ${(-SIZE * 0.81).toFixed(1)}px;
  border-radius:50%;
  transform:translate3d(calc(var(--x,0) * 1px),calc(var(--y,0) * 1px),0);
  will-change:transform,opacity;
  background:radial-gradient(circle,
    rgba(var(--laser),0) 0%, rgba(var(--laser),0) 40%,
    rgba(var(--laser),.20) 55%, rgba(var(--laser),.07) 70%,
    rgba(var(--laser),0) 86%)}

/* ---- the chat box ----
   an outline in the site's own --bub over a ground a shade above the page, which
   is post17's dark redraw: a genuinely black box on #06070a is not a box, it is
   nothing. the glow is the focus ring and it breathes. */
.box{position:absolute;left:${BOX.x}px;top:${BOX.y}px;
  width:${BOX.w}px;height:${BOX.h}px;border-radius:${BOX.r}px;
  background:#12161a;border:2px solid var(--bub);
  opacity:var(--bo,1);z-index:4;
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
  <i class="bloom" id="bloom"></i>
${mascotMarkup(plan)}
  <i class="eyeglow" data-glow="0"></i><i class="eyeglow" data-glow="1"></i>
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
  <div class="wm" id="wm">${WM.lines.map(l => '<span>' + l + '</span>').join('')}</div>
${Array.from({ length: GL.bands }, (_, i) => '  <div class="tear" data-tear="' + i
    + '"><div class="tear-in"><div class="wm">'
    + WM.lines.map(l => '<span>' + l + '</span>').join('') + '</div></div></div>').join('\n')}
  <div class="noise" aria-hidden="true"></div>
  <div class="flash" aria-hidden="true"></div>
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
window.__P22 = ${JSON.stringify({ VW, VH, DSF, WM, BOX, LINE })};
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
  const bloom = document.getElementById('bloom');
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
      typed.textContent = P.LINE;
      caret.style.opacity = '1';
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

    /* the box as it actually painted, at rest, in device px off each border. the
       outline is measured too: chrome floors border-width to a whole css pixel
       and the module's own note about the bubble's stroke is why that is worth
       reading back rather than trusting. */
    measureBox() {
      const r = box.getBoundingClientRect(), d = P.DSF;
      return {
        left: +(r.left * d).toFixed(1), top: +(r.top * d).toFixed(1),
        right: +((P.VW - r.right) * d).toFixed(1), bottom: +((P.VH - r.bottom) * d).toFixed(1),
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

      box.style.setProperty('--by', o.box.y.toFixed(2));
      box.style.setProperty('--bo', o.box.o.toFixed(4));
      box.style.setProperty('--bg-glow', o.box.glow.toFixed(4));
      box.style.visibility = o.box.o < 0.004 ? 'hidden' : 'visible';
      caret.style.setProperty('--co', o.box.caret.toFixed(2));
      if (o.box.chars !== lastChars) {
        typed.textContent = P.LINE.slice(0, o.box.chars);
        lastChars = o.box.chars;
      }

      bloom.style.setProperty('--x', o.face.x.toFixed(2));
      bloom.style.setProperty('--y', o.face.y.toFixed(2));
      bloom.style.setProperty('--o', o.bloom.toFixed(4));
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
async function render(plan) {
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
  const boxRect = await page.evaluate(() => window.__p22.measureBox());
  console.log('  built: head ' + built.mas.headPx + 'px, ' + built.mas.eyes + ' eyes, '
    + built.mas.glows + ' glow layers, theme ' + built.mas.theme);
  console.log('  the typed line: Manrope 500 at ' + built.box.size + 'css px, caps '
    + built.box.capPx + ' device, ' + built.box.lines + ' lines, ' + built.box.h
    + 'css tall in a text box of ' + BOX.textH);
  console.log('  the box: ' + boxRect.w + 'x' + boxRect.h + ' device, outline ' + boxRect.stroke
    + ', clear ' + boxRect.left + ' left / ' + boxRect.top + ' top / ' + boxRect.right
    + ' right / ' + boxRect.bottom + ' bottom');
  console.log('  the wordmark: ' + wm.sizeCss + 'css px, widest line ' + wm.widestPx
    + ' device px, caps ' + wm.capPx + ', clear ' + wm.left + ' left / ' + wm.top
    + ' top / ' + wm.right + ' right / ' + wm.bottom + ' bottom');

  /* the bubble, on the frame it is fully up on, measured off the rendered pill
     rather than off the numbers that placed it. this is the check that decides
     `LEFT_OF_CENTRE`. */
  const bub = plan.marks[plan.marks.length - 1].bubble;
  const bubAt = +(bub.full + 0.10).toFixed(3);
  {
    const f = Math.round(bubAt * FPS), t = f / FPS;
    const mf = mascotFrame(plan, t);
    await page.evaluate(fr => window.__mas.apply(fr), mf);
    await page.evaluate(fr => window.__p22.apply(fr), frameAt(plan, mf, t, f));
  }
  const bubSafe = await page.evaluate((w, h) => window.__mas.bubbleSafe(w, h), VW, VH);
  const bubCaps = await page.evaluate(() => window.__mas.caps());
  console.log('  the bubble at ' + bubAt + 's: ' + bubSafe.w + ' device px wide, clear '
    + bubSafe.left + ' left / ' + bubSafe.top + ' top / ' + bubSafe.right + ' right / '
    + bubSafe.bottom + ' bottom, caps ' + bubCaps.capPx + ' device');

  /* the head, as ink, on every frame he is on. the glow and the shadow are
     reported beside it rather than folded into it: a thirty px blur crossing a
     safe line is not ink crossing it. */
  let worst = null;
  for (let f = 0; f < N; f++) {
    const t = f / FPS;
    if (t < APPEAR) continue;
    if (t >= END.at) break;
    const r = headRect(plan, mascotFrame(plan, t));
    const near = Math.min(r.left, r.top, r.right, r.bottom);
    if (!worst || near < worst.near) worst = { t: +t.toFixed(3), near, ...r };
  }

  const sigs = [];
  const wall = Date.now();

  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const mf = mascotFrame(plan, t);
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
           not on the frame would let the first two and a half seconds pass this
           guard on motion nobody can see. what carries the opening is the box's
           own focus glow, which is the honest answer. */
        let s = o.mo * 7 + o.eyeGlow * 11 + o.bloom * 13 + o.box.y * 17 + o.box.o * 19
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
    [1.10, 'b-typing'],
    [TYPE.to + 0.10, 'c-the-line'],
    [DROP.at + 0.22, 'd-the-box-falls'],
    [DARK + 0.04, 'e-nothing'],
    [APPEAR + 0.01, 'f-the-hit'],
    [APPEAR + 0.34, 'g-red-eyes'],
    [STUT[1].t, 'h-a-stutter'],
    [5.00, 'i-holding'],
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
    const mf = mascotFrame(plan, t);
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
  console.log('  the glow reaches ' + worst.glowReach + 'px past the ink');

  await browser.close();
  srv.close();
  if (SUB > 1) blend(N);

  const state = { built, wm, boxRect, bubSafe, bubCaps, bubAt, head: worst, sigs, frames: N };
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

/* ---------- the two marks ----------
   both `neutral`, which is the only calm state in the module's table: the brief
   rules out angry and unimpressed outright and says the read is in the eyes.

   the second one exists for one reason and it is worth stating rather than
   hiding. the module's single bubble is placed at its mark's `settled` plus
   0.12, so a thought at 6.32 needs a mark at 5.74, and there is no other way to
   ask for it — the list spelling runs on the `quick` profile, which is 0.80s
   end to end and would be gone before the brief's last beat starts. what that
   costs is a small settle from 5.44: neutral's own exit and entrance, which is
   two per cent of scale, and it lands as an anticipation a third of a second
   before he speaks. it is inside the brief's hold still window and it is the
   only motion in it. */
const BUB_TEXT = 'AI LL BE BACK';
const MARK2 = 5.74;
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
     schedule puts exactly one inside 7.00 to 7.50 and none across the frame he
     arrives on, which is 27. the guard below re-checks it rather than trusting
     this comment, and it fails with the window it wanted. */
  seed: 27,
  /* the brief says beside. see the note at the top of this file: `beside` wants
     the head's own width again in clear space off his flank and a four word pill
     does not have it anywhere near the middle of a 540 wide stage, so it is the
     module's own answer to exactly that — the run climbs off the crown to his
     right at 50 degrees. */
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

const BUB = plan.marks[plan.marks.length - 1].bubble;
const rep = mascotMotion(plan, FPS, SECONDS);
const rep60 = FPS === 60 ? rep : mascotMotion(plan, 60, SECONDS);

console.log(describeMascot(plan));
console.log(describeMotion(rep));

/* ---------- the cues ----------
   nothing in this list is a number typed to taste: a tick is a character
   arriving, the rumble is the box letting go, the pop is the module's own cue
   for its own bubble, and the glitches are the frames the picture breaks on. */
const cues = [
  ...TICKS.map((t, i) => ({ t, kind: 'key', from: i ? '' : 'the typing: ' + TICKS.length + ' letters, no space ticks' })),
  {
    t: DROP.at, kind: 'hum',
    opts: { len: 1.05, f: 38, rise: 0.22, fall: 0.62 },
    from: 'the rumble under the drop. there is no thunder in the set: this is `hum` at 38 hertz',
  },
  {
    t: APPEAR, kind: 'glitch',
    opts: { len: 0.16, burst: 0.010, crush: 2300, f0: 280, f1: 92, seed: 0x22a1e0 },
    from: 'the hit he arrives on',
  },
  ...mascotCues(plan).map(c => ({ ...c, from: 'the module\'s own cue for its own bubble' })),
];
const { buf: sfx, report: sfxReport } = renderSfx(cues, SECONDS, { gains: { key: KEY_DB, hum: HUM_DB } });

/* the five stutters, on one bus: three after the hit getting quieter as the
   picture settles, and two before the fault getting louder into it. same recipe
   every time, and the level is the only argument. */
const STUT_ALL = [
  ...STUT.map((w, i) => ({ w, db: STUT_DB[i], seed: 0x3300 + i * 811, len: 0.05 + i * 0.008, what: 'stutter ' + (i + 1) + ' of three, after the hit' })),
  ...END.pre.map((w, i) => ({ w, db: PRE_DB[i], seed: 0x51a0 + i * 977, len: 0.05 + i * 0.014, what: 'stutter ' + (i + 1) + ' of two, into the fault' })),
];
for (const s of STUT_ALL) {
  const g = GL_WINDOWS.find(x => Math.abs(x.t0 - Math.round(s.w.t * FPS) / FPS) < 1e-9 && x.kind === 'stutter');
  const one = renderSfx([{
    t: g ? g.t0 : s.w.t, kind: 'glitch',
    opts: { len: s.len, burst: 0.004, crush: 3800, f0: 210, f1: 120, seed: s.seed },
    from: s.what,
  }], SECONDS, { gains: { glitch: s.db } });
  for (let j = 0; j < sfx.length; j++) sfx[j] += one.buf[j];
  sfxReport.push(...one.report);
}
sfxReport.sort((a, b) => a.t - b.t);

/* ---------- the mix ---------- */
const WAV = path.join(OUT, 'post22-sfx.wav');
const RAW = path.join(OUT, 'post22-sfx-raw.wav');
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
const QUIET_FROM = +(STUT[STUT.length - 1].t + 0.06).toFixed(2);
const beats = [
  [0, 'a chat box on a black frame, empty, its caret blinking'],
  [TYPE.from, 'the line starts typing, ' + LINE.length + ' characters at '
    + (1 / PER).toFixed(1) + ' a second, ' + TICKS.length + ' of them ticking'],
  [TYPE.to, '"' + LINE + '" is finished and holds'],
  [DROP.at, 'the box drops ' + DROP.fall + 'px over ' + DROP.for.toFixed(2)
    + 's and fades. the rumble'],
  [DARK, 'nothing on the frame at all'],
  [APPEAR, 'the hit. he is there, red eyed, and the glow starts breathing on a '
    + PULSE.period.toFixed(2) + 's period'],
  ...STUT.map((w, i) => [w.t, 'stutter ' + (i + 1) + ' of three, ' + (w.force * 100).toFixed(0) + '% heat']),
  [4.00, 'he holds. nothing sounds from ' + QUIET_FROM + 's to ' + (BUB.in + BUBBLE.step * 2).toFixed(2) + 's'],
  [MARK2, 'the second neutral mark: a two per cent settle before he speaks'],
  [BUB.in, 'the dots leave the crown'],
  [+(BUB.in + BUBBLE.step * 2).toFixed(3), 'the pill pops. "' + BUB_TEXT + '"'],
  [BUB.full, 'the bubble is fully up'],
  [BUB.leaving, 'it starts to go, and the fault takes it at ' + BUB.out.toFixed(2)],
  ...END.pre.map((w, i) => [w.t, 'stutter ' + (i + 1) + ' of two, into the fault']),
  [END.at, 'the fault. he and the bubble are cut and the wordmark is born on that frame'],
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
  'the silence': 'nothing at all from ' + QUIET_FROM + 's to '
    + (BUB.in + BUBBLE.step * 2).toFixed(2) + 's, which covers the brief\'s own 4.0 to 6.0 window '
    + 'with room either side. no voice and no music',
  'the rumble': 'there is no thunder in lib/sfx.mjs. this is `hum` at 38 hertz with a slow '
    + 'swell, which is a sub drone rather than a crack, and it is the first thing to argue about',
}));

/* ---------- the fast things, measured before anything renders ----------
   the box falling is the only move in this file that could outrun the shutter,
   so it is walked at sixty in the unit the argument is had in. */
const fastest = (fn, a, b) => {
  let d = 0, at = a;
  for (let f = Math.floor(a * 60); f <= Math.ceil(b * 60); f++) {
    const s = Math.abs(fn((f + 1) / 60) - fn(f / 60));
    if (s > d) { d = s; at = f / 60; }
  }
  return { d: +d.toFixed(2), at: +at.toFixed(3) };
};
const dropStep = fastest(boxY, DROP.at, DROP.at + DROP.for);
console.log('\n  the fast things, at sixty');
console.log('    the box peaks at ' + dropStep.d + ' css px a frame at ' + dropStep.at + 's, which is '
  + (dropStep.d * DSF / SUB).toFixed(1) + ' device px between samples at ' + SUB + ' subframe'
  + (SUB === 1 ? '' : 's') + ' (ceiling ' + STEP_CEIL + ' css px)');

const state = ONLY_ENCODE
  ? JSON.parse(fs.readFileSync(path.join(OUT, 'post22.json'), 'utf8'))
  : await render(plan);
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
   the one guard that reaches back into index.html: this file writes the eyes as
   three numbers and they have to be the dark theme's --red. */
{
  const dark = brandTokens().dark;
  /* the box's outline is the site's own --bub and it is emitted into the page
     out of index.html rather than typed here, so the only thing to check is that
     the site still has one. the module scopes its own copy to `.m-zone`, which
     is why a layer outside the zone cannot simply borrow it. */
  if (!/--bub:/.test(dark)) fail.push('index.html\'s dark block has no --bub, and the chat box is outlined in it');
  const m = /--red:\s*#([0-9a-f]{6})/i.exec(dark);
  if (!m) fail.push('index.html\'s dark block has no --red in it any more');
  else {
    const want = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16));
    if (want.join(',') !== RED.join(',')) {
      fail.push('the eyes are rgb(' + RED.join(',') + ') and the site\'s --red is now rgb('
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
{
  /* two marks, both neutral, and the brief's two forbidden states are asserted
     on the plan so a later edit cannot reach for one unnoticed. */
  const got = plan.marks.map(m => m.state);
  if (got.join(',') !== 'neutral,neutral') fail.push('the states are ' + got.join(', ') + ', wanted neutral, neutral');
  if (got.some(s => s === 'unimpressed' || s === 'annoyed')) fail.push('the brief rules out an unimpressed mascot');
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
/* he is where this file put him, and the offset is the pill's rather than a
   taste: the guard on the bubble below is the one that decides it. */
{
  const offX = +((VW / 2 - (plan.box.left + halfBox)) * DSF).toFixed(2);
  console.log('  he stands ' + (offX / DSF).toFixed(1) + ' css px left of centre, and the pill is why');
  if (Math.abs(offX / DSF - LEFT_OF_CENTRE) > 0.5) fail.push('his box is not where LEFT_OF_CENTRE put it');
}
/* the blinks. the brief asks for one in the last beat and the module's schedule
   is where they come from, so this reports rather than places, and it fails only
   if the beat has none at all. */
{
  const inBeat = plan.idle.blinks.filter(b => b.t >= 7.00 && b.t < END.at);
  console.log('  blinks: ' + plan.idle.blinks.length + ' in the film, '
    + plan.idle.blinks.filter(b => b.t >= APPEAR && b.t < END.at).length + ' while he is on screen, '
    + inBeat.length + ' in the last beat at ' + inBeat.map(b => b.t.toFixed(2)).join(', '));
  if (inBeat.length !== 1) fail.push('there are ' + inBeat.length + ' blinks between 7.00s and the fault, '
    + 'and the brief asks for one — walk the seed');
  if (plan.idle.blinks.some(b => b.t > APPEAR - 0.15 && b.t < APPEAR + 0.45)) {
    fail.push('a blink lands across the frame he arrives on, and he arrives with his eyes open — walk the seed');
  }
}

/* ---------- the typing ---------- */
{
  if (charsAt(TYPE.from - 0.01) !== 0) fail.push('the line has started before ' + TYPE.from);
  if (charsAt(TYPE.to) !== LINE.length) fail.push('the line is not finished at ' + TYPE.to);
  if (charsAt(DROP.at) !== LINE.length) fail.push('the line is not finished when the box drops');
  /* a character a frame at most, or two letters arrive on one frame and the
     typing reads as a paste. */
  let biggest = 0;
  for (let f = 1; f < Math.round(DROP.at * 60); f++) {
    biggest = Math.max(biggest, charsAt(f / 60) - charsAt((f - 1) / 60));
  }
  console.log('  the typing: ' + LINE.length + ' characters, at most ' + biggest
    + ' arriving on one frame at sixty, ' + TICKS.length + ' ticks');
  if (biggest > 1) fail.push(biggest + ' characters arrive on one frame at sixty');
  const keys = sfxReport.filter(r => r.kind === 'key');
  if (keys.length !== TICKS.length) fail.push('there are ' + keys.length + ' ticks for ' + TICKS.length + ' letters');
  const spaces = LINE.length - LINE.replace(/ /g, '').length;
  if (TICKS.length !== LINE.length - spaces) fail.push('a space ticked');
  for (const k of keys) {
    if (k.t < TYPE.from || k.t > TYPE.to + 1e-6) fail.push('a tick at ' + k.t + 's is outside the typing');
  }
  /* the copy, on the words that reach the screen. */
  if (LINE !== LINE.toLowerCase()) fail.push('the typed line is not lower case');
  for (const [what, s] of [['the typed line', LINE], ['the bubble', BUB_TEXT]]) {
    if (/['\u2019]/.test(s)) fail.push(what + ' carries an apostrophe: "' + s + '"');
    if (/[!]/.test(s)) fail.push(what + ' carries an exclamation mark');
    if (/[—–]/.test(s) || /\s-\s/.test(s)) fail.push(what + ' carries a punctuation dash');
  }
  if (BUB_TEXT !== BUB_TEXT.toUpperCase()) fail.push('the bubble is not in caps: "' + BUB_TEXT + '"');
}

/* ---------- the box ---------- */
{
  const b = state.built.box, r = state.boxRect;
  if (!/Manrope/.test(b.font)) fail.push('the typed line is not set in Manrope: ' + b.font);
  if (b.stoppedBy) fail.push('the box fit ran all the way down and was still stopped by ' + b.stoppedBy);
  if (b.capPx < BOX.minCapPx) fail.push('the typed line caps measure ' + b.capPx + ' device px, floor is ' + BOX.minCapPx);
  if (b.lines > 2) fail.push('the typed line wraps to ' + b.lines + ' lines and the box is drawn for two');
  for (const k of ['left', 'top', 'right', 'bottom']) {
    if (r[k] < floor - 0.5) fail.push('the box comes within ' + Math.round(r[k]) + 'px of the ' + k + ' border');
  }
  if (parseFloat(r.stroke) < 1.5) fail.push('the box outline resolved to ' + r.stroke + ', which h.264 will eat');
  /* it is on from frame zero, gone before the hit, and it never comes back. */
  if (boxO(0) !== 1) fail.push('the box is not up on frame zero');
  if (boxO(DROP.at - 0.01) !== 1) fail.push('the box has started fading before it drops');
  if (boxO(DARK) !== 0) fail.push('the box is still on the frame at ' + DARK);
  if (boxY(DROP.at) !== 0) fail.push('the box has moved before it drops');
  /* how far it actually got, and what finished it. the fade is allowed to be the
     thing that clears the last of it — see the note on DROP — but it has to have
     genuinely fallen first, or it is a box dissolving on the spot. */
  const fell = boxY(DARK);
  console.log('  the box falls ' + fell + ' css px by ' + DARK + 's, '
    + (BOX.y + fell > VH ? 'clear of the frame'
      : 'its top at ' + (BOX.y + fell).toFixed(0) + ' of ' + VH + ', and the fade finishes it')
    + ', ' + (fell / BOX.h).toFixed(1) + ' box heights');
  if (fell < BOX.h) fail.push('the box falls ' + fell + ' css px, less than its own height');
  if (dropStep.d > STEP_CEIL) {
    fail.push('the box moves ' + dropStep.d + ' css px on one frame at 60, ceiling is ' + STEP_CEIL);
  }
  /* and the frame is genuinely empty for a beat before he arrives. */
  const darkFor = +(APPEAR - DARK).toFixed(3);
  console.log('  the frame is empty for ' + darkFor + 's before he arrives');
  if (darkFor < 0.06) fail.push('the dark beat is ' + darkFor + 's, which is not a beat');
}

/* ---------- the bubble ---------- */
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
  /* it pops inside the brief's own window and the fault takes it rather than it
     leaving into an empty frame. */
  const pop = +(BUB.in + BUBBLE.step * 2).toFixed(4);
  if (!(pop >= 6.00 && pop < 7.00)) fail.push('the pill pops at ' + pop + 's, outside the brief\'s 6.0 to 7.0');
  if (Math.abs(BUB.out - END.at) > 0.02) {
    fail.push('the bubble is out at ' + BUB.out + 's rather than on the fault at ' + END.at);
  }
  const pops = sfxReport.filter(r => r.kind === 'pop');
  if (pops.length !== 1) fail.push('there are ' + pops.length + ' pops for one bubble');
  if (pops[0] && Math.abs(pops[0].t - pop) > 0.006) fail.push('the pop is not on the pill');
}

/* ---------- the red ---------- */
{
  if (redAt(APPEAR - 0.02) !== 0) fail.push('the eyes are red before he arrives');
  if (redAt(APPEAR) !== 1) fail.push('the eyes are not red on the frame he arrives on');
  if (redAt(END.at - 0.02) !== 1) fail.push('the eyes have gone dark before the fault');
  /* the pulse is a breath rather than a flicker: it never lets go completely and
     it turns over at least twice while he is on screen. */
  let lo = 2, hi = -1, turns = 0, up = null;
  for (let f = Math.round(APPEAR * 60); f < Math.round(END.at * 60); f++) {
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
  /* and nothing red survives the fault. */
  const cutF = Math.round(END.at * FPS);
  const on = frameAt(plan, mascotFrame(plan, cutF / FPS), cutF / FPS, cutF);
  if (on.eyeGlow !== 0 || on.bloom !== 0) fail.push('the red glow survives the fault');
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
  const want = ['glitch', 'hum', 'key', 'pop'];
  if (kinds.join(',') !== want.join(',')) {
    fail.push('the bus carries ' + kinds.join(', ') + ', wanted ' + want.join(', '));
  }
  /* the brief's silent window, asserted rather than hoped for. a cue's own
     length is added, so a sound that starts before 4.00 and rings into it is
     caught as well as one that starts inside it. */
  for (const r of sfxReport) {
    const ends = r.t + (r.seconds || 0);
    if (ends > 4.00 && r.t < 6.00) {
      fail.push('the ' + r.kind + ' cue at ' + r.t + 's sounds inside the silent window');
    }
  }
  const rum = sfxReport.filter(r => r.kind === 'hum');
  if (rum.length !== 1) fail.push('there are ' + rum.length + ' rumbles and there is one drop');
  if (rum[0] && Math.abs(rum[0].t - DROP.at) > 0.006) fail.push('the rumble is not on the drop');
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
  const at = f => frameAt(plan, mascotFrame(plan, f / FPS), f / FPS, f);
  const apF = Math.round(APPEAR * FPS), cutF = Math.round(END.at * FPS);
  if (at(0).mo !== 0) fail.push('he is on frame zero, and the brief says no mascot yet');
  if (at(apF - 1).mo !== 0) fail.push('he is on the frame before the hit');
  if (at(apF).mo !== 1) fail.push('he is not born on the hit frame');
  if (at(apF).box.o !== 0) fail.push('the box is still on the frame he arrives on');
  if (at(cutF - 1).mo !== 1) fail.push('he is already gone before the fault');
  if (at(cutF).mo !== 0) fail.push('he is still on the frame the wordmark arrives on');
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
  /* post12's named exception: the ceiling on how much of a clip may be glitching
     is 30%, and it is read against the ending the fault lives in. */
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
  /* the three the brief asks for, all of them inside its own window, all of them
     weaker than the hit that came first. */
  const after = GL_WINDOWS.filter(w => w.kind === 'stutter' && w.t0 < 4.00);
  if (after.length !== 3) fail.push('there are ' + after.length + ' stutters after the hit, wanted three');
  for (let i = 0; i < after.length; i++) {
    if (after[i].t0 < APPEAR || after[i].t1 > 4.00 + 1e-9) {
      fail.push('stutter ' + (i + 1) + ' is outside the 3.0 to 4.0 window');
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

console.log('\n  outstanding');
console.log('    the clip is ' + SECONDS.toFixed(2) + 's: the brief\'s beats run to '
  + END.at.toFixed(2) + ' and the end card follows them, which is where post20 and post21 put it');
console.log('    the bubble is the module\'s `over-right`, not `beside` — see the note at the top');
console.log('    the pill pops at ' + (BUB.in + BUBBLE.step * 2).toFixed(2) + 's rather than at 6.00, '
  + 'because the module\'s thought is exactly 1.68s and the brief wants it on the frame the fault takes');
console.log('    the rumble is `hum` at 38 hertz. there is no thunder in the set and none was added');

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
