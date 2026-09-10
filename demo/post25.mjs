/* the boring tek — post25, bug 2. he eats one, and it disagrees with him.

     cd demo
     DEMO_FPS=12 node post25.mjs      the preview pass
     node post25.mjs --blur           the 60fps final, shutter open
     node post25.mjs --blur=6         say the subframe count rather than solving for it
     node post25.mjs --check          build the page, run the guards, render nothing
     node post25.mjs --encode-only    re-encode from kept frames
     node post25.mjs --keep-frames    leave the jpegs on disk

   **one output path, overwritten every run:**
   `demo/out/post25-dark-1080x1920.mp4`. Beat stills land in
   `demo/out/verify-post25/` and the page's own measurements in
   `demo/out/post25-built.json`.

   ---------- what it is ----------
   he sits still in the middle of a black frame. a bug comes in over the top
   edge, crawls down past his shoulder and tucks in underneath him. he drops on
   it and eats it. he holds still with his eyes a little wide. then a green
   cloud comes out from under him and drifts away, he says good one, and blinks.
   the fault takes the lot and puts the wordmark up.

   ---------- what it reuses ----------
   **the bug is post15's, unchanged**: the same top view, the same table, the
   same alternating tripod driven by distance rather than by time, the same
   seeded antenna schedule. so is the eating — the rise, the lunge, the contact,
   the three chews and the bob are post15's numbers on post15's one transform on
   `#m-zone`, which `lib/mascot.mjs` writes nothing to. the module draws him,
   `lib/sfx.mjs` builds the sounds and does the mix, `lib/captions.mjs` hands
   over index.html's own colour tokens.

   **post15 shipped its eating silent.** the bite and the three chews had
   `crunch` on them and they were pulled, because einz was putting his own on
   that stretch; the recipe stayed in `lib/sfx.mjs` for the next clip that ate
   something. this is that clip, so they are wired: one recipe at two settings,
   the bite lower and grittier than the chewing.

   ---------- the walk is a curve now, and post15's gait did not have to move --
   post15 walks its bug in a straight lane and the whole of its no-sliding
   argument is that a foot is planted at a page position worked out from the
   **distance the body had covered** when the stance began. that argument does
   not care whether the lane is straight: it cares that a plant is a function of
   arclength and of nothing else.

   so the lane became a curve and `legFoot` is the only thing that changed. it
   asks `PATH` where the body was at distance `xs` and which way it was pointing,
   and puts the foot down in that frame. everything above it — the tripod, the
   duty cycle, the swing, the pull, the knees, the antennae, the settle — is
   post15's, untouched, and the no-sliding guard still measures 0 px.

   **the path is six segments, three straight and three arcs**, tangent at every
   join so the heading is continuous and the bug turns rather than snaps: in at
   the top centre, a wide arc left, a wide arc back to vertical, down the left
   side, a quarter turn along the floor, and right to a stop under him. every
   number in it is derived — the left lane off the safe line and the bug's own
   width, the two turn radii off how far left the lane has to reach, the floor
   run off what is left over.

   post15's wobble rides on top of it as a **normal offset** rather than as a y,
   which is the same two sines it always was, read against the curve instead of
   against a horizontal.

   ---------- what the curve cost, and it is one number ----------
   the curve is 828 page px where the straight lane was 659, and the walk kept
   its 2.20s. so the gait went from 8.1 frames a cycle at sixty to **6.4**. the
   legs are the same legs at the same duty; there are just more strides in the
   same time, and it is the one thing in this cut that is worse than the last.
   half a second more walk puts it back and nothing else would have to move.

   ---------- and now he watches it ----------
   the module's turn is a channel on a mark: a clip says "look this far that
   way" and the state machine gets it there. this clip needs it as a **function
   of where the bug is** on every frame, which no mark can express, so the turn
   is written here — with the module's own `TURN` table, its own `EYE_CX` and
   its own `headSD`, so the five moves are the module's five moves and not a
   lookalike. `bias: 0` means the module writes nothing to the channel, so there
   is nothing for this to fight.

   ---------- and the eating is silent ----------
   post15 pulled the crunches off the bite and the three chews because einz was
   putting his own on that stretch, and the same is true here: between the bug
   stopping and the sputter there is nothing at all, and the guard says so.

   ---------- the cloud is an effect and it is the only colour ----------
   no pictogram and no drawn puff: six soft radial fields in index.html's own
   dark green, blurred, growing, drifting up and out and gone inside a second.
   everything else on the frame is the mascot's white on near black.

   ---------- the shutter is closed and that is a measurement ----------
   the fastest thing here is the lunge. it is walked at sixty before a browser
   is opened and guarded against the ceiling a closed shutter still carries, so
   the file says whether it needs subframes rather than assuming either way.
*/

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  planMascot, mascotFrame, mascotCss, mascotMarkup, mascotRuntime, mascotPagePlan,
  mascotCues, headRect, headSD, describeMascot,
  STAGE, SAFE, GRID, HEAD, HEAD_PX, EYE_CX, TURN,
} from './lib/mascot.mjs';
import { brandTokens } from './lib/captions.mjs';
import {
  SR, FART, renderSfx, mixdown, applyGain, limit, writeWav, loudness,
} from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post25');
const VERIFY = path.join(OUT, 'verify-post25');

const VW = STAGE.w, VH = STAGE.h, DSF = STAGE.dsf;
const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1 / FPS;
const THEME = 'dark';

const argv = process.argv.slice(2);
const ONLY_ENCODE = argv.includes('--encode-only');
const KEEP = argv.includes('--keep-frames');
const CHECK = argv.includes('--check');
/* ---------- the shutter ----------
   a frame is the light that arrived over its own duration, not a sample of one
   instant, so a fast move is rendered as several subframes and averaged. with
   no number the file works it out from its own fastest move, which is the only
   honest way to pick it: what matters is how far the quickest thing on the
   screen travels **between two samples**, and that is a property of this cut.
   post20's landing is the reference — 6.3 css px a sample. */
const BLUR = argv.some(a => a === '--blur' || a.startsWith('--blur='));
const BLUR_ARG = Number((argv.find(a => a.startsWith('--blur=')) || '').split('=')[1]) || 0;
const SUB_STEP_WANT = 6.3, SUB_MAX = 12;
const SUBS = path.join(OUT, 'subframes-post25');

/* ---------- small maths ---------- */
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a), 0, 1));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = q => (q <= 0 ? 0 : q >= 1 ? 1 : q * q * (3 - 2 * q));
const OUTC = p => 1 - Math.pow(1 - p, 3);
const r2 = v => Math.round(v * 100) / 100;
function prng(seed) {
  let x = seed | 0 || 0x1a2b3c;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x |= 0; return (x >>> 0) / 4294967296; };
}

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ==========================================================================
   the bug — post15's table, unchanged
   ==========================================================================
   drawn in code, flat, in the mascot's own ink, and it is a top view: six legs,
   two antennae and a body, which is what a child draws when you say bug and
   what survives being small. every number is css px in the bug's own frame,
   with +x its heading and +y its right hand side. */
const SC = 1.30;
const BUG = {
  body: { l: 29, w: 16, r: 8 },
  head: { l: 10.6, w: 12, r: 5.5, gap: 1.2 },
  /* the three x ranges do not overlap and that is the point: post15's first cut
     had them at 17, 0.9 and -15.3, which crossed two legs on the same side on
     half the frames, and a crossed pair reads as a tangle rather than a gait. */
  hips: [{ x: 9.6, y: 6.0 }, { x: 0.6, y: 7.4 }, { x: -9.2, y: 6.0 }],
  feet: [{ x: 19.0, y: 14.5 }, { x: 0.6, y: 21.0 }, { x: -18.0, y: 15.0 }],
  femur: 10.8, tibia: 10.8, legW: 2.2,
  ant: { len: 15, w: 2.0, angle: 28, bend: 18, y: 0.30,
    wob: [{ amp: 5.5, period: 0.47 }, { amp: 3.0, period: 0.31 }],
    flick: { every: [0.44, 1.05], for: 0.13, by: 14 } },
  /* `duty` is a little over the half a tripod gait needs — under 0.5 there is a
     moment with fewer than three legs down, which is a run rather than a walk. */
  stride: 34, duty: 0.55, swingPull: 1.8, sway: 1.5, yaw: 3.2,
  /* the wobbly path, as a function of x rather than of t: a foot plants at the
     body's own position at the moment the stance began, and a path in x hands
     that back with no inversion. two wavelengths that do not divide each other. */
  path: { mid: 0, a1: 4.6, l1: 137, p1: 0.9, a2: 2.2, l2: 61, p2: 2.4 },
  seed: 0x51b0e3,
};

/* the ink's own extent in the bug's frame, worked out from the table rather
   than typed. the feet are in it at their widest sweep, because a leg reaching
   forward is ink like any other. */
const BUG_INK = (() => {
  const sweep = BUG.stride * BUG.duty / 2;
  const nose = BUG.body.l / 2 + BUG.head.gap + BUG.head.l;
  const ant = nose + BUG.ant.len * Math.cos((BUG.ant.angle - BUG.ant.bend) * Math.PI / 180);
  const front = Math.max(ant, BUG.feet[0].x + sweep) + BUG.legW / 2;
  const back = Math.min(-BUG.body.l / 2, BUG.feet[2].x - sweep) - BUG.legW / 2;
  const side = Math.max(...BUG.feet.map(f => f.y)) + BUG.legW / 2;
  return { front, back, side, sweep, len: front - back, w: side * 2 };
})();

/* ---------- the walk, as a speed profile ----------
   constant, then a smoothstep down into nothing. it is a speed and it is
   integrated rather than an eased position: the stop has to be a deceleration,
   and the gait reads the distance, so the thing that has to be smooth is the
   distance's own derivative. the integral of one minus a smoothstep over its
   window is exactly a half, so `V * (flat + dec/2)` is the distance and that is
   what fixes V rather than a number somebody tuned. */
const WALK = { t0: 0.00, t1: 2.20, dec: 0.36, x0: null, x1: null };
function walkSetup(startX, stopX) {
  WALK.x0 = startX; WALK.x1 = stopX;
  WALK.flat = WALK.t1 - WALK.t0 - WALK.dec;
  WALK.v = (stopX - startX) / (WALK.flat + WALK.dec / 2);
  WALK.xd = startX + WALK.v * WALK.flat;
  return WALK;
}
function walkX(t) {
  if (t <= WALK.t0) return WALK.x0;
  if (t >= WALK.t1) return WALK.x1;
  const u = t - WALK.t0;
  if (u <= WALK.flat) return WALK.x0 + WALK.v * u;
  const q = (u - WALK.flat) / WALK.dec;
  return WALK.xd + WALK.v * WALK.dec * (q - q * q * q + q * q * q * q / 2);
}
function pathY(x) {
  const P = BUG.path;
  return P.mid + P.a1 * Math.sin(x / P.l1 + P.p1) + P.a2 * Math.sin(x / P.l2 + P.p2);
}
function pathSlope(x) {
  const P = BUG.path;
  return P.a1 / P.l1 * Math.cos(x / P.l1 + P.p1) + P.a2 / P.l2 * Math.cos(x / P.l2 + P.p2);
}

/* ==========================================================================
   the lane, as a curve
   ==========================================================================
   straights and arcs, tangent at every join, walked by arclength. that is the
   whole reason it is arcs rather than a bezier: a bezier's parameter is not its
   arclength, and every line in the gait below is a function of how far the body
   has actually travelled. an arc's is, exactly, and the heading is continuous
   across a tangent join by construction rather than by tuning.

   `turn` is the change in heading in degrees, positive toward the frame's left
   (the page's y is down, so a positive turn puts the centre at heading + 90). */
const DEG = Math.PI / 180;
function buildPath(start, th0, plan) {
  const segs = [];
  let p = { ...start }, th = th0 * DEG, S = 0;
  for (const g of plan) {
    if (g.line != null) {
      segs.push({ at: S, len: g.line, kind: 'line', x: p.x, y: p.y, th, why: g.why });
      p = { x: p.x + Math.cos(th) * g.line, y: p.y + Math.sin(th) * g.line };
      S += g.line;
    } else {
      const sign = Math.sign(g.turn), R = g.r, d = Math.abs(g.turn) * DEG;
      const c = { x: p.x + R * Math.cos(th + sign * Math.PI / 2),
        y: p.y + R * Math.sin(th + sign * Math.PI / 2) };
      segs.push({ at: S, len: R * d, kind: 'arc', cx: c.x, cy: c.y, r: R, th0: th, sign, why: g.why });
      th += sign * d;
      p = { x: c.x + R * Math.cos(th - sign * Math.PI / 2),
        y: c.y + R * Math.sin(th - sign * Math.PI / 2) };
      S += R * d;
    }
  }
  return { segs, len: +S.toFixed(3), end: p, endTh: th };
}
/* the point and the heading at page arclength S. */
function arcAt(S) {
  const L = PATH.segs;
  let i = 0;
  while (i + 1 < L.length && S >= L[i + 1].at) i++;
  const g = L[i], u = S - g.at;
  if (g.kind === 'line') return { x: g.x + Math.cos(g.th) * u, y: g.y + Math.sin(g.th) * u, th: g.th };
  const th = g.th0 + g.sign * u / g.r;
  return { x: g.cx + g.r * Math.cos(th - g.sign * Math.PI / 2),
    y: g.cy + g.r * Math.sin(th - g.sign * Math.PI / 2), th };
}
/* and the same thing in the bug's own units, with post15's wobble on top of it
   as a **normal offset**: the two sines are what they always were, read against
   the curve rather than against a horizontal, and their slope is added to the
   heading exactly as post15 added it. */
function pathPoint(s) {
  const p = arcAt(s * SC);
  const n = pathY(s) * SC;
  return {
    x: p.x - n * Math.sin(p.th), y: p.y + n * Math.cos(p.th),
    th: p.th + Math.atan(pathSlope(s)),
  };
}
/* a point in the bug's own frame — +x its heading, +y its right hand side, in
   bug units — placed in the page against a frame. */
function place(f, lx, ly) {
  const c = Math.cos(f.th), sn = Math.sin(f.th);
  return { x: f.x + (lx * c - ly * sn) * SC, y: f.y + (lx * sn + ly * c) * SC };
}
/* the normal: the page direction the bug's own +y points in. */
const normal = f => ({ x: -Math.sin(f.th), y: Math.cos(f.th) });

/* ---------- one leg ----------
   the whole no-sliding argument, and the curve did not weaken it. the stance
   that phase `k` opens began with the body at arclength `xs`; the foot was set
   down at that frame's own position plus the resting offset and the sweep, and
   it is **returned unchanged for the whole stance**. nothing about it is a
   function of the frame rate, the speed profile, the deceleration into the
   stop, or of where the body is now. */
function planted(xs, rest) {
  return place(pathPoint(xs), rest.x + BUG_INK.sweep, rest.y);
}
function legFoot(x, off, rest) {
  const S = BUG.stride, D = BUG.duty;
  const ph = x / S + off;
  const k = Math.floor(ph), p = ph - k;
  const a = planted((k - off) * S, rest);
  if (p < D) return { x: a.x, y: a.y, planted: true, pull: 0 };
  const b = planted((k + 1 - off) * S, rest);
  const q = (p - D) / (1 - D);
  /* the pull is a hump rather than a ramp: from above a lifted leg is a shorter
     leg, and the foot is at its own height at both ends of the swing. */
  return { x: lerp(a.x, b.x, smooth(q)), y: lerp(a.y, b.y, smooth(q)),
    planted: false, pull: BUG.swingPull * Math.sin(Math.PI * q) };
}
/* two bones to a foot, the knee off the circle intersection on the side away
   from the body, which is what an insect knee does and a mammal knee does not.
   the bones are in bug units and everything handed to it is in page px, so the
   scale goes on here rather than in six call sites. */
function knee(hip, foot, side) {
  const dx = foot.x - hip.x, dy = foot.y - hip.y;
  const d = Math.max(1e-3, Math.hypot(dx, dy));
  const L1 = BUG.femur * SC, L2 = BUG.tibia * SC;
  const dd = Math.min(d, (L1 + L2) * 0.999);
  const a = (L1 * L1 - L2 * L2 + dd * dd) / (2 * dd);
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const ux = dx / d, uy = dy / d, s = side >= 0 ? 1 : -1;
  return { x: hip.x + ux * a - uy * h * s, y: hip.y + uy * a + ux * h * s, reach: d };
}
function antennaSchedule(seconds, seed) {
  const rnd = prng(seed), out = [];
  let t = 0.25, side = 0;
  while (t < seconds) {
    out.push({ t: +t.toFixed(3), side, for: BUG.ant.flick.for });
    t += lerp(BUG.ant.flick.every[0], BUG.ant.flick.every[1], rnd());
    side = 1 - side;
  }
  return out;
}
/* how long the feet take to plant themselves after the body stops. */
const BUG_SETTLE = 0.22;

/* ---------- the bug, at second t, in page px ----------
   post15's function with one thing swapped: the body's frame comes off the
   curve rather than off a horizontal, and every local offset is placed through
   it. the tripod, the duty, the swing, the pull, the sway, the yaw and the
   settle are the numbers post15 tuned. */
function bugFrame(t, sched) {
  const x = walkX(t);
  const ph = x / BUG.stride;
  /* the settle. when the body stops the phase stops with it and a leg caught
     mid swing would freeze in the air, so over SETTLE every foot walks to its
     own resting position — an insect planting its feet rather than a rig being
     switched off. it is the one window the no-sliding guard does not read. */
  const set = smooth(span(t, WALK.t1, WALK.t1 + BUG_SETTLE));
  const gait = 1 - set;

  /* there is no bounce: what a walking insect does with its body is roll and
     yaw over the planted tripod, and both of those are lateral, and lateral is
     what a flat top view can draw. the sway goes along the curve's own normal
     rather than along the page's y, which is the whole of what a curve changes
     about it. */
  const pf = pathPoint(x);
  const sway = BUG.sway * Math.sin(2 * Math.PI * ph) * gait;
  const yaw = BUG.yaw * Math.cos(2 * Math.PI * ph) * gait;
  const nrm = normal(pf);
  const body = {
    x: pf.x + nrm.x * sway * SC, y: pf.y + nrm.y * sway * SC,
    th: pf.th + yaw * DEG,
  };
  const rot = body.th / DEG;

  const legs = [];
  let worstReach = 0;
  for (let s = 0; s < 2; s++) {
    const sg = s === 0 ? -1 : 1;
    for (let i = 0; i < 3; i++) {
      /* the alternating tripod: front left, middle right, rear left together. */
      const off = ((s === 1) !== (i === 1)) ? 0.5 : 0;
      const rest = { x: BUG.feet[i].x, y: BUG.feet[i].y * sg };
      const hip = place(body, BUG.hips[i].x, BUG.hips[i].y * sg);
      const f = legFoot(x, off, rest);
      /* the resting position is read against the **path** frame rather than the
         body's, so the settle walks a foot to where the leg hangs rather than to
         where the sway happens to have the body on that frame. post15's line. */
      const restPos = place(pf, rest.x, rest.y);
      const pull = f.pull * sg * (1 - set) * SC;
      const foot = {
        x: lerp(f.x, restPos.x, set) - nrm.x * pull,
        y: lerp(f.y, restPos.y, set) - nrm.y * pull,
      };
      const kn = knee(hip, foot, sg);
      worstReach = Math.max(worstReach, kn.reach);
      legs.push([hip.x, hip.y, kn.x, kn.y, foot.x, foot.y]);
    }
  }

  const A = BUG.ant;
  const nose = BUG.body.l / 2 + BUG.head.gap + BUG.head.l;
  const ants = [];
  for (let s = 0; s < 2; s++) {
    const sg = s === 0 ? -1 : 1;
    /* the two wobbles run a fixed phase apart on the two sides, so the pair is
       never symmetric — two antennae moving together are a pair of horns. */
    let a = A.angle;
    for (const w of A.wob) a += w.amp * Math.sin(2 * Math.PI * t / w.period + s * 1.7);
    for (const fl of sched) {
      if (fl.side === s && t >= fl.t && t < fl.t + fl.for) {
        a += A.flick.by * Math.sin(Math.PI * (t - fl.t) / fl.for);
      }
    }
    const root = { x: nose - A.len * 0.14, y: BUG.head.w * A.y * sg };
    const r1 = a * sg * Math.PI / 180, rr = (a + A.bend) * sg * Math.PI / 180;
    const mid = { x: root.x + Math.cos(r1) * A.len * 0.52, y: root.y + Math.sin(r1) * A.len * 0.52 };
    const tip = { x: mid.x + Math.cos(rr) * A.len * 0.48, y: mid.y + Math.sin(rr) * A.len * 0.48 };
    const P = [root, mid, tip].map(q => place(body, q.x, q.y));
    ants.push([P[0].x, P[0].y, P[1].x, P[1].y, P[2].x, P[2].y]);
  }
  return { x, ph, body, rot, legs, ants, worstReach, settled: set >= 1 };
}

/* every point of the drawn ink, in page px, so the page and the guards read one
   list. the body's corners are in it because the lozenge is ink the way a leg
   is, and the legs are taken off the drawn numbers rather than off the table —
   they are where the gait put them and that is what a clearance is about. */
function bugPoints(bf) {
  const out = [];
  const nose = BUG.body.l / 2 + BUG.head.gap + BUG.head.l;
  const corner = (px, py) => { const p = place(bf.body, px, py); out.push([p.x, p.y]); };
  for (const px of [-BUG.body.l / 2, nose]) for (const py of [-BUG.head.w / 2 - 1, BUG.head.w / 2 + 1]) corner(px, py);
  for (const py of [-BUG.body.w / 2, BUG.body.w / 2]) corner(-BUG.body.l / 2, py);
  for (const L of bf.legs) { out.push([L[2], L[3]]); out.push([L[4], L[5]]); }
  for (const A of bf.ants) { out.push([A[2], A[3]]); out.push([A[4], A[5]]); }
  return out;
}

/* one tick per stride boundary, read off the walk rather than laid on a grid:
   the times are the instants the body has covered another whole stride, so as
   it decelerates the last few spread out and then stop on their own. */
function stepTimes() {
  const out = [];
  let last = Math.floor(walkX(WALK.t0) / BUG.stride);
  for (let i = 1; i <= Math.round(480 * (WALK.t1 - WALK.t0)); i++) {
    const t = WALK.t0 + i / 480;
    const k = Math.floor(walkX(t) / BUG.stride);
    if (k > last) { out.push(+t.toFixed(4)); last = k; }
  }
  return out;
}

/* ==========================================================================
   where he stands, and the clock
   ==========================================================================
   dead centre, and the plate's own centre is worked out from the module's
   geometry rather than from a number typed here. it is done before the plan
   exists because the cloud and the bubble are timed off each other and the
   plan needs the bubble's mark, and a circle of three would be no order at all. */
const SIZE = 128;
const UNIT = SIZE / GRID;
const HOME = { left: +(VW / 2 - SIZE / 2).toFixed(2), top: +(VH / 2 - SIZE / 2).toFixed(2), size: SIZE };
const PLATE = {
  cx: HOME.left + (HEAD.plate.x + HEAD.plate.s / 2) * UNIT,
  cy: HOME.top + (HEAD.plate.y + HEAD.plate.s / 2) * UNIT,
  r: HEAD.plate.s / 2 * UNIT,
};
const LANE_CLEAR = 26;                 /* css px of air between his ink and the bug */

/* ---------- the bite ----------
   post15's table. `by` is derived below rather than typed: the file walks the
   lunge down until his drawn ellipse contains every corner of the bug's drawn
   ink on the contact frame, then adds a margin. `fwd` is small and negative on
   purpose — he leans out over the bug rather than back off it. */
const BITE = { at: 2.46, rise: 0.10, riseBy: 7, down: 0.10, fwd: -4,
  /* the contact is 0.10 rather than 0.05 for a reason post15's preview found:
     the frame the bug is switched off on has to be a frame his head is at the
     bottom of its lunge, and a contact shorter than one frame of the pass that
     is rendering has no such frame in it. one twelfth is 0.083, so 0.10 holds
     at both rates and the guard checks both. */
  land: 0.10, squash: 0.075, up: 0.14, margin: 5, by: 0 };
const BITE_HIT = +(BITE.at + BITE.rise + BITE.down).toFixed(4);
const BITE_END = +(BITE_HIT + BITE.land + BITE.up).toFixed(4);
/* ---------- the chew ----------
   three pulses and a bob. a pulse is a squash and a lateral working of the head
   with the side alternating, fast in and slower out, because a chew that
   released as fast as it closed would be a mechanism. */
const CHEW = { at: BITE_END, pulses: 3, for: 0.20, peak: 0.34,
  squash: 0.055, shift: 3.4, roll: 1.7, bob: { for: 0.20, by: 5 } };
const CHEW_END = +(CHEW.at + CHEW.pulses * CHEW.for + CHEW.bob.for).toFixed(4);
const CHEW_HITS = Array.from({ length: CHEW.pulses },
  (_, i) => +(CHEW.at + i * CHEW.for + CHEW.for * CHEW.peak * 0.5).toFixed(4));
/* ---------- the eyes shut ----------
   shut is a line, not a lid. hold the module's blink for a second and the face
   is not a face with its eyes closed, it is a face with no eyes — so the eye is
   squashed to a quarter of its own height instead, which leaves a thin bar of
   the same ink an open eye is drawn in. */
const SHUT = { at: +(BITE.at + BITE.rise).toFixed(4), in: 0.09,
  until: +(CHEW_END + 0.02).toFixed(4), out: 0.16, sy: 0.26 };

/* ---------- he holds still with his eyes a little wide ----------
   a scale on the pair and nothing else. no state, because every state in the
   module's table brings a head move with it and the beat is him **not** moving.
   it is capped a fifth over whatever the module asked for, so it reads as
   attention rather than as surprise, and the cap is a guard. */
const WIDE = { at: +(CHEW_END + 0.04).toFixed(4), in: 0.18, until: 4.46, out: 0.22, by: 1.20 };
/* and the tiny shake, on the same one transform the bite is on. */
const SHAKE = { at: +(CHEW_END + 0.14).toFixed(4), for: 0.72, by: 1.5, hz: 11 };

/* ---------- the cloud ----------
   six soft fields, seeded, out from under him and away to one side. they grow,
   drift up and out and are gone inside a second, which is the whole of the beat
   the brief asks for. it is the only colour on the clip and the only drawing in
   it that is not the mascot or the bug. */
const SIDE = -1;                       /* screen left */
const FART_AT = +(WIDE.until + 0.06).toFixed(4);
const CLOUD = { n: 6, for: 0.82, rise: 96, out: 70, r0: 26, grow: 2.5, o: 0.42,
  from: { x: +(PLATE.cx - 34).toFixed(1), y: +(HOME.top + SIZE - 6).toFixed(1) } };
const PUFFS = (() => {
  const rnd = prng(0x2f7a11);
  return Array.from({ length: CLOUD.n }, (_, i) => ({
    delay: +(i * 0.038 + rnd() * 0.035).toFixed(3),
    life: +(CLOUD.for * (0.62 + rnd() * 0.38)).toFixed(3),
    dx: +((rnd() * 2 - 1) * 26).toFixed(1),
    dy: +(rnd() * 14).toFixed(1),
    out: +(0.45 + rnd() * 0.75).toFixed(3),
    rise: +(0.70 + rnd() * 0.55).toFixed(3),
    r: +(CLOUD.r0 * (0.72 + rnd() * 0.60)).toFixed(1),
  }));
})();
const CLOUD_END = +(FART_AT + Math.max(...PUFFS.map(p => p.delay + p.life))).toFixed(4);

/* ---------- the bubble ----------
   the module hangs it off the mark's own settle, 0.12 after the entrance ends,
   so the mark is placed **backwards from when the pill has to arrive** rather
   than forwards from a number that reads well. it arrives a tenth after the
   last of the cloud has gone: two things leaving and arriving on one frame are
   two events and neither of them reads. */
const NEUTRAL_ENTRY = 0.46, BUBBLE_LEAD = NEUTRAL_ENTRY + 0.12;
const BUBBLE_AT = +(CLOUD_END + 0.12 - BUBBLE_LEAD).toFixed(4);
/* the plan is cut longer than the film on purpose: the last mark's hold is
   whatever room is left before the plan ends, and that room is what buys the
   bubble its full 0.90s hold instead of the 0.42 floor. the film's own length
   is `SECONDS` below and it is derived off the bubble, not off this. */
const PLAN_SECONDS = 9.0;

const plan = planMascot({
  marks: [
    { t: 0.30, state: 'neutral' },
    /* neutral again rather than delighted: the brief's last beat is a line and
       one slow blink, and a state with hops in it would be a third thing moving
       under something that is meant to land dry. */
    { t: BUBBLE_AT, state: 'neutral', bubble: 'good one' },
  ],
  seconds: PLAN_SECONDS, theme: THEME, size: SIZE, bias: 0,
  thought: 'over', hands: false,
});
/* `planMascot` owns the corner and this owns the placement, and it is written
   before `mascotCss` is called because that function reads the box. */
plan.box = { ...HOME };

const BUB = plan.marks.find(m => (m.bubbles || []).length).bubbles[0];

/* ---------- one slow blink ----------
   the module's own is sixty milliseconds, which is a blink. this is a beat, so
   it is written here as a push on the lid — one directional, the way every
   write to the module's face in this house is: the clip asks for at least this
   much shut, and a module blink underneath still reads. */
const BLINK = { at: +(BUB.full + 0.16).toFixed(4), close: 0.17, hold: 0.07, open: 0.22 };

/* ---------- the end ----------
   the cut takes the line while it is still fully up. a wordmark that arrives
   after the bubble has faded on its own is two endings. */
const END = { hard: 0.12, tail: 0.18, wmFor: 0.09, hold: 0.90 };
const FAULT_AT = +BUB.leaving.toFixed(4);
const WM_AT = +(FAULT_AT + END.wmFor).toFixed(4);
const SECONDS = +(FAULT_AT + END.hold).toFixed(4);
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16, minCapPx: 56 };
const GL = { shakeX: 15, shakeY: 8, split: 9.5, flash: 0.30, flashSize: 420, calmFrom: 0.86 };
const STEP_CEIL = 42;                  /* css px a frame at 60 a closed shutter still carries */
const CRF = 17;
const TARGET_LUFS = -14, SAMPLE_CEILING = -1.8, MAX_REDUCTION = 5.0, MIN_LUFS = -16;

/* ==========================================================================
   the lane, and the sidestep
   ========================================================================== */
/* the lowest his ink ever gets before the bite, walked frame by frame. the bite
   is excluded: it lunges him a whole head downward and a head mid lunge is not
   a head standing over a lane. */
const HEAD_BOTTOM = (() => {
  let worst = -Infinity, at = 0;
  for (let f = 0; f < Math.round(60 * (BITE.at - 0.05)); f++) {
    const t = f / 60;
    const bottom = VH - headRect(plan, mascotFrame(plan, t)).bottom / DSF;
    if (bottom > worst) { worst = bottom; at = +t.toFixed(3); }
  }
  return { y: +worst.toFixed(2), at };
})();
/* the lane is his ink, plus the clearance, plus the bug's own reach **sideways**
   — sideways, because it arrives along the floor heading right and the part of
   it nearest him is its flank. post15's sentence, and post15's `side`. */
const LANE = +(HEAD_BOTTOM.y + LANE_CLEAR + BUG_INK.side * SC).toFixed(2);

/* ---------- the six segments ----------
   the left lane is the safe line plus the bug's own half width plus a margin;
   the two turn radii fall out of how far left that is, because an S of two
   equal arcs of `turn` degrees moves 2R(1 - cos turn) sideways and nothing else
   about it is free; the floor run is what is left between the bottom arc and
   his centre line. change his size or the bug's scale and every one of them
   moves. */
const LEFT_CLEAR = 16;
const LEFT = +(SAFE.left / DSF + BUG_INK.side * SC + LEFT_CLEAR).toFixed(2);
const S_TURN = 45;                     /* degrees each way on the entry S */
const FLOOR_R = 84;                    /* the quarter turn onto the floor */
const DOWN_RUN = 20;                   /* straight down the left side between them */
const TURN_R = +((PLATE.cx - LEFT) / (2 * (1 - Math.cos(S_TURN * DEG)))).toFixed(3);
const FLOOR_RUN = +(PLATE.cx - LEFT - FLOOR_R).toFixed(2);
/* the top of the S, worked back from the floor so the joins land where they
   have to rather than where they happen to. */
const S_DROP = 2 * TURN_R * Math.sin(S_TURN * DEG);
const TOP_Y = +(LANE - FLOOR_R - DOWN_RUN - S_DROP).toFixed(2);
const START_Y = +(-BUG_INK.front * SC - 6).toFixed(2);
const PATH = buildPath({ x: PLATE.cx, y: START_Y }, 90, [
  { line: +(TOP_Y - START_Y).toFixed(2), why: 'in over the top edge, dead centre' },
  { turn: S_TURN, r: TURN_R, why: 'the wide arc left, around him' },
  { turn: -S_TURN, r: TURN_R, why: 'and back to vertical, out on the left lane' },
  { line: DOWN_RUN, why: 'down the left side' },
  { turn: -90, r: FLOOR_R, why: 'the quarter turn onto the floor' },
  { line: FLOOR_RUN, why: 'along the floor, to a stop under him' },
]);
for (const [what, v] of [['the entry run', TOP_Y - START_Y], ['the floor run', FLOOR_RUN]]) {
  if (v <= 0) throw new Error(what + ' came out at ' + v.toFixed(1) + ' — the lane does not fit');
}

/* the walk is the whole path, in the bug's own units. */
walkSetup(0, PATH.len / SC);
/* the wobble is offset so the stop is dead under him rather than up to seven px
   off it. one line, solved rather than tuned. */
BUG.path.mid = -(BUG.path.a1 * Math.sin(WALK.x1 / BUG.path.l1 + BUG.path.p1)
  + BUG.path.a2 * Math.sin(WALK.x1 / BUG.path.l2 + BUG.path.p2));

const ANT_SCHED = antennaSchedule(SECONDS, BUG.seed);
const STEPS = stepTimes();

/* the drawn numbers and the ink box, both already in page px. */
function bugPage(bf) {
  const P = bugPoints(bf);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of P) {
    x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]);
    x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
  }
  const pad = BUG.legW * SC / 2;
  return {
    body: [r2(bf.body.x), r2(bf.body.y), r2(bf.rot)],
    legs: bf.legs.map(L => L.map(r2)),
    ants: bf.ants.map(A => A.map(r2)),
    rect: { x: x0 - pad, y: y0 - pad, w: (x1 - x0) + pad * 2, h: (y1 - y0) + pad * 2 },
  };
}

/* ---------- the clearance, walked ----------
   the bug is in front of nothing and behind nothing: it goes **around** him and
   it is fully drawn on every frame of the walk. so what is measured is post15's
   number — the closest the bug's ink ever gets to his before he goes for it —
   plus where its own ink sits against the four safe lines, latched post15's way:
   it enters the rect once and never leaves it again.

   **it is his ellipse against the bug's points, not two boxes.** the first cut
   compared `headRect`'s box to the bug's box and reported 5.55 px on the bottom
   arc, where the bug is diagonal and its box is 108 px wide for 60 px of ink.
   two boxes cannot see a corner that is empty on both sides. the head is a
   circle at the shipped radius, so the exact test is the one the bite already
   uses, and the same `headInk` answers both. */
function clearance() {
  let worst = Infinity, at = 0, hit = null;
  let inAt = null, out = null, worstAir = Infinity, airAt = 0;
  const S = { left: SAFE.left / DSF, right: VW - SAFE.right / DSF,
    top: SAFE.top / DSF, bottom: VH - SAFE.bottom / DSF };
  const pad = BUG.legW * SC / 2;
  for (let f = 0; f <= Math.round(60 * (WALK.t1 + BUG_SETTLE)); f++) {
    const t = f / 60;
    const bf = bugFrame(t, ANT_SCHED);
    const ink = headInk(mascotFrame(plan, t), { x: 0, y: 0, sx: 1, sy: 1, rot: 0 });
    const c = Math.cos(-ink.th), sn = Math.sin(-ink.th);
    for (const [px, py] of bugPoints(bf)) {
      const dx = px - ink.cx, dy = py - ink.cy;
      const u = dx * c - dy * sn, v = dx * sn + dy * c;
      const ratio = Math.hypot(u / ink.a, v / ink.b);
      /* how far outside the edge that point is, along its own ray, less the
         stroke's own half width — a leg is a line with a body, not a hairline. */
      const gap = Math.hypot(dx, dy) * (1 - 1 / Math.max(ratio, 1e-6)) - pad;
      if (gap < worst) { worst = gap; at = +t.toFixed(3); }
      if (ratio <= 1 && !hit) hit = +t.toFixed(3);
    }
    /* the safe rect, latched: everything before the bug is inside it is a walk
       on over an edge, and everything after is a real overrun. */
    const b = bugPage(bf).rect;
    const air = Math.min(b.x - S.left, S.right - (b.x + b.w), b.y - S.top, S.bottom - (b.y + b.h));
    if (air >= 0 && inAt == null) inAt = +t.toFixed(3);
    if (inAt != null) {
      if (air < worstAir) { worstAir = air; airAt = +t.toFixed(3); }
      if (air < 0 && out == null) out = +t.toFixed(3);
    }
  }
  return { hit, worst: +worst.toFixed(2), at, inAt, out, worstAir: +worstAir.toFixed(2), airAt };
}

/* ==========================================================================
   the bite and the chew, as one transform on #m-zone
   ==========================================================================
   `lib/mascot.mjs` writes nothing to the zone. that is the seam post14 placed
   him through and post15 lunged and chewed through, and it is the seam this
   file uses for the same two moves plus the shake. `sq` is volume preserving:
   x is (1+q) and y is 1/(1+q), so a squashed circle is an ellipse of the same
   area rather than a head that got bigger. */
function biteZone(t) {
  const z = { x: 0, y: 0, sx: 1, sy: 1, rot: 0 };
  const T = BITE;
  if (t >= T.at && t < T.at + T.rise) {
    /* he goes up before he goes down, which is every entrance in the module and
       is what makes a lunge a decision rather than a twitch. */
    z.y = -T.riseBy * smooth((t - T.at) / T.rise);
  } else if (t >= T.at + T.rise && t < BITE_HIT) {
    const u = (t - T.at - T.rise) / T.down;
    /* accelerating, because a head going after something has mass. */
    z.y = lerp(-T.riseBy, T.by, u * u);
    z.x = T.fwd * (u * u);
  } else if (t >= BITE_HIT && t < BITE_HIT + T.land) {
    /* the contact, and the squash lives here and nowhere else. */
    const q = T.squash * Math.sin(Math.PI * (t - BITE_HIT) / T.land) ** 0.6;
    z.y = T.by; z.x = T.fwd; z.sx = 1 + q; z.sy = 1 / (1 + q);
  } else if (t >= BITE_HIT + T.land && t < BITE_END) {
    const e = 1 - (1 - (t - BITE_HIT - T.land) / T.up) ** 2;
    z.y = lerp(T.by, 0, e); z.x = lerp(T.fwd, 0, e);
  }
  if (t >= CHEW.at && t < CHEW.at + CHEW.pulses * CHEW.for) {
    const i = Math.min(CHEW.pulses - 1, Math.floor((t - CHEW.at) / CHEW.for));
    const u = (t - CHEW.at - i * CHEW.for) / CHEW.for;
    /* fast in, slower out: the peak sits a third of the way through. */
    const q = u < CHEW.peak ? smooth(u / CHEW.peak) : 1 - smooth((u - CHEW.peak) / (1 - CHEW.peak));
    const side = i % 2 === 0 ? -1 : 1, k = CHEW.squash * q;
    z.sx = 1 + k; z.sy = 1 / (1 + k);
    z.x += side * CHEW.shift * q;
    z.rot = side * CHEW.roll * q;
  }
  const bobAt = CHEW.at + CHEW.pulses * CHEW.for;
  if (t >= bobAt && t < bobAt + CHEW.bob.for) {
    z.y += -CHEW.bob.by * Math.sin(Math.PI * ((t - bobAt) / CHEW.bob.for));
  }
  if (t >= SHAKE.at && t < SHAKE.at + SHAKE.for) {
    /* the tiny shake: it decays rather than stopping, because a shake that ends
       on a full swing is a cut rather than a shake. */
    const p = span(t, SHAKE.at, SHAKE.at + SHAKE.for);
    z.x += SHAKE.by * (1 - p) * Math.sin(2 * Math.PI * SHAKE.hz * (t - SHAKE.at));
  }
  return z;
}
const squeezeAt = t => smooth(span(t, SHUT.at, SHUT.at + SHUT.in))
  * (1 - smooth(span(t, SHUT.until, SHUT.until + SHUT.out)));
const wideAt = t => smooth(span(t, WIDE.at, WIDE.at + WIDE.in))
  * (1 - smooth(span(t, WIDE.until, WIDE.until + WIDE.out)));
function blinkAt(t) {
  const B = BLINK;
  if (t < B.at) return 0;
  if (t < B.at + B.close) return smooth((t - B.at) / B.close);
  if (t < B.at + B.close + B.hold) return 1;
  return 1 - smooth(span(t, B.at + B.close + B.hold, B.at + B.close + B.hold + B.open));
}

/* the head's ink as it is actually drawn: the module's card, then this file's
   zone about the zone's own centre. at radius 0.5 the ink is an ellipse. */
function headInk(mas, zone) {
  return {
    cx: PLATE.cx + zone.x + mas.card.x * zone.sx,
    cy: PLATE.cy + zone.y + mas.card.y * zone.sy,
    a: PLATE.r * Math.abs(mas.card.sx) * zone.sx,
    b: PLATE.r * Math.abs(mas.card.sy) * zone.sy,
    th: (mas.card.rot + zone.rot) * Math.PI / 180,
  };
}
/* how far outside the ellipse the worst corner of a box is, as a ratio. under 1
   is contained. the derivation and the guard call this same function on the
   same two shapes, so they cannot disagree. */
function containment(ink, box) {
  const c = Math.cos(-ink.th), sn = Math.sin(-ink.th);
  let worst = 0;
  for (const px of [box.x, box.x + box.w]) {
    for (const py of [box.y, box.y + box.h]) {
      const dx = px - ink.cx, dy = py - ink.cy;
      worst = Math.max(worst, Math.hypot((dx * c - dy * sn) / ink.a, (dx * sn + dy * c) / ink.b));
    }
  }
  return worst;
}

/* ---------- the frame the bug goes is a ceiling, not a rounding ----------
   a landing time that rounds *down* to its own frame puts the switch a frame
   before the head is on it, and the twelve frame preview is where that happens.
   it is derived at whatever rate is rendering, so the picture and the guard
   cannot disagree about which frame it is. */
const VANISH_FRAME = Math.ceil(BITE_HIT * FPS);
const VANISH_AT = +(VANISH_FRAME / FPS).toFixed(4);

/* ---------- how deep the lunge has to go ----------
   walked rather than solved: down in half pixel steps until his drawn ellipse
   contains every corner of the bug's drawn ink on the contact frame, then the
   margin. the bug has to be **gone under his ink** on the frame it is switched
   off, or the switch is a disappearing trick rather than a bite. */
const DEPTH = (() => {
  const mas = mascotFrame(plan, VANISH_AT);
  const box = bugPage(bugFrame(VANISH_AT, ANT_SCHED)).rect;
  /* **the squash on the frame the bug goes is not the peak.** the contact's own
     curve is a sine over 0.10s and the switch lands wherever the render's grid
     puts it inside that, which at twelve is a fifteenth of the way in. the
     first cut solved against the peak — a wider ellipse than the one that is
     actually drawn — and the guard caught it at 1.004. so the derivation reads
     the squash off the same curve `biteZone` draws, at the same instant. */
  const u = clamp((VANISH_AT - BITE_HIT) / BITE.land, 0, 1);
  const q = BITE.squash * Math.sin(Math.PI * u) ** 0.6;
  const at = d => containment(headInk(mas, { x: BITE.fwd, y: d, sx: 1 + q, sy: 1 / (1 + q), rot: 0 }), box);
  /* **the whole admissible range, and then its middle.** post15 took the first
     depth that worked and added a flat margin, which is right when the range is
     wide. it is not wide here: the bug arrives along the floor heading right, so
     its ink sits about 14 px to the right of where `fwd` leans his head, and
     that offset eats most of the horizontal room. what is left vertically is a
     **3.5 px window**, and a 5 px margin walks straight past the far side of
     it — which is exactly what the guard caught at 1.022. the middle of the
     range is the deepest thing that is also the safest, and the margin it
     actually has is reported rather than assumed. */
  let lo = null, hi = null;
  for (let d = 0; d <= 300; d += 0.5) {
    if (at(d) <= 1) { if (lo == null) lo = d; hi = d; } else if (lo != null) break;
  }
  if (lo == null) throw new Error('no lunge inside 300px puts the bug under his ink');
  const mid = +((lo + hi) / 2).toFixed(2);
  return { need: lo, lo, hi, mid, margin: +((hi - lo) / 2).toFixed(2), hold: +at(mid).toFixed(4), box };
})();
BITE.by = DEPTH.mid;
const CLEAR = clearance();

/* ==========================================================================
   he watches it
   ==========================================================================
   the module's turn is a channel on a mark: a clip says "look this far that
   way" and the state machine gets it there over an entrance. that is right for
   a beat and it cannot express this one, which is a gaze that is a **function
   of where the bug is** on every frame of a two second walk.

   so the turn is written here, and it is written with the module's own numbers
   rather than with a lookalike: `TURN.shift`, `TURN.wrap`, `TURN.farX`,
   `TURN.farY` and `TURN.tilt` are the module's five moves, `EYE_CX` and `HEAD`
   are its geometry, and the clamp below is its own `room` — an eye may not sit
   closer than `TURN.margin` to the edge of the plate, measured at the narrowest
   point of its own vertical span rather than at its centre. the guard afterwards
   re-proves it with the module's `headSD`, which is the function the markup
   clips to, so the two cannot disagree about where the head ends.

   **`bias: 0` is what makes this safe.** no mark sets a turn and `neutral` does
   not author one, so the module writes nought to the channel on every frame and
   there is nothing here for this to fight. */
const GAZE = {
  span: 172,        /* page px of bug travel across the frame for a full swing */
  /* **and the swing is not a full turn.** the first cut mapped the bug's own
     excursion straight onto the channel and hit 0.90, and a rendered frame at
     1.25s came back as one dash and a smudge: at that much turn the far eye is
     foreshortened to 0.58 of its width, wrapped most of the way round the head
     and sitting on the module's own clamp. that is what the channel is for at a
     full turn and it is not what a face watching something looks like. 0.60 is
     post15's `curious` turn to within a hundredth, and that one reads. */
  max: 0.60,
  vspan: 300,       /* and for the vertical, which is a smaller move */
  vy: 2.4,          /* grid units the pair travels up or down */
  off: 0.14,        /* it lets go over this long, as the lunge starts */
};
const EYE_PAGE_Y = HOME.top + HEAD.eye.cy * UNIT;
function gazeAt(t) {
  /* he lets go of it on the anticipation: a head that is still tracking while it
     is winding up to lunge is two moves at once and neither of them reads. */
  const live = 1 - smooth(span(t, BITE.at, BITE.at + GAZE.off));
  if (live <= 0) return { q: 0, v: 0 };
  const b = bugFrame(Math.min(t, WALK.t1 + BUG_SETTLE), ANT_SCHED).body;
  return {
    q: +(clamp((b.x - PLATE.cx) / GAZE.span, -1, 1) * GAZE.max * live).toFixed(5),
    v: +(clamp((b.y - EYE_PAGE_Y) / GAZE.vspan, -1, 1) * live).toFixed(5),
  };
}
/* the module's own room, on the module's own constants: how far an eye may sit
   from the card's centre before it runs off the side. */
const PL_R = HEAD.plate.s / 2, PL_CX = HEAD.plate.x + PL_R, PL_CY = HEAD.plate.y + PL_R;
function eyeRoom(ey, halfW, halfH) {
  const top = HEAD.eye.cy + ey - halfH, bot = HEAD.eye.cy + ey + halfH;
  const dy = Math.max(Math.abs(top - PL_CY), Math.abs(bot - PL_CY));
  const half = dy >= PL_R ? 0 : Math.sqrt(PL_R * PL_R - dy * dy);
  return Math.max(0, half - TURN.margin - halfW);
}
/* the five moves, in the module's order: the far eye is the one the turn
   carries toward the silhouette, so it foreshortens and travels the shorter
   distance; the near one is full width and travels further, crossing the centre
   line as the broad side swings in. */
function applyGaze(mas, g) {
  if (!g.q && !g.v) return;
  const aq = Math.abs(g.q), sgn = g.q < 0 ? -1 : 1, far = g.q >= 0 ? 1 : 0;
  for (let k = 0; k < 2; k++) {
    const e = mas.eyes[k];
    if (k === far) { e.sx *= 1 - TURN.farX * aq; e.sy *= 1 - TURN.farY * aq; }
    const want = e.x + sgn * aq * (k === far ? TURN.shift : TURN.shift + TURN.wrap);
    const ey = e.y + GAZE.vy * g.v;
    const from = EYE_CX[k] - PL_CX + want;
    const lim = eyeRoom(ey, HEAD.eye.w / 2 * Math.abs(e.sx), HEAD.eye.h / 2 * Math.abs(e.sy));
    e.x = +(want + (clamp(from, -lim, lim) - from)).toFixed(4);
    e.y = +ey.toFixed(4);
  }
  /* the tilt goes with the card, because it is the head leaning. */
  mas.card.rot = +(mas.card.rot + TURN.tilt * g.q).toFixed(4);
}
/* how far outside the silhouette the drawn eye ink would go, in grid units.
   positive is out, and out is a fault. */
function eyeOutside(mas) {
  let worst = -Infinity;
  for (let k = 0; k < 2; k++) {
    const e = mas.eyes[k];
    const hw = HEAD.eye.w / 2 * Math.abs(e.sx), hh = HEAD.eye.h / 2 * Math.abs(e.sy);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      worst = Math.max(worst, headSD(EYE_CX[k] + e.x + sx * hw, HEAD.eye.cy + e.y + sy * hh, plan));
    }
  }
  return worst;
}

/* ==========================================================================
   one frame of everything
   ========================================================================== */
function heatAt(p) {
  if (p < 0) return 0;
  if (p < 0.13) return 1;
  if (p < 0.58) return 1 - (p - 0.13) / 0.45 * 0.58;
  if (p < GL.calmFrom) return 0.42 * (1 - (p - 0.58) / (GL.calmFrom - 0.58));
  return 0;
}
function cloudAt(t) {
  return PUFFS.map(p => {
    const q = span(t, FART_AT + p.delay, FART_AT + p.delay + p.life);
    if (q <= 0 || q >= 1) return { o: 0, x: 0, y: 0, s: 1 };
    return {
      o: +(CLOUD.o * Math.sin(Math.PI * q) ** 0.75).toFixed(4),
      x: +(p.dx + SIDE * CLOUD.out * p.out * OUTC(q)).toFixed(2),
      y: +(p.dy - CLOUD.rise * p.rise * q * q).toFixed(2),
      s: +(0.45 + CLOUD.grow * q).toFixed(3),
    };
  });
}
const OFF_CLOUD = PUFFS.map(() => ({ o: 0, x: 0, y: 0, s: 1 }));

function frameAt(t) {
  const mas = mascotFrame(plan, t);
  /* ---------- the two channels this file writes on the module's face --------
     both are one directional and both say so. the lid is pushed toward shut and
     never open, so the slow blink cannot fight a module blink underneath it;
     the eye scale is only ever multiplied up by the widen and only ever
     multiplied down by the squash, and the squash wins where they meet, which
     is what makes the chew a line rather than two things arguing. */
  /* the gaze first, because the widen and the squash below both multiply the
     eye scale the turn has already foreshortened. */
  const gaze = gazeAt(t);
  applyGaze(mas, gaze);
  const bl = blinkAt(t);
  if (bl > 0) for (const e of mas.eyes) e.lid = Math.max(e.lid, bl);
  const wd = wideAt(t);
  if (wd > 0) for (const e of mas.eyes) e.sy *= lerp(1, WIDE.by, wd);
  const sq = squeezeAt(t);
  if (sq > 0) for (const e of mas.eyes) e.sy = Math.min(e.sy, lerp(e.sy, SHUT.sy, sq));

  const gone = t >= FAULT_AT;
  const bug = bugPage(bugFrame(t, ANT_SCHED));
  const hit = span(t, FAULT_AT, FAULT_AT + END.hard + END.tail);
  return {
    t: +t.toFixed(4), mas, gone,
    zone: biteZone(t),
    /* the bug is on until the frame the lunge lands and it goes on that frame.
       switching it off there is only honest if it is under his ink when it
       happens, which is the derivation the depth comes from and the guard the
       containment check is. */
    bug: { o: (!gone && t < VANISH_AT) ? 1 : 0, body: bug.body, legs: bug.legs, ants: bug.ants },
    cloud: gone ? OFF_CLOUD : cloudAt(t),
    wm: { o: t >= WM_AT ? 1 : 0 },
    gl: (!gone || hit >= 1) ? { heat: 0, seed: 0 }
      : { heat: +heatAt(hit).toFixed(4), seed: Math.floor(t * 1000) % 9973 },
  };
}

/* ==========================================================================
   the page
   ========================================================================== */
function pageHtml() {
  const { light, dark } = brandTokens();
  const b = BUG.body, h = BUG.head;
  return `<!doctype html>
<html lang="en" data-theme="${THEME}">
<head>
<meta charset="utf-8">
<title>post25</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Manrope:wght@500;700&display=swap">
<style>
:root{
${light}
}
html[data-theme=dark]{
${dark}
}
/* the bubble is the module's and it is set in var(--body), so Manrope is asked
   for here rather than in the module: one line, and the module stays a module.

   it is a root pseudo class rather than a bare html type selector on purpose.
   index.html's own block above is written against root, which outranks a type
   selector, so a later html rule loses to it and the first cut of this file
   rendered the pill in Space Grotesk. the guard below reads the computed family
   off the pill rather than trusting the link tag, which is what caught it.
   (no backticks in this comment on purpose: it lives inside a template
   literal.) */
:root{--body:"Manrope",var(--mono)}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}

/* the vignette, and it is load bearing rather than decoration: with nothing at
   all animating chrome stops producing compositor frames and the screenshot
   call blocks on a frame that never comes. post2.mjs found this and every clip
   in demo/ has carried the fix since. */
.vignette{position:fixed;inset:-10%;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 78% 62% at 50% 46%,
    rgba(255,255,255,.030) 0%, rgba(255,255,255,.010) 46%, rgba(0,0,0,0) 72%);
  will-change:transform,opacity;
  animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{
  from{transform:scale(1) translate3d(0,0,0);opacity:.85}
  to{transform:scale(1.05) translate3d(0,-1.1%,0);opacity:1}
}
/* the stage carries the fault's own shake. the page colour is painted by html
   and body as well, so a fifteen pixel shake cannot expose an edge. */
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;overflow:hidden;
  background:var(--bg);will-change:transform}

/* ---- the bug ----
   one svg the size of the stage. every point in it is written in page space by
   node, so nothing in here decides anything: the body is a translate, a rotate
   and the scale, and the eight polylines are lists of numbers.

   the glow is an svg filter on the ink group rather than a css filter on the
   svg, and that is a render cost rather than a preference: a css filter here
   would blur a 1080x1920 surface twice on every frame, where an svg filter's
   region is the group's own bounding box, which is the bug. */
#bug{position:absolute;inset:0;z-index:2;overflow:visible;pointer-events:none}
#bug .lim{fill:none;stroke:var(--face);stroke-width:${(BUG.legW * SC).toFixed(2)};
  stroke-linecap:round;stroke-linejoin:round}
#bug .ant{fill:none;stroke:var(--face);stroke-width:${(BUG.ant.w * SC).toFixed(2)};
  stroke-linecap:round;stroke-linejoin:round}
#bug .sh{fill:var(--face)}

/* ---- the cloud ----
   six soft fields and no drawn shape: a radial gradient is a puff, and an
   outline would be a pictogram. it sits under him, so it comes out from behind
   his ink rather than over it, and it is screen blended so it adds light to a
   near black frame rather than sitting on it as a patch. */
#cloud{position:absolute;left:0;top:0;z-index:3;pointer-events:none;
  filter:blur(9px);mix-blend-mode:screen}
#cloud i{position:absolute;display:block;border-radius:50%;opacity:0;
  will-change:transform,opacity;
  background:radial-gradient(circle,
    color-mix(in srgb, var(--accent) 70%, transparent) 0%,
    color-mix(in srgb, var(--accent) 26%, transparent) 46%,
    rgba(0,0,0,0) 72%)}

/* his own cut, as a wrapper rather than as a rule on the zone: the zone is
   carrying the bite and a second thing writing it would be two things holding
   one channel. the bubble is inside the zone, so one switch takes all of him. */
#mas-cut{position:absolute;inset:0;z-index:4;opacity:1}
${mascotCss(plan)}

/* ---- the wordmark ----
   three lines, fitted rather than sized. the deep glow is three text shadows
   rather than blurred duplicates, because it is twelve glyphs and a duplicate
   would have to be written every frame. */
#wm{position:absolute;left:0;right:0;top:${Math.round(VH * 0.40)}px;z-index:9;text-align:center;
  font-family:"Michroma",var(--mono);font-weight:400;color:var(--fg);
  line-height:${WM.lh};letter-spacing:.02em;opacity:0;
  text-shadow:0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),
    0 0 66px rgba(255,255,255,.10)}
#wm b{display:block;font-weight:400}
#flash{position:absolute;left:50%;top:50%;z-index:12;pointer-events:none;
  width:${GL.flashSize}px;height:${GL.flashSize}px;transform:translate(-50%,-50%);
  border-radius:50%;opacity:0;
  background:radial-gradient(circle,rgba(255,255,255,.9) 0%,rgba(255,255,255,0) 70%)}
</style>
</head>
<body>
<div class="vignette" aria-hidden="true"></div>
<div class="stage" id="stage">
  <svg id="bug" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}" aria-hidden="true">
    <defs>
      <filter id="bug-glow" x="-70%" y="-70%" width="240%" height="240%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b1"/>
        <feComponentTransfer in="b1" result="b1o"><feFuncA type="linear" slope="0.50"/></feComponentTransfer>
        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b2"/>
        <feComponentTransfer in="b2" result="b2o"><feFuncA type="linear" slope="0.26"/></feComponentTransfer>
        <feMerge><feMergeNode in="b2o"/><feMergeNode in="b1o"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g id="bug-ink" filter="url(#bug-glow)">
      <g id="bug-limbs">
${Array.from({ length: 6 }, (_, i) => '        <polyline class="lim" id="bug-leg' + i + '" points=""/>').join('\n')}
${Array.from({ length: 2 }, (_, i) => '        <polyline class="ant" id="bug-ant' + i + '" points=""/>').join('\n')}
      </g>
      <g id="bug-body">
        <rect class="sh" x="${-b.l / 2}" y="${-b.w / 2}" width="${b.l}" height="${b.w}" rx="${b.r}"/>
        <rect class="sh" x="${b.l / 2 + h.gap}" y="${-h.w / 2}" width="${h.l}" height="${h.w}" rx="${h.r}"/>
      </g>
    </g>
  </svg>
  <div id="cloud">${PUFFS.map(p => '<i style="width:' + (p.r * 2).toFixed(1)
    + 'px;height:' + (p.r * 2).toFixed(1) + 'px;left:' + (CLOUD.from.x - p.r).toFixed(1)
    + 'px;top:' + (CLOUD.from.y - p.r).toFixed(1) + 'px"></i>').join('')}</div>
  <div id="mas-cut">${mascotMarkup(plan)}</div>
  <div id="wm">${WM.lines.map(l => '<b>' + l + '</b>').join('')}</div>
  <div id="flash" aria-hidden="true"></div>
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
${mascotRuntime()}
(function(){
  const P = ${JSON.stringify({ VW, VH, DSF, SC, GL, WM, TEXT: BUB.text })};
  const stage = document.getElementById('stage');
  const bug = document.getElementById('bug');
  const bugBody = document.getElementById('bug-body');
  const legs = [0,1,2,3,4,5].map(function(i){ return document.getElementById('bug-leg' + i); });
  const ants = [0,1].map(function(i){ return document.getElementById('bug-ant' + i); });
  const puffs = [].slice.call(document.querySelectorAll('#cloud i'));
  const zone = document.getElementById('m-zone');
  const cut = document.getElementById('mas-cut');
  const wm = document.getElementById('wm');
  const flash = document.getElementById('flash');
  const SHADOW = '0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),'
    + '0 0 66px rgba(255,255,255,.10)';

  function rnd(seed){ let s = seed >>> 0; return function(){ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function pts(a){ let s = ''; for (let i = 0; i < a.length; i += 2) s += (i ? ' ' : '') + a[i] + ',' + a[i+1]; return s; }

  window.__post25 = {
    ready: true,
    apply: function(f){
      cut.style.opacity = f.gone ? 0 : 1;
      /* the zone: translate, then rotate, then scale, so he is carried to where
         he is standing and *then* deformed about the place he is standing. */
      const z = f.zone;
      zone.style.transform = 'translate(' + z.x.toFixed(2) + 'px,' + z.y.toFixed(2) + 'px) rotate('
        + z.rot.toFixed(2) + 'deg) scale(' + z.sx.toFixed(5) + ',' + z.sy.toFixed(5) + ')';

      /* off screen the bug is switched off rather than merely left at nought: a
         filtered group is still rastered at opacity zero. */
      bug.style.visibility = f.bug.o ? 'visible' : 'hidden';
      if (f.bug.o) {
        bugBody.setAttribute('transform', 'translate(' + f.bug.body[0] + ' ' + f.bug.body[1]
          + ') rotate(' + f.bug.body[2] + ') scale(' + P.SC + ')');
        for (let i = 0; i < legs.length; i++) legs[i].setAttribute('points', pts(f.bug.legs[i]));
        for (let i = 0; i < ants.length; i++) ants[i].setAttribute('points', pts(f.bug.ants[i]));
      }

      for (let i = 0; i < puffs.length; i++) {
        const c = f.cloud[i];
        puffs[i].style.opacity = c.o;
        puffs[i].style.transform = 'translate3d(' + c.x + 'px,' + c.y + 'px,0) scale(' + c.s + ')';
      }

      wm.style.opacity = f.wm.o;
      const h = f.gl.heat;
      if (!h){
        stage.style.transform = 'none';
        wm.style.textShadow = SHADOW;
        flash.style.opacity = 0;
      } else {
        const r = rnd(f.gl.seed || 1);
        stage.style.transform = 'translate3d(' + ((r()*2-1)*P.GL.shakeX*h).toFixed(2) + 'px,'
          + ((r()*2-1)*P.GL.shakeY*h).toFixed(2) + 'px,0)';
        /* the split is only written while there is heat: a coloured shadow at
           offset nought is a halo, not "off". */
        const s = (P.GL.split * h).toFixed(2);
        wm.style.textShadow = SHADOW + ',-' + s + 'px 0 rgba(255,0,64,.75),'
          + s + 'px 0 rgba(0,255,208,.75)';
        flash.style.opacity = (P.GL.flash * h).toFixed(3);
      }
    },
    /* the wordmark is fitted, not sized: michroma is wide and BORING is the
       longest line, and a size picked by dividing a width by a guess has put one
       off both edges of a frame before. */
    fitWordmark: function(){
      const lines = [].slice.call(wm.querySelectorAll('b'));
      wm.style.fontSize = '100px';
      let widest = 0;
      for (let i = 0; i < lines.length; i++) widest = Math.max(widest, lines[i].getBoundingClientRect().width);
      const size = Math.floor(100 * P.WM.w / widest);
      wm.style.fontSize = size + 'px';
      const r = lines[0].getBoundingClientRect();
      return { size: size, widestCss: +(widest * size / 100).toFixed(1),
        capPx: +(r.height * P.DSF * 0.72).toFixed(1) };
    },
    /* the pill measured where it will really be drawn, which means forcing it
       up first: the runtime only writes an opacity and a transform to it on the
       frames it is live, so a sweep taken at build time would measure a box at
       nought and report it as clearing every line by miles. */
    bubbleBox: function(){
      const el = document.getElementById('m-bubble');
      const pill = document.getElementById('m-pill');
      const txt = document.getElementById('m-bubble-text');
      txt.textContent = P.TEXT;
      el.style.visibility = 'visible';
      pill.style.opacity = '1';
      pill.style.transform = 'none';
      const r = pill.getBoundingClientRect(), d = P.DSF;
      const font = getComputedStyle(pill).fontFamily;
      pill.style.opacity = ''; pill.style.transform = ''; el.style.visibility = '';
      txt.textContent = '';
      return { left: +(r.left * d).toFixed(1), top: +(r.top * d).toFixed(1),
        right: +((P.VW - r.right) * d).toFixed(1), bottom: +((P.VH - r.bottom) * d).toFixed(1),
        w: +r.width.toFixed(1), font: font };
    },
    /* the layering, read off the computed style rather than off what was typed
       in the stylesheet: the crossing is only a crossing if he really is in
       front. */
    layers: function(){
      return {
        zBug: +getComputedStyle(bug).zIndex || 0,
        zMas: +getComputedStyle(cut).zIndex || 0,
      };
    },
  };
})();
Promise.all([
  document.fonts.load('400 40px Michroma'),
  document.fonts.load('500 26px Manrope'),
])
  .then(function(){ return document.fonts.ready; })
  .then(function(){
    window.__built = Object.assign({}, window.__mas.build(), window.__post25.layers(), {
      wm: window.__post25.fitWordmark(),
      bubble: window.__post25.bubbleBox(),
    });
  });
</script>
</body>
</html>`;
}

/* ---------- a local static server, so the load sequence is the clip's ------- */
function serve(html) {
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/' || p === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }
    /* everything else is answered rather than 404'd, so a favicon request does
       not put an error in the console of every run. */
    res.writeHead(204); res.end();
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ srv, port: srv.address().port })));
}
function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }
function probe(file) {
  let out = '';
  try { execFileSync(ffmpeg, ['-hide_banner', '-i', file], { stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { out = (e.stderr || '').toString(); }
  const dur = out.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const res = out.match(/,\s*(\d{2,5})x(\d{2,5})[\s,]/);
  return { seconds: dur ? +dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3]) : null,
    w: res ? +res[1] : null, h: res ? +res[2] : null };
}

/* ==========================================================================
   the sound
   ==========================================================================
   no voice and no music. the ticks are the walk — one per stride boundary, read
   off the picture rather than laid on a grid, so as he decelerates the last few
   spread out and stop on their own. the sputter is the joke, the pop is the
   pill arriving off `mascotCues`, and the glitch is the cut.

   **the eating is silent, and that is a decision rather than an omission.** the
   bite and the three chews had `crunch` on them — one recipe at two settings,
   the bite lower and grittier — and they are out, because einz is putting his
   own on that stretch and a synthesised placeholder under a real one is two
   takes of the same beat fighting each other. post15's words, and post15's
   reason. **the recipe stays in `lib/sfx.mjs`**: it is a sound the set wanted
   and a voice is cheaper to keep than to write twice.

   so between the last footstep and the sputter there is nothing at all, and
   that is guarded rather than left to drift: a tick or a pop in there would
   mean the walk or the bubble had crept into the stretch he is leaving clear. */
function cues() {
  const list = [
    ...STEPS.map((t, i) => ({ t, kind: 'tick',
      opts: { seed: (0x6ad13f ^ (i * 2654435761)) >>> 0, hz: 288 + (i % 3) * 16 },
      from: 'stride ' + (i + 1) + ', read off the walk' })),
    { t: FART_AT, kind: 'fart', opts: FART.sputter, from: 'the cloud' },
    ...mascotCues(plan).map(c => ({ ...c, from: 'the pill arriving, off mascotCues' })),
    { t: FAULT_AT, kind: 'glitch', from: 'the cut' },
  ];
  return list.filter(c => c.t >= 0 && c.t < SECONDS).sort((a, b) => a.t - b.t);
}

function mix() {
  const list = cues();
  const rendered = renderSfx(list, SECONDS);
  const n = Math.ceil(SECONDS * SR);
  /* there is no voice, so the duck has nothing to duck and the envelope is
     nought everywhere. the mixdown is still the one that runs, because the
     limiter and the loudness search after it are the same job either way. */
  const silence = new Float32Array(n);
  const m = mixdown(silence, rendered.buf, silence, {});
  const wav = path.join(OUT, 'post25-mix.wav');
  const attempt = gdb => {
    const buf = Float32Array.from(m.out);
    applyGain(buf, gdb);
    const lim = limit(buf, SAMPLE_CEILING);
    writeWav(wav, buf);
    return { g: gdb, lim, r: loudness(ffmpeg, wav) };
  };
  /* the limiter is the constraint, not the target: the search is for the
     loudest gain whose reduction is still legal, and the target is where it
     stops. */
  let lo = -6, hi = 34, best = null;
  for (let i = 0; i < 10; i++) {
    const a = attempt((lo + hi) / 2);
    const legal = a.lim.reduction <= MAX_REDUCTION;
    if (legal && (!best || a.r.lufs > best.r.lufs)) best = a;
    if (!legal || a.r.lufs > TARGET_LUFS) hi = a.g; else lo = a.g;
  }
  if (!best) best = attempt(0);
  const final = attempt(best.g);
  console.log('  mix: ' + list.length + ' cues, no voice, ' + final.r.lufs.toFixed(1) + ' LUFS, peak '
    + final.r.truePeak.toFixed(1) + ' dBTP, ' + final.lim.reduction.toFixed(1)
    + ' dB of limiting, gain ' + best.g.toFixed(1) + ' dB');
  if (final.r.lufs < MIN_LUFS) console.log('  quieter than ' + MIN_LUFS + ' LUFS: the peak ceiling won');
  return wav;
}

/* ==========================================================================
   the numbers, before a browser is opened
   ==========================================================================
   walked at sixty whatever the render is set to, because how far a thing moves
   between two frames is a property of the finished clip rather than of the
   preview. the lunge is the fastest thing here and it is the one this asks
   about. */
function fastestMove() {
  let worst = 0, at = 0, prev = null;
  for (let f = 0; f < Math.round(SECONDS * 60); f++) {
    const t = f / 60;
    const fr = frameAt(t);
    const y = fr.zone.y + fr.mas.card.y;
    if (prev != null) { const d = Math.abs(y - prev); if (d > worst) { worst = d; at = +t.toFixed(2); } }
    prev = y;
  }
  return { worst: +worst.toFixed(1), at };
}
const MOVE = fastestMove();
const GAIT = {
  strides: +((WALK.x1 - WALK.x0) / BUG.stride).toFixed(1),
  perSec: +(WALK.v / BUG.stride).toFixed(2),
  frames: +(60 / (WALK.v / BUG.stride)).toFixed(1),
  px: +(WALK.v * SC).toFixed(0),
};

console.log('the boring tek — post25, bug 2\n');
console.log(describeMascot(plan));
console.log('\n  the clock:');
const row = (n, v) => console.log('    ' + n.padEnd(26) + v.toFixed(2));
row('the bug enters', 0);
row('it stops under him', WALK.t1);
row('he lunges', BITE.at);
row('the bug goes', VANISH_AT);
row('the chewing ends', CHEW_END);
row('eyes wide, and the shake', WIDE.at);
row('the cloud', FART_AT);
row('the cloud is gone', CLOUD_END);
row('the pill arrives', BUB.full);
row('the blink', BLINK.at);
row('the fault', FAULT_AT);
row('the end', SECONDS);
console.log('\n  the bug:');
console.log('    scale ' + SC + ', ink ' + (BUG_INK.len * SC * DSF).toFixed(0) + ' x '
  + (BUG_INK.w * SC * DSF).toFixed(0) + ' device px against a '
  + (PLATE.r * 2 * DSF).toFixed(0) + 'px head');
console.log('    ' + GAIT.strides + ' strides at up to ' + GAIT.perSec + ' a second ('
  + GAIT.px + ' page px a second), so ' + GAIT.frames + ' frames a cycle at 60');
console.log('    his ink bottoms out at ' + HEAD_BOTTOM.y + ' at ' + HEAD_BOTTOM.at
  + 's, the lane sits at ' + LANE);
console.log('\n  the curve, ' + PATH.len + ' page px in six segments:');
for (const g of PATH.segs) {
  console.log('    ' + (g.kind === 'line' ? 'straight' : 'arc r' + g.r.toFixed(0)).padEnd(11)
    + g.len.toFixed(1).padStart(6) + ' px   ' + g.why);
}
console.log('    the left lane is ' + LEFT + ', turn radius ' + TURN_R + ', floor run ' + FLOOR_RUN);
console.log('    closest the bug gets to his ink is ' + CLEAR.worst + ' px at ' + CLEAR.at
  + 's, with ' + (CLEAR.hit ? 'an overlap at ' + CLEAR.hit + 's' : '0 frames of overlap'));
console.log('    its ink is inside the safe rect from ' + CLEAR.inAt + 's and '
  + (CLEAR.out ? 'leaves it again at ' + CLEAR.out + 's' : 'never leaves it')
  + ', worst air ' + CLEAR.worstAir + ' px at ' + CLEAR.airAt + 's');
console.log('    the lunge works from ' + DEPTH.lo + ' to ' + DEPTH.hi + 'px and it goes '
  + BITE.by + ', ' + DEPTH.margin + 'px either side, containment ' + DEPTH.hold);
{
  let q = 0, v = 0;
  for (let f = 0; f < Math.round(60 * BITE.at); f++) {
    const g = gazeAt(f / 60);
    q = Math.max(q, Math.abs(g.q)); v = Math.max(v, Math.abs(g.v));
  }
  console.log('    he tracks it to ' + q.toFixed(2) + ' of a full turn and ' + v.toFixed(2)
    + ' of the vertical, and lets go over ' + GAZE.off + 's on the anticipation');
}
/* the subframe count this cut needs, capped. --blur=N overrides it outright. */
const SUB = !BLUR ? 1
  : BLUR_ARG ? Math.max(2, Math.min(SUB_MAX, Math.round(BLUR_ARG)))
    : Math.max(2, Math.min(SUB_MAX, Math.ceil(MOVE.worst / SUB_STEP_WANT)));

console.log('\n  the shutter:');
console.log('    fastest visible move  ' + MOVE.worst + ' css px a frame at 60, at ' + MOVE.at
  + 's   (' + (MOVE.worst * DSF).toFixed(0) + ' device px, closed-shutter ceiling ' + STEP_CEIL + ')');
if (SUB > 1) {
  console.log('    ' + SUB + ' subframes' + (BLUR_ARG ? ' (asked for)' : ' (worked out from the move above)')
    + ', so ' + (MOVE.worst / SUB).toFixed(2) + ' css px a sample — '
    + (MOVE.worst / SUB * DSF).toFixed(1) + ' device px, against post20\'s 12.6');
} else {
  console.log('    shutter closed. --blur opens it, and the lunge is what wants it.');
}

/* ==========================================================================
   render
   ========================================================================== */
async function render() {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  /* --check clears nothing: it opens the page to take its measurements and
     returns, and wiping the still folder on the way in would throw away the
     beat stills of the render it was checking. */
  for (const d of (CHECK ? [] : [FRAMES, VERIFY, SUBS])) {
    fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true });
  }
  const { srv, port } = await serve(pageHtml());
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none',
      '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio'],
  });
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('  page error: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('  console: ' + m.text()); });
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' },
      { name: 'prefers-color-scheme', value: THEME }],
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
  for (let i = 0; i < 700; i++) {
    const ok = await page.evaluate(() => !!(window.__built && window.__post25)).catch(() => false);
    if (ok) break;
    await advance(1000 / 60);
  }
  const built = await page.evaluate(() => window.__built);
  if (!built) throw new Error('the page never finished building');
  console.log('\n  built: head ' + built.headPx + 'px, ' + built.glows + ' glow layers, theme ' + built.theme);
  console.log('  wordmark: ' + built.wm.size + 'px michroma, widest line ' + built.wm.widestCss
    + ' css of ' + WM.w + ' allowed, cap about ' + built.wm.capPx + ' device px (floor ' + WM.minCapPx + ')');
  console.log('  bubble: "' + BUB.text + '", ' + built.bubble.w + ' css wide, '
    + built.bubble.right + ' device px off the right line, in ' + built.bubble.font);
  /* before the frame loop, not after it: --check wants the page's own
     measurements and nothing else. */
  fs.writeFileSync(path.join(OUT, 'post25-built.json'), JSON.stringify(built, null, 2));
  if (CHECK) { await browser.close(); srv.close(); return { N: 0, built }; }

  const N = Math.round(FPS * SECONDS);
  const STILLS = new Map([
    [0.60, 'a-walk-in'], [1.50, 'b-past-him'], [WALK.t1 + 0.10, 'c-under-him'],
    [BITE.at + BITE.rise, 'd-rise'], [VANISH_AT, 'e-contact'], [CHEW_HITS[1], 'f-chew'],
    [WIDE.at + 0.30, 'g-wide'], [FART_AT + 0.30, 'h-cloud'], [FART_AT + 0.70, 'i-cloud-drift'],
    [BUB.full + 0.05, 'j-good-one'], [BLINK.at + BLINK.close, 'k-blink'],
    [Math.min(SECONDS - 0.02, FAULT_AT + 0.04), 'l-fault'],
    [Math.min(SECONDS - 0.01, WM_AT + 0.06), 'm-wordmark'],
  ].map(([t, n]) => [Math.round(t * FPS), n]));
  /* **one loop, and the shutter is how many samples it takes per frame.** with
     it closed SUB is 1 and this is the loop it always was; with it open the
     samples land in their own folder and ffmpeg averages them afterwards. the
     beat stills come off the **first** sample of their frame, so a still is a
     sharp picture of the instant rather than a smear of it. */
  const SUBSTEP = STEP / SUB;
  const shotDir = SUB > 1 ? SUBS : FRAMES;
  const wall = Date.now();
  let wrote = 0;
  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const fr = frameAt(f * STEP + k * SUBSTEP);
      await page.evaluate(x => window.__post25.apply(x), fr);
      await page.evaluate(x => window.__mas.apply(x), fr.mas);
      const shot = await cdp.send('Page.captureScreenshot', {
        format: 'jpeg', quality: 92, captureBeyondViewport: false,
        clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
      });
      const idx = f * SUB + k;
      const name = (SUB > 1 ? 's' + String(idx).padStart(6, '0') : 'f' + String(f).padStart(5, '0')) + '.jpg';
      fs.writeFileSync(path.join(shotDir, name), Buffer.from(shot.data, 'base64'));
      wrote++;
      if (k === 0 && STILLS.has(f)) {
        fs.writeFileSync(path.join(VERIFY, STILLS.get(f) + '.jpg'), Buffer.from(shot.data, 'base64'));
      }
    }
  }
  console.log('  ' + wrote + ' samples for ' + N + ' frames in '
    + ((Date.now() - wall) / 1000).toFixed(1) + 's');
  await browser.close(); srv.close();
  if (SUB > 1) blend(N);
  return { N, built };
}

/* the shutter, closed. post10's chain, unchanged: tmix over SUB frames, then
   throw away the SUB-1 partial averages at the head and keep every SUBth. */
function blend(N) {
  console.log('  blending ' + N * SUB + ' subframes into ' + N + ' frames ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS * SUB), '-i', path.join(SUBS, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1)
      + ',setpts=PTS-STARTPTS,framestep=' + SUB,
    '-q:v', '2', path.join(FRAMES, 'f%05d.jpg')]);
  const got = fs.readdirSync(FRAMES).filter(f => f.endsWith('.jpg')).length;
  if (got !== N) console.log('  the blend produced ' + got + ' frames of ' + N + ' wanted');
  if (!KEEP) fs.rmSync(SUBS, { recursive: true, force: true });
}

/* ==========================================================================
   the guards
   ========================================================================== */
function guards(built) {
  const fail = [];
  if (built.headPx < HEAD_PX.min || built.headPx > HEAD_PX.max) {
    fail.push('the head rendered at ' + built.headPx + 'px, window is ' + HEAD_PX.min + '..' + HEAD_PX.max);
  }
  if (built.wm.widestCss > WM.w + 0.5) fail.push('the wordmark is ' + built.wm.widestCss + ' css wide, over ' + WM.w);
  if (built.wm.capPx < WM.minCapPx) fail.push('the wordmark cap is ' + built.wm.capPx + ' device px, floor ' + WM.minCapPx);
  /* the brief names the face, so the face is read off the computed style rather
     than off the link tag: a family that failed to load falls back silently. */
  if (!/Manrope/.test(built.bubble.font)) fail.push('the bubble is set in ' + built.bubble.font + ', not Manrope');
  for (const [k, floor] of [['left', SAFE.left], ['right', SAFE.right], ['top', SAFE.top], ['bottom', SAFE.bottom]]) {
    if (built.bubble[k] < floor - 0.5) {
      fail.push('the bubble is ' + built.bubble[k] + ' device px off the ' + k + ' line, floor ' + floor);
    }
  }

  /* ---------- the bug goes around him, fully drawn the whole way ----------
     never over him, never under him, and never touching his ink. */
  if (built.zBug >= built.zMas) fail.push('the bug is drawn at z ' + built.zBug + ' and he is at ' + built.zMas);
  if (CLEAR.hit) fail.push('the bug overlaps his ink at ' + CLEAR.hit + 's');
  else if (CLEAR.worst < LANE_CLEAR - 1) {
    fail.push('the bug gets within ' + CLEAR.worst + ' px of his ink at ' + CLEAR.at
      + 's, under the ' + LANE_CLEAR + ' the lane is built on');
  }
  /* post15's latch: the ink enters the safe rect once and never leaves it
     again. walking in over the top edge is what a walk on is; anything after
     the latch that scores under nought is a real overrun. */
  if (CLEAR.inAt == null) fail.push('the bug never gets inside the safe rect');
  if (CLEAR.out != null) fail.push('the bug leaves the safe rect again at ' + CLEAR.out + 's');
  /* the heading is continuous across every join, or the bug snaps rather than
     turns. the path is tangent by construction and this re-proves it. */
  {
    let worstKink = 0, kinkAt = 0;
    for (let S = 1; S < PATH.len; S += 1) {
      const d = Math.abs(arcAt(S).th - arcAt(S - 1).th) / DEG;
      if (d > worstKink) { worstKink = d; kinkAt = S; }
    }
    /* a degree a page px is a radius of 57, and the tightest arc here is 84. */
    if (worstKink > 1.2) {
      fail.push('the heading jumps ' + worstKink.toFixed(2) + ' degrees in a px at S=' + kinkAt);
    }
  }

  /* the bug is gone under his ink on the frame it is switched off, checked with
     the same containment the depth was derived from. */
  const hold = containment(headInk(mascotFrame(plan, VANISH_AT), biteZone(VANISH_AT)),
    bugPage(bugFrame(VANISH_AT, ANT_SCHED)).rect);
  if (hold > 1) fail.push('the bug is not under his ink on the frame it goes: ' + hold.toFixed(3));
  if (VANISH_AT < BITE_HIT - 1e-6 || VANISH_AT >= BITE_HIT + BITE.land) {
    fail.push('the bug goes at ' + VANISH_AT + ', outside the contact ' + BITE_HIT + '..'
      + (BITE_HIT + BITE.land).toFixed(4));
  }

  /* no planted foot slides, and it is by construction rather than by tuning.
     the settle is the one window this does not read, and it says so. */
  let slide = 0, reach = 0;
  const prev = new Map();
  for (let f = 0; f < Math.round(60 * WALK.t1); f++) {
    const bf = bugFrame(f / 60, ANT_SCHED);
    reach = Math.max(reach, bf.worstReach);
    for (let i = 0; i < 6; i++) {
      const s = i < 3 ? 0 : 1, j = i % 3;
      const off = ((s === 1) !== (j === 1)) ? 0.5 : 0;
      const fo = legFoot(bf.x, off, { x: BUG.feet[j].x, y: BUG.feet[j].y * (s === 0 ? -1 : 1) });
      const was = prev.get(i);
      if (fo.planted && was && was.planted) slide = Math.max(slide, Math.hypot(fo.x - was.x, fo.y - was.y));
      prev.set(i, fo);
    }
  }
  if (slide > 0.001) fail.push('a planted foot moves ' + slide.toFixed(4) + ' px');
  if (reach > (BUG.femur + BUG.tibia) * SC) {
    fail.push('a leg has to reach ' + reach.toFixed(2) + ' and it is '
      + ((BUG.femur + BUG.tibia) * SC).toFixed(2) + ' long');
  }

  /* the shutter is closed, so nothing may move further in one frame than a
     closed shutter carries. */
  if (MOVE.worst > STEP_CEIL) {
    fail.push('the fastest move is ' + MOVE.worst + ' css px a frame at 60, over the ' + STEP_CEIL + ' ceiling');
  }

  /* ---------- the only colour is the cloud, and only over its own window ----
     walked at the render's own step rather than sampled, because "there is no
     green on this frame" is the one claim in the brief that a spot check cannot
     make. */
  let firstGreen = null, lastGreen = null;
  for (let f = 0; f < Math.round(SECONDS * FPS); f++) {
    const t = f * STEP;
    const up = frameAt(t).cloud.reduce((m, c) => Math.max(m, c.o), 0);
    if (up > 0.002) { if (firstGreen == null) firstGreen = t; lastGreen = t; }
  }
  if (firstGreen == null) fail.push('the cloud never appears');
  else {
    if (firstGreen < FART_AT - 1e-6) fail.push('the cloud is up at ' + firstGreen.toFixed(2) + 's, before the sputter');
    if (lastGreen > BUB.in) fail.push('the cloud is still up at ' + lastGreen.toFixed(2) + 's, past the bubble arriving');
  }

  /* ---------- every write to the module's face is one directional ---------- */
  let opened = null, over = null;
  for (let f = 0; f < Math.round(SECONDS * FPS); f++) {
    const t = f * STEP;
    const bare = mascotFrame(plan, t), got = frameAt(t).mas;
    for (let e = 0; e < 2; e++) {
      if (got.eyes[e].lid < bare.eyes[e].lid - 1e-6 && !opened) opened = t;
      if (got.eyes[e].sy > bare.eyes[e].sy * WIDE.by + 1e-6 && !over) over = t;
    }
  }
  if (opened != null) fail.push('an eye is opened past the module at ' + opened.toFixed(2) + 's');
  if (over != null) fail.push('an eye is over the ' + WIDE.by + 'x widen cap at ' + over.toFixed(2) + 's');

  /* ---------- and the gaze never puts an eye on his cheek ----------
     the module's own `headSD`, which is the function the markup clips to, so a
     turn this file wrote and a silhouette the module drew cannot disagree about
     where the head ends. */
  let outside = -Infinity, outAt = 0, tracked = 0;
  for (let f = 0; f < Math.round(SECONDS * FPS); f++) {
    const t = f * STEP;
    const sd = eyeOutside(frameAt(t).mas);
    if (sd > outside) { outside = sd; outAt = t; }
    if (t < BITE.at) tracked = Math.max(tracked, Math.abs(gazeAt(t).q));
  }
  if (outside > 0) {
    fail.push('eye ink is ' + outside.toFixed(3) + ' grid units outside the head at ' + outAt.toFixed(2) + 's');
  }
  /* he has to actually track it. a gaze that never leaves the middle is a gaze
     that is not there, and the whole beat is him watching it come. */
  if (tracked < GAZE.max * 0.8) fail.push('he only turns ' + tracked.toFixed(2) + ' of a turn, so he never really watches it');
  if (Math.abs(gazeAt(BITE.at + GAZE.off).q) > 1e-4) fail.push('he is still tracking it when the lunge starts');

  /* ---------- the eating is silent ----------
     nothing at all between the last footstep and the sputter. */
  const quietFrom = STEPS[STEPS.length - 1] + 0.20, quietTo = FART_AT - 0.02;
  const intruder = cues().find(c => c.t > quietFrom && c.t < quietTo);
  if (intruder) {
    fail.push('a ' + intruder.kind + ' lands at ' + intruder.t.toFixed(2)
      + 's, inside the stretch the eating is meant to leave silent');
  }
  if (blinkAt(BLINK.at + BLINK.close + BLINK.hold / 2) < 0.999) fail.push('the slow blink never closes');
  if (BLINK.at + BLINK.close + BLINK.hold + BLINK.open > FAULT_AT) {
    fail.push('the blink is still running when the fault lands');
  }
  return fail;
}

/* ==========================================================================
   go
   ========================================================================== */
fs.mkdirSync(OUT, { recursive: true });

/* `--check` builds the page, takes its measurements and runs the guards against
   them, then stops. no frames, no mix, no encode. */
if (CHECK) {
  const { built } = await render();
  const fail = guards(built);
  console.log('\n  guards: ' + (fail.length ? fail.length + ' FAILED' : 'all green'));
  for (const f of fail) console.log('    - ' + f);
  process.exit(fail.length ? 1 : 0);
}

const done = ONLY_ENCODE
  ? { N: fs.readdirSync(FRAMES).filter(f => f.endsWith('.jpg')).length, built: null }
  : await render();
const wav = mix();
const out = path.join(OUT, 'post25-dark-1080x1920.mp4');
ff(['-y', '-hide_banner', '-loglevel', 'error',
  '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'), '-i', wav,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k', '-shortest',
  '-r', String(FPS), '-movflags', '+faststart', out]);
if (!KEEP && !ONLY_ENCODE) fs.rmSync(FRAMES, { recursive: true, force: true });

const p = probe(out);
console.log('\n  ' + path.relative(HERE, out));
console.log('  ' + p.w + 'x' + p.h + ', ' + p.seconds + 's, ' + FPS + 'fps, '
  + (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
if (done.built) {
  const fail = guards(done.built);
  console.log('\n  guards: ' + (fail.length ? fail.length + ' FAILED' : 'all green'));
  for (const f of fail) console.log('    - ' + f);
  if (fail.length) process.exitCode = 1;
}
console.log('  stills in ' + path.relative(HERE, VERIFY));
