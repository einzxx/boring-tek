/* the boring tek — animated pictogram scenes. svg drawn in code, driven per
   frame, on the same rig everything else in demo/ runs on.

   what this is. a scene layer for the clips. it takes a list of scenes, each a
   list of flat shapes with a time on them, and turns it into markup plus a pure
   function of time. `lib/captions.mjs` does exactly this for words; this does
   it for pictures, and the two are deliberately built the same way so a clip
   drives both from one loop.

   the one rule, again, because it is the rule that shapes the file: **no css
   transition, no css animation, on anything that has to hit a mark.** one
   captured frame carries five or six BeginFrames, so a css animation resolves
   about five times too fast. every moving value in here is driven by gsap on a
   clock we step by hand, one tick per captured frame, and written to the
   element per frame. `sceneFrame(plan, t)` is the whole animation and it is a
   function of time and of nothing else.

   ---------- the motion core, rebuilt on gsap ----------

   this used to be one hand rolled damped oscillator and a bezier solver, called
   per frame per channel. it is now a gsap timeline per scene and per part, and
   the important thing about that change is what it did *not* change: a scene
   table written against the old engine drives the new one unaltered. the step
   kinds are the same five, the channel tuple grew at the end rather than in the
   middle, and every ease name the old file accepted is still a name.

   **the timeline is built once and scrubbed.** `buildTimeline` takes a gsap, an
   engine plan and a bag of plain javascript objects, and tweens the objects.
   there is not one dom node in it. that is what lets the same builder run in
   node, where it feeds the preflight guards, and in the page, where its numbers
   are written to elements — one source of motion, two readers, and a parity
   check between them on every frame of every render.

   **the clock is stepped, never free running.** in node the master timeline is
   `paused` and seeked with `.time(t)`. in the page it is pinned to the global
   timeline at startTime 0 and stepped with `gsap.updateRoot(t)` from inside the
   one rAF flush the recorder allows per captured frame, with
   `gsap.ticker.lagSmoothing(0)` and `gsap.ticker.sleep()` so nothing else can
   advance it. `__pic.sync()` proves it before a frame is written: it walks the
   shim a dozen ticks and fails unless gsap's own time is the frame index over
   the frame rate, exactly.

   **the master timeline is padded past the end of the clip.** a gsap child that
   completes is dropped off the root, and a dropped child does not re-render if
   time ever moves backwards. the padding costs nothing and removes the whole
   class of bug.

   ---------- the house curves ----------

   four CustomEase paths and one function, registered by name in `houseEases`
   and referenced by name from a scene:

     pop     snappy overshoot — fast in, 10% past the mark, one small dip under,
             still. this is every pop and every scene entrance.
     drift   the soft one. a thing sliding across a page, not falling onto it.
     glide   the calm in-out. every opacity ramp and every line draw.
     heavy   weight. slow to leave, late to arrive, for things with mass.
     land    gravity to the floor and then an impact, and it is a function
             rather than a path because an impact is not a cubic: x squared
             down, a short bounce up, a shallow squash, still.

   the old names are aliases onto those and they still work, so nothing in a
   post file had to be edited: `io` is glide, `spring` and `weight` are pop,
   `fall` is heavy, `land` is land.

   ---------- secondary motion ----------

   **squash and stretch, and it is volume preserving by construction.** there is
   one channel, `sq`, and the two scales are read off it: x is 1+sq and y is
   1/(1+sq). a squash cannot get the volume wrong because there is no second
   number to disagree with the first. it peaks at 6% on a pop and 8% on a
   landing, never more, and the shape of it is anticipation then contact then
   settle: a short stretch on the way in, a snap to the squash over two and a
   half frames landing exactly on contact, one frame of hold, then out on the
   pop curve, whose own dip under the mark is the counter stretch for free.

   **contact is measured, not typed.** where a pop first crosses 1 is a property
   of the pop curve, so it is sampled off the curve at load and the squash is
   anchored to that. change the curve and the squash follows it.

   **the shadow is on the timeline now.** `lift` was always the airborne channel
   — 1 in the air, 0 landed, driving one soft drop shadow that is big and faint
   up high and small and tight on the page. it used to be computed inline beside
   the scale; it is a tween on the same timeline as everything else now, which
   is what makes it impossible for a shape and its shadow to be a frame apart.

   **stagger.** a part made of several shapes can let the details lag the body.
   `stagger: 3` on a part is three sixtieths of a second per sub shape, which is
   the two to four frames a corner should be behind the thing it is a corner of.
   it is opt in and no shipped scene uses it: turning it on for an existing
   scene is a scene edit, not an engine change.

   ---------- the look ----------

   this started as outline clipart: hairline strokes, no fill, no depth. it is
   now solid ink. three rules make that one look rather than a pile of choices.

   **fill, do not outline.** a shape is a filled silhouette in the part's own
   ink. what used to be a second outline inside a first one is now a hole:
   `pic-cut` paints --bg, so a coin's face, a lock's keyhole, an eye's pupil and
   the writing on a document are all cut out of the ink rather than drawn next
   to it. the page shows through, which is what makes these read as paper rather
   than as icons.

   **strokes only where a stroke is the animation.** a rule, a signature, a
   check, a slash, a shackle and a bond are line drawn, so they stay strokes;
   nothing else is. the ones that remain carry one of two weights, HAIR for
   detail cut into a filled shape and MARK for a mark that stands on its own,
   and never a third. the drawing itself is DrawSVGPlugin in the page rather
   than a dashoffset written by hand; node keeps the same 0..1 `dash` number so
   the guards still have something to measure.

   **everything floats.** each part casts one soft drop shadow, large blur, low
   opacity, and it grows while the part is in the air and tightens as it lands.
   that is the whole depth model: no gradient, no second light, no inner shadow.
   a --bg inked part casts nothing, because a white line cut into a black card
   is not floating over it.

   the site itself has no drop shadows and its skill file says so. this is the
   one place they are allowed and it is demo only: nothing in this file reaches
   index.html, and depth on a 1080x1920 clip that plays between two other
   people's videos is doing a different job from depth on a page.

   ---------- what a scene is ----------

   a scene is a group with an entrance, a hold and an exit, and inside it a list
   of parts. a part is one shape and a list of steps, and a step is one of five
   kinds:

     pop    a scale spring about the shape's own centre, with a fade
     draw   line drawing, along the path
     move   a translate from an offset, with or without a fade
     flip   a rotate and a scale, in or out, for one thing becoming another
     fade   opacity alone, from anything to anything

   steps are a list rather than a single animation because real objects do more
   than one thing: a lock's shackle is drawn and *then* seats, which is two
   steps on one part and is the difference between a lock appearing and a lock
   closing. each step owns the channels it moves and leaves the rest alone, so
   two steps on one part never fight over the same number.

   ---------- what is fixed ----------

   the colours, which are the page's own tokens and nothing else: --fg for ink,
   --bg for a cutout, --muted for a secondary shape on the page itself,
   --accent for the one thing a scene is about, --red for an error and nothing
   else, --face and --eye for the mascot. there is no text in a pictogram and
   there is no third colour.

   the geometry is a 100x60 viewBox scaled into whatever box the caller hands
   over, so every number in a scene is in the same units and a shape that reads
   at one size reads at all of them.

   ---------- who checks what ----------

   `planScenes` refuses a plan that cannot be drawn cleanly: a part that starts
   before its own scene has finished arriving, a part still animating while its
   scene leaves, three scenes on screen at once. `sceneMotion` walks every frame
   before a render and reports the biggest one frame step in every channel, the
   shadow's own lift channel and the squash included, so a snap is caught in a
   second rather than after twenty two seconds of jpegs. the clip script turns
   those numbers into guards.

     node lib/pictograms.mjs test    the engine's own checks, no browser
*/

import fs from 'node:fs';
import gsapCore from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

/* ---------- the house curves ----------
   registered in one place and referenced by name, so a scene never carries a
   bezier and two scenes can never disagree about what "a pop" is.

   this function is serialised into the page as well as called in node, so it
   takes its gsap and its CustomEase rather than closing over them, and it must
   not reference anything outside itself. */
export function houseEases(g, Custom) {
  const PATHS = {
    /* fast in, 10% past the mark, one small dip a percent and a half under,
       then still. the old damped oscillator overshot 8.9% and this is the same
       read with a settle you can point at on a curve. */
    'btk.pop': 'M0,0 C0.06,0 0.14,1.1 0.36,1.1 C0.52,1.1 0.6,0.985 0.74,0.985 C0.86,0.985 0.9,1 1,1',
    /* soft. slow to leave, arrives early, coasts in. for a thing sliding across
       a page rather than landing on it. */
    'btk.drift': 'M0,0 C0.32,0 0.16,1 1,1',
    /* the calm in-out, and it is the site's own --ease geometry. every opacity
       ramp in the file is on this: a fade needs a slope you can sit through and
       a steeper curve reads as a flash at 60fps. */
    'btk.glide': 'M0,0 C0.45,0 0.55,1 1,1',
    /* weight. later to start and slower to finish than drift. */
    'btk.heavy': 'M0,0 C0.5,0 0.28,1 1,1',
  };
  for (const id in PATHS) {
    let has = false;
    try { has = !!Custom.get(id); } catch (e) { has = false; }
    if (!has) Custom.create(id, PATHS[id]);
  }
  /* gravity, then an impact, and it stays a function because it is not a cubic
     and pretending it is would cost the thing that makes it work. the first
     part is x squared, which is what falling actually is and is the difference
     between a coin dropping and a coin being slid down. at IMPACT it arrives,
     and after that it is a small damped sine about the landing point: up first,
     because a thing that lands bounces before it settles, then a shallow squash
     past the mark, then nothing. the sine is zero at both ends so the value at
     x=1 is exactly 1 with no normalising, and the bounce's slope is a third of
     the fall's, which is what makes the impact the fastest thing in the step. */
  const hit = 0.72, amp = 0.045, damp = 4.6;
  const land = x => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    if (x < hit) { const q = x / hit; return q * q; }
    const k = (x - hit) / (1 - hit);
    return 1 - amp * Math.exp(-damp * k) * Math.sin(2 * Math.PI * k);
  };
  return {
    pop: 'btk.pop', drift: 'btk.drift', glide: 'btk.glide', heavy: 'btk.heavy', land,
    /* the names the scene tables were written against. they are aliases rather
       than deprecations: a post file that says `ease: 'land'` is saying the
       right thing and there is no reason to make it say it differently. */
    io: 'btk.glide', spring: 'btk.pop', weight: 'btk.pop', fall: 'btk.heavy',
  };
}

/* the names a scene may use, and the ones that mean the thing is in the air.
   `lift` is switched on by an airborne ease unless the step says otherwise, so
   the glass sweeping across a page does not grow a shadow while it does it. */
export const EASE_NAMES = ['pop', 'drift', 'glide', 'heavy', 'land', 'io', 'spring', 'weight', 'fall'];
const AIRBORNE = ['land', 'fall', 'heavy'];

/* where in a `land` a thing actually touches down. the shadow tightens over
   exactly this window rather than over the whole step, and the sound layer cues
   its coin off the same number, so a coin that is still in the air still has a
   big soft shadow and one that has landed does not. */
export const IMPACT = 0.72;

/* ---------- node's gsap, set up once ----------
   this half of the file never plays an animation: it seeks a paused timeline and
   reads numbers off it. so the ticker is not just unnecessary, it is a liability
   in two directions.

   `updateRoot` comes off it for the same reason it does in the page — a ticker
   that wakes dispatches straight into it, and a global timeline nothing owns is
   one nothing can move by accident.

   **and `wake` is stubbed, because node has no requestAnimationFrame.** gsap's
   ticker falls back to `setTimeout` when there is no rAF, `sleep()` only cancels
   what is currently pending, and the next tween created wakes it and schedules
   another. that timer is a live handle: every script that touched this module
   rendered its clip, printed its checks, and then sat there forever instead of
   exiting. two of them were found idle at 2.4 seconds of cpu.

   stubbing wake costs nothing here. the only thing gsap's own wake does that is
   not scheduling is a one time install that needs a window, and there isn't one. */
const gsapNode = (() => {
  const g = gsapCore;
  g.registerPlugin(CustomEase);
  g.ticker.remove(g.updateRoot);
  g.ticker.lagSmoothing(0);
  g.ticker.sleep();
  g.ticker.wake = () => {};
  return g;
})();

/* where a pop first crosses 1 — the moment of contact, and the anchor the
   squash hangs off. measured off the curve at load rather than typed, so
   changing the curve moves the squash with it. */
export const POP_CONTACT = (() => {
  const g = gsapNode, C = CustomEase;
  houseEases(g, C);
  const e = g.parseEase('btk.pop');
  for (let i = 1; i <= 400; i++) { const x = i / 400; if (e(x) >= 1) return +x.toFixed(4); }
  return 0.5;
})();

/* ---------- squash and stretch ----------
   one channel, `sq`, and both scales come off it: x is 1+sq, y is 1/(1+sq). a
   squash cannot get the volume wrong because there is no second number for the
   first one to disagree with.

   the amounts are ceilings the spec set and they are not exceeded: 6% on a pop,
   8% on a landing. the timings are in seconds and are written as sixtieths so
   the intent reads as frames at the rate the clips ship at, while a preview at
   12fps samples the same seconds rather than a different animation. */
export const SQUASH = {
  pop: 0.06, land: 0.08,
  pre: 3 / 60,     /* the anticipation stretch, before contact */
  snap: 2.5 / 60,  /* into the squash, peaking exactly on contact */
  hold: 1 / 60,    /* the contact deformation itself */
  out: 10 / 60,    /* and out, on the pop curve, whose dip is the counter */
  anticipate: 0.45, /* the stretch is this much of the squash, and opposite */
};
/* the default lag, in sixtieths of a second, when a part says `stagger: true`.
   three frames: two reads as a wobble, five reads as two animations. */
export const STAGGER = 3;

const n = v => Math.round(v * 1000) / 1000;

/* ---------- the step defaults ----------
   the durations are floors as much as they are defaults. the opacity ones in
   particular: a fade shorter than about a fifth of a second cannot be told from
   a cut at 60fps, and `planScenes` says so in a number rather than in an
   opinion.

   `pop` is 0.52s where it used to be 0.34. that was the damped spring being
   paid for honestly and the gsap pop curve costs the same: the same overshoot
   in a third less time is a snap, and arrive, overshoot, settle is what mass
   actually costs.

   `move` now drifts by default where it used to be on the calm in-out. that is
   the one default this rebuild changed and it is a motion change on purpose: a
   glass sweeping across a page is a drift, and `io` is still a name if a scene
   wants the old curve back. */
export const STEP_DEFAULTS = {
  pop: { for: 0.52, fade: 0.26, from: 0.62 },
  draw: { for: 0.50, fade: 0.22 },
  move: { for: 0.44, fade: 0.24, ease: 'drift', from: [0, 0], fadeIn: true },
  flip: { for: 0.36, fade: 0.28, rot: 70, from: 0.45, dir: 'in' },
  /* `to` is the level it arrives at and it is a level, not a switch: 0 is gone,
     1 is solid and 0.18 is a thing that is still there and is no longer the one
     being looked at. `from` defaults to whichever end of the range `to` is not,
     so the two common cases stay one word each. */
  fade: { for: 0.26, to: 1 },
};
export const SCENE_ENTER = { for: 0.40, fade: 0.34, scale: 0.90, dx: 0, dy: 9 };
export const SCENE_EXITS = {
  springOut: { for: 0.30, fade: 0.30, scale: 0.90, dx: 0, dy: 7 },
  slideUp: { for: 0.30, fade: 0.30, scale: 1, dx: 0, dy: -16 },
  slideLeft: { for: 0.30, fade: 0.30, scale: 1, dx: -22, dy: 0 },
};

/* ---------- the radius language ----------
   the site rounds a card at 16px on a card about 380px wide, a field at 12 and
   a pill at 999. these are those ratios carried into viewBox units, where one
   unit is 6.2 device px at the size post6 draws the block: `panel` is a
   document or a folder, `chip` is a small block, and anything that wants a pill
   asks for half its own height. nothing in the vocabulary has a square corner
   any more, except the mascot's, which is a circle. */
export const RADII = { panel: 2.8, chip: 2.0 };

/* ---------- the stroke weights ----------
   two, and never a third. HAIR is detail cut into a filled shape, the writing
   on a document or a signature across it. MARK is a mark that stands on its
   own, a check or a slash or a shackle or the rim of a glass. a knocked part
   carries a --bg copy of itself KNOCK units fatter underneath, which is what
   lets an --fg slash cross an --fg eye and still read as a slash. */
export const WEIGHTS = { hair: 1.4, mark: 2.2 };
/* the knock is a gap, not an outline. it was 3 units and the scene strip showed
   what that is: a white halo tracing a shape's silhouette reads as a sticker
   laid on the frame, and on a thin shape like an eye it ate the shape. 1.6 puts
   eight tenths of a unit of page on each side, which is five device px at the
   size post6 draws the block — enough to separate two solid shapes and not
   enough to become a shape of its own. */
export const KNOCK = 1.6;

/* ---------- the shadow ----------
   one soft shadow per part, and every number in it is in viewBox units, so the
   depth scales with the block rather than with the frame.

   `lift` is the airborne channel: 1 while a part is still in the air, 0 once it
   has landed. a part in the air throws a bigger, softer, fainter shadow and a
   landed one throws a small dark tight one. that is the whole trick, and it is
   the reason a pop reads as a thing arriving rather than as a thing fading up.
   it is a tween on the same timeline as the scale it belongs to, so the two
   cannot end up a frame apart.

   the part's own opacity is deliberately not in here. the filter lives inside
   the element the fade is written to, so a part at 30% opacity carries a shadow
   at 30% of its own strength for free — one number controlling both rather than
   two that can disagree. */
export const SHADOW = {
  dy: 1.05, blur: 0.95, o: 0.30,
  rise: 2.6, spread: 2.4, soften: 0.42,
};
/* what the shadow is doing at a given lift. the page calls this per frame per
   part and `safe()` calls it again to work out how far the shadow reaches, so
   the guard and the picture cannot drift apart. */
export function shadowAt(lift) {
  const l = lift < 0 ? 0 : lift > 1 ? 1 : lift;
  return {
    dy: SHADOW.dy * (1 + l * (SHADOW.rise - 1)),
    blur: SHADOW.blur * (1 + l * (SHADOW.spread - 1)),
    o: SHADOW.o * (1 - l * SHADOW.soften),
  };
}
/* three sigma is where a gaussian has nothing left to give, so it is both the
   filter region's margin and the guard's reach. */
const SH_REACH = SHADOW.blur * SHADOW.spread * 3;
const SH_DROP = SHADOW.dy * SHADOW.rise;

/* the mascot's own ratios, off the 64 grid in skills/page-builder/SKILL.md, so
   a small face in a closing scene is provably the same face rather than one
   drawn by eye. */
export const MASCOT_RATIO = { eyeW: 0.217, eyeH: 0.073, sep: 0.35, drop: 0.108 };

/* ---------- the shape vocabulary ----------
   solid, minimal, cut. each returns the markup, the shape's own centre, and its
   bounding box in viewBox units.

   the centre is the origin every scale and every rotate happens about — a shape
   that sprang about the viewBox centre instead of its own would swim across the
   frame on the way in. the box is what sizes the shape's shadow filter region
   and what the border guard measures against, so it is the ink's box: stroke
   width, the knock and the shadow's own reach are added on top of it later,
   once, in `planScenes`.

   three classes carry the whole look. an element with no class is filled in the
   part's ink. `pic-cut` is filled --bg and is a hole. `pic-st` is a stroke in
   the part's ink at the part's weight. `pic-line` is a `pic-st` that is also
   the one geometry the dash runs along, and there is never more than one of
   those per part: a dash across a subpath boundary is not the same thing in
   every engine, so a two stroke mark like an x is two parts that draw in turn,
   which reads better anyway.

   every element here is a single self closing tag at the top level, which is
   what lets `splitShape` below hand each one its own group when a part
   staggers. */
export const SHAPES = {
  /* a block. one filled rounded square and, if asked for, a bar cut across it.
     `slot` is 0 by default and the reason is worth keeping: a dark chip with a
     white bar through the middle is a minus sign, which is a different thing
     entirely, and this vocabulary has already been caught by that once — the
     coin was a circle with a bar across it before it was a coin. a horizontal
     bar in the middle of anything means minus. it is only ever a slot when
     there is something else in the frame saying otherwise. */
  square: ({ cx, cy, s, slot = 0 }) => ({
    o: [cx, cy],
    bb: [cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2],
    svg: `<rect x="${n(cx - s / 2)}" y="${n(cy - s / 2)}" width="${n(s)}" height="${n(s)}" rx="${n(RADII.chip)}"/>`
      + (slot ? `<rect class="pic-cut" x="${n(cx - s * slot / 2)}" y="${n(cy - s * .07)}"`
        + ` width="${n(s * slot)}" height="${n(s * .14)}" rx="${n(s * .07)}"/>` : ''),
  }),
  /* a document. */
  sheet: ({ x, y, w, h, r = RADII.panel }) => ({
    o: [x + w / 2, y + h / 2],
    bb: [x, y, x + w, y + h],
    svg: `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(r)}"/>`,
  }),
  /* a line of writing inside one. cut, not drawn on top: at this size real
     words would be a smudge, and a hole in the ink is what says "there is
     writing here" without pretending to be writing. */
  rule: ({ x1, x2, y }) => ({
    o: [(x1 + x2) / 2, y],
    bb: [x1, y, x2, y],
    svg: `<line class="pic-line" x1="${n(x1)}" y1="${n(y)}" x2="${n(x2)}" y2="${n(y)}"/>`,
  }),
  /* a signature. one path, hand shaped rather than generated off a sine, so the
     loops are uneven the way a real one is. */
  squiggle: ({ x1, x2, y, a = 3.2 }) => {
    const w = x2 - x1, X = k => n(x1 + w * k), Y = k => n(y + a * k);
    return {
      o: [(x1 + x2) / 2, y],
      bb: [x1, y - a * 1.4, x2, y + a * 1.2],
      svg: `<path class="pic-line" d="M ${n(x1)} ${n(y)}`
        + ` C ${X(.10)} ${Y(-1.1)} ${X(.16)} ${Y(1.0)} ${X(.28)} ${Y(.25)}`
        + ` C ${X(.38)} ${Y(-.6)} ${X(.30)} ${Y(-1.3)} ${X(.44)} ${Y(-1.0)}`
        + ` C ${X(.56)} ${Y(-.7)} ${X(.50)} ${Y(1.1)} ${X(.62)} ${Y(.6)}`
        + ` C ${X(.74)} ${Y(.1)} ${X(.70)} ${Y(-1.2)} ${X(.84)} ${Y(-.8)}`
        + ` C ${X(.92)} ${Y(-.5)} ${X(.96)} ${Y(.3)} ${n(x2)} ${Y(-.2)}"/>`,
    };
  },
  /* a coin. a filled disc, a ring cut out of it, and a pip in the middle. it
     was two concentric strokes first and then a filled disc, and neither
     survived contact with the document it lands on: solid ink on solid ink is
     one shape. the cut ring is what makes it a coin on a white page and still a
     coin on a black one, because the hole is the page and the page is always
     the other colour. */
  coin: ({ cx, cy, r }) => ({
    o: [cx, cy],
    bb: [cx - r, cy - r, cx + r, cy + r],
    svg: `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/>`
      + `<circle class="pic-cut" cx="${n(cx)}" cy="${n(cy)}" r="${n(r * .76)}"/>`
      + `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * .30)}"/>`,
  }),
  /* a person. a head and a pair of shoulders, both filled, meeting rather than
     touching: the dome's apex sits inside the head so the two read as one
     silhouette and cast one shadow. no body, no arms, no face — the one face in
     this vocabulary is the mascot's and it stays that way. */
  human: ({ cx, cy, r, sw, sh }) => {
    const yb = cy + r + sh, ry = sh + r * .45;
    return {
      o: [cx, cy + (r + sh) / 2],
      bb: [cx - Math.max(r, sw / 2), cy - r, cx + Math.max(r, sw / 2), yb],
      svg: `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/>`
        + `<path d="M ${n(cx - sw / 2)} ${n(yb)} A ${n(sw / 2)} ${n(ry)} 0 0 1 ${n(cx + sw / 2)} ${n(yb)} Z"/>`,
    };
  },
  /* the mark. */
  check: ({ cx, cy, s }) => ({
    o: [cx, cy],
    bb: [cx - s * .44, cy - s * .36, cx + s * .46, cy + s * .34],
    svg: `<path class="pic-line" d="M ${n(cx - s * .44)} ${n(cy + s * .02)}`
      + ` L ${n(cx - s * .12)} ${n(cy + s * .34)} L ${n(cx + s * .46)} ${n(cy - s * .36)}"/>`,
  }),
  /* one straight stroke. two of these make an x, drawn in turn. also the slash
     through an eye and the line between two figures. */
  stroke: ({ x1, y1, x2, y2 }) => ({
    o: [(x1 + x2) / 2, (y1 + y2) / 2],
    bb: [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)],
    svg: `<line class="pic-line" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"/>`,
  }),
  /* a folder. two rounded blocks, the tab behind the body, rather than one path
     with a mitred notch: the notch was the only square corner left in the
     vocabulary and it read as the one shape drawn by a different hand. */
  folder: ({ x, y, w, h, tab = 5 }) => ({
    o: [x + w / 2, y + h / 2],
    bb: [x, y, x + w, y + h],
    svg: `<rect x="${n(x)}" y="${n(y)}" width="${n(w * .44)}" height="${n(tab * 2.4)}" rx="${n(RADII.chip)}"/>`
      + `<rect x="${n(x)}" y="${n(y + tab)}" width="${n(w)}" height="${n(h - tab)}" rx="${n(RADII.panel)}"/>`,
  }),
  /* a padlock body, with the keyhole cut out of it. */
  lockBody: ({ cx, cy, w, h }) => ({
    o: [cx, cy],
    bb: [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2],
    svg: `<rect x="${n(cx - w / 2)}" y="${n(cy - h / 2)}" width="${n(w)}" height="${n(h)}" rx="${n(RADII.chip)}"/>`
      + `<circle class="pic-cut" cx="${n(cx)}" cy="${n(cy - h * .10)}" r="${n(h * .16)}"/>`
      + `<rect class="pic-cut" x="${n(cx - h * .07)}" y="${n(cy - h * .10)}"`
      + ` width="${n(h * .14)}" height="${n(h * .32)}" rx="${n(h * .07)}"/>`,
  }),
  /* its shackle, open at the bottom, drawn left to right over the top. */
  shackle: ({ cx, cy, r }) => ({
    o: [cx, cy],
    bb: [cx - r, cy - r, cx + r, cy],
    svg: `<path class="pic-line" d="M ${n(cx - r)} ${n(cy)} A ${n(r)} ${n(r)} 0 0 1 ${n(cx + r)} ${n(cy)}"/>`,
  }),
  /* an eye. a filled lens with the pupil cut out of it, which is the same trick
     as the coin and for the same reason: the pupil is the page. */
  eye: ({ cx, cy, w, h, pr }) => ({
    o: [cx, cy],
    bb: [cx - w / 2, cy - h, cx + w / 2, cy + h],
    svg: `<path d="M ${n(cx - w / 2)} ${n(cy)} Q ${n(cx)} ${n(cy - h)} ${n(cx + w / 2)} ${n(cy)}`
      + ` Q ${n(cx)} ${n(cy + h)} ${n(cx - w / 2)} ${n(cy)} Z"/>`
      + `<circle class="pic-cut" cx="${n(cx)}" cy="${n(cy)}" r="${n(pr)}"/>`,
  }),
  /* a magnifying glass, handle down and to the right. the lens is cut, so
     whatever it is over shows through as page rather than as ink, and the rim
     is drawn after the handle so the handle tucks under it.

     inked `page` it is the whole thing in the page's own colour, which is what
     it has to be to work over a filled document: an --fg rim and an --fg handle
     on near black ink are invisible, and the first render of this pass had a
     magnifier that read as a plain white hole with nothing holding it. white
     lens, white rim, white handle, one dark shadow under all three. */
  magnifier: ({ cx, cy, r, hl }) => {
    const c = Math.SQRT1_2;
    return {
      o: [cx, cy],
      bb: [cx - r, cy - r, cx + (r + hl) * c, cy + (r + hl) * c],
      svg: `<circle class="pic-cut" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/>`
        + `<line class="pic-st" x1="${n(cx + r * c)}" y1="${n(cy + r * c)}"`
        + ` x2="${n(cx + (r + hl) * c)}" y2="${n(cy + (r + hl) * c)}"/>`
        + `<circle class="pic-st" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/>`,
    };
  },
  /* the mascot, small. drawn from the ratios rather than by eye, and it carries
     --face and --eye, so it inverts with the theme exactly as the real one does
     and reads as a hole punched in the page rather than as an illustration
     sitting on it. the eyes carry `pic-blink` and the clip drives them from the
     same lid it drives the real mascot with, because two faces on one screen
     must not disagree about blinking. */
  mascotFace: ({ cx, cy, r }) => {
    const d = r * 2, R = MASCOT_RATIO;
    const ew = d * R.eyeW, eh = d * R.eyeH, sep = d * R.sep, drop = d * R.drop;
    const ey = cy + drop - eh / 2;
    const rect = ox => `<rect class="pic-blink" x="${n(cx + ox - ew / 2)}" y="${n(ey)}"`
      + ` width="${n(ew)}" height="${n(eh)}" rx="${n(eh / 2)}" fill="var(--eye)" stroke="none"/>`;
    return {
      o: [cx, cy],
      bb: [cx - r, cy - r, cx + r, cy + r],
      svg: `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/>` + rect(-sep / 2) + rect(sep / 2),
    };
  },
};

/* the top level elements of a shape, one string each, so a staggered part can
   give every one of them its own group and its own delay. every shape above is
   a run of self closing tags, which is what makes this a split rather than a
   parse. */
export function splitShape(svg) {
  return svg.match(/<[a-zA-Z][^>]*\/>/g) || [];
}

/* two of these are --bg and the difference between them is depth, not colour.
   `cut` is a hole in the shape underneath and does not float, because a hole in
   a card is not hovering over it. `page` is a white object lying on top of a
   dark one — a glass over a document — and it floats like everything else. the
   distinction only exists because the light theme's page and its cutouts are
   the same white and nothing else could tell them apart. */
const INKS = ['fg', 'muted', 'accent', 'red', 'face', 'cut', 'page'];
const NO_SHADOW = ['cut'];

/* ---------- the plan ----------
   scenes in, a driveable plan out. everything this refuses is something that
   would otherwise have shipped as a glitch. */
export function planScenes(scenes, opts = {}) {
  const viewBox = opts.viewBox || [100, 60];
  if (!Array.isArray(scenes) || !scenes.length) throw new Error('a scene layer needs scenes');

  const out = [], parts = [], notes = [];
  let last = null;

  scenes.forEach((sc, i) => {
    if (!(sc.out > sc.in)) throw new Error('scene "' + sc.id + '" ends before it starts');
    const enter = { ...SCENE_ENTER, ...(sc.enterOpts || {}) };
    if (sc.exit && !SCENE_EXITS[sc.exit]) {
      throw new Error('scene "' + sc.id + '" exits by "' + sc.exit + '", which is one of '
        + Object.keys(SCENE_EXITS).join(', '));
    }
    const exit = sc.exit ? { kind: sc.exit, ...SCENE_EXITS[sc.exit] } : null;
    const settled = sc.in + Math.max(enter.for, enter.fade);
    const leaving = exit ? sc.out - exit.for : sc.out;
    if (leaving < settled + 0.05) {
      throw new Error('scene "' + sc.id + '" starts leaving at ' + leaving.toFixed(2)
        + 's and is not finished arriving until ' + settled.toFixed(2) + 's — it never holds still');
    }
    if (last) {
      if (sc.in < last.in) throw new Error('the scenes are not in time order at "' + sc.id + '"');
      const overlap = +(last.out - sc.in).toFixed(3);
      if (overlap > 0.45) {
        throw new Error('"' + last.id + '" and "' + sc.id + '" overlap for ' + overlap.toFixed(2)
          + 's — a handoff is a handoff, not a dissolve');
      }
      if (overlap < -0.02) {
        notes.push('a ' + (-overlap).toFixed(2) + 's hole between "' + last.id
          + '" and "' + sc.id + '" with nothing in the zone');
      }
      if (out.length > 1 && sc.in < out[out.length - 2].out) {
        throw new Error('three scenes are on screen at once around ' + sc.in.toFixed(2) + 's');
      }
    }

    const seen = new Set();
    const idx = [];
    (sc.parts || []).forEach(p => {
      if (!SHAPES[p.shape]) throw new Error('no shape called "' + p.shape + '"');
      if (seen.has(p.id)) throw new Error('two parts called "' + p.id + '" in scene "' + sc.id + '"');
      seen.add(p.id);
      if (p.ink && !INKS.includes(p.ink)) {
        throw new Error('"' + p.id + '" is inked ' + p.ink + ', which is not one of ' + INKS.join(', '));
      }
      const ink = p.ink || 'fg';
      const w = p.w == null ? WEIGHTS.hair : p.w;
      if (w !== WEIGHTS.hair && w !== WEIGHTS.mark) {
        throw new Error('"' + p.id + '" is drawn at weight ' + w + ' — the vocabulary carries '
          + WEIGHTS.hair + ' for detail and ' + WEIGHTS.mark + ' for a mark, and nothing else');
      }
      const shape = SHAPES[p.shape](p.at || {});
      const pieces = splitShape(shape.svg);
      /* the stagger, in seconds per sub shape. `true` takes the house lag; a
         number is that many sixtieths, which is how it is meant to be thought
         about — corners lag the body by frames, not by milliseconds. */
      let stagger = 0;
      if (p.stagger) {
        const frames = p.stagger === true ? STAGGER : p.stagger;
        if (!(frames > 0 && frames <= 12)) {
          throw new Error('"' + p.id + '" staggers by ' + p.stagger
            + ' — a lag is between one and twelve frames, and two to four is the range that reads');
        }
        if (pieces.length < 2) {
          throw new Error('"' + p.id + '" staggers but its shape is one element — there is nothing to lag');
        }
        stagger = frames / 60;
      }

      let prev = null, ownsO = false;
      const steps = (Array.isArray(p.steps) ? p.steps : [p.steps]).map(raw => {
        const d = STEP_DEFAULTS[raw.kind];
        if (!d) throw new Error('"' + p.id + '" has a step of kind "' + raw.kind + '"');
        const s = { ...d, ...raw };
        if (!(s.t >= 0) || !(s.for > 0)) throw new Error('"' + p.id + '" has a step with no time');
        if (s.kind === 'move' && s.ease && !EASE_NAMES.includes(s.ease)) {
          throw new Error('"' + p.id + '" moves on "' + s.ease + '", which is one of '
            + EASE_NAMES.join(', '));
        }
        /* a part must not begin before its own scene has mostly arrived, and it
           must be finished before the scene starts leaving. both of those read
           as the layer glitching rather than as a wrong number, which is why
           they throw here instead of being printed. */
        if (s.t < sc.in + enter.for * 0.5 - 1e-6) {
          throw new Error('"' + p.id + '" starts at ' + s.t.toFixed(2)
            + 's, before scene "' + sc.id + '" has arrived');
        }
        if (s.t + s.for > leaving + 1e-6) {
          throw new Error('"' + p.id + '" is still moving at ' + (s.t + s.for).toFixed(2)
            + 's and scene "' + sc.id + '" starts leaving at ' + leaving.toFixed(2) + 's');
        }
        if (s.kind !== 'draw' && s.fade && s.fade < 0.20) {
          notes.push('"' + p.id + '" fades in ' + s.fade.toFixed(2)
            + 's, under the 0.20s a fade needs to read as one at 60fps');
        }
        if (s.kind === 'fade') {
          const to = s.to == null ? 1 : s.to;
          if (!(to >= 0 && to <= 1)) throw new Error('"' + p.id + '" fades to ' + to + ', which is not an opacity');
          if (s.from != null && !(s.from >= 0 && s.from <= 1)) {
            throw new Error('"' + p.id + '" fades from ' + s.from + ', which is not an opacity');
          }
          /* a fade that does not say where it starts assumes the step in front
             of it has finished, because it takes that step's end as its own
             beginning. if they overlap the two disagree about the same number on
             the same frame, which is a flicker rather than a fade. say `from`
             explicitly and it is allowed. */
          if (s.from == null && prev && prev.t + prev.for > s.t + 1e-6) {
            throw new Error('"' + p.id + '" fades at ' + s.t.toFixed(2) + 's while its own '
              + prev.kind + ' step is still running until ' + (prev.t + prev.for).toFixed(2)
              + 's — give the fade a `from`, or start it after');
          }
        }
        prev = s;
        /* a move is airborne when it is a fall or a landing, unless it says
           otherwise: the glass sweeping across a page is not in the air and
           must not grow a shadow while it does it. */
        if (s.kind === 'move' && s.lift == null) s.lift = AIRBORNE.includes(s.ease);
        /* which steps take responsibility for opacity, worked out here once
           rather than re-derived every frame. a flip on its way out and a move
           that was told not to fade both inherit whatever the step in front of
           them left behind, and a `fade` may only claim the region before its
           own start when nothing else has. */
        s.ownsO = ownsO;
        if (s.kind !== 'flip' && s.kind !== 'move') ownsO = true;
        else if (s.kind === 'flip' && s.dir !== 'out') ownsO = true;
        else if (s.kind === 'move' && s.fadeIn) ownsO = true;
        /* where a step deforms on contact, and how hard. a pop lands, so it
           squashes; a fall or a landing squashes at its own impact. everything
           else keeps its shape. the tail is clamped to the scene's own exit so
           a settle can never still be running while the scene leaves. */
        s.squash = null;
        if (s.kind === 'pop') s.squash = { at: s.t + s.for * POP_CONTACT, k: SQUASH.pop };
        else if (s.kind === 'move' && AIRBORNE.includes(s.ease)) {
          s.squash = { at: s.t + s.for * IMPACT, k: SQUASH.land };
        }
        if (s.squash) {
          const tail = s.squash.at + SQUASH.hold + SQUASH.out;
          if (tail > leaving + 1e-6) {
            notes.push('"' + p.id + '" settles its squash at ' + tail.toFixed(2)
              + 's, past scene "' + sc.id + '" leaving at ' + leaving.toFixed(2) + 's — it was clamped');
            s.squash.clamp = +leaving.toFixed(3);
          }
        }
        return s;
      }).sort((a, b) => a.t - b.t);
      idx.push(parts.length);

      /* the filter region, in user units, worked out here once. it is the ink's
         box grown by everything that draws outside it: half the stroke, half
         the knock, the shadow's furthest drop and its three sigma reach. a
         region that is too small clips a shadow off at a straight edge, and a
         region sized to the whole board would cost every part a full board's
         worth of raster on every one of thirteen hundred frames. */
      const knock = p.knock ? KNOCK : 0;
      const edge = w / 2 + knock / 2;
      const shadow = !NO_SHADOW.includes(ink) && p.shadow !== false;
      const bb = shape.bb;
      const m = edge + (shadow ? SH_REACH : 0);
      parts.push({
        i: parts.length, scene: i, id: p.id, shape: p.shape,
        o: [n(shape.o[0]), n(shape.o[1])],
        bb: bb.map(n), ink, w, knock: !!p.knock, shadow,
        draw: steps.some(s => s.kind === 'draw'),
        blink: p.shape === 'mascotFace',
        stagger, subs: stagger ? pieces.length : 0, pieces,
        region: shadow
          ? [n(bb[0] - m), n(bb[1] - m), n(bb[2] - bb[0] + m * 2), n(bb[3] - bb[1] + m * 2 + SH_DROP)]
          : null,
        svg: shape.svg, steps,
      });
    });
    if (!idx.length) throw new Error('scene "' + sc.id + '" has no parts');

    out.push({
      i, id: sc.id, in: +sc.in.toFixed(3), out: +sc.out.toFixed(3),
      enter, exit, settled: +settled.toFixed(3), leaving: +leaving.toFixed(3), parts: idx,
    });
    last = out[out.length - 1];
  });

  return {
    viewBox, origin: [viewBox[0] / 2, viewBox[1] / 2],
    scenes: out, parts, notes,
    seconds: +Math.max(...out.map(s => s.out)).toFixed(3),
  };
}

/* ---------- the engine plan ----------
   the motion and nothing else: what the timeline builder needs and no svg, no
   bounding boxes, no colours. node builds from this and the page builds from
   the same object serialised into it, which is the whole reason the two agree.
   they are not two implementations that happen to match — they are one function
   run twice. */
export function enginePlan(plan) {
  return {
    seconds: plan.seconds,
    squash: SQUASH,
    /* the builder must not close over a module constant: it is serialised into
       the page and evaluated there, where this file's scope does not exist. */
    impact: IMPACT,
    scenes: plan.scenes.map(sc => ({
      i: sc.i, id: sc.id, in: sc.in, out: sc.out,
      settled: sc.settled, leaving: sc.leaving,
      enter: sc.enter, exit: sc.exit,
    })),
    parts: plan.parts.map(p => ({
      i: p.i, id: p.id, scene: p.scene, draw: p.draw,
      stagger: p.stagger, subs: p.subs,
      steps: p.steps.map(s => ({
        kind: s.kind, t: s.t, for: s.for, fade: s.fade, from: s.from, to: s.to,
        ease: s.ease, fadeIn: s.fadeIn, lift: s.lift, rot: s.rot, dir: s.dir,
        ownsO: s.ownsO, squash: s.squash,
      })),
    })),
  };
}

/* ---------- the timeline ----------
   the whole motion core, and it is one function so there is exactly one of it.
   it runs in node against plain objects to feed the guards, and it is
   serialised into the page to run against the same plain objects there, whose
   values are then written to elements. it must not close over anything: gsap,
   the eases, the plan and the channels all come in through the door.

   `dom`, when it is given, is the page half — the `pic-line` elements a `draw`
   step should hand to DrawSVGPlugin. node passes null and keeps the 0..1 `dash`
   number, which is what `sceneMotion` measures; the page gets both, and they
   agree because they are the same tween window on the same curve. */
export function buildTimeline(g, E, ch, dom) {
  const H = ch.eases;
  const S = E.squash;
  const tl = g.timeline({ paused: !!ch.paused });

  /* ---------- the resting state, and why it is not a gsap `set` ----------

     the first build of this used `tl.set(target, vals, 0)` for every "not yet"
     value and it was wrong in a way worth writing down, because it looked
     right. a `set` at position zero is a zero duration tween at the playhead's
     own start, and gsap renders one of those in its *from* state when the
     playhead is put at exactly zero rather than moved past it. so frame nought
     carried the channel's constructed value, frame one carried the set, and the
     coin teleported 26 units on the frame before it fell. worse, on a plan
     where nothing forced a second render the seed never landed at all and the
     coin simply did not drop: a silent wrong animation rather than a loud one.

     so there are no sets. the resting value is written straight onto the plain
     object at build time, and every tween is a `fromTo` that states its own
     start rather than sampling whatever it happens to find. that makes the
     whole timeline declarative: a tween cannot capture a value that depends on
     when it first rendered, scrubbing backwards through one restores its `from`
     exactly, and the frame before any tween is the seed because nothing has
     written it.

     the seeds are applied in step order, so a later step's idea of the region
     in front of it wins exactly as it did when this was five branches of
     if/else evaluated per frame. */
  const seed = (target, vals) => Object.assign(target, vals);
  /* `immediateRender: false`, and it is not a detail. a `fromTo` renders its
     own from state the moment it is created, so building a scene's entrance and
     then its exit leaves the channel holding the exit's start rather than the
     entrance's — the intro group sat at full opacity and zero offset for the
     six frames before it was supposed to arrive, then snapped back to hidden
     and nine units low on the frame its entrance began. one flag, and the
     seeds above are the only thing that speaks before a tween's own time. */
  const move = (target, from, to, dur, ease, at) =>
    tl.fromTo(target, from, { ...to, duration: dur, ease: ease, immediateRender: false }, at);

  E.scenes.forEach(sc => {
    const c = ch.s[sc.i], En = sc.enter, X = sc.exit;
    seed(c, { o: 0, sc: En.scale, dx: En.dx, dy: En.dy });
    move(c, { o: 0 }, { o: 1 }, En.fade, H.glide, sc.in);
    move(c, { sc: En.scale }, { sc: 1 }, En.for, H.pop, sc.in);
    move(c, { dx: En.dx, dy: En.dy }, { dx: 0, dy: 0 }, En.for, H.glide, sc.in);
    if (X) {
      move(c, { o: 1 }, { o: 0 }, X.fade, H.glide, sc.leaving);
      move(c, { sc: 1, dx: 0, dy: 0 }, { sc: X.scale, dx: X.dx, dy: X.dy }, X.for, H.glide, sc.leaving);
    }
  });

  E.parts.forEach(p => {
    const c = ch.p[p.i];
    const subs = ch.q[p.i];
    const lines = dom && dom.lines ? dom.lines[p.i] : null;
    seed(c, { o: 0, sc: 1, dx: 0, dy: 0, rot: 0, dash: p.draw ? 0 : 1, lift: 0, sq: 0 });
    if (subs) for (const sb of subs) seed(sb, { o: 1, sc: 1 });
    /* the drawn geometry starts empty. this one is a real dom write rather than
       a seeded number, so it happens now, once, outside the timeline. */
    if (lines && lines.length) g.set(lines, { drawSVG: '0% 0%' });

    for (const st of p.steps) {
      /* the per sub delay. sub zero is the body and is never late; the rest lag
         it by the part's own stagger. only the two channels a sub owns are
         staggered — a part translates and turns as one object, because a corner
         that arrived somewhere else is a different shape, not a late one. */
      const lag = k => (p.stagger ? k * p.stagger : 0);

      if (st.kind === 'pop') {
        /* a pop is a thing landing, so it is in the air for the whole of it and
           on the page at the end. before its own time it waits at full lift,
           which is the value it has on the frame it starts, so the channel is
           continuous across a step boundary that nobody can see. */
        seed(c, { o: 0, sc: st.from, lift: 1 });
        move(c, { o: 0 }, { o: 1 }, st.fade, H.glide, st.t);
        move(c, { sc: st.from }, { sc: 1 }, st.for, H.pop, st.t);
        move(c, { lift: 1 }, { lift: 0 }, st.for, H.glide, st.t);
        if (subs) {
          subs.forEach((sb, k) => {
            seed(sb, { o: 0, sc: st.from });
            move(sb, { o: 0 }, { o: 1 }, st.fade, H.glide, st.t + lag(k));
            move(sb, { sc: st.from }, { sc: 1 }, st.for, H.pop, st.t + lag(k));
          });
        }
      } else if (st.kind === 'draw') {
        seed(c, { o: 0, dash: 0 });
        move(c, { o: 0 }, { o: 1 }, st.fade, H.glide, st.t);
        move(c, { dash: 0 }, { dash: 1 }, st.for, H.glide, st.t);
        /* the drawing itself, where there is a dom to draw on. the dash channel
           above stays either way: it is what the preflight measures and what
           proves the page and node are on the same frame. */
        if (lines && lines.length) {
          move(lines, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%' }, st.for, H.glide, st.t);
        }
      } else if (st.kind === 'move') {
        const ease = H[st.ease] || H.drift;
        /* the shadow tightens over the fall rather than over the whole step, so
           it is fully landed at the moment of impact and stays landed through
           the bounce. a shadow still shrinking while the coin is rocking would
           read as the coin sinking into the page. */
        const air = st.ease === 'land' || st.ease === 'fall' || st.ease === 'heavy';
        seed(c, { dx: st.from[0], dy: st.from[1] });
        move(c, { dx: st.from[0], dy: st.from[1] }, { dx: 0, dy: 0 }, st.for, ease, st.t);
        if (st.fadeIn) {
          seed(c, { o: 0 });
          move(c, { o: 0 }, { o: 1 }, st.fade, H.glide, st.t);
        }
        if (st.lift) {
          seed(c, { lift: 1 });
          move(c, { lift: 1 }, { lift: 0 }, st.for * (air ? E.impact : 1), H.glide, st.t);
        }
      } else if (st.kind === 'flip') {
        if (st.dir === 'out') {
          /* on the way out the part is already drawn and whatever the step
             before it left behind is exactly right, so nothing is seeded —
             seeding anything here would be the snap. */
          move(c, { o: 1 }, { o: 0 }, st.fade, H.glide, st.t);
          move(c, { sc: 1, rot: 0 }, { sc: st.from, rot: st.rot }, st.for, H.glide, st.t);
        } else {
          seed(c, { o: 0, sc: st.from, rot: st.rot });
          move(c, { o: 0 }, { o: 1 }, st.fade, H.glide, st.t);
          move(c, { sc: st.from, rot: st.rot }, { sc: 1, rot: 0 }, st.for, H.glide, st.t);
        }
      } else {
        /* a fade goes from a level to a level, and it only claims the region
           before its own start when no earlier step has: a part that pops in
           and dims later must keep its pop's own ramp rather than have a step
           three seconds away quietly assert an opacity over it. */
        const to = st.to == null ? 1 : st.to;
        const from = st.from == null ? (to >= 1 ? 0 : 1) : st.from;
        if (!st.ownsO) seed(c, { o: from });
        move(c, { o: from }, { o: to }, st.for, H.glide, st.t);
      }

      /* the contact deformation. anticipation, contact, settle, on one channel
         whose two scales are volume preserving by construction. the settle runs
         on the pop curve, and that curve's own dip under the mark is the
         counter stretch: a thing that squashes and comes straight back to rest
         reads as rubber, and one that overshoots a little on the way back reads
         as mass. */
      if (st.squash) {
        const q = st.squash, a = -q.k * S.anticipate;
        let out = S.out;
        if (q.clamp != null) out = Math.max(1 / 60, q.clamp - (q.at + S.hold));
        move(c, { sq: 0 }, { sq: a }, S.pre, H.glide, q.at - S.pre - S.snap);
        move(c, { sq: a }, { sq: q.k }, S.snap, H.glide, q.at - S.snap);
        move(c, { sq: q.k }, { sq: 0 }, out, H.pop, q.at + S.hold);
      }
    }
  });

  /* the padding. a gsap child that completes is dropped off the root and a
     dropped child does not re-render if time ever moves backwards, which is
     exactly what a sync probe and a scrub do. this costs nothing and removes
     the class. */
  tl.fromTo(ch.pad, { v: 0 }, { v: 1, duration: 0.01 }, E.seconds + 3600);
  return tl;
}

/* the engine attached to a plan: the channels, the eases and the timeline,
   built once and scrubbed after that. it hangs off the plan non-enumerably so
   `JSON.stringify(plan)` is still the plan and not a gsap object graph. */
function engineFor(plan) {
  if (plan.__engine) return plan.__engine;
  const g = gsapNode;
  const E = enginePlan(plan);
  const ch = {
    paused: true,
    eases: houseEases(g, CustomEase),
    pad: { v: 0 },
    s: E.scenes.map(() => ({ o: 0, sc: 1, dx: 0, dy: 0 })),
    p: E.parts.map(() => ({ o: 0, sc: 1, dx: 0, dy: 0, rot: 0, dash: 1, lift: 0, sq: 0 })),
    q: E.parts.map(p => (p.subs ? Array.from({ length: p.subs }, () => ({ o: 1, sc: 1 })) : null)),
  };
  const tl = buildTimeline(g, E, ch, null);
  const eng = { g, E, ch, tl };
  Object.defineProperty(plan, '__engine', { value: eng, enumerable: false, configurable: true });
  return eng;
}

/* ---------- the animation ----------
   a function of time and of nothing else. every number a frame needs comes out
   of here and nothing in the page decides anything.

   the shape of the return is what it always was, with the squash added on the
   end rather than in the middle, so anything reading indices nought to six is
   reading exactly what it read before:

     s[i] = [opacity, scale, dx, dy]                            per scene group
     p[i] = [opacity, scale, dx, dy, rot, dash, lift, squash]   per part
     q[i] = [[opacity, scale], ...] or null                     per sub shape

   translations and the origin are in viewBox units, rot in degrees, dash is the
   fraction of the path that is drawn, lift is how far off the page the part is
   — 1 in the air, 0 landed — and squash is the deformation, where x scales by
   1+sq and y by 1/(1+sq).

   every part holds a value at every instant of the clip, including long before
   and long after its own steps. that is the whole reason the movement guards
   can run unconditionally: nothing in the layer ever teleports while invisible
   and reappears somewhere else, and nothing changes the shadow it is throwing
   while nobody is looking. */
export function sceneFrame(plan, t, env = {}) {
  const blink = env.blink == null ? 1 : env.blink;
  const eng = engineFor(plan);
  eng.tl.time(t, false);
  const s = eng.ch.s.map(c => [c.o, c.sc, c.dx, c.dy]);
  const p = eng.ch.p.map(c => [c.o, c.sc, c.dx, c.dy, c.rot, c.dash, c.lift, c.sq]);
  const q = eng.ch.q.map(a => (a ? a.map(c => [c.o, c.sc]) : null));
  /* `t` is carried at full precision and it used to be rounded to four
     decimals. that was harmless while node computed the picture and the page
     only drew it; it stopped being harmless the moment the page started
     stepping its own gsap timeline off this number. node then animated at
     f/fps and the page animated at f/fps rounded — a third of a percent of a
     frame apart, which is nothing to look at and is a real disagreement
     between two things that are supposed to be one. the parity check found it
     on 62 of 64 captures. */
  return { t, s, p, q, blink };
}

/* ---------- the preflight ----------
   walks every frame of the clip through `sceneFrame` and reports the biggest
   one frame step in every channel, plus who made it. it costs a fraction of a
   second and it is the difference between finding a snap now and finding it in
   a twenty two second render.

   lift is measured next to the rest of them, because a shadow that trebles in
   size in one frame is exactly as wrong as a shape that does. the scale channel
   is measured *effective*: a part's scale times its squash on each axis, which
   is the number a viewer sees, so a squash that snapped would be caught by the
   guard the scale already had rather than by a new one nobody set a limit on.
   a staggered part's sub shapes are folded into the same two channels for the
   same reason.

   the blink is not measured here: the clip drives it with the same lid it
   drives the real mascot with, and that one is already guarded where it is
   generated. measuring it twice would only invite the two limits to drift. */
export function sceneMotion(plan, fps, seconds) {
  const N = Math.round(fps * seconds);
  const worst = {
    sceneO: { d: 0, t: 0, who: null }, sceneS: { d: 0, t: 0, who: null }, sceneM: { d: 0, t: 0, who: null },
    partO: { d: 0, t: 0, who: null }, partS: { d: 0, t: 0, who: null }, partM: { d: 0, t: 0, who: null },
    partR: { d: 0, t: 0, who: null }, partD: { d: 0, t: 0, who: null }, partL: { d: 0, t: 0, who: null },
  };
  const bump = (k, d, t, who) => { if (d > worst[k].d) worst[k] = { d: +d.toFixed(4), t: +t.toFixed(3), who }; };
  /* what a viewer actually sees on each axis. */
  const sx = v => v[1] * (1 + v[7]);
  const sy = v => v[1] / (1 + v[7]);

  let prev = null, visMax = 0, dark = 0, twoFrom = null;
  const handoffs = [];
  for (let f = 0; f < N; f++) {
    const t = f / fps;
    const fr = sceneFrame(plan, t);
    const vis = fr.s.filter(v => v[0] >= 0.004).length;
    visMax = Math.max(visMax, vis);
    if (!vis) dark++;
    if (vis > 1 && twoFrom === null) twoFrom = t;
    if (vis <= 1 && twoFrom !== null) { handoffs.push([+twoFrom.toFixed(3), +t.toFixed(3)]); twoFrom = null; }
    if (prev) {
      for (let i = 0; i < fr.s.length; i++) {
        const a = prev.s[i], b = fr.s[i], who = plan.scenes[i].id;
        bump('sceneO', Math.abs(b[0] - a[0]), t, who);
        bump('sceneS', Math.abs(b[1] - a[1]), t, who);
        bump('sceneM', Math.hypot(b[2] - a[2], b[3] - a[3]), t, who);
      }
      for (let i = 0; i < fr.p.length; i++) {
        const a = prev.p[i], b = fr.p[i], who = plan.parts[i].id;
        bump('partO', Math.abs(b[0] - a[0]), t, who);
        bump('partS', Math.max(Math.abs(sx(b) - sx(a)), Math.abs(sy(b) - sy(a))), t, who);
        bump('partM', Math.hypot(b[2] - a[2], b[3] - a[3]), t, who);
        bump('partR', Math.abs(b[4] - a[4]), t, who);
        bump('partD', Math.abs(b[5] - a[5]), t, who);
        bump('partL', Math.abs(b[6] - a[6]), t, who);
        const qa = prev.q[i], qb = fr.q[i];
        if (qa && qb) {
          for (let k = 0; k < qb.length; k++) {
            bump('partO', Math.abs(qb[k][0] - qa[k][0]), t, who + ':' + k);
            bump('partS', Math.abs(qb[k][1] - qa[k][1]), t, who + ':' + k);
          }
        }
      }
    }
    prev = fr;
  }
  if (twoFrom !== null) handoffs.push([+twoFrom.toFixed(3), +(N / fps).toFixed(3)]);
  return { frames: N, visMax, dark: +(dark / fps).toFixed(3), handoffs, worst };
}

/* ---------- the css ----------
   no transition and no animation anywhere in here, on purpose. the only things
   this file styles are colour, weight, the box and the one filter, and every
   colour in it is a page token. */
export function pictogramCss(plan, box) {
  return `
/* the scene zone. the upper third of the frame, above the caption box and below
   the safe margin, and it never draws outside itself: the svg clips to its own
   viewBox, so a coin dropping in from above the block is cut at the block's
   edge rather than running loose over the whole frame. */
.pic{
  position:absolute;
  left:${box.x}px; top:${box.y}px; width:${box.w}px; height:${box.h}px;
  pointer-events:none; z-index:3;
}
.pic svg{display:block; width:100%; height:100%; overflow:hidden}
/* the resting state is invisible, so a frame captured before the first rAF tick
   cannot show a whole scene sitting there fully drawn. every frame after that
   is written by apply(). */
.pic-s{opacity:0; will-change:opacity,transform}
.pic-p{will-change:opacity,transform}
/* a sub shape's own group, and it only exists on a part that staggers. */
.pic-sub{will-change:opacity,transform}
/* one ink per part, and every one of them is a token out of index.html. --red
   is the site's own error colour and it means the same thing here: something is
   wrong, briefly, until it is not. the ink is set as a colour and every shape
   inside picks it up as currentColor, so a filled shape, its stroked details
   and its knock all move together on one property. */
.pic-p[data-ink="fg"]{color:var(--fg)}
.pic-p[data-ink="muted"]{color:var(--muted)}
.pic-p[data-ink="accent"]{color:var(--accent)}
.pic-p[data-ink="red"]{color:var(--red)}
.pic-p[data-ink="face"]{color:var(--face)}
.pic-p[data-ink="cut"]{color:var(--bg)}
.pic-p[data-ink="page"]{color:var(--bg)}
/* the three ways a shape can be drawn: filled in the ink, cut out to the page,
   or stroked in the ink at the part's own weight. */
.pic-ink{fill:currentColor; stroke:none}
.pic-ink .pic-cut{fill:var(--bg); stroke:none}
.pic-ink .pic-st,.pic-ink .pic-line{fill:none; stroke:currentColor}
.pic-p{stroke-linecap:round; stroke-linejoin:round}
/* the knock: the same geometry underneath, in the page's own colour, fatter.
   it is what puts a gap between two shapes that would otherwise merge — an
   --fg slash across an --fg eye, an --accent lock on an --fg folder. */
.pic-knock,.pic-knock *{fill:var(--bg); stroke:var(--bg)}
/* the shadow's colour. it is the page's ink at a low flood opacity rather than
   a grey, so it inverts with the theme and never turns into a colour the page
   does not have. the attribute is the fallback for an engine that will not
   style a filter primitive; the value it falls back to is black, which in the
   light theme this clip renders in is the same colour to three decimal places. */
.pic-body feDropShadow{flood-color:var(--fg)}
/* the small mascot's lids, scaled about their own centre exactly as the real
   mascot's are on the page. */
.pic-blink{transform-box:fill-box; transform-origin:center}
`;
}

/* ---------- markup ----------
   built from the plan alone, so the dom order is the parts' order and the page
   can write by index without ever querying by name.

   each part is three nested groups and each one has exactly one job. `pic-p`
   carries the ink, the weight, the opacity and the transform. `pic-body` inside
   it carries the shadow filter, which is what makes the fade free: the filter
   is inside the element the opacity is written to, so shape and shadow fade as
   one thing. `pic-ink` inside that is the shape itself and is what the border
   guard measures, so a measurement is never a measurement of blur.

   a staggered part gets one more level: every top level element of its shape in
   its own `pic-sub`, which is the only thing a sub delay is allowed to write
   to. an unstaggered part has none of those groups at all, so the shape of the
   dom for every scene that shipped before this is byte for byte what it was. */
export function pictogramMarkup(plan) {
  const defs = plan.parts.filter(p => p.shadow).map(p => {
    const r = p.region;
    return `<filter id="psh-${p.i}" filterUnits="userSpaceOnUse"`
      + ` x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}"`
      + ` color-interpolation-filters="sRGB">`
      + `<feDropShadow dx="0" dy="${n(SHADOW.dy)}" stdDeviation="${n(SHADOW.blur)}"`
      + ` flood-color="var(--fg)" flood-opacity="${n(SHADOW.o)}"/></filter>`;
  }).join('');

  const inkOf = p => (p.stagger
    ? p.pieces.map((el, k) => '<g class="pic-sub" data-sub="' + k + '">' + el + '</g>').join('')
    : p.svg);

  const body = plan.scenes.map(sc => '<g class="pic-s" data-scene="' + sc.i + '">'
    + sc.parts.map(pi => {
      const p = plan.parts[pi];
      const knock = p.knock
        ? '<g class="pic-knock" stroke-width="' + n(p.w + KNOCK) + '">' + p.svg + '</g>'
        : '';
      return '<g class="pic-p" data-part="' + p.i + '" data-ink="' + p.ink
        + '" stroke-width="' + n(p.w) + '">'
        + '<g class="pic-body"' + (p.shadow ? ' filter="url(#psh-' + p.i + ')"' : '') + '>'
        + knock + '<g class="pic-ink">' + inkOf(p) + '</g>'
        + '</g></g>';
    }).join('')
    + '</g>').join('');

  return '<div class="pic"><svg viewBox="0 0 ' + plan.viewBox[0] + ' ' + plan.viewBox[1]
    + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'
    + '<defs>' + defs + '</defs>' + body + '</svg></div>';
}

/* ---------- the page half ----------
   serialised into the scene with .toString(), the way captionPage is. it
   measures nothing that node already knows and it decides nothing: it builds
   the same timeline node built, steps it, and writes what comes out.

   `set()` leaves a frame for the rAF loop and the loop applies it, so the layer
   is genuinely on the shim's clock rather than being written straight into the
   dom from node. the recorder flushes exactly one rAF per captured frame, which
   makes that one tick and one frame, always. the frame node leaves is used for
   three things and only three: its time, which is what the timeline is stepped
   to; its blink, which node owns because the big mascot owns it; and its
   channels, which are compared against the ones gsap just produced. that last
   one is the parity check, and it is the reason there can be one motion core
   with two readers rather than two motion cores that look alike. */
export function pictogramPage() {
  const PLAN = window.__PIC_PLAN;
  const SH = PLAN.shadow;
  const E = PLAN.engine;
  const g = window.gsap;
  g.registerPlugin(window.CustomEase, window.DrawSVGPlugin);

  /* the one callback the shim is allowed to run. the filter that enforces it is
     installed before gsap loads — see `pictogramRuntime` for why it has to be. */
  window.__picLoop = loop;

  const scenes = [];
  document.querySelectorAll('.pic-s').forEach(el => { scenes[+el.dataset.scene] = el; });
  const parts = [];
  document.querySelectorAll('.pic-p').forEach(el => { parts[+el.dataset.part] = el; });
  const inks = [], drops = [], lines = [], subs = [];
  for (let i = 0; i < parts.length; i++) {
    inks[i] = parts[i].querySelector('.pic-ink');
    /* the filter primitive lives in the svg's own defs, not inside the part
       that points at it, so it is found by the id the markup gave it rather
       than by looking down from the group. */
    const f = document.getElementById('psh-' + i);
    drops[i] = f ? f.querySelector('feDropShadow') : null;
    /* a knocked part has two copies of the same geometry and both of them have
       to draw together, or the white line under the mark arrives whole while
       the mark is still being written. one tween, both copies. */
    lines[i] = [...parts[i].querySelectorAll('.pic-line')];
    const sg = [...parts[i].querySelectorAll('.pic-sub')];
    subs[i] = sg.length ? sg : null;
  }
  const lids = [...document.querySelectorAll('.pic-blink')];
  /* what the last applied frame left each part at, so `safe()` can grow a
     measured rect by the shadow that frame is actually throwing rather than by
     the worst one any frame could. */
  const state = parts.map(() => ({ lift: 0, scale: 1 }));

  /* the channels, the eases and the timeline: the same builder node ran, on the
     same plan, with the line elements handed in so DrawSVGPlugin does the
     drawing rather than a dashoffset written by hand. */
  const ch = {
    paused: false,
    eases: window.__picEases(g, window.CustomEase),
    pad: { v: 0 },
    s: E.scenes.map(() => ({ o: 0, sc: 1, dx: 0, dy: 0 })),
    p: E.parts.map(() => ({ o: 0, sc: 1, dx: 0, dy: 0, rot: 0, dash: 1, lift: 0, sq: 0 })),
    q: E.parts.map(p => (p.subs ? Array.from({ length: p.subs }, () => ({ o: 1, sc: 1 })) : null)),
  };
  const master = window.__picBuild(g, E, ch, { lines: lines });
  /* pinned to the global timeline at zero, so `gsap.updateRoot(t)` puts this
     timeline at exactly t and the check that says so is checking the thing that
     draws. nothing else may advance it: lag smoothing off, ticker asleep. */
  master.startTime(0);
  /* ---------- nothing but us advances the root ----------
     `gsap.updateRoot` is registered as a ticker listener at load, so every tick
     hands the global timeline the ticker's own elapsed time. and `ticker.wake`
     dispatches a tick *synchronously* — which means `ticker.sleep()` is not a
     brake, it is a trigger: the next tween render calls `_wake()`, `_wake()`
     calls `_tick`, and `_tick` calls `updateRoot` with however many
     milliseconds the page thinks have gone by.

     the clock check caught exactly that, on the first capture where a tween had
     any work to do: wanted 0.166667, got 0.073. taking the listener off is the
     fix and it is a public one — after this the only thing that can move the
     global timeline is the `updateRoot` we call ourselves, once per capture. */
  g.ticker.remove(g.updateRoot);
  g.ticker.lagSmoothing(0);
  g.ticker.sleep();

  /* the origin sandwich, written out rather than left to transform-box: a
     translate in an svg is in user units, so this is exact at any scale and it
     does not depend on which box a browser thinks the reference is. the two
     scales are separate because squash and stretch are the whole point of
     having them, and they are read off one channel so they cannot disagree
     about volume. */
  function tf(ox, oy, dx, dy, rot, sx, sy) {
    let out = '';
    if (dx || dy) out += 'translate(' + dx.toFixed(3) + 'px,' + dy.toFixed(3) + 'px) ';
    if (rot || sx !== 1 || sy !== 1) {
      out += 'translate(' + ox.toFixed(3) + 'px,' + oy.toFixed(3) + 'px) ';
      if (rot) out += 'rotate(' + rot.toFixed(3) + 'deg) ';
      if (sx !== 1 || sy !== 1) out += 'scale(' + sx.toFixed(4) + ',' + sy.toFixed(4) + ') ';
      out += 'translate(' + (-ox).toFixed(3) + 'px,' + (-oy).toFixed(3) + 'px)';
    }
    return out.trim();
  }
  /* the same three numbers node computes, computed the same way. it is written
     out twice rather than shared because this half is serialised into the page
     and the other half runs in node, and a shadow the guard and the picture
     disagreed about would be the one bug neither of them could see. */
  function shadow(lift) {
    const l = lift < 0 ? 0 : lift > 1 ? 1 : lift;
    return {
      dy: SH.dy * (1 + l * (SH.rise - 1)),
      blur: SH.blur * (1 + l * (SH.spread - 1)),
      o: SH.o * (1 - l * SH.soften),
    };
  }

  window.__pic = {
    ready: false,
    pending: null,
    ticks: 0,
    last: null,
    /* the biggest disagreement between what gsap produced in the page and what
       the same builder produced in node, over the whole render. it is a fault
       if it is ever more than a rounding error. */
    drift: 0,
    driftAt: null,
    build() {
      /* nothing is measured any more — DrawSVGPlugin owns the dash and works
         the path length out itself. what is left is the assertion that a part
         which draws has something to draw, which used to be a side effect of
         measuring it and is worth keeping on its own. */
      const drawn = [];
      for (let i = 0; i < E.parts.length; i++) {
        if (!E.parts[i].draw) continue;
        if (!lines[i].length) throw new Error('part "' + E.parts[i].id + '" draws but has no pic-line');
        drawn.push(E.parts[i].id);
      }
      this.ready = true;
      return {
        scenes: scenes.length, parts: parts.length, lids: lids.length,
        drawn: drawn.length,
        shadows: drops.filter(Boolean).length,
        knocks: PLAN.parts.filter(p => p.knock).length,
        staggered: E.parts.filter(p => p.subs).length,
        subs: subs.filter(Boolean).reduce((a, s) => a + s.length, 0),
        gsap: g.version,
        eases: Object.keys(ch.eases).length,
        /* the plan's own length. the master timeline is padded an hour past it
           so a completed child is never dropped off the root, and that padding
           is an implementation detail rather than a number to report. */
        tlDuration: +E.seconds.toFixed(3),
      };
    },
    /* the clock check, run before a frame is written. it steps the shim the way
       the render will and fails unless gsap's own time is the frame index over
       the frame rate — exactly, not nearly. the ticks it costs are handed back
       afterwards so the render's own "one tick per frame" count still means
       what it says. */
    sync(fps, count, sub) {
      const N = sub || 1;
      const rows = [];
      let worst = 0;
      for (let i = 0; i < count; i++) {
        const want = i / (fps * N);
        this.set({ t: want, blink: 1 });
        window.__dmRaf((i + 1) * (1000 / (fps * N)));
        const got = g.globalTimeline.time();
        const local = master.time();
        const d = Math.max(Math.abs(got - want), Math.abs(local - want));
        if (d > worst) worst = d;
        if (i < 4 || i === count - 1) {
          rows.push({ i: i, want: +want.toFixed(6), root: +got.toFixed(6), master: +local.toFixed(6) });
        }
      }
      const ticks = this.ticks;
      this.ticks = 0;
      this.last = null;
      this.drift = 0;
      this.driftAt = null;
      g.updateRoot(0);
      return { fps: fps, sub: N, steps: count, ticks: ticks, worst: +worst.toExponential(3), rows: rows };
    },
    /* node leaves a frame here and the rAF loop picks it up. */
    set(f) { this.pending = f; },
    apply(f) {
      /* one step of the global timeline, and it is the only thing in the page
         that moves time. everything below reads what it produced. */
      g.updateRoot(f.t);

      let vis = 0, sum = 0, drift = 0;
      for (let i = 0; i < scenes.length; i++) {
        const c = ch.s[i], el = scenes[i];
        el.style.opacity = c.o.toFixed(4);
        el.style.transform = tf(PLAN.origin[0], PLAN.origin[1], c.dx, c.dy, 0, c.sc, c.sc);
        el.style.visibility = c.o < 0.004 ? 'hidden' : 'visible';
        if (c.o >= 0.004) vis++;
        sum += c.o + c.sc + c.dx + c.dy;
        if (f.s && f.s[i]) {
          const a = f.s[i];
          drift = Math.max(drift, Math.abs(a[0] - c.o), Math.abs(a[1] - c.sc),
            Math.abs(a[2] - c.dx), Math.abs(a[3] - c.dy));
        }
      }
      for (let i = 0; i < parts.length; i++) {
        const c = ch.p[i], el = parts[i], p = PLAN.parts[i];
        const sq = c.sq, sx = c.sc * (1 + sq), sy = c.sc / (1 + sq);
        /* a staggered part hands its opacity and its scale to its sub shapes,
           so the part group itself must not also carry them or the two would
           multiply. it keeps the position channels, because a corner that
           arrived somewhere else is a different shape rather than a late one. */
        const st = subs[i];
        /* the biggest scale actually drawn, which is what the shadow's reach in
           `safe()` has to be grown by. on an ordinary part that is the part's
           own; on a staggered one the part group carries no scale at all and
           the answer is whichever sub shape is currently largest. */
        let drawn = Math.max(Math.abs(sx), Math.abs(sy));
        el.style.opacity = st ? '1' : c.o.toFixed(4);
        el.style.transform = tf(p.o[0], p.o[1], c.dx, c.dy, c.rot, st ? 1 : sx, st ? 1 : sy);
        if (st) {
          let top = 0;
          drawn = 0;
          for (let k = 0; k < st.length; k++) {
            const s = ch.q[i][k], ssx = s.sc * (1 + sq), ssy = s.sc / (1 + sq);
            st[k].style.opacity = s.o.toFixed(4);
            st[k].style.transform = tf(p.o[0], p.o[1], 0, 0, 0, ssx, ssy);
            st[k].style.visibility = s.o < 0.004 ? 'hidden' : 'inherit';
            if (s.o > top) top = s.o;
            drawn = Math.max(drawn, Math.abs(ssx), Math.abs(ssy));
          }
          el.style.visibility = top < 0.004 ? 'hidden' : 'inherit';
        } else {
          /* inherit, never "visible": a part that said visible out loud would
             un-hide itself inside a scene group that is hidden. */
          el.style.visibility = c.o < 0.004 ? 'hidden' : 'inherit';
        }
        /* the shadow. three attributes, and the blur is one of them: the site
           forbids animating a filter radius because it re-rasterises every
           frame, and every frame in here is already being re-rasterised and
           written to disk. an offline renderer pays that in minutes rather than
           in dropped frames, and there is no other way to make a thing look
           like it is further off the page. */
        if (drops[i]) {
          const sh = shadow(c.lift);
          drops[i].setAttribute('dy', sh.dy.toFixed(3));
          drops[i].setAttribute('stdDeviation', sh.blur.toFixed(3));
          drops[i].setAttribute('flood-opacity', sh.o.toFixed(4));
        }
        state[i].lift = c.lift;
        state[i].scale = drawn;
        sum += c.o + c.sc + c.dx + c.dy + c.rot + c.dash + c.lift + c.sq;
        if (f.p && f.p[i]) {
          const a = f.p[i];
          drift = Math.max(drift, Math.abs(a[0] - c.o), Math.abs(a[1] - c.sc),
            Math.abs(a[2] - c.dx), Math.abs(a[3] - c.dy), Math.abs(a[4] - c.rot),
            Math.abs(a[5] - c.dash), Math.abs(a[6] - c.lift), Math.abs((a[7] || 0) - c.sq));
        }
      }
      for (const e of lids) e.style.transform = 'scaleY(' + f.blink.toFixed(4) + ')';
      if (drift > this.drift) { this.drift = drift; this.driftAt = f.t; }
      this.ticks++;
      this.last = {
        t: f.t, vis: vis, sum: +sum.toFixed(4), blink: +f.blink.toFixed(4), ticks: this.ticks,
        gsap: +g.globalTimeline.time().toFixed(6), drift: +this.drift.toExponential(3),
      };
      return this.last;
    },
    /* how close the nearest visible pictogram gets to each border, in css px,
       and how far down the zone it reaches. measured off drawn elements rather
       than off the box, because the box is where the layer was told to live and
       this is where it actually drew.

       two answers, not one. `ink` is the shape: it is what the border floor and
       the caption clearance were written against and it means the same thing it
       always did. `soft` is the shape plus the shadow it is throwing on this
       frame, grown from the same three numbers the frame was drawn with and
       scaled by the part's own scale, because the filter sits inside the
       transform. the shadow is the thing that visually touches the caption
       first, so the clip guards the soft number against the caption and the ink
       number against the border. */
    safe(vw, vh) {
      const K = PLAN.unit;
      const box = { left: 1e9, top: 1e9, right: 1e9, bottom: 1e9 };
      const soft = { left: 1e9, top: 1e9, right: 1e9, bottom: 1e9 };
      let low = -1e9, softLow = -1e9, worst = null, which = null, seen = 0;
      for (let i = 0; i < parts.length; i++) {
        const el = inks[i];
        if (!el) continue;
        const cs = getComputedStyle(parts[i]);
        if (cs.visibility === 'hidden') continue;
        let o = 1, node = parts[i];
        while (node && node !== document.body) {
          o *= parseFloat(getComputedStyle(node).opacity || '1');
          node = node.parentElement;
        }
        /* a staggered part carries opacity one rung lower down, so the walk
           above cannot see it. the brightest sub is the part's real opacity. */
        if (subs[i]) {
          let top = 0;
          for (const sg of subs[i]) top = Math.max(top, parseFloat(getComputedStyle(sg).opacity || '1'));
          o *= top;
        }
        if (o < 0.02) continue;
        const b = el.getBoundingClientRect();
        if (!b.width && !b.height) continue;
        seen++;
        const d = [b.left, b.top, vw - b.right, vh - b.bottom];
        if (Math.min.apply(null, d) < Math.min(box.left, box.top, box.right, box.bottom)) {
          worst = 'pic:' + PLAN.parts[i].id;
        }
        box.left = Math.min(box.left, d[0]); box.top = Math.min(box.top, d[1]);
        box.right = Math.min(box.right, d[2]); box.bottom = Math.min(box.bottom, d[3]);
        if (b.bottom > low) { low = b.bottom; which = PLAN.parts[i].id; }

        const sh = PLAN.parts[i].shadow ? shadow(state[i].lift) : { dy: 0, blur: 0 };
        const s = state[i].scale;
        const pad = (sh.blur * 3) * K * s;
        const drop = sh.dy * K * s;
        soft.left = Math.min(soft.left, b.left - pad);
        soft.top = Math.min(soft.top, b.top - pad + Math.min(0, drop));
        soft.right = Math.min(soft.right, vw - (b.right + pad));
        soft.bottom = Math.min(soft.bottom, vh - (b.bottom + pad + Math.max(0, drop)));
        if (b.bottom + pad + Math.max(0, drop) > softLow) softLow = b.bottom + pad + drop;
      }
      if (!seen) return null;
      return {
        left: box.left, top: box.top, right: box.right, bottom: box.bottom,
        worst: worst, low: +low.toFixed(1), lowest: which,
        softLeft: +soft.left.toFixed(1), softTop: +soft.top.toFixed(1),
        softRight: +soft.right.toFixed(1), softBottom: +soft.bottom.toFixed(1),
        softLow: +softLow.toFixed(1),
      };
    },
  };

  /* one rAF loop, re-registering at the top so the shim always has exactly one
     callback of ours queued and one flush is one frame. */
  function loop() {
    requestAnimationFrame(loop);
    const f = window.__pic.pending;
    if (f) { window.__pic.pending = null; window.__pic.apply(f); }
  }
  requestAnimationFrame(loop);
}

/* ---------- what goes in the page ----------
   gsap, the two plugins that earn their place, the shared ease table, the
   shared timeline builder and the page half, in one string, read off disk at
   render time.

   they are inlined rather than fetched. the site's own budget of exactly one
   external request is not this file's to spend, and a clip that depended on a
   cdn being up would be a clip that renders differently on a bad day.

   MorphSVGPlugin ships in the same package and is deliberately not here:
   nothing in the vocabulary morphs, and the closest thing to it — an x becoming
   a check — is two parts crossing over, which reads better than one shape
   turning inside out and costs no plugin. */
/* ---------- the queue belongs to us, and the order matters ----------
   gsap's ticker drives itself off requestAnimationFrame, and in here that is
   the recorder's shim: a queue drained once per capture. `ticker.sleep()`
   cancels what is pending, but creating a tween wakes it again, and a woken
   ticker puts its own callback in the same queue as ours. it then runs inside
   the same flush and advances the global timeline by however many milliseconds
   have gone by on the page's clock since gsap loaded.

   that is not theoretical. the clock check caught it on capture two of sixteen:
   wanted 0.166667, got 0.074 — one stray tick, one frame of the whole layer
   drawn at the wrong time, and nothing else in a render would have said so.

   so the shim only ever runs our own loop. **the filter has to be installed
   before gsap's script, not after it**, which is the whole reason this is a
   string spliced in ahead of the library rather than three lines inside
   `pictogramPage`: gsap reads `requestAnimationFrame` into a private of its own
   when it loads, so a wrapper installed afterwards is a wrapper gsap never
   sees. it was tried that way first and the check failed identically.

   gsap loses nothing it needs. `updateRoot` does not go through the ticker, and
   time in here is something node decides rather than something that elapses. */
const RAF_GUARD = `(function(){
  var raf = window.requestAnimationFrame;
  window.requestAnimationFrame = function (cb) {
    return cb === window.__picLoop ? raf(cb) : -1;
  };
})();`;

const GSAP_DIR = new URL('../node_modules/gsap/dist/', import.meta.url);
export function pictogramRuntime() {
  const read = f => fs.readFileSync(new URL(f, GSAP_DIR), 'utf8');
  return [
    RAF_GUARD,
    read('gsap.min.js'),
    read('CustomEase.min.js'),
    read('DrawSVGPlugin.min.js'),
    'window.__picEases = ' + houseEases.toString() + ';',
    'window.__picBuild = ' + buildTimeline.toString() + ';',
    pictogramPage.toString(),
    'pictogramPage();',
  ].join('\n');
}

/* what the page half needs and nothing else: no svg strings, because the markup
   is already in the document, the shadow's own constants, because the page
   recomputes them per frame from the lift channel, and the engine plan, because
   the page builds the same timeline node did. `unit` is how many css px one
   viewBox unit is worth, which is what turns a shadow measured in units into a
   rect measured in pixels. */
export function pictogramPagePlan(plan, box) {
  return {
    origin: plan.origin,
    unit: box.w / plan.viewBox[0],
    shadow: SHADOW,
    engine: enginePlan(plan),
    parts: plan.parts.map(p => ({
      id: p.id, o: p.o, draw: p.draw, knock: p.knock, shadow: p.shadow, stagger: p.stagger,
    })),
  };
}

/* ---------- a printable summary ----------
   the plan as a card for the terminal, so a cut can be read before three
   minutes are spent on frames. */
export function describeScenes(plan) {
  const out = [];
  const drawn = plan.parts.filter(p => p.draw).length;
  const shad = plan.parts.filter(p => p.shadow).length;
  const knock = plan.parts.filter(p => p.knock).length;
  const stag = plan.parts.filter(p => p.stagger).length;
  out.push('  ' + plan.scenes.length + ' scenes, ' + plan.parts.length + ' parts, '
    + drawn + ' of them line drawn, ' + shad + ' casting a shadow, ' + knock
    + ' knocked, ' + stag + ' staggered, ' + plan.seconds.toFixed(2) + 's of scene');
  for (const sc of plan.scenes) {
    out.push('    ' + sc.in.toFixed(2).padStart(5) + '..' + sc.out.toFixed(2).padStart(5)
      + '  ' + sc.id + (sc.exit ? ' (' + sc.exit.kind + ')' : ' (holds)'));
    for (const pi of sc.parts) {
      const p = plan.parts[pi];
      out.push('        ' + p.steps.map(s => s.t.toFixed(2)).join('/').padStart(11)
        + '  ' + p.id.padEnd(13) + p.steps.map(s => s.kind
          + (s.squash ? '+squash' : '')).join(' then ')
        + '  [' + p.ink + (p.knock ? ' knocked' : '') + (p.shadow ? '' : ' flat')
        + (p.stagger ? ' stagger ' + Math.round(p.stagger * 60) + 'f' : '') + ']');
    }
  }
  for (const note of plan.notes) out.push('    note: ' + note);
  return out.join('\n');
}

/* ---------- the engine's own checks ----------
   `node lib/pictograms.mjs test`. no browser, no frames, about a second. what
   it proves is the part of this file a render cannot: that the curves are the
   shape they claim to be, that the squash preserves volume, that a stagger
   actually lags, and that seeking the timeline is the same animation whichever
   direction time is walked in. */
function selfTest() {
  const g = gsapNode;
  const H = houseEases(g, CustomEase);
  const fail = [];
  const ok = (name, cond, detail) => {
    console.log('  ' + (cond ? 'ok  ' : 'FAIL') + '  ' + name + (detail ? '  ' + detail : ''));
    if (!cond) fail.push(name);
  };

  /* the curves. */
  const pop = g.parseEase(H.pop);
  let peak = 0, dip = 1;
  for (let i = 0; i <= 1000; i++) { const v = pop(i / 1000); peak = Math.max(peak, v); if (i > 400) dip = Math.min(dip, v); }
  ok('pop overshoots between 8 and 12 per cent', peak >= 1.08 && peak <= 1.12, '+' + ((peak - 1) * 100).toFixed(1) + '%');
  ok('pop settles under the mark before resting', dip < 1 && dip > 0.96, (dip * 100).toFixed(1) + '%');
  ok('pop lands exactly on one', Math.abs(pop(1) - 1) < 1e-6, pop(1).toFixed(9));
  ok('contact is measured off the curve', POP_CONTACT > 0.2 && POP_CONTACT < 0.5, 'at ' + POP_CONTACT);
  for (const k of ['drift', 'glide', 'heavy']) {
    const e = g.parseEase(H[k]);
    let mono = true, last = -1;
    for (let i = 0; i <= 400; i++) { const v = e(i / 400); if (v < last - 1e-9) mono = false; last = v; }
    ok(k + ' is monotonic and lands on one', mono && Math.abs(e(1) - 1) < 1e-6);
  }
  ok('land arrives at impact', Math.abs(H.land(IMPACT) - 1) < 1e-9, 'IMPACT ' + IMPACT);
  ok('land bounces back past the mark', H.land(0.80) < 1 && H.land(1) === 1, H.land(0.80).toFixed(4));
  ok('every legacy ease name still resolves', EASE_NAMES.every(k => H[k] != null), EASE_NAMES.join(' '));

  /* a plan that exercises every step kind, the squash, and a stagger. */
  const plan = planScenes([
    {
      id: 'a', in: 0.10, out: 3.40, exit: 'springOut',
      parts: [
        { id: 'body', shape: 'sheet', at: { x: 20, y: 6, w: 40, h: 40 }, steps: { kind: 'pop', t: 0.40 } },
        { id: 'writing', shape: 'rule', ink: 'cut', at: { x1: 26, x2: 54, y: 18 }, steps: { kind: 'draw', t: 1.00, for: 0.40 } },
        { id: 'drop', shape: 'coin', at: { cx: 40, cy: 36, r: 6 }, steps: { kind: 'move', t: 1.50, for: 0.58, from: [0, -26], ease: 'land' } },
        { id: 'who', shape: 'human', stagger: 3, at: { cx: 80, cy: 16, r: 6, sw: 16, sh: 10 }, steps: { kind: 'pop', t: 2.20 } },
        { id: 'gone', shape: 'check', ink: 'accent', at: { cx: 80, cy: 40, s: 12 }, steps: [{ kind: 'flip', t: 2.30, for: 0.36 }, { kind: 'fade', t: 2.80, for: 0.26, to: 0.2 }] },
      ],
    },
  ]);
  ok('a scene table written for the old engine plans unchanged', plan.parts.length === 5);
  ok('the staggered part found its sub shapes', plan.parts[3].subs === 2, plan.parts[3].subs + ' pieces');

  /* the squash: volume preserving, inside the ceiling, and zero at rest. */
  let worstSq = 0, worstVol = 0;
  for (let f = 0; f < Math.round(60 * plan.seconds); f++) {
    const fr = sceneFrame(plan, f / 60);
    for (const v of fr.p) {
      worstSq = Math.max(worstSq, Math.abs(v[7]));
      worstVol = Math.max(worstVol, Math.abs((v[1] * (1 + v[7])) * (v[1] / (1 + v[7])) - v[1] * v[1]));
    }
  }
  ok('the squash never exceeds eight per cent', worstSq <= 0.0801, (worstSq * 100).toFixed(2) + '%');
  ok('the squash preserves volume exactly', worstVol < 1e-9, worstVol.toExponential(2));
  const rest = sceneFrame(plan, 3.30).p;
  ok('nothing is deformed at rest', rest.every(v => Math.abs(v[7]) < 1e-6));

  /* the stagger: sub one is behind sub zero by the lag it asked for, and both
     get there. */
  const at = 2.20 + 3 / 60 + 0.02;
  const st = sceneFrame(plan, at).q[3];
  ok('a staggered sub lags the body', st[0][1] > st[1][1] + 0.02,
    'body ' + st[0][1].toFixed(3) + ' vs detail ' + st[1][1].toFixed(3));
  const done = sceneFrame(plan, 2.20 + 0.52 + 3 / 60 + 0.02).q[3];
  ok('and catches up', Math.abs(done[0][1] - 1) < 1e-3 && Math.abs(done[1][1] - 1) < 1e-3);

  /* seeking is the animation, whichever way time is walked. */
  const fwd = [];
  for (let f = 0; f < 60; f++) fwd.push(sceneFrame(plan, 1.40 + f / 60).p.map(v => v.slice()));
  let same = true;
  for (let f = 59; f >= 0; f--) {
    const back = sceneFrame(plan, 1.40 + f / 60).p;
    for (let i = 0; i < back.length; i++) {
      for (let k = 0; k < back[i].length; k++) if (Math.abs(back[i][k] - fwd[f][i][k]) > 1e-9) same = false;
    }
  }
  ok('scrubbing backwards gives the same frame as scrubbing forwards', same);

  /* the guards still have something to say, and the numbers are inside the
     limits post6 ships with. */
  const m = sceneMotion(plan, 60, plan.seconds);
  const L = { partM: 4.5, partS: 0.14, partD: 0.12, partO: 0.20, partR: 10, partL: 0.22 };
  for (const k of Object.keys(L)) {
    ok('worst ' + k + ' is inside the clip limit', m.worst[k].d <= L[k],
      m.worst[k].d.toFixed(4) + ' on ' + m.worst[k].who + ' against ' + L[k]);
  }

  /* the runtime the page is handed is real javascript with the pieces in it. */
  const rt = pictogramRuntime();
  ok('the page runtime carries gsap, both plugins and the shared builder',
    /gsap/i.test(rt) && /CustomEase/.test(rt) && /DrawSVG/.test(rt)
    && rt.includes('window.__picBuild') && rt.includes('window.__picEases'),
    (rt.length / 1024).toFixed(0) + ' KB inlined');

  console.log('');
  if (fail.length) { console.error('FAILED: ' + fail.join(', ')); process.exit(1); }
  console.log('all ' + 'engine checks passed.');
}

if (process.argv[1] && /pictograms\.mjs$/.test(process.argv[1]) && process.argv[2] === 'test') {
  console.log('the boring tek — the pictogram motion engine, gsap ' + gsapCore.version);
  selfTest();
}
