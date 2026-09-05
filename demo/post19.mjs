/* the boring tek — post19, which ai do you use.

   about nine seconds on black, 1080x1920. a chat panel asks the question, the
   model name flicks through five of them with their marks over it, the mascot
   gets dizzy following the label, the signal breaks and he lands in the middle
   of the frame flat as gum with the answer over his head: all of them.

     node post19.mjs                      1080x1920, 60fps, dark
     DEMO_FPS=12 node post19.mjs          the fast preview pass
     node post19.mjs --blur               60fps with the shutter open
     node post19.mjs --plan               every number printed, nothing rendered
     node post19.mjs --stills             the readable frames only, no video
     node post19.mjs --keep-frames        leave the jpegs on disk
     node post19.mjs --encode-only        re-encode from kept frames

   out to demo/out/post19-dark-1080x1920.mp4.

   post17 is the template: its panel, its dark tokens, its two faults, its
   wordmark and its `bubbleTime`. post18 is the template for the captions, the
   gaze layer and the shape of the guards. `lib/` is untouched by both and by
   this one.

   ---------- the five marks are placed, and they are measured first ----------

   `demo/assets/logo-*.png` are somebody else's and they are placed as
   backgrounds: no filter, no recolour, no redraw, nothing in this file reaches
   their pixels. **the brief calls them white on transparent and they are not** —
   they are five app icons, tiles and all. see the note on LOGOS for what that
   costs and for the one thing that would fix it.

   **fitting them "to the same height" is not the same as drawing them in the
   same box.** all five files are square, and the ink inside the square is not:
   claude fills 82% of its canvas, grok 54%. drawn in one 88px box the grok mark
   would render two thirds the size of the claude one and the row would read as
   five logos at five sizes. so every file is decoded once per run with ffmpeg
   and its alpha bounding box is measured, and each element's box is then solved
   so that **the ink** is `LOGOS.ink` css px tall and its own centre lands on the
   one spot. the box keeps the file's natural ratio to the last decimal, so
   nothing can be stretched, and the guard re-checks all five inks land on the
   same height and the same centre.

   ---------- the label is on the right and it is the payload ----------

   the brief puts the plus on the left and the mic, the waveform and the model
   label on the right. the label is the **rightmost** of the three, and that is
   this file's call rather than the brief's: the panel is 400 css px wide and its
   right hand group starts near the middle of the frame, so a label sitting
   inside the icons would cycle five names across the frame's own centre line —
   directly over the mascot's head, with nothing for him to turn toward. at the
   far right it is 80 css px off his centre line, which is a head turn.

   it is set at 24 css px, which measures 34 device px of cap against the house's
   32 floor. that is large for a piece of chrome and it is deliberate: the five
   names are what the clip is about, and a 15px model picker is a detail rather
   than a beat. the name sits in a cell as wide as the longest of the five,
   right aligned, so `ChatGPT` arriving cannot shove `Medium` sideways — post18's
   fixed cell, and the guard measures both.

   ---------- one plan, two sizes, and the card is what changes ----------

   he is at post12's centre size, 148, for the landing, and at his corner size,
   120, under the panel. `planMascot` takes one size, so the plan is made at 148
   and the first half of the film scales the **card** by 120/148 — which is the
   same seam post17's alive layer and post18's gaze layer are composed on, and
   the seam `headRect` and every clearance downstream already read. the plate
   centre is the zone centre to the unit, so scaling the card scales the head
   about its own middle and moves nothing.

   the bubble is a sibling of the card rather than a child of it, so it is not
   scaled — and it does not need to be: it is only ever up in the second half,
   at full size. the guard says so rather than assuming it.

   ---------- the smash ----------

   the fall is `p²`, because that is what gravity is and no bezier says it more
   clearly. he stretches a tenth on the way down, hits, compresses to 1.52 wide
   by 0.66 tall over 70ms, and springs out of it on a damped cosine that goes
   below zero exactly once — one stretch on the way back at a tenth of the
   compression, then a settle under one per cent of it.

   **the chin stays on the ground while he is flat**, and that is arithmetic
   rather than an extra channel: a card scaled about its own centre would lift
   its own bottom edge by the height it lost, so the same frame that writes the
   squash writes `R * (1 - sy)` of downward offset against it. without it he
   reads as a balloon being squeezed in mid air instead of as a thing landing.

   ---------- the answer is held past the module's ceiling ----------

   `bubbleAt` caps a single bubble's hold at `BUBBLE.hold`, which is 0.90s, so
   from outside the module that is the longest a pill can be up. the read's
   second line runs 3.35s and the pill has to still be on the frame when it
   finishes, so post17's `bubbleTime` is here unchanged: real time until the
   module's own hold runs out, then its own last fully up bubble frame for
   `HOLD_EXTRA`, then real time again shifted by it. nothing else on the face is
   held — the idle layer, the breath and the spring out of the smash all run on
   the clip's own clock underneath it, and the liveness signature proves it.

   `HOLD_EXTRA` is derived rather than typed: it is exactly the distance from the
   module's own leaving frame to the fault, and the fault is the read's own last
   sound plus a beat.

   ---------- it runs about nine seconds and the brief asked for eight ----------

   three things in the brief are fixed lengths and they add up before anything
   else is drawn: the question is 1.33s of sound, the label cycle is five stops
   half a second apart and therefore 2.00s with no voice on it, and the answer is
   3.35s. that is 6.7s of content the brief specified, and on top of it the film
   still has to raise a panel, break the signal twice, drop a mascot, hold a
   thought and show a wordmark.

   it lands at 8.65. the number is printed on every run and the two cuts
   that would take it under eight are printed with it, because neither of them is
   free: dropping `the boring part is knowing which one for what` buys 2.4s and
   the whole point of the clip, and taking the cycle to 0.36s a stop buys 0.56s
   and stops reading as a picker being flicked through.

   ---------- and four things the frames changed after the guards were green ---

   every one of these was found by looking at a rendered frame, which is what the
   frames are for.

   **the fall is 0.47s rather than 0.36 and it starts on the fault's own first
   frame.** the shutter is what set it: 52 css px on one frame came out of the
   blend as four stacked copies of a face rather than as a smear. see DROP — the
   landing does not move, so nothing downstream of it does either.

   **the panel came 6 css px off the safe line on each side.** post17 takes the
   full safe width and the margin pass put its border exactly on the rectangle, 0
   px in hand, on the side the platform hangs its buttons down.

   **the mark swap became a hard cut.** it was a 90ms crossfade, which is right
   for a transparent mark and wrong for these: two opaque tiles at half opacity is
   one printed through the other, and the frame showed grok through copilot.

   **the module's shadow is turned off.** on dark it paints a pale ellipse that
   nothing but the head was hiding, and the fall takes the head away for a third
   of a second. see the rule in the page for why that is the module's own intent.

   **the cards are four words wide with three breaks the read does not carry.**
   three to a card cut this copy into `which ai do`, `is knowing which` and
   `one for what`. see CARD_BREAKS.
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
  STATES, STAGE, SAFE, HEAD_PX, HEAD, BUBBLE,
} from './lib/mascot.mjs';
import { speak, VOICE_OUT } from './lib/voice.mjs';
import {
  renderSfx, writeWav, applyGain, limit, decode, mixdown, voiceEnvelope,
  loudness, describeMix, checkUnderVoice, dbfs, SR,
} from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const ASSETS = path.join(HERE, 'assets');

const TAG = 'post19-dark';
const FRAMES = path.join(OUT, 'frames-' + TAG);
const SUBS = path.join(OUT, 'subframes-' + TAG);
const VERIFY = path.join(OUT, 'verify-post19');
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
   sees is not 480. he lands on it and the wordmark replaces him on it. */
const CENTRE_Y = (SAFE_CSS.top + (VH - SAFE_CSS.bottom)) / 2;

/* post12's centre size for the landing and his corner size for the panel scene.
   the plan is made at the first and the card is scaled to the second — see the
   header. */
const SIZE = 148;
const CORNER = 120;

/* ==========================================================================
   the read
   ==========================================================================
   two lines, one take each.

   the first is on the voice's own rate and pitch, written out rather than left
   off: the brief asks for the question to be read naturally and `calm`'s own
   -8% is already what this house means by natural. it is spelled here because
   `speak()` resolves the default before it caches, so a line that left them out
   would refetch on every run rather than hit the cache.

   the second is a shade quicker with the pitch up, because it is the answer
   rather than the question and an answer is delivered rather than read.

   `gap` is the silence **after** the line, measured on the waveform. the first
   one is not a breath: it is the whole label cycle plus the fault plus the fall,
   and it is derived off those rather than typed. */
const LINES = [
  { text: 'which ai do you use?', rate: '-8%', pitch: '-2Hz', gap: null },
  { text: 'all of them. the boring part is knowing which one for what',
    rate: '+2%', pitch: '+2Hz', gap: null },
];
const VOICE = 'calm';
const VOICE_AT = 0.46;
const SILENCE_DB = -42;
const PRE = 0.06, POST = 0.10, EDGE_FADE = 0.012;

/* ==========================================================================
   the frame
   ========================================================================== */

/* ---------- the five marks ----------
   one spot at the top, one element per file, and every geometry number in the
   row is solved at run time off the file's own measured ink. see the header.
   `ink` is how tall the ink is, in css px, and it is the only number here that is
   a decision.

   **the brief describes these files as white on transparent and they are not.**
   what is on disk is five app icons: a rounded tile each, four of them on white
   or near white and grok's on sage, two of them (claude and copilot) carrying
   their own wordmark inside the tile. the brief also says place them as images
   and never redraw or recolour, so that is what happens — they are placed as
   they are and the mismatch is reported rather than painted over.

   it costs two things worth knowing about. the row is five bright tiles on a near
   black frame rather than five white marks in the page's own light, and the
   claude and copilot tiles say the name the label under them is already saying.
   swapping the files for actual transparent marks would fix both and change no
   code: the measurement below reads whatever is on disk. */
const LOGOS = {
  cx: 270, cy: 158, ink: 88,
  files: [
    { key: 'claude', name: 'Claude', file: 'logo-claude.png' },
    { key: 'gemini', name: 'Gemini', file: 'logo-gemini.png' },
    { key: 'chatgpt', name: 'ChatGPT', file: 'logo-chatgpt.png' },
    { key: 'grok', name: 'Grok', file: 'logo-grok.png' },
    { key: 'copilot', name: 'Copilot', file: 'logo-copilot.png' },
  ],
  in: 0.24,             /* the pop, with the spring's own overshoot on it */
  from: 0.72,           /* the size it springs up from */
};

/* ---------- the chat panel ----------
   post17's, unchanged in every rule that draws it: a rounded panel a shade above
   the page, a hairline outline, the page's own ink as its type, a plus in a ring
   on the left, a mic and a waveform on the right. what is new is the model
   label, which is the rightmost thing in the row — see the header.

   one line of type rather than post17's two, because the question is twenty
   characters. the text block is top anchored and the controls row is bottom
   anchored, so a line growing from nothing cannot move the row under it. */
const PANEL = {
  /* **six css px in from the safe line on each side, which is post17's panel one
     step narrower.** post17 takes the full safe width and its argument holds — a
     panel much narrower than this reads as a screenshot of a window rather than
     as the thing itself — but the margin pass put its border exactly on the line
     with nothing in hand, and the right hand line is where the platform hangs its
     button column. twelve device px is not a lot; it is the difference between
     under the buttons and beside them. */
  inset: 6,
  y: 240,
  radius: 22, pad: 20,
  textSize: 26, lineHeight: 1.32, lines: 1,
  plus: 24, rowH: 30, iconGap: 16,
  placeholder: 'Ask anything',
  typed: 'which ai do you use?',
  at: 0.06, in: 0.30,
  keyEvery: 3,          /* one tick per this many characters, plus the two ends */
  minCapPx: 32,
  minRoom: 12,
  /* the caret blinks on the clip's own clock rather than on a css animation: a
     square wave, because that is what a text caret does. */
  caretFor: 1.06,
};
PANEL.x = SAFE_CSS.left + PANEL.inset;
PANEL.w = VW - 2 * (SAFE_CSS.left + PANEL.inset);
PANEL.textH = +(PANEL.lines * PANEL.textSize * PANEL.lineHeight).toFixed(2);
PANEL.h = +(PANEL.pad * 2 + PANEL.textH + 18 + PANEL.rowH).toFixed(2);
PANEL.bottom = +(PANEL.y + PANEL.h).toFixed(2);
PANEL.room = +(PANEL.h - PANEL.pad * 2 - PANEL.textH - PANEL.rowH).toFixed(2);

/* ---------- the model label ----------
   `Claude` in the page's own ink at 24 css px and `Medium` after it, smaller and
   in the muted token, which is the site's own grey. the name cycles and the
   effort word does not, which is the brief. */
const MODEL = { size: 24, effSize: 16, eff: 'Medium', gap: 7 };
const CYCLE = {
  step: 0.50,           /* between two stops, which is the brief's half second */
  lead: 0.12,           /* after the question's own last sound, the first stop */
  /* on the last name, before the signal breaks. it is not a pause: it is the
     room the dizziness needs, and `DIZZY.for` is measured back off the fault, so
     shortening this shortens the reel. */
  hold: 0.46,
};

/* ---------- the fall and the smash ----------
   see the header. `from` is far enough that his chin is off the top of the frame
   on the frame the fall starts, worked against the landing rather than guessed:
   at rest his chin is at CENTRE_Y + R, and R is 69.4 at this size.

   `k` is the compression as a ratio: the card goes 1+k wide and 1/(1+k) tall, so
   0.52 is 1.52 by 0.66. `damp` and `cycles` are the spring out of it — one zero
   crossing, so there is exactly one stretch on the way back and then rest. */
/* ---------- and the length of the fall is a shutter number ----------
   the first cut fell in 0.36s, which is 560 css px covered at 3100 a second and
   **52 css px on the frame it lands**. with the shutter open at four subframes
   that is 25 device px between one sample and the next on a head whose eyes are
   19 device px tall, so the smear came out as four stacked copies of a face
   rather than as a blur. eight subframes would have fixed it and the render was
   killed for memory on this machine at 4152 captures.

   so the fall is 0.47s and it starts on the fault's own first frame rather than
   half way through it, which is where the extra 0.11s comes from — **the landing,
   and therefore every number after it, does not move at all.** the peak is 40 css
   px a frame now, which is 13 device px between samples at six subframes, and
   the samples overlap. he also falls through the whole tear rather than through
   the back half of it, which is the better read of the two anyway.

   `from` is a floor rather than a taste: his chin at rest is at CENTRE_Y + R, so
   anything under about 540 starts the fall with part of him already on the
   frame. */
const DROP = { from: 560, lead: 0, for: 0.47, voiceLead: 0.18 };
const SMASH = { air: 0.10, flat: 0.07, back: 0.42, k: 0.52, damp: 4.2, cycles: 1.15 };

/* ---------- the thought ----------
   three words, the module's own placement over the crown, and the module's own
   0.48 in plus 0.90 hold — which is the brief's "about a second and a half" to
   within a twentieth. what this file adds after that is `HOLD_EXTRA`, derived
   below, and it is the same held frame rather than a second animation. */
const THOUGHT = 'all of them.';

/* measured on the rendered faces at font size 1 rather than estimated off an em
   ratio, and every one of them is re-measured in the page on every run. */
const TYPE = {
  bub: 5.4253,          /* "all of them.", Space Grotesk 500 */
  name: 4.1092,         /* "ChatGPT", Space Grotesk 500, the longest of the five */
};
const PILL_W = +(TYPE.bub * BUBBLE.size + 2 * BUBBLE.padX + 2 * BUBBLE.stroke).toFixed(2);
/* how much clear frame the cluster keeps inside the safe line. the one number in
   the shift that is a decision rather than arithmetic. */
const PILL_AIR = 4;
/* the name's cell, as wide as the longest of the five plus a hair, so counting
   through them cannot move the word after it. */
const NAME_CELL = +(TYPE.name * MODEL.size + 2).toFixed(1);

/* ---------- the caption band ----------
   one home, bottom anchored, and it does not move for either line. **both lines
   are captioned**, including the one the panel is typing at the same time, which
   is the brief saying so outright — post18 dropped a caption for exactly that
   reason and this one is asked for.

   the face is Manrope ExtraBold rather than the module's Space Grotesk 700, and
   the fit is redone in the page against the face that actually renders. see
   `capRefit`. */
const CAP_BOX = { x: 70, y: 680, w: 400, h: 130 };
const CAP = {
  style: 'float', perCard: 4, floatSize: 42, lead: 0.10, hold: 0.24, bodyGap: 0.30,
  family: 'Manrope', weight: 800, tracking: -0.015,
};
/* ---------- where the cards break ----------
   three words to a card and nothing else said cut this read into `which ai do` /
   `you use`, `the boring part` / `is knowing which` / `one for what` — three
   fragments that were never phrases, and `which | one` split down the middle is
   exactly the failure the house checklist names.

   so the cards are four words wide and the read is given three break points it
   does not carry punctuation for: after `ai`, after `is`, after `one`. that lands
   `which ai` / `do you use` / `all of them` / `the boring part is` /
   `knowing which one` / `for what`, and every one of those is a phrase somebody
   would pause after.

   the mechanism is the one `markLines` already uses for the seam between the two
   lines: a comma on the caption's copy only, after the synthesiser has spoken,
   which `cardBreak` breaks on and which is dropped again before a card is drawn.
   nothing about the audio or the timing can move. */
const CARD_BREAKS = ['ai', 'is', 'one'];

/* ---------- the wordmark ----------
   post17's, unchanged: three lines on the middle of the safe band, in michroma,
   fitted in the page. no domain under it, which is the brief. */
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 330, lh: 1.16, minCapPx: 56 };
const END_HOLD = 0.90;

/* ---------- the two faults ----------
   post17's, which is post12's table at full heat. the first takes the panel, the
   marks and him; the second takes everything and leaves the wordmark.

   the fall starts half way through the first one, so he comes out of the tear
   rather than after it. */
const GL = {
  shakeX: 15, shakeY: 8,
  split: 9.5,
  bandDx: 88, bands: 3,
  noise: [0.10, 0.24],
  flash: 0.30, flashSize: 420,
  calmFrom: 0.86,
};
const GLA = { for: 0.22 };
const GLB = { for: 0.32 };

/* crf 17, post12's through post17's: this frame is nearly all flat black with
   soft glows across it, which is exactly what a codec bands, and there is no
   film grain here to dither it. */
const CRF = 17;

/* ---------- the mix ----------
   post17's rig: the read on top, a small bus of effects under it ducked while a
   word is being said, and a loudness loop that keeps its best pass rather than
   its last. no music, which is the brief. */
const TARGET_LUFS = -14;
const PEAK_CEILING = -1.0;
const WAV_CEILING = -1.5;
const DUCK = 0.60;
const VOICE_TRIM = -1.5;
const MAX_REDUCTION = 5.0;
/* the window the film can honestly be with these three fixed lengths in it. see
   the header for the arithmetic and for the two cuts that would move it. */
const RUN = { min: 8.1, max: 9.1 };

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
/* gravity, and it is written as what it is rather than as a bezier that looks
   like it. a thing falling covers distance as the square of the time. */
const FALL = p => p * p;
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, p) => a + (b - a) * p;

function prng(seed) {
  let x = seed | 0 || 0x1a2b3c;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x |= 0; return (x >>> 0) / 4294967296; };
}

/* a burst is a length in seconds, quantised to the grid that is rendering:
   post11's rule. a 220ms fault is thirteen frames at sixty and 2.6 at twelve, so
   written as seconds and left alone it would be a different event on the preview
   pass. */
function onGrid(t, len, fps) {
  const f0 = Math.round(t * fps);
  const n = Math.max(1, Math.round(len * fps));
  return { t0: f0 / fps, t1: (f0 + n) / fps, frames: n };
}

/* ==========================================================================
   the marks, measured
   ==========================================================================
   the png header for the facts about the file, and ffmpeg for the alpha bounding
   box: a decode to raw rgba and one scan. it is the only way to know how much of
   a square canvas a mark actually fills, and without it "the same height" is a
   claim about five boxes rather than about five logos. */
function pngFacts(file) {
  const b = fs.readFileSync(file);
  const png = b.length > 24 && b.readUInt32BE(0) === 0x89504e47;
  if (!png) throw new Error(path.relative(ROOT, file) + ' is not a png');
  let o = 8, alpha = false;
  const colour = b[25];
  while (o < b.length - 8) {
    const len = b.readUInt32BE(o);
    const t = b.toString('ascii', o + 4, o + 8);
    if (t === 'tRNS') alpha = true;
    if (t === 'IEND') break;
    o += 12 + len;
  }
  if (colour === 4 || colour === 6) alpha = true;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), bytes: b.length, colour, alpha };
}

function inkBox(file, w, h) {
  const raw = execFileSync(ffmpeg,
    ['-v', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'],
    { maxBuffer: 1 << 28 });
  if (raw.length !== w * h * 4) {
    throw new Error(path.relative(ROOT, file) + ' decoded to ' + raw.length
      + ' bytes against ' + (w * h * 4) + ' — the header and the pixels disagree');
  }
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (raw[(y * w + x) * 4 + 3] <= 10) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) throw new Error(path.relative(ROOT, file) + ' is empty — every pixel is transparent');
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/* one element's whole geometry, in css px, solved so the ink is LOGOS.ink tall
   and its own centre lands on the spot. the box keeps the file's natural ratio,
   so nothing about the mark can be stretched. */
const MARKS_FILES = LOGOS.files.map(f => {
  const file = path.join(ASSETS, f.file);
  if (!fs.existsSync(file)) {
    throw new Error('no ' + path.relative(ROOT, file) + ' — the marks are assets, not '
      + 'something this file draws');
  }
  const p = pngFacts(file);
  const ink = inkBox(file, p.w, p.h);
  const sc = LOGOS.ink / ink.h;
  const box = { w: +(p.w * sc).toFixed(3), h: +(p.h * sc).toFixed(3) };
  return {
    ...f, file, ...p, ink, sc: +sc.toFixed(6), box,
    left: +(LOGOS.cx - (ink.x + ink.w / 2) * sc).toFixed(3),
    top: +(LOGOS.cy - (ink.y + ink.h / 2) * sc).toFixed(3),
    inkW: +(ink.w * sc).toFixed(2), inkH: +(ink.h * sc).toFixed(2),
    fill: +(ink.h / p.h).toFixed(4),
  };
});
const NAMES = MARKS_FILES.map(m => m.name);

/* ---------- and where the ink is, rather than where the box is ----------
   the element is the whole square canvas and most of it is nothing: grok's mark
   fills 54% of its file, so its box reaches 38 css px past its own ink on every
   side. a safe area check that measured the box would report a mark outside the
   margins that is comfortably inside them, and moving it to satisfy that would
   put the row off centre.

   so the row is measured as ink. the box is checked against node's own solve in
   the guards — that is what catches a css mistake — and the clearance is checked
   against this, which is the only rect a viewer can see. `sc` is the frame's own
   spring, about the box's centre, so the pop's overshoot is in it. */
function markInk(m, sc) {
  const cx = m.left + m.box.w / 2, cy = m.top + m.box.h / 2;
  const x = cx + (m.left + m.ink.x * m.sc - cx) * sc;
  const y = cy + (m.top + m.ink.y * m.sc - cy) * sc;
  const w = m.inkW * sc, h = m.inkH * sc;
  return {
    cssRect: { x: +x.toFixed(2), y: +y.toFixed(2), w: +w.toFixed(2), h: +h.toFixed(2) },
    left: +(x * DSF).toFixed(1), top: +(y * DSF).toFixed(1),
    right: +((VW - x - w) * DSF).toFixed(1), bottom: +((VH - y - h) * DSF).toFixed(1),
  };
}

/* ==========================================================================
   the voice
   ==========================================================================
   one take per line, cached, and the delivery is part of the cache key: the copy
   is one half of what a take is and the rate and the pitch are the other. */
async function take(i) {
  const L = LINES[i];
  const name = 'post19-l' + String(i + 1).padStart(2, '0');
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
   off the word list: the synthesiser's WordBoundary carries a duration shorter
   than the sound, so a gap trusted to the word list is not the gap in the file. */
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

/* the two takes on one clock. `gapFor` is handed the beats laid down so far and
   works the next silence out of the same numbers the picture is drawn from,
   floored at the line's own written gap. */
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
   post17's: each word's characters are laid across **that word's own spoken
   span**, so the letters of a word appear while the word is being said, and the
   space in front of a word lands in the silence in front of it. the panel's copy
   and the read's copy are the same five words, which is what makes it one event
   rather than two of the same length. */
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
    if (k > 0) at[a - 1] = +(words[k - 1].end + (w.start - words[k - 1].end) * 0.35).toFixed(4);
  }
  for (let i = 0; i < at.length; i++) {
    if (at[i] == null) throw new Error('character ' + i + ' of "' + text + '" was never placed');
    if (i && at[i] < at[i - 1]) throw new Error('the typing goes backwards at character ' + i);
  }
  /* one tick per `keyEvery` characters plus the two ends, which is post11's
     number and post11's reason: twenty sounds inside a second is a rattle, and
     the ends are where the rhythm starts and stops. */
  const keys = [];
  for (let i = 0; i < at.length; i++) {
    if (text[i] === ' ') continue;
    if (i === 0 || i === at.length - 1 || i % PANEL.keyEvery === 0) keys.push(at[i]);
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
   every number below is derived off the read, and the scene boundaries are
   written once as functions of the beats so that `gapFor` — which needs them
   before the takes are laid down — and the constants under them read the same
   expressions. */
const bareOf = s => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
function word(beat, name) {
  const w = beat.words.find(x => bareOf(x.word) === name);
  if (!w) {
    throw new Error('"' + name + '" is not in "' + beat.text + '" — the picture is cut to '
      + 'the read by word, so a rewrite has to move the beat with it');
  }
  return w;
}

const cycleAt = b => +(b[0].sound.end + CYCLE.lead).toFixed(4);
const clickAt = (b, i) => +(cycleAt(b) + i * CYCLE.step).toFixed(4);
const glaAt = b => +(clickAt(b, NAMES.length - 1) + CYCLE.hold).toFixed(4);
/* the fall starts on the fault's own first frame and lands a beat after it
   clears, so he falls through the whole tear. see DROP. */
const dropAt = b => +(glaAt(b) + DROP.lead).toFixed(4);
const landAt = b => +(dropAt(b) + DROP.for).toFixed(4);

function gapFor(i, beats) {
  const floor = LINES[i].gap == null ? 0.24 : LINES[i].gap;
  const soundEnd = beats[i].sound.end;
  let want = floor;
  /* the answer starts a breath before he hits, so "all" is in the air and "them"
     lands on the splat. */
  if (i === 0) want = landAt(beats) - DROP.voiceLead - soundEnd;
  return +Math.max(floor, want).toFixed(4);
}

const TAKES = [];
for (let i = 0; i < LINES.length; i++) TAKES.push(await take(i));
const V = buildVoice(TAKES, gapFor);
const B = V.beats;

/* the cards, planned here rather than with the rest of the caption layer, because
   the fault is derived off the last one: a signal breaking through a caption that
   is still on the frame is a cut landing on a word. `markLines` is a function
   declaration below and the plan is two lines of it — see that section for what
   the marking is for. */
const CUT = markLines(B);
const cap = planCaptions(CUT.words, {
  style: CAP.style, perCard: CAP.perCard, floatSize: CAP.floatSize,
  cardBreak: /[.!?,;:]["')\]]?$/,
  lead: CAP.lead, hold: CAP.hold, bodyGap: CAP.bodyGap,
});
const CAP_OUT = +Math.max(...cap.groups.map(g => g.out)).toFixed(4);

/* ---------- and now every number in the film, once ---------- */
const TYPING = typeToWords(PANEL.typed, B[0].words, 0x19c4a7);
const CLICKS = NAMES.map((_, i) => clickAt(B, i));
const GLA_AT = glaAt(B);
const DROP_AT = dropAt(B);
const LAND_AT = landAt(B);

/* he fades up under the panel and the first fault takes him. */
const MAS_IN = 0.14, MAS_FOR = 0.34;

/* ---------- the one mark in the second half ----------
   `delighted` a breath after the landing, so its entrance rides the spring out
   of the smash rather than fighting it. the thought hangs off it at the module's
   own `settled + 0.12`.

   the first half's mark is `curious` and it is the only other one: there is no
   `neutral`, no `unimpressed` and nothing flat or annoyed anywhere in the film,
   which is the brief in as many words. */
const M_CURIOUS = 0.30;
const M_DEL = +(LAND_AT + 0.10).toFixed(4);

/* the bubble's profile, worked out before a plan exists so the film's length is
   known, and compared against the plan's own numbers in the guards. */
const BUB_IN = +(M_DEL + STATES.delighted.entry + 0.12).toFixed(4);
const BUB_FULL = +(BUB_IN + BUBBLE.in).toFixed(4);
const BUB_LEAVING = +(BUB_FULL + BUBBLE.hold).toFixed(4);
/* how long past the module's own ceiling this file holds the same pill frame. it
   is derived: exactly the distance from the module's leaving frame to the fault,
   and the fault is the read's own last sound plus a beat. */
const FAULT_LEAD = 0.16;
/* the fault waits for whichever finishes last, the read or the last caption card:
   a signal breaking through a card still on the frame is a cut landing on a
   word. it is the read here by a hair either way, and the arithmetic says which
   on every run rather than a number typed once and left. */
const FAULT_AT = +Math.max(B[1].sound.end + FAULT_LEAD, CAP_OUT + 0.05).toFixed(4);
const HOLD_EXTRA = +Math.max(0, FAULT_AT - BUB_LEAVING).toFixed(4);
const GLB_AT = +(BUB_LEAVING + HOLD_EXTRA).toFixed(4);
const SECONDS = +(GLB_AT + END_HOLD).toFixed(4);

const CUT_A = Math.round(GLA_AT * FPS);       /* the panel, the marks and him */
const CUT_B = Math.round(GLB_AT * FPS);       /* and everything */
const WM_IN = (CUT_B - 1) / FPS;

/* ==========================================================================
   the mascot
   ==========================================================================
   ---------- the seed is the one blink ----------
   the brief's "one blink" while he is dizzy is a blink this file could write and
   should not: it would be a channel fighting the idle layer, which already makes
   blinks. so it comes off that layer — post13's move, post16's, post17's and
   post18's — and the seed is searched for a schedule that puts exactly one
   **whole** blink inside the window, close, hold and open. */
/* the reel is measured **back off the fault** rather than forward off the last
   stop, so it fills every frame there is between the last name landing and the
   signal breaking rather than running on into a frame he is not on. it starts a
   breath before the fifth stop, which is what makes it read as the last switch
   being one too many. */
const DIZZY = { for: 0.62, ex: 1.5, ey: 1.1, rot: 2.6, turns: 1.6 };
DIZZY.end = GLA_AT;
DIZZY.at = +(GLA_AT - DIZZY.for).toFixed(4);
const BLINK_WINDOW = [+(DIZZY.at - 0.10).toFixed(4), +(GLA_AT - 0.04).toFixed(4)];
const blinkEnd = b => +(b.t + b.close + b.hold + b.open).toFixed(4);
const blinksNear = pl => pl.idle.blinks.filter(b => blinkEnd(b) > BLINK_WINDOW[0] && b.t < BLINK_WINDOW[1]);
const blinkInside = b => b.t >= BLINK_WINDOW[0] && blinkEnd(b) <= BLINK_WINDOW[1];
/* ---------- and nothing blinks on the punchline ----------
   the second constraint, and the first cut needed it: the lid is a card coloured
   slab, so a blink under the pill is a blank face for a fifth of a second at
   exactly the moment the answer arrives. it read as a bug on the still and it
   would read as one in motion. so the search is given the pill's own arrival to
   keep clear of as well, and every seed that puts a blink in it is refused.

   the shut window is where the eye is actually covered rather than the whole
   blink, because the open is a lid travelling back up a face that is already
   readable. */
const PUNCH = [+(BUB_FULL - 0.12).toFixed(4), +(BUB_FULL + 0.30).toFixed(4)];
const blinkShutEnd = b => +(b.t + b.close + b.hold + b.open * 0.5).toFixed(4);
const blinksOnPunch = pl => pl.idle.blinks.filter(b =>
  blinkShutEnd(b) > PUNCH[0] && b.t < PUNCH[1]);

const MARKS = [
  { t: M_CURIOUS, state: 'curious' },
  { t: M_DEL, state: 'delighted', bubble: THOUGHT },
];

function planFor(seed) {
  return planMascot({
    marks: MARKS, seconds: SECONDS, theme: 'dark', size: SIZE,
    /* dead straight on. the resting turn exists so a mascot in a corner looks
       into the frame, and there is nothing to look into from the middle — the
       gaze layer is what points him at things here. */
    bias: 0,
    /* over the crown, and the side said outright: what `over` derives it from is
       which corner he is standing in and he is standing in neither. */
    thought: 'over-right',
    /* null on purpose: the module checks its bubble against a caption band and
       the band here is 140 css px under his chin. the rendered cluster is checked
       against the safe area in the guards instead. */
    band: null,
    seed,
  });
}
function pickSeed() {
  let best = null, refused = null;
  for (let s = 1; s <= 6000; s++) {
    let pl;
    try { pl = planFor(s); } catch (err) { refused = err.message; continue; }
    const near = blinksNear(pl);
    if (near.length !== 1 || !blinkInside(near[0])) continue;
    if (blinksOnPunch(pl).length) continue;
    const b = near[0];
    const len = b.close + b.hold + b.open;
    if (!best || len > best.len) best = { seed: s, blink: b, len: +len.toFixed(4) };
  }
  if (!best) {
    throw new Error('no seed in six thousand puts exactly one whole idle blink inside '
      + JSON.stringify(BLINK_WINDOW) + ' and none at all across the punchline '
      + JSON.stringify(PUNCH)
      + (refused ? ' — and the plan itself was refused: ' + refused : ''));
  }
  return best;
}
const SEED = pickSeed();
const plan = planFor(SEED.seed);

/* ---------- where he stands ----------
   the module's corner arithmetic is not used — post12's line, post17's and
   post18's: `plan.box` is rewritten and `mascotCss`, `mascotMarkup` and
   `mascotPagePlan` all read it when they are called.

   the pill's worst frame is walked rather than assumed: the spring carries it
   past its mark, so the widest the pill ever is is not the width it settles at.
   240Hz, four samples to a frame at sixty. */
const PILL_SC = (() => {
  const b = plan.marks[plan.marks.length - 1].bubbles[0];
  let sc = 0;
  const steps = Math.ceil((b.out - b.in) * 240);
  for (let i = 0; i <= steps; i++) {
    sc = Math.max(sc, mascotFrame(plan, b.in + (b.out - b.in) * i / steps).bubble.pill.sc);
  }
  return +sc.toFixed(4);
})();
const PILL_X0 = +(plan.thought.start.x + plan.thought.runs[2]).toFixed(3);
const CENTRED_LEFT = +(VW / 2 - (HEAD.plate.x + HEAD.plate.s / 2) * plan.unit).toFixed(3);
/* the shift that puts the pill's far corner inside the safe line, derived from
   its own measured width and its own worst spring frame rather than picked, and
   zero if it ever stops being needed. it is applied to **both** halves of the
   film, so his own centre line never moves. */
const OFF_X = +Math.max(0,
  CENTRED_LEFT + PILL_X0 + PILL_W * PILL_SC - (VW - SAFE_CSS.right) + PILL_AIR).toFixed(2);

const MAS = { cx: +(VW / 2 - OFF_X).toFixed(2), cy: CENTRE_Y };
plan.box = {
  left: +(CENTRED_LEFT - OFF_X).toFixed(2),
  top: +(MAS.cy - (HEAD.plate.y + HEAD.plate.s / 2) * plan.unit).toFixed(2),
  size: plan.size,
};
/* the plate's own radius at the plan's size, in css px, which is what the ground
   compensation and every clearance below are written against. */
const R = +(HEAD.plate.s / 2 * plan.unit).toFixed(3);
/* the corner scene: his corner size as a ratio of the plan's, and how far down
   the frame the smaller head sits. */
const SC_A = +(CORNER / SIZE).toFixed(5);
const CY_A = 520;
const DY_A = +(CY_A - MAS.cy).toFixed(2);
const BUB = plan.marks[plan.marks.length - 1].bubbles[0];
const BUB_HELD = mascotFrame(plan, BUB.leaving - 1e-4).bubble;
const BLINK = blinksNear(plan)[0];
const BLINK_AT = +(BLINK.t + BLINK.close + BLINK.hold / 2).toFixed(4);

/* his ink, in page space, on a frame. `headRect` answers in device px from each
   border and that is the wrong shape for a clearance against a panel. */
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
   the gaze, and the dizziness
   ==========================================================================
   one layer, one list, and it is the acting: he watches the panel fill, snaps to
   the label on every switch and comes back, and after the last one the room goes
   round. none of that is in the state table, because a state is a pose rather
   than a direction.

   it is composed onto `mascotFrame`'s own card and eyes, which is the seam the
   module documents. the divisors are this clip's own and they are the tuning:
   everything he looks at is inside a narrow band above him, so a response
   written for post18's frame — where the thing to look at was 350 px overhead —
   would turn a head three degrees for a target 60 px sideways and read as
   nothing. the caps are what keep it a look rather than a pose. */
const GZ = { div: 34, eye: 3.0, divY: 140, eyeY: 2.4, rotDiv: 21, rot: 5.0, leanDiv: 30, lean: 4.0 };
const CAM = { ex: 0, ey: 0, rot: 0, dx: 0 };

/* the two things he looks at, as page points. the label's is worked out of the
   row's own geometry rather than typed: the model group is the last item in a
   right aligned row, so its right edge is the panel's own padding, and the name
   cell sits `Medium` and a gap in from that. */
const EFF_W = +(3.8181 * MODEL.effSize).toFixed(2);   /* "Medium", Space Grotesk 400 */
const LABEL_PT = [
  +(PANEL.x + PANEL.w - PANEL.pad - EFF_W - MODEL.gap - NAME_CELL / 2).toFixed(2),
  +(PANEL.bottom - PANEL.pad - PANEL.rowH / 2).toFixed(2),
];
const PANEL_PT = [270, +(PANEL.y + PANEL.h / 2).toFixed(2)];

function gazeOffsets(pt) {
  if (!pt) return CAM;
  const dx = pt[0] - MAS.cx, dy = pt[1] - MAS.cy;
  return {
    ex: clamp(dx / GZ.div, -GZ.eye, GZ.eye),
    ey: clamp(dy / GZ.divY, -GZ.eyeY, GZ.eyeY),
    rot: clamp(dx / GZ.rotDiv, -GZ.rot, GZ.rot),
    dx: clamp(dx / GZ.leanDiv, -GZ.lean, GZ.lean),
  };
}

/* he looks at the panel while it fills, then turns to the label on every switch
   and settles back between them — **quicker every time**, which is the brief and
   is what actually makes the last one dizzy: the same travel in half the time
   five stops later. after the fall he looks at you and stays there. */
const GAZE = [{ t: M_CURIOUS, at: PANEL_PT, for: 0.42 }];
for (let i = 0; i < CLICKS.length; i++) {
  const q = i / (CLICKS.length - 1);
  const turnFor = +lerp(0.26, 0.10, q).toFixed(4);
  GAZE.push({ t: +(CLICKS[i] - 0.04).toFixed(4), at: LABEL_PT, for: turnFor });
  if (i < CLICKS.length - 1) {
    GAZE.push({ t: +(CLICKS[i] + lerp(0.28, 0.18, q)).toFixed(4), at: PANEL_PT, for: turnFor });
  }
}
GAZE.push({ t: +(LAND_AT + 0.02).toFixed(4), at: null, for: 0.26 });

function gazeAt(t) {
  let k = -1;
  for (let i = 0; i < GAZE.length; i++) if (t >= GAZE[i].t) k = i;
  if (k < 0) return { ...CAM, k: -1 };
  const to = gazeOffsets(GAZE[k].at);
  const from = k > 0 ? gazeOffsets(GAZE[k - 1].at) : CAM;
  const p = GLIDE(span(t, GAZE[k].t, GAZE[k].t + GAZE[k].for));
  return {
    ex: +lerp(from.ex, to.ex, p).toFixed(4),
    ey: +lerp(from.ey, to.ey, p).toFixed(4),
    rot: +lerp(from.rot, to.rot, p).toFixed(4),
    dx: +lerp(from.dx, to.dx, p).toFixed(4),
    k,
  };
}

/* ---------- and the room goes round ----------
   one window, on the last stop. the eyes describe a small circle and the head
   rolls with it a quarter turn out of phase, both under a sine that starts at
   nought and ends there — so it grows out of the last look and dies into the
   fault rather than switching on and off. it is a per frame offset on top of the
   gaze, and the two together stay a long way inside the clamp the module applies
   to an eye that would leave the face. */
function dizzyAt(t) {
  const p = span(t, DIZZY.at, DIZZY.end);
  if (p <= 0 || p >= 1) return { ex: 0, ey: 0, rot: 0 };
  const k = Math.sin(Math.PI * p);
  const th = 2 * Math.PI * DIZZY.turns * p;
  return {
    ex: +(k * DIZZY.ex * Math.cos(th)).toFixed(4),
    ey: +(k * DIZZY.ey * Math.sin(th)).toFixed(4),
    rot: +(k * DIZZY.rot * Math.cos(th + Math.PI / 2)).toFixed(4),
  };
}

/* ==========================================================================
   the fall and the smash
   ==========================================================================
   two numbers a frame, and the second one pays for the first: `dy` is how far
   above his mark he is, and `k` is the compression. see the header for the
   ground compensation, which is the third line of `smashAt` and is the whole
   difference between a thing landing and a thing being squeezed in mid air. */
function fallAt(t) {
  if (t >= LAND_AT) return 0;
  if (t <= DROP_AT) return -DROP.from;
  return +(-DROP.from * (1 - FALL(span(t, DROP_AT, LAND_AT)))).toFixed(3);
}

function squashAt(t) {
  if (t <= DROP_AT) return 0;
  /* he stretches on the way down. a thing falling is longer than a thing
     standing, and it is what makes the compression read as an arrival. */
  if (t < LAND_AT) return +(-SMASH.air * GLIDE(span(t, DROP_AT, LAND_AT))).toFixed(5);
  const flat = span(t, LAND_AT, LAND_AT + SMASH.flat);
  if (flat < 1) return +lerp(-SMASH.air, SMASH.k, GLIDE(flat)).toFixed(5);
  const p = span(t, LAND_AT + SMASH.flat, LAND_AT + SMASH.flat + SMASH.back);
  if (p >= 1) return 0;
  /* a damped cosine tapered to nought: one zero crossing inside the window, so
     there is exactly one stretch on the way back out and then rest. */
  return +(SMASH.k * Math.exp(-SMASH.damp * p) * Math.cos(2 * Math.PI * SMASH.cycles * p)
    * (1 - p)).toFixed(5);
}

/* ==========================================================================
   the glitch
   ==========================================================================
   post17's, which is post12's table and post12's shape: a hard hit, a fast fall,
   a floor, and a tail of calm frames with the occasional full heat one in it. */
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
  g.heat = +heat.toFixed(4);
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
   lesson: a sine stands still twice a period, so on a frame where the phosphor
   is the only thing moving, the two frames either side of a turning point are
   identical. */
function phosphor(t, amp, slow, fast, phase) {
  return 1 + amp * 0.78 * Math.sin(2 * Math.PI * t / slow)
    + amp * 0.39 * Math.sin(2 * Math.PI * t / fast + phase);
}

/* which bubble frame the page is handed: real time until the module's own hold
   runs out, then its own last fully up frame for `HOLD_EXTRA`, then real time
   again shifted by it — so an exit, if this clip ever let one play, would still
   be the module's exit rather than a jump. */
function bubbleTime(t) {
  if (t < BUB.leaving) return t;
  if (t < GLB_AT) return null;                    /* the held frame */
  return +(t - HOLD_EXTRA).toFixed(6);
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
  const goneA = f >= CUT_A;                       /* the first fault */
  const goneB = f >= CUT_B;                       /* and the second */
  /* he is under the panel until the first fault takes him, and back on the frame
     from the moment the fall starts. */
  /* with the fall starting on the fault's own frame there is no instant he is
     neither under the panel nor falling: at the cut he is on, and he is 560 css
     px above his mark with his whole head off the top of the frame. the guard
     measures that rather than trusting it. */
  const on = goneB ? 0 : (goneA && t < DROP_AT ? 0 : 1);

  const mas = mascotFrame(plan, t);

  /* ---- the thought, held past the module's own ceiling ---- */
  const bt = bubbleTime(t);
  if (bt === null) mas.bubble = BUB_HELD;
  else if (bt !== t) mas.bubble = mascotFrame(plan, bt).bubble;

  /* ---- the two halves, as one composition on the card ----
     before the first fault the card is scaled to his corner size and dropped to
     his own line under the panel; after it, it is at the plan's own size and
     carries the fall and the smash. `card` is what the head is actually drawn
     with, which is the module's own words for it, and it is what `headRect` and
     every clearance downstream read. */
  const gz = gazeAt(t);
  const dz = dizzyAt(t);
  const kq = goneA ? squashAt(t) : 0;
  const sq = 1 + kq;
  const sc = goneA ? 1 : SC_A;
  /* the ground compensation: a card scaled about its own centre lifts its bottom
     edge by the height it lost, so the same frame writes the offset back. it
     applies from the landing on — in the air his chin is not on anything. */
  const ground = t >= LAND_AT ? +(R * (1 - 1 / sq)).toFixed(3) : 0;
  const dy = goneA ? fallAt(t) + ground : DY_A;
  mas.card = {
    ...mas.card,
    x: +(mas.card.x + gz.dx).toFixed(4),
    y: +(mas.card.y + dy).toFixed(4),
    rot: +(mas.card.rot + gz.rot + dz.rot).toFixed(4),
    sx: +(mas.card.sx * sc * sq).toFixed(5),
    sy: +(mas.card.sy * sc / sq).toFixed(5),
  };
  mas.eyes = mas.eyes.map(e => ({
    ...e,
    x: +(e.x + gz.ex + dz.ex).toFixed(4),
    y: +(e.y + gz.ey + dz.ey).toFixed(4),
  }));
  const mo = on ? +span(t, MAS_IN, MAS_IN + MAS_FOR).toFixed(4) : 0;

  /* ---- the panel ----
     it fades in, types itself and the first fault takes it. it never moves. */
  const pn = typedAt(TYPING, t);
  const panel = {
    o: goneA ? 0 : +GLIDE(span(t, PANEL.at, PANEL.at + PANEL.in)).toFixed(4),
    n: pn, ph: pn ? 0 : 1,
    caret: ((t - PANEL.at) % PANEL.caretFor) < PANEL.caretFor / 2 ? 1 : 0,
    /* which of the five the label reads. it is `Claude` before the first stop
       because that is what the panel arrives carrying, and the first stop lands
       on it again — the picker is being flicked through from where it already
       was, which is why there are five clicks and five marks rather than four. */
    model: modelAt(t),
  };

  /* ---- the marks ----
     one entry per file, and the swap is a hard cut on one frame rather than a
     crossfade. **the first cut faded them and the frame showed why not**: these
     are opaque tiles rather than transparent marks, so two of them at half
     opacity is one tile printed through another. the spring is what makes the
     arrival read; nothing needs to fade. */
  const logos = MARKS_FILES.map((m, i) => {
    const at = CLICKS[i];
    const next = i + 1 < CLICKS.length ? CLICKS[i + 1] : Infinity;
    return {
      o: (goneA || t < at || t >= next) ? 0 : 1,
      sc: +lerp(LOGOS.from, 1, POP(span(t, at, at + LOGOS.in))).toFixed(4),
    };
  });

  /* ---- the wordmark ----
     born on the frame the second fault lands on rather than at that time, which
     is post13's correction, and it breathes under its own phosphor. */
  const wp = span(t, WM_IN, WM_IN + 0.09);
  const wm = {
    o: +span(t, WM_IN, WM_IN + 0.045).toFixed(4),
    sc: +(1 + (1 - GLIDE(wp)) * 0.085).toFixed(4),
    glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4),
  };
  /* the vignette breathes on a curve node knows about as well as on its own css
     animation, and that is not decoration: the film opens on a nearly empty
     frame, and without a number here the liveness signature would be blind to
     the only layer moving in it. */
  const vig = +phosphor(t, 0.07, 3.1, 1.07, 0.9).toFixed(4);

  return { t: +t.toFixed(4), f, mas, mo, gz, dz, kq, dy, panel, logos, wm, vig, g };
}

function modelAt(t) {
  let k = 0;
  for (let i = 0; i < CLICKS.length; i++) if (t >= CLICKS[i] - 1e-9) k = i;
  return k;
}

/* what the page is handed, which is this file's own layers only: the mascot
   writes its own numbers through its own runtime and the captions through
   theirs. */
function pageFrame(o) {
  return { mo: o.mo, panel: o.panel, logos: o.logos, wm: o.wm, vig: o.vig, g: o.g };
}

/* ==========================================================================
   the captions
   ==========================================================================
   both lines, in the float style, in one band that does not move. the line ends
   are marked rather than inferred: a card breaks at a sentence end, at a clause
   mark or when it is full, and left alone a card would run straight through the
   seam between the question and the answer. a comma goes on the last word of
   each line, on the caption's copy only and after the synthesiser has already
   spoken, `cardBreak` breaks on it and `punctuation: 'drop'` takes it off again
   before a card is drawn. nothing about the audio or the timing can move. */
function markLines(beats) {
  const out = [];
  const marked = [];
  /* a break name has to name exactly one word in the whole read, or the mark
     would land somewhere nobody chose. it is the same discipline `word()` keeps
     for the beats: a rewrite that makes a name ambiguous has to move the break
     with it rather than have the break quietly move on its own. */
  const all = beats.flatMap(b => b.words.map(w => bareOf(w.word)));
  for (const name of CARD_BREAKS) {
    const n = all.filter(x => x === name).length;
    if (n !== 1) {
      throw new Error('the card break "' + name + '" matches ' + n + ' words in the read, and it '
        + 'has to match exactly one');
    }
  }
  for (const b of beats) {
    b.words.forEach((w, k) => {
      const last = k === b.words.length - 1;
      const already = /[.!?,;:]["')\]]?$/.test(w.word);
      const wanted = last || CARD_BREAKS.includes(bareOf(w.word));
      if (wanted && !already) marked.push(w.word);
      out.push({ word: wanted && !already ? w.word + ',' : w.word, start: w.start, end: w.end });
    });
  }
  return { words: out, marked };
}

/* ==========================================================================
   the page
   ==========================================================================
   one html string, built once, served from a local static server so the load
   sequence is the clip's own. everything in it is drawn out of the site's own
   tokens, which arrive with `captionCss` lifted out of index.html at run time,
   plus the panel's own two — a ground a shade above the page and a hairline
   outline, which is post17's dark redraw and is the only way a dark box reads on
   a dark frame.

   three families in one request. Michroma sets the wordmark, Space Grotesk at
   400 and 500 sets everything the page reads as text, and Manrope at 800 sets
   the captions. */
function sceneHtml() {
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post19</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Manrope:wght@800&family=Space+Grotesk:wght@400;500&display=swap">
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}

${captionCss(cap, CAP_BOX)}
${mascotCss(plan)}

:root{
  /* the panel's own two, and they are the whole of post17's dark redraw. */
  --pn-bg:#12151b; --pn-line:rgba(213,219,216,.17);
  /* the two channels the rgb split is drawn in: the same white the glow is,
     pulled apart, rather than a red and a cyan out of a filter preset. */
  --gr:rgba(255,120,120,.55); --gc:rgba(120,220,255,.55);
}

/* the vignette, and it is load bearing rather than decoration. with nothing at
   all animating chrome stops producing compositor frames and the screenshot call
   blocks on a frame that never comes — post2 found it and every clip in demo/
   has carried the fix since. it is outside the stage, so the shake cannot move
   it. the brightness on top is node's. */
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

.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;background:var(--bg);
  transform:translate3d(calc(var(--sx,0) * 1px),calc(var(--sy,0) * 1px),0);
  will-change:transform}

/* ---- the caption's own face ----
   the module sets the float style in the body face at 700 and measures it there;
   this file asks for something cleaner and heavier, so the rule is written after
   the module's and the fit is redone in the page against the face that actually
   renders — see capRefit. the glow is the page's own, so the words belong to the
   same light as the head and the wordmark.
   (no backticks in this block: it is inside a template literal, and one would
   end the string rather than mark a name.) */
.cap-float{font-family:"${CAP.family}",var(--mono); font-weight:${CAP.weight};
  letter-spacing:${CAP.tracking}em;
  text-shadow:0 0 8px rgba(255,255,255,.18),0 0 22px rgba(255,255,255,.07)}

/* ---- the five marks ----
   somebody else's, placed rather than drawn. every number in here is solved in
   node off the file's own measured alpha box, so the ink is the same height on
   all five and its centre lands on the one spot. the box keeps the file's
   natural ratio to six decimals, so background-size 100% 100% is exact and
   nothing can be stretched. no filter, no recolour, nothing reaches the pixels. */
.mark{position:absolute; z-index:6; pointer-events:none;
  background-repeat:no-repeat; background-size:100% 100%;
  opacity:var(--mk-o,0); transform:scale(var(--mk-s,1));
  will-change:opacity,transform}
.stage[data-gl="1"] .mark{
  filter:drop-shadow(calc(var(--split,0) * -.42px) 0 var(--gr))
         drop-shadow(calc(var(--split,0) * .42px) 0 var(--gc))}
${MARKS_FILES.map((m, i) => '#mark' + i + '{left:' + m.left + 'px; top:' + m.top
    + 'px; width:' + m.box.w + 'px; height:' + m.box.h + 'px; background-image:url("/mark-'
    + m.key + '.png")}').join('\n')}

/* ---- the chat panel ----
   post17's: a rounded panel a shade above the page, a hairline outline, a line
   of text, a plus in a ring on the left, and on the right a mic, a waveform and
   the model label. no logo in it and nothing lifted off anybody's product — it
   is the shape of the thing, which is what a viewer recognises.

   the glow is the file's own: two soft box shadows on the panel and two text
   shadows on the line, so the box belongs to the same light as the head. */
.panel{
  position:absolute; left:${PANEL.x}px; top:${PANEL.y}px;
  width:${PANEL.w}px; height:${PANEL.h}px;
  border-radius:${PANEL.radius}px;
  background:var(--pn-bg); border:1px solid var(--pn-line);
  z-index:3; pointer-events:none; overflow:hidden;
  opacity:var(--pn-o,0);
  box-shadow:0 0 26px rgba(255,255,255,.05),0 0 72px rgba(255,255,255,.022);
  will-change:opacity;
}
.panel-text{
  position:absolute; left:${PANEL.pad}px; right:${PANEL.pad}px; top:${PANEL.pad}px;
  font-family:var(--body); font-weight:400; font-size:${PANEL.textSize}px;
  line-height:${PANEL.lineHeight}; color:var(--fg); word-break:break-word;
  text-shadow:0 0 6px rgba(255,255,255,.20),0 0 17px rgba(255,255,255,.08);
}
/* the placeholder and the line share one box, so the first character lands where
   the placeholder was. it starts five px in, which is post14's rendered frame:
   the caret is an inline element after the line, so with nothing typed it sits at
   x nought, which is exactly where the placeholder's first glyph is. */
.panel-ph{position:absolute; left:5px; top:0; right:0; color:var(--fg);
  opacity:calc(var(--pn-ph,0) * .30); text-shadow:none}
.panel-caret{display:inline-block; width:2px; height:.86em; margin-left:.06em;
  background:var(--fg); vertical-align:-.10em; opacity:var(--pn-car,0)}
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
  content:''; position:absolute; left:50%; top:50%; background:var(--fg); border-radius:1px;
}
.panel-plus::before{width:${(PANEL.plus * 0.46).toFixed(1)}px; height:1.6px;
  margin:-0.8px 0 0 ${(-PANEL.plus * 0.23).toFixed(1)}px}
.panel-plus::after{width:1.6px; height:${(PANEL.plus * 0.46).toFixed(1)}px;
  margin:${(-PANEL.plus * 0.23).toFixed(1)}px 0 0 -0.8px}
.panel-right{display:flex; align-items:center; gap:${PANEL.iconGap}px}
/* the mic: a capsule for the head, an open arc under it and a short stem. no
   ring around it, because the thing beside it is not in one either. */
.mic{position:relative; width:16px; height:${PANEL.rowH}px; opacity:.46}
.mic-cap{position:absolute; left:50%; top:5px; width:8px; height:12px;
  margin-left:-4px; border-radius:999px; background:var(--fg)}
.mic-arc{position:absolute; left:50%; top:13px; width:15px; height:9px;
  margin-left:-7.5px; border:1.6px solid var(--fg); border-top:none;
  border-radius:0 0 999px 999px}
.mic-stem{position:absolute; left:50%; top:22px; width:1.6px; height:4px;
  margin-left:-0.8px; background:var(--fg)}
/* the waveform: five rounded bars, tallest in the middle. the one part of the
   chrome that is a picture of sound rather than of a control, which is the
   point — the panel is being spoken to. */
.wave{display:flex; align-items:center; gap:3px; height:${PANEL.rowH}px; opacity:.46}
.wave span{display:block; width:2.4px; border-radius:999px; background:var(--fg)}
/* ---- the model label ----
   the rightmost thing in the row, and the payload of the whole first half. the
   name sits in a cell as wide as the longest of the five and right aligned, so
   the word after it cannot be shoved sideways as it counts through them — the
   fixed cell index.html uses for its scrambling wordmark and captions.mjs for
   its rolling digits. */
.pn-model{display:flex; align-items:baseline; gap:${MODEL.gap}px}
.pn-name{display:inline-block; min-width:${NAME_CELL}px; text-align:right;
  font-family:var(--body); font-weight:500; font-size:${MODEL.size}px; color:var(--fg);
  letter-spacing:-.005em;
  text-shadow:0 0 6px rgba(255,255,255,.18),0 0 16px rgba(255,255,255,.07)}
.pn-eff{font-family:var(--body); font-weight:400; font-size:${MODEL.effSize}px;
  color:var(--muted)}

/* ---- the shadow, off ----
   lib/mascot.mjs says in its own words that the shadow is off in dark, "because
   a soft black ellipse on a #06070a page is nothing", and it declares
   --m-shadow-o:0 on the dark zone to do it. nothing reads that variable: the page
   half writes the shadow's opacity from the frame on every frame, and the ellipse
   is filled with --face, which on dark is the near white the head is. so on a
   dark page the module paints a pale ellipse at a fifth opacity.

   it is invisible for most of a clip because the head sits on top of it. this one
   takes the head away for a third of a second and drops it back, and the fall
   exposes it: a light smudge on the floor with nothing over it.

   lib is untouched, so this is the clip's own rule over the module's, and it is
   the module's own stated intent rather than a preference. visibility rather than
   opacity, because opacity is what the runtime writes.
   (no backticks in this block: it is inside a template literal.) */
#m-shadow{visibility:hidden}

/* ---- the mascot's own cut ----
   a wrapper rather than a rule on the zone: he fades up under the panel, the
   first fault takes him and the fall hands him back, and none of that is
   anything the module needs to know about. */
#mas-cut{position:absolute;inset:0;z-index:4;opacity:var(--m-o,0)}
.stage[data-gl="1"] #mas-cut{
  filter:drop-shadow(calc(var(--split,0) * -1px) 0 var(--gr))
         drop-shadow(calc(var(--split,0) * 1px) 0 var(--gc))}

/* ---- the wordmark ----
   three lines on the middle of the safe band. the deep glow is two text shadows
   rather than blurred duplicates, and the brightness filter on top is the
   phosphor breathing, which is what stops the last second being a still. */
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
   a band of the frame, blacked out and redrawn shifted. on the first fault there
   is nothing to copy and that is deliberate: the wordmark is not born yet and
   what is on the screen is a panel, five marks and a mascot driven by a module's
   runtime — none of them has a second copy that could be kept in sync. so the
   first fault's bands are dropouts, which is what a picture losing a line of
   itself looks like and is the more honest of the two anyway. the second
   carries the wordmark, because by then it is all there is. */
.tear{position:absolute;inset:0;z-index:10;overflow:hidden;background:var(--bg);
  clip-path:inset(var(--tt,0px) 0 calc(100% - var(--tt,0px) - var(--th,0px)) 0);
  opacity:var(--to,0)}
.tear-in{position:absolute;inset:0;transform:translate3d(calc(var(--tdx,0) * 1px),0,0)}

/* ---- the fault's own two layers ----
   noise, screen blended so it adds light to a black frame rather than sitting on
   it as grey, and a white frame that fires once per fault. */
.noise{position:absolute;inset:-40px;z-index:11;pointer-events:none;
  mix-blend-mode:screen;opacity:var(--noise,0);
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.0' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23m)'/%3E%3C/svg%3E")}
.flash{position:absolute;left:50%;top:${CENTRE_Y}px;z-index:12;pointer-events:none;
  width:${GL.flashSize}px;height:${GL.flashSize}px;
  margin:${-GL.flashSize / 2}px 0 0 ${-GL.flashSize / 2}px;
  background:radial-gradient(circle,
    rgba(255,255,255,1) 0%, rgba(255,255,255,.62) 34%,
    rgba(255,255,255,.18) 60%, rgba(255,255,255,0) 78%);
  opacity:var(--flash,0)}
</style>
</head>
<body>
<div class="vignette" aria-hidden="true"></div>
<div class="stage" id="stage">
${captionMarkup(cap)}
${MARKS_FILES.map((m, i) => '  <div class="mark" id="mark' + i + '" aria-hidden="true"></div>').join('\n')}

  <div class="panel" id="panel">
    <div class="panel-text" id="panel-text"><span class="panel-ph" id="panel-ph">${PANEL.placeholder}</span><span id="panel-line"></span><span class="panel-caret" id="panel-caret"></span></div>
    <div class="panel-row">
      <span class="panel-plus"></span>
      <span class="panel-right">
        <span class="mic"><span class="mic-cap"></span><span class="mic-arc"></span><span class="mic-stem"></span></span>
        <span class="wave">${[7, 13, 20, 12, 6].map(h => '<span style="height:' + h + 'px"></span>').join('')}</span>
        <span class="pn-model"><span class="pn-name" id="pn-name">${NAMES[0]}</span><span class="pn-eff">${MODEL.eff}</span></span>
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
window.__CAP_PLAN = ${JSON.stringify(cap)};
window.__CAP_BOX = ${JSON.stringify(CAP_BOX)};
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
window.__P19 = ${JSON.stringify({
    VW, VH, DSF, WM, PANEL, MODEL, CAP, CAP_BOX, NAMES, NAME_CELL,
    MARKS: MARKS_FILES.map(m => ({ key: m.key, name: m.name, inkH: m.inkH, inkW: m.inkW })),
  })};
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
    var built = Object.assign({}, window.__p19.build(), {
      cap: window.__cap.build(),
      mas: window.__mas.build(),
      caps: window.__mas.caps(),
    });
    built.capRefit = window.__p19.capRefit();
    window.__built = built;
  });
</script>
</body>
</html>`;
}

/* ---------- the page's own half ----------
   serialised in with .toString(), so it closes over nothing: everything it needs
   arrives on window.__P19. it writes numbers to elements and it decides nothing,
   which is the same split lib/captions.mjs and lib/mascot.mjs are built on. */
function scenePage() {
  const P = window.__P19;
  const stage = document.getElementById('stage');
  const panel = document.getElementById('panel');
  const panelPh = document.getElementById('panel-ph');
  const panelLine = document.getElementById('panel-line');
  const panelText = document.getElementById('panel-text');
  const pnName = document.getElementById('pn-name');
  const marks = P.MARKS.map((m, i) => document.getElementById('mark' + i));
  const wms = [...document.querySelectorAll('.wm')];
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

  window.__p19 = {
    ready: true,
    /* the wordmark is fitted rather than sized, because michroma is proportional
       and its tracking is nearly a fifth of an em, so the width of a string is a
       measurement rather than a ratio. everything else on the page is set at a
       size node solved its geometry against. */
    build() {
      const first = wms[0];
      first.style.fontSize = '100px';
      const size = 100 * P.WM.w / widest(first);
      for (const el of wms) el.style.fontSize = size.toFixed(2) + 'px';
      return {
        wm: {
          size: +size.toFixed(2),
          capPx: +(capOf(first).cap * P.DSF).toFixed(1),
          font: capOf(first).font,
          box: boxOf(first),
        },
      };
    },

    /* ---------- the caption, refitted against the face it is set in ----------
       lib/captions.mjs fits the float style by measuring its cards in Space
       Grotesk at 700, which is not the face this clip asks for. Manrope at 800 is
       a different width for the same string, so the size the module solved is the
       wrong one and the widest card would cross the box.

       so the cards are measured as they render, at a probe size, and the size is
       solved again from the widest of them. it divides by the same maxScale the
       module divides by, because a word springs about its own centre and the
       outer ones would otherwise cross the safe line on the frame they arrive.
       lib is untouched: this is a rule and a measurement in the clip. */
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
       out of its own box is caught before a frame is drawn. */
    measure() {
      const was = panelLine.textContent;
      const wasPh = panelPh.style.display;
      panelPh.style.display = 'none';
      panelLine.textContent = P.PANEL.typed;
      const full = panelText.getBoundingClientRect();
      const lh = parseFloat(getComputedStyle(panelText).lineHeight);
      const line = {
        capPx: +(capOf(panelText).cap * P.DSF).toFixed(1),
        sizeCss: +parseFloat(getComputedStyle(panelText).fontSize).toFixed(3),
        h: +full.height.toFixed(2), lines: Math.round(full.height / lh),
        room: +(P.PANEL.h - P.PANEL.pad * 2 - P.PANEL.rowH - full.height).toFixed(2),
      };
      panelLine.textContent = was;
      panelPh.style.display = wasPh;
      /* the name cell, against the longest of the five it has to hold. a cell
         narrower than its own copy would slide the word after it, which is the
         one thing the fixed cell exists to stop. */
      const wasName = pnName.textContent;
      let widestName = 0, widestWord = null;
      for (const w of P.NAMES) {
        pnName.textContent = w;
        const sw = pnName.scrollWidth;
        if (sw > widestName) { widestName = sw; widestWord = w; }
      }
      pnName.textContent = wasName;
      return {
        line,
        name: {
          capPx: +(capOf(pnName).cap * P.DSF).toFixed(1),
          cell: +parseFloat(getComputedStyle(pnName).minWidth).toFixed(1),
          widest: +widestName.toFixed(1), widestWord,
        },
        shadow: getComputedStyle(document.getElementById('m-shadow')).visibility,
        panel: boxOf(panel),
        model: boxOf(document.querySelector('.pn-model')),
        wm: boxOf(document.getElementById('wm')),
        /* every mark's rendered box, so "the same height" is a measurement
           rather than a claim about the numbers node solved. */
        marks: marks.map(el => boxOf(el)),
      };
    },

    /* the boxes anything moving is measured against, on the frame being drawn. */
    live() {
      return {
        panel: boxOf(panel), model: boxOf(document.querySelector('.pn-model')),
        marks: marks.map(el => boxOf(el)), wm: boxOf(document.getElementById('wm')),
      };
    },

    /* the pill on its own, so the shift can be checked against the thing it was
       computed from rather than against the cluster it is part of. */
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
      s.setProperty('--vig', o.vig.toFixed(4));
      s.setProperty('--sx', o.g.sx.toFixed(2));
      s.setProperty('--sy', o.g.sy.toFixed(2));
      s.setProperty('--split', o.g.split.toFixed(2));
      s.setProperty('--noise', o.g.noise.toFixed(4));
      s.setProperty('--flash', o.g.flash.toFixed(4));
      /* the split is behind an attribute rather than a zero valued shadow: a
         shadow at offset 0 in full colour is a coloured halo, not "off". */
      if (o.g.split > 0.01) stage.setAttribute('data-gl', '1');
      else stage.removeAttribute('data-gl');

      panel.style.setProperty('--pn-o', o.panel.o.toFixed(4));
      panel.style.setProperty('--pn-ph', o.panel.ph.toFixed(3));
      panel.style.setProperty('--pn-car', (o.panel.o > 0.02 ? o.panel.caret : 0).toFixed(3));
      const want = P.PANEL.typed.slice(0, o.panel.n);
      if (panelLine.textContent !== want) panelLine.textContent = want;
      const nm = P.NAMES[o.panel.model];
      if (pnName.textContent !== nm) pnName.textContent = nm;
      panel.style.visibility = o.panel.o > 0.002 ? 'visible' : 'hidden';

      for (let i = 0; i < marks.length; i++) {
        const m = o.logos[i], st = marks[i].style;
        st.setProperty('--mk-o', m.o.toFixed(4));
        st.setProperty('--mk-s', m.sc.toFixed(4));
        st.visibility = m.o > 0.002 ? 'visible' : 'hidden';
      }

      for (const el of wms) {
        el.style.setProperty('--wm-o', o.wm.o.toFixed(4));
        el.style.setProperty('--wm-s', o.wm.sc.toFixed(4));
        el.style.setProperty('--wm-glow', o.wm.glow.toFixed(4));
        el.style.visibility = o.wm.o > 0.002 ? 'visible' : 'hidden';
      }

      for (let i = 0; i < tears.length; i++) {
        const band = o.g.bands[i];
        const st = tears[i].style;
        if (!band) { st.setProperty('--to', '0'); st.setProperty('--th', '0px'); continue; }
        st.setProperty('--to', '1');
        st.setProperty('--tt', band.top.toFixed(1) + 'px');
        st.setProperty('--th', band.h.toFixed(1) + 'px');
        st.setProperty('--tdx', band.dx.toFixed(1));
      }
    },
  };
}

/* ---------- a local static server, so the load sequence is the clip's ------- */
function serve(html) {
  const files = new Map(MARKS_FILES.map(m => ['/mark-' + m.key + '.png', fs.readFileSync(m.file)]));
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/' || p === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }
    if (files.has(p)) {
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' });
      return res.end(files.get(p));
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
  let seed = 0x19a0c3d7;
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
      && window.__cap && window.__cap.ready && window.__p19 && window.__built
      && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  const ready = await page.evaluate(() => ({
    mas: !!(window.__mas && window.__mas.ready),
    cap: !!(window.__cap && window.__cap.ready),
    p19: !!(window.__p19 && window.__p19.ready),
    built: !!window.__built,
  }));
  for (const k of ['mas', 'cap', 'p19', 'built']) {
    if (!ready[k]) throw new Error('the ' + k + ' layer never became ready');
  }
  /* offline a face falls back to the system mono and the type looks almost
     right, which is the worst kind of wrong to judge type on. */
  for (const [f, what] of [['400 40px "Michroma"', 'the wordmark'],
    ['800 40px "Manrope"', 'the captions'], ['500 24px "Space Grotesk"', 'the panel and the label']]) {
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
  await page.evaluate(p => window.__p19.apply(p), pageFrame(o));
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
  const meas = await page.evaluate(() => window.__p19.measure());
  console.log('  built: head ' + built.mas.headPx + ' device px, ' + built.mas.eyes + ' eyes, '
    + built.mas.dots + ' dots, outline ' + built.mas.strokePx + ' device px, theme ' + built.mas.theme);
  console.log('  the wordmark fits at ' + built.wm.size + 'css px, caps ' + built.wm.capPx
    + ' device, floor ' + WM.minCapPx);
  console.log('  the panel line: ' + meas.line.sizeCss + 'css px, caps ' + meas.line.capPx
    + ' device, ' + meas.line.lines + ' line(s), ' + meas.line.room.toFixed(1) + ' css of air in it');
  console.log('  the model label: ' + MODEL.size + 'css px, caps ' + meas.name.capPx
    + ' device, cell ' + meas.name.cell + ' css against "' + meas.name.widestWord + '" at '
    + meas.name.widest);
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
  let dizzyMax = { ex: 0, ey: 0, rot: 0 };
  let eyeMax = { units: 0, t: 0 }, clampedFrames = 0;
let outsideMax = { d: -Infinity, t: 0 };
  let sqMax = { k: 0, t: 0 }, stepMax = { px: 0, t: 0 };
  let prevY = null;

  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const o = frameAt(t, f);
      await paint(page, o, t);
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);

      if (k === 0) {
        let s = o.mo * 7 + o.vig * 11 + o.panel.o * 13 + o.panel.n * 17 + o.panel.caret * 19
          + o.panel.model * 23
          + o.wm.o * 29 + o.wm.sc * 31 + o.wm.glow * 37
          + o.g.sx * 41 + o.g.sy * 43 + o.g.split * 47 + o.g.noise * 53 + o.g.flash * 59
          + o.g.bands.length * 61;
        for (let i = 0; i < o.logos.length; i++) s += o.logos[i].o * (67 + i) + o.logos[i].sc * (79 + i);
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
        dizzyMax = {
          ex: Math.max(dizzyMax.ex, Math.abs(o.dz.ex)), ey: Math.max(dizzyMax.ey, Math.abs(o.dz.ey)),
          rot: Math.max(dizzyMax.rot, Math.abs(o.dz.rot)),
        };
        if (Math.abs(o.kq) > Math.abs(sqMax.k)) sqMax = { k: +o.kq.toFixed(4), t: +t.toFixed(3) };
        if (o.mo > 0.5) {
          for (const e of o.mas.eyes) {
            if (Math.abs(e.x) > eyeMax.units) eyeMax = { units: +Math.abs(e.x).toFixed(3), t: +t.toFixed(2) };
          }
          if (o.mas.turn.clamped) clampedFrames++;
          /* the module's own measure, and it is the real one: how far outside the
             silhouette the worst placed feature corner would have gone if the
             markup were not clipping it. negative is inside and is the
             clearance. */
          if (o.mas.turn.outside > outsideMax.d) {
            outsideMax = { d: +o.mas.turn.outside.toFixed(3), t: +t.toFixed(2) };
          }
          const y = o.mas.card.y;
          if (prevY != null && Math.abs(y - prevY) > stepMax.px) {
            stepMax = { px: +Math.abs(y - prevY).toFixed(2), t: +t.toFixed(3) };
          }
          prevY = y;
        } else prevY = null;

        const every = Math.max(1, Math.round(FPS / 8));
        /* everything drawn, eight times a second and never inside a fault: the
           glitch translates the whole stage and a reading through a fifteen pixel
           jump is a reading of the glitch. */
        if (o.g.heat === 0 && f % every === 0) {
          const live = await page.evaluate(() => window.__p19.live());
          samples++;
          const boxes = [];
          if (o.panel.o > 0.5) { boxes.push(['the panel', live.panel]); boxes.push(['the label', live.model]); }
          if (o.wm.o > 0.5) boxes.push(['the wordmark', live.wm]);
          for (let i = 0; i < o.logos.length; i++) {
            /* the ink rather than the canvas it sits on — see markInk. */
            if (o.logos[i].o > 0.5) {
              boxes.push(['the ' + NAMES[i] + ' mark', markInk(MARKS_FILES[i], o.logos[i].sc)]);
            }
          }
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
           piece of copy in the last three seconds. */
        if (o.mo > 0.5 && o.mas.bubble.o > 0.02) {
          const bs = await page.evaluate((w, h) => window.__mas.bubbleSafe(w, h), VW, VH);
          if (bs) {
            bubSamples++;
            const air = Math.min(bs.left - SAFE.left, bs.top - SAFE.top,
              bs.right - SAFE.right, bs.bottom - SAFE.bottom);
            if (!bubWorst || air < bubWorst.air) bubWorst = { t: +t.toFixed(2), air: +air.toFixed(1), ...bs };
            const pb = await page.evaluate(() => window.__p19.pillBox());
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
    gaze: gazeMax, dizzy: dizzyMax, eye: eyeMax, clampedFrames, outside: outsideMax,
    squash: sqMax, step: stepMax,
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
    [0.02, 'a-black'],
    [PANEL.at + PANEL.in, 'b-the-panel'],
    [TYPING.at[Math.floor(TYPING.chars / 2)], 'c-typing'],
    [TYPING.until + 0.04, 'd-the-question'],
    ...CLICKS.map((t, i) => [t + LOGOS.in, String.fromCharCode(101 + i) + '-' + NAMES[i].toLowerCase()]),
    [BLINK_AT, 'j-the-blink'],
    [DIZZY.at + DIZZY.for * 0.35, 'k-dizzy'],
    [GLA_AT, 'l-the-first-fault'],
    [DROP_AT + DROP.for * 0.6, 'm-falling'],
    [LAND_AT + SMASH.flat, 'n-flat'],
    [LAND_AT + SMASH.flat + SMASH.back * 0.45, 'o-springing-back'],
    [BUB.in + BUBBLE.step, 'p-the-dots'],
    [BUB_FULL, 'q-the-thought'],
    [GLB_AT - 1 / FPS, 'r-the-last-frame-of-it'],
    [GLB_AT, 's-the-second-fault'],
    [GLB_AT + GLB.for + 0.05, 't-the-wordmark'],
    [SECONDS - 0.05, 'u-the-last-frame'],
  ];
  for (const [at, name] of want) {
    const fr = Math.min(N - 1, Math.max(0, Math.round(at * FPS)));
    await paint(page, frameAt(fr / FPS, fr), fr / FPS);
    await page.evaluate(now => window.__dmRaf(now), (fr + 1) * STEP);
    await shoot(cdp, path.join(VERIFY, name + '.png'));
    /* virtual time has to move between two captures: with the clock paused
       `Page.captureScreenshot` waits for a frame the compositor has no reason to
       produce, and the second call in a row blocks forever. */
    await advance(STEP);
  }
  /* the legibility crops, on every run rather than only when somebody remembers a
     flag: the panel with its line and its label in, the mark row, the caption at
     its widest card, and the thought. */
  const crops = [
    [CLICKS[2] + LOGOS.in, { x: PANEL.x, y: PANEL.y, w: PANEL.w, h: PANEL.h }, 'the-panel-3x'],
    [CLICKS[2] + LOGOS.in, { x: 130, y: 100, w: 280, h: 120 }, 'the-marks-3x'],
    [TYPING.until, { x: CAP_BOX.x, y: CAP_BOX.y, w: CAP_BOX.w, h: CAP_BOX.h }, 'the-caption-3x'],
    [BUB_FULL, { x: 60, y: 250, w: 420, h: 280 }, 'the-thought-3x'],
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

/* ==========================================================================
   the sound
   ==========================================================================
   five kinds and the brief names all five. nothing here is a new recipe and
   there is not one audio file in this repo.

     the key ticks     `key`, off the typing plan's own list rather than off a
                       rate.
     the five clicks   `click`, one per stop, softened four decibels under the
                       table's own level because five of them inside two seconds
                       is a picker being flicked rather than five events.
     the splat         `crunch`, taken low and wet: a contact burst over a body
                       that falls from 190 to 70 hertz with a flutter on it,
                       under a 1.2k ceiling. that is a slack thing hitting a hard
                       one, which is what a mascot made of gum landing sounds
                       like. two decibels under the table, because the brief
                       says soft.
     the pill          `mascotCues`' own `pop`, taken. the `ding` the module
                       offers for an agreeing mark never appears, because there
                       is no agreeing mark in the film.
     the two faults    `glitch`, on the frame each one is taken. */
const CUES = mascotCues(plan);
const DECLINED = CUES.filter(c => c.kind !== 'pop');
const SPLAT = { len: 0.26, f0: 190, f1: 70, third: 0.30, flutter: 46, depth: 0.52,
  tau: 0.080, burst: 0.011, grit: 0.55, lpHz: 1200, seed: 0x19b7c2 };
const SFX_GAINS = { click: -29, crunch: -27 };
function soundCues() {
  const cues = [
    ...TYPING.keys.map(t => ({ t, kind: 'key', from: 'the question typing' })),
    ...CLICKS.map((t, i) => ({ t, kind: 'click', opts: { len: 0.07 },
      from: 'the picker landing on ' + NAMES[i] })),
    { t: GLA_AT, kind: 'glitch', from: 'the first fault, and everything goes' },
    { t: LAND_AT, kind: 'crunch', opts: SPLAT, from: 'the splat, and he is flat' },
    ...CUES.filter(c => c.kind === 'pop').map(c => ({ ...c, from: 'mascotCues — the pill landing' })),
    { t: GLB_AT, kind: 'glitch', opts: { len: 0.10, f0: 220, f1: 78 },
      from: 'the second fault, and the wordmark' },
  ];
  return cues.sort((a, b) => a.t - b.t);
}

/* ==========================================================================
   go
   ========================================================================== */
console.log('the boring tek — post19, which ai do you use');
console.log('');

console.log('the read — two takes, ' + VOICE + ', one per line, delivery per line');
for (const b of B) {
  console.log('  ' + b.sound.start.toFixed(2) + '..' + b.sound.end.toFixed(2) + 's  rate '
    + b.rate.padStart(4) + ' pitch ' + b.pitch.padStart(5) + '  ' + b.wps.toFixed(2) + ' wps  '
    + (b.cached ? 'cached' : 'fetched') + '  "' + b.text + '"');
}
console.log('  ' + B.reduce((a, b) => a + (b.sound.end - b.sound.start), 0).toFixed(2)
  + 's of sound in all, and the silence between them is ' + V.gaps[0].toFixed(2)
  + 's — the label cycle, the fault and the fall, derived off the picture');
console.log('');

console.log('the marks — five files, measured, then placed');
for (const m of MARKS_FILES) {
  console.log('  ' + m.name.padEnd(8) + m.w + 'x' + m.h + '  ink ' + m.ink.w + 'x' + m.ink.h
    + ' (' + (m.fill * 100).toFixed(0) + '% of the canvas)  drawn ' + m.box.w.toFixed(1) + 'x'
    + m.box.h.toFixed(1) + ' css so the ink is ' + m.inkH.toFixed(1) + ' tall');
}
console.log('  all five inks land ' + LOGOS.ink + ' css px tall (' + (LOGOS.ink * DSF)
  + ' device) centred on ' + LOGOS.cx + ',' + LOGOS.cy + ' — see the header for why the '
  + 'canvas is not the mark');
console.log('');

console.log('the typing');
console.log('  "' + PANEL.typed + '", ' + TYPING.chars + ' characters, ' + TYPING.from.toFixed(2)
  + '..' + TYPING.until.toFixed(2) + 's, cut to the read word by word, '
  + TYPING.cps.toFixed(1) + ' characters a second, ' + TYPING.keys.length + ' ticks');
console.log('');

console.log(describeMascot(plan));
const rep = mascotMotion(plan, FPS, SECONDS);
const rep60 = FPS === 60 ? rep : mascotMotion(plan, 60, SECONDS);
console.log(describeMotion(rep60));
console.log('');

console.log(describe(cap));
console.log('  ' + CUT.marked.length + ' break(s) marked on the caption copy only, after the '
  + 'synthesiser: the seam between the two lines, and ' + CARD_BREAKS.join(', ')
  + ' — see CARD_BREAKS for what three words a card cut without them');
console.log('  the face is ' + CAP.family + ' ' + CAP.weight + ', which is this clip\'s own rule '
  + 'over the module\'s Space Grotesk 700 — see capRefit');
console.log('');

console.log('the layout, in css px');
console.log('  the mark row: ink ' + LOGOS.ink + ' tall at ' + LOGOS.cx + ',' + LOGOS.cy
  + ', top edge ' + (LOGOS.cy - LOGOS.ink / 2) + ' against a safe line at ' + SAFE_CSS.top);
console.log('  the panel: ' + PANEL.w + ' x ' + PANEL.h + ' at ' + PANEL.x + ',' + PANEL.y
  + ', ' + PANEL.room.toFixed(1) + ' css of air between its two blocks');
console.log('  the label: "' + NAMES.join('", "') + '" in a ' + NAME_CELL
  + ' css cell at ' + LABEL_PT[0] + ',' + LABEL_PT[1] + ', with "' + MODEL.eff + '" after it');
console.log('  him, under the panel: plate ' + (HEAD.plate.s * plan.unit * SC_A).toFixed(1)
  + ' css / ' + (plan.headPx * SC_A).toFixed(0) + ' device px at ' + MAS.cx + ',' + CY_A
  + ' — his corner size, the card scaled ' + SC_A);
console.log('  him, landed: plate ' + (HEAD.plate.s * plan.unit).toFixed(1) + ' css / '
  + plan.headPx.toFixed(0) + ' device px at ' + MAS.cx + ',' + MAS.cy + ', window is '
  + HEAD_PX.min + '..' + HEAD_PX.max);
console.log('  the pill solves to ' + PILL_W + ' css wide and its spring carries it to x' + PILL_SC
  + ', so off a dead centre head its right edge would reach '
  + (CENTRED_LEFT + PILL_X0 + PILL_W * PILL_SC).toFixed(1) + ' against a safe line at '
  + (VW - SAFE_CSS.right) + ' — so he sits ' + OFF_X + ' css px ('
  + (OFF_X / VW * 100).toFixed(1) + '% of the width) left of the middle, in both halves');
console.log('  the caption band: ' + CAP_BOX.w + ' x ' + CAP_BOX.h + ' at ' + CAP_BOX.x + ','
  + CAP_BOX.y + ', bottom anchored, and it does not move');
console.log('');

console.log('the beats');
const beats = [
  [0, 'black, empty'],
  [PANEL.at, 'the panel fades in over ' + PANEL.in.toFixed(2) + 's, placeholder "'
    + PANEL.placeholder + '", label "' + NAMES[0] + ' ' + MODEL.eff + '"'],
  [MAS_IN, 'he fades up under it, at his corner size'],
  [M_CURIOUS, 'curious: he watches the panel'],
  [TYPING.from, 'the question starts typing, cut to the read word by word'],
  ...B[0].words.map(w => [w.start, '  "' + w.word + '"']),
  [TYPING.until, 'the question is in'],
  ...CLICKS.map((t, i) => [t, '  the picker clicks to ' + NAMES[i] + ', the mark pops in above, '
    + 'and his head turns to the label']),
  [DIZZY.at, 'and the room goes round, ' + DIZZY.for.toFixed(2) + 's of it'],
  [BLINK_AT, '  the blink, ' + (SEED.len * 1000).toFixed(0) + 'ms of lid, off the idle layer'],
  [GLA_AT, 'the first fault, ' + GLA.for.toFixed(2) + 's of it — the panel, the mark and him'],
  [DROP_AT, 'he falls, from ' + DROP.from + ' css px up, on p squared'],
  [B[1].sound.start, 'the answer starts'],
  [LAND_AT, 'he lands, and the splat with him'],
  [LAND_AT + SMASH.flat, '  flat: ' + (1 + SMASH.k).toFixed(2) + ' wide by '
    + (1 / (1 + SMASH.k)).toFixed(2) + ' tall, chin on the ground'],
  [LAND_AT + SMASH.flat + SMASH.back, '  and back out of it'],
  [M_DEL, 'delighted'],
  [BUB.in, 'the first dot climbs off his crown'],
  [BUB_FULL, '"' + THOUGHT + '" is up, and the pop is on the pill'],
  [BUB.leaving, 'the module\'s own hold runs out and the same frame is held on'],
  [GLB_AT, 'the second fault takes it at full size, ' + GLB.for.toFixed(2) + 's'],
  [WM_IN, 'the wordmark, and it holds ' + (SECONDS - WM_IN).toFixed(2) + 's'],
  [SECONDS, 'end'],
].sort((a, b) => a[0] - b[0]);
for (const [t, what] of beats) console.log('  ' + t.toFixed(2) + 's  ' + what);
console.log('');

/* ---------- the sound ---------- */
const cues = soundCues();
const sfx = renderSfx(cues, SECONDS, { gains: SFX_GAINS });
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
    + ' kinds, all of them named in the brief',
  'declined': DECLINED.length + ' cue(s) from mascotCues left out'
    + (DECLINED.length ? ' — ' + DECLINED.map(c => c.kind + ' at ' + c.t.toFixed(2)).join(', ') : ''),
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
console.log('  the dizziness reached ' + state.dizzy.ex.toFixed(2) + '/'
  + state.dizzy.ey.toFixed(2) + ' grid units and ' + state.dizzy.rot.toFixed(2)
  + ' degrees, and no composed eye ever sat more than ' + state.eye.units
  + ' units off its own centre (' + state.eye.t + 's)');
console.log('  the smash reached ' + state.squash.k.toFixed(3) + ' at ' + state.squash.t
  + 's, which is x' + (1 + state.squash.k).toFixed(2) + ' by x'
  + (1 / (1 + state.squash.k)).toFixed(2) + ', and the fall\'s biggest one frame step was '
  + state.step.px + ' css px at ' + state.step.t + 's');
console.log('  a still per beat in ' + path.relative(ROOT, VERIFY));
console.log('');
console.log('  the clock, against the brief\'s eight: ' + SECONDS.toFixed(2) + 's, of which '
  + B.reduce((a, b) => a + (b.sound.end - b.sound.start), 0).toFixed(2) + 's is speech, '
  + ((CLICKS.length - 1) * CYCLE.step).toFixed(2) + 's is the label cycle with no voice on it, '
  + (GLB_AT - BUB.in).toFixed(2) + 's is the thought and ' + (SECONDS - WM_IN).toFixed(2)
  + 's is the end card. the two cuts that would take it under eight: dropping "the boring part '
  + 'is knowing which one for what" off the answer, and taking the cycle to 0.36s a stop');

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
  + RUN.max.toFixed(1) + ' — see the header for why it is not the brief\'s eight');

/* ---------- the read ---------- */
check(B.every(b => b.timing === 'engine'),
  'both takes\' word times come off the engine rather than off an estimate');
check(Math.abs(B[0].sound.start - VOICE_AT) < 0.001,
  'the first take\'s own sound starts on VOICE_AT: ' + B[0].sound.start.toFixed(3)
  + 's, measured off the waveform rather than off the word list');
check(new Set(LINES.map(l => l.rate + l.pitch)).size === 2,
  'the delivery is per line rather than per clip: '
  + LINES.map(l => l.rate + '/' + l.pitch).join(', '));
check(V.gaps[0] > (CLICKS.length - 1) * CYCLE.step,
  'the silence after the question is ' + V.gaps[0].toFixed(2) + 's, which is the whole cycle ('
  + ((CLICKS.length - 1) * CYCLE.step).toFixed(2) + 's) plus the fault and the fall — derived off '
  + 'the picture rather than typed');
check(!/chatgpt/i.test(LINES.map(l => l.text).join(' ')),
  'the read never says the name at all, so the "chat g p t spelled out" rule cannot be broken: '
  + 'the five names are on the screen and nowhere in the copy the voice is handed');

/* ---------- the typing ---------- */
check(TYPING.from === B[0].words[0].start
  && Math.abs(TYPING.until - B[0].words[B[0].words.length - 1].end) < 1e-6,
  'the question is laid across the read word for word: the first character is on "'
  + B[0].words[0].word + '" at ' + TYPING.from.toFixed(3) + 's and the last lands on "'
  + B[0].words[B[0].words.length - 1].word + '" at ' + TYPING.until.toFixed(3));
check(TYPING.cps < 26,
  'it types at ' + TYPING.cps.toFixed(1) + ' characters a second');
if (state.meas) {
  const m = state.meas;
  check(m.line.capPx >= PANEL.minCapPx,
    'the panel\'s line measures ' + m.line.capPx + ' device px of cap, floor is ' + PANEL.minCapPx);
  check(m.line.lines === PANEL.lines,
    'it stays on ' + m.line.lines + ' line, which is what the panel is ' + PANEL.lines
    + ' line tall for');
  check(m.line.room >= PANEL.minRoom,
    'the panel\'s two blocks leave ' + m.line.room.toFixed(1) + ' css px of air between them, '
    + 'floor is ' + PANEL.minRoom);
}
{
  const on = frameAt(PANEL.at + PANEL.in, Math.round((PANEL.at + PANEL.in) * FPS));
  const off = frameAt(PANEL.at + PANEL.caretFor * 0.75, Math.round((PANEL.at + PANEL.caretFor * 0.75) * FPS));
  check(on.panel.caret === 1 && off.panel.caret === 0,
    'the caret blinks on the clip\'s own clock rather than on a css animation, every '
    + PANEL.caretFor.toFixed(2) + 's');
}

/* ---------- the five marks ---------- */
check(MARKS_FILES.length === 5 && MARKS_FILES.every(m => m.alpha),
  'five marks, every one of them a png carrying its own transparency: '
  + MARKS_FILES.map(m => m.name + ' colour ' + m.colour).join(', '));
check(MARKS_FILES.every(m => Math.abs(m.inkH - LOGOS.ink) < 0.01),
  'and all five inks are fitted to the same height, ' + LOGOS.ink + ' css / '
  + (LOGOS.ink * DSF) + ' device px, off each file\'s own measured alpha box — the canvases '
  + 'they sit in are ' + MARKS_FILES.map(m => (m.fill * 100).toFixed(0) + '%').join(', ')
  + ' full, which is why the box is not the mark');
check(MARKS_FILES.every(m => Math.abs(m.box.w / m.box.h - m.w / m.h) < 1e-6),
  'each box keeps its own file\'s natural ratio, so nothing about a mark can be stretched');
{
  const worst = Math.max(...MARKS_FILES.map(m =>
    Math.max(Math.abs(m.left + (m.ink.x + m.ink.w / 2) * m.sc - LOGOS.cx),
      Math.abs(m.top + (m.ink.y + m.ink.h / 2) * m.sc - LOGOS.cy))));
  check(worst < 0.01,
    'and every ink centre lands on the one spot, ' + LOGOS.cx + ',' + LOGOS.cy
    + ', to within ' + worst.toFixed(4) + ' css px');
}
if (state.air) {
  check(state.air.air >= 0,
    'everything drawn stays inside the platform safe area on all ' + state.samples
    + ' sampled frames: the tightest is ' + state.air.what + ' at ' + state.air.t + 's with '
    + state.air.air + ' device px in hand');
}
check(LOGOS.cy - LOGOS.ink / 2 >= SAFE_CSS.top,
  'the row\'s top edge is at ' + (LOGOS.cy - LOGOS.ink / 2) + ' against a safe line at '
  + SAFE_CSS.top + ', so it is ' + ((LOGOS.cy - LOGOS.ink / 2 - SAFE_CSS.top) * DSF)
  + ' device px inside it');
if (state.meas) {
  const hs = state.meas.marks.map(b => b.cssRect.h);
  check(hs.every((h, i) => Math.abs(h - MARKS_FILES[i].box.h) < 0.6),
    'and the rendered boxes are the boxes node solved: '
    + hs.map(h => h.toFixed(1)).join(', ') + ' css tall');
}
{
  /* one mark on the frame at a time, and it is checked at any opacity at all
     rather than over a half: these are opaque tiles, so two of them at a fifth
     each is still one tile printed through another. walked at 240Hz, because a
     crossfade a frame long is exactly the thing this is looking for. */
  let worst = 0, at = 0;
  for (let k = 0; k <= Math.ceil(GLA_AT * 240); k++) {
    const u = k / 240;
    const n = frameAt(u, Math.round(u * FPS)).logos.filter(l => l.o > 0.001).length;
    if (n > worst) { worst = n; at = +u.toFixed(3); }
  }
  check(worst <= 1,
    'never more than one mark is on the frame at any opacity at all (worst ' + worst + ' at '
    + at + 's): the swap is a hard cut on one frame, because these are opaque tiles and a '
    + 'crossfade prints one through the other');
  const before = frameAt(CLICKS[0] - 0.02, Math.round((CLICKS[0] - 0.02) * FPS));
  check(before.logos.every(l => l.o === 0),
    'and nothing is up before the first click: the row is empty until the picker moves');
}
{
  /* the whole window walked at 240Hz rather than one point sampled on it: the
     spring's peak is about two thirds of the way through, and a guard that picked
     a fraction would be measuring where it looked rather than what happened. */
  const pops = CLICKS.map((t, i) => {
    let sc = 0;
    for (let k = 0; k <= 240; k++) {
      const u = t + LOGOS.in * k / 240;
      sc = Math.max(sc, frameAt(u, Math.round(u * FPS)).logos[i].sc);
    }
    return +sc.toFixed(4);
  });
  check(pops.every(x => x > 1.001),
    'each mark springs past its own size on the way in: '
    + pops.map(x => 'x' + x.toFixed(3)).join(', '));
}

/* ---------- the label ---------- */
check(CLICKS.length === NAMES.length && CLICKS.every((t, i) => i === 0 || t > CLICKS[i - 1]),
  'five stops, ' + CYCLE.step.toFixed(2) + 's apart: '
  + NAMES.map((n, i) => n + ' at ' + CLICKS[i].toFixed(2)).join(', '));
{
  const seen = CLICKS.map(t => frameAt(t + 0.01, Math.round((t + 0.01) * FPS)).panel.model);
  check(seen.every((k, i) => k === i),
    'and the label reads them in order: ' + seen.map(k => NAMES[k]).join(', '));
  const first = frameAt(PANEL.at + PANEL.in, Math.round((PANEL.at + PANEL.in) * FPS)).panel.model;
  check(first === 0,
    'the panel arrives carrying "' + NAMES[0] + '", which is why there are five clicks and not '
    + 'four: the first one lands on the name it is already showing and brings its mark with it');
}
if (state.meas) {
  const n = state.meas.name;
  check(n.widest <= n.cell + 0.5,
    'the name cell is ' + n.cell + ' css px and the longest of the five, "' + n.widestWord
    + '", measures ' + n.widest + ' — so counting through them cannot move "' + MODEL.eff + '"');
  check(n.capPx >= 32,
    'and it measures ' + n.capPx + ' device px of cap at ' + MODEL.size + 'css, over the 32 floor: '
    + 'the five names are the payload of the first half rather than chrome');
}

/* ---------- him ---------- */
check(plan.marks.length === MARKS.length,
  'two marks: ' + plan.marks.map(m => m.state).join(', '));
check(plan.marks.every(m => ['curious', 'delighted'].includes(m.state)),
  'and both are inside the brief\'s own list — no unimpressed, nothing flat or angry anywhere '
  + 'in the film');
check(plan.bias === 0,
  'he rests looking straight down the lens — the gaze layer is what points him at things');
check(Math.abs(SC_A - CORNER / SIZE) < 1e-5,
  'one plan at ' + SIZE + ' and two sizes on the card: ' + SC_A + ' under the panel, which is '
  + (plan.headPx * SC_A).toFixed(0) + ' device px of plate, and 1 when he lands, which is '
  + plan.headPx.toFixed(0) + ' — both inside the module\'s ' + HEAD_PX.min + '..' + HEAD_PX.max);
{
  let worst = null;
  for (let f = 0; f < CUT_B; f++) {
    const o = frameAt(f / FPS, f);
    if (o.mo < 0.5 || o.t < LAND_AT) continue;      /* the fall is off frame on purpose */
    const a = headPageRect(o.mas).air;
    const near = Math.min(a.left, a.top, a.right, a.bottom);
    if (!worst || near < worst.near) worst = { t: +(f / FPS).toFixed(2), near: +near.toFixed(1), ...a };
  }
  check(worst.near >= 0,
    'once he has landed his head clears the platform safe area on every frame: ' + worst.near
    + ' device px at ' + worst.t + 's');
}
{
  /* he is under the panel and he never reaches it. walked rather than sampled,
     because the frame that would fail is the one a breath is at its peak on. */
  let worst = null;
  for (let f = 0; f < CUT_A; f++) {
    const o = frameAt(f / FPS, f);
    if (o.mo < 0.5 || o.panel.o < 0.5) continue;
    const hp = headPageRect(o.mas).rect;
    const gap = +(hp.y - PANEL.bottom).toFixed(2);
    if (!worst || gap < worst.gap) worst = { gap, t: +(f / FPS).toFixed(2) };
  }
  check(worst && worst.gap > 0,
    'and his crown never reaches the panel above him: the closest is ' + worst.gap.toFixed(1)
    + ' css px at ' + worst.t + 's');
}
{
  const near = blinksNear(plan);
  check(near.length === 1 && blinkInside(near[0]),
    'exactly one whole idle blink lands while the room is going round ('
    + BLINK_WINDOW[0].toFixed(2) + ' to ' + BLINK_WINDOW[1].toFixed(2) + 's): '
    + BLINK.t.toFixed(2) + '..' + blinkEnd(BLINK).toFixed(2) + 's, seed ' + SEED.seed);
  check(SEED.len >= 0.22,
    'and it is a slow one: ' + (SEED.len * 1000).toFixed(0) + 'ms of lid, out of a search over '
    + 'six thousand seeds');
  check(blinksOnPunch(plan).length === 0,
    'and nothing blinks across the punchline (' + PUNCH[0].toFixed(2) + ' to ' + PUNCH[1].toFixed(2)
    + 's): the lid is a card coloured slab, so a blink under the pill is a blank face at exactly '
    + 'the moment the answer arrives. the whole schedule is '
    + plan.idle.blinks.map(b => b.t.toFixed(2)).join(', ') + 's');
}
check(rep60.frozenFrames === 0, 'the plan\'s face is never frozen: ' + rep60.frozenFrames + ' frames');

/* ---------- the gaze and the dizziness ---------- */
if (state.gaze) {
  check(state.gaze.ex <= GZ.eye + 1e-3 && state.gaze.ey <= GZ.eyeY + 1e-3
    && state.gaze.rot <= GZ.rot + 1e-3 && state.gaze.dx <= GZ.lean + 1e-3,
    'the gaze stays inside its own caps: ' + state.gaze.ex.toFixed(2) + ' / '
    + state.gaze.ey.toFixed(2) + ' grid units, ' + state.gaze.rot.toFixed(2) + ' degrees, '
    + state.gaze.dx.toFixed(2) + ' css px');
  check(state.gaze.rot > 2.0,
    'and it is a head turning rather than a pair of eyes twitching: it reaches '
    + state.gaze.rot.toFixed(2) + ' degrees of tilt and ' + state.gaze.dx.toFixed(2)
    + ' css px of lean toward the label');
}
{
  const fors = [];
  for (const g of GAZE) if (g.at === LABEL_PT) fors.push(g.for);
  check(fors.length === CLICKS.length && fors.every((v, i) => i === 0 || v < fors[i - 1]),
    'he turns to the label on all five switches and quicker every time: '
    + fors.map(v => v.toFixed(2) + 's').join(' → '));
}
if (state.dizzy) {
  check(state.dizzy.ex <= DIZZY.ex + 1e-3 && state.dizzy.ey <= DIZZY.ey + 1e-3
    && state.dizzy.rot <= DIZZY.rot + 1e-3,
    'the dizziness stays inside its own caps: ' + state.dizzy.ex.toFixed(2) + '/'
    + state.dizzy.ey.toFixed(2) + ' grid units and ' + state.dizzy.rot.toFixed(2) + ' degrees');
  /* the two real checks on where the gaze and the reel put the features, and
     both are the module's own measures rather than a unit count this file picked.
     `outside` is the signed distance of the worst placed feature corner from the
     head's own edge, negative inside; `clamped` counts the eyes the module had to
     pull back. the grid units are printed above because they are worth seeing,
     not because a number in them means anything on its own. */
  check(state.outside.d < 0,
    'nothing the gaze and the reel do ever pushes a feature outside the head: the worst corner '
    + 'sits ' + (-state.outside.d).toFixed(2) + ' grid units inside the silhouette (at '
    + state.outside.t + 's), measured by the module rather than by this file');
  check(state.clampedFrames === 0,
    'and the module never had to pull an eye back: ' + state.clampedFrames + ' clamped frames '
    + 'out of ' + state.frames + ', with the eyes reaching ' + state.eye.units + ' grid units off '
    + 'their own centres at ' + state.eye.t + 's');
}
{
  const a = dizzyAt(DIZZY.at - 0.01), b = dizzyAt(DIZZY.end + 0.01);
  check(a.ex === 0 && a.ey === 0 && a.rot === 0 && b.ex === 0 && b.ey === 0 && b.rot === 0,
    'it is nought either side of its own window, so it grows out of the last look and dies into '
    + 'the fault rather than switching on and off');
}

/* ---------- the fall and the smash ---------- */
{
  const up = frameAt(DROP_AT, Math.round(DROP_AT * FPS));
  const rect = headPageRect(up.mas).rect;
  check(rect.y + rect.h <= 0,
    'the fall starts with his whole head off the top of the frame: its chin is at '
    + (rect.y + rect.h).toFixed(1) + ' css px, ' + DROP.from + ' up from his mark');
  check(DROP_AT >= GLA_AT && DROP_AT < GLA_AT + GLA.for,
    'and it starts on the fault\'s own first frame (' + DROP_AT.toFixed(2) + 's against '
    + GLA_AT.toFixed(2) + '..' + (GLA_AT + GLA.for).toFixed(2) + '), so he falls through the '
    + 'whole tear rather than through the back half of it');
  {
    /* how fast it actually is, because the shutter is what set its length. */
    const vPeak = 2 * DROP.from / DROP.for;
    const perFrame = vPeak / 60;
    check(perFrame < 42,
      'it peaks at ' + vPeak.toFixed(0) + ' css px a second, which is ' + perFrame.toFixed(1)
      + ' css px on the frame it lands and ' + (perFrame * DSF / 6).toFixed(1)
      + ' device px between two samples at six subframes — the shutter is what set the length, '
      + 'see DROP');
  }
  check(Math.abs(fallAt(LAND_AT)) < 1e-9 && fallAt(LAND_AT - 0.001) < 0,
    'and it lands exactly on ' + LAND_AT.toFixed(2) + 's');
}
{
  /* walked at 480Hz rather than read off the render's own samples: the
     compression is 70ms, which is under a frame at twelve, so the preview pass
     never lands on its peak and a guard reading the render would be measuring the
     sampling rate. what the render did see is printed above. */
  let peak = 0, at = 0;
  const to = LAND_AT + SMASH.flat + SMASH.back;
  for (let k = 0; k <= 480; k++) {
    const u = DROP_AT + (to - DROP_AT) * k / 480;
    const v = squashAt(u);
    if (Math.abs(v) > Math.abs(peak)) { peak = v; at = +u.toFixed(3); }
  }
  check(Math.abs(peak - SMASH.k) < 0.005,
    'the smash reaches ' + peak.toFixed(3) + ' at ' + at + 's, which is x'
    + (1 + SMASH.k).toFixed(2) + ' wide by x' + (1 / (1 + SMASH.k)).toFixed(2)
    + ' tall — the brief\'s big squash, and it is this file\'s own layer rather than the '
    + 'module\'s ' + (rep60.maxSquash * 100).toFixed(1) + '%');
  const air = squashAt(LAND_AT - 0.001);
  check(Math.abs(air + SMASH.air) < 0.002,
    'and he is stretched ' + (-air).toFixed(3) + ' on the way down, which is what makes the '
    + 'compression read as an arrival rather than as a squeeze');
}
{
  /* the chin does not move while he is flat, which is what the ground
     compensation is for. the window is the landing to the `delighted` mark and no
     further, and that is not the guard being generous: from its own mark the
     state authors the card and its entrance lifts the head on purpose. what is
     being checked is that the squash on its own never does. */
  let worst = 0, at = 0, n = 0;
  const ground = MAS.cy + R;
  for (let k = 0; k <= 480; k++) {
    const u = LAND_AT + (M_DEL - LAND_AT) * k / 480;
    const r = headPageRect(frameAt(u, Math.round(u * FPS)).mas).rect;
    const d = Math.abs(r.y + r.h - ground);
    n++;
    if (d > worst) { worst = d; at = +u.toFixed(3); }
  }
  check(worst < 3.0,
    'and his chin stays on the ground through the compression: over ' + n + ' samples between '
    + LAND_AT.toFixed(2) + ' and the mark at ' + M_DEL.toFixed(2) + 's the bottom edge moves at '
    + 'most ' + worst.toFixed(2) + ' css px against a line at ' + ground.toFixed(1)
    + ', and past that the state owns the card');
}
{
  /* the spring out of it, as three numbers rather than as a claim: one run below
     zero, how deep it is against the compression it is recovering from, and how
     much is left after it. a damped cosine has a second positive lobe and that is
     what a spring is; what would be wrong is one big enough to read as a bounce. */
  const from = LAND_AT + SMASH.flat, to = from + SMASH.back;
  let runs = 0, deepest = 0, tail = 0, wasNeg = false, crossedBack = false;
  for (let i = 0; i <= 800; i++) {
    const v = squashAt(from + (to - from) * i / 800);
    if (v < 0) {
      if (!wasNeg) runs++;
      wasNeg = true;
      deepest = Math.min(deepest, v);
    } else {
      if (wasNeg) crossedBack = true;
      wasNeg = false;
      if (crossedBack) tail = Math.max(tail, v);
    }
  }
  check(runs === 1,
    'the spring goes below zero exactly once (' + runs + ' run), so there is one stretch on the '
    + 'way back out: ' + deepest.toFixed(3) + ' against the ' + SMASH.k.toFixed(2)
    + ' it is recovering from, which is ' + (deepest / -SMASH.k * 100).toFixed(0) + '% of it');
  check(tail < SMASH.k * 0.02,
    'and what is left after that stretch is ' + tail.toFixed(4) + ', under two per cent of the '
    + 'compression — a settle rather than a bounce');
  check(Math.abs(squashAt(to + 0.01)) < 1e-9,
    'it is finished at ' + to.toFixed(2) + 's');
}
check(!MARKS.some(m => m.t > GLA_AT && m.t < LAND_AT),
  'no state change lands inside the fall: the entrance rides the spring out of the smash '
  + 'rather than fighting it (delighted at ' + M_DEL.toFixed(2) + 's, the landing at '
  + LAND_AT.toFixed(2) + ')');

/* ---------- the thought ---------- */
check(plan.thought.mode === 'over' && plan.thought.asked === 'over-right',
  'the thought is the module\'s own placement over the crown, asked for as '
  + plan.thought.asked + ', at ' + plan.thought.angle + ' degrees, lifts '
  + plan.thought.lifts.join('/') + ' — nothing about it is hand placed');
check(Math.abs(BUB.in - BUB_IN) < 1e-6 && Math.abs(BUB.leaving - BUB_LEAVING) < 1e-6,
  'the film was sized off the module\'s own bubble profile and the plan agrees: in '
  + BUB.in.toFixed(3) + ' against ' + BUB_IN.toFixed(3) + ', leaving ' + BUB.leaving.toFixed(3)
  + ' against ' + BUB_LEAVING.toFixed(3));
check(BUB.text === THOUGHT, 'the pill says "' + BUB.text + '"');
check(Math.abs((GLB_AT - BUB.full) - (BUBBLE.hold + HOLD_EXTRA)) < 1e-6,
  'it is fully up for ' + (GLB_AT - BUB.full).toFixed(2) + 's: the module\'s own '
  + BUBBLE.hold.toFixed(2) + ' — which is its ceiling and cannot be asked for from outside — and '
  + HOLD_EXTRA.toFixed(2) + 's of the same frame held on after it, derived off the read\'s own '
  + 'last sound rather than typed');
check(Math.abs((BUB.in + BUBBLE.in + BUBBLE.hold) - BUB.leaving) < 1e-6,
  'and the module\'s own half of it is ' + BUBBLE.in.toFixed(2) + ' in plus '
  + BUBBLE.hold.toFixed(2) + ' hold, which is the brief\'s "about a second and a half"');
{
  /* the held frame is the module's last fully up one and nothing else on the face
     is held with it. */
  const a = frameAt(BUB.leaving + 0.02, Math.round((BUB.leaving + 0.02) * FPS));
  const b = frameAt(GLB_AT - 2 / FPS, CUT_B - 2);
  check(a.mas.bubble.pill.sc === b.mas.bubble.pill.sc && a.mas.bubble.pill.sc > 0.99,
    'the held frames are the same pill at x' + a.mas.bubble.pill.sc.toFixed(3)
    + ' and the module holds exactly those two numbers during its own hold, so the extra frames '
    + 'are the same still pill for the same reason');
  check(a.mas.card.y !== b.mas.card.y || a.mas.eyes[0].lid !== b.mas.eyes[0].lid
    || a.mas.card.sx !== b.mas.card.sx,
    'and nothing else on the face is held with it: the idle layer, the breath and the spring '
    + 'all run on the clip\'s own clock underneath');
}
{
  /* the bubble is a sibling of the card and is not scaled with it, and it does
     not need to be — it is only ever up at full size. */
  let bad = 0;
  for (let f = 0; f < CUT_B; f++) {
    const o = frameAt(f / FPS, f);
    if (o.mo > 0.5 && o.mas.bubble.o > 0.02 && f < CUT_A) bad++;
  }
  check(bad === 0,
    'the thought is never up while the card is scaled to his corner size (' + bad
    + ' frames), which is what lets the cluster be a sibling of the card rather than a child');
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
  'he sits ' + OFF_X + ' css px left of the frame\'s middle, derived rather than chosen: exactly '
  + 'what the pill needs to keep ' + PILL_AIR + 'px inside the safe line, and it is the same '
  + 'number in both halves so his own centre line never moves');
if (state.caps) {
  check(state.caps.capPx >= BUBBLE.minCap,
    'the thought\'s caps measure ' + state.caps.capPx + ' device px, floor is ' + BUBBLE.minCap);
}

/* ---------- the captions ---------- */
{
  const said = V.words.map(w => w.word.replace(/[.,]$/, ''));
  const drawn = cap.groups.flatMap(g => g.words.map(w => w.word));
  check(said.length === drawn.length && said.every((w, i) => w === drawn[i]),
    'the cards carry the words the voice actually said, in order, and **both lines are '
    + 'captioned**, which is the brief: ' + drawn.length + ' drawn against ' + said.length
    + ' spoken');
  const cards = cap.groups.map(g => g.words.map(w => w.word).join(' '));
  check(cards.every(c => c.split(' ').length <= CAP.perCard),
    'the cards are ' + cards.map(c => '"' + c + '"').join(', ') + ' \u2014 four words at the most, '
    + 'and the three breaks in CARD_BREAKS are what keep them phrases rather than fragments');
  check(CAP_OUT < GLB_AT,
    'the last card is out at ' + CAP_OUT.toFixed(2) + 's, before the fault at ' + GLB_AT.toFixed(2)
    + ' — and the fault is derived off whichever of the two finishes last, which here is '
    + (B[1].sound.end + FAULT_LEAD >= CAP_OUT + 0.05 ? 'the read' : 'the last card'));
}
if (state.built && state.built.capRefit) {
  const r = state.built.capRefit;
  check(r.family === CAP.family && String(r.weight) === String(CAP.weight),
    'the captions are set in ' + r.family + ' ' + r.weight + ', which is the face this clip asked '
    + 'for rather than the module\'s own');
  check(r.capPx >= 40, 'they measure ' + r.capPx + ' device px of cap at ' + r.size + 'css px');
  check(r.size <= CAP.floatSize + 1e-6 && r.widestEm * r.size * r.maxScale <= CAP_BOX.w + 0.5,
    'and the refit fits the widest card inside the band with its own spring in hand: "' + r.widest
    + '" is ' + (r.widestEm * r.size).toFixed(1) + ' css px at this size, ' + CAP_BOX.w + ' available');
}
if (state.cap) {
  check(state.cap.air >= 0,
    'the captions stay inside the platform safe area on all ' + state.capSamples
    + ' sampled frames: ' + state.cap.air + ' device px at ' + state.cap.t + 's');
  check(state.cap.top > MAS.cy + R,
    'and the band stays under him: the highest caption ink is at ' + state.cap.top
    + ' css against his landed chin at ' + (MAS.cy + R).toFixed(0));
}

/* ---------- the two faults and the end ---------- */
check(GL_WINDOWS_60.length === 2 && GLA_AT < GLB_AT,
  'two faults, ' + ((GLB_AT - GLA_AT) * 1000).toFixed(0) + 'ms apart, '
  + GL_WINDOWS_60[0].frames + ' and ' + GL_WINDOWS_60[1].frames + ' frames of them at sixty');
{
  const before = frameAt((CUT_A - 1) / FPS, CUT_A - 1);
  const on = frameAt(CUT_A / FPS, CUT_A);
  check(before.panel.o > 0.9 && on.panel.o === 0 && on.logos.every(l => l.o === 0),
    'the first fault takes the panel and the mark on one frame: both are on at frame '
    + (CUT_A - 1) + ' and gone at ' + CUT_A);
  const wasHere = headPageRect(before.mas).rect;
  const gone = headPageRect(on.mas).rect;
  check(wasHere.y + wasHere.h > 0 && gone.y + gone.h <= 0,
    'and it takes him too, by putting him 560 css px up: his chin is at '
    + (wasHere.y + wasHere.h).toFixed(0) + ' css on frame ' + (CUT_A - 1) + ' and at '
    + (gone.y + gone.h).toFixed(1) + ' on ' + CUT_A + ', which is off the top of the frame. '
    + 'the fall starts on that frame, so there is no instant he is neither here nor falling');
}
{
  const before = frameAt((CUT_B - 1) / FPS, CUT_B - 1);
  const on = frameAt(CUT_B / FPS, CUT_B);
  check(before.mo > 0.9 && on.mo === 0,
    'and the second takes him on one frame: on at ' + (CUT_B - 1) + ', gone at ' + CUT_B);
  check(before.wm.o === 0 && on.wm.o > 0,
    'the wordmark is born on that frame rather than at that time, which is post13\'s correction');
  check(before.mas.bubble.pill.sc > 0.99,
    'and the thought is cut at full size rather than shrinking away first: the pill is at x'
    + before.mas.bubble.pill.sc.toFixed(3) + ' on the last frame it is on');
}
check(Math.abs((SECONDS - WM_IN) - (END_HOLD + 1 / FPS)) < 0.03,
  'the end card is on the screen for ' + (SECONDS - WM_IN).toFixed(2) + 's, which is the brief\'s '
  + 'about one second');
check(WM.lines.length === 3 && !WM.lines.join(' ').includes('.'),
  'and it is the wordmark on three lines with nothing else on it, no domain: ' + WM.lines.join(' / '));
if (state.built) {
  check(state.built.wm.capPx >= WM.minCapPx,
    'it measures ' + state.built.wm.capPx + ' device px of cap, floor is ' + WM.minCapPx);
}

/* ---------- liveness ---------- */
{
  const seen = new Set();
  let dupes = 0, first = null;
  for (let i = 0; i < state.sigs.length; i++) {
    if (seen.has(state.sigs[i])) { dupes++; if (first == null) first = i; }
    seen.add(state.sigs[i]);
  }
  check(dupes === 0, 'no two frames of the film are identical: ' + dupes + ' repeats in '
    + state.sigs.length + ' frames' + (first == null ? '' : ', first at frame ' + first));
}

/* ---------- the sound ---------- */
check(cues.filter(c => c.kind === 'key').length === TYPING.keys.length,
  TYPING.keys.length + ' key ticks, every one off the typing plan\'s own list rather than off '
  + 'a rate');
check(cues.filter(c => c.kind === 'click').length === NAMES.length,
  NAMES.length + ' clicks, one per stop, at ' + SFX_GAINS.click + ' dB rather than the table\'s '
  + 'own -25 — five inside two seconds is a picker being flicked rather than five events');
check(cues.filter(c => c.kind === 'crunch').length === 1
  && Math.abs(cues.find(c => c.kind === 'crunch').t - LAND_AT) < 1e-6,
  'one splat, on the landing frame and nowhere else: crunch taken low and wet, '
  + SPLAT.f0 + ' down to ' + SPLAT.f1 + ' hertz under a ' + SPLAT.lpHz + ' ceiling, at '
  + SFX_GAINS.crunch + ' dB');
check(cues.filter(c => c.kind === 'pop').length === 1
  && Math.abs(cues.find(c => c.kind === 'pop').t - (BUB.in + BUBBLE.step * 2)) < 1e-6,
  'one pop, and it is mascotCues\' own on the pill rather than on the first dot');
check(cues.filter(c => c.kind === 'glitch').length === 2,
  'two glitch hits, one per fault');
check(new Set(cues.map(c => c.kind)).size === 5,
  'five kinds of sound in the whole film, which is the brief\'s list exactly: '
  + [...new Set(cues.map(c => c.kind))].join(', '));
check(cues.filter(c => c.kind === 'hum').length === 0,
  'there is no music in it, which is the brief');
{
  const late = cues.filter(c => c.t > GLB_AT + 1e-6);
  check(late.length === 0, 'nothing is heard after the second fault: ' + late.length + ' cues past '
    + GLB_AT.toFixed(2) + 's');
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
if (state.meas) {
  check(state.meas.shadow === 'hidden',
    'the module\'s shadow element is ' + state.meas.shadow + ' on this page: it fills with --face, '
    + 'which is near white on dark, and its opacity is written per frame without reading the '
    + '--m-shadow-o the module declares for exactly this. the rule is this clip\'s, lib is not '
    + 'touched, and what it implements is the module\'s own comment');
}
check(plan.band === null,
  'planMascot was handed no band: the caption band is '
  + (CAP_BOX.y - (MAS.cy + R)).toFixed(0) + ' css px under his landed chin and the cluster is '
  + 'checked against the rendered frame instead');

console.log('');
for (const m of note) console.log('  ok    ' + m);
for (const m of fail) console.log('  FAIL  ' + m);
console.log('');
console.log(fail.length ? '  ' + fail.length + ' GUARD(S) FAILED' : '  all ' + note.length + ' guards green');
process.exit(fail.length ? 1 : 0);
