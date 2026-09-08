/* the boring tek — post23.

   dark only, 1080x1920. the mascot dances: fists up, boots planted, and a body
   that swings left and right on a fixed beat until his head comes off the axis
   twice and spins right round.

     0.0  he is on the frame from the first frame. white face, the module's own
          deep glow, both fists up, both boots on the floor under him.
     0.0  eight swings, 0.75s each, left first. every swing is a small
          horizontal squash, a small tilt and the turn taking his eyes toward
          the side he is going to.
     1.5  swing three. the turn goes all the way, the eyes slide off the edge of
          his own face and for a fifth of a second there is nothing on the front
          of his head at all — a white circle, no eyes — under a camera shake
          and one glitch stutter. then they come back on the **other** side and
          the beat carries on.
     3.75 swing six does it again the other way.
     6.0  the camera snaps in. his face fills the frame, he is still swinging,
          and there is exactly one blink in the two seconds it holds.
     8.0  the fault, and the wordmark stacked three lines.

     node post23.mjs                     1080x1920, 60fps, shutter closed
     DEMO_FPS=12 node post23.mjs         the fast preview pass
     node post23.mjs --blur=6            60fps with the shutter open
     node post23.mjs --keep-frames       leave the jpegs on disk
     node post23.mjs --encode-only       re-encode from kept frames
     node post23.mjs --clock             the clock only, no browser

   one output, one path, overwritten every run:

     demo/out/post23-dark-1080x1920.mp4

   ---------- what is new, and it is two drawings and a part ----------

   **`cheer` is a pose in `lib/mascot.mjs` now**, registered exactly the way the
   traced hands are: `demo/assets/hands/cheering-fists.svg` pasted into
   `HAND_SHAPES` with its coordinates untouched, a measured wrist a side, and a
   pair form — `['cheer-left', 'cheer-right']` — so neither drawing is flipped
   and each hand gets the one it was drawn for. nothing in this file draws a
   hand and nothing in it reaches inside the module to place one.

   **the boots are not a hand and they are not the module's.** they are a layer
   in this file, under his face and behind it, drawn from
   `demo/assets/hands/boots.svg` and `boots-side.svg` inlined. they are styled
   the way the gloves are — the plate's own white on the page's own black, with
   the head's own glow scaled onto them — and they are swapped rather than
   tweened: the front pair for the front swings, the side pair on the two swings
   where he is turned all the way.

   ---------- the turn is composed, and the reason is arithmetic ----------

   the module's turn is a **mark** channel: a mark carries `turn` and gets there
   over its own window. a neutral mark needs `entry + exit + 0.30`, which is
   1.06s, and this clip's beat is 0.75 — so eight swings cannot be eight marks
   and there is no spelling of the plan that makes them one.

   so the turn is composed on top of the module's own frame, out of the module's
   own numbers: `TURN.squeeze`, `TURN.tilt`, `TURN.shift`, `TURN.wrap`,
   `TURN.farX` and `TURN.farY`, applied here the way `mascotFrame` applies them
   there. `bias: 0` means the plan itself never writes the channel, so there is
   exactly one thing turning his head and it is this file.

   **the one place this deliberately differs from the module is the clamp.** the
   module holds every eye `TURN.margin` inside the plate so a state and a turn
   cannot add up to an eye on the cheek. the spin wants the opposite: the eyes
   are pushed past the silhouette and the module's own clip path — the one every
   facial feature already carries — takes them off the frame. what is left is
   the plate, which at the shipped radius is a circle. that is the back of his
   head, and it is not a second drawing.

   ---------- the shutter ----------

   post10's rule. with `--blur` every output frame is captured `SUB` times inside
   its own sixtieth and averaged. the swing, the spin and the zoom are written
   against `t` and smear; the glitch, the boot swap and the wordmark's birth are
   written against the output frame and are held across every capture of it. the
   three fastest things in the file are printed on every run. */

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
  STAGE, SAFE, HEAD, HEAD_PX, GRID, EYE_CX, TURN, HANDS, GLOW, HAND_POSES, handShape,
} from './lib/mascot.mjs';
import { brandTokens } from './lib/captions.mjs';
import { renderSfx, writeWav, applyGain, limit, loudness, describeMix } from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post23');
const SUBS = path.join(OUT, 'subframes-post23');
const VERIFY = path.join(OUT, 'verify-post23');

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
const CLOCK_ONLY = argv.includes('--clock');
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
   post12's line through post22's: the middle of the **safe band**, not of the
   frame. what is centred here is not his head, though — it is him **and his
   boots**, which is a taller thing than a head. the head therefore sits above
   the middle by half the boots, and `MASCOT_Y` is that, worked out below rather
   than typed: the wordmark still lands on the middle of the safe band, because
   the wordmark is not standing on anything. */
const CENTRE_Y = (SAFE_CSS.top + (VH - SAFE_CSS.bottom)) / 2;
/* 140 rather than 148. the zoom takes his face to three times its own width and
   the head has to still be inside the frame at the end of a swing; 140 puts the
   plate at 262 device px, in the middle of the module's own window. */
const SIZE = 140;

/* ---------- the beat ----------
   eight swings, three quarters of a second each, alternating, left first. the
   whole dance is six seconds and every number in it is this table. */
const BEAT = 0.75;
const SWINGS = 8;
const DANCE = +(BEAT * SWINGS).toFixed(4);
/* the two that go all the way round, as swing numbers the brief uses — three
   and six — held here as the indices the arithmetic uses. */
const BACK_SWINGS = [3, 6];
const BACK = BACK_SWINGS.map(n => n - 1);

const SW = {
  /* how far an ordinary swing turns him, on the module's own -1..1 channel.
     0.55 is a three quarter turn's worth of eye travel and not a hair more: the
     two that go to 1 have to read as something else happening. */
  turn: 0.55,
  /* the fraction of a beat the body spends travelling. the rest of it is the
     settle, which is where the squash and the boots' bounce live. */
  travel: 0.60,
  over: 0.10, damp: 4.0,        /* the overshoot at the end of a travel */
  sway: 20,                     /* css px of lateral body travel at a full swing */
  lean: 0.6,                    /* degrees of body lean on top of TURN.tilt */
  squash: 0.055,                /* the horizontal squash on each arrival */
  /* the fists trail the body. it is a lag rather than a second animation: the
     gloves ride the card, so what is added here is only the difference between
     where the body is and where it was a tenth of a second ago. */
  loose: 0.10, trail: 5.0, roll: 7.0,
};

/* ---------- the spin ----------
   what swings three and six do that the other six do not. all four numbers are
   fractions of the beat except `off`, which is grid units on the head's own 64.

   `off` is 48 because both eyes have to leave. the plate is 60 units across and
   the trailing eye starts on the far side of it, so clearing the silhouette
   from there is most of a head's width — and it is only ever seen for the third
   of a beat it takes, because after that the clip path has it. */
const SPIN = { in: 0.34, hold: 0.22, back: 0.82, off: 48 };

/* ---------- the camera ----------
   one move in the whole film and it is a snap. 0.18s is eleven frames at sixty,
   which is a snap by the house's own definition and is as slow as it may be
   before it becomes a pan.

   **the sway is divided by the zoom while it is in.** that is a camera tracking
   a face rather than a face being held still: he goes on swinging exactly as
   much, and what stops growing is how far across the frame the swing carries
   him. without it a head three times its own size leaves the frame on every
   other beat.

   **and it pans as it pushes, which is not decoration either.** he stands with
   his head above the middle of the frame, because what is centred out there is
   him *and his boots*. push in on that and the face ends up in the top half with
   a pair of boots filling the bottom one, which is a shot of a boot. so the move
   carries the head from where it stands to the middle of the frame over exactly
   the same window — one snap that lands on one frame, not a zoom and a pan. */
const ZOOM = { at: DANCE, for: 10 / 60, to: 2.8 };

/* ---------- the end ---------- */
const END = { at: 8.0, pre: [], hard: 0.12, tail: 0.18, wmIn: 0, wmFor: 0.09, clean: 0.06 };
const CARD = 0.95;
const SECONDS = +(END.at + CARD).toFixed(2);
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16, minCapPx: 56 };
const GL = {
  shakeX: 15, shakeY: 8, split: 9.5, bandDx: 88, bands: 3,
  noise: [0.10, 0.24], flash: 0.30, flashSize: 420, calmFrom: 0.86,
};

/* ---------- the boots ----------
   the two files, inlined. `ink` is where the drawing actually is inside its own
   800 by 600 frame, measured off the paths, and it is what the placement is
   done against — the frame has air in it and a boot placed by the frame would
   float.

   `w` is the width of the **ink**, in css px, and 130 is a shade under the
   plate's own 131: a pair of boots as wide as the head reads as a body, and a
   pair wider than it reads as a clown. */
const BOOTS = {
  w: 130, gap: 12, bounce: 4.5,
  vb: { w: 800, h: 600 },
  ink: { x0: 85.29, x1: 714.71, y0: 121.46, y1: 478.13 },
};
BOOTS.scale = BOOTS.w / (BOOTS.ink.x1 - BOOTS.ink.x0);
BOOTS.svgW = +(BOOTS.vb.w * BOOTS.scale).toFixed(2);
BOOTS.svgH = +(BOOTS.vb.h * BOOTS.scale).toFixed(2);
BOOTS.inkTop = +(BOOTS.ink.y0 * BOOTS.scale).toFixed(2);
BOOTS.inkH = +((BOOTS.ink.y1 - BOOTS.ink.y0) * BOOTS.scale).toFixed(2);
/* the side pair goes on when he is turned this far, which is past anything an
   ordinary swing reaches — those peak at SW.turn plus its own overshoot. */
BOOTS.sideFrom = 0.80;

/* him and his boots, centred as one thing on the middle of the safe band. the
   head's own half is the plate's, not the box's: the box holds room for the
   gloves and centring on that would put a head off centre by however much a
   fist reaches. */
const HALF_HEAD = +(HEAD.plate.s / 2 * (SIZE / GRID)).toFixed(3);
const BODY_H = +(HALF_HEAD * 2 + BOOTS.gap + BOOTS.inkH).toFixed(2);
const MASCOT_Y = +(CENTRE_Y - BODY_H / 2 + HALF_HEAD).toFixed(2);
BOOTS.top = +(MASCOT_Y + HALF_HEAD + BOOTS.gap - BOOTS.inkTop).toFixed(2);

/* the head's own glow, scaled onto the boots the way the module scales it onto a
   glove: the same two radii and the same two opacities, multiplied by how big
   the thing wearing it is against the plate. `2 *` is a drop-shadow's standard
   deviation against a `blur()`'s, which is the module's own conversion. */
const GLOW_CSS = {
  mid: +(2 * GLOW.mid.blur * BOOTS.w / (HALF_HEAD * 2)).toFixed(2),
  wide: +(2 * GLOW.wide.blur * BOOTS.w / (HALF_HEAD * 2)).toFixed(2),
};

const CRF = 17;
const TARGET_LUFS = -14;
const SAMPLE_CEILING = -1.8;
const PEAK_CEILING = -1.0;
const MAX_REDUCTION = 5.0;
/* how fast anything in this file may move, in css px between two frames at
   sixty. post19's number and it is the shutter's rather than the animation's. */
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
const MOVE = bezier(.4, 0, .2, 1);             /* and the one every travel here uses */
/* ---------- and the one the camera uses, which is not that ----------
   the snap is ten frames at sixty, which is the house's own definition of one,
   and over ten frames `MOVE` is too peaky to be filmed: it carries a fifth of a
   three times zoom on its fastest frame, which at the far corner of a fist is
   56 css px against a ceiling of 42. this curve does the same distance in the
   same ten frames with its worst frame at 38 — quick off the mark, hard
   deceleration into the landing, and still a snap rather than a pan. */
const SNAP = bezier(.18, 0, .46, 1);
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

/* ---------- the swing ----------
   one function, and everything the body does is a number off it. it runs on the
   module's own turn scale, so `swingAt` is literally what a mark's `turn` would
   have been if a mark could have carried eight of them.

   the beat never stops: the dance is eight swings and the clip is longer than
   the dance, so the swings carry on underneath the zoom, which is what "still
   swinging" means. only the two that go all the way are special and they are
   both inside the first six seconds. */
const swingOf = t => Math.max(0, Math.floor(t / BEAT));
const dirOf = i => (i % 2 ? 1 : -1);
const isBack = i => BACK.includes(i);
const ampOf = i => (isBack(i) ? 1 : SW.turn);
const valOf = i => (i < 0 ? 0 : dirOf(i) * ampOf(i));

function swingAt(t) {
  const i = swingOf(t);
  const u = (t - i * BEAT) / BEAT;
  const p = Math.min(1, u / SW.travel);
  let v = lerp(valOf(i - 1), valOf(i), MOVE(p));
  /* the settle. it is nought at both ends of its own window, so a beat joins the
     next one without a step and the first frame of a swing is exactly where the
     last frame of the one before it left off. */
  if (p >= 1) {
    const q = span(u, SW.travel, 1);
    v += valOf(i) * SW.over * Math.exp(-SW.damp * q) * Math.sin(2 * Math.PI * q) * (1 - q);
  }
  return n4(v);
}

/* the accent on each arrival: one damped cosine a beat, starting at the moment
   the travel lands. it is post20's smash curve at a fortieth of its depth, and
   it drives the body's squash and the boots' bounce off the same number so the
   two cannot land on different frames. */
function beatAt(t) {
  const i = swingOf(t);
  const q = span((t - i * BEAT) / BEAT, SW.travel - 0.06, 1);
  if (q <= 0 || q >= 1) return 0;
  return +(Math.exp(-4.2 * q) * Math.cos(2 * Math.PI * 0.9 * q) * (1 - q)).toFixed(5);
}

/* ---------- the spin, as one number and one flag ----------
   `x` is grid units added to both eyes on top of the turn's own travel, and the
   sign is what makes this a spin rather than a peek: the eyes leave on the side
   he is turning to and come back **from the other one**, which is a head that
   went all the way round rather than a head that looked away and looked back.

   the swap of sign happens while they are off the frame, so it costs nothing.
   `back` is the beat where there is nothing on his face at all. */
/* **the blank beat is snapped to the grid that is actually rendering**, which is
   post11's rule and it is not decoration here: the stutter, the shake and the
   frame with nothing on his face all have to be the same frame, and a window
   written in seconds lands a twelfth either side of one on the preview pass. so
   the window is frames, the slide out finishes on its first frame and the slide
   back in starts on the one after its last. */
const spinWindowsAt = fps => BACK.map(i => ({
  ...onGrid(i * BEAT + SPIN.in * BEAT, SPIN.hold * BEAT, fps), i, dir: dirOf(i),
}));
let SPIN_WIN = [];

function spinAt(t) {
  const k = BACK.indexOf(swingOf(t));
  if (k < 0) return { x: 0, back: 0 };
  const w = SPIN_WIN[k], d = w.dir, i = w.i;
  if (t < w.t0) return { x: n4(d * SPIN.off * MOVE(span(t, i * BEAT, w.t0))), back: 0 };
  if (t < w.t1) return { x: d * SPIN.off, back: 1 };
  return { x: n4(-d * SPIN.off * (1 - MOVE(span(t, w.t1, i * BEAT + SPIN.back * BEAT)))), back: 0 };
}

/* the camera. it is nought before the snap, `to` after it, and **one on the
   frame the wordmark is born on** — the end card is not filmed through a lens
   that was pointed at somebody else. */
function zoomAt(t, cut) {
  if (cut) return 1;
  return +(1 + (ZOOM.to - 1) * SNAP(span(t, ZOOM.at, ZOOM.at + ZOOM.for))).toFixed(5);
}
/* the pan, on the same curve and the same window, so the two are one move. it is
   how far his head has to come down to be in the middle of the frame, which is
   half the boots — the number the placement gave up to stand him on the floor. */
const PAN = +(CENTRE_Y - MASCOT_Y).toFixed(2);
function panAt(t, cut) {
  if (cut) return 0;
  return +(PAN * SNAP(span(t, ZOOM.at, ZOOM.at + ZOOM.for))).toFixed(3);
}

/* ---------- what a turn does to a face ----------
   the module's own five moves, written here because the channel is composed
   rather than planned. every constant is `TURN`'s — this file invents none of
   them — and the one thing left out on purpose is the clamp: see the head note.

   `farEye` is the eye the turn carries toward the silhouette. it is the one on
   the far side of the form, so it foreshortens and travels the smaller distance;
   the near one keeps its width and crosses the centre line. that is the module's
   assignment and getting it the other way round is a face whose near cheek
   collapses, which is a bug that shipped there once. */
function turnEyes(eyes, v, extra) {
  const aq = Math.abs(v), sgn = v < 0 ? -1 : 1, farEye = v >= 0 ? 1 : 0;
  return eyes.map((e, k) => ({
    ...e,
    x: n4(e.x + sgn * aq * (k === farEye ? TURN.shift : TURN.shift + TURN.wrap) + extra),
    sx: +(e.sx * (k === farEye ? 1 - TURN.farX * aq : 1)).toFixed(5),
    sy: +(e.sy * (k === farEye ? 1 - TURN.farY * aq : 1)).toFixed(5),
  }));
}

/* ---------- the composition ----------
   the module writes a head breathing and drifting with two fists up beside it,
   and this adds the dance to it: a turn, a lean, a sway, a squash and the fists
   trailing behind the body by a tenth of a second.

   the squash is volume preserving and the turn's squeeze is not, which is the
   module's own distinction: a squash is mass moving and a turn is a projection,
   and a head that got taller as it turned would read as rubber. */
function compose(plan, t) {
  const f = mascotFrame(plan, t);
  const v = swingAt(t);
  const sp = spinAt(t);
  const z = zoomAt(t, false);
  const sq = 1 + SW.squash * beatAt(t);
  const squeeze = 1 - TURN.squeeze * Math.abs(v);
  const out = {
    ...f,
    card: {
      ...f.card,
      /* the sway is divided by the camera, which is the camera following him. */
      x: n4(f.card.x + SW.sway * v / z),
      rot: n4(f.card.rot + (TURN.tilt + SW.lean) * v),
      sx: +(f.card.sx * sq * squeeze).toFixed(5),
      sy: +(f.card.sy / sq).toFixed(5),
    },
    eyes: turnEyes(f.eyes, v, sp.x),
  };
  /* the fists. the lag is the whole of "loose": the gloves already ride the
     card, so what is written here is only how far behind the body they are. */
  if (out.hands) {
    const d = swingAt(Math.max(0, t - SW.loose)) - v;
    out.hands = {
      ...out.hands,
      /* post20's third line, and post22's. `fit` is the inverse of the card's
         own two scales and the module wrote it for the card **it** wrote; a card
         this file then scales leaves that inverse describing a head that no
         longer exists. */
      fit: {
        cx: +(out.hands.fit.cx / (sq * squeeze)).toFixed(5),
        cy: +(out.hands.fit.cy * sq).toFixed(5),
      },
      list: out.hands.list.map(h => ({
        ...h,
        x: n4(h.x + d * SW.trail + v * HANDS.turnShare * TURN.shift),
        rot: n4(h.rot + d * SW.roll),
      })),
    };
  }
  return out;
}

/* ---------- the glitch ----------
   post12's, through post20's, post21's and post22's: a function of the output
   frame index and of nothing else, so a one frame shake is not on for one
   subframe of four and landing at a quarter strength.

   five windows. two are the back of his head — one a swing, on the frame the
   eyes have left — and three are the end card's own two stutters and its fault.
   nothing else in the film glitches. */
function heatAt(p) {
  if (p < 0) return 0;
  if (p < 0.13) return 1;
  if (p < 0.58) return 1 - (p - 0.13) / 0.45 * 0.58;
  if (p < GL.calmFrom) return 0.42 * (1 - (p - 0.58) / (GL.calmFrom - 0.58));
  return 0;
}
function glitchWindows(fps) {
  return [
    ...spinWindowsAt(fps).map((w, i) => ({ ...onGrid(w.t0, 0.07, fps), kind: 'stutter', force: 0.55, seed: 0x5b10 + i * 613 })),
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
   and `f` is the output frame it belongs to. the two exchanges — the boot swap
   and the wordmark — are on the **frame** rather than on the instant, which is
   post20's 60fps finding: every channel in an exchange goes on the same frame or
   the shutter finds the seam. */
function frameAt(t, f) {
  const g = glitchAt(f);
  const cut = f >= Math.round(END.at * FPS);
  const ft = f / FPS;
  return {
    t: +t.toFixed(4), f,
    mo: cut ? 0 : 1,
    zoom: zoomAt(t, cut),
    pan: panAt(t, cut),
    /* the boot swap is a lookup on the output frame's own swing, not on the
       instant's: two boots crossfading would be four boots for the length of the
       fade, which is the same argument the module makes about a pose's shape. */
    side: Math.abs(swingAt(ft)) >= BOOTS.sideFrom ? 1 : 0,
    boots: {
      o: cut ? 0 : 1,
      dy: +(-BOOTS.bounce * Math.max(0, beatAt(t))).toFixed(3),
      /* the boots' glow breathes on its own clock, which is what stops the one
         layer in this film that never moves far from being a still. */
      glow: +phosphor(t, 0.10, 3.1, 1.19, 0.7).toFixed(4),
    },
    sx: g.sx, sy: g.sy,
    wm: {
      o: cut ? 1 : 0,
      sc: +(1 + (1 - EASE(span(t, END.wmIn, END.wmIn + END.wmFor))) * 0.085).toFixed(4),
      glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4),
    },
    g,
  };
}

/* ---------- the boots, as markup ----------
   the two files read off disk and inlined, stripped of their own presentation
   attributes' authority by the stylesheet below rather than by an edit: a css
   rule beats a presentation attribute, so the drawings keep their coordinates
   and this file keeps the colour. */
function bootSvg(file, id) {
  const src = fs.readFileSync(path.join(HERE, 'assets', 'hands', file), 'utf8');
  const body = src.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return `<svg class="boot" id="${id}" viewBox="0 0 ${BOOTS.vb.w} ${BOOTS.vb.h}"`
    + ` width="${BOOTS.svgW}" height="${BOOTS.svgH}" aria-hidden="true">${body}</svg>`;
}

/* ---------- the page ---------- */
function sceneHtml(plan) {
  /* index.html's own two blocks, verbatim, which is `captionCss`'s move and the
     reason it is: --bg and --fg are the site's and this file is not allowed a
     second opinion about either. */
  const brand = brandTokens();
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post23</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&display=swap">
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
  /* **one family and it is the wordmark's.** there is no caption in this film,
     no pill and no word a viewer reads that is not the end card, so the second
     face every clip since post18 has requested is not requested here. */
  --display:"Michroma",var(--mono);
  /* the two channels the rgb split is drawn in: the same white the glow is,
     pulled apart, rather than a red and a cyan out of a filter preset. */
  --split-r:rgba(255,120,120,.55); --split-c:rgba(120,220,255,.55);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--mono)}

/* the vignette, and it is load bearing rather than decoration: with nothing at
   all animating chrome stops producing compositor frames and the screenshot call
   blocks on a frame that never comes. post20's .030 / .010, guarded below. */
.vignette{position:fixed;inset:-10%;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 78% 62% at 50% 46%,
    rgba(255,255,255,.030) 0%, rgba(255,255,255,.010) 46%, rgba(0,0,0,0) 72%);
  will-change:transform,opacity;
  animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{
  from{transform:scale(1) translate3d(0,0,0);opacity:.85}
  to{transform:scale(1.05) translate3d(0,-1.1%,0);opacity:1}
}

/* the camera, and it only ever shakes. the zoom is on .world under it rather
   than here, so the end card — which is not in .world — is drawn at one to one
   however far in the lens was pointed a frame earlier. */
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;background:var(--bg);
  transform:translate3d(calc(var(--sx,0) * 1px),calc(var(--sy,0) * 1px),0);
  will-change:transform}
.world{position:absolute;inset:0;z-index:1;
  transform-origin:${VW / 2}px ${MASCOT_Y}px;
  transform:translate3d(0,calc(var(--pan,0) * 1px),0) scale(var(--z,1));
  will-change:transform}

${mascotCss(plan)}
#m-zone{opacity:var(--m-o,1)}

/* ---- the boots ----
   under his face and behind it: z-index 3 against the zone's own 4, so a fist
   that swings low is in front of a boot rather than behind it.

   the fill is the plate's own white and the outline is the page, which is the
   glove's rule read the only way it can be read out here — a glove's edge is
   painted where it is over the head and this is never over the head, so what the
   drawing's own black lines become is the background colour. the glow is the
   module's own two radii, scaled from grid units into css by the head's own
   unit, at the module's own two opacities. */
.boots{position:absolute;left:50%;top:${BOOTS.top}px;
  width:${BOOTS.svgW}px;margin-left:${-BOOTS.svgW / 2}px;
  z-index:3;pointer-events:none;opacity:var(--bo,1);
  transform:translate3d(0,calc(var(--by,0) * 1px),0);
  will-change:transform,opacity;
  filter:drop-shadow(0 0 ${GLOW_CSS.mid}px rgba(244,247,245,calc(var(--bglow,1) * ${GLOW.mid.o})))
    drop-shadow(0 0 ${GLOW_CSS.wide}px rgba(244,247,245,calc(var(--bglow,1) * ${GLOW.wide.o})))}
.boot{display:block}
.boot path{fill:#f4f7f5;stroke:var(--bg);stroke-width:10;
  stroke-linejoin:round;stroke-linecap:round}
#boots-side{display:none}
.boots[data-side="1"] #boots-front{display:none}
.boots[data-side="1"] #boots-side{display:block}

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
/* **nothing fringes but the wordmark.** post22's rule and its guard: the split
   is the end card's own and it may not reach him, his boots or anything else. */
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
  <div class="world" id="world">
    <div class="boots" id="boots">
${bootSvg('boots.svg', 'boots-front')}
${bootSvg('boots-side.svg', 'boots-side')}
    </div>
${mascotMarkup(plan)}
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
window.__P23 = ${JSON.stringify({ VW, VH, DSF, WM })};
${mascotRuntime()}
(${scenePage.toString()})();
/* the wordmark measures and fits itself once, after the face is really here.
   offline it renders in the mono fallback and looks almost right, which is the
   worst kind of wrong to fit type against. */
document.fonts.load('400 40px Michroma')
  .then(function () { return document.fonts.ready; })
  .then(function () {
    window.__built = Object.assign({}, window.__p23.fit(), { mas: window.__mas.build() });
  });
</script>
</body>
</html>`;
}

/* ---------- the page's own script ----------
   it writes numbers to elements and it decides nothing, exactly like the
   mascot's page half. serialised in with .toString(), so it must not close over
   anything: everything it needs arrives on window.__P23. */
function scenePage() {
  const P = window.__P23;
  const stage = document.getElementById('stage');
  const world = document.getElementById('world');
  const boots = document.getElementById('boots');
  const front = document.getElementById('boots-front');
  const side = document.getElementById('boots-side');
  const wms = [...document.querySelectorAll('.wm')];
  const tears = [...document.querySelectorAll('.tear')];
  const tearIns = tears.map(t => t.querySelector('.tear-in'));

  const capOf = el => {
    const cs = getComputedStyle(el);
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    const m = cv.measureText('H');
    return { cap: m.actualBoundingBoxAscent || 0, font: cv.font };
  };

  window.__p23 = {
    /* michroma is proportional and the tracking is nearly a fifth of an em, so
       the width of the widest line is a measurement rather than a ratio. every
       copy is fitted, the torn ones included, or a tear would show a wordmark at
       a different size. */
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

    /* the boots as they actually painted: which pair is on, how wide the ink is
       and how far off each border it sits. it is read off the rendered elements
       rather than off the numbers that placed them, because a drawing whose own
       viewBox has air in it is exactly the thing a placement gets wrong. */
    measureBoots() {
      const on = getComputedStyle(side).display !== 'none' ? side : front;
      const off = on === side ? front : side;
      const r = on.getBoundingClientRect(), d = P.DSF;
      return {
        which: on.id,
        bothOn: getComputedStyle(off).display !== 'none',
        w: +(r.width * d).toFixed(1), h: +(r.height * d).toFixed(1),
        left: +(r.left * d).toFixed(1), right: +((P.VW - r.right) * d).toFixed(1),
        top: +(r.top * d).toFixed(1), bottom: +((P.VH - r.bottom) * d).toFixed(1),
      };
    },

    /* the head, as the browser drew it, on whatever frame is applied. it is the
       one measurement the zoom needs: `headRect` in node knows the geometry and
       knows nothing about a css scale sitting over it. */
    measureHead() {
      const el = document.getElementById('m-card');
      const r = el.getBoundingClientRect(), d = P.DSF;
      return { w: +(r.width * d).toFixed(1), h: +(r.height * d).toFixed(1),
        left: +(r.left * d).toFixed(1), right: +((P.VW - r.right) * d).toFixed(1) };
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
      /* the split is behind an attribute rather than a zero valued shadow: a
         shadow at offset 0 in full colour is a coloured halo, not "off". */
      if (o.g.split > 0.01) stage.setAttribute('data-gl', '1');
      else stage.removeAttribute('data-gl');

      world.style.setProperty('--z', o.zoom.toFixed(5));
      world.style.setProperty('--pan', o.pan.toFixed(3));
      boots.style.setProperty('--by', o.boots.dy.toFixed(2));
      boots.style.setProperty('--bo', o.boots.o.toFixed(4));
      boots.style.setProperty('--bglow', o.boots.glow.toFixed(4));
      boots.style.visibility = o.boots.o < 0.004 ? 'hidden' : 'visible';
      if (o.side) boots.setAttribute('data-side', '1');
      else boots.removeAttribute('data-side');

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

/* ---------- the rAF shim ---------- */
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
  if (!await page.evaluate(() => document.fonts.check('400 40px "Michroma"'))) {
    throw new Error('Michroma did not load — the wordmark would be judged in the mono fallback');
  }

  const put = async (t, f) => {
    await page.evaluate(fr => window.__mas.apply(fr), compose(plan, t));
    await page.evaluate(fr => window.__p23.apply(fr), frameAt(t, f));
  };

  const built = await page.evaluate(() => window.__built);
  const wm = await page.evaluate(() => window.__p23.measureWm());
  console.log('  built: head ' + built.mas.headPx + 'px, ' + built.mas.eyes + ' eyes, '
    + built.mas.glows + ' glow layers, theme ' + built.mas.theme);
  console.log('  the wordmark: ' + wm.sizeCss + 'css px, widest line ' + wm.widestPx
    + ' device px, caps ' + wm.capPx + ', clear ' + wm.left + ' left / ' + wm.top
    + ' top / ' + wm.right + ' right / ' + wm.bottom + ' bottom');

  /* the boots on a front swing and on a turned one, and the head at the top of
     the zoom, all read off the rendered elements. */
  const flatF = Math.round((BEAT * 0.5) * FPS);
  await put(flatF / FPS, flatF);
  const bootsFront = await page.evaluate(() => window.__p23.measureBoots());
  const sideF = Math.round((BACK[0] * BEAT + BEAT * SW.travel) * FPS);
  await put(sideF / FPS, sideF);
  const bootsSide = await page.evaluate(() => window.__p23.measureBoots());
  const zoomF = Math.round((ZOOM.at + ZOOM.for + 0.30) * FPS);
  await put(zoomF / FPS, zoomF);
  const headZoom = await page.evaluate(() => window.__p23.measureHead());
  console.log('  the boots: ' + bootsFront.which + ' at ' + bootsFront.w + 'x' + bootsFront.h
    + ' device, clear ' + bootsFront.left + ' left / ' + bootsFront.right + ' right / '
    + bootsFront.bottom + ' bottom; turned all the way it is ' + bootsSide.which);
  console.log('  the face at the top of the zoom: ' + headZoom.w + ' device px across of '
    + VW * DSF + ' (' + (headZoom.w / (VW * DSF) * 100).toFixed(0) + '% of the frame)');

  /* the head, as ink, on every frame of the dance, with the swing composed on.
     **only the dance is judged against the safe area** — see the guard, and the
     reason is that a face filling the frame is the brief. */
  let worst = null;
  for (let f = 0; f < Math.round(DANCE * FPS); f++) {
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
      const mf = compose(plan, t);
      const o = frameAt(t, f);
      await page.evaluate(fr => window.__mas.apply(fr), mf);
      await page.evaluate(fr => window.__p23.apply(fr), o);
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);

      if (k === 0) {
        /* the liveness signature: one number per output frame off everything
           this file wrote plus everything the module wrote, so two identical
           frames are a fact rather than a suspicion. the mascot's channels are
           multiplied by `mo`, because after the fault he is not on the frame and
           counting his drift would let the end card pass on motion nobody sees. */
        let s = o.mo * 7 + o.zoom * 11 + o.pan * 151 + o.side * 13 + o.boots.dy * 17 + o.boots.o * 19
          + o.boots.glow * 23 + o.sx * 29 + o.sy * 31
          + o.wm.o * 37 + o.wm.sc * 41 + o.wm.glow * 43
          + o.g.split * 47 + o.g.noise * 53 + o.g.flash * 59 + o.g.bands.length * 61;
        s += o.mo * (mf.card.x * 67 + mf.card.y * 71 + mf.card.rot * 73
          + mf.card.sx * 79 + mf.card.sy * 83 + mf.glow * 89);
        for (let e = 0; e < 2; e++) {
          s += o.mo * (mf.eyes[e].x * (97 + e) + mf.eyes[e].y * (103 + e)
            + mf.eyes[e].sx * (109 + e) + mf.eyes[e].sy * (113 + e) + mf.eyes[e].lid * (127 + e));
        }
        if (mf.hands) for (const h of mf.hands.list) s += h.o * 131 + h.x * 137 + h.y * 139 + h.rot * 149;
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
  const b3 = BACK[0] * BEAT, b6 = BACK[1] * BEAT;
  const stills = [
    [0.02, 'a-the-first-frame'],
    [BEAT * SW.travel, 'b-swing-one-lands-left'],
    [BEAT + BEAT * SW.travel, 'c-swing-two-lands-right'],
    [b3 + BEAT * SPIN.in * 0.5, 'd-the-eyes-going'],
    [b3 + BEAT * (SPIN.in + SPIN.hold * 0.5), 'e-the-back-of-the-head'],
    [b3 + BEAT * (SPIN.back + 0.08), 'f-back-on-the-other-side'],
    [b6 + BEAT * (SPIN.in + SPIN.hold * 0.5), 'g-the-second-spin'],
    [DANCE - 0.06, 'h-the-last-swing'],
    [ZOOM.at + ZOOM.for * 0.5, 'i-the-snap'],
    [ZOOM.at + ZOOM.for + 0.40, 'j-the-face-fills-it'],
    [END.at - 0.20, 'k-the-second-stutter'],
    [END.at + END.hard + END.tail + 0.16, 'l-the-wordmark'],
    [SECONDS - 0.06, 'm-the-last-frame'],
  ];
  for (const [want, name] of stills) {
    const f = Math.min(N - 1, Math.round(want * FPS));
    await put(f / FPS, f);
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
    });
    fs.writeFileSync(path.join(VERIFY, name + '.png'), Buffer.from(shot.data, 'base64'));
  }

  console.log('  the head through the dance, worst frame at ' + worst.t + 's: ' + worst.left
    + ' left, ' + worst.top + ' top, ' + worst.right + ' right, ' + worst.bottom
    + ' bottom (floor ' + Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom) + ')');
  console.log('  the glow reaches ' + worst.glowReach + 'px past the ink');

  await browser.close();
  srv.close();
  if (SUB > 1) blend(N);

  const state = { built, wm, bootsFront, bootsSide, headZoom, head: worst, sigs, frames: N };
  fs.writeFileSync(path.join(OUT, 'post23.json'), JSON.stringify(state, null, 2));
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
  const out = path.join(OUT, 'post23-dark-1080x1920.mp4');
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

END.wmIn = END.at;
END.pre = [
  { t: +(END.at - 0.38).toFixed(3), for: 0.05, force: 0.34 },
  { t: +(END.at - 0.18).toFixed(3), for: 0.05, force: 0.60 },
];
SPIN_WIN = spinWindowsAt(FPS);
const SPIN_HIT = SPIN_WIN.map(w => w.t0);
GL_WINDOWS = glitchWindows(FPS);
GL_WINDOWS_60 = FPS === 60 ? GL_WINDOWS : glitchWindows(60);

/* ---------- the plan ----------
   one mark, and that is the whole of it. the dance is composed rather than
   planned — see the note at the top — so what the module is asked for is a calm
   face with two fists up, and everything that moves after that is this file
   turning it. */
const makePlan = seed => planMascot({
  seconds: SECONDS,
  size: SIZE,
  theme: 'dark',
  hands: true,
  /* dead straight on. `pos` defaults to bottom-left and the module would derive
     TURN.bias 0.35 from it, which is right for a head standing in a corner and
     wrong for one facing camera — and here it is wrong twice over, because a
     resting turn would be a second thing writing the channel this file drives. */
  bias: 0,
  seed,
  marks: [{
    t: 0,
    state: 'neutral',
    /* the pose's own entrance and exit, and a hold bought so the fists are still
       up on the frame the fault takes them. */
    hands: {
      pose: 'cheer',
      entry: HAND_POSES.cheer.entry,
      exit: HAND_POSES.cheer.exit,
      hold: +(END.at - HAND_POSES.cheer.entry).toFixed(4),
    },
  }],
});

/* ---------- the seed, walked rather than typed ----------
   a blink is the module's own schedule and not something a clip may place, so
   the only knob is the seed. the brief asks for **one** blink while his face
   fills the frame, and a two second hold with none in it is a still with a
   camera on it — so the walk is for a seed whose schedule puts exactly one
   inside the zoom and at least one under the dance. it is a search rather than a
   number with a comment, because a number with a comment stops being true the
   moment somebody moves the zoom. */
const SEED = (() => {
  for (let s = 1; s <= 400; s++) {
    const b = makePlan(s).idle.blinks;
    if (b.filter(x => x.t >= ZOOM.at && x.t < END.at).length !== 1) continue;
    if (!b.filter(x => x.t < ZOOM.at).length) continue;
    return s;
  }
  throw new Error('no seed under 400 puts exactly one blink inside the zoom');
})();
const plan = makePlan(SEED);
console.log('  the idle seed is ' + SEED + ', walked for one blink inside the zoom');

/* his box, placed. `headRect`, `mascotCss` and `mascotPagePlan` all read
   `plan.box` when they are called, so moving it first is the same as having been
   placed there. */
const halfBox = (GRID / 2) * plan.unit;
plan.box.left = +(VW / 2 - halfBox).toFixed(2);
plan.box.top = +(MASCOT_Y - halfBox).toFixed(2);

const rep = mascotMotion(plan, FPS, SECONDS);
const rep60 = FPS === 60 ? rep : mascotMotion(plan, 60, SECONDS);

console.log(describeMascot(plan));
console.log(describeMotion(rep));

/* ---------- the sound ----------
   **no voice, no music and no bed.** what is on the bus is the film's five
   glitches: the two that take his face off, the two stutters into the fault and
   the fault itself. everything else is silence, on purpose. */
const cues = [
  ...SPIN_HIT.map((t, i) => {
    const g = GL_WINDOWS.find(w => w.kind === 'stutter' && Math.abs(w.t0 - Math.round(t * FPS) / FPS) < 1e-9);
    return {
      t: g ? g.t0 : t, kind: 'glitch',
      opts: { len: 0.07, burst: 0.005, crush: 3200, f0: 240, f1: 130, seed: 0x5b10 + i * 613 },
      from: 'the back of his head, spin ' + (i + 1) + ' of two',
    };
  }),
  { t: END.at, kind: 'glitch', from: 'the cut' },
];
const { buf: sfx, report: sfxReport } = renderSfx(cues, SECONDS, {});

/* the two stutters into the fault, getting louder. same recipe, and the level is
   the only argument. */
const PRE_DB = [-32, -27];
for (let i = 0; i < END.pre.length; i++) {
  const g = GL_WINDOWS.find(x => x.kind === 'stutter'
    && Math.abs(x.t0 - Math.round(END.pre[i].t * FPS) / FPS) < 1e-9);
  const one = renderSfx([{
    t: g ? g.t0 : END.pre[i].t, kind: 'glitch',
    opts: { len: 0.05 + i * 0.014, burst: 0.004, crush: 3800, f0: 210, f1: 120, seed: 0x51a0 + i * 977 },
    from: 'stutter ' + (i + 1) + ' of two, into the fault',
  }], SECONDS, { gains: { glitch: PRE_DB[i] } });
  for (let j = 0; j < sfx.length; j++) sfx[j] += one.buf[j];
  sfxReport.push(...one.report);
}
sfxReport.sort((a, b) => a.t - b.t);

/* ---------- the mix ----------
   post16's rig, because there is nothing to duck under: a handful of transients
   on silence, scaled once to the loudness target and held under a peak ceiling.
   the bisect is post19's — a pass over the limiting allowance is a ceiling
   rather than a stop, so the last lift under it and the first over it bracket
   the answer and the loop halves the gap. */
const WAV = path.join(OUT, 'post23-mix.wav');
const RAW = path.join(OUT, 'post23-mix-raw.wav');
fs.mkdirSync(OUT, { recursive: true });
function pass(lift) {
  const buf = sfx.slice();
  applyGain(buf, lift);
  const pk = limit(buf, SAMPLE_CEILING);
  writeWav(RAW, buf);
  const lu = loudness(ffmpeg, RAW);
  return { lift: +lift.toFixed(2), buf, peak: pk, lufs: lu.lufs };
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
      const p2 = pass(mid); tries++;
      if (p2.peak.reduction <= MAX_REDUCTION) { lo = mid; best = p2; } else hi = mid;
    }
  }
} else if (wantLift < -0.05) { best = pass(wantLift); tries++; }
writeWav(WAV, best.buf);
const after = loudness(ffmpeg, WAV);
const peak = best.peak;
fs.rmSync(RAW, { force: true });

/* ---------- the beats, printed ---------- */
console.log('\n  the beats');
const beats = [
  [0, 'he is on the frame, fists up, boots down. no fade and no arrival'],
  ...Array.from({ length: SWINGS }, (_, i) => [
    i * BEAT,
    'swing ' + (i + 1) + ' of ' + SWINGS + ', ' + (dirOf(i) < 0 ? 'left ' : 'right')
    + ', turn to ' + valOf(i).toFixed(2)
    + (isBack(i) ? ' — all the way, and the eyes go off the edge' : ''),
  ]),
  ...BACK.map((i, k) => [
    i * BEAT + SPIN.in * BEAT,
    'the back of his head, spin ' + (k + 1) + ': a white circle, no eyes, '
    + (SPIN.hold * BEAT).toFixed(2) + 's, under a shake and a stutter',
  ]),
  [DANCE, 'the camera snaps in over ' + ZOOM.for.toFixed(2) + 's to ' + ZOOM.to
    + 'x. he keeps swinging'],
  ...END.pre.map((w, i) => [w.t, 'stutter ' + (i + 1) + ' of two, into the fault']),
  [END.at, 'the fault. he and his boots are cut and the wordmark is born on that frame'],
  [SECONDS, 'end, after ' + (SECONDS - END.wmIn - END.wmFor).toFixed(2) + 's of the end card'],
].sort((a, b) => a[0] - b[0]);
for (const [t, what] of beats) console.log('    ' + t.toFixed(2).padStart(5) + 's  ' + what);

console.log('\n  the sound');
console.log(describeMix(sfxReport, {
  'the voice': 'there is none, and there is no music and no bed either. the film is '
    + 'silent apart from its five glitches',
  'the lift': 'off the bus at ' + (zero.lufs == null ? '?' : zero.lufs) + ' LUFS, ' + TARGET_LUFS
    + ' wanted ' + wantLift.toFixed(2) + ' dB, took ' + best.lift.toFixed(2) + ' in ' + tries + ' pass'
    + (tries === 1 ? '' : 'es'),
  'the bus': (after.lufs == null ? '?' : after.lufs) + ' LUFS, peak ' + peak.peak
    + ' dBFS, limiter took ' + (peak.reduction > 0.01 ? peak.reduction.toFixed(2) + ' dB' : 'nothing'),
}));

/* ---------- the fast things, measured before anything renders ----------
   three of them, and all three are walked at sixty in css px on the frame, which
   is the unit the shutter argument is had in. the eyes and the fists are grid
   units on the head, so they are converted by the head's own unit; the zoom is
   measured at the furthest thing from its own origin, which is a fist. */
const fastest = (fn, a, b, ok = () => true) => {
  let d = 0, at = a;
  for (let f = Math.floor(a * 60); f <= Math.ceil(b * 60); f++) {
    const t0 = f / 60, t1 = (f + 1) / 60;
    if (!ok(t0) || !ok(t1)) continue;
    const s = Math.abs(fn(t1) - fn(t0));
    if (s > d) { d = s; at = t0; }
  }
  return { d: +d.toFixed(2), at: +at.toFixed(3) };
};
const swayStep = fastest(t => SW.sway * swingAt(t) / zoomAt(t, false), 0, DANCE);
/* **the blank beat is skipped and it has to be.** the spin swaps the sign of the
   eyes' own offset on one frame, which is 96 grid units and would be the fastest
   thing in the film by a factor of five — and it happens while both eyes are off
   the silhouette, so what it moves is nothing anybody can see. what is measured
   here is the travel a viewer actually watches: the slide out and the slide back
   in, both of which are on the frame. */
const eyeStep = fastest(
  t => (swingAt(t) * (TURN.shift + TURN.wrap) + spinAt(t).x) * plan.unit,
  0, DANCE, t => !spinAt(t).back);
/* the camera's own worst point is the far corner of the widest thing on the
   frame, which is a fist: `HANDS.box` is what one drawing's frame measures on
   the grid, so its own reach off the head's centre is the radius this is walked
   at. the zoom carries it out and the pan carries it down, so what is measured
   is the two together rather than either on its own. */
const FIST_REACH = +((HAND_POSES.cheer.at.x + HANDS.box / 2 - GRID / 2) * plan.unit).toFixed(2);
const FIST_LIFT = +((GRID / 2 - HAND_POSES.cheer.at.y + HANDS.box / 2) * plan.unit).toFixed(2);
const camAt = t => [FIST_REACH * zoomAt(t, false), panAt(t, false) - FIST_LIFT * zoomAt(t, false)];
const zoomStep = (() => {
  let d = 0, at = 0;
  for (let f = Math.floor((ZOOM.at - 0.1) * 60); f <= Math.ceil((ZOOM.at + ZOOM.for + 0.1) * 60); f++) {
    const a = camAt(f / 60), b = camAt((f + 1) / 60);
    const s = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (s > d) { d = s; at = f / 60; }
  }
  return { d: +d.toFixed(2), at: +at.toFixed(3) };
})();
console.log('\n  the fast things, at sixty');
console.log('    the body sways at most ' + swayStep.d + ' css px a frame at ' + swayStep.at + 's');
console.log('    an eye travels at most ' + eyeStep.d + ' css px a frame at ' + eyeStep.at
  + 's, which is the spin');
console.log('    the camera carries a fist ' + zoomStep.d + ' css px on its fastest frame at '
  + zoomStep.at + 's — the zoom and the ' + PAN + 'px pan together, measured '
  + Math.hypot(FIST_REACH, FIST_LIFT).toFixed(0) + 'css px off the origin (ceiling ' + STEP_CEIL + ')');

if (CLOCK_ONLY) process.exit(0);

const state = ONLY_ENCODE
  ? JSON.parse(fs.readFileSync(path.join(OUT, 'post23.json'), 'utf8'))
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
if (!p.audio) fail.push('no audio track');

/* ---------- the page's colours are the site's, and there are no others ----- */
{
  const css = sceneHtml(plan);
  const mine = css.slice(css.indexOf("this clip's own css starts here"));
  /* **no colour but the two the theme has.** the brief says the normal ones and
     nothing else, so the accent — either green — may not appear at all, and this
     is asserted on the page rather than remembered. the slice starts after
     index.html's own token blocks, so the accent being declared there is not
     mistaken for this clip using it. */
  for (const [which, block] of [['dark', brandTokens().dark], ['light', brandTokens().light]]) {
    const acc = /--accent:\s*#([0-9a-f]{6})/i.exec(block);
    if (acc && new RegExp(acc[1], 'i').test(mine)) {
      fail.push('the ' + which + ' accent is painted somewhere in this clip, and there is no colour in it');
    }
  }
  const red = /--red:\s*#([0-9a-f]{6})/i.exec(brandTokens().dark);
  if (red && new RegExp(red[1], 'i').test(mine)) fail.push('the site red is painted somewhere in this clip');
  /* the vignette is post20's and post22's, not a tint of this clip's own. */
  const vig = mine.match(/rgba\(255,255,255,\.(\d+)\) 0%, rgba\(255,255,255,\.(\d+)\) 46%/);
  if (!vig || vig[1] !== '030' || vig[2] !== '010') fail.push('the vignette is not post20\'s .030 / .010');
  /* nothing fringes but the wordmark. */
  const gl = [...mine.matchAll(/\.stage\[data-gl="1"\]\s*([^\{]+)\{/g)].map(x => x[1].trim());
  if (gl.join(',') !== '.wm') {
    fail.push('the rgb split reaches ' + (gl.join(', ') || 'nothing') + ', and it may only reach the wordmark');
  }
  /* one request, one family. there is no caption and no pill in this film, so
     the second face every clip since post18 asks for is not asked for here. */
  const links = css.match(/<link rel="stylesheet"[^>]*>/g) || [];
  if (links.length !== 1) fail.push('the page makes ' + links.length + ' stylesheet requests, and the budget is one');
  const fams = [...(links[0] || '').matchAll(/family=([A-Za-z+]+)/g)].map(m => m[1].replace(/\+/g, ' '));
  if (fams.join(',') !== 'Michroma') fail.push('the page asks for ' + fams.join(', ') + ', and this clip sets only the wordmark');
  /* the boots are the plate's own white on the page's own black and nothing
     else: no second fill, no accent, no stroke that is not the background. */
  const boot = mine.slice(mine.indexOf('.boot path{'), mine.indexOf('#boots-side{'));
  if (!/fill:#f4f7f5/.test(boot) || !/stroke:var\(--bg\)/.test(boot)) {
    fail.push('the boots are not the plate\'s white outlined in the page: ' + boot.trim());
  }
}

/* ---------- him ---------- */
if (state.built.mas.headPx < HEAD_PX.min || state.built.mas.headPx > HEAD_PX.max) {
  fail.push('the head rendered at ' + state.built.mas.headPx + 'px, window is '
    + HEAD_PX.min + ' to ' + HEAD_PX.max);
}
/* **the safe area is judged over the dance, not over the zoom.** a face that
   fills the frame is inside every margin by construction and it is what the
   brief asks for; the six seconds he is a whole mascot are held to the floor. */
if (state.head.near < floor - 0.5) {
  fail.push('during the dance the head comes within ' + Math.round(state.head.near)
    + 'px of a border at ' + state.head.t + 's, floor is ' + floor);
}
{
  const got = plan.marks.map(m => m.state);
  if (got.join(',') !== 'neutral') fail.push('the states are ' + got.join(', ') + ', wanted one neutral');
  if (plan.hand) fail.push('the plan draws the old single hand, and this clip uses the glove pair');
  if (!plan.hands) fail.push('the plan draws no hands, and the brief asks for the fists');
  const poses = plan.marks.filter(m => m.hands).map(m => m.hands.pose);
  if (poses.join(',') !== 'cheer') fail.push('the hands poses are ' + (poses.join(', ') || 'none') + ', wanted one cheer');
  /* ---------- one unmirrored pose in both hands ----------
     `cheer` carries the file's own pair, which `handShape` reads as "each hand
     gets its own drawing and neither is flipped". that is the brief's "one
     unmirrored pose for both hands" and it is two assertions, because the day
     somebody gives it a bare string both halves stop being true at once. */
  if (!Array.isArray(HAND_POSES.cheer.shape)) fail.push('`cheer` carries a bare shape, so one hand would be a mirror');
  for (const k of [0, 1]) {
    if (handShape('cheer', k).mir !== 1) fail.push('hand ' + k + ' draws the cheer flipped');
  }
  if (handShape('cheer', 0).shape === handShape('cheer', 1).shape) {
    fail.push('both hands draw the same fist, and the file draws two');
  }
  const acting = plan.marks[0].hands.acting;
  if (acting.join(',') !== '0,1') fail.push('the cheer is acting on hand ' + acting.join(', ') + ', and it is a pair');
  if (plan.marks[0].hands.leaving < END.at - 1e-6) {
    fail.push('the fists start going home at ' + plan.marks[0].hands.leaving + ', before the fault at ' + END.at);
  }
}
for (const st of rep60.states) {
  if (st.entryFrames == null) fail.push(st.state + ' never reached its own mark');
  if (!(st.overshoot > 1)) fail.push(st.state + ' arrives with no overshoot');
}
if (rep60.poses.length !== 1 || rep60.poses[0].pose !== 'cheer') {
  fail.push('the report names ' + rep60.poses.map(p => p.pose).join(', ') + ' rather than one cheer');
}
if (rep60.outside.units > 0) {
  fail.push('feature ink lands ' + rep60.outside.units.toFixed(2) + ' units outside the head silhouette');
}
if (rep60.frozenFrames) fail.push(rep60.frozenFrames + ' frames where the face is not moving at all');

/* ---------- the swing ---------- */
{
  /* eight of them, three quarters of a second each, alternating, and only two
     of them go all the way. every one of those is arithmetic on the table at the
     top of the file, and it is asserted rather than assumed. */
  if (Math.abs(DANCE - 6.0) > 1e-9) fail.push('the dance is ' + DANCE + 's, and the brief asks for 6.00');
  if (SWINGS !== 8) fail.push('there are ' + SWINGS + ' swings, and the brief asks for eight');
  const peaks = [];
  for (let i = 0; i < SWINGS; i++) {
    /* the peak of a swing is the end of its own travel, before the settle. */
    peaks.push(+swingAt(i * BEAT + BEAT * SW.travel).toFixed(3));
  }
  console.log('  the swings peak at ' + peaks.join(', '));
  for (let i = 0; i < SWINGS; i++) {
    if (Math.sign(peaks[i]) !== dirOf(i)) fail.push('swing ' + (i + 1) + ' goes the wrong way');
    const want = isBack(i) ? 1 : SW.turn;
    if (Math.abs(Math.abs(peaks[i]) - want) > 0.02) {
      fail.push('swing ' + (i + 1) + ' peaks at ' + peaks[i] + ' and wanted ' + (dirOf(i) * want));
    }
  }
  if (BACK_SWINGS.join(',') !== '3,6') fail.push('the spins are on swings ' + BACK_SWINGS.join(' and '));
  /* and the beat never has a step in it: a swing hands over to the next one at
     exactly the value it ended on, so nothing jumps on a beat boundary. */
  let step = 0, stepAt = 0;
  for (let f = 1; f < Math.round(SECONDS * 60); f++) {
    const d = Math.abs(swingAt(f / 60) - swingAt((f - 1) / 60));
    if (d > step) { step = d; stepAt = +(f / 60).toFixed(3); }
  }
  console.log('  the swing steps at most ' + step.toFixed(4) + ' of the turn on one frame at 60, at '
    + stepAt + 's');
  if (swayStep.d > STEP_CEIL) fail.push('the sway moves ' + swayStep.d + ' css px on one frame at 60');
  if (eyeStep.d > STEP_CEIL) fail.push('an eye moves ' + eyeStep.d + ' css px on one frame at 60');
  if (zoomStep.d > STEP_CEIL) fail.push('the camera moves a fist ' + zoomStep.d + ' css px on one frame at 60');
}

/* ---------- the back of the head ----------
   the one thing in this film that is not on a frame anybody has drawn before, so
   it is measured rather than watched: on the back beat both eyes are entirely
   outside the plate's own silhouette at their own height, and on every other
   frame of the film both are entirely inside it. the clip path is what turns the
   first of those into a blank face, and it is the module's own. */
{
  const R = HEAD.plate.s / 2, CX = HEAD.plate.x + R, CY = HEAD.plate.y + R;
  const halfW = HEAD.eye.w / 2;
  /* how far an eye's nearest edge is outside the plate at its own height:
     negative inside, positive out. */
  const outBy = (e, k) => {
    const y = HEAD.eye.cy + e.y;
    const dy = Math.abs(y - CY);
    const half = dy >= R ? 0 : Math.sqrt(R * R - dy * dy);
    return Math.abs(EYE_CX[k] + e.x - CX) - halfW * Math.abs(e.sx) - half;
  };
  let blankFrames = 0, worstBlank = Infinity, leak = null, worstIn = -Infinity, worstInAt = 0;
  for (let f = 0; f < Math.round(END.at * FPS); f++) {
    const t = f / FPS;
    const eyes = compose(plan, t).eyes;
    const out = eyes.map((e, k) => outBy(e, k));
    const blank = out.every(v => v > 0);
    const flag = spinAt(t).back;
    if (blank) { blankFrames++; worstBlank = Math.min(worstBlank, Math.min(...out)); }
    if (flag && !blank) leak = leak || { t: +t.toFixed(3), out: out.map(v => +v.toFixed(2)) };
    /* **off the two spins entirely**, not merely off the blank beat. an eye
       leaving the face is what a spin is, and the frames either side of the
       blank one are the slide out and the slide back in — both of which have an
       eye over the edge and both of which are the point. what this asserts is
       that it never happens on the six swings that are not spins. */
    if (!isBack(swingOf(t))) {
      const worst = Math.max(...out);
      if (worst > worstIn) { worstIn = worst; worstInAt = +t.toFixed(3); }
    }
  }
  console.log('  the back of his head: ' + blankFrames + ' frames with nothing on his face, the '
    + 'shallower eye ' + (worstBlank === Infinity ? 'n/a' : worstBlank.toFixed(2))
    + ' grid units clear of the silhouette');
  console.log('    on the six swings that are not spins the deepest an eye gets is '
    + worstIn.toFixed(2) + ' units from the edge at ' + worstInAt + 's, which is inside');
  if (leak) fail.push('an eye is still on his face at ' + leak.t + 's, inside the back beat: ' + leak.out.join(', '));
  if (!blankFrames) fail.push('there is never a frame with nothing on his face');
  if (worstIn > 0) fail.push('an eye leaves the silhouette at ' + worstInAt + 's, outside a spin');
  /* the two spins go opposite ways, and the eyes come back on the other side —
     which is the difference between a spin and a look away. */
  for (const [k, w] of SPIN_WIN.entries()) {
    const a = spinAt(w.t0 - 1 / FPS).x, b = spinAt(w.t1).x;
    if (Math.sign(a) === Math.sign(b) || !a || !b) {
      fail.push('spin ' + (k + 1) + ' brings the eyes back on the side they left');
    }
    if (Math.sign(a) !== w.dir) fail.push('spin ' + (k + 1) + ' takes the eyes off the wrong edge');
    console.log('    spin ' + (k + 1) + ': ' + w.frames + ' blank frame(s) from ' + w.t0.toFixed(3)
      + 's, eyes off the ' + (w.dir > 0 ? 'right' : 'left') + ' and back from the other side');
  }
}

/* ---------- the boots ---------- */
{
  const fr = state.bootsFront, sd = state.bootsSide;
  if (fr.which !== 'boots-front') fail.push('the front swings are drawn with ' + fr.which);
  if (sd.which !== 'boots-side') fail.push('a full turn is drawn with ' + sd.which);
  for (const [when, r] of [['on a front swing', fr], ['turned all the way', sd]]) {
    if (r.bothOn) fail.push('both pairs of boots are on the frame ' + when);
    for (const k of ['left', 'right', 'bottom']) {
      if (r[k] < floor - 0.5) fail.push('the boots come within ' + Math.round(r[k]) + 'px of the ' + k + ' border ' + when);
    }
  }
  /* exactly one pair on every frame of the film, decided on the output frame. */
  let flips = 0, last = null;
  for (let f = 0; f < Math.round(END.at * FPS); f++) {
    const s = frameAt(f / FPS, f).side;
    if (last !== null && s !== last) flips++;
    last = s;
  }
  console.log('  the boots swap ' + flips + ' times: two in and two out of the two full turns');
  if (flips !== BACK.length * 2) fail.push('the boots swap ' + flips + ' times, and two turns is four');
  /* and they are under him rather than beside him: the ink's own top is below
     the plate's own bottom, by the gap this file asked for. */
  const headBottom = MASCOT_Y + HALF_HEAD;
  const inkTop = BOOTS.top + BOOTS.inkTop;
  console.log('  the boots sit ' + (inkTop - headBottom).toFixed(1) + ' css px under his chin, '
    + BOOTS.w + ' css px of ink across against a plate of ' + (HALF_HEAD * 2).toFixed(1));
  if (Math.abs((inkTop - headBottom) - BOOTS.gap) > 0.5) fail.push('the boots are not BOOTS.gap under him');
  if (BOOTS.w > HALF_HEAD * 2) fail.push('the boots are wider than his head');
  /* the bounce is tiny and it is on the beat: the same curve the body squashes
     on, so the two cannot land on different frames. */
  let bounce = 0;
  for (let f = 0; f < Math.round(DANCE * FPS); f++) bounce = Math.min(bounce, frameAt(f / FPS, f).boots.dy);
  console.log('  the boots bounce ' + (-bounce).toFixed(2) + ' css px at most');
  if (-bounce > BOOTS.bounce + 0.01) fail.push('the boots bounce ' + (-bounce) + ' css px');
  if (-bounce < 1) fail.push('the boots never leave the floor at all');
}

/* ---------- the zoom ---------- */
{
  const frames = Math.round(ZOOM.for * 60);
  console.log('  the snap is ' + frames + ' frames at sixty, ' + ZOOM.to + 'x with a ' + PAN
    + 'px pan onto his face, and it ends '
    + (state.headZoom.w / (VW * DSF) * 100).toFixed(0) + '% of the frame across');
  if (frames < 6 || frames > 11) fail.push('the snap is ' + frames + ' frames at sixty, and a snap is six to ten');
  if (zoomAt(ZOOM.at - 0.01, false) !== 1) fail.push('the camera has moved before the dance is over');
  if (Math.abs(zoomAt(ZOOM.at + ZOOM.for, false) - ZOOM.to) > 1e-4) fail.push('the snap does not arrive at its own scale');
  if (state.headZoom.w / (VW * DSF) < 0.60) {
    fail.push('the face is ' + (state.headZoom.w / (VW * DSF) * 100).toFixed(0)
      + '% of the frame at the top of the zoom, and the brief says it fills it');
  }
  /* and the end card is not filmed through it. */
  const cutF = Math.round(END.at * FPS);
  if (frameAt(cutF / FPS, cutF).zoom !== 1 || frameAt(cutF / FPS, cutF).pan !== 0) {
    fail.push('the camera is still in on the frame the wordmark arrives on');
  }
  if (panAt(ZOOM.at - 0.01, false) !== 0) fail.push('the camera has panned before the dance is over');
  if (Math.abs(panAt(ZOOM.at + ZOOM.for, false) - PAN) > 1e-3) fail.push('the pan does not arrive on the same frame the zoom does');
  if (frameAt((cutF - 1) / FPS, cutF - 1).zoom < ZOOM.to - 1e-4) fail.push('the camera is not still in on the frame before the fault');
  /* he keeps swinging under it, which the brief asks for by name. */
  const during = [];
  for (let f = Math.round((ZOOM.at + ZOOM.for) * FPS); f < Math.round(END.at * FPS); f++) during.push(swingAt(f / FPS));
  const range = Math.max(...during) - Math.min(...during);
  console.log('  under the zoom he still swings across ' + range.toFixed(2) + ' of the turn');
  if (range < SW.turn) fail.push('he stops swinging under the zoom: ' + range.toFixed(2) + ' of the turn');
  /* one blink in there, which is the brief's own word. */
  const inZoom = plan.idle.blinks.filter(b => b.t >= ZOOM.at && b.t < END.at);
  const inDance = plan.idle.blinks.filter(b => b.t < ZOOM.at);
  console.log('  blinks: ' + inDance.length + ' through the dance, ' + inZoom.length
    + ' under the zoom, at ' + (inZoom.map(b => b.t.toFixed(2)).join(', ') || 'none'));
  if (inZoom.length !== 1) fail.push('there are ' + inZoom.length + ' blinks under the zoom, and the brief asks for one — walk SEED');
  if (!inDance.length) fail.push('he never blinks through the dance — walk SEED');
}

/* ---------- the two cuts ---------- */
{
  const at = f => frameAt(f / FPS, f);
  const cutF = Math.round(END.at * FPS);
  if (at(0).mo !== 1) fail.push('he is not on frame zero, and a clip whose first frame is empty has no thumbnail');
  if (at(0).boots.o !== 1) fail.push('the boots are not on frame zero');
  if (at(cutF - 1).mo !== 1) fail.push('he is already gone before the fault');
  if (at(cutF).mo !== 0) fail.push('he is still on the frame the wordmark arrives on');
  if (at(cutF).boots.o !== 0) fail.push('the boots are still on the frame the wordmark arrives on');
  if (!(at(cutF).wm.o > 0)) fail.push('the wordmark is not born on the fault frame');
}

/* ---------- the wordmark ---------- */
{
  const w = state.wm;
  if (!/Michroma/.test(w.font)) fail.push('the wordmark is not set in michroma: ' + w.font);
  if (w.capPx < WM.minCapPx) fail.push('the wordmark caps measure ' + w.capPx + ' device px, floor is ' + WM.minCapPx);
  for (const k of ['left', 'top', 'right', 'bottom']) {
    if (w[k] < floor - 0.5) fail.push('the wordmark comes within ' + Math.round(w[k]) + 'px of the ' + k + ' border');
  }
  if (Math.abs(w.widestPx - WM.w * DSF) > 6) fail.push('the wordmark fitted to ' + w.widestPx + ' device px, wanted ' + WM.w * DSF);
  if (WM.lines.length !== 3) fail.push('the end card is ' + WM.lines.length + ' lines, and it is stacked three');
  if (WM.lines.join(' ').toLowerCase().includes('.com')) fail.push('the end card carries an address');
  const hold = SECONDS - (END.wmIn + END.wmFor);
  if (hold < 0.80) fail.push('the wordmark holds ' + hold.toFixed(2) + 's, which is not long enough to be read');
}

/* ---------- the fault, and the two spins ---------- */
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
  if (GL_WINDOWS.length !== 5) fail.push('there are ' + GL_WINDOWS.length + ' glitch windows, wanted five');
  if (GL_WINDOWS.map(w => w.kind).join(',') !== 'stutter,stutter,stutter,stutter,hit') {
    fail.push('the glitch windows are ' + GL_WINDOWS.map(w => w.kind).join(', '));
  }
  for (let i = 0; i < GL_WINDOWS.length; i++) {
    if (!here.per[i]) fail.push('glitch window ' + i + ' (' + GL_WINDOWS[i].kind + ') fired on no frames at ' + FPS + 'fps');
    if (!at60.per[i]) fail.push('glitch window ' + i + ' (' + GL_WINDOWS[i].kind + ') fired on no frames at 60fps');
  }
  for (let i = 1; i < GL_WINDOWS.length; i++) {
    if (GL_WINDOWS[i].t0 < GL_WINDOWS[i - 1].t1 - 1e-9) fail.push('glitch windows ' + (i - 1) + ' and ' + i + ' overlap');
  }
  if (here.flashes !== 1) fail.push(here.flashes + ' white frames, and there may be exactly one');
  const cleanFrom = Math.round((END.at + END.hard + END.tail + END.clean) * FPS);
  if (here.lastOn >= cleanFrom) fail.push('the fault is still firing at frame ' + here.lastOn);
  /* the two spin stutters land on the frame the face goes blank and nowhere
     else, which is what makes a shake read as the cause rather than as weather. */
  for (const [k, t] of SPIN_HIT.entries()) {
    const f = Math.round(t * FPS);
    if (!(glitchAt(f).heat > 0)) fail.push('spin ' + (k + 1) + ' has no shake on the frame his face goes blank');
    if (!spinAt(f / FPS).back) fail.push('spin ' + (k + 1) + '\'s stutter is not on a blank frame');
  }
  const endFrom = Math.round(END.pre[0].t * 60);
  let endOn = 0;
  for (let f = endFrom; f < at60.N; f++) {
    const g = glitchAt(f, 60, GL_WINDOWS_60);
    if (g.heat > 0 || g.flash > 0) endOn++;
  }
  const endFrames = at60.N - endFrom;
  console.log('    against the ending it lives in, at sixty: ' + endOn + ' of ' + endFrames
    + ' frames (' + (endOn / endFrames * 100).toFixed(1) + '%, ceiling 30%)');
  if (endOn / endFrames > 0.30) fail.push('the ending glitches on ' + (endOn / endFrames * 100).toFixed(1) + '% of its own frames');
  for (let i = 1; i < END.pre.length; i++) {
    if (!(END.pre[i].force > END.pre[i - 1].force)) fail.push('the fault\'s stutter ' + (i + 1) + ' is not louder than the one before it');
  }
}

/* ---------- the sound is five glitches and nothing else ---------- */
{
  for (const r of sfxReport) {
    if (r.cut) fail.push('the ' + r.kind + ' cue at ' + r.t + 's was cut off by the end of the clip');
    if (r.t < 0 || r.t > SECONDS) fail.push('the ' + r.kind + ' cue at ' + r.t + 's is outside the clip');
  }
  const kinds = [...new Set(sfxReport.map(r => r.kind))];
  if (kinds.join(',') !== 'glitch') fail.push('the bus carries ' + kinds.join(', ') + ', and this film has only glitches');
  if (sfxReport.length !== 5) fail.push('there are ' + sfxReport.length + ' cues on the bus, wanted five');
  console.log('  the bus: ' + sfxReport.length + ' glitches, the first at '
    + Math.min(...sfxReport.map(r => r.t)).toFixed(2) + 's. no voice, no music, no bed');
}

/* ---------- the mix, on the finished file rather than on the intent -------- */
if (lu && lu.ok) {
  if (lu.truePeak > PEAK_CEILING) fail.push('the true peak is ' + lu.truePeak + ' dBFS, over the ' + PEAK_CEILING + ' ceiling');
  if (lu.lufs > TARGET_LUFS + 0.5) fail.push('the file measures ' + lu.lufs + ' LUFS, over the ' + TARGET_LUFS + ' target');
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
console.log('    the beats run to ' + END.at.toFixed(2) + 's and the end card takes it to '
  + SECONDS.toFixed(2) + '. the brief said "about eight seconds" and the beat list said the '
  + 'card comes after 8.0, so the beat list won');
console.log('    the turn is composed rather than planned, out of the module\'s own TURN table.'
  + ' a mark cannot carry eight turns 0.75s apart: neutral needs 1.06s of room');
console.log('    the eyes are pushed past the module\'s own clamp on the two spins, and the'
  + ' module\'s own clip path is what takes them off the face');
console.log('    the boots are this file\'s layer, not the module\'s. they never sway, they only'
  + ' bounce, and they are swapped on the frame rather than crossfaded');
console.log('    the safe area is judged over the dance only. a face that fills the frame is'
  + ' inside every margin and that is the brief');

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
