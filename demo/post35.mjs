/* the boring tek — post35. ai agrees to slow down.

   dark only, 1080x1920, five lines read by edge's andrew, about 20 seconds
   on the brief's clock and as long as the read needs on the real one. slow
   first, then faster. voice only on the bus: no ticks, no beeps.

     one    0 to 3      a news card in the house card style, upper middle,
                        text only: a mono label, `this week in ai`, then a
                        headline typed in line by line under a bar cursor,
                        `three ai leaders` / `agree to slow down`. he sits
                        below the card at the house size, eyes calm and up
                        at the card, one blink as the last character lands.
                        the card holds until two, then slides up and out.
     two    3 to 10     three tiles spring in a row across the middle on
                        their names, the claude mark, the chatgpt mark and
                        the x ai tile (its png if there is one, else text in
                        michroma). a thin line joins the three under the row,
                        then one check springs above the row on `agreed`. he
                        moves from under the news card to under the row,
                        small, and goes happy. on the second sentence a card
                        the row's width comes in under the line with a speed
                        line in it, fast short dashes left to right, and on
                        `slower` they slow and space out into a calm even
                        rhythm.
     three  10 to 14.5  the calm rhythm holds. he nods once on `pacing`.
     four   14.5 to 18  the tiles, the check, the line and the speed card
                        fade. a card comes in with three pills, build, test,
                        build, each lighting on its word, then a small loop
                        arrow draws under them from the last back to the
                        first. he stays below the card.
     five   18 to 20.5  the pills go. he springs to the middle at the house
                        size, calm, the wordmark under him, `theboringtek.com`
                        small under that. held to the end.

   the scene starts are the brief's, floored by the read: a scene never
   starts before the line before it has finished sounding plus 0.30, post30's
   rule, so a long take pushes what follows rather than being cut.

   **the brief put the speed line in three and the word it turns on, `slower`,
   is the last word of two.** the picture follows the word: the dashes race in
   on two's second sentence and slow on `slower`, and three is the calm
   rhythm with the nod on `pacing`.

   **a card holds text or props and never him.** the news card, the speed
   card and the pill card are the same house card, --field on --bg with a
   --line border, and he sits below every one of them; a guard walks his head
   against each card's box while it is up.

   **every line is subtitled** under everything, post31's way: nunito, white,
   one or two short lines, centred, one slot under him, the cards and the
   address, never over any of them, no full stop on screen.

   **the marks are assets**, `demo/assets/logo-claude.png`,
   `demo/assets/logo-chatgpt.png` and, if it is ever there,
   `demo/assets/logo-xai.png`, each placed as a background at its own ratio
   with its ink solved to one height, post31's way; nothing here draws a
   brand. if a file is not there its tile is a text tile that says the name,
   which is what the third one is today.

   **the nod is one dip composed onto his zone**, not the module's `agreeing`,
   which is two nods, and **the look up at the card is one offset composed
   onto the eyes**, in grid units, checked against the head silhouette the
   same way the module checks its own. the eyes are the module's neutral and
   delighted only. **the blink on the finished headline is the module's
   own**: the seed is searched until one of its blinks lands in the window
   after the last character and none lands on the landings.

   **the read is edge at minus five per cent with a 300ms stop at every full
   stop**, post31's take() copied whole: every sentence its own take,
   assembled with exactly BREAK_MS of silence between them.

     node post35.mjs                     1080x1920, 60fps, shutter closed
     DEMO_FPS=12 node post35.mjs         the fast preview pass
     node post35.mjs --voice             the read and the clock only, no browser
     node post35.mjs --blur              60fps with the shutter open, solved
     node post35.mjs --keep-frames       leave the jpegs on disk
     node post35.mjs --encode-only       re-encode from kept frames

   one output, one path, overwritten every run:

     demo/out/post35-dark-1080x1920.mp4

   ---------- what is borrowed and from where ----------

   **the mascot is `lib/mascot.mjs` and nothing here reaches inside it.** two
   states, neutral and delighted, no hands, no bubble. the move under the
   row, the nod and the spring to the middle are one translate composed onto
   `frame.card`, post29's pattern; the shadow is declined, post26.

   **the voice is edge, on purpose,** post29's rule: every take asks for
   `provider: 'edge'` and the sidecar is refused from anywhere else. */

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  planMascot, mascotFrame, mascotMotion, mascotCues, mascotCss, mascotMarkup,
  mascotRuntime, mascotPagePlan, describeMascot, describeMotion, headRect, headSD,
  STAGE, SAFE, HEAD, GRID, EYE_CX,
} from './lib/mascot.mjs';
import { brandTokens } from './lib/captions.mjs';
import { speak, VOICE_OUT } from './lib/voice.mjs';
import { writeWav, applyGain, limit, loudness, decode, SR } from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post35');
const SUBS = path.join(OUT, 'subframes-post35');
const VERIFY = path.join(OUT, 'verify-post35');
const ASSETS = path.join(HERE, 'assets');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = STAGE.dsf;
const VW = STAGE.w, VH = STAGE.h;
const SAFE_CSS = { top: SAFE.top / DSF, bottom: SAFE.bottom / DSF, left: SAFE.left / DSF, right: SAFE.right / DSF };
/* the brief's own margin, 120 device px on every side. the house safe area is
   stricter on every side and both are checked. */
const BRIEF_SAFE = 120;

const argv = process.argv.slice(2);
const ONLY_ENCODE = argv.includes('--encode-only');
const VOICE_ONLY = argv.includes('--voice');
const KEEP = argv.includes('--keep-frames');
const BLUR = argv.some(a => a === '--blur' || a.startsWith('--blur='));
const BLUR_ARG = Number((argv.find(a => a.startsWith('--blur=')) || '').split('=')[1]) || 0;
const SUB_STEP_WANT = 6.3;
const SUB_MAX = 12;
let SUB = 1;
let SUBSTEP = STEP;

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- the clock ----------
   the brief's scene starts, each floored once the takes are measured: a
   scene starts no earlier than the line before it stops sounding plus
   AFTER_LINE. `END` is the last sound plus AFTER_READ, so the end card holds.
   scene two is floored at 3.0 so the first beat is slow; the rest start 0.30
   after the line before them stops, so the film carries no air. */
const BRIEF = [0, 3.0, 0, 0, 0];
const BRIEF_END = 20;
const AFTER_LINE = 0.30;
const AFTER_READ = 1.00;
const SC = BRIEF.slice();
let END = BRIEF_END;
let SECONDS = 0;

/* ---------- the copy, and the read ----------
   the read keeps its stops; a full stop before `the boring tek`. */
const VOICE = 'calm';
const RATE = '-5%';
const BREAK_MS = 300;
const LINES = [
  { text: 'this week something rare happened in ai.', rate: RATE, pitch: '+1Hz' },
  { text: 'the heads of anthropic, open ai and x ai agreed on one thing. the most powerful ai should be built slower.', rate: RATE, pitch: '+1Hz' },
  { text: 'they call it pacing. more time for safety work as the models get stronger.', rate: RATE, pitch: '+1Hz' },
  { text: 'not a stop. a speed limit. build, test, then build more.', rate: RATE, pitch: '+1Hz' },
  { text: 'boring news. good news. the boring tek.', rate: RATE, pitch: '+2Hz' },
];
/* ---------- the subtitles ----------
   one card per sentence or so, cut to the read's own words by index into
   the take, the screen lines broken by hand so nothing wraps. no full stop
   on screen; the read keeps its stops. */
const SUBTITLES = [
  { line: 0, words: [0, 6], lines: ['this week something rare', 'happened in ai'] },
  { line: 1, words: [0, 8], lines: ['the heads of anthropic,', 'open ai and x ai'] },
  { line: 1, words: [9, 12], lines: ['agreed on one thing'] },
  { line: 1, words: [13, 20], lines: ['the most powerful ai', 'should be built slower'] },
  { line: 2, words: [0, 3], lines: ['they call it pacing'] },
  { line: 2, words: [4, 13], lines: ['more time for safety work', 'as the models get stronger'] },
  { line: 3, words: [0, 5], lines: ['not a stop, a speed limit'] },
  { line: 3, words: [6, 10], lines: ['build, test, then build more'] },
  { line: 4, words: [0, 3], lines: ['boring news, good news'] },
  { line: 4, words: [4, 6], lines: ['the boring tek'] },
];
/* one slot, under everything: he ends at 614 under the row, the speed card
   at 534, the pill card at 506, the address at 569, and the slot starts at
   660. */
const ST = { size: 22, lh: 1.3, weight: 600, top: 660, lead: 0.05, tail: 0.30, fadeIn: 0.12, fadeOut: 0.15, rise: 6 };
const SILENCE_DB = -42;
const PRE = 0.06, POST = 0.10, EDGE_FADE = 0.012;

/* ---------- what is on the screen ----------
   every string a viewer reads, in one place, so the copy guard can walk them. */
/* one: the news card. the house dark card, --field on --bg, a --line
   border, 18px radius, text only: a mono label, then the headline typed in
   line by line at a fixed rate under a bar cursor that blinks on a fixed
   clock once the typing stops. it holds until two and slides up and out. */
const NEWS = {
  w: 380, h: 118, left: 80, top: 128, radius: 18, pad: 18, padX: 20,
  label: 'this week in ai', labelSize: 11,
  lines: ['three ai leaders', 'agree to slow down'], lineSize: 20, lh: 1.35, gap: 14,
  type: { from: 0.50, cps: 18, pause: 0.15 },
  cursor: { w: 2, period: 1.0 },
  out: { at: 0, for: 0.35, up: -40 },
};
NEWS.bottom = NEWS.top + NEWS.h;
/* the typing clock: line one from `from`, line two after a pause, done at
   the last character */
NEWS.typed = [];
for (const [i, l] of NEWS.lines.entries()) {
  const from = i === 0 ? NEWS.type.from : NEWS.typed[i - 1].to + NEWS.type.pause;
  NEWS.typed.push({ from: +from.toFixed(4), to: +(from + l.length / NEWS.type.cps).toFixed(4) });
}
NEWS.done = NEWS.typed[NEWS.typed.length - 1].to;
/* his look up at the card: an offset on both eyes, in grid units, in over
   `for` from `at` and back out over the move to two */
const LOOK = { up: -4.2, at: 0.15, for: 0.35, outFor: 0.35 };
/* the one blink on the finished headline: the window a module blink must
   start in, and the quiet before it so it reads as one */
const BLINK = { after: 0.05, within: 0.20, quiet: 0.70 };
/* two and three: the row of three, the check above it, the line under it, the speed line under that */
const ROW = { w: 110, h: 80, gap: 22, top: 370, radius: 14, font: 13, popFor: 0.40, popFrom: 0.6, ink: 42 };
ROW.left = (VW - (3 * ROW.w + 2 * ROW.gap)) / 2;
ROW.bottom = ROW.top + ROW.h;
const TILES = [
  { key: 'claude', file: path.join(ASSETS, 'logo-claude.png'), say: 'anthropic', text: 'claude', at: 0 },
  { key: 'chatgpt', file: path.join(ASSETS, 'logo-chatgpt.png'), say: 'open', text: 'chatgpt', at: 0 },
  { key: 'xai', file: path.join(ASSETS, 'logo-xai.png'), say: 'x', text: 'x ai', at: 0 },
].map((tl, i) => ({ ...tl, x: +(ROW.left + i * (ROW.w + ROW.gap)).toFixed(2), y: ROW.top, cx: +(ROW.left + i * (ROW.w + ROW.gap) + ROW.w / 2).toFixed(2), exists: !!(tl.file && fs.existsSync(tl.file)) }));
const CHK = { size: 44, top: 298, at: 0, popFor: 0.40, popFrom: 0.5, drawAfter: 0.05, drawFor: 0.30, say: 'agreed', d: 'M11 23l7 7l15-16', len: 0 };
CHK.len = +(Math.hypot(7, 7) + Math.hypot(15, 16)).toFixed(3);
CHK.left = (VW - CHK.size) / 2;
/* the connecting line: a bus under the row from the first tile's centre to
   the last's, and a short stub down from each tile to it */
/* the bus starts while the last tile is still landing, so it is joined before `agreed` */
const CONN = { y: ROW.bottom + 18, at: 0, for: 0.30, stubFor: 0.15, after: 0.25 };
CONN.len = +(TILES[2].cx - TILES[0].cx).toFixed(2);
CONN.stub = CONN.y - ROW.bottom;
/* the speed line: a track the row's width, dashes racing left to right. fast
   is short dashes close together moving quickly; calm is shorter dashes far
   apart moving slowly. the change runs over SLOW.for from the word. the
   dashes are a set anchored at the track's centre, x = w/2 + (phase mod
   period) + k * period, so the pattern is continuous while the period grows
   and no dash ever jumps; anchored at the centre rather than at the left end
   so the spreading is shared by both ends rather than piled onto the far
   one. the mix is eased in and out, so nothing sprints when the word lands. */
/* the speed card: the house card, the row's width, under the line, and the
   track sits inside it */
const SCARD = { left: ROW.left, top: 490, w: 3 * ROW.w + 2 * ROW.gap, h: 44, radius: 14, pad: 14 };
SCARD.bottom = SCARD.top + SCARD.h;
const SPEED = {
  x: SCARD.pad, w: SCARD.w - 2 * SCARD.pad, y: (SCARD.h - 3) / 2, h: 3, at: 0, say: 'most', n: 18, fade: 28,
  fast: { len: 18, period: 34, v: 460 },
  calm: { len: 8, period: 62, v: 70 },
};
const SLOW = { at: 0, for: 1.20, say: 'slower' };
const NOD = { at: 0, say: 'pacing', up: 2.5, upFor: 0.10, dip: 6.5, downFor: 0.16, backFor: 0.34 };
/* four: the pill card, three pills and the loop arrow inside it */
const PCARD = { left: 80, top: 356, w: 380, h: 150, radius: 18, at: 0, for: 0.40, popFrom: 0.96 };
PCARD.bottom = PCARD.top + PCARD.h;
const PILL = { w: 96, h: 34, gap: 18, top: PCARD.top + 30, font: 12, popFor: 0.40, popFrom: 0.7, stagger: 0.08, litFor: 0.25, names: ['build', 'test', 'build'], nth: [1, 1, 2] };
PILL.left = (VW - (3 * PILL.w + 2 * PILL.gap)) / 2;
PILL.bottom = PILL.top + PILL.h;
PILL.items = PILL.names.map((name, i) => ({ name, nth: PILL.nth[i], x: +(PILL.left + i * (PILL.w + PILL.gap)).toFixed(2), cx: +(PILL.left + i * (PILL.w + PILL.gap) + PILL.w / 2).toFixed(2), at: 0, lit: 0 }));
const LOOP = { at: 0, for: 0.40, headFor: 0.15, after: 0.15, drop: 52, gap: 8, head: 7 };
LOOP.x1 = PILL.items[2].cx; LOOP.x0 = PILL.items[0].cx; LOOP.y = PILL.bottom + LOOP.gap;
LOOP.d = 'M' + LOOP.x1 + ' ' + LOOP.y + ' C' + LOOP.x1 + ' ' + (LOOP.y + LOOP.drop) + ', ' + LOOP.x0 + ' ' + (LOOP.y + LOOP.drop) + ', ' + LOOP.x0 + ' ' + LOOP.y;
LOOP.headD = 'M' + (LOOP.x0 - LOOP.head) + ' ' + (LOOP.y + LOOP.head) + 'L' + LOOP.x0 + ' ' + LOOP.y + 'L' + (LOOP.x0 + LOOP.head) + ' ' + (LOOP.y + LOOP.head);
/* the sizes he sits at and where */
const SMALL = { s: 0.42 };
const HEAD_Y = 250;
const SIZE = 148;
const S1_Y = 340;
const BELOW_Y = 585;
/* five: the wordmark and the address */
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 300, lh: 1.16, top: 360, minCapPx: 50 };
const ADDR = { text: 'theboringtek.com', size: 16, top: 548 };

/* ---------- the entrances, the exits and the pops ---------- */
const SPRING = { for: 0.50 };                  /* under the row to the middle */
const MOVE = { at: 0, for: 0.55 };             /* under the news card to under the row, shrinking */
const IN = { at: 0 };
const HAPPY = { at: 0 }, CALM1 = { at: 0 }, CALM = { at: 0 };
const ROW_OUT = { at: 0, for: 0.35 };
const PILL_OUT = { at: 0, for: 0.25 };
const WM1 = { at: 0, for: 0.09 }, ADDR_IN = { at: 0, for: 0.30 };

const CRF = 17;
const TARGET_LUFS = -14;
const SAMPLE_CEILING = -1.8;
const PEAK_CEILING = -1.0;
const MAX_REDUCTION = 5.0;
const STEP_CEIL = 56;

/* ---------- the small maths ---------- */
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
      const d = dfx(t);
      if (Math.abs(d) < 1e-6) break;
      const e = fx(t) - x;
      if (Math.abs(e) < 1e-6) break;
      t -= e / d;
    }
    return fy(Math.max(0, Math.min(1, t)));
  };
}
const EASE = bezier(.16, 1, .3, 1);            /* the site's own --ease */
const POP = bezier(.34, 1.4, .64, 1);          /* the site's own --spring */
const RISE = bezier(.5, 0, .3, 1.3);           /* post30's rise, the overshoot with a slow start */
const INOUT = bezier(.45, 0, .55, 1);          /* the vignette's own in and out, for the slowing */
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))));
const lerp = (a, b, p) => a + (b - a) * p;
function phosphor(t, amp, slow, fast, phase) {
  return 1 + amp * 0.78 * Math.sin(2 * Math.PI * t / slow) + amp * 0.39 * Math.sin(2 * Math.PI * t / fast + phase);
}
const bare = w => w.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '');

/* ---------- the marks, measured ----------
   the png header for the file's size, ffmpeg for the alpha bounding box of
   the ink, and the element's box solved so the ink is ROW.ink tall with its
   centre on the tile's centre. post31's, post30's before it. */
function pngFacts(file) {
  const b = fs.readFileSync(file);
  if (!(b.length > 24 && b.readUInt32BE(0) === 0x89504e47)) throw new Error(path.relative(ROOT, file) + ' is not a png');
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), bytes: b.length };
}
function inkBox(file, w, h) {
  const raw = execFileSync(ffmpeg, ['-v', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1 << 28 });
  if (raw.length !== w * h * 4) throw new Error(path.relative(ROOT, file) + ' decoded to ' + raw.length + ' bytes against ' + (w * h * 4));
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (raw[(y * w + x) * 4 + 3] <= 10) continue;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  if (x1 < 0) throw new Error(path.relative(ROOT, file) + ' is empty');
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
for (const tl of TILES) {
  if (!tl.exists) { tl.mark = null; continue; }
  const p = pngFacts(tl.file);
  const ink = inkBox(tl.file, p.w, p.h);
  const sc = ROW.ink / ink.h;
  tl.mark = {
    ...p, ink, sc: +sc.toFixed(6), box: { w: +(p.w * sc).toFixed(3), h: +(p.h * sc).toFixed(3) }, inkW: +(ink.w * sc).toFixed(2), inkH: +(ink.h * sc).toFixed(2),
    /* inside the tile, so the tile's own transform carries it */
    left: +(ROW.w / 2 - (ink.x + ink.w / 2) * sc).toFixed(3), top: +(ROW.h / 2 - (ink.y + ink.h / 2) * sc).toFixed(3),
  };
}

/* ---------- the read ----------
   post31's take(), whole: one take a sentence, cached on the copy and the
   delivery, edge by name and refused from anywhere else, the sentences laid
   end to end with exactly BREAK_MS of silence between one's last sound and
   the next's first. the endpoint refuses ssml breaks, which is why. */
async function take(i) {
  const L = LINES[i];
  const parts = L.text.split(/(?<=[.!?])\s+/);
  const takes = [];
  for (let k = 0; k < parts.length; k++) {
    const name = 'post35-l' + (i + 1) + (parts.length > 1 ? 's' + (k + 1) : '');
    const cached = path.join(VOICE_OUT, name + '-' + VOICE + '.json');
    const want = parts[k].replace(/\s+/g, ' ').trim();
    let got = null;
    if (fs.existsSync(cached)) {
      const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
      if (j.text === want && j.rate === L.rate && j.pitch === L.pitch && j.provider === 'edge' && fs.existsSync(j.file)) got = { ...j, cached: true };
    }
    if (!got) got = { ...(await speak(parts[k], { voice: VOICE, provider: 'edge', name, rate: L.rate, pitch: L.pitch })), cached: false };
    if (got.provider !== 'edge') throw new Error('take ' + (i + 1) + ' was read by ' + got.provider + ', and this clip is edge');
    if (got.timing !== 'engine') throw new Error('take ' + (i + 1) + ' came back with estimated timings, and the picture is cut to the read');
    takes.push(got);
  }
  const pcms = takes.map(t => decode(ffmpeg, t.file));
  const edges = pcms.map(audioEdges);
  let total = 0;
  const off = [];
  for (let k = 0; k < takes.length; k++) {
    off.push(k === 0 ? 0 : +(off[k - 1] + edges[k - 1].end + BREAK_MS / 1000 - edges[k].start).toFixed(4));
    total = Math.max(total, off[k] + pcms[k].length / SR);
  }
  const pcm = new Float32Array(Math.ceil(total * SR));
  for (let k = 0; k < takes.length; k++) {
    const at = Math.round(off[k] * SR);
    const a = Math.max(0, Math.round((edges[k].start - PRE) * SR)), b = Math.min(pcms[k].length, Math.round((edges[k].end + POST) * SR));
    for (let j = a; j < b; j++) { const q = at + j; if (q >= 0 && q < pcm.length) pcm[q] += pcms[k][j]; }
  }
  const words = [];
  for (let k = 0; k < takes.length; k++) for (const w of takes[k].words) words.push({ word: w.word, start: +(w.start + off[k]).toFixed(4), end: +(w.end + off[k]).toFixed(4) });
  return {
    i, text: L.text, rate: L.rate, pitch: L.pitch, provider: 'edge', voiceId: takes[0].voiceId, timing: 'engine',
    words, pcm, sentences: takes.length, cached: takes.every(t => t.cached), breaks: takes.length > 1 ? BREAK_MS : 0,
    gaps: takes.slice(1).map((t, k) => +(off[k + 1] + edges[k + 1].start - off[k] - edges[k].end).toFixed(4)),
  };
}
function audioEdges(pcm) {
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  const gate = peak * Math.pow(10, SILENCE_DB / 20);
  const H = Math.round(0.005 * SR), n = Math.floor(pcm.length / H);
  const loud = k => { let m = 0; for (let j = k * H; j < Math.min((k + 1) * H, pcm.length); j++) m = Math.max(m, Math.abs(pcm[j])); return m > gate; };
  let a = 0, b = n - 1;
  while (a < n && !loud(a)) a++;
  while (b > a && !loud(b)) b--;
  return { start: +(a * 0.005).toFixed(4), end: +((b + 1) * 0.005).toFixed(4) };
}

/* ---------- where he is ----------
   home is the middle of the frame across, HEAD_Y down. one: the house size
   under the news card. two to four: small under the row, a move between the
   two that shrinks him on the way, and one nod in three. five: the spring
   from under the row to home, growing to the house size, and he stays. */
const R_FULL = HEAD.plate.s / 2 * (SIZE / GRID);
const HOME = { x: VW / 2, y: HEAD_Y };
const R_SMALL = R_FULL * SMALL.s;
const UNDER = { x: VW / 2, y: S1_Y };
const BELOW = { x: VW / 2, y: BELOW_Y };
/* the look up: in at the start, out over the move */
function lookAt(t) {
  return LOOK.up * EASE(span(t, LOOK.at, LOOK.at + LOOK.for)) * (1 - EASE(span(t, MOVE.at, MOVE.at + LOOK.outFor)));
}
function nodAt(t) {
  const a = NOD.at;
  if (t < a) return 0;
  if (t < a + NOD.upFor) return -NOD.up * EASE(span(t, a, a + NOD.upFor));
  const b = a + NOD.upFor;
  if (t < b + NOD.downFor) return lerp(-NOD.up, NOD.dip, POP(span(t, b, b + NOD.downFor)));
  const c = b + NOD.downFor;
  return NOD.dip * (1 - EASE(span(t, c, c + NOD.backFor)));
}
function placeAt(t) {
  const c1 = { dx: UNDER.x - HOME.x, dy: UNDER.y - HOME.y };
  const c2 = { dx: BELOW.x - HOME.x, dy: BELOW.y - HOME.y };
  if (t < MOVE.at) return { ...c1, s: 1, rot: 0, on: 1, o: 1 };
  if (t < MOVE.at + MOVE.for) {
    const p = EASE(span(t, MOVE.at, MOVE.at + MOVE.for));
    return { dx: +lerp(c1.dx, c2.dx, p).toFixed(3), dy: +lerp(c1.dy, c2.dy, p).toFixed(3), s: +lerp(1, SMALL.s, p).toFixed(5), rot: 0, on: 1, o: 1 };
  }
  if (t < IN.at) return { dx: c2.dx, dy: +(c2.dy + nodAt(t)).toFixed(3), s: SMALL.s, rot: 0, on: 1, o: 1 };
  if (t < IN.at + SPRING.for) {
    const p = RISE(span(t, IN.at, IN.at + SPRING.for));
    return { dx: +lerp(c2.dx, 0, p).toFixed(3), dy: +lerp(c2.dy, 0, p).toFixed(3), s: +lerp(SMALL.s, 1, p).toFixed(5), rot: 0, on: 1, o: 1 };
  }
  return { dx: 0, dy: 0, s: 1, rot: 0, on: 1, o: 1 };
}
const isHome = t => t >= IN.at + SPRING.for;
function compose(plan, t) {
  const f = mascotFrame(plan, t);
  const P = placeAt(t);
  f.card = {
    ...f.card,
    x: +(f.card.x + P.dx).toFixed(4),
    y: +(f.card.y + P.dy).toFixed(4),
    rot: +(f.card.rot + P.rot).toFixed(4),
    sx: +(f.card.sx * P.s).toFixed(5),
    sy: +(f.card.sy * P.s).toFixed(5),
  };
  const look = lookAt(t);
  if (look) f.eyes = f.eyes.map(e => ({ ...e, y: +(e.y + look).toFixed(4) }));
  f.shadow = { ...f.shadow, o: 0 };
  return f;
}
/* how far the eye ink is outside the head silhouette on a composed frame, the
   module's own measure, in grid units; negative is inside */
function eyeInk(plan, fr) {
  let outside = -Infinity;
  for (let k = 0; k < 2; k++) {
    const e = fr.eyes[k], cx = EYE_CX[k], cy = HEAD.eye.cy;
    const hw = HEAD.eye.w / 2 * Math.abs(e.sx), hh = HEAD.eye.h / 2 * Math.abs(e.sy);
    for (const sx2 of [-1, 1]) for (const sy2 of [-1, 1]) outside = Math.max(outside, headSD(cx + e.x + sx2 * hw, cy + e.y + sy2 * hh, plan));
  }
  return outside;
}
/* the typing: how many characters of each line are up, which line the
   cursor sits on, and whether it is lit */
function typedAt(t) {
  const n = NEWS.lines.map((l, i) => {
    const T = NEWS.typed[i];
    return Math.max(0, Math.min(l.length, Math.floor((t - T.from) * NEWS.type.cps + 1e-6)));
  });
  let line = 0;
  for (let i = 0; i < NEWS.lines.length; i++) if (t >= NEWS.typed[i].from) line = i;
  const typing = NEWS.typed.some(T => t >= T.from && t < T.to);
  /* solid while typing, a square wave once it stops, lit from the moment it stops */
  const cur = typing ? 1 : (((t - NEWS.done) % NEWS.cursor.period + NEWS.cursor.period) % NEWS.cursor.period < NEWS.cursor.period / 2 ? 1 : 0);
  return { n, line, cur };
}

/* ---------- the speed line ----------
   the mix from fast to calm is EASE over SLOW.for from SLOW.at. the phase is
   the integral of the speed, summed at a millisecond so the dashes never
   jump when the speed changes. */
const speedMix = t => INOUT(span(t, SLOW.at, SLOW.at + SLOW.for));
const speedV = t => lerp(SPEED.fast.v, SPEED.calm.v, speedMix(t));
function speedPhase(t) {
  if (t <= SPEED.at) return 0;
  const dt = 0.001;
  let s = 0;
  /* closed form while the speed is constant, summed only across the change */
  const a = Math.min(t, SLOW.at);
  if (a > SPEED.at) s += SPEED.fast.v * (a - SPEED.at);
  if (t > SLOW.at) {
    const b = Math.min(t, SLOW.at + SLOW.for);
    for (let u = SLOW.at; u < b; u += dt) s += speedV(Math.min(u + dt / 2, b)) * Math.min(dt, b - u);
    if (t > b) s += SPEED.calm.v * (t - b);
  }
  return s;
}
function dashesAt(t) {
  const m = speedMix(t);
  const period = lerp(SPEED.fast.period, SPEED.calm.period, m);
  const len = lerp(SPEED.fast.len, SPEED.calm.len, m);
  const base = ((speedPhase(t) % period) + period) % period;
  const out = [];
  for (let i = 0; i < SPEED.n; i++) {
    const x = SPEED.w / 2 + base + (i - SPEED.n / 2) * period;
    const on = x + len > 0 && x < SPEED.w ? 1 : 0;
    out.push({ x: +x.toFixed(3), on });
  }
  return { len: +len.toFixed(3), period: +period.toFixed(3), dashes: out };
}

/* ---------- the subtitles, on the clock ---------- */
const CARDS = [];
function subAt(t) {
  for (let i = 0; i < CARDS.length; i++) {
    const c = CARDS[i];
    if (t < c.from || t >= c.to) continue;
    const o = Math.min(1, span(t, c.from, c.from + ST.fadeIn), 1 - span(t, c.to - ST.fadeOut, c.to));
    return { o: +o.toFixed(4), y: +(ST.rise * (1 - EASE(span(t, c.from, c.from + ST.fadeIn)))).toFixed(3), i };
  }
  return { o: 0, y: 0, i: -1 };
}

/* ---------- what one frame is ---------- */
function frameAt(t, f) {
  const P = placeAt(t);
  /* one: the news card, up from the first frame, typed into, then up and out */
  const out1 = span(t, NEWS.out.at, NEWS.out.at + NEWS.out.for);
  const news = { o: +(1 - out1).toFixed(4), y: +(NEWS.out.up * EASE(out1)).toFixed(3), ...typedAt(t) };
  /* two and three: the row, the check, the line, the speed line */
  const ro = 1 - span(t, ROW_OUT.at, ROW_OUT.at + ROW_OUT.for);
  const rs = lerp(1, 0.96, EASE(span(t, ROW_OUT.at, ROW_OUT.at + ROW_OUT.for)));
  const tiles = TILES.map(tl => ({
    o: +(span(t, tl.at, tl.at + 0.10) * ro).toFixed(4),
    sc: +(lerp(ROW.popFrom, 1, POP(span(t, tl.at, tl.at + ROW.popFor))) * rs).toFixed(4),
  }));
  const conn = {
    o: +ro.toFixed(4),
    p: +EASE(span(t, CONN.at, CONN.at + CONN.for)).toFixed(4),
    stub: +EASE(span(t, CONN.at + CONN.for, CONN.at + CONN.for + CONN.stubFor)).toFixed(4),
  };
  const chk = {
    o: +(span(t, CHK.at, CHK.at + 0.10) * ro).toFixed(4),
    sc: +(lerp(CHK.popFrom, 1, POP(span(t, CHK.at, CHK.at + CHK.popFor))) * rs).toFixed(4),
    p: +EASE(span(t, CHK.at + CHK.drawAfter, CHK.at + CHK.drawAfter + CHK.drawFor)).toFixed(4),
  };
  const speed = { o: +(span(t, SPEED.at, SPEED.at + 0.25) * ro).toFixed(4), sc: +(lerp(0.97, 1, EASE(span(t, SPEED.at, SPEED.at + 0.40))) * rs).toFixed(4), ...dashesAt(t) };
  /* four: the pill card, the pills and the loop */
  const po = 1 - span(t, PILL_OUT.at, PILL_OUT.at + PILL_OUT.for);
  const ps = lerp(1, 0.96, EASE(span(t, PILL_OUT.at, PILL_OUT.at + PILL_OUT.for)));
  const pcard = { o: +(span(t, PCARD.at, PCARD.at + 0.15) * po).toFixed(4), sc: +(lerp(PCARD.popFrom, 1, POP(span(t, PCARD.at, PCARD.at + PCARD.for))) * ps).toFixed(4) };
  const pills = PILL.items.map(pl => ({
    o: +(span(t, pl.at, pl.at + 0.10) * po).toFixed(4),
    sc: +(lerp(PILL.popFrom, 1, POP(span(t, pl.at, pl.at + PILL.popFor))) * ps).toFixed(4),
    lit: +EASE(span(t, pl.lit, pl.lit + PILL.litFor)).toFixed(4),
  }));
  const loop = {
    o: +po.toFixed(4),
    p: +EASE(span(t, LOOP.at, LOOP.at + LOOP.for)).toFixed(4),
    head: +EASE(span(t, LOOP.at + LOOP.for - 0.05, LOOP.at + LOOP.for - 0.05 + LOOP.headFor)).toFixed(4),
  };
  /* five: the wordmark and the address */
  const wmP = span(t, WM1.at, WM1.at + WM1.for);
  const adP = span(t, ADDR_IN.at, ADDR_IN.at + ADDR_IN.for);
  return {
    t: +t.toFixed(4), f,
    mo: +(P.on * P.o).toFixed(4),
    news, tiles, conn, chk, speed, pcard, pills, loop,
    subt: subAt(t),
    wm: { o: t >= WM1.at ? 1 : 0, sc: +(1 + (1 - EASE(wmP)) * 0.085).toFixed(4), glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4) },
    addr: { o: +EASE(adP).toFixed(4), y: +(8 * (1 - EASE(adP))).toFixed(3) },
  };
}

/* ---------- the page ---------- */
function sceneHtml(plan) {
  const brand = brandTokens();
  const mcss = mascotCss(plan);
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post35</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Nunito:wght@400;600&display=swap">
<style>
:root{
${brand.light}
}
html[data-theme=dark]{
${brand.dark}
}
/* ==== this clip's own css starts here ==== */
:root{
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  --display:"Michroma",var(--mono);
  --cap:"Nunito",var(--mono);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--cap)}
.vignette{position:fixed;inset:-10%;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 78% 62% at 50% 46%,rgba(255,255,255,.030) 0%,rgba(255,255,255,.010) 46%,rgba(0,0,0,0) 72%);
  will-change:transform,opacity;animation:breathe 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes breathe{from{transform:scale(1) translate3d(0,0,0);opacity:.85}to{transform:scale(1.05) translate3d(0,-1.1%,0);opacity:1}}
.stage{position:relative;width:${VW}px;height:${VH}px;z-index:1;background:var(--bg)}

${mcss}
/* over the cards and the row: the module puts him at z 4, they are z 3 */
#m-zone{opacity:var(--m-o,1);z-index:5}

/* ---- the cards: one house style, three uses ---- */
.hc{position:absolute;background:var(--field);border:1px solid var(--line);transform-origin:50% 50%;will-change:transform,opacity}
/* ---- one: the news card ---- */
.news{left:${NEWS.left}px;top:${NEWS.top}px;width:${NEWS.w}px;height:${NEWS.h}px;z-index:3;border-radius:${NEWS.radius}px;padding:${NEWS.pad}px ${NEWS.padX}px}
.news .lab{display:block;font-family:var(--mono);font-weight:500;font-size:${NEWS.labelSize}px;letter-spacing:.08em;line-height:1;color:var(--muted);white-space:nowrap}
.news .hl{display:block;margin-top:${NEWS.gap}px;font-family:var(--display);font-size:${NEWS.lineSize}px;line-height:${NEWS.lh};letter-spacing:.04em;color:var(--fg);white-space:pre}
.news .ln{display:block;height:${NEWS.lineSize * NEWS.lh}px}
.news .cur{display:inline-block;width:${NEWS.cursor.w}px;height:${NEWS.lineSize}px;margin-left:2px;vertical-align:-3px;background:var(--fg);opacity:0}

/* ---- two and three: the row, the check, the line, the speed line ---- */
.tile{position:absolute;width:${ROW.w}px;height:${ROW.h}px;border-radius:${ROW.radius}px;z-index:3;
  background:var(--field);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;
  font-family:var(--display);font-size:${ROW.font}px;letter-spacing:.04em;color:var(--fg);opacity:0;transform-origin:50% 50%;will-change:transform,opacity;white-space:nowrap;overflow:hidden}
${TILES.filter(tl => tl.mark).map(tl => `.mk-${tl.key}{position:absolute;left:${tl.mark.left - 1}px;top:${tl.mark.top - 1}px;width:${tl.mark.box.w}px;height:${tl.mark.box.h}px;background:url(/mark-${tl.key}.png) no-repeat;background-size:100% 100%}`).join('\n')}
.chk{position:absolute;left:${CHK.left}px;top:${CHK.top}px;width:${CHK.size}px;height:${CHK.size}px;border-radius:50%;z-index:3;
  background:var(--field);border:1px solid var(--line);opacity:0;transform-origin:50% 50%;will-change:transform,opacity}
.chk svg{position:absolute;left:-1px;top:-1px;width:${CHK.size}px;height:${CHK.size}px;display:block}
.chk path{fill:none;stroke:var(--accent);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:${CHK.len} ${CHK.len};stroke-dashoffset:${CHK.len}}
.conn{position:absolute;left:0;top:0;width:${VW}px;height:${VH}px;z-index:2;pointer-events:none;opacity:0}
.conn line{stroke:var(--line);stroke-width:1.5;stroke-linecap:round}
.scard{left:${SCARD.left}px;top:${SCARD.top}px;width:${SCARD.w}px;height:${SCARD.h}px;z-index:3;border-radius:${SCARD.radius}px;opacity:0}
.speed{position:absolute;left:${SPEED.x - 1}px;top:${SPEED.y - 1}px;width:${SPEED.w}px;height:${SPEED.h}px;overflow:hidden;
  -webkit-mask-image:linear-gradient(90deg,rgba(0,0,0,0) 0,#000 ${SPEED.fade}px,#000 calc(100% - ${SPEED.fade}px),rgba(0,0,0,0) 100%);
  mask-image:linear-gradient(90deg,rgba(0,0,0,0) 0,#000 ${SPEED.fade}px,#000 calc(100% - ${SPEED.fade}px),rgba(0,0,0,0) 100%)}
.dash{position:absolute;left:0;top:0;height:${SPEED.h}px;border-radius:${SPEED.h}px;background:var(--fg);opacity:0;will-change:transform,width}

/* ---- four: the pill card, the pills and the loop ---- */
.pcard{left:${PCARD.left}px;top:${PCARD.top}px;width:${PCARD.w}px;height:${PCARD.h}px;z-index:3;border-radius:${PCARD.radius}px;opacity:0}
.pill{position:absolute;top:${PILL.top}px;width:${PILL.w}px;height:${PILL.h}px;border-radius:999px;z-index:3;
  background:var(--pill-on);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;
  font-family:var(--mono);font-weight:500;font-size:${PILL.font}px;letter-spacing:.06em;color:var(--muted);opacity:0;transform-origin:50% 50%;will-change:transform,opacity;white-space:nowrap}
.pill i{position:absolute;inset:-1px;border-radius:999px;background:var(--accent-soft);border:1px solid var(--accent);opacity:0}
.pill b{position:relative;font-weight:500;color:var(--muted)}
.pill b.on{color:var(--accent)}
.loop{position:absolute;left:0;top:0;width:${VW}px;height:${VH}px;z-index:4;pointer-events:none;opacity:0}
.loop path{fill:none;stroke:var(--muted);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
#lp{stroke-dasharray:1 1;stroke-dashoffset:1}

/* ---- the subtitles: one block, one slot ---- */
.subt{position:absolute;left:${SAFE_CSS.left}px;right:${SAFE_CSS.right}px;top:${ST.top}px;text-align:center;z-index:9;
  font-family:var(--cap);font-weight:${ST.weight};font-size:${ST.size}px;line-height:${ST.lh};color:var(--face);white-space:pre;opacity:0;will-change:transform,opacity}
.subt .sl{display:block}

/* ---- five: the wordmark, post23's, and the address ---- */
.wm{position:absolute;left:50%;top:${WM.top}px;transform:translateX(-50%) scale(var(--wm-s,1));transform-origin:50% 50%;
  font-family:var(--display);font-weight:400;color:var(--fg);text-align:center;text-transform:uppercase;letter-spacing:.18em;
  line-height:${WM.lh};white-space:nowrap;text-indent:.09em;opacity:var(--wm-o,0);
  text-shadow:0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),0 0 66px rgba(255,255,255,.10);
  filter:brightness(var(--wm-glow,1));z-index:8}
.wm span{display:block}
.addr{position:absolute;left:${SAFE_CSS.left}px;right:${SAFE_CSS.right}px;top:${ADDR.top}px;text-align:center;
  font-family:var(--mono);font-weight:500;font-size:${ADDR.size}px;letter-spacing:.08em;line-height:1.3;color:var(--muted);white-space:nowrap;opacity:0;z-index:8}
</style>
</head>
<body>
<div class="vignette" aria-hidden="true"></div>
<div class="stage" id="stage">
${mascotMarkup(plan)}
  <div class="hc news" id="news"><span class="lab">${NEWS.label}</span><span class="hl">${NEWS.lines.map((_, i) => '<span class="ln"><span id="hl' + i + '"></span><i class="cur" id="cur' + i + '"></i></span>').join('')}</span></div>
  <svg class="conn" id="conn" aria-hidden="true">
    <line id="bus" x1="${TILES[0].cx}" y1="${CONN.y}" x2="${TILES[2].cx}" y2="${CONN.y}" stroke-dasharray="${CONN.len} ${CONN.len}" stroke-dashoffset="${CONN.len}"/>
    ${TILES.map((tl, i) => '<line id="stub' + i + '" x1="' + tl.cx + '" y1="' + ROW.bottom + '" x2="' + tl.cx + '" y2="' + CONN.y + '" stroke-dasharray="' + CONN.stub + ' ' + CONN.stub + '" stroke-dashoffset="' + CONN.stub + '"/>').join('\n    ')}
  </svg>
  ${TILES.map((tl, i) => '<div class="tile" id="tile' + i + '" style="left:' + tl.x + 'px;top:' + tl.y + 'px">' + (tl.mark ? '<span class="mk-' + tl.key + '" aria-hidden="true"></span>' : tl.text) + '</div>').join('\n  ')}
  <div class="chk" id="chk"><svg viewBox="0 0 ${CHK.size} ${CHK.size}" aria-hidden="true"><path id="chkp" d="${CHK.d}"/></svg></div>
  <div class="hc scard" id="scard"><div class="speed" id="speed">${Array.from({ length: SPEED.n }, (_, i) => '<i class="dash" id="d' + i + '"></i>').join('')}</div></div>
  <div class="hc pcard" id="pcard"></div>
  ${PILL.items.map((pl, i) => '<div class="pill" id="pill' + i + '" style="left:' + pl.x + 'px"><i id="pl' + i + '"></i><b id="pb' + i + '">' + pl.name + '</b></div>').join('\n  ')}
  <svg class="loop" id="loop" aria-hidden="true"><path id="lp" d="${LOOP.d}"/><path id="lh" d="${LOOP.headD}" opacity="0"/></svg>
  <div class="wm" id="wm">${WM.lines.map(l => '<span>' + l + '</span>').join('')}</div>
  <div class="addr" id="addr">${ADDR.text}</div>
  <div class="subt" id="subt"><span class="sl" id="sl0"></span><span class="sl" id="sl1"></span></div>
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
window.__P35 = ${JSON.stringify({ VW, VH, DSF, WM, NEWS: { lines: NEWS.lines }, TILES: TILES.length, PILLS: PILL.items.length, DASHES: SPEED.n, CHK: { len: CHK.len }, CONN: { len: CONN.len, stub: CONN.stub }, SUBS: SUBTITLES.map(c => c.lines) })};
${mascotRuntime()}
(${scenePage.toString()})();
Promise.all([document.fonts.load('400 40px Michroma'), document.fonts.load('400 ${ROW.font}px Michroma'), document.fonts.load('400 ${NEWS.lineSize}px Michroma'), document.fonts.load('${ST.weight} ${ST.size}px Nunito')])
  .then(function () { return document.fonts.ready; })
  .then(function () { window.__built = Object.assign({}, window.__p35.fit(), { mas: window.__mas.build() }); });
</script>
</body>
</html>`;
}

/* ---------- the page's own script ----------
   writes numbers to elements and decides nothing. */
function scenePage() {
  const P = window.__P35;
  const stage = document.getElementById('stage');
  const news = document.getElementById('news');
  const hls = [], curs = [];
  for (let i = 0; i < P.NEWS.lines.length; i++) { hls.push(document.getElementById('hl' + i)); curs.push(document.getElementById('cur' + i)); }
  const scard = document.getElementById('scard');
  const pcard = document.getElementById('pcard');
  const tiles = []; for (let i = 0; i < P.TILES; i++) tiles.push(document.getElementById('tile' + i));
  const conn = document.getElementById('conn');
  const bus = document.getElementById('bus');
  const stubs = []; for (let i = 0; i < P.TILES; i++) stubs.push(document.getElementById('stub' + i));
  const chk = document.getElementById('chk');
  const chkp = document.getElementById('chkp');
  const speed = document.getElementById('speed');
  const dashes = []; for (let i = 0; i < P.DASHES; i++) dashes.push(document.getElementById('d' + i));
  const pills = [], pls = [], pbs = [];
  for (let i = 0; i < P.PILLS; i++) { pills.push(document.getElementById('pill' + i)); pls.push(document.getElementById('pl' + i)); pbs.push(document.getElementById('pb' + i)); }
  const loop = document.getElementById('loop');
  const lp = document.getElementById('lp');
  const lh = document.getElementById('lh');
  const wm = document.getElementById('wm');
  const addr = document.getElementById('addr');
  const subt = document.getElementById('subt');
  const sls = [document.getElementById('sl0'), document.getElementById('sl1')];
  let lastSub = null, lastTyped = null;
  let loopLen = 0;
  const capOf = el => {
    const cs = getComputedStyle(el);
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    return { cap: cv.measureText('H').actualBoundingBoxAscent || 0, font: cv.font };
  };
  const box = (r, d) => ({ left: +(r.left * d).toFixed(1), top: +(r.top * d).toFixed(1),
    right: +((P.VW - r.right) * d).toFixed(1), bottom: +((P.VH - r.bottom) * d).toFixed(1),
    w: +((r.right - r.left) * d).toFixed(1), h: +((r.bottom - r.top) * d).toFixed(1) });
  const rg = el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
  window.__p35 = {
    fit() {
      const probe = wm;
      probe.style.fontSize = '100px';
      let widest = 0;
      for (const sp of probe.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      const ws = 100 * P.WM.w / widest;
      wm.style.fontSize = ws.toFixed(2) + 'px';
      /* the loop's length, measured once the path is in the document */
      loopLen = lp.getTotalLength();
      lp.setAttribute('stroke-dasharray', loopLen.toFixed(3) + ' ' + loopLen.toFixed(3));
      lp.style.strokeDashoffset = loopLen.toFixed(3);
      return { wm: +ws.toFixed(2), loopLen: +loopLen.toFixed(2) };
    },
    measure() {
      const d = P.DSF;
      const c = capOf(wm);
      let widest = 0;
      for (const sp of wm.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      /* the tiles and the pills are measured whole, before any transform */
      return {
        wm: { ...box(wm.getBoundingClientRect(), d), widestPx: +(widest * d).toFixed(1), capPx: +(c.cap * d).toFixed(1), font: c.font },
        addr: { ...box(rg(addr), d), font: capOf(addr).font },
        news: box(news.getBoundingClientRect(), d),
        newsLab: { ...box(rg(news.querySelector('.lab')), d), font: capOf(news.querySelector('.lab')).font },
        /* every headline line whole, with its cursor after it */
        newsLines: P.NEWS.lines.map((l, i) => { hls[i].textContent = l; curs[i].style.opacity = '1'; const b = box(rg(hls[i].parentNode), d); hls[i].textContent = ''; curs[i].style.opacity = '0'; return { ...b, font: capOf(hls[i].parentNode).font }; }),
        scard: box(scard.getBoundingClientRect(), d),
        pcard: box(pcard.getBoundingClientRect(), d),
        tiles: tiles.map(el => { const mk = el.querySelector('span'); return { ...box(el.getBoundingClientRect(), d), textPx: mk ? 0 : +(rg(el).width * d).toFixed(1), mark: mk ? box(mk.getBoundingClientRect(), d) : null, font: capOf(el).font }; }),
        chk: box(chk.getBoundingClientRect(), d),
        speed: box(speed.getBoundingClientRect(), d),
        pills: pills.map((el, i) => ({ ...box(el.getBoundingClientRect(), d), textPx: +(rg(pbs[i]).width * d).toFixed(1), font: capOf(pbs[i]).font })),
        loop: box(lp.getBoundingClientRect(), d),
        subs: P.SUBS.map(lines => {
          for (let k = 0; k < 2; k++) sls[k].textContent = lines[k] || '';
          sls[1].style.display = lines[1] ? 'block' : 'none';
          let widest = 0;
          for (let k = 0; k < lines.length; k++) widest = Math.max(widest, rg(sls[k]).width);
          const b = subt.getBoundingClientRect();
          return { widestPx: +(widest * d).toFixed(1), h: +(b.height * d).toFixed(1), font: capOf(subt).font };
        }),
      };
    },
    apply(o) {
      const s = stage.style;
      s.setProperty('--m-o', o.mo.toFixed(4));
      news.style.opacity = o.news.o.toFixed(4);
      news.style.transform = 'translateY(' + o.news.y.toFixed(3) + 'px)';
      news.style.visibility = o.news.o < 0.004 ? 'hidden' : 'visible';
      const typed = o.news.n.join(',');
      if (typed !== lastTyped) { lastTyped = typed; for (let i = 0; i < hls.length; i++) hls[i].textContent = P.NEWS.lines[i].slice(0, o.news.n[i]); }
      for (let i = 0; i < curs.length; i++) curs[i].style.opacity = i === o.news.line ? String(o.news.cur) : '0';
      for (let i = 0; i < tiles.length; i++) {
        tiles[i].style.opacity = o.tiles[i].o.toFixed(4);
        tiles[i].style.transform = 'scale(' + o.tiles[i].sc.toFixed(4) + ')';
        tiles[i].style.visibility = o.tiles[i].o < 0.004 ? 'hidden' : 'visible';
        stubs[i].style.strokeDashoffset = (P.CONN.stub * (1 - o.conn.stub)).toFixed(3);
      }
      conn.style.opacity = (o.conn.o * (o.conn.p > 0 ? 1 : 0)).toFixed(4);
      bus.style.strokeDashoffset = (P.CONN.len * (1 - o.conn.p)).toFixed(3);
      chk.style.opacity = o.chk.o.toFixed(4);
      chk.style.transform = 'scale(' + o.chk.sc.toFixed(4) + ')';
      chkp.style.strokeDashoffset = (P.CHK.len * (1 - o.chk.p)).toFixed(3);
      scard.style.opacity = o.speed.o.toFixed(4);
      scard.style.transform = 'scale(' + o.speed.sc.toFixed(4) + ')';
      scard.style.visibility = o.speed.o < 0.004 ? 'hidden' : 'visible';
      pcard.style.opacity = o.pcard.o.toFixed(4);
      pcard.style.transform = 'scale(' + o.pcard.sc.toFixed(4) + ')';
      pcard.style.visibility = o.pcard.o < 0.004 ? 'hidden' : 'visible';
      for (let i = 0; i < dashes.length; i++) {
        const dsh = o.speed.dashes[i];
        dashes[i].style.opacity = dsh.on ? '1' : '0';
        dashes[i].style.width = o.speed.len.toFixed(3) + 'px';
        dashes[i].style.transform = 'translateX(' + dsh.x.toFixed(3) + 'px)';
      }
      for (let i = 0; i < pills.length; i++) {
        pills[i].style.opacity = o.pills[i].o.toFixed(4);
        pills[i].style.transform = 'scale(' + o.pills[i].sc.toFixed(4) + ')';
        pills[i].style.visibility = o.pills[i].o < 0.004 ? 'hidden' : 'visible';
        pls[i].style.opacity = o.pills[i].lit.toFixed(4);
        pbs[i].className = o.pills[i].lit > 0.5 ? 'on' : '';
      }
      loop.style.opacity = (o.loop.o * (o.loop.p > 0 ? 1 : 0)).toFixed(4);
      lp.style.strokeDashoffset = (loopLen * (1 - o.loop.p)).toFixed(3);
      lh.style.opacity = o.loop.head.toFixed(4);
      s.setProperty('--wm-o', o.wm.o.toFixed(4));
      s.setProperty('--wm-s', o.wm.sc.toFixed(4));
      s.setProperty('--wm-glow', o.wm.glow.toFixed(4));
      addr.style.opacity = o.addr.o.toFixed(4);
      addr.style.transform = 'translateY(' + o.addr.y.toFixed(3) + 'px)';
      if (o.subt.i !== lastSub) {
        lastSub = o.subt.i;
        const lines = o.subt.i < 0 ? [] : P.SUBS[o.subt.i];
        for (let k = 0; k < 2; k++) sls[k].textContent = lines[k] || '';
        sls[1].style.display = lines[1] ? 'block' : 'none';
      }
      subt.style.opacity = o.subt.o.toFixed(4);
      subt.style.transform = 'translateY(' + o.subt.y.toFixed(3) + 'px)';
    },
  };
}

function serve(html) {
  const marks = {};
  for (const tl of TILES) if (tl.mark) marks['/mark-' + tl.key + '.png'] = fs.readFileSync(tl.file);
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/' || p === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }
    if (marks[p]) {
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' });
      return res.end(marks[p]);
    }
    res.writeHead(404); res.end('not here');
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ srv, port: srv.address().port })));
}
function injected() {
  let seed = 0x51d0c3a7;
  Math.random = function () { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; seed |= 0; return (seed >>> 0) / 4294967296; };
  const rafQ = [];
  let rafId = 1;
  window.requestAnimationFrame = function (cb) { rafQ.push({ id: rafId, cb: cb }); return rafId++; };
  window.cancelAnimationFrame = function (id) { const k = rafQ.findIndex(function (e) { return e.id === id; }); if (k > -1) rafQ.splice(k, 1); };
  window.__dmRaf = function (now) { const batch = rafQ.splice(0, rafQ.length); for (const e of batch) { try { e.cb(now); } catch (err) { } } return rafQ.length; };
}

/* ---------- render ---------- */
async function render(plan) {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  for (const d of [FRAMES, SUBS]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  fs.mkdirSync(OUT, { recursive: true });
  const N = Math.round(FPS * SECONDS);
  const { srv, port } = await serve(sceneHtml(plan));
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none', '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio',
      '--run-all-compositor-stages-before-draw'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });
  await page.evaluateOnNewDocument(injected);
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }, { name: 'prefers-color-scheme', value: 'dark' }] });
  let expired = null;
  cdp.on('Emulation.virtualTimeBudgetExpired', () => { const f = expired; expired = null; if (f) f(); });
  const advance = async ms => {
    const p = new Promise(r => { expired = r; });
    await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pauseIfNetworkFetchesPending', budget: ms });
    await p;
  };
  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' });
  for (let i = 0; i < 400; i++) {
    const ok = await page.evaluate(() => !!(window.__built && window.__mas && window.__mas.ready && document.fonts.status === 'loaded')).catch(() => false);
    if (ok) break;
    await advance(STEP);
  }
  if (errors.length) throw new Error('the page threw: ' + errors.join(' | '));
  if (!await page.evaluate(() => !!window.__built)) throw new Error('the scene never became ready');
  for (const [f, what] of [['400 40px "Michroma"', 'the wordmark'], ['600 ' + ST.size + 'px "Nunito"', 'the subtitles']]) {
    if (!await page.evaluate(q => document.fonts.check(q), f)) throw new Error(f + ' did not load, and ' + what + ' would be judged in the fallback');
  }
  const built = await page.evaluate(() => window.__built);
  const measured = await page.evaluate(() => window.__p35.measure());
  console.log('  built: head ' + built.mas.headPx + 'px, ' + built.mas.eyes + ' eyes, ' + built.mas.glows + ' glow layers, theme ' + built.mas.theme + ', the loop ' + built.loopLen + ' css px long');
  console.log('  the wordmark: ' + measured.wm.widestPx + ' device px wide, caps ' + measured.wm.capPx + ', clear ' + measured.wm.left + ' / ' + measured.wm.top + ' / ' + measured.wm.right + ' / ' + measured.wm.bottom);
  console.log('  the news card: ' + measured.news.w + 'x' + measured.news.h + ' device px, clear ' + measured.news.left + ' / ' + measured.news.top + ' / ' + measured.news.right + ' / ' + measured.news.bottom
    + ', the headline ' + measured.newsLines.map(b => b.w).join(' and ') + ' device px wide');
  console.log('  the speed card: ' + measured.scard.w + 'x' + measured.scard.h + ', the pill card: ' + measured.pcard.w + 'x' + measured.pcard.h + ' device px');
  console.log('  the tiles: ' + measured.tiles.map((b, i) => TILES[i].key + ' ' + (b.mark ? 'mark ' + b.mark.w + 'x' + b.mark.h : 'text ' + b.textPx) + ' of ' + (ROW.w * DSF)).join(', ') + ' device px');
  for (const tl of TILES) if (tl.mark) console.log('  the ' + tl.key + ' mark: ' + tl.mark.w + 'x' + tl.mark.h + ' file, ink ' + tl.mark.inkW + 'x' + tl.mark.inkH + ' css px, pops at ' + tl.at.toFixed(2) + 's');
  console.log('  the pills: ' + measured.pills.map((b, i) => PILL.names[i] + ' ' + b.textPx + ' of ' + (PILL.w * DSF)).join(', ') + ' device px');
  for (const [i, c] of CARDS.entries()) console.log('  subtitle ' + String(i + 1).padStart(2) + ' ' + c.from.toFixed(2) + ' to ' + c.to.toFixed(2) + ': ' + c.lines.join(' / ') + ', widest ' + measured.subs[i].widestPx + ' device px');

  const put = async (t, f) => {
    const mf = compose(plan, t);
    const o = frameAt(t, f);
    await page.evaluate(fr => window.__mas.apply(fr), mf);
    await page.evaluate(fr => window.__p35.apply(fr), o);
    return { mf, o };
  };

  /* the head's worst clearance while he is home */
  let worst = null;
  for (let f = 0; f < Math.round(SECONDS * FPS); f++) {
    const t = f / FPS;
    if (!isHome(t)) continue;
    const r = headRect(plan, compose(plan, t));
    const near = Math.min(r.left, r.top, r.right, r.bottom);
    if (!worst || near < worst.near) worst = { t: +t.toFixed(3), near, ...r };
  }

  const sigs = [];
  const wall = Date.now();
  for (let f = 0; f < N; f++) {
    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const { mf, o } = await put(t, f);
      await page.evaluate(now => window.__dmRaf(now), (idx + 1) * SUBSTEP);
      /* the liveness signature sums its subframes, post28's rule */
      let s = o.mo * 7 + o.news.o * 17 + o.news.y * 19 + o.news.o * (o.news.n[0] * 11 + o.news.n[1] * 13 + o.news.cur * 227 + o.news.line * 229) + o.pcard.o * 233 + o.pcard.sc * 239 + o.speed.sc * 241
        + o.conn.o * (o.conn.p * 23 + o.conn.stub * 29) + o.chk.o * 31 + o.chk.sc * 37 + o.chk.p * 41
        + o.speed.o * (o.speed.len * 43 + o.speed.period * 47) + o.loop.o * (o.loop.p * 53 + o.loop.head * 59)
        + o.subt.o * 251 + o.subt.i * 257 + o.subt.y * 263
        + o.wm.o * 73 + o.wm.sc * 79 + o.wm.glow * 83 + o.addr.o * 97;
      for (let i = 0; i < o.tiles.length; i++) s += o.tiles[i].o * (131 + i) + o.tiles[i].sc * (139 + i);
      for (let i = 0; i < o.pills.length; i++) s += o.pills[i].o * (151 + i) + o.pills[i].sc * (157 + i) + o.pills[i].lit * (163 + i);
      for (let i = 0; i < o.speed.dashes.length; i++) s += o.speed.o * o.speed.dashes[i].on * o.speed.dashes[i].x * (101 + i);
      s += o.mo * (mf.card.x * 167 + mf.card.y * 173 + mf.card.rot * 179 + mf.card.sx * 181 + mf.card.sy * 191);
      for (let e = 0; e < 2; e++) s += o.mo * (mf.eyes[e].x * (193 + e) + mf.eyes[e].y * (197 + e) + mf.eyes[e].lid * (199 + e) + mf.eyes[e].sy * (211 + e));
      if (k === 0) sigs.push(0);
      sigs[f] = +(sigs[f] + s * (k + 1)).toFixed(6);
      const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 94, captureBeyondViewport: false, clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
      const file = SUB > 1 ? path.join(SUBS, 's' + String(idx).padStart(6, '0') + '.jpg') : path.join(FRAMES, 'f' + String(f).padStart(5, '0') + '.jpg');
      fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
      await advance(SUBSTEP);
    }
    if (f % 60 === 0) console.log('  ' + String(f).padStart(4) + '/' + N + '  t=' + (f / FPS).toFixed(2) + 's  ' + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
  }
  if (errors.length) throw new Error('the page threw while rendering: ' + errors.join(' | '));

  fs.rmSync(VERIFY, { recursive: true, force: true });
  fs.mkdirSync(VERIFY, { recursive: true });
  /* fix round one asks for one at the finished headline, and two */
  const stills = [
    [NEWS.done + 0.02, 'a-s1-the-headline-done'],
    [BLINK_AT + 0.08, 'b-s1-the-blink'],
    [TILES[2].at + 0.5, 'c-s2-three-tiles'],
    [CHK.at + 0.6, 'd-s2-the-check'],
    [SLOW.at - 0.3, 'e-s2-the-dashes-racing'],
  ];
  for (const [want, name] of stills) {
    const f = Math.max(0, Math.min(N - 1, Math.round(want * FPS)));
    await put(f / FPS, f);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF } });
    fs.writeFileSync(path.join(VERIFY, name + '.png'), Buffer.from(shot.data, 'base64'));
  }
  console.log('  the head, worst frame at home at ' + worst.t + 's: ' + worst.left + ' left, ' + worst.top + ' top, ' + worst.right + ' right, ' + worst.bottom
    + ' bottom (floor ' + Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom) + ')');
  await browser.close();
  srv.close();
  if (SUB > 1) blend(N);
  const state = { built, measured, head: worst, sigs, frames: N };
  fs.writeFileSync(path.join(OUT, 'post35.json'), JSON.stringify(state, null, 2));
  return state;
}

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }
function blend(N) {
  console.log('  blending ' + N * SUB + ' subframes into ' + N + ' frames ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS * SUB), '-i', path.join(SUBS, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1) + ',setpts=PTS-STARTPTS,framestep=' + SUB, '-q:v', '2', path.join(FRAMES, 'f%05d.jpg')]);
}
function encode(wav) {
  const out = path.join(OUT, 'post35-dark-1080x1920.mp4');
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'), '-i', wav,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
  return out;
}
function probe(file) {
  let out = '';
  try { execFileSync(ffmpeg, ['-hide_banner', '-i', file], { stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { out = (e.stderr || '').toString(); }
  const dur = out.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const res = out.match(/,\s*(\d{2,5})x(\d{2,5})[\s,]/);
  const fps = out.match(/([\d.]+)\s*fps/);
  return { seconds: dur ? (+dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3])) : null, w: res ? +res[1] : null, h: res ? +res[2] : null,
    fps: fps ? parseFloat(fps[1]) : null, audio: /Audio:\s*aac/.test(out) };
}

/* ========================================================================== */
/* go                                                                         */
/* ========================================================================== */

/* ---------- the read, and the clock floored by it ---------- */
const TAKES = [];
for (let i = 0; i < LINES.length; i++) TAKES.push(await take(i));
const PCM = TAKES.map(t => t.pcm);
const EDGE = PCM.map(audioEdges);
const OFF = [];
for (let i = 0; i < LINES.length; i++) {
  OFF.push(+(SC[i] + PRE - EDGE[i].start).toFixed(4));
  const soundEnd = +(EDGE[i].end + OFF[i]).toFixed(4);
  const floor = soundEnd + AFTER_LINE;
  if (i < LINES.length - 1) SC[i + 1] = +Math.max(BRIEF[i + 1], floor).toFixed(4);
  else END = +(soundEnd + AFTER_READ).toFixed(4);
}
SECONDS = +END.toFixed(2);
const WORDS = TAKES.map((t, i) => t.words.map(w => ({ word: w.word, start: +(w.start + OFF[i]).toFixed(4), end: +(w.end + OFF[i]).toFixed(4) })));
const SOUND = TAKES.map((t, i) => ({ start: +(EDGE[i].start + OFF[i]).toFixed(4), end: +(EDGE[i].end + OFF[i]).toFixed(4) }));
const wordAt = (i, w, nth = 1) => { let n = 0; return WORDS[i].find(x => bare(x.word) === w && ++n === nth); };
const need = (i, w, nth = 1) => { const x = wordAt(i, w, nth); if (!x) throw new Error('line ' + (i + 1) + ' has no "' + w + '"' + (nth > 1 ? ' a ' + nth + 'nd time' : '') + ' in it'); return x; };

/* ---------- the clock, hung off the scene starts and the words ---------- */
/* one: the news card slides out as two starts */
NEWS.out.at = SC[1];
/* two: he moves under the row, the tiles on their names, the line after the
   last, the check on `agreed`, happy once he has landed, the speed line on
   `most`, the slowing on `slower` */
MOVE.at = +(SC[1] + 0.05).toFixed(4);
for (const tl of TILES) tl.at = +Math.max(need(1, tl.say).start, SC[1] + 0.15).toFixed(4);
CONN.at = +(TILES[2].at + CONN.after).toFixed(4);
CHK.at = +Math.max(need(1, CHK.say).start, CONN.at + CONN.for).toFixed(4);
HAPPY.at = +(MOVE.at + MOVE.for + 0.10).toFixed(4);
SPEED.at = +need(1, SPEED.say).start.toFixed(4);
SLOW.at = +need(1, SLOW.say).start.toFixed(4);
/* he goes calm as the dashes do */
CALM1.at = SLOW.at;
/* three: the nod on `pacing` */
NOD.at = +need(2, NOD.say).start.toFixed(4);
/* four: the row goes, the pills come, each lights on its word, the loop after the last */
ROW_OUT.at = SC[3];
PCARD.at = +(SC[3] + 0.05).toFixed(4);
for (const [i, pl] of PILL.items.entries()) {
  pl.at = +(SC[3] + 0.15 + i * PILL.stagger).toFixed(4);
  pl.lit = +Math.max(need(3, pl.name, pl.nth).start, pl.at + PILL.popFor).toFixed(4);
}
LOOP.at = +(PILL.items[2].lit + PILL.litFor + LOOP.after).toFixed(4);
/* five: the pills go, he springs home, the wordmark, calm, the address */
PILL_OUT.at = SC[4];
/* the spring waits for the card to be gone, so he never crosses it */
IN.at = +(SC[4] + PILL_OUT.for + 0.05).toFixed(4);
WM1.at = +(IN.at + 0.15).toFixed(4);
CALM.at = +(IN.at + SPRING.for + 0.15).toFixed(4);
ADDR_IN.at = +(WM1.at + 0.35).toFixed(4);

/* ---------- the subtitles, cut to the read ---------- */
for (const [i, c] of SUBTITLES.entries()) {
  const W = WORDS[c.line];
  const [a, b] = c.words;
  if (!(W[a] && W[b] && a <= b)) throw new Error('subtitle ' + (i + 1) + ' names words ' + a + '..' + b + ' and line ' + (c.line + 1) + ' has ' + W.length + ': ' + W.map(w => w.word).join(' '));
  const letters = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (letters(W.slice(a, b + 1).map(w => w.word).join('')) !== letters(c.lines.join(''))) {
    throw new Error('subtitle ' + (i + 1) + ' reads "' + c.lines.join(' / ') + '" and the take says "' + W.slice(a, b + 1).map(w => w.word).join(' ') + '" (the line is: ' + W.map(w => w.word).join(' ') + ')');
  }
  CARDS.push({ ...c, from: +(W[a].start - ST.lead).toFixed(4), to: +(W[b].end + ST.tail).toFixed(4) });
}
for (let i = 0; i + 1 < CARDS.length; i++) if (CARDS[i].to > CARDS[i + 1].from - 0.02) CARDS[i].to = +(CARDS[i + 1].from - 0.02).toFixed(4);

/* ---------- the plan ----------
   he faces the lens throughout; happy once under the row, calm again as the
   dashes calm, calm on the end card. bias 0 because he is centred from two on. */
const MARKS = [
  { t: 0, state: 'neutral' },
  { t: HAPPY.at, state: 'delighted' },
  { t: CALM1.at, state: 'neutral' },
  { t: CALM.at, state: 'neutral' },
];
const makePlan = seed => planMascot({ seconds: SECONDS, size: SIZE, theme: 'dark', bias: 0, seed, marks: MARKS });
const CLEAR = [[IN.at + SPRING.for - 0.20, IN.at + SPRING.for + 0.30], [MOVE.at + MOVE.for - 0.15, MOVE.at + MOVE.for + 0.25], [NOD.at - 0.10, NOD.at + NOD.upFor + NOD.downFor + NOD.backFor]];
/* the blink on the finished headline: a module blink starts in the window
   after the last character, nothing blinks in the quiet before it, and the
   next one is not on its heels */
const BLINK_WIN = [NEWS.done + BLINK.after, NEWS.done + BLINK.after + BLINK.within];
const oneBlink = blinks => {
  const inWin = blinks.filter(x => x.t >= BLINK_WIN[0] && x.t < BLINK_WIN[1]);
  if (inWin.length !== 1 || inWin[0].twice) return null;
  if (blinks.some(x => x.t >= NEWS.done - BLINK.quiet && x.t < BLINK_WIN[0])) return null;
  if (blinks.some(x => x.t >= BLINK_WIN[1] && x.t < BLINK_WIN[1] + 0.6)) return null;
  return inWin[0];
};
let BLINK_AT = 0;
const SEED = (() => {
  for (let s = 1; s <= 6000; s++) {
    const b = makePlan(s).idle.blinks;
    if (b.some(x => CLEAR.some(([a, z]) => x.t >= a && x.t < z))) continue;
    const one = oneBlink(b);
    if (!one) continue;
    BLINK_AT = one.t;
    return s;
  }
  throw new Error('no seed under 6000 blinks once on the finished headline and keeps clear of the landings and the nod');
})();
const plan = makePlan(SEED);
const halfBox = (GRID / 2) * plan.unit;
plan.box.left = +(VW / 2 - halfBox).toFixed(2);
plan.box.top = +(HEAD_Y - halfBox).toFixed(2);
const rep = mascotMotion(plan, FPS, SECONDS);
const rep60 = FPS === 60 ? rep : mascotMotion(plan, 60, SECONDS);
console.log(describeMascot(plan));
console.log(describeMotion(rep));

/* ---------- the voice, on the clip's own clock, and nothing else on the bus ---------- */
const VTRACK = new Float32Array(Math.ceil(SECONDS * SR));
for (let k = 0; k < LINES.length; k++) {
  const pcm = PCM[k], e = EDGE[k];
  const a = Math.max(0, Math.round((e.start - PRE) * SR)), b = Math.min(pcm.length, Math.round((e.end + POST) * SR));
  const at = Math.round(OFF[k] * SR) + a, fade = Math.round(EDGE_FADE * SR);
  for (let i = a; i < b; i++) {
    const j = at + (i - a);
    if (j < 0 || j >= VTRACK.length) continue;
    let g = 1;
    if (i - a < fade) g = (i - a) / fade; else if (b - i < fade) g = (b - i) / fade;
    VTRACK[j] += pcm[i] * g;
  }
}
const MODULE_CUES = mascotCues(plan);
const WAV = path.join(OUT, 'post35-mix.wav');
const RAW = path.join(OUT, 'post35-mix-raw.wav');
fs.mkdirSync(OUT, { recursive: true });
function pass(lift) {
  const buf = VTRACK.slice();
  applyGain(buf, lift);
  const peak = limit(buf, SAMPLE_CEILING);
  writeWav(RAW, buf);
  return { lift: +lift.toFixed(2), buf, peak, lufs: loudness(ffmpeg, RAW).lufs };
}
const zero = pass(0);
const want = zero.lufs == null ? 0 : +(TARGET_LUFS - zero.lufs).toFixed(2);
let best = zero, tries = 1;
if (want > 0.05) {
  let lo = 0, hi = want;
  const top = pass(want); tries++;
  if (top.peak.reduction <= MAX_REDUCTION) best = top;
  else while (hi - lo > 0.20 && tries < 10) { const mid = (lo + hi) / 2, p = pass(mid); tries++; if (p.peak.reduction <= MAX_REDUCTION) { lo = mid; best = p; } else hi = mid; }
} else if (want < -0.05) { best = pass(want); tries++; }
writeWav(WAV, best.buf);
const after = loudness(ffmpeg, WAV);
const peak = best.peak;
fs.rmSync(RAW, { force: true });

/* ---------- the fast things, at sixty ---------- */
const fastest = (fn, a, b) => {
  let d = 0, at = a;
  for (let f = Math.floor(a * 60); f < Math.ceil(b * 60); f++) { const s = Math.abs(fn((f + 1) / 60) - fn(f / 60)); if (s > d) { d = s; at = f / 60; } }
  return { d: +d.toFixed(2), at: +at.toFixed(3) };
};
const headStep = [[MOVE.at, MOVE.at + MOVE.for], [IN.at, IN.at + SPRING.for], [NOD.at, NOD.at + NOD.upFor + NOD.downFor + NOD.backFor]]
  .map(([a, b]) => { const y = fastest(t => compose(plan, t).card.y, a, b), x = fastest(t => compose(plan, t).card.x, a, b); return y.d >= x.d ? y : x; })
  .sort((x, y) => y.d - x.d)[0];
/* a dash at the fast speed, per frame at sixty */
const dashStep = { d: +(SPEED.fast.v / 60).toFixed(2), at: SPEED.at };
const FASTEST = Math.max(headStep.d, dashStep.d);
if (BLUR) { SUB = BLUR_ARG ? Math.max(2, Math.min(SUB_MAX, Math.round(BLUR_ARG))) : Math.max(2, Math.min(SUB_MAX, Math.ceil(FASTEST / SUB_STEP_WANT))); SUBSTEP = STEP / SUB; }

/* ---------- the clock, printed ---------- */
console.log('\n  the read, edge, ' + TAKES[0].voiceId);
for (const t of TAKES) {
  const w = WORDS[t.i];
  const to = t.i < LINES.length - 1 ? SC[t.i + 1] : END;
  console.log('    line ' + (t.i + 1) + '  "' + t.text + '"  ' + t.rate + ' ' + t.pitch + (t.cached ? '  cached' : '  fetched') + (t.sentences > 1 ? ', ' + t.sentences + ' sentences, stops of ' + t.gaps.map(g => (g * 1000).toFixed(0) + 'ms').join(', ') : '')
    + '\n             sound ' + SOUND[t.i].start.toFixed(2) + ' to ' + SOUND[t.i].end.toFixed(2) + 's in a scene of ' + SC[t.i].toFixed(2) + ' to ' + to.toFixed(2)
    + (SC[t.i] > BRIEF[t.i] + 1e-6 ? ' (the brief said ' + BRIEF[t.i].toFixed(1) + ')' : '') + ', ' + (w.length / (w[w.length - 1].end - w[0].start)).toFixed(2) + ' words a second');
  if (VOICE_ONLY) console.log('             words: ' + w.map((x, k) => k + ':' + x.word).join(' '));
}
console.log('\n  the beats');
const beats = [
  [0, 'one. the news card, "' + NEWS.label + '", him under it at the house size, calm, eyes up at it'],
  ...NEWS.typed.map((T, i) => [T.from, '"' + NEWS.lines[i] + '" types in, ' + NEWS.lines[i].length + ' characters at ' + NEWS.type.cps + ' a second, done at ' + T.to.toFixed(2)]),
  [BLINK_AT, 'one blink, the module\'s, seed ' + SEED],
  [SC[1], 'two. the news card slides up and out, he moves under the row, shrinking'],
  ...TILES.map(tl => [tl.at, 'the ' + tl.key + ' tile springs in, on "' + tl.say + '"']),
  [CONN.at, 'the line joins the three'],
  [HAPPY.at, 'happy, under the row'],
  [CHK.at, 'the check springs above the row, on "' + CHK.say + '"'],
  [SPEED.at, 'the speed card comes in under the line, dashes racing, on "' + SPEED.say + '"'],
  [SLOW.at, 'the dashes slow and space out over ' + SLOW.for + 's, on "' + SLOW.say + '", and he goes calm with them'],
  [SC[2], 'three. the calm rhythm holds'],
  [NOD.at, 'he nods once, on "' + NOD.say + '"'],
  [SC[3], 'four. the row, the check, the line and the speed card go'],
  [PCARD.at, 'the pill card comes in'],
  ...PILL.items.map((pl, i) => [pl.at, 'pill ' + (i + 1) + ' springs in']),
  ...PILL.items.map((pl, i) => [pl.lit, 'pill ' + (i + 1) + ' lights, on "' + pl.name + '"' + (pl.nth > 1 ? ' the second time' : '')]),
  [LOOP.at, 'the loop arrow draws from the last pill back to the first'],
  [SC[4], 'five. the pill card goes'],
  [IN.at, 'he springs from under the row to the middle, ' + SPRING.for + 's'],
  [WM1.at, 'the wordmark pops'],
  [CALM.at, 'calm'],
  [ADDR_IN.at, '"' + ADDR.text + '" under it, held to the end'],
  [SECONDS, 'end, ' + AFTER_READ + 's after the last sound'],
].sort((a, b) => a[0] - b[0]);
for (const [t, what] of beats) console.log('    ' + t.toFixed(2).padStart(5) + 's  ' + what);
console.log('\n  the fast things, at sixty');
console.log('    his centre moves at most ' + headStep.d + ' css px a frame, at ' + headStep.at + 's');
console.log('    a racing dash moves ' + dashStep.d + ' css px a frame');
console.log('  the shutter: ' + (BLUR ? SUB + ' subframes' + (BLUR_ARG ? ' because --blur=' + BLUR_ARG + ' said so' : ', solved') + ', ' + (FASTEST / SUB).toFixed(2) + ' css px between samples' : 'closed'));
console.log('\n  the sound');
console.log('    the voice: ' + TAKES.reduce((a, t) => a + t.sentences, 0) + ' edge takes at ' + RATE + ' assembled into five lines with ' + BREAK_MS + 'ms at every stop, on the clip\'s clock, and nothing else on the bus');
console.log('    the lift: off the voice at ' + (zero.lufs == null ? '?' : zero.lufs) + ' LUFS, took ' + best.lift.toFixed(2) + ' dB in ' + tries + ' pass' + (tries === 1 ? '' : 'es'));
console.log('    the bus: ' + (after.lufs == null ? '?' : after.lufs) + ' LUFS, peak ' + peak.peak + ' dBFS, limiter took ' + (peak.reduction > 0.01 ? peak.reduction.toFixed(2) + ' dB' : 'nothing'));

if (VOICE_ONLY) process.exit(0);

const state = ONLY_ENCODE ? JSON.parse(fs.readFileSync(path.join(OUT, 'post35.json'), 'utf8')) : await render(plan);
const file = encode(WAV);
const p = probe(file);
const lu = loudness(ffmpeg, file);
console.log('\nrendered');
console.log('  ' + p.w + 'x' + p.h + ' @' + p.fps + 'fps  ' + p.seconds.toFixed(2) + 's  ' + (p.audio ? 'with sound' : 'SILENT') + '  '
  + (fs.statSync(file).size / 1e6).toFixed(2) + ' MB  ' + path.relative(ROOT, file));
console.log('  the shutter is ' + (BLUR ? 'open, ' + SUB + ' subframes to a frame' : 'closed'));
if (lu && lu.ok) console.log('  loudness ' + lu.lufs + ' LUFS integrated, true peak ' + lu.truePeak + ' dBFS, measured on the mp4');
console.log('  stills of one and two in ' + path.relative(ROOT, VERIFY));
if (!KEEP && !ONLY_ENCODE) { fs.rmSync(FRAMES, { recursive: true, force: true }); fs.rmSync(SUBS, { recursive: true, force: true }); }

/* ========================================================================== */
/* the guards                                                                 */
/* ========================================================================== */
const fail = [];
console.log('\nchecks');
if (p.w !== VW * DSF || p.h !== VH * DSF) fail.push('the file is ' + p.w + 'x' + p.h);
if (Math.abs(p.fps - FPS) > 0.01) fail.push('the file runs at ' + p.fps + 'fps rather than ' + FPS);
if (Math.abs(p.seconds - SECONDS) > 0.15) fail.push('the file runs ' + p.seconds.toFixed(2) + 's rather than ' + SECONDS);
if (!p.audio) fail.push('the file has no audio track');
if (state.frames !== Math.round(FPS * SECONDS)) fail.push('rendered ' + state.frames + ' frames');

/* ---------- the read is edge, in sync, and inside its scenes ---------- */
{
  for (const t of TAKES) {
    if (t.provider !== 'edge' || !/Andrew/.test(t.voiceId)) fail.push('take ' + (t.i + 1) + ' is ' + t.provider + ' ' + t.voiceId + ', not edge\'s andrew');
    const to = t.i < LINES.length - 1 ? SC[t.i + 1] : END;
    if (SOUND[t.i].start < SC[t.i] - 1e-6) fail.push('line ' + (t.i + 1) + ' starts sounding at ' + SOUND[t.i].start + 's, before its scene');
    if (SOUND[t.i].end > to - AFTER_LINE + 1e-3) fail.push('line ' + (t.i + 1) + ' is still sounding at ' + SOUND[t.i].end + 's, into the next scene');
    if (t.i < LINES.length - 1 && SOUND[t.i].end > SOUND[t.i + 1].start) fail.push('lines ' + (t.i + 1) + ' and ' + (t.i + 2) + ' overlap');
    if (t.rate !== RATE) fail.push('take ' + (t.i + 1) + ' is ' + t.rate);
    for (const g of t.gaps) if (Math.abs(g - BREAK_MS / 1000) > 0.006) fail.push('take ' + (t.i + 1) + ' has a ' + (g * 1000).toFixed(0) + 'ms stop, not ' + BREAK_MS);
    if (t.sentences !== t.text.split(/(?<=[.!?])\s+/).length) fail.push('take ' + (t.i + 1) + ' is ' + t.sentences + ' takes for ' + t.text.split(/(?<=[.!?])\s+/).length + ' sentences');
  }
  for (const [i, L] of LINES.entries()) {
    if (/[—–]/.test(L.text) || /\s-\s/.test(L.text) || /!/.test(L.text) || /[A-Z]/.test(L.text)) fail.push('line ' + (i + 1) + ' breaks the copy rules: "' + L.text + '"');
    if (!/\.$/.test(L.text)) fail.push('line ' + (i + 1) + '\'s read has lost its full stop: "' + L.text + '"');
  }
  if (!/news\. the boring tek\.$/.test(LINES[4].text)) fail.push('line five has lost the stop before the boring tek');
  for (let i = 0; i < BRIEF.length; i++) if (SC[i] < BRIEF[i] - 1e-6) fail.push('scene ' + (i + 1) + ' starts at ' + SC[i] + ', before the floor at ' + BRIEF[i]);
  /* no air: every scene after the first starts 0.30 after the line before it, except two, which may wait for its floor */
  for (let i = 1; i < LINES.length; i++) {
    const gap = SC[i] - SOUND[i - 1].end;
    const allowed = i === 1 ? Math.max(AFTER_LINE, BRIEF[1] - SOUND[0].end) : AFTER_LINE;
    if (gap > allowed + 0.02) fail.push('scene ' + (i + 1) + ' starts ' + gap.toFixed(2) + 's after line ' + i + ' ends, which is air');
  }
  if (SECONDS < 18 || SECONDS > 24) fail.push('the film is ' + SECONDS + 's, and the brief wants about 20');
}

/* ---------- what is on the screen ----------
   no dashes, colons, parentheses, apostrophes or quotes anywhere a viewer
   reads; no dot on a caption. */
{
  const screen = [['the news label', NEWS.label], ['the headline', NEWS.lines.join(' ')], ['the tiles', TILES.filter(t => !t.mark).map(t => t.text).join(' ')], ['the pills', PILL.names.join(' ')],
    ['the wordmark', WM.lines.join(' ')], ['the address', ADDR.text], ...SUBTITLES.map((c, i) => ['subtitle ' + (i + 1), c.lines.join(' ')])];
  for (const [what, s] of screen) {
    if (/[-—–:()'"“”‘’]/.test(s)) fail.push(what + ' carries a dash, a colon, a bracket, an apostrophe or a quote: "' + s + '"');
    if (what !== 'the address' && /\./.test(s)) fail.push(what + ' has a dot in it: "' + s + '"');
  }
  if (TILES.length !== 3) fail.push('there are ' + TILES.length + ' tiles, not three');
  for (const tl of TILES) if (!!tl.mark !== tl.exists) fail.push('the ' + tl.key + ' tile ' + (tl.exists ? 'has a png and does not carry it' : 'carries a mark with no png on disk'));
  if (!TILES[2].mark && TILES[2].text !== 'x ai') fail.push('the third tile is not the text tile "x ai"');
  if (PILL.names.join(' ') !== 'build test build') fail.push('the pills are ' + PILL.names.join(' '));
}

/* ---------- the states are calm or happy, and nothing else is drawn ---------- */
{
  for (const m of plan.marks) if (!['neutral', 'delighted'].includes(m.state)) fail.push('mark ' + m.i + ' is ' + m.state + ', and only calm or happy eyes are allowed');
  if (plan.marks.some(m => m.hands || m.bubble || m.bubbles)) fail.push('a mark asks for hands or a bubble, and this clip has neither');
  if (MODULE_CUES.length) fail.push('the module offers ' + MODULE_CUES.length + ' cue(s) this clip did not expect');
  if (HAPPY.at < MOVE.at + MOVE.for) fail.push('he is happy before he has landed under the row');
  if (HAPPY.at + 2.10 > CALM1.at) fail.push('the happy has no room before he goes calm on the slowing');
  if (CALM1.at > NOD.at) fail.push('he nods before he is calm');
  if (NOD.at + NOD.upFor + NOD.downFor + NOD.backFor > SC[3]) fail.push('the nod runs into scene four');
  if (CALM.at < IN.at + SPRING.for) fail.push('calm starts before he has landed');
  /* the house size under the news card, small under the row, then the house size */
  const c1 = compose(plan, 1.0).card, c2 = compose(plan, SC[2] + 0.5).card, mid = compose(plan, SECONDS - 0.5).card;
  if (Math.abs(c1.sx / mascotFrame(plan, 1.0).card.sx - 1) > 1e-3) fail.push('he is not at the house size under the news card');
  if (Math.abs(c2.sx / mascotFrame(plan, SC[2] + 0.5).card.sx - SMALL.s) > 1e-3) fail.push('he is not at ' + SMALL.s + ' of the house size under the row');
  if (Math.abs(mid.sx / mascotFrame(plan, SECONDS - 0.5).card.sx - 1) > 1e-3) fail.push('he is not at the house size in the middle');
  if (plan.bias !== 0) fail.push('he is not facing the lens');
  /* never inside a card: his head against every card's box on every frame the card is up */
  {
    const cards = [
      ['the news card', NEWS, t => t < NEWS.out.at + NEWS.out.for],
      ['the speed card', SCARD, t => t >= SPEED.at && t < ROW_OUT.at + ROW_OUT.for],
      ['the pill card', PCARD, t => t >= PCARD.at && t < PILL_OUT.at + PILL_OUT.for],
    ];
    let worst = null, hit = null;
    for (let f = 0; f < Math.ceil(SECONDS * 60) && !hit; f++) {
      const t = f / 60;
      const r = headRect(plan, compose(plan, t));
      const hx0 = r.left / DSF, hx1 = VW - r.right / DSF, hy0 = r.top / DSF, hy1 = VH - r.bottom / DSF;
      for (const [what, c, up] of cards) {
        if (!up(t)) continue;
        const y0 = c.top + (c === NEWS ? NEWS.out.up * EASE(span(t, NEWS.out.at, NEWS.out.at + NEWS.out.for)) : 0);
        const gap = Math.max(c.left - hx1, hx0 - (c.left + c.w), y0 - hy1, hy0 - (y0 + c.h));
        if (!worst || gap < worst.gap) worst = { what, gap, t };
        if (gap < 4) { hit = 'he is inside ' + what + ' at ' + t.toFixed(2) + 's, by ' + (-gap).toFixed(1) + ' css px'; break; }
      }
    }
    if (hit) fail.push(hit);
    console.log('  his head clears every card by ' + worst.gap.toFixed(1) + ' css px at the least, ' + worst.what + ' at ' + worst.t.toFixed(2) + 's');
  }
  /* the look up: one offset on both eyes, in over its window, out over the move, ink inside the head throughout */
  {
    const u = compose(plan, LOOK.at + LOOK.for + 0.5), m = mascotFrame(plan, LOOK.at + LOOK.for + 0.5);
    if (Math.abs((u.eyes[0].y - m.eyes[0].y) - LOOK.up) > 1e-3 || Math.abs((u.eyes[1].y - m.eyes[1].y) - LOOK.up) > 1e-3) fail.push('his eyes are not up by ' + LOOK.up + ' units under the news card');
    if (Math.abs(lookAt(0)) > 1e-6) fail.push('he is already looking up on the first frame');
    if (Math.abs(lookAt(MOVE.at + LOOK.outFor + 0.05)) > 1e-6) fail.push('he is still looking up after the move');
    let ink = -Infinity, at = 0;
    for (let f = 0; f < Math.ceil((MOVE.at + MOVE.for) * 60); f++) { const v = eyeInk(plan, compose(plan, f / 60)); if (v > ink) { ink = v; at = f / 60; } }
    if (ink > 0) fail.push('the eye ink lands ' + ink.toFixed(2) + ' units outside the head at ' + at.toFixed(2) + 's, looking up');
  }
  /* the blink on the finished headline is the module's, once, in its window, and the lids really shut */
  {
    const b = oneBlink(plan.idle.blinks);
    if (!b) fail.push('the plan does not blink once on the finished headline');
    if (b && (b.t < NEWS.done || b.t > NEWS.done + BLINK.after + BLINK.within)) fail.push('the blink is at ' + b.t + ', off the finished headline at ' + NEWS.done);
    let shut = 0;
    for (let f = Math.floor(BLINK_AT * 60); f <= Math.ceil((BLINK_AT + 0.4) * 60); f++) { const fr = compose(plan, f / 60); shut = Math.max(shut, fr.eyes[0].lid, fr.eyes[1].lid); }
    if (shut < 0.9) fail.push('the lids only reach ' + shut.toFixed(2) + ' on the blink');
  }
  const home = compose(plan, SECONDS - 0.05).card, mod = mascotFrame(plan, SECONDS - 0.05).card;
  if (Math.abs(home.y - mod.y) > 1e-6 || Math.abs(home.x - mod.x) > 1e-6) fail.push('he is not home on the last frame');
  /* the nod is one dip: down once and back, never below the dip */
  let dips = 0, lastY = 0, maxY = 0;
  for (let f = Math.floor(NOD.at * 60); f <= Math.ceil((NOD.at + NOD.upFor + NOD.downFor + NOD.backFor) * 60); f++) {
    const y = nodAt(f / 60);
    if (lastY <= 0 && y > 0) dips++;
    maxY = Math.max(maxY, y); lastY = y;
  }
  if (dips !== 1) fail.push('the nod dips ' + dips + ' times, and it is one nod');
  if (maxY > NOD.dip * 1.25) fail.push('the nod overshoots to ' + maxY.toFixed(1) + ' css px');
}

/* ---------- the speed line: fast then calm, continuous ---------- */
{
  if (SPEED.at < CHK.at) fail.push('the speed line starts before the check');
  if (SLOW.at < SPEED.at + 0.8) fail.push('the dashes race for only ' + (SLOW.at - SPEED.at).toFixed(2) + 's before slowing');
  if (SLOW.at + SLOW.for > SC[2] + 1.0) fail.push('the dashes are still slowing at ' + (SLOW.at + SLOW.for).toFixed(2) + ', well into scene three');
  if (NOD.at < SLOW.at + SLOW.for * 0.5) fail.push('he nods before the dashes have slowed');
  /* no dash ever jumps: between two frames at sixty the nearest dash to any dash's last spot is within one step */
  let worstJump = 0;
  for (let f = Math.floor(SPEED.at * 60) + 1; f < Math.floor(SC[3] * 60); f++) {
    const a = dashesAt((f - 1) / 60).dashes.filter(d => d.on).map(d => d.x), b = dashesAt(f / 60).dashes.filter(d => d.on).map(d => d.x);
    for (const x of a) {
      if (x < SPEED.fade || x > SPEED.w - SPEED.fade - SPEED.fast.len) continue;
      let near = Infinity;
      for (const y of b) near = Math.min(near, Math.abs(y - x));
      worstJump = Math.max(worstJump, near);
    }
  }
  /* a teleport is a period at least; the ceiling is under half of the smallest one */
  if (worstJump > SPEED.fast.period * 0.45) fail.push('a dash jumps ' + worstJump.toFixed(1) + ' css px between two frames');
  const calm = dashesAt(SC[3] - 0.1);
  if (Math.abs(calm.period - SPEED.calm.period) > 0.01 || Math.abs(calm.len - SPEED.calm.len) > 0.01) fail.push('the dashes have not reached the calm rhythm by scene four');
  if (dashesAt(SPEED.at + 0.5).dashes.filter(d => d.on).length < SPEED.w / SPEED.fast.period - 1) fail.push('too few dashes on the fast track');
}

/* ---------- everything clears the safe area, the house one and the brief's ---------- */
{
  const M = state.measured;
  const floor = BRIEF_SAFE;
  const inside = (what, b) => {
    if (b.left < SAFE.left || b.right < SAFE.right || b.top < SAFE.top || b.bottom < SAFE.bottom) fail.push(what + ' is inside the house safe area: ' + b.left + ' / ' + b.top + ' / ' + b.right + ' / ' + b.bottom);
    if (b.left < floor || b.right < floor || b.top < floor || b.bottom < floor) fail.push(what + ' is inside the brief\'s 120px margin');
  };
  inside('the news card', M.news);
  if (!/monospace|Mono|Menlo|Consolas/i.test(M.newsLab.font)) fail.push('the news label is not mono: ' + M.newsLab.font);
  if (M.newsLab.left < M.news.left || M.newsLab.right < M.news.right) fail.push('the news label leaves the card');
  for (const [i, b] of M.newsLines.entries()) {
    if (!/Michroma/.test(b.font)) fail.push('headline line ' + (i + 1) + ' is not in Michroma: ' + b.font);
    if (b.left < M.news.left + 8 || b.right < M.news.right + 8 || b.bottom < M.news.bottom + 8) fail.push('headline line ' + (i + 1) + ' with its cursor leaves the card: ' + b.left + ' / ' + b.right + ' / ' + b.bottom);
  }
  if (NEWS.lines.length !== 2) fail.push('the headline is ' + NEWS.lines.length + ' lines');
  if (NEWS.done > SC[1] - 0.4) fail.push('the headline is still typing at ' + NEWS.done + ', with two at ' + SC[1]);
  if (NEWS.out.at + NEWS.out.for > MOVE.at + MOVE.for) fail.push('the news card is still leaving after he has landed under the row');
  inside('the speed card', M.scard);
  inside('the pill card', M.pcard);
  if (SCARD.top < CONN.y + 8) fail.push('the speed card sits on the connecting line');
  if (PILL.top < PCARD.top + 8 || PILL.bottom > PCARD.bottom - 8) fail.push('the pills leave the pill card');
  if (LOOP.y + LOOP.drop * 0.75 > PCARD.bottom - 8) fail.push('the loop leaves the pill card');
  if (PILL.left < PCARD.left + 8 || PILL.left + 3 * PILL.w + 2 * PILL.gap > PCARD.left + PCARD.w - 8) fail.push('the pills leave the pill card sideways');
  for (const [i, b] of M.tiles.entries()) {
    inside('the ' + TILES[i].key + ' tile', b);
    if (b.mark) {
      if (Math.abs(TILES[i].mark.inkH - ROW.ink) > 0.01) fail.push('the ' + TILES[i].key + ' mark\'s ink is ' + TILES[i].mark.inkH + ' css px tall, not ' + ROW.ink);
      if (b.mark.w < 1) fail.push('the ' + TILES[i].key + ' mark has no box');
      if (TILES[i].mark.inkW > ROW.w - 16 || ROW.ink > ROW.h - 16) fail.push('the ' + TILES[i].key + ' mark\'s ink does not fit its tile');
    } else {
      if (b.textPx > ROW.w * DSF - 16) fail.push('the ' + TILES[i].key + ' tile\'s name is ' + b.textPx + ' device px, too wide for its tile');
      if (!/Michroma/.test(b.font)) fail.push('the ' + TILES[i].key + ' tile is not in Michroma: ' + b.font);
    }
  }
  inside('the check', M.chk);
  if ((VH * DSF - M.chk.bottom) / DSF > ROW.top - 8) fail.push('the check reaches onto the row');
  if (M.speed.left < M.scard.left || M.speed.right < M.scard.right || M.speed.top < M.scard.top || M.speed.bottom < M.scard.bottom) fail.push('the speed line leaves its card');
  for (const [i, b] of M.pills.entries()) {
    inside('pill ' + (i + 1), b);
    if (b.textPx > PILL.w * DSF - 24) fail.push('pill ' + (i + 1) + '\'s name is ' + b.textPx + ' device px, too wide');
    if (!/monospace|Mono|Menlo|Consolas/i.test(b.font)) fail.push('pill ' + (i + 1) + ' is not mono: ' + b.font);
  }
  inside('the loop', M.loop);
  if (state.built.loopLen < 2 * LOOP.drop) fail.push('the loop measures ' + state.built.loopLen + ' css px, which is not a loop');
  inside('the wordmark', M.wm);
  inside('the address', M.addr);
  if (!/Michroma/.test(M.wm.font)) fail.push('the wordmark is not in Michroma: ' + M.wm.font);
  if (M.wm.capPx < WM.minCapPx) fail.push('the wordmark caps are ' + M.wm.capPx + ' device px, under ' + WM.minCapPx);
  /* the address sits under the wordmark, measured */
  const wmBottom = VH - M.wm.bottom / DSF, adTop = M.addr.top / DSF;
  if (adTop < wmBottom + 6) fail.push('the address starts at ' + adTop.toFixed(0) + ' css px, on the wordmark which ends at ' + wmBottom.toFixed(0));
  /* the head at home clears the wordmark */
  const hr = headRect(plan, compose(plan, SECONDS - 0.5));
  if ((VH * DSF - hr.bottom) / DSF > WM.top - 6) fail.push('his head reaches onto the wordmark');
  /* the subtitles: every card fits on its lines, sits in the safe area, and is under everything */
  for (const [i, c] of CARDS.entries()) {
    const b = M.subs[i];
    if (!/Nunito/.test(b.font)) fail.push('subtitle ' + (i + 1) + ' is not in nunito: ' + b.font);
    if (b.widestPx > (VW - SAFE_CSS.left - SAFE_CSS.right) * DSF) fail.push('subtitle ' + (i + 1) + ' is ' + b.widestPx + ' device px wide, past the side margins');
    if (c.lines.length > 2) fail.push('subtitle ' + (i + 1) + ' has ' + c.lines.length + ' lines');
    const bottom = ST.top + b.h / DSF;
    if (bottom > VH - SAFE_CSS.bottom) fail.push('subtitle ' + (i + 1) + ' reaches ' + bottom.toFixed(0) + ' css px, into the bottom band');
    if (bottom > VH - BRIEF_SAFE / DSF) fail.push('subtitle ' + (i + 1) + ' is inside the brief\'s bottom margin');
    if (c.to - c.from < 0.4) fail.push('subtitle ' + (i + 1) + ' is up for ' + (c.to - c.from).toFixed(2) + 's');
  }
  if (ST.top < NEWS.bottom + 8) fail.push('the subtitle slot is on the news card');
  if (ST.top < PCARD.bottom + 8) fail.push('the subtitle slot is on the pill card');
  if (ST.top < SCARD.bottom + 8) fail.push('the subtitle slot is on the speed card');
  if (ST.top < ADDR.top + ADDR.size * 1.3 + 8) fail.push('the subtitle slot is on the address');
  for (let i = 0; i < LINES.length; i++) if (!CARDS.some(c => c.line === i)) fail.push('line ' + (i + 1) + ' has no subtitle');
  /* he never reaches the subtitle slot, small on a corner, under the row or home */
  {
    let lowest = 0;
    for (let f = 0; f < Math.ceil(SECONDS * 60); f++) { const r = headRect(plan, compose(plan, f / 60)); lowest = Math.max(lowest, VH * DSF - r.bottom); }
    if (lowest / DSF > ST.top - 4) fail.push('he reaches ' + (lowest / DSF).toFixed(0) + ' css px, onto the subtitle slot at ' + ST.top);
  }
  if (state.head && state.head.near < Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom)) fail.push('the head comes within ' + state.head.near + ' device px of a border at ' + state.head.t + 's');
  /* the timing of two, three and four holds together */
  if (TILES.some(tl => tl.at < SC[1])) fail.push('a tile pops before scene two');
  if (CHK.at < CONN.at + CONN.for) fail.push('the check springs at ' + CHK.at.toFixed(2) + ', before the line has joined the three at ' + (CONN.at + CONN.for).toFixed(2));
  if (PILL.items.some(pl => pl.lit < pl.at + PILL.popFor)) fail.push('a pill lights before it has landed');
  if (PILL.items[0].lit > PILL.items[1].lit || PILL.items[1].lit > PILL.items[2].lit) fail.push('the pills do not light in order');
  if (LOOP.at + LOOP.for > SC[4] - 0.10) fail.push('the loop is still drawing at ' + (LOOP.at + LOOP.for).toFixed(2) + ', into scene five at ' + SC[4]);
  if (PILL.items[0].at < PCARD.at + 0.10) fail.push('the first pill springs before its card is up');
}

/* ---------- no colour but the house's: the accent on the check and the lit pills ---------- */
{
  const mine = sceneHtml(plan).split('==== this clip\'s own css starts here ====')[1];
  const accents = (mine.match(/var\(--accent\)/g) || []).length;
  if (accents !== 3) fail.push('the accent is painted in ' + accents + ' places, which is not the check and the lit pill\'s ring and ink');
  if (/var\(--red\)/.test(mine)) fail.push('the red is painted, and nothing here is red');
  if ((mine.match(/background:var\(--field\)/g) || []).length !== 3) fail.push('the card field is painted somewhere other than the house card, the tiles and the check circle');
  if (/--iris/.test(mine)) fail.push('the iris is overridden, and his eyes stay the module\'s');
}

/* ---------- the module's own report ---------- */
for (const st of rep60.states) if (st.entryFrames == null) fail.push(st.state + ' never reached its own mark');
if (rep60.outside.units > 0) fail.push('feature ink lands ' + rep60.outside.units.toFixed(2) + ' units outside the head silhouette');
if (rep60.frozenFrames) fail.push(rep60.frozenFrames + ' frames where the face is not moving at all');

/* ---------- the sound is the voice and nothing else ---------- */
{
  if (lu && lu.ok) {
    if (lu.truePeak > PEAK_CEILING) fail.push('the true peak is ' + lu.truePeak + ' dBFS, over the ' + PEAK_CEILING + ' ceiling');
    if (lu.lufs > TARGET_LUFS + 0.5) fail.push('the file measures ' + lu.lufs + ' LUFS, over the ' + TARGET_LUFS + ' target');
  } else fail.push('ebur128 said nothing about the finished file');
  if (peak.reduction > MAX_REDUCTION + 1e-6) fail.push('the limiter took ' + peak.reduction.toFixed(2) + ' dB, over the ' + MAX_REDUCTION + ' dB this clip allows');
  for (let i = 0; i < LINES.length - 1; i++) {
    const a = Math.round((SOUND[i].end + POST + 0.02) * SR), b = Math.round((SOUND[i + 1].start - PRE - 0.02) * SR);
    let m = 0; for (let j = a; j < b; j++) m = Math.max(m, Math.abs(best.buf[j]));
    if (m > 1e-4) fail.push('something sounds between lines ' + (i + 1) + ' and ' + (i + 2));
  }
}

/* ---------- the fast things, and nothing is a still ---------- */
if (headStep.d > STEP_CEIL) fail.push('his centre moves ' + headStep.d + ' css px on one frame at 60');
if (BLUR && !BLUR_ARG && FASTEST / SUB > SUB_STEP_WANT + 1e-6) fail.push('the solved shutter leaves ' + (FASTEST / SUB).toFixed(2) + ' css px between samples');
{
  let repeats = 0, first = null, smallest = Infinity;
  for (let i = 1; i < state.sigs.length; i++) {
    const d = Math.abs(state.sigs[i] - state.sigs[i - 1]);
    if (d === 0) { repeats++; if (first == null) first = i; }
    smallest = Math.min(smallest, d);
  }
  console.log('  liveness: smallest change between frames ' + smallest.toExponential(2) + (repeats ? ', ' + repeats + ' IDENTICAL PAIRS' : ', no identical pairs'));
  if (repeats) fail.push(repeats + ' pairs of identical frames, the first at frame ' + first);
}

console.log('\n  outstanding');
console.log('    the scene starts are the brief\'s, floored by the read: ' + SC.map(b => b.toFixed(2)).join(' / ') + ', end ' + END);
console.log('    the speed line turns on "slower", which is the last word of two, so it races in on two\'s second sentence and three is the calm rhythm with the nod');
console.log('    the glow is the module\'s own two layers, not pushed');

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
