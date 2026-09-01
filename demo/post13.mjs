/* the boring tek — post13, the yap.

   five seconds, dark only, 1080x1920. the mascot alone in the middle of a black
   frame, talking. he has no mouth, so a hand stands in for one: it sits low on
   the face where a mouth would be and it opens and shuts, bla bla bla, and it
   does not stop. his eyes tell the rest. they start alive, they narrow, they
   droop, and then one of them rolls off to the side looking for a way out of
   this. then the signal tears and three words replace him.

     node post13.mjs                     1080x1920, 60fps, shutter closed
     DEMO_FPS=12 node post13.mjs         the fast preview pass
     node post13.mjs --blur              60fps with the shutter open
     node post13.mjs --blur=6            a wider shutter
     node post13.mjs --keep-frames       leave the jpegs on disk
     node post13.mjs --encode-only       re-encode from kept frames

   one output, one path, overwritten every run:

     demo/out/post13-dark-1080x1920.mp4

   ---------- what this one is ----------

   post12 is a joke about a robot. this is a joke about us. the label says it
   once, on the first frame, and then holds still while he suffers under it:
   `when ai is tired of humans`. everything after that is a small machine being
   worn down by talking, which is a thing anybody who has sat through a meeting
   recognises, and the brand content is still three words at the end.

   it is the second clip built on post12's skeleton — the centred mascot, the
   deep glow label over his head, the stutters into a hard tear, the end card —
   and the third pass over that shape. what is new is the **hand**, and it is
   new in `lib/mascot.mjs` rather than here.

   ---------- the hand is the module's, not this file's ----------

   `HAND` and `YAP` live in `lib/mascot.mjs` beside the eyes and the brows, and
   this file turns them on with two words: `hand: true` on the plan and `yap:
   true` on each mark. it is **opt in and off by default**, and the promise
   attached to that is checked rather than asserted — see THE HAND IS OFF at the
   bottom of this file for how, and what "unchanged" can and cannot mean against
   a renderer that is not bit exact.

   the reason it is in the module is the reason the eyes are: it is anatomy. a
   clip that drew its own mouth would be a clip that invented a face, and the
   next clip would invent a different one.

   ---------- the eye story, and where the slow blink went ----------

   the brief's five beats are: alive, a slow blink, narrow, droop half shut, one
   eye rolls off. they are carried by three marks and the states' own insides,
   because a state is several beats and inventing a fourth mark would cost the
   clip a second it does not have — `planMascot` will not seat a mark inside
   another mark's entrance and exit, so four states is 4.7 seconds of floor
   before the tear or the end card get any of it.

     0.00  neutral      alive. he settles onto rest and the idle layer does the
                        rest of it: drift, breathing, saccades, blinks. the hand
                        is already going.
     0.76  the idle     the slow blink, 0.363s of it, off the schedule the plan
           layer        seed was chosen for.
     1.10  thinking     narrow. lids to 0.56 and 0.30, gaze off camera, and the
                        slow scan across during the hold.
     2.42  unimpressed  droop, and the roll. lids to 0.54, brows in low and
                        turned out, the head sinking and leaning away — and this
                        state has **its own slow blink** in the middle of its
                        hold, longer than any idle one, taking the lids to 0.96
                        and back.

   **the slow blink is the one beat that could not go where the brief puts it.**
   there is no slow blink in the state table on its own — the idle ones are a
   quarter of a second and this wants half — and the one that exists is written
   into `unimpressed`, at 0.86 into its own hold. with three marks inside five
   seconds that lands at 3.40, which is under the stutters and half torn off by
   the hit; for it to finish before the fault starts the clip would have to run
   5.3 seconds. a fourth mark costs 1.06s of floor, which is worse.

   so it comes off the layer that already makes blinks, and **the plan seed is
   chosen rather than default** — see the note by `seed` below for the search and
   the two guards that keep the beat from disappearing quietly. `unimpressed`
   still does its own at 3.40, where the tear catches it, so the last thing he
   does before the frame breaks is start to shut his eyes. that is a better
   ending than the one that was planned and it is an accident.

   the roll is the **turn channel**, not new anatomy. `unimpressed` already does
   side eye, and 0.72 of a turn on top of it slides both eyes toward screen
   right, foreshortens the far one and closes the gap between them from 21 grid
   units to 17.8 — which is a head looking away rather than two slabs sliding. it
   goes to screen right because the hand is on screen left: he looks away from
   his own mouth. it was 0.58 in the first cut and a rendered frame said that is
   not a roll, it is thin eyes.

   ---------- the sound ----------

   three new voices in `lib/sfx.mjs`, and the mumble is the whole floor of the
   clip. `mumble` is a formant synth rather than a filtered tone, because what
   makes a noise read as speech is the two resonances moving, not the pitch —
   see that file. `sigh` and `annoyed` are the two moments he is a character.

   **every cue is a time something else already decided.** the mumble is one
   syllable per yap cycle, at the cycle's own start and for exactly as long as
   the mouth is doing something. the sigh is the droop arriving, read off the
   module's own preflight. the beep is the turn arriving, read off the drawn
   head. the glitches are the stutter windows and the cut. nothing in the cue
   list is a number somebody typed to taste.

   ---------- the shutter, and what rides it ----------

   post10's rule, unchanged, and post12's note on it applies here word for word.
   with `--blur` every output frame is captured four times inside its own
   sixtieth of a second and the four are averaged, so anything written against
   `t` smears — which is what a yapping hand and a snapping wordmark both want.
   the glitch does not: a one frame rgb split written against `t` would be on
   for one subframe of four and land at a quarter strength. so the glitch and
   the cut are computed once per **output** frame and held across every capture
   of it. `glitchAt` takes `f`; everything else takes `t`. */

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
  STATES, STAGE, SAFE, HEAD_PX, GRID, HEAD, IDLE,
} from './lib/mascot.mjs';
import { renderSfx, writeWav, applyGain, limit, loudness, VOICES } from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post13');
const SUBS = path.join(OUT, 'subframes-post13');
const VERIFY = path.join(OUT, 'verify-post13');

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
const SUB = BLUR ? Math.max(2, Math.min(12, Number(BLUR_ARG) || 4)) : 1;
const SUBSTEP = STEP / SUB;

/* ---------- where he stands ----------
   post12's line, and it is the same line on purpose: the middle of the **safe
   band** rather than of the frame, which puts him ten css px above the middle
   of the file because the platforms take more off the bottom than the top. the
   wordmark lands on the same line, so he is replaced rather than followed. */
const CENTRE_Y = (SAFE_CSS.top + (VH - SAFE_CSS.bottom)) / 2;
const SIZE = 148;

/* ---------- the cut ----------
   three marks, and the room between them is the states' own floors rather than
   taste: `planMascot` refuses a mark with no room for its own entrance, a hold
   and its exit, and the three below sit within four hundredths of those floors
   at the front. the whole clip is as short as this story allows.

   see the note at the top of the file for which beat each state carries and for
   why the slow blink is inside `unimpressed` rather than on a mark of its own.

   every mark yaps. `yap: true` runs from the mark to the next one, and the
   module merges the three windows into one continuous train, so the hand does
   not reset its phase at a mark boundary — the mumble is one mumble rather than
   three. the last window runs to the end of the plan, which is past the frame
   he is cut on: the hand goes on yapping where nobody can see it, and the cues
   stop at the cut. that is the honest shape of "he never stops", and the guard
   at the bottom asserts the sound stops even though the plan does not. */
const HIT = 3.49;
const CUT = {
  marks: [
    { t: 0.00, state: 'neutral', yap: true },
    { t: 1.10, state: 'thinking', yap: true },
    /* the turn is positive, which is a gaze to screen right. the hand sits low
       on screen left of his face, so he is looking away from his own mouth.

       0.82s to get there, which is longer than this state's own entrance and is
       the point: a roll that arrived with the droop would be one event, and the
       droop has a sigh on it and the roll has a beep on it. spaced like this the
       two land a third of a second apart, which is two beats. it is also simply
       what a tired look sideways is — slow. */
    { t: 2.42, state: 'unimpressed', yap: true, turn: 0.72, turnFor: 0.70 },
  ],
  /* 4.98s, which is the top of the four to five second brief. the arithmetic
     runs backwards from the end card: 1.40s of three words holding, plus the
     0.09 they snap in over, off 4.98 puts the tear at 3.49 — and 3.49 is 0.47
     after the roll arrives, which is the room the last pose gets before the
     signal starts coming apart under it. */
  seconds: 4.98,
};

/* ---------- the end ----------
   post12's ending, to the number where the numbers still apply: three stutters
   escalating under the last beat, then a hard tear that takes him and the label
   off together and puts the wordmark on the same frame. the three stutter times
   moved with the clip and nothing else about the shape did.

   the mascot is **cut**, not faded, and the hand goes with him because it is
   part of him — it lives inside `#m-zone` and takes that zone's opacity, so
   there is no second switch to get out of step with the first. */
const END = {
  /* the build up. `force` is a multiplier on the same envelope driving the same
     channels, because a build up written as a second mechanism is a second
     thing to get out of step with the first. and the bands belong to the hit
     alone: before the wordmark exists a tear band is a black bar over a head
     with nothing behind it, which is the fault post12 paid for. */
  pre: [
    { t: 3.22, for: 0.05, force: 0.32 },
    { t: 3.31, for: 0.05, force: 0.52 },
    { t: 3.40, for: 0.06, force: 0.78 },
  ],
  at: HIT,
  hard: 0.15,
  tail: 0.22,
  wmFor: 0.09,
  clean: 0.06,
};

/* ---------- the cut is a frame, and so is the wordmark's birth ----------
   post12 says the wordmark is born on the same frame the mascot is cut, so the
   frame exchanges one thing for another and is never empty. it says it by
   setting `wmIn` to `END.at` and letting both round to a frame on their own —
   and **that only works when the rounding happens to go up.** post12's 4.06 at
   sixty rounds to frame 244, which is 4.0667, which is after 4.06, so its
   wordmark is already a sixth of the way in on the frame the head leaves. this
   clip's 3.49 rounds to frame 209, which is 3.4833, which is *before* 3.49 —
   so the head went on frame 209 and the wordmark started on frame 210, and
   there was one frame of a black screen with a bloom on it and nothing else.

   the twelve frame preview never saw it: at twelve, 3.49 rounds to frame 42 at
   3.5, which is after. the guard that says the wordmark must be born on the cut
   frame is what caught it, on the sixty pass, which is the whole reason that
   guard is written against `frameAt` rather than against the numbers above.

   so the birth is derived off the cut **frame** rather than off the cut time,
   at whatever rate is rendering: the ramp starts on the frame before it, which
   puts it at exactly nought on the last frame he is on and already on for the
   frame he leaves. one source, no rounding to get lucky with. */
const CUT_FRAME = Math.round(END.at * FPS);
const WM_IN = (CUT_FRAME - 1) / FPS;

/* ---------- a burst is a length in seconds, quantised to the frame grid ------
   post11's rule and post12's note: a fifty millisecond stutter is three frames
   at sixty and six hundredths of a frame at twelve, so written as seconds and
   left alone it would simply not happen on the preview pass. every window is
   snapped to the grid that is rendering — the start to the nearest frame, the
   length rounded up to at least one whole frame — and a guard proves each one
   fires on at least one frame at both rates. */
function onGrid(t, len, fps) {
  const f0 = Math.round(t * fps);
  const n = Math.max(1, Math.round(len * fps));
  return { t0: f0 / fps, t1: (f0 + n) / fps, frames: n };
}

/* ---------- the wordmark ----------
   post12's, unchanged: three lines, centred, on the line his head was on, in
   michroma, fitted in the page rather than guessed because michroma is
   proportional and the tracking is nearly a fifth of an em. */
const WM = {
  lines: ['THE', 'BORING', 'TEK'],
  w: 330,
  lh: 1.16,
  minCapPx: 56,
};

/* ---------- the label ----------
   `when ai is tired of humans`, lower case, no full stop, over his head from
   the first frame to the frame he is cut on. michroma with the wordmark's own
   glow, scaled down with the type, which is the "same treatment as the ai fart
   label" the brief asks for.

   **it is two lines, and that is the one layout decision this clip made on its
   own.** post12's label is two words and fits on one. six words do not: fitted
   to one line inside the safe band the type comes out under sixteen css px,
   which is thirty two device px of box and about twenty of ink — under the
   floor a caption has to clear to be read on a phone, and the page spec's own
   number. broken into two, the widest line is `tired of humans` and it fits at
   twenty eight css px, which is fifty seven per cent of the wordmark: the same
   ratio post12's label landed on, arrived at from the other direction.

   the break is after `is` rather than after `tired`, because `tired / of
   humans` splits a phrase across the line and `when ai is / tired of humans`
   does not. it is also the more even pair.

   it lives inside `.stage`, so the shake is already on it, and it carries the
   rgb split under the same `data-gl` attribute the mascot and the wordmark do.
   on the hit frame it is cut with him and the wordmark is born in their place:
   the frame exchanges one thing for another and is never empty. */
const LABEL = {
  lines: ['when ai is', 'tired of humans'],
  w: 300,            /* the widest line, in css px. 600 device against the wordmark's 660 */
  minInkPx: 28,      /* device px of actual ink height on the widest line. a floor */
  maxOfWm: 0.65,     /* and it may be at most this much of the wordmark's type size */
  gap: 60,           /* device px it must keep off the top of his glow */
};
const LABEL_TEXT = LABEL.lines.join(' ');

/* ---------- where the label sits ----------
   post12's arithmetic, unchanged: midway between the platform's top line and
   the top of his glow, taken at the **highest he ever gets** over the whole
   clip rather than at his resting height. move him, resize him or change what
   he does and the label moves with him.

   this clip never snaps him up the way `surprised` does, so the band is a
   little taller than post12's and the label sits a little lower in it. that is
   the formula doing its job rather than a number being re-tuned. */
function labelY(plan) {
  let headTop = Infinity, glow = 0;
  const N = Math.round(60 * CUT.seconds);
  for (let f = 0; f < N; f++) {
    const r = headRect(plan, mascotFrame(plan, f / 60));
    headTop = Math.min(headTop, r.top);
    glow = Math.max(glow, r.glowReach);
  }
  const lit = headTop - glow;                /* device px from the top of the frame */
  return {
    headTop: +headTop.toFixed(1), glow: +glow.toFixed(1), lit: +lit.toFixed(1),
    y: +(((SAFE.top + lit) / 2) / DSF).toFixed(2),
  };
}

/* the glitch's own numbers at full heat. post12's table, unchanged, including
   the flash staying where it is while everything else went up: three stutters
   plus a hit is four chances to put a white frame on the screen, and four white
   frames inside a third of a second is a strobe rather than a glitch. */
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

/* crf 17 like post12 and the mascot test: this frame is nearly all flat black
   with a soft glow across it, which is exactly what a codec bands, and there is
   no film grain here to dither it. */
const CRF = 17;

/* ---------- the mix ----------
   post12's rig and post12's argument, and this clip is where it gets tested
   from the other side. that one is five sounds in five and a half seconds and
   is silent for three quarters of its length, so the peak ceiling won by four
   decibels and the integrated figure came out at -18.7. this one has a mumble
   running under the whole of it — sixteen syllables end to end — so it is a
   clip with a floor rather than a clip with events on silence, and the loudness
   target has a much better chance of being the thing that decides the gain.

   whichever wins, it is reported as a fact rather than asserted: the bus is
   lifted by the smaller of what -14 LUFS wants and what the sample ceiling plus
   a decibel and a half of limiting allows, and both numbers are printed. the
   limiter is a backstop on one transient — the eight millisecond burst at the
   top of the glitch hit — and it is allowed 1.5 dB for exactly post12's reason
   and no more. */
const TARGET_LUFS = -14;
const SAMPLE_CEILING = -1.8;
const PEAK_CEILING = -1.0;
const LIMIT_ALLOW = 1.5;
const MAX_REDUCTION = LIMIT_ALLOW + 0.3;
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
const POP = bezier(.34, 1.4, .64, 1);          /* the site's own --spring */
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))));
const lerp = (a, b, p) => a + (b - a) * p;

function prng(seed) {
  let x = seed | 0 || 0x1a2b3c;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x |= 0; return (x >>> 0) / 4294967296; };
}

/* ---------- the glitch ----------
   a function of the output frame index and of nothing else. post12's, with the
   puff-shaped hole in it closed up and nothing else changed. the envelope is
   post10's: full for the first eighth, decaying, and then clean for the last
   seventh, which is the "snaps back calm" the shape asks for and is a fact the
   guards check rather than a description. */
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
function glitchWindows(fps) {
  return [
    ...END.pre.map((w, i) => ({ ...onGrid(w.t, w.for, fps), force: w.force,
      seed: 0x51a0 + i * 977, pre: i })),
    { ...onGrid(END.at, END.hard + END.tail, fps), force: 1, seed: 0x0c1a55, pre: null },
  ];
}
const GL_WINDOWS = glitchWindows(FPS);
/* and the same list on the master's grid, because the duty is a property of the
   animation rather than of the pass it is sampled at: at twelve a fifty
   millisecond stutter is rounded up to a whole 83ms frame, which is two thirds
   longer than it is. the guards read sixty. */
const GL_WINDOWS_60 = FPS === 60 ? GL_WINDOWS : glitchWindows(60);

function glitchAt(f, fps = FPS, windows = GL_WINDOWS) {
  const g = calmGlitch();
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

/* ---------- the phosphor ----------
   two sines on incommensurate periods rather than one, and post10 paid for that
   lesson: a sine stands still twice a period, so on an end card where the
   phosphor is the only thing still moving, the two frames either side of its
   turning point are identical. */
function phosphor(t, amp, slow, fast, phase) {
  return 1 + amp * 0.78 * Math.sin(2 * Math.PI * t / slow)
    + amp * 0.39 * Math.sin(2 * Math.PI * t / fast + phase);
}

/* ---------- what one frame is ----------
   everything this file writes, in one object, so the page has one entry point
   and the liveness signature has one thing to hash. `t` is the instant being
   captured and `f` is the output frame it belongs to: they differ under the
   shutter and the difference is the whole point of the split. */
function frameAt(t, f) {
  const g = glitchAt(f);
  /* the cut, and it is the only thing in this clip that touches either opacity.
     he is at full from frame zero and the label is on the same switch, so the
     two leave on the frame the wordmark arrives on and there is no ordering
     between them to get wrong. the hand is inside his own zone, so it is on
     this switch too without being mentioned by it. */
  const on = f >= CUT_FRAME ? 0 : 1;
  const wp = span(t, WM_IN, WM_IN + END.wmFor);
  const wm = {
    o: +span(t, WM_IN, WM_IN + END.wmFor * 0.45).toFixed(4),
    sc: +(1 + (1 - POP(wp)) * 0.085).toFixed(4),
    glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4),
  };
  /* the label breathes on its own periods rather than the wordmark's: a label
     holding perfectly still for three and a half seconds over a face that is
     drifting reads as a sticker laid on top of the film rather than as part of
     it. */
  const lbl = { o: on, glow: +phosphor(t, 0.05, 3.1, 0.61, 0.4).toFixed(4) };
  return { t: +t.toFixed(4), f, mo: on, wm, lbl, g };
}

/* ---------- the page ---------- */
function sceneHtml(plan) {
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post13</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500&display=swap">
<style>
:root{
  --bg:#06070a; --fg:#d5dbd8;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  --body:"Space Grotesk",var(--mono);
  --display:"Michroma",var(--mono);
  /* the two channels the rgb split is drawn in: the same white the glow is,
     pulled apart, rather than a red and a cyan out of a filter preset. this
     frame has no colour in it and the glitch is not where colour starts. */
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

/* the module places and draws him, hand included; these two rules are this
   clip's and nothing more. the id beats the module's class selector, which is
   how a clip adds an opacity channel without editing the module — and because
   the hand is inside the zone, one channel takes the whole of him off. */
#m-zone{opacity:var(--m-o,0)}
.stage[data-gl="1"] #m-zone{
  filter:drop-shadow(calc(var(--split,0) * -1px) 0 var(--gr))
         drop-shadow(calc(var(--split,0) * 1px) 0 var(--gc))}

/* ---- the wordmark ----
   three lines on the line his head was on. the deep glow is two text shadows
   rather than blurred duplicates, because it is fourteen glyphs and a duplicate
   would have to be written every frame. the brightness filter on top is the
   phosphor breathing, which is what stops the last second and a half from being
   a still picture. */
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

/* ---- the label ----
   the wordmark's face, tracking, centring trick and a glow built the same way
   out of three shadows, scaled down with the type because a full sized halo on
   half sized letters is a smudge rather than a glow. no text-transform, because
   it is lower case and it stays that way. two lines, set as spans so the fit
   can measure the widest of them the way the wordmark's does. */
.lbl{position:absolute;left:50%;top:${LBL.y}px;
  transform:translate(-50%,-50%);
  font-family:var(--display);font-weight:400;color:var(--fg);
  text-align:center;letter-spacing:.18em;text-indent:.09em;
  line-height:${WM.lh};white-space:nowrap;
  opacity:var(--lbl-o,0);
  text-shadow:0 0 6px rgba(255,255,255,.36),0 0 18px rgba(255,255,255,.19),
    0 0 40px rgba(255,255,255,.09);
  filter:brightness(var(--lbl-glow,1));
  z-index:4}
.lbl span{display:block}
.stage[data-gl="1"] .lbl{
  text-shadow:0 0 6px rgba(255,255,255,.36),0 0 18px rgba(255,255,255,.19),
    0 0 40px rgba(255,255,255,.09),
    calc(var(--split,0) * -1px) 0 var(--gr),calc(var(--split,0) * 1px) 0 var(--gc)}

/* ---- the tear ----
   a band of the frame, blacked out and redrawn shifted. the layer paints the
   page colour first so it covers what is under it, then draws its own copy of
   the wordmark displaced sideways, which is a tear rather than a ghost.

   only the wordmark is copied, and that is a decision rather than a shortcut.
   the mascot is one dom subtree driven by ids out of the mascot module's own
   runtime and there is no second copy of it that could be kept in sync; the
   wordmark is three words of static text and duplicating it cannot go wrong. it
   is also the only thing on screen when the glitch is at full heat, because he
   and the label are both cut on the frame the hit lands. */
.tear{position:absolute;inset:0;z-index:6;overflow:hidden;background:var(--bg);
  clip-path:inset(var(--tt,0px) 0 calc(100% - var(--tt,0px) - var(--th,0px)) 0);
  opacity:var(--to,0)}
.tear-in{position:absolute;inset:0;transform:translate3d(calc(var(--tdx,0) * 1px),0,0)}

/* ---- the fault's own two layers ----
   noise, screen blended so it adds light to a black frame rather than sitting
   on it as grey, and a white frame that fires once. */
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
  <div class="lbl" id="lbl">${LABEL.lines.map(l => '<span>' + l + '</span>').join('')}</div>
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
window.__P13 = ${JSON.stringify({ WM, LABEL, VW, VH, DSF })};
${scenePage.toString()}
scenePage();
document.fonts.load('400 1em "Michroma"')
  .then(() => document.fonts.ready)
  .then(() => {
    window.__p13.fit();
    window.__built = window.__mas.build();
  });
</script>
</body>
</html>`;
}

/* ---------- the page's own script ----------
   it writes numbers to elements and it decides nothing, exactly like the
   mascot's own page half. serialised in with .toString(), so it must not close
   over anything: everything it needs arrives on window.__P13. */
function scenePage() {
  const P = window.__P13;
  const stage = document.getElementById('stage');
  const wms = [...document.querySelectorAll('.wm')];
  const lbl = document.getElementById('lbl');
  const tears = [...document.querySelectorAll('.tear')];
  const tearIns = tears.map(t => t.querySelector('.tear-in'));

  /* the widest rendered line of a block, in css px, at whatever size it is set
     at. michroma is proportional and the tracking is nearly a fifth of an em,
     so the width of a string is a measurement rather than a ratio, and both the
     wordmark and the label are fitted off this same function. */
  const widest = el => {
    let w = 0;
    for (const sp of el.querySelectorAll('span')) {
      w = Math.max(w, sp.getBoundingClientRect().width);
    }
    return w;
  };

  window.__p13 = {
    fit() {
      const probe = wms[0];
      probe.style.fontSize = '100px';
      const size = 100 * P.WM.w / widest(probe);
      /* every copy is fitted, the torn ones included, or a tear would show a
         wordmark at a different size to the one under it. */
      for (const el of wms) el.style.fontSize = size.toFixed(2) + 'px';
      lbl.style.fontSize = '100px';
      const ls = 100 * P.LABEL.w / widest(lbl);
      lbl.style.fontSize = ls.toFixed(2) + 'px';
      return { wm: size, lbl: ls };
    },

    /* what the wordmark actually measures, once, after the fit. the widest
       line's ink, the block's box, and the cap height off the rendered glyphs
       rather than off the ratio — a face that failed to load is caught here
       rather than in a review. */
    measure() {
      const el = wms[0], r = el.getBoundingClientRect(), d = P.DSF;
      const cv = document.createElement('canvas').getContext('2d');
      const cs = getComputedStyle(el);
      cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      const m = cv.measureText('H');
      return {
        sizeCss: +parseFloat(cs.fontSize).toFixed(2),
        widestCss: +widest(el).toFixed(2), widestPx: +(widest(el) * d).toFixed(1),
        capPx: +((m.actualBoundingBoxAscent || 0) * d).toFixed(1),
        left: +(r.left * d).toFixed(1), top: +(r.top * d).toFixed(1),
        right: +((P.VW - r.right) * d).toFixed(1), bottom: +((P.VH - r.bottom) * d).toFixed(1),
        font: cv.font,
      };
    },

    /* the label, measured the same way, with two numbers the wordmark does not
       need. the ink: a line box is taller than the letters in it and what has to
       be legible on a phone is the letters, so the height comes off the rendered
       glyphs of the widest line rather than off the box. and the lines
       themselves, so a guard can say what it actually says rather than what it
       was told. */
    measureLabel() {
      const r = lbl.getBoundingClientRect(), d = P.DSF;
      const cv = document.createElement('canvas').getContext('2d');
      const cs = getComputedStyle(lbl);
      cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      const lines = [...lbl.querySelectorAll('span')].map(s => s.textContent);
      let ink = 0;
      for (const line of lines) {
        const m = cv.measureText(line);
        ink = Math.max(ink, (m.actualBoundingBoxAscent || 0) + (m.actualBoundingBoxDescent || 0));
      }
      return {
        lines, text: lines.join(' '),
        sizeCss: +parseFloat(cs.fontSize).toFixed(2),
        widthPx: +(widest(lbl) * d).toFixed(1),
        boxPx: +(r.width * d).toFixed(1),
        inkPx: +(ink * d).toFixed(1),
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
      s.setProperty('--lbl-o', o.lbl.o.toFixed(4));
      s.setProperty('--lbl-glow', o.lbl.glow.toFixed(4));
      s.setProperty('--sx', o.g.sx.toFixed(2));
      s.setProperty('--sy', o.g.sy.toFixed(2));
      s.setProperty('--split', o.g.split.toFixed(2));
      s.setProperty('--noise', o.g.noise.toFixed(4));
      s.setProperty('--flash', o.g.flash.toFixed(4));
      /* the split is behind an attribute rather than a zero valued shadow: a
         shadow at offset 0 in full colour is a coloured halo, not "off". */
      if (o.g.split > 0.01) stage.setAttribute('data-gl', '1');
      else stage.removeAttribute('data-gl');

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
async function render(plan) {
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
      && window.__p13 && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  if (!await page.evaluate(() => !!(window.__mas && window.__mas.ready))) {
    throw new Error('the scene never became ready');
  }
  /* offline michroma falls back to the system mono and both the wordmark and the
     label look almost right, which is the worst kind of wrong to judge type on. */
  if (!await page.evaluate(() => document.fonts.check('400 40px "Michroma"'))) {
    throw new Error('Michroma did not load — the type would be judged in the mono fallback');
  }
  const built = await page.evaluate(() => window.__built);
  const wm = await page.evaluate(() => window.__p13.measure());
  const lbl = await page.evaluate(() => window.__p13.measureLabel());
  console.log('  built: head ' + built.headPx + 'px, ' + built.eyes + ' eyes, '
    + built.glows + ' glow layers, theme ' + built.theme);
  console.log('  the hand: ' + (built.hand
    ? built.hand.lenPx + ' device px long, ' + built.hand.thickPx + ' thick, thumb '
      + built.hand.thumbPx
    : 'MISSING'));
  console.log('  the wordmark: ' + wm.sizeCss + 'css px, widest line ' + wm.widestPx
    + ' device px, caps ' + wm.capPx + ', clear ' + wm.left + ' left / ' + wm.top
    + ' top / ' + wm.right + ' right / ' + wm.bottom + ' bottom');
  console.log('  the label "' + lbl.text + '" on ' + lbl.lines.length + ' lines: '
    + lbl.sizeCss + 'css px (' + (lbl.sizeCss / wm.sizeCss * 100).toFixed(0)
    + '% of the wordmark), widest line ' + lbl.widthPx + ' device px, ink ' + lbl.inkPx
    + ' tall, clear ' + lbl.left + ' left / ' + lbl.top + ' top / ' + lbl.right
    + ' right / ' + lbl.bottom + ' bottom');
  console.log('  it sits on ' + LBL.y + 'css px, ' + Math.round(LBL.lit - (VH * DSF - lbl.bottom))
    + 'px clear of the top of his glow (he reaches ' + LBL.headTop + ' from the top, '
    + LBL.glow + ' of glow past that)');

  /* the head's clearance, off every frame rather than sampled, because the
     geometry is known and it costs nothing to do it properly. the glow and the
     shadow are reported beside the ink rather than folded into it. */
  let headWorst = null;
  for (let f = 0; f < N; f++) {
    const r = headRect(plan, mascotFrame(plan, f / FPS));
    const near = Math.min(r.left, r.top, r.right, r.bottom);
    if (!headWorst || near < headWorst.near) headWorst = { t: +(f / FPS).toFixed(2), near, ...r };
  }

  /* the liveness signature. one number per output frame off everything this file
     wrote plus everything the mascot wrote, the hand included, so two identical
     frames are a fact rather than a suspicion. post10 shipped a pair and only
     found out at sixty. */
  const sigs = [];
  const wall = Date.now();

  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const mf = mascotFrame(plan, t);
      const o = frameAt(t, f);
      await page.evaluate(fr => window.__mas.apply(fr), mf);
      await page.evaluate(fr => window.__p13.apply(fr), o);
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);

      if (k === 0) {
        let s = o.mo * 7 + o.wm.o * 11 + o.wm.sc * 13 + o.wm.glow * 17
          + o.lbl.o * 131 + o.lbl.glow * 137
          + o.g.sx * 19 + o.g.sy * 23 + o.g.split * 29 + o.g.noise * 31 + o.g.flash * 37
          + o.g.bands.length * 41
          + mf.card.x * 43 + mf.card.y * 47 + mf.card.rot * 53
          + mf.card.sx * 59 + mf.card.sy * 61 + mf.glow * 67
          + mf.hand.open * 149 + mf.hand.fingers * 151 + mf.hand.thumb * 157 + mf.hand.x * 163;
        for (let e = 0; e < 2; e++) {
          s += mf.eyes[e].x * (71 + e) + mf.eyes[e].y * (79 + e)
            + mf.eyes[e].sx * (83 + e) + mf.eyes[e].sy * (89 + e) + mf.eyes[e].lid * (97 + e);
          s += mf.brows[e].o * (101 + e) + mf.brows[e].y * (103 + e);
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

  /* a still per beat, so the cut can be read as a strip rather than as a video.
     the frame is written explicitly every time, so re-applying an earlier one
     after the loop renders exactly as it did.

     **a still is a frame the clip actually has.** the time asked for is rounded
     to a frame and then that frame's own instant is what gets drawn, so the
     glitch, which is a function of the frame index, and everything else, which
     is a function of the time, can never disagree about which moment a still
     is. the four fault stills take their times off the windows' own starts for
     the same reason, because a window is snapped to the grid and END is not. */
  fs.rmSync(VERIFY, { recursive: true, force: true });
  fs.mkdirSync(VERIFY, { recursive: true });
  const yap = plan.yap.cycles;
  const stills = [
    [0, 'a-frame-zero'],
    /* a cycle's own peak, so the widest gape the hand ever has is a still
       somebody can look at rather than a claim in a log. */
    [yap[1].peak, 'b-the-mouth-open'],
    [yap[1].shutAt, 'c-the-mouth-shut'],
    /* the middle of the slow blink, off the schedule's own numbers: the lid is
       fully down from `close` to `close + hold`, and this is the middle of that
       window rather than a time typed against it. */
    [SLOW_BLINK.t + SLOW_BLINK.close + SLOW_BLINK.hold / 2, 'd-the-slow-blink'],
    [CUT.marks[1].t + STATES.thinking.entry, 'e-eyes-narrow'],
    [SIGH_AT, 'f-the-droop'],
    [ROLL_AT, 'g-the-eye-roll'],
    [BLINK_AT, 'g2-the-eyes-going'],
    [GL_WINDOWS[0].t0, 'h1-stutter-one'],
    [GL_WINDOWS[2].t0, 'h2-stutter-three'],
    [GL_WINDOWS[3].t0, 'h3-the-hit'],
    [GL_WINDOWS[3].t0 + 0.10, 'h4-the-tear'],
    [END.at + END.hard + END.tail + 0.10, 'i-the-wordmark'],
    [CUT.seconds - 0.06, 'j-the-last-frame'],
  ];
  for (const [want, name] of stills) {
    const f = Math.min(N - 1, Math.round(want * FPS));
    const t = f / FPS;
    await page.evaluate(fr => window.__mas.apply(fr), mascotFrame(plan, t));
    await page.evaluate(fr => window.__p13.apply(fr), frameAt(t, f));
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

  const state = { built, wm, lbl, head: headWorst, sigs, frames: N };
  fs.writeFileSync(path.join(OUT, 'post13.json'), JSON.stringify(state, null, 2));
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
  const out = path.join(OUT, 'post13-dark-1080x1920.mp4');
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

/* ---------- reading a beat off the picture ----------
   the two cues that are not the hand's and not the glitch's. both are the same
   shape: walk `mascotFrame` at four times the master rate through one mark's own
   window and return the first instant a channel of the **drawn** head has got
   where it is going. the card is three frames behind the rig by design, so a beat
   read off `pose` would land three frames before the picture got there.

   this is the same argument `cuesFromCaptions` makes and it is why the sound in
   this repo is derived rather than placed: change the state, change the mark,
   change the frame rate, and the sound moves with the picture because there is
   nothing to keep in sync. */
const BEAT_RATE = 240;
function beatWhen(plan, from, until, test) {
  for (let i = Math.round(from * BEAT_RATE); i <= Math.round(until * BEAT_RATE); i++) {
    const t = i / BEAT_RATE;
    if (test(mascotFrame(plan, t))) return +t.toFixed(4);
  }
  return null;
}

/* ---------- go ---------- */
console.log('the boring tek — post13, the yap');

const plan = planMascot({
  marks: CUT.marks, seconds: CUT.seconds, theme: 'dark',
  size: SIZE,
  /* the hand, and the two words that turn the whole part on. */
  hand: true,
  /* dead straight on. the corner bias exists so a mascot standing in a corner
     looks into the frame; standing in the middle there is nothing to look into
     and a resting turn would read as him facing slightly away from camera for
     the whole clip — and this clip has a turn of its own to spend. */
  bias: 0,
  /* ---------- the seed is the slow blink ----------
     the brief's second beat is a slow blink, right after "alive" and before the
     eyes narrow, and it is the one beat of the five that no state in the table
     can put there. the only slow blink written into a state is `unimpressed`'s,
     at 0.86 into its own hold, and with three marks inside five seconds that
     lands at 3.28 — which is under the stutters and half torn off by the hit.
     the arithmetic is not close: for it to finish before the fault starts, the
     clip would have to run 5.3 seconds.

     so the blink comes off the layer that already makes blinks. `blinkPlan`
     generates the idle schedule from the plan's seed, every blink carrying its
     own close, hold and open drawn out of `IDLE.blink`, and the seed decides
     when they land and how long they take. **this one is chosen rather than
     default**, out of a search over forty thousand of them for a first blink
     that lands inside the neutral beat and is at the slow end of the ranges.
     seed 63 puts it at 0.756s and it takes 0.3635s, which is within two
     thousandths of the longest blink this rig can generate and about half again
     the median. the guard at the bottom checks both, so a seed changed for some
     other reason cannot quietly delete a beat of the story.

     it is not a cheat and it is not a new mechanism: an idle blink is the
     mascot's own blink, and the second half of `unimpressed` still does its
     slow one at 3.28 — where the tear now catches it, and where the last thing
     he does before the frame breaks is start to shut his eyes. */
  seed: 63,
});
/* centred, in the middle of the safe band. see the note on CENTRE_Y. */
const halfBox = (GRID / 2) * plan.unit;
plan.box = { left: +(VW / 2 - halfBox).toFixed(2), top: +(CENTRE_Y - halfBox).toFixed(2), size: SIZE };

/* the label's line, worked out off the finished plan and before a browser is
   opened, so the page is served with it already in the css and there is nothing
   to move once it is up. */
const LBL = labelY(plan);

console.log(describeMascot(plan));
const rep = mascotMotion(plan, FPS, CUT.seconds);
console.log(describeMotion(rep));
const rep60 = FPS === 60 ? rep : mascotMotion(plan, 60, CUT.seconds);
if (FPS !== 60) {
  console.log('  and at sixty, which is what the motion guards read:');
  console.log(describeMotion(rep60));
}

/* ---------- the three beats of the eye story that make a sound ----------
   the droop and the roll. both are read off the picture rather than typed, and
   the slow blink is read too — it makes no sound, but it is a still and a still
   asked for at a number somebody typed is a still of the wrong frame.

   the droop is the module's own preflight answering: `unimpressed` declares its
   mark as the lid reaching 0.54, and `entryFrames` is how many frames that took.
   nothing here decides it and nothing here can drift from it. */
const DROOP = plan.marks[2];
const SIGH_AT = +(DROOP.t + rep60.states[2].entryFrames / 60).toFixed(4);
/* the slow blink inside `unimpressed`'s hold: the first frame the lids are past
   nine tenths shut, which no idle blink in this plan reaches inside that window
   because the state has already taken them to 0.54 and the idle one closes the
   rest of the gap rather than fighting it. */
const BLINK_AT = beatWhen(plan, DROOP.t + 0.6, DROOP.leaving, fr => fr.poseLid > 0.92);
/* the roll: the first frame the **drawn** turn has all but arrived. 98% rather
   than 100 because `drift` approaches its mark and a strict equality would sit
   on the last frame of the tween or miss it. */
const ROLL_AT = beatWhen(plan, DROOP.t, END.at, fr => Math.abs(fr.turn.card) >= 0.99 * Math.abs(DROOP.turn));
/* and the early one, which is the beat the seed was chosen for. it is read off
   the plan rather than off the seed, so the still and the guard are looking at
   the same blink the render draws. */
const SLOW_BLINK = plan.idle.blinks[0];

/* ---------- the cues ----------
   every one of them is a time something else already decided.

   the mumble is one syllable per yap cycle, at the cycle's own start and for
   exactly `voiced` seconds, which is how long that cycle's mouth is open, plus
   nothing. so a syllable is as long as the gesture that makes it and the two
   cannot drift apart — and because the cycles carry their own jitter, no two
   syllables are the same length either. `shape` walks the four vowel moves in
   `lib/sfx.mjs`, so consecutive pulses are different shapes rather than one
   buffer repeated, which is the difference between a mumble and a machine.

   **the cues stop at the cut and the hand does not.** the plan yaps to the end
   because `yap: true` on the last mark means "until the end of the clip", and
   he is cut at 3.49 — so the last second and a half of yapping happens where
   nobody can see it. filtering the cues on the cut rather than trimming the plan
   is the honest version: the picture decides what is heard, and the guard below
   asserts that nothing is heard after he is gone. */
const CUED = plan.yap.cycles.filter(c => c.at < END.at);
const cues = [
  ...CUED.map((c, i) => ({
    t: c.at, kind: 'mumble',
    opts: { shape: i % 4, len: c.voiced },
    from: 'yap cycle ' + c.i + ', for as long as the mouth is open',
  })),
  { t: SIGH_AT, kind: 'sigh', from: "the droop arriving, off the module's own preflight" },
  { t: ROLL_AT, kind: 'annoyed', from: 'the turn arriving, off the drawn head' },
  { t: END.at, kind: 'glitch', from: 'the cut' },
];
const { buf: sfx, report: sfxReport } = renderSfx(cues, CUT.seconds);

/* ---------- the build up's own three ----------
   the same `glitch` recipe, shorter, thinner and crushed harder each time, and
   they escalate in level as well as in the picture. `renderSfx` sets one gain
   per kind, which is the right shape for a mix where a sound means one thing —
   so three quieter copies of a glitch are three calls with three gains, summed
   onto the same bus. that is the module being used as it is rather than worked
   around: the alternative is a per cue level, and a per cue level is how a
   balance stops living in one table. */
const PRE_DB = [-34, -30, -26];
for (let i = 0; i < END.pre.length; i++) {
  const w = GL_WINDOWS[i];
  const one = renderSfx([{
    t: w.t0, kind: 'glitch',
    opts: { len: 0.05 + i * 0.014, burst: 0.004, crush: 3800 - i * 500,
      f0: 210 + i * 18, f1: 120, seed: w.seed },
    from: 'stutter ' + (i + 1) + ' of three, into the hit',
  }], CUT.seconds, { gains: { glitch: PRE_DB[i] } });
  for (let j = 0; j < sfx.length; j++) sfx[j] += one.buf[j];
  sfxReport.push(...one.report);
}
sfxReport.sort((a, b) => a.t - b.t);

const WAV = path.join(OUT, 'post13-sfx.wav');
const RAW = path.join(OUT, 'post13-sfx-raw.wav');
fs.mkdirSync(OUT, { recursive: true });
writeWav(RAW, sfx);
/* the loudness is read off a written file with ebur128, which is the meter a
   broadcaster uses, rather than off an rms with a nice name. */
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

console.log('\n  the beats');
console.log('    0.00s  he is already on, at rest, already yapping, with "'
  + LABEL_TEXT + '" over him');
/* one clock. the marks are the plan's and the rest are read off the picture, so
   they are put in the same list and sorted rather than printed in the order the
   file happens to compute them — a beat sheet out of order is a beat sheet
   nobody can read the cut from. */
const extra = [
  ...plan.marks.map(m => [m.t, m.state.padEnd(12) + ' settles ' + m.settled.toFixed(2)
    + ', holds to ' + m.leaving.toFixed(2) + ', out ' + m.out.toFixed(2)
    + (m.turn != null ? ', turn to ' + m.turn.toFixed(2) : '')]),
  [SLOW_BLINK.t, 'the slow blink, ' + (SLOW_BLINK.close + SLOW_BLINK.hold + SLOW_BLINK.open).toFixed(3)
    + 's of it, off the idle schedule the seed was chosen for'],
  [SIGH_AT, 'the droop is fully down, and the sigh is on it'],
  [ROLL_AT, 'the eye roll has arrived, and the beep is on it'],
  [BLINK_AT, 'his eyes start going again, unimpressed\'s own slow blink'],
  ...GL_WINDOWS.filter(x => x.pre != null).map(w => [w.t0,
    'stutter ' + (w.pre + 1) + ' of three, ' + w.frames + ' frame'
    + (w.frames === 1 ? '' : 's') + ' at ' + (w.force * 100).toFixed(0)
    + '% heat, over the rolled eye']),
  [END.at, 'the hit, ' + (END.hard + END.tail).toFixed(2)
    + 's of it, and he, the hand and the label are all cut on that frame'],
  [WM_IN, 'the wordmark snaps in over ' + END.wmFor.toFixed(2) + 's and holds '
    + (CUT.seconds - WM_IN - END.wmFor).toFixed(2) + 's'],
  [CUT.seconds, 'end'],
].sort((a, b) => a[0] - b[0]);
for (const [t, what] of extra) console.log('    ' + t.toFixed(2) + 's  ' + what);

console.log('\n  the hand: ' + plan.yap.count + ' yap cycles, ' + CUED.length
  + ' of them before the cut, ' + rep60.hand.lenPx + ' device px long and '
  + rep60.hand.thickPx + ' thick, opening to ' + rep60.hand.gapePx + 'px between the tips');
console.log('    period ' + (plan.yap.period.lo * 1000).toFixed(0) + ' to '
  + (plan.yap.period.hi * 1000).toFixed(0) + 'ms, which is '
  + (1 / ((plan.yap.period.lo + plan.yap.period.hi) / 2)).toFixed(1) + ' syllables a second, gape '
  + plan.yap.gape.lo.toFixed(2) + ' to ' + plan.yap.gape.hi.toFixed(2)
  + ', fastest frame moves the tip ' + rep60.hand.stepCss.toFixed(2) + ' css px');

console.log('\n  the sound');
for (const r of sfxReport) {
  console.log('    ' + r.t.toFixed(2) + 's  ' + r.kind.padEnd(8) + r.seconds.toFixed(3)
    + 's  ' + String(r.gain).padStart(4) + ' dB  peak ' + String(r.peak).padStart(6)
    + '  ' + r.from);
}
console.log('    the bus came off the synth at ' + (before.lufs == null ? '?' : before.lufs)
  + ' LUFS with its peak at ' + rawPeakDb.toFixed(1) + ' dBFS');
console.log('    ' + TARGET_LUFS + ' LUFS wanted ' + wanted.toFixed(2) + ' dB of lift and the '
  + SAMPLE_CEILING + ' dBFS ceiling plus ' + LIMIT_ALLOW + ' dB of limiting allowed '
  + allowed.toFixed(2)
  + (allowed < wanted ? ', so the ceiling won by ' + (wanted - allowed).toFixed(2) + ' dB'
    : ', so the loudness target won'));
console.log('    lifted ' + lift.toFixed(2) + ' dB to ' + (after.lufs == null ? '?' : after.lufs)
  + ' LUFS, peak ' + peak.peak + ' dBFS, limiter took '
  + (peak.reduction > 0.01 ? peak.reduction.toFixed(2) + ' dB' : 'nothing'));

/* ---------- the four vowels, written out ----------
   the mumble is chosen on numbers and nothing in this pipeline can hear, so all
   four shapes are written on every render for somebody who can. they land in
   demo/out/p13-mumble/, which is regenerable and gitignored. */
const MUM_DIR = path.join(OUT, 'p13-mumble');
fs.mkdirSync(MUM_DIR, { recursive: true });
for (let i = 0; i < 4; i++) writeWav(path.join(MUM_DIR, 'shape' + i + '.wav'), VOICES.mumble({ shape: i }));
writeWav(path.join(MUM_DIR, 'sigh.wav'), VOICES.sigh());
writeWav(path.join(MUM_DIR, 'annoyed.wav'), VOICES.annoyed());
console.log('    the four vowel moves, the sigh and the beep are in '
  + path.relative(ROOT, MUM_DIR) + ' for somebody who can listen');

const state = ONLY_ENCODE
  ? JSON.parse(fs.readFileSync(path.join(OUT, 'post13.json'), 'utf8'))
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
if (Math.abs(p.seconds - CUT.seconds) > 0.25) fail.push(p.seconds + 's, wanted ' + CUT.seconds);
if (!p.audio) fail.push('no audio track — the sounds did not mux');
/* the brief's own length, and it is a guard rather than a note. */
if (CUT.seconds < 4 || CUT.seconds > 5) {
  fail.push('the clip runs ' + CUT.seconds + 's, and the brief asks for four to five');
}

/* the head, as ink, on every frame. the glow and the shadow are not in it: a
   thirty px blur crossing a safe line is not ink crossing it. */
if (state.built.headPx < HEAD_PX.min || state.built.headPx > HEAD_PX.max) {
  fail.push('the head rendered at ' + state.built.headPx + 'px, window is '
    + HEAD_PX.min + ' to ' + HEAD_PX.max);
}
if (state.head.near < floor - 0.5) {
  fail.push('the head comes within ' + Math.round(state.head.near)
    + 'px of a border at ' + state.head.t + 's, floor is ' + floor);
}
/* and he is actually in the middle, checked on `plan.box` rather than on a
   rendered frame — post12's correction, and it is the same one here: the idle
   drift moves him 1.7 css px either way, so which frame you measure decides the
   answer, and the drift is not him being off centre. the box is what this file
   places in the middle and this is the arithmetic that places it, checked. */
const offX = +(Math.abs(plan.box.left + halfBox - VW / 2) * DSF).toFixed(2);
if (offX > 1) fail.push('his box is ' + offX + 'px off centre horizontally');

/* ---------- the hand ----------
   the part this clip exists to add, so it is checked as a thing on the screen
   rather than as a thing in a plan. it has to be there, it has to be big enough
   to read at phone size, it has to actually open and shut, it has to open wide
   enough to be a mouth, and it may not move so fast between two frames that it
   reads as a jump. */
const H = state.built.hand;
if (!H) fail.push('the hand did not render — no .m-finger in the page');
else {
  /* against the eye rather than against a round number: the eye is 13 grid
     units wide and the hand has to read as a bigger thing than one of them or
     it is a third eyebrow. */
  const eyePx = HEAD.eye.w * plan.unit * DSF;
  if (H.lenPx < eyePx * 1.2) {
    fail.push('the hand is ' + H.lenPx + ' device px long against an eye at '
      + eyePx.toFixed(0) + ' — too small to read as a mouth');
  }
  if (H.thickPx < 16) fail.push('the hand is ' + H.thickPx + ' device px thick, floor is 16');
  if (Math.abs(H.lenPx - rep60.hand.lenPx) > 1) {
    fail.push('the hand rendered at ' + H.lenPx + ' device px and the geometry says '
      + rep60.hand.lenPx);
  }
}
/* it opens all the way and it comes all the way back, measured off the drawn
   angles rather than off the plan that asked for them. */
if (rep60.hand.gape.hi < 0.95) {
  fail.push('the hand only ever opens to ' + rep60.hand.gape.hi + ' of its gape');
}
if (rep60.hand.gape.lo > 0.02) {
  fail.push('the hand never shuts — the least it closes to is ' + rep60.hand.gape.lo);
}
/* every planned cycle is an open on the screen. if these two ever disagree the
   plan and the picture have come apart, and the mumble is placed off the plan. */
if (rep60.hand.opens !== plan.yap.count) {
  fail.push('the hand opens ' + rep60.hand.opens + ' times against ' + plan.yap.count
    + ' cycles in the plan');
}
/* it snaps, and it does not step. the ceiling is the module's own and the
   argument for it is in lib/mascot.mjs beside YAP. */
if (rep60.hand.stepCss > 8) {
  fail.push('the hand moves its tip ' + rep60.hand.stepCss + ' css px in one frame at sixty');
}
/* and the gape is a mouth rather than a crack. the floor is the **eye's own
   height** — 4.4 grid units, about twenty device px at this head size — times
   one and a third, because the eye is the smallest thing on this face that
   reads at phone size and an opening smaller than one is not an opening. what
   the geometry actually allows is worked out beside HAND in lib/mascot.mjs and
   it is thirty, so this has a little room and not much: the face is only so
   tall between a resting eye and the chin. */
const GAPE_FLOOR = +(HEAD.eye.h * plan.unit * DSF * 1.33).toFixed(1);
if (rep60.hand.gapePx < GAPE_FLOOR) {
  fail.push('the hand only opens ' + rep60.hand.gapePx + ' device px between the tips, floor is '
    + GAPE_FLOOR + ' — an eye and a third');
}
/* it yaps for the whole time he is on screen, at a rate that is talking. */
if (CUED.length < 9) fail.push('only ' + CUED.length + ' syllables before the cut');
{
  const first = plan.yap.cycles[0], last = CUED[CUED.length - 1];
  if (first.at > 0.02) fail.push('the hand does not start yapping until ' + first.at + 's');
  if (END.at - last.shutAt > 0.45) {
    fail.push('the hand stops yapping ' + (END.at - last.shutAt).toFixed(2) + 's before the cut');
  }
  const rate = 1 / ((plan.yap.period.lo + plan.yap.period.hi) / 2);
  if (rate < 2.4 || rate > 4.2) {
    fail.push('the yap runs at ' + rate.toFixed(1) + ' syllables a second, which is not talking');
  }
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

/* ---------- the label ----------
   post12's six questions, and they all still apply to a label that is now two
   lines and six words: does it say what it is meant to say, in lower case, in
   michroma, fitted, big enough to read, small enough to be a label, and far
   enough off him not to crowd him. */
const L = state.lbl;
if (L.text !== LABEL_TEXT) fail.push('the label says "' + L.text + '", not "' + LABEL_TEXT + '"');
if (L.text !== L.text.toLowerCase()) fail.push('the label is not lower case: "' + L.text + '"');
/* no full stop, and no punctuation dash either, which is the brand rule and is
   checked rather than trusted. */
if (/[.]/.test(L.text)) fail.push('the label has a full stop in it: "' + L.text + '"');
if (/[—–]/.test(L.text) || /\s-\s/.test(L.text)) {
  fail.push('the label has a punctuation dash in it: "' + L.text + '"');
}
if (!/Michroma/.test(L.font)) fail.push('the label is not set in michroma: ' + L.font);
if (L.inkPx < LABEL.minInkPx) {
  fail.push('the label ink measures ' + L.inkPx + ' device px, floor is ' + LABEL.minInkPx);
}
for (const k of ['left', 'top', 'right', 'bottom']) {
  if (L[k] < floor - 0.5) fail.push('the label comes within ' + Math.round(L[k]) + 'px of the ' + k + ' border');
}
if (Math.abs(L.widthPx - LABEL.w * DSF) > 6) {
  fail.push('the label fitted to ' + L.widthPx + ' device px, wanted ' + LABEL.w * DSF);
}
/* a label rather than a headline, and it is the wordmark it has to be smaller
   than rather than some absolute size: the two are never on screen together, so
   the only place a viewer compares them is across the cut. */
if (L.sizeCss > w.sizeCss * LABEL.maxOfWm) {
  fail.push('the label is set at ' + L.sizeCss + 'css px against the wordmark at ' + w.sizeCss
    + ', which is ' + (L.sizeCss / w.sizeCss * 100).toFixed(0) + '% and not a label');
}
/* and it does not crowd him. measured against the top of his **glow** at the
   highest he ever gets, not against his ink at rest. */
const offHead = LBL.lit - (VH * DSF - L.bottom);
if (offHead < LABEL.gap) {
  fail.push('the label sits ' + Math.round(offHead) + 'px off the top of his glow, floor is ' + LABEL.gap);
}

/* ---------- the two ends of the cut ----------
   he is on from frame zero and the label is on with him, and the pair of them
   go on the frame the wordmark arrives on. five assertions about `frameAt`
   rather than a description of it, which is the only way this stays true after
   somebody edits the cut — and the last two are the pair that caught the missing
   frame at sixty. the frame exchanges one thing for another: he and the label
   are the only things on the last frame they are on, the wordmark is the only
   thing on the first frame it is on, and there is no frame between them. */
{
  const cutF = CUT_FRAME;
  const first = frameAt(0, 0);
  const last = frameAt((cutF - 1) / FPS, cutF - 1);
  const on = frameAt(cutF / FPS, cutF);
  if (first.mo !== 1) fail.push('he is at ' + first.mo + ' on the first frame');
  if (first.lbl.o !== 1) fail.push('the label is at ' + first.lbl.o + ' on the first frame');
  if (last.lbl.o !== 1) fail.push('the label leaves before the wordmark arrives');
  if (on.lbl.o !== 0 || on.mo !== 0) fail.push('he or the label is still on the frame the wordmark arrives on');
  if (last.wm.o !== 0) {
    fail.push('the wordmark is already at ' + last.wm.o + ' on the last frame he is on');
  }
  if (on.wm.o <= 0) fail.push('the wordmark is not born on the frame he is cut on');
}

/* ---------- the eye story, measured ----------
   five beats and four of them are a number on the drawn face rather than a
   description of a state. the fifth, "alive", is the absence of all of them plus
   the idle layer, and `frozenFrames` below is what checks that.

   the lid is read as `poseLid`, which is the state's own lid with no idle blink
   folded into it: a beat about how narrow his eyes are must not be scored on
   whichever blink happened to overlap it. */
{
  const lidAt = t => mascotFrame(plan, t).poseLid;
  const alive = lidAt(CUT.marks[0].t + STATES.neutral.entry + 0.2);
  const narrow = lidAt(CUT.marks[1].t + STATES.thinking.entry);
  const droop = lidAt(SIGH_AT);
  if (alive > 0.02) fail.push('his eyes are already ' + alive.toFixed(2) + ' shut on the first beat');
  if (narrow < 0.28) fail.push('the narrow beat only closes the lids to ' + narrow.toFixed(2));
  if (droop < 0.50) fail.push('the droop beat only closes the lids to ' + droop.toFixed(2));
  /* ---------- the slow blink, which is the beat the seed was chosen for -------
     it has to land where the brief puts it, between "alive" and "narrow", and it
     has to be slow. both are numbers off the plan rather than a hope about a
     seed: inside the first mark's own window, and within a twentieth of the
     longest blink `IDLE.blink` can generate. change the seed for any other
     reason and this is what stops the beat disappearing quietly. */
  const slowest = IDLE.blink.close[1] + IDLE.blink.hold[1] + IDLE.blink.open[1];
  const slow = SLOW_BLINK.close + SLOW_BLINK.hold + SLOW_BLINK.open;
  if (SLOW_BLINK.t < 0.35 || SLOW_BLINK.t > CUT.marks[1].t - 0.20) {
    fail.push('the slow blink lands at ' + SLOW_BLINK.t + 's, which is not inside the alive beat');
  }
  if (slow < slowest * 0.95) {
    fail.push('the first blink takes ' + slow.toFixed(3) + 's against a slowest possible '
      + slowest.toFixed(3) + ' — that is a blink, not a slow blink');
  }
  if (SLOW_BLINK.twice) fail.push('the slow blink is a double blink, which is a different gesture');
  /* and unimpressed's own, which is the second one and is meant to be caught by
     the tear rather than completed. it still has to start before the hit, or the
     beat is not in the film at all. */
  if (BLINK_AT == null) fail.push('unimpressed\'s own slow blink never happens inside its hold');
  else if (BLINK_AT >= END.at) fail.push('unimpressed\'s slow blink starts at ' + BLINK_AT + 's, after the cut');
  if (ROLL_AT == null) fail.push('the turn never arrives before the cut');
  else {
    if (ROLL_AT >= END.at - 0.20) {
      fail.push('the eye roll arrives at ' + ROLL_AT + 's, with nothing left to read it in');
    }
    /* the roll is a turn on the screen rather than a number in a plan: the two
       eyes have to have closed the gap between them, which is the piece of the
       cheat that makes it a head rather than two sliding slabs. */
    const g = mascotFrame(plan, ROLL_AT).turn;
    if (g.gap > 19) fail.push('at the roll the eyes are still ' + g.gap + ' units apart, of 21');
    if (g.clamped) fail.push('an eye is sitting on its clamp at the roll');
  }
  /* and nothing in the whole clip pushes a feature off the head. the markup
     clips to the plate so it cannot paint out there; this is what says whether
     the clip is hiding a pose that does not fit — and it now includes the
     hand's four corners on both slabs. */
  if (rep60.outside.units > 0) {
    fail.push('feature ink lands ' + rep60.outside.units.toFixed(2)
      + ' units outside the head silhouette at ' + rep60.outside.at.toFixed(2) + 's');
  }
}

/* the motion, off the module's own preflight at sixty. these are the numbers the
   house asks for per state and they are guards, not notes. */
for (const st of rep60.states) {
  if (st.entryFrames == null) fail.push(st.state + ' never reached its own mark');
  else if (st.entryFrames < 3) fail.push(st.state + ' arrives in ' + st.entryFrames + ' frames, which is a cut');
  /* the two exemptions are `mascot-test.mjs`'s, named rather than excused by a
     loose threshold, and both are properties of the states rather than of this
     clip. `neutral` is a breath and does not wind up. `unimpressed` does not
     either — its whole read is that it cannot be bothered, so it sinks on the
     heavy curve with almost no anticipation — and it is the one state in the
     table measured on the **lid**, which cannot overshoot: the site's own lid
     curves are `shut` and `open` and a lid that overshot would open past the
     top of the eye. post12 never met this because none of its three states is
     scored on a lid. */
  const noWind = ['neutral', 'unimpressed'].includes(st.state);
  if (!noWind && st.antiFrames < 2) {
    fail.push(st.state + ' has no anticipation, only ' + st.antiFrames + ' frames back');
  }
  if (st.state !== 'unimpressed' && !(st.overshoot > 1)) {
    fail.push(st.state + ' arrives with no overshoot, which is a hard stop');
  }
}
if (rep60.blinks.repeatsInARow) fail.push(rep60.blinks.repeatsInARow + ' blinks repeat the one before them');
if (rep60.frozenFrames) fail.push(rep60.frozenFrames + ' frames where the face is not moving at all');
if (rep60.maxSquash > 0.08 + 1e-6) fail.push('the squash reached ' + (rep60.maxSquash * 100).toFixed(1) + '%');
if (rep60.maxBreathe >= 0.02) fail.push('breathing reached ' + (rep60.maxBreathe * 100).toFixed(2) + '%');

/* every cue is inside the clip, in order, and none of them is heard after he is
   gone — which is the other half of letting the plan yap past the cut. the
   glitch is the exception it is meant to be: it is the sound of the cut. */
for (const r of sfxReport) {
  if (r.cut) fail.push('the ' + r.kind + ' cue at ' + r.t + 's was cut off by the end of the clip');
  if (r.t < 0 || r.t > CUT.seconds) fail.push('the ' + r.kind + ' cue at ' + r.t + 's is outside the clip');
  if (r.kind !== 'glitch' && r.t >= END.at) {
    fail.push('a ' + r.kind + ' cue is at ' + r.t + 's, after he is cut at ' + END.at);
  }
}
if (sfxReport.filter(r => r.kind === 'mumble').length !== CUED.length) {
  fail.push('the mumble has ' + sfxReport.filter(r => r.kind === 'mumble').length
    + ' syllables against ' + CUED.length + ' yap cycles before the cut');
}
/* and the mumble really is on the mouth: every syllable starts on a cycle's own
   start and lasts as long as that cycle's mouth is open. it cannot be otherwise
   the way the list is built, and it is asserted because that is the one claim
   the sound of this clip rests on. */
for (let i = 0; i < CUED.length; i++) {
  const r = sfxReport.filter(x => x.kind === 'mumble')[i];
  if (Math.abs(r.t - CUED[i].at) > 0.001 || Math.abs(r.seconds - CUED[i].voiced) > 0.005) {
    fail.push('mumble ' + i + ' is at ' + r.t + 's for ' + r.seconds + 's, and its cycle is at '
      + CUED[i].at + 's for ' + CUED[i].voiced + 's');
  }
}

/* the glitch: short, and over. the last stretch of the clip is three words
   holding still and nothing may be tearing them. */
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
        const k = windows.findIndex(x => f / fps >= x.t0 && f / fps < x.t1);
        if (k > -1) per[k]++;
      }
    }
    return { N, on, lastOn, flashes, per };
  };
  const here = count(FPS, GL_WINDOWS);
  const at60 = FPS === 60 ? here : count(60, GL_WINDOWS_60);
  const { N, on, lastOn, flashes, per: perWindow } = here;
  console.log('  the glitch: ' + on + ' of ' + N + ' frames ('
    + (on / N * 100).toFixed(1) + '%), '
    + perWindow.map((c, i) => (GL_WINDOWS[i].pre != null ? 'stutter' + (GL_WINDOWS[i].pre + 1) : 'hit')
      + ' ' + c).join(', ') + ', ' + flashes + ' white frame');
  if (!on) fail.push('nothing glitches on any frame');
  /* post12's one named exception, and it is this scene only: the ceiling on the
     fraction of a clip that may be glitching is post11's 30% and it is a per
     scene number there for a reason. this clip's whole fault lives in the last
     second and a half, so the honest way to read it is against the ending's own
     frames rather than against the file's. */
  const endFrom = Math.round(GL_WINDOWS_60[0].t0 * 60);
  const endFrames = at60.N - endFrom;
  const localDuty = at60.on / endFrames;
  console.log('    and against the ending it lives in, measured at sixty: '
    + at60.on + ' of ' + endFrames + ' frames from '
    + GL_WINDOWS_60[0].t0.toFixed(2) + 's ('
    + (localDuty * 100).toFixed(1) + '%, ceiling 30%)');
  if (localDuty > 0.30) {
    fail.push('the ending glitches on ' + (localDuty * 100).toFixed(1)
      + '% of its own frames, over the 30% ceiling');
  }
  for (let i = 0; i < GL_WINDOWS.length; i++) {
    if (!perWindow[i]) {
      fail.push('glitch window ' + i + ' at ' + GL_WINDOWS[i].t0.toFixed(2)
        + 's fired on no frames at ' + FPS + 'fps');
    }
    if (!at60.per[i]) fail.push('glitch window ' + i + ' fired on no frames at 60fps');
  }
  /* one white frame, and exactly one. four chances to put a white frame on the
     screen inside a third of a second is a strobe. */
  if (flashes !== 1) fail.push(flashes + ' white frames, and there may be exactly one');
  const cleanFrom = Math.round((END.at + END.hard + END.tail + END.clean) * FPS);
  if (lastOn >= cleanFrom) {
    fail.push('the glitch is still firing at frame ' + lastOn + ', past the clean line at ' + cleanFrom);
  }
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
}

/* the mix, on the finished file rather than on the intent. */
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
    + ' dB, over the ' + LIMIT_ALLOW + ' dB this clip allows it');
}

/* the end card holds long enough to be read, and the fault is over well before
   it does. */
const hold = CUT.seconds - (WM_IN + END.wmFor);
if (hold < 1.30) fail.push('the wordmark holds ' + hold.toFixed(2) + 's, and the brief asks for 1.40');
const clean = CUT.seconds - (END.at + END.hard + END.tail + END.clean);
if (clean < 1.00) fail.push('the wordmark is only clean for ' + clean.toFixed(2) + 's');

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
   served rather than remembered. the hexes and the token are banned outright,
   comments included; the *word* is checked with block comments stripped,
   because `lib/mascot.mjs`'s own css comment explains that the two greens exist
   and are not used here, and a guard that fails on a comment saying "there is
   none" is a guard nobody keeps. */
{
  const html = sceneHtml(plan);
  const bare = html.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const bad of ['#0f8a3c', '#35ff6a', '--accent']) {
    if (html.includes(bad)) fail.push('the page carries "' + bad + '" — this clip has no accent in it');
  }
  if (/green/i.test(bare)) fail.push('the page draws with something called green');
}

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');

/* ---------- THE HAND IS OFF ----------
   the hand is opt in and the promise is that every clip written before it
   renders exactly as it did. "exactly" turns out to be two different claims and
   they need two different proofs, which is the interesting part of this change.

   **the module is byte identical, and that is exact.** `demo/out/handoff-diff.mjs`
   imports the module as it was and the module as it is and compares, for thirty
   plans covering every state, both themes, the turn at both ends, a bubble, a
   run of bubbles, a card radius, a caption band, post11's seed and post12's own
   centred plan: the whole plan as json, **every frame at sixty as json**, the
   motion report, the css, the markup, the page plan and both printed summaries.
   nine thousand and sixty three frames, and the only differences are the three
   keys the change adds, each of which is asserted to be off — `hand: false`,
   `yap: null`, `frame.hand === null`, `report.hand === null`.

   the one surface that legitimately differs is `mascotRuntime`, by about 1700
   characters: the page half now looks for a hand element and writes to it if it
   finds one, and on a page with no hand in the markup that lookup returns null
   and the block never runs. that is text in a served page rather than a pixel.

   **the render is not byte identical, and it never was.** this is the finding
   the exercise turned up. post12 rendered twice with nothing at all changed
   between the two runs comes back with different bytes. two causes and both are
   outside this module: headless chrome's thirty pixel gaussian behind the head
   lands a least significant bit either way, and the load loop spins on a real
   network fetch for Michroma, so the page becomes ready after a whole number of
   virtual steps that is not always the *same* whole number — which slides the
   vignette's css animation by up to a frame and re-dithers its gradient across
   the whole frame.

   **two wrong instruments came first and both are worth knowing about.**

   a hash. it said all thirteen artefacts changed, and it says that when nothing
   has changed at all, so it says nothing.

   the worst mse of a pair of runs. this one looked rigorous — render four times
   on each module, compare every run against every other, ask whether the worst
   pair across the two groups is inside the worst pair within them. it said no,
   and it was wrong twice over. with four runs a group there are six pairs inside
   each group and sixteen across them, so the across side draws from the tail of
   the same distribution nearly three times as often and comes out higher whether
   or not anything changed. and mse is an average over two million pixels: it
   goes up when *more* pixels move by a hair, which is exactly what a gradient
   dithering differently does and is not what the question is about.

   **the right instrument is the biggest single pixel difference.** a mascot off
   by a hundredth of a pixel would put hundreds of counts along the edge of a
   white disc on black; a gradient quantising a shade differently puts one or two
   counts over a lot of the frame and never more than that anywhere. over eight
   renders and 336 still comparisons: two runs of identical code differ by at
   most **2 counts of 255**, and runs across the change differ by at most **2
   counts of 255**. the same ceiling on both sides. a few per cent more of the
   frame dithers across the change, which is the longer served page biasing that
   load loop by a fraction of a step, and it lands on the vignette rather than on
   the face. nothing moved.

     node out/handoff-diff.mjs      the exact module comparison
     node out/prove-unchanged.mjs   renders post12 four times on each module
     node out/analyse-runs.mjs      reads the eight renders the right way round
*/
