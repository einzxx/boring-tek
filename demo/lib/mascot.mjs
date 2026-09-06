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

/* ---------- the hand ----------
   **opt in, and off unless a plan says `hand: true`.** nothing in the markup,
   the css, the timeline or the frame exists when it is off, so every clip
   written before it renders exactly as it did — that is asserted rather than
   hoped for, by diffing this module against its own previous version frame by
   frame.

   he has no mouth. the head is a plate and two slabs and the page spec says so,
   and a mouth is the one piece of anatomy that would turn a face into a
   character. so when a clip needs him to be *talking* rather than reacting, a
   hand stands in for one: it sits low on the face where a mouth would be, a
   little off centre, and it opens and shuts. that is the yawning emoji's
   gesture, and it reads as a mouth for the same reason that one does — a hinged
   pair of shapes opening and closing at the mouth line is a mouth, whatever it
   is made of.

   **it is two parts and one hinge.** the fingers are the long slab and the
   thumb is the short one, both rounded to half their own height and both filled
   with `--eye`, which is the ink the irises are drawn in: same colour, same
   corner radius, same flat weight, so it belongs to the face rather than
   sitting on it. there is no arm, no palm and no fifth finger. they overlap
   `back` units past the hinge so the wrist is one shape rather than two bars
   meeting.

   at rest the pair lies almost flat and reads as a closed hand held up to the
   face. open, the fingers swing up and the thumb drops, and the light of the
   face shows between them as a wedge. **the gape is the face showing through**,
   not a hole cut in it, which is what keeps the hand a hand.

   the numbers are in grid units like everything else here, and they were placed
   against the geometry rather than by eye: the hinge sits 19.2 units below the
   plate's centre, which is midway between the eye line and the chin, and the
   whole shape spans 18.0 to 37.0 across a plate whose centre is 32 — a little
   left, the way the emoji holds it. at a full gape the fingers' far corner
   still clears the eye above it by three and a half units and the thumb's
   clears the silhouette by four, and `mascotFrame` measures both on every frame
   against the same signed distance every other feature is measured with. */
export const HAND = {
  /* ---------- where it sits, and it was moved once ----------
     the first placement had the wrist at 35.6 and the shape running out to 18,
     which put the whole hand under the left eye with the right half of the chin
     empty — and a rendered frame said what the geometry did not: it read as a
     stray chevron rather than as a mouth. **a mouth is under both eyes.** it is
     centred on 29.9 now, two grid units left of the face's own centre, which is
     the emoji's off centre hold and is about ten device px at this head size:
     enough to be a hand rather than a diagram, not enough to be a mark that
     wandered off.

     it also came up a unit and grew by three, and both are the same note. the
     head is 60 units across and the hand now spans 20.5 of them, a third of the
     face, which is the width of the two eyes and their gap. below the eye line
     rather than beside it, and big enough that the shape it makes is the thing
     you see rather than a detail on a white disc. */
  /* **the wrist is on the left and the hand points right**, which is the second
     thing a rendered frame corrected. with the wrist on the right the shape
     opens away from the face's centre and reads as an arrowhead; with it on the
     left the hand comes in from the cheek the way the emoji holds it, the
     fingertips point across the face, and the opening faces the empty half of
     the chin. same two slabs, same hinge, mirrored, and it is the difference
     between a hand and a symbol. */
  hinge: { x: 20.4, y: 48.5 },
  /* the two slabs reach this far *behind* the hinge and overlap there, so the
     wrist is one rounded lump rather than two bars meeting at a point. it is the
     cheapest thing in this table and it is most of what stops the open pose
     reading as a chevron. */
  back: 2.6,
  /* four fingers held together, so it is the longer and the thicker of the two,
     and it is within half a unit of the eye's own height — same ink, same
     weight, same rounding. the thumb is shorter and thinner because a thumb is. */
  fingers: { len: 19.0, h: 4.6 },
  thumb: { len: 14.6, h: 3.0 },
  /* degrees, and **positive is up** in every one of them, which is the reading
     the table is worth having. the slabs lie along +x from the hinge, so an svg
     rotation by a positive angle would take the tip *down* — everything that
     draws or measures the hand therefore turns by the negative of these, in one
     place each, and the table stays in the units a person thinks in. shut is
     not quite shut: three
     degrees of gap is the difference between a hand held closed and a bar.

     **the gape is asymmetric and the face is why.** the eyes sit at 38.5 and
     the plate ends at 62, so there is nine units of room above the hinge before
     the fingertip is in the eye and eleven below it before the thumb is off the
     chin — and the plate is a circle, so the room below narrows fast as the
     thumb also travels left. so the thumb does more of the opening than the
     fingers do, which is also what a hand doing this actually does: the jaw
     drops further than the fingers rise.

     the two numbers were placed against those two limits rather than chosen. at
     a full gape with the pop overshoot on top, the fingertip's near corner sits
     2.7 grid units clear of the bottom of a resting eye and the thumb's far
     corner sits 2.4 inside the silhouette, or 0.8 at a full turn either way.
     **the one pose this does not clear is `surprised`**, which takes the eye to
     two and a half times its height and brings its lower edge down to 43.3,
     about half a unit into the fingers. no clip pairs the two — a face that is
     startled is not a face that is still talking — and it is written down here
     rather than guarded, because the honest fix is a smaller head or a bigger
     grid and neither is on the table. */
  /* ---------- the fingers barely move and the thumb does the work ----------
     the third thing a rendered frame corrected, and the biggest. opening the two
     slabs by similar amounts makes a chevron, and a chevron on a face is an
     arrowhead: two cuts of this part came back reading as `>` and then as `<`
     rather than as a mouth. what a yapping hand actually does is the opposite of
     symmetric — the four fingers are held flat and the **thumb** taps up and
     down underneath them, which is why the gesture reads as a jaw at all. so the
     fingers swing six degrees, which is enough to be alive and not enough to be
     an arm of a V, and the thumb swings thirty five.

     it costs nothing in gape, because the gape is the sum of the two, and it
     buys the whole read: a level bar with something hinging away under it is a
     mouth, and two bars splaying apart is a symbol. */
  shut: { fingers: 1.0, thumb: -1.0 },
  open: { fingers: 6.0, thumb: -35.0 },
  /* a mouth on a turning head travels with the face, and it travels less than
     the eyes do because it is nearer the centre line. it takes this share of
     the near eye's own travel and none of its foreshortening — a hand is in
     front of the face rather than on it.

     it was 0.45 and a rendered frame moved it: at 0.45 the eyes crowd the far
     side of the face on a turn and the mouth stays where it was, which reads as
     two things rather than one head. 0.6 is between the far eye's travel and
     the near one's, and at a full turn either way the thumb's outer corner —
     the piece of this part nearest the silhouette — still sits two and a half
     grid units inside it. */
  turnShare: 0.6,
};

/* ---------- the yap ----------
   the loop, and it is a plan rather than a repeat: every cycle is written down
   with its own times before a browser is opened, so a clip can put a syllable
   of sound on the frame the hand opens on and the two cannot drift. that is the
   same argument the ding and the caption pops already make. an infinite gsap
   repeat has no times in it to read.

   one cycle is three tweens and a gap: **open** on `drift`, which leaves fast
   and coasts in, so the mouth flies open and arrives rather than easing into
   it; **settle**, a short slide back from the overshoot on the calm curve; and
   **shut** on the calm curve, a shade slower than the open. that ordering is
   the "quick and a bit lazy" of the brief — a hand that shut as fast as it
   opened would be a mechanism.

   **the overshoot is geometry rather than a curve, and that is a fault this
   part paid for.** the obvious first cut opened on `btk.pop`, which is the
   house curve that overshoots and is what every state's entrance arrives on.
   it is the wrong curve here and the numbers say so plainly: pop reaches 1.1 by
   36% of its own duration, so over an 85ms open at sixty it puts the whole move
   into **one frame** — measured, the gape went 0.05 to 0.89 between two
   consecutive frames, which is not a hand opening, it is a hand teleporting.
   pop is written for a move that happens once and is allowed to snap. a gesture
   that repeats three times a second cannot borrow it. so the open goes to
   `over` of the gape on `drift` and a second tween brings it back — same read,
   same house easing, and the speed is now a number in this table rather than a
   property of a curve tuned for something else.

   the numbers below put the **thumb tip's** fastest frame at about seven css px
   at sixty — the thumb rather than the fingers, because it is the one that does
   the opening. that is twice a blink's lid, which is the rig's own fastest move
   on its own, and half what the glitch shakes the whole frame by. the open takes
   nine frames at sixty and the fastest of them carries about a third of it,
   which is the same share `btk.shut` gives a blink. `mascotMotion` measures the
   faster of the two tips and the self test holds it to a ceiling.

   `gapeJit` and `periodJit` are what stop it being a loop. every cycle draws
   its own gape and its own length off a seeded prng, so no two are the same and
   the mumble that rides on them is uneven in exactly the way talking is. the
   seed is the plan's own, xored, so it never disturbs the blink and saccade
   schedules that were generated before it. */
export const YAP = {
  openFor: 0.150,
  over: 1.08,           /* how far past the gape the open goes before it settles */
  settleFor: 0.045,
  shutFor: 0.130,
  gap: 0.020,
  gapeJit: 0.22,        /* a cycle opens between (1 - this) and 1 of the full gape */
  periodJit: 0.14,      /* and runs between (1 - this) and (1 + this) of its length */
};

/* ---------- the floating hands ----------
   **opt in, and off unless a plan says `hands: true`.** nothing in the markup,
   the css, the timeline, the frame, the placement or the report exists when it
   is off, so every clip written before them renders exactly as it did — the
   self test asserts that on the same artefacts the yap hand's own opt in is
   asserted on.

   they are not the hand above. `HAND` is one pair of slabs standing in for a
   mouth, low on the face, and it is a piece of the head. **these are two
   floating cartoon gloves with no arms**, which is the whole convention: a
   glove attached to nothing is a hand, and nobody has ever asked where the arm
   went, because a glove drawn with a stump would need one.

   ---------- what is drawn ----------

   one glove, six shapes, and the second hand is the first one mirrored: a
   chunky rounded palm, four fingers in a row off the top of it and a thumb off
   its side, all of them rounded rects on the head's own 64 grid, so a hand is
   the same ink and the same corner language as everything else in the file.

     the palm     `palm.w` by `palm.h`, cornered at `palm.rx` — a rounded
                  square rather than a pill, which is what makes it a palm.
     the fingers  four capsules `fingers.pitch` apart, splayed off their own
                  bases, each with its own reach so the row is not a comb. they
                  **do not touch**: the gap is `pitch - w`, which over the page
                  colour is the only thing that separates them, and see the edge
                  below for what separates them over the face.
     the thumb    shorter, thicker, off the palm's `-x` side. the glove is drawn
                  as the mascot's screen right hand, so its thumb points in
                  toward the head, and the screen left one is `scale(-1 1)` of
                  it, which puts that thumb in toward the head as well.

   **the fingertips are slightly flattened**, and it is one number: `tipR` is
   the corner radius as a share of the finger's width and it is under a half. at
   a half a capsule ends in a semicircle; at 0.40 it ends in a short flat with
   two corners, which is what a glove's stitched tip looks like and is what
   stops four capsules reading as four sausages.

   **a curled finger is a bump on the front of a fist rather than a folded
   tube.** one capsule cannot fold at two knuckles and a version that tried read
   as a finger that had been trodden on. so a curl shortens the capsule by
   `curlLen`, drops its base `curlDrop` into the palm and opens its splay by
   `curlSplay`: four short capsules fanned on the palm's top edge, which is a
   knuckle row, and is what the reference's fist actually is at this size.

   ---------- the separation edge ----------

   a white glove on a white face is one shape. **so the glove carries an outline
   in the page colour, and it is painted only where the hand is over the head.**
   that is two layers rather than a conditional: the ink layer is unclipped and
   is fill only, the edge layer is clipped to the plate's own outline and is
   stroke only, and it is the same clip path every facial feature already uses,
   so the two can never disagree about where the head ends.

   over the background there is no edge at all, which is right twice over. the
   glove is already a white shape on a dark page and needs nothing to separate
   it. and a page coloured stroke out there would not be invisible anyway: the
   dark theme's glow sits behind the head, so a stroke drawn in `#06070a` over
   it would read as a dark ring rather than as nothing.

   the edge does two jobs and the second one is free. between the hand and the
   face it is the separation. **inside the hand it is the finger lines** — the
   fingers overlap the palm and the stroke follows every shape's own outline, so
   over the face the row reads as five parts of one hand. over the background
   the gaps between the fingers do that job instead and the palm and the fingers
   merge into one silhouette, which is exactly what the reference does.

   **`edge` is 0.75 grid units, which is three device px at the corner size**,
   and it is thinner than the reference on purpose: that drawing's finger lines
   measure about four and a quarter device px against a head this size, and at
   that weight the lines are the thing you see rather than the hand. it is one
   number for the whole glove, so the thickness is **even everywhere** — the
   reference's outline is not, and a stroke that thickens round a knuckle is the
   difference between a drawing and a rig.

   an even stroke is also why the hands cancel the card's deformation rather
   than riding it. the card squashes and the turn squeezes it, both on x alone,
   and a stroke under a non uniform scale is thicker on one axis than on the
   other. so each glove carries the inverse of the card's own two scales about
   its own origin, which leaves the net transform on it uniform: it **scales
   with the head, tilts with the head, travels with the turn, and does not
   deform.** a hand is held beside a face rather than painted on it.

   ---------- where they sit ----------

   the pose table is in card space, on the same 64 grid the face is drawn on,
   and it is written for the **screen right** hand. the screen left one is the
   mirror: `x` becomes `64 - x` and `rot` becomes `-rot`, and nothing else
   changes, because the splay and the thumb angle live inside the glove's own
   frame and the glove itself is what gets flipped. that is why every pose below
   is written once.

   the resting pair is the reference's: two hands low beside the head, fingers
   hanging down and tipped in a little, each wrist tucked against the silhouette
   with the palm just clear of it. every pose exits back to that. */
export const HANDS = {
  /* ---------- the proportions are the reference's, and they are measured ----------
     `demo/out/poses/measure-ref.mjs` decodes that png, thresholds it, labels the
     connected components and reports each blob's box and its per row run
     profile. so these are read off the drawing rather than judged by eye, and
     the wave hand is the one they are read off because it is the only pose in
     the sheet with the hand fully open and flat to camera.

     against a head measuring 244px there:

       the whole hand      110 x 106      0.45 x 0.43 of the head
       the palm             93 wide        0.38 of the head
       one finger           23 wide        and about 50 long
       the gap between two   6              a quarter of a finger's width
       the thumb            22 wide        within a pixel of a finger

     which on the mascot's 60 unit plate is a palm 22.9 across, a finger 5.65 by
     12.3, a gap of 1.5 and a thumb of 5.4. the numbers below are those, with the
     finger row pulled in so it sits on the palm rather than past it.

     **the first cut got all of this wrong in the same direction and it read as a
     starfish.** the palm was 17 against 23, the fingers were 3.3 wide against
     5.4, and the splay was seven and a half degrees a finger, so four thin
     spikes fanned off a small lump. what the reference actually draws is the
     opposite: **a big rounded mitt with short thick fingers held together**, and
     the two ratios that carry it are the palm's width against a finger's length
     — 1.83 to 1 here, 1.86 in the drawing — and the gap against a finger's
     width, a quarter either way. */
  palm: { w: 23.0, h: 15.0, rx: 7.0 },
  fingers: {
    /* **side by side with a small even gap, not fanned.** `splay` is three
       degrees a step where it was seven and a half, which at the default `sp`
       leaves the outer pair four and a half degrees off vertical — enough that
       four capsules are not a comb, nowhere near enough to be a fan. a pose
       that wants a spread hand raises `sp`; nothing else does.

       the gap is `pitch - w` and over the background it is the only thing
       separating two fingers, because the edge layer is clipped to the head.
       one grid unit is four device px at the corner size, which is the bubble
       outline's number and survives h.264 at crf 17 for the same reason. */
    w: 5.4, len: 12.6, pitch: 6.4, splay: 3.0, baseY: -12.0,
    /* out from the thumb: index, middle, ring, little. four equal capsules are
       a comb; these four are a hand. */
    reach: [0.93, 1.00, 0.96, 0.86],
    /* a curled finger is a bump on the front of a fist rather than a folded
       tube: one capsule cannot fold at two knuckles. a curl shortens it, drops
       its base into the palm and barely opens its splay — the reference's own
       fist draws the curled row as three parallel bars, not a fan. */
    curlLen: 0.58, curlDrop: 1.5, curlSplay: 0.18,
  },
  /* **a clear separate chunky shape**, which in the drawing means as wide as a
     finger and a good deal shorter, with its base far enough out on the palm's
     flank that the two silhouettes never merge into one lobe. */
  thumb: { w: 5.8, len: 10.5, x: -10.8, y: -5.0, curlLen: 0.40, curlIn: 38, curlX: 1.2, curlY: 1.0 },
  /* the tips are rounded. `tipR` is the corner radius as a share of the
     finger's width and a half is a semicircle; 0.46 is a semicircle with the
     last hair taken off it, which is a glove's stitched tip and is invisible as
     a decision until four of them are side by side. */
  tipR: 0.46,
  /* the page coloured outline, in grid units: three device px at size 128 and
     three and a half at 148, against a reference whose own finger lines are
     four and a quarter at the first of those. */
  edge: 0.75,
  /* a hand goes with the head on a turn and it goes less far than an eye does,
     for the same reason the yap hand does — it is held in front of the face
     rather than wrapped around it. the card's own squeeze already pulls the
     anchors in as the silhouette narrows; this is the slide on top of that. */
  turnShare: 0.35,
  /* the always on layer, so a hand at rest is never a sticker. three periods
     per hand — x, y and rotation — and no two of the six are multiples of each
     other, which is how the head's own drift is written and for the same
     reason: a path that closes is a path a viewer starts to recognise. the two
     hands are given different ones, so the pair never moves as one object. */
  idle: { amp: 0.42, rot: 1.15, period: [6.7, 5.9], rotPeriod: [8.3, 7.1] },
};

/* the resting glove, as the channel values every pose is written against and
   every exit returns to. it is `rest`'s own row in the table below, lifted out
   because `channels()` needs it before the table is read. */
export const HANDS_REST = {
  x: 61.5, y: 42.5, rot: 182, sc: 1, o: 1, sp: 0.50,
  c0: 0.38, c1: 0.30, c2: 0.32, c3: 0.42, ct: 0.24, ta: -40,
};

/* which hands are on screen, and it is the whole of the side option: `both` is
   the pair, `left` and `right` are one hand with the other not drawn, which is
   what "one hand or two" means. it persists across marks the way the turn does,
   because it is a fact about the composition rather than a gesture. */
export const HAND_SIDES = ['left', 'right', 'both'];

/* ---------- the poses ----------
   seven, each a different silhouette at a glance with the sound off, and each
   an entrance, a hold with its own beat, and an exit back to rest. the shape is
   the state table's shape and the numbers are in the same units.

   `at` is where the acting hand ends up. `both` says whether the pose is one
   the pair does together — a shrug is two hands or it is not a shrug — or one a
   single hand does while the other rests, which is what the reference draws for
   the wave, the thumb, the facepalm and the point.

   `mark` is the one channel the preflight scores the pose on, exactly as a
   state declares one: a shrug's read is in rotation and a facepalm's is in
   where the hand went, and one shared metric would flatter both.

   every `build` is written in the **screen right** hand's own space and `B.set`
   mirrors it for the other one, so there is not a sign anywhere in this table. */
export const HAND_POSES = {
  rest: {
    label: 'two hands low beside the head',
    entry: 0.42, hold: 1.00, exit: 0.28, both: true,
    at: { ...HANDS_REST },
    mark: { chan: 'y', from: HANDS_REST.y - 1.5, to: HANDS_REST.y },
    build(B, k) {
      /* it still has to arrive: a pose that wrote nothing would hold whatever
         the pose before it left behind. it settles down onto rest from a little
         above, which reads as two hands being let go of rather than as an
         entrance.

         **a unit and a half rather than three**, and the reason is the one
         `neutral` has too: an explicit `from` is a value the channel is not at
         yet, so the mark's own frame carries a step of exactly that size. three
         units was six css px in one frame, which is a hand blinking upward
         before it comes down. one and a half is three css px, under the blink's
         own 3.5 and under everything else in this table. */
      B.set(k, { y: HANDS_REST.y }, { from: { y: HANDS_REST.y - 1.5 }, for: 0.40, ease: 'pop' });
      /* the hold's own beat: the pair drifts a little apart and back on the calm
         curve, which is a body breathing rather than two stickers. */
      B.set(k, { x: HANDS_REST.x + 0.7 }, { for: 0.52, at: 0.46, ease: 'glide' });
      B.set(k, { x: HANDS_REST.x }, { for: 0.60, at: 1.02, ease: 'glide' });
    },
  },

  wave: {
    label: 'one hand up beside the head, open, rocking',
    entry: 0.44, hold: 1.30, exit: 0.30, both: false,
    at: { x: 68.0, y: 44.0, rot: 20, sc: 1.0, sp: 1.7, c0: 0, c1: 0, c2: 0, c3: 0, ct: 0, ta: -66 },
    mark: { chan: 'y', to: 44.0 },
    build(B, k) {
      const A = HAND_POSES.wave.at;
      /* the hand dips before it comes up, which is the same anticipation every
         state's entrance has and is why this reads as somebody deciding to
         wave rather than as a hand appearing at head height. */
      B.set(k, { x: A.x, y: A.y, rot: A.rot, sc: A.sc, sp: A.sp, c0: 0, c1: 0, c2: 0, c3: 0, ct: 0, ta: A.ta },
        { for: 0.40, ease: 'pop', anti: 0.34, antiFor: 4 / 60 });
      /* and then the rock, which is the pose. five passes, each smaller and
         quicker than the one before it, so the wave winds down rather than
         looping — the same argument the two nods in `agreeing` make. */
      for (const [at, forS, by] of [[0.40, 0.26, 15], [0.66, 0.24, -13], [0.90, 0.24, 12],
        [1.14, 0.26, -9], [1.40, 0.28, 6]]) {
        B.set(k, { rot: A.rot + by }, { for: forS, at, ease: 'glide' });
      }
    },
  },

  'thumbs-up': {
    label: 'one fist, thumb up',
    entry: 0.40, hold: 1.10, exit: 0.28, both: false,
    /* **the fist is turned on its side and the thumb points up, which is the
       one pose in this table whose rotation is not where the hand is but which
       way it is holding.** with the fingers curled and pointing up, a fist is a
       lump with four bumps on the top of it and the thumb, which lives on the
       glove's own left, ends up tucked in against the head — the first cut read
       as a mitten. turned ninety, the knuckle row faces away from the face, the
       thumb base swings to the top of the hand, and `ta` takes it back to
       vertical, which is the whole gesture. */
    at: { x: 65.0, y: 51.0, rot: 82, sc: 1.06, sp: 0.30, c0: 0.78, c1: 0.74, c2: 0.76, c3: 0.82, ct: 0, ta: -82 },
    mark: { chan: 'y', to: 51.0 },
    build(B, k) {
      const A = HAND_POSES['thumbs-up'].at;
      /* the fingers close two frames before the hand arrives, so the fist is
         made on the way up rather than at the top of it. */
      B.set(k, { c0: A.c0, c1: A.c1, c2: A.c2, c3: A.c3, sp: A.sp }, { for: 0.22, ease: 'pop' });
      B.set(k, { x: A.x, y: A.y, rot: A.rot, sc: A.sc, ct: 0, ta: A.ta },
        { for: 0.40, at: 2 / 60, ease: 'pop', anti: 0.40, antiFor: 4 / 60 });
      /* the hold is one small second push, which is what a thumb does when it
         means it. */
      B.set(k, { y: A.y - 2.1 }, { for: 0.26, at: 0.62, ease: 'pop' });
      B.set(k, { y: A.y - 0.4 }, { for: 0.44, at: 0.90, ease: 'glide' });
    },
  },

  facepalm: {
    label: 'one hand over the face, fingers spread',
    entry: 0.76, hold: 1.30, exit: 0.34, both: false,
    at: { x: 31.0, y: 28.0, rot: 44, sc: 1.06, sp: 0.85, c0: 0.32, c1: 0.26, c2: 0.28, c3: 0.38, ct: 0.66, ta: -24 },
    mark: { chan: 'x', to: 31.0 },
    build(B, k) {
      const A = HAND_POSES.facepalm.at;
      /* up and across onto the face, and the fingers open on the way, because a
         hand that arrived already spread would read as a stamp. */
      /* **0.66 rather than 0.46, and the number is the travel.** the resting
         pair now sits where the reference draws it, out past the silhouette,
         so a hand coming across onto the face crosses thirty three grid units —
         sixty six css px — and on the pop curve the fastest frame of that at
         0.46 was sixteen css px, which is a hand arriving as a smear. */
      B.set(k, { x: A.x, y: A.y, rot: A.rot, sc: A.sc },
        { for: 0.66, ease: 'pop', anti: 0.18, antiFor: 3 / 60 });
      B.set(k, { sp: A.sp, c0: A.c0, c1: A.c1, c2: A.c2, c3: A.c3, ct: A.ct, ta: A.ta },
        { for: 0.30, at: 0.10, ease: 'drift' });
      /* the hold is the hand dragging down the face, slowly, on the calm curve.
         it is the whole joke, and it is the one beat in this table where
         nothing snaps. */
      B.set(k, { y: A.y + 2.6, rot: A.rot - 4 }, { for: 0.90, at: 0.52, ease: 'glide' });
    },
  },

  shrug: {
    label: 'both hands out to the sides, palms turned up',
    entry: 0.46, hold: 1.10, exit: 0.30, both: true,
    at: { x: 66.0, y: 58.0, rot: 44, sc: 1.0, sp: 0.35, c0: 0.18, c1: 0.14, c2: 0.62, c3: 0.70, ct: 0.62, ta: -26 },
    mark: { chan: 'rot', to: 44 },
    build(B, k) {
      const A = HAND_POSES.shrug.at;
      /* both hands turn out and lift together. a shrug that arrived one hand at
         a time would be two gestures. */
      B.set(k, { x: A.x, y: A.y, rot: A.rot, sp: A.sp, c0: A.c0, c1: A.c1, c2: A.c2, c3: A.c3, ct: A.ct, ta: A.ta },
        { for: 0.40, ease: 'pop', anti: 0.30, antiFor: 4 / 60 });
      /* the hold is the second half of a real shrug: the hands come up once
         more and drop, which is the "well" after the "what". */
      B.set(k, { y: A.y - 2.4, rot: A.rot + 6 }, { for: 0.28, at: 0.50, ease: 'pop' });
      B.set(k, { y: A.y + 0.6, rot: A.rot }, { for: 0.50, at: 0.82, ease: 'glide' });
    },
  },

  point: {
    label: 'one index out, the rest a fist',
    entry: 0.40, hold: 1.15, exit: 0.28, both: false,
    at: { x: 60.0, y: 48.0, rot: 112, sc: 1.0, sp: 0.30, c0: 0, c1: 0.92, c2: 0.94, c3: 0.98, ct: 0.85, ta: -12 },
    mark: { chan: 'rot', to: 112 },
    build(B, k) {
      const A = HAND_POSES.point.at;
      B.set(k, { c1: 1, c2: 1, c3: 1, ct: A.ct, sp: A.sp, ta: A.ta }, { for: 0.20, ease: 'pop' });
      B.set(k, { x: A.x, y: A.y, rot: A.rot, sc: A.sc, c0: 0 },
        { for: 0.34, at: 2 / 60, ease: 'pop', anti: 0.42, antiFor: 4 / 60 });
      /* two jabs, the second smaller and quicker, which is the shape
         `agreeing`'s two nods have and is why two of them read as one gesture
         rather than as a loop. */
      B.set(k, { x: A.x + 2.6, y: A.y + 1.5 }, { for: 0.16, at: 0.52, ease: 'pop' });
      B.set(k, { x: A.x, y: A.y }, { for: 0.22, at: 0.70, ease: 'glide' });
      B.set(k, { x: A.x + 1.7, y: A.y + 1.0 }, { for: 0.14, at: 0.96, ease: 'pop' });
      B.set(k, { x: A.x, y: A.y }, { for: 0.26, at: 1.12, ease: 'glide' });
    },
  },

  panic: {
    label: 'both hands up on the head, gripping',
    entry: 0.86, hold: 1.20, exit: 0.30, both: true,
    at: { x: 64.0, y: 4.0, rot: 222, sc: 1.06, sp: 0.15, c0: 0.84, c1: 0.80, c2: 0.82, c3: 0.88, ct: 0.76, ta: -22 },
    mark: { chan: 'y', to: 4.0 },
    build(B, k) {
      const A = HAND_POSES.panic.at;
      /* ---------- two gears, and it is arithmetic rather than taste ----------
         this is the only pose that takes a hand the whole height of the head:
         rest to the crown is forty two grid units, which is eighty five css px.
         on the pop curve the fastest frame of a move carries about a fifth of
         it, so as **one** tween it needed a full second to stay under the
         ceiling this part is held to — and a second is not a panic, it is a
         stretch.

         so it is two: the lift, on the calm curve, which does two thirds of the
         travel at about a third of pop's peak speed, and then the grab, which
         is short enough that pop's own snap costs nothing. it reads better than
         the long tween as well, because a big move with a change of gear in it
         is a hand deciding where to go and then getting there. */
      B.set(k, { x: 65.5, y: 21.0, rot: 204, sp: A.sp, c0: A.c0, c1: A.c1, c2: A.c2, c3: A.c3, ct: A.ct, ta: A.ta },
        { for: 0.44, ease: 'glide', anti: 0.16, antiFor: 4 / 60 });
      B.set(k, { x: A.x, y: A.y, rot: A.rot, sc: A.sc },
        { for: 0.34, at: 0.44, ease: 'pop' });
      /* the hold is a tremble, and the two hands are deliberately out of phase
         with each other: two hands shaking together is a machine. */
      const ph = k ? 0 : 0.055;
      for (const [at, by] of [[0.86, 1.5], [0.99, -1.3], [1.12, 1.1],
        [1.25, -0.9], [1.38, 0.7], [1.51, -0.5]]) {
        B.set(k, { rot: A.rot + by }, { for: 0.13, at: at + ph, ease: 'glide' });
      }
      B.set(k, { rot: A.rot }, { for: 0.22, at: 1.68 + ph, ease: 'glide' });
    },
  },
};
export const HAND_POSE_NAMES = Object.keys(HAND_POSES);

/* ---------- the glove, resolved for one frame ----------
   one channel object in, one drawable hand out, and it is the only place the
   curl arithmetic lives. the page is handed base points, angles and lengths and
   writes them to elements; it decides nothing.

   the fingers are drawn as rects that grow **upward** from their own base, so a
   curl changes `y` and `height` together and leaves `rx` alone. shortening a
   rounded rect by scaling it would squash the corner and the flattened tip is
   the one detail that stops the row reading as sausages. */
function gloveAt(h) {
  const F = HANDS.fingers;
  const fingers = [];
  for (let i = 0; i < 4; i++) {
    const c = clamp(h['c' + i], 0, 1);
    fingers.push({
      x: n((i - 1.5) * F.pitch),
      y: n(F.baseY + c * F.curlDrop),
      a: n((i - 1.5) * F.splay * h.sp * (1 + F.curlSplay * c)),
      len: n(F.len * F.reach[i] * (1 - F.curlLen * c)),
    });
  }
  const T = HANDS.thumb, ct = clamp(h.ct, 0, 1);
  return {
    fingers,
    thumb: {
      x: n(T.x + ct * T.curlX), y: n(T.y + ct * T.curlY),
      a: n(h.ta + ct * T.curlIn), len: n(T.len * (1 - T.curlLen * ct)),
    },
  };
}

/* every corner of every shape a **resolved** glove is made of, in its own local
   frame, with half a stroke added on each side because that is where the ink
   really is. it is a list of points rather than a box on purpose: the hand is
   then rotated, and the box of a rotated box is not the box of the rotated
   shape. taking the corners first and the box last was worth about four grid
   units of reach on the poses that hold the hand at an angle, which is eight
   css px the head does not have to stand in by.

   the placement, the capture region, the safe area rect and the preflight all
   read this, so none of them can hold a different idea of how big a hand is. */
export function gloveCorners(g) {
  const P = HANDS.palm, e = HANDS.edge / 2;
  const pts = [];
  for (const dx of [-P.w / 2 - e, P.w / 2 + e]) for (const dy of [-P.h - e, e]) pts.push([dx, dy]);
  const put = (bx, by, w, len, deg) => {
    const th = deg * Math.PI / 180, c = Math.cos(th), s = Math.sin(th);
    for (const dx of [-w / 2 - e, w / 2 + e]) for (const dy of [e, -len - e]) {
      pts.push([bx + dx * c - dy * s, by + dx * s + dy * c]);
    }
  };
  for (const f of g.fingers) put(f.x, f.y, HANDS.fingers.w, f.len, f.a);
  put(g.thumb.x, g.thumb.y, HANDS.thumb.w, g.thumb.len, g.thumb.a);
  return pts;
}

/* and the same corners in card space: scaled and rotated by the hand's own
   transform, then offset to where the hand sits. the card's own transform is
   deliberately not in here — this is the unit the plate is placed in, and
   `headRect` is the one place that knows how to put a frame's rotation and
   scale on top of it. */
function handBoxCard(h, g) {
  const th = h.rot * Math.PI / 180, c = Math.cos(th), s = Math.sin(th);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [px, py] of gloveCorners(g || gloveAt(h))) {
    const qx = h.x + h.sc * (px * c - py * s), qy = h.y + h.sc * (px * s + py * c);
    x0 = Math.min(x0, qx); x1 = Math.max(x1, qx);
    y0 = Math.min(y0, qy); y1 = Math.max(y1, qy);
  }
  return { x0, x1, y0, y1 };
}

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

  /* ---------- and the same cluster, over the crown ----------
     the lifts above hang the run **beside** the head, and they are right for
     the corner they were written in: post11's mascot stands bottom left, so a
     thought climbing off his right shoulder climbs into the frame. every other
     corner breaks it. off a bottom right head the cluster goes past the edge of
     the screen. mirrored to the left it wants the head's own width again in
     clear space beside him, and a head pushed toward the middle of a 540 wide
     stage does not have it.

     so `thought: 'over'` puts the run over the **top middle of the head** and
     climbs it toward the middle of the frame. a thought comes out of the top of
     a head rather than out of its ear, and which way it leans is the same fact
     `TURN.bias` is derived from: where he is standing.

     `angle` is the whole of it. the two dot centres and the pill's own spring
     corner sit on one line at this many degrees, so the cluster reads as one
     run rather than as two dots in a row pointing at nothing with a pill off to
     one side — which is what the beside lifts do above a head, and is what a
     clip that hand placed this three times kept finding. fifty is steep enough
     to read as a climb and shallow enough that the pill is still over him. */
  over: { angle: 50 },

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
/* where the thought hangs. `beside` is the module's own and the default. see
   BUBBLE.over for the other three and for why they exist. */
export const THOUGHTS = ['beside', 'over', 'over-left', 'over-right'];

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
    /* where the thought bubble hangs, and the same reasoning as the line above
       it: `over` works the side, the start point on the crown and the three
       lifts out from `pos`, and `over-left` / `over-right` say the side
       outright the way an explicit `bias` does. `beside` is the module's own
       placement and the default, so a clip that asks for nothing renders
       exactly what it always rendered. */
    thought: 'beside',
    band: null,                 /* the caption box to keep the bubble out of */
    /* the hand, off unless a clip asks for it. see HAND above: with it off
       nothing about this module changes, which is a property the diff harness
       checks rather than a claim made here. */
    hand: false,
    /* and the two floating gloves, off unless a clip asks for those. same
       promise, same reason, and they are a different part: `hand` is the mouth
       that is not a mouth and `hands` is the pair beside him. a clip may carry
       either, both or neither. see HANDS. */
    hands: false,
    seed: 0x6b0a11,
    ...opts,
  };
  if (!THEMES.includes(o.theme)) throw new Error('no theme called "' + o.theme + '"');
  if (!THOUGHTS.includes(o.thought)) {
    throw new Error('no thought placement called "' + o.thought + '" — the four are '
      + THOUGHTS.join(', '));
  }
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
    /* a yap is the hand talking, so a yap with no hand is a mark asking for
       something that is not drawn. it is a plan error rather than a silent no
       op: the whole point of the part being opt in is that asking for it is
       explicit. */
    if (m.yap && !o.hand) {
      throw new Error('mark ' + m.i + ' asks for a yap, and this plan has no hand on it'
        + ' — pass `hand: true`');
    }
    if (m.yap != null && m.yap !== true && !(Number(m.yap) > 0)) {
      throw new Error('mark ' + m.i + '\'s yap is ' + m.yap
        + ' — it is either `true` for "until the next mark" or a length in seconds');
    }
    /* the gloves, and the same rule the yap has: asking for a pose on a plan
       that draws no hands is asking for something that is not there, and it is
       a plan error rather than a silent no op. the whole point of a part being
       opt in is that asking for it is explicit. */
    if (m.hands != null) {
      if (!o.hands) {
        throw new Error('mark ' + m.i + ' asks for the hands pose "' + m.hands
          + '", and this plan has no hands on it — pass `hands: true`');
      }
      if (!HAND_POSES[m.hands]) {
        throw new Error('no hands pose called "' + m.hands + '" — the seven are '
          + HAND_POSE_NAMES.join(', '));
      }
    }
    if (m.side != null) {
      if (m.hands == null) {
        throw new Error('mark ' + m.i + ' carries a side with no hands pose on it'
          + ' — a side says which hands are on screen and it needs something to say it about');
      }
      if (!HAND_SIDES.includes(m.side)) {
        throw new Error('mark ' + m.i + '\'s side is "' + m.side + '" — the three are '
          + HAND_SIDES.join(', '));
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

  /* ---------- the gloves, as windows ----------
     a hands pose is a mark like a state is, and it gets the same treatment: an
     entrance, a hold stretched to fill whatever room there is, and an exit back
     to the resting pair. the room is measured to the **next hands mark** rather
     than to the next mark, because the two layers are independent — a clip may
     change the face four times while the hands hold one pose, and a pose cut
     short by a mark that says nothing about the hands would be a pose that
     ended for no reason.

     **`side` is which hands are on screen and it persists**, the way the turn
     does and for the same reason: it is a fact about the composition rather
     than a gesture. so a mark that names one hand keeps naming it until another
     mark says otherwise, and an exit puts the shape back to rest and leaves the
     side where it was.

     **which hand acts is derived from `pos`**, which is the fact `TURN.bias` is
     already derived from: he stands in a corner and gestures into the frame
     rather than out of it, so a head on the left waves with its screen right
     hand. naming one side in `side` says it outright, the way an explicit
     `bias` does. */
  if (o.hands) {
    for (const rec of out) rec.hands = null;
    const idx = out.map((r, k) => k).filter(k => marks[k].hands != null);
    const actingDefault = o.pos.endsWith('right') ? 0 : 1;
    let on = [1, 1];
    for (let j = 0; j < idx.length; j++) {
      const k = idx[j];
      const name = marks[k].hands, HP = HAND_POSES[name];
      const next = j + 1 < idx.length ? out[idx[j + 1]].t : seconds;
      const room = next - out[k].t;
      const floor = HP.entry + HP.exit + 0.30;
      if (room < floor) {
        throw new Error('the hands pose on mark ' + k + ' (' + name + ' at '
          + out[k].t.toFixed(2) + 's) has ' + room.toFixed(2)
          + 's before the next hands mark and needs ' + floor.toFixed(2)
          + 's for its own entrance, a hold and its exit');
      }
      const hold = room - HP.entry - HP.exit;
      const side = marks[k].side || 'both';
      const nextOn = side === 'both' ? [1, 1] : side === 'left' ? [1, 0] : [0, 1];
      /* a two handed pose is taken by every hand on screen; a one handed one is
         taken by the acting hand and the other one, if it is on screen at all,
         stays at rest — which is what the reference draws. */
      const acting = HP.both
        ? [0, 1].filter(kk => nextOn[kk])
        : [side === 'both' ? actingDefault : (side === 'left' ? 0 : 1)];
      /* the channel the preflight scores this pose on, resolved for the hand
         that is actually doing it: the table is written for the screen right
         hand, so a pose acted on the left one is measured on the mirror. */
      const mk = { ...HP.mark };
      if (acting[0] === 0 && (mk.chan === 'x' || mk.chan === 'rot')) {
        const flip = v => (mk.chan === 'x' ? GRID - v : -v);
        mk.to = +flip(mk.to).toFixed(4);
        if (mk.from != null) mk.from = +flip(mk.from).toFixed(4);
      }
      out[k].hands = {
        pose: name, label: HP.label, side, on: nextOn, acting, both: !!HP.both,
        entry: HP.entry, hold: +hold.toFixed(4), exit: HP.exit,
        settled: +(out[k].t + HP.entry).toFixed(4),
        leaving: +(out[k].t + HP.entry + hold).toFixed(4),
        out: +(out[k].t + HP.entry + hold + HP.exit).toFixed(4),
        mark: mk,
      };
      on = nextOn;
    }
    if (!idx.length) {
      notes.push('the hands are on and nothing poses them, so they hold the resting pair');
    }
  }

  /* ---------- the yap, as a plan ----------
     the marks say where it runs and this works out every cycle inside those
     windows, before a browser is opened. two reasons it is a list rather than
     an infinite repeat on the timeline.

     **the sound has to land on the picture.** a clip puts one syllable of
     mumble on each cycle's own `at`, so the mouth and the voice are the same
     event rather than two things laid on the same grid — the same argument
     `cuesFromCaptions` makes and the reason nothing in this repo is synced by
     hand. an infinite repeat has no times in it to read.

     **and the windows have to join.** consecutive marks that both yap are one
     continuous mumble, not one train per mark with a stutter at every mark
     boundary, so the windows are merged first and the cycles are laid across
     the merged run. `yap: true` means "from this mark until the next one", or
     until the end of the clip on the last mark; a number means that many
     seconds from the mark.

     a cycle is only kept if it can **finish** inside its window. a hand caught
     half open on the last frame of a yap is a hand that stopped rather than a
     mouth that closed. */
  let yap = null;
  if (marks.some(m => m.yap)) {
    const windows = [];
    for (let k = 0; k < out.length; k++) {
      const y = marks[k].yap;
      if (!y) continue;
      const from = out[k].t;
      const until = y === true
        ? (k + 1 < out.length ? out[k + 1].t : seconds)
        : +(from + Number(y)).toFixed(4);
      if (!(until > from + 0.05)) {
        throw new Error('mark ' + k + '\'s yap runs from ' + from.toFixed(2) + 's to '
          + until.toFixed(2) + 's, which is no room to open a hand in');
      }
      windows.push({ from: +from.toFixed(4), until: +Math.min(until, seconds).toFixed(4) });
    }
    windows.sort((a, b) => a.from - b.from);
    const merged = [];
    for (const w of windows) {
      const last = merged[merged.length - 1];
      if (last && w.from <= last.until + 1e-6) last.until = Math.max(last.until, w.until);
      else merged.push({ ...w });
    }
    /* its own prng off the plan's own seed, so adding a yap to a clip cannot
       move a blink or a saccade that was generated before it. */
    const r = prng(o.seed ^ 0x51f0a3);
    const cycles = [];
    for (const w of merged) {
      let t = w.from;
      for (;;) {
        const s = +(1 + (r() * 2 - 1) * YAP.periodJit).toFixed(4);
        const openFor = +(YAP.openFor * s).toFixed(4);
        const settleFor = +(YAP.settleFor * s).toFixed(4);
        const shutFor = +(YAP.shutFor * s).toFixed(4);
        const gap = +(YAP.gap * s).toFixed(4);
        const shutAt = +(t + openFor + settleFor + shutFor).toFixed(4);
        if (shutAt > w.until) break;
        cycles.push({
          i: cycles.length, at: +t.toFixed(4), gape: +(1 - r() * YAP.gapeJit).toFixed(4),
          openFor, settleFor, shutFor, gap,
          peak: +(t + openFor).toFixed(4),
          closing: +(t + openFor + settleFor).toFixed(4),
          shutAt,
          out: +(shutAt + gap).toFixed(4),
          /* how long the mouth is doing something on this cycle, which is what
             a syllable of sound is given as its own length. */
          voiced: +(openFor + settleFor + shutFor).toFixed(4),
        });
        t = cycles[cycles.length - 1].out;
      }
    }
    if (!cycles.length) {
      throw new Error('the yap windows are too short to fit one cycle of the hand');
    }
    /* two cycles may never be on at once: the hand is one hand. it cannot
       happen the way the loop above is written, and it is asserted anyway,
       because the thing downstream reads this list as "one syllable each". */
    for (let i = 1; i < cycles.length; i++) {
      if (cycles[i].at < cycles[i - 1].shutAt - 1e-9) {
        throw new Error('yap cycles ' + (i - 1) + ' and ' + i + ' overlap');
      }
    }
    const periods = cycles.map(c => c.voiced + c.gap);
    yap = {
      windows: merged, cycles,
      count: cycles.length,
      period: { lo: +Math.min(...periods).toFixed(4), hi: +Math.max(...periods).toFixed(4) },
      gape: { lo: +Math.min(...cycles.map(c => c.gape)).toFixed(4),
        hi: +Math.max(...cycles.map(c => c.gape)).toFixed(4) },
    };
  }

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
    /* filled in below, once there are frames to measure the crown against. */
    thought: null,
    headPx: +(plate.w * STAGE.dsf).toFixed(1),
    stage: STAGE, safe: SAFE, band: o.band,
    /* both are null-ish when the part is off, and every consumer keys off
       `plan.hand` rather than off the geometry being importable. */
    hand: !!o.hand, yap,
    /* the gloves, and the same contract. `handsReach` is filled in below, once
       there are frames to measure it against. */
    hands: !!o.hands, handsReach: null,
    marks: out,
    idle: {
      blinks: blinkPlan(seconds, o.seed),
      saccades: saccadePlan(seconds, o.seed ^ 0x9e37),
    },
    notes,
  };

  /* ---------- the gloves move the head in ----------
     they hang outside the silhouette on every pose the reference draws, so the
     placement has to hold room for them or a resting hand is the first thing
     across a platform's own chrome. the reach is measured off the plan's own
     frames rather than derived off the pose table — see `handsReach` — and the
     head is then placed against the ink rather than against the plate.

     it runs after the plan object exists because it needs frames, which is the
     same shape `crownReach` has and for the same reason. nothing built before
     this point depends on the box. with the gloves off it does not run at all,
     so a plan that did not ask for them is placed exactly where it always was. */
  if (plan.hands) {
    const reach = handsReach(plan);
    plan.handsReach = reach;
    plan.box = placeHead(o.pos, o.size, plate, o.margin, {
      l: reach.l * unit, r: reach.r * unit, t: reach.t * unit, b: reach.b * unit,
    });
    notes.push('the hands reach ' + [reach.l, reach.r, reach.t, reach.b].map(v => v.toFixed(1)).join('/')
      + ' grid units past the plate (left/right/top/bottom), so the head stands that much further in');
  }

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

  /* last, because it reads the plan's own frames. see `placeThought`. */
  plan.thought = placeThought(o.thought, o.pos, o.size, crownReach(plan));
  if (plan.thought.mode === 'over') {
    /* advisory rather than fatal, and on purpose: the module places the cluster
       against the zone, and a clip is free to move the zone — post15 lifts him
       154 css px off the corner planMascot put him in. so this says what the
       placement does where the module put him and leaves the verdict to the
       clip's own guard, which measures the rendered rect. */
    const above = SAFE_CSS.top - (box.top + plan.thought.topInZone);
    if (above > 0) {
      notes.push('the thought over his head reaches ' + above.toFixed(1)
        + ' css px above the safe area from where planMascot puts him — a clip that moves the zone '
        + 'may still be inside it, and its own guard is the one that decides');
    }
  }
  return plan;
}

/* where the head sits. bottom left inside the platform safe area is the
   default and is what the export renders, so a clip drops onto a phone video
   with nothing to reposition. the numbers are the plate's, not the box's. */
function placeHead(pos, size, plate, margin, reach) {
  /* how far past the plate the ink goes on each edge, in css px, which is
     nothing at all unless the plan carries the gloves. they hang outside the
     silhouette by design, so the head has to stand further in or a resting hand
     would be the first thing across a platform's own chrome. it is per edge
     rather than one number because the poses are not symmetric: `panic` goes
     over the crown and nothing goes under the chin. */
  const E = reach || { l: 0, r: 0, t: 0, b: 0 };
  const L = SAFE_CSS.left + margin + E.l, R = STAGE.w - SAFE_CSS.right - margin - E.r;
  const T = SAFE_CSS.top + margin + E.t, Bo = STAGE.h - SAFE_CSS.bottom - margin - E.b;
  const left = pos.endsWith('right') ? R - plate.w - plate.off : L - plate.off;
  const top = pos.startsWith('top') ? T - plate.off : Bo - plate.w - plate.off;
  return { left: +left.toFixed(2), top: +top.toFixed(2), size };
}

/* ---------- how far the gloves actually reach ----------
   the same instrument `crownReach` is: walk the plan's own frames and take the
   worst, rather than guess a bound off the pose table and pad it. the poses'
   hold beats move past their own `at` — a wave rocks fifteen degrees, a point
   jabs two and a half units, the idle adds another half — and every one of
   those would have to be re-derived by hand in a second place, which is the
   kind of second copy this file does not keep.

   it is in card space grid units past the plate's own edges, so it is in the
   unit the placement works in and the card's rotation is left to `headRect`,
   which is the one place that knows how to do it. */
const HANDS_HZ = 120;
function handsReach(plan) {
  const P = HEAD.plate, N = Math.round(plan.seconds * HANDS_HZ);
  const worst = { l: 0, r: 0, t: 0, b: 0 };
  for (let i = 0; i <= N; i++) {
    const bx = mascotFrame(plan, i / HANDS_HZ).hands?.box;
    if (!bx) continue;
    worst.l = Math.max(worst.l, P.x - bx.x0);
    worst.r = Math.max(worst.r, bx.x1 - (P.x + P.s));
    worst.t = Math.max(worst.t, P.y - bx.y0);
    worst.b = Math.max(worst.b, bx.y1 - (P.y + P.s));
  }
  for (const k in worst) worst[k] = +Math.max(0, worst[k]).toFixed(3);
  return worst;
}

/* ---------- how high the crown actually gets ----------
   the cluster is a sibling of the card, so it does not move when he does, and
   over the crown that matters in a way beside him never did: a hop slides the
   head **past** a dot placed at its side and drives it **into** one placed over
   its top. `delighted` lifts him 12.5 grid units, the arrival curve overshoots
   that by a tenth and the idle drift adds another, and 15 css px of head goes
   straight through a dot hanging five above the resting crown. the first render
   of this placement had the small dot half swallowed.

   so the clearance is measured rather than picked, and it is measured **only
   over the frames a thought is actually up for** — the head is free to hop into
   the space above it the rest of the time, and holding room for a hop nobody
   is watching would push the whole cluster off the top of the frame.

   the plate is a circle, so its rotation changes nothing and its horizontal
   drift only ever moves the point under the dot further down. what is left is
   the y and the vertical scale, which is what this walks.

   240 samples a second is four per frame at sixty and twenty at twelve, so the
   answer does not depend on where the frames of a particular pass happen to
   land — the same argument the grow's cover point is walked at 480 for. */
const CROWN_HZ = 240;
function crownReach(plan) {
  const R = HEAD.plate.s / 2 * plan.unit;
  const cy = (HEAD.plate.y + HEAD.plate.s / 2) * plan.unit;
  let top = HEAD.plate.y * plan.unit;   /* the resting crown, and the floor */
  for (const m of plan.marks) {
    for (const b of m.bubbles || []) {
      const steps = Math.ceil((b.out - b.in) * CROWN_HZ);
      for (let i = 0; i <= steps; i++) {
        const c = mascotFrame(plan, b.in + (b.out - b.in) * i / steps).card;
        top = Math.min(top, cy + c.y - R * c.sy);
      }
    }
  }
  return n(top);
}

/* ---------- where the thought hangs ----------
   one derivation, off `pos`, the way the resting turn above is one derivation
   off `pos`. it answers three things and the css asks it for all three:

     the side       which way the run climbs. the pill is the far end of it, so
                    the pill is the part that has to end up over the middle of
                    the frame rather than over an edge — a head on the right
                    thinks to its left and a head on the left thinks to its
                    right. `over-left` and `over-right` name it outright.

     the start      the top middle of the head, `gap` off the crown. the same
                    `gap` the beside placement holds off his flank, because it
                    is the same question: how far the first dot sits off the
                    ink.

     the lifts      what puts the two dot centres and the pill's spring corner
                    on one line at `over.angle`. the row's own widths and gaps
                    fix the horizontal run between them, so the rise is
                    arithmetic and there is nothing here to tune per clip.

   `beside` returns a mode and nothing else. every number below is only read by
   the over branch of `mascotCss`, so a plan that did not ask for this renders
   what it always rendered, byte for byte. */
function placeThought(mode, pos, size, crownTop) {
  if (mode === 'beside') return { mode: 'beside', asked: mode };
  const sx = mode === 'over-left' ? -1
    : mode === 'over-right' ? 1
      : (pos.endsWith('right') ? -1 : 1);

  const unit = size / GRID;
  const d0 = BUBBLE.dots[0].d, d1 = BUBBLE.dots[1].d;
  /* along the row: the first dot's centre to the second's, and on to the pill's
     near bottom corner, which is the corner the pill springs from and so the
     point of it that belongs on the line. */
  const run1 = d0 / 2 + BUBBLE.dotGap + d1 / 2;
  const run2 = run1 + d1 / 2 + BUBBLE.dotGap;
  const rise = Math.tan(BUBBLE.over.angle * Math.PI / 180);
  /* and up. a lift is `margin-bottom`, which moves a part's **bottom edge** off
     the row's baseline, so a dot's centre is its lift plus its radius and the
     pill's corner is its lift exactly. the first dot carries none: the
     cluster's own `bottom` places it and the rest of the run climbs off it. */
  const lifts = [0, d0 / 2 + rise * run1 - d1 / 2, d0 / 2 + rise * run2].map(n);

  /* the crown, in the zone's own box. across, it is the plate's own centre
     line — the plate is inset from the box on every side, and the difference is
     a dot sitting on his head against a dot floating beside it. up, it is the
     highest the crown gets while the thought is up, which `crownReach` walked,
     and `gap` above that: the same `gap` the beside placement holds off his
     flank, because it is the same question. */
  const crownX = (HEAD.plate.x + HEAD.plate.s / 2) * unit;
  const crownY = crownTop - BUBBLE.gap;

  /* anchored by the edge the first dot is on, so the pill is free to be as wide
     as the copy needs it and the dot stays on the crown either way. */
  const edge = sx < 0 ? 'right' : 'left';
  const x = sx < 0 ? size - (crownX + d0 / 2) : crownX - d0 / 2;

  /* the pill's height is the one part of the cluster node can work out — the
     width is a font's business and the clip's guard measures that. */
  const pillH = BUBBLE.size * 1.25 + 2 * BUBBLE.padY + 2 * BUBBLE.stroke;

  return {
    mode: 'over', asked: mode, side: sx < 0 ? 'left' : 'right',
    angle: BUBBLE.over.angle,
    flow: sx < 0 ? 'row-reverse' : 'row',
    /* the pill grows out of the corner nearest the dots rather than out of its
       own middle, which is the site's own behaviour and is why the corner moves
       with the side. */
    origin: sx < 0 ? '100% 100%' : '0% 100%',
    anchor: { edge, x: n(x), bottom: n(size - crownY) },
    lifts, start: { x: n(crownX), y: n(crownY) }, crownTop: n(crownTop),
    runs: [0, n(run1), n(run2)],
    pillH: n(pillH), topInZone: n(crownY - lifts[2] - pillH),
  };
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
    /* the hand's one number: nought is shut, one is the full gape. nothing
       writes it unless the plan carries a yap, so on every clip without a hand
       it sits at nought and is read by nothing. */
    yap: { v: 0 },
    /* ---------- the two gloves ----------
       twelve numbers each, and they are the second channel set in this file
       whose rest is not zero — the first is `turn`. a glove is somewhere rather
       than something being done, so the seed is the resting pair and an exit
       returns to it rather than to nought, which is also what makes `rest` a
       pose a mark can ask for like any other.

       screen left is index nought and screen right is one, and the left one is
       seeded with the pose table mirrored, so both of them read the same table
       and neither of them carries a sign. `o` is which hands are on screen and
       it is the `side` option; it persists across marks the way the turn does.

       nothing reads any of this unless the plan asked for hands, so on every
       clip without them it sits at rest and is read by nothing. */
    hands: [mirrorHandPose(HANDS_REST, 0), { ...HANDS_REST }],
    /* their own always on layer, tweened only when there are hands to move. */
    hidle: [{ x: 0, y: 0, rot: 0 }, { x: 0, y: 0, rot: 0 }],
    pad: { v: 0 },
  };
}

/* the pose table is written for the screen right hand, so this is the whole of
   the other one: `x` reflects across the head's own centre line and `rot`
   changes sign. the splay and the thumb angle are **not** mirrored, because
   they live inside the glove's own frame and the glove itself is what gets
   flipped — mirroring them as well would flip it twice. */
function mirrorHandPose(to, k) {
  if (k !== 0) return { ...to };
  const out = { ...to };
  if ('x' in to) out.x = GRID - to.x;
  if ('rot' in to) out.rot = -to.rot;
  return out;
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

/* ---------- the builder a hand pose is written against ----------
   the same discipline as the one above: every call is a `fromTo` with
   `immediateRender:false`, the `from` comes from a pose tracked at build time
   because the channel objects still hold their seed, and a pose ends knowing
   where it left every number so its exit can state that literally.

   the one thing this adds is the mirror. every pose in the table is written for
   the screen right hand and `set` reflects it for the other one, so a pose that
   says `x: A.x + 2.6` moves the right hand outward and the left hand outward
   too, with not a sign anywhere in the table.

   the seeds are the resting pair rather than zero, because a glove is somewhere
   rather than a gesture — the same reason `turn` rests at the bias. */
function handsBuilder(tl, ch, H, t0) {
  const pose = [mirrorHandPose(HANDS_REST, 0), { ...HANDS_REST }];
  const put = (target, from, to, at, forS, ease) =>
    tl.fromTo(target, from, { ...to, duration: forS, ease, immediateRender: false }, at);
  const ez = name => H[name] || H.glide;

  const set = (k, to, opt = {}) => {
    const dst = mirrorHandPose(to, k);
    const at = t0 + (opt.at || 0);
    const forS = opt.for || 0.36;
    const e = ez(opt.ease || 'pop');
    const from = {};
    /* an explicit `from` is how a pose starts somewhere other than where the
       one before it left, and `rest` is the only user of it: it settles down
       onto rest from a little above, which is the difference between arriving
       at rest and having been there. */
    const seed = opt.from ? mirrorHandPose(opt.from, k) : null;
    for (const key in dst) from[key] = seed && key in seed ? seed[key] : pose[k][key];
    const anti = opt.anti || 0;
    if (anti > 0) {
      /* the pull the other way first, forward from the mark rather than
         backward into the frames before it, which is the rule the head's own
         anticipation follows and for the same reason. */
      const back = {};
      for (const key in dst) back[key] = from[key] + (from[key] - dst[key]) * anti;
      const antiFor = opt.antiFor || 4 / 60;
      put(ch.hands[k], from, back, at, antiFor, H.glide);
      put(ch.hands[k], back, dst, at + antiFor, forS, e);
    } else {
      put(ch.hands[k], from, dst, at, forS, e);
    }
    Object.assign(pose[k], dst);
  };

  /* which hands are on screen. it is written on its own channel and on its own
     window so a hand can be taken off screen while the pose is still arriving,
     and it is deliberately not part of the exit — see `exitHandsToRest`. */
  const show = (k, o, opt = {}) => {
    put(ch.hands[k], { o: pose[k].o }, { o }, t0 + (opt.at || 0), opt.for || 0.22, H.glide);
    pose[k].o = o;
  };

  return { set, show, pose };
}

/* the hands' exit. it puts the shape and the placement back to the resting pair
   and it deliberately **leaves `o` alone**: which hands are on screen is the
   `side` option and it is a fact about the composition, the way the turn is a
   fact about where he is facing. a pair that reappeared at the end of every
   pose would make `side` a flicker instead of a choice. */
function exitHandsToRest(tl, ch, H, HB, at, forS) {
  for (let k = 0; k < 2; k++) {
    const from = HB.pose[k], to = mirrorHandPose(HANDS_REST, k);
    const f = {}, t = {};
    for (const key in to) { if (key === 'o') continue; f[key] = from[key]; t[key] = to[key]; }
    tl.fromTo(ch.hands[k], f,
      { ...t, duration: forS, ease: H.glide, immediateRender: false }, at);
  }
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

  /* ---------- the yap ----------
     two tweens per cycle and nothing between them: open on the pop curve, which
     is where the overshoot on each open comes from, then shut on the calm one,
     which is half again as long. the hold at the top and the gap at the bottom
     are simply frames with no tween on them, so the channel sits where the last
     one left it — that is the lazy part, and it costs nothing.

     the whole block is behind `plan.yap`, so a plan with no hand builds the
     timeline it always built. */
  if (plan.yap) {
    for (const c of plan.yap.cycles) {
      const top = +(c.gape * YAP.over).toFixed(4);
      put(ch.yap, { v: 0 }, { v: top }, c.at, c.openFor, H.drift);
      put(ch.yap, { v: top }, { v: c.gape }, c.peak, c.settleFor, H.glide);
      put(ch.yap, { v: c.gape }, { v: 0 }, c.closing, c.shutFor, H.glide);
    }
  }

  /* ---------- the gloves ----------
     their own idle first, for the same reason the head's goes first: a pose
     always writes over a live pair rather than over a still one. two drifts per
     hand on four periods, none of them a multiple of another, and the two hands
     are given different ones so the pair never moves as one object.

     the whole block is behind `plan.hands`, so a plan without them builds the
     timeline it always built. */
  if (plan.hands) {
    const HI = HANDS.idle;
    for (let k = 0; k < 2; k++) {
      /* the y period is the *other* hand's x period stretched, which is the
         cheapest way to get six numbers with no common factor out of four. */
      yo(ch.hidle[k], 'x', HI.amp, HI.period[k]);
      yo(ch.hidle[k], 'y', HI.amp * 0.8, HI.period[1 - k] * 1.19);
      yo(ch.hidle[k], 'rot', HI.rot, HI.rotPeriod[k]);
    }
    /* which hands are on screen is carried across the marks the way the turn
       is, because it is the same kind of fact: a side named once holds until
       something names another one. */
    let onNow = [1, 1];
    for (const m of plan.marks) {
      if (!m.hands) continue;
      const HP = HAND_POSES[m.hands.pose];
      const HB = handsBuilder(tl, ch, H, m.t);
      for (let k = 0; k < 2; k++) HB.pose[k].o = onNow[k];
      /* the side is written before the pose so a hand leaving the screen is
         already on its way out while the other one is arriving. */
      for (let k = 0; k < 2; k++) {
        if (m.hands.on[k] !== onNow[k]) HB.show(k, m.hands.on[k], { for: 0.20 });
      }
      onNow = [...m.hands.on];
      for (const k of m.hands.acting) HP.build(HB, k);
      exitHandsToRest(tl, ch, H, HB, m.hands.leaving, m.hands.exit);
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
  const { a, b, eye, lid, brow, idle, bub, yap } = eng.ch;

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

  /* ---------- the hand ----------
     one number in, two angles out, and that is the whole part: `yap.v` is nought
     shut and one at the full gape, and each slab's angle is a straight
     interpolation between its own two. the pop curve on the open pushes `v` a
     tenth past one, which is deliberately **not** clamped to one — that
     overshoot is the snap in the gesture, and the ceiling here is only a
     backstop against a curve nobody has written yet.

     it slides with the turn at its own share of the near eye's travel and takes
     none of the foreshortening the far eye takes. a hand is held in front of a
     face rather than painted on it, so it does not wrap around the form; it
     goes with the head and it goes less far than the eyes, because it is nearer
     the centre line than they are.

     and its corners are measured against the head's own silhouette, the same
     signed distance the irises and the brows are measured with. the markup
     clips the features to the plate so nothing *can* paint outside it; this is
     the other half of that, and it is what says whether the clip is quietly
     hiding a pose that does not fit. */
  let hand = null;
  if (plan.hand) {
    const v = clamp(yap.v, 0, 1.3);
    const ang = part => HAND.shut[part] + (HAND.open[part] - HAND.shut[part]) * v;
    const hx = sgn * aq * TURN.shift * HAND.turnShare;
    hand = { open: n(v), x: n(hx), fingers: n(ang('fingers')), thumb: n(ang('thumb')) };
    for (const [part, deg] of [[HAND.fingers, hand.fingers], [HAND.thumb, hand.thumb]]) {
      /* negated, because the table says "up" and the slab lies along +x. */
      const th2 = -deg * Math.PI / 180, c3 = Math.cos(th2), s3 = Math.sin(th2);
      for (const dx of [-HAND.back, part.len]) {
        for (const dy of [-part.h / 2, part.h / 2]) {
          outside = Math.max(outside, headSD(
            HAND.hinge.x + hx + dx * c3 - dy * s3,
            HAND.hinge.y + dx * s3 + dy * c3, plan));
        }
      }
    }
  }

  /* ---------- the two gloves ----------
     they are the other hand in this file and they are nothing like the one
     above: `hand` is a mouth made of two slabs and it lives inside the head,
     these are two floating gloves that live beside it.

     every one of them is a placement, a rotation and a scale in card space,
     plus the six shapes the curl arithmetic resolves — and the one number that
     is not obvious, which is the counter scale.

     **the card deforms and the gloves must not.** the card's own transform is
     `sc(1+sq)(1-squeeze)` across and `sc/(1+sq)` down, and a glove riding that
     would stretch on one axis and, worse, carry a stroke thicker on one axis
     than the other — the edge is the whole read of this part and an uneven edge
     is a drawing rather than a rig. so each glove carries the exact inverse of
     those two about its own origin, which leaves the net transform on it
     `sc` in both directions: it scales with the head, tilts with the head and
     travels with the turn, and it does not deform.

     the anchor is **not** counter scaled, and that is the half of it that keeps
     the pair attached. it is a point in the card's own space, so the squash
     moves it and the turn's squeeze pulls it in as the silhouette narrows. on
     top of that the pair slides its own share of the near eye's travel, because
     a hand held beside a face goes with the head and goes less far than the
     features on it. */
  let hands = null;
  if (plan.hands) {
    const sqz = TURN.squeeze * Math.abs(tb);
    const hx = sgn * aq * TURN.shift * HANDS.turnShare;
    let box = null;
    const list = eng.ch.hands.map((p, k) => {
      const id = eng.ch.hidle[k];
      const live = {
        ...p,
        x: p.x + id.x + hx, y: p.y + id.y, rot: p.rot + id.rot,
      };
      const g = gloveAt(live);
      if (live.o > 0.004) {
        const b = handBoxCard(live, g);
        box = box ? {
          x0: Math.min(box.x0, b.x0), x1: Math.max(box.x1, b.x1),
          y0: Math.min(box.y0, b.y0), y1: Math.max(box.y1, b.y1),
        } : b;
      }
      return {
        o: n(clamp(live.o, 0, 1)),
        x: n(live.x), y: n(live.y), rot: n(live.rot),
        /* the mirror is folded into the scale, so the page writes one transform
           per glove and never asks which hand it is holding. */
        sx: n((k === 0 ? -1 : 1) * live.sc), sy: n(live.sc),
        fingers: g.fingers, thumb: g.thumb,
        /* the pose with no idle in it, which is what the preflight scores the
           entrance, the overshoot and the settle on. the always on drift is
           within a third of a unit and a pose's overshoot is about the same, so
           judging one against the other would be judging mostly the drift —
           this is the same reason `fr.pose` exists beside `fr.head`. */
        pose: { x: n(p.x), y: n(p.y), rot: n(p.rot) },
      };
    });
    hands = {
      /* the inverse of the card's two scales, which is the only number in the
         frame that exists to undo something rather than to do it. */
      fit: { cx: n(1 / ((1 + card.sq) * (1 - sqz))), cy: n(1 + card.sq) },
      list,
      /* where the pair's ink actually reaches, in card space grid units, so the
         placement and the capture region can hold room for it. null when both
         hands are off screen. */
      box: box ? {
        x0: n(box.x0), x1: n(box.x1), y0: n(box.y0), y1: n(box.y1),
      } : null,
    };
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
    /* null on every plan without a hand, which is every plan written before
       there was one. */
    hand,
    /* and null on every plan without the gloves, which is every plan written
       before them. the two keys are next to each other on purpose: one is the
       mouth that is not a mouth and the other is the pair of hands, and a clip
       may have either, both or neither. */
    hands,
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
  /* ---------- and the gloves, when there are any ----------
     they are ink outside the silhouette, so a rect that ignored them would say
     the mascot clears a border it is not clearing. the box is grown to hold
     them and nothing else about this function changes, which is why a plan
     without them measures exactly what it always measured.

     the chain is worth writing out because it is not the card's. the anchor is
     a point in card space, so it takes the card's own two scales and its
     rotation. the glove's **shape** does not: it carries the inverse of those
     two scales, so what is left on it is a uniform `sc` and a rotation, which
     is the whole reason a hand does not deform. so the two halves are
     transformed differently, and folding them together would be wrong in the
     direction that matters — a squashed head would under-report the reach. */
  /* the four clearances are carried as clearances rather than as edges, so the
     no-hands path evaluates the same three expressions it always did — a
     rewrite of `w - cx - hw` into `w - (cx + hw)` is the same number in algebra
     and not always the same double, and this function's whole job is to be
     compared against its own past output. */
  let l = cx - hw, r = STAGE.w - cx - hw, t2 = cy - hh, b2 = STAGE.h - cy - hh;
  if (fr.hands) {
    const O = plan.box.left + (GRID / 2) * u, Oy = plan.box.top + (GRID / 2) * u;
    for (const h of fr.hands.list) {
      if (h.o <= 0.004) continue;
      /* the anchor, through the card's own scale and rotation. */
      const ax = fr.card.sx * (h.x - GRID / 2), ay = fr.card.sy * (h.y - GRID / 2);
      const px = c * ax - s * ay, py = s * ax + c * ay;
      /* and the shape, through a rotation and a uniform scale only. `sx`
         carries the mirror, so the corner sweep covers both hands. */
      const th2 = (fr.card.rot + h.rot) * Math.PI / 180;
      const c2 = Math.cos(th2), s2 = Math.sin(th2);
      for (const [gx, gy] of gloveCorners(h)) {
        const ex = h.sx * gx, ey = h.sy * gy;
        const qx = O + fr.card.x + (px + ex * c2 - ey * s2) * u;
        const qy = Oy + fr.card.y + (py + ex * s2 + ey * c2) * u;
        l = Math.min(l, qx); r = Math.min(r, STAGE.w - qx);
        t2 = Math.min(t2, qy); b2 = Math.min(b2, STAGE.h - qy);
      }
    }
  }
  return {
    left: +(l * d).toFixed(1), top: +(t2 * d).toFixed(1),
    right: +(r * d).toFixed(1),
    bottom: +(b2 * d).toFixed(1),
    /* how far the shadow and the glow reach past the ink, for the report. */
    shadowBottom: +((STAGE.h - (cy + SHADOW.dy * plan.size + plan.size * SHADOW.h / 2 * fr.shadow.sc)) * d).toFixed(1),
    glowReach: +(GLOW.wide.blur * 3 * d).toFixed(1),
  };
}

/* ---------- how a thing arrives ----------
   the anticipation, the entry, the overshoot and the settle, off a track of
   `{t, v}` rows and the mark it was supposed to hit. it is one function because
   it answers one question, and a state and a hand pose both ask it: "does it
   wind up, does it go past, does it come to rest, and how long did each of
   those take". two copies of this would be two definitions of overshoot. */
function scoreArrival(rows, mark, entryFor, fps) {
  const to = mark.to;
  /* where the channel was when the mark opened. it is scored against where it
     started, and for most channels that is rest — but the turn is where he is
     already facing and a glove is where it already is, so it is read off the
     mark's own first frame rather than assumed. an explicit `from` still wins. */
  const rest = mark.from != null ? mark.from
    : rows.length ? rows[0].v : (mark.chan === 'sc' ? 1 : 0);
  const span = to - rest;
  const dir = span >= 0 ? 1 : -1;
  /* the anticipation: how far the channel went the wrong way before it went the
     right way, and for how many frames. */
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
     where the plan says it has arrived and where the hold is allowed to start
     moving again. bounding it by a fixed tail instead would score thinking's
     scan and agreeing's second nod as the entrance failing to settle, which is
     the opposite of what they are. */
  let stop = rows.length;
  for (let i = 0; i < rows.length; i++) if (rows[i].t > entryFor) { stop = i; break; }
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
    antiFrames, antiPeak: +antiPeak.toFixed(3),
    entryFrames: cross == null ? null : cross,
    entryMs: cross == null ? null : Math.round(cross / fps * 1000),
    overshoot: +(over * 100).toFixed(1),
    settleFrames: cross == null ? null : last - cross,
    settleMs: cross == null ? null : Math.round((last - cross) / fps * 1000),
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
    turn: { d: 0, t: 0 }, hand: { d: 0, t: 0 }, hands: { d: 0, t: 0 },
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
  /* the hand's own report. how wide it ever opens, how far it ever shuts, and
     how many times it went from one to the other — which is the number a clip
     checks its syllables against, counted off the drawn angles rather than off
     the plan that asked for them. */
  let handHi = 0, handLo = Infinity, handOpens = 0, handRising = false;
  /* and the number the speed argument is actually had in: how far the
     fingertip travels between two frames, in css px. the gape is a nought to
     one channel and a fraction of it per frame says nothing about whether a
     viewer sees a step — the tip's own travel does, and it is the same unit the
     shake and the blink are argued in. */
  let handStep = 0, handStepAt = 0, handTip = null;
  /* ---------- and the gloves' own report ----------
     how far past the plate the drawn ink actually reached on each edge, which
     is the number the placement held room for and is checked against it; how
     many frames each hand was on screen, so a `side` that never took can be
     seen; and the widest one frame move of a hand, in css px, which is the unit
     the speed of everything else in this file is argued in. */
  const htrack = plan.marks.map(() => []);
  const reach = { l: 0, r: 0, t: 0, b: 0 };
  const onFrames = [0, 0];
  let handsAnchor = null;

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
    if (fr.hand) {
      handHi = Math.max(handHi, fr.hand.open);
      handLo = Math.min(handLo, fr.hand.open);
      /* an open is counted when the gape crosses half way up, and it is not
         counted again until it has come back under a quarter. a hysteresis
         rather than a turning point, because the pop curve's own settle puts
         two turning points on every open and only one of them is a syllable. */
      if (!handRising && fr.hand.open > 0.5) { handRising = true; handOpens++; }
      else if (handRising && fr.hand.open < 0.25) handRising = false;
      /* both tips, and the faster of the two is the answer. which one that is
         depends on the table: with the fingers held flat and the thumb doing the
         opening it is the thumb, and a version of this that only watched the
         fingers would report a hand that barely moves. */
      const tip = [HAND.fingers, HAND.thumb].map((part, k) => {
        const a = -(k ? fr.hand.thumb : fr.hand.fingers) * Math.PI / 180;
        return {
          x: (HAND.hinge.x + fr.hand.x + part.len * Math.cos(a)) * plan.unit,
          y: (HAND.hinge.y + part.len * Math.sin(a)) * plan.unit,
        };
      });
      if (handTip) {
        for (let k = 0; k < 2; k++) {
          const d = Math.hypot(tip[k].x - handTip[k].x, tip[k].y - handTip[k].y);
          if (d > handStep) { handStep = d; handStepAt = t; }
        }
      }
      handTip = tip;
    }
    if (fr.hands) {
      const P2 = HEAD.plate, bx = fr.hands.box;
      if (bx) {
        reach.l = Math.max(reach.l, P2.x - bx.x0);
        reach.r = Math.max(reach.r, bx.x1 - (P2.x + P2.s));
        reach.t = Math.max(reach.t, P2.y - bx.y0);
        reach.b = Math.max(reach.b, bx.y1 - (P2.y + P2.s));
      }
      const now2 = fr.hands.list.map(h => ({ x: h.x * plan.unit, y: h.y * plan.unit, o: h.o }));
      for (let k = 0; k < 2; k++) if (now2[k].o > 0.5) onFrames[k]++;
      if (handsAnchor) {
        for (let k = 0; k < 2; k++) {
          if (now2[k].o < 0.5 || handsAnchor[k].o < 0.5) continue;
          bump('hands', Math.hypot(now2[k].x - handsAnchor[k].x, now2[k].y - handsAnchor[k].y), t);
        }
      }
      handsAnchor = now2;
      /* the pose's own channel, read off the hand that is actually doing it. */
      for (let k = 0; k < plan.marks.length; k++) {
        const m = plan.marks[k];
        if (!m.hands || t < m.t || t > m.hands.leaving) continue;
        htrack[k].push({
          t: +(t - m.t).toFixed(4),
          v: fr.hands.list[m.hands.acting[0]].pose[m.hands.mark.chan],
        });
      }
    }
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
      if (fr.hand && prev.hand) bump('hand', Math.abs(fr.hand.open - prev.hand.open), t);
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
        + Math.abs(fr.eyes[0].lid - prev.eyes[0].lid) + Math.abs(fr.eyes[0].x - prev.eyes[0].x)
        + (fr.hand && prev.hand ? Math.abs(fr.hand.open - prev.hand.open) : 0)
        /* the gloves count too: a face that is still for three frames while a
           hand is waving is not a frozen face. it is nought on every clip
           without them, so this changes no number that was ever reported. */
        + (fr.hands && prev.hands
          ? Math.abs(fr.hands.list[0].x - prev.hands.list[0].x)
          + Math.abs(fr.hands.list[1].x - prev.hands.list[1].x)
          + Math.abs(fr.hands.list[0].rot - prev.hands.list[0].rot) * 0.1 : 0);
      if (moved < 1e-4) { still++; if (still >= 3) frozen++; } else still = 0;
    }
    prev = fr;
  }

  const states = plan.marks.map((m, k) => ({
    state: m.state, at: m.t, chan: m.mark.chan, to: m.mark.to,
    ...scoreArrival(track[k], m.mark, m.entry, fps),
    bubble: m.bubbles ? m.bubbles.map(b => b.text).join(' / ') : null,
  }));

  /* ---------- and the same three numbers for the gloves ----------
     a pose declares the one channel it is judged on exactly as a state does,
     and it goes through the same scoring, because "does it wind up, does it
     overshoot, does it settle" is the same question about a hand as about a
     head and two implementations of it would drift apart. */
  const poses = plan.marks.filter(m => m.hands).map(m => ({
    pose: m.hands.pose, at: m.t, side: m.hands.side, acting: m.hands.acting,
    chan: m.hands.mark.chan, to: m.hands.mark.to,
    ...scoreArrival(htrack[m.i], m.hands.mark, m.hands.entry, fps),
  }));

  const keys = plan.idle.blinks.map(blinkKey);
  return {
    frames: N, fps,
    worst, states, poses,
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
    hand: plan.hand ? {
      opens: handOpens,
      gape: { lo: +(handLo === Infinity ? 0 : handLo).toFixed(3), hi: +handHi.toFixed(3) },
      stepCss: +handStep.toFixed(2), stepAt: +handStepAt.toFixed(3),
      cycles: plan.yap ? plan.yap.count : 0,
      period: plan.yap ? plan.yap.period : null,
      /* the length of the slab in device px, worked out the same way the head's
         is: grid units times the plan's own unit times the device scale. the
         page measures the rendered rect and the two are checked against each
         other by whoever renders. */
      lenPx: +((HAND.fingers.len + HAND.back) * plan.unit * STAGE.dsf).toFixed(1),
      thickPx: +(HAND.fingers.h * plan.unit * STAGE.dsf).toFixed(1),
      thumbPx: +((HAND.thumb.len + HAND.back) * plan.unit * STAGE.dsf).toFixed(1),
      /* how far apart the two tips get at the widest gape, which is the number
         that decides whether it reads as a mouth or as a bar. */
      gapePx: +((HAND.fingers.len * Math.sin(HAND.open.fingers * Math.PI / 180)
        + HAND.thumb.len * Math.sin(-HAND.open.thumb * Math.PI / 180)
        - HAND.fingers.h / 2 - HAND.thumb.h / 2) * plan.unit * STAGE.dsf).toFixed(1),
    } : null,
    /* null on every plan without the gloves, which is every plan written before
       them, and it is what the self test asserts the opt in on. */
    hands: plan.hands ? {
      poses: poses.length,
      /* how far the drawn ink reached past the plate on each edge, against what
         the placement held room for. planned is measured off the same frames,
         so this is a check that the two measurements agree rather than a check
         on a guess — and it catches a clip that re-planned the marks without
         re-planning the placement. */
      reach: {
        l: +reach.l.toFixed(3), r: +reach.r.toFixed(3),
        t: +reach.t.toFixed(3), b: +reach.b.toFixed(3),
      },
      held: plan.handsReach,
      overrun: +Math.max(
        reach.l - plan.handsReach.l, reach.r - plan.handsReach.r,
        reach.t - plan.handsReach.t, reach.b - plan.handsReach.b).toFixed(3),
      onFrames,
      /* one glove's own size in device px, worked out the way the head's is:
         grid units times the plan's own unit times the device scale. the page
         measures the rendered box and the two are checked against each other. */
      wPx: +((HANDS.palm.w + HANDS.thumb.len * 0.55) * plan.unit * STAGE.dsf).toFixed(1),
      hPx: +((HANDS.palm.h + HANDS.fingers.len) * plan.unit * STAGE.dsf).toFixed(1),
      palmPx: +(HANDS.palm.w * plan.unit * STAGE.dsf).toFixed(1),
      fingerPx: +(HANDS.fingers.w * plan.unit * STAGE.dsf).toFixed(1),
      gapPx: +((HANDS.fingers.pitch - HANDS.fingers.w) * plan.unit * STAGE.dsf).toFixed(1),
      edgePx: +(HANDS.edge * plan.unit * STAGE.dsf).toFixed(2),
      /* the widest one frame move of a hand, in css px, which is the unit the
         blink and the yap are already argued in. */
      stepCss: +worst.hands.d.toFixed(2), stepAt: worst.hands.t,
    } : null,
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
  /* ---------- the hand, and only if the plan asked for one ----------
     two rounded slabs lying along -x from the hinge, each reaching `back` units
     past it so the wrist is one shape rather than two bars butted together. the
     rounding is half the slab's own height, which is exactly how the iris is
     drawn, and the fill is the iris's own token — so it is the same ink, the
     same weight and the same corner as the eyes above it.

     they are drawn last inside the clipped group, so they sit over the eyes if
     a pose ever brings the two together. nothing about them is animated in the
     markup: the page writes one rotation per slab per frame. */
  const H2 = HAND;
  const hand = () => {
    const bar = (cls, part) => `<rect class="${cls}" x="${n(H2.hinge.x - H2.back)}"`
      + ` y="${n(H2.hinge.y - part.h / 2)}" width="${n(part.len + H2.back)}"`
      + ` height="${n(part.h)}" rx="${n(part.h / 2)}"/>`;
    return `<g class="m-hand" id="m-hand">`
      + bar('m-finger', H2.fingers) + bar('m-thumb', H2.thumb) + `</g>`;
  };
  /* ---------- the gloves, and only if the plan asked for a pair ----------
     one glove is a palm, four fingers and a thumb, all rounded rects, and the
     second hand is the first one's markup again with a mirror written into its
     transform rather than a second drawing. every shape is drawn at its own
     rest and every number that moves is written per frame by apply().

     the fingers and the thumb grow **upward** from their own base — `y` is
     minus the length and `height` is the length — so a curl changes those two
     and leaves `rx` alone. shortening a rounded rect by scaling it would squash
     the corner, and the slightly flattened tip is the one detail that stops
     four capsules reading as four sausages.

     it is drawn twice, and that is the separation edge. the ink layer is
     unclipped and fill only; the edge layer is the same shapes, clipped to the
     plate's own outline and stroke only, so the outline exists exactly where
     the hand is over the face and nowhere else. the clip is the same one the
     features use, to the unit. */
  const F = HANDS.fingers, T = HANDS.thumb, PA = HANDS.palm;
  const cap = (w, len, rr) => `<rect class="m-gl" x="${n(-w / 2)}" y="${n(-len)}"`
    + ` width="${n(w)}" height="${n(len)}" rx="${n(rr)}"/>`;
  /* ---------- the digits go behind the mitt, and that is the whole read ----------
     the fingers and the thumb are drawn first and the palm last, so the palm's
     own fill covers whatever is tucked under it and only the part of a digit
     that is actually outside the mitt is on the screen. it is how the reference
     is constructed and it is what stops a curled hand being a tangle: with the
     fingers on top, every one of them draws a complete outline over the palm on
     the edge layer, and `facepalm` and `panic` came back as five loops on the
     face rather than as a hand with its fingers folded away.

     it costs nothing on the ink layer, where every shape is the same colour. */
  const glove = (layer, k) => {
    const id = 'm-gl-' + layer + k;
    let s = `<g class="m-glove" id="${id}">`;
    for (let i = 0; i < 4; i++) {
      s += `<g id="${id}-f${i}">` + cap(F.w, F.len * F.reach[i], F.w * HANDS.tipR) + `</g>`;
    }
    s += `<g id="${id}-t">` + cap(T.w, T.len, T.w * HANDS.tipR) + `</g>`;
    return s + `<rect class="m-gl" x="${n(-PA.w / 2)}" y="${n(-PA.h)}" width="${n(PA.w)}"`
      + ` height="${n(PA.h)}" rx="${n(PA.rx)}"/></g>`;
  };
  const gloves = layer => `<g class="m-hands m-hands-${layer}" id="m-hands-${layer}"`
    + (layer === 'edge' ? ' clip-path="url(#m-head)"' : '') + `>`
    + glove(layer, 0) + glove(layer, 1) + `</g>`;

  const clip = `<clipPath id="m-head"><rect x="${P.x}" y="${P.y}" width="${P.s}" height="${P.s}" rx="${n(rx)}"/></clipPath>`;
  const face = `<svg class="m-face" viewBox="0 0 ${GRID} ${GRID}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">`
    + `<defs>${clip}</defs>`
    + plate
    + `<g class="m-features" clip-path="url(#m-head)">`
    + eye(0) + eye(1) + brow(0) + brow(1)
    + (plan.hand ? hand() : '')
    + `</g>`
    /* the gloves sit over the face and outside the clip, because a hand in
       front of a head covers it and a hand beside one is off it. */
    + (plan.hands ? gloves('ink') + gloves('edge') : '')
    + `</svg>`;
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
  /* ---------- the two placements ----------
     the css below is written for the beside one and every number in its
     comments is about that. over the crown is the other, and all six numbers it
     needs arrive on `plan.thought` already worked out: the edge the cluster is
     anchored by, the offset off it, the flow direction, the three lifts and the
     pill's spring corner. this function reads them and decides nothing — see
     `placeThought`.

     the beside branch is written as the literal it always was rather than as a
     default falling out of the over one, and a plan made before this option
     existed carries no `thought` at all and lands there too. that is the whole
     promise: a clip that did not ask for this writes the same bytes it wrote
     before, comments included. */
  const TH = plan.thought && plan.thought.mode === 'over' ? plan.thought : null;
  const bubEdge = TH ? TH.anchor.edge : 'left';
  const bubX = TH ? TH.anchor.x : n(S * (HEAD.plate.x + HEAD.plate.s) / GRID + BUBBLE.gap);
  const bubBottom = TH ? TH.anchor.bottom : n(S * (1 - (HEAD.plate.y + HEAD.plate.s * 0.34) / GRID));
  const bubFlow = TH ? `flex-direction:${TH.flow}; ` : '';
  const pillLift = TH ? TH.lifts[2] : BUBBLE.pillLift;
  const pillOrigin = TH ? TH.origin : '0% 100%';
  const dotCss = BUBBLE.dots
    .map((d, i) => `#m-dot${i}{width:${d.d}px;height:${d.d}px;margin-bottom:${TH ? TH.lifts[i] : d.lift}px}`)
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
.m-eye{will-change:transform}${plan.hand ? `
/* the hand. the iris's own fill, so the mouth that is not a mouth is drawn in
   the same ink as the eyes and belongs to the same face. it is a rotation per
   slab per frame and nothing else, written by apply(). */
.m-finger,.m-thumb{fill:var(--eye); will-change:transform}` : ''}${plan.hands ? `

/* ---------- the floating hands ----------
   the plate's own fill, so a glove is the same ink as the head: white on the
   dark page, ink on the light one, and it inverts with the theme for free
   because both are the same token.

   the edge is the whole reason there are two layers. --eye is defined to always
   equal the page background, so an outline drawn in it reads as a cut between
   the hand and whatever is behind it — and the layer carrying it is clipped to
   the head, so that cut exists over the face and nowhere else. over the
   background there is no stroke at all: the glove is already a white shape on a
   dark page, and a page coloured line out there would sit on the dark theme's
   glow and read as a dark ring rather than as nothing.

   the width is in grid units and each glove cancels the card's own two scales,
   so the net transform on a hand is uniform and the stroke is the same weight
   on every edge of it. round joins because a glove has no sharp corners. */
.m-hands{pointer-events:none}
.m-hands-ink .m-gl{fill:var(--face)}
/* the edge layer paints the **same fill as the ink layer** and strokes on top of
   it, which looks redundant and is the opposite: painting the face colour over
   the face is invisible, and it is what makes a shape drawn later cover the
   outline of one drawn earlier. with fill:none every digit tucked behind the
   mitt drew its whole outline anyway, and a folded hand came back as a knot of
   loops. it is the one line that turns a stack of shapes into a hand. */
.m-hands-edge .m-gl{
  fill:var(--face); stroke:var(--eye); stroke-width:${HANDS.edge};
  stroke-linejoin:round; stroke-linecap:round;
}
.m-glove{will-change:transform}` : ''}

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
  position:absolute; ${bubEdge}:${bubX}px;
  bottom:${bubBottom}px;
  display:flex; ${bubFlow}align-items:flex-end; gap:${BUBBLE.dotGap}px;
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
  margin-bottom:${pillLift}px;
  padding:${BUBBLE.padY}px ${BUBBLE.padX}px;
  border:${BUBBLE.stroke}px solid var(--bub); border-radius:${BUBBLE.radius}px;
  background:var(--eye); color:var(--face);
  font-family:var(--body); font-weight:${BUBBLE.weight}; font-size:${BUBBLE.size}px;
  line-height:1.25; letter-spacing:.005em; white-space:nowrap;
  /* the site springs it from its bottom left, which is the corner nearest the
     dots, so it grows out of them rather than out of its own middle. */
  transform-origin:${pillOrigin}; opacity:0; will-change:transform,opacity;
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
    /* the hinge, and nothing else about the hand: the page rotates two slabs
       about it and decides nothing. null when there is no hand, and the page
       half checks the element rather than this, so an older page runtime and a
       newer plan cannot disagree. */
    hand: plan.hand ? { hinge: HAND.hinge } : null,
    /* and nothing at all about the gloves, which is not an oversight: every
       number they need arrives on the frame already resolved, and the page
       finds the elements by id. null when there are none, and the page half
       checks the element rather than this. */
    hands: plan.hands ? { edge: HANDS.edge } : null,
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
  /* the hand, or nothing. the markup only carries it when the plan asked for
     one, so every clip without a hand finds null here and this half of the
     runtime never runs. it is checked on the element rather than on the plan so
     the two can never disagree about whether there is something to write to. */
  const finger = card.querySelector('.m-finger');
  const thumb = card.querySelector('.m-thumb');

  /* the gloves, or nothing. two layers of two hands: the ink layer is the fill
     and the edge layer is the same shapes clipped to the head, and they are
     written together in one loop, because two loops is two chances for the
     outline to be drawing a hand that is somewhere else. */
  const gloves = ['ink', 'edge'].map(layer => [0, 1].map(k => {
    const g = document.getElementById('m-gl-' + layer + k);
    if (!g) return null;
    return {
      g: g,
      fingers: [0, 1, 2, 3].map(i => document.getElementById('m-gl-' + layer + k + '-f' + i)),
      thumb: document.getElementById('m-gl-' + layer + k + '-t'),
      rects: [
        ...[0, 1, 2, 3].map(i => document.getElementById('m-gl-' + layer + k + '-f' + i).firstChild),
        document.getElementById('m-gl-' + layer + k + '-t').firstChild,
      ],
    };
  }));
  const hasGloves = !!gloves[0][0];

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
        /* the hand as it actually painted: whether it is there at all, and how
           long and how thick it is in device px, which is the only unit a
           "does it read at phone size" argument can be had in. it is measured
           off the rendered rects rather than off the geometry table, because
           the table is in grid units and the question is about pixels. */
        hand: finger ? {
          lenPx: +(finger.getBoundingClientRect().width * P.stage.dsf).toFixed(1),
          thickPx: +(finger.getBoundingClientRect().height * P.stage.dsf).toFixed(1),
          thumbPx: +(thumb.getBoundingClientRect().width * P.stage.dsf).toFixed(1),
        } : null,
        /* the gloves as they actually painted. the size is the question "does
           it read at phone size" asked in the only unit it can be asked in, and
           the stroke is measured rather than read off the css: the ink layer's
           rect is the geometry and the edge layer's is the geometry plus half a
           stroke on every side, so the difference between the two rendered
           boxes is the stroke, whatever chrome decided to round it to. */
        hands: hasGloves ? (() => {
          const ink = gloves[0][1].g.getBoundingClientRect();
          /* the stroke as it computed, in the svg's own user units, turned into
             device px by the one conversion the whole file uses. it is read off
             the computed style rather than off the table for the same reason
             the bubble's outline is: what was typed and what chrome resolved
             are two different numbers, and only one of them is on screen. */
          const sw = parseFloat(getComputedStyle(gloves[1][1].rects[1]).strokeWidth) || 0;
          const per = P.size / P.grid;
          return {
            wPx: +(ink.width * P.stage.dsf).toFixed(1),
            hPx: +(ink.height * P.stage.dsf).toFixed(1),
            edgeUnits: +sw.toFixed(3),
            edgePx: +(sw * per * P.stage.dsf).toFixed(2),
            gloves: gloves[0].filter(Boolean).length + gloves[1].filter(Boolean).length,
          };
        })() : null,
        theme: document.documentElement.getAttribute('data-theme'),
      };
    },
    /* one call switches the theme. both variants go through every guard below,
       which is the point of it being one call. */
    theme(t) { document.documentElement.setAttribute('data-theme', t); },

    /* how big a glove actually is, **after a frame has been applied**, which is
       the only time the answer means anything: the markup draws every finger
       stacked on its own base and it is `apply` that fans them out, so measuring
       this in `build` returns the palm and calls it a hand. it is a separate
       call rather than a key on `build` for exactly that reason — the two
       questions are asked at different times. */
    gloveRect() {
      if (!hasGloves) return null;
      const r = gloves[0][1].g.getBoundingClientRect(), d = P.stage.dsf;
      /* the palm as well as the whole hand, and the palm is the one worth
         guarding on. the whole hand's box is an axis aligned rect around a
         rotated shape with a splayed thumb in it, so it swings by a third
         between a fist and an open hand and says as much about the pose as
         about the drawing. the palm is the mitt, it is the same size in every
         pose, and it is the number the reference was measured on: 93px of a
         244px head there, which is 0.38.

         `getBBox` is geometry rather than layout, so it is read in the svg's own
         user units and converted once — the same conversion the head uses. */
      const per = P.size / P.grid;
      const palm = gloves[0][1].g.lastChild.getBBox();
      return {
        wPx: +(r.width * d).toFixed(1), hPx: +(r.height * d).toFixed(1),
        palmPx: +(palm.width * per * d).toFixed(1),
      };
    },

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

      /* the hand: two rotations about the one hinge, plus the turn's own slide
         on both of them. the origin sandwich is the same one the eyes and the
         brows use, so a rotation inside the svg is exact at any scale. */
      if (finger && f.hand) {
        const hh = P.hand.hinge;
        /* negated: the angles say "up" and the slabs lie along +x from the
           hinge, where an svg rotation by a positive angle goes down. */
        finger.setAttribute('transform', about(hh.x, hh.y, f.hand.x, 0, -f.hand.fingers, 1, 1));
        thumb.setAttribute('transform', about(hh.x, hh.y, f.hand.x, 0, -f.hand.thumb, 1, 1));
      }

      /* ---------- the gloves ----------
         one transform per hand and one per digit, and the only line worth
         explaining is the middle scale. the card is squashed and squeezed on x
         alone; the glove carries the inverse of both about its own origin, so
         what is left on it is the head's uniform scale — it goes with the head
         and it does not deform, and the stroke on the edge layer stays the same
         weight on every side of it.

         the mirror is in `sx`, so this loop never asks which hand it is
         holding, and the two layers are written from the same numbers in the
         same pass. */
      if (hasGloves && f.hands) {
        const fit = 'scale(' + f.hands.fit.cx.toFixed(5) + ' ' + f.hands.fit.cy.toFixed(5) + ') ';
        for (let L = 0; L < 2; L++) {
          for (let k = 0; k < 2; k++) {
            const h = f.hands.list[k], G = gloves[L][k];
            G.g.style.opacity = h.o.toFixed(4);
            if (h.o < 0.004) continue;
            G.g.setAttribute('transform',
              'translate(' + h.x.toFixed(3) + ' ' + h.y.toFixed(3) + ') ' + fit
              + 'rotate(' + h.rot.toFixed(3) + ') '
              + 'scale(' + h.sx.toFixed(4) + ' ' + h.sy.toFixed(4) + ')');
            for (let i = 0; i < 4; i++) {
              const d = h.fingers[i];
              G.fingers[i].setAttribute('transform',
                'translate(' + d.x.toFixed(3) + ' ' + d.y.toFixed(3) + ') rotate(' + d.a.toFixed(3) + ')');
              /* a curl shortens the capsule rather than scaling it, so the
                 flattened tip keeps its own corner at every length. */
              G.rects[i].setAttribute('y', (-d.len).toFixed(3));
              G.rects[i].setAttribute('height', d.len.toFixed(3));
            }
            const tb = h.thumb;
            G.thumb.setAttribute('transform',
              'translate(' + tb.x.toFixed(3) + ' ' + tb.y.toFixed(3) + ') rotate(' + tb.a.toFixed(3) + ')');
            G.rects[4].setAttribute('y', (-tb.len).toFixed(3));
            G.rects[4].setAttribute('height', tb.len.toFixed(3));
          }
        }
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
    if (m.hands) {
      const h = m.hands;
      out.push('              hands: ' + h.pose.padEnd(11) + h.side + ' on screen, '
        + (h.acting.length > 1 ? 'both act' : 'the ' + (h.acting[0] ? 'right' : 'left') + ' hand acts')
        + ', entry ' + h.entry.toFixed(2) + ' hold ' + h.hold.toFixed(2)
        + ' exit ' + h.exit.toFixed(2) + ', to ' + h.out.toFixed(2) + 's');
    }
  }
  if (plan.thought && plan.thought.mode === 'over') {
    const th = plan.thought;
    out.push('    thought: over the crown, climbing ' + th.side + ' at ' + th.angle
      + ' degrees, lifts ' + th.lifts.join(', ') + ' off the row'
      + (th.asked === 'over' ? ' (from pos ' + plan.pos + ')' : ' (asked for)'));
  }
  if (plan.hands) {
    const r = plan.handsReach;
    out.push('    hands: on, ' + plan.marks.filter(m => m.hands).length + ' poses, reaching '
      + [r.l, r.r, r.t, r.b].map(v => v.toFixed(1)).join('/')
      + ' units past the plate (l/r/t/b), edge ' + HANDS.edge + ' units');
  }
  if (plan.yap) {
    out.push('    hand: ' + plan.yap.count + ' yap cycles over '
      + plan.yap.windows.map(w => w.from.toFixed(2) + '..' + w.until.toFixed(2)).join(', ')
      + ', period ' + (plan.yap.period.lo * 1000).toFixed(0) + ' to '
      + (plan.yap.period.hi * 1000).toFixed(0) + 'ms, gape '
      + plan.yap.gape.lo.toFixed(2) + ' to ' + plan.yap.gape.hi.toFixed(2));
  } else if (plan.hand) {
    out.push('    hand: on, and nothing yaps it');
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
  if (rep.hand) {
    out.push('  hand: ' + rep.hand.opens + ' opens off the drawn angles against '
      + rep.hand.cycles + ' planned, gape ' + rep.hand.gape.lo.toFixed(2) + ' to '
      + rep.hand.gape.hi.toFixed(2) + ', ' + rep.hand.lenPx + 'px long, '
      + rep.hand.thickPx + 'px thick, opening to ' + rep.hand.gapePx + 'px, '
      + 'fastest frame moves the tip ' + rep.hand.stepCss.toFixed(2) + ' css px');
  }
  if (rep.hands) {
    const h = rep.hands;
    out.push('  hands: one glove is ' + h.wPx + 'x' + h.hPx + 'px, palm ' + h.palmPx
      + 'px, finger ' + h.fingerPx + 'px with a ' + h.gapPx + 'px gap, edge ' + h.edgePx + 'px');
    out.push('         reach ' + [h.reach.l, h.reach.r, h.reach.t, h.reach.b].map(v => v.toFixed(1)).join('/')
      + ' units against ' + [h.held.l, h.held.r, h.held.t, h.held.b].map(v => v.toFixed(1)).join('/')
      + ' held' + (h.overrun > 0.001 ? '  OVERRUN by ' + h.overrun.toFixed(2) : '')
      + ', on screen ' + h.onFrames[0] + '/' + h.onFrames[1] + ' of ' + rep.frames + ' frames'
      + ', fastest frame moves a hand ' + h.stepCss.toFixed(2) + ' css px');
    out.push('  pose          anti  entry   over   settle   mark');
    for (const p of rep.poses) {
      out.push('    ' + p.pose.padEnd(12)
        + String(p.antiFrames).padStart(3) + 'f'
        + String(p.entryFrames == null ? '--' : p.entryFrames + 'f').padStart(7)
        + (p.overshoot.toFixed(1) + '%').padStart(8)
        + (p.settleMs == null ? '--' : p.settleMs + 'ms').padStart(9)
        + '   ' + p.chan + ' to ' + p.to + '  ' + p.side);
    }
  }
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

  /* ---------- the thought, derived off the same fact ----------
     it climbs toward the middle of the frame from every corner, it starts on
     the top middle of the head, and the run really is a straight line. all
     three are arithmetic, so none of them needs a render to answer. */
  const think = pos => planMascot({
    seconds: 4, marks: [{ t: 0.3, state: 'curious', bubble: 'go on' }], pos, thought: 'over',
  }).thought;
  ok('the thought climbs into the frame from either corner',
    think('bottom-left').side === 'right' && think('bottom-right').side === 'left'
    && think('top-left').side === 'right' && think('top-right').side === 'left',
    'left ' + think('bottom-left').side + ', right ' + think('bottom-right').side);
  ok('a named side wins over the corner',
    planMascot({ seconds: 4, marks: [{ t: 0.3, state: 'neutral' }], pos: 'bottom-left', thought: 'over-left' })
      .thought.side === 'left');
  ok('an unknown placement is refused', (() => {
    try { planMascot({ seconds: 4, marks: [{ t: 0.3, state: 'neutral' }], thought: 'behind' }); return false; }
    catch { return true; }
  })());

  /* the run starts on him. the first dot's centre sits on the plate's own
     vertical centre line — not on the box's, which is two grid units wider on
     every side and is what a dot floating beside his head is placed off — and
     one gap above the crown. */
  const overPlan = planMascot({
    seconds: 4, marks: [{ t: 0.3, state: 'curious', bubble: 'go on' }],
    size: 128, pos: 'bottom-right', thought: 'over',
  });
  const crown = overPlan.thought;
  const U = 128 / GRID;
  ok('the first dot starts on the top middle of the head',
    crown.start.x === n((HEAD.plate.x + HEAD.plate.s / 2) * U)
    && crown.start.y === n(crown.crownTop - BUBBLE.gap),
    'centre line ' + crown.start.x + ' against the plate at ' + n((HEAD.plate.x + HEAD.plate.s / 2) * U)
    + ', ' + BUBBLE.gap + 'px above a crown that reaches ' + crown.crownTop);

  /* and the crown it is measured off is the one the clip actually has, not the
     one at rest. a state that hops drives fifteen css px of head through a dot
     hung five above the resting crown, and the first render of this placement
     had the small dot half swallowed. */
  const hop = planMascot({
    seconds: 4, marks: [{ t: 0.3, state: 'delighted', bubble: 'crunchy' }],
    size: 128, pos: 'bottom-right', thought: 'over',
  });
  const hopR = HEAD.plate.s / 2 * hop.unit, hopCy = (HEAD.plate.y + HEAD.plate.s / 2) * hop.unit;
  /* on the sixty frame grid, because rendered frames are the only ones anybody
     sees and the reach above is walked four times finer than this. */
  let worst = Infinity, hitAt = 0;
  for (const b of hop.marks[0].bubbles) {
    for (let t = b.in; t <= b.out; t += 1 / 60) {
      const c = mascotFrame(hop, t).card;
      const air = (hopCy + c.y - hopR * c.sy) - hop.thought.start.y;
      if (air < worst) { worst = air; hitAt = t; }
    }
  }
  ok('a hop never reaches the first dot',
    worst >= BUBBLE.gap - 0.02 && hop.thought.crownTop < crown.crownTop,
    'closest ' + worst.toFixed(2) + ' css px at ' + hitAt.toFixed(2) + 's, floor ' + BUBBLE.gap
    + ' — the crown reaches ' + hop.thought.crownTop + ' hopping against ' + crown.crownTop + ' looking');

  /* and it is one line rather than three heights. each part's own anchor — a
     dot's centre, the pill's spring corner — against its run along the row. */
  const [d0, d1] = BUBBLE.dots.map(d => d.d);
  const ups = [crown.lifts[0] + d0 / 2, crown.lifts[1] + d1 / 2, crown.lifts[2]];
  const angles = [1, 2].map(k => Math.atan2(ups[k] - ups[0], crown.runs[k]) * 180 / Math.PI);
  ok('the two dots and the pill sit on one line',
    angles.every(a => Math.abs(a - BUBBLE.over.angle) < 0.02),
    angles.map(a => a.toFixed(2) + '°').join(' and ') + ' against ' + BUBBLE.over.angle + '°');
  ok('the run climbs, smallest dot nearest the head',
    d0 < d1 && ups[0] < ups[1] && ups[1] < ups[2],
    'dots ' + d0 + 'px then ' + d1 + 'px, rising ' + ups.map(u => u.toFixed(1)).join(', '));

  /* and the default is the default. the css a plan that asked for nothing
     writes is the css this module has always written, which is what lets every
     clip already in demo/ render unchanged. */
  const wasCss = mascotCss(planMascot({
    seconds: 4, marks: [{ t: 0.3, state: 'curious', bubble: 'go on' }], size: 128, pos: 'bottom-right',
  }));
  ok('nothing asked for leaves the beside placement alone',
    wasCss.includes('position:absolute; left:129px;')
    && wasCss.includes('#m-dot0{width:8px;height:8px;margin-bottom:6px}')
    && wasCss.includes('margin-bottom:22px;')
    && wasCss.includes('transform-origin:0% 100%;')
    && !wasCss.includes('flex-direction'));
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

  /* ---------- the hand ----------
     the part is opt in, so the first thing checked is that it is *off*: a plan
     that did not ask for one draws nothing, plans nothing and returns nothing,
     and that is the property every clip written before it depends on. */
  const noHand = planMascot({ marks: [{ t: 0.4, state: 'neutral' }], seconds: 3 });
  ok('no hand unless a plan asks for one',
    noHand.hand === false && noHand.yap == null
    && mascotFrame(noHand, 1.0).hand === null
    && !mascotMarkup(noHand).includes('m-hand')
    && !mascotCss(noHand).includes('m-finger')
    && mascotPagePlan(noHand).hand === null
    && mascotMotion(noHand, 60, 3).hand === null);
  ok('a yap with no hand is refused', (() => {
    try { planMascot({ marks: [{ t: 0.4, state: 'neutral', yap: true }], seconds: 3 }); return false; }
    catch (e) { return /no hand/.test(e.message); }
  })());

  const hp = planMascot({
    hand: true, seconds: 6,
    marks: [{ t: 0.0, state: 'neutral', yap: true }, { t: 2.2, state: 'thinking', yap: true }],
  });
  ok('the yap is a list of cycles, and it joins across marks',
    hp.yap.count > 12 && hp.yap.cycles[0].at === 0
    && hp.yap.windows.length === 1
    && hp.yap.cycles.every((c, i) => i === 0 || c.at >= hp.yap.cycles[i - 1].shutAt - 1e-9),
    hp.yap.count + ' cycles in ' + hp.yap.windows.length + ' window');
  ok('no two cycles are the same cycle',
    new Set(hp.yap.cycles.map(c => c.gape + '/' + c.voiced)).size > hp.yap.count * 0.8);
  ok('every cycle shuts inside its own window',
    hp.yap.cycles.every(c => c.shutAt <= hp.yap.windows[0].until + 1e-9));

  /* the gesture itself, off the drawn angles rather than off the plan: it opens
     all the way, it comes all the way back, and the pop curve pushes it past its
     own gape on the way up, which is the overshoot. */
  let hi = 0, lo = Infinity, over = 0;
  for (let f = 0; f < 360; f++) {
    const h = mascotFrame(hp, f / 60).hand;
    hi = Math.max(hi, h.open); lo = Math.min(lo, h.open);
    over = Math.max(over, h.open - hp.yap.cycles.reduce((m, c) => Math.max(m, c.gape), 0));
  }
  ok('the hand opens and shuts', hi > 0.7 && lo < 0.02,
    'gape ' + lo.toFixed(3) + ' to ' + hi.toFixed(3));
  ok('each open overshoots', over > 0.02, '+' + over.toFixed(3) + ' past the gape');
  const rh = mascotMotion(hp, 60, 6);
  ok('every planned cycle is an open on the screen', rh.hand.opens === hp.yap.count,
    rh.hand.opens + ' opens against ' + hp.yap.count + ' cycles');
  /* the speed, in the unit the question is asked in. a blink's lid is the
     fastest thing the rig does on its own and it moves about three and a half
     css px a frame at sixty; eight is the ceiling here, which lets a mouth snap
     open at twice an eyelid's speed and no more. */
  ok('the hand snaps without stepping', rh.hand.stepCss < 8,
    'fastest frame moves the tip ' + rh.hand.stepCss.toFixed(2) + ' css px, at '
    + rh.hand.stepAt.toFixed(2) + 's');

  /* the two angles are a straight read of the one number, and the shut pose is
     a hand held closed rather than a bar: the fingers and the thumb are three
     degrees apart at nought. */
  const atRest = mascotFrame(hp, hp.yap.cycles[0].out - 0.005).hand;
  ok('shut is nearly shut, not flat',
    Math.abs(atRest.fingers - HAND.shut.fingers) < 0.3
    && Math.abs(atRest.thumb - HAND.shut.thumb) < 0.3);

  /* and it stays on the face. the clip in the markup means it cannot paint
     outside the plate, so this is the other half of that check — measured
     through the same `outside` every other feature is measured through, at a
     full turn either way, which is the worst the hand ever has. */
  const turned = planMascot({
    hand: true, seconds: 5, bias: 0,
    marks: [{ t: 0.2, state: 'unimpressed', yap: true, turn: 1, turnFor: 0.5 }],
  });
  let worstOut = -Infinity;
  for (let f = 0; f < 300; f++) worstOut = Math.max(worstOut, mascotFrame(turned, f / 60).turn.outside);
  ok('the hand stays inside the head at a full turn', worstOut < 0,
    'worst feature ink ' + (-worstOut).toFixed(2) + ' units inside');

  /* it goes with the head when the head turns, and less far than the eyes do.
     `turned` rests at bias nought, so its own first frames are the straight on
     case and the swung one is the same plan a second and a half later. */
  const straight = mascotFrame(turned, 0.05);
  const swung = mascotFrame(turned, 1.6);
  ok('the hand travels with the turn, and less than an eye does',
    straight.hand.x === 0 && Math.abs(swung.hand.x) > 1
    && Math.abs(swung.hand.x) < Math.abs(swung.turn.offset[0]),
    'hand ' + swung.hand.x.toFixed(2) + ' against eye ' + swung.turn.offset[0].toFixed(2));

  ok('the markup and the css carry the hand when it is on',
    mascotMarkup(hp).includes('m-finger') && mascotMarkup(hp).includes('m-thumb')
    && mascotCss(hp).includes('.m-finger,.m-thumb')
    && mascotPagePlan(hp).hand.hinge.x === HAND.hinge.x);

  /* ---------- the floating hands ----------
     the same shape of checks the yap hand gets, starting with the same first
     one: the part is opt in, so the thing that has to be proved before anything
     else is that it is **off**. a plan that did not ask for a pair draws
     nothing, plans nothing, reports nothing and — the one this part adds — is
     placed in exactly the spot it was placed in before there were any. */
  const noHands = planMascot({ marks: [{ t: 0.4, state: 'neutral' }], seconds: 3 });
  const wasBox = planMascot({ marks: [{ t: 0.4, state: 'neutral' }], seconds: 3 }).box;
  ok('no hands unless a plan asks for a pair',
    noHands.hands === false && noHands.handsReach === null
    && mascotFrame(noHands, 1.0).hands === null
    && !mascotMarkup(noHands).includes('m-gl-')
    && !mascotCss(noHands).includes('m-hands')
    && mascotPagePlan(noHands).hands === null
    && mascotMotion(noHands, 60, 3).hands === null
    && mascotMotion(noHands, 60, 3).poses.length === 0
    && noHands.marks.every(m => !('hands' in m)));
  ok('a pose with no hands is refused', (() => {
    try { planMascot({ marks: [{ t: 0.4, state: 'neutral', hands: 'wave' }], seconds: 4 }); return false; }
    catch (e) { return /no hands on it/.test(e.message); }
  })());
  ok('an unknown pose is refused', (() => {
    try { planMascot({ hands: true, marks: [{ t: 0.4, state: 'neutral', hands: 'jazz' }], seconds: 4 }); return false; }
    catch (e) { return /no hands pose called/.test(e.message); }
  })());
  ok('an unknown side is refused', (() => {
    try { planMascot({ hands: true, marks: [{ t: 0.4, state: 'neutral', hands: 'wave', side: 'up' }], seconds: 4 }); return false; }
    catch (e) { return /the three are/.test(e.message); }
  })());
  ok('a side with nothing to be a side of is refused', (() => {
    try { planMascot({ hands: true, marks: [{ t: 0.4, state: 'neutral', side: 'left' }], seconds: 4 }); return false; }
    catch (e) { return /with no hands pose on it/.test(e.message); }
  })());

  /* the table's own consistency, and it is here because it was wrong once: a
     pose's `mark` is the value the preflight looks for, so a `mark.to` that
     does not match the pose's own `at` is a pose scored against a place it was
     never going to. `shrug` shipped for one build with `at.rot` 76 and a mark of
     78, and every number in its row of the report was measured against a target
     the pose could not reach. */
  ok('every pose is scored against its own target',
    HAND_POSE_NAMES.every(nm => {
      const P = HAND_POSES[nm];
      return Math.abs(P.at[P.mark.chan] - P.mark.to) < 1e-9;
    }),
    HAND_POSE_NAMES.map(nm => nm + ' ' + HAND_POSES[nm].mark.chan).join(', '));

  /* every pose in one plan, which is what the test clip renders. */
  const hMarks = [];
  let ht = 0.4;
  for (const nm of HAND_POSE_NAMES) {
    hMarks.push({ t: +ht.toFixed(2), state: 'neutral', hands: nm });
    ht += HAND_POSES[nm].entry + HAND_POSES[nm].hold + HAND_POSES[nm].exit + 0.25;
  }
  const gp = planMascot({ hands: true, bias: 0, marks: hMarks, seconds: +(ht + 0.4).toFixed(2) });
  const grep = mascotMotion(gp, 60, gp.seconds);
  ok('a plan with every pose builds', grep.poses.length === HAND_POSE_NAMES.length,
    grep.poses.length + ' poses over ' + gp.seconds.toFixed(2) + 's');
  for (const p of grep.poses) {
    ok(p.pose + ' arrives', p.entryFrames != null && p.entryFrames > 0, p.entryFrames + ' frames');
    ok(p.pose + ' overshoots and settles', p.overshoot > 1.0 && p.settleFrames > 0,
      '+' + p.overshoot.toFixed(1) + '%, settles in ' + p.settleMs + 'ms');
    /* `rest` is the declared exception on the wind up, and it is the same
       exception `neutral` is: the only thing it does is arrive at rest, and
       pulling away from rest first would be a gesture rather than a release. */
    if (p.pose !== 'rest') ok(p.pose + ' anticipates', p.antiFrames >= 2, p.antiFrames + ' frames back');
  }
  /* the speed, in the unit every other argument in this file is had in. the
     ceiling is twelve rather than the yap's eight, and the difference is the
     size of the thing moving: the yap measures a fingertip twelve device px
     across, so eight css px is more than its own width in a frame and it
     smears. a glove is sixty six device px across and twelve css px is
     twenty four of them, under a third of it — a shape that big is tracked at
     that speed. `panic` is what sets the number, because it is the one pose
     that takes a hand the whole height of the head. */
  ok('a hand never steps', grep.hands.stepCss < 12,
    'fastest frame moves a hand ' + grep.hands.stepCss.toFixed(2) + ' css px at '
    + grep.hands.stepAt.toFixed(2) + 's');

  /* the seven read as seven. the same instrument the states use: the drawn pose
     at each one's settled moment, in the channels a viewer reads, and no two of
     them may land in the same place. the curls are in the vector because two
     hands in the same place with different fingers are two poses. */
  const gposes = grep.poses.map((p, i) => {
    const m = gp.marks.filter(mm => mm.hands)[i];
    const h = mascotFrame(gp, m.hands.settled + 0.05).hands.list[m.hands.acting[0]];
    return {
      pose: p.pose,
      v: [h.pose.x / 8, h.pose.y / 8, h.pose.rot / 40, h.o,
        ...h.fingers.map(f => f.len / 6), h.thumb.len / 6, h.thumb.a / 60],
    };
  });
  let gclosest = 1e9, gpair = null;
  for (let i = 0; i < gposes.length; i++) {
    for (let j = i + 1; j < gposes.length; j++) {
      const d = Math.hypot(...gposes[i].v.map((v, k2) => v - gposes[j].v[k2]));
      if (d < gclosest) { gclosest = d; gpair = gposes[i].pose + '/' + gposes[j].pose; }
    }
  }
  ok('no two poses settle into the same hand', gclosest > 0.55,
    'closest pair ' + gpair + ' at ' + gclosest.toFixed(2));

  /* ---------- the mirror ----------
     the table is written once, for the screen right hand, and the other one is
     the reflection. it is asserted on the drawn glove rather than on the table,
     because the mirror is applied in three places — the seed, the builder and
     the exit — and any one of them could reflect something it should not. the
     splay and the thumb angle must come through **unmirrored**: they live
     inside the glove's own frame and the glove is what gets flipped. */
  const sym = planMascot({
    hands: true, bias: 0, seconds: 4.4,
    marks: [{ t: 0.3, state: 'neutral', hands: 'shrug' }],
  });
  const symF = mascotFrame(sym, sym.marks[0].hands.settled + 0.05).hands.list;
  ok('the left hand is the right hand reflected',
    Math.abs(symF[0].pose.x - (GRID - symF[1].pose.x)) < 1e-9
    && Math.abs(symF[0].pose.rot + symF[1].pose.rot) < 1e-9
    && symF[0].sx === -symF[1].sx && symF[0].sy === symF[1].sy
    && JSON.stringify(symF[0].fingers) === JSON.stringify(symF[1].fingers)
    && JSON.stringify(symF[0].thumb) === JSON.stringify(symF[1].thumb),
    'left at ' + symF[0].pose.x + '/' + symF[0].pose.rot
    + ', right at ' + symF[1].pose.x + '/' + symF[1].pose.rot);

  /* ---------- a hand does not deform ----------
     the card squashes and the turn squeezes it, both on x alone. the gloves
     carry the inverse of the card's two scales, so what is left on them is the
     head's own uniform scale — which is what keeps the separation edge the same
     weight on every side of a hand. it is checked as an identity on the frame
     rather than on a rendered pixel: the two products must be equal, on every
     frame of a plan that both hops and turns. */
  const defo = planMascot({
    hands: true, bias: 0, seconds: 7.4,
    marks: [{ t: 0.3, state: 'delighted', hands: 'wave' },
      { t: 3.6, state: 'unimpressed', hands: 'shrug', turn: 1, turnFor: 0.7 }],
  });
  let worstFit = 0, sqSeen = 0, sqzSeen = 0;
  for (let f = 0; f < Math.round(60 * 7.4); f++) {
    const fr = mascotFrame(defo, f / 60);
    const ax = fr.hands.fit.cx * fr.card.sx, ay = fr.hands.fit.cy * fr.card.sy;
    worstFit = Math.max(worstFit, Math.abs(ax - ay));
    sqSeen = Math.max(sqSeen, Math.abs(fr.pose.sq));
    sqzSeen = Math.max(sqzSeen, fr.turn.squeeze);
  }
  /* the tolerance is the frame's own rounding rather than a fudge, and it is
     worth saying what it is worth. every number in a frame is rounded to a
     thousandth, and this identity is a product of two of them, so the residual
     is about a thousandth — which is what the page actually writes, so it is
     also the real anisotropy on the screen. on a three device px stroke that is
     four thousandths of a pixel. anything genuinely wrong here is a per cent,
     not a thousandth: getting the inverse backwards puts it at fifteen. */
  ok('a glove stays uniform through squash and turn', worstFit < 2e-3,
    'worst axis difference ' + worstFit.toExponential(1) + ' across a squash of '
    + (sqSeen * 100).toFixed(1) + '% and a squeeze of ' + (sqzSeen * 100).toFixed(1) + '%');

  /* ---------- one hand or two ----------
     `side` is which hands are on screen, and it persists across marks the way
     the turn does, so the last thing checked is that it is still holding two
     marks later. */
  const oneAt = (pl, t2) => mascotFrame(pl, t2).hands.list.map(h => h.o);
  const sideL = planMascot({ hands: true, seconds: 4.4, marks: [{ t: 0.3, state: 'neutral', hands: 'wave', side: 'left' }] });
  const sideR = planMascot({ hands: true, seconds: 4.4, marks: [{ t: 0.3, state: 'neutral', hands: 'wave', side: 'right' }] });
  const sideB = planMascot({ hands: true, seconds: 4.4, marks: [{ t: 0.3, state: 'neutral', hands: 'wave' }] });
  ok('a side puts one hand or two on the screen',
    JSON.stringify(oneAt(sideL, 1.6)) === '[1,0]'
    && JSON.stringify(oneAt(sideR, 1.6)) === '[0,1]'
    && JSON.stringify(oneAt(sideB, 1.6)) === '[1,1]');
  ok('a one handed pose is taken by one hand and the other rests',
    sideB.marks[0].hands.acting.length === 1
    && HAND_POSES.shrug.both && !HAND_POSES.wave.both,
    'wave acts with the ' + (sideB.marks[0].hands.acting[0] ? 'right' : 'left') + ' hand');
  /* and which one it is follows the corner he stands in, the way the resting
     turn does: he gestures into the frame rather than out of it. */
  ok('the acting hand gestures into the frame',
    planMascot({ hands: true, seconds: 4.4, pos: 'bottom-left', marks: [{ t: 0.3, state: 'neutral', hands: 'point' }] })
      .marks[0].hands.acting[0] === 1
    && planMascot({ hands: true, seconds: 4.4, pos: 'bottom-right', marks: [{ t: 0.3, state: 'neutral', hands: 'point' }] })
      .marks[0].hands.acting[0] === 0);
  const persist = planMascot({
    hands: true, seconds: 9.4,
    marks: [{ t: 0.3, state: 'neutral', hands: 'wave', side: 'right' },
      { t: 4.2, state: 'neutral', hands: 'point' }],
  });
  ok('a side outlives the pose that named it',
    JSON.stringify(oneAt(persist, 3.9)) === '[0,1]'
    && JSON.stringify(oneAt(persist, 6.0)) === '[1,1]',
    'still one hand at 3.9s, both again once a mark says both');

  /* ---------- the placement holds room for them ----------
     the gloves hang outside the silhouette, so the head stands further in when
     they are on. the amount is measured off the plan's own frames, and this is
     the check that what the placement held is what the frames actually make —
     a clip that re-planned its marks and not its placement is exactly what it
     catches. */
  ok('the head stands in by the reach the hands actually make',
    grep.hands.overrun <= 0,
    'reached ' + [grep.hands.reach.l, grep.hands.reach.r, grep.hands.reach.t, grep.hands.reach.b]
      .map(v => v.toFixed(1)).join('/') + ' against ' + [gp.handsReach.l, gp.handsReach.r,
      gp.handsReach.t, gp.handsReach.b].map(v => v.toFixed(1)).join('/') + ' held');
  const moved = planMascot({
    hands: true, seconds: 4.4, pos: 'bottom-left',
    marks: [{ t: 0.3, state: 'neutral', hands: 'rest' }],
  });
  /* bottom left, so the left edge and the bottom edge are the two the placement
     is measured off and they are the two that move. it is checked as an
     equality against the reach rather than as "it moved", because a placement
     that moved by some other amount would be a placement that held room for a
     hand that is not the one being drawn. */
  ok('the gloves move the head in by exactly their own reach',
    Math.abs((moved.box.left - wasBox.left) - moved.handsReach.l * moved.unit) < 0.02
    && Math.abs((wasBox.top - moved.box.top) - moved.handsReach.b * moved.unit) < 0.02,
    'left ' + wasBox.left + ' to ' + moved.box.left + ' and top ' + wasBox.top + ' to '
    + moved.box.top + ', which is ' + moved.handsReach.l.toFixed(1) + ' and '
    + moved.handsReach.b.toFixed(1) + ' units of reach at ' + moved.unit + ' css px each');

  /* the hands are deliberately **not** in the feature mask. everything on the
     face is clipped to the plate and measured against it; a glove is ink that
     is supposed to be outside the head, and scoring it there would fail every
     pose in the table. */
  ok('a glove is not scored against the head silhouette',
    grep.outside.units <= 0,
    'worst feature ink still ' + (-grep.outside.units).toFixed(2) + ' units inside, with hands on');

  /* the edge, in the unit it has to survive h.264 in, at both head sizes a clip
     uses — the corner's 128 and the centred 148. it is a stroke in grid units,
     so unlike the bubble's border it cannot be floored to a whole css pixel by
     chrome; what is checked is that it lands thick enough to read and thinner
     than the reference's own finger lines, which measure about 4.25 device px
     against a head this size. */
  for (const sz of [128, 148]) {
    const e = HANDS.edge * (sz / GRID) * STAGE.dsf;
    ok('the separation edge is readable and thinner than the reference at size ' + sz,
      e >= 2.8 && e < 4.25, e.toFixed(2) + ' device px');
  }

  /* both themes, with hands on, and the same promise: a theme is colour. */
  const gLight = planMascot({ hands: true, bias: 0, marks: hMarks, seconds: gp.seconds, theme: 'light' });
  const gDark = planMascot({ hands: true, bias: 0, marks: hMarks, seconds: gp.seconds, theme: 'dark' });
  ok('a theme changes nothing but colour, with hands on',
    JSON.stringify({ ...mascotFrame(gLight, 2.0), glow: 0 })
    === JSON.stringify({ ...mascotFrame(gDark, 2.0), glow: 0 }));

  ok('the markup and the css carry the gloves when they are on',
    mascotMarkup(gp).includes('m-gl-ink1-f3') && mascotMarkup(gp).includes('m-gl-edge0-t')
    && mascotMarkup(gp).includes('clip-path="url(#m-head)"')
    && mascotCss(gp).includes('.m-hands-edge .m-gl')
    && mascotCss(gp).includes('stroke-width:' + HANDS.edge)
    && mascotPagePlan(gp).hands.edge === HANDS.edge);
  /* the two hands are two different parts and a plan may have either, both or
     neither — which is one line to check and the reason it is worth checking is
     that they nearly share a name. */
  const bothParts = planMascot({
    hand: true, hands: true, seconds: 4.4,
    marks: [{ t: 0.3, state: 'neutral', yap: true, hands: 'wave' }],
  });
  const bf = mascotFrame(bothParts, 1.4);
  ok('the mouth hand and the glove pair are independent parts',
    bf.hand !== null && bf.hands !== null
    && mascotFrame(hp, 1.0).hands === null && mascotFrame(gp, 1.0).hand === null);

  console.log('');
  if (fail.length) { console.error('FAILED: ' + fail.join(', ')); process.exit(1); }
  console.log('  all ' + '✓');
}

if (process.argv[2] === 'test') {
  console.log('the boring tek — mascot rig checks');
  selfTest();
}
