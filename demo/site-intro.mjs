/* the boring tek — site-intro, part one of the website video.

     cd demo
     DEMO_FPS=12 node site-intro.mjs   the preview pass
     node site-intro.mjs               60fps final
     node site-intro.mjs --voice       the read and the clock only, no browser
     node site-intro.mjs --check       build the page, run the guards, render nothing
     node site-intro.mjs --stills      the two approval stills, no film
     node site-intro.mjs --fonts       the subtitle font sheet, one still
     node site-intro.mjs --encode-only re-encode from kept frames
     node site-intro.mjs --keep-frames leave the jpegs on disk

   **one output path, overwritten every run:** `demo/out/site-intro-1920x1080.mp4`.
   Beat stills land in `demo/out/verify-site-intro/`, the two ping schedules in
   `out/site-intro-pings.json` and the page's own measurements in
   `out/site-intro-built.json`.

   ---------- what it is ----------
   12 seconds, **landscape**, and the only landscape thing in this folder. he
   drops in from the top of a white frame onto the spot the approved still put
   him on, next to a turning globe. he says hello and waves. he says wait and
   turns all the way to the globe — and then **the picture breaks**: four tenths
   of a second of rgb split, torn scanlines and static, with the theme turning
   over on one frame inside it, and it comes back black. he turns to the viewer,
   says now much better, and the globe comes apart under the house fault and
   leaves the wordmark standing where it was.

   ---------- the two stills are the two ends of it ----------
   `--stills` still renders them and they are still the contract: the light one
   is the first half's frame and the dark one is the second half's, and the cut
   in the middle is the film going from one to the other on a single frame.
   every number the film places — where he stands, how big the globe is, where
   the subtitle sits — is the stills' number rather than a second copy of it.

   ---------- the cut is a theme, not a dissolve ----------
   one attribute. `data-theme` goes from light to dark on one frame and every
   colour on the page follows it: the ground, his face, his eyes, the glow, the
   shadow, the subtitle. that is `index.html`'s own mechanism and `lib/mascot.mjs`
   already carries `__mas.theme()` for it.

   **the globe cannot follow an attribute, so there are two of them.** the light
   one is dark continents on a light ball and the dark one is post24's, white
   land on black, and they are different ink rather than an inversion — a limb
   darkens a ball at its edge in both themes, and `filter:invert` would brighten
   one of them. so `lib/globe.mjs` grew a namespace, both instances sit at the
   same centre at the same diameter turning at the same rate, and the cut hides
   one and shows the other. only the visible one is ever drawn, so a frame costs
   what one globe costs.

   ---------- pings on land, in both themes ----------
   a ping is born on a **rendered pixel of the frame it is born on**, and that
   rule was written when land was white and sea was black, so one ceiling said
   both "dark" and "the sea". invert the ink and they come apart. the module's
   ping test is a luminance **window** now: the light globe asks for 0 to 60,
   which is its dark continents, and the dark globe asks for 90 to 255, which is
   its white ones. ocean is 0 on the dark globe at every limb angle, so nothing
   in the window can be sea.

   ---------- only calm eyes ----------
   three of the module's nine states are out of bounds here: `surprised` takes
   an eye to 2.6 times its own height and raises the brows, `unimpressed` lowers
   them, and the two turn states throw the head off camera. the marks may ask
   for `neutral` or `delighted` and nothing else — and the guard does not trust
   that, because a state is not the only thing that writes an eye. it walks
   every rendered frame and reads the drawn eye and the drawn brow.

   ---------- and a ping is on a continent twice over ----------
   the colour rule reads the rendered pixel under the point, which is its whole
   strength: it cannot disagree with what ships. it is also one test, and a
   picture can be right about a colour and wrong about a place. so every
   candidate is now **also** ray cast against the land polygons themselves,
   under the same even-odd rule the mask is filled with, and it has to pass
   both. the run then names the ground under every ping the delivered film puts
   on a frame.
*/

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  planMascot, mascotFrame, mascotCss, mascotMarkup, mascotRuntime,
  mascotPagePlan, mascotCues, stillMoment, HAND_POSES,
} from './lib/mascot.mjs';
import { globeCss, globeMarkup, globeScript, readLand } from './lib/globe.mjs';
import { brandTokens } from './lib/captions.mjs';
import { speak, VOICE_OUT } from './lib/voice.mjs';
import {
  SR, renderSfx, decode, mixdown, applyGain, limit,
  writeWav, loudness, voiceEnvelope, dbfs,
} from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-site-intro');
const VERIFY = path.join(OUT, 'verify-site-intro');
/* the subframes, when the shutter is open. it is SAMPLE_DIR rather than SUBS
   because SUBS is already the subtitle windows in this file. */
const SAMPLE_DIR = path.join(OUT, 'subframes-site-intro');

/* ---------- the stage ---------- */
const VW = 960, VH = 540, DSF = 2;
const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1 / FPS;

/* ---------- title safe, ten per cent ----------
   the phone safe area in `lib/mascot.mjs` is about a platform's own chrome over
   a vertical clip and there is none here, so this is the broadcast convention:
   96 css px left and right, 54 top and bottom. */
const SAFE = { left: VW * 0.10, right: VW * 0.10, top: VH * 0.10, bottom: VH * 0.10 };

const argv = process.argv.slice(2);
const ONLY = (argv.find(a => a.startsWith('--only=')) || '').split('=')[1] || null;
const FONT_SHEET = argv.includes('--fonts');
const STILLS_ONLY = argv.includes('--stills');
const VOICE_ONLY = argv.includes('--voice');
const CHECK = argv.includes('--check');
const ONLY_ENCODE = argv.includes('--encode-only');
const KEEP = argv.includes('--keep-frames');

/* ---------- the shutter ----------
   **a frame is the light that arrived over its own duration**, not a sample of
   one instant, so a fast move is rendered as several subframes and averaged.
   `--blur` opens it and `--blur=8` says how far; with no number the file solves
   it from its own fastest move, which is the only honest way to pick it — the
   number that matters is how far the quickest thing on the screen travels
   between two samples, and that is a property of this cut rather than a taste.

   **4.0 css px a sample, not post20's 6.3, and post25 is why.** that reference
   is a landing: a large soft shape moving fast, where consecutive copies of it
   overlap and average into a smear. post25 solved 6 subframes off its own
   fastest move, landed at 5.57 css px a sample — finer than the reference — and
   its lunge still banded into six countable copies. the reason was the eyes: an
   eye slab is a few px tall, so consecutive copies of it barely overlap and the
   average is a comb rather than a blur. **the step has to be under the smallest
   moving feature** — this mascot's eye is 4.4 grid units, which is 8.7 css px
   at size 127.

   **and post25's own answer for that, about 4 css px, is still too coarse.**
   this clip solved 6 subframes at 3.46 css px a sample — finer than post25
   asked for — and the landing at 1.13s came back with both eye slabs combed
   into six countable stripes while the head's own edge blurred perfectly
   smoothly. the reason is that the step is only half the criterion. what a
   viewer sees is the **ripple**, and the ripple is set by how many copies of
   the feature overlap at a given point: that count is the feature's height over
   the step, and the ripple is its reciprocal. at 8.7 over 3.46 the count
   alternates between two and three copies, which is a fifty per cent swing in
   brightness across the smear, and fifty per cent is a stripe.

   so the target is written as a **fraction of the smallest moving feature**
   rather than as a constant somebody measured once on a different clip. a fifth
   of the eye keeps the count between four and five copies and the ripple around
   twenty per cent, which reads as a blur. it is the same shape of correction
   post25 made to post20 and for the same reason — a constant tuned against one
   clip's ink is not a rule — taken one step further. */
const BLUR = argv.some(a => a === '--blur' || a.startsWith('--blur='));
const BLUR_ARG = Number((argv.find(a => a.startsWith('--blur=')) || '').split('=')[1]) || 0;
const SUB_MAX = 12;

/* ---------- him ----------
   127 css px puts the plate at 238 device px, which sits in the middle of
   `lib/mascot.mjs`'s own head window rather than on its ceiling. */
const SIZE = 127;
const MAS = { cx: 250, cy: 252 };
/* the smallest thing on this mascot that moves: one eye slab, in css px, and
   the shutter's target step is a fifth of it. see The shutter above — it lives
   down here because it is a property of how big he is drawn. */
const EYE_CSS = 4.4 * SIZE / 64;
const SUB_STEP_WANT = +(EYE_CSS / 5).toFixed(2);

/* ---------- the globe ----------
   212 css across against his 119 css plate, and 340 degrees of spin at the top
   of the clip puts africa and europe on the front, which is the face with the
   most land on it and therefore the most room for pings. */
const G = { d: 212, cx: 720, cy: 252, tilt: 14, spin0: 340, rate: 9 };

/* ---------- the subtitle ----------
   Nunito 500 at 18 css px, one line, no pill, bottom centre. `nowrap` is what
   makes one line a fact rather than a hope: a subtitle that wrapped would
   silently take a second line and push itself out of the bottom of the safe
   area. the colour is not written here — it is `--sub` on the light page and
   white on the dark one, so it follows the cut with everything else. */
const SUB = { size: 18, bottom: 70, lead: 0.10, tail: 0.30 };

/* ---------- the read ---------- */
const VOICE = 'calm';
const LINES = [
  { key: 'hello', text: 'hello.' },
  { key: 'wait', text: 'wait.' },
  { key: 'welcome', text: 'now much better. welcome.' },
];
const SILENCE_DB = -42, PRE = 0.06, POST = 0.12;

/* ---------- the clock ----------
   the brief's own beat list, and it is a storyboard rather than something
   derived: the times are the design and the read is placed inside them. every
   other clip in this folder cuts its picture to where the words landed; this
   one is the other way round, and `--voice` prints how far each line runs past
   the window it was given so the drift is a number rather than a surprise. */
const FALL_AT = 0.55;              /* he comes in over the top edge */
const FALL_FOR = 0.60;             /* and lands */
const LAND = +(FALL_AT + FALL_FOR).toFixed(4);
const HELLO_AT = 1.50;             /* the brief's 1.5 */
/* ---------- and here the brief's beats and the module's own timing meet ------
   `lib/mascot.mjs` gives every state an entrance and an exit it will not go
   under, and a bubble has to live inside what is left — the **hold** — because
   a thought is a thing a held face is having. `BUBBLE.quick` is 0.80s. so a
   mark that pops a bubble needs entry + 0.80 + exit before the next mark, and
   for the three states this clip uses that is 1.56 to 1.74 seconds.

   the storyboard spaces `hello` and `wait` 1.5 apart, which fits, and the beat
   after `wait` 1.0 apart, which does not — that is under the floor for every
   state in the module. taking the clap out bought most of it back: the switch
   is a fault rather than a gesture and needs no entrance, so it can sit 0.28s
   after the wait bubble clears instead of waiting on a hand to travel.

   what did **not** move: the order, the spoken lines, the fall, the fault at
   nine and the twelve seconds. `wait` is a tenth late and `welcome` a fifth
   early against the storyboard; everything else is on its number. */
const WAIT_AT = 3.14;              /* brief 3.0. `delighted` + a bubble needs 1.62 after hello */
const SWITCH_AT = 4.70;            /* the tv glitch, after the wait bubble is out at 4.42 */
const BACK_AT = 5.20;              /* he comes back to the viewer once the frame has settled */
const WELCOME_AT = 6.30;           /* brief 6.5, and closer to it than the clap cut ever got */
const FAULT_AT = 9.00;             /* brief 9.0, unmoved */
const SECONDS = 12.00;
/* what the storyboard asked for, so the report can print the drift rather than
   quietly absorbing it. */
const ASKED = { hello: 1.5, wait: 3.0, back: 5.5, welcome: 6.5, fault: 9.0, end: 12.0 };

/* ---------- the switch, and it is a fault rather than a gesture ----------
   the first cut had him clap the lights off and the theme turned over on the
   frame his palms met. it was a nice idea and it cost a hand pose, a drawing, a
   pair of sfx and a beat and a half of clock, and none of that is on the screen
   when the frame changes. this is the same event with the mechanism taken out:
   **the picture itself breaks for four tenths of a second and comes back dark.**

   four things over 0.40s, all on one heat curve so they arrive and die
   together: the house rgb split on the whole scene, horizontal slice tearing,
   a static burst, and the shake. the theme flips on **one frame inside the
   burst** rather than at either end of it, so the change is hidden by the thing
   that is making it — which is what a switch on a television actually looks
   like, and it is still one frame with no fade.

   the tear is **composited rather than displaced**, and that is worth saying
   plainly: the bands are slabs of the page's own ink drawn over the frame and
   offset sideways, not slices of the rendered picture moved. displacing the
   real image needs either N copies of a subtree that contains two canvases and
   an svg with fixed ids, or an feDisplacementMap over the whole scene, and both
   are a lot of machinery for five frames at twelve. */
const SWITCH = {
  for: 0.40,
  flipAt: 0.16,              /* how far into the burst the theme turns over */
  bands: 9,                  /* how many torn slices are available a frame */
  split: 11,                 /* css px of rgb separation at full heat */
  shakeX: 16, shakeY: 9,
  static: 0.42,              /* the noise layer's own ceiling */
  seed: 0x51d3a9,
};
const SWITCH_END = +(SWITCH_AT + SWITCH.for).toFixed(4);
/* **the cut is quantised to the frame grid**, because "one frame, no fade" is
   only true if the change lands on a frame boundary. at twelve and at sixty it
   is the same instant of film, rounded to whichever grid is running. */
const CUT_AT = +(Math.round((SWITCH_AT + SWITCH.flipAt) * FPS) / FPS).toFixed(4);

/* ---------- the fall, and the land ----------
   he starts above the top edge and accelerates, which is `p*p`, and the landing
   is post20's smash table by way of post24: a squash into the ground, a flat
   hold and a damped ring out. */
const FALL_FROM = -(MAS.cy + SIZE);
const SMASH = { flat: 0.07, back: 0.42, k: 0.52, damp: 4.2, cycles: 1.15 };

/* ---------- the turn ----------
   **`bias: 0` is what makes the turn a turn.** the module hands a head standing
   in the bottom left corner a resting turn of `TURN.bias`, 0.35, so it is
   already three quarters round before anything asks it to move — the last cut
   turned him from 0.35 to 0.50 and the review could not see it, because 0.15 of
   swing is about three css px of eye. facing the viewer at rest costs nothing
   and makes both halves of the beat legible: he turns most of the way to the
   globe and he comes all the way back.

   **1.0, and a rendered frame nearly talked it down to 0.75.** the first look
   at the settled turn was the frame at 4.00s, where the pair reads as one white
   dash and a hairline — which is post25's own words about its gaze, and it was
   pulled back on that evidence. it was the wrong evidence: 4.00s is **inside a
   blink**, both lids are 0.45 down, and a half lidded eye is a thin slab at any
   turn at all. at 4.30s, with the lids up, the two eyes measure 52 and 35
   device px and both are plainly there.

   the lesson is worth more than the number: **a turn cannot be judged on a
   frame the idle layer happens to be blinking on**, and this rig has a
   `stillMoment` for exactly that reason. */
const TURN_TO = 1.0;

/* ---------- the eyes, and it is a rule rather than a preference ----------
   **calm, happy or neutral, and nothing else.** three of the module's nine
   states are out of bounds for this clip: `surprised` takes an eye to 2.6 times
   its own height and raises the brows, `unimpressed` lowers them, and the two
   turn states throw the head away from camera. so the marks are allowed two
   states, and the guard does not trust the allowlist — it walks every rendered
   frame and reads the drawn eye and the drawn brow, because a state is not the
   only thing that can open an eye. */
const CALM_STATES = new Set(['neutral', 'delighted']);
const EYE_SY_MAX = 1.60;

/* ---------- the gloves ----------
   `hands: true` draws the resting pair from frame zero, so every glove carries
   a gate on its own opacity and the pair is only ever on screen inside a pose's
   own window. post24's two gates for post24's reason. */
const GLOVE_IN = 0.18, GLOVE_OUT = 0.14;

/* ---------- the fault, and the wordmark in the globe's place ---------- */
const END = { hard: 0.14, tail: 0.22, wmFor: 0.0, };
/* the wordmark stands in the globe's place, so it is sized against the globe
   rather than against the frame: 260 css wide against the ball's 212, which is
   a mark that has replaced an object rather than a title card that has taken
   the frame over. three lines of Michroma at 1.16 is 157 css tall, which is why
   it is centred by transform rather than by a top — the height is the fitted
   size times a constant and nothing here knows the fitted size until the page
   has measured it. */
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 260, lh: 1.16, minCapPx: 60 };
const GL = { shakeX: 11, shakeY: 6, split: 7.0, flash: 0.30, flashSize: 300, calmFrom: 0.86 };

/* ---------- the mix ---------- */
const CRF = 17;
const TARGET_LUFS = -14, SAMPLE_CEILING = -1.8;
const MAX_REDUCTION = 5.0, MIN_LUFS = -16;

/* ---------- naming the ground under a ping ----------
   `ne_110m_land.geojson` is land and nothing else — no names, no country
   codes, no continent field — so the polygon test can say a point is on land
   and cannot say where. this table is the second half of that: ordered boxes in
   lon/lat, checked in order, first hit wins.

   the order is the whole of it. greenland sits inside a north america box, the
   british isles and iceland sit inside a europe box, and europe and asia share
   a border that is a convention rather than a coastline — so the small and the
   specific go first and the two big continental boxes go last. the boxes are
   generous on purpose: a point that is already proved to be on land only has to
   be told which land, and a box that is a little too big cannot put a ping in
   the sea because the sea was already ruled out.

   it names ground rather than deciding anything: the fail is the polygon test,
   this is the report. */
const CONTINENTS = [
  { name: 'iceland', lon: [-25, -13], lat: [63, 67] },
  { name: 'the british isles', lon: [-11, 2], lat: [49.8, 61] },
  { name: 'greenland', lon: [-73, -11], lat: [59, 84] },
  { name: 'madagascar', lon: [43, 51], lat: [-26, -11.5] },
  { name: 'new zealand', lon: [166, 179], lat: [-48, -34] },
  { name: 'japan', lon: [129, 146], lat: [30, 46] },
  { name: 'antarctica', lon: [-180, 180], lat: [-90, -60] },
  { name: 'australia', lon: [112, 154], lat: [-44, -10] },
  { name: 'south america', lon: [-82, -34], lat: [-56, 13] },
  { name: 'north america', lon: [-172, -52], lat: [7, 84] },
  { name: 'africa', lon: [-18, 52], lat: [-35, 37.5] },
  { name: 'europe', lon: [-10, 60], lat: [36, 72] },
  { name: 'asia', lon: [26, 180], lat: [-11, 78] },
];
const continentOf = (lon, lat) => {
  for (const c of CONTINENTS) {
    if (lon >= c.lon[0] && lon <= c.lon[1] && lat >= c.lat[0] && lat <= c.lat[1]) return c.name;
  }
  return null;
};

/* ---------- small maths ---------- */
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const span = (t, a, b) => (t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const OUTC = p => 1 - Math.pow(1 - p, 3);

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- the two globes ----------
   same centre, same diameter, same tilt, same spin and the same rate, so the
   sphere does not jump on the cut: only the ink changes. */
const GLOBES = {
  l: {
    ns: 'l',
    ink: { land: '10,12,15', ocean: '224,228,232' },
    /* the limb is softened because it is subtracting from a light ground rather
       than adding to a dark one: at post24's numbers the rim of a light ball
       goes to about 56 and reads as a bruise. */
    limb: { amount: 0.42, power: 2.6, radial: 0.18 },
    grid: { on: true, ink: [170, 170, 170], o: 0.5 },
    /* dark continents, so the window is the bottom of the range. */
    ping: { on: true, lum: [0, 60], inLand: true, every: [0.42, 0.72] },
  },
  d: {
    ns: 'd',
    /* post24's globe, untouched: white land, black ocean, its own limb and its
       own graticule. the window is the top of the range, and the ocean is 0 at
       every limb angle so nothing in it can be sea. */
    ping: { on: true, lum: [90, 255], inLand: true, every: [0.42, 0.72] },
  },
};
const globeOpts = k => ({
  d: G.d, cx: G.cx, cy: G.cy, tilt: G.tilt, spin0: G.spin0, rate: G.rate,
  seconds: SECONDS, ...GLOBES[k],
});

/* ---------- when a bubble is allowed to pop ----------
   after the head has arrived and before the state lets go of it, and both ends
   are the module's rule rather than a taste of this file's. the entrances below
   are measured off `lib/mascot.mjs` — one mark in a plan and nothing else — and
   the two hundredths on top are slack, because a bubble landing on the exact
   frame the head settles is refused by a strict inequality.

   it is a table rather than three numbers typed into three marks, so that
   moving a beat cannot quietly put a thought inside an entrance. */
const STATE_ENTRY = { neutral: 0.46, curious: 0.60, surprised: 0.54, delighted: 0.50 };
const BUB_IN = (at, state) => +(at + STATE_ENTRY[state] + 0.02).toFixed(4);

/* ---------- the marks ----------
   he waves twice and does nothing else with his hands, so `side` is `right`
   from the first mark that names it and never changes again. */
const WAVE1_HOLD = +(WAIT_AT - HELLO_AT - 0.44).toFixed(3);
const MARKS = [
  /* **before he is on the frame, not on the frame he enters.** a state needs
     room for its own entrance, a hold and its exit, and `neutral` wants 1.06s
     of it — put on the mark he falls from, that room runs into `hello` and the
     module refuses the plan. he is four hundred px above the top edge here, so
     this mark costs the picture nothing and buys him a settled face to land
     with rather than one still arriving. */
  { t: 0.20, state: 'neutral' },
  /* **the bubbles are the list form rather than the plain one**, and that is
     the module telling this clip something. a plain `bubble` takes the full
     profile — a 0.42s hold on top of a slow entrance — and has to be out before
     its own state's hold ends. `hello` at a mark 1.5 seconds from the next one
     ran to 3.32s and the plan was refused. the list form takes `BUBBLE.quick`,
     which is what a bubble that is punctuating a spoken line wants anyway: it
     is up for the word rather than for the beat. */
  { t: HELLO_AT, state: 'delighted', side: 'right',
    bubbles: [{ t: BUB_IN(HELLO_AT, 'delighted'), text: 'hello' }],
    hands: { pose: 'wave', entry: 0.44, hold: WAVE1_HOLD } },
  /* `surprised` rather than `curious` for wait: it is the one state in the
     table whose brows go up, which is what the word is, and it costs 0.08s less
     of the beat than curious does. */
  /* `neutral` and not `surprised`: wait is the turn and the bubble, and the
     brows and the wide eye that state raises are out of bounds here. */
  { t: WAIT_AT, state: 'neutral', turn: TURN_TO,
    bubbles: [{ t: BUB_IN(WAIT_AT, 'neutral'), text: 'wait' }] },
  { t: BACK_AT, state: 'neutral', turn: 0 },
  { t: WELCOME_AT, state: 'delighted', side: 'right',
    /* **the bubble says one word and the subtitle says the sentence.** the
       four word version made a pill 250 css wide and it sat 122 px inside the
       globe; over the crown it was still 54 over. a thought is two or three
       words in this house anyway — the module says so — and the line itself is
       already on the frame, in Nunito, at the bottom. */
    bubbles: [{ t: BUB_IN(WELCOME_AT, 'delighted'), text: 'welcome' }],
    /* 0.90 rather than 1.30: at 1.30 the pose is not out until 9.20 and the
       fault lands at 9.00, so a glove was still on the frame while the globe
       was coming apart. it settles at 7.60 and starts leaving at 8.50, which is
       still a wave held across the whole line. */
    hands: { pose: 'wave', entry: 0.44, hold: 0.90 } },
  { t: FAULT_AT, state: 'neutral' },
];

/* ---------- exactly one blink where the brief asks for one ----------
   the idle blinks are a seeded schedule and there is no mark that says "blink
   here", so the seed is searched rather than the schedule edited. two windows
   want one blink each — after he turns back, and while the wordmark is up — and
   the first seed that gives one in each is the one this clip runs on.

   it is a search rather than a constant because the schedule depends on the
   clip's length and on every mark in it, so a number written here would go
   stale the first time a beat moved. the run prints what it found. */
const BLINK_WINDOWS = [[BACK_AT, WELCOME_AT], [FAULT_AT, SECONDS]];
function blinksIn(plan, [a, b]) {
  return plan.idle.blinks.filter(k => k.t >= a && k.t <= b).length;
}
function planAt(seed) {
  return planMascot({
    seconds: SECONDS, hands: true, size: SIZE, theme: 'light',
    /* **over the crown, not beside him**, and the film is what settled it. the
       module's default hangs a thought off his flank, which is right for the
       corner that placement was written in: a head in the bottom left of a
       phone thinks into the frame. this head is left of centre on a landscape
       stage with a globe two hundred px to its right, and `now much better.
       welcome.` is a pill 250 css wide — beside him it reached 736.6 and the
       ball's left edge is at 614, so the widest thought in the film sat 122 px
       inside the earth. over the crown it climbs into the empty top third,
       which on this frame is the only place with room for it. */
    thought: 'over',
    /* see The turn: facing the viewer at rest is what makes both halves of the
       wait beat legible. */
    bias: 0,
    marks: MARKS, seed,
  });
}
function findSeed() {
  let first = null;
  for (let s = 0x6b0a11; s < 0x6b0a11 + 400; s++) {
    const p = planAt(s);
    if (!first) first = p;
    if (BLINK_WINDOWS.every(w => blinksIn(p, w) === 1)) return { plan: p, seed: s };
  }
  return { plan: first, seed: 0x6b0a11, missed: true };
}
const SEED = findSeed();
const plan = SEED.plan;

/* ---------- the read, cached on the copy ---------- */
async function take(i) {
  const name = 'site-intro-l' + String(i + 1).padStart(2, '0');
  const cached = path.join(VOICE_OUT, name + '-' + VOICE + '.json');
  const want = LINES[i].text.replace(/\s+/g, ' ').trim();
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === want && fs.existsSync(j.file)) return { ...j, i, cached: true };
  }
  return { ...(await speak(LINES[i].text, { voice: VOICE, name })), i, cached: false };
}

function audioEdges(pcm) {
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  const gate = peak * Math.pow(10, SILENCE_DB / 20);
  const H = Math.round(0.005 * SR), n = Math.floor(pcm.length / H);
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

/* **each line is placed at its own beat rather than chained onto the last.**
   the beats are the storyboard and the read fits inside them; a line that runs
   long overruns its window and the report says by how much rather than pushing
   everything after it. */
const LINE_AT = [HELLO_AT + 0.12, WAIT_AT + 0.10, WELCOME_AT + 0.12];
function buildVoice(takes) {
  const pcms = takes.map(t => decode(ffmpeg, t.file));
  const edges = pcms.map(audioEdges);
  const beats = [], offs = [];
  for (let i = 0; i < takes.length; i++) {
    const e = edges[i];
    const off = +(LINE_AT[i] - e.start).toFixed(4);
    offs.push(off);
    const ws = takes[i].words.map(w => ({
      word: w.word, start: +(w.start + off).toFixed(4), end: +(w.end + off).toFixed(4),
    }));
    beats.push({
      i, key: LINES[i].key, text: LINES[i].text, words: ws,
      start: ws[0].start, end: ws[ws.length - 1].end,
      sound: { start: +(off + e.start).toFixed(4), end: +(off + e.end).toFixed(4) },
      peak: e.peak, cached: takes[i].cached,
    });
  }
  const track = new Float32Array(Math.ceil(SECONDS * SR));
  for (let i = 0; i < takes.length; i++) {
    const pcm = pcms[i], e = edges[i], off = offs[i];
    const a = Math.max(0, Math.round((e.start - PRE) * SR));
    const b = Math.min(pcm.length, Math.round((e.end + POST) * SR));
    const at = Math.round((off + e.start - PRE) * SR);
    for (let j = a; j < b; j++) {
      const k = at + (j - a);
      if (k >= 0 && k < track.length) track[k] += pcm[j];
    }
  }
  return { beats, track, words: beats.flatMap(b => b.words) };
}

/* ---------- go ---------- */
fs.mkdirSync(OUT, { recursive: true });

/* the two stills and the font sheet are the same two functions they always
   were, and they do not need the read. */
if (FONT_SHEET || STILLS_ONLY) {
  const mod = await import('./site-intro-stills.mjs');
  await mod.run({ FONT_SHEET, ONLY, CHROME, VW, VH, DSF, OUT, HERE, SAFE });
  process.exit(0);
}

const TAKES = [];
for (let i = 0; i < LINES.length; i++) TAKES.push(await take(i));
const V = buildVoice(TAKES);
const B = V.beats;

/* ---------- the subtitles ----------
   one line at a time, and the windows are built off where the words actually
   landed rather than off the beat, so a line that ran long keeps its subtitle
   up for as long as it is being said. */
const SUBS = B.map((b, i) => ({
  key: b.key, text: b.text,
  in: +(b.sound.start - SUB.lead).toFixed(4),
  out: +(b.sound.end + SUB.tail).toFixed(4),
}));

/* ---------- the moves ---------- */
function fallY(t) {
  if (t >= LAND) return 0;
  if (t <= FALL_AT) return FALL_FROM;
  const p = span(t, FALL_AT, LAND);
  return +(FALL_FROM * (1 - p * p)).toFixed(3);
}
function squashAt(t) {
  if (t < LAND) return 0;
  const flat = span(t, LAND, LAND + SMASH.flat);
  if (flat < 1) return +lerp(0, SMASH.k, flat).toFixed(5);
  const p = span(t, LAND + SMASH.flat, LAND + SMASH.flat + SMASH.back);
  if (p >= 1) return 0;
  return +(SMASH.k * Math.exp(-SMASH.damp * p) * Math.cos(2 * Math.PI * SMASH.cycles * p) * (1 - p)).toFixed(5);
}

/* the windows a glove is allowed to be on screen in, off the plan's own marks
   rather than off the beat list, so a pose that moved takes its gate with it. */
const GLOVE_WINDOWS = plan.marks.filter(m => m.hands)
  .map(m => ({ from: m.t, to: m.hands.out, acting: m.hands.acting }));
function gloveGate(t, k) {
  let o = 0;
  for (const w of GLOVE_WINDOWS) {
    if (!w.acting.includes(k)) continue;
    const up = span(t, w.from, w.from + GLOVE_IN);
    const down = span(t, w.to - GLOVE_OUT, w.to);
    o = Math.max(o, up * (1 - down));
  }
  return +o.toFixed(4);
}

function subAt(t) {
  for (let i = 0; i < SUBS.length; i++) {
    const s = SUBS[i];
    if (t < s.in || t >= s.out) continue;
    const up = OUTC(span(t, s.in, s.in + 0.16));
    const down = span(t, s.out - 0.16, s.out);
    return { i, key: s.key, o: +(up * (1 - down)).toFixed(4) };
  }
  return { i: -1, key: null, o: 0 };
}

/* ---------- the frame a time belongs to ----------
   **every random thing in this film is quantised to this and not to the clock**,
   and with the shutter open that is the difference between a glitch and a grey
   smudge. a frame is six subframes averaged; if the noise field, the torn bands
   and the shake are redrawn per subframe then six different random pictures are
   averaged together and static becomes flat grey, tearing becomes a wash and
   the shake becomes a blur. quantised to the frame, all six subframes draw the
   **identical** glitch, so averaging them changes nothing about it — while the
   mascot underneath, which really is at six different places, still smears.
   sharp glitch, blurred motion, one pass.

   it is post10's rule — the glitches are quantised to the frame grid — arriving
   from the other direction: that clip wanted the glitch to land on a frame, and
   this one needs it to survive being averaged. */
const FRAME_OF = t => Math.floor(t * FPS + 1e-6);
const FRAME_T = t => FRAME_OF(t) / FPS;

/* ---------- the switch's heat ----------
   a burst rather than a decay: it arrives at full, jitters, and is gone. both
   the heat and the seed are read at the frame's own start, so the same frame is
   the same picture at twelve, at sixty, and across every subframe of it. it is
   nought outside its own window, which is what keeps the filter off the scene
   for the other eleven and a half seconds. */
function switchAt(t0) {
  const t = FRAME_T(t0);
  if (t < SWITCH_AT || t >= SWITCH_END) return { on: false, heat: 0, seed: 0 };
  const p = span(t, SWITCH_AT, SWITCH_END);
  /* full for the first fifth, then down with two bites out of it. */
  const base = p < 0.20 ? 1 : Math.pow(1 - (p - 0.20) / 0.80, 1.5);
  const bite = (p > 0.42 && p < 0.50) || (p > 0.68 && p < 0.74) ? 1.25 : 1;
  return {
    on: true,
    heat: +Math.max(0, Math.min(1, base * bite)).toFixed(4),
    seed: (SWITCH.seed + FRAME_OF(t0)) % 9973,
  };
}

function heatAt(p) {
  if (p < 0) return 0;
  if (p < 0.13) return 1;
  if (p < 0.58) return 1 - (p - 0.13) / 0.45 * 0.58;
  if (p < GL.calmFrom) return 0.42 * (1 - (p - 0.58) / (GL.calmFrom - 0.58));
  return 0;
}

/* ---------- one frame of everything ---------- */
function frameAt(t) {
  const f = mascotFrame(plan, t);
  if (f.hands) {
    f.hands = { ...f.hands, list: f.hands.list.map((h, k) => ({ ...h, o: +(h.o * gloveGate(t, k)).toFixed(4) })) };
  }
  /* the land, on `#m-zone`'s own card the way post24 writes it: the squash goes
     on the card's two scales and the ground offset keeps his feet on the floor
     rather than letting a squashed head sink through it. */
  const k = squashAt(t);
  if (k) {
    const sq = 1 + k;
    const ground = (SIZE / 2) * (1 - 1 / sq);
    f.card = {
      ...f.card, y: +(f.card.y + ground).toFixed(4),
      sx: +(f.card.sx * sq).toFixed(5), sy: +(f.card.sy / sq).toFixed(5),
    };
  }
  const hit = span(t, FAULT_AT, FAULT_AT + END.hard + END.tail);
  const dark = t >= CUT_AT;
  /* **the glow is the film's theme, not the plan's.** `mascotFrame` sets it
     from `plan.theme`, which is one value for a whole plan, and this film is
     light for four seconds and dark for eight. the plan is built light, so the
     dark half rendered with both glow layers at nought — he was on black with
     no glow at all, which is what the review saw and called thin. one line, and
     it is the module's own field at the module's own values: GLOW.wide 30px at
     0.13 and GLOW.mid 11px at 0.20, which is post22's and every dark short's. */
  f.glow = dark ? 1 : 0;
  return {
    t,
    mas: f,
    move: { x: +(MAS.cx - SIZE / 2 - plan.box.left).toFixed(3),
      y: +(MAS.cy - SIZE / 2 - plan.box.top + fallY(t)).toFixed(3) },
    theme: dark ? 'dark' : 'light',
    globe: { on: t < FAULT_AT, which: dark ? 'd' : 'l', spin: G.spin0 + G.rate * t },
    sub: subAt(t),
    sw: switchAt(t),
    wm: { o: t >= FAULT_AT + END.wmFor ? 1 : 0 },
    /* the fault, quantised the same way and for the same reason. */
    gl: (t < FAULT_AT || hit >= 1) ? { heat: 0, seed: 0 }
      : { heat: +heatAt(span(FRAME_T(t), FAULT_AT, FAULT_AT + END.hard + END.tail)).toFixed(4),
        seed: FRAME_OF(t) % 9973 },
  };
}

/* ---------- how fast the quickest thing on the screen moves ----------
   walked on the composed frame rather than modelled off the fall's own
   arithmetic, so it counts whatever this cut actually does: the zone's travel
   and the card's own offset together, only over the frames he is on the screen
   for, and only outside the two glitch windows.

   **the glitches are excluded on purpose and it is not a dodge.** the shake is
   frame quantised — every subframe of a frame draws it at the same offset — so
   it contributes exactly nought to what a subframe pair measures, and solving
   the shutter against a number that cannot smear would buy subframes nobody can
   see. post24 excluded a move for a nearby reason and wrote down the same kind
   of sentence: how fast a thing moves where it cannot be seen is not a picture
   question.

   post25's other note is honoured by construction here — it worried that its
   own solver only measured the mascot when a bug was the second fastest thing
   on the frame. the second fastest thing in this film is the globe, and it
   turns at 9 degrees a second, which is under a third of a css pixel a frame at
   the equator of a 212 px ball. him is the answer and it is not luck. */
function fastestMove() {
  let worst = 0, at = 0, prev = null;
  const N = Math.round(SECONDS * 60);
  for (let f = 0; f < N; f++) {
    const t = f / 60;
    const fr = frameAt(t);
    const y = fr.move.y + fr.mas.card.y, x = fr.move.x + fr.mas.card.x;
    const on = plan.box.top + fr.move.y > -SIZE * 2 && plan.box.top + fr.move.y < VH + SIZE
      && !fr.sw.on && !fr.gl.heat;
    if (prev && on && prev.on) {
      const d = Math.hypot(x - prev.x, y - prev.y);
      if (d > worst) { worst = d; at = t; }
    }
    prev = { x, y, on };
  }
  return { worst: +worst.toFixed(2), at: +at.toFixed(2) };
}
const MOVE = fastestMove();
/* the subframe count this cut needs, capped. `--blur=N` overrides it outright.
   it is SAMPLES rather than SUB because SUB is already the subtitle in this
   file, and two constants a letter apart is how a render ends up asking the
   caption how many times to shoot a frame. */
const SAMPLES = !BLUR ? 1
  : BLUR_ARG ? Math.max(2, Math.min(SUB_MAX, Math.round(BLUR_ARG)))
    : Math.max(2, Math.min(SUB_MAX, Math.ceil(MOVE.worst / SUB_STEP_WANT)));

/* ---------- the page ---------- */
function pageHtml(geojson) {
  const { light, dark } = brandTokens();
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<title>site-intro</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@700&family=Michroma&family=Nunito:wght@500&family=Space+Grotesk:wght@500&display=swap">
<style>
:root{
${light}
}
html[data-theme=dark]{
${dark}
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg)}
.stage{position:relative;width:${VW}px;height:${VH}px;overflow:hidden;background:var(--bg)}
/* ---------- two device px of the page's own background, off the top left
   corner, on a 34 second animation that never ends ----------
   post11, post14, post18 and post24 all carry this and none of them says why,
   so this one will. under a **paused** virtual time policy nothing on the page
   is animating, and Page.captureScreenshot waits for the compositor to produce
   a frame that may never come — the first render of this film hung on frame
   zero and the protocol timed out after three minutes. an element with a
   will-change hint and a live animation on it keeps a composited layer in play,
   so there is always a frame to take. it is painted in the page's own
   background and it sits outside the stage, so it is two pixels of nothing.
   (no backticks in this comment on purpose: it lives inside a template
   literal.) */
.tick{position:absolute;left:-20px;top:-20px;width:2px;height:2px;background:var(--bg);
  will-change:transform;animation:tick 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes tick{from{transform:translate3d(0,0,0)}to{transform:translate3d(1px,0,0)}}
#scene{position:absolute;inset:0}
#globe-l,#globe-d{position:absolute;inset:0}

/* ---------- the switch's three layers ----------
   they sit over the scene and under the wordmark, they carry the hidden
   attribute for every frame outside the burst, and none of them costs the page
   anything while it is: a hidden element is not laid out, and the filter on the
   scene is the string none. */
#fx{position:absolute;inset:0;pointer-events:none}
#bands{position:absolute;inset:0;overflow:hidden}
/* a torn slice. it is a slab of the page's own ink pushed sideways, so it reads
   as the same colour the picture is drawn in whichever theme is up. */
#bands i{position:absolute;left:0;right:0;display:block;background:var(--fg);
  will-change:transform,opacity;opacity:0}
/* the static, drawn small and scaled up hard. a noise field at 1920 across is
   two million random numbers a frame; at 240 it is thirty thousand, and
   pixelated scaling is what television static looks like anyway. */
#static{position:absolute;inset:0;width:100%;height:100%;
  image-rendering:pixelated;opacity:0;mix-blend-mode:difference}
/* the glow layers are a blurred white copy of the disc, and a white blur on a
   white page is a smudge. the page spec bans a glow on paper and this is the
   same rule applied to the globe, so only the dark instance carries one. */
#globe-l .g-glow{display:none}
#mas-move{position:absolute;inset:0}
${globeCss(globeOpts('d'))}
${mascotCss(plan)}

/* the subtitle. Nunito 500, one line, no ground under it: on black the type is
   white and needs nothing, and on white it is the site's own --sub grey, which
   is the token index.html sets its secondary copy in. it follows the cut
   because it is a token rather than a colour. */
.sub{position:absolute;left:0;right:0;bottom:${SUB.bottom}px;text-align:center;
  font-family:"Nunito",var(--body);font-weight:500;letter-spacing:-.005em;
  font-size:${SUB.size}px;line-height:1.2;opacity:0;will-change:opacity}
.sub span{display:inline-block;white-space:nowrap;color:var(--sub)}
[data-theme=dark] .sub span{color:#ffffff}

/* the wordmark stands where the globe stood. */
#wm{position:absolute;left:${(G.cx - WM.w / 2).toFixed(1)}px;width:${WM.w}px;
  top:${G.cy.toFixed(1)}px;transform:translateY(-50%);text-align:center;
  font-family:"Michroma",var(--mono);font-weight:400;color:var(--fg);
  line-height:${WM.lh};letter-spacing:.02em;opacity:0}
#wm b{display:block;font-weight:400}
#flash{position:absolute;left:${G.cx}px;top:${G.cy}px;width:${GL.flashSize}px;height:${GL.flashSize}px;
  transform:translate(-50%,-50%);border-radius:50%;opacity:0;pointer-events:none;
  background:radial-gradient(circle,rgba(255,255,255,.9) 0%,rgba(255,255,255,0) 70%)}
</style>
</head>
<body>
<div class="stage">
  <div class="tick"></div>
  <div id="scene">
    <div id="globe-l">${globeMarkup(geojson, { ns: 'l' })}</div>
    <div id="globe-d">${globeMarkup(geojson, { ns: 'd' })}</div>
    <div id="mas-move">${mascotMarkup(plan)}</div>
    <div class="sub"><span></span></div>
  </div>
  <div id="fx" hidden>
    <div id="bands">${Array.from({ length: SWITCH.bands }, (_, i) => '<i id="b' + i + '"></i>').join('')}</div>
    <canvas id="static"></canvas>
  </div>
  <div id="wm">${WM.lines.map(l => '<b>' + l + '</b>').join('')}</div>
  <div id="flash"></div>
</div>
<script>
${globeScript(globeOpts('l'))}
<\/script>
<script>
${globeScript(globeOpts('d'))}
<\/script>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
${mascotRuntime()}
(function(){
  const P = ${JSON.stringify({ VW, VH, DSF, GL, WM, G, SW: SWITCH, SUBS: SUBS.map(s => s.text) })};
  const stage = document.querySelector('.stage');
  const scene = document.getElementById('scene');
  const fx = document.getElementById('fx');
  const bands = [];
  for (let i = 0; i < P.SW.bands; i++) bands.push(document.getElementById('b' + i));
  const stat = document.getElementById('static');
  const SW_W = 240, SW_H = Math.round(240 * P.VH / P.VW);
  stat.width = SW_W; stat.height = SW_H;
  const sg = stat.getContext('2d');
  const noise = sg.createImageData(SW_W, SW_H);
  const zones = { l: document.getElementById('globe-l'), d: document.getElementById('globe-d') };
  const mmove = document.getElementById('mas-move');
  const sub = document.querySelector('.sub');
  const subText = sub.querySelector('span');
  const wm = document.getElementById('wm');
  const flash = document.getElementById('flash');
  let theme = 'light', shown = null, said = null;

  function rnd(seed){ let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  window.__intro = {
    apply(f){
      /* **the cut is one attribute and it is written only when it changes.**
         every colour on the page is a token off it, so this one line is the
         ground, his face, his eyes, the glow, the shadow and the subtitle. */
      if (f.theme !== theme){ theme = f.theme; window.__mas.theme(theme); }
      /* one globe at a time, and it is a sweep rather than a change: there is
         no state in this page that could leave both up. */
      for (const k in zones){
        zones[k].style.visibility = (f.globe.on && f.globe.which === k) ? 'visible' : 'hidden';
      }
      mmove.style.transform = 'translate3d(' + f.move.x + 'px,' + f.move.y + 'px,0)';

      /* one subtitle, and the text is only written when the line changes. */
      if (f.sub.i !== said){ said = f.sub.i; subText.textContent = f.sub.i < 0 ? '' : P.SUBS[f.sub.i]; }
      sub.style.opacity = f.sub.o;

      /* ---------- the switch ---------- */
      if (!f.sw.on){
        if (!fx.hidden){ fx.hidden = true; scene.style.filter = 'none'; }
      } else {
        fx.hidden = false;
        const r = rnd(f.sw.seed || 1), h = f.sw.heat;
        /* the house split, on the whole picture rather than on one part of it. */
        const s = (P.SW.split * h).toFixed(2);
        scene.style.filter = 'drop-shadow(-' + s + 'px 0 rgba(255,0,64,.8))'
          + ' drop-shadow(' + s + 'px 0 rgba(0,255,208,.8))';
        stage.style.transform = 'translate3d('
          + ((r() * 2 - 1) * P.SW.shakeX * h).toFixed(2) + 'px,'
          + ((r() * 2 - 1) * P.SW.shakeY * h).toFixed(2) + 'px,0)';
        /* the slices. a band is on or off per frame, so the tear flickers
           rather than sliding, which is what a broken sync does. */
        for (let i = 0; i < bands.length; i++){
          const live = r() < 0.30 + 0.55 * h;
          if (!live){ bands[i].style.opacity = 0; continue; }
          const top = r() * P.VH, hgt = 2 + r() * 26 * h;
          const dx = (r() * 2 - 1) * 46 * h;
          bands[i].style.top = top.toFixed(1) + 'px';
          bands[i].style.height = hgt.toFixed(1) + 'px';
          bands[i].style.transform = 'translate3d(' + dx.toFixed(1) + 'px,0,0)';
          bands[i].style.opacity = (0.10 + r() * 0.55 * h).toFixed(3);
        }
        /* the static. difference blended, so it eats the picture rather than
           greying it, and it is the same field on the same frame every run. */
        const d = noise.data;
        for (let i = 0; i < d.length; i += 4){
          const v = r() < 0.5 ? 0 : Math.round(120 + r() * 135);
          d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
        }
        sg.putImageData(noise, 0, 0);
        stat.style.opacity = (P.SW.static * h).toFixed(3);
      }

      wm.style.opacity = f.wm.o;
      /* the fault. the globe carries the rgb split as a pair of coloured drop
         shadows, which is the only way to split a canvas without drawing it
         three times; the wordmark carries post24's own text-shadow version. */
      const h = f.gl.heat;
      if (!h){
        if (!f.sw.on) stage.style.transform = 'none';
        zones.d.style.filter = 'none';
        zones.l.style.filter = 'none';
        wm.style.textShadow = 'none';
        flash.style.opacity = 0;
      } else {
        const r = rnd(f.gl.seed || 1);
        const dx = (r() * 2 - 1) * P.GL.shakeX * h;
        const dy = (r() * 2 - 1) * P.GL.shakeY * h;
        stage.style.transform = 'translate3d(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px,0)';
        const s = (P.GL.split * h).toFixed(2);
        const spl = 'drop-shadow(-' + s + 'px 0 rgba(255,0,64,.75)) drop-shadow(' + s + 'px 0 rgba(0,255,208,.75))';
        zones.d.style.filter = spl;
        wm.style.textShadow = '-' + s + 'px 0 rgba(255,0,64,.75), ' + s + 'px 0 rgba(0,255,208,.75)';
        flash.style.opacity = (P.GL.flash * h).toFixed(3);
      }
    },
    /* the wordmark is fitted, not sized: Michroma is wide and BORING is the
       longest line, and a size picked by dividing a width by a guess put it off
       both edges of the frame once already. */
    fitWordmark(){
      const lines = [].slice.call(wm.querySelectorAll('b'));
      wm.style.fontSize = '100px';
      /* **measured at max-content, and that is a fix rather than a flourish.**
         the three lines are display:block, so each one's rect is the width of
         its *container* and not of its glyphs — asking a block how wide it is
         gets the box back, every time, for all three. the first version of this
         divided the allowance by that and came back with "100px michroma,
         widest line 170 of 170 allowed", which is the wordmark reporting the
         number it was handed. shrink the box to its content first and the rects
         are the letters. (no backticks in this comment on purpose: it lives
         inside a template literal.) */
      const keepW = wm.style.width;
      wm.style.width = 'max-content';
      let widest = 0;
      for (const l of lines) widest = Math.max(widest, l.getBoundingClientRect().width);
      wm.style.width = keepW || (P.WM.w + 'px');
      const size = Math.floor(100 * P.WM.w / widest);
      wm.style.fontSize = size + 'px';
      const r = lines[0].getBoundingClientRect();
      const box = wm.getBoundingClientRect();
      return { size, widestCss: +(widest * size / 100).toFixed(1),
        capPx: +(r.height * P.DSF * 0.72).toFixed(1),
        box: { l: +box.left.toFixed(1), r: +box.right.toFixed(1), t: +box.top.toFixed(1), b: +box.bottom.toFixed(1) } };
    },
    /* every subtitle measured where it will really be drawn, so "inside the
       safe area" and "one line" are measurements rather than sums. */
    subBoxes(){
      const keep = subText.textContent, keepO = sub.style.opacity;
      sub.style.opacity = 1;
      const out = P.SUBS.map(function (txt) {
        subText.textContent = txt;
        const q = subText.getBoundingClientRect();
        return { text: txt, l: +q.left.toFixed(1), r: +q.right.toFixed(1),
          t: +q.top.toFixed(1), b: +q.bottom.toFixed(1) };
      });
      subText.textContent = keep; sub.style.opacity = keepO;
      return out;
    },
    /* the drawn ink of him: the plate plus whichever gloves are on screen. the
       plate's rect over-reports a rotated card, which is the wrong answer in
       the safe direction. */
    inkBox(){
      const els = [document.querySelector('.m-plate'),
        document.getElementById('m-gl-ink0'), document.getElementById('m-gl-ink1')];
      let l = 1e9, r = -1e9, t = 1e9, b = -1e9;
      for (const el of els){
        if (!el) continue;
        if (+getComputedStyle(el).opacity === 0) continue;
        const q = el.getBoundingClientRect();
        if (!q.width || !q.height) continue;
        l = Math.min(l, q.left); r = Math.max(r, q.right);
        t = Math.min(t, q.top); b = Math.max(b, q.bottom);
      }
      return { l: +l.toFixed(1), r: +r.toFixed(1), t: +t.toFixed(1), b: +b.toFixed(1) };
    },
    /* the thought bubble's box **per string**, and that is a fix. the first
       version measured the element once at build time, when the runtime has
       not written a word into it yet — so it reported an empty pill, the guard
       compared that to the globe's edge and passed, and the widest thought in
       the film sat a hundred px inside the ball. the text is written by the
       module's own runtime per frame, so the only way to know how wide a
       thought is is to put it in and look. */
    bubbleBoxes(texts, at){
      const el = document.getElementById('m-bubble');
      if (!el) return [];
      const txt = document.getElementById('m-bubble-text');
      const keepV = el.style.visibility, keepT = txt.textContent;
      /* **and the zone has to be where the film puts it first.** the mascot
         places itself inside its own notional 540x960 window and this page
         translates it onto a landscape stage — but the translate is written by
         apply() per frame, and nothing has called apply() when this runs. the
         first version measured the bubble 700 px down the page, reported it as
         195 px below the bottom of a 540 px stage, and was right about a
         picture nobody is going to see. */
      const keepM = mmove.style.transform;
      mmove.style.transform = 'translate3d(' + at.x + 'px,' + at.y + 'px,0)';
      el.style.visibility = 'visible';
      const out = texts.map(function (s) {
        txt.textContent = s;
        const q = el.getBoundingClientRect();
        return { text: s, l: +q.left.toFixed(1), r: +q.right.toFixed(1),
          t: +q.top.toFixed(1), b: +q.bottom.toFixed(1) };
      });
      el.style.visibility = keepV; txt.textContent = keepT;
      mmove.style.transform = keepM;
      return out;
    },
  };
})();

Promise.all([
  document.fonts.load('400 40px Michroma'),
  document.fonts.load('500 ${SUB.size}px Nunito'),
  document.fonts.load('700 12px Manrope'),
  document.fonts.load('500 26px "Space Grotesk"'),
])
  .then(function () { return document.fonts.ready; })
  .then(function () {
    window.__built = Object.assign({}, window.__mas.build(), {
      wm: window.__intro.fitWordmark(),
      subs: window.__intro.subBoxes(),
      bubbles: window.__intro.bubbleBoxes(${JSON.stringify(MARKS.flatMap(m => (m.bubbles || []).map(b => b.text)))}, { x: ${(MAS.cx - SIZE / 2 - plan.box.left).toFixed(3)}, y: ${(MAS.cy - SIZE / 2 - plan.box.top).toFixed(3)} }),
      fonts: {
        nunito: document.fonts.check('500 ${SUB.size}px Nunito'),
        michroma: document.fonts.check('400 40px Michroma'),
        grotesk: document.fonts.check('500 26px "Space Grotesk"'),
      },
      globes: {
        l: { pings: window.__globe_l.pings, n: window.__globe_l.n },
        d: { pings: window.__globe_d.pings, n: window.__globe_d.n },
      },
    });
  });
</script>
</body>
</html>`;
}

function serve(html) {
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/' || p === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }
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
  return {
    seconds: dur ? +dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3]) : null,
    w: res ? +res[1] : null, h: res ? +res[2] : null,
  };
}

/* ---------- the clock, printed ---------- */
function printClock() {
  console.log('\n  site-intro — ' + SECONDS.toFixed(2) + 's, ' + VW * DSF + 'x' + VH * DSF
    + ', ' + FPS + 'fps, light then dark');
  console.log('  seed ' + SEED.seed.toString(16) + (SEED.missed ? '  (no seed in 400 gave one blink a window)' : '')
    + ', blinks per window: ' + BLINK_WINDOWS.map(w => blinksIn(plan, w)).join(' / '));
  console.log('\n  the read, ' + VOICE + ', elevenlabs:');
  for (const b of B) {
    const win = b.i === 0 ? [HELLO_AT, WAIT_AT] : b.i === 1 ? [WAIT_AT, SWITCH_AT] : [WELCOME_AT, FAULT_AT];
    const over = b.sound.end - win[1];
    console.log('    ' + b.sound.start.toFixed(2) + '..' + b.sound.end.toFixed(2)
      + '  ' + b.text.padEnd(28) + (b.cached ? 'cached' : 'fetched')
      + (over > 0 ? '   ' + over.toFixed(2) + 's past its window' : ''));
  }
  console.log('\n  the beats:');
  const rows = [
    ['he enters', FALL_AT], ['he lands', LAND], ['hello', HELLO_AT], ['wait, and the turn', WAIT_AT],
    ['the switch breaks the picture', SWITCH_AT], ['the theme turns over', CUT_AT],
    ['the picture comes back', SWITCH_END], ['he turns to the viewer', BACK_AT],
    ['now much better', WELCOME_AT], ['the fault', FAULT_AT], ['end', SECONDS],
  ];
  for (const [n, t] of rows) console.log('    ' + t.toFixed(2).padStart(6) + '  ' + n);
  console.log('\n  the shutter:');
  if (SAMPLES > 1) {
    console.log('    fastest visible move  ' + MOVE.worst.toFixed(2) + ' css px a frame at 60, at '
      + MOVE.at.toFixed(2) + 's  (' + (MOVE.worst * DSF).toFixed(0) + ' device px)');
    console.log('    ' + SAMPLES + ' subframes' + (BLUR_ARG ? ' (asked for)' : ' (solved)')
      + ', so ' + (MOVE.worst / SAMPLES).toFixed(2) + ' css px a sample — '
      + (MOVE.worst / SAMPLES * DSF).toFixed(1) + ' device px, against a target of '
      + SUB_STEP_WANT + ' css');
    console.log('    the eye slab is ' + (4.4 * SIZE / 64).toFixed(1)
      + ' css px tall, which is the feature the step has to stay under');
  } else {
    console.log('    closed. --blur opens it.');
  }
}

printClock();
if (VOICE_ONLY) process.exit(0);

/* ---------- the sound ---------- */
function cues() {
  const out = [];
  /* the bubble pops are the module's own, off the plan rather than off the beat
     list, so a bubble that moved takes its pop with it. */
  for (const c of mascotCues(plan)) out.push(c);
  /* the landing. */
  out.push({ t: LAND, kind: 'popDeep' });
  /* **two glitches, and they are the same sound doing two jobs.** the switch is
     the picture breaking and coming back dark; the fault at nine is the house
     ending. `lib/sfx.mjs` has one `glitch` and neither of them needed a new
     voice written for it. */
  out.push({ t: SWITCH_AT, kind: 'glitch' });
  out.push({ t: FAULT_AT, kind: 'glitch' });
  return out.filter(c => c.t >= 0 && c.t < SECONDS).sort((a, b) => a.t - b.t);
}

function mix() {
  const list = cues();
  const rendered = renderSfx(list, SECONDS);
  const env = voiceEnvelope(V.words, SECONDS);
  const need = Math.ceil(SECONDS * SR);
  const voice = V.track.length >= need ? V.track.subarray(0, need)
    : (() => { const b = new Float32Array(need); b.set(V.track); return b; })();
  const m = mixdown(voice, rendered.buf, env, {});
  const wav = path.join(OUT, 'site-intro-mix.wav');
  const attempt = gdb => {
    const buf = Float32Array.from(m.out);
    applyGain(buf, gdb);
    const lim = limit(buf, SAMPLE_CEILING);
    writeWav(wav, buf);
    return { g: gdb, lim, r: loudness(ffmpeg, wav) };
  };
  let lo = -6, hi = 18, best = null;
  for (let i = 0; i < 10; i++) {
    const a = attempt((lo + hi) / 2);
    const legal = a.lim.reduction <= MAX_REDUCTION;
    if (legal && (!best || a.r.lufs > best.r.lufs)) best = a;
    if (!legal || a.r.lufs > TARGET_LUFS) hi = a.g; else lo = a.g;
  }
  if (!best) best = attempt(0);
  const final = attempt(best.g);
  console.log('  mix: ' + list.length + ' cues, ' + final.r.lufs.toFixed(1) + ' LUFS, peak '
    + final.r.truePeak.toFixed(1) + ' dBTP, ' + final.lim.reduction.toFixed(1)
    + ' dB of limiting, gain ' + best.g.toFixed(1) + ' dB');
  if (final.r.lufs < MIN_LUFS) {
    console.log('  quieter than ' + MIN_LUFS + ' LUFS: the peak ceiling won, which is what it is for');
  }
  return wav;
}

/* ---------- render ---------- */
async function render() {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  const dirs = CHECK ? [] : [FRAMES, VERIFY, SAMPLE_DIR];
  for (const d of dirs) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  const { srv, port } = await serve(pageHtml(readLand()));
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true, protocolTimeout: 300000,
    args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none',
      '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio'],
  });
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('  page error: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('  console: ' + m.text()); });
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });
  const cdp = await page.createCDPSession();
  let expired = null;
  cdp.on('Emulation.virtualTimeBudgetExpired', () => { const f = expired; expired = null; if (f) f(); });
  const advance = async ms => {
    const p = new Promise(r => { expired = r; });
    await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pauseIfNetworkFetchesPending', budget: ms });
    await p;
  };
  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' });
  /* two globes to build, each with its own mask, projection and ping schedule,
     so this waits longer than a one globe page does. */
  for (let i = 0; i < 3000; i++) {
    const ok = await page.evaluate(() => !!(window.__built
      && window.__globe_l && window.__globe_l.ready
      && window.__globe_d && window.__globe_d.ready)).catch(() => false);
    if (ok) break;
    await advance(1000 / 60);
  }
  const built = await page.evaluate(() => window.__built);
  if (!built) throw new Error('the page never finished building');
  console.log('\n  built: head ' + built.headPx + 'px, ' + built.glows + ' glow layers');
  console.log('  wordmark: ' + built.wm.size + 'px michroma, widest line ' + built.wm.widestCss
    + ' css of ' + WM.w + ' allowed, cap ' + built.wm.capPx + ' device px (floor ' + WM.minCapPx + ')');
  console.log('  globes: light ' + built.globes.l.pings + ' pings scheduled, dark '
    + built.globes.d.pings + ', discs ' + built.globes.l.n + ' device px');
  fs.writeFileSync(path.join(OUT, 'site-intro-built.json'), JSON.stringify(built, null, 2));

  /* the schedule with the page's own geometry verdict attached to each point,
     asked for again from outside the spawn loop: the run should be able to say
     "this point is on land" from the same test the page used to allow it, on
     the points it actually kept. */
  const sched = await page.evaluate(() => ({
    l: window.__globe_l.schedule.map(p => ({ ...p, inLand: window.__globe_l.inLand(p.lon, p.lat) })),
    d: window.__globe_d.schedule.map(p => ({ ...p, inLand: window.__globe_d.inLand(p.lon, p.lat) })),
  }));
  /* **the pings the film actually puts on a frame**, which is not the schedule:
     it deliberately starts before the clip and runs past the end, and each
     globe is only on screen for its own half. a ping counts if any part of its
     life falls inside the window its own globe is visible for. */
  const windows = { l: [0, CUT_AT], d: [CUT_AT, FAULT_AT] };
  built.pings = [];
  for (const k of ['l', 'd']) {
    const [a, b] = windows[k];
    for (const p of sched[k]) {
      if (p.t + 0.8 <= a || p.t >= b) continue;
      built.pings.push({ globe: k, t: +Math.max(p.t, a).toFixed(3),
        lon: p.lon, lat: p.lat, inLand: p.inLand, where: continentOf(p.lon, p.lat) });
    }
  }
  built.pings.sort((x, y) => x.t - y.t);
  console.log('  pings on the delivered frames: ' + built.pings.length);
  for (const p of built.pings) {
    console.log('    ' + p.t.toFixed(2).padStart(6) + 's  ' + (p.globe === 'l' ? 'light' : 'dark ')
      + '  ' + (p.lat >= 0 ? ' ' : '') + p.lat.toFixed(1) + ', ' + (p.lon >= 0 ? ' ' : '') + p.lon.toFixed(1)
      + '   ' + (p.inLand ? 'land' : 'NOT LAND') + '   ' + (p.where || 'UNNAMED'));
  }
  fs.writeFileSync(path.join(OUT, 'site-intro-pings.json'), JSON.stringify({
    tilt: G.tilt, spin0: G.spin0, rate: G.rate, cx: G.cx, cy: G.cy, d: G.d, dsf: DSF,
    cutAt: CUT_AT, faultAt: FAULT_AT, life: 0.8, delivered: built.pings, schedule: sched,
  }, null, 2));

  if (CHECK) { await browser.close(); srv.close(); return { N: 0, built }; }

  const N = Math.round(FPS * SECONDS);
  const wall = Date.now();
  const BEATS = new Map([
    [0.20, 'a-open'], [FALL_AT + 0.30, 'b-falling'], [LAND + 0.03, 'c-land'],
    [HELLO_AT + 0.60, 'd-hello'], [WAIT_AT + 0.55, 'e-wait-turned'],
    [SWITCH_AT + 0.02, 'f-switch-starts'], [CUT_AT - STEP, 'g-last-light-frame'],
    [CUT_AT, 'h-first-dark-frame'], [SWITCH_END + 0.04, 'i-out-the-other-side'],
    [BACK_AT + 0.60, 'j-turned-back'], [WELCOME_AT + 0.80, 'k-welcome'],
    [FAULT_AT + 0.06, 'l-fault'],
    [FAULT_AT + 0.60, 'm-wordmark'], [SECONDS - 0.10, 'n-hold'],
  ].map(([t, n]) => [Math.round(t * FPS), n]));

  /* **one loop, and the shutter is how many samples it takes per frame.** with
     it closed SAMPLES is 1 and this is exactly the loop it always was; with it
     open the samples land in their own folder and ffmpeg averages them
     afterwards. the beat stills come off the **first** sample of their frame, so
     a still is a sharp picture of the instant rather than a smear of it. */
  const SUBSTEP = STEP / SAMPLES;
  const shotDir = SAMPLES > 1 ? SAMPLE_DIR : FRAMES;
  let wrote = 0;
  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SAMPLES; k++) {
      const t = f * STEP + k * SUBSTEP;
      const fr = frameAt(t);
      await page.evaluate(x => window.__intro.apply(x), fr);
      if (fr.globe.on) {
        await page.evaluate((w, tt, s) => window['__globe_' + w].apply(tt, s), fr.globe.which, t, fr.globe.spin);
      }
      await page.evaluate(x => window.__mas.apply(x), fr.mas);
      const shot = await cdp.send('Page.captureScreenshot', {
        format: 'jpeg', quality: 92, captureBeyondViewport: false,
        clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
      });
      const idx = f * SAMPLES + k;
      const name = (SAMPLES > 1 ? 's' + String(idx).padStart(6, '0') : 'f' + String(f).padStart(5, '0')) + '.jpg';
      fs.writeFileSync(path.join(shotDir, name), Buffer.from(shot.data, 'base64'));
      wrote++;
      if (k === 0 && BEATS.has(f)) {
        fs.writeFileSync(path.join(VERIFY, BEATS.get(f) + '.jpg'), Buffer.from(shot.data, 'base64'));
      }
    }
  }
  console.log('  ' + wrote + ' samples for ' + N + ' frames in '
    + ((Date.now() - wall) / 1000).toFixed(1) + 's');
  await browser.close(); srv.close();
  if (SAMPLES > 1) blend(N);
  return { N, built };
}

/* the shutter, closed. the subframes are averaged into frames, because a frame
   is the light that arrived over its own duration rather than a sample of one
   instant. post10's chain, unchanged: tmix over SAMPLES frames, then throw away
   the SAMPLES-1 partial averages at the head and keep every SAMPLESth result. */
function blend(N) {
  console.log('  blending ' + N * SAMPLES + ' subframes into ' + N + ' frames ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS * SAMPLES), '-i', path.join(SAMPLE_DIR, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SAMPLES + ',trim=start_frame=' + (SAMPLES - 1)
      + ',setpts=PTS-STARTPTS,framestep=' + SAMPLES,
    '-q:v', '2', path.join(FRAMES, 'f%05d.jpg')]);
  const got = fs.readdirSync(FRAMES).filter(f => f.endsWith('.jpg')).length;
  if (got !== N) console.log('  the blend produced ' + got + ' frames of ' + N + ' wanted');
  if (!KEEP) fs.rmSync(SAMPLE_DIR, { recursive: true, force: true });
}

/* the eye reading, printed rather than only asserted: the brief asked for every
   rendered frame to be checked, so the run should say what it found rather than
   only that it was happy. */
function printEyes(built) {
  if (!built || !built.eyes) return;
  console.log('  eyes: ' + Math.round(SECONDS * FPS) + ' frames read, worst eye height '
    + built.eyes.worstSy.toFixed(2) + ' of its own at ' + built.eyes.worstAt.toFixed(2)
    + 's (calm ceiling ' + EYE_SY_MAX + '), brows inked on ' + built.eyes.brows + ' frames');
}

/* ---------- the guards ---------- */
function clearances(b) {
  return {
    left: +(b.l - SAFE.left).toFixed(1),
    right: +(VW - SAFE.right - b.r).toFixed(1),
    top: +(b.t - SAFE.top).toFixed(1),
    bottom: +(VH - SAFE.bottom - b.b).toFixed(1),
  };
}

function guards(built) {
  const fail = [];
  /* the faces really loaded. `document.fonts.load` resolves for a family that
     does not exist, so a subtitle in the fallback sans would look close enough
     to pass. */
  for (const [k, v] of Object.entries(built.fonts)) if (!v) fail.push(k + ' did not load');
  if (built.headPx < 220 || built.headPx > 280) fail.push('the head rendered at ' + built.headPx + 'px');
  if (built.wm.widestCss > WM.w + 0.5) fail.push('the wordmark is ' + built.wm.widestCss + ' css wide, over ' + WM.w);
  if (built.wm.capPx < WM.minCapPx) fail.push('the wordmark cap is ' + built.wm.capPx + ' device px, floor ' + WM.minCapPx);

  /* every subtitle one line and inside the safe area, measured where it draws. */
  for (const s of built.subs) {
    const c = clearances(s);
    if (Math.min(c.left, c.right, c.top, c.bottom) < 0) {
      fail.push('the subtitle "' + s.text + '" is outside the safe area (' + JSON.stringify(c) + ')');
    }
    if (s.b - s.t > SUB.size * 1.6) fail.push('the subtitle "' + s.text + '" took more than one line');
  }
  /* the wordmark, in the globe's place, inside the safe area. */
  {
    const c = clearances(built.wm.box);
    if (Math.min(c.left, c.right, c.top, c.bottom) < 0) {
      fail.push('the wordmark is outside the safe area (' + JSON.stringify(c) + ')');
    }
  }
  /* every bubble is beside him and none of them may reach the globe, measured
     with its own string in the pill rather than with the empty one. */
  for (const b of built.bubbles || []) {
    if (b.r > G.cx - G.d / 2) {
      fail.push('the thought bubble "' + b.text + '" reaches ' + b.r
        + ' css, into the globe at ' + (G.cx - G.d / 2) + ' — ' + (b.r - (G.cx - G.d / 2)).toFixed(1) + ' px over');
    }
    const c = clearances(b);
    if (Math.min(c.left, c.right, c.top, c.bottom) < 0) {
      fail.push('the thought bubble "' + b.text + '" is outside the safe area (' + JSON.stringify(c) + ')');
    }
  }

  /* **one subtitle at a time, walked at the render's own step.** the windows
     are built off the read and cannot be assumed not to overlap. */
  let twoUp = null;
  for (let f = 0; f < Math.round(SECONDS * FPS); f++) {
    const t = f * STEP;
    const live = SUBS.filter(s => t >= s.in && t < s.out);
    if (live.length > 1 && !twoUp) twoUp = { t: +t.toFixed(2), keys: live.map(s => s.key) };
  }
  if (twoUp) fail.push('two subtitles are up at ' + twoUp.t + 's: ' + twoUp.keys.join(' and '));

  /* **the cut is one frame and it happens inside the burst.** the frame before
     it is light, the frame on it is dark, and both of them are inside the
     switch's own window — a theme that turned over before the glitch started or
     after it finished would be a fade by another name. */
  if (frameAt(CUT_AT - STEP).theme !== 'light') fail.push('the frame before the cut is not light');
  if (frameAt(CUT_AT).theme !== 'dark') fail.push('the frame on the cut is not dark');
  if (CUT_AT <= SWITCH_AT || CUT_AT >= SWITCH_END) {
    fail.push('the cut at ' + CUT_AT + ' is outside the switch (' + SWITCH_AT + '..' + SWITCH_END + ')');
  }
  if (!frameAt(CUT_AT).sw.on || !frameAt(CUT_AT - STEP).sw.on) {
    fail.push('the glitch is not running on the frames either side of the cut');
  }
  /* and it never changes back. */
  let flips = 0, was = frameAt(0).theme;
  for (let f = 1; f < Math.round(SECONDS * FPS); f++) {
    const th = frameAt(f * STEP).theme;
    if (th !== was) { flips++; was = th; }
  }
  if (flips !== 1) fail.push('the theme changes ' + flips + ' times, and the brief allows one');

  /* the gloves are off except inside a pose's own window, and only wave and
     nothing else is ever asked for. */
  for (const m of plan.marks) {
    if (!CALM_STATES.has(m.state)) {
      fail.push('mark at ' + m.t.toFixed(2) + 's asks for "' + m.state
        + '", and this clip allows only ' + [...CALM_STATES].join(' and '));
    }
  }
  const poses = plan.marks.filter(m => m.hands).map(m => m.hands.pose);
  const allowed = new Set(['wave']);
  for (const p of poses) if (!allowed.has(p)) fail.push('the plan asks for the pose "' + p + '"');
  const gloveAt = t => frameAt(t).mas.hands.list.reduce((m, h) => Math.max(m, h.o), 0);
  if (gloveAt(0) > 0.004) fail.push('a glove is on screen at 0.00s');
  if (gloveAt(HELLO_AT - 0.02) > 0.004) fail.push('a glove is on screen before the first wave');
  if (gloveAt(SWITCH_AT) > 0.004) fail.push('a glove is on screen when the switch starts');

  /* ---------- the eyes, on every rendered frame ----------
     **the allowlist is not the guard.** a mark can only ask for two states, and
     that is checked above, but a state is not the only thing that can open an
     eye — the idle layer, a blink and the turn all write the same channels. so
     this walks the film at the render's own step and reads what is actually
     drawn: no brow is ever inked, and no eye ever goes past a calm height. */
  {
    let worstSy = 0, worstAt = 0, brow = null;
    for (let k = 0; k < Math.round(SECONDS * FPS); k++) {
      const t = k * STEP, fr = frameAt(t).mas;
      for (const e of fr.eyes) if (e.sy > worstSy) { worstSy = e.sy; worstAt = t; }
      for (const b of fr.brows) if (b.o > 0.004 && !brow) brow = { t: +t.toFixed(2), o: +b.o.toFixed(3) };
    }
    if (brow) fail.push('a brow is inked at ' + brow.t + 's (opacity ' + brow.o + ') — no calm state raises one');
    if (worstSy > EYE_SY_MAX) {
      fail.push('an eye reaches ' + worstSy.toFixed(2) + ' of its own height at ' + worstAt.toFixed(2)
        + 's, over the calm ceiling of ' + EYE_SY_MAX);
    }
    built.eyes = { worstSy: +worstSy.toFixed(3), worstAt: +worstAt.toFixed(2), brows: brow ? 1 : 0 };
  }

  /* he is inside the safe area for every frame he is on one, and the globe is a
     circle at a known centre so it needs no measuring. */
  {
    const g = clearances({ l: G.cx - G.d / 2, r: G.cx + G.d / 2, t: G.cy - G.d / 2, b: G.cy + G.d / 2 });
    if (Math.min(g.left, g.right, g.top, g.bottom) < 0) fail.push('the globe is outside the safe area');
  }
  /* ---------- every ping, on a continent, named ----------
     two tests have already run inside the page before a ping was allowed to
     exist: the rendered pixel under it had to be the continent colour of that
     globe's own ink, and the point had to be inside a land polygon by ray
     casting against the geojson. this asserts that both were actually asked for
     — a default would have silently dropped one — and then names the ground
     under every ping the delivered film puts on a frame. a point the table
     cannot name is reported rather than passed over. */
  for (const k of ['l', 'd']) {
    if (!GLOBES[k].ping.lum) fail.push('globe "' + k + '" has no land window on its pings');
    if (!GLOBES[k].ping.inLand) fail.push('globe "' + k + '" is not checking its pings against the land polygons');
  }
  for (const p of built.pings || []) {
    if (!p.inLand) fail.push('the ping at ' + p.t.toFixed(2) + 's is not inside a land polygon');
    if (!p.where) fail.push('the ping at ' + p.t.toFixed(2) + 's is on land the continent table cannot name ('
      + p.lon.toFixed(1) + ', ' + p.lat.toFixed(1) + ')');
  }
  return fail;
}

if (CHECK) {
  const { built } = await render();
  const fail = guards(built);
  console.log('\n  guards: ' + (fail.length ? fail.length + ' FAILED' : 'all green'));
  for (const f of fail) console.log('    - ' + f);
  printEyes(built);
  process.exit(fail.length ? 1 : 0);
}

const done = ONLY_ENCODE
  ? { N: fs.readdirSync(FRAMES).filter(f => f.endsWith('.jpg')).length, built: null }
  : await render();
const wav = mix();
const out = path.join(OUT, 'site-intro-1920x1080.mp4');
ff(['-y', '-hide_banner', '-loglevel', 'error',
  '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'),
  '-i', wav,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k', '-shortest',
  '-r', String(FPS), '-movflags', '+faststart', out]);
if (!KEEP && !ONLY_ENCODE) fs.rmSync(FRAMES, { recursive: true, force: true });

const p = probe(out);
console.log('\n  ' + path.relative(path.join(HERE, '..'), out).replace(/\\/g, '/'));
console.log('  ' + p.w + 'x' + p.h + ', ' + p.seconds + 's, ' + FPS + 'fps, '
  + (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
if (done.built) {
  const fail = guards(done.built);
  console.log('\n  guards: ' + (fail.length ? fail.length + ' FAILED' : 'all green'));
  for (const f of fail) console.log('    - ' + f);
  printEyes(done.built);
  if (fail.length) process.exitCode = 1;
}
console.log('  beat stills in ' + path.relative(HERE, VERIFY).replace(/\\/g, '/'));
