/* the boring tek — the mascot reactor. a small live face that sits in a corner,
   reacts in character, and sometimes says two words.

   what this is. a rig, not a sprite sheet. the face is drawn once from the
   geometry table in skills/page-builder/SKILL.md and every part of it — the
   card, each eye, each lid, each brow, the shadow, the glow, the bubble — is a
   channel on one gsap timeline. a state is a named piece of that timeline with
   an entrance, a hold that has its own idle, and an exit. `mascotFrame(plan, t)`
   is the whole animation and it is a function of time and of nothing else.

   two things use it. our own renders import the module and drive it beside the
   captions and the pictograms. `mascot-export.mjs` renders the same states as
   standalone 1080x1920 clips with real alpha, for dropping over someone else's
   footage in canva.

   ---------- what is different from lib/pictograms.mjs ----------

   the motion core is the same one: the same four house curves plus `land`, the
   same volume preserving `sq` channel, the same `lift` driving the same shadow
   model, the same "no css transition, no css animation, on anything that has to
   hit a mark" rule, because one captured frame carries five or six BeginFrames
   and a css animation would resolve about five times too fast.

   **gsap does not run in the page here, and that is deliberate.** pictograms
   serialises its timeline builder into the browser because DrawSVGPlugin has to
   own the dash — the page has to hold the real animation for the one channel
   node cannot compute. nothing in the mascot is line drawn, so there is nothing
   the page has to own. node computes every number and the page writes it to an
   element. one engine, one reader, and the whole clock-sync apparatus — the
   root timeline pinning, the rAF filter, the `sync()` probe, the per frame
   parity check — is not needed because there is nothing to be out of sync with.

   ---------- the rig ----------

     card      the head. a rounded rect on the 64 grid, radius 0.5 by default,
               which is the circle the site ships. it tilts, turns, squashes,
               stretches, translates, scales, and throws its own shadow.
     eyes      two slabs, each with its own x, y, scale x and scale y, so they
               look, squint, widen, close and squash independently.
     lids      a card coloured slab, sitting above the eye, that comes down over
               it. a blink is the lid arriving, never the eye shrinking. fast
               shut, slower open, and no two alike in a row.
     brows     short strokes above the eyes, opacity 0 by default. surprise and
               unimpressed are the only two states that use them.
     turn      the flat three quarter turn, minus one to plus one. see below.

   **the eyes lead and the head follows, and that is the detail that reads as
   alive.** every pose tween is built twice: once on the lead channel at its own
   time, once on the lag channel LAG seconds later. the card is drawn with the
   lag channel, so the body is three frames behind the rig. the eyes take LEAD
   of the difference back as an offset, so on a snap they arrive first and on a
   settle the offset falls to zero on its own. it is overlapping action written
   as arithmetic rather than as a second animation that can drift.

   **anticipation before every big move.** a state's entrance pulls the opposite
   way for a few frames on the calm curve, then arrives on `btk.pop`, whose 10%
   overshoot and dip under the mark is the settle. nothing arrives with a hard
   stop and nothing anywhere is linear.

   **idle life is always on and is a separate layer.** slow drift on two
   incommensurable periods, breathing under two per cent, micro saccades on a
   seeded schedule, and the blinks. pose channels rest at zero between states;
   idle channels never rest. the drawn value is rest plus pose plus idle, which
   is what lets a state be written as if it were the only thing happening and
   still never freeze during its own hold.

   ---------- the states ----------

   neutral, curious, surprised, thinking, agreeing, unimpressed, delighted, and
   the two the turn brought with it, turn-away and snap-back. nine, each a
   different silhouette at a glance with the sound off:

     neutral      level, centred, breathing. the resting face.
     curious      head tilts and leans into the tilt, eyes up toward it, one eye
                  a lot wider than the other.
     surprised    pulls back and down, snaps up with a stretch, eyes go nearly
                  round, brows appear high and angled and stay.
     thinking     head rotates up and away, gaze off camera, both eyes lidded
                  and unevenly, a slow scan across during the hold.
     agreeing     two nods, weight on the way down, contact squash at the
                  bottom of each, warm half blink on the beat.
     unimpressed  head drops and drifts away from you, lids at half, side eye,
                  brows in low and turned out. the only state that mostly does
                  not move.
     delighted    two hops with real lift, eyes squash into arcs, a small turn
                  on the way up.
     turn-away    turns off to the side and holds there, still alive.
     snap-back    whips back to camera, overshoots past centre, settles.

   ---------- the themes ----------

   `light` is ink on the site's paper: --face on --bg, a soft grounded shadow,
   no glow at all, because a glow on white is a smudge and the page spec says
   so. `dark` is the terminal look: the face is the light one, the shadow is off
   because a shadow on black is nothing, and the head carries two layers of soft
   blur behind it. that is post10's crt ghost with the numbers walked down —
   quiet, and around the head only.

   one call switches it, `__mas.theme('dark')` in the page or `theme` on the
   plan, and both variants go through the same guards.

   ---------- the bubble ----------

   index.html's own thought bubble: a rounded pill in the page colour with a
   hairline outline, and dots climbing off the head toward it. two dots rather
   than the site's three, and the whole cluster pulled in tight, both for phone
   size. it pops in dot, dot, pill and leaves in the same order backwards, never
   leaves the platform safe area and never enters the caption band.

   ---------- who checks what ----------

   `planMascot` refuses a plan that cannot be drawn: an unknown state, marks
   that overlap, a state with no room for its own entrance and exit, a bubble
   over the word ceiling, a turn outside its range, a head outside the phone
   size window. `mascotMotion` walks every frame before a render and reports the
   biggest one frame step in every channel, plus per state the entry length, the
   overshoot, the settle, and the proof that no two blinks are the same blink.

     node lib/mascot.mjs test    the engine's own checks, no browser
*/

import gsapCore from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { houseEases, SQUASH } from './pictograms.mjs';

/* ---------- node's gsap ----------
   the same setup lib/pictograms.mjs does, and for the same two reasons: this
   half never plays an animation, it seeks a paused timeline and reads numbers
   off it, so a ticker is a liability; and node has no requestAnimationFrame, so
   gsap's ticker falls back to setTimeout and every script that touched the
   module would sit there forever instead of exiting.

   importing pictograms.mjs has already done all of this to the same module
   instance. it is repeated rather than assumed because a file that depends on
   another file's side effect is a file that breaks the day the import is
   dropped, and every call in here is idempotent. */
const g = (() => {
  const G = gsapCore;
  G.registerPlugin(CustomEase);
  G.ticker.remove(G.updateRoot);
  G.ticker.lagSmoothing(0);
  G.ticker.sleep();
  G.ticker.wake = () => {};
  return G;
})();

const n = v => Math.round(v * 1000) / 1000;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/* ---------- the curves ----------
   the house set, plus two the lid needs, and it is worth saying where those two
   come from because a new curve is normally a decision rather than a detail.

   index.html's blink is `1-(1-LID)*p*p` shut and `LID+(1-LID)*(1-(1-q)*(1-q))`
   open — accelerating in, decelerating out. neither is any of the four house
   paths: `glide` is symmetric, `heavy` is slow at both ends, `pop` overshoots
   and a lid that overshot would open past the top of the eye. so these are not
   inventions, they are the site's own lid written as two beziers, and they are
   named after what they do rather than after a curve family.

   `mascotEases` takes its gsap, its CustomEase and the house function through
   the door for the same reason `houseEases` does: nothing in here may close
   over module scope. */
export function mascotEases(g, Custom, house) {
  const H = house(g, Custom);
  const PATHS = {
    /* shut. x squared, near enough: slow to leave, fastest at the moment it
       lands. a lid that closes evenly reads as a shutter. */
    'btk.shut': 'M0,0 C0.55,0 0.78,0.62 1,1',
    /* open. the mirror of it, and longer in the state table, which is what
       makes a blink read as a blink rather than as a flicker. */
    'btk.open': 'M0,0 C0.22,0.38 0.45,1 1,1',
  };
  for (const id in PATHS) {
    let has = false;
    try { has = !!Custom.get(id); } catch (e) { has = false; }
    if (!has) Custom.create(id, PATHS[id]);
  }
  return { ...H, shut: 'btk.shut', open: 'btk.open' };
}

/* ---------- the geometry ----------
   skills/page-builder/SKILL.md's table, in its own units, and nothing in here
   is drawn by eye. the plate is 60 of the 64 grid, which is the 94% the spec
   asks for; the eyes are 13 by 4.4 with rx exactly half the height, 21 units
   apart, 6.5 units below the centre.

   `radius` is the one number the site does not have. at 0.5 the plate's rx is
   half its side and a rounded rect is a circle, which is the mascot as shipped.
   the rig carries the number so a card is possible without redrawing anything;
   the default draws the face. */
export const GRID = 64;
export const HEAD = {
  plate: { x: 2, y: 2, s: 60 },
  radius: 0.5,
  eye: { w: 13, h: 4.4, sep: 21, cy: 38.5 },
  /* the brows. demo only: the page spec's mascot is a circle and two slabs and
     nothing else, and this file never reaches index.html. they are 11 by 1.9,
     centred over each eye, 7.9 units above it, and they are invisible until a
     state asks for them. */
  brow: { w: 11, h: 1.9, cy: 30.6 },
};
export const EYE_CX = [
  HEAD.plate.x + HEAD.plate.s / 2 - HEAD.eye.sep / 2,
  HEAD.plate.x + HEAD.plate.s / 2 + HEAD.eye.sep / 2,
];

/* ---------- the head, as a distance ----------
   how far a point in grid units is outside the head's own silhouette: negative
   inside, zero on the edge, positive out. it is the exact rounded rect distance,
   so at the shipped radius of 0.5 it is a circle and at any smaller radius it is
   the card, and the same function answers for both.

   every facial feature is measured against this, and the markup clips to the
   same geometry, so the two cannot disagree about where the head ends. */
export function headSD(x, y, plan) {
  const S = HEAD.plate.s, R = S / 2;
  const cx = HEAD.plate.x + R, cy = HEAD.plate.y + R;
  const r = S * (plan && plan.radius != null ? plan.radius : HEAD.radius);
  const qx = Math.abs(x - cx) - R + r, qy = Math.abs(y - cy) - R + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

/* ---------- the frame, the safe area and the phone ----------
   540x960 css at device scale 2, which is 1080x1920 and is what every clip in
   demo/ is judged at. the safe area is in device px, the way the platforms
   quote it, and everything that reads it converts once. */
export const STAGE = { w: 540, h: 960, dsf: 2 };
export const SAFE = { top: 180, bottom: 220, left: 140, right: 140 };
const SAFE_CSS = {
  top: SAFE.top / STAGE.dsf, bottom: SAFE.bottom / STAGE.dsf,
  left: SAFE.left / STAGE.dsf, right: SAFE.right / STAGE.dsf,
};

/* the head, in device px across the plate, judged on rendered frames rather
   than worked out from a ratio. 128 css px of svg box puts the plate at 240,
   which sits in the middle of the window with room to move either way. */
export const HEAD_PX = { min: 220, max: 280 };
export const SIZE = 128;

/* ---------- the turn ----------
   a flat three quarter turn, cheated the way an after effects character rig
   cheats one: nothing here is 3d, and the whole illusion is five flat moves
   that happen together on one number.

   `turn` runs from -1 to +1. zero is straight on, +1 is a full turn to the
   mascot's right, -1 to his left, and **every value between them renders** —
   there is no pose table and no second drawing, only arithmetic on the number,
   so 0.37 is as real a turn as 1.

   what the number does, all at once:

     the card squeezes horizontally. a head turned away is narrower on the
     screen. it is the one deformation in this file that is *not* volume
     preserving, and that is deliberate: a turn is a projection, not a squash,
     and a head that got taller as it turned would read as rubber. so the
     squeeze multiplies the x scale and leaves y alone.

     both eyes travel the way the head turns, and the trailing one travels
     further. that is the piece that does the work. an eye pair that merely slid
     across a circle reads as two stickers on a plate; an eye pair whose *gap
     closes* as it slides reads as a face turning, because that is what
     perspective does to two features on a curved form. the centres close from
     21 units to 16.5 at a full turn.

     **which eye is which is worth being exact about, because it was wrong
     once.** turn the head so the nose points to screen right. the cheek that
     comes toward the camera is the one on screen *left*, and the cheek that
     rotates away is on screen *right*. so the eye that ends up nearest the
     right hand silhouette is on the **far** side of the form, and the eye
     trailing behind it, nearer the middle, is the **near** one.

     that gives the two halves their opposite assignments, and they are opposite
     on purpose:

       the **leading** eye — the one the turn carries toward the silhouette — is
       the far one. it **foreshortens**, and it travels the *smaller* distance,
       because it is wrapping around the side of the head rather than sliding
       across the front of it.

       the **trailing** eye is the near one. it stays **full width** and travels
       the *larger* distance, crossing the centre line as the broad side of the
       face swings into view.

     the first build had the scale on the wrong one of those two: the trailing
     eye was being squeezed and the leading eye left full, which reads as a face
     whose near cheek is collapsing. the shifts were right; only the scales were
     swapped. a rendered sweep is what said so, and the self test now asserts the
     narrow eye is the leading one at both ends.

     the head tilts a little into the turn, and the shadow slides with it,
     because the mass moved.

   **the eyes read the lead channel and the card reads the lag channel**, so the
   gaze arrives before the head does on every turn without a line of code that
   is about turning specifically. it is the same overlapping action the rest of
   the rig already had.

   `margin` is the guard the composition needs: a state may move the eyes on its
   own — `curious` puts them 2.1 units across — and a state's own offset plus a
   full turn could otherwise walk an eye off the side of the face. every eye is
   clamped to leave this much of the card outside it, measured against the
   plate's own width at that eye's height. */
export const TURN = {
  /* the resting turn, and the one config value the brief asks for. he sits in
     the bottom left corner and should look into the frame rather than out of
     it, so the default is a third of a turn to his right. placed bottom right,
     `planMascot` flips the sign for the same reason, and an explicit `bias`
     option overrides both. */
  bias: 0.35,
  squeeze: 0.075,   /* the card loses this much width at a full turn */
  shift: 9.5,       /* grid units the near eye travels */
  wrap: 4.5,        /* the far eye travels this much further, closing the gap */
  farX: 0.42,       /* and it foreshortens by this much across */
  farY: 0.10,       /* and a little down */
  tilt: 3.0,        /* degrees, into the turn */
  shadowShift: 4.5, /* css px the shadow slides with the mass */
  browShare: 0.85,  /* the brows go with their eyes, a shade less far */
  margin: 1.2,      /* grid units of card that must stay outside any eye */
  away: 0.85,       /* where turn-away parks it, leaving room to wind up past */
};

/* ---------- secondary motion ----------
   the card is three frames behind the rig. two reads as a rendering error and
   five reads as the head coming loose. the eyes take back a bit under half the
   difference, capped, so on a snap they arrive first and on a settle the offset
   goes to zero without anything having to switch it off. */
export const LAG = 3 / 60;
/* the cap is a guard and the fraction is tuned to stay under it: on the fastest
   frame in the table the rig and the card are about ten css px apart, which is
   five grid units, and 0.40 of that is 2.0 — inside the cap with room. a lead
   that sat on its own clamp would have a flat spot in it exactly where the
   motion is fastest, which is the one place a flat spot shows. */
export const LEAD = 0.40;
export const LEAD_CAP = 2.2;          /* grid units, about a sixth of an eye */

/* ---------- idle ----------
   always on, under everything, and none of it is linear. the two drift periods
   are deliberately not multiples of each other, so the path never closes and
   the face never looks like it is on a loop. breathing is 1.6%, under the 2%
   ceiling the brief sets. */
export const IDLE = {
  driftX: { amp: 1.7, period: 7.3 },
  driftY: { amp: 1.2, period: 5.1 },
  driftRot: { amp: 0.55, period: 9.1 },
  breathe: { amp: 0.016, period: 3.7 },
  saccade: { every: [1.15, 2.6], amp: 0.95, for: [0.085, 0.135] },
  blink: { every: [2.0, 3.3], close: [0.085, 0.115], hold: [0.03, 0.06], open: [0.13, 0.19] },
};
export const BREATHE_MAX = 0.02;

/* the ceiling the brief sets and the one the pictograms already hold to: 8% on
   a landing, 6% on a pop, and it is the same `sq` channel, so a squash cannot
   get the volume wrong because there is no second number to disagree with. */
export const SQ_MAX = SQUASH.land;

/* ---------- the shadow ----------
   the pictogram model, in css px against the head's own size rather than in
   viewBox units, because the mascot is positioned in the frame rather than
   drawn inside a block. `lift` is the airborne channel exactly as it is there:
   1 in the air, 0 landed, and a landed shadow is small, dark and tight.

   it is off in dark. a soft black ellipse on a #06070a page is nothing, and
   pretending otherwise would only cost a filter per frame. */
export const SHADOW = {
  w: 0.72, h: 0.13,          /* of the head size, at rest */
  dy: 0.50,                  /* below the head centre, of the head size */
  o: 0.20, blur: 10,
  rise: 1.55, spread: 2.3, soften: 0.55,
};
export function shadowAt(lift) {
  const l = clamp(lift, 0, 1);
  return {
    sc: 1 + l * (SHADOW.rise - 1),
    blur: SHADOW.blur * (1 + l * (SHADOW.spread - 1)),
    o: SHADOW.o * (1 - l * SHADOW.soften),
  };
}

/* ---------- the glow ----------
   post10's three layer phosphor, walked down. there it was the whole picture
   and it ran at .30 and .20 through 13 and 34px of blur; here the mascot is a
   corner overlay on somebody else's footage and the same numbers would read as
   neon. these are quiet, and they are around the head only: the layers are
   blurred copies of the plate, so nothing glows that is not the head. */
export const GLOW = { mid: { blur: 11, o: 0.20 }, wide: { blur: 30, o: 0.13 } };

/* ---------- the thought bubble ----------
   two or three words. the guard throws above four, which is the ceiling; two or
   three is the copy rule and `describeMascot` says so when a bubble reaches the
   ceiling rather than the rule.

   the type is the caption face at 26 css px. Space Grotesk's cap height is
   about .70em, so that is 18.2 css and 36.4 device px of cap, comfortably over
   the floor. the floor is a real number rather than a feeling: under about 32
   device px a caption stops being legible on a phone held at arm's length, and
   this is the one piece of copy in the layer.

   the look is index.html's, and the section in `mascotCss` says what changed
   and why. */
export const BUBBLE = {
  maxWords: 4, sayWords: 3,
  size: 26, weight: 500, capRatio: 0.70, minCap: 32,
  /* generous, because the pill is an outline rather than a block now and an
     outline with tight padding reads as a box round a word rather than as
     something the word is sitting in. */
  padX: 22, padY: 12,
  /* the site's pill is border-radius 999px and so is this: at a 26px line that
     is a capsule, which is what makes it a thought rather than a card. */
  radius: 999,
  /* the outline. the site draws 1px on a page viewed at arm's length, which at
     1080 wide is two device px — the first thing h.264 eats at crf 17, and an
     outline the encoder eats is a filled block with extra steps.

     it was written as 1.5 to get three device px and the render came back with
     two, because **chrome floors border-width to a whole css pixel**: 1.5
     resolves to 1, and at device scale 2 that is the site number again. the
     export guard is what caught it, off the computed style rather than off what
     was typed. so it is 2 css px and 4 device, which is 1.7% of the head width
     and still thin against a 240px face. */
  stroke: 2,

  /* ---------- the dots ----------
     the site climbs three off the head, 5, 7 and 10px with 0, 8 and 18px of
     lift. this is the same idea with the smallest dropped, which is what the
     brief asked for and is also what the extra size buys: at 1080 wide a 5px
     dot is ten device px of outline and it reads as a speck of dirt.

     `gap` is the whole tightening. the site sits the cluster 12px off the
     mascot's own box, and the box is four px wider than the head, so on the
     page the first dot is sixteen from the ink. five puts it ten device px off
     him, which at phone size reads as attached rather than as nearby. */
  dots: [{ d: 8, lift: 6 }, { d: 12, lift: 14 }],
  gap: 5, dotGap: 5, pillLift: 22,

  /* the sequence. the site runs 0, 70, 140, 210ms and this keeps the 70, which
     is the interval that reads as one gesture with three beats rather than as
     three things arriving. the exit is the same list backwards. */
  step: 0.07, dotFor: 0.26, pillFor: 0.34,
  outStep: 0.06, outFor: 0.18,
  in: 0.48, hold: 0.90, out: 0.30,

  /* ---------- and the same gesture, quick ----------
     one bubble is a thought. a run of them — a greeting in three languages, a
     count, a list — is a different beat, and at the timings above three of them
     need six and a quarter seconds, which is a fifth of a thirty second clip
     spent on one line. so a mark may carry a **list** of bubbles instead of one,
     and a list runs on these numbers: the same dot, dot, pill in a shorter
     window, floored at a life long enough to read one word.

     it is opt in and nothing reaches it unless a mark asks. a mark carrying a
     single `bubble` string is built from the numbers above, unchanged, which is
     why every clip and every self test written before this one plans and renders
     exactly as it did. */
  quick: {
    step: 0.05, dotFor: 0.20, pillFor: 0.24,
    outStep: 0.05, outFor: 0.14,
    in: 0.30, hold: 0.30, out: 0.20,
  },
};

/* the sounds, and there are only two. a bubble arriving is a `pop`, which is
   the caption card's own sound and is the right one because it is the same
   event: something light being set down. `ding` is reserved for an agreement
   beat and appears nowhere else, so it keeps meaning yes. */
export const SFX = { bubble: 'pop', agree: 'ding' };

/* ---------- the state table ----------
   each state is an entrance, a hold with its own idle, and an exit, written
   against the builder below. `mark` is what the preflight measures the state
   on: the one channel that carries the state's read, and the value it is
   supposed to arrive at. that is per state on purpose — a nod's read is in y
   and a tilt's is in rotation, and one shared metric would flatter both.

   the durations are seconds. every one of them is a real number rather than a
   round one because they were tuned against rendered frames.

   the shape of every entrance is the same three beats and it is the whole
   reason these read as animation rather than as css: pull the opposite way for
   two to four frames, arrive on the pop curve, let the curve's own dip be the
   settle. nothing here calls for an ease by anything but a house name. */
export const STATES = {
  neutral: {
    label: 'level, centred, breathing',
    entry: 0.46, hold: 1.10, exit: 0.30,
    /* the only state whose mark is not zero at rest, because the only thing
       neutral does is arrive at rest — so the span it is measured over is its
       own entrance rather than the distance from rest, which would be nothing. */
    mark: { chan: 'sc', from: 0.972, to: 1.0 },
    build(B) {
      /* the resting face, and it still has to arrive: a state that wrote
         nothing would hold whatever the state before it left behind. it settles
         onto rest from a hair under it, which reads as a breath being let out
         rather than as an entrance. */
      B.head({ sc: 0.972, y: 1.6 }, { sc: 1, y: 0 }, { for: 0.44, ease: 'pop', anti: 0 });
      /* the eyes come down off a hair of widening, which is the only thing that
         separates arriving at neutral from having been there all along. */
      B.eyes({ sy: 1.14 }, { sy: 1 }, { for: 0.34, ease: 'pop' });
    },
  },

  curious: {
    label: 'tilts in, looks up into the tilt',
    entry: 0.60, hold: 1.25, exit: 0.34,
    mark: { chan: 'rot', to: 9.5 },
    build(B) {
      /* the anticipation is a real counter turn, not a scale dip: the head goes
         three degrees the wrong way over four frames and then comes across. */
      B.head({ rot: 0, x: 0 }, { rot: 9.5, x: 4.2 }, { for: 0.52, ease: 'pop', anti: 0.32, antiFor: 4 / 60 });
      /* eyes up and into the tilt, and they get there before the head does,
         which the lag arithmetic gives for free — this is only the pose. */
      B.eyes({ x: 0, y: 0 }, { x: 2.1, y: -1.5 }, { for: 0.30, at: 0.02, ease: 'drift' });
      /* one eye wider than the other, and the gap between them is the state.
         it was 1.55 against 1.22 and a rendered frame at phone size said that
         is not a difference, it is a rounding error: two slabs at 6.8 and 5.4
         units read as two slabs. 1.8 against 1.1 is one eye open and one not. */
      B.eye(1, { sy: 1 }, { sy: 1.80 }, { for: 0.30, at: 0.04, ease: 'pop' });
      B.eye(0, { sy: 1 }, { sy: 1.10 }, { for: 0.30, at: 0.07, ease: 'pop' });
      /* the hold has its own beat: a small second look further across, and back.
         this is what stops a hold reading as a freeze frame. */
      B.eyes({ x: 2.1 }, { x: 3.4 }, { for: 0.52, at: 0.72, ease: 'glide' });
      B.head({ rot: 9.5 }, { rot: 8.0 }, { for: 0.60, at: 0.90, ease: 'glide' });
    },
  },

  surprised: {
    label: 'pulls back, snaps up, eyes round, brows high',
    entry: 0.54, hold: 1.05, exit: 0.32,
    mark: { chan: 'y', to: -9.5 },
    build(B) {
      /* the biggest anticipation in the table, because this is the biggest
         move: down and back for four frames, then up past the mark. */
      B.head({ y: 0, sc: 1 }, { y: -9.5, sc: 1.045 }, { for: 0.46, ease: 'pop', anti: 0.42, antiFor: 4 / 60 });
      /* a stretch on the way up, volume preserving on the one channel, and it
         peaks with the arrival rather than after it. */
      B.squash(-0.055, { at: 0.20, for: 0.30 });
      /* the eyes are the state. nearly round: 4.4 units of slab taken to 2.6
         times its own height is 11.4 against 13 of width. */
      B.eyes({ sy: 1, sx: 1 }, { sy: 2.6, sx: 1.06 }, { for: 0.22, at: 0.10, ease: 'pop' });
      B.eyes({ y: 0 }, { y: -0.9 }, { for: 0.26, at: 0.10, ease: 'drift' });
      /* brows snap in high and stay there. they arrive one frame apart, which
         is enough to stop them reading as one shape, and they angle out, which
         is what stops them reading as a second pair of eyes. */
      B.brow(0, { o: 0, y: 2.4, rot: 0 }, { o: 1, y: -1.9, rot: -7 }, { for: 0.20, at: 0.12, ease: 'pop' });
      B.brow(1, { o: 0, y: 2.4, rot: 0 }, { o: 1, y: -1.9, rot: 7 }, { for: 0.20, at: 0.14, ease: 'pop' });
      /* and it does not hold perfectly still: the head sinks a hair over the
         hold, which is the air going out of it. */
      B.head({ y: -9.5 }, { y: -7.4 }, { for: 0.75, at: 0.70, ease: 'glide' });
    },
  },

  thinking: {
    label: 'turns up and away, gaze off camera, one eye half lidded',
    entry: 0.62, hold: 1.45, exit: 0.36,
    mark: { chan: 'rot', to: -9.5 },
    build(B) {
      B.head({ rot: 0, y: 0, x: 0 }, { rot: -9.5, y: -4.2, x: -3.4 },
        { for: 0.56, ease: 'pop', anti: 0.26, antiFor: 3 / 60 });
      /* up and away, and further than any other state takes them, because the
         thing being looked at is not in the frame. */
      B.eyes({ x: 0, y: 0 }, { x: -2.9, y: -2.0 }, { for: 0.40, at: 0.02, ease: 'drift' });
      /* the squint, and it is the whole reason this state is not `curious`
         mirrored. a review of the twenty second strip put those two side by
         side as the closest pair on the sheet: both are a tilted head with
         slanted eyes, and at phone size a tilt one way against a tilt the other
         way is one read, not two. so `curious` keeps both eyes fully open and
         asymmetric, and this one closes them: over half on the near side, a
         third on the far one. a squint on one side only is what separates
         thinking from tired. */
      B.lid(0, 0, 0.56, { for: 0.30, at: 0.08 });
      B.lid(1, 0, 0.30, { for: 0.30, at: 0.10 });
      /* the hold is a slow scan across and back, on the calm curve, which is the
         one moment in the table where nothing snaps. */
      B.eyes({ x: -2.9 }, { x: 1.4 }, { for: 0.72, at: 0.66, ease: 'glide' });
      B.eyes({ x: 1.4 }, { x: -1.8 }, { for: 0.66, at: 1.40, ease: 'glide' });
      B.head({ rot: -9.5 }, { rot: -6.8 }, { for: 1.10, at: 0.80, ease: 'glide' });
    },
  },

  agreeing: {
    label: 'two nods, weight on the way down, squash on contact',
    entry: 0.48, hold: 1.24, exit: 0.30,
    mark: { chan: 'y', to: 8.6 },
    /* the one state that earns a ding, and it lands on the bottom of the first
       nod rather than on the entrance, because that is the beat that means yes. */
    ding: 0.47,
    build(B) {
      /* up first. a nod that starts by going down is a head falling off. */
      B.head({ y: 0 }, { y: 8.6 }, { for: 0.40, ease: 'pop', anti: 0.55, antiFor: 4 / 60 });
      B.squash(0.062, { at: 0.40, for: 0.26 });
      /* the second nod is smaller and quicker, which is what makes two nods read
         as one gesture rather than as a loop. */
      B.head({ y: 8.6 }, { y: 2.2 }, { for: 0.22, at: 0.62, ease: 'glide' });
      B.head({ y: 2.2 }, { y: 6.6 }, { for: 0.26, at: 0.84, ease: 'pop' });
      B.squash(0.044, { at: 1.10, for: 0.22 });
      B.head({ y: 6.6 }, { y: 3.0 }, { for: 0.46, at: 1.16, ease: 'glide' });
      /* a warm half blink on each contact. the eyes closing on the beat is what
         makes a nod agreeable rather than mechanical. */
      B.lids(0.55, { for: 0.10, at: 0.34 });
      B.lids(0, { for: 0.18, at: 0.50 });
      B.lids(0.42, { for: 0.09, at: 1.04 });
      B.lids(0, { for: 0.16, at: 1.18 });
      B.eyes({ sy: 1 }, { sy: 0.86 }, { for: 0.24, at: 0.34, ease: 'glide' });
      B.eyes({ sy: 0.86 }, { sy: 1 }, { for: 0.30, at: 1.30, ease: 'glide' });
    },
  },

  unimpressed: {
    label: 'sinks, drifts away, half lids, side eye, brows low',
    entry: 0.64, hold: 1.35, exit: 0.34,
    mark: { chan: 'lid', to: 0.54 },
    build(B) {
      /* the only entrance in the table with almost no anticipation, because the
         whole read is that it cannot be bothered. it sinks and leans away from
         you on the heavy curve instead of arriving on the pop one. */
      B.head({ y: 0, x: 0, rot: 0 }, { y: 3.4, x: -3.6, rot: -2.6 },
        { for: 0.58, ease: 'heavy', anti: 0.08, antiFor: 3 / 60 });
      /* lids at just over half, and they are the mark: this is the one state
         measured on the lid rather than on the head. */
      B.lids(0.54, { for: 0.34, at: 0.06 });
      /* side eye. both across, away from the lean, which is the look. */
      B.eyes({ x: 0, y: 0 }, { x: 2.6, y: 0.4 }, { for: 0.36, at: 0.08, ease: 'drift' });
      /* brows in low and turned out. they come in slower than surprise's and
         stop dead, because a brow that overshot here would read as a frown.
         the turn is the half of it that matters: dropped and level, a brow at
         phone size is just a fourth slab on the face, and the outward angle is
         what makes the pair read as bored rather than as extra anatomy. */
      B.brow(0, { o: 0, y: -1.0, rot: 0 }, { o: 1, y: 1.4, rot: 8 }, { for: 0.30, at: 0.10, ease: 'glide' });
      B.brow(1, { o: 0, y: -1.0, rot: 0 }, { o: 1, y: 1.4, rot: -8 }, { for: 0.30, at: 0.12, ease: 'glide' });
      /* one slow blink over the hold, longer than any idle one, and that is all
         that happens for a second and a half. */
      B.lids(0.96, { for: 0.13, at: 0.86, ease: 'shut' });
      B.lids(0.54, { for: 0.26, at: 1.05, ease: 'open' });
      B.head({ x: -3.6 }, { x: -5.0 }, { for: 0.90, at: 0.70, ease: 'glide' });
    },
  },

  delighted: {
    label: 'two hops with lift, eyes squash into arcs',
    entry: 0.50, hold: 1.30, exit: 0.30,
    mark: { chan: 'y', to: -12.5 },
    build(B) {
      /* a crouch, then up. the crouch is a squash and the rise is a stretch, so
         the one channel does both and cannot get the volume wrong. */
      B.squash(0.070, { at: 0.10, for: 0.18 });
      B.head({ y: 0 }, { y: -12.5 }, { for: 0.42, ease: 'pop', anti: 0.30, antiFor: 4 / 60 });
      /* the only state that leaves the ground, so the only one whose shadow
         grows and softens. */
      B.lift(1, { for: 0.24, at: 0.06 });
      B.lift(0, { for: 0.22, at: 0.40 });
      B.squash(0.058, { at: 0.62, for: 0.20 });
      /* the second hop, smaller and a beat later. */
      B.head({ y: -12.5 }, { y: -1.5 }, { for: 0.22, at: 0.40, ease: 'glide' });
      B.head({ y: -1.5 }, { y: -8.4 }, { for: 0.30, at: 0.62, ease: 'pop' });
      B.lift(1, { for: 0.20, at: 0.64 });
      B.lift(0, { for: 0.20, at: 0.92 });
      B.head({ y: -8.4 }, { y: -2.0 }, { for: 0.34, at: 0.92, ease: 'glide' });
      /* a small turn on the way up and back on the way down, which is what makes
         a hop read as a happy one rather than as a bounce. */
      B.head({ rot: 0 }, { rot: -6.2 }, { for: 0.34, at: 0.08, ease: 'pop' });
      B.head({ rot: -6.2 }, { rot: 3.4 }, { for: 0.44, at: 0.58, ease: 'glide' });
      B.head({ rot: 3.4 }, { rot: 0 }, { for: 0.50, at: 1.10, ease: 'glide' });
      /* the eyes squash into arcs: much shorter and wider, which on a rounded
         slab is a smile with no mouth in it. at 0.52 they were still slabs on a
         rendered frame and delighted was the one state that did not announce
         itself; 0.40 by 1.28 turns a 4.4 unit pill into a 1.8 unit line 16.6
         units long, which is a different shape rather than a smaller one. */
      B.eyes({ sy: 1, sx: 1 }, { sy: 0.40, sx: 1.28 }, { for: 0.22, at: 0.16, ease: 'pop' });
      B.eyes({ y: 0 }, { y: 0.9 }, { for: 0.22, at: 0.16, ease: 'drift' });
    },
  },

  /* ---------- the two the turn brought with it ----------
     everything above works at any turn and none of it mentions the channel.
     these two are the states whose subject *is* the turn. */

  'turn-away': {
    label: 'turns off to the side and holds there, still alive',
    entry: 0.64, hold: 1.55, exit: 0.34,
    authorsTurn: true,
    mark: { chan: 'turn', to: cfg => TURN.away * (cfg.bias < 0 ? -1 : 1) },
    build(B) {
      /* which way is away. he rests turned into the frame, so away is further
         in the direction he is already facing rather than across himself. */
      const s = B.bias < 0 ? -1 : 1;
      /* the wind up is a turn back toward camera for three frames. it is the
         same anticipation every other entrance uses and it is the reason a turn
         reads as a decision rather than as a slider being dragged. */
      B.turn(TURN.away * s, { for: 0.56, ease: 'pop', anti: 0.22, antiFor: 3 / 60 });
      /* the head leans after the gaze. it is not the turn — the turn is doing
         the turning — it is the body going with it, and it starts four
         hundredths later so the two are not one move. */
      B.head({ x: 0, rot: 0 }, { x: 2.6 * s, rot: 0 },
        { for: 0.58, at: 0.04, ease: 'glide' });
      /* and the eyes overshoot the turn's own offset on the way out, then come
         back a little. that is what makes it a look rather than a rotation. */
      B.eyes({ x: 0 }, { x: 1.15 * s }, { for: 0.36, at: 0.02, ease: 'drift' });
      B.eyes({ x: 1.15 * s }, { x: 0.25 * s }, { for: 0.72, at: 0.82, ease: 'glide' });
      /* the hold is not a freeze: the drift, the saccades and the blinks are the
         idle layer and they never stopped, and on top of them the head settles
         back a hair over a second and a half. */
      B.head({ x: 2.6 * s }, { x: 1.9 * s }, { for: 0.90, at: 0.90, ease: 'glide' });
    },
  },

  'snap-back': {
    label: 'whips back to camera, overshoots past centre, settles',
    entry: 0.50, hold: 1.15, exit: 0.30,
    authorsTurn: true,
    /* straight on, and nothing else in the table arrives at zero, which is what
       makes this the reaction beat: everything before it was turned. */
    mark: { chan: 'turn', to: 0 },
    build(B) {
      /* the anticipation is a turn *further away*, which is why `turn-away`
         parks at 0.85 rather than at 1: 0.17 of a 0.85 move is 0.145, and the
         wind up lands at 0.995 with the channel's own ceiling untouched. the
         pop curve then carries it through zero and about a tenth past, so he
         turns a shade beyond camera and comes back — which is what a head does
         when something catches it. */
      B.turn(0, { for: 0.44, ease: 'pop', anti: 0.17, antiFor: 3 / 60 });
      /* the body arrives after the gaze and squares up. */
      B.head({ x: B.pose.x, rot: 0 }, { x: 0, rot: 0 },
        { for: 0.46, at: 0.05, ease: 'pop' });
      /* eyes wide on the beat, because this is the state that means "what". not
         as wide as `surprised` — that one has the brows as well and this one
         must not become it. */
      B.eyes({ sy: 1, sx: 1 }, { sy: 1.75, sx: 1.03 }, { for: 0.20, at: 0.10, ease: 'pop' });
      /* one small contact squash as the head squares up, which is the weight of
         the turn stopping. */
      B.squash(0.048, { at: 0.30, for: 0.24 });
      /* and it does not hold still: the eyes come down off the wide over the
         second half, which is the beat settling. */
      B.eyes({ sy: 1.75 }, { sy: 1.18 }, { for: 0.70, at: 0.72, ease: 'glide' });
    },
  },
};
export const STATE_NAMES = Object.keys(STATES);
export const THEMES = ['light', 'dark'];

/* ---------- the seeded rhythms ----------
   the idle is generated once from a fixed seed rather than written out, so it
   is uneven the way a real one is and identical on every run. this is
   record.mjs's generator, and it is here rather than imported because that one
   lives inside a clip script. */
function prng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const pick = (r, [a, b]) => a + r() * (b - a);

/* the blinks. every one of them carries its own close, hold, open and a small
   left-right offset, and the schedule is walked afterwards to prove that no two
   in a row are the same blink. "no two identical" is a property of the plan, so
   it is asserted on the plan rather than hoped for from the randomness. */
function blinkPlan(seconds, seed) {
  const r = prng(seed);
  const B = IDLE.blink;
  const out = [];
  let t = pick(r, [0.6, 1.2]);
  while (t < seconds) {
    const b = {
      t: +t.toFixed(4),
      close: +pick(r, B.close).toFixed(4),
      hold: +pick(r, B.hold).toFixed(4),
      open: +pick(r, B.open).toFixed(4),
      /* one eye a frame or two behind the other. it is under three hundredths
         of a second and it is the difference between two lids and one shutter. */
      asym: +(r() * 0.035).toFixed(4),
      /* now and then, twice. a double blink is a real thing a face does and it
         is the loudest single cue that this is not a loop. */
      twice: r() < 0.18,
    };
    out.push(b);
    if (b.twice) {
      out.push({
        t: +(t + b.close + b.hold + b.open + 0.075).toFixed(4),
        close: +(b.close * 0.88).toFixed(4),
        hold: +(b.hold * 0.7).toFixed(4),
        open: +(b.open * 0.82).toFixed(4),
        asym: +(b.asym * 0.5).toFixed(4), twice: false,
      });
    }
    t += pick(r, B.every);
  }
  return out;
}
/* the fingerprint a blink is compared on. rounded to a tenth of a frame at
   60fps, because two blinks that differ in the ninth decimal are the same
   blink to a viewer and the check is about what a viewer sees. */
const blinkKey = b => [b.close, b.hold, b.open, b.asym]
  .map(v => Math.round(v * 600) / 600).join('/');

/* the saccades. small, quick, and always in eye units. they never scale the
   eye: a saccade is the eye moving, and an eye that changed shape while it
   moved would be a state rather than a glance. */
function saccadePlan(seconds, seed) {
  const r = prng(seed);
  const S = IDLE.saccade;
  const out = [];
  let t = pick(r, [0.9, 1.8]), side = r() < 0.5 ? -1 : 1, k = 0;
  while (t < seconds) {
    /* every third one comes back through the middle, which is what stops it
       reading as a metronome. record.mjs's hero idle does the same. */
    const to = (k % 3 === 2)
      ? [0, 0]
      : [side * pick(r, [0.45, S.amp]), (r() - 0.5) * 0.5];
    out.push({ t: +t.toFixed(4), to, for: +pick(r, S.for).toFixed(4) });
    t += pick(r, S.every);
    if (k % 3 !== 2) side = -side;
    k++;
  }
  return out;
}

/* ---------- the plan ----------
   marks are the api. a mark is a second on the clip's clock and a state to be
   in from then, optionally with a bubble and optionally holding the turn
   somewhere. everything else — where each state's entrance, hold and exit fall,
   when the bubble pops and drops, where the sound cues go — is worked out from
   the table above and from the gap to the next mark.

     planMascot({
       seconds: 20,
       marks: [ { t: 0.4, state: 'neutral' },
                { t: 3.1, state: 'curious', bubble: 'go on' },
                { t: 6.0, state: 'surprised', turn: 0.6 } ],
       theme: 'light',
     })

   the plan is plain json. it is what `mascotFrame` reads, what the page is
   handed, and what a clip script can print. */
export function planMascot(opts = {}) {
  const o = {
    seconds: null, marks: [], theme: 'light',
    size: SIZE, radius: HEAD.radius,
    pos: 'bottom-left', margin: 16,
    /* the resting turn. null means "work it out from where he is standing",
       which is the whole point of it being one number: bottom left looks right,
       bottom right looks left, and either can be overridden by saying so. */
    bias: null,
    band: null,                 /* the caption box to keep the bubble out of */
    seed: 0x6b0a11,
    ...opts,
  };
  if (!THEMES.includes(o.theme)) throw new Error('no theme called "' + o.theme + '"');
  if (!o.marks.length) throw new Error('a mascot plan needs at least one mark');

  const marks = [...o.marks].map((m, i) => ({ ...m, i })).sort((a, b) => a.t - b.t);
  const notes = [];

  /* he should look into the frame rather than out of it, so the sign follows
     the corner he is standing in unless the caller says otherwise. */
  const bias = o.bias != null ? o.bias : (o.pos.endsWith('right') ? -TURN.bias : TURN.bias);
  if (!(bias >= -1 && bias <= 1)) throw new Error('the resting turn is ' + bias + ', and it lives in -1..1');

  for (const m of marks) {
    if (!STATES[m.state]) {
      throw new Error('no state called "' + m.state + '" — the nine are '
        + STATE_NAMES.join(', '));
    }
    if (m.turn != null) {
      if (!(m.turn >= -1 && m.turn <= 1)) {
        throw new Error('mark ' + m.i + ' asks for turn ' + m.turn + ', and turn lives in -1..1');
      }
      /* a mark may hold the turn somewhere, or a state may be about the turn.
         both at once is two things writing one channel over the same window,
         and the answer would depend on build order, which is not an answer. */
      if (STATES[m.state].authorsTurn) {
        throw new Error('mark ' + m.i + ' sets turn on "' + m.state
          + '", which turns on its own — drop one of the two');
      }
    }
  }

  /* each mark's window. a state runs entrance, hold, exit, and the hold is
     stretched to fill whatever room there is up to the next mark rather than
     leaving a gap where nothing is driving the pose. a mark that does not have
     room for its own entrance and exit is a plan error, not something to
     quietly truncate: a state cut off half way through its entrance is the one
     failure that looks like a rendering bug. */
  const seconds = o.seconds != null ? o.seconds
    : marks[marks.length - 1].t + STATES[marks[marks.length - 1].state].entry
    + STATES[marks[marks.length - 1].state].hold
    + STATES[marks[marks.length - 1].state].exit + 0.3;

  const out = marks.map((m, k) => {
    const S = STATES[m.state];
    const next = k + 1 < marks.length ? marks[k + 1].t : seconds;
    const room = next - m.t;
    const floor = S.entry + S.exit + 0.30;
    if (room < floor) {
      throw new Error('mark ' + k + ' (' + m.state + ' at ' + m.t.toFixed(2) + 's) has '
        + room.toFixed(2) + 's before the next one and needs ' + floor.toFixed(2)
        + 's for its own entrance, a hold and its exit');
    }
    const hold = room - S.entry - S.exit;
    /* the mark the preflight scores this state on, resolved now: a state whose
       target depends on which way he is facing declares it as a function of the
       config rather than as a number it cannot know. */
    const mk = { ...S.mark };
    if (typeof mk.to === 'function') mk.to = +mk.to({ bias }).toFixed(4);
    const rec = {
      i: k, state: m.state, t: +m.t.toFixed(4),
      entry: S.entry, hold: +hold.toFixed(4), exit: S.exit,
      settled: +(m.t + S.entry).toFixed(4),
      leaving: +(m.t + S.entry + hold).toFixed(4),
      out: +(m.t + S.entry + hold + S.exit).toFixed(4),
      mark: mk, label: S.label, bubble: null, bubbles: null,
      /* what this mark does to the turn, if anything. a state that turns on its
         own says so and the builder writes it; a mark that merely wants to be
         held somewhere carries the number and a window to get there in. */
      turn: m.turn == null ? null : +m.turn.toFixed(4),
      turnFor: +(m.turnFor == null ? S.entry : m.turnFor).toFixed(4),
      authorsTurn: !!S.authorsTurn,
    };
    /* ---------- what he says ----------
       one bubble or a run of them. `bubble: 'go on'` is the whole surface every
       clip before this one used and it is untouched; `bubbles: [{t, text}]` is
       the run, each one placed on the clip's own clock so a greeting can land on
       the word it is greeting in.

       both paths end in the same list, so everything downstream — the builder,
       the frame, the cues, the report — reads `rec.bubbles` and knows nothing
       about which spelling asked for it. `rec.bubble` stays as the first of
       them, because that is what the single case has always meant. */
    const say = (text, where) => {
      const words = String(text).trim().split(/\s+/).filter(Boolean);
      if (!words.length) throw new Error('mark ' + k + ' has an empty bubble' + where);
      if (words.length > BUBBLE.maxWords) {
        throw new Error('mark ' + k + '\'s bubble' + where + ' is ' + words.length + ' words ("'
          + text + '") — the ceiling is ' + BUBBLE.maxWords
          + ' and the rule is two or three');
      }
      if (words.length > BUBBLE.sayWords) {
        notes.push('mark ' + k + '\'s bubble' + where + ' is ' + words.length
          + ' words, which is at the ceiling rather than at the rule');
      }
      /* no punctuation dashes, in any language, anywhere a visitor can read.
         this is the brand rule and it is checked rather than trusted. */
      if (/[—–]/.test(text) || /\s-\s/.test(text)) {
        throw new Error('mark ' + k + '\'s bubble' + where + ' has a punctuation dash in it: "' + text + '"');
      }
      return { text: String(text).trim(), words: words.length };
    };
    /* a bubble drawn from its own timing profile. `inAt` is when the first dot
       starts climbing; everything after it is arithmetic on the profile, and the
       hold is whatever room is left, floored so a word is never a flash. */
    const bubbleAt = (text, inAt, T, floor, where) => {
      const s = say(text, where);
      const holdFor = Math.max(floor, Math.min(T.hold, rec.leaving - inAt - T.in - T.out - 0.08));
      return {
        ...s, profile: T,
        in: +inAt.toFixed(4),
        full: +(inAt + T.in).toFixed(4),
        leaving: +(inAt + T.in + holdFor).toFixed(4),
        out: +(inAt + T.in + holdFor + T.out).toFixed(4),
      };
    };
    if (m.bubble != null && m.bubbles != null) {
      throw new Error('mark ' + k + ' carries both `bubble` and `bubbles` — pick one');
    }
    if (m.bubble) {
      /* the bubble lives inside the hold, never over the entrance or the exit:
         a bubble arriving while the head is still moving is two events on one
         frame and neither of them reads. */
      rec.bubbles = [bubbleAt(m.bubble, +(rec.settled + 0.12).toFixed(4), BUBBLE, 0.42, '')];
    } else if (m.bubbles) {
      if (!Array.isArray(m.bubbles) || !m.bubbles.length) {
        throw new Error('mark ' + k + '\'s `bubbles` is not a list of {t, text}');
      }
      const list = [...m.bubbles].sort((x, y) => x.t - y.t);
      rec.bubbles = list.map((e, j) => {
        if (!(e.t >= 0)) throw new Error('bubble ' + j + ' on mark ' + k + ' has no time on it');
        /* the first dot starts on the time given, so a bubble asked for on a word
           begins on that word rather than finishing on it. */
        return bubbleAt(e.text, +e.t.toFixed(4), BUBBLE.quick, BUBBLE.quick.hold, ' ' + j);
      });
      /* two bubbles on screen at once is two thoughts, which is not a thing a
         head with one bubble anchor can draw: they would be the same two dots and
         the same pill holding two strings. */
      for (let j = 1; j < rec.bubbles.length; j++) {
        if (rec.bubbles[j].in < rec.bubbles[j - 1].out - 0.001) {
          throw new Error('bubbles ' + (j - 1) + ' and ' + j + ' on mark ' + k
            + ' overlap: the first is up until ' + rec.bubbles[j - 1].out.toFixed(2)
            + 's and the second starts at ' + rec.bubbles[j].in.toFixed(2) + 's');
        }
      }
      if (rec.bubbles[0].in < rec.settled + 0.001) {
        throw new Error('the first bubble on mark ' + k + ' starts at '
          + rec.bubbles[0].in.toFixed(2) + 's, while the head is still arriving at '
          + rec.settled.toFixed(2) + 's');
      }
    }
    rec.bubble = rec.bubbles ? rec.bubbles[0] : null;
    for (const b of rec.bubbles || []) {
      if (b.out > rec.leaving + 0.001) {
        throw new Error('mark ' + k + '\'s bubble "' + b.text + '" runs to ' + b.out.toFixed(2)
          + 's, past its own state\'s hold — give the mark more room');
      }
    }
    return rec;
  });

  /* the head, in the frame. the plate is 60 of the 64 grid, so the svg box is
     bigger than the head by two units a side and the placement has to work in
     plate edges rather than in box edges or the mascot sits four pixels inside
     where it was put. */
  const unit = o.size / GRID;
  const plate = { w: HEAD.plate.s * unit, off: HEAD.plate.x * unit };
  const box = placeHead(o.pos, o.size, plate, o.margin);

  const plan = {
    seconds: +seconds.toFixed(4),
    theme: o.theme, size: o.size, radius: o.radius, unit, bias: +bias.toFixed(4),
    turn: TURN,
    pos: o.pos, box, plate: { w: +plate.w.toFixed(3), off: +plate.off.toFixed(3) },
    headPx: +(plate.w * STAGE.dsf).toFixed(1),
    stage: STAGE, safe: SAFE, band: o.band,
    marks: out,
    idle: {
      blinks: blinkPlan(seconds, o.seed),
      saccades: saccadePlan(seconds, o.seed ^ 0x9e37),
    },
    notes,
  };

  /* the phone size guard, at plan time, because it is arithmetic and there is
     no reason to spend a render finding out. the rendered rect is checked again
     in the page, against what actually painted. */
  if (plan.headPx < HEAD_PX.min || plan.headPx > HEAD_PX.max) {
    throw new Error('the head is ' + plan.headPx.toFixed(0) + ' device px across and the window is '
      + HEAD_PX.min + ' to ' + HEAD_PX.max + ' — change `size`, which is in css px');
  }
  /* the type, same reasoning. */
  const cap = BUBBLE.size * BUBBLE.capRatio * STAGE.dsf;
  if (cap < BUBBLE.minCap) {
    throw new Error('the bubble caps measure ' + cap.toFixed(1) + ' device px, floor is ' + BUBBLE.minCap);
  }
  plan.capPx = +cap.toFixed(1);

  /* no two blinks alike, in a row. the schedule is generated, so this is the
     assertion that the generator did its job rather than a hope about it. */
  const keys = plan.idle.blinks.map(blinkKey);
  for (let i = 1; i < keys.length; i++) {
    if (keys[i] === keys[i - 1]) {
      throw new Error('blinks ' + (i - 1) + ' and ' + i + ' are the same blink ('
        + keys[i] + ') — change the seed');
    }
  }
  return plan;
}

/* where the head sits. bottom left inside the platform safe area is the
   default and is what the export renders, so a clip drops onto a phone video
   with nothing to reposition. the numbers are the plate's, not the box's. */
function placeHead(pos, size, plate, margin) {
  const L = SAFE_CSS.left + margin, R = STAGE.w - SAFE_CSS.right - margin;
  const T = SAFE_CSS.top + margin, Bo = STAGE.h - SAFE_CSS.bottom - margin;
  const left = pos.endsWith('right') ? R - plate.w - plate.off : L - plate.off;
  const top = pos.startsWith('top') ? T - plate.off : Bo - plate.w - plate.off;
  return { left: +left.toFixed(2), top: +top.toFixed(2), size };
}

/* ---------- the channels ----------
   pose rests at zero between states and idle never rests, which is what lets a
   state be written as if it were the only thing happening. `a` is the rig and
   `b` is the same thing LAG later; the card is drawn with `b` and the eyes take
   LEAD of the difference back. */
function channels(plan) {
  /* `turn` is the one channel whose rest is not zero. it is where he is facing
     rather than a gesture he is making, so it is seeded to the resting bias and
     an exit deliberately leaves it alone — see `exitToRest`. */
  const pose = () => ({ x: 0, y: 0, rot: 0, sc: 1, sq: 0, lift: 0, turn: plan.bias });
  return {
    a: pose(), b: pose(),
    eye: [{ x: 0, y: 0, sx: 1, sy: 1 }, { x: 0, y: 0, sx: 1, sy: 1 }],
    lid: [{ v: 0 }, { v: 0 }],
    brow: [{ o: 0, y: 0, rot: 0 }, { o: 0, y: 0, rot: 0 }],
    idle: { x: 0, y: 0, rot: 0, br: 0.5, ex: 0, ey: 0, bl: [{ v: 0 }, { v: 0 }] },
    /* three parts, staggered: the two dots and the pill. the site animates them
       with three transition delays; here they are three tweens on one timeline,
       which is the same gesture and is a function of time rather than of when a
       class was added. */
    bub: [{ o: 0, sc: 0.2 }, { o: 0, sc: 0.2 }, { o: 0, sc: 0.7, y: 0 }],
    pad: { v: 0 },
  };
}

/* ---------- the builder a state is written against ----------
   every call is a `fromTo` with `immediateRender:false`, which is the same
   discipline lib/pictograms.mjs arrived at the hard way: a `fromTo` renders its
   own from state the moment it is created, so building a state's entrance and
   then its exit would leave the channel holding the exit's start. the seeds are
   the resting pose and nothing else speaks before a tween's own time.

   `head` and `turn` are the only two that write twice. everything else is on
   the rig side only, because the eyes, the lids and the brows are drawn inside
   the card and already carry its motion. */
function builder(tl, ch, H, t0, cfg) {
  const put = (target, from, to, at, forS, ease) =>
    tl.fromTo(target, from, { ...to, duration: forS, ease: ease, immediateRender: false }, at);

  const ez = name => H[name] || H.glide;

  /* ---------- where the state has got to ----------
     every call states its own `from` and its own `to`, so the pose a state ends
     on is knowable at build time by remembering the last `to` written to each
     channel. the exit needs that and cannot read it off the channel objects: an
     `immediateRender:false` tween writes nothing until its own time, so at build
     time those objects still hold the seed, and an exit built from them would
     ease back to rest *from rest* and snap on the frame it started.

     it is tracked rather than declared per state because a declaration is a
     second copy of the same numbers, and two copies is one that goes stale. */
  const pose = { x: 0, y: 0, rot: 0, sc: 1, sq: 0, lift: 0, turn: cfg.turn };
  const eyePose = [{ x: 0, y: 0, sx: 1, sy: 1 }, { x: 0, y: 0, sx: 1, sy: 1 }];
  const lidPose = [0, 0];
  const browPose = [{ o: 0, y: 0, rot: 0 }, { o: 0, y: 0, rot: 0 }];

  const head = (from, to, opt = {}) => {
    const at = t0 + (opt.at || 0);
    const forS = opt.for || 0.4;
    const e = ez(opt.ease || 'pop');
    const anti = opt.anti || 0;
    const antiFor = opt.antiFor || 4 / 60;
    for (const [c, shift] of [[ch.a, 0], [ch.b, LAG]]) {
      if (anti > 0) {
        /* the pull back, and it runs forward from the mark rather than backward
           into the frames before it. a state that started moving before its own
           mark would be animating during the state before it, which is the one
           thing a named timeline must not do, and it makes `entryFrames` mean
           what it says: the frames from the mark to the arrival, wind up
           included. it goes the other way by `anti` of the move, over three or
           four frames, on the calm curve, because an anticipation that snapped
           would be a second move rather than the wind up for one. */
        const back = {};
        for (const k in to) back[k] = from[k] + (from[k] - to[k]) * anti;
        put(c, from, back, at + shift, antiFor, H.glide);
        put(c, back, to, at + shift + antiFor, forS, e);
      } else {
        put(c, from, to, at + shift, forS, e);
      }
    }
    Object.assign(pose, to);
  };

  const eye = (k, from, to, opt = {}) => {
    put(ch.eye[k], from, to, t0 + (opt.at || 0), opt.for || 0.3, ez(opt.ease || 'pop'));
    Object.assign(eyePose[k], to);
  };
  const eyes = (from, to, opt) => { eye(0, from, to, opt); eye(1, from, to, opt); };

  /* a lid is a level rather than a move, so it takes one number. the curves are
     the site's own: shut is the accelerating one, open the decelerating one, and
     a state that says neither gets shut going down and open coming up, decided
     by the direction it is moving. */
  const lid = (k, from, to, opt = {}) => {
    put(ch.lid[k], { v: from }, { v: to },
      t0 + (opt.at || 0), opt.for || 0.26, ez(opt.ease || (to > from ? 'shut' : 'open')));
    lidPose[k] = to;
  };

  const brow = (k, from, to, opt = {}) => {
    put(ch.brow[k], from, to, t0 + (opt.at || 0), opt.for || 0.24, ez(opt.ease || 'pop'));
    Object.assign(browPose[k], to);
  };

  /* the turn, and it is written to both layers like the head is, because the
     eyes read the lead one and the card reads the lag one. that is the whole of
     "eyes lead the head on a turn": there is no code in here about it, it falls
     out of the same three frame lag everything else already had.

     the anticipation and the arrival are clamped to the channel's own range. a
     wind up on a turn is a turn further away, and from 0.85 with 0.17 of
     anticipation that lands at 0.995 — the clamp is a backstop rather than
     something the table relies on, and `turn-away` parks at 0.85 rather than at
     1 precisely so it never has to fire. */
  const turn = (to, opt = {}) => {
    const at = t0 + (opt.at || 0);
    const forS = opt.for || 0.5;
    const e = ez(opt.ease || 'pop');
    const anti = opt.anti || 0;
    const antiFor = opt.antiFor || 3 / 60;
    const from = pose.turn;
    const dst = clamp(to, -1, 1);
    for (const [c, shift] of [[ch.a, 0], [ch.b, LAG]]) {
      if (anti > 0) {
        const back = clamp(from + (from - dst) * anti, -1, 1);
        put(c, { turn: from }, { turn: back }, at + shift, antiFor, H.glide);
        put(c, { turn: back }, { turn: dst }, at + shift + antiFor, forS, e);
      } else {
        put(c, { turn: from }, { turn: dst }, at + shift, forS, e);
      }
    }
    pose.turn = dst;
  };

  return {
    head, eye, eyes, brow, turn,
    bias: cfg.bias,
    pose, eyePose, lidPose, browPose,
    /* the two shorthands a state reaches for constantly: both eyes to a pose,
       and both lids to a level. `lids` remembers where it left them so a state
       can write a sequence of levels without restating the previous one. */
    lids(to, opt = {}) {
      lid(0, lidPose[0], to, opt);
      lid(1, lidPose[1], to, { ...opt, at: (opt.at || 0) + 0.012 });
    },
    lid(k, from, to, opt) { lid(k, from, to, opt); },
    brows(o, opt = {}) {
      brow(0, { o: browPose[0].o }, { o }, { ...opt, ease: 'glide' });
      brow(1, { o: browPose[1].o }, { o }, { ...opt, ease: 'glide' });
    },
    /* the contact deformation, on the one channel whose two scales are volume
       preserving by construction. this is lib/pictograms.mjs's squash, shape for
       shape: a short counter stretch, a snap to the peak landing exactly on
       contact, a frame of hold, then out on the pop curve whose own dip under
       the mark is the counter for free. */
    squash(k, opt = {}) {
      const kk = clamp(k, -SQ_MAX, SQ_MAX);
      const at = t0 + (opt.at || 0);
      const a = -kk * SQUASH.anticipate;
      const out = opt.for || SQUASH.out;
      for (const c of [ch.a, ch.b]) {
        const s = c === ch.b ? LAG : 0;
        put(c, { sq: 0 }, { sq: a }, at + s - SQUASH.pre - SQUASH.snap, SQUASH.pre, H.glide);
        put(c, { sq: a }, { sq: kk }, at + s - SQUASH.snap, SQUASH.snap, H.glide);
        put(c, { sq: kk }, { sq: 0 }, at + s + SQUASH.hold, out, H.pop);
      }
      /* a squash always comes back to nothing, which is what makes it a
         deformation rather than a pose. */
      pose.sq = 0;
    },
    /* the airborne channel. it drives the shadow and nothing else, so a state
       that never leaves the ground never touches it. */
    lift(to, opt = {}) {
      for (const c of [ch.a, ch.b]) {
        const s = c === ch.b ? LAG : 0;
        put(c, { lift: pose.lift }, { lift: to }, t0 + (opt.at || 0) + s, opt.for || 0.22, H.glide);
      }
      pose.lift = to;
    },
  };
}

/* the exit. every state ends by putting every channel it touched back to rest,
   on the calm curve, so the next state's entrance can state its own `from`
   literally and be right. that contract is what makes the states independent of
   each other and of the order they appear in. */
function exitToRest(tl, ch, H, B, at, forS) {
  const put = (target, from, to, a, f) =>
    tl.fromTo(target, from, { ...to, duration: f, ease: H.glide, immediateRender: false }, a);
  const P = B.pose;
  /* `turn` is not in this list and that is the point. every other channel is a
     gesture and goes back to nothing; the turn is where he is facing, and a
     head that snapped back to camera at the end of every state would make
     `turn-away` a twitch instead of a place he went. so it persists until
     something turns him, which is also what makes a sweep across several marks
     one continuous ramp rather than a row of them fighting the exits. */
  for (const [c, shift] of [[ch.a, 0], [ch.b, LAG]]) {
    put(c, { x: P.x, y: P.y, rot: P.rot, sc: P.sc, sq: P.sq, lift: P.lift },
      { x: 0, y: 0, rot: 0, sc: 1, sq: 0, lift: 0 }, at + shift, forS);
  }
  for (let k = 0; k < 2; k++) {
    const e = B.eyePose[k], bw = B.browPose[k];
    put(ch.eye[k], { x: e.x, y: e.y, sx: e.sx, sy: e.sy },
      { x: 0, y: 0, sx: 1, sy: 1 }, at, forS);
    put(ch.lid[k], { v: B.lidPose[k] }, { v: 0 }, at, forS * 0.8);
    put(ch.brow[k], { o: bw.o, y: bw.y, rot: bw.rot },
      { o: 0, y: 0, rot: 0 }, at, forS * 0.7);
  }
}

/* ---------- the timeline ----------
   built once and scrubbed after that, the way everything in demo/ is. it hangs
   off the plan non-enumerably so `JSON.stringify(plan)` is still the plan. */
function engineFor(plan) {
  if (plan.__engine) return plan.__engine;
  const H = mascotEases(g, CustomEase, houseEases);
  const ch = channels(plan);
  const tl = g.timeline({ paused: true });
  const put = (target, from, to, at, forS, ease) =>
    tl.fromTo(target, from, { ...to, duration: forS, ease: ease, immediateRender: false }, at);

  /* ---------- idle, first, so a state always writes over a live face ----------
     drift and breathing are yoyoing repeats on the calm curve. an infinite child
     never completes, so it is never dropped off the root and scrubbing backwards
     through it is exactly the same animation as scrubbing forwards. */
  const yo = (target, key, amp, period) =>
    tl.fromTo(target, { [key]: -amp }, {
      [key]: amp, duration: period / 2, ease: H.glide,
      repeat: -1, yoyo: true, immediateRender: true,
    }, 0);
  yo(ch.idle, 'x', IDLE.driftX.amp, IDLE.driftX.period);
  yo(ch.idle, 'y', IDLE.driftY.amp, IDLE.driftY.period);
  yo(ch.idle, 'rot', IDLE.driftRot.amp, IDLE.driftRot.period);
  tl.fromTo(ch.idle, { br: 0 }, {
    br: 1, duration: IDLE.breathe.period / 2, ease: H.glide,
    repeat: -1, yoyo: true, immediateRender: true,
  }, 0);

  /* the saccades. each is one small eased move to a new resting place, and the
     eye simply stays there until the next one — which is what an eye does. */
  let ex = 0, ey = 0;
  for (const s of plan.idle.saccades) {
    put(ch.idle, { ex, ey }, { ex: s.to[0], ey: s.to[1] }, s.t, s.for, H.drift);
    ex = s.to[0]; ey = s.to[1];
  }
  /* the blinks. three tweens each, shut then hold then open, and the second eye
     is `asym` behind the first. */
  for (const b of plan.idle.blinks) {
    for (let k = 0; k < 2; k++) {
      const at = b.t + (k ? b.asym : 0);
      put(ch.idle.bl[k], { v: 0 }, { v: 1 }, at, b.close, H.shut);
      put(ch.idle.bl[k], { v: 1 }, { v: 0 }, at + b.close + b.hold, b.open, H.open);
    }
  }

  /* ---------- the states ----------
     where the turn has got to is carried across the marks, because it is the
     one channel no exit resets. a state's builder is handed it as its own
     starting point so a `snap-back` after a `turn-away` states its `from`
     literally and is right, wherever it was turned to. */
  let turnNow = plan.bias;
  for (const m of plan.marks) {
    const S = STATES[m.state];
    const B = builder(tl, ch, H, m.t, { bias: plan.bias, turn: turnNow });
    S.build(B);
    /* a mark that merely wants to be held at a turn. `planMascot` has already
       refused this on a state that turns on its own, so the two can never be
       writing the channel over the same window. */
    if (m.turn != null) B.turn(m.turn, { for: m.turnFor, ease: 'drift' });
    turnNow = B.pose.turn;
    exitToRest(tl, ch, H, B, m.leaving, m.exit);
    /* every bubble this mark says, in order. one is the ordinary case and reads
       exactly as it always did; a run of them is the same three tweens over and
       over, on the shorter profile the plan already resolved, and they cannot
       overlap because `planMascot` refuses a list that does. */
    for (const b of m.bubbles || []) {
      const T = b.profile || BUBBLE;
      /* in: small dot, larger dot, then the pill, each seventy milliseconds
         behind the one before it. the dots spring from a fifth of their size and
         the pill from seven tenths, which are the site's own numbers. everything
         is on the pop curve, so each of the three overshoots and settles rather
         than arriving flat. */
      for (let k = 0; k < 2; k++) {
        put(ch.bub[k], { o: 0, sc: 0.2 }, { o: 1, sc: 1 },
          b.in + k * T.step, T.dotFor, H.pop);
      }
      put(ch.bub[2], { o: 0, sc: 0.7, y: 5 }, { o: 1, sc: 1, y: 0 },
        b.in + 2 * T.step, T.pillFor, H.pop);
      /* out: the same list backwards, and quicker. a thought does not leave in
         the order it arrived. */
      put(ch.bub[2], { o: 1, sc: 1, y: 0 }, { o: 0, sc: 0.8, y: 4 },
        b.leaving, T.outFor, H.glide);
      for (let k = 0; k < 2; k++) {
        put(ch.bub[1 - k], { o: 1, sc: 1 }, { o: 0, sc: 0.3 },
          b.leaving + (k + 1) * T.outStep, T.outFor, H.glide);
      }
    }
  }

  /* the padding. a gsap child that completes is dropped off the root, and a
     dropped child does not re-render if time moves backwards, which is exactly
     what scrubbing does. an hour past the end costs nothing. */
  tl.fromTo(ch.pad, { v: 0 }, { v: 1, duration: 0.01 }, plan.seconds + 3600);

  const eng = { g, H, ch, tl };
  Object.defineProperty(plan, '__engine', { value: eng, enumerable: false, configurable: true });
  return eng;
}

/* ---------- the animation ----------
   a function of time and of nothing else. every number a frame needs comes out
   of here and nothing in the page decides anything.

     pose    the state's own motion, with no idle in it
     head    the rig, un-lagged, with the idle on it
     card    what the head is actually drawn with: the rig LAG later
     eyes    position in grid units, the two scales, and the lid level
     brows   opacity, offset and turn
     shadow  the ellipse's scale, blur, opacity and slide for this frame
     glow    the dark theme's two layers, as one multiplier
     bubble  the two dots and the pill, and the text if there is one now
     turn    both halves of the turn and what it cost

   the lid level is the pose lid and the idle blink folded together: a blink
   during a half lid closes the remaining gap rather than fighting it, which is
   what a real lid does and is one line rather than a state machine. */
export function mascotFrame(plan, t) {
  const eng = engineFor(plan);
  eng.tl.time(t, false);
  const { a, b, eye, lid, brow, idle, bub } = eng.ch;

  const breathe = 1 + IDLE.breathe.amp * (idle.br - 0.5) * 2;
  /* the two turn values. the card takes the lagged one and the eyes take the
     lead one, which is the whole of "the eyes lead the head on a turn". */
  const tb = clamp(b.turn, -1, 1), ta = clamp(a.turn, -1, 1);
  const card = {
    x: b.x + idle.x, y: b.y + idle.y,
    /* the tilt goes with the card rather than with the gaze, because it is the
       head leaning and the head is the thing that is late. */
    rot: b.rot + idle.rot + TURN.tilt * tb,
    sc: b.sc * breathe, sq: b.sq, lift: b.lift,
  };
  const head = {
    x: a.x + idle.x, y: a.y + idle.y, rot: a.rot + idle.rot + TURN.tilt * ta,
    sc: a.sc * breathe, sq: a.sq, lift: a.lift,
  };

  /* the eyes lead. this is the whole of the overlapping action: the difference
     between the rig and the card, converted from css px into grid units,
     scaled down and capped so an eye can never leave the face. */
  const lead = {
    x: clamp(LEAD * (a.x - b.x) / plan.unit, -LEAD_CAP, LEAD_CAP),
    y: clamp(LEAD * (a.y - b.y) / plan.unit, -LEAD_CAP, LEAD_CAP),
  };

  /* ---------- the turn, as five flat moves on one number ----------
     `farEye` is the eye the turn carries toward the silhouette. it is the one on
     the **far** side of the form — see the note on TURN for why that is not the
     other way round — so it foreshortens and it travels the smaller distance,
     wrapping around the head. `trail` is the near one: full width, and the
     larger travel, crossing the centre line as the broad side swings in. the
     two together are what closes the gap. the name is `farEye` rather than
     `lead`, because `lead` a few lines up is already the eyes-lead-the-card
     offset, and two different leads in one function is one too many. */
  const aq = Math.abs(ta), sgn = ta < 0 ? -1 : 1;
  const farEye = ta >= 0 ? 1 : 0;
  const turnShift = k => sgn * aq * (k === farEye ? TURN.shift : TURN.shift + TURN.wrap);
  const turnScale = k => (k === farEye
    ? { sx: 1 - TURN.farX * aq, sy: 1 - TURN.farY * aq }
    : { sx: 1, sy: 1 });

  /* how far an eye may sit from the card's centre before it runs off the side.
     the plate is a circle at the shipped radius, so its half width at the eye's
     own height is exact; a card is wider than that, so the circle is the
     conservative bound for both. this is the guard that lets a state move the
     eyes *and* the turn move them without the two adding up to an eye on the
     cheek — `curious` at a full turn is the case it was written for. */
  const R = HEAD.plate.s / 2, CX = HEAD.plate.x + R, CY = HEAD.plate.y + R;
  /* the room an eye has, measured at the *narrowest* point of its own vertical
     span rather than at its centre. a widened eye — `surprised` takes it to two
     and a half times its height — reaches a y where the plate is a good deal
     narrower than it is at the eye line, and a clamp that only looked at the
     centre would happily let the top corners run off the cheek. */
  const room = (ey, halfW, halfH) => {
    const top = HEAD.eye.cy + ey - halfH, bot = HEAD.eye.cy + ey + halfH;
    const dy = Math.max(Math.abs(top - CY), Math.abs(bot - CY));
    const halfPlate = dy >= R ? 0 : Math.sqrt(R * R - dy * dy);
    return Math.max(0, halfPlate - TURN.margin - halfW);
  };

  let clamped = 0, outside = -Infinity;
  const eyes = eye.map((e, k) => {
    const poseLidV = lid[k].v, blink = idle.bl[k].v;
    const ts = turnScale(k);
    const sx = e.sx * ts.sx, sy = e.sy * ts.sy;
    const ey = e.y + idle.ey + lead.y;
    const want = e.x + idle.ex + lead.x + turnShift(k);
    /* the eye's own centre, relative to the card's, once it has moved. */
    const from = EYE_CX[k] - CX + want;
    const lim = room(ey, HEAD.eye.w / 2 * Math.abs(sx), HEAD.eye.h / 2 * Math.abs(sy));
    const got = clamp(from, -lim, lim);
    if (Math.abs(got - from) > 1e-6) clamped++;
    return {
      x: n(want + (got - from)), y: n(ey),
      sx: n(sx), sy: n(sy),
      lid: n(clamp(poseLidV + blink * (1 - poseLidV), 0, 1)),
    };
  });

  /* ---------- nothing may sit outside the head ----------
     the features are clipped to the plate in the markup, so nothing *can* paint
     outside it. this is the other half of that: how far outside the silhouette
     the ink would have gone if it were not clipped, in grid units, positive
     when it is out. the clip is the belt and this is the braces — if this ever
     goes positive the clip is quietly hiding a pose that does not fit, which is
     a fault whether or not a viewer can see it.

     the lid is deliberately not in here. it is an oversized card coloured slab
     whose whole job is to cover the eye completely, so it overhangs by design
     and the clip is what makes the overhang free. what is measured is the ink a
     viewer can tell from the card: the irises and the brows. */
  const bw = HEAD.brow.w / 2, bh = HEAD.brow.h / 2;
  for (let k = 0; k < 2; k++) {
    const e = eyes[k], cx = EYE_CX[k], cy = HEAD.eye.cy;
    const hw = HEAD.eye.w / 2 * Math.abs(e.sx), hh = HEAD.eye.h / 2 * Math.abs(e.sy);
    for (const sx2 of [-1, 1]) for (const sy2 of [-1, 1]) {
      outside = Math.max(outside, headSD(cx + e.x + sx2 * hw, cy + e.y + sy2 * hh, plan));
    }
    const b = brow[k];
    if (b.o > 0.004) {
      const th = b.rot * Math.PI / 180, c2 = Math.cos(th), s2 = Math.sin(th);
      const bx = EYE_CX[k] + turnShift(k) * TURN.browShare, by = HEAD.brow.cy + b.y;
      for (const sx2 of [-1, 1]) for (const sy2 of [-1, 1]) {
        const px = sx2 * bw, py = sy2 * bh;
        outside = Math.max(outside, headSD(bx + px * c2 - py * s2, by + px * s2 + py * c2, plan));
      }
    }
  }

  const sh = shadowAt(card.lift);
  const now = plan.marks.find(m => t >= m.t && t < m.out);
  /* whichever bubble is up, over every mark and every bubble on it. a mark may
     say one thing or several, and the pill holds one string at a time either
     way — `planMascot` is what makes that true, by refusing a list that
     overlaps itself. */
  let saying = null;
  for (const m of plan.marks) {
    for (const b of m.bubbles || []) {
      if (t >= b.in - 0.001 && t < b.out + 0.001) { saying = b; break; }
    }
    if (saying) break;
  }

  return {
    t,
    /* the state's own motion, with no idle in it. everything that judges a
       state — the preflight's entry, overshoot and settle — reads this, because
       a two per cent breath under a two point eight per cent entrance would
       otherwise be most of what got measured. */
    pose: {
      x: n(a.x), y: n(a.y), rot: n(a.rot), sc: n(a.sc), sq: n(a.sq), lift: n(a.lift),
      turn: n(a.turn),
    },
    /* the breathing on its own, so the ceiling can be checked against the thing
       it is a ceiling on rather than against pose times breath. */
    breathe: n(breathe),
    /* how far ahead of the card the eyes are on this frame, in grid units. it is
       the overlapping action as one number, so a render can report it. */
    lead: { x: n(lead.x), y: n(lead.y) },
    head: { x: n(head.x), y: n(head.y), rot: n(head.rot), sc: n(head.sc), sq: n(head.sq), lift: n(head.lift) },
    card: {
      x: n(card.x), y: n(card.y), rot: n(card.rot),
      /* the squeeze rides on the x scale and nothing balances it on y, because
         a turn is a projection rather than a deformation. everything that reads
         the card — the page, `headRect`, the capture region, the safe area
         guard — gets it here and gets it once. */
      sx: n(card.sc * (1 + card.sq) * (1 - TURN.squeeze * Math.abs(tb))),
      sy: n(card.sc / (1 + card.sq)),
      lift: n(card.lift),
    },
    eyes,
    /* the brows go with their own eye, a shade less far, or a turned face would
       have its brows sitting over the bridge of a nose it does not have. */
    brows: brow.map((bw, k) => ({
      o: n(bw.o), y: n(bw.y), rot: n(bw.rot),
      x: n(turnShift(k) * TURN.browShare),
    })),
    /* the shadow slides with the mass, on the lagged turn, so it is under the
       head rather than under where the head is looking. */
    shadow: { sc: n(sh.sc), blur: n(sh.blur), o: n(sh.o), x: n(TURN.shadowShift * tb) },
    glow: plan.theme === 'dark' ? 1 : 0,
    /* `o` is the loudest of the three parts and it is what every guard and every
       visibility test downstream reads, so a cluster mid stagger counts as on
       screen from its first dot — which is the conservative answer and the one
       a safe area check wants. the parts carry the rest. */
    bubble: {
      o: n(Math.max(bub[0].o, bub[1].o, bub[2].o)),
      dots: [{ o: n(bub[0].o), sc: n(bub[0].sc) }, { o: n(bub[1].o), sc: n(bub[1].sc) }],
      pill: { o: n(bub[2].o), sc: n(bub[2].sc), y: n(bub[2].y) },
      text: saying ? saying.text : null,
    },
    state: now ? now.state : null,
    /* the lid level with no blink in it, which is what the preflight measures
       `unimpressed` on: a state whose mark is a lid must not be scored on
       whichever idle blink happened to overlap it. */
    poseLid: n(Math.max(lid[0].v, lid[1].v)),
    /* the turn, both halves of it, plus what it cost. `squeeze` and `offset` are
       the two numbers the brief asks a render to report, in the units they are
       judged in: per cent of the card's width, and grid units of eye travel that
       a render turns into device px. `clamped` counts the eyes the composition
       guard had to pull back this frame, and it is a fault if it is ever high —
       an eye sitting on its clamp is an eye that stopped moving. */
    turn: {
      lead: n(ta), card: n(tb),
      squeeze: n(TURN.squeeze * Math.abs(tb)),
      offset: [n(turnShift(0)), n(turnShift(1))],
      gap: n(HEAD.eye.sep - Math.abs(turnShift(0) - turnShift(1))),
      /* which eye is the far one this frame, so a report can name it rather
         than a reader having to work the sign out. at turn nought there is no
         far eye and this is null. */
      far: aq < 1e-9 ? null : farEye,
      clamped,
      /* the signed distance of the worst placed feature corner from the head's
         own edge: negative is inside and is the clearance, positive is out and
         is a fault. it is signed rather than floored at zero so the report can
         say how much room is left rather than only whether there is any. */
      outside: +outside.toFixed(4),
    },
  };
}

/* ---------- the sound ----------
   two cues and no more. a bubble arriving is the caption card's own `pop`,
   because it is the same event. `ding` appears on an agreement beat and nowhere
   else, which is what keeps it meaning yes. */
export function mascotCues(plan) {
  const cues = [];
  for (const m of plan.marks) {
    /* on the pill rather than on the first dot. the dots are the anticipation
       and the pill is the arrival, and a sound on the wind up is a sound that is
       early for the thing it is the sound of. */
    /* one pop per bubble, on the pill rather than on the first dot: the dots are
       the anticipation and the pill is the arrival, and a sound on the wind up is
       early for the thing it is the sound of. */
    for (const b of m.bubbles || []) {
      cues.push({ t: +(b.in + (b.profile || BUBBLE).step * 2).toFixed(4), kind: SFX.bubble });
    }
    const S = STATES[m.state];
    if (S.ding != null) cues.push({ t: +(m.t + S.ding).toFixed(4), kind: SFX.agree });
  }
  return cues.sort((a, b) => a.t - b.t);
}

/* ---------- a moment worth photographing ----------
   the still strip is how the states get judged side by side, and the blinks are
   on their own schedule, so sooner or later one of them lands on the frame a
   state is being photographed at. it happened on the first strip: the agreeing
   still caught the tail of a blink and the state read as a face with one eye,
   which is a fact about the sampling rather than about the state.

   so a still walks forward, a frame at a time, until it is clear of every idle
   blink and the lids are where the state put them. it never walks past the
   window it was given: a state that is inside a blink for its whole hold gets
   photographed anyway, because a still that quietly came from a different state
   would be worse than one with a blink in it. */
export function stillMoment(plan, t, limit = 0.6, fps = 60) {
  const shut = tt => plan.idle.blinks.some(b =>
    tt >= b.t - 0.02 && tt <= b.t + b.close + b.hold + b.open + 0.02);
  let out = t;
  for (let i = 0; i <= Math.round(limit * fps); i++) {
    out = t + i / fps;
    if (!shut(out)) return +out.toFixed(4);
  }
  return +t.toFixed(4);
}

/* ---------- where the ink actually is ----------
   the head's rect for one frame, in device px from each border, computed rather
   than measured, and it is computed because measuring it is wrong.

   `getBoundingClientRect` on the plate returns the axis aligned box of the
   rect's *geometry*, so a plate turned eight degrees reports a box wider than
   itself by the corners it does not have — at radius 0.5 the ink is a circle
   and a circle does not get wider when you turn it. sampling that number found
   the head half a pixel outside a safe line it was fifteen pixels inside, which
   would have moved the mascot inward to satisfy a measurement artefact.

   so the head is worked out from the geometry it is drawn from. at radius 0.5,
   which is what ships, the ink is an ellipse with the card's two scales for
   semi axes, and the axis aligned box of a rotated ellipse is exact in one
   line. a card — any radius under 0.5 — falls back to the four transformed
   corners, which is exact for a square corner and conservative for a rounded
   one, and conservative in the right direction.

   the bubble is not in here. it is a dom box with no rotation on it, so the
   page measures it and measures it correctly.

   the shadow and the glow are reported beside the head rather than folded into
   it: a soft ellipse at a fifth opacity and a thirty pixel blur are not ink
   crossing a safe line, and scoring them as if they were would either fail
   every dark render or excuse a real overrun. */
export function headRect(plan, fr) {
  const u = plan.unit, S = HEAD.plate.s;
  /* the card's transform origin is the zone's own centre, which is also the
     plate's centre, so a rotation and a scale move nothing but the extent. */
  const cx = plan.box.left + (GRID / 2) * u + fr.card.x;
  const cy = plan.box.top + (GRID / 2) * u + fr.card.y;
  const a = (S / 2) * u * Math.abs(fr.card.sx);
  const b = (S / 2) * u * Math.abs(fr.card.sy);
  const th = fr.card.rot * Math.PI / 180;
  const c = Math.cos(th), s = Math.sin(th);
  let hw, hh;
  if (plan.radius >= 0.5) {
    hw = Math.hypot(a * c, b * s);
    hh = Math.hypot(a * s, b * c);
  } else {
    hw = Math.abs(a * c) + Math.abs(b * s);
    hh = Math.abs(a * s) + Math.abs(b * c);
  }
  const d = STAGE.dsf;
  return {
    left: +((cx - hw) * d).toFixed(1), top: +((cy - hh) * d).toFixed(1),
    right: +((STAGE.w - cx - hw) * d).toFixed(1),
    bottom: +((STAGE.h - cy - hh) * d).toFixed(1),
    /* how far the shadow and the glow reach past the ink, for the report. */
    shadowBottom: +((STAGE.h - (cy + SHADOW.dy * plan.size + plan.size * SHADOW.h / 2 * fr.shadow.sc)) * d).toFixed(1),
    glowReach: +(GLOW.wide.blur * 3 * d).toFixed(1),
  };
}

/* ---------- the preflight ----------
   walks every frame before a render. two jobs.

   the first is the one lib/pictograms.mjs's `sceneMotion` does: the biggest one
   frame step in every channel, so a snap is found in a second rather than after
   a full render. the scale is measured *effective* — the card's scale times its
   squash on each axis — because that is the number a viewer sees.

   the second is the per state report the brief asks for, and it is measured
   rather than described. each state declares the one channel it should be
   judged on and the value it is supposed to arrive at; this finds when the
   channel first crosses that value, how far past it goes, and how long it takes
   to stay inside a two per cent band of it. those three numbers are what
   "anticipation, overshoot, settle" actually means in a report. */
export function mascotMotion(plan, fps, seconds) {
  const N = Math.round(fps * (seconds || plan.seconds));
  const worst = {
    cardM: { d: 0, t: 0 }, cardR: { d: 0, t: 0 }, cardS: { d: 0, t: 0 },
    eyeM: { d: 0, t: 0 }, eyeS: { d: 0, t: 0 }, lid: { d: 0, t: 0 },
    brow: { d: 0, t: 0 }, lift: { d: 0, t: 0 }, bub: { d: 0, t: 0 },
    turn: { d: 0, t: 0 },
  };
  const bump = (k, d, t) => { if (d > worst[k].d) worst[k] = { d: +d.toFixed(4), t: +t.toFixed(3) }; };

  const track = plan.marks.map(() => []);
  let prev = null, maxSq = 0, maxBreathe = 0, maxLead = 0, still = 0, frozen = 0;
  /* the turn's own report: how far it went either way, what that cost the card
     in width, how far it pushed the eyes, and how often the composition guard
     had to pull one back. the offsets are kept in grid units here and turned
     into device px by whoever prints them, because a grid unit is the only
     honest place to compare them with the geometry table. */
  let turnLo = 0, turnHi = 0, maxSqueeze = 0, maxOffset = 0, minGap = HEAD.eye.sep, clampedFrames = 0;
  /* the worst any feature ink got outside the head silhouette, and when. the
     clip means it cannot paint out there, so anything positive is a pose that
     does not fit being quietly trimmed rather than a pose that is wrong on
     screen — which is still a fault, and this is what says so. */
  let outside = -Infinity, outsideAt = 0;

  for (let f = 0; f < N; f++) {
    const t = f / fps;
    const fr = mascotFrame(plan, t);
    maxSq = Math.max(maxSq, Math.abs(fr.pose.sq));
    maxBreathe = Math.max(maxBreathe, Math.abs(fr.breathe - 1));
    maxLead = Math.max(maxLead, Math.hypot(fr.lead.x, fr.lead.y));
    turnLo = Math.min(turnLo, fr.turn.lead, fr.turn.card);
    turnHi = Math.max(turnHi, fr.turn.lead, fr.turn.card);
    maxSqueeze = Math.max(maxSqueeze, fr.turn.squeeze);
    maxOffset = Math.max(maxOffset, Math.abs(fr.turn.offset[0]), Math.abs(fr.turn.offset[1]));
    minGap = Math.min(minGap, fr.turn.gap);
    if (fr.turn.clamped) clampedFrames++;
    if (fr.turn.outside > outside) { outside = fr.turn.outside; outsideAt = t; }
    for (let k = 0; k < plan.marks.length; k++) {
      const m = plan.marks[k];
      if (t >= m.t && t <= m.leaving) {
        const chan = m.mark.chan;
        const v = chan === 'lid' ? fr.poseLid : fr.pose[chan];
        track[k].push({ t: +(t - m.t).toFixed(4), v });
      }
    }
    if (prev) {
      bump('cardM', Math.hypot(fr.card.x - prev.card.x, fr.card.y - prev.card.y), t);
      bump('cardR', Math.abs(fr.card.rot - prev.card.rot), t);
      bump('cardS', Math.max(Math.abs(fr.card.sx - prev.card.sx), Math.abs(fr.card.sy - prev.card.sy)), t);
      bump('lift', Math.abs(fr.card.lift - prev.card.lift), t);
      /* a turn that stepped would be the one thing that gives the cheat away,
         because a flat turn has no depth to hide a jump behind. */
      bump('turn', Math.abs(fr.turn.lead - prev.turn.lead), t);
      for (let k = 0; k < 2; k++) {
        bump('eyeM', Math.hypot(fr.eyes[k].x - prev.eyes[k].x, fr.eyes[k].y - prev.eyes[k].y), t);
        bump('eyeS', Math.max(Math.abs(fr.eyes[k].sx - prev.eyes[k].sx), Math.abs(fr.eyes[k].sy - prev.eyes[k].sy)), t);
        bump('lid', Math.abs(fr.eyes[k].lid - prev.eyes[k].lid), t);
        bump('brow', Math.abs(fr.brows[k].o - prev.brows[k].o) + Math.abs(fr.brows[k].y - prev.brows[k].y), t);
      }
      bump('bub', Math.abs(fr.bubble.o - prev.bubble.o)
        + Math.abs(fr.bubble.pill.sc - prev.bubble.pill.sc)
        + Math.abs(fr.bubble.dots[0].sc - prev.bubble.dots[0].sc), t);
      /* a face that stopped. the whole claim of the idle layer is that this
         never happens, and it is counted rather than assumed — but it is counted
         in runs rather than in frames. every one of the drift curves has a
         turning point, and when two of them happen to turn on the same frame
         the arithmetic is momentarily still while the face is not. three frames
         in a row is a twentieth of a second of nothing, which is the shortest
         freeze a viewer can actually see. */
      const moved = Math.abs(fr.card.x - prev.card.x) + Math.abs(fr.card.y - prev.card.y)
        + Math.abs(fr.card.rot - prev.card.rot) + Math.abs(fr.card.sy - prev.card.sy) * 40
        + Math.abs(fr.eyes[0].lid - prev.eyes[0].lid) + Math.abs(fr.eyes[0].x - prev.eyes[0].x);
      if (moved < 1e-4) { still++; if (still >= 3) frozen++; } else still = 0;
    }
    prev = fr;
  }

  const states = plan.marks.map((m, k) => {
    const rows = track[k];
    const to = m.mark.to;
    /* where the channel was when the mark opened. a state is scored against
       where it started, and for every channel but the turn that is rest — but
       the turn is where he is already facing, so it is read off the mark's own
       first frame rather than assumed. an explicit `from` still wins. */
    const rest = m.mark.from != null ? m.mark.from
      : rows.length ? rows[0].v : (m.mark.chan === 'sc' ? 1 : 0);
    const span = to - rest;
    const dir = span >= 0 ? 1 : -1;
    /* the anticipation: how far the channel went the wrong way before it went
       the right way, and for how many frames. */
    let antiPeak = 0, antiFrames = 0;
    for (const r of rows) {
      if ((r.v - rest) * dir < -1e-4) { antiPeak = Math.max(antiPeak, Math.abs(r.v - rest)); antiFrames++; }
      else if (antiFrames) break;
    }
    /* the arrival: the first frame the channel reaches the mark. */
    let cross = null;
    for (let i = 0; i < rows.length; i++) {
      if ((rows[i].v - to) * dir >= -1e-6) { cross = i; break; }
    }
    /* the entrance window is the entrance: from the mark to `settled`, which is
       where the plan says the state has arrived and where every state's hold is
       allowed to start moving again. bounding it by a fixed tail instead would
       score thinking's scan and agreeing's second nod as the entrance failing to
       settle, which is the opposite of what they are. */
    let stop = rows.length;
    for (let i = 0; i < rows.length; i++) if (rows[i].t > m.entry) { stop = i; break; }
    if (cross == null) stop = 0;
    /* the overshoot, past the mark, as a share of the move. */
    let peak = to;
    if (cross != null) for (let i = cross; i < stop; i++) {
      if ((rows[i].v - peak) * dir > 0) peak = rows[i].v;
    }
    const over = span === 0 ? 0 : Math.abs(peak - to) / Math.abs(span);
    /* the settle: from the crossing to the last frame outside a two per cent
       band, which is the frame it actually came to rest on. */
    const band = Math.abs(span) * 0.02;
    let last = cross;
    if (cross != null) {
      for (let i = cross; i < stop; i++) if (Math.abs(rows[i].v - to) > band) last = i;
    }
    return {
      state: m.state, at: m.t, chan: m.mark.chan, to,
      antiFrames, antiPeak: +antiPeak.toFixed(3),
      entryFrames: cross == null ? null : cross,
      entryMs: cross == null ? null : Math.round(cross / fps * 1000),
      overshoot: +(over * 100).toFixed(1),
      settleFrames: cross == null ? null : last - cross,
      settleMs: cross == null ? null : Math.round((last - cross) / fps * 1000),
      bubble: m.bubbles ? m.bubbles.map(b => b.text).join(' / ') : null,
    };
  });

  const keys = plan.idle.blinks.map(blinkKey);
  return {
    frames: N, fps,
    worst, states,
    headPx: plan.headPx, capPx: plan.capPx,
    maxSquash: +maxSq.toFixed(4), maxBreathe: +maxBreathe.toFixed(4),
    maxLead: +maxLead.toFixed(3), lagFrames: +(LAG * 60).toFixed(1),
    frozenFrames: frozen,
    turn: {
      lo: +turnLo.toFixed(3), hi: +turnHi.toFixed(3),
      squeeze: +maxSqueeze.toFixed(4),
      offset: +maxOffset.toFixed(3),
      /* the same travel in the units it is judged in: device px at 1080 wide. */
      offsetPx: +(maxOffset * plan.unit * STAGE.dsf).toFixed(1),
      gap: +minGap.toFixed(2), gapWas: HEAD.eye.sep,
      clampedFrames,
    },
    outside: { units: +outside.toFixed(3), at: +outsideAt.toFixed(3) },
    blinks: {
      count: keys.length,
      unique: new Set(keys).size,
      repeatsInARow: keys.filter((k, i) => i && k === keys[i - 1]).length,
    },
  };
}

/* ---------- the markup ----------
   drawn once, transformed per frame. the layer order is the depth model and
   there is nothing else in it: the shadow is under everything, the two glow
   copies are behind the plate, the eyes and brows are inside the card so they
   carry its motion for free, and the bubble is a sibling of the card rather
   than a child of it, because a bubble that squashed with the head would be a
   thought balloon made of rubber.

   the lid is a card coloured slab sitting directly above the eye, inside the
   eye's own group so it carries the eye's scale. painting the card colour over
   the card is invisible, so it needs no clip: what it covers is the eye and
   nothing else. */
export function mascotMarkup(plan) {
  const P = HEAD.plate, E = HEAD.eye, W = HEAD.brow;
  const rx = P.s * plan.radius;
  const plate = `<rect class="m-plate" x="${P.x}" y="${P.y}" width="${P.s}" height="${P.s}" rx="${n(rx)}"/>`;
  const eye = k => {
    const x = EYE_CX[k] - E.w / 2, y = E.cy - E.h / 2;
    /* the lid is a flat bottomed slab wider and taller than the eye, resting
       with its bottom edge exactly on the eye's top edge, and a blink is that
       edge coming down.

       it was the eye's own pill at first, which looked obviously right and was
       obviously wrong the moment a frame was looked at: two rounded pills
       overlapping leave a crescent at the bottom *and* two slivers at the ends
       where their round ends curve away from each other, so a half closed eye
       rendered as a hollow ring. a lid has a straight edge. the slab paints the
       card's own colour, so the two units it overhangs on each side and the
       height it carries above the eye are invisible on the face and are what
       make the coverage total. */
    return `<g class="m-eye" data-eye="${k}">`
      + `<rect class="m-iris" x="${n(x)}" y="${n(y)}" width="${E.w}" height="${E.h}" rx="${n(E.h / 2)}"/>`
      + `<rect class="m-lid" x="${n(x - 1.2)}" y="${n(y - E.h * 2)}"`
      + ` width="${n(E.w + 2.4)}" height="${n(E.h * 2)}"/>`
      + `</g>`;
  };
  const brow = k => {
    const x = EYE_CX[k] - W.w / 2, y = W.cy - W.h / 2;
    return `<rect class="m-brow" data-brow="${k}" x="${n(x)}" y="${n(y)}"`
      + ` width="${W.w}" height="${W.h}" rx="${n(W.h / 2)}"/>`;
  };
  /* ---------- the clip ----------
     every facial feature is clipped to the head's own outline, so nothing can
     paint outside the silhouette however a state and a turn add up.

     it is not belt and braces for its own sake. the lid is an oversized card
     coloured slab — wider and much taller than the eye, so that it covers it
     completely at any scale — and `surprised` takes the eye to two and a half
     times its height, which drags that slab far above the eye line. put a turn
     on top of that and its top corner leaves the head, and because it is card
     coloured it stops being invisible the moment it is off the card: a small
     block of face colour sitting out in the background near the crown. that is
     exactly what shipped, and it is what this fixes.

     the clip path is the plate's own geometry, to the unit, so the two can
     never disagree about where the head ends. */
  const clip = `<clipPath id="m-head"><rect x="${P.x}" y="${P.y}" width="${P.s}" height="${P.s}" rx="${n(rx)}"/></clipPath>`;
  const face = `<svg class="m-face" viewBox="0 0 ${GRID} ${GRID}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">`
    + `<defs>${clip}</defs>`
    + plate
    + `<g class="m-features" clip-path="url(#m-head)">`
    + eye(0) + eye(1) + brow(0) + brow(1)
    + `</g></svg>`;
  const glowSvg = c => `<svg class="m-glow ${c}" viewBox="0 0 ${GRID} ${GRID}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${plate}</svg>`;

  return `<div class="m-zone" id="m-zone">
  <div class="m-shadow" id="m-shadow"></div>
  <div class="m-card" id="m-card">
    ${glowSvg('m-glow-wide')}
    ${glowSvg('m-glow-mid')}
    ${face}
  </div>
  <div class="bubble" id="m-bubble"><span class="m-dot" id="m-dot0"></span><span class="m-dot" id="m-dot1"></span><span class="m-pill" id="m-pill"><span id="m-bubble-text"></span></span></div>
</div>`;
}

/* ---------- the css ----------
   no transition and no animation anywhere in here, on purpose: one captured
   frame carries five or six BeginFrames, so a css animation resolves about five
   times too fast and a transition would smear every value the render writes.
   every moving number is written per frame by apply().

   the colours are the page's own tokens and nothing else. --face and --eye are
   the mascot's two, --eye is always the page background, and that is the whole
   reason the face reads as a hole punched in the page rather than as an
   illustration sitting on it. */
export function mascotCss(plan) {
  const B = plan.box, S = plan.size;
  const dotCss = BUBBLE.dots
    .map((d, i) => `#m-dot${i}{width:${d.d}px;height:${d.d}px;margin-bottom:${d.lift}px}`)
    .join('\n');
  return `
/* the two themes, as tokens, so switching is one attribute rather than a
   restyle. the light green and the dark green are different colours on purpose
   and neither of them is used here — the mascot has no accent. --bub is the
   site's own outline token and it is what the thought bubble is drawn in. */
.m-zone{
  --face:#0b0d10; --eye:#ffffff; --bub:rgba(11,13,16,.55);
  --m-shadow-o:1; --m-glow-o:0;
  position:absolute; left:${B.left}px; top:${B.top}px;
  width:${S}px; height:${S}px; z-index:4; pointer-events:none;
}
[data-theme=dark] .m-zone{
  --face:#f4f7f5; --eye:#06070a; --bub:rgba(213,219,216,.5);
  /* the shadow is off on black, because a soft black ellipse on #06070a is
     nothing, and the glow does the grounding instead. */
  --m-shadow-o:0; --m-glow-o:1;
}
.m-card{position:absolute; inset:0; will-change:transform}
.m-face,.m-glow{position:absolute; inset:0; width:100%; height:100%; display:block; overflow:visible}
.m-plate{fill:var(--face)}
.m-iris{fill:var(--eye)}
/* the lid is the card's own colour, so it is invisible everywhere except over
   the eye it is coming down on. */
.m-lid{fill:var(--face)}
.m-brow{fill:var(--eye); opacity:0}
.m-eye{will-change:transform}

/* the glow. two blurred copies of the plate behind it, dark theme only, and it
   is around the head only because the copies are the head. post10's phosphor
   with the numbers walked down: quiet, not neon. */
.m-glow{pointer-events:none; opacity:0}
.m-glow-mid{filter:blur(${GLOW.mid.blur}px)}
.m-glow-wide{filter:blur(${GLOW.wide.blur}px)}

/* the shadow. one soft ellipse under the card, and it grows, softens and fades
   as the head leaves the ground — the same lift model the pictograms use, which
   is what makes a hop read as a hop rather than as a slide up the frame. */
.m-shadow{
  position:absolute; left:50%; top:${n(50 + SHADOW.dy * 100)}%;
  width:${n(S * SHADOW.w)}px; height:${n(S * SHADOW.h)}px;
  margin-left:${n(-S * SHADOW.w / 2)}px; margin-top:${n(-S * SHADOW.h / 2)}px;
  border-radius:50%; background:var(--face); opacity:0;
  will-change:transform,opacity,filter;
}

/* ---------- the thought bubble ----------
   index.html's own, with one dot dropped and the whole cluster pulled in.

   the site draws a rounded pill in the page colour with a hairline --bub
   outline, and three dots climbing off the top right of the head toward it. it
   is a thought rather than a caption card, and the outline is what makes it
   one: a filled block beside a filled head is two blocks.

   three things are different here and all three are about phone size.

   two dots, not three. the smallest is 5px on the page; at 1080 wide that is
   ten device px of outline and it reads as a speck rather than as a beat.

   the cluster sits closer. the site holds it 12px off the mascot zone, and the
   zone is four px wider than the ink, so on the page the first dot is sixteen
   from the head. the gap here is five css px, which is ten device px, and at
   phone size that is the difference between attached to him and near him.

   the outline is 1.5px rather than 1. three device px survives h.264 at crf 17;
   two does not reliably, and an outline the encoder eats is a filled block with
   extra steps.

   the colours are the mascot's own two tokens and the site's third. --eye is
   defined to always equal the page background, so it is the pill's fill and it
   inverts with the theme for free; --face is the ink and so the text; --bub is
   the site's own outline token. nothing here glows: the bubble is a sibling of
   the card rather than a child of it, so the glow layers cannot reach it, and
   it does not squash when the head does either. */
.bubble{
  position:absolute; left:${n(S * (HEAD.plate.x + HEAD.plate.s) / GRID + BUBBLE.gap)}px;
  bottom:${n(S * (1 - (HEAD.plate.y + HEAD.plate.s * 0.34) / GRID))}px;
  display:flex; align-items:flex-end; gap:${BUBBLE.dotGap}px;
  /* max-content is load bearing, and it is the site's note as well: an
     absolutely positioned box shrink to fits against its containing block, and
     the zone is only as wide as the head, so without this the pill is squeezed
     to its minimum and wraps two words onto two lines. */
  width:max-content;
  pointer-events:none; z-index:5;
}
.m-dot{
  display:block; border-radius:50%;
  background:var(--eye); border:${BUBBLE.stroke}px solid var(--bub);
  opacity:0; will-change:transform,opacity;
}
${dotCss}
.m-pill{
  margin-bottom:${BUBBLE.pillLift}px;
  padding:${BUBBLE.padY}px ${BUBBLE.padX}px;
  border:${BUBBLE.stroke}px solid var(--bub); border-radius:${BUBBLE.radius}px;
  background:var(--eye); color:var(--face);
  font-family:var(--body); font-weight:${BUBBLE.weight}; font-size:${BUBBLE.size}px;
  line-height:1.25; letter-spacing:.005em; white-space:nowrap;
  /* the site springs it from its bottom left, which is the corner nearest the
     dots, so it grows out of them rather than out of its own middle. */
  transform-origin:0% 100%; opacity:0; will-change:transform,opacity;
}`;
}

/* what the page needs and nothing else. the plan itself is json, so this is
   only the parts apply() reads on every frame. */
export function mascotPagePlan(plan) {
  return {
    size: plan.size, unit: plan.unit, box: plan.box, plate: plan.plate,
    theme: plan.theme, stage: plan.stage, safe: plan.safe, band: plan.band,
    grid: GRID, eyeCx: EYE_CX, eye: HEAD.eye, brow: HEAD.brow,
    glow: GLOW, shadow: SHADOW, headPx: { ...HEAD_PX },
  };
}

/* ---------- the page half ----------
   it writes numbers to elements and it decides nothing. there is no gsap in
   here and no clock: node holds the whole animation, and this is the reader.

   serialised into the render with .toString(), so it must not close over
   anything — everything it needs arrives on window.__MAS_PLAN. */
export function mascotPage() {
  const P = window.__MAS_PLAN;
  const card = document.getElementById('m-card');
  const shadow = document.getElementById('m-shadow');
  const bubble = document.getElementById('m-bubble');
  const bubbleText = document.getElementById('m-bubble-text');
  const pill = document.getElementById('m-pill');
  const dots = [document.getElementById('m-dot0'), document.getElementById('m-dot1')];
  const plate = card.querySelector('.m-face .m-plate');
  const eyes = [...card.querySelectorAll('.m-eye')];
  const lids = eyes.map(e => e.querySelector('.m-lid'));
  const brows = [...card.querySelectorAll('.m-brow')];
  const glows = [...card.querySelectorAll('.m-glow')];

  /* the origin sandwich, written out rather than left to transform-box: a
     translate inside an svg is in user units, so this is exact at any scale and
     does not depend on which reference box a browser picks. */
  function about(ox, oy, dx, dy, rot, sx, sy) {
    let s = '';
    if (dx || dy) s += 'translate(' + dx.toFixed(3) + ' ' + dy.toFixed(3) + ') ';
    s += 'translate(' + ox.toFixed(3) + ' ' + oy.toFixed(3) + ') ';
    if (rot) s += 'rotate(' + rot.toFixed(3) + ') ';
    if (sx !== 1 || sy !== 1) s += 'scale(' + sx.toFixed(4) + ' ' + sy.toFixed(4) + ') ';
    s += 'translate(' + (-ox).toFixed(3) + ' ' + (-oy).toFixed(3) + ')';
    return s;
  }

  let lastText = null;

  window.__mas = {
    ready: false,
    build() {
      this.ready = true;
      const r = plate.getBoundingClientRect();
      /* the outline as it actually computed, and the air between the ink and
         the first dot, both in device px. the second is measured off the two
         rendered rects rather than off the css that positions them, because the
         css is in css px against a box that is wider than the head. */
      const dr = dots[0].getBoundingClientRect();
      const cs = getComputedStyle(dots[0]);
      return {
        headCss: +r.width.toFixed(2),
        headPx: +(r.width * P.stage.dsf).toFixed(1),
        strokeCss: +parseFloat(cs.borderTopWidth).toFixed(2),
        strokePx: +(parseFloat(cs.borderTopWidth) * P.stage.dsf).toFixed(1),
        bubbleGapPx: +((dr.left - r.right) * P.stage.dsf).toFixed(1),
        eyes: eyes.length, brows: brows.length, glows: glows.length, dots: dots.length,
        theme: document.documentElement.getAttribute('data-theme'),
      };
    },
    /* one call switches the theme. both variants go through every guard below,
       which is the point of it being one call. */
    theme(t) { document.documentElement.setAttribute('data-theme', t); },

    apply(f) {
      card.style.transform = 'translate(' + f.card.x.toFixed(3) + 'px,' + f.card.y.toFixed(3) + 'px) '
        + 'rotate(' + f.card.rot.toFixed(3) + 'deg) '
        + 'scale(' + f.card.sx.toFixed(4) + ',' + f.card.sy.toFixed(4) + ')';

      /* the shadow follows the card's x but never its y: a shadow that rose with
         the head would be painted on the head's own back. it takes the lift
         instead, which is what makes a hop read as a hop, and the turn's own
         slide, because the mass moved. */
      shadow.style.opacity = (f.shadow.o).toFixed(4);
      shadow.style.filter = 'blur(' + f.shadow.blur.toFixed(2) + 'px)';
      shadow.style.transform = 'translateX(' + (f.card.x + f.shadow.x).toFixed(3) + 'px) '
        + 'scale(' + f.shadow.sc.toFixed(4) + ',' + (1 / f.shadow.sc).toFixed(4) + ')';

      for (let k = 0; k < 2; k++) {
        const e = f.eyes[k], cx = P.eyeCx[k], cy = P.eye.cy;
        eyes[k].setAttribute('transform', about(cx, cy, e.x, e.y, 0, e.sx, e.sy));
        /* nought puts the lid's bottom edge on the eye's top edge, one puts it
           on the eye's bottom edge. that is the whole blink. */
        lids[k].setAttribute('transform',
          'translate(0 ' + (e.lid * P.eye.h).toFixed(4) + ')');
        const b = f.brows[k];
        brows[k].style.opacity = b.o.toFixed(4);
        brows[k].setAttribute('transform',
          about(P.eyeCx[k], P.brow.cy, b.x, b.y, b.rot, 1, 1));
      }

      glows[0].style.opacity = (f.glow * P.glow.wide.o).toFixed(4);
      glows[1].style.opacity = (f.glow * P.glow.mid.o).toFixed(4);

      if (f.bubble.text !== lastText) {
        bubbleText.textContent = f.bubble.text || '';
        lastText = f.bubble.text;
      }
      /* the container carries visibility and nothing else. every guard
         downstream asks it whether the cluster is on screen, and it is on screen
         from its first dot — which is the conservative answer, and the one a
         safe area check wants. the three parts carry the animation. */
      bubble.style.visibility = f.bubble.o < 0.004 ? 'hidden' : 'visible';
      for (let k = 0; k < 2; k++) {
        const d = f.bubble.dots[k];
        dots[k].style.opacity = d.o.toFixed(4);
        dots[k].style.transform = 'scale(' + d.sc.toFixed(4) + ')';
      }
      const p = f.bubble.pill;
      pill.style.opacity = p.o.toFixed(4);
      pill.style.transform = 'translateY(' + p.y.toFixed(3) + 'px) scale(' + p.sc.toFixed(4) + ')';
    },

    /* the bubble's clearance, in device px from each border, measured off the
       rendered rect rather than off the box it was told to draw in — a caption
       whose text is one glyph wider than expected is exactly the thing this
       catches, and there is no way to know that without measuring it.

       the head is deliberately not in here. it is turned and scaled, and a
       browser's rect for a turned shape is the box of its geometry rather than
       of its ink, so measuring it would report a circle getting wider when it
       rotates. headRect in node works it out from the geometry instead. */
    bubbleSafe(vw, vh) {
      const bs = getComputedStyle(bubble);
      if (bs.visibility === 'hidden') return null;
      const r = bubble.getBoundingClientRect(), d = P.stage.dsf;
      return {
        left: +(r.left * d).toFixed(1), top: +(r.top * d).toFixed(1),
        right: +((vw - r.right) * d).toFixed(1), bottom: +((vh - r.bottom) * d).toFixed(1),
        w: +(r.width * d).toFixed(1),
      };
    },

    /* the bubble against the caption band. a band is a css rect the clip has
       reserved for words; the bubble may not enter it at all. no band, nothing
       to check, which is the standalone export's case. */
    band() {
      if (!P.band) return null;
      const bs = getComputedStyle(bubble);
      if (bs.visibility === 'hidden') return null;
      const r = bubble.getBoundingClientRect(), b = P.band;
      const hit = r.right > b.x && r.left < b.x + b.w && r.bottom > b.y && r.top < b.y + b.h;
      return { hit: hit, rect: { l: +r.left.toFixed(1), t: +r.top.toFixed(1), r: +r.right.toFixed(1), b: +r.bottom.toFixed(1) } };
    },

    /* the type, measured. the cap height is read off the rendered glyphs rather
       than assumed from the ratio, so a font that failed to load is caught here
       rather than in a review. */
    caps() {
      const cv = document.createElement('canvas').getContext('2d');
      const cs = getComputedStyle(bubbleText);
      cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      const m = cv.measureText('H');
      const cap = (m.actualBoundingBoxAscent || 0);
      return { capCss: +cap.toFixed(2), capPx: +(cap * P.stage.dsf).toFixed(1), font: cv.font };
    },
  };
}

/* the runtime, as one string, for a render to splice in. there is no library in
   it: the page half is thirty lines of dom writing and gsap stays in node. */
export function mascotRuntime() {
  return [mascotPage.toString(), 'mascotPage();'].join('\n');
}

/* ---------- a printable summary ----------
   the plan as a card for the terminal, so a cut can be read before minutes are
   spent on frames. */
export function describeMascot(plan) {
  const out = [];
  out.push('  ' + plan.marks.length + ' marks, ' + plan.seconds.toFixed(2) + 's, '
    + plan.theme + ', head ' + plan.headPx.toFixed(0) + 'px at 1080 wide, resting turn '
    + plan.bias.toFixed(2) + ', ' + plan.idle.blinks.length + ' blinks, '
    + plan.idle.saccades.length + ' saccades');
  for (const m of plan.marks) {
    out.push('    ' + m.t.toFixed(2).padStart(5) + '..' + m.out.toFixed(2).padStart(5)
      + '  ' + m.state.padEnd(12)
      + 'entry ' + m.entry.toFixed(2) + ' hold ' + m.hold.toFixed(2) + ' exit ' + m.exit.toFixed(2)
      + (m.turn != null ? '  turn ' + m.turn.toFixed(2) : '')
      + (m.authorsTurn ? '  turns' : '')
      + (m.bubbles || []).map(b => '  bubble "' + b.text + '" ' + b.in.toFixed(2)
        + '..' + b.out.toFixed(2)).join(''));
    out.push('              ' + m.label);
  }
  for (const note of plan.notes) out.push('    note: ' + note);
  return out.join('\n');
}

/* the motion report, printed the way the brief asks for it: per state, how many
   frames the entrance took, how far it went past the mark, how long it took to
   settle, and the head's size in device px. */
export function describeMotion(rep) {
  const out = [];
  out.push('  ' + rep.frames + ' frames at ' + rep.fps + 'fps, head ' + rep.headPx.toFixed(0)
    + 'px, caps ' + rep.capPx.toFixed(0) + 'px, squash peak ' + (rep.maxSquash * 100).toFixed(1)
    + '%, breathing ' + (rep.maxBreathe * 100).toFixed(2) + '%');
  out.push('  state         anti  entry   over   settle   mark');
  for (const s of rep.states) {
    out.push('    ' + s.state.padEnd(12)
      + String(s.antiFrames).padStart(3) + 'f'
      + String(s.entryFrames == null ? '--' : s.entryFrames + 'f').padStart(7)
      + (s.overshoot.toFixed(1) + '%').padStart(8)
      + (s.settleMs == null ? '--' : s.settleMs + 'ms').padStart(9)
      + '   ' + s.chan + ' to ' + s.to);
  }
  out.push('  blinks: ' + rep.blinks.count + ', ' + rep.blinks.unique
    + ' distinct, ' + rep.blinks.repeatsInARow + ' identical in a row');
  out.push('  secondary: card ' + rep.lagFrames.toFixed(0) + ' frames behind the rig, eyes lead it by '
    + rep.maxLead.toFixed(2) + ' grid units at the fastest');
  out.push('  turn: ' + rep.turn.lo.toFixed(2) + ' to ' + rep.turn.hi.toFixed(2)
    + ', card squeezed ' + (rep.turn.squeeze * 100).toFixed(1) + '% at the most, eyes travelled '
    + rep.turn.offsetPx.toFixed(0) + 'px, gap closed ' + rep.turn.gapWas + ' to '
    + rep.turn.gap.toFixed(1) + ' units, ' + rep.turn.clampedFrames + ' frames clamped');
  out.push('  mask: worst feature ink ' + (rep.outside.units <= 0
    ? (-rep.outside.units).toFixed(2) + ' units inside the head silhouette'
    : 'OUTSIDE the head by ' + rep.outside.units.toFixed(2) + ' units at ' + rep.outside.at.toFixed(2) + 's'));
  out.push('  frozen: ' + rep.frozenFrames + ' frames inside a run of three or more still ones');
  return out.join('\n');
}

/* ---------- the engine's own checks ----------
   node lib/mascot.mjs test. no browser, about a second. what it proves is the
   part of this file a render cannot: that the geometry is the spec's geometry,
   that the squash preserves volume, that the card really does lag the rig, that
   the eyes really do lead it, that every state arrives with an overshoot and
   settles, that the states read differently from each other, that the turn is
   continuous and does all five of its jobs, that the bubble arrives in the
   right order, and that no two blinks in a clip are the same blink. */
function selfTest() {
  const fail = [];
  const ok = (name, cond, detail) => {
    console.log('  ' + (cond ? 'ok  ' : 'FAIL') + '  ' + name + (detail ? '  ' + detail : ''));
    if (!cond) fail.push(name);
  };

  /* the geometry, against skills/page-builder/SKILL.md's ratio table. */
  const D = HEAD.plate.s;
  ok('face fills 94% of the frame', Math.abs(D / GRID - 0.94) < 0.005, (D / GRID * 100).toFixed(1) + '%');
  ok('eye width is 21.7% of the face', Math.abs(HEAD.eye.w / D - 0.217) < 0.002, (HEAD.eye.w / D * 100).toFixed(1) + '%');
  ok('eye height is 7.3% of the face', Math.abs(HEAD.eye.h / D - 0.073) < 0.002, (HEAD.eye.h / D * 100).toFixed(1) + '%');
  ok('eyes are 2.95 : 1', Math.abs(HEAD.eye.w / HEAD.eye.h - 2.95) < 0.02, (HEAD.eye.w / HEAD.eye.h).toFixed(2) + ':1');
  ok('eyes sit 35% apart', Math.abs(HEAD.eye.sep / D - 0.35) < 0.002, (HEAD.eye.sep / D * 100).toFixed(1) + '%');
  ok('eyes sit 10.8% below centre',
    Math.abs((HEAD.eye.cy - (HEAD.plate.y + D / 2)) / D - 0.108) < 0.002,
    ((HEAD.eye.cy - (HEAD.plate.y + D / 2)) / D * 100).toFixed(1) + '%');
  ok('radius 0.5 is the circle the site ships', HEAD.radius * D === D / 2, 'rx ' + (HEAD.radius * D));

  /* the curves. */
  const H = mascotEases(g, CustomEase, houseEases);
  const pop = g.parseEase(H.pop);
  let peak = 0;
  for (let i = 0; i <= 1000; i++) peak = Math.max(peak, pop(i / 1000));
  ok('the arrival curve overshoots', peak >= 1.08 && peak <= 1.12, '+' + ((peak - 1) * 100).toFixed(1) + '%');
  const shut = g.parseEase(H.shut), open = g.parseEase(H.open);
  ok('the lid shuts accelerating', shut(0.5) < 0.42, 'half way at ' + shut(0.5).toFixed(3));
  ok('the lid opens decelerating', open(0.5) > 0.58, 'half way at ' + open(0.5).toFixed(3));
  /* nothing anywhere is linear, and the calm curve is the reason this is
     measured over the whole range rather than at the midpoint: glide is the
     site's own symmetric in-out, so it passes through exactly 0.5 at half way
     and a midpoint test would call the one curve every fade in the file uses a
     straight line. */
  const bend = e => {
    const f = g.parseEase(e);
    let d = 0;
    for (let i = 1; i < 100; i++) d = Math.max(d, Math.abs(f(i / 100) - i / 100));
    return d;
  };
  const bends = [H.pop, H.drift, H.glide, H.heavy, H.shut, H.open].map(bend);
  ok('nothing in the ease set is linear', bends.every(d => d > 0.03),
    'least bent is ' + Math.min(...bends).toFixed(3) + ' off the straight line');

  /* a plan with every state in it, which is what the test clip renders. */
  const marks = [];
  let t = 0.5;
  for (const s of STATE_NAMES) {
    marks.push({ t: +t.toFixed(2), state: s });
    t += STATES[s].entry + STATES[s].hold + STATES[s].exit + 0.25;
  }
  const plan = planMascot({ marks, seconds: +(t + 0.4).toFixed(2), theme: 'light' });
  ok('a plan with every state builds', plan.marks.length === STATE_NAMES.length,
    plan.marks.length + ' states, ' + plan.seconds.toFixed(2) + 's');
  ok('the head is inside the phone window',
    plan.headPx >= HEAD_PX.min && plan.headPx <= HEAD_PX.max, plan.headPx.toFixed(0) + 'px');
  ok('the head sits inside the safe area',
    plan.box.left * STAGE.dsf + HEAD.plate.x * plan.unit * STAGE.dsf >= SAFE.left - 1,
    'left ' + ((plan.box.left + HEAD.plate.x * plan.unit) * STAGE.dsf).toFixed(0) + 'px');

  const rep = mascotMotion(plan, 60, plan.seconds);

  /* the squash, and it is volume preserving by construction rather than by
     luck: the two scales are read off one channel, so this checks the ceiling
     rather than the arithmetic. */
  ok('the squash never passes 8%', rep.maxSquash <= SQ_MAX + 1e-6, (rep.maxSquash * 100).toFixed(1) + '%');
  ok('breathing stays under 2%', rep.maxBreathe < BREATHE_MAX, (rep.maxBreathe * 100).toFixed(2) + '%');
  ok('the face is never frozen', rep.frozenFrames === 0, rep.frozenFrames + ' frames');
  ok('the eyes lead the card', rep.maxLead > 0.2 && rep.maxLead <= LEAD_CAP + 1e-6,
    rep.maxLead.toFixed(2) + ' grid units at the fastest, capped at ' + LEAD_CAP);

  /* every state arrives, overshoots and settles. unimpressed is the declared
     exception on the overshoot: its whole read is that it cannot be bothered,
     so it arrives on the heavy curve and going past the mark would be wrong. */
  for (const s of rep.states) {
    ok(s.state + ' arrives', s.entryFrames != null && s.entryFrames > 0, s.entryFrames + ' frames');
    if (s.state === 'unimpressed') {
      ok(s.state + ' does not overshoot, on purpose', s.overshoot < 1.0, s.overshoot.toFixed(1) + '%');
    } else {
      ok(s.state + ' overshoots and settles', s.overshoot > 1.0 && s.settleFrames > 0,
        '+' + s.overshoot.toFixed(1) + '%, settles in ' + s.settleMs + 'ms');
    }
  }
  /* anticipation. every state that snaps pulls the other way first; the two
     that deliberately do not (neutral is a breath, unimpressed is a sink) are
     named rather than excused by a loose threshold. */
  for (const s of rep.states) {
    const wants = !['neutral', 'unimpressed'].includes(s.state);
    if (wants) ok(s.state + ' anticipates', s.antiFrames >= 2, s.antiFrames + ' frames back');
  }

  /* the card lags the rig. measured on the frame where the fastest move happens
     rather than asserted from the constant. */
  let maxLag = 0;
  for (let f = 0; f < Math.round(60 * plan.seconds); f++) {
    const fr = mascotFrame(plan, f / 60);
    maxLag = Math.max(maxLag, Math.hypot(fr.head.x - fr.card.x, fr.head.y - fr.card.y));
  }
  ok('the card lags the rig', maxLag > 0.5, maxLag.toFixed(2) + 'px apart at the fastest');
  ok('the lag is under four frames', LAG * 60 <= 4, (LAG * 60).toFixed(0) + ' frames');

  /* the states read differently from each other. the distance is over the pose
     at each state's own settled moment, in the channels a viewer reads, and the
     check is that no two of them land in the same place. */
  const poses = rep.states.map((s, i) => {
    const m = plan.marks[i];
    const fr = mascotFrame(plan, m.settled + 0.05);
    return {
      state: s.state,
      v: [fr.head.y / 12, fr.head.x / 6, fr.head.rot / 10, (fr.head.sc - 1) * 20,
        fr.eyes[0].sy - 1, fr.eyes[1].sy - 1, fr.eyes[0].x / 3,
        fr.eyes[0].lid * 2, fr.brows[0].o, fr.head.lift, fr.turn.lead * 2],
    };
  });
  let closest = 1e9, pair = null;
  for (let i = 0; i < poses.length; i++) {
    for (let j = i + 1; j < poses.length; j++) {
      const d = Math.hypot(...poses[i].v.map((v, k) => v - poses[j].v[k]));
      if (d < closest) { closest = d; pair = poses[i].state + '/' + poses[j].state; }
    }
  }
  ok('no two states settle into the same pose', closest > 0.55,
    'closest pair ' + pair + ' at ' + closest.toFixed(2));

  /* no two blinks alike, in a row, and the plan throws rather than reports if
     they ever are — so this is the report that the throw never had to fire. */
  ok('no two blinks in a row are identical', rep.blinks.repeatsInARow === 0,
    rep.blinks.count + ' blinks, ' + rep.blinks.unique + ' distinct');

  /* ---------- the turn ----------
     the cheat is arithmetic on one number, so most of it can be proved without
     a browser: that the number is continuous, that every value between the ends
     draws something different, that the five moves all move, and that a state's
     own eye offset plus a full turn cannot put an eye on the cheek. */
  const sweep = planMascot({
    seconds: 9.0, bias: 0,
    marks: [{ t: 0.4, state: 'neutral', turn: -1, turnFor: 1.6 },
      { t: 2.6, state: 'neutral', turn: 1, turnFor: 2.4 },
      { t: 5.6, state: 'neutral', turn: 0, turnFor: 1.6 }],
  });
  const sweepRep = mascotMotion(sweep, 60, 9.0);
  ok('the turn reaches both ends', sweepRep.turn.lo <= -0.99 && sweepRep.turn.hi >= 0.99,
    sweepRep.turn.lo.toFixed(2) + ' to ' + sweepRep.turn.hi.toFixed(2));
  /* continuity, and the limit is in the units a viewer reads rather than in the
     channel's own. a step of d on the turn moves the far eye by
     d * (shift + wrap) grid units, so that is what the ceiling is set on: a
     fifth of an eye height per frame, which at sixty is a ramp and not a jump.
     stating it as a bare number on the channel would have been an opinion about
     a unit nobody looks at. */
  const eyeStep = sweepRep.worst.turn.d * (TURN.shift + TURN.wrap);
  ok('the turn never steps', eyeStep < 1.2,
    'biggest one frame step moves the far eye ' + eyeStep.toFixed(2) + ' units ('
    + (eyeStep * sweep.unit * STAGE.dsf).toFixed(1) + 'px) at '
    + sweepRep.worst.turn.t.toFixed(2) + 's');
  /* and it is not two poses with a dissolve between them: forty values across
     the sweep, forty different faces. */
  const seen = new Set();
  for (let i = 0; i <= 40; i++) {
    const fr = mascotFrame(sweep, 0.4 + i * (7.6 / 40));
    seen.add([fr.turn.lead, fr.eyes[0].x, fr.eyes[1].x, fr.eyes[0].sx, fr.card.sx].join('|'));
  }
  ok('every value on the way is its own pose', seen.size >= 38, seen.size + ' of 41 distinct');

  /* the five moves, at a full turn, measured rather than described. */
  let full = null;
  for (let i = 0; i <= 600; i++) {
    const fr = mascotFrame(sweep, i / 60);
    if (fr.turn.lead >= 0.999) { full = fr; break; }
  }
  ok('a full turn was reached', !!full);
  if (full) {
    const px = v => v * sweep.unit * STAGE.dsf;
    ok('the card squeezes', full.turn.squeeze > 0.05,
      (full.turn.squeeze * 100).toFixed(1) + '% of its width');
    ok('the eyes crowd the near edge', px(Math.abs(full.turn.offset[1])) > 30,
      'near eye ' + px(Math.abs(full.turn.offset[1])).toFixed(0) + 'px, far eye '
      + px(Math.abs(full.turn.offset[0])).toFixed(0) + 'px at 1080 wide');
    ok('the gap between the eyes closes', full.turn.gap < HEAD.eye.sep - 3,
      HEAD.eye.sep + ' units to ' + full.turn.gap.toFixed(1));
    /* the narrow eye is the one the turn carried toward the silhouette, and it
       is checked at both ends because a sign error is invisible at one of them.
       at a full turn to the right that is eye 1, on screen right; to the left
       it is eye 0. this assertion is here because the first build had it the
       other way round and a rendered sweep is what caught it. */
    ok('the leading eye is the narrow one, turning right',
      full.turn.far === 1 && full.eyes[1].sx < 0.62 && Math.abs(full.eyes[0].sx - 1) < 1e-6,
      'screen left ' + full.eyes[0].sx.toFixed(2) + ', screen right ' + full.eyes[1].sx.toFixed(2));
    let fullL = null;
    for (let i = 0; i <= 600; i++) {
      const fr = mascotFrame(sweep, i / 60);
      if (fr.turn.lead <= -0.999) { fullL = fr; break; }
    }
    ok('the leading eye is the narrow one, turning left',
      fullL && fullL.turn.far === 0 && fullL.eyes[0].sx < 0.62 && Math.abs(fullL.eyes[1].sx - 1) < 1e-6,
      fullL ? 'screen left ' + fullL.eyes[0].sx.toFixed(2) + ', screen right ' + fullL.eyes[1].sx.toFixed(2) : 'never reached');
    /* and the narrow one is also the one nearest the edge it turned toward,
       which is the whole claim: it wrapped around the form rather than sliding
       across it. */
    const edgeR = EYE_CX[1] + full.eyes[1].x, edgeL = EYE_CX[0] + full.eyes[0].x;
    ok('the narrow eye sits nearest the silhouette it turned toward', edgeR > edgeL,
      'screen right at ' + edgeR.toFixed(1) + ' units, screen left at ' + edgeL.toFixed(1));
    ok('the head tilts into the turn', Math.abs(full.card.rot) > 1.5,
      full.card.rot.toFixed(2) + ' degrees');
    ok('the shadow goes with the mass', Math.abs(full.shadow.x) > 1,
      full.shadow.x.toFixed(2) + 'px across');
    ok('the brows go with their own eyes',
      Math.abs(full.brows[1].x) > 5 && Math.abs(full.brows[0].x) > Math.abs(full.brows[1].x),
      'near ' + full.brows[1].x.toFixed(1) + ', far ' + full.brows[0].x.toFixed(1) + ' units');
    /* nothing may be sitting on the composition clamp on an ordinary sweep: a
       clamped eye is an eye that stopped moving, and a flat spot is the one
       thing that would give this away. */
    ok('a plain turn never reaches the clamp', sweepRep.turn.clampedFrames === 0,
      sweepRep.turn.clampedFrames + ' frames');
  }

  /* composition. a state that moves the eyes on its own, held at a full turn,
     still has both eyes on the face — which is what the clamp is for, and the
     check is that it holds rather than that it never fires. */
  const both = planMascot({
    seconds: 6.0, bias: 0,
    marks: [{ t: 0.4, state: 'curious', turn: 1, turnFor: 0.8 },
      { t: 3.0, state: 'surprised', turn: -1, turnFor: 0.8 }],
  });
  let worstEdge = -Infinity;
  const RR = HEAD.plate.s / 2, CXX = HEAD.plate.x + RR, CYY = HEAD.plate.y + RR;
  for (let i = 0; i < 360; i++) {
    const fr = mascotFrame(both, i / 60);
    for (let k = 0; k < 2; k++) {
      const e = fr.eyes[k];
      const dy = Math.abs(HEAD.eye.cy + e.y - CYY);
      const half = dy >= RR ? 0 : Math.sqrt(RR * RR - dy * dy);
      const edge = Math.abs(EYE_CX[k] - CXX + e.x) + HEAD.eye.w / 2 * Math.abs(e.sx);
      worstEdge = Math.max(worstEdge, edge - half);
    }
  }
  ok('a state and a full turn together keep both eyes on the face', worstEdge < -0.5,
    'closest an eye came to the edge: ' + (-worstEdge).toFixed(2) + ' units inside it');

  /* ---------- dead centre ----------
     at turn nought the two eyes are one shape twice, and the pair is centred on
     the head. it is asserted on the rig rather than on a screenshot because a
     rendered frame legitimately carries the head's own roll and its breathing,
     which tilt and scale both eyes together — that is the head moving, not the
     eyes differing, and a pixel test would call it a fault. */
  const dead = planMascot({
    seconds: 5.0, bias: 0, marks: [{ t: 0.3, state: 'neutral' }],
  });
  let asym = 0, asymAt = 0, centreOff = 0;
  for (let i = 0; i < 300; i++) {
    const fr = mascotFrame(dead, i / 60);
    if (Math.abs(fr.turn.lead) > 1e-9) continue;
    const a = fr.eyes[0], b = fr.eyes[1];
    const d = Math.max(Math.abs(a.sx - b.sx), Math.abs(a.sy - b.sy),
      Math.abs(a.y - b.y), Math.abs(a.x - b.x));
    if (d > asym) { asym = d; asymAt = i / 60; }
    /* how far the pair as a whole sits from the head's centre. it is allowed to
       be off centre — that is the eyes glancing, and they glance together — so
       what matters is that the displacement is *shared*: the pair moves as one
       rigid thing, and no part of the offset belongs to one eye and not the
       other. with the geometry table symmetric and both offsets equal, this sum
       is exactly twice the shared glance and nothing else. */
    const R2 = HEAD.plate.s / 2, CX2 = HEAD.plate.x + R2;
    centreOff = Math.max(centreOff,
      Math.abs((EYE_CX[0] + a.x - CX2) + (EYE_CX[1] + b.x - CX2)));
  }
  ok('at turn nought the eyes are identical', asym === 0,
    asym === 0 ? 'width, height and offset all equal on every frame'
      : 'differ by ' + asym.toFixed(4) + ' at ' + asymAt.toFixed(2) + 's');
  /* the pair is rigid: whatever it does, it does with both eyes at once. an
     earlier version of this asserted the pair sits dead on the centre line and
     that was simply wrong — it would have been asserting the mascot never looks
     sideways, and the saccades are the whole idle layer. what is checked is that
     the displacement is all shared glance, bounded by the glance's own
     amplitude plus the lead the eyes are allowed to take on a fast move. */
  const glanceCap = 2 * (IDLE.saccade.amp + LEAD_CAP);
  ok('at turn nought the pair only ever moves as one', centreOff <= glanceCap + 1e-9,
    'worst displacement ' + centreOff.toFixed(2) + ' units, all of it shared, cap '
    + glanceCap.toFixed(2));
  ok('the geometry table is symmetric to begin with',
    Math.abs((EYE_CX[0] + EYE_CX[1]) / 2 - (HEAD.plate.x + HEAD.plate.s / 2)) < 1e-9);
  /* and the straight on pose is the pose the mascot had before any of the turn
     maths existed: no squeeze, no tilt, no shift, no foreshortening, both eyes
     at rest. this is the regression guard on the neutral look. */
  const flat = mascotFrame(dead, 1.9);
  ok('straight on is untouched by the turn maths',
    flat.turn.squeeze === 0 && flat.turn.offset[0] === 0 && flat.turn.offset[1] === 0
    && flat.turn.far === null && flat.eyes[0].sx === 1 && flat.eyes[1].sx === 1
    && flat.eyes[0].sy === 1 && flat.eyes[1].sy === 1,
    'squeeze ' + flat.turn.squeeze + ', shifts ' + JSON.stringify(flat.turn.offset)
    + ', scales ' + flat.eyes[0].sx + '/' + flat.eyes[1].sx);

  /* ---------- nothing outside the head ----------
     the features are clipped in the markup, so nothing can paint outside the
     silhouette. this is the check that the clip never has to do it: every
     visible feature, on every frame of a plan that puts every state through a
     full turn, stays inside the head's own outline.

     `surprised` at a turn is the case this was written for. the lid slab is
     card coloured and oversized so that it covers the eye at any scale, and at
     two and a half times the eye height with a turn on top its top corner used
     to leave the head and paint a block of face colour on the background near
     the crown. */
  const stress = [];
  let st = 0.4;
  for (const name of STATE_NAMES) {
    const turnable = !STATES[name].authorsTurn;
    for (const tn of turnable ? [0.85, -0.85] : [null]) {
      stress.push({ t: +st.toFixed(2), state: name, turn: tn == null ? undefined : tn, turnFor: 0.4 });
      st += STATES[name].entry + STATES[name].hold + STATES[name].exit + 0.2;
    }
  }
  const stressPlan = planMascot({ marks: stress, seconds: +(st + 0.4).toFixed(2), bias: 0 });
  const stressRep = mascotMotion(stressPlan, 60, stressPlan.seconds);
  ok('no feature ink lands outside the head, in any state at any turn',
    stressRep.outside.units <= 0,
    stressRep.outside.units <= 0
      ? 'closest approach ' + (-stressRep.outside.units).toFixed(2) + ' units inside the edge'
      : 'OUT by ' + stressRep.outside.units.toFixed(2) + ' units at ' + stressRep.outside.at.toFixed(2) + 's');

  /* the resting bias follows the corner, which is the whole reason it is one
     number rather than a sign written into each state. */
  const left = planMascot({ seconds: 4, marks: [{ t: 0.3, state: 'neutral' }], pos: 'bottom-left' });
  const right = planMascot({ seconds: 4, marks: [{ t: 0.3, state: 'neutral' }], pos: 'bottom-right' });
  ok('he looks into the frame from either corner',
    left.bias === TURN.bias && right.bias === -TURN.bias,
    'left ' + left.bias + ', right ' + right.bias);
  ok('an explicit bias wins',
    planMascot({ seconds: 4, marks: [{ t: 0.3, state: 'neutral' }], bias: -0.2 }).bias === -0.2);
  /* the turn is where he is facing rather than a gesture, so an exit leaves it
     where it is — otherwise turn-away would be a twitch. */
  const stays = planMascot({
    seconds: 7.0,
    marks: [{ t: 0.3, state: 'turn-away' }, { t: 3.2, state: 'neutral' }],
  });
  const after = mascotFrame(stays, 5.4);
  ok('a turn outlives the state that made it', Math.abs(after.turn.lead - TURN.away) < 0.02,
    'still at ' + after.turn.lead.toFixed(2) + ' two states later');
  let threwTurn = false;
  try {
    planMascot({ seconds: 5, marks: [{ t: 0.3, state: 'snap-back', turn: 0.5 }] });
  } catch (e) { threwTurn = /turns on its own/.test(e.message); }
  ok('a mark may not set the turn on a state that turns', threwTurn);
  let threwRange = false;
  try {
    planMascot({ seconds: 5, marks: [{ t: 0.3, state: 'neutral', turn: 1.4 }] });
  } catch (e) { threwRange = /-1\.\.1/.test(e.message); }
  ok('a turn outside the range is refused', threwRange);

  /* ---------- the bubble ----------
     the site's thought bubble, so the checks are about the shape of the gesture
     rather than about the css, which only a render can see. */
  const bub = planMascot({
    seconds: 6.0, marks: [{ t: 0.4, state: 'neutral', bubble: 'go on' }],
  });
  const bm = bub.marks[0].bubble;
  const at = tt => mascotFrame(bub, tt).bubble;
  /* the dots lead the pill in, by the site's own seventy milliseconds. */
  const early = at(bm.in + BUBBLE.step * 0.9);
  ok('the small dot arrives first',
    early.dots[0].o > 0.25 && early.dots[1].o < early.dots[0].o && early.pill.o < 0.02,
    'dot0 ' + early.dots[0].o.toFixed(2) + ', dot1 ' + early.dots[1].o.toFixed(2)
    + ', pill ' + early.pill.o.toFixed(2));
  const mid = at(bm.in + BUBBLE.step * 2.2);
  ok('the larger dot follows it', mid.dots[1].o > 0.5 && mid.pill.o < mid.dots[1].o,
    'dot1 ' + mid.dots[1].o.toFixed(2) + ', pill ' + mid.pill.o.toFixed(2));
  /* the pill overshoots, which is the difference between arriving and
     appearing, and everything is solid once the cluster is out. */
  let pillPeak = 0;
  for (let i = 0; i < 60; i++) pillPeak = Math.max(pillPeak, at(bm.in + i / 60).pill.sc);
  ok('the pill overshoots and settles', pillPeak > 1.02, 'peaks at ' + pillPeak.toFixed(3));
  const outAll = at(bm.full + 0.05);
  ok('the whole cluster is out together',
    outAll.dots[0].o > 0.98 && outAll.dots[1].o > 0.98 && outAll.pill.o > 0.98);
  /* and it leaves in the other order: the pill first, the small dot last. */
  const leaving = at(bm.leaving + BUBBLE.outStep * 1.6);
  ok('the pill leaves first', leaving.pill.o < leaving.dots[0].o,
    'pill ' + leaving.pill.o.toFixed(2) + ', dot0 ' + leaving.dots[0].o.toFixed(2));
  ok('two dots, not three', BUBBLE.dots.length === 2);
  /* a whole css pixel, because chrome floors border-width to one and a
     fractional stroke silently halves — the export guard found that, and this
     is the check that stops it being written back. */
  ok('the outline is a whole css pixel',
    BUBBLE.stroke === Math.round(BUBBLE.stroke) && BUBBLE.stroke * STAGE.dsf >= 4,
    BUBBLE.stroke + ' css, ' + BUBBLE.stroke * STAGE.dsf + ' device');
  /* the sound lands on the pill rather than on the wind up. */
  const cue = mascotCues(bub).find(c => c.kind === SFX.bubble);
  ok('the pop lands with the pill', Math.abs(cue.t - (bm.in + BUBBLE.step * 2)) < 1e-6,
    cue.t.toFixed(3) + 's against the pill at ' + (bm.in + BUBBLE.step * 2).toFixed(3));

  /* the bubble guards, unchanged by the new look. */
  let threw = false;
  try { planMascot({ marks: [{ t: 0.4, state: 'neutral', bubble: 'one two three four five' }], seconds: 4 }); }
  catch (e) { threw = /ceiling/.test(e.message); }
  ok('a five word bubble is refused', threw);
  threw = false;
  try { planMascot({ marks: [{ t: 0.4, state: 'neutral', bubble: 'yes — no' }], seconds: 4 }); }
  catch (e) { threw = /dash/.test(e.message); }
  ok('a bubble with a dash in it is refused', threw);

  /* ---------- a run of bubbles ----------
     the opt in path, and the first thing it has to prove is that it is opt in:
     a mark carrying one string plans exactly what it planned before this
     existed, which is what the numbers above have already asserted. */
  const run = planMascot({
    seconds: 9.0,
    marks: [{ t: 0.4, state: 'neutral', bubbles: [
      { t: 1.30, text: 'hey' }, { t: 2.40, text: 'привет' }, { t: 3.50, text: 'labdien' },
    ] }],
  });
  const rb = run.marks[0].bubbles;
  ok('a mark can say three things in a row', rb.length === 3,
    rb.map(b => b.in.toFixed(2) + '..' + b.out.toFixed(2)).join('  '));
  ok('a run uses the quick profile', rb.every(b => b.profile === BUBBLE.quick),
    'each one lives ' + (rb[0].out - rb[0].in).toFixed(2) + 's against the ordinary '
    + (BUBBLE.in + 0.42 + BUBBLE.out).toFixed(2));
  /* the pill holds one string at a time, and that is the whole reason overlap is
     refused rather than resolved. */
  const said = t => mascotFrame(run, t).bubble.text;
  ok('each bubble is the one on screen at its own time',
    said(rb[0].full + 0.05) === 'hey' && said(rb[1].full + 0.05) === 'привет'
    && said(rb[2].full + 0.05) === 'labdien');
  ok('nothing is said between them', said(rb[0].out + 0.02) === null,
    'the pill is empty at ' + (rb[0].out + 0.02).toFixed(2) + 's');
  ok('one pop per bubble', mascotCues(run).filter(c => c.kind === SFX.bubble).length === 3);
  ok('a single bubble still reports as one', bub.marks[0].bubbles.length === 1
    && bub.marks[0].bubble === bub.marks[0].bubbles[0]);
  threw = false;
  try {
    planMascot({ seconds: 9, marks: [{ t: 0.4, state: 'neutral', bubbles: [
      { t: 1.30, text: 'hey' }, { t: 1.45, text: 'again' }] }] });
  } catch (e) { threw = /overlap/.test(e.message); }
  ok('two bubbles on screen at once are refused', threw);
  threw = false;
  try {
    planMascot({ seconds: 9, marks: [{ t: 0.4, state: 'neutral',
      bubble: 'go on', bubbles: [{ t: 1.3, text: 'hey' }] }] });
  } catch (e) { threw = /pick one/.test(e.message); }
  ok('a mark may not carry both spellings', threw);
  threw = false;
  try {
    planMascot({ seconds: 9, marks: [{ t: 0.4, state: 'neutral',
      bubbles: [{ t: 1.3, text: 'yes — no' }] }] });
  } catch (e) { threw = /dash/.test(e.message); }
  ok('the dash rule reaches inside a run', threw);

  threw = false;
  try { planMascot({ marks: [{ t: 0.4, state: 'nope' }], seconds: 4 }); }
  catch (e) { threw = /no state called/.test(e.message); }
  ok('an unknown state is refused', threw);
  threw = false;
  try { planMascot({ marks: [{ t: 0.4, state: 'curious' }, { t: 0.9, state: 'neutral' }], seconds: 4 }); }
  catch (e) { threw = /needs/.test(e.message); }
  ok('a mark with no room for its own entrance is refused', threw);
  threw = false;
  try { planMascot({ marks: [{ t: 0.4, state: 'neutral' }], seconds: 4, size: 300 }); }
  catch (e) { threw = /device px/.test(e.message); }
  ok('a head outside the phone window is refused', threw);

  /* both themes plan and animate identically — the theme is colour and nothing
     else, which is what lets one call switch it. */
  const dark = planMascot({ marks, seconds: plan.seconds, theme: 'dark' });
  const a = mascotFrame(plan, 2.0), b = mascotFrame(dark, 2.0);
  ok('the theme changes nothing but colour',
    JSON.stringify({ ...a, glow: 0 }) === JSON.stringify({ ...b, glow: 0 }));
  ok('only dark glows', a.glow === 0 && b.glow === 1);

  /* scrubbing. the same frame, whichever direction time was walked in. */
  const fwd = [], back = [];
  for (let f = 0; f < 200; f++) fwd.push(JSON.stringify(mascotFrame(plan, f / 60)));
  for (let f = 199; f >= 0; f--) back[f] = JSON.stringify(mascotFrame(plan, f / 60));
  ok('seeking is the same animation in both directions', fwd.every((v, i) => v === back[i]));

  console.log('');
  if (fail.length) { console.error('FAILED: ' + fail.join(', ')); process.exit(1); }
  console.log('  all ' + '✓');
}

if (process.argv[2] === 'test') {
  console.log('the boring tek — mascot rig checks');
  selfTest();
}
