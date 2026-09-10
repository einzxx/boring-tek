/* the boring tek — post26. the client meeting.

   dark only, 1080x1920. somebody types a panic into a chat box, the mascot asks
   for one thing, and a briefing types itself in under him.

     0.0  the chat box in the middle of a black frame. the line types itself in,
          letter by letter, **cut to the narrator's own word timings**. the
          camera pushes in slowly the whole time it types.
     ~3.4 he pops in above the box under a deep white glow, `delighted`, and the
          pill climbs off his crown with `send the company name` in it. **the
          mascot's own voice reads that line** — a second elevenlabs clone, not
          the narrator in a different mood. see lib/voice.mjs.
     ~5.6 the box clears and types `nordic parts as`.
     ~6.3 he slides up to the top third and shrinks to 60 per cent while the box
          fades out under him.
     ~6.8 the briefing types in fast, one line at a time, first words bright and
          the rest muted, a key tick a word. the camera pushes in on the line
          being typed and pulls back between lines.
     ~10.8 the caption pops: `ten seconds of homework`. he blinks once.
     ~11.7 post12's fault takes the lot and puts the wordmark up.

     node post26.mjs                     1080x1920, 60fps, shutter closed
     DEMO_FPS=12 node post26.mjs         the fast preview pass
     node post26.mjs --voice             the two reads and the clock, no browser
     node post26.mjs --blur=6            60fps with the shutter open
     node post26.mjs --keep-frames       leave the jpegs on disk
     node post26.mjs --encode-only       re-encode from kept frames

   one output, one path, overwritten every run:

     demo/out/post26-dark-1080x1920.mp4

   ---------- what is borrowed and from where ----------

   **the chat box is post22's**, at post22's numbers wherever they still hold:
   the same rounded plate on `#12161a` with a `--bub` hairline, the same plus and
   the same filled send disc, the same breathing focus ring, the same caret on
   its own clock, and the same "fit the whole line once so the type never changes
   size while it types". what changed is the width and the height, and both for a
   reason that is written down where they are declared.

   **the end card is post22's, which is post12's**: two stutters, one hard fault,
   the wordmark born on the frame the fault lands on, and the split reaching the
   wordmark and nothing else.

   **the read is post20's spine**: the picture is cut to the voice rather than
   beside it. every character of the question is placed inside its own spoken
   word's window, so the line types unevenly the way a person reads it.

   ---------- two voices, and why that needed a library change ----------

   the narrator reads what is typed into the box. **the mascot reads what is in
   the pill**, and he is a second elevenlabs voice id rather than the narrator
   held at a different stability, because he is a different person. that is the
   same argument `uk` and `aside` are kept off elevenlabs on, answered the other
   way: the objection was never the provider, it was one throat playing two
   people. `ELEVENLABS_VOICE_ID_MASCOT` in demo/.env is the second clone and
   `lib/voice.mjs`'s `mascot` slot is what asks for it.

   ---------- what this clip does not have ----------

   **no hands.** `hands` is off in the plan and there is a guard on it.
   **no state but calm and happy.** `neutral` and `delighted`, and a guard.
   **no drawn pictograms.** the briefing is type and nothing else.
   **no colour that is not already the site's.** `--fg`, `--muted`, `--bub` and
   `--bg` out of index.html's own two blocks, and a guard that the accent, the
   red and the amber appear nowhere in the rendered css.
   **no subtitles.** the typed text is the text, which is the brief.

   ---------- the camera ----------

   one scale and one origin on `.stage`, evaluated every frame off a short list
   of keys, the same way every other channel in this file is. **it never goes
   below 1.0** — post's oldest framing rule, because the vignette is fixed and
   under 1.0 its box floats in the margin — and it never goes above `CAM.ceil`,
   which is derived rather than chosen: past it the box's own left edge crosses
   the platform's safe border. the safe area is therefore checked **through the
   camera** on every frame rather than in page space, which is the one thing a
   clip that zooms has to do that a clip that does not never had to.

   ---------- the shutter ----------

   post10's rule. with `--blur` every output frame is captured `SUB` times inside
   its own sixtieth and averaged. the fastest thing in this cut is the pop in and
   it is printed on every run against `STEP_CEIL`. */

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
  STAGE, SAFE, HEAD, GRID, BUBBLE, STATES, HEAD_PX,
} from './lib/mascot.mjs';
import { brandTokens } from './lib/captions.mjs';
import { speak, VOICE_OUT, elevenIdOf } from './lib/voice.mjs';
import {
  SR, renderSfx, decode, mixdown, applyGain, limit, writeWav, loudness,
  voiceEnvelope, describeMix, dbfs,
} from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post26');
const SUBS = path.join(OUT, 'subframes-post26');
const VERIFY = path.join(OUT, 'verify-post26');

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
   post12's line: the middle of the **safe band**, not of the frame. the
   platforms take 180 device px off the top and 220 off the bottom, so the middle
   of what a viewer sees is ten css px above the middle of the file. the box sits
   on it and the wordmark replaces everything on it. */
const CENTRE_Y = (SAFE_CSS.top + (VH - SAFE_CSS.bottom)) / 2;

/* ---------- the copy ----------
   three pieces of type and one pill. the question and the pill are both spoken,
   by two different people, and both are guarded against their own read. */
const COPY_Q = 'i am meeting a client in an hour and know nothing about them.';
const COPY_A = 'nordic parts as';
const BUB_TEXT = 'company name';
const CAPTION = 'ten seconds of homework';

/* ---------- the pill is two words, and it was measured down to two ----------
   the brief said `send me the company name`. that is five words and the module
   refuses more than four outright, so the first cut asked for `send the company
   name` — and that measured 377.9 css px of cluster against 400 css px of legal
   width, with the run climbing off the crown taking 4 of it, which is a pill
   that cannot clear the platform's borders **wherever his head stands**.

   **and it cannot be shrunk out of.** the pill's face is a flat 26px: the head
   at 148, 132 and 120 all measured the same 377.9, because `size` scales the
   dots and the run and not the type. the cap came back 38 device px every time.
   so the head size is not a lever here and the word count is the only one.

   measured, all at 148, as cluster width against where his centre may then
   stand for everything to clear:

     send the company name   377.9   nowhere
     the company name        312.0   139..162, which is a head in the left third
     send the name           259.9   139..214
     company name            264.6   139..209

   `company name` is the one that keeps the noun the whole exchange turns on and
   still lets him stand near the middle, which is what the brief asks of the
   picture. it is also simply the brand voice: the shortest thing that says the
   thing. **the mascot speaks exactly what the pill says** and there is a guard
   on it. */

/* ---------- the briefing ----------
   six lines, typed one after another. `bright` is the head of the line and it is
   set at `--fg` and weight 800; `rest` is the body at `--muted` and 500. the
   split is written here rather than derived, because which words carry a line is
   a reading of it and not a word count.

   the first line is the company and the whole of it is bright: it is a name, and
   a name with a muted tail is a name somebody trailed off in the middle of. */
const REPORT = [
  { bright: 'NORDIC PARTS AS', rest: '' },
  { bright: 'spare parts', rest: ' for fishing boats, 40 people' },
  { bright: 'the boss', rest: ' posts about ai every monday, he likes it' },
  { bright: 'lost their main supplier', rest: ' in march' },
  { bright: 'competitor raised prices', rest: ' last week' },
  { bright: 'talk about,', rest: ' faster delivery, that is their pain' },
];

/* ---------- the reads ----------
   two lines, two people, two elevenlabs voice ids.

   **both are sped up and that is a decision rather than a default.** the
   narrator's line at the voice's own rate is 3.44s of words, and the brief asks
   for the whole typing beat to be over by 3.0. `speed` is the only knob that
   keeps every word the brief wrote and still closes a gap that size — the other
   two answers are cutting the copy, which is not ours to do, and letting the
   film run a second and a half long, which is the drift table below. at 1.14 the
   line is 2.88s of words and it reads as somebody typing in a hurry, which is
   what the line says. the mascot takes the same number for the same reason. */
const NARRATOR = 'calm';
const MASCOT_V = 'mascot';
const SPEED = 1.14;
const LINES = [
  { key: 'q', voice: NARRATOR, text: COPY_Q },
  { key: 'bub', voice: MASCOT_V, text: BUB_TEXT + '.' },
];
/* the pill has no full stop and the read does, which is the only character
   between them. a synthesiser restarts its phrase after a stop, and the last
   word of a four word line with nothing after it comes back clipped without one.
   post22's `ai` / `AI` shape, and there is a guard that it is the only
   difference. */

/* ---------- the joins ----------
   the only numbers in the clock that are not measured off a read or off the
   module's own tables. everything else below is derived from them. */
const VOICE_AT = 0.25;      /* the narrator's first sound */
const CARET_AFTER = 0.16;   /* the caret blinks this long after the last word */
const POP_LEAD = 0.20;      /* he arrives this far after the question is finished */
const ANSWER_LEAD = 0.22;   /* the box starts the answer this far after he stops */
const ANSWER_FOR = 0.50;    /* and takes this long to type it */
const SHRINK_LEAD = 0.18;   /* he starts moving this far after the answer lands */
const MOVE_FOR = 0.46;      /* how long the move up and the shrink take */
const CAP_LEAD = 0.38;      /* the caption pops this far after the last line */
const CAP_FOR = 0.85;       /* and holds this long before the fault */
const SILENCE_DB = -42;     /* what counts as the edge of a take */
const PRE = 0.06, POST = 0.12;

/* what the brief asked for, so the run can print the drift rather than quietly
   absorbing it. post24's table. */
const ASKED = { pop: 3.0, answer: 4.5, report: 5.5, caption: 10.0, end: 11.0 };

/* ---------- him ----------
   148 puts the head at 277.5 device px, which is the top of `HEAD_PX`'s window
   and is where a head that is alone on a frame belongs. **at 60 per cent it is
   166 device px, under that window on purpose**: the second half of this film is
   a briefing with a small presenter over it, and the window is written for a
   mascot who is the subject. the guard checks the built head, which is the one
   the module drew. */
const SIZE = 148;
const SHRINK_TO = 0.60;
/* he pops in above the box, and then parks in the top third. both are the centre
   of his card in css px on the frame.

   **both are 20 css px lower than the first cut put them**, and the pill is
   why: the run climbs off his crown, and the first preview measured the pill's
   top at 150.5 device px. that clears a min-of-four floor of 140 and is well
   inside the platform's real top band of 180. so the guard below stopped taking
   the minimum and started holding each side to its own number, and then he and
   the box both had to come down. 292 leaves 33.6 css px between his lowest ink
   and the box's top edge; 195 keeps his top ink well down even at the camera's
   ceiling, which is what the through-the-camera guard checks. */
const MASCOT_CY = 292;
const TOP_CY = 195;
/* and the one place he is not centred. the pill climbs off his crown to the
   right and it is as wide as the copy needs it to be, so the head gives up
   exactly enough ground for the far end of the run to clear the safe border.
   80 is that ground, and it is a measured number rather than the probe's. the
   probe put the far edge of the band at 209 with the head centred, and a head
   at 200 rendered only 0.3 device px of margin on the right: the model is a
   shade optimistic about where the run starts once the head has moved under it.
   **the rendered clearance settles this, not the model.**

   **he takes it back on the way up.** the pill is gone by then, so the reason
   for the offset is gone with it, and a head parked 80 css left of centre over
   the rest of the film is an offset nobody can see the cause of. */
const LEFT_OF_CENTRE = 80;
/* the arrival. **he pops rather than fades**: a scale from nearly nothing,
   through a small overshoot, onto rest, over a quarter of a second. `delighted`
   plays its own two hops underneath it and this is the thing they hop out of. */
const POP = { for: 0.26, from: 0.30, over: 1.06, overAt: 0.72 };
/* and the deep white glow, which is the module's own two layers turned up rather
   than a fourth layer added. it is at its deepest on the frame he lands and is
   back to the module's own number by the time the pill pops, so what the glow
   marks is the arrival and not the sentence. */
const GLOW = { peak: 2.9, for: 0.55 };

/* ---------- the chat box ----------
   post22's box, twice re-measured for this clip and both numbers are load
   bearing.

   **360 wide rather than 384**, and the camera is why: the push in is a scale
   about the box's own centre, so a box that clears the platform's 140 device px
   border at rest can be pushed straight through it. 360 leaves 90 css px either
   side, and at the camera's ceiling of 1.11 the left edge lands exactly on the
   border — see `CAM.ceil`, which is derived from this number rather than from a
   taste.

   **200 tall rather than 190**, and the copy is why: this question is sixty
   characters against post22's thirty three, so the text box has to hold three
   lines of it at a size that is still type rather than fine print. */
const BOX = {
  w: 360, h: 200, r: 30, pad: 26, padTop: 24,
  textH: 96, size: 30, minCapPx: 26,
  plus: { r: 15, arm: 6.5 },
  send: { r: 17 },
};
/* the box has a centre of its own rather than the frame's: he sits above it
   and the pill sits above him, and that stack has to start low enough for the
   pill's top to clear 180 device px. the wordmark still lands on CENTRE_Y,
   which is the line the platforms actually centre. */
BOX.cy = 495;
BOX.x = +(VW / 2 - BOX.w / 2).toFixed(2);
BOX.y = +(BOX.cy - BOX.h / 2).toFixed(2);
BOX.rowY = BOX.h - BOX.pad - BOX.send.r;
BOX.plusX = BOX.pad + BOX.plus.r;
BOX.sendX = BOX.w - BOX.pad - BOX.send.r;
BOX.fadeFor = 0.30;
const CARET = { period: 1.06, on: 0.62 };

/* ---------- the briefing's own box ----------
   left at 90 for the same reason the chat box is 360 wide: at the camera's
   ceiling a block at 90 lands on the platform's left border and not inside it.
   the six lines sit on a fixed pitch so this file knows where every one of them
   is without asking the page, which is what the camera needs — it pushes in on
   the line being typed, and a focus point that had to be measured first would be
   a focus point that does not exist until the render is already running. */
const RPT = {
  x: 90, w: 360, y: 300, pitch: 70,
  size: 26, minSize: 15, minCapPx: 30,
  cps: 85,        /* characters a second. this is what "types in fast" is */
  minFor: 0.34,   /* and no line is quicker than this, however short it is */
  gap: 0.24,      /* clear air between one line finishing and the next starting */
};
const CARET_R = { period: 0.44, on: 0.58 };

/* ---------- the caption ----------
   one line, Manrope 800, on its own under the briefing. it pops the way the
   module's own pill pops: a scale from just under, through a small overshoot,
   onto rest. */
const CAP = { y: 786, size: 34, minCapPx: 40, for: 0.22, from: 0.86, over: 1.045 };

/* ---------- the camera ----------
   scale and origin, and nothing else: no pan and no roll. the origin is always
   the middle of the frame horizontally and the thing being looked at
   vertically.

   **`ceil` is derived.** the widest thing this film draws is the chat box at 360
   css px, centred, so its left edge is 90 from the frame and 180 from the
   origin. the platform's border is 70 css px in. a scale of `z` about the centre
   puts that edge at `270 - 180z`, so the largest legal `z` is `200 / 180`. every
   key below is under it and there is a guard on the frames as well as on the
   keys, because a key being legal and every instant between two keys being legal
   are not the same claim. */
const CAM = { ceil: +(200 / 180).toFixed(4), q: 1.06, him: 1.04, answer: 1.05, lo: 1.02, hi: 1.06 };

/* ---------- the end ---------- */
const END = { at: 0, pre: [], hard: 0.12, tail: 0.18, wmIn: 0, wmFor: 0.09 };
const CARD = 0.95;
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16, minCapPx: 56 };
const GL = {
  shakeX: 15, shakeY: 8, split: 9.5, bandDx: 88, bands: 3,
  noise: [0.10, 0.24], flash: 0.30, flashSize: 420, calmFrom: 0.86,
};

/* crf 17, every dark clip's: this frame is nearly all flat black with soft glows
   across it, which is exactly what a codec bands. */
const CRF = 17;

/* ---------- the mix ---------- */
const TARGET_LUFS = -14, SAMPLE_CEILING = -1.8, MAX_REDUCTION = 5.0, MIN_LUFS = -16;

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
const SMOOTH = bezier(.42, 0, .28, 1);         /* and the camera's, which never snaps */
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

/* two sines on incommensurate periods rather than one: a sine stands still twice
   a period, so on a beat where this is the only thing moving the two frames
   either side of its turning point are identical. */
function phosphor(t, amp, slow, fast, phase) {
  return 1 + amp * 0.78 * Math.sin(2 * Math.PI * t / slow)
    + amp * 0.39 * Math.sin(2 * Math.PI * t / fast + phase);
}

/* ---------- the clock, filled in below ---------- */
const Q = { chars: [], words: [], at: 0, end: 0 };      /* the question, typed to the read */
const A = { chars: [], at: 0, end: 0 };                 /* the answer, typed on a grid */
const RP = [];                                          /* the six briefing lines, placed */
let POP_IN = 0, BUB_IN = 0, BUB_POP = 0, MV_AT = 0, MV_END = 0;
let SHRINK = 0, PARKED = 0, RPT_AT = 0, RPT_END = 0, CAP_AT = 0, SECONDS = 0;
let CAM_KEYS = [];
let SEED = 0;

/* how many characters of a table of per character times are on screen. one
   function for all eight typed things in the film. */
const charsAt = (list, t) => {
  let n = 0;
  while (n < list.length && t >= list[n]) n++;
  return n;
};
/* a caret is a hard step on its own clock, and only while somebody is writing:
   a caret under a finished line is a caret nobody is holding. */
const caretIn = (t, from, to, c) =>
  (t >= from && t < to && (t % c.period) / c.period < c.on ? 1 : 0);

/* ---------- the camera ----------
   a scale and a vertical origin off a short list of keys, eased between. the
   keys are built once the clock is known, at the bottom of this file. */
function camAt(t) {
  const K = CAM_KEYS;
  if (!K.length) return { z: 1, oy: CENTRE_Y };
  if (t <= K[0].t) return { z: K[0].z, oy: K[0].oy };
  for (let i = 1; i < K.length; i++) {
    if (t > K[i].t) continue;
    const a = K[i - 1], b = K[i];
    const p = SMOOTH(span(t, a.t, b.t));
    return { z: +lerp(a.z, b.z, p).toFixed(5), oy: +lerp(a.oy, b.oy, p).toFixed(3) };
  }
  const last = K[K.length - 1];
  return { z: last.z, oy: last.oy };
}
/* where a point in page space actually lands, which is the only space the safe
   area means anything in once the camera is scaling. */
const camMap = (x, y, cam) => ({
  x: VW / 2 + (x - VW / 2) * cam.z,
  y: cam.oy + (y - cam.oy) * cam.z,
});
/* a rectangle in device px off each border, through the camera, **and how much
   room it has over that border's own number**.

   the four bands are not the same size — 180 at the top, 220 at the bottom, 140
   either side — and a guard that takes the smallest of the four and holds
   everything to it is a guard that passes a pill sitting 150 device px down.
   that is exactly what the first preview did. so `margin` is per side and the
   worst of the four is what has to stay positive. */
function camClear(l, t2, r, b, cam) {
  const a = camMap(l, t2, cam), c = camMap(r, b, cam);
  const out = {
    left: +(a.x * DSF).toFixed(1), top: +(a.y * DSF).toFixed(1),
    right: +((VW - c.x) * DSF).toFixed(1), bottom: +((VH - c.y) * DSF).toFixed(1),
  };
  let worst = Infinity, side = null;
  for (const k of ['left', 'top', 'right', 'bottom']) {
    const m = out[k] - SAFE[k];
    if (m < worst) { worst = m; side = k; }
  }
  return { ...out, margin: +worst.toFixed(1), side };
}

/* ---------- how he arrives, moves and shrinks ----------
   three numbers on the card, composed on top of whatever the module wrote, the
   same way post20 composes a fall and a smash. the module still owns his face,
   his idle, his breathing and his pill. */
function popScale(t) {
  if (t >= POP_IN + POP.for) return 1;
  if (t <= POP_IN) return POP.from;
  const p = span(t, POP_IN, POP_IN + POP.for);
  /* up past rest and back onto it: the overshoot is a number in this table
     rather than a property of a curve, which is post20's rule for a landing. */
  return p < POP.overAt
    ? lerp(POP.from, POP.over, EASE(p / POP.overAt))
    : lerp(POP.over, 1, EASE((p - POP.overAt) / (1 - POP.overAt)));
}
function moveAt(t) {
  const p = EASE(span(t, SHRINK, SHRINK + MOVE_FOR));
  return {
    dx: lerp(0, LEFT_OF_CENTRE, p),
    dy: lerp(0, TOP_CY - MASCOT_CY, p),
    sc: lerp(1, SHRINK_TO, p),
  };
}
function glowAt(t) {
  if (t < POP_IN || t >= POP_IN + GLOW.for) return 1;
  return +lerp(GLOW.peak, 1, EASE(span(t, POP_IN, POP_IN + GLOW.for))).toFixed(4);
}

/* the module writes the head and this adds three things to it: the pop, the
   move and the shrink. all of them go on `frame.card`, which is what `headRect`
   and every clearance downstream already read. */
function compose(plan, t) {
  const f = mascotFrame(plan, t);
  const m = moveAt(t);
  const s = +(popScale(t) * m.sc).toFixed(5);
  return {
    ...f,
    glow: +(f.glow * glowAt(t)).toFixed(4),
    /* ---------- the shadow, off, and it is a module bug that it has to be ----
       `.m-zone` declares `--m-shadow-o:0` under `[data-theme=dark]` with the
       comment "the shadow is off on black, because a soft black ellipse on
       #06070a is nothing" — **and nothing reads that token.** `.m-shadow` has a
       literal `opacity:0` and the runtime overwrites it every frame with
       `f.shadow.o`, which is 0.20 on both themes. so on black the module paints
       a white ellipse at a fifth opacity, in `var(--face)`, which on dark is
       #f4f7f5.

       every dark clip before this one drew it and none of them could see it,
       because the shadow sits directly under the head and the head covers it.
       **this is the first dark clip that lifts the head off its own mark**, and
       the first preview came back with a white smear parked at his old height
       for the last five seconds of the film.

       the module is not touched here: fixing the token would change what every
       other dark clip renders, and that is a decision rather than a thing to do
       while building this one. it is written down in MEMORY.md instead. this
       file simply declines the shadow, which on the dark theme is what the
       module's own comment says it wanted. */
    shadow: { ...f.shadow, o: 0 },
    card: {
      ...f.card,
      x: +(f.card.x + m.dx).toFixed(4),
      y: +(f.card.y + m.dy).toFixed(4),
      sx: +(f.card.sx * s).toFixed(5),
      sy: +(f.card.sy * s).toFixed(5),
    },
  };
}

/* ---------- the glitch ----------
   post12's, through post20's, post21's and post22's: a function of the output
   frame index and of nothing else, so a one frame rgb split is not on for one
   subframe of four and landing at a quarter strength.

   **the only glitch in this film is the end card's fault.** two stutters into
   it, then the hard hit the wordmark is born on. */
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
   and `f` is the output frame it belongs to. **the two exchanges — he arrives,
   and everything is swapped for the wordmark — are on the frame rather than on
   the instant**, which is post20's 60fps finding: every channel in an exchange
   goes on the same frame or the shutter finds the seam. */
function frameAt(t, f) {
  const g = glitchAt(f);
  const born = f >= Math.round(POP_IN * FPS);
  const cut = f >= Math.round(END.at * FPS);
  const on = born && !cut;
  const cam = cut ? { z: 1, oy: CENTRE_Y } : camAt(t);
  const wp = span(t, END.wmIn, END.wmIn + END.wmFor);

  /* the box. it holds the question until the answer beat, then clears and holds
     the answer, and it fades out under him as he leaves for the top third. */
  const answering = t >= A.at;
  const boxText = answering ? COPY_A : COPY_Q;
  const boxChars = answering ? charsAt(A.chars, t) : charsAt(Q.chars, t);
  const boxO = cut ? 0 : +(1 - span(t, SHRINK, SHRINK + BOX.fadeFor)).toFixed(4);

  /* the briefing, one line at a time, and the caret only on the line that is
     actually being written. */
  const lines = RP.map(e => ({
    n: cut ? 0 : charsAt(e.chars, t),
    caret: cut ? 0 : caretIn(t, e.at, e.end + 0.10, CARET_R),
  }));

  const cp = span(t, CAP_AT, CAP_AT + CAP.for);
  return {
    t: +t.toFixed(4), f,
    mo: on ? 1 : 0,
    cam: { z: cam.z, oy: cam.oy },
    box: {
      text: boxText, chars: boxChars, o: boxO,
      caret: cut ? 0 : (answering
        ? caretIn(t, A.at - 0.18, A.end + CARET_AFTER, CARET)
        : caretIn(t, 0, Q.end + CARET_AFTER, CARET)),
      /* the focus glow, and it is load bearing rather than decoration: for the
         first three seconds it is the only thing on the frame that changes on
         every frame, and the liveness guard is measured on what this file
         writes. a focused input that breathes is also simply what one does. */
      glow: +phosphor(t, 0.30, 2.9, 1.13, 0.4).toFixed(4),
    },
    lines,
    cap: {
      o: cut ? 0 : (t < CAP_AT ? 0 : 1),
      sc: t < CAP_AT ? CAP.from
        : +(cp < 0.7 ? lerp(CAP.from, CAP.over, EASE(cp / 0.7))
          : lerp(CAP.over, 1, EASE((cp - 0.7) / 0.3))).toFixed(4),
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
  /* index.html's own two blocks, verbatim, which is `captionCss`'s move and the
     reason it is: --bg, --fg, --muted and --bub are the site's and this file is
     not allowed a second opinion about any of them. there is no caption engine
     in this cut to emit them, so it is done here instead. */
  const brand = brandTokens();
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post26</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Manrope:wght@500;800&display=swap">
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
  /* there is no caption band in this cut, so what is taken from the captions is
     the face: manrope, which is what every clip since post18 sets words in. */
  --body:"Manrope",var(--mono);
  --display:"Michroma",var(--mono);
  /* the two channels the rgb split is drawn in: the same white the glow is,
     pulled apart, rather than a red and a cyan out of a filter preset. it is the
     house glitch and it is the only thing in this film with any colour in it. */
  --split-r:rgba(255,120,120,.55); --split-c:rgba(120,220,255,.55);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}

/* the vignette, and it is load bearing rather than decoration: with nothing at
   all animating chrome stops producing compositor frames and the screenshot call
   blocks on a frame that never comes. it is the one thing here allowed to be a
   css animation, because it is the one thing that does not hit a mark. it is
   outside the camera, so the scale never drags its box into the margin. */
.vignette{position:fixed;inset:-10%;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 78% 62% at 50% 46%,
    rgba(255,255,255,.030) 0%, rgba(255,255,255,.010) 46%, rgba(0,0,0,0) 72%);
  will-change:transform,opacity;
  animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{
  from{transform:scale(1) translate3d(0,0,0);opacity:.85}
  to{transform:scale(1.05) translate3d(0,-1.1%,0);opacity:1}
}

/* the camera. the shake and the push are one transform on one element, and the
   origin is written every frame beside them: a scale about a moving point is
   two numbers, and splitting them over two elements is how a zoom and a pan
   end up a frame apart. */
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;background:var(--bg);
  transform-origin:${VW / 2}px var(--cy,${CENTRE_Y}px);
  transform:translate3d(calc(var(--sx,0) * 1px),calc(var(--sy,0) * 1px),0) scale(var(--cz,1));
  will-change:transform}

${mascotCss(plan)}
#m-zone{opacity:var(--m-o,1)}

/* ---- the chat box ----
   an outline in the site's own --bub over a ground a shade above the page, which
   is post17's dark redraw: a genuinely black box on #06070a is not a box, it is
   nothing. the glow is the focus ring and it breathes. */
.box{position:absolute;left:${BOX.x}px;top:${BOX.y}px;
  width:${BOX.w}px;height:${BOX.h}px;border-radius:${BOX.r}px;
  background:#12161a;border:2px solid var(--bub);
  opacity:var(--bo,1);z-index:3;
  box-shadow:0 0 calc(var(--bg-glow,0) * 26px) rgba(255,255,255,.07),
    inset 0 0 calc(var(--bg-glow,0) * 18px) rgba(255,255,255,.028);
  will-change:opacity}
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

/* ---- the briefing ----
   type and nothing else: no card, no rule, no bullet, no drawing. the head of
   each line is --fg at 800 and the body is --muted at 500, which is the site's
   own pair for exactly this — a thing said and the thing said about it. */
.report{position:absolute;left:0;top:0;width:${VW}px;height:${VH}px;
  z-index:4;pointer-events:none;font-family:var(--body);
  font-size:var(--rs,${RPT.size}px);line-height:1.34;letter-spacing:-.004em}
.r{position:absolute;left:${RPT.x}px;width:${RPT.w}px}
.r b{font-weight:800;color:var(--fg)}
.r span{font-weight:500;color:var(--muted)}
.r i{display:inline-block;width:2px;height:.92em;background:var(--fg);
  vertical-align:text-bottom;transform:translateY(.1em);margin-left:3px;
  opacity:var(--rc,0)}

/* ---- the caption ---- */
.cap{position:absolute;left:0;top:${CAP.y}px;width:${VW}px;
  text-align:center;font-family:var(--body);font-weight:800;
  font-size:var(--cs,${CAP.size}px);line-height:1.2;letter-spacing:-.01em;
  color:var(--fg);z-index:4;
  opacity:var(--capo,0);transform:scale(var(--caps,1));will-change:transform,opacity}
/* the ink, not the block. the block is the full width of the frame with the line
   centred in it, so its own rect is 540 css wide whatever size the type is —
   fitting against that measures nothing and drives the size to the floor. the
   inline span is the line, and the line is what has to clear the borders. */
.cap b{display:inline-block;font-weight:800}

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
/* **nothing fringes but the wordmark.** post22's finding: a split that reaches
   the mascot is colour fringing on somebody who is not glitching. there is a
   guard that scans the rendered page for every [data-gl] rule. */
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
  <div class="report" id="report">
${REPORT.map((e, i) => '    <div class="r" data-r="' + i + '" style="top:'
    + (RPT.y + i * RPT.pitch) + 'px"><b></b><span></span><i></i></div>').join('\n')}
  </div>
  <div class="cap" id="cap"><b>${CAPTION}</b></div>
  <div class="wm" id="wm">${WM.lines.map(l => '<span>' + l + '</span>').join('')}</div>
${Array.from({ length: GL.bands }, (_, i) => '  <div class="tear" data-tear="' + i
    + '"><div class="tear-in"><div class="wm">'
    + WM.lines.map(l => '<span>' + l + '</span>').join('') + '</div></div></div>').join('\n')}
  <div class="noise" aria-hidden="true"></div>
  <div class="flash" aria-hidden="true"></div>
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
window.__P26 = ${JSON.stringify({ VW, VH, DSF, WM, RPT, CAP, REPORT, CENTRE_Y,
  /* the box, plus the longer of the two messages it holds: the type is fitted
     once on that one so both are set at the same size. */
  BOX: { ...BOX, longest: COPY_Q.length >= COPY_A.length ? COPY_Q : COPY_A } })};
${mascotRuntime()}
(${scenePage.toString()})();
/* the layers measure and fit themselves once, after both faces are really here.
   offline everything renders in the mono fallback and looks almost right, which
   is the worst kind of wrong to fit type against. */
Promise.all([
  document.fonts.load('400 40px Michroma'),
  document.fonts.load('500 30px Manrope'),
  document.fonts.load('800 26px Manrope'),
])
  .then(function () { return document.fonts.ready; })
  .then(function () {
    window.__built = Object.assign({}, window.__p26.fit(), { mas: window.__mas.build() });
  });
</script>
</body>
</html>`;
}

/* ---------- the page's own script ----------
   it writes numbers to elements and it decides nothing, exactly like the
   mascot's page half. serialised in with .toString(), so it must not close over
   anything: everything it needs arrives on window.__P26. */
function scenePage() {
  const P = window.__P26;
  const stage = document.getElementById('stage');
  const box = document.getElementById('box');
  const boxText = document.getElementById('boxtext');
  const typed = document.getElementById('typed');
  const caret = document.getElementById('caret');
  const report = document.getElementById('report');
  const rows = [...document.querySelectorAll('.r')].map(el => ({
    el, b: el.querySelector('b'), s: el.querySelector('span'), c: el.querySelector('i'),
  }));
  const cap = document.getElementById('cap');
  const wms = [...document.querySelectorAll('.wm')];
  const tears = [...document.querySelectorAll('.tear')];
  const tearIns = tears.map(t => t.querySelector('.tear-in'));
  let lastText = null, lastChars = -1;
  const lastN = rows.map(() => -1);

  const capOf = el => {
    const cs = getComputedStyle(el);
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    const m = cv.measureText('H');
    return { cap: m.actualBoundingBoxAscent || 0, font: cv.font };
  };

  window.__p26 = {
    fit() {
      /* the wordmark, fitted its own way: michroma is proportional and the
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

      /* the typed line, fitted on the **longer of the two strings** with the
         caret in place: the largest size whose wrapped block still fits the text
         box. the box holds two different messages in this film and they must be
         set at one size, or the answer arrives in a different typeface weight of
         the same face and reads as a different box.

         the caret is forced on **through its own variable** for the
         measurement, never with an inline `opacity`. an inline opacity is a
         declaration and it beats `opacity:var(--co,1)` in the stylesheet for the
         rest of the render, so a caret fitted that way is welded on: it never
         blinks and it is still there under a line nobody is typing any more. the
         guards cannot see that — every number they read is correct — and the
         frames can. post22's bug, and it is not being repeated. */
      caret.style.setProperty('--co', '1');
      typed.textContent = P.BOX.longest;
      let size = P.BOX.size, stoppedBy = null;
      for (; size >= 10; size -= 0.5) {
        boxText.style.fontSize = size + 'px';
        if (boxText.scrollHeight <= P.BOX.textH + 0.5) { stoppedBy = null; break; }
        stoppedBy = 'height';
      }
      boxText.style.fontSize = size.toFixed(2) + 'px';
      const lh = parseFloat(getComputedStyle(boxText).lineHeight) || 1;
      const bc = capOf(boxText);

      /* the briefing, fitted on the **whole set at once**: the largest size at
         which every one of the six lines still fits inside its own slot. one
         size for all six, because six lines of a briefing at six sizes is a
         ransom note. every line is filled with its full text for the
         measurement and emptied again afterwards. */
      for (let i = 0; i < rows.length; i++) {
        rows[i].b.textContent = P.REPORT[i].bright;
        rows[i].s.textContent = P.REPORT[i].rest;
        rows[i].c.style.setProperty('--rc', '1');
      }
      let rs = P.RPT.size, rWide = 0, rTall = 0;
      for (; rs >= P.RPT.minSize; rs -= 0.5) {
        report.style.setProperty('--rs', rs + 'px');
        rTall = 0;
        for (const r of rows) rTall = Math.max(rTall, r.el.getBoundingClientRect().height);
        if (rTall <= P.RPT.pitch - 4) break;
      }
      report.style.setProperty('--rs', rs.toFixed(2) + 'px');
      const rHeights = [];
      for (const r of rows) {
        const bb = r.el.getBoundingClientRect();
        rHeights.push(+bb.height.toFixed(2));
        /* the row's own overflow, not the sum of its two spans' rects: a span
           that has wrapped reports the union of its line boxes, which on a two
           line entry is very nearly the column width twice over and is not a
           width anybody asked about. */
        rWide = Math.max(rWide, r.el.scrollWidth);
      }
      const rc = capOf(rows[0].b);
      for (const r of rows) { r.b.textContent = ''; r.s.textContent = ''; r.c.style.setProperty('--rc', '0'); }

      /* and the caption, on width: one line, never wrapped, and it has to clear
         the same borders everything else does. */
      const capInk = cap.querySelector('b');
      let cs = P.CAP.size;
      for (; cs >= 16; cs -= 0.5) {
        cap.style.setProperty('--cs', cs + 'px');
        if (capInk.getBoundingClientRect().width <= P.VW - 2 * P.RPT.x) break;
      }
      cap.style.setProperty('--cs', cs.toFixed(2) + 'px');
      const cc = capOf(capInk);
      const cr = capInk.getBoundingClientRect();

      return {
        wm: +ws.toFixed(2),
        box: {
          size: +size.toFixed(2), stoppedBy,
          capPx: +(bc.cap * P.DSF).toFixed(1), font: bc.font,
          h: +boxText.scrollHeight.toFixed(1),
          lines: Math.round(boxText.scrollHeight / lh),
        },
        report: {
          size: +rs.toFixed(2), capPx: +(rc.cap * P.DSF).toFixed(1), font: rc.font,
          heights: rHeights, tallest: +rTall.toFixed(2), widest: +rWide.toFixed(0),
          slot: P.RPT.pitch,
        },
        cap: {
          size: +cs.toFixed(2), capPx: +(cc.cap * P.DSF).toFixed(1), font: cc.font,
          w: +cr.width.toFixed(1), h: +cr.height.toFixed(1),
          left: +cr.left.toFixed(1), top: +cr.top.toFixed(1),
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

    /* the box as it actually painted, in device px off each border, **with the
       camera off**. what the camera does to it is arithmetic this file does in
       node, on every frame, against these numbers. the outline is measured too:
       chrome floors border-width to a whole css pixel. */
    measureBox() {
      const r = box.getBoundingClientRect(), d = P.DSF;
      return {
        left: +(r.left * d).toFixed(1), top: +(r.top * d).toFixed(1),
        right: +((P.VW - r.right) * d).toFixed(1), bottom: +((P.VH - r.bottom) * d).toFixed(1),
        w: +(r.width * d).toFixed(1), h: +(r.height * d).toFixed(1),
        stroke: getComputedStyle(box).borderTopWidth,
      };
    },

    /* the pill as it actually painted: the string in it and the face it is set
       in, both read off the rendered element rather than off what was asked
       for. a glyph that fell back to a mono face is exactly the thing this
       catches and there is no way to know it without measuring. */
    pillText() {
      const pill = document.getElementById('m-bubble-text');
      const cs = getComputedStyle(pill);
      const cv = document.createElement('canvas').getContext('2d');
      cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      const m = cv.measureText('H');
      return {
        text: pill.textContent, family: cs.fontFamily, weight: cs.fontWeight,
        size: cs.fontSize, font: cv.font,
        capPx: +((m.actualBoundingBoxAscent || 0) * P.DSF).toFixed(1),
        inManrope: cv.font.indexOf('Manrope') > -1,
      };
    },

    /* every `[data-gl]` rule in the rendered stylesheet, so a split that starts
       reaching something other than the wordmark is a failure rather than a
       thing somebody notices on a frame. post22's guard. */
    glRules() {
      const out = [];
      for (const sheet of document.styleSheets) {
        let rules;
        try { rules = sheet.cssRules; } catch { continue; }
        for (const r of rules || []) {
          if (r.selectorText && r.selectorText.indexOf('data-gl') > -1) out.push(r.selectorText);
        }
      }
      return out;
    },

    apply(o) {
      const s = stage.style;
      s.setProperty('--m-o', o.mo.toFixed(4));
      s.setProperty('--sx', o.sx.toFixed(2));
      s.setProperty('--sy', o.sy.toFixed(2));
      s.setProperty('--cz', o.cam.z.toFixed(5));
      s.setProperty('--cy', o.cam.oy.toFixed(2) + 'px');
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

      box.style.setProperty('--bo', o.box.o.toFixed(4));
      box.style.setProperty('--bg-glow', o.box.glow.toFixed(4));
      box.style.visibility = o.box.o < 0.004 ? 'hidden' : 'visible';
      caret.style.setProperty('--co', o.box.caret.toFixed(2));
      if (o.box.text !== lastText || o.box.chars !== lastChars) {
        typed.textContent = o.box.text.slice(0, o.box.chars);
        lastText = o.box.text; lastChars = o.box.chars;
      }

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i], L = o.lines[i], E = P.REPORT[i];
        r.c.style.setProperty('--rc', L.caret.toFixed(2));
        if (L.n === lastN[i]) continue;
        lastN[i] = L.n;
        r.b.textContent = E.bright.slice(0, Math.min(L.n, E.bright.length));
        r.s.textContent = L.n > E.bright.length ? E.rest.slice(0, L.n - E.bright.length) : '';
      }

      cap.style.setProperty('--capo', o.cap.o.toFixed(4));
      cap.style.setProperty('--caps', o.cap.sc.toFixed(4));

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
   virtual time governs css transitions and timers but not `requestAnimationFrame`,
   which rides BeginFrames from the compositor and runs several times per capture.
   the queue is flushed exactly once per captured frame with a timestamp that
   advances exactly one frame, so anything animating by hand runs at a true 60fps
   in page time. `record.mjs` documents the measurement behind this. */
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
  for (const [f, what] of [['400 40px "Michroma"', 'the wordmark'], ['500 24px "Manrope"', 'the typed line'],
  ['800 22px "Manrope"', 'the briefing and the pill']]) {
    if (!await page.evaluate(s => document.fonts.check(s), f)) {
      throw new Error(f + ' did not load — ' + what + ' would be judged in the mono fallback');
    }
  }

  const built = await page.evaluate(() => window.__built);
  const wm = await page.evaluate(() => window.__p26.measureWm());
  const boxRect = await page.evaluate(() => window.__p26.measureBox());
  const glRules = await page.evaluate(() => window.__p26.glRules());
  console.log('  built: head ' + built.mas.headPx + 'px, ' + built.mas.eyes + ' eyes, '
    + built.mas.glows + ' glow layers, theme ' + built.mas.theme);
  console.log('  the typed line: Manrope 500 at ' + built.box.size + 'css px, caps '
    + built.box.capPx + ' device, ' + built.box.lines + ' lines, ' + built.box.h
    + 'css tall in a text box of ' + BOX.textH);
  console.log('  the briefing: Manrope at ' + built.report.size + 'css px, caps '
    + built.report.capPx + ' device, tallest line ' + built.report.tallest + 'css in a '
    + built.report.slot + 'css slot, widest row ' + built.report.widest + 'css of a '
    + RPT.w + 'css column');
  console.log('  the caption: Manrope 800 at ' + built.cap.size + 'css px, caps '
    + built.cap.capPx + ' device, ' + built.cap.w + 'css wide');
  console.log('  the box, camera off: ' + boxRect.w + 'x' + boxRect.h + ' device, outline '
    + boxRect.stroke + ', clear ' + boxRect.left + ' left / ' + boxRect.top + ' top / '
    + boxRect.right + ' right / ' + boxRect.bottom + ' bottom');
  console.log('  the wordmark: ' + wm.sizeCss + 'css px, widest line ' + wm.widestPx
    + ' device px, caps ' + wm.capPx + ', clear ' + wm.left + ' left / ' + wm.top
    + ' top / ' + wm.right + ' right / ' + wm.bottom + ' bottom');

  /* the bubble, on the frame it is fully up on, measured off the rendered pill
     rather than off the numbers that placed it. */
  const bub = plan.marks[0].bubble;
  const bubAt = +(bub.full + 0.10).toFixed(3);
  {
    const f = Math.round(bubAt * FPS), t = f / FPS;
    await page.evaluate(fr => window.__mas.apply(fr), compose(plan, t));
    await page.evaluate(fr => window.__p26.apply(fr), frameAt(t, f));
  }
  const bubSafe = await page.evaluate((w, h) => window.__mas.bubbleSafe(w, h), VW, VH);
  const bubCaps = await page.evaluate(() => window.__mas.caps());
  const pillText = await page.evaluate(() => window.__p26.pillText());
  console.log('  the pill at ' + bubAt + 's: "' + pillText.text + '", ' + bubSafe.w
    + ' device px wide, clear ' + bubSafe.left + ' left / ' + bubSafe.top + ' top / '
    + bubSafe.right + ' right / ' + bubSafe.bottom + ' bottom, caps ' + bubCaps.capPx);

  /* ---------- the safe area, through the camera, on every frame ----------
     this is the guard a clip that zooms owes and a clip that does not never had
     to write. the mascot's ink, the box's outline, the briefing's block and the
     caption are all mapped through the frame's own scale and origin, and the
     worst clearance any of them reaches is what gets reported. */
  const rptBottom = RPT.y + (REPORT.length - 1) * RPT.pitch
    + Math.max(...built.report.heights);
  let worstHead = null, worstText = null, camPeak = 0, camStep = 0, camStepAt = 0;
  for (let f = 0; f < N; f++) {
    const t = f / FPS;
    if (t >= END.at) break;
    const o = frameAt(t, f);
    const cam = o.cam;
    camPeak = Math.max(camPeak, cam.z);
    if (f) {
      const prev = camAt((f - 1) / FPS);
      /* how far the frame's own corner travels between two frames, which is the
         unit the shutter's argument is had in. */
      const a = camMap(0, 0, prev), b = camMap(0, 0, cam);
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > camStep) { camStep = d; camStepAt = +t.toFixed(3); }
    }
    if (o.mo) {
      const r = headRect(plan, compose(plan, t));
      /* headRect works in page space; undo it back to css edges and re-map. */
      const l = r.left / DSF, tp = r.top / DSF;
      const rt = VW - r.right / DSF, bt = VH - r.bottom / DSF;
      const c = camClear(l, tp, rt, bt, cam);
      if (!worstHead || c.margin < worstHead.margin) worstHead = { t: +t.toFixed(3), ...c };
    }
    const boxes = [];
    if (o.box.o > 0.02) boxes.push(['the chat box', BOX.x, BOX.y, BOX.x + BOX.w, BOX.y + BOX.h]);
    if (o.lines.some(L => L.n > 0)) boxes.push(['the briefing', RPT.x, RPT.y, RPT.x + RPT.w, rptBottom]);
    if (o.cap.o > 0.02) {
      boxes.push(['the caption', built.cap.left, built.cap.top,
        built.cap.left + built.cap.w, built.cap.top + built.cap.h]);
    }
    for (const [name, l, tp, rt, bt] of boxes) {
      const c = camClear(l, tp, rt, bt, cam);
      if (!worstText || c.margin < worstText.margin) worstText = { t: +t.toFixed(3), name, ...c };
    }
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
      await page.evaluate(fr => window.__p26.apply(fr), o);
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);

      if (k === 0) {
        /* the liveness signature: one number per output frame off everything
           this file wrote plus everything the module wrote, so two identical
           frames are a fact rather than a suspicion. **the mascot's channels are
           multiplied by `mo`** — he is planned from zero and drifts the whole
           time, so counting his numbers while he is not on the frame would let
           the first three seconds pass on motion nobody can see. */
        let s = o.mo * 7 + o.box.o * 11 + o.box.chars * 13 + o.box.caret * 17
          + o.box.glow * 19 + o.cam.z * 2003 + o.cam.oy * 23
          + o.cap.o * 29 + o.cap.sc * 31
          + o.sx * 37 + o.sy * 41 + o.wm.o * 43 + o.wm.sc * 47 + o.wm.glow * 53
          + o.g.split * 61 + o.g.noise * 67 + o.g.flash * 71 + o.g.bands.length * 73;
        for (let i = 0; i < o.lines.length; i++) s += o.lines[i].n * (79 + i) + o.lines[i].caret * (97 + i);
        s += o.mo * (mf.card.x * 179 + mf.card.y * 181 + mf.card.rot * 191
          + mf.card.sx * 193 + mf.card.sy * 197 + mf.glow * 199);
        for (let e = 0; e < 2; e++) {
          s += o.mo * (mf.eyes[e].x * (211 + e) + mf.eyes[e].y * (223 + e)
            + mf.eyes[e].sx * (227 + e) + mf.eyes[e].sy * (229 + e) + mf.eyes[e].lid * (233 + e));
          s += o.mo * (mf.brows[e].o * (239 + e) + mf.brows[e].y * (241 + e));
        }
        s += o.mo * (mf.bubble.o * 251 + mf.bubble.pill.sc * 257
          + mf.bubble.dots[0].sc * 263 + mf.bubble.dots[1].sc * 269);
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
    [Q.words[3].start + 0.05, 'b-typing-on-the-read'],
    [Q.end + 0.04, 'c-the-question'],
    [POP_IN + 0.10, 'd-he-pops-in'],
    [BUB_POP, 'e-the-pill'],
    [bubAt, 'f-the-line-he-says'],
    [A.end, 'g-nordic-parts-as'],
    [SHRINK + MOVE_FOR * 0.55, 'h-the-move'],
    [PARKED + 0.04, 'i-parked-in-the-top-third'],
    [RP[1].end, 'j-two-lines-in'],
    [RP[3].end, 'k-four-lines-in'],
    [RPT_END, 'l-the-briefing'],
    [CAP_AT + CAP.for, 'm-the-caption'],
    [END.pre[1].t, 'n-the-second-stutter'],
    [END.at + END.hard + END.tail + 0.16, 'o-the-wordmark'],
    [SECONDS - 0.06, 'p-the-last-frame'],
  ];
  for (const [want, name] of stills) {
    const f = Math.min(N - 1, Math.round(want * FPS));
    const t = f / FPS;
    await page.evaluate(fr => window.__mas.apply(fr), compose(plan, t));
    await page.evaluate(fr => window.__p26.apply(fr), frameAt(t, f));
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
    });
    fs.writeFileSync(path.join(VERIFY, name + '.png'), Buffer.from(shot.data, 'base64'));
  }

  console.log('  the camera peaks at ' + camPeak.toFixed(4) + ' of a ceiling of ' + CAM.ceil
    + ', moving at most ' + camStep.toFixed(2) + ' css px a frame at ' + camStepAt + 's');
  console.log('  the head, through the camera, worst at ' + worstHead.t + 's: ' + worstHead.left
    + ' left / ' + worstHead.top + ' top / ' + worstHead.right + ' right / '
    + worstHead.bottom + ' bottom, ' + worstHead.margin + 'px over the '
    + worstHead.side + ' band of ' + SAFE[worstHead.side]);
  console.log('  the type, through the camera, worst is ' + worstText.name + ' at ' + worstText.t
    + 's: ' + worstText.left + ' left / ' + worstText.top + ' top / ' + worstText.right
    + ' right / ' + worstText.bottom + ' bottom, ' + worstText.margin + 'px over the '
    + worstText.side + ' band of ' + SAFE[worstText.side]);

  await browser.close();
  srv.close();
  if (SUB > 1) blend(N);

  const state = {
    built, wm, boxRect, glRules, bubSafe, bubCaps, pillText, bubAt,
    head: worstHead, text: worstText, camPeak, camStep, camStepAt, rptBottom, sigs, frames: N,
  };
  fs.writeFileSync(path.join(OUT, 'post26.json'), JSON.stringify(state, null, 2));
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
  const out = path.join(OUT, 'post26-dark-1080x1920.mp4');
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

/* ---------- the two reads, cached on the copy ----------
   the cache is keyed on the line and the voice, so changing one line refetches
   that line and only that line. */
async function take(L) {
  const name = 'post26-' + L.key;
  const cached = path.join(VOICE_OUT, name + '-' + L.voice + '.json');
  const want = L.text.replace(/\s+/g, ' ').trim();
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === want && j.speed === SPEED && fs.existsSync(j.file)) return { ...j, ...L, cached: true };
  }
  return { ...(await speak(L.text, { voice: L.voice, speed: SPEED, name })), ...L, cached: false };
}

/* where a take actually starts and stops making noise. the word table's last
   `end` is the alignment's, and on a four word line the last character's tail
   runs half a second past anything anybody hears — so a clock cut to it would
   leave half a second of nothing in the middle of the film. */
function audioEdges(pcm) {
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  const gate = peak * Math.pow(10, SILENCE_DB / 20);
  const H = Math.round(0.005 * SR), n = Math.floor(pcm.length / H);
  const loud = k => {
    let m = 0;
    for (let j = k * H; j < Math.min((k + 1) * H, pcm.length); j++) m = Math.max(m, Math.abs(pcm[j]));
    return m > gate;
  };
  let a = 0, b = n - 1;
  while (a < n && !loud(a)) a++;
  while (b > a && !loud(b)) b--;
  return { start: +(a * 0.005).toFixed(4), end: +((b + 1) * 0.005).toFixed(4), peak: +dbfs(peak).toFixed(1) };
}

const takes = [];
for (const L of LINES) takes.push(await take(L));
const pcms = takes.map(t => decode(ffmpeg, t.file));
const edges = pcms.map(audioEdges);

console.log('  the two reads');
for (let i = 0; i < takes.length; i++) {
  console.log('    ' + takes[i].voice.padEnd(7) + (takes[i].provider || '?').padEnd(12)
    + (takes[i].elevenId ? '[' + takes[i].elevenId + ' clone] ' : '')
    + edges[i].end.toFixed(2) + 's of sound, ' + takes[i].words.length + ' words, '
    + takes[i].timing + (takes[i].cached ? ', cached' : '') + '  "' + takes[i].text + '"');
}

/* ---------- the clock ----------
   the first half is the narrator's and the second half is derived off it.
   nothing below is typed except the joins named at the top of this file. */
{
  /* the question, character by character, **placed by the read rather than by a
     grid**: each word's own characters are spread across that word's own spoken
     window, and the space in front of a word arrives with the word. so the
     typing is uneven in exactly the way the reading is. */
  const off = +(VOICE_AT - edges[0].start).toFixed(4);
  Q.at = VOICE_AT;
  Q.words = takes[0].words.map(w => ({
    word: w.word, start: +(w.start + off).toFixed(4), end: +(w.end + off).toFixed(4),
  }));
  let at = 0;
  for (let i = 0; i < Q.words.length; i++) {
    const w = Q.words[i];
    const n = w.word.length + (i ? 1 : 0);
    for (let k = 0; k < n; k++) {
      Q.chars.push(+(w.start + (w.end - w.start) * ((k + 1) / n)).toFixed(4));
    }
    at += n;
  }
  if (at !== COPY_Q.length) {
    throw new Error('the character clock is ' + at + ' long and the question is ' + COPY_Q.length
      + ' — the read and the copy have drifted apart');
  }
  Q.end = Q.words[Q.words.length - 1].end;
}

POP_IN = +(Q.end + POP_LEAD).toFixed(4);
/* the module's own arithmetic, read off its own tables rather than copied: a
   mark opens its bubble `entry + 0.12` after its own time, and the pill pops two
   dot steps into that. **the mascot's voice starts on the pop**, which is the
   frame the words are first on the screen. */
BUB_IN = +(POP_IN + STATES.delighted.entry + 0.12).toFixed(4);
BUB_POP = +(BUB_IN + BUBBLE.step * 2).toFixed(4);
MV_AT = BUB_POP;
MV_END = +(MV_AT + (edges[1].end - edges[1].start)).toFixed(4);

A.at = +(MV_END + ANSWER_LEAD).toFixed(4);
A.end = +(A.at + ANSWER_FOR).toFixed(4);
for (let k = 0; k < COPY_A.length; k++) {
  A.chars.push(+(A.at + ANSWER_FOR * ((k + 1) / COPY_A.length)).toFixed(4));
}

SHRINK = +(A.end + SHRINK_LEAD).toFixed(4);
PARKED = +(SHRINK + MOVE_FOR).toFixed(4);
RPT_AT = PARKED;

{
  let at = RPT_AT;
  for (let i = 0; i < REPORT.length; i++) {
    const e = REPORT[i];
    const text = e.bright + e.rest;
    const dur = +Math.max(RPT.minFor, text.length / RPT.cps).toFixed(4);
    const chars = [], words = [];
    for (let k = 0; k < text.length; k++) {
      chars.push(+(at + dur * ((k + 1) / text.length)).toFixed(4));
      /* a word starts the moment its first character is on screen, which is the
         instant a key was pressed. that is where the tick goes. */
      if (k === 0 || text[k - 1] === ' ') words.push(chars[k]);
    }
    RP.push({
      i, text, bright: e.bright, rest: e.rest, chars, words,
      at: +at.toFixed(4), for: dur, end: +(at + dur).toFixed(4),
      cy: RPT.y + i * RPT.pitch + RPT.pitch / 2,
    });
    at = at + dur + RPT.gap;
  }
  RPT_END = RP[RP.length - 1].end;
}

CAP_AT = +(RPT_END + CAP_LEAD).toFixed(4);
END.at = +(CAP_AT + CAP_FOR).toFixed(4);
END.wmIn = END.at;
END.pre = [
  { t: +(END.at - 0.38).toFixed(3), for: 0.05, force: 0.34 },
  { t: +(END.at - 0.18).toFixed(3), for: 0.05, force: 0.60 },
];
SECONDS = +(END.at + CARD).toFixed(2);
GL_WINDOWS = glitchWindows(FPS);
GL_WINDOWS_60 = FPS === 60 ? GL_WINDOWS : glitchWindows(60);

/* ---------- the camera's keys ----------
   built now, because every one of them is a time this file has just derived.
   the briefing's own six get two keys each: pull back and pan at the start of a
   line, push in by the end of it. that is the whole of "pushes in on the line
   being typed and pulls back between lines" and it is smooth because the ease
   between two keys is. */
CAM_KEYS = [
  { t: 0, z: 1.00, oy: BOX.cy },
  { t: Q.end, z: CAM.q, oy: BOX.cy },
  { t: POP_IN, z: CAM.him, oy: MASCOT_CY + 40 },
  { t: A.at, z: CAM.answer, oy: BOX.cy },
  { t: SHRINK, z: 1.00, oy: (TOP_CY + RPT.y) / 2 },
  ...RP.flatMap(e => [{ t: e.at, z: CAM.lo, oy: e.cy }, { t: e.end, z: CAM.hi, oy: e.cy }]),
  { t: CAP_AT, z: 1.00, oy: CENTRE_Y },
  { t: END.at, z: 1.00, oy: CENTRE_Y },
];

console.log('\n  the clock, against what the brief asked for');
const drift = [
  ['he pops in', POP_IN, ASKED.pop],
  ['the answer types', A.at, ASKED.answer],
  ['the briefing starts', RPT_AT, ASKED.report],
  ['the caption pops', CAP_AT, ASKED.caption],
  ['the fault', END.at, ASKED.end],
];
for (const [what, got, want] of drift) {
  console.log('    ' + got.toFixed(2).padStart(5) + 's  ' + what.padEnd(22)
    + 'asked ' + want.toFixed(2) + ', ' + (got - want >= 0 ? '+' : '') + (got - want).toFixed(2));
}

if (VOICE_ONLY) {
  console.log('\n  the beats');
  console.log('    ' + Q.at.toFixed(2).padStart(5) + 's  the narrator starts and the line types');
  for (const w of Q.words) console.log('    ' + w.start.toFixed(2).padStart(5) + 's    ' + w.word);
  console.log('    ' + POP_IN.toFixed(2).padStart(5) + 's  he pops in');
  console.log('    ' + BUB_POP.toFixed(2).padStart(5) + 's  the pill pops and he speaks');
  console.log('    ' + MV_END.toFixed(2).padStart(5) + 's  he stops');
  console.log('    ' + A.at.toFixed(2).padStart(5) + 's  the box types "' + COPY_A + '"');
  console.log('    ' + SHRINK.toFixed(2).padStart(5) + 's  he moves up and shrinks, the box fades');
  for (const e of RP) {
    console.log('    ' + e.at.toFixed(2).padStart(5) + 's  line ' + (e.i + 1) + ', '
      + e.for.toFixed(2) + 's, ' + e.words.length + ' ticks: "' + e.text + '"');
  }
  console.log('    ' + CAP_AT.toFixed(2).padStart(5) + 's  the caption: "' + CAPTION + '"');
  console.log('    ' + END.at.toFixed(2).padStart(5) + 's  the fault');
  console.log('    ' + SECONDS.toFixed(2).padStart(5) + 's  end');
  process.exit(0);
}

/* ---------- the seed, walked for one blink ----------
   the brief asks for exactly one blink while the caption is up. a blink is the
   module's own schedule rather than something a clip may place, so the knob is
   the idle's seed and the answer is found rather than remembered: the first seed
   whose schedule puts exactly one blink inside the caption's window. **it is
   walked on every run rather than frozen**, because the window is derived from
   two reads and a frozen seed would quietly stop satisfying it the day a take
   comes back a tenth of a second longer. */
function planWith(seed) {
  return planMascot({
    seconds: SECONDS, size: SIZE, theme: 'dark',
    /* **no hands.** the brief rules them out and the plan is where that is said
       once. there is a guard on it below. */
    hands: false,
    /* dead straight on. `pos` defaults to bottom-left and the module derives
       TURN.bias 0.35 from it, which is right for a head standing in a corner
       looking into the frame and wrong for one facing camera. post20's note. */
    bias: 0,
    seed,
    /* straight up off the crown rather than off to one side. he is dead centre
       here, so a run that climbs to the right would put a four word pill's far
       end into the platform's right border; `over` is symmetric and it is the
       only thought placement a centred head can afford. */
    thought: 'over',
    /* two marks, and **only the two states the brief allows**: happy when he
       arrives with the answer, calm for the rest of the film. */
    marks: [
      { t: POP_IN, state: 'delighted', bubble: BUB_TEXT },
      { t: SHRINK, state: 'neutral' },
    ],
  });
}
let plan = null;
for (let s = 1; s <= 400; s++) {
  const p = planWith(s);
  const inCap = p.idle.blinks.filter(b => b.t >= CAP_AT && b.t < END.at);
  if (inCap.length === 1) { plan = p; SEED = s; break; }
}
if (!plan) { plan = planWith(1); SEED = 1; }

/* his box, placed. `headRect`, `mascotCss` and `mascotPagePlan` all read
   `plan.box` when they are called, so moving it first is the same as having been
   placed there. the move to the top third is composed on the card at render
   time — see `moveAt` — so this is where he pops in and nothing else. */
const halfBox = (GRID / 2) * plan.unit;
plan.box.left = +(VW / 2 - halfBox - LEFT_OF_CENTRE).toFixed(2);
plan.box.top = +(MASCOT_CY - halfBox).toFixed(2);

const rep = mascotMotion(plan, FPS, SECONDS);
const rep60 = FPS === 60 ? rep : mascotMotion(plan, 60, SECONDS);
console.log(describeMascot(plan));
console.log(describeMotion(rep));
console.log('  the idle seed is ' + SEED + ', walked for one blink in the caption. blinks at '
  + plan.idle.blinks.map(b => b.t.toFixed(2)).join(', '));

/* ---------- the voice track ----------
   two takes on one clock. each is trimmed to its own audible edges with a small
   pre-roll and tail, and laid at the offset the clock above asked for. */
const VTRACK = new Float32Array(Math.ceil(SECONDS * SR));
const VWORDS = [];
{
  const offs = [+(Q.at - edges[0].start).toFixed(4), +(MV_AT - edges[1].start).toFixed(4)];
  for (let i = 0; i < takes.length; i++) {
    const pcm = pcms[i], e = edges[i], off = offs[i];
    const a = Math.max(0, Math.round((e.start - PRE) * SR));
    const b = Math.min(pcm.length, Math.round((e.end + POST) * SR));
    const at = Math.round((off + e.start - PRE) * SR);
    for (let j = a; j < b; j++) {
      const k = at + (j - a);
      if (k >= 0 && k < VTRACK.length) VTRACK[k] += pcm[j];
    }
    for (const w of takes[i].words) {
      VWORDS.push({ word: w.word, start: +(w.start + off).toFixed(4), end: +(w.end + off).toFixed(4) });
    }
  }
  VWORDS.sort((a, b) => a.start - b.start);
}

/* ---------- the cues ----------
   **three kinds and nothing else.** the module's own `pop` for the pill, one
   `key` a word for the briefing, a `pop` for the caption, and the end card's own
   fault with its two stutters. there is no tick under either of the box's two
   lines: the first types under a voice and post22's finding is that a tick a
   letter under a read is a machine gun over a man talking, and the second is the
   same box doing the same thing four seconds later. */
const cues = [
  ...mascotCues(plan).map(c => ({ ...c, from: 'the module\'s own cue for its own pill' })),
  ...RP.flatMap(e => e.words.map((t, k) => ({
    t, kind: 'key', opts: { seed: 0x2600 + e.i * 131 + k },
    from: 'briefing line ' + (e.i + 1) + ', word ' + (k + 1),
  }))),
  { t: CAP_AT, kind: 'pop', from: 'the caption arriving' },
  { t: END.at, kind: 'glitch', from: 'the cut' },
];
const { buf: sfx, report: sfxReport } = renderSfx(cues, SECONDS, {});

/* the two stutters into the fault, getting louder. post22's recipe and post22's
   levels; the level is the only argument. */
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
   post24's rig: the voice and the effects mixed with the read's own envelope
   ducking under it, then the loudest gain whose limiting is still legal. the
   limiter is the constraint and the target is where the search stops. */
const WAV = path.join(OUT, 'post26-mix.wav');
fs.mkdirSync(OUT, { recursive: true });
const MIXED = mixdown(VTRACK, sfx, voiceEnvelope(VWORDS, SECONDS), {});
function attempt(gdb) {
  const buf = Float32Array.from(MIXED.out);
  applyGain(buf, gdb);
  const lim = limit(buf, SAMPLE_CEILING);
  writeWav(WAV, buf);
  return { g: gdb, lim, r: loudness(ffmpeg, WAV) };
}
let lo = -6, hi = 18, best = null;
for (let i = 0; i < 10; i++) {
  const a = attempt((lo + hi) / 2);
  const legal = a.lim.reduction <= MAX_REDUCTION;
  if (legal && (!best || a.r.lufs > best.r.lufs)) best = a;
  if (!legal || a.r.lufs > TARGET_LUFS) hi = a.g; else lo = a.g;
}
if (!best) best = attempt(0);
const final = attempt(best.g);

/* ---------- the beats, printed ---------- */
console.log('\n  the beats');
const beats = [
  [0, 'the chat box in the middle of a black frame, empty, its caret blinking'],
  [Q.at, 'the narrator starts and the line types itself in, cut to his own words'],
  [Q.end, 'the last word: "' + Q.words[Q.words.length - 1].word + '"'],
  [POP_IN, 'he pops in above the box, delighted, under a glow at ' + GLOW.peak + 'x'],
  [BUB_POP, 'the pill pops and the mascot voice says it: "' + BUB_TEXT + '"'],
  [MV_END, 'he stops talking'],
  [A.at, 'the box clears and types "' + COPY_A + '"'],
  [SHRINK, 'he goes up to the top third and down to ' + (SHRINK_TO * 100) + '%, the box fades out'],
  ...RP.map(e => [e.at, 'briefing line ' + (e.i + 1) + ', ' + e.text.length + ' characters in '
    + e.for.toFixed(2) + 's, ' + e.words.length + ' key ticks']),
  [CAP_AT, 'the caption pops: "' + CAPTION + '"'],
  ...END.pre.map((w, i) => [w.t, 'stutter ' + (i + 1) + ' of two, into the fault']),
  [END.at, 'the fault. he, the briefing and the caption are cut and the wordmark is born'],
  [SECONDS, 'end, after ' + (SECONDS - END.wmIn - END.wmFor).toFixed(2) + 's of the end card'],
].sort((a, b) => a[0] - b[0]);
for (const [t, what] of beats) console.log('    ' + t.toFixed(2).padStart(5) + 's  ' + what);

console.log('\n  the sound');
console.log(describeMix(sfxReport, {
  'the narrator': NARRATOR + ' via ' + (takes[0].provider || '?') + ', ' + edges[0].end.toFixed(2)
    + 's of sound at ' + Q.at.toFixed(2) + 's, speed ' + SPEED,
  'the mascot': MASCOT_V + ' via ' + (takes[1].provider || '?') + ' on its own voice id, '
    + (edges[1].end - edges[1].start).toFixed(2) + 's at ' + MV_AT.toFixed(2) + 's',
  'the ticks': RP.reduce((n, e) => n + e.words.length, 0) + ' keys, one a word, '
    + RPT_AT.toFixed(2) + ' to ' + RPT_END.toFixed(2) + 's, and none anywhere else',
  'the bus': final.r.lufs.toFixed(1) + ' LUFS, peak ' + final.r.truePeak.toFixed(1)
    + ' dBTP, limiter took ' + final.lim.reduction.toFixed(2) + ' dB, gain ' + best.g.toFixed(1),
}));

/* ---------- the fast things, measured before anything renders ----------
   the pop in is the only move in this file that could outrun the shutter, so it
   is walked at sixty in the unit the argument is had in: the head's own edge,
   which is what a scale moves. */
{
  const halfHead = HEAD.plate.s / 2 * plan.unit;
  let d = 0, at = POP_IN;
  for (let f = Math.floor((POP_IN - 0.05) * 60); f <= Math.ceil((POP_IN + POP.for + 0.05) * 60); f++) {
    const s = Math.abs(popScale((f + 1) / 60) - popScale(f / 60)) * halfHead;
    if (s > d) { d = s; at = f / 60; }
  }
  let m = 0, mAt = SHRINK;
  for (let f = Math.floor(SHRINK * 60); f <= Math.ceil((SHRINK + MOVE_FOR) * 60); f++) {
    const a = moveAt(f / 60), b = moveAt((f + 1) / 60);
    const s = Math.abs(b.dy - a.dy) + Math.abs(b.sc - a.sc) * halfHead;
    if (s > m) { m = s; mAt = f / 60; }
  }
  console.log('\n  the fast things, at sixty');
  console.log('    the pop peaks at ' + d.toFixed(2) + ' css px a frame at ' + at.toFixed(3)
    + 's, against a ceiling of ' + STEP_CEIL + ' css px, and lands '
    + (d / SUB).toFixed(1) + ' css px between samples at ' + SUB + ' subframe'
    + (SUB === 1 ? '' : 's'));
  console.log('    the move peaks at ' + m.toFixed(2) + ' css px a frame at ' + mAt.toFixed(3) + 's');
}

const state = ONLY_ENCODE
  ? JSON.parse(fs.readFileSync(path.join(OUT, 'post26.json'), 'utf8'))
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

if (p.w !== VW * DSF || p.h !== VH * DSF) fail.push('not ' + VW * DSF + 'x' + VH * DSF);
if (Math.abs(p.fps - FPS) > 0.5) fail.push('not ' + FPS + 'fps');
if (Math.abs(p.seconds - SECONDS) > 0.25) fail.push(p.seconds + 's, wanted ' + SECONDS);
if (!p.audio) fail.push('no audio track — the reads did not mux');

/* ---------- the palette is still the site's, and there is no colour in it ----
   the one guard that reaches back into index.html. this clip draws in --fg,
   --muted, --bub and --bg and in nothing else, so the accent, the red and the
   amber must appear nowhere in the page it built. */
{
  const site = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dark = site.slice(site.indexOf('html[data-theme=dark]'));
  const accent = (dark.match(/--accent:\s*([^;]+);/) || [])[1];
  if (!accent) fail.push('index.html no longer declares a dark --accent, and this guard reads it');
  const built = sceneHtml(plan);
  const mine = built.slice(built.indexOf('==== this clip\'s own css starts here ===='));
  for (const [what, re] of [['the accent', /#35ff6a/i], ['a red', /--red|#ff5c5c/i],
  ['an amber', /#ffb020|--amber/i]]) {
    if (re.test(mine)) fail.push(what + ' appears in this clip\'s own css, and it draws in white only');
  }
  if (accent && mine.indexOf(accent.trim()) > -1) {
    fail.push('the site\'s accent ' + accent.trim() + ' appears in this clip\'s own css');
  }
}

/* ---------- nothing fringes but the wordmark ---------- */
if (!ONLY_ENCODE) {
  const bad = (state.glRules || []).filter(s => s.indexOf('.wm') < 0);
  if (bad.length) fail.push('the rgb split reaches ' + bad.join(', ') + ' and only the wordmark may fringe');
  if (!(state.glRules || []).length) fail.push('no [data-gl] rule was found at all — the fault draws no split');
}

/* ---------- him ---------- */
if (!ONLY_ENCODE) {
  if (state.built.mas.headPx < HEAD_PX.min || state.built.mas.headPx > HEAD_PX.max) {
    fail.push('the head rendered at ' + state.built.mas.headPx + 'px, window is '
      + HEAD_PX.min + ' to ' + HEAD_PX.max);
  }
  if (state.head.margin < -0.5) {
    fail.push('the head crosses the ' + state.head.side + ' band by '
      + (-state.head.margin).toFixed(1) + 'px at ' + state.head.t + 's, through the camera');
  }
  if (state.text.margin < -0.5) {
    fail.push(state.text.name + ' crosses the ' + state.text.side + ' band by '
      + (-state.text.margin).toFixed(1) + 'px at ' + state.text.t + 's, through the camera');
  }
  /* the pill, per side against that side's own band. it is measured with the
     camera off, and it is only on screen while the camera is within a twentieth
     of rest, so the page rect is the right one to judge it on. */
  for (const k of ['left', 'top', 'right', 'bottom']) {
    if (state.bubSafe[k] < SAFE[k] - 0.5) {
      fail.push('the pill is ' + state.bubSafe[k] + 'px off the ' + k + ' border, band is ' + SAFE[k]);
    }
  }
  if (state.pillText.text !== BUB_TEXT) {
    fail.push('the pill reads "' + state.pillText.text + '" and the copy is "' + BUB_TEXT + '"');
  }
  if (!state.pillText.inManrope) fail.push('the pill fell back off Manrope');
  if (state.built.box.capPx < BOX.minCapPx) {
    fail.push('the typed line\'s cap is ' + state.built.box.capPx + ' device px, floor ' + BOX.minCapPx);
  }
  if (state.built.report.capPx < RPT.minCapPx) {
    fail.push('the briefing\'s cap is ' + state.built.report.capPx + ' device px, floor ' + RPT.minCapPx);
  }
  if (state.built.cap.capPx < CAP.minCapPx) {
    fail.push('the caption\'s cap is ' + state.built.cap.capPx + ' device px, floor ' + CAP.minCapPx);
  }
  if (state.built.report.tallest > RPT.pitch - 3.5) {
    fail.push('a briefing line is ' + state.built.report.tallest + 'css tall in a ' + RPT.pitch + 'css slot');
  }
  if (state.built.wm < 1) fail.push('the wordmark never got a size');
  if (state.wm.widestPx > (WM.w + 0.5) * DSF) {
    fail.push('the wordmark is ' + state.wm.widestPx + ' device px wide, over ' + WM.w * DSF);
  }
  if (state.wm.capPx < WM.minCapPx) {
    fail.push('the wordmark cap is ' + state.wm.capPx + ' device px, floor ' + WM.minCapPx);
  }
  /* the camera, on the frames rather than on the keys: a key being legal and
     every instant between two keys being legal are not the same claim. */
  if (state.camPeak > CAM.ceil + 1e-4) {
    fail.push('the camera reached ' + state.camPeak + ', over its own ceiling of ' + CAM.ceil);
  }
  if (state.camStep > STEP_CEIL) {
    fail.push('the camera moves ' + state.camStep.toFixed(1) + ' css px a frame at '
      + state.camStepAt + 's, over ' + STEP_CEIL);
  }
  /* nothing is ever a still frame. */
  {
    let same = 0, at = 0;
    for (let i = 1; i < state.sigs.length; i++) {
      if (Math.abs(state.sigs[i] - state.sigs[i - 1]) < 1e-9) { same++; if (!at) at = i / FPS; }
    }
    if (same) fail.push(same + ' frames where nothing at all changed, from ' + at.toFixed(2) + 's');
  }
}

/* the plan itself: no hands, and only the two states the brief allows. */
{
  const got = plan.marks.map(m => m.state);
  if (got.join(',') !== 'delighted,neutral') {
    fail.push('the states are ' + got.join(', ') + ', wanted delighted then neutral');
  }
  for (const s of got) {
    if (s !== 'neutral' && s !== 'delighted') fail.push('"' + s + '" is not a calm or a happy state');
  }
  if (plan.hands || plan.hand) fail.push('the plan draws hands, and the brief rules them out');
  if (plan.marks.some(m => m.hands)) fail.push('a mark carries a hand pose, and the brief rules them out');
  for (const st of rep60.states) {
    if (st.entryFrames == null) fail.push(st.state + ' never reached its own mark');
    if (!(st.overshoot > 1)) fail.push(st.state + ' arrives with no overshoot');
  }
  if (rep60.poses.length) fail.push('the motion report has ' + rep60.poses.length + ' hand poses in it');
  if (rep60.outside.units > 0) {
    fail.push('feature ink lands ' + rep60.outside.units.toFixed(2) + ' units outside the head silhouette');
  }
  if (rep60.blinks.repeatsInARow) fail.push(rep60.blinks.repeatsInARow + ' blinks repeat the one before them');
  const inCap = plan.idle.blinks.filter(b => b.t >= CAP_AT && b.t < END.at);
  console.log('  blinks in the caption window: ' + inCap.length
    + (inCap.length ? ' at ' + inCap.map(b => b.t.toFixed(2)).join(', ') : ''));
  if (inCap.length !== 1) {
    fail.push('he blinks ' + inCap.length + ' times while the caption is up and the brief asks for one');
  }
  const onScreen = plan.idle.blinks.filter(b => b.t >= POP_IN && b.t < END.at);
  if (!onScreen.length) fail.push('he never blinks while he is on screen — walk the seed');
}

/* ---------- the reads, and the picture cut to them ---------- */
{
  if (takes[0].voice !== NARRATOR || takes[1].voice !== MASCOT_V) {
    fail.push('the two takes are not the narrator and the mascot');
  }
  if (elevenIdOf(MASCOT_V) !== 'mascot') fail.push('the mascot slot no longer asks for its own voice id');
  if (takes[0].provider === 'elevenlabs' && takes[1].provider === 'elevenlabs'
    && takes[0].voiceId === takes[1].voiceId) {
    fail.push('both reads came back on one voice id — the mascot is not a second clone');
  }
  if (takes.some(t => t.timing !== 'engine')) {
    fail.push('a take came back with estimated timings and the typing is cut to them');
  }
  /* the pill and the mascot's line are the same words. the read carries a stop
     and the pill does not, and that is the only character between them. */
  if (takes[1].text.replace(/\.$/, '') !== BUB_TEXT) {
    fail.push('the mascot says "' + takes[1].text + '" and the pill says "' + BUB_TEXT + '"');
  }
  if (takes[0].text !== COPY_Q) {
    fail.push('the narrator says "' + takes[0].text + '" and the box says "' + COPY_Q + '"');
  }
  if (Q.words.length !== COPY_Q.split(' ').length) {
    fail.push('the read has ' + Q.words.length + ' words and the question has '
      + COPY_Q.split(' ').length);
  }
  if (Q.at < 0.10) fail.push('the read starts at ' + Q.at + 's, with no frame to establish the box');
  if (MV_AT < BUB_POP - 1e-6) fail.push('he speaks before his pill is on the screen');
  if (MV_END > END.at) fail.push('he is still speaking when the fault takes him');
}

/* ---------- the typing ---------- */
{
  if (charsAt(Q.chars, Q.words[0].start - 0.01) !== 0) fail.push('the question started before the first word');
  if (charsAt(Q.chars, Q.end) !== COPY_Q.length) fail.push('the question is not finished on the last word');
  /* every character inside its own word's window, which is the whole of "the
     typing is the read". */
  {
    let j = 0, out = 0;
    for (let i = 0; i < Q.words.length; i++) {
      const n = Q.words[i].word.length + (i ? 1 : 0);
      for (let k = 0; k < n; k++, j++) {
        if (Q.chars[j] < Q.words[i].start - 1e-6 || Q.chars[j] > Q.words[i].end + 1e-6) out++;
      }
    }
    if (out) fail.push(out + ' characters of the question land outside their own spoken word');
  }
  if (charsAt(A.chars, A.end) !== COPY_A.length) fail.push('the answer is not finished at its own end');
  if (A.at < MV_END) fail.push('the box answers while he is still asking');
  for (const e of RP) {
    if (charsAt(e.chars, e.end) !== e.text.length) fail.push('briefing line ' + (e.i + 1) + ' never finishes');
    if (charsAt(e.chars, e.at - 0.01) !== 0) fail.push('briefing line ' + (e.i + 1) + ' starts early');
    if (e.at < PARKED - 1e-6) fail.push('briefing line ' + (e.i + 1) + ' types before he has parked');
  }
  if (RPT_END > CAP_AT) fail.push('the caption pops before the briefing has finished');
  /* the copy on the frame is the copy in this file, character for character. */
  const shown = REPORT.map(e => e.bright + e.rest);
  if (shown.length !== 6) fail.push('the briefing is ' + shown.length + ' lines and the brief asks for six');
  for (const s of shown) {
    if (/[—–]/.test(s) || /\s-\s/.test(s)) fail.push('a briefing line has a punctuation dash in it: "' + s + '"');
  }
  if (/[—–]/.test(COPY_Q + COPY_A + BUB_TEXT + CAPTION)) fail.push('a punctuation dash reached the copy');
}

/* ---------- the sound is where it says it is ---------- */
{
  const late = sfxReport.filter(r => r.t > SECONDS - 0.02);
  if (late.length) fail.push(late.length + ' cue(s) land past the end of the film');
  const keys = sfxReport.filter(r => r.kind === 'key');
  const wantKeys = RP.reduce((n, e) => n + e.words.length, 0);
  if (keys.length !== wantKeys) fail.push('there are ' + keys.length + ' key ticks and ' + wantKeys + ' words');
  const strays = keys.filter(r => r.t < RPT_AT - 1e-6 || r.t > RPT_END + 1e-6);
  if (strays.length) fail.push(strays.length + ' key tick(s) sound outside the briefing');
  const kinds = [...new Set(sfxReport.map(r => r.kind))].sort();
  const allowed = ['glitch', 'key', 'pop'];
  for (const k of kinds) if (!allowed.includes(k)) fail.push('an unexpected sound kind in the mix: ' + k);
  if (final.r.lufs < MIN_LUFS) {
    console.log('  quieter than ' + MIN_LUFS + ' LUFS: the peak ceiling won, which is what it is for');
  }
  if (lu && lu.ok && lu.truePeak > -1.0) fail.push('true peak ' + lu.truePeak + ' dBFS, ceiling is -1.0');
}

console.log('');
if (fail.length) {
  console.log('  ' + fail.length + ' thing(s) wrong:');
  for (const f of fail) console.log('    - ' + f);
  process.exitCode = 1;
} else {
  console.log('  every guard green.');
}
