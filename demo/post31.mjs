/* the boring tek — post31. did you know: claude for small business.

   dark only, 1080x1920, five lines read by edge's andrew, about 22 seconds
   on the brief's clock and as long as the read needs on the real one. slow
   first, then faster. voice only on the bus: no ticks, no beeps, einz adds
   the music outside.

     one    0 to 5      a desk card, the house dark card. eight sheets drop
                        in one by one on the site's spring, each with a small
                        mono label, order, invoice, payroll, receipt, and the
                        pile leans as it grows. a counter in the card's corner
                        counts them. he sits small in the card's bottom right
                        corner, turned a third toward the pile, eyes neutral.
     two    5 to 11     the pile freezes. a small claude mark pops in above
                        the card on the word `claude`, then five tiles spring
                        in around it in a bento, each a plain michroma name on
                        the field colour, each on its own word, and a thin
                        line draws from every tile to the mark. then a big
                        number counts from 0 to 43 in one second on `43`,
                        with `ready workflows` under it.
     three  11 to 17    the card, the bento and the number go; a laptop pops
                        in with a plain dark page on it, `monday brief`. four
                        lines land on the read's own words: cash, sales
                        against last week with a small bklit line drawing
                        itself, overdue invoices with a red three, and to do
                        with three lines. he sits small on the laptop's corner
                        and goes delighted once the page is full.
     four   17 to 20    the laptop slides out to the left. the desk card
                        comes back with its pile, the pile collapses to one
                        clean sheet and a check draws on it. he springs from
                        the corner to the middle at the house size, turns to
                        the lens, delighted.
     five   20 to 22.5  the card goes. calm, the wordmark under him, `we set
                        it up for you` under that, `theboringtek.com` small.
                        held to the end.

   the scene starts are the brief's, floored by the read: a scene never
   starts before the line before it has finished sounding plus 0.30, post30's
   rule, so a long take pushes what follows rather than being cut.

   **every line is subtitled** under everything, post30's way: nunito, white,
   one or two short lines, centred, one slot under the card, the laptop and
   the address, never over any of them, no full stop on screen.

   **the claude mark is an asset**, `demo/assets/logo-claude.png`, placed as a
   background at its own ratio with its ink solved to one height, post30's
   way; nothing here draws a brand. if the file is not there the middle of
   the bento is a text tile that says claude. the five tools are text.

   **the read is edge at minus five per cent with a 300ms stop at every full
   stop**, post30's take() copied whole: every sentence its own take,
   assembled with exactly BREAK_MS of silence between them.

     node post31.mjs                     1080x1920, 60fps, shutter closed
     DEMO_FPS=12 node post31.mjs         the fast preview pass
     node post31.mjs --voice             the read and the clock only, no browser
     node post31.mjs --blur              60fps with the shutter open, solved
     node post31.mjs --keep-frames       leave the jpegs on disk
     node post31.mjs --encode-only       re-encode from kept frames

   one output, one path, overwritten every run:

     demo/out/post31-dark-1080x1920.mp4

   ---------- what is borrowed and from where ----------

   **the mascot is `lib/mascot.mjs` and nothing here reaches inside it.** two
   states, neutral and delighted, no hands, no bubble. the corner to corner
   move and the spring to the middle are one translate composed onto
   `frame.card`, post29's pattern; the shadow is declined, post26.

   **the line on the laptop is `lib/props/charts.mjs`**, bklit's line with the
   grid and the labels off, driven by its own `apply(t)` on the row's clock.

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
  mascotRuntime, mascotPagePlan, describeMascot, describeMotion, headRect,
  STAGE, SAFE, HEAD, GRID,
} from './lib/mascot.mjs';
import { brandTokens } from './lib/captions.mjs';
import { speak, VOICE_OUT } from './lib/voice.mjs';
import { writeWav, applyGain, limit, loudness, decode, SR } from './lib/sfx.mjs';
import { propsRuntime } from './lib/props/tokens.mjs';
import { lineCss, lineMarkup, lineScript, CHART_ENTER } from './lib/props/charts.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-post31');
const SUBS = path.join(OUT, 'subframes-post31');
const VERIFY = path.join(OUT, 'verify-post31');
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
   AFTER_LINE. `END` is the last sound plus AFTER_READ, so the end card holds. */
/* fix round one: the starts are the read's, not the brief's. scene two is
   floored at 4.0 so the pile finishes dropping first (slow first), and the
   rest start 0.30 after the line before them stops, so the film carries no
   air. scene four has one more floor, see the clock below: he needs his
   delighted whole before the spring. */
const BRIEF = [0, 4, 4, 4, 4];
const BRIEF_END = 23;
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
  { text: 'you run a small business. every evening the same pile.', rate: RATE, pitch: '+1Hz' },
  { text: 'this week claude connected to your tools. shopify, stripe, xero, square. 43 ready workflows.', rate: RATE, pitch: '+1Hz' },
  { text: 'monday morning, one page. cash, sales, overdue invoices, what needs you.', rate: RATE, pitch: '+1Hz' },
  { text: 'hours become minutes. you do the business.', rate: RATE, pitch: '+1Hz' },
  { text: 'we set it up for you. the boring tek.', rate: RATE, pitch: '+2Hz' },
];
/* ---------- the subtitles ----------
   one card per sentence or so, cut to the read's own words by index into
   the take, the screen lines broken by hand so nothing wraps. no full stop
   on screen; the read keeps its stops. */
const SUBTITLES = [
  { line: 0, words: [0, 4], lines: ['you run a small business'] },
  { line: 0, words: [5, 9], lines: ['every evening the same pile'] },
  { line: 1, words: [0, 6], lines: ['this week claude', 'connected to your tools'] },
  { line: 1, words: [7, 10], lines: ['shopify, stripe, xero, square'] },
  { line: 1, words: [11, 13], lines: ['43 ready workflows'] },
  { line: 2, words: [0, 3], lines: ['monday morning, one page'] },
  { line: 2, words: [4, 7], lines: ['cash, sales, overdue invoices'] },
  { line: 2, words: [8, 10], lines: ['what needs you'] },
  { line: 3, words: [0, 2], lines: ['hours become minutes'] },
  { line: 3, words: [3, 6], lines: ['you do the business'] },
  { line: 4, words: [0, 5], lines: ['we set it up for you'] },
  { line: 4, words: [6, 8], lines: ['the boring tek'] },
];
/* one slot, under everything: the card ends at 602, the laptop at 566, the
   address at 566, and the slot starts at 660. */
const ST = { size: 22, lh: 1.3, weight: 600, top: 660, lead: 0.05, tail: 0.30, fadeIn: 0.12, fadeOut: 0.15, rise: 6 };
const SILENCE_DB = -42;
const PRE = 0.06, POST = 0.10, EDGE_FADE = 0.012;

/* ---------- what is on the screen ----------
   every string a viewer reads, in one place, so the copy guard can walk them. */
/* one and four: the desk card. the house dark card, --field on --bg, a --line
   border, 18px radius. the sheets stack inside it, up and to the right,
   each turned a shade more than the one under it, so the pile leans. */
const CARD = { w: 380, h: 230, left: 80, top: 372, radius: 18 };
const SHEET = {
  w: 140, h: 88, radius: 6, n: 8,
  labels: ['order', 'invoice', 'payroll', 'receipt', 'order', 'invoice', 'payroll', 'receipt'],
  /* each sheet 13px above the one under it, so the bottom strip of every
     sheet, where its label sits, stays in view; the lean is the turn */
  x0: 44, y0: 130, dx: 3, dy: -13, rot0: -2.5, drot: 0.9,
  from: 0.45, every: 0.42, dropFor: 0.45, fall: 36,
  font: 9, strip: 13,
};
const COUNTER = { size: 12, word: 'sheets' };
/* the clean sheet the pile collapses to, centred in the card, and its check */
const CLEAN = { left: (CARD.w - SHEET.w) / 2, top: (CARD.h - SHEET.h) / 2, checkSize: 40 };
const COLLAPSE = { at: 0, for: 0.50 };
const CHECK = { at: 0, for: 0.35, d: 'M8 21l8 8l16-18', len: 0 };
CHECK.len = +(Math.hypot(8, 8) + Math.hypot(16, 18)).toFixed(3);
/* two: the bento, three across and two down with the mark in the middle */
const BENTO = {
  w: 124, h: 46, gap: 8, top: 150, radius: 12, font: 11,
  names: ['shopify', 'stripe', 'xero', 'square', 'zoom'],
  slots: [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1]],
  popFor: 0.40, popFrom: 0.6, lineFor: 0.25, lineAfter: 0.10,
};
BENTO.left = (VW - (3 * BENTO.w + 2 * BENTO.gap)) / 2;
BENTO.tiles = BENTO.slots.map(([c, r], i) => ({
  name: BENTO.names[i], col: c, row: r,
  x: +(BENTO.left + c * (BENTO.w + BENTO.gap)).toFixed(2), y: +(BENTO.top + r * (BENTO.h + BENTO.gap)).toFixed(2),
}));
const MID = { cx: +(BENTO.left + (BENTO.w + BENTO.gap) + BENTO.w / 2).toFixed(2), cy: +(BENTO.top + (BENTO.h + BENTO.gap) + BENTO.h / 2).toFixed(2) };
/* the mark: an asset, its ink solved to one height. if it is not on disk the
   middle slot is a text tile. */
const LOGO = { file: path.join(ASSETS, 'logo-claude.png'), ink: 24, popFor: 0.40, popFrom: 0.6, say: 'claude', text: 'claude', at: 0 };
LOGO.exists = fs.existsSync(LOGO.file);
/* the lines from each tile to the mark: straight, drawn on with a dash */
const LINK = { gapTile: 6, gapMark: 18 };
const NUM = { value: 43, size: 54, top: 262, for: 1.00, at: 0, label: 'ready workflows', labelSize: 13, labelTop: 336, labelAfter: 0.30 };
/* three: the laptop, a screen in a frame on a wider base, the page inside it */
const LAP = { w: 400, left: 70, top: 280, sh: 270, inset: 10, radius: 14, base: 16, baseW: 440, pad: 18 };
LAP.bottom = LAP.top + LAP.sh + LAP.base;
const PAGE = {
  title: 'monday brief', titleSize: 13, size: 14, todoSize: 13,
  rows: [
    { key: 'cash', label: 'cash', value: '12,480', top: 50, say: 'cash' },
    { key: 'sales', label: 'sales vs last week', top: 86, say: 'sales', chart: true },
    { key: 'overdue', label: 'overdue invoices', value: '3', red: true, top: 134, say: 'overdue' },
    { key: 'todo', label: 'to do', top: 162, say: 'what', lines: ['call the supplier', 'sign the lease', 'pay the vat'] },
  ],
  todoTop: 184, todoStep: 18, todoStagger: 0.15, rowFor: 0.30, rowRise: 8,
};
const CHART = {
  id: 'brief', width: 150, height: 44, at: 0,
  data: [{ x: 'a', y: 21 }, { x: 'b', y: 26 }, { x: 'c', y: 23 }, { x: 'd', y: 31 }, { x: 'e', y: 29 }, { x: 'f', y: 36 }, { x: 'g', y: 41 }],
};
/* the sizes he sits at and where */
const SMALL = { s: 0.42, pad: 16 };
const HEAD_Y = 250;
const SIZE = 148;
/* five: the wordmark, the line and the address */
const WM = { lines: ['THE', 'BORING', 'TEK'], w: 300, lh: 1.16, top: 360, minCapPx: 50 };
const LINE5 = { text: 'we set it up for you', size: 24, top: 542 };
const ADDR = { text: 'theboringtek.com', size: 16, top: 582 };

/* ---------- the entrances, the exits and the pops ---------- */
const SPRING = { for: 0.50 };                  /* the corner to the middle */
const MOVE = { at: 0, for: 0.45 };             /* the card's corner to the laptop's */
const IN = { at: 0 };
const DELIGHT1 = { at: 0 }, DELIGHT2 = { at: 0 }, CALM = { at: 0 };
const CARD_OUT = { at: 0, for: 0.35 }, CARD_IN = { at: 0, for: 0.40 }, CARD_OUT2 = { at: 0, for: 0.35 };
const BENTO_OUT = { at: 0, for: 0.35 };
const LAP_IN = { at: 0, for: 0.50 }, LAP_OUT = { at: 0, for: 0.45, to: -(LAP.left + LAP.baseW + 60) };
const WM1 = { at: 0, for: 0.09 }, L5_IN = { at: 0, for: 0.30 }, ADDR_IN = { at: 0, for: 0.30 };

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
const CHART_EASE = bezier(...CHART_ENTER.ease);
const EASE_IN = p => p * p;
const EASE_OUT2 = p => 1 - (1 - p) * (1 - p);
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))));
const lerp = (a, b, p) => a + (b - a) * p;
function phosphor(t, amp, slow, fast, phase) {
  return 1 + amp * 0.78 * Math.sin(2 * Math.PI * t / slow) + amp * 0.39 * Math.sin(2 * Math.PI * t / fast + phase);
}
const bare = w => w.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '');

/* ---------- the mark, measured ----------
   the png header for the file's size, ffmpeg for the alpha bounding box of
   the ink, and the element's box solved so the ink is LOGO.ink tall with
   its centre on the middle slot. post30's, post19's before it. */
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
const MARK = LOGO.exists ? (() => {
  const p = pngFacts(LOGO.file);
  const ink = inkBox(LOGO.file, p.w, p.h);
  const sc = LOGO.ink / ink.h;
  const inkW = ink.w * sc;
  return {
    ...p, ink, sc: +sc.toFixed(6), box: { w: +(p.w * sc).toFixed(3), h: +(p.h * sc).toFixed(3) }, inkW: +inkW.toFixed(2), inkH: +(ink.h * sc).toFixed(2),
    left: +(MID.cx - (ink.x + ink.w / 2) * sc).toFixed(3), top: +(MID.cy - (ink.y + ink.h / 2) * sc).toFixed(3),
  };
})() : null;
/* the links: from the tile's edge facing the mark to just short of the mark */
const LINKS = BENTO.tiles.map(tl => {
  let x1, y1;
  if (tl.row === 0) { x1 = tl.x + BENTO.w / 2; y1 = tl.y + BENTO.h + LINK.gapTile; }
  else if (tl.col === 0) { x1 = tl.x + BENTO.w + LINK.gapTile; y1 = tl.y + BENTO.h / 2; }
  else { x1 = tl.x - LINK.gapTile; y1 = tl.y + BENTO.h / 2; }
  const dx = MID.cx - x1, dy = MID.cy - y1, L = Math.hypot(dx, dy);
  const gap = LINK.gapMark, x2 = MID.cx - dx / L * gap, y2 = MID.cy - dy / L * gap;
  return { x1: +x1.toFixed(2), y1: +y1.toFixed(2), x2: +x2.toFixed(2), y2: +y2.toFixed(2), len: +(L - gap).toFixed(2) };
});

/* ---------- the read ----------
   post30's take(), whole: one take a sentence, cached on the copy and the
   delivery, edge by name and refused from anywhere else, the sentences laid
   end to end with exactly BREAK_MS of silence between one's last sound and
   the next's first. the endpoint refuses ssml breaks, which is why. */
async function take(i) {
  const L = LINES[i];
  const parts = L.text.split(/(?<=[.!?])\s+/);
  const takes = [];
  for (let k = 0; k < parts.length; k++) {
    const name = 'post31-l' + (i + 1) + (parts.length > 1 ? 's' + (k + 1) : '');
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
   home is the middle of the frame across, HEAD_Y down. one and two: small in
   the desk card's bottom right corner. three: small on the laptop's bottom
   right corner, a short move between the two. four: the spring from the
   corner to home, growing to the house size, and he stays. */
const R_FULL = HEAD.plate.s / 2 * (SIZE / GRID);
const HOME = { x: VW / 2, y: HEAD_Y };
const R_SMALL = R_FULL * SMALL.s;
const CORNER1 = { x: +(CARD.left + CARD.w - SMALL.pad - R_SMALL).toFixed(3), y: +(CARD.top + CARD.h - SMALL.pad - R_SMALL).toFixed(3) };
const CORNER2 = { x: +(LAP.left + LAP.w - 10 - R_SMALL).toFixed(3), y: +(LAP.bottom - 4 - R_SMALL).toFixed(3) };
function placeAt(t) {
  const c1 = { dx: CORNER1.x - HOME.x, dy: CORNER1.y - HOME.y };
  const c2 = { dx: CORNER2.x - HOME.x, dy: CORNER2.y - HOME.y };
  if (t < MOVE.at) return { ...c1, s: SMALL.s, rot: 0, on: 1, o: 1 };
  if (t < MOVE.at + MOVE.for) {
    const p = EASE(span(t, MOVE.at, MOVE.at + MOVE.for));
    return { dx: +lerp(c1.dx, c2.dx, p).toFixed(3), dy: +lerp(c1.dy, c2.dy, p).toFixed(3), s: SMALL.s, rot: 0, on: 1, o: 1 };
  }
  if (t < IN.at) return { ...c2, s: SMALL.s, rot: 0, on: 1, o: 1 };
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
  f.shadow = { ...f.shadow, o: 0 };
  return f;
}

/* ---------- the sheets ----------
   sheet i drops at from + i * every: from `fall` above its spot and
   transparent, landing on the spring. in four the same pile is drawn as it
   landed, then every sheet converges on the clean sheet's spot and fades. */
const sheetAt = i => +(SHEET.from + i * SHEET.every).toFixed(4);
const SHEETS_DONE = +(sheetAt(SHEET.n - 1) + SHEET.dropFor).toFixed(4);
function sheetsAt(t) {
  const out = [];
  const col = span(t, COLLAPSE.at, COLLAPSE.at + COLLAPSE.for);
  const ce = EASE(col);
  for (let i = 0; i < SHEET.n; i++) {
    const x0 = SHEET.x0 + i * SHEET.dx, y0 = SHEET.y0 + i * SHEET.dy, r0 = SHEET.rot0 + i * SHEET.drot;
    if (t < CARD_IN.at) {
      const at = sheetAt(i);
      const p = span(t, at, at + SHEET.dropFor);
      const e = POP(p);
      out.push({ o: +span(t, at, at + 0.10).toFixed(4), x: x0, y: +lerp(y0 - SHEET.fall, y0, e).toFixed(3), rot: +(r0 * e).toFixed(3) });
    } else {
      out.push({ o: +(1 - span(col, 0.45, 1)).toFixed(4), x: +lerp(x0, CLEAN.left, ce).toFixed(3), y: +lerp(y0, CLEAN.top, ce).toFixed(3), rot: +lerp(r0, 0, ce).toFixed(3) });
    }
  }
  return out;
}
const sheetsLanded = t => { let n = 0; for (let i = 0; i < SHEET.n; i++) if (t >= sheetAt(i) + 0.20) n++; return n; };

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
  /* one and four: the desk card, in, out, in again, out again */
  const out1 = span(t, CARD_OUT.at, CARD_OUT.at + CARD_OUT.for);
  const in2 = span(t, CARD_IN.at, CARD_IN.at + CARD_IN.for);
  const out2 = span(t, CARD_OUT2.at, CARD_OUT2.at + CARD_OUT2.for);
  let cardO, cardS;
  if (t < CARD_IN.at) { cardO = 1 - out1; cardS = lerp(1, 0.96, EASE(out1)); }
  else { cardO = span(t, CARD_IN.at, CARD_IN.at + 0.20) * (1 - out2); cardS = lerp(0.94, 1, POP(in2)) * lerp(1, 0.94, EASE(out2)); }
  const landed = t < CARD_IN.at ? sheetsLanded(t) : SHEET.n;
  const col = span(t, COLLAPSE.at, COLLAPSE.at + COLLAPSE.for);
  const clean = { o: +(t >= CARD_IN.at ? span(col, 0.5, 1) : 0).toFixed(4) };
  const chk = { p: +EASE(span(t, CHECK.at, CHECK.at + CHECK.for)).toFixed(4) };
  const counter = { o: +(t >= CARD_IN.at ? 1 - span(col, 0, 0.5) : 1).toFixed(4), n: landed };
  /* two: the mark, the tiles, the links, the number */
  const bo = 1 - span(t, BENTO_OUT.at, BENTO_OUT.at + BENTO_OUT.for);
  const bs = lerp(1, 0.96, EASE(span(t, BENTO_OUT.at, BENTO_OUT.at + BENTO_OUT.for)));
  const mark = { o: +(span(t, LOGO.at, LOGO.at + 0.10) * bo).toFixed(4), sc: +(lerp(LOGO.popFrom, 1, POP(span(t, LOGO.at, LOGO.at + LOGO.popFor))) * bs).toFixed(4) };
  const tiles = BENTO.tiles.map(tl => ({
    o: +(span(t, tl.at, tl.at + 0.10) * bo).toFixed(4),
    sc: +(lerp(BENTO.popFrom, 1, POP(span(t, tl.at, tl.at + BENTO.popFor))) * bs).toFixed(4),
    link: +(EASE(span(t, tl.at + BENTO.popFor + BENTO.lineAfter, tl.at + BENTO.popFor + BENTO.lineAfter + BENTO.lineFor)) * bo).toFixed(4),
  }));
  const np = span(t, NUM.at, NUM.at + NUM.for);
  const num = {
    o: +(span(t, NUM.at, NUM.at + 0.12) * bo).toFixed(4),
    v: Math.round(NUM.value * EASE_OUT2(np)),
    sc: +(lerp(0.92, 1, EASE(span(t, NUM.at, NUM.at + 0.40))) * bs).toFixed(4),
    lab: +(EASE(span(t, NUM.at + NUM.labelAfter, NUM.at + NUM.labelAfter + 0.30)) * bo).toFixed(4),
  };
  /* three: the laptop and its page */
  const li = span(t, LAP_IN.at, LAP_IN.at + LAP_IN.for);
  const lo = span(t, LAP_OUT.at, LAP_OUT.at + LAP_OUT.for);
  const lap = { o: +(span(t, LAP_IN.at, LAP_IN.at + 0.20) * (1 - span(lo, 0.7, 1))).toFixed(4), sc: +lerp(0.94, 1, POP(li)).toFixed(5), x: +(LAP_OUT.to * EASE_IN(lo)).toFixed(3) };
  const rows = PAGE.rows.map(r => {
    const p = EASE(span(t, r.at, r.at + PAGE.rowFor));
    const todo = r.lines ? r.lines.map((_, k) => EASE(span(t, r.at + k * PAGE.todoStagger, r.at + k * PAGE.todoStagger + PAGE.rowFor))) : null;
    return { o: +p.toFixed(4), y: +(PAGE.rowRise * (1 - p)).toFixed(3), todo: todo && todo.map(q => ({ o: +q.toFixed(4), y: +(PAGE.rowRise * (1 - q)).toFixed(3) })) };
  });
  const chart = { t: +Math.max(0, t - CHART.at).toFixed(4) };
  /* five: the wordmark, the line, the address */
  const wmP = span(t, WM1.at, WM1.at + WM1.for);
  const l5P = span(t, L5_IN.at, L5_IN.at + L5_IN.for);
  const adP = span(t, ADDR_IN.at, ADDR_IN.at + ADDR_IN.for);
  return {
    t: +t.toFixed(4), f,
    mo: +(P.on * P.o).toFixed(4),
    card: { o: +cardO.toFixed(4), sc: +cardS.toFixed(5) },
    sheets: sheetsAt(t), clean, chk, counter,
    mark, tiles, num, lap, rows, chart,
    subt: subAt(t),
    wm: { o: t >= WM1.at ? 1 : 0, sc: +(1 + (1 - EASE(wmP)) * 0.085).toFixed(4), glow: +phosphor(t, 0.055, 2.3, 0.83, 1.7).toFixed(4) },
    line5: { o: +EASE(l5P).toFixed(4), y: +(8 * (1 - EASE(l5P))).toFixed(3) },
    addr: { o: +EASE(adP).toFixed(4), y: +(8 * (1 - EASE(adP))).toFixed(3) },
  };
}

/* ---------- the page ---------- */
function sceneHtml(plan) {
  const brand = brandTokens();
  const mcss = mascotCss(plan);
  const chartOpts = { id: CHART.id, width: CHART.width, height: CHART.height, margin: { top: 5, right: 7, bottom: 5, left: 4 }, data: CHART.data, grid: false, labels: false, strokeWidth: 2 };
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<title>post31</title>
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
/* over the card and the laptop: the module puts him at z 4, they are z 3 */
#m-zone{opacity:var(--m-o,1);z-index:5}

/* ---- one and four: the desk card and the pile ---- */
.card{position:absolute;left:${CARD.left}px;top:${CARD.top}px;width:${CARD.w}px;height:${CARD.h}px;z-index:3;
  background:var(--field);border:1px solid var(--line);border-radius:${CARD.radius}px;
  transform-origin:50% 50%;will-change:transform,opacity;overflow:hidden}
.sheet{position:absolute;left:0;top:0;width:${SHEET.w}px;height:${SHEET.h}px;border-radius:${SHEET.radius}px;
  background:var(--pill-on);border:1px solid var(--line);opacity:0;transform-origin:50% 50%;will-change:transform,opacity;
  font-family:var(--mono);font-weight:500;font-size:${SHEET.font}px;line-height:1;letter-spacing:.06em;color:var(--muted);padding:10px 11px}
.sheet b{position:absolute;left:10px;bottom:${(SHEET.strip - SHEET.font) / 2 - 1}px;font-weight:500}
.sheet i{display:block;height:1px;background:var(--line);margin-top:8px;width:70%}
.sheet i+i{width:52%}
.sheet i+i+i{width:61%}
.cnt{position:absolute;right:16px;top:13px;font-family:var(--mono);font-weight:500;font-size:${COUNTER.size}px;letter-spacing:.06em;color:var(--muted);white-space:nowrap}
.clean{position:absolute;left:${CLEAN.left}px;top:${CLEAN.top}px;width:${SHEET.w}px;height:${SHEET.h}px;border-radius:${SHEET.radius}px;
  background:var(--pill-on);border:1px solid var(--line);opacity:0;display:flex;align-items:center;justify-content:center}
.clean svg{width:${CLEAN.checkSize}px;height:${CLEAN.checkSize}px;display:block}
.clean path{fill:none;stroke:var(--accent);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:${CHECK.len} ${CHECK.len};stroke-dashoffset:${CHECK.len}}

/* ---- two: the bento, the mark, the links, the number ---- */
.tile{position:absolute;width:${BENTO.w}px;height:${BENTO.h}px;border-radius:${BENTO.radius}px;z-index:3;
  background:var(--field);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;
  font-family:var(--display);font-size:${BENTO.font}px;letter-spacing:.04em;color:var(--fg);opacity:0;transform-origin:50% 50%;will-change:transform,opacity;white-space:nowrap}
${MARK ? `.mark{position:absolute;left:${MARK.left}px;top:${MARK.top}px;width:${MARK.box.w}px;height:${MARK.box.h}px;background:url(/mark-claude.png) no-repeat;background-size:100% 100%;
  opacity:0;transform-origin:50% 50%;will-change:transform,opacity;z-index:3}` : `.mark{position:absolute;left:${BENTO.tiles[0].x + BENTO.w + BENTO.gap}px;top:${BENTO.tiles[3].y}px}`}
.links{position:absolute;left:0;top:0;width:${VW}px;height:${VH}px;z-index:2;pointer-events:none}
.links line{stroke:var(--line);stroke-width:1.5;stroke-linecap:round}
.num{position:absolute;left:${SAFE_CSS.left}px;right:${SAFE_CSS.right}px;top:${NUM.top}px;text-align:center;z-index:3;
  font-family:var(--display);font-size:${NUM.size}px;line-height:1.2;color:var(--fg);opacity:0;transform-origin:50% 50%;will-change:transform,opacity;
  text-shadow:0 0 10px rgba(255,255,255,.28),0 0 30px rgba(255,255,255,.12)}
.numlab{position:absolute;left:${SAFE_CSS.left}px;right:${SAFE_CSS.right}px;top:${NUM.labelTop}px;text-align:center;z-index:3;
  font-family:var(--mono);font-weight:500;font-size:${NUM.labelSize}px;letter-spacing:.08em;color:var(--muted);opacity:0;white-space:nowrap}

/* ---- three: the laptop ---- */
.lap{position:absolute;left:${LAP.left}px;top:${LAP.top}px;width:${LAP.w}px;height:${LAP.sh + LAP.base}px;z-index:3;transform-origin:50% 50%;opacity:0;will-change:transform,opacity}
.lap .frame{position:absolute;left:0;top:0;width:${LAP.w}px;height:${LAP.sh}px;border-radius:${LAP.radius}px ${LAP.radius}px 4px 4px;background:var(--field);border:1px solid var(--line)}
.lap .base{position:absolute;left:${(LAP.w - LAP.baseW) / 2}px;top:${LAP.sh}px;width:${LAP.baseW}px;height:${LAP.base}px;border-radius:3px 3px 10px 10px;background:var(--pill-on);border:1px solid var(--line)}
.lap .base::after{content:"";position:absolute;left:50%;top:0;width:60px;height:5px;margin-left:-30px;border-radius:0 0 4px 4px;background:var(--line)}
.lap .screen{position:absolute;left:${LAP.inset}px;top:${LAP.inset}px;width:${LAP.w - 2 * LAP.inset}px;height:${LAP.sh - 2 * LAP.inset}px;border-radius:${LAP.radius - LAP.inset + 2}px;
  background:var(--bg);overflow:hidden;padding:0 ${LAP.pad}px}
.pg-title{position:absolute;left:${LAP.pad}px;top:18px;font-family:var(--display);font-size:${PAGE.titleSize}px;letter-spacing:.06em;color:var(--fg);white-space:nowrap}
.row{position:absolute;left:${LAP.pad}px;right:${LAP.pad}px;display:flex;align-items:center;justify-content:space-between;
  font-family:var(--cap);font-weight:400;font-size:${PAGE.size}px;line-height:1.3;color:var(--fg);opacity:0;will-change:transform,opacity;white-space:nowrap}
.row .v{font-family:var(--mono);font-weight:500;font-size:${PAGE.size}px;color:var(--fg)}
.row .v.red{color:var(--red)}
.row .l{color:var(--sub)}
.todo{position:absolute;left:${LAP.pad + 14}px;font-family:var(--cap);font-weight:400;font-size:${PAGE.todoSize}px;line-height:1.3;color:var(--sub);opacity:0;will-change:transform,opacity;white-space:nowrap}
.todo::before{content:"";display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--muted);margin:0 8px 2px 0}
${lineCss(chartOpts)}
.${CHART.id}{position:absolute;right:${LAP.pad - 6}px;top:${PAGE.rows[1].top - 14}px;width:${CHART.width}px}

/* ---- the subtitles: one block, one slot ---- */
.subt{position:absolute;left:${SAFE_CSS.left}px;right:${SAFE_CSS.right}px;top:${ST.top}px;text-align:center;z-index:9;
  font-family:var(--cap);font-weight:${ST.weight};font-size:${ST.size}px;line-height:${ST.lh};color:var(--face);white-space:pre;opacity:0;will-change:transform,opacity}
.subt .sl{display:block}

/* ---- five: the wordmark, post23's, the line and the address ---- */
.wm{position:absolute;left:50%;top:${WM.top}px;transform:translateX(-50%) scale(var(--wm-s,1));transform-origin:50% 50%;
  font-family:var(--display);font-weight:400;color:var(--fg);text-align:center;text-transform:uppercase;letter-spacing:.18em;
  line-height:${WM.lh};white-space:nowrap;text-indent:.09em;opacity:var(--wm-o,0);
  text-shadow:0 0 10px rgba(255,255,255,.38),0 0 30px rgba(255,255,255,.20),0 0 66px rgba(255,255,255,.10);
  filter:brightness(var(--wm-glow,1));z-index:8}
.wm span{display:block}
.line5{position:absolute;left:${SAFE_CSS.left}px;right:${SAFE_CSS.right}px;top:${LINE5.top}px;text-align:center;
  font-family:var(--cap);font-weight:600;font-size:${LINE5.size}px;line-height:1.25;color:var(--fg);white-space:nowrap;opacity:0;z-index:8}
.addr{position:absolute;left:${SAFE_CSS.left}px;right:${SAFE_CSS.right}px;top:${ADDR.top}px;text-align:center;
  font-family:var(--mono);font-weight:500;font-size:${ADDR.size}px;letter-spacing:.08em;line-height:1.3;color:var(--muted);white-space:nowrap;opacity:0;z-index:8}
</style>
</head>
<body>
<div class="vignette" aria-hidden="true"></div>
<div class="stage" id="stage">
${mascotMarkup(plan)}
  <div class="card" id="card">
    ${SHEET.labels.map((l, i) => '<div class="sheet" id="sh' + i + '"><i></i><i></i><i></i><b>' + l + '</b></div>').join('')}
    <div class="clean" id="clean"><svg viewBox="0 0 ${CLEAN.checkSize} ${CLEAN.checkSize}" aria-hidden="true"><path id="chk" d="${CHECK.d}"/></svg></div>
    <div class="cnt" id="cnt">0 ${COUNTER.word}</div>
  </div>
  <svg class="links" aria-hidden="true">${LINKS.map((k, i) => '<line id="lk' + i + '" x1="' + k.x1 + '" y1="' + k.y1 + '" x2="' + k.x2 + '" y2="' + k.y2 + '" stroke-dasharray="' + k.len + ' ' + k.len + '" stroke-dashoffset="' + k.len + '"/>').join('')}</svg>
  ${BENTO.tiles.map((tl, i) => '<div class="tile" id="tile' + i + '" style="left:' + tl.x + 'px;top:' + tl.y + 'px">' + tl.name + '</div>').join('\n  ')}
  ${MARK ? '<div class="mark" id="mark" aria-hidden="true"></div>' : '<div class="tile mark" id="mark">' + LOGO.text + '</div>'}
  <div class="num" id="num">0</div>
  <div class="numlab" id="numlab">${NUM.label}</div>
  <div class="lap" id="lap">
    <div class="base"></div>
    <div class="frame"><div class="screen">
      <div class="pg-title">${PAGE.title}</div>
      ${PAGE.rows.map((r, i) => '<div class="row" id="row' + i + '" style="top:' + r.top + 'px"><span class="l">' + r.label + '</span>' + (r.value ? '<span class="v' + (r.red ? ' red' : '') + '">' + r.value + '</span>' : '') + '</div>').join('\n      ')}
      ${PAGE.rows[3].lines.map((l, k) => '<div class="todo" id="todo' + k + '" style="top:' + (PAGE.todoTop + k * PAGE.todoStep) + 'px">' + l + '</div>').join('\n      ')}
      ${lineMarkup(chartOpts)}
    </div></div>
  </div>
  <div class="wm" id="wm">${WM.lines.map(l => '<span>' + l + '</span>').join('')}</div>
  <div class="line5" id="line5">${LINE5.text}</div>
  <div class="addr" id="addr">${ADDR.text}</div>
  <div class="subt" id="subt"><span class="sl" id="sl0"></span><span class="sl" id="sl1"></span></div>
</div>
<script>
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(plan))};
window.__P31 = ${JSON.stringify({ VW, VH, DSF, WM, SHEET, BENTO: { n: BENTO.tiles.length }, PAGE: { rows: PAGE.rows.length, todo: PAGE.rows[3].lines.length }, CHART: { id: CHART.id }, CHECK: { len: CHECK.len }, COUNTER, SUBS: SUBTITLES.map(c => c.lines) })};
${mascotRuntime()}
${propsRuntime()}
${lineScript(chartOpts)}
(${scenePage.toString()})();
Promise.all([document.fonts.load('400 40px Michroma'), document.fonts.load('400 ${PAGE.size}px Nunito'), document.fonts.load('600 ${LINE5.size}px Nunito'), document.fonts.load('${ST.weight} ${ST.size}px Nunito')])
  .then(function () { return document.fonts.ready; })
  .then(function () { window.__built = Object.assign({}, window.__p31.fit(), { mas: window.__mas.build() }); });
</script>
</body>
</html>`;
}

/* ---------- the page's own script ----------
   writes numbers to elements and decides nothing. */
function scenePage() {
  const P = window.__P31;
  const stage = document.getElementById('stage');
  const card = document.getElementById('card');
  const sheets = P.SHEET.labels.map((_, i) => document.getElementById('sh' + i));
  const clean = document.getElementById('clean');
  const chk = document.getElementById('chk');
  const cnt = document.getElementById('cnt');
  const tiles = []; for (let i = 0; i < P.BENTO.n; i++) tiles.push(document.getElementById('tile' + i));
  const links = []; for (let i = 0; i < P.BENTO.n; i++) links.push(document.getElementById('lk' + i));
  const mark = document.getElementById('mark');
  const num = document.getElementById('num');
  const numlab = document.getElementById('numlab');
  const lap = document.getElementById('lap');
  const rows = []; for (let i = 0; i < P.PAGE.rows; i++) rows.push(document.getElementById('row' + i));
  const todos = []; for (let i = 0; i < P.PAGE.todo; i++) todos.push(document.getElementById('todo' + i));
  const chart = window.__props.get(P.CHART.id);
  const wm = document.getElementById('wm');
  const line5 = document.getElementById('line5');
  const addr = document.getElementById('addr');
  const subt = document.getElementById('subt');
  const sls = [document.getElementById('sl0'), document.getElementById('sl1')];
  let lastSub = null, lastCnt = null, lastNum = null;
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
  window.__p31 = {
    fit() {
      const probe = wm;
      probe.style.fontSize = '100px';
      let widest = 0;
      for (const sp of probe.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      const ws = 100 * P.WM.w / widest;
      wm.style.fontSize = ws.toFixed(2) + 'px';
      return { wm: +ws.toFixed(2) };
    },
    measure() {
      const d = P.DSF;
      const c = capOf(wm);
      let widest = 0;
      for (const sp of wm.querySelectorAll('span')) widest = Math.max(widest, sp.getBoundingClientRect().width);
      /* the tiles and the rows are measured whole, before any transform */
      return {
        wm: { ...box(wm.getBoundingClientRect(), d), widestPx: +(widest * d).toFixed(1), capPx: +(c.cap * d).toFixed(1), font: c.font },
        line5: { ...box(rg(line5), d), font: capOf(line5).font },
        addr: { ...box(rg(addr), d), font: capOf(addr).font },
        card: box(card.getBoundingClientRect(), d),
        tiles: tiles.map(el => ({ ...box(el.getBoundingClientRect(), d), textPx: +(rg(el).width * d).toFixed(1), font: capOf(el).font })),
        mark: box(mark.getBoundingClientRect(), d),
        num: { ...box(num.getBoundingClientRect(), d), font: capOf(num).font },
        numlab: { ...box(rg(numlab), d), font: capOf(numlab).font },
        lap: box(lap.getBoundingClientRect(), d),
        screen: box(lap.querySelector('.screen').getBoundingClientRect(), d),
        rows: rows.map(el => ({ ...box(el.getBoundingClientRect(), d), font: capOf(el).font })),
        todos: todos.map(el => box(rg(el), d)),
        chart: box(document.getElementById(P.CHART.id).getBoundingClientRect(), d),
        cnt: { ...box(rg(cnt), d), font: capOf(cnt).font },
        sheets: sheets.map(el => ({ font: capOf(el).font })),
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
      card.style.opacity = o.card.o.toFixed(4);
      card.style.transform = 'scale(' + o.card.sc.toFixed(5) + ')';
      card.style.visibility = o.card.o < 0.004 ? 'hidden' : 'visible';
      for (let i = 0; i < sheets.length; i++) {
        const sh = o.sheets[i];
        sheets[i].style.opacity = sh.o.toFixed(4);
        sheets[i].style.transform = 'translate(' + sh.x.toFixed(3) + 'px,' + sh.y.toFixed(3) + 'px) rotate(' + sh.rot.toFixed(3) + 'deg)';
      }
      clean.style.opacity = o.clean.o.toFixed(4);
      chk.style.strokeDashoffset = (P.CHECK.len * (1 - o.chk.p)).toFixed(3);
      cnt.style.opacity = o.counter.o.toFixed(4);
      if (o.counter.n !== lastCnt) { lastCnt = o.counter.n; cnt.textContent = o.counter.n + ' ' + P.COUNTER.word; }
      mark.style.opacity = o.mark.o.toFixed(4);
      mark.style.transform = 'scale(' + o.mark.sc.toFixed(4) + ')';
      for (let i = 0; i < tiles.length; i++) {
        tiles[i].style.opacity = o.tiles[i].o.toFixed(4);
        tiles[i].style.transform = 'scale(' + o.tiles[i].sc.toFixed(4) + ')';
        const len = parseFloat(links[i].getAttribute('stroke-dasharray'));
        links[i].style.strokeDashoffset = (len * (1 - o.tiles[i].link)).toFixed(3);
        links[i].style.opacity = o.tiles[i].link > 0 ? '1' : '0';
      }
      num.style.opacity = o.num.o.toFixed(4);
      num.style.transform = 'scale(' + o.num.sc.toFixed(4) + ')';
      if (o.num.v !== lastNum) { lastNum = o.num.v; num.textContent = String(o.num.v); }
      numlab.style.opacity = o.num.lab.toFixed(4);
      lap.style.opacity = o.lap.o.toFixed(4);
      lap.style.transform = 'translateX(' + o.lap.x.toFixed(3) + 'px) scale(' + o.lap.sc.toFixed(5) + ')';
      lap.style.visibility = o.lap.o < 0.004 ? 'hidden' : 'visible';
      for (let i = 0; i < rows.length; i++) {
        rows[i].style.opacity = o.rows[i].o.toFixed(4);
        rows[i].style.transform = 'translateY(' + o.rows[i].y.toFixed(3) + 'px)';
        if (o.rows[i].todo) for (let k = 0; k < todos.length; k++) {
          todos[k].style.opacity = o.rows[i].todo[k].o.toFixed(4);
          todos[k].style.transform = 'translateY(' + o.rows[i].todo[k].y.toFixed(3) + 'px)';
        }
      }
      chart.el.style.opacity = o.rows[1].o.toFixed(4);
      chart.apply(o.chart.t);
      s.setProperty('--wm-o', o.wm.o.toFixed(4));
      s.setProperty('--wm-s', o.wm.sc.toFixed(4));
      s.setProperty('--wm-glow', o.wm.glow.toFixed(4));
      line5.style.opacity = o.line5.o.toFixed(4);
      line5.style.transform = 'translateY(' + o.line5.y.toFixed(3) + 'px)';
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
  const mark = MARK ? fs.readFileSync(LOGO.file) : null;
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/' || p === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }
    if (p === '/mark-claude.png' && mark) {
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' });
      return res.end(mark);
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
  for (const [f, what] of [['400 40px "Michroma"', 'the wordmark'], ['400 ' + PAGE.size + 'px "Nunito"', 'the page'], ['600 ' + LINE5.size + 'px "Nunito"', 'the captions']]) {
    if (!await page.evaluate(q => document.fonts.check(q), f)) throw new Error(f + ' did not load, and ' + what + ' would be judged in the fallback');
  }
  const built = await page.evaluate(() => window.__built);
  const measured = await page.evaluate(() => window.__p31.measure());
  console.log('  built: head ' + built.mas.headPx + 'px, ' + built.mas.eyes + ' eyes, ' + built.mas.glows + ' glow layers, theme ' + built.mas.theme);
  console.log('  the wordmark: ' + measured.wm.widestPx + ' device px wide, caps ' + measured.wm.capPx + ', clear ' + measured.wm.left + ' / ' + measured.wm.top + ' / ' + measured.wm.right + ' / ' + measured.wm.bottom);
  console.log('  the card: ' + measured.card.w + 'x' + measured.card.h + ' device px, clear ' + measured.card.left + ' / ' + measured.card.top + ' / ' + measured.card.right + ' / ' + measured.card.bottom);
  console.log('  the tiles: ' + measured.tiles.map((b, i) => BENTO.names[i] + ' ' + b.textPx + ' of ' + (BENTO.w * DSF)).join(', ') + ' device px');
  console.log('  the mark: ' + (MARK ? MARK.w + 'x' + MARK.h + ' file, ink ' + MARK.inkW + 'x' + MARK.inkH + ' css px at ' + MID.cx + ', ' + MID.cy : 'a text tile, no png on disk') + ', pops at ' + LOGO.at.toFixed(2) + 's');
  console.log('  the laptop: ' + measured.lap.w + 'x' + measured.lap.h + ' device px, clear ' + measured.lap.left + ' / ' + measured.lap.top + ' / ' + measured.lap.right + ' / ' + measured.lap.bottom);
  for (const [i, c] of CARDS.entries()) console.log('  subtitle ' + String(i + 1).padStart(2) + ' ' + c.from.toFixed(2) + ' to ' + c.to.toFixed(2) + ': ' + c.lines.join(' / ') + ', widest ' + measured.subs[i].widestPx + ' device px');

  const put = async (t, f) => {
    const mf = compose(plan, t);
    const o = frameAt(t, f);
    await page.evaluate(fr => window.__mas.apply(fr), mf);
    await page.evaluate(fr => window.__p31.apply(fr), o);
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
      let s = o.mo * 7 + o.card.o * 11 + o.card.sc * 13 + o.clean.o * 17 + o.chk.p * 19 + o.counter.n * 23 + o.counter.o * 29
        + o.mark.o * 31 + o.mark.sc * 37 + o.num.o * 41 + o.num.v * 43 + o.num.sc * 47 + o.num.lab * 53
        + o.lap.o * 59 + o.lap.sc * 61 + o.lap.x * 67 + o.chart.t * 71 * (o.rows[1].o > 0 ? 1 : 0)
        + o.subt.o * 251 + o.subt.i * 257 + o.subt.y * 263
        + o.wm.o * 73 + o.wm.sc * 79 + o.wm.glow * 83 + o.line5.o * 89 + o.addr.o * 97;
      for (let i = 0; i < o.sheets.length; i++) s += o.card.o * (o.sheets[i].o * (101 + i) + o.sheets[i].y * (109 + i) + o.sheets[i].rot * (127 + i));
      for (let i = 0; i < o.tiles.length; i++) s += o.tiles[i].o * (131 + i) + o.tiles[i].sc * (139 + i) + o.tiles[i].link * (149 + i);
      for (let i = 0; i < o.rows.length; i++) { s += o.lap.o * (o.rows[i].o * (151 + i) + o.rows[i].y * (157 + i)); if (o.rows[i].todo) for (const q of o.rows[i].todo) s += o.lap.o * q.o * 163; }
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
  const stills = [
    [sheetAt(3) + 0.25, 'a-s1-the-pile-growing'],
    [SHEETS_DONE + 0.3, 'b-s1-the-pile-whole'],
    [LOGO.at + 0.5, 'c-s2-the-mark'],
    [BENTO.tiles[2].at + 0.5, 'd-s2-three-tiles'],
    [BENTO.tiles[4].at + 0.8, 'e-s2-the-bento-linked'],
    [NUM.at + 1.3, 'f-s2-the-number'],
    [LAP_IN.at + 0.7, 'g-s3-the-laptop'],
    [PAGE.rows[1].at + 0.9, 'h-s3-the-line-drawing'],
    [PAGE.rows[2].at + 0.4, 'i-s3-overdue'],
    [DELIGHT1.at + 0.7, 'j-s3-the-page-full-delighted'],
    [LAP_OUT.at + 0.22, 'k-s4-the-laptop-leaving'],
    [IN.at + SPRING.for * 0.5, 'l-s4-the-spring'],
    [COLLAPSE.at + COLLAPSE.for * 0.5, 'm-s4-the-pile-collapsing'],
    [CHECK.at + CHECK.for + 0.3, 'n-s4-the-check'],
    [ADDR_IN.at + 0.5, 'o-s5-the-end-card'],
    [SECONDS - 0.06, 'p-the-last-frame'],
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
  fs.writeFileSync(path.join(OUT, 'post31.json'), JSON.stringify(state, null, 2));
  return state;
}

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }
function blend(N) {
  console.log('  blending ' + N * SUB + ' subframes into ' + N + ' frames ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS * SUB), '-i', path.join(SUBS, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1) + ',setpts=PTS-STARTPTS,framestep=' + SUB, '-q:v', '2', path.join(FRAMES, 'f%05d.jpg')]);
}
function encode(wav) {
  const out = path.join(OUT, 'post31-dark-1080x1920.mp4');
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
/* scene four's extra floor: the to do row lands on `what`, he goes delighted
   as it lands, and delighted needs 1.10s whole before the turn at IN, which
   is 0.10 into scene four. */
const DELIGHT_ROOM = 1.10 + 0.15 - 0.10;
for (let i = 0; i < LINES.length; i++) {
  OFF.push(+(SC[i] + PRE - EDGE[i].start).toFixed(4));
  const soundEnd = +(EDGE[i].end + OFF[i]).toFixed(4);
  let floor = soundEnd + AFTER_LINE;
  if (i === 2) {
    const w = TAKES[2].words.find(x => bare(x.word) === 'what');
    if (!w) throw new Error('line three has no "what" in it');
    floor = Math.max(floor, w.start + OFF[2] + DELIGHT_ROOM);
  }
  if (i < LINES.length - 1) SC[i + 1] = +Math.max(BRIEF[i + 1], floor).toFixed(4);
  else END = +(soundEnd + AFTER_READ).toFixed(4);
}
SECONDS = +END.toFixed(2);
const WORDS = TAKES.map((t, i) => t.words.map(w => ({ word: w.word, start: +(w.start + OFF[i]).toFixed(4), end: +(w.end + OFF[i]).toFixed(4) })));
const SOUND = TAKES.map((t, i) => ({ start: +(EDGE[i].start + OFF[i]).toFixed(4), end: +(EDGE[i].end + OFF[i]).toFixed(4) }));
const wordAt = (i, w) => WORDS[i].find(x => bare(x.word) === w);
const need = (i, w) => { const x = wordAt(i, w); if (!x) throw new Error('line ' + (i + 1) + ' has no "' + w + '" in it'); return x; };

/* ---------- the clock, hung off the scene starts and the words ---------- */
/* two: the mark on `claude`, each tile on its name, the count on `43` */
LOGO.at = +need(1, LOGO.say).start.toFixed(4);
/* zoom is shown and not said: it follows square by the tile beat */
for (const tl of BENTO.tiles) { const w = wordAt(1, tl.name); tl.at = w ? +w.start.toFixed(4) : 0; tl.said = !!w; }
for (let i = 0; i < BENTO.tiles.length; i++) if (!BENTO.tiles[i].said) BENTO.tiles[i].at = +(BENTO.tiles[i - 1].at + 0.45).toFixed(4);
NUM.at = +need(1, '43').start.toFixed(4);
/* three: the card and the bento go, the laptop comes, he moves */
CARD_OUT.at = SC[2];
BENTO_OUT.at = SC[2];
MOVE.at = +(SC[2] + 0.05).toFixed(4);
LAP_IN.at = +(SC[2] + 0.20).toFixed(4);
for (const r of PAGE.rows) r.at = +Math.max(need(2, r.say).start, LAP_IN.at + LAP_IN.for).toFixed(4);
CHART.at = PAGE.rows[1].at;
const PAGE_FULL = +(PAGE.rows[3].at + 2 * PAGE.todoStagger + PAGE.rowFor).toFixed(4);
/* four: the laptop leaves, the card returns, the pile collapses, he springs */
LAP_OUT.at = SC[3];
IN.at = +(SC[3] + 0.10).toFixed(4);
/* he goes delighted once the page is full, and the state needs its own room
   before the turn to the lens at IN; if the read leaves less than that, it
   starts as late as it can and still lands whole */
DELIGHT1.at = +Math.min(PAGE_FULL + 0.10, Math.max(PAGE.rows[3].at, IN.at - 1.15)).toFixed(4);
DELIGHT2.at = +(IN.at + 1.10).toFixed(4);
CARD_IN.at = +(SC[3] + LAP_OUT.for * 0.5).toFixed(4);
COLLAPSE.at = +(CARD_IN.at + CARD_IN.for + 0.25).toFixed(4);
CHECK.at = +(COLLAPSE.at + COLLAPSE.for + 0.05).toFixed(4);
/* five: the card goes, calm, the wordmark, the line, the address */
CARD_OUT2.at = SC[4];
CALM.at = +(SC[4] + 0.50).toFixed(4);
WM1.at = +(SC[4] + 0.20).toFixed(4);
L5_IN.at = +(WM1.at + 0.30).toFixed(4);
ADDR_IN.at = +(L5_IN.at + 0.25).toFixed(4);

/* ---------- the subtitles, cut to the read ---------- */
for (const [i, c] of SUBTITLES.entries()) {
  const W = WORDS[c.line];
  const [a, b] = c.words;
  if (!(W[a] && W[b] && a <= b)) throw new Error('subtitle ' + (i + 1) + ' names words ' + a + '..' + b + ' and line ' + (c.line + 1) + ' has ' + W.length);
  const letters = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (letters(W.slice(a, b + 1).map(w => w.word).join('')) !== letters(c.lines.join(''))) {
    throw new Error('subtitle ' + (i + 1) + ' reads "' + c.lines.join(' / ') + '" and the take says "' + W.slice(a, b + 1).map(w => w.word).join(' ') + '"');
  }
  CARDS.push({ ...c, from: +(W[a].start - ST.lead).toFixed(4), to: +(W[b].end + ST.tail).toFixed(4) });
}
for (let i = 0; i + 1 < CARDS.length; i++) if (CARDS[i].to > CARDS[i + 1].from - 0.02) CARDS[i].to = +(CARDS[i + 1].from - 0.02).toFixed(4);

/* ---------- the plan ----------
   he rests a third of a turn toward the pile and the screen, which are on his
   left, and the spring's mark turns him to the lens. */
const TURN_TO_LEFT = -0.35;
const MARKS = [
  { t: 0, state: 'neutral' },
  { t: DELIGHT1.at, state: 'delighted' },
  { t: IN.at, state: 'neutral', turn: 0, turnFor: 0.40 },
  { t: DELIGHT2.at, state: 'delighted' },
  { t: CALM.at, state: 'neutral' },
];
const makePlan = seed => planMascot({ seconds: SECONDS, size: SIZE, theme: 'dark', bias: TURN_TO_LEFT, seed, marks: MARKS });
const CLEAR = [[IN.at + SPRING.for - 0.20, IN.at + SPRING.for + 0.30], [MOVE.at + MOVE.for - 0.15, MOVE.at + MOVE.for + 0.25]];
const SEED = (() => {
  for (let s = 1; s <= 400; s++) {
    const b = makePlan(s).idle.blinks;
    if (!b.some(x => CLEAR.some(([a, z]) => x.t >= a && x.t < z))) return s;
  }
  throw new Error('no seed under 400 keeps the module\'s blinks clear of the two landings');
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
const WAV = path.join(OUT, 'post31-mix.wav');
const RAW = path.join(OUT, 'post31-mix-raw.wav');
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
const headStep = [[MOVE.at, MOVE.at + MOVE.for], [IN.at, IN.at + SPRING.for]]
  .map(([a, b]) => { const y = fastest(t => compose(plan, t).card.y, a, b), x = fastest(t => compose(plan, t).card.x, a, b); return y.d >= x.d ? y : x; })
  .sort((x, y) => y.d - x.d)[0];
const lapStep = fastest(t => frameAt(t, 0).lap.x, LAP_OUT.at, LAP_OUT.at + LAP_OUT.for);
const FASTEST = Math.max(headStep.d, lapStep.d);
if (BLUR) { SUB = BLUR_ARG ? Math.max(2, Math.min(SUB_MAX, Math.round(BLUR_ARG))) : Math.max(2, Math.min(SUB_MAX, Math.ceil(FASTEST / SUB_STEP_WANT))); SUBSTEP = STEP / SUB; }

/* ---------- the clock, printed ---------- */
console.log('\n  the read, edge, ' + TAKES[0].voiceId);
for (const t of TAKES) {
  const w = WORDS[t.i];
  const to = t.i < LINES.length - 1 ? SC[t.i + 1] : END;
  console.log('    line ' + (t.i + 1) + '  "' + t.text + '"  ' + t.rate + ' ' + t.pitch + (t.cached ? '  cached' : '  fetched') + (t.sentences > 1 ? ', ' + t.sentences + ' sentences, stops of ' + t.gaps.map(g => (g * 1000).toFixed(0) + 'ms').join(', ') : '')
    + '\n             sound ' + SOUND[t.i].start.toFixed(2) + ' to ' + SOUND[t.i].end.toFixed(2) + 's in a scene of ' + SC[t.i].toFixed(2) + ' to ' + to.toFixed(2)
    + (SC[t.i] > BRIEF[t.i] + 1e-6 ? ' (the brief said ' + BRIEF[t.i].toFixed(1) + ')' : '') + ', ' + (w.length / (w[w.length - 1].end - w[0].start)).toFixed(2) + ' words a second');
}
console.log('\n  the beats');
const beats = [
  [0, 'one. the desk card, him small in its corner turned to the pile'],
  [sheetAt(0), 'the first sheet drops, one every ' + SHEET.every + 's, ' + SHEET.n + ' by ' + SHEETS_DONE.toFixed(2)],
  [SC[1], 'two. the pile freezes'],
  [LOGO.at, 'the claude mark pops, on "claude"'],
  ...BENTO.tiles.map(tl => [tl.at, 'the ' + tl.name + ' tile springs in, ' + (tl.said ? 'on the word' : 'unsaid, on the beat after square') + ', and its line draws to the mark']),
  [NUM.at, 'the number counts to ' + NUM.value + ' over ' + NUM.for + 's, on "43"'],
  [SC[2], 'three. the card and the bento go, he moves to the laptop\'s corner'],
  [LAP_IN.at, 'the laptop pops in'],
  ...PAGE.rows.map(r => [r.at, 'the ' + r.key + ' row lands, on "' + r.say + '"' + (r.chart ? ', the line draws itself' : '')]),
  [PAGE_FULL, 'the page is full'],
  [DELIGHT1.at, 'delighted, on the corner'],
  [SC[3], 'four. the laptop slides out to the left'],
  [IN.at, 'he springs from the corner to the middle, ' + SPRING.for + 's, turning to the lens'],
  [CARD_IN.at, 'the desk card comes back with its pile'],
  [COLLAPSE.at, 'the pile collapses to one clean sheet over ' + COLLAPSE.for + 's'],
  [CHECK.at, 'the check draws'],
  [DELIGHT2.at, 'delighted, in the middle'],
  [SC[4], 'five. the card goes'],
  [WM1.at, 'the wordmark pops'],
  [CALM.at, 'calm'],
  [L5_IN.at, '"' + LINE5.text + '"'],
  [ADDR_IN.at, '"' + ADDR.text + '" under it, held to the end'],
  [SECONDS, 'end, ' + AFTER_READ + 's after the last sound'],
].sort((a, b) => a[0] - b[0]);
for (const [t, what] of beats) console.log('    ' + t.toFixed(2).padStart(5) + 's  ' + what);
console.log('\n  the fast things, at sixty');
console.log('    his centre moves at most ' + headStep.d + ' css px a frame, at ' + headStep.at + 's');
console.log('    the laptop moves at most ' + lapStep.d + ' css px a frame on its slide');
console.log('  the shutter: ' + (BLUR ? SUB + ' subframes' + (BLUR_ARG ? ' because --blur=' + BLUR_ARG + ' said so' : ', solved') + ', ' + (FASTEST / SUB).toFixed(2) + ' css px between samples' : 'closed'));
console.log('\n  the sound');
console.log('    the voice: ' + TAKES.reduce((a, t) => a + t.sentences, 0) + ' edge takes at ' + RATE + ' assembled into five lines with ' + BREAK_MS + 'ms at every stop, on the clip\'s clock, and nothing else on the bus');
console.log('    the lift: off the voice at ' + (zero.lufs == null ? '?' : zero.lufs) + ' LUFS, took ' + best.lift.toFixed(2) + ' dB in ' + tries + ' pass' + (tries === 1 ? '' : 'es'));
console.log('    the bus: ' + (after.lufs == null ? '?' : after.lufs) + ' LUFS, peak ' + peak.peak + ' dBFS, limiter took ' + (peak.reduction > 0.01 ? peak.reduction.toFixed(2) + ' dB' : 'nothing'));

if (VOICE_ONLY) process.exit(0);

const state = ONLY_ENCODE ? JSON.parse(fs.readFileSync(path.join(OUT, 'post31.json'), 'utf8')) : await render(plan);
const file = encode(WAV);
const p = probe(file);
const lu = loudness(ffmpeg, file);
console.log('\nrendered');
console.log('  ' + p.w + 'x' + p.h + ' @' + p.fps + 'fps  ' + p.seconds.toFixed(2) + 's  ' + (p.audio ? 'with sound' : 'SILENT') + '  '
  + (fs.statSync(file).size / 1e6).toFixed(2) + ' MB  ' + path.relative(ROOT, file));
console.log('  the shutter is ' + (BLUR ? 'open, ' + SUB + ' subframes to a frame' : 'closed'));
if (lu && lu.ok) console.log('  loudness ' + lu.lufs + ' LUFS integrated, true peak ' + lu.truePeak + ' dBFS, measured on the mp4');
console.log('  a still per beat in ' + path.relative(ROOT, VERIFY));
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
  if (!/you\. the boring tek\.$/.test(LINES[4].text)) fail.push('line five has lost the stop before the boring tek');
  for (let i = 0; i < BRIEF.length; i++) if (SC[i] < BRIEF[i] - 1e-6) fail.push('scene ' + (i + 1) + ' starts at ' + SC[i] + ', before the floor at ' + BRIEF[i]);
  /* no air: every scene after the first starts 0.30 after the line before it, except four, which may wait for his delighted */
  for (let i = 1; i < LINES.length; i++) {
    const gap = SC[i] - SOUND[i - 1].end;
    const allowed = i === 1 ? Math.max(AFTER_LINE, BRIEF[1] - SOUND[0].end) : i === 3 ? DELIGHT_ROOM : AFTER_LINE;
    if (gap > allowed + 0.02) fail.push('scene ' + (i + 1) + ' starts ' + gap.toFixed(2) + 's after line ' + i + ' ends, which is air');
  }
  if (SECONDS < 21 || SECONDS > 25) fail.push('the film is ' + SECONDS + 's, and the brief wants 22 to 24');
}

/* ---------- what is on the screen ----------
   no dashes, colons, parentheses, apostrophes or quotes anywhere a viewer
   reads; no dot on a caption. */
{
  const screen = [['the sheet labels', SHEET.labels.join(' ')], ['the counter', COUNTER.word], ['the tiles', BENTO.names.join(' ')], ['the mark', LOGO.text], ['the number label', NUM.label],
    ['the page title', PAGE.title], ['the page rows', PAGE.rows.map(r => r.label + ' ' + (r.value || '')).join(' ')], ['the to do lines', PAGE.rows[3].lines.join(' ')],
    ['the wordmark', WM.lines.join(' ')], ['the line under him', LINE5.text], ['the address', ADDR.text], ...SUBTITLES.map((c, i) => ['subtitle ' + (i + 1), c.lines.join(' ')])];
  for (const [what, s] of screen) {
    if (/[-—–:()'"“”‘’]/.test(s)) fail.push(what + ' carries a dash, a colon, a bracket, an apostrophe or a quote: "' + s + '"');
    if (what !== 'the address' && /\./.test(s)) fail.push(what + ' has a dot in it: "' + s + '"');
  }
  if (SHEET.labels.length !== SHEET.n || SHEET.n !== 8) fail.push('there are ' + SHEET.labels.length + ' sheets, not eight');
  if (BENTO.names.length !== 5 || BENTO.tiles.length !== 5) fail.push('there are ' + BENTO.names.length + ' tiles, not five');
  if (!/^[a-z ]+$/.test(BENTO.names.join(' '))) fail.push('a tile is not a plain lowercase name');
  if (NUM.value !== 43) fail.push('the number is ' + NUM.value);
  if (PAGE.rows.length !== 4 || PAGE.rows[3].lines.length !== 3) fail.push('the page is not four rows with three to do lines');
}

/* ---------- the states are calm or happy, and nothing else is drawn ---------- */
{
  for (const m of plan.marks) if (!['neutral', 'delighted'].includes(m.state)) fail.push('mark ' + m.i + ' is ' + m.state + ', and only calm or happy eyes are allowed');
  if (plan.marks.some(m => m.hands || m.bubble || m.bubbles)) fail.push('a mark asks for hands or a bubble, and this clip has neither');
  if (MODULE_CUES.length) fail.push('the module offers ' + MODULE_CUES.length + ' cue(s) this clip did not expect');
  if (DELIGHT2.at < IN.at + SPRING.for) fail.push('the second delighted starts before he has landed');
  if (DELIGHT1.at < PAGE.rows[3].at) fail.push('he is delighted at ' + DELIGHT1.at + ', before the to do row lands at ' + PAGE.rows[3].at);
  if (DELIGHT1.at + 1.10 > IN.at + 1e-6) fail.push('the first delighted has no room before the spring');
  if (BENTO.tiles.filter(t => t.said).length !== 4 || BENTO.tiles[4].said) fail.push('the read names ' + BENTO.tiles.filter(t => t.said).length + ' tiles; four are said and zoom is shown');
  /* small in the corners, then the house size */
  const c1 = compose(plan, 1.0).card, c2 = compose(plan, SC[2] + 1.5).card, mid = compose(plan, SECONDS - 0.5).card;
  if (Math.abs(c1.sx / mascotFrame(plan, 1.0).card.sx - SMALL.s) > 1e-3) fail.push('he is not at ' + SMALL.s + ' of the house size on the card');
  if (Math.abs(c2.sx / mascotFrame(plan, SC[2] + 1.5).card.sx - SMALL.s) > 1e-3) fail.push('he is not at ' + SMALL.s + ' of the house size on the laptop');
  if (Math.abs(mid.sx / mascotFrame(plan, SECONDS - 0.5).card.sx - 1) > 1e-3) fail.push('he is not at the house size in the middle');
  if (plan.bias !== TURN_TO_LEFT || plan.marks[2].turn !== 0) fail.push('he does not rest turned to the pile and turn to the lens on the spring');
  /* his corners: inside the card, and on the laptop's corner */
  const cr = headRect(plan, compose(plan, 0.5));
  const cardRight = (CARD.left + CARD.w) * DSF, cardBottom = (CARD.top + CARD.h) * DSF;
  if (VW * DSF - cr.right > cardRight || VH * DSF - cr.bottom > cardBottom) fail.push('he sticks out of the card\'s corner');
  const pileRight = (CARD.left + SHEET.x0 + (SHEET.n - 1) * SHEET.dx + SHEET.w + 12) * DSF;
  if (cr.left < pileRight) fail.push('he sits on the pile');
  const home = compose(plan, SECONDS - 0.05).card, mod = mascotFrame(plan, SECONDS - 0.05).card;
  if (Math.abs(home.y - mod.y) > 1e-6 || Math.abs(home.x - mod.x) > 1e-6) fail.push('he is not home on the last frame');
}

/* ---------- everything clears the safe area, the house one and the brief's ---------- */
{
  const M = state.measured;
  const floor = BRIEF_SAFE;
  const inside = (what, b) => {
    if (b.left < SAFE.left || b.right < SAFE.right || b.top < SAFE.top || b.bottom < SAFE.bottom) fail.push(what + ' is inside the house safe area: ' + b.left + ' / ' + b.top + ' / ' + b.right + ' / ' + b.bottom);
    if (b.left < floor || b.right < floor || b.top < floor || b.bottom < floor) fail.push(what + ' is inside the brief\'s 120px margin');
  };
  inside('the card', M.card);
  for (const [i, b] of M.tiles.entries()) {
    inside('the ' + BENTO.names[i] + ' tile', b);
    if (b.textPx > BENTO.w * DSF - 16) fail.push('the ' + BENTO.names[i] + ' tile\'s name is ' + b.textPx + ' device px, too wide for its tile');
    if (!/Michroma/.test(b.font)) fail.push('the ' + BENTO.names[i] + ' tile is not in Michroma: ' + b.font);
  }
  inside('the mark', M.mark);
  if (MARK && Math.abs(MARK.inkH - LOGO.ink) > 0.01) fail.push('the mark\'s ink is ' + MARK.inkH + ' css px tall, not ' + LOGO.ink);
  if (MARK && M.mark.w < 1) fail.push('the mark has no box');
  /* the mark sits in the middle slot, clear of every tile */
  for (const [i, tl] of BENTO.tiles.entries()) {
    const mx0 = MID.cx - (MARK ? MARK.inkW / 2 : BENTO.w / 2), mx1 = MID.cx + (MARK ? MARK.inkW / 2 : BENTO.w / 2), my0 = MID.cy - LOGO.ink / 2, my1 = MID.cy + LOGO.ink / 2;
    if (!(mx1 < tl.x || mx0 > tl.x + BENTO.w || my1 < tl.y || my0 > tl.y + BENTO.h)) fail.push('the mark overlaps the ' + BENTO.names[i] + ' tile');
  }
  inside('the number', M.num);
  inside('the number label', M.numlab);
  if (!/Michroma/.test(M.num.font)) fail.push('the number is not in Michroma: ' + M.num.font);
  if (!/monospace|Mono|Menlo|Consolas/i.test(M.numlab.font)) fail.push('the number label is not mono: ' + M.numlab.font);
  if (!/monospace|Mono|Menlo|Consolas/i.test(M.cnt.font)) fail.push('the counter is not mono: ' + M.cnt.font);
  for (const [i, s] of M.sheets.entries()) if (!/monospace|Mono|Menlo|Consolas/i.test(s.font)) fail.push('sheet ' + (i + 1) + '\'s label is not mono: ' + s.font);
  /* the bento sits above the number, the number above the card */
  const bentoBottom = BENTO.top + 2 * BENTO.h + BENTO.gap;
  if (bentoBottom > NUM.top - 8) fail.push('the bento reaches ' + bentoBottom + ' css px, onto the number at ' + NUM.top);
  if ((VH * DSF - M.numlab.bottom) / DSF > CARD.top - 8) fail.push('the number label reaches onto the card');
  inside('the laptop', M.lap);
  for (const [i, r] of M.rows.entries()) {
    if (r.left < M.screen.left || r.right < M.screen.right || r.top < M.screen.top || r.bottom < M.screen.bottom) fail.push('row ' + (i + 1) + ' is outside the screen');
    if (!/Nunito/.test(r.font)) fail.push('row ' + (i + 1) + ' is not in nunito: ' + r.font);
  }
  for (const [i, r] of M.todos.entries()) if (r.left < M.screen.left || r.right < M.screen.right || r.top < M.screen.top || r.bottom < M.screen.bottom) fail.push('to do line ' + (i + 1) + ' is outside the screen');
  if (M.chart.left < M.screen.left || M.chart.right < M.screen.right || M.chart.top < M.screen.top || M.chart.bottom < M.screen.bottom) fail.push('the chart is outside the screen');
  /* the chart shares its row with the label and must not sit on it */
  if (M.chart.left < M.rows[1].left + M.rows[1].w / 2) fail.push('the chart reaches onto the sales label');
  inside('the wordmark', M.wm);
  inside('the line under him', M.line5);
  inside('the address', M.addr);
  if (!/Michroma/.test(M.wm.font)) fail.push('the wordmark is not in Michroma: ' + M.wm.font);
  if (M.wm.capPx < WM.minCapPx) fail.push('the wordmark caps are ' + M.wm.capPx + ' device px, under ' + WM.minCapPx);
  if (!/Nunito/.test(M.line5.font)) fail.push('the line under him is not in nunito: ' + M.line5.font);
  /* the line sits under the wordmark and the address under the line, measured */
  const wmBottom = VH - M.wm.bottom / DSF, l5Top = M.line5.top / DSF, l5Bottom = VH - M.line5.bottom / DSF, adTop = M.addr.top / DSF;
  if (l5Top < wmBottom + 6) fail.push('the line under him starts at ' + l5Top.toFixed(0) + ' css px, on the wordmark which ends at ' + wmBottom.toFixed(0));
  if (adTop < l5Bottom + 6) fail.push('the address starts at ' + adTop.toFixed(0) + ' css px, on the line which ends at ' + l5Bottom.toFixed(0));
  /* the head at home clears the wordmark and the card */
  const hr = headRect(plan, compose(plan, SECONDS - 0.5));
  if ((VH * DSF - hr.bottom) / DSF > WM.top - 6) fail.push('his head reaches onto the wordmark');
  const hr4 = headRect(plan, compose(plan, CHECK.at + 0.2));
  if ((VH * DSF - hr4.bottom) / DSF > CARD.top - 6) fail.push('his head reaches onto the returned card');
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
  if (ST.top < CARD.top + CARD.h + 8) fail.push('the subtitle slot is on the card');
  if (ST.top < LAP.bottom + 8) fail.push('the subtitle slot is on the laptop');
  if (ST.top < ADDR.top + ADDR.size * 1.3 + 8) fail.push('the subtitle slot is on the address');
  for (let i = 0; i < LINES.length; i++) if (!CARDS.some(c => c.line === i)) fail.push('line ' + (i + 1) + ' has no subtitle');
  /* he never reaches the subtitle slot, small on a corner or home */
  {
    let lowest = 0;
    for (let f = 0; f < Math.ceil(SECONDS * 60); f++) { const r = headRect(plan, compose(plan, f / 60)); lowest = Math.max(lowest, VH * DSF - r.bottom); }
    if (lowest / DSF > ST.top - 4) fail.push('he reaches ' + (lowest / DSF).toFixed(0) + ' css px, onto the subtitle slot at ' + ST.top);
  }
  if (state.head && state.head.near < Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom)) fail.push('the head comes within ' + state.head.near + ' device px of a border at ' + state.head.t + 's');
  /* the pile stays inside the card */
  for (let i = 0; i < SHEET.n; i++) {
    const x = SHEET.x0 + i * SHEET.dx, y = SHEET.y0 + i * SHEET.dy;
    if (x < 6 || y < 6 || x + SHEET.w > CARD.w - 6 || y + SHEET.h > CARD.h - 6) fail.push('sheet ' + (i + 1) + ' leaves the card');
  }
  if (SHEETS_DONE > SC[1] - 0.10) fail.push('the pile is still growing at ' + SHEETS_DONE + ', into scene two at ' + SC[1]);
  /* the timing of two, three and four holds together */
  if (NUM.at + NUM.for > SC[2]) fail.push('the number is still counting at ' + (NUM.at + NUM.for).toFixed(2) + ', into scene three at ' + SC[2]);
  if (BENTO.tiles.some(tl => tl.at < LOGO.at)) fail.push('a tile pops before the mark');
  if (PAGE_FULL > SC[3] - 0.10) fail.push('the page is still filling at ' + PAGE_FULL + ', into scene four at ' + SC[3]);
  if (CHECK.at + CHECK.for > SC[4] - 0.10) fail.push('the check is still drawing at ' + (CHECK.at + CHECK.for).toFixed(2) + ', into scene five at ' + SC[4]);
  if (CARD_IN.at < LAP_OUT.at) fail.push('the card returns before the laptop starts leaving');
}

/* ---------- no colour but the house's: the accent on the check and the chart line, the red on the count ---------- */
{
  const mine = sceneHtml(plan).split('==== this clip\'s own css starts here ====')[1];
  const accents = (mine.match(/var\(--accent\)/g) || []).length;
  /* the check's stroke, and the chart module's line, ring and gradient stops */
  if (accents < 2 || accents > 8) fail.push('the accent is painted in ' + accents + ' places, which is not the check and the chart');
  if ((mine.match(/var\(--red\)/g) || []).length !== 1) fail.push('the red is painted somewhere other than the overdue count');
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
console.log('    the mark is ' + (MARK ? 'the png on disk, ink solved to ' + LOGO.ink + ' css px' : 'a text tile, because there is no png on disk'));
console.log('    the glow is the module\'s own two layers, not pushed');

if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
console.log('\nall checks passed.');
