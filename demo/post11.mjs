/* the boring tek — post11, the explainer.

     node post11.mjs                  the clip, shutter shut
     node post11.mjs --blur           the final, four subframes to a frame
     DEMO_FPS=12 node post11.mjs      the fast preview pass
     node post11.mjs --encode-only    re-encode from kept frames

   out to demo/out/post11-1080x1920.mp4, and to that one path every time.

   a calm friendly explainer for the service. white page, big simple type, real
   captured footage of theboringtek.com, and the corner mascot reacting to it
   all the way through. positive, not rage, not dry.

   ---------- it is one composed page, not four passes ----------

   post9 films the site by loading index.html and putting a camera, a cursor and
   a caption layer on top of it, and it cuts to a composed page for the beats
   that are not the site. that is right for a film whose site shots are full
   bleed. this clip is not that: the site is a **card** in the middle of a white
   frame with our own type under it and the mascot in the corner, and the mascot
   has to be alive on every frame including the site ones.

   so the site is an iframe, served from the same origin, inside a clipped card.
   one page, one clock, one render pass, no cuts. the camera is a transform on
   the iframe element rather than on a wrapper inside the page, which means
   index.html is loaded exactly as it is in git and nothing at all is injected
   into it for the framing. what is injected is what post9 injects and for the
   same four reasons: a seeded prng, the rAF shim, a stubbed fetch, and the two
   ambient behaviours a film cannot have firing on their own dice.

   ---------- the crop is the framing, and it is why the nav is gone ----------

   the site's top bar is `position: fixed`, so it sits at the iframe's own top
   whatever the camera does. the card never shows the iframe's top sixty css px,
   so the nav row cannot appear — that is arithmetic rather than a promise, and
   there is a guard on it. everything below the hero is off the bottom of the
   crop for the same reason. who we are and the honest part are never on screen.

   ---------- what is on screen when ----------

   fourteen lines, one screen beat each. seven of them are the site and seven
   are type on white; the captions run over all fourteen in one fixed band, so a
   viewer with the sound off gets the whole script.

   ---------- the one number the brief and the script disagree about ----------

   the brief says thirty seconds and the script is marked exact. the script is
   eighty six words. read at a pace a person would actually use — which is what
   the delivery notes ask for — that is about forty seconds, and the gaps the
   typing and the send need are most of the rest. the script wins: nothing is
   cut and nothing is rushed to hit a number. the run prints what it came out at.
*/

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

import { speak, VOICE_OUT, VOICES } from './lib/voice.mjs';
import {
  planCaptions, captionFrame, captionCss, captionMarkup, captionPage, describe, bareWord,
} from './lib/captions.mjs';
import {
  planMascot, mascotFrame, mascotMotion, mascotCss, mascotMarkup, mascotRuntime,
  mascotPagePlan, mascotCues, describeMascot, describeMotion, headRect,
  STAGE, SAFE, HEAD_PX, BUBBLE,
} from './lib/mascot.mjs';
import {
  renderSfx, writeWav, limit, decode, mixdown, voiceEnvelope, applyGain,
  loudness, describeMix, checkUnderVoice, dbfs, SR,
} from './lib/sfx.mjs';
import {
  planScenes, sceneFrame, sceneMotion, pictogramCss, pictogramMarkup,
  pictogramRuntime, pictogramPagePlan, describeScenes, WEIGHTS,
} from './lib/pictograms.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post11');
const SUBS = path.join(OUT, 'subframes-post11');
const VERIFY = path.join(OUT, 'verify-post11');
const MP4 = path.join(OUT, 'post11-1080x1920.mp4');
const WAV = path.join(OUT, 'post11-mix.wav');
const STATE = path.join(OUT, 'post11-1080x1920.json');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = STAGE.dsf;
const VW = STAGE.w, VH = STAGE.h;

const argv = process.argv.slice(2);
const ONLY_ENCODE = argv.includes('--encode-only');
/* the voice, the beats, the cut and every plan, printed and then nothing. a cut
   should be arguable before minutes are spent on jpegs, and all four plans in
   here are plain data by construction. */
const PLAN_ONLY = argv.includes('--plan');
const KEEP = argv.includes('--keep-frames');
const BLUR = argv.some(a => a.startsWith('--blur'));
const BLUR_ARG = (argv.find(a => a.startsWith('--blur=')) || '').split('=')[1];
const SUB = BLUR ? Math.max(2, Math.min(12, Number(BLUR_ARG) || 4)) : 1;
const SUBSTEP = STEP / SUB;

/* ---------- the script, and how each line is read ----------
   the copy is exact and is not edited here for any reason.

   what is per line is the **delivery**, and that is the whole point of one
   request per line rather than one for the script: `rate` and `pitch` go
   straight into the ssml prosody tag, so the reading has a shape instead of a
   speed. the light lines run near the neural default, the two that are jokes
   drop and slow, and the close is the slowest thing in the file.

   `gap` is the silence **after** the line, measured on the waveform rather than
   left to the synthesiser's own trailing air. most of them are a breath. two
   are not: the hole after `then type what you want` is where the typing
   happens, and the one after `send it` is where the check mark lands. a viewer
   watching a field fill itself needs the voice to be quiet, which is a cut
   decision rather than a pause.

   `screen` says what the frame is doing on this line. `site` shows the card;
   `white` hides it and the type is the whole picture. */
const LINES = [
  { text: 'ai for business is everywhere now',
    rate: '-4%', pitch: '-1Hz', gap: 0.26, screen: 'white' },
  { text: 'some people do not know why they even need it',
    rate: '+2%', pitch: '+1Hz', gap: 0.22, screen: 'white' },
  /* the first of the two jokes. it is not a punchline that needs a drum, it is
     one that needs the reader to slow down and mean it. */
  { text: 'some know exactly, but have no time',
    rate: '-12%', pitch: '-2Hz', gap: 0.42, screen: 'white' },
  { text: 'and some just need one small thing done',
    rate: '-4%', pitch: '0Hz', gap: 0.30, screen: 'white' },
  /* the address. the one line in the clip that somebody has to be able to write
     down, so it is the slowest of the instructions.

     it is written here as four spoken words rather than as the address itself.
     handed `theboringtek` the synthesiser reads it as one run together word,
     which is unusable for the one line a viewer is supposed to be able to write
     down. so the voice says `the boring tek dot com` with a person's pacing and
     the caption still draws `theboringtek.com`, which is the address as it is
     actually written. that is the only place in this clip where the spoken copy
     and the drawn copy are not the same words, and it is a named exception with
     a guard of its own rather than a hole in one. see SAY_AS below. */
  { text: 'go to the boring tek dot com',
    rate: '-14%', pitch: '-1Hz', gap: 0.30, screen: 'site' },
  { text: 'press the button',
    rate: '-2%', pitch: '+1Hz', gap: 0.52, screen: 'site' },
  { text: 'it does not cost you anything',
    rate: '-10%', pitch: '-1Hz', gap: 0.28, screen: 'site' },
  { text: 'answer a few simple questions',
    rate: '+2%', pitch: '+1Hz', gap: 0.30, screen: 'site' },
  /* the list of three, read as a list of three. the air around each language is
     what the three greeting bubbles land in. */
  { text: 'in english, russian or latvian',
    rate: '-14%', pitch: '0Hz', gap: 0.26, screen: 'site' },
  /* the hole after this one is not a breath and it is not typed here either, it
     is measured. it holds the comedy read, the hand typing under it for exactly
     as long as that read lasts, and then the last two steps of the form done on
     camera. `null` means derived: main() sets it once the comedy take is on
     disk and buildVoice refuses a line whose gap is still null. */
  { text: 'then type what you want',
    rate: '-4%', pitch: '0Hz', gap: null, screen: 'site' },
  /* the send, and it comes **before** the offering. the first cut had the list
     of things we do here, which put the pitch on screen while the form was
     still being filled and landed the confirmation after the pitch was over.
     the order a viewer needs is: press it, see that it went, then hear what it
     is you are asking for.

     the hole after this one is not a breath. the send is a real press, the page
     disables the button and breathes it, the stubbed post answers after 480ms
     and only then is a check mark drawn — so the confirmation costs about two
     seconds of silence, and the line before it is two words long. */
  { text: 'send it',
    rate: '-6%', pitch: '-1Hz', gap: 2.60, screen: 'site' },
  /* and now the offering, on white, after the tick. the commas are what make it
     land one item at a time: `cardBreak` breaks on them, so app, website,
     research and graphic design each get the frame to themselves. */
  { text: 'app, website, research, graphic design, or one small job',
    rate: '+4%', pitch: '+1Hz', gap: 0.32, screen: 'white' },
  { text: 'in one or two days you get your report',
    rate: '-8%', pitch: '-1Hz', gap: 0.38, screen: 'white' },
  /* the close. the slowest and the lowest, and the only line that gets to sit
     under an end card. */
  { text: 'we sit between you and ai',
    rate: '-16%', pitch: '-3Hz', gap: 0.00, screen: 'white' },
];
const TAIL = 1.70;                 /* the end card holds this long after the voice */

/* ---------- where the spoken copy and the drawn copy come apart ----------
   one line, named here, and it is the address.

   every other card in this clip is cut from the words the synthesiser actually
   said, and the guard that says so is the reason this is a named exception
   rather than a loosened check. `markLines` collapses the run of spoken words
   into the one string a reader has to see; `guard` applies the same
   substitution to the spoken string before it compares, and it fails if the
   exception did not fire exactly once. an exception that quietly stopped
   matching would take the guard down with it, which is the only way a check
   like this goes wrong. */
const SAY_AS = [{
  line: 5,
  say: ['the', 'boring', 'tek', 'dot', 'com'],
  draw: 'theboringtek.com',
  why: 'the synthesiser reads the domain as one run together word, and this is '
    + 'the one line a viewer has to be able to write down',
}];

/* ---------- the comedy line ----------
   the typed line is the one sentence in the clip that is not ours: it is what
   somebody sitting in front of the form is thinking. so it is read by somebody
   else. `wry` is the fourth voice in `lib/voice.mjs`, male indian english,
   added for this and marked as a comedy voice so nothing can pick it to
   narrate. the english only rule settled 2026-08-27 is about language, and this
   is an accent — read light and deadpan, never played for the accent.

   it is not captioned. the words are already on screen, in the field, being
   typed; a caption of them would be the same sentence twice. so it never
   reaches the caption plan and the drawn-is-spoken guard never sees it, which
   is why it is laid into the voice track by hand rather than through
   `buildVoice`. it is in the duck envelope, so the keys go under it. */
const JOKE = { voice: 'wry', rate: '+2%', pitch: '0Hz', trimDb: -1.5 };
const TYPE_LINE = 9;      /* `then type what you want`, zero based */
const TYPE_LEAD = 0.30;   /* the line's last word to the first keystroke */
/* what is left of the hole after the typing: the last two steps of the form,
   done on camera, and the camera's move onto the send button. */
const TYPE_TAIL = 2.70;
const SILENCE_DB = -46;            /* a take ends where it falls this far under its own peak */
const PRE = 0.05, POST = 0.08;     /* audio kept either side of a take's own words */
const EDGE_FADE = 0.008;

/* what gets typed into the free text box. it is the joke the brief asked for
   and it is the one thing on screen that is not either the script or the site's
   own copy. no client, no name, nothing invented about anybody. */
const TYPED = 'i want ai to do my job but keep my salary';

/* ---------- the frame ----------
   540x960 css at device scale two, which is the 1080x1920 master every clip in
   here renders at.

   the platform safe area is post9's, per edge, in device px: 180 top, 220
   bottom, 140 left and right. everything below is inside it with real air, and
   the brief asked for that in as many words after the first framing sat too
   close to the edges. */
const SAFE_CSS = {
  top: SAFE.top / DSF, bottom: SAFE.bottom / DSF,
  left: SAFE.left / DSF, right: SAFE.right / DSF,
};

/* the card the site is filmed in. it is inside the safe area on every edge with
   six css px to spare on the sides and six at the top, which is twelve device
   px of air beyond the platform floor rather than sitting on it. */
const SCREEN = { x: 76, y: 96, w: 388, h: 420, radius: 16 };

/* the caption's one home, and it does not move for any beat. bottom anchored,
   so a card grows upward out of the line the last one sat on. */
const CAP_BOX = { x: 72, y: 400, w: 396, h: 220 };

/* at least this much clear air between the bottom of the site card and the top
   of the tallest caption there is. it is checked against a measured card rather
   than against the box, which is the mistake the pictogram layer made once. */
const CARD_CLEARANCE = 30;

/* the site's own viewport, inside the iframe. 390 is a phone, which is what the
   brief asked to film at, and it is also what puts the page's stacked lockup on
   screen — THE / BORING / TEK, the way the logo is drawn. 1200 tall so the form
   is rendered in full when it opens: the camera is a transform on the iframe
   rather than a scroll, so anything past the iframe's own viewport does not
   exist to be framed. */
const SITE = { w: 360, h: 1200 };

/* the end card. the wordmark where the site card was, and the address under it
   in the lockup subline's treatment, which is the one place the brand allows
   michroma small. */
/* the end card. the wordmark and the address sit where the site card was, on the
   same axis and centred in the room it leaves, so the last shot lands on the
   same part of the frame the whole middle of the clip has been using. */
const END = { wordmarkW: 300, wordmarkY: 285, domW: 214, domY: 347 };

/* ---------- the scene layer, and it only exists for the first ten seconds ----------
   the four lines before the site card arrives are type on white with an empty
   top two thirds, which a viewing called out as the one dead region in the clip.
   this fills it, and the rule that shapes everything below is that it fills
   **the card's own box**: `.pic` is laid at SCREEN, exactly where the site card
   lands, so nothing moves position or size when one hands over to the other.
   the svg fits its viewBox inside that box on the width, so the drawing sits as
   a band in the middle of where the lockup is about to be.

   they are quiet on purpose. no accent, because this clip has no green of its
   own anywhere; no scene translates; nothing spins. a block arrives, a mark is
   drawn, a stack lands. the voice is the thing being listened to and these are
   only what the frame is doing while it talks.

   **the handover is the whole timing argument.** the last scene's `out` is the
   frame the card's fade begins, to the millisecond, and `guard` fails the render
   if those two ever stop being the same number. scene four therefore stops
   leaving at 9.21 and is gone at 9.51, which is the frame the card starts
   arriving: no dissolve between two things in one box, and no hole either.

   each scene hands to the next on a 0.30s overlap, which is `planScenes`' own
   definition of a handoff: the outgoing one starts leaving on exactly the frame
   the incoming one starts arriving.

   **the first part of a scene pops while the one before it is still leaving**,
   and that is a correction off rendered frames rather than a preference. a scene
   container arriving is not a picture arriving: its parts are still at nothing
   until their own steps run, so a first pop timed politely after the handoff
   left the zone empty for about a fifth of a second between every pair. the
   frame at 8.00s in the first preview was exactly that, and it is the same fault
   this whole layer exists to fix, one twentieth the size. so each opening pop is
   pulled back to inside its own scene's entrance, which is the earliest
   `planScenes` allows.

   the four pictures, and why each one:

     1  everywhere       eight blocks filling the board, arriving scattered
                         rather than in reading order. `everywhere` is a quantity
                         and a direction at once, and eight of one shape landing
                         all over the frame is the only thing this vocabulary
                         says that means both.
     2  a figure and a   `does not know` is the hard one. the set has no question
        slashed eye      mark and inventing one would be a shape drawn by a
                         different hand, so it is said the way the set already
                         says things: a person, and beside them an eye with a
                         mark struck through it. the slash is knocked, which is
                         the one thing that lets an --fg stroke cross an --fg
                         shape and still read as a stroke.
     3  three sheets     `but have no time` is the punch of the line and a pile
        landing in a     of paper is what no time looks like. they land one on
        pile             another with the shadow doing the separating and a knock
                         around each, then two cut rules on the top one so the
                         stack reads as documents rather than as slabs. the first
                         half of the line is carried by the voice; a picture that
                         tried to say both would say neither at phone size.
     4  one block and    the plainest of the four and the one the line most
        one check cut    wants. it is also the gesture the ending pays off with
        into it          the site's own tick, so the clip says it small here and
                         large there.

   the ink is `fg`, `muted` and `cut` and there is no fourth. `accent` is refused
   in `guard` rather than merely avoided here. */
const HAIR = WEIGHTS.hair, MARK = WEIGHTS.mark;

/* the scene layer's own clock, written out so the handover is arithmetic rather
   than four numbers that happen to line up. `HAND` is the exit's own length,
   which is `SCENE_EXITS.springOut.for`, and every `out` below is a `leaving`
   plus it. */
const HAND = 0.30;
/* how long before its own line the site card starts fading in. it is the one
   number the scene layer and the camera share: the scenes end on it and the card
   begins on it, so the handover is arithmetic rather than two typed times that
   happen to agree. `guard` still compares what the two halves actually did with
   it, which is what catches a refactor that stops passing it. */
const CARD_LEAD = 0.42;

const SCENES = handover => [
  /* ---- line one: ai for business is everywhere now ---- */
  {
    id: 'everywhere', in: 0.18, out: 2.42 + HAND, exit: 'springOut',
    parts: [
      /* two rows of four. the order the times are in is not the order they sit
         in: they arrive across the board rather than along it, which reads as a
         thing spreading rather than as a row being filled. */
      { id: 'e-1', shape: 'square', at: { cx: 14, cy: 20, s: 14 }, steps: { kind: 'pop', t: 1.01 } },
      { id: 'e-2', shape: 'square', at: { cx: 38, cy: 20, s: 14 }, steps: { kind: 'pop', t: 0.45 } },
      { id: 'e-3', shape: 'square', ink: 'muted', at: { cx: 62, cy: 20, s: 14 }, steps: { kind: 'pop', t: 1.29 } },
      { id: 'e-4', shape: 'square', at: { cx: 86, cy: 20, s: 14 }, steps: { kind: 'pop', t: 0.73 } },
      { id: 'e-5', shape: 'square', ink: 'muted', at: { cx: 14, cy: 40, s: 14 }, steps: { kind: 'pop', t: 0.87 } },
      { id: 'e-6', shape: 'square', at: { cx: 38, cy: 40, s: 14 }, steps: { kind: 'pop', t: 1.43 } },
      { id: 'e-7', shape: 'square', at: { cx: 62, cy: 40, s: 14 }, steps: { kind: 'pop', t: 0.59 } },
      { id: 'e-8', shape: 'square', ink: 'muted', at: { cx: 86, cy: 40, s: 14 }, steps: { kind: 'pop', t: 1.15 } },
    ],
  },
  /* ---- line two: some people do not know why they even need it ---- */
  {
    id: 'unseen', in: 2.42, out: 4.80 + HAND, exit: 'springOut',
    parts: [
      { id: 'u-who', shape: 'human', at: { cx: 30, cy: 26, r: 8, sw: 26, sh: 9 },
        steps: { kind: 'pop', t: 2.68 } },
      { id: 'u-eye', shape: 'eye', at: { cx: 68, cy: 30, w: 30, h: 11, pr: 4.6 },
        steps: { kind: 'pop', t: 3.14 } },
      /* struck through, and knocked so the page shows between the two. it is
         drawn rather than popped: a line through something is a gesture with a
         direction, and popping it in whole would be a second shape appearing. */
      { id: 'u-no', shape: 'stroke', w: MARK, knock: true,
        at: { x1: 54, y1: 41, x2: 82, y2: 19 },
        steps: { kind: 'draw', t: 3.66, for: 0.55 } },
    ],
  },
  /* ---- line three: some know exactly, but have no time ---- */
  {
    id: 'pile', in: 4.80, out: 7.55 + HAND, exit: 'springOut',
    parts: [
      { id: 'p-1', shape: 'sheet', knock: true, at: { x: 24, y: 36, w: 52, h: 12 },
        steps: { kind: 'pop', t: 5.06 } },
      { id: 'p-2', shape: 'sheet', knock: true, at: { x: 29, y: 25, w: 46, h: 11 },
        steps: { kind: 'pop', t: 5.62 } },
      { id: 'p-3', shape: 'sheet', knock: true, at: { x: 22, y: 14, w: 50, h: 11 },
        steps: { kind: 'pop', t: 6.20 } },
      /* the writing, cut into the top sheet the way the vocabulary cuts writing
         into any document: a hole in the ink rather than ink on top of it, which
         is the only thing that reads on a solid shape. */
      { id: 'p-r1', shape: 'rule', ink: 'cut', w: HAIR, at: { x1: 27, x2: 61, y: 17.6 },
        steps: { kind: 'draw', t: 6.72, for: 0.40 } },
      { id: 'p-r2', shape: 'rule', ink: 'cut', w: HAIR, at: { x1: 27, x2: 50, y: 21.2 },
        steps: { kind: 'draw', t: 6.86, for: 0.40 } },
    ],
  },
  /* ---- line four: and some just need one small thing done ---- */
  {
    id: 'one', in: 7.55, out: handover, exit: 'springOut',
    parts: [
      { id: 'o-box', shape: 'square', at: { cx: 50, cy: 30, s: 20 },
        steps: { kind: 'pop', t: 7.80 } },
      { id: 'o-done', shape: 'check', ink: 'cut', w: MARK, at: { cx: 50, cy: 30, s: 13 },
        steps: { kind: 'draw', t: 8.48, for: 0.52 } },
    ],
  },
];

/* ---------- the scene layer's one frame ceilings ----------
   post7's, scaled to this clip's frame time exactly as they are there: every one
   is a ceiling on a **single frame's** change, which is the only kind of number
   that can tell a fast move from a snap. `sceneMotion` prints what the scenes
   actually reach against each of them before a frame is written, so the headroom
   is on screen rather than in a comment. */
const PIC_R = STEP / 16.6667;
const PART_MOVE_LIMIT = 4.5 * PIC_R;    /* viewBox units */
const PART_SCALE_LIMIT = 0.14 * PIC_R;
const PART_ROT_LIMIT = 10 * PIC_R;      /* degrees */
const PART_DASH_LIMIT = 0.12 * PIC_R;   /* fraction of a path, per frame */
const PART_FADE_LIMIT = 0.20 * PIC_R;
const PART_LIFT_LIMIT = 0.22 * PIC_R;
const SCENE_MOVE_LIMIT = 3.0 * PIC_R;
const SCENE_SCALE_LIMIT = 0.06 * PIC_R;
const SCENE_FADE_LIMIT = 0.20 * PIC_R;

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- the mix ---------- */
const TARGET_LUFS = -14;
const PEAK_CEILING = -1.0;
const DUCK = 0.60;
const VOICE_TRIM = -1.5;

/* ---------- easing ----------
   the site's own curves, written out in javascript and evaluated per frame. no
   css transition anywhere near a mark: one captured frame carries five or six
   BeginFrames, so a transition resolves about five times too fast. post2 paid
   for that lesson and every file in here has carried it since. */
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const fx = t => ((ax * t + bx) * t + cx) * t;
  const dx = t => (3 * ax * t + 2 * bx) * t + cx;
  return function (p) {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    let t = p;
    for (let i = 0; i < 8; i++) {
      const e = fx(t) - p;
      if (Math.abs(e) < 1e-6) break;
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return ((ay * t + by) * t + cy) * t;
  };
}
const GLIDE = bezier(.45, 0, .55, 1);      /* the calm in out */
const DRIFT = bezier(.25, .1, .25, 1);     /* a long move across a page */
const POP = bezier(.34, 1.4, .64, 1);      /* the site's own --spring */
const EASES = { glide: GLIDE, drift: DRIFT, pop: POP };
const lerp = (a, b, p) => a + (b - a) * p;
const clampTo = (v, a, b) => (v < a ? a : v > b ? b : v);

function prng(seed) {
  let s = seed >>> 0;
  return function () {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s |= 0;
    return (s >>> 0) / 4294967296;
  };
}

/* ---------- the voice, one take per line, cached ----------
   the sidecar json is the cache key and the **delivery is part of it**. the copy
   is one half of what a take is and the rate and the pitch are the other; a
   cache that only knew about the words would hand back a line read at the wrong
   speed the moment a delivery note changed, which is silent. post10 found that
   and this is the same guard. */
async function take(i) {
  const L = LINES[i];
  const name = 'post11-l' + String(i + 1).padStart(2, '0');
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

/* the comedy line, on the same cache discipline as a take: the copy, the voice
   and the delivery are all part of the key, because a cache that only knew the
   words would hand back the narrator reading a line that is not his. */
async function jokeTake() {
  const name = 'post11-typed';
  const cached = path.join(VOICE_OUT, name + '-' + JOKE.voice + '.json');
  const want = TYPED.replace(/\s+/g, ' ').trim();
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === want && j.voice === JOKE.voice && j.rate === JOKE.rate
      && j.pitch === JOKE.pitch && fs.existsSync(j.file)) {
      return { ...j, cached: true };
    }
  }
  const r = await speak(TYPED, { voice: JOKE.voice, name, rate: JOKE.rate, pitch: JOKE.pitch });
  return { ...r, cached: false };
}

/* where a take's sound actually starts and stops, off the waveform rather than
   off the word list. the synthesiser's WordBoundary carries a duration shorter
   than the sound — post10 measured 0.12s of speech after a reported word end —
   so a gap trusted to the word list is not the gap that is in the file. */
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

/* the fourteen takes laid on one clock. each one is placed so the silence
   between its own last sound and the next take's first sound is exactly the gap
   that line asked for. the word list comes back re timed by the same offsets,
   so the captions, the beats, the camera and the mascot are all cut against the
   timeline that is in the file. */
function buildVoice(takes) {
  const pcms = takes.map(t => decode(ffmpeg, t.file));
  const edges = pcms.map(audioEdges);
  const offs = [];
  let end = 0;
  for (let i = 0; i < takes.length; i++) {
    /* a derived gap that nobody derived is the one failure that would look like
       a timing choice rather than a bug, so it is refused here. */
    if (i > 0 && LINES[i - 1].gap == null) {
      throw new Error('line ' + i + '\'s gap is still null — main() has to measure it '
        + 'before the takes are laid down');
    }
    const gap = i === 0 ? 0.35 : LINES[i - 1].gap;
    const off = +(end + gap - edges[i].start).toFixed(4);
    offs.push(off);
    end = +(off + edges[i].end).toFixed(4);
  }
  const seconds = +(end + TAIL).toFixed(3);
  const track = new Float32Array(Math.ceil(seconds * SR));
  const words = [];
  const beats = [];
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
    const ws = takes[i].words.map(w => ({
      word: w.word, start: +(w.start + off).toFixed(4), end: +(w.end + off).toFixed(4),
    }));
    words.push(...ws);
    beats.push({
      i, text: LINES[i].text, screen: LINES[i].screen, words: ws,
      start: ws[0].start, end: ws[ws.length - 1].end,
      sound: { start: +(off + e.start).toFixed(4), end: +(off + e.end).toFixed(4) },
      wps: +(ws.length / (ws[ws.length - 1].end - ws[0].start)).toFixed(2),
      rate: LINES[i].rate, pitch: LINES[i].pitch,
    });
  }
  const gaps = [];
  for (let i = 1; i < beats.length; i++) {
    gaps.push(+(beats[i].sound.start - beats[i - 1].sound.end).toFixed(3));
  }
  return { track, seconds, words, beats, edges, offs, gaps };
}

/* one take laid onto a track that already exists, with the same edges, the same
   fades and the same kept air as `buildVoice` uses. it is the one piece of that
   function a second voice needs, written out once rather than duplicated inside
   it, because the comedy read is not a fifteenth line and should not have to
   pretend to be one to get into the file. */
function layIn(track, pcm, edge, off, gain) {
  const a = Math.max(0, Math.round((edge.start - PRE) * SR));
  const b = Math.min(pcm.length, Math.round((edge.end + POST) * SR));
  const at = Math.round(off * SR) + a;
  const fade = Math.round(EDGE_FADE * SR);
  for (let k = a; k < b; k++) {
    const j = at + (k - a);
    if (j < 0 || j >= track.length) continue;
    let g = gain;
    if (k - a < fade) g *= (k - a) / fade;
    else if (b - k < fade) g *= (b - k) / fade;
    track[j] += pcm[k] * g;
  }
  return { from: +(off + edge.start).toFixed(3), to: +(off + edge.end).toFixed(3) };
}

/* ---------- where a card is allowed to end ----------
   a card breaks at a sentence end, at a clause mark, or when it is full. this
   script is fourteen short lines with almost no punctuation in them, so left
   alone the cut ran straight through the seams: `dot com press`, `job send it`,
   `time and some` — three words that were never a phrase, and worse, a card
   holding the end of one screen beat and the start of the next while the picture
   changes underneath it.

   so the seams are **marked rather than inferred**. a comma goes on the last
   word of every line, **on the caption's copy only and after the synthesiser has
   already spoken**, `cardBreak` breaks on it, and `punctuation: 'drop'` takes it
   off again before a card is drawn. nothing about the audio or the timing can
   move, and it is exactly what that option was added for — post10's trick, for
   the same reason in a different shape.

   what the marks cannot fake is that the voice said these words in this order,
   and that is checked afterwards against the drawn sequence. */
/* where a run of spoken words sits inside a line, by what they say. it is a
   sequence match rather than an index, for the same reason `wordAt` is: an
   index keys the exception to a line nobody is allowed to edit. */
function runAt(ws, say) {
  for (let i = 0; i + say.length <= ws.length; i++) {
    let ok = true;
    for (let j = 0; j < say.length; j++) {
      if (bareWord(ws[i + j].word).toLowerCase() !== say[j]) { ok = false; break; }
    }
    if (ok) return i;
  }
  return -1;
}

function markLines(beats) {
  const out = [];
  const marked = [];
  /* the named exceptions, each carrying its own count. one hit is the contract;
     zero means it stopped matching and the guard has to say so rather than pass
     quietly, and two would mean a line said the same thing twice and the cards
     no longer line up with the sound. */
  const exceptions = SAY_AS.map(x => ({ ...x, hits: 0, at: null }));
  for (const b of beats) {
    /* the words this line **draws**. ordinarily they are the words it said; a
       named exception collapses a run of them into the one string a reader has
       to see, keeping the run's own start and end so the card is still cut
       against the sound. */
    let ws = b.words;
    for (const x of exceptions) {
      if (x.line !== b.i + 1) continue;
      const at = runAt(ws, x.say);
      if (at < 0) continue;
      ws = [
        ...ws.slice(0, at),
        { word: x.draw, start: ws[at].start, end: ws[at + x.say.length - 1].end },
        ...ws.slice(at + x.say.length),
      ];
      x.hits++;
      x.at = +ws[at].start.toFixed(3);
    }
    ws.forEach((w, k) => {
      const last = k === ws.length - 1;
      const already = /[.!?,;:]["')\]]?$/.test(w.word);
      if (last && !already) marked.push(w.word);
      out.push({ word: last && !already ? w.word + ',' : w.word, start: w.start, end: w.end });
    });
  }
  return { words: out, marked, exceptions };
}

/* a word inside a beat, by what it says rather than by where it sits. keying a
   press to beats[5].words[2] keys it to a line nobody is allowed to edit; keying
   it to "button" survives the copy moving. */
function wordAt(beat, text, which = 0) {
  const hits = beat.words.filter(w => bareWord(w.word).toLowerCase() === text);
  if (!hits.length) throw new Error('line ' + (beat.i + 1) + ' has no word "' + text + '"');
  return hits[Math.min(which, hits.length - 1)];
}

/* ---------- the hand ----------
   post9's, and the reasoning is post9's: a constant rate reads as a machine
   filling a field, which is what it is. every gap is its own number, one is a
   hesitation, and one letter is got wrong, noticed, deleted and typed again
   through the page's own input listener, so the site's state goes wrong and
   comes right the way it would for a visitor. seeded, so the rhythm is uneven
   and identical on every run. */
const NEIGHBOUR = {
  a: 's', b: 'v', c: 'x', d: 'f', e: 'r', f: 'g', g: 'h', h: 'j', i: 'o', j: 'k',
  k: 'l', l: 'k', m: 'n', n: 'm', o: 'p', p: 'o', q: 'w', r: 't', s: 'd', t: 'y',
  u: 'i', v: 'b', w: 'e', x: 'c', y: 'u', z: 'x', ' ': 'v',
};
function humanKeys(text, from, until, seed) {
  const rnd = prng(seed);
  const typoAt = 3 + Math.floor(rnd() * Math.max(1, text.length - 8));
  const hesitateAt = Math.min(text.length - 2, typoAt + 4 + Math.floor(rnd() * 4));
  const keys = [];
  const gaps = [];
  let t = 0;
  for (let i = 0; i < text.length; i++) {
    if (i === hesitateAt) t += 0.18;
    if (i === typoAt) {
      const wrong = NEIGHBOUR[text[i].toLowerCase()] || 'e';
      keys.push({ dt: t, key: wrong, kind: 'typo' });
      t += 0.08 + rnd() * 0.08;
      keys.push({ dt: t, key: 'Backspace', kind: 'fix' });
      t += 0.06 + rnd() * 0.07;
    }
    keys.push({ dt: t, key: text[i], kind: 'key' });
    const g = 0.034 + rnd() * 0.070;
    gaps.push(g);
    t += g;
  }
  const want = until - from;
  const scale = t > want && want > 0 ? want / t : 1;
  return {
    keys: keys.map(k => ({ t: +(from + k.dt * scale).toFixed(4), key: k.key, kind: k.kind })),
    scale, gaps: gaps.map(g => g * scale), typoAt, hesitateAt,
    from, to: +(from + t * scale).toFixed(4),
  };
}

/* ---------- what the camera does over the card ----------
   a shot is a selector, a zoom and an offset, resolved in the browser at the
   moment its leg starts. nothing here is a page coordinate, which is the rule
   record.mjs set and the reason a shot cannot go stale when the form grows a
   step under it.

   two framing rules the card imposes, both of them the page's rather than this
   file's:

     the crop never shows the iframe's own top, because the site's bar is fixed
     there and the brief says the nav is out. the clamp is on the visible top
     edge rather than on the zoom, so it holds at any framing.

     the subline is the widest line index.html sets. a shot that puts it in the
     card and cuts its first and last letter reads as a rendering fault rather
     than as a crop — post9 rendered THE BORING TEK as SHE / 7/RING / MEK doing
     exactly this. so a deep shot is framed **below** the subline rather than
     through it, and `clipCheck` fails the render if one is ever both in the
     card and cut. */
const SNAP = 10 / 60;
/* a shot is either a zoom typed here or a **fit**: with `fit` set the zoom comes
   off the element's own measured width, so a shot frames what it is about rather
   than guessing a number that goes stale the moment the card grows a step. the
   ceiling is the page's rather than this file's — see `ZOOM_CAP`. */
const shot = (sel, o) => ({
  sel, to: o.to || null,
  z: o.z || null, fit: o.fit == null ? null : o.fit,
  dy: o.dy || 0, maxZ: o.maxZ || null, wide: !!o.wide,
  /* where the subject sits in the card. `centre` is the default and is right for
     a thing that fits; `top` and `bottom` are for a form, whose card is a
     different height at every step and whose interesting end is one or the
     other — the question at the top, the send button at the bottom. a shot that
     centres a card taller than the crop frames its middle, which is the one part
     with nothing to look at in it. */
  align: o.align || 'centre',
});

/* ---------- the page's own zoom ceiling ----------
   index.html is laid out edge to edge, and the subline is the widest line it
   sets. the card is 388 css px across, so at zoom z it shows 388/z of the site:
   past the point where that is narrower than the subline, a shot with the
   subline in it cuts its first and last letter — which reads as a rendering
   fault rather than as a crop, and is what rendered THE BORING TEK as
   SHE / 7/RING / MEK the one time post9 tried to zoom past it.

   the answer post9 found was to frame **around** the subline instead of through
   it, and that answer is not available here: the band between the subline and
   the first section below the hero is about a hundred and twenty page px, so a
   frame that clears the subline at the top reaches the sections at the bottom,
   and the brief says those never appear.

   so the ceiling stands and the depth comes from travel. beat five frames the
   whole lockup and beat six travels down onto the button, which is what makes
   the button large in frame — the same conclusion record.mjs reached the first
   time anyone pointed a camera at this page. the number is measured in the
   browser rather than typed, and `clipCheck` fails the render if a subline is
   ever both in the card and cut. */
const ZOOM_CAP = 1.9;

/* how many keystrokes share one tick. see the keyboard note below. */
const KEY_GROUP = 4;

function planSite(beats, jokeDur, cardIn) {
  const B = i => beats[i];
  const cues = [];        /* one shot actions: a tap, a key, a call into the page */
  const legs = [];        /* the camera */
  const fades = [];       /* the card's own opacity */
  const rings = [];       /* the tap indicator and its sound, one per real tap */

  /* every tap is a `click` except one. the send is the press the whole clip is
     about and it sounded exactly like the five presses before it, which is the
     one place in the sound where a press had to mean something. it gets
     `press` — the same mechanism, lower and firmer and four decibels up. */
  const tap = (t, sel, note, sound) => {
    cues.push({ t: +t.toFixed(4), tap: sel, note });
    rings.push({ t: +t.toFixed(4), kind: sound || 'click' });
  };
  const call = (t, fn, note) => cues.push({ t: +t.toFixed(4), call: fn, note });
  const key = (t, k) => cues.push({ t: +t.toFixed(4), key: k });

  /* ---- the card arrives on beat five ----
     fitted to the lockup, which is the hero as one block: the mascot, the
     wordmark, the subline and the button. fitting it rather than typing a zoom
     is also what keeps the subline whole by construction, because the subline is
     inside the thing being fitted. */
  const b5 = B(4);
  /* `cardIn` rather than `b5.start - CARD_LEAD` computed again here. it is the
     same number, handed in, because the scene layer ends on it and two places
     doing the same arithmetic is two places that can round it differently. */
  fades.push({ t0: cardIn, t1: b5.start + 0.10, to: 1 });
  legs.push({ t0: cardIn, t1: b5.start + 0.10, ease: 'glide',
    to: shot('.lockup', { fit: 14 }), beat: 5, anchor: 'start' });

  /* ---- beat six: down to the button, one tap ----
     the glitch is the page's own shake, played on a frame this file chose rather
     than on the page's dice — the scheduler is frozen for the whole film, so it
     fires once, here, and it is the button asking for the press it is about to
     get.

     the shot is fitted to the cta zone rather than to the button, and the
     ceiling above is why: fitting the button alone asks for a zoom the subline
     cannot survive. what makes the button large in frame is the travel, which is
     most of the height of the hero. */
  const b6 = B(5);
  legs.push({ t0: b6.start - SNAP, t1: b6.start, ease: 'pop',
    to: shot('.hero', { to: '.cta-zone', fit: 8, maxZ: 1.22 }), beat: 6, anchor: 'land' });
  call(b6.start + 0.30, 'glitch', 'the cta shakes, once, on our frame');
  tap(b6.end + 0.10, '.cta', 'the button');

  /* ---- beat seven: the form is open and the first question is up ----
     the press is a third of a second before the beat and every part of that is
     doing something. index.html opens the card by growing a grid row from 0fr
     over .44s and springing .cardin over .52s, and while that runs `.pad` is a
     full height box clipped inside a short one — so a shot measured during it
     frames a card that is still becoming. the camera therefore leaves after the
     page has settled rather than on the press. */
  const b7 = B(6);
  legs.push({ t0: b7.start + 0.45, t1: b7.start + 1.05, ease: 'drift',
    to: shot('.pad', { fit: 10, align: 'top' }), beat: 7, anchor: 'settle' });
  /* the fourth chip is not the one taken. `check my business` is the first, and
     it is the answer this clip is about: it routes to the path with the multi
     pick step on it, which is the two ticks beat eight asks for, and then to a
     free text box, which is beat ten. one answer, and the page does the rest. */
  tap(b7.end + 0.10, '.chips .chip:nth-child(1)', 'check my business');

  /* ---- beat eight: two ticks, two taps ----
     the want step is the one multi pick in the form, so the ticks are real ticks
     rather than two single picks in a row. the second of them is `i will explain
     myself`, which is what puts the free text box on screen two beats later —
     the brief's beat ten is the page's own consequence of beat eight rather than
     a step this file forced.

     the leg waits until the page has drawn the want step: a single pick chip
     marks itself pressed, waits 240ms and advances itself, so a shot measured on
     the beat's first word would frame the card the intent step left behind. */
  const b8 = B(7);
  legs.push({ t0: b8.start + 0.15, t1: b8.start + 0.65, ease: 'drift',
    to: shot('.pad', { fit: 10, align: 'top' }), beat: 8, anchor: 'the want step' });
  tap(b8.start + 0.75, '.chips .chip:nth-child(1)', 'ai for my business');
  tap(b8.start + 1.30, '.chips .chip:nth-child(5)', 'i will explain myself');

  /* ---- beat nine: the same form, in three languages ----
     the language buttons live in the top bar, which the crop excludes, so the
     switch is made through the page's own handler rather than by a tap on a
     control the viewer cannot see. what is on screen is the real thing: the
     question, the chips and the buttons re render, the russian page drops to the
     mono stack the way index.html says it must, and the ticks survive the switch
     because the site never resets progress.

     it ends back on english, because the line typed two beats later is english
     and a latvian form with an english answer in it is a frame that is wrong in
     a way nobody would be able to name. */
  const b9 = B(8);
  legs.push({ t0: b9.start - 0.10, t1: b9.start + 0.40, ease: 'drift',
    to: shot('.pad', { fit: 10, align: 'top' }), beat: 9, anchor: 'start' });
  call(wordAt(b9, 'russian').start - 0.06, 'lang:ru', 'the form in russian');
  call(wordAt(b9, 'latvian').start - 0.06, 'lang:lv', 'the form in latvian');
  call(b9.end + 0.12, 'lang:en', 'and back, before anything is typed');

  /* ---- beat ten: the free text box, typed live ----
     the next press is the last thing the want step needs; the page then draws
     the explain step, whose whole body is a textarea. the camera frames the
     field rather than the card, at the deepest zoom that still holds the field's
     full width — past it the box is cut at both ends, which reads as a broken
     render rather than as a punch in. */
  const b10 = B(9);
  call(b9.end + 0.34, 'next', 'on to the free text box');
  legs.push({ t0: b10.start + 0.10, t1: b10.start + 0.62, ease: 'drift',
    to: shot('.pad textarea', { fit: 10, dy: 6 }), beat: 10, anchor: 'start' });
  tap(b10.end + 0.06, '.pad textarea', 'the field');
  /* the hand types for exactly as long as the comedy voice takes to say the
     line, because they are the same beat: `jokeDur` is measured off that take's
     own waveform and the window is cut to it, so the last key lands on the last
     syllable without either of them being told about the other. forty three
     keystrokes over that window is about twelve characters a second, which is a
     person typing rather than a field filling itself. */
  const typing = humanKeys(TYPED, b10.end + TYPE_LEAD, b10.end + TYPE_LEAD + jokeDur, 0x51c07a);
  for (const k of typing.keys) key(k.t, k.key);

  /* ---- the keyboard, one tick per group of characters ----
     the typing carried no sound at all, which on a clip whose whole middle is a
     form being filled is the one silence nobody reads as a choice. a tick per
     keystroke is forty three sounds inside three and a half seconds, and at any
     level that is a rattle rather than a keyboard. one per four is about three a
     second, which is what a keyboard sounds like from the next desk.

     the typo and the backspace get their own tick wherever they fall, because
     they are the two moments the rhythm breaks and a group that swallowed them
     would be a sound that is not listening to the hand it belongs to. */
  const keys = [];
  let since = KEY_GROUP;
  for (const k of typing.keys) {
    const own = k.kind !== 'key';
    if (own || since >= KEY_GROUP) { keys.push(+k.t.toFixed(4)); since = 0; }
    since++;
  }

  /* ---- the last two steps, and they are on camera now ----
     the card used to leave here. the offering was the next line, the screen was
     white for it, and the rest of the form was finished behind the fade. the
     offering is now after the confirmation, so there is no white beat to hide in
     and no reason to want one: the form finishes where the viewer can see it.

     the one thing that is still not a keystroke is the last step's two fields.
     typing a name and an email at a rate a person types is three more seconds of
     a form being filled, which this clip does not have and does not need. so
     `fill` fires **inside the last step's own entrance**, while index.html is
     still growing the card and springing `.cardin` — through the page's own
     input listeners exactly as before, and with no frame that shows the fields
     empty and then full. */
  const steps = typing.to;
  tap(steps + 0.40, '.nav .btn:not(.ghost)', 'the explain step is answered');
  legs.push({ t0: steps + 0.95, t1: steps + 1.45, ease: 'drift',
    to: shot('.pad', { fit: 10, align: 'top' }), beat: 11, anchor: 'the size step' });
  tap(steps + 1.55, '.chips .chip:nth-child(2)', 'how big is your business');
  call(steps + 1.95, 'fill', 'the last step, filled inside its own entrance');

  /* ---- beat eleven: send, and the confirmation ----
     the camera is already on the card, so this is a reframe onto the bottom of
     the last step rather than a fade in. the send is a real press on the page's
     own button and the two posts are stubbed: nothing leaves the browser and the
     run counts them. the page then does what it does, the button goes busy, the
     stub answers after 480ms, and a check mark is drawn. */
  const b11 = B(10);
  /* this is the one leg in the file that is aligned to the **bottom** of a card
     that is still growing, and that is why it waits half a second after the
     chip advances rather than the tenth of a second beats eight and nine take.
     a top aligned shot can be measured during index.html's grid grow because the
     top of `.pad` does not move while it happens; the bottom moves the whole
     time, so a shot resolved mid grow frames a send button that is not where it
     is going to be. */
  legs.push({ t0: steps + 2.30, t1: steps + 2.85, ease: 'glide',
    to: shot('.pad', { fit: 10, align: 'bottom' }), beat: 11, anchor: 'the send button' });
  const sendAt = +(b11.end + 0.10).toFixed(4);
  tap(sendAt, '.nav .btn:not(.ghost)', 'send', 'press');
  /* the tick, and the sound on it. 480ms is the stub and the page draws on the
     frame after that, so this is where the confirmation actually exists. it is
     the set's `ding`, which is written as "a check being drawn" and is the one
     sound in the file that already meant yes. */
  const confirmAt = +(sendAt + 0.55).toFixed(4);
  /* and a reframe after the page has answered: the sent state is a much shorter
     card than the last step was, so the frame that held the fields would hold
     mostly white around a check mark. at the first timing this landed 0.15s
     before the fade and the confirmation was a shot nobody saw. */
  legs.push({ t0: b11.end + 0.52, t1: b11.end + 1.02, ease: 'drift',
    to: shot('.pad', { fit: 10, align: 'top' }), beat: 11, anchor: 'the check mark' });

  /* ---- beat twelve: the card leaves and the offering lands on white ----
     the tick has had about a second and a quarter settled in frame by the time
     this starts, which is the whole reason `send it` carries a 2.60s gap. the
     five things we do are the screen for this line, so the card goes and does
     not come back. */
  const b12 = B(11);
  fades.push({ t0: b12.start - 0.40, t1: b12.start - 0.02, to: 0 });

  cues.sort((a, b) => a.t - b.t);
  legs.sort((a, b) => a.t0 - b.t0);
  return { cues, legs, fades, rings, typing, keys, sendAt, confirmAt };
}

/* ---------- the mascot's marks ----------
   thirteen marks and five bubbles. the bubbles are the brief's five and the
   count has not moved through any of this: everything added is the turn channel
   and the state table, which cost nothing anybody has to read.

   the opening four are hung off the **scenes** rather than off the lines, one
   each, inside the scene's own hold — see `planMarks`. the turn is set only over
   those four: the module's resting bias turns him a third of the way into the
   frame and that is right for the middle of the clip, and over the opening he is
   turned further into the picture and back out again. by the time the site card
   fades in he is on the bias and every mark after that leaves the channel alone,
   exactly as they always did.

   the three greetings are a **run** on one mark rather than three marks. three
   ordinary bubbles need six and a quarter seconds of head room between them,
   which is a fifth of this clip spent on one line; a run is the same gesture at
   a shorter profile, so each one lands on the language it is greeting in. that
   is the one thing this clip cost `lib/mascot.mjs`. */
function planMarks(beats, site, pic) {
  const B = i => beats[i];
  const at = x => +x.toFixed(3);
  const typing = site.typing;
  /* a scene by name, so a mark is hung off the picture it is reacting to rather
     than off a number that has to be kept in step with one by hand. */
  const S = id => {
    const sc = pic.scenes.find(x => x.id === id);
    if (!sc) throw new Error('there is no scene called "' + id + '"');
    return sc;
  };
  const marks = [];

  /* ---- the first quarter, and it is one reaction per scene ----
     before the scene layer existed this was four marks hung off the lines, and
     that was the right answer while the top of the frame was empty: he was the
     only thing in it that could move. now there is a picture up there and the
     job changed. one reaction per scene, each landing inside that scene's own
     hold rather than on the line's first word, so he is watching a thing arrive
     rather than punctuating a sentence.

     none of them is stacked on another beat: four scenes, four marks, and the
     gaps between them are the handoffs. none of them says anything either, the
     five bubbles this clip has are all spoken for.

     the moves stay small. the picture is the thing being looked at, and a
     mascot doing gymnastics next to it would be two things asking for the same
     attention. what carries them is the turn: it walks out to 0.62 and back to
     the 0.35 resting bias by the time the card arrives, and every mark after
     that leaves the channel alone. */
  marks.push({ t: 0.30, state: 'neutral', turn: 0.18 });
  /* the blocks are still landing. he looks up into them, which is what `curious`
     is: a tilt in with the eyes arriving ahead of the head. */
  marks.push({ t: at(S('everywhere').settled + 0.87), state: 'curious', turn: 0.62 });
  /* the slash goes through the eye. `thinking` is the smallest state that reads
     as not following: up and away, one lid down, a slow scan over the hold. */
  marks.push({ t: at(S('unseen').settled + 0.73), state: 'thinking', turn: 0.44 });
  /* the third sheet lands on the pile and he is not impressed by it. this is the
     clip's original joke and it now sits with the picture that makes it rather
     than a second and a half after the word `no`. */
  marks.push({ t: at(S('pile').settled + 1.39), state: 'unimpressed' });
  /* the check is being cut into the one small block. he leans in for it, and the
     turn comes most of the way back on the way. */
  marks.push({ t: at(S('one').settled + 0.60), state: 'curious', turn: 0.52 });
  /* level again as the scenes leave and the card arrives, and back on the bias
     the whole middle of the clip runs at. */
  marks.push({ t: at(S('one').out + 0.44), state: 'neutral', turn: 0.35 });
  /* the card is up and the site is the picture from here. */
  marks.push({ t: at(B(5).start - 0.24), state: 'curious' });
  /* one state across beats seven, eight and nine, carrying the three greetings
     inside its own hold. */
  const b9 = B(8);
  marks.push({
    t: at(B(6).start + 0.10), state: 'neutral',
    bubbles: [
      { t: at(wordAt(b9, 'english').start), text: 'hey' },
      { t: at(wordAt(b9, 'russian').start), text: 'привет' },
      { t: at(wordAt(b9, 'latvian').start), text: 'labdien' },
    ],
  });
  /* the salary line, on the frame it finishes typing, and it is hung off the
     hand rather than off a beat because that is the thing he is reacting to. */
  marks.push({ t: at(typing.to + 0.06), state: 'delighted', bubble: 'nice' });
  /* level again for the last two steps and the send. */
  marks.push({ t: at(typing.to + 2.40), state: 'neutral' });
  /* the check mark. he looks up at it, on the frame the page draws it, which is
     the beat the whole reorder exists to make land. */
  marks.push({ t: at(site.confirmAt + 0.10), state: 'curious' });
  marks.push({ t: at(B(11).start - 0.20), state: 'neutral' });
  marks.push({ t: at(B(13).start - 0.16), state: 'agreeing', bubble: 'finally' });
  return marks;
}

/* ---------- the composed page ----------
   the site's own tokens, the caption layer, the mascot layer, the card the site
   is filmed in, the tap ring and the end card. nothing else is in the frame. */
function sceneHtml(cap, capBox, mas, pic) {
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<title>post11</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500;700&display=swap">
<style>
:root{
  --mono:ui-monospace,SFMono-Regular,"Cascadia Mono",Menlo,Consolas,"Liberation Mono",monospace;
  --display:"Michroma",var(--mono);
  --body:"Space Grotesk",var(--mono);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}
.stage{position:relative;width:${VW}px;height:${VH}px;background:var(--bg)}

/* load bearing rather than decoration. with nothing animating at all chrome
   stops producing compositor frames and the screenshot call blocks on frame one
   forever — post2 found it and every clip in demo/ has carried something like it
   since. the site in the card is animating for most of the film, but not for the
   first four lines, which is exactly when this matters. */
.tick{position:absolute;left:-20px;top:-20px;width:2px;height:2px;background:var(--bg);
  will-change:transform;animation:tick 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes tick{from{transform:translate3d(0,0,0)}to{transform:translate3d(1px,0,0)}}

/* ---------- the card the site is filmed in ----------
   overflow hidden is the crop, and the crop is the framing: the iframe is 390
   css px of real phone inside it and the transform is the camera. the hairline
   and the radius are the site's own — 1px --line and the 16px tier the cards
   below the hero use — and they are what stop a zoom reading as content
   clipping at a boundary nobody can see. */
.screen{
  position:absolute; left:${SCREEN.x}px; top:${SCREEN.y}px;
  width:${SCREEN.w}px; height:${SCREEN.h}px;
  border:1px solid var(--line); border-radius:${SCREEN.radius}px;
  overflow:hidden; background:var(--bg); opacity:0; z-index:2;
  will-change:opacity;
}
.screen iframe{
  position:absolute; left:0; top:0; width:${SITE.w}px; height:${SITE.h}px;
  border:0; transform-origin:0 0; will-change:transform;
}
/* the tap. a ring rather than a pointer, because this is a phone being used
   rather than a desktop being driven, and a mouse arrow over a phone screen is
   the one thing in a clip like this that says it was filmed on a laptop. */
#tap{
  position:absolute; left:0; top:0; width:52px; height:52px; margin:-26px 0 0 -26px;
  border-radius:50%; border:2px solid var(--fg); opacity:0; z-index:6;
  pointer-events:none; will-change:transform,opacity;
}

/* ---------- the end card ---------- */
.end{position:absolute; left:0; right:0; text-align:center; opacity:0; z-index:3;
  pointer-events:none; will-change:opacity}
/* both end card lines hug their own ink rather than spanning the frame. a full
   width box reports the frame's own edges back to the safe area check and proves
   nothing about where the letters are — which is the same mistake the caption
   engine's own note warns about, measured on cells rather than on the row that
   centres them. */
.end{left:50%; right:auto; width:max-content; max-width:${VW - 2 * SAFE_CSS.left}px}
#end-wm{top:${END.wordmarkY}px; font-family:var(--display); font-weight:400;
  color:var(--fg); text-transform:uppercase; letter-spacing:0; line-height:1;
  white-space:nowrap; transform:translate(-50%,-50%)}
#end-dom{top:${END.domY}px; font-family:var(--display); font-weight:400;
  color:var(--sub); text-transform:uppercase; letter-spacing:.18em; line-height:1;
  white-space:nowrap; text-indent:.18em; transform:translate(-50%,-50%)}

/* the pill drops to the mono stack for anything that is not plain ascii, which
   is index.html's own rule for the subline and for the whole russian page. space
   grotesk ships latin and latin ext and no cyrillic, so a greeting in russian
   would otherwise fall back one glyph at a time and set half a word in one face
   and half in another. all or nothing, never per glyph. */
.m-pill[data-mono="1"]{font-family:var(--mono); letter-spacing:0}

${pictogramCss(pic, SCREEN)}
${captionCss(cap, capBox)}
${mascotCss(mas)}
</style>
</head>
<body>
<div class="stage">
  <div class="tick"></div>
${pictogramMarkup(pic)}
  <div class="screen" id="screen"><iframe id="site" src="/index.html" scrolling="no"></iframe></div>
  <div class="end" id="end-wm">the boring tek</div>
  <div class="end" id="end-dom">theboringtek.com</div>
${captionMarkup(cap)}
${mascotMarkup(mas)}
  <div id="tap"></div>
</div>
<script>
window.__CAP_PLAN = ${JSON.stringify(cap)};
window.__CAP_BOX = ${JSON.stringify(capBox)};
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(mas))};
window.__P11 = ${JSON.stringify({ VW, VH, DSF, SCREEN, SITE, END, CAP_BOX })};
(${captionPage.toString()})();
${mascotRuntime()}
/* the scene layer's plan carries no svg: the markup is already in the document
   and the page half only needs the origins, which parts draw, which cast a
   shadow, the shadow's constants, how many css px a viewBox unit is worth, and
   the engine plan, so the page builds the same gsap timeline node built rather
   than being handed the numbers it produced. that is the parity check, and it
   is the reason there is one motion core with two readers.

   it is installed **after** the mascot's runtime and before the stage's,
   because its own rAF filter wraps whatever shim is already there and nothing
   else in this document asks for a frame. */
window.__PIC_PLAN = ${JSON.stringify(pictogramPagePlan(pic, SCREEN))};
${pictogramRuntime()}
(${stagePage.toString()})();
/* the three layers measure and fit themselves once, after both faces are
   really here. offline everything renders in the mono fallback and looks
   almost right, which is the worst kind of wrong to fit type against —
   og.mjs has exited non zero on exactly that since the day it was written. */
document.fonts.load('400 40px Michroma')
  .then(() => document.fonts.load('700 44px "Space Grotesk"'))
  .then(() => document.fonts.load('500 26px "Space Grotesk"'))
  .then(() => document.fonts.ready)
  .then(() => {
    window.__built = {
      ...window.__stage.build(),
      cap: window.__cap.build(),
      mas: window.__mas.build(),
      caps: window.__mas.caps(),
      /* the scene layer's own build. no font is involved, but it is built here
         anyway so there is one ready gate rather than two. what it still does is
         refuse a part that draws and has no geometry to draw. */
      pic: window.__pic.build(),
    };
  });
</script>
</body>
</html>`;
}

/* ---------- the composed page's own half ----------
   serialised in with .toString(), so it closes over nothing: everything it needs
   arrives on window.__P11. it writes numbers to elements and decides nothing,
   which is the same split lib/captions.mjs and lib/mascot.mjs are built on. */
function stagePage() {
  const P = window.__P11;
  const screen = document.getElementById('screen');
  const site = document.getElementById('site');
  const tap = document.getElementById('tap');
  const wm = document.getElementById('end-wm');
  const dom = document.getElementById('end-dom');
  const pill = document.getElementById('m-pill');

  /* michroma is proportional and the tracking is heavy, so both end card lines
     are measured on a canvas at 100px and divided down to the width they should
     occupy rather than given a guessed size. the string is measured **as it
     renders** — uppercase — because canvas measureText knows nothing about
     text-transform and caps are about fifteen per cent wider. */
  function fit(el, want, track) {
    const s = el.textContent.toUpperCase();
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = '400 100px Michroma';
    const em = (cv.measureText(s).width + track * 100 * s.length) / 100;
    el.style.fontSize = (want / em).toFixed(3) + 'px';
    return +(want / em).toFixed(2);
  }

  window.__stage = {
    ready: false,
    build() {
      const a = fit(wm, P.END.wordmarkW, 0);
      const b = fit(dom, P.END.domW, 0.18);
      this.ready = true;
      return { wordmarkPx: a, domPx: b };
    },
    /* the camera. a point in the site's own css px, centred in the card at zoom
       z. the site's fixed top bar lives at the iframe's own top, so the clamp is
       on the visible top edge and the nav cannot enter the card at any framing. */
    cam(cx, cy, z) {
      /* ---------- nothing may scroll, in either document ----------
         the camera is a transform, so a scroll anywhere in the chain moves the
         picture without moving any of the numbers this file reads, and the
         framing silently stops meaning what it says.

         `overflow: hidden` stops a person scrolling and does not stop the
         browser. `element.focus()` scrolls the focused element into view in
         **every scrollable ancestor it has**, and an overflow-hidden box is a
         scroll container — so focusing a field inside the iframe scrolled the
         card in this document, across the frame boundary, by 251px. the send
         shot then resolved correctly, was written correctly, and rendered a
         quarter of a page lower than either of them said: the last thing the
         clip showed was an empty card with a button at the top of it. the
         window measurement is what caught it, because it reads the rendered
         boxes rather than the numbers that were written.

         so both are pinned here, every frame, next to the transform they would
         otherwise fight. */
      const w = this.win();
      if (w && (w.scrollY || w.scrollX)) w.scrollTo(0, 0);
      if (screen.scrollTop || screen.scrollLeft) { screen.scrollTop = 0; screen.scrollLeft = 0; }
      const tx = P.SCREEN.w / 2 - cx * z, ty = P.SCREEN.h / 2 - cy * z;
      site.style.transform = 'translate(' + tx.toFixed(3) + 'px,' + ty.toFixed(3) + 'px) '
        + 'scale(' + z.toFixed(5) + ')';
    },
    fade(v) { screen.style.opacity = v.toFixed(4); },
    end(v) { wm.style.opacity = v.toFixed(4); dom.style.opacity = v.toFixed(4); },
    ring(x, y, p) {
      if (p <= 0 || p >= 1) { tap.style.opacity = '0'; return; }
      tap.style.opacity = ((1 - p) * 0.9).toFixed(3);
      tap.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) '
        + 'scale(' + (0.35 + p * 0.95).toFixed(3) + ')';
    },
    /* the bubble's face, decided by the string in it. see the css. */
    mono() {
      const t = (pill.textContent || '').trim();
      pill.dataset.mono = t && /[^\x20-\x7E]/.test(t) ? '1' : '';
      return pill.dataset.mono === '1';
    },

    /* ---------- reaching into the site ----------
       both documents are served from one origin, so the card can be measured and
       driven directly rather than through a second protocol. everything below is
       a read except `call`, and `call` only ever presses a control the page
       already has. */
    doc() { return site.contentDocument; },
    win() { return site.contentWindow; },
    /* an element's rect in the site's own css px, which is what a camera target
       is, and in the composed page's css px, which is where a tap goes. */
    rect(sel) {
      const d = this.doc();
      const e = d && d.querySelector(sel);
      if (!e) return null;
      const b = e.getBoundingClientRect();
      if (!b.width && !b.height) return null;
      const f = site.getBoundingClientRect();
      const z = f.width / P.SITE.w;
      return {
        page: { x: b.left, y: b.top, w: b.width, h: b.height,
          cx: b.left + b.width / 2, cy: b.top + b.height / 2 },
        screen: { x: f.left + b.left * z, y: f.top + b.top * z,
          w: b.width * z, h: b.height * z,
          cx: f.left + (b.left + b.width / 2) * z, cy: f.top + (b.top + b.height / 2) * z },
        z: z,
      };
    },
    /* where the card is looking, in the site's own px, so the two framing rules
       can be checked rather than trusted. */
    window_() {
      const f = site.getBoundingClientRect();
      const s = screen.getBoundingClientRect();
      const z = f.width / P.SITE.w;
      return {
        z: +z.toFixed(5),
        left: +((s.left - f.left) / z).toFixed(1), top: +((s.top - f.top) / z).toFixed(1),
        right: +((s.right - f.left) / z).toFixed(1), bottom: +((s.bottom - f.top) / z).toFixed(1),
      };
    },
    /* the nav, and it is a measurement rather than a promise: the bar is fixed
       to the iframe's own top, so this asks whether the card is looking at it. */
    navSeen() {
      const d = this.doc();
      const bar = d && d.querySelector('.bar');
      if (!bar) return null;
      const b = bar.getBoundingClientRect();
      const w = this.window_();
      return { bottom: +b.bottom.toFixed(1), top: +w.top.toFixed(1), seen: b.bottom > w.top + 0.5 };
    },
    /* the subline is the widest line the page sets. in the card and cut is the
       fault; out of the card is fine and is how the deep shots are framed. */
    clipCheck() {
      const d = this.doc();
      const el = d && (d.querySelector('.tag-live') || d.querySelector('.tag'));
      if (!el) return null;
      const b = el.getBoundingClientRect();
      const w = this.window_();
      const inCard = b.bottom > w.top && b.top < w.bottom;
      return {
        inCard,
        clipped: inCard && (b.left < w.left - 0.5 || b.right > w.right + 0.5),
        left: +b.left.toFixed(1), right: +b.right.toFixed(1),
        wLeft: w.left, wRight: w.right,
      };
    },
    /* is the site's own mascot alive. the eyes are centred by design — the page
       gates tracking on a media query the rig answers false to — so what has to
       be moving is the lid, and this reads it back off computed style rather
       than off what was written. */
    siteLid() {
      const d = this.doc();
      const e = d && d.querySelector('.m-eye');
      if (!e) return null;
      return parseFloat(getComputedStyle(e).getPropertyValue('--blink')) || 1;
    },
    /* everything the site has written on it, tested against the caption band.
       nothing the page draws may sit behind our words, and on this clip that is
       arithmetic — the card ends above the band — but it is checked because the
       card is what moves. */
    bandClash(top, bottom) {
      const s = screen.getBoundingClientRect();
      if (getComputedStyle(screen).opacity < 0.02) return { n: 0 };
      const over = Math.min(s.bottom, bottom) - Math.max(s.top, top);
      return { n: over > 0 ? 1 : 0, over: +over.toFixed(1) };
    },
    /* the two controls the crop hides and the steps the film does off camera.
       every one of them is the page's own handler on the page's own element:
       nothing here writes into the site's state and nothing skips a step. */
    call(what) {
      const d = this.doc();
      if (!d) return 'no document';
      if (what.slice(0, 5) === 'lang:') {
        const b = d.querySelector('.lang[data-l="' + what.slice(5) + '"]');
        if (!b) return 'no button';
        b.click();
        return d.documentElement.getAttribute('lang');
      }
      if (what === 'next') {
        const b = d.querySelector('.nav .btn:not(.ghost)');
        if (!b) return 'no next';
        b.click();
        return 'next';
      }
      if (what.slice(0, 5) === 'pick:') {
        const n = Number(what.slice(5));
        const c = d.querySelector('.chips .chip:nth-child(' + n + ')');
        if (!c) return 'no chip';
        c.click();
        return 'picked ' + n;
      }
      if (what === 'glitch') {
        const cta = d.querySelector('.cta');
        if (!cta) return 'no cta';
        cta.classList.remove('shake');
        d.body.classList.remove('dm-noglitch');
        void cta.offsetWidth;
        cta.classList.add('shake');
        return 'shook';
      }
      if (what === 'focus:name') { const e = d.getElementById('f-name'); if (e) { e.focus(); return 'name'; } return 'no field'; }
      if (what === 'focus:email') { const e = d.getElementById('f-email'); if (e) { e.focus(); return 'email'; } return 'no field'; }
      if (what === 'blur') { if (d.activeElement && d.activeElement.blur) d.activeElement.blur(); return 'blurred'; }
      return 'unknown: ' + what;
    },
    /* what the form is showing, so the run can print the real step names rather
       than a list this file believes in. */
    step() {
      const d = this.doc();
      const q = d && d.querySelector('.pad .q');
      const dots = d ? d.querySelectorAll('.pad .pdot').length : 0;
      return { q: q ? q.textContent.trim() : null, dots,
        lang: d ? d.documentElement.getAttribute('lang') : null,
        sent: !!(d && d.querySelector('.pad .tick')),
        chips: d ? [...d.querySelectorAll('.chips .chip')]
          .map(c => c.getAttribute('aria-pressed') === 'true') : [] };
    },
    /* the typed line as the field actually holds it, and how tall its glyphs
       come out on the master. the brief asked whether it is legible at phone
       size and this is the number that answers it. */
    typedInk() {
      const d = this.doc();
      const ta = d && d.querySelector('.pad textarea');
      if (!ta) return null;
      const cs = getComputedStyle(ta);
      const f = site.getBoundingClientRect();
      const z = f.width / P.SITE.w;
      const cv = document.createElement('canvas').getContext('2d');
      cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      const m = cv.measureText('H');
      const cap = m.actualBoundingBoxAscent || parseFloat(cs.fontSize) * 0.7;
      return { text: ta.value, capPx: +(cap * z * P.DSF).toFixed(1), font: cv.font };
    },
    /* ---------- can the caption face set cyrillic at all ----------
       `document.fonts.check(font, text)` is the obvious way to ask and it is the
       wrong one: it answers whether the faces needed for that text are *loaded*,
       and a browser that is going to fall back for a missing glyph still says
       yes. asked here it came back true for space grotesk, which ships latin and
       latin ext and no cyrillic at all.

       so it is measured instead. the same string is laid out in one family with
       **no fallback list**, and again in a family that does not exist, which is
       the browser's own default. two families that render a string at exactly
       the same width are not two renderings — it is the fallback both times.
       a latin control runs through the same test, because a method that cannot
       tell the two apart would say no to everything. */
    cyrillic(text) {
      const cv = document.createElement('canvas').getContext('2d');
      const w = (fam, s) => { cv.font = '500 100px ' + fam; return +cv.measureText(s).width.toFixed(2); };
      const NONE = '__no_such_family__';
      const MONO = 'ui-monospace, "Cascadia Mono", Consolas, monospace';
      const control = { sg: w('"Space Grotesk"', 'hey'), none: w(NONE, 'hey') };
      const cyr = { sg: w('"Space Grotesk"', text), none: w(NONE, text), mono: w(MONO, text) };
      return {
        family: getComputedStyle(pill).fontFamily,
        control, cyr,
        /* the control has to differ or the test proves nothing. */
        methodWorks: control.sg !== control.none,
        setsCyrillic: cyr.sg !== cyr.none,
        monoDiffers: cyr.mono !== cyr.none,
        note: cyr.sg !== cyr.none
          ? 'space grotesk sets it' : 'space grotesk falls back for it',
      };
    },
    /* the safe area of everything we draw, against the drawn ink rather than
       against the box anything was told to draw in. the caption's own check does
       the words; the card, the end card and the tap ring are added here. the
       mascot is not in it — it is measured off its own geometry in node, because
       a browser rect for a rotated plate is the box of its geometry. */
    safe() {
      const out = { ...window.__cap.safe(P.VW, P.VH) };
      const add = (el, name) => {
        if (!el) return;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.02) return;
        const b = el.getBoundingClientRect();
        if (!b.width || !b.height) return;
        const d = { left: b.left, top: b.top, right: P.VW - b.right, bottom: P.VH - b.bottom };
        if (Math.min(d.left, d.top, d.right, d.bottom)
          < Math.min(out.left, out.top, out.right, out.bottom)) out.worst = name;
        out.left = Math.min(out.left, d.left); out.top = Math.min(out.top, d.top);
        out.right = Math.min(out.right, d.right); out.bottom = Math.min(out.bottom, d.bottom);
      };
      add(screen, '.screen');
      add(wm, '#end-wm');
      add(dom, '#end-dom');
      return out;
    },
    /* the tallest caption card there is, grown by the biggest scale the entrance
       reaches, which is the ceiling the card has to clear. measured once, off
       the fitted cards, because it is the fitted size that decides it. */
    capCeiling() {
      let tallest = 0;
      for (const el of document.querySelectorAll('.cap-float, .cap-card')) {
        tallest = Math.max(tallest, el.getBoundingClientRect().height);
      }
      const bottom = P.CAP_BOX.y + P.CAP_BOX.h;
      return { tallest: +tallest.toFixed(1), top: +(bottom - tallest * 1.125).toFixed(1), bottom };
    },
    accent() {
      const p = document.createElement('span');
      p.style.cssText = 'position:absolute;left:-999px;color:var(--accent)';
      document.body.appendChild(p);
      const c = getComputedStyle(p).color;
      p.remove();
      return c;
    },
    /* one flush per capture, in both documents. the composed page animates
       nothing by hand, and the shim is installed and flushed here anyway so the
       layer runs under the same clock every clip in demo/ runs under. the site
       does animate by hand — the blink, the decode, the typing, the glitch — and
       it is the one that has to be right. */
    tick(now) {
      let n = 0;
      if (window.__dmRaf) n += window.__dmRaf(now);
      const w = this.win();
      if (w && w.__dmRaf) n += w.__dmRaf(now);
      return n;
    },
  };
}

/* ---------- what goes into both documents, before any page script ----------
   one function, because puppeteer installs it in every frame. what it does in
   the composed page is the prng and the shim; what it does in the site is that
   plus the four things a film needs from a live page and index.html is not
   edited for any of them. */
function injected() {
  let seed = window.top === window ? 0x2f6a41b3 : 0x7c19d5a1;
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
  if (window.top === window) return;

  /* ---- from here down it is the site ---- */
  try {
    localStorage.setItem('bt-lang', 'en');
    localStorage.setItem('bt-theme', 'light');
  } catch (e) { /* private mode, the page copes on its own */ }

  /* the page gates pointer tracking on this one query and also snaps --ex/--ey
     to zero the instant the form opens. answering false switches the tracking
     off at the source, so the eyes are centred and the blink is what is alive —
     which is what the brief asked the captured mascot to be. every other query
     is passed through, so hover, the cta filling and the theme all still work. */
  const realMM = window.matchMedia.bind(window);
  window.matchMedia = function (q) {
    if (q === '(hover: hover) and (pointer: fine)') {
      return { matches: false, media: q, onchange: null,
        addEventListener() { }, removeEventListener() { },
        addListener() { }, removeListener() { }, dispatchEvent() { return false; } };
    }
    return realMM(q);
  };

  /* NOTHING leaves this browser. the send at the end is real as far as the page
     is concerned and goes nowhere, and the run counts the two posts. */
  const realFetch = window.fetch;
  window.fetch = function (url) {
    const u = String(url && url.url ? url.url : url);
    if (/web3forms|workers\.dev|theboringtek/.test(u)) {
      window.__dmPosts = (window.__dmPosts || 0) + 1;
      return new Promise(res => setTimeout(() => res(new Response('{"success":true}', {
        status: 200, headers: { 'Content-Type': 'application/json' },
      })), 480));
    }
    return realFetch.apply(this, arguments);
  };

  document.addEventListener('DOMContentLoaded', function () {
    const css = document.createElement('style');
    css.textContent = [
      /* the camera is a transform on the iframe element, so the page inside it
         must never scroll: a scroll would move the content under a camera that
         thinks it knows where everything is. */
      'html,body{overflow:hidden !important}',
      /* the glitch is frozen and fired once, on the frame this film chooses. the
         page schedules its own every three to five seconds off Math.random, and
         a clip cannot have the button shaking whenever it feels like it. */
      'body.dm-noglitch .cta.shake{animation:none !important}',
      'body.dm-noglitch .cta.shake .cta-t{animation:none !important}',
      /* the site's own speech bubble is off, and it is the one thing on this
         list that is a taste call rather than a clock one. this film already has
         a mascot with a thought bubble in the corner; a second bubble inside the
         card is two characters talking over each other in one frame. the site's
         mascot still blinks, which is what it is in the shot for. */
      '.bubble{display:none !important}',
      /* ---- and everything below the hero is out of the film ----
         the brief is explicit: the crop is the hero card, and who we are and the
         honest part never appear. the crop already excludes them at every
         framing the camera is allowed, and this is what turns that from a thing
         the numbers happen to give into a thing that cannot happen — a form that
         grows a step taller than expected cannot bring a section into frame if
         the section is not laid out.

         it is a framing decision rather than an edit to the page: what is on
         screen is one shot of index.html, and a shot of the hero does not
         contain the sections under it. nothing about the hero, the form or the
         send is touched. */
      'section.below,footer.foot{display:none !important}',
    ].join('');
    document.head.appendChild(css);
    document.body.classList.add('dm-noglitch');
  }, true);
}

/* ---------- one server, both documents ----------
   the composed page at /stage and the repo root under everything else, so the
   site is same origin with the page that films it. index.html is served byte for
   byte as it is in git: nothing is rewritten on the way out. */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.xml': 'application/xml', '.txt': 'text/plain', '.ico': 'image/x-icon',
};
function serve(stageHtml) {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/stage') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(stageHtml);
    }
    if (p.endsWith('/')) p += 'index.html';
    const f = path.resolve(ROOT, '.' + p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      res.writeHead(404); return res.end('not here');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(f)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(f).pipe(res);
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
  const fps = out.match(/([\d.]+)\s*fps/);
  const br = out.match(/bitrate:\s*(\d+)\s*kb\/s/);
  return {
    seconds: dur ? (+dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3])) : null,
    w: res ? +res[1] : null, h: res ? +res[2] : null,
    fps: fps ? parseFloat(fps[1]) : null,
    kbps: br ? +br[1] : null,
    audio: /Audio:\s*aac/.test(out),
  };
}

function blend(N) {
  console.log('  blending ' + N * SUB + ' subframes into ' + N + ' frames ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS * SUB), '-i', path.join(SUBS, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1)
      + ',setpts=PTS-STARTPTS,framestep=' + SUB,
    '-q:v', '2', path.join(FRAMES, 'f%06d.jpg')]);
}

function encode(audioFile) {
  const args = ['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%06d.jpg')];
  if (audioFile) args.push('-i', audioFile);
  /* crf 17 and the reason is the frame: this is ink on a white page with one
     screen recording in the middle of it, which is the cheapest thing this
     pipeline encodes. post10 is 22 because post10 is film grain over black. */
  args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-r', String(FPS));
  if (audioFile) args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
  args.push('-movflags', '+faststart', MP4);
  ff(args);
  return MP4;
}

/* ---------- go ---------- */
async function main() {
  console.log('the boring tek — post11, the explainer');
  fs.mkdirSync(OUT, { recursive: true });

  /* ---- the comedy line, first, because the clip is cut to it ----
     the hole the typing lives in is not a number in the script: it is however
     long this take turns out to be, plus the room the last two steps of the form
     need after it. so it is measured off the take's own waveform before a single
     other beat is placed. */
  const joke = await jokeTake();
  const jokePcm = decode(ffmpeg, joke.file);
  const jokeEdge = audioEdges(jokePcm);
  const jokeDur = +(jokeEdge.end - jokeEdge.start).toFixed(3);
  LINES[TYPE_LINE].gap = +(TYPE_LEAD + jokeDur + TYPE_TAIL).toFixed(3);
  console.log('  the comedy line: ' + joke.voice + ' (' + joke.voiceId + ') at '
    + joke.rate + '/' + joke.pitch + ', ' + jokeDur.toFixed(2) + 's of sound'
    + (joke.cached ? ', cached' : '') + ' — "' + TYPED + '"');
  console.log('    so line ' + (TYPE_LINE + 1) + ' carries a '
    + LINES[TYPE_LINE].gap.toFixed(2) + 's hole: ' + TYPE_LEAD.toFixed(2)
    + 's before the first key, the read and the hand together, then '
    + TYPE_TAIL.toFixed(2) + 's for the last two steps and the move onto send');

  /* ---- the voice ---- */
  const takes = [];
  for (let i = 0; i < LINES.length; i++) takes.push(await take(i));
  const v = buildVoice(takes);
  const SECONDS = v.seconds;
  console.log('  voice: ' + takes.length + ' takes, '
    + takes.filter(t => t.cached).length + ' cached, ' + v.words.length + ' words, '
    + SECONDS.toFixed(2) + 's with a ' + TAIL.toFixed(2) + 's tail');
  for (const b of v.beats) {
    console.log('    ' + String(b.i + 1).padStart(2) + '  ' + b.start.toFixed(2) + '..'
      + b.end.toFixed(2) + '  ' + b.wps.toFixed(2) + ' w/s  ' + b.rate + '/' + b.pitch
      + '  ' + b.screen.padEnd(5) + '  ' + b.text);
  }
  const wpsAll = v.beats.map(b => b.wps);
  console.log('    delivery spans ' + Math.min(...wpsAll).toFixed(2) + ' to '
    + Math.max(...wpsAll).toFixed(2) + ' words a second against a flat 2.3, and the '
    + 'gaps run ' + Math.min(...v.gaps).toFixed(2) + ' to ' + Math.max(...v.gaps).toFixed(2) + 's');

  /* ---- the captions ----
     float, which is the style built for footage: space grotesk 700, lowercase,
     one short card at a time, no card behind it and no fill of any kind. the ink
     is --fg and only --fg and there is no accent in this clip at all, so `flash`
     is off and a guard fails the render if the accent is ever painted. cards may
     break on a comma as well as on a sentence end, which is what stops
     "some know exactly, but have no time" cutting a card that was never a
     phrase. */
  const cut = markLines(v.beats);
  for (const x of cut.exceptions) {
    console.log('  spoken and drawn come apart once: line ' + x.line + ' says "'
      + x.say.join(' ') + '" and draws "' + x.draw + '", '
      + (x.hits === 1 ? 'matched at ' + x.at + 's' : x.hits + ' matches')
      + ' — ' + x.why);
  }
  const cap = planCaptions(cut.words, {
    style: 'float', perCard: 3, floatSize: 44,
    cardBreak: /[.!?,;:]["')\]]?$/,
    lead: 0.10, hold: 0.28,
    /* wider than the engine's 0.28, and it came off a rendered frame rather than
       out of a preference. every word kicks as it is said, and a kick grows the
       word about its own centre — so a long word being spoken next to a short
       one eats the gap on its left and `ai for business` read as `ai forbusiness`
       at 44px. the fit divides by this same number, so opening it costs a little
       type size rather than overflowing the box. */
    bodyGap: 0.36,
  });
  console.log(describe(cap));
  console.log('  ' + cut.marked.length + ' line ends were marked so no card straddles two of them, '
    + 'and the marks are stripped before a card is drawn');

  /* ---- the scene layer, which is the opening and nothing else ----
     it is planned before the mascot, because the mascot's first four marks are
     hung off the scenes rather than off the lines now: one reaction per scene,
     inside that scene's own hold, so he is watching a picture rather than
     reacting to a sentence that has a picture next to it.

     `handover` is the frame the site card starts arriving on, rounded once here
     and handed to both halves, so the scenes ending and the card beginning are
     provably the same instant rather than two numbers that agree to three
     decimal places on a good day. */
  const handover = +(v.beats[4].start - CARD_LEAD).toFixed(3);
  const pic = planScenes(SCENES(handover));
  console.log(describeScenes(pic));
  for (const n of pic.notes) console.log('    ! ' + n);
  const picMotion = sceneMotion(pic, FPS, pic.seconds);
  const W = picMotion.worst;
  console.log('  the worst single frame in the scene layer, against the ceiling it is judged on:');
  for (const [k, lim, name] of [
    ['partO', PART_FADE_LIMIT, 'a part fading'], ['partS', PART_SCALE_LIMIT, 'a part scaling'],
    ['partM', PART_MOVE_LIMIT, 'a part moving'], ['partR', PART_ROT_LIMIT, 'a part turning'],
    ['partD', PART_DASH_LIMIT, 'a path drawing'], ['partL', PART_LIFT_LIMIT, 'a shadow lifting'],
    ['sceneO', SCENE_FADE_LIMIT, 'a scene fading'], ['sceneS', SCENE_SCALE_LIMIT, 'a scene scaling'],
    ['sceneM', SCENE_MOVE_LIMIT, 'a scene moving'],
  ]) {
    console.log('    ' + name.padEnd(18) + W[k].d.toFixed(4) + ' of ' + lim.toFixed(4)
      + (W[k].who ? '   ' + W[k].who + ' at ' + W[k].t.toFixed(2) + 's' : ''));
  }
  console.log('    ' + picMotion.handoffs.length + ' handoff(s), '
    + picMotion.dark.toFixed(2) + 's with nothing in the zone, at most '
    + picMotion.visMax + ' scene(s) up at once');

  /* ---- the site, the mascot, the cut ---- */
  const site = planSite(v.beats, jokeDur, handover);
  const marks = planMarks(v.beats, site, pic);
  const mas = planMascot({
    seconds: SECONDS, marks, theme: 'light', pos: 'bottom-left',
    band: { x: CAP_BOX.x, y: CAP_BOX.y, w: CAP_BOX.w, h: CAP_BOX.h },
    seed: 0x11a70b,
  });
  console.log(describeMascot(mas));
  const rep = mascotMotion(mas, FPS, SECONDS);
  const rep60 = FPS === 60 ? rep : mascotMotion(mas, 60, SECONDS);
  console.log(describeMotion(rep));

  console.log('  the hand: ' + site.typing.keys.length + ' keystrokes over '
    + (site.typing.to - site.typing.from).toFixed(2) + 's, gaps '
    + (Math.min(...site.typing.gaps) * 1000).toFixed(0) + ' to '
    + (Math.max(...site.typing.gaps) * 1000).toFixed(0) + 'ms, a typo at '
    + site.typing.typoAt + ' and a hesitation at ' + site.typing.hesitateAt);

  /* ---- the sound ----
     no music in this pass. what is in the file besides the read is the mascot's
     own two cues — a pop when a bubble arrives and a ding on the agreement beat,
     which is the module's whole sound surface — a click on each tap, a `key`
     tick per group of characters under the typing, a `press` on the send, and a
     `ding` on the frame the check mark is drawn.

     the three that are new are the three things the clip did silently: the hand
     typed with nothing under it, the send sounded like every other tap, and the
     confirmation the whole ending is built around arrived without a sound. none
     of them is a file — `key` and `press` are two more recipes in
     `lib/sfx.mjs`, and `ding` is the one that was already written as "a check
     being drawn" and had only ever been used for an agreement.

     every one of them is derived from a plan that already existed rather than
     typed against the picture, so changing a word in the script moves the voice,
     the captions, the camera, the mascot and the sounds together. */
  const cues = mascotCues(mas)
    .concat(site.rings.map(r => ({ t: r.t, kind: r.kind })))
    .concat(site.keys.map(t => ({ t, kind: 'key' })))
    .concat([{ t: site.confirmAt, kind: 'ding' }]);
  const sfx = renderSfx(cues, SECONDS);
  console.log('  sound: ' + cues.length + ' cues — '
    + Object.entries(cues.reduce((a, c) => (a[c.kind] = (a[c.kind] || 0) + 1, a), {}))
      .map(([k, n]) => n + ' ' + k).join(', ') + ', and no music');

  if (PLAN_ONLY) {
    console.log('\n  the cut');
    for (const sc of pic.scenes) {
      console.log('    ' + sc.in.toFixed(2).padStart(6) + '..' + sc.out.toFixed(2)
        + '  scene ' + sc.id + ', settled ' + sc.settled.toFixed(2)
        + ', leaving ' + sc.leaving.toFixed(2) + ', ' + sc.parts.length + ' parts');
    }
    console.log('    ' + site.typing.from.toFixed(2) + '..' + site.typing.to.toFixed(2)
      + '  the hand and the comedy read, ' + site.keys.length + ' key ticks under '
      + site.typing.keys.length + ' keystrokes');
    for (const c of site.cues.filter(c => !c.key)) {
      console.log('    ' + c.t.toFixed(2).padStart(6) + 's  '
        + (c.tap ? 'tap  ' + c.tap : 'call ' + c.call) + '   ' + (c.note || ''));
    }
    for (const l of site.legs) {
      console.log('    ' + l.t0.toFixed(2).padStart(6) + '..' + l.t1.toFixed(2)
        + '  ' + l.ease.padEnd(6) + ' to ' + l.to.sel + ' @' + l.to.z + '   beat ' + l.beat);
    }
    for (const f of site.fades) {
      console.log('    ' + f.t0.toFixed(2).padStart(6) + '..' + f.t1.toFixed(2)
        + '  card -> ' + f.to);
    }
    console.log('\n  ' + SECONDS.toFixed(2) + 's, ' + Math.round(FPS * SECONDS)
      + ' frames at ' + FPS + 'fps. nothing was rendered.');
    return;
  }

  const N = Math.round(FPS * SECONDS);
  let state = null;
  if (ONLY_ENCODE) {
    state = JSON.parse(fs.readFileSync(STATE, 'utf8'));
  } else {
    state = await render(cap, mas, site, v, N, SECONDS, pic);
    fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
  }

  /* ---- the mix ----
     the read on top, the small bus under it, ducked while a word is being
     spoken, then the loudness pass that keeps its best answer rather than its
     last one. both halves of that discipline were paid for by post5 and both are
     in the file above the loop. */
  /* the comedy read goes onto the voice track by hand rather than through
     buildVoice, because it is not one of the fourteen takes: it is not on the
     narrator's clock, it is not captioned, and it must never reach the plan that
     the drawn-is-spoken guard reads. it is laid so its first sound lands on the
     first keystroke, which is also its last sound landing on the last one — the
     window was cut to its length. a decibel and a half under the narrator, so it
     reads as somebody else thinking rather than as the film talking.

     its words **are** in the duck envelope. the keyboard ticks have to go under
     it exactly as they go under a narrated line, and an envelope built from the
     fourteen takes alone would not know this line is being said at all. */
  const jokeOff = +(site.typing.from - jokeEdge.start).toFixed(4);
  const jokeWords = joke.words.map(w => ({
    word: w.word, start: +(w.start + jokeOff).toFixed(4), end: +(w.end + jokeOff).toFixed(4),
  }));
  const jokeAt = layIn(v.track, jokePcm, jokeEdge, jokeOff, Math.pow(10, JOKE.trimDb / 20));
  const env = voiceEnvelope(v.words.concat(jokeWords), SECONDS);
  const mix = mixdown(v.track, sfx.buf, env, { duck: DUCK, voiceGain: VOICE_TRIM });
  const under = checkUnderVoice(mix.voiceOut, mix.bus);
  const baseMix = mix.out.slice();
  const passes = [];
  const miss = q => Math.abs(q - TARGET_LUFS);
  let lift = 0, ceiling = PEAK_CEILING, best = null;
  for (let i = 0; i < 12; i++) {
    mix.out.set(baseMix);
    if (lift) applyGain(mix.out, lift);
    const l = limit(mix.out, ceiling);
    writeWav(WAV, mix.out);
    const m = loudness(ffmpeg, WAV);
    const pass = { lift, ceiling, lufs: m.lufs, tp: m.truePeak, gr: l.reduction };
    passes.push(pass);
    if (!m.ok) { best = pass; break; }
    if (m.truePeak != null && m.truePeak > PEAK_CEILING) {
      ceiling = +(ceiling - (m.truePeak - PEAK_CEILING) - 0.05).toFixed(2);
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
  const after = loudness(ffmpeg, WAV);

  const file = encode(WAV);
  const p = probe(file);

  const joked = { ...joke, dur: jokeDur, at: jokeAt, words: jokeWords };
  report(state, v, cut, cap, mas, rep60, site, cues, sfx, mix, under, after, lim, best, passes, p, SECONDS, joked, pic);
  const fail = guard(state, v, cut, cap, mas, rep60, site, cues, mix, under, after, lim, p, SECONDS, joked, pic);

  if (!KEEP && !ONLY_ENCODE) {
    fs.rmSync(FRAMES, { recursive: true, force: true });
    fs.rmSync(SUBS, { recursive: true, force: true });
  }
  if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
  console.log('\nall checks passed.');
}

/* ---------- the render ---------- */
async function render(cap, mas, site, v, N, SECONDS, pic) {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  for (const d of [FRAMES, SUBS, VERIFY]) {
    fs.rmSync(d, { recursive: true, force: true });
    fs.mkdirSync(d, { recursive: true });
  }

  const html = sceneHtml(cap, CAP_BOX, mas, pic);
  const { srv, port } = await serve(html);
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
    const q = new Promise(r => { expired = r; });
    await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pauseIfNetworkFetchesPending', budget: ms });
    await q;
  };

  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/stage' });

  /* what is missing rather than that something is, because a page that never
     comes up is otherwise a twenty minute render's worth of nothing. */
  const state0 = () => page.evaluate(() => {
    const d = window.__stage && window.__stage.doc();
    return {
      stage: !!window.__stage, built: !!window.__built,
      cap: !!(window.__cap && window.__cap.ready),
      mas: !!(window.__mas && window.__mas.ready),
      pic: !!(window.__pic && window.__pic.ready),
      fonts: document.fonts.status,
      doc: !!d, cta: !!(d && d.querySelector('.cta')),
      siteFonts: d ? d.fonts.status : null,
    };
  }).catch(e => ({ error: String(e).slice(0, 120) }));

  let burned = 0, s = null;
  for (let i = 0; i < 400; i++) {
    s = await state0();
    if (s.built && s.cap && s.mas && s.pic && s.cta && s.siteFonts === 'loaded') break;
    await advance(STEP); burned += STEP;
  }
  if (!(s.built && s.cap && s.mas && s.pic && s.cta)) {
    throw new Error('the stage never became ready: ' + JSON.stringify(s));
  }
  /* offline everything renders in the mono fallback and looks almost right,
     which is the worst kind of wrong to judge type on. */
  const faces = await page.evaluate(() => ({
    michroma: document.fonts.check('400 40px Michroma'),
    grotesk7: document.fonts.check('700 40px "Space Grotesk"'),
    grotesk5: document.fonts.check('500 26px "Space Grotesk"'),
    siteMichroma: window.__stage.doc().fonts.check('400 40px Michroma'),
  }));
  for (const [k, ok] of Object.entries(faces)) {
    if (!ok) throw new Error(k + ' did not load — the type would be judged in the mono fallback');
  }
  console.log('    ready after ' + burned.toFixed(0) + 'ms of virtual time');

  /* ---------- the second gsap clock, checked before a frame is written ----------
     the scene layer runs on the rAF shim and the shim is flushed once per
     captured frame, so gsap's own time has to be the frame index over the frame
     rate: exactly, not nearly. this walks a dozen ticks and reads the number
     back off the global timeline and off the master, and hands back the ticks it
     spent so the render's own one-tick-per-capture count still means what it
     says. it is the check this clip's camera guard was modelled on and it is not
     allowed to soften. */
  const picBuilt = await page.evaluate(() => window.__built.pic);
  const picSync = await page.evaluate((fps, count) => window.__pic.sync(fps, count, 1), FPS, 12);
  console.log('    gsap ' + picBuilt.gsap + ', ' + picBuilt.eases + ' house eases, timeline '
    + picBuilt.tlDuration + 's: ' + picSync.steps + ' shim ticks, worst |gsap t - frame/fps| = '
    + picSync.worst + 's');
  if (!(Number(picSync.worst) < 1e-6)) {
    throw new Error('the pictogram timeline is not on the capture clock — ' + picSync.worst + 's off');
  }

  /* the site gets its own opening move off camera. index.html decodes its
     wordmark over 1150ms and types its subline after it, and that is the page's
     entrance rather than this film's: the card fades in on a page that has
     already arrived, the way a phone looks when you have been holding it for a
     second. */
  const SETTLE = Math.round(4.0 * FPS);
  for (let i = 0; i < SETTLE; i++) {
    await page.evaluate(now => window.__stage.tick(now), (i + 1) * STEP);
    await advance(STEP);
  }
  console.log('    the site settled ' + (SETTLE / FPS).toFixed(2) + 's before frame zero');

  const built = await page.evaluate(() => window.__built);
  const ceiling = await page.evaluate(() => window.__stage.capCeiling());
  const accent = await page.evaluate(() => window.__stage.accent());
  console.log('    the caption ceiling is ' + ceiling.top + '..' + ceiling.bottom
    + ' css px, the card ends at ' + (SCREEN.y + SCREEN.h)
    + ', so there is ' + (ceiling.top - (SCREEN.y + SCREEN.h)).toFixed(1) + 'px between them');

  /* the cyrillic answer, measured before a frame is written rather than after a
     render. the pill is loaded with the greeting and asked what it can set. */
  const cyr = await page.evaluate(() => {
    const el = document.getElementById('m-bubble-text');
    const before = el.textContent;
    el.textContent = 'привет';
    const r = window.__stage.cyrillic('привет');
    const mono = window.__stage.mono();
    const caps = window.__mas.caps();
    el.textContent = before;
    window.__stage.mono();
    return { ...r, mono, caps };
  });
  console.log('    cyrillic: ' + cyr.note + ' — "привет" measures ' + cyr.cyr.sg
    + 'px in space grotesk and ' + cyr.cyr.none + ' in the browser default, so the pill drops '
    + 'to the mono stack: ' + (cyr.mono ? 'applied' : 'NOT APPLIED')
    + ', which measures ' + cyr.cyr.mono + 'px and renders ' + cyr.caps.capPx + ' device px of cap');

  /* the head's clearance is computed off every frame rather than sampled, since
     the geometry is known and it costs nothing to do it properly. */
  let headWorst = null;
  for (let f = 0; f < N; f++) {
    const r = headRect(mas, mascotFrame(mas, f / FPS));
    const near = Math.min(r.left, r.top, r.right, r.bottom);
    if (!headWorst || near < headWorst.near) headWorst = { t: +(f / FPS).toFixed(2), near, ...r };
  }

  /* ---- the loop ---- */
  const fired = new Set();
  const taps = [], calls = [], clipFaults = [], navFaults = [], camTrail = [], shots = [], framing = [];
  const camFaults = [];
  const safeSamples = [], bandHits = [], lidSeen = [];
  /* the scene layer's own books. `picFaults` is every one frame ceiling it
     broke, `picDrift` is the worst disagreement between the timeline node
     stepped and the one the page stepped, and `picSafe` is the closest its
     drawn ink and its shadow ever came to a border. */
  const picFaults = [];
  let picPrev = null, picPrevTicks = null, picDrift = 0, picDriftAt = null;
  let picVisMax = 0, picStirred = 0, picApplied = 0, picPrevSum = null;
  let picSafe = null, picSafeSamples = 0, picBandHits = 0;
  let safeWorst = null, sawAccent = false, capMoved = 0, prevSum = null, maxVisible = 0;
  let bubbleWorst = null, bubbleSamples = 0, masBandHits = 0;
  let cam = null, leg = null, legFrom = null, legTo = null;
  let fade = 0, fadeFrom = 0, activeFade = null;
  let tapAt = -99, tapPoint = { x: 0, y: 0 };
  let typedInk = null, steps = [], posts0 = 0, lidMoved = 0;
  const stills = v.beats.map(b => ({
    at: Math.min(b.start + 0.55, SECONDS - 0.05),
    name: String(b.i + 1).padStart(2, '0') + '-' + b.screen + '.png',
  }));
  const shotStill = new Set();
  let nextStill = 0;
  const wall = Date.now();

  posts0 = await page.evaluate(() => window.__stage.win().__dmPosts || 0);

  /* the opening shot, resolved before frame zero so the card has somewhere to be
     the moment it fades in. */
  const resolve = async sp => {
    const a = await page.evaluate(s => window.__stage.rect(s), sp.sel);
    if (!a) return null;
    /* a shot may name two elements, and then the subject is the box that holds
       both of them — the wordmark down to the button, say. it is measured live
       like everything else here, so it is the box the page is actually drawing
       rather than a coordinate this file believes in. */
    let r = a;
    if (sp.to) {
      const b = await page.evaluate(s => window.__stage.rect(s), sp.to);
      if (b) {
        const y0 = Math.min(a.page.y, b.page.y);
        const y1 = Math.max(a.page.y + a.page.h, b.page.y + b.page.h);
        const x0 = Math.min(a.page.x, b.page.x);
        const x1 = Math.max(a.page.x + a.page.w, b.page.x + b.page.w);
        r = { page: { x: x0, y: y0, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 } };
      }
    }
    /* a fit takes the deepest zoom that still holds the element whole, with the
       margin it asked for. it is measured live, so a shot on `.pad` frames the
       card the form is actually showing rather than the one it was showing when
       this file was written.

       **both axes**, and the first pass of this only did width. the lockup is
       328 css px across and about 390 tall, so fitting it on width alone framed
       it at 1.10 and cut the mascot's crown off the top of the card and the hint
       line off the bottom — a shot of the hero with the head cropped, which is
       the one thing a hero shot cannot be. a shot that wants the width only says
       so with `wide`. */
    let z = sp.z;
    if (sp.fit != null) {
      z = (SCREEN.w - 2 * sp.fit) / r.page.w;
      if (!sp.wide) z = Math.min(z, (SCREEN.h - 2 * sp.fit) / r.page.h);
      z = clampTo(z, 1.0, sp.maxZ || ZOOM_CAP);
    }
    /* the clamps, and all three are the page's rule rather than a preference.

       the crop may never show the iframe's own top, where the fixed bar lives.

       it may never run past the bottom of what the iframe rendered.

       and it may not be looking **through** the subline at a zoom that cuts it.
       the subline is the widest line index.html sets; a frame narrower than it,
       with it in shot, cuts its first and last letter, and a cropped THE BORING
       TEK reads as a rendering fault rather than as a crop. so at any zoom that
       cannot hold the subline whole, the frame is pushed down until the subline
       is above it — which is the same answer post9 reached and the reason the
       form shots are framed on the card rather than on the page. */
    const half = SCREEN.h / 2 / z;
    const nav = await page.evaluate(() => window.__stage.navSeen());
    const top = (nav ? nav.bottom : 60) + 6;
    const m = (sp.fit == null ? 10 : sp.fit) / z;
    let cy = sp.align === 'top' ? r.page.y - m + half
      : sp.align === 'bottom' ? r.page.y + r.page.h + m - half
        : r.page.cy;
    cy += sp.dy || 0;
    cy = Math.max(cy, top + half);
    const tag = await page.evaluate(() => window.__stage.rect('.tag-live')
      || window.__stage.rect('.tag'));
    let pushed = false;
    if (tag && tag.page.w > SCREEN.w / z + 0.5) {
      const want = tag.page.y + tag.page.h + 4 + half;
      if (want > cy) { cy = want; pushed = true; }
    }
    /* ---------- and no line of the page is cut in half ----------
       the h1 is THE BORING TEK, stacked in three lines at this width. a frame
       whose top edge lands inside it shows `BORING / TEK` with the first line
       gone, which is the brand name arriving as a fragment — the checklist's own
       item, and worse than the brand being absent. the subline under it is the
       same problem one size down: `BUILDING THE BORING PART OF THE FUTURE` with
       its top half sliced off reads as a broken render.

       so the frame is pushed down past whichever of them its top edge lands
       inside, and it is run twice because clearing the first can land inside the
       second. a shot of the form does not want half a wordmark over it, and this
       is what makes that true at any card height the form ends up with. */
    const cleared = [];
    for (let pass = 0; pass < 2; pass++) {
      for (const sel of ['.hero', '.tag', '.m-zone']) {
        const e = await page.evaluate(s => window.__stage.rect(s), sel);
        if (!e) continue;
        const top = cy - half, bottom = cy + half;
        const y0 = e.page.y, y1 = e.page.y + e.page.h;
        if (y0 < top - 0.5 && y1 > top + 0.5) { cy = y1 + 3 + half; cleared.push(sel); }
        else if (y0 < bottom - 0.5 && y1 > bottom + 0.5) {
          const up = Math.max(half, y0 - 3 - half);
          if (up < cy) { cy = up; cleared.push(sel + ' (below)'); }
        }
      }
    }
    cy = Math.min(cy, Math.max(SITE.h - half, half));
    return {
      cx: SITE.w / 2, cy, z, sel: sp.sel + (sp.to ? '..' + sp.to : ''),
      box: { y: +r.page.y.toFixed(1), w: +r.page.w.toFixed(1), h: +r.page.h.toFixed(1) },
      scroll: await page.evaluate(() => { const w = window.__stage.win(); return w ? [w.scrollX, w.scrollY] : null; }),
      shows: { w: +(SCREEN.w / z).toFixed(1), h: +(SCREEN.h / z).toFixed(1) },
      align: sp.align, pushed, cleared,
    };
  };
  cam = await resolve(site.legs[0].to) || { cx: SITE.w / 2, cy: 300, z: 1 };
  await page.evaluate(c => window.__stage.cam(c.cx, c.cy, c.z), cam);

  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const first = k === 0;

      /* --- the one shot actions --- */
      for (const c of site.cues) {
        if (fired.has(c) || c.t > t) continue;
        fired.add(c);
        if (c.tap) {
          const r = await page.evaluate(s => window.__stage.rect(s), c.tap);
          if (!r) { console.warn('    ! tap target missing: ' + c.tap + ' @' + t.toFixed(2) + 's'); continue; }
          const x = r.screen.cx, y = r.screen.cy;
          const inCard = x > SCREEN.x && x < SCREEN.x + SCREEN.w
            && y > SCREEN.y && y < SCREEN.y + SCREEN.h;
          taps.push({ t: +t.toFixed(3), sel: c.tap, note: c.note,
            at: { x: +x.toFixed(1), y: +y.toFixed(1) }, inCard });
          tapAt = t; tapPoint = { x, y };
          await page.mouse.click(x, y, { delay: 16 });
        } else if (c.key === 'Backspace') {
          await page.keyboard.press('Backspace');
        } else if (c.key !== undefined) {
          await page.keyboard.type(c.key, { delay: 0 });
        } else if (c.call === 'fill') {
          /* the last step, filled the way a person would and through the page's
             own input listeners. nothing is written into the site's state. */
          await page.evaluate(() => window.__stage.call('focus:name'));
          await page.keyboard.type('your business', { delay: 0 });
          await page.evaluate(() => window.__stage.call('focus:email'));
          await page.keyboard.type('you@yourbusiness.com', { delay: 0 });
          await page.evaluate(() => window.__stage.call('blur'));
          calls.push({ t: +t.toFixed(3), what: 'fill', got: 'name and email', note: c.note });
        } else if (c.call) {
          const got = await page.evaluate(w => window.__stage.call(w), c.call);
          calls.push({ t: +t.toFixed(3), what: c.call, got, note: c.note });
        }
      }

      /* --- the camera --- */
      let active = null;
      /* half a frame of tolerance: a leg that starts within half a frame of now
         has started. post9's frame zero fault was exactly this rounding, and it
         only appeared at sixty. */
      for (const l of site.legs) if (t >= l.t0 - 0.5 / FPS) active = l;
      if (active && leg !== active) {
        leg = active;
        legFrom = { ...cam };
        legTo = await resolve(active.to) || { ...cam };
        /* every leg records what its shot actually resolved to, so the run can
           print the framing rather than the intention: the zoom it got, how much
           of the page that shows, and which of the page's own lines the frame
           had to be moved clear of. */
        shots.push({ beat: active.beat || null, anchor: active.anchor || null,
          t: +active.t0.toFixed(2), ease: active.ease,
          z: +legTo.z.toFixed(3), cy: +legTo.cy.toFixed(1), ...legTo,
          cx: undefined });
      }
      if (active) {
        const p = clampTo((t - active.t0) / Math.max(active.t1 - active.t0, 1e-6), 0, 1);
        const e = EASES[active.ease](p);
        cam = { cx: lerp(legFrom.cx, legTo.cx, e), cy: lerp(legFrom.cy, legTo.cy, e),
          z: lerp(legFrom.z, legTo.z, e), sel: legTo.sel };
      }
      await page.evaluate(c => window.__stage.cam(c.cx, c.cy, c.z), cam);
      if (first) camTrail.push({ t: +t.toFixed(2), z: +cam.z.toFixed(4), cy: +cam.cy.toFixed(1) });

      /* --- the card's own opacity ---
         the last fade that has started is the one running, and the value it
         starts from is wherever the card was on the frame it started. taking
         `from` at the moment the fade becomes active rather than at plan time is
         what lets a fade out interrupt a fade in without a step. */
      let fd = null;
      for (const q of site.fades) if (t >= q.t0) fd = q;
      if (fd) {
        if (activeFade !== fd) { activeFade = fd; fadeFrom = fade; }
        fade = lerp(fadeFrom, fd.to, GLIDE(clampTo((t - fd.t0) / Math.max(fd.t1 - fd.t0, 1e-6), 0, 1)));
      }
      await page.evaluate(x => window.__stage.fade(x), fade);

      /* --- the end card --- */
      const endIn = v.beats[13].start - 0.30;
      const endOut = SECONDS;
      const end = t < endIn ? 0 : GLIDE(clampTo((t - endIn) / 0.55, 0, 1));
      await page.evaluate(x => window.__stage.end(x), end);

      /* --- the tap ring --- */
      const since = t - tapAt;
      const ringP = since >= 0 && since < 0.42 ? since / 0.42 : -1;
      await page.evaluate((x, y, p) => window.__stage.ring(x, y, p), tapPoint.x, tapPoint.y, ringP);

      /* --- the captions --- */
      const frame = captionFrame(cap, t);
      const seen = await page.evaluate(fr => {
        window.__cap.apply(fr);
        const acc = window.__stage.accent();
        const vis = [...document.querySelectorAll('.cap-float')]
          .filter(el => getComputedStyle(el).visibility !== 'hidden'
            && parseFloat(getComputedStyle(el).opacity) > 0.02);
        return { vis: vis.length,
          acc: vis.some(g => [...g.querySelectorAll('*')]
            .some(el => getComputedStyle(el).color === acc)) };
      }, frame);
      if (first) {
        if (seen.acc) sawAccent = true;
        maxVisible = Math.max(maxVisible, seen.vis);
        const sum = frame.w.reduce((a, w) => a + w[0] + w[1], 0);
        if (prevSum !== null) capMoved = Math.max(capMoved, Math.abs(sum - prevSum));
        prevSum = sum;
      }

      /* --- the mascot --- */
      await page.evaluate(fr => { window.__mas.apply(fr); window.__stage.mono(); },
        mascotFrame(mas, t));

      /* --- the scene layer ---
         node steps its own copy of the timeline and leaves the frame for the
         rAF loop; the flush below applies it and the page steps its own gsap
         off the same `t`. the two are compared afterwards, which is what makes
         this one motion core with two readers rather than two that look alike.

         the ceilings are checked here, in node, against the numbers the page is
         about to be handed. every part holds a value at every instant of the
         clip, including long before and long after its own steps, so these
         compare unconditionally: there is no "it was invisible, it is allowed to
         have jumped" case, which is exactly the exception a snap would hide in. */
      const picF = sceneFrame(pic, t);
      if (picPrev) {
        for (let i = 0; i < picF.s.length; i++) {
          const a = picPrev.s[i], b = picF.s[i], who = pic.scenes[i].id;
          if (Math.abs(b[0] - a[0]) > SCENE_FADE_LIMIT) picFaults.push({ t, what: 'scene fade', who });
          if (Math.abs(b[1] - a[1]) > SCENE_SCALE_LIMIT) picFaults.push({ t, what: 'scene scale', who });
          if (Math.hypot(b[2] - a[2], b[3] - a[3]) > SCENE_MOVE_LIMIT) picFaults.push({ t, what: 'scene move', who });
        }
        for (let i = 0; i < picF.p.length; i++) {
          const a = picPrev.p[i], b = picF.p[i], who = pic.parts[i].id;
          const d = Math.hypot(b[2] - a[2], b[3] - a[3]);
          if (Math.abs(b[0] - a[0]) > PART_FADE_LIMIT) picFaults.push({ t, what: 'fade', who });
          if (Math.abs(b[1] - a[1]) > PART_SCALE_LIMIT) picFaults.push({ t, what: 'scale', who });
          if (d > PART_MOVE_LIMIT) picFaults.push({ t, what: 'move', who });
          if (Math.abs(b[4] - a[4]) > PART_ROT_LIMIT) picFaults.push({ t, what: 'turn', who });
          if (Math.abs(b[5] - a[5]) > PART_DASH_LIMIT) picFaults.push({ t, what: 'draw', who });
          if (Math.abs(b[6] - a[6]) > PART_LIFT_LIMIT) picFaults.push({ t, what: 'shadow', who });
          /* nothing in these four scenes translates, so movement is not how this
             layer proves it is alive. what it does instead is pop, draw and
             fade, and the sum of every channel is what says so. */
          picStirred = Math.max(picStirred, Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1])
            + Math.abs(b[5] - a[5]) + Math.abs(b[6] - a[6]));
        }
      }
      picPrev = picF;
      await page.evaluate(pf => window.__pic.set(pf), picF);

      /* --- one flush per capture, in both documents --- */
      await page.evaluate(now => window.__stage.tick(now), (SETTLE + idx + 1) * SUBSTEP);

      /* --- and what the page actually applied ---
         three things and only three. the frame that landed is the frame node
         left, exactly one tick happened for this capture, and the channels gsap
         produced in the browser are the channels node produced here. the last of
         those is the parity check. */
      const picLast = await page.evaluate(() => window.__pic.last);
      if (!picLast) picFaults.push({ t, what: 'never ticked', who: 'the rAF shim' });
      else {
        if (picLast.t !== picF.t) picFaults.push({ t, what: 'stale frame', who: 'applied ' + picLast.t });
        if (picPrevTicks !== null && picLast.ticks !== picPrevTicks + 1) {
          picFaults.push({ t, what: 'tick count', who: picLast.ticks + ' after ' + picPrevTicks });
        }
        picPrevTicks = picLast.ticks;
        picVisMax = Math.max(picVisMax, picLast.vis);
        if (picLast.drift > picDrift) { picDrift = picLast.drift; picDriftAt = +t.toFixed(3); }
        if (picPrevSum !== null) picApplied = Math.max(picApplied, Math.abs(picLast.sum - picPrevSum));
        picPrevSum = picLast.sum;
      }

      /* --- the samples, on the frame's own instant --- */
      if (first && f % Math.max(1, Math.round(FPS / 4)) === 0) {
        const s = await page.evaluate(() => ({
          safe: window.__stage.safe(),
          bubble: window.__mas.bubbleSafe(window.__P11.VW, window.__P11.VH),
          band: window.__mas.band(),
          clip: window.__stage.clipCheck(),
          nav: window.__stage.navSeen(),
          lid: window.__stage.siteLid(),
          win: window.__stage.window_(),
          pic: window.__pic.safe(window.__P11.VW, window.__P11.VH),
        }));
        /* ---------- the camera, read back ----------
           node writes a transform and the page renders one, and until the scroll
           above was pinned those two disagreed by a quarter of a page with every
           number in the log saying they agreed. so the window is measured off
           the rendered boxes on every sample and compared against the camera
           that was written. it is the same shape of check `lib/pictograms.mjs`
           runs between its two gsap clocks, and for the same reason: a
           discrepancy nobody measures is a discrepancy nobody finds. */
        if (fade > 0.02 && s.win) {
          const want = cam.cy - SCREEN.h / 2 / cam.z;
          const off = Math.abs(s.win.top - want);
          if (off > 1.5) camFaults.push({ t: +t.toFixed(2), want: +want.toFixed(1), got: s.win.top });
        }
        /* the scene layer measures its own drawn ink, part by part, and it is
           folded into the same safe area answer everything else is judged on.
           `soft` rather than `ink` for the border, because a shadow that leaves
           the frame is as wrong as a shape that does. */
        if (s.pic) {
          picSafeSamples++;
          const near = Math.min(s.pic.softLeft, s.pic.softTop, s.pic.softRight, s.pic.softBottom);
          if (!picSafe || near < picSafe.near) picSafe = { t: +t.toFixed(2), near, ...s.pic };
          if (Math.min(s.pic.left, s.pic.top, s.pic.right, s.pic.bottom)
            < Math.min(s.safe.left, s.safe.top, s.safe.right, s.safe.bottom)) {
            s.safe.worst = s.pic.worst;
          }
          s.safe.left = Math.min(s.safe.left, s.pic.left);
          s.safe.top = Math.min(s.safe.top, s.pic.top);
          s.safe.right = Math.min(s.safe.right, s.pic.right);
          s.safe.bottom = Math.min(s.safe.bottom, s.pic.bottom);
          /* and against the measured caption ink, the same test the card takes,
             because the scene box and the caption band share a frame. */
          if (s.pic.softLow > ceiling.top) picBandHits++;
        }
        safeSamples.push({ t: +t.toFixed(2), ...s.safe });
        if (!safeWorst || Math.min(s.safe.left, s.safe.top, s.safe.right, s.safe.bottom)
          < Math.min(safeWorst.left, safeWorst.top, safeWorst.right, safeWorst.bottom)) {
          safeWorst = { t: +t.toFixed(2), ...s.safe };
        }
        if (s.bubble) {
          bubbleSamples++;
          const near = Math.min(s.bubble.left, s.bubble.top, s.bubble.right, s.bubble.bottom);
          if (!bubbleWorst || near < bubbleWorst.near) bubbleWorst = { t: +t.toFixed(2), near, ...s.bubble };
        }
        if (s.band && s.band.hit) masBandHits++;
        if (fade > 0.02) {
          if (s.clip && s.clip.clipped) clipFaults.push({ t: +t.toFixed(2), ...s.clip });
          if (s.nav && s.nav.seen) navFaults.push({ t: +t.toFixed(2), ...s.nav });
          /* against the **measured** caption ink rather than against the box it
             is laid out in. the box is 220px tall and the caption is anchored to
             its bottom edge, so testing the box would fail on a collision that
             does not exist — the pictogram layer made exactly that mistake once
             and the guard read as a real check for weeks. */
          const bc = await page.evaluate((a, b) => window.__stage.bandClash(a, b),
            ceiling.top, ceiling.bottom);
          if (bc.n) bandHits.push({ t: +t.toFixed(2), over: bc.over });
        }
        if (s.lid != null) {
          if (lidSeen.length && Math.abs(s.lid - lidSeen[lidSeen.length - 1]) > 1e-4) lidMoved++;
          lidSeen.push(s.lid);
        }
      }

      /* the typed line, read back off the field on the frame the hand finishes,
         and the form's own step, sampled at each beat's settled moment. */
      if (first && typedInk === null && t >= site.typing.to && t < site.typing.to + 0.2) {
        typedInk = await page.evaluate(() => window.__stage.typedInk());
      }
      if (first && v.beats.some(b => Math.abs(t - (b.start + 0.3)) < 0.5 / FPS)) {
        steps.push({ t: +t.toFixed(2), ...(await page.evaluate(() => window.__stage.step())) });
      }

      /* ---------- a still per beat ----------
         written **inside** the loop, on the frame it belongs to, because the
         state a still needs is the state the loop is already holding: the
         camera's own position, the card's opacity, the end card, the mascot and
         the caption, all on one clock. re-applying a caption frame after the
         render and shooting that gives fourteen pictures of whatever the last
         frame happened to leave on screen, which is what the first pass of this
         did — every still came back showing the end card. */
      if (first && !shotStill.has(nextStill) && nextStill < stills.length
        && t >= stills[nextStill].at) {
        const png = await cdp.send('Page.captureScreenshot', {
          format: 'png', captureBeyondViewport: false,
          clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
        });
        fs.writeFileSync(path.join(VERIFY, stills[nextStill].name), Buffer.from(png.data, 'base64'));
        /* what the card was looking at on the frame that still was taken, so a
           badly composed shot can be read off numbers rather than guessed at
           from the picture. */
        if (fade > 0.02) {
          const w = await page.evaluate(() => ({
            win: window.__stage.window_(),
            pad: window.__stage.rect('.pad'),
          }));
          framing.push({ still: stills[nextStill].name, cy: +cam.cy.toFixed(1), z: +cam.z.toFixed(3),
            win: w.win, pad: w.pad ? { y: +w.pad.page.y.toFixed(1), h: +w.pad.page.h.toFixed(1) } : null });
        }
        shotStill.add(nextStill);
        nextStill++;
      }

      const shot = await cdp.send('Page.captureScreenshot', {
        format: 'jpeg', quality: 94, captureBeyondViewport: false,
        clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
      });
      const outFile = SUB > 1
        ? path.join(SUBS, 's' + String(idx).padStart(6, '0') + '.jpg')
        : path.join(FRAMES, 'f' + String(f).padStart(6, '0') + '.jpg');
      fs.writeFileSync(outFile, Buffer.from(shot.data, 'base64'));
      await advance(SUBSTEP);
    }
    if (f % 120 === 0) {
      console.log('  ' + String(f).padStart(5) + '/' + N + '  t=' + (f / FPS).toFixed(2) + 's  '
        + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
    }
  }

  const posts = await page.evaluate(() => window.__stage.win().__dmPosts || 0);
  const sent = await page.evaluate(() => window.__stage.step());

  await browser.close();
  srv.close();
  if (SUB > 1) blend(N);

  return {
    built, ceiling, accent, cyr, faces, settle: SETTLE / FPS,
    head: headWorst, safe: safeWorst, safeSamples,
    bubble: bubbleWorst, bubbleSamples, masBandHits,
    taps, calls, camTrail, shots, framing, camFaults, clipFaults, navFaults, bandHits,
    sawAccent, capMoved, maxVisible, typedInk, steps, sent,
    posts: posts - posts0, lidMoved, lidSamples: lidSeen.length,
    pic: {
      faults: picFaults.slice(0, 20), faultCount: picFaults.length,
      drift: picDrift, driftAt: picDriftAt,
      visMax: picVisMax, stirred: +picStirred.toFixed(4), applied: +picApplied.toFixed(4),
      sync: picSync, built: picBuilt,
      safe: picSafe, safeSamples: picSafeSamples, bandHits: picBandHits,
      box: { ...SCREEN },
    },
  };
}

/* ---------- what the run prints ---------- */
function report(state, v, cut, cap, mas, rep, site, cues, sfx, mix, under, after, lim, best, passes, p, SECONDS, joke, pic) {
  const dev = x => Math.round(x * DSF);
  console.log('\nrendered');
  console.log('  ' + p.w + 'x' + p.h + ' @' + p.fps + 'fps  ' + p.seconds.toFixed(2) + 's  '
    + (p.audio ? 'with the read' : 'SILENT') + '  '
    + (fs.statSync(MP4).size / 1e6).toFixed(2) + ' MB'
    + (p.kbps ? ' at ' + (p.kbps / 1000).toFixed(2) + ' Mbit/s' : ''));
  console.log('  the shutter is ' + (BLUR ? 'open, ' + SUB + ' subframes to a frame' : 'closed'));
  console.log('  ' + path.relative(ROOT, MP4) + ', a still per beat in ' + path.relative(ROOT, VERIFY));

  console.log('\n  the crop');
  console.log('    the card is ' + SCREEN.w + 'x' + SCREEN.h + ' css at ' + SCREEN.x + ',' + SCREEN.y
    + ' — ' + dev(SCREEN.x) + ' left, ' + dev(SCREEN.y) + ' top, '
    + dev(VW - SCREEN.x - SCREEN.w) + ' right and ' + dev(VH - SCREEN.y - SCREEN.h)
    + ' bottom in device px, against floors of ' + SAFE.left + '/' + SAFE.top + '/'
    + SAFE.right + '/' + SAFE.bottom);
  console.log('    the site is filmed at ' + SITE.w + 'x' + SITE.h + ' css px, zoom '
    + Math.min(...state.camTrail.map(c => c.z)).toFixed(3) + ' to '
    + Math.max(...state.camTrail.map(c => c.z)).toFixed(3));
  console.log('    the nav was in the card on ' + state.navFaults.length + ' sampled frames, '
    + 'the subline was in it and cut on ' + state.clipFaults.length);
  console.log('    the shots, as they resolved:');
  for (const sh of state.shots) {
    console.log('      beat ' + String(sh.beat).padStart(2) + '  ' + sh.t.toFixed(2) + 's  '
      + sh.ease.padEnd(6) + ' ' + sh.sel.padEnd(22) + ' z ' + sh.z.toFixed(3)
      + ' cy ' + sh.cy.toFixed(0)
      + '  shows ' + sh.shows.w + 'x' + sh.shows.h + ' of a ' + sh.box.w + 'x' + sh.box.h
      + ' box at y ' + sh.box.y + ', ' + sh.align + ', scroll ' + JSON.stringify(sh.scroll)
      + (sh.cleared.length ? '  clear of ' + sh.cleared.join(' ') : '')
      + (sh.pushed ? '  pushed under the subline' : ''));
  }
  console.log('    and what the card was looking at when each still was taken:');
  for (const f of state.framing) {
    console.log('      ' + f.still.padEnd(12) + ' z ' + f.z.toFixed(3) + '  window '
      + f.win.top + '..' + f.win.bottom + ' (node said cy ' + f.cy + ')'
      + (f.pad ? '   the form runs ' + f.pad.y + '..' + (f.pad.y + f.pad.h).toFixed(1) : ''));
  }
  console.log('    the site\'s own mascot blinked: the lid changed on ' + state.lidMoved
    + ' of ' + state.lidSamples + ' samples');
  console.log('    ' + state.taps.length + ' taps, all inside the card: '
    + state.taps.every(t => t.inCard));
  for (const t of state.taps) console.log('      ' + t.t.toFixed(2) + 's  ' + t.note + '  ' + t.sel);
  console.log('    ' + state.calls.length + ' calls into the page:');
  for (const c of state.calls) console.log('      ' + c.t.toFixed(2) + 's  ' + c.what + ' -> ' + c.got);
  if (state.typedInk) {
    console.log('    the typed line reads "' + state.typedInk.text + '" at '
      + state.typedInk.capPx + ' device px of cap');
  }
  console.log('    the form ended on: ' + (state.sent.sent ? 'the check mark' : 'step "' + state.sent.q + '"')
    + ', and ' + state.posts + ' posts were intercepted (nothing left the browser)');

  console.log('\n  the scene layer');
  console.log('    ' + pic.scenes.length + ' scenes, ' + pic.parts.length + ' parts, in the card'
    + ' own box at ' + state.pic.box.x + ',' + state.pic.box.y + ' '
    + state.pic.box.w + 'x' + state.pic.box.h + ' — the same box the site card lands in');
  for (const sc of pic.scenes) {
    console.log('      ' + sc.in.toFixed(2).padStart(6) + '..' + sc.out.toFixed(2)
      + '  ' + sc.id.padEnd(11) + ' settled ' + sc.settled.toFixed(2)
      + ', leaving ' + sc.leaving.toFixed(2)
      + '   ' + sc.parts.map(i => pic.parts[i].id).join(' '));
  }
  console.log('    the handover: the last scene is gone at ' + pic.seconds.toFixed(2)
    + 's and the card starts arriving at ' + site.fades[0].t0.toFixed(2)
    + 's, which is the same frame');
  console.log('    gsap ' + state.pic.built.gsap + ' on the capture clock, worst |gsap t - frame/fps| = '
    + state.pic.sync.worst + 's; worst node against page over the whole clip '
    + state.pic.drift + (state.pic.driftAt == null ? '' : ' at ' + state.pic.driftAt + 's'));
  console.log('    ' + (state.pic.faultCount || 'no') + ' one frame fault(s), at most '
    + state.pic.visMax + ' scene(s) up at once, the layer stirred '
    + state.pic.stirred.toFixed(3) + ' in a frame at its liveliest');
  for (const f of state.pic.faults.slice(0, 5)) {
    console.log('      ! ' + f.t.toFixed(2) + 's  ' + f.what + '  ' + f.who);
  }
  if (state.pic.safe) {
    console.log('    the ink, worst of ' + state.pic.safeSamples + ' samples at ' + state.pic.safe.t
      + 's: ' + Math.round(state.pic.safe.left * DSF) + ' left, ' + Math.round(state.pic.safe.top * DSF)
      + ' top, ' + Math.round(state.pic.safe.right * DSF) + ' right, '
      + Math.round(state.pic.safe.bottom * DSF) + ' bottom in device px'
      + ' (' + state.pic.safe.worst + '), and its shadow reaches '
      + Math.round(state.pic.safe.near * DSF));
    console.log('    the lowest it ever draws is ' + state.pic.safe.softLow
      + ' and the caption ceiling is ' + state.ceiling.top
      + ', so ' + (state.ceiling.top - state.pic.safe.softLow).toFixed(1) + 'px of clear air');
  }

  console.log('\n  the frame');
  console.log('    caption ceiling ' + state.ceiling.top + ', the card ends at '
    + (SCREEN.y + SCREEN.h) + ', clear air ' + (state.ceiling.top - (SCREEN.y + SCREEN.h)).toFixed(1)
    + 'px (floor ' + CARD_CLEARANCE + ')');
  console.log('    safe area, worst of ' + state.safeSamples.length + ' samples at '
    + state.safe.t + 's: ' + dev(state.safe.left) + ' left, ' + dev(state.safe.top) + ' top, '
    + dev(state.safe.right) + ' right, ' + dev(state.safe.bottom) + ' bottom (tightest is '
    + state.safe.worst + ')');
  console.log('    the head, worst of every frame at ' + state.head.t + 's: '
    + state.head.left + ' left, ' + state.head.top + ' top, ' + state.head.right + ' right, '
    + state.head.bottom + ' bottom');
  console.log('    the bubble, worst of ' + state.bubbleSamples + ' samples'
    + (state.bubble ? ' at ' + state.bubble.t + 's: ' + state.bubble.left + ' left, '
      + state.bubble.top + ' top, ' + state.bubble.right + ' right, '
      + state.bubble.bottom + ' bottom' : ': never sampled on screen'));
  console.log('    the caption band was entered by the bubble ' + state.masBandHits
    + ' times and by the card ' + state.bandHits.length);
  console.log('    the accent was painted on a caption: ' + state.sawAccent
    + ' (this clip has no green in it at all)');

  console.log('\n  the type');
  console.log('    the wordmark fits ' + END.wordmarkW + 'px at '
    + state.built.wordmarkPx + 'px, the address ' + END.domW + 'px at ' + state.built.domPx + 'px');
  console.log('    the head rendered at ' + state.built.mas.headPx + ' device px, the bubble caps at '
    + state.built.caps.capPx + ' (floor ' + BUBBLE.minCap + ') and the outline at '
    + state.built.mas.strokePx + ' device px');
  console.log('    cyrillic: ' + state.cyr.note + '. the pill sets it in '
    + (state.cyr.mono ? 'the mono stack' : 'the caption face') + ' — ' + state.cyr.family);
  console.log('      at 100px: "привет" is ' + state.cyr.cyr.sg + ' in space grotesk, '
    + state.cyr.cyr.mono + ' in the mono stack and ' + state.cyr.cyr.none
    + ' in the browser default; the latin control is ' + state.cyr.control.sg
    + ' against ' + state.cyr.control.none + ', so the probe can tell two faces apart');

  console.log('\n  the mascot');
  console.log('    ' + mas.marks.length + ' marks, ' + mas.marks.reduce((a, m) => a + (m.bubbles || []).length, 0)
    + ' bubbles, resting turn ' + mas.bias);
  for (const m of mas.marks) {
    console.log('      ' + m.t.toFixed(2) + 's  ' + m.state.padEnd(12)
      + (m.bubbles || []).map(b => '"' + b.text + '" ' + b.in.toFixed(2)).join('  '));
  }

  console.log('\n  the read');
  console.log('    fourteen takes in the narrator\'s voice, and one that is not: '
    + joke.voice + ' (' + joke.voiceId + ') reads the typed line from '
    + joke.at.from.toFixed(2) + 's to ' + joke.at.to.toFixed(2) + 's, '
    + JOKE.trimDb.toFixed(1) + ' dB under the narrator, over a hand typing from '
    + site.typing.from.toFixed(2) + 's to ' + site.typing.to.toFixed(2) + 's');
  console.log('    it is not captioned, because the words are already on screen in the field');
  for (const x of cut.exceptions) {
    console.log('    the drawn caption is the spoken caption on every line but ' + x.line
      + ', which says "' + x.say.join(' ') + '" and draws "' + x.draw + '" at '
      + x.at + 's, ' + x.hits + ' match');
  }

  console.log('\n  the mix');
  console.log(describeMix(sfx.report, {
    'the read': LINES.length + ' takes, one per line, each with its own rate and pitch',
    'the delivery': v.beats.map(b => b.rate + '/' + b.pitch).join(' '),
    'words a second': Math.min(...v.beats.map(b => b.wps)).toFixed(2) + ' to '
      + Math.max(...v.beats.map(b => b.wps)).toFixed(2) + ' against a flat 2.3',
    'the gaps': v.gaps.map(g => g.toFixed(2)).join(' ') + ' s, measured on the waveform',
    'music': 'none in this pass',
    'the bus under the voice': (-under.worst.db).toFixed(1) + ' dB under at its closest in '
      + under.windows + ' windows a word is being spoken in, and the stricter '
      + 'instantaneous reading is ' + (-under.instant.db).toFixed(1) + ' dB',
    'loudness': after.lufs.toFixed(1) + ' LUFS delivered (target ' + TARGET_LUFS + '), best of '
      + passes.length + ' pass(es) at ' + (best.lift >= 0 ? '+' : '') + best.lift + ' dB',
    'true peak': (after.truePeak == null ? '?' : after.truePeak.toFixed(1))
      + ' dBTP (ceiling ' + PEAK_CEILING + ')',
    'the limiter': lim.reduction.toFixed(1) + ' dB at its hardest, ceiling '
      + best.ceiling.toFixed(2),
  }));
}

/* ---------- the guards ----------
   the shape every clip in here uses: the thing must have happened, it must have
   happened everywhere it was supposed to, and every claim in the log above must
   be a measurement. */
function guard(state, v, cut, cap, mas, rep, site, cues, mix, under, after, lim, p, SECONDS, joke, pic) {
  const fail = [];
  const floor = Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom);

  /* the file */
  if (p.w !== VW * DSF || p.h !== VH * DSF) fail.push('not ' + VW * DSF + 'x' + VH * DSF);
  if (Math.abs(p.fps - FPS) > 0.5) fail.push('not ' + FPS + 'fps');
  if (Math.abs(p.seconds - SECONDS) > 0.25) fail.push(p.seconds + 's, wanted ' + SECONDS.toFixed(2));
  if (!p.audio) fail.push('no audio track — the read did not mux');

  /* the crop, which is the whole framing argument */
  if (state.navFaults.length) {
    fail.push('the site\'s top nav was inside the card on ' + state.navFaults.length
      + ' sampled frames, first at ' + state.navFaults[0].t + 's');
  }
  if (state.clipFaults.length) {
    fail.push('the subline was in the card and cut on ' + state.clipFaults.length
      + ' sampled frames, first at ' + state.clipFaults[0].t + 's');
  }
  if (state.camFaults.length) {
    fail.push('the card rendered a different framing from the one the camera wrote on '
      + state.camFaults.length + ' samples, first at ' + state.camFaults[0].t + 's ('
      + state.camFaults[0].want + ' wanted, ' + state.camFaults[0].got + ' drawn) — '
      + 'something is scrolling under the transform');
  }
  if (!state.taps.length) fail.push('nothing was ever tapped');
  for (const t of state.taps) {
    if (!t.inCard) fail.push('the tap on ' + t.sel + ' at ' + t.t + 's landed outside the card');
  }
  if (state.posts !== 2) {
    fail.push(state.posts + ' posts were intercepted and it has to be exactly 2 — '
      + 'either the send did not happen or something else reached the network');
  }
  if (!state.sent.sent) fail.push('the form never reached its check mark, so the send beat is a lie');
  if (!state.lidMoved) fail.push('the site\'s own mascot never blinked — the capture is a still page');

  /* the frame */
  const clear = state.ceiling.top - (SCREEN.y + SCREEN.h);
  if (clear < CARD_CLEARANCE) {
    fail.push('only ' + clear.toFixed(1) + 'px between the site card and the tallest caption, floor '
      + CARD_CLEARANCE);
  }
  if (state.ceiling.tallest <= 0) fail.push('the caption ceiling measured nothing, so the clearance is against nothing');
  const near = Math.min(state.safe.left, state.safe.top, state.safe.right, state.safe.bottom);
  if (near * DSF < floor - 0.5) {
    fail.push('what we draw comes within ' + Math.round(near * DSF) + ' device px of a border at '
      + state.safe.t + 's (' + state.safe.worst + '), floor is ' + floor);
  }
  if (state.head.near < floor - 0.5) {
    fail.push('the head comes within ' + Math.round(state.head.near) + 'px of a border at '
      + state.head.t + 's, floor is ' + floor);
  }
  if (state.bubble && state.bubble.near < floor - 0.5) {
    fail.push('the bubble comes within ' + Math.round(state.bubble.near) + 'px of a border at '
      + state.bubble.t + 's, floor is ' + floor);
  }
  if (!state.bubbleSamples) fail.push('the bubble was never sampled on screen');
  if (state.masBandHits) fail.push('the bubble entered the caption band ' + state.masBandHits + ' times');
  if (state.bandHits.length) {
    fail.push('the site card overlapped the caption band on ' + state.bandHits.length + ' samples');
  }

  /* the scene layer, and the handover it exists to make clean */
  if (Math.abs(pic.seconds - site.fades[0].t0) > 1e-6) {
    fail.push('the scenes end at ' + pic.seconds.toFixed(3) + 's and the site card starts arriving at '
      + site.fades[0].t0.toFixed(3) + 's — the handover is supposed to be the same frame');
  }
  if (pic.scenes.length !== 4) {
    fail.push(pic.scenes.length + ' scenes, and there is one line each for the four before the card');
  }
  for (const p2 of pic.parts) {
    if (p2.ink === 'accent') fail.push('"' + p2.id + '" is inked accent and this clip has no green in it');
  }
  if (!(Number(state.pic.sync.worst) < 1e-6)) {
    fail.push('the pictogram timeline is ' + state.pic.sync.worst + 's off the capture clock');
  }
  if (!(state.pic.drift < 1e-4)) {
    fail.push('the scene layer node stepped and the one the page stepped disagree by '
      + state.pic.drift + ' at ' + state.pic.driftAt + 's — the two gsap clocks have come apart');
  }
  if (state.pic.faultCount) {
    fail.push(state.pic.faultCount + ' one frame fault(s) in the scene layer, first is "'
      + state.pic.faults[0].what + '" on ' + state.pic.faults[0].who + ' at '
      + state.pic.faults[0].t.toFixed(2) + 's');
  }
  if (state.pic.visMax > 2) fail.push(state.pic.visMax + ' scenes were on screen at once');
  if (!state.pic.safeSamples) fail.push('the scene layer was never sampled on screen');
  if (!state.pic.stirred) fail.push('nothing in the scene layer moved between two frames');
  if (state.pic.bandHits) {
    fail.push('the scene layer reached into the caption band on ' + state.pic.bandHits + ' samples');
  }
  if (state.pic.safe && state.pic.safe.near * DSF < floor - 0.5) {
    fail.push('the scene layer comes within ' + Math.round(state.pic.safe.near * DSF)
      + ' device px of a border at ' + state.pic.safe.t + 's (' + state.pic.safe.worst
      + '), floor is ' + floor);
  }

  /* the captions */
  if (state.sawAccent) fail.push('the accent was painted on a caption and this clip has no green in it');
  if (cap.flashed && cap.flashed.length) fail.push('a word was marked to flash and nothing should be');
  if (state.maxVisible > 1) fail.push(state.maxVisible + ' caption cards were on screen at once');
  if (!state.capMoved) fail.push('the caption never moved between two frames');
  if (cap.tight && cap.tight.late && cap.tight.late.length) {
    fail.push(cap.tight.late.length + ' cards leave before their own last word is said');
  }
  /* the half the cut marks cannot fake: the voice said these words, in this
     order, and the cards are those words with nothing added and nothing lost.

     one line is allowed to differ and it is named. the substitution is applied
     to the **spoken** string here, so the comparison still starts from what came
     out of the synthesiser rather than from what `markLines` decided to draw —
     and the exception has to have fired exactly once, because an exception that
     stopped matching would leave a guard that passes on a caption nobody
     checked. */
  let said = v.words.map(w => bareWord(w.word)).join(' ');
  for (const x of SAY_AS) {
    const run = x.say.join(' ');
    const hit = (cut.exceptions.find(e => e.line === x.line) || {}).hits;
    if (hit !== 1) {
      fail.push('the "' + x.draw + '" exception fired ' + (hit || 0) + ' times on line '
        + x.line + ' and it has to fire exactly once — the line no longer says "'
        + run + '"');
    }
    if (!said.includes(run)) {
      fail.push('the voice never said "' + run + '", so the "' + x.draw
        + '" exception is drawing something nobody read');
      continue;
    }
    said = said.replace(run, x.draw);
  }
  const drawn = cap.cells.map(c => c.word).join(' ');
  if (said !== drawn) {
    fail.push('the drawn caption is not what was spoken — the words diverge at "'
      + drawn.slice(0, 60) + '"');
  }
  /* and no card holds the end of one screen beat and the start of the next,
     which is what the marks are for. */
  for (const g of cap.groups) {
    const a = v.beats.findIndex(b => g.words[0].start >= b.start - 1e-6 && g.words[0].start <= b.end + 1e-6);
    const z = v.beats.findIndex(b => g.words[g.words.length - 1].start >= b.start - 1e-6
      && g.words[g.words.length - 1].start <= b.end + 1e-6);
    if (a !== z) {
      fail.push('card "' + g.words.map(w => w.word).join(' ') + '" straddles lines '
        + (a + 1) + ' and ' + (z + 1));
    }
  }

  /* the cyrillic answer, which the brief asked to be verified rather than
     assumed. the face has to be able to set it and the caps have to clear the
     same floor every other bubble clears. */
  if (!state.cyr.methodWorks) {
    fail.push('the font probe cannot tell two faces apart on a latin control, so its '
      + 'answer about cyrillic means nothing');
  }
  if (state.cyr.setsCyrillic) {
    fail.push('space grotesk now sets cyrillic — the mono fallback is no longer needed '
      + 'and this file should be re-read before it is trusted');
  }
  if (!state.cyr.monoDiffers) {
    fail.push('the mono stack renders "привет" at the browser default width, so no font '
      + 'on this machine is actually setting it');
  }
  if (!state.cyr.mono) fail.push('the cyrillic bubble did not drop to the mono stack');
  if (state.cyr.caps.capPx < BUBBLE.minCap) {
    fail.push('the cyrillic bubble measured ' + state.cyr.caps.capPx
      + ' device px of cap, floor is ' + BUBBLE.minCap);
  }

  /* the comedy read. it is over the typing or it is over nothing, and it is not
     allowed to run past the last keystroke into the beat where the form is being
     finished, because that beat belongs to the taps. */
  if (!joke || !joke.words.length) fail.push('the comedy line has no timings, so it was never laid down');
  else {
    if (joke.voice !== JOKE.voice) fail.push('the comedy line was read by ' + joke.voice);
    if (VOICES[joke.voice] && !VOICES[joke.voice].comedy) {
      fail.push('"' + joke.voice + '" is not marked as a comedy voice, so this line is being read by a narrator');
    }
    if (joke.text !== TYPED.replace(/\s+/g, ' ').trim()) {
      fail.push('the comedy line reads "' + joke.text + '" and the field types "' + TYPED + '"');
    }
    if (joke.at.from < site.typing.from - 0.12) {
      fail.push('the comedy read starts ' + (site.typing.from - joke.at.from).toFixed(2)
        + 's before the first keystroke');
    }
    if (joke.at.to > site.typing.to + 0.20) {
      fail.push('the comedy read runs ' + (joke.at.to - site.typing.to).toFixed(2)
        + 's past the last keystroke, into the beat the form is finished in');
    }
  }

  /* the sound the typing and the send were missing */
  if (site.keys.length < 6) fail.push('only ' + site.keys.length + ' key ticks under the typing');
  if (!cues.some(c => c.kind === 'press')) fail.push('the send tap has no press on it');
  if (!cues.some(c => c.kind === 'ding' && Math.abs(c.t - site.confirmAt) < 1e-6)) {
    fail.push('nothing sounds on the frame the check mark is drawn');
  }

  /* the typed line, and whether anybody can read it */
  if (!state.typedInk) fail.push('the typed line was never read back off the field');
  else {
    if (state.typedInk.text !== TYPED) {
      fail.push('the field holds "' + state.typedInk.text + '" and the script says "' + TYPED + '"');
    }
    /* the floor here is deliberately **not** the caption's 32. that number is
       for one short line read at a glance out of a feed, in the brand's own
       display type, and borrowing it for a form field would be borrowing a
       number from the wrong thing: this is the site's own body text, filmed at
       roughly the size a phone renders it at, and it is legible for exactly the
       reason the site is legible. 18 is where a filmed ui stops reading at all.
       the run prints the real number and the review looks at it. */
    if (state.typedInk.capPx < 18) {
      fail.push('the typed line renders at ' + state.typedInk.capPx
        + ' device px of cap, which is under the 18 a filmed interface needs');
    }
  }

  /* the mascot's own report */
  for (const st of rep.states) {
    if (st.entryFrames == null) fail.push(st.state + ' never reached its own mark');
    else if (st.entryFrames < 3) fail.push(st.state + ' arrives in ' + st.entryFrames + ' frames, which is a cut');
  }
  if (rep.outside.units > 0) {
    fail.push('feature ink lands ' + rep.outside.units.toFixed(2) + ' units outside the head at '
      + rep.outside.at.toFixed(2) + 's');
  }
  if (rep.blinks.repeatsInARow) fail.push(rep.blinks.repeatsInARow + ' blinks repeat the one before them');
  if (rep.frozenFrames) fail.push(rep.frozenFrames + ' frames where the face is not moving at all');
  if (rep.maxSquash > 0.08 + 1e-6) fail.push('the squash reached ' + (rep.maxSquash * 100).toFixed(1) + '%');
  if (rep.maxBreathe >= 0.02) fail.push('breathing reached ' + (rep.maxBreathe * 100).toFixed(2) + '%');

  /* the mix */
  if (!under.windows) fail.push('no window where a word is being spoken, so the bus was never judged');
  if (under.over.length) {
    fail.push(under.over.length + ' windows where the bus is over the voice, first at '
      + under.over[0].t + 's');
  }
  if (!after.ok) fail.push('the loudness meter did not run');
  else {
    if (Math.abs(after.lufs - TARGET_LUFS) > 1.0) {
      fail.push(after.lufs.toFixed(1) + ' LUFS delivered, wanted ' + TARGET_LUFS);
    }
    if (after.truePeak != null && after.truePeak > PEAK_CEILING + 0.1) {
      fail.push('true peak is ' + after.truePeak.toFixed(1) + ' dBTP, ceiling is ' + PEAK_CEILING);
    }
  }
  if (lim.reduction > 9) {
    fail.push('the limiter pulled ' + lim.reduction.toFixed(1)
      + ' dB, which is squashing rather than limiting');
  }

  /* the copy. no dash anywhere a viewer can read one, in any language, and that
     covers the script, the typed line, the bubbles and the end card. */
  const readable = [...LINES.map(l => l.text), TYPED, 'the boring tek', 'theboringtek.com',
    ...SAY_AS.map(x => x.draw),
    ...mas.marks.flatMap(m => (m.bubbles || []).map(b => b.text))];
  for (const s of readable) {
    if (/[—–]/.test(s) || /\s-\s/.test(s)) fail.push('a punctuation dash in: "' + s + '"');
  }
  return fail;
}

main().catch(e => { console.error(e); process.exit(1); });
