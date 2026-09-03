/* the boring tek — post16, one small change. a client asks for one small
   change, then forty seven more.

     node post16.mjs                      1080x1920, 60fps, dark
     DEMO_FPS=12 node post16.mjs          the fast preview pass
     node post16.mjs --blur               60fps with the shutter open
     node post16.mjs --field              the reveal frame and one label, as
                                          stills, no video
     node post16.mjs --encode-only        re-encode from kept frames

   out to demo/out/post16-dark-1080x1920.mp4.

   post15 is the template: dark, short, the mascot inside `lib/camera.mjs`,
   post12's ending on the back of it. **the new thing here is that the camera
   pulls back rather than pushing in, and what it pulls back to is a wall of
   copy.** four things fell out of that and they are the interesting part of
   this file.

   ---------- the punchline is a zoom out, and that inverts the rig ----------

   every camera in demo/ so far pushes in: a push is a close, and a close is
   what a punchline you can point at wants. this one is the opposite shape. the
   joke is not a thing you get nearer to, it is the **amount of it**, and the
   only way a frame says "there are forty seven of these" is to stop looking at
   one.

   so the clip opens pushed in on him at z 1.30 with a single label beside his
   head, and the hit snaps out to z 1.02. `lib/camera.mjs` does the whole move
   as a `snap` with a `by` **under one**, which the module already allows and
   nothing in it had ever asked for: `by` is a multiplier, so 0.78 is a snap
   out for exactly the same reason 1.22 is a snap in.

   **the anticipation is negative, and that is arithmetic rather than a trick.**
   the module writes the wind-up as `sz = 1 - anticipate`, so a positive number
   pulls back before a push in. the wind-up for a *pull back* is a push in, so
   the number is negative and the same three beats land: cram in for a tenth of
   a second, rip out, let `btk.pop`'s own overshoot go a touch too wide and
   come back. nothing in `lib/camera.mjs` is touched.

   ---------- `__cam.edges()` is the wrong instrument for this clip ----------

   post15's camera guard is `minZoomFor` and `__cam.edges()`, and both of them
   answer the same question: the rig is exactly the stage's size, so at z under
   one a border comes into shot. that is why post15's zoom never leaves 1.

   this clip's zoom **does** go under one — 0.988 at the overshoot, 0.978 with
   the drift on it — and no border comes into shot, because the thing filling
   the frame is not the rig, it is the label field, and **the field is laid out
   bigger than the page on purpose**. so `edges`, which measures `#cam-rig`'s
   own box and knows nothing about content hanging outside it, would report a
   fault on every frame of the reveal and be wrong about all of them.

   what replaces it is a measurement of the field itself: `__p16.fieldBox()`
   reads the rendered envelope of every pill on the screen, and the guard is
   that the envelope contains the frame on every frame the field is up. that is
   the same argument in the units this composition actually has.

   ---------- forty seven does not fit at phone size, and the file says so ----

   the brief allows fewer and asks for the number. the number is **forty seven,
   and it fits at a 24 device px cap** — which is under `BUBBLE.minCap`, the
   32 px floor `lib/mascot.mjs` puts on the one piece of copy in its layer.

   that is a deliberate exception with a real argument behind it, and it is the
   only place in this file where a house floor is crossed. the copy is read
   **once, big** — the hero label is a 32 px cap over his head for two and a
   half seconds before the field exists — so the field is recognition rather
   than reading. a reader who has to decode one of forty seven identical pills
   has already been given the string. the floor exists for a caption seen for
   the first time; this is the same words again.

   the arithmetic is in `fieldFit`, and it is a solve rather than a guess: the
   core rect is the frame's own tightest visible window minus the reserved
   caption band, the grid is four columns by twelve rows, and the type size is
   the largest one whose pill still tiles that grid at the allowed overlap. at
   forty seven that is about 17 css px, which is a 24 px cap. **at thirty two
   labels it would be 28 px and at twenty four it would be 36**, and those two
   numbers are printed on every run so the trade is visible rather than
   asserted. the count is one constant.

   the copy being two lines rather than one is part of the same solve. one line
   of "one small change" is 850 units wide at font size 100 against a pill 217
   tall, and a 9:1 ribbon does not tile a rectangle three times as tall as it is
   wide: broken over two lines the pill is 1.8:1 and the same forty seven fit at
   a third again the type size.

   ---------- the field is two populations and only one of them is counted ----

   `btk.pop` overshoots 10% past its mark, so the widest frame of the reveal is
   wider than the frame it settles on, and the shake moves the whole picture
   nine css px on top of that. a field laid out to the resting frame would open
   a strip with no labels in it for the three frames of the overshoot.

   so the grid is extended outward until the labels reach past the widest frame
   the plan can produce — left, right and down, but **not up**, because the top
   of this frame is the caption band's and a row of pills clipped by the top of
   the picture is not a fourth side, it is a mistake. every label is classified
   rather than placed by hand. **core** labels are the forty seven that are fully inside the frame on
   every frame after the shake is over — those are the ones the count is about
   and the ones the legibility floor is measured on. **bleed** labels are the
   ring outside them, which exist so the overshoot and the shake never open an
   empty edge, and they are neither counted nor guarded for legibility. the
   report prints both numbers and says which is which.

   ---------- the caption band is reserved, and here it has to be ----------

   post15 reserved a band with nothing in it. this clip **puts words in it**,
   and the band is what stops a screen deliberately covered in copy from
   covering the one line that has to be read.

   it is a **screen** band rather than a page band, because the camera means
   the two are different things: a strip of the frame is a strip of the frame,
   and the page rectangle behind it is a different rectangle at every zoom. so
   the band is in screen css px, and the field's top edge is derived by walking
   every frame the field is up, mapping the band back through `cameraFrame` into
   page space, and taking the union. nothing about it is typed.

   `planMascot` is handed `band: null` for the same reason — the module checks a
   bubble against a page rectangle and this clip has no module bubble in it, so
   handing it a screen band would be handing it the wrong units.

   ---------- and some of them are in front of him ----------

   the brief asks for labels behind him and labels over him. that is two
   wrappers at two z-indexes inside the rig, and one rule: **a label in front
   may cover his plate and may not cover his face.** his eyes go flat and he
   blinks once slowly, and a pill over either of those is the performance
   deleted.

   which labels those are is derived, not chosen, and there is no share and no
   coin flip in it. **front and back is only a visible difference for a label
   that reaches him at all**, so those are the front layer and everything else
   is behind him. of the ones that reach him, any whose box ever touches his eye
   or brow ink goes behind him instead.

   both windows are composed here on the module's own numbers — the grid
   geometry, then the card's rotate and scale about the zone's centre — and
   walked over every frame the field is up rather than taken at rest, because
   `unimpressed` sinks him and drifts him away while the idle layer never stops.
   the guard re-measures the rule and the counts are printed.
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
  STATES, STAGE, SAFE, HEAD_PX, HEAD, GRID, EYE_CX, BUBBLE,
} from './lib/mascot.mjs';
import {
  planCamera, cameraFrame, cameraMotion, cameraCss, cameraMarkup, cameraRuntime,
  visibleRect, minZoomFor, describeCamera,
} from './lib/camera.mjs';
import {
  renderSfx, writeWav, applyGain, limit, loudness, describeMix, VOICES,
} from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post16');
const SUBS = path.join(OUT, 'subframes-post16');
const VERIFY = path.join(OUT, 'verify-post16');

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
const FIELD_ONLY = argv.includes('--field');
const BLUR = argv.some(a => a.startsWith('--blur'));
const BLUR_ARG = (argv.find(a => a.startsWith('--blur')) || '').split('=')[1];
const SUB = BLUR ? Math.max(2, Math.min(12, Number(BLUR_ARG) || 4)) : 1;
const SUBSTEP = STEP / SUB;

/* ---------- the clip's own clock ----------
   5.95s, and it is written from the two constraints inward. the brief asks for
   five to six seconds and for **about a second of calm** before the hit, and
   `lib/mascot.mjs`'s own floors decide the rest: a mark needs its entrance, a
   hold and its exit, so `curious` needs 1.24s of room and `agreeing` 1.08.

   the front of the clip is therefore not compressible past what it is. the
   label arrives at 0.24, he is curious at 0.28 and settled at 0.88, he agrees
   at 1.54 and is settled at 2.02, and the hit is at 2.94 — 0.92s of him
   sitting there pleased about it, which is the calm the brief asks for and is
   the whole setup.

   behind the hit, one thing fixes the rest: **he may not start going flat until
   the camera has stopped**, and one thing was cut after a review pass — see GLA.
    the snap's wind-up and pull are 0.40s and the knock
   is 0.34, so the mark cannot be before 3.34, and it is at 3.40. everything
   after it follows — 0.64s of going flat, a slow blink off the idle layer, and
   then post12's ending with the build up taken off it. two faults rather than
   one, because the brief asks for two things to happen: he goes and the labels
   stay, then the labels go and the wordmark arrives. */
const SECONDS = 5.70;

/* ---------- where he stands ----------
   centred, and the module's corner arithmetic is not used: `planMascot` places
   a corner mascot and this clip has him in the middle of the frame, so the box
   is written over the way post13 writes it. `bias: 0` goes with it — the
   resting turn exists so a mascot in a corner looks into the frame, and there
   is nothing to look into from the middle.

   `SIZE` is 132 css px, which puts the plate at 247.5 device px, in the middle
   of `HEAD_PX`'s 220 to 280 window with room either side. the camera is over
   it at both ends of the clip, so what a viewer sees is 322 device px at the
   start and 252 at the end, and the guard reads the module's own page space
   number rather than either of those. */
const SIZE = 132;
/* the middle of the **safe band** rather than of the frame, which is post12's
   line: the platforms take more off the bottom than the top. */
const CENTRE_Y = (SAFE_CSS.top + (VH - SAFE_CSS.bottom)) / 2;

/* ---------- the cut ----------
   three marks and no `neutral` at the top, which is post15's argument: before
   the first mark every pose channel is at rest and the idle layer is running,
   which is `neutral` being held.

   `curious` is him seeing the label. the turn is held toward it — the label
   hangs off his crown to screen right, and a head that noticed something and
   did not turn toward it noticed nothing.

   `agreeing` is the yes. two nods with weight on the way down and a warm half
   blink on the beat, and it keeps the turn `curious` left it at, because the
   turn is where he is facing and the label has not moved.

   `unimpressed` is after the reveal, and it is the right state here in a way
   it was the wrong one in post15: the lids at half, the brows low and turned
   out, the sink and the drift away are not "a face concentrating", they are a
   face that has read the room. the turn comes **back to zero** on this one, so
   the last thing he does before the frame breaks is look straight down the
   lens. that is the joke landing on the viewer rather than on the label. */
const CUT = {
  marks: [
    { t: 0.28, state: 'curious', turn: 0.30, turnFor: 0.55 },
    { t: 1.54, state: 'agreeing' },
    /* 3.40 rather than 3.24, and a rendered pass is what moved it: the snap
       finishes at 3.34 and the knock at 3.28, and a state change under a camera
       that is still pulling back is two moves at once. the guards below check
       both, so this number cannot drift back. */
    { t: 3.40, state: 'unimpressed', turn: 0, turnFor: 0.50 },
  ],
  seconds: SECONDS,
};

/* ---------- the hit ----------
   one instant, and five things happen on it: the camera's snap begins, the
   shake begins, the field is born, the hero label is cut and the top line
   changes. it is one frame index rather than five times, so nothing in the
   reveal can be a frame apart from anything else in it. */
const HIT = 2.94;

/* ---------- the camera ----------
   one snap and no legs. the start is the shot and the snap is the move, which
   is the shape a punchline has: nothing about the framing changes for the first
   three seconds because nothing about the situation does.

   the zoom window is 0.90 to 1.40 rather than the 1.0 floor post15 used, and
   the reason is in the header: the floor is a property of the rig being the
   stage's own size, and what fills this frame is a field laid out past it. */
const CAM = {
  /* 1.50, and it is the largest start zoom the hero label leaves room for.
     the reveal is the whole punchline and its size is the ratio of these two
     numbers: at 1.30 the frame opens up by 1.62 in area and a rendered pass
     read as the labels arriving rather than as the camera pulling back. at 1.50
     it is 2.16 and it reads as both. it is bounded above by the label, which
     has to fit between the caption band and his crown at this zoom — see
     HEAD_DROP, which is the arithmetic, and which comes out at nothing here. */
  start: { cx: VW / 2, cy: CENTRE_Y, z: 1.50 },
  /* the destination, as a zoom rather than as a multiplier, because that is the
     number a framing argument is had in. `by` is derived off it below. */
  to: 1.02,
  snap: { anticipate: -0.035, anticipateFor: 0.10, for: 0.30 },
  /* the knock. short, because the brief says short: 0.34s, which is twenty
     frames at sixty and is over before he starts going flat. `rot` is zero
     deliberately — a rotation in the shake would turn the field's own edge
     into the frame at the corners, and the field is what is holding the frame
     together at that moment. */
  shake: { for: 0.34, amp: 9, ratio: 0.55, rot: 0, freq: 26, decay: 3.6, seed: 0x16b0a7 },
};

/* ---------- the type ----------
   measured on the rendered faces at font size 100 rather than estimated off an
   em ratio, because Space Grotesk is proportional and Michroma's tracking is
   nearly a fifth of an em. `mascot-export.mjs` learned this and post13 learned
   it again; the numbers below came off a probe page and the guards re-measure
   every one of them on every run, so a font that failed to load or a metric
   that moved cannot quietly break a layout that was solved against it.

   the two line pill is the label. `advTwo` is the widest of its two lines and
   the padding ratios are `BUBBLE`'s own — 22 and 12 against a 26px size — so
   the pill is the module's pill at another size rather than a second design. */
const TYPE = {
  advTwo: 4.585,          /* "one small" at font size 1, the widest of the two */
  advOne: 8.4981,         /* "one small change" on one line, for the record */
  lineH: 1.25,
  padX: BUBBLE.padX / BUBBLE.size,     /* 0.846 */
  padY: BUBBLE.padY / BUBBLE.size,     /* 0.462 */
  capRatio: BUBBLE.capRatio,           /* 0.70, and the probe measured 0.70 */
  stroke: BUBBLE.stroke,               /* 2 css px, the module's own outline */
  /* michroma, for the top line and the wordmark. the widest line of each block,
     at font size 1, with .18em of tracking and the .09em indent on it. */
  mich: { tx1: 13.8211, tx2: 14.2367, wm: 6.7453, lineH: 1.16, capRatio: 0.75 },
};
const pillW = F => TYPE.advTwo * F + 2 * TYPE.padX * F + 2 * TYPE.stroke;
const pillH = F => 2 * TYPE.lineH * F + 2 * TYPE.padY * F + 2 * TYPE.stroke;

/* the copy. two lines in the pill, because a two line pill is very nearly
   square and a square packs where a 9:1 ribbon does not — one line of "one
   small change" is 850 units wide at font size 100 and would put the field's
   type size under twelve. it still reads the string. */
const LABEL = { lines: ['one small', 'change'], text: 'one small change' };

/* ---------- the hero label ----------
   the one the whole setup is about. it is **this file's pill rather than the
   module's thought bubble**, and that is the brief: a rounded pill with the
   bubble's own outline, standing alone, with no dots climbing off his head to
   it. so it is drawn here, in the same tokens the module's pill uses — the
   page colour as the fill, the site's `--bub` as the outline, the face colour
   as the ink — with one thing added that the module's bubble deliberately does
   not have: **a glow**. `lib/mascot.mjs` keeps its bubble outside the glow
   layers on purpose, because a thought is a sibling of the head rather than a
   part of it. the brief asks for the labels to be lit the way he is, and once
   forty seven of them are the picture they are the thing being lit.

   its size is the one number in the clip held **above** the module's floor:
   32.2 device px of cap against `BUBBLE.minCap`'s 32. that is what buys the
   field the argument in the header.

   where it sits is derived off two edges rather than typed: its right side sits
   `rightAir` inside the right safe line at the start zoom, and its bottom sits
   `gap` above the highest his lit ink ever gets. move him, resize him or change
   the start zoom and it follows. */
/* `gap` is off his **ink** rather than off his light, and that is what makes
   the push in possible at all. the glow reaches sixty css px and a pill held
   clear of the whole halo needs the head's own diameter again of empty frame
   above it, which at any real start zoom is not there. the module's own thought
   bubble sits five css px off the plate — it is a sibling of the card, not a
   thing keeping its distance from it — so twenty two off the ink is generous by
   the house's own measure, and it puts the pill in the outer glow, which is
   where a lit label on a lit head belongs. */
const HERO = { at: 0.24, for: 0.28, size: 23, rightAir: 18, gap: 22, topGap: 12, riseBy: 14 };

/* ---------- the field ----------
   `n` is the count and it is the only number here that is a decision rather
   than a solve. everything else falls out of it and out of the frame. see the
   header for what it costs and what the alternatives measure. */
const FIELD = {
  n: 47,
  cols: 4, rows: 12,
  /* 4% across and 14% down, and both numbers came off a sweep of rendered
     frames rather than off taste. the asymmetry is the aspect: the pill is a
     little under twice as wide as it is tall, so the grid has three times as
     many rows as columns and the rows are where the room runs out.

     down is the number that was actually argued. at 18% the type solves a whole
     device pixel bigger and the ink covers 100% of the core rect, and a rendered
     pass showed what that costs: the worst placed pill had the bottom half of
     its second line under the pill below it. at 14% the type is a 25px cap, the
     ink covers 92%, and the mean pill shows 91% of itself. an overlap is not a
     compromise here — the brief asks for overlapping — but it is bounded,
     because two identical pills stacked half over each other are one unreadable
     pill. 10% was also measured: 24px, 85%, and no denser a read for it. */
  overlapX: 0.04, overlapY: 0.14,
  /* every pill is turned, and none of them is turned level: the magnitude is
     seeded between a third of this and all of it, so the field never has a row
     in it that reads as a row. */
  rot: 3.5,
  jitterX: 16, jitterY: 8,
  /* how far a core pill must stay inside the frame, and how far the field must
     stay under the caption band. */
  inset: 8, bandGap: 10,
  /* how much air a pill in front must leave around his eye and brow ink, and
     how much of his own light counts as "over him". */
  faceClear: 9, litSlack: 14,
  /* and the floor the core pills' cap is held to. it is under BUBBLE.minCap and
     the header says why; it is a named number rather than a silence. */
  minCapPx: 24,
  seed: 0x2f0a47,
};

/* ---------- the top line ----------
   michroma, two lines, tracked, glowing, in screen space outside the camera —
   post13's label with post15's placement discipline. the old line is cut on
   the hit frame and the new one lands 0.20s later, both hard rather than
   faded — see the note on `back` for what that delay is worth and why a cross
   fade in the middle of a bass hit is two things politely taking turns.

   both blocks are fitted to the **same** width, off the wider of the two, so
   the swap does not change the size of the type. */
const TEXT = {
  one: ['client said', 'one small change'],
  two: ['47 small changes', 'later'],
  w: 300,                /* css px, the widest line. 600 device */
  in: 0.56, for: 0.24,
  /* ---------- and the new line lands 0.20s after the old one is cut ---------
     the first cut swapped them on the hit frame, and it cost the field 98 page
     px of height. a strip of the frame is a different page rectangle at every
     zoom, so the band's page union is taken over every frame a caption is up —
     and with a caption up during the wind-up, when the camera is still pushed
     in at 1.55, that union reaches down to page 273 and the field has to start
     under it. held off until the frame has very nearly settled, the union stops
     at 175 and the field starts there instead. the type went from a 22.4 device
     px cap to a 24.

     it is also the better beat. the hit knocks the words off, the frame rips
     out, and the new words land as it settles: two hundred milliseconds with no
     caption, under a bass hit and a shake and forty seven labels arriving, is
     not a gap anybody sees. what it is not is a cross fade in the middle of a
     bass hit, which is two things politely taking turns. */
  back: 0.20,
  minCapPx: 28,
  pad: 14,               /* css px of band around the block */
};
/* the block, and then the band, both derived off the measured face. */
const TEXT_SIZE = +(TEXT.w / TYPE.mich.tx2).toFixed(3);
const TEXT_H = +(2 * TYPE.mich.lineH * TEXT_SIZE).toFixed(2);
const TEXT_Y = +(SAFE_CSS.top + TEXT.pad + TEXT_H / 2).toFixed(2);
/* the reserved band, in **screen** css px. see the header for why it is not a
   page rectangle. it is the full safe width rather than the block's own width,
   because a pill sliding under a shake is a pill that was never beside the
   words in the first place. */
const BAND = {
  x: SAFE_CSS.left, y: SAFE_CSS.top,
  w: VW - SAFE_CSS.left - SAFE_CSS.right,
  h: +(TEXT_H + TEXT.pad * 2).toFixed(2),
};

/* ---------- the end ----------
   two faults. the first takes him and leaves the field, which is the joke's
   last line: the work outlives the person doing it. the second takes the field
   and puts the wordmark up.

   both are post12's glitch table at full heat with the build up taken off, and
   both are quantised to the grid that is rendering — post11's rule and post12's
   note. the wordmark is born on the **frame** the field is cut rather than at
   the time, which is post13's correction: a cut time that rounds down would put
   an empty frame between the two. */
/* 4.70 rather than 4.98, and the video-review pass is why. at 4.98 the stretch
   between the camera stopping and the first fault was 1.64s, with the drift, his
   sink into `unimpressed` and one blink in it and a completely static field
   behind all three — a quarter of a six second clip on one frame. the wall still
   gets 2.10s to be read, which is more than enough for a phrase the viewer has
   already been given once, and the blink now ends 0.18s before the fault rather
   than 0.64s before it. the seed search moved with it and found a slower blink
   than it had. */
const GLA = { at: 4.70, for: 0.22 };
const GLB = { at: 5.04, for: 0.34, wmFor: 0.09 };
const REVEAL_FRAME = Math.ceil(HIT * FPS);
const REVEAL_AT = +(REVEAL_FRAME / FPS).toFixed(4);
const TX2_FRAME = Math.round((HIT + TEXT.back) * FPS);
const TX2_AT = +(TX2_FRAME / FPS).toFixed(4);
const HIM_CUT_FRAME = Math.round(GLA.at * FPS);
const FIELD_CUT_FRAME = Math.round(GLB.at * FPS);
const WM_IN = (FIELD_CUT_FRAME - 1) / FPS;
/* the shake is over here, and it is where the core labels start having to be
   inside the frame. during a knock the edges of the picture move, and a pill
   sliding off the side of a frame that is being hit is what a knock looks
   like. */
const SHAKE_END = +(HIT + CAM.shake.for).toFixed(4);
/* and the whole camera move is over here, and it is the second one that
   matters. **a rendered pass is why these are two constants.** the core labels
   start having to be inside the frame once the frame has stopped moving, and
   the frame does not stop when the knock does: `btk.pop` carries the snap a
   fifth of the way past its mark and back, so between 3.28 and 3.34 the zoom is
   still under its resting value and the picture is still wider than it ends up.
   sized off the knock, the "tightest frame" came out 546 css px wide against a
   resting frame of 524, and the core rect it sized was wider than the frame it
   is supposed to fit inside.

   during a knock the edges of the picture move, and a pill sliding off the side
   of a frame that is being hit is what a knock looks like. after the camera has
   stopped, it is a fault. */
const SNAP_END = +(HIT + CAM.snap.anticipateFor + CAM.snap.for).toFixed(4);
const SETTLED = +Math.max(SHAKE_END, SNAP_END).toFixed(4);

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
   post15's, unchanged: three lines, centred on the middle of the safe band, in
   michroma, fitted in the page rather than guessed. no domain under it, which
   is the brief. */
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: TYPE.mich.lineH, minCapPx: 56 };

/* crf 17, post12's, post13's and post15's: this frame is nearly all flat black
   with soft glows across it, which is exactly what a codec bands, and there is
   no film grain here to dither it. */
const CRF = 17;

/* ---------- the mix ----------
   post15's rig. five events on silence, so the peak ceiling is the likely
   winner and both numbers are printed either way. */
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
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
/* the tolerance is not slack, it is arithmetic: a rect clamped **to** another
   rect's own edge is computed as `x - w/2 + w`, which is not bit identical to
   `x`, and two core labels failed an exact comparison by three parts in ten to
   the fifteenth. a hundredth of a css px is a fiftieth of a device pixel. */
const inside = (a, b, e = 0.01) => a.x >= b.x - e && a.y >= b.y - e
  && a.x + a.w <= b.x + b.w + e && a.y + a.h <= b.y + b.h + e;
const inflate = (r, p) => ({ x: r.x - p, y: r.y - p, w: r.w + p * 2, h: r.h + p * 2 });

function prng(seed) {
  let x = seed | 0 || 0x1a2b3c;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x |= 0; return (x >>> 0) / 4294967296; };
}

/* ==========================================================================
   the mascot
   ========================================================================== */

/* ---------- the seed is the slow blink ----------
   the brief's beat after the reveal is "his eyes go flat, one slow blink", and
   the flat is `unimpressed` and the blink is not. that state does have a slow
   blink written into its own hold, at 0.86 of it, which here lands at 4.72 —
   twenty hundredths before the first fault, half torn off by it.

   so the blink comes off the layer that already makes blinks, which is post13's
   move: `blinkPlan` generates the idle schedule from the plan's seed, every
   blink carrying its own close, hold and open, and the seed decides when they
   land and how long they take. this searches for a seed with **exactly one**
   blink inside the window and takes the slowest one it finds, so the beat is
   the mascot's own blink rather than a channel this file writes.

   the window opens after `unimpressed` has settled and closes before the first
   fault, and both ends are read off the plan rather than typed. */
const BLINK_WINDOW = [
  +(CUT.marks[2].t + STATES.unimpressed.entry + 0.10).toFixed(4),
  +(GLA.at - 0.18).toFixed(4),
];
function pickSeed() {
  let best = null;
  for (let s = 1; s <= 6000; s++) {
    let pl;
    try {
      pl = planMascot({ marks: CUT.marks, seconds: CUT.seconds, theme: 'dark',
        size: SIZE, bias: 0, band: null, seed: s });
    } catch (err) { continue; }
    const inWin = pl.idle.blinks.filter(b => b.t >= BLINK_WINDOW[0] && b.t <= BLINK_WINDOW[1]);
    if (inWin.length !== 1) continue;
    const b = inWin[0];
    const len = b.close + b.hold + b.open;
    if (!best || len > best.len) best = { seed: s, blink: b, len: +len.toFixed(4) };
  }
  if (!best) throw new Error('no seed in six thousand puts exactly one idle blink inside the flat beat');
  return best;
}
const SEED = pickSeed();

const plan = planMascot({
  marks: CUT.marks, seconds: CUT.seconds, theme: 'dark',
  size: SIZE,
  /* dead straight on. see the note at CUT. */
  bias: 0,
  /* **null on purpose.** the module checks its own thought bubble against a
     page rectangle and this clip has no module bubble in it; the band it does
     have is a screen rectangle, checked in this file, and handing that to
     `planMascot` would be handing it the wrong units. see the header. */
  band: null,
  seed: SEED.seed,
});
/* centred, in the middle of the safe band. post13's two lines, and the module
   owns everything about the head except where the box is put.

   the drop on `top` is added below, once there is something to measure it
   against: at the start zoom a centred head does not leave the hero label its
   own height between the caption band and his light, and moving the camera down
   with him would change nothing, because everything on screen is his position
   relative to the camera. so **he moves and the camera does not**. */
const halfBox = (GRID / 2) * plan.unit;
plan.box = {
  left: +(VW / 2 - halfBox).toFixed(2),
  top: +(CENTRE_Y - halfBox).toFixed(2),
  size: SIZE,
};

/* ---------- how far he sits under the middle, and why ----------
   the hero label has to fit between the bottom of the caption band and the top
   of his crown, at the **start** zoom, which is the tightest the frame ever is.
   this is the number that guarantees it, and at what this clip ships it comes
   out at **nothing**: a centred head at z 1.50 already leaves the label its own
   height with twenty px to spare, once the gap is measured off his ink rather
   than off his sixty pixel halo.

   it stays in the file rather than being deleted for being zero, because it is
   what bounds the start zoom, and the start zoom is the size of the punchline.
   push in further and this goes positive and says by how much.

   his ink's own offset inside the box is invariant under a translation, so it is
   measured once here on the centred box and the box is moved after. */
const HEAD_DROP = (() => {
  const z = CAM.start.z;
  let inkTop = Infinity;
  for (let f = 0; f <= Math.ceil((HERO.at + HERO.for) * 60); f++) {
    inkTop = Math.min(inkTop, headPageRect(mascotFrame(plan, f / 60)).rect.y);
  }
  /* the screen row his crown may not come above, at the start zoom. */
  const needScreen = BAND.y + BAND.h + HERO.topGap + pillH(HERO.size) * z + HERO.gap;
  const haveScreen = (inkTop - CAM.start.cy) * z + VH / 2;
  const d = Math.max(0, (needScreen - haveScreen) / z);
  return { d: +d.toFixed(2), inkTop: +inkTop.toFixed(2), need: +needScreen.toFixed(1), have: +haveScreen.toFixed(1) };
})();
plan.box = { ...plan.box, top: +(plan.box.top + HEAD_DROP.d).toFixed(2) };

/* the plate's own centre and radius in page space, off the module's geometry
   rather than off a number typed here. */
const PLATE = {
  cx: plan.box.left + (HEAD.plate.x + HEAD.plate.s / 2) * plan.unit,
  cy: plan.box.top + (HEAD.plate.y + HEAD.plate.s / 2) * plan.unit,
  r: HEAD.plate.s / 2 * plan.unit,
};

/* the blink the seed was chosen for, read off the finished plan rather than off
   the search, so the still, the sound and the guard all look at the blink the
   render actually draws. */
const BLINK = plan.idle.blinks.find(b => b.t >= BLINK_WINDOW[0] && b.t <= BLINK_WINDOW[1]);
/* the middle of its shut, which is where the sad bleep goes and where the still
   is taken. */
const BLINK_AT = +(BLINK.t + BLINK.close + BLINK.hold / 2).toFixed(4);

/* ---------- where the face ink is, in page space ----------
   `headRect` answers in device px from each border and knows nothing about the
   card's own transform being composed with anything; this needs the eyes and
   the brows specifically, because the rule for a label in front of him is about
   his face rather than about his head.

   the module draws every feature at a grid point inside the zone and then moves
   the whole card — translate, rotate, scale, about the zone's own centre. so
   the composition is done here on the same numbers, which is post15's argument
   for `headInk`: a clearance and a picture must not be able to disagree. */
function facePoint(mas, gx, gy) {
  const u = plan.unit;
  const cx0 = plan.box.left + SIZE / 2, cy0 = plan.box.top + SIZE / 2;
  const lx = gx * u - SIZE / 2, ly = gy * u - SIZE / 2;
  const sx = lx * mas.card.sx, sy = ly * mas.card.sy;
  const th = mas.card.rot * Math.PI / 180;
  const c = Math.cos(th), s = Math.sin(th);
  return {
    x: cx0 + mas.card.x + sx * c - sy * s,
    y: cy0 + mas.card.y + sx * s + sy * c,
  };
}
function boxOf(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) {
    x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
/* the eye and brow ink together, as one page rect. the brows are in it because
   `unimpressed` is the one state in this clip that uses them, and a pill over a
   brow is a pill over the half of the expression that is doing the work. */
function faceRect(mas) {
  const pts = [];
  for (let k = 0; k < 2; k++) {
    const e = mas.eyes[k], b = mas.brows[k];
    const ex = EYE_CX[k] + e.x, ey = HEAD.eye.cy + e.y;
    const ehw = HEAD.eye.w / 2 * Math.abs(e.sx), ehh = HEAD.eye.h / 2 * Math.abs(e.sy);
    for (const ax of [ex - ehw, ex + ehw]) for (const ay of [ey - ehh, ey + ehh]) pts.push(facePoint(mas, ax, ay));
    /* the brow rides its own eye and the module hands back its offset; its
       resting row is `HEAD.brow.cy`. it is included whatever its opacity is,
       because a rule about where a pill may go should not change with a fade. */
    const bx = EYE_CX[k] + (b.x != null ? b.x : e.x), by = HEAD.brow.cy + (b.y != null ? b.y : 0);
    for (const ax of [bx - HEAD.brow.w / 2, bx + HEAD.brow.w / 2]) {
      for (const ay of [by - HEAD.brow.h / 2, by + HEAD.brow.h / 2]) pts.push(facePoint(mas, ax, ay));
    }
  }
  return inflate(boxOf(pts), FIELD.faceClear);
}
/* the head's ink as a page rect, off `headRect` so the plate's radius is the
   module's rather than this file's, plus how far the glow reaches. */
function headPageRect(fr) {
  const r = headRect(plan, fr);
  return {
    rect: {
      x: r.left / DSF, y: r.top / DSF,
      w: VW - r.right / DSF - r.left / DSF,
      h: VH - r.bottom / DSF - r.top / DSF,
    },
    glow: r.glowReach / DSF,
  };
}

/* ==========================================================================
   the camera
   ========================================================================== */

/* `by` is a multiplier and the destination is a zoom, so this is the one line
   that turns one into the other. under one, which is the whole inversion. */
const SNAP_BY = +(CAM.to / CAM.start.z).toFixed(6);

const cam = planCamera({
  mode: 'free', stage: STAGE, seconds: SECONDS,
  /* 0.85 to 1.60, and the ceiling is not decoration. `resolveCamera` runs the
     start through `fitTarget`, which **clamps it to this window and says
     nothing**: at a ceiling of 1.40 a start of 1.50 was quietly rendered at
     1.40, which put the resting zoom at 0.95 instead of 1.02 and sized the
     whole field against a frame 42 css px wider than the one it ships. the
     guard below re-reads `cam.start.z` off the resolved plan for exactly that
     reason. */
  zoom: { min: 0.85, max: 1.60 },
  start: CAM.start,
  snaps: [{
    at: HIT, by: SNAP_BY,
    anticipate: CAM.snap.anticipate, anticipateFor: CAM.snap.anticipateFor,
    for: CAM.snap.for, back: false,
    why: 'the snap out, on the wall of it, and the wind-up is a push in',
  }],
  shakes: [{ at: HIT, ...CAM.shake, why: 'the bass hit, and it is short' }],
});

/* the camera's transform applied to a page point and to a page rect, so a guard
   can ask where something actually is on the screen. it is `cameraFrame`'s own
   two numbers and nothing else — the same string the page writes. */
function toScreen(c, x, y) { return { x: x * c.z + c.tx, y: y * c.z + c.ty }; }
function rectToScreen(c, r) {
  const a = toScreen(c, r.x, r.y), b = toScreen(c, r.x + r.w, r.y + r.h);
  return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
}
/* and back the other way, which is what the band needs: a strip of the frame is
   a different page rectangle at every zoom. */
function rectToPage(c, r) {
  return {
    x: (r.x - c.tx) / c.z, y: (r.y - c.ty) / c.z,
    w: r.w / c.z, h: r.h / c.z,
  };
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

/* ---------- the three windows the field is solved against ----------
   walked at 60 whatever rate is rendering, so the layout is one layout: a field
   that moved between the preview and the master would make the preview useless
   for judging the thing it exists to judge.

     tight   the intersection of every visible rect after the camera has
             stopped — `SETTLED`, not the end of the knock. a core label has to
             be inside the frame on all of them, so it has to be inside this.
     wide    the union of every visible rect the field is up for, overshoot and
             shake included. the field has to reach past this or an edge opens.
     band    the union of the caption band mapped back into page space over
             every frame **a caption is actually up for**, which is from
             `TX2_AT` rather than from the reveal. no label may touch it. */
function camWindows() {
  const f0 = Math.ceil(REVEAL_AT * 60), f1 = Math.round(GLB.at * 60);
  const fs2 = Math.ceil(SETTLED * 60);
  let tight = null, wide = null, band = null;
  for (let f = f0; f <= f1; f++) {
    const t = f / 60;
    const v = visibleRect(cam, t);
    const r = { x: v.x, y: v.y, w: v.w, h: v.h };
    wide = wide ? {
      x: Math.min(wide.x, r.x), y: Math.min(wide.y, r.y),
      w: 0, h: 0,
      x1: Math.max(wide.x1, r.x + r.w), y1: Math.max(wide.y1, r.y + r.h),
    } : { x: r.x, y: r.y, w: 0, h: 0, x1: r.x + r.w, y1: r.y + r.h };
    if (f >= fs2) {
      tight = tight ? {
        x: Math.max(tight.x, r.x), y: Math.max(tight.y, r.y),
        x1: Math.min(tight.x1, r.x + r.w), y1: Math.min(tight.y1, r.y + r.h),
      } : { x: r.x, y: r.y, x1: r.x + r.w, y1: r.y + r.h };
    }
    if (f < Math.ceil(TX2_AT * 60)) continue;
    const bp = rectToPage(cameraFrame(cam, t), BAND);
    band = band ? {
      x: Math.min(band.x, bp.x), y: Math.min(band.y, bp.y),
      x1: Math.max(band.x1, bp.x + bp.w), y1: Math.max(band.y1, bp.y + bp.h),
    } : { x: bp.x, y: bp.y, x1: bp.x + bp.w, y1: bp.y + bp.h };
  }
  const fin = r => ({ x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +(r.x1 - r.x).toFixed(2), h: +(r.y1 - r.y).toFixed(2) });
  return { tight: fin(tight), wide: fin(wide), band: fin(band) };
}
const WIN = camWindows();

/* ---------- the core rect ----------
   the frame's own tightest window, inset, with everything from the caption band
   upward taken off it. this is the rectangle the forty seven have to live in
   and every number about the field comes out of it. */
const CORE = (() => {
  const t = WIN.tight;
  const x = t.x + FIELD.inset;
  const y = Math.max(t.y + FIELD.inset, WIN.band.y + WIN.band.h + FIELD.bandGap);
  return {
    x: +x.toFixed(2), y: +y.toFixed(2),
    w: +(t.x + t.w - FIELD.inset - x).toFixed(2),
    h: +(t.y + t.h - FIELD.inset - y).toFixed(2),
  };
})();

/* ---------- the type size, solved ----------
   the largest font size whose pill still tiles `cols` by `rows` inside the core
   rect at the allowed overlap. both constraints are affine in the size, so a
   bisection is exact to a thousandth and reads better than the algebra.

   the box that has to tile is the **turned** pill's own bounding box, because a
   pill rotated 3.5 degrees is taller than a pill that is not, and a layout
   solved on the unturned one is a layout whose outer row hangs out of frame. */
function bbox(F, rotDeg) {
  const c = Math.abs(Math.cos(rotDeg * Math.PI / 180)), s = Math.abs(Math.sin(rotDeg * Math.PI / 180));
  const w = pillW(F), h = pillH(F);
  return { w: w * c + h * s, h: w * s + h * c };
}
function fieldFit(n, cols, rows) {
  const spanW = 1 + (cols - 1) * (1 - FIELD.overlapX);
  const spanH = 1 + (rows - 1) * (1 - FIELD.overlapY);
  let lo = 4, hi = 80;
  for (let i = 0; i < 60; i++) {
    const F = (lo + hi) / 2;
    const b = bbox(F, FIELD.rot);
    if (b.w * spanW <= CORE.w && b.h * spanH <= CORE.h) lo = F; else hi = F;
  }
  const F = +lo.toFixed(3);
  const b = bbox(F, FIELD.rot);
  return {
    n, cols, rows, size: F,
    pill: { w: +pillW(F).toFixed(2), h: +pillH(F).toFixed(2) },
    box: { w: +b.w.toFixed(2), h: +b.h.toFixed(2) },
    capPx: +(F * TYPE.capRatio * DSF).toFixed(1),
    pitch: {
      x: +((CORE.w - b.w) / Math.max(1, cols - 1)).toFixed(3),
      y: +((CORE.h - b.h) / Math.max(1, rows - 1)).toFixed(3),
    },
    /* what share of the core rect the pills' own ink covers, which is the
       number "covered in labels" is actually about. */
    cover: +(n * pillW(F) * pillH(F) / (CORE.w * CORE.h)).toFixed(3),
  };
}
const FIT = fieldFit(FIELD.n, FIELD.cols, FIELD.rows);
/* the two alternatives, printed on every run so the trade the header argues is
   visible rather than asserted. neither of them is used. */
const ALT = [fieldFit(32, 4, 8), fieldFit(24, 3, 8)];

/* ==========================================================================
   the field
   ==========================================================================
   a jittered grid, classified rather than placed. the four by twelve block sits
   exactly on the core rect and is extended outward by whole pitches until the
   pills reach past the widest frame the plan can produce; then anything that
   touches the caption band is dropped, anything fully inside the core rect is a
   core label, and the rest is bleed.

   the count comes out at `cols * rows`, which is 48, and one of them goes: the
   pill sitting most squarely over his face, so his eyes have air in them and
   the forty seven that are left are the number the top line names.

   ---------- the two windows his own ink opens ----------

   both are walked over every frame the field is up rather than taken at rest,
   because he moves: `unimpressed` sinks him, drifts him away and puts the brows
   down, and the idle layer never stops.

     FACE_HOT   his eye and brow ink, with `faceClear` of air on it. nothing may
                be in front of this.
     LIT_HOT    his ink with `litSlack` of air on it. **a label that reaches
                this is the only kind of label for which front and back is a
                visible difference at all**, so those are the ones drawn in
                front and every other label is behind him. that is why there is
                no share and no coin flip here: front is derived from whether
                being in front would show. */
/* his eye and brow ink over the field's whole life, as one page rect. */
const FACE_HOT = (() => {
  const f0 = Math.ceil(REVEAL_AT * 60), f1 = Math.round(GLA.at * 60);
  let hot = null;
  for (let f = f0; f <= f1; f++) {
    const r = faceRect(mascotFrame(plan, f / 60));
    hot = hot ? {
      x: Math.min(hot.x, r.x), y: Math.min(hot.y, r.y),
      x1: Math.max(hot.x1, r.x + r.w), y1: Math.max(hot.y1, r.y + r.h),
    } : { x: r.x, y: r.y, x1: r.x + r.w, y1: r.y + r.h };
  }
  return { x: +hot.x.toFixed(2), y: +hot.y.toFixed(2), w: +(hot.x1 - hot.x).toFixed(2), h: +(hot.y1 - hot.y).toFixed(2) };
})();
/* and the window that decides front from back: his **ink**, with `litSlack` of
   air on it. the first cut of this used the ink plus the glow's own reach and
   the glow reaches sixty css px, which put twenty two of the forty seven in the
   front layer — a third of the field drawn in front of a head none of them
   touch. the slack is fourteen, which is a quarter of a pill's height: near
   enough that being in front of him shows, far enough that only the labels
   actually sitting on him qualify. */
const LIT_HOT = (() => {
  const f0 = Math.ceil(REVEAL_AT * 60), f1 = Math.round(GLA.at * 60);
  let hot = null;
  for (let f = f0; f <= f1; f++) {
    const hp = headPageRect(mascotFrame(plan, f / 60));
    const r = inflate(hp.rect, FIELD.litSlack);
    hot = hot ? {
      x: Math.min(hot.x, r.x), y: Math.min(hot.y, r.y),
      x1: Math.max(hot.x1, r.x + r.w), y1: Math.max(hot.y1, r.y + r.h),
    } : { x: r.x, y: r.y, x1: r.x + r.w, y1: r.y + r.h };
  }
  return { x: +hot.x.toFixed(2), y: +hot.y.toFixed(2), w: +(hot.x1 - hot.x).toFixed(2), h: +(hot.y1 - hot.y).toFixed(2) };
})();

function buildField(seed) {
  const rnd = prng(seed);
  const b = FIT.box;
  const px = FIT.pitch.x, py = FIT.pitch.y;
  /* the core centres, and then outward on the same pitch until the pill's own
     box is clear of the widest frame on that side. */
  const xs = [], ys = [];
  for (let i = 0; i < FIELD.cols; i++) xs.push(CORE.x + b.w / 2 + i * px);
  for (let j = 0; j < FIELD.rows; j++) ys.push(CORE.y + b.h / 2 + j * py);
  const W = WIN.wide;
  const bandHot = inflate(WIN.band, 4);
  while (xs[0] - b.w / 2 > W.x) xs.unshift(xs[0] - px);
  while (xs[xs.length - 1] + b.w / 2 < W.x + W.w) xs.push(xs[xs.length - 1] + px);
  while (ys[ys.length - 1] + b.h / 2 < W.y + W.h) ys.push(ys[ys.length - 1] + py);
  /* **and it is not extended upward at all.** the first cut ran the grid up past
     the band into the strip above the words, which is what the widest frame
     wants covered — and a rendered frame said no twice over. that strip is
     outside the platform safe area, so at rest it holds one row of pills
     clipped by the top of the picture, and during the wind-up the camera is
     still pushed in and the same row is off frame entirely, so it arrives out
     of nowhere a tenth of a second after the hit.
     the top of this frame belongs to the caption band. so the field stops under
     it, the coverage guard asks about the other three sides, and the top strip
     is black with one line of words in it, which is what a header is. */
  while (ys[0] - b.h / 2 > bandHot.y + bandHot.h) ys.unshift(ys[0] - py);
  const coreIdx = { x0: xs.indexOf(CORE.x + b.w / 2), y0: ys.indexOf(CORE.y + b.h / 2) };
  const out = [];
  for (let j = 0; j < ys.length; j++) {
    for (let i = 0; i < xs.length; i++) {
      const isCoreCell = i >= coreIdx.x0 && i < coreIdx.x0 + FIELD.cols
        && j >= coreIdx.y0 && j < coreIdx.y0 + FIELD.rows;
      /* the turn first, because the box it needs depends on it. */
      const sign = rnd() < 0.5 ? -1 : 1;
      const rot = +(sign * lerp(FIELD.rot / 3, FIELD.rot, rnd())).toFixed(3);
      const bb = bbox(FIT.size, rot);
      let cx = xs[i] + (rnd() * 2 - 1) * FIELD.jitterX;
      let cy = ys[j] + (rnd() * 2 - 1) * FIELD.jitterY;
      if (isCoreCell) {
        /* a core pill's jitter may not walk it out of the frame or up into the
           band, so it is clamped rather than resampled: a resample would make
           the layout depend on how many tries it took. */
        cx = clamp(cx, CORE.x + bb.w / 2, CORE.x + CORE.w - bb.w / 2);
        cy = clamp(cy, Math.max(CORE.y + bb.h / 2, bandHot.y + bandHot.h + bb.h / 2),
          CORE.y + CORE.h - bb.h / 2);
      }
      const rect = { x: cx - bb.w / 2, y: cy - bb.h / 2, w: bb.w, h: bb.h };
      if (overlaps(rect, bandHot)) continue;
      if (!isCoreCell && !overlaps(rect, WIN.wide)) continue;
      /* front is derived rather than drawn: a label is in front of him only
         where being in front of him would show, and never over his face. */
      const onHim = overlaps(rect, LIT_HOT);
      out.push({
        cx: +cx.toFixed(2), cy: +cy.toFixed(2), rot, rect,
        core: isCoreCell && inside(rect, CORE),
        front: onHim && !overlaps(rect, FACE_HOT),
        onHim,
        cell: [i, j],
      });
    }
  }
  /* one core pill goes, and it is the one sitting most squarely over his face:
     the largest overlap with `FACE_HOT`, and the nearest to the plate's centre
     if nothing overlaps it at all. that leaves his eyes a hole rather than
     leaving a hole somewhere arbitrary. */
  let drop = -1, best = -1;
  for (let k = 0; k < out.length; k++) {
    if (!out[k].core) continue;
    const r = out[k].rect;
    const ox = Math.max(0, Math.min(r.x + r.w, FACE_HOT.x + FACE_HOT.w) - Math.max(r.x, FACE_HOT.x));
    const oy = Math.max(0, Math.min(r.y + r.h, FACE_HOT.y + FACE_HOT.h) - Math.max(r.y, FACE_HOT.y));
    const score = ox * oy > 0
      ? ox * oy
      : -Math.hypot(out[k].cx - PLATE.cx, out[k].cy - PLATE.cy);
    if (score > best) { best = score; drop = k; }
  }
  if (drop >= 0) out.splice(drop, 1);
  return out;
}
/* ---------- the seed is searched, the same way the blink's is ----------
   the layout is a jittered grid and the jitter is where it can go wrong: two
   rows landing on top of each other in one column leaves a pill with half its
   copy under another pill, and the first seed this file tried left one showing
   54% of itself. that is not a number to tune the overlap down for — the
   overlap is what makes it a wall — it is a number to **choose a seed on**.

   so the seed is a search over the layer that already makes the layout, picking
   the one whose **worst covered** core label shows the most of itself. it is
   post13's move on the blink and post15's on the idle blink, in a third place.

   five hundred layouts return the same best one a hundred and forty did — 65%
   — which is worth knowing: the number is the grid's own ceiling at this overlap
   rather than a seed nobody has found yet, and the way to move it is the overlap
   and the count. the sweep on `overlapY` is where that argument lives.
   the occlusion is measured rather than estimated: the core rect is rasterised
   at two css px and every pill is painted in the order the page paints it, back
   layer, then his plate, then the front layer. */
function pickField() {
  let best = null;
  for (let s = 1; s <= 500; s++) {
    const seed = (FIELD.seed ^ (s * 2654435761)) >>> 0;
    const pills = buildField(seed);
    if (pills.filter(p => p.core).length !== FIELD.n) continue;
    if (pills.filter(p => p.front).length < 3) continue;
    const occ = occlusion(pills);
    if (!best || occ.worst.vis > best.occ.worst.vis) best = { seed, pills, occ, tries: s };
  }
  if (!best) throw new Error('no seed in five hundred lays the field out at ' + FIELD.n);
  return best;
}
const FIELD_PICK = pickField();
const PILLS = FIELD_PICK.pills;
const OCC = FIELD_PICK.occ;
/* how many of the labels that reach him went behind him because they reach his
   face, which is the face rule as a number rather than as a paragraph. */
const FORCED_BACK = PILLS.filter(p => p.onHim && !p.front).length;
const CORE_PILLS = PILLS.filter(p => p.core);
const BLEED_PILLS = PILLS.filter(p => !p.core);

/* the field's own envelope, off the placed pills rather than off the grid it
   came from, which is what the coverage guard is measured against. */
const FIELD_ENV = (() => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of PILLS) {
    x0 = Math.min(x0, p.rect.x); y0 = Math.min(y0, p.rect.y);
    x1 = Math.max(x1, p.rect.x + p.rect.w); y1 = Math.max(y1, p.rect.y + p.rect.h);
  }
  return { x: +x0.toFixed(2), y: +y0.toFixed(2), w: +(x1 - x0).toFixed(2), h: +(y1 - y0).toFixed(2) };
})();

/* ---------- how much of each core pill you can actually see ----------
   forty seven identical pills overlapping is the brief, and a pill covered so
   far that it stops reading as a pill is the thing that would break it. so the
   occlusion is measured rather than argued: the core rect is rasterised at two
   css px, every pill is painted in draw order — back layer first, then him,
   then the front layer, which is the order the page paints — and each core
   pill's own share of surviving cells is the number.

   the mascot is painted as his plate, because a pill behind his head is behind
   his head, and his head is the one thing in this frame that is not
   transparent.

   this is what `pickField` searches on, and it is also the guard. */
function occlusion(pills) {
  const S = 2;
  const gw = Math.ceil(CORE.w / S), gh = Math.ceil(CORE.h / S);
  const owner = new Int16Array(gw * gh).fill(-1);
  const order = [
    ...pills.map((p, i) => ({ p, i, layer: p.front ? 2 : 0 })),
  ].sort((a, b) => a.layer - b.layer || a.i - b.i);
  const cellsOf = new Map();
  const paint = (p, id) => {
    const c = Math.cos(-p.rot * Math.PI / 180), s = Math.sin(-p.rot * Math.PI / 180);
    const hw = FIT.pill.w / 2, hh = FIT.pill.h / 2;
    const i0 = Math.max(0, Math.floor((p.rect.x - CORE.x) / S));
    const i1 = Math.min(gw - 1, Math.ceil((p.rect.x + p.rect.w - CORE.x) / S));
    const j0 = Math.max(0, Math.floor((p.rect.y - CORE.y) / S));
    const j1 = Math.min(gh - 1, Math.ceil((p.rect.y + p.rect.h - CORE.y) / S));
    let own = 0;
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const px = CORE.x + (i + 0.5) * S - p.cx, py = CORE.y + (j + 0.5) * S - p.cy;
        const u = px * c - py * s, v = px * s + py * c;
        if (Math.abs(u) > hw || Math.abs(v) > hh) continue;
        owner[j * gw + i] = id;
        own++;
      }
    }
    return own;
  };
  /* the pills' own areas, taken before anything covers them. */
  for (const e of order) cellsOf.set(e.i, paint(e.p, -2));
  owner.fill(-1);
  for (const e of order) {
    if (e.layer === 0) paint(e.p, e.i);
  }
  /* him, over the back layer. */
  {
    const i0 = Math.max(0, Math.floor((PLATE.cx - PLATE.r - CORE.x) / S));
    const i1 = Math.min(gw - 1, Math.ceil((PLATE.cx + PLATE.r - CORE.x) / S));
    const j0 = Math.max(0, Math.floor((PLATE.cy - PLATE.r - CORE.y) / S));
    const j1 = Math.min(gh - 1, Math.ceil((PLATE.cy + PLATE.r - CORE.y) / S));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const dx = CORE.x + (i + 0.5) * S - PLATE.cx, dy = CORE.y + (j + 0.5) * S - PLATE.cy;
        if (dx * dx + dy * dy <= PLATE.r * PLATE.r) owner[j * gw + i] = -3;
      }
    }
  }
  for (const e of order) {
    if (e.layer === 2) paint(e.p, e.i);
  }
  const seen = new Map();
  for (let k = 0; k < owner.length; k++) {
    const id = owner[k];
    if (id >= 0) seen.set(id, (seen.get(id) || 0) + 1);
  }
  let worst = null;
  let sum = 0, count = 0;
  for (const e of order) {
    if (!e.p.core) continue;
    const own = cellsOf.get(e.i) || 1;
    const vis = (seen.get(e.i) || 0) / own;
    sum += vis; count++;
    if (!worst || vis < worst.vis) worst = { i: e.i, vis: +vis.toFixed(3), cell: e.p.cell, front: e.p.front };
  }
  return { worst, mean: +(sum / count).toFixed(3), n: count };
}

/* ==========================================================================
   the hero label
   ==========================================================================
   two edges and nothing typed. its right side sits `rightAir` inside the right
   safe line at the start zoom, and its bottom sits `gap` above the highest his
   lit ink ever gets while it is up. both are read off the picture. */
const HERO_AT = (() => {
  const z = CAM.start.z;
  const w = pillW(HERO.size), h = pillH(HERO.size);
  /* the highest his crown gets, in page px, over the frames the label is up
     for. it is the ink rather than the light — see the note on HERO.gap. */
  let inkTop = Infinity, at = 0;
  const f1 = Math.ceil(REVEAL_AT * 60);
  for (let f = 0; f <= f1; f++) {
    const t = f / 60;
    const v = headPageRect(mascotFrame(plan, t)).rect.y;
    if (v < inkTop) { inkTop = v; at = +t.toFixed(3); }
  }
  const c = cameraFrame(cam, HERO.at + HERO.for);
  const rightScreen = VW - SAFE_CSS.right - HERO.rightAir;
  const inkTopScreen = inkTop * c.z + c.ty;
  /* it hangs off his crown, and the band is a floor under that: `HEAD_DROP` is
     derived so the two do not fight, and this is the arithmetic that says so
     rather than the paragraph that hopes so. */
  const bottomScreen = Math.max(inkTopScreen - HERO.gap,
    BAND.y + BAND.h + HERO.topGap + h * z);
  /* screen edges back into page space, so the label lives in the rig with him
     and the push is on the two of them together. */
  const cxPage = ((rightScreen - w * z / 2) - c.tx) / c.z;
  const cyPage = ((bottomScreen - h * z / 2) - c.ty) / c.z;
  return {
    cx: +cxPage.toFixed(2), cy: +cyPage.toFixed(2),
    w: +w.toFixed(2), h: +h.toFixed(2),
    inkTop: +inkTop.toFixed(2), inkAt: at,
    capPx: +(HERO.size * TYPE.capRatio * DSF).toFixed(1),
  };
})();
const HERO_RECT = {
  x: HERO_AT.cx - HERO_AT.w / 2, y: HERO_AT.cy - HERO_AT.h / 2,
  w: HERO_AT.w, h: HERO_AT.h,
};

/* ==========================================================================
   one frame of everything
   ==========================================================================
   the whole clip as a function of the instant and of the output frame it
   belongs to. they differ under the shutter and the difference is the whole
   point of the split: everything that is a real move is a function of `t` and
   smears, and the glitch is a function of `f`, because a dropped packet happens
   to a screen rather than in the room. */

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
   post11's rule and post12's note. a 220ms hit is thirteen frames at sixty and
   2.6 at twelve, so written as seconds and left alone it would be a different
   event on the preview pass. */
function onGrid(t, len, fps) {
  const f0 = Math.round(t * fps);
  const n = Math.max(1, Math.round(len * fps));
  return { t0: f0 / fps, t1: (f0 + n) / fps, frames: n };
}
function glitchWindows(fps) {
  return [
    { ...onGrid(GLA.at, GLA.for, fps), seed: 0x0c1a55, flashAt: Math.round(GLA.at * fps) },
    { ...onGrid(GLB.at, GLB.for, fps), seed: 0x7e3b12, flashAt: Math.round(GLB.at * fps) },
  ];
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
  g.flash = f === w.flashAt ? GL.flash : 0;
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

/* two sines on incommensurate periods rather than one, and post10 paid for that
   lesson: a sine stands still twice a period, so on an end card where the
   phosphor is the only thing still moving, the two frames either side of its
   turning point are identical. */
function phosphor(t, amp, slow, fast, phase) {
  return 1 + amp * 0.78 * Math.sin(2 * Math.PI * t / slow)
    + amp * 0.39 * Math.sin(2 * Math.PI * t / fast + phase);
}

function frameAt(t, f) {
  const c = cameraFrame(cam, t);
  const mas = mascotFrame(plan, t);
  const g = glitchAt(f);

  /* the three cuts, all on frames rather than on times. */
  const mo = f >= HIM_CUT_FRAME ? 0 : 1;
  const field = (f >= REVEAL_FRAME && f < FIELD_CUT_FRAME) ? 1 : 0;

  /* the hero label. a rise, a fade and a spring, and it is cut on the reveal
     frame — the frame exchanges one label for forty seven and is never empty. */
  const hp = span(t, HERO.at, HERO.at + HERO.for);
  const hero = f >= REVEAL_FRAME ? { o: 0, y: 0, sc: 1 } : {
    o: +span(t, HERO.at, HERO.at + HERO.for * 0.45).toFixed(4),
    y: +lerp(HERO.riseBy, 0, POP(hp)).toFixed(3),
    sc: +lerp(0.90, 1, POP(hp)).toFixed(4),
  };

  /* the top line. one block until the reveal frame, the other from it, and the
     glow breathes on both so the band is never a still picture. */
  const tx = {
    one: f >= REVEAL_FRAME ? 0 : +span(t, TEXT.in, TEXT.in + TEXT.for).toFixed(4),
    two: (f >= TX2_FRAME && f < FIELD_CUT_FRAME) ? 1 : 0,
    glow: +phosphor(t, 0.05, 2.7, 0.91, 0.4).toFixed(4),
  };

  const wp = span(t, WM_IN, WM_IN + GLB.wmFor);
  const wm = {
    o: +span(t, WM_IN, WM_IN + GLB.wmFor * 0.45).toFixed(4),
    sc: +(1 + (1 - POP(wp)) * 0.085).toFixed(4),
    glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4),
  };
  return { t: +t.toFixed(4), f, cam: c, mas, mo, field, hero, tx, wm, g };
}

/* what the page is handed, which is this file's own layers only: the camera and
   the mascot each write their own numbers. */
function pageFrame(o) {
  return {
    mo: o.mo, field: o.field,
    hero: o.hero, tx: o.tx, wm: o.wm, g: o.g,
  };
}

/* ==========================================================================
   the page
   ==========================================================================
   three runtimes: the camera, then the mascot writes its own numbers, then this
   file writes its own layers and decides nothing. */
function pillMarkup(cls, lines, extra = '') {
  return `<div class="${cls}"${extra}>` + lines.map(l => '<span>' + l + '</span>').join('') + '</div>';
}
function fieldMarkup(front) {
  return PILLS.filter(p => !!p.front === front).map(p => pillMarkup('pill',
    LABEL.lines,
    ` style="left:${p.cx}px;top:${p.cy}px;--r:${p.rot}deg"`)).join('\n      ');
}

function sceneHtml() {
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post16</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500&display=swap">
<style>
:root{
  --bg:#ffffff; --fg:#0b0d10;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  --body:"Space Grotesk",var(--mono);
  --display:"Michroma",var(--mono);
  /* the pill's own three, which are the module's three. --pill-fill is defined
     to equal the page colour and --pill-ink the face colour, so the pair
     inverts with the theme for free and a pill is the mascot's pill at another
     size rather than a second design. */
  --pill-fill:#ffffff; --pill-ink:#0b0d10; --pill-line:rgba(11,13,16,.55);
  /* the two channels the rgb split is drawn in: the same white the glow is,
     pulled apart, rather than a red and a cyan out of a filter preset. this
     frame has no colour in it and the glitch is not where colour starts. */
  --gr:rgba(255,120,120,.55); --gc:rgba(120,220,255,.55);
}
[data-theme=dark]{
  --bg:#06070a; --fg:#d5dbd8;
  --pill-fill:#06070a; --pill-ink:#f4f7f5; --pill-line:rgba(213,219,216,.5);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}

/* the vignette, and it is load bearing rather than decoration. with nothing at
   all animating chrome stops producing compositor frames and the screenshot
   call blocks on a frame that never comes — post2.mjs found this and every clip
   in demo/ has carried the fix since. it is also the one thing in this file
   allowed to be a css animation, because it is the one thing that does not have
   to hit a mark. it is outside the camera, so the camera cannot smear it. */
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
   and every custom property anything else reads. one place they are written and
   one place everything reads them from, which is what keeps the torn copies
   from drifting off the real one. the page colour is painted by html and body
   as well, so a fifteen pixel shake cannot expose an edge. */
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;background:var(--bg);
  transform:translate3d(calc(var(--sx,0) * 1px),calc(var(--sy,0) * 1px),0);
  will-change:transform}

${cameraCss()}

/* ---- the pill ----
   the module's thought pill at another size, plus a glow. the padding and the
   corner are in em so one font size sets the whole thing: BUBBLE's own 22 and
   12 against a 26px size are 0.846em and 0.462em, and 999px of radius on a two
   line block is a capsule either way.

   the glow is two box shadows and two text shadows rather than a filter. a css
   filter on ninety of these would blur ninety surfaces on every frame of the
   clip; a shadow is painted once into the same layer the pill is. */
.pill{position:absolute;
  transform:translate(-50%,-50%) rotate(var(--r,0deg)) scale(var(--s,1));
  padding:${TYPE.padY}em ${TYPE.padX}em;
  border:${TYPE.stroke}px solid var(--pill-line);border-radius:999px;
  background:var(--pill-fill);color:var(--pill-ink);
  font-family:var(--body);font-weight:${BUBBLE.weight};
  line-height:${TYPE.lineH};letter-spacing:.005em;white-space:nowrap;
  text-align:center;
  box-shadow:0 0 10px rgba(255,255,255,.15),0 0 28px rgba(255,255,255,.07);
  text-shadow:0 0 7px rgba(255,255,255,.28),0 0 20px rgba(255,255,255,.13)}
.pill span{display:block}

/* the two field layers, one either side of him. the whole field is one opacity,
   because the brief is that the forty seven arrive together. */
.field{position:absolute;left:0;top:0;width:${VW}px;height:${VH}px;
  pointer-events:none;opacity:var(--field-o,0)}
#field-back{z-index:2}
#field-front{z-index:5}

/* the hero label, which is its own layer because it has its own life: it floats
   in, it is the only one for two and a half seconds, and it is cut on the frame
   the field arrives. */
#hero{z-index:6;opacity:var(--hero-o,0);
  transform:translate(-50%,calc(-50% + var(--hero-y,0) * 1px)) scale(var(--hero-s,1));
  transform-origin:50% 100%}

/* the mascot's own cut, as a wrapper rather than as a rule on the zone: post15's
   line, and here it is simply the switch that takes him off the frame while the
   field stays on it. */
#mas-cut{position:absolute;inset:0;z-index:4;opacity:var(--m-o,1)}

${mascotCss(plan)}

/* ---- the top line ----
   michroma, tracked, glowing, in screen space outside the camera so the pull
   back cannot move it. two blocks stacked in the same place, one opacity each,
   swapped on a frame. */
.tx{position:absolute;left:50%;top:${TEXT_Y}px;
  transform:translate(-50%,-50%);
  font-family:var(--display);font-weight:400;color:var(--fg);
  text-align:center;letter-spacing:.18em;text-indent:.09em;
  line-height:${TYPE.mich.lineH};white-space:nowrap;
  filter:brightness(var(--tx-glow,1));
  text-shadow:0 0 6px rgba(255,255,255,.36),0 0 18px rgba(255,255,255,.19),
    0 0 40px rgba(255,255,255,.09);
  z-index:8}
.tx span{display:block}
#tx1{opacity:var(--tx1-o,0)}
#tx2{opacity:var(--tx2-o,0)}
.stage[data-gl="1"] .tx{
  text-shadow:0 0 6px rgba(255,255,255,.36),0 0 18px rgba(255,255,255,.19),
    0 0 40px rgba(255,255,255,.09),
    calc(var(--split,0) * -1px) 0 var(--gr),calc(var(--split,0) * 1px) 0 var(--gc)}

/* ---- the wordmark ----
   three lines on the middle of the safe band. the deep glow is two text shadows
   rather than blurred duplicates, because it is twelve glyphs and a duplicate
   would have to be written every frame. the brightness filter on top is the
   phosphor breathing, which is what stops the last second from being a still
   picture. it is outside the camera, in screen space. */
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
   the wordmark displaced sideways.

   **on the first fault there is nothing to copy, and that is deliberate.** the
   wordmark is not born yet, the field is ninety elements out of a grid and the
   mascot is one dom subtree driven by two modules' runtimes — neither has a
   second copy that could be kept in sync. so the first fault's bands are
   dropouts rather than tears: a strip of a screen covered in copy going flat
   black is what a picture losing a line of itself looks like, and it is the
   more honest of the two anyway. the second fault's bands carry the wordmark,
   because by then the wordmark is all there is. */
.tear{position:absolute;inset:0;z-index:10;overflow:hidden;background:var(--bg);
  clip-path:inset(var(--tt,0px) 0 calc(100% - var(--tt,0px) - var(--th,0px)) 0);
  opacity:var(--to,0)}
.tear-in{position:absolute;inset:0;transform:translate3d(calc(var(--tdx,0) * 1px),0,0)}

/* ---- the fault's own two layers ----
   noise, screen blended so it adds light to a black frame rather than sitting
   on it as grey, and a white frame that fires once per fault. */
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
  <div class="field" id="field-back">
      ${fieldMarkup(false)}
  </div>
  <div id="mas-cut">${mascotMarkup(plan)}</div>
  <div class="field" id="field-front">
      ${fieldMarkup(true)}
  </div>
  ${pillMarkup('pill', LABEL.lines, ` id="hero" style="left:${HERO_AT.cx}px;top:${HERO_AT.cy}px"`)}`)}
  <div class="tx" id="tx1">${TEXT.one.map(l => '<span>' + l + '</span>').join('')}</div>
  <div class="tx" id="tx2">${TEXT.two.map(l => '<span>' + l + '</span>').join('')}</div>
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
window.__P16 = ${JSON.stringify({
    WM, TEXT: { w: TEXT.w }, FIELD_SIZE: FIT.size, HERO_SIZE: HERO.size, VW, VH, DSF,
  })};
${scenePage.toString()}
scenePage();
document.fonts.load('400 1em "Michroma"')
  .then(() => document.fonts.load('500 1em "Space Grotesk"'))
  .then(() => document.fonts.ready)
  .then(() => {
    window.__p16.fit();
    window.__built = window.__mas.build();
  });
</script>
</body>
</html>`;
}

/* ---------- the page's own script ----------
   it writes numbers to elements and it decides nothing, exactly like the two
   module runtimes beside it. serialised in with .toString(), so it must not
   close over anything: everything it needs arrives on window.__P16. */
function scenePage() {
  const P = window.__P16;
  const stage = document.getElementById('stage');
  const back = document.getElementById('field-back');
  const front = document.getElementById('field-front');
  const hero = document.getElementById('hero');
  const tx1 = document.getElementById('tx1');
  const tx2 = document.getElementById('tx2');
  const wms = [...document.querySelectorAll('.wm')];
  const txs = [tx1, tx2];
  const tears = [...document.querySelectorAll('.tear')];
  const tearIns = tears.map(t => t.querySelector('.tear-in'));
  const corePills = [...document.querySelectorAll('.pill')].filter(p => p.id !== 'hero');

  /* the widest rendered line of a block, in css px, at whatever size it is set
     at. michroma is proportional and its tracking is nearly a fifth of an em,
     so the width of a string is a measurement rather than a ratio. */
  const widest = el => {
    let w = 0;
    for (const sp of el.querySelectorAll('span')) w = Math.max(w, sp.getBoundingClientRect().width);
    return w;
  };
  const capOf = el => {
    const cv = document.createElement('canvas').getContext('2d');
    const cs = getComputedStyle(el);
    cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    const m = cv.measureText('H');
    return { cap: m.actualBoundingBoxAscent || 0, font: cv.font };
  };

  window.__p16 = {
    ready: true,

    /* the two michroma blocks are fitted and the two pill sizes are written.
       the pills are **set** rather than fitted, because node solved the layout
       against a size: fitting them here would move them off the grid it built.
       what happens instead is that `measure` reports what they came out as and
       node's guards check the solve against it. */
    fit() {
      const probe = wms[0];
      probe.style.fontSize = '100px';
      const wmSize = 100 * P.WM.w / widest(probe);
      for (const el of wms) el.style.fontSize = wmSize.toFixed(2) + 'px';
      /* both top lines to one size, off the wider of the two, so the swap does
         not change the type. */
      let widestTx = 0;
      for (const el of txs) { el.style.fontSize = '100px'; widestTx = Math.max(widestTx, widest(el)); }
      const txSize = 100 * P.TEXT.w / widestTx;
      for (const el of txs) el.style.fontSize = txSize.toFixed(3) + 'px';
      hero.style.fontSize = P.HERO_SIZE + 'px';
      for (const el of corePills) el.style.fontSize = P.FIELD_SIZE + 'px';
      return { wm: wmSize, tx: txSize };
    },

    /* what everything actually measures, once, after the fit. every number a
       guard reads about type comes from here rather than from the solve. */
    measure() {
      const d = P.DSF;
      const box = el => {
        const r = el.getBoundingClientRect();
        return {
          sizeCss: +parseFloat(getComputedStyle(el).fontSize).toFixed(3),
          widestPx: +(widest(el) * d).toFixed(1),
          capPx: +(capOf(el).cap * d).toFixed(1),
          left: +(r.left * d).toFixed(1), top: +(r.top * d).toFixed(1),
          right: +((P.VW - r.right) * d).toFixed(1), bottom: +((P.VH - r.bottom) * d).toFixed(1),
          cssRect: { x: +r.left.toFixed(2), y: +r.top.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) },
          font: capOf(el).font,
        };
      };
      /* one field pill, un-turned, measured with its rotation taken off so the
         number is the pill's own box rather than its turned envelope. */
      const one = corePills[0];
      const keep = one.style.getPropertyValue('--r');
      one.style.setProperty('--r', '0deg');
      const pill = box(one);
      one.style.setProperty('--r', keep);
      return { wm: box(wms[0]), tx1: box(tx1), tx2: box(tx2), hero: box(hero), pill, pills: corePills.length };
    },

    /* the field's own rendered envelope, in screen css px, off every pill on the
       screen. this is what replaces `__cam.edges()` for this clip — see the
       header. the pills' box shadows are not in it: `getBoundingClientRect`
       does not include a shadow, which is right, because a glow is not
       something the frame can be said to be covered by. */
    fieldBox() {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const el of corePills) {
        const r = el.getBoundingClientRect();
        x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top);
        x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
      }
      return {
        x: +x0.toFixed(2), y: +y0.toFixed(2), w: +(x1 - x0).toFixed(2), h: +(y1 - y0).toFixed(2),
        n: corePills.length,
      };
    },

    /* the hero label as it actually rendered, in screen css and device px. */
    heroBox() {
      const r = hero.getBoundingClientRect(), d = P.DSF;
      return {
        cssRect: { x: +r.left.toFixed(2), y: +r.top.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) },
        left: +(r.left * d).toFixed(1), top: +(r.top * d).toFixed(1),
        right: +((P.VW - r.right) * d).toFixed(1), bottom: +((P.VH - r.bottom) * d).toFixed(1),
      };
    },

    /* his plate, in screen css and device px. the plate is a circle at radius
       0.5, so its client rect is its ink. */
    plateBox() {
      const el = document.querySelector('#m-zone .m-face .m-plate');
      const r = el.getBoundingClientRect(), d = P.DSF;
      return {
        cssRect: { x: +r.left.toFixed(2), y: +r.top.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) },
        wPx: +(r.width * d).toFixed(1), hPx: +(r.height * d).toFixed(1),
      };
    },

    apply(o) {
      const s = stage.style;
      s.setProperty('--m-o', o.mo.toFixed(4));
      s.setProperty('--field-o', o.field.toFixed(4));
      s.setProperty('--hero-o', o.hero.o.toFixed(4));
      s.setProperty('--hero-y', o.hero.y.toFixed(3));
      s.setProperty('--hero-s', o.hero.sc.toFixed(4));
      s.setProperty('--tx1-o', o.tx.one.toFixed(4));
      s.setProperty('--tx2-o', o.tx.two.toFixed(4));
      s.setProperty('--tx-glow', o.tx.glow.toFixed(4));
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

      /* off screen the two field layers are switched off rather than merely
         left at nought: ninety boxes with two shadows each are still rastered
         at opacity zero. */
      const vis = o.field > 0.002 ? 'visible' : 'hidden';
      back.style.visibility = vis;
      front.style.visibility = vis;
      hero.style.visibility = o.hero.o > 0.002 ? 'visible' : 'hidden';

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

    /* the field alone, for the still that has to answer "does one of these read
       at phone size" before anything is animated. **the vignette stays on**: it
       is the one css animation in the file and it is load bearing, because with
       nothing at all animating chrome stops producing compositor frames and the
       next virtual time budget never expires. */
    soloField(on) {
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
  let seed = 0x16a0c3d7;
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
      && window.__cam.ready && window.__p16
      && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  const ready = await page.evaluate(() => ({
    mas: !!(window.__mas && window.__mas.ready),
    cam: !!(window.__cam && window.__cam.ready),
    p16: !!(window.__p16 && window.__p16.ready),
  }));
  for (const k of ['mas', 'cam', 'p16']) {
    if (!ready[k]) throw new Error('the ' + k + ' layer never became ready');
  }
  /* offline michroma falls back to the system mono and the type looks almost
     right, which is the worst kind of wrong to judge type on. */
  if (!await page.evaluate(() => document.fonts.check('400 40px "Michroma"'))) {
    throw new Error('Michroma did not load — the type would be judged in the mono fallback');
  }
  if (!await page.evaluate(() => document.fonts.check('500 40px "Space Grotesk"'))) {
    throw new Error('Space Grotesk did not load — the pills would be judged in the mono fallback');
  }
  return { browser, page, cdp, srv, advance };
}

/* one instant, written to the page in the order the contract says. */
async function paint(page, o) {
  await page.evaluate(c => window.__cam.apply(c), o.cam);
  await page.evaluate(m => window.__mas.apply(m), o.mas);
  await page.evaluate(p => window.__p16.apply(p), pageFrame(o));
}

async function shoot(cdp, file, fmt = 'png') {
  const shot = await cdp.send('Page.captureScreenshot', {
    format: fmt, quality: fmt === 'jpeg' ? 94 : undefined,
    captureBeyondViewport: false,
    clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
  });
  fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
}

/* ---------- the field alone ----------
   the brief's first validation step, and it is a mode rather than a note: if
   one of the forty seven does not read at phone size there is no point
   animating any of them. the reveal frame, the frame it settles on, and a crop
   at three times so a single pill can be judged as type. */
async function renderFieldOnly() {
  const { browser, page, cdp, srv, advance } = await boot();
  const dir = path.join(VERIFY, 'field');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const m = await page.evaluate(() => window.__p16.measure());
  const shots = [
    [REVEAL_AT, 'a-the-reveal'],
    [SETTLED, 'b-settled'],
  ];
  /* **virtual time has to move between two captures.** with the clock paused
     `Page.captureScreenshot` waits for a frame the compositor has no reason to
     produce, and the second call in a row blocks forever. one STEP of budget
     after each shot is what the render loop already does between its own
     frames. */
  for (const [want, name] of shots) {
    const fr = Math.round(want * FPS);
    await paint(page, frameAt(fr / FPS, fr));
    await shoot(cdp, path.join(dir, name + '.png'));
    await advance(STEP);
  }
  await page.evaluate(() => window.__p16.soloField(true));
  {
    const fr = Math.round(SETTLED * FPS);
    await paint(page, frameAt(fr / FPS, fr));
    await shoot(cdp, path.join(dir, 'c-no-mascot.png'));
    await advance(STEP);
    /* re-measured **after** the paint, because the rect a crop needs is where
       the pill landed on the screen and the camera is what put it there. the
       measurement taken before the loop is in page space and would crop the
       wrong part of the frame. */
    const c = (await page.evaluate(() => window.__p16.measure())).pill.cssRect;
    const pad = 14;
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: Math.max(0, c.x - pad), y: Math.max(0, c.y - pad),
        width: c.w + pad * 2, height: c.h + pad * 2, scale: 3 },
    });
    fs.writeFileSync(path.join(dir, 'd-one-pill-3x.png'), Buffer.from(shot.data, 'base64'));
    await advance(STEP);
  }
  await browser.close();
  srv.close();
  return m;
}

/* ---------- render ---------- */
async function render() {
  for (const d of [FRAMES, SUBS]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  fs.mkdirSync(OUT, { recursive: true });
  const N = Math.round(FPS * SECONDS);
  const { browser, page, cdp, srv, advance } = await boot();

  const built = await page.evaluate(() => window.__built);
  const meas = await page.evaluate(() => window.__p16.measure());
  console.log('  built: head ' + built.headPx + 'px, ' + built.eyes + ' eyes, '
    + built.glows + ' glow layers, theme ' + built.theme);
  console.log('  the wordmark: ' + meas.wm.sizeCss + 'css px, widest line ' + meas.wm.widestPx
    + ' device px, caps ' + meas.wm.capPx);
  console.log('  the top line: ' + meas.tx1.sizeCss + 'css px, caps ' + meas.tx1.capPx
    + ' device px, widest ' + Math.max(meas.tx1.widestPx, meas.tx2.widestPx));
  console.log('  the hero pill: ' + meas.hero.cssRect.w.toFixed(1) + ' x '
    + meas.hero.cssRect.h.toFixed(1) + ' css, caps ' + meas.hero.capPx + ' device px');
  console.log('  a field pill: ' + meas.pill.cssRect.w.toFixed(1) + ' x '
    + meas.pill.cssRect.h.toFixed(1) + ' css, caps ' + meas.pill.capPx + ' device px, '
    + meas.pills + ' of them in the dom');

  /* the liveness signature. one number per output frame off everything this
     file wrote plus everything the two modules wrote, so two identical frames
     are a fact rather than a suspicion. post10 shipped a pair and only found
     out at sixty. */
  const sigs = [];
  let fieldWorst = null, fieldSamples = 0;
  let heroWorst = null, heroSamples = 0;
  const bandHits = [];
  const wall = Date.now();

  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const o = frameAt(t, f);
      await paint(page, o);
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);

      if (k === 0) {
        let s = o.mo * 7 + o.field * 3 + o.hero.o * 5 + o.hero.y * 101 + o.hero.sc * 103
          + o.tx.one * 11 + o.tx.two * 13 + o.tx.glow * 107
          + o.wm.o * 17 + o.wm.sc * 19 + o.wm.glow * 23
          + o.g.sx * 29 + o.g.sy * 31 + o.g.split * 37 + o.g.noise * 41 + o.g.flash * 43
          + o.g.bands.length * 47
          + o.cam.tx * 173 + o.cam.ty * 179 + o.cam.z * 181
          + o.mas.card.x * 53 + o.mas.card.y * 59 + o.mas.card.rot * 61
          + o.mas.card.sx * 67 + o.mas.card.sy * 71 + o.mas.glow * 73;
        for (let e = 0; e < 2; e++) {
          s += o.mas.eyes[e].x * (79 + e) + o.mas.eyes[e].y * (83 + e)
            + o.mas.eyes[e].sx * (89 + e) + o.mas.eyes[e].sy * (97 + e) + o.mas.eyes[e].lid * (109 + e);
        }
        sigs.push(+s.toFixed(6));

        /* the field, four times a second on the whole frame rather than on a
           subframe, and never inside a fault: the glitch translates the stage
           and a coverage reading through a fifteen pixel jump is a reading of
           the glitch rather than of the field. */
        if (o.field && o.g.heat === 0 && f % Math.max(1, Math.round(FPS / 4)) === 0) {
          const fb = await page.evaluate(() => window.__p16.fieldBox());
          fieldSamples++;
          /* how far the field's envelope reaches past each side of the frame, in
             device px. negative is an edge with no labels behind it. */
          const air = {
            left: +(-fb.x * DSF).toFixed(1), top: +(-fb.y * DSF).toFixed(1),
            right: +((fb.x + fb.w - VW) * DSF).toFixed(1),
            bottom: +((fb.y + fb.h - VH) * DSF).toFixed(1),
          };
          /* three sides. the top of the frame is the caption band's and the
             field deliberately stops under it — see buildField. */
          const near = Math.min(air.left, air.right, air.bottom);
          if (!fieldWorst || near < fieldWorst.near) {
            fieldWorst = { t: +t.toFixed(2), near, ...air, n: fb.n };
          }
        }
        /* and the hero label, on the same sample, against the safe area and the
           band. it is inside the camera, so what is checked is where it landed
           on the screen. */
        if (o.hero.o > 0.5 && f % Math.max(1, Math.round(FPS / 4)) === 0) {
          const hb = await page.evaluate(() => window.__p16.heroBox());
          heroSamples++;
          const air = Math.min(hb.left - SAFE.left, hb.top - SAFE.top,
            hb.right - SAFE.right, hb.bottom - SAFE.bottom);
          if (!heroWorst || air < heroWorst.air) {
            heroWorst = { t: +t.toFixed(2), air: +air.toFixed(1), ...hb };
          }
          if (overlaps(hb.cssRect, BAND)) bandHits.push('the hero label at ' + t.toFixed(2) + 's');
        }
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
    [HERO.at + HERO.for, 'b-the-label-is-in'],
    [plan.marks[0].settled, 'c-he-sees-it'],
    [TEXT.in + TEXT.for, 'd-the-top-line'],
    [plan.marks[1].settled, 'e-agreeing'],
    [HIT - 0.20, 'f-calm'],
    [REVEAL_AT - 1 / FPS, 'g-the-frame-before'],
    [REVEAL_AT, 'h-the-reveal'],
    [REVEAL_AT + 0.08, 'i-mid-pull'],
    [SETTLED, 'j-settled'],
    [plan.marks[2].settled, 'k-flat'],
    [BLINK_AT, 'l-the-slow-blink'],
    [GLA.at, 'm-the-first-fault'],
    [GLA.at + 0.10, 'n-he-is-gone'],
    [GLB.at - 0.04, 'o-the-labels-alone'],
    [GLB.at, 'p-the-second-fault'],
    [GLB.at + GLB.for + 0.06, 'q-the-wordmark'],
    [SECONDS - 0.05, 'r-the-last-frame'],
  ];
  for (const [want, name] of stills) {
    const fr = Math.min(N - 1, Math.max(0, Math.round(want * FPS)));
    await paint(page, frameAt(fr / FPS, fr));
    await shoot(cdp, path.join(VERIFY, name + '.png'));
    /* the clock has to move between two captures — see renderFieldOnly. */
    await advance(STEP);
  }

  /* ---------- the reveal strip ----------
     the snap is 0.40s from the wind-up to the mark, which is five frames at
     twelve and twenty four at sixty, so the preview cannot answer whether it
     reads as one shock any more than it can answer whether a 0.10s lunge reads
     as a bite. twenty stills a sixtieth apart across the anticipation, the pull
     and the overshoot, full frame, because the point of it is the whole frame. */
  const rdir = path.join(VERIFY, 'reveal');
  fs.mkdirSync(rdir, { recursive: true });
  for (let i = 0; i < 20; i++) {
    const t = +(HIT - 2 / 60 + i / 60).toFixed(4);
    const fr = Math.round(t * FPS);
    await paint(page, frameAt(t, fr));
    await shoot(cdp, path.join(rdir, 'r' + String(i).padStart(2, '0')
      + '-' + t.toFixed(3) + 's.png'));
    await advance(STEP);
  }

  /* ---------- one pill, at three times ----------
     the legibility argument, as a picture. it is the same crop `--field`
     writes, taken here as well so it lands on every run rather than only when
     somebody remembers the flag. */
  {
    const fr = Math.round(SETTLED * FPS);
    await paint(page, frameAt(fr / FPS, fr));
    const c = (await page.evaluate(() => window.__p16.measure())).pill.cssRect;
    const pad = 14;
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: Math.max(0, c.x - pad), y: Math.max(0, c.y - pad),
        width: c.w + pad * 2, height: c.h + pad * 2, scale: 3 },
    });
    fs.writeFileSync(path.join(VERIFY, 'one-pill-3x.png'), Buffer.from(shot.data, 'base64'));
    await advance(STEP);
  }

  await browser.close();
  srv.close();
  if (SUB > 1) blend(N);

  const state = {
    built, meas, sigs, frames: N,
    field: fieldWorst, fieldSamples,
    hero: heroWorst, heroSamples, bandHits,
  };
  fs.writeFileSync(path.join(OUT, 'post16.json'), JSON.stringify(state, null, 2));
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
  const out = path.join(OUT, 'post16-dark-1080x1920.mp4');
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
   five events, and every one of them is a time something else already decided.
   nothing here is placed by hand and nothing here is a new recipe.

     the happy bleep     `chirp`, on the frame the first nod bottoms out, which
                         is `agreeing`'s own mark. it is a rising tone and the
                         file already says why: a tone that rises has agreed
                         with you, and a tone that sits still is a smoke alarm.
     the impact          `popDeep`, on the hit, taken lower and longer than its
                         defaults — 78 to 42 hertz over a third of a second,
                         which is a body thump rather than a click. it is the
                         only sound in the clip with any weight in it because
                         it is the only thing in the clip that lands.
     the flat sad bleep  `chirp` again, and this is the interesting one. the
                         brief asks for flat and sad, so it is the same voice
                         with the glide taken nearly out of it and pointed
                         down: 430 to 372 hertz, a whole tone, over a glide that
                         does not finish inside the note. `annoyed` was the
                         other candidate and it is two notes, which is two
                         events on a beat the brief gives one to; `sigh` is
                         breath rather than a bleep.
     the two glitches    `glitch`, on both faults. the second is shorter and
                         lower, because it is a cut to a card rather than
                         something being taken away.

   **and there is a gap in the middle with nothing in it, on purpose.** einz
   puts the trending sound on in the app, and the place a track's own drop lands
   is immediately after a bass hit. so from the impact to the slow blink there
   is 1.2 seconds with not one cue in it, and that is guarded rather than
   claimed: anything creeping into it would be the reveal or the blink drifting.

   `mascotCues(plan)` is not used. it offers a `ding` on the agreement beat, and
   `ding` means yes everywhere in demo/ and would be a second sound on a beat
   the brief gives one bleep. the call is made below so the report can say what
   was declined rather than leaving it unsaid. */
const CUES_DECLINED = mascotCues(plan);
const GAP = { from: +(HIT + 0.42).toFixed(4), to: +(BLINK_AT - 0.06).toFixed(4) };
function soundCues() {
  const cues = [
    { t: plan.marks[1].settled, kind: 'chirp',
      opts: { f0: 640, f1: 940, len: 0.10, tau: 0.050 },
      from: 'the first nod bottoming out, off agreeing\'s own mark' },
    { t: HIT, kind: 'popDeep',
      opts: { f0: 78, f1: 42, tau: 0.14, len: 0.34 },
      from: 'the hit, and the snap out starts on the same frame' },
    { t: BLINK_AT, kind: 'chirp',
      opts: { f0: 430, f1: 372, len: 0.15, tau: 0.075, glide: 0.72, third: 0.28 },
      from: 'the middle of the slow blink, off the idle schedule' },
    { t: GLA.at, kind: 'glitch', from: 'the first fault, and he goes' },
    { t: GLB.at, kind: 'glitch', opts: { len: 0.10, f0: 220, f1: 78 },
      from: 'the second fault, and the wordmark arrives' },
  ];
  return cues.sort((a, b) => a.t - b.t);
}

/* ==========================================================================
   go
   ========================================================================== */
console.log('the boring tek — post16, one small change');
console.log('');
console.log(describeMascot(plan));
const rep = mascotMotion(plan, FPS, SECONDS);
const rep60 = FPS === 60 ? rep : mascotMotion(plan, 60, SECONDS);
console.log(describeMotion(rep60));
console.log('');
console.log(describeCamera(cam));
console.log('');

const camMo = cameraMotion(cam, 60);
const camZ = (() => {
  let lo = Infinity, hi = -Infinity, at = 0;
  for (let f = 0; f <= Math.round(60 * SECONDS); f++) {
    const z = cameraFrame(cam, f / 60).z;
    if (z < lo) { lo = z; at = +(f / 60).toFixed(3); }
    hi = Math.max(hi, z);
  }
  return { lo: +lo.toFixed(4), hi: +hi.toFixed(4), at };
})();

console.log('the camera');
console.log('  z ' + CAM.start.z + ' to ' + CAM.to + ', which is a snap of x'
  + SNAP_BY.toFixed(4) + ' — under one, which is the inversion');
console.log('  the widest frame is z ' + camZ.lo + ' at ' + camZ.at
  + 's, which is the overshoot with the drift on it');
console.log('  the frame shows ' + WIN.tight.w.toFixed(0) + ' x ' + WIN.tight.h.toFixed(0)
  + ' page px at its tightest and ' + WIN.wide.w.toFixed(0) + ' x ' + WIN.wide.h.toFixed(0)
  + ' at its widest, over the reveal');
console.log('  minZoomFor says ' + minZoomFor(cam).z.toFixed(4)
  + ' and this plan goes under it, which is the one place a house guard is '
  + 'answered by a different measurement — see the header');
console.log('');

console.log('the field');
console.log('  the core rect is ' + CORE.w.toFixed(0) + ' x ' + CORE.h.toFixed(0)
  + ' page px at ' + CORE.x.toFixed(0) + ', ' + CORE.y.toFixed(0)
  + ' — the tightest frame, inset ' + FIELD.inset + ', under the band');
console.log('  the band maps back to page y ' + WIN.band.y.toFixed(0) + '..'
  + (WIN.band.y + WIN.band.h).toFixed(0) + ' over the reveal, and the field starts '
  + FIELD.bandGap + 'px under it');
console.log('  ' + FIT.cols + ' by ' + FIT.rows + ' solves to ' + FIT.size
  + 'css px, a pill of ' + FIT.pill.w + ' x ' + FIT.pill.h + ' and a cap of '
  + FIT.capPx + ' device px');
console.log('  ' + CORE_PILLS.length + ' core labels and ' + BLEED_PILLS.length
  + ' bleed, ' + PILLS.length + ' pills in all. ' + PILLS.filter(p => p.onHim).length
  + ' of them reach him: ' + PILLS.filter(p => p.front).length + ' drawn in front, '
  + FORCED_BACK + ' behind him because they reach his face');
console.log('  his face window is ' + FACE_HOT.w.toFixed(0) + ' x ' + FACE_HOT.h.toFixed(0)
  + ' page px and the front window ' + LIT_HOT.w.toFixed(0) + ' x ' + LIT_HOT.h.toFixed(0));
console.log('  they cover ' + (FIT.cover * 100).toFixed(0) + '% of the core rect in ink; '
  + 'the worst covered core label still shows ' + (OCC.worst.vis * 100).toFixed(0)
  + '% of itself and the mean is ' + (OCC.mean * 100).toFixed(0) + '%, on the best of '
  + '500 searched layouts (seed ' + FIELD_PICK.seed + ')');
console.log('  the trade, for the record: '
  + ALT.map(a => a.n + ' labels would be a ' + a.capPx + 'px cap').join(', ')
  + ', against ' + FIELD.n + ' at ' + FIT.capPx);
console.log('  the hero label is a ' + HERO_AT.capPx + 'px cap, over BUBBLE.minCap\'s '
  + BUBBLE.minCap + ', and it sits ' + HERO.gap + 'px over his crown ('
  + HERO_AT.inkTop.toFixed(0) + ' page y at ' + HERO_AT.inkAt + 's)');
console.log('  he sits ' + HEAD_DROP.d + ' page px under the middle of the safe band, which is'
  + ' what the label needs at z ' + CAM.start.z + ' (' + HEAD_DROP.need + ' screen px wanted, '
  + HEAD_DROP.have + ' there)');
console.log('');

console.log('the beats');
const beats = [
  [0, 'up. he is at rest in the middle of the frame with the idle layer running, '
    + 'the camera in at z ' + CAM.start.z],
  [HERO.at, 'the label floats in beside his head over ' + HERO.for.toFixed(2) + 's'],
  ...plan.marks.map(m => [m.t, m.state.padEnd(12) + ' settles ' + m.settled.toFixed(2)
    + ', holds to ' + m.leaving.toFixed(2)
    + (m.turn != null ? ', turn to ' + m.turn.toFixed(2) : '')]),
  [TEXT.in + TEXT.for, '"' + TEXT.one.join(' ') + '" is up in the band'],
  [plan.marks[1].settled, 'the first nod bottoms out, and the happy bleep is on it'],
  [HIT, 'the hit: the snap out begins, the shake begins, ' + CORE_PILLS.length
    + ' labels are born and the top line is cut'],
  [TX2_AT, '"' + TEXT.two.join(' ') + '" lands, as the frame settles'],
  [SHAKE_END, 'the knock is over'],
  [SETTLED, 'and the frame has stopped, at z ' + CAM.to],
  [plan.marks[2].settled, 'his eyes are flat, brows down, straight down the lens'],
  [BLINK_AT, 'the slow blink, ' + ((BLINK.close + BLINK.hold + BLINK.open) * 1000).toFixed(0)
    + 'ms of it, and the flat sad bleep is on it'],
  [GLA.at, 'the first fault, ' + GLA.for.toFixed(2) + 's of it, and he is cut. the labels stay'],
  [GLB.at, 'the second fault, ' + GLB.for.toFixed(2) + 's, and the labels are cut'],
  [WM_IN, 'the wordmark snaps in over ' + GLB.wmFor.toFixed(2) + 's and holds '
    + (SECONDS - WM_IN - GLB.wmFor).toFixed(2) + 's'],
  [SECONDS, 'end'],
].sort((a, b) => a[0] - b[0]);
for (const [t, what] of beats) console.log('  ' + t.toFixed(2) + 's  ' + what);
console.log('');

/* ---------- the sound ---------- */
const cues = soundCues();
const { buf: sfx, report: sfxReport } = renderSfx(cues, SECONDS);
const WAV = path.join(OUT, 'post16-sfx.wav');
const RAW = path.join(OUT, 'post16-sfx-raw.wav');
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
  'the gap': 'nothing at all from ' + GAP.from.toFixed(2) + 's to ' + GAP.to.toFixed(2)
    + 's, which is where the trending sound goes',
  'declined': CUES_DECLINED.length + ' cue(s) from mascotCues — '
    + CUES_DECLINED.map(c => c.kind + ' at ' + c.t.toFixed(2)).join(', ')
    + ' — see the note above soundCues',
}));
console.log('');

/* the three voices, written out on every run for somebody who can actually
   listen: they are chosen on numbers and nothing in this pipeline can hear.
   it lands in demo/out/p16-sound/, which is regenerable and gitignored. */
const SND = path.join(OUT, 'p16-sound');
fs.mkdirSync(SND, { recursive: true });
for (const c of cues) {
  if (c.kind === 'glitch' && fs.existsSync(path.join(SND, 'glitch.wav'))) continue;
  const name = c.kind === 'chirp'
    ? (c.opts.f1 > c.opts.f0 ? 'bleep-happy' : 'bleep-flat-sad')
    : c.kind;
  writeWav(path.join(SND, name + '.wav'), VOICES[c.kind](c.opts || {}));
}
console.log('  the bleeps and the hit are in ' + path.relative(ROOT, SND)
  + ' for somebody who can listen');
console.log('');

/* ---------- the field on its own, first ---------- */
if (FIELD_ONLY) {
  const m = await renderFieldOnly();
  console.log('the field alone, the reveal, the settle and one pill at three times, in '
    + path.relative(ROOT, path.join(VERIFY, 'field')));
  console.log('  a rendered pill is ' + m.pill.cssRect.w.toFixed(1) + ' x '
    + m.pill.cssRect.h.toFixed(1) + ' css against a solve of ' + FIT.pill.w + ' x ' + FIT.pill.h
    + ', cap ' + m.pill.capPx + ' device px');
  process.exit(0);
}

const state = ONLY_ENCODE
  ? JSON.parse(fs.readFileSync(path.join(OUT, 'post16.json'), 'utf8'))
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
if (state.field) {
  console.log('  the field as rendered, at its tightest (' + state.field.t + 's): reaches '
    + state.field.left + ' left / ' + state.field.top + ' top / ' + state.field.right
    + ' right / ' + state.field.bottom + ' bottom past the frame, in device px');
}
if (state.hero) {
  console.log('  the hero label as rendered, at its tightest (' + state.hero.t + 's): clear '
    + state.hero.left + ' left / ' + state.hero.top + ' top / ' + state.hero.right
    + ' right / ' + state.hero.bottom + ' bottom');
}
console.log('  a still per beat in ' + path.relative(ROOT, VERIFY)
  + ', the reveal strip in ' + path.relative(ROOT, path.join(VERIFY, 'reveal')));

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
check(SECONDS >= 5 && SECONDS <= 6,
  'the clip runs ' + SECONDS.toFixed(2) + 's, and the brief asks for five to six');

/* ---------- the camera, and the inversion ---------- */
check(Math.abs(cam.start.z - CAM.start.z) < 1e-6,
  'the zoom window did not quietly clamp the start: asked for ' + CAM.start.z
  + ', resolved to ' + cam.start.z + ', window ' + cam.zoom.min + ' to ' + cam.zoom.max);
{
  const f = cameraFrame(cam, SETTLED);
  check(Math.abs(f.legZ * f.snap - CAM.to) < 1e-4,
    'and the snap lands where it was aimed: the leg zoom at ' + SETTLED
    + 's times the snap is ' + (f.legZ * f.snap).toFixed(4) + ' against the ' + CAM.to
    + ' asked for');
}
check(SNAP_BY < 1,
  'the snap is a zoom out: by x' + SNAP_BY.toFixed(4) + ', which is under one');
check(CAM.snap.anticipate < 0,
  'and its wind-up is a push in, which is what a negative anticipate is: sz goes to '
  + (1 - CAM.snap.anticipate).toFixed(3) + ' before the pull');
check(camMo.still === 0, 'no frame of the camera repeats the one before it: ' + camMo.still + ' still frames');
/* ---------- the snap is a move and not a cut ----------
   post15's guard here is a flat ceiling — an eighth of the frame in one frame —
   and it is the right guard for a clip whose camera only ever glides. this one
   snaps, and a snap out across half the frame's scale in 0.30s moves the
   transform 87 css px on its fastest frame, which is 16% of the frame width and
   is **what the brief asked for**. a ceiling written for a glide would fail it
   for being a snap.

   so the test is `lib/camera.mjs`'s own, the one `shakeEnv` is proved with:
   sample four times as densely and the worst one frame step must come down. a
   move that is really a move has a derivative, so at 240Hz its worst step is
   about a quarter of the 60Hz one; a cut has no derivative and reports the same
   number at both rates. that is the difference between a snap and a jump, and
   it is also exactly what decides whether `--blur` smears it correctly. the
   flat ceiling stays as a backstop, at a quarter of the frame. */
{
  const s60 = camMo.worst.move.d;
  const s240 = cameraMotion(cam, 240).worst.move.d;
  const ratio = s240 / s60;
  check(ratio < 0.6,
    'the snap is a move rather than a cut: worst one frame step ' + s60 + 'px at 60Hz and '
    + s240 + 'px at 240Hz, a ratio of ' + ratio.toFixed(3) + ' where a held signal reports 1.000');
  check(s60 < VW / 4,
    'and it stays under the backstop: ' + s60 + 'px against a quarter of the frame ('
    + (VW / 4) + 'px), on the frame at ' + camMo.worst.move.t + 's');
}
check(camMo.shakeMax > 2 && camMo.shakeMax < 20,
  'the knock peaks at ' + camMo.shakeMax + ' css px, which is a short shake rather than a throw');
{
  /* the camera has to be over before he starts going flat: a camera still
     moving under a state change is two moves at once and neither of them
     reads. */
  check(SNAP_END <= CUT.marks[2].t + 1e-6,
    'the snap is finished (' + SNAP_END.toFixed(2) + 's) before he goes flat ('
    + CUT.marks[2].t.toFixed(2) + 's)');
  check(SHAKE_END <= CUT.marks[2].t + 1e-6,
    'and so is the knock, at ' + SHAKE_END.toFixed(2) + 's');
  check(SETTLED === SNAP_END,
    'and the frame stops on the snap rather than on the knock, which is what the field '
    + 'is sized against: settled at ' + SETTLED + 's');
}

/* ---------- the reveal is one frame ---------- */
{
  const before1 = frameAt((REVEAL_FRAME - 1) / FPS, REVEAL_FRAME - 1);
  const on = frameAt(REVEAL_FRAME / FPS, REVEAL_FRAME);
  check(before1.field === 0 && on.field === 1,
    'the ' + CORE_PILLS.length + ' labels arrive on one frame: nothing at frame '
    + (REVEAL_FRAME - 1) + ', all of them at ' + REVEAL_FRAME);
  check(before1.hero.o > 0.9 && on.hero.o === 0,
    'and the hero label is cut on the same frame, so the frame exchanges one label for '
    + CORE_PILLS.length + ' and is never empty');
  check(before1.tx.one > 0.9 && on.tx.one === 0 && on.tx.two === 0,
    'and the top line is cut on the same frame: "' + TEXT.one.join(' ') + '" is up at frame '
    + (REVEAL_FRAME - 1) + ' and gone at ' + REVEAL_FRAME);
  {
    const b2 = frameAt((TX2_FRAME - 1) / FPS, TX2_FRAME - 1);
    const o2 = frameAt(TX2_FRAME / FPS, TX2_FRAME);
    check(b2.tx.two === 0 && o2.tx.two === 1 && TX2_FRAME > REVEAL_FRAME,
      'and "' + TEXT.two.join(' ') + '" lands ' + ((TX2_AT - REVEAL_AT) * 1000).toFixed(0)
      + 'ms later at frame ' + TX2_FRAME + ', as the frame settles');
  }
  check(Math.abs(REVEAL_AT - HIT) <= 1 / FPS + 1e-9,
    'the reveal frame is within one frame of the hit at both rates: ' + REVEAL_AT
    + 's at ' + FPS + ', ' + (Math.ceil(HIT * 12) / 12).toFixed(4) + 's at twelve, '
    + (Math.ceil(HIT * 60) / 60).toFixed(4) + 's at sixty');
}

/* ---------- the field ---------- */
check(CORE_PILLS.length === FIELD.n,
  'the count is ' + CORE_PILLS.length + ' core labels, fully inside the frame on every '
  + 'frame after the camera stops, against the ' + FIELD.n + ' asked for');
check(FIT.capPx >= FIELD.minCapPx,
  'a core label\'s cap measures ' + FIT.capPx + ' device px against this clip\'s stated floor of '
  + FIELD.minCapPx + '. it is under BUBBLE.minCap\'s ' + BUBBLE.minCap
  + ' and the header argues why: the string is read once at ' + HERO_AT.capPx + 'px first');
check(FIT.cover >= 0.85,
  'the labels cover ' + (FIT.cover * 100).toFixed(0) + '% of the core rect in ink, which is '
  + 'what "covered in labels" is measured as');
check(OCC.worst.vis >= 0.62,
  'no core label is buried: the worst covered one still shows ' + (OCC.worst.vis * 100).toFixed(0)
  + '% of itself (cell ' + OCC.worst.cell.join(',') + '), mean ' + (OCC.mean * 100).toFixed(0)
  + '%, on the best of 500 searched layouts');
check(OCC.mean >= 0.85,
  'and the field is not a pile: the mean core label shows ' + (OCC.mean * 100).toFixed(0) + '%');
{
  /* every core label, on every frame after the knock, mapped through the camera
     and checked against the frame. it is the layout's own promise and it is
     walked rather than argued. */
  let worst = null;
  const f0 = Math.ceil(SETTLED * 60), f1 = Math.round(GLB.at * 60);
  for (let f = f0; f <= f1; f++) {
    const c = cameraFrame(cam, f / 60);
    for (const L of CORE_PILLS) {
      const sr = rectToScreen(c, L.rect);
      const near = Math.min(sr.x, sr.y, VW - (sr.x + sr.w), VH - (sr.y + sr.h));
      if (!worst || near < worst.near) worst = { t: +(f / 60).toFixed(2), near: +near.toFixed(2), cell: L.cell };
    }
  }
  check(worst.near >= 0,
    'every core label is fully in frame from the moment the camera stops (' + SETTLED + 's) to the cut: worst ' + worst.near
    + ' css px of air at ' + worst.t + 's (cell ' + worst.cell.join(',') + ')');
}
{
  /* and no label, core or bleed, ever touches the band. it is the one thing the
     field may not cover. */
  let hits = 0, worstT = null;
  const f0 = Math.ceil(TX2_AT * 60), f1 = Math.round(GLB.at * 60);
  for (let f = f0; f <= f1; f++) {
    const c = cameraFrame(cam, f / 60);
    for (const L of PILLS) {
      if (overlaps(rectToScreen(c, L.rect), BAND)) { hits++; if (worstT == null) worstT = +(f / 60).toFixed(2); }
    }
  }
  check(hits === 0, 'no label of the ' + PILLS.length + ' enters the caption band at screen y '
    + BAND.y + '..' + (BAND.y + BAND.h) + ' on any frame a caption is up for: ' + hits + ' frames'
    + (worstT == null ? '' : ', first at ' + worstT + 's'));
}
{
  /* the face rule, re-measured rather than trusted: no label in front of him
     may reach his eye or brow ink on any frame. */
  let hits = 0;
  const f0 = Math.ceil(REVEAL_AT * 60), f1 = Math.round(GLA.at * 60);
  for (let f = f0; f <= f1; f++) {
    const fr = faceRect(mascotFrame(plan, f / 60));
    for (const L of PILLS) if (L.front && overlaps(L.rect, fr)) hits++;
  }
  check(hits === 0,
    'no label in front of him ever covers his eyes or brows: ' + hits + ' frames, over a face '
    + 'window of ' + FACE_HOT.w.toFixed(0) + ' x ' + FACE_HOT.h.toFixed(0) + ' page px with '
    + FIELD.faceClear + 'px of air on it');
  check(PILLS.filter(x => x.front).length >= 3,
    PILLS.filter(x => x.front).length + ' labels are drawn in front of him and '
    + FORCED_BACK + ' went behind him because they reach his face, which is what '
    + 'the brief\'s "some behind him some in front" is worth');
  check(PILLS.filter(x => !x.front && overlaps(x.rect, { x: PLATE.cx - PLATE.r, y: PLATE.cy - PLATE.r, w: PLATE.r * 2, h: PLATE.r * 2 })).length >= 2,
    'and some are behind his plate, which is the other half of it');
}

/* ---------- the field crosses the platform safe area, on purpose ----------
   the house checklist says nothing we draw may sit inside the platform margins,
   and it is the right rule for copy. **the field is not copy, it is a
   texture**, and it is the same argument post15 made about the bug walking in
   through the left margin: every side of the frame is outside the safe area, so
   there is no field that covers the frame and also never crosses a safe line,
   and a field pulled inside the margins is not a covered screen, it is a
   rectangle of labels floating in a black border.

   what the rule protects is the copy that has to be read, and all of that is
   inside the margins and guarded above: the caption, the hero label and the end
   card. this counts how many of the forty seven are fully inside the safe area
   anyway, so the decision is a number in the report rather than a silence. */
{
  const c = cameraFrame(cam, SETTLED);
  const safeRect = {
    x: SAFE_CSS.left, y: SAFE_CSS.top,
    w: VW - SAFE_CSS.left - SAFE_CSS.right, h: VH - SAFE_CSS.top - SAFE_CSS.bottom,
  };
  const inSafe = CORE_PILLS.filter(L => inside(rectToScreen(c, L.rect), safeRect)).length;
  check(inSafe >= 18,
    inSafe + ' of the ' + CORE_PILLS.length + ' core labels sit fully inside the platform safe '
    + 'area and the rest cross it deliberately, because a field that covers the frame has to. '
    + 'every piece of copy that has to be read is inside it and guarded separately');
}

/* ---------- the type ---------- */
check(HERO_AT.capPx >= BUBBLE.minCap,
  'the hero label clears the module\'s own copy floor: ' + HERO_AT.capPx + ' device px of cap '
  + 'against ' + BUBBLE.minCap);
if (state.meas) {
  const m = state.meas;
  check(Math.abs(m.pill.cssRect.w - FIT.pill.w) <= 3 && Math.abs(m.pill.cssRect.h - FIT.pill.h) <= 3,
    'a rendered field pill is ' + m.pill.cssRect.w.toFixed(1) + ' x ' + m.pill.cssRect.h.toFixed(1)
    + ' css against the solve\'s ' + FIT.pill.w + ' x ' + FIT.pill.h
    + ', so the layout was solved on the face that actually rendered');
  check(Math.abs(m.pill.capPx - FIT.capPx) <= 2,
    'and its cap measures ' + m.pill.capPx + ' device px against the solve\'s ' + FIT.capPx);
  check(m.pills === PILLS.length,
    'the dom holds ' + m.pills + ' field pills, against ' + PILLS.length + ' placed');
  check(m.tx1.capPx >= TEXT.minCapPx && m.tx2.capPx >= TEXT.minCapPx,
    'the top line\'s caps measure ' + m.tx1.capPx + ' and ' + m.tx2.capPx
    + ' device px, floor is ' + TEXT.minCapPx);
  check(Math.abs(m.tx1.sizeCss - m.tx2.sizeCss) < 0.01,
    'both top lines are set at ' + m.tx1.sizeCss + 'css px, so the swap does not change the type');
  check(Math.min(m.tx1.left, m.tx1.top, m.tx1.right, m.tx1.bottom) >= floorDev
    && Math.min(m.tx2.left, m.tx2.top, m.tx2.right, m.tx2.bottom) >= floorDev,
    'both top lines clear the platform safe area: ' + m.tx1.left + '/' + m.tx1.top + '/'
    + m.tx1.right + '/' + m.tx1.bottom + ' and ' + m.tx2.left + '/' + m.tx2.top + '/'
    + m.tx2.right + '/' + m.tx2.bottom + ', floor ' + floorDev);
  check(m.wm.capPx >= WM.minCapPx,
    'the wordmark caps measure ' + m.wm.capPx + ' device px, floor is ' + WM.minCapPx);
  check(Math.min(m.wm.left, m.wm.top, m.wm.right, m.wm.bottom) >= floorDev,
    'the wordmark clears the platform safe area: ' + m.wm.left + ' left, ' + m.wm.top
    + ' top, ' + m.wm.right + ' right, ' + m.wm.bottom + ' bottom, floor ' + floorDev);
  check(!overlaps(m.wm.cssRect, BAND),
    'the wordmark clears the band too: it sits ' + m.wm.cssRect.y.toFixed(0) + '..'
    + (m.wm.cssRect.y + m.wm.cssRect.h).toFixed(0) + ' css');
  check(state.built.headPx >= HEAD_PX.min && state.built.headPx <= HEAD_PX.max,
    'the head rendered at ' + state.built.headPx + ' device px, window is '
    + HEAD_PX.min + ' to ' + HEAD_PX.max);
}

/* ---------- what the render measured ---------- */
if (state.field) {
  const near = Math.min(state.field.left, state.field.right, state.field.bottom);
  check(near >= 0,
    'the field covered the three open sides of the frame on all ' + state.fieldSamples
    + ' rendered samples: its envelope reaches ' + near + ' device px past the nearest of them at '
    + state.field.t + 's. this is what replaces __cam.edges() here — see the header');
  check(state.field.top < 0,
    'and it stops under the caption band rather than running into it: '
    + (-state.field.top) + ' device px of clear black over the field at the top, which is '
    + 'where the words are');
}
if (state.hero) {
  check(state.hero.air >= 0,
    'the hero label clears the safe area on all ' + state.heroSamples + ' samples it is up for: '
    + state.hero.air + ' device px at ' + state.hero.t + 's');
}
check(state.bandHits.length === 0,
  'nothing this file draws enters the caption band: '
  + (state.bandHits.length ? state.bandHits.join(', ') : 'no frame does'));
{
  const seen = new Set();
  let dupes = 0;
  for (const s of state.sigs) { if (seen.has(s)) dupes++; seen.add(s); }
  check(dupes === 0, 'no two frames of the film are identical: ' + dupes + ' repeats in '
    + state.sigs.length + ' frames');
}

/* ---------- the head, through the camera ---------- */
{
  let worst = null, bandFrames = 0;
  for (let f = 0; f < Math.round(60 * SECONDS); f++) {
    const t = f / 60;
    if (f >= Math.round(GLA.at * 60)) break;
    const c = cameraFrame(cam, t);
    const hp = headPageRect(mascotFrame(plan, t));
    const sr = rectToScreen(c, hp.rect);
    const air = safeAir(sr);
    const near = Math.min(air.left, air.top, air.right, air.bottom);
    if (!worst || near < worst.near) worst = { t: +t.toFixed(2), near: +near.toFixed(1), ...air };
    if (overlaps(sr, BAND)) bandFrames++;
  }
  check(worst.near >= 0,
    'his head clears the platform safe area on every frame he is on, mapped through the camera: '
    + worst.near + ' device px at ' + worst.t + 's (' + worst.left + ' left, ' + worst.top
    + ' top, ' + worst.right + ' right, ' + worst.bottom + ' bottom)');
  check(bandFrames === 0, 'and it never enters the caption band: ' + bandFrames + ' frames');
}

/* ---------- the rig ---------- */
check(rep60.frozenFrames === 0, 'the face is never frozen: ' + rep60.frozenFrames + ' frames');
check(rep60.maxSquash <= 0.081, 'the squash peaks at ' + (rep60.maxSquash * 100).toFixed(1) + '%');
check(rep60.maxBreathe <= 0.021, 'the breathing peaks at ' + (rep60.maxBreathe * 100).toFixed(2) + '%');
{
  const inWin = plan.idle.blinks.filter(b => b.t >= BLINK_WINDOW[0] && b.t <= BLINK_WINDOW[1]);
  check(inWin.length === 1,
    'exactly one idle blink lands in the flat beat (' + BLINK_WINDOW[0].toFixed(2) + ' to '
    + BLINK_WINDOW[1].toFixed(2) + '): ' + inWin.length + ', at ' + BLINK.t.toFixed(2) + 's');
  check(SEED.len >= 0.26,
    'and it is a slow one: ' + (SEED.len * 1000).toFixed(0) + 'ms of lid, out of a search over '
    + 'six thousand seeds. seed ' + SEED.seed);
}
check(plan.marks[2].turn === 0,
  'he comes back to camera on the flat beat: turn to ' + plan.marks[2].turn
  + ', so the last thing he does is look down the lens');

/* ---------- the end ---------- */
{
  const before1 = frameAt((HIM_CUT_FRAME - 1) / FPS, HIM_CUT_FRAME - 1);
  const on = frameAt(HIM_CUT_FRAME / FPS, HIM_CUT_FRAME);
  check(before1.mo === 1 && on.mo === 0 && on.field === 1,
    'the first fault takes him and leaves the field: he is on at frame ' + (HIM_CUT_FRAME - 1)
    + ' and gone at ' + HIM_CUT_FRAME + ', where the field is still up');
}
{
  const before1 = frameAt((FIELD_CUT_FRAME - 1) / FPS, FIELD_CUT_FRAME - 1);
  const on = frameAt(FIELD_CUT_FRAME / FPS, FIELD_CUT_FRAME);
  check(before1.field === 1 && on.field === 0 && on.wm.o > 0,
    'the wordmark is born on the frame the field is cut: labels on at frame '
    + (FIELD_CUT_FRAME - 1) + ' and gone at ' + FIELD_CUT_FRAME + ', where the wordmark is '
    + 'already at ' + on.wm.o);
  check(HIM_CUT_FRAME < FIELD_CUT_FRAME,
    'and the two faults are in the right order, ' + ((GLB.at - GLA.at) * 1000).toFixed(0)
    + 'ms apart');
}
check(GL_WINDOWS_60.length === 2,
  'there are exactly two faults, ' + GL_WINDOWS_60.map(w => w.frames + ' frames').join(' and ')
  + ' of them at sixty');
{
  /* read off the cue list rather than off the report: `renderSfx` rounds a cue
     time to a thousandth for its table, and a guard that reads a rounded number
     is a guard about the printing. */
  const late = cues.filter(c => c.t > GLB.at + 1e-6);
  check(late.length === 0, 'nothing is heard after the last fault: ' + late.length
    + ' cues past ' + GLB.at + 's');
  const inGap = cues.filter(c => c.t > GAP.from && c.t < GAP.to);
  check(inGap.length === 0,
    'the gap for the trending sound is clear: ' + inGap.length + ' cues between '
    + GAP.from.toFixed(2) + 's and ' + GAP.to.toFixed(2) + 's, which is '
    + (GAP.to - GAP.from).toFixed(2) + 's of nothing right after the hit');
  check(cues.filter(c => c.kind === 'chirp').length === 2,
    'two bleeps and they are the same voice: one rising on the yes, one nearly flat and '
    + 'falling on the blink');
}
check(peak.reduction <= LIMIT_ALLOW + 0.3,
  'the limiter took ' + peak.reduction.toFixed(2) + ' dB, allowance is ' + LIMIT_ALLOW);

/* ---------- and lib is untouched ---------- */
check(plan.band === null,
  'planMascot was handed no band, because this clip\'s band is a screen rectangle and the '
  + 'module checks page rectangles — see the header');

console.log('');
for (const m of note) console.log('  ok    ' + m);
for (const m of fail) console.log('  FAIL  ' + m);
console.log('');
console.log(fail.length ? '  ' + fail.length + ' GUARD(S) FAILED' : '  all ' + note.length + ' guards green');
process.exit(fail.length ? 1 : 0);
