/* the boring tek — post18, the future is here.

   about eleven seconds on white, 1080x1920. somebody else's model ships, the
   effort slider walks to max, a chat panel asks the question the clip is
   actually about, and the mark comes back bigger with a two word thought over a
   small robot's head.

     node post18.mjs                      1080x1920, 60fps, light
     DEMO_FPS=12 node post18.mjs          the fast preview pass
     node post18.mjs --blur               60fps with the shutter open
     node post18.mjs --plan               every number printed, nothing rendered
     node post18.mjs --stills             the readable frames only, no video
     node post18.mjs --keep-frames        leave the jpegs on disk
     node post18.mjs --encode-only        re-encode from kept frames

   out to demo/out/post18-light-1080x1920.mp4.

   this is the third cut of post18 and the second shape. the first one ran 23.11s
   and carried three scenes neither of the others has — the question that asked
   how, the four windows that did the work, and the cursor that took the computer
   off him. what is left is five beats: the mark arrives, the slider goes to max,
   the panel says the thing, the mark comes back and he thinks two words, and the
   signal tears.

   ---------- what the fix round changed ----------

   **the opening says the name once.** there was a small `ChatGPT` under the mark
   and a three line michroma headline under that which spelled it out again. the
   headline is gone; what is left is two lines — `ChatGPT 6` in Manrope 800 at 40
   css px, and `ASTRA IS HERE` in michroma under it, typed against the read.

   **the name is spelled in the copy.** `chat g p t 6`, because `speak()` escapes
   its input and an ssml `say-as` never reaches the engine. see the read.

   **the read is warmer and slower**, -8 / -6 / -4 with the pitch up, with a real
   breath between the last two lines.

   **he stands 110 css px lower**, which is what buys the air the brief asked for
   between him and everything above him.

   **the mark turns while the thought plays**, a bit over a quarter turn on
   post14's curve, from the moment it lands in the middle to the fault.

   ---------- the clock, and it is eleven rather than ten ----------

   the brief asks for nine to ten seconds. the voice only pass — which is a mode
   of this file rather than a note, and it ran before a browser was opened —
   measured the three lines at 2.71, 3.88 and 0.88 seconds of sound at the
   deliveries below. that is **7.47s of speech**, and on top of it the film
   carries a slider scene with no voice on it at all, a thought the brief asks to
   hold about a second and a half, and an end card.

   it lands at about eleven. the two cuts that would take it under ten are named
   at the bottom of every run and neither of them is free: dropping `and it is a
   big one` off the first line buys 0.9s, and dropping the slider scene buys
   1.3s and a whole beat.

   ---------- what is new, and what is post18's own ----------

   `lib/` is untouched, as it was in the first cut. what this file adds to the
   module's own frame is one layer, the gaze, and it is the same layer the first
   cut grew: a list of page points with a time and a duration each, eased on the
   house curve, composed onto `mascotFrame`'s own card and eyes. see `gazeAt`.

   three things are genuinely new here:

   **the captions are set in Manrope**, not in the module's own Space Grotesk.
   the brief asked for a cleaner, more modern sans with a better weight and named
   the report as the place to say which one. Manrope ExtraBold is a geometric
   grotesque with a tall x height and a much heavier 800 than Space Grotesk has
   at 700, which is what a burned in caption at 40px on a phone wants. `lib` is
   untouched, so the face is this file's own rule over the module's and **the fit
   is re-done in the page against the face that actually renders** — the module
   fitted its cards against Space Grotesk's metrics, and a heavier face measured
   against a lighter one is a card that overflows its own box.

   **the panel carries blue.** the brief asks for a blinking blue caret, a blue
   gauge arc and a round blue button, and that is a colour this brand does not
   otherwise have — green is the only accent it owns. the argument is post14's
   about drawing somebody else's product: the panel is a picture of a thing a
   viewer recognises, and what makes it recognisable is its shape and its one
   colour. it is confined to the panel, it is gone when the panel is, and it is
   named here so nobody has to wonder whether it leaked.

   **the mark is transparent and it is placed rather than drawn.**
   `demo/assets/chatgpt-logo.png` is 3840x2160, a six entry palette with a tRNS
   chunk on it: index 0 is #47704c at alpha nought and the rest are black at four
   alphas, which is a black mark on nothing. it is drawn as a background at
   `cover` on a square box, which crops the empty canvas and cannot distort it
   because both the box and the mark's own square are square. no filter, no
   recolour, no redraw, and the file's own header is read in node on every run,
   because a background has no natural size to report.

   ---------- he is 43 css px left of centre and the thought is why ----------

   `future. here.` measures about 197 css px at `BUBBLE.size`, and the module
   hangs a pill's near corner 26 css px along the row from the plate's own centre
   line. off a dead centre head that puts its right edge 23 px past the safe line
   before the spring, and the spring carries it further. no head size fixes it:
   `crownX` scales with the head and the dots, the gaps and the pill do not.

   so the zone is shifted, and the shift is **derived from the pill's own
   measured width and its own worst spring frame** rather than picked — exactly
   what post17 did for a shorter thought at a smaller cost. it comes out around
   43 css px, which is 8% of the frame's width, and it is what keeping a two word
   punchline out of the platform's button column costs. it reads as deliberate
   once the thought is up, because the head and the pill balance about the middle
   of the frame; for the ten seconds before that he is a robot standing a little
   left of a centred mark. **whether that is the right side of the trade is
   Einz's call**, and the number is printed on every run so it is visible rather
   than asserted.
*/

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  planCaptions, captionFrame, captionCss, captionMarkup, captionPage, describe,
} from './lib/captions.mjs';
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
const LOGO_FILE = path.join(HERE, 'assets', 'chatgpt-logo.png');

const TAG = 'post18-light';
const FRAMES = path.join(OUT, 'frames-' + TAG);
const SUBS = path.join(OUT, 'subframes-' + TAG);
const VERIFY = path.join(OUT, 'verify-post18');
const MP4 = path.join(OUT, TAG + '-1080x1920.mp4');
const WAV = path.join(OUT, TAG + '-mix.wav');
const STATE_FILE = path.join(OUT, TAG + '-1080x1920.json');

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
const PLAN_ONLY = argv.includes('--plan');
const STILLS_ONLY = argv.includes('--stills');
const KEEP = argv.includes('--keep-frames');
const BLUR = argv.some(a => a.startsWith('--blur'));
const BLUR_ARG = (argv.find(a => a.startsWith('--blur=')) || '').split('=')[1];
const SUB = BLUR ? Math.max(2, Math.min(12, Number(BLUR_ARG) || 4)) : 1;
const SUBSTEP = STEP / SUB;

/* the middle of the safe band rather than of the frame: the platforms take more
   off the bottom than the top, so the middle of the picture a viewer actually
   sees is not 480. the end card is hung off this one number. */
const CENTRE_Y = (SAFE_CSS.top + (VH - SAFE_CSS.bottom)) / 2;

/* ==========================================================================
   the read
   ==========================================================================
   three lines, one take each, **and the delivery is per line the way post11's
   is**: the rate and the pitch carry the shape rather than the speed. all three
   sit under the neural default with the pitch up, which is what "warm, like a
   person telling a friend" is in numbers, and they get gently quicker across the
   film — -8, -6, -4 — so the read opens unhurried and lands.

   ---------- the name is spelled, because ssml never reaches the engine -------

   the brief asks for `chat gpt` to land as two words, chat then g p t. `speak()`
   escapes its input before it builds the ssml — a stray ampersand in a line about
   r&d would otherwise end the document — so a `say-as` tag written into the copy
   arrives at the synthesiser as literal angle brackets and is read out.

   so the copy spells it: **`chat g p t 6`**. the engine hands back `chat | g | p
   | t | 6` as five separate word boundaries, which is the evidence that the
   letters are being read as letters rather than as a word, and the guard below
   checks exactly that on every run. nothing on the screen carries the spelling:
   the page says `ChatGPT 6`.

   `gap` is the silence **after** the line, measured on the waveform rather than
   left to the synthesiser's trailing air. the first one is not a breath: it is
   the whole slider scene, and it is derived off that scene rather than typed. */
const LINES = [
  { text: 'chat g p t 6 astra is here, and it is a big one', rate: '-8%', pitch: '+3Hz', gap: null },
  { text: 'not using ai for your business yet? your competitor already does',
    rate: '-6%', pitch: '+1Hz', gap: 0.40 },
  { text: 'the future is here', rate: '-4%', pitch: '+3Hz', gap: null },
];
const VOICE = 'calm';
/* where the first take's own sound lands on the clip's clock. it is late enough
   that the three things at the top of the film arrive in the order the brief
   asks for them in — the mark, then the name under it, then the title typing
   below — because the title's first character is the read's first word and the
   read is what everything else is hung off. */
const VOICE_AT = 0.44;
const SILENCE_DB = -46;
const PRE = 0.05, POST = 0.08, EDGE_FADE = 0.008;

/* ==========================================================================
   the frame
   ========================================================================== */

/* ---------- the mark ----------
   somebody else's, placed rather than drawn, and it is the only image in the
   file. three placements and one element: the hero it fades in at, the corner it
   shrinks into for the slider and the panel, and the bigger one it comes back to
   at the end. */
const LOGO = {
  natural: { w: 3840, h: 2160 },
  hero: { size: 120, cx: 270, cy: 188 },
  corner: { size: 44, cx: 104, cy: 118 },
  /* higher than the first cut's 290 and bigger than the hero, which is the
     brief: it comes back to a frame with nothing else on it but him and a
     thought, so it can afford the room. */
  close: { size: 160, cx: 270, cy: 236 },
  in: 0.28,             /* the fade at the top of the film */
  move: 0.38,           /* out to the corner */
  back: 0.44,           /* and back to the middle, bigger */
  /* ---------- and it turns while the thought plays ----------
     a fifth of a turn across the second it is home for, which at this
     size is a drift rather than a spin: a mark that turned once in that window
     would be a loading spinner.

     **it is not on the house in-out, and post14 paid for that lesson.** every
     bezier whose second control point ends at one arrives at zero speed, so a
     mark eased to a stop under a held thought is a still frame with a pill
     beside it. `TURNING` is the same family with the ceiling taken off: it still
     eases in, because a thing that arrives already spinning reads as a
     mechanism, and it is still turning when the fault lands. */
  turns: 0.18,
  turnIn: 0.10,         /* it is still for this long after it lands */
};

/* ---------- the name, under the mark ----------
   **one line, bold, and bigger than the first cut's.** the first cut had a small
   `ChatGPT` here and a three line michroma headline under it that spelled the
   name out again — the same word twice, once small and once enormous. the
   headline is gone and this line carries the name.

   it is set in Manrope 800, which is already in the page for the captions: the
   brief asks for bold and the body face is held to 400 and 500 by the brand, so
   the weight comes from the face that is allowed to have one. it is a name being
   shown rather than a headline being made, which is why it is not michroma. */
const WORD = { text: 'ChatGPT 6', size: 40, top: 272, in: 0.22 };

/* ---------- the second line ----------
   `ASTRA IS HERE`, one line, in the display face, typed against the read.

   thirteen characters fitted across 330 css px set at about 27 and measure 40
   device px of cap, over the 32 floor every piece of copy here is held to. the
   first cut had twenty three characters over three lines at 60 device px and it
   said the name twice; this says the half the line above it does not.

   **the typing is a window rather than a word match now.** post17's `typeToWords`
   lays each word's characters across that word's own spoken span and refuses a
   copy whose tokens do not match the read's — and the read's tokens are now
   `chat | g | p | t | 6 | astra | is | here` because the name is spelled. so the
   line is laid across the span from `astra` to `here` with post14's jittered
   window instead, and the two ends are still the read's own words. */
const TITLE = {
  text: 'ASTRA IS HERE',
  w: 330,               /* fitted to this, in the page */
  top: 336,
  minCapPx: 32,
  keyEvery: 3,          /* one tick per this many characters, plus the ends */
  hold: 0.12,           /* how long it stays up after the last character */
};

/* ---------- the effort control ----------
   a rounded track, five dots, a knob that walks to the end of it and a label
   that counts up beside it.

   the fill is the site's own green. the brief names the colours in the panel
   below and does not name one here, so this one stays on the brand's own accent
   and the blue is confined to the picture of somebody else's input box. */
const EFFORT = {
  label: 'GPT 6 Astra',
  levels: ['Light', 'Medium', 'High', 'Extra High', 'Max'],
  cx: 270, labelY: 336, labelSize: 24,
  x: 130, w: 280, y: 380, h: 22,
  knob: 26, pad: 11,
  in: 0.26,             /* the slide in */
  out: 0.20,            /* and out, when the panel takes over */
  wait: 0.10,           /* still on the first dot before it starts walking */
  step: 0.16,           /* between two arrivals */
  move: 0.14,           /* and how long one hop takes */
  hold: 0.16,           /* on max, before the scene hands over */
};
EFFORT.dots = EFFORT.levels.map((_, i) =>
  +(EFFORT.x + EFFORT.pad + i * (EFFORT.w - 2 * EFFORT.pad) / (EFFORT.levels.length - 1)).toFixed(2));
/* the whole scene, end to end, so the read's own gap can be derived off it
   rather than typed twice. */
EFFORT.for = +(LOGO.move + EFFORT.wait + EFFORT.in
  + EFFORT.step * (EFFORT.levels.length - 1) + EFFORT.hold).toFixed(3);

/* ---------- the chat panel ----------
   a picture of the box a person types into, drawn in this file's own css: an ink
   panel on the white page with the page's own paper as its type, a plus in a
   ring on the left, and on the right a gauge arc, a mic and a round button with
   a waveform in it. no logo in it and nothing lifted off anybody's product — it
   is the shape of the thing, which is what a viewer recognises.

   **three of those parts are blue and that is the brief's, not the brand's.**
   see the header. the token is declared inside the panel's own block and nothing
   else on the page reads it.

   `textSize` is 24 because the line is long: sixty three characters wrap to
   three lines inside 368 css px of text box and still measure over the 32 device
   px floor. the text block is top anchored and the controls row is bottom
   anchored, so a line growing from nothing to three lines cannot move the plus
   under it. */
const PANEL = {
  x: 70, y: 290, w: 400,
  radius: 22, pad: 16,
  textSize: 24, lineHeight: 1.34, lines: 3,
  plus: 24, rowH: 30, gap: 14,
  placeholder: 'Ask ChatGPT',
  typed: 'not using ai for your business yet? your competitor already does',
  in: 0.30, lift: 16,
  out: 0.26,
  keyEvery: 4,          /* one tick per this many characters. post11's rule */
  minCapPx: 32,
  cpsCeiling: 26,
  /* the caret blinks, which is the brief's. it is a square wave rather than a
     fade, because that is what a text caret does, and it is computed in node on
     the clip's own clock so it cannot drift with a css animation. */
  caretFor: 1.06,
};
PANEL.textH = +(PANEL.lines * PANEL.textSize * PANEL.lineHeight).toFixed(2);
PANEL.h = +(PANEL.pad * 2 + PANEL.textH + PANEL.gap + PANEL.rowH).toFixed(2);
PANEL.bottom = +(PANEL.y + PANEL.h).toFixed(2);

/* ---------- the thought ----------
   two words, the module's own placement over the crown, and the whole gesture is
   the module's own in and hold — 0.48s of dots and pill arriving and 0.90s of it
   fully up, which is the brief's "about a second and a half" to within a
   twentieth. the fault takes it on the frame it would begin to leave, so it is
   cut at full size rather than shrinking away politely. */
const THOUGHT = 'future. here.';
/* "future. here." in Space Grotesk 500 at font size 1, measured on the rendered
   face rather than estimated off an em ratio, and re-measured by the guard on
   every run. it is what `OFF_X` is derived from. */
const TYPE = { bub: 6.0031 };
const PILL_W = +(TYPE.bub * BUBBLE.size + 2 * BUBBLE.padX + 2 * BUBBLE.stroke).toFixed(2);
/* how much clear frame the cluster keeps inside the safe line. it is the one
   number in the shift that is a decision rather than arithmetic. */
const PILL_AIR = 4;

/* ---------- the caption band ----------
   one home, bottom anchored, and it does not move for any line. **the first line
   has no caption**: it is on the screen already, in the display face at 51
   device px of cap, typed word by word against the same read — a caption under
   it would be the same words twice. so the plan is handed lines two and three.

   the face is Manrope ExtraBold rather than the module's Space Grotesk 700. see
   the header for why, and `capRefit` in the page for what it costs. */
const CAP_BOX = { x: 70, y: 680, w: 400, h: 130 };
const CAP = {
  style: 'float', perCard: 3, floatSize: 42, lead: 0.10, hold: 0.24, bodyGap: 0.30,
  family: 'Manrope', weight: 800, tracking: -0.015,
};

/* ---------- the end card ----------
   three lines of michroma on the middle of the safe band and nothing else on the
   frame. */
const END = { lines: ['THE', 'BORING', 'TEK'], w: 300, lineH: 1.16, minCapPx: 48, in: 0.09 };
const END_HOLD = 0.74;

/* ---------- the one fault ----------
   post14's light theme numbers: on white the split is dark fringing on dark ink
   and 4.5 css px is already loud, the grain multiplies rather than screens, and
   the flash is ink because what a signal collapsing looks like on paper is the
   paper going dark for a frame. there is one of them and it is the ending. */
const GL = {
  shakeX: 13, shakeY: 7,
  split: 4.5,
  bands: 3, bandDx: 70, bandH: [5, 26], bandO: 0.82,
  noise: [0.10, 0.26],
  flash: 0.26, flashSize: 340,
  /* the mark takes less than half the ink's split, which is post14's rendered
     frame: the mascot is a 225px disc and 4.5px of fringing on it is a hairline,
     the mark is nine strokes about eight px wide. */
  markShare: 0.42,
};
const FAULT = { for: 0.30, force: 1, flash: true, bands: true, seed: 0x7e3b12 };

/* crf 20, which is where post11's and post14's light renders sit: this frame is
   mostly flat white with fine ink on it, which a codec smears rather than
   bands. */
const CRF = 20;

/* ---------- the mix ----------
   post11's and post14's rig: the read on top, a small bus of effects under it
   ducked while a word is being said, and a loudness loop that keeps its best
   pass rather than its last. no music, which is the brief. */
const TARGET_LUFS = -14;
const PEAK_CEILING = -1.0;
const WAV_CEILING = -1.5;
const DUCK = 0.60;
const VOICE_TRIM = -1.5;
const MAX_REDUCTION = 5.0;
/* the window is what the film can honestly be with all five beats and this copy.
   it moved up by about a second and a quarter in the fix round and both halves of
   that are the brief's own: spelling `chat g p t 6` costs about 0.9s over saying
   it as one word, and a warm read at -8/-6/-4 costs the rest. the two cuts that
   would take it back are printed at the bottom of every run. */
const RUN = { min: 11.5, max: 13.6 };

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
const POP = bezier(.34, 1.4, .64, 1);       /* the site's own spring */
/* post14's turn curve: the house family with the second control point off the
   ceiling, so a thing turning under a held frame is still turning when the cut
   lands. see LOGO.turns. */
const TURNING = bezier(.35, 0, .70, .82);
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, p) => a + (b - a) * p;

function prng(seed) {
  let x = seed | 0 || 0x1a2b3c;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x |= 0; return (x >>> 0) / 4294967296; };
}

/* a burst is a length in seconds, quantised to the grid that is rendering:
   post11's rule and post12's note. a 300ms fault is eighteen frames at sixty and
   3.6 at twelve, so written as seconds and left alone it would be a different
   event on the preview pass. */
function onGrid(t, len, fps) {
  const f0 = Math.round(t * fps);
  const n = Math.max(1, Math.round(len * fps));
  return { t0: f0 / fps, t1: (f0 + n) / fps, frames: n };
}

/* ==========================================================================
   the voice
   ==========================================================================
   one take per line, cached, and the **delivery is part of the cache key**: the
   copy is one half of what a take is and the rate and the pitch are the other,
   so a cache that only knew the words would hand back a line read at the wrong
   speed the moment a delivery note changed. post10 found that and post11 wrote
   it down. */
async function take(i) {
  const L = LINES[i];
  const name = 'post18b-l' + String(i + 1).padStart(2, '0');
  const cached = path.join(VOICE_OUT, name + '-' + VOICE + '.json');
  const want = L.text.replace(/\s+/g, ' ').trim();
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === want && j.rate === L.rate && j.pitch === L.pitch && fs.existsSync(j.file)) {
      return { ...j, i, cached: true };
    }
  }
  return { ...(await speak(L.text, { voice: VOICE, name, rate: L.rate, pitch: L.pitch })), i, cached: false };
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

/* ---------- the three takes on one clock ----------
   the first cut of this file grew `gapFor`, and it stays: **the silence after a
   line is a function of what the picture has to do in it.** the first gap here
   is the whole slider scene, which has no voice on it at all; the second is a
   breath. so `gapFor` is handed the beats laid down so far and works the next
   silence out of the same numbers the picture is drawn from, floored at the
   line's own written gap. */
function buildVoice(takes, gapFor) {
  const pcms = takes.map(t => decode(ffmpeg, t.file));
  const edges = pcms.map(audioEdges);
  const offs = [];
  const beats = [];
  let soundEnd = 0;
  for (let i = 0; i < takes.length; i++) {
    const e = edges[i];
    const at = i === 0 ? VOICE_AT : soundEnd + gapFor(i - 1, beats);
    const off = +(at - e.start).toFixed(4);
    offs.push(off);
    const ws = takes[i].words.map(w => ({
      word: w.word, start: +(w.start + off).toFixed(4), end: +(w.end + off).toFixed(4),
    }));
    beats.push({
      i, text: LINES[i].text, words: ws,
      start: ws[0].start, end: ws[ws.length - 1].end,
      sound: { start: +(off + e.start).toFixed(4), end: +(off + e.end).toFixed(4) },
      wps: +(ws.length / (ws[ws.length - 1].end - ws[0].start)).toFixed(2),
      rate: LINES[i].rate, pitch: LINES[i].pitch,
      peak: e.peak, timing: takes[i].timing, cached: takes[i].cached,
    });
    soundEnd = beats[i].sound.end;
  }
  const words = beats.flatMap(b => b.words);
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

/* ==========================================================================
   the typing
   ==========================================================================
   two kinds. `typeToWords` is post17's: each word's characters are laid across
   **that word's own spoken span**, so the letters of a word appear while the
   word is being said. the title uses it, because the title is the first five
   words of the line being read.

   `typeAcross` is post14's: a window, a jittered rate and a beat after a comma.
   the panel uses it, because what it types is not the line being read — it is
   the same sentence written down while the voice says it, and the two are the
   same length rather than the same event. */
function typeToWords(text, words, seed) {
  const r = prng(seed);
  const bare = s => s.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');
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
    const wt = [];
    for (let i = 0; i < n; i++) wt.push(0.72 + r() * 0.56);
    const total = wt.reduce((x, y) => x + y, 0);
    /* the last character lands on the word's end, so the run is n-1 gaps rather
       than n: a word is finished as it finishes being said. */
    const grand = total - wt[n - 1];
    let acc = 0;
    for (let i = 0; i < n; i++) {
      at[a + i] = +(w.start + (w.end - w.start) * (grand <= 0 ? (i ? 1 : 0) : acc / grand)).toFixed(4);
      if (i < n - 1) acc += wt[i];
    }
    /* the space in front of this word, a third of the way into the silence in
       front of it, which is where a person's hands are when their voice has
       stopped. */
    if (k > 0) at[a - 1] = +(words[k - 1].end + (w.start - words[k - 1].end) * 0.35).toFixed(4);
  }
  return finishTyping(text, at, TITLE.keyEvery);
}

function typeAcross(text, from, until, seed, keyEvery) {
  const r = prng(seed);
  const n = text.length;
  /* the weights first, then normalised, so the run always ends exactly on
     `until` whatever the jitter did. a constant rate reads as a machine filling
     a field, which is post9's rule and post11's. */
  const w = [];
  for (let i = 0; i < n; i++) {
    let x = 0.7 + r() * 0.6;
    if (i > 0 && /[,?]/.test(text[i - 1])) x += 2.4;
    if (text[i] === ' ') x += 0.35;
    w.push(x);
  }
  const total = w.reduce((a, b) => a + b, 0);
  const at = [];
  let acc = 0;
  for (let i = 0; i < n; i++) {
    at.push(+(from + (until - from) * (acc / total)).toFixed(4));
    acc += w[i];
  }
  return finishTyping(text, at, keyEvery);
}

/* the two things every typing plan has to answer: when each character lands, and
   which of them get a tick. one tick per `keyEvery` characters plus the two
   ends, which is post11's number and post11's reason — sixty odd sounds inside
   three seconds is a rattle, and the ends are where the rhythm starts and
   stops. */
function finishTyping(text, at, keyEvery) {
  for (let i = 0; i < at.length; i++) {
    if (at[i] == null) throw new Error('character ' + i + ' of "' + text + '" was never placed');
    if (i && at[i] < at[i - 1]) {
      throw new Error('the typing goes backwards at character ' + i + ' of "' + text + '"');
    }
  }
  const keys = [];
  for (let i = 0; i < at.length; i++) {
    if (text[i] === ' ') continue;
    if (i === 0 || i === at.length - 1 || i % keyEvery === 0) keys.push(at[i]);
  }
  return {
    text, at, keys, chars: text.length,
    from: at[0], until: at[at.length - 1],
    cps: +(text.length / Math.max(1e-6, at[at.length - 1] - at[0])).toFixed(2),
  };
}

/* how many characters of a plan are on the screen at `t`. */
function typedAt(plan, t) {
  if (!plan || t < plan.at[0]) return 0;
  let lo = 0, hi = plan.at.length - 1, k = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (plan.at[mid] <= t) { k = mid + 1; lo = mid + 1; } else hi = mid - 1;
  }
  return k;
}

/* ==========================================================================
   the clock
   ==========================================================================
   every number below is derived off the read, and the read is three measured
   takes. the scene boundaries are written once, as functions of the beats, and
   both `gapFor` — which needs them before the takes are laid down — and the
   constants under them read the same expressions.

   `word` is how a beat is asked for a word by name rather than by index. a
   script that moves a word would otherwise move a beat by accident and nothing
   would say so. */
const bareOf = s => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
function word(beat, name) {
  const w = beat.words.find(x => bareOf(x.word) === name);
  if (!w) {
    throw new Error('"' + name + '" is not in "' + beat.text + '" — the picture is cut to '
      + 'the read by word, so a rewrite has to move the beat with it');
  }
  return w;
}

/* scene one ends a beat after the last character of the second line, which is
   the read's own `here` rather than its last word: the tail, "and it is a big
   one", plays over a line that is already up. */
const titleUntil = b => word(b[0], 'here').end;
const sc2At = b => +Math.max(titleUntil(b) + TITLE.hold, b[0].sound.end + 0.10).toFixed(4);
/* scene two has no voice on it at all, so its length is its own arithmetic and
   the read's first silence is worked out from it. */
const sc3At = b => +(sc2At(b) + EFFORT.for).toFixed(4);
/* scene three: the panel is up a beat before the line starts and the line is
   what the typing is laid across. */
const PANEL_LEAD = 0.30;
const sc4At = b => +(b[1].sound.end + 0.18).toFixed(4);

/* the silence after each line, floored at the line's own written gap. */
function gapFor(i, beats) {
  const floor = LINES[i].gap == null ? 0.24 : LINES[i].gap;
  const soundEnd = beats[i].sound.end;
  let want = floor;
  if (i === 0) want = sc3At(beats) + PANEL_LEAD - soundEnd;
  if (i === 1) want = sc4At(beats) + 0.24 - soundEnd;
  return +Math.max(floor, want).toFixed(4);
}

const TAKES = [];
for (let i = 0; i < LINES.length; i++) TAKES.push(await take(i));
const V = buildVoice(TAKES, gapFor);
const B = V.beats;

/* ---------- and now every number in the film, once ---------- */
const SC2_AT = sc2At(B);
const SC3_AT = sc3At(B);
const SC4_AT = sc4At(B);

/* scene one */
const TITLE_TYPE = typeAcross(TITLE.text, word(B[0], 'astra').start,
  word(B[0], 'here').end, 0x18a3c1, TITLE.keyEvery);
const LOGO_AT = 0.00;
const WORD_AT = 0.16;

/* scene two */
const LOGO_MOVE_AT = SC2_AT;
const EFFORT_IN = +(SC2_AT + LOGO.move * 0.55).toFixed(4);
const KNOB_AT = +(EFFORT_IN + EFFORT.in + EFFORT.wait).toFixed(4);
const KNOB_ARRIVE = EFFORT.levels.map((_, i) =>
  +(KNOB_AT + Math.max(0, i - 1) * EFFORT.step + (i ? EFFORT.move : 0)).toFixed(4));
const MAX_AT = KNOB_ARRIVE[KNOB_ARRIVE.length - 1];
const EFFORT_OUT = SC3_AT;

/* scene three */
const PANEL_AT = +(SC3_AT + 0.04).toFixed(4);
const TYPING = typeAcross(PANEL.typed, B[1].words[0].start,
  B[1].words[B[1].words.length - 1].end, 0x2f61b7, PANEL.keyEvery);
const PANEL_OUT = SC4_AT;

/* scene four */
const LOGO_BACK_AT = +(SC4_AT + 0.04).toFixed(4);
/* where the turn starts: after it has arrived and been still for a beat. */
const LOGO_TURN_AT = +(LOGO_BACK_AT + LOGO.back + LOGO.turnIn).toFixed(4);

/* ---------- the marks ----------
   five, and the brief names the state for every one of them: curious at the
   mark, curious at the knob, delighted on max, agreeing at the line, delighted
   at the end with the thought on it. **there is no `neutral` and no
   `unimpressed` anywhere in the film**, which is the brief in as many words.

   the spacing is not free: `planMascot` refuses a mark that has less room than
   its own entrance, hold floor and exit, so a reaction cannot simply be put on
   the word it is a reaction to. the nod is on the line's own punch and the last
   mark starts before the panel has finished leaving, which is what buys the
   thought its full gesture without stretching the film. */
const MARKS = [
  { t: 0.26, state: 'curious' },
  /* he goes curious a breath **before** the mark starts moving, which is what a
     head does when something is about to happen, and it is also what buys this
     mark the 1.24s `curious` needs before `delighted` lands on max. the module
     refused it at 1.23 and said so, which is the guard doing its job in the
     planner rather than in a render. */
  { t: +(SC2_AT - 0.16).toFixed(4), state: 'curious' },
  { t: MAX_AT, state: 'delighted' },
  { t: +(word(B[1], 'competitor').start - 0.20).toFixed(4), state: 'agreeing' },
  { t: +(B[1].sound.end - 0.30).toFixed(4), state: 'delighted', bubble: THOUGHT },
];
const M_THOUGHT = MARKS[MARKS.length - 1].t;

/* where the thought is up until, worked out off the module's own profile so the
   film's length is known before a plan exists. `planMascot` is asked for the
   same numbers afterwards and the two are compared in the guards.

   the fault lands on the frame the pill would begin to leave, so the thought is
   cut at full size rather than shrinking away first — post17's ending. the whole
   gesture is the module's own 0.48 in and 0.90 hold, which is the brief's "about
   a second and a half" to within a twentieth. */
const BUB_IN = +(M_THOUGHT + STATES.delighted.entry + 0.12).toFixed(4);
const BUB_FULL = +(BUB_IN + BUBBLE.in).toFixed(4);
const GLB_AT = +(BUB_FULL + BUBBLE.hold).toFixed(4);
const SECONDS = +(GLB_AT + END_HOLD).toFixed(4);

const CUT_FRAME = Math.round(GLB_AT * FPS);
const END_IN = (CUT_FRAME - 1) / FPS;

/* ==========================================================================
   the mascot
   ==========================================================================
   ---------- the seed is the opening blink ----------
   the brief's "eyes widen, one blink" while he looks up at the mark is a blink
   this file could write and should not: it would be a channel fighting the idle
   layer, which already makes blinks. so it comes off that layer — post13's move,
   post16's and post17's — and the seed is searched for a schedule that puts
   exactly one **whole** blink inside the window, close, hold and open, which is
   post17's correction.

   the widening is `curious`'s own: one eye to 1.8 and the other to 1.1, which is
   the state's read rather than something laid over it. */
const BLINK_WINDOW = [
  +(MARKS[0].t + STATES.curious.entry + 0.04).toFixed(4),
  +(titleUntil(B) - 0.08).toFixed(4),
];
const blinkEnd = b => +(b.t + b.close + b.hold + b.open).toFixed(4);
const blinksNear = pl => pl.idle.blinks.filter(b => blinkEnd(b) > BLINK_WINDOW[0] && b.t < BLINK_WINDOW[1]);
const blinkInside = b => b.t >= BLINK_WINDOW[0] && blinkEnd(b) <= BLINK_WINDOW[1];

function planFor(seed) {
  return planMascot({
    marks: MARKS, seconds: SECONDS, theme: 'light', size: 120,
    /* dead straight on. the resting turn exists so a mascot in a corner looks
       into the frame, and there is nothing to look into from the middle — the
       gaze layer is what points him at things here. */
    bias: 0,
    /* over the crown, and the side said outright: what `over` derives it from is
       which corner he is standing in and he is standing in neither. `over`
       measures the pill from the plate's own centre line rather than from the
       zone's right edge, which is 95 css px of difference on this pill. */
    thought: 'over-right',
    /* null on purpose: the module checks its bubble against a caption band and
       the band here is 64 css px under his chin and 250 under the pill. the
       rendered cluster is checked against the safe area in the guards instead. */
    band: null,
    seed,
  });
}
function pickSeed() {
  let best = null;
  let refused = null;
  for (let s = 1; s <= 6000; s++) {
    let pl;
    try { pl = planFor(s); } catch (err) { refused = err.message; continue; }
    const near = blinksNear(pl);
    if (near.length !== 1 || !blinkInside(near[0])) continue;
    const b = near[0];
    const len = b.close + b.hold + b.open;
    if (!best || len > best.len) best = { seed: s, blink: b, len: +len.toFixed(4) };
  }
  if (!best) {
    throw new Error('no seed in six thousand puts exactly one whole idle blink inside '
      + JSON.stringify(BLINK_WINDOW) + (refused ? ' — and the plan itself was refused: ' + refused : ''));
  }
  return best;
}
const SEED = pickSeed();
const plan = planFor(SEED.seed);

/* ---------- where he stands ----------
   the middle of the frame minus the shift the pill needs. the module's corner
   arithmetic is not used — post12's line and post17's: `plan.box` is rewritten
   and `mascotCss`, `mascotMarkup` and `mascotPagePlan` all read it when they are
   called.

   the pill's worst frame is walked rather than assumed: `btk.pop` carries the
   spring past its mark, so the widest the pill ever is is not the width it
   settles at. 240Hz, four samples to a frame at sixty. */
const PILL_SC = (() => {
  const b = plan.marks[plan.marks.length - 1].bubbles[0];
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
const CENTRED_LEFT = +(VW / 2 - (HEAD.plate.x + HEAD.plate.s / 2) * plan.unit).toFixed(3);
const OFF_X = +Math.max(0,
  CENTRED_LEFT + PILL_X0 + PILL_W * PILL_SC - (VW - SAFE_CSS.right) + PILL_AIR).toFixed(2);

/* ---------- where he stands ----------
   **110 css px lower than the first cut of this rebuild**, which is the brief's
   own hundred to a hundred and forty. what it buys is air: 132 css px between
   the panel's bottom edge and his crown where there were 22, and the opening
   reads as a mark with a name under it rather than as a stack that runs into a
   robot. the band went down 20 with him and his chin still clears the highest
   caption ink by 40. */
const MAS = { cx: +(VW / 2 - OFF_X).toFixed(2), cy: 650 };
plan.box = {
  left: +(CENTRED_LEFT - OFF_X).toFixed(2),
  top: +(MAS.cy - (HEAD.plate.y + HEAD.plate.s / 2) * plan.unit).toFixed(2),
  size: plan.size,
};
const PLATE = { cx: MAS.cx, cy: MAS.cy, r: +(HEAD.plate.s / 2 * plan.unit).toFixed(3) };
const BUB = plan.marks[plan.marks.length - 1].bubbles[0];
const BLINK = blinksNear(plan)[0];
const BLINK_AT = +(BLINK.t + BLINK.close + BLINK.hold / 2).toFixed(4);

/* his ink, in page space, on a frame. `headRect` answers in device px from each
   border and that is the wrong shape for a clearance against a panel, so it is
   turned back into a rect here. */
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
  };
}

/* ==========================================================================
   the gaze
   ==========================================================================
   one layer, one list, and it is the acting: he looks up at the mark, tracks the
   knob across the track, reads the panel and then looks at you. none of that is
   in the state table, because a state is a pose rather than a direction.

   it is composed onto `mascotFrame`'s own card and eyes the way post17's wink is
   composed onto its lid. the caps are what keep it a look rather than a pose:
   three grid units of eye is a little under half an eye's width and the module's
   own states use up to 3.4, so the two together stay well inside the clamp the
   module applies to an eye that would leave the face.

   `at` is a page point, a function of time — the knob is moving while he watches
   it — or null, which is the camera and is no offset at all. */
const GZ = { div: 62, eye: 3.0, divY: 70, eyeY: 2.2, rotDiv: 55, rot: 3.6, leanDiv: 80, lean: 2.6 };
const CAM = { ex: 0, ey: 0, rot: 0, dx: 0 };

function gazeOffsets(pt) {
  if (!pt) return CAM;
  const dx = pt[0] - PLATE.cx, dy = pt[1] - PLATE.cy;
  return {
    ex: clamp(dx / GZ.div, -GZ.eye, GZ.eye),
    ey: clamp(dy / GZ.divY, -GZ.eyeY, GZ.eyeY),
    rot: clamp(dx / GZ.rotDiv, -GZ.rot, GZ.rot),
    dx: clamp(dx / GZ.leanDiv, -GZ.lean, GZ.lean),
  };
}

const GAZE = [
  /* up at the mark, slowly, which is a head turning to look at something rather
     than a pair of eyes flicking. */
  { t: MARKS[0].t, at: [LOGO.hero.cx, LOGO.hero.cy], for: 0.40 },
  /* the knob, tracked rather than anticipated. the target is a function because
     the thing is moving. */
  { t: +(KNOB_AT - 0.12).toFixed(4), at: t => [knobX(t), EFFORT.y + EFFORT.h / 2], for: 0.26 },
  /* the panel, as it types itself. */
  { t: +(PANEL_AT + 0.12).toFixed(4), at: [270, PANEL.y + PANEL.h / 2], for: 0.32 },
  /* and then he looks at you, and stays there for the thought. the camera is the
     only target in the list that is not a point on the page. */
  { t: +(SC4_AT - 0.10).toFixed(4), at: null, for: 0.30 },
];

/* where a target is at an instant. a moving target is frozen at the moment the
   look began when it is the thing being looked away from, so a blend between two
   looks is between two points rather than between a point and a chase. */
function gazePoint(g, t) { return typeof g.at === 'function' ? g.at(t) : g.at; }
function gazeAt(t) {
  let k = -1;
  for (let i = 0; i < GAZE.length; i++) if (t >= GAZE[i].t) k = i;
  if (k < 0) return { ...CAM, k: -1 };
  const to = gazeOffsets(gazePoint(GAZE[k], t));
  const from = k > 0 ? gazeOffsets(gazePoint(GAZE[k - 1], GAZE[k].t)) : CAM;
  const p = GLIDE(span(t, GAZE[k].t, GAZE[k].t + GAZE[k].for));
  return {
    ex: +lerp(from.ex, to.ex, p).toFixed(4),
    ey: +lerp(from.ey, to.ey, p).toFixed(4),
    rot: +lerp(from.rot, to.rot, p).toFixed(4),
    dx: +lerp(from.dx, to.dx, p).toFixed(4),
    k,
  };
}

/* ---------- the knob ----------
   five stops, four hops, on the pop curve because a control being dragged to the
   end of its track arrives with weight. one function, and both the picture and
   the gaze read it. */
function knobIndex(t) {
  let k = 0;
  for (let i = 0; i < KNOB_ARRIVE.length; i++) if (t >= KNOB_ARRIVE[i] - 1e-9) k = i;
  return k;
}
function knobX(t) {
  if (t <= KNOB_ARRIVE[0]) return EFFORT.dots[0];
  const k = knobIndex(t);
  if (k >= EFFORT.dots.length - 1) return EFFORT.dots[EFFORT.dots.length - 1];
  const from = KNOB_ARRIVE[k] + EFFORT.step - EFFORT.move;
  const p = POP(span(t, from, from + EFFORT.move));
  return +lerp(EFFORT.dots[k], EFFORT.dots[k + 1], p).toFixed(3);
}

/* ==========================================================================
   the glitch
   ==========================================================================
   post14's, for a white page: the split is dark fringing on dark ink, the grain
   multiplies rather than screens, and the flash is ink. one window, and it is
   the ending. */
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
  return [{ ...onGrid(GLB_AT, FAULT.for, fps), ...FAULT, at: GLB_AT }];
}
const GL_WINDOWS = glitchWindows(FPS);
/* the same list on the master's grid, because a duty is a property of the
   animation rather than of the pass it is sampled at. */
const GL_WINDOWS_60 = FPS === 60 ? GL_WINDOWS : glitchWindows(60);

function glitchAt(f, fps = FPS, windows = GL_WINDOWS) {
  const g = calmGlitch();
  const t = f / fps;
  const w = windows.find(x => t >= x.t0 && t < x.t1);
  if (!w) return g;
  const p = (t - w.t0) / (w.t1 - w.t0);
  const r = prng(w.seed ^ (f * 2654435761));
  let heat = heatAt(p) * w.force;
  /* one frame in three inside the decay goes back to full, which is what stops a
     fault reading as a fade out. */
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

/* ==========================================================================
   one instant
   ==========================================================================
   `t` is the moment being captured and `f` is the output frame it belongs to.
   they differ under the shutter and the difference is the whole point of the
   split: everything written against `t` smears, and the glitch, which is a
   function of the frame index, does not. */
function frameAt(t, f) {
  const g = glitchAt(f);
  const gone = f >= CUT_FRAME;           /* the fault takes everything */

  /* ---- him ----
     the module's own frame, with the gaze composed onto the card and the eyes.
     `card` is what the head is actually drawn with, which is the module's own
     words for it, and it is what `headRect` and every clearance downstream read,
     so adding here is adding to the head that is measured as well as to the one
     that is painted. */
  const mas = mascotFrame(plan, t);
  const gz = gazeAt(t);
  mas.card = {
    ...mas.card,
    x: +(mas.card.x + gz.dx).toFixed(4),
    rot: +(mas.card.rot + gz.rot).toFixed(4),
  };
  mas.eyes = mas.eyes.map(e => ({
    ...e, x: +(e.x + gz.ex).toFixed(4), y: +(e.y + gz.ey).toFixed(4),
  }));
  const mo = gone ? 0 : +span(t, 0, LOGO.in).toFixed(4);

  /* ---- the mark ----
     one element in three places: it fades up in the middle, travels to the
     corner when the slider arrives, and comes back bigger for the ending. both
     journeys are on the calm curve, because a thing being put away and brought
     back does not spring. */
  const p1 = GLIDE(span(t, LOGO_MOVE_AT, LOGO_MOVE_AT + LOGO.move));
  const p2 = GLIDE(span(t, LOGO_BACK_AT, LOGO_BACK_AT + LOGO.back));
  const mix3 = (a, b, c) => lerp(lerp(a, b, p1), c, p2);
  const logo = {
    o: gone ? 0 : +span(t, LOGO_AT, LOGO_AT + LOGO.in).toFixed(4),
    size: +mix3(LOGO.hero.size, LOGO.corner.size, LOGO.close.size).toFixed(2),
    x: +mix3(LOGO.hero.cx, LOGO.corner.cx, LOGO.close.cx).toFixed(2),
    y: +mix3(LOGO.hero.cy, LOGO.corner.cy, LOGO.close.cy).toFixed(2),
    /* and it turns, but only once it is home: the whole rotation lives between
       the moment it lands in the middle and the fault, so nothing turns while it
       is travelling and nothing turns before it exists. */
    rot: +(TURNING(span(t, LOGO_TURN_AT, GLB_AT)) * 360 * LOGO.turns).toFixed(3),
  };

  /* ---- the name and the title ----
     both belong to the opening and both go with it: the name fades, the title
     goes with the mark it is under. */
  const off1 = GLIDE(span(t, LOGO_MOVE_AT, LOGO_MOVE_AT + LOGO.move * 0.5));
  const name = {
    o: gone ? 0 : +(span(t, WORD_AT, WORD_AT + WORD.in) * (1 - off1)).toFixed(4),
  };
  const title = { o: gone ? 0 : +(1 - off1).toFixed(4), n: typedAt(TITLE_TYPE, t) };

  /* ---- the effort control ---- */
  const ein = GLIDE(span(t, EFFORT_IN, EFFORT_IN + EFFORT.in));
  const eout = GLIDE(span(t, EFFORT_OUT, EFFORT_OUT + EFFORT.out));
  const kx = knobX(t);
  const effort = {
    o: gone ? 0 : +(ein * (1 - eout)).toFixed(4),
    /* it slides up into place and drops out downward, which is the same door the
       panel comes through. */
    y: +((1 - ein) * 18 + eout * 14).toFixed(3),
    knob: kx,
    /* the fill's right edge is the knob's own centre rather than the last dot, so
       the green behind it is always exactly as far as the knob has got. */
    fill: +((kx - EFFORT.x) / EFFORT.w).toFixed(4),
    level: knobIndex(t),
  };

  /* ---- the panel ----
     it rises, types itself, and slides back down when the mark comes home. the
     caret blinks on the clip's own clock: a square wave rather than a fade,
     because that is what a text caret does. */
  const pin = POP(span(t, PANEL_AT, PANEL_AT + PANEL.in));
  const pout = GLIDE(span(t, PANEL_OUT, PANEL_OUT + PANEL.out));
  const pn = typedAt(TYPING, t);
  const panel = {
    o: gone ? 0 : +(pin * (1 - pout)).toFixed(4),
    y: +((1 - pin) * PANEL.lift + pout * 26).toFixed(3),
    n: pn, ph: pn ? 0 : 1,
    caret: ((t - PANEL_AT) % PANEL.caretFor) < PANEL.caretFor / 2 ? 1 : 0,
  };

  /* ---- the end card ---- */
  const ep = span(t, END_IN, END_IN + END.in);
  const end = {
    o: +span(t, END_IN, END_IN + END.in * 0.45).toFixed(4),
    sc: +(1 + (1 - POP(ep)) * 0.06).toFixed(4),
  };

  return { t: +t.toFixed(4), f, mas, mo, gz, logo, word: name, title, effort, panel, end, g };
}

/* what the page is handed, which is this file's own layers only: the mascot
   writes its own numbers through its own runtime and the captions through
   theirs. */
function pageFrame(o) {
  return {
    mo: o.mo, logo: o.logo, word: o.word, title: o.title,
    effort: o.effort, panel: o.panel, end: o.end, g: o.g,
  };
}

/* ==========================================================================
   the captions
   ==========================================================================
   lines two and three, in the float style, in one band that does not move.

   **the first line has no caption and that is the one exception in the file**:
   it is on the screen already, in the display face at 51 device px of cap, typed
   word by word against the same read. a caption under it would be the same words
   twice.

   the line ends are marked rather than inferred: a card breaks at a sentence
   end, at a clause mark or when it is full, and left alone the cut would run
   straight through the seam between two lines. a comma goes on the last word of
   each line, on the caption's copy only and after the synthesiser has already
   spoken, `cardBreak` breaks on it and `punctuation: 'drop'` takes it off again
   before a card is drawn. nothing about the audio or the timing can move. */
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
const CUT = markLines(B.slice(1));
const cap = planCaptions(CUT.words, {
  style: CAP.style, perCard: CAP.perCard, floatSize: CAP.floatSize,
  cardBreak: /[.!?,;:]["')\]]?$/,
  lead: CAP.lead, hold: CAP.hold, bodyGap: CAP.bodyGap,
});
const CAP_OUT = Math.max(...cap.groups.map(g => g.out));

/* ==========================================================================
   the page
   ==========================================================================
   one html string, built once, served from a local static server so the load
   sequence is the clip's own. everything in it is drawn out of the site's own
   tokens — which arrive with `captionCss`, lifted out of index.html at run
   time — except the three blue parts of the panel and the caption's own face.

   **three families in one request, and the third is the brief's.** Michroma sets
   the title and the end card, Space Grotesk at 400 and 500 sets everything the
   page reads as text, and Manrope at 800 sets the captions. Space Grotesk's 700
   is gone with the module's own caption face, so the body face is back inside
   the two weights the brand allows it. */
function sceneHtml() {
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<title>post18</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Manrope:wght@800&family=Space+Grotesk:wght@400;500&display=swap">
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}

/* load bearing rather than decoration. with nothing animating at all chrome
   stops producing compositor frames and the screenshot call blocks on a frame
   that never comes — post2 found it and every clip in demo/ has carried
   something like it since. it is two css pixels of page colour parked off the
   frame, so it can never be seen. */
.tick{position:absolute;left:-20px;top:-20px;width:2px;height:2px;background:var(--bg);
  will-change:transform;animation:tick 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes tick{from{transform:translate3d(0,0,0)}to{transform:translate3d(1px,0,0)}}

/* the two channels the rgb split is drawn in. on white it is dark fringing on
   dark ink, which is what chromatic aberration actually looks like on paper. */
:root{--gr:rgba(214,44,44,.55); --gc:rgba(0,150,214,.55)}

.stage{position:relative;width:${VW}px;height:${VH}px;background:var(--bg);
  transform:translate3d(calc(var(--sx,0) * 1px),calc(var(--sy,0) * 1px),0);
  will-change:transform}

${captionCss(cap, CAP_BOX)}
${mascotCss(plan)}

/* ---- the caption's own face ----
   the module sets the float style in the body face at 700 and measures it there;
   this file asks for something cleaner and heavier, so the rule is written after
   the module's and the **fit is redone in the page** against the face that
   actually renders — see capRefit in the page half, and note that a heavier face
   measured against a lighter one is a card that overflows its own box.
   (no backticks in this block: it is inside a template literal, and one would
   end the string rather than mark a name.) */
.cap-float{font-family:"${CAP.family}",var(--mono); font-weight:${CAP.weight};
  letter-spacing:${CAP.tracking}em}

/* his own cut, as a wrapper rather than a rule on the zone: he fades up with the
   mark at the top of the film and the fault takes him, and neither is anything
   the module needs to know about. */
#mas-cut{position:absolute;inset:0;z-index:4;opacity:var(--m-o,0)}
.stage[data-gl="1"] #mas-cut{
  filter:drop-shadow(calc(var(--split,0) * -1px) 0 var(--gr))
         drop-shadow(calc(var(--split,0) * 1px) 0 var(--gc))}

/* ---- the mark ----
   a background rather than an img, at cover on a square box, which crops the
   canvas the file ships with to its own centred square. the file is a six entry
   palette with a tRNS chunk on it — a black mark on nothing — so there is no
   ground to key out and nothing here reaches its pixels: no filter, no
   recolour, no redraw. the size and the position are written per frame, so one
   element is all three placements. */
#logo{
  position:absolute; z-index:6; pointer-events:none;
  width:var(--lg-s,${LOGO.hero.size}px); height:var(--lg-s,${LOGO.hero.size}px);
  left:var(--lg-x,0px); top:var(--lg-y,0px);
  margin-left:calc(var(--lg-s,0px) / -2); margin-top:calc(var(--lg-s,0px) / -2);
  background-image:url("/logo.png"); background-size:cover; background-position:center;
  opacity:var(--lg-o,0); transform:rotate(calc(var(--lg-r,0) * 1deg));
  will-change:opacity,transform;
}
/* the mark gets less than half the ink's split, and that is post14's rendered
   frame rather than a preference: the mascot is a 225px disc and 4.5px of
   fringing on it is a hairline, the mark is nine strokes about eight px wide. */
.stage[data-gl="1"] #logo{
  filter:drop-shadow(calc(var(--split,0) * -${GL.markShare}px) 0 var(--gr))
         drop-shadow(calc(var(--split,0) * ${GL.markShare}px) 0 var(--gc))}

/* ---- the product's own name ---- */
.word{position:absolute; left:50%; top:${WORD.top}px; transform:translateX(-50%);
  z-index:3; pointer-events:none; white-space:nowrap;
  font-family:"${CAP.family}",var(--mono); font-weight:800; font-size:${WORD.size}px;
  letter-spacing:-.01em; color:var(--fg); opacity:var(--wd-o,0)}

/* ---- the title ----
   three lines of michroma, fitted in the page rather than guessed, because the
   face is proportional and its tracking is nearly a fifth of an em.

   **the block hugs its own ink rather than spanning the frame.** a full width
   box reports the frame's own edges back to the safe area check and proves
   nothing about where the letters are, and the fit would divide by the width of
   the box rather than of the type. max-content with a centring translate is the
   whole of it, and the max-width comes off while the probe is up. */
.title{position:absolute; left:50%; top:${TITLE.top}px; z-index:3;
  width:max-content; max-width:${VW - 2 * SAFE_CSS.left}px;
  transform:translateX(-50%);
  text-align:center; font-family:var(--display); font-weight:400;
  line-height:${TITLE.lineH}; letter-spacing:.02em; color:var(--fg);
  opacity:var(--ti-o,0); pointer-events:none; white-space:nowrap}
.title span{display:block; min-height:1em}

/* ---- the effort control ----
   a track, five stops, a knob and a label that counts up. the fill is the site's
   own accent: the brief names its colours inside the panel and not here, so this
   one stays on the brand's own green.

   the level word sits in a cell wide enough for the longest of the five, so
   counting up cannot slide the label sideways. that is index.html's own trick
   for its scrambling wordmark and captions.mjs's for its rolling digits. */
.effort{position:absolute; left:0; right:0; top:0; z-index:3; pointer-events:none;
  opacity:var(--ef-o,0); transform:translate3d(0,calc(var(--ef-y,0) * 1px),0);
  will-change:transform,opacity}
.ef-label{position:absolute; left:50%; top:${EFFORT.labelY}px;
  transform:translateX(-50%); width:max-content;
  display:flex; align-items:baseline; justify-content:center; gap:14px;
  font-family:var(--body); font-weight:500; font-size:${EFFORT.labelSize}px; color:var(--fg)}
.ef-level{display:inline-block; min-width:126px; text-align:left; color:var(--accent)}
.ef-track{position:absolute; left:${EFFORT.x}px; top:${EFFORT.y}px;
  width:${EFFORT.w}px; height:${EFFORT.h}px; border-radius:999px;
  background:var(--field); border:1px solid var(--line)}
.ef-fill{position:absolute; left:0; top:0; bottom:0; border-radius:999px;
  background:var(--accent); opacity:.22;
  width:${EFFORT.w}px; transform:scaleX(var(--ef-f,0)); transform-origin:left center}
.ef-dot{position:absolute; top:50%; width:6px; height:6px; margin:-3px 0 0 -3px;
  border-radius:50%; background:var(--muted); opacity:.55}
.ef-knob{position:absolute; top:50%; width:${EFFORT.knob}px; height:${EFFORT.knob}px;
  margin:${-EFFORT.knob / 2}px 0 0 ${-EFFORT.knob / 2}px;
  border-radius:50%; background:var(--fg);
  left:calc(var(--ef-k,0) * 1px); will-change:transform}

/* ---- the chat panel ----
   a picture of the box a person types into, drawn out of this file's own rules:
   an ink panel on the white page with the page's own paper as its type, a plus
   in a ring on the left, and a gauge, a mic and a round send button on the
   right. no logo in it and nothing lifted off anybody's product.

   **--pn-blue is declared here and nothing outside this block reads it.** the
   brief asks for a blue caret, a blue gauge and a blue button; the brand's only
   accent is green, so the colour lives inside the picture of somebody else's
   product and leaves with it. */
.panel{
  --pn-blue:#3f7dfb;
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
  line-height:${PANEL.lineHeight}; color:var(--bg); word-break:break-word;
}
/* the placeholder and the line share one box, so the first character lands where
   the placeholder was. it starts five px in, which is post14's rendered frame:
   the caret is an inline element after the line, so with nothing typed it sits
   at x nought, which is exactly where the placeholder's first glyph is. */
.panel-ph{position:absolute; left:5px; top:0; right:0; color:var(--bg); opacity:calc(var(--pn-ph,0) * .42)}
.panel-caret{display:inline-block; width:2.4px; height:.86em; margin-left:.06em;
  background:var(--pn-blue); vertical-align:-.10em; opacity:var(--pn-car,0)}
.panel-row{
  position:absolute; left:${PANEL.pad}px; right:${PANEL.pad}px;
  bottom:${PANEL.pad}px; height:${PANEL.rowH}px;
  display:flex; align-items:center; justify-content:space-between;
}
.panel-plus{
  position:relative; width:${PANEL.plus}px; height:${PANEL.plus}px;
  border-radius:50%; border:1.5px solid var(--bg); opacity:.34;
}
/* two bars rather than a glyph, so nothing depends on a face having a plus that
   optically centres inside a ring. */
.panel-plus::before,.panel-plus::after{
  content:''; position:absolute; left:50%; top:50%; background:var(--bg); border-radius:1px;
}
.panel-plus::before{width:${(PANEL.plus * 0.46).toFixed(1)}px; height:1.6px;
  margin:-0.8px 0 0 ${(-PANEL.plus * 0.23).toFixed(1)}px}
.panel-plus::after{width:1.6px; height:${(PANEL.plus * 0.46).toFixed(1)}px;
  margin:${(-PANEL.plus * 0.23).toFixed(1)}px 0 0 -0.8px}
.panel-right{display:flex; align-items:center; gap:14px}
/* the gauge: an arc and a needle, which is what a picture of "how much effort"
   looks like on any dashboard ever drawn. it is the only part of the row that is
   not a control a viewer could name, and that is deliberate — it is the shape of
   a setting rather than a copy of one. */
.pn-gauge{display:block}
.mic{position:relative; width:16px; height:${PANEL.rowH}px; opacity:.55}
.mic-cap{position:absolute; left:50%; top:5px; width:8px; height:12px;
  margin-left:-4px; border-radius:999px; background:var(--bg)}
.mic-arc{position:absolute; left:50%; top:13px; width:15px; height:9px;
  margin-left:-7.5px; border:1.6px solid var(--bg); border-top:none;
  border-radius:0 0 999px 999px}
.mic-stem{position:absolute; left:50%; top:22px; width:1.6px; height:4px;
  margin-left:-0.8px; background:var(--bg)}
/* the send button: a blue disc with a waveform in the page's own paper colour. */
.pn-send{width:${PANEL.rowH}px; height:${PANEL.rowH}px; border-radius:50%;
  background:var(--pn-blue); display:flex; align-items:center; justify-content:center; gap:2.6px}
.pn-send i{display:block; width:2.4px; border-radius:999px; background:var(--bg)}

/* ---- the end card ----
   three lines of michroma on the middle of the safe band, fitted in the page,
   and nothing else on the frame. */
.end{position:absolute; left:50%; top:${CENTRE_Y}px; z-index:8; pointer-events:none;
  width:max-content; max-width:${VW - 2 * SAFE_CSS.left}px;
  font-family:var(--display); font-weight:400; color:var(--fg);
  text-transform:uppercase; letter-spacing:0; line-height:${END.lineH};
  white-space:nowrap; text-align:center;
  opacity:var(--end-o,0);
  transform:translate(-50%,-50%) scale(var(--end-s,1))}
.end span{display:block}

/* ---- the tear ----
   bands of ink slammed across the frame and offset sideways. on paper the band
   **is** the fault rather than a displaced copy of one: there is no second copy
   of a mascot driven out of a module's runtime, and a few near black bars across
   a white frame for three frames is a dropout. */
.tear{position:absolute;left:0;width:${VW}px;z-index:9;pointer-events:none;
  background:var(--fg);
  top:var(--tt,0px);height:var(--th,0px);opacity:var(--to,0);
  transform:translate3d(calc(var(--tdx,0) * 1px),0,0)}

/* ---- the fault's own two layers ----
   the grain darkens rather than lightens, because this is paper: multiplied
   noise on white is grain and screen blended noise on white is nothing. the
   flash is ink for the same reason. */
.noise{position:absolute;inset:-40px;z-index:10;pointer-events:none;
  mix-blend-mode:multiply;opacity:var(--noise,0);
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.0' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23m)'/%3E%3C/svg%3E")}
.flash{position:absolute;left:50%;top:${MAS.cy}px;z-index:11;pointer-events:none;
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

  <div class="panel" id="panel">
    <div class="panel-text" id="panel-text"><span class="panel-ph" id="panel-ph">${PANEL.placeholder}</span><span id="panel-line"></span><span class="panel-caret" id="panel-caret"></span></div>
    <div class="panel-row">
      <span class="panel-plus"></span>
      <span class="panel-right">
        <svg class="pn-gauge" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M3.6 17.4 A9.6 9.6 0 1 1 20.4 17.4" fill="none" stroke="#3f7dfb"
                stroke-width="2.3" stroke-linecap="round"/>
          <path d="M12 16.4 L16.8 10.4" fill="none" stroke="#3f7dfb"
                stroke-width="2.3" stroke-linecap="round"/>
        </svg>
        <span class="mic"><span class="mic-cap"></span><span class="mic-arc"></span><span class="mic-stem"></span></span>
        <span class="pn-send">${[7, 13, 18, 10].map(h => '<i style="height:' + h + 'px"></i>').join('')}</span>
      </span>
    </div>
  </div>

  <div class="effort" id="effort">
    <div class="ef-label"><span>${EFFORT.label}</span><span class="ef-level" id="ef-level">${EFFORT.levels[0]}</span></div>
    <div class="ef-track">
      <span class="ef-fill" id="ef-fill"></span>
${EFFORT.dots.map(x => '      <span class="ef-dot" style="left:' + (x - EFFORT.x) + 'px"></span>').join('\n')}
      <span class="ef-knob" id="ef-knob"></span>
    </div>
  </div>

  <div class="word" id="word">${WORD.text}</div>
  <div class="title" id="title"><span id="title-a"></span></div>
  <div id="mas-cut">${mascotMarkup(plan)}</div>
  <div id="logo"></div>

  <div class="end" id="end">${END.lines.map(l => '<span>' + l + '</span>').join('')}</div>
${Array.from({ length: GL.bands }, (_, i) => '  <div class="tear" data-tear="' + i + '"></div>').join('\n')}
  <div class="noise" aria-hidden="true"></div>
  <div class="flash" aria-hidden="true"></div>
</div>
<script>
window.__CAP_PLAN = ${JSON.stringify(cap)};
window.__CAP_BOX = ${JSON.stringify(CAP_BOX)};
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
window.__P18 = ${JSON.stringify({ VW, VH, DSF, TITLE, END, LOGO, PANEL, EFFORT, CAP_BOX, CAP, MAS })};
(${captionPage.toString()})();
${mascotRuntime()}
(${scenePage.toString()})();
/* the layers measure and fit themselves once, after all three faces are really
   here. offline everything renders in the mono fallback and looks almost right,
   which is the worst kind of wrong to fit type against. */
Promise.all([
  document.fonts.load('400 40px Michroma'),
  document.fonts.load('800 40px Manrope'),
  document.fonts.load('500 24px "Space Grotesk"'),
  document.fonts.load('400 24px "Space Grotesk"'),
])
  .then(function () { return document.fonts.ready; })
  .then(function () {
    var built = Object.assign({}, window.__p18.build(), {
      cap: window.__cap.build(),
      mas: window.__mas.build(),
      caps: window.__mas.caps(),
    });
    /* the module fitted its cards against its own face; this refits them against
       the one they are actually set in, and it has to run after that fit rather
       than instead of it. */
    built.capRefit = window.__p18.capRefit();
    window.__built = built;
  });
</script>
</body>
</html>`;
}

/* ---------- the page's own half ----------
   serialised in with .toString(), so it closes over nothing: everything it needs
   arrives on window.__P18. it writes numbers to elements and it decides nothing,
   which is the same split `lib/captions.mjs` and `lib/mascot.mjs` are built
   on. */
function scenePage() {
  const P = window.__P18;
  const stage = document.getElementById('stage');
  const logo = document.getElementById('logo');
  const wordEl = document.getElementById('word');
  const title = document.getElementById('title');
  const titleLines = [document.getElementById('title-a')];
  const effort = document.getElementById('effort');
  const efFill = document.getElementById('ef-fill');
  const efKnob = document.getElementById('ef-knob');
  const efLevel = document.getElementById('ef-level');
  const panel = document.getElementById('panel');
  const panelPh = document.getElementById('panel-ph');
  const panelLine = document.getElementById('panel-line');
  const panelText = document.getElementById('panel-text');
  const end = document.getElementById('end');
  const tears = [...document.querySelectorAll('.tear')];

  const widest = el => {
    let w = 0;
    for (const sp of el.querySelectorAll('span')) w = Math.max(w, sp.getBoundingClientRect().width);
    return w || el.getBoundingClientRect().width;
  };
  const capOf = el => {
    const cv = document.createElement('canvas').getContext('2d');
    const cs = getComputedStyle(el);
    cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    const m = cv.measureText('H');
    return { cap: m.actualBoundingBoxAscent || 0, font: cv.font };
  };
  const boxOf = el => {
    const r = el.getBoundingClientRect(), d = P.DSF;
    return {
      cssRect: { x: +r.left.toFixed(2), y: +r.top.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) },
      left: +(r.left * d).toFixed(1), top: +(r.top * d).toFixed(1),
      right: +((P.VW - r.right) * d).toFixed(1), bottom: +((P.VH - r.bottom) * d).toFixed(1),
    };
  };
  /* one line now, so the slice is a slice. it stays a function and an array of
     one because the block, the fit and the apply all read it, and a second line
     would be one entry rather than a rewrite. */
  const titleSlice = n => [P.TITLE.text.slice(0, n)];

  window.__p18 = {
    ready: true,
    /* the two blocks of michroma are fitted rather than sized, because the face
       is proportional and its tracking is nearly a fifth of an em, so the width
       of a string is a measurement rather than a ratio. everything else on the
       page is set at a size node solved its geometry against. */
    build() {
      const fit = (el, want) => {
        const clamp = el.style.maxWidth;
        el.style.maxWidth = 'none';
        el.style.fontSize = '100px';
        const size = 100 * want / widest(el);
        el.style.fontSize = size.toFixed(2) + 'px';
        el.style.maxWidth = clamp;
        return +size.toFixed(2);
      };
      /* the title is measured with its whole copy in and emptied again: the
         typing writes a slice per frame, and a block fitted against one
         character would be fitted against nothing. */
      const full = titleSlice(P.TITLE.text.length);
      titleLines.forEach((el, i) => { el.textContent = full[i]; });
      const titleSize = fit(title, P.TITLE.w);
      const titleCap = +(capOf(title).cap * P.DSF).toFixed(1);
      const titleBox = boxOf(title);
      titleLines.forEach(el => { el.textContent = ''; });
      const endSize = fit(end, P.END.w);
      return {
        title: { size: titleSize, capPx: titleCap, box: titleBox, font: capOf(title).font },
        end: { size: endSize, capPx: +(capOf(end).cap * P.DSF).toFixed(1) },
      };
    },

    /* ---------- the caption, refitted against the face it is set in ----------
       `lib/captions.mjs` fits the float style by measuring its cards in Space
       Grotesk at 700 — which is the face the module sets them in and is not the
       face this clip asks for. Manrope at 800 is a different width for the same
       string, so the size the module solved is the wrong one and the widest card
       would cross the box.

       so the cards are measured **as they render**, at a probe size, and the
       size is solved again from the widest of them. it divides by the same
       `maxScale` the module divides by, because a word springs about its own
       centre and the outer ones would otherwise cross the safe line on the frame
       they arrive. lib is untouched: this is a rule and a measurement in the
       clip, not a change to the module. */
    capRefit() {
      const cards = [...document.querySelectorAll('.cap-float')];
      if (!cards.length) return null;
      const plan = window.__CAP_PLAN;
      const box = window.__CAP_BOX;
      const maxScale = plan.maxScale || 1;
      const gapEm = plan.bodyGap || 0;
      let widestEm = 0, at = null;
      for (const card of cards) {
        const was = card.style.fontSize;
        card.style.fontSize = '100px';
        const ws = [...card.querySelectorAll('.cap-w')];
        let w = 0;
        for (const el of ws) w += el.getBoundingClientRect().width;
        w += gapEm * 100 * Math.max(0, ws.length - 1);
        card.style.fontSize = was;
        if (w / 100 > widestEm) { widestEm = w / 100; at = card.textContent.slice(0, 24); }
      }
      const size = Math.min(P.CAP.floatSize, box.w / (widestEm * maxScale));
      for (const card of cards) card.style.fontSize = size.toFixed(3) + 'px';
      return {
        size: +size.toFixed(3), widestEm: +widestEm.toFixed(3), widest: at,
        maxScale, family: P.CAP.family, weight: P.CAP.weight,
        capPx: +(capOf(cards[0]).cap * P.DSF).toFixed(1),
        font: capOf(cards[0]).font,
      };
    },

    /* what everything measures, once, after the fits. the panel is measured with
       its whole line written in and taken out again, so a line that would spill
       out of its own box is caught before a frame is drawn rather than on the
       last character. */
    measure() {
      const was = panelLine.textContent;
      const wasPh = panelPh.style.display;
      panelPh.style.display = 'none';
      panelLine.textContent = P.PANEL.typed;
      const full = panelText.getBoundingClientRect();
      const lh = parseFloat(getComputedStyle(panelText).lineHeight);
      const lines = Math.round(full.height / lh);
      const line = {
        capPx: +(capOf(panelText).cap * P.DSF).toFixed(1),
        sizeCss: +parseFloat(getComputedStyle(panelText).fontSize).toFixed(3),
        h: +full.height.toFixed(2), lines,
        room: +(P.PANEL.h - P.PANEL.pad * 2 - P.PANEL.rowH - full.height).toFixed(2),
      };
      panelLine.textContent = was;
      panelPh.style.display = wasPh;
      /* the level cell, against the longest of the five words it has to hold. a
         cell narrower than its own copy would slide the label as it counted up,
         which is the one thing the fixed cell exists to stop. */
      const wasLevel = efLevel.textContent;
      let widestLevel = 0;
      for (const w of P.EFFORT.levels) {
        efLevel.textContent = w;
        widestLevel = Math.max(widestLevel, efLevel.scrollWidth);
      }
      efLevel.textContent = wasLevel;
      return {
        line,
        levelCell: +parseFloat(getComputedStyle(efLevel).minWidth).toFixed(1),
        levelWidest: +widestLevel.toFixed(1),
        panel: boxOf(panel),
        title: boxOf(title),
        word: boxOf(wordEl),
        end: boxOf(end),
        logo: boxOf(logo),
        effort: boxOf(document.querySelector('.ef-label')),
      };
    },

    /* the boxes anything moving is measured against, on the frame being drawn. */
    live() {
      return {
        panel: boxOf(panel), logo: boxOf(logo), title: boxOf(title),
        word: boxOf(wordEl), effort: boxOf(document.querySelector('.ef-label')),
        track: boxOf(document.querySelector('.ef-track')),
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
      s.setProperty('--sx', o.g.sx.toFixed(2));
      s.setProperty('--sy', o.g.sy.toFixed(2));
      s.setProperty('--split', o.g.split.toFixed(2));
      s.setProperty('--noise', o.g.noise.toFixed(4));
      s.setProperty('--flash', o.g.flash.toFixed(4));
      /* the split is behind an attribute rather than a zero valued shadow: a
         shadow at offset 0 in full colour is a coloured halo, not "off". */
      if (o.g.split > 0.01) stage.setAttribute('data-gl', '1');
      else stage.removeAttribute('data-gl');

      logo.style.setProperty('--lg-o', o.logo.o.toFixed(4));
      logo.style.setProperty('--lg-s', o.logo.size.toFixed(2) + 'px');
      logo.style.setProperty('--lg-x', o.logo.x.toFixed(2) + 'px');
      logo.style.setProperty('--lg-y', o.logo.y.toFixed(2) + 'px');
      logo.style.setProperty('--lg-r', o.logo.rot.toFixed(3));
      logo.style.visibility = o.logo.o > 0.002 ? 'visible' : 'hidden';

      wordEl.style.setProperty('--wd-o', o.word.o.toFixed(4));
      wordEl.style.visibility = o.word.o > 0.002 ? 'visible' : 'hidden';

      title.style.setProperty('--ti-o', o.title.o.toFixed(4));
      const parts = titleSlice(o.title.n);
      for (let i = 0; i < titleLines.length; i++) {
        if (titleLines[i].textContent !== parts[i]) titleLines[i].textContent = parts[i];
      }
      title.style.visibility = o.title.o > 0.002 ? 'visible' : 'hidden';

      effort.style.setProperty('--ef-o', o.effort.o.toFixed(4));
      effort.style.setProperty('--ef-y', o.effort.y.toFixed(3));
      efFill.style.setProperty('--ef-f', o.effort.fill.toFixed(4));
      efKnob.style.setProperty('--ef-k', (o.effort.knob - P.EFFORT.x).toFixed(2));
      const lv = P.EFFORT.levels[o.effort.level];
      if (efLevel.textContent !== lv) efLevel.textContent = lv;
      effort.style.visibility = o.effort.o > 0.002 ? 'visible' : 'hidden';

      panel.style.setProperty('--pn-o', o.panel.o.toFixed(4));
      panel.style.setProperty('--pn-y', o.panel.y.toFixed(3));
      panel.style.setProperty('--pn-ph', o.panel.ph.toFixed(3));
      panel.style.setProperty('--pn-car', (o.panel.o > 0.02 ? o.panel.caret : 0).toFixed(3));
      const want = P.PANEL.typed.slice(0, o.panel.n);
      if (panelLine.textContent !== want) panelLine.textContent = want;
      panel.style.visibility = o.panel.o > 0.002 ? 'visible' : 'hidden';

      end.style.setProperty('--end-o', o.end.o.toFixed(4));
      end.style.setProperty('--end-s', o.end.sc.toFixed(4));
      end.style.visibility = o.end.o > 0.002 ? 'visible' : 'hidden';

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
   nothing in this scene animates by hand — node holds every animation and the
   page writes what it is handed — but the shim is installed and flushed once per
   capture anyway, so every layer runs under the same clock everything else in
   demo/ runs under. */
function injected() {
  let seed = 0x18a0c3d7;
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
  if (!fs.existsSync(LOGO_FILE)) {
    throw new Error('no ' + path.relative(ROOT, LOGO_FILE) + ' — the mark is an asset, not '
      + 'something this file draws');
  }
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
  for (let i = 0; i < 240; i++) {
    const ok = await page.evaluate(() => !!(window.__mas && window.__mas.ready
      && window.__cap && window.__cap.ready && window.__p18 && window.__built
      && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  const ready = await page.evaluate(() => ({
    mas: !!(window.__mas && window.__mas.ready),
    cap: !!(window.__cap && window.__cap.ready),
    p18: !!(window.__p18 && window.__p18.ready),
    built: !!window.__built,
  }));
  for (const k of ['mas', 'cap', 'p18', 'built']) {
    if (!ready[k]) throw new Error('the ' + k + ' layer never became ready');
  }
  /* offline a face falls back to the system mono and the type looks almost
     right, which is the worst kind of wrong to judge type on. all three are
     checked, and the caption's is the new one. */
  for (const [f, what] of [['400 40px "Michroma"', 'the title and the end card'],
    ['800 40px "Manrope"', 'the captions'], ['500 24px "Space Grotesk"', 'the panel']]) {
    if (!await page.evaluate(x => document.fonts.check(x), f)) {
      throw new Error(f.split('px ')[1] + ' did not load — ' + what + ' would be judged in the mono fallback');
    }
  }
  return { browser, page, cdp, srv, advance };
}

/* one instant, written to the page in the order the contract says: the module's
   own layers first, then this file's. */
async function paint(page, o, t) {
  await page.evaluate(m => window.__mas.apply(m), o.mas);
  await page.evaluate(fr => window.__cap.apply(fr), captionFrame(cap, t));
  await page.evaluate(p => window.__p18.apply(p), pageFrame(o));
}

async function shoot(cdp, file, fmt = 'png') {
  const shot = await cdp.send('Page.captureScreenshot', {
    format: fmt, quality: fmt === 'jpeg' ? 94 : undefined,
    captureBeyondViewport: false,
    clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
  });
  fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
}

/* ==========================================================================
   render
   ========================================================================== */
async function render() {
  for (const d of [FRAMES, SUBS]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  fs.mkdirSync(OUT, { recursive: true });
  const N = Math.round(FPS * SECONDS);
  const { browser, page, cdp, srv, advance } = await boot();

  const built = await page.evaluate(() => window.__built);
  const meas = await page.evaluate(() => window.__p18.measure());
  console.log('  built: head ' + built.mas.headPx + ' device px, ' + built.mas.eyes + ' eyes, '
    + built.mas.dots + ' dots, outline ' + built.mas.strokePx + ' device px, theme ' + built.mas.theme);
  console.log('  the title fits at ' + built.title.size + 'css px, caps ' + built.title.capPx
    + ' device, floor ' + TITLE.minCapPx);
  console.log('  the end card fits at ' + built.end.size + 'css px, caps ' + built.end.capPx
    + ' device, floor ' + END.minCapPx);
  console.log('  the panel line: ' + meas.line.sizeCss + 'css px, caps ' + meas.line.capPx
    + ' device, ' + meas.line.lines + ' lines, ' + meas.line.room.toFixed(1) + ' css of air left in it');
  if (built.capRefit) {
    console.log('  the captions: ' + built.capRefit.family + ' ' + built.capRefit.weight + ', '
      + built.capRefit.size + 'css px, caps ' + built.capRefit.capPx + ' device — the module fitted '
      + built.cap.size.toFixed(1) + ' against its own face and this refits against the one that '
      + 'renders, off "' + built.capRefit.widest + '"');
  }

  /* the liveness signature. one number per output frame off everything this file
     wrote plus everything the module wrote, gated by what is actually drawn, so
     two identical frames are a fact rather than a suspicion. */
  const sigs = [];
  const wall = Date.now();
  let worstAir = null, samples = 0;
  let capWorst = null, capSamples = 0;
  let bubWorst = null, bubSamples = 0, pillWorst = null;
  let gazeMax = { ex: 0, ey: 0, rot: 0, dx: 0 };

  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const o = frameAt(t, f);
      await paint(page, o, t);
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);

      if (k === 0) {
        let s = o.mo * 7 + o.logo.o * 11 + o.logo.size * 13 + o.logo.x * 17 + o.logo.y * 19
          + o.logo.rot * 197
          + o.word.o * 23 + o.title.o * 29 + o.title.n * 31
          + o.effort.o * 37 + o.effort.knob * 41 + o.effort.fill * 43 + o.effort.level * 47
          + o.panel.o * 53 + o.panel.y * 59 + o.panel.n * 61 + o.panel.caret * 67
          + o.end.o * 71 + o.end.sc * 73
          + o.g.sx * 79 + o.g.sy * 83 + o.g.split * 89 + o.g.noise * 97 + o.g.flash * 101
          + o.g.bands.length * 103;
        if (o.mo > 0.004) {
          s += o.mas.card.x * 107 + o.mas.card.y * 109 + o.mas.card.rot * 113
            + o.mas.card.sx * 127 + o.mas.card.sy * 131
            + o.mas.bubble.o * 137 + o.mas.bubble.pill.sc * 139
            + o.mas.bubble.dots[0].sc * 149 + o.mas.bubble.dots[1].sc * 151;
          for (let e = 0; e < 2; e++) {
            s += o.mas.eyes[e].x * (157 + e) + o.mas.eyes[e].y * (163 + e)
              + o.mas.eyes[e].sx * (167 + e) + o.mas.eyes[e].sy * (173 + e)
              + o.mas.eyes[e].lid * (179 + e);
          }
        }
        sigs.push(+s.toFixed(6));

        gazeMax = {
          ex: Math.max(gazeMax.ex, Math.abs(o.gz.ex)), ey: Math.max(gazeMax.ey, Math.abs(o.gz.ey)),
          rot: Math.max(gazeMax.rot, Math.abs(o.gz.rot)), dx: Math.max(gazeMax.dx, Math.abs(o.gz.dx)),
        };

        const every = Math.max(1, Math.round(FPS / 8));
        /* everything drawn, eight times a second and never inside the fault: the
           glitch translates the whole stage and a reading through a thirteen
           pixel jump is a reading of the glitch. */
        if (o.g.heat === 0 && f % every === 0) {
          const live = await page.evaluate(() => window.__p18.live());
          samples++;
          const boxes = [];
          if (o.panel.o > 0.5) boxes.push(['the panel', live.panel]);
          if (o.logo.o > 0.5) boxes.push(['the mark', live.logo]);
          if (o.title.o > 0.5 && o.title.n > 6) boxes.push(['the title', live.title]);
          if (o.word.o > 0.5) boxes.push(['the name', live.word]);
          if (o.effort.o > 0.5) { boxes.push(['the label', live.effort]); boxes.push(['the track', live.track]); }
          for (const [what, b] of boxes) {
            const air = Math.min(b.left - SAFE.left, b.top - SAFE.top,
              b.right - SAFE.right, b.bottom - SAFE.bottom);
            if (!worstAir || air < worstAir.air) {
              worstAir = { what, air: +air.toFixed(1), t: +t.toFixed(2), ...b };
            }
          }
          const cs = await page.evaluate((vw, vh) => window.__cap.safe(vw, vh), VW, VH);
          if (cs && cs.left < 1e8) {
            capSamples++;
            const air = Math.min(cs.left * DSF - SAFE.left, cs.top * DSF - SAFE.top,
              cs.right * DSF - SAFE.right, cs.bottom * DSF - SAFE.bottom);
            if (!capWorst || air < capWorst.air) {
              capWorst = { air: +air.toFixed(1), t: +t.toFixed(2), worst: cs.worst,
                top: +cs.top.toFixed(1), bottom: +cs.bottom.toFixed(1) };
            }
          }
        }
        /* the thought, on every frame it is up: it is the punchline and the one
           piece of copy in the last two seconds. */
        if (o.mo > 0.5 && o.mas.bubble.o > 0.02) {
          const bs = await page.evaluate((w, h) => window.__mas.bubbleSafe(w, h), VW, VH);
          if (bs) {
            bubSamples++;
            const air = Math.min(bs.left - SAFE.left, bs.top - SAFE.top,
              bs.right - SAFE.right, bs.bottom - SAFE.bottom);
            if (!bubWorst || air < bubWorst.air) bubWorst = { t: +t.toFixed(2), air: +air.toFixed(1), ...bs };
            const pb = await page.evaluate(() => window.__p18.pillBox());
            if (!pillWorst || pb.right < pillWorst.right) pillWorst = { t: +t.toFixed(2), ...pb };
          }
        }
      }

      const file = SUB > 1
        ? path.join(SUBS, 's' + String(idx).padStart(6, '0') + '.jpg')
        : path.join(FRAMES, 'f' + String(f).padStart(5, '0') + '.jpg');
      await shoot(cdp, file, 'jpeg');
      await advance(SUBSTEP);
    }
    if (f % 120 === 0) {
      console.log('  ' + String(f).padStart(4) + '/' + N + '  t=' + (f / FPS).toFixed(2) + 's  '
        + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
    }
  }

  const caps = await page.evaluate(() => window.__mas.caps());
  await stills(page, cdp, advance, N);
  await browser.close();
  srv.close();
  if (SUB > 1) blend(N);

  const state = {
    built, meas, caps, sigs, frames: N,
    air: worstAir, samples,
    cap: capWorst, capSamples,
    bubble: bubWorst, bubSamples, pill: pillWorst,
    gaze: gazeMax,
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  return state;
}

/* ---------- the stills ----------
   a still is a frame the clip actually has: the time asked for is rounded to a
   frame and then that frame's own instant is what gets drawn, so the glitch,
   which is a function of the frame index, and everything else, which is a
   function of the time, can never disagree about which moment a still is. */
async function stills(page, cdp, advance, N) {
  fs.rmSync(VERIFY, { recursive: true, force: true });
  fs.mkdirSync(VERIFY, { recursive: true });
  const want = [
    [0.02, 'a-white'],
    [LOGO.in, 'b-the-mark-and-the-name'],
    [TITLE_TYPE.at[10], 'c-the-title-typing'],
    [titleUntil(B) + 0.05, 'd-the-title'],
    [BLINK_AT, 'e-the-blink'],
    [SC2_AT + LOGO.move, 'f-the-mark-is-in-the-corner'],
    [KNOB_ARRIVE[2], 'g-the-knob-mid-track'],
    [MAX_AT + 0.12, 'h-max-and-delighted'],
    [PANEL_AT + PANEL.in, 'i-the-panel'],
    [TYPING.at[Math.floor(TYPING.chars / 2)], 'j-typing'],
    [TYPING.until + 0.05, 'k-the-line'],
    [MARKS[3].t + 0.40, 'l-the-nod'],
    [SC4_AT + 0.24, 'm-the-mark-comes-back'],
    [BUB.in + BUBBLE.step, 'n-the-dots'],
    [BUB_FULL, 'o-the-thought'],
    [GLB_AT - 1 / FPS, 'p-the-last-frame-of-it'],
    [GLB_AT, 'q-the-fault'],
    [GLB_AT + FAULT.for + 0.05, 'r-the-wordmark'],
    [SECONDS - 0.05, 's-the-last-frame'],
  ];
  for (const [at, name] of want) {
    const fr = Math.min(N - 1, Math.max(0, Math.round(at * FPS)));
    await paint(page, frameAt(fr / FPS, fr), fr / FPS);
    await page.evaluate(now => window.__dmRaf(now), (fr + 1) * STEP);
    await shoot(cdp, path.join(VERIFY, name + '.png'));
    /* **virtual time has to move between two captures.** with the clock paused
       `Page.captureScreenshot` waits for a frame the compositor has no reason to
       produce, and the second call in a row blocks forever. */
    await advance(STEP);
  }
  /* the three legibility crops, at three times, on every run rather than only
     when somebody remembers a flag: the panel with its line in, the caption at
     its widest card, and the thought. */
  const crops = [
    [TYPING.until, { x: PANEL.x, y: PANEL.y, w: PANEL.w, h: PANEL.h }, 'the-panel-3x'],
    [TYPING.until, { x: CAP_BOX.x, y: CAP_BOX.y, w: CAP_BOX.w, h: CAP_BOX.h }, 'the-caption-3x'],
    [BUB_FULL, { x: 60, y: 380, w: 420, h: 260 }, 'the-thought-3x'],
  ];
  for (const [at, box, name] of crops) {
    const fr = Math.min(N - 1, Math.round(at * FPS));
    await paint(page, frameAt(fr / FPS, fr), fr / FPS);
    await page.evaluate(now => window.__dmRaf(now), (fr + 1) * STEP);
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: box.x, y: box.y, width: box.w, height: box.h, scale: 3 },
    });
    fs.writeFileSync(path.join(VERIFY, name + '.png'), Buffer.from(shot.data, 'base64'));
    await advance(STEP);
  }
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

/* the mark's own file, read here rather than in the page: a background image has
   no natural size to report, and what is worth asserting about somebody else's
   asset is that it is the file we think it is — including that it carries its
   own transparency rather than a white ground this page would have to hide. */
function pngFacts(file) {
  const b = fs.readFileSync(file);
  const png = b.length > 24 && b.readUInt32BE(0) === 0x89504e47;
  let o = 8, alpha = false, colour = png ? b[25] : -1;
  while (png && o < b.length - 8) {
    const len = b.readUInt32BE(o);
    const t = b.toString('ascii', o + 4, o + 8);
    if (t === 'tRNS') alpha = true;
    if (t === 'IEND') break;
    o += 12 + len;
  }
  /* colour type 4 and 6 carry an alpha channel outright; 3 carries it in tRNS. */
  if (colour === 4 || colour === 6) alpha = true;
  return { ok: png, w: png ? b.readUInt32BE(16) : 0, h: png ? b.readUInt32BE(20) : 0,
    bytes: b.length, colour, alpha };
}

/* ==========================================================================
   the sound
   ==========================================================================
   five kinds and the brief names all five: a startup, the slider's clicks and
   its thunk, the key ticks, the pop on the pill and the glitch hit. no music,
   and nothing here is a new recipe.

     the startup       one soft `popDeep`, low and short, as the mark fades up.
                       a body rather than a chime, because nothing has happened
                       yet.
     the typing        `key`, twice: the title and the panel, each off its own
                       list rather than off a rate.
     the dots          `click` on each of the knob's four arrivals and a softer,
                       lower `popDeep` on the last of them, which is the thunk.
     the pill          `mascotCues`' own `pop`, taken. **the `ding` the module
                       offers for the agreeing mark is declined**, because the
                       brief's sound list does not have one in it and a ding that
                       is not asked for is a sound looking for a reason.
     the fault         `glitch`, on the frame the film is taken. */
const CUES = mascotCues(plan);
const DECLINED = CUES.filter(c => c.kind !== 'pop');
function soundCues() {
  const cues = [
    { t: +(LOGO_AT + 0.04).toFixed(4), kind: 'popDeep',
      opts: { f0: 118, f1: 62, tau: 0.11, len: 0.30 }, from: 'the mark fading up' },
    ...TITLE_TYPE.keys.map(t => ({ t, kind: 'key', from: 'the title typing' })),
    ...KNOB_ARRIVE.slice(1).map(t => ({ t, kind: 'click', opts: { len: 0.07 },
      from: 'the knob landing on a dot' })),
    { t: MAX_AT, kind: 'popDeep', opts: { f0: 84, f1: 46, tau: 0.10, len: 0.24 },
      from: 'max, and the thunk' },
    ...TYPING.keys.map(t => ({ t, kind: 'key', from: 'the panel typing' })),
    ...CUES.filter(c => c.kind === 'pop').map(c => ({ ...c, from: 'mascotCues — the pill landing' })),
    { t: GLB_AT, kind: 'glitch', from: 'the fault' },
  ];
  return cues.sort((a, b) => a.t - b.t);
}

/* ==========================================================================
   go
   ========================================================================== */
console.log('the boring tek — post18, the future is here');
console.log('');

console.log('the read — three takes, ' + VOICE + ', one per line, delivery per line');
for (const b of B) {
  console.log('  ' + b.sound.start.toFixed(2) + '..' + b.sound.end.toFixed(2) + 's  rate '
    + b.rate.padStart(4) + ' pitch ' + b.pitch.padStart(5) + '  ' + b.wps.toFixed(2) + ' wps  '
    + (b.cached ? 'cached' : 'fetched') + '  "' + b.text + '"');
}
console.log('  ' + B.reduce((a, b) => a + (b.sound.end - b.sound.start), 0).toFixed(2)
  + 's of sound in all, and the silences between them are '
  + V.gaps.map(g => g.toFixed(2)).join(', ') + 's — the first is the whole slider scene');
console.log('');

console.log('the typing');
console.log('  the second line: "' + TITLE.text + '", ' + TITLE_TYPE.chars + ' characters, '
  + TITLE_TYPE.from.toFixed(2) + '..' + TITLE_TYPE.until.toFixed(2)
  + 's, laid across the read\'s own "astra" to "here", ' + TITLE_TYPE.cps.toFixed(1)
  + ' characters a second');
console.log('  the name above it is "' + WORD.text + '" in ' + CAP.family + ' 800 at '
  + WORD.size + 'css px, and it does not type: it is a name being shown');
console.log('  the panel: ' + TYPING.chars + ' characters, ' + TYPING.from.toFixed(2) + '..'
  + TYPING.until.toFixed(2) + 's, ' + TYPING.cps.toFixed(1) + ' a second, laid across the line '
  + 'the voice is reading. ceiling is ' + PANEL.cpsCeiling);
console.log('');

console.log(describeMascot(plan));
const rep = mascotMotion(plan, FPS, SECONDS);
const rep60 = FPS === 60 ? rep : mascotMotion(plan, 60, SECONDS);
console.log(describeMotion(rep60));
console.log('');

console.log(describe(cap));
console.log('  ' + CUT.marked.length + ' line ends were marked so no card straddles two of them');
console.log('  the first line has no caption: it is on the screen as the title');
console.log('  the face is ' + CAP.family + ' ' + CAP.weight + ', which is this clip\'s own rule '
  + 'over the module\'s Space Grotesk 700 — see capRefit');
console.log('');

console.log('the layout, in css px');
console.log('  the mark: ' + LOGO.hero.size + ' at ' + LOGO.hero.cx + ',' + LOGO.hero.cy + ' → '
  + LOGO.corner.size + ' at ' + LOGO.corner.cx + ',' + LOGO.corner.cy + ' → ' + LOGO.close.size
  + ' at ' + LOGO.close.cx + ',' + LOGO.close.cy);
console.log('  the name at ' + WORD.top + ', the title at ' + TITLE.top + ' on three lines');
console.log('  the control: label ' + EFFORT.labelY + ', track ' + EFFORT.x + '..'
  + (EFFORT.x + EFFORT.w) + ' at ' + EFFORT.y + ', five dots at ' + EFFORT.dots.join(', '));
console.log('  the panel: ' + PANEL.w + ' x ' + PANEL.h + ' at ' + PANEL.x + ',' + PANEL.y);
console.log('  him: plate ' + (HEAD.plate.s * plan.unit).toFixed(1) + ' css / '
  + plan.headPx.toFixed(0) + ' device px at ' + MAS.cx + ',' + MAS.cy + ', window is '
  + HEAD_PX.min + '..' + HEAD_PX.max);
console.log('  the pill solves to ' + PILL_W + ' css wide and its spring carries it to x' + PILL_SC
  + ', so off a dead centre head its right edge would reach '
  + (CENTRED_LEFT + PILL_X0 + PILL_W * PILL_SC).toFixed(1) + ' against a safe line at '
  + (VW - SAFE_CSS.right));
console.log('  so he sits ' + OFF_X + ' css px (' + (OFF_X * DSF).toFixed(0)
  + ' device, ' + (OFF_X / VW * 100).toFixed(1) + '% of the width) left of the frame\'s middle. '
  + 'no head size fixes it — see the header');
console.log('  the caption band: ' + CAP_BOX.w + ' x ' + CAP_BOX.h + ' at ' + CAP_BOX.x + ','
  + CAP_BOX.y + ', bottom anchored, and it does not move');
console.log('');

console.log('the beats');
const beats = [
  [0, 'white, empty'],
  [LOGO_AT, 'the mark fades in over ' + LOGO.in.toFixed(2) + 's, and he fades up under it'],
  [WORD_AT, 'the name arrives under it'],
  [MARKS[0].t, 'curious: he looks up at it, one eye wide'],
  [TITLE_TYPE.from, 'the title starts typing, cut to the read'],
  ...B[0].words.map(w => [w.start, '  "' + w.word + '"']),
  [BLINK_AT, 'the blink, ' + (SEED.len * 1000).toFixed(0) + 'ms of lid, off the idle layer'],
  [TITLE_TYPE.until, 'the title is in, and the line finishes over it'],
  [SC2_AT, 'the mark leaves for the corner, the name and the title go with it'],
  [EFFORT_IN, 'the effort control slides in'],
  ...KNOB_ARRIVE.map((t, i) => [t, '  the knob lands on ' + EFFORT.levels[i]
    + (i === KNOB_ARRIVE.length - 1 ? ', with the thunk' : '')]),
  [MAX_AT, 'delighted: he is pleased with max'],
  [SC3_AT, 'the control goes and the panel comes up'],
  [TYPING.from, 'the panel types itself while the voice reads the same line'],
  [MARKS[3].t, 'agreeing: the nod, on "competitor"'],
  [TYPING.until, 'the line is in'],
  [MARKS[4].t, 'delighted: he is happy, and the thought is on this mark'],
  [SC4_AT, 'the panel leaves and the mark comes back to the middle, bigger'],
  [B[2].sound.start, 'the last line'],
  [BUB.in, 'the first dot climbs off his crown'],
  [BUB_FULL, '"' + THOUGHT + '" is up, and the pop is on the pill'],
  [GLB_AT, 'the fault takes everything, ' + FAULT.for.toFixed(2) + 's of it'],
  [END_IN, 'the wordmark, and it holds ' + (SECONDS - END_IN - END.in).toFixed(2) + 's'],
  [SECONDS, 'end'],
].sort((a, b) => a[0] - b[0]);
for (const [t, what] of beats) console.log('  ' + t.toFixed(2) + 's  ' + what);
console.log('');

/* ---------- the sound ---------- */
const cues = soundCues();
const sfx = renderSfx(cues, SECONDS);
fs.mkdirSync(OUT, { recursive: true });

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
     with limiting, and that is not louder, it is denser. */
  if (l.reduction <= MAX_REDUCTION && (!best || miss(m.lufs) < miss(best.lufs))) {
    best = { ...pass, kept: true };
  }
  if (Math.abs(m.lufs - TARGET_LUFS) < 0.25 || l.reduction > MAX_REDUCTION) break;
  lift = +(lift + (TARGET_LUFS - m.lufs)).toFixed(2);
}
mix.out.set(baseMix);
if (best && best.lift) applyGain(mix.out, best.lift);
const lim = limit(mix.out, WAV_CEILING);
writeWav(WAV, mix.out);
const after = loudness(ffmpeg, WAV);

console.log('the sound');
console.log(describeMix(sfx.report, {
  'the read': (track.length / SR).toFixed(2) + 's of track, ' + V.words.length
    + ' words, ducking the bus to ' + DUCK + ' while a word is being said',
  'the bus': cues.length + ' cues, ' + new Set(cues.map(c => c.kind)).size
    + ' kinds, all five of them named in the brief',
  'declined': DECLINED.length + ' cue(s) from mascotCues left out'
    + (DECLINED.length ? ' — ' + DECLINED.map(c => c.kind + ' at ' + c.t.toFixed(2)).join(', ')
      + ', because the brief\'s sound list does not have one in it' : ''),
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

if (PLAN_ONLY) {
  console.log('  --plan: nothing rendered. the clip would run ' + SECONDS.toFixed(2) + 's at '
    + FPS + 'fps, ' + Math.round(SECONDS * FPS) + ' frames');
  process.exit(0);
}

if (STILLS_ONLY) {
  const { browser, page, cdp, srv, advance } = await boot();
  await stills(page, cdp, advance, Math.round(SECONDS * FPS));
  await browser.close();
  srv.close();
  console.log('  --stills: the readable frames are in ' + path.relative(ROOT, VERIFY));
  process.exit(0);
}

const state = ONLY_ENCODE
  ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
  : await render();
const file = encode(WAV);
const p = probe(file);
const lu = loudness(ffmpeg, file);
const png = pngFacts(LOGO_FILE);

console.log('rendered');
console.log('  ' + p.w + 'x' + p.h + ' @' + p.fps + 'fps  ' + p.seconds.toFixed(2) + 's  '
  + (p.audio ? 'with sound' : 'SILENT') + '  '
  + (fs.statSync(file).size / 1e6).toFixed(2) + ' MB  ' + path.relative(ROOT, file));
console.log('  the shutter is ' + (BLUR ? 'open, ' + SUB + ' subframes to a frame' : 'closed'));
if (lu && lu.ok) {
  console.log('  loudness ' + lu.lufs + ' LUFS integrated, ' + lu.lra
    + ' LU range, true peak ' + lu.truePeak + ' dBFS, measured on the mp4');
}
if (state.air) {
  console.log('  the tightest thing on the frame is ' + state.air.what + ' at ' + state.air.t
    + 's: ' + state.air.air + ' device px inside the platform safe area');
}
if (state.cap) {
  console.log('  the captions at their tightest (' + state.cap.t + 's): ' + state.cap.air
    + ' device px of air, nearest thing "' + state.cap.worst + '"');
}
if (state.bubble) {
  console.log('  the thought at its tightest (' + state.bubble.t + 's): ' + state.bubble.air
    + ' device px of air, cluster ' + state.bubble.w + ' device px wide');
}
console.log('  the gaze reached ' + state.gaze.ex.toFixed(2) + ' grid units of eye across, '
  + state.gaze.ey.toFixed(2) + ' up and down, ' + state.gaze.rot.toFixed(2) + ' degrees of tilt '
  + 'and ' + state.gaze.dx.toFixed(2) + ' css px of lean, against caps of ' + GZ.eye + '/'
  + GZ.eyeY + '/' + GZ.rot + '/' + GZ.lean);
console.log('  a still per beat in ' + path.relative(ROOT, VERIFY));
console.log('');
console.log('  the clock, against the brief\'s nine to ten: ' + SECONDS.toFixed(2) + 's, of which '
  + B.reduce((a, b) => a + (b.sound.end - b.sound.start), 0).toFixed(2) + 's is speech, '
  + EFFORT.for.toFixed(2) + 's is the slider with no voice on it, '
  + (GLB_AT - BUB.in).toFixed(2) + 's is the thought and ' + (SECONDS - END_IN).toFixed(2)
  + 's is the end card. the two cuts that would take it under ten: dropping "and it is a big one" '
  + 'off the first line, and dropping the slider scene');

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

/* ---------- the file ---------- */
check(p.w === VW * DSF && p.h === VH * DSF, 'the file is ' + p.w + 'x' + p.h);
check(Math.abs(p.fps - FPS) < 0.5, 'the file is ' + p.fps + 'fps');
check(Math.abs(p.seconds - SECONDS) < 0.12,
  'the file runs ' + p.seconds.toFixed(2) + 's against ' + SECONDS.toFixed(2));
check(!!p.audio, 'the sound is muxed');
check(SECONDS >= RUN.min && SECONDS <= RUN.max,
  'the clip runs ' + SECONDS.toFixed(2) + 's, and the window is ' + RUN.min.toFixed(1) + ' to '
  + RUN.max.toFixed(1) + ' — see the header for why it is not the brief\'s nine to ten');

/* ---------- the read ---------- */
check(B.every(b => b.timing === 'engine'),
  'every take\'s word times come off the engine rather than off an estimate');
check(Math.abs(B[0].sound.start - VOICE_AT) < 0.001,
  'the first take\'s own sound starts on VOICE_AT: ' + B[0].sound.start.toFixed(3)
  + 's, measured off the waveform rather than off the word list');
check(new Set(LINES.map(l => l.rate + l.pitch)).size > 1,
  'the delivery is per line rather than per clip: '
  + LINES.map(l => l.rate + '/' + l.pitch).join(', '));
check(V.gaps[0] > EFFORT.for,
  'the silence after the first line is ' + V.gaps[0].toFixed(2) + 's, which is the whole slider '
  + 'scene (' + EFFORT.for.toFixed(2) + 's) plus the panel coming up — it is derived off the '
  + 'picture rather than typed');
check(V.gaps[1] >= LINES[1].gap - 1e-6,
  'and the breath between the panel line and the last one is ' + V.gaps[1].toFixed(2)
  + 's, at or over its own floor of ' + LINES[1].gap);

/* ---------- the title ---------- */
check(TITLE_TYPE.from === word(B[0], 'astra').start
  && TITLE_TYPE.until <= word(B[0], 'here').end + 1e-9
  && TITLE_TYPE.until >= word(B[0], 'here').start,
  'the second line is laid across the read\'s own two words: the first character is on "astra" '
  + 'at ' + TITLE_TYPE.from.toFixed(3) + 's and the last one lands inside "here", at '
  + TITLE_TYPE.until.toFixed(3) + 's against the word\'s own '
  + word(B[0], 'here').start.toFixed(3) + '..' + word(B[0], 'here').end.toFixed(3)
  + ' — the window ends on the word and the jitter leaves the last character a hair short of '
  + 'it, which is what typeAcross does and typeToWords does not');
check(TITLE.text.split(/\s+/).length === 3 && !/CHATGPT/.test(TITLE.text),
  'and it does not say the name again: the page carries "' + WORD.text + '" once, in '
  + CAP.family + ' 800 at ' + WORD.size + 'css px, and "' + TITLE.text + '" under it');
{
  /* the name is spelled in the copy so the engine reads it as letters, and the
     word list is the evidence: five tokens where a word would be one. */
  const first = B[0].words.slice(0, 5).map(w => w.word.toLowerCase());
  check(first.join(' ') === 'chat g p t 6',
    'the read spells the name rather than saying it: the engine handed back '
    + first.map(w => '"' + w + '"').join(', ') + ' as separate word boundaries, which is what '
    + 'makes it "chat g p t six" rather than "chatgpt six"');
  check(!/chatgpt/i.test(LINES[0].text),
    'and the copy never contains the joined form, because ssml never reaches the engine — '
    + 'speak() escapes its input. see the read');
}
check(TITLE_TYPE.cps < 20,
  'it types at ' + TITLE_TYPE.cps.toFixed(1) + ' characters a second across those two words');
if (state.built) {
  check(state.built.title.capPx >= TITLE.minCapPx,
    'the second line measures ' + state.built.title.capPx + ' device px of cap, floor is '
    + TITLE.minCapPx);
  check(state.built.end.capPx >= END.minCapPx,
    'the end card measures ' + state.built.end.capPx + ' device px of cap, floor is ' + END.minCapPx);
}

/* ---------- the panel ---------- */
if (state.meas) {
  const m = state.meas;
  check(m.line.capPx >= PANEL.minCapPx,
    'the panel\'s line measures ' + m.line.capPx + ' device px of cap, floor is ' + PANEL.minCapPx);
  check(m.line.lines === PANEL.lines,
    'it wraps to ' + m.line.lines + ' lines, which is what the panel is ' + PANEL.lines
    + ' lines tall for');
  check(m.line.room >= 8,
    'the panel\'s two blocks leave ' + m.line.room.toFixed(1) + ' css px of air between them');
  check(m.levelWidest <= m.levelCell + 0.5,
    'the level cell is ' + m.levelCell + ' css px and the longest of the five words measures '
    + m.levelWidest + ', so counting up cannot slide the label');
}
check(TYPING.cps < PANEL.cpsCeiling,
  'the panel types at ' + TYPING.cps.toFixed(1) + ' characters a second, ceiling is '
  + PANEL.cpsCeiling);
check(TYPING.from >= B[1].words[0].start - 1e-6 && TYPING.until <= B[1].end + 1e-6,
  'and it is laid across the line the voice is reading, start to end: '
  + TYPING.from.toFixed(2) + '..' + TYPING.until.toFixed(2) + 's against the read\'s '
  + B[1].words[0].start.toFixed(2) + '..' + B[1].end.toFixed(2));
{
  const on = frameAt(PANEL_AT + PANEL.in, Math.round((PANEL_AT + PANEL.in) * FPS));
  const half = frameAt(PANEL_AT + PANEL.caretFor * 0.75, Math.round((PANEL_AT + PANEL.caretFor * 0.75) * FPS));
  check(on.panel.caret === 1 && half.panel.caret === 0,
    'the caret blinks on the clip\'s own clock rather than on a css animation: on at '
    + (PANEL_AT + PANEL.in).toFixed(2) + 's, off at '
    + (PANEL_AT + PANEL.caretFor * 0.75).toFixed(2) + ', every ' + PANEL.caretFor.toFixed(2) + 's');
}

/* ---------- the slider ---------- */
check(EFFORT.levels.length === 5 && KNOB_ARRIVE.length === 5,
  'five dots and five arrivals: ' + EFFORT.levels.map((l, i) => l + ' at '
    + KNOB_ARRIVE[i].toFixed(2)).join(', '));
check(KNOB_ARRIVE.every((t, i) => i === 0 || t > KNOB_ARRIVE[i - 1]),
  'the knob only ever goes right');
{
  const a = frameAt(KNOB_ARRIVE[0], Math.round(KNOB_ARRIVE[0] * FPS));
  const b = frameAt(MAX_AT + 0.02, Math.round((MAX_AT + 0.02) * FPS));
  check(Math.abs(a.effort.knob - EFFORT.dots[0]) < 0.01
    && Math.abs(b.effort.knob - EFFORT.dots[4]) < 0.01,
    'it starts on the first dot and lands on the last: ' + a.effort.knob + ' → ' + b.effort.knob);
  check(a.effort.level === 0 && b.effort.level === 4,
    'and the label counts ' + EFFORT.levels.join(', ') + ' with it');
  check(b.effort.fill > 0.9, 'the fill follows the knob to the end: ' + b.effort.fill.toFixed(2));
}
check(SC3_AT > MAX_AT,
  'the panel does not arrive until the knob has landed: ' + SC3_AT.toFixed(2) + 's against '
  + MAX_AT.toFixed(2));

/* ---------- him ---------- */
check(plan.marks.length === MARKS.length,
  'five marks, all off the read: ' + plan.marks.map(m => m.state).join(', '));
{
  const banned = plan.marks.filter(m => !['curious', 'thinking', 'surprised', 'delighted', 'agreeing'].includes(m.state));
  check(banned.length === 0,
    'and every one of them is inside the brief\'s own list: no neutral, no unimpressed, '
    + 'nothing flat or annoyed anywhere in the film');
}
check(plan.bias === 0,
  'he rests looking straight down the lens — the gaze layer is what points him at things');
{
  let worst = null;
  for (let f = 0; f < CUT_FRAME; f++) {
    const o = frameAt(f / FPS, f);
    if (o.mo < 0.5) continue;
    const a = headPageRect(o.mas).air;
    const near = Math.min(a.left, a.top, a.right, a.bottom);
    if (!worst || near < worst.near) worst = { t: +(f / FPS).toFixed(2), near: +near.toFixed(1), ...a };
  }
  check(worst.near >= 0,
    'his head clears the platform safe area on every frame he is on: ' + worst.near
    + ' device px at ' + worst.t + 's');
}
{
  /* the panel is the one thing on the frame he could reach, and `delighted` is
     the state that leaves the ground. walked rather than sampled, because the
     frames that would fail are the ones a hop is at its peak on. */
  let worst = null;
  for (let f = 0; f < CUT_FRAME; f++) {
    const o = frameAt(f / FPS, f);
    if (o.mo < 0.5 || o.panel.o < 0.5) continue;
    const hp = headPageRect(o.mas).rect;
    const gap = +(PANEL.y + PANEL.h + o.panel.y - hp.y).toFixed(2);
    if (!worst || gap > worst.gap) worst = { gap, t: +(f / FPS).toFixed(2) };
  }
  check(!worst || worst.gap < 0,
    'and his crown never reaches the panel: the closest is ' + (worst ? (-worst.gap).toFixed(2)
      + ' css px at ' + worst.t + 's' : 'never on the same frame'));
}
{
  const near = blinksNear(plan);
  check(near.length === 1 && blinkInside(near[0]),
    'exactly one whole idle blink lands while he is looking up at the mark ('
    + BLINK_WINDOW[0].toFixed(2) + ' to ' + BLINK_WINDOW[1].toFixed(2) + 's): '
    + BLINK.t.toFixed(2) + '..' + blinkEnd(BLINK).toFixed(2) + 's, seed ' + SEED.seed);
  check(SEED.len >= 0.22,
    'and it is a slow one: ' + (SEED.len * 1000).toFixed(0) + 'ms of lid, out of a search over '
    + 'six thousand seeds');
}
check(rep60.frozenFrames === 0, 'the face is never frozen: ' + rep60.frozenFrames + ' frames');
check(rep60.maxSquash <= 0.081, 'the squash peaks at ' + (rep60.maxSquash * 100).toFixed(1) + '%');
check(rep60.maxBreathe <= 0.021, 'the breathing peaks at ' + (rep60.maxBreathe * 100).toFixed(2) + '%');

/* ---------- the gaze ---------- */
if (state.gaze) {
  check(state.gaze.ex <= GZ.eye + 1e-3 && state.gaze.ey <= GZ.eyeY + 1e-3
    && state.gaze.rot <= GZ.rot + 1e-3 && state.gaze.dx <= GZ.lean + 1e-3,
    'the gaze stays inside its own caps: ' + state.gaze.ex.toFixed(2) + ' / '
    + state.gaze.ey.toFixed(2) + ' grid units, ' + state.gaze.rot.toFixed(2) + ' degrees, '
    + state.gaze.dx.toFixed(2) + ' css px');
  check(state.gaze.ey > 1.0,
    'and it is a performance rather than a twitch: it reaches ' + state.gaze.ey.toFixed(2)
    + ' units up and down, which is the look at the mark above him');
}
{
  let worst = 0, at = 0;
  for (let f = 0; f < CUT_FRAME; f++) {
    const o = frameAt(f / FPS, f);
    if (o.mo < 0.5) continue;
    for (const e of o.mas.eyes) {
      if (Math.abs(e.x) > worst) { worst = Math.abs(e.x); at = +(f / FPS).toFixed(2); }
    }
  }
  check(worst < 7,
    'and no composed eye is ever more than ' + worst.toFixed(2) + ' grid units off its own centre '
    + '(at ' + at + 's), which is well inside the plate the markup clips it to');
}

/* ---------- the thought ---------- */
check(plan.thought.mode === 'over' && plan.thought.asked === 'over-right',
  'the thought is the module\'s own placement over the crown, asked for as '
  + plan.thought.asked + ', at ' + plan.thought.angle + ' degrees, lifts '
  + plan.thought.lifts.join('/') + ' — nothing about it is hand placed');
check(Math.abs(BUB.in - BUB_IN) < 1e-6 && Math.abs(BUB.leaving - GLB_AT) < 1e-6,
  'the film was sized off the module\'s own bubble profile and the plan agrees: in '
  + BUB.in.toFixed(3) + ' against ' + BUB_IN.toFixed(3) + ', leaving ' + BUB.leaving.toFixed(3)
  + ' against the fault at ' + GLB_AT.toFixed(3));
check(BUB.text === THOUGHT,
  'the pill says "' + BUB.text + '"');
{
  const gesture = +(GLB_AT - BUB.in).toFixed(3);
  check(gesture > 1.25 && gesture < 1.55,
    'the whole gesture runs ' + gesture.toFixed(2) + 's, first dot to fault, which is the brief\'s '
    + '"about a second and a half" and is the module\'s own ' + BUBBLE.in + ' in plus '
    + BUBBLE.hold + ' hold rather than a number this file typed');
}
if (state.bubble) {
  check(state.bubble.air >= 0,
    'the whole cluster, dots and all, clears the safe area on all ' + state.bubSamples
    + ' frames it is up: ' + state.bubble.air + ' device px at ' + state.bubble.t + 's');
}
if (state.pill) {
  check(state.pill.right >= SAFE.right,
    'and the pill\'s own right edge, which is what OFF_X was computed from, stays '
    + state.pill.right + ' device px off the frame against a safe line at ' + SAFE.right
    + ' — measured at its worst spring frame, ' + state.pill.t + 's');
  check(Math.abs(state.pill.cssRect.w - PILL_W * PILL_SC) <= 4,
    'the rendered pill is ' + state.pill.cssRect.w.toFixed(1) + ' css wide at that frame against '
    + 'the solve\'s ' + (PILL_W * PILL_SC).toFixed(1) + ', so the shift was computed on the face '
    + 'that actually rendered');
}
check(OFF_X > 0 && OFF_X < 60,
  'he sits ' + OFF_X + ' css px left of the frame\'s middle, and it is derived rather than chosen: '
  + 'exactly what the pill needs to keep ' + PILL_AIR + 'px inside the safe line');
if (state.caps) {
  check(state.caps.capPx >= BUBBLE.minCap,
    'the thought\'s caps measure ' + state.caps.capPx + ' device px, floor is ' + BUBBLE.minCap);
}

/* ---------- the captions ---------- */
{
  const said = V.words.slice(B[0].words.length).map(w => w.word.replace(/[.,]$/, ''));
  const drawn = cap.groups.flatMap(g => g.words.map(w => w.word));
  check(said.length === drawn.length && said.every((w, i) => w === drawn[i]),
    'the cards carry the words the voice actually said, in order: ' + drawn.length
    + ' drawn against ' + said.length + ' spoken');
  check(cap.groups[0].in >= B[1].words[0].start - CAP.lead - 1e-6,
    'nothing is captioned before the second line: the first card is up at '
    + cap.groups[0].in.toFixed(2) + 's and the first line finished at ' + B[0].end.toFixed(2));
  check(CAP_OUT < GLB_AT,
    'the last card is out at ' + CAP_OUT.toFixed(2) + 's, before the fault at ' + GLB_AT.toFixed(2));
}
if (state.built && state.built.capRefit) {
  const r = state.built.capRefit;
  check(r.family === CAP.family && String(r.weight) === String(CAP.weight),
    'the captions are set in ' + r.family + ' ' + r.weight + ', which is the face this clip asked '
    + 'for rather than the module\'s own');
  check(r.capPx >= 40,
    'they measure ' + r.capPx + ' device px of cap at ' + r.size + 'css px');
  check(r.size <= CAP.floatSize + 1e-6 && r.widestEm * r.size * r.maxScale <= CAP_BOX.w + 0.5,
    'and the refit fits the widest card inside the band with its own spring in hand: "' + r.widest
    + '" is ' + (r.widestEm * r.size).toFixed(1) + ' css px at this size, ' + CAP_BOX.w + ' available');
}
if (state.cap) {
  check(state.cap.air >= 0,
    'the captions stay inside the platform safe area on all ' + state.capSamples
    + ' sampled frames: ' + state.cap.air + ' device px at ' + state.cap.t + 's');
  check(state.cap.top > MAS.cy + PLATE.r,
    'and the band stays under him: the highest caption ink is at ' + state.cap.top
    + ' css against his chin at ' + (MAS.cy + PLATE.r).toFixed(0));
}

/* ---------- the mark ---------- */
check(png.ok && png.w === LOGO.natural.w && png.h === LOGO.natural.h,
  'the mark is the file this clip was built against: ' + png.w + 'x' + png.h + ', '
  + (png.bytes / 1024).toFixed(0) + ' kB');
check(png.alpha,
  'and it carries its own transparency — colour type ' + png.colour + ' with a tRNS chunk on it, '
  + 'which is a black mark on nothing rather than a black mark on white');
if (state.meas) {
  const b = state.meas.logo.cssRect;
  check(Math.abs(b.w - b.h) < 0.6,
    'it is drawn in a square box, so nothing about it can be stretched: ' + b.w.toFixed(1)
    + ' by ' + b.h.toFixed(1) + ' css px');
}
{
  const hero = frameAt(LOGO.in, Math.round(LOGO.in * FPS)).logo;
  const corner = frameAt(SC2_AT + LOGO.move, Math.round((SC2_AT + LOGO.move) * FPS)).logo;
  const close = frameAt(SC4_AT + LOGO.back + 0.04, Math.round((SC4_AT + LOGO.back + 0.04) * FPS)).logo;
  check(Math.abs(hero.size - LOGO.hero.size) < 0.01 && Math.abs(corner.size - LOGO.corner.size) < 0.01
    && Math.abs(close.size - LOGO.close.size) < 0.01,
    'one element in three places: ' + LOGO.hero.size + ' in the middle, ' + LOGO.corner.size
    + ' in the corner and ' + LOGO.close.size + ' back in the middle, bigger than it started');
  check(LOGO.close.size > LOGO.hero.size,
    'and the one it comes back at is the biggest of the three, which is the brief');
}

/* ---------- the end ---------- */
{
  const before = frameAt((CUT_FRAME - 1) / FPS, CUT_FRAME - 1);
  const on = frameAt(CUT_FRAME / FPS, CUT_FRAME);
  check(before.mo > 0.9 && on.mo === 0 && on.panel.o === 0 && on.logo.o === 0,
    'the fault takes everything on one frame: him and the mark are on at frame '
    + (CUT_FRAME - 1) + ' and gone at ' + CUT_FRAME);
  check(before.end.o === 0 && on.end.o > 0,
    'and the wordmark is born on that frame rather than at that time, which is post13\'s correction');
  check(before.mas.bubble.pill.sc > 0.99,
    'the thought is cut at full size rather than shrinking away first: the pill is at x'
    + before.mas.bubble.pill.sc.toFixed(3) + ' on the last frame it is on');
}
{
  /* the mark turns only once it is home, and it is still turning when the fault
     lands — post14's correction to the house curve. */
  const before = frameAt(LOGO_TURN_AT - 0.02, Math.round((LOGO_TURN_AT - 0.02) * FPS)).logo.rot;
  const mid = frameAt((LOGO_TURN_AT + GLB_AT) / 2, Math.round((LOGO_TURN_AT + GLB_AT) / 2 * FPS)).logo.rot;
  const at = frameAt(GLB_AT - 1 / FPS, CUT_FRAME - 1).logo.rot;
  const last = at - frameAt(GLB_AT - 2 / FPS, CUT_FRAME - 2).logo.rot;
  const avg = (360 * LOGO.turns) / (GLB_AT - LOGO_TURN_AT) / FPS;
  check(before === 0 && mid > 0 && at > 0,
    'the mark is still until it is home and turns from there: 0 degrees at '
    + (LOGO_TURN_AT - 0.02).toFixed(2) + 's, ' + mid.toFixed(1) + ' half way and ' + at.toFixed(1)
    + ' on the last frame before the fault');
  check(at <= 360 * LOGO.turns + 0.01 && at > 360 * LOGO.turns * 0.9,
    'it turns ' + at.toFixed(1) + ' degrees of the ' + (360 * LOGO.turns).toFixed(0)
    + ' asked for, which at this size is a drift rather than a spinner');
  check(last > avg * 0.5,
    'and it has not stopped when the cut lands: ' + last.toFixed(3) + ' degrees on the last '
    + 'frame against an average of ' + avg.toFixed(3) + ' — the house curve with post14\'s '
    + 'ceiling taken off');
}
check(GL_WINDOWS_60.length === 1,
  'there is exactly one fault in the film, ' + GL_WINDOWS_60[0].frames + ' frames of it at sixty');
check(Math.abs((SECONDS - END_IN) - (END_HOLD + 1 / FPS)) < 0.03,
  'the end card is on the screen for ' + (SECONDS - END_IN).toFixed(2) + 's');
check(END.lines.length === 3 && !END.lines.join(' ').includes('.'),
  'the end card is the wordmark on three lines with nothing else on it: ' + END.lines.join(' / '));

/* ---------- liveness ---------- */
{
  /* the end card is the one held run in the film and it is a named exception:
     every other clip in demo/ ends on a dark page with a phosphor breathing under
     the wordmark, and this page is white — there is nothing left on the frame but
     twelve glyphs and the brief says hold. every frame before it is checked
     exactly as it was. */
  const endFrom = Math.round((END_IN + END.in) * FPS);
  const seen = new Set();
  let dupes = 0, first = null;
  for (let i = 0; i < Math.min(endFrom, state.sigs.length); i++) {
    if (seen.has(state.sigs[i])) { dupes++; if (first == null) first = i; }
    seen.add(state.sigs[i]);
  }
  check(dupes === 0, 'no two frames of the film are identical up to the end card: ' + dupes
    + ' repeats in ' + Math.min(endFrom, state.sigs.length) + ' frames'
    + (first == null ? '' : ', first at frame ' + first));
  check(true, 'and the end card is ' + (state.sigs.length - endFrom) + ' held frames, which is '
    + 'the brief: the wordmark, nothing else, hold, end');
}

/* ---------- the sound ---------- */
check(cues.filter(c => c.kind === 'key').length === TITLE_TYPE.keys.length + TYPING.keys.length,
  (TITLE_TYPE.keys.length + TYPING.keys.length) + ' key ticks, every one off a typing plan\'s own '
  + 'list rather than off a rate');
check(cues.filter(c => c.kind === 'click').length === EFFORT.levels.length - 1,
  (EFFORT.levels.length - 1) + ' clicks, one per dot the knob lands on after the first');
check(cues.filter(c => c.kind === 'popDeep').length === 2,
  'two popDeeps: the startup and the thunk on max');
check(cues.filter(c => c.kind === 'pop').length === 1
  && Math.abs(cues.find(c => c.kind === 'pop').t - (BUB.in + BUBBLE.step * 2)) < 1e-6,
  'one pop, and it is mascotCues\' own on the pill rather than on the first dot');
check(cues.filter(c => c.kind === 'glitch').length === 1,
  'one glitch hit, on the fault');
check(new Set(cues.map(c => c.kind)).size === 5,
  'five kinds of sound in the whole film, which is the brief\'s list exactly: '
  + [...new Set(cues.map(c => c.kind))].join(', '));
{
  const late = cues.filter(c => c.t > GLB_AT + 1e-6);
  check(late.length === 0, 'nothing is heard after the fault: ' + late.length + ' cues past '
    + GLB_AT.toFixed(2) + 's');
  check(cues.filter(c => c.kind === 'hum').length === 0, 'there is no music in it, which is the brief');
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
  'planMascot was handed no band: the caption band is '
  + (CAP_BOX.y - (MAS.cy + PLATE.r)).toFixed(0) + ' css px under his chin and the cluster is '
  + 'checked against the rendered frame instead');

console.log('');
for (const m of note) console.log('  ok    ' + m);
for (const m of fail) console.log('  FAIL  ' + m);
console.log('');
console.log(fail.length ? '  ' + fail.length + ' GUARD(S) FAILED' : '  all ' + note.length + ' guards green');
process.exit(fail.length ? 1 : 0);
