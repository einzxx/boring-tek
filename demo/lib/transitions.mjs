/* the boring tek — the transitions. the circle grow, and the exit and re-entry.

   the mascot is a circle. that is the one fact this file is built on, and it is
   the reason we have a signature transition at all: a circle that grows about
   its own centre never stops being the shape it started as, so **he can become
   the background** rather than cutting to it. nothing else in the brand can do
   that. a square would have to rotate to fill a 9:16 frame and a rounded rect
   would show its corners arriving.

   two things live here.

   **the grow.** he swells until his fill covers the frame, his fill becomes the
   next scene's paper, and he is gone. or the same shape run backwards, and the
   background shrinks into him.

   **the cross.** he leaves one side of the frame and comes back on the other in
   a new place, with anticipation, travel and a settle.

   ---------- the whole trick is that his face inverts ----------

   `lib/mascot.mjs` paints the head in `--face` and the page behind it in
   `--eye`, and `--eye` is defined to always be the page background. so the two
   themes are:

     light   face #0b0d10 on paper #ffffff
     dark    face #f4f7f5 on paper #06070a

   read those as two pairs and the transition falls out of them. **his face in
   one theme is the other theme's paper**, to within a few units of luminance:

     light face #0b0d10  vs  dark paper  #06070a    off by 5, 6, 6 of 255
     dark  face #f4f7f5  vs  light paper #ffffff    off by 11, 8, 10 of 255

   so a black head growing on a white page arrives at a black page, and a white
   head growing on a black page arrives at a white one. the grow is a theme flip
   performed by a shape. it needs no dissolve, no cut and no second colour: the
   handover is a flat field changing by four per cent of one channel at the one
   moment the frame is a single colour, which is not a thing an eye or an
   encoder can see.

   **it is checked rather than claimed.** `mascotInk()` lifts both blocks out of
   `mascotCss()` at run time — the same move `captions.mjs` makes on
   `index.html` — and `planGrow` throws if the pair has drifted past `INK_TOL`.
   change the mascot's colours and this file fails loudly instead of rendering a
   visible cut.

   ---------- lib/mascot.mjs is not touched, and did not need to be ----------

   the brief allowed adding a scale channel to the mascot if its api had none
   big enough. it does not need one. `#m-zone` is the mascot's own box and
   **the module writes nothing to it** — `apply()` writes `#m-card`,
   `#m-shadow`, the glows, the eyes, the brows, the hand and the three bubble
   parts, and never the zone. post14 already established that: its two mascot
   placements are a transform on `#m-zone` added at the id level by the clip.

   so the grow is a transform on the zone, which scales the real plate the real
   head is drawn on. at the first frame of the grow it **is** the head, to the
   pixel, because it is the head. that is what makes it one continuous shape
   rather than a shape that replaces one.

   three things are written after `__mas.apply(f)` in the same frame, and every
   one of them is a multiply toward zero of a number the module already wrote,
   never a value invented over the top of one:

     #m-zone      transform and opacity   — the module never writes either
     #m-zone      --eye                   — the module writes no custom property
     #m-shadow, .m-glow   opacity          — multiplied down, never up

   ---------- the eyes melt, they do not fade ----------

   a head that grows with its eyes on turns into two enormous slabs before it
   turns into a background, so the features have to go first. they are not faded
   out: `--eye` is walked to `--face`, and since the irises, the brows, the hand
   and the bubble are all painted in `--eye`, they stop being visible by
   becoming the same ink as the skin. **he closes his eyes by having his eyes
   become his face.**

   fading would have meant fighting `apply()` for the brow opacity every frame.
   this touches a property the module never writes at all, which is why it
   composes instead of racing.

   ---------- what covers, measured ----------

   `coverScale(box, size, stage)` is the scale at which the plate covers the
   frame, and it is arithmetic rather than a number somebody watched for: the
   distance from the plate's own centre to the furthest corner of the frame,
   over the plate's radius at rest, with three corrections that do not go away as
   it grows because all three are fractions of the head's own size —

     the idle drift moves his centre by hypot(1.7, 1.2) css px against a 60px
     radius, and at zone scale k both of those are k times bigger, so the ratio
     is constant at 3.5%.

     the breathing takes up to 2% off his scale.

     the squash deforms the circle into an ellipse, up to the module's own 8%
     ceiling, and it is the **short** axis that has to reach the corner. this
     one was left out of the first cut and the render found it: see the note on
     `coverScale` itself.

   `growCoverage(gplan, mplan, fps)` then walks the real `mascotFrame` over the
   real window and reports what actually happened, because a bound derived from
   the idle layer says nothing about a pose the clip put on the same frames. it
   is what caught the missing squash, and it is why it exists.

   ---------- it sits above lib/pictograms.mjs and does not weaken it ----------

   the scene engine refuses three scenes at once or an overlap past 0.45s: a
   handoff is a handoff, not a dissolve. nothing here changes that. this file
   never touches a scene, a part or a step — it operates on the mascot layer and
   on one full frame field, and a clip that runs a grow over a scene handoff is
   still bound by the scene engine's own rule.

     node lib/transitions.mjs test    the module's own checks, no browser
*/

import gsapCore from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { houseEases } from './pictograms.mjs';
import {
  GRID, HEAD, SIZE, STAGE, IDLE, BREATHE_MAX, SQ_MAX, GLOW, THEMES,
  mascotCss, mascotFrame,
} from './mascot.mjs';

const g = (() => {
  const G = gsapCore;
  G.registerPlugin(CustomEase);
  G.ticker.remove(G.updateRoot);
  G.ticker.lagSmoothing(0);
  G.ticker.sleep();
  G.ticker.wake = () => {};
  return G;
})();

const H = houseEases(g, CustomEase);
const n = v => Math.round(v * 1e4) / 1e4;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/* the exit whip. a thing leaving frame accelerates: it is slow while it is
   still something you are looking at and fast once it has decided to go.

   none of the four house curves does that — `pop` overshoots, `glide` is
   symmetric, `heavy` and `drift` both arrive early. so this is `btk.drift`
   **read backwards**, which is an acceleration and is not a new curve: no fifth
   bezier, no fifth name, and nothing for two files to disagree about. sampled,
   it is 0.19 at the halfway point where drift is 0.81. */
const drift = CustomEase.get('btk.drift');
const whip = p => 1 - drift(1 - p);

export const DIRS = ['out', 'in'];
export const SIDES = ['left', 'right'];

/* ---------- the ink ----------
   both theme blocks, lifted out of `mascotCss()` rather than copied, so this
   file cannot hold a colour the mascot has stopped painting with. it throws on
   a missing token for the same reason `brandTokens()` does. */
export function mascotInk(plan = null) {
  const css = mascotCss(plan || { box: { left: 0, top: 0 }, size: SIZE, hand: false, radius: HEAD.radius });
  const block = re => {
    const m = css.match(re);
    if (!m) throw new Error('lib/transitions.mjs could not find a mascot theme block in mascotCss()');
    return m[1];
  };
  const tok = (body, name) => {
    const m = body.match(new RegExp('--' + name + '\\s*:\\s*(#[0-9a-fA-F]{3,8})'));
    if (!m) throw new Error('lib/transitions.mjs wants --' + name + ' out of mascotCss() and it is gone');
    return m[1].toLowerCase();
  };
  const light = block(/\n\.m-zone\{([^}]*)\}/);
  const dark = block(/\[data-theme=dark\]\s*\.m-zone\{([^}]*)\}/);
  return {
    light: { face: tok(light, 'face'), eye: tok(light, 'eye') },
    dark: { face: tok(dark, 'face'), eye: tok(dark, 'eye') },
  };
}

/* how far apart two colours are, worst channel, out of 255. */
export function inkGap(a, b) {
  const p = h => {
    const s = h.replace('#', '');
    const w = s.length === 3 ? s.split('').map(c => c + c).join('') : s.slice(0, 6);
    return [0, 2, 4].map(i => parseInt(w.slice(i, i + 2), 16));
  };
  const x = p(a), y = p(b);
  return Math.max(Math.abs(x[0] - y[0]), Math.abs(x[1] - y[1]), Math.abs(x[2] - y[2]));
}

/* the whole trick's tolerance. twelve of 255 is under five per cent of one
   channel on a flat field, which is below what h.264 at crf 17 keeps and well
   below what an eye finds without an edge to compare against. the shipped pair
   is 6 one way and 11 the other. */
export const INK_TOL = 12;

export function mixHex(a, b, k) {
  const p = h => {
    const s = h.replace('#', '');
    const w = s.length === 3 ? s.split('').map(c => c + c).join('') : s.slice(0, 6);
    return [0, 2, 4].map(i => parseInt(w.slice(i, i + 2), 16));
  };
  const x = p(a), y = p(b), q = clamp(k, 0, 1);
  const c = i => Math.round(x[i] + (y[i] - x[i]) * q).toString(16).padStart(2, '0');
  return '#' + c(0) + c(1) + c(2);
}

/* ---------- what covers the frame ----------
   see the header. every number in here is derived from the mascot's own
   geometry table and its own idle constants; nothing is typed. */
export function coverScale(box, size = SIZE, stage = STAGE) {
  const R = (HEAD.plate.s / 2) / GRID * size;
  const cx = box.left + (HEAD.plate.x + HEAD.plate.s / 2) / GRID * size;
  const cy = box.top + (HEAD.plate.y + HEAD.plate.s / 2) / GRID * size;
  const need = Math.max(
    Math.hypot(cx, cy), Math.hypot(stage.w - cx, cy),
    Math.hypot(cx, stage.h - cy), Math.hypot(stage.w - cx, stage.h - cy),
  );
  /* three corrections, and every one of them is a ratio of the head's own size,
     so they survive the scale rather than being swamped by it.

     **the squash is the one that was missing and the render found it.** the
     card's scale is volume preserving — x is sc*(1+sq) and y is sc/(1+sq) — so
     a squashed circle is an ellipse, and what has to reach the corner is its
     **short** semi axis. the first cut of this allowed for the idle drift and
     the breathing only, and the reverse grow measured 0.970 of the corner on
     the frame the field claimed to be covering: a wedge of the old paper behind
     a disc that had supposedly swallowed it. it is the module's ceiling, 8%,
     rather than what any one clip's pose happens to reach, because this file
     does not get to know what a clip put on those frames. */
  const wobble = Math.hypot(IDLE.driftX.amp, IDLE.driftY.amp) / R;
  const breathe = BREATHE_MAX;
  const squash = SQ_MAX;
  /* the radius the disc has to reach **with every one of those against it at
     once**. this is the number `reachOf` divides by, and keeping the two apart
     was the second thing the render found: the first cut folded the slack into
     the final scale but measured the reach against the bare geometry, so
     `coverU` fired at the moment the *ideal* disc covered and the field came up
     while the real one was still 2% short. the slack has to be in the
     requirement, not only in the destination, or it is not slack at all. */
  const needSafe = need * (1 + squash) / ((1 - wobble) * (1 - breathe));
  const scale = needSafe / R;
  return {
    scale: n(scale), R: n(R), centre: { x: n(cx), y: n(cy) },
    need: n(need), needSafe: n(needSafe),
    wobble: n(wobble), breathe: n(breathe), squash: n(squash),
    /* the same answer in the units a review is written in. */
    plateCssAtRest: n(R * 2), plateDeviceAtCover: n(R * 2 * scale * stage.dsf),
  };
}

/* how much of the frame a disc of radius R*sc about the plate's centre covers,
   as the fraction of the requirement it has reached. 1 is exactly covered, with
   the idle layer at its worst against it on the same frame. */
export function reachOf(cov, sc) {
  return n((cov.R * sc) / cov.needSafe);
}

/* ---------- the grow ---------- */
export function planGrow(opts = {}) {
  const dir = opts.dir || 'out';
  if (!DIRS.includes(dir)) throw new Error('a grow runs "out" or "in", not "' + dir + '"');
  const from = opts.from;
  const to = opts.to || (from === 'light' ? 'dark' : 'light');
  for (const th of [from, to]) {
    if (!THEMES.includes(th)) throw new Error('a grow goes between ' + THEMES.join(' and ') + ', not "' + th + '"');
  }
  if (from === to) throw new Error('a grow that starts and ends on the same theme is not a grow');
  const at = opts.at;
  if (!(at >= 0)) throw new Error('a grow needs a time to start on');

  const stage = opts.stage || STAGE;
  const size = opts.size || SIZE;
  const box = opts.box;
  if (!box || box.left == null || box.top == null) throw new Error('a grow needs the mascot zone box it is growing from');

  const ink = opts.ink || mascotInk();
  /* the whole trick, checked. see the header. */
  const gapOut = inkGap(ink[from].face, ink[to].eye);
  const gapIn = inkGap(ink[from].eye, ink[to].face);
  const gap = dir === 'out' ? gapOut : gapIn;
  if (gap > INK_TOL) {
    throw new Error('the grow hands over between ' + (dir === 'out' ? ink[from].face + ' and ' + ink[to].eye
      : ink[from].eye + ' and ' + ink[to].face) + ', which are ' + gap + ' of 255 apart against a tolerance of '
      + INK_TOL + ' — his fill is no longer the other theme\'s paper and the handover would read as a cut');
  }

  const cov = coverScale(box, size, stage);
  /* a little real headroom past the worst case, so the field never arrives on
     the exact frame the requirement is met and nothing rides on a rounding. */
  const margin = opts.margin == null ? 1.06 : opts.margin;
  const anticipate = opts.anticipate == null ? 0.16 : opts.anticipate;
  const dip = opts.dip == null ? 0.07 : opts.dip;          /* how far he compresses before he swells */
  const meltAt = opts.meltAt == null ? 0.07 : opts.meltAt;
  const meltFor = opts.meltFor == null ? 0.22 : opts.meltFor;
  const growFor = opts.growFor == null ? 0.62 : opts.growFor;
  const settleFor = opts.settleFor == null ? 0.26 : opts.settleFor;
  const release = opts.release == null ? 0.05 : opts.release;
  const tail = opts.tail == null ? 0.10 : opts.tail;

  /* the shape, forward, over local time u. `sc` is the zone's transform scale,
     `melt` walks --eye toward --face and dims the shadow and the glow with it.

     the swell is on `heavy` — late to start, then carrying — because a head
     that swallows a frame has mass. the dip before it is the same anticipation
     every entrance in lib/mascot.mjs opens with. */
  const o = { sc: 1, melt: 0 };
  const tl = g.timeline({ paused: true });
  tl.to(o, { sc: 1 - dip, duration: anticipate, ease: H.glide }, 0);
  tl.to(o, { melt: 1, duration: meltFor, ease: H.glide }, meltAt);
  tl.to(o, { sc: cov.scale * margin, duration: growFor, ease: H.heavy }, anticipate);

  /* where it actually covers, walked at 480Hz rather than solved: the ease is a
     bezier the house owns and the answer has to follow it if it ever changes.
     480 is eight samples per 60fps frame, so the answer is good to an eighth of
     a frame, and it is rounded **down** to the frame grid by the caller's own
     fps rather than being trusted between frames. */
  let coverU = null;
  const end = anticipate + growFor;
  for (let i = 0; i <= 480 * end; i++) {
    const u = i / 480;
    tl.time(u, false);
    if (reachOf(cov, o.sc) >= 1) { coverU = +u.toFixed(4); break; }
  }
  if (coverU === null) {
    throw new Error('the grow never covers the frame — it reaches '
      + reachOf(cov, cov.scale * margin) + ' of the furthest corner');
  }

  const total = +(coverU + release + settleFor + tail).toFixed(4);

  /* the two colours the flat field hands between, and they are the same shape
     both ways: the colour before the handover, and the colour after it.

     out  his fill, then the destination paper
     in   the current paper, then his fill in the destination theme */
  const before = dir === 'out' ? ink[from].face : ink[from].eye;
  const after = dir === 'out' ? ink[to].eye : ink[to].face;

  return {
    kind: 'grow', dir, from, to, at: +at.toFixed(4), seconds: total,
    end: +(at + total).toFixed(4),
    stage, size, box, ink, cover: cov, margin,
    times: { anticipate, dip, meltAt, meltFor, growFor, coverU, release, settleFor, tail },
    handover: { before, after, gap },
    /* what the module promises about the theme attribute, so a clip does not
       have to work it out. `out` flips at the covered moment; `in` is already
       covered when it begins, so it flips on its first frame. */
    flipAt: +(at + (dir === 'out' ? coverU : 0)).toFixed(4),
  };
}

/* the shape at local time u, forward. one seek of one paused timeline. */
const GROW_ENGINES = new WeakMap();
function growEngine(plan) {
  let e = GROW_ENGINES.get(plan);
  if (e) return e;
  const T = plan.times;
  const o = { sc: 1, melt: 0 };
  const tl = g.timeline({ paused: true });
  tl.to(o, { sc: 1 - T.dip, duration: T.anticipate, ease: H.glide }, 0);
  tl.to(o, { melt: 1, duration: T.meltFor, ease: H.glide }, T.meltAt);
  tl.to(o, { sc: plan.cover.scale * plan.margin, duration: T.growFor, ease: H.heavy }, T.anticipate);
  tl.pause(0, false);
  e = { o, tl };
  GROW_ENGINES.set(plan, e);
  return e;
}

/* ---------- the frame ----------
   everything the transition is doing at second t, and it reads nothing but the
   plan and t. `in` is the same shape read backwards, so the two directions are
   one animation rather than two that have to be kept matching. */
export function growFrame(plan, t) {
  const T = plan.times;
  const local = t - plan.at;
  if (local < 0 || local > plan.seconds) {
    return {
      kind: 'grow', dir: plan.dir, phase: 'idle', active: false,
      at: plan.at, started: local >= 0,
      /* **a grow out does not give him back.** he became the page: that is the
         whole point of it, and after the last frame of one he is still the page
         until something hands him over. the first cut of this returned `o: 1`
         the moment the window ended and he snapped back into his corner at full
         size on the new theme, which is a cut — and it is what the 12fps
         preview showed at 6.82s. see `composeTransitions` for how a later grow
         takes the decision back. */
      present: plan.dir === 'out' ? local <= plan.seconds : true,
      zone: { sc: 1, o: 1 }, ink: null, dim: { shadow: 1, glow: 1 },
      wash: { on: false, color: plan.handover.after, o: 0 },
      theme: local < 0 ? plan.from : plan.to,
      reach: 0, covered: false, melt: local < 0 ? 0 : (plan.dir === 'out' ? 1 : 0),
    };
  }

  const u = plan.dir === 'out' ? local : (plan.seconds - local);
  const e = growEngine(plan);
  e.tl.time(clamp(u, 0, e.tl.duration()), false);

  const covered = u >= T.coverU;
  const released = u >= T.coverU + T.release;
  const sc = released ? 1 : e.o.sc;
  const reach = reachOf(plan.cover, e.o.sc);

  /* the head is let go once the field is holding the frame. it is a step in the
     scale channel and it is deliberately invisible: opacity is already nought
     on the same frame, and a scaled element nobody can see is a full frame of
     raster on every one of the frames that follow. */
  const zoneO = released ? 0 : 1;

  /* the melt. --eye walked to --face, which is what makes the eyes, the brows,
     the hand and the bubble stop being visible without touching an opacity the
     module writes. --face is left alone: he is still his own colour. */
  const th = plan.dir === 'out' ? plan.from : plan.to;
  const skin = plan.ink[th].face, paper = plan.ink[th].eye;
  const ink = e.o.melt > 0.0005 ? { face: skin, eye: mixHex(paper, skin, e.o.melt) } : null;

  /* the shadow and the glow, multiplied down. an ellipse under a head that is
     eighteen times its own size is a black band across the frame, and a blur
     filter on a plate that large is minutes of render for something nobody sees
     past the second frame of the grow. */
  const dimK = 1 - e.o.melt;

  /* the field. it comes on at the exact frame the disc covers, painted the
     colour the disc already is, which is what makes its arrival invisible by
     construction rather than by being quick. then it walks to the destination
     paper while the frame is one flat colour, and goes off onto a real
     background that is now the same colour. */
  let washO = 0, mixK = 0;
  if (covered) {
    /* the colour is the **shape's** business, so it reads `u`: forward it walks
       from his fill to the destination paper while the frame is one flat
       colour, and a reverse is that walk backwards. */
    mixK = clamp((u - T.coverU - T.release) / T.settleFor, 0, 1);
    /* the fade off is the **window's** business, so it reads `local`. it is a
       real thing at the end of a grow, where it is invisible because the
       background under it is already that colour — and read off `u` it landed
       on the **first** frame of a reverse instead: the theme has flipped, the
       field is at nothing over it, and one frame of the new paper turns up in
       the middle of what should be a flat hold. rig-test.mjs had that frame.

       forward, `local` and `u` are the same number and this is the arithmetic
       it always was, to the last bit. backwards, the window's end is a long way
       past the frame the disc stopped covering on, so a reverse has no tail at
       all: the field is already gone by then, handed over on the frame the disc
       covers exactly, which is the handover the whole transition is built on. */
    const since = local - T.coverU;
    const off = T.release + T.settleFor;
    washO = since <= off ? 1 : clamp(1 - (since - off) / T.tail, 0, 1);
  }
  const color = mixHex(plan.handover.before, plan.handover.after, mixK);

  let phase;
  if (!covered) phase = u < T.anticipate ? 'anticipate' : 'grow';
  else if (!released) phase = 'cover';
  else phase = washO > 0 ? 'settle' : 'done';

  return {
    kind: 'grow', dir: plan.dir, phase, active: true,
    at: plan.at, started: true, present: true,
    zone: { sc: n(sc), o: zoneO },
    ink,
    dim: { shadow: n(dimK), glow: n(dimK) },
    wash: { on: washO > 0, color, o: n(washO) },
    /* out flips when it covers; in is covered from its first frame, so it flips
       there. either way the frame is one flat colour on the frame it happens. */
    theme: plan.dir === 'out' ? (covered ? plan.to : plan.from) : plan.to,
    reach: n(reach), covered,
    melt: n(e.o.melt), u: n(u),
  };
}

/* ---------- the cross ----------
   off one side, back on the other, in a new place. anticipation against the
   travel, an accelerating departure, a gap with nothing on screen, then an
   arrival on `btk.pop` whose own overshoot is the settle.

   the lean is the detail that makes it a body rather than a sprite: he tips
   into the direction he is going and out of it as he lands, and the tip is
   proportional to where he is in the move rather than being a second animation
   with its own timing. */
export function planCross(opts = {}) {
  const at = opts.at;
  if (!(at >= 0)) throw new Error('a cross needs a time to start on');
  const exit = opts.exit || 'right';
  const enter = opts.enter || (exit === 'right' ? 'left' : 'right');
  for (const s of [exit, enter]) {
    if (!SIDES.includes(s)) throw new Error('a cross leaves and returns on "left" or "right", not "' + s + '"');
  }
  const stage = opts.stage || STAGE;
  const size = opts.size || SIZE;
  const box = opts.box;
  if (!box || box.left == null || box.top == null) throw new Error('a cross needs the mascot zone box it starts in');
  const to = opts.to || box;

  const R = (HEAD.plate.s / 2) / GRID * size;
  const cx = box.left + size / 2, cy = box.top + size / 2;
  const toCx = to.left + size / 2, toCy = to.top + size / 2;
  /* where he ends up, as an offset from the css box the zone is laid out in,
     because everything this file writes is a transform on that box rather than
     a second position for it. `dx` is the half that got lost the first time
     this was written: the landing was hard coded to x=0, so a cross that moved
     him across the frame put him back where he started. */
  const dx = toCx - cx, dy = toCy - cy;
  /* far enough that the ink **and** its glow are out. the wide glow is a blur
     of the plate, and a gaussian is visible to about three sigma, so the reach
     past the ink is three times the blur radius rather than one. */
  const halo = R + GLOW.wide.blur * 3;
  const outX = exit === 'right' ? (stage.w - cx + halo) : -(cx + halo);
  /* measured from where he is going to land, not from where he set off. */
  const inX = enter === 'right' ? (stage.w - toCx + halo) : -(toCx + halo);

  const anticipate = opts.anticipate == null ? 0.16 : opts.anticipate;
  const pull = opts.pull == null ? 0.075 : opts.pull;   /* of the travel, backwards */
  const travel = opts.travel == null ? 0.30 : opts.travel;
  const gap = opts.gap == null ? 0.22 : opts.gap;
  const enterFor = opts.enterFor == null ? 0.52 : opts.enterFor;
  const lean = opts.lean == null ? 7 : opts.lean;       /* degrees at full travel */
  const total = +(anticipate + travel + gap + enterFor).toFixed(4);

  return {
    kind: 'cross', at: +at.toFixed(4), seconds: total, end: +(at + total).toFixed(4),
    exit, enter, stage, size, box, to,
    travelPx: { out: n(outX), in: n(inX) },
    dx: n(dx), dy: n(dy),
    times: { anticipate, pull, travel, gap, enterFor },
    lean, halo: n(halo),
  };
}

const CROSS_ENGINES = new WeakMap();
function crossEngine(plan) {
  let e = CROSS_ENGINES.get(plan);
  if (e) return e;
  const T = plan.times;
  const o = { x: 0, y: 0, sc: 1 };
  const tl = g.timeline({ paused: true });
  /* anticipation: he loads the other way first. */
  tl.to(o, { x: -plan.travelPx.out * T.pull, duration: T.anticipate, ease: H.glide }, 0);
  /* the departure, on the whip. see the note at the top of the file. */
  tl.to(o, { x: plan.travelPx.out, duration: T.travel, ease: whip }, T.anticipate);
  /* the return. he is already at the other side when the gap ends, so the jump
     across is written as a set rather than as a tween nobody sees, and both
     ends of it are measured from where he is going to land. */
  tl.set(o, { x: plan.dx + plan.travelPx.in, y: plan.dy }, T.anticipate + T.travel + T.gap);
  tl.to(o, { x: plan.dx, duration: T.enterFor, ease: H.pop }, T.anticipate + T.travel + T.gap);
  tl.pause(0, false);
  e = { o, tl };
  CROSS_ENGINES.set(plan, e);
  return e;
}

export function crossFrame(plan, t) {
  const T = plan.times;
  const u = t - plan.at;
  /* outside its own window the cross still answers, because where he stands
     afterwards is part of what it did: before it, nothing; after it, the place
     it moved him to. a clip keeps calling it for the rest of the beat. */
  const done = u > plan.seconds;
  if (u < 0 || done) {
    return {
      kind: 'cross', phase: done ? 'landed' : 'idle', active: false,
      at: plan.at, started: done, present: true,
      zone: { x: done ? plan.dx : 0, y: done ? plan.dy : 0, rot: 0, sc: 1, o: 1 },
      off: false,
    };
  }

  const e = crossEngine(plan);
  e.tl.time(clamp(u, 0, e.tl.duration()), false);

  const goneFrom = T.anticipate + T.travel;
  const backAt = goneFrom + T.gap;
  const off = u >= goneFrom && u < backAt;

  /* the lean, as a fraction of the travel rather than as its own tween: he tips
     into the move on the way out and out of it on the way in, and the two can
     never disagree about when the move happened because they are one number.
     each half is measured against its own end, so the entry's lean is how far
     he still has to come rather than how far he is from where he set off. */
  const goingOut = u < backAt;
  const span = goingOut ? plan.travelPx.out : plan.travelPx.in;
  const here = goingOut ? e.o.x : (e.o.x - plan.dx);
  const k = span ? clamp(here / span, -1, 1) : 0;
  const rot = n(plan.lean * k * (goingOut ? 1 : -1));

  let phase = 'travel';
  if (u < T.anticipate) phase = 'anticipate';
  else if (off) phase = 'gone';
  else if (u >= backAt) phase = 'enter';

  return {
    kind: 'cross', phase, active: true,
    at: plan.at, started: true, present: true,
    zone: {
      x: n(e.o.x), y: n(e.o.y), rot,
      sc: n(e.o.sc),
      /* off frame he is switched off rather than merely moved: a plate and two
         blur layers parked outside the viewport are still rastered. */
      o: off ? 0 : 1,
    },
    off,
  };
}

/* ---------- two of them at once ----------
   a clip that has moved him with a cross and then grows him has two answers for
   one element, and the page half writes one transform. so they are merged here
   rather than in the clip: translates add, rotations add, scales multiply,
   opacities multiply, and the last frame with an opinion about the ink or the
   field wins.

   the order the page writes is `translate rotate scale`, and that is the order
   that makes this correct rather than merely defined: the zone's origin is its
   own centre, so he is carried to where he stands **and then** grows about the
   place he is standing. a scale before a translate would grow him about the
   corner he was laid out in and send him off frame. */
export function composeTransitions(frames) {
  const live = frames.filter(Boolean);
  const out = {
    kind: 'compose', phase: 'idle', active: false,
    zone: { x: 0, y: 0, rot: 0, sc: 1, o: 1 },
    ink: null, dim: { shadow: 1, glow: 1 },
    wash: { on: false, color: '#000000', o: 0 },
    theme: null, parts: [],
  };
  for (const f of live) {
    const z = f.zone || {};
    out.zone.x += z.x || 0;
    out.zone.y += z.y || 0;
    out.zone.rot += z.rot || 0;
    out.zone.sc *= (z.sc == null ? 1 : z.sc);
    out.zone.o *= (z.o == null ? 1 : z.o);
    if (f.dim) { out.dim.shadow *= f.dim.shadow; out.dim.glow *= f.dim.glow; }
    if (f.ink) out.ink = f.ink;
    if (f.wash && f.wash.on) out.wash = f.wash;
    /* only a transition that is actually running has an opinion about the
       theme. an idle grow still answers with one — it has to, so a clip can ask
       what the theme will be — and taking that answer here would let a grow
       that has not started yet flip the page under one that has. a clip with
       more than one grow in it reads `flipAt` instead, which is the same answer
       on one clock rather than a race between two. */
    if (f.active) { out.active = true; out.phase = f.phase; if (f.theme) out.theme = f.theme; }
    out.parts.push(f.kind + ':' + f.phase);
  }
  /* ---------- who says whether he is on the screen at all ----------
     presence does not multiply the way the other channels do. a grow out says
     "he is gone" for the whole rest of the clip and a grow in says "he is
     back", and a clip that does both would be left with `false * true` on every
     frame after the second one if this were a product.

     so it is a latch, and the vote goes to the **latest transition that has
     actually started**. that is well defined without this function knowing what
     time it is, because every frame carries its own plan's `at` and whether it
     has begun. a plan that has not started yet has no opinion about a page it
     has not touched. */
  let voter = null;
  for (const f of live) {
    if (!f.started || f.present == null) continue;
    if (!voter || f.at >= voter.at) voter = f;
  }
  if (voter && voter.present === false) out.zone.o = 0;
  out.present = voter ? voter.present : true;

  out.zone.x = n(out.zone.x); out.zone.y = n(out.zone.y);
  out.zone.rot = n(out.zone.rot); out.zone.sc = n(out.zone.sc); out.zone.o = n(out.zone.o);
  /* a merged frame is always written, even when nothing is running: the resting
     offset a finished cross leaves behind is a real value and dropping back to
     `active: false` would snap him home. */
  out.write = true;
  return out;
}

/* ---------- what moved, before a render ----------
   the biggest one frame step in every channel this file writes, and the two
   things the grow has to be true about: the field never appears before the disc
   covers, and the scale never jumps while he is on screen. */
export function transitionMotion(plan, fps, seconds = plan.seconds) {
  const N = Math.round(fps * (seconds + 0.4)) + 1;
  const frame = plan.kind === 'grow' ? growFrame : crossFrame;
  const worst = { sc: { d: 0, t: 0 }, move: { d: 0, t: 0 }, rot: { d: 0, t: 0 }, melt: { d: 0, t: 0 } };
  const bump = (k, d, t) => { if (d > worst[k].d) worst[k] = { d: n(d), t: +t.toFixed(3) }; };
  let prev = null, early = 0, washFrames = 0, offFrames = 0, minReachOnWash = Infinity;
  for (let f = 0; f < N; f++) {
    const t = plan.at - 0.2 + f / fps;
    const fr = frame(plan, t);
    if (plan.kind === 'grow') {
      if (fr.wash.on) {
        washFrames++;
        minReachOnWash = Math.min(minReachOnWash, fr.reach);
        /* the one thing that would make the grow read as a cut: a flat field
           over a disc that has not covered the frame yet. */
        if (!fr.covered) early++;
      }
    } else if (fr.off) offFrames++;
    if (prev) {
      if (plan.kind === 'grow') {
        /* only while he is on screen. the release is a step under an opacity of
           nought and counting it would be measuring a thing nobody sees. */
        if (fr.zone.o > 0 && prev.zone.o > 0) bump('sc', Math.abs(fr.zone.sc - prev.zone.sc), t);
        bump('melt', Math.abs(fr.melt - prev.melt), t);
      } else {
        if (fr.zone.o > 0 && prev.zone.o > 0) {
          bump('move', Math.hypot(fr.zone.x - prev.zone.x, fr.zone.y - prev.zone.y), t);
          bump('rot', Math.abs(fr.zone.rot - prev.zone.rot), t);
        }
      }
    }
    prev = fr;
  }
  return {
    frames: N, fps, worst,
    ...(plan.kind === 'grow'
      ? {
        washFrames, early,
        minReachOnWash: minReachOnWash === Infinity ? null : n(minReachOnWash),
        coverScale: plan.cover.scale,
      }
      : { offFrames, offSeconds: +(offFrames / fps).toFixed(3) }),
  };
}

/* the coverage the render will actually have, rather than the one the idle
   bound allows for. it walks the real mascot frame over the real window, so a
   pose the clip put on those frames is in the answer. */
export function growCoverage(plan, mplan, fps = 60) {
  const cov = plan.cover, unit = mplan.unit || (mplan.size / GRID);
  let worst = null;
  const N = Math.round(fps * plan.seconds) + 1;
  for (let f = 0; f < N; f++) {
    const t = plan.at + f / fps;
    const fr = growFrame(plan, t);
    if (!fr.active || fr.zone.o === 0) continue;
    const m = mascotFrame(mplan, t);
    /* the head as it will be drawn: the zone's scale times the card's own, its
       centre pushed by the card's translate, and the whole thing in css px.

       the card carries **two** scales, because the squash is volume preserving
       and deforms the circle into an ellipse. what has to reach the corner is
       the ellipse's short semi axis, so the smaller of the two is the one that
       answers — taking `sx` alone would report a squashed head as covering on
       the frame its other axis had shrunk. */
    const sc = fr.zone.sc * Math.min(m.card.sx, m.card.sy);
    const r = cov.R * sc;
    const dx = fr.zone.sc * m.card.x, dy = fr.zone.sc * m.card.y;
    const c = { x: cov.centre.x + dx, y: cov.centre.y + dy };
    const need = Math.max(
      Math.hypot(c.x, c.y), Math.hypot(plan.stage.w - c.x, c.y),
      Math.hypot(c.x, plan.stage.h - c.y), Math.hypot(plan.stage.w - c.x, plan.stage.h - c.y),
    );
    const reach = r / need;
    if (fr.covered && (worst === null || reach < worst.reach)) {
      worst = {
        t: +t.toFixed(3), reach: n(reach), sc: n(sc),
        cardSx: n(m.card.sx), cardSy: n(m.card.sy), dx: n(dx), dy: n(dy),
      };
    }
  }
  return {
    /* the smallest reach on any frame the field is claiming to be covered.
       under 1 means a corner of paper was showing behind a disc the plan said
       had swallowed the frame. */
    worst, unit: n(unit),
    ok: !!worst && worst.reach >= 1,
  };
}

/* ---------- the css ----------
   one full frame field and nothing else. no transition and no animation on it,
   for the reason every other file here says: one captured frame carries five or
   six BeginFrames.

   the z-index is the contract with the clip. the field sits above the mascot's
   own layer, which is 4 for the zone and 5 for the bubble, so it can take the
   frame off him. anything a clip wants to survive the handover — the scene that
   draws on top afterwards — goes above 6. */
export function transitionCss() {
  return `
#tr-wash{position:absolute; inset:0; z-index:6; pointer-events:none;
  opacity:0; visibility:hidden; will-change:opacity}
`;
}

export function transitionMarkup() {
  return `<div id="tr-wash"></div>`;
}

/* ---------- the page half ----------
   it writes numbers to elements and it decides nothing, and it must be applied
   **after** `__mas.apply()` in the same frame: every value it writes to a
   mascot element is a multiply of one the module has already put there.
   serialised in with .toString(), so it closes over nothing. */
export function transitionPage() {
  const zone = document.getElementById('m-zone');
  const shadow = document.getElementById('m-shadow');
  const wash = document.getElementById('tr-wash');
  const glows = zone ? [...zone.querySelectorAll('.m-glow')] : [];

  window.__tr = {
    ready: !!(zone && wash),

    /* the zone is the mascot's own box and lib/mascot.mjs writes nothing to it.
       everything else in here multiplies a number apply() has already written,
       which is why the order matters and why nothing is ever raised. */
    apply(f) {
      /* nothing running and nothing left behind: put every channel back rather
         than leaving whatever the last transition wrote. `write` is what a
         composed frame carries — a finished cross has no phase but it does have
         a resting offset, and dropping it would snap him home. */
      if (!f || (!f.active && !f.write)) {
        zone.style.transform = 'none';
        zone.style.opacity = '1';
        zone.style.removeProperty('--eye');
        if (shadow) shadow.style.visibility = 'visible';
        for (const el of glows) el.style.visibility = 'visible';
        wash.style.visibility = 'hidden';
        wash.style.opacity = '0';
        return;
      }
      const z = f.zone;
      const parts = [];
      if (z.x || z.y) parts.push('translate(' + (z.x || 0).toFixed(3) + 'px,' + (z.y || 0).toFixed(3) + 'px)');
      if (z.rot) parts.push('rotate(' + z.rot.toFixed(3) + 'deg)');
      if (z.sc !== 1) parts.push('scale(' + z.sc.toFixed(5) + ')');
      zone.style.transform = parts.length ? parts.join(' ') : 'none';
      zone.style.opacity = z.o.toFixed(4);

      if (f.ink) zone.style.setProperty('--eye', f.ink.eye);
      else zone.style.removeProperty('--eye');

      /* the shadow and the glow, multiplied down and then switched off outright.
         opacity nought is not enough at these scales: the glow is a blur filter
         on a copy of the plate, and at the fifteen times a corner grow reaches
         that is a 450px gaussian over a 3600px disc, rastered on every frame,
         for something nobody can see. visibility is safe to write because
         lib/mascot.mjs writes opacity and never this. */
      if (f.dim) {
        if (shadow) {
          shadow.style.opacity = (parseFloat(shadow.style.opacity || '0') * f.dim.shadow).toFixed(4);
          shadow.style.visibility = f.dim.shadow < 0.002 ? 'hidden' : 'visible';
        }
        for (const el of glows) {
          el.style.opacity = (parseFloat(el.style.opacity || '0') * f.dim.glow).toFixed(4);
          el.style.visibility = f.dim.glow < 0.002 ? 'hidden' : 'visible';
        }
      }

      if (f.wash) {
        wash.style.background = f.wash.color;
        wash.style.opacity = f.wash.o.toFixed(4);
        wash.style.visibility = f.wash.o > 0.002 ? 'visible' : 'hidden';
      }
    },

    /* what the frame is actually painted with where the field is, so a review
       does not have to trust the plan about the one moment that matters. */
    washInk() {
      const cs = getComputedStyle(wash);
      return { background: cs.backgroundColor, opacity: +cs.opacity, visibility: cs.visibility };
    },

    /* the head's drawn radius and centre in device px, off the rendered plate.
       this is what turns "he fills 1080x1920" from a plan number into a
       measurement. the plate is a circle, so its rect is its ink. */
    plate(dsf) {
      const p = zone.querySelector('.m-face .m-plate');
      if (!p) return null;
      const r = p.getBoundingClientRect();
      return {
        w: +(r.width * dsf).toFixed(1), h: +(r.height * dsf).toFixed(1),
        cx: +((r.left + r.width / 2) * dsf).toFixed(1),
        cy: +((r.top + r.height / 2) * dsf).toFixed(1),
      };
    },
  };
}

export function transitionRuntime() {
  return [transitionPage.toString(), 'transitionPage();'].join('\n');
}

/* ---------- printable ---------- */
export function describeTransition(plan) {
  const L = [];
  if (plan.kind === 'grow') {
    const T = plan.times;
    L.push('grow ' + plan.dir + '  ' + plan.from + ' to ' + plan.to
      + '  ' + plan.at.toFixed(2) + ' to ' + plan.end.toFixed(2) + 's  (' + plan.seconds.toFixed(3) + 's)');
    L.push('  cover   scale ' + plan.cover.scale.toFixed(3) + ' x' + plan.margin
      + '   plate ' + plan.cover.plateCssAtRest + 'css at rest, '
      + plan.cover.plateDeviceAtCover + ' device px at cover');
    L.push('  centre  ' + plan.cover.centre.x + ', ' + plan.cover.centre.y
      + '   furthest corner ' + plan.cover.need + ', with slack ' + plan.cover.needSafe
      + '   slack for drift ' + (plan.cover.wobble * 100).toFixed(1) + '%, breathing '
      + (plan.cover.breathe * 100).toFixed(1) + '%, squash '
      + (plan.cover.squash * 100).toFixed(1) + '%');
    L.push('  beats   anticipate ' + T.anticipate + '  melt ' + T.meltAt + '+' + T.meltFor
      + '  grow ' + T.growFor + '  covers at ' + T.coverU.toFixed(3)
      + '  release ' + T.release + '  settle ' + T.settleFor + '  tail ' + T.tail);
    L.push('  hands   ' + plan.handover.before + ' to ' + plan.handover.after
      + '   ' + plan.handover.gap + ' of 255 apart (tolerance ' + INK_TOL + ')');
    L.push('  theme   flips at ' + plan.flipAt.toFixed(3) + 's, with the frame one flat colour');
  } else {
    const T = plan.times;
    L.push('cross   out ' + plan.exit + ', back ' + plan.enter
      + '  ' + plan.at.toFixed(2) + ' to ' + plan.end.toFixed(2) + 's  (' + plan.seconds.toFixed(3) + 's)');
    L.push('  travel  ' + plan.travelPx.out + 'px out, ' + plan.travelPx.in + 'px in, '
      + plan.dy + 'px down.  halo ' + plan.halo + 'px clears the wide glow');
    L.push('  beats   anticipate ' + T.anticipate + ' (pull ' + (T.pull * 100).toFixed(1) + '%)'
      + '  travel ' + T.travel + '  gap ' + T.gap + '  enter ' + T.enterFor
      + '   lean ' + plan.lean + 'deg');
  }
  return L.join('\n');
}

/* ---------- the module's own checks ---------- */
function selfTest() {
  const ok = [], bad = [];
  const t = (name, cond, note) => (cond ? ok : bad).push(name + (note ? '  —  ' + note : ''));

  const ink = mascotInk();
  t('both theme blocks come out of mascotCss()',
    ink.light.face === '#0b0d10' && ink.light.eye === '#ffffff'
    && ink.dark.face === '#f4f7f5' && ink.dark.eye === '#06070a',
    JSON.stringify(ink));

  const gOut = inkGap(ink.light.face, ink.dark.eye);
  const gIn = inkGap(ink.dark.face, ink.light.eye);
  t('his fill is the other theme\'s paper, both ways', gOut <= INK_TOL && gIn <= INK_TOL,
    'light face vs dark paper ' + gOut + ', dark face vs light paper ' + gIn + ' of 255');

  /* the corner case for coverScale: a mascot in a corner has further to grow
     than one in the middle, and it is the corner that a clip actually uses. */
  const corner = { left: STAGE.w - 24 - SIZE, top: STAGE.h - 24 - SIZE };
  const middle = { left: (STAGE.w - SIZE) / 2, top: (STAGE.h - SIZE) / 2 };
  const cC = coverScale(corner), cM = coverScale(middle);
  t('a corner takes more scale than the middle', cC.scale > cM.scale,
    'corner ' + cC.scale.toFixed(2) + ', middle ' + cM.scale.toFixed(2));
  t('the middle needs exactly the half diagonal',
    Math.abs(cM.need - Math.hypot(STAGE.w, STAGE.h) / 2) < 0.01,
    cM.need + ' vs ' + (Math.hypot(STAGE.w, STAGE.h) / 2).toFixed(2));
  t('the plate is 120 css px at rest', cM.plateCssAtRest === 120, cM.plateCssAtRest + 'px');

  const grow = planGrow({ at: 2, dir: 'out', from: 'light', box: middle });
  t('the grow covers', reachOf(grow.cover, grow.cover.scale) >= 1);
  t('it covers before it hands over',
    reachOf(grow.cover, growEngineScale(grow, grow.times.coverU)) >= 0.999,
    'reach at coverU ' + reachOf(grow.cover, growEngineScale(grow, grow.times.coverU)));

  const m = transitionMotion(grow, 60);
  t('the field never appears before the disc covers', m.early === 0, m.early + ' frames');
  t('the field only ever sits on a covered frame', m.minReachOnWash >= 1,
    'worst reach under the field ' + m.minReachOnWash);
  t('the scale never jumps while he is on screen', m.worst.sc.d < 3.2,
    'worst one frame scale step ' + m.worst.sc.d + ' at ' + m.worst.sc.t + 's');

  /* continuity, the same test the camera uses: sample four times as densely and
     the worst step must come down, which is what tells a move from a cut. */
  const step = rate => {
    let w = 0, prev = null;
    for (let f = 0; f < rate * grow.seconds; f++) {
      const fr = growFrame(grow, grow.at + f / rate);
      if (prev && fr.zone.o > 0 && prev.zone.o > 0) w = Math.max(w, Math.abs(fr.zone.sc - prev.zone.sc));
      prev = fr;
    }
    return w;
  };
  const s60 = step(60), s240 = step(240);
  t('the grow is one continuous shape, not a cut', s240 < s60 * 0.6,
    '60Hz ' + s60.toFixed(3) + ', 240Hz ' + s240.toFixed(3) + ', ratio ' + (s240 / s60).toFixed(3));

  t('before it starts, nothing is written', growFrame(grow, 1.5).active === false);
  t('the theme is the old one until it covers',
    growFrame(grow, 2 + grow.times.coverU - 0.02).theme === 'light'
    && growFrame(grow, 2 + grow.times.coverU + 0.02).theme === 'dark');
  t('the eyes have melted by the time he is big',
    growFrame(grow, 2 + grow.times.coverU).melt === 1);

  /* the reverse, and it is the same shape backwards. */
  const back = planGrow({ at: 2, dir: 'in', from: 'dark', to: 'light', box: middle });
  const mb = transitionMotion(back, 60);
  t('the reverse covers before it hands over too', mb.early === 0 && mb.minReachOnWash >= 1,
    'early ' + mb.early + ', worst reach ' + mb.minReachOnWash);
  t('the reverse ends with him at rest',
    Math.abs(growFrame(back, back.end - 0.005).zone.sc - 1) < 0.02
    && growFrame(back, back.end + 0.1).active === false,
    'sc ' + growFrame(back, back.end - 0.005).zone.sc);
  t('the reverse starts covered', growFrame(back, back.at + 0.001).covered === true);
  /* and covered by something. the tail is the fade the field leaves on at the
     end of a **forward** grow; read off the shape it landed on the first frame
     of a reverse instead, which is the theme flipping under a field at nothing
     — one frame of the new paper in the middle of a flat hold. every frame of a
     reverse that is covered is covered by an opaque field, and the field only
     ever leaves on the frame the disc covers exactly. */
  const backFrames = [];
  for (let f = 0; f <= Math.ceil(back.seconds * 60); f++) backFrames.push(growFrame(back, back.at + f / 60));
  const litOff = backFrames.filter(fr => fr.covered && fr.wash.o < 1);
  t('a reverse never shows the paper through the field',
    litOff.length === 0,
    litOff.length ? litOff.length + ' covered frames with the field under 1, first at u ' + litOff[0].u
      : 'all ' + backFrames.filter(fr => fr.covered).length + ' covered frames sit under a solid field');
  t('the reverse hands over on its first frame',
    growFrame(back, back.at).wash.on === true && growFrame(back, back.at).wash.o === 1,
    'field ' + growFrame(back, back.at).wash.o + ' at ' + growFrame(back, back.at).wash.color);

  /* and forward is untouched, to the bit: the tail is still the last tenth of a
     second of the window and it still ends at nothing. */
  const fwd = planGrow({ at: 2, dir: 'out', from: 'light', to: 'dark', box: middle });
  t('a forward grow still tails off at the end of its window',
    growFrame(fwd, fwd.end - fwd.times.tail - 0.001).wash.o === 1
    && growFrame(fwd, fwd.end - fwd.times.tail / 2).wash.o < 0.6
    && growFrame(fwd, fwd.end - 0.001).wash.o < 0.02,
    'field 1 to ' + growFrame(fwd, fwd.end - fwd.times.tail / 2).wash.o
    + ' to ' + growFrame(fwd, fwd.end - 0.001).wash.o + ' over the last '
    + fwd.times.tail + 's');
  t('the reverse is on the destination theme throughout',
    growFrame(back, back.at + 0.001).theme === 'light'
    && growFrame(back, back.end - 0.001).theme === 'light');

  let threw = null;
  try { planGrow({ at: 1, from: 'light', to: 'light', box: middle }); } catch (e) { threw = e.message; }
  t('a grow to the same theme is refused', threw !== null);

  threw = null;
  try {
    planGrow({
      at: 1, from: 'light', box: middle,
      ink: { light: { face: '#0b0d10', eye: '#ffffff' }, dark: { face: '#f4f7f5', eye: '#8a1010' } },
    });
  } catch (e) { threw = e.message; }
  t('a grow whose handover would show is refused', threw !== null,
    'his fill has to be the other theme\'s paper or the cut is visible');

  /* the cross. */
  const cross = planCross({ at: 1, exit: 'right', enter: 'left', box: corner, to: { left: 24, top: corner.top } });
  const cm = transitionMotion(cross, 60);
  t('he is really off frame in the gap', cm.offFrames > 0, cm.offSeconds + 's off');
  t('the travel clears the glow as well as the ink',
    cross.travelPx.out > STAGE.w - (corner.left + SIZE / 2) + (HEAD.plate.s / 2 / GRID * SIZE),
    'travel ' + cross.travelPx.out + ', halo ' + cross.halo);
  t('he starts still', crossFrame(cross, 0.9).active === false
    && crossFrame(cross, 0.9).zone.x === 0);
  t('he lands where he was sent, on both axes',
    Math.abs(crossFrame(cross, cross.end - 0.004).zone.x - cross.dx) < 1.2
    && crossFrame(cross, cross.end + 0.2).zone.x === cross.dx
    && crossFrame(cross, cross.end + 0.2).zone.y === cross.dy,
    'dx ' + cross.dx + ', dy ' + cross.dy
    + ', settled at ' + crossFrame(cross, cross.end - 0.004).zone.x);
  t('the entry comes in from the side it said it would',
    (() => {
      const T = cross.times;
      const first = crossFrame(cross, cross.at + T.anticipate + T.travel + T.gap + 0.004);
      return cross.enter === 'left' ? first.zone.x < cross.dx : first.zone.x > cross.dx;
    })(), 'enters ' + cross.enter);

  /* two at once, which is the case a clip hits the moment it moves him and then
     grows him from where he now stands. */
  const grown = planGrow({
    at: 5, dir: 'in', from: 'dark', to: 'light',
    box: { left: cross.to.left, top: cross.to.top },
  });
  const both = composeTransitions([crossFrame(cross, 5.4), growFrame(grown, 5.4)]);
  t('a landed cross and a running grow compose',
    both.zone.x === cross.dx && both.zone.sc > 1,
    'x ' + both.zone.x + ', scale ' + both.zone.sc + ', parts ' + both.parts.join(' + '));
  t('a composed frame is still written when nothing is running',
    composeTransitions([crossFrame(cross, 9)]).write === true);

  /* the pop the 12fps preview found: a grow out has to keep him gone until
     something hands him back, and a grow in has to be able to take that
     decision back. this is the whole of presence. */
  const gone = planGrow({ at: 5.6, dir: 'out', from: 'light', box: middle });
  const home = planGrow({ at: 7.6, dir: 'in', from: 'dark', to: 'light', box: middle });
  const pair = t2 => composeTransitions([growFrame(gone, t2), growFrame(home, t2)]);
  t('before either grow he is on the screen', pair(2).zone.o === 1);
  t('after the grow out he stays gone', pair(7.0).zone.o === 0,
    'o ' + pair(7.0).zone.o + ' at 7.0s, between the two');
  t('the grow in gives him back', pair(9.0).zone.o === 1 && pair(9.0).present === true,
    'o ' + pair(9.0).zone.o + ' at 9.0s');
  t('a grow out on its own leaves him gone for good',
    composeTransitions([growFrame(gone, 11)]).zone.o === 0);
  t('the departure accelerates', (() => {
    const T = cross.times;
    const a = crossFrame(cross, cross.at + T.anticipate + T.travel * 0.5).zone.x;
    return Math.abs(a) < Math.abs(cross.travelPx.out) * 0.35;
  })(), 'halfway through the travel he has covered under 35% of it, which is a whip rather than a slide');

  console.log(describeTransition(grow));
  console.log('');
  console.log(describeTransition(cross));
  console.log('');
  console.log(ok.map(x => '  ok    ' + x).join('\n'));
  if (bad.length) console.log(bad.map(x => '  FAIL  ' + x).join('\n'));
  console.log('\n  ' + ok.length + ' passed, ' + bad.length + ' failed');
  return bad.length;
}

/* only the self test needs the raw scale at a local time. */
function growEngineScale(plan, u) {
  const e = growEngine(plan);
  e.tl.time(clamp(u, 0, e.tl.duration()), false);
  return e.o.sc;
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('lib/transitions.mjs')
  && process.argv[2] === 'test') {
  process.exit(selfTest() ? 1 : 0);
}
