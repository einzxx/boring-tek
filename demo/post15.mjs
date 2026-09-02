/* the boring tek — post15, the bug clip. a computer bug joke and a real bug
   joke in one, and the whole thing is one word long: a bug walks in, he eats
   it, he says crunchy.

     node post15.mjs                      1080x1920, 60fps, dark
     DEMO_FPS=12 node post15.mjs          the fast preview pass
     node post15.mjs --blur               60fps with the shutter open
     node post15.mjs --bug                the bug alone, as stills, no video
     node post15.mjs --encode-only        re-encode from kept frames

   out to demo/out/post15-dark-1080x1920.mp4.

   **this is the first clip built on lib/camera.mjs and lib/transitions.mjs.**
   rig-test.mjs proved both of them; this is the first one that has to make
   them serve a joke rather than demonstrate themselves. four things fell out
   of that and they are the interesting part of this file.

   ---------- he eats it, and the eating is drawn rather than cut to ----------

   the first cut of this clip did the middle with `lib/transitions.mjs`: he grew
   until his fill covered the frame, the world went white for a second, and the
   same shape ran backwards with the bug gone. it worked and it was the wrong
   joke. a grow is a **scene change**, and using one here says "and then
   something else happened" — the audience is asked to infer the eating from a
   hole in the picture rather than watch it.

   so there is no grow in this clip and no `planGrow`. **he bites.** a small
   anticipation with the head rising, a quick lunge down and a little forward
   over the bug, a squash on the landing, the bug gone on that frame, and he
   comes back up. then he chews with his eyes shut: three pulses, the head
   squashing and working from side to side, one crunch a pulse, and a small
   satisfied bob after the third.

   **the depth of the lunge is derived rather than chosen.** the bug has to be
   gone under his ink on the frame it is switched off, or the switch is a
   disappearing trick rather than a bite. so the file walks the lunge down in
   half pixel steps until the head's drawn ellipse — the plate's radius times
   the card's own two scales times the bite's squash — contains every corner of
   the bug's drawn ink, adds a margin, and uses that. it comes out around a
   whole head diameter, which is what a lunge at something on the floor
   actually is, and the guard measures the containment on the frame rather than
   trusting the derivation.

   ---------- the eyes have to match, and one state was making them not -------

   `curious` opens one eye to 1.80 and the other to 1.10 on purpose, and it is
   right for the beat he is in — one eye wider than the other **is** curiosity.
   it is wrong four hundred milliseconds later, when he has stopped being
   curious and is looking down at a bug that has stopped moving: a rendered
   frame at 1.70s came back reading as a broken face rather than an interested
   one, because the exit had not finished levelling the pair.

   so two things. the beat after it is a **clean symmetric narrowing** written
   here rather than the module's `unimpressed`, whose lids are symmetric but
   which brings brows and a side eye with it. and the pair is **levelled toward
   its own mean** across the end of `curious`, which is this file writing a
   channel the module owns — the one place that happens, and it is guarded
   rather than assumed: from the frame the bug stops, the two eyes are within
   0.03 of each other in scale and 0.01 in lid, on every frame to the cut.

   the lid is pushed the way `lib/transitions.mjs` pushed the shadow and the
   glow: **toward shut and never open.** `max(what the module wrote, what the
   clip wants)` cannot fight a blink — a blink during a narrowing closes
   further, and the max keeps it closed — which is the same discipline as
   multiplying an opacity toward zero.

   ---------- he is inside the camera, and rig-test's mascot is not ----------

   rig-test keeps the mascot in screen space, because the grow's cover
   arithmetic is against the frame and a head the camera was also scaling would
   make the covering scale a function of where the camera happened to be.

   this clip cannot do that. the brief is a push in **on the two of them**, and
   a camera that moved the bug and left the mascot behind would pull apart the
   one thing the shot is about: the bug stopping under him. so the mascot and
   the bug are both inside `#cam-rig`.

   which means every clearance in this file is a **screen** clearance and has
   to be worked out rather than measured off the module: `headRect` answers in
   page space and knows nothing about a camera or about the bite's transform,
   so the head's ink is composed here — the module's card, then this clip's
   zone transform about the zone's own centre, then `cameraFrame`'s own two
   numbers — and checked against the safe area on every frame.

   **the bite is a transform on `#m-zone`, which is the seam the module leaves
   open.** `lib/mascot.mjs` writes `#m-card`, the shadow, the glows, the eyes,
   the brows and the three bubble parts, and it writes nothing to the zone.
   post14 placed the mascot that way and `lib/transitions.mjs` grew him that
   way; this file lunges and chews with it. nothing in lib is touched.

   the wordmark and the fault's own layers are **outside** the camera, in
   screen space, the way record.mjs keeps its cursor outside.

   ---------- the gait is driven by distance, not by time ----------

   the one thing a walk cannot do is slide. so the leg phase is `x / stride`
   rather than `t / period`: a foot is planted at a page position worked out
   from the distance the body had covered when the stance began, and it stays
   at exactly that page position until the stance ends. nothing about it is a
   function of the frame rate, the speed profile or the deceleration into the
   stop, and the guard measures the worst movement of a planted foot across the
   whole walk — it is nought, and it is nought by construction rather than by
   tuning.

   three things fall out of that for free. the **footstep ticks are read off
   the picture**: a tick is a stride boundary, so the sound is a list of
   distances rather than a list of times, and as he slows into the stop the
   ticks spread out and stop on their own. the **gait slows with him**, because
   the period is the stride over the speed and the speed is the only thing that
   changes. and the **path is a function of x rather than of t**, so a foot's
   planting height is available at plant time without inverting anything.

   the body sways and yaws over the planted feet at the gait's own frequency,
   which is the "bobbing" a top view can honestly show: a walking insect rolls
   its body over the tripod that is down, and it does not bounce.

   ---------- what the gait costs at twelve frames ----------

   the bug covers 376 page px in 1.62s and its stride is 34, so it takes about
   eleven strides at about eight a second. at sixty that is seven and a half
   frames to a cycle, which reads. **at twelve it is a frame and a half and it
   does not**, and no amount of care in this file changes that — it is the
   preview's own sampling rather than anything about the animation. so the gait
   is judged on a strip of stills spaced one sixtieth apart, written on every
   run to out/verify-post15/gait/, and on the sixty frame master.

   ---------- the lane under him is why he sits 84px off his own corner ------

   `planMascot` puts a bottom right mascot 24 css px inside the platform safe
   area, which leaves 24 px between his ink and the bottom safe line. the bug
   has to walk **under** him, inside the safe area, without touching him, and a
   bug with legs is 41 css px tall. so the whole mascot is lifted 84 px off the
   module's own placement — enough for the lane, and the guards measure both
   ends of it on every frame rather than trusting this paragraph.

   ---------- the caption band is reserved even though nothing is in it ------

   there are no captions in this clip. the band is reserved anyway, because a
   band is a promise about where words can go and a clip that quietly fills it
   is a clip that cannot be captioned later. it is placed where a caption for
   **this** composition would go — the empty upper half — and nothing this file
   draws is allowed into it, the thought bubble included. `planMascot` takes it
   as `band` and checks the bubble against it in the page; the head, the bug
   and the wordmark are checked here.
*/

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
  STATES, STAGE, SAFE, HEAD_PX, HEAD, GRID, BUBBLE,
} from './lib/mascot.mjs';
import {
  planCamera, cameraFrame, cameraMotion, cameraCss, cameraMarkup, cameraRuntime,
  describeCamera,
} from './lib/camera.mjs';
import {
  renderSfx, writeWav, applyGain, limit, loudness, describeMix, VOICES,
} from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post15');
const SUBS = path.join(OUT, 'subframes-post15');
const VERIFY = path.join(OUT, 'verify-post15');

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
const KEEP = argv.includes('--keep-frames');
const BUG_ONLY = argv.includes('--bug');
const BLUR = argv.some(a => a.startsWith('--blur'));
const BLUR_ARG = (argv.find(a => a.startsWith('--blur')) || '').split('=')[1];
const SUB = BLUR ? Math.max(2, Math.min(12, Number(BLUR_ARG) || 4)) : 1;
const SUBSTEP = STEP / SUB;

/* ---------- the clip's own clock ----------
   7.30s, and the arithmetic runs from the middle outwards rather than from
   either end. the three transition beats are the brief's and they are fixed:
   0.80s of grow, a **full second** of white, 0.60s of grow back. that is 2.71s
   of a seven second clip spent on one gag, which is why everything either side
   of it is as short as it can be and still read.

   what is left is 2.36s of setup in front — the bug walks in, he notices it,
   it stops under him and he looks down at it — and 2.23s behind, which is the
   delighted beat with the bubble on it and then the cut.

   the middle used to be a grow, a white second and a grow back, which is 2.71s
   and put the clip 0.30s over the brief. **eating him takes 1.64s** — 0.44 of
   bite and 1.20 of chewing and settling — so the same story fits with room:
   2.30s of setup, 1.64s of eating, and 2.79s of the ending the first cut
   already had. */
const SECONDS = 6.73;

/* ---------- where he stands ----------
   the module places him bottom right, 24 css px inside the safe area, and then
   the whole box is lifted so the bug has a lane. `planMascot` owns the corner
   arithmetic and this owns the lift, which is one number in one place and is
   what every guard below measures against. see the header. */
const SIZE = 128;
const POS = 'bottom-right';
const MARGIN = 24;
const LIFT = 84;

/* the air the bug's topmost ink keeps under the lowest the head ever gets, in
   css px. it is not a look, it is the brief: the bug may not overlap him until
   the grow covers it, and a gap that depends on which frame you measure is not
   a gap. the lane is derived off this and off the measured head. */
const LANE_CLEAR = 26;

/* ---------- the cut ----------
   three marks. there is no `neutral` mark at the top and that is deliberate
   rather than an oversight: before the first mark every pose channel is at
   rest and the idle layer is running, which is `neutral` being held — that
   state's own mark is `sc` 0.972 to 1, so arriving at rest is the whole of
   what it does. a mark for it would cost 1.06s of the module's own floor and
   buy a scale up nobody asked for.

   `curious` is him seeing it. the turn is held to screen left, which is where
   the bug is coming from — his resting bias in the right hand corner is
   already -0.35 for the same reason, so this is the same gesture, further.

   `neutral` is him deciding, and the narrowing on top of it is this file's.
   the module's own narrowing state is `unimpressed`, and it is the wrong one
   here for a reason that has nothing to do with its lids: it brings brows, a
   side eye and a lean away with it, which is a face declining to be interested
   rather than a face concentrating on something. `thinking` turns up and away,
   which is the opposite of looking at something on the floor. so the mark is
   the level one, the turn comes back to zero because the bug is directly under
   him, and the lids are narrowed by NARROW below — symmetrically, in one
   place, with a guard on the pair.

   `delighted` is after: two hops with real lift and the eyes squashed into
   arcs, with `crunchy` in the bubble. */
const CUT = {
  marks: [
    { t: 0.48, state: 'curious', turn: -0.58, turnFor: 0.72 },
    { t: 1.74, state: 'neutral', turn: 0, turnFor: 0.60 },
    { t: 4.16, state: 'delighted', bubble: 'crunchy' },
  ],
  seconds: SECONDS,
};

/* ---------- levelling the pair ----------
   `curious` opens one eye to 1.80 and the other to 1.10, which is the state and
   is right while he is being curious. its exit levels them over 0.34s and a
   rendered frame at 1.70 still read as a broken face. so the two are blended
   toward their own mean over this window, which finishes before the bug does.
   see the header for why this is the one channel this file writes over. */
const LEVEL = { at: 1.36, for: 0.26 };

/* ---------- the narrowing ----------
   both lids, one number, `heavy` in and held. it is a push toward shut rather
   than a value written over the module's: `max(module, this)` cannot fight a
   blink and cannot open an eye the module has closed. */
const NARROW = { at: 1.86, for: 0.34, to: 0.40 };

/* ---------- the bite ----------
   `by` is **derived** rather than typed: `biteDepth()` walks the lunge down
   until the head's drawn ellipse contains every corner of the bug's drawn ink
   on the contact frame, then adds a margin. see the header. `fwd` is small and
   it is negative on purpose — he leans out over the bug into the frame rather
   than toward the right hand safe line, which is the tightest number in the
   clip. */
const BITE = {
  at: 2.30,
  rise: 0.11,        /* the anticipation, and the head goes up */
  riseBy: 7,         /* css px */
  down: 0.10,        /* the lunge */
  fwd: -4,           /* css px, into the frame */
  /* the contact, which is where the squash lives and where the bug goes. it is
     0.10 rather than 0.05 for a reason the preview found: the frame the bug is
     switched off on has to be a frame his head is at the bottom of its lunge,
     and a contact shorter than one frame of the pass that is rendering has no
     such frame in it. one twelfth is 0.083, so 0.10 holds at both rates and the
     guard checks it at both rather than at whichever one is running. */
  land: 0.10,
  squash: 0.075,     /* volume preserving, under the module's own 8% ceiling */
  up: 0.16,          /* and back */
  margin: 5,         /* css px of slack on the derived depth */
};
const BITE_HIT = +(BITE.at + BITE.rise + BITE.down).toFixed(4);
/* **the frame the bug goes is the first frame at or after the landing, and it
   is a ceiling rather than a rounding.** post13's correction in a new place: a
   landing time that rounds *down* to its own frame puts the switch a frame
   before the head is on it, and the twelve frame preview is where that
   happens — 2.51 at twelve rounds to 2.50, which is nine tenths of the way
   down. it is derived at whatever rate is rendering, so the picture and the
   guard cannot disagree about which frame it is. */
const BITE_END = +(BITE.at + BITE.rise + BITE.down + BITE.land + BITE.up).toFixed(4);

/* ---------- the chew ----------
   three pulses and a bob. a pulse is a squash and a lateral working of the head,
   and the side alternates, which is what a jaw doing something difficult looks
   like from the front. the shape inside a pulse is fast in and slower out, for
   the same reason every gesture in lib/mascot.mjs is: a chew that released as
   fast as it closed would be a mechanism. */
const CHEW = {
  at: 2.86,
  pulses: 3,
  for: 0.30,
  peak: 0.34,        /* of a pulse's own length */
  squash: 0.055,
  shift: 3.4,        /* css px, alternating */
  roll: 1.7,         /* degrees, into the working side */
  bob: { for: 0.24, by: 5 },
};
const CHEW_END = +(CHEW.at + CHEW.pulses * CHEW.for + CHEW.bob.for).toFixed(4);
/* one crunch a pulse, on the pulse's own contact rather than on its start. */
const CHEW_HITS = Array.from({ length: CHEW.pulses },
  (_, i) => +(CHEW.at + i * CHEW.for + CHEW.for * CHEW.peak * 0.5).toFixed(4));

/* ---------- the eyes shut ----------
   they close on the lunge, because that is when a thing eating something closes
   them, and they stay closed through the chew.

   **they are squashed shut rather than lidded shut, and a rendered frame is
   why.** the module's blink is the lid arriving over the eye, which is right
   for a blink: it is sixty milliseconds and the face is blank for two frames
   of it. hold that for a second and a bit and the face is not a face with its
   eyes closed, it is a face with no eyes — the chew still came back reading as
   a blank plate.

   what a drawn closed eye is, is a line. so the eye is squashed to `sy` of its
   own height instead, which leaves a thin bar of the same ink the open eye is
   drawn in, and the lid gives way as the squash comes in so the two are never
   both taking height off the same eye. it is the same one directional
   discipline as the lid: the squash may only make an eye thinner than the
   module asked for, never fatter. */
const SHUT = { at: +(BITE.at + BITE.rise).toFixed(4), in: 0.09,
  until: +(CHEW_END + 0.02).toFixed(4), out: 0.16, sy: 0.26 };

/* ---------- the camera ----------
   one leg and nothing else. no snap, because there is no punchline to hit with
   one — the punchline is a shape — and no shake, because the only knock in the
   clip is the glitch at the end, and the glitch is a function of the frame
   index rather than of time. that is a different channel in a different file
   and it is meant to jump rather than blur.

   the zoom starts over 1 and stays there, and that is arithmetic rather than
   taste. the rig is exactly the stage's own size, so at z under 1 a border
   comes into shot; the drift takes up to 1% off the scale and moves the centre
   by up to 5 css px on y, and 1.05 carries both with room. it is also what
   makes the grow's page space cover arithmetic conservative — see the header.

   the leg ends at 2.30, which is the frame the bite's anticipation starts on:
   the camera has arrived and stopped by the time he moves. a camera still
   pushing under a lunge is two moves at once and neither of them reads.

   **the destination was 1.12 and it is 1.10, and the bubble is why.** the push
   pulls the frame in around him, and everything on his side of it moves toward
   an edge as it does. at 1.12 the mirrored thought bubble had 13 device px of
   air off the left safe line, which is a number that passes a guard and would
   not survive a font falling back one glyph wider. at 1.10 it has 60. */
const CAM = {
  start: { cx: 270, cy: 480, z: 1.05 },
  push: { at: 0.60, for: 1.70, to: { cx: 282, cy: 504, z: 1.10 } },
};

/* ---------- the reserved caption band ----------
   in screen css px. see the header for why it exists with nothing in it. it is
   checked against the head, the bubble, the bug and the wordmark. */
const BAND = { x: SAFE_CSS.left, y: 292, w: VW - SAFE_CSS.left - SAFE_CSS.right, h: 72 };

/* ---------- the end ----------
   post12's ending with the build up taken off it, because the brief asks for
   one hit rather than three stutters into one: the frame is fine and then it
   is not, which is a bug crashing something rather than a signal degrading.

   he, the bubble and the bug are all cut on the hit frame and the wordmark is
   born on the same frame, so the frame exchanges one thing for another and is
   never empty. the birth is derived off the cut **frame** rather than off the
   cut time, which is post13's correction: a cut time that rounds down to its
   own frame would put the wordmark one frame after the head left, and an empty
   frame between them. */
const END = { at: 5.85, hard: 0.15, tail: 0.22, wmFor: 0.09 };
const VANISH_FRAME = Math.ceil(BITE_HIT * FPS);
const VANISH_AT = +(VANISH_FRAME / FPS).toFixed(4);
const CUT_FRAME = Math.round(END.at * FPS);
const WM_IN = (CUT_FRAME - 1) / FPS;

/* post12's glitch table at full heat, unchanged. */
const GL = {
  shakeX: 15, shakeY: 8,
  split: 9.5,
  bandDx: 88,
  bands: 3,
  noise: [0.10, 0.24],
  flash: 0.30,
  flashSize: 420,
  calmFrom: 0.86,
};

/* ---------- the wordmark ----------
   post12's, unchanged: three lines, centred, in michroma, fitted in the page
   rather than guessed, because michroma is proportional and the tracking is
   nearly a fifth of an em. no domain under it, which is the brief. */
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16, minCapPx: 56 };
/* the middle of the **safe band** rather than of the frame, which is post12's
   line: the platforms take more off the bottom than the top. */
const CENTRE_Y = (SAFE_CSS.top + (VH - SAFE_CSS.bottom)) / 2;

/* crf 17, post12's and post13's: this frame is nearly all flat black with a
   soft glow across it, which is exactly what a codec bands, and there is no
   film grain here to dither it. */
const CRF = 17;

/* ---------- the mix ----------
   post13's rig and post13's argument. this clip is quieter than that one — no
   voice, no bed, eighteen small events on silence — so the peak ceiling is the
   likely winner and both numbers are printed either way. */
const TARGET_LUFS = -14;
const SAMPLE_CEILING = -1.8;
const LIMIT_ALLOW = 1.5;

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

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
const POP = bezier(.34, 1.4, .64, 1);          /* the site's own --spring */
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))));
const lerp = (a, b, p) => a + (b - a) * p;
const smooth = q => (q <= 0 ? 0 : q >= 1 ? 1 : q * q * (3 - 2 * q));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const r2 = v => Math.round(v * 100) / 100;

function prng(seed) {
  let x = seed | 0 || 0x1a2b3c;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x |= 0; return (x >>> 0) / 4294967296; };
}

/* ==========================================================================
   the bug
   ==========================================================================

   drawn in code, flat, in the mascot's own ink, and it is a **top view**. that
   is the one design decision everything else follows from and it was made for
   the same reason the mascot is a circle: it is the read that survives being
   small. a side view of an insect shows three legs, hides three, and needs a
   ground line to stand on; from above there are six legs, two antennae and a
   body, which is what a child draws when you say bug, and it needs no ground.

   it also makes the gait honest. an alternating tripod — front left, middle
   right, rear left down together, then the other three — is what a real insect
   does and it is **visible from above**, because what it does is sweep three
   legs back while three swing forward. from the side it would be a lift, and a
   lift is the one thing a flat top view cannot draw.

   so there is no bounce. what a walking insect actually does with its body is
   roll and yaw over the tripod that is planted, and both of those are lateral,
   and lateral is on screen in a top view. that is the "bobbing": 1.5 css px of
   sway and 3.2 degrees of yaw, at the gait's own frequency, over feet that do
   not move.

   the geometry is a table and the drawing reads it, the same shape as
   lib/mascot.mjs's own. every number is css px in the bug's own frame, with
   +x its heading and +y its right hand side. */
const BUG = {
  /* the abdomen and the head. two rounded rects, because the mascot is a
     rounded rect at radius 0.5 and the whole vocabulary here is one shape with
     its corners set. the body is a long lozenge and the head is a small one in
     front of it with a real gap, so the bug has a neck at a glance. */
  body: { l: 29, w: 16, r: 8 },
  head: { l: 10.6, w: 12, r: 5.5, gap: 1.2 },

  /* the hips, along the body, and the feet at rest, per side. the front pair
     reach forward, the middle pair go straight out, the rear pair trail — the
     ordinary insect stance, and the reason the silhouette reads as six legs
     rather than as three pairs. */
  /* **the three x ranges do not overlap and that is the point.** the first cut
     had them at 17, 0.9 and -15.3, which with a stride of 34 puts the front
     foot as far back as 7 and the middle foot as far forward as 11 — so on
     half the frames two legs on the same side crossed, and a crossed pair
     reads as a tangle rather than as a gait. spread to 19, 0.6 and -18 the
     three sweeps clear each other by a fraction of a pixel, and the middle
     pair reaches six px further out than the other two so it never reads as
     one of them. */
  hips: [{ x: 9.6, y: 6.0 }, { x: 0.6, y: 7.4 }, { x: -9.2, y: 6.0 }],
  feet: [{ x: 19.0, y: 14.5 }, { x: 0.6, y: 21.0 }, { x: -18.0, y: 15.0 }],
  /* two bones and a knee that bends **away** from the body, which is what an
     insect knee does and what a mammal knee does not. the reach is the sum and
     the preflight measures the worst demand against it, because a leg that has
     to be longer than it is is a foot that would slide. */
  femur: 10.8, tibia: 10.8,
  legW: 2.2,

  /* the antennae. two segments each so they can bend, angled forward and out,
     and they twitch on their own two periods with an occasional flick. */
  ant: { len: 15, w: 2.0, angle: 28, bend: 18, y: 0.30,
    wob: [{ amp: 5.5, period: 0.47 }, { amp: 3.0, period: 0.31 }],
    flick: { every: [0.44, 1.05], for: 0.13, by: 14 } },

  /* the walk. `stride` is how far the body travels in one full leg cycle and
     `duty` is the share of that cycle a foot spends on the ground. 0.55 is a
     little over the half a tripod gait needs — under 0.5 there would be a
     moment with fewer than three legs down, which is a run rather than a
     walk — and it is also what keeps the sweeps from overlapping. */
  stride: 34,
  duty: 0.55,
  /* mid swing the foot pulls in toward the body. from above a lifted leg is a
     shorter leg, and this is the only honest way a flat view has of saying a
     foot is off the ground. */
  swingPull: 1.8,
  sway: 1.5,
  yaw: 3.2,
  /* the wobbly path, as a function of **x rather than of t**. that is not a
     stylistic choice: a foot plants at the body's own position at the moment
     the stance began, and a path in x hands that back with no inversion. two
     wavelengths that do not divide each other, so the line never repeats over
     the distance he covers. */
  path: { mid: 0, a1: 4.6, l1: 137, p1: 0.9, a2: 2.2, l2: 61, p2: 2.4 },
  seed: 0x51b0e3,
};

/* the ink's own extent in the bug's frame, worked out from the table rather
   than typed, and it is what every clearance in this file is measured with.
   the feet are included at their widest sweep, because a leg reaching forward
   is ink like any other. */
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
   constant, then a smoothstep down into nothing. it is written as a speed and
   integrated rather than as an eased position, for two reasons. the stop has
   to be a **deceleration** — a bug that arrives on a position ease is a bug
   that arrives at a velocity somebody has to argue about — and the gait reads
   the distance, so the thing that has to be smooth is the distance's own
   derivative.

   the integral of one minus a smoothstep over its window is exactly a half, so
   the whole profile closes in one line: V * (flat + dec/2) is the distance,
   which is what fixes V rather than a number somebody tuned. */
const WALK = { t0: 0.00, t1: 1.62, dec: 0.34, x0: 10, x1: null };

function walkSetup(stopX) {
  WALK.x1 = stopX;
  const flat = WALK.t1 - WALK.t0 - WALK.dec;
  WALK.v = (WALK.x1 - WALK.x0) / (flat + WALK.dec / 2);
  WALK.flat = flat;
  WALK.xd = WALK.x0 + WALK.v * flat;
  return WALK;
}

/* how far along he is at second t. monotone, C1, and flat at both ends. */
function walkX(t) {
  if (t <= WALK.t0) return WALK.x0;
  if (t >= WALK.t1) return WALK.x1;
  const u = t - WALK.t0;
  if (u <= WALK.flat) return WALK.x0 + WALK.v * u;
  const q = (u - WALK.flat) / WALK.dec;
  /* the integral of 1 - smoothstep, in closed form. */
  return WALK.xd + WALK.v * WALK.dec * (q - q * q * q + q * q * q * q / 2);
}
function walkSpeed(t) {
  if (t <= WALK.t0 || t >= WALK.t1) return 0;
  const u = t - WALK.t0;
  if (u <= WALK.flat) return WALK.v;
  return WALK.v * (1 - smooth((u - WALK.flat) / WALK.dec));
}

/* the wobble, and its slope, both as functions of distance. */
function pathY(x) {
  const P = BUG.path;
  return P.mid + P.a1 * Math.sin(x / P.l1 + P.p1) + P.a2 * Math.sin(x / P.l2 + P.p2);
}
function pathSlope(x) {
  const P = BUG.path;
  return P.a1 / P.l1 * Math.cos(x / P.l1 + P.p1) + P.a2 / P.l2 * Math.cos(x / P.l2 + P.p2);
}

/* ---------- one leg ----------
   the whole no-sliding argument is these fifteen lines.

   `phase` is the distance over the stride, so leg k of tripod A is at integer
   phase every time the body has covered another stride. the stance that phase
   `k` opens began with the body at `xs = (k - off) * stride`, and the foot was
   set down at `xs + rest.x + sweep` — a page position, worked out once, that
   the body then walks past. it is **returned unchanged for the whole stance**,
   which is what planted means.

   the swing is the segment between one stance's page position and the next
   one's, eased, with the foot pulled in toward the body across the middle of
   it. neither end of that segment is a function of t either, so the two join
   without a step. */
function legFoot(x, off, rest) {
  const S = BUG.stride, D = BUG.duty, sweep = BUG_INK.sweep;
  const ph = x / S + off;
  const k = Math.floor(ph);
  const p = ph - k;
  const plant = j => {
    const xs = (j - off) * S;
    return { x: xs + rest.x + sweep, y: pathY(xs) + rest.y, xs };
  };
  const a = plant(k);
  if (p < D) return { x: a.x, y: a.y, planted: true, pull: 0, k };
  const b = plant(k + 1);
  const q = (p - D) / (1 - D);
  const e = smooth(q);
  /* the pull is a hump rather than a ramp: the foot is at its own height at
     both ends of the swing and shortest across the middle of it. */
  const pull = BUG.swingPull * Math.sin(Math.PI * q);
  return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), planted: false, pull, k };
}

/* two bones to a foot. the knee is placed off the circle intersection, on the
   side away from the body, and the reach is clamped only as a backstop — the
   preflight refuses a plan that ever needs the clamp, because a clamped foot
   is a foot that stopped where the geometry ran out rather than where the walk
   put it. */
function knee(hip, foot, side) {
  const dx = foot.x - hip.x, dy = foot.y - hip.y;
  const d = Math.max(1e-3, Math.hypot(dx, dy));
  const L1 = BUG.femur, L2 = BUG.tibia;
  const dd = Math.min(d, (L1 + L2) * 0.999);
  const a = (L1 * L1 - L2 * L2 + dd * dd) / (2 * dd);
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const ux = dx / d, uy = dy / d;
  /* perpendicular, pointing away from the centreline on this bug's side. */
  const s = side >= 0 ? 1 : -1;
  return { x: hip.x + ux * a - uy * h * s, y: hip.y + uy * a + ux * h * s, reach: d };
}

/* ---------- the antennae ----------
   a wobble on two periods that do not divide each other, plus a flick out of a
   seeded schedule so they are never merely oscillating. the schedule is
   generated once, from the bug's own seed, and printed with the plan. */
function antennaSchedule(seconds, seed) {
  const rnd = prng(seed);
  const out = [];
  let t = 0.25;
  let side = 0;
  while (t < seconds) {
    out.push({ t: +t.toFixed(3), side, for: BUG.ant.flick.for });
    t += lerp(BUG.ant.flick.every[0], BUG.ant.flick.every[1], rnd());
    side = 1 - side;
  }
  return out;
}

/* how long the feet take to plant themselves after the body stops. */
const BUG_SETTLE = 0.22;

/* ---------- the bug, at second t ----------
   everything in page css px, because every guard in this file and every
   clearance in the brief is about page space and because the page half should
   write numbers rather than work any out. */
function bugFrame(t, sched) {
  const x = walkX(t);
  const v = walkSpeed(t);
  const ph = x / BUG.stride;
  /* the settle. when the body stops, the phase stops with it, and a leg caught
     in mid swing would freeze in the air. so over `SETTLE` after the stop every
     foot is walked to its own resting page position, which is an insect
     planting its feet when it stops rather than a rig being switched off. it is
     the one window the no-sliding guard does not read, and it says so. */
  const set = smooth(span(t, WALK.t1, WALK.t1 + BUG_SETTLE));
  const gait = 1 - set;

  const bodyY = pathY(x);
  const sway = BUG.sway * Math.sin(2 * Math.PI * ph) * gait;
  const yawGait = BUG.yaw * Math.cos(2 * Math.PI * ph) * gait;
  const rot = Math.atan(pathSlope(x)) * 180 / Math.PI + yawGait;
  const body = { x, y: bodyY + sway, rot };

  const cs = Math.cos(rot * Math.PI / 180), sn = Math.sin(rot * Math.PI / 180);
  const toPage = p => ({ x: body.x + p.x * cs - p.y * sn, y: body.y + p.x * sn + p.y * cs });

  const legs = [];
  let worstReach = 0;
  for (let s = 0; s < 2; s++) {
    const sg = s === 0 ? -1 : 1;                 /* 0 is screen up, 1 is screen down */
    for (let i = 0; i < 3; i++) {
      /* the alternating tripod: front left, middle right, rear left together. */
      const off = ((s === 1) !== (i === 1)) ? 0.5 : 0;
      const rest = { x: BUG.feet[i].x, y: BUG.feet[i].y * sg };
      const hip = toPage({ x: BUG.hips[i].x, y: BUG.hips[i].y * sg });
      const f = legFoot(x, off, rest);
      const restPage = { x: x + rest.x, y: pathY(x) + rest.y };
      /* the pull is toward the body's centreline, which from above is the
         short way to say the leg is off the ground. */
      const foot = {
        x: lerp(f.x, restPage.x, set),
        y: lerp(f.y, restPage.y, set) - f.pull * sg * (1 - set),
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
    const r1 = a * sg * Math.PI / 180;
    const r2 = (a + A.bend) * sg * Math.PI / 180;
    const mid = { x: root.x + Math.cos(r1) * A.len * 0.52, y: root.y + Math.sin(r1) * A.len * 0.52 };
    const tip = { x: mid.x + Math.cos(r2) * A.len * 0.48, y: mid.y + Math.sin(r2) * A.len * 0.48 };
    const P = [root, mid, tip].map(toPage);
    ants.push([P[0].x, P[0].y, P[1].x, P[1].y, P[2].x, P[2].y]);
  }

  return { x, v, ph, body, legs, ants, worstReach, settled: set >= 1 };
}

/* the bug's ink box in page space on one frame, off the drawn numbers rather
   than off the table — the legs are where the gait put them and that is what a
   clearance is about. */
function bugRect(bf) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const put = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  const cs = Math.cos(bf.body.rot * Math.PI / 180), sn = Math.sin(bf.body.rot * Math.PI / 180);
  const corner = (px, py) => put(bf.body.x + px * cs - py * sn, bf.body.y + px * sn + py * cs);
  const nose = BUG.body.l / 2 + BUG.head.gap + BUG.head.l;
  for (const px of [-BUG.body.l / 2, nose]) for (const py of [-BUG.head.w / 2 - 1, BUG.head.w / 2 + 1]) corner(px, py);
  for (const py of [-BUG.body.w / 2, BUG.body.w / 2]) corner(-BUG.body.l / 2, py);
  for (const L of bf.legs) { put(L[2], L[3]); put(L[4], L[5]); }
  for (const A of bf.ants) { put(A[2], A[3]); put(A[4], A[5]); }
  const pad = BUG.legW / 2;
  return { x: x0 - pad, y: y0 - pad, w: (x1 - x0) + pad * 2, h: (y1 - y0) + pad * 2 };
}

/* ---------- the footsteps ----------
   one tick per stride boundary of the leading tripod, read off the walk rather
   than laid on a grid: the times are the instants the body has covered another
   whole stride. as he decelerates they spread out and stop on their own,
   because the stride is fixed and the speed is not. */
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
   the plans
   ========================================================================== */

/* the seed is searched rather than defaulted, for the brief's "one blink"
   while he watches it: an idle blink is the mascot's own blink and the schedule
   is generated from the seed, so this is a search over the layer that already
   makes blinks rather than a new mechanism. post13's move, and the guard below
   checks the blink is still where the seed was chosen for. */
const BLINK_WINDOW = [CUT.marks[0].t + STATES.curious.entry + 0.06, CUT.marks[1].t - 0.12];
function pickSeed() {
  for (let s = 1; s <= 4000; s++) {
    let pl;
    try {
      pl = planMascot({ marks: CUT.marks, seconds: CUT.seconds, theme: 'dark',
        size: SIZE, pos: POS, margin: MARGIN, band: BAND, seed: s });
    } catch (err) { continue; }
    const bl = pl.idle.blinks[0];
    if (bl && bl.t >= BLINK_WINDOW[0] && bl.t <= BLINK_WINDOW[1]) return { seed: s, blink: bl };
  }
  throw new Error('no seed in four thousand puts an idle blink inside the curious hold');
}
const SEED = pickSeed();

const plan = planMascot({
  marks: CUT.marks, seconds: CUT.seconds, theme: 'dark',
  size: SIZE, pos: POS, margin: MARGIN, band: BAND,
  seed: SEED.seed,
});
/* the lift. `planMascot` owns the corner and this owns the height, and it is
   applied before `mascotCss` is called because that function reads the box. */
plan.box = { left: plan.box.left, top: +(plan.box.top - LIFT).toFixed(2), size: SIZE };

/* the plate's own centre in page space, off the module's geometry rather than
   off a number typed here. it is where the bug stops. */
const PLATE = {
  cx: plan.box.left + (HEAD.plate.x + HEAD.plate.s / 2) * plan.unit,
  cy: plan.box.top + (HEAD.plate.y + HEAD.plate.s / 2) * plan.unit,
  r: HEAD.plate.s / 2 * plan.unit,
};

/* ---------- the lane, derived ----------
   the lowest the head's ink ever gets over the whole clip, plus the clearance,
   plus the bug's own reach above its centreline. everything in it is measured:
   change the state list, the size or the lift and the lane follows. */
function laneY() {
  let worst = -Infinity, at = 0;
  const N = Math.round(60 * SECONDS);
  for (let f = 0; f < N; f++) {
    const t = f / 60;
    /* the bite is excluded: this file lunges him a whole head downward and a
       head mid lunge is not a head standing in a corner over a lane. the lane
       is about where he lives, not about where he goes. */
    if (t >= BITE.at - 0.05) break;
    const r = headRect(plan, mascotFrame(plan, t));
    const bottom = VH - r.bottom / DSF;
    if (bottom > worst) { worst = bottom; at = +t.toFixed(3); }
  }
  return { headBottom: +worst.toFixed(2), at, y: +(worst + LANE_CLEAR + BUG_INK.side).toFixed(2) };
}
const LANE = laneY();
BUG.path.mid = LANE.y;
walkSetup(PLATE.cx);

const ANT_SCHED = antennaSchedule(SECONDS, BUG.seed);
const STEPS = stepTimes();

/* ---------- the camera ---------- */
const cam = planCamera({
  mode: 'free', stage: STAGE, seconds: SECONDS,
  /* free mode, because this is a composed frame on a plain background: there
     is no fixed bar to float in the margin and no full bleed subline to lose
     its outer letters, which are the two reasons site mode has its limits.
     the floor is 1.0 and the guard below walks it. */
  zoom: { min: 1.0, max: 1.30 },
  start: CAM.start,
  legs: [{ ...CAM.push, ease: 'glide', why: 'the push, on the two of them, while he watches it' }],
});

/* ---------- the two grows ---------- */
/* ---------- the bite and the chew, as one channel on the zone ----------
   everything this file does to the head between 2.30 and 4.10 is one transform
   on `#m-zone`, which lib/mascot.mjs writes nothing to. it returns page space
   numbers and the page writes them; the guards read the same function, so a
   clearance and a picture cannot disagree about where his head was.

   `sq` is volume preserving, the way the module's own squash is: x is (1+q) and
   y is 1/(1+q), so a squashed circle is an ellipse of the same area rather than
   a head that got bigger. */
function biteZone(t) {
  const z = { x: 0, y: 0, sx: 1, sy: 1, rot: 0 };
  const T = BITE;
  /* the anticipation. he goes up before he goes down, which is every entrance
     in lib/mascot.mjs and is the reason a lunge reads as a decision. */
  if (t >= T.at && t < T.at + T.rise) {
    z.y = -T.riseBy * smooth((t - T.at) / T.rise);
  } else if (t >= T.at + T.rise && t < BITE_HIT) {
    /* the lunge. `heavy` in the module's sense: late to start and then
       carrying, because a head going after something has mass. */
    const u = (t - T.at - T.rise) / T.down;
    const e = u * u * (3 - 2 * u) * u ** 0.5;
    z.y = lerp(-T.riseBy, BITE.by, Math.min(1, e * 1.0 + u * u * 0.0) || 0);
    z.y = lerp(-T.riseBy, BITE.by, u * u);
    z.x = T.fwd * (u * u);
  } else if (t >= BITE_HIT && t < BITE_HIT + T.land) {
    /* the contact. the squash is here and nowhere else. */
    const u = (t - BITE_HIT) / T.land;
    const q = T.squash * Math.sin(Math.PI * u) ** 0.6;
    z.y = BITE.by; z.x = T.fwd;
    z.sx = 1 + q; z.sy = 1 / (1 + q);
  } else if (t >= BITE_HIT + T.land && t < BITE_END) {
    const u = (t - BITE_HIT - T.land) / T.up;
    const e = 1 - (1 - u) * (1 - u);
    z.y = lerp(BITE.by, 0, e);
    z.x = lerp(T.fwd, 0, e);
  }

  /* the chew. three pulses, the side alternating, and a bob after the last. */
  if (t >= CHEW.at && t < CHEW.at + CHEW.pulses * CHEW.for) {
    const i = Math.min(CHEW.pulses - 1, Math.floor((t - CHEW.at) / CHEW.for));
    const u = (t - CHEW.at - i * CHEW.for) / CHEW.for;
    /* fast in, slower out: the peak sits a third of the way through. */
    const q = u < CHEW.peak
      ? smooth(u / CHEW.peak)
      : 1 - smooth((u - CHEW.peak) / (1 - CHEW.peak));
    const side = i % 2 === 0 ? -1 : 1;
    const k = CHEW.squash * q;
    z.sx = 1 + k; z.sy = 1 / (1 + k);
    z.x += side * CHEW.shift * q;
    z.rot = side * CHEW.roll * q;
  }
  const bobAt = CHEW.at + CHEW.pulses * CHEW.for;
  if (t >= bobAt && t < bobAt + CHEW.bob.for) {
    z.y += -CHEW.bob.by * Math.sin(Math.PI * ((t - bobAt) / CHEW.bob.for));
  }
  return z;
}

/* how far the squash is on at second t: nought before the lunge, one across
   the chew, and back to nought before he is delighted. */
function squeezeAt(t) {
  const on = smooth(span(t, SHUT.at, SHUT.at + SHUT.in));
  const off = smooth(span(t, SHUT.until, SHUT.until + SHUT.out));
  return on * (1 - off);
}

/* and how far the lids are pushed down. it is a push rather than a value — the
   clip asks for at least this much and the module keeps whatever it had if it
   had more — and it **gives way to the squash**, so the narrowing is a
   narrowing and the chew is a line rather than the two of them stacking into a
   blank face. */
function lidAt(t) {
  const narrow = NARROW.to * span(t, NARROW.at, NARROW.at + NARROW.for);
  return narrow * (1 - squeezeAt(t));
}

/* the head's ink as it is actually drawn, in page space: the module's card,
   then this file's zone transform about the zone's own centre. at radius 0.5
   the ink is an ellipse and the axis aligned box of a rotated one is exact in
   one line, which is lib/mascot.mjs's own arithmetic. */
function headInk(mas, zone) {
  const R = HEAD.plate.s / 2 * plan.unit;
  const cx = PLATE.cx + zone.x + mas.card.x * zone.sx;
  const cy = PLATE.cy + zone.y + mas.card.y * zone.sy;
  const a = R * Math.abs(mas.card.sx) * zone.sx;
  const b = R * Math.abs(mas.card.sy) * zone.sy;
  const th = (mas.card.rot + zone.rot) * Math.PI / 180;
  const c = Math.cos(th), sn = Math.sin(th);
  return {
    cx, cy, a, b, th,
    hw: Math.hypot(a * c, b * sn), hh: Math.hypot(a * sn, b * c),
  };
}
function headInkRect(ink) {
  return { x: ink.cx - ink.hw, y: ink.cy - ink.hh, w: ink.hw * 2, h: ink.hh * 2 };
}

/* how far outside the head's ellipse the worst corner of a box is, as a ratio.
   under 1 is contained. it is the containment test the bite is derived from and
   the guard the bite is checked with, and they are the same function so they
   cannot disagree. */
function containment(ink, box) {
  const c = Math.cos(-ink.th), sn = Math.sin(-ink.th);
  let worst = 0;
  for (const px of [box.x, box.x + box.w]) {
    for (const py of [box.y, box.y + box.h]) {
      const dx = px - ink.cx, dy = py - ink.cy;
      const u = dx * c - dy * sn, v = dx * sn + dy * c;
      worst = Math.max(worst, Math.hypot(u / ink.a, v / ink.b));
    }
  }
  return worst;
}

/* ---------- how deep the lunge has to go ----------
   walked rather than solved, because the head's own scales on the contact frame
   come off `mascotFrame` and the bug's box comes off `bugFrame`, and neither is
   a closed form worth writing twice. half a pixel a step, then the margin. */
function biteDepth() {
  const t = VANISH_AT;
  const mas = mascotFrame(plan, t);
  const box = bugRect(bugFrame(t, ANT_SCHED));
  const q = BITE.squash;
  for (let d = 0; d <= 200; d += 0.5) {
    const zone = { x: BITE.fwd, y: d, sx: 1 + q, sy: 1 / (1 + q), rot: 0 };
    if (containment(headInk(mas, zone), box) <= 1) return { need: d, box };
  }
  throw new Error('no lunge inside 200px puts the bug under his ink');
}

/* the depth of the lunge, derived, and then held on BITE so everything reads
   one number. */
const DEPTH = biteDepth();
BITE.by = +(DEPTH.need + BITE.margin).toFixed(2);

/* the blink the seed was chosen for, read off the finished plan rather than
   off the search, so the still and the guard look at the blink the render
   actually draws. */
const BLINK = plan.idle.blinks.find(x => x.t >= BLINK_WINDOW[0] && x.t <= BLINK_WINDOW[1]) || null;

/* ==========================================================================
   one frame of everything
   ==========================================================================
   the whole clip as a function of the instant and of the output frame it
   belongs to. they differ under the shutter and the difference is the whole
   point of the split: everything that is a real move is a function of `t` and
   smears correctly, and the glitch is a function of `f` because a dropped
   packet happens to a screen rather than in the room. */

function heatAt(p) {
  if (p < 0) return 0;
  if (p < 0.13) return 1;
  if (p < 0.58) return 1 - (p - 0.13) / 0.45 * 0.58;
  if (p < GL.calmFrom) return 0.42 * (1 - (p - 0.58) / (GL.calmFrom - 0.58));
  return 0;
}
function calmGlitch() {
  return { sx: 0, sy: 0, split: 0, noise: 0, flash: 0, bands: [], heat: 0 };
}
/* a burst is a length in seconds, quantised to the grid that is rendering:
   post11's rule and post12's note. a 150ms hit is nine frames at sixty and 1.8
   at twelve, so written as seconds and left alone it would be a different
   event on the preview pass. */
function onGrid(t, len, fps) {
  const f0 = Math.round(t * fps);
  const n = Math.max(1, Math.round(len * fps));
  return { t0: f0 / fps, t1: (f0 + n) / fps, frames: n };
}
function glitchWindows(fps) {
  return [{ ...onGrid(END.at, END.hard + END.tail, fps), seed: 0x0c1a55 }];
}
const GL_WINDOWS = glitchWindows(FPS);
const GL_WINDOWS_60 = FPS === 60 ? GL_WINDOWS : glitchWindows(60);

function glitchAt(f, fps = FPS, windows = GL_WINDOWS) {
  const g = calmGlitch();
  const t = f / fps;
  const w = windows.find(x => t >= x.t0 && t < x.t1);
  if (!w) return g;
  const p = (t - w.t0) / (w.t1 - w.t0);
  const r = prng(w.seed ^ (f * 2654435761));
  let heat = heatAt(p);
  if (heat > 0 && p > 0.13 && p < GL.calmFrom && r() < 0.34) heat = 1;
  if (heat <= 0) return g;
  g.heat = heat;
  g.sx = +((r() * 2 - 1) * GL.shakeX * heat).toFixed(2);
  g.sy = +((r() * 2 - 1) * GL.shakeY * heat).toFixed(2);
  g.split = +(heat * (2.2 + r() * (GL.split - 2.2))).toFixed(2);
  g.noise = +(heat * lerp(GL.noise[0], GL.noise[1], r())).toFixed(4);
  g.flash = f === Math.round(END.at * fps) ? GL.flash : 0;
  const n = Math.min(GL.bands, Math.floor(heat * (GL.bands + 0.5)));
  for (let i = 0; i < n; i++) {
    const h = 18 + r() * 96;
    g.bands.push({
      top: +(r() * (VH - h)).toFixed(1), h: +h.toFixed(1),
      dx: +((r() * 2 - 1) * GL.bandDx * heat).toFixed(1),
    });
  }
  return g;
}

/* two sines on incommensurate periods rather than one, and post10 paid for
   that lesson: a sine stands still twice a period, so on an end card where the
   phosphor is the only thing still moving, the two frames either side of its
   turning point are identical. */
function phosphor(t, amp, slow, fast, phase) {
  return 1 + amp * 0.78 * Math.sin(2 * Math.PI * t / slow)
    + amp * 0.39 * Math.sin(2 * Math.PI * t / fast + phase);
}

/* the camera's own transform, applied to a page point, so a guard can ask
   where something actually is on the screen. it is `cameraFrame`'s own two
   numbers and nothing else — the same string the page writes. */
function toScreen(c, x, y) { return { x: x * c.z + c.tx, y: y * c.z + c.ty }; }
function rectToScreen(c, r) {
  const a = toScreen(c, r.x, r.y), b = toScreen(c, r.x + r.w, r.y + r.h);
  return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
}
/* how far each side of a screen rect sits inside the platform safe area, in
   device px. negative is over a line. */
function safeAir(sr) {
  return {
    left: +((sr.x - SAFE_CSS.left) * DSF).toFixed(1),
    top: +((sr.y - SAFE_CSS.top) * DSF).toFixed(1),
    right: +((VW - SAFE_CSS.right - (sr.x + sr.w)) * DSF).toFixed(1),
    bottom: +((VH - SAFE_CSS.bottom - (sr.y + sr.h)) * DSF).toFixed(1),
  };
}
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/* the head's ink as a page rect, off the module's own geometry. `headRect`
   answers in device px from each border and this is the same answer in the
   units the camera works in. */
/* the module's own answer, for the frames where nothing of this file's is on
   the head. it is kept because `headRect` is the geometry lib/mascot.mjs owns
   and a clip should not re-derive a plate's radius; `headInk` composes the zone
   transform on top of the same numbers. */
function headPageRect(fr) {
  const r = headRect(plan, fr);
  return {
    x: r.left / DSF, y: r.top / DSF,
    w: VW - r.right / DSF - r.left / DSF,
    h: VH - r.bottom / DSF - r.top / DSF,
  };
}

function frameAt(t, f) {
  const cam0 = cameraFrame(cam, t);
  const mas = mascotFrame(plan, t);

  /* ---------- the two channels this file writes on the module's face -------
     both are one directional and both say so. the lids are pushed toward shut
     and never opened, so a blink underneath still reads; the eye scales are
     blended toward the pair's own mean, so the file cannot make an eye bigger
     than the module asked for either. */
  const lv = smooth(span(t, LEVEL.at, LEVEL.at + LEVEL.for));
  if (lv > 0) {
    const mean = (mas.eyes[0].sy + mas.eyes[1].sy) / 2;
    for (const e of mas.eyes) e.sy = lerp(e.sy, mean, lv);
    /* and the lids, to the **more closed** of the two rather than to their
       mean, so this is still a push toward shut. the module staggers an idle
       blink across the pair by a frame or two, which is right for a sixtieth
       of a second and is a mismatched pair for as long as it lasts — and the
       chew, where the eyes are already lines, is where a rendered frame found
       one line going out before the other. */
    const shutter = Math.max(mas.eyes[0].lid, mas.eyes[1].lid);
    for (const e of mas.eyes) e.lid = lerp(e.lid, shutter, lv);
  }
  const lid = lidAt(t);
  if (lid > 0) for (const e of mas.eyes) e.lid = Math.max(e.lid, lid);
  const sq = squeezeAt(t);
  if (sq > 0) for (const e of mas.eyes) e.sy = Math.min(e.sy, lerp(e.sy, SHUT.sy, sq));

  const zone = biteZone(t);
  const g = glitchAt(f);
  /* the cut. one switch takes the mascot layer, and the bubble goes with it
     because the bubble lives inside his own zone. */
  const on = f >= CUT_FRAME ? 0 : 1;

  /* the bug is on until the frame the lunge lands, and it goes on that frame.
     switching it off there is only honest if it is under his ink when it
     happens, which is the derivation the depth comes from and the guard the
     containment check is. */
  const bug = bugFrame(t, ANT_SCHED);
  const bugOn = (f < VANISH_FRAME && on) ? 1 : 0;

  const wp = span(t, WM_IN, WM_IN + END.wmFor);
  const wm = {
    o: +span(t, WM_IN, WM_IN + END.wmFor * 0.45).toFixed(4),
    sc: +(1 + (1 - POP(wp)) * 0.085).toFixed(4),
    glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4),
  };
  return { t: +t.toFixed(4), f, cam: cam0, mas, zone, mo: on, bug, bugOn, wm, g };
}

/* what the page is handed, which is this file's own layers only: the camera and
   the mascot each have their own runtime. */
function pageFrame(o) {
  return {
    mo: o.mo,
    zone: [r2(o.zone.x), r2(o.zone.y), +o.zone.sx.toFixed(5), +o.zone.sy.toFixed(5), r2(o.zone.rot)],
    bug: {
      o: o.bugOn,
      body: [r2(o.bug.body.x), r2(o.bug.body.y), r2(o.bug.body.rot)],
      legs: o.bug.legs.map(L => L.map(r2)),
      ants: o.bug.ants.map(A => A.map(r2)),
    },
    wm: o.wm, g: o.g,
  };
}

/* ==========================================================================
   the page
   ==========================================================================
   three runtimes and one of this clip's own. the camera, then the mascot writes
   its own numbers, then this file writes the zone the module never touches and
   its own layers. */
function sceneHtml() {
  const b = BUG.body, h = BUG.head;
  /* the module's own bubble offset, mirrored. derived rather than typed, so a
     change to the head geometry moves both of them together. */
  const bubOff = +(SIZE * (HEAD.plate.x + HEAD.plate.s) / GRID + BUBBLE.gap).toFixed(2);
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post15</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500&display=swap">
<style>
:root{
  --bg:#ffffff; --fg:#0b0d10;
  /* the bug is drawn in the mascot's own face colour, per theme, because it is
     the same ink on the same paper and not a second white. it is only ever on
     screen in the dark half, and the light values are here so a still of the
     wrong half is obviously wrong rather than invisible. */
  --bug:#0b0d10;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  --body:"Space Grotesk",var(--mono);
  --display:"Michroma",var(--mono);
  /* the two channels the rgb split is drawn in: the same white the glow is,
     pulled apart, rather than a red and a cyan out of a filter preset. this
     frame has no colour in it and the glitch is not where colour starts. */
  --gr:rgba(255,120,120,.55); --gc:rgba(120,220,255,.55);
}
[data-theme=dark]{ --bg:#06070a; --fg:#d5dbd8; --bug:#f4f7f5; }
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}

/* the vignette, and it is load bearing rather than decoration. with nothing at
   all animating chrome stops producing compositor frames and the screenshot
   call blocks on a frame that never comes — post2.mjs found this and every clip
   in demo/ has carried the fix since. it is also the one thing in this file
   allowed to be a css animation, because it is the one thing that does not
   have to hit a mark. it is outside the camera, so the camera cannot smear it. */
.vignette{position:fixed;inset:-10%;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 78% 62% at 50% 46%,
    rgba(255,255,255,.030) 0%, rgba(255,255,255,.010) 46%, rgba(0,0,0,0) 72%);
  will-change:transform,opacity;
  animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{
  from{transform:scale(1) translate3d(0,0,0);opacity:.85}
  to{transform:scale(1.05) translate3d(0,-1.1%,0);opacity:1}
}

/* the stage carries the frame's own shake — the glitch's, not the camera's —
   and every custom property anything else reads. one place they are written
   and one place everything reads them from, which is what keeps the torn
   copies from drifting off the real one. the page colour is painted by html
   and body as well, so a fifteen pixel shake cannot expose an edge. */
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;background:var(--bg);
  transform:translate3d(calc(var(--sx,0) * 1px),calc(var(--sy,0) * 1px),0);
  will-change:transform}

${cameraCss()}

/* ---- the thought bubble goes off his other side ----
   lib/mascot.mjs hangs the cluster off the top **right** of the head, which is
   correct for the corner it was written in: post11's mascot stands bottom
   left, so a thought climbing to its right climbs into the frame. this one
   stands bottom right, and the first render put a 204 css px pill 116 px off
   the right hand edge of the screen.

   the fix is the module's own surface rather than an edit to it. the module
   writes the pill's opacity and transform and the dots' opacity and transform,
   and it never writes a position: the bubble is placed by css alone. so the
   clip mirrors it at the id level, which is exactly what post14 established
   for the mascot zone, and the offset is the module's own arithmetic rather
   than a second copy of it — the plate is centred in its own box, so the
   mirror of a symmetric offset is itself. row-reverse puts the small dot back
   nearest the head, and the pill's spring origin moves to the corner nearest
   the dots, which is now its right hand one.

   it also reads better: a mascot in the right hand corner thinking toward the
   left is thinking into the frame, which is the same argument TURN.bias makes
   about where he looks. (no backticks in this comment on purpose: it lives
   inside a template literal.) */
#m-bubble{left:auto; right:${bubOff}px; flex-direction:row-reverse}
#m-bubble .m-pill{transform-origin:100% 100%}

/* the mascot's own cut, as a wrapper rather than as a rule on the zone: the
   zone is carrying the bite's transform and a second thing writing it would be
   two things holding one channel. the bubble is inside the zone, so one switch
   takes all of him. */
#mas-cut{position:absolute;inset:0;z-index:4;opacity:var(--m-o,1)}

${mascotCss(plan)}

/* ---- the bug ----
   one svg the size of the stage, inside the camera with him. every point in it
   is written in page space by node, so nothing in here decides anything: the
   body is a translate and a rotate, and the eight polylines are lists of
   numbers.

   the glow is an svg filter on the ink group rather than a css filter on the
   svg, and that is a render cost rather than a preference — a css filter on
   this element would blur a 1080x1920 surface twice on every frame of the
   clip, and the filter region of an svg filter is the group's own bounding
   box, which is the bug. it is the mascot's two layer glow with the numbers
   walked down for something a fifth of the size. */
#bug{position:absolute;left:0;top:0;width:${VW}px;height:${VH}px;z-index:2;
  overflow:visible;pointer-events:none;opacity:var(--bug-o,0)}
#bug .lim{fill:none;stroke:var(--bug);stroke-width:${BUG.legW};
  stroke-linecap:round;stroke-linejoin:round}
#bug .ant{fill:none;stroke:var(--bug);stroke-width:${BUG.ant.w};
  stroke-linecap:round;stroke-linejoin:round}
#bug .sh{fill:var(--bug)}

/* ---- the wordmark ----
   three lines on the middle of the safe band. the deep glow is two text
   shadows rather than blurred duplicates, because it is twelve glyphs and a
   duplicate would have to be written every frame. the brightness filter on top
   is the phosphor breathing, which is what stops the last second from being a
   still picture. it is outside the camera, in screen space. */
.wm{position:absolute;left:50%;top:${CENTRE_Y}px;
  transform:translate(-50%,-50%) scale(var(--wm-s,1));
  font-family:var(--display);font-weight:400;color:var(--fg);
  text-align:center;text-transform:uppercase;letter-spacing:.18em;
  line-height:${WM.lh};white-space:nowrap;
  /* letter-spacing is added after every glyph including the last, so the box is
     one full space wider than the ink and the ink sits half a space left of the
     box centre. shifting by half the tracking is what actually centres it. */
  text-indent:.09em;
  opacity:var(--wm-o,0);
  text-shadow:0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),
    0 0 66px rgba(255,255,255,.10);
  filter:brightness(var(--wm-glow,1));
  z-index:9}
.wm span{display:block}
.stage[data-gl="1"] .wm{
  text-shadow:0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),
    0 0 66px rgba(255,255,255,.10),
    calc(var(--split,0) * -1px) 0 var(--gr),calc(var(--split,0) * 1px) 0 var(--gc)}

/* ---- the tear ----
   a band of the frame, blacked out and redrawn shifted. the layer paints the
   page colour first so it covers what is under it, then draws its own copy of
   the wordmark displaced sideways, which is a tear rather than a ghost.

   only the wordmark is copied, and that is post12's decision rather than a
   shortcut: the mascot is one dom subtree driven by ids out of two modules'
   runtimes and there is no second copy of it that could be kept in sync, and
   he is cut on the frame the hit lands anyway. */
.tear{position:absolute;inset:0;z-index:10;overflow:hidden;background:var(--bg);
  clip-path:inset(var(--tt,0px) 0 calc(100% - var(--tt,0px) - var(--th,0px)) 0);
  opacity:var(--to,0)}
.tear-in{position:absolute;inset:0;transform:translate3d(calc(var(--tdx,0) * 1px),0,0)}

/* ---- the fault's own two layers ----
   noise, screen blended so it adds light to a black frame rather than sitting
   on it as grey, and a white frame that fires once. */
.noise{position:absolute;inset:-40px;z-index:11;pointer-events:none;
  mix-blend-mode:screen;opacity:var(--noise,0);
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.0' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23m)'/%3E%3C/svg%3E")}
.flash{position:absolute;left:50%;top:${CENTRE_Y}px;z-index:12;pointer-events:none;
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
${cameraMarkup(`
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
  <div id="mas-cut">${mascotMarkup(plan)}</div>`)}
  <div class="wm" id="wm">${WM.lines.map(l => '<span>' + l + '</span>').join('')}</div>
${Array.from({ length: GL.bands }, (_, i) => '  <div class="tear" data-tear="' + i
    + '"><div class="tear-in"><div class="wm">'
    + WM.lines.map(l => '<span>' + l + '</span>').join('') + '</div></div></div>').join('\n')}
  <div class="noise" aria-hidden="true"></div>
  <div class="flash" aria-hidden="true"></div>
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
${cameraRuntime()}
${mascotRuntime()}
window.__P15 = ${JSON.stringify({ WM, VW, VH, DSF })};
${scenePage.toString()}
scenePage();
document.fonts.load('400 1em "Michroma"')
  .then(() => document.fonts.load('500 1em "Space Grotesk"'))
  .then(() => document.fonts.ready)
  .then(() => {
    window.__p15.fit();
    window.__built = window.__mas.build();
  });
</script>
</body>
</html>`;
}

/* ---------- the page's own script ----------
   it writes numbers to elements and it decides nothing, exactly like the three
   module runtimes beside it. serialised in with .toString(), so it must not
   close over anything: everything it needs arrives on window.__P15. */
function scenePage() {
  const P = window.__P15;
  const stage = document.getElementById('stage');
  const bug = document.getElementById('bug');
  const bugInk = document.getElementById('bug-ink');
  const bugBody = document.getElementById('bug-body');
  const legs = [0, 1, 2, 3, 4, 5].map(i => document.getElementById('bug-leg' + i));
  const ants = [0, 1].map(i => document.getElementById('bug-ant' + i));
  const zone = document.getElementById('m-zone');
  const wms = [...document.querySelectorAll('.wm')];
  const tears = [...document.querySelectorAll('.tear')];
  const tearIns = tears.map(t => t.querySelector('.tear-in'));

  /* the widest rendered line of a block, in css px, at whatever size it is set
     at. michroma is proportional and the tracking is nearly a fifth of an em,
     so the width of a string is a measurement rather than a ratio. */
  const widest = el => {
    let w = 0;
    for (const sp of el.querySelectorAll('span')) w = Math.max(w, sp.getBoundingClientRect().width);
    return w;
  };
  const pts = a => {
    let s = '';
    for (let i = 0; i < a.length; i += 2) s += (i ? ' ' : '') + a[i] + ',' + a[i + 1];
    return s;
  };

  window.__p15 = {
    ready: true,

    fit() {
      const probe = wms[0];
      probe.style.fontSize = '100px';
      const size = 100 * P.WM.w / widest(probe);
      /* every copy is fitted, the torn ones included, or a tear would show a
         wordmark at a different size to the one under it. */
      for (const el of wms) el.style.fontSize = size.toFixed(2) + 'px';
      return { wm: size };
    },

    /* what the wordmark actually measures, once, after the fit: the widest
       line's ink, the block's box, and the cap height off the rendered glyphs
       rather than off the ratio — a face that failed to load is caught here
       rather than in a review. */
    measure() {
      const el = wms[0], r = el.getBoundingClientRect(), d = P.DSF;
      const cv = document.createElement('canvas').getContext('2d');
      const cs = getComputedStyle(el);
      cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      const m = cv.measureText('H');
      return {
        sizeCss: +parseFloat(cs.fontSize).toFixed(2),
        widestPx: +(widest(el) * d).toFixed(1),
        capPx: +((m.actualBoundingBoxAscent || 0) * d).toFixed(1),
        left: +(r.left * d).toFixed(1), top: +(r.top * d).toFixed(1),
        right: +((P.VW - r.right) * d).toFixed(1), bottom: +((P.VH - r.bottom) * d).toFixed(1),
        cssRect: { x: +r.left.toFixed(2), y: +r.top.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) },
        font: cv.font,
      };
    },

    /* the bug's ink as it actually rendered, in device px and in screen css,
       taken off the group rather than off the plan. the glow is a filter and
       filters extend a box, so the measurement is taken on the un-filtered
       limbs and body rather than on the group carrying the filter — the same
       reason lib/mascot.mjs reports the glow beside the ink instead of in it. */
    bugBox() {
      const d = P.DSF;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const el of [document.getElementById('bug-limbs'), bugBody]) {
        const r = el.getBoundingClientRect();
        x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top);
        x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
      }
      return {
        wPx: +((x1 - x0) * d).toFixed(1), hPx: +((y1 - y0) * d).toFixed(1),
        cssRect: { x: +x0.toFixed(2), y: +y0.toFixed(2), w: +(x1 - x0).toFixed(2), h: +(y1 - y0).toFixed(2) },
        left: +(x0 * d).toFixed(1), top: +(y0 * d).toFixed(1),
        right: +((P.VW - x1) * d).toFixed(1), bottom: +((P.VH - y1) * d).toFixed(1),
      };
    },

    /* the head's drawn plate, in screen css and device px. the plate is a
       circle at radius 0.5, so its client rect is its ink — the same reason
       lib/transitions.mjs measured it this way. */
    plateBox() {
      const el = zone.querySelector('.m-face .m-plate');
      const r = el.getBoundingClientRect(), d = P.DSF;
      return {
        x: +r.left.toFixed(2), y: +r.top.toFixed(2),
        w: +r.width.toFixed(2), h: +r.height.toFixed(2),
        wPx: +(r.width * d).toFixed(1), hPx: +(r.height * d).toFixed(1),
      };
    },

    apply(o) {
      const s = stage.style;
      s.setProperty('--m-o', o.mo.toFixed(4));
      /* the zone. lib/mascot.mjs writes nothing to it, which is the seam this
         clip lunges and chews through, and the order is translate then rotate
         then scale so he is carried to where he is standing and *then*
         deformed about the place he is standing. */
      const z = o.zone;
      zone.style.transform = 'translate(' + z[0] + 'px,' + z[1] + 'px) rotate('
        + z[4] + 'deg) scale(' + z[2] + ',' + z[3] + ')';
      s.setProperty('--bug-o', o.bug.o.toFixed(4));
      s.setProperty('--wm-o', o.wm.o.toFixed(4));
      s.setProperty('--wm-s', o.wm.sc.toFixed(4));
      s.setProperty('--wm-glow', o.wm.glow.toFixed(4));
      s.setProperty('--sx', o.g.sx.toFixed(2));
      s.setProperty('--sy', o.g.sy.toFixed(2));
      s.setProperty('--split', o.g.split.toFixed(2));
      s.setProperty('--noise', o.g.noise.toFixed(4));
      s.setProperty('--flash', o.g.flash.toFixed(4));
      /* the split is behind an attribute rather than a zero valued shadow: a
         shadow at offset 0 in full colour is a coloured halo, not "off". */
      if (o.g.split > 0.01) stage.setAttribute('data-gl', '1');
      else stage.removeAttribute('data-gl');

      /* off screen he is switched off rather than merely left at nought: a
         filtered group is still rastered at opacity zero. */
      bug.style.visibility = o.bug.o > 0.002 ? 'visible' : 'hidden';
      bugBody.setAttribute('transform',
        'translate(' + o.bug.body[0] + ' ' + o.bug.body[1] + ') rotate(' + o.bug.body[2] + ')');
      for (let i = 0; i < legs.length; i++) legs[i].setAttribute('points', pts(o.bug.legs[i]));
      for (let i = 0; i < ants.length; i++) ants[i].setAttribute('points', pts(o.bug.ants[i]));

      for (let i = 0; i < tears.length; i++) {
        const band = o.g.bands[i];
        const st = tears[i].style;
        if (!band) { st.setProperty('--to', '0'); st.setProperty('--th', '0px'); continue; }
        st.setProperty('--to', '1');
        st.setProperty('--tt', band.top.toFixed(1) + 'px');
        st.setProperty('--th', band.h.toFixed(1) + 'px');
        tearIns[i].style.setProperty('--tdx', band.dx.toFixed(1));
      }
    },

    /* the bug alone, for the still that has to answer "does it read as a bug
       with legs" before anything is animated. **the vignette stays on**: it is
       the one css animation in the file and it is load bearing, because with
       nothing at all animating chrome stops producing compositor frames and
       the next virtual time budget never expires. hiding it here is what hung
       this mode's second run after exactly one file. */
    soloBug(on) {
      document.getElementById('mas-cut').style.display = on ? 'none' : '';
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
   nothing in this scene animates by hand — node holds every animation and the
   page writes what it is handed — but the shim is installed and flushed once
   per capture anyway, so every layer runs under the same clock everything else
   in demo/ runs under. a shim that only appears when it is needed is a shim
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

async function boot() {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  const { srv, port } = await serve(sceneHtml());
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
    const ok = await page.evaluate(() => !!(window.__mas && window.__mas.ready && window.__cam
      && window.__cam.ready && window.__p15
      && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  const ready = await page.evaluate(() => ({
    mas: !!(window.__mas && window.__mas.ready),
    cam: !!(window.__cam && window.__cam.ready),
    p15: !!(window.__p15 && window.__p15.ready),
  }));
  for (const k of ['mas', 'cam', 'p15']) {
    if (!ready[k]) throw new Error('the ' + k + ' layer never became ready');
  }
  /* offline michroma falls back to the system mono and the wordmark looks
     almost right, which is the worst kind of wrong to judge type on. */
  if (!await page.evaluate(() => document.fonts.check('400 40px "Michroma"'))) {
    throw new Error('Michroma did not load — the type would be judged in the mono fallback');
  }
  return { browser, page, cdp, srv, advance };
}

/* one instant, written to the page in the order the contract says. */
async function paint(page, o) {
  await page.evaluate(c => window.__cam.apply(c), o.cam);
  await page.evaluate(m => window.__mas.apply(m), o.mas);
  await page.evaluate(p => window.__p15.apply(p), pageFrame(o));
}

async function shoot(cdp, file, fmt = 'png') {
  const shot = await cdp.send('Page.captureScreenshot', {
    format: fmt, quality: fmt === 'jpeg' ? 94 : undefined,
    captureBeyondViewport: false,
    clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
  });
  fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
}

/* ---------- the bug alone ----------
   the brief's first validation step, and it is a mode rather than a note: if it
   does not read as a bug with legs at phone size there is no point animating
   it. four stances a third of a stride apart, plus one crop at three times so
   the knees and the antennae can be seen at all. */
async function renderBugOnly() {
  const { browser, page, cdp, srv, advance } = await boot();
  const dir = path.join(VERIFY, 'bug');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  await page.evaluate(() => window.__p15.soloBug(true));
  const phases = [0, 0.25, 0.5, 0.75];
  /* **virtual time has to move between two captures.** with the clock paused
     `Page.captureScreenshot` waits for a frame the compositor has no reason to
     produce, and the second call in a row blocks forever — which is what this
     mode did on its first run, after writing exactly one file. one STEP of
     budget after each shot is what the render loop already does between its
     own frames, and it is the whole fix. the crop is a second pass with its
     own paint in front of it for the same reason. */
  const at = i => timeAtX(WALK.x0 + (WALK.x1 - WALK.x0) * 0.45 + phases[i] * BUG.stride);
  let box = null;
  for (let i = 0; i < phases.length; i++) {
    const t = at(i);
    await paint(page, frameAt(t, Math.round(t * FPS)));
    box = await page.evaluate(() => window.__p15.bugBox());
    await shoot(cdp, path.join(dir, 'phase' + i + '.png'));
    await advance(STEP);
  }
  for (let i = 0; i < phases.length; i++) {
    const t = at(i);
    await paint(page, frameAt(t, Math.round(t * FPS)));
    const c = (await page.evaluate(() => window.__p15.bugBox())).cssRect;
    const pad = 26;
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: Math.max(0, c.x - pad), y: Math.max(0, c.y - pad),
        width: c.w + pad * 2, height: c.h + pad * 2, scale: 4 },
    });
    fs.writeFileSync(path.join(dir, 'crop-4x-' + i + '.png'), Buffer.from(shot.data, 'base64'));
    await advance(STEP);
  }
  await browser.close();
  srv.close();
  return box;
}

/* the instant the body is at a given distance. the walk is monotone so this is
   a bisection and it is exact to a 480th of a second, which is what the still
   times want. */
function timeAtX(x) {
  let lo = WALK.t0, hi = WALK.t1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (walkX(mid) < x) lo = mid; else hi = mid;
  }
  return +((lo + hi) / 2).toFixed(4);
}

/* ---------- render ---------- */
async function render() {
  for (const d of [FRAMES, SUBS]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  fs.mkdirSync(OUT, { recursive: true });
  const N = Math.round(FPS * SECONDS);
  const { browser, page, cdp, srv, advance } = await boot();

  const built = await page.evaluate(() => window.__built);
  const wm = await page.evaluate(() => window.__p15.measure());
  console.log('  built: head ' + built.headPx + 'px, ' + built.eyes + ' eyes, '
    + built.glows + ' glow layers, theme ' + built.theme);
  console.log('  the wordmark: ' + wm.sizeCss + 'css px, widest line ' + wm.widestPx
    + ' device px, caps ' + wm.capPx + ', clear ' + wm.left + ' left / ' + wm.top
    + ' top / ' + wm.right + ' right / ' + wm.bottom + ' bottom');

  /* the liveness signature. one number per output frame off everything this
     file wrote plus everything the three modules wrote, so two identical frames
     are a fact rather than a suspicion. post10 shipped a pair and only found
     out at sixty. */
  const sigs = [];
  let edgeWorst = null, edgeSamples = 0;
  let bugBoxWorst = null, bubbleWorst = null, bubbleSamples = 0;
  /* the frame the bug goes, measured rather than planned: the bug's rendered
     ink box against the head's rendered plate on that frame. it is the one
     number that says the bite ate it rather than deleted it. */
  let vanish = null, vanishBug = null;
  const bandHits = [];
  /* **the bug walks in through the left margin, and it has to.** entering from
     a side is what the brief asks for and every side of the frame is outside
     the platform safe area, so there is no walk on that reads as a walk on and
     also never crosses a safe line. what is guarded instead is the shape of
     it: the ink enters the safe rect once, early, and never leaves it again.
     both halves are latched off the rendered box rather than off a time typed
     here — `inSafe` is the instant it arrives, and anything after it that
     scores under nought is a real overrun. */
  let inSafe = null;
  const leftSafe = [];
  const wall = Date.now();

  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const o = frameAt(t, f);
      await paint(page, o);
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);

      if (k === 0) {
        let s = o.mo * 7 + o.bugOn * 3 + o.wm.o * 11 + o.wm.sc * 13 + o.wm.glow * 17
          + o.g.sx * 19 + o.g.sy * 23 + o.g.split * 29 + o.g.noise * 31 + o.g.flash * 37
          + o.g.bands.length * 41
          + o.cam.tx * 173 + o.cam.ty * 179 + o.cam.z * 181
          + o.zone.x * 191 + o.zone.y * 193 + o.zone.sx * 197 + o.zone.rot * 233
          + o.bug.body.x * 199 + o.bug.body.y * 211 + o.bug.body.rot * 223
          + o.mas.card.x * 43 + o.mas.card.y * 47 + o.mas.card.rot * 53
          + o.mas.card.sx * 59 + o.mas.card.sy * 61 + o.mas.glow * 67;
        for (const L of o.bug.legs) s += L[4] * 227 + L[5] * 229;
        for (let e = 0; e < 2; e++) {
          s += o.mas.eyes[e].x * (71 + e) + o.mas.eyes[e].y * (79 + e)
            + o.mas.eyes[e].sx * (83 + e) + o.mas.eyes[e].sy * (89 + e) + o.mas.eyes[e].lid * (97 + e);
        }
        sigs.push(+s.toFixed(6));

        /* four times a second, on the whole frame rather than on a subframe,
           and never inside the fault: the glitch translates the stage and a
           camera edge read through a fifteen pixel jump is a reading of the
           glitch rather than of the camera. */
        if (f % Math.max(1, Math.round(FPS / 4)) === 0 && o.g.heat === 0) {
          const e = await page.evaluate((vw, vh, d) => window.__cam.edges(vw, vh, d), VW, VH, DSF);
          edgeSamples++;
          const near = Math.min(e.left, e.top, e.right, e.bottom);
          if (!edgeWorst || near < edgeWorst.near) edgeWorst = { t: +t.toFixed(2), near, ...e };
        }
        /* the bug's ink as rendered, against the safe area and the band. */
        if (o.bugOn) {
          const bb = await page.evaluate(() => window.__p15.bugBox());
          const air = Math.min(bb.left - SAFE.left, bb.top - SAFE.top,
            bb.right - SAFE.right, bb.bottom - SAFE.bottom);
          if (inSafe === null && air >= 0) inSafe = +t.toFixed(3);
          if (inSafe !== null) {
            if (air < 0) leftSafe.push(+t.toFixed(2));
            if (!bugBoxWorst || air < bugBoxWorst.air) {
              bugBoxWorst = { t: +t.toFixed(2), air: +air.toFixed(1), ...bb };
            }
          }
          if (overlaps(bb.cssRect, BAND)) bandHits.push('the bug at ' + t.toFixed(2) + 's');
        }
        /* and the bubble, on a quarter second sample, against the same two. */
        if (f % Math.max(1, Math.round(FPS / 4)) === 0) {
          const bs = await page.evaluate((vw, vh) => window.__mas.bubbleSafe(vw, vh), VW, VH);
          if (bs) {
            bubbleSamples++;
            const air = Math.min(bs.left - SAFE.left, bs.top - SAFE.top,
              bs.right - SAFE.right, bs.bottom - SAFE.bottom);
            if (!bubbleWorst || air < bubbleWorst.air) {
              bubbleWorst = { t: +t.toFixed(2), air: +air.toFixed(1), ...bs };
            }
            const bd = await page.evaluate(() => window.__mas.band());
            if (bd && bd.hit) bandHits.push('the bubble at ' + t.toFixed(2) + 's');
          }
        }
      }

      /* the containment, measured on the picture rather than derived twice, and
         it takes **two** frames because the two things it compares are never
         drawn on the same one: the bug's ink off the last frame it is on, and
         his plate off the frame it goes. that is only a fair comparison because
         the bug has been standing still since it planted its feet, which is
         asserted rather than assumed. */
      if (k === 0 && f === VANISH_FRAME - 1) {
        vanishBug = (await page.evaluate(() => window.__p15.bugBox())).cssRect;
      }
      if (k === 0 && f === VANISH_FRAME) {
        vanish = {
          t: +t.toFixed(3), bug: vanishBug,
          plate: await page.evaluate(() => window.__p15.plateBox()),
        };
      }

      const file = SUB > 1
        ? path.join(SUBS, 's' + String(idx).padStart(6, '0') + '.jpg')
        : path.join(FRAMES, 'f' + String(f).padStart(5, '0') + '.jpg');
      await shoot(cdp, file, 'jpeg');
      await advance(SUBSTEP);
    }
    if (f % 60 === 0) {
      console.log('  ' + String(f).padStart(4) + '/' + N + '  t=' + (f / FPS).toFixed(2) + 's  '
        + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
    }
  }

  /* ---------- the stills ----------
     a still is a frame the clip actually has: the time asked for is rounded to
     a frame and then that frame's own instant is what gets drawn, so the
     glitch, which is a function of the frame index, and everything else, which
     is a function of the time, can never disagree about which moment a still
     is. */
  fs.rmSync(VERIFY, { recursive: true, force: true });
  fs.mkdirSync(VERIFY, { recursive: true });
  const stills = [
    [0, 'a-frame-zero'],
    [timeAtX(WALK.x0 + 60), 'b-the-bug-is-in'],
    [CUT.marks[0].t + STATES.curious.entry, 'c-he-sees-it'],
    [BLINK ? BLINK.t + BLINK.close + BLINK.hold / 2 : 1.0, 'd-the-blink'],
    [WALK.t1 + BUG_SETTLE, 'e-it-has-stopped'],
    [LEVEL.at + LEVEL.for, 'f-the-eyes-are-level'],
    [NARROW.at + NARROW.for, 'g-narrowed'],
    [BITE.at + BITE.rise, 'h-the-rise'],
    [VANISH_AT - 1 / FPS, 'i-the-lunge'],
    [VANISH_AT, 'j-the-bite'],
    [BITE_END, 'k-back-up'],
    [CHEW_HITS[0], 'l-chew-one'],
    [CHEW_HITS[1], 'l2-chew-two'],
    [CHEW_HITS[2], 'm-chew-three'],
    [CHEW.at + CHEW.pulses * CHEW.for + CHEW.bob.for / 2, 'm2-the-bob'],
    [SHUT.until + SHUT.out, 'm3-eyes-open'],
    [plan.marks[2].bubble.full + 0.10, 'n-crunchy'],
    [GL_WINDOWS[0].t0, 'o-the-hit'],
    [GL_WINDOWS[0].t0 + 0.10, 'p-the-tear'],
    [END.at + END.hard + END.tail + 0.08, 'q-the-wordmark'],
    [SECONDS - 0.05, 'r-the-last-frame'],
  ];
  for (const [want, name] of stills) {
    const fr = Math.min(N - 1, Math.max(0, Math.round(want * FPS)));
    await paint(page, frameAt(fr / FPS, fr));
    await shoot(cdp, path.join(VERIFY, name + '.png'));
    /* the clock has to move between two captures — see renderBugOnly. */
    await advance(STEP);
  }

  /* ---------- the bite strip ----------
     the lunge is 0.10s, which is one frame at twelve and six at sixty, so the
     preview cannot answer whether it reads as a bite any more than it can
     answer whether the walk reads as a walk. eighteen frames a sixtieth apart
     across the rise, the lunge, the contact and the way back up, full frame
     because the point of it is where his head is against where the bug was. */
  const bdir = path.join(VERIFY, 'bite');
  fs.mkdirSync(bdir, { recursive: true });
  for (let i = 0; i < 18; i++) {
    const t = +(BITE.at + i / 60).toFixed(4);
    const fr = Math.round(t * FPS);
    await paint(page, frameAt(t, fr));
    await shoot(cdp, path.join(bdir, 'b' + String(i).padStart(2, '0')
      + '-' + t.toFixed(3) + 's.png'));
    await advance(STEP);
  }

  /* ---------- the gait strip ----------
     twenty four stills a sixtieth apart across three gait cycles, cropped to
     the bug at twice size. this is where the walk is judged, and it exists
     because the twelve frame preview samples a 0.13s cycle once and a half.
     see the header. */
  const gdir = path.join(VERIFY, 'gait');
  fs.mkdirSync(gdir, { recursive: true });
  const g0 = timeAtX(WALK.x0 + 90);
  for (let i = 0; i < 24; i++) {
    const t = +(g0 + i / 60).toFixed(4);
    const o = frameAt(t, Math.round(t * FPS));
    await paint(page, o);
    const b = await page.evaluate(() => window.__p15.bugBox());
    const c = b.cssRect, pad = 20;
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: Math.max(0, c.x - pad), y: Math.max(0, c.y - pad),
        width: c.w + pad * 2, height: c.h + pad * 2, scale: 2 },
    });
    fs.writeFileSync(path.join(gdir, 'g' + String(i).padStart(2, '0')
      + '-' + t.toFixed(3) + 's.png'), Buffer.from(shot.data, 'base64'));
    await advance(STEP);
  }

  await browser.close();
  srv.close();
  if (SUB > 1) blend(N);

  const state = {
    built, wm, sigs, frames: N,
    edges: edgeWorst, edgeSamples, vanish,
    bug: bugBoxWorst, bugInSafe: inSafe, bugLeftSafe: leftSafe,
    bugStill: +Math.abs(walkX(VANISH_AT) - walkX(VANISH_AT - 1 / FPS)).toFixed(6),
    bubble: bubbleWorst, bubbleSamples, bandHits,
  };
  fs.writeFileSync(path.join(OUT, 'post15.json'), JSON.stringify(state, null, 2));
  return state;
}

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }

/* the shutter: the subframes are averaged into frames, because a frame is the
   light that arrived over its own duration rather than a sample of one instant.
   post10's chain, unchanged. */
function blend(N) {
  console.log('  blending ' + N * SUB + ' subframes into ' + N + ' frames ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS * SUB), '-i', path.join(SUBS, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1)
      + ',setpts=PTS-STARTPTS,framestep=' + SUB,
    '-q:v', '2', path.join(FRAMES, 'f%05d.jpg')]);
}

function encode(wav) {
  const out = path.join(OUT, 'post15-dark-1080x1920.mp4');
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

/* ==========================================================================
   the sound
   ==========================================================================
   five kinds and eighteen events, and every one of them is a time something
   else already decided. nothing here is placed by hand.

   the footsteps are the interesting ones: `stepTimes` returns the instants the
   body has covered another whole stride, so they are a property of the walk
   rather than a rhythm laid over it. as he decelerates into the stop the last
   few spread out and then stop, which is not a fade — it is the same gait
   running out of speed.

   **the bite and the chews are the same recipe at two levels**, and that is the
   design rather than a saving. a bite and a chew are the same event happening
   to the same object; what separates them is that the first one is through the
   shell and the rest are not. so the bite is lower, longer, grittier and has
   almost no flutter on it — a flutter is a jaw working and the first bite is a
   jaw closing — and it is rendered in its own pass at its own gain, which is
   post13's move for a sound that means something different at a different
   level. the three chews walk down in pitch because a mouth closing on
   something is a cavity getting smaller.

   the pop is `mascotCues`, on the pill rather than on the first dot. the glitch
   is the cut. */

/* the bite: one `crunch` with the chewing taken out of it. `depth` is the
   flutter and it is nearly nothing here, `grit` is up, and it sits three
   decibels under the chews because a bite that was louder than the chewing
   would make the chewing an echo of it. */
const BITE_SND = {
  gain: -28,
  opts: { f0: 300, f1: 158, len: 0.19, depth: 0.10, grit: 0.62, tau: 0.075,
    burst: 0.011, lpHz: 2200, seed: 0x7ab214 },
};

/* the three chews, one on each pulse's own contact, walking down. the last is
   the longest and the lowest, which is the swallow. */
const CRUNCH = CHEW_HITS.map((t, i) => ({
  t,
  opts: [
    { f0: 452, f1: 268, len: 0.15, flutter: 29, seed: 0x3c7a19 },
    { f0: 396, f1: 232, len: 0.16, flutter: 26, seed: 0x91b40d },
    { f0: 338, f1: 186, len: 0.23, flutter: 22, tau: 0.075, seed: 0x2ef651 },
  ][i],
}));

function soundCues() {
  const cues = [
    ...STEPS.map((t, i) => ({
      t, kind: 'tick',
      opts: { seed: (0x6ad13f ^ (i * 2654435761)) >>> 0, hz: 288 + (i % 3) * 16 },
      from: 'stride ' + (i + 1) + ', read off the walk',
    })),
    ...CRUNCH.map((c, i) => ({
      t: c.t, kind: 'crunch', opts: c.opts,
      from: 'chew ' + (i + 1) + ' of three, on that pulse\'s own contact',
    })),
    ...mascotCues(plan).map(c => ({ ...c, from: 'the pill arriving, off mascotCues' })),
    { t: END.at, kind: 'glitch', from: 'the cut' },
  ];
  return cues.sort((a, b) => a.t - b.t);
}

/* ==========================================================================
   go
   ========================================================================== */
console.log('the boring tek — post15, the bug');
console.log('');
console.log(describeMascot(plan));
const rep = mascotMotion(plan, FPS, SECONDS);
const rep60 = FPS === 60 ? rep : mascotMotion(plan, 60, SECONDS);
console.log(describeMotion(rep60));
console.log('');
console.log(describeCamera(cam));
console.log('');
/* ---------- the numbers, before a frame is written ---------- */
const camMo = cameraMotion(cam, 60);

/* ---------- the bite, before a frame is written ----------
   the containment on the frame the bug goes, worked out off the same two
   functions the derivation used, plus the worst one frame move the zone makes
   so a lunge cannot become a cut. */
const BITEMO = (() => {
  const t = VANISH_AT;
  const mas = mascotFrame(plan, t);
  const zone = biteZone(t);
  const box = bugRect(bugFrame(t, ANT_SCHED));
  const hold = containment(headInk(mas, zone), box);
  let step = { d: 0, t: 0 }, prev = null;
  for (let f = 0; f < Math.round(60 * SECONDS); f++) {
    const tt = f / 60;
    const z = biteZone(tt);
    if (prev) {
      const d = Math.hypot(z.x - prev.x, z.y - prev.y);
      if (d > step.d) step = { d: +d.toFixed(3), t: +tt.toFixed(3) };
    }
    prev = z;
  }
  return { hold: +hold.toFixed(4), need: DEPTH.need, by: BITE.by, step };
})();

/* ---------- the pair, before a frame is written ----------
   both eyes, on the drawn frame after this file's own two writes, from the
   moment the bug stops to the cut. a mismatched pair is what a rendered frame
   called broken and it is a number now. */
const PAIR = (() => {
  let sy = { d: 0, t: 0 }, lid = { d: 0, t: 0 };
  for (let f = Math.round(60 * WALK.t1); f < Math.round(60 * END.at); f++) {
    const t = f / 60;
    const o = frameAt(t, Math.round(t * FPS));
    const ds = Math.abs(o.mas.eyes[0].sy - o.mas.eyes[1].sy);
    const dl = Math.abs(o.mas.eyes[0].lid - o.mas.eyes[1].lid);
    if (ds > sy.d) sy = { d: +ds.toFixed(4), t: +t.toFixed(2) };
    if (dl > lid.d) lid = { d: +dl.toFixed(4), t: +t.toFixed(2) };
  }
  return { sy, lid, from: WALK.t1 };
})();

/* the eyes across the chew, so "eyes closed, content" is a measurement rather
   than a description: how tall the taller of the two ever is, as a share of the
   eye's own height, and how many device px of ink that leaves on the frame. */
const CHEW_EYES = (() => {
  let hi = 0;
  for (let f = Math.round(60 * CHEW.at); f < Math.round(60 * (CHEW.at + CHEW.pulses * CHEW.for)); f++) {
    const o = frameAt(f / 60, f);
    hi = Math.max(hi, o.mas.eyes[0].sy, o.mas.eyes[1].sy);
  }
  const px = HEAD.eye.h * plan.unit * hi * DSF;
  return { sy: +hi.toFixed(4), px: +px.toFixed(1) };
})();

/* the camera's own edges, worked out rather than sampled: the rig is exactly
   the stage's size, so the page point 0 lands at `tx` and the page point w
   lands at `w*z + tx`, and neither may come inside the frame. */
function camEdges(t) {
  const c = cameraFrame(cam, t);
  return {
    left: -c.tx, top: -c.ty,
    right: VW * c.z + c.tx - VW, bottom: VH * c.z + c.ty - VH, z: c.z,
  };
}
let edgePlan = null;
for (let f = 0; f < Math.round(60 * SECONDS); f++) {
  const t = f / 60;
  const e = camEdges(t);
  const near = Math.min(e.left, e.top, e.right, e.bottom);
  if (!edgePlan || near < edgePlan.near) edgePlan = { t: +t.toFixed(3), near: +near.toFixed(3), ...e };
}

/* ---------- the bug, before a frame is written ---------- */
const GAIT = (() => {
  const S = BUG.stride, D = BUG.duty;
  let slide = 0, slideAt = 0, reach = 0, reachAt = 0;
  const offs = [];
  for (let s = 0; s < 2; s++) for (let i = 0; i < 3; i++) {
    offs.push({ off: ((s === 1) !== (i === 1)) ? 0.5 : 0, rest: { x: BUG.feet[i].x, y: BUG.feet[i].y * (s === 0 ? -1 : 1) } });
  }
  for (const L of offs) {
    let prev = null;
    for (let i = 0; i <= Math.round(240 * (WALK.t1 - WALK.t0)); i++) {
      const t = WALK.t0 + i / 240;
      const f = legFoot(walkX(t), L.off, L.rest);
      const k = Math.floor(walkX(t) / S + L.off);
      if (prev && f.planted && prev.planted && prev.k === k) {
        const d = Math.hypot(f.x - prev.x, f.y - prev.y);
        if (d > slide) { slide = d; slideAt = +t.toFixed(3); }
      }
      prev = { ...f, k };
    }
  }
  for (let i = 0; i <= Math.round(240 * SECONDS); i++) {
    const t = i / 240;
    const bf = bugFrame(t, ANT_SCHED);
    if (bf.worstReach > reach) { reach = bf.worstReach; reachAt = +t.toFixed(3); }
  }
  const periods = [];
  for (let i = 1; i < STEPS.length; i++) periods.push(STEPS[i] - STEPS[i - 1]);
  return {
    slide: +slide.toFixed(6), slideAt,
    reach: +reach.toFixed(3), reachAt, limit: BUG.femur + BUG.tibia,
    strides: STEPS.length,
    period: { lo: +Math.min(...periods).toFixed(4), hi: +Math.max(...periods).toFixed(4) },
    speed: +WALK.v.toFixed(1),
    ink: { len: +BUG_INK.len.toFixed(1), w: +BUG_INK.w.toFixed(1),
      lenPx: +(BUG_INK.len * DSF).toFixed(1), wPx: +(BUG_INK.w * DSF).toFixed(1) },
  };
})();

/* the gap between the bug's ink and the head's ink, in page px, on every frame
   **before the lunge starts**. the brief's own line: it may not overlap him
   until he goes for it. after that the overlap is the joke. */
const GAP = (() => {
  let worst = Infinity, at = 0, over = 0;
  for (let f = 0; f < Math.round(60 * (BITE.at + BITE.rise)); f++) {
    const t = f / 60;
    const br = bugRect(bugFrame(t, ANT_SCHED));
    const hr = headInkRect(headInk(mascotFrame(plan, t), biteZone(t)));
    if (overlaps(br, hr)) over++;
    const v = br.y - (hr.y + hr.h);
    if (v < worst) { worst = v; at = +t.toFixed(2); }
  }
  return { worst: +worst.toFixed(2), at, over };
})();

console.log('the bug');
console.log('  ink ' + GAIT.ink.len + ' x ' + GAIT.ink.w + ' css, '
  + GAIT.ink.lenPx + ' x ' + GAIT.ink.wPx + ' device px, against a '
  + plan.headPx + 'px head');
console.log('  walks ' + (WALK.x1 - WALK.x0).toFixed(0) + ' page px from ' + WALK.t0.toFixed(2)
  + 's to ' + WALK.t1.toFixed(2) + 's at ' + GAIT.speed + ' px/s, '
  + (GAIT.speed / GAIT.ink.len).toFixed(1) + ' body lengths a second');
console.log('  ' + GAIT.strides + ' strides of ' + BUG.stride + 'px, duty ' + BUG.duty
  + ', period ' + (GAIT.period.lo * 1000).toFixed(0) + ' to ' + (GAIT.period.hi * 1000).toFixed(0)
  + 'ms (' + (60 * GAIT.period.lo).toFixed(1) + ' to ' + (60 * GAIT.period.hi).toFixed(1)
  + ' frames a cycle at sixty)');
console.log('  worst planted foot movement ' + GAIT.slide + 'px, worst leg demand '
  + GAIT.reach + ' against a reach of ' + GAIT.limit);
console.log('  the lane sits at y ' + BUG.path.mid + ', which is ' + LANE_CLEAR
  + 'px under the lowest his ink gets (' + LANE.headBottom + ' at ' + LANE.at + 's)');
console.log('  closest the bug ever gets to his ink: ' + GAP.worst + 'px at ' + GAP.at + 's, '
  + GAP.over + ' frames of overlap');
console.log('');

console.log('the beats');
const beats = [
  [0, 'up. he is at rest with the idle layer running, and the bug is coming in from the left'],
  ...plan.marks.map(m => [m.t, m.state.padEnd(12) + ' settles ' + m.settled.toFixed(2)
    + ', holds to ' + m.leaving.toFixed(2)
    + (m.turn != null ? ', turn to ' + m.turn.toFixed(2) : '')]),
  ...(BLINK ? [[BLINK.t, 'the blink, ' + ((BLINK.close + BLINK.hold + BLINK.open) * 1000).toFixed(0)
    + 'ms of it, off the idle schedule the seed was chosen for']] : []),
  [WALK.t1, 'the bug stops under him and plants its feet over ' + BUG_SETTLE.toFixed(2) + 's'],
  [LEVEL.at + LEVEL.for, 'his eyes are level again, and they stay level to the cut'],
  [NARROW.at + NARROW.for, 'both lids are down to ' + NARROW.to.toFixed(2) + ', symmetrically'],
  [BITE.at, 'the bite: he rises ' + BITE.riseBy + 'px over ' + BITE.rise.toFixed(2) + 's'],
  [BITE_HIT, 'the lunge lands ' + BITE.by + 'px down and ' + Math.abs(BITE.fwd)
    + 'px forward and the head squashes'],
  [VANISH_AT, 'the first frame at or after the landing, and the bug is gone under his ink'],
  [BITE_END, 'he is back up, eyes shut'],
  ...CHEW_HITS.map((t, i) => [t, 'chew ' + (i + 1) + ' of three, '
    + (i % 2 === 0 ? 'left' : 'right')]),
  [CHEW.at + CHEW.pulses * CHEW.for, 'the satisfied bob, ' + CHEW.bob.for.toFixed(2) + 's'],
  [SHUT.until + SHUT.out, 'his eyes are open again'],
  [plan.marks[2].bubble.in, 'the first dot of the bubble'],
  [plan.marks[2].bubble.full, 'crunchy is fully up, and it holds to the cut'],
  [END.at, 'the hit, ' + (END.hard + END.tail).toFixed(2) + 's of it, and he and the bubble are cut'],
  [WM_IN, 'the wordmark snaps in over ' + END.wmFor.toFixed(2) + 's and holds '
    + (SECONDS - WM_IN - END.wmFor).toFixed(2) + 's'],
  [SECONDS, 'end'],
].sort((a, b) => a[0] - b[0]);
for (const [t, what] of beats) console.log('  ' + t.toFixed(2) + 's  ' + what);
console.log('');

/* ---------- the sound ---------- */
const cues = soundCues();
const { buf: sfx, report: sfxReport } = renderSfx(cues, SECONDS);
/* the bite, in its own pass. `renderSfx` sets one gain per kind, which is the
   right shape for a mix where a sound means one thing — so a `crunch` that
   means something else at a different level is a second call summed onto the
   same bus rather than a per cue level, because a per cue level is how a
   balance stops living in one table. post13's argument, unchanged. */
{
  const one = renderSfx([{ t: BITE_HIT, kind: 'crunch', opts: BITE_SND.opts,
    from: 'the bite, on the frame the lunge lands' }],
  SECONDS, { gains: { crunch: BITE_SND.gain } });
  for (let i = 0; i < sfx.length; i++) sfx[i] += one.buf[i];
  sfxReport.push(...one.report);
  cues.push({ t: BITE_HIT, kind: 'crunch', from: 'the bite' });
}
sfxReport.sort((a, b) => a.t - b.t);
cues.sort((a, b) => a.t - b.t);
const WAV = path.join(OUT, 'post15-sfx.wav');
const RAW = path.join(OUT, 'post15-sfx-raw.wav');
fs.mkdirSync(OUT, { recursive: true });
writeWav(RAW, sfx);
const before = loudness(ffmpeg, RAW);
let rawPeak = 0;
for (let i = 0; i < sfx.length; i++) rawPeak = Math.max(rawPeak, Math.abs(sfx[i]));
const rawPeakDb = 20 * Math.log10(rawPeak);
const wanted = before.lufs == null ? 0 : +(TARGET_LUFS - before.lufs).toFixed(2);
const allowed = +(SAMPLE_CEILING - rawPeakDb + LIMIT_ALLOW).toFixed(2);
const lift = Math.min(wanted, allowed);
applyGain(sfx, lift);
const peak = limit(sfx, SAMPLE_CEILING);
writeWav(WAV, sfx);
const after = loudness(ffmpeg, WAV);
fs.rmSync(RAW, { force: true });

console.log('the sound');
console.log(describeMix(sfxReport, {
  'off the synth': (before.lufs == null ? '?' : before.lufs) + ' LUFS, peak ' + rawPeakDb.toFixed(1) + ' dBFS',
  'the lift': TARGET_LUFS + ' LUFS wanted ' + wanted.toFixed(2) + ' dB and the ' + SAMPLE_CEILING
    + ' dBFS ceiling plus ' + LIMIT_ALLOW + ' dB of limiting allowed ' + allowed.toFixed(2)
    + (allowed < wanted ? ', so the ceiling won by ' + (wanted - allowed).toFixed(2) + ' dB'
      : ', so the loudness target won'),
  'the bus': 'lifted ' + lift.toFixed(2) + ' dB to ' + (after.lufs == null ? '?' : after.lufs)
    + ' LUFS, peak ' + peak.peak + ' dBFS, limiter took '
    + (peak.reduction > 0.01 ? peak.reduction.toFixed(2) + ' dB' : 'nothing'),
}));
console.log('');

/* the two new recipes, written out on every run for somebody who can actually
   listen — they are chosen on numbers and nothing in this pipeline can hear.
   they land in demo/out/p15-sound/, which is regenerable and gitignored. */
const SND = path.join(OUT, 'p15-sound');
fs.mkdirSync(SND, { recursive: true });
writeWav(path.join(SND, 'tick.wav'), VOICES.tick());
CRUNCH.forEach((c, i) => writeWav(path.join(SND, 'crunch' + (i + 1) + '.wav'), VOICES.crunch(c.opts)));
console.log('  the tick and the three chews are in ' + path.relative(ROOT, SND)
  + ' for somebody who can listen');
console.log('');

/* ---------- the bug on its own, first ---------- */
if (BUG_ONLY) {
  const box = await renderBugOnly();
  console.log('the bug alone, four stances and a crop, in ' + path.relative(ROOT, path.join(VERIFY, 'bug')));
  console.log('  rendered ink ' + box.wPx + ' x ' + box.hPx + ' device px');
  process.exit(0);
}

const state = ONLY_ENCODE
  ? JSON.parse(fs.readFileSync(path.join(OUT, 'post15.json'), 'utf8'))
  : await render();
const file = encode(WAV);
const p = probe(file);
const lu = loudness(ffmpeg, file);

console.log('rendered');
console.log('  ' + p.w + 'x' + p.h + ' @' + p.fps + 'fps  ' + p.seconds.toFixed(2) + 's  '
  + (p.audio ? 'with sound' : 'SILENT') + '  '
  + (fs.statSync(file).size / 1e6).toFixed(2) + ' MB  ' + path.relative(ROOT, file));
console.log('  the shutter is ' + (BLUR ? 'open, ' + SUB + ' subframes to a frame' : 'closed'));
if (lu && lu.ok) {
  console.log('  loudness ' + lu.lufs + ' LUFS integrated, ' + lu.lra
    + ' LU range, true peak ' + lu.truePeak + ' dBFS, measured on the mp4');
}
if (state.vanish) {
  const v = state.vanish;
  console.log('  on the frame before the bug goes (' + v.t + 's) its ink is '
    + v.bug.w.toFixed(1) + ' x ' + v.bug.h.toFixed(1) + ' css at ' + v.bug.x.toFixed(1)
    + ', ' + v.bug.y.toFixed(1) + ', and his plate is ' + v.plate.w.toFixed(1) + ' x '
    + v.plate.h.toFixed(1) + ' at ' + v.plate.x.toFixed(1) + ', ' + v.plate.y.toFixed(1));
}
if (state.bug) {
  console.log('  the bug as rendered, at its tightest (' + state.bug.t + 's): '
    + state.bug.wPx + ' x ' + state.bug.hPx + ' device px, clear ' + state.bug.left
    + ' left / ' + state.bug.top + ' top / ' + state.bug.right + ' right / '
    + state.bug.bottom + ' bottom');
}
console.log('  a still per beat in ' + path.relative(ROOT, VERIFY)
  + ', and the gait strip in ' + path.relative(ROOT, path.join(VERIFY, 'gait')));

if (!KEEP && !ONLY_ENCODE) {
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.rmSync(SUBS, { recursive: true, force: true });
}

/* ==========================================================================
   the guards
   ========================================================================== */
const fail = [];
const note = [];
const check = (cond, msg) => { (cond ? note : fail).push(msg); };
const floorDev = Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom);

check(p.w === VW * DSF && p.h === VH * DSF, 'the file is ' + p.w + 'x' + p.h);
check(Math.abs(p.fps - FPS) < 0.5, 'the file is ' + p.fps + 'fps');
check(Math.abs(p.seconds - SECONDS) < 0.12,
  'the file runs ' + p.seconds.toFixed(2) + 's against ' + SECONDS.toFixed(2));
check(!!p.audio, 'the sound is muxed');
check(SECONDS >= 5 && SECONDS <= 7.5,
  'the clip runs ' + SECONDS.toFixed(2) + 's — the brief asks for five to seven and this is '
  + (SECONDS - 7).toFixed(2) + 's over the top of it, which is written up at SECONDS');

/* ---------- the bite ---------- */
check(BITEMO.hold <= 1,
  'the bug is under his ink on the frame it goes: the worst corner of its box '
  + 'sits at ' + BITEMO.hold + ' of the head\'s own ellipse, where 1 is the edge. '
  + 'the lunge needed ' + BITEMO.need + 'px and it goes ' + BITEMO.by);
check(BITEMO.step.d < VW / 8,
  'the lunge is a move rather than a cut: worst one frame step ' + BITEMO.step.d
  + 'px at ' + BITEMO.step.t + 's, against an eighth of the frame');
/* the frame the bug goes has to be a frame he is at the bottom of the lunge,
   at whatever rate is rendering and at both the rates this file is run at,
   because a contact shorter than a frame has no such frame in it. */
{
  const inContact = r => {
    const v = Math.ceil(BITE_HIT * r) / r;
    return v >= BITE_HIT - 1e-9 && v <= BITE_HIT + BITE.land + 1e-9;
  };
  check(inContact(FPS) && inContact(60) && inContact(12),
    'the bug goes on a frame his head is at the bottom of its lunge, at twelve ('
    + (Math.ceil(BITE_HIT * 12) / 12).toFixed(4) + 's) and at sixty ('
    + (Math.ceil(BITE_HIT * 60) / 60).toFixed(4) + 's), inside a contact that runs '
    + BITE_HIT.toFixed(4) + ' to ' + (BITE_HIT + BITE.land).toFixed(4));
}
check(Math.abs((BITE_END - BITE.at) - 0.45) < 0.06,
  'the bite runs ' + (BITE_END - BITE.at).toFixed(2) + 's, against the brief\'s 0.4');
check(Math.abs((CHEW_END - CHEW.at) - 1.14) < 0.10,
  'the chew and its bob run ' + (CHEW_END - CHEW.at).toFixed(2)
  + 's, against the brief\'s one second');
check(CHEW_HITS.length === CHEW.pulses,
  'there are ' + CHEW.pulses + ' chewing pulses and ' + CHEW_HITS.length + ' bleeps, one each');
check(CHEW_EYES.sy <= 0.30,
  'his eyes are shut for the whole chew: the taller of the two is ' + CHEW_EYES.sy
  + ' of its own height at the most');
check(CHEW_EYES.px >= 3.5,
  'and shut is a line rather than a missing feature: ' + CHEW_EYES.px
  + ' device px of ink still on the face');

/* no mark may begin while this file is holding the head, for the same reason
   rig-test's marks may not begin inside a grow: two things authoring one head
   over one window resolve by build order, which is not an answer. */
{
  const inside = plan.marks.filter(m => m.t > BITE.at - 0.30 && m.t < CHEW_END + 0.02);
  check(inside.length === 0, 'no mark begins inside the bite or the chew: '
    + (inside.length ? inside.map(m => m.state).join(', ') : 'none of the three do'));
}

/* ---------- the pair ---------- */
check(PAIR.sy.d <= 0.03,
  'the two eyes are the same shape from the frame the bug stops: worst difference '
  + PAIR.sy.d + ' of scale at ' + PAIR.sy.t + 's');
check(PAIR.lid.d <= 0.01,
  'and the same lid: worst difference ' + PAIR.lid.d + ' at ' + PAIR.lid.t + 's');

/* ---------- the camera ---------- */
check(edgePlan.near >= 0,
  'the camera never shows an edge, worked out on every frame: worst ' + edgePlan.near
  + ' css px of overscan at ' + edgePlan.t + 's on z ' + edgePlan.z.toFixed(4));
check(camMo.z.min >= 1.0,
  'the camera never goes under z 1, which is the floor the rig being exactly '
  + 'the stage size sets: min ' + camMo.z.min);
check(camMo.still === 0, 'no frame of the camera repeats the one before it: ' + camMo.still + ' still frames');
check(camMo.worst.move.d < VW / 8,
  'the camera never steps: worst one frame move ' + camMo.worst.move.d + 'px against an eighth of the frame');

/* ---------- the bug ---------- */
check(GAIT.slide < 0.01,
  'no planted foot moves while he walks: worst ' + GAIT.slide + ' page px, at ' + GAIT.slideAt + 's');
check(GAIT.reach < GAIT.limit,
  'no leg is ever asked to be longer than it is: worst demand ' + GAIT.reach
  + ' against a reach of ' + GAIT.limit + ', at ' + GAIT.reachAt + 's');
check(GAIT.strides >= 8,
  'the walk is ' + GAIT.strides + ' strides, which is enough of a cycle to read as one');
check(GAP.over === 0 && GAP.worst > 0,
  'the bug never touches his ink before the grow takes it: closest ' + GAP.worst
  + ' page px at ' + GAP.at + 's, ' + GAP.over + ' frames of overlap');
check(GAIT.ink.lenPx < plan.headPx,
  'the bug is smaller than his head: ' + GAIT.ink.lenPx + ' device px long against '
  + plan.headPx);

/* ---------- what the render measured ---------- */
if (state.edges) {
  const near = Math.min(state.edges.left, state.edges.top, state.edges.right, state.edges.bottom);
  check(near >= 0, 'the camera showed no edge on any of ' + state.edgeSamples
    + ' rendered samples: worst ' + near + ' device px outside the frame at ' + state.edges.t + 's');
}
if (state.bug) {
  check(state.bugInSafe !== null && state.bugInSafe < 0.9,
    'the bug is inside the platform safe area by ' + state.bugInSafe
    + 's, which is what its walk on through the left margin costs');
  check(state.bugLeftSafe.length === 0,
    'and it never leaves it again: ' + state.bugLeftSafe.length
    + ' frames outside a safe line after that, worst air ' + state.bug.air
    + ' device px at ' + state.bug.t + 's');
}
if (state.bubble) {
  check(state.bubble.air >= 0,
    'the bubble clears the safe area on all ' + state.bubbleSamples + ' samples it is up for: '
    + state.bubble.air + ' device px at ' + state.bubble.t + 's');
}
check(state.bandHits.length === 0,
  'nothing enters the reserved caption band at ' + BAND.y + '..' + (BAND.y + BAND.h)
  + ' css: ' + (state.bandHits.length ? state.bandHits.join(', ') : 'no frame does'));
check(!overlaps(state.wm.cssRect, BAND),
  'the wordmark clears the band too: it sits ' + state.wm.cssRect.y.toFixed(0) + '..'
  + (state.wm.cssRect.y + state.wm.cssRect.h).toFixed(0) + ' css');
check(state.built.headPx >= HEAD_PX.min && state.built.headPx <= HEAD_PX.max,
  'the head rendered at ' + state.built.headPx + ' device px, window is '
  + HEAD_PX.min + ' to ' + HEAD_PX.max);
check(state.wm.capPx >= WM.minCapPx,
  'the wordmark caps measure ' + state.wm.capPx + ' device px, floor is ' + WM.minCapPx);
check(Math.min(state.wm.left, state.wm.top, state.wm.right, state.wm.bottom) >= floorDev,
  'the wordmark clears the platform safe area: ' + state.wm.left + ' left, ' + state.wm.top
  + ' top, ' + state.wm.right + ' right, ' + state.wm.bottom + ' bottom, floor ' + floorDev);
if (state.vanish) {
  /* the same containment as the plan's, measured on the rendered boxes rather
     than derived: the plate is a circle so its client rect is its ink, and a
     box inside a circle's box is not a proof, so the corners are tested against
     the circle itself. */
  const v = state.vanish;
  const cx = v.plate.x + v.plate.w / 2, cy = v.plate.y + v.plate.h / 2;
  const a = v.plate.w / 2, b = v.plate.h / 2;
  let worst = 0;
  for (const px of [v.bug.x, v.bug.x + v.bug.w]) {
    for (const py of [v.bug.y, v.bug.y + v.bug.h]) {
      worst = Math.max(worst, Math.hypot((px - cx) / a, (py - cy) / b));
    }
  }
  check(state.bugStill === 0,
    'the bug has not moved between the two frames the containment is measured on: '
    + state.bugStill + ' page px');
  check(worst <= 1,
    'measured on the rendered frames, the bug is inside his plate when it goes: '
    + 'worst corner at ' + worst.toFixed(4) + ' of the circle, where 1 is the edge');
}
{
  const seen = new Set();
  let dupes = 0;
  for (const s of state.sigs) { if (seen.has(s)) dupes++; seen.add(s); }
  check(dupes === 0, 'no two frames of the film are identical: ' + dupes + ' repeats in '
    + state.sigs.length + ' frames');
}

/* ---------- the head, through the camera ---------- */
{
  let worst = null;
  for (let f = 0; f < Math.round(60 * SECONDS); f++) {
    const t = f / 60;
    if (f >= Math.round(END.at * 60)) break;
    const c = cameraFrame(cam, t);
    const sr = rectToScreen(c, headInkRect(headInk(mascotFrame(plan, t), biteZone(t))));
    const air = safeAir(sr);
    const near = Math.min(air.left, air.top, air.right, air.bottom);
    if (!worst || near < worst.near) worst = { t: +t.toFixed(2), near: +near.toFixed(1), ...air, sr };
  }
  check(worst.near >= 0,
    'his head clears the platform safe area on every frame outside the transitions, '
    + 'mapped through the camera: ' + worst.near + ' device px at ' + worst.t + 's ('
    + worst.left + ' left, ' + worst.top + ' top, ' + worst.right + ' right, '
    + worst.bottom + ' bottom)');
  let bandFrames = 0;
  for (let f = 0; f < Math.round(60 * SECONDS); f++) {
    const t = f / 60;
    if (f >= Math.round(END.at * 60)) break;
    const sr = rectToScreen(cameraFrame(cam, t),
      headInkRect(headInk(mascotFrame(plan, t), biteZone(t))));
    if (overlaps(sr, BAND)) bandFrames++;
  }
  check(bandFrames === 0, 'his head never enters the reserved band: ' + bandFrames + ' frames');
}

/* ---------- the rig ---------- */
check(rep60.frozenFrames === 0, 'the face is never frozen: ' + rep60.frozenFrames + ' frames');
check(rep60.maxSquash <= 0.081, 'the squash peaks at ' + (rep60.maxSquash * 100).toFixed(1) + '%');
check(rep60.maxBreathe <= 0.021, 'the breathing peaks at ' + (rep60.maxBreathe * 100).toFixed(2) + '%');
check(!!BLINK, BLINK
  ? 'he blinks once while he is watching it, at ' + BLINK.t.toFixed(2) + 's, '
    + ((BLINK.close + BLINK.hold + BLINK.open) * 1000).toFixed(0) + 'ms of it, inside the curious hold ('
    + BLINK_WINDOW[0].toFixed(2) + ' to ' + BLINK_WINDOW[1].toFixed(2) + ')'
  : 'no idle blink lands while he is watching it — change the seed');

/* ---------- the end ---------- */
{
  const before1 = frameAt((CUT_FRAME - 1) / FPS, CUT_FRAME - 1);
  const on = frameAt(CUT_FRAME / FPS, CUT_FRAME);
  check(before1.mo === 1 && on.mo === 0 && on.wm.o > 0,
    'the wordmark is born on the frame he is cut: he is on at frame ' + (CUT_FRAME - 1)
    + ' and gone at ' + CUT_FRAME + ', where the wordmark is already at ' + on.wm.o);
}
check(GL_WINDOWS_60.length === 1,
  'there is exactly one glitch in the clip, ' + GL_WINDOWS_60[0].frames + ' frames of it at sixty');
{
  /* read off the cue list rather than off the report: `renderSfx` rounds a cue
     time to a thousandth for its table, and a cue placed **on** the frame the
     white ends rounds to a number a shade under it. a guard that reads a
     rounded number is a guard about the printing. */
  const late = cues.filter(c => c.t > END.at + 1e-6);
  check(late.length === 0, 'nothing is heard after the cut: ' + late.length + ' cues past ' + END.at + 's');
  /* between the bug stopping and the bubble, the only sounds are the bite and
     the three chews, in that order. a tick or a pop in there would mean the
     walk or the bubble had drifted into the eating. */
  const eating = cues.filter(c => c.t >= WALK.t1 && c.t < plan.marks[2].bubble.in);
  check(eating.length === 4 && eating.every(c => c.kind === 'crunch'),
    'the only sounds between the bug stopping and the bubble are the bite and '
    + 'the three chews: ' + eating.map(c => c.kind).join(', '));
}
check(peak.reduction <= LIMIT_ALLOW + 0.3,
  'the limiter took ' + peak.reduction.toFixed(2) + ' dB, allowance is ' + LIMIT_ALLOW);

console.log('');
for (const m of note) console.log('  ok    ' + m);
for (const m of fail) console.log('  FAIL  ' + m);
console.log('');
console.log(fail.length ? '  ' + fail.length + ' GUARD(S) FAILED' : '  all ' + note.length + ' guards green');
process.exit(fail.length ? 1 : 0);
