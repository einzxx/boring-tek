/* the boring tek — post14, the fable 5.1 news flash.

   ten seconds on white, 1080x1920. the mascot is big in the middle of an empty
   page, delighted, with `fable 5.1 out` in a thought bubble over his head. the
   signal tears, he is gone, it tears again and he is back in his corner at his
   ordinary size. the anthropic logo glitches in at the top and turns, slowly,
   for the rest of the clip. then three facts, read warm and quick, captioned in
   the middle of the frame, and the wordmark.

     node post14.mjs                     1080x1920, 60fps, shutter closed
     DEMO_FPS=12 node post14.mjs         the fast preview pass
     node post14.mjs --blur              60fps with the shutter open
     node post14.mjs --blur=6            a wider shutter
     node post14.mjs --plan              every plan printed, nothing rendered
     node post14.mjs --keep-frames       leave the jpegs on disk
     node post14.mjs --encode-only       re-encode from kept frames

   one output, one path, overwritten every run:

     demo/out/post14-light-1080x1920.mp4

   ---------- what this one is ----------

   every clip in here so far is about us. this one is about somebody else's
   release, and the whole reason to make it is that a feed rewards being early
   about a thing people already care about. so it is short, it is bright, and
   the brand content is three words at the end, exactly where post12 and post13
   put theirs.

   it is the first light clip since post11 and the first one at all that puts
   somebody else's mark on the screen. it is also the first that **moves** the
   mascot: he is one plan in one place and the clip scales and places his zone
   per frame — see THE ZONE below. that is the piece post11's own backlog has
   been asking for since the day it was written down.

   ---------- the logo is an asset, and it is placed rather than drawn ----------

   `demo/assets/anthropic-logo.png` is dropped in as an `<img>` at its own
   aspect ratio and nothing is done to its pixels. no crop, no filter, no
   recolour, no redraw. it is 496x496 with an alpha channel and it renders at 76
   css px square, which is 152 device px.

   **the asset is the clay one rather than a black one.** the brief calls it the
   black version; the file is #e37d5b at full alpha, which is anthropic's own
   clay. the brief also says do not alter it and never recolour it, and those
   two instructions point in opposite directions, so the one that is a
   constraint wins over the one that is a description: it is placed exactly as
   it is and this paragraph is the report. one `filter` would make it black if
   that is what is wanted.

   the one thing that touches it is the glitch, and only on the three frames the
   glitch is on: an rgb split and the frame's own jitter, which is what the
   brief asks for in as many words. that is a fault laid over the picture for a
   twentieth of a second rather than a treatment of the mark. nothing else in
   this file reaches the image at all, and the torn bands are deliberately drawn
   **under** it so a band can never cover it. see THE TEAR.

   ---------- the shutter, and what rides it ----------

   post10's rule, unchanged, and post12 and post13 both carry the same note.
   with `--blur` every output frame is captured four times inside its own
   sixtieth of a second and the four are averaged, so anything written against
   `t` smears — which is what a turning mark and a springing end card both want.
   the glitch does not: a one frame rgb split written against `t` would be on
   for one subframe of four and land at a quarter strength. so the glitch is
   computed once per **output** frame and held across every capture of it.
   `glitchAt` takes `f`; everything else takes `t`. */

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  planCaptions, captionFrame, captionCss, captionMarkup, captionPage, describe, bareWord,
} from './lib/captions.mjs';
import {
  planMascot, mascotFrame, mascotMotion, mascotCss, mascotMarkup, mascotRuntime,
  mascotPagePlan, mascotCues, describeMascot, describeMotion, headRect,
  STAGE, SAFE, HEAD_PX, GRID, BUBBLE,
} from './lib/mascot.mjs';
import { speak, VOICE_OUT } from './lib/voice.mjs';
import {
  renderSfx, writeWav, limit, decode, mixdown, voiceEnvelope, applyGain,
  loudness, describeMix, checkUnderVoice, dbfs, SR,
} from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const LOGO_FILE = path.join(HERE, 'assets', 'anthropic-logo.png');

const TAG = 'post14-light';
const FRAMES = path.join(OUT, 'frames-' + TAG);
const SUBS = path.join(OUT, 'subframes-' + TAG);
const VERIFY = path.join(OUT, 'verify-post14');
const MP4 = path.join(OUT, TAG + '-1080x1920.mp4');
const WAV = path.join(OUT, TAG + '-mix.wav');
const STATE = path.join(OUT, TAG + '-1080x1920.json');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = STAGE.dsf;
const VW = STAGE.w, VH = STAGE.h;
const SAFE_CSS = {
  top: SAFE.top / DSF, bottom: SAFE.bottom / DSF,
  left: SAFE.left / DSF, right: SAFE.right / DSF,
};
const FLOOR = Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom);

const argv = process.argv.slice(2);
const ONLY_ENCODE = argv.includes('--encode-only');
const PLAN_ONLY = argv.includes('--plan');
const KEEP = argv.includes('--keep-frames');
const BLUR = argv.some(a => a.startsWith('--blur'));
const BLUR_ARG = (argv.find(a => a.startsWith('--blur=')) || '').split('=')[1];
const SUB = BLUR ? Math.max(2, Math.min(12, Number(BLUR_ARG) || 4)) : 1;
const SUBSTEP = STEP / SUB;

/* ---------- the read ----------
   three lines, exact copy, one `speak()` each so the delivery has a shape
   rather than a speed — post11's rig and post11's argument.

   **the rates sit around the house default, and that is the second cut.** the
   first one ran the three lines at +12, +18 and +6 per cent, on the argument
   that a news flash is quick and the clip had ten seconds to hold three facts.
   watched back it is not upbeat, it is hurried: a person telling somebody good
   news does not talk faster than they normally do, they talk with more shape.
   so the rate comes back to a person's own pace and the **shape** carries the
   register instead — the pitch is up on the headline and up on the payoff and
   nearly flat on the facts, so the reading rises, levels and rises again rather
   than climbing all the way through.

   measured at four rates on the real takes, words a second on the first line:
   +12% was 2.82, 0% is 2.52, -4% is 2.41 and -8% is 2.31. the house default is
   -8% and it is right for a statement to camera; this sits a shade over it on
   the two outer lines and lands at 2.3 to 2.4 on the two that carry the news.

   `gap` is the silence **after** the line, measured on the waveform rather than
   left to the synthesiser's own trailing air, and both of them are now a real
   breath rather than a join: a third of a second after the headline and nearly
   four tenths after the facts, which is what "breathe between lines" is in
   numbers. the read costs 0.9s more than the fast cut did and it is the best
   0.9s in the file. */
const LINES = [
  { text: 'claude fable 5.1 is out',
    rate: '-6%', pitch: '+3Hz', gap: 0.34 },
  { text: 'smarter, cheaper to run, fewer false blocks',
    rate: '-4%', pitch: '+1Hz', gap: 0.38 },
  { text: 'and claude code sessions can now talk to each other',
    rate: '-8%', pitch: '+3Hz', gap: null },
];

const SILENCE_DB = -46;            /* a take ends where it falls this far under its own peak */
const PRE = 0.05, POST = 0.08;     /* audio kept either side of a take's own words */
const EDGE_FADE = 0.008;

/* ---------- the frame ----------
   540x960 css at device scale two, which is the 1080x1920 master every clip in
   here renders at. the platform safe area is post9's, per edge, in device px:
   180 top, 220 bottom, 140 left and right. */

/* the caption's one home, and it does not move for any line. bottom anchored,
   so a card grows upward out of the line the last one sat on, and the band sits
   across the middle of the frame the way the brief asks — a two line card runs
   about 432..530 css, which straddles the frame's own middle at 480. */
const CAP_BOX = { x: 70, y: 320, w: 400, h: 210 };

/* ---------- the logo ----------
   centred at the top, inside the safe area, and it turns.

   `size` is the drawn square. the image is square, so the box is square, so
   nothing is distorted by construction rather than by promise — and it is
   asserted against the file's own natural size at render.

   **the clearance is measured on the turned box rather than on the square.** a
   square spinning about its centre sweeps a circle of its own diagonal, so what
   has to clear the platform's top line is `size * root two / 2` above the
   centre and not `size / 2`. at 76 css that is 53.7 css of reach, which puts
   the top of the sweep at 204 device px against a 180 floor. */
const LOGO = {
  /* 108 css, which is 216 device px and a fifth of the frame's width, up from
     76. what sets the ceiling is not the mark, it is the **sweep**: a square
     turning about its centre covers a circle of its own diagonal, so 108 reaches
     76.4 css in every direction and the centre cannot come closer to the top
     than 90 + 76.4. at 178 the top of the sweep lands on 203 device px against
     a 180 floor, which is 23 px of air rather than a hairline. */
  size: 108,
  cx: 270,
  cy: 178,
  /* one full turn, which is the ceiling the brief sets, over everything after
     it arrives. it is eased rather than linear: `GLIDE` is the house in out and
     a constant angular rate reads as a mechanism rather than as a drift. a full
     turn also lands the mark where it started, so the end card carries it the
     right way up. */
  turns: 1,
  /* it does not fade in: it is born on the frame the third fault lands and the
     fault is its arrival — see `frameAt`. this is only how long the turn waits
     before it starts, so the mark is still for a beat after it appears rather
     than arriving already moving. */
  in: 0.06,
};

/* ---------- the end card ----------
   post11's light end card, unchanged in shape: THE / BORING / TEK stacked on
   three lines the way the logo is actually drawn and the way index.html sets
   it, with the address under it in the lockup subline's treatment, and nothing
   else on it.

   `centreY` is not the middle of the frame. the mark is still turning at the
   top of it and the caption band is still under it, so the group is centred in
   the room between the two: the sweep reaches 210 css and the tallest caption
   reaches 432, so 320 is the middle of what is left. */
const END = {
  /* the width `BORING` occupies, in css px. smaller than post11's 330 because
     this frame is fuller than that one: the mark is turning at the top and the
     mascot is in his corner at the bottom. 240 puts the caps at 66 device px,
     which is over post13's own 56 floor with room to spare. */
  wordmarkW: 240,
  domW: 190,
  gap: 30,          /* clear air between the wordmark block and the address */
  /* ---------- the middle of the frame, and it is the frame's ----------
     it was 325, which is the middle of the room between the mark's sweep and the
     caption band, and on a rendered frame that reads as an end card sitting high
     with a hole under it. the group belongs in the middle of the picture.

     540x960 makes that 480, and it is the **frame's** middle rather than the
     safe band's, which is 470: the platforms take more off the bottom than the
     top, and a wordmark nudged up by five pixels to satisfy that is a wordmark
     nobody centred. 480 with a 190 css group spans 385..575, which is clear of
     the mark's sweep by 130 and of the mascot's corner by 135.

     what it costs is that the group now sits **where the captions are**, so the
     end card may not arrive until the last card is gone. that is derived in
     `main` off the caption plan's own last window rather than typed, and it is
     a guard rather than a hope. */
  centreY: 480,
  minCapPx: 48,     /* device px of cap on the wordmark. a floor */
  in: 0.28,         /* how long it takes to arrive */
};

/* how long the wordmark holds after it has finished arriving. it is the one
   number in the file that absorbs whatever the takes turn out to be, and there
   is a floor on it in the guards rather than a hope. */
const TAIL = 1.30;

/* ---------- the cut ----------
   four marks. the first is the whole opening and the other three are the
   corner.

   **the opening holds 2.52s and the bubble is back on the ordinary profile.**
   the first cut gave it 1.62s, which is the floor `planMascot` imposes on a
   `delighted` mark carrying a **quick** bubble, and the cost was written down
   at the time: 0.30s of full pill, because `BUBBLE.quick`'s hold is floored and
   capped at the same number and no amount of room changes it. with 2.52s the
   ordinary profile fits — 0.48s in, 0.74s of hold, 0.30s out — and the pill is
   fully up for **0.74s** rather than 0.30, which is the difference between a
   thought a viewer catches and one they are asked to read fast.

   what fills the rest of it is him. `delighted` is two hops with real lift and
   a small turn on the way up, and its own hold plus the idle layer's drift,
   breathing, saccades and blinks carry the beat to the fault. nothing else is on
   the screen: no mark, no panel, no caption. it is a small robot being pleased
   about something for two and a half seconds.

   he is cut at 2.32, which is 0.12s after the hit lands and 0.18s after the
   thought has finished leaving. */
/* the first hit. the window runs from here to `T_BACK` because it is chained,
   so this is not only when the fault starts, it is how long it is: 0.26s, which
   is the length the first cut proved and is inside the third of a second a tv
   glitch is allowed to outstay. */
const T_GONE = 2.26;
const T_BACK = 2.52;      /* the second. he is in the corner */
const T_LOGO = 2.62;      /* the third. the mark arrives at the top */
const VOICE_AT = 2.66;    /* where the first take's own sound starts */
const PANEL_AT = 2.78;    /* the chat panel rises, after the fault is over */

/* the three corner marks are placed against the read rather than typed, so
   moving a line moves the reaction with it. they are worked out in `main` off
   the voice's own beats and this is only the opening, which is the one mark
   that is not about a line. */
const OPENING_MARK = {
  t: 0.00, state: 'delighted', bubble: 'fable 5.1 out',
};

/* ---------- one reaction per line, and one bubble on each ----------
   the first cut had him arrive `curious`, sit still for three seconds, hop once
   and nod once. watched back that is a corner ornament rather than a character.
   he gets a state per line now, in the order the lines earn: curious at the
   news, agreeing at the three facts, delighted at the one that is actually
   good.

   each carries a short positive bubble on the **ordinary** profile, which is
   0.90s of full pill. that is three thoughts across eight seconds of corner,
   which is the ceiling rather than the rule — a fourth would be a mascot
   commenting on every clause. `offset` is how far into its own line the mark
   lands: on the first word for the two that are reactions to the whole line,
   and a shade later on the last, so the hop does not fight the caption arriving.

   `agreeing` is the one state in the table that earns a `ding`, and it stays on
   the line that is a list of three facts, which is the one worth agreeing with.
   post11's rule holds: the ding keeps meaning yes. */
const LINE_MARKS = [
  { line: 0, state: 'curious', bubble: 'yes', offset: -0.10 },
  { line: 1, state: 'agreeing', bubble: 'love it', offset: 0.12 },
  { line: 2, state: 'delighted', bubble: 'nice', offset: -0.10 },
];

/* and one after the read, so he settles onto the end card rather than holding a
   pose through it. no bubble: the last thing on the screen is the wordmark. */
const CALM_STATE = 'neutral';

/* ---------- the zone ----------
   the mascot module places one head, once, out of `plan.box` and `plan.size`,
   and this clip needs him in two places at two sizes. so the **plan is the
   corner one** — post11's exact placement, size 128, bottom left inside the
   safe area, which is what every guard in `lib/mascot.mjs` is written about —
   and the opening is that same mascot moved and scaled by a transform on his
   zone.

   it is one css rule this file adds at the id level and the module is not
   touched: `.m-zone` carries no transform of its own, so there is nothing to
   fight. the transform origin is the element's own centre, which is also the
   plate's centre, so the scale changes the extent and not the centre and the
   translate is simply where the head goes.

   what it costs is that `headRect` no longer answers on its own: it works the
   ink out of `plan.box` and knows nothing about a transform laid over the
   element. so `zoneRect` composes the two and the clearance guard reads that.
   the head is still computed rather than measured, for the module's own reason.

   `head` is the plate's width in css px. the corner is the module's own 120,
   which is 240 device px; the opening is 180, which is 360. the module's phone
   window is 220 to 280 and the plan is checked against it, because the corner
   is the placement the whole clip except its first second and a half is in. the
   opening is deliberately over that ceiling and it is a different question: a
   head alone in the middle of an empty frame is a hero shot, and the window is
   about a head sharing a frame with words. */
const PLACE = {
  corner: { head: 120, cx: null, cy: null, bubble: null },
  big: {
    head: 180, cx: 270, cy: 500,
    /* the bubble, and it is the one thing about the opening that had to be
       argued out on paper before a browser was opened.

       the module hangs the thought off the head's right shoulder, which is
       right for a mascot standing in a corner and impossible for one standing
       in the middle: the cluster measures 233 css px, the frame is 400 css wide
       inside the safe area, and a head centred at 270 leaves 130 to its right.
       there is no head size that fixes it — at a diameter of nought the pill
       still does not fit, because the cluster is wider than the half frame.

       so for this one beat it is re-anchored **above** him, and the dots that
       climb to it are this file's rather than the module's — see `THOUGHT`. it
       is a translate on `#m-bubble`, and the module writes nothing to that
       element except its visibility, so nothing is overridden and nothing is
       forked.

       and it is counter scaled back to natural size, so the pill is the same
       physical size in both placements and the caps floor is the same number in
       both. a bubble at 1.5x would be legible; two different bubble sizes in one
       clip would read as two different bubbles.

       `at` is where the cluster's own left bottom corner lands on the page. the
       pill's left edge is 30 css px right of it — the width the module's two
       dots and their gaps occupy in the flex row, which is layout this file does
       not move — and the pill's bottom edge is 22 above it, which is
       `BUBBLE.pillLift`. so the pill draws at 175..377.7 across and 310..372
       down, and his crown is at 410: **38 css px of air under the pill** where
       the first cut had 14, with the dot climb in it. */
    bubble: { at: { x: 145, y: 394 } },
  },
};

/* ---------- the thought's own dots ----------
   the module climbs **two** dots off the head, 8 and 12 css px, laid out as a
   flex row with the pill: same baseline, increasing x, fixed gaps. that is the
   site's own cluster and it is right for a mascot standing in a corner with the
   thought beside his head.

   it cannot do what this beat needs. the brief asks for three, smallest nearest
   him and growing toward the pill, and the pill is **above** him rather than
   beside him — so the climb is a diagonal, and a flex row cannot be a diagonal
   at any set of gaps.

   so for the opening beat the three dots are this file's, drawn in page
   coordinates, and the module's two are switched off. that is one line in
   `apply`, not a fork: `window.__p14.apply` always runs after
   `window.__mas.apply`, so writing the dots' opacity to nought after the module
   has written it is the same ordering `#m-zone`'s own opacity channel relies on.
   the pill is still the module's, still at the module's size, still on the
   module's own spring — nothing about what a thought *is* has been redrawn.

   **and the timing is the module's too.** each dot reads a channel out of
   `mascotFrame`, so all three are on the site's own pop curve and the site's own
   70ms cascade rather than on a second animation that could drift:

     the 5  reads dot 0 at t + 0.07, which is a dot that started 70ms earlier
     the 8  reads dot 0
     the 12 reads dot 1
     the pill is the pill

   four things arriving 70ms apart, small to large, up the diagonal. the
   positions are the diagonal from his crown at (216,428) to the pill's own
   bottom left corner at (175,372), and the first one sits 8 css px off the
   silhouette, which is attached to him rather than near him. */
const THOUGHT = {
  dots: [
    { d: 5, cx: 211, cy: 421, src: 0, dt: 0.07 },
    { d: 8, cx: 199, cy: 405, src: 0, dt: 0 },
    { d: 12, cx: 186, cy: 388, src: 1, dt: 0 },
  ],
};

/* ---------- the chat panel ----------
   a picture of the box a person types into, drawn in code: a rounded panel in
   the page's own ink, a line of text, a plus on the left and the model's name on
   the right. no logo inside it and nothing lifted off anybody's product — it is
   the **shape** of the thing, which is what a viewer recognises, and every part
   of it is a rule in this file's own css.

   it is drawn in `--fg` on `--bg`, which is the site's ink on the site's paper
   and is why it needs no colour of its own. on a white frame a dark panel is
   what a chat box looks like, and it gives the middle of the picture something
   to be about between the mark at the top and the caption under it.

   the geometry is worked backwards from the two things it has to fit between:
   the mark's sweep reaches 254 css and the tallest caption ink starts around
   432, so the panel gets 272..407 and there are 25 css px of air under it.

   `textSize` is 23 rather than 22 because 22 renders 31.7 device px of cap and
   the floor every piece of copy in this repo is held to is 32. the line wraps to
   two at this size, which is what the panel is two lines tall for.

   **`metaSize` is deliberately under that floor and it is the one exemption in
   the file.** `Fable 5.1 Medium` is not the clip's copy, it is chrome inside a
   drawn picture of a screen — the same footing as post11's registration number,
   which is on the screen and is never read aloud. type inside a picture of a ui
   is as small as it is in the ui, or it is not a picture of a ui. */
const PANEL = {
  x: 70, y: 272, w: 400, h: 135,
  radius: 20,
  pad: 18,
  textSize: 23,
  lineHeight: 1.32,
  metaSize: 14,
  plus: 24,             /* the circle's own diameter, css px */
  rowGap: 14,           /* between the text block and the controls row */
  meta: 'Fable 5.1 Medium',
  placeholder: 'ask anything',
  typed: 'i am smarter, faster and use fewer tokens',
  in: 0.34,             /* how long it takes to rise */
  out: 0.30,            /* and to leave, before the end card */
  lift: 16,             /* css px it rises through on the way in */
  /* how long after the last keystroke the end card may start. the line has to be
     finished **and read** before the frame changes, and a caption is read in
     about a third of a second a word. */
  readAfter: 0.60,
  keyEvery: 4,          /* one tick per this many characters. post11's rule */
};

/* ---------- the glitch ----------
   three faults, none longer than a quarter of a second, all of them inside the
   half second the opening hands over to the read.

   the two mascot ones are **adjacent rather than separated**: the first window
   ends exactly where the second begins, so the stretch he is missing from is
   never a clean frame. that is not decoration. a white frame with nothing at
   all on it is two identical frames in a row at sixty, which is post10's own
   fault and is a guard at the bottom of this file, and it is also simply a dead
   frame. the signal is broken for a quarter of a second and then he is back
   somewhere else.

   the numbers are the light theme's and they are not post12's walked down by
   eye. on black the split is 9.5 css px of red and cyan around a white head and
   it reads as a look; on white it is dark fringing on dark ink and 4.5 is
   already loud. the noise darkens rather than lightens, because grain on paper
   is grain and screen blending on white is nothing at all. */
const GL = {
  shakeX: 13, shakeY: 7,
  split: 4.5,
  bands: 3,
  bandDx: 70,
  bandH: [5, 26],
  bandO: 0.82,
  noise: [0.10, 0.26],
  /* the flash is ink rather than light, and there is exactly one of it. a white
     bloom on a white page is nothing; what a signal collapsing looks like on
     paper is the paper going dark for a frame. it is small and it is centred on
     the head, so it is him being taken rather than the frame being flashed. */
  flash: 0.30,
  flashSize: 330,
};

/* every burst is a length in seconds snapped to whatever frame grid is
   rendering — post11's rule and post12's note. a 100ms stutter is six frames at
   sixty and one and a fifth at twelve, so written as seconds and left alone it
   would land differently on the preview and on the master. the start goes to
   the nearest frame and the length is rounded up to at least one whole frame,
   and a guard proves every window fires at both rates. */
const GL_CUT = [
  /* he goes. the longest of the three, the only one with a flash on it, and it
     runs straight into the next — `chain` rather than a length, because two
     windows snapped separately to the same grid do not necessarily touch: at
     sixty this one's own length rounded to 1.633 and the next one's start
     rounded to 1.617, which is an overlap, and at twelve they happened to meet.
     so its end **is** the next one's start, at whatever rate is rendering. */
  { at: T_GONE, for: T_BACK - T_GONE, chain: true, force: 1, flash: true, bands: true, seed: 0x0c1a55 },
  /* he is back, in the corner. */
  { at: T_BACK, for: 0.10, force: 0.92, flash: false, bands: true, seed: 0x51a017 },
  /* the mark arrives. no bands on this one: the tear layer is drawn under the
     image so a band can never cross it, and a band that stopped at the logo's
     edge would be a band with a hole in it. shake, split and grain only. */
  { at: T_LOGO, for: 0.10, force: 0.78, flash: false, bands: false, seed: 0x9e3779 },
];

/* crf 20. this frame is mostly flat white with fine ink type on it, which is
   what a codec smears rather than bands, and there is real grain on the frames
   that would band. post11's light render sits here too. */
const CRF = 20;

/* ---------- the mix ----------
   post11's rig: the read on top, a small bus of effects under it ducked while a
   word is being said, and a loudness loop that keeps its best pass rather than
   its last. there is no music, by design rather than by omission. */
const TARGET_LUFS = -14;
const PEAK_CEILING = -1.0;
/* the loop works to a lower ceiling than the guard reads, because the guard
   reads the **mp4** and the loop writes a wav: aac is a lossy round trip and it
   overshoots the samples it was made from. the first render came back at -0.9
   on a file the limiter had held at -1.0, which is that overshoot and nothing
   else. half a decibel of headroom is what it costs. */
const WAV_CEILING = -1.5;
const DUCK = 0.60;
const VOICE_TRIM = -1.5;
const MAX_REDUCTION = 5.0;
const MIN_LUFS = -20;

/* the clip's own length, as a window rather than as a number, because the length
   is cut from the takes and the takes are measured.

   the ceiling was 10.0 for the first cut, which is what the brief asked for then.
   the second cut holds the opening for two and a half seconds, reads at a
   person's own pace with a real breath between lines, and types forty one
   characters into a panel, and each of those was asked for knowing what it
   costs. the window is what the clip can honestly be rather than what it was:
   under eight is a clip that lost a beat and over fifteen is one that is not a
   flash any more. */
const RUN = { min: 10.0, max: 15.0 };

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
const GLIDE = bezier(.45, 0, .55, 1);       /* the calm in out */
/* ---------- the turn, and why it is not GLIDE ----------
   the mark turns once over eight seconds and the first cut ran it on the house
   in out, which is what "slow and smooth, house easing" asks for. the frames
   said what that does at this length: **every bezier whose second control point
   ends at one arrives at zero speed**, so the last second and a half of the clip
   had a mark that had stopped, over an end card that is already still, which is
   the frozen frame the review checklist asks about by name.

   so the second control point comes off the ceiling. it still eases in — the
   mark is born on a fault and a thing that arrives already spinning reads as a
   loading spinner — and it still slows toward the end, but it is turning at
   three fifths of its own average when the clip runs out rather than at
   nothing. same family, same shape, one number off the top. */
const TURNING = bezier(.35, 0, .70, .82);
const POP = bezier(.34, 1.4, .64, 1);       /* the site's own --spring */
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))));
const lerp = (a, b, p) => a + (b - a) * p;

function prng(seed) {
  let x = seed | 0 || 0x1a2b3c;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x |= 0; return (x >>> 0) / 4294967296; };
}

function onGrid(t, len, fps) {
  const f0 = Math.round(t * fps);
  const n = Math.max(1, Math.round(len * fps));
  return { t0: f0 / fps, t1: (f0 + n) / fps, frames: n };
}

/* ---------- the voice, one take per line, cached ----------
   the sidecar json is the cache key and the **delivery is part of it**: the
   copy is one half of what a take is and the rate and the pitch are the other,
   so a cache that only knew the words would hand back a line read at the wrong
   speed the moment a delivery note changed. post10 found that and post11 wrote
   it down; this is the same guard. */
async function take(i) {
  const L = LINES[i];
  const name = 'post14-l' + String(i + 1).padStart(2, '0');
  const cached = path.join(VOICE_OUT, name + '-calm.json');
  const want = L.text.replace(/\s+/g, ' ').trim();
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === want && j.rate === L.rate && j.pitch === L.pitch && fs.existsSync(j.file)) {
      return { ...j, i, cached: true };
    }
  }
  const r = await speak(L.text, { voice: 'calm', name, rate: L.rate, pitch: L.pitch });
  return { ...r, i, cached: false };
}

/* where a take's sound actually starts and stops, off the waveform rather than
   off the word list. the synthesiser's WordBoundary carries a duration shorter
   than the sound, so a gap trusted to the word list is not the gap that is in
   the file. */
function audioEdges(pcm) {
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  const gate = peak * Math.pow(10, SILENCE_DB / 20);
  const H = Math.round(0.005 * SR);
  const n = Math.floor(pcm.length / H);
  const loud = k => {
    let m = 0;
    for (let j = k * H; j < Math.min((k + 1) * H, pcm.length); j++) m = Math.max(m, Math.abs(pcm[j]));
    return m > gate;
  };
  let a = 0, b = n - 1;
  while (a < n && !loud(a)) a++;
  while (b > a && !loud(b)) b--;
  return { start: +(a * 0.005).toFixed(4), end: +((b + 1) * 0.005).toFixed(4), peak: +dbfs(peak).toFixed(1) };
}

/* the three takes laid on one clock, the first one starting its sound at
   `VOICE_AT`. each is placed so the silence between its own last sound and the
   next take's first sound is exactly the gap that line asked for, and the word
   list comes back re timed by the same offsets, so the captions, the end card
   and the mascot are all cut against the timeline that is in the file. */
function buildVoice(takes) {
  const pcms = takes.map(t => decode(ffmpeg, t.file));
  const edges = pcms.map(audioEdges);
  const offs = [];
  let end = VOICE_AT;
  for (let i = 0; i < takes.length; i++) {
    /* a derived gap that nobody derived is the one failure that would look like
       a timing choice rather than a bug, so it is refused here. */
    if (i > 0 && LINES[i - 1].gap == null) {
      throw new Error('line ' + i + '\'s gap is null and it is not the last line');
    }
    const gap = i === 0 ? 0 : LINES[i - 1].gap;
    const off = +(end + gap - edges[i].start).toFixed(4);
    offs.push(off);
    end = +(off + edges[i].end).toFixed(4);
  }
  const words = [];
  const beats = [];
  for (let i = 0; i < takes.length; i++) {
    const off = offs[i], e = edges[i];
    const ws = takes[i].words.map(w => ({
      word: w.word, start: +(w.start + off).toFixed(4), end: +(w.end + off).toFixed(4),
    }));
    words.push(...ws);
    beats.push({
      i, text: LINES[i].text, words: ws,
      start: ws[0].start, end: ws[ws.length - 1].end,
      sound: { start: +(off + e.start).toFixed(4), end: +(off + e.end).toFixed(4) },
      wps: +(ws.length / (ws[ws.length - 1].end - ws[0].start)).toFixed(2),
      rate: LINES[i].rate, pitch: LINES[i].pitch,
    });
  }
  /* **the length is no longer decided here.** it was: the last word, the end
     card on top of it, the hold. the end card is centred on the middle of the
     frame now and the middle of the frame is where the captions are, so it may
     not arrive until the last card is gone — and how long a card is up is the
     caption plan's answer rather than the voice's. so this hands back where the
     last word is and `main` works the rest out once it has both.

     the track is allocated with four seconds of room past the last word and
     sliced to the finished length in `main`, which is cheaper than laying the
     takes down twice and is the only thing in the file that knows the two
     numbers are different. */
  const lastWord = beats[beats.length - 1].end;
  const track = new Float32Array(Math.ceil((lastWord + 4.0) * SR));
  for (let i = 0; i < takes.length; i++) {
    const pcm = pcms[i], e = edges[i], off = offs[i];
    const a = Math.max(0, Math.round((e.start - PRE) * SR));
    const b = Math.min(pcm.length, Math.round((e.end + POST) * SR));
    const at = Math.round(off * SR) + a;
    const fade = Math.round(EDGE_FADE * SR);
    for (let k = a; k < b; k++) {
      const j = at + (k - a);
      if (j < 0 || j >= track.length) continue;
      let g = 1;
      if (k - a < fade) g = (k - a) / fade;
      else if (b - k < fade) g = (b - k) / fade;
      track[j] += pcm[k] * g;
    }
  }
  const gaps = [];
  for (let i = 1; i < beats.length; i++) {
    gaps.push(+(beats[i].sound.start - beats[i - 1].sound.end).toFixed(3));
  }
  return { track, words, beats, edges, offs, gaps, lastWord };
}

/* ---------- the marks, off the read ----------
   one reaction per line, placed against the line rather than typed, so moving a
   line moves the reaction with it and nothing has to be re-tuned by hand.

   the first one is the exception and it is the right kind: he is **born** at the
   corner on the second fault, so his first corner mark is that fault's own time
   rather than a line's. the fault is placed just before the first word, so the
   two land together anyway; keying it to the fault is what makes that true by
   construction instead of by coincidence. */
function planMarks(beats, endIn) {
  const marks = [{ ...OPENING_MARK }];
  LINE_MARKS.forEach((m, k) => {
    const t = k === 0 ? T_BACK : +(beats[m.line].start + m.offset).toFixed(3);
    marks.push({ t, state: m.state, bubble: m.bubble });
  });
  /* and he settles as the wordmark comes up. no bubble on it: the last thing on
     the screen is the three words, and a mascot with a thought over his head
     while the brand name arrives is two things asking to be read. */
  marks.push({ t: +(endIn - 0.20).toFixed(3), state: CALM_STATE });
  return marks;
}

/* ---------- where a card is allowed to end ----------
   a card breaks at a sentence end, at a clause mark, or when it is full, and
   these three lines carry two commas between them and no full stops at all.
   left alone the cut runs straight through the seams — `out smarter`,
   `blocks and` — which is post10's `do it we` and post11's `job send it` again,
   and worse: a card holding the end of one fact and the start of the next while
   the voice has already moved on.

   so the seams are **marked rather than inferred**. a comma goes on the last
   word of every line, on the caption's copy only and after the synthesiser has
   already spoken, `cardBreak` breaks on it and `punctuation: 'drop'` takes it
   off again before a card is drawn. nothing about the audio or the timing can
   move. what the marks cannot fake is that the voice said these words in this
   order, and that is checked against the drawn sequence at the bottom of this
   file. */
function markLines(beats) {
  const out = [];
  const marked = [];
  for (const b of beats) {
    b.words.forEach((w, k) => {
      const last = k === b.words.length - 1;
      const already = /[.!?,;:]["')\]]?$/.test(w.word);
      if (last && !already) marked.push(w.word);
      out.push({ word: last && !already ? w.word + ',' : w.word, start: w.start, end: w.end });
    });
  }
  return { words: out, marked };
}

/* ---------- the zone, composed ----------
   where the head actually is once this clip has moved and scaled his zone.
   `headRect` works the ink out of `plan.box` and the frame's own card channel
   and knows nothing about a transform laid over the element, so the two are put
   together here rather than either one being trusted alone.

   the zone's transform origin is its own centre, so a zone local point p maps
   to `centre + (tx,ty) + k*(p - centre)`. the head's half extents scale by k
   and its centre moves by the translate, and that is the whole of it. */
function zoneOf(plan, place) {
  const k = +(place.head / plan.plate.w).toFixed(6);
  const cx = plan.box.left + plan.size / 2;
  const cy = plan.box.top + plan.size / 2;
  return {
    k,
    tx: +((place.cx == null ? cx : place.cx) - cx).toFixed(3),
    ty: +((place.cy == null ? cy : place.cy) - cy).toFixed(3),
    /* the bubble's own translate, in the bubble's coordinate system, which is
       inside the zone and therefore already multiplied by k on the screen. */
    b: place.bubble ? bubbleOffset(plan, place) : { x: 0, y: 0, s: 1 },
    head: place.head,
  };
}

/* the cluster's natural anchor is the left bottom corner of `.bubble`, which
   the module puts at a fixed place in zone local css px. this works out what to
   add to land that corner somewhere else, and it reads the module's own numbers
   out of `BUBBLE` and the geometry table rather than repeating them. */
function bubbleOffset(plan, place) {
  const S = plan.size;
  const local = {
    x: S * (2 + 60) / GRID + BUBBLE.gap,
    y: S - S * (1 - (2 + 60 * 0.34) / GRID),
  };
  const k = place.head / plan.plate.w;
  const c = { x: plan.box.left + S / 2, y: plan.box.top + S / 2 };
  /* where that corner lands on the page under the zone transform, before the
     bubble's own translate. */
  const page = {
    x: place.cx + k * (local.x - S / 2),
    y: place.cy + k * (local.y - S / 2),
  };
  return {
    x: +((place.bubble.at.x - page.x) / k).toFixed(3),
    y: +((place.bubble.at.y - page.y) / k).toFixed(3),
    s: +(1 / k).toFixed(6),
    page: { x: +page.x.toFixed(2), y: +page.y.toFixed(2) },
  };
}

function zoneRect(plan, fr, z) {
  const r = headRect(plan, fr);
  const c = { x: plan.box.left + plan.size / 2, y: plan.box.top + plan.size / 2 };
  /* headRect hands back distances from the borders; turn them back into an
     absolute box, transform it, and hand back distances again. */
  const box = {
    l: r.left / DSF, t: r.top / DSF,
    r: VW - r.right / DSF, b: VH - r.bottom / DSF,
  };
  const map = (x, y) => ({
    x: c.x + z.tx + z.k * (x - c.x),
    y: c.y + z.ty + z.k * (y - c.y),
  });
  const a = map(box.l, box.t), d = map(box.r, box.b);
  return {
    left: +(a.x * DSF).toFixed(1), top: +(a.y * DSF).toFixed(1),
    right: +((VW - d.x) * DSF).toFixed(1), bottom: +((VH - d.y) * DSF).toFixed(1),
    headPx: +((d.x - a.x) * DSF).toFixed(1),
  };
}

/* ---------- the glitch ----------
   a function of the output frame index and of nothing else. the envelope is
   post10's: full for the first sixth, decaying, and then near nothing, which is
   the "snaps back calm" the shape asks for and is a fact the guards check
   rather than a description. */
function heatAt(p) {
  if (p < 0) return 0;
  if (p < 0.15) return 1;
  if (p < 0.62) return 1 - (p - 0.15) / 0.47 * 0.55;
  if (p < 0.90) return 0.45 * (1 - (p - 0.62) / 0.28);
  return 0;
}
function calmGlitch() {
  return { sx: 0, sy: 0, split: 0, noise: 0, flash: 0, bands: [], heat: 0 };
}
function glitchWindows(fps) {
  const out = GL_CUT.map((w, i) => ({ ...onGrid(w.at, w.for, fps), i, ...w }));
  for (let i = 0; i < out.length - 1; i++) {
    if (!out[i].chain) continue;
    out[i].t1 = out[i + 1].t0;
    out[i].frames = Math.round((out[i].t1 - out[i].t0) * fps);
  }
  return out;
}
const GL_WINDOWS = glitchWindows(FPS);
/* and the same list on the master's grid, because a duty is a property of the
   animation rather than of the pass it is sampled at. the guards read sixty. */
const GL_WINDOWS_60 = FPS === 60 ? GL_WINDOWS : glitchWindows(60);

function glitchAt(f, fps = FPS, windows = GL_WINDOWS) {
  const g = calmGlitch();
  const t = f / fps;
  const w = windows.find(x => t >= x.t0 && t < x.t1);
  if (!w) return g;
  const p = (t - w.t0) / (w.t1 - w.t0);
  const r = prng(w.seed ^ (f * 2654435761));
  let heat = heatAt(p) * w.force;
  /* ---------- a chained window never dies ----------
     `heatAt` decays to nothing by nine tenths of the way through, which is
     right for a fault that ends. this one does not end, it hands over: the
     stretch he is missing from lives inside it, and a rendered frame showed
     what the decay does there — the last frames before he comes back were clean
     white paper with nothing on them at all, which is the dead frame the
     chaining exists to prevent. so a window running into the next one has a
     floor under it, and the signal stays broken until the thing that breaks it
     again arrives. */
  if (w.chain) heat = Math.max(heat, w.force * 0.62);
  /* one frame in three inside the decay goes back to full, which is what stops
     a fault reading as a fade out. */
  if (heat > 0 && p > 0.15 && p < 0.90 && r() < 0.34) heat = w.force;
  if (heat <= 0.02) return g;
  g.heat = +heat.toFixed(4);
  g.sx = +((r() * 2 - 1) * GL.shakeX * heat).toFixed(2);
  g.sy = +((r() * 2 - 1) * GL.shakeY * heat).toFixed(2);
  g.split = +(heat * (1.4 + r() * (GL.split - 1.4))).toFixed(2);
  g.noise = +(heat * lerp(GL.noise[0], GL.noise[1], r())).toFixed(4);
  g.flash = (w.flash && f === Math.round(w.at * fps)) ? GL.flash : 0;
  const n = w.bands ? Math.min(GL.bands, Math.floor(heat * (GL.bands + 0.5))) : 0;
  for (let i = 0; i < n; i++) {
    const h = GL.bandH[0] + r() * (GL.bandH[1] - GL.bandH[0]);
    g.bands.push({
      top: +(r() * (VH - h)).toFixed(1), h: +h.toFixed(1),
      dx: +((r() * 2 - 1) * GL.bandDx * heat).toFixed(1),
      o: +(GL.bandO * (0.55 + 0.45 * heat)).toFixed(3),
    });
  }
  return g;
}

/* ---------- the cut, as frames ----------
   he is on from frame zero, off an eighth of a second after the first hit lands,
   and back on from the frame the second one lands on. all three are derived off
   the **frame** rather than off the time, at whatever rate is rendering,
   because post13 shipped a black frame by letting a time round down: one
   source, no rounding to get lucky with.

   **the lag is the whole of what makes the hit read.** the first cut took him
   on the hit frame itself, and a rendered frame said what that is: a page with
   three bars and some grain on it and no reason for any of it. the fault has to
   land on him — the split fringes his silhouette, the bars cross it, the ink
   flash blows out around it — and then he is gone. that is a glitch taking
   something; the other is an edit with an effect over it. it costs 0.12s and it
   is the difference between the two. */
const MASCOT_LAG = 0.12;
const GONE_FRAME = Math.round((T_GONE + MASCOT_LAG) * FPS);
const BACK_FRAME = Math.round(T_BACK * FPS);
const LOGO_FRAME = Math.round(T_LOGO * FPS);

/* the two placements, resolved once against the finished plan. `main` fills
   this in before a browser is opened, so the page is served with the corner
   already in its css and there is nothing to move once it is up. */
let ZONE = null;

/* the typing, likewise: `main` cuts it against the read and this holds the
   answer so `frameAt` can ask how many characters are on the screen. */
let TYPING = null;

/* ---------- the hand ----------
   post9's rule and post11's reasoning: **a constant rate reads as a machine
   filling a field, which is what it is.** so every gap is its own number off a
   seeded prng, and two things break the rhythm on purpose — a comma gets a beat
   after it, because a person pauses where they would speak a pause, and the
   first character comes a shade after the window opens, because nobody starts
   typing on the frame they decide to.

   the window is the whole of it: `from` is the first keystroke and `until` is
   the last, and `main` derives both off the read and off the end card rather
   than typing either. what comes back is one entry per character with the
   instant it lands, so the frame function is a binary search and the sound is a
   filter over the same list. nothing about the two can drift, because there is
   only one list. */
function typePlan(text, from, until, seed) {
  const r = prng(seed);
  const n = text.length;
  /* the weights first, then normalise, so the run always ends exactly on
     `until` whatever the jitter did. a typing pass that finished early would
     leave a caret sitting still under a line that is done. */
  const w = [];
  for (let i = 0; i < n; i++) {
    let x = 0.7 + r() * 0.6;
    if (i > 0 && text[i - 1] === ',') x += 2.6;
    if (text[i] === ' ') x += 0.35;
    w.push(x);
  }
  const total = w.reduce((a, b) => a + b, 0);
  const span = until - from;
  const at = [];
  let acc = 0;
  for (let i = 0; i < n; i++) {
    at.push(+(from + span * (acc / total)).toFixed(4));
    acc += w[i];
  }
  /* one tick per four characters, plus the first and the last, which is
     post11's number and post11's reason: forty one sounds inside five seconds is
     a rattle, and the two ends are the moments the rhythm starts and stops. */
  const keys = [];
  for (let i = 0; i < n; i++) {
    if (i === 0 || i === n - 1 || i % PANEL.keyEvery === 0) keys.push(at[i]);
  }
  return { text, from, until, at, keys, chars: n };
}

/* how many characters are on the screen at `t`. */
function typedAt(t) {
  if (!TYPING || t < TYPING.at[0]) return 0;
  let lo = 0, hi = TYPING.at.length - 1, k = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (TYPING.at[mid] <= t) { k = mid + 1; lo = mid + 1; } else hi = mid - 1;
  }
  return k;
}

/* ---------- what one frame is ----------
   everything this file writes, in one object, so the page has one entry point
   and the liveness signature has one thing to hash. `t` is the instant being
   captured and `f` is the output frame it belongs to: they differ under the
   shutter and the difference is the whole point of the split. */
function frameAt(t, f, seconds, endIn) {
  const g = glitchAt(f);
  /* the cut, and it is the only thing in this clip that touches his opacity.
     the bubble is inside his own zone, so it is on this switch too without
     being mentioned by it. */
  const on = (f < GONE_FRAME || f >= BACK_FRAME) ? 1 : 0;
  const z = f < GONE_FRAME ? ZONE.big : ZONE.corner;

  /* the mark. it is born on the frame the third hit lands and it turns for the
     rest of the clip on the house in out, so it leaves and arrives slowly and
     is quickest across the middle. */
  /* **the birth is a frame.** post12's rule, and a rendered frame is what asked
     for it here: a five hundredth of a second ramp is still a ramp, and the
     frames inside it are a clay mark at a fraction of its opacity with a colour
     split on it, which is a pale pink ghost of somebody else's logo. so it is
     off, and then it is on, and the fault that lands on the same frame is what
     makes that an arrival rather than a pop. it is a function of the frame
     index rather than of the time, so the shutter holds it across every capture
     of the frame instead of averaging a quarter of it in. */
  const lp = f < LOGO_FRAME ? 0 : 1;
  const turnFrom = T_LOGO + LOGO.in;
  const rot = f < LOGO_FRAME ? 0
    : +(TURNING(span(t, turnFrom, seconds)) * 360 * LOGO.turns).toFixed(3);

  /* ---- the panel ----
     it rises rather than glitching in, and that is the one thing in the clip
     that arrives calmly. the fault is the opening's language and it is over by
     the time this appears; a third arrival on a tear would make the fault the
     clip's whole grammar rather than its first beat. it goes the same way, over
     the third of a second before the end card starts, so the wordmark never
     comes up over a picture of somebody else's product.

     the caret is on whenever the panel is and it does not blink. a blink is a
     third thing to catch a still on, and the line is being typed anyway, which
     is all the life this element needs. */
  const pin = POP(span(t, PANEL_AT, PANEL_AT + PANEL.in));
  const pout = GLIDE(span(t, endIn - PANEL.out - 0.04, endIn - 0.04));
  const panel = {
    o: +(pin * (1 - pout)).toFixed(4),
    y: +((1 - pin) * PANEL.lift).toFixed(3),
    n: typedAt(t),
  };

  /* ---- the thought's three dots ----
     each reads a channel out of the module's own bubble, at its own offset, so
     the four things that arrive are on one curve and one cascade. `o` is
     multiplied by the bubble's own gate, because the module fades the whole
     cluster out together at the end and a dot that outlived the pill would be a
     speck of dirt on the frame. */
  const big = f < GONE_FRAME;
  const dots = THOUGHT.dots.map(d => {
    /* they are the **opening's** dots and they are drawn at the opening's own
       page coordinates, so they have to be off for every corner thought or they
       would light up in the middle of the frame with nothing under them. */
    const src = (big && MASCOT.plan) ? mascotFrame(MASCOT.plan, t + d.dt).bubble : null;
    if (!src) return { o: 0, sc: 1 };
    const c = src.dots[d.src];
    return { o: +(c.o * (src.o > 0.004 ? 1 : 0)).toFixed(4), sc: +c.sc.toFixed(4) };
  });

  /* the end card. it arrives after the last caption is out, which is derived in
     `main` off the caption plan's own last window: the group is centred on the
     middle of the frame now and the middle of the frame is where the captions
     live, so the two can no longer share it. */
  const ep = span(t, endIn, endIn + END.in);
  const end = {
    o: +span(t, endIn, endIn + END.in * 0.55).toFixed(4),
    sc: +(1 + (1 - POP(ep)) * 0.05).toFixed(4),
  };

  return {
    t: +t.toFixed(4), f,
    mo: on,
    big: big ? 1 : 0,
    z: { k: z.k, tx: z.tx, ty: z.ty, bx: z.b.x, by: z.b.y, bs: z.b.s },
    logo: { o: +lp.toFixed(4), rot },
    panel, dots,
    end, g,
  };
}

/* the plan, held where `frameAt` can read it. it is a box rather than a bare
   binding so the render loop and the guards are looking at the one object
   `main` filled in, and a frame asked for before it is filled in returns dots
   that are off rather than throwing halfway through a render. */
const MASCOT = { plan: null };

/* ---------- the page ---------- */
function sceneHtml(cap, mas) {
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<title>post14</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500;700&display=swap">
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}

/* the stage carries the frame's own shake and every custom property anything
   else reads. one place they are written and one place everything reads them
   from, which is what keeps the layers from drifting off each other. */
.stage{position:relative;width:${VW}px;height:${VH}px;background:var(--bg);
  transform:translate3d(calc(var(--sx,0) * 1px),calc(var(--sy,0) * 1px),0);
  will-change:transform}

/* load bearing rather than decoration. with nothing animating at all chrome
   stops producing compositor frames and the screenshot call blocks on frame one
   forever — post2 found it and every clip in demo/ has carried something like
   it since. this clip's first second and a half is a head holding still, which
   is exactly when it matters. */
.tick{position:absolute;left:-20px;top:-20px;width:2px;height:2px;background:var(--bg);
  will-change:transform;animation:tick 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes tick{from{transform:translate3d(0,0,0)}to{transform:translate3d(1px,0,0)}}

/* the two channels the rgb split is drawn in. on white it is dark fringing on
   dark ink, which is what chromatic aberration actually looks like on paper. */
:root{--gr:rgba(214,44,44,.55); --gc:rgba(0,150,214,.55)}

${captionCss(cap, CAP_BOX)}
${mascotCss(mas)}

/* ---- the zone ----
   this clip's two placements, as a transform on the module's own element. the
   id beats the module's class selector, which is how a clip adds a channel
   without editing the module. the origin is the element's centre, which is the
   plate's centre, so the scale changes the extent and the translate is where
   the head goes. */
#m-zone{
  opacity:var(--m-o,1);
  transform:translate(calc(var(--mz-x,0) * 1px),calc(var(--mz-y,0) * 1px)) scale(var(--mz-k,1));
}
/* and the thought, re-anchored for the opening only. the module writes nothing
   to this element except its visibility, so there is nothing here to fight.
   (no backticks in this block: it is inside a template literal, and one would end
   the string rather than mark a name.) */
#m-bubble{
  transform:translate(calc(var(--mb-x,0) * 1px),calc(var(--mb-y,0) * 1px)) scale(var(--mb-s,1));
  transform-origin:left bottom;
}
/* the split is behind an attribute rather than a zero valued shadow: a shadow
   at offset 0 in full colour is a coloured halo, not "off". */
.stage[data-gl="1"] #m-zone{
  filter:drop-shadow(calc(var(--split,0) * -1px) 0 var(--gr))
         drop-shadow(calc(var(--split,0) * 1px) 0 var(--gc))}
/* the mark gets **less than half** the ink's split, and that is a rendered
   frame's correction rather than a preference. the mascot is a 360px solid disc
   and 4.5px of fringing on it is a hairline; the mark is nine strokes about
   eight px wide, so the same offset puts a full width red copy beside every one
   of them and the thing stops reading as clay and starts reading as pink. two
   px of fringe is a fault on it. same channel, same two colours, same three
   frames — it is not being treated differently, it is being given the same
   effect at the scale it is actually drawn at. */
.stage[data-gl="1"] #logo{
  filter:drop-shadow(calc(var(--split,0) * -0.42px) 0 var(--gr))
         drop-shadow(calc(var(--split,0) * 0.42px) 0 var(--gc))}

/* ---- the mark ----
   an image, at its own aspect ratio, and nothing else is done to it. the box is
   square because the file is square, so nothing can be distorted here without
   the guard at the bottom of this file noticing.

   z-index 6 puts it over the tear layer on purpose: a torn band may never cross
   it. */
#logo{
  position:absolute; left:${LOGO.cx - LOGO.size / 2}px; top:${LOGO.cy - LOGO.size / 2}px;
  width:${LOGO.size}px; height:${LOGO.size}px; z-index:6;
  opacity:var(--lg-o,0); transform:rotate(calc(var(--lg-r,0) * 1deg));
  will-change:transform,opacity; pointer-events:none;
}

/* ---- the thought's own dots ----
   the module's own dot rule exactly: a disc in the page colour with the site's
   hairline outline round it, which is what makes a dot part of a thought rather
   than a full stop. they are drawn in page coordinates and sit on the mascot's
   own layer, because that is what they belong to. the module's two are switched
   off for this beat in apply(); see THOUGHT.

   (no backticks in this block: it is inside a template literal, and one would
   end the string rather than mark a name.) */
.t-dot{
  position:absolute; border-radius:50%;
  background:var(--eye); border:${BUBBLE.stroke}px solid var(--bub);
  z-index:4; pointer-events:none;
  opacity:0; will-change:transform,opacity;
}

/* ---- the chat panel ----
   a picture of the box a person types into, drawn out of this file's own rules.
   the panel is the page's ink and everything on it is the page's paper at an
   opacity, so it needs no colour of its own and it would invert with the theme
   for free if this clip ever got a dark variant.

   the text block is top anchored and the controls row is bottom anchored, so a
   line growing from nothing to two lines cannot move the plus or the model name
   under it. that is what a real input does and it is also what stops the frame
   twitching every fourth character. */
.panel{
  position:absolute; left:${PANEL.x}px; top:${PANEL.y}px;
  width:${PANEL.w}px; height:${PANEL.h}px;
  border-radius:${PANEL.radius}px; background:var(--fg);
  z-index:3; pointer-events:none; overflow:hidden;
  opacity:var(--pn-o,0);
  transform:translate3d(0,calc(var(--pn-y,0) * 1px),0);
  will-change:transform,opacity;
}
.panel-text{
  position:absolute; left:${PANEL.pad}px; right:${PANEL.pad}px; top:${PANEL.pad}px;
  font-family:var(--body); font-weight:400; font-size:${PANEL.textSize}px;
  line-height:${PANEL.lineHeight}; color:var(--bg);
  word-break:break-word;
}
/* the placeholder and the line share the one box, so the first character lands
   where the placeholder was rather than a few pixels off it.

   **it starts five px in, and that is a rendered frame's correction.** the caret
   is an inline element after the line, so with nothing typed it sits at x
   nought — which is exactly where the placeholder's first glyph is, and the
   frame came back with a white bar drawn through the a of "ask anything". five
   px clears the caret's own two and its margin with a pixel and a half to
   spare, and it is what a focused empty input actually looks like: the caret,
   then the placeholder after it. */
.panel-ph{position:absolute; left:5px; top:0; right:0; color:var(--bg);
  opacity:var(--pn-ph,0)}
/* the caret. a bar about a cap high sitting after the last character, which is
   what an input draws, and it is an inline element so it travels with the text
   through a wrap without anything having to measure where the text got to. */
.panel-caret{display:inline-block; width:2px; height:.86em; margin-left:.06em;
  background:var(--bg); vertical-align:-.10em; opacity:var(--pn-car,0)}
/* the controls row: a plus in a ring on the left, the model on the right. */
.panel-row{
  position:absolute; left:${PANEL.pad}px; right:${PANEL.pad}px;
  bottom:${PANEL.pad}px; height:${PANEL.plus}px;
  display:flex; align-items:center; justify-content:space-between;
}
.panel-plus{
  position:relative; width:${PANEL.plus}px; height:${PANEL.plus}px;
  border-radius:50%; border:1.5px solid var(--bg); opacity:.34;
}
/* two bars rather than a glyph, so nothing depends on a face having a plus that
   optically centres inside a ring. */
.panel-plus::before,.panel-plus::after{
  content:''; position:absolute; left:50%; top:50%; background:var(--bg);
  border-radius:1px;
}
.panel-plus::before{width:${(PANEL.plus * 0.46).toFixed(1)}px; height:1.6px;
  margin:-0.8px 0 0 ${(-PANEL.plus * 0.23).toFixed(1)}px}
.panel-plus::after{width:1.6px; height:${(PANEL.plus * 0.46).toFixed(1)}px;
  margin:${(-PANEL.plus * 0.23).toFixed(1)}px 0 0 -0.8px}
.panel-meta{
  font-family:var(--body); font-weight:400; font-size:${PANEL.metaSize}px;
  color:var(--bg); opacity:.55; letter-spacing:.01em; white-space:nowrap;
}

/* ---- the end card ----
   post11's, on the light page. both blocks hug their own ink rather than
   spanning the frame: a full width box reports the frame's own edges back to
   the safe area check and proves nothing about where the letters are. the three
   lines are three blocks in one element so the group can be centred by
   measuring one height, and 1.16 is the site's own stacked lockup leading. */
.end{position:absolute; left:50%; text-align:center; opacity:var(--end-o,0);
  z-index:4; pointer-events:none; width:max-content;
  max-width:${VW - 2 * SAFE_CSS.left}px; will-change:opacity,transform}
#end-wm{font-family:var(--display); font-weight:400; color:var(--fg);
  text-transform:uppercase; letter-spacing:0; line-height:1.16; white-space:nowrap;
  transform:translate(-50%,-50%) scale(var(--end-s,1))}
#end-wm span{display:block}
#end-dom{font-family:var(--display); font-weight:400; color:var(--sub);
  text-transform:uppercase; letter-spacing:.18em; line-height:1; white-space:nowrap;
  text-indent:.18em; transform:translate(-50%,-50%) scale(var(--end-s,1))}

/* ---- the tear ----
   bands of ink slammed across the frame and offset sideways. on black post12
   and post13 black a band out and redraw a shifted copy of what is under it;
   there is nothing here that can be copied — the mascot is one dom subtree
   driven out of the module's own runtime and there is no second of it — so on
   paper the band **is** the fault rather than a displaced copy of one. a few
   near black bars across a white frame for three frames is a dropout, and it is
   the loudest thing this page ever draws.

   z-index 5: over the captions and the end card, under the mark. */
.tear{position:absolute;left:0;width:${VW}px;z-index:5;pointer-events:none;
  background:var(--fg);
  top:var(--tt,0px);height:var(--th,0px);opacity:var(--to,0);
  transform:translate3d(calc(var(--tdx,0) * 1px),0,0)}

/* ---- the fault's own two layers ----
   the grain darkens rather than lightens, because this is paper: multiplied
   noise on white is grain and screen blended noise on white is nothing. the
   flash is ink for the same reason — what a signal collapsing looks like on a
   white page is the page going dark for one frame. */
.noise{position:absolute;inset:-40px;z-index:7;pointer-events:none;
  mix-blend-mode:multiply;opacity:var(--noise,0);
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.0' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23m)'/%3E%3C/svg%3E")}
.flash{position:absolute;left:50%;top:${PLACE.big.cy}px;z-index:8;pointer-events:none;
  width:${GL.flashSize}px;height:${GL.flashSize}px;
  margin:${-GL.flashSize / 2}px 0 0 ${-GL.flashSize / 2}px;
  background:radial-gradient(circle,
    rgba(11,13,16,1) 0%, rgba(11,13,16,.55) 32%,
    rgba(11,13,16,.16) 58%, rgba(11,13,16,0) 78%);
  opacity:var(--flash,0)}
</style>
</head>
<body>
<div class="stage" id="stage">
  <div class="tick"></div>
${captionMarkup(cap)}
${mascotMarkup(mas)}
${THOUGHT.dots.map((d, i) => '  <div class="t-dot" data-tdot="' + i
    + '" style="left:' + (d.cx - d.d / 2) + 'px;top:' + (d.cy - d.d / 2)
    + 'px;width:' + d.d + 'px;height:' + d.d + 'px"></div>').join('\n')}
  <div class="panel" id="panel">
    <div class="panel-text" id="panel-text"><span class="panel-ph" id="panel-ph">${PANEL.placeholder}</span><span id="panel-line"></span><span class="panel-caret" id="panel-caret"></span></div>
    <div class="panel-row">
      <span class="panel-plus"></span>
      <span class="panel-meta">${PANEL.meta}</span>
    </div>
  </div>
  <div class="end" id="end-wm"><span>the</span><span>boring</span><span>tek</span></div>
  <div class="end" id="end-dom">theboringtek.com</div>
${Array.from({ length: GL.bands }, (_, i) => '  <div class="tear" data-tear="' + i + '"></div>').join('\n')}
  <img id="logo" src="/logo.png" alt="">
  <div class="noise" aria-hidden="true"></div>
  <div class="flash" aria-hidden="true"></div>
</div>
<script>
window.__CAP_PLAN = ${JSON.stringify(cap)};
window.__CAP_BOX = ${JSON.stringify(CAP_BOX)};
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(mas))};
window.__P14 = ${JSON.stringify({ VW, VH, DSF, END, LOGO, CAP_BOX, PANEL, THOUGHT })};
(${captionPage.toString()})();
${mascotRuntime()}
(${scenePage.toString()})();
/* the layers measure and fit themselves once, after both faces and the image
   are really here. offline everything renders in the mono fallback and looks
   almost right, which is the worst kind of wrong to fit type against — og.mjs
   has exited non zero on exactly that since the day it was written. */
Promise.all([
  document.fonts.load('400 40px Michroma'),
  document.fonts.load('700 44px "Space Grotesk"'),
  document.fonts.load('500 26px "Space Grotesk"'),
  document.getElementById('logo').decode().catch(function () { }),
])
  .then(function () { return document.fonts.ready; })
  .then(function () {
    window.__built = Object.assign({}, window.__p14.build(), {
      cap: window.__cap.build(),
      mas: window.__mas.build(),
      caps: window.__mas.caps(),
    });
  });
</script>
</body>
</html>`;
}

/* ---------- the page's own half ----------
   serialised in with .toString(), so it closes over nothing: everything it
   needs arrives on window.__P14. it writes numbers to elements and it decides
   nothing, which is the same split lib/captions.mjs and lib/mascot.mjs are
   built on. */
function scenePage() {
  const P = window.__P14;
  const stage = document.getElementById('stage');
  const zone = document.getElementById('m-zone');
  const bub = document.getElementById('m-bubble');
  const logo = document.getElementById('logo');
  const wm = document.getElementById('end-wm');
  const dom = document.getElementById('end-dom');
  const tears = [...document.querySelectorAll('.tear')];
  const tdots = [...document.querySelectorAll('.t-dot')];
  const mdots = [...document.querySelectorAll('.m-dot')];
  const panel = document.getElementById('panel');
  const panelPh = document.getElementById('panel-ph');
  const panelLine = document.getElementById('panel-line');
  const panelCaret = document.getElementById('panel-caret');
  const panelText = document.getElementById('panel-text');
  const panelMeta = document.querySelector('.panel-meta');

  const widest = el => {
    let w = 0;
    for (const sp of el.querySelectorAll('span')) w = Math.max(w, sp.getBoundingClientRect().width);
    return w || el.getBoundingClientRect().width;
  };

  window.__p14 = {
    /* the end card is fitted rather than sized: michroma is proportional and
       the address carries a fifth of an em of tracking, so the width of a string
       is a measurement rather than a ratio. both blocks are then placed either
       side of a centre, and the centre is measured too — the wordmark is three
       lines tall at a size nothing knows until the face has loaded. */
    build() {
      /* **the clamp comes off while the probe is up.** the block carries a
         max-width so the safe area check measures ink rather than the frame,
         and at the 100px probe size that clamp is what the measurement returns:
         the fit divided 300 by 400 instead of by 557 and came back with a
         wordmark three sizes too big. it is restored immediately, so nothing
         downstream sees it off. */
      const wmClamp = wm.style.maxWidth, domClamp = dom.style.maxWidth;
      wm.style.maxWidth = 'none'; dom.style.maxWidth = 'none';
      wm.style.fontSize = '100px';
      const wmSize = 100 * P.END.wordmarkW / widest(wm);
      wm.style.fontSize = wmSize.toFixed(2) + 'px';
      dom.style.fontSize = '100px';
      const domSize = 100 * P.END.domW / dom.getBoundingClientRect().width;
      dom.style.fontSize = domSize.toFixed(2) + 'px';
      wm.style.maxWidth = wmClamp; dom.style.maxWidth = domClamp;

      const wmH = wm.getBoundingClientRect().height;
      const domH = dom.getBoundingClientRect().height;
      const total = wmH + P.END.gap + domH;
      const top = P.END.centreY - total / 2;
      wm.style.top = (top + wmH / 2) + 'px';
      dom.style.top = (top + wmH + P.END.gap + domH / 2) + 'px';

      const cv = document.createElement('canvas').getContext('2d');
      const cs = getComputedStyle(wm);
      cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      const m = cv.measureText('H');

      /* where the group actually landed. both blocks are translated by half
         their own size to sit on the line they were given, so the only honest
         way to ask where the group is is to measure the two rects the browser
         produced rather than to do the arithmetic again on this side. */
      const wr = wm.getBoundingClientRect(), dr = dom.getBoundingClientRect();

      const lr = logo.getBoundingClientRect();
      return {
        end: {
          wmSize: +wmSize.toFixed(2), domSize: +domSize.toFixed(2),
          capPx: +((m.actualBoundingBoxAscent || 0) * P.DSF).toFixed(1),
          font: cv.font, totalCss: +total.toFixed(1),
          groupTop: +wr.top.toFixed(2), groupBottom: +dr.bottom.toFixed(2),
          groupMid: +((wr.top + dr.bottom) / 2).toFixed(2),
        },
        /* the panel, as it actually drew. the two numbers that matter are the
           cap height of the line, which is the only unit a "does it read at
           phone size" argument can be had in, and whether the finished line
           fits inside the box it is being typed into: a line that overflows a
           panel is a panel with a line sticking out of it, and it cannot be
           seen until the last character lands. so the whole string is written
           in, measured, and taken out again before a single frame is drawn. */
        panel: (() => {
          const cv = document.createElement('canvas').getContext('2d');
          const cs = getComputedStyle(panelText);
          cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
          const m = cv.measureText('H');
          const was = panelLine.textContent;
          panelLine.textContent = P.PANEL.typed;
          const full = panelText.getBoundingClientRect();
          const lines = Math.round(full.height / (P.PANEL.textSize * P.PANEL.lineHeight));
          panelLine.textContent = was;
          const pr = panel.getBoundingClientRect();
          const mr = panelMeta.getBoundingClientRect();
          const mcs = getComputedStyle(panelMeta);
          const mv = document.createElement('canvas').getContext('2d');
          mv.font = mcs.fontWeight + ' ' + mcs.fontSize + ' ' + mcs.fontFamily;
          return {
            capPx: +((m.actualBoundingBoxAscent || 0) * P.DSF).toFixed(1),
            metaCapPx: +((mv.measureText('H').actualBoundingBoxAscent || 0) * P.DSF).toFixed(1),
            font: cv.font,
            lines,
            fullH: +full.height.toFixed(1),
            room: +(P.PANEL.h - P.PANEL.pad - P.PANEL.plus - P.PANEL.rowGap - P.PANEL.pad).toFixed(1),
            left: +(pr.left * P.DSF).toFixed(1), top: +(pr.top * P.DSF).toFixed(1),
            right: +((P.VW - pr.right) * P.DSF).toFixed(1),
            bottom: +((P.VH - pr.bottom) * P.DSF).toFixed(1),
            metaText: panelMeta.textContent,
            metaRight: +((pr.right - mr.right) * P.DSF).toFixed(1),
          };
        })(),
        /* the image, as it actually decoded. the drawn box against the file's
           own pixels is what says the mark is not being squeezed, and it is read
           off the element rather than off the css that sizes it. the computed
           filter is read for the same reason: "nothing is done to its pixels" is
           a claim, and `none` is the measurement of it. */
        logo: {
          naturalW: logo.naturalWidth, naturalH: logo.naturalHeight,
          drawnW: +lr.width.toFixed(2), drawnH: +lr.height.toFixed(2),
          filter: getComputedStyle(logo).filter,
          objectFit: getComputedStyle(logo).objectFit,
          complete: logo.complete,
        },
      };
    },

    /* the end card's ink, from each border, measured on the two blocks rather
       than on the row that centres them. */
    endSafe() {
      const out = [];
      for (const el of [wm, dom]) {
        const r = el.getBoundingClientRect();
        out.push({
          left: +(r.left * P.DSF).toFixed(1), top: +(r.top * P.DSF).toFixed(1),
          right: +((P.VW - r.right) * P.DSF).toFixed(1),
          bottom: +((P.VH - r.bottom) * P.DSF).toFixed(1),
        });
      }
      return out;
    },

    /* the mark's own sweep, which is the number that has to clear the platform.
       a square turning about its centre reaches its half diagonal in every
       direction, so this is worked out from the drawn box rather than read off
       whatever rect the browser reports for the angle it happens to be at on
       the frame that gets sampled. */
    logoSweep() {
      const r = logo.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const reach = Math.hypot(r.width, r.height) / 2;
      return {
        left: +((cx - reach) * P.DSF).toFixed(1), top: +((cy - reach) * P.DSF).toFixed(1),
        right: +((P.VW - cx - reach) * P.DSF).toFixed(1),
        bottom: +((P.VH - cy - reach) * P.DSF).toFixed(1),
        reachPx: +(reach * P.DSF).toFixed(1),
        cx: +cx.toFixed(2), cy: +cy.toFixed(2),
      };
    },

    /* what is actually lit on this frame, read back rather than assumed. two
       questions the guards ask of it: is a caption ever up while he is big and
       centred, and is the end card ever up at the same time as a caption. */
    lit() {
      const on = el => {
        const cs = getComputedStyle(el);
        return cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.02;
      };
      const caps = [...document.querySelectorAll('.cap-float')].filter(on).length;
      return {
        caps,
        end: parseFloat(getComputedStyle(wm).opacity) > 0.02 ? 1 : 0,
        logo: parseFloat(getComputedStyle(logo).opacity) > 0.02 ? 1 : 0,
        panel: parseFloat(getComputedStyle(panel).opacity) > 0.02 ? 1 : 0,
        /* where the panel's ink actually is on this frame, so the caption and
           the end card can be measured against the thing that drew rather than
           against the rectangle it was told to draw in. it moves: it rises 16
           css px on the way in. */
        panelRect: (() => {
          const r = panel.getBoundingClientRect();
          return {
            top: +(r.top * P.DSF).toFixed(1), bottom: +(r.bottom * P.DSF).toFixed(1),
            left: +(r.left * P.DSF).toFixed(1), right: +(r.right * P.DSF).toFixed(1),
          };
        })(),
      };
    },

    apply(o) {
      const s = stage.style;
      zone.style.setProperty('--m-o', o.mo.toFixed(4));
      zone.style.setProperty('--mz-k', o.z.k.toFixed(5));
      zone.style.setProperty('--mz-x', o.z.tx.toFixed(3));
      zone.style.setProperty('--mz-y', o.z.ty.toFixed(3));
      bub.style.setProperty('--mb-x', o.z.bx.toFixed(3));
      bub.style.setProperty('--mb-y', o.z.by.toFixed(3));
      bub.style.setProperty('--mb-s', o.z.bs.toFixed(5));
      logo.style.setProperty('--lg-o', o.logo.o.toFixed(4));
      logo.style.setProperty('--lg-r', o.logo.rot.toFixed(3));
      s.setProperty('--end-o', o.end.o.toFixed(4));
      s.setProperty('--end-s', o.end.sc.toFixed(4));
      s.setProperty('--sx', o.g.sx.toFixed(2));
      s.setProperty('--sy', o.g.sy.toFixed(2));
      s.setProperty('--split', o.g.split.toFixed(2));
      s.setProperty('--noise', o.g.noise.toFixed(4));
      s.setProperty('--flash', o.g.flash.toFixed(4));
      if (o.g.split > 0.01) stage.setAttribute('data-gl', '1');
      else stage.removeAttribute('data-gl');

      /* ---- the thought's three dots ----
         and the module's two, switched off while they are up. this runs after
         window.__mas.apply on every capture, which is the same ordering the
         zone's own opacity channel relies on: the module writes what it always
         writes and this file has the last word about what is on the screen. */
      for (let i = 0; i < tdots.length; i++) {
        const d = o.dots[i];
        tdots[i].style.opacity = d.o.toFixed(4);
        tdots[i].style.transform = 'scale(' + d.sc.toFixed(4) + ')';
      }
      if (o.big) for (const el of mdots) el.style.opacity = '0';

      /* ---- the panel ----
         the line is written by slicing the string, so what is on the screen is
         always a prefix of the copy and there is no second copy of it anywhere.
         the placeholder is on until the first character lands and the caret is
         on whenever the panel is. */
      panel.style.setProperty('--pn-o', o.panel.o.toFixed(4));
      panel.style.setProperty('--pn-y', o.panel.y.toFixed(3));
      panel.style.setProperty('--pn-ph', (o.panel.n ? 0 : 0.42).toFixed(3));
      panel.style.setProperty('--pn-car', o.panel.o > 0.02 ? '1' : '0');
      const want = P.PANEL.typed.slice(0, o.panel.n);
      if (panelLine.textContent !== want) panelLine.textContent = want;

      for (let i = 0; i < tears.length; i++) {
        const band = o.g.bands[i];
        const st = tears[i].style;
        if (!band) { st.setProperty('--to', '0'); st.setProperty('--th', '0px'); continue; }
        st.setProperty('--to', band.o.toFixed(3));
        st.setProperty('--tt', band.top.toFixed(1) + 'px');
        st.setProperty('--th', band.h.toFixed(1) + 'px');
        st.setProperty('--tdx', band.dx.toFixed(1));
      }
    },
  };
}

/* ---------- a local static server, so the load sequence is the clip's ------- */
function serve(html) {
  const logo = fs.readFileSync(LOGO_FILE);
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/' || p === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }
    if (p === '/logo.png') {
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' });
      return res.end(logo);
    }
    res.writeHead(404); res.end('not here');
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ srv, port: srv.address().port })));
}

/* ---------- the rAF shim ----------
   nothing in this scene animates by hand — node holds the whole animation and
   the page writes what it is handed — but the shim is installed and flushed
   once per capture anyway, so this layer runs under the same clock everything
   else in demo/ runs under. a shim that only appears when it is needed is a
   shim nobody tests. */
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

/* ---------- render ---------- */
async function render(cap, mas, v, N, SECONDS) {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  for (const d of [FRAMES, SUBS]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  fs.mkdirSync(OUT, { recursive: true });

  const { srv, port } = await serve(sceneHtml(cap, mas));
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
      { name: 'prefers-color-scheme', value: 'light' },
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
  for (let i = 0; i < 300; i++) {
    const ok = await page.evaluate(() => !!(window.__built && window.__mas && window.__mas.ready
      && window.__cap && window.__cap.ready && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  const built = await page.evaluate(() => window.__built);
  if (!built) throw new Error('the scene never became ready');
  /* offline michroma falls back to the system mono and the end card looks
     almost right, which is the worst kind of wrong to judge type on. */
  if (!await page.evaluate(() => document.fonts.check('400 40px "Michroma"'))) {
    throw new Error('Michroma did not load — the type would be judged in the mono fallback');
  }
  if (!built.logo.complete || !built.logo.naturalW) {
    throw new Error('the anthropic logo did not decode — nothing would be at the top of the frame');
  }

  console.log('  built: head ' + built.mas.headPx + 'px, ' + built.mas.eyes + ' eyes, '
    + built.mas.glows + ' glow layers, theme ' + built.mas.theme
    + ', bubble caps ' + built.caps.capPx + 'px');
  console.log('  the captions fitted to ' + built.cap.size + 'px'
    + ', widest card ' + built.cap.widest + 'css px');
  console.log('  the mark: ' + built.logo.naturalW + 'x' + built.logo.naturalH
    + ' natural, drawn ' + built.logo.drawnW + 'x' + built.logo.drawnH + ' css ('
    + (built.logo.drawnW * DSF) + ' device px), filter ' + built.logo.filter);
  console.log('  the end card: wordmark ' + built.end.wmSize + 'css px, caps '
    + built.end.capPx + ' device px, address ' + built.end.domSize + ', group '
    + built.end.totalCss + 'css tall, centred on ' + END.centreY);

  /* the head's clearance, off every frame rather than sampled, because the
     geometry is known and it costs nothing to do it properly. both placements
     are walked: the opening's transform is this file's and it has to answer for
     it exactly as the module answers for the corner. */
  let headWorst = null, headBig = null;
  for (let f = 0; f < N; f++) {
    const t = f / FPS;
    const big = f < GONE_FRAME;
    const z = big ? ZONE.big : ZONE.corner;
    const r = zoneRect(mas, mascotFrame(mas, t), z);
    const near = Math.min(r.left, r.top, r.right, r.bottom);
    const rec = { t: +t.toFixed(3), near: +near.toFixed(1), ...r };
    if (big) { if (!headBig || near < headBig.near) headBig = rec; }
    else if (!headWorst || near < headWorst.near) headWorst = rec;
  }

  /* the liveness signature. one number per output frame off everything this
     file wrote plus everything the mascot and the captions wrote, so two
     identical frames are a fact rather than a suspicion. post10 shipped a pair
     and only found out at sixty. */
  const sigs = [];
  const samples = [];
  let sawAccent = false, maxCards = 0;
  const wall = Date.now();

  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const mf = mascotFrame(mas, t);
      const cf = captionFrame(cap, t);
      const o = frameAt(t, f, SECONDS, v.endIn);
      await page.evaluate(fr => window.__cap.apply(fr), cf);
      await page.evaluate(fr => window.__mas.apply(fr), mf);
      await page.evaluate(fr => window.__p14.apply(fr), o);
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);

      if (k === 0) {
        let s = o.mo * 7 + o.logo.o * 11 + o.logo.rot * 13 + o.end.o * 17 + o.end.sc * 19
          + o.z.k * 23 + o.z.tx * 29 + o.z.ty * 31
          + o.g.sx * 37 + o.g.sy * 41 + o.g.split * 43 + o.g.noise * 47 + o.g.flash * 53
          + o.g.bands.length * 59
          + mf.card.x * 61 + mf.card.y * 67 + mf.card.rot * 71
          + mf.card.sx * 73 + mf.card.sy * 79 + mf.bubble.o * 83
          + cf.g.reduce((a, g, i) => a + (g[0] + g[1] + g[2]) * (101 + i), 0)
          + cf.w.reduce((a, w, i) => a + (w[0] + w[1] + w[2] + w[3]) * (211 + i), 0);
        for (let e = 0; e < 2; e++) {
          s += mf.eyes[e].x * (127 + e) + mf.eyes[e].y * (131 + e)
            + mf.eyes[e].sx * (137 + e) + mf.eyes[e].sy * (139 + e) + mf.eyes[e].lid * (149 + e);
          s += mf.brows[e].o * (151 + e) + mf.brows[e].y * (157 + e);
        }
        sigs.push(+s.toFixed(6));
      }

      /* the samples, on the frame's own instant, four times a second. */
      if (k === 0 && f % Math.max(1, Math.round(FPS / 4)) === 0) {
        const smp = await page.evaluate(vw => ({
          cap: window.__cap.safe(vw, window.__P14.VH),
          bubble: window.__mas.bubbleSafe(vw, window.__P14.VH),
          band: window.__mas.band(),
          logo: window.__p14.logoSweep(),
          end: window.__p14.endSafe(),
          lit: window.__p14.lit(),
          acc: [...document.querySelectorAll('.cap-float .cap-w')].some(el => {
            const cs = getComputedStyle(el);
            return cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.02
              && cs.color !== getComputedStyle(document.documentElement).getPropertyValue('--fg').trim()
              && /rgb\(15,\s*138,\s*60\)/.test(cs.color);
          }),
        }), VW);
        if (smp.acc) sawAccent = true;
        maxCards = Math.max(maxCards, smp.lit.caps);
        samples.push({
          t: +(f / FPS).toFixed(3), f,
          big: f < GONE_FRAME,
          shaken: glitchAt(f).heat > 0,
          dotsLit: o.dots.some(d => d.o > 0.02),
          ...smp,
        });
      }

      const shot = await cdp.send('Page.captureScreenshot', {
        format: 'jpeg', quality: 94, captureBeyondViewport: false,
        clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
      });
      const file = SUB > 1
        ? path.join(SUBS, 's' + String(idx).padStart(6, '0') + '.jpg')
        : path.join(FRAMES, 'f' + String(f).padStart(5, '0') + '.jpg');
      fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
      await advance(SUBSTEP);
    }
    if (f % 60 === 0) {
      console.log('  ' + String(f).padStart(4) + '/' + N + '  t=' + (f / FPS).toFixed(2) + 's  '
        + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
    }
  }

  /* ---- a still per beat ----
     so the cut can be read as a strip rather than scrubbed as a video. **a
     still is a frame the clip actually has**: the time asked for is rounded to
     a frame and then that frame's own instant is what gets drawn, so the
     glitch, which is a function of the frame index, and everything else, which
     is a function of the time, can never disagree about which moment a still
     is. the fault stills take their times off the windows' own starts for the
     same reason, because a window is snapped to the grid and GL_CUT is not. */
  fs.rmSync(VERIFY, { recursive: true, force: true });
  fs.mkdirSync(VERIFY, { recursive: true });
  const pill = k => mas.marks[k].bubbles[0];
  const mid = b => (b.full + b.leaving) / 2;
  const stills = [
    [0, 'a-frame-zero'],
    [mas.marks[0].settled + 0.10, 'b-the-first-hop'],
    [pill(0).in + 0.10, 'c-the-dots-climbing'],
    [mid(pill(0)), 'd-the-news'],
    [GL_WINDOWS[0].t0, 'e-the-hit'],
    [GONE_FRAME / FPS + 0.02, 'f-he-is-gone'],
    [GL_WINDOWS[1].t0, 'g-back-in-the-corner'],
    [GL_WINDOWS[2].t0, 'h-the-mark-arrives'],
    [PANEL_AT + PANEL.in + 0.06, 'i-the-panel'],
    /* the middle of a beat rather than a fixed offset into it: a still taken
       0.30s after a line starts catches whichever card happens to be a third of
       the way through its own fade, and a card at half opacity is not what the
       caption looks like. */
    [(v.beats[0].start + v.beats[0].end) / 2, 'j-line-one'],
    [mid(pill(1)), 'k-yes'],
    [TYPING.at[Math.floor(TYPING.chars * 0.45)], 'l-typing'],
    [(v.beats[1].start + v.beats[1].end) / 2, 'm-line-two'],
    [mid(pill(2)), 'n-love-it'],
    [(v.beats[2].start + v.beats[2].end) / 2, 'o-line-three'],
    [mid(pill(3)), 'p-nice'],
    [TYPING.until + 0.10, 'q-the-line-is-typed'],
    [v.endIn + END.in + 0.20, 'r-the-end-card'],
    [SECONDS - 0.06, 's-the-last-frame'],
  ];
  for (const [want, name] of stills) {
    const f = Math.min(N - 1, Math.max(0, Math.round(want * FPS)));
    const t = f / FPS;
    await page.evaluate(fr => window.__cap.apply(fr), captionFrame(cap, t));
    await page.evaluate(fr => window.__mas.apply(fr), mascotFrame(mas, t));
    await page.evaluate(fr => window.__p14.apply(fr), frameAt(t, f, SECONDS, v.endIn));
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
    });
    fs.writeFileSync(path.join(VERIFY, name + '.png'), Buffer.from(shot.data, 'base64'));
  }

  console.log('  the head in the corner, worst of ' + N + ' frames at ' + headWorst.t + 's: '
    + headWorst.left + ' left, ' + headWorst.top + ' top, ' + headWorst.right + ' right, '
    + headWorst.bottom + ' bottom (floor ' + FLOOR + ')');
  console.log('  and big and centred, worst at ' + headBig.t + 's: '
    + headBig.left + ' / ' + headBig.top + ' / ' + headBig.right + ' / ' + headBig.bottom
    + ', head ' + headBig.headPx + ' device px');

  await browser.close();
  srv.close();

  if (SUB > 1) blend(N);

  return { built, head: headWorst, headBig, samples, sigs, frames: N, sawAccent, maxCards };
}

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }

/* ---------- the shutter ----------
   the subframes are averaged into frames, which is what a shutter is: a frame
   is the light that arrived over its own duration, not a sample of one instant.
   `tmix` averages a sliding window and `framestep` throws away the ones that
   straddle two output frames. post10's chain, unchanged. */
function blend(N) {
  console.log('  blending ' + N * SUB + ' subframes into ' + N + ' frames ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS * SUB), '-i', path.join(SUBS, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1)
      + ',setpts=PTS-STARTPTS,framestep=' + SUB,
    '-q:v', '2', path.join(FRAMES, 'f%05d.jpg')]);
}

function encode(wav) {
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'),
    '-i', wav,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p',
    '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-shortest',
    '-movflags', '+faststart', MP4]);
  return MP4;
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

/* ---------- go ---------- */
async function main() {
  console.log('the boring tek — post14, the fable 5.1 news flash');
  fs.mkdirSync(OUT, { recursive: true });
  if (!fs.existsSync(LOGO_FILE)) {
    throw new Error('no ' + path.relative(ROOT, LOGO_FILE) + ' — the mark is an asset, not something this file draws');
  }

  /* ---- the voice ----
     first, because the clip is cut to it: the length, the captions, the end
     card's arrival and the beat sheet are all derived off the word timings. */
  const takes = [];
  for (let i = 0; i < LINES.length; i++) takes.push(await take(i));
  const v = buildVoice(takes);
  console.log('  voice: ' + takes.length + ' takes, ' + takes.filter(t => t.cached).length
    + ' cached, ' + v.words.length + ' words, first word at ' + VOICE_AT.toFixed(2)
    + 's, last at ' + v.lastWord.toFixed(2) + 's');
  for (const b of v.beats) {
    console.log('    ' + (b.i + 1) + '  ' + b.start.toFixed(2) + '..' + b.end.toFixed(2)
      + '  ' + b.wps.toFixed(2) + ' w/s  ' + b.rate + '/' + b.pitch + '  ' + b.text);
  }
  const wps = v.beats.map(b => b.wps);
  console.log('    delivery spans ' + Math.min(...wps).toFixed(2) + ' to '
    + Math.max(...wps).toFixed(2) + ' words a second against a flat 2.3, and the gaps run '
    + v.gaps.map(g => g.toFixed(2)).join(' and ') + 's');

  /* ---- the captions ----
     float, which is the style built for a frame that is mostly picture: space
     grotesk 700, lowercase, one short card at a time, no card behind it and no
     fill of any kind. the ink is --fg and only --fg — there is no accent in
     this clip at all, so `flash` is off and a guard fails the render if the
     green is ever painted on a caption. cards may break on a comma as well as
     on a sentence end, which is what stops `smarter, cheaper to run, fewer
     false blocks` cutting cards that were never phrases. */
  const cut = markLines(v.beats);
  const cap = planCaptions(cut.words, {
    style: 'float', perCard: 3, floatSize: 44,
    cardBreak: /[.!?,;:]["')\]]?$/,
    lead: 0.10, hold: 0.28,
    /* wider than the engine's 0.28, and it came off a rendered frame in post11
       rather than out of a preference: every word kicks as it is said and a kick
       grows the word about its own centre, so a long word being spoken next to a
       short one eats the gap on its left. the fit divides by this same number,
       so opening it costs a little type size rather than overflowing the box. */
    bodyGap: 0.36,
  });
  console.log(describe(cap));
  console.log('  ' + cut.marked.length + ' line ends were marked so no card straddles two of them, '
    + 'and the marks are stripped before a card is drawn');

  /* ---- and now the length ----
     the end card is centred on the middle of the frame and the middle of the
     frame is the caption band, so it may not arrive until the last card is
     **out** rather than until the last word is said. that is the caption plan's
     own number: the group's window already carries its hold and is already
     clamped against the next one, so reading `out` off the last group is
     reading the thing the page will actually draw. */
  const capOut = Math.max(...cap.groups.map(g => g.out));
  const endIn = +Math.max(v.lastWord + 0.10, capOut + 0.06).toFixed(3);
  const SECONDS = +(endIn + END.in + TAIL).toFixed(3);
  v.track = v.track.slice(0, Math.ceil(SECONDS * SR));
  /* the derived arrival, written onto the voice record so the render, the
     stills and the guards all read one number rather than being handed one.
     it is not the voice's own — it is the voice's last word and the caption
     plan's last window, whichever is later — and this is the one line that says
     so. */
  v.endIn = endIn;
  console.log('  the clip is ' + SECONDS.toFixed(2) + 's: the last word at '
    + v.lastWord.toFixed(2) + ', the last card out at ' + capOut.toFixed(2)
    + ', the end card from ' + endIn.toFixed(2) + ' over ' + END.in.toFixed(2)
    + 's, then ' + TAIL.toFixed(2) + 's of hold');

  /* ---- the typing ----
     it starts on the second line, which is what the brief asks for, and it
     finishes far enough before the end card that the finished line can be read
     — both ends derived rather than typed, so a slower read moves the typing
     with it. */
  TYPING = typePlan(PANEL.typed, v.beats[1].start,
    +(endIn - PANEL.readAfter).toFixed(3), 0x7a1e5d);
  console.log('  the panel: "' + PANEL.typed + '", ' + TYPING.chars + ' characters typed '
    + TYPING.from.toFixed(2) + '..' + TYPING.until.toFixed(2) + 's ('
    + (TYPING.chars / (TYPING.until - TYPING.from)).toFixed(1) + ' a second), '
    + TYPING.keys.length + ' key ticks, and it is up ' + PANEL_AT.toFixed(2)
    + '..' + (endIn - 0.04).toFixed(2));

  /* ---- the mascot ----
     one plan, in the corner, exactly as post11 places him. the opening is the
     same plan under a transform — see THE ZONE at the top of this file. */
  const marks = planMarks(v.beats, endIn);
  const mas = planMascot({
    seconds: SECONDS, marks, theme: 'light', pos: 'bottom-left',
    band: { x: CAP_BOX.x, y: CAP_BOX.y, w: CAP_BOX.w, h: CAP_BOX.h },
    seed: 0x14a5c0,
  });
  /* held where `frameAt` can read it: the opening's three dots are on the
     module's own curves, so the frame function has to be able to ask the plan
     what the bubble is doing. */
  MASCOT.plan = mas;
  console.log(describeMascot(mas));
  const rep = mascotMotion(mas, FPS, SECONDS);
  console.log(describeMotion(rep));
  const rep60 = FPS === 60 ? rep : mascotMotion(mas, 60, SECONDS);
  if (FPS !== 60) {
    console.log('  and at sixty, which is what the motion guards read:');
    console.log(describeMotion(rep60));
  }

  ZONE = { big: zoneOf(mas, PLACE.big), corner: zoneOf(mas, PLACE.corner) };
  console.log('  the zone: corner k=' + ZONE.corner.k.toFixed(3) + ' at ('
    + (mas.box.left + mas.size / 2).toFixed(0) + ',' + (mas.box.top + mas.size / 2).toFixed(0)
    + '), head ' + (ZONE.corner.head * DSF) + ' device px');
  console.log('    big k=' + ZONE.big.k.toFixed(3) + ' at (' + PLACE.big.cx + ','
    + PLACE.big.cy + '), head ' + (ZONE.big.head * DSF) + ' device px, and the thought is '
    + 're-anchored from (' + ZONE.big.b.page.x + ',' + ZONE.big.b.page.y + ') to ('
    + PLACE.big.bubble.at.x + ',' + PLACE.big.bubble.at.y + ') at '
    + ZONE.big.b.s.toFixed(3) + ' of the zone, which is natural size');

  /* ---- the beat sheet ----
     one clock, and every line of it is a number something else already decided
     rather than a description of the cut. */
  const sheet = [
    [0, 'he is big and centred, delighted'],
    [GL_WINDOWS[0].t0, 'the hit. the fault lands on him'],
    [GONE_FRAME / FPS, 'he is gone'],
    [GL_WINDOWS[1].t0, 'again, and he is bottom left at corner size'],
    [GL_WINDOWS[2].t0, 'the mark glitches in at the top and starts turning'],
    [PANEL_AT, 'the chat panel rises, with its placeholder on it'],
    ...v.beats.map(b => [b.start, 'line ' + (b.i + 1) + ': ' + b.text]),
    [TYPING.from, 'the first character: "' + PANEL.typed + '"'],
    [TYPING.until, 'the last one'],
    ...mas.marks.flatMap(m => [
      [m.t, m.state + (m.bubble ? '' : '')],
      ...(m.bubbles || []).map(b => [b.full, 'the pill is up: "' + b.text + '"']),
    ]),
    [v.endIn - PANEL.out - 0.04, 'the panel starts leaving'],
    [v.endIn, 'the end card starts arriving'],
    [SECONDS, 'out'],
  ].sort((a, b) => a[0] - b[0]);
  console.log('\n  the beats');
  for (const [t, what] of sheet) console.log('    ' + t.toFixed(2).padStart(6) + 's  ' + what);

  /* ---- the sound ----
     the mascot's own cues — a pop when a thought arrives and a ding on the
     agreement beat, both out of `mascotCues` rather than typed against the
     picture — plus one glitch per fault, at the window's own start. there is
     nothing else in the file and there is no music.

     the three glitches are three calls rather than one, because they are
     different lengths and different levels: the first is the cut and is the
     loudest thing in the clip, and the other two are smaller faults under it.
     `renderSfx` sets one gain per kind, which is the right shape for a mix
     where a sound means one thing, so a quieter copy of a glitch is a second
     call with a second gain summed onto the same bus. */
  /* the hand under the panel is the fourth kind of cue and it is the same rule
     as the other three: every one of them is a time something else already
     decided. `key` is post11's recipe and post11's level — the quietest thing
     in the set after the sweep, because it is the only sound that repeats a
     dozen times inside five seconds and it plays under a voice. */
  const cues = mascotCues(mas).concat(TYPING.keys.map(t => ({ t, kind: 'key' })));
  const sfx = renderSfx(cues, SECONDS);
  const GLITCH_DB = [-20, -26, -30];
  for (let i = 0; i < GL_WINDOWS.length; i++) {
    const w = GL_WINDOWS[i];
    const one = renderSfx([{
      t: w.t0, kind: 'glitch',
      opts: { len: Math.min(0.16, w.t1 - w.t0), burst: 0.005, crush: 4200 - i * 600,
        f0: 230 - i * 20, f1: 120, seed: w.seed },
      from: 'fault ' + (i + 1) + ' of three, at the window\'s own start',
    }], SECONDS, { gains: { glitch: GLITCH_DB[i] } });
    for (let j = 0; j < sfx.buf.length; j++) sfx.buf[j] += one.buf[j];
    sfx.report.push(...one.report);
  }
  sfx.report.sort((a, b) => a.t - b.t);
  console.log('  sound: ' + (cues.length + GL_WINDOWS.length) + ' cues — '
    + Object.entries(sfx.report.reduce((a, c) => (a[c.kind] = (a[c.kind] || 0) + 1, a), {}))
      .map(([k, n]) => n + ' ' + k).join(', ') + ', and no music');

  if (PLAN_ONLY) {
    console.log('\n  ' + SECONDS.toFixed(2) + 's, ' + Math.round(FPS * SECONDS)
      + ' frames at ' + FPS + 'fps. nothing was rendered.');
    return;
  }

  const N = Math.round(FPS * SECONDS);
  let state = null;
  if (ONLY_ENCODE) state = JSON.parse(fs.readFileSync(STATE, 'utf8'));
  else {
    state = await render(cap, mas, v, N, SECONDS);
    fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
  }

  /* ---- the mix ----
     the read on top, the small bus under it, ducked while a word is being
     spoken, then the loudness pass that keeps its best answer rather than its
     last. both halves of that discipline were paid for by post5. */
  const env = voiceEnvelope(v.words, SECONDS);
  const mix = mixdown(v.track, sfx.buf, env, { duck: DUCK, voiceGain: VOICE_TRIM });
  const under = checkUnderVoice(mix.voiceOut, mix.bus);
  const baseMix = mix.out.slice();
  const passes = [];
  const miss = q => Math.abs(q - TARGET_LUFS);
  let lift = 0, ceiling = WAV_CEILING, best = null;
  for (let i = 0; i < 12; i++) {
    mix.out.set(baseMix);
    if (lift) applyGain(mix.out, lift);
    const l = limit(mix.out, ceiling);
    writeWav(WAV, mix.out);
    const m = loudness(ffmpeg, WAV);
    const pass = { lift, ceiling, lufs: m.lufs, tp: m.truePeak, gr: l.reduction };
    passes.push(pass);
    if (!m.ok) { best = pass; break; }
    /* ---------- the ceiling wins, and it is post12's argument ----------
       this read has 17 dB of crest on it, so the last three decibels of the
       loudness target are bought entirely with limiting: the pass that reaches
       -15.5 costs 4.6 dB of gain reduction and every one after it costs a whole
       decibel more for a fifth of a decibel of loudness. that is not louder, it
       is denser, and on a ten second clip of one voice it is audible as
       pumping.

       so the loop stops at the last pass inside `MAX_REDUCTION` rather than at
       the one closest to -14. the target is a target and the ceiling is a
       ceiling, and where they disagree the ceiling is the one that is about how
       the file sounds. post10 and post12 both shipped under target for the same
       reason and both said so; this prints which of the two decided it. */
    if (best && pass.gr > MAX_REDUCTION) break;
    if (m.truePeak != null && m.truePeak > WAV_CEILING) {
      ceiling = +(ceiling - (m.truePeak - WAV_CEILING) - 0.05).toFixed(2);
      continue;
    }
    if (best && miss(m.lufs) >= miss(best.lufs) - 0.05) break;
    best = pass;
    if (miss(m.lufs) <= 0.3) break;
    lift = +(lift + TARGET_LUFS - m.lufs).toFixed(2);
  }
  if (!best) best = passes[passes.length - 1];
  mix.out.set(baseMix);
  if (best.lift) applyGain(mix.out, best.lift);
  const lim = limit(mix.out, best.ceiling);
  writeWav(WAV, mix.out);

  const file = encode(WAV);
  const p = probe(file);
  const lu = loudness(ffmpeg, file);

  console.log('\nrendered');
  console.log('  ' + p.w + 'x' + p.h + ' @' + p.fps + 'fps  ' + p.seconds.toFixed(2) + 's  '
    + (p.audio ? 'with sound' : 'SILENT') + '  '
    + (fs.statSync(file).size / 1e6).toFixed(2) + ' MB  ' + path.relative(ROOT, file));
  console.log('  the shutter is ' + (BLUR ? 'open, ' + SUB + ' subframes to a frame' : 'closed'));
  console.log(describeMix(sfx.report, { lufs: lu && lu.ok ? lu.lufs : null }));
  console.log('  the ' + (Math.abs(best.lufs - TARGET_LUFS) <= 0.35 ? 'loudness target'
    : 'limiter ceiling of ' + MAX_REDUCTION + ' dB') + ' decided the gain: ' + best.lift.toFixed(2)
    + ' dB up, ' + best.lufs + ' LUFS on the wav against a ' + TARGET_LUFS + ' target');
  console.log('  the loudness loop, ' + passes.length + ' passes: '
    + passes.map(x => x.lift.toFixed(2) + 'dB to ' + x.lufs + ' LUFS, tp ' + x.tp
      + ', gr ' + x.gr.toFixed(2)).join('  |  '));
  if (lu && lu.ok) {
    console.log('  loudness ' + lu.lufs + ' LUFS integrated, ' + lu.lra + ' LU range, true peak '
      + lu.truePeak + ' dBFS, measured on the mp4, the limiter pulling '
      + lim.reduction.toFixed(2) + ' dB at its hardest');
  }
  console.log('  a still per beat in ' + path.relative(ROOT, VERIFY));

  if (!KEEP && !ONLY_ENCODE) {
    fs.rmSync(FRAMES, { recursive: true, force: true });
    fs.rmSync(SUBS, { recursive: true, force: true });
  }

  const fail = guard(state, v, cut, cap, mas, rep60, sfx, under, lu, lim, p, SECONDS);
  if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
  console.log('\nall checks passed.');
}

/* ---------- the guards ----------
   everything below is a fact about the finished file or about a plan the
   finished file was built from, and every one of them is a number rather than a
   description. */
function guard(state, v, cut, cap, mas, rep60, sfx, under, lu, lim, p, SECONDS) {
  const fail = [];
  const B = state.built;

  /* ---- the file ---- */
  if (p.w !== VW * DSF || p.h !== VH * DSF) fail.push('not ' + VW * DSF + 'x' + VH * DSF);
  if (Math.abs(p.fps - FPS) > 0.5) fail.push('not ' + FPS + 'fps');
  if (Math.abs(p.seconds - SECONDS) > 0.25) fail.push(p.seconds + 's, wanted ' + SECONDS);
  if (!p.audio) fail.push('no audio track — the read did not mux');
  /* the brief's own length, and it is a guard rather than a note. */
  if (SECONDS < RUN.min || SECONDS > RUN.max) {
    fail.push('the clip runs ' + SECONDS.toFixed(2) + 's and the brief asks for '
      + RUN.min + ' to ' + RUN.max);
  }

  /* ---- the mark ----
     it is an asset and the whole promise about it is that nothing was done to
     it, so the promise is measured: the drawn box has the file's own aspect
     ratio, no filter is computed on it, it is never cropped or letterboxed by
     an object-fit, and its **sweep** — the circle a turning square covers —
     clears the platform on every sample. */
  const L = B.logo;
  if (!L.naturalW || !L.naturalH) fail.push('the mark reports no natural size — it did not decode');
  else {
    const wantRatio = L.naturalW / L.naturalH;
    const gotRatio = L.drawnW / L.drawnH;
    if (Math.abs(wantRatio - gotRatio) > 0.005) {
      fail.push('the mark is drawn at ' + gotRatio.toFixed(4) + ' against its own '
        + wantRatio.toFixed(4) + ' — it is being distorted');
    }
  }
  if (L.filter !== 'none') fail.push('there is a filter on the mark: ' + L.filter);
  if (L.objectFit !== 'fill' && L.objectFit !== 'none') {
    fail.push('the mark has object-fit ' + L.objectFit + ', which can crop it');
  }
  if (Math.abs(L.drawnW * DSF - LOGO.size * DSF) > 1) {
    fail.push('the mark drew ' + (L.drawnW * DSF) + ' device px wide, wanted ' + LOGO.size * DSF);
  }
  {
    const lit = state.samples.filter(s => s.lit.logo);
    if (!lit.length) fail.push('the mark is never on screen');
    for (const s of lit) {
      for (const k of ['left', 'top', 'right', 'bottom']) {
        if (s.logo[k] < FLOOR - 0.5) {
          fail.push('the mark\'s sweep comes within ' + Math.round(s.logo[k]) + 'px of the '
            + k + ' border at ' + s.t + 's, floor is ' + FLOOR);
        }
      }
      /* it turns about its own centre and does nothing else — measured on the
         rendered rect, and therefore only on frames the frame itself is not
         being shaken: the jitter is a transform on the stage and every element
         on the page moves with it, which is the point of it. a sample inside a
         fault says nothing about whether the mark was moved. */
      if (!s.shaken && (Math.abs(s.logo.cx - LOGO.cx) > 0.6 || Math.abs(s.logo.cy - LOGO.cy) > 0.6)) {
        fail.push('the mark has moved to (' + s.logo.cx + ',' + s.logo.cy + ') at ' + s.t
          + 's, and it is meant to turn about its own centre and nothing else');
      }
    }
    /* it turns, it turns one way, and it turns at most once — the brief's own
       ceiling, checked on the frames rather than on the constant. */
    let lo = Infinity, hi = -Infinity, back = 0, prev = null;
    const N = Math.round(FPS * SECONDS);
    for (let f = 0; f < N; f++) {
      const r = frameAt(f / FPS, f, SECONDS, v.endIn).logo.rot;
      lo = Math.min(lo, r); hi = Math.max(hi, r);
      if (prev != null && r < prev - 1e-9) back++;
      prev = r;
    }
    if (hi - lo < 300) fail.push('the mark only turns ' + (hi - lo).toFixed(1) + ' degrees');
    if (hi - lo > 360.5) fail.push('the mark turns ' + (hi - lo).toFixed(1)
      + ' degrees, and the brief allows one turn');
    if (back) fail.push('the mark turns back on itself on ' + back + ' frames');
  }

  /* ---- the mascot ----
     the plan is the corner one, so the module's own phone window is checked
     against that, and the opening's placement is this file's and is checked
     separately: it is deliberately over the module's ceiling and it still has
     to clear every border. */
  if (B.mas.headPx < HEAD_PX.min || B.mas.headPx > HEAD_PX.max) {
    fail.push('the head rendered at ' + B.mas.headPx + 'px, window is '
      + HEAD_PX.min + ' to ' + HEAD_PX.max);
  }
  if (state.head.near < FLOOR - 0.5) {
    fail.push('the head comes within ' + Math.round(state.head.near) + 'px of a border at '
      + state.head.t + 's, floor is ' + FLOOR);
  }
  if (state.headBig.near < FLOOR - 0.5) {
    fail.push('big and centred, the head comes within ' + Math.round(state.headBig.near)
      + 'px of a border at ' + state.headBig.t + 's, floor is ' + FLOOR);
  }
  /* and he really is centred while he is big, checked on the arithmetic that
     places him rather than on a frame — post12's correction: the idle drift
     moves him a css px or two either way, so which frame you measure decides the
     answer and the drift is not him being off centre. */
  {
    const off = Math.abs(PLACE.big.cx - VW / 2) * DSF;
    if (off > 1) fail.push('his big placement is ' + off.toFixed(1) + 'px off centre horizontally');
    if (PLACE.big.head <= PLACE.corner.head * 1.2) {
      fail.push('the big head is ' + PLACE.big.head + ' css px against the corner\'s '
        + PLACE.corner.head + ' — that is not a change of size a viewer would notice');
    }
  }
  /* the two ends of the cut. four assertions about `frameAt` rather than a
     description of it, which is the only way this stays true after somebody
     edits the opening: he is on from frame zero, he is off across the whole gap,
     and he is back on the frame the second hit lands. */
  {
    const first = frameAt(0, 0, SECONDS, v.endIn);
    const last = frameAt((GONE_FRAME - 1) / FPS, GONE_FRAME - 1, SECONDS, v.endIn);
    const gone = frameAt(GONE_FRAME / FPS, GONE_FRAME, SECONDS, v.endIn);
    const back = frameAt(BACK_FRAME / FPS, BACK_FRAME, SECONDS, v.endIn);
    if (first.mo !== 1) fail.push('he is at ' + first.mo + ' on the first frame');
    if (first.z.k !== ZONE.big.k) fail.push('he is not at the big placement on the first frame');
    if (last.mo !== 1) fail.push('he leaves before the hit lands');
    if (gone.mo !== 0) fail.push('he is still on the frame the hit lands');
    if (back.mo !== 1) fail.push('he is not back on the frame the second hit lands');
    if (back.z.k !== ZONE.corner.k) fail.push('he is not at the corner placement when he comes back');
    /* read on the master's grid rather than on the pass that is rendering: at
       twelve the same 0.14s gap quantises to one frame, which says nothing
       about the clip and everything about the preview. post11's rule, and
       post13 carries the same note about a burst. */
    const gap60 = Math.round((T_GONE + MASCOT_LAG) * 60);
    const back60 = Math.round(T_BACK * 60);
    if (back60 - gap60 < 4) {
      fail.push('the gap he is missing from is ' + (back60 - gap60) + ' frames at sixty');
    }
    if (BACK_FRAME - GONE_FRAME < 1) fail.push('he is never actually gone at ' + FPS + 'fps');
  }
  /* the motion, off the module's own preflight at sixty. these are the numbers
     the house asks for per state and they are guards, not notes. */
  for (const st of rep60.states) {
    if (st.entryFrames == null) fail.push(st.state + ' never reached its own mark');
    else if (st.entryFrames < 3) fail.push(st.state + ' arrives in ' + st.entryFrames + ' frames, which is a cut');
    /* `neutral` is a breath and does not wind up; it is the one named exemption
       and it is mascot-test.mjs's, not this clip's. */
    if (st.state !== 'neutral' && st.antiFrames < 2) {
      fail.push(st.state + ' has no anticipation, only ' + st.antiFrames + ' frames back');
    }
    if (!(st.overshoot > 1)) fail.push(st.state + ' arrives with no overshoot, which is a hard stop');
  }
  if (rep60.blinks.repeatsInARow) fail.push(rep60.blinks.repeatsInARow + ' blinks repeat the one before them');
  if (rep60.frozenFrames) fail.push(rep60.frozenFrames + ' frames where the face is not moving at all');
  if (rep60.maxSquash > 0.08 + 1e-6) fail.push('the squash reached ' + (rep60.maxSquash * 100).toFixed(1) + '%');
  if (rep60.maxBreathe >= 0.02) fail.push('breathing reached ' + (rep60.maxBreathe * 100).toFixed(2) + '%');
  if (rep60.outside.units > 0) {
    fail.push('feature ink lands ' + rep60.outside.units.toFixed(2)
      + ' units outside the head silhouette at ' + rep60.outside.at.toFixed(2) + 's');
  }

  /* ---- the two thoughts ----
     both of them exist, both say what they were told to, both are legible, and
     neither enters the caption band or a border. the bubble is measured in the
     page rather than computed, because it is a dom box with no rotation on it —
     and because it is inside the zone, that measurement already carries this
     clip's transform without being told about it. */
  {
    const said = mas.marks.flatMap(m => (m.bubbles || []).map(b => b.text));
    const want = ['fable 5.1 out', ...LINE_MARKS.map(m => m.bubble)];
    if (said.join(' | ') !== want.join(' | ')) {
      fail.push('the thoughts are "' + said.join(' | ') + '" and the cut says "' + want.join(' | ') + '"');
    }
    /* four is the ceiling rather than the count: one in the opening and one per
       line. a fifth would be a mascot commenting on every clause. */
    if (said.length > 4) fail.push(said.length + ' thoughts, and four is the ceiling');
    for (const s of said) {
      if (s !== s.toLowerCase()) fail.push('a thought is not lower case: "' + s + '"');
      if (/[—–]/.test(s) || /\s-\s/.test(s)) fail.push('a thought has a punctuation dash in it: "' + s + '"');
    }
    if (B.caps.capPx < BUBBLE.minCap) {
      fail.push('the bubble caps measure ' + B.caps.capPx + ' device px, floor is ' + BUBBLE.minCap);
    }
    const up = state.samples.filter(s => s.bubble);
    if (!up.length) fail.push('no sample ever caught a thought on screen');
    for (const s of up) {
      for (const k of ['left', 'top', 'right', 'bottom']) {
        if (s.bubble[k] < FLOOR - 0.5) {
          fail.push('a thought comes within ' + Math.round(s.bubble[k]) + 'px of the ' + k
            + ' border at ' + s.t + 's, floor is ' + FLOOR);
        }
      }
      /* the band is a reservation for words, so it is only a collision while
         there are words to collide with. the opening thought sits over it and
         nothing is captioned for another second — the guard immediately above
         this one is what says so, and it is checked on read back frames rather
         than assumed. */
      if (!s.big && s.band && s.band.hit) {
        fail.push('a thought is inside the caption band at ' + s.t + 's');
      }
    }
    /* the opening one is re-anchored by this file, so the width it needs is this
       file's problem: the whole cluster has to fit between the safe lines at
       natural size, and it is checked on the rendered rect rather than on the
       arithmetic that placed it. */
    const bigUp = up.filter(s => s.big);
    if (!bigUp.length) fail.push('no sample caught the opening thought while he is big');
  }

  /* ---- the opening ----
     it holds for the length the brief asks for, he is delighted for the whole
     of it, and the thought is up long enough to be read. that last number is
     the one this round exists to fix: the first cut ran the quick profile and
     the pill was full for 0.30s, which is written up under THE CUT. */
  {
    if (T_BACK < 2.0 || T_BACK > 2.6) {
      fail.push('the opening holds ' + T_BACK.toFixed(2) + 's, and the brief asks for about two to two and a half');
    }
    const b = mas.marks[0].bubbles[0];
    const full = b.leaving - b.full;
    if (full < 0.60) {
      fail.push('the opening pill is fully up for ' + full.toFixed(2) + 's, floor is 0.60');
    }
    if (b.profile && b.profile.hold === BUBBLE.quick.hold && b.profile.in === BUBBLE.quick.in) {
      fail.push('the opening thought is still on the quick profile');
    }
    if (mas.marks[0].state !== 'delighted') {
      fail.push('he is ' + mas.marks[0].state + ' in the opening, not delighted');
    }
  }

  /* ---- the thought's three dots ----
     there are three, they grow toward the pill, they climb — each one higher
     and further along than the one before it — and every one of them is off on
     every frame he is not big. the last is what stops the opening's dots
     appearing in the middle of an empty frame during a corner thought. */
  {
    if (THOUGHT.dots.length !== 3) {
      fail.push('there are ' + THOUGHT.dots.length + ' dots on the thought, and the brief asks for three');
    }
    for (let i = 1; i < THOUGHT.dots.length; i++) {
      const a = THOUGHT.dots[i - 1], c = THOUGHT.dots[i];
      if (!(c.d > a.d)) fail.push('dot ' + i + ' is not bigger than the one before it');
      if (!(c.cy < a.cy)) fail.push('dot ' + i + ' does not climb');
      if (!(c.cx < a.cx)) fail.push('dot ' + i + ' does not travel toward the pill');
    }
    /* and the first one is attached to him rather than near him: it may not sit
       more than a dot's own width off the head's silhouette at its own x. */
    const first = THOUGHT.dots[0];
    const r = PLACE.big.head / 2;
    const dx = Math.abs(first.cx - PLACE.big.cx);
    if (dx < r) {
      const top = PLACE.big.cy - Math.sqrt(r * r - dx * dx);
      const off = top - (first.cy + first.d / 2);
      if (off < 0) fail.push('the first dot is inside his head');
      if (off > 20) fail.push('the first dot sits ' + off.toFixed(1) + 'css px off him, which is near him rather than on him');
    } else fail.push('the first dot is not over his head at all');
    /* they are only ever on while he is big. */
    for (const smp of state.samples) {
      if (!smp.big && smp.dotsLit) {
        fail.push('a thought dot is lit at ' + smp.t + 's, after he has gone to the corner');
      }
    }
  }

  /* ---- the chat panel ----
     it reads at phone size, the finished line fits inside it, it clears every
     border, and it is never on screen at the same time as the end card. */
  {
    const pn = B.panel;
    if (pn.capPx < 32) {
      fail.push('the panel line measures ' + pn.capPx + ' device px of cap, floor is 32');
    }
    if (pn.metaText !== PANEL.meta) {
      fail.push('the model label says "' + pn.metaText + '", not "' + PANEL.meta + '"');
    }
    if (pn.fullH > pn.room) {
      fail.push('the finished line is ' + pn.fullH + 'css px tall in ' + pn.room
        + ' of room — it would spill out of the panel');
    }
    if (pn.lines > 2) fail.push('the line wraps onto ' + pn.lines + ' lines and the panel is two tall');
    for (const k of ['left', 'top', 'right', 'bottom']) {
      if (pn[k] < FLOOR - 0.5) {
        fail.push('the panel comes within ' + Math.round(pn[k]) + 'px of the ' + k + ' border');
      }
    }
    /* the typing is cut to the read at both ends. */
    if (Math.abs(TYPING.from - v.beats[1].start) > 0.001) {
      fail.push('the typing starts at ' + TYPING.from + 's and line two starts at ' + v.beats[1].start);
    }
    if (TYPING.until > v.endIn - PANEL.readAfter + 0.001) {
      fail.push('the last character lands at ' + TYPING.until + 's, less than '
        + PANEL.readAfter + 's before the end card');
    }
    const rate = TYPING.chars / (TYPING.until - TYPING.from);
    if (rate < 4 || rate > 14) {
      fail.push('the line is typed at ' + rate.toFixed(1) + ' characters a second, which is not a hand');
    }
    /* every character lands, in order, inside the window. */
    for (let i = 1; i < TYPING.at.length; i++) {
      if (!(TYPING.at[i] > TYPING.at[i - 1])) fail.push('two characters land on the same instant');
    }
    if (typedAt(TYPING.until + 0.001) !== TYPING.chars) fail.push('the line is never finished');
    if (typedAt(TYPING.from - 0.001) !== 0) fail.push('a character lands before the typing starts');
    /* it is up when it should be and gone when it should be, read off frames. */
    const lit = state.samples.filter(x => x.lit.panel);
    if (!lit.length) fail.push('the panel is never on screen');
    for (const smp of lit) {
      if (smp.lit.end) fail.push('the panel and the end card are both up at ' + smp.t + 's');
      /* and it never touches the caption ink under it. */
      if (smp.lit.caps && smp.cap && smp.cap.worst) {
        const capTop = smp.cap.top * DSF;
        if (smp.lit.panelRect.bottom > capTop - 8) {
          fail.push('the panel reaches ' + smp.lit.panelRect.bottom + 'px at ' + smp.t
            + 's and the caption ink starts at ' + capTop.toFixed(0) + ' — they are touching');
        }
      }
      for (const k of ['left', 'top']) {
        if (smp.lit.panelRect[k] < FLOOR - 0.5) {
          fail.push('the panel crosses the ' + k + ' border at ' + smp.t + 's');
        }
      }
    }
  }

  /* ---- the captions ----
     the drawn word sequence is the spoken word sequence, one card at a time,
     inside the band, and never green. */
  {
    const drawn = cap.cells.map(c => bareWord(c.word).toLowerCase()).join(' ');
    const spoken = v.words.map(w => bareWord(w.word).toLowerCase()).join(' ');
    if (drawn !== spoken) {
      fail.push('the cards draw "' + drawn + '" and the voice said "' + spoken + '"');
    }
    /* no card may straddle two of the three lines, which is what the marks were
       put on for. every card's words have to come from one beat. */
    for (const g of cap.groups) {
      const inBeat = v.beats.filter(b => g.words.some(w => w.start >= b.start - 1e-6 && w.end <= b.end + 1e-6));
      if (inBeat.length > 1) {
        fail.push('a card straddles lines ' + inBeat.map(b => b.i + 1).join(' and ') + ': "'
          + g.words.map(w => w.word).join(' ') + '"');
      }
    }
    if (state.maxCards > 1) fail.push(state.maxCards + ' cards were up at once');
    if (state.sawAccent) fail.push('a caption painted the accent, and this clip has no accent in it');
    const seen = state.samples.filter(s => s.cap && s.cap.worst);
    for (const s of seen) {
      for (const k of ['left', 'top', 'right', 'bottom']) {
        if (s.cap[k] < FLOOR / DSF - 0.5) {
          fail.push('caption ink comes within ' + Math.round(s.cap[k] * DSF) + 'px of the ' + k
            + ' border at ' + s.t + 's, floor is ' + FLOOR);
        }
      }
    }
    /* the band does not move, which is the review checklist's own item. every
       card is laid out in one box and the box is a constant, so this is checked
       on the plan: no group carries a box of its own. */
    if (cap.box && (cap.box.x !== CAP_BOX.x || cap.box.y !== CAP_BOX.y)) {
      fail.push('the caption band moved off ' + JSON.stringify(CAP_BOX));
    }
  }

  /* ---- what is on screen when ----
     two collisions the layout is designed to make impossible, asserted on
     frames that were read back rather than on the design. a caption while he is
     big would be a caption under a head that is standing on the band; the end
     card and a caption together would be two blocks of type in one column. */
  for (const s of state.samples) {
    if (s.big && s.lit.caps) fail.push('a caption is up at ' + s.t + 's while he is big and centred');
    /* the end card arrives while the last card is still leaving, which is
       post11's cut and is deliberate: the wordmark comes up under the last
       thing that was said rather than after a hole. so the check is not that
       they never coexist, it is that they never **touch** — the group is
       centred in the room above the band for exactly this reason, and this is
       the measurement of that claim rather than the claim. */
    if (s.lit.end && s.lit.caps && s.cap && s.cap.worst) {
      const capTop = s.cap.top;                        /* css px from the top */
      const endBottom = VH - Math.min(...s.end.map(b => b.bottom)) / DSF;
      if (endBottom > capTop - 4) {
        fail.push('the end card reaches ' + endBottom.toFixed(1) + 'css px at ' + s.t
          + 's and the caption ink starts at ' + capTop.toFixed(1) + ' — they are touching');
      }
    }
  }

  /* ---- the end card ---- */
  {
    const e = B.end;
    if (!/Michroma/.test(e.font)) fail.push('the wordmark is not set in michroma: ' + e.font);
    if (e.capPx < END.minCapPx) {
      fail.push('the wordmark caps measure ' + e.capPx + ' device px, floor is ' + END.minCapPx);
    }
    const up = state.samples.filter(s => s.lit.end);
    if (!up.length) fail.push('the end card is never on screen');
    for (const s of up) {
      for (const block of s.end) {
        for (const k of ['left', 'top', 'right', 'bottom']) {
          if (block[k] < FLOOR - 0.5) {
            fail.push('the end card comes within ' + Math.round(block[k]) + 'px of the ' + k
              + ' border at ' + s.t + 's, floor is ' + FLOOR);
          }
        }
      }
    }
    /* it is centred on the middle of the frame, which is a fact about the
       constant rather than about a rendered frame — and the rendered group is
       then checked against it, because the fit decides the height and the height
       decides where the two blocks land either side of that centre. */
    if (END.centreY !== VH / 2) {
      fail.push('the end card is centred on ' + END.centreY + ' and the frame\'s middle is ' + VH / 2);
    }
    if (Math.abs(e.groupMid - VH / 2) > 2.5) {
      fail.push('the group drew with its middle on ' + e.groupMid
        + ' against a frame middle of ' + VH / 2);
    }
    /* and it arrives only once the last card is gone, which is what centring it
       on the band's own home costs. */
    {
      const capOut = Math.max(...cap.groups.map(g => g.out));
      if (v.endIn < capOut - 1e-6) {
        fail.push('the end card arrives at ' + v.endIn + 's and the last card is up until ' + capOut);
      }
    }
    const hold = SECONDS - (v.endIn + END.in);
    if (hold < 1.10) fail.push('the wordmark holds ' + hold.toFixed(2) + 's, floor is 1.10');
    /* and the fault is long over before it does. */
    const lastFault = GL_WINDOWS_60[GL_WINDOWS_60.length - 1].t1;
    if (lastFault > v.endIn) fail.push('a fault is still firing when the end card arrives');
  }

  /* ---- the glitch ----
     short, over, and it fires. three questions and all three are counted on
     frames rather than described: every window is on for at least one frame at
     both rates, no two windows overlap, and the clip as a whole is faulting for
     a small fraction of its length.

     **there is no local duty ceiling here, and that is deliberate.** post11 has
     one because its glitch is a scatter through a scene that is up for two and a
     half seconds, where a high ratio really does mean the thing never stops
     faulting. this clip's whole fault is three deliberate hits at the front,
     one of which is meant to be continuous — a ratio cannot tell "a quarter,
     scattered" from "a quarter, all of it in the first two seconds", and only
     the second is true here. what holds the beat honest is the absolute length
     of each window, checked below, and that is the check post11 says is the
     real one anyway. */
  {
    const count = (fps, windows) => {
      const N = Math.round(fps * SECONDS);
      let on = 0, lastOn = -1, flashes = 0;
      const per = windows.map(() => 0);
      for (let f = 0; f < N; f++) {
        const g = glitchAt(f, fps, windows);
        if (g.flash > 0) flashes++;
        if (g.heat > 0 || g.flash > 0) {
          on++; lastOn = f;
          const k = windows.findIndex(x => f / fps >= x.t0 && f / fps < x.t1);
          if (k > -1) per[k]++;
        }
      }
      return { N, on, lastOn, flashes, per };
    };
    const here = count(FPS, GL_WINDOWS);
    const at60 = FPS === 60 ? here : count(60, GL_WINDOWS_60);
    console.log('  the glitch: ' + here.on + ' of ' + here.N + ' frames ('
      + (here.on / here.N * 100).toFixed(1) + '%), '
      + here.per.map((c, i) => 'fault' + (i + 1) + ' ' + c).join(', ')
      + ', ' + here.flashes + ' ink frame');
    if (!here.on) fail.push('nothing glitches on any frame');
    if (here.flashes !== 1) fail.push(here.flashes + ' ink frames, and there may be exactly one');
    for (let i = 0; i < GL_WINDOWS.length; i++) {
      if (!here.per[i]) {
        fail.push('glitch window ' + i + ' at ' + GL_WINDOWS[i].t0.toFixed(2)
          + 's fired on no frames at ' + FPS + 'fps');
      }
      if (!at60.per[i]) fail.push('glitch window ' + i + ' fired on no frames at 60fps');
      const len = GL_WINDOWS_60[i].t1 - GL_WINDOWS_60[i].t0;
      if (len > 0.30) {
        fail.push('fault ' + (i + 1) + ' runs ' + len.toFixed(2) + 's, and a tv glitch that '
          + 'outstays a third of a second is a broken render');
      }
    }
    for (let i = 1; i < GL_WINDOWS.length; i++) {
      if (GL_WINDOWS[i].t0 < GL_WINDOWS[i - 1].t1 - 1e-9) {
        fail.push('glitch windows ' + (i - 1) + ' and ' + i + ' overlap');
      }
    }
    /* the two mascot windows have to meet, because the stretch he is missing
       from is not allowed to contain a clean frame. */
    if (Math.abs(GL_WINDOWS_60[0].t1 - GL_WINDOWS_60[1].t0) > 1e-9) {
      fail.push('there is a clean frame between him going and him coming back');
    }
    const total = at60.on / at60.N;
    if (total > 0.12) {
      fail.push('the clip glitches on ' + (total * 100).toFixed(1) + '% of its frames, ceiling 12%');
    }
    if (at60.lastOn / 60 > T_LOGO + 0.4) {
      fail.push('the glitch is still firing at ' + (at60.lastOn / 60).toFixed(2) + 's');
    }
  }

  /* ---- the sound ---- */
  for (const r of sfx.report) {
    if (r.cut) fail.push('the ' + r.kind + ' cue at ' + r.t + 's was cut off by the end of the clip');
    if (r.t < 0 || r.t > SECONDS) fail.push('the ' + r.kind + ' cue at ' + r.t + 's is outside the clip');
  }
  {
    const pops = sfx.report.filter(r => r.kind === 'pop').length;
    const thoughts = mas.marks.reduce((a, m) => a + (m.bubbles || []).length, 0);
    if (pops !== thoughts) fail.push('there are ' + pops + ' pops against ' + thoughts + ' thoughts');
    /* the hand under the panel: one tick per four characters plus the two ends,
       and every one of them inside the typing window. */
    const keys = sfx.report.filter(r => r.kind === 'key');
    if (keys.length !== TYPING.keys.length) {
      fail.push('there are ' + keys.length + ' key ticks against ' + TYPING.keys.length + ' planned');
    }
    for (const k of keys) {
      if (k.t < TYPING.from - 1e-6 || k.t > TYPING.until + 1e-6) {
        fail.push('a key tick at ' + k.t + 's is outside the typing window');
      }
    }
  }
  if (sfx.report.filter(r => r.kind === 'glitch').length !== GL_WINDOWS.length) {
    fail.push('the faults and their sounds have come apart');
  }
  if (under && under.worst != null && under.worst > 0) {
    /* the bus under the read, which is what `checkUnderVoice` is for: an effect
       louder than the word it plays under is an effect nobody asked for. */
    if (under.over && under.over.length) {
      fail.push(under.over.length + ' effect frames are over the voice, the worst at '
        + under.over[0].t + 's');
    }
  }
  if (lu && lu.ok) {
    if (lu.truePeak > PEAK_CEILING) {
      fail.push('the true peak is ' + lu.truePeak + ' dBFS, over the ' + PEAK_CEILING + ' ceiling');
    }
    if (lu.lufs < MIN_LUFS) fail.push('the file measures ' + lu.lufs + ' LUFS, under the ' + MIN_LUFS + ' floor');
    if (lu.lufs > TARGET_LUFS + 0.5) {
      fail.push('the file measures ' + lu.lufs + ' LUFS, over the ' + TARGET_LUFS + ' target');
    }
  } else fail.push('ebur128 said nothing about the finished file');
  if (lim.reduction > MAX_REDUCTION) {
    fail.push('the limiter took ' + lim.reduction.toFixed(2) + ' dB, over the '
      + MAX_REDUCTION + ' dB this clip allows it');
  }
  /* no dead air. the read is three lines and two breaths, so any hole in it
     over a second is a hole nobody put there. */
  for (let i = 1; i < v.beats.length; i++) {
    const hole = v.beats[i].sound.start - v.beats[i - 1].sound.end;
    if (hole > 1.00) {
      fail.push('there is a ' + hole.toFixed(2) + 's hole in the read after line ' + i);
    }
  }

  /* ---- the copy ----
     the brand rule, checked rather than trusted, on everything a viewer can
     read: the three lines, the two thoughts and the address. hyphens inside
     words are spelling and stay; a dash used as punctuation does not. */
  {
    const readable = [...LINES.map(l => l.text),
      ...mas.marks.flatMap(m => (m.bubbles || []).map(b => b.text)),
      'theboringtek.com', 'the boring tek'];
    for (const s of readable) {
      if (/[—–]/.test(s) || /\s-\s/.test(s)) fail.push('a punctuation dash reaches the screen: "' + s + '"');
    }
    for (let i = 0; i < LINES.length; i++) {
      if (LINES[i].text !== LINES[i].text.toLowerCase()) {
        fail.push('line ' + (i + 1) + ' is not lower case: "' + LINES[i].text + '"');
      }
    }
  }

  /* ---- nothing is ever a still frame ----
     two identical frames in a row is post10's own fault and it only appeared at
     sixty. it is the check the empty stretch in the opening is written around:
     the fault runs across the whole of it, so there is nothing there that could
     be still. */
  {
    let repeats = 0, first = null, smallest = Infinity;
    for (let i = 1; i < state.sigs.length; i++) {
      const d = Math.abs(state.sigs[i] - state.sigs[i - 1]);
      if (d === 0) { repeats++; if (first == null) first = i; }
      smallest = Math.min(smallest, d);
    }
    console.log('  liveness: smallest change between frames ' + smallest.toExponential(2)
      + (repeats ? ', ' + repeats + ' IDENTICAL PAIRS' : ', no identical pairs'));
    if (repeats) {
      fail.push(repeats + ' pairs of identical frames, the first at frame ' + first
        + ' (' + (first / FPS).toFixed(2) + 's)');
    }
  }

  return fail;
}

await main();
