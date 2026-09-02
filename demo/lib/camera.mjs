/* the boring tek — the camera.

   what this is. the thing record.mjs and post9.mjs each grew their own copy of,
   lifted into one module: a frame that can be pointed at something, pushed
   toward it, left to breathe, snapped in on a punchline and knocked about on a
   hit. it is a rig, not a set of shots — a clip writes a list of legs and this
   answers what the frame is doing at second t.

   **it is new, and nothing was retrofitted onto it.** record.mjs and post9.mjs
   keep their own camera code, byte for byte. those two clips are rendered and
   shipped and the only thing a shared module could do for them is change them.
   this exists so post15 does not write a fourth one.

   ---------- the split, which is the house's ----------

   the same three pieces lib/captions.mjs and lib/pictograms.mjs are built from,
   and for the same reasons.

   - **`planCamera(opts)` runs in node and measures nothing.** it validates,
     resolves the timings and returns plain data. a plan is printable, diffable,
     and readable before a browser is opened. `describeCamera(plan)` prints it.
   - **`resolveCamera(plan, rects)` turns selectors into numbers.** a target may
     be an element, and an element has no rect until a page has laid it out. so
     resolution is its own step with its own input rather than a measurement
     hidden inside the animation, and what comes out is a plan again — plain
     data, with the fitting arithmetic already done and printable.
   - **`cameraFrame(plan, t)` is the whole camera as a pure function of time.**
     centre, zoom, drift, shake and the transform to write, at second t and
     nothing else. that is what makes it compose with the shutter: a subframe at
     t + 1/240 is a real answer rather than a repeat, so a fast move blurs the
     way a fast move should.

   **no css transition and no css animation on anything that has to hit a mark.**
   post2.mjs learned why: one captured frame carries five or six BeginFrames, so
   the browser's own clock advances about 5x per captured frame and a .4s
   transition resolves in five frames. every number here is written per frame.

   ---------- the channels ----------

     cx, cy   the page point the frame is centred on, in css px of page space
     z        the zoom. 1.0 is the page at its own size
     drift    two sines per channel that never come back into phase
     shake    a decaying seeded knock, in screen px, on top of everything

   the transform is record.mjs's, unchanged, because it is the right one:
   `transform-origin: 0 0` and `translate(vw/2 - cx*z, vh/2 - cy*z) scale(z)`.
   a fixed child of the wrapper is fixed to the wrapper, which is exactly what a
   camera wants and is why the site's top bar travels with the frame.

   ---------- the shake is not the glitch shake ----------

   post10, post12, post13 and post14 all shake the whole stage, and every one of
   them computes it **from the frame index rather than from the time**, on
   purpose: a glitch is a dropped packet, it happens to a screen rather than in
   the room, and with the shutter open a one frame jump written against `t`
   comes out as a quarter strength blur instead of as a jump.

   a camera shake is the opposite thing. it is the operator being hit, it
   happens in the room, and a real camera moving fast **does** blur. so this one
   is a continuous function of `t` and it is meant to smear. the two are
   different channels, they live in different files, and a clip may run both at
   once: the glitch tears the picture and the camera flinches.

   the noise is value noise rather than a sine, because a shake is not a wobble:
   seeded values on a grid at `freq` per second, smoothstepped between, two
   octaves. continuous in t at every point, which is the whole requirement.

   ---------- the two modes ----------

   **`site`** is for footage of index.html and it carries the page's own framing
   rules as limits rather than as comments. the two that are arithmetic are
   enforced:

     zoom never below 1.0. the top bar, the vignette and the grain are all
     position:fixed inside the wrapper, so under 1.0 their boxes float as
     visible rectangles in the margin.

     zoom never above 1.09. the page is full bleed at 540 and the subline is its
     widest line, so past that it loses its first and last letter. post9
     rendered THE BORING TEK as SHE / 7/RING / MEK doing exactly this.

   the third — a resting shot frames either page zero or everything below the
   bar, never halfway through it — is a framing judgement rather than a number
   and stays with the clip that makes it.

   **`free`** is for a composed frame on a plain background, where none of those
   are true because there is no bar, no grain and no subline. it takes its own
   `zoom: { min, max }` or none at all.

   the limits are checked by walking the resolved plan at 60fps in
   `resolveCamera`, which is the first moment every number in it exists. a snap
   zoom's overshoot is included, because `btk.pop` goes 10% past its mark and a
   plan that fits at its marks and not at its overshoot is a plan that renders
   wrong.

   ---------- the edges ----------

   "the camera never shows the edge of the picture" is arithmetic, not a hope.
   `minZoomFor(plan, stage)` returns the smallest zoom at which the worst shake
   this plan can produce still cannot pull a border into shot, and
   `cameraMotion` says whether the plan ever goes under it. `__cam.edges()`
   confirms it in the browser off the rendered rect, because the plan can only
   speak for content that is exactly the size it was told.

     node lib/camera.mjs test    the module's own checks, no browser
*/

import gsapCore from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { houseEases, EASE_NAMES } from './pictograms.mjs';

/* node's gsap, the same idempotent setup lib/mascot.mjs does and for the same
   two reasons: this file never plays an animation, it seeks a paused timeline
   and reads numbers off it, so a ticker is a liability; and node has no
   requestAnimationFrame, so gsap's ticker falls back to a live setTimeout and
   every script that touched the module would sit there instead of exiting. */
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

export const MODES = ['site', 'free'];
export { EASE_NAMES };

/* the page's own ceiling and floor, and the reason each of them exists is in
   the header. the site mode and nothing else reads them. */
export const SITE_ZOOM = { min: 1.0, max: 1.09 };

/* ---------- the drift ----------
   no frame is a still frame. a hold under a voice that is still talking reads
   as the render having stopped, and the fix is not a slow zoom: a slow zoom has
   a direction and a direction is a statement. this has neither.

   post9's numbers, carried over with an x channel added. one per cent of scale
   against a two per cent ceiling, deliberately half: what matters is that it is
   never zero, and a drift you can see is a drift you start watching. */
export const DRIFT = {
  z: { amp: 0.010, a: 0.41, b: 0.23, pa: 1.10, pb: 2.70, mix: 0.62 },
  y: { amp: 5.00, a: 0.33, b: 0.19, pa: 0.40, pb: 1.90, mix: 0.62 },
  x: { amp: 0.00, a: 0.29, b: 0.17, pa: 2.10, pb: 0.60, mix: 0.62 },
};

/* two sines summed do repeat, at the beat period of the two — unless the
   periods are incommensurable, in which case the pattern never closes. saying
   so is easy; this is the check. a ratio is refused if it lands within `tol` of
   any p/q with q up to 12, which is every ratio an eye would catch inside a
   clip of this length. */
export function driftBeat(ch, tol = 0.004) {
  const r = ch.a / ch.b;
  let worst = null;
  for (let q = 1; q <= 12; q++) {
    for (let p = 1; p <= 12 * q; p++) {
      const d = Math.abs(r - p / q);
      if (worst === null || d < worst.d) worst = { d, p, q };
    }
  }
  return { ratio: n(r), near: worst.p + '/' + worst.q, off: n(worst.d), ok: worst.d > tol };
}

export function driftAt(cfg, t) {
  const one = ch => (ch && ch.amp)
    ? ch.amp * (ch.mix * Math.sin(t * ch.a + ch.pa) + (1 - ch.mix) * Math.sin(t * ch.b + ch.pb))
    : 0;
  return { x: one(cfg.x), y: one(cfg.y), z: one(cfg.z) };
}

/* ---------- the shake ----------
   seeded value noise, smoothstepped, two octaves, so it is continuous in t at
   every point and a subframe between two frames is a real answer. see the
   header for why that is the opposite of what the glitch layer wants. */
function hash(seed, i) {
  let s = (seed ^ (i * 2654435761)) >>> 0;
  s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
  return s / 4294967296;
}
function vnoise(seed, x) {
  const i = Math.floor(x), f = x - i;
  const a = hash(seed, i), b = hash(seed, i + 1);
  return a + (b - a) * f * f * (3 - 2 * f);
}
function noise2(seed, x) {
  return (0.66 * vnoise(seed, x) + 0.34 * vnoise((seed ^ 0x9e3779b9) >>> 0, x * 2.31)) * 2 - 1;
}

/* the envelope. a knock is loudest just after it arrives and it is over when it
   is over: this reaches exactly zero at p=1, so a shake cannot leave a channel
   a fraction off centre for the rest of the clip.

   **the attack is not decoration and it does not default to nothing.** the body
   of the curve is `(1-p)e^-kp`, which is 1 at p=0+ and 0 at p<=0 — a step, and
   a step is exactly the thing this file says it is not. the module's own check
   caught it: the worst one frame move at 240Hz was the same 3.58px as at 60Hz,
   which is the signature of a jump rather than of a move, and a jump under an
   open shutter renders at a quarter strength smear instead of as a hit.

   so an impact arrives over `attack` of its own window, smoothstepped. the
   default is 0.06, which on the default half second shake is two frames at
   60fps: under the threshold of noticing, and the difference between a shake
   the shutter can resolve and one it cannot. an impact does not build, but it
   does not teleport either. */
export function shakeEnv(p, decay = 3.2, attack = 0.06) {
  if (p <= 0 || p >= 1) return 0;
  const v = (1 - p) * Math.exp(-decay * p);
  if (attack > 0 && p < attack) {
    const q = p / attack;
    return v * q * q * (3 - 2 * q);
  }
  return v;
}

export function shakeAt(plan, t) {
  let x = 0, y = 0, rot = 0, heat = 0;
  for (const s of plan.shakes) {
    if (t < s.at || t >= s.at + s.for) continue;
    const p = (t - s.at) / s.for;
    const e = shakeEnv(p, s.decay, s.attack);
    if (e <= 0) continue;
    heat = Math.max(heat, e);
    const u = (t - s.at) * s.freq;
    x += e * s.amp * noise2(s.seed, u);
    y += e * s.amp * s.ratio * noise2((s.seed ^ 0x51c0de) >>> 0, u);
    rot += e * s.rot * noise2((s.seed ^ 0x2f1b3d) >>> 0, u * 0.7);
  }
  return { x: n(x), y: n(y), rot: n(rot), heat: n(heat) };
}

/* ---------- targets ----------
   three kinds, and a clip may mix them in one plan.

     { sel, fit, dy, dx, z }     an element. fitted on **both** axes
     { rect: {x,y,w,h}, fit }    a page rect, same fitting
     { cx, cy, z }               a point and a zoom, already decided

   the fit is on both axes and that is post11's rule rather than a preference:
   fitting the lockup on width alone framed it at 1.10 and cut the mascot's
   crown off the top of the card and the hint line off the bottom. */
export function isPoint(tg) { return !!(tg && tg.cx != null && tg.cy != null); }
export function targetsOf(plan) {
  const out = [];
  const add = tg => { if (tg && tg.sel && !out.includes(tg.sel)) out.push(tg.sel); };
  add(plan.start);
  for (const l of (plan.legs || [])) add(l.to);
  return out;
}

/* one target, fitted into the stage. `fit` is the air left on every side, in
   css px, so a fit of 12 means the box never comes closer than twelve to a
   border. `dy`/`dx` move the framing off the box's own centre afterwards, which
   is how a shot clears a line rather than centring on it. */
function fitTarget(tg, stage, lim) {
  if (isPoint(tg)) {
    return { cx: tg.cx, cy: tg.cy, z: clamp(tg.z == null ? 1 : tg.z, lim.min, lim.max), from: 'point' };
  }
  const r = tg && tg.rect;
  if (!r) throw new Error('a camera target is a point, a rect or a selector, and this one is none of them');
  const fit = tg.fit == null ? 0 : tg.fit;
  const zw = (stage.w - 2 * fit) / r.w, zh = (stage.h - 2 * fit) / r.h;
  const raw = tg.z != null ? tg.z : Math.min(zw, zh);
  return {
    cx: n(r.x + r.w / 2 + (tg.dx || 0)),
    cy: n(r.y + r.h / 2 + (tg.dy || 0)),
    z: n(clamp(raw, lim.min, lim.max)),
    from: tg.sel ? 'sel ' + tg.sel : 'rect',
    wanted: n(raw),
  };
}

/* ---------- the plan ---------- */
export function planCamera(opts = {}) {
  const mode = opts.mode || 'free';
  if (!MODES.includes(mode)) throw new Error('a camera mode is "site" or "free", not "' + mode + '"');
  const stage = opts.stage || { w: 540, h: 960, dsf: 2 };
  if (mode === 'site' && opts.zoom) {
    throw new Error('site mode carries the page\'s own zoom limits and they are not a clip\'s to set');
  }
  const lim = mode === 'site'
    ? { ...SITE_ZOOM }
    : {
      min: (opts.zoom && opts.zoom.min != null) ? opts.zoom.min : 0.2,
      max: (opts.zoom && opts.zoom.max != null) ? opts.zoom.max : 8,
    };
  const seconds = opts.seconds;
  if (!(seconds > 0)) throw new Error('a camera plan needs its own length in seconds');

  const start = opts.start || { cx: stage.w / 2, cy: stage.h / 2, z: 1 };

  const legs = (opts.legs || []).map((l, i) => {
    if (!(l.for > 0)) throw new Error('leg ' + i + ' has no duration');
    const ease = l.ease || 'glide';
    if (!EASE_NAMES.includes(ease)) {
      throw new Error('leg ' + i + ' asks for ease "' + ease + '", which is not one of ' + EASE_NAMES.join(', '));
    }
    return { i, at: +l.at.toFixed(4), for: +l.for.toFixed(4), to: l.to, ease, why: l.why || null };
  }).sort((a, b) => a.at - b.at);

  /* two legs that overlap are two tweens fighting over cx, and gsap will let
     them: the second starts from wherever the first had got to and the shot
     lands somewhere neither of them asked for. so it is refused. */
  for (let i = 1; i < legs.length; i++) {
    const prev = legs[i - 1];
    if (legs[i].at < prev.at + prev.for - 1e-6) {
      throw new Error('camera legs ' + prev.i + ' and ' + legs[i].i + ' overlap at '
        + legs[i].at.toFixed(2) + 's — a camera is in one place at a time');
    }
  }

  /* a snap is a punchline: pull back a touch, hit the mark hard, settle. the
     pull back is anticipation and it is the reason a snap reads as a snap
     rather than as a jump — the same three beats every entrance in
     lib/mascot.mjs is built from. the settle is `btk.pop`'s own 10% overshoot,
     which is why there is no second curve for it. */
  const snaps = (opts.snaps || []).map((s, i) => {
    const by = s.by == null ? 1.06 : s.by;
    if (by <= 0) throw new Error('snap ' + i + ' asks for a zoom multiplier of ' + by);
    const ant = s.anticipate == null ? 0.035 : s.anticipate;
    const antFor = s.anticipateFor == null ? 0.18 : s.anticipateFor;
    const forS = s.for == null ? 0.22 : s.for;
    const hold = s.hold == null ? 0.30 : s.hold;
    const back = s.back !== false;
    const settle = back ? (s.settle == null ? 0.46 : s.settle) : 0;
    return {
      i, at: +s.at.toFixed(4), by, anticipate: ant, anticipateFor: antFor,
      for: forS, hold, back, settle, why: s.why || null,
      end: +(s.at + antFor + forS + hold + settle).toFixed(4),
    };
  }).sort((a, b) => a.at - b.at);

  const shakes = (opts.shakes || []).map((s, i) => ({
    i,
    at: +s.at.toFixed(4),
    for: s.for == null ? 0.55 : s.for,
    amp: s.amp == null ? 9 : s.amp,          /* screen css px on x, at full heat */
    ratio: s.ratio == null ? 0.55 : s.ratio, /* y as a fraction of x. a knock is wider than it is tall */
    rot: s.rot == null ? 0 : s.rot,          /* degrees. zero by default: see minZoomFor */
    freq: s.freq == null ? 22 : s.freq,      /* noise steps per second */
    decay: s.decay == null ? 3.2 : s.decay,
    /* see shakeEnv. zero is a step and a step is not a shake, so this is not
       allowed to be nothing by accident. */
    attack: s.attack == null ? 0.06 : s.attack,
    seed: s.seed == null ? ((0x5ca1e ^ (i * 2654435761)) >>> 0) : (s.seed >>> 0),
    why: s.why || null,
  })).sort((a, b) => a.at - b.at);

  const drift = opts.drift === false ? null : {
    ...DRIFT,
    ...(opts.drift && opts.drift !== true ? opts.drift : {}),
  };
  if (drift) {
    for (const k of ['x', 'y', 'z']) {
      if (!drift[k] || !drift[k].amp) continue;
      const b = driftBeat(drift[k]);
      if (!b.ok) {
        throw new Error('the drift\'s ' + k + ' periods are commensurable — ratio ' + b.ratio
          + ' is ' + b.near + ' to within ' + b.off + ', so the pattern closes and repeats');
      }
    }
  }

  const plan = {
    mode, stage, zoom: lim, seconds: +seconds.toFixed(4),
    start, legs, snaps, shakes, drift, resolved: false,
  };
  /* a plan with no selectors in it is already resolved, so the common case —
     a composed frame, which is every clip since post10 — never has to say so. */
  if (targetsOf(plan).length === 0) return resolveCamera(plan, {});
  return plan;
}

/* ---------- resolution ----------
   selectors in, numbers out, and what comes back is a plan again. `rects` is a
   map of selector to a page space rect, measured by the caller once. it is an
   argument rather than a measurement taken in here for the same reason
   `sceneFrame` takes an env: a module that reaches into a browser is a module
   that cannot be tested without one. */
export function resolveCamera(plan, rects = {}) {
  for (const s of targetsOf(plan)) {
    if (!rects[s]) throw new Error('the camera wants a rect for "' + s + '" and none was handed in');
  }
  const bind = tg => (tg && tg.sel) ? { ...tg, rect: rects[tg.sel] } : tg;
  const lim = plan.zoom;
  const out = {
    ...plan,
    resolved: true,
    start: fitTarget(bind(plan.start), plan.stage, lim),
    legs: plan.legs.map(l => ({ ...l, to: fitTarget(bind(l.to), plan.stage, lim) })),
  };

  /* the limits, walked rather than argued. this is the first moment every
     number exists, and it includes the snap's overshoot, which is the case a
     plan that checks only its marks gets wrong. */
  const walk = zWalk(out, 60);
  out.z = { min: walk.min, max: walk.max, at: walk.at };
  if (plan.mode === 'site' && (walk.min < SITE_ZOOM.min - 1e-6 || walk.max > SITE_ZOOM.max + 1e-6)) {
    throw new Error('site mode holds the zoom in [' + SITE_ZOOM.min + ', ' + SITE_ZOOM.max
      + '] and this plan reaches ' + walk.min + ' to ' + walk.max
      + ' (peak at ' + walk.at + 's) — see the two framing rules at the top of lib/camera.mjs');
  }
  for (const l of out.legs) {
    if (l.to.wanted != null && Math.abs(l.to.wanted - l.to.z) > 1e-6) {
      out.clamped = out.clamped || [];
      out.clamped.push({ leg: l.i, wanted: l.to.wanted, got: l.to.z, from: l.to.from });
    }
  }
  return out;
}

function zWalk(plan, fps) {
  const N = Math.round(plan.seconds * fps) + 1;
  let min = Infinity, max = -Infinity, at = 0;
  for (let f = 0; f < N; f++) {
    const t = f / fps;
    const z = cameraFrame(plan, t).z;
    if (z < min) min = z;
    if (z > max) { max = z; at = +t.toFixed(3); }
  }
  return { min: n(min), max: n(max), at };
}

/* ---------- the engine ----------
   one paused timeline over one plain object, seeked per frame, never played,
   for the same reason nothing in this pipeline is played. cached against the
   plan object, the way lib/mascot.mjs caches its own. */
const ENGINES = new WeakMap();
function engineFor(plan) {
  if (!plan.resolved) throw new Error('cameraFrame wants a resolved plan — call resolveCamera first');
  let e = ENGINES.get(plan);
  if (e) return e;
  const o = { cx: plan.start.cx, cy: plan.start.cy, z: plan.start.z, sz: 1 };
  const tl = g.timeline({ paused: true });
  for (const l of plan.legs) {
    tl.to(o, { cx: l.to.cx, cy: l.to.cy, z: l.to.z, duration: l.for, ease: H[l.ease] }, l.at);
  }
  /* the snap rides a separate multiplier so it composes with a leg rather than
     replacing one: a push that is still running when the punchline lands keeps
     running underneath it. */
  for (const s of plan.snaps) {
    if (s.anticipate) tl.to(o, { sz: 1 - s.anticipate, duration: s.anticipateFor, ease: H.glide }, s.at);
    tl.to(o, { sz: s.by, duration: s.for, ease: H.pop }, s.at + s.anticipateFor);
    if (s.back) tl.to(o, { sz: 1, duration: s.settle, ease: H.glide }, s.at + s.anticipateFor + s.for + s.hold);
  }
  tl.pause(0, false);
  e = { o, tl };
  ENGINES.set(plan, e);
  return e;
}

/* ---------- the frame ----------
   everything the camera is doing at second t, and it reads nothing but the plan
   and t. `tx`/`ty` are already in the units the page writes. */
export function cameraFrame(plan, t) {
  const e = engineFor(plan);
  e.tl.time(clamp(t, 0, Math.max(plan.seconds, e.tl.duration())), false);
  const d = plan.drift ? driftAt(plan.drift, t) : { x: 0, y: 0, z: 0 };
  const sh = shakeAt(plan, t);
  const z = e.o.z * e.o.sz * (1 + d.z);
  const cx = e.o.cx + d.x, cy = e.o.cy + d.y;
  return {
    cx: n(cx), cy: n(cy), z: n(z),
    /* the leg's own zoom with neither the drift nor the snap on it, which is
       the number a framing argument is had in. */
    legZ: n(e.o.z), snap: n(e.o.sz),
    drift: { x: n(d.x), y: n(d.y), z: n(d.z) },
    shake: sh,
    tx: n(plan.stage.w / 2 - cx * z + sh.x),
    ty: n(plan.stage.h / 2 - cy * z + sh.y),
    rot: sh.rot,
  };
}

/* ---------- what is actually in shot ----------
   the window of page space the frame is showing at second t, in page css px.
   the shake is in it, because a knock that pushes a line out of frame has
   pushed it out of frame.

   this is the other half of the framing argument and it is the one post9 and
   post11 both lost the hard way. post9 rendered THE BORING TEK as
   SHE / 7/RING / MEK because the frame was narrower than the widest line on
   the page; post11's answer was a rule — **no line of the page is ever cut in
   half** — and a rule is only worth having if something checks it. `holds`
   answers for one box over a whole plan and names the frame it first failed
   on. */
export function visibleRect(plan, t) {
  const f = cameraFrame(plan, t);
  const w = plan.stage.w / f.z, h = plan.stage.h / f.z;
  return {
    x: n(f.cx - w / 2), y: n(f.cy - h / 2), w: n(w), h: n(h),
    right: n(f.cx + w / 2), bottom: n(f.cy + h / 2), z: f.z, t: +t.toFixed(3),
  };
}

export function holds(plan, rect, fps = 60, seconds = plan.seconds) {
  const N = Math.round(fps * seconds);
  let worst = null;
  for (let i = 0; i < N; i++) {
    const t = i / fps;
    const v = visibleRect(plan, t);
    /* how much air there is on each side, in page px. negative is the box
       hanging outside the frame, which is the thing being looked for. */
    const near = Math.min(rect.x - v.x, rect.y - v.y, v.right - (rect.x + rect.w), v.bottom - (rect.y + rect.h));
    if (!worst || near < worst.near) {
      worst = {
        near: n(near), t: +t.toFixed(3), z: v.z,
        left: n(rect.x - v.x), top: n(rect.y - v.y),
        right: n(v.right - (rect.x + rect.w)), bottom: n(v.bottom - (rect.y + rect.h)),
      };
    }
  }
  return { ok: !!worst && worst.near >= 0, worst };
}

/* ---------- the edges ----------
   the smallest zoom at which this plan's worst shake still cannot pull a border
   into shot, assuming the content is exactly the stage's own size.

   a translation of `a` px needs `2a/w` of extra scale on that axis, because the
   overscan is shared between the two sides. a rotation of `r` degrees about the
   centre needs the rotated frame's own bounding box to still be covered, which
   is where the cos and sin terms come from. the answer is the largest of them. */
export function minZoomFor(plan, stage = plan.stage) {
  let ax = 0, ay = 0, ar = 0;
  for (const s of plan.shakes) {
    /* the noise is in [-1, 1] and the envelope peaks at 1, so the amplitude is
       the worst case rather than an rms. a bound that is only usually true is
       not a bound. */
    ax = Math.max(ax, s.amp);
    ay = Math.max(ay, s.amp * s.ratio);
    ar = Math.max(ar, Math.abs(s.rot));
  }
  const zx = 1 + 2 * ax / stage.w;
  const zy = 1 + 2 * ay / stage.h;
  const rad = ar * Math.PI / 180;
  const c = Math.abs(Math.cos(rad)), s2 = Math.abs(Math.sin(rad));
  const zr = ar ? Math.max(c + (stage.h / stage.w) * s2, c + (stage.w / stage.h) * s2) : 1;
  return { z: n(Math.max(zx, zy, zr)), fromX: n(zx), fromY: n(zy), fromRot: n(zr) };
}

/* ---------- what moved, before a render ----------
   the biggest one frame step in every channel, plus the zoom's range and
   whether it ever went under the edge floor. it costs a fraction of a second
   and it is the difference between finding a snap now and finding it in a
   twenty second render. */
export function cameraMotion(plan, fps, seconds = plan.seconds) {
  const N = Math.round(fps * seconds);
  const worst = {
    move: { d: 0, t: 0 }, zoom: { d: 0, t: 0 }, shake: { d: 0, t: 0 }, rot: { d: 0, t: 0 },
  };
  const bump = (k, d, t) => { if (d > worst[k].d) worst[k] = { d: n(d), t: +t.toFixed(3) }; };
  const floor = minZoomFor(plan).z;
  let prev = null, zMin = Infinity, zMax = -Infinity, still = 0, shakeMax = 0;
  const under = [];
  for (let f = 0; f < N; f++) {
    const t = f / fps;
    const fr = cameraFrame(plan, t);
    zMin = Math.min(zMin, fr.z); zMax = Math.max(zMax, fr.z);
    shakeMax = Math.max(shakeMax, Math.hypot(fr.shake.x, fr.shake.y));
    if (fr.z < floor - 1e-9) under.push(+t.toFixed(3));
    if (prev) {
      /* what a viewer sees move: the framing translation, which already has the
         zoom and the drift and the shake in it. */
      const dm = Math.hypot(fr.tx - prev.tx, fr.ty - prev.ty);
      bump('move', dm, t);
      bump('zoom', Math.abs(fr.z - prev.z), t);
      bump('shake', Math.hypot(fr.shake.x - prev.shake.x, fr.shake.y - prev.shake.y), t);
      bump('rot', Math.abs(fr.rot - prev.rot), t);
      /* a frame identical to the one before it is a frame the render stopped
         on, and that is the whole reason the drift exists. */
      if (dm < 1e-4 && Math.abs(fr.z - prev.z) < 1e-7) still++;
    }
    prev = fr;
  }
  return {
    frames: N, fps,
    z: { min: n(zMin), max: n(zMax), floor, under: under.slice(0, 8), underCount: under.length },
    shakeMax: n(shakeMax),
    still, stillSeconds: +(still / fps).toFixed(3),
    worst,
  };
}

/* ---------- the css ----------
   two nested boxes and nothing else. the outer one carries the shake's rotation
   about the frame's own centre; the inner one is record.mjs's camera wrapper,
   origin at 0 0, and it is the one the transform above is written to. they are
   separate because a rotation about the centre and a translate-scale about the
   corner do not compose into one readable string. */
export function cameraCss() {
  return `
#cam-shake{position:absolute; inset:0; transform-origin:50% 50%; will-change:transform}
#cam-rig{position:absolute; left:0; top:0; width:100%; height:100%;
  transform-origin:0 0; will-change:transform}
`;
}

/* the wrapper, for a composed frame. filming index.html instead means calling
   `__cam.wrap()` in the page, which does record.mjs's move: everything the body
   already holds goes inside the rig, one level deeper, and a listener
   registered before the page's own script runs means boot() still finds every
   node it queries. */
export function cameraMarkup(inner = '') {
  return `<div id="cam-shake"><div id="cam-rig">${inner}</div></div>`;
}

/* ---------- the page half ----------
   it writes numbers to two elements and it decides nothing. serialised in with
   .toString(), so it closes over nothing: everything it needs arrives on the
   frame it is handed. */
export function cameraPage() {
  const rig = document.getElementById('cam-rig');
  const shake = document.getElementById('cam-shake');

  window.__cam = {
    ready: !!rig,

    /* record.mjs's wrapper, for the case where the camera goes around a page
       rather than around a scene this file built. */
    wrap() {
      if (rig.firstChild) return false;
      while (document.body.firstChild && document.body.firstChild !== shake) {
        rig.appendChild(document.body.firstChild);
      }
      return true;
    },

    /* every rect the plan asked for, in page space, measured once. page space
       rather than screen space is the point: a rect read through a camera that
       is already moving is a rect that answers a different question. */
    rects(sels) {
      const out = {};
      const c = rig.getBoundingClientRect();
      const m = new DOMMatrixReadOnly(getComputedStyle(rig).transform);
      const z = m.a || 1;
      for (const s of sels) {
        const el = document.querySelector(s);
        if (!el) { out[s] = null; continue; }
        const r = el.getBoundingClientRect();
        out[s] = {
          x: +((r.left - c.left) / z).toFixed(3), y: +((r.top - c.top) / z).toFixed(3),
          w: +(r.width / z).toFixed(3), h: +(r.height / z).toFixed(3),
        };
      }
      return out;
    },

    apply(f) {
      rig.style.transform = 'translate(' + f.tx.toFixed(3) + 'px,' + f.ty.toFixed(3) + 'px) '
        + 'scale(' + f.z.toFixed(5) + ')';
      shake.style.transform = f.rot ? 'rotate(' + f.rot.toFixed(4) + 'deg)' : 'none';
    },

    /* how far each border of the rig's content sits outside the frame, in
       device px. negative means a border came into shot, which is the one thing
       a camera may never do. measured off the rendered rect rather than off the
       plan, because the plan can only speak for content that is exactly the
       size it was told it was. */
    edges(vw, vh, dsf) {
      const r = rig.getBoundingClientRect();
      return {
        left: +(-r.left * dsf).toFixed(1),
        top: +(-r.top * dsf).toFixed(1),
        right: +((r.right - vw) * dsf).toFixed(1),
        bottom: +((r.bottom - vh) * dsf).toFixed(1),
      };
    },
  };
}

export function cameraRuntime() {
  return [cameraPage.toString(), 'cameraPage();'].join('\n');
}

/* ---------- a printable summary ---------- */
export function describeCamera(plan) {
  const L = [];
  L.push('camera — ' + plan.mode + ' mode, ' + plan.seconds.toFixed(2) + 's, zoom '
    + plan.zoom.min + ' to ' + plan.zoom.max + (plan.resolved ? '' : '  (UNRESOLVED)'));
  if (plan.resolved) {
    L.push('  start   ' + plan.start.from + '  cx ' + plan.start.cx.toFixed(1)
      + '  cy ' + plan.start.cy.toFixed(1) + '  z ' + plan.start.z.toFixed(4));
  }
  for (const l of plan.legs) {
    L.push('  leg ' + l.i + '   ' + l.at.toFixed(2) + ' to ' + (l.at + l.for).toFixed(2)
      + 's  ' + l.ease.padEnd(6)
      + (plan.resolved ? '  z ' + l.to.z.toFixed(4) + '  ' + l.to.from : '  ' + (l.to.sel || 'rect'))
      + (l.why ? '   ' + l.why : ''));
  }
  for (const s of plan.snaps) {
    L.push('  snap ' + s.i + '  ' + s.at.toFixed(2) + 's  x' + s.by
      + '  ' + s.anticipateFor.toFixed(2) + '/' + s.for.toFixed(2) + '/' + s.settle.toFixed(2)
      + (s.why ? '   ' + s.why : ''));
  }
  for (const s of plan.shakes) {
    L.push('  shake ' + s.i + ' ' + s.at.toFixed(2) + 's  ' + s.for.toFixed(2) + 's  '
      + s.amp + 'px  ' + s.freq + 'Hz' + (s.rot ? '  ' + s.rot + 'deg' : '')
      + (s.why ? '   ' + s.why : ''));
  }
  if (plan.drift) {
    const b = ['z', 'y', 'x'].filter(k => plan.drift[k] && plan.drift[k].amp)
      .map(k => k + ' ' + plan.drift[k].amp + ' (ratio ' + driftBeat(plan.drift[k]).ratio + ')');
    L.push('  drift   ' + (b.join(', ') || 'none'));
  } else L.push('  drift   off');
  if (plan.clamped) for (const c of plan.clamped) {
    L.push('  ! leg ' + c.leg + ' wanted z ' + c.wanted + ' and was held at ' + c.got + ' (' + c.from + ')');
  }
  return L.join('\n');
}

/* ---------- the module's own checks ---------- */
function selfTest() {
  const ok = [], bad = [];
  const t = (name, cond, note) => (cond ? ok : bad).push(name + (note ? '  —  ' + note : ''));
  const stage = { w: 540, h: 960, dsf: 2 };

  const p = planCamera({
    mode: 'free', stage, seconds: 8,
    start: { cx: 270, cy: 480, z: 1 },
    legs: [{ at: 0.4, for: 2.2, to: { cx: 270, cy: 380, z: 1.18 }, ease: 'glide' }],
    snaps: [{ at: 3.4, by: 1.22, for: 0.20 }],
    shakes: [{ at: 3.62, for: 0.5, amp: 10, rot: 0 }],
  });

  t('a plan with no selectors resolves itself', p.resolved === true);
  t('the start holds until the first leg', Math.abs(cameraFrame(p, 0.2).legZ - 1) < 1e-9);
  t('a leg lands on its mark', Math.abs(cameraFrame(p, 2.6).legZ - 1.18) < 1e-4,
    'got ' + cameraFrame(p, 2.6).legZ);
  const mo = cameraMotion(p, 60);
  t('the snap goes past its mark', mo.z.max > 1.18 * 1.22, 'max ' + mo.z.max);
  t('the snap comes back', Math.abs(cameraFrame(p, 5.2).snap - 1) < 1e-3);
  t('the shake is zero before and after',
    shakeAt(p, 3.5).heat === 0 && shakeAt(p, 4.2).heat === 0);
  /* continuity, measured rather than asserted, and the test is the one that
     tells a move from a jump: sample the same window four times as densely and
     the worst step must come down. a held signal — anything computed from the
     frame index, which is what the glitch layer is — reports the same number at
     both rates, because the whole displacement always happens inside one step
     however finely you look. this is what caught the missing attack. */
  const step = rate => {
    let w = 0;
    for (let f = 0; f < rate * 0.6; f++) {
      const t0 = 3.62 + f / rate;
      const a = shakeAt(p, t0), b = shakeAt(p, t0 + 1 / rate);
      w = Math.max(w, Math.hypot(b.x - a.x, b.y - a.y));
    }
    return w;
  };
  const s60 = step(60), s240 = step(240);
  t('the shake is continuous under the shutter', s240 < s60 * 0.6,
    '60Hz ' + s60.toFixed(3) + 'px, 240Hz ' + s240.toFixed(3) + 'px, ratio '
    + (s240 / s60).toFixed(3) + ' (a held signal reports 1.000)');
  t('no frame repeats the one before it', mo.still === 0);

  const mz = minZoomFor(p);
  t('the edge floor is above 1', mz.z > 1, 'z ' + mz.z);

  /* the framing rule, as a check rather than as a comment. */
  const wide = { x: 20, y: 300, w: 500, h: 120 };
  const narrow = { x: 160, y: 400, w: 220, h: 120 };
  t('a box wider than the tightest crop is caught', holds(p, wide, 60).ok === false,
    'worst air ' + holds(p, wide, 60).worst.near + 'px at ' + holds(p, wide, 60).worst.t + 's');
  t('a box that fits is not', holds(p, narrow, 60).ok === true,
    'worst air ' + holds(p, narrow, 60).worst.near + 'px');
  t('the visible window narrows as the zoom goes in',
    visibleRect(p, 3.6).w < visibleRect(p, 0.1).w,
    visibleRect(p, 0.1).w + ' to ' + visibleRect(p, 3.6).w + ' page px across');

  /* the site mode's two limits, and they are the reason this file exists. */
  let threw = null;
  try {
    planCamera({
      mode: 'site', stage, seconds: 4, start: { cx: 270, cy: 480, z: 1 },
      legs: [{ at: 0.2, for: 1.5, to: { cx: 270, cy: 300, z: 1.4 } }],
    });
  } catch (e) { threw = e.message; }
  t('site mode holds the ceiling', threw !== null, threw ? 'threw' : 'did NOT throw');

  threw = null;
  try {
    planCamera({
      mode: 'site', stage, seconds: 4, start: { cx: 270, cy: 480, z: 1.05 },
      snaps: [{ at: 0.6, by: 1.06, for: 0.2 }],
    });
  } catch (e) { threw = e.message; }
  t('site mode counts the snap\'s overshoot, not just its mark', threw !== null,
    threw ? 'threw' : 'a 1.05 x 1.06 snap peaks past 1.09 on btk.pop and was allowed');

  threw = null;
  try {
    planCamera({
      mode: 'free', stage, seconds: 4,
      legs: [{ at: 0.2, for: 1.0, to: { cx: 0, cy: 0 } }, { at: 0.8, for: 1.0, to: { cx: 1, cy: 1 } }],
    });
  } catch (e) { threw = e.message; }
  t('overlapping legs are refused', threw !== null);

  threw = null;
  try {
    planCamera({
      mode: 'free', stage, seconds: 4,
      drift: { z: { amp: 0.01, a: 0.4, b: 0.2, pa: 0, pb: 1, mix: 0.6 } },
    });
  } catch (e) { threw = e.message; }
  t('a drift whose periods divide is refused', threw !== null, '0.4/0.2 is exactly 2/1');
  t('the shipped drift does not repeat',
    driftBeat(DRIFT.z).ok && driftBeat(DRIFT.y).ok,
    'z ' + driftBeat(DRIFT.z).ratio + ', y ' + driftBeat(DRIFT.y).ratio);

  /* selectors. */
  const s = planCamera({
    mode: 'free', stage, seconds: 4,
    start: { cx: 270, cy: 480, z: 1 },
    legs: [{ at: 0.2, for: 1.4, to: { sel: '.card', fit: 12 } }],
  });
  t('a selector plan is not resolved', s.resolved === false);
  t('targetsOf finds it', targetsOf(s).join() === '.card');
  const r = resolveCamera(s, { '.card': { x: 70, y: 300, w: 400, h: 480 } });
  t('a fit is on both axes',
    Math.abs(r.legs[0].to.z - Math.min((540 - 24) / 400, (960 - 24) / 480)) < 1e-4,
    'z ' + r.legs[0].to.z);
  t('the fit centres on the box', r.legs[0].to.cx === 270 && r.legs[0].to.cy === 540);

  threw = null;
  try { cameraFrame(s, 0.5); } catch (e) { threw = e.message; }
  t('an unresolved plan cannot be drawn', threw !== null);

  console.log(describeCamera(r));
  console.log('');
  console.log(ok.map(x => '  ok    ' + x).join('\n'));
  if (bad.length) console.log(bad.map(x => '  FAIL  ' + x).join('\n'));
  console.log('\n  ' + ok.length + ' passed, ' + bad.length + ' failed');
  return bad.length;
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('lib/camera.mjs')
  && process.argv[2] === 'test') {
  process.exit(selfTest() ? 1 : 0);
}
