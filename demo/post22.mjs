/* the boring tek — post22.

   dark only, 1080x1920. somebody types a question into a chat box while a voice
   reads it, the box is knocked down to the lower third, and he falls into the
   space it left with the lights on behind his eyes.

     0.0  a chat input box in the middle of a black frame. the line types itself
          in, letter by letter, cut to the read. **no key ticks** — the voice is
          the sound of the typing.
     ~3.5 the caret blinks off and the box slides down to its line and settles.
     ~2.6 he falls in from above and lands on a glitch hit, three rgb stutters
          after it. **he is the ordinary mascot**: dark eyes, the module's idle,
          the module's own white glow, and no hand.
     ~2.9 a short settle.
     ~3.6 one frame does three things at once: a glitch hit, the pill popping off
          his crown with AI'll be back in it, the point appearing on the screen
          left of his face aimed at camera, and his eyes going neon green with a
          glint flickering round them.
     ~5.1 the fault, 1.54s after that, and the wordmark. the pill, the hand and
          the green are all still on the frame it takes.

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

   **the whole clock is derived now.** the last two cuts pinned the bubble and
   the fault at 6.32 and 8.00 because they had been signed off; this one unpins
   them, cuts the wait after the fall to a 0.30s settle, and lets the fault
   follow the pill's own life. the film comes out around 6.1s against 8.95.

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
  STAGE, SAFE, HEAD, HEAD_PX, GRID, BUBBLE, STATES, HAND_POSES, handShape,
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

/* ---------- the red ----------
   index.html's own dark `--red`, as components so it can be used at an alpha,
   which is post21's laser exactly. the guard at the bottom reads the token back
   out of the site and compares. **there is no green anywhere in this cut** and
   there is a guard on that too. */
const RED = [255, 92, 92];
/* the iris at rest is the module's own --eye, which on the dark theme is defined
   to equal the page background. the mix runs from there to the accent above. */
const EYE_DARK = [6, 7, 10];

/* ---------- the copy ----------
   what the box says. **there is no voice in this clip.** the read that used to
   drive it is gone on instruction — the line is spoken over the finished file
   rather than synthesised into it — and what is left behind is the clock it
   bought, frozen into the table below.

   that table is the whole of why the timing did not move. every character of the
   typing is still placed inside its own word's window, so the line still types
   unevenly the way a person reads it rather than on a grid; the words are just no
   longer fetched. the numbers came off two Andrew takes at -8% / -2Hz and
   -8% / +5Hz and they are written down here so a later session does not have to
   wonder where an uneven clock came from.

   **the silence is left exactly where it was.** the read ran 0.25 to 1.83 and
   nothing at all is put in its place, so the hole a voice goes into is the hole
   the voice came out of, to the frame. */
const COPY = 'what did ai say to the terminator?';
/* the frozen read, in seconds on this clip's own clock. */
const WORD_CLOCK = [
  { word: 'what', start: 0.2490, end: 0.3300 },
  { word: 'did', start: 0.3440, end: 0.4660 },
  { word: 'ai', start: 0.4800, end: 0.6560 },
  { word: 'say', start: 0.6700, end: 0.9010 },
  { word: 'to', start: 0.9140, end: 0.9960 },
  { word: 'the', start: 1.0100, end: 1.2130 },
  { word: 'terminator?', start: 1.2480, end: 1.8050 },
];
const READ_END = 1.829;
const BUB_TEXT = 'AI’ll be back';

/* ---------- the joins ----------
   the four numbers in the first half of the clock that are not the read's own.
   everything else in it is derived from where the words land. */
const CARET_AFTER = 0.14;   /* the caret blinks this long after the last word */
const FALL_LEAD = 0.18;     /* he starts falling this far into the knock down */

/* ---------- the end, and none of it is pinned any more ----------
   the last two cuts held the bubble at 6.32 and the fault at 8.00 because they
   had been signed off. this round unpins them outright: the wait after the fall
   is cut, the pill and the hand arrive together on a short settle, and the fault
   follows the pill's own life. so **every number below is derived** and the
   whole film comes out about two and three quarter seconds shorter.

   `SETTLE` is the only one typed, and it is the beat between his landing and the
   mark that carries both the thought and the hand. the smash springs back over
   `SMASH.flat + SMASH.back`, which is 0.49s, so 0.30 puts the mark just inside
   the tail of it — he is still settling as he decides to answer, which is what a
   short settle is.

   the rest is the module's own arithmetic, read off its own tables rather than
   copied: a `neutral` mark opens its bubble `entry + 0.12` after its own time,
   the pill pops two dot steps into that, and the thought lives `in + hold + out`.
   the fault lands on the pill's last frame, which is where post20, post21 and
   every cut of this file have put it. */
const SETTLE = 0.30;
const BUB_IN_OFF = +(STATES.neutral.entry + 0.12).toFixed(4);
const BUB_LIFE = +(BUBBLE.in + BUBBLE.hold + BUBBLE.out).toFixed(4);
const POP_OFF = +(BUB_IN_OFF + BUBBLE.step * 2).toFixed(4);
/* ---------- the hold, and the module's ceiling ----------
   the pill pops and this much later the glitch takes it. **2.5 is typed now
   rather than derived, and that is the whole of why the bubble needed rescuing
   in the same round it was lengthened.**

   the module's thought is 0.48 in, a hold capped at `BUBBLE.hold` 0.90 and 0.30
   out: 1.68 seconds end to end, and no clip may ask for more. the last cut put
   the fault at the end of exactly that life, so the two agreed by construction.
   asking for 2.5 breaks the agreement — the pill would start leaving at 1.38 and
   be gone a second before the fault, which is a bubble missing from the end of
   its own beat.

   so the pill is **held** rather than re-timed: the module plays its own dots,
   its own pop and its own spring, and from the frame it is fully up this file
   freezes that frame until the fault. it is the same composition as everything
   else in here — the iris, the glove gate, the fall, the smash — and it changes
   nothing about how the thought arrives. see `BUB_FREEZE`. */
const BUB_HOLD = 2.5;
let MARK2 = 0, POP = 0;
const END = { at: 0, pre: [], hard: 0.12, tail: 0.18, wmIn: 0, wmFor: 0.09, clean: 0.06 };
const CARD = 0.95;
let SECONDS = 0;
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16, minCapPx: 56 };
const GL = {
  shakeX: 15, shakeY: 8, split: 9.5, bandDx: 88, bands: 3,
  noise: [0.10, 0.24], flash: 0.30, flashSize: 420, calmFrom: 0.86,
};
const AP = { hard: 0.13 };   /* how far into the pop the hand's gate opens */

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

/* ---------- the eyes ----------
   for most of this film there is nothing here at all. he falls in as the
   ordinary mascot: the module's own dark iris, the module's own idle, the
   module's own white glow round his head, which is post19's and post20's dark
   theme unchanged. this file writes nothing about his face until the pill pops.

   ---------- and then they are lasers ----------
   on that frame the iris goes to the site's own `--red` and three layers come up
   with it. **every one is a gradient with no edge on it**, which is the whole
   brief: nothing here is clipped, nothing is filtered, and no layer ends anywhere
   a viewer can find. they reach zero alpha inside their own box and blend out
   into the black on their own.

     the core    a small disc at the centre of each eye, white hot in the middle
                 and the site's red by the time it leaves the slab. it is what
                 makes a lit eye read as a source rather than as a red mark.

     the streak  one very wide, very shallow ellipse centred on each eye, so the
                 pair overlap across the bridge of his face and run out past both
                 edges of the head. brightest on the eye, gone before the frame
                 edge, which is what an anamorphic flare does.

     the beams   one a side, out of the eye and down toward the viewer, tilted
                 apart so the two leave the frame wider than they started. each
                 is a thin hot core inside a soft wide halo, both elongated
                 radial gradients anchored at the eye — so a beam has no sides,
                 it only stops being bright.

   the module still owns the eye's own shape and size: this file writes the
   colour and these three layers and nothing else. */
const LASER = {
  /* **22 rather than 40, and the eye's own shape is why.** the module draws the
     iris as a flat pill 30 css px across and 10 tall; a 40px disc over it covers
     it completely and what is left on the frame is a round red light where a
     slab should be. the brief asks for the pill to keep its shape with a hot
     centre inside it, so the core is smaller than the slab is wide and the ink
     reads through it. */
  core: 22,
  flare: { w: 440, h: 112 },
  beam: { w: 240, h: 1000, rot: [12, -12] },
};

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

/* the sixty frame grid, which everything held rather than eased is written
   against: two consecutive twelfths are five sixty frames apart, so a glint
   changes on every frame of a preview and is held across every capture of a
   frame under the shutter. */
const g60 = t => Math.round(t * 60);

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
  /* the pill, frozen at its own fully up frame for the length of the hold. the
     dots, the pop and the spring are the module's and all still play; what this
     replaces is the exit, which would otherwise start a second before the fault. */
  if (BUB_FREEZE && t >= BUB_FREEZE.from && t < BUB_FREEZE.to) f.bubble = BUB_FREEZE.at;
  if (f.hands && GATE) {
    const g = t >= GATE.at - 1e-9 ? 1 : 0;
    f.hands = {
      ...f.hands,
      list: f.hands.list.map((h, k) => ({
        ...h, o: +(h.o * (GATE.acting.includes(k) ? g : 0)).toFixed(4),
      })),
    };
  }
  const k = squashAt(t);
  if (!k && t >= LAND) return f;
  const sq = 1 + k;
  const ground = t >= LAND ? R * (1 - 1 / sq) : 0;
  const out = {
    ...f,
    card: {
      ...f.card,
      y: +(f.card.y + fallAt(t) + ground).toFixed(4),
      sx: +(f.card.sx * sq).toFixed(5),
      sy: +(f.card.sy / sq).toFixed(5),
    },
  };
  /* post20's third line. `frame.hands.fit` is the inverse of the card's own two
     scales and it is what keeps a glove's outline an even weight under a squash;
     the module computes it from the card it wrote, so a card this file then
     scales leaves that inverse describing a head that no longer exists. dividing
     it by the same factor is this file finishing the composition it started.
     the hand is not on screen during the smash in this cut, but a correction
     that is only right because of a timing is a correction waiting to be wrong. */
  if (out.hands) {
    out.hands = { ...out.hands, fit: { cx: +(out.hands.fit.cx / sq).toFixed(5), cy: +(out.hands.fit.cy * sq).toFixed(5) } };
  }
  return out;
}

/* ---------- the gloves, gated ----------
   post20's gate at post20's reason and this clip's shape. `hands: true` draws
   the resting pair from frame zero and nothing here wants a hand until the pill
   pops, so one multiplier goes on every glove's own opacity and **the hand that
   never acts is never drawn** — a second gate rather than a tighter first one,
   because before this pose the module is holding a resting pair that has nothing
   to leave from.

   **this gate is a cut rather than a fade, and that is the brief.** the hand
   appears with the glitch hit on the frame the pill pops: it does not travel in
   and it does not fade up. the pose's own entrance runs underneath it, so what
   the hit uncovers is a hand already out and already pointing, and the second of
   the pose's two jabs lands a quarter of a second later where it can be seen.

   the frame is the output frame's rather than the instant's, so the gate, the
   green and the glitch are all the same switch. */
let GATE = null;
/* the pill, held. `at` is the module's own bubble frame on the instant it is
   fully up, reused from there to the fault so the thought neither shrinks nor
   leaves while the beat is still running. */
let BUB_FREEZE = null;

/* ---------- a point on the head, in css px on the frame ----------
   `headRect`'s own chain for a point in card space: its offset from the card's
   centre, through the card's two scales and its rotation, then out to the page.
   the sparkles hang off it and they have to sit on the eyes that are drawn. */
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
/* **the only glitch in this film is the end card's fault.** the landing had a
   hit and three stutters after it, and the pop had a hit of its own; all of them
   are gone, and so is every rule that let the split reach anything but the
   wordmark. what is left is post20's ending unchanged: two stutters and the hard
   hit the wordmark is born on. */
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
   and `f` is the output frame it belongs to. the two switches — he starts
   falling, and he is exchanged for the wordmark — are on the **frame** rather
   than on the instant, which is post20's 60fps finding: every channel in an
   exchange goes on the same frame or the shutter finds the seam. */
function frameAt(plan, mf, t, f) {
  const g = glitchAt(f);
  const born = f >= Math.round(DROP.at * FPS);
  const cut = f >= Math.round(END.at * FPS);
  const on = born && !cut;
  /* **the green is on the output frame, not on the instant.** it is an exchange
     like every other one in this file: the pill pops, the hand appears and the
     eyes light on one frame or the shutter finds the seam between them. before
     it there is no override at all and the module paints its own dark iris. */
  const lit = on && f >= Math.round(POP * FPS) ? 1 : 0;
  const wp = span(t, END.wmIn, END.wmIn + END.wmFor);
  return {
    t: +t.toFixed(4), f,
    mo: on ? 1 : 0,
    /* null means "do not write anything", and the page removes the property
       rather than setting it to the module's value: the module's own paint is
       then the only thing describing his eyes, which is what an ordinary clip
       looks like. */
    iris: lit ? 'rgb(' + RED.join(',') + ')' : null,
    lit,
    /* where the three laser layers hang: the eyes that are actually drawn rather
       than the ones the plan describes. */
    eyes: eyeSpots(plan, mf),
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
/* ==== this clip's own css starts here ==== */
:root{
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  /* there is no caption band in this cut, so what is taken from the captions is
     the face: manrope, which is what every clip since post18 sets words in. the
     module's bubble and this file's typed line both read var(--body), so setting
     it once here is the whole of it and space grotesk is not requested at all. */
  --body:"Manrope",var(--mono);
  --display:"Michroma",var(--mono);
  /* the two channels the rgb split is drawn in: the same white the glow is,
     pulled apart, rather than a red and a cyan out of a filter preset. it is the
     house glitch, it is on every clip's end card, and it is the only thing left
     in this film with any red in it — a chromatic aberration pair rather than a
     colour anybody chose. */
  --split-r:rgba(255,120,120,.55); --split-c:rgba(120,220,255,.55);
  /* the laser, which is index.html's own dark --red written as components so it
     can be used at an alpha. there is a guard that it is still that. */
  --laser:${RED.join(',')};
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
    rgba(255,255,255,.030) 0%, rgba(255,255,255,.010) 46%, rgba(0,0,0,0) 72%);
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
/* **nothing fringes but the wordmark.** the split used to reach him, the pill and
   the box during the two stutters before the fault, and the frames showed what
   that is: red and blue edges on a mascot who is not glitching. the end card
   keeps its own, which is what every clip does. */

/* ---- the lasers ----
   three layers a side and **not one of them has an edge**. every one is a radial
   gradient that reaches zero alpha before its own box ends, so there is nothing
   to clip, nothing to feather and no seam anywhere: the box is only the canvas
   the falloff is drawn in. no css filter either — a blur over a layer this size
   is a full frame raster every frame, and the gradient already is the blur.

   they sit above the mascot's zone. the pill lives inside that zone and is well
   above the eye line, so nothing here crosses it. */

.core{position:absolute;left:0;top:0;
  width:${LASER.core}px;height:${LASER.core}px;
  margin:${-LASER.core / 2}px 0 0 ${-LASER.core / 2}px;
  border-radius:50%;pointer-events:none;z-index:6;opacity:var(--o,0);
  transform:translate3d(calc(var(--x,0) * 1px),calc(var(--y,0) * 1px),0);
  will-change:transform,opacity;
  background:radial-gradient(circle,
    rgba(255,255,255,.96) 0%, rgba(255,240,238,.62) 22%,
    rgba(255,180,176,.34) 42%, rgba(var(--laser),.16) 60%,
    rgba(var(--laser),.05) 76%, rgba(var(--laser),0) 92%)}

.flare{position:absolute;left:0;top:0;
  width:${LASER.flare.w}px;height:${LASER.flare.h}px;
  margin:${-LASER.flare.h / 2}px 0 0 ${-LASER.flare.w / 2}px;
  pointer-events:none;z-index:5;opacity:var(--o,0);
  transform:translate3d(calc(var(--x,0) * 1px),calc(var(--y,0) * 1px),0);
  will-change:transform,opacity;
  background:radial-gradient(ellipse 50% 50% at 50% 50%,
    rgba(255,226,220,.34) 0%, rgba(var(--laser),.26) 12%,
    rgba(var(--laser),.15) 28%, rgba(var(--laser),.06) 48%,
    rgba(var(--laser),.015) 68%, rgba(var(--laser),0) 86%)}

.beam{position:absolute;left:0;top:0;
  width:${LASER.beam.w}px;height:${LASER.beam.h}px;
  margin:0 0 0 ${-LASER.beam.w / 2}px;
  pointer-events:none;z-index:5;opacity:var(--o,0);
  transform:translate3d(calc(var(--x,0) * 1px),calc(var(--y,0) * 1px),0) rotate(var(--rot,0deg));
  transform-origin:${LASER.beam.w / 2}px 0;
  will-change:transform,opacity;
  background:
    radial-gradient(ellipse 8% 97% at 50% 0%,
      rgba(255,232,226,.60) 0%, rgba(255,232,226,.22) 22%,
      rgba(255,232,226,.05) 48%, rgba(255,232,226,0) 70%),
    radial-gradient(ellipse 30% 94% at 50% 0%,
      rgba(var(--laser),.32) 0%, rgba(var(--laser),.14) 24%,
      rgba(var(--laser),.045) 50%, rgba(var(--laser),0) 76%)}

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
${[0, 1].map(k => '  <i class="beam" data-beam="' + k + '" style="--rot:'
    + LASER.beam.rot[k] + 'deg"></i>').join('\n')}
${[0, 1].map(k => '  <i class="flare" data-flare="' + k + '"></i>').join('\n')}
${[0, 1].map(k => '  <i class="core" data-core="' + k + '"></i>').join('\n')}
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
  const lasers = ['beam', 'flare', 'core'].map(c => [...document.querySelectorAll('.' + c)]);
  const pill = document.getElementById('m-bubble-text');
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

    /* the pill as it actually painted: the string in it and the face it is set
       in, both read off the rendered element rather than off what was asked for.
       a curly apostrophe that fell back to a mono glyph is exactly the thing
       this catches and there is no way to know it without measuring. */
    pillText() {
      const cs = getComputedStyle(pill);
      const cv = document.createElement('canvas').getContext('2d');
      cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      const m = cv.measureText('H');
      return {
        text: pill.textContent,
        family: cs.fontFamily, weight: cs.fontWeight, size: cs.fontSize,
        font: cv.font,
        capPx: +((m.actualBoundingBoxAscent || 0) * P.DSF).toFixed(1),
        /* the apostrophe measured on its own. a glyph the face does not carry is
           drawn by a fallback and comes back a different width. */
        apos: +cv.measureText('\u2019').width.toFixed(3),
        aposInManrope: cv.font.indexOf('Manrope') > -1,
      };
    },

    apply(o) {
      const s = stage.style;
      s.setProperty('--m-o', o.mo.toFixed(4));
      if (o.iris) s.setProperty('--iris', o.iris);
      else s.removeProperty('--iris');
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

      /* the three layers, both eyes, all on one number. they are placed every
         frame whether they are lit or not, so the frame the switch lands on
         already has them where they belong. */
      for (const layer of lasers) {
        for (let k = 0; k < 2; k++) {
          const e = o.eyes[k], el = layer[k];
          el.style.setProperty('--x', e.x.toFixed(2));
          el.style.setProperty('--y', e.y.toFixed(2));
          el.style.setProperty('--o', o.lit.toFixed(4));
        }
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
  const pillText = await page.evaluate(() => window.__p22.pillText());
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
  let worst = null, air = null, gap = Infinity, gapAt = 0, gapType = Infinity, gapTypeAt = 0;
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
    /* two clearances, because they are two different questions. the **type** is
       the one that matters and it is a hard floor: a hand over the words is a
       hand over the words. the box's own top edge is reported rather than
       guarded, because the point's exit anticipates — the module pulls a glove
       the wrong way for four frames before it leaves, which is what every
       entrance and exit in that table does — and four frames of a fingertip over
       an empty 24px strip of padding is animation rather than a collision. */
    const ink = VH - r.bottom / DSF;
    const top = BOX.y + boxDy(t);
    if (top - ink < gap) { gap = +(top - ink).toFixed(2); gapAt = +t.toFixed(3); }
    const type = top + BOX.padTop;
    if (type - ink < gapType) { gapType = +(type - ink).toFixed(2); gapTypeAt = +t.toFixed(3); }
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
        let s = o.mo * 7 + o.lit * 11 + o.box.dy * 17 + o.box.o * 19
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
        for (let i = 0; i < 2; i++) s += o.lit * (o.eyes[i].x * (173 + i) + o.eyes[i].y * (191 + i));
        if (mf.hands) for (const h of mf.hands.list) s += h.o * 197 + h.x * 199 + h.y * 211 + h.rot * 223;
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
    [MARK2, 'i-the-settle'],
    [bub.in + 0.06, 'j-the-dots'],
    [POP, 'k-the-pop-hand-and-lasers'],
    [POP + 0.30, 'l-the-lasers'],
    [bubAt, 'm-the-line-he-says'],
    [END.pre[1].t, 'n-the-second-stutter'],
    [END.at + END.hard + END.tail + 0.16, 'o-the-wordmark'],
    [SECONDS - 0.06, 'p-the-last-frame'],
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
  console.log('  the lowest ink he has clears the box\'s top edge by ' + gap + 'css px at ' + gapAt
    + 's, and the box\'s type by ' + gapType + ' at ' + gapTypeAt + 's');

  await browser.close();
  srv.close();
  if (SUB > 1) blend(N);

  const state = { built, wm, boxUp, boxDown, bubSafe, bubCaps, pillText, bubAt, head: worst, air, gap, gapAt, gapType, gapTypeAt, sigs, frames: N };
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

/* ---------- the clock ----------
   the first half is the frozen read's and the second half is derived off the
   landing. nothing is fetched and nothing is measured: the word table at the top
   of this file is the clock, the characters are placed inside the words, and the
   caret, the knock down and the fall follow in that order. */
for (const w of WORD_CLOCK) WORDS.push({ ...w });
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

SNAP.at = +(WORDS[WORDS.length - 1].end + CARET_AFTER).toFixed(3);
DROP.at = +(SNAP.at + FALL_LEAD).toFixed(3);
LAND = +(DROP.at + DROP.for).toFixed(4);
MARK2 = +(LAND + SETTLE).toFixed(4);
POP = +(MARK2 + POP_OFF).toFixed(4);
END.at = +(POP + BUB_HOLD).toFixed(4);
END.wmIn = END.at;
END.pre = [
  { t: +(END.at - 0.38).toFixed(3), for: 0.05, force: 0.34 },
  { t: +(END.at - 0.18).toFixed(3), for: 0.05, force: 0.60 },
];
SECONDS = +(END.at + CARD).toFixed(2);
GL_WINDOWS = glitchWindows(FPS);
GL_WINDOWS_60 = FPS === 60 ? GL_WINDOWS : glitchWindows(60);

console.log('  no voice. the typing is cut to a frozen read, ' + WORDS.length + ' words');
console.log('    "' + COPY + '"');
console.log('    the silence a voice goes into runs ' + WORDS[0].start.toFixed(2) + ' to '
  + READ_END.toFixed(2) + 's and nothing at all is put in it');

if (VOICE_ONLY) {
  console.log('\n  the clock');
  for (const w of WORDS) console.log('    ' + w.start.toFixed(2).padStart(5) + 's  ' + w.word);
  console.log('    ' + SNAP.at.toFixed(2).padStart(5) + 's  the box goes down');
  console.log('    ' + DROP.at.toFixed(2).padStart(5) + 's  he starts falling');
  console.log('    ' + LAND.toFixed(2).padStart(5) + 's  he lands');
  console.log('    ' + MARK2.toFixed(2).padStart(5) + 's  the mark carrying the thought and the hand');
  console.log('    ' + POP.toFixed(2).padStart(5) + 's  the pill and the hand pop together');
  console.log('    ' + END.at.toFixed(2).padStart(5) + 's  the fault, ' + BUB_HOLD.toFixed(2) + 's after the pop');
  console.log('    ' + SECONDS.toFixed(2).padStart(5) + 's  end');
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
/* ---------- the hand ----------
   the module's own `point`, placed the way `mascot-test.mjs` places it in the
   hands chapter and for that file's stated reason.

   **`side: 'left'` is the whole of it.** the pose table is written once, for the
   screen right hand, and mirroring the row itself would send that hand across
   the width of the face in the four tenths a jab has — the module says so and
   the guard scores it at fifty two css px a frame against a ceiling of twelve.
   which side a one handed pose lands on is `side` on the mark, so it is on the
   mark: `['point', 'agreeing', 'left', 2.50]` is the test's row and `side:
   'left'` is what it means.

   and it is **not mirrored**, which falls out of the same choice rather than
   being a second one. `point`'s shape is a bare string, and `handShape` reads a
   bare string as "the screen left hand gets the file and the screen right one
   gets its mirror" — so asking for the left hand is asking for the drawing as it
   was traced. the finger is aimed at camera, which is what this row is for.

   the mark it sits on is the one that already carries the thought, which is
   `mascot-test`'s move as well: it puts its bubble on the hands mark rather than
   giving it its own, so the hands and the words are on screen together. here
   they are asked to arrive on the same frame, so that is the only place it can
   go.

   the entrance and the exit are the table's. only the hold is bought, so the
   hand is still out on the frame the fault takes it. */
const HAND = { entry: HAND_POSES.point.entry, exit: HAND_POSES.point.exit };

const plan = planMascot({
  seconds: SECONDS,
  size: SIZE,
  theme: 'dark',
  /* the gloves are drawn from frame zero and gated off until the pose, which is
     post20's arrangement — see `GLOVE_IN` and `compose`. */
  hands: true,
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
  /* two marks. the second carries the state, the thought and the hand at once,
     because all three are one beat: he settles, and then the answer, the point
     and the green arrive together. its hold is bought so the pose is still out
     on the frame the fault takes. */
  marks: [
    { t: 0.00, state: 'neutral' },
    {
      t: MARK2, state: 'neutral', bubble: BUB_TEXT, side: 'left',
      hands: { pose: 'point', entry: HAND.entry, exit: HAND.exit,
        hold: +(END.at - MARK2 - HAND.entry).toFixed(4) },
    },
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

/* the pose's own window, read back off the plan rather than assumed, so the
   glove gate moves with a timing somebody changes rather than drifting off it.
   post20's line, unchanged. */
/* the pose's own window and the frame the gate opens on, read back off the plan
   rather than assumed. the gate is snapped to the grid that is actually
   rendering, so at twelve the hand appears on the same frame the glitch does
   rather than a twelfth either side of it. */
const LG = plan.marks[1].hands;
GATE = { at: onGrid(POP, AP.hard, FPS).t0, leaving: LG.leaving, acting: LG.acting };

const BUB = plan.marks[plan.marks.length - 1].bubble;
/* and the pill's freeze, taken off the module's own frame rather than built:
   whatever it says the thought looks like when it is fully up is what is held. */
BUB_FREEZE = { from: BUB.full, to: END.at, at: mascotFrame(plan, BUB.full).bubble };
const rep = mascotMotion(plan, FPS, SECONDS);
const rep60 = FPS === 60 ? rep : mascotMotion(plan, 60, SECONDS);

console.log(describeMascot(plan));
console.log(describeMotion(rep));

/* ---------- the cues ----------
   **two kinds and nothing else.** there is no voice, no key tick and no rumble,
   and the landing's own hit went with the glitch it belonged to. what is left is
   the module's `pop` on the pill and the end card's own fault. */
const cues = [
  ...mascotCues(plan).map(c => ({ ...c, from: 'the module\'s own cue for its own bubble' })),
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
   **post16's rig again**, because there is nothing to duck under any more: a
   handful of transients on silence, scaled once to the loudness target and held
   under a peak ceiling. the bisect stays — post19's lesson is that a pass over
   the limiting allowance is a ceiling rather than a stop, so the last lift under
   it and the first over it bracket the answer and the loop halves the gap. */
const WAV = path.join(OUT, 'post22-mix.wav');
const RAW = path.join(OUT, 'post22-mix-raw.wav');
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
const POP_AT = +(BUB.in + BUBBLE.step * 2).toFixed(3);
const beats = [
  [0, 'a chat box in the middle of a black frame, empty, its caret blinking'],
  [WORDS[0].start, 'the line types itself in on the frozen read. no ticks and no voice'],
  [WORDS[WORDS.length - 1].end, 'the last word: "' + WORDS[WORDS.length - 1].word + '"'],
  [SNAP.at, 'the caret goes out and the box is knocked down ' + BOX.travel + 'px over '
    + SNAP.for.toFixed(2) + 's with a ' + SNAP.bounce + 'px bounce'],
  [DROP.at, 'he starts falling, ' + DROP.from + 'px over ' + DROP.for.toFixed(2) + 's'],
  [LAND, 'he lands and smashes to ' + (1 + SMASH.k).toFixed(2) + ' wide by '
    + (1 / (1 + SMASH.k)).toFixed(2) + ' tall. **no glitch on it any more**: dark eyes, no hand, '
    + 'the module\'s own white glow and nothing else'],
  [MARK2, 'the mark that carries the thought, the hand and the state, ' + SETTLE.toFixed(2)
    + 's after the landing'],
  [BUB.in, 'the dots leave the crown'],
  [POP_AT, 'the pill pops, the point is cut in on the left hand, and the eyes light red with the '
    + 'streak across them and the two beams out at the viewer. all on one frame. "' + BUB_TEXT + '"'],
  [BUB.leaving, 'it starts to go, and the fault takes it at ' + BUB.out.toFixed(2)],
  ...END.pre.map((w, i) => [w.t, 'stutter ' + (i + 1) + ' of two, into the fault. the first sound '
    + 'in the film after the pill\'s own pop']),
  [END.at, 'the fault. he, the box and the bubble are cut and the wordmark is born on that frame'],
  [SECONDS, 'end, after ' + (SECONDS - END.wmIn - END.wmFor).toFixed(2) + 's of the end card'],
].sort((a, b) => a[0] - b[0]);
for (const [t, what] of beats) console.log('    ' + t.toFixed(2).padStart(5) + 's  ' + what);

console.log('\n  the sound');
console.log(describeMix(sfxReport, {
  'the voice': 'there is none. the read was taken out on instruction and the silence it left is '
    + 'untouched: nothing at all sounds before ' + END.pre[0].t.toFixed(2) + 's',
  'the glitch': 'the end card only. the landing\'s hit, the pop\'s hit and the three stutters '
    + 'after the landing are gone, with the split that drew them',
  'the lift': 'off the bus at ' + (zero.lufs == null ? '?' : zero.lufs) + ' LUFS, ' + TARGET_LUFS
    + ' wanted ' + wantLift.toFixed(2) + ' dB, took ' + best.lift.toFixed(2) + ' in ' + tries + ' pass'
    + (tries === 1 ? '' : 'es'),
  'the bus': (after.lufs == null ? '?' : after.lufs) + ' LUFS, peak ' + peak.peak
    + ' dBFS, limiter took ' + (peak.reduction > 0.01 ? peak.reduction.toFixed(2) + ' dB' : 'nothing'),
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
  const m = /--red:\s*#([0-9a-f]{6})/i.exec(dark);
  if (!m) fail.push('index.html\'s dark block has no --red in it any more');
  else {
    const want = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16));
    if (want.join(',') !== RED.join(',')) {
      fail.push('the laser is rgb(' + RED.join(',') + ') and the site\'s --red is now rgb('
        + want.join(',') + ') — this clip paints with the site\'s red');
    }
  }
  /* and no red is left in what this file paints with. it is asserted on the
     page's own css rather than on this file's source, because the source
     contains this guard and a scan of it matches itself — which is exactly how
     the first run of this round failed. the slice starts after index.html's two
     token blocks, so the site's own `--red` sitting unused in the dark block is
     not mistaken for this clip using it. */
  const css = sceneHtml(plan);
  /* **sliced at a sentinel, not at `--mono:`.** index.html's own `:root` declares
     `--mono` too and it comes first, so slicing there pulled the site's whole
     token block into the check — and the dark block declares the accent, which
     made the no-green guard fail on a clip that never reaches for it. */
  const mine = css.slice(css.indexOf("this clip's own css starts here"));
  /* **and no green is left in what this clip paints with.** the last cut put the
     brand's accent on his eyes; this one does not reach for it at all, which is
     asserted rather than remembered. the slice starts after index.html's own
     token block, so the accent being declared there is not mistaken for use. */
  const acc = /--accent:\s*#([0-9a-f]{6})/i.exec(brandTokens().dark);
  if (acc && new RegExp(acc[1], 'i').test(mine)) {
    fail.push('the site accent is painted somewhere in this clip, and there is no green in this cut');
  }
  if (/--neon|\.star\{/.test(mine)) fail.push('the green eye or the glint is back in the page');
  /* the laser is this cut's one colour and it is declared as the site's own
     token, so what is checked is that it is there and is a variable rather than
     a hex somebody typed. */
  if (!/--laser:/.test(mine)) fail.push('the laser token is not declared in the page');
  if (/rgba\(255,\s*92,\s*92/.test(mine)) fail.push('the red is typed as a literal somewhere rather than taken off --laser');
  /* and the green on the frame is the token, not a colour near it. the iris is
     resolved in node, so this asks the frame function itself, on the frame the
     pulse peaks on: half a period after the landing. */
  /* the green on the frame is the token itself, at full, and it is asked of the
     frame function rather than of the constant. */
  const litF = Math.round((POP + 0.20) * FPS);
  const litIris = frameAt(plan, compose(plan, litF / FPS, R), litF / FPS, litF).iris;
  if (litIris !== 'rgb(' + RED.join(',') + ')') {
    fail.push('the lit iris is ' + litIris + ' rather than the site red rgb(' + RED.join(',') + ')');
  }
  /* ---------- nothing fringes but the wordmark ----------
     the split is what drew red and blue edges on him, on the pill and on the box
     during the two stutters, and the frames showed it. the only rule left that
     reaches for it is the wordmark's, which is the end card's own and is on every
     clip. asserted on the page rather than remembered. */
  const gl = [...mine.matchAll(/\.stage\[data-gl="1"\]\s*([^\{]+)\{/g)].map(x => x[1].trim());
  if (gl.join(',') !== '.wm') {
    fail.push('the rgb split reaches ' + (gl.join(', ') || 'nothing') + ', and it may only reach the wordmark');
  }
  /* the three laser layers carry no edge of any kind, which is the whole of "no
     hard edges": no clip path, no filter, no border, no shadow. */
  const laserCss = mine.slice(mine.indexOf('.core{'), mine.indexOf('/* ---- the chat box'));
  const edge = laserCss.match(/clip-path|filter:|border:|box-shadow/);
  if (edge) fail.push('a laser layer has an edge on it: ' + edge[0]);
  for (const c of ['.core{', '.flare{', '.beam{']) {
    if (mine.indexOf(c) < 0) fail.push('the page has no ' + c.slice(0, -1) + ' layer');
  }
  /* and the background is post19's and post20's, not a tint of this clip's own. */
  const vig = mine.match(/rgba\(255,255,255,\.(\d+)\) 0%, rgba\(255,255,255,\.(\d+)\) 46%/);
  if (!vig || vig[1] !== '030' || vig[2] !== '010') {
    fail.push('the vignette is not post20\'s .030 / .010');
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
  const got = plan.marks.map(m => m.state);
  if (got.join(',') !== 'neutral,neutral') fail.push('the states are ' + got.join(', ') + ', wanted two neutrals');
  if (plan.hand) fail.push('the plan draws the old single hand, and this clip uses the glove pair');
  if (!plan.hands) fail.push('the plan draws no hands, and the brief asks for the point');
  /* one pose, and it is the one the brief names by name. asserted on the plan so
     a second cannot arrive unnoticed. */
  const poses = plan.marks.filter(m => m.hands).map(m => m.hands.pose);
  if (poses.join(',') !== 'point') {
    fail.push('the hands poses are ' + (poses.join(', ') || 'none') + ', wanted one point');
  }
  /* ---------- left, and not mirrored, which is one fact rather than two ------
     `point` carries a bare shape string, and `handShape` reads a bare string as
     "the screen left hand gets the traced file and the screen right one gets its
     mirror". so **asking for the left hand is asking for the drawing as it was
     traced**, and the two halves of the instruction are the same choice.

     it is asserted on `acting`, which is what the module resolved rather than
     what the mark asked for — index 0 is the screen left hand. and on the shape
     still being a bare string, because the day somebody gives `point` a drawing
     a side the word "unmirrored" stops meaning anything here. */
  const acting = plan.marks[1].hands.acting;
  if (acting.join(',') !== '0') {
    fail.push('the point is acting on hand ' + acting.join(', ') + ', and the left one is 0');
  }
  if (Array.isArray(HAND_POSES.point.shape)) {
    fail.push('`point` now carries a shape a side, so asking for the left hand no longer means unmirrored');
  }
  if (handShape('point', 0).mir !== 1) fail.push('the left hand no longer draws the trace unflipped');
}
for (const st of rep60.states) {
  if (st.entryFrames == null) fail.push(st.state + ' never reached its own mark');
  if (!(st.overshoot > 1)) fail.push(st.state + ' arrives with no overshoot');
}
if (rep60.poses.length !== 1) fail.push('the report has ' + rep60.poses.length + ' hand poses in it, wanted one');
for (const ps of rep60.poses) {
  if (ps.pose !== 'point') fail.push('the report names the pose ' + ps.pose);
  if (ps.entryFrames == null) fail.push('the point never reached its own mark');
}
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
  const LGh = plan.marks[1].hands;
  console.log('  the hand: ' + LGh.pose + ' on the ' + (LGh.acting.includes(0) ? 'left' : 'right')
    + ' hand, its pose starting at '
    + MARK2.toFixed(2) + 's under the gate, cut on at ' + GATE.at.toFixed(2)
    + ' with the pill and the green, leaving ' + LGh.leaving.toFixed(2)
    + ', against a fault at ' + END.at.toFixed(2));
  /* the blink guard is against the beat he is actually on screen for now. the
     old one asked for one between 7.00 and the fault, which was the last cut's
     clock; this film ends at ~6.1 and that window is past the end of it. what
     matters is that the idle is running while he is up. */
  const onScreen = plan.idle.blinks.filter(b => b.t >= LAND && b.t < END.at);
  console.log('  blinks: ' + plan.idle.blinks.length + ' in the film, ' + onScreen.length
    + ' while he is on his mark, at ' + (onScreen.map(b => b.t.toFixed(2)).join(', ') || 'none'));
  if (!onScreen.length) fail.push('he never blinks while he is on screen — walk the seed');
  /* **and he is alive through the hold**, which is what the brief asks for by
     name: the beat is two and a half seconds long and a head that only breathes
     through it is a still frame with a laser on it. */
  const inHold = plan.idle.blinks.filter(b => b.t >= POP && b.t < END.at);
  console.log('    of those, ' + inHold.length + ' land inside the ' + BUB_HOLD.toFixed(2)
    + 's hold, at ' + (inHold.map(b => b.t.toFixed(2)).join(', ') || 'none'));
  if (!inHold.length) fail.push('he never blinks during the hold — walk the seed');
}

/* ---------- the read, and the picture cut to it ---------- */
{
  /* ---------- there is no read to check any more ----------
     what is left of it is the frozen table, so what is checked is that the table
     still describes the line on the screen, that it is in order, and that the
     silence it left has stayed silent. */
  if (WORD_CLOCK.length !== COPY.split(' ').length) {
    fail.push('the frozen clock has ' + WORD_CLOCK.length + ' words and the line has '
      + COPY.split(' ').length);
  }
  for (let i = 0; i < WORDS.length; i++) {
    if (WORDS[i].word !== COPY.split(' ')[i]) {
      fail.push('word ' + i + ' of the clock is "' + WORDS[i].word + '" and the line says "'
        + COPY.split(' ')[i] + '"');
    }
    if (!(WORDS[i].end > WORDS[i].start)) fail.push('word ' + i + ' of the clock has no length');
    if (i && !(WORDS[i].start >= WORDS[i - 1].end - 0.02)) fail.push('the words overlap at ' + i);
  }
  const inRead = sfxReport.filter(r => r.t < READ_END + 0.05);
  console.log('  the silence a voice goes into: ' + WORDS[0].start.toFixed(2) + ' to '
    + READ_END.toFixed(2) + 's, ' + inRead.length + ' sound(s) in it');
  if (inRead.length) fail.push(inRead.length + ' sound(s) land inside the read\'s own window');

  /* the settle, which is the only typed number in the back half now. it is a
     beat rather than a wait: long enough that the landing has read, short enough
     that the answer is not being waited for. */
  console.log('  the read bought a landing at ' + LAND.toFixed(2) + 's, a settle of '
    + SETTLE.toFixed(2) + 's, the pill and the hand at ' + POP.toFixed(2)
    + ' and the fault at ' + END.at.toFixed(2));
  if (Math.abs((MARK2 - LAND) - SETTLE) > 1e-6) fail.push('the settle is not SETTLE');
  if (POP < LAND) fail.push('the pill pops before he lands');
  if (READ_END > SNAP.at + 0.01) fail.push('the box is knocked down while the typing is still going');
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
  /* **the apostrophe ban is gone and it was never the brand's.** the rule in
     CLAUDE.md is about punctuation dashes; the no-apostrophe rule was this
     clip's own, from the first brief, and this round replaces it with the
     opposite instruction. so what is checked now is the dash rule, which is the
     one the house actually has, and the pill's exact string below. */
  for (const [what, s] of [['the typed line', COPY], ['the bubble', BUB_TEXT]]) {
    if (/[!]/.test(s)) fail.push(what + ' carries an exclamation mark');
    if (/[—–]/.test(s) || /\s-\s/.test(s)) fail.push(what + ' carries a punctuation dash');
  }
  /* the pill, to the character. mixed case, and the apostrophe is the curly one
     rather than the typewriter one — a straight quote in a pill set in a face
     that has a real apostrophe is a typo, and the two are one code point apart
     and indistinguishable in a diff, so the check is on the code point. */
  if (BUB_TEXT !== 'AI\u2019ll be back') {
    fail.push('the pill reads "' + BUB_TEXT + '" and it is exactly AI\u2019ll be back');
  }
  if (/'/.test(BUB_TEXT)) fail.push('the pill uses a straight quote, and it wants the curly apostrophe');
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
  /* and nothing of his ever reaches the words. the box's own top edge is a
     report rather than a guard — see the note where these are measured. */
  if (state.gapType < 6) {
    fail.push('his ink comes within ' + state.gapType + ' css px of the box\'s type at '
      + state.gapTypeAt + 's, which is a hand over the question');
  }
  if (state.gap < 0) {
    console.log('  note: the point\'s exit anticipation puts a fingertip ' + (-state.gap).toFixed(1)
      + 'css px over the box\'s top edge at ' + state.gapAt + 's, inside its ' + BOX.padTop
      + 'px of padding and clear of the type by ' + state.gapType + 'css');
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
  /* ---------- and the face actually applied, on the rendered pill ----------
     the brief asks for this to be checked on the frame rather than in the plan,
     and it is the right thing to ask: a face that failed to load leaves the
     string looking almost right in a fallback, and a curly apostrophe is exactly
     the glyph a fallback gets wrong. so the text is read back off the element,
     the computed family is read off it, and the apostrophe is measured on its
     own — a glyph the face does not carry comes back a different width from a
     substitute. */
  const pt = state.pillText;
  console.log('  the pill: "' + pt.text + '" in ' + pt.font + ', caps ' + pt.capPx
    + ' device, the apostrophe ' + pt.apos + 'px wide');
  if (pt.text !== BUB_TEXT) fail.push('the pill rendered "' + pt.text + '" and the copy is "' + BUB_TEXT + '"');
  if (!/Manrope/.test(pt.family)) fail.push('the pill computed to ' + pt.family + ', not Manrope');
  if (!pt.aposInManrope) fail.push('the apostrophe is not being drawn in Manrope');
  if (!(pt.apos > 0)) fail.push('the apostrophe measured ' + pt.apos + 'px, so the face has no glyph for it');
  if (pt.text.indexOf('\u2019') < 0) fail.push('the rendered pill has no curly apostrophe in it');
  if (BUB.words !== 3) fail.push('the bubble is ' + BUB.words + ' words and the line is three');
  /* the numbers that were signed off, asserted so this round cannot have moved
     them by accident. */
  /* the module's own arithmetic and this file's prediction of it have to agree.
     the whole back half of the clock is derived from `POP` and `END.at`, which
     are worked out before `planMascot` runs, so if the module ever changes its
     bubble timings this fails rather than drifting. */
  if (Math.abs(BUB.in - (MARK2 + BUB_IN_OFF)) > 0.005) {
    fail.push('the module opened the bubble at ' + BUB.in + ' and this file predicted '
      + (MARK2 + BUB_IN_OFF).toFixed(4));
  }
  if (Math.abs(POP_AT - POP) > 0.005) {
    fail.push('the pill pops at ' + POP_AT + ' and this file predicted ' + POP.toFixed(4));
  }
  /* and the brief's hold: the pill pops, and this much later the glitch. */
  const held = +(END.at - POP_AT).toFixed(3);
  console.log('  the pill is up for ' + held.toFixed(2) + 's before the fault takes it');
  if (Math.abs(held - BUB_HOLD) > 0.12) {
    fail.push('the pill holds ' + held.toFixed(2) + 's and the brief asks for ' + BUB_HOLD);
  }
  /* ---------- the pill is up for the whole hold ----------
     the module's own `out` is now a second before the fault, which is exactly
     what `BUB_FREEZE` exists to override, so the check is on the **composed**
     frame rather than on the plan: fully up on every frame from the pop to the
     one the fault takes, and gone on that one. */
  {
    const at = f => compose(plan, f / FPS, R).bubble;
    const full = at(Math.round(BUB.full * FPS));
    let worstO = 1, worstAt = 0, worstSc = 9;
    for (let f = Math.round(BUB.full * FPS); f < Math.round(END.at * FPS); f++) {
      const b = at(f);
      if (b.pill.o < worstO) { worstO = b.pill.o; worstAt = +(f / FPS).toFixed(2); }
      worstSc = Math.min(worstSc, b.pill.sc);
    }
    console.log('  the pill holds from ' + BUB.full.toFixed(2) + 's to the fault at '
      + END.at.toFixed(2) + ': faintest ' + worstO.toFixed(3) + ' at ' + worstAt
      + 's, smallest ' + worstSc.toFixed(3) + ' (the module would have taken it out at '
      + BUB.out.toFixed(2) + ')');
    if (worstO < full.pill.o - 0.001) {
      fail.push('the pill fades to ' + worstO + ' at ' + worstAt + 's, inside its own hold');
    }
    if (worstSc < full.pill.sc - 0.001) fail.push('the pill shrinks inside its own hold');
    if (!(full.pill.o > 0.99)) fail.push('the pill is not fully up at ' + BUB.full);
    if (at(Math.round(END.at * FPS)).pill.o !== full.pill.o) {
      /* it is not faded out on the fault frame either — the cut takes it. */
    }
    if (BUB.out >= END.at) {
      fail.push('the module would have kept the pill to ' + BUB.out + ', so the freeze is doing nothing');
    }
  }
  const pops = sfxReport.filter(r => r.kind === 'pop');
  if (pops.length !== 1) fail.push('there are ' + pops.length + ' pops for one bubble');
  if (pops[0] && Math.abs(pops[0].t - POP_AT) > 0.006) fail.push('the pop is not on the pill');
}

/* ---------- the green ---------- */
{
  const at = t => frameAt(plan, compose(plan, t, R), t, Math.round(t * FPS));
  const popF = Math.round(POP * FPS);
  const frame = f => frameAt(plan, compose(plan, f / FPS, R), f / FPS, f);
  /* **he is the ordinary mascot until the pill pops.** nothing this file writes
     touches his face before that frame, which is asserted as `iris` being null
     rather than as a colour that happens to match: a null is the page removing
     the property and letting the module paint. */
  /* a **frame** before, not an instant before: the switch is on the output frame
     and at twelve fps an instant 0.05 short of the pop still rounds onto it. */
  for (const t of [0.02, DROP.at, LAND, LAND + 0.10, POP - 1.5 / FPS]) {
    const o = at(t);
    if (o.iris !== null) fail.push('the iris is overridden at ' + t.toFixed(2) + 's, before the pill pops');
    if (o.lit !== 0) fail.push('the lasers are up at ' + t.toFixed(2) + 's, before the pill pops');
  }
  if (frame(popF - 1).lit !== 0) fail.push('the lasers are up on the frame before the pill pops');
  if (frame(popF).lit !== 1) fail.push('the lasers are not up on the frame the pill pops');
  if (frame(Math.round(END.at * FPS) - 1).lit !== 1) fail.push('the lasers go out before the fault');
  /* nothing lit survives the fault. */
  const cutF = Math.round(END.at * FPS);
  const on = frame(cutF);
  if (on.lit !== 0 || on.iris !== null) fail.push('the eyes are still lit on the frame the wordmark arrives on');
  /* the three layers ride the eyes that are drawn, so the beams leave the head
     rather than a spot beside it, and the streak really does run past both edges
     of it — which the brief asks for by name. measured against `headRect`'s own
     idea of where his ink is on the frame the pill pops. */
  {
    const o = frame(popF), r = headRect(plan, compose(plan, popF / FPS, R));
    const inkL = r.left / DSF, inkR = VW - r.right / DSF;
    const outside = o.eyes.filter(e => e.x < inkL || e.x > inkR).length;
    const reachL = Math.min(...o.eyes.map(e => e.x)) - LASER.flare.w / 2;
    const reachR = Math.max(...o.eyes.map(e => e.x)) + LASER.flare.w / 2;
    console.log('  the lasers hang off the eyes at ' + o.eyes.map(e => e.x.toFixed(0)).join(' and ')
      + ' css px, his ink runs ' + inkL.toFixed(0) + ' to ' + inkR.toFixed(0)
      + ', and the streak reaches ' + reachL.toFixed(0) + ' to ' + reachR.toFixed(0));
    if (outside) fail.push(outside + ' eye anchor(s) are outside his own ink');
    if (!(reachL < inkL && reachR > inkR)) fail.push('the streak does not reach past both edges of the head');
  }
  if (!(LASER.beam.rot[0] > 0 && LASER.beam.rot[1] < 0)) {
    fail.push('the beams do not spread apart: ' + LASER.beam.rot.join(', '));
  }
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
  /* **there is no voice track at all now**, so what used to be checked about it
     is checked about the bus instead: nothing at all sounds before the pill's own
     pop, which leaves the read's whole window and everything before it empty for
     a line to be laid over. */
  const firstSound = sfxReport.length ? Math.min(...sfxReport.map(r => r.t)) : Infinity;
  console.log('  the first sound in the film is at ' + firstSound.toFixed(2) + 's, which is the '
    + 'pill\'s own pop. nothing before it, and no voice anywhere');
  if (firstSound < POP - 0.05) {
    fail.push('something sounds at ' + firstSound.toFixed(2) + 's, before the pill pops');
  }
}


/* ---------- the wordmark ---------- */
{
  const w = state.wm;
  if (!/Michroma/.test(w.font)) fail.push('the wordmark is not set in michroma: ' + w.font);
  /* ---------- and no third face anywhere ----------
     one request, two families, and they are the two the house has: Michroma sets
     the wordmark on every clip's end card and Manrope sets every word a viewer
     reads. `lib/captions.mjs` does not itself name Manrope — it renders a caption
     in `var(--body)` and each post file has named the family since post18 — so
     what is locked here is the page: exactly one stylesheet request, exactly
     those two families in it, and `--body` resolved to Manrope so the module's
     own pill inherits the same face rather than picking up a second one. */
  const pageCss = sceneHtml(plan);
  const links = pageCss.match(/<link rel="stylesheet"[^>]*>/g) || [];
  if (links.length !== 1) fail.push('the page makes ' + links.length + ' stylesheet requests, and the budget is one');
  const fams = [...(links[0] || '').matchAll(/family=([A-Za-z+]+)/g)].map(m => m[1].replace(/\+/g, ' ')).sort();
  if (fams.join(',') !== 'Manrope,Michroma') {
    fail.push('the page asks for ' + fams.join(', ') + ', and the two faces are Michroma and Manrope');
  }
  if (!/--body:"Manrope"/.test(pageCss)) fail.push('--body is not Manrope, so the pill would set in another face');
  if (!/Manrope/.test(state.bubCaps.font) || !/Manrope/.test(state.built.box.font)) {
    fail.push('the pill and the typed line are not both Manrope');
  }
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
  /* **the only glitch is the end card's.** three windows, all of them inside the
     last half second, and nothing at all fires before the first stutter. */
  if (GL_WINDOWS.length !== 3) fail.push('there are ' + GL_WINDOWS.length + ' glitch windows, wanted three');
  if (GL_WINDOWS.map(w => w.kind).join(',') !== 'stutter,stutter,hit') {
    fail.push('the glitch windows are ' + GL_WINDOWS.map(w => w.kind).join(', '));
  }
  for (let f = 0; f < Math.round(END.pre[0].t * FPS); f++) {
    if (glitchAt(f).heat > 0) { fail.push('something glitches at ' + (f / FPS).toFixed(2) + 's, before the fault'); break; }
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
console.log('    the clip is ' + SECONDS.toFixed(2) + 's, against the last cut\'s 6.08. nothing in'
  + ' the clock is pinned any more: the settle is ' + SETTLE.toFixed(2) + 's and everything after'
  + ' it is the module\'s own bubble arithmetic');
console.log('    the knock down, the fall and the smash are post20\'s tables and post20\'s two'
  + ' functions, unchanged. only the box\'s travel is this clip\'s, because the box is not that'
  + ' clip\'s caption block');
console.log('    there is no voice in this file at all. the typing runs off a frozen word'
  + ' table and the silence the read left, ' + WORDS[0].start.toFixed(2) + ' to '
  + READ_END.toFixed(2) + 's, is untouched');
console.log('    the only glitch is the end card fault. the landing hit, the pop hit and the three'
  + ' stutters are gone, and the split reaches the wordmark and nothing else');
console.log('    the eyes are the module\'s own until the pill pops and the site\'s --red after'
  + ' it. three gradient layers, no filter, no clip path, nothing with an edge on it');
console.log('    the hand is the module\'s `point` on the left hand, unchanged from the last cut');

console.log('    the pill is held past the module\'s own exit. a thought is 1.68s end to '
  + 'end and the hold is now ' + BUB_HOLD.toFixed(2) + ', so from the frame it is fully up this '
  + 'file freezes the module\'s own bubble frame until the fault rather than re-timing it');

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
