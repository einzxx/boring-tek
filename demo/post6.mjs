/* the boring tek — social clip #6, "3 things ai should not do in your business".
   renders out/post6-1080x1920.mp4, with the voice in the file. tooling, not the
   site: nothing here ships, nothing here edits index.html.

   this is the first clip built on the new machine, and it is a different kind of
   clip from the five before it.

   ---------- what is new ----------

   1. **the voice comes first and everything else follows it.** `lib/voice.mjs`
      speaks the script in the default calm voice and hands back the words with
      the synthesiser's own timestamps. those timestamps are the timeline: the
      captions are cut from them, the clip's length is the voice's length plus a
      tail, and the mascot's gaze is keyed against the beats in them. nothing in
      this file types a caption time by hand.

   2. **the captions are the copy.** post2 through post5 all hold a statement at
      the top for the whole clip and use the bubble for the beats. there is no
      statement here and there is no bubble. `lib/captions.mjs` in its `pop`
      style is the text, word by word, in michroma caps, with the word being
      said in the accent.

   3. **the numbers are beats.** `one.` `two.` `three.` are the spine of the
      script and the voice already leaves about seven tenths of a second of air
      around each of them. those three cards are marked `emphasise` in the plan,
      which fits them on their own and draws them accent all the way through, so
      a beat in the writing is a beat on screen. they land at 44px against the
      ordinary cards' 30, which is the brand's hero cap and is not raised for a
      video.

   4. **the audio is in the mp4.** every other clip in demo/ renders `-an`
      because sound is added in the edit. this one carries its own voice,
      because the voice is what the clip is cut against and a silent file cannot
      be checked for sync.

   5. **the mascot is smaller, lower and calmer.** 96px against post5's 136, in
      the lower third rather than the middle, and the gaze is up at the captions
      for most of the clip: he is listening to the advice, not delivering it. the
      furthest he looks is 2.33 units of the page's 6, where post5 went to 5.04.
      thirteen turns in twenty two seconds, all of them slow, and the blinks are
      3.0 to 4.4 seconds apart against post5's 1.45 to 2.60. he comes to the
      viewer once, at 17.95, for `good ai has a human behind it`, and stays there
      for the rest of the clip. that one move is the whole performance.

   6. **there is a pictogram scene layer in the top third.** added after the
      clip was first cut, and it is the one thing in here that changed what the
      frame is. the empty upper half used to be the point; it is now five flat
      svg scenes, drawn in code by `lib/pictograms.mjs`, one per beat of the
      voice, springing in and sliding out on the word timestamps. the layer is
      demo only: nothing about it touches the site. see the scene table below
      for what each one is and what it is keyed to.

   vertical only. there is no square cut: a caption, a head and a wordmark do not
   fit inside a 1080 tall frame with the air each of them needs.

     node post6.mjs                  the clip
     DEMO_FPS=12 node post6.mjs      the fast preview pass
     node post6.mjs --encode-only    re-encode from kept frames
*/

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { speak, VOICE_OUT } from './lib/voice.mjs';
import {
  planCaptions, captionCss, captionMarkup, captionPage, captionFrame,
  describe, brandTokens,
} from './lib/captions.mjs';
import {
  planScenes, sceneFrame, sceneMotion, pictogramCss, pictogramMarkup,
  pictogramPage, describeScenes,
} from './lib/pictograms.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
/* under out/, which is gitignored whole, and in its own folder so a record.mjs
   run cannot wipe it mid flight. */
const FRAMES = path.join(OUT, 'frames-post6');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = 2;

const argv = process.argv.slice(2);
const ONLY_ENCODE = argv.includes('--encode-only');
const KEEP = argv.includes('--keep-frames');

/* ---------- the script ----------
   honest advice, which is the whole angle: it is the only kind of ai post that
   is worth anything from a shop that sells ai. no dashes, and planCaptions
   checks that rather than trusting this comment.

   the numerals are written as words except the `3` in the opening line, which
   is a headline number and reads as one. the three counted items are `one.`
   `two.` `three.` rather than digits, because they are said out loud and a
   digit on screen against a word in the ear is the sort of small wrongness
   nobody can name but everybody feels. */
const SCRIPT = '3 things ai should not do in your business. '
  + 'one. talk money with clients alone. a human checks the deal. '
  + 'two. touch customer data without rules. decide what it can see first. '
  + 'three. work without checking. ai makes mistakes. someone must look. '
  + 'good ai has a human behind it. that is the whole secret.';

/* the cards that get the bigger moment. tested against the card's words as one
   string, so it is the whole card that has to be the beat rather than a word
   inside a longer one. */
const BEAT = /^(one|two|three)\.$/i;
const BEATS_EXPECTED = 3;

/* ---------- the cut ----------
   css px in a 540x960 viewport; device px are double. SAFE is 48, which is the
   96 device px nothing is allowed inside.

   the vertical budget, top to bottom:
      117..303   the pictogram scenes, 310 wide and centred
     ~496..550   the caption, one card at a time, bottom anchored on 550
      654..750   the mascot, 96px, centred
     ~846..862   the wordmark

   the caption is bottom anchored inside its box rather than centred in it, so
   an emphasised card at 44px and an ordinary one at 30px sit on the same
   baseline and grow upward. a card that changed its vertical centre between
   beats would read as the frame jumping.

   the top third used to be empty on purpose, and that note is worth keeping
   rather than deleting: the page is mostly air and the clip was too. the scene
   layer spends it.

   the block sat at 82..268 first and came down 70 device px on a marked frame.
   that move takes it three css px past the caption box's top edge, which sounds
   like a collision and is not: the box is 300..550 and the caption is anchored
   to the *bottom* of it, so no card ever draws above about 496. the box's top
   edge was never where the caption is, and the clearance check used to treat it
   as though it were — see `capCeiling` below for what replaced it. */
const VW = 540, VH = 960, SAFE = 48;
const BOX = { x: SAFE, y: 300, w: VW - SAFE * 2, h: 250 };
/* the scene zone. 310 of 540 is 57.4% of the frame, inside the 55 to 60 the
   sketch asked for, and it is centred, so the block sits on the same axis as
   the caption, the head and the wordmark. one viewBox unit is 3.1 css px and
   6.2 device px, which is what makes a 1.2 unit stroke a confident 7px line at
   1080 rather than a hairline. */
const SCENE_BOX = { x: 115, y: 117, w: 310, h: 186 };
/* how much clear air the scene layer owes the caption below it. measured on the
   lowest drawn pictogram ink against the highest a caption can ever reach, on
   every frame a part is moving, rather than worked out from the two boxes. */
const SCENE_CLEARANCE = 40;
const MASCOT = 96, MASCOT_TOP = 654;
const WORDMARK_CY = 854, WORDMARK_W = 250;
/* how much clear air the caption owes the head. the caption is the thing that
   moves, so this is checked against the drawn card on every sample rather than
   assumed from the box. */
const HEAD_CLEARANCE = 60;
/* the clip runs on past the last word, so it does not cut on a full stop. the
   mascot is still moving and still blinking through all of it. */
const TAIL = 0.65;

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- easing ----------
   post5's solver, so the clip moves on the curves the site moves on. */
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
const EASE_OUT = bezier(.22, 1, .36, 1);
const EASE_IO = bezier(.45, 0, .55, 1);      /* gaze turns, calm at both ends */
const lerp = (a, b, p) => a + (b - a) * p;
const span = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));

/* ---------- the eye choreography ----------
   the brief is an advisor listening to advice, so the gaze is steady and the
   one move that matters is the last one.

   he is *below* the captions in this frame, so up is negative --ey and he
   spends most of the clip there, reading. the three number beats each get a
   small lift to the highest point he uses, arriving a tenth of a second before
   the word lands. between them he comes down a little, which reads as
   considering rather than as looking away.

   at 17.95, on `good ai has a human behind it`, he leaves the captions and
   comes to the viewer, and he stays there to the end. that is the only time in
   twenty two seconds he looks at the person watching, which is what makes it
   land. deadpan, no reaction, no widening: the line is the reaction.

   every key is [second, units], eased with EASE_IO, and a repeated value is a
   deliberate hold. the two tracks share their key times so a turn is one
   movement rather than two on different clocks.

   the site's own clamps are EX=6 and EY=3.8. the furthest this clip goes is
   2.33 combined, against post5's 5.04, and no turn is faster than 2.22 units in
   0.65s. that is the calm the brief asked for, in numbers. */
const EYE_KEYS = [
  [0.00, 0.0], [0.95, 0.0],       /* up at the words from frame zero */
  [1.60, -1.2], [2.40, -1.2],     /* a small drift, reading across */
  [3.05, 0.4], [4.15, 0.4],       /* up to "one." at 3.14, and holds the beat */
  [4.85, 1.3], [5.85, 1.3],
  [6.50, -0.9], [6.90, -0.9],
  [7.45, 0.4], [8.65, 0.4],       /* up to "two." at 7.53 */
  [9.35, -1.4], [10.55, -1.4],
  [11.25, 1.1], [12.10, 1.1],
  [12.72, 0.4], [13.95, 0.4],     /* up to "three." at 12.81 */
  [14.65, -1.1], [16.00, -1.1],
  [16.70, 0.9], [17.35, 0.9],
  [17.95, 0.0], [20.05, 0.0],     /* comes to the viewer, and stays */
  [20.65, 0.0], [21.70, 0.0],
  [22.20, -0.6],                  /* still moving when the file ends */
];
const EYE_Y_KEYS = [
  [0.00, -1.6], [0.95, -1.6],
  [1.60, -1.9], [2.40, -1.9],
  [3.05, -2.3], [4.15, -2.3],     /* the highest he looks, and only on a beat */
  [4.85, -1.5], [5.85, -1.5],
  [6.50, -1.8], [6.90, -1.8],
  [7.45, -2.3], [8.65, -2.3],
  [9.35, -1.4], [10.55, -1.4],    /* down a little: considering */
  [11.25, -1.9], [12.10, -1.9],
  [12.72, -2.3], [13.95, -2.3],
  [14.65, -1.6], [16.00, -1.6],
  [16.70, -1.8], [17.35, -1.8],
  [17.95, -0.5], [20.05, -0.5],   /* level with the viewer */
  [20.65, -0.15], [21.70, -0.15],
  [22.20, -0.6],
];
if (EYE_KEYS.length !== EYE_Y_KEYS.length
  || EYE_KEYS.some((k, i) => k[0] !== EYE_Y_KEYS[i][0])) {
  throw new Error('the two eye tracks do not share their key times');
}
const EYE_MAX = Math.max(...EYE_KEYS.map((k, i) => Math.hypot(k[1], EYE_Y_KEYS[i][1])));
if (EYE_MAX > 6) throw new Error('an eye key travels ' + EYE_MAX.toFixed(2)
  + ' units, past the page\'s own cap of 6');
/* the vertical is checked on its own too, because the combined cap can be
   satisfied by a value that is still past what the page allows on one axis. */
const EYE_Y_MAX = Math.max(...EYE_Y_KEYS.map(k => Math.abs(k[1])));
if (EYE_Y_MAX > 3.8) throw new Error('an eye key travels ' + EYE_Y_MAX.toFixed(2)
  + ' units vertically, past the page\'s own cap of 3.8');

/* ---------- the blinks ----------
   seeded, so the rhythm is uneven the way a real one is and identical on every
   run. this is post6's own seed and a much slower cadence than post5's: 3.0 to
   4.4 seconds apart against 1.45 to 2.60, because a mascot listening to advice
   blinks like someone concentrating rather than someone searching a room.
   doubles are rare rather than common, for the same reason. */
function prng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function blinkList(seconds) {
  const rnd = prng(0x6b1f30d);
  const out = [];
  let t = 1.10;
  while (t < seconds - 0.35) {
    out.push(t);
    /* a double now and then, so the rhythm is not a metronome. the second lid
       lands 120ms later, which is what a real double blink measures. */
    if (rnd() < 0.12) { const d = t + 0.12; if (d < seconds - 0.35) out.push(d); }
    t += 3.0 + rnd() * 1.4;
  }
  return out;
}

/* the page's own lid: eases shut, holds a beat, eases back open. copied rather
   than reached for, because it lives in index.html's closure. */
function lidAt(ms) {
  const LID = .06, CLOSE = 95, HOLD = 45, OPEN = 140;
  if (ms < 0) return 1;
  if (ms < CLOSE) { const p = ms / CLOSE; return 1 - (1 - LID) * p * p; }
  if (ms < CLOSE + HOLD) return LID;
  const q = (ms - CLOSE - HOLD) / OPEN;
  if (q >= 1) return 1;
  return LID + (1 - LID) * (1 - (1 - q) * (1 - q));
}
function blinkFrom(list, t) {
  let v = 1;
  for (const b of list) v = Math.min(v, lidAt((t - b) * 1000));
  return v;
}
function keyAt(keys, t, ease) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i], [t0, v0] = keys[i - 1];
    if (t <= t1) return lerp(v0, v1, (ease || EASE_OUT)(span(t, t0, t1)));
  }
  return keys[keys.length - 1][1];
}

/* the reel's guards, frame rate relative so they stay meaningful at 60 and
   clamp out of the way under DEMO_FPS=12. */
const BLINK_LIMIT = Math.min(0.95, 3.4 * 0.94 * STEP / 95);
const GAZE_LIMIT = 1.2 * STEP / 16.6667;

/* ---------- the pictogram scenes ----------
   five scenes, one per beat of the voice, in the block above the caption.

   the handoffs are the gaps the reading already leaves. the script counts out
   loud and the synthesiser puts about half a second of air around each numeral,
   so the scene changes land in silence rather than under a word:

     business. ends 2.68   one. starts 3.14   handoff 2.91
     deal.     ends 7.07   two. starts 7.53   handoff 7.30
     first.    ends 12.34  three. starts 12.81  handoff 12.58
     look.     ends 17.42  good starts 17.87   handoff 17.65

   each scene leaves 0.15s after its handoff and the next arrives 0.15s before
   it, so there is a 0.30s crossfade in the middle of the silence: the old scene
   is on its way out while the new one springs in, and the zone is never empty
   between two beats. `planScenes` refuses an overlap past 0.45s and refuses
   three scenes at once, because both of those are dissolves rather than cuts.

   inside a scene, every part is keyed to a word rather than to a count from the
   scene's own start. that is the whole reason this reads as synced: the coin
   lands on `alone.`, the shackle closes on `rules.`, the x turns into a check
   on `must`, and if the script is re-read by a different voice the numbers all
   move together because they all come from the same array.

   the composition rule, and it was learnt off the first render rather than
   decided in advance: **the subject of a scene is centred and everything else
   is a satellite.** the money scene first drew a document at x 14 and a person
   at x 76, which balances beautifully once both are there and reads as broken
   alignment for the two and a half seconds while only the document is. so the
   document, the folder and the page each sit on the block's own axis and the
   person, the lock and the eye hang off them. the optical centre lands near 50
   either way and no scene is ever visibly off axis while it is still building.

   the ink is the page's own and it is rationed. one accent per scene, on the
   one thing the scene is about: the check in the money scene, the lock in the
   data scene, the check in the checking scene, the two marks in the closing
   one. --red appears exactly once, on the x, and it is the site's own error
   colour meaning the site's own thing — something is wrong — for eight tenths
   of a second before it becomes a check. the lines inside a sheet are --muted
   because they are texture, not content. everything else is --fg. */
const SCENES = [
  /* 1. the list waiting. three empty squares, one per thing the clip is about
     to count out, arriving on the rhythm of the opening line rather than on the
     three words that name them: nothing has been said yet, so nothing is in the
     boxes yet. */
  {
    id: 'intro', in: 0.10, out: 3.06, exit: 'slideUp',
    parts: [
      { id: 'box-one', shape: 'square', at: { cx: 24, cy: 30, s: 18 }, steps: { kind: 'pop', t: 0.30 } },
      { id: 'box-two', shape: 'square', at: { cx: 50, cy: 30, s: 18 }, steps: { kind: 'pop', t: 1.14 } },
      { id: 'box-three', shape: 'square', at: { cx: 76, cy: 30, s: 18 }, steps: { kind: 'pop', t: 1.98 } },
    ],
  },
  /* 2. the money beat. "talk money with clients alone. a human checks the
     deal." a document, a signature drawn across it, a coin dropping onto it,
     and then the person who has to look at it before it counts. */
  {
    id: 'money', in: 2.76, out: 7.45, exit: 'springOut',
    parts: [
      { id: 'sheet', shape: 'sheet', at: { x: 23, y: 3, w: 44, h: 54 }, steps: { kind: 'pop', t: 3.20 } },
      { id: 'sheet-l1', shape: 'rule', ink: 'muted', w: 0.9, at: { x1: 30, x2: 61, y: 13 }, steps: { kind: 'draw', t: 3.55, for: 0.42 } },
      { id: 'sheet-l2', shape: 'rule', ink: 'muted', w: 0.9, at: { x1: 30, x2: 56, y: 20 }, steps: { kind: 'draw', t: 3.72, for: 0.42 } },
      /* on "money", which is the word the whole card is about. */
      { id: 'signature', shape: 'squiggle', w: 1.1, at: { x1: 30, x2: 61, y: 30, a: 3.0 }, steps: { kind: 'draw', t: 4.14, for: 0.66 } },
      /* on "alone." — it falls, it does not pop, and FALL lands it soft rather
         than bouncing it. it starts inside the zone, never above it, so it is
         never half a coin clipped on the block's top edge, and it lands inside
         the sheet rather than across its border: a circle sitting exactly on an
         edge reads as a badge stuck to a corner, not as a thing that landed. */
      { id: 'coin', shape: 'coin', at: { cx: 45, cy: 46, r: 7 }, steps: { kind: 'move', t: 5.03, for: 0.52, fade: 0.22, from: [0, -38], ease: 'fall' } },
      { id: 'person', shape: 'human', at: { cx: 82, cy: 17, r: 6, sw: 17, sh: 11 }, steps: { kind: 'pop', t: 5.98 } },
      { id: 'person-ok', shape: 'check', ink: 'accent', w: 1.5, at: { cx: 82, cy: 45, s: 12 }, steps: { kind: 'draw', t: 6.34, for: 0.54 } },
    ],
  },
  /* 3. the data beat. "touch customer data without rules. decide what it can
     see first." a folder, a lock that arrives and then shuts, and an eye that
     gets a line through it. the shackle is two steps on one part: it draws
     while it is still raised, then seats. that second step is 1.8 units over
     0.16s and it is the whole difference between a lock appearing and a lock
     closing. */
  {
    id: 'data', in: 7.15, out: 12.73, exit: 'slideUp',
    parts: [
      { id: 'folder', shape: 'folder', at: { x: 22, y: 14, w: 44, h: 34 }, steps: { kind: 'pop', t: 7.60 } },
      { id: 'folder-l1', shape: 'rule', ink: 'muted', w: 0.9, at: { x1: 29, x2: 56, y: 27 }, steps: { kind: 'draw', t: 8.22, for: 0.44 } },
      { id: 'folder-l2', shape: 'rule', ink: 'muted', w: 0.9, at: { x1: 29, x2: 50, y: 35 }, steps: { kind: 'draw', t: 8.42, for: 0.44 } },
      { id: 'lock', shape: 'lockBody', ink: 'accent', at: { cx: 66, cy: 44, w: 17, h: 14 }, steps: { kind: 'pop', t: 9.38 } },
      {
        id: 'shackle', shape: 'shackle', ink: 'accent',
        at: { cx: 66, cy: 37, r: 5.4 },
        steps: [
          { kind: 'draw', t: 9.85, for: 0.45 },
          { kind: 'move', t: 10.30, for: 0.16, from: [0, -1.8], fadeIn: false },
        ],
      },
      { id: 'eye', shape: 'eye', at: { cx: 80, cy: 17, w: 22, h: 9, pr: 2.8 }, steps: { kind: 'pop', t: 10.79 } },
      /* on "see". */
      { id: 'eye-slash', shape: 'stroke', w: 1.3, at: { x1: 71, y1: 26, x2: 89, y2: 8 }, steps: { kind: 'draw', t: 11.48, for: 0.56 } },
    ],
  },
  /* 4. the checking beat. "work without checking. ai makes mistakes. someone
     must look." a page of work, a glass sweeping across it, a mistake, and then
     the mistake corrected.

     the x and the check are two moments of the same object and they are drawn
     as three parts: the x is two strokes so each one draws in turn rather than
     appearing as a finished cross, and the check is its own part so the two can
     cross over. the x turns and shrinks away while the check turns in from the
     other side, which is a flip without ever passing through zero width — a
     shape that flattened to a line for one frame is exactly the snap the guards
     are here to catch. */
  {
    id: 'checking', in: 12.43, out: 17.80, exit: 'springOut',
    parts: [
      { id: 'paper', shape: 'sheet', at: { x: 24, y: 3, w: 48, h: 54 }, steps: { kind: 'pop', t: 12.88 } },
      { id: 'paper-l1', shape: 'rule', ink: 'muted', w: 0.9, at: { x1: 31, x2: 66, y: 13 }, steps: { kind: 'draw', t: 13.53, for: 0.42 } },
      { id: 'paper-l2', shape: 'rule', ink: 'muted', w: 0.9, at: { x1: 31, x2: 60, y: 22 }, steps: { kind: 'draw', t: 13.68, for: 0.42 } },
      { id: 'paper-l3', shape: 'rule', ink: 'muted', w: 0.9, at: { x1: 31, x2: 50, y: 31 }, steps: { kind: 'draw', t: 13.83, for: 0.42 } },
      { id: 'paper-l4', shape: 'rule', ink: 'muted', w: 0.9, at: { x1: 31, x2: 63, y: 40 }, steps: { kind: 'draw', t: 13.98, for: 0.42 } },
      {
        id: 'glass', shape: 'magnifier',
        at: { cx: 57, cy: 31, r: 13.5, hl: 9 },
        steps: [
          { kind: 'pop', t: 14.10 },
          /* the sweep. 30 units over 0.90s on the calm curve, which is slow
             enough to read as looking rather than as scanning. */
          { kind: 'move', t: 14.30, for: 0.90, from: [-30, 0], fadeIn: false },
        ],
      },
      {
        id: 'x-down', shape: 'stroke', ink: 'red', w: 1.4,
        at: { x1: 53, y1: 27, x2: 61, y2: 35 },
        steps: [{ kind: 'draw', t: 15.49, for: 0.34 }, { kind: 'flip', t: 16.86, for: 0.36, dir: 'out', rot: -70 }],
      },
      {
        id: 'x-up', shape: 'stroke', ink: 'red', w: 1.4,
        at: { x1: 61, y1: 27, x2: 53, y2: 35 },
        steps: [{ kind: 'draw', t: 15.66, for: 0.34 }, { kind: 'flip', t: 16.86, for: 0.36, dir: 'out', rot: -70 }],
      },
      { id: 'fixed', shape: 'check', ink: 'accent', w: 1.5, at: { cx: 57, cy: 31, s: 13.5 }, steps: { kind: 'flip', t: 16.94, for: 0.40, dir: 'in', rot: 70 } },
    ],
  },
  /* 5. the close. "good ai has a human behind it. that is the whole secret."
     the mascot and a person, side by side, joined, both signed off. it holds to
     the last frame: the clip ends on it rather than cutting away from it.

     the small face is drawn from the ratios in the skill file, not by eye, and
     it blinks on the same lid as the real mascot 400px below it, because two
     faces on one screen must not disagree about that. the real one comes to the
     viewer at 17.95 — four hundredths after this face springs in, which was not
     planned and is kept: he looks at you at the moment his own picture appears
     in the diagram. */
  {
    id: 'close', in: 17.50, out: 22.20,
    parts: [
      { id: 'mascot-glyph', shape: 'mascotFace', ink: 'face', at: { cx: 28, cy: 23, r: 12 }, steps: { kind: 'pop', t: 17.94, for: 0.36 } },
      { id: 'person', shape: 'human', at: { cx: 73, cy: 17, r: 7.5, sw: 21, sh: 12 }, steps: { kind: 'pop', t: 18.68, for: 0.36 } },
      /* on "behind", which is the word the line turns on. */
      { id: 'bond', shape: 'stroke', w: 1.2, at: { x1: 45.5, y1: 26, x2: 60.5, y2: 26 }, steps: { kind: 'draw', t: 19.01, for: 0.54 } },
      { id: 'mascot-ok', shape: 'check', ink: 'accent', w: 1.5, at: { cx: 28, cy: 48, s: 13 }, steps: { kind: 'draw', t: 20.34, for: 0.50 } },
      { id: 'person-ok', shape: 'check', ink: 'accent', w: 1.5, at: { cx: 73, cy: 48, s: 13 }, steps: { kind: 'draw', t: 20.60, for: 0.52 } },
    ],
  },
];

/* the scene layer's own guards, the eye guards extended to the pictograms and
   frame rate relative for the same reason: a limit written in units per frame
   is a different limit at 12fps and at 60, and the preview pass must not fail
   on being a preview.

   every one of these is a ceiling on a *single frame's* change, which is the
   only kind of number that can tell a fast move from a snap. they are set with
   real headroom over what the scenes actually do — `sceneMotion` prints both,
   before the render, so the gap between the limit and the truth is on screen
   rather than in a comment. */
const R = STEP / 16.6667;
const PART_MOVE_LIMIT = 4.5 * R;      /* viewBox units. the coin is the loudest */
const PART_SCALE_LIMIT = 0.14 * R;
const PART_ROT_LIMIT = 10 * R;        /* degrees. the flip is the only rotation */
const PART_DASH_LIMIT = 0.12 * R;     /* fraction of a path, per frame */
const PART_FADE_LIMIT = 0.20 * R;
const SCENE_MOVE_LIMIT = 3.0 * R;
const SCENE_SCALE_LIMIT = 0.06 * R;
const SCENE_FADE_LIMIT = 0.20 * R;

/* ---------- the scene ----------
   the site's own mascot, read from source, exactly as post5 reads it. */
function mascotBody() {
  const svg = fs.readFileSync(path.join(ROOT, 'assets', 'mascot.svg'), 'utf8');
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '').trim();
  if (!inner.includes('fill="#f4f7f5"') || !inner.includes('fill="#06070a"'))
    throw new Error('mascot.svg is not the dark colourway any more');
  if ((inner.match(/<circle/g) || []).length !== 1 || (inner.match(/<rect/g) || []).length !== 2)
    throw new Error('mascot.svg is not one circle and two eyes any more');
  /* the standalone file is one circle and two loose rects. the page wraps the
     rects in a <g class="m-eyes"> and travels the group, leaving the blink on
     each rect: two nested transforms, deliberately, so the blink cannot lag the
     gaze. rebuild that here or nothing can move the eyes at all. */
  const face = inner.match(/<circle[\s\S]*?\/>/)[0]
    .replace('<circle', '<circle class="m-face"')
    .replace(/fill="#f4f7f5"/, 'fill="var(--face)"');
  const eyes = inner.match(/<rect[\s\S]*?\/>/g).map(r => r
    .replace('<rect', '<rect class="m-eye"')
    .replace(/fill="#06070a"/, 'fill="var(--eye)"'));
  return [face, '<g class="m-eyes">', ...eyes, '</g>'].join('\n      ');
}

function sceneHtml(plan, pic) {
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<title>post6</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500&display=swap">
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}
${captionCss(plan, BOX)}
${pictogramCss(pic, SCENE_BOX)}
/* the vignette, at its light value, breathing on the site's own 34s loop. no
   grain: every platform recompresses a clip and grain through that is noise
   rather than texture.

   the breathe is load bearing, not decoration. with nothing animating at all
   chrome stops producing compositor frames and Page.captureScreenshot blocks on
   a frame that never comes. post2.mjs found this and every clip since has
   carried the fix. */
.vignette{position:fixed;inset:-10%;background-image:var(--vig);pointer-events:none;z-index:0;
  will-change:transform,opacity;
  animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{
  from{transform:scale(1) translate3d(0,0,0);opacity:.88}
  to{transform:scale(1.045) translate3d(0,-1.2%,0);opacity:1}
}
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1}

/* the mascot, in the lower third. --ex/--ey/--blink are written per frame by
   the recorder, exactly as the reel writes the hero's. */
.m-zone{position:absolute;left:50%;top:${MASCOT_TOP}px;transform:translateX(-50%);
  display:block;width:max-content}
.mascot{position:relative;display:block;width:${MASCOT}px;height:auto}
.m-face{fill:var(--face)}
.m-eyes{transform:translate(calc(var(--ex,0) * 1px),calc(var(--ey,0) * 1px))}
.m-eye{fill:var(--eye);transform-box:fill-box;transform-origin:center;
  transform:scaleY(calc(var(--blink,1) * var(--wide,1)))}

/* the wordmark, present for the whole clip. michroma caps, tracked wide and
   dim: the lockup subline's treatment, which is the one place the brand allows
   michroma at a small size. */
.wordmark{
  position:absolute;left:50%;top:${WORDMARK_CY}px;transform:translate(-50%,-50%);
  font-family:var(--display);font-weight:400;color:var(--muted);
  text-transform:uppercase;letter-spacing:.18em;white-space:nowrap;line-height:1;
  /* letter-spacing is added after every glyph including the last, so the box is
     one full space wider than the ink and the ink sits half a space left of the
     box centre. shifting by half the tracking is what actually centres it. */
  text-indent:.09em;
}
</style>
</head>
<body>
<div class="vignette"></div>
<div class="stage">
  <div class="wordmark" id="wordmark">the boring tek</div>
  <span id="accent-probe" style="position:absolute;left:-999px;color:var(--accent)">a</span>
  <div class="m-zone">
    <svg class="mascot" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      ${mascotBody()}
    </svg>
  </div>
${pictogramMarkup(pic)}
${captionMarkup(plan)}
</div>
<script>
window.__CAP_PLAN = ${JSON.stringify(plan)};
window.__CAP_BOX = ${JSON.stringify(BOX)};
${captionPage.toString()}
captionPage();
/* the scene layer's plan carries no svg strings: the markup is already in the
   document and the page half only ever needs the origins, the inks and which
   parts are line drawn. */
window.__PIC_PLAN = ${JSON.stringify({
    origin: pic.origin,
    parts: pic.parts.map(p => ({ id: p.id, o: p.o, draw: p.draw })),
  })};
${pictogramPage.toString()}
pictogramPage();
window.__P6 = ${JSON.stringify({ VW, VH, WORDMARK_W })};
${scenePage.toString()}
scenePage();
</script>
</body>
</html>`;
}

/* ---------- the scene's own script ----------
   serialised into the page. the caption half is captions.mjs's; this is the
   mascot, the wordmark fit, and the measurements that are about the whole frame
   rather than about the captions alone. */
function scenePage() {
  /* the highest any caption in this clip can ever reach, measured once.

     the clearance check used to floor at the caption box's own top edge
     whenever no card happened to be on screen, and that was wrong in a way that
     only showed up once the scene block came down past it. the box is 300..550
     and the caption is anchored to the *bottom* of it, so the top edge is 200px
     above anything that is ever drawn — as a floor it guarded against nothing,
     and the moment the scenes crossed it, it started failing on a collision
     that does not exist.

     this is the real ceiling: the tallest card there is, grown about its own
     baseline by the biggest scale the entrance spring takes it to. it does not
     depend on which card is up, so the scene layer is checked against the worst
     caption in the whole clip on every frame rather than against whichever one
     happens to be visible — which is the stricter test, and the one that keeps
     meaning something on a frame with no caption at all. */
  function capCeiling() {
    const bottom = window.__CAP_BOX.y + window.__CAP_BOX.h;
    const scale = window.__CAP_PLAN.maxScale || 1;
    let tallest = 0;
    for (const el of document.querySelectorAll('.cap-card,.cap-type,.cap-count')) {
      tallest = Math.max(tallest, el.getBoundingClientRect().height);
    }
    if (!tallest) throw new Error('no caption card had a height — capCeiling would be the box');
    return +(bottom - tallest * scale).toFixed(1);
  }

  function fitWordmark() {
    const el = document.getElementById('wordmark');
    const s = el.textContent.toUpperCase();
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = '400 100px Michroma';
    /* measured rendered, in caps, because text-transform is invisible to
       measureText and costs michroma about 15% of its width. */
    const em = (cv.measureText(s).width + 0.18 * 100 * s.length) / 100;
    el.style.fontSize = (window.__P6.WORDMARK_W / em).toFixed(3) + 'px';
  }

  window.__p6 = {
    ready: false,
    /* the mascot's idle, and the proof of it in one call. written after the
       caption is applied so these are the values that render, and read back
       from computed style so what is asserted is what was drawn. */
    life(ex, ey, blink) {
      const m = document.querySelector('.mascot');
      const g = document.querySelector('.m-eyes'), e = document.querySelector('.m-eye');
      if (!m || !g || !e) return ['gone', '', 1];
      m.style.setProperty('--ex', ex.toFixed(3));
      m.style.setProperty('--ey', ey.toFixed(3));
      m.style.setProperty('--blink', blink.toFixed(4));
      const cs = getComputedStyle(e);
      return [getComputedStyle(g).transform,
        cs.getPropertyValue('--wide').trim() || '1',
        parseFloat(cs.getPropertyValue('--blink')) || 1];
    },
    /* the whole frame's safe area, not just the caption's. captions.mjs measures
       its own ink and knows nothing about a mascot or a wordmark, so the two are
       unioned here and the worse of them is what the guard runs against. */
    safe() {
      const cap = window.__cap.safe(window.__P6.VW, window.__P6.VH);
      let out = { ...cap };
      /* the pictograms measure their own drawn ink, part by part, exactly as
         the caption does — the svg element is the whole block and its rect
         would report the block back to us and prove nothing about the shapes
         inside it. */
      const pic = window.__pic.safe(window.__P6.VW, window.__P6.VH);
      if (pic) {
        if (Math.min(pic.left, pic.top, pic.right, pic.bottom)
          < Math.min(out.left, out.top, out.right, out.bottom)) out.worst = pic.worst;
        out.left = Math.min(out.left, pic.left);
        out.top = Math.min(out.top, pic.top);
        out.right = Math.min(out.right, pic.right);
        out.bottom = Math.min(out.bottom, pic.bottom);
      }
      for (const sel of ['.mascot', '#wordmark']) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const b = el.getBoundingClientRect();
        if (!b.width && !b.height) continue;
        const d = {
          left: b.left, top: b.top,
          right: window.__P6.VW - b.right, bottom: window.__P6.VH - b.bottom,
        };
        if (Math.min(d.left, d.top, d.right, d.bottom)
          < Math.min(out.left, out.top, out.right, out.bottom)) out.worst = sel;
        out.left = Math.min(out.left, d.left);
        out.top = Math.min(out.top, d.top);
        out.right = Math.min(out.right, d.right);
        out.bottom = Math.min(out.bottom, d.bottom);
      }
      return out;
    },
    /* how much clear air there is between the lowest visible caption ink and the
       top of the head. the caption is the thing that changes size between an
       ordinary card and a beat, so this is measured on the drawn card rather
       than worked out from the box it was told to live in. */
    clearance() {
      const head = document.querySelector('.mascot').getBoundingClientRect();
      let lowest = -1e9, which = null;
      for (const el of document.querySelectorAll('.cap-w')) {
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden') continue;
        let o = 1, node = el;
        while (node && node !== document.body) { o *= parseFloat(getComputedStyle(node).opacity || '1'); node = node.parentElement; }
        if (o < 0.02) continue;
        const b = el.getBoundingClientRect();
        if (b.bottom > lowest) { lowest = b.bottom; which = el.textContent; }
      }
      return lowest === -1e9 ? null : { gap: +(head.top - lowest).toFixed(1), which };
    },
    /* how much clear air there is between the lowest visible pictogram ink and
       the highest visible caption ink, plus how close the layer came to a
       border on the same frame. both are measured on drawn shapes: a part that
       is mid sweep or mid fall is somewhere its own box never said it would be,
       which is the only interesting case. */
    zone() {
      const pic = window.__pic.safe(window.__P6.VW, window.__P6.VH);
      if (!pic) return null;
      let top = 1e9, which = null;
      for (const el of document.querySelectorAll('.cap-w')) {
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden') continue;
        let o = 1, node = el;
        while (node && node !== document.body) { o *= parseFloat(getComputedStyle(node).opacity || '1'); node = node.parentElement; }
        if (o < 0.02) continue;
        const b = el.getBoundingClientRect();
        if (b.top < top) { top = b.top; which = el.textContent; }
      }
      return {
        low: pic.low, lowest: pic.lowest,
        /* the guard, and it does not care what is on screen: the floor is the
           highest any card in this clip can ever draw. */
        gap: +(window.__p6.capCeil - pic.low).toFixed(1),
        /* and what is actually up on this frame, for the run to print. null on
           a frame between two cards, which is a fact rather than a pass. */
        live: top === 1e9 ? null : +(top - pic.low).toFixed(1),
        under: top === 1e9 ? null : which,
        near: +Math.min(pic.left, pic.top, pic.right, pic.bottom).toFixed(1),
        worst: pic.worst,
      };
    },
    /* what the frame drew, for the run to print. */
    boxes() {
      const r = s => {
        const el = document.querySelector(s);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1),
          left: +b.left.toFixed(1), right: +b.right.toFixed(1) };
      };
      return { mascot: r('.mascot'), wordmark: r('#wordmark') };
    },
    /* the accent, as it actually computes in this theme, so a guard can ask
       whether it was painted rather than whether a role was set. */
    accent() { return getComputedStyle(document.getElementById('accent-probe')).color; },
  };

  document.fonts.load('400 1em Michroma')
    .then(() => document.fonts.load('500 1em "Space Grotesk"'))
    .then(() => document.fonts.ready)
    .then(() => {
      fitWordmark();
      window.__built = window.__cap.build();
      /* the path lengths, measured once. no font is involved, but it is built
         here anyway so there is one ready gate rather than two. */
      window.__picBuilt = window.__pic.build();
      /* after the caption is fitted, because it is the fitted size that decides
         how tall the tallest card is. */
      window.__p6.capCeil = capCeiling();
      window.__p6.ready = true;
    });
}

/* ---------- what gets injected before the scene's own script ----------
   the rAF shim, flushed exactly once per captured frame, which is what makes
   one tick one frame. it used to have nothing to flush in this clip and was
   installed for the rig's sake; the pictogram layer is now the piece that runs
   on it. node leaves a frame with `__pic.set`, the flush applies it, and the
   run checks afterwards that exactly one tick happened and that the frame which
   landed is the frame for that time. */
function injected() {
  let seed = 0x3f9a20c5;
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

/* ---------- a local static server, so the load sequence is the reel's ------- */
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

/* ---------- the voice, cached ----------
   the sidecar json is the cache key. if it is there and it is for this script,
   the endpoint is left alone, which also means a re-render cannot quietly
   change the timeline under a clip that was already approved. */
async function voice() {
  const cached = path.join(VOICE_OUT, 'post6-calm.json');
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === SCRIPT.replace(/\s+/g, ' ').trim() && fs.existsSync(j.file)) {
      console.log('  voice from cache: ' + j.voiceId + ', ' + j.seconds.toFixed(2)
        + 's, ' + j.words.length + ' words, timings from the ' + j.timing);
      return j;
    }
  }
  const r = await speak(SCRIPT, { voice: 'calm', name: 'post6' });
  console.log('  voice: ' + r.voiceId + ', ' + r.seconds.toFixed(2) + 's, '
    + r.words.length + ' words, timings from the ' + r.timing);
  return r;
}

/* ---------- render ---------- */
async function render(plan, pic, seconds, blinks) {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  const N = Math.round(FPS * seconds);
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.mkdirSync(FRAMES, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });
  console.log('  post6-1080x1920: ' + VW * DSF + 'x' + VH * DSF + ', ' + N + ' frames');

  const { srv, port } = await serve(sceneHtml(plan, pic));
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

  /* load under a paused clock, so the google fonts request costs real seconds
     but no virtual milliseconds and frame zero is a genuinely settled page. */
  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' });
  let burned = 0;
  for (let i = 0; i < 150; i++) {
    const ok = await page.evaluate(() => !!(window.__p6 && window.__p6.ready
      && window.__cap && window.__cap.ready && window.__pic && window.__pic.ready
      && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP); burned += STEP;
  }
  if (!await page.evaluate(() => !!(window.__p6 && window.__p6.ready))) {
    throw new Error('the scene never became ready');
  }
  /* offline the whole clip renders in the mono fallback and looks almost right,
     which is the worst kind of wrong to ship. */
  const faces = await page.evaluate(() => ({
    michroma: document.fonts.check('40px Michroma'),
    grotesk: document.fonts.check('400 20px "Space Grotesk"'),
  }));
  for (const [k, v] of Object.entries(faces)) {
    if (!v) throw new Error(k + ' did not load — the clip would be set in the mono fallback');
  }
  console.log('  scene ready after ' + burned.toFixed(0) + 'ms of virtual time');

  const built = await page.evaluate(() => window.__built);
  const picBuilt = await page.evaluate(() => window.__picBuilt);
  const capCeil = await page.evaluate(() => window.__p6.capCeil);
  const boxes = await page.evaluate(() => window.__p6.boxes());
  console.log('  cards fitted at ' + built.size.toFixed(1) + 'px, the three beats at '
    + built.bigSize.toFixed(1) + 'px (' + (built.bigSize / built.size).toFixed(2) + 'x)');
  console.log('  scenes ' + SCENE_BOX.y + '..' + (SCENE_BOX.y + SCENE_BOX.h)
    + ', caption ceiling ' + capCeil.toFixed(0)
    + ', head ' + boxes.mascot.top.toFixed(0) + '..' + boxes.mascot.bottom.toFixed(0)
    + ', wordmark ' + boxes.wordmark.top.toFixed(0) + '..' + boxes.wordmark.bottom.toFixed(0)
    + '  (css px of ' + VH + ')');
  console.log('  scene layer built: ' + picBuilt.scenes + ' groups, ' + picBuilt.parts
    + ' parts, ' + picBuilt.drawn + ' path lengths measured, ' + picBuilt.lids + ' lids');

  /* one sample per card, on the frame it is fully sprung. every card is a
     different width and the three beats are a different size, so one sample
     would prove nothing about the widest or the tallest state. */
  const SETTLE = 0.30;
  const samples = plan.groups.map(g => ({
    t: Math.min(g.out - 0.02, g.words[g.words.length - 1].start + SETTLE), i: g.i,
  }));
  const sampled = new Set();
  const safeSamples = [];
  let safeWorst = null, clearWorst = null;

  let wideSeen = null, lastTx = null, lastTy = null, gazeJump = { d: 0, t: 0 };
  const eyeFaults = [];
  let lastBlink = null, blinkJump = { d: 0, t: 0 };
  const blinkSteps = [];
  let sawAccent = false, maxVisible = 0, capMoved = 0, prevSum = null;

  /* the scene layer, sampled where it is actually moving: the midpoint of every
     step of every part, the middle of every handoff, and each scene once it has
     settled. a sample on a resting frame proves nothing about a coin that is
     halfway down or a glass that is halfway across. */
  const picSamples = [];
  for (const p of pic.parts) {
    for (const st of p.steps) picSamples.push({ t: st.t + st.for / 2, who: p.id + ' ' + st.kind });
  }
  for (const h of picMotion.handoffs) picSamples.push({ t: (h[0] + h[1]) / 2, who: 'handoff' });
  for (const sc of pic.scenes) {
    picSamples.push({ t: Math.min(sc.leaving - 0.05, sc.settled + 0.20), who: sc.id + ' settled' });
  }
  picSamples.sort((a, b) => a.t - b.t);
  let picNext = 0;
  const zoneSamples = [];
  let zoneWorst = null, picSafeWorst = null;
  let picTicks = 0, picVisMax = 0, picMoved = 0, picApplied = 0, picPrevSum = null;
  const picFaults = [];
  let picPrev = null;

  const wall = Date.now();
  for (let f = 0; f < N; f++) {
    const t = f / FPS;

    /* the captions and the scenes, both from their plans, both eased in node.
       the caption is written straight to the dom; the scene layer is left for
       the rAF flush below, so it runs on the shim's clock rather than beside
       it. the small face blinks on the same lid as the big one, passed in
       rather than recomputed, so the two can never drift apart. */
    const frame = captionFrame(plan, t);
    const picF = sceneFrame(pic, t, { blink: blinkFrom(blinks, t) });
    const seen = await page.evaluate((fr, pf) => {
      window.__cap.apply(fr);
      window.__pic.set(pf);
      const accent = window.__p6.accent();
      const vis = [...document.querySelectorAll('.cap-card')]
        .filter(el => getComputedStyle(el).visibility !== 'hidden'
          && parseFloat(getComputedStyle(el).opacity) > 0.02);
      /* painted, not "has the active role": the accent is a colour and the
         guard should ask about the colour. */
      const acc = vis.some(g => [...g.querySelectorAll('*')]
        .some(el => getComputedStyle(el).color === accent));
      return { vis: vis.length, acc };
    }, frame, picF);
    if (seen.acc) sawAccent = true;
    maxVisible = Math.max(maxVisible, seen.vis);
    const sum = frame.w.reduce((a, w) => a + w[0] + w[1], 0);
    if (prevSum !== null) capMoved = Math.max(capMoved, Math.abs(sum - prevSum));
    prevSum = sum;

    /* the scene layer's one frame movement guards, run in node against the same
       numbers the page is about to be handed. every part holds a value at every
       instant of the clip, including long before and long after its own steps,
       so these compare unconditionally: there is no "it was invisible, it is
       allowed to have jumped" case to make an exception for, which is exactly
       the exception a snap would have hidden in. */
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
        if (d > picMoved) picMoved = d;
        if (Math.abs(b[0] - a[0]) > PART_FADE_LIMIT) picFaults.push({ t, what: 'fade', who });
        if (Math.abs(b[1] - a[1]) > PART_SCALE_LIMIT) picFaults.push({ t, what: 'scale', who });
        if (d > PART_MOVE_LIMIT) picFaults.push({ t, what: 'move', who });
        if (Math.abs(b[4] - a[4]) > PART_ROT_LIMIT) picFaults.push({ t, what: 'turn', who });
        if (Math.abs(b[5] - a[5]) > PART_DASH_LIMIT) picFaults.push({ t, what: 'draw', who });
      }
    }
    picPrev = picF;

    /* one rAF tick for the scene, exactly one frame's worth. this is where the
       pictogram frame set above actually lands. */
    await page.evaluate(now => window.__dmRaf(now), (f + 1) * STEP);

    /* the mascot, written last so it is what renders, and checked. the scene
       layer's readback rides along: `ticks` proves the flush ran exactly once,
       and `t` proves the frame that landed is this frame and not the last one. */
    const [eye, picLast] = await page.evaluate((ex, ey, bl) =>
      [window.__p6.life(ex, ey, bl), window.__pic.last],
      keyAt(EYE_KEYS, t, EASE_IO), keyAt(EYE_Y_KEYS, t, EASE_IO), blinkFrom(blinks, t));
    if (!picLast) picFaults.push({ t, what: 'never ticked', who: 'the rAF shim' });
    else {
      picTicks = picLast.ticks;
      picVisMax = Math.max(picVisMax, picLast.vis);
      if (picLast.t !== picF.t) picFaults.push({ t, what: 'stale frame', who: 'applied ' + picLast.t });
      if (picLast.ticks !== f + 1) picFaults.push({ t, what: 'tick count', who: picLast.ticks + ' of ' + (f + 1) });
      /* the same liveness proof the caption gets, read off what the page
         actually wrote: the smoothness guards above pass trivially on a layer
         that never draws at all, which is exactly what a missing markup block
         would produce. */
      if (picPrevSum !== null) picApplied = Math.max(picApplied, Math.abs(picLast.sum - picPrevSum));
      picPrevSum = picLast.sum;
    }

    while (picNext < picSamples.length && t >= picSamples[picNext].t) {
      const s = picSamples[picNext++];
      const z = await page.evaluate(() => window.__p6.zone());
      if (!z) continue;
      zoneSamples.push({ at: s.who, t: +t.toFixed(3), gap: z.gap, live: z.live, under: z.under, near: z.near });
      if (!zoneWorst || z.gap < zoneWorst.gap) zoneWorst = { at: s.who, t: +t.toFixed(3), ...z };
      if (!picSafeWorst || z.near < picSafeWorst.near) picSafeWorst = { at: s.who, t: +t.toFixed(3), ...z };
    }

    /* matrix(a,b,c,d,e,f): e is the x translation, f the y. both are read and
       the step is the length of the vector between two frames, so a snap on
       either axis or on both at once is one number to compare. */
    const mx = (eye[0].match(/matrix\(([^)]*)\)/) || [0, '0,0,0,0,0,0'])[1].split(',');
    const tx = parseFloat(mx[4]) || 0, ty = parseFloat(mx[5]) || 0;
    if (wideSeen === null) wideSeen = eye[1];
    else if (eye[1] !== wideSeen) eyeFaults.push({ t, what: 'wide', was: wideSeen, now: eye[1] });
    if (lastTx !== null) {
      const d = Math.hypot(tx - lastTx, ty - lastTy);
      if (d > gazeJump.d) gazeJump = { d, t };
      if (d > GAZE_LIMIT) eyeFaults.push({ t, what: 'gaze', was: [lastTx, lastTy], now: [tx, ty] });
    }
    lastTx = tx; lastTy = ty;
    if (lastBlink !== null) {
      const d = Math.abs(eye[2] - lastBlink);
      if (d > blinkJump.d) blinkJump = { d, t };
      if (d > BLINK_LIMIT) blinkSteps.push({ t, from: lastBlink, to: eye[2] });
    }
    lastBlink = eye[2];

    for (const s of samples) {
      if (sampled.has(s.i) || t < s.t) continue;
      sampled.add(s.i);
      const [sa, cl] = await page.evaluate(() => [window.__p6.safe(), window.__p6.clearance()]);
      safeSamples.push({ card: s.i, t: +t.toFixed(3), ...sa });
      if (!safeWorst || Math.min(sa.left, sa.top, sa.right, sa.bottom)
        < Math.min(safeWorst.left, safeWorst.top, safeWorst.right, safeWorst.bottom)) {
        safeWorst = { t: +t.toFixed(3), ...sa };
      }
      if (cl && (!clearWorst || cl.gap < clearWorst.gap)) clearWorst = { t: +t.toFixed(3), ...cl };
    }

    /* clip.scale is what actually gets device pixels out. a plain
       captureScreenshot hands back css pixels however high the dsf is. */
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'jpeg', quality: 94, captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
    });
    fs.writeFileSync(path.join(FRAMES, 'f' + String(f).padStart(5, '0') + '.jpg'),
      Buffer.from(shot.data, 'base64'));
    await advance(STEP);

    if (f % 240 === 0) {
      console.log('  ' + String(f).padStart(4) + '/' + N + '  t=' + t.toFixed(2) + 's  '
        + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
    }
  }

  const turns = EYE_KEYS.filter((k, i) => i > 0
    && (k[1] !== EYE_KEYS[i - 1][1] || EYE_Y_KEYS[i][1] !== EYE_Y_KEYS[i - 1][1])).length;
  const holds = EYE_KEYS.filter((k, i) => i > 0
    && k[1] === EYE_KEYS[i - 1][1] && EYE_Y_KEYS[i][1] === EYE_Y_KEYS[i - 1][1]).length;
  console.log('  idle: ' + blinks.length + ' blinks over ' + seconds.toFixed(2) + 's ('
    + (seconds / blinks.length).toFixed(1) + 's apart), ' + turns + ' turns and '
    + holds + ' holds, furthest look ' + EYE_MAX.toFixed(2) + ' of the page\'s 6');
  console.log('  gaze: biggest one-frame move ' + gazeJump.d.toFixed(3) + ' at '
    + gazeJump.t.toFixed(2) + 's, limit ' + GAZE_LIMIT.toFixed(2)
    + ' — --wide held at ' + wideSeen);
  console.log('  blink: biggest one-frame lid step ' + blinkJump.d.toFixed(3)
    + ' at ' + blinkJump.t.toFixed(2) + 's, ' + (blinkSteps.length || 'none')
    + ' over the ' + BLINK_LIMIT.toFixed(2) + ' limit');
  const dev = v => Math.round(v * DSF);
  console.log('  safe area, worst of ' + safeSamples.length + ' card samples, at '
    + safeWorst.t.toFixed(2) + 's: ' + dev(safeWorst.left) + 'px left, ' + dev(safeWorst.top)
    + ' top, ' + dev(safeWorst.right) + ' right, ' + dev(safeWorst.bottom)
    + ' bottom (floor ' + SAFE * DSF + ', tightest is ' + safeWorst.worst + ')');
  console.log('  the caption never gets closer than ' + clearWorst.gap.toFixed(0)
    + 'px to the head (floor ' + HEAD_CLEARANCE + ', closest at ' + clearWorst.t.toFixed(2)
    + 's on "' + clearWorst.which + '")');
  console.log('  scenes: ' + picTicks + ' rAF ticks for ' + N + ' frames, at most '
    + picVisMax + ' on screen at once, biggest one-frame part move '
    + picMoved.toFixed(3) + ' units (limit ' + PART_MOVE_LIMIT.toFixed(2) + '), '
    + (picFaults.length || 'no') + ' fault(s)');
  const liveWorst = zoneSamples.filter(z => z.live !== null)
    .reduce((a, b) => (a === null || b.live < a.live) ? b : a, null);
  console.log('  the scenes never get closer than ' + zoneWorst.gap.toFixed(0)
    + 'px to the caption ceiling at y=' + capCeil.toFixed(0) + ' (floor '
    + SCENE_CLEARANCE + ', closest at ' + zoneWorst.t.toFixed(2)
    + 's on "' + zoneWorst.lowest + '")');
  console.log('  against the caption actually on screen, the worst is '
    + (liveWorst ? liveWorst.live.toFixed(0) + 'px at ' + liveWorst.t.toFixed(2)
      + 's under "' + liveWorst.under + '"' : 'no sample had a caption up'));
  console.log('  and ' + Math.round(picSafeWorst.near * DSF)
    + 'px to a border at ' + picSafeWorst.t.toFixed(2) + 's on ' + picSafeWorst.worst
    + ' (floor ' + SAFE * DSF + ')');

  await browser.close();
  srv.close();

  const state = {
    seconds, frames: N, built, picBuilt, boxes, safe: safeWorst, safeSamples: safeSamples.length,
    clearance: clearWorst, eyeFaults, blinkSteps, blinkJump, gazeJump, wide: wideSeen,
    blinks: blinks.length, turns, holds, eyeMax: EYE_MAX,
    sawAccent, maxVisible, capMoved,
    pic: {
      ticks: picTicks, visMax: picVisMax, moved: +picMoved.toFixed(4),
      applied: +picApplied.toFixed(4), faults: picFaults.slice(0, 12),
      faultCount: picFaults.length, zone: zoneWorst, border: picSafeWorst,
      samples: zoneSamples.length, wanted: picSamples.length,
      capCeil, box: { ...SCENE_BOX },
    },
  };
  fs.writeFileSync(path.join(OUT, 'post6-1080x1920.json'), JSON.stringify(state, null, 2));
  return state;
}

/* ---------- encode ----------
   the clips' settings, plus the voice. no -shortest: the video is the longer
   stream and the output should run to it, so the clip keeps its tail and ends
   on the mascot rather than on the last syllable. */
function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }

function encode(voiceFile) {
  const out = path.join(OUT, 'post6-1080x1920.mp4');
  console.log('  encoding ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'),
    '-i', voiceFile,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-r', String(FPS), '-c:a', 'aac', '-b:a', '160k',
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

/* pull frames back out of the finished mp4, so the check is against what
   shipped rather than against what we meant to ship. */
function sampleFrames(mp4, at) {
  const dir = path.join(OUT, 'verify-post6');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const [t, name] of at) {
    ff(['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(t),
      '-i', mp4, '-frames:v', '1', path.join(dir, name + '.png')]);
  }
  return dir;
}

/* ---------- go ---------- */
console.log('the boring tek — social clip #6, the honest advice post');
brandTokens();      /* fail here, before a twenty two second render, if a token has moved */

const v = await voice();
/* two words to a card, not three, and the reason is the type size.

   the fit sizes every ordinary card off the widest one, so one long card sets
   the size for all of them. measured against this script and this box:

     words   widest card                    size    cards   compressed
       1     "customer"                     40.0px    54       24
       2     "touch customer"               28.5px    33        3
       3     "work without checking."       19.8px    22        0
       4     "touch customer data without"  15.6px    21        0

   three is the safest cut and it is too small: the captions are the copy in this
   clip, and 19.8px reads as a subtitle under something else rather than as the
   thing being said. one is the real hormozi cut and this script cannot carry it
   — `a` and `human` are sixty milliseconds apart, so a card a word would be a
   strobe.

   two, at 28.5px, is 44% bigger type for the cost of three cards that go past
   quickly, and those three are `in your`, `it can` and `has a`: function word
   pairs sitting in the gaps between the words the sentences lean on. their
   entrances are compressed to fit rather than left unfinished, which is what
   `popTiming` in the engine is for. */
/* `fill` is not set here and that is deliberate: the engine's default is `card`
   now, and this clip is the reason. it shipped with `fill: 'card'` written out
   while `word` was still the default, the two were watched side by side, and
   `card` won — so the default moved and the override came out rather than being
   left behind to look like an opinion this clip still holds on its own. */
const plan = planCaptions(v.words, { style: 'pop', perCard: 2, emphasise: BEAT });
console.log(describe(plan));

const beats = plan.groups.filter(g => g.big);
console.log('  beats: ' + beats.map(g => '"' + g.words.map(w => w.word).join(' ') + '" at '
  + g.words[0].start.toFixed(2) + 's').join(', '));
/* printed rather than failed on. these are the cards the voice gave less than a
   full entrance to, and knowing which they are is how you tell a script problem
   from an engine one. a name in this list would be a script problem. */
console.log('  compressed: ' + (plan.tight.compressed.length
  ? plan.tight.compressed.map(c => '"' + c.text + '" ' + c.for.toFixed(2) + 's').join(', ')
  : 'none'));

/* the clip is as long as the voice plus a tail. nothing here is a typed
   duration: change the script and the length follows it. */
const SECONDS = +(v.seconds + TAIL).toFixed(2);
const BLINKS = blinkList(SECONDS);
console.log('  ' + SECONDS.toFixed(2) + 's = ' + v.seconds.toFixed(2)
  + 's of voice plus a ' + TAIL.toFixed(2) + 's tail, and the caption clears at '
  + plan.seconds.toFixed(2) + 's');

/* the scene layer, planned and then walked frame by frame before a single jpeg
   is written. planScenes throws on a scene that never holds still, a part that
   moves before its own scene has arrived or after it has started leaving, and
   three scenes at once; sceneMotion measures what is left. between them, a snap
   costs a second here instead of four minutes of rendering. */
const pic = planScenes(SCENES);
console.log(describeScenes(pic));
const picMotion = sceneMotion(pic, FPS, SECONDS);
{
  const w = picMotion.worst;
  console.log('  the scene layer, walked at ' + FPS + 'fps before rendering:');
  console.log('    biggest one-frame move  ' + w.partM.d.toFixed(3) + ' units on '
    + w.partM.who + ' at ' + w.partM.t.toFixed(2) + 's   limit ' + PART_MOVE_LIMIT.toFixed(2));
  console.log('    biggest one-frame scale ' + w.partS.d.toFixed(3) + ' on '
    + w.partS.who + ' at ' + w.partS.t.toFixed(2) + 's   limit ' + PART_SCALE_LIMIT.toFixed(2));
  console.log('    biggest one-frame draw  ' + w.partD.d.toFixed(3) + ' on '
    + w.partD.who + ' at ' + w.partD.t.toFixed(2) + 's   limit ' + PART_DASH_LIMIT.toFixed(2));
  console.log('    biggest one-frame fade  ' + w.partO.d.toFixed(3) + ' on '
    + w.partO.who + ', ' + w.sceneO.d.toFixed(3) + ' on a whole scene   limit '
    + PART_FADE_LIMIT.toFixed(2));
  console.log('    biggest one-frame turn  ' + w.partR.d.toFixed(3) + ' deg on '
    + w.partR.who + '   limit ' + PART_ROT_LIMIT.toFixed(2));
  console.log('    ' + picMotion.handoffs.length + ' handoffs ('
    + picMotion.handoffs.map(h => h[0].toFixed(2) + '..' + h[1].toFixed(2)).join(', ')
    + '), at most ' + picMotion.visMax + ' scenes at once, '
    + picMotion.dark.toFixed(2) + 's with the zone empty');
}
/* the preflight is the fast half of the same guard the render runs frame by
   frame, so it fails here rather than after twenty two seconds of jpegs. */
{
  const w = picMotion.worst, bad = [];
  if (w.partM.d > PART_MOVE_LIMIT) bad.push(w.partM.who + ' moves ' + w.partM.d.toFixed(3) + ' units in a frame');
  if (w.partS.d > PART_SCALE_LIMIT) bad.push(w.partS.who + ' scales ' + w.partS.d.toFixed(3) + ' in a frame');
  if (w.partD.d > PART_DASH_LIMIT) bad.push(w.partD.who + ' draws ' + w.partD.d.toFixed(3) + ' of itself in a frame');
  if (w.partO.d > PART_FADE_LIMIT) bad.push(w.partO.who + ' fades ' + w.partO.d.toFixed(3) + ' in a frame');
  if (w.partR.d > PART_ROT_LIMIT) bad.push(w.partR.who + ' turns ' + w.partR.d.toFixed(2) + ' deg in a frame');
  if (w.sceneO.d > SCENE_FADE_LIMIT) bad.push('scene ' + w.sceneO.who + ' fades ' + w.sceneO.d.toFixed(3) + ' in a frame');
  if (w.sceneS.d > SCENE_SCALE_LIMIT) bad.push('scene ' + w.sceneS.who + ' scales ' + w.sceneS.d.toFixed(3) + ' in a frame');
  if (w.sceneM.d > SCENE_MOVE_LIMIT) bad.push('scene ' + w.sceneM.who + ' moves ' + w.sceneM.d.toFixed(3) + ' in a frame');
  if (picMotion.visMax > 2) bad.push(picMotion.visMax + ' scenes on screen at once');
  if (bad.length) {
    console.error(['', 'FAILED before rendering — the scene layer snaps', ...bad].join('\n  '));
    process.exit(1);
  }
}

const state = ONLY_ENCODE
  ? JSON.parse(fs.readFileSync(path.join(OUT, 'post6-1080x1920.json'), 'utf8'))
  : await render(plan, pic, SECONDS, BLINKS);

const file = encode(v.file);
const p = probe(file);
const mb = (fs.statSync(file).size / 1e6).toFixed(2) + ' MB';
console.log('  ' + p.w + 'x' + p.h + ' @' + p.fps + 'fps ' + p.seconds.toFixed(2) + 's  '
  + (p.audio ? 'with voice' : 'SILENT') + '  ' + mb + '  ' + path.relative(ROOT, file));

const dir = sampleFrames(file, [
  [1.30, 'a0-three-boxes'],
  [5.30, 'b0-the-coin-lands'],
  [10.45, 'c0-the-lock-shuts'],
  [14.75, 'd0-the-glass-sweeps'],
  [17.10, 'e0-x-becomes-check'],
  [21.30, 'f0-both-signed-off'],
  [0.60, 'a-opening-card'],
  [3.40, 'b-beat-one'],
  [4.90, 'c-advice-one'],
  [7.80, 'd-beat-two'],
  [9.00, 'e-advice-two'],
  [13.05, 'f-beat-three'],
  [15.40, 'g-advice-three'],
  [18.40, 'h-looks-at-you'],
  [20.90, 'i-the-whole-secret'],
  [Math.min(SECONDS - 2 / FPS, plan.seconds + 0.30), 'j-caption-clear'],
  [SECONDS - 2 / FPS, 'k-last-frame'],
]);
console.log('  frames sampled into ' + path.relative(ROOT, dir));

/* ---------- the editor's card ---------- */
console.log('\nfor the editor — ' + SECONDS.toFixed(2) + 's, ' + FPS + 'fps, '
  + VW * DSF + 'x' + VH * DSF + ', voice already in the file');
console.log('  voice: ' + v.voiceId + ' at rate ' + v.rate + ', pitch ' + v.pitch
  + ', ' + v.words.length + ' words, timings from the ' + v.timing);
console.log('  the three beats land at '
  + beats.map(g => g.words[0].start.toFixed(2)).join(', ') + 's');
console.log('  the mascot comes to the viewer at 17.95 and stays');
console.log('  caption clears ' + plan.seconds.toFixed(2) + ', tail '
  + (SECONDS - plan.seconds).toFixed(2) + 's');
console.log('  scenes: ' + pic.scenes.map(s => s.id + ' ' + s.in.toFixed(2)).join(', ')
  + ' — the zone is ' + SCENE_BOX.w * DSF + 'x' + SCENE_BOX.h * DSF + ' device px, '
  + (SCENE_BOX.w / VW * 100).toFixed(1) + '% of the frame');

if (!KEEP && !ONLY_ENCODE) fs.rmSync(FRAMES, { recursive: true, force: true });

/* ---------- the guards ---------- */
const fail = [];
if (p.w !== VW * DSF || p.h !== VH * DSF) fail.push('not ' + VW * DSF + 'x' + VH * DSF);
if (Math.abs(p.fps - FPS) > 0.5) fail.push('not ' + FPS + 'fps');
if (Math.abs(p.seconds - SECONDS) > 0.2) fail.push(p.seconds + 's, wanted ' + SECONDS);
if (!p.audio) fail.push('no audio track — the voice did not mux and the clip is the wrong deliverable');
/* the mp4 must not be shorter than the voice, or the last line is cut off. */
if (p.seconds < v.seconds - 0.05) {
  fail.push('the file is ' + p.seconds.toFixed(2) + 's and the voice is '
    + v.seconds.toFixed(2) + 's — the end of the line is missing');
}

/* sync. the captions are cut from the same array the voice was measured with,
   so a drift here is a bug in the engine rather than in the reading. */
if (plan.tight.late.length) {
  fail.push(plan.tight.late.length + ' card(s) leave before their own last word is said: '
    + plan.tight.late.map(c => '"' + c.text + '"').join(', '));
}
if (state.maxVisible > 1) fail.push(state.maxVisible + ' cards were on screen at once, wanted one');
if (!state.sawAccent) fail.push('the accent was never painted');
if (!(state.capMoved > 0.01)) fail.push('the caption never moved between two frames');
if (beats.length !== BEATS_EXPECTED) {
  fail.push('found ' + beats.length + ' beat cards, the script counts out ' + BEATS_EXPECTED);
}
if (!(state.built.bigSize > state.built.size * 1.2)) {
  fail.push('the beats were fitted at ' + (state.built.bigSize || 0).toFixed(1)
    + 'px against the ordinary cards\' ' + state.built.size.toFixed(1)
    + 'px — that is not a beat');
}
if (state.built.bigSize > 44.001) {
  fail.push('a beat card is ' + state.built.bigSize.toFixed(1)
    + 'px, past the brand\'s 44px hero cap');
}

/* the mascot. the smoothness guards pass trivially on a face that never moves,
   which is exactly what a missing .m-eyes group produces, so liveness is
   checked too. */
if (state.eyeFaults.length) {
  fail.push(state.eyeFaults.length + ' eye fault(s), first at '
    + state.eyeFaults[0].t.toFixed(2) + 's (' + state.eyeFaults[0].what + ')');
}
if (state.blinkSteps.length) fail.push(state.blinkSteps.length
  + ' blink step(s) over the limit — it is flashing, not blinking');
if (!(state.gazeJump.d > 0)) fail.push('the eyes never moved — is the .m-eyes group there?');
if (!(state.blinkJump.d > 0)) fail.push('the mascot never blinked');
if (state.wide !== '1') fail.push('--wide read back as "' + state.wide + '", wanted 1');

/* the frame. */
const sa = state.safe;
const near = Math.min(sa.left, sa.top, sa.right, sa.bottom) * DSF;
if (near < SAFE * DSF - 0.5) {
  fail.push(sa.worst + ' comes within ' + Math.round(near)
    + 'px of a border, floor is ' + SAFE * DSF);
}
if (state.safeSamples !== plan.groups.length) {
  fail.push('the safe area was sampled ' + state.safeSamples
    + ' times, wanted one per card (' + plan.groups.length + ')');
}
if (!state.clearance || state.clearance.gap < HEAD_CLEARANCE) {
  fail.push('the caption comes within ' + (state.clearance ? state.clearance.gap.toFixed(0) : '?')
    + 'px of the head, wanted at least ' + HEAD_CLEARANCE);
}

/* the scene layer. same shape as the mascot's guards and for the same reason:
   the smoothness checks all pass on a layer that never drew anything, so
   liveness is checked next to them rather than assumed from them. */
const pg = state.pic;
if (!pg) fail.push('the render wrote no scene layer state at all');
else {
  if (pg.faultCount) {
    fail.push(pg.faultCount + ' scene fault(s), first at ' + pg.faults[0].t.toFixed(2)
      + 's (' + pg.faults[0].what + ' on ' + pg.faults[0].who + ')');
  }
  if (pg.ticks !== state.frames) {
    fail.push('the scene layer ticked ' + pg.ticks + ' times for ' + state.frames
      + ' frames — it is not on the rAF shim\'s clock');
  }
  if (!(pg.moved > 0.0001)) fail.push('no part of the scene layer ever moved');
  if (!(pg.applied > 0.0001)) {
    fail.push('the page never wrote a different scene value between two frames — is the markup there?');
  }
  if (pg.visMax > 2) fail.push(pg.visMax + ' scenes were on screen at once, wanted at most two and only at a handoff');
  if (pg.samples !== pg.wanted) {
    fail.push('the scene zone was sampled ' + pg.samples + ' times, wanted one per moving step ('
      + pg.wanted + ')');
  }
  if (!pg.zone || pg.zone.gap < SCENE_CLEARANCE) {
    fail.push('the scenes come within ' + (pg.zone ? pg.zone.gap.toFixed(0) : '?')
      + 'px of the caption ceiling, wanted at least ' + SCENE_CLEARANCE);
  }
  /* the ceiling has to be a measured caption, not the box it lives in. if this
     ever comes back equal to the box top the measurement silently stopped
     working and the clearance guard above is checking nothing. */
  if (!(pg.capCeil > BOX.y + 1)) {
    fail.push('the caption ceiling measured ' + pg.capCeil + ', which is the box top ('
      + BOX.y + ') rather than a card — the clearance guard is checking nothing');
  }
  /* the per card safe samples above only catch the layer where a caption
     happened to change. this is the layer measured on the frames it is actually
     moving on, which is where a sweeping glass or a falling coin is furthest
     from where its own box said it would be. */
  if (!pg.border || pg.border.near * DSF < SAFE * DSF - 0.5) {
    fail.push('the scene layer comes within '
      + (pg.border ? Math.round(pg.border.near * DSF) : '?')
      + 'px of a border, floor is ' + SAFE * DSF);
  }
  if (state.picBuilt && state.picBuilt.drawn !== pic.parts.filter(p => p.draw).length) {
    fail.push('the page measured ' + state.picBuilt.drawn + ' path lengths, the plan has '
      + pic.parts.filter(p => p.draw).length + ' line drawn parts');
  }
}

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
