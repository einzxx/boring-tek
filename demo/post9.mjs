/* the boring tek — social clip #9, "the pitch reel".
   renders out/post9-1080x1920.mp4, with the voice and the effects in the file.
   tooling, not the site: nothing here ships, nothing here edits index.html.

   post7 is the template for the machinery and this is the first clip that is
   not one composed frame. it is a cut film. seven beats, four render passes,
   one clock, one encode.

   ---------- what is different from every clip before it ----------

   1. **it films the real site.** beats three to six load the actual
      index.html out of this repo, under a camera, and interact with it: the
      form opens, one of the four path options is pressed for real, the ui
      answers, a field is typed into, and the cta glitches and is pressed. the
      page is not modified. the rig adds a camera, a cursor and a caption layer
      on top of it, exactly as record.mjs has since it was written.

   2. **it is four passes into one frame folder.** a composed page and the live
      site are different documents, so they cannot be one browser page. each
      pass renders a contiguous range of the same f%06d.jpg sequence over the
      same global clock, and the whole thing is encoded once. the seams are
      hard cuts and every one of them lands on the first word of a beat.

        pass A   beats 1..2   composed   pictograms, and the first stagger
        pass B   beats 3..5   the site   hero, form, cards
        pass C   beat  6      the site   loaded fresh, glitch cta, pressed
        pass D   beat  7      composed   the end card

   3. **pass C is a second load of the same page and that is not a cheat, it
      is the page's own behaviour.** openForm() puts .gone on .cta-zone, and
      the only route back to the button is submitting and pressing start again.
      beat four opens the form; beat six needs the button. so beat six gets a
      fresh page rather than a fictional one.

   4. **the captions are the new float style.** no card, no fill, space grotesk
      at 700 in the site's own ink, straight on the footage. the accent touches
      five words in the whole clip and only on the frames they are being said
      on. the green card default is untouched and post6 and post7 still render
      exactly as they did.

   5. **the camera is gsap on the house curves.** every leg is a tween on
      btk.pop, btk.drift or btk.glide; a zoom stop overshoots and settles
      because btk.pop does; and nothing ever holds still, because a seeded
      drift of under two percent rides on top of every frame.

   6. **motion blur is the shutter scenes-test.mjs grew.** off for the timing
      pass, on for the final, N subframes averaged into every output frame, and
      blended per pass so the shutter can never smear across a cut.

   vertical only. a caption, footage and a wordmark do not fit inside a 1080
   tall frame with the air each of them needs.

     node post9.mjs                  the timing pass, no blur
     node post9.mjs --blur           the final, four subframes to a frame
     node post9.mjs --blur=6         six, if four still reads as ghosts
     DEMO_FPS=12 node post9.mjs      the fast preview
     node post9.mjs --encode-only    re-encode from kept frames
*/

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import gsapCore from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { speak, VOICE_OUT } from './lib/voice.mjs';
import {
  planCaptions, captionCss, captionMarkup, captionPage, captionFrame,
  describe, brandTokens, bareWord,
} from './lib/captions.mjs';
import {
  planScenes, sceneFrame, sceneMotion, pictogramCss, pictogramMarkup,
  pictogramRuntime, pictogramPagePlan, describeScenes, houseEases,
  WEIGHTS, SCENE_ENTER,
} from './lib/pictograms.mjs';
import {
  cuesFromCaptions, renderSfx, voiceEnvelope, decode,
  checkUnderVoice, mixdown, applyGain, limit, writeWav, loudness, describeMix, dbfs,
} from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
/* under out/, which is gitignored whole, and in its own folder so a record.mjs
   run cannot wipe it mid flight. */
const FRAMES = path.join(OUT, 'frames-post9');
const SUBS = path.join(OUT, 'subframes-post9');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = 2;

const argv = process.argv.slice(2);
const argOf = name => {
  const hit = argv.find(a => a === '--' + name || a.startsWith('--' + name + '='));
  return hit === undefined ? null : (hit.includes('=') ? hit.split('=')[1] : '');
};
const ONLY_ENCODE = argv.includes('--encode-only');
const KEEP = argv.includes('--keep-frames');
const BLUR_ARG = argOf('blur');
const BLUR = BLUR_ARG !== null;
/* the shutter. N captures inside every output frame's own 1/60th, averaged into
   one. four is where a 60fps shutter stops reading as four ghosts and starts
   reading as one smear; it is off by default because it multiplies the whole
   cost of a render by N and the cost of a render is screenshots. */
const SUB = BLUR ? Math.max(2, Math.min(12, Number(BLUR_ARG) || 4)) : 1;
const SUBSTEP = STEP / SUB;

/* ---------- the script ----------
   seven lines, one per beat, and they are seven sentences on purpose: the
   synthesiser reads a full stop as most of a second of air, which is what puts
   a real gap on every cut, and beatsFrom below finds the beats by walking the
   word list against these lines rather than by guessing at the pauses.

   the punctuation stays here and comes off the captions. that is the house
   rule since post6: the voice needs the marks to know where to breathe and a
   caption carries words. no dashes anywhere, in any of it. */
const LINES = [
  'we build with ai for small and big businesses.',
  'from tiny fixes to full systems, if ai can do it, we build it.',
  'you do not need to understand ai, that is our job.',
  'just tell us what your business does.',
  'we check it for free and tell you honestly if ai can help.',
  'and if it can not help, we say so.',
  'the boring tek, we do the boring part.',
];
const SCRIPT = LINES.join(' ');

/* ---------- the cut ----------
   css px in a 540x960 viewport; device px are double. the floors are per edge
   and they are the platform's, not the frame's — see the platform safe zone
   above.

   the vertical budget, top to bottom:
      300..530   the pictogram zone, 310 wide and centred        (pass A only)
     ~707..760   the caption, one card at a time, bottom anchored on 760
      654..750   the mascot                                      (pass D only)
     ~816..836   the wordmark, at 86.0% of the frame

   the caption box's top edge is at 510 and the caption is anchored to the
   *bottom* of it, so no card ever draws above about 707. that is the same trap
   post7 wrote up: the box is where a caption was told to live and the ceiling
   is where it actually reaches, and the clearance guards run on the ceiling. */
const VW = 540, VH = 960;

/* ---------- the platform safe zone ----------
   96 device px of margin is what a phone needs and it is not what a platform
   leaves. tiktok stacks a button column down the right and a caption across the
   bottom, instagram takes chrome top and bottom, youtube shorts eats the bottom
   for the title and the subscribe row. watched on a phone, post9's first cut had
   captions and the wordmark inside all three.

   so the floors are per edge and they are the platform's numbers rather than
   the frame's: 180 top, 220 bottom, 140 left and right, in device px, and
   nothing we draw may sit inside them. the single 48 css SAFE is gone rather
   than kept alongside, because two floors is one floor nobody reads. */
const SAFE = { top: 180, bottom: 220, left: 140, right: 140 };
/* the same numbers in css px, which is what everything in this file measures in.
   device px are double. */
const SAFE_CSS = { top: SAFE.top / 2, bottom: SAFE.bottom / 2, left: SAFE.left / 2, right: SAFE.right / 2 };
/* what a pictogram's shadow may do at a border: 24 device px closer than the
   ink and not one more. it is low opacity and large blur, and the strip a
   platform puts its own chrome in does not care how soft we are. */
const SOFT_SAFE = { top: SAFE.top - 24, bottom: SAFE.bottom - 24, left: SAFE.left - 24, right: SAFE.right - 24 };

/* ---------- the caption's one home ----------
   396 of 540 css px is 73.3%, inside both the 75% content cap and the 140
   device px side floors with air to spare. the box is bottom anchored on 760,
   so the ink lands about 707..760 and the whole of it is 200 css px clear of
   the bottom edge, which is 400 device px against a floor of 220.

   it does not move, for any beat, in any pass. that is the fix rather than a
   property of the design: the first cut let the caption sit wherever the frame
   had room and on a phone it read as clutter drifting about. one zone, four
   passes, and the camera is what moves to keep it clear. */
const CAP_BOX = { x: 72, y: 510, w: 396, h: 250 };
export const SCENE_BOX = { x: 115, y: 300, w: 310, h: 230 };
/* 310 of 540 is 57.4% of the frame, the same proportion post6 and post7 use,
   and it is centred, so the block sits on the same axis as the caption and the
   wordmark. it is written out here rather than imported because a clip owns its
   own frame. */
const SCENE_CLEARANCE = 40;

const MASCOT = 96, MASCOT_TOP = 654;
const WORDMARK_CY = 826, WORDMARK_W = 250;
/* the end card's wordmark is the same wordmark in the same place. it is the one
   thing that has been on screen for every frame of the clip, and an end card
   that moves it is an end card that ends somewhere else. what changes is that
   it stops being dim and gets a little wider. */
const END_WORDMARK_W = 300;

/* ---------- the mix ----------
   unchanged from post7, deliberately: -14 LUFS is where every platform this
   posts to normalises, -1 dBTP is the headroom a lossy codec needs, DUCK is
   8dB off the effects bus while a word is being said, and VOICE_TRIM is the one
   number that decides the balance between the two tracks. there is no music
   track and the guards count both. */
const TARGET_LUFS = -14;
const PEAK_CEILING = -1.0;
const DUCK = 0.60;
const VOICE_TRIM = -1.5;

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- easing, for everything that is not the camera ----------
   post5's solver, so the cursor and the eyes move on the curves the site moves
   on. the camera does not use any of these: it is on gsap and the house curves,
   which is the whole point of the rebuild and is set up below. */
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
const EASE_OUT = bezier(.22, 1, .36, 1);     /* cursor arrivals */
const EASE_IO = bezier(.45, 0, .55, 1);      /* gaze turns, calm at both ends */
const SPRING = bezier(.34, 1.4, .64, 1);     /* the site's own --spring */
const lerp = (a, b, p) => a + (b - a) * p;
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))));
const clampTo = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- the beats ----------
   seven lines, found in the word list rather than guessed at from the pauses.
   every camera move, every scene step, every press and every cut in this file
   is expressed as an offset from one of these, so a re-synthesis that comes
   back a tenth of a second longer moves the whole film with it instead of
   sliding the picture off the voice.

   it walks the two lists together and throws on the first disagreement rather
   than searching, because a script and its own reading should be word for word
   identical and a fuzzy match here would hide the one case worth catching: the
   script in this file no longer being the script in the cached audio. */
function beatsFrom(words, lines) {
  const beats = [];
  let i = 0;
  lines.forEach((line, li) => {
    const want = line.split(/\s+/).map(w => bareWord(w).toLowerCase()).filter(Boolean);
    const a = i;
    for (const w of want) {
      const got = words[i] ? bareWord(words[i].word).toLowerCase() : '(past the last word)';
      if (got !== w) {
        throw new Error('beat ' + (li + 1) + ' wanted "' + w + '" as word ' + i
          + ' and the voice said "' + got + '" — the script and the cached reading disagree');
      }
      i++;
    }
    beats.push({
      i: li, line, a, b: i - 1, words: words.slice(a, i),
      start: words[a].start, end: words[i - 1].end,
    });
  });
  if (i !== words.length) {
    throw new Error('the reading has ' + (words.length - i) + ' word(s) the script does not');
  }
  return beats;
}

/* ---------- the camera ----------
   gsap, in node, on the house curves. the page is handed three numbers a frame
   and decides nothing, which is the same contract the caption layer and the
   pictogram layer already have with it.

   node side rather than in the page, and that is a real choice. the pictogram
   engine runs gsap in both halves because its output is written to forty
   elements and the parity between them is worth proving; a camera is one
   transform on one wrapper, so there is nothing for a second copy to disagree
   about and a second copy would only be a second thing to keep in agreement.

   the ticker is taken apart exactly as pictograms.mjs takes it apart, and for
   the same two reasons: a ticker that wakes dispatches straight into
   updateRoot, and in node the fallback timer is a live handle that keeps the
   process alive after the clip is written. */
const gsapNode = (() => {
  const g = gsapCore;
  g.registerPlugin(CustomEase);
  g.ticker.remove(g.updateRoot);
  g.ticker.lagSmoothing(0);
  g.ticker.sleep();
  g.ticker.wake = () => {};
  return g;
})();
const EASES = houseEases(gsapNode, CustomEase);

/* one leg. a paused tween over a plain object, seeked per frame — never played,
   for the same reason nothing else in this pipeline is played: a captured frame
   carries five or six BeginFrames and anything running on its own clock
   resolves about five times too fast.

   the tween is built when the leg starts rather than up front, because where it
   is going is a live element rect and an element the page has not drawn yet has
   no rect. that is the one thing a pre-built timeline cannot do here. */
function camLeg(from, to, dur, ease) {
  const o = { cx: from.cx, cy: from.cy, z: from.z };
  const tw = gsapNode.to(o, {
    cx: to.cx, cy: to.cy, z: to.z,
    duration: Math.max(dur, 1 / 600),
    ease: EASES[ease] || EASES.glide,
    paused: true,
  });
  return {
    ease, dur: tw.duration(),
    at(dt) {
      tw.seek(clampTo(dt, 0, tw.duration()), true);
      return { cx: o.cx, cy: o.cy, z: o.z };
    },
  };
}

/* ---------- the drift ----------
   no frame in this film is a still frame. a hold under a voice that is still
   talking reads as the render having stopped, and the fix is not a slow zoom —
   a slow zoom has a direction and a direction is a statement. this has neither:
   two sines whose periods do not divide into each other, so the pattern never
   repeats inside a clip this long, summed to under one percent of scale and
   five css px of height.

   one percent against the brief's ceiling of two. it is deliberately half: the
   number that matters is that it is never zero, and a drift you can see is a
   drift you start watching. */
const DRIFT = { z: 0.010, y: 5.0 };
function driftAt(t) {
  return {
    z: DRIFT.z * (0.62 * Math.sin(t * 0.41 + 1.10) + 0.38 * Math.sin(t * 0.23 + 2.70)),
    y: DRIFT.y * (0.62 * Math.sin(t * 0.33 + 0.40) + 0.38 * Math.sin(t * 0.19 + 1.90)),
  };
}

/* ---------- the mascot's idle, for the two site passes and the end card ----------
   the site's own hero mascot on passes B and C, and the end card's on pass D.
   the recorder writes --ex, --ey and --blink after the page's own rAF tick so
   these are the values that render; the page's blink engine still runs its
   bookkeeping, it just never gets the last word.

   these are offsets from a pass's own first frame rather than absolute times on
   the film's clock, because two of the three passes are a fresh page. */
/* [offset, --ex, --ey]. a repeated pair is a deliberate hold, and the two axes
   share their key times so a turn is one movement rather than two on different
   clocks. the site's own clamps are 6 and 3.8 units; the furthest any of these
   goes is 2.16 combined, which is post6 and post7's calm to within a hundredth
   and for the same reason: it is the same mascot listening to the same kind of
   argument.

   he reads the caption under him, drifts across it, and at 4.5s comes level
   with the viewer and stays, which on pass B is the line about it being our job
   and on pass C is the line about saying so. one look at the person watching,
   on the line addressed to them. */
const IDLE_KEYS = [
  [0.00, 0.0, -1.5], [0.70, 0.0, -1.5],
  [1.30, -1.2, -1.8], [2.20, -1.2, -1.8],
  [2.90, 1.0, -1.4], [3.80, 1.0, -1.4],
  [4.50, 0.0, -0.6], [30.0, 0.0, -0.6],
];
function eyesFor(t0) {
  return {
    x: IDLE_KEYS.map(k => [t0 + k[0], k[1]]),
    y: IDLE_KEYS.map(k => [t0 + k[0], k[2]]),
  };
}
const EYE_MAX = Math.max(...IDLE_KEYS.map(k => Math.hypot(k[1], k[2])));
if (EYE_MAX > 6) throw new Error('an eye key travels ' + EYE_MAX.toFixed(2) + ' units, past the page cap of 6');
if (Math.max(...IDLE_KEYS.map(k => Math.abs(k[2]))) > 3.8) {
  throw new Error('an eye key travels past the page vertical cap of 3.8');
}
function prng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
/* seeded, so the rhythm is uneven the way a real one is and identical on every
   run. post7's cadence: 3.0 to 4.4 seconds apart, doubles rare. someone
   listening to an argument blinks like someone concentrating. */
function blinkList(from, to, seed) {
  const rnd = prng(seed);
  const out = [];
  let t = from + 0.9;
  while (t < to - 0.35) {
    out.push(t);
    if (rnd() < 0.12) { const d = t + 0.12; if (d < to - 0.35) out.push(d); }
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
   clamp out of the way under DEMO_FPS=12, where one frame genuinely is 83ms of
   eyelid. */
const BLINK_LIMIT = Math.min(0.95, 3.4 * 0.94 * STEP / 95);
const GAZE_LIMIT = 1.2 * STEP / 16.6667;

/* ---------- the pictogram scene, beats one and two ----------
   one scene, held for both beats, changing as the voice changes. post7 proved a
   single evolving scene reads better than a handoff when there is no silence to
   hide a cut behind, and there is no silence here either.

   every time below is a word start out of the reading, not a number typed
   against a printed list. the line names what is on screen when it is said:

     we build ...                    the core block arrives on "build"
     ... small and big businesses    a small block and a big one, on their words
     from tiny fixes to full systems four folders arrive at the corners
     if ai can do it                 four lines draw, and it is a system
     we build it                     the middle lights up

   the composition is a centred cross rather than a filled block: one thing in
   the middle, four around it, and the rest air. five shapes across a 100 unit
   board caps each of them at about 16 units with a gap worth having, and
   stretching them to fill the zone would be five large shapes rather than a
   system with room in it.

   the ink is rationed as it is everywhere else: one accent, on the one thing
   the clip is claiming, which is that we build it. */
const HAIR = WEIGHTS.hair, MARK = WEIGHTS.mark;

function buildScenes(beats) {
  const b1 = beats[0], b2 = beats[1];
  const IN = 0.05;
  const OUT = beats[2].start;
  /* a part may not begin before its own scene has half arrived. the core wants
     the word "build", which lands at about a quarter of a second, so it is
     clamped rather than left to throw on a reading that comes back fast. */
  const floor = IN + SCENE_ENTER.for * 0.5 + 0.01;
  const on = (beat, k) => Math.max(floor, beat.words[k].start);
  /* the last thing the scene does has to finish before the cut, and the cut is
     the first word of beat three. 0.55 is one pop with a frame to spare. */
  const litAt = Math.min(on(b2, 12), OUT - 0.55);

  /* the four corner nodes. folders rather than more squares, because "full
     systems" is a different kind of thing from "one task" and drawing it as a
     bigger square would say it is the same thing but larger.

     they are the first shipped parts to stagger. a folder's tab is the first
     element of its shape, so the tab leads the body by the three frames rather
     than trailing it. at 50ms that reads as the folder arriving with a flick
     rather than as two objects, which is the whole budget stagger has: two
     frames is a wobble and five is two animations. */
  const NODES = [
    { id: 'sys-1', cx: 30, cy: 12, w: 5 },
    { id: 'sys-2', cx: 70, cy: 12, w: 6 },
    { id: 'sys-3', cx: 30, cy: 48, w: 8 },
    { id: 'sys-4', cx: 70, cy: 48, w: 9 },
  ];
  /* which word each node arrives on, and which word its line draws on. the
     nodes take "tiny fixes ... full systems" and the lines take "if ai can do",
     so the picture is finished exactly as the sentence claims it can be. */
  const NODE_WORD = [1, 2, 4, 5];
  const LINE_WORD = [6, 7, 8, 9];

  const parts = [];
  /* the lines first, so the solid shapes at both ends paint over their ends.
     paint order is declaration order; the times are the times. */
  NODES.forEach((nd, i) => {
    parts.push({
      id: 'link-' + (i + 1), shape: 'stroke', w: MARK,
      at: { x1: 50, y1: 30, x2: nd.cx, y2: nd.cy },
      steps: { kind: 'draw', t: on(b2, LINE_WORD[i]), for: 0.44 },
    });
  });
  NODES.forEach((nd, i) => {
    parts.push({
      id: nd.id, shape: 'folder', stagger: 3,
      at: { x: nd.cx - 8, y: nd.cy - 7, w: 16, h: 14, tab: 2.5 },
      steps: { kind: 'pop', t: on(b2, NODE_WORD[i]) },
    });
  });
  /* small and big, said and drawn. two blocks either side of the core at
     genuinely different sizes, because "small and big businesses" is a line
     about size and a picture that draws them the same size is arguing with it. */
  parts.push({ id: 'small', shape: 'square', at: { cx: 18, cy: 30, s: 9 },
    steps: { kind: 'pop', t: on(b1, 5) } });
  parts.push({ id: 'big', shape: 'square', at: { cx: 82, cy: 30, s: 17 },
    steps: { kind: 'pop', t: on(b1, 7) } });
  /* the core, painted after them so it is on top of every line. */
  parts.push({ id: 'core', shape: 'square', at: { cx: 50, cy: 30, s: 14 },
    steps: { kind: 'pop', t: on(b1, 1) } });
  /* on "we build it", the core gets a check cut into it.

     it used to be a second square in the accent laid over the core, and that
     was a green card in the middle of the frame — which is exactly the thing
     the brief says the accent may not be. the rule is that the single green
     touches nothing but the five money words in the captions, and a solid green
     block for two and a half seconds is not a word being said.

     so it is a mark rather than a colour. cut into the ink the way a document's
     writing is, so the page shows through: the only treatment that reads on a
     solid shape, and post7 already proved it. */
  parts.push({ id: 'built', shape: 'check', ink: 'cut', w: MARK,
    at: { cx: 50, cy: 30, s: 10 },
    steps: { kind: 'draw', t: litAt, for: 0.50 } });

  return [{ id: 'system', in: IN, out: OUT, parts }];
}

/* the scene layer's own guards, frame rate relative for the reason the eye ones
   are: a limit written in units per frame is a different limit at 12fps and at
   60, and the preview pass must not fail on being a preview. every one is a
   ceiling on a single frame's change, which is the only kind of number that can
   tell a fast move from a snap. */
const R = STEP / 16.6667;
const PART_MOVE_LIMIT = 4.5 * R;
const PART_SCALE_LIMIT = 0.14 * R;
const PART_ROT_LIMIT = 10 * R;
const PART_DASH_LIMIT = 0.12 * R;
const PART_FADE_LIMIT = 0.20 * R;
const PART_LIFT_LIMIT = 0.22 * R;
const SCENE_MOVE_LIMIT = 3.0 * R;
const SCENE_SCALE_LIMIT = 0.06 * R;
const SCENE_FADE_LIMIT = 0.20 * R;

/* ---------- the money words ----------
   five, in a clip of fifty odd. the brief named them and the count is the point:
   past a handful the accent stops meaning anything and the style is just a green
   caption.

   "we build it" is three consecutive words and that is deliberately not a green
   card, because the flash only paints the word being said — the three land one
   after another and at no instant is more than one of them green. that per word
   rule is what makes a phrase safe to mark. */
function flashCells(beats) {
  const on = new Set();
  /* the last three words of beat two: we build it. */
  for (let i = beats[1].b - 2; i <= beats[1].b; i++) on.add(i);
  /* free, and honestly, both inside beat five. found rather than indexed, so
     the copy can be edited without this going quietly wrong. */
  const want = ['free', 'honestly'];
  for (let i = beats[4].a; i <= beats[4].b; i++) {
    if (want.includes(bareWord(beats[4].words[i - beats[4].a].word).toLowerCase())) on.add(i);
  }
  return on;
}

/* ---------- what the camera does over the site ----------
   every leg names a selector and the rect is measured in the browser at the
   moment the leg starts. nothing here is a coordinate, which is the rule
   record.mjs set and the reason a camera move cannot go stale when the page
   grows a step under it.

   the framing rules the page imposes on any camera over it, all three learned
   by rendering and looking, and all three still in force:
     - zoom never goes below 1.0. the bar, the vignette and the grain are all
       fixed inside the camera wrapper, so under 1.0 their boxes float as
       visible rectangles in the margin.
     - a resting shot frames either page zero or everything below the bar,
       never halfway through it, because the bar paints an opaque scrim over
       its own top 42% that shows as a hard edge against the grain.
     - the subline is the widest line on the page, so a zoom that puts it in
       frame and clips it reads as a bug. record.mjs answered that with a flat
       cap of 1.09 on every shot. this file answers it with the measurement
       instead — clipCheck() below fails the render if the subline is ever both
       in frame and cut — which is what lets the form shot go past 1.09 while
       the cta shot, where the subline is right above the button, does not. */
/* ---------- how a shot is chosen ----------
   the caption band is fixed, so the camera is what keeps it clear. every shot
   in the two site passes is a **gap between two elements, centred on the
   caption band at a given zoom**, measured live and never typed as a page
   coordinate.

   the page has exactly two bands with no writing in them, and both were
   measured off the real document rather than guessed:

     form shut   .cta-zone ends 576, .cards begins 634     58 page px
     form open   .pad ends 807,      .cards begins 865     58 page px

   the caption ink is about 53 css px tall, so at any zoom over 1.0 it fits
   inside 58 page px of gap. holding 576..634 over that band needs **z >= 1.10**,
   which is the floor every hero shot sits on.

   ---------- and why there is a ceiling too ----------
   the note asked for deeper zooms and the page will not give them. index.html
   is laid out edge to edge at 540 css px: the h1 is 470 wide, the subline 494,
   the info cards 508. a frame at zoom z is 540/z wide, so anything past

     1.15   cuts the h1  — and a cropped THE BORING TEK reads as SHE / 7/RING /
            MEK, which is what the first pass of this fix actually rendered
     1.09   cuts the subline
     1.06   cuts the info cards

   the first attempt at this note ran the hero at 1.33 to 1.50 and the wordmark
   came out as three lines of nonsense. that is a worse defect than the one it
   was fixing, so the ceiling wins: **every site shot lives between 1.06 and
   1.14**, and each one takes the deepest zoom that leaves its own subject
   whole.

   the depth comes from travel instead, which is what record.mjs concluded the
   first time anyone pointed a camera at this page: the language here is
   vertical, not scale. the film crosses about 700 page px between the hero, the
   form and the cards, and the two snaps cover 230 and 400 of it in eight frames
   each. that is the move being felt; the zoom never was going to be. */
const BAND_S = 731;          /* the caption band's centre, in screen css px */
const gapShot = (a, b, z) => ({ gap: [a, b], z: z });
/* a snap is eight frames. six reads as a cut and ten reads as a move; eight is
   where it smears and lands, which is the whole reason the shutter exists. it
   is written in seconds so the 12fps preview is the same move rather than a
   different one. */
const SNAP = 8 / 60;
/* how long the page takes to stop moving after a press, and it is index.html's
   own numbers rather than a guess: .card grows a grid row from 0fr over .44s and
   .cardin springs over .52s, both starting two rAF after the click. 0.60 covers
   the longer of them. it is what a frame is measured against when the question
   is whether it is a held shot, because a frame where the page is rearranging
   itself is not one. */
const PAGE_SETTLE = 0.60;
const TOPSHOT = z => ({ cx: VW / 2, cy: VH / 2 / z, z });
const HERO_WIDE = gapShot('.cta-zone', '.cards', 1.10);
const HERO_TIGHT = gapShot('.cta-zone', '.cards', 1.14);
const FORM = gapShot('.pad', '.cards', 1.14);
/* 1.06 and not deeper, and it is the one shot in the film that is shallow on
   purpose. beat five is about the info cards, and .cards is 508 of the page's
   540 css px wide: at 1.25 the frame is 432 wide and every line of them is cut
   off at both ends, which on a phone reads as a broken render rather than as a
   punch in. 1.06 is the deepest zoom that still holds all three cards whole.
   the move into it is a pull back from 1.42, which is a real move in the other
   direction and lets the section arrive rather than be arrived at. */
const CARDS_SHOT = gapShot('.cards', '.foot', 1.06);
const CTA_SHOT = gapShot('.cta-zone', '.cards', 1.14);
/* pass C opens at the bottom of the document and comes up to the button. it is
   the one shot that is not holding a gap, because it is not holding anything:
   it is roughly where the frame was when beat five ended, so the cut reads as
   a cut rather than as a teleport. */
const LOW = { docBottom: true, z: 1.02 };
/* what gets typed into the form. a plain sentence about a business, because
   the line being said is "just tell us what your business does" and the answer
   on screen should be the answer to that question. no client, no name, nothing
   invented about anybody. */
const TYPED = 'phone orders';

/* ---------- the hand ----------
   the first cut typed at one constant rate and read as a machine filling a
   field, which is what it was. a person does not do that.

   so: every gap is its own number between 40 and 140ms, one gap in the middle
   is a 200ms hesitation, and one letter is got wrong, noticed, deleted and
   typed again. the whole thing is seeded, so the rhythm is uneven the way a
   real one is and identical on every run — the same trick the blinks and the
   idle have used since post2.

   the typo is a real keystroke and a real Backspace through the page's own
   input handler, not a string edited behind its back: the site's `input`
   listener fires for both, so `S.question` goes wrong and comes right the way
   it would for a visitor. the wrong letter is a keyboard neighbour rather than
   a random one, because a typo is a finger landing next door. */
const NEIGHBOUR = {
  a: 's', b: 'v', c: 'x', d: 'f', e: 'r', f: 'g', g: 'h', h: 'j', i: 'o', j: 'k',
  k: 'l', l: 'k', m: 'n', n: 'm', o: 'p', p: 'o', q: 'w', r: 't', s: 'd', t: 'y',
  u: 'i', v: 'b', w: 'e', x: 'c', y: 'u', z: 'x', ' ': 'v',
};
function humanKeys(text, from, until, seed) {
  const rnd = prng(seed);
  /* the two events are placed before the gaps are drawn, so moving either one
     does not change the rhythm of the rest. both are inside a word rather than
     at a boundary: a hesitation between words is a pause and reads as one. */
  const typoAt = 2 + Math.floor(rnd() * Math.max(1, text.length - 5));
  const hesitateAt = Math.min(text.length - 2,
    typoAt + 3 + Math.floor(rnd() * 3));
  const keys = [];
  const gaps = [];
  let t = 0;
  for (let i = 0; i < text.length; i++) {
    if (i === hesitateAt) t += 0.20;
    if (i === typoAt) {
      const wrong = NEIGHBOUR[text[i].toLowerCase()] || 'e';
      keys.push({ dt: t, key: wrong, kind: 'typo' });
      t += 0.09 + rnd() * 0.09;
      keys.push({ dt: t, key: 'Backspace', kind: 'fix' });
      t += 0.07 + rnd() * 0.08;
    }
    keys.push({ dt: t, key: text[i], kind: 'key' });
    const g = 0.040 + rnd() * 0.100;
    gaps.push(g);
    t += g;
  }
  /* fitted to the room it has, and the shape is kept while it is fitted: every
     gap scales by the same factor, so a fast hand is still an uneven one. the
     run prints the factor and the real spread, because "40 to 140" is only true
     if nothing squeezed it. */
  const want = until - from;
  const scale = t > want && want > 0 ? want / t : 1;
  const out = keys.map(k => ({ t: from + k.dt * scale, key: k.key, kind: k.kind }));
  return {
    keys: out, scale,
    gaps: gaps.map(g => g * scale),
    typoAt, hesitateAt,
    from, to: from + t * scale,
  };
}

/* a word inside a beat, by what it says rather than by where it sits. keying a
   press to beats[2].words[7] would be keying it to a line nobody is allowed to
   edit; keying it to "that" survives the copy moving. */
function wordAt(beat, text) {
  const w = beat.words.find(x => bareWord(x.word).toLowerCase() === text);
  if (!w) throw new Error('beat ' + (beat.i + 1) + ' has no word "' + text + '"');
  return w.start;
}

function planSite(beats) {
  const b3 = beats[2], b4 = beats[3], b5 = beats[4], b6 = beats[5], b7 = beats[6];
  /* every leg carries what it is anchored to, so the run can print how far off
     its own mark it landed rather than the file claiming it did not miss.
       start  the move begins on the beat's first word — a shot that opens a
              pass, where the cut is the move and nothing can precede it
       land   the move ends on the beat's first word, so it is pre rolled by its
              own duration and arrives exactly as the line does */

  /* ---- pass B: the hero, the form, the cards ---- */
  const B = { from: b3.start, to: b6.start, start: HERO_WIDE, legs: [], cues: [], moves: [] };
  /* beat three. a push from 1.33 to 1.50, both of them holding the same gap on
     the caption band, so the words stay on empty page for the whole move. glide,
     because a push that eases at both ends is a push and a linear one is a zoom
     control. it opens the pass, so the cut is its landing. */
  B.legs.push({ t0: b3.start, t1: b3.end, ease: 'glide', to: HERO_TIGHT,
    snap: false, beat: 3, anchor: 'start' });
  /* the cta is pressed on the word "that", inside beat three rather than in the
     pause after it, and the reason is arithmetic rather than taste: beat four
     is 1.9 seconds long and the page needs about half a second to unfold the
     card, so a press timed to the pause would put the snap zoom onto a card
     that is still growing and frame it at the wrong size.

     it also happens to be the better edit. the line under it is "that is our
     job", the form is what the job produces, and the hero push is still the
     shot for the two seconds before it. */
  /* the cta is pressed 0.55s before beat four, and every part of that number is
     doing something.

     it has to be late, because opening the card reflows the page and the hero
     shot is holding a gap it measured while the form was shut — so from the
     press until the camera moves, the chips are where the empty band was. it
     also has to be early enough for the card to exist and stop moving before
     the snap measures it, and that is not a third of a second: index.html opens
     the card by growing a grid row from 0fr over .44s and springing .cardin over
     .52s, and while that runs .pad is a full height box clipped inside a short
     one, so it measures as ending below .below and the gap comes back negative.
     the render caught it at -111.8px. 0.72 clears both transitions with room to
     spare, and the clash it leaves sits inside the window a frame counts as page
     motion.

     and it is what gives beat four's snap its travel. the alternative was to
     follow the page at the press, which is what the first attempt did, and then
     the snap had nowhere to come from: it moved 5 page px and 0.06 of zoom. now
     it crosses 230 page px in eight frames. */
  B.moves.push({ t0: b4.start - 1.32, t1: b4.start - 0.82, sel: '.cta' });
  B.cues.push({ t: b4.start - 0.72, press: '.cta' });
  /* beat four. the snap zoom, and it is the one move in the film that is meant
     to be felt: 0.34s on btk.pop, which overshoots ten percent past the mark
     and settles back through a dip. with the shutter open it smears and lands
     sharp, which is the whole argument for a real subframe blur. */
  B.legs.push({ t0: b4.start - SNAP, t1: b4.start, ease: 'pop', to: FORM,
    snap: true, beat: 4, anchor: 'land' });
  /* the fourth of the four path options. it is "i just have a question", and it
     is chosen rather than the first because of what the page does next: a
     single pick chip marks itself pressed, waits 240ms, and advances itself, and
     that answer routes to a two step path whose second step is a textarea. so
     one press shows the ui answering and puts a field on screen, which is the
     whole of the beat, inside the beat.

     the 240ms is the page's own and it is why the hand does not leave for the
     field until +1.10: the field does not exist until +1.04. */
  B.moves.push({ t0: b4.start + 0.06, t1: b4.start + 0.22, sel: '.chips .chip:nth-child(4)' });
  B.cues.push({ t: b4.start + 0.26, press: '.chips .chip:nth-child(4)' });
  /* the card is a different height once the question step replaces the four
     options, so the camera reframes onto it rather than holding a frame fitted
     to a card that no longer exists. drift, because it is a settle rather than
     a move, and it is over before the hand reaches the field. */
  B.legs.push({ t0: b4.start + 0.52, t1: b4.start + 0.92, ease: 'drift', to: FORM, snap: false });
  B.moves.push({ t0: b4.start + 0.50, t1: b4.start + 0.70, sel: '.pad textarea' });
  B.cues.push({ t: b4.start + 0.74, press: '.pad textarea' });
  /* the typing is fitted to the room it has rather than to a rate typed here.
     it runs past the start of beat five on purpose: the camera pulls away to
     the cards while the field is still filling, which is what it looks like
     when somebody answers a question and the answer keeps going. */
  {
    /* the hand starts a tenth after the field is pressed and has until beat
       five has been running for a third of a second — the camera leaves on
       beat five and a field still filling after it has gone is a field nobody
       can see. twelve characters is what fits at a human rate, which is why the
       answer is two words rather than a sentence. */
    const from = b4.start + 0.84;
    const until = b5.start + 0.42;
    B.typing = humanKeys(TYPED, from, until, 0x6b1f27);
    for (const k of B.typing.keys) B.cues.push({ t: k.t, key: k.key });
    B.moves.push({ t0: B.typing.to + 0.10, t1: B.typing.to + 0.60, home: true });
  }
  /* beat five. down the page to the cards, on drift: a long move across a page
     is a drift and nothing else in the vocabulary is. the background comes with
     it at forty percent, which is the parallax. */
  B.legs.push({ t0: b5.start, t1: b5.start + 1.30, ease: 'drift', to: CARDS_SHOT,
    snap: false, beat: 5, anchor: 'start' });
  /* the cards arrive on scroll, through the page's own IntersectionObserver,
     and this camera does not scroll: it transforms. an observer does read the
     transformed box, so the page should reveal them by itself as they come into
     frame — but "should" is not a thing to find out about after a twenty minute
     render, and a card that never reveals is a card with opacity 0 in the
     middle of its own beat. so this looks, adds the page's own class to
     anything the page has not got to yet, and reports which of the two
     happened. the class is the one a real visitor scrolling would cause. */
  B.cues.push({ t: b5.start + 1.20, reveal: true });

  /* ---- pass C: a fresh page, the glitch, the press ---- */
  /* pass C opens low, below the fold, and rises to the button. that is not
     decoration: it is the only move the page allows.

     the first render framed the cta with a fit and got a zoom of 1.005 to
     1.007, which is not a zoom. the reason is the subline. it is the widest
     line index.html sets, it sits directly above the cta, and framing the
     button at any scale that reads as a punch in puts it in shot and cuts its
     first and last letter — the arithmetic is that the frame top would have to
     clear the subline, which needs a zoom past seven. so the scale is capped
     near 1.09 and the move has to be somewhere else.

     it is in the travel. the camera starts 435 page px below the button and
     comes up to it, which is also continuous with where beat five left the
     frame: the cut lands in roughly the place the last shot ended and then
     moves, so the seam reads as a cut rather than as a teleport. btk.pop gives
     it the overshoot and the settle at the top. */
  /* pass C is pre rolled by the length of its own snap, so the zoom **lands**
     on beat six's first word instead of leaving on it. the cut is then eight
     frames of anticipation, which is what a cut before a line is for. */
  const C = { from: b6.start - SNAP, to: b7.start,
    start: LOW, legs: [], cues: [], moves: [] };
  C.legs.push({ t0: b6.start - SNAP, t1: b6.start, ease: 'pop', to: CTA_SHOT,
    snap: true, beat: 6, anchor: 'land' });
  /* the page's own glitch, played on our frame rather than on its dice. the
     scheduler is frozen for both site passes and the class is added here, so
     the shake is the site's animation at a time this file chose. */
  C.cues.push({ t: b6.start + 0.90, glitch: true });
  C.moves.push({ t0: b6.start + 1.20, t1: b6.start + 1.85, sel: '.cta' });
  /* the press is the last thing beat six does, and it is late on purpose.
     pressing the cta opens the card, which pushes the whole section below it
     down about 230 page px — so a camera holding a gap it measured while the
     form was shut suddenly has the chips where the empty band was. pass B has
     time to follow the page and does. beat six has 2.5 seconds and no room for
     a settle, so instead the press lands late enough that the cut to the end
     card arrives before the card has finished opening. the glitch and the press
     are the payoff of the beat; the form unfolding is not part of it. */
  C.cues.push({ t: b6.start + 2.05, press: '.cta' });

  return { B, C };
}

/* ---------- the mascot, read from source ----------
   exactly as post5, post6 and post7 read it. the standalone file is one circle
   and two loose rects; the page wraps the rects in a group and travels the
   group, leaving the blink on each rect, so the blink can never lag the gaze.
   rebuild that here or nothing can move the eyes at all. */
function mascotBody() {
  const svg = fs.readFileSync(path.join(ROOT, 'assets', 'mascot.svg'), 'utf8');
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '').trim();
  if (!inner.includes('fill="#f4f7f5"') || !inner.includes('fill="#06070a"'))
    throw new Error('mascot.svg is not the dark colourway any more');
  if ((inner.match(/<circle/g) || []).length !== 1 || (inner.match(/<rect/g) || []).length !== 2)
    throw new Error('mascot.svg is not one circle and two eyes any more');
  const face = inner.match(/<circle[\s\S]*?\/>/)[0]
    .replace('<circle', '<circle class="m-face"')
    .replace(/fill="#f4f7f5"/, 'fill="var(--face)"');
  const eyes = inner.match(/<rect[\s\S]*?\/>/g).map(r => r
    .replace('<rect', '<rect class="m-eye"')
    .replace(/fill="#06070a"/, 'fill="var(--eye)"'));
  return [face, '<g class="m-eyes">', ...eyes, '</g>'].join('\n      ');
}

/* the one font tag in the file, and it asks for a weight index.html never will.
   the site's budget is one request carrying Michroma and Space Grotesk at 400
   and 500, and that budget is not moving. this is a render page: what leaves it
   is pixels, not a font request, so the weight the float captions are set in
   costs a visitor nothing and costs the site's one request nothing. it is the
   only place in the repo where that reasoning applies and it applies only here. */
const FONTS = '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
  + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
  + 'family=Michroma&family=Space+Grotesk:wght@400;500;700&display=swap">';

/* the vignette, at its light value, breathing on the site's own 34s loop. no
   grain: every platform recompresses a clip and grain through that is noise
   rather than texture.

   the breathe is load bearing rather than decoration. with nothing animating at
   all chrome stops producing compositor frames and Page.captureScreenshot
   blocks on a frame that never comes. post2.mjs found this and every clip since
   has carried the fix. */
const VIGNETTE_CSS = `
.vignette{position:fixed;inset:-10%;background-image:var(--vig);pointer-events:none;z-index:0;
  will-change:transform,opacity;
  animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{
  from{transform:scale(1) translate3d(0,0,0);opacity:.88}
  to{transform:scale(1.045) translate3d(0,-1.2%,0);opacity:1}
}
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;
  transform-origin:50% 50%;will-change:transform}
.wordmark{
  position:absolute;left:50%;top:${WORDMARK_CY}px;transform:translate(-50%,-50%);
  font-family:var(--display);font-weight:400;color:var(--muted);
  text-transform:uppercase;letter-spacing:.18em;white-space:nowrap;line-height:1;
  /* letter-spacing is added after every glyph including the last, so the box is
     one full space wider than the ink and the ink sits half a space left of the
     box centre. shifting by half the tracking is what actually centres it. */
  text-indent:.09em;
}
`;

/* ---------- the composed pages ----------
   pass A and pass D. the same frame, minus what each of them does not have:
   A has the pictogram zone and the captions and no mascot, D has the mascot and
   nothing else. the wordmark is on both, in the same place it is on the two
   site passes, because it is the one thing that never moves in the whole film. */
function composedHtml(kind, plan, pic) {
  const isEnd = kind === 'end';
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<title>post9 ${kind}</title>
${FONTS}
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}
${captionCss(plan, CAP_BOX)}
${isEnd ? '' : pictogramCss(pic, SCENE_BOX)}
${VIGNETTE_CSS}
${isEnd ? `
/* the end card. the mascot where post6 and post7 keep him and the wordmark
   where it has been for the whole film, no longer dim. nothing arrives, nothing
   slides: it is a cut, and a cut does not need an entrance. */
.wordmark{color:var(--fg)}
.m-zone{position:absolute;left:50%;top:${MASCOT_TOP}px;transform:translateX(-50%);
  display:block;width:max-content}
.mascot{position:relative;display:block;width:${MASCOT}px;height:auto}
.m-face{fill:var(--face)}
.m-eyes{transform:translate(calc(var(--ex,0) * 1px),calc(var(--ey,0) * 1px))}
.m-eye{fill:var(--eye);transform-box:fill-box;transform-origin:center;
  transform:scaleY(calc(var(--blink,1) * var(--wide,1)))}
` : ''}
</style>
</head>
<body>
<div class="vignette"></div>
<div class="stage" id="stage">
  <div class="wordmark" id="wordmark">the boring tek</div>
  <span id="accent-probe" style="position:absolute;left:-999px;color:var(--accent)">a</span>
${isEnd ? `  <div class="m-zone">
    <svg class="mascot" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      ${mascotBody()}
    </svg>
  </div>` : pictogramMarkup(pic)}
${isEnd ? '' : captionMarkup(plan)}
</div>
<script>
window.__CAP_PLAN = ${JSON.stringify(plan)};
window.__CAP_BOX = ${JSON.stringify(CAP_BOX)};
window.__P9 = ${JSON.stringify({ VW, VH, WORDMARK_W: isEnd ? END_WORDMARK_W : WORDMARK_W, isEnd })};
${captionPage.toString()}
${isEnd ? '' : 'captionPage();'}
${isEnd ? '' : `window.__PIC_PLAN = ${JSON.stringify(pictogramPagePlan(pic, SCENE_BOX))};
${pictogramRuntime()}`}
${composedPage.toString()}
composedPage();
</script>
</body>
</html>`;
}

/* ---------- the composed pages' own script ----------
   serialised into the page. the caption half is captions.mjs's and the scene
   half is pictograms.mjs's; this is the wordmark fit, the stage drift, the
   mascot when there is one, and the measurements that are about the whole frame
   rather than about one layer of it. */
function composedPage() {
  const END = window.__P9.isEnd;

  function fitWordmark() {
    const el = document.getElementById('wordmark');
    const s = el.textContent.toUpperCase();
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = '400 100px Michroma';
    /* measured rendered, in caps, because text-transform is invisible to
       measureText and costs michroma about 15% of its width. */
    const em = (cv.measureText(s).width + 0.18 * 100 * s.length) / 100;
    el.style.fontSize = (window.__P9.WORDMARK_W / em).toFixed(3) + 'px';
  }

  /* the highest any caption in this clip can ever reach, measured once. it is
     the tallest card there is, grown about its own baseline by the biggest
     scale the entrance spring takes it to, so the scene layer is checked
     against the worst caption in the whole clip on every frame rather than
     against whichever one happens to be up. that is the stricter test and the
     one that keeps meaning something on a frame with no caption at all.

     the caption box's own top edge is not the ceiling and never was: the box is
     bottom anchored, so its top edge is two hundred px above anything that is
     ever drawn. post7 found that the hard way. */
  function capCeiling() {
    const bottom = window.__CAP_BOX.y + window.__CAP_BOX.h;
    const scale = window.__CAP_PLAN.maxScale || 1;
    let tallest = 0;
    for (const el of document.querySelectorAll('.cap-float,.cap-card,.cap-type,.cap-count')) {
      tallest = Math.max(tallest, el.getBoundingClientRect().height);
    }
    if (!tallest) throw new Error('no caption card had a height — capCeiling would be the box');
    return +(bottom - tallest * scale).toFixed(1);
  }

  window.__p9 = {
    ready: false,
    /* the drift, so no composed frame is a still frame either. it is the same
       under one percent the camera carries over the footage, applied to the
       stage rather than to a camera, because there is no camera here. */
    stage(scale, dy) {
      const el = document.getElementById('stage');
      el.style.transform = 'scale(' + scale.toFixed(5) + ') translateY(' + dy.toFixed(3) + 'px)';
    },
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
    /* the whole frame's safe area, not one layer's. captions.mjs measures its
       own ink and knows nothing about a wordmark or a mascot, and the pictogram
       layer measures its parts rather than the svg element, whose rect would
       report the zone back to us and prove nothing about the shapes in it. */
    safe() {
      let out = window.__cap && window.__cap.ready
        ? { ...window.__cap.safe(window.__P9.VW, window.__P9.VH) }
        : { left: 1e9, top: 1e9, right: 1e9, bottom: 1e9, worst: null };
      const take = (d, who) => {
        if (Math.min(d.left, d.top, d.right, d.bottom)
          < Math.min(out.left, out.top, out.right, out.bottom)) out.worst = who;
        out.left = Math.min(out.left, d.left); out.top = Math.min(out.top, d.top);
        out.right = Math.min(out.right, d.right); out.bottom = Math.min(out.bottom, d.bottom);
      };
      if (window.__pic && window.__pic.ready) {
        const pic = window.__pic.safe(window.__P9.VW, window.__P9.VH);
        if (pic) take(pic, pic.worst);
      }
      for (const sel of ['.mascot', '#wordmark']) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const b = el.getBoundingClientRect();
        if (!b.width && !b.height) continue;
        take({ left: b.left, top: b.top,
          right: window.__P9.VW - b.right, bottom: window.__P9.VH - b.bottom }, sel);
      }
      return out;
    },
    /* how much clear air there is between the lowest visible pictogram and the
       highest a caption can reach, plus how close the layer came to a border on
       the same frame. every number comes twice, once for the ink and once for
       the ink plus the shadow it is throwing right now: the caption is guarded
       against the soft number because the shadow reaches it first, and the
       border against the ink at the frame's floor and the shadow at a lower
       one. both are printed either way, so the cost of the depth pass is a
       number in the log rather than a claim in a comment. */
    zone() {
      if (!window.__pic || !window.__pic.ready) return null;
      const pic = window.__pic.safe(window.__P9.VW, window.__P9.VH);
      if (!pic) return null;
      const ceil = window.__p9.capCeil;
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
        low: pic.low, lowest: pic.lowest, softLow: pic.softLow,
        gap: +(ceil - pic.softLow).toFixed(1),
        inkGap: +(ceil - pic.low).toFixed(1),
        live: top === 1e9 ? null : +(top - pic.softLow).toFixed(1),
        under: top === 1e9 ? null : which,
        near: +Math.min(pic.left, pic.top, pic.right, pic.bottom).toFixed(1),
        softNear: +Math.min(pic.softLeft, pic.softTop, pic.softRight, pic.softBottom).toFixed(1),
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
    /* the accent as it actually computes in this theme, so a guard can ask
       whether it was painted rather than whether a role was set. */
    accent() { return getComputedStyle(document.getElementById('accent-probe')).color; },
    /* the ink a caption word is drawn in, for the contrast probe. */
    capInk() {
      const el = document.querySelector('.cap-w');
      return el ? getComputedStyle(el).color : null;
    },
    /* the union of every visible caption word, in css px, and the caption
       hidden or shown. the probe screenshots the band with the ink out of the
       way, which is the only way to measure what is actually behind it. */
    capBand() {
      let l = 1e9, t = 1e9, r = -1e9, b = -1e9, any = false;
      for (const el of document.querySelectorAll('.cap-w')) {
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden') continue;
        let o = 1, node = el;
        while (node && node !== document.body) { o *= parseFloat(getComputedStyle(node).opacity || '1'); node = node.parentElement; }
        if (o < 0.05) continue;
        const q = el.getBoundingClientRect();
        if (!q.width || !q.height) continue;
        any = true;
        l = Math.min(l, q.left); t = Math.min(t, q.top);
        r = Math.max(r, q.right); b = Math.max(b, q.bottom);
      }
      return any ? { x: +l.toFixed(2), y: +t.toFixed(2), w: +(r - l).toFixed(2), h: +(b - t).toFixed(2) } : null;
    },
    /* opacity and not visibility, and that is a bug rather than a preference.
       visibility is inherited and a descendant may override it — apply() writes
       visibility onto every card on every frame, so a card that is up sets
       itself back to visible and the container hiding itself does nothing. the
       probe was photographing its own ink and reporting the darkest pixel
       behind the caption as the caption. opacity multiplies down the tree, so a
       zero at the top is a zero everywhere. */
    capShow(on) {
      const el = document.querySelector('.cap');
      if (el) el.style.opacity = on ? '' : '0';
    },
  };

  document.fonts.load('400 1em Michroma')
    .then(() => document.fonts.load('500 1em "Space Grotesk"'))
    .then(() => document.fonts.load('700 1em "Space Grotesk"'))
    .then(() => document.fonts.ready)
    .then(() => {
      fitWordmark();
      if (!END) {
        window.__built = window.__cap.build();
        /* the scene layer's own build. no font is involved, but it is built
           here anyway so there is one ready gate rather than two. */
        window.__picBuilt = window.__pic.build();
        /* after the caption is fitted, because it is the fitted size that
           decides how tall the tallest card is. */
        window.__p9.capCeil = capCeiling();
      }
      window.__p9.ready = true;
    });
}

/* ---------- what goes into the live site, before any of its own script ----------
   four jobs: keep the recording offline and deterministic, give the page a
   camera, give it a cursor, and put our caption layer over it. none of it edits
   index.html — the file on disk is served exactly as it is in git and every
   line below runs in the browser on top of it, which is the arrangement
   record.mjs has had since it was written. */
function siteInjected() {
  /* deterministic prng. the page rolls dice for blink gaps, idle lines and the
     cta glitch. same seed, same film, every run. */
  let seed = 0x9e3779b9;
  Math.random = function () {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; seed |= 0;
    return (seed >>> 0) / 4294967296;
  };
  try {
    localStorage.setItem('bt-lang', 'en');
    localStorage.setItem('bt-theme', 'light');
  } catch (e) { /* private mode, the page copes on its own */ }

  /* the page's animation clock. virtual time drives css transitions and timers
     correctly but not requestAnimationFrame: captureScreenshot forces
     BeginFrames and chrome emits five or six per capture, each carrying a
     timestamp 83 to 100ms further on. measured on this page, the rAF clock ran
     5.5x faster than the capture clock, which turned a 280ms blink into a
     flash. so rAF is taken off the compositor and flushed exactly once per
     captured frame. */
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

  /* the page tracks the pointer behind this one query, and it also snaps
     --ex/--ey to zero the instant the form opens. under a moving camera the aim
     is computed against a stale head rect for a frame and the eyes twitch,
     which is visible on every press. answering false switches the tracking off
     at the source: the pointermove, scroll and pointerleave listeners are never
     registered. every other query is passed through, so the hover rules, the
     cta filling under the cursor and the theme query all still work. */
  const realMM = window.matchMedia.bind(window);
  window.matchMedia = function (q) {
    if (q === '(hover: hover) and (pointer: fine)') {
      return { matches: false, media: q, onchange: null,
        addEventListener() { }, removeEventListener() { },
        addListener() { }, removeListener() { }, dispatchEvent() { return false; } };
    }
    return realMM(q);
  };

  /* NOTHING leaves this browser. the press at the end is real as far as the
     page is concerned and goes nowhere. */
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
    /* the 700 the float captions are set in. index.html asks for 400 and 500
       and that stays exactly as it is; this is a second tag added by the rig to
       the rig's own layer, in the browser, on a page that is never served to
       anybody. */
    const fl = document.createElement('link');
    fl.rel = 'stylesheet';
    fl.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap';
    document.head.appendChild(fl);

    /* the camera. everything the page renders goes inside one wrapper and the
       wrapper carries a css transform, so fixed children become fixed to the
       wrapper, which is exactly what a camera wants. this listener is
       registered before the page's own script is parsed, so it runs before
       boot() — which then still finds every node it looks for, one level
       deeper. */
    const cam = document.createElement('div');
    cam.id = 'dm-cam';
    while (document.body.firstChild) cam.appendChild(document.body.firstChild);
    document.body.appendChild(cam);
    document.body.classList.add('dm-noglitch');

    const css = document.createElement('style');
    css.textContent = [
      'html,body{overflow:hidden}',
      '#dm-cam{transform-origin:0 0;will-change:transform}',
      '#dm-ov{position:fixed;inset:0;z-index:2147483647;pointer-events:none;',
      'width:100%;height:100%}',
      '#dm-cur{position:absolute;left:0;top:0;width:30px;height:30px;',
      'transform-origin:5px 3px;will-change:transform;opacity:0}',
      '#dm-ring{position:absolute;left:0;top:0;width:56px;height:56px;margin:-28px 0 0 -28px;',
      'border-radius:50%;border:2px solid rgba(20,24,22,.45);opacity:0;will-change:transform,opacity}',
      /* the wordmark, and on the site passes it is off.

         it rode over the footage in the first render and the render is what
         settled it: index.html has its own wordmark in the footer and a row of
         social icons under it, and a second wordmark at 89% of the frame lands
         on top of both. it also lands on the info cards' copy during beat five.

         the brand is not missing while it is off. beats three and six are
         filmed on the hero, whose h1 is the wordmark at full size, and beats
         one, two and seven carry the small one where it has always been. a
         watermark over a screen recording of our own site is the site's own
         name twice. */
      '#dm-wm{display:' + (window.__P9.wordmark ? 'block' : 'none') + ';position:absolute;left:50%;top:' + window.__P9.WM_Y + 'px;',
      'transform:translate(-50%,-50%);font-family:var(--display);font-weight:400;',
      'color:var(--muted);text-transform:uppercase;letter-spacing:.18em;',
      'white-space:nowrap;line-height:1;text-indent:.09em}',
      /* the eyes never widen. eyesWide() snaps --wide from 1 to 2.2 with no
         transition the moment the form opens, which is a jump. declaring it on
         the eye itself beats the inherited inline value from .mascot. */
      '.m-eye{--wide:1 !important}',
      /* the glitch is frozen while this class is on the body, and the class
         comes off exactly once, on the frame this film wants the shake. the
         page schedules its own every three to five seconds off Math.random,
         and a film cannot have the button glitching whenever it feels like it. */
      'body.dm-noglitch .cta.shake{animation:none !important}',
      'body.dm-noglitch .cta.shake .cta-t{animation:none !important}',
      /* the idle line leaves calmly. the site fades its bubble over .2s, which
         is right for a page and abrupt on film. only the exit is slowed. */
      '.bubble:not(.on) .dot{transition-duration:.55s,.55s,.5s,.5s}',
      '.bubble:not(.on) .pill{transition-duration:.55s,.55s,.5s,.5s,.5s}',
      /* the vignette's breathe becomes ours. it has to, twice over: it is the
         layer the parallax moves at forty percent, and an inline transform
         loses to a running css animation. the rig writes both the breathe and
         the parallax into one transform per frame. */
      '.vignette{animation:none !important}',
    ].join('') + window.__CAP_CSS;
    document.head.appendChild(css);

    const ov = document.createElement('div');
    ov.id = 'dm-ov';
    ov.innerHTML = [
      '<div id="dm-ring"></div>',
      '<svg id="dm-cur" viewBox="0 0 24 24" fill="none">',
      '<path d="M4 2.2 L4 19.4 L8.6 15.2 L11.4 21.4 L14.6 20 L11.9 13.9 L18 13.7 Z"',
      ' fill="#f4f7f5" stroke="#141816" stroke-width="1.5" stroke-linejoin="round"/></svg>',
      '<div id="dm-wm">the boring tek</div>',
      '<span id="dm-accent" style="position:absolute;left:-999px;color:var(--accent)">a</span>',
      window.__CAP_MARKUP,
    ].join('');
    document.body.appendChild(ov);
    /* captions.mjs's own page half, run after its markup is in the document. it
       is handed in as source rather than imported because there is no module
       loader in here, and it is the same function node ran. */
    (0, eval)('(' + window.__CAP_SRC + ')')();

    const curEl = ov.querySelector('#dm-cur');
    const ringEl = ov.querySelector('#dm-ring');
    const wmEl = ov.querySelector('#dm-wm');
    const vig = document.querySelector('.vignette');

    function fitWordmark() {
      const s = wmEl.textContent.toUpperCase();
      const cv = document.createElement('canvas').getContext('2d');
      cv.font = '400 100px Michroma';
      const em = (cv.measureText(s).width + 0.18 * 100 * s.length) / 100;
      wmEl.style.fontSize = (window.__P9.WORDMARK_W / em).toFixed(3) + 'px';
    }

    window.__dm = {
      ready: false,
      cam: { tx: 0, ty: 0, z: 1 },
      /* centre page point (cx,cy) on screen at zoom z */
      setCam(cx, cy, z) {
        const tx = innerWidth / 2 - cx * z, ty = innerHeight / 2 - cy * z;
        this.cam = { tx, ty, z };
        cam.style.transform =
          'translate(' + tx.toFixed(3) + 'px,' + ty.toFixed(3) + 'px) scale(' + z.toFixed(5) + ')';
      },
      /* the background, one layer behind the foreground and moving at forty
         percent of it. the vignette is inside the camera wrapper, so it is
         already carrying the full zoom; multiplying by this puts it back to
         1 + (z-1)*0.4, which is the parallax. the breathe is folded into the
         same transform because there is only one transform to write. */
      bg(z, t) {
        if (!vig) return;
        const p = 0.5 - 0.5 * Math.cos(2 * Math.PI * t / 68);   /* 34s, alternate */
        const k = (1 + (z - 1) * 0.4) / z;
        vig.style.transform = 'scale(' + (k * (1 + 0.045 * p)).toFixed(5)
          + ') translate3d(0,' + (-1.2 * p).toFixed(3) + '%,0)';
        vig.style.opacity = (0.88 + 0.12 * p).toFixed(4);
      },
      /* live screen rect — already carries whatever the camera is doing */
      screenRect(sel) {
        const e = document.querySelector(sel);
        if (!e) return null;
        const b = e.getBoundingClientRect();
        if (!b.width && !b.height) return null;
        return { x: b.left, y: b.top, w: b.width, h: b.height,
          cx: b.left + b.width / 2, cy: b.top + b.height / 2 };
      },
      /* the same rect in page space, camera undone */
      pageRect(sel) {
        const r = this.screenRect(sel);
        if (!r) return null;
        const c = this.cam;
        return {
          x: (r.x - c.tx) / c.z, y: (r.y - c.ty) / c.z, w: r.w / c.z, h: r.h / c.z,
          cx: (r.cx - c.tx) / c.z, cy: (r.cy - c.ty) / c.z,
        };
      },
      /* a page point to centre on, measured off a live element. with fit set,
         the zoom is derived from the element's real size so the shot frames it
         rather than guessing a number that goes stale the moment the card grows
         a step. the top bar is fixed and paints an opaque scrim over its own
         top 42%, so the frame is parked below it and never halfway through it. */
      focus(sel, o) {
        const r = this.pageRect(sel);
        if (!r) return null;
        let z = o.z || 1;
        if (o.fit) {
          z = Math.min((innerWidth - 2 * o.fit) / r.w, (innerHeight - 2 * o.fit) / r.h);
          z = Math.max(o.minZ || 1, Math.min(o.maxZ || 1.09, z));
        }
        const half = innerHeight / 2 / z;
        const doc = document.getElementById('dm-cam').offsetHeight;
        let cy = r.cy + (o.dy || 0);
        cy = Math.max(cy, (o.barTop === 0 ? 0 : 88) + half);
        cy = Math.min(cy, Math.max(doc - half, half));
        return { cx: r.cx, cy: cy, z: z };
      },
      /* ---- a shot that holds a gap on the caption band ----
         the two elements are measured live, their gap's midpoint is taken, and
         the camera is placed so that midpoint lands on screen S. nothing here
         is a page coordinate: move the form a step on and the same call gives
         the shot that keeps the words on empty page. */
      gapShot(a, b, z, S) {
        const ra = this.pageRect(a), rb = this.pageRect(b);
        if (!ra || !rb) return null;
        const mid = (ra.y + ra.h + rb.y) / 2;
        return {
          cx: innerWidth / 2, cy: mid - (S - innerHeight / 2) / z, z: z,
          gap: +(rb.y - (ra.y + ra.h)).toFixed(1), mid: +mid.toFixed(1),
        };
      },
      /* the bottom of the document, for the one shot that is not holding
         anything. clamped so the frame cannot run off either end. */
      docBottom(z) {
        const doc = document.getElementById('dm-cam').offsetHeight;
        const half = innerHeight / 2 / z;
        return { cx: innerWidth / 2, cy: Math.max(half, doc - half), z: z };
      },
      /* ---- what is behind the words ----
         every element on the page with its own text, tested against the caption
         band. it is the geometric half of the contrast probe: the probe says
         how dark it is behind a card, this says what it is. the two disagree
         usefully — a caption over the white middle of a textarea measures fine
         and is still sitting on a form field. */
      bandClash(top, bottom) {
        const hits = [];
        const cam = document.getElementById('dm-cam');
        const walk = el => {
          for (const c of el.children) {
            const own = [...c.childNodes].some(x => x.nodeType === 3 && x.textContent.trim());
            if (own) {
              const b = c.getBoundingClientRect();
              if (b.width > 0 && b.height > 0 && b.bottom > top && b.top < bottom
                && b.right > 0 && b.left < innerWidth) {
                const cs = getComputedStyle(c);
                if (cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.05) {
                  hits.push({
                    what: (typeof c.className === 'string' && c.className
                      ? '.' + c.className.split(' ')[0] : c.tagName.toLowerCase()),
                    over: +(Math.min(b.bottom, bottom) - Math.max(b.top, top)).toFixed(1),
                    text: (c.textContent || '').trim().slice(0, 22),
                  });
                }
              }
            }
            walk(c);
          }
        };
        if (cam) walk(cam);
        hits.sort((x, y) => y.over - x.over);
        return { n: hits.length, worst: hits[0] || null };
      },
      /* the text caret. chrome draws and blinks its own on its own clock, which
         under virtual time is not our clock, so it is driven here instead: solid
         for half a second after a keystroke, then a 530ms blink, which is what
         every editor does and what makes a field being typed into look alive. */
      caret(on) {
        const el = document.querySelector('.pad textarea, .pad input');
        if (el) el.style.caretColor = on ? 'auto' : 'transparent';
      },
      cursor(x, y, scale, alpha) {
        curEl.style.opacity = alpha;
        curEl.style.transform =
          'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) scale(' + scale.toFixed(3) + ')';
      },
      ring(x, y, p) {
        if (p <= 0 || p >= 1) { ringEl.style.opacity = 0; return; }
        ringEl.style.opacity = (1 - p) * 0.85;
        ringEl.style.transform =
          'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) scale(' + (0.3 + p * 1.0).toFixed(3) + ')';
      },
      /* the page's own shake, on our frame. the class is cleared first, because
         a shake the scheduler started while the freeze was on never fired
         animationend and would otherwise start the moment the freeze lifts. */
      glitch() {
        const cta = document.querySelector('.cta');
        if (!cta) return false;
        cta.classList.remove('shake');
        document.body.classList.remove('dm-noglitch');
        void cta.offsetWidth;
        cta.classList.add('shake');
        return true;
      },
      /* the hero's idle, and the proof of it in one call. written after the
         page's own rAF tick so these are the values that render, and read back
         from computed style so what is asserted is what was drawn. */
      hero(ex, ey, blink) {
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
      /* the safe area of what *we* draw. the footage is the frame and is full
         bleed by definition, so the floor applies to the caption and the
         wordmark, which are the two things this rig puts on top of it. the
         cursor is deliberately not in here: it is a pointer, it is meant to
         reach the edges of what it is pointing at, and a platform's chrome does
         not make a cursor unreadable the way it makes a word unreadable. */
      safe() {
        let out = { ...window.__cap.safe(innerWidth, innerHeight) };
        if (!window.__P9.wordmark) return out;
        const b = wmEl.getBoundingClientRect();
        const d = { left: b.left, top: b.top,
          right: innerWidth - b.right, bottom: innerHeight - b.bottom };
        if (Math.min(d.left, d.top, d.right, d.bottom)
          < Math.min(out.left, out.top, out.right, out.bottom)) out.worst = '#dm-wm';
        out.left = Math.min(out.left, d.left); out.top = Math.min(out.top, d.top);
        out.right = Math.min(out.right, d.right); out.bottom = Math.min(out.bottom, d.bottom);
        return out;
      },
      /* the subline is the widest line the page sets, and a zoom that puts it
         in frame and cuts its first and last letter reads as a bug rather than
         as a crop. record.mjs answered that with a flat zoom cap; this answers
         it by looking. */
      clipCheck() {
        const el = document.querySelector('.tag-live') || document.querySelector('.tag');
        if (!el) return null;
        const b = el.getBoundingClientRect();
        if (b.bottom <= 0 || b.top >= innerHeight) return { inFrame: false, clipped: false };
        return {
          inFrame: true,
          clipped: b.left < -0.5 || b.right > innerWidth + 0.5,
          left: +b.left.toFixed(1), right: +b.right.toFixed(1),
        };
      },
      accent() { return getComputedStyle(document.getElementById('dm-accent')).color; },
      capInk() {
        const el = document.querySelector('.cap-w');
        return el ? getComputedStyle(el).color : null;
      },
      /* the union of every visible caption word, and a switch to take the ink
         out of the way so the probe can screenshot what is behind it. */
      capBand() {
        let l = 1e9, t = 1e9, r = -1e9, b = -1e9, any = false;
        for (const el of document.querySelectorAll('.cap-w')) {
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden') continue;
          let o = 1, node = el;
          while (node && node !== document.body) { o *= parseFloat(getComputedStyle(node).opacity || '1'); node = node.parentElement; }
          if (o < 0.05) continue;
          const q = el.getBoundingClientRect();
          if (!q.width || !q.height) continue;
          any = true;
          l = Math.min(l, q.left); t = Math.min(t, q.top);
          r = Math.max(r, q.right); b = Math.max(b, q.bottom);
        }
        return any ? { x: +l.toFixed(2), y: +t.toFixed(2), w: +(r - l).toFixed(2), h: +(b - t).toFixed(2) } : null;
      },
      /* opacity and not visibility, and that is a bug rather than a preference.
       visibility is inherited and a descendant may override it — apply() writes
       visibility onto every card on every frame, so a card that is up sets
       itself back to visible and the container hiding itself does nothing. the
       probe was photographing its own ink and reporting the darkest pixel
       behind the caption as the caption. opacity multiplies down the tree, so a
       zero at the top is a zero everywhere. */
    capShow(on) {
        const el = document.querySelector('.cap');
        if (el) el.style.opacity = on ? '' : '0';
      },
      boxes() {
        if (!window.__P9.wordmark) return { wordmark: null };
        const b = wmEl.getBoundingClientRect();
        return { wordmark: { top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1) } };
      },
    };

    document.fonts.load('400 1em Michroma')
      .then(() => document.fonts.load('500 1em "Space Grotesk"'))
      .then(() => document.fonts.load('700 1em "Space Grotesk"'))
      .then(() => document.fonts.ready)
      .then(() => {
        fitWordmark();
        window.__built = window.__cap.build();
        window.__dm.ready = true;
      });
  }, true);
}

/* ---------- servers ----------
   the real page off disk for the site passes, and a string for the composed
   ones. the site is served from the repo root and nothing is rewritten on the
   way out: what chrome loads is byte for byte the index.html in git. */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.xml': 'application/xml', '.txt': 'text/plain', '.ico': 'image/x-icon',
};
function serveDir() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
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
function serveHtml(html) {
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

/* ---------- the contrast probe ----------
   the one question a caption drawn straight onto footage has to answer, and it
   is not answerable from the layout: how dark is what is behind the words.

   so it is measured. at every card's settled frame the caption is hidden for
   one extra screenshot of its own band, the ink is put back, and the frame that
   ships is captured afterwards — the probe never appears in the film. the band
   comes back as a png because a jpeg would be measuring its own ringing, and
   node inflates it with zlib, which is already in node. no dependency is added
   for this and none is needed: a png is a filtered raster inside one deflate
   stream and that is sixty lines.

   only 8 bit truecolour is handled, with and without alpha, because that is
   what Page.captureScreenshot returns. anything else throws rather than
   guessing, which is the right answer for a measurement. */
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('the probe did not come back a png');
  let p = 8, w = 0, h = 0, bits = 0, type = -1;
  const idat = [];
  while (p + 8 <= buf.length) {
    const len = buf.readUInt32BE(p);
    const tag = buf.toString('ascii', p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (tag === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      bits = data[8]; type = data[9];
      if (data[12] !== 0) throw new Error('the probe png is interlaced');
    } else if (tag === 'IDAT') idat.push(data);
    else if (tag === 'IEND') break;
    p += 12 + len;
  }
  if (bits !== 8 || (type !== 2 && type !== 6)) {
    throw new Error('the probe png is bit depth ' + bits + ' colour type ' + type
      + ', and only 8 bit truecolour is read here');
  }
  const bpp = type === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  let ri = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[ri++];
    const row = y * stride, up = row - stride;
    for (let x = 0; x < stride; x++) {
      const cur = raw[ri + x];
      const a = x >= bpp ? out[row + x - bpp] : 0;
      const b = y > 0 ? out[up + x] : 0;
      const c = (x >= bpp && y > 0) ? out[up + x - bpp] : 0;
      let v;
      if (f === 0) v = cur;
      else if (f === 1) v = cur + a;
      else if (f === 2) v = cur + b;
      else if (f === 3) v = cur + ((a + b) >> 1);
      else if (f === 4) {
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        v = cur + ((pa <= pb && pa <= pc) ? a : (pb <= pc) ? b : c);
      } else throw new Error('the probe png uses filter ' + f);
      out[row + x] = v & 255;
    }
    ri += stride;
  }
  return { w, h, bpp, data: out };
}
/* wcag relative luminance, and the ratio the accessibility floor is written in.
   it is the right measure here for the reason it is the right measure there:
   the question is whether a person can read the word, not whether two colours
   are numerically far apart. */
const toLinear = v => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
const lumaOf = (r, g, b) => 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
function bandLuma(png) {
  let sum = 0, lo = 1, hi = 0, n = 0;
  for (let i = 0; i < png.data.length; i += png.bpp) {
    const l = lumaOf(png.data[i], png.data[i + 1], png.data[i + 2]);
    sum += l; lo = Math.min(lo, l); hi = Math.max(hi, l); n++;
  }
  return { mean: sum / n, lo, hi, n };
}
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/* the floor. 3.0 is where a caption stops being comfortable and 2.0 is where it
   stops being a caption, so the run reports every card against the first and
   fails on the second. it is deliberately not the 4.5 the site holds its body
   copy to: a caption is 88 device px of 700 weight and the thing behind it is
   moving, and holding footage to a body copy floor would mean never putting a
   word over a page at all. */
const CONTRAST_WARN = 3.0;
const CONTRAST_FLOOR = 2.0;

/* ---------- the capture ----------
   one place, so the shutter is one decision rather than four.

   with the shutter shut a frame is one screenshot. with it open a frame is SUB
   screenshots at SUB evenly spaced instants inside its own 1/60th, written to
   their own folder and averaged into one frame afterwards. that is what a
   shutter does, and it is why it is worth SUB times the screenshots rather than
   being approximated by smearing pixels after the fact.

   the guards and the samples run on the frame's own instant, the k=0 one, so a
   blurred render prints the same numbers an unblurred one does rather than SUB
   times as many at a quarter the spacing. */
function frameFile(abs) { return path.join(FRAMES, 'f' + String(abs).padStart(6, '0') + '.jpg'); }
function subFile(i) { return path.join(SUBS, 's' + String(i).padStart(6, '0') + '.jpg'); }

async function shoot(cdp, dest) {
  const shot = await cdp.send('Page.captureScreenshot', {
    format: 'jpeg', quality: 94, captureBeyondViewport: false,
    /* clip.scale is what actually gets device pixels out. a plain
       captureScreenshot hands back css pixels however high the dsf is. */
    clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
  });
  fs.writeFileSync(dest, Buffer.from(shot.data, 'base64'));
}

/* the probe's own screenshot: a png of one band, small, and never part of the
   film. scale 0.5 rather than 2 because a mean does not need device pixels and
   a quarter of the area is a quarter of the inflate. */
async function shootBand(cdp, band) {
  const shot = await cdp.send('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: false,
    clip: {
      x: Math.max(0, band.x - 2), y: Math.max(0, band.y - 2),
      width: Math.min(VW, band.w + 4), height: Math.min(VH, band.h + 4), scale: 0.5,
    },
  });
  return decodePng(Buffer.from(shot.data, 'base64'));
}

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }

/* ---------- the blend ----------
   tmix is a rolling mean of the last N frames, so the frame that is the mean of
   a whole output frame is the last of its N: subframe 3 of 0..3, 7 of 4..7, and
   so on. trim throws away the first N-1, which are means of a window reaching
   back before the pass, and framestep then keeps every Nth of what is left.

   it is written that way to avoid punctuation. select=eq(mod(n,4),3) says the
   same thing and needs its commas escaped past three layers of quoting; it
   silently parsed as a filter called "4)" the first time scenes-test tried it.

   it runs per pass, and that is the whole reason the passes keep their
   subframes apart: a rolling mean that reached across a cut would average the
   last frames of one shot into the first frames of the next, which is a
   dissolve, and a dissolve is not what a cut is. */
function blendPass(name, frames, f0) {
  console.log('    blending ' + frames * SUB + ' subframes into ' + frames + ' frames ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS * SUB), '-i', subFile(0).replace(/s\d+\.jpg$/, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1)
      + ',setpts=PTS-STARTPTS,framestep=' + SUB,
    '-start_number', String(f0), '-q:v', '2',
    frameFile(0).replace(/f\d+\.jpg$/, 'f%06d.jpg')]);
  let made = 0;
  for (let i = 0; i < frames; i++) if (fs.existsSync(frameFile(f0 + i))) made++;
  if (made !== frames) {
    throw new Error('pass ' + name + ' blended ' + made + ' frames for ' + frames
      + ' captured — the subframe window is off by one and the film would be the wrong length');
  }
  fs.rmSync(SUBS, { recursive: true, force: true });
  fs.mkdirSync(SUBS, { recursive: true });
}

/* ---------- a browser page, set up the way every clip in here sets one up ---- */
async function openPage(browser, url, before) {
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });
  for (const fn of before) await page.evaluateOnNewDocument(fn.fn, ...(fn.args || []));
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
  await cdp.send('Page.navigate', { url });
  return { page, cdp, advance };
}

/* offline the whole film renders in the mono fallback and looks almost right,
   which is the worst kind of wrong to ship. 700 is checked with the other two
   because it is the weight the captions are actually set in and a miss would
   fall back to 400 rather than to mono, which is even quieter. */
async function checkFaces(page) {
  const faces = await page.evaluate(() => ({
    michroma: document.fonts.check('40px Michroma'),
    grotesk: document.fonts.check('400 20px "Space Grotesk"'),
    'grotesk 700': document.fonts.check('700 20px "Space Grotesk"'),
  }));
  for (const [k, v] of Object.entries(faces)) {
    if (!v) throw new Error(k + ' did not load — the film would be set in the fallback');
  }
}

/* ---------- pass A and pass D: the composed frames ---------- */
async function renderComposed(browser, o) {
  const { kind, plan, pic, f0, f1, blinks, samples } = o;
  const isEnd = kind === 'end';
  const N = f1 - f0;
  console.log('  pass ' + o.name + ' (' + kind + '): frames ' + f0 + '..' + (f1 - 1)
    + ', ' + (f0 / FPS).toFixed(2) + '..' + (f1 / FPS).toFixed(2) + 's'
    + (BLUR ? ', ' + SUB + ' subframes each' : ''));

  const { srv, port } = await serveHtml(composedHtml(kind, plan, pic));
  const { page, cdp, advance } = await openPage(browser, 'http://127.0.0.1:' + port + '/', [
    { fn: composedInjected },
  ]);
  let burned = 0;
  for (let i = 0; i < 200; i++) {
    const ok = await page.evaluate(() => !!(window.__p9 && window.__p9.ready
      && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP); burned += STEP;
  }
  if (!await page.evaluate(() => !!(window.__p9 && window.__p9.ready))) {
    throw new Error('pass ' + o.name + ' never became ready');
  }
  await checkFaces(page);
  console.log('    ready after ' + burned.toFixed(0) + 'ms of virtual time');

  const out = { name: o.name, kind, f0, f1, frames: N };
  if (!isEnd) {
    out.built = await page.evaluate(() => window.__built);
    out.picBuilt = await page.evaluate(() => window.__picBuilt);
    out.capCeil = await page.evaluate(() => window.__p9.capCeil);
    /* the gsap clock, checked before a jpeg is written. the layer runs on the
       rAF shim and the shim is flushed once per capture, so gsap's own time has
       to be the capture index over the capture rate — exactly, not nearly. with
       the shutter open the capture rate is fps times the subframe count, which
       is why sync is told about it. */
    const sync = await page.evaluate((fps, count, sub) => window.__pic.sync(fps, count, sub),
      FPS, 16, SUB);
    console.log('    gsap ' + out.picBuilt.gsap + ', ' + out.picBuilt.eases + ' house eases, '
      + out.picBuilt.parts + ' parts, ' + out.picBuilt.drawn + ' line drawn, '
      + out.picBuilt.staggered + ' staggered — worst |gsap t - i/(fps*sub)| = ' + sync.worst + 's');
    if (!(Number(sync.worst) < 1e-6)) {
      throw new Error('the pictogram timeline is not on the capture clock — ' + sync.worst + 's off');
    }
    console.log('    cards fitted at ' + out.built.size.toFixed(1) + 'px, ceiling y='
      + out.capCeil.toFixed(0) + ', zone ' + SCENE_BOX.y + '..' + (SCENE_BOX.y + SCENE_BOX.h));
  }
  const ink = await page.evaluate(() => window.__p9.capInk());
  out.boxes = await page.evaluate(() => window.__p9.boxes());

  let safeWorst = null, sawAccent = false, capMoved = 0, prevSum = null, maxVisible = 0;
  const safeSamples = [], contrast = [];
  let zoneWorst = null, picSafeWorst = null, picSoftWorst = null;
  const zoneSamples = [], picFaults = [];
  let picTicks = 0, picMoved = 0, picStirred = 0, picApplied = 0, picPrevSum = null, picPrev = null;
  let wideSeen = null, lastTx = null, lastTy = null, gazeJump = { d: 0, t: 0 };
  let lastBlink = null, blinkJump = { d: 0, t: 0 };
  const eyeFaults = [], blinkSteps = [];
  const sampled = new Set();
  let picNext = 0;
  const picSamples = isEnd ? [] : o.picSamples;

  const wall = Date.now();
  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = (f0 + f) / FPS + k / (FPS * SUB);
      const first = k === 0;

      /* the stage drift, so no composed frame is a still frame either. */
      const dr = driftAt(t);
      await page.evaluate((s, dy) => window.__p9.stage(s, dy), 1 + dr.z, dr.y * 0.35);

      if (!isEnd) {
        const frame = captionFrame(plan, t);
        const picF = sceneFrame(pic, t, {});
        const seen = await page.evaluate((fr, pf) => {
          window.__cap.apply(fr);
          window.__pic.set(pf);
          const accent = window.__p9.accent();
          const vis = [...document.querySelectorAll('.cap-float')]
            .filter(el => getComputedStyle(el).visibility !== 'hidden'
              && parseFloat(getComputedStyle(el).opacity) > 0.02);
          /* painted, not "has the active role": the accent is a colour and the
             guard should ask about the colour. */
          const acc = vis.some(g => [...g.querySelectorAll('*')]
            .some(el => getComputedStyle(el).color === accent));
          return { vis: vis.length, acc };
        }, frame, picF);
        if (first) {
          if (seen.acc) sawAccent = true;
          maxVisible = Math.max(maxVisible, seen.vis);
          const sum = frame.w.reduce((a, w) => a + w[0] + w[1], 0);
          if (prevSum !== null) capMoved = Math.max(capMoved, Math.abs(sum - prevSum));
          prevSum = sum;
          /* the scene layer's one frame movement guards, run in node against
             the same numbers the page is about to be handed. every part holds a
             value at every instant, including long before and after its own
             steps, so these compare unconditionally: there is no "it was
             invisible so it is allowed to have jumped" case to make an
             exception for, which is exactly the exception a snap would hide in. */
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
              for (let c = 0; c < b.length; c++) picStirred = Math.max(picStirred, Math.abs(b[c] - a[c]));
              if (Math.abs(b[0] - a[0]) > PART_FADE_LIMIT) picFaults.push({ t, what: 'fade', who });
              if (Math.abs(b[1] - a[1]) > PART_SCALE_LIMIT) picFaults.push({ t, what: 'scale', who });
              if (d > PART_MOVE_LIMIT) picFaults.push({ t, what: 'move', who });
              if (Math.abs(b[4] - a[4]) > PART_ROT_LIMIT) picFaults.push({ t, what: 'turn', who });
              if (Math.abs(b[5] - a[5]) > PART_DASH_LIMIT) picFaults.push({ t, what: 'draw', who });
              if (Math.abs(b[6] - a[6]) > PART_LIFT_LIMIT) picFaults.push({ t, what: 'shadow', who });
            }
          }
          picPrev = picF;
        }
      }

      /* one rAF tick, exactly one capture's worth. this is where the pictogram
         frame set above actually lands. */
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);

      if (isEnd) {
        /* the mascot, written last so it is what renders, and read back from
           computed style so what is asserted is what was drawn. */
        const eye = await page.evaluate((ex, ey, bl) => window.__p9.life(ex, ey, bl),
          keyAt(o.eyeKeys.x, t, EASE_IO), keyAt(o.eyeKeys.y, t, EASE_IO), blinkFrom(blinks, t));
        if (first) {
          const mx = (eye[0].match(/matrix\(([^)]*)\)/) || [0, '0,0,0,0,0,0'])[1].split(',');
          const tx = parseFloat(mx[4]) || 0, ty = parseFloat(mx[5]) || 0;
          if (wideSeen === null) wideSeen = eye[1];
          else if (eye[1] !== wideSeen) eyeFaults.push({ t, what: 'wide', was: wideSeen, now: eye[1] });
          if (lastTx !== null) {
            const d = Math.hypot(tx - lastTx, ty - lastTy);
            if (d > gazeJump.d) gazeJump = { d, t };
            if (d > GAZE_LIMIT) eyeFaults.push({ t, what: 'gaze' });
          }
          lastTx = tx; lastTy = ty;
          if (lastBlink !== null) {
            const d = Math.abs(eye[2] - lastBlink);
            if (d > blinkJump.d) blinkJump = { d, t };
            if (d > BLINK_LIMIT) blinkSteps.push({ t, from: lastBlink, to: eye[2] });
          }
          lastBlink = eye[2];
        }
      } else if (first) {
        const picLast = await page.evaluate(() => window.__pic.last);
        if (!picLast) picFaults.push({ t, what: 'never ticked', who: 'the rAF shim' });
        else {
          picTicks = picLast.ticks;
          if (picLast.t !== picPrev.t) picFaults.push({ t, what: 'stale frame', who: 'applied ' + picLast.t });
          /* node and the page build the same timeline from the same plan with
             the same builder, so the numbers gsap produced in the browser and
             the ones the guards above ran on must be the same numbers. this is
             the check that says so, on every frame, and it is what makes one
             motion core with two readers honest rather than hopeful. */
          if (picLast.drift > 1e-4) picFaults.push({ t, what: 'gsap drift', who: picLast.drift + ' off node' });
          if (picPrevSum !== null) picApplied = Math.max(picApplied, Math.abs(picLast.sum - picPrevSum));
          picPrevSum = picLast.sum;
        }
      }

      if (first && !isEnd) {
        while (picNext < picSamples.length && t >= picSamples[picNext].t) {
          const s = picSamples[picNext++];
          const z = await page.evaluate(() => window.__p9.zone());
          if (!z) continue;
          zoneSamples.push({ at: s.who, t: +t.toFixed(3), gap: z.gap, inkGap: z.inkGap,
            live: z.live, under: z.under, near: z.near, softNear: z.softNear });
          if (!zoneWorst || z.gap < zoneWorst.gap) zoneWorst = { at: s.who, t: +t.toFixed(3), ...z };
          if (!picSafeWorst || z.near < picSafeWorst.near) picSafeWorst = { at: s.who, t: +t.toFixed(3), ...z };
          if (!picSoftWorst || z.softNear < picSoftWorst.softNear) picSoftWorst = { at: s.who, t: +t.toFixed(3), ...z };
        }
      }

      /* one sample per card, on the frame it is fully sprung. every card is a
         different width, so one sample would prove nothing about the widest. */
      if (first) {
        for (const s of samples) {
          if (sampled.has(s.i) || t < s.t) continue;
          sampled.add(s.i);
          const sa = await page.evaluate(() => window.__p9.safe());
          safeSamples.push({ card: s.i, t: +t.toFixed(3), ...sa });
          if (!safeWorst || Math.min(sa.left, sa.top, sa.right, sa.bottom)
            < Math.min(safeWorst.left, safeWorst.top, safeWorst.right, safeWorst.bottom)) {
            safeWorst = { t: +t.toFixed(3), ...sa };
          }
          const c = await probeContrast(page, cdp, ink, s, t);
          if (c) contrast.push(c);
        }
      }

      await shoot(cdp, BLUR ? subFile(idx) : frameFile(f0 + f));
      await advance(SUBSTEP);
    }
    if (f % 240 === 0) {
      console.log('    ' + String(f).padStart(4) + '/' + N + '  t=' + ((f0 + f) / FPS).toFixed(2)
        + 's  ' + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
    }
  }
  await page.close();
  srv.close();
  if (BLUR) blendPass(o.name, N, f0);

  return {
    ...out, safeWorst, safeSamples, contrast, sawAccent, capMoved, maxVisible,
    eyeFaults, blinkSteps, gazeJump, blinkJump, wide: wideSeen, blinks: blinks.length,
    pic: isEnd ? null : {
      ticks: picTicks, moved: +picMoved.toFixed(4), stirred: +picStirred.toFixed(4),
      applied: +picApplied.toFixed(4), faults: picFaults.slice(0, 12), faultCount: picFaults.length,
      zone: zoneWorst, border: picSafeWorst, soft: picSoftWorst,
      samples: zoneSamples.length, wanted: picSamples.length, list: zoneSamples,
    },
  };
}

/* ---------- the contrast probe, run at a card's settled frame ----------
   hide the ink, screenshot the band it occupies, put the ink back, and measure
   what was underneath. the film's own frame is captured after this, so nothing
   the probe does is ever in it. */
async function probeContrast(page, cdp, ink, s, t) {
  const band = await page.evaluate(() => (window.__dm || window.__p9).capBand());
  if (!band || band.w < 2 || band.h < 2) return null;
  await page.evaluate(() => (window.__dm || window.__p9).capShow(false));
  let png;
  try { png = await shootBand(cdp, band); }
  finally { await page.evaluate(() => (window.__dm || window.__p9).capShow(true)); }
  const bg = bandLuma(png);
  const m = /rgba?\(([^)]+)\)/.exec(ink || '');
  if (!m) return null;
  const [r, g, b] = m[1].split(',').map(v => parseFloat(v));
  const fg = lumaOf(r, g, b);
  return {
    card: s.i, t: +t.toFixed(3), text: s.text,
    mean: +ratio(fg, bg.mean).toFixed(2),
    worst: +Math.min(ratio(fg, bg.lo), ratio(fg, bg.hi)).toFixed(2),
    bg: +bg.mean.toFixed(4), px: bg.n,
  };
}

/* the composed pages' shim. the same rAF queue the site gets and the same
   seeded random, minus the camera and the cursor, which a composed frame has no
   use for. */
function composedInjected() {
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

const CURSOR_HOME = { x: VW + 70, y: VH + 70 };   /* off frame, bottom right */

/* ---------- pass B and pass C: the live site under a camera ---------- */
async function renderSite(browser, o) {
  const { plan, f0, f1, shot: sp, samples, blinks } = o;
  const N = f1 - f0;
  console.log('  pass ' + o.name + ' (the site): frames ' + f0 + '..' + (f1 - 1)
    + ', ' + (f0 / FPS).toFixed(2) + '..' + (f1 / FPS).toFixed(2) + 's'
    + (BLUR ? ', ' + SUB + ' subframes each' : ''));

  const { srv, port } = await serveDir();
  const { page, cdp, advance } = await openPage(browser, 'http://127.0.0.1:' + port + '/', [
    {
      fn: (plan2, box, markup, css, src, extra) => {
        window.__CAP_PLAN = plan2; window.__CAP_BOX = box;
        window.__CAP_MARKUP = markup; window.__CAP_CSS = css; window.__CAP_SRC = src;
        window.__P9 = extra;
      },
      args: [plan, CAP_BOX, captionMarkup(plan), captionCss(plan, CAP_BOX, { tokens: false }),
        captionPage.toString(),
        { VW, VH, WORDMARK_W, WM_Y: WORDMARK_CY, wordmark: false }],
    },
    { fn: siteInjected },
  ]);

  let burned = 0;
  for (let i = 0; i < 260; i++) {
    const ok = await page.evaluate(() => !!(window.__dm && window.__dm.ready
      && window.__cap && window.__cap.ready
      && document.fonts.status === 'loaded' && document.querySelector('.cta'))).catch(() => false);
    if (ok) break;
    await advance(STEP); burned += STEP;
  }
  if (!await page.evaluate(() => !!(window.__dm && window.__dm.ready))) {
    throw new Error('pass ' + o.name + ' never became ready');
  }
  await checkFaces(page);
  const posts0 = await page.evaluate(() => window.__dmPosts || 0);
  console.log('    ready after ' + burned.toFixed(0) + 'ms of virtual time');

  /* pass C is a second load of the same page in the middle of the film, so it
     has to arrive already alive rather than arriving as a page load: the
     wordmark decode and the subline typing are the site's opening move and it
     only gets to make it once. these are shim ticks with the clock advancing
     and nothing captured, which is exactly what the page would have spent if it
     had been on screen for those seconds. */
  if (o.settle) {
    for (let i = 0; i < o.settle; i++) {
      await page.evaluate(now => window.__dmRaf(now), (i + 1) * STEP);
      await advance(STEP);
    }
    console.log('    settled ' + o.settle + ' ticks (' + (o.settle / 60).toFixed(2) + 's) before frame zero');
  }

  const built = await page.evaluate(() => window.__built);
  const ink = await page.evaluate(() => window.__dm.capInk());
  /* the caption band, measured rather than assumed: the real ceiling of the
     tallest card this clip has, down to the box's own floor, with three css px
     of grace either side. everything that asks "is the band clear" asks it
     about this. */
  const band = await page.evaluate(box => {
    const bottom = box.y + box.h;
    let tallest = 0;
    for (const el of document.querySelectorAll('.cap-float')) {
      tallest = Math.max(tallest, el.getBoundingClientRect().height);
    }
    return { top: +(bottom - tallest * 1.125 - 3).toFixed(1), bottom: +(bottom + 3).toFixed(1) };
  }, CAP_BOX);
  console.log('    the caption band is ' + band.top + '..' + band.bottom
    + ' css px, and it does not move');

  /* a shot is a spec until the page is asked. nothing in the plan is a page
     coordinate and this is where that stays true. */
  const resolve = async spec => {
    if (spec.gap) {
      const r = await page.evaluate((a, b, z, S) => window.__dm.gapShot(a, b, z, S),
        spec.gap[0], spec.gap[1], spec.z, BAND_S);
      if (!r) console.warn('    ! ' + spec.gap.join(' to ') + ' had no rect yet, holding');
      return r;
    }
    if (spec.docBottom) return page.evaluate(z => window.__dm.docBottom(z), spec.z);
    return { cx: spec.cx, cy: spec.cy, z: spec.z };
  };

  let cam = await resolve(sp.start);
  let leg = null, legState = null;
  const fired = new Set();
  const moveFrom = new Map();
  let cursor = { ...CURSOR_HOME }, cursorAlpha = 0;
  let pressAt = -99, pressPoint = { x: 0, y: 0 };
  const presses = [], clipFaults = [], camTrail = [], legs = [];
  const clashes = [];
  let lastKey = -99, clashHeld = 0, clashMoving = 0;
  let zClampLow = 0, zClampHigh = 0;
  let safeWorst = null, sawAccent = false, capMoved = 0, prevSum = null, maxVisible = 0;
  const safeSamples = [], contrast = [];
  const sampled = new Set();
  let wideSeen = null, lastTx = null, lastTy = null, gazeJump = { d: 0, t: 0 };
  let lastBlink = null, blinkJump = { d: 0, t: 0 };
  const eyeFaults = [], blinkSteps = [];
  let glitched = false, typed = 0, reveal = null;

  const wall = Date.now();
  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = (f0 + f) / FPS + k / (FPS * SUB);
      const first = k === 0;

      /* --- the one shot actions, each fired once --- */
      for (const c of sp.cues) {
        if (fired.has(c) || c.t > t) continue;
        fired.add(c);
        if (c.key === 'Backspace') {
          /* a real key through the page's own input listener, so the site's
             state goes wrong and comes right the way it would for a visitor. */
          await page.keyboard.press('Backspace');
          typed++; lastKey = t;
        } else if (c.press) {
          const r = await page.evaluate(s => window.__dm.screenRect(s), c.press);
          if (!r) { console.warn('    ! press target missing: ' + c.press + ' @' + t.toFixed(2) + 's'); continue; }
          /* press wherever the cursor actually is, and record both, so the
             check afterwards runs on real numbers rather than on intent. */
          const px = cursor.x, py = cursor.y;
          const inside = px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
          presses.push({ t: +t.toFixed(3), frame: f0 + f, sel: c.press,
            cursor: { x: +px.toFixed(1), y: +py.toFixed(1) }, rect: r, inside });
          pressAt = t; pressPoint = { x: px, y: py };
          await page.mouse.click(px, py, { delay: 16 });
        } else if (c.key !== undefined) {
          await page.keyboard.type(c.key, { delay: 0 });
          typed++; lastKey = t;
        } else if (c.glitch) {
          glitched = await page.evaluate(() => window.__dm.glitch());
        } else if (c.reveal) {
          reveal = await page.evaluate(() => {
            const cds = [...document.querySelectorAll('.cards .cd')];
            const own = cds.filter(e => e.classList.contains('in')).length;
            let forced = 0;
            for (const e of cds) if (!e.classList.contains('in')) { e.classList.add('in'); forced++; }
            return { cards: cds.length, own, forced };
          });
        }
      }

      /* --- the camera --- */
      let active = null;
      /* half a frame of tolerance, and it is a real bug rather than a nicety.
         a pass begins on the frame nearest its own start, which can round to a
         hair before the leg that opens it — so frame zero of pass C found no
         active leg, sat on the shot it was cutting from, and was counted as a
         held frame with the page own text behind the caption. it only showed at
         60fps, because at 12 the rounding went the other way. a leg that starts
         within half a frame of now has started. */
      for (const l of sp.legs) if (t >= l.t0 - 0.5 / FPS) active = l;
      let moving = false;
      if (active) {
        if (leg !== active) {
          leg = active;
          const to = await resolve(active.to);
          legState = camLeg(cam, to || cam, active.t1 - active.t0, active.ease);
          if (to && to.gap !== undefined) {
            legs.push({ beat: active.beat || null, anchor: active.anchor || null,
              ease: active.ease, t0: +active.t0.toFixed(3), t1: +active.t1.toFixed(3),
              frames: Math.round((active.t1 - active.t0) * FPS),
              z: to.z, gap: to.gap, at: +t.toFixed(3) });
          }
        }
        cam = legState.at(t - active.t0);
        moving = t <= active.t1 + 1e-9;
      }
      /* the half second after a press counts as motion too, and that is the
         metric being right rather than being lenient. pressing the cta removes
         .off from the card, which reflows everything below it by about 230
         page px on the very next frame — so the page is moving under a camera
         that is not. a frame where the page is rearranging itself is not a
         shot anybody reads a caption on, and counting it as held would ask the
         camera to chase a layout that has not finished happening. */
      if (t - pressAt < PAGE_SETTLE) moving = true;
      const dr = driftAt(t);
      const z = clampTo(cam.z * (1 + dr.z), 1.0, 1.85);
      if (cam.z * (1 + dr.z) < 1.0) zClampLow++;
      if (cam.z * (1 + dr.z) > 1.85) zClampHigh++;
      await page.evaluate((c, tt) => { window.__dm.setCam(c.cx, c.cy, c.z); window.__dm.bg(c.z, tt); },
        { cx: cam.cx, cy: cam.cy + dr.y, z }, t);
      if (first) camTrail.push({ t: +t.toFixed(2), z: +z.toFixed(4), cy: +cam.cy.toFixed(1) });

      /* --- the cursor ---
         the target is re-measured every frame, so the hand stays glued to an
         element the camera is still moving under it. */
      let leadMove = null;
      for (const m of sp.moves) if (t >= m.t0) leadMove = m;
      if (leadMove) {
        if (!moveFrom.has(leadMove)) moveFrom.set(leadMove, { ...cursor });
        const from = moveFrom.get(leadMove);
        const p = EASE_OUT(clampTo((t - leadMove.t0) / Math.max(leadMove.t1 - leadMove.t0, 1e-6), 0, 1));
        const r = leadMove.home ? { cx: CURSOR_HOME.x, cy: CURSOR_HOME.y }
          : await page.evaluate(s => window.__dm.screenRect(s), leadMove.sel);
        if (r) cursor = { x: lerp(from.x, r.cx, p), y: lerp(from.y, r.cy, p) };
        cursorAlpha = Math.min(1, cursorAlpha + 0.14);
      }
      const since = t - pressAt;
      let scale = 1, ringP = -1;
      if (since >= 0 && since < 0.28) {
        const q = since / 0.28;
        scale = 1 - 0.2 * Math.sin(Math.min(q * 3.4, 1) * Math.PI);
        ringP = q;
      }
      /* the caret: solid for half a second after a key, then blinking. */
      const sinceKey = t - lastKey;
      const caretOn = lastKey < 0 ? false
        : sinceKey < 0.5 ? true : (Math.floor((sinceKey - 0.5) / 0.53) % 2 === 0);
      await page.evaluate((x, y, s, a, rx, ry, rp, cOn) => {
        window.__dm.cursor(x, y, s, a);
        window.__dm.ring(rx, ry, rp);
        window.__dm.caret(cOn);
      }, cursor.x, cursor.y, scale, cursorAlpha, pressPoint.x, pressPoint.y, ringP, caretOn);

      /* --- the captions, over all of it --- */
      const frame = captionFrame(plan, t);
      const seen = await page.evaluate(fr => {
        window.__cap.apply(fr);
        const accent = window.__dm.accent();
        const vis = [...document.querySelectorAll('.cap-float')]
          .filter(el => getComputedStyle(el).visibility !== 'hidden'
            && parseFloat(getComputedStyle(el).opacity) > 0.02);
        const acc = vis.some(g => [...g.querySelectorAll('*')]
          .some(el => getComputedStyle(el).color === accent));
        return { vis: vis.length, acc };
      }, frame);
      if (first) {
        if (seen.acc) sawAccent = true;
        maxVisible = Math.max(maxVisible, seen.vis);
        const sum = frame.w.reduce((a, w) => a + w[0] + w[1], 0);
        if (prevSum !== null) capMoved = Math.max(capMoved, Math.abs(sum - prevSum));
        prevSum = sum;
      }

      /* --- one rAF tick for the page, exactly one capture's worth --- */
      await page.evaluate(now => window.__dmRaf(now), ((o.settle || 0) + idx + 1) * SUBSTEP);

      /* --- the hero's idle, written last so it is what renders --- */
      const eye = await page.evaluate((ex, ey, bl) => window.__dm.hero(ex, ey, bl),
        keyAt(o.eyeKeys.x, t, EASE_IO), keyAt(o.eyeKeys.y, t, EASE_IO), blinkFrom(blinks, t));
      if (first) {
        const mx = (eye[0].match(/matrix\(([^)]*)\)/) || [0, '0,0,0,0,0,0'])[1].split(',');
        const tx = parseFloat(mx[4]) || 0, ty = parseFloat(mx[5]) || 0;
        if (wideSeen === null) wideSeen = eye[1];
        else if (eye[1] !== wideSeen) eyeFaults.push({ t, what: 'wide', was: wideSeen, now: eye[1] });
        if (lastTx !== null) {
          const d = Math.hypot(tx - lastTx, ty - lastTy);
          if (d > gazeJump.d) gazeJump = { d, t };
          if (d > GAZE_LIMIT) eyeFaults.push({ t, what: 'gaze' });
        }
        lastTx = tx; lastTy = ty;
        if (lastBlink !== null) {
          const d = Math.abs(eye[2] - lastBlink);
          if (d > blinkJump.d) blinkJump = { d, t };
          if (d > BLINK_LIMIT) blinkSteps.push({ t, from: lastBlink, to: eye[2] });
        }
        lastBlink = eye[2];

        /* the subline, checked rather than capped. it is the widest line the
           page sets, and the only thing that matters is whether it is on screen
           and cut. */
        const cc = await page.evaluate(() => window.__dm.clipCheck());
        if (cc && cc.inFrame && cc.clipped) {
          clipFaults.push({ t: +t.toFixed(3), z: +z.toFixed(3), left: cc.left, right: cc.right });
        }

        /* is anything written sitting behind the words. a clash while the camera
           is mid move is a transient and is counted separately; a clash on a
           held frame is the defect, because that is a shot somebody looks at. */
        const bc = await page.evaluate((a, b) => window.__dm.bandClash(a, b), band.top, band.bottom);
        if (bc.n) {
          if (moving) clashMoving++;
          else {
            clashHeld++;
            clashes.push({ t: +t.toFixed(3), n: bc.n, what: bc.worst.what,
              over: bc.worst.over, text: bc.worst.text });
          }
        }

        for (const s of samples) {
          if (sampled.has(s.i) || t < s.t) continue;
          sampled.add(s.i);
          const sa = await page.evaluate(() => window.__dm.safe());
          safeSamples.push({ card: s.i, t: +t.toFixed(3), ...sa });
          if (!safeWorst || Math.min(sa.left, sa.top, sa.right, sa.bottom)
            < Math.min(safeWorst.left, safeWorst.top, safeWorst.right, safeWorst.bottom)) {
            safeWorst = { t: +t.toFixed(3), ...sa };
          }
          const c = await probeContrast(page, cdp, ink, s, t);
          if (c) contrast.push(c);
        }
      }

      await shoot(cdp, BLUR ? subFile(idx) : frameFile(f0 + f));
      await advance(SUBSTEP);
    }
    if (f % 240 === 0) {
      console.log('    ' + String(f).padStart(4) + '/' + N + '  t=' + ((f0 + f) / FPS).toFixed(2)
        + 's  ' + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
    }
  }

  const posts = await page.evaluate(() => window.__dmPosts || 0);
  await page.close();
  srv.close();
  if (BLUR) blendPass(o.name, N, f0);

  return {
    name: o.name, kind: 'site', f0, f1, frames: N, built,
    safeWorst, safeSamples, contrast, sawAccent, capMoved, maxVisible,
    presses, clipFaults, camTrail, legs, band, glitched, typed, reveal,
    clashHeld, clashMoving, clashes: clashes.slice(0, 10),
    posts: posts - posts0,
    zClampLow, zClampHigh,
    eyeFaults, blinkSteps, gazeJump, blinkJump, wide: wideSeen, blinks: blinks.length,
  };
}

/* ---------- the voice, cached ----------
   the sidecar json is the cache key. if it is there and it is for this script,
   the endpoint is left alone, which also means a re-render cannot quietly
   change the timeline under a film that was already approved. */
async function voice() {
  const cached = path.join(VOICE_OUT, 'post9-calm.json');
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === SCRIPT.replace(/\s+/g, ' ').trim() && fs.existsSync(j.file)) {
      console.log('  voice from cache: ' + j.voiceId + ', ' + j.seconds.toFixed(2)
        + 's, ' + j.words.length + ' words, timings from the ' + j.timing);
      return j;
    }
  }
  const r = await speak(SCRIPT, { voice: 'calm', name: 'post9' });
  console.log('  voice: ' + r.voiceId + ', ' + r.seconds.toFixed(2) + 's, '
    + r.words.length + ' words, timings from the ' + r.timing);
  return r;
}

function encode(audioFile) {
  const out = path.join(OUT, 'post9-1080x1920.mp4');
  console.log('  encoding ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%06d.jpg'),
    '-i', audioFile,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
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

/* pull frames back out of the finished mp4, so what is looked at is what
   shipped rather than what we meant to ship. */
function sampleFrames(mp4, at) {
  const dir = path.join(OUT, 'verify-post9');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const [t, name] of at) {
    ff(['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(t),
      '-i', mp4, '-frames:v', '1', path.join(dir, name + '.png')]);
  }
  return dir;
}

/* how long the film runs past its last word. the end card has to be looked at,
   and the ding under it needs somewhere to decay. longer than post7's 1.10
   because this is a card rather than a beat, and a card is the last thing a
   viewer sees before the loop starts again. */
const TAIL = 1.40;

/* ---------- go ---------- */
async function main() {
  console.log('the boring tek — social clip #9, the pitch reel');
  console.log('  the shutter is ' + (BLUR ? 'open, ' + SUB + ' subframes to a frame'
    : 'shut — this is the timing pass, use --blur for the final'));
  brandTokens();      /* fail here, before a long render, if a token has moved */

  const v = await voice();
  const beats = beatsFrom(v.words, LINES);
  const SECONDS = +(v.seconds + TAIL).toFixed(2);
  console.log('  ' + SECONDS.toFixed(2) + 's = ' + v.seconds.toFixed(2)
    + 's of voice plus a ' + TAIL.toFixed(2) + 's tail');
  console.log('  the beats, off the reading:');
  for (const b of beats) {
    console.log('    ' + String(b.i + 1) + '  ' + b.start.toFixed(2).padStart(6) + '..'
      + b.end.toFixed(2).padStart(6) + '  ' + b.line);
  }

  /* ---------- the captions ----------
     beats one to six. beat seven is the end card and the end card is clean:
     the wordmark on it says "the boring tek" and the line being said is "the
     boring tek, we do the boring part", so a caption there would be the frame
     repeating itself in two typefaces. dropping it is also what makes the last
     card of the film land on a cut rather than fading out over a hold. */
  const capWords = v.words.slice(0, beats[5].b + 1);
  const FLASH = flashCells(beats);
  const plan = planCaptions(capWords, {
    style: 'float', perCard: 3, floatSize: 44,
    /* a comma is a clause boundary and this script is full of them. without
       this, "if ai can do it, we build it" cuts a card that reads "do it we",
       which is three words that were never a phrase. the voice carries the
       boundary and a card cannot. */
    cardBreak: /[.,!?;:]["')\]]?$/,
    flash: (word, i) => FLASH.has(i),
  });
  console.log(describe(plan));
  console.log('  compressed: ' + (plan.tight.compressed.length
    ? plan.tight.compressed.map(c => '"' + c.text + '" ' + c.for.toFixed(2) + 's').join(', ')
    : 'none'));

  /* ---------- the pictogram scene, beats one and two ---------- */
  const pic = planScenes(buildScenes(beats));
  if (Math.abs(pic.seconds - beats[2].start) > 0.005) {
    console.error('\n  FAILED — the scene ends at ' + pic.seconds.toFixed(2)
      + 's and pass A cuts at ' + beats[2].start.toFixed(2) + 's.');
    process.exit(1);
  }
  console.log(describeScenes(pic));
  const picMotion = sceneMotion(pic, FPS, beats[2].start);
  {
    const w = picMotion.worst;
    console.log('  the scene layer, walked at ' + FPS + 'fps before rendering:');
    console.log('    biggest one-frame move  ' + w.partM.d.toFixed(3) + ' units on ' + w.partM.who
      + '   limit ' + PART_MOVE_LIMIT.toFixed(2));
    console.log('    biggest one-frame scale ' + w.partS.d.toFixed(3) + ' on ' + w.partS.who
      + '   limit ' + PART_SCALE_LIMIT.toFixed(2));
    console.log('    biggest one-frame draw  ' + w.partD.d.toFixed(3) + ' on ' + w.partD.who
      + '   limit ' + PART_DASH_LIMIT.toFixed(2));
    console.log('    biggest one-frame fade  ' + w.partO.d.toFixed(3) + ' on ' + w.partO.who
      + '   limit ' + PART_FADE_LIMIT.toFixed(2));
    console.log('    biggest one-frame lift  ' + w.partL.d.toFixed(3) + ' on ' + w.partL.who
      + '   limit ' + PART_LIFT_LIMIT.toFixed(2));
    const bad = [];
    if (w.partM.d > PART_MOVE_LIMIT) bad.push(w.partM.who + ' moves ' + w.partM.d.toFixed(3) + ' units in a frame');
    if (w.partS.d > PART_SCALE_LIMIT) bad.push(w.partS.who + ' scales ' + w.partS.d.toFixed(3) + ' in a frame');
    if (w.partD.d > PART_DASH_LIMIT) bad.push(w.partD.who + ' draws ' + w.partD.d.toFixed(3) + ' of itself in a frame');
    if (w.partO.d > PART_FADE_LIMIT) bad.push(w.partO.who + ' fades ' + w.partO.d.toFixed(3) + ' in a frame');
    if (w.partR.d > PART_ROT_LIMIT) bad.push(w.partR.who + ' turns ' + w.partR.d.toFixed(2) + ' deg in a frame');
    if (w.partL.d > PART_LIFT_LIMIT) bad.push(w.partL.who + ' shadow jumps ' + w.partL.d.toFixed(3) + ' in a frame');
    if (bad.length) {
      console.error(['', 'FAILED before rendering — the scene layer snaps', ...bad].join('\n  '));
      process.exit(1);
    }
  }

  /* ---------- the cuts ---------- */
  const fr = s => Math.round(s * FPS);
  const CUTS = [
    { name: 'A', kind: 'composed', f0: 0, f1: fr(beats[2].start), at: 0 },
    { name: 'B', kind: 'site', f0: fr(beats[2].start), f1: fr(beats[5].start - SNAP), at: beats[2].start },
    /* pass C is pre rolled by the length of its own snap, so the zoom lands on
       beat six's first word rather than leaving on it. the cut is then eight
       frames of anticipation, which is what a cut before a line is for. */
    { name: 'C', kind: 'site', f0: fr(beats[5].start - SNAP), f1: fr(beats[6].start), at: beats[5].start - SNAP },
    { name: 'D', kind: 'end', f0: fr(beats[6].start), f1: fr(SECONDS), at: beats[6].start },
  ];
  console.log('  four passes, ' + fr(SECONDS) + ' frames, cutting at '
    + CUTS.slice(1).map(c => c.at.toFixed(2) + 's').join(' and '));

  const site = planSite(beats);
  console.log('  the camera: ' + (site.B.legs.length + site.C.legs.length) + ' legs on '
    + [...site.B.legs, ...site.C.legs].map(l => l.ease).join(', ')
    + ', ' + [...site.B.cues, ...site.C.cues].filter(c => c.press).length + ' presses, '
    + site.B.typing.chars + ' characters typed over '
    + (site.B.typing.to - site.B.typing.from).toFixed(2) + 's');

  /* one sample per caption card, on the frame it is fully sprung, routed to
     whichever pass is on screen then. */
  const SETTLE = 0.30;
  const allSamples = plan.groups.map(g => ({
    i: g.i, t: Math.min(g.out - 0.02, g.words[g.words.length - 1].start + SETTLE),
    text: g.words.map(w => w.word).join(' '),
  }));
  const forPass = c => allSamples.filter(s => fr(s.t) >= c.f0 && fr(s.t) < c.f1);
  /* the scene layer, sampled where it is actually moving: the midpoint of every
     step of every part, plus the scene once it has settled. a sample on a
     resting frame proves nothing about a line that is halfway drawn. */
  const picSamples = [];
  for (const p of pic.parts) for (const st of p.steps) picSamples.push({ t: st.t + st.for / 2, who: p.id + ' ' + st.kind });
  for (const sc of pic.scenes) picSamples.push({ t: Math.min(sc.leaving - 0.05, sc.settled + 0.20), who: sc.id + ' settled' });
  picSamples.sort((a, b) => a.t - b.t);

  /* ---------- the sound ----------
     built before a single jpeg is written, for the same reason the scene
     preflight is: an audio fault costs two seconds to find here and twenty
     minutes of rendering at any later point.

     every cue comes out of a plan that already exists. the card pops are the
     cards' own entrance times, the deep pops are the words the caption engine
     already marked for the accent, the clicks are the presses and the
     keystrokes the camera plan already schedules, the servos are the two legs
     that plan already calls snaps, and the whooshes are the cuts. nothing below
     is a time typed by hand. */
  const cues = [
    ...cuesFromCaptions(plan),
    ...plan.flashed.map(f => ({ t: f.at, kind: 'popDeep', from: 'money word "' + f.word + '"' })),
    ...CUTS.slice(1).map(c => ({ t: c.at, kind: 'whoosh', from: 'the cut to pass ' + c.name })),
    ...[...site.B.legs, ...site.C.legs].filter(l => l.snap)
      .map(l => ({ t: l.t0, kind: 'servo', from: 'the camera snapping to ' + l.to.sel })),
    ...[...site.B.cues, ...site.C.cues].filter(c => c.press)
      .map(c => ({ t: c.t, kind: 'click', from: 'pressing ' + c.press })),
    ...site.B.cues.filter(c => c.key !== undefined)
      .map(c => ({ t: c.t, kind: 'click', opts: { len: 0.06 }, from: 'a keystroke' })),
    { t: beats[6].start, kind: 'ding', from: 'the end card' },
    /* sized to the room it has rather than cut to fit it. a swell whose tail is
       chopped off by the end of the film is a click. */
    { t: beats[6].start, kind: 'hum',
      opts: { len: +Math.max(0.8, SECONDS - beats[6].start - 0.06).toFixed(3) },
      from: 'the end card holding' },
  ].sort((a, b) => a.t - b.t);

  const voicePcm = decode(ffmpeg, v.file);
  const env = voiceEnvelope(v.words, SECONDS);
  const sfx = renderSfx(cues, SECONDS);
  const mix = mixdown(voicePcm, sfx.buf, env, { duck: DUCK, voiceGain: VOICE_TRIM });
  /* the rule, measured on the two buffers that are about to be summed rather
     than argued from the gain table: wherever a word is actually being said,
     the bus is quieter than the voice. it runs before the loudness pass,
     because that pass moves both by the same amount and cannot change the
     answer. */
  const under = checkUnderVoice(mix.voiceOut, mix.bus);

  const wav = path.join(OUT, 'post9-mix.wav');
  const base = mix.out.slice();
  const passes = [];
  let lift = 0, after = null, lim = null;
  for (let i = 0; i < 6; i++) {
    mix.out.set(base);
    if (lift) applyGain(mix.out, lift);
    lim = limit(mix.out, PEAK_CEILING);
    writeWav(wav, mix.out);
    after = loudness(ffmpeg, wav);
    passes.push({ lift, lufs: after.lufs, tp: after.truePeak, gr: lim.reduction });
    if (!after.ok || Math.abs(after.lufs - TARGET_LUFS) <= 0.3) break;
    lift = +(lift + TARGET_LUFS - after.lufs).toFixed(2);
  }
  const before = passes[0];

  console.log('  the mix:');
  console.log(describeMix(sfx.report, {
    'voice': v.seconds.toFixed(2) + 's, ' + v.words.length + ' words, peak '
      + dbfs(mix.voiceRawPeak).toFixed(1) + ' dB as decoded and '
      + dbfs(mix.voicePeak).toFixed(1) + ' dB in the mix',
    'balance': VOICE_TRIM.toFixed(1) + ' dB on the voice ('
      + (Math.pow(10, VOICE_TRIM / 20) * 100).toFixed(0)
      + '% of where it was), effects at their own levels, no music track',
    'effects bus': 'peak ' + dbfs(mix.busPeak).toFixed(1) + ' dB after ducking, '
      + (20 * Math.log10(1 - DUCK)).toFixed(1) + ' dB down while a word is being said',
    'under the voice': under.over.length
      ? under.over.length + ' window(s) where an effect is louder than the voice'
      : 'yes, in all ' + under.windows + ' windows a word is being spoken in. the closest is '
        + (-under.worst.db).toFixed(1) + ' dB under at ' + under.worst.at.toFixed(2) + 's',
    'loudness': after.ok
      ? before.lufs.toFixed(1) + ' LUFS at unity, ' + (lift >= 0 ? '+' : '') + lift
        + ' dB and a limiter applied over ' + passes.length + ' pass(es), '
        + after.lufs.toFixed(1) + ' LUFS delivered (target ' + TARGET_LUFS + ')'
      : 'ebur128 is not in this ffmpeg build, so the mix was left at unity',
    'limiter': lim.reduction.toFixed(1) + ' dB of gain reduction at its hardest, peak '
      + lim.peak.toFixed(2) + ' dBFS',
    'true peak': (after.truePeak == null ? '?' : after.truePeak.toFixed(1))
      + ' dBTP (ceiling ' + PEAK_CEILING + ')',
  }));

  /* ---------- render ---------- */
  const statePath = path.join(OUT, 'post9-1080x1920.json');
  let state;
  if (ONLY_ENCODE) {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    console.log('  re-encoding the render in ' + path.relative(ROOT, statePath)
      + ': ' + state.frames + ' frames, shutter '
      + (state.blur ? state.sub + ' subframes' : 'shut'));
  } else {
    if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
    fs.rmSync(FRAMES, { recursive: true, force: true });
    fs.rmSync(SUBS, { recursive: true, force: true });
    fs.mkdirSync(FRAMES, { recursive: true });
    fs.mkdirSync(SUBS, { recursive: true });
    fs.mkdirSync(OUT, { recursive: true });
    console.log('  post9-1080x1920: ' + VW * DSF + 'x' + VH * DSF + ', ' + fr(SECONDS) + ' frames'
      + (BLUR ? ', ' + fr(SECONDS) * SUB + ' captures' : ''));

    const browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: true,
      args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none',
        '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio'],
    });
    const wall = Date.now();
    const out = [];
    out.push(await renderComposed(browser, {
      name: 'A', kind: 'scenes', plan, pic, f0: CUTS[0].f0, f1: CUTS[0].f1,
      blinks: [], samples: forPass(CUTS[0]), picSamples,
    }));
    out.push(await renderSite(browser, {
      name: 'B', plan, f0: CUTS[1].f0, f1: CUTS[1].f1, shot: site.B,
      samples: forPass(CUTS[1]),
      blinks: blinkList(beats[2].start, beats[5].start, 0x91c4a7),
      /* pass B loads the page fresh at the cut, and index.html opens by
         scrambling its own h1 through a decode. on camera that spends the
         first two seconds of the site footage rendering THE BORING TEK as
         SHE / 7/RING / MEK, which is the brand name arriving as a glitch. so
         the page is given four seconds of its own clock before frame zero and
         the cut lands on a settled hero. the decode still happens, it just
         happens off camera, which is where a page load belongs in a film. */
      eyeKeys: eyesFor(beats[2].start), settle: 240,
    }));
    out.push(await renderSite(browser, {
      name: 'C', plan, f0: CUTS[2].f0, f1: CUTS[2].f1, shot: site.C,
      samples: forPass(CUTS[2]),
      blinks: blinkList(beats[5].start, beats[6].start, 0x2d77f1),
      eyeKeys: eyesFor(beats[5].start - 3.2), settle: 180,
    }));
    out.push(await renderComposed(browser, {
      name: 'D', kind: 'end', plan, pic, f0: CUTS[3].f0, f1: CUTS[3].f1,
      blinks: blinkList(beats[6].start, SECONDS, 0x5ac31b), samples: [],
      eyeKeys: eyesFor(beats[6].start - 1.4), picSamples: [],
    }));
    await browser.close();
    state = { seconds: SECONDS, frames: fr(SECONDS), blur: BLUR, sub: SUB, fps: FPS,
      cuts: CUTS, passes: out, minutes: +((Date.now() - wall) / 60000).toFixed(2) };
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    console.log('  rendered in ' + state.minutes.toFixed(1) + ' minutes');
  }

  /* every frame in the sequence must exist, or ffmpeg silently stops at the
     first hole and the film comes out short. */
  {
    const missing = [];
    for (let i = 0; i < state.frames && missing.length < 5; i++) {
      if (!fs.existsSync(frameFile(i))) missing.push(i);
    }
    if (missing.length) {
      console.error('\n  FAILED — frames missing from the sequence: ' + missing.join(', '));
      process.exit(1);
    }
  }

  const file = encode(wav);
  const p = probe(file);
  const mb = (fs.statSync(file).size / 1e6).toFixed(2) + ' MB';
  console.log('  ' + p.w + 'x' + p.h + ' @' + p.fps + 'fps ' + p.seconds.toFixed(2) + 's  '
    + (p.audio ? 'with voice' : 'SILENT') + '  ' + mb + '  ' + path.relative(ROOT, file));

  const dir = sampleFrames(file, [
    [beats[0].words[1].start + 0.55, 'a-the-core-arrives'],
    [beats[1].words[2].start + 0.55, 'b-the-system-grows'],
    [beats[1].words[8].start + 0.35, 'c-the-links-draw'],
    [Math.max(0, beats[2].start - 0.10), 'd-last-frame-of-the-pictograms'],
    [beats[2].start + 0.60, 'e-the-hero'],
    [beats[3].start + 0.18, 'f-mid-snap-zoom'],
    [beats[3].start + 1.20, 'g-the-path-pressed'],
    [beats[3].start + 1.30, 'h-typing'],
    [beats[4].start + 1.90, 'i-the-cards'],
    [beats[5].start + 1.05, 'j-the-glitch'],
    [beats[5].start + 2.20, 'k-pressed'],
    [beats[6].start + 0.40, 'l-the-end-card'],
    [SECONDS - 2 / FPS, 'm-last-frame'],
  ]);
  console.log('  frames sampled into ' + path.relative(ROOT, dir));

  report(state, plan, pic, beats, site, cues, sfx, mix, under, after, lim, passes, v, p, SECONDS, CUTS);
  guard(state, plan, pic, beats, site, cues, sfx, mix, under, after, lim, v, p, SECONDS, CUTS);

  if (!KEEP && !ONLY_ENCODE) {
    fs.rmSync(FRAMES, { recursive: true, force: true });
    fs.rmSync(SUBS, { recursive: true, force: true });
  }
  console.log('\nall checks passed.');
}

/* ---------- what the run prints ----------
   the numbers the brief asked for, and the ones the guards below are about to
   run on. everything here is measured off the render rather than restated from
   the plan, which is the difference between a report and a summary. */
function report(state, plan, pic, beats, site, cues, sfx, mix, under, after, lim, passes, v, p, SECONDS, CUTS) {
  const dev = x => Math.round(x * DSF);
  const A = state.passes.find(x => x.name === 'A');
  const B = state.passes.find(x => x.name === 'B');
  const C = state.passes.find(x => x.name === 'C');
  const D = state.passes.find(x => x.name === 'D');

  console.log('\n  ---- the film ----');
  console.log('  ' + p.seconds.toFixed(2) + 's, ' + FPS + 'fps, ' + VW * DSF + 'x' + VH * DSF
    + ', ' + state.frames + ' frames, shutter ' + (state.blur ? state.sub + ' subframes' : 'shut'));
  for (const c of CUTS) {
    const q = state.passes.find(x => x.name === c.name);
    console.log('    pass ' + c.name + '  ' + (c.f0 / FPS).toFixed(2).padStart(6) + '..'
      + (c.f1 / FPS).toFixed(2).padStart(6) + 's  ' + String(c.f1 - c.f0).padStart(4)
      + ' frames  ' + c.kind + (q && q.contrast ? '  ' + q.contrast.length + ' card(s)' : ''));
  }

  console.log('\n  ---- platform safe margins, device px ----');
  console.log('    floors: ' + SAFE.top + ' top, ' + SAFE.bottom + ' bottom, '
    + SAFE.left + ' left, ' + SAFE.right + ' right');
  let worstSafe = null;
  for (const q of state.passes) {
    if (!q.safeWorst) { console.log('    pass ' + q.name + '  no card was up in this pass'); continue; }
    const s = q.safeWorst;
    const near = Math.min(s.left, s.top, s.right, s.bottom);
    if (!worstSafe || near < worstSafe.near) worstSafe = { pass: q.name, near, ...s };
    console.log('    pass ' + q.name + '  ' + dev(s.left) + ' left, ' + dev(s.top) + ' top, '
      + dev(s.right) + ' right, ' + dev(s.bottom) + ' bottom   tightest is ' + s.worst
      + ' at ' + s.t.toFixed(2) + 's');
  }
  {
    /* each edge against its own floor, because one worst number cannot say
       whether the bottom is clear when the sides are. */
    const edge = k => state.passes.reduce((a, q) => q.safeWorst
      ? Math.min(a, q.safeWorst[k]) : a, 1e9);
    let bad = 0;
    for (const k of ['top', 'bottom', 'left', 'right']) {
      const v = edge(k);
      if (v > 1e8) continue;
      const ok = Math.round(v * DSF) >= SAFE[k];
      if (!ok) bad++;
      console.log('    ' + k.padEnd(7) + String(Math.round(v * DSF)).padStart(5)
        + 'px   floor ' + String(SAFE[k]).padStart(4) + (ok ? '   clear' : '   VIOLATION'));
    }
    if (!bad) console.log('    every edge clear of the platform chrome on every pass');
  }
  console.log('    content width: the caption box is ' + CAP_BOX.w + ' of ' + VW + ' css px, '
    + (CAP_BOX.w / VW * 100).toFixed(1) + '% (cap 75%); the pictogram zone is '
    + (SCENE_BOX.w / VW * 100).toFixed(1) + '%');
  console.log('    the wordmark sits at ' + (WORDMARK_CY / VH * 100).toFixed(1)
    + '% of the frame, ' + Math.round((VH - WORDMARK_CY - 10) * DSF)
    + 'px of clear air under its ink (floor ' + SAFE.bottom + ')');
  console.log('    the 88 to 90% band is retired: it sits inside the platform bottom strip');

  console.log('\n  ---- the caption zone, and it does not move ----');
  {
    const b = (state.passes.find(q => q.band) || {}).band;
    console.log('    box      ' + CAP_BOX.x + '..' + (CAP_BOX.x + CAP_BOX.w) + ' x '
      + CAP_BOX.y + '..' + (CAP_BOX.y + CAP_BOX.h) + ' css, bottom anchored');
    if (b) {
      console.log('    ink band ' + b.top + '..' + b.bottom + ' css  ('
        + Math.round(b.top * DSF) + '..' + Math.round(b.bottom * DSF) + ' device px, '
        + (b.top / VH * 100).toFixed(1) + '% to ' + (b.bottom / VH * 100).toFixed(1) + '% of the frame)');
      console.log('    clear of the bottom edge by ' + Math.round((VH - b.bottom) * DSF)
        + 'px (floor ' + SAFE.bottom + '), of the sides by ' + Math.round(CAP_BOX.x * DSF)
        + 'px (floor ' + SAFE.left + ')');
    }
    console.log('    one zone for all four passes: the camera moves, the words do not');
    let held = 0, mov = 0;
    for (const q of state.passes) { held += q.clashHeld || 0; mov += q.clashMoving || 0; }
    console.log('    site text behind the words: ' + held + ' held frame(s), '
      + mov + ' frame(s) mid move');
    for (const q of state.passes) {
      if (!q.clashes || !q.clashes.length) continue;
      for (const c of q.clashes.slice(0, 4)) {
        console.log('      pass ' + q.name + '  ' + c.t.toFixed(2) + 's  ' + c.what
          + ' overlaps ' + c.over + 'px  "' + c.text + '"');
      }
    }
  }

  console.log('\n  ---- the camera: where each move landed ----');
  console.log('    a move anchored "land" is pre rolled so it ends on its beat first word;');
  console.log('    one anchored "start" opens a pass, where the cut is the move.');
  {
    const fr = x => Math.round(x * FPS);
    for (const q of state.passes) {
      for (const l of (q.legs || [])) {
        const bt = l.beat ? beats[l.beat - 1] : null;
        const mark = l.anchor === 'land' ? l.t1 : l.t0;
        const err = bt ? fr(mark) - fr(bt.start) : null;
        console.log('    pass ' + q.name + '  ' + String(l.frames).padStart(3) + 'f  '
          + l.ease.padEnd(6) + ' z=' + l.z.toFixed(2) + '  gap ' + String(l.gap).padStart(5) + 'px  '
          + (bt ? 'beat ' + l.beat + ' ' + l.anchor + ' at ' + bt.start.toFixed(2) + 's  error '
            + (err > 0 ? '+' : '') + err + ' frame(s)' : 'a reframe, on no beat'));
      }
    }
  }

  console.log('\n  ---- the hand ----');
  {
    const ty = site.B.typing;
    const g = ty.gaps.slice().sort((a, b) => a - b);
    const mean = g.reduce((a, b) => a + b, 0) / g.length;
    console.log('    "' + TYPED + '", ' + TYPED.length + ' characters plus a typo and its fix');
    console.log('    ' + ty.from.toFixed(2) + '..' + ty.to.toFixed(2) + 's, gaps '
      + Math.round(g[0] * 1000) + ' to ' + Math.round(g[g.length - 1] * 1000)
      + 'ms, mean ' + Math.round(mean * 1000) + 'ms');
    console.log('    a 200ms hesitation before character ' + ty.hesitateAt
      + ', and character ' + ty.typoAt + ' typed wrong, noticed and deleted');
    console.log('    fitted by ' + (ty.scale * 100).toFixed(0) + '% to the room the beat has');
    const B = state.passes.find(q => q.name === 'B');
    if (B) console.log('    ' + B.typed + ' keystrokes went through the page own input listener');
  }

  console.log('\n  ---- captions over footage: contrast behind the ink ----');
  console.log('    measured on the band each card occupies, with the ink hidden for one');
  console.log('    extra screenshot. warn under ' + CONTRAST_WARN.toFixed(1)
    + ', fail under ' + CONTRAST_FLOOR.toFixed(1) + '.');
  const allC = state.passes.flatMap(q => (q.contrast || []).map(c => ({ pass: q.name, ...c })));
  const low = allC.filter(c => c.mean < CONTRAST_WARN).sort((a, b) => a.mean - b.mean);
  /* two different questions, and they want two different numbers.

     the mean answers "can this be read", and it is the one the floor is written
     against: the site is a white page and a caption on it clears seventeen to
     one whatever else is going on.

     the darkest pixel answers "is any of the page's own ink directly behind a
     word", and that is the collision the brief asked to have reported. it is
     not a failure — a bold glyph crossing a form label is what a captioned
     screen recording looks like — but it is the thing to look at in the stills,
     so every card it happens to is named with its second. */
  const hit = allC.filter(c => c.worst < CONTRAST_WARN).sort((a, b) => a.worst - b.worst);
  for (const q of state.passes) {
    const cs = q.contrast || [];
    if (!cs.length) continue;
    const w = cs.reduce((a, b) => (a === null || b.mean < a.mean) ? b : a, null);
    const dk = cs.reduce((a, b) => (a === null || b.worst < a.worst) ? b : a, null);
    console.log('    pass ' + q.name + '  ' + cs.length + ' card(s), worst mean '
      + w.mean.toFixed(2) + ':1 at ' + w.t.toFixed(2) + 's on "' + w.text + '"');
    console.log('              darkest pixel behind any card ' + dk.worst.toFixed(2)
      + ':1 at ' + dk.t.toFixed(2) + 's on "' + dk.text + '"');
  }
  if (low.length) {
    console.log('    ' + low.length + ' card(s) whose whole band is under '
      + CONTRAST_WARN.toFixed(1) + ' — these are readability problems:');
    for (const c of low.slice(0, 8)) {
      console.log('      ' + c.mean.toFixed(2) + ':1  pass ' + c.pass + '  ' + c.t.toFixed(2)
        + 's  "' + c.text + '"');
    }
  } else {
    console.log('    every card clears ' + CONTRAST_WARN.toFixed(1)
      + ':1 on the mean, so every card is readable.');
  }
  if (hit.length) {
    console.log('    ' + hit.length + ' card(s) have some of the page own ink behind them.');
    console.log('    this is the caption zone meeting the footage, and it is where to look:');
    for (const c of hit) {
      console.log('      ' + c.worst.toFixed(2) + ':1 darkest  pass ' + c.pass + '  '
        + c.t.toFixed(2) + 's  "' + c.text + '"');
    }
  } else {
    console.log('    nothing the page draws ever sits directly behind a caption word.');
  }

  if (A && A.pic) {
    console.log('\n  ---- pass A, the pictograms ----');
    console.log('    ' + A.picBuilt.parts + ' parts, ' + A.picBuilt.drawn + ' line drawn, '
      + A.picBuilt.staggered + ' staggered, ' + A.pic.ticks + ' rAF ticks for ' + A.frames + ' frames');
    console.log('    biggest one-frame part move ' + A.pic.moved.toFixed(3) + ' units (limit '
      + PART_MOVE_LIMIT.toFixed(2) + '), biggest change on any channel ' + A.pic.stirred.toFixed(3)
      + ', ' + (A.pic.faultCount || 'no') + ' fault(s)');
    if (A.pic.zone) {
      console.log('    the scenes never get closer than ' + A.pic.zone.gap.toFixed(0)
        + 'px to the caption ceiling at y=' + A.capCeil.toFixed(0) + ' (floor ' + SCENE_CLEARANCE
        + ', closest at ' + A.pic.zone.t.toFixed(2) + 's) — that is the shadow; the ink stops '
        + A.pic.zone.inkGap.toFixed(0) + 'px short');
      console.log('    and ' + dev(A.pic.border.near) + 'px to the nearest border (floors '
        + SAFE.top + '/' + SAFE.bottom + '/' + SAFE.left + '), the shadow '
        + dev(A.pic.soft.softNear) + 'px');
    }
  }

  console.log('\n  ---- the site passes ----');
  for (const q of [B, C]) {
    if (!q) continue;
    const zs = q.camTrail.map(r => r.z);
    console.log('    pass ' + q.name + '  zoom ' + Math.min(...zs).toFixed(3) + '..'
      + Math.max(...zs).toFixed(3) + ', ' + q.presses.length + ' press(es), '
      + q.clipFaults.length + ' frame(s) with the subline cropped, ' + q.posts + ' form post(s) intercepted'
      + (q.zClampLow + q.zClampHigh ? ', zoom clamped on ' + (q.zClampLow + q.zClampHigh) + ' frame(s)' : ''));
    for (const pr of q.presses) {
      const dx = pr.cursor.x - (pr.rect.x + pr.rect.w / 2);
      const dy = pr.cursor.y - (pr.rect.y + pr.rect.h / 2);
      console.log('      ' + pr.t.toFixed(2).padStart(6) + 's  ' + pr.sel.padEnd(30)
        + (pr.inside ? 'inside' : 'OUTSIDE') + '  ' + dx.toFixed(0) + ',' + dy.toFixed(0)
        + ' off centre');
    }
    if (q.typed) console.log('      ' + q.typed + ' character(s) typed into the field');
    if (q.reveal) {
      console.log('      the info cards: ' + q.reveal.cards + ' of them, '
        + q.reveal.own + ' revealed by the page own observer, ' + q.reveal.forced
        + ' by the rig adding the class the page would have');
    }
    if (q.name === 'C') console.log('      the glitch ' + (q.glitched ? 'played' : 'DID NOT PLAY'));
  }

  console.log('\n  ---- the mascot ----');
  for (const q of state.passes) {
    if (!q.gazeJump || !q.gazeJump.d) continue;
    console.log('    pass ' + q.name + '  ' + q.blinks + ' blinks, biggest one-frame gaze move '
      + q.gazeJump.d.toFixed(3) + ' (limit ' + GAZE_LIMIT.toFixed(2) + '), biggest lid step '
      + q.blinkJump.d.toFixed(3) + ' (limit ' + BLINK_LIMIT.toFixed(2) + '), --wide held at ' + q.wide);
  }

  console.log('\n  ---- for the editor ----');
  console.log('  ' + SECONDS.toFixed(2) + 's, ' + FPS + 'fps, ' + VW * DSF + 'x' + VH * DSF
    + ', voice and effects already in the file');
  console.log('  voice: ' + v.voiceId + ' at rate ' + v.rate + ', pitch ' + v.pitch + ', '
    + v.words.length + ' words, timings from the ' + v.timing);
  console.log('  the beats, and what the camera does on each:');
  const does = [
    'pictograms: the core arrives, then small and big',
    'pictograms: four nodes, four links, the middle lights up',
    'the site: a slow push on the hero, the cta pressed on the last word',
    'the site: snap zoom to the form, a path option pressed, a field typed',
    'the site: a drift down to the cards, background at 40%',
    'the site, freshly loaded: zoom to the cta, the glitch, the press',
    'the end card: wordmark, mascot, ding, hold',
  ];
  beats.forEach((b, i) => {
    console.log('    ' + (i + 1) + '  ' + b.start.toFixed(2).padStart(6) + 's  ' + does[i]);
  });
  console.log('  the accent lands on ' + plan.flashed.length + ' word(s): '
    + plan.flashed.map(f => '"' + f.word + '" at ' + f.at.toFixed(2) + 's').join(', '));
  console.log('  captions clear at ' + plan.seconds.toFixed(2) + 's, the end card runs '
    + beats[6].start.toFixed(2) + '..' + SECONDS.toFixed(2) + 's');
  console.log('  ' + sfx.report.length + ' effects: '
    + Object.entries(sfx.report.reduce((a, r) => (a[r.kind] = (a[r.kind] || 0) + 1, a), {}))
      .map(([k, n]) => n + ' ' + k).join(', '));
}

/* ---------- the guards ----------
   the same shape as every other clip in here: the thing must have happened, it
   must have happened everywhere it was supposed to, and every claim the log
   makes about it must be a measurement. */
function guard(state, plan, pic, beats, site, cues, sfx, mix, under, after, lim, v, p, SECONDS, CUTS) {
  const fail = [];
  const A = state.passes.find(x => x.name === 'A');
  const B = state.passes.find(x => x.name === 'B');
  const C = state.passes.find(x => x.name === 'C');
  const D = state.passes.find(x => x.name === 'D');

  /* the file. */
  if (p.w !== VW * DSF || p.h !== VH * DSF) fail.push('not ' + VW * DSF + 'x' + VH * DSF);
  if (Math.abs(p.fps - FPS) > 0.5) fail.push('not ' + FPS + 'fps');
  if (Math.abs(p.seconds - SECONDS) > 0.2) fail.push(p.seconds + 's, wanted ' + SECONDS);
  if (!p.audio) fail.push('no audio track — the voice did not mux');
  if (p.seconds < v.seconds - 0.05) {
    fail.push('the file is ' + p.seconds.toFixed(2) + 's and the voice is '
      + v.seconds.toFixed(2) + 's — the end of the line is missing');
  }
  /* the passes have to tile the film exactly. a gap or an overlap here is a
     frame counted twice or not at all, and either one changes the length. */
  {
    let n = 0;
    for (let i = 0; i < CUTS.length; i++) {
      if (i && CUTS[i].f0 !== CUTS[i - 1].f1) fail.push('pass ' + CUTS[i].name + ' does not start where pass ' + CUTS[i - 1].name + ' ends');
      n += CUTS[i].f1 - CUTS[i].f0;
    }
    if (n !== state.frames) fail.push('the four passes cover ' + n + ' frames and the film is ' + state.frames);
    for (const q of state.passes) {
      if (q.frames !== q.f1 - q.f0) fail.push('pass ' + q.name + ' rendered ' + q.frames + ' of ' + (q.f1 - q.f0) + ' frames');
    }
  }
  if (state.blur !== BLUR || state.sub !== SUB) {
    fail.push('the state was rendered with the shutter ' + (state.blur ? 'open' : 'shut')
      + ' and this run says ' + (BLUR ? 'open' : 'shut'));
  }

  /* the captions. */
  if (plan.style !== 'float') fail.push('the caption plan is not the float style');
  if (plan.punctuation !== 'drop') fail.push('the caption plan kept its punctuation');
  if (!plan.bared.count) fail.push('no card lost any punctuation, and this script is full of full stops');
  {
    const bad = plan.cells.filter(c => /[,.;:!]$/.test(c.word));
    if (bad.length) fail.push(bad.length + ' card word(s) still end in punctuation, first "' + bad[0].word + '"');
  }
  if (plan.tight.late.length) {
    fail.push(plan.tight.late.length + ' card(s) leave before their own last word is said');
  }
  if (!plan.flashed.length) fail.push('the accent was never marked on any word');
  if (plan.flashed.length > 8) {
    fail.push(plan.flashed.length + ' words are marked for the accent — that is not sparingly');
  }
  /* the last card must belong to beat six. a caption over the end card would be
     the frame saying the same thing twice in two typefaces. */
  if (plan.seconds > beats[6].start + 0.02) {
    fail.push('the captions run to ' + plan.seconds.toFixed(2) + 's and the end card starts at '
      + beats[6].start.toFixed(2) + 's — the end card is not clean');
  }
  {
    const samples = state.passes.reduce((a, q) => a + (q.safeSamples ? q.safeSamples.length : 0), 0);
    if (samples !== plan.groups.length) {
      fail.push('the safe area was sampled ' + samples + ' times, wanted one per card ('
        + plan.groups.length + ')');
    }
  }
  for (const q of state.passes) {
    if (q.maxVisible > 1) fail.push('pass ' + q.name + ' had ' + q.maxVisible + ' cards on screen at once');
    if (q.contrast) {
      for (const c of q.contrast) {
        if (c.mean < CONTRAST_FLOOR) {
          fail.push('a caption sits on ' + c.mean.toFixed(2) + ':1 at ' + c.t.toFixed(2)
            + 's ("' + c.text + '") — under the ' + CONTRAST_FLOOR.toFixed(1) + ' floor it is not readable');
        }
      }
    }
  }
  /* the accent has to have been painted somewhere, and the probe has to have
     run: a contrast list that came back empty means capBand never found ink,
     which is exactly what a caption layer that did not render looks like. */
  if (!state.passes.some(q => q.sawAccent)) fail.push('the accent was never painted');
  if (!state.passes.some(q => (q.contrast || []).length)) {
    fail.push('the contrast probe never measured a band — did the caption layer render?');
  }
  for (const q of state.passes) {
    if (q.kind !== 'end' && !(q.capMoved > 0.01)) {
      fail.push('the caption never moved between two frames in pass ' + q.name);
    }
  }
  if (!(A.built.size > 20)) fail.push('the cards were fitted at ' + A.built.size.toFixed(1) + 'px');
  if (A.built.bigSize !== null) fail.push('the float style produced an emphasised size, which it has none of');

  /* the frame. */
  for (const q of state.passes) {
    if (!q.safeWorst) continue;
    const sa = q.safeWorst;
    for (const k of ['top', 'bottom', 'left', 'right']) {
      if (sa[k] * DSF < SAFE[k] - 0.5) {
        fail.push('pass ' + q.name + ': ' + sa.worst + ' comes within '
          + Math.round(sa[k] * DSF) + 'px of the ' + k + ' edge, platform floor is ' + SAFE[k]);
      }
    }
  }
  if (CAP_BOX.w / VW > 0.75 + 1e-9) fail.push('the caption box is wider than 75% of the frame');
  if (SCENE_BOX.w / VW > 0.75 + 1e-9) fail.push('the pictogram zone is wider than 75% of the frame');
  /* the caption box and the wordmark are checked as boxes as well as by their
     drawn ink, because a box that is legal only because a short card happened to
     be up is not a legal box. */
  {
    const capBottom = CAP_BOX.y + CAP_BOX.h;
    if ((VH - capBottom) * DSF < SAFE.bottom) {
      fail.push('the caption box bottom is ' + Math.round((VH - capBottom) * DSF)
        + 'px off the frame, platform floor is ' + SAFE.bottom);
    }
    if (CAP_BOX.x * DSF < SAFE.left || (VW - CAP_BOX.x - CAP_BOX.w) * DSF < SAFE.right) {
      fail.push('the caption box runs inside the platform side floors');
    }
  }

  /* pass A, the scene layer. the smoothness checks all pass on a layer that
     never drew anything, so liveness is checked next to them. */
  {
    const g = A.pic;
    if (!g) fail.push('pass A wrote no scene layer state at all');
    else {
      if (g.faultCount) {
        fail.push(g.faultCount + ' scene fault(s), first at ' + g.faults[0].t.toFixed(2)
          + 's (' + g.faults[0].what + ' on ' + g.faults[0].who + ')');
      }
      /* one tick per capture, and with the shutter open a frame is SUB
         captures. the count is read on each frame's *first* subframe, so the
         last thing it sees is the tick that opened the last frame: SUB ticks
         for every frame before it, plus one.

         it was written as "ticks === frames" and that is only right with the
         shutter shut. the 60fps final render came back with 2017 for 505
         frames and failed a picture that was correct — 504 x 4 + 1 is exactly
         2017, which is the invariant holding rather than breaking. the guard
         was wrong, not the render, and it is worth keeping in this shape
         because it still fails on a layer that missed a capture. */
      const wantTicks = (A.frames - 1) * SUB + 1;
      if (g.ticks !== wantTicks) {
        fail.push('the scene layer ticked ' + g.ticks + ' times over ' + A.frames
          + ' frames at ' + SUB + ' subframe(s) each, wanted ' + wantTicks
          + ' — it is not on the rAF shim clock');
      }
      if (!(g.stirred > 0.0001)) fail.push('no part of the scene layer ever changed on any channel');
      if (!(g.applied > 0.0001)) fail.push('the page never wrote a different scene value between two frames');
      if (g.samples !== g.wanted) {
        fail.push('the scene zone was sampled ' + g.samples + ' times, wanted one per moving step (' + g.wanted + ')');
      }
      if (!g.zone || g.zone.gap < SCENE_CLEARANCE) {
        fail.push('the scenes come within ' + (g.zone ? g.zone.gap.toFixed(0) : '?')
          + 'px of the caption ceiling, wanted at least ' + SCENE_CLEARANCE);
      }
      /* if the soft number ever comes back equal to the ink number the shadow
         expansion stopped happening and every clearance above is silently
         checking the old thing again. */
      if (!g.zone || !(g.zone.inkGap > g.zone.gap)) {
        fail.push('the shadow measured no wider than the ink — the depth pass is not being guarded');
      }
      if (!(A.capCeil > CAP_BOX.y + 1)) {
        fail.push('the caption ceiling measured ' + A.capCeil + ', which is the box top rather than a card');
      }
      const tightest = Math.min(SAFE.top, SAFE.bottom, SAFE.left, SAFE.right);
      if (!g.border || g.border.near * DSF < tightest - 0.5) {
        fail.push('the scene layer comes within ' + (g.border ? Math.round(g.border.near * DSF) : '?')
          + 'px of a border, tightest platform floor is ' + tightest);
      }
      const softest = Math.min(SOFT_SAFE.top, SOFT_SAFE.bottom, SOFT_SAFE.left, SOFT_SAFE.right);
      if (!g.soft || g.soft.softNear * DSF < softest - 0.5) {
        fail.push('the scene shadow comes within ' + (g.soft ? Math.round(g.soft.softNear * DSF) : '?')
          + 'px of a border, floor is ' + softest);
      }
    }
    /* the brief asked for the stagger and this is the first scene allowed one.
       a scene table that lost it would render perfectly and be a different
       scene, which is exactly the kind of thing nothing else here would catch. */
    if (!A.picBuilt.staggered) fail.push('no part in the scene staggers, and this is the scene that is meant to');
    /* the single accent belongs to the five money words and to nothing else.
       a green square in the pictogram zone is a green card by another name, and
       it is what the first cut shipped. */
    {
      const green = pic.parts.filter(x => x.ink === 'accent');
      if (green.length) {
        fail.push(green.length + ' pictogram part(s) painted in the accent ('
          + green.map(x => x.id).join(', ') + ') — the green belongs to the money words only');
      }
    }
    if (A.picBuilt.drawn !== pic.parts.filter(x => x.draw).length) {
      fail.push('the page measured ' + A.picBuilt.drawn + ' drawn paths, the plan has '
        + pic.parts.filter(x => x.draw).length);
    }
  }

  /* the site passes. */
  for (const q of [B, C]) {
    if (!q) { fail.push('a site pass is missing from the state'); continue; }
    if (!q.presses.length) fail.push('pass ' + q.name + ' pressed nothing');
    for (const pr of q.presses) {
      if (!pr.inside) {
        fail.push('the press at ' + pr.t.toFixed(2) + 's on ' + pr.sel
          + ' landed outside the element');
      }
    }
    /* the subline is reported rather than failed on, and that is a rule
       changing rather than a guard going soft. record.mjs capped the zoom at
       1.09 because past it the widest line on the page loses its first and last
       letter and reads as a bug. the caption band now has to sit on empty page,
       and the only framings that do that are 1.33 and deeper — at which point
       the hero is obviously cropped and a cropped line reads as a crop. the
       number is printed so it stays a decision rather than a drift. */
    const zs = q.camTrail.map(r => r.z);
    if (Math.min(...zs) < 0.999) {
      fail.push('pass ' + q.name + ' zooms to ' + Math.min(...zs).toFixed(3)
        + ' — under 1.0 the fixed layers show their own boxes in the margin');
    }
    /* a camera that never moved is a camera that was not driven. */
    if (!(Math.max(...zs) - Math.min(...zs) > 0.002)) {
      fail.push('pass ' + q.name + ' never changed zoom — the camera is not being driven');
    }
    if (!(q.gazeJump.d > 0)) fail.push('pass ' + q.name + ': the eyes never moved');
    if (!(q.blinkJump.d > 0)) fail.push('pass ' + q.name + ': the mascot never blinked');
    if (q.wide !== '1') fail.push('pass ' + q.name + ': --wide read back as "' + q.wide + '"');
    if (q.eyeFaults.length) {
      fail.push('pass ' + q.name + ': ' + q.eyeFaults.length + ' eye fault(s), first '
        + q.eyeFaults[0].what + ' at ' + q.eyeFaults[0].t.toFixed(2) + 's');
    }
    if (q.blinkSteps.length) fail.push('pass ' + q.name + ': it is flashing, not blinking');
  }
  /* the caption's one home. a clash while the camera is moving is a transient
     and is only counted; a clash on a held frame is a shot somebody looks at
     with our words on the site's words, which is the defect this pass exists to
     fix. */
  for (const q of state.passes) {
    if (q.clashHeld) {
      const c = q.clashes[0];
      fail.push('pass ' + q.name + ': site text sits behind the caption on '
        + q.clashHeld + ' held frame(s), first at ' + c.t.toFixed(2) + 's — '
        + c.what + ' "' + c.text + '" overlapping ' + c.over + 'px');
    }
  }
  /* every move that says it lands on a beat has to land on it, to the frame. */
  {
    const fr = x => Math.round(x * FPS);
    for (const q of state.passes) {
      for (const l of (q.legs || [])) {
        if (!l.beat) continue;
        const bt = beats[l.beat - 1];
        const err = (l.anchor === 'land' ? fr(l.t1) : fr(l.t0)) - fr(bt.start);
        if (err !== 0) {
          fail.push('the ' + l.ease + ' move on beat ' + l.beat + ' is ' + err
            + ' frame(s) off its ' + l.anchor + ' mark');
        }
      }
    }
    for (const q of state.passes) {
      for (const l of (q.legs || [])) {
        if (l.gap === undefined) continue;
        if (l.gap < 40) {
          fail.push('a ' + l.ease + ' shot at ' + l.at.toFixed(2)
            + 's is holding a gap of ' + l.gap + 'px, which cannot keep the caption clear'
            + (l.gap < 0 ? ' — it measured a card that was still springing in' : ''));
        }
      }
    }
  }
  /* a snap has to actually be a snap. six to ten frames is the window; outside
     it the move is either a cut or a pan wearing a snap's name. */
  for (const l of [...site.B.legs, ...site.C.legs]) {
    if (!l.snap) continue;
    const f = Math.round((l.t1 - l.t0) * 60);
    if (f < 6 || f > 10) fail.push('a snap runs ' + f + ' frames at 60fps, wanted 6 to 10');
  }
  /* the hand. a constant rate is the thing that was wrong, so the spread is
     checked rather than the count. */
  {
    const ty = site.B.typing;
    const lo = Math.min(...ty.gaps), hi = Math.max(...ty.gaps);
    if (!(hi - lo > 0.02)) {
      fail.push('the typing gaps run ' + Math.round(lo * 1000) + ' to ' + Math.round(hi * 1000)
        + 'ms, which is a machine rather than a hand');
    }
    if (!ty.keys.some(k => k.kind === 'typo') || !ty.keys.some(k => k.kind === 'fix')) {
      fail.push('the typing has no typo and correction in it');
    }
    const B = state.passes.find(q => q.name === 'B');
    if (B && B.typed !== ty.keys.length) {
      fail.push('sent ' + B.typed + ' keystrokes for ' + ty.keys.length + ' planned');
    }
  }

  /* the interactions the brief names, each checked for having actually
     happened rather than for having been scheduled. */
  if (!B.presses.some(x => x.sel === '.cta')) fail.push('the cta was never pressed in pass B, so the form never opened');
  if (!B.presses.some(x => x.sel.includes('.chip'))) fail.push('none of the four path options was pressed');
  if (!B.presses.some(x => x.sel.includes('textarea'))) fail.push('the field was never pressed');

  if (!B.reveal) fail.push('the info cards were never checked for having arrived');
  else if (B.reveal.cards !== 3) fail.push('found ' + B.reveal.cards + ' info cards, index.html has three');
  if (!C.glitched) fail.push('the cta glitch never played in pass C');
  if (!C.presses.some(x => x.sel === '.cta')) fail.push('the glitch cta was never pressed');
  /* nothing may leave the browser. the form is opened and typed into and the
     page believes every bit of it, and it goes nowhere. */
  for (const q of [B, C]) {
    if (q.posts) fail.push('pass ' + q.name + ' let ' + q.posts + ' form post(s) through the stub');
  }

  /* the end card. */
  if (!D) fail.push('there is no end card pass');
  else {
    if (!(D.gazeJump.d > 0)) fail.push('the end card mascot never moved his eyes');
    if (!(D.blinkJump.d > 0)) fail.push('the end card mascot never blinked');
    if (D.wide !== '1') fail.push('the end card --wide read back as "' + D.wide + '"');
    if (D.eyeFaults.length || D.blinkSteps.length) fail.push('the end card mascot snaps');
    if (!D.boxes || !D.boxes.mascot) fail.push('the end card has no mascot');
    if (!D.boxes || !D.boxes.wordmark) fail.push('the end card has no wordmark');
  }

  /* the sound. */
  if (!cues.length) fail.push('no sound cues were derived at all');
  if (sfx.report.length !== cues.length) {
    fail.push('rendered ' + sfx.report.length + ' effects for ' + cues.length + ' cues');
  }
  {
    const count = k => sfx.report.filter(r => r.kind === k).length;
    const want = {
      pop: plan.groups.length,
      popDeep: plan.flashed.length,
      whoosh: CUTS.length - 1,
      servo: [...site.B.legs, ...site.C.legs].filter(l => l.snap).length,
      click: [...site.B.cues, ...site.C.cues].filter(c => c.press).length + site.B.typing.keys.length,
      ding: 1, hum: 1,
    };
    for (const [k, n] of Object.entries(want)) {
      if (count(k) !== n) fail.push('found ' + count(k) + ' "' + k + '" cues, wanted ' + n);
    }
    /* this film draws no coin, no lock and no magnifier, so a sound for one
       would mean a cue rule matched something it should not have. */
    for (const k of ['coin', 'sweep']) {
      if (count(k)) fail.push('a "' + k + '" was cued by a film that has nothing to make one');
    }
  }
  if (sfx.report.some(r => r.cut)) {
    fail.push(sfx.report.filter(r => r.cut).map(r => r.kind + ' at ' + r.t).join(', ')
      + ' ran off the end of the film');
  }
  if (!(mix.busPeak > 1e-5)) fail.push('the effects bus is silent');
  {
    const moved = dbfs(mix.voicePeak) - dbfs(mix.voiceRawPeak);
    if (Math.abs(moved - VOICE_TRIM) > 0.05) {
      fail.push('the voice trim measured ' + moved.toFixed(2) + ' dB, wanted ' + VOICE_TRIM);
    }
  }
  if (mix.busPeak >= mix.voicePeak) fail.push('the effects bus is not under the voice');
  if (under.over.length) {
    fail.push(under.over.length + ' window(s) where an effect is louder than the voice, first at '
      + under.over[0].t + 's');
  }
  if (!after || !after.ok) {
    fail.push('the loudness meter did not run, so the mix is unmeasured and cannot be called safe');
  } else {
    if (Math.abs(after.lufs - TARGET_LUFS) > 1.0) {
      fail.push('the mix delivered at ' + after.lufs.toFixed(1) + ' LUFS, wanted ' + TARGET_LUFS);
    }
    if (after.truePeak > PEAK_CEILING + 0.1) {
      fail.push('true peak is ' + after.truePeak.toFixed(1) + ' dBTP, ceiling is ' + PEAK_CEILING);
    }
    if (lim.reduction > 9) fail.push('the limiter pulled ' + lim.reduction.toFixed(1) + ' dB — the mix is being squashed');
  }

  if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
}

/* imported rather than run, the same way post7 is: a strip or a test may want
   this file's scene table without rendering twenty five seconds of film. */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
