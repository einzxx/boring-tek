/* the boring tek — social clip #10, "the rage clip".
   renders out/post10-1080x1920.mp4, with the voice and the music in the file.
   tooling, not the site: nothing here ships, nothing here edits index.html.

   ---------- what this is ----------

   a black screen, old film grain on it, and the mascot in the middle glowing
   white like a crt that has been left on too long. he says one thing, in
   single words, and the frame comes apart three times while he does it.

   ---------- what is different from post9, which is the clip before it -------

   1. **it is dark and it is the first one that is.** every clip in here has
      been the light theme. this one is `data-theme=dark`, which is the whole
      reason the mascot glows at all: `--face` is #f4f7f5 on a #06070a page, so
      the white face and the black eyes are the site's own tokens doing the
      work and nothing is recoloured to get the look.

   2. **there is no accent in it, anywhere.** post9's review found green that
      was not a money word and the rule that came out of it was "if in doubt, no
      green at all". this clip is not in doubt: the `float` caption style paints
      `--fg` and only `--fg`, `flash` is off, and a guard fails the render if the
      accent colour is painted on a single frame. white ink on black, and that
      is the whole palette.

   3. **the sound is a voice and four slices of one mp3.** no synthesised
      effects at all — `lib/sfx.mjs` is used for its decoder, its mixer, its
      limiter and its meter, and none of its nine sounds. the music is three
      0.4s stabs and a 1s outro, cut out of a licensed track by measuring where
      it hits rather than by ear, and **it never plays while a word is being
      said.** the silence between the words is the style, so the check that
      matters here is not post6's "the bus is under the voice" — it is "the bus
      and the voice never overlap at all", and that is the one this file runs.

   4. **the glitches are quantised to the frame grid, deliberately.** every
      other moving thing in here is a function of continuous time, so the
      shutter smears it. a glitch must not smear: with four subframes to a
      frame, a one frame rgb split that was a function of `t` would be averaged
      with three clean subframes and land at a quarter strength. so the glitch
      state is computed once per **output** frame and held across all four
      captures of it, which is what a digital fault actually looks like — a hard
      discontinuity between frames, not a movement inside one.

   5. **no pictogram scene layer.** the frame is the mascot, a speech bubble and
      the film it is printed on. `lib/pictograms.mjs` is not imported.

   ---------- the shape ----------

     0.00 .. 0.55   the bubble stages in out of a noise burst
     0.55 .. G1     "fu*k you / i am gonna / become / every / single / thing"
        0.40s       stab, voice silent, the frame comes apart
              G2    "you said / a machine / could / never / be"
        0.40s       stab
              G3    "and you / will use me / every / single / day"
        0.40s       stab
              G4    "and love it"
        1.00s       the outro slice: the mascot glitches away, the wordmark
                    glitches in
        0.85s       the wordmark holds, in silence
        0.30s       black

   vertical only, for the reason every clip since post4 is: a bubble, a head and
   a wordmark do not fit inside a 1080 tall frame with the air each needs.

     node post10.mjs                  the clip, 12fps preview unless told otherwise
     DEMO_FPS=12 node post10.mjs      the fast preview pass
     node post10.mjs --blur           the final, four subframes to a frame
     node post10.mjs --encode-only    re-encode from kept frames
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
  decode, voiceEnvelope, mixdown, applyGain, limit, writeWav, loudness, dbfs, SR,
} from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
/* the licensed mp3s. gitignored whole — the licence is ours to hold, not ours
   to redistribute out of a public repo. the slices this file cuts land in the
   mix, which lands in out/, which is ignored too. */
const MUSIC_DIR = path.join(HERE, 'music');
/* under out/, in their own folders, so a record.mjs run cannot wipe them mid
   flight. */
const FRAMES = path.join(OUT, 'frames-post10');
const SUBS = path.join(OUT, 'subframes-post10');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = 2;

const argv = process.argv.slice(2);
const argOf = name => {
  const hit = argv.find(a => a === '--' + name || a.startsWith('--' + name + '='));
  if (!hit) return null;
  const eq = hit.indexOf('=');
  return eq === -1 ? '' : hit.slice(eq + 1);
};
const ONLY_ENCODE = argv.includes('--encode-only');
const KEEP = argv.includes('--keep-frames');
const BLUR_ARG = argOf('blur');
const BLUR = BLUR_ARG !== null;
/* four is where a 60fps shutter stops reading as four ghosts and starts reading
   as one smear. it is post9's number and the reasoning is written up there. */
const SUB = BLUR ? Math.max(2, Math.min(12, Number(BLUR_ARG) || 4)) : 1;
const SUBSTEP = STEP / SUB;

/* ---------- the script ----------
   four groups, and a group is what the voice says between two stabs. every line
   inside a group is its own sentence, which is not a grammar mistake: the
   synthesiser reads a full stop as most of half a second of air, so writing
   `become. every. single. thing.` is how the delivery gets its staccato and how
   the caption engine cuts one card per line without being told to. a card
   breaks at a sentence end, so the sentences **are** the cards.

   the copy is the full word. the screen is not — see CENSOR below. */
const GROUPS = [
  'fuck you. i am gonna. become. every. single. thing.',
  'you said. a machine. could. never. be.',
  'and you. will use me. every. single. day.',
  'and love it.',
];

/* ---------- the censor ----------
   the voice says the word and the screen does not. it is one substitution and
   it is made on the **caption's** word list only, after the synthesiser has
   handed its timings back, so the audio and the timing are untouched by it and
   the card is the only thing that changes.

   `*` is not punctuation to `bareWord`, which strips at the edges and never
   inside a word, so `fu*k` survives the strip exactly as `don't` and `e-pasts`
   do. the star gets an element of its own in the markup so it can flicker like
   a dead pixel — see `starMarkup` below. */
const CENSOR = { fuck: 'fu*k' };

/* what the seventeen cards must come out as. it is written down rather than
   trusted because the cut is the synthesiser's word list meeting the engine's
   grouping rule, and either of those could move under us. a render that cuts
   `become every` onto one card is a different clip and should fail rather than
   render. */
const CARDS = [
  'fu*k you', 'i am gonna', 'become', 'every', 'single', 'thing',
  'you said', 'a machine', 'could', 'never', 'be',
  'and you', 'will use me', 'every', 'single', 'day',
  'and love it',
];

/* ---------- the gaps ----------
   how long the voice is silent between two groups. it is the stab's own length,
   so the music fills exactly the hole the speech leaves and the two never
   overlap by a sample. */
const GAP = 0.40;
/* where the first word lands. short, because post9's review found its own first
   quarter second was the frame doing the least work in the whole clip and the
   one that has to stop a scroll. this one opens on a noise burst with the
   bubble already arriving. */
const INTRO = 0.55;
/* how much of each group's own recording is kept either side of the sound in
   it. small, because the edges are found on the waveform rather than taken off
   the word list — see `audioEdges`. it is only there so a 12ms fade has
   somewhere to happen. */
const EDGE = 0.02;
/* the floor a group's recording has to fall under to count as having stopped,
   relative to that group's own peak. -46 dB is well below the quietest
   consonant and well above what an mp3 leaves behind. */
const SILENCE_DB = -46;
/* the tail, after the last word.
     lead   the beat before the outro slice starts
     outro  the slice itself, and the wordmark arrives inside it
     hold   the wordmark alone, in silence
     black  the cut */
const TAIL = { lead: 0.10, outro: 1.00, hold: 0.85, black: 0.30, slack: 0.80 };

/* ---------- the cut ----------
   css px in a 540x960 viewport; device px are double.

   the safe area is a **platform's**, not the frame's, and it is per edge. 96px
   of air is what a phone needs; tiktok stacks a button column down the right
   and a caption across the bottom, instagram takes chrome top and bottom, and
   youtube shorts eats the bottom for the title and the subscribe row. these are
   post9's numbers and they are the house floor now.

   the vertical budget, top to bottom:
      389..494    the speech bubble's pill
      504..572    the three dots, climbing down and left out of it
      592..768    the mascot, 176px, centred
       ~480       the wordmark, on the end card only, over where the pill was

   the pill is 368 wide against a safe width of 400, which leaves 16 css px a
   side for the shake to spend. every glitch frame is measured against the same
   floor as every calm one, so that headroom is a fact the render checks rather
   than a margin somebody left. */
const VW = 540, VH = 960;
const SAFE = { top: 180, bottom: 220, left: 140, right: 140 };
const SAFE_CSS = {
  top: SAFE.top / DSF, bottom: SAFE.bottom / DSF,
  left: SAFE.left / DSF, right: SAFE.right / DSF,
};

/* the pill, and the caption box inside it. the box is what `captionCss` lays
   out in and it is fixed; the pill is measured in the page against the ink that
   actually fitted and shrunk to hug it, never past PILL_MAX. a pill that
   resized per card would be the frame jumping, so it is measured once, after
   the fonts land, and never again. */
const PILL_MAX = 368;
const PILL_PAD = 26, PILL_PAD_Y = 24;
const PILL_BOTTOM = 470;
const CAP_BOX = { x: 112, y: 350, w: 316, h: 120 };
/* the three dots, climbing up and right out of the head into the pill. the gap
   from the head to the first dot is much bigger than the gaps between the dots,
   which is what makes them read as coming *from* him rather than stuck *to*
   him. the sizes climb, the spacing does not. */
const DOTS = [
  { cx: 352, cy: 568, r: 3.5 },
  { cx: 371, cy: 545, r: 5.5 },
  { cx: 394, cy: 518, r: 8.5 },
];
const MASCOT = 176, MASCOT_TOP = 592;
/* the end card's wordmark. 360 of 540 leaves 180 device px a side against a
   floor of 140, which is the shake's room. post9 retired the 88 to 90% band
   because it sits inside the platform's bottom strip; this one is not down
   there at all, it is in the middle of the frame where the bubble was. */
const WORDMARK_W = 360, WORDMARK_CY = 480;

/* ---------- the mix ----------
   -14 LUFS is where every platform this posts to normalises, and -1 dBTP is the
   headroom a lossy codec needs not to clip on the far side of its own
   reconstruction. neither is a house preference: they are the numbers the
   players use, and they have not moved since post6.

   VOICE_TRIM is the balance between the two tracks and it is the only number
   that decides it. -1.5dB is the voice at 84% of where it was and it does not
   make the clip quieter — the loudness pass afterwards scales both tracks
   together to the same target, so trimming the voice moves the music up against
   it. unchanged from post6 and post7, as asked.

   DUCK is inert in this clip and is still passed, because it costs nothing and
   because a run that reports the ducker never engaged is a run that has proved
   the music and the voice do not overlap. see MUSIC below. */
const TARGET_LUFS = -14;
const PEAK_CEILING = -1.0;
/* **the ducker is off in this clip, and that is a measurement rather than a
   preference.** post6 pulls the effects bus 8dB down while a word is being said
   and 0.60 is the right number for a bus that plays *under* speech. this one
   never does: every stab opens on the frame a group's last word has stopped.

   `voiceEnvelope` has a 220ms release, which is the same release post6 already
   found could not be trusted as a check — it stays open through the gap after
   every word. at 0.60 it measured all but fully open at the instant the first
   stab lands, which is most of 8 dB off the attack of every stab in the film:
   the one part of a stab that is the stab. the run prints that counterfactual
   next to the zero it actually uses, so the number is on screen rather than in
   a comment. the voice trim and the loudness targets are untouched. */
const DUCK = 0;
const DUCK_POST6 = 0.60;
const VOICE_TRIM = -1.5;

/* ---------- the music ----------
   two licensed pixabay mp3s are on this machine. both were read by waveform
   before either was used and the choice is measured, not remembered:
   `punchOf` below finds the biggest rise from the 60ms before a moment to the
   80ms after it, anywhere in the file, and the run prints both numbers and
   fails if the main track is not the harder hitting one.

   what the scan found, 2026-08-28:
     track1  96.08s, -12.4 LUFS, crest 15.1 dB, 8.2% of the file within 12dB of
             peak, biggest transient rise ~8 dB. a wash. it never hits.
     track2  88.66s, -12.5 LUFS, crest 12.8 dB, 28.0% within 12dB of peak,
             transient rises of 12 to 17 dB every 1.85s. it hits.

   so **track2 is the main and track1 is not used at all**, for either role.
   there is no riser anywhere in either file — both are flat loops — so the
   outro is the one second window in track2 whose last fifth is loudest and
   which rises most across itself, which is a bar level rise rather than a
   crescendo. that is what the material has and saying so is better than
   claiming a build that is not in the file.

   the three stabs escalate, and that is the source's own doing rather than
   three gains: their first 80ms measure -8.2, -7.7 and -6.3 dBFS rms in the
   track, so playing them in that order is the rage getting louder. one gain
   moves all four slices together, exactly the way GAINS fixes the relationship
   between the synthesised sounds and one master moves them. */
const MUSIC = {
  main: 'track2.mp3',
  other: 'track1.mp3',
  /* [start, length] in the source, in seconds. the start is a hair before the
     hit so the attack is whole: every one of these has 40 to 60ms of near
     silence in front of it, down at -21 to -24 dBFS. */
  stabs: [
    { at: 4.16, for: GAP, note: 'attack -8.2 dBFS, +14.2 dB over the 60ms before it' },
    { at: 26.30, for: GAP, note: 'attack -7.7 dBFS, +13.8 dB' },
    { at: 20.76, for: GAP, note: 'attack -6.3 dBFS, +13.8 dB, the loudest of the three' },
  ],
  outro: { at: 49.06, for: TAIL.outro, note: 'rises +6.1 dB across itself, last 200ms at -6.6 dBFS' },
};
/* how far over the voice the music sits, and it is set by two rules with the
   quieter of them winning.

   OVER_SPEECH is the one that decides it in practice: a stab's rms against the
   median 20ms of actual speech. peak is the wrong unit for this — a plosive
   peaks far above its own loudness — so the relationship a listener hears is
   set against the speech level and the peak rule is only there as a ceiling.

   PEAK_HEAD is that ceiling: however loud the rule above asks for, the music
   never peaks more than this over the voice, because past it the limiter stops
   limiting and starts squashing. the run prints which of the two bound. */
const MUSIC_OVER_SPEECH = 7.0;
const MUSIC_PEAK_HEAD = 2.0;
/* the edges of a slice. 4ms in keeps the attack and kills the click; 30ms out
   stops a stab rather than fading it; the outro gets 6ms, which is a cut with
   no click in it rather than a fade. */
const SLICE_FADE = { in: 0.004, stabOut: 0.030, outroOut: 0.006 };

/* ---------- the encoder ----------
   every clip before this one is crf 17 and this one is not, and the reason is
   the frame rather than a change of mind. those clips are ink on a white page:
   large flat areas, a few hundred lit pixels, and 17 costs nothing. this one is
   **film grain over black across the whole frame**, which is the most expensive
   thing this pipeline has ever been asked to encode — at 17 the twelve frame a
   second preview came back at 7.7 Mbit/s, which is more than post9 spends at
   sixty.

   the number below was chosen by measuring rather than by taste. the same 200
   preview frames, encoded four ways:

     crf 17   16.00 MB   7.68 Mbit/s
     crf 20    7.45 MB   3.57 Mbit/s
     crf 22    4.20 MB   2.02 Mbit/s
     crf 24    2.51 MB   1.20 Mbit/s

   and 22 was looked at rather than assumed: the grain, the glow, the bubble
   outline and the star are all intact on the frame, which is the whole picture.
   **2.02 Mbit/s is what post9 delivers at 17**, so this clip ships at the same
   bitrate as the one before it and the crf differs because the frame does. */
const CRF = 22;

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
const EASE = bezier(.16, 1, .3, 1);          /* the site's own --ease */
const EASE_IO = bezier(.45, 0, .55, 1);      /* gaze turns, calm at both ends */
const SPRING = bezier(.34, 1.4, .64, 1);     /* the site's own --spring */
const lerp = (a, b, p) => a + (b - a) * p;
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- seeded randomness ----------
   every uneven thing in this clip comes out of one of these: the glitch, the
   grain, the specks, the blinks and the star's flicker. a seed makes the
   rhythm uneven the way a real one is and identical on every run, which is what
   makes a re-render the same film and a guard's number worth writing down. */
function prng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s |= 0;
    return (s >>> 0) / 4294967296;
  };
}

/* ---------- the eyes ----------
   he is not searching the room and he is not reacting. he stares, and the
   staring is the performance: the rage is in the words and the calm underneath
   them is what makes it land. so the gaze is small — a drift of under a unit
   against the page's own cap of 6 — and it comes level with the viewer for the
   last group and stays there.

   the keys are [second, units] against the clip's own length, so they are built
   once the voice has been measured rather than typed against a guess.

   **the numbers below are the preview's review's, not the first draft's.** it
   was written at ±0.55 units, which on a 176px head is about a css pixel and a
   half: real, inside every guard, and invisible. thirty four sampled frames had
   the eyes in the same place in every one of them, and "calm idle animation"
   has to be an animation. it is 1.1 now, which is 3 css px and reads, and it is
   still under half of what post7 spends on a mascot that is listening rather
   than staring. */
function eyeKeys(marks) {
  const [g1, g2, g3, g4] = marks;      /* the first word of each group */
  const end = marks.end;
  return {
    x: [
      [0, 0], [g1 + 0.6, 0],
      [g1 + 1.4, -1.1], [g2 - 0.2, -1.1],
      [g2 + 0.5, 1.0], [g3 - 0.2, 1.0],
      [g3 + 0.5, -0.8], [g4 - 0.25, -0.8],
      [g4, 0], [end, 0],
    ],
    y: [
      [0, 0.7], [g1 + 0.6, 0.7],
      [g1 + 1.4, 0.15], [g2 - 0.2, 0.15],
      [g2 + 0.5, 0.6], [g3 - 0.2, 0.6],
      [g3 + 0.5, 0.1], [g4 - 0.25, 0.1],
      [g4, 0], [end, 0],
    ],
  };
}
function keyAt(keys, t, ease) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i], [t0, v0] = keys[i - 1];
    if (t <= t1) return lerp(v0, v1, (ease || EASE)(span(t, t0, t1)));
  }
  return keys[keys.length - 1][1];
}

/* ---------- the blinks ----------
   a staring cadence, slower than any clip so far: 3.4 to 5.2 seconds apart
   against post7's 3.0 to 4.4 and post5's 1.45. somebody who is not going to
   look away first does not blink much. doubles are rare rather than common. */
function blinkList(seconds) {
  const rnd = prng(0x10a5e3);
  const out = [];
  let t = 1.30;
  while (t < seconds - 0.35) {
    out.push(t);
    if (rnd() < 0.10) { const d = t + 0.12; if (d < seconds - 0.35) out.push(d); }
    t += 3.4 + rnd() * 1.8;
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
/* the reel's guards, frame rate relative so they stay meaningful at 60 and
   clamp out of the way under DEMO_FPS=12. these are on --ex/--ey and --blink
   only: the violent shake is a different channel with its own limit, because
   the whole point of it is that it breaks this one. */
const BLINK_LIMIT = Math.min(0.95, 3.4 * 0.94 * STEP / 95);
const GAZE_LIMIT = 1.2 * STEP / 16.6667;

/* ---------- the head bob ----------
   he has no mouth, so the only thing that can say he is speaking is the head
   moving on the word. one small kick down and back per word, keyed to the
   voice's own timestamps, 2.6px and over in 160ms. it is deliberately under the
   threshold of noticing: what it does is stop him reading as a still picture
   with a caption next to it. */
const BOB = { px: 3.4, for: 0.16 };
function bobAt(words, t) {
  let v = 0;
  for (const w of words) {
    if (t < w.start || t > w.start + BOB.for) continue;
    v = Math.max(v, Math.sin(Math.PI * EASE_IO(span(t, w.start, w.start + BOB.for))));
  }
  return v * BOB.px;
}

/* ---------- the glitch ----------
   three hard ones in the stab gaps, one at the open, one on the outro, and a
   single frame micro glitch on every word entry.

   **it is a function of the frame index, not of the time**, and that is the one
   thing about this file worth reading twice. with the shutter open every output
   frame is captured four times at four instants inside its own sixtieth of a
   second and the four are averaged. anything that is a function of `t` gets
   smeared by that, which is exactly what a spring or a falling coin wants. a
   glitch does not: a one frame rgb split written against `t` would be on for
   one subframe of four and land at a quarter strength, and a violent shake
   would come out as a blur rather than as a jump. so the glitch is computed
   once per output frame and held across all four captures of it, which is what
   a dropped packet actually looks like on a screen. the caption springs, the
   drift and the mascot's eyes still ride the shutter; the tearing does not.

   the envelope is the same shape every time and the numbers inside it are not:
   full for the first eighth, decaying to nothing by five sixths, and then
   **clean for the last sixth**, which is the "snaps back calm" in the brief and
   is a fact the guards check rather than a description. */
const GLITCH = {
  shakeX: 14, shakeY: 7,        /* css px, at full heat */
  split: 6.5,                   /* css px of rgb separation, at full heat */
  bandDx: 70,                   /* css px a torn band slides */
  mascotX: 10, mascotY: 8,      /* the mascot's own extra shake, on top of the frame's */
  bands: 3,                     /* how many tear elements exist to be used */
  calmFrom: 0.84,               /* the fraction of the window after which it is over */
};
function heatAt(p) {
  if (p < 0) return 0;
  if (p < 0.12) return 1;
  if (p < 0.55) return 1 - (p - 0.12) / 0.43 * 0.55;
  if (p < GLITCH.calmFrom) return 0.45 * (1 - (p - 0.55) / (GLITCH.calmFrom - 0.55));
  return 0;
}
/* what a frame of glitch is. everything a hard glitch writes is in here, and a
   frame with no glitch on it returns the same object with every channel at
   rest — so "calm" is a value that gets written rather than a case that gets
   skipped, and a channel that is stuck on shows up as a fault instead of as a
   look. */
function calmGlitch() {
  return {
    sx: 0, sy: 0, split: 0, noise: 0, dark: 0, scan: 0,
    mx: 0, my: 0, bands: [],
    capdx: 0, capdy: 0, capsplit: 0,
    heat: 0,
  };
}
function glitchFrame(windows, micro, f) {
  const g = calmGlitch();
  const t = f / FPS;
  /* the micro glitch first, so a hard glitch on the same frame overwrites it
     rather than adding to it. a word entry inside a stab gap cannot happen —
     the voice is silent there — but the ordering is written down rather than
     assumed. */
  if (micro.has(f)) {
    const r = prng(0x51c0de ^ (f * 2654435761));
    g.capdx = (r() * 2 - 1) * 3.0;
    g.capdy = (r() * 2 - 1) * 2.0;
    g.capsplit = 2.0 + r() * 2.5;
  }
  for (const w of windows) {
    if (t < w.t0 || t >= w.t1) continue;
    const p = (t - w.t0) / (w.t1 - w.t0);
    const r = prng(w.seed ^ (f * 2654435761));
    let heat = heatAt(p) * w.force;
    /* a spike: one frame back at full strength somewhere in the decay, so the
       fault stutters rather than fading out politely. */
    if (heat > 0 && p > 0.12 && p < GLITCH.calmFrom && r() < 0.30) heat = w.force;
    if (heat <= 0) continue;
    g.heat = Math.max(g.heat, heat);
    g.sx = (r() * 2 - 1) * GLITCH.shakeX * heat;
    g.sy = (r() * 2 - 1) * GLITCH.shakeY * heat;
    g.split = heat * (2.0 + r() * (GLITCH.split - 2.0));
    g.noise = heat * (0.10 + r() * 0.28);
    g.dark = r() < 0.22 ? heat * 0.8 : 0;
    g.scan = heat * r() * 40;
    g.mx = (r() * 2 - 1) * GLITCH.mascotX * heat;
    g.my = (r() * 2 - 1) * GLITCH.mascotY * heat;
    g.capdx = (r() * 2 - 1) * 6 * heat;
    g.capdy = (r() * 2 - 1) * 4 * heat;
    g.capsplit = g.split;
    const n = Math.min(GLITCH.bands, Math.floor(heat * (GLITCH.bands + 0.4)));
    for (let i = 0; i < n; i++) {
      const h = 14 + r() * 92;
      g.bands.push({
        top: +(r() * (VH - h)).toFixed(1), h: +h.toFixed(1),
        dx: +((r() * 2 - 1) * GLITCH.bandDx * heat).toFixed(1),
      });
    }
  }
  return g;
}

/* ---------- the film ----------
   grain, flicker, dust and a scratch. constant and quiet, and every one of them
   stepped rather than eased: film jitters, it does not glide, which is the same
   reason index.html's own grain uses `steps()`.

   it is driven per output frame from node rather than left to a css animation,
   for two reasons. one is that it must not smear under the shutter — a speck
   that lives two frames is a speck, and a speck averaged across four subframes
   is a smudge. the other is that a seeded sequence is reproducible and a css
   animation on virtual time is only nearly.

   **post7 says no grain and that was the right call for a white frame.** every
   platform recompresses a clip and grain through that is noise rather than
   texture, and on a light frame it costs bitrate for nothing. this frame is
   near black, where a very low opacity actually reads, and it is the one place
   the note does not apply. it is held at 0.07 and stepped at 8Hz, which is a
   twentieth of the frames a per frame grain would ask the encoder to carry. */
const GRAIN_O = 0.07, GRAIN_HZ = 8;
const SPECK_SLOTS = 8;
function filmAt(f) {
  const gi = Math.floor(f / (FPS / GRAIN_HZ));
  const rg = prng(0x9e3779b1 ^ (gi * 2654435761));
  const specks = [];
  for (let s = 0; s < SPECK_SLOTS; s++) {
    /* each slot runs its own schedule of on-for-one-to-three-frames, off for
       between a third of a second and two and a half. walked from the start
       every frame rather than kept as state, so `filmAt` stays a pure function
       of the frame index and a re-render cannot land somewhere else. */
    const r = prng(0x2f10a7 + s * 7919);
    let t = r() * 0.9, on = null;
    while (t < (f + 1) / FPS + 3) {
      const frames = 1 + Math.floor(r() * 3);
      const x = SAFE_CSS.left + r() * (VW - SAFE_CSS.left - SAFE_CSS.right);
      const y = SAFE_CSS.top + r() * (VH - SAFE_CSS.top - SAFE_CSS.bottom);
      const w = 1 + r() * 2.2, h = 1 + r() * 2.4, o = 0.25 + r() * 0.5;
      const f0 = Math.round(t * FPS);
      if (f >= f0 && f < f0 + frames) { on = { x: +x.toFixed(1), y: +y.toFixed(1), w: +w.toFixed(2), h: +h.toFixed(2), o: +o.toFixed(3) }; break; }
      t += 0.35 + r() * 2.1;
    }
    specks.push(on);
  }
  /* the scratch: a hair of a vertical line, once every few seconds, one or two
     frames, always inside the safe area. */
  const rh = prng(0x5ca7c8);
  let ht = 1.4 + rh() * 2.0, hair = null;
  while (ht < (f + 1) / FPS + 6) {
    const frames = 1 + Math.floor(rh() * 2);
    const x = SAFE_CSS.left + rh() * (VW - SAFE_CSS.left - SAFE_CSS.right);
    const y = SAFE_CSS.top + rh() * (VH - SAFE_CSS.top - SAFE_CSS.bottom - 160);
    const h = 60 + rh() * 140, o = 0.12 + rh() * 0.16;
    const f0 = Math.round(ht * FPS);
    if (f >= f0 && f < f0 + frames) { hair = { x: +x.toFixed(1), y: +y.toFixed(1), h: +h.toFixed(1), o: +o.toFixed(3) }; break; }
    ht += 2.6 + rh() * 3.4;
  }
  return {
    gx: +((rg() * 2 - 1) * 4).toFixed(2),
    gy: +((rg() * 2 - 1) * 4).toFixed(2),
    /* the flicker is a darkening only, because that is what an old projector
       does: the shutter takes light away, it never adds any. 4% at most. */
    flick: +(rg() * 0.04).toFixed(4),
    specks, hair,
  };
}

/* ---------- the mascot ----------
   the site's own, read from source, exactly as post5 reads it. the glow layers
   are the face **without the eyes**: blurring the whole mascot blurs the two
   dark slabs into the bloom and the halo comes out grey in the middle. */
function mascotParts() {
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
  return { face, body: [face, '<g class="m-eyes">', ...eyes, '</g>'].join('\n      ') };
}

const FONTS = '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
  + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
  + 'family=Michroma&family=Space+Grotesk:wght@400;500;700&display=swap">';

/* ---------- the frame's own markup ----------
   drawn twice: once as itself, and once inside each tear band as a copy the
   band can slide sideways. the copies read the same custom properties off the
   stage, so the ghost's eyes, blink and bob can never disagree with the real
   one's — there is nothing to keep in sync, because there is one set of
   numbers and two readers of it. */
function frameMarkup(m, ghost) {
  const cls = ghost ? ' ghost' : '';
  return `
  <div class="halo${cls}"></div>
  <div class="bubble${cls}">
    <div class="pill"></div>
    ${DOTS.map((d, i) => '<i class="dot" data-dot="' + i + '" style="left:' + (d.cx - d.r) + 'px;top:'
      + (d.cy - d.r) + 'px;width:' + d.r * 2 + 'px;height:' + d.r * 2 + 'px"></i>').join('\n    ')}
  </div>
  <div class="m-zone${cls}">
    <svg class="m-glow m-glow-wide" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${m.face}</svg>
    <svg class="m-glow m-glow-mid" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${m.face}</svg>
    <svg class="mascot" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      ${m.body}
    </svg>
  </div>
  <div class="wordmark${cls}">the boring tek</div>`;
}

/* the star gets an element of its own so it can flicker on its own. it is one
   substitution on the markup the caption engine produced, and it is safe for
   exactly one reason: `apply()` writes opacity, transform and a data attribute
   onto a cell and never touches its text, and the fit measures the plan's own
   strings on a canvas rather than reading the dom. so the visible string is
   unchanged, every measurement is unchanged, and the star is addressable. */
function starMarkup(html) {
  const want = '>fu*k<';
  if (!html.includes(want)) {
    throw new Error('the censored card is not in the markup — the star cannot be given an element');
  }
  return html.replace(want, '>fu<i class="star">*</i>k<');
}

function page(plan, m) {
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post10</title>
${FONTS}
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}
${captionCss(plan, CAP_BOX)}

/* the vignette, at its dark value, breathing on the site's own 34s loop.

   the breathe is load bearing rather than decoration. with nothing animating at
   all chrome stops producing compositor frames and Page.captureScreenshot
   blocks on a frame that never comes. post2.mjs found this and every clip since
   has carried the fix. it is also the one thing in this file that is allowed to
   be a css animation, because it is the one thing that does not have to hit a
   mark. */
.vignette{position:fixed;inset:-10%;background-image:var(--vig);pointer-events:none;z-index:0;
  will-change:transform,opacity;
  animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{
  from{transform:scale(1) translate3d(0,0,0);opacity:.88}
  to{transform:scale(1.045) translate3d(0,-1.2%,0);opacity:1}
}

/* the stage carries the frame's own shake, and every custom property the
   glitch, the film and the mascot are driven by. one place they are written and
   one place everything reads them from, which is what keeps the tear bands'
   copies from ever drifting off the real thing. */
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;
  transform:translate3d(calc(var(--sx,0) * 1px),calc(var(--sy,0) * 1px),0);
  will-change:transform}
.real{position:absolute;inset:0}

/* ---- the mascot ----
   white on near black, which is the dark theme's own colourway and not a
   recolour: --face is #f4f7f5 and --eye is #06070a, the page background, so the
   face reads as a hole punched in the screen exactly as it does on the site.

   the glow is three layers and a halo, which is the page-builder spec's model
   done in white rather than in phosphor green: a core, a tight blurred
   duplicate and a wide one. the blur radius is set once and never animated —
   animating it re-rasterises every frame — and what moves is opacity. this
   clip has no green in it at all, so the halo is white too. */
.m-zone{position:absolute;left:50%;top:${MASCOT_TOP}px;width:${MASCOT}px;height:${MASCOT}px;
  margin-left:${-MASCOT / 2}px;
  transform:translate3d(calc(var(--mx,0) * 1px),calc((var(--my,0) + var(--bob,0)) * 1px),0);
  opacity:var(--m-o,1);will-change:transform,opacity}
.m-zone > svg{position:absolute;inset:0;width:100%;height:100%;display:block}
.m-glow{pointer-events:none}
.m-glow-mid{filter:blur(13px);opacity:calc(.30 * var(--m-glow,1))}
.m-glow-wide{filter:blur(34px);opacity:calc(.20 * var(--m-glow,1))}
.m-face{fill:var(--face)}
.m-eyes{transform:translate(calc(var(--ex,0) * 1px),calc(var(--ey,0) * 1px))}
.m-eye{fill:var(--eye);transform-box:fill-box;transform-origin:center;
  transform:scaleY(calc(var(--blink,1) * var(--wide,1)))}
.halo{position:absolute;left:50%;top:${MASCOT_TOP - MASCOT * 0.55}px;
  width:${MASCOT * 2.1}px;height:${MASCOT * 2.1}px;margin-left:${-MASCOT * 1.05}px;
  pointer-events:none;opacity:calc(var(--m-o,1) * var(--m-glow,1));
  background:radial-gradient(circle,
    rgba(255,255,255,.13) 0%, rgba(255,255,255,.06) 32%,
    rgba(255,255,255,.022) 54%, rgba(255,255,255,0) 72%)}

/* ---- the speech bubble ----
   the site's own: a pill and three dots climbing out of the head, --bg fill
   with a --bub border, which on this theme is a light grey outline on black.
   one soft white drop shadow on the group so the outline reads as lit rather
   than as drawn — set once, never animated.

   the pill's width and height are written by the page after the fonts land,
   measured off the ink that actually fitted. it is one layout read and it never
   happens again: a pill that resized per card would be the frame jumping. */
.bubble{position:absolute;inset:0;pointer-events:none;opacity:var(--bub-o,0);
  filter:drop-shadow(0 0 7px rgba(255,255,255,.22))}
.pill{position:absolute;left:50%;background:var(--bg);border:1.5px solid var(--bub);
  border-radius:22px;
  width:var(--pill-w,${PILL_MAX}px);height:var(--pill-h,110px);
  margin-left:calc(var(--pill-w,${PILL_MAX}px) / -2);
  bottom:${VH - PILL_BOTTOM - PILL_PAD_Y}px;
  transform:scale(var(--pill-s,1));transform-origin:60% 100%;opacity:var(--pill-o,0)}
.dot{position:absolute;display:block;background:var(--bg);border:1.5px solid var(--bub);
  border-radius:50%;transform-origin:center;opacity:0}
.dot[data-dot="0"]{opacity:var(--d0,0);transform:scale(var(--d0s,1))}
.dot[data-dot="1"]{opacity:var(--d1,0);transform:scale(var(--d1s,1))}
.dot[data-dot="2"]{opacity:var(--d2,0);transform:scale(var(--d2s,1))}

/* ---- the caption ----
   the float style, so the ink is --fg and only --fg and there is no card behind
   it. the pill is the container; a filled card inside a drawn bubble is a box
   in a box. the glow is the same white the mascot carries, two layers of
   text-shadow rather than blurred duplicates, because a caption is a handful of
   glyphs and a duplicate of it would have to be written every frame.

   the rgb split is under a data attribute rather than a zero valued shadow: a
   shadow at offset 0 in full colour is a coloured halo, not "off". with the
   attribute away the words carry the glow and nothing else. */
.cap-in{transform:translate3d(calc(var(--capdx,0) * 1px),calc(var(--capdy,0) * 1px),0)}
.cap-float .cap-w{text-shadow:0 0 7px rgba(255,255,255,.30),0 0 18px rgba(255,255,255,.16)}
.stage[data-gl="1"] .cap-float .cap-w{
  text-shadow:0 0 7px rgba(255,255,255,.30),0 0 18px rgba(255,255,255,.16),
    calc(var(--capsplit,0) * -1px) 0 var(--gr),calc(var(--capsplit,0) * 1px) 0 var(--gc)}
.star{display:inline-block;opacity:var(--star,1);
  /* space grotesk sets an asterisk at cap height with wide side bearings, so
     the censored word rendered as fu space star k, with a hole in it. no
     backticks in this comment: it is inside a template literal and one would
     end the string rather than mark a name. pulled in and
     dropped to about the x height. the negative margins make the glyph narrower
     than the canvas measured it, never wider, so the fit still holds. */
  margin:0 -.075em;transform:translateY(.11em)}

/* the whole frame's split. the mascot and the bubble are shapes rather than
   glyphs, so it is a drop-shadow on them and a text-shadow on the words — the
   same division index.html makes between its cta and its socials row. */
.stage[data-gl="1"] .m-zone{
  filter:drop-shadow(calc(var(--split,0) * -1px) 0 var(--gr))
         drop-shadow(calc(var(--split,0) * 1px) 0 var(--gc))}
.stage[data-gl="1"] .bubble{
  filter:drop-shadow(0 0 7px rgba(255,255,255,.22))
         drop-shadow(calc(var(--split,0) * -1px) 0 var(--gr))
         drop-shadow(calc(var(--split,0) * 1px) 0 var(--gc))}

/* ---- the wordmark ----
   the end card, and the only place michroma appears in this clip. white with
   the same glow the mascot has rather than the page's green phosphor, because
   there is no green anywhere in here and the wordmark is not where that would
   start. fitted to WORDMARK_W in the page. */
.wordmark{
  position:absolute;left:50%;top:${WORDMARK_CY}px;transform:translate(-50%,-50%);
  font-family:var(--display);font-weight:400;color:var(--fg);
  text-transform:uppercase;letter-spacing:.18em;white-space:nowrap;line-height:1;
  /* letter-spacing is added after every glyph including the last, so the box is
     one full space wider than the ink and the ink sits half a space left of the
     box centre. shifting by half the tracking is what actually centres it. */
  text-indent:.09em;
  opacity:var(--wm-o,0);
  text-shadow:0 0 9px rgba(255,255,255,.34),0 0 24px rgba(255,255,255,.18);
  /* the phosphor breathes rather than sits. it is one filter on a few thousand
     lit pixels, which costs a codec almost nothing, and it is what stops the
     end card from being a still picture once the mascot has gone — which is
     exactly what post9's review found its own end card was. */
  filter:brightness(var(--wm-glow,1));
  z-index:4}
.stage[data-gl="1"] .wordmark{
  text-shadow:0 0 9px rgba(255,255,255,.34),0 0 24px rgba(255,255,255,.18),
    calc(var(--split,0) * -1px) 0 var(--gr),calc(var(--split,0) * 1px) 0 var(--gc)}

/* ---- the tear ----
   a band of the frame, blacked out and redrawn shifted. the layer paints --bg
   first so it covers what is under it, then draws its own copy of the mascot,
   the bubble and the wordmark displaced sideways — which is a tear rather than
   a ghost. the caption is not in the copy, so a band across the words takes
   them off the screen, which is what signal loss looks like.

   three of them exist and a frame uses none, one, two or three. an unused band
   has a height of zero and clips to nothing. */
.tear{position:absolute;inset:0;z-index:6;overflow:hidden;background:var(--bg);
  clip-path:inset(var(--tt,0px) 0 calc(100% - var(--tt,0px) - var(--th,0px)) 0);
  opacity:var(--to,0)}
.tear-in{position:absolute;inset:0;transform:translate3d(calc(var(--tdx,0) * 1px),0,0)}

/* ---- the film ----
   scanlines, grain, dust and a scratch. all of them quiet, all of them stepped,
   none of them ever crossing the safe area except the two that cover the whole
   frame by definition. */
.scan{position:absolute;inset:-8px 0;z-index:7;pointer-events:none;
  background:repeating-linear-gradient(to bottom,
    rgba(255,255,255,.042) 0 1px, rgba(255,255,255,0) 1px 4px);
  transform:translate3d(0,calc(var(--scan,0) * 1px),0)}
.grain{position:absolute;inset:-150px;z-index:8;pointer-events:none;opacity:${GRAIN_O};
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E");
  transform:translate3d(calc(var(--gx,0) * 1px),calc(var(--gy,0) * 1px),0)}
.specks{position:absolute;inset:0;z-index:9;pointer-events:none}
.speck{position:absolute;background:#fff;border-radius:1px;opacity:0}
.hair{position:absolute;width:1px;background:#fff;opacity:0}
/* the noise burst. screen blended so it adds light to a black frame rather
   than sitting on it as a grey sheet. */
.noise{position:absolute;inset:-40px;z-index:10;pointer-events:none;
  mix-blend-mode:screen;opacity:var(--noise,0);
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.0' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23m)'/%3E%3C/svg%3E");
  transform:translate3d(calc(var(--nx,0) * 1px),calc(var(--ny,0) * 1px),0)}
/* the projector's shutter and, at the very end, the cut. one element, opacity
   only: a flicker takes light away and never adds any. */
.dark{position:absolute;inset:-40px;z-index:11;pointer-events:none;
  background:#000;opacity:var(--dark,0)}
</style>
</head>
<body>
<div class="vignette" aria-hidden="true"></div>
<div class="stage" id="stage">
  <div class="real">
    <span id="accent-probe" style="position:absolute;left:-999px;color:var(--accent)">a</span>
${frameMarkup(m, false)}
${starMarkup(captionMarkup(plan))}
  </div>
${[0, 1, 2].map(i => '  <div class="tear" data-tear="' + i + '"><div class="tear-in">'
    + frameMarkup(m, true) + '</div></div>').join('\n')}
  <div class="scan" aria-hidden="true"></div>
  <div class="grain" aria-hidden="true"></div>
  <div class="specks" aria-hidden="true">
${Array.from({ length: SPECK_SLOTS }, (_, i) => '    <i class="speck" data-speck="' + i + '"></i>').join('\n')}
    <i class="hair" id="hair"></i>
  </div>
  <div class="noise" aria-hidden="true"></div>
  <div class="dark" aria-hidden="true"></div>
</div>
<script>
window.__CAP_PLAN = ${JSON.stringify(plan)};
window.__CAP_BOX = ${JSON.stringify(CAP_BOX)};
${captionPage.toString()}
captionPage();
window.__P10 = ${JSON.stringify({
    VW, VH, WORDMARK_W, PILL_MAX, PILL_PAD, PILL_PAD_Y, PILL_BOTTOM, CAP_BOX,
  })};
${scenePage.toString()}
scenePage();
</script>
</body>
</html>`;
}

/* ---------- the page's own script ----------
   serialised in with .toString(), the way every clip in here serialises its
   own. it measures once, and after that it does as it is told: `frame` writes
   numbers and never computes one. */
function scenePage() {
  const P = window.__P10;

  /* the wordmark, fitted in caps because text-transform is invisible to
     measureText and costs michroma about 15% of its width. every copy is
     fitted, the ghosts included, or a tear would show a wordmark at a different
     size from the one it is tearing. */
  function fitWordmark() {
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = '400 100px Michroma';
    const s = 'the boring tek'.toUpperCase();
    const em = (cv.measureText(s).width + 0.18 * 100 * s.length) / 100;
    const px = (P.WORDMARK_W / em).toFixed(3) + 'px';
    document.querySelectorAll('.wordmark').forEach(el => { el.style.fontSize = px; });
    return +(P.WORDMARK_W / em).toFixed(3);
  }

  /* the pill, fitted to the ink rather than to the box.

     the caption box is fixed and the widest card fills it, so the pill could
     simply be the box plus padding — except that the fit lands the type at
     whatever size the widest card asks for and the ink is then narrower than
     the box by however much the cap bit. measuring the drawn cards and hugging
     the widest is the difference between a bubble around the words and a
     bubble around the space they were allowed.

     it runs once, after the fonts, and the numbers it writes never change
     again. one layout read per clip, never in the frame loop. */
  function fitPill() {
    let w = 0, h = 0;
    for (const card of document.querySelectorAll('.cap-float')) {
      /* the card itself is a full width flex row — left:0 and right:0 inside the
         caption box — so its own rect is the box and measuring it would put a
         pill around the space the words were allowed rather than around the
         words. the ink is the union of the cells inside it, which is laid out
         at all times under the word fill: a word that has not arrived still
         holds its place, so a card is its full width before it is on screen. */
      let l = 1e9, r = -1e9;
      for (const cell of card.querySelectorAll('.cap-w')) {
        const c = cell.getBoundingClientRect();
        if (!c.width) continue;
        l = Math.min(l, c.left); r = Math.max(r, c.right);
      }
      if (r > l) w = Math.max(w, r - l);
      h = Math.max(h, card.getBoundingClientRect().height);
    }
    if (!w || !h) throw new Error('no caption card had a size — the pill would be the box');
    const scale = window.__CAP_PLAN.maxScale || 1;
    const pw = Math.min(P.PILL_MAX, Math.ceil(w * scale) + P.PILL_PAD * 2);
    const ph = Math.ceil(h * scale) + P.PILL_PAD_Y * 2;
    document.documentElement.style.setProperty('--pill-w', pw + 'px');
    document.documentElement.style.setProperty('--pill-h', ph + 'px');
    return { w: pw, h: ph, ink: +(w * scale).toFixed(1), inkH: +(h * scale).toFixed(1) };
  }

  const stage = document.getElementById('stage');
  const tears = [...document.querySelectorAll('.tear')];
  const specks = [...document.querySelectorAll('.speck')];
  const hair = document.getElementById('hair');
  const eyeGroups = [...document.querySelectorAll('.m-eyes')];

  window.__p10 = {
    ready: false,

    /* one call per capture. everything it is handed arrived eased or diced in
       node; nothing in here decides anything. the readback comes back with it
       so a frame costs one round trip rather than three. */
    frame(o) {
      const s = stage.style;
      /* the film and the glitch, both written onto the stage so the tear bands'
         copies read exactly the same numbers the real frame does. */
      s.setProperty('--sx', o.g.sx.toFixed(3));
      s.setProperty('--sy', o.g.sy.toFixed(3));
      s.setProperty('--split', o.g.split.toFixed(3));
      s.setProperty('--capsplit', o.g.capsplit.toFixed(3));
      s.setProperty('--capdx', o.g.capdx.toFixed(3));
      s.setProperty('--capdy', o.g.capdy.toFixed(3));
      s.setProperty('--noise', o.g.noise.toFixed(4));
      s.setProperty('--nx', (o.g.sx * 3).toFixed(2));
      s.setProperty('--ny', (o.g.sy * 3).toFixed(2));
      s.setProperty('--scan', (o.scan + o.g.scan).toFixed(2));
      s.setProperty('--mx', o.g.mx.toFixed(3));
      s.setProperty('--my', o.g.my.toFixed(3));
      /* the darkening is the projector's flicker and the glitch's dropped
         frames and, at the very end, the cut. one channel, the loudest of the
         three, so nothing can be brighter than the black. */
      s.setProperty('--dark', Math.max(o.film.flick, o.g.dark, o.black).toFixed(4));
      s.setProperty('--gx', String(o.film.gx));
      s.setProperty('--gy', String(o.film.gy));
      /* the split rules only paint under this attribute, so at rest the words
         and the shapes carry their glow and nothing else. */
      const gl = (o.g.split > 0.001 || o.g.capsplit > 0.001) ? '1' : '0';
      if (stage.dataset.gl !== gl) stage.dataset.gl = gl;

      /* the mascot and its glow. */
      s.setProperty('--ex', o.ex.toFixed(3));
      s.setProperty('--ey', o.ey.toFixed(3));
      s.setProperty('--blink', o.blink.toFixed(4));
      s.setProperty('--bob', o.bob.toFixed(3));
      s.setProperty('--m-o', o.mascot.toFixed(4));
      s.setProperty('--m-glow', o.glow.toFixed(4));
      s.setProperty('--wm-glow', o.wmGlow.toFixed(4));

      /* the bubble: the three dots and the pill, each with its own entrance. */
      s.setProperty('--bub-o', o.bub.o.toFixed(4));
      s.setProperty('--pill-o', o.bub.pill[0].toFixed(4));
      s.setProperty('--pill-s', o.bub.pill[1].toFixed(4));
      for (let i = 0; i < 3; i++) {
        s.setProperty('--d' + i, o.bub.dots[i][0].toFixed(4));
        s.setProperty('--d' + i + 's', o.bub.dots[i][1].toFixed(4));
      }
      s.setProperty('--wm-o', o.wm.toFixed(4));
      s.setProperty('--star', o.star.toFixed(3));

      /* the tear bands. */
      for (let i = 0; i < tears.length; i++) {
        const b = o.g.bands[i];
        const st = tears[i].style;
        if (!b) { st.setProperty('--th', '0px'); st.setProperty('--to', '0'); continue; }
        st.setProperty('--tt', b.top + 'px');
        st.setProperty('--th', b.h + 'px');
        st.setProperty('--to', '1');
        tears[i].firstElementChild.style.setProperty('--tdx', String(b.dx));
      }

      /* the dust. */
      for (let i = 0; i < specks.length; i++) {
        const sp = o.film.specks[i], el = specks[i];
        if (!sp) { el.style.opacity = '0'; continue; }
        el.style.left = sp.x + 'px'; el.style.top = sp.y + 'px';
        el.style.width = sp.w + 'px'; el.style.height = sp.h + 'px';
        el.style.opacity = String(sp.o);
      }
      if (o.film.hair) {
        hair.style.left = o.film.hair.x + 'px'; hair.style.top = o.film.hair.y + 'px';
        hair.style.height = o.film.hair.h + 'px'; hair.style.opacity = String(o.film.hair.o);
      } else hair.style.opacity = '0';

      /* the caption, applied last so it is the thing that renders. */
      window.__cap.apply(o.cap);

      /* the readback. computed style, so what is asserted is what was drawn
         rather than what was asked for. */
      const eye = eyeGroups[0], er = document.querySelector('.real .m-eye');
      const cs = getComputedStyle(er);
      const accent = getComputedStyle(document.getElementById('accent-probe')).color;
      const vis = [...document.querySelectorAll('.real .cap-float')]
        .filter(el => getComputedStyle(el).visibility !== 'hidden'
          && parseFloat(getComputedStyle(el).opacity) > 0.02);
      /* painted, not "has the active role": the accent is a colour and the
         guard should ask about the colour. this clip's answer must always be
         no. */
      const acc = vis.some(g => [...g.querySelectorAll('*')]
        .some(el => getComputedStyle(el).color === accent));
      return {
        eyes: getComputedStyle(eye).transform,
        wide: cs.getPropertyValue('--wide').trim() || '1',
        blink: parseFloat(cs.getPropertyValue('--blink')) || 1,
        vis: vis.length, acc,
        gl: stage.dataset.gl,
        /* the split has to be reachable as a painted shadow rather than as a
           variable somebody set. `none` here would mean the calc chain did not
           resolve and the whole glitch is a shake with no colour in it. */
        shadow: vis.length ? getComputedStyle(vis[0].querySelector('.cap-w')).textShadow : null,
      };
    },

    /* the whole frame's safe area. captions.mjs measures its own ink and knows
       nothing about a mascot, a bubble or a wordmark, so the two are unioned
       here and the worse of them is what the guard runs against.

       measured on the **real** copy only. a ghost inside a tear band is a
       displaced duplicate of something already counted and it is clipped to a
       band, so including it would fail the frame for the copy rather than for
       the picture. */
    safe() {
      const cap = window.__cap.safe(P.VW, P.VH);
      const out = { ...cap };
      const sel = ['.real .mascot', '.real .pill', '.real .dot', '.real .wordmark'];
      for (const s of sel) {
        for (const el of document.querySelectorAll(s)) {
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden') continue;
          let o = 1, node = el;
          while (node && node !== document.body) { o *= parseFloat(getComputedStyle(node).opacity || '1'); node = node.parentElement; }
          if (o < 0.02) continue;
          const b = el.getBoundingClientRect();
          if (!b.width && !b.height) continue;
          const d = { left: b.left, top: b.top, right: P.VW - b.right, bottom: P.VH - b.bottom };
          if (Math.min(d.left, d.top, d.right, d.bottom)
            < Math.min(out.left, out.top, out.right, out.bottom)) out.worst = s;
          out.left = Math.min(out.left, d.left);
          out.top = Math.min(out.top, d.top);
          out.right = Math.min(out.right, d.right);
          out.bottom = Math.min(out.bottom, d.bottom);
        }
      }
      return out;
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
      return { mascot: r('.real .mascot'), pill: r('.real .pill'),
        dot: r('.real .dot'), wordmark: r('.real .wordmark') };
    },
  };

  document.fonts.load('400 1em Michroma')
    .then(() => document.fonts.load('700 1em "Space Grotesk"'))
    .then(() => document.fonts.ready)
    .then(() => {
      window.__p10.wordmarkSize = fitWordmark();
      window.__built = window.__cap.build();
      /* after the caption is fitted, because it is the fitted size that decides
         how wide the widest card actually draws. */
      window.__p10.pill = fitPill();
      window.__p10.ready = true;
    });
}

/* ---------- what gets injected before the page's own script ----------
   the rAF shim, flushed exactly once per capture, so one tick is one capture.
   nothing in this clip registers a callback — every moving value is eased in
   node and written per frame — and it is installed anyway, because the seeded
   Math.random goes in with it and because the contract every clip in here holds
   is "the page's clock is the capture clock". */
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

/* ---------- the voice, four utterances, cached ----------
   one call per group rather than one for the whole script, and the reason is
   the gap. the stabs need the voice to stop for exactly four tenths of a
   second, and cutting that out of a single recording means finding the silence
   and hoping the synthesiser put it where the full stop was. four recordings
   are four known quantities: each one is trimmed to its own first and last
   word and then laid down on a timeline this file owns.

   the sidecar json is the cache key. if it is there and it is for this line,
   the endpoint is left alone — which also means a re-render cannot quietly
   change the timeline under a clip that has already been approved. */
async function voiceGroup(i) {
  const name = 'post10-g' + (i + 1);
  const cached = path.join(VOICE_OUT, name + '-calm.json');
  const want = GROUPS[i].replace(/\s+/g, ' ').trim();
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === want && fs.existsSync(j.file)) return { ...j, cached: true };
  }
  const r = await speak(GROUPS[i], { voice: 'calm', name });
  return { ...r, cached: false };
}

/* ---------- the voice track ----------
   the four groups laid down on one clock with a measured gap between them.

   each group is trimmed to [first word - PRE, last word + POST] and placed so
   that the distance from one group's last word **ending** to the next group's
   first word **starting** is exactly GAP. the audio therefore stops POST after
   a word and starts PRE before the next one, which leaves GAP - PRE - POST of
   true digital silence in the middle of every gap. a short fade at each edge,
   because a hard cut in a waveform is a click.

   the word list comes back re-timed by the same offsets, so the captions, the
   head bob, the glitch and the stabs are all cut against the timeline that is
   actually in the file. */
function audioEdges(pcm) {
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  const gate = peak * Math.pow(10, SILENCE_DB / 20);
  const H = Math.round(0.005 * SR);
  const n = Math.floor(pcm.length / H);
  const loud = i => {
    let m = 0;
    for (let j = i * H; j < (i + 1) * H; j++) m = Math.max(m, Math.abs(pcm[j]));
    return m > gate;
  };
  let a = 0, b = n - 1;
  while (a < n && !loud(a)) a++;
  while (b > a && !loud(b)) b--;
  return { start: +(a * 0.005).toFixed(4), end: +((b + 1) * 0.005).toFixed(4), peak: +dbfs(peak).toFixed(1) };
}

function buildVoice(groups) {
  const parts = [];
  let cursor = null;
  const words = [];
  const marks = [];
  const gaps = [];
  const edges = [];
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const w0 = g.words[0], wN = g.words[g.words.length - 1];
    const pcm = decode(ffmpeg, g.file);
    const srcLen = pcm.length / SR;
    /* **the gap is measured on the waveform and not on the word list**, and
       that is a fault this file had and rendered a preview with.

       the synthesiser's WordBoundary carries a duration that is shorter than
       the sound: `thing.` came back ending at 4.728 and the recording is still
       at speech level for another tenth of a second after that. a stab placed
       on the reported end therefore opened on top of a word still being said,
       and the check that was supposed to catch it — no music inside a word's
       window — passed, because the window was the wrong window. the run said
       so out loud: the voice was at -21 dB under two of the three stabs, which
       is speech, against a median speech level of -21.

       so a group ends where its own recording falls under SILENCE_DB of its own
       peak, and the next one starts GAP after that. the word list still drives
       the captions, the head bob and the micro glitches, because for those a
       word boundary is exactly the right thing; it is only the silence that has
       to come off the waveform. */
    const e = audioEdges(pcm);
    const soundStart = Math.min(w0.start, e.start);
    const soundEnd = Math.max(wN.end, e.end);
    const a = Math.max(0, soundStart - EDGE);
    const b = Math.min(srcLen, soundEnd + EDGE);
    if (!(b > a)) throw new Error('group ' + (i + 1) + ' has no audio in it');
    /* the first group opens the clip on its first word; every one after it is
       placed so the silence between two recordings is exactly GAP. */
    const off = i === 0 ? INTRO - w0.start : cursor + GAP - soundStart;
    parts.push({ pcm, a, b, off, i });
    for (const w of g.words) {
      words.push({ word: w.word, start: +(w.start + off).toFixed(4), end: +(w.end + off).toFixed(4) });
    }
    marks.push(+(w0.start + off).toFixed(4));
    edges.push({
      i: i + 1,
      lag: +(soundEnd - wN.end).toFixed(3),    /* how far the sound outlasts the word list */
      lead: +(w0.start - soundStart).toFixed(3),
    });
    if (i) gaps.push({ i, at: +cursor.toFixed(4), len: +(soundStart + off - cursor).toFixed(4) });
    cursor = +(soundEnd + off).toFixed(4);
    if (i === groups.length - 1) marks.end = cursor;
  }
  const lastEnd = cursor;
  /* the buffer is allocated with slack on the end and the clip's real length is
     decided later, in main, because it depends on the caption plan and the
     caption plan depends on these words. what comes back here is a ceiling; the
     film is cut out of it. */
  const seconds = +(lastEnd + TAIL.lead + TAIL.outro + TAIL.hold + TAIL.black + TAIL.slack).toFixed(3);
  const buf = new Float32Array(Math.round(seconds * SR));
  const fade = Math.round(0.012 * SR);
  for (const p of parts) {
    const a = Math.round(p.a * SR), b = Math.round(p.b * SR);
    const at = Math.round((p.a + p.off) * SR);
    const n = b - a;
    for (let k = 0; k < n; k++) {
      const dst = at + k;
      if (dst < 0 || dst >= buf.length) continue;
      let g = 1;
      if (k < fade) g = k / fade;
      else if (k > n - fade) g = (n - k) / fade;
      buf[dst] += p.pcm[a + k] * g;
    }
  }
  return { buf, words, seconds, lastEnd, marks, gaps, edges, parts: parts.length };
}

/* ---------- the music ----------
   read by waveform, sliced by measurement.

   `punchOf` is the whole of the "which track hits harder" question in one
   number: the biggest rise anywhere in the file from the 60ms before a moment
   to the 80ms after it, in dB. a wash scores single figures and a track with
   real transients scores in the teens. the run prints both and refuses to
   render if the track named as the main is not the harder of the two, which is
   what stops a swapped pair of files from quietly changing the clip. */
function punchOf(buf) {
  const H = Math.round(0.010 * SR);
  const n = Math.floor(buf.length / H);
  const rms = new Float32Array(n);
  let peak = 0;
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = i * H; j < (i + 1) * H; j++) s += buf[j] * buf[j];
    rms[i] = Math.sqrt(s / H);
    peak = Math.max(peak, rms[i]);
  }
  /* two floors, and both are here because the first version of this scored
     track1 at +144.6 dB. that file opens on **true digital silence**, so `pre`
     was zero, dbfs of nothing is -180, and the first note in the piece came
     back as an infinite rise off it. the number was arithmetic rather than a
     measurement and it would have failed the render on the wrong track.

     so: the level a moment rises **from** is floored 60 dB under the file's own
     loudest tenth of a second, which is quiet enough to be a real gap and loud
     enough not to be nothing; and a rise only counts if it rises **to**
     something worth calling a hit, which is within 18 dB of that same peak. a
     wash then scores single figures because it has no gaps, and a track with
     real transients scores in the teens because it does. */
  const floor = peak * Math.pow(10, -60 / 20);
  const worth = peak * Math.pow(10, -18 / 20);
  let best = 0, at = 0;
  for (let i = 6; i < n - 8; i++) {
    let pre = 0;
    for (let j = i - 6; j < i; j++) pre = Math.max(pre, rms[j]);
    /* **a hit is a rise from something audible, not a rise from nothing.**
       flooring `pre` was not enough on its own: track1 opens on digital silence
       and then starts, and its first note still scored +58 dB against the floor
       rather than against a level. so a moment whose sixty milliseconds of
       run-up are under the floor is not a transient at all, it is a file
       beginning, and it is skipped. */
    if (pre < floor) continue;
    let post = 0;
    for (let j = i; j < i + 8; j++) post = Math.max(post, rms[j]);
    if (post < worth) continue;
    const d = dbfs(post) - dbfs(pre);
    if (d > best) { best = d; at = i * 0.010; }
  }
  return { db: +best.toFixed(1), at: +at.toFixed(2), peak: +dbfs(peak).toFixed(1) };
}

/* rms of a stretch, in dBFS. used for every level claim this file makes. */
function rmsOf(buf, a, b) {
  const i0 = Math.max(0, Math.round(a * SR)), i1 = Math.min(buf.length, Math.round(b * SR));
  if (i1 <= i0) return -Infinity;
  let s = 0;
  for (let i = i0; i < i1; i++) s += buf[i] * buf[i];
  return dbfs(Math.sqrt(s / (i1 - i0)));
}

/* the four slices, cut and laid onto a bus at the clip's own length. one gain
   for all four, so the escalation between the three stabs is the source's and
   not three numbers somebody chose. */
function buildMusic(src, cues, seconds, gain) {
  const bus = new Float32Array(Math.round(seconds * SR));
  const report = [];
  for (const c of cues) {
    const a = Math.round(c.at * SR), n = Math.round(c.for * SR);
    if (a + n > src.length) throw new Error('slice at ' + c.at + 's runs off the end of the track');
    const fi = Math.round(SLICE_FADE.in * SR);
    const fo = Math.round((c.kind === 'outro' ? SLICE_FADE.outroOut : SLICE_FADE.stabOut) * SR);
    const at = Math.round(c.t * SR);
    let peak = 0, sum = 0;
    for (let k = 0; k < n; k++) {
      const dst = at + k;
      if (dst < 0 || dst >= bus.length) continue;
      let g = gain;
      if (k < fi) g *= k / fi;
      else if (k > n - fo) g *= (n - k) / fo;
      const v = src[a + k] * g;
      bus[dst] += v;
      peak = Math.max(peak, Math.abs(v)); sum += v * v;
    }
    report.push({
      kind: c.kind, from: +c.at.toFixed(2), for: +c.for.toFixed(2), t: +c.t.toFixed(3),
      peak: +dbfs(peak).toFixed(1), rms: +dbfs(Math.sqrt(sum / n)).toFixed(1),
      attack: +rmsOf(src, c.at, c.at + 0.08).toFixed(1),
      note: c.note,
    });
  }
  return { bus, report };
}

/* ---------- render ---------- */
function frameFile(f) { return path.join(FRAMES, 'f' + String(f).padStart(6, '0') + '.jpg'); }
function subFile(i) { return path.join(SUBS, 's' + String(i).padStart(6, '0') + '.jpg'); }
function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }

/* ---------- the blend ----------
   tmix is a rolling mean of the last N frames, so the frame that is the mean of
   a whole output frame is the last of its N. trim throws away the first N-1,
   which reach back before the film, and framestep keeps every Nth of the rest.

   it is written that way to avoid punctuation: select=eq(mod(n,4),3) says the
   same thing and needs its commas escaped past three layers of quoting, which
   silently parsed as a filter called "4)" the first time scenes-test tried it.
   post9's note, and its numbers still hold. */
function blend(frames) {
  console.log('  blending ' + frames * SUB + ' subframes into ' + frames + ' frames ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS * SUB), '-i', path.join(SUBS, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1)
      + ',setpts=PTS-STARTPTS,framestep=' + SUB,
    '-start_number', '0', '-q:v', '2', path.join(FRAMES, 'f%06d.jpg')]);
  let made = 0;
  for (let i = 0; i < frames; i++) if (fs.existsSync(frameFile(i))) made++;
  if (made !== frames) {
    throw new Error('the blend made ' + made + ' frames for ' + frames
      + ' captured — the subframe window is off by one and the film would be the wrong length');
  }
}

/* ---------- the bubble's entrance ----------
   the site's own stagger, outward: dot, dot, dot, pill, 70ms apart, each on
   --spring. the delays live only in the arrival, so the departure has none and
   the whole thing leaves at once — speech arrives in order, silence is instant.
   that is index.html's rule and it is kept here. */
const BUB = { at: 0.02, step: 0.07, for: 0.26 };
function bubbleAt(t, outAt) {
  const gone = outAt === null ? 0 : span(t, outAt, outAt + 0.10);
  const o = (1 - gone);
  const one = k => {
    const a = BUB.at + k * BUB.step;
    const p = span(t, a, a + BUB.for);
    return [p <= 0 ? 0 : 1, lerp(0.55, 1, SPRING(p))];
  };
  return { o, dots: [one(0), one(1), one(2)], pill: one(3) };
}

/* ---------- the star ----------
   the censored pixel. mostly there, and every so often gone for a frame or
   two, which is what a character a broadcaster has taken out looks like. it
   only flickers while its own card is up; the rest of the time it is simply the
   glyph the word is written with. */
function starAt(f, from, to) {
  const t = f / FPS;
  if (t < from || t > to) return 1;
  const r = prng(0xa571a2 ^ (f * 2654435761));
  return r() < 0.10 ? 0.12 : 1;
}

async function render(plan, v, T, glitchWins, micro, blinks, keys, samples, seconds) {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  const N = Math.round(FPS * seconds);
  for (const d of [FRAMES, SUBS]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  fs.mkdirSync(OUT, { recursive: true });
  console.log('  post10-1080x1920: ' + VW * DSF + 'x' + VH * DSF + ', ' + N + ' frames'
    + (BLUR ? ', ' + SUB + ' subframes each' : ''));

  const m = mascotParts();
  const { srv, port } = await serveHtml(page(plan, m));
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none',
      '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio'],
  });
  const pg = await browser.newPage();
  await pg.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });
  await pg.evaluateOnNewDocument(injected);
  const cdp = await pg.createCDPSession();
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
  /* load under a paused clock, so the google fonts request costs real seconds
     but no virtual milliseconds and frame zero is a genuinely settled page. */
  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' });
  let burned = 0;
  for (let i = 0; i < 200; i++) {
    const ok = await pg.evaluate(() => !!(window.__p10 && window.__p10.ready
      && window.__cap && window.__cap.ready && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP); burned += STEP;
  }
  if (!await pg.evaluate(() => !!(window.__p10 && window.__p10.ready))) {
    throw new Error('the page never became ready');
  }
  /* offline the whole clip renders in the mono fallback and looks almost right,
     which is the worst kind of wrong to ship. 700 is checked with the others
     because it is the weight the captions are set in and a miss falls back to
     400 rather than to mono, which is even quieter. */
  const faces = await pg.evaluate(() => ({
    michroma: document.fonts.check('40px Michroma'),
    grotesk: document.fonts.check('400 20px "Space Grotesk"'),
    'grotesk 700': document.fonts.check('700 20px "Space Grotesk"'),
  }));
  for (const [k, val] of Object.entries(faces)) {
    if (!val) throw new Error(k + ' did not load — the clip would be set in the fallback');
  }
  console.log('  page ready after ' + burned.toFixed(0) + 'ms of virtual time');

  const built = await pg.evaluate(() => window.__built);
  const pill = await pg.evaluate(() => window.__p10.pill);
  const wmSize = await pg.evaluate(() => window.__p10.wordmarkSize);
  const boxes = await pg.evaluate(() => window.__p10.boxes());
  console.log('  cards fitted at ' + built.size.toFixed(1) + 'px, widest '
    + built.widest.toFixed(2) + 'em, the pill measured ' + pill.w + 'x' + pill.h
    + ' around ' + pill.ink + 'x' + pill.inkH + ' of ink (cap ' + PILL_MAX + ')');
  console.log('  wordmark ' + wmSize.toFixed(1) + 'px fitted to ' + WORDMARK_W
    + ', head ' + boxes.mascot.top.toFixed(0) + '..' + boxes.mascot.bottom.toFixed(0)
    + ', pill ' + boxes.pill.top.toFixed(0) + '..' + boxes.pill.bottom.toFixed(0)
    + '  (css px of ' + VH + ')');

  const starCard = plan.groups[0];

  let safeWorst = null;
  const safeSamples = [];
  let sawAccent = false, maxVisible = 0, capMoved = 0, prevSum = null, sawShadow = false;
  let wideSeen = null, lastTx = null, lastTy = null, gazeJump = { d: 0, t: 0 };
  const eyeFaults = [], blinkSteps = [];
  let lastBlink = null, blinkJump = { d: 0, t: 0 };
  let glFrames = 0, bandFrames = 0, microSeen = 0, calmFaults = 0;
  let lastState = null, stillFrames = 0, minMove = Infinity;
  const sampled = new Set();

  const wall = Date.now();
  for (let f = 0; f < N; f++) {
    /* ---------- the frame's glitch, computed once and held ----------
       this is the quantisation the header talks about. `glitchFrame` is handed
       the output frame index, so every one of the SUB captures inside this
       frame is written the same values and the blend cannot average a fault
       into three quarters of nothing. it is structural rather than asserted:
       there is no path by which a subframe could compute its own. */
    const g = glitchFrame(glitchWins, micro, f);
    const film = filmAt(f);
    if (g.heat > 0) glFrames++;
    if (g.bands.length) bandFrames++;
    if (micro.has(f)) microSeen++;

    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const first = k === 0;

      /* everything below rides continuous time and is meant to smear under the
         shutter: the caption's springs, the eyes, the blink, the head bob and
         the bubble's entrance. */
      const cap = captionFrame(plan, t);
      const mascot = 1 - span(t, T.outro, T.mascotGone);
      const wm = span(t, T.wmIn, T.wmIn + 0.22) * (1 - span(t, T.black, T.black + 0.06));
      const o = {
        cap, g, film,
        ex: keyAt(keys.x, t, EASE_IO), ey: keyAt(keys.y, t, EASE_IO),
        blink: blinkFrom(blinks, t),
        bob: bobAt(v.words, t),
        mascot,
        /* the phosphor pulse. slow, continuous — so it rides the shutter rather
           than stepping — and on two different periods so the head and the
           wordmark never breathe together. the radius is never touched: a
           blur that is re-rasterised every frame is the one thing the glow
           spec bans, and what moves here is opacity and brightness. */
        glow: mascot * (1 + 0.10 * Math.sin(2 * Math.PI * t / 3.7)),
        wmGlow: 1 + 0.09 * Math.sin(2 * Math.PI * t / 4.3),
        bub: bubbleAt(t, T.outro),
        wm,
        star: starAt(f, starCard.in, starCard.out),
        /* the scanline roll. **stepped with the grain rather than rolled**,
           and that is a bitrate decision as much as a look one: a one pixel
           line pattern sliding continuously across a 1080x1920 frame is a full
           screen of moving high frequency detail, which is the single most
           expensive thing a codec can be handed. the first preview cost 7.2
           Mbit/s and this is most of why. stepped, the layer is identical on
           four frames out of five, and film jitters rather than gliding
           anyway. */
        scan: Math.floor(f / (FPS / GRAIN_HZ)) % 4,
        black: span(t, T.black, T.black + 0.05),
      };
      const seen = await pg.evaluate(fr => window.__p10.frame(fr), o);

      if (first) {
        if (seen.acc) sawAccent = true;
        if (seen.shadow && seen.shadow !== 'none') sawShadow = true;
        maxVisible = Math.max(maxVisible, seen.vis);
        const sum = cap.w.reduce((a, w) => a + w[0] + w[1], 0);
        if (prevSum !== null) capMoved = Math.max(capMoved, Math.abs(sum - prevSum));
        prevSum = sum;

        /* the glitch is either on or it is off, and "off" means every channel
           at rest rather than nearly. a channel still writing outside a window
           is the fault this counts. */
        if (g.heat === 0 && !micro.has(f)) {
          if (g.sx || g.sy || g.split || g.noise || g.dark || g.bands.length
            || g.mx || g.my || g.capdx || g.capdy || g.capsplit) calmFaults++;
        }

        /* matrix(a,b,c,d,e,f): e is the x translation, f the y. both are read
           and the step is the length of the vector between two frames, so a
           snap on either axis or on both at once is one number to compare. */
        const mx = (seen.eyes.match(/matrix\(([^)]*)\)/) || [0, '0,0,0,0,0,0'])[1].split(',');
        const tx = parseFloat(mx[4]) || 0, ty = parseFloat(mx[5]) || 0;
        if (wideSeen === null) wideSeen = seen.wide;
        else if (seen.wide !== wideSeen) eyeFaults.push({ t, what: 'wide', was: wideSeen, now: seen.wide });
        if (lastTx !== null) {
          const d = Math.hypot(tx - lastTx, ty - lastTy);
          if (d > gazeJump.d) gazeJump = { d, t };
          if (d > GAZE_LIMIT) eyeFaults.push({ t, what: 'gaze', was: [lastTx, lastTy], now: [tx, ty] });
        }
        lastTx = tx; lastTy = ty;
        if (lastBlink !== null) {
          const d = Math.abs(seen.blink - lastBlink);
          if (d > blinkJump.d) blinkJump = { d, t };
          if (d > BLINK_LIMIT) blinkSteps.push({ t, from: lastBlink, to: seen.blink });
        }
        lastBlink = seen.blink;

        /* nothing is ever a still frame. every value the frame was written with
           is summed and compared against the frame before it — the caption, the
           eyes, the bob, the bubble, the grain, the specks and the glitch — so
           a pair of identical frames is a real fault rather than a guess about
           one. the black hold at the end is excluded, because a frame that is
           entirely black is supposed to be the same as the one before it. */
        const state = sum
          + o.ex * 13 + o.ey * 17 + o.blink * 23 + o.bob * 29 + o.mascot * 31 + o.wm * 37
          + o.bub.o * 41 + o.bub.pill[1] * 43 + o.star * 47 + o.scan * 53
          + o.glow * 101 + o.wmGlow * 103
          + film.gx * 59 + film.gy * 61 + film.flick * 400
          + film.specks.reduce((a, s, i) => a + (s ? (s.x + s.y * 3 + s.o * 7) * (i + 2) : 0), 0)
          + (film.hair ? film.hair.x + film.hair.h : 0)
          + g.sx * 71 + g.sy * 73 + g.split * 79 + g.noise * 83 + g.dark * 89
          + g.bands.reduce((a, b, i) => a + (b.top + b.h + b.dx) * (i + 3), 0);
        if (lastState !== null && t < T.black) {
          const d = Math.abs(state - lastState);
          if (d < 1e-9) stillFrames++;
          minMove = Math.min(minMove, d);
        }
        lastState = state;

        /* one safe area sample per card at its settled frame, plus one at every
           glitch's worst frame, plus the end card. a sample on a calm frame
           proves nothing about a frame that is fourteen pixels sideways. */
        for (const s of samples) {
          if (sampled.has(s.id) || t < s.t) continue;
          sampled.add(s.id);
          const sa = await pg.evaluate(() => window.__p10.safe());
          safeSamples.push({ id: s.id, what: s.what, t: +t.toFixed(3), ...sa });
          if (!safeWorst || Math.min(sa.left, sa.top, sa.right, sa.bottom)
            < Math.min(safeWorst.left, safeWorst.top, safeWorst.right, safeWorst.bottom)) {
            safeWorst = { id: s.id, what: s.what, t: +t.toFixed(3), ...sa };
          }
        }
      }

      /* one rAF tick, exactly one capture's worth. nothing in this clip
         registers a callback; the tick is the contract, not the payload. */
      await pg.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);

      /* clip.scale is what actually gets device pixels out. a plain
         captureScreenshot hands back css pixels however high the dsf is. */
      const shot = await cdp.send('Page.captureScreenshot', {
        format: 'jpeg', quality: 94, captureBeyondViewport: false,
        clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
      });
      fs.writeFileSync(BLUR ? subFile(idx) : frameFile(f), Buffer.from(shot.data, 'base64'));
      await advance(SUBSTEP);
    }

    if (f % 240 === 0) {
      console.log('  ' + String(f).padStart(4) + '/' + N + '  t=' + (f / FPS).toFixed(2) + 's  '
        + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
    }
  }
  await browser.close();
  srv.close();
  if (BLUR) blend(N);

  const dev = x => Math.round(x * DSF);
  console.log('  glitch: ' + glFrames + ' of ' + N + ' frames carry one ('
    + (glFrames / N * 100).toFixed(1) + '%), ' + bandFrames + ' of them tear, '
    + microSeen + ' single frame micro glitches, ' + calmFaults
    + ' frame(s) where a channel was still writing outside a window');
  console.log('  gaze: biggest one-frame move ' + gazeJump.d.toFixed(3) + ' at '
    + gazeJump.t.toFixed(2) + 's, limit ' + GAZE_LIMIT.toFixed(2)
    + ' — --wide held at ' + wideSeen);
  console.log('  blink: biggest one-frame lid step ' + blinkJump.d.toFixed(3)
    + ' at ' + blinkJump.t.toFixed(2) + 's, ' + (blinkSteps.length || 'none')
    + ' over the ' + BLINK_LIMIT.toFixed(2) + ' limit');
  console.log('  safe area, worst of ' + safeSamples.length + ' samples, at '
    + safeWorst.t.toFixed(2) + 's (' + safeWorst.what + '): '
    + dev(safeWorst.left) + 'px left, ' + dev(safeWorst.top) + ' top, '
    + dev(safeWorst.right) + ' right, ' + dev(safeWorst.bottom) + ' bottom'
    + '  (floors ' + SAFE.left + '/' + SAFE.top + '/' + SAFE.right + '/' + SAFE.bottom
    + ', tightest is ' + safeWorst.worst + ')');
  console.log('  liveness: ' + stillFrames + ' identical frame pair(s) before the cut, '
    + 'smallest change between two frames ' + (minMove === Infinity ? '?' : minMove.toExponential(2)));

  const state = {
    seconds, frames: N, built, pill, wmSize, boxes,
    safe: safeWorst, safeSamples, sampled: sampled.size, wanted: samples.length,
    sawAccent, sawShadow, maxVisible, capMoved,
    eyeFaults, blinkSteps, blinkJump, gazeJump, wide: wideSeen, blinks: blinks.length,
    glFrames, bandFrames, microSeen, calmFaults, stillFrames,
    minMove: minMove === Infinity ? null : minMove,
    T,
  };
  fs.writeFileSync(path.join(OUT, 'post10-1080x1920.json'), JSON.stringify(state, null, 2));
  return state;
}

/* ---------- encode ----------
   the clips' settings, plus the finished mix. no -shortest: the mix is rendered
   to the clip's own length rather than the voice's, so both streams end
   together and the film keeps its black tail. */
function encode(audioFile) {
  const out = path.join(OUT, 'post10-1080x1920.mp4');
  console.log('  encoding at crf ' + CRF + ' ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%06d.jpg'),
    '-i', audioFile,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p',
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
  const dir = path.join(OUT, 'verify-post10');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const [t, name] of at) {
    ff(['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(t),
      '-i', mp4, '-frames:v', '1', path.join(dir, name + '.png')]);
  }
  return dir;
}

/* ---------- go ---------- */
async function main() {
  console.log('the boring tek — social clip #10, the rage clip');
  console.log('  the shutter is ' + (BLUR ? 'open, ' + SUB + ' subframes to a frame'
    : 'shut — this is a timing pass, not the final') + ', at ' + FPS + 'fps');
  brandTokens();      /* fail here, before a render, if a token has moved */

  /* ---------- the voice ---------- */
  const groups = [];
  for (let i = 0; i < GROUPS.length; i++) groups.push(await voiceGroup(i));
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    console.log('  group ' + (i + 1) + (g.cached ? ' (cached)' : '') + ': ' + g.voiceId
      + ', ' + g.seconds.toFixed(2) + 's, ' + g.words.length + ' words, timings from the ' + g.timing);
    if (g.timing !== 'engine') {
      throw new Error('group ' + (i + 1) + ' came back with estimated timings — every cue in this '
        + 'clip is cut against a word boundary and an estimate is not one');
    }
  }
  const v = buildVoice(groups);
  console.log('  the voice track: ' + v.words.length + ' words, first at '
    + v.words[0].start.toFixed(2) + 's, last ends ' + v.lastEnd.toFixed(2) + 's, '
    + v.seconds.toFixed(2) + 's of clip');
  const gaps = v.gaps;
  console.log('  the gaps: ' + gaps.map(g => g.len.toFixed(3) + 's of silence from '
    + g.at.toFixed(2) + 's').join(', ') + '  (wanted ' + GAP.toFixed(2) + 's each)');
  console.log('  the sound outlasts the word list by '
    + v.edges.map(e => e.lag.toFixed(3)).join('s, ') + 's per group, which is why the gap '
    + 'is measured on the waveform and not on the boundaries');

  /* ---------- the captions ----------
     the censor is applied here, to the caption's copy only. the voice already
     said the word and its timings are the timings this list carries. */
  const capWords = v.words.map(w => {
    const key = w.word.replace(/[^a-z]/gi, '').toLowerCase();
    return CENSOR[key] ? { ...w, word: CENSOR[key] + w.word.replace(/^[a-z]+/i, '') } : w;
  });
  /* three words to a card, and the copy is what actually decides it: every line
     in this script is its own sentence, a card breaks at a sentence end, and no
     line is longer than three words. so `perCard` is a ceiling that is never
     reached rather than a cut, and CARDS above is the proof of it.

     `float` rather than `pop`, and that is the one style decision in the file.
     pop paints the word being said in the accent, and with a card this short
     that is a green word on almost every frame — which this clip does not have
     and post9's review is the reason. float's ink is --fg and only --fg, its
     accent budget is zero unless a clip names a word in `flash`, and no word is
     named. white on black, all the way through.

     `fill: 'word'` rather than the engine's default `card`: the words have to
     arrive one at a time, because that is what a bubble filling up looks like
     and the brief asks for a pop per voice word. the flaw the default was made
     to fix — a two word card sitting off centre while the second word is
     missing — is what a speech bubble does anyway. */
  /* `lead` is 0.05 rather than the engine's 0.12, and the preview's review is
     why. the lead exists so a card's entrance spring has finished by the time
     its first word is said — which is exactly right under the `card` fill,
     where the card is the thing that springs. under `word` the card does not
     spring at all and the **word** arrives 0.05s before it is spoken, so a
     0.12s lead only decides one thing: how long the previous card has been
     gone before the next word is drawn. at 0.12 that is seventy milliseconds of
     an empty pill, seventeen times over, and the review caught two of them in
     four consecutive samples. at 0.05 the handoff is exact: the card in front
     leaves on the frame the next word arrives. */
  const plan = planCaptions(capWords, {
    style: 'float', perCard: 3, fill: 'word', floatSize: 44, lead: 0.05,
  });
  console.log(describe(plan));

  /* ---------- where the film comes apart ----------
     **the later of "the voice has stopped" and "the last card has left", and
     the second half of that is the final's own review's.** the first cut took
     the exit off the voice alone, so the mascot and the bubble were torn away
     at 14.50 while `and love it` was still up until 14.72 — two tenths of a
     second of white words floating on black with no bubble round them, which
     reads as a mistake rather than as a style. the caption owns the frame until
     it is finished with it.

     everything in the tail hangs off this one number, so there is one place it
     can be wrong and the run prints it. */
  const EXIT = +Math.max(v.lastEnd + TAIL.lead, plan.seconds).toFixed(3);
  const T = {
    outro: EXIT,
    mascotGone: +(EXIT + 0.30).toFixed(3),
    wmIn: +(EXIT + 0.42).toFixed(3),
    wmClean: +(EXIT + 0.64).toFixed(3),
    musicEnd: +(EXIT + TAIL.outro).toFixed(3),
    black: +(EXIT + TAIL.outro + TAIL.hold).toFixed(3),
  };
  const SECONDS = +(T.black + TAIL.black).toFixed(3);
  if (SECONDS > v.seconds) {
    throw new Error('the film is ' + SECONDS.toFixed(2) + 's and the voice buffer was '
      + 'allocated to ' + v.seconds.toFixed(2) + 's — raise TAIL.slack');
  }
  /* the voice track, cut to the film's own length. */
  const voice = v.buf.subarray(0, Math.round(SECONDS * SR));
  console.log('  the tail: last sound ' + v.lastEnd.toFixed(2) + 's, last card leaves '
    + plan.seconds.toFixed(2) + 's, the frame comes apart at ' + EXIT.toFixed(2)
    + 's, black from ' + T.black.toFixed(2) + 's, ' + SECONDS.toFixed(2) + 's of clip');
  const glitchWins = [
    { id: 'open', t0: 0, t1: 0.22, force: 0.85, seed: 0x0e11a1 },
    ...gaps.map((g, i) => ({ id: 'stab' + (i + 1), t0: g.at, t1: g.at + GAP, force: 1, seed: 0x51ab00 + i * 977 })),
    /* the outro's own: the mascot is torn off the screen, then the wordmark is
       torn onto it. two windows rather than one long one, so the half second
       between them is genuinely calm and the wordmark's arrival reads as a
       second event rather than as the same fault continuing. */
    { id: 'exit', t0: T.outro, t1: T.outro + 0.30, force: 1, seed: 0xe0a17c },
    { id: 'wordmark', t0: T.outro + 0.42, t1: T.outro + 0.64, force: 0.8, seed: 0x0d1a11 },
  ];
  /* one frame per word, on the frame that word starts. a set rather than a
     list, so the lookup in the frame loop is a lookup. */
  const micro = new Set(v.words.map(w => Math.floor(w.start * FPS + 1e-9)));
  console.log('  glitches: ' + glitchWins.map(g => g.id + ' ' + g.t0.toFixed(2) + '..'
    + g.t1.toFixed(2)).join(', '));
  console.log('  micro glitches: ' + micro.size + ' frames for ' + v.words.length + ' words');

  const BLINKS = blinkList(SECONDS);
  const KEYS = eyeKeys(v.marks);

  /* ---------- the music ----------
     both tracks are decoded and measured on every run. the choice is the
     measurement's, and a swapped pair of files fails the render rather than
     changing the clip. */
  const mainFile = path.join(MUSIC_DIR, MUSIC.main);
  const otherFile = path.join(MUSIC_DIR, MUSIC.other);
  for (const f of [mainFile, otherFile]) {
    if (!fs.existsSync(f)) throw new Error('no music at ' + path.relative(ROOT, f)
      + ' — demo/music/ is gitignored, so the licensed files have to be put back by hand');
  }
  const mainPcm = decode(ffmpeg, mainFile);
  const otherPcm = decode(ffmpeg, otherFile);
  const punchMain = punchOf(mainPcm), punchOther = punchOf(otherPcm);
  console.log('  the music, read by waveform:');
  console.log('    ' + MUSIC.main + '  ' + (mainPcm.length / SR).toFixed(2) + 's, rms '
    + rmsOf(mainPcm, 0, mainPcm.length / SR).toFixed(1) + ' dBFS, biggest transient rise +'
    + punchMain.db + ' dB at ' + punchMain.at + 's');
  console.log('    ' + MUSIC.other + '  ' + (otherPcm.length / SR).toFixed(2) + 's, rms '
    + rmsOf(otherPcm, 0, otherPcm.length / SR).toFixed(1) + ' dBFS, biggest transient rise +'
    + punchOther.db + ' dB at ' + punchOther.at + 's');

  /* where each slice lands on the clip's clock. the stabs sit in the gaps and
     the outro sits in the tail; nothing here is a hand written time. */
  const cues = [
    ...MUSIC.stabs.map((s, i) => ({ ...s, kind: 'stab', t: gaps[i].at })),
    { ...MUSIC.outro, kind: 'outro', t: T.outro },
  ];

  /* the one gain, and what sets it.

     the speech level is the median of the 20ms windows a word is actually being
     said in, which is what a listener hears as "the voice". peak is the wrong
     unit for the comparison — a plosive peaks far over its own loudness — so
     the relationship is set against that median and the peak rule is a ceiling
     on top of it. the quieter of the two wins and the run says which. */
  const speech = (() => {
    const w = Math.round(0.02 * SR);
    const vals = [];
    for (const word of v.words) {
      for (let a = Math.round(word.start * SR); a + w < Math.round(word.end * SR); a += w) {
        let s = 0;
        for (let i = a; i < a + w; i++) s += voice[i] * voice[i];
        vals.push(Math.sqrt(s / w));
      }
    }
    vals.sort((a, b) => a - b);
    let peak = 0;
    for (let i = 0; i < voice.length; i++) peak = Math.max(peak, Math.abs(voice[i]));
    return { median: dbfs(vals[Math.floor(vals.length / 2)]), peak: dbfs(peak), windows: vals.length };
  })();
  /* the trim is applied to the voice inside `mixdown`, so the relationship is
     set against the voice that is actually in the file. */
  const vMedian = speech.median + VOICE_TRIM, vPeak = speech.peak + VOICE_TRIM;
  const dry = buildMusic(mainPcm, cues, SECONDS, 1);
  const dryStabRms = dbfs(Math.sqrt(dry.report.filter(r => r.kind === 'stab')
    .reduce((a, r) => a + Math.pow(10, r.rms / 10), 0) / 3));
  const dryPeak = Math.max(...dry.report.map(r => r.peak));
  const byRms = (vMedian + MUSIC_OVER_SPEECH) - dryStabRms;
  const byPeak = (vPeak + MUSIC_PEAK_HEAD) - dryPeak;
  const musicGainDb = Math.min(byRms, byPeak);
  const musicGain = Math.pow(10, musicGainDb / 20);
  const music = buildMusic(mainPcm, cues, SECONDS, musicGain);
  console.log('    the slices, all four out of ' + MUSIC.main + ':');
  for (const r of music.report) {
    console.log('      ' + r.kind.padEnd(5) + ' ' + r.from.toFixed(2).padStart(6) + 's +'
      + r.for.toFixed(2) + 's  ->  ' + r.t.toFixed(2).padStart(6) + 's in the clip   rms '
      + r.rms.toFixed(1).padStart(6) + '  peak ' + r.peak.toFixed(1).padStart(6)
      + '   (' + r.note + ')');
  }
  console.log('    ' + MUSIC.other + ' is not used, for either role: it never hits (+'
    + punchOther.db + ' dB against +' + punchMain.db + ') and neither track has a riser in it');
  console.log('    one gain for all four, ' + musicGainDb.toFixed(2) + ' dB, set by the '
    + (byRms <= byPeak ? 'speech rule' : 'peak ceiling') + ' (speech would ask '
    + byRms.toFixed(2) + ', the peak ceiling allows ' + byPeak.toFixed(2) + ')');

  /* ---------- the mix ---------- */
  const env = voiceEnvelope(v.words, SECONDS);
  const mix = mixdown(voice, music.bus, env, { duck: DUCK, voiceGain: VOICE_TRIM });

  /* the check this clip actually needs. post6's rule is that the effects bus is
     quieter than the voice wherever a word is being said; this clip's sound
     design is that they are never on at the same time at all, so the rule with
     teeth is the stronger one: **not one sample of music inside a word.** it is
     measured on the two buffers that are about to be summed. */
  const overlap = (() => {
    let samples = 0, worst = 0, at = 0;
    for (const w of v.words) {
      /* the word's own window and not a millisecond more. a margin either side
         would be measuring the design as a fault: a stab opens on the frame the
         last word of a group ends, which is the point of it. */
      const a = Math.max(0, Math.round(w.start * SR));
      const b = Math.min(mix.bus.length, Math.round(w.end * SR));
      for (let i = a; i < b; i++) {
        const m = Math.abs(mix.bus[i]);
        if (m > 1e-5) { samples++; if (m > worst) { worst = m; at = i / SR; } }
      }
    }
    return { seconds: +(samples / SR).toFixed(4), worst: dbfs(worst), at: +at.toFixed(3) };
  })();
  /* and the question from the other end, which the word windows cannot answer:
     a group's recording is kept POST seconds past its own last word, so is what
     is under a stab actually silence. measured on the voice buffer over each
     stab's exact window, against the level a word is said at. */
  const stabSilence = cues.filter(c => c.kind === 'stab').map(c => {
    let pk = 0;
    for (let i = Math.round(c.t * SR); i < Math.round((c.t + c.for) * SR); i++) {
      pk = Math.max(pk, Math.abs(voice[i] || 0));
    }
    return { t: +c.t.toFixed(2), db: +dbfs(pk).toFixed(1) };
  });
  /* what the ducker did, and what post6's number would have done.

     `moved` is the real answer and it must be zero: DUCK is 0, so the bus in
     the mix has to be the bus that was built, sample for sample. `wouldPull` is
     the counterfactual, and it is the reason DUCK is 0 — the envelope's 220ms
     release is still open when a stab lands, because a stab lands the instant a
     word stops, so post6's 0.60 would have taken this much off the attack of
     every stab in the film. */
  const ducked = (() => {
    let moved = 0, open = 0;
    for (let i = 0; i < mix.bus.length; i++) {
      if (Math.abs(music.bus[i]) <= 1e-5) continue;
      moved = Math.max(moved, Math.abs(mix.bus[i] - music.bus[i]));
      open = Math.max(open, env[i] || 0);
    }
    return { moved, open, wouldPull: -20 * Math.log10(1 - DUCK_POST6 * open) };
  })();

  /* ---------- the loudness pass ----------
     one gain for the voice and the music together, so the balance decided above
     survives it, then a look ahead limiter to hold the true peak, then a
     measurement of what that actually delivered. it iterates rather than
     calculating, because limiting costs loudness and how much it costs depends
     on the material; each pass starts from the same summed mix, so the file is
     only ever gained and limited once and nothing accumulates. */
  const wav = path.join(OUT, 'post10-mix.wav');
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
  console.log('    voice          ' + v.words.length + ' words in four takes, peak '
    + dbfs(mix.voiceRawPeak).toFixed(1) + ' dB as decoded and ' + dbfs(mix.voicePeak).toFixed(1)
    + ' dB in the mix, median speech ' + speech.median.toFixed(1) + ' dB over '
    + speech.windows + ' windows');
  console.log('    balance        ' + VOICE_TRIM.toFixed(1) + ' dB on the voice ('
    + (Math.pow(10, VOICE_TRIM / 20) * 100).toFixed(0) + '% of where it was), the music at '
    + musicGainDb.toFixed(1) + ' dB, no background bed');
  console.log('    music bus      peak ' + dbfs(mix.busPeak).toFixed(1) + ' dB, '
    + (3 * GAP + TAIL.outro).toFixed(2) + 's of the ' + SECONDS.toFixed(2) + 's clip');
  console.log('    the overlap    ' + overlap.seconds.toFixed(3)
    + 's of music inside a word — the check post6 runs is "the bus is under the voice", and '
    + 'this clip\'s is "there is no bus while there is a voice"');
  console.log('    under a stab   the voice track peaks at '
    + stabSilence.map(x => x.db.toFixed(1)).join(', ') + ' dB, which is '
    + stabSilence.map(x => (speech.median - x.db).toFixed(0)).join(', ')
    + ' dB under the level a word is said at — that is silence, not a duck');
  console.log('    the ducker     off. it moved the bus by ' + ducked.moved.toExponential(1)
    + '; at post6\'s ' + DUCK_POST6.toFixed(2) + ' the envelope is ' + ducked.open.toFixed(4)
    + ' open when a stab lands and would have taken ' + ducked.wouldPull.toFixed(1)
    + ' dB off its attack');
  console.log('    loudness       ' + (after.ok
    ? before.lufs.toFixed(1) + ' LUFS at unity, ' + (lift >= 0 ? '+' : '') + lift
      + ' dB and a limiter over ' + passes.length + ' pass(es), ' + after.lufs.toFixed(1)
      + ' LUFS delivered (target ' + TARGET_LUFS + ')'
    : 'ebur128 is not in this ffmpeg build, so the mix was left at unity'));
  console.log('    limiter        ' + lim.reduction.toFixed(1) + ' dB of gain reduction at its '
    + 'hardest, peak ' + lim.peak.toFixed(2) + ' dBFS');
  console.log('    true peak      ' + (after.truePeak == null ? '?' : after.truePeak.toFixed(1))
    + ' dBTP (ceiling ' + PEAK_CEILING + ')');

  /* ---------- the samples the render measures on ----------
     one per card at the frame it has settled, one at every glitch's hottest
     frame, and one on the end card. a safe area sampled only on calm frames is
     a safe area that has not met the shake. */
  const SETTLE = 0.20;
  const samples = [
    ...plan.groups.map(g => ({
      id: 'card' + g.i, what: 'card "' + g.words.map(w => w.word).join(' ') + '"',
      t: Math.min(g.out - 0.02, g.words[g.words.length - 1].start + SETTLE),
    })),
    ...glitchWins.map(g => ({ id: g.id, what: 'glitch ' + g.id, t: g.t0 + (g.t1 - g.t0) * 0.06 })),
    { id: 'endcard', what: 'the end card', t: T.outro + 0.80 },
  ].sort((a, b) => a.t - b.t);

  const state = ONLY_ENCODE
    ? JSON.parse(fs.readFileSync(path.join(OUT, 'post10-1080x1920.json'), 'utf8'))
    : await render(plan, v, T, glitchWins, micro, BLINKS, KEYS, samples, SECONDS);

  const file = encode(wav);
  const p = probe(file);
  const mb = (fs.statSync(file).size / 1e6).toFixed(2) + ' MB';
  console.log('  ' + p.w + 'x' + p.h + ' @' + p.fps + 'fps ' + p.seconds.toFixed(2) + 's  '
    + (p.audio ? 'with sound' : 'SILENT') + '  ' + mb + '  ' + path.relative(ROOT, file));

  const dir = sampleFrames(file, [
    [0.02, 'a0-first-frame'],
    [0.70, 'a1-fuck-you'],
    [Math.max(0, gaps[0].at - 0.10), 'b0-before-the-first-stab'],
    [gaps[0].at + 0.03, 'b1-the-first-stab'],
    [gaps[0].at + 0.14, 'b2-mid-glitch'],
    [gaps[0].at + 0.38, 'b3-snapped-back'],
    [gaps[1].at + 0.03, 'c0-the-second-stab'],
    [gaps[2].at + 0.03, 'd0-the-third-stab'],
    [Math.max(0, T.outro - 0.20), 'e0-and-love-it'],
    [T.outro + 0.10, 'e1-the-mascot-goes'],
    [T.outro + 0.50, 'e2-the-wordmark-arrives'],
    [T.outro + 0.90, 'e3-the-wordmark-clean'],
    [T.black - 0.10, 'f0-the-last-lit-frame'],
    [Math.min(SECONDS - 2 / FPS, T.black + 0.15), 'f1-black'],
  ]);
  console.log('  frames sampled into ' + path.relative(ROOT, dir));

  /* ---------- the editor's card ---------- */
  console.log('\nfor the editor — ' + SECONDS.toFixed(2) + 's, ' + FPS + 'fps, '
    + VW * DSF + 'x' + VH * DSF + ', voice and music already in the file');
  console.log('  voice: ' + groups[0].voiceId + ' at rate ' + groups[0].rate + ', four takes, '
    + v.words.length + ' words, timings from the engine');
  console.log('  the stabs land at ' + music.report.filter(r => r.kind === 'stab')
    .map(r => r.t.toFixed(2)).join('s, ') + 's, the outro at '
    + music.report.find(r => r.kind === 'outro').t.toFixed(2) + 's');
  console.log('  the wordmark arrives ' + (state.T ? state.T.wmIn.toFixed(2) : '?')
    + 's and holds to ' + T.black.toFixed(2) + 's, then ' + TAIL.black.toFixed(2) + 's of black');
  console.log('  no accent, no music bed, no synthesised effects');

  if (!KEEP && !ONLY_ENCODE) {
    fs.rmSync(FRAMES, { recursive: true, force: true });
    fs.rmSync(SUBS, { recursive: true, force: true });
  }

  /* ---------- the guards ---------- */
  const fail = [];

  /* the file. */
  if (p.w !== VW * DSF || p.h !== VH * DSF) fail.push('not ' + VW * DSF + 'x' + VH * DSF);
  if (Math.abs(p.fps - FPS) > 0.5) fail.push('not ' + FPS + 'fps');
  if (Math.abs(p.seconds - SECONDS) > 0.2) fail.push(p.seconds + 's, wanted ' + SECONDS);
  if (!p.audio) fail.push('no audio track — the sound did not mux and the clip is the wrong deliverable');
  if (p.seconds < v.lastEnd + 0.5) {
    fail.push('the file is ' + p.seconds.toFixed(2) + 's and the last word ends at '
      + v.lastEnd.toFixed(2) + 's — the end card is missing');
  }

  /* the copy, and the censor. both halves: the screen never shows the word and
     the script always does. */
  if (!GROUPS[0].includes('fuck')) fail.push('the script sent to the synthesiser lost the word — the voice would say the censored spelling');
  {
    const onScreen = plan.cells.map(c => c.word.toLowerCase());
    if (onScreen.includes('fuck')) fail.push('the uncensored word reached a card');
    if (!onScreen.includes('fu*k')) fail.push('the censored word never reached a card — the substitution did not run');
  }
  const cut = plan.groups.map(g => g.words.map(w => w.word).join(' '));
  if (cut.length !== CARDS.length || cut.some((c, i) => c !== CARDS[i])) {
    fail.push('the cards came out as [' + cut.join(' | ') + '] and the script asks for ['
      + CARDS.join(' | ') + ']');
  }
  if (plan.punctuation !== 'drop') fail.push('the caption plan kept its punctuation');
  if (!plan.bared.count) {
    fail.push('no card lost any punctuation, and every line in this script ends in a full stop — the strip is not running');
  }
  {
    const bad = plan.cells.filter(c => /[,.;:!]$/.test(c.word));
    if (bad.length) fail.push(bad.length + ' card word(s) still end in punctuation, first "' + bad[0].word + '"');
  }

  /* the caption. */
  if (plan.tight.late.length) {
    fail.push(plan.tight.late.length + ' card(s) leave before their own last word is said: '
      + plan.tight.late.map(c => '"' + c.text + '"').join(', '));
  }
  if (state.maxVisible > 1) fail.push(state.maxVisible + ' cards were on screen at once, wanted one');
  if (!(state.capMoved > 0.01)) fail.push('the caption never moved between two frames');
  /* the one that this clip exists to keep. */
  if (state.sawAccent) fail.push('the accent was painted — this clip has no green in it anywhere');
  if (!state.sawShadow) {
    fail.push('no caption word ever resolved a text-shadow — the glow and the rgb split are not being painted');
  }
  if (plan.flashed.length) fail.push(plan.flashed.length + ' word(s) were marked for the accent');

  /* the voice track, and the gaps the stabs live in. */
  for (const g of gaps) {
    if (Math.abs(g.len - GAP) > 0.002) {
      fail.push('the gap at ' + g.at.toFixed(2) + 's measured ' + g.len.toFixed(3)
        + 's, wanted ' + GAP.toFixed(2));
    }
  }
  if (gaps.length !== 3) fail.push('found ' + gaps.length + ' gaps, wanted 3');
  if (v.parts !== 4) fail.push('the voice track was built from ' + v.parts + ' takes, wanted 4');

  /* the music. */
  if (punchMain.db <= punchOther.db) {
    fail.push(MUSIC.main + ' is not the harder hitting track any more (+' + punchMain.db
      + ' against +' + punchOther.db + ') — the files may have been swapped');
  }
  if (music.report.length !== 4) fail.push('rendered ' + music.report.length + ' music slices, wanted 4');
  {
    const stabs = music.report.filter(r => r.kind === 'stab');
    if (stabs.length !== 3) fail.push('found ' + stabs.length + ' stabs, wanted 3');
    for (let i = 0; i < stabs.length; i++) {
      if (Math.abs(stabs[i].t - gaps[i].at) > 0.001) {
        fail.push('stab ' + (i + 1) + ' lands at ' + stabs[i].t + 's and the gap opens at ' + gaps[i].at);
      }
    }
    /* the escalation is the source's own and it is checked rather than
       described: the three attacks, in the order they are played, get louder. */
    for (let i = 1; i < stabs.length; i++) {
      if (!(stabs[i].attack > stabs[i - 1].attack)) {
        fail.push('stab ' + (i + 1) + ' attacks at ' + stabs[i].attack + ' dBFS against stab '
          + i + '\'s ' + stabs[i - 1].attack + ' — they no longer escalate');
      }
    }
  }
  if (overlap.seconds > 0) {
    fail.push(overlap.seconds.toFixed(3) + 's of music plays while a word is being said, worst '
      + overlap.worst.toFixed(1) + ' dB at ' + overlap.at + 's');
  }
  if (ducked.moved > 1e-9) {
    fail.push('the ducker moved the music bus by ' + ducked.moved.toExponential(2)
      + ' — DUCK is 0 and the bus in the mix must be the bus that was built');
  }
  /* 24 dB under the level a word is said at. the number is not arbitrary: a
     group's recording is cut where it falls under SILENCE_DB of its own peak,
     which puts the residue in the mid forties below full scale, and the stab
     playing over it sits about seven decibels **above** speech — so anything
     that passes this is better than thirty decibels under the music on top of
     it. the first version asked for 30 and was tighter than the trim that
     produces the number, which is a guard failing its own design rather than a
     fault. */
  for (const x of stabSilence) {
    if (x.db > speech.median - 24) {
      fail.push('the voice track is at ' + x.db.toFixed(1) + ' dB under the stab at ' + x.t
        + 's, which is not silent against a median speech level of ' + speech.median.toFixed(1));
    }
  }
  if (!(mix.busPeak > 1e-5)) fail.push('the music bus is silent');

  /* the mix. */
  {
    const moved = dbfs(mix.voicePeak) - dbfs(mix.voiceRawPeak);
    if (Math.abs(moved - VOICE_TRIM) > 0.05) {
      fail.push('the voice trim measured ' + moved.toFixed(2) + ' dB, wanted ' + VOICE_TRIM);
    }
  }
  if (!after || !after.ok) {
    fail.push('the loudness meter did not run, so the mix is unmeasured and cannot be called safe');
  } else {
    if (Math.abs(after.lufs - TARGET_LUFS) > 1.0) {
      fail.push('the mix delivered at ' + after.lufs.toFixed(1) + ' LUFS after '
        + passes.length + ' pass(es), wanted ' + TARGET_LUFS);
    }
    if (after.truePeak > PEAK_CEILING + 0.1) {
      fail.push('true peak is ' + after.truePeak.toFixed(1) + ' dBTP, ceiling is ' + PEAK_CEILING);
    }
    if (lim.reduction > 9) {
      fail.push('the limiter pulled ' + lim.reduction.toFixed(1) + ' dB — the mix is being squashed, not limited');
    }
  }

  /* the mascot. the smoothness guards pass trivially on a face that never
     moves, which is exactly what a missing .m-eyes group produces, so liveness
     is checked next to them rather than assumed from them. */
  if (state.eyeFaults.length) {
    fail.push(state.eyeFaults.length + ' eye fault(s), first at '
      + state.eyeFaults[0].t.toFixed(2) + 's (' + state.eyeFaults[0].what + ')');
  }
  if (state.blinkSteps.length) fail.push(state.blinkSteps.length
    + ' blink step(s) over the limit — it is flashing, not blinking');
  if (!(state.gazeJump.d > 0)) fail.push('the eyes never moved — is the .m-eyes group there?');
  if (!(state.blinkJump.d > 0)) fail.push('the mascot never blinked');
  if (state.wide !== '1') fail.push('--wide read back as "' + state.wide + '", wanted 1');

  /* the glitch. it has to have happened, it has to have happened everywhere it
     was supposed to, and — the one that matters for this clip — it has to have
     stopped everywhere it was not. */
  if (state.calmFaults) {
    fail.push(state.calmFaults + ' frame(s) wrote a glitch channel outside a window — it does not snap back calm');
  }
  if (!state.glFrames) fail.push('no frame carried a glitch at all');
  if (!state.bandFrames) fail.push('nothing ever tore — the bands are not being used');
  if (state.microSeen !== micro.size) {
    fail.push('the render saw ' + state.microSeen + ' micro glitch frames and the plan has ' + micro.size);
  }
  if (FPS >= 60 && micro.size !== v.words.length) {
    fail.push(micro.size + ' micro glitch frames for ' + v.words.length
      + ' words — two words share a frame and one of them is not getting its own');
  } else if (micro.size !== v.words.length) {
    console.log('  note: at ' + FPS + 'fps one frame is ' + (1000 / FPS).toFixed(0)
      + 'ms and ' + (v.words.length - micro.size) + ' word(s) share a frame with the one before '
      + 'them. that is the preview rate, not the clip: the guard bites at 60.');
  }
  {
    /* how much of the film is glitching. it is a rage clip and it is still
       mostly calm: past a third of the frames the fault stops being an event. */
    const share = state.glFrames / state.frames;
    if (share > 0.34) fail.push((share * 100).toFixed(1) + '% of the frames glitch — that is a texture, not three events');
    if (share < 0.02) fail.push((share * 100).toFixed(1) + '% of the frames glitch — the windows are not firing');
  }
  if (state.stillFrames) {
    fail.push(state.stillFrames + ' pair(s) of identical frames before the cut to black');
  }

  /* the frame. */
  {
    const sa = state.safe;
    const edges = [['left', sa.left, SAFE.left], ['top', sa.top, SAFE.top],
      ['right', sa.right, SAFE.right], ['bottom', sa.bottom, SAFE.bottom]];
    for (const [name, css, floor] of edges) {
      if (css * DSF < floor - 0.5) {
        fail.push(sa.worst + ' comes within ' + Math.round(css * DSF) + 'px of the '
          + name + ' border at ' + sa.t + 's, floor is ' + floor);
      }
    }
  }
  if (state.sampled !== state.wanted) {
    fail.push('the safe area was sampled ' + state.sampled + ' times, wanted ' + state.wanted
      + ' (one per card, one per glitch, one on the end card)');
  }
  if (!(state.pill && state.pill.w <= PILL_MAX)) {
    fail.push('the pill measured ' + (state.pill ? state.pill.w : '?') + ' wide, cap is ' + PILL_MAX);
  }
  if (!(state.pill && state.pill.ink > 0 && state.pill.w > state.pill.ink)) {
    fail.push('the pill is not wider than the ink it is meant to be around');
  }
  /* the words must never outlive the bubble they are in. the first final cut
     did, for two tenths of a second, and it read as a mistake. */
  if (plan.seconds > T.outro + 1e-6) {
    fail.push('the last card leaves at ' + plan.seconds.toFixed(2)
      + 's and the bubble starts leaving at ' + T.outro.toFixed(2)
      + 's — the words would outlive the bubble they are in');
  }

  if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
  console.log('\nall checks passed.');
}

await main();
