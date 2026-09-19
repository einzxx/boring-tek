/* the boring tek — post32. i love you.

   dark only, 1080x1920, six seconds, no voice and nothing on the bus: einz
   adds the sound outside. the file ships silent, with no audio track at all.

     one    0.0 to 1.2   the peek from the left, low: his centre at 60% of
                         the frame's height, 1.6 times the house size, two
                         thirds of him sliding in from the left edge on the
                         site's ease, a 0.7s stop, eyes toward the middle, a
                         small pill popping beside him at the stop, `hey`,
                         then out on the same ease backwards, pill and all.
     two    1.2 to 2.8   the same from the right edge, high: his centre at
                         38%, a touch smaller, two thirds in, a 1.2s stop,
                         eyes toward the middle, the pill says `it me, ai`.
     three  2.8 to 3.7   he pops up from the bottom at the house size, in the
                         middle of the frame, on the site's spring: overshoot
                         and settle. eyes happy from the rise.
     four   3.7 to 4.9   a speech bubble springs from his side, `i love you`,
                         nunito. right after, he goes shy: the eyes squint to a
                         happy squint, the head tilts and drops a little, two
                         soft pink blush spots on the cheeks, a small wobble.
     five   4.9 to 6.3   ten small hearts rise off him, pink, different sizes,
                         drifting up and fading. the shy pose and the wobble
                         hold.
     six    6.3 to 6.7   the glitch cut: three short bursts of a frame jump,
                         torn slices and a colour split. no flash, no white.
     seven  6.7 to 7.7   the end card: the wordmark alone in the middle of
                         the frame, michroma, post29's. no mascot, no address.
                         held.

   the clock after the peeks is the brief's, slid by 1.7: the two peeks need
   2.8 and the brief gave them 1.1, and the pop and everything after it keep
   their own lengths.

   **the margins.** everything inside the brief's 120 device px and inside the
   house safe area, except the cut edge of his body on a peek: that is what a
   peek is. his other three sides, the three pills, the hearts and the
   wordmark are measured against both.

   **the shutter is closed on the peeks and open from the pop.** a peek is a
   short eased slide to a stop, and a shutter trail on it reads as a ring of
   copies flashing; so the frames before the pop are one sample each, and the
   pop's frames carry the solved subframes. the blend stays one ffmpeg tmix
   because a peek frame's one sample is written `SUB` times.

   **the pink is this clip's own.** the site has no pink token and no clip
   before this one has used one, so it is one hex at the top of this file,
   painted on the hearts and the blush and nowhere else, and a guard counts.

   **the states are calm or happy and nothing else.** one mark, neutral, for
   the whole clip; the happy arcs and the shy squint are composed on the
   module's eyes in `compose` the way post30 wrote its lids, never wider than
   the module drew them, and the blush is two circles the page adds inside
   the face svg's clipped group so they turn, tilt and squash with him.

   **the glow stays the house's css px at every size.** the module's two blur
   copies live inside the card and scale with it, which nobody noticed at
   0.42 to 1 and which at 5.8 would be a fog across the whole frame. so the
   clip writes his scale to `--m-s` every frame and the blur radii are divided
   by it. same halo, same proportion, every size.

   **the glitch is the frame, cut up.** on a glitch frame the clean frame is
   captured first, handed back to the page as an image, split into its three
   channels with feColorMatrix and screen blended back with the red and the
   blue slid apart, with three torn slices over that and the whole thing
   jumped. so a glitch frame is still a pure function of time, twice.

     node post32.mjs                     1080x1920, 60fps, shutter open, solved
     DEMO_FPS=12 node post32.mjs         the fast preview pass
     node post32.mjs --no-blur           shutter closed
     node post32.mjs --blur=N            N subframes rather than the solved count
     node post32.mjs --keep-frames       leave the jpegs on disk
     node post32.mjs --encode-only       re-encode from kept frames

   one output, one path, overwritten every run:

     demo/out/post32-dark-1080x1920.mp4

   ---------- what is borrowed and from where ----------

   **the mascot is `lib/mascot.mjs`.** the peeks, the pop and the cut are one
   translate and one scale composed onto `frame.card`, post31's `placeAt`;
   the eyes toward the middle on a peek are the module's own near eye travel
   written on both eyes; the shadow is declined, post26. the spring is
   post30's RISE, the overshoot with the slow start. the end card is post29's
   wordmark, alone, on the middle of the frame.

   **the bubbles are the module's pill,** its tokens read off its own css the
   way post29 did, laid as one pill springing from the corner nearest him the
   way the tools hub's `more soon` does: no dots, because he is saying it
   rather than thinking it. the two peek pills are the same pill, anchored on
   his rim toward the middle of the frame, popping on the spring at the stop
   and going out with him: they carry his slide on their own transform. */

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
  STAGE, SAFE, HEAD, GRID, GLOW, BUBBLE, EYE_CX,
} from './lib/mascot.mjs';
import { brandTokens } from './lib/captions.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post32');
const SUBS = path.join(OUT, 'subframes-post32');
const VERIFY = path.join(OUT, 'verify-post32');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = STAGE.dsf;
const VW = STAGE.w, VH = STAGE.h;
const SAFE_CSS = { top: SAFE.top / DSF, bottom: SAFE.bottom / DSF, left: SAFE.left / DSF, right: SAFE.right / DSF };
/* the brief's own margin, 120 device px on every side. the house safe area is
   stricter on every side and both are checked. */
const BRIEF_SAFE = 120;

const argv = process.argv.slice(2);
const ONLY_ENCODE = argv.includes('--encode-only');
const KEEP = argv.includes('--keep-frames');
const BLUR = !argv.includes('--no-blur');
const BLUR_ARG = Number((argv.find(a => a.startsWith('--blur=')) || '').split('=')[1]) || 0;
/* the shutter: the passes are the fastest thing any clip here has done on
   screen, so the wanted spacing is wider than post31's 6.3 and the cap holds. */
const SUB_STEP_WANT = 10;
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

/* ---------- the clock ----------
   the two peeks are the brief's lengths; everything after them is the
   brief's clock slid by what the peeks needed over the 1.1 it gave them. */
const PEEK1 = { at: 0.00, in: 0.25, hold: 0.70, out: 0.25, say: 'hey' };
const PEEK2 = { at: 1.20, in: 0.20, hold: 1.20, out: 0.20, say: 'it me, ai' };
PEEK1.end = +(PEEK1.at + PEEK1.in + PEEK1.hold + PEEK1.out).toFixed(4);
PEEK2.end = +(PEEK2.at + PEEK2.in + PEEK2.hold + PEEK2.out).toFixed(4);
const SLID = +(PEEK2.end - 1.10).toFixed(4);
const CUT = +(5.0 + SLID).toFixed(4);
const SECONDS = +(6.0 + SLID).toFixed(4);

/* ---------- the copy ---------- */
const BUB_TEXT = 'i love you';
/* the wordmark alone, post29's: its middle on the middle of the frame */
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16, minCapPx: 56 };
const CENTRE_Y = VH / 2;

/* ---------- the pink ----------
   this clip's own, see the header. */
const PINK = '#ff6fae';

/* ---------- where he is ----------
   the house size, 148 on the 64 grid, post31's. home is the middle of the
   frame, where he pops to; there is no end card home because he is not on
   the end card. */
const SIZE = 148;
const R_FULL = HEAD.plate.s / 2 * (SIZE / GRID);      /* 69.375 css px */
const MID = { x: VW / 2, y: 470 };
const HOME = MID;
/* the glow's reach past the rim, in css px at any size: three sigma of the
   wide blur, rounded up. a peek is off screen when the halo is. */
const GLOW_REACH = Math.ceil(3 * GLOW.wide.blur) + 10;
/* and the idle's own drift, which at the biggest scale is a head wandering
   twenty odd css px: the room a peek's out position leaves past the halo. */
const IDLE_ROOM = 30;
/* the two peeks. `s` is on the house size, `y` is his centre as a share of
   the frame's height, `show` is how much of his width is in frame at the
   stop, `look` is how far the eyes go toward the middle of the screen, in
   grid units, the module's own near eye travel at two thirds of a turn. the
   out position is fully off screen, halo and drift included. */
PEEK1.s = 1.60; PEEK1.y = +(0.60 * VH).toFixed(2); PEEK1.show = 2 / 3; PEEK1.side = -1;
PEEK2.s = 1.55; PEEK2.y = +(0.38 * VH).toFixed(2); PEEK2.show = 2 / 3; PEEK2.side = 1;
for (const P of [PEEK1, PEEK2]) {
  P.r = +(R_FULL * P.s).toFixed(3);
  /* the centre at the stop: the head's near edge is `show` of its width in */
  P.stop = P.side < 0 ? +(2 * P.r * P.show - P.r).toFixed(3) : +(VW - 2 * P.r * P.show + P.r).toFixed(3);
  P.off = P.side < 0 ? -(P.r + GLOW_REACH + IDLE_ROOM) : VW + P.r + GLOW_REACH + IDLE_ROOM;
}
const LOOK = 6.3;
/* the peek pills: the i love you pill's numbers, anchored on his rim toward
   the middle at the same angle, springing from the corner nearest him. */
const PEEK_BUB = { for: 0.36, from: 0.55, angle: 48, gap: 6 };
for (const P of [PEEK1, PEEK2]) {
  const th = PEEK_BUB.angle * Math.PI / 180;
  P.ax = +(P.stop - P.side * (P.r + PEEK_BUB.gap) * Math.cos(th)).toFixed(2);
  P.ay = +(P.y - (P.r + PEEK_BUB.gap) * Math.sin(th)).toFixed(2);
  P.bubAt = +(P.at + P.in).toFixed(4);
}
/* the pop: from under the bottom edge, halo and all, to the middle on the spring */
const POP_IN = { at: PEEK2.end, for: 0.55, from: VH + R_FULL + GLOW_REACH + IDLE_ROOM };
const LAND = +(POP_IN.at + POP_IN.for).toFixed(4);
/* happy from the rise; shy a beat after the bubble */
const HAPPY = { at: POP_IN.at, for: 0.30 };
/* the lids are the module's throughout: a blink in a peek's hold is him
   watching. the seed keeps them off the slides. */
const LIDS_HELD_TO = 0;
const SHY = { at: +(2.35 + SLID).toFixed(4), for: 0.45, tilt: 9, down: 6, eyeDown: 1.4, sq: { sx: 0.93, sy: 0.72 } };
const WOBBLE = { amp: 2.0, period: 0.46, ampX: 1.4, rampFor: 0.35 };
const BLUSH = { at: SHY.at + 0.05, for: 0.35, o: 0.62, cx: [15.5, 48.5], cy: 46.5, r: 5.2 };
/* the bubble: the module's pill, springing from its bottom left corner off his
   upper right side. the anchor is a point on his rim at `angle` degrees above
   the horizontal, plus a small gap along the same line. */
const BUB = { at: +(2.00 + SLID).toFixed(4), for: 0.40, from: 0.55, size: 24, weight: 600, padX: 18, padY: 10, angle: 48, gap: 6 };
BUB.ax = +(MID.x + (R_FULL + BUB.gap) * Math.cos(BUB.angle * Math.PI / 180)).toFixed(2);
BUB.ay = +(MID.y - (R_FULL + BUB.gap) * Math.sin(BUB.angle * Math.PI / 180)).toFixed(2);
/* the hearts: ten, seeded, born one after another off the upper half of his
   rim, rising and swaying, fading over the back half of their life. */
const HEART = {
  n: 10, from: +(3.20 + SLID).toFixed(4), every: 0.085, jitter: 0.06, life: [1.00, 1.35], rise: [110, 170], sway: [8, 16],
  size: [0.85, 1.6], angle: [-150, -30], seed: 0x10ce,
  /* the path, 14 units wide, its notch at the origin's top and its point 5
     down: a heart, not a spade. */
  d: 'M0 5C-2 3-7 0-7-4C-7-7-4.5-8.5-2.5-7.5C-1.2-7-0.3-6 0-5C0.3-6 1.2-7 2.5-7.5C4.5-8.5 7-7 7-4C7 0 2 3 0 5Z',
  popFor: 0.15, fadeFrom: 0.55,
};
/* the glitch: three bursts and a residue on the first end card frame, each
   snapped to the frame grid so a 12fps preview shows every one. no flash. */
const GL = {
  bursts: [{ t: +(4.60 + SLID).toFixed(4), for: 2 / 60, heat: 0.75 }, { t: +(4.75 + SLID).toFixed(4), for: 3 / 60, heat: 1.0 }, { t: +(4.88 + SLID).toFixed(4), for: 3 / 60, heat: 1.0 }, { t: CUT, for: 2 / 60, heat: 0.45, residue: true }],
  jumpX: 22, jumpY: 12, split: 11, slices: 3, sliceH: [24, 110], sliceDx: 70, flash: 0,
};
/* the end card */
const WM1 = { at: CUT, for: 0.09 };

const CRF = 17;
const STEP_CEIL = 130;               /* css px a frame at 60, on screen, the pop, under the shutter */
const PEEK_STEP_CEIL = 200;          /* the peeks' slides, sharp */

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
const RISE = bezier(.5, 0, .3, 1.3);           /* post30's rise, the overshoot with a slow start */
/* the peek's out: the site's ease run backwards, so he leaves slowly and is
   gone fast, the mirror of how he came. */
const EASE_BACK = p => 1 - EASE(1 - p);
const EASE_OUT2 = p => 1 - (1 - p) * (1 - p);
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))));
const lerp = (a, b, p) => a + (b - a) * p;
function phosphor(t, amp, slow, fast, phase) {
  return 1 + amp * 0.78 * Math.sin(2 * Math.PI * t / slow) + amp * 0.39 * Math.sin(2 * Math.PI * t / fast + phase);
}
function prng(seed) {
  let x = seed | 0 || 0x1a2b3c;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x |= 0; return (x >>> 0) / 4294967296; };
}
function onGrid(t, len, fps) {
  const f0 = Math.round(t * fps);
  const n = Math.max(1, Math.round(len * fps));
  return { t0: f0 / fps, t1: (f0 + n) / fps, frames: n };
}

/* ---------- where he is, on the clock ----------
   dx, dy are off HOME, the middle of the frame; s is the scale on the house
   size; look is the eyes' travel toward the middle of the screen, in grid
   units, signed. a peek is three eased moves: in on the site's ease to the
   stop, the hold, out on the same ease backwards. */
function peekAt(P, t) {
  const x = t < P.at + P.in ? lerp(P.off, P.stop, EASE(span(t, P.at, P.at + P.in)))
    : t < P.at + P.in + P.hold ? P.stop
    : lerp(P.stop, P.off, EASE_BACK(span(t, P.at + P.in + P.hold, P.end)));
  /* the pill: pops on the spring at the stop, holds, and carries his slide
     out on its own transform, so it leaves with him */
  const bp = span(t, P.bubAt, P.bubAt + PEEK_BUB.for);
  const bub = t < P.bubAt ? { o: 0, sc: PEEK_BUB.from, x: 0, y: 0 }
    : { o: +span(t, P.bubAt, P.bubAt + 0.08).toFixed(4), sc: +lerp(PEEK_BUB.from, 1, POP(bp)).toFixed(4), x: +(x - P.stop).toFixed(3), y: +(4 * (1 - EASE(bp))).toFixed(3) };
  return { dx: +(x - HOME.x).toFixed(3), dy: +(P.y - HOME.y).toFixed(3), s: P.s, look: +(-P.side * LOOK).toFixed(3), peek: P === PEEK1 ? 1 : 2, bub };
}
const NO_PEEK_BUB = { o: 0, sc: PEEK_BUB.from, x: 0, y: 0 };
const peekBubs = t => { const P = placeAt(t); return [P.peek === 1 ? P.bub : NO_PEEK_BUB, P.peek === 2 ? P.bub : NO_PEEK_BUB]; };
function placeAt(t) {
  if (t < PEEK2.at) return peekAt(PEEK1, t);
  if (t < POP_IN.at) return peekAt(PEEK2, t);
  if (t < CUT) {
    const p = RISE(span(t, POP_IN.at, POP_IN.at + POP_IN.for));
    return { dx: +(MID.x - HOME.x).toFixed(3), dy: +(lerp(POP_IN.from, MID.y, p) - HOME.y).toFixed(3), s: 1, look: 0, peek: 0 };
  }
  return { dx: 0, dy: 0, s: 1, look: 0, peek: 0 };
}
/* the peeks hold their own clock: how far into the stop a moment is */
const peeking = t => (t >= PEEK1.at + PEEK1.in && t < PEEK1.at + PEEK1.in + PEEK1.hold) || (t >= PEEK2.at + PEEK2.in && t < PEEK2.at + PEEK2.in + PEEK2.hold);
/* the shy pose, as numbers: how far in, the tilt, the drop, the wobble */
function shyAt(t) {
  if (t < SHY.at || t >= CUT) return { p: 0, tilt: 0, down: 0, wx: 0, eyeDown: 0, blush: 0 };
  const p = EASE(span(t, SHY.at, SHY.at + SHY.for));
  const env = EASE(span(t, SHY.at + 0.10, SHY.at + 0.10 + WOBBLE.rampFor));
  const w = Math.sin(2 * Math.PI * (t - SHY.at) / WOBBLE.period);
  return {
    p: +p.toFixed(4),
    tilt: +(SHY.tilt * p + WOBBLE.amp * env * w).toFixed(3),
    down: +(SHY.down * p).toFixed(3),
    wx: +(WOBBLE.ampX * env * Math.sin(2 * Math.PI * (t - SHY.at) / WOBBLE.period + 1.2)).toFixed(3),
    eyeDown: +(SHY.eyeDown * p).toFixed(3),
    blush: +(BLUSH.o * EASE(span(t, BLUSH.at, BLUSH.at + BLUSH.for))).toFixed(4),
  };
}
const happyAt = t => (t < HAPPY.at || t >= CUT) ? 0 : EASE(span(t, HAPPY.at, HAPPY.at + HAPPY.for));
function compose(plan, t) {
  const f = mascotFrame(plan, t);
  const P = placeAt(t);
  const S = shyAt(t);
  const h = happyAt(t);
  f.card = {
    ...f.card,
    x: +(f.card.x + P.dx + S.wx * P.s).toFixed(4),
    y: +(f.card.y + P.dy + S.down * P.s).toFixed(4),
    rot: +(f.card.rot + S.tilt).toFixed(4),
    sx: +(f.card.sx * P.s).toFixed(5),
    sy: +(f.card.sy * P.s).toFixed(5),
  };
  /* the eyes: delighted's arcs, then the squint, on the module's own two
     scales so the idle and the turn still land on top. never wider than the
     module drew them, and the lid is the module's. */
  /* the lids can be held open over the module's idle, post30's way, for a
     window ending at LIDS_HELD_TO; this round holds none. */
  const held = t < LIDS_HELD_TO;
  f.eyes = f.eyes.map(e => ({
    ...e,
    sx: +(e.sx * lerp(1, 1.28, h) * lerp(1, SHY.sq.sx, S.p)).toFixed(4),
    sy: +(e.sy * lerp(1, 0.40, h) * lerp(1, SHY.sq.sy, S.p)).toFixed(4),
    x: +(e.x + P.look).toFixed(4),
    y: +(e.y + 0.9 * h + S.eyeDown).toFixed(4),
    lid: held ? 0 : e.lid,
  }));
  f.shadow = { ...f.shadow, o: 0 };
  return f;
}
/* ---------- the bubble ---------- */
function bubbleAt(t) {
  if (t < BUB.at || t >= CUT) return { o: 0, sc: BUB.from, y: 0 };
  const p = span(t, BUB.at, BUB.at + BUB.for);
  return { o: +span(t, BUB.at, BUB.at + 0.08).toFixed(4), sc: +lerp(BUB.from, 1, POP(p)).toFixed(4), y: +(4 * (1 - EASE(p))).toFixed(3) };
}

/* ---------- the hearts ----------
   each is born once, off the seed, and drawn from its own clock. */
const HEARTS = (() => {
  const r = prng(HEART.seed);
  const pick = ([a, b]) => lerp(a, b, r());
  const out = [];
  for (let i = 0; i < HEART.n; i++) {
    const th = pick(HEART.angle) * Math.PI / 180;
    out.push({
      at: +(HEART.from + i * HEART.every + r() * HEART.jitter).toFixed(4),
      life: +pick(HEART.life).toFixed(3), rise: +pick(HEART.rise).toFixed(1), sway: +pick(HEART.sway).toFixed(1),
      size: +pick(HEART.size).toFixed(3), phase: +(r() * Math.PI * 2).toFixed(3),
      x0: +(MID.x + R_FULL * 0.92 * Math.cos(th)).toFixed(2), y0: +(MID.y + R_FULL * 0.92 * Math.sin(th)).toFixed(2),
    });
  }
  return out;
})();
const HEARTS_DONE = +Math.max(...HEARTS.map(h => h.at + h.life)).toFixed(4);
function heartsAt(t) {
  return HEARTS.map(h => {
    if (t < h.at || t >= CUT) return { o: 0, x: h.x0, y: h.y0, s: 0 };
    const p = Math.min(1, (t - h.at) / h.life);
    const o = Math.min(1, p / 0.12) * (1 - EASE_OUT2(span(p, HEART.fadeFrom, 1)));
    return {
      o: +o.toFixed(4),
      x: +(h.x0 + h.sway * Math.sin(2 * Math.PI * (p * 1.3) + h.phase)).toFixed(2),
      y: +(h.y0 - h.rise * EASE_OUT2(p)).toFixed(2),
      s: +(h.size * POP(Math.min(1, p / HEART.popFor))).toFixed(4),
    };
  });
}
/* a heart's box on the stage, css px, for the margin guard: the path spans
   -7..7 across and -8.5..5 down at scale 1 */
const heartBox = (q, sz) => ({ left: q.x - 7 * q.s * sz, right: q.x + 7 * q.s * sz, top: q.y - 8.5 * q.s * sz, bottom: q.y + 5 * q.s * sz });

/* ---------- the glitch ---------- */
let GL_WINDOWS = [], GL_WINDOWS_60 = [];
const glitchWindows = fps => GL.bursts.map((b, i) => ({ ...onGrid(b.t, b.for, fps), heat: b.heat, residue: !!b.residue, seed: 0x5c1a + i * 977 }));
function glitchAt(f, fps = FPS, windows = GL_WINDOWS) {
  const g = { heat: 0, jx: 0, jy: 0, split: 0, slices: [] };
  const t = f / fps;
  const w = windows.find(x => t >= x.t0 - 1e-9 && t < x.t1 - 1e-9);
  if (!w) return g;
  const r = prng(w.seed ^ (f * 2654435761));
  const heat = w.heat;
  g.heat = heat;
  g.jx = +((r() * 2 - 1) * GL.jumpX * heat).toFixed(1);
  g.jy = +((r() * 2 - 1) * GL.jumpY * heat).toFixed(1);
  g.split = +(heat * (3 + r() * (GL.split - 3))).toFixed(1);
  const n = w.residue ? 0 : GL.slices;
  for (let i = 0; i < n; i++) {
    const h = lerp(GL.sliceH[0], GL.sliceH[1], r());
    g.slices.push({ top: +(r() * (VH - h)).toFixed(1), h: +h.toFixed(1), dx: +((r() * 2 - 1) * GL.sliceDx * heat).toFixed(1) });
  }
  return g;
}

/* ---------- what one frame is ---------- */
function frameAt(t, f) {
  const P = placeAt(t);
  const S = shyAt(t);
  const wmP = span(t, WM1.at, WM1.at + WM1.for);
  return {
    t: +t.toFixed(4), f,
    ms: P.s,
    /* he is not on the end card */
    mo: t < CUT ? 1 : 0,
    blush: S.blush,
    bub: bubbleAt(t),
    pk: peekBubs(t),
    hearts: heartsAt(t),
    g: glitchAt(f),
    wm: { o: t >= WM1.at ? 1 : 0, sc: +(1 + (1 - EASE(wmP)) * 0.085).toFixed(4), glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4) },
  };
}

/* ---------- the page ---------- */
function sceneHtml(plan) {
  const brand = brandTokens();
  const mcss = mascotCss(plan);
  /* the bubble's three tokens are the module's own dark ones, read off its
     css rather than typed again, so the pill is the module's pill. */
  const tok = /\[data-theme=dark\] \.m-zone\{([^}]*)\}/.exec(mcss)[1];
  const tokens = ['face', 'eye', 'bub'].map(k => '--' + k + ':' + new RegExp('--' + k + ':\\s*([^;]+);').exec(tok)[1]).join(';');
  const chan = (id, row) => `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${row}"/></filter>`;
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post32</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Nunito:wght@600&display=swap">
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
  --cap:"Nunito",var(--mono);
  --pink:${PINK};
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--cap)}
.vignette{position:fixed;inset:-10%;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 78% 62% at 50% 46%,rgba(255,255,255,.030) 0%,rgba(255,255,255,.010) 46%,rgba(0,0,0,0) 72%);
  will-change:transform,opacity;animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{from{transform:scale(1) translate3d(0,0,0);opacity:.85}to{transform:scale(1.05) translate3d(0,-1.1%,0);opacity:1}}
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;background:var(--bg);overflow:hidden}

${mcss}
/* the glow at the house's css px at every size: the module's radii divided by
   his scale, which the page writes to --m-s every frame. see the header. */
.m-glow-mid{filter:blur(calc(${GLOW.mid.blur}px / var(--m-s,1)))}
.m-glow-wide{filter:blur(calc(${GLOW.wide.blur}px / var(--m-s,1)))}
/* the blush: two circles the page adds inside the face's clipped group */
.m-blush{fill:url(#p32-blush);opacity:var(--blush,0)}

/* ---- the bubble: the module's pill, one pill, from his side ---- */
.sb{${tokens};position:absolute;left:${BUB.ax}px;top:${BUB.ay}px;transform:translateY(-100%);z-index:5;pointer-events:none;width:max-content}
/* the peek pills: the same pill, one anchored by its bottom left off peek
   one's right side, one by its bottom right off peek two's left side */
#pk0{left:${PEEK1.ax}px;top:${PEEK1.ay}px}
#pk1{left:auto;right:${(VW - PEEK2.ax).toFixed(2)}px;top:${PEEK2.ay}px}
#pk1 .p{transform-origin:100% 100%}
.sb .p{display:block;padding:${BUB.padY}px ${BUB.padX}px;border:${BUBBLE.stroke}px solid var(--bub);border-radius:${BUBBLE.radius}px;
  background:var(--eye);color:var(--face);font-family:var(--cap);font-weight:${BUB.weight};font-size:${BUB.size}px;
  line-height:1.25;letter-spacing:.005em;white-space:nowrap;transform-origin:0% 100%;opacity:0;will-change:transform,opacity}

/* ---- the hearts ---- */
.hearts{position:absolute;left:0;top:0;width:${VW}px;height:${VH}px;z-index:6;pointer-events:none;overflow:visible}
.hearts path{fill:var(--pink);opacity:0;filter:drop-shadow(0 0 5px color-mix(in srgb,var(--pink) 55%,transparent))}

/* the zone carries the cut: he is not on the end card */
#m-zone{opacity:var(--m-o,1)}

/* ---- the end card: the wordmark, post23's, alone on the middle of the frame ---- */
.wm{position:absolute;left:50%;top:${CENTRE_Y}px;transform:translate(-50%,-50%) scale(var(--wm-s,1));transform-origin:50% 50%;
  font-family:var(--display);font-weight:400;color:var(--fg);text-align:center;text-transform:uppercase;letter-spacing:.18em;
  line-height:${WM.lh};white-space:nowrap;text-indent:.09em;opacity:var(--wm-o,0);
  text-shadow:0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),0 0 66px rgba(255,255,255,.10);
  filter:brightness(var(--wm-glow,1));z-index:8}
.wm span{display:block}

/* ---- the glitch: the clean frame, back as an image, cut up ----
   three channel copies screen blended over the page colour, so where nothing
   is slid the sum is the frame itself; three torn slices of the plain frame
   over that; the whole layer jumped. */
.gl{position:absolute;inset:0;z-index:30;background:var(--bg);isolation:isolate;overflow:hidden;display:none}
.gl img{position:absolute;left:0;top:0;width:${VW}px;height:${VH}px;display:block;will-change:transform}
.gl .ch{mix-blend-mode:screen}
.gl .r{filter:url(#p32-r)}
.gl .g{filter:url(#p32-g)}
.gl .b{filter:url(#p32-b)}
.gl .sl{position:absolute;inset:0;overflow:hidden;clip-path:inset(var(--st,0px) 0 var(--sb,100%) 0)}
</style>
</head>
<body>
<div class="vignette" aria-hidden="true"></div>
<div class="stage" id="stage">
${mascotMarkup(plan)}
  <div class="sb" id="sb"><span class="p" id="sb-p">${BUB_TEXT}</span></div>
  <div class="sb" id="pk0"><span class="p" id="pk0-p">${PEEK1.say}</span></div>
  <div class="sb" id="pk1"><span class="p" id="pk1-p">${PEEK2.say}</span></div>
  <svg class="hearts" id="hearts" aria-hidden="true">${HEARTS.map((_, i) => '<path id="ht' + i + '" d="' + HEART.d + '"/>').join('')}</svg>
  <div class="wm" id="wm">${WM.lines.map(l => '<span>' + l + '</span>').join('')}</div>
  <div class="gl" id="gl">
    <img class="ch r" id="gl-r" alt=""><img class="ch g" id="gl-g" alt=""><img class="ch b" id="gl-b" alt="">
    ${Array.from({ length: GL.slices }, (_, i) => '<div class="sl" id="sl' + i + '"><img id="sl' + i + 'i" alt=""></div>').join('\n    ')}
  </div>
  <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    ${chan('p32-r', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0')}
    ${chan('p32-g', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0')}
    ${chan('p32-b', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0')}
  </defs></svg>
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
window.__P32 = ${JSON.stringify({ VW, VH, DSF, WM, HEARTS: HEARTS.length, SLICES: GL.slices, BLUSH: { cx: BLUSH.cx, cy: BLUSH.cy, r: BLUSH.r }, PINK })};
${mascotRuntime()}
(${scenePage.toString()})();
Promise.all([document.fonts.load('400 40px Michroma'), document.fonts.load('${BUB.weight} ${BUB.size}px Nunito')])
  .then(function () { return document.fonts.ready; })
  .then(function () { window.__built = Object.assign({}, window.__p32.fit(), { mas: window.__mas.build() }); });
</script>
</body>
</html>`;
}

/* ---------- the page's own script ----------
   writes numbers to elements and decides nothing. */
function scenePage() {
  const P = window.__P32;
  const stage = document.getElementById('stage');
  const pill = document.getElementById('sb-p');
  const sb = document.getElementById('sb');
  const pks = [document.getElementById('pk0'), document.getElementById('pk1')];
  const pkPills = [document.getElementById('pk0-p'), document.getElementById('pk1-p')];
  const hearts = []; for (let i = 0; i < P.HEARTS; i++) hearts.push(document.getElementById('ht' + i));
  const wm = document.getElementById('wm');
  const gl = document.getElementById('gl');
  const chans = ['r', 'g', 'b'].map(k => document.getElementById('gl-' + k));
  const slices = [], sliceImgs = [];
  for (let i = 0; i < P.SLICES; i++) { slices.push(document.getElementById('sl' + i)); sliceImgs.push(document.getElementById('sl' + i + 'i')); }
  /* the blush, added inside the face's clipped group so it goes with him */
  const face = document.querySelector('.m-face');
  const defs = face.querySelector('defs');
  const SVG = 'http://www.w3.org/2000/svg';
  const grad = document.createElementNS(SVG, 'radialGradient');
  grad.setAttribute('id', 'p32-blush');
  for (const [off, a] of [['0%', 1], ['55%', 0.55], ['100%', 0]]) {
    const st = document.createElementNS(SVG, 'stop');
    st.setAttribute('offset', off); st.setAttribute('stop-color', P.PINK); st.setAttribute('stop-opacity', String(a));
    grad.appendChild(st);
  }
  defs.appendChild(grad);
  const features = face.querySelector('.m-features');
  for (let k = 0; k < 2; k++) {
    const c = document.createElementNS(SVG, 'circle');
    c.setAttribute('class', 'm-blush'); c.setAttribute('cx', String(P.BLUSH.cx[k])); c.setAttribute('cy', String(P.BLUSH.cy)); c.setAttribute('r', String(P.BLUSH.r));
    features.appendChild(c);
  }
  const capOf = el => {
    const cs = getComputedStyle(el);
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    return { cap: cv.measureText('H').actualBoundingBoxAscent || 0, font: cv.font };
  };
  const box = (r, d) => ({ left: +(r.left * d).toFixed(1), top: +(r.top * d).toFixed(1),
    right: +((P.VW - r.right) * d).toFixed(1), bottom: +((P.VH - r.bottom) * d).toFixed(1),
    w: +((r.right - r.left) * d).toFixed(1), h: +((r.bottom - r.top) * d).toFixed(1) });
  const rg = el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
  window.__p32 = {
    fit() {
      const probe = wm;
      probe.style.fontSize = '100px';
      let widest = 0;
      for (const sp of probe.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      const ws = 100 * P.WM.w / widest;
      wm.style.fontSize = ws.toFixed(2) + 'px';
      return { wm: +ws.toFixed(2) };
    },
    measure() {
      const d = P.DSF;
      const c = capOf(wm);
      let widest = 0;
      for (const sp of wm.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      /* the pill is measured whole, at scale one, before any transform */
      const was = pill.style.transform; pill.style.transform = 'none';
      const pb = box(pill.getBoundingClientRect(), d);
      pill.style.transform = was;
      const bs = getComputedStyle(pill);
      const pillOf = el => {
        const w = el.style.transform; el.style.transform = 'none';
        const r = el.getBoundingClientRect();
        const out = { ...box(r, d), font: capOf(el).font, text: el.textContent, stroke: getComputedStyle(el).borderTopWidth,
          cssLeft: +r.left.toFixed(2), cssTop: +r.top.toFixed(2), cssRight: +r.right.toFixed(2), cssBottom: +r.bottom.toFixed(2) };
        el.style.transform = w;
        return out;
      };
      return {
        wm: { ...box(wm.getBoundingClientRect(), d), widestPx: +(widest * d).toFixed(1), capPx: +(c.cap * d).toFixed(1), font: c.font,
          midY: +((wm.getBoundingClientRect().top + wm.getBoundingClientRect().bottom) / 2).toFixed(2) },
        pill: { ...pb, font: capOf(pill).font, text: pill.textContent, stroke: bs.borderTopWidth, cssLeft: +(pill.getBoundingClientRect().left).toFixed(2), cssTop: +(pill.getBoundingClientRect().top).toFixed(2),
          cssRight: +(pill.getBoundingClientRect().right).toFixed(2), cssBottom: +(pill.getBoundingClientRect().bottom).toFixed(2) },
        peekPills: pkPills.map(pillOf),
        blush: features.querySelectorAll('.m-blush').length,
        heartFill: getComputedStyle(hearts[0]).fill,
      };
    },
    apply(o) {
      const s = stage.style;
      s.setProperty('--m-s', o.ms.toFixed(5));
      s.setProperty('--m-o', o.mo.toFixed(4));
      s.setProperty('--blush', o.blush.toFixed(4));
      pill.style.opacity = o.bub.o.toFixed(4);
      pill.style.transform = 'translateY(' + o.bub.y.toFixed(3) + 'px) scale(' + o.bub.sc.toFixed(4) + ')';
      sb.style.visibility = o.bub.o < 0.004 ? 'hidden' : 'visible';
      for (let k = 0; k < 2; k++) {
        const b = o.pk[k];
        pkPills[k].style.opacity = b.o.toFixed(4);
        pkPills[k].style.transform = 'translate(' + b.x.toFixed(3) + 'px,' + b.y.toFixed(3) + 'px) scale(' + b.sc.toFixed(4) + ')';
        pks[k].style.visibility = b.o < 0.004 ? 'hidden' : 'visible';
      }
      for (let i = 0; i < hearts.length; i++) {
        const h = o.hearts[i];
        hearts[i].style.opacity = h.o.toFixed(4);
        hearts[i].setAttribute('transform', 'translate(' + h.x.toFixed(2) + ' ' + h.y.toFixed(2) + ') scale(' + h.s.toFixed(4) + ')');
      }
      s.setProperty('--wm-o', o.wm.o.toFixed(4));
      s.setProperty('--wm-s', o.wm.sc.toFixed(4));
      s.setProperty('--wm-glow', o.wm.glow.toFixed(4));
      gl.style.display = 'none';
    },
    /* the glitch: the clean frame back as an image, then the cuts */
    glitch(src, g) {
      const imgs = chans.concat(sliceImgs);
      for (const im of imgs) im.src = src;
      return Promise.all(imgs.map(im => im.decode())).then(function () {
        chans[0].style.transform = 'translate(' + (g.jx - g.split).toFixed(1) + 'px,' + g.jy.toFixed(1) + 'px)';
        chans[1].style.transform = 'translate(' + g.jx.toFixed(1) + 'px,' + g.jy.toFixed(1) + 'px)';
        chans[2].style.transform = 'translate(' + (g.jx + g.split).toFixed(1) + 'px,' + g.jy.toFixed(1) + 'px)';
        for (let i = 0; i < slices.length; i++) {
          const sl = g.slices[i];
          if (!sl) { slices[i].style.display = 'none'; continue; }
          slices[i].style.display = 'block';
          slices[i].style.setProperty('--st', sl.top.toFixed(1) + 'px');
          slices[i].style.setProperty('--sb', (P.VH - sl.top - sl.h).toFixed(1) + 'px');
          sliceImgs[i].style.transform = 'translate(' + (g.jx + sl.dx).toFixed(1) + 'px,' + g.jy.toFixed(1) + 'px)';
        }
        gl.style.display = 'block';
        return true;
      });
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
async function render(plan) {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  for (const d of [FRAMES, SUBS]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  fs.mkdirSync(OUT, { recursive: true });
  const N = Math.round(FPS * SECONDS);
  const { srv, port } = await serve(sceneHtml(plan));
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none', '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio',
      '--run-all-compositor-stages-before-draw'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });
  await page.evaluateOnNewDocument(injected);
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
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
  for (let i = 0; i < 400; i++) {
    const ok = await page.evaluate(() => !!(window.__built && window.__mas && window.__mas.ready && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  if (errors.length) throw new Error('the page threw: ' + errors.join(' | '));
  if (!await page.evaluate(() => !!window.__built)) throw new Error('the scene never became ready');
  for (const [f, what] of [['400 40px "Michroma"', 'the wordmark'], [BUB.weight + ' ' + BUB.size + 'px "Nunito"', 'the bubble']]) {
    if (!await page.evaluate(q => document.fonts.check(q), f)) throw new Error(f + ' did not load, and ' + what + ' would be judged in the fallback');
  }
  const built = await page.evaluate(() => window.__built);
  const measured = await page.evaluate(() => window.__p32.measure());
  console.log('  built: head ' + built.mas.headPx + 'px, ' + built.mas.eyes + ' eyes, ' + built.mas.glows + ' glow layers, theme ' + built.mas.theme + ', ' + measured.blush + ' blush spots added');
  console.log('  the wordmark: ' + measured.wm.widestPx + ' device px wide, caps ' + measured.wm.capPx + ', clear ' + measured.wm.left + ' / ' + measured.wm.top + ' / ' + measured.wm.right + ' / ' + measured.wm.bottom);
  console.log('  the wordmark sits with its middle at ' + measured.wm.midY + ' css px, the frame middle is ' + CENTRE_Y);
  for (const [k, b] of measured.peekPills.entries()) console.log('  peek ' + (k + 1) + '\'s pill: "' + b.text + '", ' + b.w + 'x' + b.h + ' device px, clear ' + b.left + ' / ' + b.top + ' / ' + b.right + ' / ' + b.bottom);
  console.log('  the bubble: "' + measured.pill.text + '", ' + measured.pill.w + 'x' + measured.pill.h + ' device px, clear ' + measured.pill.left + ' / ' + measured.pill.top + ' / ' + measured.pill.right + ' / ' + measured.pill.bottom + ', ' + measured.pill.font);

  const put = async (t, f) => {
    const mf = compose(plan, t);
    const o = frameAt(t, f);
    await page.evaluate(fr => window.__mas.apply(fr), mf);
    await page.evaluate(fr => window.__p32.apply(fr), o);
    if (o.g.heat > 0) {
      /* the clean frame first, then the same frame cut up */
      const clean = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
      const ok = await page.evaluate((src, g) => window.__p32.glitch(src, g), 'data:image/png;base64,' + clean.data, o.g);
      if (!ok) throw new Error('the glitch image did not decode at ' + t);
    }
    return { mf, o };
  };

  /* the head's worst clearance from the landing to the end, the cut aside */
  let worst = null;
  for (let f = 0; f < Math.round(SECONDS * FPS); f++) {
    const t = f / FPS;
    if (t < LAND || t >= CUT) continue;
    const r = headRect(plan, compose(plan, t));
    const near = Math.min(r.left, r.top, r.right, r.bottom);
    if (!worst || near < worst.near) worst = { t: +t.toFixed(3), near, ...r };
  }

  const sigs = [];
  const wall = Date.now();
  let glitched = 0, sharp = 0;
  for (let f = 0; f < N; f++) {
    /* the shutter is closed on the peeks: one sample, written SUB times so
       the blend stays one tmix. see the header. */
    const open = shutterOpen(f / FPS);
    if (!open) sharp++;
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      if (k > 0 && !open) {
        fs.copyFileSync(path.join(SUBS, 's' + String(f * SUB).padStart(6, '0') + '.jpg'), path.join(SUBS, 's' + String(idx).padStart(6, '0') + '.jpg'));
        await advance(SUBSTEP);
        continue;
      }
      const t = f / FPS + k / (FPS * SUB);
      const { mf, o } = await put(t, f);
      if (k === 0 && o.g.heat > 0) glitched++;
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);
      /* the liveness signature sums its subframes, post28's rule */
      let s = o.ms * 7 + o.blush * 11 + o.bub.o * 13 + o.bub.sc * 17 + o.bub.y * 19
        + o.pk[0].o * 227 + o.pk[0].sc * 229 + o.pk[0].x * 233 + o.pk[1].o * 239 + o.pk[1].sc * 241 + o.pk[1].x * 251
        + o.g.heat * 23 + o.g.jx * 29 + o.g.jy * 31 + o.g.split * 37 + o.g.slices.length * 41
        + o.wm.o * 73 + o.wm.sc * 79 + o.wm.glow * 83 + o.mo * 97;
      for (let i = 0; i < o.hearts.length; i++) s += o.hearts[i].o * (101 + i) + o.hearts[i].x * (109 + i) + o.hearts[i].y * (127 + i) + o.hearts[i].s * (131 + i);
      s += mf.card.x * 167 + mf.card.y * 173 + mf.card.rot * 179 + mf.card.sx * 181 + mf.card.sy * 191;
      for (let e = 0; e < 2; e++) s += mf.eyes[e].x * (193 + e) + mf.eyes[e].y * (197 + e) + mf.eyes[e].lid * (199 + e) + mf.eyes[e].sy * (211 + e) + mf.eyes[e].sx * (223 + e);
      if (k === 0) sigs.push(0);
      sigs[f] = +(sigs[f] + s * (open ? k + 1 : SUB * (SUB + 1) / 2)).toFixed(6);
      const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 94, captureBeyondViewport: false, clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
      const file = SUB > 1 ? path.join(SUBS, 's' + String(idx).padStart(6, '0') + '.jpg') : path.join(FRAMES, 'f' + String(f).padStart(5, '0') + '.jpg');
      fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
      await advance(SUBSTEP);
    }
    if (f % 60 === 0) console.log('  ' + String(f).padStart(4) + '/' + N + '  t=' + (f / FPS).toFixed(2) + 's  ' + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
  }
  if (errors.length) throw new Error('the page threw while rendering: ' + errors.join(' | '));

  fs.rmSync(VERIFY, { recursive: true, force: true });
  fs.mkdirSync(VERIFY, { recursive: true });
  const stills = [
    [PEEK1.at + PEEK1.in + PEEK1.hold / 2, 'a-b1-the-peek-from-the-left-hey'],
    [PEEK2.at + PEEK2.in + PEEK2.hold / 2, 'b-b2-the-peek-from-the-right-it-me-ai'],
    [POP_IN.at + POP_IN.for * 0.62, 'c-b3-the-pop-overshooting'],
    [LAND + 0.20, 'd-b3-landed-happy'],
    [BUB.at + 0.30, 'e-b4-the-bubble'],
    [SHY.at + 0.65, 'f-b4-shy-with-blush'],
    [HEARTS[4].at + 0.35, 'g-b5-the-hearts-rising'],
    [HEARTS[9].at + 0.45, 'h-b5-the-hearts-late'],
  ];
  for (const [want, name] of stills) {
    const f = Math.max(0, Math.min(N - 1, Math.round(want * FPS)));
    await put(f / FPS, f);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
    fs.writeFileSync(path.join(VERIFY, name + '.png'), Buffer.from(shot.data, 'base64'));
  }
  console.log('  the head, worst frame from the landing to the cut, at ' + worst.t + 's: ' + worst.left + ' left, ' + worst.top + ' top, ' + worst.right + ' right, ' + worst.bottom
    + ' bottom (floor ' + Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom) + ')');
  await browser.close();
  srv.close();
  if (SUB > 1) blend(N);
  const state = { built, measured, head: worst, sigs, frames: N, glitched, sharp };
  fs.writeFileSync(path.join(OUT, 'post32.json'), JSON.stringify(state, null, 2));
  return state;
}

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }
function blend(N) {
  console.log('  blending ' + N * SUB + ' subframes into ' + N + ' frames ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS * SUB), '-i', path.join(SUBS, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1) + ',setpts=PTS-STARTPTS,framestep=' + SUB, '-q:v', '2', path.join(FRAMES, 'f%05d.jpg')]);
}
function encode() {
  const out = path.join(OUT, 'post32-dark-1080x1920.mp4');
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p', '-r', String(FPS), '-an', '-movflags', '+faststart', out]);
  return out;
}
function probe(file) {
  let out = '';
  try { execFileSync(ffmpeg, ['-hide_banner', '-i', file], { stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { out = (e.stderr || '').toString(); }
  const dur = out.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const res = out.match(/,\s*(\d{2,5})x(\d{2,5})[\s,]/);
  const fps = out.match(/([\d.]+)\s*fps/);
  return { seconds: dur ? (+dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3])) : null, w: res ? +res[1] : null, h: res ? +res[2] : null,
    fps: fps ? parseFloat(fps[1]) : null, audio: /Audio:/.test(out) };
}

/* ========================================================================== */
/* go                                                                         */
/* ========================================================================== */

/* ---------- the plan ----------
   one mark, neutral, straight at the lens, for the whole clip. the seed keeps
   the module's blinks off the peeks' slides, the landing and the cut, and
   lets them fall where they fall in the peeks' holds and the shy hold. */
const MARKS = [{ t: 0, state: 'neutral' }];
const makePlan = seed => planMascot({ seconds: SECONDS, size: SIZE, theme: 'dark', bias: 0, seed, marks: MARKS });
const CLEAR = [
  [PEEK1.at, PEEK1.at + PEEK1.in + 0.05], [PEEK1.at + PEEK1.in + PEEK1.hold - 0.05, PEEK2.at + PEEK2.in + 0.05], [PEEK2.at + PEEK2.in + PEEK2.hold - 0.05, PEEK2.end],
  [POP_IN.at, LAND + 0.15], [GL.bursts[0].t - 0.10, CUT + 0.30],
];
const SEED = (() => {
  for (let s = 1; s <= 600; s++) {
    const b = makePlan(s).idle.blinks;
    if (!b.some(x => CLEAR.some(([a, z]) => x.t >= a && x.t < z))) return s;
  }
  throw new Error('no seed under 600 keeps the module\'s blinks clear of the slides, the landing and the cut');
})();
const plan = makePlan(SEED);
const halfBox = (GRID / 2) * plan.unit;
plan.box.left = +(VW / 2 - halfBox).toFixed(2);
plan.box.top = +(HOME.y - halfBox).toFixed(2);
const rep = mascotMotion(plan, FPS, SECONDS);
const rep60 = FPS === 60 ? rep : mascotMotion(plan, 60, SECONDS);
console.log(describeMascot(plan));
console.log(describeMotion(rep));
GL_WINDOWS = glitchWindows(FPS);
GL_WINDOWS_60 = FPS === 60 ? GL_WINDOWS : glitchWindows(60);
const MODULE_CUES = mascotCues(plan);

/* ---------- the fast things, at sixty, on screen ---------- */
/* on screen: the head's box, grown by the halo, overlaps the stage. headRect
   reports clearances, so a head wider than the frame has both left and right
   negative, and the test is on the far edges only. */
const visible = t => {
  const r = headRect(plan, compose(plan, t)), reach = GLOW_REACH * DSF, W = VW * DSF, H = VH * DSF;
  return r.left < W + reach && r.right < W + reach && r.top < H + reach && r.bottom < H + reach;
};
const fastest = (a, b) => {
  let d = 0, at = a;
  /* steps inside [a, b] only: a step across a join is a jump between two
     off screen places and not a move */
  for (let f = Math.floor(a * 60); (f + 1) / 60 < b - 1e-9; f++) {
    const t0 = f / 60, t1 = (f + 1) / 60;
    if (t0 < a - 1e-9) continue;
    const c0 = compose(plan, t0).card, c1 = compose(plan, t1).card;
    if (!visible(t0) && !visible(t1)) continue;
    const s = Math.hypot(c1.x - c0.x, c1.y - c0.y);
    if (s > d) { d = s; at = t0; }
  }
  return { d: +d.toFixed(2), at: +at.toFixed(3) };
};
const peek1Step = fastest(PEEK1.at, PEEK1.end);
const peek2Step = fastest(PEEK2.at, PEEK2.end);
const popStep = fastest(POP_IN.at, LAND);
/* the shutter is solved on the pop alone: the peeks are sharp by design */
const FASTEST = popStep.d;
const shutterOpen = t => BLUR && t >= POP_IN.at - 1e-9;
if (BLUR) { SUB = BLUR_ARG ? Math.max(2, Math.min(SUB_MAX, Math.round(BLUR_ARG))) : Math.max(2, Math.min(SUB_MAX, Math.ceil(FASTEST / SUB_STEP_WANT))); SUBSTEP = STEP / SUB; }

/* ---------- the clock, printed ---------- */
console.log('\n  the beats');
const peekLine = (P, i) => (i === 1 ? 'one. the peek from the left' : 'two. the peek from the right') + ' at ' + P.s + ' of the house size, ' + (2 * P.r).toFixed(0) + ' css px across, centre at '
  + (P.y / VH * 100).toFixed(0) + '% down, ' + (P.show * 100).toFixed(0) + '% of him in frame at the stop: in ' + P.in + ', hold ' + P.hold + ', out ' + P.out + ', eyes ' + LOOK + ' units toward the middle, the pill says "' + P.say + '"';
const beats = [
  [PEEK1.at, peekLine(PEEK1, 1)],
  [PEEK2.at, peekLine(PEEK2, 2)],
  [POP_IN.at, 'three. the pop from the bottom to the middle on the rise, ' + POP_IN.for + 's, eyes to the happy arcs'],
  [LAND, 'landed'],
  [BUB.at, 'four. the bubble springs from his side, "' + BUB_TEXT + '", ' + BUB.for + 's'],
  [SHY.at, 'shy: the squint, ' + SHY.tilt + ' degrees of tilt, ' + SHY.down + ' px down, the blush, the wobble'],
  [HEARTS[0].at, 'five. the first heart, ' + HEART.n + ' by ' + HEARTS[HEART.n - 1].at.toFixed(2) + ', the last gone by ' + HEARTS_DONE.toFixed(2)],
  ...GL_WINDOWS_60.map((w, i) => [w.t0, (w.residue ? 'the residue on the first end card frame, ' : 'six. burst ' + (i + 1) + ', ') + w.frames + ' frame' + (w.frames > 1 ? 's' : '') + ' at sixty, heat ' + w.heat]),
  [CUT, 'seven. the cut: he is gone, the wordmark pops on the middle of the frame, held to the end'],
  [SECONDS, 'end'],
].sort((a, b) => a[0] - b[0]);
for (const [t, what] of beats) console.log('    ' + t.toFixed(2).padStart(5) + 's  ' + what);
console.log('  the clock after the peeks is the brief\'s slid by ' + SLID.toFixed(2) + 's');
console.log('\n  the fast things, at sixty, on screen');
console.log('    peek one moves at most ' + peek1Step.d + ' css px a frame, at ' + peek1Step.at + 's, sharp');
console.log('    peek two moves at most ' + peek2Step.d + ' css px a frame, at ' + peek2Step.at + 's, sharp');
console.log('    the pop moves at most ' + popStep.d + ' css px a frame');
console.log('  the shutter: ' + (BLUR ? SUB + ' subframes' + (BLUR_ARG ? ' because --blur=' + BLUR_ARG + ' said so' : ', solved on the pop') + ', ' + (FASTEST * 60 / FPS / SUB).toFixed(2) + ' css px between samples at ' + FPS + ', closed until ' + POP_IN.at.toFixed(2) : 'closed'));
console.log('  the sound: none. the file ships without an audio track');

const state = ONLY_ENCODE ? JSON.parse(fs.readFileSync(path.join(OUT, 'post32.json'), 'utf8')) : await render(plan);
const file = encode();
const p = probe(file);
console.log('\nrendered');
console.log('  ' + p.w + 'x' + p.h + ' @' + p.fps + 'fps  ' + p.seconds.toFixed(2) + 's  ' + (p.audio ? 'WITH SOUND' : 'silent') + '  '
  + (fs.statSync(file).size / 1e6).toFixed(2) + ' MB  ' + path.relative(ROOT, file));
console.log('  the shutter is ' + (BLUR ? 'open, ' + SUB + ' subframes to a frame' : 'closed'));
console.log('  ' + state.glitched + ' glitched frames of ' + state.frames);
console.log('  stills of both peeks at the hold and of beats three, four and five in ' + path.relative(ROOT, VERIFY));
if (!KEEP && !ONLY_ENCODE) { fs.rmSync(FRAMES, { recursive: true, force: true }); fs.rmSync(SUBS, { recursive: true, force: true }); }

/* ========================================================================== */
/* the guards                                                                 */
/* ========================================================================== */
const fail = [];
console.log('\nchecks');
if (p.w !== VW * DSF || p.h !== VH * DSF) fail.push('the file is ' + p.w + 'x' + p.h);
if (Math.abs(p.fps - FPS) > 0.01) fail.push('the file runs at ' + p.fps + 'fps rather than ' + FPS);
if (Math.abs(p.seconds - SECONDS) > 0.15) fail.push('the file runs ' + p.seconds.toFixed(2) + 's rather than ' + SECONDS);
if (p.audio) fail.push('the file carries an audio track, and einz adds the sound');
if (state.frames !== Math.round(FPS * SECONDS)) fail.push('rendered ' + state.frames + ' frames');
if (Math.abs(SECONDS - (6.0 + SLID)) > 1e-6) fail.push('the film is ' + SECONDS + 's, not six plus the peeks\' own ' + SLID);

/* ---------- what is on the screen ----------
   no dashes, colons, brackets, apostrophes or quotes anywhere a viewer reads;
   the bubble says exactly what the brief says. */
{
  const screen = [['the bubble', BUB_TEXT], ['peek one\'s pill', PEEK1.say], ['peek two\'s pill', PEEK2.say], ['the wordmark', WM.lines.join(' ')]];
  for (const [what, s] of screen) {
    if (/[-—–:()'"“”‘’!]/.test(s)) fail.push(what + ' carries a dash, a colon, a bracket, an apostrophe, a quote or a bang: "' + s + '"');
    if (/\./.test(s)) fail.push(what + ' has a dot in it: "' + s + '"');
  }
  if (BUB_TEXT !== 'i love you') fail.push('the bubble says "' + BUB_TEXT + '"');
  if (state.measured.pill.text !== BUB_TEXT) fail.push('the rendered pill says "' + state.measured.pill.text + '"');
  if (PEEK1.say !== 'hey' || PEEK2.say !== 'it me, ai') fail.push('the peek pills say "' + PEEK1.say + '" and "' + PEEK2.say + '"');
  for (const [k, b] of state.measured.peekPills.entries()) if (b.text !== [PEEK1, PEEK2][k].say) fail.push('peek ' + (k + 1) + '\'s rendered pill says "' + b.text + '"');
  if (WM.lines.join(' ') !== 'THE BORING TEK') fail.push('the wordmark reads ' + WM.lines.join(' '));
  if (/addr|theboringtek\.com/i.test(sceneHtml(plan).split('<body>')[1])) fail.push('the end card carries an address, and this one is the wordmark alone');
}

/* ---------- the states are calm or happy, and nothing else is drawn ---------- */
{
  for (const m of plan.marks) if (!['neutral'].includes(m.state)) fail.push('mark ' + m.i + ' is ' + m.state + ', and this clip composes the happy eyes itself on neutral');
  if (plan.marks.some(m => m.hands || m.bubble || m.bubbles)) fail.push('a mark asks for hands or a bubble, and this clip draws its own pill');
  if (MODULE_CUES.length) fail.push('the module offers ' + MODULE_CUES.length + ' cue(s) this clip did not expect');
  if (plan.bias !== 0) fail.push('he rests turned, and the brief has him on the camera');
  /* the eyes are never wider or taller than the module drew them; the arcs are
     delighted's numbers and the squint is under them */
  for (let f = 0; f < Math.ceil(SECONDS * 60); f++) {
    const t = f / 60, m = mascotFrame(plan, t), c = compose(plan, t);
    for (let k = 0; k < 2; k++) {
      if (c.eyes[k].sy > m.eyes[k].sy + 1e-6) { fail.push('an eye is taller than the module drew it at ' + t.toFixed(2)); break; }
      const heldHere = t < LIDS_HELD_TO;
      if (heldHere ? c.eyes[k].lid !== 0 : c.eyes[k].lid !== m.eyes[k].lid) { fail.push('a lid is not ' + (heldHere ? 'held open' : 'the module\'s') + ' at ' + t.toFixed(2)); break; }
    }
  }
  const happy = compose(plan, LAND + 0.3), shy = compose(plan, SHY.at + SHY.for + 0.2), base = mascotFrame(plan, LAND + 0.3);
  if (Math.abs(happy.eyes[0].sy / base.eyes[0].sy - 0.40) > 0.02) fail.push('the happy eyes are not delighted\'s arcs: ' + (happy.eyes[0].sy / base.eyes[0].sy).toFixed(3));
  if (!(shy.eyes[0].sy < happy.eyes[0].sy * 0.85)) fail.push('the shy squint is not narrower than the happy arcs');
  if (Math.abs(shy.card.rot - mascotFrame(plan, SHY.at + SHY.for + 0.2).card.rot) < SHY.tilt - WOBBLE.amp - 0.5) fail.push('he does not tilt when shy');
  if (shyAt(SHY.at + 1).blush < BLUSH.o - 1e-3) fail.push('the blush never arrives');
  if (state.measured.blush !== 2) fail.push('there are ' + state.measured.blush + ' blush spots, not two');
  /* the wobble is small and never stops until the cut */
  let wob = 0; for (let f = Math.ceil((SHY.at + 1) * 60); f < Math.floor(CUT * 60); f++) wob = Math.max(wob, Math.abs(shyAt(f / 60).tilt - shyAt((f - 1) / 60).tilt));
  if (wob < 0.05) fail.push('the wobble is still');
  if (WOBBLE.amp > 3) fail.push('the wobble is ' + WOBBLE.amp + ' degrees, not small');
}

/* ---------- the two peeks: two thirds of him in from the edge, a stop with a pill, out, sharp ---------- */
{
  const floor = BRIEF_SAFE;
  for (const [P, i, want] of [[PEEK1, 1, 1.60], [PEEK2, 2, 1.55]]) {
    const mid = P.at + P.in + P.hold / 2;
    const c = compose(plan, mid), m = mascotFrame(plan, mid);
    const d = 2 * R_FULL * c.sx / m.sx;
    if (Math.abs(d / (2 * R_FULL) - want) > 0.005) fail.push('peek ' + i + ' is ' + (d / (2 * R_FULL)).toFixed(2) + ' of the house size, not ' + want);
    /* at the stop, about two thirds of his width is in frame: the far edge
       clearance is negative by the rest of him */
    const r = headRect(plan, c);
    const inFrame = (P.side < 0 ? VW * DSF - r.right : VW * DSF - r.left) / DSF;
    if (Math.abs(inFrame / d - P.show) > 0.06) fail.push('peek ' + i + ' shows ' + (inFrame / d * 100).toFixed(0) + '% of him at the stop, not about two thirds');
    if (P.side < 0 ? r.left > -1 : r.right > -1) fail.push('peek ' + i + ' does not cut the edge');
    /* his centre where the brief put it */
    const cy = HOME.y + c.card.y - m.card.y * 0;
    if (Math.abs((P.y / VH) - (i === 1 ? 0.60 : 0.38)) > 1e-6) fail.push('peek ' + i + '\'s centre is at ' + (P.y / VH * 100).toFixed(0) + '%');
    if (Math.abs(cy - P.y) > 6) fail.push('peek ' + i + ' sits at ' + cy.toFixed(1) + ' css px, not ' + P.y);
    /* his other three sides inside both margins, through the whole hold */
    for (let f = Math.ceil((P.at + P.in) * 60); f < Math.floor((P.at + P.in + P.hold) * 60); f++) {
      const q = headRect(plan, compose(plan, f / 60));
      const near = P.side < 0 ? q.right : q.left;
      const bad = [near, q.top, q.bottom].some(v => v < Math.max(Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom), floor));
      if (bad) { fail.push('peek ' + i + '\'s body is inside a margin at ' + (f / 60).toFixed(2) + 's: ' + q.left + ' / ' + q.top + ' / ' + q.right + ' / ' + q.bottom); break; }
    }
    /* he is still for the hold, but for the idle: the composed move over the
       hold is the module's own drift and nothing else */
    const c0 = compose(plan, P.at + P.in + 0.02).card, c1 = compose(plan, P.at + P.in + P.hold - 0.02).card;
    const m0 = mascotFrame(plan, P.at + P.in + 0.02).card, m1 = mascotFrame(plan, P.at + P.in + P.hold - 0.02).card;
    if (Math.abs((c1.x - c0.x) - (m1.x - m0.x)) > 0.01) fail.push('peek ' + i + ' does not stop for its hold');
    /* the eyes are toward the middle of the screen */
    const k = P.side < 0 ? 1 : 0;
    if (Math.abs((c.eyes[k].x - m.eyes[k].x) + P.side * LOOK) > 0.01) fail.push('peek ' + i + '\'s eyes are not turned toward the middle');
    /* both eyes in frame at the stop, the near one whole */
    const u = plan.unit * P.s, cx = VW / 2 + c.card.x;
    for (let e = 0; e < 2; e++) {
      const ex = cx + (EYE_CX[e] - GRID / 2 + c.eyes[e].x) * u, hw = HEAD.eye.w / 2 * c.eyes[e].sx * u;
      if (e === k ? (ex - hw < 0 || ex + hw > VW) : (ex < 0 || ex > VW)) fail.push('peek ' + i + '\'s ' + (e === k ? 'near eye is not whole' : 'far eye is not') + ' in frame at the stop');
    }
    /* the pill: pops at the stop on the spring, is whole through the hold,
       clears his rim, sits inside both margins, and goes out with him */
    const b0 = peekBubs(P.bubAt - 1e-4)[i - 1], b1 = peekBubs(P.bubAt + PEEK_BUB.for)[i - 1], b2 = peekBubs(P.at + P.in + P.hold + P.out * 0.8)[i - 1];
    if (b0.o !== 0 || b1.o !== 1 || b1.sc !== 1) fail.push('peek ' + i + '\'s pill does not pop at the stop');
    const pkOut = peekAt(P, P.at + P.in + P.hold + P.out * 0.8);
    if (Math.abs(b2.x - (pkOut.dx + HOME.x - P.stop)) > 0.01 || Math.abs(b2.x) < 10) fail.push('peek ' + i + "'s pill does not leave with him");
    const M = state.measured.peekPills[i - 1];
    if (M.left < SAFE.left || M.right < SAFE.right || M.top < SAFE.top || M.bottom < SAFE.bottom) fail.push('peek ' + i + '\'s pill is inside the house safe area: ' + M.left + ' / ' + M.top + ' / ' + M.right + ' / ' + M.bottom);
    if (M.left < floor || M.right < floor || M.top < floor || M.bottom < floor) fail.push('peek ' + i + '\'s pill is inside the brief\'s 120px margin');
    if (!/Nunito/.test(M.font)) fail.push('peek ' + i + '\'s pill is not in nunito: ' + M.font);
    if (parseFloat(M.stroke) < BUBBLE.stroke) fail.push('peek ' + i + '\'s pill outline is ' + M.stroke);
    const px = Math.max(M.cssLeft, Math.min(P.stop, M.cssRight)), py = Math.max(M.cssTop, Math.min(P.y, M.cssBottom));
    const gap = Math.hypot(px - P.stop, py - P.y) - P.r;
    if (gap < 2) fail.push('peek ' + i + '\'s pill sits on his head by ' + (-gap).toFixed(1) + ' css px');
    if (gap > 24) fail.push('peek ' + i + '\'s pill floats ' + gap.toFixed(1) + ' css px off him');
    /* off screen, halo and pill included, before and after */
    for (const [t, what] of [[P.at, 'the start of peek ' + i], [P.end - 1e-4, 'the end of peek ' + i]]) if (visible(t)) fail.push('he is still on screen at ' + what);
    const bEnd = peekBubs(P.end - 1e-4)[i - 1];
    if (bEnd.o > 0 && (P.side < 0 ? M.cssRight + bEnd.x > 0 : M.cssLeft + bEnd.x < VW)) fail.push('peek ' + i + '\'s pill is still on screen at the end of the peek');
  }
  if (!(PEEK2.s <= PEEK1.s)) fail.push('peek two is bigger than peek one');
  if (Math.abs(PEEK1.in - 0.25) > 1e-6 || Math.abs(PEEK1.hold - 0.70) > 1e-6 || Math.abs(PEEK1.out - 0.25) > 1e-6) fail.push('peek one is not in 0.25, hold 0.7, out 0.25');
  if (Math.abs(PEEK2.in - 0.20) > 1e-6 || Math.abs(PEEK2.hold - 1.20) > 1e-6 || Math.abs(PEEK2.out - 0.20) > 1e-6) fail.push('peek two is not in 0.2, hold 1.2, out 0.2');
  if (visible(POP_IN.at)) fail.push('he is still on screen at the start of the pop');
  /* the shutter was closed on every peek frame and open from the pop */
  if (state.sharp !== Math.ceil(POP_IN.at * FPS - 1e-9)) fail.push(state.sharp + ' sharp frames, and the peeks run ' + Math.ceil(POP_IN.at * FPS - 1e-9));
  for (const t of [0.1, PEEK2.at + 0.05, POP_IN.at - 1 / FPS]) if (shutterOpen(t)) fail.push('the shutter is open on a peek at ' + t.toFixed(2));
  if (!shutterOpen(POP_IN.at)) fail.push('the shutter is closed on the pop');
  /* no pill is up while another is */
  for (let f = 0; f < Math.ceil(SECONDS * 60); f++) { const t = f / 60; const up = [bubbleAt(t).o, ...peekBubs(t).map(b => b.o)].filter(o => o > 0).length; if (up > 1) { fail.push('two pills are up at ' + t.toFixed(2)); break; } }
}

/* ---------- everything else clears the safe area, the house one and the brief's ---------- */
{
  const M = state.measured;
  const floor = BRIEF_SAFE;
  const inside = (what, b) => {
    if (b.left < SAFE.left || b.right < SAFE.right || b.top < SAFE.top || b.bottom < SAFE.bottom) fail.push(what + ' is inside the house safe area: ' + b.left + ' / ' + b.top + ' / ' + b.right + ' / ' + b.bottom);
    if (b.left < floor || b.right < floor || b.top < floor || b.bottom < floor) fail.push(what + ' is inside the brief\'s 120px margin');
  };
  inside('the bubble', M.pill);
  if (!/Nunito/.test(M.pill.font)) fail.push('the bubble is not in nunito: ' + M.pill.font);
  if (parseFloat(M.pill.stroke) < BUBBLE.stroke) fail.push('the pill\'s outline is ' + M.pill.stroke + ', under the module\'s ' + BUBBLE.stroke);
  /* the pill clears his head: its nearest corner or edge is outside the rim
     with the head at rest in the middle */
  {
    const px = Math.max(M.pill.cssLeft, Math.min(MID.x, M.pill.cssRight)), py = Math.max(M.pill.cssTop, Math.min(MID.y, M.pill.cssBottom));
    const gap = Math.hypot(px - MID.x, py - MID.y) - R_FULL;
    if (gap < 2) fail.push('the pill sits on his head by ' + (-gap).toFixed(1) + ' css px');
    if (gap > 24) fail.push('the pill floats ' + gap.toFixed(1) + ' css px off him, which is not from his side');
  }
  inside('the wordmark', M.wm);
  if (!/Michroma/.test(M.wm.font)) fail.push('the wordmark is not in Michroma: ' + M.wm.font);
  if (M.wm.capPx < WM.minCapPx) fail.push('the wordmark caps are ' + M.wm.capPx + ' device px, under ' + WM.minCapPx);
  if (Math.abs(M.wm.midY - CENTRE_Y) > 1) fail.push('the wordmark\'s middle is at ' + M.wm.midY + ' css px, not the frame\'s middle at ' + CENTRE_Y);
  /* the head from the landing to the cut: inside both margins */
  if (state.head && state.head.near < Math.max(Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom), floor)) fail.push('the head comes within ' + state.head.near + ' device px of a border at ' + state.head.t + 's');
  /* he is not on the end card */
  if (frameAt(CUT, 0).mo !== 0 || frameAt(CUT - 1 / 60, 0).mo !== 1 || frameAt(SECONDS - 0.05, 0).mo !== 0) fail.push('he is on the end card');
  /* the overshoot: he rises past the middle and settles on it */
  let highest = Infinity; for (let f = Math.floor(POP_IN.at * 60); f < Math.ceil(CUT * 60); f++) highest = Math.min(highest, compose(plan, f / 60).card.y + HOME.y);
  if (!(highest < MID.y - 6)) fail.push('the pop does not overshoot the middle');
  const settled = compose(plan, LAND + 0.05).card.y + HOME.y - mascotFrame(plan, LAND + 0.05).card.y;
  if (Math.abs(settled - MID.y) > 0.5) fail.push('he settles at ' + settled.toFixed(1) + ', not the middle at ' + MID.y);
  /* the hearts: ten, every one inside both margins for its whole life, born
     off him, all fading */
  if (HEARTS.length !== 10) fail.push('there are ' + HEARTS.length + ' hearts');
  let hMin = Infinity, hSizes = new Set();
  for (let f = Math.floor(HEART.from * 60); f < Math.ceil(CUT * 60); f++) {
    const hs = heartsAt(f / 60);
    for (let i = 0; i < hs.length; i++) {
      if (hs[i].o <= 0.004) continue;
      const b = heartBox(hs[i], 1);
      hMin = Math.min(hMin, b.left * DSF, b.top * DSF, (VW - b.right) * DSF, (VH - b.bottom) * DSF);
    }
  }
  for (const h of HEARTS) hSizes.add(h.size);
  if (hMin < Math.max(Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom), floor)) fail.push('a heart comes within ' + hMin.toFixed(0) + ' device px of a border');
  if (hSizes.size < 8) fail.push('the hearts are ' + hSizes.size + ' sizes, not different sizes');
  for (const [i, h] of HEARTS.entries()) if (Math.hypot(h.x0 - MID.x, h.y0 - MID.y) > R_FULL) fail.push('heart ' + (i + 1) + ' is not born off him');
  if (HEARTS[0].at < HEART.from - 1e-6 || HEARTS[HEART.n - 1].at > HEART.from + 1.0) fail.push('the hearts are born from ' + HEARTS[0].at + ' to ' + HEARTS[HEART.n - 1].at);
  if (!/rgb\(255, 111, 174\)/.test(M.heartFill)) fail.push('the hearts are not the pink: ' + M.heartFill);
  /* the bubble is up from its pop to the cut, the blush after the bubble */
  if (bubbleAt(CUT - 0.01).o < 1) fail.push('the bubble is gone before the cut');
  if (BLUSH.at < BUB.at + BUB.for - 1e-6) fail.push('the blush comes before the bubble has sprung');
  if (SHY.at < BUB.at + BUB.for - 0.10) fail.push('he goes shy before the bubble has sprung');
}

/* ---------- the glitch: three bursts and a residue, no flash, no strobe ---------- */
{
  const on = [];
  for (let f = 0; f < Math.round(SECONDS * 60); f++) if (glitchAt(f, 60, GL_WINDOWS_60).heat > 0) on.push(f);
  const runs = []; for (const f of on) { if (runs.length && runs[runs.length - 1].end === f - 1) runs[runs.length - 1].end = f; else runs.push({ start: f, end: f }); }
  if (runs.length !== 4) fail.push('the glitch is ' + runs.length + ' runs at sixty, not three bursts and a residue');
  for (let i = 1; i < runs.length; i++) if (runs[i].start - runs[i - 1].end - 1 < 4) fail.push('bursts ' + i + ' and ' + (i + 1) + ' are ' + (runs[i].start - runs[i - 1].end - 1) + ' frames apart, which is a strobe');
  if (on.length > 12) fail.push(on.length + ' glitched frames at sixty, over twelve');
  if (on.length && (on[0] / 60 < GL.bursts[0].t - 1e-6 || on[on.length - 1] / 60 > CUT + 0.05)) fail.push('the glitch runs from ' + (on[0] / 60).toFixed(2) + ' to ' + (on[on.length - 1] / 60).toFixed(2));
  if (GL.flash !== 0) fail.push('the glitch flashes');
  const g = glitchAt(GL_WINDOWS[1].t0 * FPS);
  if (!(g.split > 0 && g.slices.length === GL.slices && (g.jx !== 0 || g.jy !== 0))) fail.push('the second burst is not a jump with slices and a split');
  if (state.glitched !== GL_WINDOWS.reduce((a, w) => a + w.frames, 0)) fail.push(state.glitched + ' frames were glitched, and the windows say ' + GL_WINDOWS.reduce((a, w) => a + w.frames, 0));
  /* the pill, the hearts and the shy pose are gone on the cut, and nothing
     of the end card shows before it */
  if (bubbleAt(CUT).o !== 0 || heartsAt(CUT).some(h => h.o > 0) || shyAt(CUT).p !== 0) fail.push('the shy scene is still up after the cut');
  if (frameAt(CUT - 1 / 60, 0).wm.o !== 0 || frameAt(CUT, 0).wm.o !== 1) fail.push('the wordmark is not on the cut');
}

/* ---------- no colour but the house's and the pink: the pink on the hearts and the blush only ---------- */
{
  const mine = sceneHtml(plan).split('==== this clip\'s own css starts here ====')[1].split('</style>')[0];
  const pinks = (mine.match(/var\(--pink\)/g) || []).length;
  if (pinks !== 2) fail.push('the pink is painted in ' + pinks + ' places in the css, which is not the hearts and their glow');
  if ((mine.match(new RegExp(PINK, 'gi')) || []).length !== 1) fail.push('the pink hex appears more than once in the css');
  if (/var\(--accent\)|var\(--red\)/.test(mine)) fail.push('the accent or the red is painted somewhere');
  if (/--iris/.test(mine)) fail.push('the iris is overridden, and his eyes stay the module\'s');
}

/* ---------- the module's own report ---------- */
for (const st of rep60.states) if (st.entryFrames == null) fail.push(st.state + ' never reached its own mark');
if (rep60.outside.units > 0) fail.push('feature ink lands ' + rep60.outside.units.toFixed(2) + ' units outside the head silhouette');
if (rep60.frozenFrames) fail.push(rep60.frozenFrames + ' frames where the face is not moving at all');

/* ---------- the fast things, and nothing is a still ---------- */
if (FASTEST > STEP_CEIL) fail.push('he moves ' + FASTEST + ' css px on one frame at 60 while on screen');
/* the peeks are sharp, so their fastest frame is a cut rather than a smear:
   the site's ease leaves at full speed, and a head this size covers a lot
   in a sixtieth. the ceiling is a peek's own. */
if (Math.max(peek1Step.d, peek2Step.d) > PEEK_STEP_CEIL) fail.push('a peek moves ' + Math.max(peek1Step.d, peek2Step.d) + ' css px on one frame at 60');
if (BLUR && !BLUR_ARG && FPS === 60 && FASTEST / SUB > SUB_STEP_WANT + 1e-6) fail.push('the solved shutter leaves ' + (FASTEST / SUB).toFixed(2) + ' css px between samples');
if (!BLUR) fail.push('the shutter is closed, and the pop wants the blur');
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
console.log('    the pink is this clip\'s own, ' + PINK + ': the site has no pink token');
console.log('    the glow is the module\'s two layers held at the house css px at every size, see the header');
console.log('    the film is silent by design; einz adds the sound');

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
