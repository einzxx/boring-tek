/* the boring tek — post17, message for the next generation. a chat panel asks
   the ai for a message for the people coming after us, and it answers in two
   words.

     node post17.mjs                      1080x1920, 60fps, dark
     DEMO_FPS=12 node post17.mjs          the fast preview pass
     node post17.mjs --blur               60fps with the shutter open
     node post17.mjs --panel              the panel and the thought as stills,
                                          no video, for the legibility pass
     node post17.mjs --encode-only        re-encode from kept frames

   out to demo/out/post17-dark-1080x1920.mp4.

   post16 is the template for the shape of the file and post14 for the panel and
   the read. what is new here is that **the clip's whole clock is cut from one
   spoken line**, and that the thought bubble is the module's own, hung over the
   crown by the option `lib/mascot.mjs` grew for it and has not been used by a
   clip until now.

   ---------- the read is the typing, word for word ----------

   the brief asks for the question to type itself with key ticks and for the
   voice to read it as it types. those are two ways of describing one event, so
   they are built as one: `typePlan` is handed the voice's own word list and
   lays each word's characters across **that word's spoken span**. the letters
   of "generation" appear while "generation" is being said, and the space before
   a word lands in the silence in front of it.

   that is not a stylistic flourish, it is what fixes the pace. thirty two
   characters spread evenly across the read would be a constant 21 a second,
   which reads as a field being filled by a machine. cut to the words it is
   fast inside a word and still between them, which is what typing sounds like
   and, more to the point, is what the ear is already hearing.

   the whole clock hangs off it. the read's first sound lands at VOICE_AT and
   every number after that is derived: the typing ends when the last word does,
   the panel slides a beat later, the fault is a beat after the panel lands, he
   is born on the fault, the thought hangs off his second mark, and the film
   ends a held end card after the thought is taken. nothing downstream of the
   voice is typed, so a slower read moves the entire film with it.

   ---------- the thought is the module's, over the crown ----------

   `lib/mascot.mjs` grew `thought: 'over'` after post15 hand placed a bubble
   three times, and nothing had asked for it since. this clip asks for it
   outright as `over-right`, because the derived side is a fact about which
   corner he is standing in and he is standing in the middle.

   **the hold is 0.90s and that is the module's own ceiling, not a choice.**
   the brief asks for the thought to be fully up for about two seconds.
   `bubbleAt` computes `holdFor = max(0.42, min(BUBBLE.hold, room))` and
   `BUBBLE.hold` is 0.90, so a single bubble cannot be held longer than that
   from outside the module — and `bubbles: [...]`, the other spelling, runs the
   quick profile and caps at 0.30, which is worse. the brief also says lib is
   untouched. so the thought is up for as long as the module allows and the
   report prints the number beside `BUBBLE.hold` so it reads as a ceiling rather
   than as an oversight. what the clip does buy back is the **whole** of it: the
   fault lands on the frame the pill would begin to leave, so the thought is
   taken at full size rather than politely shrinking first. first dot to cut is
   1.38s and the pill itself is on the screen for 1.24 of that.

   ---------- he is 26 css px left of centre, and the pill is why ----------

   the cluster hangs to one side of the crown: the module puts the first dot on
   the plate's own centre line and the pill 26 css px along the row from it, so
   a pill is never centred over a head and cannot be. `don't come` measures
   190.7 css px at `BUBBLE.size`, and off a dead centre head that puts its right
   edge at 486.7 against a safe line at 470 — and the pill's spring overshoots
   past its own size on the way in, which is another few pixels on top.

   there is no head size that fixes it: `crownX` scales with the head and the
   dots, the gaps and the pill do not, so the pill's offset from the frame's
   middle is the same 26px at any size. so the zone is shifted, and the shift is
   **derived from the pill's own measured width and its own worst spring frame**
   rather than picked: exactly enough to put the cluster inside the safe line
   with `PILL_AIR` to spare, and zero if it ever stops being needed. it comes
   out at **26.42 css px, which is 53 device and 4.9% of the frame's width**, and
   it is what keeping the punchline out of the platform's button column costs —
   the alternative is a dead centre head and a pill 45 device px inside the right
   margin. the guard re-measures the rendered cluster on every frame it is up,
   and the number is printed on every run so the trade is visible rather than
   asserted.

   it reads as deliberate once the thought is up, because the head and the pill
   balance about the middle of the frame. in the 1.2s before it arrives he reads
   as slightly left of a centred panel, and that is the cost.

   ---------- the panel is post14's, drawn dark ----------

   the same picture of the box a person types into, in this file's own css, with
   three changes the brief asks for: it is centred rather than sitting under a
   mark, the model name is gone, and the right of the controls row carries a mic
   and a waveform instead. everything in it is still a rule here and there is
   still no logo in it and nothing lifted off anybody's product.

   post14 drew it as `--fg` on `--bg`, which is a dark box on a white page. this
   page is already near black, so the panel is its own two tokens: a ground a
   little above the page and a hairline outline, which is what an input looks
   like on a dark app and is the only way a dark box reads on a dark frame. the
   type is the page's ink with the file's own soft glow on it, so the panel
   belongs to the same light as the head and the wordmark.

   the type is 26 css px, which measures 38 device px of cap against the house's
   32 floor, and the question wraps to exactly two lines in the panel's own box.
   both are measured on the rendered face rather than assumed, on every run.

   ---------- and there is no camera ----------

   post15 and post16 are both built on `lib/camera.mjs` and this one is not,
   because nothing in the brief moves the frame. the panel slides 120 px on its
   own transform, which is an element moving inside a still frame — the
   opposite of a camera move, and the right one here, because what slides is the
   thing making room and the room is what he arrives into.
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
import { speak, VOICE_OUT } from './lib/voice.mjs';
import {
  renderSfx, writeWav, applyGain, limit, decode, mixdown, voiceEnvelope,
  loudness, describeMix, checkUnderVoice, dbfs, SR,
} from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post17');
const SUBS = path.join(OUT, 'subframes-post17');
const VERIFY = path.join(OUT, 'verify-post17');
const STATE_FILE = path.join(OUT, 'post17.json');

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
const PANEL_ONLY = argv.includes('--panel');
const BLUR = argv.some(a => a.startsWith('--blur'));
const BLUR_ARG = (argv.find(a => a.startsWith('--blur')) || '').split('=')[1];
const SUB = BLUR ? Math.max(2, Math.min(12, Number(BLUR_ARG) || 4)) : 1;
const SUBSTEP = STEP / SUB;

/* ---------- the middle of the frame ----------
   the middle of the **safe band** rather than of the frame, which is post12's
   line and post16's: the platforms take more off the bottom than the top, so
   the middle of the picture a viewer actually sees is not 480. the panel, the
   room he stands in and the wordmark are all hung off this one number. */
const CENTRE_Y = (SAFE_CSS.top + (VH - SAFE_CSS.bottom)) / 2;

/* post12's centre size, which is the brief. it puts the plate at 277.5 device
   px inside `HEAD_PX`'s 220..280 window. */
const SIZE = 148;

/* ---------- the read ----------
   one line, one take, the house's own narrator: `calm` is en-US-AndrewNeural at
   the voice module's own rate, which is already eight per cent under the neural
   default because the neural default is a shade faster than a person reading a
   short line to camera. no rate override here at all — the brief asks for a
   natural pace and the natural pace of this voice is what the file ships. */
const LINE = 'message for the next generation?';
const VOICE = 'calm';
/* where the read's own sound starts on the clip's clock. everything in the
   front of the film is measured from it: the panel is up 0.06s before, and the
   typing starts on the first word. */
const VOICE_AT = 0.56;
/* the silence gate the take's own edges are found with, and how much of the
   file either side of them is kept. post14's numbers. */
const SILENCE_DB = -42;
const PRE = 0.06, POST = 0.10, EDGE_FADE = 0.012;

/* ---------- the chat panel ----------
   post14's, redrawn for a dark page and for the middle of the frame. see the
   header for what changed and why. the geometry is worked out of its own parts
   rather than typed as a height: two lines of type under the top padding, the
   controls row above the bottom padding, and whatever is left between them is
   the air the panel is allowed. `room` is printed and guarded, because a panel
   whose two blocks touch is a panel with no air in it.

   the text block is top anchored and the controls row is bottom anchored, so a
   line growing from nothing to two lines cannot move the plus or the icons
   under it. that is what a real input does and it is also what stops the frame
   twitching every fourth character. */
const PANEL = {
  /* the full safe width. 400 is what fits between the platform margins at 540
     css, and a panel narrower than that on a phone reads as a screenshot of a
     window rather than as the thing itself. */
  x: SAFE_CSS.left, w: VW - SAFE_CSS.left - SAFE_CSS.right,
  radius: 22,
  pad: 20,
  /* 26 rather than post14's 23, which is the brief's "slightly larger for phone
     size": it measures 38 device px of cap against the 32 floor, and the
     question still wraps to exactly two lines inside the box. both are measured
     on the rendered face by the guards below. */
  textSize: 26,
  lineHeight: 1.32,
  lines: 2,
  plus: 24,             /* the ring's own diameter, css px */
  rowH: 26,             /* the controls row, which the icons are drawn inside */
  iconGap: 15,
  placeholder: 'ask anything',
  typed: LINE,
  in: 0.30,             /* how long the fade takes */
  keyEvery: 4,          /* one tick per this many characters. post11's rule */
  minCapPx: 32,         /* the house copy floor, and this one is not crossed */
  minRoom: 12,          /* the least air the two blocks may leave each other */
};
PANEL.textH = +(PANEL.lines * PANEL.textSize * PANEL.lineHeight).toFixed(2);
PANEL.h = +(PANEL.pad * 2 + PANEL.textH + 18 + PANEL.rowH).toFixed(2);
PANEL.y = +(CENTRE_Y - PANEL.h / 2).toFixed(2);
PANEL.at = 0.20;        /* and it is black and empty until here */
PANEL.room = +(PANEL.h - PANEL.pad * 2 - PANEL.textH - PANEL.rowH).toFixed(2);

/* ---------- the slide ----------
   120 css px down, on the calm in-out, which is the house's own smooth curve
   and is what a panel being moved out of the way should arrive on: a spring
   here would be the panel having an opinion.

   it is an element moving inside a still frame rather than a camera move, and
   that is the right shape — see the header. what it makes is the room he is
   born into. */
const SLIDE = { by: 120, for: 0.44, gap: 0.16 };

/* ---------- the two faults ----------
   post12's ending, twice, with the build up taken off both. the first one is
   the arrival: the signal breaks and he is on the other side of it. the second
   is the ending: the signal breaks and everything is gone but the wordmark.

   `gap` is how long after the panel lands the first fault comes. it is short
   because the slide is the wind-up: a panel that has moved out of the way and
   then waits is a panel that moved for no reason. */
const GLA = { gap: 0.08, for: 0.22 };
const GLB = { for: 0.34, wmFor: 0.09 };
/* how long the end card is on the screen, which is the brief's about 1.2s. */
const END_HOLD = 1.16;

/* ---------- the cut ----------
   two marks and both of them `neutral`, which is the brief: he is alive and
   flat and he never smiles. the brief also asks for a beat and a slow blink
   between him arriving and him thinking, and a single `bubble` on a mark is
   placed by the module at `settled + 0.12` — so a mark that carries the thought
   cannot also carry the beat in front of it. two marks is what buys the beat,
   and the second `neutral` is a breath rather than a state change: the module's
   own entrance settles the head onto rest from 2.8% under it and brings the
   eyes down off a hair of widening, which is what a head does before it thinks.

   `M_GAP` is 1.10 against the module's own floor of 1.06 for `neutral` — its
   entrance, a hold and its exit — so the first mark has 0.44s of hold in it and
   the blink has somewhere to land. */
const M_GAP = 1.10;

/* ---------- the type ----------
   measured on the rendered faces at font size 1 rather than estimated off an em
   ratio, because Space Grotesk is proportional and Michroma's tracking is
   nearly a fifth of an em. every one of these is re-measured in the page on
   every run, so a font that failed to load or a metric that moved cannot
   quietly break a layout that was solved against it. */
const TYPE = {
  bub: 5.4883,          /* "don't come", Space Grotesk 500, at font size 1 */
  q: 16.4872,           /* the whole question, weight 400 */
  qLine1: 10.3719,      /* and how it breaks, for the record */
  qLine2: 5.8583,
  mich: { wm: 6.7453, lineH: 1.16, capRatio: 0.75 },
};
/* the module's own pill, at the module's own size, as node can work it out. the
   guard measures the rendered one against this. */
const PILL_W = +(TYPE.bub * BUBBLE.size + 2 * BUBBLE.padX + 2 * BUBBLE.stroke).toFixed(2);
/* how much clear frame the cluster keeps inside the safe line. it is the one
   number in the shift that is a decision rather than arithmetic. */
const PILL_AIR = 4;

/* the thought, and it is two words because the answer is. */
const THOUGHT = "don't come";

/* ---------- the wordmark ----------
   post15's and post16's, unchanged: three lines, centred on the middle of the
   safe band, in michroma, fitted in the page rather than guessed. no domain
   under it, which is the brief. */
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: TYPE.mich.lineH, minCapPx: 56 };

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

/* crf 17, post12's, post13's, post15's and post16's: this frame is nearly all
   flat black with soft glows across it, which is exactly what a codec bands,
   and there is no film grain here to dither it. */
const CRF = 17;

/* ---------- the mix ----------
   post11's and post14's rig: the read on top, a small bus of effects under it
   ducked while a word is being said, and a loudness loop that keeps its best
   pass rather than its last. there is no music, by design rather than by
   omission — the brief says so. */
const TARGET_LUFS = -14;
const PEAK_CEILING = -1.0;
/* the loop works to a lower ceiling than the guard reads, because the guard
   reads the mp4 and the loop writes a wav: aac is a lossy round trip and it
   overshoots the samples it was made from. post14 paid half a decibel of
   headroom to learn that. */
const WAV_CEILING = -1.5;
const DUCK = 0.60;
const VOICE_TRIM = -1.5;
const MAX_REDUCTION = 5.0;
/* the clip's own window rather than a number, because the length is cut from a
   take and a take is measured. the brief asks for six to seven. */
const RUN = { min: 6.0, max: 7.0 };

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
const GLIDE = bezier(.45, 0, .55, 1);          /* the calm in out */
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))));
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function prng(seed) {
  let x = seed | 0 || 0x1a2b3c;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x |= 0; return (x >>> 0) / 4294967296; };
}

/* a burst is a length in seconds, quantised to the grid that is rendering:
   post11's rule and post12's note. a 220ms fault is thirteen frames at sixty
   and 2.6 at twelve, so written as seconds and left alone it would be a
   different event on the preview pass. */
function onGrid(t, len, fps) {
  const f0 = Math.round(t * fps);
  const n = Math.max(1, Math.round(len * fps));
  return { t0: f0 / fps, t1: (f0 + n) / fps, frames: n };
}

/* ==========================================================================
   the voice
   ==========================================================================
   one take, cached, and the **delivery is part of the cache key**: the copy is
   one half of what a take is and the rate and the pitch are the other, so a
   cache that only knew the words would hand back a line read at the wrong speed
   the moment a delivery note changed. post10 found that, post11 wrote it down
   and post14 carried it. */
async function take() {
  const name = 'post17-q';
  const cached = path.join(VOICE_OUT, name + '-' + VOICE + '.json');
  const want = LINE.replace(/\s+/g, ' ').trim();
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === want && j.voice === VOICE && fs.existsSync(j.file)) return { ...j, cached: true };
  }
  return { ...(await speak(LINE, { voice: VOICE, name })), cached: false };
}

/* where the take's sound actually starts and stops, off the waveform rather
   than off the word list. the synthesiser's WordBoundary carries a duration
   shorter than the sound, so an edge trusted to the word list is not the edge
   that is in the file. post14's function, unchanged. */
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

/* the take laid on the clip's clock, with its **sound** rather than its first
   word put on VOICE_AT — a take that starts with a breath is a take whose word
   list starts after the file does. the word times come back moved by the same
   offset, so the typing, the ticks and the guards all read one timeline.

   the track is allocated with three seconds of room past the last word and
   sliced to the finished length once the clock is known, which is cheaper than
   laying the take down twice and is the only thing here that knows the two
   numbers are different. */
function buildVoice(t) {
  const pcm = decode(ffmpeg, t.file);
  const e = audioEdges(pcm);
  const off = +(VOICE_AT - e.start).toFixed(4);
  const words = t.words.map(w => ({
    word: w.word, start: +(w.start + off).toFixed(4), end: +(w.end + off).toFixed(4),
  }));
  const sound = { start: +(off + e.start).toFixed(4), end: +(off + e.end).toFixed(4) };
  const lastWord = words[words.length - 1].end;
  const track = new Float32Array(Math.ceil((lastWord + 3.0) * SR));
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
  return {
    words, sound, track, edges: e, off,
    wps: +(words.length / (lastWord - words[0].start)).toFixed(2),
    lastWord, peak: e.peak, timing: t.timing, file: t.file, cached: t.cached,
  };
}

/* ==========================================================================
   the typing, cut to the words
   ==========================================================================
   one entry per character with the instant it lands, so the frame function is a
   binary search and the sound is a filter over the same list. nothing about the
   picture and the ticks can drift, because there is only one list.

   **each word's characters are laid across that word's own spoken span**, which
   is the header's argument: the letters of a word appear while the word is
   being said. inside a word the gaps are jittered off a seeded prng — post9's
   rule, because a constant rate reads as a machine filling a field — and the
   space in front of a word lands a third of the way into the silence before it,
   which is where a person's hands are when their voice has stopped.

   the tokens are matched to the engine's own words rather than assumed to line
   up, and a mismatch is a throw: a typing pass that quietly fell out of step
   with the read would look like a timing choice rather than like a bug. */
function typePlan(text, words, seed) {
  const r = prng(seed);
  const bare = s => s.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');
  /* the character ranges of every token in the copy, in order. */
  const toks = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(text))) toks.push({ a: m.index, b: m.index + m[0].length, s: m[0] });
  if (toks.length !== words.length) {
    throw new Error('the copy has ' + toks.length + ' words and the read came back with '
      + words.length + ' — the typing cannot be cut to a read it does not match');
  }
  for (let k = 0; k < toks.length; k++) {
    if (bare(toks[k].s) !== bare(words[k].word)) {
      throw new Error('word ' + k + ' is "' + toks[k].s + '" in the copy and "'
        + words[k].word + '" in the read');
    }
  }
  const at = new Array(text.length).fill(null);
  for (let k = 0; k < toks.length; k++) {
    const { a, b } = toks[k];
    const w = words[k];
    const n = b - a;
    /* the weights, then normalised, so the run always ends exactly on the word's
       own end whatever the jitter did. a word that finished typing early would
       leave a caret sitting still under a word that is still being said. */
    const wt = [];
    for (let i = 0; i < n; i++) wt.push(0.72 + r() * 0.56);
    const total = wt.reduce((x, y) => x + y, 0);
    /* the last character lands on the word's end, so the run is n-1 gaps rather
       than n: a word is finished as it finishes being said. */
    let acc = 0;
    const grand = total - wt[n - 1];
    for (let i = 0; i < n; i++) {
      at[a + i] = +(w.start + (w.end - w.start) * (grand <= 0 ? (i ? 1 : 0) : acc / grand)).toFixed(4);
      if (i < n - 1) acc += wt[i];
    }
    /* the space in front of this word, in the silence in front of it. */
    if (k > 0) at[a - 1] = +(words[k - 1].end + (w.start - words[k - 1].end) * 0.35).toFixed(4);
  }
  for (let i = 0; i < at.length; i++) {
    if (at[i] == null) throw new Error('character ' + i + ' of the copy was never placed');
    if (i && at[i] < at[i - 1]) {
      throw new Error('the typing goes backwards at character ' + i + ': ' + at[i - 1] + ' then ' + at[i]);
    }
  }
  /* one tick per four characters, plus the first and the last, which is post11's
     number and post11's reason: thirty two sounds inside a second and a half is
     a rattle, and the two ends are the moments the rhythm starts and stops. */
  const keys = [];
  for (let i = 0; i < at.length; i++) {
    if (text[i] === ' ') continue;
    if (i === 0 || i === at.length - 1 || i % PANEL.keyEvery === 0) keys.push(at[i]);
  }
  return {
    text, at, keys, chars: text.length,
    from: at[0], until: at[at.length - 1],
    cps: +(text.length / (at[at.length - 1] - at[0])).toFixed(2),
  };
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

/* ==========================================================================
   the clock
   ==========================================================================
   every number below is derived off the one above it, and the top one is the
   read. see the header. */
const V = buildVoice(await take());
const TYPING = typePlan(PANEL.typed, V.words, 0x17c3a9);

const SLIDE_AT = +(TYPING.until + SLIDE.gap).toFixed(4);
const SLIDE_END = +(SLIDE_AT + SLIDE.for).toFixed(4);
const GLA_AT = +(SLIDE_END + GLA.gap).toFixed(4);
/* the two marks. he is born on the first fault, which is why `M1` is the fault's
   own time rather than a number beside it. */
const M1 = GLA_AT;
const M2 = +(M1 + M_GAP).toFixed(4);
/* where the thought is fully up until, worked out from the module's own profile
   so the film's length can be known before a plan exists. `planMascot` is asked
   for the same number afterwards and the two are compared — see the guards. */
const BUB_IN = +(M2 + STATES.neutral.entry + 0.12).toFixed(4);
const BUB_FULL = +(BUB_IN + BUBBLE.in).toFixed(4);
const BUB_LEAVING = +(BUB_FULL + BUBBLE.hold).toFixed(4);
const GLB_AT = BUB_LEAVING;
const SECONDS = +(GLB_AT + END_HOLD).toFixed(4);

const MAS_IN_FRAME = Math.round(M1 * FPS);
const CUT_FRAME = Math.round(GLB_AT * FPS);
const WM_IN = (CUT_FRAME - 1) / FPS;

/* ==========================================================================
   the mascot
   ==========================================================================
   ---------- the seed is the slow blink ----------
   the brief's beat between him arriving and him thinking is "one beat, a slow
   blink", and a blink this file wrote would be a channel fighting the idle
   layer. so it comes off the layer that already makes blinks, which is post13's
   move and post16's: `blinkPlan` generates the idle schedule from the plan's
   seed, every blink carrying its own close, hold and open. this searches for a
   seed with **exactly one** blink inside the beat and keeps the slowest one it
   finds, so the beat is the mascot's own blink rather than something laid over
   him.

   the window opens once his arrival has settled and closes before the first dot
   of the thought, and both ends are read off the module's own numbers rather
   than typed.

   **the whole blink has to fit, not just its start.** the first cut searched on
   the blink's own `t` and found one whose lid was still coming back up as the
   first dot climbed — a blink and a thought on the same frames are two things
   happening and neither of them reads. so a candidate is kept only if its close,
   its hold and its open all land inside the window, and a seed with a second
   blink overlapping the window at either end is refused outright. */
const BLINK_WINDOW = [
  +(M1 + STATES.neutral.entry + 0.10).toFixed(4),
  +(BUB_IN - 0.10).toFixed(4),
];
const blinkEnd = b => +(b.t + b.close + b.hold + b.open).toFixed(4);
const blinksNear = pl => pl.idle.blinks.filter(b => blinkEnd(b) > BLINK_WINDOW[0] && b.t < BLINK_WINDOW[1]);
const blinkInside = b => b.t >= BLINK_WINDOW[0] && blinkEnd(b) <= BLINK_WINDOW[1];
const MARKS = [
  { t: M1, state: 'neutral' },
  { t: M2, state: 'neutral', bubble: THOUGHT },
];
function planFor(seed) {
  return planMascot({
    marks: MARKS, seconds: SECONDS, theme: 'dark', size: SIZE,
    /* dead straight on. the resting turn exists so a mascot in a corner looks
       into the frame, and there is nothing to look into from the middle. */
    bias: 0,
    /* the side is said outright rather than derived, because what `over` derives
       it from is which corner he is standing in and he is standing in neither.
       right, so the run climbs away from the panel's own left aligned copy. */
    thought: 'over-right',
    /* null on purpose: the module checks its bubble against a caption band and
       this clip has no caption band in it. */
    band: null,
    seed,
  });
}
function pickSeed() {
  let best = null;
  for (let s = 1; s <= 6000; s++) {
    let pl;
    try { pl = planFor(s); } catch (err) { continue; }
    const near = blinksNear(pl);
    if (near.length !== 1 || !blinkInside(near[0])) continue;
    const b = near[0];
    const len = b.close + b.hold + b.open;
    if (!best || len > best.len) best = { seed: s, blink: b, len: +len.toFixed(4) };
  }
  if (!best) throw new Error('no seed in six thousand puts exactly one idle blink inside the beat');
  return best;
}
const SEED = pickSeed();
const plan = planFor(SEED.seed);

/* ---------- where he stands ----------
   the room above the panel once it has slid, and he is centred in it: the same
   air over his crown as under his chin. the module's corner arithmetic is not
   used, which is post12's and post13's line — `plan.box` is rewritten and
   `mascotCss`, `mascotMarkup` and `mascotPagePlan` all read it when they are
   called.

   across, he is the frame's middle **minus the shift the pill needs**. see the
   header: the cluster hangs to one side of the crown and no head size changes
   by how much, so either the pill sits in the platform's button column or he
   moves. the number is derived below, off the pill's own measured width and its
   own worst spring frame. */
const ROOM = { top: SAFE_CSS.top, bottom: +(PANEL.y + SLIDE.by).toFixed(2) };
const PLATE_CY = +((ROOM.top + ROOM.bottom) / 2).toFixed(2);
/* the pill's worst frame, walked rather than assumed: `btk.pop` carries the
   spring past its mark, so the widest the pill ever is is not the width it
   settles at. 240Hz, four samples to a frame at sixty, the same rate
   `crownReach` is walked at. */
const PILL_SC = (() => {
  const b = plan.marks[1].bubbles[0];
  let sc = 0;
  const steps = Math.ceil((b.out - b.in) * 240);
  for (let i = 0; i <= steps; i++) {
    sc = Math.max(sc, mascotFrame(plan, b.in + (b.out - b.in) * i / steps).bubble.pill.sc);
  }
  return +sc.toFixed(4);
})();
/* the pill's near corner inside the zone, off the module's own placement rather
   than off a number typed here, and the shift that puts its far corner inside
   the safe line. zero if it is ever not needed, and it says so. */
const PILL_X0 = +(plan.thought.start.x + plan.thought.runs[2]).toFixed(3);
const OFF_X = (() => {
  const centredLeft = VW / 2 - (HEAD.plate.x + HEAD.plate.s / 2) * plan.unit;
  const right = centredLeft + PILL_X0 + PILL_W * PILL_SC;
  return +Math.max(0, right - (VW - SAFE_CSS.right) + PILL_AIR).toFixed(2);
})();
plan.box = {
  left: +(VW / 2 - (HEAD.plate.x + HEAD.plate.s / 2) * plan.unit - OFF_X).toFixed(2),
  top: +(PLATE_CY - (HEAD.plate.y + HEAD.plate.s / 2) * plan.unit).toFixed(2),
  size: SIZE,
};

/* the plate's own centre and radius in page space, off the module's geometry
   rather than off a number typed here. */
const PLATE = {
  cx: plan.box.left + (HEAD.plate.x + HEAD.plate.s / 2) * plan.unit,
  cy: plan.box.top + (HEAD.plate.y + HEAD.plate.s / 2) * plan.unit,
  r: HEAD.plate.s / 2 * plan.unit,
};
/* the bubble, read off the finished plan rather than off the arithmetic that
   sized the film, so the sound, the cut and the guards all look at the thought
   the render actually draws. */
const BUB = plan.marks[1].bubbles[0];
/* the blink the seed was chosen for, likewise. */
const BLINK = blinksNear(plan)[0];
const BLINK_AT = +(BLINK.t + BLINK.close + BLINK.hold / 2).toFixed(4);

/* where his ink is, in page space, on a frame. `headRect` answers in device px
   from each border and that is the wrong shape for a collision with a panel, so
   it is turned back into a rect here. */
function headPageRect(fr) {
  const r = headRect(plan, fr);
  return {
    rect: {
      x: +(r.left / DSF).toFixed(3), y: +(r.top / DSF).toFixed(3),
      w: +(VW - r.right / DSF - r.left / DSF).toFixed(3),
      h: +(VH - r.bottom / DSF - r.top / DSF).toFixed(3),
    },
    air: {
      left: +(r.left - SAFE.left).toFixed(1), top: +(r.top - SAFE.top).toFixed(1),
      right: +(r.right - SAFE.right).toFixed(1), bottom: +(r.bottom - SAFE.bottom).toFixed(1),
    },
    glow: +(r.glowReach / DSF).toFixed(2),
  };
}

/* ==========================================================================
   the glitch
   ==========================================================================
   post12's table and post12's shape, unchanged: a hard hit, a fast fall, a
   floor, and a tail that is calm frames with the occasional full heat one in
   it. */
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
function glitchWindows(fps) {
  return [
    { ...onGrid(GLA_AT, GLA.for, fps), seed: 0x0c1a55, flashAt: Math.round(GLA_AT * fps) },
    { ...onGrid(GLB_AT, GLB.for, fps), seed: 0x7e3b12, flashAt: Math.round(GLB_AT * fps) },
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
  g.noise = +(heat * (GL.noise[0] + (GL.noise[1] - GL.noise[0]) * r())).toFixed(4);
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
   lesson: a sine stands still twice a period, so on a frame where the phosphor
   is the only thing moving, the two frames either side of its turning point are
   identical. */
function phosphor(t, amp, slow, fast, phase) {
  return 1 + amp * 0.78 * Math.sin(2 * Math.PI * t / slow)
    + amp * 0.39 * Math.sin(2 * Math.PI * t / fast + phase);
}

/* ==========================================================================
   one instant
   ========================================================================== */
function frameAt(t, f) {
  const mas = mascotFrame(plan, t);
  const g = glitchAt(f);

  /* the two cuts, both on frames rather than on times: a cut time that rounds
     down would put an empty frame between two things that are meant to swap. */
  const mo = (f >= MAS_IN_FRAME && f < CUT_FRAME) ? 1 : 0;
  const n = typedAt(t);
  const pn = {
    o: f >= CUT_FRAME ? 0 : +GLIDE(span(t, PANEL.at, PANEL.at + PANEL.in)).toFixed(4),
    /* the slide, on the calm in out. one number, in css px, and the panel's own
       transform is the only thing that reads it. */
    slide: +(SLIDE.by * GLIDE(span(t, SLIDE_AT, SLIDE_END))).toFixed(3),
    n,
    /* the placeholder is on until the first character lands. the caret is on
       whenever the panel is and it does not blink: a blink is what a caret does
       when nothing is happening, and something is always about to. */
    ph: n ? 0 : 1,
  };

  const wp = span(t, WM_IN, WM_IN + GLB.wmFor);
  const wm = {
    o: +span(t, WM_IN, WM_IN + GLB.wmFor * 0.45).toFixed(4),
    sc: +(1 + (1 - GLIDE(wp)) * 0.085).toFixed(4),
    glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4),
  };
  /* the vignette breathes on a curve this file writes as well as on its own css
     animation, and that is not decoration. the film opens on an empty black
     frame, and without a number node knows about, the liveness signature below
     would be blind to the only layer that is moving in it. */
  const vig = +phosphor(t, 0.07, 3.1, 1.07, 0.9).toFixed(4);
  return { t: +t.toFixed(4), f, mas, mo, pn, wm, g, vig };
}

/* what the page is handed, which is this file's own layers only: the mascot
   writes its own numbers through its own runtime. */
function pageFrame(o) {
  return { mo: o.mo, pn: o.pn, wm: o.wm, g: o.g, vig: o.vig };
}

/* ==========================================================================
   the page
   ========================================================================== */
function sceneHtml() {
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post17</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500&display=swap">
<style>
:root{
  --bg:#06070a; --fg:#d5dbd8;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  --body:"Space Grotesk",var(--mono);
  --display:"Michroma",var(--mono);
  /* the panel's own two, and they are the whole of the dark redraw: a ground a
     little above the page and a hairline outline. post14 drew this box as the
     page's ink on the page's paper, which is a dark box on a white frame; on a
     near black frame the same rule would paint a light slab. */
  --pn-bg:#12151b; --pn-line:rgba(213,219,216,.17);
  /* the two channels the rgb split is drawn in: the same white the glow is,
     pulled apart, rather than a red and a cyan out of a filter preset. this
     frame has no colour in it and the glitch is not where colour starts. */
  --gr:rgba(255,120,120,.55); --gc:rgba(120,220,255,.55);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}

/* the vignette, and it is load bearing rather than decoration. with nothing at
   all animating chrome stops producing compositor frames and the screenshot
   call blocks on a frame that never comes — post2.mjs found this and every clip
   in demo/ has carried the fix since. it is outside the stage, so the glitch
   shake cannot move it. the brightness on top is node's, so the empty opening
   is a moving picture in the signature as well as on the screen. */
.vignette{position:fixed;inset:-10%;pointer-events:none;z-index:0;
  filter:brightness(var(--vig,1));
  background:radial-gradient(ellipse 78% 62% at 50% 46%,
    rgba(255,255,255,.032) 0%, rgba(255,255,255,.011) 46%, rgba(0,0,0,0) 72%);
  will-change:transform,opacity,filter;
  animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{
  from{transform:scale(1) translate3d(0,0,0);opacity:.85}
  to{transform:scale(1.05) translate3d(0,-1.1%,0);opacity:1}
}

/* the stage carries the frame's own shake and every custom property anything
   else reads. one place they are written and one place everything reads them
   from, which is what keeps the torn copies from drifting off the real one. the
   page colour is painted by html and body as well, so a fifteen pixel shake
   cannot expose an edge. */
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;background:var(--bg);
  transform:translate3d(calc(var(--sx,0) * 1px),calc(var(--sy,0) * 1px),0);
  will-change:transform}

/* ---- the chat panel ----
   a picture of the box a person types into, drawn out of this file's own rules:
   a rounded panel a shade above the page, a hairline outline, a line of text, a
   plus in a ring on the left, a mic and a waveform on the right. no logo in it
   and nothing lifted off anybody's product — it is the shape of the thing,
   which is what a viewer recognises.

   the glow is the file's own: two soft box shadows on the panel and two text
   shadows on the line, so the box belongs to the same light as the head and the
   wordmark rather than sitting on the frame as a cut out. */
.panel{
  position:absolute; left:${PANEL.x}px; top:${PANEL.y}px;
  width:${PANEL.w}px; height:${PANEL.h}px;
  border-radius:${PANEL.radius}px;
  background:var(--pn-bg); border:1px solid var(--pn-line);
  z-index:3; pointer-events:none; overflow:hidden;
  opacity:var(--pn-o,0);
  transform:translate3d(0,calc(var(--pn-slide,0) * 1px),0);
  box-shadow:0 0 26px rgba(255,255,255,.05),0 0 72px rgba(255,255,255,.022);
  will-change:transform,opacity;
}
.panel-text{
  position:absolute; left:${PANEL.pad}px; right:${PANEL.pad}px; top:${PANEL.pad}px;
  font-family:var(--body); font-weight:400; font-size:${PANEL.textSize}px;
  line-height:${PANEL.lineHeight}; color:var(--fg);
  word-break:break-word;
  text-shadow:0 0 6px rgba(255,255,255,.20),0 0 17px rgba(255,255,255,.08);
}
/* the placeholder and the line share the one box, so the first character lands
   where the placeholder was rather than a few pixels off it.

   **it starts five px in, and that is post14's rendered frame talking.** the
   caret is an inline element after the line, so with nothing typed it sits at x
   nought — which is exactly where the placeholder's first glyph is, and the
   frame came back with a bar drawn through the a of "ask anything". five px
   clears the caret's own two and its margin, and it is what a focused empty
   input actually looks like: the caret, then the placeholder after it. */
.panel-ph{position:absolute; left:5px; top:0; right:0; color:var(--fg);
  opacity:calc(var(--pn-ph,0) * .30); text-shadow:none}
/* the caret. a bar about a cap high sitting after the last character, which is
   what an input draws, and it is an inline element so it travels with the text
   through a wrap without anything having to measure where the text got to. */
.panel-caret{display:inline-block; width:2px; height:.86em; margin-left:.06em;
  background:var(--fg); vertical-align:-.10em; opacity:var(--pn-car,0)}
/* the controls row: a plus in a ring on the left, a mic and a waveform on the
   right. every part of it is two or three css rules, because a chat box's
   chrome is the shape of its chrome and an icon font would be a dependency. */
.panel-row{
  position:absolute; left:${PANEL.pad}px; right:${PANEL.pad}px;
  bottom:${PANEL.pad}px; height:${PANEL.rowH}px;
  display:flex; align-items:center; justify-content:space-between;
}
.panel-plus{
  position:relative; width:${PANEL.plus}px; height:${PANEL.plus}px;
  border-radius:50%; border:1.5px solid var(--fg); opacity:.40;
}
/* two bars rather than a glyph, so nothing depends on a face having a plus that
   optically centres inside a ring. */
.panel-plus::before,.panel-plus::after{
  content:''; position:absolute; left:50%; top:50%; background:var(--fg);
  border-radius:1px;
}
.panel-plus::before{width:${(PANEL.plus * 0.46).toFixed(1)}px; height:1.6px;
  margin:-0.8px 0 0 ${(-PANEL.plus * 0.23).toFixed(1)}px}
.panel-plus::after{width:1.6px; height:${(PANEL.plus * 0.46).toFixed(1)}px;
  margin:${(-PANEL.plus * 0.23).toFixed(1)}px 0 0 -0.8px}
.panel-right{display:flex; align-items:center; gap:${PANEL.iconGap}px; opacity:.46}
/* the mic: a capsule for the head, an open arc under it for the cradle and a
   short stem. no ring around it, because the thing beside it is not in one
   either and one framed icon next to one bare one reads as a mistake. */
.mic{position:relative; width:16px; height:${PANEL.rowH}px}
.mic-cap{position:absolute; left:50%; top:3px; width:8px; height:12px;
  margin-left:-4px; border-radius:999px; background:var(--fg)}
.mic-arc{position:absolute; left:50%; top:11px; width:15px; height:9px;
  margin-left:-7.5px; border:1.6px solid var(--fg); border-top:none;
  border-radius:0 0 999px 999px}
.mic-stem{position:absolute; left:50%; top:20px; width:1.6px; height:4px;
  margin-left:-0.8px; background:var(--fg)}
/* the waveform: five rounded bars, tallest in the middle. it is the one part of
   the chrome that is a picture of sound rather than of a control, and that is
   the point — the panel is being spoken to. */
.wave{display:flex; align-items:center; gap:3px; height:${PANEL.rowH}px}
.wave span{display:block; width:2.4px; border-radius:999px; background:var(--fg)}

/* ---- the mascot's own cut ----
   a wrapper rather than a rule on the zone: the fault hands him the frame and
   the second one takes it back, and neither is anything the module needs to
   know about. */
#mas-cut{position:absolute;inset:0;z-index:4;opacity:var(--m-o,0)}

${mascotCss(plan)}

/* ---- the wordmark ----
   three lines on the middle of the safe band. the deep glow is two text shadows
   rather than blurred duplicates, because it is twelve glyphs and a duplicate
   would have to be written every frame. the brightness filter on top is the
   phosphor breathing, which is what stops the last second from being a still
   picture. */
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
   wordmark is not born yet and what is on the screen is a panel and, from that
   frame on, a mascot driven by a module's runtime — neither has a second copy
   that could be kept in sync. so the first fault's bands are dropouts rather
   than tears: a strip of a screen going flat black is what a picture losing a
   line of itself looks like, and it is the more honest of the two anyway. the
   second fault's bands carry the wordmark, because by then the wordmark is all
   there is. */
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
  <div class="panel" id="panel">
    <div class="panel-text" id="panel-text"><span class="panel-ph" id="panel-ph">${PANEL.placeholder}</span><span id="panel-line"></span><span class="panel-caret" id="panel-caret"></span></div>
    <div class="panel-row">
      <span class="panel-plus"></span>
      <span class="panel-right">
        <span class="mic"><span class="mic-cap"></span><span class="mic-arc"></span><span class="mic-stem"></span></span>
        <span class="wave">${[7, 13, 20, 12, 6].map(h => '<span style="height:' + h + 'px"></span>').join('')}</span>
      </span>
    </div>
  </div>
  <div id="mas-cut">${mascotMarkup(plan)}</div>
  <div class="wm" id="wm">${WM.lines.map(l => '<span>' + l + '</span>').join('')}</div>
${Array.from({ length: GL.bands }, (_, i) => '  <div class="tear" data-tear="' + i
    + '"><div class="tear-in"><div class="wm">'
    + WM.lines.map(l => '<span>' + l + '</span>').join('') + '</div></div></div>').join('\n')}
  <div class="noise" aria-hidden="true"></div>
  <div class="flash" aria-hidden="true"></div>
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
${mascotRuntime()}
window.__P17 = ${JSON.stringify({
    WM, VW, VH, DSF, PANEL: { ...PANEL, typed: PANEL.typed },
  })};
${scenePage.toString()}
scenePage();
document.fonts.load('400 1em "Michroma"')
  .then(() => document.fonts.load('500 1em "Space Grotesk"'))
  .then(() => document.fonts.load('400 1em "Space Grotesk"'))
  .then(() => document.fonts.ready)
  .then(() => {
    window.__p17.fit();
    window.__built = window.__mas.build();
  });
</script>
</body>
</html>`;
}

/* ---------- the page's own script ----------
   it writes numbers to elements and it decides nothing, exactly like the mascot
   runtime beside it. serialised in with .toString(), so it must not close over
   anything: everything it needs arrives on window.__P17. */
function scenePage() {
  const P = window.__P17;
  const stage = document.getElementById('stage');
  const panel = document.getElementById('panel');
  const panelPh = document.getElementById('panel-ph');
  const panelLine = document.getElementById('panel-line');
  const panelText = document.getElementById('panel-text');
  const wms = [...document.querySelectorAll('.wm')];
  const tears = [...document.querySelectorAll('.tear')];
  const tearIns = tears.map(t => t.querySelector('.tear-in'));

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

  window.__p17 = {
    ready: true,

    /* the wordmark is the one block fitted in the page, because michroma is
       proportional and its tracking is nearly a fifth of an em, so the width of
       a string is a measurement rather than a ratio. the panel's type is set
       rather than fitted: node solved the panel's geometry against a size, and
       fitting it here would move it off the box it built. */
    fit() {
      const probe = wms[0];
      probe.style.fontSize = '100px';
      const wmSize = 100 * P.WM.w / widest(probe);
      for (const el of wms) el.style.fontSize = wmSize.toFixed(2) + 'px';
      return { wm: wmSize };
    },

    /* what everything actually measures, once, after the fit. the panel is
       measured with the whole string written in and taken out again, so a line
       that would spill out of its own box is caught before a frame is drawn
       rather than on the last character. */
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
      const was = panelLine.textContent;
      const wasPh = panelPh.style.display;
      panelPh.style.display = 'none';
      panelLine.textContent = P.PANEL.typed;
      const full = panelText.getBoundingClientRect();
      const lh = parseFloat(getComputedStyle(panelText).lineHeight);
      const lines = Math.round(full.height / lh);
      const line = {
        capPx: +(capOf(panelText).cap * d).toFixed(1),
        sizeCss: +parseFloat(getComputedStyle(panelText).fontSize).toFixed(3),
        h: +full.height.toFixed(2), lines,
        font: capOf(panelText).font,
      };
      panelLine.textContent = was;
      panelPh.style.display = wasPh;
      const pr = panel.getBoundingClientRect();
      return {
        wm: box(wms[0]),
        line,
        panel: {
          cssRect: { x: +pr.left.toFixed(2), y: +pr.top.toFixed(2), w: +pr.width.toFixed(2), h: +pr.height.toFixed(2) },
          left: +(pr.left * d).toFixed(1), top: +(pr.top * d).toFixed(1),
          right: +((P.VW - pr.right) * d).toFixed(1), bottom: +((P.VH - pr.bottom) * d).toFixed(1),
          room: +(P.PANEL.h - P.PANEL.pad * 2 - P.PANEL.rowH - full.height).toFixed(2),
        },
        placeholderPx: +(panelPh.getBoundingClientRect().width * d).toFixed(1),
      };
    },

    /* the panel as it actually is on this frame, in screen css and device px,
       which is what the safe area and the collision are checked against. */
    panelBox() {
      const r = panel.getBoundingClientRect(), d = P.DSF;
      return {
        cssRect: { x: +r.left.toFixed(2), y: +r.top.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) },
        left: +(r.left * d).toFixed(1), top: +(r.top * d).toFixed(1),
        right: +((P.VW - r.right) * d).toFixed(1), bottom: +((P.VH - r.bottom) * d).toFixed(1),
      };
    },

    /* the pill on its own, so the shift the header argues for can be checked
       against the thing it was computed from rather than against the cluster it
       is part of. */
    pillBox() {
      const el = document.getElementById('m-pill');
      const r = el.getBoundingClientRect(), d = P.DSF;
      return {
        cssRect: { x: +r.left.toFixed(2), y: +r.top.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) },
        right: +((P.VW - r.right) * d).toFixed(1),
      };
    },

    apply(o) {
      const s = stage.style;
      s.setProperty('--m-o', o.mo.toFixed(4));
      s.setProperty('--pn-o', o.pn.o.toFixed(4));
      s.setProperty('--pn-slide', o.pn.slide.toFixed(3));
      s.setProperty('--pn-ph', o.pn.ph.toFixed(3));
      s.setProperty('--pn-car', o.pn.o > 0.02 ? '1' : '0');
      s.setProperty('--wm-o', o.wm.o.toFixed(4));
      s.setProperty('--wm-s', o.wm.sc.toFixed(4));
      s.setProperty('--wm-glow', o.wm.glow.toFixed(4));
      s.setProperty('--sx', o.g.sx.toFixed(2));
      s.setProperty('--sy', o.g.sy.toFixed(2));
      s.setProperty('--split', o.g.split.toFixed(2));
      s.setProperty('--noise', o.g.noise.toFixed(4));
      s.setProperty('--flash', o.g.flash.toFixed(4));
      document.documentElement.style.setProperty('--vig', o.vig.toFixed(4));
      /* the split is behind an attribute rather than a zero valued shadow: a
         shadow at offset 0 in full colour is a coloured halo, not "off". */
      if (o.g.split > 0.01) stage.setAttribute('data-gl', '1');
      else stage.removeAttribute('data-gl');

      const want = P.PANEL.typed.slice(0, o.pn.n);
      if (panelLine.textContent !== want) panelLine.textContent = want;
      panel.style.visibility = o.pn.o > 0.002 ? 'visible' : 'hidden';

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
   in demo/ runs under. */
function injected() {
  let seed = 0x17a0c3d7;
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
    const ok = await page.evaluate(() => !!(window.__mas && window.__mas.ready
      && window.__p17 && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  const ready = await page.evaluate(() => ({
    mas: !!(window.__mas && window.__mas.ready),
    p17: !!(window.__p17 && window.__p17.ready),
  }));
  for (const k of ['mas', 'p17']) {
    if (!ready[k]) throw new Error('the ' + k + ' layer never became ready');
  }
  /* offline michroma falls back to the system mono and the type looks almost
     right, which is the worst kind of wrong to judge type on. */
  if (!await page.evaluate(() => document.fonts.check('400 40px "Michroma"'))) {
    throw new Error('Michroma did not load — the wordmark would be judged in the mono fallback');
  }
  if (!await page.evaluate(() => document.fonts.check('400 40px "Space Grotesk"'))) {
    throw new Error('Space Grotesk did not load — the question would be judged in the mono fallback');
  }
  return { browser, page, cdp, srv, advance };
}

/* one instant, written to the page in the order the contract says. */
async function paint(page, o) {
  await page.evaluate(m => window.__mas.apply(m), o.mas);
  await page.evaluate(p => window.__p17.apply(p), pageFrame(o));
}

async function shoot(cdp, file, fmt = 'png') {
  const shot = await cdp.send('Page.captureScreenshot', {
    format: fmt, quality: fmt === 'jpeg' ? 94 : undefined,
    captureBeyondViewport: false,
    clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
  });
  fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
}

/* ---------- the panel and the thought, on their own ----------
   the brief's first validation step and it is a mode rather than a note: if the
   question does not read at phone size there is no point animating it. the
   panel with the whole line in it, the panel after the slide, the thought fully
   up, and a crop of each at three times so the type can be judged as type. */
async function renderPanelOnly() {
  const { browser, page, cdp, srv, advance } = await boot();
  const dir = path.join(VERIFY, 'panel');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const m = await page.evaluate(() => window.__p17.measure());
  /* one frame painted and thrown away first. `measure` writes the whole string
     into the line and takes it out again, and the very first capture after that
     came back a frame behind — the last character of the question missing on a
     still called "the line is in". */
  await paint(page, frameAt(0, 0));
  await page.evaluate(now => window.__dmRaf(now), STEP);
  await advance(STEP);
  const shots = [
    [TYPING.until + 0.02, 'a-the-line-is-in'],
    [SLIDE_END, 'b-slid'],
    [BUB_LEAVING - 0.02, 'c-the-thought'],
  ];
  for (const [want, name] of shots) {
    const fr = Math.round(want * FPS);
    await paint(page, frameAt(fr / FPS, fr));
    await page.evaluate(now => window.__dmRaf(now), (fr + 1) * STEP);
    await shoot(cdp, path.join(dir, name + '.png'));
    /* **virtual time has to move between two captures.** with the clock paused
       `Page.captureScreenshot` waits for a frame the compositor has no reason to
       produce, and the second call in a row blocks forever. */
    await advance(STEP);
  }
  {
    const fr = Math.round(SLIDE_END * FPS);
    await paint(page, frameAt(fr / FPS, fr));
    const c = (await page.evaluate(() => window.__p17.panelBox())).cssRect;
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: c.x, y: c.y, width: c.w, height: c.h, scale: 3 },
    });
    fs.writeFileSync(path.join(dir, 'd-the-panel-3x.png'), Buffer.from(shot.data, 'base64'));
    await advance(STEP);
  }
  {
    const fr = Math.round((BUB_LEAVING - 0.02) * FPS);
    await paint(page, frameAt(fr / FPS, fr));
    const c = (await page.evaluate(() => window.__p17.pillBox())).cssRect;
    const pad = 14;
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: Math.max(0, c.x - pad), y: Math.max(0, c.y - pad),
        width: c.w + pad * 2, height: c.h + pad * 2, scale: 3 },
    });
    fs.writeFileSync(path.join(dir, 'e-the-pill-3x.png'), Buffer.from(shot.data, 'base64'));
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
  const meas = await page.evaluate(() => window.__p17.measure());
  console.log('  built: head ' + built.headPx + 'px, ' + built.eyes + ' eyes, '
    + built.glows + ' glow layers, ' + built.dots + ' dots, outline '
    + built.strokePx + ' device px, theme ' + built.theme);
  console.log('  the wordmark: ' + meas.wm.sizeCss + 'css px, widest line ' + meas.wm.widestPx
    + ' device px, caps ' + meas.wm.capPx);
  console.log('  the question: ' + meas.line.sizeCss + 'css px, caps ' + meas.line.capPx
    + ' device px, ' + meas.line.lines + ' lines, ' + meas.line.h.toFixed(1)
    + ' css tall in a panel with ' + meas.panel.room.toFixed(1) + ' css of air left in it');

  /* the liveness signature. one number per output frame off everything this file
     wrote plus everything the module wrote, **gated by what is actually drawn**,
     so two identical frames are a fact rather than a suspicion. post10 shipped a
     pair and only found out at sixty. */
  const sigs = [];
  let panelWorst = null, panelSamples = 0, collide = [];
  let bubWorst = null, bubSamples = 0, pillWorst = null;
  const wall = Date.now();

  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const o = frameAt(t, f);
      await paint(page, o);
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);

      if (k === 0) {
        let s = o.vig * 211 + o.mo * 7
          + o.pn.o * 11 + o.pn.slide * 13 + o.pn.n * 17 + o.pn.ph * 19
          + o.wm.o * 23 + o.wm.sc * 29 + o.wm.glow * 31
          + o.g.sx * 37 + o.g.sy * 41 + o.g.split * 43 + o.g.noise * 47 + o.g.flash * 53
          + o.g.bands.length * 59;
        if (o.mo) {
          s += o.mas.card.x * 61 + o.mas.card.y * 67 + o.mas.card.rot * 71
            + o.mas.card.sx * 73 + o.mas.card.sy * 79 + o.mas.glow * 83
            + o.mas.bubble.o * 87 + o.mas.bubble.pill.sc * 89
            + o.mas.bubble.dots[0].sc * 91 + o.mas.bubble.dots[1].sc * 93;
          for (let e = 0; e < 2; e++) {
            s += o.mas.eyes[e].x * (97 + e) + o.mas.eyes[e].y * (101 + e)
              + o.mas.eyes[e].sx * (103 + e) + o.mas.eyes[e].sy * (107 + e)
              + o.mas.eyes[e].lid * (109 + e);
          }
        }
        sigs.push(+s.toFixed(6));

        const every = Math.max(1, Math.round(FPS / 8));
        /* the panel, eight times a second and never inside a fault: the glitch
           translates the stage and a reading through a fifteen pixel jump is a
           reading of the glitch rather than of the panel. */
        if (o.pn.o > 0.5 && o.g.heat === 0 && f % every === 0) {
          const pb = await page.evaluate(() => window.__p17.panelBox());
          panelSamples++;
          const air = Math.min(pb.left - SAFE.left, pb.top - SAFE.top,
            pb.right - SAFE.right, pb.bottom - SAFE.bottom);
          if (!panelWorst || air < panelWorst.air) {
            panelWorst = { t: +t.toFixed(2), air: +air.toFixed(1), ...pb };
          }
          if (o.mo) {
            const hp = headPageRect(o.mas).rect;
            if (overlaps(hp, pb.cssRect)) collide.push('at ' + t.toFixed(2) + 's');
          }
        }
        /* and the thought, on every frame it is up: it is the punchline and the
           one piece of copy in the back half of the film. `bubbleSafe` is the
           module's own measurement of the whole cluster, dots and all. */
        if (o.mo && o.mas.bubble.o > 0.02) {
          const bs = await page.evaluate((w, h) => window.__mas.bubbleSafe(w, h), VW, VH);
          if (bs) {
            bubSamples++;
            const air = Math.min(bs.left - SAFE.left, bs.top - SAFE.top,
              bs.right - SAFE.right, bs.bottom - SAFE.bottom);
            if (!bubWorst || air < bubWorst.air) {
              bubWorst = { t: +t.toFixed(2), air: +air.toFixed(1), ...bs };
            }
            const pb = await page.evaluate(() => window.__p17.pillBox());
            if (!pillWorst || pb.right < pillWorst.right) {
              pillWorst = { t: +t.toFixed(2), ...pb };
            }
          }
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

  const caps = await page.evaluate(() => window.__mas.caps());

  /* ---------- the stills ----------
     a still is a frame the clip actually has: the time asked for is rounded to a
     frame and then that frame's own instant is what gets drawn, so the glitch,
     which is a function of the frame index, and everything else, which is a
     function of the time, can never disagree about which moment a still is. */
  fs.rmSync(VERIFY, { recursive: true, force: true });
  fs.mkdirSync(VERIFY, { recursive: true });
  const stills = [
    [0, 'a-black'],
    [PANEL.at + PANEL.in, 'b-the-panel'],
    [TYPING.from + 0.02, 'c-the-first-character'],
    [V.words[2].start, 'd-mid-question'],
    [TYPING.until + 0.02, 'e-the-line-is-in'],
    [SLIDE_AT + SLIDE.for / 2, 'f-sliding'],
    [SLIDE_END, 'g-slid'],
    [GLA_AT, 'h-the-first-fault'],
    [M1 + STATES.neutral.entry, 'i-he-is-here'],
    [BLINK_AT, 'j-the-slow-blink'],
    [BUB.in + BUBBLE.step, 'k-the-dots'],
    [BUB_FULL, 'l-the-thought'],
    [(BUB_FULL + BUB_LEAVING) / 2, 'm-holding'],
    [BUB_LEAVING - 1 / FPS, 'n-the-last-frame-of-it'],
    [GLB_AT, 'o-the-second-fault'],
    [GLB_AT + GLB.for + 0.06, 'p-the-wordmark'],
    [SECONDS - 0.05, 'q-the-last-frame'],
  ];
  for (const [want, name] of stills) {
    const fr = Math.min(N - 1, Math.max(0, Math.round(want * FPS)));
    await paint(page, frameAt(fr / FPS, fr));
    await page.evaluate(now => window.__dmRaf(now), (fr + 1) * STEP);
    await shoot(cdp, path.join(VERIFY, name + '.png'));
    await advance(STEP);
  }

  /* ---------- the thought arriving, frame by frame ----------
     the cluster is three springs 70ms apart and the whole gesture is under half
     a second, so the preview cannot answer whether it reads as one thing with
     three beats. twenty stills a sixtieth apart across the dots and the pill. */
  const bdir = path.join(VERIFY, 'thought');
  fs.mkdirSync(bdir, { recursive: true });
  for (let i = 0; i < 20; i++) {
    const t = +(BUB.in - 1 / 60 + i / 60).toFixed(4);
    const fr = Math.round(t * FPS);
    await paint(page, frameAt(t, fr));
    await shoot(cdp, path.join(bdir, 'b' + String(i).padStart(2, '0')
      + '-' + t.toFixed(3) + 's.png'));
    await advance(STEP);
  }

  /* ---------- the panel at three times ----------
     the legibility argument, as a picture, on every run rather than only when
     somebody remembers the flag. */
  {
    const fr = Math.round(SLIDE_END * FPS);
    await paint(page, frameAt(fr / FPS, fr));
    const c = (await page.evaluate(() => window.__p17.panelBox())).cssRect;
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: c.x, y: c.y, width: c.w, height: c.h, scale: 3 },
    });
    fs.writeFileSync(path.join(VERIFY, 'the-panel-3x.png'), Buffer.from(shot.data, 'base64'));
    await advance(STEP);
  }

  await browser.close();
  srv.close();
  if (SUB > 1) blend(N);

  const state = {
    built, meas, caps, sigs, frames: N,
    panel: panelWorst, panelSamples, collide,
    bubble: bubWorst, bubSamples, pill: pillWorst,
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
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
  const out = path.join(OUT, 'post17-dark-1080x1920.mp4');
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
   five kinds of event and every one of them is a time something else already
   decided. nothing here is placed by hand and nothing here is a new recipe.

     the key ticks       `key`, one per four characters plus the two ends, off
                         the typing's own list rather than off a rate. they are
                         under the read and the mix ducks them for it.
     the thud            `popDeep`, on the frame the panel starts moving, taken
                         softer and shorter than the defaults — 84 to 46 hertz
                         over a quarter of a second. it is a box being pushed
                         out of the way rather than a bass hit, and post16's
                         impact is what it is deliberately not.
     the first fault     `glitch`, on the frame he is born.
     the pop             `mascotCues(plan)`'s own, and it is **taken** rather
                         than declined: the module puts a `pop` on the pill
                         rather than on the first dot, because the dots are the
                         anticipation and the pill is the arrival, and a sound on
                         the wind-up is early for the thing it is the sound of.
     the second fault    `glitch` again, shorter and lower, because it is a cut
                         to a card rather than something being taken away.

   there is no music, which is the brief. */
const CUES = mascotCues(plan);
function soundCues() {
  const cues = [
    ...TYPING.keys.map(t => ({ t: +t.toFixed(4), kind: 'key', from: 'the typing' })),
    { t: SLIDE_AT, kind: 'popDeep', opts: { f0: 84, f1: 46, tau: 0.10, len: 0.24 },
      from: 'the panel starting to move' },
    { t: GLA_AT, kind: 'glitch', from: 'the first fault, and he arrives' },
    ...CUES.map(c => ({ ...c, from: 'mascotCues — the pill landing' })),
    { t: GLB_AT, kind: 'glitch', opts: { len: 0.10, f0: 220, f1: 78 },
      from: 'the second fault, and the wordmark arrives' },
  ];
  return cues.sort((a, b) => a.t - b.t);
}

/* ==========================================================================
   go
   ========================================================================== */
console.log('the boring tek — post17, message for the next generation');
console.log('');
console.log('the read');
console.log('  "' + LINE + '" — ' + VOICE + ', ' + (V.cached ? 'cached' : 'fetched')
  + ', timing off the ' + V.timing + ', ' + V.words.length + ' words, peak ' + V.peak + ' dBFS');
console.log('  sound ' + V.sound.start.toFixed(2) + '..' + V.sound.end.toFixed(2)
  + 's, words ' + V.words[0].start.toFixed(2) + '..' + V.lastWord.toFixed(2)
  + 's, ' + V.wps.toFixed(2) + ' words a second');
console.log('  ' + V.words.map(w => w.word + ' ' + w.start.toFixed(2) + '..' + w.end.toFixed(2)).join(', '));
console.log('');

console.log('the typing');
console.log('  ' + TYPING.chars + ' characters, ' + TYPING.from.toFixed(2) + '..'
  + TYPING.until.toFixed(2) + 's, which is the read to the hundredth at both ends');
console.log('  ' + TYPING.cps.toFixed(1) + ' characters a second on average, and it is not '
  + 'an average: every word is laid across its own spoken span, so it is fast inside a '
  + 'word and still between them');
console.log('  ' + TYPING.keys.length + ' key ticks, one per ' + PANEL.keyEvery
  + ' characters plus the two ends');
console.log('');

console.log(describeMascot(plan));
const rep = mascotMotion(plan, FPS, SECONDS);
const rep60 = FPS === 60 ? rep : mascotMotion(plan, 60, SECONDS);
console.log(describeMotion(rep60));
console.log('');

console.log('the layout');
console.log('  the panel is ' + PANEL.w + ' x ' + PANEL.h + ' css at ' + PANEL.x + ', '
  + PANEL.y + ', which is the full safe width centred on ' + CENTRE_Y
  + ' — and it slides to ' + (PANEL.y + SLIDE.by));
console.log('  its two blocks leave ' + PANEL.room.toFixed(1) + ' css px of air between them, '
  + 'floor is ' + PANEL.minRoom);
console.log('  he is centred in the room the slide makes: ' + ROOM.top + '..' + ROOM.bottom
  + ' css, plate on ' + PLATE_CY + ' — ' + (PLATE_CY - PLATE.r - ROOM.top).toFixed(1)
  + ' css of air over his crown and the same under his chin');
console.log('  the thought reaches page y ' + (plan.box.top + plan.thought.topInZone).toFixed(1)
  + ' at its highest, ' + (plan.box.top + plan.thought.topInZone - SAFE_CSS.top).toFixed(1)
  + ' css inside the safe line');
console.log('  the plate is ' + (HEAD.plate.s * plan.unit).toFixed(1) + ' css / '
  + plan.headPx.toFixed(0) + ' device px across, window is ' + HEAD_PX.min + '..' + HEAD_PX.max);
console.log('  the thought hangs ' + plan.thought.mode + ' (' + plan.thought.asked + '), side '
  + plan.thought.side + ', at ' + plan.thought.angle + ' degrees, lifts '
  + plan.thought.lifts.join(', ') + ', pill ' + plan.thought.pillH + ' css tall');
console.log('  the pill solves to ' + PILL_W + ' css wide and its spring carries it to x'
  + PILL_SC + ', so off a dead centre head its right edge would reach '
  + (VW / 2 - (HEAD.plate.x + HEAD.plate.s / 2) * plan.unit + PILL_X0 + PILL_W * PILL_SC).toFixed(1)
  + ' against a safe line at ' + (VW - SAFE_CSS.right));
console.log('  so he sits ' + OFF_X + ' css px (' + (OFF_X * DSF).toFixed(0)
  + ' device) left of the frame\'s middle. no head size fixes it — see the header');
console.log('');

console.log('the beats');
const beats = [
  [0, 'black, empty, the vignette breathing'],
  [PANEL.at, 'the panel fades in over ' + PANEL.in.toFixed(2) + 's, with its placeholder on it'],
  [TYPING.from, 'the first character, and the read starts on the same word'],
  ...V.words.map(w => [w.start, '  "' + w.word + '"']),
  [TYPING.until, 'the last character, and the last word ends with it'],
  [SLIDE_AT, 'the panel slides ' + SLIDE.by + 'px down over ' + SLIDE.for.toFixed(2)
    + 's, and the thud is on it'],
  [SLIDE_END, 'it lands'],
  [GLA_AT, 'the first fault, ' + GLA.for.toFixed(2) + 's of it, and he is born on the frame'],
  [M1 + STATES.neutral.entry, 'he has settled: neutral, alive, above the panel'],
  [BLINK_AT, 'the slow blink, ' + ((BLINK.close + BLINK.hold + BLINK.open) * 1000).toFixed(0)
    + 'ms of lid, off the idle layer'],
  [M2, 'the second mark: he takes a breath'],
  [BUB.in, 'the first dot climbs off his crown'],
  [BUB.full, '"' + THOUGHT + '" is fully up, and the pop is on the pill'],
  [BUB.leaving, 'and the second fault takes it while it is still up, '
    + GLB.for.toFixed(2) + 's of it'],
  [WM_IN, 'the wordmark snaps in over ' + GLB.wmFor.toFixed(2) + 's and holds '
    + (SECONDS - WM_IN - GLB.wmFor).toFixed(2) + 's'],
  [SECONDS, 'end'],
].sort((a, b) => a[0] - b[0]);
for (const [t, what] of beats) console.log('  ' + t.toFixed(2) + 's  ' + what);
console.log('');

/* ---------- the sound ---------- */
const cues = soundCues();
const sfx = renderSfx(cues, SECONDS);
const WAV = path.join(OUT, 'post17-mix.wav');
fs.mkdirSync(OUT, { recursive: true });

/* the read on top, the small bus under it, ducked while a word is being spoken,
   then the loudness pass that keeps its best answer rather than its last. both
   halves of that discipline were paid for by post5 and post14. */
const track = V.track.slice(0, Math.ceil(SECONDS * SR));
const env = voiceEnvelope(V.words, SECONDS);
const mix = mixdown(track, sfx.buf, env, { duck: DUCK, voiceGain: VOICE_TRIM });
const under = checkUnderVoice(mix.voiceOut, mix.bus);
const baseMix = mix.out.slice();
const passes = [];
const miss = q => Math.abs(q - TARGET_LUFS);
let lift = 0, best = null;
for (let i = 0; i < 12; i++) {
  mix.out.set(baseMix);
  if (lift) applyGain(mix.out, lift);
  const l = limit(mix.out, WAV_CEILING);
  writeWav(WAV, mix.out);
  const m = loudness(ffmpeg, WAV);
  const pass = { lift, lufs: m.lufs, tp: m.truePeak, gr: l.reduction };
  passes.push(pass);
  if (!m.ok) { best = pass; break; }
  /* the ceiling wins when it wins, and it is post12's and post14's argument: a
     read with a lot of crest on it buys its last decibels of loudness entirely
     with limiting, and that is not louder, it is denser. so a pass that costs
     more than the allowance is not kept whatever it measures. */
  if (l.reduction <= MAX_REDUCTION && (!best || miss(m.lufs) < miss(best.lufs))) {
    best = { ...pass, kept: true };
  }
  if (Math.abs(m.lufs - TARGET_LUFS) < 0.25 || l.reduction > MAX_REDUCTION) break;
  lift = +(lift + (TARGET_LUFS - m.lufs)).toFixed(2);
}
/* and the kept pass is written back out, so the file on disk is the one the
   loop chose rather than the one it happened to stop on. */
mix.out.set(baseMix);
if (best && best.lift) applyGain(mix.out, best.lift);
const lim = limit(mix.out, WAV_CEILING);
writeWav(WAV, mix.out);
const after = loudness(ffmpeg, WAV);

console.log('the sound');
console.log(describeMix(sfx.report, {
  'the read': track.length / SR + 's of track, ' + V.words.length + ' words, ducking the bus to '
    + DUCK + ' while a word is being said',
  'the bus': cues.length + ' cues — ' + TYPING.keys.length + ' key ticks, one thud, two faults and '
    + CUES.length + ' from mascotCues',
  'under the read': under.over.length === 0
    ? 'the bus stays ' + under.worst.db.toFixed(1) + ' dB under the voice at its worst ('
      + under.worst.at.toFixed(2) + 's), over ' + under.windows + ' windows a word is in'
    : under.over.length + ' windows have the bus over the voice, the worst at '
      + under.over[0].t + 's',
  'the loudness loop': passes.length + ' passes, kept lift ' + (best ? best.lift.toFixed(2) : '?')
    + ' dB at ' + (after.lufs == null ? '?' : after.lufs) + ' LUFS, limiter took '
    + (lim.reduction > 0.01 ? lim.reduction.toFixed(2) + ' dB' : 'nothing')
    + ', allowance ' + MAX_REDUCTION,
}));
console.log('');

/* ---------- the panel on its own, first ---------- */
if (PANEL_ONLY) {
  const m = await renderPanelOnly();
  console.log('the panel and the thought, as stills, in '
    + path.relative(ROOT, path.join(VERIFY, 'panel')));
  console.log('  the question renders ' + m.line.lines + ' lines at ' + m.line.capPx
    + ' device px of cap, floor ' + PANEL.minCapPx);
  process.exit(0);
}

const state = ONLY_ENCODE
  ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
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
if (state.panel) {
  console.log('  the panel at its tightest (' + state.panel.t + 's): clear ' + state.panel.left
    + ' left / ' + state.panel.top + ' top / ' + state.panel.right + ' right / '
    + state.panel.bottom + ' bottom, in device px');
}
if (state.bubble) {
  console.log('  the thought at its tightest (' + state.bubble.t + 's): clear '
    + state.bubble.left + ' left / ' + state.bubble.top + ' top / ' + state.bubble.right
    + ' right / ' + state.bubble.bottom + ' bottom, cluster ' + state.bubble.w + ' device px wide');
}
console.log('  a still per beat in ' + path.relative(ROOT, VERIFY)
  + ', the thought arriving in ' + path.relative(ROOT, path.join(VERIFY, 'thought')));

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
check(SECONDS >= RUN.min && SECONDS <= RUN.max,
  'the clip runs ' + SECONDS.toFixed(2) + 's, and the brief asks for '
  + RUN.min.toFixed(1) + ' to ' + RUN.max.toFixed(1));

/* ---------- the read, and the typing cut to it ---------- */
check(V.timing === 'engine',
  'the word times come off the engine rather than off an estimate: ' + V.timing);
check(Math.abs(V.sound.start - VOICE_AT) < 0.001,
  'the read\'s own sound starts on VOICE_AT: ' + V.sound.start.toFixed(3) + 's against '
  + VOICE_AT + ', measured off the waveform rather than off the word list');
check(TYPING.from === V.words[0].start && TYPING.until === V.words[V.words.length - 1].end,
  'the typing is the read at both ends: first character on "' + V.words[0].word + '" at '
  + TYPING.from.toFixed(3) + 's, last on "' + V.words[V.words.length - 1].word + '" at '
  + TYPING.until.toFixed(3) + 's');
{
  /* every character inside the word it belongs to, which is the whole design and
     is worth re-deriving rather than trusting. the spaces are the exception and
     they live in the silence between two words. */
  let bad = 0, worst = null;
  const re = /\S+/g;
  const toks = [];
  let m;
  while ((m = re.exec(PANEL.typed))) toks.push({ a: m.index, b: m.index + m[0].length });
  for (let k = 0; k < toks.length; k++) {
    for (let i = toks[k].a; i < toks[k].b; i++) {
      const t = TYPING.at[i];
      if (t < V.words[k].start - 1e-6 || t > V.words[k].end + 1e-6) {
        bad++;
        if (!worst) worst = 'character ' + i + ' at ' + t + 's, outside "' + V.words[k].word + '"';
      }
    }
  }
  check(bad === 0, 'every character lands inside its own word\'s spoken span: ' + bad
    + ' outside' + (worst ? ' (' + worst + ')' : ''));
}
check(TYPING.at.every((t, i) => i === 0 || t >= TYPING.at[i - 1]),
  'the typing never goes backwards, over all ' + TYPING.chars + ' characters');
{
  const before = frameAt(TYPING.from - 1 / 60, Math.round((TYPING.from - 1 / 60) * FPS));
  const on = frameAt(TYPING.from, Math.round(TYPING.from * FPS));
  check(before.pn.n === 0 && before.pn.ph === 1 && on.pn.ph === 0,
    'the placeholder is on until the first character lands and off from it');
}
check(typedAt(TYPING.until) === TYPING.chars && typedAt(SECONDS) === TYPING.chars,
  'the whole question is on the screen from the last keystroke to the end: '
  + typedAt(TYPING.until) + ' of ' + TYPING.chars + ' characters');
check(TYPING.cps < 26,
  'the typing runs at ' + TYPING.cps.toFixed(1) + ' characters a second across the read, '
  + 'and it is clustered into words rather than spread evenly — see the header');

/* ---------- the panel ---------- */
if (state.meas) {
  const m = state.meas;
  check(m.line.capPx >= PANEL.minCapPx,
    'the question measures ' + m.line.capPx + ' device px of cap, floor is '
    + PANEL.minCapPx + '. it clears it by ' + (m.line.capPx - PANEL.minCapPx));
  check(m.line.lines === PANEL.lines,
    'it wraps to ' + m.line.lines + ' lines, which is what the panel is '
    + PANEL.lines + ' lines tall for');
  check(m.panel.room >= PANEL.minRoom,
    'the two blocks inside the panel leave ' + m.panel.room.toFixed(1)
    + ' css px of air, floor is ' + PANEL.minRoom);
  check(Math.abs(m.line.sizeCss - PANEL.textSize) < 0.01,
    'the question is set at ' + m.line.sizeCss + 'css px, which is what the panel was solved at');
  check(m.wm.capPx >= WM.minCapPx,
    'the wordmark caps measure ' + m.wm.capPx + ' device px, floor is ' + WM.minCapPx);
  check(Math.min(m.wm.left, m.wm.top, m.wm.right, m.wm.bottom) >= floorDev,
    'the wordmark clears the platform safe area: ' + m.wm.left + ' left, ' + m.wm.top
    + ' top, ' + m.wm.right + ' right, ' + m.wm.bottom + ' bottom, floor ' + floorDev);
  check(Math.abs(m.wm.cssRect.y + m.wm.cssRect.h / 2 - CENTRE_Y) < 1.5,
    'and it is on the middle of the safe band: its rendered middle is '
    + (m.wm.cssRect.y + m.wm.cssRect.h / 2).toFixed(1) + ' css against ' + CENTRE_Y);
  check(state.built.headPx >= HEAD_PX.min && state.built.headPx <= HEAD_PX.max,
    'the head rendered at ' + state.built.headPx + ' device px, window is '
    + HEAD_PX.min + ' to ' + HEAD_PX.max);
  check(state.built.strokePx >= 4,
    'the bubble\'s outline computed to ' + state.built.strokePx
    + ' device px, and chrome floors a border to a whole css pixel');
}
if (state.caps) {
  check(state.caps.capPx >= BUBBLE.minCap,
    'the thought\'s caps measure ' + state.caps.capPx + ' device px, floor is ' + BUBBLE.minCap);
}
if (state.panel) {
  check(state.panel.air >= 0,
    'the panel is inside the platform safe area on all ' + state.panelSamples
    + ' rendered samples, at rest and after the slide: ' + state.panel.air
    + ' device px of air at ' + state.panel.t + 's. it is the full safe width by '
    + 'construction, so nought on the sides is the line rather than a near miss');
}
check(state.collide.length === 0,
  'his ink never touches the panel: ' + (state.collide.length
    ? state.collide.join(', ') : 'no sampled frame does'));

/* ---------- the slide ---------- */
{
  const a = frameAt(SLIDE_AT, Math.round(SLIDE_AT * FPS));
  const b = frameAt(SLIDE_END, Math.round(SLIDE_END * FPS));
  check(a.pn.slide < 0.01 && Math.abs(b.pn.slide - SLIDE.by) < 0.01,
    'the panel slides exactly ' + SLIDE.by + ' css px, from ' + a.pn.slide.toFixed(2)
    + ' at ' + SLIDE_AT.toFixed(2) + 's to ' + b.pn.slide.toFixed(2) + ' at ' + SLIDE_END.toFixed(2));
  let worst = 0, at = 0;
  for (let f = 0; f <= Math.round(60 * SECONDS); f++) {
    const d = Math.abs(frameAt((f + 1) / 60, f + 1).pn.slide - frameAt(f / 60, f).pn.slide);
    if (d > worst) { worst = d; at = +(f / 60).toFixed(2); }
  }
  check(worst < VH / 12,
    'and it is a move rather than a cut: its worst one frame step is ' + worst.toFixed(1)
    + ' css px at ' + at + 's, against a twelfth of the frame (' + (VH / 12).toFixed(0) + ')');
  check(SLIDE_END <= GLA_AT + 1e-6,
    'it lands (' + SLIDE_END.toFixed(2) + 's) before the fault (' + GLA_AT.toFixed(2)
    + 's), so the panel is still and he arrives into a frame that has stopped moving');
  check(SLIDE_AT > TYPING.until,
    'and it starts after the last character, not on it: ' + SLIDE_AT.toFixed(2) + 's against '
    + TYPING.until.toFixed(2));
}

/* ---------- he is born on the fault ---------- */
{
  const before = frameAt((MAS_IN_FRAME - 1) / FPS, MAS_IN_FRAME - 1);
  const on = frameAt(MAS_IN_FRAME / FPS, MAS_IN_FRAME);
  check(before.mo === 0 && on.mo === 1,
    'he is born on the fault\'s own frame: nothing at frame ' + (MAS_IN_FRAME - 1)
    + ' and the mascot at ' + MAS_IN_FRAME);
  check(on.g.heat > 0,
    'and the frame he is born on is a torn one: heat ' + on.g.heat.toFixed(2));
  check(before.pn.o > 0.9 && on.pn.o > 0.9,
    'the panel survives the first fault, which is what he arrives above');
  check(Math.abs(MAS_IN_FRAME / FPS - GLA_AT) <= 1 / FPS + 1e-9,
    'the birth frame is within one frame of the fault at both rates: '
    + (MAS_IN_FRAME / FPS).toFixed(4) + 's at ' + FPS + ', '
    + (Math.round(GLA_AT * 12) / 12).toFixed(4) + 's at twelve, '
    + (Math.round(GLA_AT * 60) / 60).toFixed(4) + 's at sixty');
}

/* ---------- the mascot ---------- */
check(plan.marks.length === 2 && plan.marks.every(m => m.state === 'neutral'),
  'both marks are neutral: he is flat and calm and he never smiles, which is the brief');
check(plan.bias === 0,
  'he looks straight down the lens: resting turn ' + plan.bias);
{
  let worst = null;
  for (let f = MAS_IN_FRAME; f < CUT_FRAME; f++) {
    const a = headPageRect(mascotFrame(plan, f / FPS)).air;
    const near = Math.min(a.left, a.top, a.right, a.bottom);
    if (!worst || near < worst.near) worst = { t: +(f / FPS).toFixed(2), near: +near.toFixed(1), ...a };
  }
  check(worst.near >= 0,
    'his head clears the platform safe area on every frame he is on: ' + worst.near
    + ' device px at ' + worst.t + 's (' + worst.left + ' left, ' + worst.top + ' top, '
    + worst.right + ' right, ' + worst.bottom + ' bottom)');
}
{
  const near = blinksNear(plan);
  check(near.length === 1 && blinkInside(near[0]),
    'exactly one idle blink lands in the beat before the thought ('
    + BLINK_WINDOW[0].toFixed(2) + ' to ' + BLINK_WINDOW[1].toFixed(2) + '), and the whole of '
    + 'it is inside: ' + near.length + ', ' + BLINK.t.toFixed(2) + '..'
    + blinkEnd(BLINK).toFixed(2) + 's');
  check(SEED.len >= 0.26,
    'and it is a slow one: ' + (SEED.len * 1000).toFixed(0) + 'ms of lid, out of a search '
    + 'over six thousand seeds. seed ' + SEED.seed);
  check(blinkEnd(BLINK) <= BUB.in - 0.09,
    'his eyes are open again before the first dot climbs: the lid is back at '
    + blinkEnd(BLINK).toFixed(2) + 's and the dot starts at ' + BUB.in.toFixed(2)
    + 's, ' + ((BUB.in - blinkEnd(BLINK)) * 1000).toFixed(0) + 'ms later');
  /* and he is **alive** under the thought rather than still. a face holding one
     expression for 0.9s with nothing moving on it is a still frame with a pill
     over it, which is the one thing the house's own "no frozen face" rule is
     about. one idle blink in there is right; two would be a tic, and one landing
     on the frame the pill arrives would be two events sharing a frame. */
  const after = plan.idle.blinks.filter(b => blinkEnd(b) > BUB.full && b.t < BUB.leaving);
  check(after.length === 1,
    'he is alive under the thought rather than held: ' + after.length + ' idle blink while it '
    + 'is up' + (after.length ? ', at ' + after[0].t.toFixed(2) + 's' : ''));
  check(after.every(b => Math.abs(b.t - CUES[0].t) > 0.10),
    'and it is not on the frame the pill lands, which would be two events sharing one beat');
}
check(rep60.frozenFrames === 0, 'the face is never frozen: ' + rep60.frozenFrames + ' frames');
check(rep60.maxSquash <= 0.081, 'the squash peaks at ' + (rep60.maxSquash * 100).toFixed(1) + '%');
check(rep60.maxBreathe <= 0.021, 'the breathing peaks at ' + (rep60.maxBreathe * 100).toFixed(2) + '%');

/* ---------- the thought ---------- */
check(plan.thought.mode === 'over' && plan.thought.asked === 'over-right',
  'the thought is the module\'s own placement over the crown, asked for as '
  + plan.thought.asked + ' — the option lib grew after post15 and the first clip to use it');
check(Math.abs(BUB.in - BUB_IN) < 1e-6 && Math.abs(BUB.leaving - BUB_LEAVING) < 1e-6,
  'the film was sized off the module\'s own bubble profile and the plan agrees: in '
  + BUB.in.toFixed(3) + ' against ' + BUB_IN.toFixed(3) + ', leaving ' + BUB.leaving.toFixed(3)
  + ' against ' + BUB_LEAVING.toFixed(3));
check(Math.abs((BUB.leaving - BUB.full) - BUBBLE.hold) < 1e-6,
  'it is fully up for ' + (BUB.leaving - BUB.full).toFixed(2) + 's, which is BUBBLE.hold\'s '
  + BUBBLE.hold + ' exactly — the module\'s own ceiling on a single bubble, not a number '
  + 'chosen here. the brief asked for about two and lib is untouched; see the header');
check(Math.abs(CUT_FRAME / FPS - BUB.leaving) <= 1 / FPS + 1e-9,
  'and the fault takes it on the frame it would begin to leave, so the thought is cut at '
  + 'full size rather than shrinking first: cut at ' + (CUT_FRAME / FPS).toFixed(3)
  + 's against ' + BUB.leaving.toFixed(3));
check(BUB.text === THOUGHT,
  'the pill says "' + BUB.text + '"');
{
  const onScreen = +(BUB.leaving - (BUB.in + BUBBLE.step * 2)).toFixed(3);
  check(onScreen > 1.1,
    'the pill itself is on the screen for ' + onScreen.toFixed(2) + 's and the whole gesture, '
    + 'first dot to cut, runs ' + (BUB.leaving - BUB.in).toFixed(2) + 's');
}
if (state.bubble) {
  check(state.bubble.air >= 0,
    'the whole cluster, dots and all, clears the platform safe area on all ' + state.bubSamples
    + ' frames it is up: ' + state.bubble.air + ' device px at ' + state.bubble.t + 's');
}
if (state.pill) {
  check(state.pill.right >= SAFE.right,
    'and the pill\'s own right edge, which is what OFF_X was computed from, stays '
    + state.pill.right + ' device px off the frame against a safe line at ' + SAFE.right
    + ' — measured at its worst spring frame, ' + state.pill.t + 's');
  check(Math.abs(state.pill.cssRect.w - PILL_W * PILL_SC) <= 4,
    'the rendered pill is ' + state.pill.cssRect.w.toFixed(1) + ' css wide at that frame '
    + 'against the solve\'s ' + (PILL_W * PILL_SC).toFixed(1)
    + ', so the shift was computed on the face that actually rendered');
}
check(OFF_X > 0 && OFF_X < 30,
  'he sits ' + OFF_X + ' css px left of the frame\'s middle, and it is derived rather than '
  + 'chosen: exactly what the pill needs to keep ' + PILL_AIR + 'px inside the safe line');

/* ---------- the end ---------- */
{
  const before = frameAt((CUT_FRAME - 1) / FPS, CUT_FRAME - 1);
  const on = frameAt(CUT_FRAME / FPS, CUT_FRAME);
  check(before.mo === 1 && before.pn.o > 0.9 && on.mo === 0 && on.pn.o === 0,
    'the second fault takes everything on one frame: him and the panel on at frame '
    + (CUT_FRAME - 1) + ', both gone at ' + CUT_FRAME);
  check(before.wm.o === 0 && on.wm.o > 0,
    'and the wordmark is born on that frame rather than at that time, which is post13\'s '
    + 'correction: nothing at ' + (CUT_FRAME - 1) + ', ' + on.wm.o + ' at ' + CUT_FRAME);
}
check(GLA_AT < GLB_AT,
  'the two faults are in the right order, ' + ((GLB_AT - GLA_AT) * 1000).toFixed(0) + 'ms apart');
check(GL_WINDOWS_60.length === 2,
  'there are exactly two faults, ' + GL_WINDOWS_60.map(w => w.frames + ' frames').join(' and ')
  + ' of them at sixty');
check(Math.abs((SECONDS - WM_IN) - (END_HOLD + 1 / FPS)) < 0.03,
  'the end card is on the screen for ' + (SECONDS - WM_IN).toFixed(2)
  + 's, which is the brief\'s about 1.2');
check(WM.lines.length === 3 && !WM.lines.join(' ').includes('.'),
  'the end card is the wordmark on three lines with no domain under it: '
  + WM.lines.join(' / '));

/* ---------- liveness ---------- */
{
  const seen = new Set();
  let dupes = 0;
  for (const s of state.sigs) { if (seen.has(s)) dupes++; seen.add(s); }
  check(dupes === 0, 'no two frames of the film are identical: ' + dupes + ' repeats in '
    + state.sigs.length + ' frames, and the signature is gated by what is actually drawn — '
    + 'the empty opening is carried by the vignette, which node writes a curve for');
}

/* ---------- the sound ---------- */
check(cues.filter(c => c.kind === 'key').length === TYPING.keys.length,
  TYPING.keys.length + ' key ticks, one per ' + PANEL.keyEvery + ' characters plus the ends, '
  + 'off the typing\'s own list rather than off a rate');
check(CUES.length === 1 && CUES[0].kind === 'pop',
  'mascotCues offered ' + CUES.length + ' cue(s) — ' + CUES.map(c => c.kind).join(', ')
  + ' — and it is taken: the module puts the pop on the pill rather than on the first dot');
check(Math.abs(CUES[0].t - (BUB.in + BUBBLE.step * 2)) < 1e-6,
  'and it lands on the pill at ' + CUES[0].t.toFixed(3) + 's');
{
  const late = cues.filter(c => c.t > GLB_AT + 1e-6);
  check(late.length === 0, 'nothing is heard after the last fault: ' + late.length + ' cues past '
    + GLB_AT.toFixed(2) + 's');
  const music = cues.filter(c => c.kind === 'hum');
  check(music.length === 0, 'there is no music in it, which is the brief');
}
check(under.over.length === 0,
  'the bus never comes over the read: ' + under.over.length + ' windows over, worst '
  + under.worst.db.toFixed(1) + ' dB at ' + under.worst.at.toFixed(2) + 's, measured over '
  + under.windows + ' windows a word is actually being spoken in');
check(lim.reduction <= MAX_REDUCTION,
  'the limiter took ' + lim.reduction.toFixed(2) + ' dB, allowance is ' + MAX_REDUCTION);
if (lu && lu.ok) {
  check(lu.truePeak <= PEAK_CEILING + 0.15,
    'the mp4\'s true peak is ' + lu.truePeak + ' dBFS against a ' + PEAK_CEILING + ' ceiling');
}

/* ---------- and lib is untouched ---------- */
check(plan.band === null,
  'planMascot was handed no band, because this clip reserves none');
check(Math.abs(plan.thought.pillH - (BUBBLE.size * 1.25 + 2 * BUBBLE.padY + 2 * BUBBLE.stroke)) < 0.01,
  'the cluster is the module\'s own arithmetic end to end: pill ' + plan.thought.pillH
  + ' css tall, lifts ' + plan.thought.lifts.join('/') + ', at ' + plan.thought.angle + ' degrees');

console.log('');
for (const m of note) console.log('  ok    ' + m);
for (const m of fail) console.log('  FAIL  ' + m);
console.log('');
console.log(fail.length ? '  ' + fail.length + ' GUARD(S) FAILED' : '  all ' + note.length + ' guards green');
process.exit(fail.length ? 1 : 0);
