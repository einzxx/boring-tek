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
   about five times too fast. every moving value in here is eased in javascript,
   in node, and written to the element per frame. `sceneFrame(plan, t)` is the
   whole animation and it is a pure function of time.

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
   and never a third.

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
     draw   stroke dashoffset line drawing, along the path
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
   shadow's own lift channel included, so a snap is caught in a second rather
   than after twenty two seconds of jpegs. the clip script turns those numbers
   into guards.
*/

/* ---------- easing ----------
   the same solver captions.mjs and every post script carries, so a pictogram
   moves on the curves the site moves on rather than on a lookalike. */
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
      const e = fx(t) - x, d = dfx(t);
      if (Math.abs(e) < 1e-6) return fy(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0, hi = 1; t = x;
    for (let i = 0; i < 30; i++) {
      const e = fx(t) - x;
      if (Math.abs(e) < 1e-6) break;
      if (e > 0) hi = t; else lo = t;
      t = (lo + hi) / 2;
    }
    return fy(t);
  };
}

/* ---------- the springs ----------
   a cubic bezier can overshoot once and that is all it can do, which is why
   everything eased on one reads light: it arrives, it passes the mark, it eases
   back, and it is finished. a thing with mass does not do that. it passes the
   mark, comes back past it by a little, and only then settles.

   so the spring in here is a real damped oscillator rather than a curve shaped
   to look like one:

       f(x) = 1 - e^(-damp x) cos(freq pi x)

   the first trough of the cosine is the overshoot and its size is e^(-damp/freq)
   exactly, so the two knobs mean something: `freq` decides how many times it
   crosses the mark inside the step and `damp` decides how far past it goes the
   first time. the result is divided by its own value at x=1 so it lands on 1 to
   the last decimal — a spring that finished at 0.997 would be a 0.003 snap on
   the frame after its step ended, which is small, real, and exactly the kind of
   thing the movement guards are here to catch.

   the cost of a genuine settle is a steeper start: two crossings inside one step
   means the first move is faster than a bezier's. that is paid for in duration
   rather than in a raised guard — the pop default below is half again as long
   as it was, which is also what makes it read as weight. */
function damped(freq, damp) {
  const raw = x => 1 - Math.exp(-damp * x) * Math.cos(freq * Math.PI * x);
  const end = raw(1);
  return x => (x <= 0 ? 0 : x >= 1 ? 1 : raw(x) / end);
}

/* ---------- the fall ----------
   gravity to the floor, then an impact. the first part is x squared, which is
   what falling actually is and is the difference between a coin dropping and a
   coin being slid down. at `hit` it arrives, and after that it is a small
   damped sine about the landing point: up first, because a thing that lands
   bounces before it settles, then a shallow squash past the mark, then nothing.

   the sine is zero at both ends of the bounce, so the value at x=1 is exactly 1
   with no normalising needed, and the bounce's own slope is a third of the
   fall's, so the moment of impact is the fastest thing in the step. that is
   what makes it read as an impact rather than as a stop. */
function landing(hit, amp, damp) {
  return x => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    if (x < hit) { const q = x / hit; return q * q; }
    const k = (x - hit) / (1 - hit);
    return 1 - amp * Math.exp(-damp * k) * Math.sin(2 * Math.PI * k);
  };
}

/* the house curves. SPRING is the site's own --spring and it is kept for
   anything that wants the old single overshoot. WEIGHT is the damped spring
   above and it is what every pop and every scene entrance runs on now: about 9%
   past the mark, then under a percent back under it, then still. EASE_IO
   carries every opacity ramp in the file, deliberately: the site's --ease
   leaves zero with a slope of 6.25, so a fade on it steps a third of the way in
   one frame at 60fps, which is a flash rather than a fade. FALL is the old fall
   and LAND is the one with an impact in it. */
const SPRING = bezier(.34, 1.4, .64, 1);
const WEIGHT = damped(2.2, 5.3);
const EASE_IO = bezier(.45, 0, .55, 1);
const FALL = bezier(.5, 0, .28, 1);
const LAND = landing(0.72, 0.045, 4.6);
const EASES = { io: EASE_IO, spring: SPRING, weight: WEIGHT, fall: FALL, land: LAND };
/* where in a `land` or a `fall` the thing actually touches down. the shadow
   tightens over exactly this window rather than over the whole step, so a coin
   that is still in the air still has a big soft shadow and one that has landed
   does not. */
export const IMPACT = 0.72;
const lerp = (a, b, p) => a + (b - a) * p;
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))));
const n = v => Math.round(v * 1000) / 1000;

/* ---------- the step defaults ----------
   the durations are floors as much as they are defaults. the opacity ones in
   particular: a fade shorter than about a fifth of a second cannot be told from
   a cut at 60fps, and `planScenes` says so in a number rather than in an
   opinion.

   `pop` is 0.52s where it used to be 0.34. that is the damped spring being paid
   for honestly: the same overshoot in a third less time would be a snap, and
   arrive, overshoot, settle is what mass actually costs. */
export const STEP_DEFAULTS = {
  pop: { for: 0.52, fade: 0.26, from: 0.62 },
  draw: { for: 0.50, fade: 0.22 },
  move: { for: 0.44, fade: 0.24, ease: 'io', from: [0, 0], fadeIn: true },
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
   which reads better anyway. */
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
      let prev = null;
      const steps = (Array.isArray(p.steps) ? p.steps : [p.steps]).map(raw => {
        const d = STEP_DEFAULTS[raw.kind];
        if (!d) throw new Error('"' + p.id + '" has a step of kind "' + raw.kind + '"');
        const s = { ...d, ...raw };
        if (!(s.t >= 0) || !(s.for > 0)) throw new Error('"' + p.id + '" has a step with no time');
        if (s.kind === 'move' && s.ease && !EASES[s.ease]) {
          throw new Error('"' + p.id + '" moves on "' + s.ease + '", which is one of '
            + Object.keys(EASES).join(', '));
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
        if (s.kind === 'move' && s.lift == null) s.lift = s.ease === 'fall' || s.ease === 'land';
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

/* ---------- the animation ----------
   a pure function of time. every number a frame needs comes out of here and
   nothing in the page decides anything.

   the shape of the return matches captions.mjs's on purpose:
     s[i] = [opacity, scale, dx, dy]                        for each scene group
     p[i] = [opacity, scale, dx, dy, rot, dash, lift]       for each part
   translations and the origin are in viewBox units, rot in degrees, dash is the
   fraction of the path that is drawn, and lift is how far off the page the part
   is — 1 in the air, 0 landed. lift drives the shadow and nothing else.

   every part holds a value at every instant of the clip, including long before
   and long after its own steps. that is the whole reason the movement guards
   can run unconditionally: nothing in the layer ever teleports while invisible
   and reappears somewhere else, and nothing changes the shadow it is throwing
   while nobody is looking. */
export function sceneFrame(plan, t, env = {}) {
  const blink = env.blink == null ? 1 : env.blink;

  const s = plan.scenes.map(sc => {
    const E = sc.enter, X = sc.exit;
    if (t < sc.in) return [0, E.scale, E.dx, E.dy];
    if (t < sc.settled) {
      const q = span(t, sc.in, sc.in + E.for);
      return [EASE_IO(span(t, sc.in, sc.in + E.fade)),
        lerp(E.scale, 1, WEIGHT(q)), lerp(E.dx, 0, EASE_IO(q)), lerp(E.dy, 0, EASE_IO(q))];
    }
    if (!X || t < sc.leaving) return [1, 1, 0, 0];
    if (t >= sc.out) return [0, X.scale, X.dx, X.dy];
    const q = span(t, sc.leaving, sc.out);
    return [1 - EASE_IO(span(t, sc.leaving, sc.leaving + X.fade)),
      lerp(1, X.scale, EASE_IO(q)), lerp(0, X.dx, EASE_IO(q)), lerp(0, X.dy, EASE_IO(q))];
  });

  const p = plan.parts.map(part => {
    let o = 0, sc = 1, dx = 0, dy = 0, rot = 0, lift = 0, dash = part.draw ? 0 : 1;
    /* has an earlier step taken responsibility for opacity? it decides whether a
       later step may write one before its own start time. see the fade branch. */
    let ownsO = false;
    for (const st of part.steps) {
      if (st.kind === 'pop') {
        /* a pop is a thing landing, so it is in the air for the whole of it and
           on the page at the end. before its own time it waits at full lift,
           which is the value it has on the frame it starts, so the channel is
           continuous across a step boundary that nobody can see. */
        if (t < st.t) { o = 0; sc = st.from; lift = 1; }
        else {
          o = EASE_IO(span(t, st.t, st.t + st.fade));
          sc = lerp(st.from, 1, WEIGHT(span(t, st.t, st.t + st.for)));
          lift = 1 - EASE_IO(span(t, st.t, st.t + st.for));
        }
      } else if (st.kind === 'draw') {
        if (t < st.t) { o = 0; dash = 0; }
        else {
          o = EASE_IO(span(t, st.t, st.t + st.fade));
          dash = EASE_IO(span(t, st.t, st.t + st.for));
        }
      } else if (st.kind === 'move') {
        const e = EASES[st.ease] || EASE_IO;
        /* the shadow tightens over the fall rather than over the whole step, so
           it is fully landed at the moment of impact and stays landed through
           the bounce. a shadow still shrinking while the coin is rocking would
           read as the coin sinking into the page. */
        const hold = st.for * (st.ease === 'land' || st.ease === 'fall' ? IMPACT : 1);
        if (t < st.t) {
          dx = st.from[0]; dy = st.from[1];
          if (st.fadeIn) o = 0;
          if (st.lift) lift = 1;
        } else {
          const q = e(span(t, st.t, st.t + st.for));
          dx = lerp(st.from[0], 0, q); dy = lerp(st.from[1], 0, q);
          if (st.fadeIn) o = EASE_IO(span(t, st.t, st.t + st.fade));
          if (st.lift) lift = 1 - EASE_IO(span(t, st.t, st.t + hold));
        }
      } else if (st.kind === 'flip') {
        const leaving = st.dir === 'out';
        if (t < st.t) {
          /* on the way in the part is not there yet and waits at the far side of
             its own turn. on the way out it is already drawn and whatever the
             step before it left behind is exactly right, so nothing is written
             here — writing anything would be the snap. */
          if (!leaving) { o = 0; sc = st.from; rot = st.rot; }
        } else {
          const q = EASE_IO(span(t, st.t, st.t + st.for));
          const f = EASE_IO(span(t, st.t, st.t + st.fade));
          if (leaving) { o = 1 - f; sc = lerp(1, st.from, q); rot = lerp(0, st.rot, q); }
          else { o = f; sc = lerp(st.from, 1, q); rot = lerp(st.rot, 0, q); }
        }
      } else {
        /* a fade goes from a level to a level. it used to be a switch — `to` was
           read as 0 or not-0 and the ramp was always the whole way — which is
           fine for appearing and disappearing and cannot say "half there".

           the other half of this is what it does *before* its own time, and that
           was the real bug. it used to write an opacity in that region too,
           which meant a part that popped in and faded later had its pop's fade
           quietly overwritten by the later step: at 1.1s a pop was a tenth of the
           way in, and the fade step three seconds away was already saying 1. now
           a fade only claims the region before itself when nothing else has, so
           the step in front of it keeps what it drew. `flip` with dir out has
           always worked this way and for the same reason; this brings the two
           into line. */
        const to = st.to == null ? 1 : st.to;
        const from = st.from == null ? (to >= 1 ? 0 : 1) : st.from;
        if (t < st.t) { if (!ownsO) o = from; }
        else o = lerp(from, to, EASE_IO(span(t, st.t, st.t + st.for)));
      }
      /* every kind above writes an opacity except a flip on its way out and a
         move that was told not to fade, and those two deliberately inherit. */
      if (st.kind !== 'flip' && st.kind !== 'move') ownsO = true;
      else if (st.kind === 'flip' && st.dir !== 'out') ownsO = true;
      else if (st.kind === 'move' && st.fadeIn) ownsO = true;
    }
    return [o, sc, dx, dy, rot, dash, lift];
  });

  return { t: +t.toFixed(4), s, p, blink };
}

/* ---------- the preflight ----------
   walks every frame of the clip through `sceneFrame` and reports the biggest
   one frame step in every channel, plus who made it. it costs a fraction of a
   second and it is the difference between finding a snap now and finding it in
   a twenty two second render.

   lift is measured next to the rest of them, because a shadow that trebles in
   size in one frame is exactly as wrong as a shape that does, and the damped
   spring made lift the fastest channel in the file rather than the slowest.

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
        bump('partS', Math.abs(b[1] - a[1]), t, who);
        bump('partM', Math.hypot(b[2] - a[2], b[3] - a[3]), t, who);
        bump('partR', Math.abs(b[4] - a[4]), t, who);
        bump('partD', Math.abs(b[5] - a[5]), t, who);
        bump('partL', Math.abs(b[6] - a[6]), t, who);
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
   guard measures, so a measurement is never a measurement of blur. */
export function pictogramMarkup(plan) {
  const defs = plan.parts.filter(p => p.shadow).map(p => {
    const r = p.region;
    return `<filter id="psh-${p.i}" filterUnits="userSpaceOnUse"`
      + ` x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}"`
      + ` color-interpolation-filters="sRGB">`
      + `<feDropShadow dx="0" dy="${n(SHADOW.dy)}" stdDeviation="${n(SHADOW.blur)}"`
      + ` flood-color="var(--fg)" flood-opacity="${n(SHADOW.o)}"/></filter>`;
  }).join('');

  const body = plan.scenes.map(sc => '<g class="pic-s" data-scene="' + sc.i + '">'
    + sc.parts.map(pi => {
      const p = plan.parts[pi];
      const knock = p.knock
        ? '<g class="pic-knock" stroke-width="' + n(p.w + KNOCK) + '">' + p.svg + '</g>'
        : '';
      return '<g class="pic-p" data-part="' + p.i + '" data-ink="' + p.ink
        + '" stroke-width="' + n(p.w) + '">'
        + '<g class="pic-body"' + (p.shadow ? ' filter="url(#psh-' + p.i + ')"' : '') + '>'
        + knock + '<g class="pic-ink">' + p.svg + '</g>'
        + '</g></g>';
    }).join('')
    + '</g>').join('');

  return '<div class="pic"><svg viewBox="0 0 ' + plan.viewBox[0] + ' ' + plan.viewBox[1]
    + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'
    + '<defs>' + defs + '</defs>' + body + '</svg></div>';
}

/* ---------- the page half ----------
   serialised into the scene with .toString(), the way captionPage is. it
   measures the path lengths once and then does as it is told: `draw` writes
   numbers, it never computes one.

   the one thing it does on its own is run: `set()` leaves a frame for the rAF
   loop and the loop applies it, so the layer is genuinely on the shim's clock
   rather than being written straight into the dom from node. the recorder
   flushes exactly one rAF per captured frame, which makes that one tick and one
   frame, always. */
export function pictogramPage() {
  const PLAN = window.__PIC_PLAN;
  const SH = PLAN.shadow;
  const scenes = [];
  document.querySelectorAll('.pic-s').forEach(el => { scenes[+el.dataset.scene] = el; });
  const parts = [];
  document.querySelectorAll('.pic-p').forEach(el => { parts[+el.dataset.part] = el; });
  const inks = [], drops = [], lines = [];
  for (let i = 0; i < parts.length; i++) {
    inks[i] = parts[i].querySelector('.pic-ink');
    /* the filter primitive lives in the svg's own defs, not inside the part
       that points at it, so it is found by the id the markup gave it rather
       than by looking down from the group. */
    const f = document.getElementById('psh-' + i);
    drops[i] = f ? f.querySelector('feDropShadow') : null;
    lines[i] = [...parts[i].querySelectorAll('.pic-line')];
  }
  const lids = [...document.querySelectorAll('.pic-blink')];
  const lens = [];
  /* what the last applied frame left each part at, so `safe()` can grow a
     measured rect by the shadow that frame is actually throwing rather than by
     the worst one any frame could. */
  const state = parts.map(() => ({ lift: 0, scale: 1 }));

  /* the origin sandwich, written out rather than left to transform-box: a
     translate in an svg is in user units, so this is exact at any scale and it
     does not depend on which box a browser thinks the reference is. */
  function tf(ox, oy, dx, dy, rot, s) {
    let out = '';
    if (dx || dy) out += 'translate(' + dx.toFixed(3) + 'px,' + dy.toFixed(3) + 'px) ';
    if (rot || s !== 1) {
      out += 'translate(' + ox.toFixed(3) + 'px,' + oy.toFixed(3) + 'px) ';
      if (rot) out += 'rotate(' + rot.toFixed(3) + 'deg) ';
      if (s !== 1) out += 'scale(' + s.toFixed(4) + ') ';
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
    build() {
      for (let i = 0; i < PLAN.parts.length; i++) {
        if (!PLAN.parts[i].draw) { lens[i] = 0; continue; }
        if (!lines[i].length) throw new Error('part "' + PLAN.parts[i].id + '" draws but has no pic-line');
        /* a knocked part has two copies of the same geometry and both of them
           have to draw together, or the white line under the mark arrives whole
           while the mark is still being written. one measurement, both copies. */
        const L = lines[i][lines[i].length - 1].getTotalLength();
        lens[i] = L;
        for (const g of lines[i]) {
          g.style.strokeDasharray = L.toFixed(3);
          g.style.strokeDashoffset = L.toFixed(3);
        }
      }
      this.ready = true;
      return {
        scenes: scenes.length, parts: parts.length, lids: lids.length,
        drawn: PLAN.parts.filter(p => p.draw).length,
        shadows: drops.filter(Boolean).length,
        knocks: PLAN.parts.filter(p => p.knock).length,
        lengths: lens.map(v => +v.toFixed(2)),
      };
    },
    /* node leaves a frame here and the rAF loop picks it up. */
    set(f) { this.pending = f; },
    apply(f) {
      let vis = 0, sum = 0;
      for (let i = 0; i < scenes.length; i++) {
        const a = f.s[i], el = scenes[i];
        el.style.opacity = a[0].toFixed(4);
        el.style.transform = tf(PLAN.origin[0], PLAN.origin[1], a[2], a[3], 0, a[1]);
        el.style.visibility = a[0] < 0.004 ? 'hidden' : 'visible';
        if (a[0] >= 0.004) vis++;
        sum += a[0] + a[1] + a[2] + a[3];
      }
      for (let i = 0; i < parts.length; i++) {
        const a = f.p[i], el = parts[i], p = PLAN.parts[i];
        el.style.opacity = a[0].toFixed(4);
        el.style.transform = tf(p.o[0], p.o[1], a[2], a[3], a[4], a[1]);
        /* inherit, never "visible": a part that said visible out loud would
           un-hide itself inside a scene group that is hidden. */
        el.style.visibility = a[0] < 0.004 ? 'hidden' : 'inherit';
        if (p.draw) {
          const off = (lens[i] * (1 - a[5])).toFixed(3);
          for (const g of lines[i]) g.style.strokeDashoffset = off;
        }
        /* the shadow. three attributes, and the blur is one of them: the site
           forbids animating a filter radius because it re-rasterises every
           frame, and every frame in here is already being re-rasterised and
           written to disk. an offline renderer pays that in minutes rather than
           in dropped frames, and there is no other way to make a thing look
           like it is further off the page. */
        if (drops[i]) {
          const sh = shadow(a[6]);
          drops[i].setAttribute('dy', sh.dy.toFixed(3));
          drops[i].setAttribute('stdDeviation', sh.blur.toFixed(3));
          drops[i].setAttribute('flood-opacity', sh.o.toFixed(4));
        }
        state[i].lift = a[6];
        state[i].scale = a[1];
        sum += a[0] + a[1] + a[2] + a[3] + a[4] + a[5] + a[6];
      }
      for (const e of lids) e.style.transform = 'scaleY(' + f.blink.toFixed(4) + ')';
      this.ticks++;
      this.last = { t: f.t, vis: vis, sum: +sum.toFixed(4), blink: +f.blink.toFixed(4), ticks: this.ticks };
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
     callback queued and one flush is one frame. */
  function loop() {
    requestAnimationFrame(loop);
    const f = window.__pic.pending;
    if (f) { window.__pic.pending = null; window.__pic.apply(f); }
  }
  requestAnimationFrame(loop);
}

/* what the page half needs and nothing else: no svg strings, because the markup
   is already in the document, and the shadow's own constants, because the page
   recomputes them per frame from the lift channel. `unit` is how many css px
   one viewBox unit is worth, which is what turns a shadow measured in units
   into a rect measured in pixels. */
export function pictogramPagePlan(plan, box) {
  return {
    origin: plan.origin,
    unit: box.w / plan.viewBox[0],
    shadow: SHADOW,
    parts: plan.parts.map(p => ({
      id: p.id, o: p.o, draw: p.draw, knock: p.knock, shadow: p.shadow,
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
  out.push('  ' + plan.scenes.length + ' scenes, ' + plan.parts.length + ' parts, '
    + drawn + ' of them line drawn, ' + shad + ' casting a shadow, ' + knock
    + ' knocked, ' + plan.seconds.toFixed(2) + 's of scene');
  for (const sc of plan.scenes) {
    out.push('    ' + sc.in.toFixed(2).padStart(5) + '..' + sc.out.toFixed(2).padStart(5)
      + '  ' + sc.id + (sc.exit ? ' (' + sc.exit.kind + ')' : ' (holds)'));
    for (const pi of sc.parts) {
      const p = plan.parts[pi];
      out.push('        ' + p.steps.map(s => s.t.toFixed(2)).join('/').padStart(11)
        + '  ' + p.id.padEnd(13) + p.steps.map(s => s.kind).join(' then ')
        + '  [' + p.ink + (p.knock ? ' knocked' : '') + (p.shadow ? '' : ' flat') + ']');
    }
  }
  for (const note of plan.notes) out.push('    note: ' + note);
  return out.join('\n');
}
